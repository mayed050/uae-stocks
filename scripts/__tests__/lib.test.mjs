import { describe, it, expect } from 'vitest'
import { num, round, fmtMcap, parseTvRow, applyQuote, USD_AED } from '../lib.mjs'

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
