import { stocksData } from "@/data/stocksData";
import { formatCurrency, formatPercent, percentClass } from "@/lib/format";

export function TickerTape() {
  const tapeItems = [...stocksData, ...stocksData];

  return (
    <div className="no-print relative h-14 w-full max-w-full overflow-hidden border-b border-[color:var(--line)] bg-[color:var(--surface)] backdrop-blur-xl">
      <div className="ticker-track absolute inset-y-0 right-0 flex w-max items-center gap-3" aria-label="شريط أسعار الأسهم">
        {tapeItems.map((stock, index) => (
          <a
            key={`${stock.symbol}-${index}`}
            href={`/stocks/${stock.symbol}`}
            className="interactive-card mx-1 flex min-w-44 items-center justify-between gap-3 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm shadow-sm hover:border-sky-400"
          >
            <span className="font-black text-[color:var(--foreground)]">{stock.symbol}</span>
            <span className="number font-bold text-[color:var(--muted)]">{formatCurrency(stock.prices.last)}</span>
            <span className={`number text-xs font-extrabold ${percentClass(stock.prices.changePercent)}`}>
              {formatPercent(stock.prices.changePercent)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
