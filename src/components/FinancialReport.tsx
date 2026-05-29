"use client";

import { Printer } from "lucide-react";
import { DATASET_INFO, stocksData } from "@/data/stocksData";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { calculateDividendSustainability, calculateFinancialHealthScore, getExpectedTrend } from "@/utils/analyticsEngine";

export function FinancialReport() {
  const averageHealth = stocksData.reduce((sum, stock) => sum + calculateFinancialHealthScore(stock).score, 0) / stocksData.length;
  const totalMarketCap = stocksData.reduce((sum, stock) => sum + stock.prices.marketCap, 0);
  const topYield = [...stocksData].sort((a, b) => b.fundamentals.dividendYield - a.fundamentals.dividendYield).slice(0, 5);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <div className="no-print flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">التقرير المالي</h1>
          <p className="mt-1 text-sm text-slate-500">تنسيق CSS Print-Friendly لكل الأسهم الثمانية عشر.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 font-black text-white hover:bg-sky-800"
        >
          <Printer size={18} aria-hidden />
          طباعة / حفظ PDF
        </button>
      </div>

      <article className="print-page glass-panel rounded-lg bg-white p-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-black text-sky-700">{DATASET_INFO.brandEn}</p>
          <h2 className="mt-2 text-4xl font-black text-slate-950">{DATASET_INFO.brandAr}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            تقرير لقطة ثابتة بتاريخ {formatDate(DATASET_INFO.snapshotDate)}. الأسعار ليست حية، ونطاقات القيمة الداخلية ليست توصيات أو تغطية محللين.
          </p>
        </header>

        <section className="mt-5 grid gap-3 md:grid-cols-4">
          <Metric label="عدد الأسهم" value={formatNumber(stocksData.length)} />
          <Metric label="القيمة السوقية" value={formatCurrency(totalMarketCap)} />
          <Metric label="متوسط الصحة" value={`${averageHealth.toFixed(0)}/100`} />
          <Metric label="أعلى عائد" value={formatPercent(topYield[0].fundamentals.dividendYield)} />
        </section>

        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black text-slate-950">أعلى العوائد النقدية</h3>
          <div className="grid gap-3 md:grid-cols-5">
            {topYield.map((stock) => (
              <div key={stock.symbol} className="rounded-lg border border-slate-200 p-3">
                <p className="font-black text-slate-950">{stock.symbol}</p>
                <p className="mt-1 text-xs text-slate-500">{stock.nameAr}</p>
                <p className="number mt-2 text-lg font-black text-emerald-700">{formatPercent(stock.fundamentals.dividendYield)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black text-slate-950">جدول الأسهم الكامل</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["السهم", "السوق", "السعر", "التغير", "P/E", "ROE", "العائد", "التوزيع", "الصحة", "اتجاه 3 أشهر", "هدف داخلي"].map((heading) => (
                    <th key={heading} className="border border-slate-200 px-2 py-2 text-right font-black">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocksData.map((stock) => {
                  const health = calculateFinancialHealthScore(stock);
                  const dividend = calculateDividendSustainability(stock);
                  const trend = getExpectedTrend(stock);
                  return (
                    <tr key={stock.symbol}>
                      <td className="border border-slate-200 px-2 py-2 font-black">{stock.symbol}<div className="font-normal text-slate-500">{stock.nameAr}</div></td>
                      <td className="border border-slate-200 px-2 py-2">{stock.market}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatCurrency(stock.prices.last)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPercent(stock.prices.changePercent)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatNumber(stock.fundamentals.pe)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPercent(stock.fundamentals.roe)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPercent(stock.fundamentals.dividendYield)}</td>
                      <td className="border border-slate-200 px-2 py-2">{dividend.rating}</td>
                      <td className="border border-slate-200 px-2 py-2">{health.band} · {health.score}</td>
                      <td className="border border-slate-200 px-2 py-2">{trend.direction}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatCurrency(stock.modelTarget.base)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-900">
          {DATASET_INFO.disclaimer} تعتمد بعض الحقول التاريخية ونطاقات القيمة على نموذج داخلي مشتق من اللقطة، ويجب الرجوع للمصادر الرسمية قبل أي قرار.
        </section>
      </article>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="number mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
