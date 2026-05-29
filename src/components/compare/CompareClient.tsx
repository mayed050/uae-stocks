"use client";

import { useMemo, useState } from "react";
import { GitCompare, Plus, X } from "lucide-react";
import { Badge, confidenceTone, riskTone } from "@/components/ui/Badge";
import type { StockSnapshot } from "@/lib/types";

const defaultSymbols = ["DEWA", "EMAAR", "ADNOCGAS"];

export function CompareClient({ stocks }: { stocks: StockSnapshot[] }) {
  const [selected, setSelected] = useState<string[]>(defaultSymbols);
  const selectedStocks = useMemo(
    () => selected.map((symbol) => stocks.find((stock) => stock.config.symbol === symbol)).filter(Boolean) as StockSnapshot[],
    [selected, stocks],
  );
  const available = stocks.filter((stock) => !selected.includes(stock.config.symbol));

  function add(symbol: string) {
    if (!symbol || selected.includes(symbol) || selected.length >= 5) return;
    setSelected((current) => [...current, symbol]);
  }

  function remove(symbol: string) {
    setSelected((current) => current.filter((item) => item !== symbol));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare size={18} className="text-slate-500" aria-hidden />
            <h3 className="font-bold text-slate-950">الأسهم المختارة</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => remove(symbol)}
                className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800"
              >
                {symbol}
                <X size={15} aria-hidden />
              </button>
            ))}
          </div>
        </div>
        <label className="grid gap-1 text-sm font-bold text-slate-600">
          إضافة سهم
          <span className="flex gap-2">
            <select
              className="min-h-10 min-w-56 rounded-lg border border-slate-200 px-3 text-slate-900 outline-none focus:border-blue-300"
              onChange={(event) => {
                add(event.target.value);
                event.currentTarget.value = "";
              }}
              defaultValue=""
              disabled={selected.length >= 5}
            >
              <option value="">اختر سهمًا</option>
              {available.map((stock) => (
                <option key={stock.config.symbol} value={stock.config.symbol}>
                  {stock.config.symbol} - {stock.config.nameAr}
                </option>
              ))}
            </select>
            <span className="grid min-h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500">
              <Plus size={18} aria-hidden />
            </span>
          </span>
        </label>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-3 py-3 text-right font-bold">المعيار</th>
              {selectedStocks.map((stock) => (
                <th key={stock.config.symbol} className="border-b border-slate-200 px-3 py-3 text-right font-bold">
                  {stock.config.symbol}
                  <div className="mt-1 text-xs font-normal text-slate-500">{stock.config.nameAr}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="السعر" stocks={selectedStocks} value={(stock) => stock.quote.lastPrice.display} />
            <CompareRow label="الأداء اليومي" stocks={selectedStocks} value={(stock) => stock.quote.dailyChangePercent.display} />
            <CompareRow label="الأداء الأسبوعي" stocks={selectedStocks} value={(stock) => stock.quote.performanceWeek.display} />
            <CompareRow label="الأداء الشهري" stocks={selectedStocks} value={(stock) => stock.quote.performanceMonth.display} />
            <CompareRow label="أداء ثلاثة أشهر" stocks={selectedStocks} value={(stock) => stock.quote.performanceThreeMonths.display} />
            <CompareRow label="القيمة السوقية" stocks={selectedStocks} value={(stock) => stock.quote.marketCap.display} />
            <CompareRow label="حجم التداول" stocks={selectedStocks} value={(stock) => stock.quote.volume.display} />
            <CompareRow label="قيمة التداول" stocks={selectedStocks} value={(stock) => stock.quote.tradeValue.display} />
            <CompareRow label="P/E" stocks={selectedStocks} value={(stock) => stock.financials.pe.display} />
            <CompareRow label="EPS" stocks={selectedStocks} value={(stock) => stock.financials.eps.display} />
            <CompareRow label="ROE" stocks={selectedStocks} value={(stock) => stock.financials.roe.display} />
            <CompareRow label="نمو الإيرادات" stocks={selectedStocks} value={(stock) => stock.financials.revenueGrowth.display} />
            <CompareRow label="نمو صافي الربح" stocks={selectedStocks} value={(stock) => stock.financials.netProfitGrowth.display} />
            <CompareRow label="العائد النقدي" stocks={selectedStocks} value={(stock) => stock.financials.dividendYield.display} />
            <CompareRow label="نسبة التوزيع" stocks={selectedStocks} value={(stock) => stock.financials.payoutRatio.display} />
            <CompareRow label="الاتجاه المتوقع" stocks={selectedStocks} value={(stock) => stock.analysis.trend.display} />
            <CompareRow
              label="مستوى المخاطر"
              stocks={selectedStocks}
              value={(stock) => <Badge tone={riskTone(stock.analysis.riskLevel)}>{stock.analysis.riskLevel}</Badge>}
            />
            <CompareRow label="قوة المركز المالي" stocks={selectedStocks} value={(stock) => stock.analysis.financialPosition} wide />
            <CompareRow
              label="درجة الثقة في البيانات"
              stocks={selectedStocks}
              value={(stock) => <Badge tone={confidenceTone(stock.analysis.dataConfidence)}>{stock.analysis.dataConfidence}</Badge>}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  stocks,
  value,
  wide = false,
}: {
  label: string;
  stocks: StockSnapshot[];
  value: (stock: StockSnapshot) => React.ReactNode;
  wide?: boolean;
}) {
  return (
    <tr className="border-b border-slate-100 align-top hover:bg-blue-50/50">
      <td className="w-48 px-3 py-3 font-bold text-slate-700">{label}</td>
      {stocks.map((stock) => (
        <td key={`${label}-${stock.config.symbol}`} className={`px-3 py-3 ${wide ? "min-w-72 leading-7 text-slate-600" : "number font-semibold text-slate-900"}`}>
          {value(stock)}
        </td>
      ))}
    </tr>
  );
}
