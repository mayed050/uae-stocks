import { useMemo, useState } from 'react'
import { ArrowUpLeft, BriefcaseBusiness, CalendarClock } from 'lucide-react'
import type { Stock } from '@/data'
import type { View } from '@/components/nav'
import { usePortfolio } from '@/store'
import { dividendEvents } from '@/calendar'
import type { CalEvent, EventStep } from '@/calendar'
import { MONTHS_AR } from '@/format'
import Avatar from '@/components/Avatar'
import CalendarSubscribe from '@/components/CalendarSubscribe'

const WINDOW_DAYS = 30
const SHOWN = 8

const STEP_LABEL: Record<EventStep, string> = {
  lastEnt: 'آخر يوم شراء',
  exd: 'الاستبعاد',
  nextExd: 'استبعاد الشريحة القادمة',
  pay: 'الدفع',
  nextPay: 'دفع الشريحة القادمة',
}

function whenLabel(days: number): string {
  if (days === 0) return 'اليوم'
  if (days === 1) return 'غدًا'
  if (days === 2) return 'بعد يومين'
  return days <= 10 ? `بعد ${days} أيام` : `بعد ${days} يومًا`
}

type Row = CalEvent & { stock: Stock; days: number }

/**
 * أجندة مواعيد التوزيع خلال 30 يومًا من البيانات الفعلية — المهمة الأساسية للمنصة في صدر الصفحة:
 * آخر يوم شراء والاستبعاد والدفع، بالمبلغ ومصدر التاريخ (آلي يلزم التحقق أو مُراجَع).
 */
export default function UpcomingDividends({
  stocks,
  onOpen,
  onNavigate,
}: {
  stocks: Stock[]
  onOpen: (s: Stock) => void
  onNavigate?: (v: View) => void
}) {
  const { isInPortfolio } = usePortfolio()
  const [scope, setScope] = useState<'all' | 'portfolio'>('all')

  const rows = useMemo(() => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const out: Row[] = []
    for (const s of stocks) {
      for (const e of dividendEvents(s, start)) {
        const days = Math.round((e.date.getTime() - start.getTime()) / 86400000)
        if (days <= WINDOW_DAYS) out.push({ ...e, stock: s, days })
      }
    }
    return out.sort((a, b) => a.days - b.days || a.stock.sym.localeCompare(b.stock.sym))
  }, [stocks])

  const visible = scope === 'portfolio' ? rows.filter((r) => isInPortfolio(r.stock.sym)) : rows

  return (
    <section className="panel ov-agenda" aria-labelledby="ov-agenda-h">
      <div className="ov-agenda-head">
        <h2 id="ov-agenda-h" className="panel-h">
          <CalendarClock size={17} className="ico" aria-hidden /> مواعيد التوزيع القادمة
        </h2>
        <span className="ov-agenda-count">{visible.length} موعدًا خلال {WINDOW_DAYS} يومًا</span>
        <div className="o-filter-tabs" role="group" aria-label="نطاق المواعيد">
          <button className={'o-filter-tab' + (scope === 'all' ? ' active' : '')} aria-pressed={scope === 'all'} onClick={() => setScope('all')}>
            الكل
          </button>
          <button className={'o-filter-tab' + (scope === 'portfolio' ? ' active' : '')} aria-pressed={scope === 'portfolio'} onClick={() => setScope('portfolio')}>
            <BriefcaseBusiness size={13} className="ico" aria-hidden /> محفظتي
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="ov-agenda-empty">
          {scope === 'portfolio' ? 'لا مواعيد توزيع لأسهم محفظتك خلال الثلاثين يومًا القادمة.' : 'لا مواعيد توزيع معلنة خلال الثلاثين يومًا القادمة.'}
        </p>
      ) : (
        <ul className="ov-agenda-list">
          {visible.slice(0, SHOWN).map((r) => (
            <li key={r.uid}>
              <button className={'ov-ag-item step-' + r.step} onClick={() => onOpen(r.stock)}>
                <span className="ov-ag-date">
                  <b>{r.date.getDate()}</b>
                  <small>{MONTHS_AR[r.date.getMonth()]}</small>
                </span>
                <Avatar sym={r.stock.sym} size={30} />
                <span className="ov-ag-stock">
                  <span className="ov-ag-name">{r.stock.name.split('—')[0]?.trim()}</span>
                  <span className="ov-ag-sym">{r.stock.sym}</span>
                </span>
                <span className="ov-ag-detail">
                  <span className="ov-ag-step">{STEP_LABEL[r.step ?? 'exd']}</span>
                  <span className="ov-ag-ps">
                    {r.ps ?? '—'}
                    {r.auto && <span className="auto-mark" title="تاريخ آلي من TradingView — تحقّق من إفصاح الشركة">يلزم التحقق</span>}
                  </span>
                </span>
                <span className={'ov-ag-when' + (r.days <= 2 ? ' soon' : '')}>{whenLabel(r.days)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="ov-agenda-foot">
        {onNavigate && (
          <button className="chip" onClick={() => onNavigate('dividends')}>
            كل مواعيد التوزيع{visible.length > SHOWN ? ` (${visible.length})` : ''} <ArrowUpLeft size={14} className="ico" aria-hidden />
          </button>
        )}
        <CalendarSubscribe />
      </div>
    </section>
  )
}
