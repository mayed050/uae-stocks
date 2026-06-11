import { useState, useMemo } from 'react'
import type { Stock } from '@/data'
import { usePortfolio } from '@/store'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'
import PortfolioIntel from './PortfolioIntel'
import GoalTracker from './GoalTracker'
import PortfolioCharts from './PortfolioCharts'
import DripSimulator from './DripSimulator'
import AddStockControls from './AddStockControls'
import HoldingsTable from './HoldingsTable'
import {
  computeSectorData,
  computeAdvisorOutput,
  computeLifestyleMilestones,
  computeMonthlyFlow,
} from './portfolioCalcs'
import './portfolio.css'

/** صفحة المحفظة — جذر تركيب يجمع المكوّنات الفرعية ويمرّر لها حسابات usePortfolio. */
export default function Portfolio({ onOpen }: { onOpen: (s: Stock) => void }) {
  const {
    items,
    totalInvested,
    totalCost,
    totalMarketValue,
    totalGain,
    totalGainPct,
    totalAnnualDividends,
    weightedYield,
    yieldOnCost,
    monthlyAverage,
    goal,
    setGoal,
    addStock,
    deleteStock,
    updateAmount,
    updateShares,
    updateCost,
    isInPortfolio,
    stocks,
    loading
  } = usePortfolio()

  // تبويب داخلي لتقليل كثافة الصفحة: نظرة عامة مقابل التحليلات والمحاكاة
  const [tab, setTab] = useState<'overview' | 'analytics'>('overview')

  const sectorData = useMemo(() => computeSectorData(items), [items])
  const advisorOutput = useMemo(
    () => computeAdvisorOutput(items, sectorData, totalInvested, weightedYield),
    [items, sectorData, totalInvested, weightedYield],
  )
  const lifestyleMilestones = useMemo(() => computeLifestyleMilestones(totalAnnualDividends), [totalAnnualDividends])
  const monthlyData = useMemo(() => computeMonthlyFlow(items), [items])

  return (
    <div className="view">
      <div className="p-head-row">
        <PageHeader title="حاسبة محفظة التوزيعات الذكية">خطط وقم بمحاكاة أرباحك السنوية والشهرية بناءً على مبالغ استثمارك في الأسهم الإماراتية</PageHeader>
        <button
          onClick={() => window.print()}
          className="print-btn"
          title="حفظ طباعة التقرير الاستثماري للمحفظة كملف PDF"
        >
          <span>🖨️ تصدير التقرير (PDF)</span>
        </button>
      </div>

      {/* بطاقات الإحصائيات الكلية للمحفظة */}
      <div className="stats">
        <StatCard
          color="var(--brand)"
          value={`${totalInvested.toLocaleString('en-US')} درهم`}
          label="إجمالي المبالغ المستثمرة"
          sub={`${items.length} شركات مضافة`}
        />
        <StatCard
          color="var(--good)"
          value={`${Math.round(totalAnnualDividends).toLocaleString('en-US')} درهم`}
          label="الأرباح السنوية المتوقعة"
          sub={`بمتوسط ${Math.round(monthlyAverage).toLocaleString('en-US')} درهم شهرياً`}
        />
        <StatCard
          color="var(--warn)"
          value={`${weightedYield.toFixed(2)}%`}
          label="عائد توزيعات المحفظة الإجمالي"
          sub="متوسط مرجح للعائد النقدي"
        />
      </div>

      {/* شريط التبويب الداخلي */}
      {items.length > 0 && (
        <div className="o-toggle-container p-tabs">
          <button className={'o-toggle-btn' + (tab === 'overview' ? ' active' : '')} onClick={() => setTab('overview')}>📋 نظرة عامة</button>
          <button className={'o-toggle-btn' + (tab === 'analytics' ? ' active' : '')} onClick={() => setTab('analytics')}>📈 التحليلات والمحاكاة</button>
        </div>
      )}

      {/* حالة المحفظة الفارغة */}
      {items.length === 0 && (
        <div className="p-empty-state">
          <div className="p-empty-icon">📂</div>
          <div>
            <div className="p-empty-title">محفظتك فارغة</div>
            <div className="p-empty-text">
              ابحث عن أسهم في الحقل أدناه وأضفها لتبدأ في تتبع توزيعاتك وحساب دخلك الشهري المتوقع.
            </div>
          </div>
          <div className="p-empty-cta">↓ ابحث عن سهم وأضفه أدناه</div>
        </div>
      )}

      {/* 🔮 لوحة ذكاء المحفظة والحرية المالية (مستشار الفارابي + خريطة الأهداف) */}
      {items.length > 0 && tab === 'overview' && (
        <PortfolioIntel advisorOutput={advisorOutput} milestones={lifestyleMilestones} />
      )}

      {/* قسم تتبع الهدف المالي للمستثمر */}
      {tab === 'overview' && (
        <GoalTracker goal={goal} setGoal={setGoal} monthlyAverage={monthlyAverage} weightedYield={weightedYield} />
      )}

      {/* قسم الرسوم البيانية التفاعلية للمحفظة */}
      {items.length > 0 && tab === 'analytics' && (
        <PortfolioCharts sectorData={sectorData} monthlyData={monthlyData} totalInvested={totalInvested} />
      )}

      {/* محاكي DRIP التفاعلي المتقدم */}
      {items.length > 0 && tab === 'analytics' && (
        <DripSimulator totalInvested={totalInvested} weightedYield={weightedYield} />
      )}

      {/* جدول إدارة المحفظة التفاعلي */}
      {tab === 'overview' && (<>
        <h2 className="sec"><span className="dot sec-dot-brand2" /> أصول المحفظة والحاسبة الآلية</h2>
        <AddStockControls stocks={stocks} isInPortfolio={isInPortfolio} addStock={addStock} />
        <HoldingsTable
          items={items}
          loading={loading}
          totalMarketValue={totalMarketValue}
          totalCost={totalCost}
          totalGain={totalGain}
          totalGainPct={totalGainPct}
          yieldOnCost={yieldOnCost}
          onOpen={onOpen}
          updateAmount={updateAmount}
          updateShares={updateShares}
          updateCost={updateCost}
          deleteStock={deleteStock}
        />
      </>)}
    </div>
  )
}
