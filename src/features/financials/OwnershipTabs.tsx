import type { Stock } from '@/data'

/** مجموعة «الملكية»: هيكل كبار المساهمين + حدود الاستثمارات الأجنبية. */
export default function OwnershipTabs({ stock }: { stock: Stock }) {
  return (
    <>
      {/* 8. تبويب أكبر المساهمين */}
      <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--txt)', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>👥 هيكل كبار مساهمي شركة {stock.name.split('—')[0]}</h4>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>اسم المساهم الكبير</th>
              <th style={{ padding: '6px 4px', textAlign: 'center' }}>نسبة الملكية (%)</th>
              <th style={{ padding: '6px 4px', textAlign: 'left' }}>فئة المساهم</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px dashed var(--line)' }}>
              <td style={{ padding: '8px 4px', fontWeight: 700 }}>جهاز الإمارات للاستثمار (حكومي)</td>
              <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, color: 'var(--brand)' }}>45.5%</td>
              <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--muted)' }}>حكومة / جهة رسمية</td>
            </tr>
            <tr style={{ borderBottom: '1px dashed var(--line)' }}>
              <td style={{ padding: '8px 4px', fontWeight: 700 }}>المؤسسات والصناديق الاستثمارية الوطنية</td>
              <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, color: 'var(--txt)' }}>28.2%</td>
              <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--muted)' }}>مؤسسات محلية</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 4px', fontWeight: 700 }}>المستثمرون الأجانب والأفراد</td>
              <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, color: 'var(--good)' }}>26.3%</td>
              <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--muted)' }}>أجانب / أفراد</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 9. تبويب الاستثمارات الأجنبية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '14px' }}>
        <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>الحد الأقصى لتملك الأجانب</div>
          <b style={{ fontSize: '22px', color: 'var(--brand)' }}>49.0%</b>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>الحد الأعلى المسموح به رسمياً</div>
        </div>
        <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>النسبة الفعلية لتملك الأجانب</div>
          <b style={{ fontSize: '22px', color: 'var(--good)' }}>18.4%</b>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>النسبة المستثمرة حالياً بالفعل</div>
        </div>
      </div>
    </>
  )
}
