import { createClient } from "@libsql/client";

const RENAMES = {
  categories: {
    "Hot drinks": "Горячие напитки",
    "Cold drinks": "Холодные напитки",
    "Bakery": "Выпечка",
    "Cocktail": "Коктейли",
    "Merchandise": "Мерч",
    "Gift cards": "Подарочные карты",
  },
  products: {
    "Mocha coffee latte": "Мокко латте",
    "Coffee latte": "Кофе латте",
    "Espresso": "Эспрессо",
    "Original black": "Чёрный кофе",
    "Mochaccino": "Мокачино",
    "Frappe": "Фраппе",
    "Milkshake": "Милкшейк",
    "Iced latte": "Айс латте",
    "Ham & cheese sandwich": "Сэндвич с ветчиной и сыром",
    "Croissant": "Круассан",
    "Blueberry muffin": "Маффин с черникой",
    "Virgin mojito": "Мохито безалкогольный",
    "Fruit punch": "Фруктовый пунш",
    "Branded mug": "Фирменная кружка",
    "Travel tumbler": "Термостакан",
    "Gift card $10": "Подарочная карта $10",
    "Gift card $25": "Подарочная карта $25",
    "Gift card $50": "Подарочная карта $50",
  },
  modifier_groups: {
    "Size": "Размер",
    "Milk": "Молоко",
    "Sugar": "Сахар",
    "Syrup": "Сироп",
  },
  modifier_options: {
    "Small": "Маленький",
    "Medium": "Средний",
    "Large": "Большой",
    "Whole milk": "Обычное молоко",
    "Oat milk": "Овсяное молоко",
    "Almond milk": "Миндальное молоко",
    "Skim milk": "Обезжиренное молоко",
    "No sugar": "Без сахара",
    "Normal sugar": "Обычный сахар",
    "Extra sugar": "Больше сахара",
    "Vanilla syrup": "Ванильный сироп",
    "Caramel syrup": "Карамельный сироп",
    "Hazelnut syrup": "Ореховый сироп",
    "Chocolate syrup": "Шоколадный сироп",
  },
  ingredients: {
    "Bread": "Хлеб",
    "Cheese": "Сыр",
    "Ham": "Ветчина",
    "Lettuce": "Салат",
    "Tomato": "Помидор",
    "Bacon": "Бекон",
    "Avocado": "Авокадо",
    "Fried egg": "Яичница",
  },
};

async function translate(url, authToken, label) {
  const client = createClient(authToken ? { url, authToken } : { url });
  let total = 0;
  for (const [table, mapping] of Object.entries(RENAMES)) {
    for (const [from, to] of Object.entries(mapping)) {
      const res = await client.execute({
        sql: `update ${table} set name = ? where name = ?`,
        args: [to, from],
      });
      if (res.rowsAffected > 0) total += res.rowsAffected;
    }
  }
  console.log(`[${label}] renamed ${total} rows`);
  client.close();
}

async function main() {
  await translate("file:./local.db", undefined, "local.db");

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl && tursoToken) {
    await translate(tursoUrl, tursoToken, "turso");
  } else {
    console.log("TURSO_DATABASE_URL/TURSO_AUTH_TOKEN not set — skipped remote DB");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
