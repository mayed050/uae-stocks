import type { Stock } from '@/data'

/** مجموعة «البيانات والتقارير»: البيانات الأساسية (Fundamentals) + قائمة التقارير. */
export default function FinancialDataTabs({ stock }: { stock: Stock }) {
  return (
    <>
      {/* 3. تبويب البيانات الأساسية (Fundamentals) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>مكرر الربحية (P/E)</div>
          <b style={{ fontSize: '20px', color: '#ff6b00' }}>{stock.pe?.toFixed(2) ?? 'يلزم تحقق'}</b>
          <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>المعدل الفعلي لتقييم سعر السهم</div>
        </div>
        <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>ربحية السهم الواحد (EPS)</div>
          <b style={{ fontSize: '20px', color: 'var(--brand)' }}>{stock.eps ? `${stock.eps} د.إ` : 'يلزم تحقق'}</b>
          <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>حصة السهم من صافي الأرباح</div>
        </div>
        <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>عائد التوزيعات النقدي</div>
          <b style={{ fontSize: '20px', color: 'var(--good)' }}>{stock.div.yld ?? 'غير معلن'}</b>
          <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>العائد النقدي الفعلي السنوي</div>
        </div>
        <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>صافي الأرباح السنوية</div>
          <b style={{ fontSize: '16px', color: 'var(--txt)' }}>{stock.net ?? 'يلزم تحقق'}</b>
          <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>حجم صافي الدخل المحقق للشركة</div>
        </div>
      </div>

      {/* 5. تبويب التقارير */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--chip)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <div>
            <b style={{ fontSize: '13px', display: 'block', color: 'var(--txt)' }}>📄 تقرير الاستدامة والحوكمة لعام 2025</b>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>تنسيق PDF · 4.8 ميجابايت</span>
          </div>
          <button onClick={() => alert('جاري تحميل التقرير...')} style={{ border: 0, background: 'linear-gradient(135deg, #ff7b00, #ff4500)', color: '#fff', fontSize: '11px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>تحميل التقرير</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--chip)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <div>
            <b style={{ fontSize: '13px', display: 'block', color: 'var(--txt)' }}>📄 القوائم المالية السنوية المدققة لعام 2025</b>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>تنسيق PDF · 8.2 ميجابايت</span>
          </div>
          <button onClick={() => alert('جاري تحميل التقرير...')} style={{ border: 0, background: 'linear-gradient(135deg, #ff7b00, #ff4500)', color: '#fff', fontSize: '11px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>تحميل القوائم</button>
        </div>
      </div>
    </>
  )
}
