import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "./client";
import { parseSqliteUtcDate } from "@/lib/date";
import {
  categories,
  products,
  modifierGroups,
  modifierOptions,
  productModifierGroups,
  ingredients,
  productIngredients,
  orders,
  orderItems,
  orderItemModifiers,
  orderItemIngredients,
  locations,
  refunds,
  refundItems,
} from "./schema";

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getLocations() {
  return db.select().from(locations).orderBy(locations.name);
}

export async function getLocation(id: number) {
  const [location] = await db.select().from(locations).where(eq(locations.id, id));
  return location ?? null;
}

export async function getActiveProducts() {
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.sortOrder);
}

export type ModifierGroupWithOptions = {
  id: number;
  name: string;
  selectionType: "single" | "multiple";
  required: boolean;
  maxSelect: number | null;
  options: { id: number; name: string; priceDelta: number; isDefault: boolean }[];
};

export type ProductIngredient = {
  id: number;
  name: string;
  isDefault: boolean;
  removable: boolean;
  extraPrice: number;
};

export type ProductDetail = {
  id: number;
  name: string;
  basePrice: number;
  modifierGroups: ModifierGroupWithOptions[];
  ingredients: ProductIngredient[];
};

export async function getProductDetail(productId: number): Promise<ProductDetail | null> {
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return null;

  const linkedGroups = await db
    .select({
      groupId: modifierGroups.id,
      name: modifierGroups.name,
      selectionType: modifierGroups.selectionType,
      required: modifierGroups.required,
      maxSelect: modifierGroups.maxSelect,
    })
    .from(productModifierGroups)
    .innerJoin(modifierGroups, eq(productModifierGroups.groupId, modifierGroups.id))
    .where(eq(productModifierGroups.productId, productId));

  const groupsWithOptions: ModifierGroupWithOptions[] = [];
  for (const group of linkedGroups) {
    const options = await db
      .select({
        id: modifierOptions.id,
        name: modifierOptions.name,
        priceDelta: modifierOptions.priceDelta,
        isDefault: modifierOptions.isDefault,
      })
      .from(modifierOptions)
      .where(eq(modifierOptions.groupId, group.groupId))
      .orderBy(modifierOptions.sortOrder);
    groupsWithOptions.push({
      id: group.groupId,
      name: group.name,
      selectionType: group.selectionType,
      required: group.required,
      maxSelect: group.maxSelect,
      options,
    });
  }

  const productIngredientRows = await db
    .select({
      id: ingredients.id,
      name: ingredients.name,
      extraPrice: ingredients.extraPrice,
      isDefault: productIngredients.isDefault,
      removable: productIngredients.removable,
    })
    .from(productIngredients)
    .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
    .where(eq(productIngredients.productId, productId));

  return {
    id: product.id,
    name: product.name,
    basePrice: product.basePrice,
    modifierGroups: groupsWithOptions,
    ingredients: productIngredientRows,
  };
}

export async function getAllIngredients() {
  return db.select().from(ingredients).orderBy(ingredients.name);
}

export async function getAllModifierGroups() {
  return db.select().from(modifierGroups);
}

export async function getAllModifierGroupsWithOptions() {
  const groups = await db.select().from(modifierGroups);
  const result = [];
  for (const group of groups) {
    const options = await db
      .select()
      .from(modifierOptions)
      .where(eq(modifierOptions.groupId, group.id))
      .orderBy(modifierOptions.sortOrder);
    result.push({ ...group, options });
  }
  return result;
}

export async function getModifierGroupWithOptions(groupId: number) {
  const [group] = await db.select().from(modifierGroups).where(eq(modifierGroups.id, groupId));
  if (!group) return null;
  const options = await db
    .select()
    .from(modifierOptions)
    .where(eq(modifierOptions.groupId, groupId))
    .orderBy(modifierOptions.sortOrder);
  return { ...group, options };
}

export async function getOrderForReceipt(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  const itemsWithDetails = [];
  for (const item of items) {
    const modifiers = await db
      .select()
      .from(orderItemModifiers)
      .where(eq(orderItemModifiers.orderItemId, item.id));
    const ingredientChanges = await db
      .select()
      .from(orderItemIngredients)
      .where(eq(orderItemIngredients.orderItemId, item.id));
    itemsWithDetails.push({ ...item, modifiers, ingredientChanges });
  }

  return { order, items: itemsWithDetails };
}

export async function getOpenOrders() {
  const openOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.status, "open"))
    .orderBy(orders.createdAt);

  const result = [];
  for (const order of openOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const itemsWithDetails = [];
    for (const item of items) {
      const modifiers = await db
        .select()
        .from(orderItemModifiers)
        .where(eq(orderItemModifiers.orderItemId, item.id));
      const ingredientChanges = await db
        .select()
        .from(orderItemIngredients)
        .where(eq(orderItemIngredients.orderItemId, item.id));
      itemsWithDetails.push({ ...item, modifiers, ingredientChanges });
    }
    result.push({ ...order, items: itemsWithDetails });
  }
  return result;
}

