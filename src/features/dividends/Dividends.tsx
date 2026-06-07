import { useMemo, useState } from 'react'
import type { Stock } from '@/data'
import { useStocks } from '@/store'
import { exportCsv } from '@/export'
import { parseISO } from '@/lib'
import { MONTHS_AR, parseYield, getAnnualPs } from '@/format'
import Avatar from '@/components/Avatar'
import { cell } from '@/components/ui/cell'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'

interface Ev { s: Stock; kind: 'ex' | 'pay'; date: Date; raw: string }

export default function Dividends({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const [year] = useState(2026)
  
  // حاسبة الحرية المالية
  const [targetMonthly, setTargetMonthly] = useState<number>(5000)
  const [customAvgYield, setCustomAvgYield] = useState<number>(6.5)

  const byMonth = useMemo(() => {
    const months: Ev[][] = Array.from({ length: 12 }, () => [])
    DATA.forEach((s) => {
      const add = (raw: string | null | undefined, kind: 'ex' | 'pay') => {
        const d = parseISO(raw ?? null)
        if (d && d.getFullYear() === year) months[d.getMonth()]?.push({ s, kind, date: d, raw: raw! })
      }
      add(s.div.exd, 'ex'); add(s.div.nextExd, 'ex'); add(s.div.pay, 'pay'); add(s.div.nextPay, 'pay')
    })
    months.forEach((m) => m.sort((a, b) => a.date.getTime() - b.date.getTime()))
    return months
  }, [DATA, year])

  // ملخّص علوي: إجمالي التواريخ، القادم خلال 7 أيام، وتواريخ الشهر الحالي
  const summary = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const in7 = new Date(now); in7.setDate(now.getDate() + 7)
    let within7 = 0, total = 0, exTotal = 0, payTotal = 0
    byMonth.forEach((m) => m.forEach((ev) => {
      total++
      if (ev.kind === 'ex') exTotal++; else payTotal++
      if (ev.date >= now && ev.date <= in7) within7++
    }))
    const currentMonth = now.getFullYear() === year ? now.getMonth() : -1
    const thisMonth = currentMonth >= 0 ? (byMonth[currentMonth]?.length ?? 0) : 0
    return { within7, total, exTotal, payTotal, currentMonth, thisMonth }
  }, [byMonth, year])

  const calc = useMemo(() => {
    const annualTarget = (targetMonthly || 0) * 12
    const totalCapital = customAvgYield > 0 ? annualTarget / (customAvgYield / 100) : 0
    
    // تصفية وترتيب الأسهم حسب العوائد الأعلى
    const candidates = DATA.filter(s => {
      const y = parseYield(s.div.yld)
      return y !== null && s.price !== null
    }).map(s => ({
      s,
      yld: parseYield(s.div.yld)!
    })).sort((a, b) => b.yld - a.yld)

    // انتقاء 5 شركات متوازنة وقطاعات متنوعة
    const selected: { stock: Stock; yld: number; allocation: number; sharesNeeded: number; projectedAnnual: number }[] = []
    const sectors = new Set<string>()
    for (const c of candidates) {
      if (selected.length >= 5) break
      if (!sectors.has(c.s.sector)) {
        sectors.add(c.s.sector)
        selected.push({ stock: c.s, yld: c.yld, allocation: 0, sharesNeeded: 0, projectedAnnual: 0 })
      }
    }
    if (selected.length < 5) {
      for (const c of candidates) {
        if (selected.length >= 5) break
        if (!selected.some(x => x.stock.sym === c.s.sym)) {
          selected.push({ stock: c.s, yld: c.yld, allocation: 0, sharesNeeded: 0, projectedAnnual: 0 })
        }
      }
    }

    const count = selected.length || 1
    const allocPerStock = totalCapital / count
    selected.forEach(x => {
      const price = x.stock.price ?? 1.0
      x.allocation = allocPerStock
      x.sharesNeeded = price > 0 ? Math.round(allocPerStock / price) : 0
      // الحساب الرياضي الدقيق للتوزيع المتوقع عبر دالة getAnnualPs المشتركة
      const annualPs = getAnnualPs(x.stock)
      x.projectedAnnual = x.sharesNeeded * annualPs
    })

    return {
      totalCapital,
      annualTarget,
      selected
    }
  }, [DATA, targetMonthly, customAvgYield])

  return (
    <div className="view">
      <PageHeader title="تقويم وتخطيط التوزيعات">
        مواعيد الاستحقاق لعام {year} وأدوات التخطيط المالي الذكية للتوزيعات النقدية
      </PageHeader>

      {/* شريط ملخّص التقويم */}
      <div className="stats" style={{ marginBottom: '16px' }}>
        <StatCard color="var(--brand)" value={summary.total} label={`إجمالي تواريخ ${year}`} sub={`استبعاد ${summary.exTotal} · دفع ${summary.payTotal}`} />
        <StatCard color="var(--warn)" value={summary.within7} label="قادمة خلال 7 أيام" sub="استبعاد أو دفع" />
        <StatCard color="var(--good)" value={summary.thisMonth} label="تواريخ الشهر الحالي" sub={summary.currentMonth >= 0 ? MONTHS_AR[summary.currentMonth] : 'خارج السنة'} />
      </div>

      <div className="cal-legend">
        <span><i className="dotx ex" /> تاريخ استبعاد</span>
        <span><i className="dotx pay" /> تاريخ دفع</span>
      </div>

      <div className="calendar">
        {MONTHS_AR.map((m, i) => {
          const evs = byMonth[i] ?? []
          return (
          <div key={m} className={'cal-month' + (evs.length ? '' : ' empty-month') + (i === summary.currentMonth ? ' current' : '')}>
            <div className="cal-h">{m}{i === summary.currentMonth ? ' • الآن' : ''}</div>
            {evs.length === 0 ? (
              <div className="cal-none">—</div>
            ) : (
              evs.map((ev, j) => (
                <button key={j} className={'cal-ev ' + ev.kind} onClick={() => onOpen(ev.s)}>
                  <span className="cal-ev-day">{ev.date.getDate()}</span>
                  <Avatar sym={ev.s.sym} size={22} />
                  <span className="cal-ev-sym">{ev.s.sym}</span>
                  <span className="cal-ev-kind">{ev.kind === 'ex' ? 'استبعاد' : 'دفع'}</span>
                </button>
              ))
            )}
          </div>
          )
        })}
      </div>

      {/* حاسبة الحرية المالية التفاعلية */}
      <h2 className="sec"><span className="dot" style={{ background: 'var(--brand)' }} /> 🧮 حاسبة الحرية المالية من التوزيعات النقدية (العوائد)</h2>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '22px', border: '1px solid var(--line)', background: 'var(--panel)', marginBottom: '30px', borderRadius: '18px' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0, marginTop: '-4px' }}>
          أدخل هدفك الشهري ومتوسط العائد المتوقع، وسيقوم النظام بتحديد رأس المال المطلوب واقتراح محفظة ذكية متنوعة ومباشرة لتبدأ بها فوراً!
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '8px', color: 'var(--muted)' }}>💵 الدخل الشهري المستهدف (د.إ):</label>
            <input 
              type="number" 
              value={targetMonthly || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value)
                setTargetMonthly(isNaN(val) ? 0 : val)
              }}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--chip)', color: 'var(--txt)', border: '1px solid var(--line)', borderRadius: '10px', fontSize: '16px', fontWeight: 700, outline: 'none' }}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '8px', color: 'var(--muted)' }}>📈 متوسط العائد المستهدف للفائدة (%):</label>
            <input 
              type="number" 
              step="0.1"
              value={customAvgYield || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
                setCustomAvgYield(isNaN(val) ? 0 : val)
              }}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--chip)', color: 'var(--txt)', border: '1px solid var(--line)', borderRadius: '10px', fontSize: '16px', fontWeight: 700, outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '10px' }}>
          <div style={{ background: 'rgba(33, 201, 139, 0.05)', border: '1px dashed var(--good)', padding: '16px', borderRadius: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>إجمالي رأس المال المطلوب تقريباً</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--good)', marginTop: '4px' }}>
              {Math.round(calc.totalCapital).toLocaleString('en-US')} د.إ
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>بناءً على عائد مرجح بنسبة {customAvgYield}% سنوياً</div>
          </div>
          <div style={{ background: 'rgba(58, 160, 255, 0.05)', border: '1px dashed var(--brand)', padding: '16px', borderRadius: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>الهدف المالي السنوي الإجمالي</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--brand)', marginTop: '4px' }}>
              {calc.annualTarget.toLocaleString('en-US')} د.إ
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>يعادل تماماً {targetMonthly.toLocaleString('en-US')} د.إ شهرياً</div>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--txt)' }}>💼 سلة الاستثمار المقترحة للتنويع الفعال (توزيع تلقائي للميزانية):</h4>
          <div className="tablewrap">
            <table style={{ minWidth: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>اسم السهم</th>
                  <th>السعر الحالي</th>
                  <th>عائد التوزيعات</th>
                  <th>الحصة المقترحة</th>
                  <th>عدد الأسهم للشراء</th>
                  <th>التدفق السنوي المتوقع</th>
                </tr>
              </thead>
              <tbody>
                {calc.selected.map((x) => (
                  <tr key={x.stock.sym} onClick={() => onOpen(x.stock)} className="rowlink" style={{ cursor: 'pointer' }}>
                    <td>
                      <span className="cellname">
                        <Avatar sym={x.stock.sym} size={24} />
                        <span>
                          <span style={{ fontWeight: 700, fontSize: '12px' }}>{x.stock.name.split('—')[0]}</span>
                          <span style={{ fontSize: '9px', color: 'var(--muted)', marginInlineStart: '4px' }}>({x.stock.sym})</span>
                        </span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{x.stock.price?.toFixed(2)} د.إ</td>
                    <td style={{ color: 'var(--good)', fontWeight: 700 }}>{x.stock.div.yld}</td>
                    <td>{Math.round(x.allocation).toLocaleString('en-US')} د.إ</td>
                    <td style={{ fontWeight: 700, color: 'var(--txt)' }}>{x.sharesNeeded.toLocaleString('en-US')} سهم</td>
                    <td style={{ fontWeight: 700, color: 'var(--good)' }}>{Math.round(x.projectedAnnual).toLocaleString('en-US')} د.إ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <h2 className="sec" style={{ margin: 0 }}><span className="dot" /> جدول التوزيعات الكامل</h2>
        <button
          className="chip"
          onClick={() => exportCsv(
            `توزيعات-الأسهم-${new Date().toISOString().slice(0, 10)}`,
            ['السهم', 'الرمز', 'السوق', 'التوزيع/سهم', 'العائد', 'آخر يوم شراء', 'الاستبعاد', 'إغلاق السجل', 'الدفع', 'الجمعية', 'التكرار'],
            DATA.map((s) => [s.name, s.sym, s.ex, s.div.ps, s.div.yld, s.div.lastEnt, s.div.exd, s.div.rec, s.div.pay, s.div.agm, s.div.freq]),
          )}
          title="تصدير جدول التوزيعات إلى Excel/CSV"
        >
          ⬇️ تصدير CSV
        </button>
      </div>
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
