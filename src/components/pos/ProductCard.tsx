"use client";

import { Coffee } from "lucide-react";
import clsx from "clsx";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type Props = {
  product: Product;
  view: "grid" | "list";
  onClick: () => void;
};

function ProductThumb({ product, size }: { product: Product; size: number }) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt=""
        className="h-full w-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return <Coffee size={size * 0.4} />;
}

export default function ProductCard({ product, view, onClick }: Props) {
  if (view === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-4 rounded-xl bg-white p-3 text-left shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
          <ProductThumb product={product} size={56} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">{product.name}</p>
          <p className="text-sm text-slate-500">{formatPrice(product.basePrice)}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      )}
    >
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
        <ProductThumb product={product} size={96} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-800">{product.name}</p>
        <p className="text-sm text-slate-500">{formatPrice(product.basePrice)}</p>
      </div>
    </button>
  );
}
