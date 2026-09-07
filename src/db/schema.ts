import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  basePrice: real("base_price").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// A modifier group is a set of choices attached to a product, e.g.
// "Syrup", "Sugar", "Size", "Milk". selectionType controls the UI:
// "single" = radio buttons, "multiple" = checkboxes.
export const modifierGroups = sqliteTable("modifier_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  selectionType: text("selection_type", { enum: ["single", "multiple"] })
    .notNull()
    .default("single"),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  maxSelect: integer("max_select"),
});

export const modifierOptions = sqliteTable("modifier_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => modifierGroups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceDelta: real("price_delta").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

// Which modifier groups apply to which product (many-to-many).
export const productModifierGroups = sqliteTable("product_modifier_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  groupId: integer("group_id")
    .notNull()
    .references(() => modifierGroups.id, { onDelete: "cascade" }),
});

// Named ingredients, reusable across products, e.g. "Cheese", "Bacon",
// "Lettuce". Used for food items where staff can remove defaults or add extras.
export const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  extraPrice: real("extra_price").notNull().default(0),
});

// Which ingredients belong to a product by default, and whether they can be
// removed. Ingredients not linked here can still be added as "extra" at order time.
export const productIngredients = sqliteTable("product_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(true),
  removable: integer("removable", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull(),
  status: text("status", { enum: ["open", "paid", "cancelled"] })
    .notNull()
    .default("open"),
  subtotal: real("subtotal").notNull().default(0),
  total: real("total").notNull().default(0),
  paymentMethod: text("payment_method"),
  cardTransactionId: text("card_transaction_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  printedAt: text("printed_at"),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  note: text("note"),
});

// A selected modifier option for a specific order item, snapshotted so
// later edits to the menu don't change historical orders.
export const orderItemModifiers = sqliteTable("order_item_modifiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderItemId: integer("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  groupName: text("group_name").notNull(),
  optionName: text("option_name").notNull(),
  priceDelta: real("price_delta").notNull().default(0),
});

// An ingredient change (removed default, or added extra) for a specific order item.
export const orderItemIngredients = sqliteTable("order_item_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderItemId: integer("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  ingredientName: text("ingredient_name").notNull(),
  action: text("action", { enum: ["removed", "added"] }).notNull(),
  priceDelta: real("price_delta").notNull().default(0),
});
