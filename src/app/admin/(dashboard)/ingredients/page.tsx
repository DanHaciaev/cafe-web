import { Salad, Plus, Trash2 } from "lucide-react";
import { getAllIngredients } from "@/db/queries";
import { createIngredient, deleteIngredient } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const ingredientsList = await getAllIngredients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ингредиенты</h1>
        <p className="mt-1 text-sm text-slate-500">
          Общий список ингредиентов. Привязка к конкретным товарам (по умолчанию / можно
          убрать / доступно как дополнение) настраивается в карточке товара.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ingredientsList.map((ing) => (
          <div
            key={ing.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Salad size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{ing.name}</p>
                {ing.extraPrice > 0 && (
                  <p className="text-xs text-slate-400">+{formatPrice(ing.extraPrice)} за доп.</p>
                )}
              </div>
            </div>
            <form action={deleteIngredient}>
              <input type="hidden" name="id" value={ing.id} />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                aria-label="Удалить"
              >
                <Trash2 size={15} />
              </button>
            </form>
          </div>
        ))}
        {ingredientsList.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400 sm:col-span-2 lg:col-span-3">
            Ингредиентов пока нет
          </p>
        )}
      </div>

      <form
        action={createIngredient}
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          name="name"
          placeholder="Название ингредиента"
          required
          className="flex-1 min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <input
          name="extraPrice"
          type="number"
          step="0.1"
          min="0"
          defaultValue={0}
          placeholder="Цена как доп."
          className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          <Plus size={16} />
          Добавить
        </button>
      </form>
    </div>
  );
}
