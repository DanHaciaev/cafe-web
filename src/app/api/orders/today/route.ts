import { NextResponse } from "next/server";
import { getTodayOrders } from "@/db/queries";

export async function GET() {
  const todayOrders = await getTodayOrders();
  return NextResponse.json(todayOrders);
}
