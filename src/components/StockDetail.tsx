import { useEffect, useRef, useState } from 'react'
import type { Stock } from '../data'
import { CAT_LABEL } from '../data'
import { upcoming, isAlert } from '../lib'
import { parseGrowth, symColor } from '../format'
import Avatar from './Avatar'
import Snowflake from './Snowflake'
import { usePortfolio } from '../store'
import { NA } from '@/constants/ui'
import { cell as v } from '@/components/ui/cell'

function Row({ k, val }: { k: string; val: React.ReactNode }) {
  return (
    <div className="drow">
      <span className="k">{k}</span>
      <span className="val">{val}</span>
    </div>
  )
}

function readTheme(): 'dark' | 'light' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export default function StockDetail({ item, onClose }: { item: Stock; onClose: () => void }) {
  const { isInPortfolio, togglePortfolioStock } = usePortfolio()
  const added = isInPortfolio(item.sym)
  const closeRef = useRef<HTMLButtonElement>(null)

  // تتبّع السمة لحظياً ليُحدَّث مخطّط TradingView عند التبديل بين الفاتح والداكن
  const [theme, setTheme] = useState<'dark' | 'light'>(() => readTheme())
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setTheme(readTheme()))
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  // إغلاق بمفتاح Escape + قفل تمرير الخلفية + تركيز مبدئي على زر الإغلاق
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const u = upcoming(item)
  const g = parseGrowth(item.net)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`تفاصيل سهم ${item.name}`}
      >
        <button ref={closeRef} className="modal-x" onClick={onClose} aria-label="إغلاق">✕</button>

        <div className="modal-head">
          <Avatar sym={item.sym} size={56} />
          <div>
            <h2>{item.name}</h2>
            <div className="modal-sub">
              <span className="sym">{item.sym}</span>
              <span className="exch">{item.ex}</span>
              <span>{item.sector}</span>
              <span className={'ribbon cat-' + item.cat}>{CAT_LABEL[item.cat]}</span>
            </div>
          </div>
          <div className="modal-price">
            <div className="v">{item.price !== null ? item.price.toFixed(2) : NA}</div>
            {typeof item.change === 'number' && (
              <div className={'modal-change ' + (item.change > 0 ? 'up' : item.change < 0 ? 'down' : 'flat')}>
                {item.change > 0 ? '▲ +' : item.change < 0 ? '▼ ' : ''}
                {Math.abs(item.change).toFixed(2)}% اليوم
              </div>
            )}
            <div className="c">
              درهم · {item.asof ?? NA}
              <span className={'src-badge ' + (item.priceAuto ? 'auto' : 'manual')}>
                {item.priceAuto ? '⟳ آلي' : '✎ يدوي'}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className={`portfolio-toggle-btn ${added ? 'added' : ''}`}
            onClick={() => togglePortfolioStock(item.sym)}
          >
            <span>{added ? '💼 مضاف للمحفظة (حذف 🗑️)' : '💼 أضف إلى المحفظة +'}</span>
          </button>
        </div>

        {u && isAlert(u) && (
          <div className="modal-alert">
            ⏰ {u.label}{' '}
            {u.n === null ? '(التاريخ لم يُعلن بعد)' : `— خلال ${u.n} يوم`}
            {u.ps ? ` · ${u.ps}` : ''}
          </div>
        )}

        <div className="modal-grid">
          <section className="modal-card">
            <h3>المؤشرات المالية</h3>
            <Row k="القيمة السوقية" val={v(item.mcap)} />
            <Row k="مكرر الربحية (P/E)" val={v(item.pe)} />
            <Row k="ربحية السهم (EPS)" val={v(item.eps)} />
            <Row k="العائد على حقوق الملكية" val={v(item.roe)} />
            <Row k="صافي الربح" val={v(item.net)} />
            <Row k="الإيرادات" val={v(item.rev)} />
            <Row k="نمو صافي الربح" val={g === null ? v(null) : `${g > 0 ? '+' : ''}${g}%`} />
          </section>

          <section className="modal-card">
            <h3>الملف الوصفي</h3>
            <Snowflake items={[{ stock: item, color: symColor(item.sym) }]} height={230} />
            <p className="modal-note">محاور وصفية محايدة مشتقة من البيانات المتاحة — ليست تقييمًا استثماريًا.</p>
          </section>

          <section className="modal-card wide">
            <h3>التوزيعات</h3>
            <div className="modal-divgrid">
              <Row k="لكل سهم" val={v(item.div.ps)} />
              <Row k="العائد النقدي" val={v(item.div.yld)} />
              <Row k="التكرار" val={v(item.div.freq)} />
              <Row k="آخر يوم شراء" val={v(item.div.lastEnt)} />
              <Row k="تاريخ الاستبعاد" val={v(item.div.exd)} />
              <Row k="إغلاق السجل" val={v(item.div.rec)} />
              <Row k="تاريخ الدفع" val={v(item.div.pay)} />
              <Row k="الجمعية العمومية" val={v(item.div.agm)} />
              {item.div.nextExd && <Row k="استبعاد الشريحة القادمة" val={v(item.div.nextExd)} />}
              {item.div.nextPay && <Row k="دفع الشريحة القادمة" val={v(item.div.nextPay)} />}
            </div>
            {item.div.note && <div className="modal-tag">ℹ️ {item.div.note}</div>}
          </section>
          <section className="modal-card wide chart">
            <h3 className="modal-chart-h">📈 المخطط البياني الفني التفاعلي (TradingView)</h3>
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${(item.tradingview ?? `${item.ex}-${item.sym}`).replace('-', ':')}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&theme=${theme}&style=1&timezone=Exchange&locale=ar`}
              className="modal-chart-frame"
              title={`مخطط أسعار ${item.name}`}
            />
          </section>
        </div>

        <div className="modal-foot">
          لأغراض المعلومات فقط — لا توصية بالشراء أو البيع. تحقّق من المصدر الرسمي (DFM / ADX) قبل أي قرار.
        </div>
      </div>
    </div>
  )
}
