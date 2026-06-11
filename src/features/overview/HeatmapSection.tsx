import { useState } from 'react'
import type { Stock } from '@/data'
import { parseYield, parseAmount } from '@/format'

/** خريطة السوق الحرارية التفاعلية: تلوين الخلايا حسب العائد أو مكرر الربحية أو القيمة السوقية. */
export default function HeatmapSection({
  stocks,
  maxYield,
  maxMcap,
  onOpen,
}: {
  stocks: Stock[]
  maxYield: number
  maxMcap: number
  onOpen: (s: Stock) => void
}) {
  // التحكم بنوع خريطة السوق الحرارية
  const [heatmapMetric, setHeatmapMetric] = useState<'yield' | 'pe' | 'mcap'>('yield')

  return (
    <>
      <div className="o-heat-head">
        <h2 className="sec flush">
          <span className="dot brand2" /> خريطة السوق الحرارية التفاعلية
        </h2>
        <div className="o-toggle-container">
          <button
            className={'o-toggle-btn' + (heatmapMetric === 'yield' ? ' active' : '')}
            onClick={() => setHeatmapMetric('yield')}
          >
            عائد التوزيعات (%)
          </button>
          <button
            className={'o-toggle-btn' + (heatmapMetric === 'pe' ? ' active' : '')}
            onClick={() => setHeatmapMetric('pe')}
          >
            مكرر الربحية (P/E)
          </button>
          <button
            className={'o-toggle-btn' + (heatmapMetric === 'mcap' ? ' active' : '')}
            onClick={() => setHeatmapMetric('mcap')}
          >
            القيمة السوقية
          </button>
        </div>
      </div>

      <div className="heatmap o-heat-grid">
        {stocks.map((s) => {
          let cellBg = 'var(--chip)'
          let labelText = '—'
          let titleText = `${s.name} (${s.sym})`

          if (heatmapMetric === 'yield') {
            const y = parseYield(s.div.yld)
            labelText = s.div.yld ?? '—'
            titleText += ` — عائد نقدي: ${s.div.yld ?? 'غير معلن'}`
            if (y !== null && maxYield > 0) {
              const ratio = y / maxYield
              cellBg = `rgba(33, 201, 139, ${0.15 + ratio * 0.75})` // تدرج أخضر للتوزيعات
            }
          }
          else if (heatmapMetric === 'pe') {
            labelText = s.pe !== null ? `P/E ${s.pe.toFixed(1)}` : '—'
            titleText += ` — مكرر ربحية: ${s.pe !== null ? s.pe.toFixed(1) : 'يلزم تحقق'}`
            if (s.pe !== null && s.pe > 0) {
              if (s.pe <= 8) cellBg = 'rgba(33, 201, 139, 0.9)' // مكرر ممتاز ورخيص (أخضر داكن)
              else if (s.pe <= 15) cellBg = 'rgba(33, 201, 139, 0.45)' // مكرر جيد ومتوازن (أخضر فاتح)
              else if (s.pe <= 22) cellBg = 'rgba(255, 176, 32, 0.45)' // مكرر مرتفع نوعا ما (برتقالي فاتح)
              else cellBg = 'rgba(255, 90, 114, 0.65)' // مكرر متضخم (أحمر ناعم)
            }
          }
          else if (heatmapMetric === 'mcap') {
            const mc = parseAmount(s.mcap)
            labelText = s.mcap ?? '—'
            titleText += ` — القيمة السوقية: ${s.mcap ?? 'غير متوفرة'}`
            if (mc !== null && maxMcap > 0) {
              const ratio = mc / maxMcap
              cellBg = `rgba(58, 160, 255, ${0.15 + ratio * 0.75})` // تدرج أزرق للقيمة السوقية
            }
          }

          return (
            <button
              key={s.sym}
              className="heat-cell"
              onClick={() => onOpen(s)}
              style={{ background: cellBg }}
              title={titleText}
            >
              <span className="heat-sym">{s.sym}</span>
              <span className="heat-y">{labelText}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
