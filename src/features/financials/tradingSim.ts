/**
 * محاكيات بيانات التداول لصفحة النتائج المالية.
 * ⚠️ قيم توضيحية مُولّدة بخوارزمية ثابتة من رمز السهم — ليست بيانات سوق حقيقية لحظية.
 */
import type { Stock } from '@/data'
import { parseAmount } from '@/format'
import { seededRand, symbolSeed } from '@/market'

/** نوع بيانات اليوم الفنية — يُستخدم في مكوّنات التبويبات الفرعية. */
export type TechnicalData = ReturnType<typeof getTechnicalData>
/** صفّ جلسة تداول يومية في تبويب «ملخص يومي». */
export type DailySessionRow = ReturnType<typeof generateDailySessions>[number]

/** بيانات اليوم الفنية والطلبات/العروض والمدى السنوي لسهم. */
export function getTechnicalData(s: Stock) {
  const symbol = s.sym.toUpperCase()
  const price = s.price ?? 1.0
  const rand = seededRand(symbolSeed(symbol))

  // حساب التغير اليومي
  const changePct = rand(2.8, -2.2) // -2.2% to +2.8%
  const change = Math.round((price * (changePct / 100)) * 100) / 100
  const pct = `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
  const isUp = change > 0
  const isFlat = change === 0

  const prevClose = price - change
  const open = prevClose * (1 + rand(0.003, -0.003))
  const high = Math.max(price, prevClose) * (1 + rand(0.008, 0.001))
  const low = Math.min(price, prevClose) * (1 - rand(0.008, 0.001))

  // حساب المدى السنوي 52 أسبوعاً
  const yearHigh = price * (1 + rand(0.35, 0.12))
  const yearLow = price * (1 - rand(0.30, 0.08))

  // الطلبات والعروض
  const bestBid = price - 0.01
  const bestAsk = price + 0.01
  const rawMcap = parseAmount(s.mcap) ?? 5e9
  const mcapVal = rawMcap > 1e6 ? rawMcap / 1e9 : rawMcap
  const volume = Math.round((mcapVal * 160000) * rand(2.5, 0.1))
  const value = volume * price

  const bidVol = Math.round(volume * rand(0.07, 0.01))
  const askVol = Math.round(volume * rand(0.05, 0.01))
  const trades = Math.round(volume * rand(0.00006, 0.00001)) + 4

  return {
    change,
    pct,
    isUp,
    isFlat,
    isDown: !isUp && !isFlat,
    open,
    prevClose,
    high,
    low,
    yearHigh,
    yearLow,
    bestBid,
    bestAsk,
    bidVol,
    askVol,
    volume,
    value,
    trades
  }
}

/** آخر N جلسة تداول (أيام عمل، تتخطّى السبت والأحد) بصيغة DD-MM-YYYY، الأحدث أولاً. */
function lastTradingDays(count: number, from: Date = new Date()): string[] {
  const out: string[] = []
  const d = new Date(from)
  while (out.length < count) {
    const day = d.getDay() // 0=الأحد، 6=السبت — عطلة سوقي الإمارات (التداول الإثنين–الجمعة)
    if (day !== 0 && day !== 6) {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      out.push(`${dd}-${mm}-${d.getFullYear()}`)
    }
    d.setDate(d.getDate() - 1)
  }
  return out
}

/** صفوف تاريخية يومية مستقرة (آخر 7 جلسات) لتبويب «ملخص يومي». */
export function generateDailySessions(s: Stock) {
  const symbol = s.sym.toUpperCase()
  const rand = seededRand(symbolSeed(symbol))

  const basePrice = s.price ?? 1.0
  const rawMcap = parseAmount(s.mcap) ?? 5e9
  const mcapVal = rawMcap > 1e6 ? rawMcap / 1e9 : rawMcap

  // تُشتقّ التواريخ من اليوم الحالي بدل تثبيتها يدويًا (كانت تتقادم مع الزمن).
  const dates = lastTradingDays(7)

  let currentClose = basePrice
  const rows: {
    date: string; open: number; high: number; low: number; trades: number;
    volume: number; value: number; close: number; prevClose: number; change: number; changePct: number;
  }[] = []

  for (const date of dates) {
    // محاكاة التغير اليومي
    const changePct = rand(3.2, -2.8) // -2.8% to +3.2%
    const change = Math.round((currentClose * (changePct / 100)) * 100) / 100
    const prevClose = Math.round((currentClose - change) * 100) / 100
    const open = Math.round((prevClose * (1 + rand(0.003, -0.003))) * 100) / 100
    const high = Math.round((Math.max(currentClose, prevClose) * (1 + rand(0.008, 0.001))) * 100) / 100
    const low = Math.round((Math.min(currentClose, prevClose) * (1 - rand(0.008, 0.001))) * 100) / 100

    const volume = Math.round((mcapVal * 150000) * rand(2.2, 0.2))
    const value = volume * currentClose
    const trades = Math.round(volume * rand(0.00005, 0.00001)) + 5

    rows.push({
      date,
      open,
      high,
      low,
      trades,
      volume,
      value,
      close: Math.round(currentClose * 100) / 100,
      prevClose,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100
    })

    // السعر لليوم السابق تاريخياً
    currentClose = prevClose
  }

  return rows
}
