import { Link } from '@tanstack/react-router'
import { NAV } from './nav'
import { useStocks } from '@/store'

export type { View } from './nav'

export default function Sidebar() {
  const { lastUpdated } = useStocks()
  const dataDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('ar-AE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">UAE</span>
        <div style={{ flex: 1 }}>
          <div className="brand-title">منصة الأسهم الإماراتية</div>
          <div className="brand-sub">دبي · أبوظبي</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((n) => (
          <Link
            key={n.v}
            to={n.to}
            className="navitem"
            activeProps={{ className: 'active' }}
            activeOptions={{ exact: n.to === '/', includeSearch: false }}
          >
            <span className="navicon"><n.icon size={18} strokeWidth={2} aria-hidden /></span>
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-note">
          {dataDate ? `بيانات ${dataDate}` : 'البيانات المُضمّنة'} — للمعلومات فقط
        </div>
      </div>
    </aside>
  )
}
