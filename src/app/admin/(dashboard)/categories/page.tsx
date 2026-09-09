import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { getActiveProducts, getCategories } from "@/db/queries";
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/actions";

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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_110px_130px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Категория</span>
          <span>Товаров</span>
          <span className="text-right">Действия</span>
        </div>
        <div className="divide-y divide-slate-100">
          {categoriesList.map((cat) => (
            <form
              key={cat.id}
              action={updateCategory}
              className="grid grid-cols-[1fr_110px_130px] items-center gap-4 px-5 py-3"
            >
              <input type="hidden" name="id" value={cat.id} />
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <LayoutGrid size={15} />
                </div>
                <input
                  name="name"
                  defaultValue={cat.name}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400"
                />
              </div>
              <span className="text-sm text-slate-500">{countByCategory(cat.id)}</span>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                  Сохранить
                </button>
                <button
                  type="submit"
                  formAction={deleteCategory}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </form>
          ))}
          {categoriesList.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Категорий пока нет</p>
          )}
        </div>
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
