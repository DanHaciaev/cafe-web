import { createClient } from "@libsql/client";

// name -> { newName?, price }
const PRODUCT_PRICES = {
  "Мокко латте": { price: 55 },
  "Кофе латте": { price: 50 },
  "Эспрессо": { price: 30 },
  "Чёрный кофе": { price: 25 },
  "Мокачино": { price: 52 },
  "Фраппе": { price: 60 },
  "Милкшейк": { price: 58 },
  "Айс латте": { price: 52 },
  "Сэндвич с ветчиной и сыром": { price: 65 },
  "Круассан": { price: 35 },
  "Маффин с черникой": { price: 40 },
  "Мохито безалкогольный": { price: 65 },
  "Фруктовый пунш": { price: 58 },
  "Фирменная кружка": { price: 140 },
  "Термостакан": { price: 260 },
  "Подарочная карта $10": { newName: "Подарочная карта 200 MDL", price: 200 },
  "Подарочная карта $25": { newName: "Подарочная карта 500 MDL", price: 500 },
  "Подарочная карта $50": { newName: "Подарочная карта 1000 MDL", price: 1000 },
};

const MODIFIER_OPTION_PRICES = {
  Средний: 8,
  Большой: 15,
  "Овсяное молоко": 8,
  "Миндальное молоко": 8,
  "Ванильный сироп": 7,
  "Карамельный сироп": 7,
  "Ореховый сироп": 7,
  "Шоколадный сироп": 7,
};

const INGREDIENT_PRICES = {
  Бекон: 14,
  Авокадо: 16,
  Яичница: 10,
};

async function convert(url, authToken, label) {
  const client = createClient(authToken ? { url, authToken } : { url });
  let total = 0;

  for (const [name, { newName, price }] of Object.entries(PRODUCT_PRICES)) {
    const res = await client.execute({
      sql: newName
        ? "update products set name = ?, base_price = ? where name = ?"
        : "update products set base_price = ? where name = ?",
      args: newName ? [newName, price, name] : [price, name],
    });
    total += res.rowsAffected;
  }

  for (const [name, price] of Object.entries(MODIFIER_OPTION_PRICES)) {
    const res = await client.execute({
      sql: "update modifier_options set price_delta = ? where name = ?",
      args: [price, name],
    });
    total += res.rowsAffected;
  }

  for (const [name, price] of Object.entries(INGREDIENT_PRICES)) {
    const res = await client.execute({
      sql: "update ingredients set extra_price = ? where name = ?",
      args: [price, name],
    });
    total += res.rowsAffected;
  }

  console.log(`[${label}] updated ${total} rows`);
  client.close();
}

async function main() {
  await convert("file:./local.db", undefined, "local.db");

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl && tursoToken) {
    await convert(tursoUrl, tursoToken, "turso");
  } else {
    console.log("TURSO_DATABASE_URL/TURSO_AUTH_TOKEN not set — skipped remote DB");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
