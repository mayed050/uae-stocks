import { describe, it, expect } from 'vitest'
import { parseISO, daysUntil, upcoming, isAlert } from '@/lib'
import { makeStock, isoDaysFromNow } from './factory'

describe('parseISO', () => {
  it('يحلّل تاريخاً صحيحاً', () => {
    const d = parseISO('2026-04-10')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2026)
    expect(d!.getMonth()).toBe(3) // أبريل = الفهرس 3
    expect(d!.getDate()).toBe(10)
  })
  it('null للقيم غير الصالحة', () => {
    expect(parseISO(null)).toBeNull()
    expect(parseISO('لا يوجد')).toBeNull()
  })
})

describe('daysUntil', () => {
  it('صفر لتاريخ اليوم', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(daysUntil(today)).toBe(0)
  })
  it('يحسب الأيام المستقبلية', () => {
    expect(daysUntil(parseISO(isoDaysFromNow(10)))).toBe(10)
  })
  it('null عند غياب التاريخ', () => {
    expect(daysUntil(null)).toBeNull()
  })
})

describe('upcoming', () => {
  it('يعيد أقرب تاريخ مستقبلي مع تسميته', () => {
    const u = upcoming(makeStock({}, { exd: isoDaysFromNow(5) }))
    expect(u).not.toBeNull()
    expect(u!.n).toBe(5)
    expect(u!.label).toBe('تاريخ الاستبعاد')
  })
  it('يعلّم التواريخ المنقضية بأنها مُودعة', () => {
    const u = upcoming(makeStock({}, { exd: isoDaysFromNow(-3), pay: isoDaysFromNow(-1) }))
    expect(u).not.toBeNull()
    expect(u!.label).toContain('تم الإيداع')
  })
  it('null عندما لا توجد أي تواريخ', () => {
    expect(upcoming(makeStock())).toBeNull()
  })
})

describe('isAlert', () => {
  it('ينبّه ضمن نافذة 0..30 يوماً', () => {
    expect(isAlert({ n: 0, label: '' })).toBe(true)
    expect(isAlert({ n: 30, label: '' })).toBe(true)
  })
  it('لا ينبّه خارج النافذة أو للماضي', () => {
    expect(isAlert({ n: 31, label: '' })).toBe(false)
    expect(isAlert({ n: -1, label: '' })).toBe(false)
  })
  it('ينبّه للعناصر المراقبة بلا تاريخ', () => {
    expect(isAlert({ n: null, watch: true, label: '' })).toBe(true)
  })
  it('لا ينبّه للقيمة الفارغة', () => {
    expect(isAlert(null)).toBe(false)
  })
})
