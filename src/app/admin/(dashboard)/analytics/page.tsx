import Link from "next/link";
import clsx from "clsx";
import { Receipt, TrendingUp, Wallet, MapPin } from "lucide-react";
import { getAnalytics, getLocations, type AnalyticsRange } from "@/db/queries";
import { formatPrice } from "@/lib/format";
import BarChart, { type BarPoint } from "@/components/admin/analytics/BarChart";
import PaymentSplitBar from "@/components/admin/analytics/PaymentSplitBar";
import LocationFilterSelect from "@/components/admin/analytics/LocationFilterSelect";

export const dynamic = "force-dynamic";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "month", label: "С начала месяца" },
];

function formatDayLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${d}.${m}`;
}

function formatHourLabel(hour: number): string {
  return `${hour}`;
}

type Props = {
  searchParams: Promise<{ range?: string; location?: string }>;
};

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const range: AnalyticsRange = (["today", "7d", "30d", "month"] as const).includes(
    params.range as AnalyticsRange
  )
    ? (params.range as AnalyticsRange)
    : "today";
  const locationId = params.location ? Number(params.location) : undefined;

  const [data, allLocations] = await Promise.all([getAnalytics(range, locationId), getLocations()]);

  const dailyStep = Math.max(1, Math.ceil(data.dailyRevenue.length / 10));
  const dailyPoints: BarPoint[] = data.dailyRevenue.map((d, i) => ({
    label: formatDayLabel(d.date),
    value: d.revenue,
    tooltipLabel: formatDayLabel(d.date),
    showLabel: i % dailyStep === 0 || i === data.dailyRevenue.length - 1,
  }));

  const hourlyPoints: BarPoint[] = data.hourlyRevenue.map((h) => ({
    label: formatHourLabel(h.hour),
    value: h.revenue,
    tooltipLabel: `${h.hour}:00 · ${h.count} ${h.count === 1 ? "заказ" : "заказов"}`,
    showLabel: h.hour % 3 === 0,
  }));

  const maxProductRevenue = Math.max(1, ...data.topProducts.map((p) => p.revenue));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Аналитика</h1>
          <p className="mt-1 text-sm text-slate-500">
            Выручка, популярные товары и загруженность по часам.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allLocations.length > 0 && (
            <LocationFilterSelect range={range} locationId={locationId} locations={allLocations} />
          )}
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {RANGES.map((r) => (
              <Link
                key={r.value}
                href={{
                  pathname: "/admin/analytics",
                  query: { range: r.value, ...(locationId ? { location: locationId } : {}) },
                }}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  range === r.value ? "bg-indigo-500 text-white" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-indigo-500 p-6 text-white shadow-sm">
          <div className="flex items-center gap-3 text-indigo-100">
            <TrendingUp size={20} />
            <span className="text-sm font-medium">Выручка</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{formatPrice(data.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <Receipt size={20} />
            <span className="text-sm font-medium">Заказов</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{data.orderCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <Wallet size={20} />
            <span className="text-sm font-medium">Средний чек</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{formatPrice(data.avgCheck)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3 text-slate-400">
            <Wallet size={20} />
            <span className="text-sm font-medium">Наличные / Карта</span>
          </div>
          <PaymentSplitBar cash={data.cashRevenue} card={data.cardRevenue} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Выручка по дням</h2>
          <BarChart data={dailyPoints} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Загруженность по часам</h2>
          <BarChart data={hourlyPoints} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Популярные товары</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Нет данных за этот период</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-xs font-semibold text-slate-300">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-700">{p.name}</span>
                      <span className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatPrice(p.revenue)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#2a78d6]"
                        style={{ width: `${Math.max(4, (p.revenue / maxProductRevenue) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-slate-400">{p.quantity} шт.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin size={16} className="text-slate-400" />
            Продажи по точкам
          </h2>
          {data.locationBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400">Нет данных за этот период</p>
          ) : (
            <div className="space-y-3">
              {data.locationBreakdown.map((loc) => {
                const maxLoc = Math.max(1, ...data.locationBreakdown.map((l) => l.revenue));
                return (
                  <div key={loc.locationId ?? "none"} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-700">{loc.name}</span>
                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {formatPrice(loc.revenue)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#2a78d6]"
                          style={{ width: `${Math.max(4, (loc.revenue / maxLoc) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs text-slate-400">
                      {loc.orderCount} {loc.orderCount === 1 ? "заказ" : "заказов"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
