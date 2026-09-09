"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  BarChart3,
  Coffee,
  SlidersHorizontal,
  LayoutGrid,
  Salad,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { logout } from "@/app/admin/login/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/admin/products", label: "Товары", icon: Coffee },
  { href: "/admin/modifiers", label: "Модификаторы", icon: SlidersHorizontal },
  { href: "/admin/categories", label: "Категории", icon: LayoutGrid },
  { href: "/admin/ingredients", label: "Ингредиенты", icon: Salad },
  { href: "/admin/locations", label: "Точки", icon: MapPin },
  { href: "/admin/terminal", label: "Терминал", icon: CreditCard },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#1e1b4b] text-white">
      <div className="p-5">
        <p className="text-sm font-semibold text-white">Cafe Drive POS</p>
        <p className="text-xs text-indigo-300">Админ-панель</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white text-[#1e1b4b]" : "text-indigo-100 hover:bg-white/10"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-100 hover:bg-white/10"
        >
          <ArrowLeft size={18} />
          Касса
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-indigo-100 hover:bg-white/10"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
