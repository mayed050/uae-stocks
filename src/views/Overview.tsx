import { useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Stock } from '../data'
import { useStocks, useMarketStats, usePortfolio } from '../store'
import { fmtAmount, parseYield, parseAmount } from '../format'
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

  return (
    <div className="view">
      <style>{`
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
          
          {/* 1. مؤشرات أسواق الإمارات المحلية */}
          <div className="o-widget">
            <h4 className="o-widget-h">🇦🇪 مؤشرات الأسواق الإماراتية</h4>
            <div className="o-index-item">
              <span style={{ fontWeight: 700 }}>سوق دبي المالي (DFMGI)</span>
              <span style={{ color: 'var(--good)', fontWeight: 800 }}>4,285.40 (+0.45%) ▲</span>
            </div>
            <div className="o-index-item">
              <span style={{ fontWeight: 700 }}>سوق أبوظبي للأوراق المالية (ADI)</span>
              <span style={{ color: 'var(--bad)', fontWeight: 800 }}>9,142.15 (-0.24%) ▼</span>
            </div>
            <div className="o-index-item">
              <span style={{ color: 'var(--muted)' }}>متوسط عوائد التوزيعات:</span>
              <span style={{ fontWeight: 700, color: 'var(--good)' }}>{stats.avgYield.toFixed(2)}%</span>
            </div>
            <div className="o-index-item">
              <span style={{ color: 'var(--muted)' }}>متوسط مكرر الربحية:</span>
              <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{stats.avgPe.toFixed(1)}x</span>
            </div>
          </div>

          {/* 2. تغذية الأخبار وإفصاحات التوزيعات المحلية */}
          <div className="o-widget">
            <h4 className="o-widget-h">📢 أحدث إفصاحات وأخبار التوزيعات</h4>
            <div className="o-news-item">
              <div className="o-news-title">إعمار العقارية تعتمد توزيع أرباح نقدية مرحلية للمساهمين بقيمة 50 فلس للسهم.</div>
              <div className="o-news-meta">
                <span>سوق دبي المالي</span>
                <span>منذ ساعتين</span>
              </div>
            </div>
            <div className="o-news-item">
              <div className="o-news-title">ديوا (DEWA) تعلن تحويل التوزيعات النقدية لحسابات المساهمين البنكية بقيمة 3.1 فلس.</div>
              <div className="o-news-meta">
                <span>إفصاح رسمي</span>
                <span>منذ يوم واحد</span>
              </div>
            </div>
            <div className="o-news-item">
              <div className="o-news-title">أدنوك للغاز تقر توزيع أرباح إجمالية استثنائية بنسبة عائد تفوق 5.4% عن النصف الأول.</div>
              <div className="o-news-meta">
                <span>سوق أبوظبي</span>
                <span>منذ يومين</span>
              </div>
            </div>
            <div className="o-news-item">
              <div className="o-news-title">بنك أبوظبي الأول (FAB) يؤكد متانة مركزه المالي ويعلن جدول مناقشة أرباح المساهمين.</div>
              <div className="o-news-meta">
                <span>إفصاح بنكي</span>
                <span>منذ 3 أيام</span>
              </div>
            </div>
          </div>

          {/* 3. التنبيهات المباشرة القريبة (Mini Calendar) */}
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
