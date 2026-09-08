import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { orders } from "@/db/schema";

const paySchema = z.object({
  paymentMethod: z.string(),
  cardTransactionId: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = paySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [existing] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!existing || existing.status !== "open") {
    return NextResponse.json({ error: "Order not found or already paid" }, { status: 404 });
  }

  const [order] = await db
    .update(orders)
    .set({
      status: "paid",
      paymentMethod: parsed.data.paymentMethod,
      cardTransactionId: parsed.data.cardTransactionId,
    })
    .where(eq(orders.id, orderId))
    .returning();

  return NextResponse.json(order);
}
