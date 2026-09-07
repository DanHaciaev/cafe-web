import { getAllIngredients } from "@/db/queries";
import { createIngredient, deleteIngredient } from "../actions";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const ingredientsList = await getAllIngredients();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Ингредиенты</h1>
      <p className="text-sm text-slate-500">
        Общий список ингредиентов. Привязка к конкретным товарам (по умолчанию /
        можно убрать / доступно как дополнение) настраивается в карточке товара.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white">
        {ingredientsList.map((ing) => (
          <form
            key={ing.id}
            action={deleteIngredient}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0"
          >
            <input type="hidden" name="id" value={ing.id} />
            <span className="text-sm text-slate-700">
              {ing.name}{" "}
              {ing.extraPrice > 0 && (
                <span className="text-slate-400">(+{formatPrice(ing.extraPrice)} за доп.)</span>
              )}
            </span>
            <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-600">
              Удалить
            </button>
          </form>
        ))}
        {ingredientsList.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-400">Ингредиентов пока нет</p>
        )}
      </div>

      <form
        action={createIngredient}
        className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <input
          name="name"
          placeholder="Название ингредиента"
          required
          className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
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
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Добавить
        </button>
      </form>
    </div>
  );
}
