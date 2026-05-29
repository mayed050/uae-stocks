import { useState } from 'react'
import { CAT_LABEL } from '../data'
import type { Stock } from '../data'
import { useStocks } from '../store'
import { symColor } from '../format'
import Snowflake from '../components/Snowflake'
import Avatar from '../components/Avatar'

const NA = 'يلزم التحقق'
const MAX = 3
function v(x: string | number | null | undefined) {
  return x === null || x === undefined || x === '' ? <span className="na">{NA}</span> : x
}

const METRICS: { k: string; get: (s: Stock) => React.ReactNode }[] = [
  { k: 'السوق', get: (s) => s.ex },
  { k: 'القطاع', get: (s) => s.sector },
  { k: 'التصنيف', get: (s) => CAT_LABEL[s.cat] },
  { k: 'السعر', get: (s) => v(s.price !== null ? s.price.toFixed(2) : null) },
  { k: 'القيمة السوقية', get: (s) => v(s.mcap) },
  { k: 'مكرر الربحية', get: (s) => v(s.pe) },
  { k: 'ربحية السهم', get: (s) => v(s.eps) },
  { k: 'صافي الربح', get: (s) => v(s.net) },
  { k: 'الإيرادات', get: (s) => v(s.rev) },
  { k: 'التوزيع/سهم', get: (s) => v(s.div.ps) },
  { k: 'العائد النقدي', get: (s) => v(s.div.yld) },
  { k: 'تاريخ الدفع', get: (s) => v(s.div.pay) },
]

export default function Compare() {
  const { stocks: DATA } = useStocks()
  const [syms, setSyms] = useState<string[]>(['EMAAR', 'FAB', 'ADNOCGAS'])
  const picked = syms.map((sy) => DATA.find((d) => d.sym === sy)!).filter(Boolean)

  function toggle(sym: string) {
    setSyms((cur) =>
      cur.includes(sym) ? cur.filter((s) => s !== sym) : cur.length >= MAX ? cur : [...cur, sym],
    )
  }

  return (
    <div className="view">
      <div className="page-head">
        <h1>المقارنة</h1>
        <p>اختر حتى {MAX} أسهم لمقارنتها جنبًا إلى جنب ({picked.length}/{MAX})</p>
      </div>

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
        <div className="empty">اختر سهمًا واحدًا على الأقل للمقارنة.</div>
      ) : (
        <div className="compare-wrap">
          <div className="panel">
            <h3 className="panel-h">الملف الوصفي المقارن</h3>
            <Snowflake items={picked.map((s) => ({ stock: s, color: symColor(s.sym) }))} height={320} />
            <div className="legend">
              {picked.map((s) => (
                <span key={s.sym} className="legend-item">
                  <i style={{ background: symColor(s.sym) }} />
                  {s.sym}
                </span>
              ))}
            </div>
          </div>

          <div className="tablewrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>المؤشر</th>
                  {picked.map((s) => (
                    <th key={s.sym}>
                      <span className="cellname">
                        <Avatar sym={s.sym} size={28} />
                        <span><span className="cn-name">{s.name}</span><span className="cn-sym">{s.sym}</span></span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.k}>
                    <td className="metric-k">{m.k}</td>
                    {picked.map((s) => <td key={s.sym}>{m.get(s)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
