import { describe, it, expect } from 'vitest'
import { num, round, fmtMcap, parseTvRow, applyQuote, USD_AED, toIndexQuote, tvDate, fmtDps, mergeDividend, staleStocks, mergeHistory, TV_DIV_FX } from '../lib.mjs'

describe('num', () => {
  it('يقبل الأرقام الصحيحة', () => {
    expect(num(0)).toBe(0)
    expect(num(12.5)).toBe(12.5)
    expect(num(-3)).toBe(-3)
  })
  it('يرفض غير الأرقام و NaN/Infinity', () => {
    expect(num(NaN)).toBeNull()
    expect(num(Infinity)).toBeNull()
    expect(num('5')).toBeNull()
    expect(num(null)).toBeNull()
    expect(num(undefined)).toBeNull()
  })
})

describe('round', () => {
  it('يقرّب لعدد المنازل المطلوب', () => {
    expect(round(1.2345, 2)).toBe(1.23)
    expect(round(1.2355, 2)).toBe(1.24)
    expect(round(2.61234, 3)).toBe(2.612)
    expect(round(5)).toBe(5)
  })
})

describe('fmtMcap', () => {
  it('يصيغ المليارات (أقل من 100 بمنزلة عشرية)', () => {
    expect(fmtMcap(27.2e9)).toBe('27.2 مليار')
    expect(fmtMcap(99.9e9)).toBe('99.9 مليار')
  })
  it('يصيغ المليارات الكبيرة كأعداد صحيحة', () => {
    expect(fmtMcap(130.4e9)).toBe('130 مليار')
    expect(fmtMcap(179e9)).toBe('179 مليار')
  })
  it('يصيغ الملايين والقيم الصغيرة', () => {
    expect(fmtMcap(500e6)).toBe('500 مليون')
    expect(fmtMcap(12345)).toBe('12345')
  })
})

describe('parseTvRow', () => {
  it('يحوّل صفًا صحيحًا ويحوّل القيمة السوقية من الدولار إلى الدرهم', () => {
    // [close, change, open, high, low, volume, market_cap_basic(USD), pe]
    const q = parseTvRow([2.61, 1.5564, 2.58, 2.61, 2.56, 14466114, 1e9, 14.9])
    expect(q.price).toBe(2.61)
    expect(q.changePct).toBeCloseTo(1.5564, 4)
    expect(q.open).toBe(2.58)
    expect(q.high).toBe(2.61)
    expect(q.low).toBe(2.56)
    expect(q.volume).toBe(14466114)
    expect(q.mcapAed).toBeCloseTo(1e9 * USD_AED, 5)
    expect(q.pe).toBe(14.9)
    expect(q.src).toBe('tradingview')
  })
  it('يرجع null عند غياب السعر أو إدخال غير صالح', () => {
    expect(parseTvRow([null, 1, 2, 3, 4, 5])).toBeNull()
    expect(parseTvRow(null)).toBeNull()
    expect(parseTvRow('x')).toBeNull()
  })
  it('يجعل الحقول الاختيارية الغائبة null', () => {
    const q = parseTvRow([5.0, undefined, undefined, undefined, undefined, undefined, undefined, undefined])
    expect(q.price).toBe(5.0)
    expect(q.changePct).toBeNull()
    expect(q.volume).toBeNull()
    expect(q.mcapAed).toBeNull()
    expect(q.pe).toBeNull()
  })
})

describe('applyQuote', () => {
  const T = new Date('2026-06-06T12:00:00Z')

  it('يحدّث الحقول المتوفّرة فقط', () => {
    const s = { sym: 'X', price: 1, pe: 10, mcap: 'قديم' }
    applyQuote(s, { price: 2.615, changePct: 1.234, open: 2.5, high: 2.7, low: 2.4, volume: 1000.6, pe: 12.34, mcapAed: 130.4e9 }, T)
    expect(s.price).toBe(2.615)
    expect(s.change).toBe(1.23)
    expect(s.open).toBe(2.5)
    expect(s.high).toBe(2.7)
    expect(s.low).toBe(2.4)
    expect(s.volume).toBe(1001)
    expect(s.pe).toBe(12.3)
    expect(s.mcap).toBe('130 مليار')
    expect(s.asof).toBe('2026-06-06')
  })

  it('لا يكتب P/E غير الموجب ولا يلمس الحقول الغائبة', () => {
    const s = { sym: 'Y', price: 1, pe: 8, mcap: 'يدوي', change: 5 }
    applyQuote(s, { price: 3, changePct: null, pe: 0, mcapAed: null }, T)
    expect(s.price).toBe(3)
    expect(s.pe).toBe(8) // لم يتغيّر (pe=0 مرفوض)
    expect(s.mcap).toBe('يدوي') // لم يتغيّر (mcapAed=null)
    expect(s.change).toBe(5) // changePct=null لا يكتب
  })
})

