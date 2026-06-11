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
        title="اضغط لمشاهدة التفاصيل الكاملة والتحليل الشامل للسهم 🔎"
      >
        <Avatar sym={stock.sym} size={42} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--txt)' }}>{stock.name.split('—')[0]}</h2>
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 107, 0, 0.1)', color: '#ff6b00', border: '1px solid rgba(255, 107, 0, 0.2)' }}>
              {stock.sym}
            </span>
            {inPortfolio && <span style={{ fontSize: '14px' }} title="في محفظتك">💼</span>}
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
