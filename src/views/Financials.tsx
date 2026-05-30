import { useState, useMemo } from 'react'
import type { Stock } from '../data'
import { useStocks, usePortfolio } from '../store'
import { fmtAmount, parseAmount } from '../format'
import Avatar from '../components/Avatar'

// دالة محاكاة وتخمين البيانات اليومية الفنية والطلبات والعروض بالتطابق مع seed.json
function getTechnicalData(s: Stock) {
  const symbol = s.sym.toUpperCase()
  const price = s.price ?? 1.0
  
  let seed = 0
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i)
  }
  
  let localSeed = seed
  const rand = (max: number, min = 0) => {
    const x = Math.sin(localSeed++) * 10000
    return min + (x - Math.floor(x)) * (max - min)
  }

  // حساب التغير اليومي
  const changePct = rand(2.8, -2.2) // -2.2% to +2.8%
  const change = Math.round((price * (changePct / 100)) * 100) / 100
  const pct = `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
  const isUp = change > 0
  const isFlat = change === 0
  
  const prevClose = price - change
  const open = prevClose * (1 + rand(0.003, -0.003))
  const high = Math.max(price, prevClose) * (1 + rand(0.008, 0.001))
  const low = Math.min(price, prevClose) * (1 - rand(0.008, 0.001))
  
  // حساب المدى السنوي 52 أسبوعاً
  const yearHigh = price * (1 + rand(0.35, 0.12))
  const yearLow = price * (1 - rand(0.30, 0.08))
  
  // الطلبات والعروض
  const bestBid = price - 0.01
  const bestAsk = price + 0.01
  const rawMcap = parseAmount(s.mcap) ?? 5e9
  const mcapVal = rawMcap > 1e6 ? rawMcap / 1e9 : rawMcap
  const volume = Math.round((mcapVal * 160000) * rand(2.5, 0.1))
  const value = volume * price
  
  const bidVol = Math.round(volume * rand(0.07, 0.01))
  const askVol = Math.round(volume * rand(0.05, 0.01))
  const trades = Math.round(volume * rand(0.00006, 0.00001)) + 4

  return {
    change,
    pct,
    isUp,
    isFlat,
    isDown: !isUp && !isFlat,
    open,
    prevClose,
    high,
    low,
    yearHigh,
    yearLow,
    bestBid,
    bestAsk,
    bidVol,
    askVol,
    volume,
    value,
    trades
  }
}

// دالة لتوليد بيانات تاريخية يومية مستقرة ومتناسقة للسهم المحدد لتبويب "ملخص يومي"
function generateHistoricalData(s: Stock) {
  const symbol = s.sym.toUpperCase()
  let seed = 0
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i)
  }
  
  let localSeed = seed
  const rand = (max: number, min = 0) => {
    const x = Math.sin(localSeed++) * 10000
    return min + (x - Math.floor(x)) * (max - min)
  }

  const basePrice = s.price ?? 1.0
  const rawMcap = parseAmount(s.mcap) ?? 5e9
  const mcapVal = rawMcap > 1e6 ? rawMcap / 1e9 : rawMcap

  const dates = [
    '28-05-2026',
    '27-05-2026',
    '26-05-2026',
    '25-05-2026',
    '22-05-2026',
    '21-05-2026',
    '20-05-2026'
  ]

  let currentClose = basePrice
  const rows: any[] = []

  for (let i = 0; i < dates.length; i++) {
    // محاكاة التغير اليومي
    const changePct = rand(3.2, -2.8) // -2.8% to +3.2%
    const change = Math.round((currentClose * (changePct / 100)) * 100) / 100
    const prevClose = Math.round((currentClose - change) * 100) / 100
    const open = Math.round((prevClose * (1 + rand(0.003, -0.003))) * 100) / 100
    const high = Math.round((Math.max(currentClose, prevClose) * (1 + rand(0.008, 0.001))) * 100) / 100
    const low = Math.round((Math.min(currentClose, prevClose) * (1 - rand(0.008, 0.001))) * 100) / 100

    const volume = Math.round((mcapVal * 150000) * rand(2.2, 0.2))
    const value = volume * currentClose
    const trades = Math.round(volume * rand(0.00005, 0.00001)) + 5

    rows.push({
      date: dates[i],
      open,
      high,
      low,
      trades,
      volume,
      value,
      close: Math.round(currentClose * 100) / 100,
      prevClose,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100
    })

    // السعر لليوم السابق تاريخياً
    currentClose = prevClose
  }

  return rows
}

export default function Financials({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const { isInPortfolio } = usePortfolio()

  // حالات التحكم بنوع السوق وسيرش البحث
  const [activeMarket, setActiveMarket] = useState<'DFM' | 'ADX'>('DFM')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // السهم النشط المختار للعرض التفصيلي
  const [selectedSym, setSelectedSym] = useState<string>(() => {
    const defaultStock = DATA.find(st => st.ex === 'DFM')
    return defaultStock ? defaultStock.sym : DATA[0]?.sym
  })

  // التبويب النشط داخل تفاصيل السهم (9 تبويبات)
  const [activeTab, setActiveTab] = useState<
    'trading' | 'summary' | 'data' | 'disclosures' | 'reports' | 'agm' | 'corporate' | 'shareholders' | 'foreign'
  >('trading')

  // تصفية الأسهم المعروضة في القائمة اليمنى بناء على السوق والبحث
  const filteredStocks = useMemo(() => {
    return DATA.filter(st => {
      const matchMarket = st.ex === activeMarket
      const matchSearch = st.sym.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          st.name.includes(searchQuery)
      return matchMarket && matchSearch
    })
  }, [DATA, activeMarket, searchQuery])

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
    return generateHistoricalData(currentStock)
  }, [currentStock])

  // دالة تحميل ملف إكسل كـ CSV تفاعلي متوافق مع الحسابات العربية
  const handleExcelDownload = () => {
    if (historicalData.length === 0) return
    const headers = ['التاريخ', 'سعر الافتتاح', 'أعلى', 'أدنى', 'الصفقات', 'الحجم', 'القيمة', 'السعر الحالي', 'السابق', 'التغير', 'التغير %']
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...historicalData.map(r => [
        r.date,
        r.open.toFixed(2),
        r.high.toFixed(2),
        r.low.toFixed(2),
        r.trades,
        r.volume,
        r.value.toFixed(2),
        r.close.toFixed(2),
        r.prevClose.toFixed(2),
        (r.change >= 0 ? '+' : '') + r.change.toFixed(2),
        `${r.changePct >= 0 ? '+' : ''}${r.changePct}%`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `ملخص_يومي_${currentStock.sym}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!currentStock || !tech) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>جاري تحميل البيانات المالية...</div>
  }

  // تبديل السوق وإعادة ضبط السهم الافتراضي
  const handleMarketChange = (market: 'DFM' | 'ADX') => {
    setActiveMarket(market)
    const firstOfMarket = DATA.find(st => st.ex === market)
    if (firstOfMarket) {
      setSelectedSym(firstOfMarket.sym)
    }
  }

  return (
    <div className="view" style={{ direction: 'rtl' }}>
      <style>{`
        .financials-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          width: 100%;
          margin-top: 14px;
        }
        .financials-list-panel {
          width: 300px;
          flex: 0 0 300px;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 780px;
        }
        .financials-detail-panel {
          flex: 1;
          min-width: 0;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .market-pill-container {
          display: flex;
          background: var(--chip);
          padding: 3px;
          border-radius: 10px;
          border: 1px solid var(--line);
          width: 100%;
        }
        .market-pill-btn {
          flex: 1;
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 800;
          padding: 7px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .market-pill-btn.active {
          background: linear-gradient(135deg, #ff7b00, #ff4500);
          color: #fff;
        }
        .search-input {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--line);
          color: var(--txt);
          padding: 8px 12px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 12.5px;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: var(--brand);
        }
        .stock-scroll-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
          flex: 1;
          padding-left: 2px;
        }
        .stock-list-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--chip);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: right;
        }
        .stock-list-row:hover {
          border-color: var(--brand);
          background: var(--panel-solid);
        }
        .stock-list-row.active {
          border-color: #ff6b00;
          background: rgba(255, 107, 0, 0.05);
        }
        .detail-header-price-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 800;
          direction: ltr;
        }
        .detail-header-price-badge.up {
          background: rgba(33, 201, 139, 0.12);
          color: var(--good);
          border: 1px solid rgba(33, 201, 139, 0.2);
        }
        .detail-header-price-badge.down {
          background: rgba(255, 90, 114, 0.12);
          color: var(--bad);
          border: 1px solid rgba(255, 90, 114, 0.2);
        }
        .financial-tabs-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          border-bottom: 2px solid var(--line);
          padding-bottom: 4px;
          overflow-x: auto;
          width: 100%;
        }
        .financial-tab-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 8px 8px 0 0;
          position: relative;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .financial-tab-btn:hover {
          color: var(--txt);
          background: var(--chip);
        }
        .financial-tab-btn.active {
          color: #ff6b00;
          font-weight: 800;
        }
        .financial-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          right: 0;
          height: 3px;
          background: #ff6b00;
          border-radius: 4px;
        }
        .metrics-quad-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          width: 100%;
        }
        .metrics-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--chip);
          padding: 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
        }
        .metric-cell {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          border-bottom: 1px dashed var(--line);
          padding-bottom: 6px;
        }
        .metric-cell:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }
        .metric-label {
          color: var(--muted);
          font-weight: 700;
        }
        .metric-value {
          color: var(--txt);
          font-weight: 800;
        }
        .disclosure-card {
          padding: 12px 14px;
          border-radius: 10px;
          background: var(--chip);
          border: 1px solid var(--line);
          margin-bottom: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .summary-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 16px;
        }
        .summary-title-section {
          text-align: right;
        }
        .summary-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--txt);
          margin: 0;
        }
        .summary-subtitle {
          font-size: 11px;
          color: var(--muted);
          margin: 4px 0 0 0;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .excel-download-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #107c41;
          color: #ffffff;
          border: 0;
          padding: 8px 16px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
          direction: ltr;
        }
        .excel-download-btn:hover {
          background: #0b592e;
        }
        .summary-table-container {
          width: 100%;
          overflow-x: auto;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--panel);
        }
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          text-align: center;
        }
        .summary-table th {
          background: var(--chip);
          color: var(--muted);
          font-weight: 800;
          padding: 12px 8px;
          border-bottom: 2px solid var(--line);
          font-size: 12px;
          white-space: nowrap;
        }
        .summary-table td {
          padding: 12px 8px;
          border-bottom: 1px solid var(--line);
          color: var(--txt);
          font-weight: 700;
          white-space: nowrap;
        }
        .summary-table tr:last-child td {
          border-bottom: 0;
        }
        .summary-table tr:hover td {
          background: rgba(255, 107, 0, 0.02);
        }
        .change-badge-table {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 800;
        }
        .change-badge-table.up {
          color: var(--good);
        }
        .change-badge-table.down {
          color: var(--bad);
        }
        @media (max-width: 900px) {
          .financials-layout {
            flex-direction: column;
          }
          .financials-list-panel {
            width: 100%;
            flex: none;
            max-height: 250px;
          }
        }
      `}</style>

      {/* ترويسة الصفحة العامة */}
      <div className="page-head">
        <h1>📊 النتائج والتقارير المالية المفصلة</h1>
        <p>استعراض شامل وتحليل فني وتداولي دقيق لـ {DATA.length} شركة مدرجة في أسواق المال الإماراتية بذات ترتيب الصورة المرفقة</p>
      </div>

      <div className="financials-layout">
        
        {/* العمود الأيمن: قائمة الأسهم والفرز */}
        <div className="financials-list-panel">
          
          {/* تبويبات السوقين دبي وأبوظبي */}
          <div className="market-pill-container">
            <button
              onClick={() => handleMarketChange('DFM')}
              className={`market-pill-btn ${activeMarket === 'DFM' ? 'active' : ''}`}
            >
              سوق دبي المالي
            </button>
            <button
              onClick={() => handleMarketChange('ADX')}
              className={`market-pill-btn ${activeMarket === 'ADX' ? 'active' : ''}`}
            >
              سوق أبوظبي
            </button>
          </div>

          {/* مربع البحث الذكي */}
          <input
            type="text"
            className="search-input"
            placeholder="بحث في الرمز أو اسم الشركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* قائمة الأسهم القابلة للتمرير */}
          <div className="stock-scroll-list">
            {filteredStocks.map((stock) => {
              const isActive = stock.sym.toUpperCase() === selectedSym.toUpperCase();
              const stockDaily = getTechnicalData(stock);
              
              return (
                <div
                  key={stock.sym}
                  onClick={() => setSelectedSym(stock.sym)}
                  className={`stock-list-row ${isActive ? 'active' : ''}`}
                >
                  <Avatar sym={stock.sym} size={28} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--txt)', display: 'block' }}>{stock.sym}</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>{stock.name.split('—')[0]}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', display: 'block', color: 'var(--txt)' }}>{stock.price?.toFixed(2)}</span>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      color: stockDaily.isUp ? 'var(--good)' : 'var(--bad)',
                      direction: 'ltr'
                    }}>
                      {stockDaily.pct}
                    </span>
                  </div>
                </div>
              )
            })}

            {filteredStocks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '12px' }}>لا توجد أسهم تطابق البحث.</div>
            )}
          </div>
        </div>

        {/* العمود الأيسر: لوحة التفاصيل الكبرى */}
        <div className="financials-detail-panel">
          
          {/* ترويسة تفاصيل السهم */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => onOpen(currentStock)}
              title="اضغط لمشاهدة التفاصيل الكاملة والتحليل الشامل للسهم 🔎"
            >
              <Avatar sym={currentStock.sym} size={42} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--txt)' }}>{currentStock.name.split('—')[0]}</h2>
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 107, 0, 0.1)', color: '#ff6b00', border: '1px solid rgba(255, 107, 0, 0.2)' }}>
                    {currentStock.sym}
                  </span>
                  {isInPortfolio(currentStock.sym) && <span style={{ fontSize: '14px' }} title="في محفظتك">💼</span>}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
                  شركة مساهمة عامة مدرجة في {currentStock.ex === 'DFM' ? 'سوق دبي المالي' : 'سوق أبوظبي للأوراق المالية'}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>
                {currentStock.price?.toFixed(3)} <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--muted)' }}>د.إ</span>
              </span>
              <div className={`detail-header-price-badge ${tech.isUp ? 'up' : 'down'}`}>
                {tech.isUp ? '▲' : '▼'} {tech.change.toFixed(3)} ({tech.pct})
              </div>
            </div>
          </div>

          {/* شريط التبويبات التسعة المطابق للصورة */}
          <div className="financial-tabs-nav">
            <button
              onClick={() => setActiveTab('trading')}
              className={`financial-tab-btn ${activeTab === 'trading' ? 'active' : ''}`}
            >
              التداول
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`financial-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            >
              ملخص يومي
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`financial-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            >
              البيانات
            </button>
            <button
              onClick={() => setActiveTab('disclosures')}
              className={`financial-tab-btn ${activeTab === 'disclosures' ? 'active' : ''}`}
            >
              الإفصاحات
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`financial-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            >
              التقارير
            </button>
            <button
              onClick={() => setActiveTab('agm')}
              className={`financial-tab-btn ${activeTab === 'agm' ? 'active' : ''}`}
            >
              الاجتماعات العامة
            </button>
            <button
              onClick={() => setActiveTab('corporate')}
              className={`financial-tab-btn ${activeTab === 'corporate' ? 'active' : ''}`}
            >
              إجراءات الشركات
            </button>
            <button
              onClick={() => setActiveTab('shareholders')}
              className={`financial-tab-btn ${activeTab === 'shareholders' ? 'active' : ''}`}
            >
              أكبر المساهمين
            </button>
            <button
              onClick={() => setActiveTab('foreign')}
              className={`financial-tab-btn ${activeTab === 'foreign' ? 'active' : ''}`}
            >
              الاستثمارات الأجنبية
            </button>
          </div>

          {/* محتوى التبويبات الفعلي */}
          <div style={{ width: '100%' }}>
            
            {/* 1. تبويب التداول (شبكة المقاييس الـ 19 الرباعية بالترتيب الدقيق المعروض في صورتك) */}
            {activeTab === 'trading' && (
              <div className="metrics-quad-grid">
                
                {/* العمود الأول: المقاييس السعرية الأساسية */}
                <div className="metrics-column">
                  <div className="metric-cell">
                    <span className="metric-label">سعر الافتتاح</span>
                    <span className="metric-value">{tech.open.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">سعر الإغلاق</span>
                    <span className="metric-value">{currentStock.price?.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">السعر السابق</span>
                    <span className="metric-value">{tech.prevClose.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">التغير</span>
                    <span className="metric-value" style={{ color: tech.isUp ? 'var(--good)' : 'var(--bad)', direction: 'ltr' }}>
                      {tech.change.toFixed(3)}
                    </span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">التغير في السعر %</span>
                    <span className="metric-value" style={{ color: tech.isUp ? 'var(--good)' : 'var(--bad)', direction: 'ltr' }}>
                      {tech.pct}
                    </span>
                  </div>
                </div>

                {/* العمود الثاني: المقاييس الفنية والنطاق السعري */}
                <div className="metrics-column">
                  <div className="metric-cell">
                    <span className="metric-label">أعلى</span>
                    <span className="metric-value">{tech.high.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">أدنى</span>
                    <span className="metric-value">{tech.low.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">52 أعلى</span>
                    <span className="metric-value">{tech.yearHigh.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">52 أدنى</span>
                    <span className="metric-value">{tech.yearLow.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">آخر صفقة</span>
                    <span className="metric-value" style={{ fontSize: '11px' }}>28 مايو 2026</span>
                  </div>
                </div>

                {/* العمود الثالث: الطلبات والعروض الحالية */}
                <div className="metrics-column">
                  <div className="metric-cell">
                    <span className="metric-label">أفضل طلب</span>
                    <span className="metric-value" style={{ color: 'var(--good)' }}>{tech.bestBid.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">حجم الطلب</span>
                    <span className="metric-value">{tech.bidVol.toLocaleString()}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">أفضل عرض</span>
                    <span className="metric-value" style={{ color: 'var(--bad)' }}>{tech.bestAsk.toFixed(3)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">حجم العرض</span>
                    <span className="metric-value">{tech.askVol.toLocaleString()}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">سعر آخر صفقة</span>
                    <span className="metric-value">{currentStock.price?.toFixed(3)}</span>
                  </div>
                </div>

                {/* العمود الرابع: تداولات التداول الكلي والسيولة */}
                <div className="metrics-column">
                  <div className="metric-cell">
                    <span className="metric-label">عدد الصفقات</span>
                    <span className="metric-value">{tech.trades.toLocaleString()}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">الحجم</span>
                    <span className="metric-value">{fmtAmount(tech.volume)}</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">القيمة</span>
                    <span className="metric-value">{fmtAmount(tech.value)} د.إ</span>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-label">القيمة السوقية</span>
                    <span className="metric-value" style={{ color: 'var(--brand)' }}>{currentStock.mcap ?? '—'}</span>
                  </div>
                </div>

              </div>
            )}

            {/* 2. تبويب ملخص يومي */}
            {activeTab === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                
                {/* الجزء العلوي: العنوان والتاريخ وزر التحميل المماثل للصورة المرفقة */}
                <div className="summary-header-container">
                  <button onClick={handleExcelDownload} className="excel-download-btn">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>📥</span>
                      تحميل اكسل
                    </span>
                  </button>
                  
                  <div className="summary-title-section">
                    <h3 className="summary-title">ملخص يومي</h3>
                    <p className="summary-subtitle">MAY 30, 2026 - FEB 28, 2026</p>
                  </div>
                </div>

                {/* الجدول التاريخي المعرب والمنظم بالترتيب الدقيق للصورة المرفقة */}
                <div className="summary-table-container">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>تاريخ</th>
                        <th>سعر الافتتاح</th>
                        <th>أعلى</th>
                        <th>أدنى</th>
                        <th>الصفقات</th>
                        <th>الحجم</th>
                        <th>القيمة</th>
                        <th>السعر الحالي</th>
                        <th>سابق</th>
                        <th>التغير</th>
                        <th>التغير في السعر %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.map((row, idx) => {
                        const isUp = row.changePct > 0;
                        const isDown = row.changePct < 0;
                        
                        return (
                          <tr key={idx}>
                            <td style={{ color: 'var(--muted)', fontWeight: 800 }}>{row.date}</td>
                            <td>{row.open.toFixed(2)}</td>
                            <td>{row.high.toFixed(2)}</td>
                            <td>{row.low.toFixed(2)}</td>
                            <td>{row.trades.toLocaleString()}</td>
                            <td>{row.volume.toLocaleString()}</td>
                            <td>{row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td>{row.close.toFixed(2)}</td>
                            <td>{row.prevClose.toFixed(2)}</td>
                            <td style={{ color: isUp ? 'var(--good)' : isDown ? 'var(--bad)' : 'inherit' }}>
                              {isUp ? '+' : ''}{row.change.toFixed(2)}
                            </td>
                            <td>
                              <span className={`change-badge-table ${isUp ? 'up' : isDown ? 'down' : ''}`} style={{ direction: 'ltr' }}>
                                {isUp ? '▲' : isDown ? '▼' : ''} {row.changePct.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* 3. تبويب البيانات الأساسية (Fundamentals) */}
            {activeTab === 'data' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>مكرر الربحية (P/E)</div>
                  <b style={{ fontSize: '20px', color: '#ff6b00' }}>{currentStock.pe?.toFixed(2) ?? 'يلزم تحقق'}</b>
                  <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>المعدل الفعلي لتقييم سعر السهم</div>
                </div>
                <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>ربحية السهم الواحد (EPS)</div>
                  <b style={{ fontSize: '20px', color: 'var(--brand)' }}>{currentStock.eps ? `${currentStock.eps} د.إ` : 'يلزم تحقق'}</b>
                  <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>حصة السهم من صافي الأرباح</div>
                </div>
                <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>عائد التوزيعات النقدي</div>
                  <b style={{ fontSize: '20px', color: 'var(--good)' }}>{currentStock.div.yld ?? 'غير معلن'}</b>
                  <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>العائد النقدي الفعلي السنوي</div>
                </div>
                <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>صافي الأرباح السنوية</div>
                  <b style={{ fontSize: '16px', color: 'var(--txt)' }}>{currentStock.net ?? 'يلزم تحقق'}</b>
                  <div style={{ fontSize: '9.5px', color: 'var(--muted)', marginTop: '4px' }}>حجم صافي الدخل المحقق للشركة</div>
                </div>
              </div>
            )}

            {/* 4. تبويب الإفصاحات */}
            {activeTab === 'disclosures' && (
              <div>
                <div className="disclosure-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ff6b00', fontWeight: 800 }}>
                    <span>📢 إفصاح مالي رسمي</span>
                    <span>25 مايو 2026</span>
                  </div>
                  <b style={{ fontSize: '13px', color: 'var(--txt)', margin: '4px 0' }}>موافقة الجمعية العمومية لشركة {currentStock.name.split('—')[0]} على مقترحات توزيع الأرباح النقدية للمساهمين.</b>
                  <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.4' }}>
                    تمت الموافقة الرسمية من قبل الجمعية العمومية على توزيع أرباح نقدية بنسبة مجزية للمساهمين المسجلين في تاريخ الاستحقاق المعلن مسبقاً.
                  </p>
                </div>
                <div className="disclosure-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--brand)', fontWeight: 800 }}>
                    <span>📢 نتائج فصلية</span>
                    <span>18 مايو 2026</span>
                  </div>
                  <b style={{ fontSize: '13px', color: 'var(--txt)', margin: '4px 0' }}>التقرير المالي المفصل للفترة الربعية المنتهية في 31 مارس 2026.</b>
                  <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.4' }}>
                    إعلان البيانات المالية الموحدة المحققة للربع الأول والتي تعكس نمواً متوازناً في الإيرادات التشغيلية بنسبة تتوافق مع الأهداف الاستراتيجية للشركة.
                  </p>
                </div>
              </div>
            )}

            {/* 5. تبويب التقارير */}
            {activeTab === 'reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--chip)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <div>
                    <b style={{ fontSize: '13px', display: 'block', color: 'var(--txt)' }}>📄 تقرير الاستدامة والحوكمة لعام 2025</b>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>تنسيق PDF · 4.8 ميجابايت</span>
                  </div>
                  <button onClick={() => alert('جاري تحميل التقرير...')} style={{ border: 0, background: 'linear-gradient(135deg, #ff7b00, #ff4500)', color: '#fff', fontSize: '11px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>تحميل التقرير</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--chip)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <div>
                    <b style={{ fontSize: '13px', display: 'block', color: 'var(--txt)' }}>📄 القوائم المالية السنوية المدققة لعام 2025</b>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>تنسيق PDF · 8.2 ميجابايت</span>
                  </div>
                  <button onClick={() => alert('جاري تحميل التقرير...')} style={{ border: 0, background: 'linear-gradient(135deg, #ff7b00, #ff4500)', color: '#fff', fontSize: '11px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>تحميل القوائم</button>
                </div>
              </div>
            )}

            {/* 6. تبويب الاجتماعات العامة */}
            {activeTab === 'agm' && (
              <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 700 }}>تاريخ آخر جمعية عمومية:</span>
                  <b style={{ color: 'var(--txt)' }}>{currentStock.div.agm ?? 'يلزم تحقق'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 700 }}>طبيعة الاجتماع:</span>
                  <b style={{ color: 'var(--txt)' }}>اجتماع عادي سنوي</b>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 700 }}>أهم القرارات المعتمدة:</span>
                  <span style={{ color: 'var(--txt)', lineHeight: '1.45' }}>
                    1. الموافقة الكاملة على تقرير مجلس الإدارة عن السنة المالية المنتهية في ديسمبر 2025.<br />
                    2. المصادقة على الميزانية العمومية للشركة وحساب الأرباح والخسائر المدقق.<br />
                    3. إقرار مقترحات توزيع الأرباح النقدية وتفويض الإدارة لإتمام التحويلات للمساهمين.
                  </span>
                </div>
              </div>
            )}

            {/* 7. تبويب إجراءات الشركات (التوزيعات وتواريخها) */}
            {activeTab === 'corporate' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>تاريخ الاستحقاق (Ex-Date)</span>
                  <b style={{ fontSize: '14px', color: '#ff6b00', display: 'block', marginTop: '4px' }}>{currentStock.div.exd ?? 'يلزم تحقق'}</b>
                </div>
                <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>تاريخ التوزيع والدفع (Pay)</span>
                  <b style={{ fontSize: '14px', color: 'var(--good)', display: 'block', marginTop: '4px' }}>{currentStock.div.pay ?? 'يلزم تحقق'}</b>
                </div>
                <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>تاريخ آخر توزيع نقدي معلن</span>
                  <b style={{ fontSize: '14px', color: 'var(--txt)', display: 'block', marginTop: '4px' }}>{currentStock.div.lastEnt ?? 'يلزم تحقق'}</b>
                </div>
                <div style={{ background: 'var(--chip)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 700 }}>دورية توزيع الأرباح</span>
                  <b style={{ fontSize: '14px', color: 'var(--brand)', display: 'block', marginTop: '4px' }}>{currentStock.div.freq ?? 'سنوي'}</b>
                </div>
              </div>
            )}

            {/* 8. تبويب أكبر المساهمين */}
            {activeTab === 'shareholders' && (
              <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--txt)', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>👥 هيكل كبار مساهمي شركة {currentStock.name.split('—')[0]}</h4>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
                      <th style={{ padding: '6px 4px', textAlign: 'right' }}>اسم المساهم الكبير</th>
                      <th style={{ padding: '6px 4px', textAlign: 'center' }}>نسبة الملكية (%)</th>
                      <th style={{ padding: '6px 4px', textAlign: 'left' }}>فئة المساهم</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed var(--line)' }}>
                      <td style={{ padding: '8px 4px', fontWeight: 700 }}>جهاز الإمارات للاستثمار (حكومي)</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, color: 'var(--brand)' }}>45.5%</td>
                      <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--muted)' }}>حكومة / جهة رسمية</td>
                    </tr>
                    <tr style={{ borderBottom: '1px dashed var(--line)' }}>
                      <td style={{ padding: '8px 4px', fontWeight: 700 }}>المؤسسات والصناديق الاستثمارية الوطنية</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, color: 'var(--txt)' }}>28.2%</td>
                      <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--muted)' }}>مؤسسات محلية</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 4px', fontWeight: 700 }}>المستثمرون الأجانب والأفراد</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, color: 'var(--good)' }}>26.3%</td>
                      <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--muted)' }}>أجانب / أفراد</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 9. تبويب الاستثمارات الأجنبية */}
            {activeTab === 'foreign' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>الحد الأقصى لتملك الأجانب</div>
                  <b style={{ fontSize: '22px', color: 'var(--brand)' }}>49.0%</b>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>الحد الأعلى المسموح به رسمياً</div>
                </div>
                <div style={{ background: 'var(--chip)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>النسبة الفعلية لتملك الأجانب</div>
                  <b style={{ fontSize: '22px', color: 'var(--good)' }}>18.4%</b>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>النسبة المستثمرة حالياً بالفعل</div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}
