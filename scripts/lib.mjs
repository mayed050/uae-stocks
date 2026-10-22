// دوال نقية لخط جلب البيانات — مفصولة عن التأثيرات الجانبية (الشبكة/الملفات) لتكون قابلة للاختبار.

export const round = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p
export const num = (x) => (typeof x === 'number' && isFinite(x) ? x : null)
export const isoDate = (d) => d.toISOString().slice(0, 10)

// نقطة TradingView الخاصة بالسوق الإماراتي (uae/scan) تُرجع كل القيم بالدرهم مباشرة (تحقّق فحصٌ من خوادم
// GitHub: توزيع إعمار 1 و0.5، ديوا 0.062، الأول 0.80 — مطابقة للإعلانات الرسمية)، فلا تحويل عملات.
export const TV_SCAN_URL = 'https://scanner.tradingview.com/uae/scan'

// الأعمدة المطلوبة من TradingView Scanner — يُقرأ كل صف بأسماء الأعمدة لا بمواضعها.
export const TV_COLS = [
  'close', 'change', 'open', 'high', 'low', 'volume', 'market_cap_basic', 'price_earnings_ttm',
  'price_52_week_high', 'price_52_week_low', 'dividends_yield_current',
  'dividend_ex_date_recent', 'dividend_payment_date_recent', 'dividend_amount_recent',
  'dividend_ex_date_upcoming', 'dividend_payment_date_upcoming', 'dividend_amount_upcoming',
  'earnings_per_share_basic_ttm', 'return_on_equity', 'total_revenue_ttm', 'net_income_ttm', 'net_income_yoy_growth_ttm',
  'name', 'description', 'type', 'subtype', 'sector', 'industry', 'exchange', 'logoid',
]

/** صيغة مختصرة للقيمة السوقية بالدرهم. */
export function fmtMcap(n) {
  if (n >= 1e9) return (n / 1e9 >= 100 ? Math.round(n / 1e9) : round(n / 1e9, 1)) + ' مليار'
  if (n >= 1e6) return Math.round(n / 1e6) + ' مليون'
  return String(Math.round(n))
}

