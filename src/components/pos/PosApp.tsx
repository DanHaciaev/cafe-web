"use client";

import { useMemo, useState } from "react";
import type { ProductDetail } from "@/db/queries";
import type { Category, Product, CartItem } from "@/lib/types";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ProductGrid from "./ProductGrid";
import TicketPanel from "./TicketPanel";
import CustomizeModal from "./CustomizeModal";
import PaymentModal, { type PaymentResult } from "./PaymentModal";
import { tryLocalAgentPrint } from "@/lib/print";
import { PRINT_AGENT_URL } from "@/lib/agentUrl";

type Props = {
  categories: Category[];
  products: Product[];
  productDetails: Record<number, ProductDetail>;
};

export default function PosApp({ categories, products, productDetails }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalProductId, setModalProductId] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [paymentTerminals, setPaymentTerminals] = useState<
    { id: string; driver: string; label?: string; terminalConnected?: boolean }[]
  >([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategoryId === "all" || p.categoryId === selectedCategoryId;
      const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, search]);

  function needsCustomization(productId: number) {
    const detail = productDetails[productId];
    if (!detail) return false;
    return detail.modifierGroups.length > 0 || detail.ingredients.length > 0;
  }

  function addSimpleProduct(product: Product) {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.id && item.modifiers.length === 0 && item.ingredientChanges.length === 0
      );
      if (existing) {
        return prev.map((item) =>
          item.cartId === existing.cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartId: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          unitPrice: product.basePrice,
          quantity: 1,
          modifiers: [],
          ingredientChanges: [],
        },
      ];
    });
  }

  function handleProductClick(product: Product) {
    if (needsCustomization(product.id)) {
      setModalProductId(product.id);
    } else {
      addSimpleProduct(product);
    }
  }

  function addCustomizedItem(item: CartItem) {
    setCart((prev) => [...prev, item]);
    setModalProductId(null);
  }

  function changeQuantity(cartId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(cartId: string) {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const modifiersTotal = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
        const ingredientsTotal = item.ingredientChanges.reduce((s, i) => s + i.priceDelta, 0);
        return sum + (item.unitPrice + modifiersTotal + ingredientsTotal) * item.quantity;
      }, 0),
    [cart]
  );

  async function openCharge() {
    if (cart.length === 0 || charging) return;
    try {
      const res = await fetch(`${PRINT_AGENT_URL}/pos/status`);
      const data = await res.json();
      const connected = (data.terminals || []).filter(
        (t: { terminalConnected?: boolean }) => t.terminalConnected
      );
      if (connected.length > 0) {
        setPaymentTerminals(connected);
        setShowPaymentModal(true);
        return;
      }
    } catch {
      // Agent not running or no terminals configured — fall through to cash.
    }
    createOrder({ paymentMethod: "cash" });
  }

  async function createOrder(payment: PaymentResult) {
    if (cart.length === 0 || charging) return;
    setShowPaymentModal(false);
    setCharging(true);
    setPrintStatus(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          paymentMethod: payment.paymentMethod,
          cardTransactionId: payment.cardTransactionId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create order");
      const order = await res.json();
      setLastOrderNumber(order.number);
      setCart([]);

      const printUrl = `${window.location.origin}/print/order/${order.id}`;
      const printedByAgent = await tryLocalAgentPrint(printUrl);
      if (printedByAgent) {
        setPrintStatus(`Заказ #${order.number} отправлен на кухонный принтер`);
      } else {
        setPrintStatus(
          `Заказ #${order.number} создан. Локальный принт-агент не найден — откройте квитанцию вручную`
        );
        window.open(`${printUrl}?auto=1`, "_blank");
      }
    } catch (err) {
      console.error(err);
      setPrintStatus("Не удалось создать заказ. Попробуйте ещё раз.");
    } finally {
      setCharging(false);
    }
  }

  const modalProduct = modalProductId ? products.find((p) => p.id === modalProductId) ?? null : null;
  const modalDetail = modalProductId ? productDetails[modalProductId] ?? null : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-900">
      <Sidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar search={search} onSearchChange={setSearch} view={view} onViewChange={setView} />
        <ProductGrid products={filteredProducts} view={view} onProductClick={handleProductClick} />
      </div>
      <TicketPanel
        cart={cart}
        total={total}
        charging={charging}
        onChangeQuantity={changeQuantity}
        onRemove={removeItem}
        onCharge={openCharge}
        lastOrderNumber={lastOrderNumber}
        printStatus={printStatus}
      />
      {modalProduct && modalDetail && (
        <CustomizeModal
          product={modalProduct}
          detail={modalDetail}
          onCancel={() => setModalProductId(null)}
          onConfirm={addCustomizedItem}
        />
      )}
      {showPaymentModal && (
        <PaymentModal
          total={total}
          terminals={paymentTerminals}
          onCancel={() => setShowPaymentModal(false)}
          onConfirm={createOrder}
        />
      )}
    </div>
  );
}
