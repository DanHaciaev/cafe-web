import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Link
        href="/admin/products"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md"
      >
        <p className="text-lg font-semibold text-slate-900">Товары</p>
        <p className="mt-1 text-sm text-slate-500">
          Цены, категории, ингредиенты и модификаторы
        </p>
      </Link>
      <Link
        href="/admin/modifiers"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md"
      >
        <p className="text-lg font-semibold text-slate-900">Модификаторы</p>
        <p className="mt-1 text-sm text-slate-500">Сироп, сахар, размер, молоко...</p>
      </Link>
      <Link
        href="/admin/categories"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md"
      >
        <p className="text-lg font-semibold text-slate-900">Категории</p>
        <p className="mt-1 text-sm text-slate-500">Разделы меню</p>
      </Link>
      <Link
        href="/admin/ingredients"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md"
      >
        <p className="text-lg font-semibold text-slate-900">Ингредиенты</p>
        <p className="mt-1 text-sm text-slate-500">Общий список для товаров с едой</p>
      </Link>
    </div>
  );
}
