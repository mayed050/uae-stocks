import { useState, useMemo } from 'react'
import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'
import { getTechnicalData } from './tradingSim'

/** العمود الأيمن: تبويبا السوقين + البحث + قائمة الأسهم القابلة للتمرير. حالة السوق والبحث داخلية. */
export default function StockListPanel({
  stocks,
  selectedSym,
  onSelect,
}: {
  stocks: Stock[]
  selectedSym: string
  onSelect: (sym: string) => void
}) {
  const [activeMarket, setActiveMarket] = useState<'DFM' | 'ADX'>('DFM')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // تصفية الأسهم المعروضة بناءً على السوق والبحث
  const filteredStocks = useMemo(() => {
    return stocks.filter(st => {
      const matchMarket = st.ex === activeMarket
      const matchSearch = st.sym.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          st.name.includes(searchQuery)
      return matchMarket && matchSearch
    })
  }, [stocks, activeMarket, searchQuery])

  // تبديل السوق وإعادة ضبط السهم الافتراضي لأول سهم في السوق الجديد
  const handleMarketChange = (market: 'DFM' | 'ADX') => {
    setActiveMarket(market)
    const firstOfMarket = stocks.find(st => st.ex === market)
    if (firstOfMarket) {
      onSelect(firstOfMarket.sym)
    }
  }

  return (
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
          const isActive = stock.sym.toUpperCase() === selectedSym.toUpperCase()
          const stockDaily = getTechnicalData(stock)

          return (
            <div
              key={stock.sym}
              onClick={() => onSelect(stock.sym)}
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
  )
}
