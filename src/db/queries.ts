import { eq, sql } from "drizzle-orm";
import { db } from "./client";
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
} from "./schema";

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.sortOrder);
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
    result.push({ ...order, items });
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
