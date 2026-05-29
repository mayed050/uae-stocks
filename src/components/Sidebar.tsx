export type View = 'overview' | 'screener' | 'dividends' | 'compare' | 'portfolio'

const NAV: { v: View; label: string; icon: string }[] = [
  { v: 'overview', label: 'نظرة عامة', icon: '📊' },
  { v: 'screener', label: 'مستكشف الأسهم', icon: '🔎' },
  { v: 'dividends', label: 'التوزيعات', icon: '💵' },
  { v: 'compare', label: 'المقارنة', icon: '⚖️' },
  { v: 'portfolio', label: 'حاسبة المحفظة', icon: '💼' },
]

export default function Sidebar({
  view,
  setView,
  dark,
  toggleTheme,
}: {
  view: View
  setView: (v: View) => void
  dark: boolean
  toggleTheme: () => void
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">UAE</span>
        <div style={{ flex: 1 }}>
          <div className="brand-title">منصة الأسهم الإماراتية</div>
          <div className="brand-sub">دبي · أبوظبي</div>
        </div>
        <button className="theme-toggle-btn" onClick={toggleTheme} title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.v}
            className={'navitem' + (view === n.v ? ' active' : '')}
            onClick={() => setView(n.v)}
          >
            <span className="navicon">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-note">بيانات 28 مايو 2026 — للمعلومات فقط</div>
      </div>
    </aside>
  )
}