/** يحوّل صف TradingView (مصفوفة d بترتيب TV_COLS، القيم بالدرهم) إلى كائن اقتباس، أو null إن غاب السعر. */
export function parseTvRow(d) {
  if (!Array.isArray(d)) return null
  const v = Object.fromEntries(TV_COLS.map((c, i) => [c, d[i]]))
  if (num(v.close) === null) return null
  const str = (x) => (typeof x === 'string' && x.trim() ? x.trim() : null)
  return {
    price: v.close,
    changePct: num(v.change),
    open: num(v.open),
    high: num(v.high),
    low: num(v.low),
    volume: num(v.volume),
    mcapAed: num(v.market_cap_basic),
    pe: num(v.price_earnings_ttm),
    high52: num(v.price_52_week_high),
    low52: num(v.price_52_week_low),
    div: {
      yieldPct: num(v.dividends_yield_current),
      exRecent: tvDate(v.dividend_ex_date_recent),
      payRecent: tvDate(v.dividend_payment_date_recent),
      amountRecent: num(v.dividend_amount_recent),
      exNext: tvDate(v.dividend_ex_date_upcoming),
      payNext: tvDate(v.dividend_payment_date_upcoming),
      amountNext: num(v.dividend_amount_upcoming),
    },
    fundamentals: {
      eps: num(v.earnings_per_share_basic_ttm),
      roe: num(v.return_on_equity),
      revenue: num(v.total_revenue_ttm),
      netIncome: num(v.net_income_ttm),
      netGrowth: num(v.net_income_yoy_growth_ttm),
    },
    meta: {
      name: str(v.name),
      description: str(v.description),
      type: str(v.type),
      subtype: str(v.subtype),
      sector: str(v.sector),
      industry: str(v.industry),
      exchange: str(v.exchange),
      logoid: str(v.logoid),
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
  if (r.meta?.logoid) s.logo = logoUrl(r.meta.logoid)
  // التوزيع السنوي الفعلي (آخر 12 شهرًا) من العائد الجاري — يُستخدم حين يغيب تكرار التوزيع
  if (r.div?.yieldPct != null && r.div.yieldPct > 0) s.div.ttmPs = round((r.div.yieldPct / 100) * r.price, 4)
  // الأساسيات تُملأ آليًا للأسهم الآلية فقط؛ المنسّقة يدويًا تبقى كما أُدخلت
  if (s.auto && r.fundamentals) Object.assign(s, fundamentalsText(r.fundamentals))
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
    // التراكم اليومي للأسهم المنسّقة فقط (الأسهم المكتشفة آليًا كثيرة وتُضخّم الملف)
    if (!fetched[s.sym] && !s.auto && s.priceAuto && num(s.price) != null && s.asof) {
      const last = pts[pts.length - 1]
      if (!last || s.asof > last[0]) pts = [...pts, [s.asof, round(s.price, 3)]]
      else if (s.asof === last[0]) pts = [...pts.slice(0, -1), [s.asof, round(s.price, 3)]]
    }
    if (pts.length) out[s.sym] = pts.slice(-maxPoints)
  }
  return out
}

// ───────────── التغطية الكاملة: اكتشاف أسهم السوقين آليًا ─────────────

/** رابط شعار الشركة لدى TradingView. */
export const logoUrl = (logoid) => `https://s3-symbol-logo.tradingview.com/${logoid}--big.svg`

/** مفتاح السهم في TradingView بصيغة «السوق-الرمز» (يطابق حقل tradingview في data.json). */
export const stockKey = (s) => s.tradingview ?? `${s.ex}-${s.sym}`

/**
 * اسم عربي نظيف من وصف TradingView: توحيد أشكال العرض الطباعية (ﻷ ← لأ) بـ NFKC، وحذف الصيغ القانونية
 * (ش.م.ع، PJSC…). إن خلا الوصف من حروف عربية يبقى الاسم الإنجليزي منظّفًا.
 */
export function arName(desc) {
  if (!desc) return null
  let n = desc.normalize('NFKC')
  n = n.replace(/\(\s*(ش\.?\s*م\.?\s*[عخ]\.?|P\.?J\.?S\.?C\.?|P\.?S\.?C\.?)\s*\)/gi, ' ')
  n = n.replace(/(?<=^|[\s()])(ش\.?\s?م\.?\s?[عخ]\.?|P\.?J\.?S\.?C\.?|P\.?S\.?C\.?|PLC|Ltd\.?)(?=$|[\s),])/gi, ' ')
  n = n.replace(/\s*\(\s*\)\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/[\s،,.-]+$/u, '').trim()
  return n || null
}

