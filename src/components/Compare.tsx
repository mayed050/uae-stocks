"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeftRight, Activity, Scale, Trophy } from "lucide-react";
import { stocksData } from "@/data/stocksData";
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent } from "@/lib/format";
import { calculateDividendSustainability, calculateFinancialHealthScore, getExpectedTrend } from "@/utils/analyticsEngine";
import type { StockRecord, StockSymbol } from "@/types";

type MetricDef = {
  label: string;
  hint: string;
  value: (stock: StockRecord) => number;
  display: (stock: StockRecord) => string;
  higherBetter: boolean;
};

const metrics: MetricDef[] = [
  { label: "السعر", hint: "الأقل قد يعطي هامش دخول أفضل", value: (s) => s.prices.last, display: (s) => formatCurrency(s.prices.last), higherBetter: false },
  { label: "التغير اليومي", hint: "زخم الجلسة الحالية", value: (s) => s.prices.changePercent, display: (s) => formatPercent(s.prices.changePercent), higherBetter: true },
  { label: "قيمة التداول", hint: "سيولة واهتمام السوق", value: (s) => s.prices.tradeValue, display: (s) => formatCurrencyFull(s.prices.tradeValue), higherBetter: true },
  { label: "P/E", hint: "الأقل أفضل عند تساوي الجودة", value: (s) => s.fundamentals.pe, display: (s) => formatNumber(s.fundamentals.pe), higherBetter: false },
  { label: "EPS", hint: "ربحية السهم", value: (s) => s.fundamentals.eps, display: (s) => formatNumber(s.fundamentals.eps), higherBetter: true },
  { label: "ROE", hint: "كفاءة حقوق الملكية", value: (s) => s.fundamentals.roe, display: (s) => formatPercent(s.fundamentals.roe), higherBetter: true },
  { label: "نمو الإيرادات", hint: "مسار التشغيل", value: (s) => s.fundamentals.revenueGrowth, display: (s) => formatPercent(s.fundamentals.revenueGrowth), higherBetter: true },
  { label: "نمو الربح", hint: "جودة التوسع", value: (s) => s.fundamentals.netProfitGrowth, display: (s) => formatPercent(s.fundamentals.netProfitGrowth), higherBetter: true },
  { label: "العائد النقدي", hint: "دخل توزيعات متوقع", value: (s) => s.fundamentals.dividendYield, display: (s) => formatPercent(s.fundamentals.dividendYield), higherBetter: true },
  { label: "نسبة التوزيع", hint: "الأقل أكثر راحة للاستدامة", value: (s) => s.fundamentals.payoutRatio, display: (s) => formatPercent(s.fundamentals.payoutRatio), higherBetter: false },
  { label: "الصحة المالية", hint: "درجة مركبة من 100", value: (s) => calculateFinancialHealthScore(s).score, display: (s) => `${calculateFinancialHealthScore(s).score}/100`, higherBetter: true },
  { label: "استدامة التوزيع", hint: "توازن التوزيع والتدفقات", value: (s) => calculateDividendSustainability(s).score, display: (s) => `${calculateDividendSustainability(s).rating} · ${calculateDividendSustainability(s).score}/100`, higherBetter: true },
];

