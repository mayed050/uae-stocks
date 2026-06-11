import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LabelList
} from 'recharts'
import { fmtAmount } from '@/format'
import { PALETTE, TIP_STYLE as tipStyle } from '@/constants/ui'
import type { SectorSlice } from './portfolioCalcs'

/** الرسوم البيانية للمحفظة: توزيع القطاعات (دائري) والتدفق النقدي الشهري (أعمدة). */
export default function PortfolioCharts({
  sectorData,
  monthlyData,
  totalInvested,
}: {
  sectorData: SectorSlice[]
  monthlyData: { name: string; amount: number }[]
  totalInvested: number
}) {
  return (
    <div className="chart-grid">
      {/* مخطط القطاعات */}
      <div className="panel">
        <h3 className="panel-h">توزيع قطاعات المحفظة (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
              {sectorData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--panel-solid)" />
              ))}
            </Pie>
            <Tooltip contentStyle={tipStyle} formatter={(val) => [`${fmtAmount(Number(val))} درهم`, 'حجم الاستثمار']} />
          </PieChart>
        </ResponsiveContainer>
        <div className="legend">
          {sectorData.map((d, i) => (
            <span key={d.name} className="legend-item">
              <i style={{ background: PALETTE[i % PALETTE.length] }} />
              {d.name} ({Math.round((d.value / totalInvested) * 100)}%)
            </span>
          ))}
        </div>
      </div>

      {/* مخطط التدفق النقدي الشهري */}
      <div className="panel">
        <h3 className="panel-h">التدفق النقدي الشهري المتوقع للمحفظة (درهم)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 18 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={60} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <Tooltip contentStyle={tipStyle} formatter={(val) => [`${String(val)} درهم`, 'توزيعات مستلمة']} />
            <Bar dataKey="amount" fill="#7c5cff" radius={[6, 6, 0, 0]}>
              {monthlyData.some(d => d.amount > 0) && (
                <LabelList dataKey="amount" position="top" formatter={(val) => typeof val === 'number' && val > 0 ? String(val) : ''} fill="var(--txt)" fontSize={9} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
