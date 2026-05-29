import Link from "next/link";
import { stocksData } from "@/data/stocksData";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateFinancialHealthScore, getExpectedTrend, healthClass } from "@/utils/analyticsEngine";

export default function OutlookPage() {
  const rows = stocksData
    .map((stock) => ({ stock, trend: getExpectedTrend(stock), health: calculateFinancialHealthScore(stock) }))
    .sort((a, b) => b.trend.score - a.trend.score);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="fusion-panel rounded-2xl p-5">
        <p className="text-sm font-black text-sky-500">نموذج داخلي موضوعي</p>
        <h1 className="mt-2 text-3xl font-black text-[color:var(--foreground)]">الاتجاه المتوقع خلال 3 أشهر</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          قراءة غير توصوية تجمع الزخم السعري، النمو، العائد، التقييم، والسيولة في درجة قابلة للمقارنة بين الأسهم.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {rows.map(({ stock, trend, health }) => (
          <Link key={stock.symbol} href={`/stocks/${stock.symbol}`} className="fusion-panel rounded-2xl p-4 hover:border-sky-400">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-[color:var(--foreground)]">{stock.nameAr}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                  <span className="market-chip rounded-full px-2 py-1">{stock.symbol}</span>
                  <span className="market-chip rounded-full px-2 py-1">{stock.market}</span>
                  <span className={`rounded-full border px-2 py-1 ${healthClass(health.score)}`}>
                    صحة {health.score}/100
                  </span>
                </div>
              </div>
              <div className="number rounded-xl bg-[color:var(--chip)] px-3 py-2 text-sm font-black text-[color:var(--foreground)]">
                {trend.score}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-sky-400/30 bg-sky-400/10 p-3">
              <p className="font-black text-sky-500">{trend.direction}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{trend.qualifiers.join(" · ")}</p>
            </div>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <Mini label="التغير" value={formatPercent(stock.prices.changePercent)} />
              <Mini label="العائد" value={formatPercent(stock.fundamentals.dividendYield)} />
              <Mini label="هدف داخلي" value={formatCurrency(stock.modelTarget.base)} />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
      <p className="text-xs font-black text-[color:var(--muted)]">{label}</p>
      <p className="number mt-1 font-black text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
