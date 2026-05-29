"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Calculator, Gauge, Landmark, ShieldCheck } from "lucide-react";
import { stocksData } from "@/data/stocksData";
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent } from "@/lib/format";
import { calculateDividendSustainability, calculateFinancialHealthScore } from "@/utils/analyticsEngine";
import type { StockSymbol } from "@/types";

export function SafetyCalculator() {
  const [symbol, setSymbol] = useState<StockSymbol>("DEWA");
  const [targetIncome, setTargetIncome] = useState("12000");
  const [maxConcentration, setMaxConcentration] = useState("40");
  const stock = stocksData.find((item) => item.symbol === symbol) ?? stocksData[0];

  const result = useMemo(() => {
    const income = Math.max(Number(targetIncome) || 0, 0);
    const concentration = Math.max(Number(maxConcentration) || 1, 1);
    const sharesNeeded = stock.dividend.annualDividend > 0 ? Math.ceil(income / stock.dividend.annualDividend) : 0;
    const capitalRequired = sharesNeeded * stock.prices.last;
    const portfolioSizeForConcentration = capitalRequired / (concentration / 100);
    const annualYield = capitalRequired > 0 ? (income / capitalRequired) * 100 : 0;
    return { income, concentration, sharesNeeded, capitalRequired, portfolioSizeForConcentration, annualYield };
  }, [maxConcentration, stock, targetIncome]);

  const health = calculateFinancialHealthScore(stock);
  const dividend = calculateDividendSustainability(stock);
  const payoutRisk = stock.fundamentals.payoutRatio >= 85;
  const concentrationRisk = result.concentration > 40;

  return (
    <div className="view-fade grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="fusion-panel rounded-lg p-5">
        <span className="market-chip">Target Yield · Shares Safety</span>
        <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-5xl">حاسبة الأمان</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          احسب عدد الأسهم ورأس المال المطلوب لتحقيق دخل سنوي مستهدف، مع قراءة فورية لمخاطر التوزيع وسقف التركيز داخل المحفظة.
        </p>
      </header>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="fusion-panel rounded-lg p-4">
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="text-sky-500" size={21} aria-hidden />
            <h2 className="text-xl font-black text-slate-950">المدخلات</h2>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-black text-slate-600">
              السهم
              <select value={symbol} onChange={(event) => setSymbol(event.target.value as StockSymbol)} className="min-h-12 rounded-lg border px-3">
                {stocksData.map((item) => (
                  <option key={item.symbol} value={item.symbol}>
                    {item.symbol} - {item.nameAr}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black text-slate-600">
              الدخل السنوي المستهدف
              <input value={targetIncome} onChange={(event) => setTargetIncome(event.target.value)} className="number min-h-12 rounded-lg border px-3" inputMode="decimal" />
            </label>

            <label className="grid gap-2 text-sm font-black text-slate-600">
              حد التركيز الأقصى %
              <input value={maxConcentration} onChange={(event) => setMaxConcentration(event.target.value)} className="number min-h-12 rounded-lg border px-3" inputMode="decimal" />
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <span className="stock-avatar" style={{ background: avatarGradient(stock.symbol) }}>{stock.symbol.slice(0, 2)}</span>
              <div>
                <h3 className="font-black text-slate-950">{stock.nameAr}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">{stock.symbol} · {stock.market} · {stock.sector}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Mini label="السعر" value={formatCurrency(stock.prices.last)} />
              <Mini label="التوزيع" value={formatCurrency(stock.dividend.annualDividend)} />
              <Mini label="العائد" value={formatPercent(stock.fundamentals.dividendYield)} />
            </div>
          </div>
        </div>

        <div className="fusion-panel rounded-lg p-4">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={22} aria-hidden />
            <h2 className="text-xl font-black text-slate-950">نتيجة الأمان</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Landmark size={18} aria-hidden />} label="الأسهم المطلوبة" value={formatNumber(result.sharesNeeded)} />
            <Metric icon={<Calculator size={18} aria-hidden />} label="رأس المال المطلوب" value={formatCurrencyFull(result.capitalRequired)} />
            <Metric icon={<Gauge size={18} aria-hidden />} label="حجم محفظة مقترح" value={formatCurrencyFull(result.portfolioSizeForConcentration)} />
            <Metric icon={<ShieldCheck size={18} aria-hidden />} label="العائد المحسوب" value={formatPercent(result.annualYield)} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Notice title="الصحة المالية" value={`${health.band} · ${health.score}/100`} />
            <Notice title="استدامة التوزيع" value={`${dividend.rating} · ${dividend.score}/100`} />
            <Notice title="نسبة التوزيع" value={formatPercent(stock.fundamentals.payoutRatio)} />
          </div>

          <div className="mt-4 grid gap-3">
            <Alert
              tone={payoutRisk ? "rose" : "emerald"}
              title={payoutRisk ? "تنبيه توزيعات" : "توزيع مريح نسبيا"}
              text={
                payoutRisk
                  ? "نسبة التوزيع مرتفعة؛ لا تعتمد على العائد وحده دون متابعة التدفقات النقدية والأرباح."
                  : "نسبة التوزيع ضمن نطاق أكثر راحة مقارنة بباقي الأسهم في هذه اللقطة."
              }
            />
            <Alert
              tone={concentrationRisk ? "amber" : "sky"}
              title={concentrationRisk ? "تركيز مرتفع" : "تركيز منضبط"}
              text={
                concentrationRisk
                  ? "حد التركيز المختار أعلى من 40%. الخطة الأصلية تعتبر 40% سقف تنبيه للمحفظة."
                  : "حد التركيز المختار متوافق مع تنبيه 40% للمحفظة."
              }
            />
            {result.capitalRequired === 0 ? (
              <Alert tone="amber" title="مدخلات ناقصة" text="أدخل دخلا مستهدفا أكبر من صفر حتى تظهر الحسابات بصورة مفيدة." />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="interactive-card rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="mb-3 inline-grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-500">{icon}</div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="number mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg bg-white/5 p-2">
      <span className="block text-xs font-black text-slate-500">{label}</span>
      <span className="number mt-1 block font-black text-slate-950">{value}</span>
    </span>
  );
}

function Notice({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-black text-slate-500">{title}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

function Alert({ tone, title, text }: { tone: "rose" | "emerald" | "amber" | "sky"; title: string; text: string }) {
  const classes = {
    rose: "border-rose-400/30 bg-rose-500/10 text-rose-500",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-500",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-500",
    sky: "border-sky-400/30 bg-sky-500/10 text-sky-500",
  }[tone];

  return (
    <div className={`rounded-lg border p-3 ${classes}`}>
      <div className="flex items-center gap-2 font-black">
        <AlertTriangle size={17} aria-hidden />
        {title}
      </div>
      <p className="mt-2 text-sm font-bold leading-7 text-slate-600">{text}</p>
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
