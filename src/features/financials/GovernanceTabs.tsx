import type { Stock } from '@/data'

/** مجموعة «الإفصاحات والحوكمة»: الإفصاحات + الجمعية العمومية + إجراءات الشركات. */
export default function GovernanceTabs({ stock }: { stock: Stock }) {
  return (
    <>
      {/* 4. تبويب الإفصاحات */}
      <div>
        <div className="disclosure-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ff6b00', fontWeight: 800 }}>
            <span>📢 إفصاح مالي رسمي</span>
            <span>25 مايو 2026</span>
          </div>
          <b style={{ fontSize: '13px', color: 'var(--txt)', margin: '4px 0' }}>موافقة الجمعية العمومية لشركة {stock.name.split('—')[0]} على مقترحات توزيع الأرباح النقدية للمساهمين.</b>
          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.4' }}>
            تمت الموافقة الرسمية من قبل الجمعية العمومية على توزيع أرباح نقدية بنسبة مجزية للمساهمين المسجلين في تاريخ الاستحقاق المعلن مسبقاً.
          </p>
        </div>
        <div className="disclosure-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--brand)', fontWeight: 800 }}>
            <span>📢 نتائج فصلية</span>
            <span>18 مايو 2026</span>
          </div>
          <b style={{ fontSize: '13px', color: 'var(--txt)', margin: '4px 0' }}>التقرير المالي المفصل للفترة الربعية المنتهية في 31 مارس 2026.</b>
          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.4' }}>
            إعلان البيانات المالية الموحدة المحققة للربع الأول والتي تعكس نمواً متوازناً في الإيرادات التشغيلية بنسبة تتوافق مع الأهداف الاستراتيجية للشركة.
          </p>
        </div>
      </div>

      {/* 6. تبويب الاجتماعات العامة */}
      <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
          <span style={{ color: 'var(--muted)', fontWeight: 700 }}>تاريخ آخر جمعية عمومية:</span>
          <b style={{ color: 'var(--txt)' }}>{stock.div.agm ?? 'يلزم تحقق'}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
          <span style={{ color: 'var(--muted)', fontWeight: 700 }}>طبيعة الاجتماع:</span>
          <b style={{ color: 'var(--txt)' }}>اجتماع عادي سنوي</b>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px' }}>
          <span style={{ color: 'var(--muted)', fontWeight: 700 }}>أهم القرارات المعتمدة:</span>
          <span style={{ color: 'var(--txt)', lineHeight: '1.45' }}>
            1. الموافقة الكاملة على تقرير مجلس الإدارة عن السنة المالية المنتهية في ديسمبر 2025.<br />
            2. المصادقة على الميزانية العمومية للشركة وحساب الأرباح والخسائر المدقق.<br />
            3. إقرار مقترحات توزيع الأرباح النقدية وتفويض الإدارة لإتمام التحويلات للمساهمين.
          </span>
        </div>
      </div>

      {/* 7. تبويب إجراءات الشركات (التوزيعات وتواريخها) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px' }}>
        <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>تاريخ الاستحقاق (Ex-Date)</span>
          <b style={{ fontSize: '14px', color: '#ff6b00', display: 'block', marginTop: '4px' }}>{stock.div.exd ?? 'يلزم تحقق'}</b>
        </div>
        <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>تاريخ التوزيع والدفع (Pay)</span>
          <b style={{ fontSize: '14px', color: 'var(--good)', display: 'block', marginTop: '4px' }}>{stock.div.pay ?? 'يلزم تحقق'}</b>
        </div>
        <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>تاريخ آخر توزيع نقدي معلن</span>
          <b style={{ fontSize: '14px', color: 'var(--txt)', display: 'block', marginTop: '4px' }}>{stock.div.lastEnt ?? 'يلزم تحقق'}</b>
        </div>
        <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>دورية توزيع الأرباح</span>
          <b style={{ fontSize: '14px', color: 'var(--brand)', display: 'block', marginTop: '4px' }}>{stock.div.freq ?? 'سنوي'}</b>
        </div>
      </div>
    </>
  )
}
