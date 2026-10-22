import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { Stock } from '@/data'
import { useStocks, usePortfolio } from '@/store'
import SimBadge from '@/components/ui/SimBadge'
import PageHeader from '@/components/ui/PageHeader'
import { getTechnicalData, generateDailySessions } from './tradingSim'
import StockListPanel from './StockListPanel'
import StockDetailHeader from './StockDetailHeader'
import OverviewTabs from './OverviewTabs'
import FinancialDataTabs from './FinancialDataTabs'
import GovernanceTabs from './GovernanceTabs'
import OwnershipTabs from './OwnershipTabs'
import type { FinancialsTab } from '@/search'
import './financials.css'

// تجميع التبويبات التسعة في 4 مجموعات لتقليل الحمل الإدراكي
type TabGroup = FinancialsTab
const GROUP_LABELS: Record<TabGroup, string> = {
  overview: 'نظرة عامة',
  financial: 'البيانات والتقارير',
  governance: 'الإفصاحات والحوكمة',
  ownership: 'الملكية',
}

/** صفحة النتائج المالية — جذر تركيب: قائمة الأسهم يمينًا ولوحة التفاصيل بمجموعات تبويب يسارًا. */
export default function Financials({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const { isInPortfolio } = usePortfolio()

  // السهم المختار والمجموعة النشطة في الرابط (?sym=&tab=) — رابط مباشر لنتائج أي سهم
  const search = useSearch({ from: '/financials' })
  const navigate = useNavigate({ from: '/financials' })
  const selectedSym = search.sym ?? DATA.find(st => st.ex === 'DFM')?.sym ?? DATA[0]?.sym ?? ''
  const group: TabGroup = search.tab ?? 'overview'
  const setSelectedSym = (sym: string) => void navigate({ search: (prev) => ({ ...prev, sym }), replace: true })
  const setGroup = (tab: TabGroup) =>
    void navigate({ search: (prev) => ({ ...prev, tab: tab === 'overview' ? undefined : tab }), replace: true })

  // السهم المختار حالياً
  const currentStock = useMemo(() => {
    return DATA.find(st => st.sym.toUpperCase() === selectedSym.toUpperCase()) ?? DATA[0]
  }, [DATA, selectedSym])

  // البيانات اليومية الفنية للسهم المختار
  const tech = useMemo(() => {
    if (!currentStock) return null
    return getTechnicalData(currentStock)
  }, [currentStock])

  // البيانات التاريخية لتبويب ملخص يومي
  const historicalData = useMemo(() => {
    if (!currentStock) return []
    return generateDailySessions(currentStock)
  }, [currentStock])

  if (!currentStock || !tech) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>جاري تحميل البيانات المالية...</div>
  }

  return (
    <div className="view" style={{ direction: 'rtl' }}>
      {/* ترويسة الصفحة العامة */}
      <PageHeader title="النتائج والتقارير المالية المفصلة">
        استعراض شامل وتحليل فني وتداولي لـ {DATA.length} شركة مدرجة في أسواق المال الإماراتية
      </PageHeader>

      <div className="financials-layout">
        {/* العمود الأيمن: قائمة الأسهم والفرز */}
        <StockListPanel stocks={DATA} selectedSym={selectedSym} onSelect={setSelectedSym} />

        {/* العمود الأيسر: لوحة التفاصيل الكبرى */}
        <div className="financials-detail-panel">
          <StockDetailHeader
            stock={currentStock}
            tech={tech}
            inPortfolio={isInPortfolio(currentStock.sym)}
            onOpen={onOpen}
          />

          {/* شريط التبويبات المُجمَّعة (4 مجموعات) */}
          <div className="financial-tabs-nav">
            {(Object.keys(GROUP_LABELS) as TabGroup[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`financial-tab-btn ${group === g ? 'active' : ''}`}
              >
                {GROUP_LABELS[g]}
              </button>
            ))}
          </div>

          {/* محتوى التبويبات الفعلي */}
          <div style={{ width: '100%' }}>
            {(group === 'overview' || group === 'financial') && (
              <div style={{ marginBottom: '12px' }}>
                <SimBadge title="أرقام التداول والأحجام والمدى اليومي/السنوي في هذه المجموعة توضيحية مُولّدة خوارزمياً، وليست بيانات سوق رسمية لحظية.">أرقام التداول توضيحية</SimBadge>
              </div>
            )}

            {group === 'overview' && <OverviewTabs stock={currentStock} tech={tech} historicalData={historicalData} />}
            {group === 'financial' && <FinancialDataTabs stock={currentStock} />}
            {group === 'governance' && <GovernanceTabs stock={currentStock} />}
            {group === 'ownership' && <OwnershipTabs stock={currentStock} />}
          </div>
        </div>
      </div>
    </div>
  )
}
