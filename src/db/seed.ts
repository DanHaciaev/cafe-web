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
      { name: "Горячие напитки", slug: "hot-drinks", sortOrder: 1 },
      { name: "Холодные напитки", slug: "cold-drinks", sortOrder: 2 },
      { name: "Выпечка", slug: "bakery", sortOrder: 3 },
      { name: "Коктейли", slug: "cocktail", sortOrder: 4 },
      { name: "Мерч", slug: "merchandise", sortOrder: 5 },
      { name: "Подарочные карты", slug: "gift-cards", sortOrder: 6 },
    ])
    .returning();

  // --- Modifier groups shared by coffee drinks ----------------------------
  const [sizeGroup, milkGroup, sugarGroup, syrupGroup] = await db
    .insert(modifierGroups)
    .values([
      { name: "Размер", selectionType: "single", required: true },
      { name: "Молоко", selectionType: "single", required: false },
      { name: "Сахар", selectionType: "single", required: false },
      { name: "Сироп", selectionType: "multiple", required: false, maxSelect: 3 },
    ])
    .returning();

  await db.insert(modifierOptions).values([
    // Size
    { groupId: sizeGroup.id, name: "Маленький", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: sizeGroup.id, name: "Средний", priceDelta: 0.5, sortOrder: 2 },
    { groupId: sizeGroup.id, name: "Большой", priceDelta: 1, sortOrder: 3 },
    // Milk
    { groupId: milkGroup.id, name: "Обычное молоко", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: milkGroup.id, name: "Овсяное молоко", priceDelta: 0.5, sortOrder: 2 },
    { groupId: milkGroup.id, name: "Миндальное молоко", priceDelta: 0.5, sortOrder: 3 },
    { groupId: milkGroup.id, name: "Обезжиренное молоко", priceDelta: 0, sortOrder: 4 },
    // Sugar
    { groupId: sugarGroup.id, name: "Без сахара", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: sugarGroup.id, name: "Обычный сахар", priceDelta: 0, sortOrder: 2 },
    { groupId: sugarGroup.id, name: "Больше сахара", priceDelta: 0, sortOrder: 3 },
    // Syrup
    { groupId: syrupGroup.id, name: "Ванильный сироп", priceDelta: 0.4, sortOrder: 1 },
    { groupId: syrupGroup.id, name: "Карамельный сироп", priceDelta: 0.4, sortOrder: 2 },
    { groupId: syrupGroup.id, name: "Ореховый сироп", priceDelta: 0.4, sortOrder: 3 },
    { groupId: syrupGroup.id, name: "Шоколадный сироп", priceDelta: 0.4, sortOrder: 4 },
  ]);

  // --- Drink products -------------------------------------------------------
  const drinkModifierGroupIds = [sizeGroup.id, milkGroup.id, sugarGroup.id, syrupGroup.id];

  const hotDrinks = await db
    .insert(products)
    .values([
      { categoryId: hot.id, name: "Мокко латте", basePrice: 3.5, sortOrder: 1, imageUrl: "/menu/mocha-latte.jpg" },
      { categoryId: hot.id, name: "Кофе латте", basePrice: 3.2, sortOrder: 2, imageUrl: "/menu/coffee-latte.jpg" },
      { categoryId: hot.id, name: "Эспрессо", basePrice: 2.2, sortOrder: 3, imageUrl: "/menu/espresso.jpg" },
      { categoryId: hot.id, name: "Чёрный кофе", basePrice: 2.0, sortOrder: 4, imageUrl: "/menu/original-black.jpg" },
      { categoryId: hot.id, name: "Мокачино", basePrice: 3.4, sortOrder: 5, imageUrl: "/menu/mochaccino.jpg" },
    ])
    .returning();

  const coldDrinks = await db
    .insert(products)
    .values([
      { categoryId: cold.id, name: "Фраппе", basePrice: 3.8, sortOrder: 1, imageUrl: "/menu/frappe.jpg" },
      { categoryId: cold.id, name: "Милкшейк", basePrice: 3.6, sortOrder: 2, imageUrl: "/menu/milkshake.jpg" },
      { categoryId: cold.id, name: "Айс латте", basePrice: 3.3, sortOrder: 3, imageUrl: "/menu/iced-latte.jpg" },
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
      { name: "Хлеб", extraPrice: 0 },
      { name: "Сыр", extraPrice: 0 },
      { name: "Ветчина", extraPrice: 0 },
      { name: "Салат", extraPrice: 0 },
      { name: "Помидор", extraPrice: 0 },
      { name: "Бекон", extraPrice: 0.8 },
      { name: "Авокадо", extraPrice: 0.9 },
      { name: "Яичница", extraPrice: 0.6 },
    ])
    .returning();

  const [sandwich, croissant, muffin] = await db
    .insert(products)
    .values([
      { categoryId: bakery.id, name: "Сэндвич с ветчиной и сыром", basePrice: 4.5, sortOrder: 1, imageUrl: "/menu/sandwich.jpg" },
      { categoryId: bakery.id, name: "Круассан", basePrice: 2.5, sortOrder: 2, imageUrl: "/menu/croissant.jpg" },
      { categoryId: bakery.id, name: "Маффин с черникой", basePrice: 2.8, sortOrder: 3, imageUrl: "/menu/muffin.jpg" },
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
    { categoryId: cocktail.id, name: "Мохито безалкогольный", basePrice: 3.9, sortOrder: 1, imageUrl: "/menu/mojito.jpg" },
    { categoryId: cocktail.id, name: "Фруктовый пунш", basePrice: 3.7, sortOrder: 2, imageUrl: "/menu/fruit-punch.jpg" },
  ]);

  // --- Merchandise -------------------------------------------------------
  await db.insert(products).values([
    { categoryId: merch.id, name: "Фирменная кружка", basePrice: 8, sortOrder: 1, imageUrl: "/menu/mug.jpg" },
    { categoryId: merch.id, name: "Термостакан", basePrice: 15, sortOrder: 2, imageUrl: "/menu/tumbler.jpg" },
  ]);

  // --- Gift cards -------------------------------------------------------
  await db.insert(products).values([
    { categoryId: giftcards.id, name: "Подарочная карта $10", basePrice: 10, sortOrder: 1, imageUrl: "/menu/giftcard.jpg" },
    { categoryId: giftcards.id, name: "Подарочная карта $25", basePrice: 25, sortOrder: 2, imageUrl: "/menu/giftcard.jpg" },
    { categoryId: giftcards.id, name: "Подарочная карта $50", basePrice: 50, sortOrder: 3, imageUrl: "/menu/giftcard.jpg" },
  ]);

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
