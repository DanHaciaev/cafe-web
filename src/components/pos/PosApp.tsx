"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { ProductDetail } from "@/db/queries";
import type { Category, Product, CartItem } from "@/lib/types";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ProductGrid from "./ProductGrid";
import TicketPanel from "./TicketPanel";
import CustomizeModal from "./CustomizeModal";
import PaymentModal, { type PaymentResult, type ReceiptLine } from "./PaymentModal";
import OpenOrdersModal, { type OpenOrder } from "./OpenOrdersModal";
import { tryLocalAgentPrint } from "@/lib/print";
import { PRINT_AGENT_URL } from "@/lib/agentUrl";

function buildReceiptLines<
  T extends {
    name: string;
    unitPrice: number;
    quantity: number;
    modifiers: { groupName: string; optionName: string; priceDelta: number }[];
    ingredientChanges: { ingredientName: string; action: "removed" | "added"; priceDelta: number }[];
  },
>(items: T[], idOf: (item: T, index: number) => string | number): ReceiptLine[] {
  return items.map((item, i) => {
    const modifiersTotal = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
    const ingredientsTotal = item.ingredientChanges.reduce((s, c) => s + c.priceDelta, 0);
    const unitPrice = item.unitPrice + modifiersTotal + ingredientsTotal;
    const detail = [
      ...item.modifiers.map((m) => `${m.groupName}: ${m.optionName}`),
      ...item.ingredientChanges.map((c) => `${c.action === "removed" ? "Без" : "Добавить"} ${c.ingredientName}`),
    ];
    return {
      id: idOf(item, i),
      name: item.name,
      quantity: item.quantity,
      totalPrice: unitPrice * item.quantity,
      detail,
    };
  });
}

type Props = {
  categories: Category[];
  products: Product[];
  productDetails: Record<number, ProductDetail>;
  activeLocation: { id: number; name: string } | null;
};

