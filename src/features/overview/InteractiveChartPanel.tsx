import { useState, useMemo } from 'react'
import { LineChart } from 'lucide-react'
import type { Stock } from '@/data'
import { useHistory } from '@/store'
import type { HistPoint } from '@/store'
import Avatar from '@/components/Avatar'
import { ChartSlot } from '@/components/LazySlot'
import { LazyPriceChart } from '@/components/lazy'
import { getDailyData, periodSeries } from '@/market'
import type { Timeframe } from '@/market'

// الأسهم القيادية المعروضة في قائمة الاختيار الجانبية
const FEATURED_SYMS = ['DEWA', 'EMAAR', 'FAB', 'SALIK', 'ADNOCDIST', 'ADIB', 'EAND', 'DIB']
const TF_LABEL: Record<Timeframe, string> = { '1W': 'أسبوع', '1M': 'شهر', '3M': '3 أشهر', '6M': '6 أشهر', '1Y': 'سنة', ALL: 'الكل' }

/** خط مصغّر من آخر 20 إغلاقًا حقيقيًا (لا يُرسم شيء دون سجل). */
function sparkPath(pts: HistPoint[] | undefined): string | null {
  const closes = (pts ?? []).slice(-20).map((p) => p[1])
  if (closes.length < 2) return null
  const min = Math.min(...closes)
  const span = Math.max(...closes) - min || 1
  return closes.map((c, i) => `${(i / (closes.length - 1)) * 40},${14 - ((c - min) / span) * 10}`).join(' ')
}

