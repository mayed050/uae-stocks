import { useState, useEffect, useMemo } from 'react'
import {
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts'
import type { Stock } from '@/data'
import type { View } from '@/components/Sidebar'
import { useStocks, useMarketStats, usePortfolio } from '@/store'
import { parseYield, parseAmount } from '@/format'
import Avatar from '@/components/Avatar'
import { ADX_MOVEMENTS } from '@/data/movements'
import { getDailyData, generateHistoricalData, generateSparklineData } from '@/market'
import { PALETTE, TIP_STYLE as tipStyle } from '@/constants/ui'
import MarketIndexCards from './MarketIndexCards'
import LiveActionsFeed from './LiveActionsFeed'
import SimBadge from '@/components/ui/SimBadge'
import MarketKpiStrip from './MarketKpiStrip'
import MarketLeaders from './MarketLeaders'
import DividendMonthsCard from './DividendMonthsCard'
import PageHeader from '@/components/ui/PageHeader'
import './overview.css'

function fmtTradingValue(val: number) {
  if (val >= 1e6) {
    return `${(val / 1e6).toFixed(2)} مليون د.إ`
  }
  if (val >= 1e3) {
    return `${(val / 1e3).toFixed(1)} ألف د.إ`
  }
  return `${val.toFixed(0)} د.إ`
}

export default function Overview({ onOpen, onNavigate }: { onOpen: (s: Stock) => void; onNavigate?: (v: View) => void }) {
  const { stocks: DATA } = useStocks()
  const {
    stats,
    alertRows,
    sectorData,
    maxYield,
    maxMcap,
    yieldLeaders,
    marketGiants,
    valuationOpportunities,
    monthData,
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
    const stocksWithData = DATA.map(s => {
      const d = getDailyData(s)
      return { s, d, pctNum: parseFloat(d.pct.replace('%', '')) }
    })

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

      <PageHeader title="نظرة عامة على الأسهم والأسواق">
        لوحة معلوماتية مالية شاملة لـ {DATA.length} سهمًا مدرجاً في سوق دبي المالي وسوق أبوظبي للأوراق المالية
      </PageHeader>

      {/* شريط مؤشرات الأداء العلوي — ملخّص السوق في أربعة أرقام */}
      <MarketKpiStrip stats={stats} />

      <div className="overview-layout">
        {/* العمود الأيمن الرئيسي (المحتوى التفاعلي والبياني 70%) */}
        <div className="overview-main">

          {/* 📊 بطاقة نشاط مؤشرات الأسواق والنشاط اليومي */}
          <MarketIndexCards marketActivity={marketActivity} />

          {/* قسم التحليل والرسوم البيانية الهيكلية وتوزيع القطاعات */}
          <div className="chart-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '20px' }}>
            {/* توزيع القطاعات */}
            <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <h3 className="panel-h" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>
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
                      <Tooltip contentStyle={tipStyle} formatter={(val, name) => [`${String(val)} شركات مدرجة`, name]} />
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

            {/* بطاقة ازدحام شهور التوزيعات */}
            <DividendMonthsCard data={monthData} />
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
                  <ResponsiveContainer width="100%" height={250}>
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
                  <SimBadge title="التغيّرات والأحجام والصفقات هنا قيم توضيحية مُولّدة خوارزمياً للعرض، وليست تداولاً حقيقياً لحظياً.">بيانات توضيحية</SimBadge>
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

          {/* لوحات المتصدّرين: العوائد · العمالقة · فرص التقييم */}
          <MarketLeaders
            yieldLeaders={yieldLeaders}
            marketGiants={marketGiants}
            valuationOpportunities={valuationOpportunities}
            onOpen={onOpen}
          />
          
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
            {onNavigate && (
              <button
                onClick={() => onNavigate('dividends')}
                style={{ width: '100%', marginTop: '10px', border: '1px solid var(--line)', background: 'var(--chip)', color: 'var(--brand)', padding: '8px 0', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                عرض كل تواريخ التوزيعات ↗
              </button>
            )}
          </div>

          {/* 3. إشعارات وأحداث الشركات (عرض تجريبي) */}
          <LiveActionsFeed actions={liveActions} stocks={DATA} onOpen={onOpen} />

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

