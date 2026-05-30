import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'
import { fmtAmount } from '@/format'

interface LeaderRow {
  stock: Stock
  value: string
}

function LeaderCard({
  title,
  icon,
  rows,
  badgeClass,
  onOpen,
}: {
  title: string
  icon: string
  rows: LeaderRow[]
  badgeClass: string
  onOpen: (s: Stock) => void
}) {
  return (
    <div className="o-widget">
      <h4 className="o-widget-h">{icon} {title}</h4>
      <div className="o-lead-list">
        {rows.map(({ stock, value }) => (
          <button key={stock.sym} className="o-lead-item" onClick={() => onOpen(stock)}>
            <Avatar sym={stock.sym} size={26} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, textAlign: 'right' }}>
              <span style={{ fontWeight: 800, fontSize: 12.5, color: 'var(--txt)' }}>{stock.sym}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{stock.name.split('—')[0]}</span>
            </span>
            <span className="o-lead-right"><span className={badgeClass}>{value}</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** ثلاث لوحات «متصدّرين» للشريط الجانبي — تستهلك مخرجات useMarketStats الجاهزة. */
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
  return (
    <>
      <LeaderCard
        title="رواد عوائد التوزيعات"
        icon="🏆"
        badgeClass="o-badge-good"
        onOpen={onOpen}
        rows={yieldLeaders.map((x) => ({ stock: x.s, value: x.s.div.yld ?? '—' }))}
      />
      <LeaderCard
        title="عمالقة السوق"
        icon="🐘"
        badgeClass="o-badge-brand"
        onOpen={onOpen}
        rows={marketGiants.map((x) => ({ stock: x.s, value: `${fmtAmount(x.mc)} د` }))}
      />
      <LeaderCard
        title="فرص التقييم (أقل P/E)"
        icon="💎"
        badgeClass="o-badge-warn"
        onOpen={onOpen}
        rows={valuationOpportunities.map((s) => ({ stock: s, value: `P/E ${s.pe?.toFixed(1) ?? '—'}` }))}
      />
    </>
  )
}
