import { useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Stock } from '../data'
import { useStocks, useMarketStats, usePortfolio } from '../store'
import { fmtAmount, parseYield, parseAmount } from '../format'
import Avatar from '../components/Avatar'

const PALETTE = ['#3aa0ff', '#7c5cff', '#21c98b', '#ffb020', '#ff5a72', '#36c5d8', '#e26bd0', '#9bd13a']

function StatCard({ n, l, sub, alert }: { n: React.ReactNode; l: string; sub?: string; alert?: boolean }) {
  return (
    <div className={'stat' + (alert ? ' alert' : '')}>
      <div className="n">{n}</div>
      <div className="l">{l}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

const SECTOR_MOVEMENTS = [
  {
    title: 'البنوك',
    stocks: [
      { name: 'الإمارات دبي الوطني', sym: 'EMIRATESNBD', price: '10.15', pct: '-0.49%', change: '-0.05', up: false },
      { name: 'بنك دبي الإسلامي', sym: 'DIB', price: '5.12', pct: '+0.39%', change: '+0.02', up: true },
      { name: 'بنك دبي التجاري', sym: 'CBD', price: '5.25', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف عجمان', sym: 'AJMANBANK', price: '1.50', pct: '-0.66%', change: '-0.01', up: false },
      { name: 'جي اف اتش', sym: 'GFH', price: '0.29', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف السلام - السودان', sym: 'SALAMSUDAN', price: '1.10', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف السلام - البحرين', sym: 'SALAM_BAH', price: '0.90', pct: '-1.10%', change: '-0.01', up: false },
      { name: 'بنك المشرق', sym: 'MASHREQ', price: '202.00', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف الشارقة الإسلامي', sym: 'SIB', price: '1.85', pct: '+0.54%', change: '+0.01', up: true },
      { name: 'أملاك للتمويل', sym: 'AMLAK', price: '0.81', pct: '+2.53%', change: '+0.02', up: true },
      { name: 'دار التكافل', sym: 'DARTAKAFUL', price: '0.75', pct: '-1.32%', change: '-0.01', up: false },
      { name: 'تمويل', sym: 'TAMWEEL', price: '1.20', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'الاستثمار والخدمات المالية',
    stocks: [
      { name: 'دبي للاستثمار', sym: 'DIC', price: '2.20', pct: '+0.45%', change: '+0.01', up: true },
      { name: 'شعاع القابضة', sym: 'SHUAA', price: '0.95', pct: '-2.06%', change: '-0.02', up: false },
      { name: 'سوق دبي المالي', sym: 'DFM', price: '1.34', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'اكتتاب', sym: 'EKTTITAB', price: '0.25', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'المدينة', sym: 'ALMADINA', price: '0.45', pct: '+2.27%', change: '+0.01', up: true },
      { name: 'بيت التمويل الخليجي', sym: 'GFH2', price: '0.29', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'الخليجية للاستثمار', sym: 'GGICO', price: '0.35', pct: '-2.78%', change: '-0.01', up: false },
      { name: 'الصكوك الوطنية', sym: 'NATIONALBONDS', price: '1.00', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'دبي المالي', sym: 'DFM2', price: '1.34', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'الصناعة',
    stocks: [
      { name: 'الوطنية للأسمنت', sym: 'NCC', price: '2.50', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'الإسمنت الوطنية', sym: 'NCC2', price: '2.50', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أسمنت الوطنية', sym: 'NCC3', price: '2.50', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أسمنت الخليج', sym: 'GCEM', price: '0.70', pct: '-1.41%', change: '-0.01', up: false },
      { name: 'الجبس الوطنية', sym: 'NGR', price: '1.80', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أسمنت الاتحاد', sym: 'UCC', price: '1.15', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'العقارات',
    stocks: [
      { name: 'إعمار العقارية', sym: 'EMAAR', price: '8.28', pct: '+0.73%', change: '+0.06', up: true },
      { name: 'إعمار للتطوير', sym: 'EMAARDEV', price: '8.00', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'ديار للتطوير', sym: 'DEYAAR', price: '0.70', pct: '+0.57%', change: '+0.00', up: true },
      { name: 'الاتحاد العقارية', sym: 'UPP', price: '0.35', pct: '-2.78%', change: '-0.01', up: false },
      { name: 'دريك آند سكل', sym: 'DSI', price: '0.36', pct: '+1.41%', change: '+0.00', up: true },
      { name: 'منازل', sym: 'MANAZEL', price: '0.35', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'إشراق', sym: 'ESHRAQ', price: '0.40', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'النقل والشحن',
    stocks: [
      { name: 'العربية للطيران', sym: 'AIRARABIA', price: '2.45', pct: '+0.41%', change: '+0.01', up: true },
      { name: 'أرامكس', sym: 'ARAMEX', price: '2.30', pct: '-0.86%', change: '-0.02', up: false },
      { name: 'الخليج للملاحة', sym: 'GULFNAV', price: '5.92', pct: '-1.50%', change: '-0.09', up: false }
    ]
  },
  {
    title: 'الاتصالات',
    stocks: [
      { name: 'دو', sym: 'DU', price: '11.20', pct: '+0.45%', change: '+0.05', up: true }
    ]
  },
  {
    title: 'الخدمات',
    stocks: [
      { name: 'تبريد', sym: 'TABREED', price: '3.30', pct: '+0.61%', change: '+0.02', up: true },
      { name: 'غانم', sym: 'GHANIM', price: '1.50', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'الإمارات للمرطبات', sym: 'ERC', price: '3.20', pct: '-1.54%', change: '-0.05', up: false },
      { name: 'تيكوم', sym: 'TECOM', price: '3.30', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'بلدكو', sym: 'BALDCO', price: '1.10', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'سالك', sym: 'SALIK', price: '3.65', pct: '-0.54%', change: '-0.02', up: false }
    ]
  },
  {
    title: 'السلع',
    stocks: [
      { name: 'دي إكس بي', sym: 'DXB', price: '0.08', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'ماركة', sym: 'MARKA', price: '0.12', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'الرعاية الصحية والتعليم',
    stocks: [
      { name: 'أمانات القابضة', sym: 'AMANAT', price: '1.07', pct: '+0.94%', change: '+0.01', up: true },
      { name: 'تعليم', sym: 'TAALEEM', price: '3.50', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'التأمين',
    stocks: [
      { name: 'دبي الوطنية للتأمين', sym: 'DNIR', price: '4.20', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أمان', sym: 'AMAN', price: '0.50', pct: '-1.96%', change: '-0.01', up: false },
      { name: 'سلامة', sym: 'SALAMA', price: '0.45', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'دار التكافل', sym: 'DARTAKAFUL2', price: '0.75', pct: '-1.32%', change: '-0.01', up: false },
      { name: 'تكافل الإمارات', sym: 'TE', price: '0.35', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'الصقر للتأمين', sym: 'ASIC', price: '1.50', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'البحيرة للتأمين', sym: 'ABIC', price: '2.20', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أليانز', sym: 'ALLIANZ', price: '1.00', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'الأغذية',
    stocks: [
      { name: 'بلدنا', sym: 'BALADNA', price: '1.20', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أغذية', sym: 'AGTHIA', price: '5.50', pct: '+0.92%', change: '+0.05', up: true }
    ]
  },
  {
    title: 'الشركات الأجنبية',
    stocks: [
      { name: 'أوراسكوم', sym: 'ORASCOM', price: '3.50', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'إشراق', sym: 'ESHRAQ2', price: '0.40', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف السلام - السودان', sym: 'SALAMSUDAN2', price: '1.10', pct: '0.00%', change: '+0.00', flat: true }
    ]
  }
]

const ADX_MOVEMENTS = [
  { name: 'بنك أبوظبي الأول', sym: 'FAB', price: '14.50', change: '-0.15', pct: '-1.02%', up: false },
  { name: 'بنك أبوظبي التجاري', sym: 'ADCB', price: '8.92', change: '+0.02', pct: '+0.22%', up: true },
  { name: 'مصرف أبوظبي الإسلامي', sym: 'ADIB', price: '11.50', change: '+0.10', pct: '+0.88%', up: true },
  { name: 'الدار العقارية', sym: 'ALDAR', price: '7.80', change: '+0.05', pct: '+0.64%', up: true },
  { name: 'أبوظبي الوطنية للطاقة', sym: 'TAQA', price: '3.25', change: '-0.01', pct: '-0.31%', up: false },
  { name: 'أدنوك للغاز', sym: 'ADNOCGAS', price: '3.31', change: '+0.01', pct: '+0.30%', up: true },
  { name: 'أدنوك للتوزيع', sym: 'ADNOCDIST', price: '3.88', change: '-0.02', pct: '-0.51%', up: false },
  { name: 'أدنوك للحفر', sym: 'ADNOCDRILL', price: '4.80', change: '+0.03', pct: '+0.63%', up: true },
  { name: 'برجيل القابضة', sym: 'BURJEEL', price: '2.50', change: '+0.00', pct: '+0.00%', flat: true },
  { name: 'الشركة العالمية القابضة', sym: 'IHC', price: '414.00', change: '+1.50', pct: '+0.36%', up: true },
]

interface MovementStock {
  name: string
  sym: string
  price: string
  change: string
  pct: string
  up?: boolean
  flat?: boolean
}

function getDailyData(s: Stock) {
  const symbol = s.sym.toUpperCase()
  const price = s.price ?? 1.0
  
  // Deterministic seed from symbol string
  let seed = 0
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i)
  }
  
  // Pseudo-random numbers using seed
  const rand = (max: number, min = 0) => {
    const x = Math.sin(seed++) * 10000
    return min + (x - Math.floor(x)) * (max - min)
  }

  let change: number
  let pct: string
  let isUp: boolean
  let isFlat: boolean
  
  // Find in DFM
  let found: MovementStock | null = null
  for (const sec of SECTOR_MOVEMENTS) {
    const f = sec.stocks.find(st => st.sym.toUpperCase() === symbol)
    if (f) { found = f; break; }
  }
  
  // Find in ADX
  if (!found) {
    found = ADX_MOVEMENTS.find(st => st.sym.toUpperCase() === symbol) as MovementStock | undefined ?? null
  }

  if (found) {
    change = parseFloat(found.change)
    pct = found.pct
    isUp = parseFloat(found.change) > 0
    isFlat = parseFloat(found.change) === 0
  } else {
    // Generate stable mock values
    const changePct = rand(3.5, -3.5) // -3.5% to +3.5%
    change = Math.round((price * (changePct / 100)) * 100) / 100
    pct = `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
    isUp = change > 0
    isFlat = change === 0
  }

  const prevClose = price - change
  const high = Math.max(price, prevClose) * (1 + rand(0.012, 0.001))
  const low = Math.min(price, prevClose) * (1 - rand(0.012, 0.001))
  const open = prevClose * (1 + rand(0.004, -0.004))

  const rawMcap = parseAmount(s.mcap) ?? 5e9
  const mcapVal = rawMcap > 1e6 ? rawMcap / 1e9 : rawMcap
  const volume = Math.round((mcapVal * 150000) * rand(2.2, 0.1))
  const value = volume * price
  const trades = Math.round(volume * rand(0.00005, 0.00001)) + 3

  return {
    change,
    pct,
    volume,
    value,
    trades,
    prevClose,
    open,
    high,
    low,
    isUp,
    isFlat,
    isDown: !isUp && !isFlat
  }
}

export default function Overview({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA, lastUpdated } = useStocks()
  const {
    stats,
    alertRows,
    marketGiants,
    valuationOpportunities,
    yieldLeaders,
    sectorData,
    monthData,
    maxYield,
    maxMcap
  } = useMarketStats()
  const { isInPortfolio } = usePortfolio()
  
  // التحكم بنوع خريطة السوق الحرارية
  const [heatmapMetric, setHeatmapMetric] = useState<'yield' | 'pe' | 'mcap'>('yield')
  // التحكم بتبويب حركة السوق (دبي / أبوظبي)
  const [marketTab, setMarketTab] = useState<'dubai' | 'adx'>('dubai')
  // التحكم بالقوائم الموسعة للقطاعات
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({ 'البنوك': true })

  const toggleSector = (title: string) => {
    setExpandedSectors(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  return (
    <div className="view">
      <style>{`
        .overview-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          width: 100%;
        }
        .overview-main {
          flex: 1;
          min-width: 0;
        }
        .overview-sidebar {
          width: 320px;
          flex: 0 0 320px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 24px;
        }
        .o-widget {
          background: var(--panel);
          backdrop-filter: blur(8px);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: var(--shadow);
        }
        .o-widget-h {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 12px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--txt);
        }
        .o-index-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed var(--line);
          font-size: 12.5px;
        }
        .o-index-item:last-child {
          border-bottom: 0;
        }
        .o-news-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 0;
          border-bottom: 1px dashed var(--line);
        }
        .o-news-item:last-child {
          border-bottom: 0;
        }
        .o-news-title {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--txt);
          line-height: 1.4;
          text-align: right;
        }
        .o-news-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: var(--muted2);
        }
        .o-lead-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .o-lead-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          background: var(--chip);
          border: 1px solid var(--line);
          cursor: pointer;
          transition: border-color 0.15s, transform 0.12s;
        }
        .o-lead-item:hover {
          border-color: var(--brand);
          transform: translateY(-2px);
        }
        .o-lead-right {
          margin-inline-start: auto;
          text-align: left;
          font-weight: 700;
        }
        .o-badge-good {
          color: var(--good);
          background: rgba(33, 201, 139, 0.1);
          border: 1px solid rgba(33, 201, 139, 0.3);
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 6px;
        }
        .o-badge-brand {
          color: var(--brand);
          background: rgba(58, 160, 255, 0.1);
          border: 1px solid rgba(58, 160, 255, 0.3);
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 6px;
        }
        .o-badge-warn {
          color: var(--warn);
          background: rgba(255, 176, 32, 0.1);
          border: 1px solid rgba(255, 176, 32, 0.3);
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 6px;
        }
        .o-toggle-container {
          display: inline-flex;
          gap: 6px;
          background: var(--chip);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--line);
        }
        .o-toggle-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-family: inherit;
          font-size: 12.5px;
          padding: 6px 12px;
          border-radius: 8px;
          transition: 0.15s;
        }
        .o-toggle-btn.active {
          background: linear-gradient(120deg, var(--brand), var(--brand2));
          color: #fff;
        }
        @media (max-width: 1100px) {
          .overview-layout {
            flex-direction: column;
          }
          .overview-sidebar {
            width: 100%;
            flex: none;
            position: static;
          }
        }
      `}</style>

      <div className="page-head">
        <h1>نظرة عامة على الأسهم والأسواق</h1>
        <p>
          لوحة معلوماتية مالية شاملة لـ {DATA.length} سهمًا مدرجاً في سوق دبي المالي وسوق أبوظبي للأوراق المالية
          {lastUpdated && (
            <span className="updated"> · آخر تحديث للأسعار: {new Date(lastUpdated).toLocaleString('ar-AE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          )}
        </p>
      </div>

      <div className="overview-layout">
        {/* العمود الأيمن الرئيسي (المحتوى التفاعلي والبياني 70%) */}
        <div className="overview-main">
          {/* بطاقات الإحصائيات الشاملة */}
          <div className="stats">
            <StatCard n={DATA.length} l="الأسهم المتابَعة" sub={`${stats.dfm} في دبي · ${stats.adx} في أبوظبي`} />
            <StatCard n={fmtAmount(stats.totalMcap)} l="إجمالي القيمة السوقية" sub={`${stats.mcapCount} أسهم مغطّاة`} />
            <StatCard n={`${stats.avgYield.toFixed(1)}%`} l="متوسط العائد النقدي للسوق" sub="للأسهم المعلنة فقط" />
            <StatCard n={stats.avgPe.toFixed(1)} l="متوسط مكرر الربحية (P/E)" sub="للشركات ذات الربحية الموجبة" />
          </div>

          {/* قسم التحليل والرسوم البيانية الهيكلية */}
          <div className="chart-grid">
            {/* توزيع القطاعات */}
            <div className="panel">
              <h3 className="panel-h">توزيع هيكل السوق حسب القطاعات</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {sectorData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--panel-solid)" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tipStyle} formatter={(val, name) => [`${val} شركات مدرجة`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {sectorData.map((d, i) => (
                  <span key={d.name} className="legend-item">
                    <i style={{ background: PALETTE[i % PALETTE.length] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            {/* توزيع كثافة التواريخ والأحداث */}
            <div className="panel">
              <h3 className="panel-h">كثافة أحداث وتواريخ التوزيعات شهرياً</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthData} margin={{ top: 18 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="m" tick={{ fill: 'var(--muted)', fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={tipStyle} formatter={(val) => [`${val} حدث مالي متوقع`, 'التواريخ']} />
                  <Bar dataKey="count" fill="#7c5cff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* قسم متصدري السوق والفرص (المصفوفة الثلاثية الأنيقة) */}
          <h2 className="sec"><span className="dot" style={{ background: 'var(--brand)' }} /> قادة السوق وأفضل فرص الاستثمار</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', margin: '14px 0 34px' }}>
            
            {/* 1. عمالقة السوق */}
            <div className="panel">
              <h3 className="panel-h">👑 عمالقة السوق (حجم الشركة)</h3>
              <div className="o-lead-list">
                {marketGiants.map(({ s }) => (
                  <div key={s.sym} className="o-lead-item" onClick={() => onOpen(s)}>
                    <Avatar sym={s.sym} size={28} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {s.name.split('—')[0]}
                        {isInPortfolio(s.sym) && <span title="في محفظتك" style={{ fontSize: '11px' }}>💼</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {s.sym} <span className="exch">{s.ex}</span>
                      </div>
                    </div>
                    <div className="o-lead-right">
                      <span className="o-badge-brand">{s.mcap}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. فرص تقييم جاذبة */}
            <div className="panel">
              <h3 className="panel-h">💎 قيم جاذبة (مكرر ربحية منخفض)</h3>
              <div className="o-lead-list">
                {valuationOpportunities.map((s) => (
                  <div key={s.sym} className="o-lead-item" onClick={() => onOpen(s)}>
                    <Avatar sym={s.sym} size={28} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {s.name.split('—')[0]}
                        {isInPortfolio(s.sym) && <span title="في محفظتك" style={{ fontSize: '11px' }}>💼</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {s.sym} <span className="exch">{s.ex}</span>
                      </div>
                    </div>
                    <div className="o-lead-right">
                      <span className="o-badge-warn">P/E {s.pe?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. قادة عوائد التوزيعات */}
            <div className="panel">
              <h3 className="panel-h">💰 قادة عوائد التوزيعات النقدية</h3>
              <div className="o-lead-list">
                {yieldLeaders.map(({ s }) => (
                  <div key={s.sym} className="o-lead-item" onClick={() => onOpen(s)}>
                    <Avatar sym={s.sym} size={28} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {s.name.split('—')[0]}
                        {isInPortfolio(s.sym) && <span title="في محفظتك" style={{ fontSize: '11px' }}>💼</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {s.sym} <span className="exch">{s.ex}</span>
                      </div>
                    </div>
                    <div className="o-lead-right">
                      <span className="o-badge-good">{s.div.yld}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* خريطة السوق الحرارية التفاعلية الفاخرة */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 14px' }}>
            <h2 className="sec" style={{ margin: 0 }}>
              <span className="dot" style={{ background: 'var(--brand2)' }} /> خريطة السوق الحرارية التفاعلية
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

          <div className="heatmap" style={{ marginBottom: '30px' }}>
            {DATA.map((s) => {
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
                  else cellBg = 'rgba(255, 90, 114, 0.65)' // مكرر متضخم ومخالف (أحمر ناعم)
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
                  style={{ background: cellBg, border: '1px solid var(--line)', padding: '14px 8px' }}
                  title={titleText}
                >
                  <span className="heat-sym">{s.sym}</span>
                  <span className="heat-y" style={{ fontSize: '11px', fontWeight: 600 }}>{labelText}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* العمود الأيسر الجانبي (المعلومات المحلّية الرديفة 30%) */}
        <div className="overview-sidebar">
          
          {/* 1. لوحة قطاعات وأسعار الشركات (مطابقة تماماً للصورة) */}
          <div className="o-widget">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '8px', marginBottom: '12px' }}>
              <h4 className="o-widget-h" style={{ margin: 0, border: 0, padding: 0 }}>📊 أسعار الشركات</h4>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--chip)', padding: '2.5px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <button 
                  onClick={() => setMarketTab('dubai')} 
                  style={{
                    border: 0,
                    background: marketTab === 'dubai' ? 'linear-gradient(120deg, var(--brand), var(--brand2))' : 'transparent',
                    color: marketTab === 'dubai' ? '#fff' : 'var(--muted)',
                    fontSize: '11px',
                    padding: '3px 9px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                >
                  دبي (القطاعات)
                </button>
                <button 
                  onClick={() => setMarketTab('adx')} 
                  style={{
                    border: 0,
                    background: marketTab === 'adx' ? 'linear-gradient(120deg, var(--brand), var(--brand2))' : 'transparent',
                    color: marketTab === 'adx' ? '#fff' : 'var(--muted)',
                    fontSize: '11px',
                    padding: '3px 9px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                >
                  أبوظبي
                </button>
              </div>
            </div>
            
            {marketTab === 'dubai' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '440px', overflowY: 'auto', paddingRight: '2px' }}>
                {SECTOR_MOVEMENTS.map((sec) => {
                  const isExpanded = !!expandedSectors[sec.title]
                  return (
                    <div key={sec.title} style={{ border: '1px solid var(--line)', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                      <button 
                        onClick={() => toggleSector(sec.title)}
                        style={{
                          display: 'flex',
                          width: '100%',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: 'var(--chip)',
                          border: 0,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          color: 'var(--txt)',
                          fontWeight: 800,
                          fontSize: '12.5px',
                          textAlign: 'right'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--brand2)', fontSize: '8px' }}>🔸</span>
                          {sec.title}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>({sec.stocks.length} شركة)</span>
                          <span>{isExpanded ? '▲' : '▼'}</span>
                        </span>
                      </button>
                      
                      {isExpanded && (
                        <div style={{ padding: '4px 8px', background: 'transparent' }}>
                          <table style={{ minWidth: '100%', background: 'transparent', fontSize: '11.5px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <th style={{ padding: '4px', color: 'var(--muted)', textAlign: 'right', fontWeight: 700 }}>الاسم</th>
                                <th style={{ padding: '4px', color: 'var(--muted)', textAlign: 'center', fontWeight: 700 }}>السعر</th>
                                <th style={{ padding: '4px', color: 'var(--muted)', textAlign: 'left', fontWeight: 700 }}>التغير</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sec.stocks.map((m) => {
                                const realStock = DATA.find(s => s.sym.toUpperCase() === m.sym.replace(/\d+$/, '').toUpperCase() || s.name.toLowerCase().includes(m.name.toLowerCase()))
                                if (!realStock) return null
                                const d = getDailyData(realStock)
                                return (
                                  <tr 
                                    key={realStock.sym} 
                                    onClick={() => onOpen(realStock)}
                                    className="rowlink"
                                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', cursor: 'pointer' }}
                                  >
                                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                                      <span style={{ fontWeight: 700, display: 'block', color: 'var(--txt)', fontSize: '11.5px' }}>{realStock.name.split('—')[0]}</span>
                                      <span style={{ fontSize: '9.5px', color: 'var(--muted2)', fontWeight: 600 }}>{realStock.sym}</span>
                                    </td>
                                    <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700, color: 'var(--txt)' }}>
                                      {realStock.price !== null ? realStock.price.toFixed(2) : '—'}
                                    </td>
                                    <td style={{ 
                                      padding: '6px 4px', 
                                      textAlign: 'left', 
                                      fontWeight: 800,
                                      direction: 'ltr',
                                      color: d.isFlat ? 'var(--muted)' : d.isUp ? 'var(--good)' : 'var(--bad)',
                                      fontSize: '11px'
                                    }}>
                                      {d.pct}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <table style={{ minWidth: '100%', background: 'transparent', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <th style={{ padding: '6px 4px', color: 'var(--muted)', textAlign: 'right', fontWeight: 700 }}>الاسم</th>
                    <th style={{ padding: '6px 4px', color: 'var(--muted)', textAlign: 'center', fontWeight: 700 }}>السعر</th>
                    <th style={{ padding: '6px 4px', color: 'var(--muted)', textAlign: 'left', fontWeight: 700 }}>التغير</th>
                  </tr>
                </thead>
                <tbody>
                  {ADX_MOVEMENTS.map((m) => {
                    const realStock = DATA.find(s => s.sym.toUpperCase() === m.sym.toUpperCase())
                    if (!realStock) return null
                    const d = getDailyData(realStock)
                    return (
                      <tr 
                        key={realStock.sym} 
                        onClick={() => onOpen(realStock)}
                        className="rowlink"
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, display: 'block', color: 'var(--txt)' }}>{realStock.name.split('—')[0]}</span>
                          <span style={{ fontSize: '10px', color: 'var(--muted2)', fontWeight: 600 }}>{realStock.sym}</span>
                        </td>
                        <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, color: 'var(--txt)' }}>
                          {realStock.price !== null ? realStock.price.toFixed(2) : '—'}
                        </td>
                        <td style={{ 
                          padding: '7px 4px', 
                          textAlign: 'left', 
                          fontWeight: 800,
                          direction: 'ltr',
                          color: d.isFlat ? 'var(--muted)' : d.isUp ? 'var(--good)' : 'var(--bad)'
                        }}>
                          {d.pct}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 2. التنبيهات المباشرة القريبة (Mini Calendar) */}
          <div className="o-widget">
            <h4 className="o-widget-h">⏰ تنبيهات التواريخ القادمة</h4>
            {alertRows.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '10px 0' }}>لا توجد تواريخ استحقاق قريبة حالياً.</div>
            ) : (
              alertRows.slice(0, 3).map(({ s, u }) => (
                <button 
                  key={s.sym} 
                  onClick={() => onOpen(s)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    background: 'var(--chip)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'right',
                    gap: '4px',
                    transition: 'all 0.12s ease'
                  }}
                  className="rowlink"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <Avatar sym={s.sym} size={22} />
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--txt)' }}>{s.sym}</span>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'var(--line)', marginInlineStart: 'auto' }}>{s.ex}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.3' }}>
                    {u.label} — {u.n === null ? 'التاريخ متوقع' : u.n === 0 ? 'اليوم' : `خلال ${u.n} يوم`}
                  </div>
                </button>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

const tipStyle = {
  background: 'var(--panel-solid)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  color: 'var(--txt)',
  fontSize: 13,
}
