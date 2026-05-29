"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Filter } from "lucide-react";
import { Badge, riskTone } from "@/components/ui/Badge";
import { percentClass, unavailableText } from "@/lib/format";
import type { StockSnapshot } from "@/lib/types";

type SortKey =
  | "symbol"
  | "market"
  | "price"
  | "daily"
  | "volume"
  | "tradeValue"
  | "marketCap"
  | "pe"
  | "eps"
  | "roe"
  | "yield"
  | "week"
  | "month"
  | "threeMonths"
  | "risk"
  | "entitlement";

const sortLabels: Record<SortKey, string> = {
  symbol: "الرمز",
  market: "السوق",
  price: "السعر",
  daily: "الأداء اليومي",
  volume: "حجم التداول",
  tradeValue: "قيمة التداول",
  marketCap: "القيمة السوقية",
  pe: "P/E",
  eps: "EPS",
  roe: "ROE",
  yield: "العائد النقدي",
  week: "أداء أسبوع",
  month: "أداء شهر",
  threeMonths: "أداء 3 أشهر",
  risk: "المخاطر",
  entitlement: "قرب الاستحقاق",
};

export function StocksTable({ stocks }: { stocks: StockSnapshot[] }) {
  const [market, setMarket] = useState("الكل");
  const [sector, setSector] = useState("الكل");
  const [trend, setTrend] = useState("الكل");
  const [risk, setRisk] = useState("الكل");
  const [sortKey, setSortKey] = useState<SortKey>("tradeValue");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");

  const sectors = useMemo(() => Array.from(new Set(stocks.map((stock) => stock.config.sector))), [stocks]);
  const trends = useMemo(() => Array.from(new Set(stocks.map((stock) => stock.analysis.trend.display))), [stocks]);
  const risks = useMemo(() => Array.from(new Set(stocks.map((stock) => stock.analysis.riskLevel))), [stocks]);

  const rows = useMemo(() => {
    return stocks
      .filter((stock) => market === "الكل" || stock.config.market === market)
      .filter((stock) => sector === "الكل" || stock.config.sector === sector)
      .filter((stock) => trend === "الكل" || stock.analysis.trend.display === trend)
      .filter((stock) => risk === "الكل" || stock.analysis.riskLevel === risk)
      .filter((stock) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return `${stock.config.symbol} ${stock.config.nameAr} ${stock.config.nameEn}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const left = valueForSort(a, sortKey);
        const right = valueForSort(b, sortKey);
        const result = compareNullable(left, right);
        return direction === "asc" ? result : -result;
      });
  }, [stocks, market, sector, trend, risk, sortKey, direction, query]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))]">
        <label className="grid gap-1 text-sm font-bold text-slate-600">
          بحث
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-slate-900 outline-none focus:border-blue-300"
            placeholder="اسم الشركة أو الرمز"
          />
        </label>
        <Select label="السوق" value={market} onChange={setMarket} options={["الكل", "DFM", "ADX"]} />
        <Select label="القطاع" value={sector} onChange={setSector} options={["الكل", ...sectors]} />
        <Select label="الاتجاه" value={trend} onChange={setTrend} options={["الكل", ...trends]} />
        <Select label="المخاطر" value={risk} onChange={setRisk} options={["الكل", ...risks]} />
        <div className="grid gap-1">
          <span className="flex items-center gap-1 text-sm font-bold text-slate-600">
            <Filter size={15} aria-hidden />
            الفرز
          </span>
          <div className="grid grid-cols-[1fr_42px] gap-2">
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-slate-900 outline-none focus:border-blue-300"
            >
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {sortLabels[key]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDirection((current) => (current === "asc" ? "desc" : "asc"))}
              className="grid min-h-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              title="عكس اتجاه الفرز"
              aria-label="عكس اتجاه الفرز"
            >
              <ArrowUpDown size={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[1420px] border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {[
                "الشركة",
                "السوق",
                "القطاع",
                "آخر سعر",
                "التغير",
                "الحجم",
                "قيمة التداول",
                "القيمة السوقية",
                "P/E",
                "EPS",
                "ROE",
                "العائد",
                "أسبوع",
                "شهر",
                "3 أشهر",
                "الاتجاه",
                "المخاطر",
                "آخر تحديث",
              ].map((heading) => (
                <th key={heading} className="border-b border-slate-200 px-3 py-3 text-right font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((stock) => (
              <tr key={stock.config.symbol} className="border-b border-slate-100 hover:bg-blue-50/50">
                <td className="px-3 py-3">
                  <Link href={`/stocks/${stock.config.symbol}`} className="font-bold text-blue-800 hover:underline">
                    {stock.config.nameAr}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">{stock.config.symbol}</div>
                </td>
                <td className="px-3 py-3"><Badge tone="slate">{stock.config.market}</Badge></td>
                <td className="px-3 py-3 text-slate-700">{stock.config.sector}</td>
                <NumberCell value={stock.quote.lastPrice.display} />
                <td className={`number px-3 py-3 font-bold ${percentClass(stock.quote.dailyChangePercent.value)}`}>
                  {stock.quote.dailyChange.display} / {stock.quote.dailyChangePercent.display}
                </td>
                <NumberCell value={stock.quote.volume.display} />
                <NumberCell value={stock.quote.tradeValue.display} />
                <NumberCell value={stock.quote.marketCap.display} />
                <NumberCell value={stock.financials.pe.display} />
                <NumberCell value={stock.financials.eps.display} />
                <NumberCell value={stock.financials.roe.display} />
                <NumberCell value={stock.financials.dividendYield.display} />
                <NumberCell value={stock.quote.performanceWeek.display} muted />
                <NumberCell value={stock.quote.performanceMonth.display} muted />
                <NumberCell value={stock.quote.performanceThreeMonths.display} muted />
                <td className="px-3 py-3">
                  <span className="font-semibold text-slate-800">{stock.analysis.trend.display}</span>
                </td>
                <td className="px-3 py-3"><Badge tone={riskTone(stock.analysis.riskLevel)}>{stock.analysis.riskLevel}</Badge></td>
                <td className="px-3 py-3 text-slate-600">{stock.quote.lastSessionDate.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length ? (
        <div className="p-6 text-center text-sm text-slate-500">لا توجد نتائج مطابقة للفلاتر الحالية.</div>
      ) : null}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-slate-200 px-3 text-slate-900 outline-none focus:border-blue-300"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberCell({ value, muted = false }: { value: string; muted?: boolean }) {
  return (
    <td className={`number px-3 py-3 font-semibold ${muted || value === unavailableText ? "text-slate-500" : "text-slate-900"}`}>
      {value}
    </td>
  );
}

function valueForSort(stock: StockSnapshot, key: SortKey): number | string | null {
  const riskRank = { منخفض: 1, متوسط: 2, مرتفع: 3, "مرتفع جدًا": 4 };

  switch (key) {
    case "symbol":
      return stock.config.symbol;
    case "market":
      return stock.config.market;
    case "price":
      return stock.quote.lastPrice.value;
    case "daily":
      return stock.quote.dailyChangePercent.value;
    case "volume":
      return stock.quote.volume.value;
    case "tradeValue":
      return stock.quote.tradeValue.value;
    case "marketCap":
      return stock.quote.marketCap.value;
    case "pe":
      return stock.financials.pe.value;
    case "eps":
      return stock.financials.eps.value;
    case "roe":
      return stock.financials.roe.value;
    case "yield":
      return stock.financials.dividendYield.value;
    case "week":
      return stock.quote.performanceWeek.value;
    case "month":
      return stock.quote.performanceMonth.value;
    case "threeMonths":
      return stock.quote.performanceThreeMonths.value;
    case "risk":
      return riskRank[stock.analysis.riskLevel];
    case "entitlement":
      return nearestEntitlementTime(stock);
  }
}

function nearestEntitlementTime(stock: StockSnapshot): number | null {
  const times = stock.dividends
    .map((dividend) => (dividend.lastEntitlementDate.value ? new Date(dividend.lastEntitlementDate.value).getTime() : null))
    .filter((value): value is number => value !== null && !Number.isNaN(value));

  return times.length ? Math.min(...times) : null;
}

function compareNullable(left: number | string | null, right: number | string | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  if (typeof left === "string" && typeof right === "string") return left.localeCompare(right, "ar");
  return Number(left) - Number(right);
}
