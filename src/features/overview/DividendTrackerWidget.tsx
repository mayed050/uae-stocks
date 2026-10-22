import { CalendarDays, CalendarPlus, BriefcaseBusiness, ArrowUpLeft } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Stock } from '@/data'
import type { Upcoming } from '@/lib'
import type { View } from '@/components/nav'
import { usePortfolio } from '@/store'
import Avatar from '@/components/Avatar'
import { dividendEvents, buildIcs } from '@/calendar'
import { exportIcs } from '@/export'

/** متتبع توزيعات الأرباح الجانبي: فلتر (الكل / محفظتي)، خط زمني للمراحل، وتصدير المواعيد إلى التقويم (.ics). */
export default function DividendTrackerWidget({
  alertRows,
  onOpen,
  onNavigate,
}: {
  alertRows: { s: Stock; u: Upcoming }[]
  onOpen: (s: Stock) => void
  onNavigate?: (v: View) => void
}) {
  const { isInPortfolio } = usePortfolio()

  // التحكم بفلتر متتبع التواريخ القادمة (الكل / محفظتي فقط)
  const [trackerFilter, setTrackerFilter] = useState<'all' | 'portfolio'>('all')
  // إشعار التأكيد العائم لزر التنبيه
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // تصفية تواريخ الاستحقاق حسب الفلتر المختار (الكل / محفظتي فقط)
  const filteredAlertRows = useMemo(() => {
    if (trackerFilter === 'portfolio') {
      return alertRows.filter(row => isInPortfolio(row.s.sym))
    }
    return alertRows
  }, [alertRows, trackerFilter, isInPortfolio])

  return (
    <div className="o-widget">
      <div className="o-widget-head">
        <h4 className="o-widget-h"><CalendarDays size={16} className="ico" aria-hidden /> متتبع توزيعات الأرباح</h4>

        {/* شريط الفلتر (الكل مقابل محفظتي) */}
        <div className="o-filter-tabs">
          <button
            onClick={(e) => { e.stopPropagation(); setTrackerFilter('all') }}
            className={'o-filter-tab' + (trackerFilter === 'all' ? ' active' : '')}
          >
            الكل
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setTrackerFilter('portfolio') }}
            className={'o-filter-tab' + (trackerFilter === 'portfolio' ? ' active' : '')}
          >
            <BriefcaseBusiness size={13} className="ico" aria-hidden /> محفظتي
          </button>
        </div>
      </div>

      <div className="o-tracker-list">
        {filteredAlertRows.length === 0 ? (
          <div className="o-tracker-empty">
            {trackerFilter === 'portfolio' ? 'لا توجد توزيعات قريبة للشركات المدرجة في محفظتك.' : 'لا توجد تواريخ استحقاق قريبة حالياً.'}
          </div>
        ) : (
          filteredAlertRows.slice(0, 4).map(({ s, u }) => {
            const daysLeft = u.n
            let countdownBadge

            if (daysLeft === null) {
              countdownBadge = <span className="o-cd exp">متوقع</span>
            } else if (daysLeft === 0) {
              countdownBadge = <span className="o-cd today">اليوم</span>
            } else if (daysLeft < 7) {
              countdownBadge = <span className="o-cd soon">باقي {daysLeft} أيام</span>
            } else {
              countdownBadge = <span className="o-cd future">بعد {daysLeft} يوم</span>
            }

            // الحدث المعروض هو الذي يُعدّ له العدّ التنازلي: الشريحة القادمة إن كانت هي الأقرب
            const isNext = u.label === 'الشريحة القادمة'
            const ex = isNext ? s.div.nextExd : s.div.exd
            const pay = isNext ? s.div.nextPay : s.div.pay
            const divValueStr = u.ps ?? s.div.ps ?? 'غير معلن'
            const autoEvent = s.div.auto?.fields.includes(isNext ? 'nextExd' : 'exd') ?? false
            const calEvents = dividendEvents(s)

            return (
              <div
                key={s.sym}
                onClick={() => onOpen(s)}
                className="rowlink o-div-card"
              >
                {/* ترويسة بطاقة التوزيع */}
                <div className="o-div-cardhead">
                  <div className="o-div-id">
                    <Avatar sym={s.sym} size={24} />
                    <div>
                      <span className="o-div-sym">{s.sym}</span>
                      <span className="o-div-ex">{s.ex}</span>
                    </div>
                  </div>
                  {countdownBadge}
                  {autoEvent && (
                    <span className="auto-mark" title={`تاريخ أُضيف آليًا من TradingView (${s.div.auto?.asof}) — تحقّق من الإفصاح الرسمي`}>يلزم التحقق</span>
                  )}
                </div>

                {/* قيمة التوزيع والعائد */}
                <div className="o-div-vals">
                  <span className="mut">توزيع السهم: <span className="txt">{divValueStr}</span></span>
                  <span className="good">العائد: {s.div.yld}</span>
                </div>

                {/* متتبع المراحل الرأسي المصغر */}
                <div className="o-div-timeline">
                  {/* خطوة 1: مصدر الإعلان (لا يُدّعى اعتماد رسمي لبيانات آلية لم يُتحقق منها) */}
                  <div className="timeline-step">
                    <div className={'timeline-dot' + (autoEvent ? '' : ' completed')} />
                    <div className="timeline-content">
                      <span>{isNext ? 'شريحة توزيع قادمة' : 'إعلان التوزيع'}</span>
                      <div className="o-tl-sub">{autoEvent ? 'من TradingView — تحقّق من إفصاح الشركة' : 'مُدخل يدويًا في بيانات المنصة'}</div>
                    </div>
                  </div>

                  {/* خطوة 2: تاريخ الاستحقاق */}
                  <div className="timeline-step">
                    <div className={`timeline-dot ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`} />
                    <div className={`timeline-content ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`}>
                      <span className="o-tl-row">
                        <span>تاريخ الاستحقاق (Ex-Date)</span>
                        <b className="o-tl-ex">{ex ?? 'قريباً'}</b>
                      </span>
                    </div>
                  </div>

                  {/* خطوة 3: تاريخ الدفع والتوزيع */}
                  <div className="timeline-step">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <span className="o-tl-row">
                        <span>تاريخ توزيع الأرباح (Pay)</span>
                        <span>{pay ?? 'منتظر'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* تنزيل ملف تقويم حقيقي بمواعيد التوزيع القادمة (مع تنبيه قبلها بيوم) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!calEvents.length) return
                    exportIcs(`${s.sym}-dividend`, buildIcs(calEvents))
                    triggerToast(`نُزّل ملف تقويم ${s.sym} (${calEvents.length} موعد) — افتحه لإضافته إلى تقويمك`)
                  }}
                  disabled={calEvents.length === 0}
                  title={calEvents.length === 0 ? 'لم تُعلن تواريخ قادمة بعد' : 'تنزيل المواعيد كملف تقويم (.ics)'}
                  className="o-remind-btn"
                >
                  <CalendarPlus size={14} aria-hidden /> أضف المواعيد إلى التقويم
                </button>
              </div>
            )
          })
        )}
      </div>
      {onNavigate && (
        <button
          onClick={() => onNavigate('dividends')}
          className="o-viewall-btn"
        >
          عرض كل تواريخ التوزيعات <ArrowUpLeft size={14} className="ico" aria-hidden />
        </button>
      )}

      {/* الإشعار العائم (position: fixed فلا يتأثر بموضعه داخل الودجة) */}
      {toastMessage && (
        <div className="o-toast">
          <CalendarPlus size={15} aria-hidden /> {toastMessage}
        </div>
      )}
    </div>
  )
}
