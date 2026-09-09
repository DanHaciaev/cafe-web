"use client";

import { useState } from "react";
import { Banknote, CreditCard, X, ArrowLeft, Delete } from "lucide-react";
import clsx from "clsx";
import { PRINT_AGENT_URL } from "@/lib/agentUrl";
import { formatPrice } from "@/lib/format";

type Terminal = {
  id: string;
  driver: string;
  label?: string;
  terminalConnected?: boolean;
};

export type PaymentResult = {
  paymentMethod: string;
  cardTransactionId?: string;
};

export type ReceiptLine = {
  id: string | number;
  name: string;
  quantity: number;
  totalPrice: number;
  detail?: string[];
};

type Props = {
  total: number;
  items: ReceiptLine[];
  terminals: Terminal[];
  onCancel: () => void;
  onConfirm: (result: PaymentResult) => void;
};

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export default function PaymentModal({ total, items, terminals, onCancel, onConfirm }: Props) {
  const [view, setView] = useState<"select" | "cash" | "card">("select");
  const [cashInput, setCashInput] = useState("");
  const [chargingTerminalId, setChargingTerminalId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  // Rounded to whole MDL — prices are summed from several float deltas
  // (modifiers/ingredients), so `total` itself can carry stray fractions
  // (45.00000000000001) that would otherwise leak into the exact-amount
  // button and the change math. formatPrice() rounds the same way for
  // every other price shown in the app.
  const dueAmount = Math.round(total);
  const received = parseFloat(cashInput) || 0;
  const change = Math.max(0, received - dueAmount);
  const insufficient = cashInput !== "" && received < dueAmount;

  function pressKey(key: string) {
    if (key === "⌫") {
      setCashInput((v) => v.slice(0, -1));
      return;
    }
    setCashInput((v) => {
      if (key === "." && v.includes(".")) return v;
      if (v === "0" && key !== ".") return key;
      return v + key;
    });
  }

  async function payByCard(terminal: Terminal) {
    setChargingTerminalId(terminal.id);
    setCardError(null);
    try {
      const res = await fetch(`${PRINT_AGENT_URL}/pos/charge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: dueAmount, terminalId: terminal.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCardError(data.error || "Оплата отклонена");
        return;
      }
      onConfirm({
        paymentMethod: `card:${terminal.driver}`,
        cardTransactionId: data.transactionId || undefined,
      });
    } catch {
      setCardError("Не удалось связаться с терминалом. Проверьте подключение.");
    } finally {
      setChargingTerminalId(null);
    }
  }

  const title = view === "select" ? "Оплата" : view === "cash" ? "Наличные" : "Карта";

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 sm:px-10">
        {view !== "select" ? (
          <button
            type="button"
            onClick={() => {
              setView("select");
              setCardError(null);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            aria-label="Назад"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <CreditCard size={18} />
          </div>
        )}
        <h2 className="flex-1 text-xl font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/60 p-6">
          <p className="mb-4 text-sm font-semibold text-slate-700">Заказ</p>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
                {item.detail?.map((d, i) => (
                  <p key={i} className="pl-3 text-xs text-slate-400">
                    {d}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-base font-semibold text-slate-900">Итого</span>
            <span className="text-2xl font-bold text-slate-900">{formatPrice(dueAmount)}</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
          {view === "select" && (
            <div className="grid w-full max-w-lg grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => {
                  setCashInput("");
                  setView("cash");
                }}
                className="flex flex-col items-center gap-3 rounded-3xl border-2 border-slate-200 py-10 transition-all hover:border-emerald-300 hover:bg-emerald-50/40 active:scale-[0.98]"
              >
                <Banknote className="text-emerald-600" size={40} />
                <span className="text-lg font-semibold text-slate-800">Наличные</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardError(null);
                  setView("card");
                }}
                className="flex flex-col items-center gap-3 rounded-3xl border-2 border-slate-200 py-10 transition-all hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.98]"
              >
                <CreditCard className="text-indigo-600" size={40} />
                <span className="text-lg font-semibold text-slate-800">Карта</span>
              </button>
            </div>
          )}

          {view === "cash" && (
            <div className="grid w-full max-w-3xl grid-cols-[auto_1fr] gap-10">
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  {KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => pressKey(key)}
                      className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 text-xl font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-95"
                    >
                      {key === "⌫" ? <Delete size={20} /> : key}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCashInput("")}
                  className="mt-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                >
                  Очистить
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between rounded-2xl bg-slate-50 px-5 py-4">
                  <span className="text-sm font-medium text-slate-500">К оплате</span>
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(dueAmount)}</span>
                </div>

                <div className="flex items-baseline justify-between rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4">
                  <span className="text-sm font-semibold text-emerald-700">Получено</span>
                  <span className="text-3xl font-bold text-emerald-800">
                    {cashInput || "0"} <span className="text-base">MDL</span>
                  </span>
                </div>

                <div
                  className={clsx(
                    "flex items-baseline justify-between rounded-2xl border-2 px-5 py-4",
                    insufficient ? "border-red-200 bg-red-50" : "border-indigo-200 bg-indigo-50"
                  )}
                >
                  <span
                    className={clsx(
                      "text-sm font-semibold",
                      insufficient ? "text-red-700" : "text-indigo-700"
                    )}
                  >
                    {insufficient ? "Не хватает" : "Сдача"}
                  </span>
                  <span
                    className={clsx(
                      "text-3xl font-bold",
                      insufficient ? "text-red-700" : "text-indigo-700"
                    )}
                  >
                    {insufficient ? formatPrice(dueAmount - received) : formatPrice(change)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCashInput(String(dueAmount))}
                    className="rounded-xl border-2 border-indigo-200 bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    Без сдачи
                  </button>
                  {QUICK_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setCashInput(String(amount))}
                      className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={cashInput === "" || insufficient}
                  onClick={() => onConfirm({ paymentMethod: "cash" })}
                  className={clsx(
                    "mt-2 rounded-2xl py-4 text-base font-semibold text-white transition-all active:scale-[0.99]",
                    cashInput === "" || insufficient
                      ? "cursor-not-allowed bg-slate-300"
                      : "bg-emerald-500 shadow-sm shadow-emerald-200 hover:bg-emerald-400"
                  )}
                >
                  Подтвердить оплату
                </button>
              </div>
            </div>
          )}

          {view === "card" && (
            <div className="w-full max-w-sm space-y-3 text-center">
              {cardError && (
                <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{cardError}</p>
              )}

              {terminals.length === 0 && (
                <>
                  <p className="mb-2 text-sm text-slate-500">
                    Банковский терминал не подключён — оплата картой будет зафиксирована вручную.
                  </p>
                  <button
                    type="button"
                    onClick={() => onConfirm({ paymentMethod: "card" })}
                    className="w-full rounded-2xl bg-indigo-500 py-4 text-base font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-400 active:scale-[0.99]"
                  >
                    Подтвердить оплату картой
                  </button>
                </>
              )}

              {terminals.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => payByCard(t)}
                  disabled={!!chargingTerminalId}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99] disabled:opacity-50",
                    chargingTerminalId === t.id
                      ? "border-indigo-400 bg-indigo-50/40"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                  )}
                >
                  <CreditCard className="text-indigo-600" size={22} />
                  <span className="text-sm font-medium text-slate-800">
                    {chargingTerminalId === t.id ? "Ожидание оплаты на терминале..." : t.label || t.driver}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
