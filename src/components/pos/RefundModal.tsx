"use client";

import { useMemo, useState } from "react";
import { Undo2, X, Minus, Plus } from "lucide-react";
import clsx from "clsx";
import { formatPrice } from "@/lib/format";
import type { TodayOrder } from "./OpenOrdersModal";

type Props = {
  order: TodayOrder;
  onCancel: () => void;
  onRefunded: () => void;
};

const REASON_PRESETS = ["Плохое качество", "Ошибка кассира", "Клиент передумал", "Долгое ожидание"];

export default function RefundModal({ order, onCancel, onRefunded }: Props) {
  const [selectedQty, setSelectedQty] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = useMemo(
    () =>
      order.items.map((item) => {
        const modifiersTotal = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
        const ingredientsTotal = item.ingredientChanges.reduce((s, c) => s + c.priceDelta, 0);
        const unitPrice = item.unitPrice + modifiersTotal + ingredientsTotal;
        const remaining = item.quantity - item.refundedQuantity;
        return { item, unitPrice, remaining };
      }),
    [order.items]
  );

  function setQty(itemId: number, qty: number, remaining: number) {
    setSelectedQty((prev) => ({ ...prev, [itemId]: Math.max(0, Math.min(remaining, qty)) }));
  }

  const refundTotal = lines.reduce((sum, l) => sum + l.unitPrice * (selectedQty[l.item.id] ?? 0), 0);
  const hasSelection = refundTotal > 0;
  const hasReason = reason.trim() !== "";

  async function submit() {
    if (!hasSelection || !hasReason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const items = lines
        .filter((l) => (selectedQty[l.item.id] ?? 0) > 0)
        .map((l) => ({ orderItemId: l.item.id, quantity: selectedQty[l.item.id] }));
      const res = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось оформить возврат");
        return;
      }
      onRefunded();
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 sm:px-10">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <Undo2 size={20} />
        </div>
        <h3 className="flex-1 text-xl font-semibold text-slate-900">Возврат — заказ #{order.number}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
        <div className="mx-auto w-full max-w-2xl space-y-3">
          <p className="text-sm text-slate-500">Выберите, что именно вернуть, и сколько штук.</p>

          {lines.map(({ item, unitPrice, remaining }) => {
            const qty = selectedQty[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className={clsx(
                  "flex items-center gap-4 rounded-2xl border p-4",
                  remaining === 0 ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-200"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  {item.modifiers.map((m) => (
                    <p key={m.id} className="text-xs text-slate-500">
                      {m.groupName}: {m.optionName}
                    </p>
                  ))}
                  <p className="mt-1 text-xs text-slate-400">
                    {formatPrice(unitPrice)} / шт · куплено {item.quantity}
                    {item.refundedQuantity > 0 && `, возвращено ${item.refundedQuantity}`}
                  </p>
                </div>

                {remaining === 0 ? (
                  <span className="shrink-0 text-xs font-medium text-slate-400">Возвращено полностью</span>
                ) : (
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, qty - 1, remaining)}
                      disabled={qty === 0}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-base font-semibold">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, qty + 1, remaining)}
                      disabled={qty >= remaining}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {hasSelection && (
            <div className="pt-3">
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Причина возврата <span className="text-red-500">*</span>
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                {REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={clsx(
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                      reason === preset
                        ? "border-red-400 bg-red-50 text-red-600"
                        : "border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50/50"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Например: пирожное было несвежим"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-red-300"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-10">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex-1" />
          <span className="text-sm text-slate-500">К возврату</span>
          <span className="text-2xl font-bold text-slate-900">{formatPrice(refundTotal)}</span>
          <button
            type="button"
            disabled={!hasSelection || !hasReason || submitting}
            onClick={submit}
            className={clsx(
              "rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.99]",
              hasSelection && hasReason && !submitting
                ? "bg-red-500 shadow-sm shadow-red-200 hover:bg-red-400"
                : "cursor-not-allowed bg-slate-300"
            )}
          >
            {submitting ? "Оформление..." : "Оформить возврат"}
          </button>
        </div>
      </div>
    </div>
  );
}
