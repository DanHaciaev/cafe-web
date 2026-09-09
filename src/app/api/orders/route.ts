import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { orders, orderItems, orderItemModifiers, orderItemIngredients } from "@/db/schema";

const cartItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  modifiers: z.array(
    z.object({
      groupName: z.string(),
      optionName: z.string(),
      priceDelta: z.number(),
    })
  ),
  ingredientChanges: z.array(
    z.object({
      ingredientName: z.string(),
      action: z.enum(["removed", "added"]),
      priceDelta: z.number(),
    })
  ),
});

const orderSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  paymentMethod: z.string().optional(),
  cardTransactionId: z.string().optional(),
  hold: z.boolean().optional(),
  locationId: z.number().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { items, paymentMethod, cardTransactionId, hold, locationId } = parsed.data;

  const total = items.reduce((sum, item) => {
    const modifiersTotal = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
    const ingredientsTotal = item.ingredientChanges.reduce((s, i) => s + i.priceDelta, 0);
    return sum + (item.unitPrice + modifiersTotal + ingredientsTotal) * item.quantity;
  }, 0);

  const [{ maxNumber }] = await db
    .select({ maxNumber: sql<number>`coalesce(max(${orders.number}), 0)` })
    .from(orders);
  const nextNumber = maxNumber + 1;

  const [order] = await db
    .insert(orders)
    .values({
      number: nextNumber,
      locationId,
      status: hold ? "open" : "paid",
      subtotal: total,
      total,
      paymentMethod: hold ? undefined : paymentMethod,
      cardTransactionId: hold ? undefined : cardTransactionId,
    })
    .returning();

  for (const item of items) {
    const [orderItem] = await db
      .insert(orderItems)
      .values({
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        note: item.note,
      })
      .returning();

    if (item.modifiers.length > 0) {
      await db.insert(orderItemModifiers).values(
        item.modifiers.map((m) => ({
          orderItemId: orderItem.id,
          groupName: m.groupName,
          optionName: m.optionName,
          priceDelta: m.priceDelta,
        }))
      );
    }

    if (item.ingredientChanges.length > 0) {
      await db.insert(orderItemIngredients).values(
        item.ingredientChanges.map((c) => ({
          orderItemId: orderItem.id,
          ingredientName: c.ingredientName,
          action: c.action,
          priceDelta: c.priceDelta,
        }))
      );
    }
  }

  return NextResponse.json(order, { status: 201 });
}
