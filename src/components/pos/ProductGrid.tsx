"use client";

import clsx from "clsx";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

type Props = {
  products: Product[];
  view: "grid" | "list";
  onProductClick: (product: Product) => void;
};

export default function ProductGrid({ products, view, onProductClick }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        Ничего не найдено
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex-1 overflow-y-auto p-6",
        view === "grid"
          ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 content-start"
          : "flex flex-col gap-2"
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          view={view}
          onClick={() => onProductClick(product)}
        />
      ))}
    </div>
  );
}
