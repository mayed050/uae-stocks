import { useState } from 'react'
import { Trophy } from 'lucide-react'
import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'
import { fmtAmount } from '@/format'

interface LeaderRow {
  stock: Stock
  value: string
}

type Tab = 'yield' | 'mcap' | 'pe'

const TABS: { id: Tab; label: string; badge: string }[] = [
  { id: 'yield', label: 'أعلى عائد', badge: 'o-badge-good' },
  { id: 'mcap', label: 'الأكبر قيمة', badge: 'o-badge-brand' },
  // ترتيب وصفي محايد لا «فرص»: المنصة لا تقدّم توصيات
  { id: 'pe', label: 'أدنى مكرر ربحية', badge: 'o-badge-warn' },
]

/** المتصدّرون في لوحة واحدة بتبويبات: أعلى عائد، والأكبر قيمة سوقية، وأدنى مكرر ربحية (شركات ≥ مليار درهم). */
export default function MarketLeaders({
  yieldLeaders,
  marketGiants,
  valuationOpportunities,
  onOpen,
}: {
  yieldLeaders: { s: Stock; yld: number }[]
  marketGiants: { s: Stock; mc: number }[]
  valuationOpportunities: Stock[]
  onOpen: (s: Stock) => void
}) {
  const [tab, setTab] = useState<Tab>('yield')
  const rows: LeaderRow[] =
    tab === 'yield'
      ? yieldLeaders.map((x) => ({ stock: x.s, value: x.s.div.yld ?? '—' }))
      : tab === 'mcap'
        ? marketGiants.map((x) => ({ stock: x.s, value: `${fmtAmount(x.mc)} د` }))
        : valuationOpportunities.map((s) => ({ stock: s, value: `P/E ${s.pe?.toFixed(1) ?? '—'}` }))
  const badge = TABS.find((t) => t.id === tab)?.badge ?? ''

  return (
    <div className="o-widget ov-leaders">
      <h3 className="o-widget-h"><Trophy size={16} className="ico" aria-hidden /> المتصدّرون</h3>
      <div className="o-filter-tabs ov-leaders-tabs" role="group" aria-label="معيار الترتيب">
        {TABS.map((t) => (
          <button key={t.id} className={'o-filter-tab' + (tab === t.id ? ' active' : '')} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="o-lead-list">
        {rows.map(({ stock, value }) => (
          <button key={stock.sym} className="o-lead-item" onClick={() => onOpen(stock)}>
            <Avatar sym={stock.sym} size={26} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, textAlign: 'right', minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 12.5, color: 'var(--txt)' }}>{stock.name.split('—')[0]}</span>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{stock.sym}</span>
            </span>
            <span className="o-lead-right"><span className={badge}>{value}</span></span>
          </button>
        ))}
      </div>
      <p className="ov-leaders-note">الشركات التي تبلغ قيمتها السوقية مليار درهم فأكثر — ترتيب وصفي لا توصية.</p>
    </div>
  )
}
