"use client";

import { ClipboardList, X, Clock, CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/format";

type OpenOrderItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
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
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Закрыть"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
        <div className="mx-auto w-full max-w-3xl">
          {loading && <p className="text-center text-sm text-slate-400">Загрузка...</p>}
          {!loading && orders.length === 0 && (
            <p className="text-center text-sm text-slate-400">Отложенных заказов нет</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">#{order.number}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mb-3 space-y-0.5">
                  {order.items.map((item) => (
                    <p key={item.id} className="text-sm text-slate-600">
                      {item.quantity} × {item.name}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{formatPrice(order.total)}</span>
                  <button
                    type="button"
                    onClick={() => onPay(order)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-indigo-400 active:scale-95"
                  >
                    <CreditCard size={14} />
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
