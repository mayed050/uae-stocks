import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Stock } from '../data'
import { useStocks } from '../store'
import { upcoming, isAlert, parseISO } from '../lib'
import type { Upcoming } from '../lib'
import { parseYield, parseAmount, fmtAmount, MONTHS_AR } from '../format'
import Avatar from '../components/Avatar'

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

export default function Overview({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA, lastUpdated } = useStocks()
  
  // التحكم بنوع خريطة السوق الحرارية
  const [heatmapMetric, setHeatmapMetric] = useState<'yield' | 'pe' | 'mcap'>('yield')

  // 1. حساب إحصائيات السوق الكلية
  const stats = useMemo(() => {
    const yields = DATA.map((s) => parseYield(s.div.yld)).filter((x): x is number => x !== null)
    const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0
    const covMcap = DATA.map((s) => parseAmount(s.mcap)).filter((x): x is number => x !== null)
    const totalMcap = covMcap.reduce((a, b) => a + b, 0)

    const pes = DATA.map((s) => s.pe).filter((x): x is number => x !== null && x > 0)
    const avgPe = pes.length > 0 ? pes.reduce((a, b) => a + b, 0) / pes.length : 0

    return {
      dfm: DATA.filter((s) => s.ex === 'DFM').length,
      adx: DATA.filter((s) => s.ex === 'ADX').length,
      avgYield,
      totalMcap,
      mcapCount: covMcap.length,
      avgPe,
    }
  }, [DATA])

  // 2. تصفية التنبيهات القريبة
  const alertRows = useMemo(
    () =>
      DATA.map((s) => ({ s, u: upcoming(s) }))
        .filter((r): r is { s: Stock; u: Upcoming } => r.u !== null && isAlert(r.u))
        .sort((a, b) => (a.u.n ?? 9999) - (b.u.n ?? 9999)),
    [DATA],
  )

  // 3. عمالقة السوق الإماراتي (أعلى 5 شركات قيمة سوقية)
  const marketGiants = useMemo(() => {
    return [...DATA]
      .map(s => ({ s, mc: parseAmount(s.mcap) ?? 0 }))
      .sort((a, b) => b.mc - a.mc)
      .slice(0, 5)
  }, [DATA])

  // 4. أفضل فرص التقييم (أرخص 5 شركات بمكرر ربحية P/E)
  const valuationOpportunities = useMemo(() => {
    return [...DATA]
      .filter(s => s.pe !== null && s.pe > 0)
      .sort((a, b) => (a.pe ?? 999) - (b.pe ?? 999))
      .slice(0, 5)
  }, [DATA])

  // 5. قادة عوائد التوزيعات النقدية (أعلى 5 شركات عائداً)
  const yieldLeaders = useMemo(() => {
    return [...DATA]
      .map(s => ({ s, yld: parseYield(s.div.yld) ?? 0 }))
      .filter(x => x.yld > 0)
      .sort((a, b) => b.yld - a.yld)
      .slice(0, 5)
  }, [DATA])

  // 6. توزيع القطاعات في السوق
  const sectorData = useMemo(() => {
    const m = new Map<string, number>()
    DATA.forEach((s) => m.set(s.sector, (m.get(s.sector) ?? 0) + 1))
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [DATA])

  // 7. كثافة تواريخ التوزيعات عبر السنة
  const monthData = useMemo(() => {
    const counts = new Array(12).fill(0)
    DATA.forEach((s) => {
      ;[s.div.exd, s.div.nextExd, s.div.pay, s.div.nextPay].forEach((d) => {
        const dt = parseISO(d ?? null)
        if (dt) counts[dt.getMonth()]++
      })
    })
    return MONTHS_AR.map((m, i) => ({ m, count: counts[i] }))
  }, [DATA])

  // 8. حسابات خريطة السوق الحرارية الذكية
  const maxYield = useMemo(() => Math.max(...DATA.map(s => parseYield(s.div.yld) ?? 0)), [DATA])
  const maxMcap = useMemo(() => Math.max(...DATA.map(s => parseAmount(s.mcap) ?? 0)), [DATA])

  return (
    <div className="view">
      <style>{`
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
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '16px', margin: '14px 0 34px' }}>
        
        {/* 1. عمالقة السوق */}
        <div className="panel">
          <h3 className="panel-h">👑 عمالقة السوق (حجم الشركة)</h3>
          <div className="o-lead-list">
            {marketGiants.map(({ s }) => (
              <div key={s.sym} className="o-lead-item" onClick={() => onOpen(s)}>
                <Avatar sym={s.sym} size={28} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name.split('—')[0]}</div>
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
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name.split('—')[0]}</div>
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
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name.split('—')[0]}</div>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', margin: '34px 0 14px' }}>
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

      <div className="heatmap">
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

      {/* تنبيهات الاستحقاق القريبة */}
      {alertRows.length > 0 && (
        <>
          <h2 className="sec"><span className="dot" style={{ background: 'var(--bad)' }} /> تنبيهات الاستحقاق القريبة (استبعاد / دفع)</h2>
          <div className="alerts">
            {alertRows.map(({ s, u }) => (
              <button key={s.sym} className="alertbox clickable" onClick={() => onOpen(s)}>
                <div className="hd">
                  <Avatar sym={s.sym} size={32} />
                  <span>{s.name} <span className="sym">({s.sym})</span></span>
                  <span className="exch">{s.ex}</span>
                </div>
                <small>
                  {u.label} — {u.n === null ? (u.payHint ? `الدفع المتوقع: ${u.payHint}` : 'التاريخ لم يُعلن') : u.n === 0 ? 'اليوم' : `خلال ${u.n} يوم`}
                  {u.ps ? ` · ${u.ps}` : ''}
                </small>
              </button>
            ))}
          </div>
        </>
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
