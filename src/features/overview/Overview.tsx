import { useMemo, useState } from 'react'
import { Grid3x3 } from 'lucide-react'
import type { Stock } from '@/data'
import type { View } from '@/components/nav'
import { useStocks, useMarketStats } from '@/store'
import { sessionDate as lastSession } from '@/lib'
import PageHeader from '@/components/ui/PageHeader'
import MarketKpiStrip from './MarketKpiStrip'
import UpcomingDividends from './UpcomingDividends'
import MarketIndexCards from './MarketIndexCards'
import MarketMovementPanel from './MarketMovementPanel'
import MarketLeaders from './MarketLeaders'
import InteractiveChartPanel from './InteractiveChartPanel'
import SectorDistribution from './SectorDistribution'
import DividendMonthsCard from './DividendMonthsCard'
import HeatmapSection from './HeatmapSection'
import './overview.css'

/**
 * صفحة النظرة العامة مرتّبة حول مهمتها: الأرقام الكبرى، ثم مواعيد التوزيع القادمة، ثم السوق اليوم
 * (المؤشرات والحركة والمتصدّرون)، ثم التحليل (مخطط السعر، القطاعات، شهور التوزيع)، والخريطة الحرارية مطويّة.
 */
export default function Overview({ onOpen, onNavigate }: { onOpen: (s: Stock) => void; onNavigate?: (v: View) => void }) {
  const { stocks: DATA, indices } = useStocks()
  const { stats, sectorData, yieldLeaders, marketGiants, valuationOpportunities, monthData } = useMarketStats()
  const [heatOpen, setHeatOpen] = useState(false)

  // نشاط آخر جلسة للأسهم المغطّاة — من الحقول الحقيقية فقط (حجم + نسبة تغيّر) ولأحدث تاريخ تداول،
  // فلا تدخل أسهم متقادمة السعر أو أحجام مولّدة في المجاميع.
  const marketActivity = useMemo(() => {
    const sessionDate = lastSession(DATA)
    const session = DATA.filter((s) => s.asof === sessionDate && typeof s.volume === 'number' && typeof s.price === 'number')
    let dfmVolume = 0
    let adxVolume = 0
    let totalValue = 0
    let advancers = 0
    let decliners = 0
    let unchanged = 0
    session.forEach((s) => {
      const vol = s.volume as number
      if (s.ex === 'DFM') dfmVolume += vol
      else adxVolume += vol
      totalValue += vol * (s.price as number)
      const c = s.change ?? 0
      if (c > 0) advancers++
      else if (c < 0) decliners++
      else unchanged++
    })
    return { sessionCount: session.length, sessionDate, dfmVolume, adxVolume, totalValue, advancers, decliners, unchanged }
  }, [DATA])

  return (
    <div className="view ov-stack">
      <PageHeader title="نظرة عامة على الأسهم والأسواق">
        لوحة معلوماتية مالية شاملة لـ {DATA.length} سهمًا مدرجاً في سوق دبي المالي وسوق أبوظبي للأوراق المالية
      </PageHeader>

      <MarketKpiStrip stats={stats} />

      <UpcomingDividends stocks={DATA} onOpen={onOpen} onNavigate={onNavigate} />

      <MarketIndexCards indices={indices} marketActivity={marketActivity} />

      <div className="ov-row-2-1">
        <MarketMovementPanel stocks={DATA} onOpen={onOpen} />
        <MarketLeaders
          yieldLeaders={yieldLeaders}
          marketGiants={marketGiants}
          valuationOpportunities={valuationOpportunities}
          onOpen={onOpen}
        />
      </div>

      <InteractiveChartPanel stocks={DATA} />

      <div className="ov-row-1-1">
        <SectorDistribution sectorData={sectorData} />
        <DividendMonthsCard data={monthData} />
      </div>

      {/* الخريطة الحرارية مطويّة، ولا تُرسم خلاياها الستون إلا عند فتحها */}
      <details className="panel ov-heat" onToggle={(e) => setHeatOpen(e.currentTarget.open)}>
        <summary>
          <Grid3x3 size={16} className="ico" aria-hidden /> خريطة السوق الحرارية — أكبر 60 شركة
        </summary>
        {heatOpen && <HeatmapSection stocks={DATA} onOpen={onOpen} />}
      </details>
    </div>
  )
}
