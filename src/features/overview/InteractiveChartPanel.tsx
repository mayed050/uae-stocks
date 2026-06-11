import { useState, useMemo } from 'react'
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts'
import type { Stock } from '@/data'
import { useHistory } from '@/store'
import Avatar from '@/components/Avatar'
import SimBadge from '@/components/ui/SimBadge'
import { getDailyData, generateHistoricalData, generateSparklineData, realHistory } from '@/market'

// الأسهم القيادية المعروضة في قائمة الاختيار الجانبية
const FEATURED_SYMS = ['DEWA', 'EMAAR', 'FAB', 'SALIK', 'ADNOCDIST', 'ADIB', 'EAND', 'DIB']

/** لوحة الرسم البياني التفاعلي لأسعار الأسهم الفردية مع قائمة الأسهم القيادية وSparklines. */
export default function InteractiveChartPanel({ stocks }: { stocks: Stock[] }) {
  const histMap = useHistory()

  // السهم النشط المختار للرسم البياني المتطور
  const [selectedChartSym, setSelectedChartSym] = useState<string>('DEWA')
  // الفترة الزمنية النشطة للرسم البياني
  const [chartTimeframe, setChartTimeframe] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M')

  // الحصول على بيانات السهم المختار للرسم البياني وتوليد تاريخه
  const selectedChartStock = useMemo(() => {
    // stocks هي بيانات البذرة المضمّنة وغير فارغة دائماً؛ التأكيد يطابق افتراض التطبيق القائم.
    const s = stocks.find(st => st.sym.toUpperCase() === selectedChartSym.toUpperCase()) ?? stocks[0]!
    const realPts = histMap[s.sym]
    const isReal = Array.isArray(realPts) && realPts.length > 1
    const history = isReal
      ? realHistory(realPts, chartTimeframe, s.price ?? 1.0)
      : generateHistoricalData(s.sym, chartTimeframe, s.price ?? 1.0)
    return {
      stock: s,
      isReal,
      ...history
    }
  }, [stocks, selectedChartSym, chartTimeframe, histMap])

  return (
    <div className="panel o-chart-panel">
      <div className="chart-dashboard-container">

        {/* القسم الأيسر: الرسم البياني والمؤشرات الفنية (يمثل 70% من العرض) */}
        <div className="chart-dashboard-left">

          {/* رأس لوحة الرسم البياني (اسم السهم وتفاصيل التغير المؤقتة والفترات الزمنية) */}
          <div className="o-chart-head">
            <div>
              <h3 className="o-chart-title">
                <Avatar sym={selectedChartStock.stock.sym} size={28} />
                {selectedChartStock.stock.sym} — {selectedChartStock.stock.name.split('—')[0]}
                {selectedChartStock.isReal ? (
                  <span title="أسعار إغلاق تاريخية حقيقية (سنة) من Yahoo Finance." className="o-real-badge">● تاريخ حقيقي</span>
                ) : (
                  <SimBadge title="السعر الحالي والتغيّر اليومي حقيقيان؛ سلسلة الأسعار التاريخية لهذا السهم (أبوظبي) توضيحية مُولّدة للعرض فقط.">التاريخ توضيحي</SimBadge>
                )}
              </h3>
              <div className="o-price-row">
                <span className="o-price-big">
                  {selectedChartStock.stock.price?.toFixed(2)} د.إ
                </span>
                <span className={'o-price-change ' + (selectedChartStock.isOverallUp ? 'up' : 'down')}>
                  {selectedChartStock.isOverallUp ? '▲' : '▼'} {selectedChartStock.change.toFixed(2)} ({selectedChartStock.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* أزرار تحديد المدى الزمني للرسم البياني */}
            <div className="o-tf-group">
              {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => {
                const tfLabel = tf === '1W' ? 'أسبوع' : tf === '1M' ? 'شهر' : tf === '3M' ? '3 أشهر' : tf === '6M' ? '6 أشهر' : tf === '1Y' ? 'سنة' : 'الكل'
                return (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`chart-timeframe-btn ${chartTimeframe === tf ? 'active' : ''}`}
                  >
                    {tfLabel}
                  </button>
                )
              })}
            </div>
          </div>

          {/* مساحة الرسم البياني التفاعلي المتجاوب مع تلوين ديناميكي للاتجاه */}
          <div className="o-chart-area">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={selectedChartStock.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartColorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedChartStock.isOverallUp ? '#21c98b' : '#ff5a72'} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={selectedChartStock.isOverallUp ? '#21c98b' : '#ff5a72'} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  orientation="right"
                  tick={{ fill: 'var(--muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel-solid)',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    fontSize: '11.5px',
                    color: 'var(--txt)',
                    textAlign: 'right'
                  }}
                  formatter={(val) => [`${Number(val).toFixed(2)} د.إ`, 'السعر']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={selectedChartStock.isOverallUp ? '#21c98b' : '#ff5a72'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#chartColorGrad)"
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* جدول البيانات والملخص الفني السفلي للسهم المختار */}
          <div className="o-chart-stats">

            {/* العمود الأيمن: مؤشرات الأسعار الفنية */}
            <div className="o-stat-col">
              <div className="o-kv">
                <span className="k">الأعلى سعر:</span>
                <b>{selectedChartStock.high.toFixed(2)} د.إ</b>
              </div>
              <div className="o-kv">
                <span className="k">الأدنى سعر:</span>
                <b>{selectedChartStock.low.toFixed(2)} د.إ</b>
              </div>
              <div className="o-kv">
                <span className="k">سعر الافتتاح:</span>
                <b>{selectedChartStock.open.toFixed(2)} د.إ</b>
              </div>
              <div className="o-kv nb">
                <span className="k">إغلاق السهم الحالي:</span>
                <b>{selectedChartStock.close.toFixed(2)} د.إ</b>
              </div>
            </div>

            {/* العمود الأيسر: مؤشرات التغير والعوائد */}
            <div className="o-stat-col">
              <div className="o-kv">
                <span className="k">مقدار التغير اليومي:</span>
                <b className={selectedChartStock.stock.price !== null && getDailyData(selectedChartStock.stock).change >= 0 ? 'up' : 'down'}>
                  {selectedChartStock.stock.price !== null ? (getDailyData(selectedChartStock.stock).change >= 0 ? '+' : '') : ''}{selectedChartStock.stock.price !== null ? getDailyData(selectedChartStock.stock).change.toFixed(2) : '—'}
                </b>
              </div>
              <div className="o-kv">
                <span className="k">نسبة التغير اليومي:</span>
                <b className={selectedChartStock.stock.price !== null && getDailyData(selectedChartStock.stock).change >= 0 ? 'up' : 'down'}>
                  {getDailyData(selectedChartStock.stock).pct}
                </b>
              </div>
              <div className="o-kv nb">
                <span className="k">العائد النقدي (%) الحالي:</span>
                <b className="good">{selectedChartStock.stock.div.yld ?? '—'}</b>
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

            // توليد Sparkline
            const sparkPoints = generateSparklineData(stock.sym, stock.price ?? 1)
            const minP = Math.min(...sparkPoints)
            const maxP = Math.max(...sparkPoints)
            const normalizedPoints = sparkPoints.map((p, idx) => {
              const x = (idx / (sparkPoints.length - 1)) * 40
              const y = 14 - ((p - minP) / (maxP - minP || 1)) * 10
              return `${x},${y}`
            }).join(' ')

            return (
              <div
                key={stock.sym}
                onClick={() => setSelectedChartSym(stock.sym)}
                className={`chart-stock-item ${isActive ? 'active' : ''}`}
              >
                <div className="o-spark-row">
                  <span className="o-spark-sym">{stock.sym}</span>
                  <span className="o-spark-price">{stock.price?.toFixed(2)} د.إ</span>
                </div>

                <div className="o-spark-row m2">
                  <span className="o-spark-name">{stock.name.split('—')[0]}</span>

                  {/* Sparkline رسم بياني خطي مصغر */}
                  <div className="o-spark-mini">
                    <svg width="40" height="15" className="o-spark-svg">
                      <polyline
                        fill="none"
                        stroke={stockDaily.isUp ? 'var(--good)' : 'var(--bad)'}
                        strokeWidth="1.5"
                        points={normalizedPoints}
                      />
                    </svg>
                    <span className={'o-spark-pct ' + (stockDaily.isUp ? 'up' : 'down')}>
                      {stockDaily.pct}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
