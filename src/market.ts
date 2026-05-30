/**
 * أدوات بيانات السوق المحاكاة — وحدة مشتركة لتجنّب تكرار المنطق بين Overview و Screener.
 *
 * ⚠️ تنبيه: القيم هنا (التغير اليومي، الأحجام، الأسعار التاريخية) مُولّدة بخوارزمية ثابتة
 * مشتقة من رمز السهم (seed) لأغراض العرض فقط، وليست بيانات سوق حقيقية لحظية.
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

  if (found) {
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

  const prevClose = price - change
  const high = Math.max(price, prevClose) * (1 + rand(0.012, 0.001))
  const low = Math.min(price, prevClose) * (1 - rand(0.012, 0.001))
  const open = prevClose * (1 + rand(0.004, -0.004))

  const rawMcap = parseAmount(s.mcap) ?? 5e9
  const mcapVal = rawMcap > 1e6 ? rawMcap / 1e9 : rawMcap
  const volume = Math.round((mcapVal * 150000) * rand(2.2, 0.1))
  const value = volume * price
  const trades = Math.round(volume * rand(0.00005, 0.00001)) + 3

  return {
    change, pct, volume, value, trades, prevClose, open, high, low,
    isUp, isFlat, isDown: !isUp && !isFlat,
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
