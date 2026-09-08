import Link from "next/link";
import { Coffee, SlidersHorizontal, LayoutGrid, Salad, TrendingUp, Receipt } from "lucide-react";
import { getDashboardCounts, getTodayStats } from "@/db/queries";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [counts, todayStats] = await Promise.all([getDashboardCounts(), getTodayStats()]);

  const cards = [
    { href: "/admin/products", label: "Товары", value: counts.productCount, icon: Coffee },
    { href: "/admin/modifiers", label: "Модификаторы", value: counts.modifierGroupCount, icon: SlidersHorizontal },
    { href: "/admin/categories", label: "Категории", value: counts.categoryCount, icon: LayoutGrid },
    { href: "/admin/ingredients", label: "Ингредиенты", value: counts.ingredientCount, icon: Salad },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Дашборд</h1>
        <p className="mt-1 text-sm text-slate-500">Обзор кафе за сегодня и быстрые ссылки на управление меню.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#1e1b4b] p-6 text-white shadow-sm">
          <div className="flex items-center gap-3 text-indigo-200">
            <Receipt size={20} />
            <span className="text-sm font-medium">Заказов сегодня</span>
          </div>
          <p className="mt-3 text-4xl font-bold">{todayStats.count}</p>
        </div>
        <div className="rounded-2xl bg-indigo-500 p-6 text-white shadow-sm">
          <div className="flex items-center gap-3 text-indigo-100">
            <TrendingUp size={20} />
            <span className="text-sm font-medium">Выручка сегодня</span>
          </div>
          <p className="mt-3 text-4xl font-bold">{formatPrice(todayStats.total)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Меню</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">{card.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{card.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
