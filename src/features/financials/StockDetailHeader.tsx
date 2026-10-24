import { BriefcaseBusiness } from 'lucide-react'
import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'

/** ترويسة تفاصيل السهم المختار: الاسم والرمز والسعر وشارة التغير اليومي. */
export default function StockDetailHeader({
  stock,
  inPortfolio,
  onOpen,
}: {
  stock: Stock
  inPortfolio: boolean
  onOpen: (s: Stock) => void
}) {
  // التغير الحقيقي من آخر جلسة؛ والتغير بالدرهم مشتق منه
  const chg = stock.change ?? null
  const diff = chg != null && stock.price != null ? stock.price - stock.price / (1 + chg / 100) : null
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
        {chg != null && diff != null ? (
          <div className={`detail-header-price-badge ${chg > 0 ? 'up' : chg < 0 ? 'down' : ''}`} dir="ltr">
            {chg > 0 ? '▲' : chg < 0 ? '▼' : ''} {Math.abs(diff).toFixed(3)} ({chg > 0 ? '+' : ''}{chg.toFixed(2)}%)
          </div>
        ) : (
          <div className="detail-header-price-badge">التغير غير متوفر</div>
        )}
        {stock.asof && <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>جلسة {new Date(`${stock.asof}T00:00:00`).toLocaleDateString('ar-AE', { day: 'numeric', month: 'long' })}</span>}
      </div>
    </div>
  )
}
