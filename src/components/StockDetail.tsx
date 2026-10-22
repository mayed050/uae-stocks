import { X, RefreshCw, PenLine, BriefcaseBusiness, ChartCandlestick, AlarmClock, Info } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Stock } from '../data'
import { CAT_LABEL } from '../data'
import { upcoming, isAlert } from '../lib'
import { parseGrowth, symColor } from '../format'
import Avatar from './Avatar'
import Snowflake from './Snowflake'
import { usePortfolio, useHistory } from '../store'
import { periodSeries } from '@/market'
import type { Timeframe } from '@/market'
import PriceChart from './PriceChart'
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

const TF_LABEL: Record<'1M' | '3M' | '6M' | '1Y', string> = { '1M': 'شهر', '3M': '3 أشهر', '6M': '6 أشهر', '1Y': 'سنة' }

export default function StockDetail({ item, onClose }: { item: Stock; onClose: () => void }) {
  const { isInPortfolio, togglePortfolioStock } = usePortfolio()
  const added = isInPortfolio(item.sym)
  const histMap = useHistory()
  const [tfSel, setTfSel] = useState<Extract<Timeframe, '1M' | '3M' | '6M' | '1Y'>>('1Y')
  const [showTv, setShowTv] = useState(false)
  const series = useMemo(
    () => periodSeries(histMap[item.sym] ?? [], tfSel, { price: item.price, asof: item.asof }),
    [histMap, item, tfSel],
  )
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
        <button ref={closeRef} className="modal-x" onClick={onClose} aria-label="إغلاق"><X size={18} aria-hidden /></button>

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
                {item.priceAuto ? <><RefreshCw size={11} className="ico" aria-hidden /> آلي</> : <><PenLine size={11} className="ico" aria-hidden /> يدوي</>}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className={`portfolio-toggle-btn ${added ? 'added' : ''}`}
            onClick={() => togglePortfolioStock(item.sym)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><BriefcaseBusiness size={16} className="ico" aria-hidden />{added ? 'مضاف للمحفظة (اضغط للحذف)' : 'أضف إلى المحفظة'}</span>
          </button>
        </div>

        {u && isAlert(u) && (
          <div className="modal-alert">
            <AlarmClock size={14} className="ico" aria-hidden /> {u.label}{' '}
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
            {item.div.note && <div className="modal-tag"><Info size={13} className="ico" aria-hidden /> {item.div.note}</div>}
          </section>
          <section className="modal-card wide chart">
            <div className="modal-chart-head">
              <h3 className="modal-chart-h"><ChartCandlestick size={16} className="ico" aria-hidden /> سعر الإغلاق</h3>
              <div className="o-tf-group">
                {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
                  <button key={tf} className={'chart-timeframe-btn' + (tf === tfSel ? ' active' : '')} aria-pressed={tf === tfSel} onClick={() => setTfSel(tf)}>
                    {TF_LABEL[tf]}
                  </button>
                ))}
              </div>
            </div>
            {series ? (
              <>
                <PriceChart points={series.points} up={series.up} height={240} label={`سعر إغلاق ${item.sym} — ${TF_LABEL[tfSel]}`} />
                <div className={'modal-chart-sum ' + (series.up ? 'up' : 'down')}>
                  {series.up ? '▲' : '▼'} {series.changePct.toFixed(2)}% خلال {TF_LABEL[tfSel]} · الأعلى {series.high.toFixed(2)} · الأدنى {series.low.toFixed(2)}
                </div>
              </>
            ) : (
              <div className="chart-empty" style={{ height: 160 }}>
                <b>لا يتوفر سجل أسعار تاريخي لهذا السهم بعد</b>
                <span>يمكن فتح مخطط TradingView المتقدم أدناه.</span>
              </div>
            )}
            {showTv ? (
              <iframe
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${(item.tradingview ?? `${item.ex}-${item.sym}`).replace('-', ':')}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&theme=${theme}&style=1&timezone=Exchange&locale=ar`}
                className="modal-chart-frame"
                title={`مخطط TradingView المتقدم — ${item.name}`}
              />
            ) : (
              <button className="chip tv-load" onClick={() => setShowTv(true)}>
                فتح المخطط الفني المتقدم (TradingView) — يُحمَّل من موقع خارجي
              </button>
            )}
          </section>
        </div>

        <div className="modal-foot">
          لأغراض المعلومات فقط — لا توصية بالشراء أو البيع. تحقّق من المصدر الرسمي (DFM / ADX) قبل أي قرار.
        </div>
      </div>
    </div>
  )
}
