import { notFound } from "next/navigation";
import { getOrderForReceipt } from "@/db/queries";
import AutoPrint from "@/components/print/AutoPrint";
import { parseSqliteUtcDate } from "@/lib/date";

// This page renders on the server (Vercel, likely running in UTC) but the
// receipt is for a cafe in Chișinău — hardcode the timezone so the printed
// time is always local to the cafe regardless of which region the
// serverless function happens to execute in.
const RECEIPT_TIME_ZONE = "Europe/Chisinau";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
};

export default async function KitchenReceiptPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { auto } = await searchParams;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const data = await getOrderForReceipt(orderId);
  if (!data) notFound();

  const { order, items } = data;
  const createdAt = parseSqliteUtcDate(order.createdAt);

  return (
    <div id="receipt" className="mx-auto w-[72mm] bg-white p-3 font-mono text-black print:w-full">
      {auto === "1" && <AutoPrint />}
      <div className="text-center">
        <p className="text-lg font-bold">ЧЕК НА КУХНЮ</p>
        <p className="text-2xl font-extrabold">#{order.number}</p>
        <p className="text-xs">
          {createdAt.toLocaleDateString("ru-RU", { timeZone: RECEIPT_TIME_ZONE })}{" "}
          {createdAt.toLocaleTimeString("ru-RU", { timeZone: RECEIPT_TIME_ZONE })}
        </p>
      </div>
      <hr className="my-2 border-dashed border-black" />
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id}>
            <p className="text-base font-bold">
              {item.quantity} × {item.name}
            </p>
            {item.modifiers.map((m) => (
              <p key={m.id} className="pl-3 text-sm">
                - {m.groupName}: {m.optionName}
              </p>
            ))}
            {item.ingredientChanges.map((c) => (
              <p key={c.id} className="pl-3 text-sm">
                - {c.action === "removed" ? "БЕЗ" : "ДОБАВИТЬ"} {c.ingredientName}
              </p>
            ))}
            {item.note && <p className="pl-3 text-sm italic">Заметка: {item.note}</p>}
          </div>
        ))}
      </div>
      <hr className="my-2 border-dashed border-black" />
      <p className="text-center text-xs">Спасибо!</p>
    </div>
  );
}
