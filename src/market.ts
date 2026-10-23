/**
 * أدوات بيانات السوق — وحدة مشتركة بين Overview و Screener.
 *
 * التغيّر اليومي والافتتاح/الأعلى/الأدنى والحجم وقيمة التداول تُجلب حقيقيةً من
 * TradingView/Yahoo عبر السكربت اليومي (الحقول real على كائن السهم). إن غابت هذه
 * الحقول (سهم بلا تحديث) يُستخدم توليد احتياطي مشتق من رمز السهم للعرض فقط.
 * «عدد الصفقات» تقديري دائمًا (لا يوفّره المصدر).
 */
import type { Stock } from './data'
import { parseAmount } from './format'
import { SECTOR_MOVEMENTS, ADX_MOVEMENTS } from './data/movements'
import type { MovementStock } from './data/movements'
import type { HistPoint } from './store/useHistory'

export interface DailyData {
  change: number
  pct: string
  volume: number
  value: number
  trades: number
  prevClose: number
  open: number
  high: number
  low: number
  isUp: boolean
  isFlat: boolean
  isDown: boolean
  isReal: boolean
}

/** مولّد أرقام شبه عشوائي بـ seed ثابت (لا يتغيّر بين عمليات إعادة الرسم). */
export function seededRand(seed: number) {
  let localSeed = seed
  return (max: number, min = 0) => {
    const x = Math.sin(localSeed++) * 10000
    return min + (x - Math.floor(x)) * (max - min)
  }
}

/** يشتق seedًا رقمياً ثابتاً من رمز السهم. */
export function symbolSeed(symbol: string): number {
  let seed = 0
  for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i)
  return seed
}

/** حركة اليوم المحاكاة لسهم: التغير، الحجم، القيمة، الصفقات، والمدى. */
export function getDailyData(s: Stock): DailyData {
  const symbol = s.sym.toUpperCase()
  const price = s.price ?? 1.0
  const rand = seededRand(symbolSeed(symbol))

  let change: number
  let pct: string
  let isUp: boolean
  let isFlat: boolean

  // البحث عن حركة معلنة مسبقاً في سوق دبي ثم أبوظبي
  let found: MovementStock | null = null
  for (const sec of SECTOR_MOVEMENTS) {
    const f = sec.stocks.find(st => st.sym.toUpperCase() === symbol)
    if (f) { found = f; break }
  }
  if (!found) {
    found = ADX_MOVEMENTS.find(st => st.sym.toUpperCase() === symbol) ?? null
  }

  if (typeof s.change === 'number') {
    // نسبة تغيّر حقيقية مجلوبة من المصدر اليومي (Yahoo / TradingView)
    const cp = s.change
    change = Math.round(price * (cp / 100) * 100) / 100
    pct = `${cp >= 0 ? '+' : ''}${cp.toFixed(2)}%`
    isUp = cp > 0
    isFlat = cp === 0
  } else if (found) {
    change = parseFloat(found.change)
    pct = found.pct
    isUp = parseFloat(found.change) > 0
    isFlat = parseFloat(found.change) === 0
  } else {
    const changePct = rand(3.5, -3.5)
    change = Math.round((price * (changePct / 100)) * 100) / 100
    pct = `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
    isUp = change > 0
    isFlat = change === 0
  }

  // OHLC حقيقي عند توفّره، وإلا توليد احتياطي
  const prevClose = Math.round((price - change) * 100) / 100
  const high = typeof s.high === 'number' ? s.high : Math.max(price, prevClose) * (1 + rand(0.012, 0.001))
  const low = typeof s.low === 'number' ? s.low : Math.min(price, prevClose) * (1 - rand(0.012, 0.001))
  const open = typeof s.open === 'number' ? s.open : prevClose * (1 + rand(0.004, -0.004))

  // الحجم الحقيقي عند توفّره، وإلا تقدير من القيمة السوقية
  let volume: number
  const isReal = typeof s.volume === 'number'
  if (isReal) {
    volume = s.volume as number
  } else {
    const rawMcap = parseAmount(s.mcap) ?? 5e9
    const mcapVal = rawMcap > 1e6 ? rawMcap / 1e9 : rawMcap
    volume = Math.round((mcapVal * 150000) * rand(2.2, 0.1))
  }
  const value = volume * price                       // قيمة التداول الحقيقية = الحجم × السعر
  const trades = Math.round(volume * rand(0.00005, 0.00001)) + 3  // تقديري (لا يوفّره المصدر)

  return {
    change, pct, volume, value, trades, prevClose, open, high, low,
    isUp, isFlat, isDown: !isUp && !isFlat, isReal,
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
