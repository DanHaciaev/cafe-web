import { KeyRound, Printer, Download } from "lucide-react";
import { changePassword } from "@/app/admin/actions";
import { PRINT_AGENT_DOWNLOAD_URL } from "@/lib/printAgentDownload";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  current: "Текущий пароль неверен.",
  short: "Новый пароль должен быть не короче 6 символов.",
  mismatch: "Новый пароль и подтверждение не совпадают.",
};

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Настройки</h1>
        <p className="mt-1 text-sm text-slate-500">Пароль для входа в админку.</p>
      </div>

      <form
        action={changePassword}
        className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <KeyRound size={18} />
          </div>
          <h2 className="text-sm font-semibold">Сменить пароль</h2>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {ERROR_MESSAGES[error] || "Не удалось сохранить пароль."}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Текущий пароль
          <input
            type="password"
            name="current"
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Новый пароль
          <input
            type="password"
            name="next"
            required
            minLength={6}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Повторите новый пароль
          <input
            type="password"
            name="confirm"
            required
            minLength={6}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <p className="text-xs text-slate-400">
          После смены пароля все устройства, где выполнен вход, будут разлогинены — понадобится войти заново.
        </p>
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Сохранить пароль
        </button>
      </form>

      <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Printer size={18} />
          </div>
          <h2 className="text-sm font-semibold">Print-agent для кассы</h2>
        </div>
        <p className="text-sm text-slate-500">
          Программа для кассового ПК — печатает чеки на термопринтер TP805L и запускает
          оплату на банковском терминале. Устанавливается один раз на компьютер, где физически
          стоит принтер.
        </p>
        <a
          href={PRINT_AGENT_DOWNLOAD_URL}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
        >
          <Download size={16} />
          Скачать установщик (.zip)
        </a>
        <p className="text-xs text-slate-400">
          В архиве: install.bat — запустите на кассовом ПК от имени администратора. Подробности —
          в README.md внутри архива.
        </p>
      </div>
    </div>
  );
}