// Paid (and already-refunded/cancelled) orders from today, for the cassa's
// "Сегодня" tab where a cashier can issue a refund on a specific item —
// unlike getOpenOrders() this never needs orders older than today, so a
// generous UTC lower bound plus a JS-side filter to the real Chisinau
// calendar day (same approach as getAnalytics) is enough, no need for a
// dedicated date-range query.
export async function getTodayOrders() {
  const sqlLowerBound = new Date(Date.now() - 2 * 86400000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const todayKey = chisinauDateKey(new Date());

  const rows = await db
    .select()
    .from(orders)
    .where(and(sql`${orders.status} in ('paid', 'cancelled')`, gte(orders.createdAt, sqlLowerBound)))
    .orderBy(desc(orders.createdAt));

  const todaysOrders = rows.filter((o) => chisinauDateKey(parseSqliteUtcDate(o.createdAt)) === todayKey);

  const result = [];
  for (const order of todaysOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const itemsWithDetails = [];
    for (const item of items) {
      const modifiers = await db
        .select()
        .from(orderItemModifiers)
        .where(eq(orderItemModifiers.orderItemId, item.id));
      const ingredientChanges = await db
        .select()
        .from(orderItemIngredients)
        .where(eq(orderItemIngredients.orderItemId, item.id));
      itemsWithDetails.push({ ...item, modifiers, ingredientChanges });
    }
    result.push({ ...order, items: itemsWithDetails });
  }
  return result;
}

// Audit trail for /admin/refunds — every refund event (who got what back
// and why), not just the running refundedAmount total on orders used for
// revenue math elsewhere.
export async function getRefunds(limit = 200) {
  const rows = await db
    .select({
      id: refunds.id,
      orderId: refunds.orderId,
      orderNumber: orders.number,
      locationId: orders.locationId,
      amount: refunds.amount,
      reason: refunds.reason,
      createdAt: refunds.createdAt,
    })
    .from(refunds)
    .innerJoin(orders, eq(refunds.orderId, orders.id))
    .orderBy(desc(refunds.createdAt))
    .limit(limit);

  const allLocations = await getLocations();
  const locationNames = new Map(allLocations.map((l) => [l.id, l.name]));

  const result = [];
  for (const r of rows) {
    const items = await db
      .select({
        quantity: refundItems.quantity,
        amount: refundItems.amount,
        name: orderItems.name,
      })
      .from(refundItems)
      .innerJoin(orderItems, eq(refundItems.orderItemId, orderItems.id))
      .where(eq(refundItems.refundId, r.id));
    result.push({
      ...r,
      locationName: r.locationId ? (locationNames.get(r.locationId) ?? `Точка #${r.locationId}`) : "Без точки",
      items,
    });
  }
  return result;
}

export async function getTodayStats() {
  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(sql`date(${orders.createdAt}) = date('now')`);
  return row ?? { count: 0, total: 0 };
}

const CHISINAU_TZ = "Europe/Chisinau";

// Formats a real Date as its Chisinau calendar date, "YYYY-MM-DD" — used both
// for grouping (daily revenue) and as a lexicographically-comparable range key.
function chisinauDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHISINAU_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Chisinau local hour (0-23) for peak-hours bucketing.
function chisinauHour(date: Date): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: CHISINAU_TZ,
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number(hour) % 24;
}

export type AnalyticsRange = "today" | "7d" | "30d" | "month";

// Calendar-date arithmetic done on a "fake UTC" Date (Y/M/D from the
// Chisinau wall clock, wrapped in Date.UTC) so day subtraction doesn't need
// to know the real UTC offset or DST rules — only string comparison of the
// resulting keys against chisinauDateKey() output matters.
function rangeToKeys(range: AnalyticsRange): { fromKey: string; toKey: string; daySpan: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHISINAU_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const y = Number(map.year);
  const m = Number(map.month);
  const d = Number(map.day);
  const todayUtc = Date.UTC(y, m - 1, d);
  const toKey = new Date(todayUtc).toISOString().slice(0, 10);

  if (range === "today") return { fromKey: toKey, toKey, daySpan: 1 };
  if (range === "7d") {
    const fromKey = new Date(todayUtc - 6 * 86400000).toISOString().slice(0, 10);
    return { fromKey, toKey, daySpan: 7 };
  }
  if (range === "30d") {
    const fromKey = new Date(todayUtc - 29 * 86400000).toISOString().slice(0, 10);
    return { fromKey, toKey, daySpan: 30 };
  }
  // month-to-date
  const fromKey = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
  return { fromKey, toKey, daySpan: d };
}

