"use client";

import { X, Clock, CreditCard } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Открытые заказы</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-center text-sm text-slate-400">Загрузка...</p>}
          {!loading && orders.length === 0 && (
            <p className="text-center text-sm text-slate-400">Отложенных заказов нет</p>
          )}
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 p-4">
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
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400"
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
