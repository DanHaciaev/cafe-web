import { Undo2, MapPin } from "lucide-react";
import { getRefunds } from "@/db/queries";
import { formatPrice } from "@/lib/format";
import { parseSqliteUtcDate } from "@/lib/date";

export const dynamic = "force-dynamic";

const REFUND_TIME_ZONE = "Europe/Chisinau";

export default async function RefundsPage() {
  const refundsList = await getRefunds();
  const totalRefunded = refundsList.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Возвраты</h1>
        <p className="mt-1 text-sm text-slate-500">
          Журнал всех возвратов — что вернули, сколько и почему.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <Undo2 size={20} />
            <span className="text-sm font-medium">Возвратов</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{refundsList.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <Undo2 size={20} />
            <span className="text-sm font-medium">На сумму</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{formatPrice(totalRefunded)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[140px_90px_140px_1fr_1fr_110px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Время</span>
          <span>Заказ</span>
          <span>Точка</span>
          <span>Позиции</span>
          <span>Причина</span>
          <span className="text-right">Сумма</span>
        </div>
        <div className="divide-y divide-slate-100">
          {refundsList.map((r) => {
            const date = parseSqliteUtcDate(r.createdAt);
            return (
              <div
                key={r.id}
                className="grid grid-cols-[140px_90px_140px_1fr_1fr_110px] items-start gap-4 px-5 py-4"
              >
                <div className="text-sm text-slate-600">
                  <div>{date.toLocaleDateString("ru-RU", { timeZone: REFUND_TIME_ZONE })}</div>
                  <div className="text-xs text-slate-400">
                    {date.toLocaleTimeString("ru-RU", { timeZone: REFUND_TIME_ZONE })}
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">#{r.orderNumber}</span>
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={13} className="shrink-0 text-slate-300" />
                  {r.locationName}
                </span>
                <div className="space-y-0.5">
                  {r.items.map((item, i) => (
                    <p key={i} className="text-sm text-slate-700">
                      {item.quantity} × {item.name}
                    </p>
                  ))}
                </div>
                <p className="text-sm text-slate-500">{r.reason || "—"}</p>
                <span className="text-right text-sm font-bold text-red-600">
                  −{formatPrice(r.amount)}
                </span>
              </div>
            );
          })}
          {refundsList.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Возвратов пока не было</p>
          )}
        </div>
      </div>
    </div>
  );
}
