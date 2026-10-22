import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, X } from 'lucide-react'
import { Link, Outlet, useCanGoBack, useLocation, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import Sidebar from './components/Sidebar'
import { NAV } from './components/nav'
import StockDetail from './components/StockDetail'
import { useStocks } from './store'

/** الهيكل العام لكل الصفحات: الشريط الجانبي، المحتوى (Outlet)، الشريط السفلي، وبطاقة السهم من ?stock=. */
export default function App() {
  const { stocks } = useStocks()
  const { stock: stockSym } = useSearch({ from: '__root__' })
  const detail = stockSym ? (stocks.find((s) => s.sym === stockSym) ?? null) : null
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const mainRef = useRef<HTMLElement>(null)

  // الإغلاق يعود خطوة في السجل إن فُتحت البطاقة من داخل التطبيق، وإلا يُزال ?stock= (رابط مباشر)
  function closeDetail() {
    if (canGoBack) router.history.back()
    else void navigate({ to: '.', search: (prev) => ({ ...prev, stock: undefined }), replace: true })
  }

  // الصعود لأعلى الصفحة عند الانتقال بين الصفحات
  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pathname])

  // عنوان التبويب يعكس الصفحة والسهم المفتوح (يظهر في السجل والإشارات المرجعية)
  useEffect(() => {
    const page = NAV.find((n) => n.to === pathname)?.label
    const parts = [detail ? `${detail.name.split('—')[0]?.trim()} (${detail.sym})` : null, page, 'منصة الأسهم الإماراتية']
    document.title = parts.filter(Boolean).join(' — ')
  }, [pathname, detail])
  
  // الوضع الافتراضي يتبع تفضيل النظام عند أول زيارة، ثم يُحترم اختيار المستخدم المحفوظ
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_preference')
    if (saved) return saved === 'dark'
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
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
      <Sidebar />
      <button
        className="theme-toggle-floating"
        onClick={toggleTheme}
        title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        aria-label={dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      >
        {dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
      </button>
      <main className="main" ref={mainRef}>
        {!disclaimerHidden && (
          <div className="disclaimer">
            <b>تنويه:</b> منصّة معلوماتية للمتابعة فقط — لا تتضمّن أي توصية بالشراء أو البيع. البنود
            المعلّمة بـ«يلزم التحقق» تحتاج تأكيدًا من المصادر الرسمية (DFM / ADX / إفصاحات الشركات).
            <button
              onClick={dismissDisclaimer}
              title="إخفاء التنويه"
              aria-label="إخفاء التنويه"
              style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1, padding: '0 4px', display: 'inline-flex' }}
            ><X size={16} aria-hidden /></button>
          </div>
        )}
        <Outlet />
      </main>
      
      {/* شريط التنقل السفلي المطور لتطبيقات الهواتف الذكية (Bottom Navigation Bar) */}
      <nav className="bottom-nav">
        {NAV.map((n) => (
          <Link
            key={n.v}
            to={n.to}
            className="bottom-navitem"
            activeProps={{ className: 'active' }}
            activeOptions={{ exact: n.to === '/', includeSearch: false }}
          >
            <span className="bottom-navitem-icon"><n.icon size={20} aria-hidden /></span>
            <span className="bottom-navitem-label">{n.short}</span>
          </Link>
        ))}
      </nav>

      {detail && <StockDetail item={detail} onClose={closeDetail} />}
    </div>
  )
}
