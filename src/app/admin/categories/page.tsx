import { getCategories } from "@/db/queries";
import { createCategory, deleteCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categoriesList = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Категории</h1>

      <div className="rounded-xl border border-slate-200 bg-white">
        {categoriesList.map((cat) => (
          <form
            key={cat.id}
            action={deleteCategory}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0"
          >
            <input type="hidden" name="id" value={cat.id} />
            <span className="text-sm text-slate-700">{cat.name}</span>
            <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-600">
              Удалить
            </button>
          </form>
        ))}
        {categoriesList.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-400">Категорий пока нет</p>
        )}
      </div>

      <form action={createCategory} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <input
          name="name"
          placeholder="Название категории"
          required
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
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
