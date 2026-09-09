import Link from "next/link";
import clsx from "clsx";
import { SlidersHorizontal, Plus, Trash2, Save } from "lucide-react";
import { getAllModifierGroupsWithOptions } from "@/db/queries";
import {
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  createModifierOption,
  updateModifierOption,
  deleteModifierOption,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ group?: string }>;
};

export default async function ModifiersPage({ searchParams }: Props) {
  const { group: groupParam } = await searchParams;
  const groups = await getAllModifierGroupsWithOptions();

  const selectedGroupId = groupParam ? Number(groupParam) : groups[0]?.id;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Модификаторы</h1>
        <p className="mt-1 text-sm text-slate-500">
          Выберите группу слева, чтобы увидеть и отредактировать её варианты.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Master list: groups */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Группы</p>
          <div className="flex flex-col gap-1">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/admin/modifiers?group=${g.id}`}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  g.id === selectedGroupId ? "bg-indigo-500 text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {g.name}
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs",
                    g.id === selectedGroupId ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {g.options.length}
                </span>
              </Link>
            ))}
            {groups.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">Групп пока нет — создайте первую справа.</p>
            )}
          </div>
        </div>

        {/* Detail: selected group */}
        <div className="space-y-4">
          {selectedGroup ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <SlidersHorizontal size={16} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedGroup.name}</h2>
                </div>
                <form
                  action={updateModifierGroup}
                  className="grid gap-2 sm:grid-cols-[1fr_160px_auto_auto]"
                >
                  <input type="hidden" name="id" value={selectedGroup.id} />
                  <input
                    name="name"
                    defaultValue={selectedGroup.name}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none transition-colors focus:border-indigo-400"
                  />
                  <select
                    name="selectionType"
                    defaultValue={selectedGroup.selectionType}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none transition-colors focus:border-indigo-400"
                  >
                    <option value="single">Один вариант</option>
                    <option value="multiple">Несколько вариантов</option>
                  </select>
                  <label className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      name="required"
                      defaultChecked={selectedGroup.required}
                      className="accent-indigo-500"
                    />
                    обязательно
                  </label>
                  <button
                    type="submit"
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-indigo-50 px-3 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                  >
                    <Save size={14} />
                    Сохранить
                  </button>
                </form>
              </div>

              <div className="p-5">
                {selectedGroup.options.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[1fr_120px_90px_96px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <span>Вариант</span>
                      <span>Цена</span>
                      <span className="text-center">Умолч.</span>
                      <span></span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedGroup.options.map((opt) => (
                        <form
                          key={opt.id}
                          action={updateModifierOption}
                          className="grid grid-cols-[1fr_120px_90px_96px] items-center gap-3 px-4 py-2.5"
                        >
                          <input type="hidden" name="id" value={opt.id} />
                          <input
                            name="name"
                            defaultValue={opt.name}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400"
                          />
                          <input
                            name="priceDelta"
                            type="number"
                            step="0.1"
                            min="0"
                            defaultValue={opt.priceDelta}
                            className="no-spinner w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none transition-colors focus:border-indigo-400"
                          />
                          <label className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              name="isDefault"
                              defaultChecked={opt.isDefault}
                              className="h-4 w-4 accent-indigo-500"
                            />
                          </label>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="submit"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-indigo-500 transition-colors hover:bg-indigo-50"
                              aria-label="Сохранить"
                              title="Сохранить"
                            >
                              <Save size={15} />
                            </button>
                            <button
                              type="submit"
                              formAction={deleteModifierOption}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                              aria-label="Удалить"
                              title="Удалить"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </form>
                      ))}
                    </div>
                  </div>
                )}
                {selectedGroup.options.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                    Вариантов пока нет — добавьте первый ниже.
                  </p>
                )}

                <form
                  action={createModifierOption}
                  className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
                >
                  <input type="hidden" name="groupId" value={selectedGroup.id} />
                  <input
                    name="name"
                    placeholder="Вариант (например Ванильный сироп)"
                    required
                    className="h-10 flex-1 min-w-40 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                  />
                  <input
                    name="priceDelta"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={0}
                    placeholder="Доплата"
                    className="no-spinner h-10 w-28 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                  />
                  <label className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-slate-500">
                    <input type="checkbox" name="isDefault" className="accent-indigo-500" /> по умолчанию
                  </label>
                  <button
                    type="submit"
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400"
                  >
                    <Plus size={16} />
                    Добавить
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-100 p-5">
                <form action={deleteModifierGroup}>
                  <input type="hidden" name="id" value={selectedGroup.id} />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Удалить группу «{selectedGroup.name}»
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">
              Создайте первую группу модификаторов ниже.
            </p>
          )}

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
      </div>
    </div>
  );
}
