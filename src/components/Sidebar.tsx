import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { NAV } from './nav'
import { useStocks, useUiStore } from '@/store'

export type { View } from './nav'

export default function Sidebar() {
  const { lastUpdated } = useStocks()
  const openPalette = useUiStore((s) => s.setPaletteOpen)
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

      <button className="palette-trigger" onClick={() => openPalette(true)} aria-keyshortcuts="Control+K Meta+K /">
        <Search size={16} aria-hidden />
        <span className="pt-label">بحث سريع…</span>
        <kbd className="pt-kbd" dir="ltr" aria-hidden>Ctrl K</kbd>
      </button>

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
