import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { orders, orderItems, orderItemModifiers, orderItemIngredients } from "@/db/schema";

const refundSchema = z.object({
  items: z.array(z.object({ orderItemId: z.number(), quantity: z.number().int().positive() })).min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "Order not found or not paid" }, { status: 404 });
  }

  let refundTotal = 0;
  for (const line of parsed.data.items) {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, line.orderItemId));
    if (!item || item.orderId !== orderId) {
      return NextResponse.json({ error: "Item not found in this order" }, { status: 400 });
    }
    const remaining = item.quantity - item.refundedQuantity;
    if (line.quantity > remaining) {
      return NextResponse.json(
        { error: `Нельзя вернуть больше, чем куплено: ${item.name}` },
        { status: 400 }
      );
    }

    const modifiers = await db
      .select()
      .from(orderItemModifiers)
      .where(eq(orderItemModifiers.orderItemId, item.id));
    const ingredientChanges = await db
      .select()
      .from(orderItemIngredients)
      .where(eq(orderItemIngredients.orderItemId, item.id));
    const modifiersTotal = modifiers.reduce((s, m) => s + m.priceDelta, 0);
    const ingredientsTotal = ingredientChanges.reduce((s, c) => s + c.priceDelta, 0);
    const unitPrice = item.unitPrice + modifiersTotal + ingredientsTotal;
    refundTotal += unitPrice * line.quantity;

    await db
      .update(orderItems)
      .set({ refundedQuantity: item.refundedQuantity + line.quantity })
      .where(eq(orderItems.id, item.id));
  }

  const refundedAmount = order.refundedAmount + refundTotal;
  // A fully-refunded order stops counting as a completed sale, same as one
  // that was never paid — reusing "cancelled" here instead of adding a
  // separate status keeps every revenue query (which already filters on
  // status = 'paid') correct with no extra casing.
  const fullyRefunded = refundedAmount >= order.total - 0.005;

  const [updated] = await db
    .update(orders)
    .set({ refundedAmount, status: fullyRefunded ? "cancelled" : order.status })
    .where(eq(orders.id, orderId))
    .returning();

  return NextResponse.json(updated);
}
