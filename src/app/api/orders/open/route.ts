import { NextResponse } from "next/server";
import { getOpenOrders } from "@/db/queries";

export async function GET() {
  const openOrders = await getOpenOrders();
  return NextResponse.json(openOrders);
}
