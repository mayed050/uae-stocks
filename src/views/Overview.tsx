import { useState, useEffect, useMemo } from 'react'
import {
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts'
import type { Stock } from '../data'
import { useStocks, useMarketStats, usePortfolio } from '../store'
import { fmtAmount, parseYield, parseAmount } from '../format'
import Avatar from '../components/Avatar'
import { SECTOR_MOVEMENTS, ADX_MOVEMENTS } from '../data/movements'
import type { MovementStock } from '../data/movements'

const PALETTE = ['#3aa0ff', '#7c5cff', '#21c98b', '#ffb020', '#ff5a72', '#36c5d8', '#e26bd0', '#9bd13a']

function fmtTradingValue(val: number) {
  if (val >= 1e6) {
    return `${(val / 1e6).toFixed(2)} مليون د.إ`
  }
  if (val >= 1e3) {
    return `${(val / 1e3).toFixed(1)} ألف د.إ`
  }
  return `${val.toFixed(0)} د.إ`
}

function getDailyData(s: Stock) {
  const symbol = s.sym.toUpperCase()
  const price = s.price ?? 1.0
  
  // Deterministic seed from symbol string
  let seed = 0
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i)
  }
  
  // Pseudo-random numbers using stable seed (fixed per symbol, doesn't drift across re-renders)
  let localSeed = seed
  const rand = (max: number, min = 0) => {
    const x = Math.sin(localSeed++) * 10000
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

function generateHistoricalData(sym: string, timeframe: string, currentPrice: number) {
  let seed = 0
  for (let i = 0; i < sym.length; i++) {
    seed += sym.charCodeAt(i)
  }

  const points = ({ '1W': 7, '1M': 30, '3M': 90, '6M': 120, '1Y': 250 } as Record<string, number>)[timeframe] ?? 365

  const data = []
  let price = currentPrice
  const isUpTrend = seed % 2 === 0
  const volatility = 0.012
  const today = new Date()
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const label = (timeframe === '1W' || timeframe === '1M')
      ? date.toLocaleDateString('ar-AE', { day: 'numeric', month: 'short' })
      : date.toLocaleDateString('ar-AE', { month: 'short', year: '2-digit' })

    data.push({
      date: label,
      price: parseFloat(price.toFixed(2))
    })

    const changePct = (Math.sin(seed + i) * volatility) + (isUpTrend ? -0.0006 : 0.0006)
    price = price * (1 - changePct)
  }

  data[data.length - 1].price = currentPrice
  const prices = data.map(d => d.price)
  const high = Math.max(...prices)
  const low = Math.min(...prices)
  const open = data[0].price
  const close = currentPrice
  const change = close - open
  const changePct = (change / open) * 100
  const isOverallUp = change >= 0

  return {
    data,
    high,
    low,
    open,
    close,
    change,
    changePct,
    isOverallUp
  }
}

function generateSparklineData(sym: string, currentPrice: number) {
  let seed = 0
  for (let i = 0; i < sym.length; i++) {
    seed += sym.charCodeAt(i)
  }
  const points = 10
  const data = []
  let price = currentPrice
  const isUpTrend = seed % 2 === 0
  
  for (let i = points - 1; i >= 0; i--) {
    data.push(price)
    const changePct = (Math.sin(seed + i) * 0.008) + (isUpTrend ? -0.0004 : 0.0004)
    price = price * (1 - changePct)
  }
  return data.reverse()
}

