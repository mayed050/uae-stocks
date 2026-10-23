/**
 * مكوّنات المسارات: تربط كل صفحة بالتوجيه (فتح بطاقة السهم والتنقّل) دون أن تعرف الصفحات بالموجّه.
 * النظرة العامة وصفحة «غير موجودة» تُحمَّلان مع الحزمة الأولى؛ بقية الصفحات حِزم مستقلة تُجلب عند الطلب (router.ts).
 */
import { Link, useNavigate } from '@tanstack/react-router'
import { pathOf } from '@/components/nav'
import type { View } from '@/components/nav'
import Overview from '@/features/overview/Overview'
import { useOpenStock } from './useOpenStock'

export function OverviewPage() {
  const open = useOpenStock()
  const navigate = useNavigate()
  return <Overview onOpen={open} onNavigate={(v: View) => void navigate({ to: pathOf(v) })} />
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

/** يظهر فقط إن تأخّر جلب حزمة الصفحة (شبكة بطيئة) أكثر من ثانية. */
export function PagePending() {
  return (
    <div className="view" role="status" aria-label="جارٍ تحميل الصفحة">
      <div className="chart-skeleton" style={{ height: 120 }} />
      <div className="chart-skeleton" style={{ height: 320 }} />
    </div>
  )
}