export function Compare() {
  const [leftSymbol, setLeftSymbol] = useState<StockSymbol>("DEWA");
  const [rightSymbol, setRightSymbol] = useState<StockSymbol>("EMAAR");
  const left = stocksData.find((stock) => stock.symbol === leftSymbol) ?? stocksData[0];
  const right = stocksData.find((stock) => stock.symbol === rightSymbol) ?? stocksData[1];

  const score = useMemo(() => {
    return metrics.reduce(
      (acc, metric) => {
        const winner = winnerFor(metric, left, right);
        if (winner === "left") acc.left += 1;
        if (winner === "right") acc.right += 1;
        if (winner === "tie") acc.tie += 1;
        return acc;
      },
      { left: 0, right: 0, tie: 0 },
    );
  }, [left, right]);

  const leadingStock = score.left === score.right ? null : score.left > score.right ? left : right;

  return (
    <div className="view-fade grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="fusion-panel overflow-hidden rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="market-chip">Head-to-head</span>
            <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-5xl">المقارنة الذكية</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              اختر سهمين من أسواق الإمارات وشاهد التفوق حسب السيولة، التقييم، النمو، التوزيعات، والصحة المالية. الخلايا المضيئة تعني قراءة أقوى حسب قاعدة كل معيار.
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center">
            <ScorePill label={left.symbol} value={score.left} active={score.left > score.right} />
            <ScorePill label="تعادل" value={score.tie} active={score.left === score.right} />
            <ScorePill label={right.symbol} value={score.right} active={score.right > score.left} />
          </div>
        </div>
      </header>

      <section className="fusion-panel rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <Picker label="السهم الأول" value={leftSymbol} onChange={setLeftSymbol} />
          <div className="mx-auto hidden h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-400 text-white shadow-lg shadow-sky-500/20 lg:grid">
            <ArrowLeftRight size={21} aria-hidden />
          </div>
          <Picker label="السهم الثاني" value={rightSymbol} onChange={setRightSymbol} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.55fr_1fr] xl:items-stretch">
        <FaceoffCard stock={left} align="right" score={score.left} />
        <div className="fusion-panel flex flex-col items-center justify-center rounded-lg p-4 text-center">
          <Scale className="text-sky-500" size={28} aria-hidden />
          <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">نتيجة النموذج</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{leadingStock ? leadingStock.symbol : "متوازن"}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {leadingStock
              ? `يتفوق ${leadingStock.nameAr} في ${Math.max(score.left, score.right)} من ${metrics.length} معايير.`
              : "السهمان متقاربان في القراءة المركبة، لذلك راقب القطاع والسيولة قبل القرار."}
          </p>
        </div>
        <FaceoffCard stock={right} align="left" score={score.right} />
      </section>

      <section className="fusion-panel overflow-hidden rounded-lg p-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">جدول التفوق</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">قاعدة الأفضلية تتغير حسب طبيعة المؤشر.</p>
          </div>
          <Trophy className="text-amber-400" size={22} aria-hidden />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="border-b border-white/10 px-4 py-3 text-right font-black">المعيار</th>
                <th className="border-b border-white/10 px-4 py-3 text-right font-black">{left.symbol}</th>
                <th className="border-b border-white/10 px-4 py-3 text-right font-black">{right.symbol}</th>
                <th className="border-b border-white/10 px-4 py-3 text-right font-black">القاعدة</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const winner = winnerFor(metric, left, right);
                return (
                  <tr key={metric.label} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">{metric.label}</p>
                    </td>
                    <CompareCell win={winner === "left"}>{metric.display(left)}</CompareCell>
                    <CompareCell win={winner === "right"}>{metric.display(right)}</CompareCell>
                    <td className="px-4 py-4 text-xs font-bold leading-6 text-slate-500">{metric.hint}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Picker({ label, value, onChange }: { label: string; value: StockSymbol; onChange: (value: StockSymbol) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-600">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value as StockSymbol)} className="min-h-12 rounded-lg border px-3">
        {stocksData.map((stock) => (
          <option key={stock.symbol} value={stock.symbol}>
            {stock.symbol} - {stock.nameAr}
          </option>
        ))}
      </select>
    </label>
  );
}

function FaceoffCard({ stock, align, score }: { stock: StockRecord; align: "right" | "left"; score: number }) {
  const health = calculateFinancialHealthScore(stock);
  const trend = getExpectedTrend(stock);
  const dividend = calculateDividendSustainability(stock);

  return (
    <article className="interactive-card fusion-panel rounded-lg p-4">
      <div className={`flex items-start gap-3 ${align === "left" ? "xl:flex-row-reverse xl:text-left" : ""}`}>
        <span className="stock-avatar text-base" style={{ background: avatarGradient(stock.symbol) }}>{stock.symbol.slice(0, 2)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-500">{stock.market} · {stock.sector}</p>
          <h2 className="mt-1 truncate text-2xl font-black text-slate-950">{stock.nameAr}</h2>
          <p className="mt-1 font-bold text-slate-500">{stock.symbol} · {stock.nameEn}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Mini label="نقاط التفوق" value={`${score}/${metrics.length}`} />
        <Mini label="الاتجاه" value={trend.direction} />
        <Mini label="الصحة" value={`${health.score}/100`} />
        <Mini label="التوزيع" value={`${dividend.score}/100`} />
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-400" size={18} aria-hidden />
          <p className="text-sm font-black text-slate-950">{formatCurrency(stock.prices.last)}</p>
          <span className={stock.prices.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}>{formatPercent(stock.prices.changePercent)}</span>
        </div>
        <p className="mt-2 text-xs font-bold leading-6 text-slate-500">
          هدف داخلي أساسي {formatCurrency(stock.modelTarget.base)}، وعائد نقدي {formatPercent(stock.fundamentals.dividendYield)}.
        </p>
      </div>
    </article>
  );
}

function CompareCell({ win, children }: { win: boolean; children: ReactNode }) {
  return (
    <td className={`number px-4 py-4 font-black transition ${win ? "bg-emerald-500/15 text-emerald-500 shadow-[inset_3px_0_0_rgba(16,185,129,0.75)]" : "text-slate-800"}`}>
      {children}
    </td>
  );
}

function ScorePill({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${active ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-500" : "border-white/10 bg-white/5 text-slate-600"}`}>
      <p className="text-xs font-black">{label}</p>
      <p className="number mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/5 p-3">
      <span className="block text-xs font-black text-slate-500">{label}</span>
      <span className="number mt-1 block font-black text-slate-950">{value}</span>
    </span>
  );
}

function winnerFor(metric: MetricDef, left: StockRecord, right: StockRecord) {
  const leftValue = metric.value(left);
  const rightValue = metric.value(right);
  if (Math.abs(leftValue - rightValue) < 0.0001) return "tie" as const;
  if (metric.higherBetter) return leftValue > rightValue ? "left" as const : "right" as const;
  return leftValue < rightValue ? "left" as const : "right" as const;
}

function avatarGradient(symbol: string) {
  const palettes = [
    "linear-gradient(135deg, #0ea5e9, #10b981)",
    "linear-gradient(135deg, #6366f1, #06b6d4)",
    "linear-gradient(135deg, #14b8a6, #84cc16)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
  ];
  const index = symbol.charCodeAt(0) % palettes.length;
  return palettes[index];
}
