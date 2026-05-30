import { useState, useEffect } from 'react'
import type { Stock } from './data'
import Sidebar from './components/Sidebar'
import type { View } from './components/Sidebar'
import StockDetail from './components/StockDetail'

// الاستيراد المباشر (Static Imports) لضمان موثوقية كاملة بنسبة 100% وتفادي أخطاء تحميل الحزم الديناميكية على منصات Vercel و GitHub Pages 🚀
import Overview from './views/Overview'
import Screener from './views/Screener'
import Dividends from './views/Dividends'
import Compare from './views/Compare'
import Portfolio from './views/Portfolio'
import Financials from './views/Financials'

export default function App() {
  const [view, setView] = useState<View>('overview')
  const [detail, setDetail] = useState<Stock | null>(null)
  
  // الوضع الافتراضي هو الفاتح (false) ما لم يكن محفوظاً غير ذلك
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_preference')
    return saved ? saved === 'dark' : false
  })

  // حالة إخفاء التنويه
  const [disclaimerHidden, setDisclaimerHidden] = useState<boolean>(() => {
    return localStorage.getItem('disclaimer_dismissed') === 'true'
  })

  function dismissDisclaimer() {
    localStorage.setItem('disclaimer_dismissed', 'true')
    setDisclaimerHidden(true)
  }

  // مزامنة حالة السمة مع عنصر HTML و localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme_preference', dark ? 'dark' : 'light')
  }, [dark])

  function toggleTheme() {
    setDark(prev => !prev)
  }

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} />
      <button className="theme-toggle-floating" onClick={toggleTheme} title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}>
        {dark ? '☀️' : '🌙'}
      </button>
      <main className="main">
        {!disclaimerHidden && (
          <div className="disclaimer">
            <b>تنويه:</b> منصّة معلوماتية للمتابعة فقط — لا تتضمّن أي توصية بالشراء أو البيع. البنود
            المعلّمة بـ«يلزم التحقق» تحتاج تأكيدًا من المصادر الرسمية (DFM / ADX / إفصاحات الشركات).
            <button
              onClick={dismissDisclaimer}
              title="إخفاء التنويه"
              style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
            >✕</button>
          </div>
        )}
        {view === 'overview' && <Overview onOpen={setDetail} />}
        {view === 'screener' && <Screener onOpen={setDetail} />}
        {view === 'dividends' && <Dividends onOpen={setDetail} />}
        {view === 'financials' && <Financials onOpen={setDetail} />}
        {view === 'compare' && <Compare />}
        {view === 'portfolio' && <Portfolio onOpen={setDetail} />}
      </main>
      
      {/* شريط التنقل السفلي المطور لتطبيقات الهواتف الذكية (Bottom Navigation Bar) */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map((n) => (
          <button
            key={n.v}
            className={'bottom-navitem' + (view === n.v ? ' active' : '')}
            onClick={() => setView(n.v)}
          >
            <span className="bottom-navitem-icon">{n.icon}</span>
            <span className="bottom-navitem-label">{n.label}</span>
          </button>
        ))}
      </nav>

      {detail && <StockDetail item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

const BOTTOM_NAV: { v: View; label: string; icon: string }[] = [
  { v: 'overview', label: 'الرئيسية', icon: '📊' },
  { v: 'screener', label: 'المستكشف', icon: '🔎' },
  { v: 'dividends', label: 'التوزيعات', icon: '💵' },
  { v: 'financials', label: 'النتائج', icon: '📈' },
  { v: 'compare', label: 'المقارنة', icon: '⚖️' },
  { v: 'portfolio', label: 'المحفظة', icon: '💼' },
]
