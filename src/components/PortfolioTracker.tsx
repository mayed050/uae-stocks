"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { stocksData } from "@/data/stocksData";
import { formatCurrency, formatCurrencyFull, formatNumber, percentClass } from "@/lib/format";
import {
  HOLDINGS_STORAGE_KEY,
  calculatePortfolioMetrics,
  runStressTest,
  simulateDrip,
} from "@/utils/analyticsEngine";
import type { PortfolioHolding, StockSymbol } from "@/types";

const colors = ["#0f6aa8", "#10b981", "#f59e0b", "#e11d48", "#6366f1", "#14b8a6", "#8b5cf6", "#84cc16"];

type BackupFile = {
  version: 1;
  exportedAt: string;
  holdings: PortfolioHolding[];
};

export function PortfolioTracker() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [symbol, setSymbol] = useState<StockSymbol>("DEWA");
  const [shares, setShares] = useState("1000");
  const [averageCost, setAverageCost] = useState("2.60");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [dripSymbol, setDripSymbol] = useState<StockSymbol>("DEWA");
  const fileInput = useRef<HTMLInputElement | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(HOLDINGS_STORAGE_KEY);
      hydrated.current = true;
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as PortfolioHolding[];
        const restored = validateHoldings(parsed);
        setHoldings(restored);
        if (restored[0]?.symbol) setDripSymbol(restored[0].symbol);
      } catch {
        setMessage("تعذر قراءة بيانات المحفظة المخزنة محليا.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const metrics = useMemo(() => calculatePortfolioMetrics(holdings, stocksData), [holdings]);
  const stress = useMemo(() => runStressTest(holdings, stocksData), [holdings]);
  const selectedDripStock = stocksData.find((stock) => stock.symbol === dripSymbol) ?? stocksData[0];
  const selectedShares = holdings.find((holding) => holding.symbol === selectedDripStock.symbol)?.shares ?? (Number(shares) || 0);
  const drip = simulateDrip(selectedDripStock, selectedShares, 10, 0);
  const cashflow = buildCashflow(holdings);

  function addHolding() {
    const shareValue = Number(shares);
    const costValue = Number(averageCost);
    if (!Number.isFinite(shareValue) || shareValue <= 0 || !Number.isFinite(costValue) || costValue < 0) {
      setMessage("أدخل عدد أسهم وتكلفة صحيحة.");
      return;
    }
    const stock = stocksData.find((item) => item.symbol === symbol);
    if (!stock) return;
    if (editingId) {
      setHoldings((current) =>
        current.map((holding) =>
          holding.id === editingId
            ? {
                ...holding,
                symbol,
                shares: shareValue,
                averageCost: costValue,
              }
            : holding,
        ),
      );
      setEditingId(null);
      setDripSymbol(symbol);
      setMessage(`تم تحديث ${stock.nameAr} في المحفظة.`);
      return;
    }
    setHoldings((current) => [
      ...current,
      {
        id: createId(),
        symbol,
        shares: shareValue,
        averageCost: costValue,
        addedAt: new Date().toISOString(),
      },
    ]);
    setDripSymbol(symbol);
    setMessage(`تمت إضافة ${stock.nameAr} إلى المحفظة.`);
  }

  function startEdit(holding: PortfolioHolding) {
    setEditingId(holding.id);
    setSymbol(holding.symbol);
    setShares(String(holding.shares));
    setAverageCost(String(holding.averageCost));
    setMessage("يمكنك تعديل بيانات الأصل ثم حفظ التعديل.");
  }

  function cancelEdit() {
    setEditingId(null);
    setMessage("");
  }

  function removeHolding(id: string) {
    setHoldings((current) => current.filter((holding) => holding.id !== id));
    if (editingId === id) cancelEdit();
  }

  function exportBackup() {
    const payload: BackupFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      holdings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `emirati-capital-holdings-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("تم تصدير نسخة JSON من المحفظة.");
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.holdings)) {
        throw new Error("Invalid schema");
      }
      const restored = validateHoldings(parsed.holdings);
      setHoldings(restored);
      if (restored[0]?.symbol) setDripSymbol(restored[0].symbol);
      setMessage(`تم استيراد ${restored.length} أصل من النسخة الاحتياطية.`);
    } catch {
      setMessage("ملف الاستيراد غير صالح. الصيغة المطلوبة: version 1 و holdings صحيحة.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="glass-panel rounded-lg p-5">
        <p className="text-sm font-black text-sky-700">LocalStorage · JSON Backup</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">متتبع المحفظة</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          أضف ملكياتك محليا، راقب التدفقات الشهرية، واختبر أثر هبوط 10% و20% و30% دون إرسال بياناتك إلى خادم.
        </p>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">إضافة أصل</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <label className="grid gap-1 text-sm font-black text-slate-600">
              السهم
              <select value={symbol} onChange={(event) => setSymbol(event.target.value as StockSymbol)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3">
                {stocksData.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.nameAr}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-600">
              عدد الأسهم
              <input value={shares} onChange={(event) => setShares(event.target.value)} className="number min-h-11 rounded-lg border border-slate-200 bg-white px-3" inputMode="decimal" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-600">
              متوسط التكلفة
              <input value={averageCost} onChange={(event) => setAverageCost(event.target.value)} className="number min-h-11 rounded-lg border border-slate-200 bg-white px-3" inputMode="decimal" />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={addHolding} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 font-black text-white hover:bg-sky-800 sm:w-auto">
              {editingId ? <Pencil size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
              {editingId ? "حفظ التعديل" : "إضافة"}
            </button>
            {editingId ? (
              <button type="button" onClick={cancelEdit} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 font-black text-slate-700 hover:bg-slate-50 sm:w-auto">
                <X size={18} aria-hidden />
                إلغاء
              </button>
            ) : null}
          </div>
          {message ? <p className="mt-3 rounded-lg bg-sky-50 p-3 text-sm font-bold text-sky-900">{message}</p> : null}
        </div>

        <div className="glass-panel rounded-lg p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-slate-950">نسخ احتياطي واستعادة</h2>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <button type="button" onClick={exportBackup} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-sky-50">
                <Download size={17} aria-hidden />
                Export JSON
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-sky-50">
                <Upload size={17} aria-hidden />
                Import JSON
              </button>
              <button type="button" onClick={() => setHoldings([])} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-black text-rose-700 hover:bg-rose-100">
                <RotateCcw size={17} aria-hidden />
                تصفير
              </button>
            </div>
            <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={(event) => void importBackup(event.target.files?.[0])} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric label="القيمة السوقية" value={formatCurrencyFull(metrics.marketValue)} />
            <Metric label="التكلفة" value={formatCurrencyFull(metrics.totalCost)} />
            <Metric label="الربح/الخسارة" value={formatCurrencyFull(metrics.unrealizedPnL)} tone={percentClass(metrics.unrealizedPnL)} />
            <Metric label="دخل سنوي" value={formatCurrencyFull(metrics.annualIncome)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">الأصول</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-slate-500">
                <tr>
                  {["السهم", "الأسهم", "التكلفة", "السعر", "القيمة", "الدخل السنوي", ""].map((heading) => (
                    <th key={heading} className="border-b border-slate-200 px-3 py-2 text-right font-black">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => {
                  const stock = stocksData.find((item) => item.symbol === holding.symbol);
                  if (!stock) return null;
                  return (
                    <tr key={holding.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-black text-slate-900">{stock.symbol}<div className="text-xs text-slate-500">{stock.nameAr}</div></td>
                      <td className="number px-3 py-3">{formatNumber(holding.shares)}</td>
                      <td className="number px-3 py-3">{formatCurrency(holding.averageCost)}</td>
                      <td className="number px-3 py-3">{formatCurrency(stock.prices.last)}</td>
                      <td className="number px-3 py-3 font-black">{formatCurrencyFull(holding.shares * stock.prices.last)}</td>
                      <td className="number px-3 py-3">{formatCurrencyFull(holding.shares * stock.dividend.annualDividend)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(holding)} className="grid h-9 w-9 place-items-center rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50" aria-label="تعديل الأصل">
                            <Pencil size={16} aria-hidden />
                          </button>
                          <button type="button" onClick={() => removeHolding(holding.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50" aria-label="حذف الأصل">
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!holdings.length ? <p className="py-8 text-center text-sm font-bold text-slate-500">لم تتم إضافة أصول بعد.</p> : null}
          </div>
        </div>

        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">توزيع المحفظة</h2>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={288}>
              <PieChart>
                <Pie data={metrics.allocation} dataKey="value" nameKey="symbol" innerRadius={58} outerRadius={98} paddingAngle={3}>
                  {metrics.allocation.map((entry, index) => (
                    <Cell key={entry.symbol} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2">
            {metrics.allocation.map((item, index) => (
              <div key={item.symbol} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-black text-slate-800">
                  <span className="h-3 w-3 rounded-full" style={{ background: colors[index % colors.length] }} />
                  {item.symbol}
                </span>
                <span className="number font-black text-slate-900">{item.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          {metrics.concentrationAlerts.map((alert) => (
            <p key={alert.id} className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{alert.message}</p>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">التدفق النقدي الشهري</h2>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={cashflow}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
                <Bar dataKey="income" name="توزيعات" fill="#0f6aa8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-slate-950">محاكاة DRIP</h2>
            <select value={dripSymbol} onChange={(event) => setDripSymbol(event.target.value as StockSymbol)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold">
              {stocksData.map((stock) => (
                <option key={stock.symbol} value={stock.symbol}>{stock.symbol}</option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={drip}>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
                <Line dataKey="portfolioValue" name="قيمة المحفظة" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-lg p-4">
        <h2 className="text-xl font-black text-slate-950">اختبار الضغط</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {stress.map((scenario) => (
            <div key={scenario.dropPercent} className="rounded-lg border border-rose-100 bg-rose-50/70 p-4">
              <p className="text-sm font-black text-rose-700">هبوط {scenario.dropPercent}%</p>
              <p className="number mt-2 text-xl font-black text-slate-950">{formatCurrencyFull(scenario.portfolioValue)}</p>
              <p className="mt-1 text-sm font-bold text-rose-700">خسارة {formatCurrencyFull(scenario.lossValue)}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">دخل سنوي بعد الضغط: {formatCurrencyFull(scenario.annualIncomeAfterDrop)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "text-slate-950" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className={`number mt-1 text-lg font-black ${tone}`}>{value}</p>
    </div>
  );
}

function buildCashflow(holdings: PortfolioHolding[]) {
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"].map((month) => ({ month, income: 0 }));
  for (const holding of holdings) {
    const stock = stocksData.find((item) => item.symbol === holding.symbol);
    if (!stock) continue;
    const monthIndex = new Date(`${stock.dividend.paymentDate}T00:00:00Z`).getUTCMonth();
    months[monthIndex].income += holding.shares * stock.dividend.lastAmount;
  }
  return months.map((month) => ({ ...month, income: Number(month.income.toFixed(2)) }));
}

function validateHoldings(value: unknown): PortfolioHolding[] {
  if (!Array.isArray(value)) throw new Error("Holdings must be an array");
  return value.map((item) => {
    const holding = item as PortfolioHolding;
    const stockExists = stocksData.some((stock) => stock.symbol === holding.symbol);
    if (!stockExists || !Number.isFinite(holding.shares) || holding.shares <= 0 || !Number.isFinite(holding.averageCost) || holding.averageCost < 0) {
      throw new Error("Invalid holding");
    }
    return {
      id: holding.id || createId(),
      symbol: holding.symbol,
      shares: holding.shares,
      averageCost: holding.averageCost,
      addedAt: holding.addedAt || new Date().toISOString(),
    };
  });
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `holding-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
