import { Search, X, Table2, LayoutGrid, BriefcaseBusiness, Plus, ListFilter } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { Stock } from '@/data'
import { useStocks, usePortfolio } from '@/store'
import { parseYield, parseAmount } from '@/format'
import Avatar from '@/components/Avatar'
import { getDailyData } from '@/market'
import { cell } from '@/components/ui/cell'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'
import { SECTOR_TITLES, mapDFMSectorToDb } from '@/data/sectors'
import ScreenerGrid from './ScreenerGrid'
import type { DisplayMode, ScreenerSearch, SortKey } from '@/search'

const defaultDir = (k: SortKey): 1 | -1 => (k === 'name' ? 1 : -1)

function savedDisplayMode(): DisplayMode {
  try {
    const saved = localStorage.getItem('screener_display_mode')
    return saved === 'sectors' ? 'sectors' : 'list'
  } catch {
    return 'list'
  }
}

export default function Screener({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const { isInPortfolio, togglePortfolioStock } = usePortfolio()
  // الفلاتر والترتيب ووضع العرض محفوظة في الرابط (?q=&ex=&cat=&sector=&sort=&dir=&view=) فتُشارَك كما هي
  const search = useSearch({ from: '/screener' })
  const navigate = useNavigate({ from: '/screener' })
  const update = (patch: ScreenerSearch) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const ex = search.ex ?? 'all'
  const cat = search.cat ?? 'all'
  const sector = search.sector ?? 'all'
  const sort = search.sort ?? 'mcap'
  const dir: 1 | -1 = search.dir ? (search.dir === 'asc' ? 1 : -1) : defaultDir(sort)
  const displayMode = search.view ?? savedDisplayMode()

  // نص البحث محلي للكتابة السلسة، ويُنسخ إلى الرابط بعد توقّف الكتابة
  const [q, setQ] = useState(() => search.q ?? '')
  useEffect(() => {
    const term = q.trim()
    if (term === (search.q ?? '')) return
    const t = setTimeout(() => update({ q: term || undefined }), 300)
    return () => clearTimeout(t)
  })

  const changeDisplayMode = (mode: DisplayMode) => {
    update({ view: mode })
    try {
      localStorage.setItem('screener_display_mode', mode)
    } catch {
      /* التخزين غير متاح */
    }
  }



  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = DATA.filter((s) => {
      if (ex !== 'all' && s.ex !== ex) return false
      if (cat !== 'all' && s.cat !== cat) return false
      if (search.cov === 'curated' && s.auto) return false
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
        case 'change': return s.change ?? -Infinity
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
  }, [DATA, q, ex, cat, sector, sort, dir, search.cov])

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

      <div className="screener-layout">
        {/* الفلاتر والجدول: العرض كاملًا كي لا تُقصّ أعمدة الجدول */}
        <div className="screener-main">
          
          <div className="controls">
            <div className="search">
              <Search size={16} className="ico" aria-hidden />
              <input aria-label="ابحث في الأسهم بالاسم أو الرمز أو القطاع" placeholder="ابحث بالاسم أو الرمز أو القطاع…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="chips">
              {([['all', 'كل الأسواق'], ['DFM', 'دبي'], ['ADX', 'أبوظبي']] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={ex === v} onClick={() => update({ ex: v === 'all' ? undefined : v })}>{l}</button>
              ))}
            </div>
            <div className="chips">
              {([['all', 'كل الأسهم'], ['curated', 'المُراجَعة يدويًا']] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={(search.cov ?? 'all') === v} onClick={() => update({ cov: v === 'all' ? undefined : v })}
                  title={v === 'curated' ? 'الأسهم ذات البيانات المنسّقة يدويًا (التوزيعات والأساسيات)' : 'كامل أسهم السوقين، ومنها المضافة آليًا'}>{l}</button>
              ))}
            </div>
            <div className="chips">
              {([['all', 'كل التصنيفات'], ['income', 'دخل مستقر'], ['growth', 'نمو'], ['risk', 'مخاطر أعلى']] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={cat === v} onClick={() => update({ cat: v === 'all' ? undefined : v })}>{l}</button>
              ))}
            </div>
            {sector !== 'all' && (
              <button className="chip" style={{ background: 'var(--bad)', color: '#fff', border: 0 }} onClick={() => update({ sector: undefined })}>
                إلغاء فلتر القطاع: {sector} <X size={13} className="ico" aria-hidden />
              </button>
            )}
            
            {/* زر التبديل الفاخر لطريقة العرض */}
            <div className="o-toggle-container" style={{ marginInlineStart: 'auto', display: 'inline-flex', gap: '6px', background: 'var(--chip)', padding: '4px', borderRadius: '10px', border: '1px solid var(--line)' }}>
              <button 
                className={'o-toggle-btn' + (displayMode === 'list' ? ' active' : '')} 
                onClick={() => changeDisplayMode('list')}
                style={{
                  border: 0,
                  background: displayMode === 'list' ? 'linear-gradient(120deg, var(--brand-fill), var(--brand2-fill))' : 'transparent',
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
                <Table2 size={14} className="ico" aria-hidden /> جدول موحد
              </button>
              <button 
                className={'o-toggle-btn' + (displayMode === 'sectors' ? ' active' : '')} 
                onClick={() => changeDisplayMode('sectors')}
                style={{
                  border: 0,
                  background: displayMode === 'sectors' ? 'linear-gradient(120deg, var(--brand-fill), var(--brand2-fill))' : 'transparent',
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
                <LayoutGrid size={14} className="ico" aria-hidden /> حسب القطاعات
              </button>
            </div>
          </div>

          {displayMode === 'list' ? (
            <ScreenerGrid
              rows={rows}
              sort={sort}
              desc={dir === -1}
              onOpen={onOpen}
              onSort={(k, desc) =>
                update({
                  sort: k === 'mcap' ? undefined : k,
                  dir: (desc ? -1 : 1) === defaultDir(k) ? undefined : desc ? 'desc' : 'asc',
                })
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {sectorGroups.map(group => (
                <div key={group.title} className="panel" style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: '16px', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--brand2)', transform: 'rotate(45deg)' }} aria-hidden />
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
                                  title={isInPortfolio(s.sym) ? 'إزالة من المحفظة' : 'إضافة إلى المحفظة +'}
                                >
                                  {isInPortfolio(s.sym) ? <BriefcaseBusiness size={16} color="var(--brand)" aria-hidden /> : <Plus size={16} aria-hidden />}
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

        {/* ملخّص حيّ للنتائج المطابقة: شريط أفقي فوق الجدول، وعمود جانبي على الشاشات العريضة جدًا فقط */}
        <aside className="o-widget screener-summary" aria-label="ملخّص النتائج">
          <h4 className="o-widget-h"><ListFilter size={16} className="ico" aria-hidden /> ملخّص النتائج</h4>
          <div className="scr-summary">
            <div className="stats scr-sum-stats">
              <StatCard color="var(--brand)" value={rows.length} label="أسهم مطابقة" />
              <StatCard color="var(--good)" value={`${summary.avgYield.toFixed(2)}%`} label="متوسط العائد" />
            </div>

            <div className="scr-sum-ex">
              <div className="o-index-item">
                <span style={{ color: 'var(--muted)' }}>سوق دبي (DFM)</span>
                <b style={{ color: 'var(--brand)' }}>{summary.dfm}</b>
              </div>
              <div className="o-index-item">
                <span style={{ color: 'var(--muted)' }}>سوق أبوظبي (ADX)</span>
                <b style={{ color: 'var(--good)' }}>{summary.adx}</b>
              </div>
            </div>

            {summary.topSectors.length > 0 && (
              <div className="scr-sum-sectors">
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
        </aside>
      </div>
    </div>
  )
}
