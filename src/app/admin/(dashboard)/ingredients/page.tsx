import { Salad, Plus, Trash2, Save } from "lucide-react";
import { getAllIngredients } from "@/db/queries";
import { createIngredient, updateIngredient, deleteIngredient } from "@/app/admin/actions";

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
          <form
            key={ing.id}
            action={updateIngredient}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <input type="hidden" name="id" value={ing.id} />
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Salad size={16} />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <input
                name="name"
                defaultValue={ing.name}
                className="w-full rounded-md border border-transparent px-1 py-0.5 text-sm font-medium text-slate-800 outline-none transition-colors hover:border-slate-200 focus:border-indigo-400"
              />
              <div className="flex items-center gap-1 px-1 text-xs text-slate-400">
                <span>+</span>
                <input
                  name="extraPrice"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={ing.extraPrice}
                  className="w-14 rounded-md border border-transparent px-1 py-0.5 outline-none transition-colors hover:border-slate-200 focus:border-indigo-400"
                />
                <span>MDL за доп.</span>
              </div>
            </div>
            <button
              type="submit"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-indigo-50 hover:text-indigo-500"
              aria-label="Сохранить"
              title="Сохранить"
            >
              <Save size={15} />
            </button>
            <button
              type="submit"
              formAction={deleteIngredient}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
              aria-label="Удалить"
              title="Удалить"
            >
              <Trash2 size={15} />
            </button>
          </form>
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
