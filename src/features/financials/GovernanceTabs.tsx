import type { FinRecord, Stock } from '@/data'
import { OfficialLink, Section, Stats } from './parts'
import { dateAr, dec, officialLinks } from './finFormat'

/** مجموعة «الإفصاحات والحوكمة»: مواعيد النتائج، والجمعية العمومية، وإجراءات التوزيع، وسجل التوزيع السنوي، والإفصاحات الرسمية. */
export default function GovernanceTabs({ stock, fin }: { stock: Stock; fin: FinRecord | null }) {
  const links = officialLinks(stock)
  const d = stock.div
  // الحقول المجلوبة آليًا ولم تُراجَع على إفصاح رسمي بعد
  const auto = new Set(d.auto?.fields ?? [])
  const mark = (field: string, v: string) => (auto.has(field) && v !== '—' ? `${v} · يلزم التحقق` : v)
  const shownAuto = ['ps', 'lastEnt', 'exd', 'pay'].some((f) => auto.has(f))
  const today = new Date().toISOString().slice(0, 10)
  const next = fin?.rel.next && fin.rel.next >= today ? fin.rel.next : null
  const dpsYears = (fin?.fy ?? []).filter((r) => r.dps != null)

  return (
    <>
      <Section title="مواعيد النتائج المالية" source="المصدر: TradingView. الموعد القادم تقدير من المصدر، لا إعلان رسمي من الشركة.">
        <Stats
          items={[
            { label: 'آخر إعلان نتائج', value: dateAr(fin?.rel.last) },
            { label: 'الإعلان القادم (متوقع)', value: next ? dateAr(next) : '—', hint: next ? 'غير مؤكد' : undefined },
          ]}
        />
      </Section>

      <Section
        title="إجراءات التوزيع"
        source={
          d.src ? (
            <>
              المصدر الرسمي: <a href={d.src.url} target="_blank" rel="noopener noreferrer">{d.src.label}</a> · روجع في {dateAr(d.src.asof)}
            </>
          ) : shownAuto ? (
            'الحقول المعلّمة «يلزم التحقق» مجلوبة آليًا من TradingView ولم تُراجَع على إفصاح الشركة.'
          ) : (
            'من بيانات المنصة المُراجَعة.'
          )
        }
      >
        <Stats
          items={[
            { label: 'الجمعية العمومية', value: dateAr(d.agm) },
            { label: 'مبلغ التوزيع للسهم', value: mark('ps', d.ps ?? '—') },
            { label: 'آخر يوم شراء للاستحقاق', value: mark('lastEnt', dateAr(d.lastEnt)) },
            { label: 'تاريخ الاستبعاد', value: mark('exd', dateAr(d.exd)) },
            { label: 'تاريخ الدفع', value: mark('pay', dateAr(d.pay)) },
            { label: 'دورية التوزيع', value: d.freq ?? '—' },
          ]}
        />
      </Section>

      {dpsYears.length > 0 && (
        <Section title="التوزيع النقدي للسهم حسب السنة المالية" source="المصدر: TradingView (التوزيعات المعلنة عن كل سنة مالية، بالدرهم).">
          <Stats items={dpsYears.map((r) => ({ label: String(r.y), value: r.dps === 0 ? 'لا توزيع' : `${dec(r.dps, 3)} د.إ` }))} />
        </Section>
      )}

      <Section title="الإفصاحات الرسمية">
        <p className="fin-note">
          لا تجلب المنصة نصوص الإفصاحات آليًا، إذ لا يتيح السوقان واجهة عامة موثّقة لذلك. الإفصاحات كاملة — النتائج، وقرارات مجلس
          الإدارة، ودعوات الجمعيات العمومية وقراراتها، وتشكيل المجلس — منشورة في صفحة الشركة على موقع السوق.
        </p>
        <OfficialLink {...links.company} />
      </Section>
    </>
  )
}
