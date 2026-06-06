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

export interface PriceHistory {
  data: { date: string; price: number }[]
  high: number
  low: number
  open: number
  close: number
  change: number
  changePct: number
  isOverallUp: boolean
}

const TIMEFRAME_POINTS: Record<string, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 120, '1Y': 250 }

/** يبني سلسلة الرسم من أسعار إغلاق تاريخية حقيقية ([تاريخ، سعر])، مقسّمة حسب الفترة. */
export function realHistory(points: [string, number][], timeframe: string, currentPrice: number): PriceHistory {
  const want = TIMEFRAME_POINTS[timeframe] ?? points.length
  const slice = points.slice(Math.max(0, points.length - want))
  const data = slice.map(([d, c]) => {
    const dt = new Date(d)
    const label = (timeframe === '1W' || timeframe === '1M')
      ? dt.toLocaleDateString('ar-AE', { day: 'numeric', month: 'short' })
      : dt.toLocaleDateString('ar-AE', { month: 'short', year: '2-digit' })
    return { date: label, price: c }
  })
  if (data.length) data[data.length - 1].price = currentPrice
  const prices = data.map((d) => d.price)
  const high = prices.length ? Math.max(...prices) : currentPrice
  const low = prices.length ? Math.min(...prices) : currentPrice
  const open = data[0]?.price ?? currentPrice
  const close = currentPrice
  const change = close - open
  const changePct = open > 0 ? (change / open) * 100 : 0
  return { data, high, low, open, close, change, changePct, isOverallUp: change >= 0 }
}

/** سلسلة أسعار تاريخية محاكاة لفترة زمنية مختارة. */
export function generateHistoricalData(sym: string, timeframe: string, currentPrice: number): PriceHistory {
  const seed = symbolSeed(sym)
  const points = TIMEFRAME_POINTS[timeframe] ?? 365

  const data: { date: string; price: number }[] = []
  let price = currentPrice
  const isUpTrend = seed % 2 === 0
  const volatility = 0.012
  const today = new Date()

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const label = (timeframe === '1W' || timeframe === '1M')
      ? date.toLocaleDateString('ar-AE', { day: 'numeric', month: 'short' })
      : date.toLocaleDateString('ar-AE', { month: 'short', year: '2-digit' })

    data.push({ date: label, price: parseFloat(price.toFixed(2)) })

    const changePct = (Math.sin(seed + i) * volatility) + (isUpTrend ? -0.0006 : 0.0006)
    price = price * (1 - changePct)
  }

  data[data.length - 1].price = currentPrice
  const prices = data.map(d => d.price)
  const high = Math.max(...prices)
  const low = Math.min(...prices)
  const open = data[0].price
  const close = currentPrice
  const change = close - open
  const changePct = (change / open) * 100

  return { data, high, low, open, close, change, changePct, isOverallUp: change >= 0 }
}

/** سلسلة مصغّرة (sparkline) من 10 نقاط لعرض الاتجاه. */
export function generateSparklineData(sym: string, currentPrice: number): number[] {
  const seed = symbolSeed(sym)
  const points = 10
  const data: number[] = []
  let price = currentPrice
  const isUpTrend = seed % 2 === 0

  for (let i = points - 1; i >= 0; i--) {
    data.push(price)
    const changePct = (Math.sin(seed + i) * 0.008) + (isUpTrend ? -0.0004 : 0.0004)
    price = price * (1 - changePct)
  }
  return data.reverse()
}
