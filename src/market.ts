/**
 * أدوات بيانات السوق — وحدة مشتركة بين Overview و Screener.
 *
 * التغيّر اليومي والافتتاح/الأعلى/الأدنى والحجم تُجلب حقيقيةً من TradingView/Yahoo عبر السكربت اليومي.
 * ما غاب منها يبقى null ويُعرض «—»: لا توليد ولا قيم بديلة.
 */
import type { Stock } from './data'
import type { HistPoint } from './store/useHistory'

export interface DailyData {
  /** نسبة التغيّر اليومي % من المصدر. */
  changePct: number | null
  /** التغيّر بالدرهم: مشتق من سعر الإغلاق ونسبة التغيّر. */
  change: number | null
  /** النسبة نصًّا بإشارة صريحة («+0.27%»، «-1.02%») أو «—». */
  pct: string
  /** الإغلاق السابق: مشتق من سعر الإغلاق ونسبة التغيّر. */
  prevClose: number | null
  open: number | null
  high: number | null
  low: number | null
  volume: number | null
  /** قيمة التداول التقريبية = الحجم × سعر الإغلاق (المصدر لا يوفّر القيمة الفعلية). */
  value: number | null
  isUp: boolean
  isDown: boolean
  isFlat: boolean
}

const realNum = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)

/** حركة آخر جلسة لسهم من حقوله المجلوبة فقط. */
export function getDailyData(s: Stock): DailyData {
  const price = realNum(s.price)
  const changePct = realNum(s.change)
  const prevClose = price != null && changePct != null ? price / (1 + changePct / 100) : null
  const change = price != null && prevClose != null ? price - prevClose : null
  const volume = realNum(s.volume)
  return {
    changePct,
    change,
    pct: changePct == null ? '—' : `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`,
    prevClose,
    open: realNum(s.open),
    high: realNum(s.high),
    low: realNum(s.low),
    volume,
    value: volume != null && price != null ? volume * price : null,
    isUp: changePct != null && changePct > 0,
    isDown: changePct != null && changePct < 0,
    isFlat: changePct === 0,
  }
}

export type Timeframe = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
const TF_DAYS: Record<Exclude<Timeframe, 'ALL'>, number> = { '1W': 7, '1M': 31, '3M': 92, '6M': 183, '1Y': 366 }

export interface PeriodSeries {
  points: HistPoint[]
  high: number
  low: number
  start: number
  end: number
  change: number
  changePct: number
  up: boolean
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/**
 * سلسلة فترة من أسعار إغلاق حقيقية: تُقطع بالتاريخ (أسبوع = 7 أيام تقويمية) لا بعدد النقاط،
 * ويُدمج السعر الحالي إن كان أحدث من آخر نقطة. لا توليد لأي قيمة.
 */
export function periodSeries(
  history: HistPoint[],
  tf: Timeframe,
  current?: { price: number | null; asof: string | null },
): PeriodSeries | null {
  let pts = [...history]
  const lastDate = pts[pts.length - 1]?.[0]
  if (current?.price && current.asof) {
    if (!lastDate || current.asof > lastDate) pts.push([current.asof, current.price])
    else if (current.asof === lastDate) pts[pts.length - 1] = [current.asof, current.price]
  }
  if (tf !== 'ALL' && pts.length) {
    const from = new Date(pts[pts.length - 1]![0] + 'T00:00:00Z')
    from.setUTCDate(from.getUTCDate() - TF_DAYS[tf])
    const cut = iso(from)
    pts = pts.filter(([d]) => d >= cut)
  }
  if (pts.length < 2) return null
  const closes = pts.map((p) => p[1])
  const start = closes[0]!
  const end = closes[closes.length - 1]!
  const change = end - start
  return {
    points: pts,
    high: Math.max(...closes),
    low: Math.min(...closes),
    start,
    end,
    change,
    changePct: start > 0 ? (change / start) * 100 : 0,
    up: change >= 0,
  }
}
