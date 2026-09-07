"use client";

import { ArrowLeft, Minus, Plus, X } from "lucide-react";
import clsx from "clsx";
import type { CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type Props = {
  cart: CartItem[];
  total: number;
  charging: boolean;
  onChangeQuantity: (cartId: string, delta: number) => void;
  onRemove: (cartId: string) => void;
  onCharge: () => void;
  lastOrderNumber: number | null;
  printStatus: string | null;
};

function itemUnitPrice(item: CartItem) {
  const modifiersTotal = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
  const ingredientsTotal = item.ingredientChanges.reduce((s, i) => s + i.priceDelta, 0);
  return item.unitPrice + modifiersTotal + ingredientsTotal;
}

export default function TicketPanel({
  cart,
  total,
  charging,
  onChangeQuantity,
  onRemove,
  onCharge,
  lastOrderNumber,
  printStatus,
}: Props) {
  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">New Ticket</h2>
        {lastOrderNumber && (
          <span className="text-xs text-slate-400">Посл. заказ #{lastOrderNumber}</span>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-white">
            <ArrowLeft size={26} />
          </div>
          <p className="text-lg font-semibold text-slate-800">
            Start by adding items to order
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cart.map((item) => (
            <div key={item.cartId} className="flex flex-col gap-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                <button
                  type="button"
                  onClick={() => onRemove(item.cartId)}
                  className="text-slate-300 hover:text-red-500"
                  aria-label="Удалить"
                >
                  <X size={16} />
                </button>
              </div>
              {item.modifiers.map((m, i) => (
                <p key={`mod-${i}`} className="text-xs text-slate-500">
                  {m.groupName}: {m.optionName}
                  {m.priceDelta ? ` (+${formatPrice(m.priceDelta)})` : ""}
                </p>
              ))}
              {item.ingredientChanges.map((c, i) => (
                <p key={`ing-${i}`} className="text-xs text-slate-500">
                  {c.action === "removed" ? "Без" : "Добавить"} {c.ingredientName}
                  {c.priceDelta ? ` (+${formatPrice(c.priceDelta)})` : ""}
                </p>
              ))}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeQuantity(item.cartId, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onChangeQuantity(item.cartId, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {formatPrice(itemUnitPrice(item) * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 p-4">
        {printStatus && (
          <p className="mb-3 text-xs text-slate-500">{printStatus}</p>
        )}
        <div className="mb-3 flex items-center justify-between text-base font-semibold text-slate-900">
          <span>Итого</span>
          <span>{formatPrice(total)}</span>
        </div>
        <button
          type="button"
          disabled={cart.length === 0 || charging}
          onClick={onCharge}
          className={clsx(
            "w-full rounded-xl py-4 text-base font-semibold transition-colors",
            cart.length === 0 || charging
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-indigo-500 text-white hover:bg-indigo-400"
          )}
        >
          {charging ? "Оформление..." : "Charge"}
        </button>
      </div>
    </aside>
  );
}
