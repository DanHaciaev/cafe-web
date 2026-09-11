import Link from "next/link";
import { ArrowLeft, Menu, ClipboardList, CreditCard } from "lucide-react";

export const metadata = { title: "Справка — Cafe Drive POS" };

export default function CassaHelpPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-[#1e1b4b] px-6 py-8 text-white sm:px-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-200 hover:text-white"
          >
            <ArrowLeft size={15} />
            Назад на кассу
          </Link>
          <h1 className="text-2xl font-semibold">Справка для кассира</h1>
          <p className="mt-1 text-sm text-indigo-200">Короткая шпаргалка по экрану кассы.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-6 py-8 sm:px-10">
        <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Menu size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Кнопка слева от поиска</h2>
            <p className="mt-1 text-sm text-slate-500">
              Сворачивает список категорий в узкую полоску с иконками и разворачивает обратно.
              Освобождает место под товары на маленьком экране.
            </p>
          </div>
        </div>

        <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ClipboardList size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Кнопка «Заказы» сверху</h2>
            <p className="mt-1 text-sm text-slate-500">
              Вкладка «Открытые» — отложенные заказы, которые ещё не оплачены. Вкладка «Сегодня» —
              уже оплаченные заказы, где можно оформить возврат конкретной позиции с указанием
              причины.
            </p>
          </div>
        </div>

        <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Кнопка «Оформить»</h2>
            <p className="mt-1 text-sm text-slate-500">
              Открывает оплату на весь экран: наличные — с калькулятором и расчётом сдачи, карта —
              через банковский терминал (если подключён) или вручную.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Если у кафе несколько точек, при первом входе на этом устройстве нужно выбрать точку и
          ввести её PIN — дальше устройство запоминает выбор. Сменить точку можно внизу списка
          категорий.
        </div>
      </div>
    </div>
  );
}
