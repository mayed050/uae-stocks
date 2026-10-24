import type { FinRecord, Stock } from '@/data'
import { OfficialLink, Section, Stats } from './parts'
import { dateAr, int, officialLinks, pct } from './finFormat'

/** مجموعة «الملكية»: الأسهم المصدرة والحرة وISIN من TradingView، وروابط ملكية الأجانب وكبار المساهمين في موقع السوق. */
export default function OwnershipTabs({ stock, fin }: { stock: Stock; fin: FinRecord | null }) {
  const links = officialLinks(stock)
  const fp = fin?.own.floatPct ?? null

  return (
    <>
      <Section title="هيكل الأسهم" source={fin ? `المصدر: TradingView — حتى ${dateAr(fin.asof)}. الأسهم الحرة: المتاحة للتداول بعد استبعاد حيازات المؤسسين والجهات الاستراتيجية والمقيّدة، وفق تعريف المصدر.` : undefined}>
        <Stats
          items={[
            { label: 'عدد الأسهم المصدرة', value: int(fin?.own.shares) },
            { label: 'الأسهم الحرة', value: int(fin?.own.float) },
            { label: 'نسبة الأسهم الحرة', value: pct(fp) },
            { label: 'القيمة السوقية', value: stock.mcap ?? '—' },
            { label: 'رمز ISIN', value: fin?.own.isin ?? '—' },
          ]}
        />
        {fp != null && (
          <div className="fin-split" role="img" aria-label={`الأسهم الحرة ${pct(fp)}، والحيازات الاستراتيجية والمقيّدة ${pct(100 - fp)}`}>
            <span className="fin-split-free" style={{ width: `${fp}%` }} />
            <span className="fin-split-held" style={{ width: `${100 - fp}%` }} />
          </div>
        )}
        {fp != null && (
          <p className="fin-split-legend">
            <span><i className="fin-dot free" /> أسهم حرة {pct(fp)}</span>
            <span><i className="fin-dot held" /> حيازات استراتيجية ومقيّدة {pct(100 - fp)}</span>
          </p>
        )}
      </Section>

      <Section title="ملكية الأجانب">
        <p className="fin-note">
          الحدّ الأقصى المسموح لتملّك الأجانب والنسبة الفعلية والمتاحة تُحدَّث يوميًا في موقع السوق. لا تعرضها المنصة كي لا تُعرض
          نسبة متقادمة.
        </p>
        <OfficialLink {...links.foreign} />
      </Section>

      <Section title="كبار المساهمين">
        <p className="fin-note">
          قائمة كبار المساهمين (5% فأكثر) غير متوفرة في مصدر بيانات المنصة. تُنشر في صفحة الشركة على موقع السوق وفي تقريرها السنوي.
        </p>
        <OfficialLink {...links.company} />
      </Section>
    </>
  )
}
