import { useState, useMemo } from 'react'
import type { Stock } from '@/data'
import type { Upcoming } from '@/lib'
import type { View } from '@/components/Sidebar'
import { usePortfolio } from '@/store'
import Avatar from '@/components/Avatar'

/** متتبع توزيعات الأرباح الجانبي: فلتر (الكل / محفظتي)، خط زمني للمراحل، وزر تذكير بإشعار toast. */
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
        <h4 className="o-widget-h">📅 متتبع توزيعات الأرباح</h4>

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
            محفظتي 💼
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
              countdownBadge = <span className="o-cd today">اليوم! 🎉</span>
            } else if (daysLeft < 7) {
              countdownBadge = <span className="o-cd soon">باقي {daysLeft} أيام ⏳</span>
            } else {
              countdownBadge = <span className="o-cd future">بعد {daysLeft} يوم</span>
            }

            const divValueStr = s.div.ps ?? 'غير معلن'

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
                </div>

                {/* قيمة التوزيع والعائد */}
                <div className="o-div-vals">
                  <span className="mut">توزيع السهم: <span className="txt">{divValueStr}</span></span>
                  <span className="good">العائد: {s.div.yld}</span>
                </div>

                {/* متتبع المراحل الرأسي المصغر */}
                <div className="o-div-timeline">
                  {/* خطوة 1: توصية الأرباح */}
                  <div className="timeline-step">
                    <div className="timeline-dot completed" />
                    <div className="timeline-content">
                      <span>توصية مجلس الإدارة</span>
                      <div className="o-tl-sub">موافقة رسمية معلنة</div>
                    </div>
                  </div>

                  {/* خطوة 2: تاريخ الاستحقاق */}
                  <div className="timeline-step">
                    <div className={`timeline-dot ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`} />
                    <div className={`timeline-content ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`}>
                      <span className="o-tl-row">
                        <span>تاريخ الاستحقاق (Ex-Date)</span>
                        <b className="o-tl-ex">{s.div.exd ?? 'قريباً'}</b>
                      </span>
                    </div>
                  </div>

                  {/* خطوة 3: تاريخ الدفع والتوزيع */}
                  <div className="timeline-step">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <span className="o-tl-row">
                        <span>تاريخ توزيع الأرباح (Pay)</span>
                        <span>{s.div.pay ?? 'منتظر'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* زر تذكيري بالتقويم */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    triggerToast(`تم تفعيل التذكير لشركة ${s.sym} وإضافته لتقويمك بنجاح! 🔔`)
                  }}
                  className="o-remind-btn"
                >
                  <span>🔔</span> ذكّرني بالتوزيع
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
          عرض كل تواريخ التوزيعات ↗
        </button>
      )}

      {/* الإشعار العائم (position: fixed فلا يتأثر بموضعه داخل الودجة) */}
      {toastMessage && (
        <div className="o-toast">
          <span>🔔</span> {toastMessage}
        </div>
      )}
    </div>
  )
}