export type AnalyticsData = {
  fromKey: string;
  toKey: string;
  totalRevenue: number;
  orderCount: number;
  avgCheck: number;
  cashRevenue: number;
  cardRevenue: number;
  dailyRevenue: { date: string; revenue: number }[];
  hourlyRevenue: { hour: number; revenue: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  locationBreakdown: { locationId: number | null; name: string; revenue: number; orderCount: number }[];
};

export async function getAnalytics(range: AnalyticsRange, locationId?: number): Promise<AnalyticsData> {
  const { fromKey, toKey, daySpan } = rangeToKeys(range);

  // Generous UTC lower bound for the SQL fetch — exact filtering to the
  // Chisinau calendar range happens below with chisinauDateKey(), since
  // SQLite has no timezone-aware date functions here.
  const sqlLowerBound = new Date(Date.now() - (daySpan + 2) * 86400000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const orderRows = await db
    .select({
      id: orders.id,
      total: orders.total,
      refundedAmount: orders.refundedAmount,
      paymentMethod: orders.paymentMethod,
      createdAt: orders.createdAt,
      locationId: orders.locationId,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "paid"),
        gte(orders.createdAt, sqlLowerBound),
        locationId ? eq(orders.locationId, locationId) : undefined
      )
    );

  const inRange = orderRows.filter((o) => {
    const key = chisinauDateKey(parseSqliteUtcDate(o.createdAt));
    return key >= fromKey && key <= toKey;
  });

  let totalRevenue = 0;
  let cashRevenue = 0;
  let cardRevenue = 0;
  const dailyMap = new Map<string, number>();
  const hourlyMap = new Map<number, { revenue: number; count: number }>();
  const locationMap = new Map<number | null, { revenue: number; orderCount: number }>();

  for (const order of inRange) {
    // Net of any partial refund — a fully-refunded order already dropped
    // out of this "paid"-only query entirely (see the refund API route).
    const netAmount = order.total - order.refundedAmount;
    totalRevenue += netAmount;
    if (order.paymentMethod === "card") cardRevenue += netAmount;
    else cashRevenue += netAmount;

    const date = parseSqliteUtcDate(order.createdAt);
    const dayKey = chisinauDateKey(date);
    dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + netAmount);

    const hour = chisinauHour(date);
    const hourEntry = hourlyMap.get(hour) ?? { revenue: 0, count: 0 };
    hourEntry.revenue += netAmount;
    hourEntry.count += 1;
    hourlyMap.set(hour, hourEntry);

    const locEntry = locationMap.get(order.locationId) ?? { revenue: 0, orderCount: 0 };
    locEntry.revenue += netAmount;
    locEntry.orderCount += 1;
    locationMap.set(order.locationId, locEntry);
  }

  const dailyRevenue: { date: string; revenue: number }[] = [];
  for (let i = 0; i < daySpan; i++) {
    const key = new Date(new Date(fromKey + "T00:00:00Z").getTime() + i * 86400000)
      .toISOString()
      .slice(0, 10);
    if (key > toKey) break;
    dailyRevenue.push({ date: key, revenue: dailyMap.get(key) ?? 0 });
  }

  const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    revenue: hourlyMap.get(hour)?.revenue ?? 0,
    count: hourlyMap.get(hour)?.count ?? 0,
  }));

  const orderIds = inRange.map((o) => o.id);
  let topProducts: { name: string; quantity: number; revenue: number }[] = [];
  if (orderIds.length > 0) {
    // (quantity - refundedQuantity) throughout — a refunded croissant
    // shouldn't still count toward "top products" or its revenue.
    const rows = await db
      .select({
        name: orderItems.name,
        quantity: sql<number>`sum(${orderItems.quantity} - ${orderItems.refundedQuantity})`,
        revenue: sql<number>`sum(${orderItems.unitPrice} * (${orderItems.quantity} - ${orderItems.refundedQuantity}))`,
      })
      .from(orderItems)
      .where(sql`${orderItems.orderId} in (${sql.join(orderIds, sql`, `)})`)
      .groupBy(orderItems.name)
      .orderBy(sql`sum(${orderItems.unitPrice} * (${orderItems.quantity} - ${orderItems.refundedQuantity})) desc`)
      .limit(10);
    topProducts = rows;
  }

  const allLocations = await getLocations();
  const locationNames = new Map(allLocations.map((l) => [l.id, l.name]));
  const locationBreakdown = Array.from(locationMap.entries())
    .map(([locId, entry]) => ({
      locationId: locId,
      name: locId === null ? "Без точки" : (locationNames.get(locId) ?? `Точка #${locId}`),
      revenue: entry.revenue,
      orderCount: entry.orderCount,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    fromKey,
    toKey,
    totalRevenue,
    orderCount: inRange.length,
    avgCheck: inRange.length > 0 ? totalRevenue / inRange.length : 0,
    cashRevenue,
    cardRevenue,
    dailyRevenue,
    hourlyRevenue,
    topProducts,
    locationBreakdown,
  };
}

export async function getDashboardCounts() {
  const [[{ count: productCount }], [{ count: categoryCount }], [{ count: ingredientCount }], [{ count: modifierGroupCount }]] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(products),
      db.select({ count: sql<number>`count(*)` }).from(categories),
      db.select({ count: sql<number>`count(*)` }).from(ingredients),
      db.select({ count: sql<number>`count(*)` }).from(modifierGroups),
    ]);
  return { productCount, categoryCount, ingredientCount, modifierGroupCount };
}
