import { Lock } from "lucide-react";
import { login } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e1b4b] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white">
            <Lock size={26} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Вход в админ-панель</h1>
            <p className="mt-1 text-sm text-slate-500">Cafe Drive POS</p>
          </div>
        </div>

        <form action={login} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={next || "/admin"} />
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Пароль
            <input
              type="password"
              name="password"
              autoFocus
              required
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          {error && <p className="text-sm text-red-500">Неверный пароль.</p>}
          <button
            type="submit"
            className="mt-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
