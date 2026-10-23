import { describe, it, expect } from 'vitest'
import { buildFeeds, feedPath } from '@/feeds'
import { makeStock, isoDaysFromNow } from './factory'

describe('تقاويم الاشتراك', () => {
  const now = new Date()
  const stocks = [
    makeStock({ sym: 'AAA', name: 'شركة أ — وصف' }, { exd: isoDaysFromNow(10), pay: isoDaysFromNow(25) }),
    makeStock({ sym: 'BBB', name: 'شركة ب' }, { exd: isoDaysFromNow(-200) }), // ضمن آخر 12 شهرًا
    makeStock({ sym: 'CCC', name: 'شركة ج' }, { exd: isoDaysFromNow(-400) }), // أقدم من 12 شهرًا
  ]
  const feeds = buildFeeds(stocks, now)

  it('ملف لكل سهم وملف للسوق كاملًا', () => {
    expect([...feeds.keys()].sort()).toEqual(['calendar/AAA.ics', 'calendar/BBB.ics', 'calendar/CCC.ics', 'calendar/all.ics'])
    expect(feedPath('AAA')).toBe('calendar/AAA.ics')
  })

  it('تقويم السهم باسمه وتنبيهاته، ويُنشأ حتى بلا مواعيد', () => {
    expect(feeds.get('calendar/AAA.ics')).toContain('X-WR-CALNAME:توزيعات AAA — شركة أ')
    expect(feeds.get('calendar/AAA.ics')).toContain('BEGIN:VALARM')
    const empty = feeds.get('calendar/CCC.ics')!
    expect(empty).toContain('BEGIN:VCALENDAR')
    expect(empty).not.toContain('BEGIN:VEVENT')
  })

  it('تقويم السوق بلا تنبيهات، يضم مواعيد آخر 12 شهرًا والقادمة مرتبة زمنيًا', () => {
    const all = feeds.get('calendar/all.ics')!
    expect(all).not.toContain('VALARM')
    const order = [...all.matchAll(/SUMMARY:(\w+) ·/g)].map((m) => m[1])
    expect(order).toEqual(['BBB', 'AAA', 'AAA'])
  })
})