describe('toIndexQuote', () => {
  const t = new Date('2026-10-22T12:00:00Z')
  it('يبني سجل المؤشر ويشتق التغيّر بالنقاط من النسبة', () => {
    const iq = toIndexQuote('DFMGI', { price: 4215.8, changePct: 0.39 }, t)
    expect(iq).toEqual({
      code: 'DFMGI', name: 'مؤشر سوق دبي المالي العام', ex: 'DFM',
      value: 4215.8, change: 16.38, changePct: 0.39, asof: '2026-10-22',
    })
  })
  it('التغيّر null عند غياب النسبة', () => {
    expect(toIndexQuote('FADGI', { price: 9350.4, changePct: null }, t).change).toBeNull()
  })
  it('null لرمز غير معروف أو اقتباس بلا سعر', () => {
    expect(toIndexQuote('XYZ', { price: 1 }, t)).toBeNull()
    expect(toIndexQuote('DFMGI', undefined, t)).toBeNull()
    expect(toIndexQuote('DFMGI', { price: null }, t)).toBeNull()
  })
})

// القيم أدناه من فحص حقيقي لـ TradingView (22 أكتوبر 2026) — المبالغ بالدولار تُحوَّل إلى الدرهم.
const TODAY = '2026-10-22'
const manual = (over = {}) => ({ ps: '1.00 درهم', yld: '~5%', lastEnt: '2026-04-01', exd: '2026-04-03', rec: '2026-04-06', pay: '2026-04-22', agm: '2026-03-20', freq: 'سنوي', ...over })

describe('tvDate / fmtDps', () => {
  it('طابع TradingView (11:59 UTC) يعطي اليوم الصحيح', () => {
    expect(tvDate(1775217540)).toBe('2026-04-03')
    expect(tvDate(null)).toBeNull()
  })
  it('صيغة المبلغ: فلس دون الدرهم، ودرهم بمنزلتين', () => {
    // معايرة TV_DIV_FX على توزيعات رسمية: ديوا 6.2 فلس، إعمار 1.00 درهم و50 فلسًا، الأول 0.80 درهم
    expect(fmtDps(0.016854079728160002 * TV_DIV_FX)).toBe('6.2 فلس')
    expect(fmtDps(0.27183 * TV_DIV_FX)).toBe('1.00 درهم')
    expect(fmtDps(0.135915 * TV_DIV_FX)).toBe('50 فلس')
    expect(fmtDps(0.217472 * TV_DIV_FX)).toBe('80 فلس')
    expect(fmtDps(0)).toBeNull()
  })
})

describe('parseTvRow — التوزيعات و52 أسبوعًا', () => {
  it('يقرأ الحقول الجديدة ويحوّل المبالغ إلى الدرهم', () => {
    const q = parseTvRow([11.38, -1.2, 11.5, 11.6, 11.3, 1e6, 1e10, 9, 17.25, 10.15, 8.68, 1775217540, 1776859140, 0.27183, 1794571140, 1795780740, 0.135915])
    expect(q.high52).toBe(17.25)
    expect(q.low52).toBe(10.15)
    expect(q.div).toMatchObject({ yieldPct: 8.68, exRecent: '2026-04-03', payRecent: '2026-04-22', exNext: '2026-11-13', payNext: '2026-11-27' })
    expect(q.div.amountNext).toBeCloseTo(0.5, 3)
  })
})

