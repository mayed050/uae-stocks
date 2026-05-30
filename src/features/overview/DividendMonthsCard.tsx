export interface MonthDatum {
  m: string
  count: number
}

/** بطاقة مدمجة تُظهر ازدحام تواريخ التوزيعات على أشهر السنة (من monthData). */
export default function DividendMonthsCard({ data }: { data: MonthDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const currentMonth = new Date().getMonth()

  return (
    <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
      <h3 className="panel-h" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px', fontSize: '14.5px', fontWeight: 800 }}>
        🗓️ ازدحام شهور التوزيعات
      </h3>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px', height: '170px' }}>
        {data.map((d, i) => (
          <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: d.count > 0 ? 'var(--txt)' : 'var(--muted2)' }}>{d.count || ''}</span>
            <div
              title={`${d.m}: ${d.count} تاريخ استحقاق/دفع`}
              style={{
                width: '100%',
                maxWidth: '22px',
                borderRadius: '5px 5px 0 0',
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count ? '6px' : '2px',
                background: i === currentMonth ? 'linear-gradient(var(--brand), var(--brand2))' : 'var(--chip)',
                border: '1px solid var(--line)',
              }}
            />
            <span style={{ fontSize: '9.5px', color: i === currentMonth ? 'var(--brand)' : 'var(--muted)', fontWeight: i === currentMonth ? 800 : 600 }}>
              {d.m.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '10.5px', color: 'var(--muted2)', marginTop: '12px', textAlign: 'center' }}>
        عدد تواريخ الاستحقاق والدفع في كل شهر — الشهر الحالي مميّز
      </div>
    </div>
  )
}
