import { useState } from 'react'
import { CAT_LABEL } from '../data'
import type { Stock } from '../data'
import { useStocks } from '../store'
import { symColor, parseYield, parseAmount } from '../format'
import Snowflake from '../components/Snowflake'
import Avatar from '../components/Avatar'
import { cell as v } from '@/components/ui/cell'

const MAX = 6 // تم الترقية للمقارنة بين حتى 6 أسهم

interface Metric {
  k: string
  get: (s: Stock) => React.ReactNode
  val?: (s: Stock) => number | null
  better?: 'higher' | 'lower'
}

const METRICS: Metric[] = [
  { k: 'السوق', get: (s) => s.ex },
  { k: 'القطاع', get: (s) => s.sector },
  { k: 'التصنيف الاستثماري', get: (s) => CAT_LABEL[s.cat] },
  { k: 'السعر الحالي', get: (s) => v(s.price !== null ? `${s.price.toFixed(2)} درهم` : null), val: (s) => s.price },
  { k: 'القيمة السوقية', get: (s) => v(s.mcap), val: (s) => parseAmount(s.mcap), better: 'higher' },
  { k: 'مكرر الربحية (P/E)', get: (s) => v(s.pe), val: (s) => s.pe, better: 'lower' },
  { k: 'ربحية السهم (EPS)', get: (s) => v(s.eps), val: (s) => parseFloat(s.eps ?? '') || null, better: 'higher' },
  { k: 'العائد على حقوق الملكية (ROE)', get: (s) => v(s.roe), val: (s) => parseFloat(s.roe ?? '') || null, better: 'higher' },
  { k: 'صافي الربح الإجمالي', get: (s) => v(s.net) },
  { k: 'الإيرادات التشغيلية', get: (s) => v(s.rev), val: (s) => parseAmount(s.rev), better: 'higher' },
  { k: 'التوزيع الأخير/سهم', get: (s) => v(s.div.ps) },
  { k: 'العائد النقدي المالي (%)', get: (s) => v(s.div.yld), val: (s) => parseYield(s.div.yld), better: 'higher' },
  { k: 'تكرار التوزيع', get: (s) => v(s.div.freq) },
  { k: 'آخر يوم شراء (تاريخ الاستحقاق)', get: (s) => v(s.div.lastEnt) },
  { k: 'تاريخ الاستبعاد من التوزيع', get: (s) => v(s.div.exd) },
  { k: 'تاريخ إغلاق السجل', get: (s) => v(s.div.rec) },
  { k: 'تاريخ دفع الأرباح', get: (s) => v(s.div.pay) },
  { k: 'الجمعية العمومية', get: (s) => v(s.div.agm) },
  { k: 'شريحة التوزيع القادمة', get: (s) => v(s.div.nextExd) },
  { k: 'تاريخ دفع الشريحة القادمة', get: (s) => v(s.div.nextPay) },
  { k: 'ملاحظات وتنبيهات التوزيع', get: (s) => <span style={{ whiteSpace: 'normal', minWidth: '160px', display: 'inline-block', fontSize: '12px', color: 'var(--muted)' }}>{v(s.div.note)}</span> },
]

export default function Compare() {
  const { stocks: DATA } = useStocks()
  // افتراضياً نقارن 4 أسهم ريادية ليعرض واجهة مبهرة عند أول تحميل للصفحة
  const [syms, setSyms] = useState<string[]>(['EMAAR', 'FAB', 'ADNOCGAS', 'DEWA'])
  const picked = syms.map((sy) => DATA.find((d) => d.sym === sy)!).filter(Boolean)

  function toggle(sym: string) {
    setSyms((cur) =>
      cur.includes(sym) ? cur.filter((s) => s !== sym) : cur.length >= MAX ? cur : [...cur, sym],
    )
  }

  return (
    <div className="view">
      <div className="page-head">
        <h1>المقارنة التفصيلية للأسهم</h1>
        <p>اختر حتى {MAX} أسهم لمقارنتها جنبًا إلى جنب وبأدق التفاصيل المالية والتنظيمية ({picked.length}/{MAX})</p>
      </div>

      {/* قائمة اختيار الأسهم */}
      <div className="pick-grid">
        {DATA.map((s) => (
          <button
            key={s.sym}
            className={'pick' + (syms.includes(s.sym) ? ' on' : '')}
            onClick={() => toggle(s.sym)}
            disabled={!syms.includes(s.sym) && syms.length >= MAX}
          >
            <Avatar sym={s.sym} size={24} />
            {s.sym}
          </button>
        ))}
      </div>

      {picked.length === 0 ? (
        <div className="empty">اختر سهماً واحداً على الأقل من القائمة أعلاه لبدء المقارنة الفورية.</div>
      ) : (
        <div className="compare-wrap">
          {/* مخطط رادار التوزيعات Snowflake والرمز اللوني */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 className="panel-h" style={{ width: '100%', textAlign: 'right' }}>الملف الوصفي والتقييم المقارن (Snowflake Radar)</h3>
            <div style={{ width: '100%', maxWidth: '500px' }}>
              <Snowflake items={picked.map((s) => ({ stock: s, color: symColor(s.sym) }))} height={340} />
            </div>
            <div className="legend" style={{ marginTop: 14 }}>
              {picked.map((s) => (
                <span key={s.sym} className="legend-item" style={{ fontSize: '13.5px', fontWeight: 600 }}>
                  <i style={{ background: symColor(s.sym) }} />
                  {s.sym}
                </span>
              ))}
            </div>
          </div>

          {/* جدول المقارنة الشامل مع تمييز القيم الأفضل */}
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th style={{ background: 'var(--chip)', color: 'var(--txt)', fontWeight: 800 }}>المؤشر المالي</th>
                  {picked.map((s) => (
                    <th key={s.sym} style={{ textAlign: 'center', background: 'var(--chip)' }}>
                      <span className="cellname" style={{ justifyContent: 'center' }}>
                        <Avatar sym={s.sym} size={28} />
                        <span>
                          <span className="cn-name">{s.name.split('—')[0]}</span>
                          <span className="cn-sym">{s.sym} <span className={'exch ex-' + s.ex}>{s.ex}</span></span>
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  // استخراج القيم الرقمية لمقارنتها وتحديد الأفضل
                  const numericVals = picked
                    .map((s) => (m.val ? m.val(s) : null))
                    .filter((x): x is number => x !== null)

                  let bestVal: number | null = null
                  if (numericVals.length > 0 && m.better) {
                    if (m.better === 'higher') {
                      bestVal = Math.max(...numericVals)
                    } else {
                      bestVal = Math.min(...numericVals)
                    }
                  }

                  return (
                    <tr key={m.k}>
                      <td className="metric-k" style={{ fontWeight: 600, color: 'var(--muted)', width: '220px' }}>{m.k}</td>
                      {picked.map((s) => {
                        const cellVal = m.get(s)
                        const sNumVal = m.val ? m.val(s) : null
                        const isBest = bestVal !== null && sNumVal === bestVal

                        return (
                          <td
                            key={s.sym}
                            style={{
                              textAlign: 'center',
                              ...(isBest
                                ? {
                                    color: 'var(--good)',
                                    fontWeight: '800',
                                    background: 'rgba(33, 201, 139, 0.08)',
                                  }
                                : {}),
                            }}
                          >
                            {isBest && (
                              <span 
                                style={{ 
                                  marginInlineEnd: '4px', 
                                  color: 'var(--warn)', 
                                  fontSize: '13px' 
                                }}
                                title="الأفضل في هذه الفئة"
                              >
                                ⭐
                              </span>
                            )}
                            {cellVal}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
