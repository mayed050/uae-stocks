// دوال نقية لخط جلب البيانات — مفصولة عن التأثيرات الجانبية (الشبكة/الملفات) لتكون قابلة للاختبار.

export const round = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p
export const num = (x) => (typeof x === 'number' && isFinite(x) ? x : null)
export const isoDate = (d) => d.toISOString().slice(0, 10)

// TradingView يُرجع القيمة السوقية بالدولار لهذه الأسواق؛ نحوّلها إلى الدرهم.
export const USD_AED = 3.6725

// مبالغ التوزيعات في TradingView محوّلة إلى الدولار بمعامل ≈ 3.6788 لا بسعر الربط (3.6725):
// معايَر على توزيعات معلنة رسميًا (ديوا 6.2 فلس، إعمار 1.00 و0.50 درهم، الأول 0.80، دبي الإسلامي 0.35)
// فيعيد كل مبلغ إلى قيمته الرسمية بدقة الفلس. القيمة السوقية تبقى بسعر الربط.
export const TV_DIV_FX = 3.6788

// ترتيب الأعمدة المطلوبة من TradingView Scanner (الحقول المالية والتوزيعات بالدولار لهذه الأسواق).
export const TV_COLS = [
  'close', 'change', 'open', 'high', 'low', 'volume', 'market_cap_basic', 'price_earnings_ttm',
  'price_52_week_high', 'price_52_week_low', 'dividends_yield_current',
  'dividend_ex_date_recent', 'dividend_payment_date_recent', 'dividend_amount_recent',
  'dividend_ex_date_upcoming', 'dividend_payment_date_upcoming', 'dividend_amount_upcoming',
]

/** صيغة مختصرة للقيمة السوقية بالدرهم. */
export function fmtMcap(n) {
  if (n >= 1e9) return (n / 1e9 >= 100 ? Math.round(n / 1e9) : round(n / 1e9, 1)) + ' مليار'
  if (n >= 1e6) return Math.round(n / 1e6) + ' مليون'
  return String(Math.round(n))
}

/** يحوّل صف TradingView (مصفوفة d بترتيب TV_COLS) إلى كائن اقتباس، أو null إن غاب السعر. */
export function parseTvRow(d) {
  if (!Array.isArray(d)) return null
  const [close, change, open, high, low, volume, mcap, pe, high52, low52, yld, exR, payR, amtR, exN, payN, amtN] = d
  if (num(close) === null) return null
  const mcapUsd = num(mcap)
  const usdToAed = (x) => (num(x) != null ? x * TV_DIV_FX : null)
  return {
    price: close,
    changePct: num(change),
    open: num(open),
    high: num(high),
    low: num(low),
    volume: num(volume),
    mcapAed: mcapUsd != null ? mcapUsd * USD_AED : null,
    pe: num(pe),
    high52: num(high52),
    low52: num(low52),
    div: {
      yieldPct: num(yld),
      exRecent: tvDate(exR),
      payRecent: tvDate(payR),
      amountRecent: usdToAed(amtR),
      exNext: tvDate(exN),
      payNext: tvDate(payN),
      amountNext: usdToAed(amtN),
    },
    src: 'tradingview',
  }
}

/** تاريخ TradingView (طابع يونكس ثوانٍ، الساعة 11:59 UTC) إلى YYYY-MM-DD، أو null. */
export function tvDate(ts) {
  return num(ts) != null && ts > 0 ? isoDate(new Date(ts * 1000)) : null
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
  if (r.high52 != null && r.low52 != null && r.high52 >= r.low52 && r.low52 > 0) {
    s.high52 = round(r.high52, 3)
    s.low52 = round(r.low52, 3)
  }
  s.asof = isoDate(time ?? r.time ?? new Date())
  return s
}

// ───────────── التوزيعات: دمج آلي محافظ مع البيانات اليدوية ─────────────

/** صيغة مبلغ التوزيع بالدرهم: أقل من درهم بالفلس (منزلة واحدة)، وإلا بالدرهم (منزلتان). */
export function fmtDps(aed) {
  if (num(aed) === null || aed <= 0) return null
  return aed < 1 ? `${round(aed * 100, 1)} فلس` : `${aed.toFixed(2)} درهم`
}

const DAY = 86400000
const days = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / DAY)
// TradingView يضع أحيانًا تاريخ الدفع = تاريخ الاستبعاد كقيمة مؤقتة؛ لا نعتمده إلا إن جاء بعده
const validPay = (ex, pay) => (pay && ex && pay > ex ? pay : null)
// نافذة «الحدث نفسه»: فرق أقل من 60 يومًا بين المصدرين يعني التوزيع ذاته (تعارض لا حدث جديد)
const SAME_EVENT_DAYS = 60

/**
 * يدمج توزيعات TradingView في سجل التوزيع اليدوي دون أن يطغى عليه:
 * - حدث أحدث (بفارق > 60 يومًا) أو سجل يدوي فارغ ← يُعتمد ويُعلَّم «آلي — يلزم التحقق».
 * - الحدث نفسه بتواريخ مختلفة ← يبقى اليدوي ويُرفع التعارض للمراجعة.
 * - توزيع قادم معلن ← nextExd/nextPay/nextPs ما لم يكن هناك قادم يدوي مختلف (تعارض).
 * - العائد الجاري يُحدَّث دائمًا (يتبع السعر). يُرجع { div, changes, conflicts }.
 */
