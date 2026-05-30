import { describe, it, expect } from 'vitest'
import {
  parseAmount, parseYield, parseGrowth, fmtAmount,
  parseDivPs, getAnnualPs, scores, symColor,
} from '@/format'
import { makeStock } from './factory'

describe('parseAmount', () => {
  it('يحلّل المليار والمليون والألف', () => {
    expect(parseAmount('130.5 مليار')).toBeCloseTo(130.5e9)
    expect(parseAmount('5 مليون')).toBeCloseTo(5e6)
    expect(parseAmount('800 ألف')).toBeCloseTo(8e5)
  })
  it('يحوّل الدولار إلى الدرهم عند غياب قيمة بالدرهم صراحة', () => {
    expect(parseAmount('5.2 مليار $')).toBeCloseTo(5.2e9 * 3.6725)
  })
  it('يفضّل القيمة المذكورة بالدرهم صراحة دون تحويل', () => {
    expect(parseAmount('5.2 مليار $ (~19.1 مليار درهم)')).toBeCloseTo(19.1e9)
  })
  it('يعيد null للقيم الفارغة', () => {
    expect(parseAmount(null)).toBeNull()
    expect(parseAmount('')).toBeNull()
  })
})

describe('parseYield', () => {
  it('يستخرج أول رقم كنسبة', () => {
    expect(parseYield('~4.7% سنوي')).toBe(4.7)
    expect(parseYield('~7–8%')).toBe(7)
  })
  it('null عند الغياب', () => {
    expect(parseYield(null)).toBeNull()
    expect(parseYield('غير معلن')).toBeNull()
  })
})

describe('parseGrowth', () => {
  it('يقرأ النسبة داخل القوس مع إشارتها', () => {
    expect(parseGrowth('9.09 مليار (+25.6%)')).toBeCloseTo(25.6)
    expect(parseGrowth('345 مليون (+21%)')).toBeCloseTo(21)
    expect(parseGrowth('1.0 مليار (-5%)')).toBeCloseTo(-5)
  })
  it('null عند عدم وجود قوس نسبة', () => {
    expect(parseGrowth('23.44 مليار')).toBeNull()
  })
})

describe('fmtAmount', () => {
  it('يصيغ المليارات والملايين', () => {
    expect(fmtAmount(2.5e9)).toBe('2.5 مليار')
    expect(fmtAmount(5e6)).toBe('5 مليون')
  })
  it('شرطة للقيمة الفارغة', () => {
    expect(fmtAmount(null)).toBe('—')
  })
})

describe('parseDivPs', () => {
  it('يحوّل الفلس إلى درهم', () => {
    expect(parseDivPs('6.2 فلس')).toBeCloseTo(0.062)
    expect(parseDivPs('~6.6 فلس (شريحة)')).toBeCloseTo(0.066)
  })
  it('يبقي قيمة الدرهم كما هي', () => {
    expect(parseDivPs('1.00 درهم')).toBeCloseTo(1)
    expect(parseDivPs('0.35 درهم (35%)')).toBeCloseTo(0.35)
  })
})

describe('getAnnualPs', () => {
  it('يضاعف حسب تكرار التوزيع الرسمي', () => {
    expect(getAnnualPs(makeStock({}, { ps: '10 فلس', freq: 'ربعي' }))).toBeCloseTo(0.4)
    expect(getAnnualPs(makeStock({}, { ps: '6.2 فلس', freq: 'نصف سنوي' }))).toBeCloseTo(0.124)
    expect(getAnnualPs(makeStock({}, { ps: '1.00 درهم', freq: 'سنوي' }))).toBeCloseTo(1)
  })
})

describe('scores', () => {
  it('كل المحاور ضمن النطاق 0..100', () => {
    const s = scores(makeStock())
    for (const v of Object.values(s)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })
})

describe('symColor', () => {
  it('ثابت لنفس الرمز', () => {
    expect(symColor('DEWA')).toBe(symColor('DEWA'))
    expect(symColor('DEWA')).toMatch(/^hsl\(/)
  })
})
