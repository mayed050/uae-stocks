import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { Stock } from '@/data'
import { useStocks, usePortfolio, useFinancials, useHistory } from '@/store'
import PageHeader from '@/components/ui/PageHeader'
import { NoFinancials } from './parts'
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

const EMPTY: never[] = []

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

  // البيانات المالية التفصيلية (financials.json) وسجل أسعار الإغلاق — كلاهما يُجلب مرة ويُخزَّن
  const { fin, pending, failed } = useFinancials(currentStock?.sym ?? '')
  const { history } = useHistory()
  const hist = currentStock ? (history[currentStock.sym] ?? EMPTY) : EMPTY

  if (!currentStock) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>جاري تحميل البيانات المالية...</div>
  }

  return (
    <div className="view" style={{ direction: 'rtl' }}>
      {/* ترويسة الصفحة العامة */}
      <PageHeader title="النتائج والتقارير المالية المفصلة">
        القوائم والمؤشرات المالية لـ {DATA.length} شركة مدرجة — من TradingView، مع روابط الإفصاحات الرسمية في موقعَي السوقين
      </PageHeader>

      <div className="financials-layout">
        {/* العمود الأيمن: قائمة الأسهم والفرز */}
        <StockListPanel stocks={DATA} selectedSym={selectedSym} onSelect={setSelectedSym} />

        {/* العمود الأيسر: لوحة التفاصيل الكبرى */}
        <div className="financials-detail-panel">
          <StockDetailHeader
            stock={currentStock}
            inPortfolio={isInPortfolio(currentStock.sym)}
            onOpen={onOpen}
          />

          {/* شريط التبويبات المُجمَّعة (4 مجموعات) */}
          <div className="financial-tabs-nav">
            {(Object.keys(GROUP_LABELS) as TabGroup[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                aria-pressed={group === g}
                className={`financial-tab-btn ${group === g ? 'active' : ''}`}
              >
                {GROUP_LABELS[g]}
              </button>
            ))}
          </div>

          {/* محتوى التبويبات الفعلي */}
          <div style={{ width: '100%' }}>
            {group === 'overview' && <OverviewTabs stock={currentStock} fin={fin} history={hist} />}
            {group === 'financial' && (fin ? <FinancialDataTabs stock={currentStock} fin={fin} /> : <NoFinancials pending={pending} failed={failed} />)}
            {group === 'governance' && <GovernanceTabs stock={currentStock} fin={fin} />}
            {group === 'ownership' && <OwnershipTabs stock={currentStock} fin={fin} />}
          </div>
        </div>
      </div>
    </div>
  )
}
