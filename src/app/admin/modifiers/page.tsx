import { getAllModifierGroupsWithOptions } from "@/db/queries";
import {
  createModifierGroup,
  deleteModifierGroup,
  createModifierOption,
  deleteModifierOption,
} from "../actions";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ModifiersPage() {
  const groups = await getAllModifierGroupsWithOptions();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Модификаторы</h1>
      <p className="text-sm text-slate-500">
        Группы вариантов (сироп, сахар, размер, молоко), которые можно привязать
        к товарам на странице товара.
      </p>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                <p className="text-xs text-slate-400">
                  {group.selectionType === "single" ? "один вариант" : "несколько вариантов"}
                  {group.required ? " · обязательно" : ""}
                </p>
              </div>
              <form action={deleteModifierGroup}>
                <input type="hidden" name="id" value={group.id} />
                <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-600">
                  Удалить группу
                </button>
              </form>
            </div>

            <div className="flex flex-col gap-1">
              {group.options.map((opt) => (
                <form
                  key={opt.id}
                  action={deleteModifierOption}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <input type="hidden" name="id" value={opt.id} />
                  <span>
                    {opt.name}
                    {opt.priceDelta > 0 && (
                      <span className="text-slate-400"> +{formatPrice(opt.priceDelta)}</span>
                    )}
                    {opt.isDefault && <span className="ml-2 text-xs text-indigo-500">по умолчанию</span>}
                  </span>
                  <button type="submit" className="text-xs text-red-500 hover:text-red-600">
                    Удалить
                  </button>
                </form>
              ))}
            </div>

            <form
              action={createModifierOption}
              className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
            >
              <input type="hidden" name="groupId" value={group.id} />
              <input
                name="name"
                placeholder="Вариант (например Ванильный сироп)"
                required
                className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <input
                name="priceDelta"
                type="number"
                step="0.1"
                min="0"
                defaultValue={0}
                placeholder="Доплата"
                className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <label className="flex items-center gap-1 text-xs text-slate-500">
                <input type="checkbox" name="isDefault" /> по умолчанию
              </label>
              <button
                type="submit"
                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
              >
                Добавить вариант
              </button>
            </form>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
            Групп пока нет
          </p>
        )}
      </div>

      <form
        action={createModifierGroup}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <input
          name="name"
          placeholder="Название группы (например Сироп)"
          required
          className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <select
          name="selectionType"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="single">Один вариант</option>
          <option value="multiple">Несколько вариантов</option>
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-500">
          <input type="checkbox" name="required" /> обязательно
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Добавить группу
        </button>
      </form>
    </div>
  );
}
