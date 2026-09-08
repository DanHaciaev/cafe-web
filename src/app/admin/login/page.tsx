import { Lock, KeyRound } from "lucide-react";
import { login, setup } from "./actions";
import { hasAdminPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; setupError?: string; next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error, setupError, next } = await searchParams;
  const passwordExists = await hasAdminPassword();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e1b4b] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white">
            {passwordExists ? <Lock size={26} /> : <KeyRound size={26} />}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {passwordExists ? "Вход в админ-панель" : "Придумайте пароль"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Cafe Drive POS</p>
          </div>
        </div>

        {passwordExists ? (
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
        ) : (
          <form action={setup} className="flex flex-col gap-3">
            <input type="hidden" name="next" value={next || "/admin"} />
            <p className="text-sm text-slate-500">
              Пароль ещё не задан — это первый вход. Придуманный пароль сохранится в
              базе, менять его потом можно будет прямо в админке.
            </p>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Новый пароль
              <input
                type="password"
                name="password"
                autoFocus
                required
                minLength={6}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Повторите пароль
              <input
                type="password"
                name="confirm"
                required
                minLength={6}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
              />
            </label>
            {setupError === "short" && (
              <p className="text-sm text-red-500">Пароль должен быть не короче 6 символов.</p>
            )}
            {setupError === "mismatch" && (
              <p className="text-sm text-red-500">Пароли не совпадают.</p>
            )}
            <button
              type="submit"
              className="mt-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              Сохранить и войти
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
