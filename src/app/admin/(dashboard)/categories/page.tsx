import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { getActiveProducts, getCategories } from "@/db/queries";
import { createCategory, deleteCategory } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categoriesList, productsList] = await Promise.all([getCategories(), getActiveProducts()]);
  const countByCategory = (id: number) => productsList.filter((p) => p.categoryId === id).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Категории</h1>
        <p className="mt-1 text-sm text-slate-500">Разделы меню кассы.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesList.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <LayoutGrid size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-400">{countByCategory(cat.id)} товаров</p>
              </div>
            </div>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={cat.id} />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                aria-label="Удалить"
              >
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        ))}
        {categoriesList.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400 sm:col-span-2 lg:col-span-3">
            Категорий пока нет
          </p>
        )}
      </div>

      <form
        action={createCategory}
        className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          name="name"
          placeholder="Название категории"
          required
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
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
