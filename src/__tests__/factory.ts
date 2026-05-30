import type { Stock } from '@/data'

/** مصنع كائن سهم بقيم افتراضية معقولة للاختبارات، مع إمكانية تجاوز أي حقل. */
export function makeStock(over: Partial<Stock> = {}, divOver: Partial<Stock['div']> = {}): Stock {
  return {
    sym: 'TEST',
    name: 'شركة الاختبار',
    ex: 'DFM',
    sector: 'بنوك',
    cat: 'income',
    price: 10,
    asof: 'مايو 2026',
    mcap: '10 مليار',
    pe: 10,
    eps: '1',
    roe: '10%',
    net: '1 مليار',
    rev: '2 مليار',
    ...over,
    div: {
      ps: '1.00 درهم',
      yld: '~4%',
      lastEnt: null,
      exd: null,
      rec: null,
      pay: null,
      agm: null,
      freq: 'سنوي',
      ...divOver,
    },
  }
}

/** تاريخ ISO (YYYY-MM-DD) يبعد عدد أيام عن اليوم — لاختبارات التواريخ النسبية. */
export function isoDaysFromNow(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