export default function Overview({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA, lastUpdated } = useStocks()
  const {
    alertRows,
    sectorData,
    maxYield,
    maxMcap
  } = useMarketStats()
  const { isInPortfolio } = usePortfolio()
  
  // التحكم بنوع خريطة السوق الحرارية
  const [heatmapMetric, setHeatmapMetric] = useState<'yield' | 'pe' | 'mcap'>('yield')
  // التحكم بتبويب حركة السوق (دبي / أبوظبي)
  const [marketTab, setMarketTab] = useState<'dubai' | 'adx'>('dubai')
  // التحكم بتبويب لوحة حركة السوق (المرتفعة / المنخفضة / النشطة بالكمية / النشطة بالقيمة)
  const [movementTab, setMovementTab] = useState<'gainers' | 'losers' | 'volume' | 'value'>('gainers')
  // التحكم بفلتر متتبع التواريخ القادمة (الكل / محفظتي فقط)
  const [trackerFilter, setTrackerFilter] = useState<'all' | 'portfolio'>('all')
  // إشعار التأكيد العائم لزر التنبيه
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // السهم النشط المختار للرسم البياني المتطور
  const [selectedChartSym, setSelectedChartSym] = useState<string>('DEWA')
  // الفترة الزمنية النشطة للرسم البياني
  const [chartTimeframe, setChartTimeframe] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M')

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // تصفية وفرز قائمة حركة السوق بناء على التبويب المختار
  const movementStocks = useMemo(() => {
    const stocksWithData = DATA.map(s => ({
      s,
      d: getDailyData(s),
      pctNum: parseFloat(getDailyData(s).pct.replace('%', ''))
    }))

    if (movementTab === 'gainers') {
      return stocksWithData
        .filter(x => x.d.change > 0)
        .sort((a, b) => b.pctNum - a.pctNum)
        .slice(0, 10)
    } else if (movementTab === 'losers') {
      return stocksWithData
        .filter(x => x.d.change < 0)
        .sort((a, b) => a.pctNum - b.pctNum)
        .slice(0, 10)
    } else if (movementTab === 'volume') {
      return stocksWithData
        .sort((a, b) => b.d.volume - a.d.volume)
        .slice(0, 10)
    } else { // 'value'
      return stocksWithData
        .sort((a, b) => b.d.value - a.d.value)
        .slice(0, 10)
    }
  }, [DATA, movementTab])

  // تصفية تواريخ الاستحقاق حسب الفلتر المختار (الكل / محفظتي فقط)
  const filteredAlertRows = useMemo(() => {
    if (trackerFilter === 'portfolio') {
      return alertRows.filter(row => isInPortfolio(row.s.sym))
    }
    return alertRows
  }, [alertRows, trackerFilter, isInPortfolio])

  // الحصول على بيانات السهم المختار للرسم البياني وتوليد تاريخه
  const selectedChartStock = useMemo(() => {
    const s = DATA.find(st => st.sym.toUpperCase() === selectedChartSym.toUpperCase()) ?? DATA[0]
    const history = generateHistoricalData(s.sym, chartTimeframe, s.price ?? 1.0)
    return {
      stock: s,
      ...history
    }
  }, [DATA, selectedChartSym, chartTimeframe])

  // حساب إجمالي الصفقات وحجم التداول اليومي التراكمي للأسواق الإماراتية
  const marketActivity = useMemo(() => {
    let dfmTrades = 0
    let adxTrades = 0
    let dfmVolume = 0
    let adxVolume = 0
    
    DATA.forEach(s => {
      const d = getDailyData(s)
      if (s.ex === 'DFM') {
        dfmTrades += d.trades
        dfmVolume += d.volume
      } else {
        adxTrades += d.trades
        adxVolume += d.volume
      }
    })
    
    return {
      dfmTrades,
      adxTrades,
      totalTrades: dfmTrades + adxTrades,
      dfmVolume,
      adxVolume,
      totalVolume: dfmVolume + adxVolume
    }
  }, [DATA])


  // 3. التنبيهات المباشرة لإجراءات الشركات (Simulated Real-time Actions Feed)
  const [liveActions, setLiveActions] = useState(() => [
    {
      id: 1,
      sym: 'EMAAR',
      title: 'الجمعية العمومية لشركة إعمار العقارية توافق على توزيع أرباح نقدية استثنائية بقيمة 25 فلس للسهم لعام 2025.',
      type: 'approval',
      time: 'الآن',
      badge: 'قرار عمومية'
    },
    {
      id: 2,
      sym: 'DEWA',
      title: 'تنبيه: سهم هيئة كهرباء ومياه دبي (DEWA) يتداول اليوم بدون أحقية التوزيع النقدي البالغ 3.1 فلس.',
      type: 'date',
      time: 'منذ 40 دقيقة',
      badge: 'تاريخ استحقاق'
    },
    {
      id: 3,
      sym: 'FAB',
      title: 'بنك أبوظبي الأول يعلن إيداع كامل الأرباح السنوية الموزعة في حسابات مساهميه البنكية مباشرة.',
      type: 'payout',
      time: 'منذ ساعتين',
      badge: 'إيداع أرباح'
    },
    {
      id: 4,
      sym: 'SALIK',
      title: 'سالك تعلن عن اعتماد سياسة توزيع أرباح مرحلية مرنة للمساهمين بنسبة 100% من صافي الأرباح القابلة للتوزيع.',
      type: 'news',
      time: 'منذ 4 ساعات',
      badge: 'إفصاح مالي'
    }
  ])

  useEffect(() => {
    const feed = [
      {
        sym: 'ADNOCDIST',
        title: 'أدنوك للتوزيع تؤكد تاريخ استحقاق توزيعات النصف الثاني من العام المالي بقيمة 10.28 فلس للسهم.',
        type: 'date',
        badge: 'تأكيد تواريخ'
      },
      {
        sym: 'ADIB',
        title: 'مصرف أبوظبي الإسلامي يحصل على موافقة المصرف المركزي لتوزيع أرباح نقدية بنسبة 49% للمساهمين.',
        type: 'approval',
        badge: 'موافقة رسمية'
      },
      {
        sym: 'EAND',
        title: 'مجموعة إي آند (&e) تؤكد توزيع أرباح نقدية بقيمة 40 فلس للسهم عن النصف الثاني من العام المالي.',
        type: 'news',
        badge: 'إفصاح'
      },
      {
        sym: 'TABREED',
        title: 'عمومية تبريد الوطنية تقر توزيع أرباح نقدية بنسبة 15% وتوجه الشكر للمستثمرين على ثقتهم المستمرة.',
        type: 'approval',
        badge: 'قرار عمومية'
      },
      {
        sym: 'ALDAR',
        title: 'الدار العقارية تفصح عن خطتها التوسعية وتوزيعات نقدية قوية مستهدفة للسنوات الثلاث القادمة.',
        type: 'news',
        badge: 'إفصاح مالي'
      },
      {
        sym: 'ADNOCGAS',
        title: 'أدنوك للغاز تعلن عن إتمام إيداع التوزيعات النقدية المرحلية البالغة 7.7 فلس للسهم في حسابات مساهميها اليوم.',
        type: 'payout',
        badge: 'إيداع أرباح'
      }
    ]

    const interval = setInterval(() => {
      // Pick a random event from the feed
      const item = feed[Math.floor(Math.random() * feed.length)]
      setLiveActions(prev => {
        // Prevent duplicate consecutive or too frequent alerts
        if (prev.some(x => x.title === item.title)) return prev;
        
        return [
          {
            id: Date.now(),
            sym: item.sym,
            title: item.title,
            type: item.type,
            time: 'الآن',
            badge: item.badge
          },
          ...prev.map(x => x.time === 'الآن' ? { ...x, time: 'منذ قليل' } : x).slice(0, 4)
        ]
      })
    }, 20000) // update every 20 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="view">
      <style>{`
        /* تنسيقات شريط التنبيهات المباشرة الفاخر */
        .live-badge-pulse {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--good);
          background: rgba(33, 201, 139, 0.08);
          border: 1px solid rgba(33, 201, 139, 0.25);
          padding: 2.5px 8px;
          border-radius: 20px;
          margin-inline-start: auto;
        }
        .pulse-dot {
          width: 7px;
          height: 7px;
          background-color: var(--good);
          border-radius: 50%;
          display: inline-block;
          animation: pulse-glow 1.5s infinite;
        }
        @keyframes pulse-glow {
          0% {
            transform: scale(0.9);
            opacity: 0.6;
            box-shadow: 0 0 0 0 rgba(33, 201, 139, 0.7);
          }
          70% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow: 0 0 0 5px rgba(33, 201, 139, 0);
          }
          100% {
            transform: scale(0.9);
            opacity: 0.6;
            box-shadow: 0 0 0 0 rgba(33, 201, 139, 0);
          }
        }
        .o-action-item {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 12px 14px;
          border-radius: 12px;
          background: var(--chip);
          border: 1px solid var(--line);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          margin-bottom: 10px;
          text-align: right;
          animation: slide-in-alert 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slide-in-alert {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .o-action-item:hover {
          border-color: var(--brand);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
          background: var(--panel-solid);
        }
        /* لوحة الرسم البياني التفاعلي المتطور لأسعار وحركة الأسهم */
        .chart-dashboard-container {
          display: flex;
          gap: 20px;
          align-items: stretch;
          width: 100%;
          direction: rtl;
        }
        .chart-dashboard-left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .chart-dashboard-right {
          width: 260px;
          flex: 0 0 260px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 480px;
          overflow-y: auto;
          border-inline-start: 1px solid var(--line);
          padding-inline-start: 12px;
        }
        .chart-stock-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--chip);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: right;
        }
        .chart-stock-item:hover {
          border-color: var(--brand);
          background: var(--panel-solid);
        }
        .chart-stock-item.active {
          border-color: #ff6b00;
          background: rgba(255, 107, 0, 0.04);
        }
        .chart-timeframe-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .chart-timeframe-btn.active {
          background: #ff6b00;
          color: #fff;
        }
        @media (max-width: 768px) {
          .chart-dashboard-container {
            flex-direction: column;
          }
          .chart-dashboard-right {
            width: 100%;
            flex: none;
            max-height: 140px;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            border-inline-start: 0;
            border-bottom: 1px solid var(--line);
            padding-inline-start: 0;
            padding-bottom: 12px;
          }
          .chart-stock-item {
            min-width: 140px;
            flex-shrink: 0;
          }
        }
        .o-action-type-line {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: 4.5px;
        }
        .movement-row {
          transition: all 0.15s ease;
        }
        .movement-row:hover {
          background: rgba(255, 107, 0, 0.04) !important;
          transform: scale(1.002);
        }
        
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

          {/* 📊 بطاقة نشاط مؤشرات الأسواق والنشاط اليومي (مباشر) */}
          <div className="panel" style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 className="panel-h" style={{ margin: '0 0 14px 0', borderBottom: '1px solid var(--line)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800 }}>
              📊 مؤشرات الأسواق الإماراتية والنشاط اليومي
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              {/* مؤشر سوق دبي المالي */}
              <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand)' }}>📈 مؤشر سوق دبي (DFMGI)</span>
                  <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(58, 160, 255, 0.1)', color: 'var(--brand)', border: '1px solid rgba(58, 160, 255, 0.2)', fontWeight: 700 }}>دبي</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>4,215.80</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--good)' }}>+16.40 (+0.39%)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
                  <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
                    الاتجاه: <span style={{ color: 'var(--good)' }}>صاعد ↗️</span>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
                    حجم التداول: <span style={{ color: 'var(--txt)' }}>{fmtAmount(marketActivity.dfmVolume)}</span>
                  </div>
                </div>
              </div>

              {/* مؤشر سوق أبوظبي للأوراق المالية */}
              <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--good)' }}>📈 مؤشر سوق أبوظبي (ADI)</span>
                  <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(33, 201, 139, 0.1)', color: 'var(--good)', border: '1px solid rgba(33, 201, 139, 0.2)', fontWeight: 700 }}>أبوظبي</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>9,350.40</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--bad)' }}>-41.20 (-0.44%)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
                  <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
                    الاتجاه: <span style={{ color: 'var(--bad)' }}>هابط ↘️</span>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
                    حجم التداول: <span style={{ color: 'var(--txt)' }}>{fmtAmount(marketActivity.adxVolume)}</span>
                  </div>
                </div>
              </div>

              {/* صفقات ونشاط السوق */}
              <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--warn)' }}>💼 نشاط الصفقات المنفذة</span>
                  <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 176, 32, 0.1)', color: 'var(--warn)', border: '1px solid rgba(255, 176, 32, 0.2)', fontWeight: 700 }}>اليوم</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--txt)' }}>{marketActivity.totalTrades.toLocaleString('en-US')}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--muted)' }}>صفقة منفذة</span>
                </div>
                
                {/* صفقات دبي وأبوظبي */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
                  <div style={{ background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: 700, marginBottom: '2px' }}>صفقات دبي</div>
                    <b style={{ color: 'var(--brand)', fontSize: '12px' }}>{marketActivity.dfmTrades.toLocaleString('en-US')}</b>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: '6px', borderRadius: '8px', fontSize: '10.5px', color: 'var(--muted)', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: 700, marginBottom: '2px' }}>صفقات أبوظبي</div>
                    <b style={{ color: 'var(--good)', fontSize: '12px' }}>{marketActivity.adxTrades.toLocaleString('en-US')}</b>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* قسم التحليل والرسوم البيانية الهيكلية وتوزيع القطاعات */}
          <div className="chart-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '20px' }}>
            {/* توزيع القطاعات */}
            <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <h3 className="panel-h" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px', fontSize: '14.5px', fontWeight: 800 }}>
                📊 توزيع هيكل السوق حسب القطاعات
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', justifyContent: 'center' }}>
                <div style={{ flex: '1 1 220px', maxWidth: '280px' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {sectorData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--panel-solid)" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tipStyle} formatter={(val, name) => [`${val} شركات مدرجة`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="legend" style={{ flex: '1 1 300px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', border: 0, padding: 0 }}>
                  {sectorData.map((d, i) => (
                    <span key={d.name} className="legend-item" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <i style={{ background: PALETTE[i % PALETTE.length], width: '10px', height: '10px', borderRadius: '3px', display: 'inline-block' }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 📈 لوحة الرسم البياني التفاعلي المتطور لأسعار وحركة الأسهم الفردية (حركة الأسهم والرسم البياني) */}
          <div className="panel" style={{ marginBottom: '24px', padding: '24px', borderRadius: '16px' }}>
            <div className="chart-dashboard-container">
              
              {/* القسم الأيسر: الرسم البياني والمؤشرات الفنية (يمثل 70% من العرض) */}
              <div className="chart-dashboard-left">
                
                {/* رأس لوحة الرسم البياني (اسم السهم وتفاصيل التغير المؤقتة والفترات الزمنية) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 900, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar sym={selectedChartStock.stock.sym} size={28} />
                      {selectedChartStock.stock.sym} — {selectedChartStock.stock.name.split('—')[0]}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--txt)' }}>
                        {selectedChartStock.stock.price?.toFixed(2)} د.إ
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        color: selectedChartStock.isOverallUp ? 'var(--good)' : 'var(--bad)',
                        direction: 'ltr'
                      }}>
                        {selectedChartStock.isOverallUp ? '▲' : '▼'} {selectedChartStock.change.toFixed(2)} ({selectedChartStock.changePct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* أزرار تحديد المدى الزمني للرسم البياني */}
                  <div style={{ display: 'flex', gap: '3px', background: 'var(--chip)', padding: '3px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => {
                      const tfLabel = tf === '1W' ? 'أسبوع' : tf === '1M' ? 'شهر' : tf === '3M' ? '3 أشهر' : tf === '6M' ? '6 أشهر' : tf === '1Y' ? 'سنة' : 'الكل';
                      return (
                        <button
                          key={tf}
                          onClick={() => setChartTimeframe(tf)}
                          className={`chart-timeframe-btn ${chartTimeframe === tf ? 'active' : ''}`}
                        >
                          {tfLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* مساحة الرسم البياني التفاعلي المتجاوب مع تلوين ديناميكي للاتجاه */}
                <div style={{ width: '100%', height: '250px', position: 'relative', marginTop: '10px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedChartStock.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartColorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedChartStock.isOverallUp ? '#21c98b' : '#ff5a72'} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={selectedChartStock.isOverallUp ? '#21c98b' : '#ff5a72'} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'var(--muted)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fill: 'var(--muted)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--panel-solid)',
                          border: '1px solid var(--line)',
                          borderRadius: 8,
                          fontSize: '11.5px',
                          color: 'var(--txt)',
                          textAlign: 'right'
                        }}
                        formatter={(val) => [`${Number(val).toFixed(2)} د.إ`, 'السعر']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={selectedChartStock.isOverallUp ? '#21c98b' : '#ff5a72'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartColorGrad)"
                        animationDuration={600}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* جدول البيانات والملخص الفني السفلي للسهم المختار */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '10px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                  
                  {/* العمود الأيمن: مؤشرات الأسعار الفنية */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--line)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--muted)' }}>الأعلى سعر:</span>
                      <b style={{ color: 'var(--txt)' }}>{selectedChartStock.high.toFixed(2)} د.إ</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--line)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--muted)' }}>الأدنى سعر:</span>
                      <b style={{ color: 'var(--txt)' }}>{selectedChartStock.low.toFixed(2)} د.إ</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--line)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--muted)' }}>سعر الافتتاح:</span>
                      <b style={{ color: 'var(--txt)' }}>{selectedChartStock.open.toFixed(2)} د.إ</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--muted)' }}>إغلاق السهم الحالي:</span>
                      <b style={{ color: 'var(--txt)' }}>{selectedChartStock.close.toFixed(2)} د.إ</b>
                    </div>
                  </div>

                  {/* العمود الأيسر: مؤشرات التغير والعوائد */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--line)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--muted)' }}>مقدار التغير اليومي:</span>
                      <b style={{ color: selectedChartStock.stock.price !== null && getDailyData(selectedChartStock.stock).change >= 0 ? 'var(--good)' : 'var(--bad)', direction: 'ltr' }}>
                        {selectedChartStock.stock.price !== null ? (getDailyData(selectedChartStock.stock).change >= 0 ? '+' : '') : ''}{selectedChartStock.stock.price !== null ? getDailyData(selectedChartStock.stock).change.toFixed(2) : '—'}
                      </b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--line)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--muted)' }}>نسبة التغير اليومي:</span>
                      <b style={{ color: selectedChartStock.stock.price !== null && getDailyData(selectedChartStock.stock).change >= 0 ? 'var(--good)' : 'var(--bad)', direction: 'ltr' }}>
                        {getDailyData(selectedChartStock.stock).pct}
                      </b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--muted)' }}>العائد النقدي (%) الحالي:</span>
                      <b style={{ color: 'var(--good)' }}>{selectedChartStock.stock.div.yld ?? '—'}</b>
                    </div>
                  </div>

                </div>

              </div>

              {/* القسم الأيمن: قائمة اختيار ومتابعة الأسهم التفاعلية مع شارات الحركة Sparklines */}
              <div className="chart-dashboard-right">
                <div style={{ paddingBottom: '6px', borderBottom: '1px solid var(--line)', marginBottom: '4px' }}>
                  <b style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', textAlign: 'right' }}>الأسهم القيادية المتاحة</b>
                </div>
                {DATA.filter(st => ['DEWA', 'EMAAR', 'FAB', 'SALIK', 'ADNOCDIST', 'ADIB', 'EAND', 'DIB'].includes(st.sym.toUpperCase())).map((stock) => {
                  const isActive = stock.sym.toUpperCase() === selectedChartSym.toUpperCase();
                  const stockDaily = getDailyData(stock);
                  
                  // توليد Sparkline
                  const sparkPoints = generateSparklineData(stock.sym, stock.price ?? 1);
                  const minP = Math.min(...sparkPoints);
                  const maxP = Math.max(...sparkPoints);
                  const normalizedPoints = sparkPoints.map((p, idx) => {
                    const x = (idx / (sparkPoints.length - 1)) * 40;
                    const y = 14 - ((p - minP) / (maxP - minP || 1)) * 10;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <div
                      key={stock.sym}
                      onClick={() => setSelectedChartSym(stock.sym)}
                      className={`chart-stock-item ${isActive ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '12.5px', color: 'var(--txt)' }}>{stock.sym}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--txt)' }}>{stock.price?.toFixed(2)} د.إ</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '9.5px', color: 'var(--muted)' }}>{stock.name.split('—')[0]}</span>
                        
                        {/* Sparkline رسم بياني خطي مصغر */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="40" height="15" style={{ overflow: 'visible' }}>
                            <polyline
                              fill="none"
                              stroke={stockDaily.isUp ? 'var(--good)' : 'var(--bad)'}
                              strokeWidth="1.5"
                              points={normalizedPoints}
                            />
                          </svg>
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
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* 📊 لوحة حركة السوق التفاعلية الشاملة (حركة السوق) */}
          <div className="panel" style={{ marginBottom: '28px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#ff6b00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🟠 حركة السوق
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                  قائمة مرتبة حسب {
                    movementTab === 'gainers' ? 'الأسهم المرتفعة' :
                    movementTab === 'losers' ? 'الأسهم المنخفضة' :
                    movementTab === 'volume' ? 'النشطة بالكمية' :
                    'النشطة بالقيمة'
                  }
                </p>
              </div>

              {/* تبويبات الفرز والتصفية المطبقة للهوية البصرية الفاخرة */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--chip)', padding: '4px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <button
                  onClick={() => setMovementTab('gainers')}
                  style={{
                    border: 0,
                    background: movementTab === 'gainers' ? 'linear-gradient(135deg, #ff7b00, #ff4500)' : 'transparent',
                    color: movementTab === 'gainers' ? '#fff' : 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  المرتفعة
                </button>
                <button
                  onClick={() => setMovementTab('losers')}
                  style={{
                    border: 0,
                    background: movementTab === 'losers' ? 'linear-gradient(135deg, #ff7b00, #ff4500)' : 'transparent',
                    color: movementTab === 'losers' ? '#fff' : 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  المنخفضة
                </button>
                <button
                  onClick={() => setMovementTab('volume')}
                  style={{
                    border: 0,
                    background: movementTab === 'volume' ? 'linear-gradient(135deg, #ff7b00, #ff4500)' : 'transparent',
                    color: movementTab === 'volume' ? '#fff' : 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  النشطة بالكمية
                </button>
                <button
                  onClick={() => setMovementTab('value')}
                  style={{
                    border: 0,
                    background: movementTab === 'value' ? 'linear-gradient(135deg, #ff7b00, #ff4500)' : 'transparent',
                    color: movementTab === 'value' ? '#fff' : 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  النشطة بالقيمة
                </button>
              </div>
            </div>

            {/* الجدول التفاعلي الفاخر لحركة السوق */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '750px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', background: 'rgba(255, 107, 0, 0.02)' }}>
                    <th style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'right', fontWeight: 800 }}>الشركة</th>
                    <th style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'center', fontWeight: 800 }}>السعر</th>
                    <th style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'center', fontWeight: 800 }}>التغير</th>
                    <th style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'center', fontWeight: 800 }}>مكرر الربحية</th>
                    <th style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'center', fontWeight: 800 }}>العائد النقدي</th>
                    <th style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'center', fontWeight: 800 }}>عدد الصفقات</th>
                    <th style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'left', fontWeight: 800 }}>قيمة التداول</th>
                  </tr>
                </thead>
                <tbody>
                  {movementStocks.map(({ s, d }) => {
                    const priceFormatted = s.price !== null ? `${s.price.toFixed(2)} د.إ` : '—';
                    const peFormatted = s.pe !== null ? s.pe.toFixed(2) : '—';
                    const yieldFormatted = s.div.yld ?? '—';
                    const tradesFormatted = d.trades.toLocaleString('en-US');
                    const valueFormatted = fmtTradingValue(d.value);
                    
                    return (
                      <tr
                        key={s.sym}
                        onClick={() => onOpen(s)}
                        className="movement-row"
                        style={{
                          borderBottom: '1px solid var(--line)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* عمود الشركة */}
                        <td style={{ padding: '12px 10px', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar sym={s.sym} size={32} />
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--txt)', fontSize: '13.5px', display: 'block' }}>{s.sym}</span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{s.name.split('—')[0]}</span>
                          </div>
                          {isInPortfolio(s.sym) && <span title="في محفظتك" style={{ fontSize: '12px', marginInlineStart: '6px' }}>💼</span>}
                        </td>
                        
                        {/* عمود السعر */}
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 800, color: 'var(--txt)' }}>
                          {priceFormatted}
                        </td>
                        
                        {/* عمود التغير */}
                        <td style={{
                          padding: '12px 10px',
                          textAlign: 'center',
                          fontWeight: 800,
                          direction: 'ltr',
                          color: d.isFlat ? 'var(--muted)' : d.isUp ? 'var(--good)' : 'var(--bad)'
                        }}>
                          {d.isUp ? `+` : ''}{d.pct}
                        </td>
                        
                        {/* عمود مكرر الربحية */}
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--txt)' }}>
                          {peFormatted}
                        </td>
                        
                        {/* عمود العائد النقدي (مقترح يدعم موضوع التطبيق) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 800, color: 'var(--good)' }}>
                          {yieldFormatted}
                        </td>
                        
                        {/* عمود عدد الصفقات (مطلوب) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--txt)' }}>
                          {tradesFormatted}
                        </td>
                        
                        {/* عمود قيمة التداول */}
                        <td style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 800, color: 'var(--txt)' }}>
                          {valueFormatted}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {movementStocks.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontWeight: 600 }}>
                        لا توجد أسهم تطابق التصفية الحالية.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  دبي
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
              <div style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '2px' }}>
                <table style={{ minWidth: '100%', background: 'transparent', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '6px 4px', color: 'var(--muted)', textAlign: 'right', fontWeight: 700 }}>الاسم</th>
                      <th style={{ padding: '6px 4px', color: 'var(--muted)', textAlign: 'center', fontWeight: 700 }}>السعر</th>
                      <th style={{ padding: '6px 4px', color: 'var(--muted)', textAlign: 'left', fontWeight: 700 }}>التغير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DATA.filter(s => s.ex === 'DFM').map((realStock) => {
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

          {/* 2. متتبع توزيعات الأرباح التفاعلي المتقدم (Upcoming Dividend Tracker) */}
          <div className="o-widget" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '12px' }}>
              <h4 className="o-widget-h" style={{ margin: 0, border: 0, padding: 0 }}>📅 متتبع توزيعات الأرباح</h4>
              
              {/* شريط الفلتر المطور (الكل مقابل محفظتي) */}
              <div style={{ display: 'flex', gap: '3px', background: 'var(--chip)', padding: '2px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackerFilter('all'); }}
                  style={{
                    border: 0,
                    background: trackerFilter === 'all' ? 'linear-gradient(135deg, #ff7b00, #ff4500)' : 'transparent',
                    color: trackerFilter === 'all' ? '#fff' : 'var(--muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                >
                  الكل
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackerFilter('portfolio'); }}
                  style={{
                    border: 0,
                    background: trackerFilter === 'portfolio' ? 'linear-gradient(135deg, #ff7b00, #ff4500)' : 'transparent',
                    color: trackerFilter === 'portfolio' ? '#fff' : 'var(--muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                >
                  محفظتي 💼
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '450px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredAlertRows.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
                  {trackerFilter === 'portfolio' ? 'لا توجد توزيعات قريبة للشركات المدرجة في محفظتك.' : 'لا توجد تواريخ استحقاق قريبة حالياً.'}
                </div>
              ) : (
                filteredAlertRows.slice(0, 4).map(({ s, u }) => {
                  const daysLeft = u.n;
                  let countdownBadge;

                  if (daysLeft === null) {
                    countdownBadge = <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--chip)', border: '1px solid var(--line)', color: 'var(--muted)', fontWeight: 700 }}>متوقع</span>;
                  } else if (daysLeft === 0) {
                    countdownBadge = <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(33, 201, 139, 0.15)', border: '1px solid var(--good)', color: 'var(--good)', fontWeight: 800, animation: 'timeline-glow 1.5s infinite' }}>اليوم! 🎉</span>;
                  } else if (daysLeft < 7) {
                    countdownBadge = <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 176, 32, 0.15)', border: '1px solid var(--warn)', color: 'var(--warn)', fontWeight: 800 }}>باقي {daysLeft} أيام ⏳</span>;
                  } else {
                    countdownBadge = <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--chip)', border: '1px solid var(--line)', color: 'var(--txt)', fontWeight: 700 }}>بعد {daysLeft} يوم</span>;
                  }

                  const divValueStr = s.div.ps ?? 'غير معلن';

                  return (
                    <div
                      key={s.sym}
                      onClick={() => onOpen(s)}
                      style={{
                        background: 'var(--chip)',
                        border: '1px solid var(--line)',
                        borderRadius: '14px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.18s ease-in-out',
                        position: 'relative'
                      }}
                      className="rowlink"
                    >
                      {/* ترويسة بطاقة التوزيع */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar sym={s.sym} size={24} />
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '12.5px', color: 'var(--txt)', display: 'block' }}>{s.sym}</span>
                            <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>{s.ex}</span>
                          </div>
                        </div>
                        {countdownBadge}
                      </div>

                      {/* قيمة التوزيع والعائد */}
                      <div style={{ background: 'var(--panel-solid)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span style={{ color: 'var(--muted)' }}>توزيع السهم: <span style={{ color: 'var(--txt)' }}>{divValueStr}</span></span>
                        <span style={{ color: 'var(--good)' }}>العائد: {s.div.yld}</span>
                      </div>

                      {/* متتبع المراحل الرأسي المصغر */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
                        {/* خطوة 1: توصية الأرباح */}
                        <div className="timeline-step">
                          <div className="timeline-dot completed" />
                          <div className="timeline-content">
                            <span>توصية مجلس الإدارة</span>
                            <div style={{ fontSize: '9.5px', color: 'var(--muted2)' }}>موافقة رسمية معلنة</div>
                          </div>
                        </div>

                        {/* خطوة 2: تاريخ الاستحقاق */}
                        <div className="timeline-step">
                          <div className={`timeline-dot ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`} />
                          <div className={`timeline-content ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`}>
                            <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>تاريخ الاستحقاق (Ex-Date)</span>
                              <b style={{ color: '#ff6b00' }}>{s.div.exd ?? 'قريباً'}</b>
                            </span>
                          </div>
                        </div>

                        {/* خطوة 3: تاريخ الدفع والتوزيع */}
                        <div className="timeline-step">
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>تاريخ توزيع الأرباح (Pay)</span>
                              <span>{s.div.pay ?? 'منتظر'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* زر تذكيري بالتقويم التفاعلي البديع */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerToast(`تم تفعيل التذكير لشركة ${s.sym} وإضافته لتقويمك بنجاح! 🔔`);
                        }}
                        style={{
                          width: '100%',
                          border: '1px solid rgba(255, 107, 0, 0.25)',
                          background: 'rgba(255, 107, 0, 0.05)',
                          color: '#ff6b00',
                          padding: '6px 0',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 0, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 0, 0.05)'; }}
                      >
                        <span>🔔</span> ذكّرني بالتوزيع
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. إشعارات وأحداث الشركات المباشرة (Live Corporate Actions) */}
          <div className="o-widget" style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '8px', marginBottom: '12px' }}>
              <h4 className="o-widget-h" style={{ margin: 0, border: 0, padding: 0 }}>🔔 إجراءات وأحداث الشركات</h4>
              <span className="live-badge-pulse" title="متابعة فورية ومستمرة لإجراءات الشركات في سوق الإمارات">
                <span className="pulse-dot" />
                مباشر
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
              {liveActions.map((act) => {
                const realStock = DATA.find(s => s.sym.toUpperCase() === act.sym.toUpperCase());
                
                // Color-coded borders based on action type
                let typeColor = 'var(--brand)';
                if (act.type === 'approval') typeColor = 'var(--good)';
                if (act.type === 'date') typeColor = 'var(--warn)';
                if (act.type === 'payout') typeColor = 'var(--brand)';
                if (act.type === 'news') typeColor = 'var(--brand2)';

                return (
                  <div 
                    key={act.id}
                    onClick={() => realStock && onOpen(realStock)}
                    className="o-action-item"
                    style={{ opacity: realStock ? 1 : 0.8 }}
                  >
                    {/* Color bar */}
                    <div className="o-action-type-line" style={{ background: typeColor }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {realStock ? (
                        <Avatar sym={realStock.sym} size={20} />
                      ) : (
                        <span style={{ fontSize: '12px' }}>🏢</span>
                      )}
                      <span style={{ fontWeight: 800, fontSize: '11.5px', color: 'var(--txt)' }}>
                        {realStock ? realStock.name.split('—')[0] : act.sym}
                      </span>
                      <span style={{ 
                        fontSize: '9.5px', 
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        background: `${typeColor}15`, 
                        color: typeColor,
                        fontWeight: 800,
                        marginInlineStart: 'auto',
                        border: `1px solid ${typeColor}30`
                      }}>
                        {act.badge}
                      </span>
                    </div>
                    
                    <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.45', fontWeight: 600 }}>
                      {act.title}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--muted2)', marginTop: '4px', borderTop: '1px dashed var(--line)', paddingTop: '4px' }}>
                      <span>🕒 {act.time}</span>
                      <span>{realStock ? `رمز السهم: ${realStock.sym}` : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.85)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '20px',
          zIndex: 10000,
          fontSize: '12.5px',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255, 107, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fade-in-toast 0.25s ease-out'
        }}>
          <span>🔔</span> {toastMessage}
        </div>
      )}
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
