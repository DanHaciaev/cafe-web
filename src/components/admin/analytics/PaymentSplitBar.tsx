import { formatPrice } from "@/lib/format";

type Props = {
  cash: number;
  card: number;
};

// Categorical, 2 fixed slots (blue = cash, aqua = card). Part-to-whole ->
// single stacked bar, legend always present for 2+ series.
export default function PaymentSplitBar({ cash, card }: Props) {
  const total = cash + card;
  const cashPct = total > 0 ? (cash / total) * 100 : 50;
  const cardPct = total > 0 ? (card / total) * 100 : 50;

  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-lg bg-slate-100">
        {cashPct > 0 && (
          <div className="flex items-center justify-center bg-[#2a78d6]" style={{ width: `${cashPct}%` }} />
        )}
        {cashPct > 0 && cardPct > 0 && <div className="w-0.5 bg-white" />}
        {cardPct > 0 && (
          <div className="flex items-center justify-center bg-[#1baf7a]" style={{ width: `${cardPct}%` }} />
        )}
      </div>
      <div className="mt-3 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[#2a78d6]" />
          <span className="text-slate-500">Наличные</span>
          <span className="font-semibold text-slate-900">{formatPrice(cash)}</span>
          <span className="text-slate-400">({cashPct.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[#1baf7a]" />
          <span className="text-slate-500">Карта</span>
          <span className="font-semibold text-slate-900">{formatPrice(card)}</span>
          <span className="text-slate-400">({cardPct.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}
