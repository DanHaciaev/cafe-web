"use client";

import { LayoutGrid, List, Search, ClipboardList } from "lucide-react";
import clsx from "clsx";
import Clock from "./Clock";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  openOrdersCount: number;
  onOpenOrdersClick: () => void;
};

export default function TopBar({
  search,
  onSearchChange,
  view,
  onViewChange,
  openOrdersCount,
  onOpenOrdersClick,
}: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4">
      <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5">
        <Search size={18} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      <Clock />
      <button
        type="button"
        onClick={onOpenOrdersClick}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-400"
        aria-label="Открытые заказы"
      >
        <ClipboardList size={18} />
        {openOrdersCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {openOrdersCount}
          </span>
        )}
      </button>
      <div className="flex items-center gap-1 rounded-xl bg-indigo-500 p-1">
        <button
          type="button"
          onClick={() => onViewChange("grid")}
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            view === "grid" ? "bg-white text-indigo-600" : "text-white"
          )}
          aria-label="Сетка"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("list")}
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            view === "list" ? "bg-white text-indigo-600" : "text-white"
          )}
          aria-label="Список"
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
}
