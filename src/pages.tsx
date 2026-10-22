/** مكوّنات المسارات: تربط كل صفحة بالتوجيه (فتح بطاقة السهم والتنقّل) دون أن تعرف الصفحات بالموجّه. */
import { Link, useNavigate } from '@tanstack/react-router'
import type { Stock } from '@/data'
import { pathOf } from '@/components/nav'
import type { View } from '@/components/nav'

// الاستيراد المباشر (Static Imports) لضمان موثوقية كاملة وتفادي أخطاء تحميل الحزم الديناميكية على Vercel و GitHub Pages
import Overview from '@/features/overview/Overview'
import Screener from '@/features/screener/Screener'
import Dividends from '@/features/dividends/Dividends'
import Compare from '@/features/compare/Compare'
import Portfolio from '@/features/portfolio/Portfolio'
import Financials from '@/features/financials/Financials'

/** فتح بطاقة سهم فوق الصفحة الحالية بإضافة ?stock= إلى الرابط (زر الرجوع يغلقها). */
function useOpenStock() {
  const navigate = useNavigate()
  return (s: Stock) => void navigate({ to: '.', search: (prev) => ({ ...prev, stock: s.sym }) })
}

export function OverviewPage() {
  const open = useOpenStock()
  const navigate = useNavigate()
  return <Overview onOpen={open} onNavigate={(v: View) => void navigate({ to: pathOf(v) })} />
}

export function ScreenerPage() {
  return <Screener onOpen={useOpenStock()} />
}

export function DividendsPage() {
  return <Dividends onOpen={useOpenStock()} />
}

export function FinancialsPage() {
  return <Financials onOpen={useOpenStock()} />
}

export function ComparePage() {
  return <Compare />
}

export function PortfolioPage() {
  return <Portfolio onOpen={useOpenStock()} />
}

export function NotFound() {
  return (
    <div className="view" style={{ padding: '48px 8px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 22 }}>الصفحة غير موجودة</h1>
      <p style={{ color: 'var(--muted)' }}>الرابط غير صحيح أو لم يعد متاحًا.</p>
      <Link to="/" className="chip">العودة إلى النظرة العامة</Link>
    </div>
  )
}