export default function PosApp({ categories, products, productDetails, activeLocation }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalProductId, setModalProductId] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [lastPrintUrl, setLastPrintUrl] = useState<string | null>(null);
  const [paymentTerminals, setPaymentTerminals] = useState<
    { id: string; driver: string; label?: string; terminalConnected?: boolean }[]
  >([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [holding, setHolding] = useState(false);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);
  const [showOpenOrdersModal, setShowOpenOrdersModal] = useState(false);
  const [payingOpenOrder, setPayingOpenOrder] = useState<OpenOrder | null>(null);

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

  const paymentItems = useMemo(
    () =>
      payingOpenOrder
        ? buildReceiptLines(payingOpenOrder.items, (item) => item.id)
        : buildReceiptLines(cart, (item) => item.cartId),
    [cart, payingOpenOrder]
  );

  const refreshOpenOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/open");
      if (!res.ok) return;
      setOpenOrders(await res.json());
    } catch {
      // Ignore — badge just stays at its last known count.
    }
  }, []);

  useEffect(() => {
    refreshOpenOrders();
  }, [refreshOpenOrders]);

  async function fetchConnectedTerminals() {
    try {
      const res = await fetch(`${PRINT_AGENT_URL}/pos/status`);
      const data = await res.json();
      return (data.terminals || []).filter((t: { terminalConnected?: boolean }) => t.terminalConnected);
    } catch {
      return [];
    }
  }

  async function openCharge() {
    if (cart.length === 0 || charging) return;
    const connected = await fetchConnectedTerminals();
    setPaymentTerminals(connected);
    setPayingOpenOrder(null);
    setShowPaymentModal(true);
  }

  async function createOrder(payment: PaymentResult) {
    if (cart.length === 0 || charging) return;
    setShowPaymentModal(false);
    setCharging(true);
    setPrintStatus(null);
    setLastPrintUrl(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          paymentMethod: payment.paymentMethod,
          cardTransactionId: payment.cardTransactionId,
          locationId: activeLocation?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to create order");
      const order = await res.json();
      setLastOrderNumber(order.number);
      setCart([]);
      await printReceipt(order);
    } catch (err) {
      console.error(err);
      setPrintStatus("Не удалось создать заказ. Попробуйте ещё раз.");
    } finally {
      setCharging(false);
    }
  }

  async function printReceipt(order: { id: number; number: number }) {
    const printUrl = `${window.location.origin}/print/order/${order.id}`;
    const printedByAgent = await tryLocalAgentPrint(printUrl);
    if (printedByAgent) {
      setPrintStatus(`Заказ #${order.number} отправлен на кухонный принтер`);
      setLastPrintUrl(null);
    } else {
      setPrintStatus(`Заказ #${order.number} создан. Локальный принт-агент не найден —`);
      setLastPrintUrl(`${printUrl}?auto=1`);
      // Works when the browser still treats this as part of the user's own
      // click; if it silently blocks the popup, the link below is what
      // actually gets used.
      window.open(`${printUrl}?auto=1`, "_blank");
    }
  }

  async function holdOrder() {
    if (cart.length === 0 || holding) return;
    setHolding(true);
    setPrintStatus(null);
    setLastPrintUrl(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, hold: true, locationId: activeLocation?.id }),
      });
      if (!res.ok) throw new Error("Failed to hold order");
      const order = await res.json();
      setLastOrderNumber(order.number);
      setCart([]);
      await printReceipt(order);
      refreshOpenOrders();
    } catch (err) {
      console.error(err);
      setPrintStatus("Не удалось отложить заказ. Попробуйте ещё раз.");
    } finally {
      setHolding(false);
    }
  }

  async function openOpenOrdersModal() {
    setShowOpenOrdersModal(true);
    setLoadingOpenOrders(true);
    await refreshOpenOrders();
    setLoadingOpenOrders(false);
  }

  async function startPayOpenOrder(order: OpenOrder) {
    const connected = await fetchConnectedTerminals();
    setPaymentTerminals(connected);
    setPayingOpenOrder(order);
    setShowPaymentModal(true);
  }

  async function payOpenOrder(order: OpenOrder, payment: PaymentResult) {
    setShowPaymentModal(false);
    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: payment.paymentMethod,
          cardTransactionId: payment.cardTransactionId,
        }),
      });
      if (!res.ok) throw new Error("Failed to pay order");
      setOpenOrders((prev) => prev.filter((o) => o.id !== order.id));
      setPrintStatus(`Заказ #${order.number} оплачен`);
      setLastPrintUrl(null);
    } catch (err) {
      console.error(err);
      setPrintStatus("Не удалось оплатить заказ. Попробуйте ещё раз.");
    } finally {
      setPayingOpenOrder(null);
    }
  }

  function handlePaymentConfirm(payment: PaymentResult) {
    if (payingOpenOrder) {
      payOpenOrder(payingOpenOrder, payment);
    } else {
      createOrder(payment);
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
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        activeLocation={activeLocation}
      />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopBar
          search={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={setView}
          openOrdersCount={openOrders.length}
          onOpenOrdersClick={openOpenOrdersModal}
        />
        <ProductGrid products={filteredProducts} view={view} onProductClick={handleProductClick} />
        {modalProduct && modalDetail && (
          <CustomizeModal
            product={modalProduct}
            detail={modalDetail}
            onCancel={() => setModalProductId(null)}
            onConfirm={addCustomizedItem}
          />
        )}
        {showOpenOrdersModal && (
          <OpenOrdersModal
            orders={openOrders}
            loading={loadingOpenOrders}
            onClose={() => setShowOpenOrdersModal(false)}
            onPay={startPayOpenOrder}
          />
        )}
      </div>
      <TicketPanel
        cart={cart}
        total={total}
        charging={charging}
        onChangeQuantity={changeQuantity}
        onRemove={removeItem}
        onCharge={openCharge}
        onHold={holdOrder}
        holding={holding}
        lastOrderNumber={lastOrderNumber}
        printStatus={printStatus}
        printUrl={lastPrintUrl}
      />
      {showPaymentModal && (
        <PaymentModal
          total={payingOpenOrder ? payingOpenOrder.total : total}
          items={paymentItems}
          terminals={paymentTerminals}
          onCancel={() => {
            setShowPaymentModal(false);
            setPayingOpenOrder(null);
          }}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
}
