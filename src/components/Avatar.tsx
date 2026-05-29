import { symColor } from '../format'

export default function Avatar({ sym, size = 40 }: { sym: string; size?: number }) {
  const label = sym.slice(0, 3)
  return (
    <span
      className="avatar"
      style={{
        background: symColor(sym),
        width: size,
        height: size,
        fontSize: size * 0.32,
      }}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}
