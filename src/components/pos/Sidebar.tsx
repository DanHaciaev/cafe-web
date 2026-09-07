"use client";

import { Menu } from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  selectedCategoryId: number | "all";
  onSelect: (id: number | "all") => void;
};

export default function Sidebar({ categories, selectedCategoryId, onSelect }: Props) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-[#1e1b4b] text-white">
      <div className="p-4">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-400 transition-colors"
          aria-label="Меню"
        >
          <Menu size={20} />
        </button>
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3 overflow-y-auto">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={clsx(
            "rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors",
            selectedCategoryId === "all"
              ? "bg-white text-[#1e1b4b]"
              : "text-indigo-100 hover:bg-white/10"
          )}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={clsx(
              "rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors",
              selectedCategoryId === cat.id
                ? "bg-white text-[#1e1b4b]"
                : "text-indigo-100 hover:bg-white/10"
            )}
          >
            {cat.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
