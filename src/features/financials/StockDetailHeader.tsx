import { BriefcaseBusiness } from 'lucide-react'
import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'
import type { TechnicalData } from './tradingSim'

/** ترويسة تفاصيل السهم المختار: الاسم والرمز والسعر وشارة التغير اليومي. */
export default function StockDetailHeader({
  stock,
  tech,
  inPortfolio,
  onOpen,
}: {
  stock: Stock
  tech: TechnicalData
  inPortfolio: boolean
  onOpen: (s: Stock) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => onOpen(stock)}
        title="اضغط لمشاهدة التفاصيل الكاملة والتحليل الشامل للسهم"
      >
        <Avatar sym={stock.sym} size={42} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--txt)' }}>{stock.name.split('—')[0]}</h2>
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'color-mix(in srgb, var(--brand) 10%, transparent)', color: 'var(--brand)', border: '1px solid color-mix(in srgb, var(--brand) 20%, transparent)' }}>
              {stock.sym}
            </span>
            {inPortfolio && <span title="في محفظتك" style={{ display: 'inline-flex', color: 'var(--brand)' }}><BriefcaseBusiness size={15} className="ico" aria-hidden /></span>}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
            شركة مساهمة عامة مدرجة في {stock.ex === 'DFM' ? 'سوق دبي المالي' : 'سوق أبوظبي للأوراق المالية'}
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>
          {stock.price?.toFixed(3)} <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--muted)' }}>د.إ</span>
        </span>
        <div className={`detail-header-price-badge ${tech.isUp ? 'up' : 'down'}`}>
          {tech.isUp ? '▲' : '▼'} {tech.change.toFixed(3)} ({tech.pct})
        </div>
      </div>
    </div>
  )
}