export function mergeDividend(div, tv, today) {
  const out = { ...div }
  const changes = []
  const conflicts = []
  const autoFields = new Set(div.auto?.fields ?? [])
  const mark = (...f) => f.forEach((x) => autoFields.add(x))
  if (!tv) return { div, changes, conflicts }

  if (tv.yieldPct != null && tv.yieldPct > 0) {
    const y = `~${tv.yieldPct.toFixed(1)}%`
    if (out.yld !== y) {
      out.yld = y
      mark('yld')
    }
  }

  if (tv.exRecent) {
    const pay = validPay(tv.exRecent, tv.payRecent)
    const ps = fmtDps(tv.amountRecent)
    if (!out.exd || days(tv.exRecent, out.exd) > SAME_EVENT_DAYS) {
      Object.assign(out, { exd: tv.exRecent, pay, lastEnt: null, rec: null, agm: null })
      if (ps) out.ps = ps
      mark('exd', 'pay', ...(ps ? ['ps'] : []))
      changes.push({ kind: 'new', ex: tv.exRecent, pay, ps })
    } else if (Math.abs(days(tv.exRecent, out.exd)) <= SAME_EVENT_DAYS) {
      if (tv.exRecent !== out.exd) conflicts.push({ field: 'exd', manual: out.exd, auto: tv.exRecent })
      else if (pay && out.pay && pay !== out.pay) conflicts.push({ field: 'pay', manual: out.pay, auto: pay })
    }
  }

  if (tv.exNext && tv.exNext >= today) {
    const pay = validPay(tv.exNext, tv.payNext)
    const ps = fmtDps(tv.amountNext)
    if (out.nextExd && out.nextExd !== tv.exNext && !autoFields.has('nextExd')) {
      conflicts.push({ field: 'nextExd', manual: out.nextExd, auto: tv.exNext })
    } else if (out.nextExd !== tv.exNext || (ps && out.nextPs !== ps)) {
      out.nextExd = tv.exNext
      if (pay) out.nextPay = pay
      else delete out.nextPay
      if (ps) out.nextPs = ps
      mark('nextExd', ...(pay ? ['nextPay'] : []), ...(ps ? ['nextPs'] : []))
      changes.push({ kind: 'upcoming', ex: tv.exNext, pay, ps })
    }
  }

  const dropNext = () => {
    delete out.nextExd
    delete out.nextPay
    delete out.nextPs
    ;['nextExd', 'nextPay', 'nextPs'].forEach((f) => autoFields.delete(f))
  }
  // توزيع «قادم» صار ماضيًا (أصبح هو الأخير) ← يُزال من خانة القادم
  if (out.nextExd && out.exd && out.nextExd <= out.exd) dropNext()
  // «قادم» يدوي مضى تاريخه ويقع ضمن نافذة توزيع أخير أُضيف آليًا ← هو الحدث نفسه بتاريخ مختلف
  else if (out.nextExd && out.nextExd < today && out.exd && autoFields.has('exd') && Math.abs(days(out.nextExd, out.exd)) <= SAME_EVENT_DAYS) {
    conflicts.push({ field: 'exd', manual: out.nextExd, auto: out.exd })
    dropNext()
  }

  if (autoFields.size) out.auto = { src: 'tradingview', asof: today, fields: [...autoFields].sort() }
  return { div: out, changes, conflicts }
}

/** الأسهم المتقادمة: سعرها أقدم من آخر جلسة بأكثر من يومين تقويميين (يستوعب عطلة نهاية الأسبوع). */
export function staleStocks(stocks) {
  const session = stocks.reduce((m, s) => (s.asof && s.asof > m ? s.asof : m), '')
  return stocks
    .filter((s) => s.priceAuto && (!s.asof || days(session, s.asof) > 2))
    .map((s) => ({ sym: s.sym, asof: s.asof, days: s.asof ? days(session, s.asof) : null }))
}

// ───────────── السجل التاريخي: دمج متين وتراكم يومي ─────────────

/**
 * يبني السجل الجديد: السلاسل المجلوبة كاملةً (Yahoo لأسهم دبي) تحلّ محل القديمة؛ ولكل سهم آخر
 * يُلحق إغلاق اليوم من data.json إن كان أحدث من آخر نقطة (يبني سجل أبوظبي تراكميًا)؛
 * والسلاسل التي تعذّر جلبها تبقى كما هي بدل أن تُحذف. الطول الأقصى maxPoints نقطة.
 */
export function mergeHistory(existing, fetched, stocks, maxPoints = 400) {
  const out = {}
  for (const s of stocks) {
    let pts = fetched[s.sym] ?? existing[s.sym] ?? []
    if (!fetched[s.sym] && s.priceAuto && num(s.price) != null && s.asof) {
      const last = pts[pts.length - 1]
      if (!last || s.asof > last[0]) pts = [...pts, [s.asof, round(s.price, 3)]]
      else if (s.asof === last[0]) pts = [...pts.slice(0, -1), [s.asof, round(s.price, 3)]]
    }
    if (pts.length) out[s.sym] = pts.slice(-maxPoints)
  }
  return out
}
