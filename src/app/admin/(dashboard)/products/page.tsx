import Link from "next/link";
import clsx from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { getActiveProducts, getCategories } from "@/db/queries";
import { createProduct, deleteProduct } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import ProductThumb from "@/components/admin/ProductThumb";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const [productsList, categoriesList] = await Promise.all([getActiveProducts(), getCategories()]);

  const selectedCategoryId = category ? Number(category) : categoriesList[0]?.id;
  const selectedCategory = categoriesList.find((c) => c.id === selectedCategoryId);
  const productsInCategory = productsList.filter((p) => p.categoryId === selectedCategoryId);

  const countByCategory = (id: number) => productsList.filter((p) => p.categoryId === id).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Товары</h1>
        <p className="mt-1 text-sm text-slate-500">Выберите категорию слева, чтобы увидеть и отредактировать её товары.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Master list: categories */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm h-fit">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Категории</p>
          <div className="flex flex-col gap-1">
            {categoriesList.map((cat) => (
              <Link
                key={cat.id}
                href={`/admin/products?category=${cat.id}`}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  cat.id === selectedCategoryId
                    ? "bg-indigo-500 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {cat.name}
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs",
                    cat.id === selectedCategoryId ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {countByCategory(cat.id)}
                </span>
              </Link>
            ))}
            {categoriesList.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">
                Сначала создайте категорию на странице «Категории».
              </p>
            )}
          </div>
        </div>

        {/* Detail: products in selected category */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{selectedCategory?.name ?? "Товары"}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {productsInCategory.map((p) => (
                <div key={p.id} className="relative flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="absolute inset-0"
                    aria-label={p.name}
                  />
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                    <ProductThumb imageUrl={p.imageUrl} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-sm text-slate-400">{formatPrice(p.basePrice)}</p>
                  </div>
                  <form action={deleteProduct} className="relative z-10">
                    <input type="hidden" name="id" value={p.id} />
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
              {productsInCategory.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">В этой категории пока нет товаров</p>
              )}
            </div>
          </div>

          <form
            action={createProduct}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <input
              name="name"
              placeholder="Название товара"
              required
              className="flex-1 min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <select
              name="categoryId"
              required
              defaultValue={selectedCategoryId}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
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
              className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
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
      </div>
    </div>
  );
}
