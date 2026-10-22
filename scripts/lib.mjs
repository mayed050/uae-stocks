// دوال نقية لخط جلب البيانات — مفصولة عن التأثيرات الجانبية (الشبكة/الملفات) لتكون قابلة للاختبار.

export const round = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p
export const num = (x) => (typeof x === 'number' && isFinite(x) ? x : null)
export const isoDate = (d) => d.toISOString().slice(0, 10)

// TradingView يُرجع القيمة السوقية بالدولار لهذه الأسواق؛ نحوّلها إلى الدرهم.
export const USD_AED = 3.6725

// ترتيب الأعمدة المطلوبة من TradingView Scanner.
export const TV_COLS = ['close', 'change', 'open', 'high', 'low', 'volume', 'market_cap_basic', 'price_earnings_ttm']

/** صيغة مختصرة للقيمة السوقية بالدرهم. */
export function fmtMcap(n) {
  if (n >= 1e9) return (n / 1e9 >= 100 ? Math.round(n / 1e9) : round(n / 1e9, 1)) + ' مليار'
  if (n >= 1e6) return Math.round(n / 1e6) + ' مليون'
  return String(Math.round(n))
}

/** يحوّل صف TradingView (مصفوفة d بترتيب TV_COLS) إلى كائن اقتباس، أو null إن غاب السعر. */
export function parseTvRow(d) {
  if (!Array.isArray(d)) return null
  const [close, change, open, high, low, volume, mcap, pe] = d
  if (num(close) === null) return null
  const mcapUsd = num(mcap)
  return {
    price: close,
    changePct: num(change),
    open: num(open),
    high: num(high),
    low: num(low),
    volume: num(volume),
    mcapAed: mcapUsd != null ? mcapUsd * USD_AED : null,
    pe: num(pe),
    src: 'tradingview',
  }
}

// المؤشران العامّان للسوقين ورمزاهما في TradingView Scanner.
export const INDEX_TICKERS = {
  DFMGI: { tv: 'DFM:DFMGI', name: 'مؤشر سوق دبي المالي العام', ex: 'DFM' },
  FADGI: { tv: 'ADX:FADGI', name: 'مؤشر فوتسي سوق أبوظبي العام', ex: 'ADX' },
}

/** يحوّل اقتباس TradingView لمؤشر إلى السجل المخزّن في data.json (التغيّر بالنقاط مشتق من النسبة). */
export function toIndexQuote(code, q, time) {
  const meta = INDEX_TICKERS[code]
  if (!meta || !q || num(q.price) === null) return null
  const value = round(q.price, 2)
  const changePct = num(q.changePct) != null ? round(q.changePct, 2) : null
  const change = changePct != null ? round(value - value / (1 + changePct / 100), 2) : null
  return { code, name: meta.name, ex: meta.ex, value, change, changePct, asof: isoDate(time) }
}

/** يطبّق اقتباسًا على كائن سهم (يحدّث الحقول المتوفّرة فقط). يعيد السهم نفسه. */
export function applyQuote(s, r, time) {
  s.price = round(r.price, 3)
  if (r.changePct != null) s.change = round(r.changePct, 2)
  if (r.open != null) s.open = round(r.open, 3)
  if (r.high != null) s.high = round(r.high, 3)
  if (r.low != null) s.low = round(r.low, 3)
  if (r.volume != null) s.volume = Math.round(r.volume)
  if (r.pe != null && r.pe > 0) s.pe = round(r.pe, 1)
  if (r.mcapAed != null && r.mcapAed > 0) s.mcap = fmtMcap(r.mcapAed)
  s.asof = isoDate(time ?? r.time ?? new Date())
  return s
}
