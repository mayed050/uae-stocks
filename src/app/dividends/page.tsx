import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, CircleDollarSign } from "lucide-react";
import { stocksData } from "@/data/stocksData";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { calculateDividendSustainability } from "@/utils/analyticsEngine";

const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function DividendsPage() {
  const rows = stocksData
    .map((stock) => ({
      stock,
      dividend: stock.dividend,
      sustainability: calculateDividendSustainability(stock),
    }))
    .sort((a, b) => new Date(a.dividend.exDate).getTime() - new Date(b.dividend.exDate).getTime());
  const monthly = buildMonthlyEvents();
  const averageYield = stocksData.reduce((sum, stock) => sum + stock.fundamentals.dividendYield, 0) / stocksData.length;
  const annualIncomePerOneK = stocksData.reduce((sum, stock) => sum + stock.dividend.annualDividend * 1000, 0);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="fusion-panel rounded-2xl p-5">
        <p className="text-sm font-black text-sky-500">مدمج من تجربة uae-stocks</p>
        <h1 className="mt-2 text-3xl font-black text-[color:var(--foreground)]">التوزيعات النقدية</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          تقويم استحقاق ودفع لكل الأسهم الـ 18، مع قراءة استدامة التوزيع ونسبة العائد من قاعدة بيانات إماراتي كابيتال.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="متوسط العائد النقدي" value={formatPercent(averageYield)} icon={<CircleDollarSign size={20} />} />
        <Metric label="دخل افتراضي لكل 1000 سهم" value={formatCurrency(annualIncomePerOneK)} icon={<CircleDollarSign size={20} />} />
        <Metric label="أحداث السنة" value={`${stocksData.length * 2} حدث`} icon={<CalendarDays size={20} />} />
      </section>

      <section className="fusion-panel rounded-2xl p-4">
        <h2 className="text-xl font-black text-[color:var(--foreground)]">تقويم التوزيعات</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          {monthly.map((month) => (
            <div key={month.month} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
              <h3 className="border-b border-[color:var(--line)] pb-2 font-black text-[color:var(--foreground)]">{month.month}</h3>
              <div className="mt-3 grid gap-2">
                {month.events.length ? (
                  month.events.map((event) => (
                    <Link
                      key={`${event.symbol}-${event.kind}-${event.date}`}
                      href={`/stocks/${event.symbol}`}
                      className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                        event.kind === "ex"
                          ? "border-amber-400/40 bg-amber-400/10 text-amber-500"
                          : "border-emerald-400/40 bg-emerald-400/10 text-emerald-500"
                      }`}
                    >
                      <span className="number ml-2">{new Date(`${event.date}T00:00:00Z`).getUTCDate()}</span>
                      {event.symbol}
                      <span className="mr-2 text-xs opacity-80">{event.kind === "ex" ? "استبعاد" : "دفع"}</span>
                    </Link>
                  ))
                ) : (
                  <p className="py-3 text-center text-sm font-bold text-[color:var(--muted)]">لا توجد أحداث</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="fusion-panel rounded-2xl p-4">
        <h2 className="text-xl font-black text-[color:var(--foreground)]">جدول التوزيعات الكامل</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[color:var(--line)] scrollbar-thin">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-[color:var(--chip)] text-[color:var(--muted)]">
              <tr>
                {["السهم", "السوق", "القطاع", "آخر توزيع", "سنوي", "العائد", "الاستبعاد", "الدفع", "نسبة التوزيع", "الاستدامة"].map((heading) => (
                  <th key={heading} className="border-b border-[color:var(--line)] px-3 py-3 text-right font-black">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ stock, dividend, sustainability }) => (
                <tr key={stock.symbol} className="border-b border-[color:var(--line)] hover:bg-sky-500/10">
                  <td className="px-3 py-3">
                    <Link href={`/stocks/${stock.symbol}`} className="font-black text-sky-500 hover:underline">
                      {stock.symbol}
                    </Link>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{stock.nameAr}</div>
                  </td>
                  <td className="px-3 py-3">{stock.market}</td>
                  <td className="px-3 py-3">{stock.sector}</td>
                  <td className="number px-3 py-3 font-bold">{formatCurrency(dividend.lastAmount)}</td>
                  <td className="number px-3 py-3 font-bold">{formatCurrency(dividend.annualDividend)}</td>
                  <td className="number px-3 py-3 font-bold text-emerald-500">{formatPercent(dividend.yieldPercent)}</td>
                  <td className="px-3 py-3">{formatDate(dividend.exDate)}</td>
                  <td className="px-3 py-3">{formatDate(dividend.paymentDate)}</td>
                  <td className="number px-3 py-3">{formatPercent(dividend.payoutRatio)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-sky-400/35 bg-sky-400/10 px-2 py-1 text-xs font-black text-sky-500">
                      {sustainability.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="fusion-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[color:var(--muted)]">{label}</p>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/12 text-sky-500">{icon}</span>
      </div>
      <p className="number mt-3 text-2xl font-black text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

function buildMonthlyEvents() {
  const calendar = months.map((month) => ({ month, events: [] as { symbol: string; date: string; kind: "ex" | "pay" }[] }));
  for (const stock of stocksData) {
    for (const event of [
      { symbol: stock.symbol, date: stock.dividend.exDate, kind: "ex" as const },
      { symbol: stock.symbol, date: stock.dividend.paymentDate, kind: "pay" as const },
    ]) {
      const parsed = new Date(`${event.date}T00:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) calendar[parsed.getUTCMonth()].events.push(event);
    }
  }
  return calendar.map((month) => ({
    ...month,
    events: month.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  }));
}
