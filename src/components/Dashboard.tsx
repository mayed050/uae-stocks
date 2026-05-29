"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Calculator, FileText, GitCompare, PieChart as PieIcon } from "lucide-react";
import { DATASET_INFO, stocksData } from "@/data/stocksData";
import { formatCurrency, formatNumber, formatPercent, percentClass } from "@/lib/format";
import {
  buildSmartAlerts,
  calculateDividendSustainability,
  calculateFinancialHealthScore,
  getExpectedTrend,
} from "@/utils/analyticsEngine";
import type { StockRecord } from "@/types";

const chartColors = ["#3aa0ff", "#21c98b", "#7c5cff", "#ffb020", "#ff5a72", "#14b8a6", "#8b5cf6", "#84cc16"];
const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const quickActions = [
  { href: "/portfolio", label: "حاسبة المحفظة", hint: "توزيع، دخل نقدي، DRIP وضغط", icon: PieIcon },
  { href: "/calculator", label: "حاسبة الأمان", hint: "هدف العائد وعدد الأسهم", icon: Calculator },
  { href: "/compare", label: "المقارنة", hint: "قواعد تمييز تلقائية", icon: GitCompare },
  { href: "/report", label: "تقرير PDF", hint: "تنسيق جاهز للطباعة", icon: FileText },
];

