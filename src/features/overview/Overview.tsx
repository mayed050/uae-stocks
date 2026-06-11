import { useMemo } from 'react'
import type { Stock } from '@/data'
import type { View } from '@/components/Sidebar'
import { useStocks, useMarketStats } from '@/store'
import { getDailyData } from '@/market'
import PageHeader from '@/components/ui/PageHeader'
import MarketKpiStrip from './MarketKpiStrip'
import MarketIndexCards from './MarketIndexCards'
import MarketLeaders from './MarketLeaders'
import DividendMonthsCard from './DividendMonthsCard'
import LiveActionsFeed from './LiveActionsFeed'
import SectorDistribution from './SectorDistribution'
import InteractiveChartPanel from './InteractiveChartPanel'
import MarketMovementPanel from './MarketMovementPanel'
import HeatmapSection from './HeatmapSection'
import CompanyPricesWidget from './CompanyPricesWidget'
import DividendTrackerWidget from './DividendTrackerWidget'
import { useLiveActions } from './useLiveActions'
import './overview.css'

/** صفحة النظرة العامة — جذر تركيب: عمود رئيسي (رسوم وحركة وخريطة حرارية) وعمود جانبي (ودجات). */
export default function Overview({ onOpen, onNavigate }: { onOpen: (s: Stock) => void; onNavigate?: (v: View) => void }) {
  const { stocks: DATA } = useStocks()
  const {
    stats,
    alertRows,
    sectorData,
    maxYield,
    maxMcap,
    yieldLeaders,
    marketGiants,
    valuationOpportunities,
    monthData,
  } = useMarketStats()

  // التنبيهات المباشرة لإجراءات الشركات (عرض تجريبي يتجدد تلقائياً)
  const liveActions = useLiveActions()

  // حساب إجمالي الصفقات وحجم التداول اليومي التراكمي للأسواق الإماراتية
  const marketActivity = useMemo(() => {
    let dfmTrades = 0
    let adxTrades = 0
    let dfmVolume = 0
    let adxVolume = 0

    DATA.forEach(s => {
      const d = getDailyData(s)
      if (s.ex === 'DFM') {
        dfmTrades += d.trades
        dfmVolume += d.volume
      } else {
        adxTrades += d.trades
        adxVolume += d.volume
      }
    })

    return {
      dfmTrades,
      adxTrades,
      totalTrades: dfmTrades + adxTrades,
      dfmVolume,
      adxVolume,
      totalVolume: dfmVolume + adxVolume
    }
  }, [DATA])

  return (
    <div className="view">
      <PageHeader title="نظرة عامة على الأسهم والأسواق">
        لوحة معلوماتية مالية شاملة لـ {DATA.length} سهمًا مدرجاً في سوق دبي المالي وسوق أبوظبي للأوراق المالية
      </PageHeader>

      {/* شريط مؤشرات الأداء العلوي — ملخّص السوق في أربعة أرقام */}
      <MarketKpiStrip stats={stats} />

      <div className="overview-layout">
        {/* العمود الأيمن الرئيسي (المحتوى التفاعلي والبياني 70%) */}
        <div className="overview-main">
          {/* 📊 بطاقة نشاط مؤشرات الأسواق والنشاط اليومي */}
          <MarketIndexCards marketActivity={marketActivity} />

          {/* قسم التحليل: توزيع القطاعات + ازدحام شهور التوزيعات */}
          <div className="chart-grid o-sector-grid">
            <SectorDistribution sectorData={sectorData} />
            <DividendMonthsCard data={monthData} />
          </div>

          {/* 📈 لوحة الرسم البياني التفاعلي لأسعار وحركة الأسهم الفردية */}
          <InteractiveChartPanel stocks={DATA} />

          {/* 📊 لوحة حركة السوق التفاعلية الشاملة */}
          <MarketMovementPanel stocks={DATA} onOpen={onOpen} />

          {/* خريطة السوق الحرارية التفاعلية */}
          <HeatmapSection stocks={DATA} maxYield={maxYield} maxMcap={maxMcap} onOpen={onOpen} />
        </div>

        {/* العمود الأيسر الجانبي (المعلومات الرديفة 30%) */}
        <div className="overview-sidebar">
          {/* لوحات المتصدّرين: العوائد · العمالقة · فرص التقييم */}
          <MarketLeaders
            yieldLeaders={yieldLeaders}
            marketGiants={marketGiants}
            valuationOpportunities={valuationOpportunities}
            onOpen={onOpen}
          />

          {/* 1. لوحة قطاعات وأسعار الشركات */}
          <CompanyPricesWidget stocks={DATA} onOpen={onOpen} />

          {/* 2. متتبع توزيعات الأرباح التفاعلي المتقدم */}
          <DividendTrackerWidget alertRows={alertRows} onOpen={onOpen} onNavigate={onNavigate} />

          {/* 3. إشعارات وأحداث الشركات (عرض تجريبي) */}
          <LiveActionsFeed actions={liveActions} stocks={DATA} onOpen={onOpen} />
        </div>
      </div>
    </div>
  )
}
