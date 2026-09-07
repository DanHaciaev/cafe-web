import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-indigo-600">
            ← Касса
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <Link href="/admin/products" className="hover:text-slate-900">
              Товары
            </Link>
            <Link href="/admin/modifiers" className="hover:text-slate-900">
              Модификаторы
            </Link>
            <Link href="/admin/categories" className="hover:text-slate-900">
              Категории
            </Link>
            <Link href="/admin/ingredients" className="hover:text-slate-900">
              Ингредиенты
            </Link>
            <Link href="/admin/terminal" className="hover:text-slate-900">
              Терминал
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
