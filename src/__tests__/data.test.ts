import { describe, it, expect } from 'vitest'
import { parseDataset, HistorySchema, FinancialsSchema } from '@/data/schema'
import historyData from '../../public/history.json'
import financialsData from '../../public/financials.json'
import publicData from '../../public/data.json'
import seedData from '../data/seed.json'
import { makeStock } from './factory'

// حارس البيانات: يفشل هذا الملف إن خالف أي ملف بيانات مُلتزَم عقدَ البيانات.
// يُشغَّل أيضًا في سير عمل التحديث اليومي قبل دفع البيانات (update-data.yml).
const FILES: [string, unknown][] = [['public/data.json', publicData], ['src/data/seed.json', seedData]]

describe('ملفات البيانات المُلتزَمة', () => {
  for (const [f, json] of FILES) {
    it(`${f} يطابق عقد البيانات`, () => {
      const r = parseDataset(json)
      if (!r.ok) throw new Error(`${f} غير صالح:\n${r.error}`)
      expect(r.data.stocks.length).toBeGreaterThan(0)
    })
  }
  it('public/history.json يطابق شكل السجل التاريخي', () => {
    const r = HistorySchema.safeParse(historyData)
    if (!r.success) throw new Error(r.error.message)
    expect(Object.keys(r.data.history).length).toBeGreaterThan(0)
  })
  it('public/financials.json يطابق عقد البيانات المالية', () => {
    const r = FinancialsSchema.safeParse(financialsData)
    if (!r.success) throw new Error(r.error.message)
  })
})

describe('parseDataset', () => {
  const base = () => ({ lastUpdated: '2026-10-22T16:40:17.627Z', source: 'test', stocks: [makeStock({ asof: '2026-10-22' })] })

  it('يقبل مجموعة بيانات سليمة', () => {
    expect(parseDataset(base()).ok).toBe(true)
  })
  it('يرفض الرموز المكرّرة', () => {
    const d = base()
    d.stocks.push(makeStock({ asof: '2026-10-22' }))
    const r = parseDataset(d)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('رمز مكرّر')
  })
  it('يرفض تاريخًا بغير صيغة ISO', () => {
    const d = base()
    d.stocks[0] = makeStock({ asof: '2026-10-22' }, { exd: '10 أبريل' })
    expect(parseDataset(d).ok).toBe(false)
  })
  it('يرفض تغيّرًا يوميًا غير معقول (خطأ وحدة)', () => {
    const d = base()
    d.stocks[0] = makeStock({ asof: '2026-10-22', change: 500 })
    expect(parseDataset(d).ok).toBe(false)
  })
  it('يرفض سعرًا سالبًا ومدىً مقلوبًا', () => {
    const neg = base()
    neg.stocks[0] = makeStock({ asof: '2026-10-22', price: -1 })
    expect(parseDataset(neg).ok).toBe(false)
    const inv = base()
    inv.stocks[0] = makeStock({ asof: '2026-10-22', high: 9, low: 10 })
    expect(parseDataset(inv).ok).toBe(false)
  })
  it('يرفض صفحة HTML أو قيمة ليست كائن بيانات', () => {
    expect(parseDataset('<!doctype html>').ok).toBe(false)
    expect(parseDataset(null).ok).toBe(false)
  })
})
