import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import StatCard from '@/components/ui/StatCard'
import { TIP_STYLE as tipStyle } from '@/constants/ui'
import { computeDripSeries } from './portfolioCalcs'

/** محاكي أثر إعادة استثمار الأرباح (DRIP Snowball Simulator) — حالة المدخلات داخلية بالكامل. */
export default function DripSimulator({ totalInvested, weightedYield }: { totalInvested: number; weightedYield: number }) {
  const [dripYears, setDripYears] = useState<number>(10)
  const [dripMonthly, setDripMonthly] = useState<number>(1000)
  const [dripPriceGrowth, setDripPriceGrowth] = useState<number>(4) // 4% نمو سعر السهم
  const [dripDivGrowth, setDripDivGrowth] = useState<number>(3)     // 3% نمو التوزيعات السنوي

  const dripData = useMemo(
    () => computeDripSeries({
      totalInvested,
      weightedYield,
      years: dripYears,
      monthly: dripMonthly,
      priceGrowth: dripPriceGrowth,
      divGrowth: dripDivGrowth,
    }),
    [totalInvested, weightedYield, dripYears, dripMonthly, dripPriceGrowth, dripDivGrowth],
  )

  // حساب مؤشر كرة الثلج النهائي
  const finalDripWealth = dripData[dripData.length - 1]?.dripWealth ?? 0
  const finalCashWealth = dripData[dripData.length - 1]?.cashWealth ?? 0
  const snowballEffectValue = Math.max(0, finalDripWealth - finalCashWealth)

  return (
    <div className="panel p-my24">
      <div className="drip-head">
        <h3 className="panel-h">
          ❄️ محاكي أثر إعادة استثمار الأرباح (DRIP Snowball Simulator)
        </h3>
        <p>
          شاهد كيف تنمو ثروتك ومحفظتك بشكل أسي على المدى الطويل عند إعادة استثمار أرباح الأسهم بدلاً من سحبها
        </p>
      </div>

      {/* شبكة التحكم بالمدخلات */}
      <div className="drip-ctrl-grid">
        <div className="drip-slider-box">
          <div className="drip-slider-header">
            <span>⏳ أفق الاستثمار</span>
            <span className="drip-val brand">{dripYears} سنة</span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            className="drip-slider"
            value={dripYears}
            onChange={(e) => setDripYears(parseInt(e.target.value))}
          />
        </div>

        <div className="drip-slider-box">
          <div className="drip-slider-header">
            <span>💵 مساهمة شهرية إضافية</span>
            <span className="drip-val good">{dripMonthly.toLocaleString('en-US')} د.إ</span>
          </div>
          <input
            type="range"
            min="0"
            max="15000"
            step="500"
            className="drip-slider"
            value={dripMonthly}
            onChange={(e) => setDripMonthly(parseInt(e.target.value))}
          />
        </div>

        <div className="drip-slider-box">
          <div className="drip-slider-header">
            <span>📈 نمو سعر الأسهم سنويًا</span>
            <span className="drip-val warn">{dripPriceGrowth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            className="drip-slider"
            value={dripPriceGrowth}
            onChange={(e) => setDripPriceGrowth(parseFloat(e.target.value))}
          />
        </div>

        <div className="drip-slider-box">
          <div className="drip-slider-header">
            <span>💸 نمو التوزيعات سنويًا</span>
            <span className="drip-val brand2">{dripDivGrowth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            className="drip-slider"
            value={dripDivGrowth}
            onChange={(e) => setDripDivGrowth(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* لوحة المؤشرات السريعة للمحاكاة */}
      <div className="stats drip-stats">
        <StatCard
          className="drip-stat-cash"
          value={`${finalCashWealth.toLocaleString('en-US')} درهم`}
          label="ثروة سحب الأرباح نقداً (Cash)"
          sub="توزيعات مسحوبة وغير مستثمرة"
        />
        <StatCard
          className="drip-stat-drip"
          value={`${finalDripWealth.toLocaleString('en-US')} درهم`}
          label="ثروة إعادة الاستثمار (DRIP)"
          sub="توزيعات يعاد ضخها فورياً بالسوق"
        />
        <StatCard
          className="drip-stat-gain"
          value={`+${snowballEffectValue.toLocaleString('en-US')} درهم`}
          label="🔥 عائد أثر كرة الثلج الإضافي"
          sub="مكاسب خالصة من قوة الفائدة المركبة"
        />
      </div>

      {/* الرسم البياني لنمو الثروة */}
      <div className="drip-chart-box">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={dripData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorDrip" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand2)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--brand2)" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--muted2)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--muted2)" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="year" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(val: number) => `${val / 1000}k`} />
            <Tooltip
              contentStyle={tipStyle}
              formatter={(val, name) => [
                `${Number(val).toLocaleString('en-US')} درهم`,
                name === 'dripWealth' ? 'إعادة الاستثمار (DRIP)' : 'سحب الأرباح كاش'
              ]}
            />
            <Area
              type="monotone"
              dataKey="dripWealth"
              stroke="var(--brand2)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorDrip)"
              name="dripWealth"
            />
            <Area
              type="monotone"
              dataKey="cashWealth"
              stroke="var(--muted2)"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorCash)"
              name="cashWealth"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="drip-legend">
        <span className="drip-legend-item">
          <i className="drip" />
          المحفظة مع إعادة استثمار الأرباح (DRIP)
        </span>
        <span className="drip-legend-item">
          <i className="cash" />
          المحفظة مع سحب الأرباح نقداً (Cash)
        </span>
      </div>
    </div>
  )
}
