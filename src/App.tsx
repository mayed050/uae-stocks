import { useState, useEffect, lazy, Suspense } from 'react'
import type { Stock } from './data'
import Sidebar from './components/Sidebar'
import type { View } from './components/Sidebar'
import StockDetail from './components/StockDetail'

// التحميل الكسول (Lazy Loading) لتقسيم الكود وتحسين سرعة التحميل الأولية للمتصفح 🚀
const Overview = lazy(() => import('./views/Overview'))
const Screener = lazy(() => import('./views/Screener'))
const Dividends = lazy(() => import('./views/Dividends'))
const Compare = lazy(() => import('./views/Compare'))
const Portfolio = lazy(() => import('./views/Portfolio'))
const Financials = lazy(() => import('./views/Financials'))

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
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px', flexDirection: 'column', gap: '14px' }}>
            <div className="loading-spinner-view" />
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>جاري تحميل اللوحة المالية...</span>
            <style>{`
              .loading-spinner-view {
                width: 38px;
                height: 38px;
                border: 3.5px solid var(--line);
                border-top-color: #ff6b00;
                border-radius: 50%;
                animation: spin-loading 0.8s linear infinite;
              }
              @keyframes spin-loading {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        }>
          {view === 'overview' && <Overview onOpen={setDetail} />}
          {view === 'screener' && <Screener onOpen={setDetail} />}
          {view === 'dividends' && <Dividends onOpen={setDetail} />}
          {view === 'financials' && <Financials onOpen={setDetail} />}
          {view === 'compare' && <Compare />}
          {view === 'portfolio' && <Portfolio onOpen={setDetail} />}
        </Suspense>
      </main>
      {detail && <StockDetail item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
