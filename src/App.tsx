import { useState, useEffect } from 'react'
import type { Stock } from './data'
import Sidebar from './components/Sidebar'
import type { View } from './components/Sidebar'
import StockDetail from './components/StockDetail'

// الاستيراد المباشر (Static Imports) لضمان موثوقية كاملة بنسبة 100% وتفادي أخطاء تحميل الحزم الديناميكية على منصة Vercel
import Overview from './views/Overview'
import Screener from './views/Screener'
import Dividends from './views/Dividends'
import Compare from './views/Compare'
import Portfolio from './views/Portfolio'

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
        {view === 'overview' && <Overview onOpen={setDetail} />}
        {view === 'screener' && <Screener onOpen={setDetail} />}
        {view === 'dividends' && <Dividends onOpen={setDetail} />}
        {view === 'compare' && <Compare />}
        {view === 'portfolio' && <Portfolio onOpen={setDetail} />}
      </main>
      {detail && <StockDetail item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
