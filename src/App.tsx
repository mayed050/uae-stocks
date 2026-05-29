import { useState } from 'react'
import type { Stock } from './data'
import Sidebar from './components/Sidebar'
import type { View } from './components/Sidebar'
import StockDetail from './components/StockDetail'
import Overview from './views/Overview'
import Screener from './views/Screener'
import Dividends from './views/Dividends'
import Compare from './views/Compare'

export default function App() {
  const [view, setView] = useState<View>('overview')
  const [detail, setDetail] = useState<Stock | null>(null)
  const [dark, setDark] = useState(true)

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} dark={dark} toggleTheme={toggleTheme} />
      <main className="main">
        <div className="disclaimer">
          <b>تنويه:</b> منصّة معلوماتية للمتابعة فقط — لا تتضمّن أي توصية بالشراء أو البيع. البنود
          المعلّمة بـ«يلزم التحقق» تحتاج تأكيدًا من المصادر الرسمية (DFM / ADX / إفصاحات الشركات).
        </div>
        {view === 'overview' && <Overview onOpen={setDetail} />}
        {view === 'screener' && <Screener onOpen={setDetail} />}
        {view === 'dividends' && <Dividends onOpen={setDetail} />}
        {view === 'compare' && <Compare />}
      </main>
      {detail && <StockDetail item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
