"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  selectedCategoryId: number | "all";
  onSelect: (id: number | "all") => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

function CategoryThumb({ imageUrl, fallback }: { imageUrl: string | null; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return <>{fallback}</>;
}

export default function Sidebar({
  categories,
  selectedCategoryId,
  onSelect,
  collapsed,
  onToggleCollapsed,
}: Props) {
  return (
    <aside
      className={clsx(
        "flex shrink-0 flex-col overflow-hidden bg-[#1e1b4b] text-white transition-[width] duration-200",
        collapsed ? "w-18" : "w-60"
      )}
    >
      <div className={clsx("p-4", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 transition-colors hover:bg-indigo-400"
          aria-label={collapsed ? "Показать категории" : "Скрыть категории"}
          title={collapsed ? "Показать категории" : "Скрыть категории"}
        >
          <Menu size={20} />
        </button>
      </div>

      {collapsed ? (
        <nav className="mt-2 flex flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2">
          <button
            type="button"
            onClick={() => onSelect("all")}
            title="Все"
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold transition-colors",
              selectedCategoryId === "all" ? "bg-white text-[#1e1b4b]" : "bg-white/10 text-indigo-100 hover:bg-white/20"
            )}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              title={cat.name}
              className={clsx(
                "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold uppercase transition-colors",
                selectedCategoryId === cat.id
                  ? "bg-white text-[#1e1b4b]"
                  : "bg-white/10 text-indigo-100 hover:bg-white/20"
              )}
            >
              <CategoryThumb imageUrl={cat.imageUrl} fallback={cat.name.slice(0, 2)} />
            </button>
          ))}
        </nav>
      ) : (
        <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          <button
            type="button"
            onClick={() => onSelect("all")}
            className={clsx(
              "rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors",
              selectedCategoryId === "all" ? "bg-white text-[#1e1b4b]" : "text-indigo-100 hover:bg-white/10"
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
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                selectedCategoryId === cat.id ? "bg-white text-[#1e1b4b]" : "text-indigo-100 hover:bg-white/10"
              )}
            >
              <span
                className={clsx(
                  "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md text-[10px] font-semibold uppercase",
                  selectedCategoryId === cat.id ? "bg-indigo-50 text-[#1e1b4b]" : "bg-white/10 text-indigo-100"
                )}
              >
                <CategoryThumb imageUrl={cat.imageUrl} fallback={cat.name.slice(0, 2)} />
              </span>
              {cat.name}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
