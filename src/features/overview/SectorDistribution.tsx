import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { PALETTE, TIP_STYLE as tipStyle } from '@/constants/ui'

/** لوحة توزيع هيكل السوق حسب القطاعات (مخطط دائري + مفتاح ألوان). */
export default function SectorDistribution({ sectorData }: { sectorData: { name: string; value: number }[] }) {
  return (
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
  )
}