export function Dashboard() {
  const alerts = buildSmartAlerts(stocksData).slice(0, 10);
  const totalValue = stocksData.reduce((sum, stock) => sum + stock.prices.tradeValue, 0);
  const totalMarketCap = stocksData.reduce((sum, stock) => sum + stock.prices.marketCap, 0);
  const avgYield = stocksData.reduce((sum, stock) => sum + stock.fundamentals.dividendYield, 0) / stocksData.length;
  const dfmCount = stocksData.filter((stock) => stock.market === "DFM").length;
  const adxCount = stocksData.filter((stock) => stock.market === "ADX").length;
  const gainers = [...stocksData].sort((a, b) => b.prices.changePercent - a.prices.changePercent).slice(0, 4);
  const losers = [...stocksData].sort((a, b) => a.prices.changePercent - b.prices.changePercent).slice(0, 4);
  const sectorData = groupBySector(stocksData);
  const topYields = [...stocksData]
    .sort((a, b) => b.fundamentals.dividendYield - a.fundamentals.dividendYield)
    .slice(0, 8)
    .map((stock) => ({ symbol: stock.symbol, yield: Number(stock.fundamentals.dividendYield.toFixed(2)) }));
  const peRanking = [...stocksData]
    .sort((a, b) => a.fundamentals.pe - b.fundamentals.pe)
    .slice(0, 10)
    .map((stock) => ({ symbol: stock.symbol, pe: Number(stock.fundamentals.pe.toFixed(2)) }));
  const monthlyDensity = buildMonthlyDensity(stocksData);
  const healthRows = stocksData
    .map((stock) => ({ stock, health: calculateFinancialHealthScore(stock), trend: getExpectedTrend(stock) }))
    .sort((a, b) => b.health.score - a.health.score);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <section className="fusion-panel overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="mb-5 rounded-xl border border-[color:var(--line)] bg-[color:var(--chip)] px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
          <strong className="text-[color:var(--foreground)]">تنويه:</strong> منصة معلوماتية للمتابعة فقط، مدمجة مع تجربة
          uae-stocks.vercel.app، ولا تتضمن أي توصية بالشراء أو البيع.
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr] xl:items-end">
          <div>
            <p className="text-sm font-black text-sky-500">لقطة ثابتة وليست أسعارا حية</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-[color:var(--foreground)] md:text-5xl">
              نظرة عامة على السوق
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[color:var(--muted)]">
              ملخص مالي لـ {stocksData.length} سهما في سوقي دبي وأبوظبي، يجمع تصميم منصة الأسهم الإماراتية مع قاعدة
              بيانات إماراتي كابيتال وتحليلات الصحة المالية والتوزيعات.
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-500">
              آخر تحديث داخلي: {DATASET_INFO.snapshotDate} · {dfmCount} دبي · {adxCount} أبوظبي
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <HeroMetric label="الأسهم المتابعة" value={formatNumber(stocksData.length)} hint={`${dfmCount} دبي · ${adxCount} أبوظبي`} />
            <HeroMetric label="متوسط العائد" value={formatPercent(avgYield)} hint="للأسهم المعلنة" />
            <HeroMetric label="القيمة السوقية" value={formatCurrency(totalMarketCap)} hint={`تداول اللقطة: ${formatCurrency(totalValue)}`} />
            <HeroMetric label="تنبيهات ذكية" value={formatNumber(alerts.length)} hint="استحقاقات وصحة مالية" tone="text-amber-500" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="fusion-panel group rounded-2xl p-4 hover:border-sky-400">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/12 text-sky-500 group-hover:bg-sky-500 group-hover:text-white">
              <action.icon size={21} aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-black text-[color:var(--foreground)]">{action.label}</h2>
            <p className="mt-1 text-sm font-semibold text-[color:var(--muted)]">{action.hint}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartPanel title="توزيع القطاعات">
          <ResponsiveContainer width="100%" height={285}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={98} paddingAngle={2} isAnimationActive={false}>
                {sectorData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} أسهم`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <Legend data={sectorData} />
        </ChartPanel>

        <ChartPanel title="أعلى العوائد النقدية (%)">
          <ResponsiveContainer width="100%" height={285}>
            <BarChart data={topYields} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
              <YAxis dataKey="symbol" type="category" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} width={82} />
              <Tooltip formatter={(value) => formatPercent(Number(value))} />
              <Bar dataKey="yield" fill="#21c98b" radius={[6, 6, 6, 6]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="مكرر الربحية الأقل">
          <ResponsiveContainer width="100%" height={285}>
            <AreaChart data={peRanking} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
              <XAxis dataKey="symbol" tick={{ fontSize: 11, fill: "var(--muted)" }} interval={0} angle={-28} textAnchor="end" height={58} axisLine={{ stroke: "var(--line)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
              <Tooltip formatter={(value) => formatNumber(Number(value))} />
              <Area type="monotone" dataKey="pe" stroke="#3aa0ff" strokeWidth={3} fill="#3aa0ff33" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="fusion-panel rounded-2xl p-4">
          <h2 className="text-lg font-black text-[color:var(--foreground)]">خريطة الصحة والعائد</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">لون الخلية يقرأ الصحة المالية، والنسبة تعرض العائد النقدي.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {healthRows.map(({ stock, health }) => (
              <Link
                key={stock.symbol}
                href={`/stocks/${stock.symbol}`}
                className="rounded-xl border border-[color:var(--line)] p-3 text-center transition hover:scale-[1.02]"
                style={{ background: heatColor(health.score) }}
              >
                <span className="block font-black text-white">{stock.symbol}</span>
                <span className="number mt-1 block text-sm font-black text-white">{health.score}/100</span>
                <span className="number mt-1 block text-xs font-bold text-white/82">{formatPercent(stock.fundamentals.dividendYield)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="fusion-panel rounded-2xl p-4">
          <h2 className="text-lg font-black text-[color:var(--foreground)]">كثافة تواريخ التوزيعات عبر السنة</h2>
          <ResponsiveContainer width="100%" height={292}>
            <BarChart data={monthlyDensity} margin={{ top: 15, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted)" }} interval={0} angle={-30} textAnchor="end" height={68} axisLine={{ stroke: "var(--line)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
              <Tooltip formatter={(value) => [`${value} حدث`, "توزيعات"]} />
              <Bar dataKey="count" fill="#ffb020" radius={[8, 8, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.95fr]">
        <Ranking title="الأكثر ارتفاعا" stocks={gainers} icon="up" />
        <Ranking title="الأكثر ضغطا" stocks={losers} icon="down" />
        <div className="fusion-panel rounded-2xl p-4">
          <h2 className="text-lg font-black text-[color:var(--foreground)]">أفضل 6 صحة مالية</h2>
          <div className="mt-4 grid gap-2">
            {healthRows.slice(0, 6).map(({ stock, health, trend }) => {
              const dividend = calculateDividendSustainability(stock);
              return (
                <Link key={stock.symbol} href={`/stocks/${stock.symbol}`} className="market-chip rounded-xl px-3 py-2 hover:border-sky-400">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block font-black text-[color:var(--foreground)]">{stock.symbol}</span>
                      <span className="block text-xs text-[color:var(--muted)]">{trend.direction} · {dividend.rating}</span>
                    </span>
                    <span className="number rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-black text-emerald-500">
                      {health.score}/100
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="fusion-panel rounded-2xl p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[color:var(--foreground)]">تنبيهات ذكية</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">استحقاقات، نشاط تداول، وصحة مالية من محرك التحليل الداخلي.</p>
          </div>
          <span className="rounded-full bg-sky-500/12 px-3 py-1 text-sm font-black text-sky-500">{alerts.length}</span>
        </div>
        <div className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {alerts.map((alert) => (
            <article key={alert.id} className="min-w-[280px] snap-start rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 shadow-sm">
              <p className="text-xs font-black text-sky-500">{alert.symbol ?? "DATA"}</p>
              <h3 className="mt-2 font-black text-[color:var(--foreground)]">{alert.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{alert.message}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ label, value, hint, tone = "text-[color:var(--foreground)]" }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 shadow-sm">
      <p className="text-xs font-bold text-[color:var(--muted)]">{label}</p>
      <p className={`number mt-2 text-xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-bold text-[color:var(--muted)]">{hint}</p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fusion-panel rounded-2xl p-4">
      <h2 className="text-lg font-black text-[color:var(--foreground)]">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Ranking({ title, stocks, icon }: { title: string; stocks: StockRecord[]; icon: "up" | "down" }) {
  const Icon = icon === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="fusion-panel rounded-2xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className={icon === "up" ? "text-emerald-500" : "text-rose-500"} size={20} aria-hidden />
        <h2 className="text-lg font-black text-[color:var(--foreground)]">{title}</h2>
      </div>
      <div className="grid gap-2">
        {stocks.map((stock) => (
          <Link key={stock.symbol} href={`/stocks/${stock.symbol}`} className="market-chip flex items-center justify-between rounded-xl px-3 py-2 hover:border-sky-400">
            <span>
              <span className="block font-black text-[color:var(--foreground)]">{stock.symbol}</span>
              <span className="block text-xs text-[color:var(--muted)]">{stock.nameAr}</span>
            </span>
            <span className={`number font-black ${percentClass(stock.prices.changePercent)}`}>{formatPercent(stock.prices.changePercent)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Legend({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-3">
      {data.map((item, index) => (
        <span key={item.name} className="inline-flex items-center gap-1 text-xs font-bold text-[color:var(--muted)]">
          <span className="h-3 w-3 rounded-sm" style={{ background: chartColors[index % chartColors.length] }} />
          {item.name} ({item.value})
        </span>
      ))}
    </div>
  );
}

function groupBySector(stocks: StockRecord[]) {
  const map = new Map<string, number>();
  for (const stock of stocks) map.set(stock.sector, (map.get(stock.sector) ?? 0) + 1);
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function buildMonthlyDensity(stocks: StockRecord[]) {
  const counts = Array.from({ length: 12 }, (_, index) => ({ month: months[index], count: 0 }));
  for (const stock of stocks) {
    for (const value of [stock.dividend.exDate, stock.dividend.paymentDate]) {
      const date = new Date(`${value}T00:00:00Z`);
      if (!Number.isNaN(date.getTime())) counts[date.getUTCMonth()].count += 1;
    }
  }
  return counts;
}

function heatColor(score: number) {
  if (score >= 80) return "linear-gradient(135deg, #047857, #21c98b)";
  if (score >= 68) return "linear-gradient(135deg, #0f6aa8, #3aa0ff)";
  if (score >= 55) return "linear-gradient(135deg, #b7791f, #ffb020)";
  return "linear-gradient(135deg, #be123c, #ff5a72)";
}