// القطاع العربي: من الصناعة أولًا (أدق)، ثم من القطاع العام. المفردات تطابق data.json وفلاتر المستكشف.
const INDUSTRY_AR = {
  'Major Banks': 'بنوك', 'Regional Banks': 'بنوك', 'Savings Banks': 'بنوك',
  'Property/Casualty Insurance': 'تأمين', 'Life/Health Insurance': 'تأمين', 'Multi-Line Insurance': 'تأمين', 'Specialty Insurance': 'تأمين', 'Insurance Brokers/Services': 'تأمين',
  'Real Estate Development': 'عقار', 'Real Estate Investment Trusts': 'عقار',
  'Investment Managers': 'خدمات مالية', 'Investment Banks/Brokers': 'خدمات مالية', 'Finance/Rental/Leasing': 'خدمات مالية',
  'Financial Conglomerates': 'استثمار / متنوع', 'Investment Trusts/Mutual Funds': 'استثمار / متنوع', 'Industrial Conglomerates': 'استثمار / متنوع',
  'Electric Utilities': 'مرافق', 'Water Utilities': 'مرافق', 'Gas Distributors': 'مرافق', 'Alternative Power Generation': 'مرافق',
  'Airlines': 'طيران / نقل',
  'Oil & Gas Production': 'طاقة', 'Integrated Oil': 'طاقة', 'Oil Refining/Marketing': 'طاقة', 'Contract Drilling': 'طاقة', 'Oilfield Services/Equipment': 'طاقة', 'Oil & Gas Pipelines': 'طاقة',
  'Chemicals: Major Diversified': 'بتروكيماويات', 'Chemicals: Specialty': 'بتروكيماويات', 'Chemicals: Agricultural': 'بتروكيماويات',
  'Engineering & Construction': 'إنشاءات وهندسة',
  'Hospital/Nursing Management': 'رعاية صحية', 'Medical/Nursing Services': 'رعاية صحية', 'Pharmaceuticals: Major': 'رعاية صحية', 'Pharmaceuticals: Other': 'رعاية صحية',
}
const SECTOR_AR = {
  'Finance': 'خدمات مالية', 'Utilities': 'مرافق', 'Communications': 'اتصالات', 'Transportation': 'نقل / خدمات',
  'Energy Minerals': 'طاقة', 'Process Industries': 'صناعة', 'Non-Energy Minerals': 'صناعة', 'Producer Manufacturing': 'صناعة',
  'Industrial Services': 'إنشاءات وهندسة', 'Technology Services': 'تكنولوجيا', 'Electronic Technology': 'تكنولوجيا',
  'Consumer Non-Durables': 'أغذية ومشروبات', 'Consumer Services': 'خدمات استهلاكية', 'Consumer Durables': 'تجزئة / استهلاك',
  'Retail Trade': 'تجزئة / استهلاك', 'Distribution Services': 'تجزئة / استهلاك', 'Commercial Services': 'خدمات تجارية',
  'Health Technology': 'رعاية صحية', 'Health Services': 'رعاية صحية', 'Miscellaneous': 'استثمار / متنوع',
}
export function arSector(sector, industry) {
  return INDUSTRY_AR[industry] ?? SECTOR_AR[sector] ?? 'أخرى'
}

/** الأساسيات (آخر 12 شهرًا) بصيغة النصوص المعروضة في الموقع. */
export function fundamentalsText(f) {
  const out = {}
  if (f.eps != null) out.eps = String(round(f.eps, 2))
  if (f.roe != null) out.roe = `${round(f.roe, 1)}%`
  if (f.revenue != null && f.revenue > 0) out.rev = fmtMcap(f.revenue)
  if (f.netIncome != null) {
    const abs = fmtMcap(Math.abs(f.netIncome))
    const growth = f.netGrowth != null && Math.abs(f.netGrowth) < 1000 ? ` (${f.netGrowth >= 0 ? '+' : ''}${round(f.netGrowth, 1)}%)` : ''
    out.net = `${f.netIncome < 0 ? 'خسارة ' : ''}${abs}${growth}`
  }
  return out
}

/** رمز آمن لعقد البيانات (أحرف لاتينية كبيرة وأرقام). */
const safeSym = (name) => (name ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

/**
 * يكتشف الأسهم العادية في سوقَي دبي وأبوظبي غير المغطّاة بعد، ويبني لكل منها سجلًا آليًا (auto: true)
 * بتصنيف «غير مصنّف» وتوزيعات فارغة تُملأ لاحقًا بـ mergeDividend. rows: [{ key, q }] من parseTvRow.
 */
export function discoverStocks(rows, stocks) {
  const covered = new Set(stocks.map(stockKey))
  const syms = new Set(stocks.map((s) => s.sym))
  const out = []
  for (const { key, q } of rows) {
    const m = q?.meta
    if (!m || m.type !== 'stock' || m.subtype !== 'common') continue
    if (m.exchange !== 'DFM' && m.exchange !== 'ADX') continue
    if (covered.has(key)) continue
    const sym = safeSym(m.name)
    if (!sym || syms.has(sym)) continue
    syms.add(sym)
    out.push({
      sym,
      name: arName(m.description) ?? sym,
      ex: m.exchange,
      sector: arSector(m.sector, m.industry),
      cat: 'unrated',
      auto: true,
      tradingview: key === `${m.exchange}-${sym}` ? undefined : key,
      priceAuto: true,
      price: null,
      asof: null,
      mcap: null,
      pe: null,
      eps: null,
      roe: null,
      net: null,
      rev: null,
      div: { ps: null, yld: null, lastEnt: null, exd: null, rec: null, pay: null, agm: null, freq: null },
    })
  }
  return out
}
