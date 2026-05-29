import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LabelList,
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
  const stats = useMemo(() => {
    const yields = DATA.map((s) => parseYield(s.div.yld)).filter((x): x is number => x !== null)
    const avgYield = yields.reduce((a, b) => a + b, 0) / yields.length
    const covMcap = DATA.map((s) => parseAmount(s.mcap)).filter((x): x is number => x !== null)
    const totalMcap = covMcap.reduce((a, b) => a + b, 0)
    return {
      dfm: DATA.filter((s) => s.ex === 'DFM').length,
      adx: DATA.filter((s) => s.ex === 'ADX').length,
      avgYield,
      totalMcap,
      mcapCount: covMcap.length,
    }
  }, [DATA])

  const alertRows = useMemo(
    () =>
      DATA.map((s) => ({ s, u: upcoming(s) }))
        .filter((r): r is { s: Stock; u: Upcoming } => r.u !== null && isAlert(r.u))
        .sort((a, b) => (a.u.n ?? 9999) - (b.u.n ?? 9999)),
    [DATA],
  )

  const sectorData = useMemo(() => {
    const m = new Map<string, number>()
    DATA.forEach((s) => m.set(s.sector, (m.get(s.sector) ?? 0) + 1))
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [DATA])

  const yieldData = useMemo(
    () =>
      DATA.map((s) => ({ sym: s.sym, y: parseYield(s.div.yld) }))
        .filter((d): d is { sym: string; y: number } => d.y !== null)
        .sort((a, b) => b.y - a.y)
        .slice(0, 8),
    [DATA],
  )

  const peData = useMemo(
    () =>
      DATA.filter((s) => s.pe !== null)
        .map((s) => ({ sym: s.sym, pe: s.pe as number }))
        .sort((a, b) => a.pe - b.pe),
    [DATA],
  )

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

  const heat = useMemo(
    () =>
      DATA.map((s) => ({ s, y: parseYield(s.div.yld) }))
        .sort((a, b) => (b.y ?? -1) - (a.y ?? -1)),
    [DATA],
  )
  const maxY = Math.max(...heat.map((h) => h.y ?? 0))

  return (
    <div className="view">
      <div className="page-head">
        <h1>نظرة عامة على السوق</h1>
        <p>
          ملخّص مالي لـ {DATA.length} سهمًا في سوقي دبي وأبوظبي
          {lastUpdated && (
            <span className="updated"> · آخر تحديث آلي: {new Date(lastUpdated).toLocaleString('ar-AE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          )}
        </p>
      </div>

      <div className="stats">
        <StatCard n={DATA.length} l="الأسهم المتابَعة" sub={`${stats.dfm} دبي · ${stats.adx} أبوظبي`} />
        <StatCard n={`${stats.avgYield.toFixed(1)}%`} l="متوسط العائد النقدي" sub="للأسهم المُعلنة" />
        <StatCard n={fmtAmount(stats.totalMcap)} l="إجمالي القيمة السوقية" sub={`${stats.mcapCount} أسهم مغطّاة`} />
        <StatCard n={alertRows.length} l="تنبيهات استحقاق قريبة" sub="≤ 30 يومًا" alert={alertRows.length > 0} />
      </div>

      <div className="chart-grid">
        <div className="panel">
          <h3 className="panel-h">توزيع القطاعات</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {sectorData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--panel-solid)" />
                ))}
              </Pie>
              <Tooltip contentStyle={tipStyle} formatter={(val, name) => [`${val} أسهم`, name]} />
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

        <div className="panel">
          <h3 className="panel-h">أعلى العوائد النقدية (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yieldData} layout="vertical" margin={{ right: 28, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--line)" />
              <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis type="category" dataKey="sym" width={84} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Tooltip contentStyle={tipStyle} formatter={(val) => [`${val}%`, 'العائد']} />
              <Bar dataKey="y" fill="#21c98b" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="y" position="right" formatter={(val) => `${val}%`} fill="var(--txt)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="panel-h">مكرر الربحية (P/E)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peData} margin={{ top: 18 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="sym" tick={{ fill: 'var(--muted)', fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Tooltip contentStyle={tipStyle} formatter={(val) => [val, 'P/E']} />
              <Bar dataKey="pe" fill="#3aa0ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="panel-h">كثافة تواريخ التوزيعات عبر السنة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthData} margin={{ top: 18 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="m" tick={{ fill: 'var(--muted)', fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Tooltip contentStyle={tipStyle} formatter={(val) => [`${val} حدث`, 'التواريخ']} />
              <Bar dataKey="count" fill="#7c5cff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="sec"><span className="dot" /> خريطة العوائد الحرارية</h2>
      <div className="heatmap">
        {heat.map(({ s, y }) => {
          const ratio = y === null ? 0 : y / maxY
          return (
            <button
              key={s.sym}
              className="heat-cell"
              onClick={() => onOpen(s)}
              style={{ background: y === null ? 'var(--chip)' : `rgba(33,201,139,${0.15 + ratio * 0.75})` }}
              title={`${s.name} — ${s.div.yld ?? 'العائد غير معلن'}`}
            >
              <span className="heat-sym">{s.sym}</span>
              <span className="heat-y">{y === null ? '—' : `${y}%`}</span>
            </button>
          )
        })}
      </div>

      {alertRows.length > 0 && (
        <>
          <h2 className="sec"><span className="dot" /> تنبيهات الاستحقاق القريبة</h2>
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
