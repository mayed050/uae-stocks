import { useMemo, useState } from 'react'
import type { Stock } from '../data'
import { useStocks } from '../store'
import { parseISO } from '../lib'
import { MONTHS_AR } from '../format'
import Avatar from '../components/Avatar'

const NA = 'يلزم التحقق'
function cell(x: string | null | undefined) {
  return x === null || x === undefined || x === '' ? <span className="na">{NA}</span> : x
}

interface Ev { s: Stock; kind: 'ex' | 'pay'; date: Date; raw: string }

export default function Dividends({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const [year] = useState(2026)

  const byMonth = useMemo(() => {
    const months: Ev[][] = Array.from({ length: 12 }, () => [])
    DATA.forEach((s) => {
      const add = (raw: string | null | undefined, kind: 'ex' | 'pay') => {
        const d = parseISO(raw ?? null)
        if (d && d.getFullYear() === year) months[d.getMonth()].push({ s, kind, date: d, raw: raw! })
      }
      add(s.div.exd, 'ex'); add(s.div.nextExd, 'ex'); add(s.div.pay, 'pay'); add(s.div.nextPay, 'pay')
    })
    months.forEach((m) => m.sort((a, b) => a.date.getTime() - b.date.getTime()))
    return months
  }, [DATA, year])

  return (
    <div className="view">
      <div className="page-head">
        <h1>تقويم التوزيعات</h1>
        <p>تواريخ الاستبعاد والدفع عبر شهور {year} — اضغط أي بطاقة للتفاصيل</p>
      </div>

      <div className="cal-legend">
        <span><i className="dotx ex" /> تاريخ استبعاد</span>
        <span><i className="dotx pay" /> تاريخ دفع</span>
      </div>

      <div className="calendar">
        {MONTHS_AR.map((m, i) => (
          <div key={m} className={'cal-month' + (byMonth[i].length ? '' : ' empty-month')}>
            <div className="cal-h">{m}</div>
            {byMonth[i].length === 0 ? (
              <div className="cal-none">—</div>
            ) : (
              byMonth[i].map((ev, j) => (
                <button key={j} className={'cal-ev ' + ev.kind} onClick={() => onOpen(ev.s)}>
                  <span className="cal-ev-day">{ev.date.getDate()}</span>
                  <Avatar sym={ev.s.sym} size={22} />
                  <span className="cal-ev-sym">{ev.s.sym}</span>
                  <span className="cal-ev-kind">{ev.kind === 'ex' ? 'استبعاد' : 'دفع'}</span>
                </button>
              ))
            )}
          </div>
        ))}
      </div>

      <h2 className="sec"><span className="dot" /> جدول التوزيعات الكامل</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>السهم</th><th>التوزيع/سهم</th><th>العائد</th><th>آخر يوم شراء</th>
              <th>الاستبعاد</th><th>إغلاق السجل</th><th>الدفع</th><th>الجمعية</th><th>التكرار</th>
            </tr>
          </thead>
          <tbody>
            {DATA.map((s) => (
              <tr key={s.sym} className="rowlink" onClick={() => onOpen(s)}>
                <td>
                  <span className="cellname">
                    <Avatar sym={s.sym} size={28} />
                    <span><span className="cn-name">{s.name}</span><span className="cn-sym">{s.sym}</span></span>
                  </span>
                </td>
                <td>{cell(s.div.ps)}</td>
                <td>{cell(s.div.yld)}</td>
                <td>{cell(s.div.lastEnt)}</td>
                <td>{cell(s.div.exd)}</td>
                <td>{cell(s.div.rec)}</td>
                <td>{cell(s.div.pay)}</td>
                <td>{cell(s.div.agm)}</td>
                <td>{cell(s.div.freq)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
