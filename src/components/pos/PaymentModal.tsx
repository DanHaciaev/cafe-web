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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Оплата</h3>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600" aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-center text-2xl font-bold text-slate-900">{formatPrice(total)}</p>

          {error && <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={() => onConfirm({ paymentMethod: "cash" })}
            disabled={!!chargingTerminalId}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-300 disabled:opacity-50"
          >
            <Banknote className="text-emerald-600" size={22} />
            <span className="text-sm font-medium text-slate-800">Наличные</span>
          </button>

          {terminals.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => payByCard(t)}
              disabled={!!chargingTerminalId}
              className={clsx(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left disabled:opacity-50",
                chargingTerminalId === t.id ? "border-indigo-400" : "border-slate-200 hover:border-indigo-300"
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
