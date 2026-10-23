import { describe, it, expect } from 'vitest'
import { dividendEvents, buildIcs, escapeText, foldLine } from '@/calendar'
import { makeStock, isoDaysFromNow } from './factory'

describe('dividendEvents', () => {
  it('يُرجع المواعيد القادمة فقط بالترتيب المنطقي', () => {
    const s = makeStock({ sym: 'DEWA', name: 'ديوا — كهرباء ومياه دبي' }, {
      lastEnt: isoDaysFromNow(-3), // منقضٍ — يُستبعد
      exd: isoDaysFromNow(0),      // اليوم — يُضمَّن
      pay: isoDaysFromNow(12),
    })
    const ev = dividendEvents(s)
    expect(ev.map((e) => e.title)).toEqual([
      'DEWA · تاريخ الاستبعاد (التداول بدون أحقية)',
      'DEWA · تاريخ دفع التوزيع',
    ])
    expect(ev[0]!.description).toContain('ديوا')
    expect(ev[0]!.description).toContain('التوزيع: 1.00 درهم')
  })
  it('قائمة فارغة عند غياب تواريخ قادمة', () => {
    expect(dividendEvents(makeStock({}, { exd: isoDaysFromNow(-30) }))).toEqual([])
  })
  it('تاريخ بداية سابق يُبقي المواعيد المنقضية (تقاويم الاشتراك)', () => {
    const from = new Date()
    from.setDate(from.getDate() - 60)
    expect(dividendEvents(makeStock({}, { exd: isoDaysFromNow(-30) }), from)).toHaveLength(1)
  })
  it('يذكر مصدر التاريخ: آلي يلزم التحقق، أو رابط الإفصاح الرسمي', () => {
    const s = makeStock({}, {
      exd: isoDaysFromNow(5),
      pay: isoDaysFromNow(20),
      auto: { src: 'tradingview', asof: isoDaysFromNow(0), fields: ['pay'] },
      src: { url: 'https://example.ae/agm.pdf', label: 'نتائج الجمعية', asof: isoDaysFromNow(0) },
    })
    const [exd, pay] = dividendEvents(s)
    expect(exd!.description).toContain('الإفصاح الرسمي: https://example.ae/agm.pdf')
    expect(pay!.description).toContain('آلي — يلزم التحقق')
  })
})

describe('escapeText', () => {
  it('يهرّب المحارف الخاصة والأسطر', () => {
    expect(escapeText('أ, ب; ج\\د\nهـ')).toBe('أ\\, ب\\; ج\\\\د\\nهـ')
  })
})

describe('foldLine', () => {
  const bytes = (s: string) => new TextEncoder().encode(s).length
  it('لا يمسّ السطر القصير', () => {
    expect(foldLine('SUMMARY:قصير')).toBe('SUMMARY:قصير')
  })
  it('يطوي عند 75 بايت دون قطع حرف عربي', () => {
    const line = 'DESCRIPTION:' + 'توزيع'.repeat(30)
    const parts = foldLine(line).split('\r\n')
    expect(parts.length).toBeGreaterThan(1)
    parts.forEach((p, i) => {
      expect(bytes(p)).toBeLessThanOrEqual(75)
      if (i > 0) expect(p.startsWith(' ')).toBe(true)
    })
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe(line)
  })
})

describe('buildIcs', () => {
  it('يبني تقويمًا صالحًا بحدث يوم كامل وتنبيه', () => {
    const ics = buildIcs(
      [{ uid: 'X-exd-20261105@uae-stocks', date: new Date(2026, 10, 5), title: 'X · موعد', description: 'وصف' }],
      new Date('2026-10-22T08:00:00Z'),
    )
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('DTSTART;VALUE=DATE:20261105')
    expect(ics).toContain('DTEND;VALUE=DATE:20261106')
    expect(ics).toContain('DTSTAMP:20261022T080000Z')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics.split('BEGIN:VEVENT').length - 1).toBe(1)
  })
  it('تقويم اشتراك: اسم ومدة تحديث، وبلا تنبيهات عند تعطيلها', () => {
    const ev = [{ uid: 'u', date: new Date(2026, 10, 5), title: 't', description: 'd' }]
    const ics = buildIcs(ev, new Date('2026-10-22T08:00:00Z'), { name: 'توزيعات السوق', alarms: false, refreshHours: 12 })
    expect(ics).toContain('X-WR-CALNAME:توزيعات السوق')
    expect(ics).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT12H')
    expect(ics).not.toContain('VALARM')
    expect(ics).toContain('END:VEVENT\r\nEND:VCALENDAR')
  })
  it('يعبر نهاية الشهر بشكل صحيح في DTEND', () => {
    const ics = buildIcs([{ uid: 'u', date: new Date(2026, 11, 31), title: 't', description: 'd' }])
    expect(ics).toContain('DTEND;VALUE=DATE:20270101')
  })
})
