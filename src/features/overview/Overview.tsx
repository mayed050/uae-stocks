import { useState, useEffect, useMemo } from 'react'
import {
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts'
import type { Stock } from '@/data'
import type { View } from '@/components/Sidebar'
import { useStocks, useMarketStats, usePortfolio, useHistory } from '@/store'
import { parseYield, parseAmount } from '@/format'
import Avatar from '@/components/Avatar'
import { ADX_MOVEMENTS } from '@/data/movements'
import { getDailyData, generateHistoricalData, generateSparklineData, realHistory } from '@/market'
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
  const histMap = useHistory()
  
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
    // DATA هي بيانات البذرة المضمّنة وغير فارغة دائماً؛ التأكيد يطابق افتراض التطبيق القائم.
    const s = DATA.find(st => st.sym.toUpperCase() === selectedChartSym.toUpperCase()) ?? DATA[0]!
    const realPts = histMap[s.sym]
    const isReal = Array.isArray(realPts) && realPts.length > 1
    const history = isReal
      ? realHistory(realPts, chartTimeframe, s.price ?? 1.0)
      : generateHistoricalData(s.sym, chartTimeframe, s.price ?? 1.0)
    return {
      stock: s,
      isReal,
      ...history
    }
  }, [DATA, selectedChartSym, chartTimeframe, histMap])

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
      if (!item) return
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
          <div className="chart-grid o-sector-grid">
            {/* توزيع القطاعات */}
            <div className="panel o-sector-panel">
              <h3 className="panel-h o-h-underline">
                📊 توزيع هيكل السوق حسب القطاعات
              </h3>
              <div className="o-sector-wrap">
                <div className="o-sector-chart">
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
                <div className="legend o-sector-legend">
                  {sectorData.map((d, i) => (
                    <span key={d.name} className="legend-item">
                      <i style={{ background: PALETTE[i % PALETTE.length] }} />
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
          <div className="panel o-chart-panel">
            <div className="chart-dashboard-container">

              {/* القسم الأيسر: الرسم البياني والمؤشرات الفنية (يمثل 70% من العرض) */}
              <div className="chart-dashboard-left">

                {/* رأس لوحة الرسم البياني (اسم السهم وتفاصيل التغير المؤقتة والفترات الزمنية) */}
                <div className="o-chart-head">
                  <div>
                    <h3 className="o-chart-title">
                      <Avatar sym={selectedChartStock.stock.sym} size={28} />
                      {selectedChartStock.stock.sym} — {selectedChartStock.stock.name.split('—')[0]}
                      {selectedChartStock.isReal ? (
                        <span title="أسعار إغلاق تاريخية حقيقية (سنة) من Yahoo Finance." className="o-real-badge">● تاريخ حقيقي</span>
                      ) : (
                        <SimBadge title="السعر الحالي والتغيّر اليومي حقيقيان؛ سلسلة الأسعار التاريخية لهذا السهم (أبوظبي) توضيحية مُولّدة للعرض فقط.">التاريخ توضيحي</SimBadge>
                      )}
                    </h3>
                    <div className="o-price-row">
                      <span className="o-price-big">
                        {selectedChartStock.stock.price?.toFixed(2)} د.إ
                      </span>
                      <span className={'o-price-change ' + (selectedChartStock.isOverallUp ? 'up' : 'down')}>
                        {selectedChartStock.isOverallUp ? '▲' : '▼'} {selectedChartStock.change.toFixed(2)} ({selectedChartStock.changePct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* أزرار تحديد المدى الزمني للرسم البياني */}
                  <div className="o-tf-group">
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
                <div className="o-chart-area">
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
                <div className="o-chart-stats">

                  {/* العمود الأيمن: مؤشرات الأسعار الفنية */}
                  <div className="o-stat-col">
                    <div className="o-kv">
                      <span className="k">الأعلى سعر:</span>
                      <b>{selectedChartStock.high.toFixed(2)} د.إ</b>
                    </div>
                    <div className="o-kv">
                      <span className="k">الأدنى سعر:</span>
                      <b>{selectedChartStock.low.toFixed(2)} د.إ</b>
                    </div>
                    <div className="o-kv">
                      <span className="k">سعر الافتتاح:</span>
                      <b>{selectedChartStock.open.toFixed(2)} د.إ</b>
                    </div>
                    <div className="o-kv nb">
                      <span className="k">إغلاق السهم الحالي:</span>
                      <b>{selectedChartStock.close.toFixed(2)} د.إ</b>
                    </div>
                  </div>

                  {/* العمود الأيسر: مؤشرات التغير والعوائد */}
                  <div className="o-stat-col">
                    <div className="o-kv">
                      <span className="k">مقدار التغير اليومي:</span>
                      <b className={selectedChartStock.stock.price !== null && getDailyData(selectedChartStock.stock).change >= 0 ? 'up' : 'down'}>
                        {selectedChartStock.stock.price !== null ? (getDailyData(selectedChartStock.stock).change >= 0 ? '+' : '') : ''}{selectedChartStock.stock.price !== null ? getDailyData(selectedChartStock.stock).change.toFixed(2) : '—'}
                      </b>
                    </div>
                    <div className="o-kv">
                      <span className="k">نسبة التغير اليومي:</span>
                      <b className={selectedChartStock.stock.price !== null && getDailyData(selectedChartStock.stock).change >= 0 ? 'up' : 'down'}>
                        {getDailyData(selectedChartStock.stock).pct}
                      </b>
                    </div>
                    <div className="o-kv nb">
                      <span className="k">العائد النقدي (%) الحالي:</span>
                      <b className="good">{selectedChartStock.stock.div.yld ?? '—'}</b>
                    </div>
                  </div>

                </div>

              </div>

              {/* القسم الأيمن: قائمة اختيار ومتابعة الأسهم التفاعلية مع شارات الحركة Sparklines */}
              <div className="chart-dashboard-right">
                <div className="o-spark-head">
                  <b>الأسهم القيادية المتاحة</b>
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
                      <div className="o-spark-row">
                        <span className="o-spark-sym">{stock.sym}</span>
                        <span className="o-spark-price">{stock.price?.toFixed(2)} د.إ</span>
                      </div>

                      <div className="o-spark-row m2">
                        <span className="o-spark-name">{stock.name.split('—')[0]}</span>

                        {/* Sparkline رسم بياني خطي مصغر */}
                        <div className="o-spark-mini">
                          <svg width="40" height="15" className="o-spark-svg">
                            <polyline
                              fill="none"
                              stroke={stockDaily.isUp ? 'var(--good)' : 'var(--bad)'}
                              strokeWidth="1.5"
                              points={normalizedPoints}
                            />
                          </svg>
                          <span className={'o-spark-pct ' + (stockDaily.isUp ? 'up' : 'down')}>
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
          <div className="panel o-movement-panel">
            <div className="o-mv-head">
              <div>
                <h3 className="o-mv-title">
                  🟠 حركة السوق
                  <SimBadge title="الأسعار والتغيّر والحجم وقيمة التداول حقيقية من TradingView/Yahoo؛ «عدد الصفقات» فقط تقديري.">الصفقات تقديرية</SimBadge>
                </h3>
                <p className="o-mv-sub">
                  قائمة مرتبة حسب {
                    movementTab === 'gainers' ? 'الأسهم المرتفعة' :
                    movementTab === 'losers' ? 'الأسهم المنخفضة' :
                    movementTab === 'volume' ? 'النشطة بالكمية' :
                    'النشطة بالقيمة'
                  }
                </p>
              </div>

              {/* تبويبات الفرز والتصفية المطبقة للهوية البصرية الفاخرة */}
              <div className="o-mv-tabs">
                {([['gainers', 'المرتفعة'], ['losers', 'المنخفضة'], ['volume', 'النشطة بالكمية'], ['value', 'النشطة بالقيمة']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setMovementTab(key)}
                    className={'o-mv-tab' + (movementTab === key ? ' active' : '')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* الجدول التفاعلي الفاخر لحركة السوق */}
            <div className="o-mv-tablewrap">
              <table className="o-mv-table">
                <thead>
                  <tr>
                    <th className="al-r">الشركة</th>
                    <th className="al-c">السعر</th>
                    <th className="al-c">التغير</th>
                    <th className="al-c">مكرر الربحية</th>
                    <th className="al-c">العائد النقدي</th>
                    <th className="al-c">عدد الصفقات</th>
                    <th className="al-l">قيمة التداول</th>
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
                      >
                        {/* عمود الشركة */}
                        <td className="o-mv-company">
                          <Avatar sym={s.sym} size={32} />
                          <div>
                            <span className="o-mv-sym">{s.sym}</span>
                            <span className="o-mv-name">{s.name.split('—')[0]}</span>
                          </div>
                          {isInPortfolio(s.sym) && <span title="في محفظتك" className="o-mv-pf">💼</span>}
                        </td>

                        {/* عمود السعر */}
                        <td className="o-mv-num">
                          {priceFormatted}
                        </td>

                        {/* عمود التغير */}
                        <td className={'o-mv-change ' + (d.isFlat ? 'flat' : d.isUp ? 'up' : 'down')}>
                          {d.isUp ? `+` : ''}{d.pct}
                        </td>

                        {/* عمود مكرر الربحية */}
                        <td className="o-mv-mut">
                          {peFormatted}
                        </td>

                        {/* عمود العائد النقدي (مقترح يدعم موضوع التطبيق) */}
                        <td className="o-mv-yield">
                          {yieldFormatted}
                        </td>

                        {/* عمود عدد الصفقات (مطلوب) */}
                        <td className="o-mv-mut">
                          {tradesFormatted}
                        </td>

                        {/* عمود قيمة التداول */}
                        <td className="o-mv-val">
                          {valueFormatted}
                        </td>
                      </tr>
                    );
                  })}

                  {movementStocks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="o-mv-empty">
                        لا توجد أسهم تطابق التصفية الحالية.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* خريطة السوق الحرارية التفاعلية الفاخرة */}
          <div className="o-heat-head">
            <h2 className="sec flush">
              <span className="dot brand2" /> خريطة السوق الحرارية التفاعلية
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

          <div className="heatmap o-heat-grid">
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
                  style={{ background: cellBg }}
                  title={titleText}
                >
                  <span className="heat-sym">{s.sym}</span>
                  <span className="heat-y">{labelText}</span>
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
            <div className="o-widget-head">
              <h4 className="o-widget-h">📊 أسعار الشركات</h4>
              <div className="o-mkt-tabs">
                <button
                  onClick={() => setMarketTab('dubai')}
                  className={'o-mkt-tab' + (marketTab === 'dubai' ? ' active' : '')}
                >
                  دبي
                </button>
                <button
                  onClick={() => setMarketTab('adx')}
                  className={'o-mkt-tab' + (marketTab === 'adx' ? ' active' : '')}
                >
                  أبوظبي
                </button>
              </div>
            </div>

            {marketTab === 'dubai' ? (
              <div className="o-prices-scroll">
                <table className="o-mini-table">
                  <thead>
                    <tr>
                      <th className="al-r">الاسم</th>
                      <th className="al-c">السعر</th>
                      <th className="al-l">التغير</th>
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
                        >
                          <td className="o-mini-td">
                            <span className="o-mini-name">{realStock.name.split('—')[0]}</span>
                            <span className="o-mini-sym">{realStock.sym}</span>
                          </td>
                          <td className="o-mini-price">
                            {realStock.price !== null ? realStock.price.toFixed(2) : '—'}
                          </td>
                          <td className={'o-mini-change ' + (d.isFlat ? 'flat' : d.isUp ? 'up' : 'down')}>
                            {d.pct}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <table className="o-mini-table">
                <thead>
                  <tr>
                    <th className="al-r">الاسم</th>
                    <th className="al-c">السعر</th>
                    <th className="al-l">التغير</th>
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
                      >
                        <td className="o-mini-td">
                          <span className="o-mini-name">{realStock.name.split('—')[0]}</span>
                          <span className="o-mini-sym">{realStock.sym}</span>
                        </td>
                        <td className="o-mini-price">
                          {realStock.price !== null ? realStock.price.toFixed(2) : '—'}
                        </td>
                        <td className={'o-mini-change ' + (d.isFlat ? 'flat' : d.isUp ? 'up' : 'down')}>
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
          <div className="o-widget">
            <div className="o-widget-head">
              <h4 className="o-widget-h">📅 متتبع توزيعات الأرباح</h4>

              {/* شريط الفلتر المطور (الكل مقابل محفظتي) */}
              <div className="o-filter-tabs">
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackerFilter('all'); }}
                  className={'o-filter-tab' + (trackerFilter === 'all' ? ' active' : '')}
                >
                  الكل
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackerFilter('portfolio'); }}
                  className={'o-filter-tab' + (trackerFilter === 'portfolio' ? ' active' : '')}
                >
                  محفظتي 💼
                </button>
              </div>
            </div>

            <div className="o-tracker-list">
              {filteredAlertRows.length === 0 ? (
                <div className="o-tracker-empty">
                  {trackerFilter === 'portfolio' ? 'لا توجد توزيعات قريبة للشركات المدرجة في محفظتك.' : 'لا توجد تواريخ استحقاق قريبة حالياً.'}
                </div>
              ) : (
                filteredAlertRows.slice(0, 4).map(({ s, u }) => {
                  const daysLeft = u.n;
                  let countdownBadge;

                  if (daysLeft === null) {
                    countdownBadge = <span className="o-cd exp">متوقع</span>;
                  } else if (daysLeft === 0) {
                    countdownBadge = <span className="o-cd today">اليوم! 🎉</span>;
                  } else if (daysLeft < 7) {
                    countdownBadge = <span className="o-cd soon">باقي {daysLeft} أيام ⏳</span>;
                  } else {
                    countdownBadge = <span className="o-cd future">بعد {daysLeft} يوم</span>;
                  }

                  const divValueStr = s.div.ps ?? 'غير معلن';

                  return (
                    <div
                      key={s.sym}
                      onClick={() => onOpen(s)}
                      className="rowlink o-div-card"
                    >
                      {/* ترويسة بطاقة التوزيع */}
                      <div className="o-div-cardhead">
                        <div className="o-div-id">
                          <Avatar sym={s.sym} size={24} />
                          <div>
                            <span className="o-div-sym">{s.sym}</span>
                            <span className="o-div-ex">{s.ex}</span>
                          </div>
                        </div>
                        {countdownBadge}
                      </div>

                      {/* قيمة التوزيع والعائد */}
                      <div className="o-div-vals">
                        <span className="mut">توزيع السهم: <span className="txt">{divValueStr}</span></span>
                        <span className="good">العائد: {s.div.yld}</span>
                      </div>

                      {/* متتبع المراحل الرأسي المصغر */}
                      <div className="o-div-timeline">
                        {/* خطوة 1: توصية الأرباح */}
                        <div className="timeline-step">
                          <div className="timeline-dot completed" />
                          <div className="timeline-content">
                            <span>توصية مجلس الإدارة</span>
                            <div className="o-tl-sub">موافقة رسمية معلنة</div>
                          </div>
                        </div>

                        {/* خطوة 2: تاريخ الاستحقاق */}
                        <div className="timeline-step">
                          <div className={`timeline-dot ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`} />
                          <div className={`timeline-content ${daysLeft !== null && daysLeft >= 0 ? 'active' : ''}`}>
                            <span className="o-tl-row">
                              <span>تاريخ الاستحقاق (Ex-Date)</span>
                              <b className="o-tl-ex">{s.div.exd ?? 'قريباً'}</b>
                            </span>
                          </div>
                        </div>

                        {/* خطوة 3: تاريخ الدفع والتوزيع */}
                        <div className="timeline-step">
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <span className="o-tl-row">
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
                        className="o-remind-btn"
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
                className="o-viewall-btn"
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
        <div className="o-toast">
          <span>🔔</span> {toastMessage}
        </div>
      )}
    </div>
  )
}