describe('mergeDividend', () => {
  it('حدث أحدث (ديوا: مرحلي أكتوبر) يُعتمد ويُعلَّم آليًا، وتُفرَّغ الحقول المرتبطة بالحدث القديم', () => {
    const { div, changes, conflicts } = mergeDividend(
      manual({ exd: '2026-04-10', pay: '2026-04-20', ps: '6.2 فلس (شريحة)' }),
      { exRecent: '2026-10-15', payRecent: '2026-10-28', amountRecent: 0.016854 * TV_DIV_FX },
      TODAY,
    )
    expect(div).toMatchObject({ exd: '2026-10-15', pay: '2026-10-28', ps: '6.2 فلس', lastEnt: null, rec: null, agm: null })
    expect(div.auto).toEqual({ src: 'tradingview', asof: TODAY, fields: ['exd', 'pay', 'ps'] })
    expect(changes).toHaveLength(1)
    expect(conflicts).toEqual([])
  })
  it('الحدث نفسه بتاريخ مختلف (بنك أبوظبي الأول) يبقي اليدوي ويرفع تعارضًا', () => {
    const before = manual({ exd: '2026-03-09', pay: '2026-03-24', ps: '0.80 درهم' })
    const { div, changes, conflicts } = mergeDividend(before, { exRecent: '2026-03-18', payRecent: '2026-04-10', amountRecent: 0.7987 }, TODAY)
    expect(div.exd).toBe('2026-03-09')
    expect(div.auto).toBeUndefined()
    expect(changes).toEqual([])
    expect(conflicts).toEqual([{ field: 'exd', manual: '2026-03-09', auto: '2026-03-18' }])
  })
  it('تاريخ دفع = تاريخ الاستبعاد يُعدّ غير معروف (قيمة مؤقتة لدى المصدر)', () => {
    const { div } = mergeDividend(manual({ exd: '2026-04-08' }), { exRecent: '2026-07-31', payRecent: '2026-07-31', amountRecent: 0.2596 }, TODAY)
    expect(div.pay).toBeNull()
    expect(div.auto.fields).toEqual(['exd', 'pay', 'ps'])
  })
  it('سجل يدوي فارغ (ألفا ظبي) يُملأ من المصدر', () => {
    const { div } = mergeDividend(manual({ exd: null, pay: null, ps: 'غير معلن' }), { exRecent: '2026-03-25', payRecent: '2026-04-15', amountRecent: 0.1997 }, TODAY)
    expect(div).toMatchObject({ exd: '2026-03-25', pay: '2026-04-15', ps: '20 فلس' })
  })
  it('توزيع قادم (إعمار نوفمبر) يملأ خانة القادم، ولا يتكرّر في التشغيل التالي', () => {
    const tv = { exRecent: '2026-04-03', payRecent: '2026-04-22', amountRecent: 0.998, exNext: '2026-11-13', payNext: '2026-11-27', amountNext: 0.5 }
    const first = mergeDividend(manual(), tv, TODAY)
    expect(first.div).toMatchObject({ exd: '2026-04-03', nextExd: '2026-11-13', nextPay: '2026-11-27', nextPs: '50 فلس' })
    expect(first.changes.map((c) => c.kind)).toEqual(['upcoming'])
    const second = mergeDividend(first.div, tv, TODAY)
    expect(second.changes).toEqual([])
    expect(second.div).toEqual(first.div)
  })
  it('قادم يدوي مختلف يبقى ويُرفع تعارضًا؛ وقادم صار ماضيًا يُزال', () => {
    const c = mergeDividend(manual({ nextExd: '2026-11-20' }), { exNext: '2026-11-13' }, TODAY)
    expect(c.div.nextExd).toBe('2026-11-20')
    expect(c.conflicts[0]).toMatchObject({ field: 'nextExd' })
    const past = mergeDividend(manual({ exd: '2026-10-15', nextExd: '2026-10-15', nextPay: '2026-10-28' }), {}, TODAY)
    expect(past.div.nextExd).toBeUndefined()
  })
  it('العائد الجاري يتبع المصدر', () => {
    expect(mergeDividend(manual({ yld: '~5.5%' }), { yieldPct: 4.18848 }, TODAY).div.yld).toBe('~4.2%')
  })
})

describe('staleStocks', () => {
  it('يرصد الأسعار الأقدم من آخر جلسة بأكثر من يومين', () => {
    const st = [
      { sym: 'A', priceAuto: true, asof: '2026-10-22' },
      { sym: 'EAND', priceAuto: true, asof: '2026-10-13' },
      { sym: 'B', priceAuto: true, asof: '2026-10-20' },
      { sym: 'M', priceAuto: false, asof: '2026-01-01' },
    ]
    expect(staleStocks(st)).toEqual([{ sym: 'EAND', asof: '2026-10-13', days: 9 }])
  })
})

describe('mergeHistory', () => {
  const stocks = [
    { sym: 'DEWA', priceAuto: true, price: 2.68, asof: '2026-10-22' },
    { sym: 'FAB', priceAuto: true, price: 18.62, asof: '2026-10-22' },
    { sym: 'EMAAR', priceAuto: true, price: 11.38, asof: '2026-10-22' },
  ]
  it('المجلوب يحلّ محل القديم، وغير المجلوب يُلحق به إغلاق اليوم، ولا يُحذف ما تعذّر جلبه', () => {
    const existing = { FAB: [['2026-10-21', 18.9]], EMAAR: [['2026-10-21', 11.5]] }
    const fetched = { DEWA: [['2026-10-21', 2.66], ['2026-10-22', 2.68]] }
    const h = mergeHistory(existing, fetched, stocks)
    expect(h.DEWA).toEqual(fetched.DEWA)
    expect(h.FAB).toEqual([['2026-10-21', 18.9], ['2026-10-22', 18.62]])
    expect(h.EMAAR).toEqual([['2026-10-21', 11.5], ['2026-10-22', 11.38]])
  })
  it('تشغيلان في اليوم نفسه لا يكرّران النقطة، والطول محدود', () => {
    const once = mergeHistory({}, {}, stocks)
    expect(mergeHistory(once, {}, stocks).FAB).toEqual([['2026-10-22', 18.62]])
    const long = { FAB: Array.from({ length: 500 }, (_, i) => [`2025-01-${String(i).padStart(3, '0')}`, 1]) }
    expect(mergeHistory(long, {}, [{ sym: 'FAB', priceAuto: false }], 400).FAB).toHaveLength(400)
  })
})
