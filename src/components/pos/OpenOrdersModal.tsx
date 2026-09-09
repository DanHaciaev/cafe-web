"use client";

import { ClipboardList, X, Clock, CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { parseSqliteUtcDate } from "@/lib/date";

type OpenOrderItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  note: string | null;
  modifiers: { id: number; groupName: string; optionName: string; priceDelta: number }[];
  ingredientChanges: { id: number; ingredientName: string; action: "removed" | "added"; priceDelta: number }[];
};

export type OpenOrder = {
  id: number;
  number: number;
  total: number;
  createdAt: string;
  items: OpenOrderItem[];
};

type Props = {
  orders: OpenOrder[];
  loading: boolean;
  onClose: () => void;
  onPay: (order: OpenOrder) => void;
};

export default function OpenOrdersModal({ orders, loading, onClose, onPay }: Props) {
  return (
    <div className="animate-overlay-in absolute inset-0 z-40 flex flex-col bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 sm:px-10">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          <ClipboardList size={20} />
        </div>
        <h3 className="flex-1 text-xl font-semibold text-slate-900">Открытые заказы</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
        <div className="mx-auto w-full max-w-4xl">
          {loading && <p className="text-center text-sm text-slate-400">Загрузка...</p>}
          {!loading && orders.length === 0 && (
            <p className="text-center text-sm text-slate-400">Отложенных заказов нет</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <span className="text-base font-bold text-slate-900">Заказ #{order.number}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    {parseSqliteUtcDate(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex-1 space-y-3 px-5 py-4">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.quantity} × {item.name}
                      </p>
                      {item.modifiers.map((m) => (
                        <p key={m.id} className="pl-3 text-xs text-slate-500">
                          — {m.groupName}: {m.optionName}
                          {m.priceDelta > 0 && ` (+${formatPrice(m.priceDelta)})`}
                        </p>
                      ))}
                      {item.ingredientChanges.map((c) => (
                        <p key={c.id} className="pl-3 text-xs text-slate-500">
                          — {c.action === "removed" ? "без" : "добавить"} {c.ingredientName}
                          {c.priceDelta > 0 && ` (+${formatPrice(c.priceDelta)})`}
                        </p>
                      ))}
                      {item.note && (
                        <p className="pl-3 text-xs italic text-slate-400">Заметка: {item.note}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                  <span className="text-lg font-bold text-slate-900">{formatPrice(order.total)}</span>
                  <button
                    type="button"
                    onClick={() => onPay(order)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-400 active:scale-95"
                  >
                    <CreditCard size={15} />
                    Оплатить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
