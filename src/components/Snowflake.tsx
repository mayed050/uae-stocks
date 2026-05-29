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
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
        {items.map(({ stock, color }) => (
          <Radar
            key={stock.sym}
            name={stock.sym}
            dataKey={stock.sym}
            stroke={color}
            fill={color}
            fillOpacity={items.length > 1 ? 0.18 : 0.35}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  )
}
