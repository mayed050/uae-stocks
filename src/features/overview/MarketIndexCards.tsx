import { Activity, ChartLine, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { IndexQuote } from '@/data'
import { fmtAmount } from '@/format'

export interface MarketActivity {
  /** عدد الأسهم المغطّاة التي جُلبت حركتها في آخر جلسة (أساس كل الأرقام أدناه). */
  sessionCount: number
  sessionDate: string | null
  dfmVolume: number
  adxVolume: number
  totalValue: number
  advancers: number
  decliners: number
  unchanged: number
}

const INDEX_CARDS: { code: string; label: string; ex: 'DFM' | 'ADX' }[] = [
  { code: 'DFMGI', label: 'مؤشر سوق دبي المالي العام', ex: 'DFM' },
  { code: 'FADGI', label: 'مؤشر فوتسي سوق أبوظبي العام', ex: 'ADX' },
]

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric' })

function IndexCard({ label, code, quote, volume }: { label: string; code: string; quote?: IndexQuote; volume: number }) {
  const pct = quote?.changePct ?? null
  const dir = pct === null ? 'flat' : pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
  const Trend = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus
  const sign = (n: number) => (n > 0 ? '+' : '')
  return (
    <div className="idx-card">
      <div className="idx-head">
        <span className="idx-name"><ChartLine size={15} className="ico" aria-hidden /> {label}</span>
        <span className="idx-code" dir="ltr">{code}</span>
      </div>
      {quote ? (
        <>
          <div className="idx-value" dir="ltr">{quote.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={`idx-change ${dir}`} dir="ltr">
            <Trend size={15} aria-hidden />
            {quote.change !== null && <span>{sign(quote.change)}{quote.change.toFixed(2)}</span>}
            {pct !== null && <span>({sign(pct)}{pct.toFixed(2)}%)</span>}
          </div>
          <div className="idx-foot">إغلاق {fmtDate(quote.asof)} · حجم الأسهم المغطّاة {fmtAmount(volume)}</div>
        </>
      ) : (
        <>
          <div className="idx-value idx-missing">—</div>
          <div className="idx-change flat">لم تُجلب قراءة المؤشر بعد</div>
          <div className="idx-foot">تظهر القيمة الحقيقية تلقائيًا بعد التحديث اليومي القادم</div>
        </>
      )}
    </div>
  )
}

/** مؤشرا السوقين (قيم حقيقية من التحديث اليومي، أو حالة «غير متوفر» صريحة) + نشاط الأسهم المغطّاة واتساع السوق. */
export default function MarketIndexCards({
  indices,
  marketActivity: a,
}: {
  indices?: Record<string, IndexQuote>
  marketActivity: MarketActivity
}) {
  const breadthTotal = a.advancers + a.decliners + a.unchanged
  const w = (n: number) => (breadthTotal ? `${(n / breadthTotal) * 100}%` : '0%')
  return (
    <div className="panel idx-panel">
      <h3 className="panel-h idx-title">
        <Activity size={16} className="ico" aria-hidden /> مؤشرات الأسواق والنشاط اليومي
      </h3>

      <div className="idx-grid">
        {INDEX_CARDS.map((c) => (
          <IndexCard
            key={c.code}
            code={c.code}
            label={c.label}
            quote={indices?.[c.code]}
            volume={c.ex === 'DFM' ? a.dfmVolume : a.adxVolume}
          />
        ))}

        <div className="idx-card">
          <div className="idx-head">
            <span className="idx-name"><Activity size={15} className="ico" aria-hidden /> نشاط الأسهم المغطّاة</span>
            {a.sessionDate && <span className="idx-code">{fmtDate(a.sessionDate)}</span>}
          </div>
          <div className="idx-value">{fmtAmount(a.totalValue)} <small>درهم</small></div>
          <div className="idx-sub">قيمة التداول (الحجم × السعر) لـ {a.sessionCount} سهمًا</div>
          <div className="breadth" role="img" aria-label={`مرتفعة ${a.advancers}، منخفضة ${a.decliners}، دون تغيير ${a.unchanged}`}>
            <span className="b-up" style={{ width: w(a.advancers) }} />
            <span className="b-flat" style={{ width: w(a.unchanged) }} />
            <span className="b-down" style={{ width: w(a.decliners) }} />
          </div>
          <div className="breadth-legend">
            <span className="up">مرتفعة {a.advancers}</span>
            <span>دون تغيير {a.unchanged}</span>
            <span className="down">منخفضة {a.decliners}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
