import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Stock } from '../data'
import { useStocks, useMarketStats, usePortfolio } from '../store'
import { fmtAmount, parseYield, parseAmount } from '../format'
import Avatar from '../components/Avatar'
import { SECTOR_MOVEMENTS, ADX_MOVEMENTS } from '../data/movements'
import type { MovementStock } from '../data/movements'

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
        .o-action-type-line {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: 4.5px;
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
