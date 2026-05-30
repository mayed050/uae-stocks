import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import type { Stock } from '../data'
import { scores, AXIS_LABEL } from '../format'

export default function Snowflake({
  items,
  height = 240,
}: {
  items: { stock: Stock; color: string }[]
  height?: number
}) {
  const keys: (keyof ReturnType<typeof scores>)[] = ['yield', 'value', 'growth', 'stability', 'size']
  const data = keys.map((k) => {
    const row: Record<string, number | string> = { axis: AXIS_LABEL[k] }
    items.forEach(({ stock }) => {
      row[stock.sym] = scores(stock)[k]
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <defs>
          {items.map(({ stock, color }) => {
            const id = `grad-${stock.sym}`;
            return (
              <radialGradient id={id} cx="50%" cy="50%" r="50%" fx="50%" fy="50%" key={stock.sym}>
                <stop offset="0%" stopColor={color} stopOpacity={0.08} />
                <stop offset="100%" stopColor={color} stopOpacity={0.45} />
              </radialGradient>
            );
          })}
        </defs>
        <PolarGrid stroke="var(--line)" strokeDasharray="3 3" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--muted)', fontSize: 11, fontWeight: 800 }} />
        {items.map(({ stock, color }) => {
          const gradId = `grad-${stock.sym}`;
          return (
            <Radar
              key={stock.sym}
              name={stock.sym}
              dataKey={stock.sym}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              dot={{ r: 4, strokeWidth: 2, fill: 'var(--panel)', stroke: color }}
              activeDot={{ r: 6 }}
            />
          );
        })}
      </RadarChart>
    </ResponsiveContainer>
  )
}
