import { db } from "./client";
import {
  categories,
  products,
  modifierGroups,
  modifierOptions,
  productModifierGroups,
  ingredients,
  productIngredients,
} from "./schema";

async function seed() {
  console.log("Seeding database...");

  // --- Categories ---------------------------------------------------------
  const [hot, cold, bakery, cocktail, merch, giftcards] = await db
    .insert(categories)
    .values([
      { name: "Hot drinks", slug: "hot-drinks", sortOrder: 1 },
      { name: "Cold drinks", slug: "cold-drinks", sortOrder: 2 },
      { name: "Bakery", slug: "bakery", sortOrder: 3 },
      { name: "Cocktail", slug: "cocktail", sortOrder: 4 },
      { name: "Merchandise", slug: "merchandise", sortOrder: 5 },
      { name: "Gift cards", slug: "gift-cards", sortOrder: 6 },
    ])
    .returning();

  // --- Modifier groups shared by coffee drinks ----------------------------
  const [sizeGroup, milkGroup, sugarGroup, syrupGroup] = await db
    .insert(modifierGroups)
    .values([
      { name: "Size", selectionType: "single", required: true },
      { name: "Milk", selectionType: "single", required: false },
      { name: "Sugar", selectionType: "single", required: false },
      { name: "Syrup", selectionType: "multiple", required: false, maxSelect: 3 },
    ])
    .returning();

  await db.insert(modifierOptions).values([
    // Size
    { groupId: sizeGroup.id, name: "Small", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: sizeGroup.id, name: "Medium", priceDelta: 0.5, sortOrder: 2 },
    { groupId: sizeGroup.id, name: "Large", priceDelta: 1, sortOrder: 3 },
    // Milk
    { groupId: milkGroup.id, name: "Whole milk", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: milkGroup.id, name: "Oat milk", priceDelta: 0.5, sortOrder: 2 },
    { groupId: milkGroup.id, name: "Almond milk", priceDelta: 0.5, sortOrder: 3 },
    { groupId: milkGroup.id, name: "Skim milk", priceDelta: 0, sortOrder: 4 },
    // Sugar
    { groupId: sugarGroup.id, name: "No sugar", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: sugarGroup.id, name: "Normal sugar", priceDelta: 0, sortOrder: 2 },
    { groupId: sugarGroup.id, name: "Extra sugar", priceDelta: 0, sortOrder: 3 },
    // Syrup
    { groupId: syrupGroup.id, name: "Vanilla syrup", priceDelta: 0.4, sortOrder: 1 },
    { groupId: syrupGroup.id, name: "Caramel syrup", priceDelta: 0.4, sortOrder: 2 },
    { groupId: syrupGroup.id, name: "Hazelnut syrup", priceDelta: 0.4, sortOrder: 3 },
    { groupId: syrupGroup.id, name: "Chocolate syrup", priceDelta: 0.4, sortOrder: 4 },
  ]);

  // --- Drink products -------------------------------------------------------
  const drinkModifierGroupIds = [sizeGroup.id, milkGroup.id, sugarGroup.id, syrupGroup.id];

  const hotDrinks = await db
    .insert(products)
    .values([
      { categoryId: hot.id, name: "Mocha coffee latte", basePrice: 3.5, sortOrder: 1, imageUrl: "/menu/mocha-latte.jpg" },
      { categoryId: hot.id, name: "Coffee latte", basePrice: 3.2, sortOrder: 2, imageUrl: "/menu/coffee-latte.jpg" },
      { categoryId: hot.id, name: "Espresso", basePrice: 2.2, sortOrder: 3, imageUrl: "/menu/espresso.jpg" },
      { categoryId: hot.id, name: "Original black", basePrice: 2.0, sortOrder: 4, imageUrl: "/menu/original-black.jpg" },
      { categoryId: hot.id, name: "Mochaccino", basePrice: 3.4, sortOrder: 5, imageUrl: "/menu/mochaccino.jpg" },
    ])
    .returning();

  const coldDrinks = await db
    .insert(products)
    .values([
      { categoryId: cold.id, name: "Frappe", basePrice: 3.8, sortOrder: 1, imageUrl: "/menu/frappe.jpg" },
      { categoryId: cold.id, name: "Milkshake", basePrice: 3.6, sortOrder: 2, imageUrl: "/menu/milkshake.jpg" },
      { categoryId: cold.id, name: "Iced latte", basePrice: 3.3, sortOrder: 3, imageUrl: "/menu/iced-latte.jpg" },
    ])
    .returning();

  for (const product of [...hotDrinks, ...coldDrinks]) {
    await db.insert(productModifierGroups).values(
      drinkModifierGroupIds.map((groupId) => ({ productId: product.id, groupId }))
    );
  }

  // --- Bakery: ingredient-based customization -------------------------------
  const [bread, cheese, ham, lettuce, tomato, bacon, avocado, egg] = await db
    .insert(ingredients)
    .values([
      { name: "Bread", extraPrice: 0 },
      { name: "Cheese", extraPrice: 0 },
      { name: "Ham", extraPrice: 0 },
      { name: "Lettuce", extraPrice: 0 },
      { name: "Tomato", extraPrice: 0 },
      { name: "Bacon", extraPrice: 0.8 },
      { name: "Avocado", extraPrice: 0.9 },
      { name: "Fried egg", extraPrice: 0.6 },
    ])
    .returning();

  const [sandwich, croissant, muffin] = await db
    .insert(products)
    .values([
      { categoryId: bakery.id, name: "Ham & cheese sandwich", basePrice: 4.5, sortOrder: 1, imageUrl: "/menu/sandwich.jpg" },
      { categoryId: bakery.id, name: "Croissant", basePrice: 2.5, sortOrder: 2, imageUrl: "/menu/croissant.jpg" },
      { categoryId: bakery.id, name: "Blueberry muffin", basePrice: 2.8, sortOrder: 3, imageUrl: "/menu/muffin.jpg" },
    ])
    .returning();

  await db.insert(productIngredients).values([
    // Sandwich: defaults that can be removed, plus optional extras (not default)
    { productId: sandwich.id, ingredientId: bread.id, isDefault: true, removable: false },
    { productId: sandwich.id, ingredientId: cheese.id, isDefault: true, removable: true },
    { productId: sandwich.id, ingredientId: ham.id, isDefault: true, removable: true },
    { productId: sandwich.id, ingredientId: lettuce.id, isDefault: true, removable: true },
    { productId: sandwich.id, ingredientId: tomato.id, isDefault: true, removable: true },
    { productId: sandwich.id, ingredientId: bacon.id, isDefault: false, removable: true },
    { productId: sandwich.id, ingredientId: avocado.id, isDefault: false, removable: true },
    { productId: sandwich.id, ingredientId: egg.id, isDefault: false, removable: true },
    // Croissant: simple, only extras available
    { productId: croissant.id, ingredientId: cheese.id, isDefault: false, removable: true },
    { productId: croissant.id, ingredientId: ham.id, isDefault: false, removable: true },
    // Muffin: no ingredients customization needed, skip
  ]);

  // --- Cocktail (mocktails) --------------------------------------------------
  await db.insert(products).values([
    { categoryId: cocktail.id, name: "Virgin mojito", basePrice: 3.9, sortOrder: 1, imageUrl: "/menu/mojito.jpg" },
    { categoryId: cocktail.id, name: "Fruit punch", basePrice: 3.7, sortOrder: 2, imageUrl: "/menu/fruit-punch.jpg" },
  ]);

  // --- Merchandise -------------------------------------------------------
  await db.insert(products).values([
    { categoryId: merch.id, name: "Branded mug", basePrice: 8, sortOrder: 1, imageUrl: "/menu/mug.jpg" },
    { categoryId: merch.id, name: "Travel tumbler", basePrice: 15, sortOrder: 2, imageUrl: "/menu/tumbler.jpg" },
  ]);

  // --- Gift cards -------------------------------------------------------
  await db.insert(products).values([
    { categoryId: giftcards.id, name: "Gift card $10", basePrice: 10, sortOrder: 1, imageUrl: "/menu/giftcard.jpg" },
    { categoryId: giftcards.id, name: "Gift card $25", basePrice: 25, sortOrder: 2, imageUrl: "/menu/giftcard.jpg" },
    { categoryId: giftcards.id, name: "Gift card $50", basePrice: 50, sortOrder: 3, imageUrl: "/menu/giftcard.jpg" },
  ]);

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
