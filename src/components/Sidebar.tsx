import { Link } from '@tanstack/react-router'
import { Moon, Search, Sun } from 'lucide-react'
import { NAV } from './nav'
import { useStocks, useUiStore } from '@/store'

export type { View } from './nav'

export default function Sidebar({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
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

      {/* أدوات: البحث السريع وتبديل السمة — صف تحت الشعار، وفي طرف الرأس على الجوال */}
      <div className="sidebar-tools">
        <button className="palette-trigger" onClick={() => openPalette(true)} aria-keyshortcuts="Control+K Meta+K /">
          <Search size={16} aria-hidden />
          <span className="pt-label">بحث سريع…</span>
          <kbd className="pt-kbd" dir="ltr" aria-hidden>Ctrl K</kbd>
        </button>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          aria-label={dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
        >
          {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
        </button>
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
