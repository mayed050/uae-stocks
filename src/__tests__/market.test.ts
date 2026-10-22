import { describe, it, expect } from 'vitest'
import { symbolSeed, seededRand, getDailyData, periodSeries } from '@/market'
import type { HistPoint } from '@/store/useHistory'
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

describe('periodSeries', () => {
  const hist: HistPoint[] = [
    ['2026-01-05', 10], ['2026-09-30', 11], ['2026-10-14', 12], ['2026-10-20', 13], ['2026-10-21', 12.5],
  ]
  it('يقطع بالتاريخ التقويمي ويحسب التغيّر من أول الفترة', () => {
    const w = periodSeries(hist, '1W')!
    expect(w.points.map((p) => p[0])).toEqual(['2026-10-14', '2026-10-20', '2026-10-21'])
    expect(w.start).toBe(12)
    expect(w.changePct).toBeCloseTo(4.1667, 3)
    expect(w.high).toBe(13)
  })
  it('يُلحق السعر الحالي الأحدث ويستبدل نقطة اليوم نفسه', () => {
    expect(periodSeries(hist, 'ALL', { price: 14, asof: '2026-10-22' })!.points.at(-1)).toEqual(['2026-10-22', 14])
    const same = periodSeries(hist, 'ALL', { price: 12.6, asof: '2026-10-21' })!
    expect(same.points.at(-1)).toEqual(['2026-10-21', 12.6])
    expect(same.points).toHaveLength(5)
  })
  it('null عند غياب سجل كافٍ (لا توليد بيانات)', () => {
    expect(periodSeries([], '3M', { price: 5, asof: '2026-10-22' })).toBeNull()
  })
})
