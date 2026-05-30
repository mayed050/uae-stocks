import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'

export interface LiveAction {
  id: number
  sym: string
  title: string
  type: string
  time: string
  badge: string
}

/** شريط إجراءات/أحداث الشركات — عرض توضيحي يتجدّد تلقائياً (بيانات محاكاة). */
export default function LiveActionsFeed({
  actions,
  stocks,
  onOpen,
}: {
  actions: LiveAction[]
  stocks: Stock[]
  onOpen: (s: Stock) => void
}) {
  return (
    <div className="o-widget" style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '8px', marginBottom: '12px' }}>
        <h4 className="o-widget-h" style={{ margin: 0, border: 0, padding: 0 }}>🔔 إجراءات وأحداث الشركات</h4>
        <span className="live-badge-pulse" title="عرض توضيحي لإجراءات الشركات يتجدّد تلقائياً — أمثلة محاكاة وليست إفصاحات رسمية لحظية. تأكّد من المصادر الرسمية (DFM / ADX).">
          <span className="pulse-dot" />
          عرض تجريبي
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
        {actions.map((act) => {
          const realStock = stocks.find(s => s.sym.toUpperCase() === act.sym.toUpperCase());

          // Color-coded borders based on action type
          let typeColor = 'var(--brand)';
          if (act.type === 'approval') typeColor = 'var(--good)';
          if (act.type === 'date') typeColor = 'var(--warn)';
          if (act.type === 'payout') typeColor = 'var(--brand)';
          if (act.type === 'news') typeColor = 'var(--brand2)';

          return (
            <div
              key={act.id}
              onClick={() => realStock && onOpen(realStock)}
              className="o-action-item"
              style={{ opacity: realStock ? 1 : 0.8 }}
            >
              {/* Color bar */}
              <div className="o-action-type-line" style={{ background: typeColor }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {realStock ? (
                  <Avatar sym={realStock.sym} size={20} />
                ) : (
                  <span style={{ fontSize: '12px' }}>🏢</span>
                )}
                <span style={{ fontWeight: 800, fontSize: '11.5px', color: 'var(--txt)' }}>
                  {realStock ? realStock.name.split('—')[0] : act.sym}
                </span>
                <span style={{
                  fontSize: '9.5px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: `${typeColor}15`,
                  color: typeColor,
                  fontWeight: 800,
                  marginInlineStart: 'auto',
                  border: `1px solid ${typeColor}30`
                }}>
                  {act.badge}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.45', fontWeight: 600 }}>
                {act.title}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--muted2)', marginTop: '4px', borderTop: '1px dashed var(--line)', paddingTop: '4px' }}>
                <span>🕒 {act.time}</span>
                <span>{realStock ? `رمز السهم: ${realStock.sym}` : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
