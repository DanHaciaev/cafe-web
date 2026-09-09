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
    { groupId: sizeGroup.id, name: "Средний", priceDelta: 8, sortOrder: 2 },
    { groupId: sizeGroup.id, name: "Большой", priceDelta: 15, sortOrder: 3 },
    // Milk
    { groupId: milkGroup.id, name: "Обычное молоко", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: milkGroup.id, name: "Овсяное молоко", priceDelta: 8, sortOrder: 2 },
    { groupId: milkGroup.id, name: "Миндальное молоко", priceDelta: 8, sortOrder: 3 },
    { groupId: milkGroup.id, name: "Обезжиренное молоко", priceDelta: 0, sortOrder: 4 },
    // Sugar
    { groupId: sugarGroup.id, name: "Без сахара", priceDelta: 0, sortOrder: 1, isDefault: true },
    { groupId: sugarGroup.id, name: "Обычный сахар", priceDelta: 0, sortOrder: 2 },
    { groupId: sugarGroup.id, name: "Больше сахара", priceDelta: 0, sortOrder: 3 },
    // Syrup
    { groupId: syrupGroup.id, name: "Ванильный сироп", priceDelta: 7, sortOrder: 1 },
    { groupId: syrupGroup.id, name: "Карамельный сироп", priceDelta: 7, sortOrder: 2 },
    { groupId: syrupGroup.id, name: "Ореховый сироп", priceDelta: 7, sortOrder: 3 },
    { groupId: syrupGroup.id, name: "Шоколадный сироп", priceDelta: 7, sortOrder: 4 },
  ]);

  // --- Drink products -------------------------------------------------------
  const drinkModifierGroupIds = [sizeGroup.id, milkGroup.id, sugarGroup.id, syrupGroup.id];

  const hotDrinks = await db
    .insert(products)
    .values([
      { categoryId: hot.id, name: "Мокко латте", basePrice: 55, sortOrder: 1 },
      { categoryId: hot.id, name: "Кофе латте", basePrice: 50, sortOrder: 2 },
      { categoryId: hot.id, name: "Эспрессо", basePrice: 30, sortOrder: 3 },
      { categoryId: hot.id, name: "Чёрный кофе", basePrice: 25, sortOrder: 4 },
      { categoryId: hot.id, name: "Мокачино", basePrice: 52, sortOrder: 5 },
    ])
    .returning();

  const coldDrinks = await db
    .insert(products)
    .values([
      { categoryId: cold.id, name: "Фраппе", basePrice: 60, sortOrder: 1 },
      { categoryId: cold.id, name: "Милкшейк", basePrice: 58, sortOrder: 2 },
      { categoryId: cold.id, name: "Айс латте", basePrice: 52, sortOrder: 3 },
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
      { name: "Бекон", extraPrice: 14 },
      { name: "Авокадо", extraPrice: 16 },
      { name: "Яичница", extraPrice: 10 },
    ])
    .returning();

  const [sandwich, croissant, muffin] = await db
    .insert(products)
    .values([
      { categoryId: bakery.id, name: "Сэндвич с ветчиной и сыром", basePrice: 65, sortOrder: 1 },
      { categoryId: bakery.id, name: "Круассан", basePrice: 35, sortOrder: 2 },
      { categoryId: bakery.id, name: "Маффин с черникой", basePrice: 40, sortOrder: 3 },
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
    { categoryId: cocktail.id, name: "Мохито безалкогольный", basePrice: 65, sortOrder: 1 },
    { categoryId: cocktail.id, name: "Фруктовый пунш", basePrice: 58, sortOrder: 2 },
  ]);

  // --- Merchandise -------------------------------------------------------
  await db.insert(products).values([
    { categoryId: merch.id, name: "Фирменная кружка", basePrice: 140, sortOrder: 1 },
    { categoryId: merch.id, name: "Термостакан", basePrice: 260, sortOrder: 2 },
  ]);

  // --- Gift cards -------------------------------------------------------
  await db.insert(products).values([
    { categoryId: giftcards.id, name: "Подарочная карта 200 MDL", basePrice: 200, sortOrder: 1 },
    { categoryId: giftcards.id, name: "Подарочная карта 500 MDL", basePrice: 500, sortOrder: 2 },
    { categoryId: giftcards.id, name: "Подарочная карта 1000 MDL", basePrice: 1000, sortOrder: 3 },
  ]);

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
