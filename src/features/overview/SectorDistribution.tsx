import { ChartBar } from 'lucide-react'

const TOP = 10

/** «قطاعان»، «3 قطاعات»، «12 قطاعًا» — صيغة العدد العربية. */
function sectorsWord(n: number): string {
  if (n === 1) return 'قطاع واحد'
  if (n === 2) return 'قطاعان'
  return n <= 10 ? `${n} قطاعات` : `${n} قطاعًا`
}

/**
 * توزيع الشركات المدرجة على القطاعات: أشرطة مرتّبة لأكبر 10 قطاعات بدل مخطط دائري
 * بثلاثين لونًا لا تُقرأ شرائحه — المقارنة بالطول أدقّ من المقارنة بالزاوية.
 */
export default function SectorDistribution({ sectorData }: { sectorData: { name: string; value: number }[] }) {
  const sorted = [...sectorData].sort((a, b) => b.value - a.value)
  const bars = sorted.slice(0, TOP)
  const rest = sorted.slice(TOP)
  const restCount = rest.reduce((n, d) => n + d.value, 0)
  // «أخرى» سطر نصي لا شريط: مجموع القطاعات الصغيرة يفوق أكبرها فيُسطّح مقياس الأشرطة الحقيقية
  const max = Math.max(1, ...bars.map((d) => d.value))
  const total = sectorData.reduce((n, d) => n + d.value, 0)

  return (
    <div className="panel o-sector-panel">
      <h3 className="panel-h o-h-underline">
        <ChartBar size={16} className="ico" aria-hidden /> الشركات المدرجة حسب القطاع
      </h3>
      <ul className="ov-bars" aria-label={`توزيع ${total} شركة على القطاعات`}>
        {bars.map((d) => (
          <li key={d.name} className="ov-bar">
            <span className="ov-bar-name">{d.name}</span>
            <span className="ov-bar-track" aria-hidden>
              <span className="ov-bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
            </span>
            <b className="ov-bar-val">{d.value}</b>
          </li>
        ))}
      </ul>
      {rest.length > 0 && <p className="ov-bars-rest">و{sectorsWord(rest.length)} أخرى تضم {restCount} شركة.</p>}
    </div>
  )
}
