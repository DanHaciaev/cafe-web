"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, MapPin, HelpCircle } from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/lib/types";
import { switchLocation } from "@/app/select-location/actions";

type Props = {
  categories: Category[];
  selectedCategoryId: number | "all";
  onSelect: (id: number | "all") => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeLocation: { id: number; name: string } | null;
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
  activeLocation,
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
                "rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors",
                selectedCategoryId === cat.id ? "bg-white text-[#1e1b4b]" : "text-indigo-100 hover:bg-white/10"
              )}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      )}

      <div className={clsx("border-t border-white/10 p-3", collapsed && "flex justify-center")}>
        <Link
          href="/help"
          title="Справка"
          className={clsx(
            "flex items-center gap-2.5 rounded-lg text-indigo-100 transition-colors hover:bg-white/10",
            collapsed ? "h-11 w-11 justify-center" : "w-full px-3 py-2.5"
          )}
        >
          <HelpCircle size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Справка</span>}
        </Link>
      </div>

      {activeLocation && (
        <div className={clsx("border-t border-white/10 p-3", collapsed && "flex justify-center")}>
          <form action={switchLocation}>
            <button
              type="submit"
              title={`Точка: ${activeLocation.name}. Сменить точку`}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg text-indigo-100 transition-colors hover:bg-white/10",
                collapsed ? "h-11 w-11 justify-center" : "w-full px-3 py-2.5"
              )}
            >
              <MapPin size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex flex-col items-start overflow-hidden text-left">
                  <span className="w-full truncate text-sm font-semibold text-white">
                    {activeLocation.name}
                  </span>
                  <span className="text-xs text-indigo-300">Сменить точку</span>
                </span>
              )}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
