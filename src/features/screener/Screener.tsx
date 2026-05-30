import { useMemo, useState } from 'react'
import { CAT_LABEL } from '@/data'
import type { Stock, Exchange, Category } from '@/data'
import { useStocks, usePortfolio } from '@/store'
import { parseYield, parseAmount } from '@/format'
import Avatar from '@/components/Avatar'
import { getDailyData } from '@/market'
import { cell } from '@/components/ui/cell'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'
import { SECTOR_TITLES, mapDFMSectorToDb } from '@/data/sectors'

type SortKey = 'name' | 'price' | 'pe' | 'yield' | 'mcap'

export default function Screener({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const { isInPortfolio, togglePortfolioStock } = usePortfolio()
  const [q, setQ] = useState('')
  const [ex, setEx] = useState<'all' | Exchange>('all')
  const [cat, setCat] = useState<'all' | Category>('all')
  const [sort, setSort] = useState<SortKey>('mcap')
  const [dir, setDir] = useState<1 | -1>(-1)
  const [sector, setSector] = useState<string>('all')
  
  // حفظ وتغيير وضع العرض المفضل للمستثمر
  const [displayMode, setDisplayMode] = useState<'list' | 'sectors'>(() => {
    const saved = localStorage.getItem('screener_display_mode')
    return (saved === 'list' || saved === 'sectors') ? saved : 'list'
  })

  const changeDisplayMode = (mode: 'list' | 'sectors') => {
    setDisplayMode(mode)
    localStorage.setItem('screener_display_mode', mode)
  }



  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = DATA.filter((s) => {
      if (ex !== 'all' && s.ex !== ex) return false
      if (cat !== 'all' && s.cat !== cat) return false
      if (sector !== 'all') {
        const allowedSectors = mapDFMSectorToDb(sector)
        if (!allowedSectors.includes(s.sector)) return false
      }
      if (term && !(s.name + ' ' + s.sym + ' ' + s.sector).toLowerCase().includes(term)) return false
      return true
    })
    const val = (s: Stock): number | string => {
      switch (sort) {
        case 'name': return s.name
        case 'price': return s.price ?? -1
        case 'pe': return s.pe ?? Number.MAX_SAFE_INTEGER
        case 'yield': return parseYield(s.div.yld) ?? -1
        case 'mcap': return parseAmount(s.mcap) ?? -1
      }
    }
    return [...list].sort((a, b) => {
      const av = val(a), bv = val(b)
      if (typeof av === 'string' || typeof bv === 'string')
        return String(av).localeCompare(String(bv), 'ar') * dir
      return (av - bv) * dir
    })
  }, [DATA, q, ex, cat, sector, sort, dir])

  const sectorGroups = useMemo(() => {
    const groups: { title: string; stocks: Stock[] }[] = []
    
    SECTOR_TITLES.forEach(title => {
      const allowedSectors = mapDFMSectorToDb(title)
      const sectorStocks = rows.filter(s => allowedSectors.includes(s.sector))
      if (sectorStocks.length > 0) {
        groups.push({ title, stocks: sectorStocks })
      }
    })

    const matchedSymbols = new Set(groups.flatMap(g => g.stocks.map(s => s.sym)))
    const unmatchedStocks = rows.filter(s => !matchedSymbols.has(s.sym))
    if (unmatchedStocks.length > 0) {
      groups.push({ title: 'قطاعات أخرى متنوعة', stocks: unmatchedStocks })
    }

    return groups
  }, [rows])

  function toggleSort(k: SortKey) {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1))
    else { setSort(k); setDir(k === 'name' ? 1 : -1) }
  }
  const arrow = (k: SortKey) => (sort === k ? (dir === 1 ? ' ▲' : ' ▼') : '')

  // ملخّص حيّ للنتائج المطابقة للفلتر الحالي (يتحدّث تلقائياً)
  const summary = useMemo(() => {
    const yields = rows.map((s) => parseYield(s.div.yld)).filter((x): x is number => x !== null)
    const avgYield = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : 0
    const dfm = rows.filter((s) => s.ex === 'DFM').length
    const adx = rows.filter((s) => s.ex === 'ADX').length
    const secMap = new Map<string, number>()
    rows.forEach((s) => secMap.set(s.sector, (secMap.get(s.sector) ?? 0) + 1))
    const topSectors = [...secMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    return { avgYield, dfm, adx, topSectors }
  }, [rows])
  const maxSectorCount = Math.max(1, ...summary.topSectors.map((s) => s.count))


  return (
    <div className="view">
      <PageHeader title="مستكشف الأسهم">
        عرض <b style={{ color: 'var(--brand)' }}>{rows.length}</b> من {DATA.length} سهمًا مطابقًا للفلتر — اضغط أي صف للتفاصيل الكاملة
      </PageHeader>

      <div className="overview-layout">
        {/* العمود الأيمن الرئيسي (الفلاتر والجدول 70%) */}
        <div className="overview-main">
          
          <div className="controls">
            <div className="search">
              <span>🔍</span>
              <input placeholder="ابحث بالاسم أو الرمز أو القطاع…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="chips">
              {([['all', 'كل الأسواق'], ['DFM', 'دبي'], ['ADX', 'أبوظبي']] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={ex === v} onClick={() => setEx(v)}>{l}</button>
              ))}
            </div>
            <div className="chips">
              {([['all', 'كل التصنيفات'], ['income', 'دخل مستقر'], ['growth', 'نمو'], ['risk', 'مخاطر أعلى']] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={cat === v} onClick={() => setCat(v)}>{l}</button>
              ))}
            </div>
            {sector !== 'all' && (
              <button className="chip" style={{ background: 'var(--bad)', color: '#fff', border: 0 }} onClick={() => setSector('all')}>
                إلغاء فلتر القطاع: {sector} ✕
              </button>
            )}
            
            {/* زر التبديل الفاخر لطريقة العرض */}
            <div className="o-toggle-container" style={{ marginInlineStart: 'auto', display: 'inline-flex', gap: '6px', background: 'var(--chip)', padding: '4px', borderRadius: '10px', border: '1px solid var(--line)' }}>
              <button 
                className={'o-toggle-btn' + (displayMode === 'list' ? ' active' : '')} 
                onClick={() => changeDisplayMode('list')}
                style={{
                  border: 0,
                  background: displayMode === 'list' ? 'linear-gradient(120deg, var(--brand), var(--brand2))' : 'transparent',
                  color: displayMode === 'list' ? '#fff' : 'var(--muted)',
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
              >
                📋 جدول موحد
              </button>
              <button 
                className={'o-toggle-btn' + (displayMode === 'sectors' ? ' active' : '')} 
                onClick={() => changeDisplayMode('sectors')}
                style={{
                  border: 0,
                  background: displayMode === 'sectors' ? 'linear-gradient(120deg, var(--brand), var(--brand2))' : 'transparent',
                  color: displayMode === 'sectors' ? '#fff' : 'var(--muted)',
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
              >
                🗂️ حسب القطاعات
              </button>
            </div>
          </div>

          {displayMode === 'list' ? (
            <div className="tablewrap">
              <table className="screener">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggleSort('name')}>السهم{arrow('name')}</th>
                    <th>السوق</th>
                    <th className="sortable" onClick={() => toggleSort('price')}>السعر{arrow('price')}</th>
                    <th className="sortable" onClick={() => toggleSort('pe')}>P/E{arrow('pe')}</th>
                    <th>EPS</th>
                    <th className="sortable" onClick={() => toggleSort('mcap')}>القيمة السوقية{arrow('mcap')}</th>
                    <th>صافي الربح</th>
                    <th className="sortable" onClick={() => toggleSort('yield')}>العائد{arrow('yield')}</th>
                    <th>التصنيف</th>
                    <th>المحفظة</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.sym} onClick={() => onOpen(s)} className="rowlink">
                      <td>
                        <span className="cellname">
                          <Avatar sym={s.sym} size={30} />
                          <span>
                            <span className="cn-name">{s.name}</span>
                            <span className="cn-sym">{s.sym}</span>
                          </span>
                        </span>
                      </td>
                      <td><span className={'exch ex-' + s.ex}>{s.ex}</span></td>
                      <td>{cell(s.price !== null ? s.price.toFixed(2) : null)}</td>
                      <td>{cell(s.pe)}</td>
                      <td>{cell(s.eps)}</td>
                      <td>{cell(s.mcap)}</td>
                      <td>{cell(s.net)}</td>
                      <td>{cell(s.div.yld)}</td>
                      <td><span className={'ribbon cat-' + s.cat}>{CAT_LABEL[s.cat]}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => togglePortfolioStock(s.sym)}
                          style={{
                            background: 'transparent',
                            border: 0,
                            cursor: 'pointer',
                            fontSize: '15px',
                            padding: '4px 8px',
                            transition: 'transform 0.12s ease'
                          }}
                          title={isInPortfolio(s.sym) ? 'إزالة من المحفظة 🗑️' : 'إضافة إلى المحفظة +'}
                        >
                          {isInPortfolio(s.sym) ? '💼' : '➕'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {sectorGroups.map(group => (
                <div key={group.title} className="panel" style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: '16px', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--brand2)' }}>🔸</span>
                      {group.title}
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>({group.stocks.length} شركات مطابقة)</span>
                    </h3>
                  </div>
                  <div className="tablewrap">
                    <table className="screener" style={{ width: '100%', minWidth: '1020px' }}>
                      <thead>
                        <tr>
                          <th>اسم الشركة</th>
                          <th style={{ textAlign: 'center' }}>القيمة الاسمية</th>
                          <th style={{ width: '130px', textAlign: 'center' }}>المدى اليومي (أدنى/أعلى)</th>
                          <th>آخر سعر</th>
                          <th>التغير</th>
                          <th>التغير (%)</th>
                          <th>حجم التداول (سهم)</th>
                          <th>قيمة التداول</th>
                          <th>الصفقات</th>
                          <th>الإغلاق السابق</th>
                          <th>سعر الفتح</th>
                          <th>الأعلى</th>
                          <th>الأدنى</th>
                          <th style={{ textAlign: 'center' }}>المحفظة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.stocks.map(s => {
                          const d = getDailyData(s)
                          const percent = d.high > d.low ? ((s.price ?? 1) - d.low) / (d.high - d.low) * 100 : 50
                          return (
                            <tr key={s.sym} onClick={() => onOpen(s)} className="rowlink">
                              <td>
                                <span className="cellname">
                                  <Avatar sym={s.sym} size={28} />
                                  <span>
                                    <span className="cn-name">{s.name.split('—')[0]}</span>
                                    <span className="cn-sym">{s.sym} <span className={'exch ex-' + s.ex} style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px' }}>{s.ex}</span></span>
                                  </span>
                                </span>
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>1.00</td>
                              <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', direction: 'ltr', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: 600 }}>{d.low.toFixed(2)}</span>
                                  <div style={{ position: 'relative', width: '50px', height: '4px', background: 'var(--line)', borderRadius: '2px' }} title={`أعلى سعر اليوم: ${d.high.toFixed(2)} — أدنى سعر اليوم: ${d.low.toFixed(2)}`}>
                                    <div style={{
                                      position: 'absolute',
                                      left: `${Math.min(100, Math.max(0, percent))}%`,
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      background: d.isFlat ? 'var(--muted)' : d.isUp ? 'var(--good)' : 'var(--bad)',
                                      border: '1.5px solid #fff',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: 600 }}>{d.high.toFixed(2)}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 700 }}>{cell(s.price !== null ? s.price.toFixed(2) : null)}</td>
                              <td style={{ fontWeight: 800, direction: 'ltr', color: d.isFlat ? 'var(--muted)' : d.isUp ? 'var(--good)' : 'var(--bad)' }}>
                                {d.isFlat ? '0.00' : `${d.isUp ? '▲ +' : '▼ '}${Math.abs(d.change).toFixed(2)}`}
                              </td>
                              <td style={{ fontWeight: 800, direction: 'ltr', color: d.isFlat ? 'var(--muted)' : d.isUp ? 'var(--good)' : 'var(--bad)' }}>
                                {d.pct}
                              </td>
                              <td>{d.volume.toLocaleString('en-US')}</td>
                              <td>{Math.round(d.value).toLocaleString('en-US')} د.إ</td>
                              <td>{d.trades.toLocaleString('en-US')}</td>
                              <td>{d.prevClose.toFixed(2)}</td>
                              <td>{d.open.toFixed(2)}</td>
                              <td style={{ color: 'var(--good)' }}>{d.high.toFixed(2)}</td>
                              <td style={{ color: 'var(--bad)' }}>{d.low.toFixed(2)}</td>
                              <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                                <button 
                                  onClick={() => togglePortfolioStock(s.sym)}
                                  style={{
                                    background: 'transparent',
                                    border: 0,
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '4px 8px',
                                    transition: 'transform 0.12s ease'
                                  }}
                                  title={isInPortfolio(s.sym) ? 'إزالة من المحفظة 🗑️' : 'إضافة إلى المحفظة +'}
                                >
                                  {isInPortfolio(s.sym) ? '💼' : '➕'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {rows.length === 0 && <div className="empty">لا توجد نتائج مطابقة.</div>}
        </div>

        {/* الشريط الجانبي: ملخّص حيّ للنتائج المطابقة */}
        <div className="overview-sidebar">
          <div className="o-widget">
            <h4 className="o-widget-h">🔎 ملخّص النتائج</h4>

            <div className="stats" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '0 0 14px' }}>
              <StatCard color="var(--brand)" value={rows.length} label="أسهم مطابقة" />
              <StatCard color="var(--good)" value={`${summary.avgYield.toFixed(2)}%`} label="متوسط العائد" />
            </div>

            <div className="o-index-item">
              <span style={{ color: 'var(--muted)' }}>سوق دبي (DFM)</span>
              <b style={{ color: 'var(--brand)' }}>{summary.dfm}</b>
            </div>
            <div className="o-index-item">
              <span style={{ color: 'var(--muted)' }}>سوق أبوظبي (ADX)</span>
              <b style={{ color: 'var(--good)' }}>{summary.adx}</b>
            </div>

            {summary.topSectors.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--muted)', marginBottom: '8px' }}>التوزيع القطاعي</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {summary.topSectors.map((s) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--txt)', flex: '0 0 90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                      <div style={{ flex: 1, height: '8px', background: 'var(--chip)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${(s.count / maxSectorCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand), var(--brand2))', borderRadius: '99px' }} />
                      </div>
                      <b style={{ fontSize: '11px', color: 'var(--muted)', flex: '0 0 18px', textAlign: 'left' }}>{s.count}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
