import { fmtAmount } from '@/format'
import StatCard from '@/components/ui/StatCard'

export interface MarketStats {
  dfm: number
  adx: number
  avgYield: number
  totalMcap: number
  mcapCount: number
  avgPe: number
}

/** شريط مؤشرات أداء علوي يلخّص السوق في أربعة أرقام (من useMarketStats). */
export default function MarketKpiStrip({ stats }: { stats: MarketStats }) {
  return (
    <div className="stats" style={{ marginBottom: 20 }}>
      <StatCard
        color="var(--brand)"
        value={stats.dfm + stats.adx}
        label="الأسهم المغطّاة"
        sub={`دبي ${stats.dfm} · أبوظبي ${stats.adx}`}
      />
      <StatCard
        color="var(--good)"
        value={`${stats.avgYield.toFixed(2)}%`}
        label="متوسط عائد التوزيعات"
        sub="عبر الأسهم المغطّاة"
      />
      <StatCard
        color="var(--brand2)"
        value={`${fmtAmount(stats.totalMcap)} درهم`}
        label="إجمالي القيمة السوقية"
        sub={`لـ ${stats.mcapCount} شركة مغطّاة`}
      />
      <StatCard
        color="var(--warn)"
        value={stats.avgPe.toFixed(1)}
        label="متوسط مكرر الربحية"
        sub="للشركات الرابحة (P/E)"
      />
    </div>
  )
}
