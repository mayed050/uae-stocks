import { useState, useMemo } from 'react'
import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'

/** حقل البحث بقائمة منسدلة + قائمة الإضافة السريعة لأسهم غير موجودة في المحفظة. */
export default function AddStockControls({
  stocks,
  isInPortfolio,
  addStock,
}: {
  stocks: Stock[]
  isInPortfolio: (sym: string) => boolean
  addStock: (sym: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // تصفية نتائج البحث للأسهم المتاحة للإضافة
  const availableStocks = useMemo(() => {
    return stocks.filter(s =>
      !isInPortfolio(s.sym) &&
      (s.sym.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [stocks, searchQuery, isInPortfolio])

  return (
    <div className="controls">
      <div className="p-controls-row">
        <div className="p-search-container">
          <div className="search p-search-full">
            <span>🔍</span>
            <input
              placeholder="ابحث عن سهم لإضافته للمحفظة..."
              value={searchQuery}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true) }}
            />
          </div>
          {showDropdown && searchQuery && (
            <div className="p-dropdown">
              {availableStocks.length === 0 ? (
                <div className="p-dropdown-empty">لا توجد نتائج مطابقة أو تم إضافة السهم بالفعل.</div>
              ) : (
                availableStocks.map(s => (
                  <button key={s.sym} className="p-dropdown-item" onClick={() => { addStock(s.sym); setSearchQuery(''); setShowDropdown(false); }}>
                    <Avatar sym={s.sym} size={24} />
                    <span className="p-dropdown-sym">{s.sym}</span>
                    <span className="p-dropdown-name">{s.name}</span>
                    <span className="exch">{s.ex}</span>
                  </button>
                ))
              )}
            </div>
          )}
          {showDropdown && (
            <div
              className="p-dropdown-overlay"
              onClick={() => setShowDropdown(false)}
            />
          )}
        </div>
        {searchQuery === '' && availableStocks.length > 0 && (
          <select className="p-quick-add" onChange={(e) => { if(e.target.value !== '') { addStock(e.target.value); }; e.target.value = '' }}>
            <option value="">أضف سهماً سريعا من القائمة...</option>
            {availableStocks.map(s => (
              <option key={s.sym} value={s.sym}>{s.sym} — {s.name.split('—')[0]}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
