import { useState, useEffect, lazy, Suspense } from 'react'
import type { Stock } from './data'
import Sidebar from './components/Sidebar'
import type { View } from './components/Sidebar'
import StockDetail from './components/StockDetail'

// تطبيق التحميل الكسول (Lazy Loading) للمكونات لتعزيز الأداء الأولي للموقع
const Overview = lazy(() => import('./views/Overview'))
const Screener = lazy(() => import('./views/Screener'))
const Dividends = lazy(() => import('./views/Dividends'))
const Compare = lazy(() => import('./views/Compare'))
const Portfolio = lazy(() => import('./views/Portfolio'))

/** هيكل تحميل ذو مظهر زجاجي ونبض لطيف لتجربة انتقال ناعمة وجذابة */
function SkeletonLoader() {
  return (
    <div className="view skeleton-pulse" style={{ padding: '8px 0' }}>
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div style={{ height: '34px', width: '240px', background: 'var(--line)', borderRadius: '10px', marginBottom: '10px' }} />
        <div style={{ height: '18px', width: '420px', background: 'var(--line)', borderRadius: '8px' }} />
      </div>
      
      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', margin: '22px 0' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat" style={{ height: '98px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '18px' }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '24px 0' }}>
        <div className="panel" style={{ height: '270px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '18px' }} />
        <div className="panel" style={{ height: '270px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '18px' }} />
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<View>('overview')
  const [detail, setDetail] = useState<Stock | null>(null)
  
  // الوضع الافتراضي هو الفاتح (false) ما لم يكن محفوظاً غير ذلك
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_preference')
    return saved ? saved === 'dark' : false
  })

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
        <div className="disclaimer">
          <b>تنويه:</b> منصّة معلوماتية للمتابعة فقط — لا تتضمّن أي توصية بالشراء أو البيع. البنود
          المعلّمة بـ«يلزم التحقق» تحتاج تأكيدًا من المصادر الرسمية (DFM / ADX / إفصاحات الشركات).
        </div>
        <Suspense fallback={<SkeletonLoader />}>
          {view === 'overview' && <Overview onOpen={setDetail} />}
          {view === 'screener' && <Screener onOpen={setDetail} />}
          {view === 'dividends' && <Dividends onOpen={setDetail} />}
          {view === 'compare' && <Compare />}
          {view === 'portfolio' && <Portfolio onOpen={setDetail} />}
        </Suspense>
      </main>
      {detail && <StockDetail item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
