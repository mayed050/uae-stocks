import { describe, it, expect } from 'vitest'
import { getDailyData, periodSeries } from '@/market'
import { SECTOR_TITLES, mapDFMSectorToDb } from '@/data/sectors'
import publicData from '../../public/data.json'
import type { HistPoint } from '@/store/useHistory'
import { makeStock } from './factory'

describe('getDailyData', () => {
  it('يشتق الإغلاق السابق والتغيّر بالدرهم من السعر ونسبة التغيّر الحقيقيين', () => {
    const d = getDailyData(makeStock({ sym: 'EMAAR', price: 11.14, change: -2.11, volume: 23925237, open: 11.38, high: 11.38, low: 11.1 }))
    expect(d.prevClose).toBeCloseTo(11.38, 2)
    expect(d.change).toBeCloseTo(-0.24, 2)
    expect(d.pct).toBe('-2.11%')
    expect(d.value).toBeCloseTo(23925237 * 11.14)
    expect([d.isUp, d.isDown, d.isFlat]).toEqual([false, true, false])
  })
  it('لا يولّد أي قيمة لما غاب: كل الحقول null والنسبة «—»', () => {
    const d = getDailyData(makeStock({ sym: 'DIB', price: 7.4 }))
    expect(d).toMatchObject({ changePct: null, change: null, prevClose: null, open: null, high: null, low: null, volume: null, value: null, pct: '—' })
    expect([d.isUp, d.isDown, d.isFlat]).toEqual([false, false, false])
  })
  it('النسبة الموجبة بإشارة واحدة', () => {
    expect(getDailyData(makeStock({ price: 5, change: 2.53 })).pct).toBe('+2.53%')
  })
})

describe('تصنيف القطاعات', () => {
  it('كل قطاع في بيانات الأسهم ينتمي إلى قطاع عرض واحد بالضبط', () => {
    const sectors = new Set((publicData as { stocks: { sector: string }[] }).stocks.map((s) => s.sector))
    for (const sec of sectors) {
      const owners = SECTOR_TITLES.filter((t) => mapDFMSectorToDb(t).includes(sec))
      expect(owners, sec).toHaveLength(1)
    }
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
