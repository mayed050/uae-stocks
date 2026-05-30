import { fmtAmount } from '@/format'
import SimBadge from '@/components/ui/SimBadge'

export interface MarketActivity {
  dfmTrades: number
  adxTrades: number
  totalTrades: number
  dfmVolume: number
  adxVolume: number
  totalVolume: number
}

/** بطاقات مؤشرات السوق والنشاط اليومي (قيم المؤشرين ثابتة توضيحية؛ الأحجام/الصفقات محاكاة). */
export default function MarketIndexCards({ marketActivity }: { marketActivity: MarketActivity }) {
  return (
    <div className="panel" style={{ marginBottom: '20px', padding: '20px' }}>
      <h3 className="panel-h" style={{ margin: '0 0 14px 0', borderBottom: '1px solid var(--line)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800 }}>
        📊 مؤشرات الأسواق الإماراتية والنشاط اليومي
        <SimBadge title="قيم المؤشرين والأحجام والصفقات هنا توضيحية للعرض، وليست بيانات تداول رسمية لحظية.">قيم توضيحية</SimBadge>
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        {/* مؤشر سوق دبي المالي */}
        <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand)' }}>📈 مؤشر سوق دبي (DFMGI)</span>
            <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(58, 160, 255, 0.1)', color: 'var(--brand)', border: '1px solid rgba(58, 160, 255, 0.2)', fontWeight: 700 }}>دبي</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>4,215.80</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--good)' }}>+16.40 (+0.39%)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
            <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
              الاتجاه: <span style={{ color: 'var(--good)' }}>صاعد ↗️</span>
            </div>
            <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
              حجم التداول: <span style={{ color: 'var(--txt)' }}>{fmtAmount(marketActivity.dfmVolume)}</span>
            </div>
          </div>
        </div>

        {/* مؤشر سوق أبوظبي للأوراق المالية */}
        <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--good)' }}>📈 مؤشر سوق أبوظبي (ADI)</span>
            <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(33, 201, 139, 0.1)', color: 'var(--good)', border: '1px solid rgba(33, 201, 139, 0.2)', fontWeight: 700 }}>أبوظبي</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>9,350.40</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--bad)' }}>-41.20 (-0.44%)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
            <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
              الاتجاه: <span style={{ color: 'var(--bad)' }}>هابط ↘️</span>
            </div>
            <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
              حجم التداول: <span style={{ color: 'var(--txt)' }}>{fmtAmount(marketActivity.adxVolume)}</span>
            </div>
          </div>
        </div>

        {/* صفقات ونشاط السوق */}
        <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--warn)' }}>💼 نشاط الصفقات المنفذة</span>
            <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 176, 32, 0.1)', color: 'var(--warn)', border: '1px solid rgba(255, 176, 32, 0.2)', fontWeight: 700 }}>اليوم</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>{marketActivity.totalTrades.toLocaleString('en-US')}</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--muted)' }}>صفقة منفذة</span>
          </div>

          {/* صفقات دبي وأبوظبي */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
            <div style={{ background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: 700, marginBottom: '2px' }}>صفقات دبي</div>
              <b style={{ color: 'var(--brand)', fontSize: '12px' }}>{marketActivity.dfmTrades.toLocaleString('en-US')}</b>
            </div>
            <div style={{ background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: 700, marginBottom: '2px' }}>صفقات أبوظبي</div>
              <b style={{ color: 'var(--good)', fontSize: '12px' }}>{marketActivity.adxTrades.toLocaleString('en-US')}</b>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
