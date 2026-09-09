import { SlidersHorizontal, Plus, Trash2, Star } from "lucide-react";
import clsx from "clsx";
import { getAllModifierGroupsWithOptions } from "@/db/queries";
import {
  createModifierGroup,
  deleteModifierGroup,
  createModifierOption,
  deleteModifierOption,
} from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ModifiersPage() {
  const groups = await getAllModifierGroupsWithOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Модификаторы</h1>
        <p className="mt-1 text-sm text-slate-500">
          Группы вариантов (сироп, сахар, размер, молоко), которые можно привязать к
          товарам на странице товара.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                  <p className="text-xs text-slate-400">
                    {group.selectionType === "single" ? "один вариант" : "несколько вариантов"}
                    {group.required ? " · обязательно" : ""}
                  </p>
                </div>
              </div>
              <form action={deleteModifierGroup}>
                <input type="hidden" name="id" value={group.id} />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                  aria-label="Удалить группу"
                >
                  <Trash2 size={15} />
                </button>
              </form>
            </div>

            <div className="flex flex-col gap-2">
              {group.options.map((opt) => (
                <div
                  key={opt.id}
                  className={clsx(
                    "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                    opt.isDefault ? "border-indigo-100 bg-indigo-50/50" : "border-slate-100 bg-slate-50"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {opt.isDefault && <Star size={13} className="shrink-0 fill-indigo-400 text-indigo-400" />}
                    <span className="truncate font-medium text-slate-700">{opt.name}</span>
                    {opt.priceDelta > 0 && (
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 shadow-sm">
                        +{formatPrice(opt.priceDelta)}
                      </span>
                    )}
                  </div>
                  <form action={deleteModifierOption}>
                    <input type="hidden" name="id" value={opt.id} />
                    <button
                      type="submit"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                      aria-label="Удалить вариант"
                    >
                      <Trash2 size={13} />
                    </button>
                  </form>
                </div>
              ))}
              {group.options.length === 0 && (
                <p className="px-1 text-xs text-slate-400">Вариантов пока нет</p>
              )}
            </div>

            <form
              action={createModifierOption}
              className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
            >
              <input type="hidden" name="groupId" value={group.id} />
              <input
                name="name"
                placeholder="Вариант (например Ванильный сироп)"
                required
                className="h-9 flex-1 min-w-40 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
              />
              <input
                name="priceDelta"
                type="number"
                step="0.1"
                min="0"
                defaultValue={0}
                placeholder="Доплата"
                className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
              />
              <label className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-slate-500">
                <input type="checkbox" name="isDefault" className="accent-indigo-500" /> по умолчанию
              </label>
              <button
                type="submit"
                className="flex h-9 items-center gap-1 rounded-lg bg-indigo-500 px-3 text-xs font-medium text-white hover:bg-indigo-400"
              >
                <Plus size={14} />
                Добавить
              </button>
            </form>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400 lg:col-span-2">
            Групп пока нет
          </p>
        )}
      </div>

      <form
        action={createModifierGroup}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          name="name"
          placeholder="Название группы (например Сироп)"
          required
          className="flex-1 min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <select
          name="selectionType"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="single">Один вариант</option>
          <option value="multiple">Несколько вариантов</option>
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-500">
          <input type="checkbox" name="required" className="accent-indigo-500" /> обязательно
        </label>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          <Plus size={16} />
          Добавить группу
        </button>
      </form>
    </div>
  );
}
