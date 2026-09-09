"use client";

import { useState } from "react";
import { Banknote, CreditCard, X } from "lucide-react";
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

type Props = {
  total: number;
  terminals: Terminal[];
  onCancel: () => void;
  onConfirm: (result: PaymentResult) => void;
};

export default function PaymentModal({ total, terminals, onCancel, onConfirm }: Props) {
  const [chargingTerminalId, setChargingTerminalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function payByCard(terminal: Terminal) {
    setChargingTerminalId(terminal.id);
    setError(null);
    try {
      const res = await fetch(`${PRINT_AGENT_URL}/pos/charge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, terminalId: terminal.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Оплата отклонена");
        return;
      }
      onConfirm({
        paymentMethod: `card:${terminal.driver}`,
        cardTransactionId: data.transactionId || undefined,
      });
    } catch {
      setError("Не удалось связаться с терминалом. Проверьте подключение.");
    } finally {
      setChargingTerminalId(null);
    }
  }

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div className="animate-modal-in w-full max-w-sm rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Оплата</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-center text-3xl font-bold text-slate-900">{formatPrice(total)}</p>

          {error && <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={() => onConfirm({ paymentMethod: "cash" })}
            disabled={!!chargingTerminalId}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/40 active:scale-[0.99] disabled:opacity-50"
          >
            <Banknote className="text-emerald-600" size={22} />
            <span className="text-sm font-medium text-slate-800">Наличные</span>
          </button>

          {terminals.length === 0 && (
            <button
              type="button"
              onClick={() => onConfirm({ paymentMethod: "card" })}
              disabled={!!chargingTerminalId}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99] disabled:opacity-50"
            >
              <CreditCard className="text-indigo-600" size={22} />
              <span className="text-sm font-medium text-slate-800">Карта</span>
            </button>
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
      </div>
    </div>
  );
}
