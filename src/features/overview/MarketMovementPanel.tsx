import { useState, useMemo } from 'react'
import type { Stock } from '@/data'
import { usePortfolio } from '@/store'
import Avatar from '@/components/Avatar'
import SimBadge from '@/components/ui/SimBadge'
import { getDailyData } from '@/market'

function fmtTradingValue(val: number) {
  if (val >= 1e6) {
    return `${(val / 1e6).toFixed(2)} مليون د.إ`
  }
  if (val >= 1e3) {
    return `${(val / 1e3).toFixed(1)} ألف د.إ`
  }
  return `${val.toFixed(0)} د.إ`
}

/** لوحة حركة السوق: تبويبات (المرتفعة/المنخفضة/النشطة بالكمية/النشطة بالقيمة) وجدول تفاعلي. */
export default function MarketMovementPanel({ stocks, onOpen }: { stocks: Stock[]; onOpen: (s: Stock) => void }) {
  const { isInPortfolio } = usePortfolio()

  // التحكم بتبويب لوحة حركة السوق
  const [movementTab, setMovementTab] = useState<'gainers' | 'losers' | 'volume' | 'value'>('gainers')

  // تصفية وفرز قائمة حركة السوق بناء على التبويب المختار
  const movementStocks = useMemo(() => {
    const stocksWithData = stocks.map(s => {
      const d = getDailyData(s)
      return { s, d, pctNum: parseFloat(d.pct.replace('%', '')) }
    })

    if (movementTab === 'gainers') {
      return stocksWithData
        .filter(x => x.d.change > 0)
        .sort((a, b) => b.pctNum - a.pctNum)
        .slice(0, 10)
    } else if (movementTab === 'losers') {
      return stocksWithData
        .filter(x => x.d.change < 0)
        .sort((a, b) => a.pctNum - b.pctNum)
        .slice(0, 10)
    } else if (movementTab === 'volume') {
      return stocksWithData
        .sort((a, b) => b.d.volume - a.d.volume)
        .slice(0, 10)
    } else { // 'value'
      return stocksWithData
        .sort((a, b) => b.d.value - a.d.value)
        .slice(0, 10)
    }
  }, [stocks, movementTab])

  return (
    <div className="panel o-movement-panel">
      <div className="o-mv-head">
        <div>
          <h3 className="o-mv-title">
            🟠 حركة السوق
            <SimBadge title="الأسعار والتغيّر والحجم وقيمة التداول حقيقية من TradingView/Yahoo؛ «عدد الصفقات» فقط تقديري.">الصفقات تقديرية</SimBadge>
          </h3>
          <p className="o-mv-sub">
            قائمة مرتبة حسب {
              movementTab === 'gainers' ? 'الأسهم المرتفعة' :
              movementTab === 'losers' ? 'الأسهم المنخفضة' :
              movementTab === 'volume' ? 'النشطة بالكمية' :
              'النشطة بالقيمة'
            }
          </p>
        </div>

        {/* تبويبات الفرز والتصفية */}
        <div className="o-mv-tabs">
          {([['gainers', 'المرتفعة'], ['losers', 'المنخفضة'], ['volume', 'النشطة بالكمية'], ['value', 'النشطة بالقيمة']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMovementTab(key)}
              className={'o-mv-tab' + (movementTab === key ? ' active' : '')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* الجدول التفاعلي لحركة السوق */}
      <div className="o-mv-tablewrap">
        <table className="o-mv-table">
          <thead>
            <tr>
              <th className="al-r">الشركة</th>
              <th className="al-c">السعر</th>
              <th className="al-c">التغير</th>
              <th className="al-c">مكرر الربحية</th>
              <th className="al-c">العائد النقدي</th>
              <th className="al-c">عدد الصفقات</th>
              <th className="al-l">قيمة التداول</th>
            </tr>
          </thead>
          <tbody>
            {movementStocks.map(({ s, d }) => {
              const priceFormatted = s.price !== null ? `${s.price.toFixed(2)} د.إ` : '—'
              const peFormatted = s.pe !== null ? s.pe.toFixed(2) : '—'
              const yieldFormatted = s.div.yld ?? '—'
              const tradesFormatted = d.trades.toLocaleString('en-US')
              const valueFormatted = fmtTradingValue(d.value)

              return (
                <tr
                  key={s.sym}
                  onClick={() => onOpen(s)}
                  className="movement-row"
                >
                  {/* عمود الشركة */}
                  <td className="o-mv-company">
                    <Avatar sym={s.sym} size={32} />
                    <div>
                      <span className="o-mv-sym">{s.sym}</span>
                      <span className="o-mv-name">{s.name.split('—')[0]}</span>
                    </div>
                    {isInPortfolio(s.sym) && <span title="في محفظتك" className="o-mv-pf">💼</span>}
                  </td>

                  {/* عمود السعر */}
                  <td className="o-mv-num">
                    {priceFormatted}
                  </td>

                  {/* عمود التغير */}
                  <td className={'o-mv-change ' + (d.isFlat ? 'flat' : d.isUp ? 'up' : 'down')}>
                    {d.isUp ? `+` : ''}{d.pct}
                  </td>

                  {/* عمود مكرر الربحية */}
                  <td className="o-mv-mut">
                    {peFormatted}
                  </td>

                  {/* عمود العائد النقدي */}
                  <td className="o-mv-yield">
                    {yieldFormatted}
                  </td>

                  {/* عمود عدد الصفقات (تقديري) */}
                  <td className="o-mv-mut">
                    {tradesFormatted}
                  </td>

                  {/* عمود قيمة التداول */}
                  <td className="o-mv-val">
                    {valueFormatted}
                  </td>
                </tr>
              )
            })}

            {movementStocks.length === 0 && (
              <tr>
                <td colSpan={7} className="o-mv-empty">
                  لا توجد أسهم تطابق التصفية الحالية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
