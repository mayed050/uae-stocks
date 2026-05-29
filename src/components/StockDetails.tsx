"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, CalendarDays, ExternalLink, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { formatCurrency, formatCurrencyFull, formatDate, formatNumber, formatPercent, percentClass } from "@/lib/format";
import {
  calculateDividendSustainability,
  calculateFinancialHealthScore,
  getExpectedTrend,
  healthClass,
} from "@/utils/analyticsEngine";
import type { StockRecord } from "@/types";

type Period = "3M" | "6M" | "12M";

const tooltipStyle = {
  background: "var(--surface-strong)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--foreground)",
  boxShadow: "0 18px 50px rgba(2, 6, 23, 0.22)",
};

export function StockDetails({ stock }: { stock: StockRecord }) {
  const [period, setPeriod] = useState<Period>("12M");
  const health = calculateFinancialHealthScore(stock);
  const trend = getExpectedTrend(stock);
  const dividend = calculateDividendSustainability(stock);
  const history = useMemo(() => {
    const size = period === "3M" ? 3 : period === "6M" ? 6 : 12;
    return stock.historicalPrices.slice(-size);
  }, [period, stock.historicalPrices]);

  return (
    <div className="view-fade grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <Link href="/stocks" className="inline-flex w-fit items-center gap-2 text-sm font-black text-sky-500 hover:underline">
        <ArrowRight size={16} aria-hidden />
        العودة إلى مستكشف الأسهم
      </Link>

      <header className="fusion-panel overflow-hidden rounded-lg p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge>{stock.market}</Badge>
              <Badge>{stock.sector}</Badge>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${healthClass(health.score)}`}>
                صحة {health.band} · {health.score}/100
              </span>
            </div>

            <div className="mt-5 flex items-start gap-4">
              <span className="stock-avatar h-16 w-16 text-xl" style={{ background: avatarGradient(stock.symbol) }}>{stock.symbol.slice(0, 2)}</span>
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-black text-slate-950 md:text-5xl">{stock.nameAr}</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">{stock.symbol} · {stock.nameEn}</p>
              </div>
            </div>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">{stock.profile}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
            <a
              href={stock.officialUrls.marketProfile}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-black text-slate-700 hover:bg-sky-500/10"
            >
              صفحة السوق
              <ExternalLink size={16} aria-hidden />
            </a>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-black text-slate-500">آخر تحديث</p>
              <p className="mt-1 font-black text-slate-950">{formatDate(stock.prices.lastUpdated)}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<TrendingUp size={18} aria-hidden />} label="السعر" value={formatCurrency(stock.prices.last)} hint={formatCurrencyFull(stock.prices.tradeValue)} />
        <Metric icon={<TrendingUp size={18} aria-hidden />} label="التغير" value={formatPercent(stock.prices.changePercent)} hint={formatCurrency(stock.prices.change)} tone={percentClass(stock.prices.changePercent)} />
        <Metric icon={<CalendarDays size={18} aria-hidden />} label="العائد النقدي" value={formatPercent(stock.fundamentals.dividendYield)} hint={dividend.rating} />
        <Metric icon={<ShieldCheck size={18} aria-hidden />} label="الاتجاه 3 أشهر" value={trend.direction} hint={`درجة ${trend.score}`} />
      </section>

      <section className="fusion-panel rounded-lg p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">رسوم مترابطة</h2>
            <p className="mt-1 text-sm text-slate-500">تغيير الفترة ينعكس على السعر والحجم في نفس اللحظة.</p>
          </div>
          <div className="flex gap-2">
            {(["3M", "6M", "12M"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`min-h-10 rounded-lg px-4 text-sm font-black ${
                  period === item ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "border border-white/10 bg-white/5 text-slate-700 hover:bg-sky-500/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title="السعر">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`priceFill-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} domain={["auto", "auto"]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                <Area isAnimationActive={false} type="monotone" dataKey="price" name="السعر" stroke="#0ea5e9" strokeWidth={3} fill={`url(#priceFill-${stock.symbol})`} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="الحجم">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatNumber(Number(value))} />
                <Bar isAnimationActive={false} dataKey="volume" name="الحجم" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="التوزيعات التاريخية">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stock.historicalDividends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="fiscalYear" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                <Line isAnimationActive={false} type="monotone" dataKey="amount" name="التوزيع" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: "#0ea5e9" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="الإيرادات وصافي الربح">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[{ label: "آخر 12 شهر", revenue: stock.fundamentals.revenueAED, profit: stock.fundamentals.netProfitAED }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrencyFull(Number(value))} />
                <Bar isAnimationActive={false} dataKey="revenue" name="الإيرادات" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="profit" name="صافي الربح" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="fusion-panel rounded-lg p-4">
          <div className="mb-4 flex items-center gap-2">
            <Target className="text-sky-500" size={20} aria-hidden />
            <h2 className="text-xl font-black text-slate-950">نطاق القيمة الداخلي</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Mini label="منخفض" value={formatCurrency(stock.modelTarget.low)} />
            <Mini label="أساسي" value={formatCurrency(stock.modelTarget.base)} />
            <Mini label="مرتفع" value={formatCurrency(stock.modelTarget.high)} />
          </div>
          <p className="mt-4 rounded-lg border border-sky-400/25 bg-sky-500/10 p-3 text-sm leading-7 text-slate-600">
            {stock.modelTarget.sourceNote} العائد المتوقع على السعر الأساسي:{" "}
            <strong className={percentClass(stock.modelTarget.upsidePercent)}>{formatPercent(stock.modelTarget.upsidePercent)}</strong>.
          </p>
        </div>

        <div className="fusion-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">المؤشرات المالية</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Mini label="P/E" value={formatNumber(stock.fundamentals.pe)} />
            <Mini label="EPS" value={formatNumber(stock.fundamentals.eps)} />
            <Mini label="ROE" value={formatPercent(stock.fundamentals.roe)} />
            <Mini label="نمو الإيرادات" value={formatPercent(stock.fundamentals.revenueGrowth)} />
            <Mini label="نمو الربح" value={formatPercent(stock.fundamentals.netProfitGrowth)} />
            <Mini label="نسبة التوزيع" value={formatPercent(stock.fundamentals.payoutRatio)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <SwotColumn title="القوة" items={stock.swot.strengths} tone="emerald" />
        <SwotColumn title="الضعف" items={stock.swot.weaknesses} tone="amber" />
        <SwotColumn title="الفرص" items={stock.swot.opportunities} tone="sky" />
        <SwotColumn title="المخاطر" items={stock.swot.threats} tone="rose" />
      </section>
    </div>
  );
}

function Metric({ icon, label, value, hint, tone = "text-slate-950" }: { icon: ReactNode; label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="interactive-card fusion-panel rounded-lg p-4">
      <div className="mb-3 inline-grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-500">{icon}</div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className={`number mt-2 text-xl font-black ${tone}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs font-bold text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <h3 className="mb-3 font-black text-slate-950">{title}</h3>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="number mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-700">{children}</span>;
}

function SwotColumn({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "amber" | "sky" | "rose" }) {
  const toneClass = {
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-500",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-500",
    sky: "border-sky-400/30 bg-sky-500/10 text-sky-500",
    rose: "border-rose-400/30 bg-rose-500/10 text-rose-500",
  }[tone];

  return (
    <div className="fusion-panel rounded-lg p-4">
      <h2 className={`mb-3 rounded-lg border px-3 py-2 text-center font-black ${toneClass}`}>{title}</h2>
      <ul className="grid gap-2 text-sm leading-7 text-slate-600">
        {items.map((item) => (
          <li key={item} className="rounded-lg border border-white/10 bg-white/5 p-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function avatarGradient(symbol: string) {
  const palettes = [
    "linear-gradient(135deg, #0ea5e9, #10b981)",
    "linear-gradient(135deg, #6366f1, #06b6d4)",
    "linear-gradient(135deg, #14b8a6, #84cc16)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
  ];
  return palettes[symbol.charCodeAt(0) % palettes.length];
}
