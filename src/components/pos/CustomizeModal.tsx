"use client";

import { useMemo, useState } from "react";
import { Coffee, Minus, Plus, X, Check } from "lucide-react";
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
  const [imageFailed, setImageFailed] = useState(false);

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
    <div className="animate-overlay-in absolute inset-0 z-40 flex flex-col bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 sm:px-10">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 text-indigo-400">
          {product.imageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Coffee size={24} />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
          <p className="text-sm text-slate-400">{formatPrice(product.basePrice)}</p>
        </div>
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
        <div className="mx-auto w-full max-w-3xl space-y-8">
          {detail.modifierGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-3 text-sm font-semibold text-slate-700">
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
                        "flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all active:scale-95",
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                          : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50"
                      )}
                    >
                      {isSelected && <Check size={14} />}
                      {option.name}
                      {option.priceDelta > 0 && (
                        <span className={isSelected ? "text-indigo-100" : "text-slate-400"}>
                          +{formatPrice(option.priceDelta)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {detail.ingredients.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">Ингредиенты</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {detail.ingredients.map((ing) => {
                  const checked = !!ingredientState[ing.id];
                  return (
                    <label
                      key={ing.id}
                      className={clsx(
                        "flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                        !ing.removable && "cursor-default opacity-60",
                        checked ? "border-indigo-200 bg-indigo-50/60" : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!ing.removable}
                          onChange={() => toggleIngredient(ing.id, ing.removable)}
                          className="h-4 w-4 accent-indigo-500"
                        />
                        {ing.name}
                      </span>
                      {!ing.isDefault && ing.extraPrice > 0 && (
                        <span className="text-slate-400">+{formatPrice(ing.extraPrice)}</span>
                      )}
                    </label>
                  );
                })}
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
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-indigo-400"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-10">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 active:scale-95"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-base font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 active:scale-95"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            type="button"
            disabled={!requiredGroupsSatisfied}
            onClick={handleConfirm}
            className={clsx(
              "flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.99]",
              requiredGroupsSatisfied
                ? "bg-indigo-500 shadow-sm shadow-indigo-200 hover:bg-indigo-400"
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
