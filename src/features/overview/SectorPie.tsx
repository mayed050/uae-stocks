import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { PALETTE, TIP_STYLE as tipStyle } from '@/constants/ui'

/** المخطط الدائري لتوزيع القطاعات — حزمة مستقلة تُجلب بعد ظهور الصفحة (انظر components/lazy.ts). */
export default function SectorPie({ sectorData }: { sectorData: { name: string; value: number }[] }) {
  return (
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
  )
}
