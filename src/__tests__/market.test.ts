import { describe, it, expect } from 'vitest'
import {
  symbolSeed, seededRand, getDailyData,
  generateHistoricalData, generateSparklineData,
} from '@/market'
import { makeStock } from './factory'

describe('symbolSeed', () => {
  it('مجموع رموز الأحرف وثابت', () => {
    expect(symbolSeed('AB')).toBe(65 + 66)
    expect(symbolSeed('DEWA')).toBe(symbolSeed('DEWA'))
  })
})

describe('seededRand', () => {
  it('متسلسلة قابلة لإعادة الإنتاج لنفس الـ seed', () => {
    const a = seededRand(42)
    const b = seededRand(42)
    expect(a(1)).toBe(b(1))
    expect(a(1)).toBe(b(1))
  })
  it('يحترم الحدود الدنيا والعليا', () => {
    const r = seededRand(7)
    for (let i = 0; i < 50; i++) {
      const v = r(10, 2)
      expect(v).toBeGreaterThanOrEqual(2)
      expect(v).toBeLessThan(10)
    }
  })
})

describe('getDailyData', () => {
  it('حتمي لنفس السهم', () => {
    const s = makeStock({ sym: 'ZZZ', price: 5 })
    expect(getDailyData(s)).toEqual(getDailyData(s))
  })
  it('يستخدم الحركة المعلنة مسبقاً لسهم معروف (DIB صاعد)', () => {
    const d = getDailyData(makeStock({ sym: 'DIB', price: 7.4 }))
    expect(d.change).toBeCloseTo(0.02)
    expect(d.isUp).toBe(true)
    expect(d.isFlat).toBe(false)
  })
  it('تناسق أعلام الاتجاه', () => {
    const d = getDailyData(makeStock({ sym: 'QWERTY', price: 3 }))
    expect(d.isUp && d.isDown).toBe(false)
    expect([true, false]).toContain(d.isFlat)
  })
})

describe('generateHistoricalData', () => {
  it('عدد النقاط حسب الإطار الزمني وآخر سعر = السعر الحالي', () => {
    const h = generateHistoricalData('DEWA', '1W', 2.61)
    expect(h.data).toHaveLength(7)
    expect(h.data[h.data.length - 1].price).toBeCloseTo(2.61)
  })
  it('الإطار غير المعروف يرجع 365 نقطة', () => {
    expect(generateHistoricalData('DEWA', 'ALL', 2.61).data).toHaveLength(365)
  })
})

describe('generateSparklineData', () => {
  it('عشر نقاط وحتمية', () => {
    const a = generateSparklineData('EMAAR', 11.78)
    expect(a).toHaveLength(10)
    expect(a).toEqual(generateSparklineData('EMAAR', 11.78))
  })
})
