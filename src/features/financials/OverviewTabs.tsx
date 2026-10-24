import { useMemo } from 'react'
import { Download } from 'lucide-react'
import type { FinRecord, Stock } from '@/data'
import type { HistPoint } from '@/store'
import { Section, Stats } from './parts'
import { dateAr, dec, int, pct, signed, tone } from './finFormat'

const SESSIONS = 20

/** مجموعة «نظرة عامة»: آخر جلسة من بيانات السوق، والأداء والمؤشرات الفنية، وأسعار الإغلاق اليومية الفعلية. */
export default function OverviewTabs({ stock, fin, history }: { stock: Stock; fin: FinRecord | null; history: HistPoint[] }) {
  // السعر السابق والتغير بالدرهم مشتقّان من سعر الإغلاق ونسبة التغير المجلوبتين
  const prev = stock.price != null && stock.change != null ? stock.price / (1 + stock.change / 100) : null
  const diff = prev != null && stock.price != null ? stock.price - prev : null

  // آخر الجلسات من السجل التاريخي الفعلي (الأحدث أولًا) مع تغيّر كل جلسة عن سابقتها
  const rows = useMemo(() => {
    const pts = history.slice(-(SESSIONS + 1))
    const out: { date: string; close: number; chg: number | null; chgPct: number | null }[] = []
    for (let i = pts.length - 1; i >= 0 && out.length < SESSIONS; i--) {
      const [date, close] = pts[i]!
      const before = pts[i - 1]?.[1]
      out.push({ date, close, chg: before != null ? close - before : null, chgPct: before ? ((close - before) / before) * 100 : null })
    }
    return out
  }, [history])

  function downloadCsv() {
    const head = ['التاريخ', 'سعر الإغلاق', 'التغير', 'التغير %']
    const body = rows.map((r) => [r.date, r.close.toFixed(3), r.chg?.toFixed(3) ?? '', r.chgPct?.toFixed(2) ?? ''].join(','))
    // BOM ليفتح Excel الملف بترميز UTF-8
    const blob = new Blob([String.fromCharCode(0xfeff) + [head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `اسعار_الاغلاق_${stock.sym}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Section title={`آخر جلسة${stock.asof ? ` — ${dateAr(stock.asof)}` : ''}`} source="المصدر: TradingView (التحديث اليومي بعد الإغلاق). السعر السابق والتغير بالدرهم محسوبان من نسبة التغير.">
        <Stats
          items={[
            { label: 'سعر الإغلاق', value: dec(stock.price, 3) },
            { label: 'التغير %', value: pct(stock.change, true), tone: tone(stock.change) },
            { label: 'التغير (د.إ)', value: signed(diff), tone: tone(diff) },
            { label: 'السعر السابق', value: dec(prev, 3) },
            { label: 'الافتتاح', value: dec(stock.open, 3) },
            { label: 'الأعلى', value: dec(stock.high, 3) },
            { label: 'الأدنى', value: dec(stock.low, 3) },
            { label: 'الحجم (سهم)', value: int(stock.volume) },
            { label: 'أعلى 52 أسبوعًا', value: dec(stock.high52, 3) },
            { label: 'أدنى 52 أسبوعًا', value: dec(stock.low52, 3) },
            { label: 'القيمة السوقية', value: stock.mcap ?? '—' },
          ]}
        />
      </Section>

      {fin && (
        <Section title="الأداء والمؤشرات الفنية" source={`المصدر: TradingView — حتى ${dateAr(fin.asof)}.`}>
          <Stats
            items={[
              { label: 'أسبوع', value: pct(fin.perf.w, true), tone: tone(fin.perf.w) },
              { label: 'شهر', value: pct(fin.perf.m1, true), tone: tone(fin.perf.m1) },
              { label: '3 أشهر', value: pct(fin.perf.m3, true), tone: tone(fin.perf.m3) },
              { label: 'منذ بداية العام', value: pct(fin.perf.ytd, true), tone: tone(fin.perf.ytd) },
              { label: 'سنة', value: pct(fin.perf.y1, true), tone: tone(fin.perf.y1) },
              { label: 'مؤشر القوة النسبية (14)', value: dec(fin.tech.rsi, 1) },
              { label: 'المتوسط المتحرك 50 يومًا', value: dec(fin.tech.sma50, 3) },
              { label: 'المتوسط المتحرك 200 يوم', value: dec(fin.tech.sma200, 3) },
              { label: 'معامل بيتا (سنة)', value: dec(fin.tech.beta, 2) },
              { label: 'متوسط الحجم (30 يومًا)', value: int(fin.tech.avgVol30) },
            ]}
          />
        </Section>
      )}

      <Section title="أسعار الإغلاق اليومية" source="المصدر: سجل أسعار الإغلاق في المنصة (Yahoo لأسهم دبي، وتراكم يومي من TradingView لأسهم أبوظبي).">
        {rows.length === 0 ? (
          <p className="fin-empty">لا يتوفر سجل أسعار تاريخي لهذا السهم بعد.</p>
        ) : (
          <>
            <div className="fin-table-head">
              <span>آخر {rows.length} جلسة</span>
              <button className="chip" onClick={downloadCsv}>
                <Download size={14} className="ico" aria-hidden /> تنزيل CSV
              </button>
            </div>
            <div className="fin-tablewrap" tabIndex={0} role="region" aria-label="جدول أسعار الإغلاق اليومية">
              <table className="fin-table">
                <thead>
                  <tr><th>التاريخ</th><th>الإغلاق</th><th>التغير</th><th>التغير %</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.date}>
                      <td>{dateAr(r.date)}</td>
                      <td>{dec(r.close, 3)}</td>
                      <td className={tone(r.chg)}>{signed(r.chg)}</td>
                      <td className={tone(r.chgPct)}>{pct(r.chgPct, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>
    </>
  )
}
