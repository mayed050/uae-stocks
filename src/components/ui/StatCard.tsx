import type { ReactNode, CSSProperties } from 'react'

/** بطاقة إحصائية موحّدة (رقم كبير + عنوان + سطر فرعي) — تستبدل تكرار بنية .stat. */
export default function StatCard({
  value,
  label,
  sub,
  color,
  style,
  valueStyle,
  className,
}: {
  value: ReactNode
  label: ReactNode
  sub?: ReactNode
  color?: string
  style?: CSSProperties
  valueStyle?: CSSProperties
  className?: string
}) {
  return (
    <div className={'stat' + (className ? ' ' + className : '')} style={style}>
      <div className="n" style={{ ...(color ? { color } : {}), ...valueStyle }}>{value}</div>
      <div className="l">{label}</div>
      {sub != null && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
