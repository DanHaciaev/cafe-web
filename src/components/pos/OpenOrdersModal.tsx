"use client";

import { useState } from "react";
import { ClipboardList, X, Clock, CreditCard, Undo2, Ban } from "lucide-react";
import clsx from "clsx";
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

export type TodayOrderItem = OpenOrderItem & {
  refundedQuantity: number;
};

export type TodayOrder = {
  id: number;
  number: number;
  total: number;
  refundedAmount: number;
  paymentMethod: string | null;
  status: "paid" | "cancelled";
  createdAt: string;
  items: TodayOrderItem[];
};

type Props = {
  orders: OpenOrder[];
  todayOrders: TodayOrder[];
  loading: boolean;
  loadingToday: boolean;
  onClose: () => void;
  onPay: (order: OpenOrder) => void;
  onRefund: (order: TodayOrder) => void;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
};

function paymentLabel(method: string | null): string {
  if (!method) return "—";
  if (method.startsWith("card")) return "Карта";
  return PAYMENT_LABELS[method] || method;
}

export default function OpenOrdersModal({
  orders,
  todayOrders,
  loading,
  loadingToday,
  onClose,
  onPay,
  onRefund,
}: Props) {
  const [tab, setTab] = useState<"open" | "today">("open");

  return (
    <div className="animate-overlay-in absolute inset-0 z-40 flex flex-col bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 sm:px-10">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          <ClipboardList size={20} />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">Заказы</h3>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab("open")}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === "open" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Открытые {orders.length > 0 && `(${orders.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTab("today")}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === "today" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Сегодня
          </button>
        </div>
        <div className="flex-1" />
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
        <div className="mx-auto w-full max-w-full">
          {tab === "open" && (
            <>
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
            </>
          )}

          {tab === "today" && (
            <>
              {loadingToday && <p className="text-center text-sm text-slate-400">Загрузка...</p>}
              {!loadingToday && todayOrders.length === 0 && (
                <p className="text-center text-sm text-slate-400">Заказов за сегодня пока нет</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {todayOrders.map((order) => {
                  const fullyRefunded = order.status === "cancelled";
                  const netTotal = order.total - order.refundedAmount;
                  return (
                    <div
                      key={order.id}
                      className={clsx(
                        "flex flex-col rounded-2xl border shadow-sm transition-shadow hover:shadow-md",
                        fullyRefunded ? "border-red-100 bg-red-50/30" : "border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <span className="text-base font-bold text-slate-900">Заказ #{order.number}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} />
                          {parseSqliteUtcDate(order.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex-1 space-y-3 px-5 py-4">
                        {order.items.map((item) => {
                          const remaining = item.quantity - item.refundedQuantity;
                          return (
                            <div key={item.id}>
                              <p
                                className={clsx(
                                  "text-sm font-semibold",
                                  remaining === 0 ? "text-slate-400 line-through" : "text-slate-800"
                                )}
                              >
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
                              {item.refundedQuantity > 0 && (
                                <p className="pl-3 text-xs font-medium text-red-500">
                                  Возвращено: {item.refundedQuantity}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-slate-900">{formatPrice(netTotal)}</span>
                          <span className="text-xs text-slate-400">{paymentLabel(order.paymentMethod)}</span>
                        </div>
                        {fullyRefunded ? (
                          <span className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-600">
                            <Ban size={13} />
                            Возвращён
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRefund(order)}
                            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-95"
                          >
                            <Undo2 size={15} />
                            Вернуть
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
