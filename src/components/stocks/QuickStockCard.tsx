import Link from "next/link";
import { ArrowLeft, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, confidenceTone, riskTone } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Section";
import { percentClass } from "@/lib/format";
import type { StockSnapshot } from "@/lib/types";

export function QuickStockCard({ stock }: { stock: StockSnapshot }) {
  const change = stock.quote.dailyChangePercent.value ?? 0;
  const Icon = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <Panel className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{stock.config.nameAr}</h3>
            <Badge tone="blue">{stock.config.symbol}</Badge>
            <Badge tone="slate">{stock.config.market}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{stock.config.sector}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-50 text-slate-600">
          <Icon size={20} aria-hidden />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="السعر" value={stock.quote.lastPrice.display} />
        <Metric
          label="التغير اليومي"
          value={stock.quote.dailyChangePercent.display}
          className={percentClass(stock.quote.dailyChangePercent.value)}
        />
        <Metric label="حجم التداول" value={stock.quote.volume.display} />
        <Metric label="قيمة التداول" value={stock.quote.tradeValue.display} />
        <Metric label="أداء شهر" value={stock.quote.performanceMonth.display} />
        <Metric label="أداء 3 أشهر" value={stock.quote.performanceThreeMonths.display} />
        <Metric label="P/E" value={stock.financials.pe.display} />
        <Metric label="EPS" value={stock.financials.eps.display} />
        <Metric label="العائد النقدي" value={stock.financials.dividendYield.display} />
        <Metric label="آخر إفصاح" value={stock.disclosures[0]?.date ? stock.disclosures[0].date : "غير متوفر"} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone={riskTone(stock.analysis.riskLevel)}>مخاطر: {stock.analysis.riskLevel}</Badge>
        <Badge tone={confidenceTone(stock.analysis.dataConfidence)}>
          ثقة: {stock.analysis.dataConfidence}
        </Badge>
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-sm font-bold text-slate-800">{stock.analysis.trend.display}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{stock.analysis.quickAssessment.join("، ")}</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <FileText size={14} aria-hidden />
          {stock.disclosures[0]?.title ?? "غير متوفر من المصدر الرسمي"}
        </span>
        <Link
          href={`/stocks/${stock.config.symbol}`}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-sm font-bold text-white hover:bg-[var(--primary-dark)]"
        >
          التفاصيل
          <ArrowLeft size={16} aria-hidden />
        </Link>
      </div>
    </Panel>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`number mt-1 font-bold text-slate-900 ${className ?? ""}`}>{value}</p>
    </div>
  );
}
