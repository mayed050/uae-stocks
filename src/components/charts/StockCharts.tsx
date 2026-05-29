"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { StockSnapshot } from "@/lib/types";

export function StockCharts({ stock }: { stock: StockSnapshot }) {
  const hasPrice = stock.charts.priceThreeMonths.length > 0;
  const hasDividend = stock.charts.dividends.length > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel
        title="أداء السعر خلال ثلاثة أشهر"
        subtitle="السلسلة التاريخية الحالية تجريبية لحين ربط مصدر تاريخي رسمي."
        mock
      >
        {hasPrice ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stock.charts.priceThreeMonths} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={2} />
              <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="price" name="السعر" stroke="#155e9f" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="لا توجد سلسلة سعرية" message="غير متوفر من المصدر الرسمي داخل اللقطة الحالية." />
        )}
      </ChartPanel>

      <ChartPanel title="حجم وقيمة التداول" subtitle="آخر جلسة متاحة من السوق الرسمي.">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stock.charts.liquidity} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="volume" name="الحجم" fill="#087f5b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="tradeValue" name="قيمة التداول" fill="#155e9f" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="الإيرادات وصافي الربح" subtitle="قيم مالية من مصدر ثانوي عند عدم توفرها مباشرة في السوق.">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stock.charts.financials} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" name="الإيرادات مليار د.إ" fill="#155e9f" radius={[6, 6, 0, 0]} />
            <Bar dataKey="netProfit" name="صافي الربح مليار د.إ" fill="#087f5b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        title="التوزيعات التاريخية والعائد النقدي"
        subtitle="السلسلة التاريخية تجريبية، أما آخر توزيع ظاهر في الجدول فمن مصدر اللقطة."
        mock
      >
        {hasDividend ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stock.charts.dividends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yield" name="العائد النقدي %" stroke="#b7791f" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="لا توجد توزيعات تاريخية" message="غير متوفر من المصدر الرسمي داخل اللقطة الحالية." />
        )}
      </ChartPanel>
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
  mock = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  mock?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        {mock ? <Badge tone="yellow">بيانات تجريبية لغرض التطوير وليست بيانات سوق فعلية</Badge> : null}
      </div>
      {children}
    </div>
  );
}
