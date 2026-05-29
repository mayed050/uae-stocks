import { useMemo, useState } from 'react'
import { CAT_LABEL } from '../data'
import type { Stock, Exchange, Category } from '../data'
import { useStocks, usePortfolio } from '../store'
import { parseYield, parseAmount } from '../format'
import Avatar from '../components/Avatar'

const NA = 'يلزم التحقق'
type SortKey = 'name' | 'price' | 'pe' | 'yield' | 'mcap'

function cell(x: string | number | null | undefined) {
  return x === null || x === undefined || x === '' ? <span className="na">{NA}</span> : x
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

const SECTOR_TITLES = [
  'البنوك',
  'الاستثمار والخدمات المالية',
  'الصناعة',
  'العقارات',
  'النقل والشحن',
  'الاتصالات',
  'الخدمات',
  'السلع',
  'الرعاية الصحية والتعليم',
  'التأمين',
  'الأغذية',
  'الشركات الأجنبية'
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

  const mcapVal = parseAmount(s.mcap) ?? 5 // default 5 Billion
  const volume = Math.round((mcapVal * 150000) * rand(2.2, 0.1))
  const value = volume * price
  const trades = Math.round(volume * rand(0.0006, 0.00015)) + 8

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

const mapDFMSectorToDb = (dfmTitle: string): string[] => {
  switch (dfmTitle) {
    case 'البنوك': return ['بنوك', 'خدمات مالية']
    case 'الاستثمار والخدمات المالية': return ['استثمار', 'خدمات مالية', 'استثمار / متنوع']
    case 'الصناعة': return ['صناعة / طاقة', 'بتروكيماويات']
    case 'العقارات': return ['عقار']
    case 'النقل والشحن': return ['طيران / نقل', 'نقل / خدمات', 'نقل / طاقة']
    case 'الاتصالات': return ['اتصالات']
    case 'الخدمات': return ['مرافق', 'بنية تحتية / رسوم', 'خدمات استهلاكية']
    case 'السلع': return ['تجزئة / استهلاك', 'خدمات استهلاكية']
    case 'الرعاية الصحية والتعليم': return ['رعاية / تعليم', 'رعاية صحية']
    case 'التأمين': return ['تأمين']
    case 'الأغذية': return ['تجزئة / استهلاك']
    case 'الشركات الأجنبية': return ['استثمار', 'بنوك']
    default: return [dfmTitle]
  }
}

export default function Screener({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const { isInPortfolio, togglePortfolioStock } = usePortfolio()
  const [q, setQ] = useState('')
  const [ex, setEx] = useState<'all' | Exchange>('all')
  const [cat, setCat] = useState<'all' | Category>('all')
  const [sort, setSort] = useState<SortKey>('mcap')
  const [dir, setDir] = useState<1 | -1>(-1)
  const [sector, setSector] = useState<'all' | string>('all')
  
  // حفظ وتغيير وضع العرض المفضل للمستثمر
  const [displayMode, setDisplayMode] = useState<'list' | 'sectors'>(() => {
    const saved = localStorage.getItem('screener_display_mode')
    return (saved === 'list' || saved === 'sectors') ? saved : 'list'
  })

  const changeDisplayMode = (mode: 'list' | 'sectors') => {
    setDisplayMode(mode)
    localStorage.setItem('screener_display_mode', mode)
  }

  // التحكم بالقوائم الموسعة للقطاعات في الفلتر الجانبي
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({ 'البنوك': true })

  const toggleSector = (title: string) => {
    setExpandedSectors(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
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
      return ((av as number) - (bv as number)) * dir
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

  const handleStockClick = (m: { name: string; sym: string; price: string; pct: string; change: string; up?: boolean; flat?: boolean; sector?: string }) => {
    const cleanSym = m.sym.replace(/\d+$/, '').toUpperCase()
    const found = DATA.find(s => 
      s.sym.toUpperCase() === cleanSym || 
      s.name.toLowerCase().includes(m.name.toLowerCase())
    )
    if (found) {
      onOpen(found)
    } else {
      const mockStock: Stock = {
        sym: cleanSym,
        name: `${m.name} — شركة مدرجة`,
        ex: 'DFM',
        sector: m.sector || 'قطاع عام',
        cat: 'income',
        yahoo: `${cleanSym}.AE`,
        price: parseFloat(m.price),
        asof: 'مايو 2026',
        mcap: 'غير متوفرة',
        pe: null,
        eps: 'غير متوفر',
        roe: 'غير متوفر',
        net: 'غير متوفر',
        rev: 'غير متوفر',
        div: {
          ps: 'غير معلن',
          yld: m.pct || 'غير معلن',
          freq: 'سنوي',
          lastEnt: null,
          exd: null,
          rec: null,
          pay: null,
          agm: null
        }
      }
      onOpen(mockStock)
    }
  }

  return (
    <div className="view">
      <div className="page-head">
        <h1>مستكشف الأسهم</h1>
        <p>كل المؤشرات المالية لـ {DATA.length} سهمًا — اضغط أي صف للتفاصيل الكاملة</p>
      </div>

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
                <button key={v} className="chip" aria-pressed={ex === v} onClick={() => setEx(v as typeof ex)}>{l}</button>
              ))}
            </div>
            <div className="chips">
              {([['all', 'كل التصنيفات'], ['income', 'دخل مستقر'], ['growth', 'نمو'], ['risk', 'مخاطر أعلى']] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={cat === v} onClick={() => setCat(v as typeof cat)}>{l}</button>
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
                    <table className="screener" style={{ width: '100%', minWidth: '980px' }}>
                      <thead>
                        <tr>
                          <th>اسم السهم</th>
                          <th>آخر سعر</th>
                          <th>التغير</th>
                          <th>التغير (%)</th>
                          <th>حجم التداول</th>
                          <th>القيمة اليومية</th>
                          <th>الصفقات</th>
                          <th>الإغلاق السابق</th>
                          <th>سعر الفتح</th>
                          <th>الأعلى</th>
                          <th>الأدنى</th>
                          <th style={{ width: '140px', textAlign: 'center' }}>المدى اليومي (أدنى/أعلى)</th>
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
                              <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', direction: 'ltr', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: 600 }}>{d.low.toFixed(2)}</span>
                                  <div style={{ position: 'relative', width: '60px', height: '4px', background: 'var(--line)', borderRadius: '2px' }} title={`أعلى سعر اليوم: ${d.high.toFixed(2)} — أدنى سعر اليوم: ${d.low.toFixed(2)}`}>
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

        {/* العمود الأيسر الجانبي (فلتر قطاعات الشركات 30%) */}
        <div className="overview-sidebar">
          
          <div className="o-widget">
            <h4 className="o-widget-h" style={{ margin: 0, border: 0, padding: 0, paddingBottom: '8px', marginBottom: '12px', borderBottom: '1px solid var(--line)' }}>
              🗂️ فلترة قطاعات سوق دبي
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '-4px', marginBottom: '12px' }}>
              اضغط على أي قطاع لتصفية نتائج الجدول تلقائياً، واضغط على السهم لفتح تفاصيل أي شركة.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto', paddingRight: '2px' }}>
              <button 
                onClick={() => setSector('all')}
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '9px 12px',
                  background: sector === 'all' ? 'linear-gradient(120deg, var(--brand), var(--brand2))' : 'var(--chip)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: sector === 'all' ? '#fff' : 'var(--txt)',
                  fontWeight: 700,
                  fontSize: '12px',
                  transition: 'all 0.12s ease'
                }}
              >
                📁 عرض كل القطاعات المتاحة
              </button>

              {SECTOR_MOVEMENTS.map((sec) => {
                const isExpanded = !!expandedSectors[sec.title]
                const isActiveFilter = sector === sec.title
                return (
                  <div 
                    key={sec.title} 
                    style={{ 
                      border: isActiveFilter ? '1px solid var(--brand)' : '1px solid var(--line)', 
                      borderRadius: '10px', 
                      background: isActiveFilter ? 'rgba(58, 160, 255, 0.03)' : 'rgba(255,255,255,0.01)', 
                      overflow: 'hidden',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', width: '100%' }}>
                      <button 
                        onClick={() => setSector(isActiveFilter ? 'all' : sec.title)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          justifyContent: 'right',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: isActiveFilter ? 'rgba(58, 160, 255, 0.1)' : 'transparent',
                          border: 0,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          color: isActiveFilter ? 'var(--brand)' : 'var(--txt)',
                          fontWeight: 800,
                          fontSize: '12px',
                          textAlign: 'right'
                        }}
                      >
                        <span style={{ color: isActiveFilter ? 'var(--brand)' : 'var(--brand2)', marginInlineEnd: '8px' }}>🔸</span>
                        {sec.title}
                      </button>
                      <button 
                        onClick={() => toggleSector(sec.title)}
                        style={{
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 0,
                          borderInlineStart: '1px solid var(--line)',
                          cursor: 'pointer',
                          color: 'var(--muted)',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="عرض الشركات"
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.08)' }}>
                        <table style={{ minWidth: '100%', background: 'transparent', fontSize: '11px', borderCollapse: 'collapse' }}>
                          <tbody>
                            {sec.stocks.map((m) => (
                              <tr 
                                key={m.sym} 
                                onClick={() => handleStockClick(m)}
                                className="rowlink"
                                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', cursor: 'pointer' }}
                              >
                                <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--txt)' }}>
                                  {m.name}
                                </td>
                                <td style={{ padding: '5px 4px', textAlign: 'center', color: 'var(--muted)' }}>
                                  {m.price}
                                </td>
                                <td style={{ 
                                  padding: '5px 4px', 
                                  textAlign: 'left', 
                                  fontWeight: 800,
                                  direction: 'ltr',
                                  color: m.flat ? 'var(--muted)' : m.up ? 'var(--good)' : 'var(--bad)',
                                  fontSize: '10.5px'
                                }}>
                                  {m.pct}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
