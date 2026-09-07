# Cafe Drive POS

POS-приложение для кофейни (coffee drive) на Next.js: сетка меню с категориями,
кастомизация напитков (сироп/сахар/размер/молоко), еда с редактируемыми
ингредиентами, оформление заказа и автопечать чека на кухню.

## Стек

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **SQLite** через Drizzle ORM: `@libsql/client` — локально это обычный файл
  `local.db`, в проде — бесплатная база [Turso](https://turso.tech) (libSQL,
  тот же SQL, тот же движок).
- **print-agent/** — отдельная Node-программа для кассового ПК, печатает
  кухонные чеки на термопринтер **TP805L**. Работает независимо от того, где
  хостится сайт (см. `print-agent/README.md`).

## Локальная разработка

```bash
npm install
npm run db:migrate   # применить схему к ./local.db
npm run db:seed       # наполнить тестовым меню
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000) — касса, и
[http://localhost:3000/admin](http://localhost:3000/admin) — управление
меню, категориями, модификаторами и ингредиентами.

## Продакшн: Vercel + Turso (бесплатно, без своего сервера)

1. Зарегистрировать бесплатную БД на [turso.tech](https://turso.tech):
   ```bash
   turso db create cafe-web
   turso db show cafe-web --url
   turso db tokens create cafe-web
   ```
2. В Vercel → Settings → Environment Variables добавить:
   - `TURSO_DATABASE_URL` — из `turso db show`
   - `TURSO_AUTH_TOKEN` — из `turso db tokens create`
3. Применить миграции и сид к продовой базе (один раз, локально с теми же env):
   ```bash
   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate
   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:seed
   ```
4. Задеплоить проект на Vercel (просто импортировать репозиторий).
5. Домен: в Namecheap добавить CNAME-запись поддомена (например `cafe`) на
   `cname.vercel-dns.com`, в Vercel добавить этот поддомен в Settings → Domains.
   Основной домен и другие проекты на нём не затрагиваются.

## Печать на кухню (TP805L)

Печать чека происходит не с сервера (у Vercel нет доступа к принтеру в кафе),
а через локальный агент на кассовом ПК — см. `print-agent/README.md` для
установки. Если агент не запущен, сайт откроет чек в новой вкладке для ручной
печати через диалог браузера — оформление заказа при этом не ломается.

## Структура

- `src/db/schema.ts` — схема: категории, товары, группы модификаторов и их
  варианты, ингредиенты, заказы.
- `src/app/page.tsx` + `src/components/pos/*` — касса.
- `src/app/admin/*` — управление меню.
- `src/app/print/order/[id]` — печатная версия чека для кухни.
- `print-agent/` — локальный принт-агент для TP805L.
