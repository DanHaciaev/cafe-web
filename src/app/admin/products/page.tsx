import Link from "next/link";
import { getActiveProducts, getCategories } from "@/db/queries";
import { createProduct, deleteProduct } from "../actions";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [productsList, categoriesList] = await Promise.all([
    getActiveProducts(),
    getCategories(),
  ]);
  const categoryName = (id: number) => categoriesList.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Товары</h1>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Категория</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {productsList.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="text-indigo-600 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{categoryName(p.categoryId)}</td>
                <td className="px-4 py-3 text-slate-500">{formatPrice(p.basePrice)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-600">
                      Удалить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {productsList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Товаров пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action={createProduct}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <input
          name="name"
          placeholder="Название товара"
          required
          className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <select
          name="categoryId"
          required
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">Категория</option>
          {categoriesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="basePrice"
          type="number"
          step="0.1"
          min="0"
          placeholder="Цена"
          required
          className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
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
