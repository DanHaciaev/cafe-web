"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import clsx from "clsx";
import type { ProductDetail } from "@/db/queries";
import type { Product, CartItem, CartItemModifier, CartItemIngredientChange } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type Props = {
  product: Product;
  detail: ProductDetail;
  onCancel: () => void;
  onConfirm: (item: CartItem) => void;
};

export default function CustomizeModal({ product, detail, onCancel, onConfirm }: Props) {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>(() => {
    const initial: Record<number, number[]> = {};
    for (const group of detail.modifierGroups) {
      const defaults = group.options.filter((o) => o.isDefault).map((o) => o.id);
      initial[group.id] = defaults;
    }
    return initial;
  });
  const [ingredientState, setIngredientState] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    for (const ing of detail.ingredients) {
      initial[ing.id] = ing.isDefault;
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  function toggleOption(group: ProductDetail["modifierGroups"][number], optionId: number) {
    setSelectedOptions((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selectionType === "single") {
        return { ...prev, [group.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (group.maxSelect && current.length >= group.maxSelect) {
        return prev;
      }
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  function toggleIngredient(ingredientId: number, removable: boolean) {
    if (!removable) return;
    setIngredientState((prev) => ({ ...prev, [ingredientId]: !prev[ingredientId] }));
  }

  const modifiers: CartItemModifier[] = useMemo(() => {
    const result: CartItemModifier[] = [];
    for (const group of detail.modifierGroups) {
      const selectedIds = selectedOptions[group.id] ?? [];
      for (const option of group.options) {
        if (selectedIds.includes(option.id)) {
          result.push({ groupName: group.name, optionName: option.name, priceDelta: option.priceDelta });
        }
      }
    }
    return result;
  }, [detail.modifierGroups, selectedOptions]);

  const ingredientChanges: CartItemIngredientChange[] = useMemo(() => {
    const result: CartItemIngredientChange[] = [];
    for (const ing of detail.ingredients) {
      const nowIncluded = ingredientState[ing.id];
      if (ing.isDefault && !nowIncluded) {
        result.push({ ingredientName: ing.name, action: "removed", priceDelta: 0 });
      } else if (!ing.isDefault && nowIncluded) {
        result.push({ ingredientName: ing.name, action: "added", priceDelta: ing.extraPrice });
      }
    }
    return result;
  }, [detail.ingredients, ingredientState]);

  const unitPrice =
    product.basePrice +
    modifiers.reduce((s, m) => s + m.priceDelta, 0) +
    ingredientChanges.reduce((s, c) => s + c.priceDelta, 0);

  const requiredGroupsSatisfied = detail.modifierGroups.every(
    (group) => !group.required || (selectedOptions[group.id]?.length ?? 0) > 0
  );

  function handleConfirm() {
    if (!requiredGroupsSatisfied) return;
    onConfirm({
      cartId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      unitPrice: product.basePrice,
      quantity,
      modifiers,
      ingredientChanges,
      note: note.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {detail.modifierGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {group.name}
                {group.required && <span className="ml-1 text-red-500">*</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const isSelected = (selectedOptions[group.id] ?? []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(group, option.id)}
                      className={clsx(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-slate-200 text-slate-600 hover:border-indigo-300"
                      )}
                    >
                      {option.name}
                      {option.priceDelta > 0 && ` +${formatPrice(option.priceDelta)}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {detail.ingredients.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Ингредиенты</p>
              <div className="flex flex-col gap-2">
                {detail.ingredients.map((ing) => (
                  <label
                    key={ing.id}
                    className={clsx(
                      "flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm",
                      !ing.removable && "opacity-60"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!ingredientState[ing.id]}
                        disabled={!ing.removable}
                        onChange={() => toggleIngredient(ing.id, ing.removable)}
                      />
                      {ing.name}
                    </span>
                    {!ing.isDefault && ing.extraPrice > 0 && (
                      <span className="text-slate-400">+{formatPrice(ing.extraPrice)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Комментарий</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Например: без льда"
              className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            type="button"
            disabled={!requiredGroupsSatisfied}
            onClick={handleConfirm}
            className={clsx(
              "flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors",
              requiredGroupsSatisfied
                ? "bg-indigo-500 hover:bg-indigo-400"
                : "bg-slate-300 cursor-not-allowed"
            )}
          >
            Добавить · {formatPrice(unitPrice * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
