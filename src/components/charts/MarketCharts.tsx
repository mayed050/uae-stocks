"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StockSnapshot } from "@/lib/types";

export function MarketCharts({ stocks }: { stocks: StockSnapshot[] }) {
  const performance = stocks
    .map((stock) => ({
      symbol: stock.config.symbol,
      daily: stock.quote.dailyChangePercent.value ?? 0,
    }))
    .sort((a, b) => Math.abs(b.daily) - Math.abs(a.daily))
    .slice(0, 10);

  const liquidity = stocks
    .map((stock) => ({
      symbol: stock.config.symbol,
      value: stock.quote.tradeValue.value ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const dividendYield = stocks
    .map((stock) => ({
      symbol: stock.config.symbol,
      yield: stock.financials.dividendYield.value ?? 0,
    }))
    .sort((a, b) => b.yield - a.yield)
    .slice(0, 10);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartBox title="أبرز التحركات اليومية">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={performance} layout="vertical" margin={{ top: 5, right: 8, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="symbol" width={82} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="daily" name="التغير %" radius={[0, 6, 6, 0]}>
              {performance.map((item) => (
                <Cell key={item.symbol} fill={item.daily >= 0 ? "#087f5b" : "#b42318"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="أعلى قيمة تداول">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={liquidity} layout="vertical" margin={{ top: 5, right: 8, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="symbol" width={82} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" name="قيمة التداول" fill="#155e9f" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="العائد النقدي المتاح">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dividendYield} layout="vertical" margin={{ top: 5, right: 8, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="symbol" width={82} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="yield" name="العائد النقدي %" fill="#b7791f" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-bold text-slate-950">{title}</h3>
      {children}
    </div>
  );
}