/** لوحة الرسم البياني لأسعار الأسهم القيادية — أسعار إغلاق حقيقية فقط (Lightweight Charts). */
export default function InteractiveChartPanel({ stocks }: { stocks: Stock[] }) {
  const { history: histMap, pending } = useHistory()
  const [selectedChartSym, setSelectedChartSym] = useState<string>('DEWA')
  const [chartTimeframe, setChartTimeframe] = useState<Timeframe>('3M')

  // stocks هي بيانات البذرة المضمّنة وغير فارغة دائماً؛ التأكيد يطابق افتراض التطبيق القائم.
  const stock = stocks.find((st) => st.sym.toUpperCase() === selectedChartSym.toUpperCase()) ?? stocks[0]!
  const series = useMemo(
    () => periodSeries(histMap[stock.sym] ?? [], chartTimeframe, { price: stock.price, asof: stock.asof }),
    [histMap, stock, chartTimeframe],
  )
  const daily = getDailyData(stock)

  return (
    <div className="panel o-chart-panel">
      <div className="chart-dashboard-container">

        {/* القسم الأيسر: الرسم البياني والمؤشرات الفنية (يمثل 70% من العرض) */}
        <div className="chart-dashboard-left">

          {/* رأس لوحة الرسم البياني (اسم السهم وتفاصيل التغير المؤقتة والفترات الزمنية) */}
          <div className="o-chart-head">
            <div>
              <h3 className="o-chart-title">
                <Avatar sym={stock.sym} size={28} />
                {stock.sym} — {stock.name.split('—')[0]}
                {series && (
                  <span title="أسعار إغلاق يومية حقيقية من Yahoo Finance." className="o-real-badge">● أسعار حقيقية</span>
                )}
              </h3>
              <div className="o-price-row">
                <span className="o-price-big">{stock.price?.toFixed(2)} د.إ</span>
                {series && (
                  <span className={'o-price-change ' + (series.up ? 'up' : 'down')} title={`التغيّر خلال ${TF_LABEL[chartTimeframe]}`}>
                    {series.up ? '▲' : '▼'} {series.change.toFixed(2)} ({series.changePct.toFixed(2)}%) · {TF_LABEL[chartTimeframe]}
                  </span>
                )}
              </div>
            </div>

            {/* أزرار تحديد المدى الزمني للرسم البياني */}
            <div className="o-tf-group">
              {(Object.keys(TF_LABEL) as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  aria-pressed={chartTimeframe === tf}
                  className={`chart-timeframe-btn ${chartTimeframe === tf ? 'active' : ''}`}
                >
                  {TF_LABEL[tf]}
                </button>
              ))}
            </div>
          </div>

          {series ? (
            <ChartSlot height={260}>
              <LazyPriceChart points={series.points} up={series.up} label={`سعر إغلاق ${stock.sym} — ${TF_LABEL[chartTimeframe]}`} />
            </ChartSlot>
          ) : pending ? (
            <div className="chart-skeleton" role="status" aria-label="جارٍ تحميل الأسعار التاريخية" style={{ height: 260 }} />
          ) : (
            <div className="chart-empty">
              <LineChart size={28} aria-hidden />
              <b>لا يتوفر سجل أسعار تاريخي لهذا السهم بعد</b>
              <span>
                {histMap[stock.sym]?.[0]
                  ? `يُبنى سجل هذا السهم يوميًا منذ ${histMap[stock.sym]![0]![0]} من أسعار الإغلاق الفعلية؛ يظهر المخطط بعد يومَي تداول.`
                  : 'أسعار أبوظبي التاريخية غير متاحة مجانًا؛ يُبنى سجلها يوميًا من أسعار الإغلاق الفعلية. يُعرض الآن السعر الحالي والتغيّر اليومي الحقيقيان فقط.'}
              </span>
            </div>
          )}

          <div className="o-chart-stats">
            <div className="o-stat-col">
              <div className="o-kv">
                <span className="k">أعلى إغلاق في الفترة:</span>
                <b>{series ? `${series.high.toFixed(2)} د.إ` : '—'}</b>
              </div>
              <div className="o-kv">
                <span className="k">أدنى إغلاق في الفترة:</span>
                <b>{series ? `${series.low.toFixed(2)} د.إ` : '—'}</b>
              </div>
              <div className="o-kv">
                <span className="k">إغلاق أول الفترة:</span>
                <b>{series ? `${series.start.toFixed(2)} د.إ` : '—'}</b>
              </div>
              <div className="o-kv nb">
                <span className="k">آخر سعر:</span>
                <b>{stock.price !== null ? `${stock.price.toFixed(2)} د.إ` : '—'}</b>
              </div>
            </div>

            <div className="o-stat-col">
              <div className="o-kv">
                <span className="k">مقدار التغير اليومي:</span>
                <b className={daily.isUp ? 'up' : daily.isDown ? 'down' : undefined}>{daily.change == null ? '—' : `${daily.change > 0 ? '+' : ''}${daily.change.toFixed(2)}`}</b>
              </div>
              <div className="o-kv">
                <span className="k">نسبة التغير اليومي:</span>
                <b className={daily.isUp ? 'up' : daily.isDown ? 'down' : undefined}>{daily.pct}</b>
              </div>
              <div className="o-kv nb">
                <span className="k">العائد النقدي (%) الحالي:</span>
                <b className="good">{stock.div.yld ?? '—'}</b>
              </div>
            </div>
          </div>

        </div>

        {/* القسم الأيمن: قائمة اختيار ومتابعة الأسهم التفاعلية مع شارات الحركة Sparklines */}
        <div className="chart-dashboard-right">
          <div className="o-spark-head">
            <b>الأسهم القيادية المتاحة</b>
          </div>
          {stocks.filter(st => FEATURED_SYMS.includes(st.sym.toUpperCase())).map((stock) => {
            const isActive = stock.sym.toUpperCase() === selectedChartSym.toUpperCase()
            const stockDaily = getDailyData(stock)
            const spark = sparkPath(histMap[stock.sym])

            return (
              <button
                key={stock.sym}
                onClick={() => setSelectedChartSym(stock.sym)}
                aria-pressed={isActive}
                className={`chart-stock-item ${isActive ? 'active' : ''}`}
              >
                <span className="o-spark-row">
                  <span className="o-spark-sym">{stock.sym}</span>
                  <span className="o-spark-price">{stock.price?.toFixed(2)} د.إ</span>
                </span>

                <span className="o-spark-row m2">
                  <span className="o-spark-name">{stock.name.split('—')[0]}</span>

                  {/* Sparkline رسم بياني خطي مصغر */}
                  <span className="o-spark-mini">
                    {spark && (
                      <svg width="40" height="15" className="o-spark-svg" aria-hidden>
                        <polyline fill="none" stroke={stockDaily.isUp ? 'var(--good)' : stockDaily.isDown ? 'var(--bad)' : 'var(--muted)'} strokeWidth="1.5" points={spark} />
                      </svg>
                    )}
                    <span className={'o-spark-pct ' + (stockDaily.isUp ? 'up' : stockDaily.isDown ? 'down' : '')}>
                      {stockDaily.pct}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
