import type { ReactNode } from 'react'
import { useStocks } from '@/store'

/**
 * ترويسة صفحة موحّدة: عنوان + وصف + شارة «آخر تحديث» تلقائية (من بيانات المتجر).
 * توحّد مقاسات العناوين وتُظهر حداثة البيانات في كل الصفحات.
 */
export default function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  const { lastUpdated } = useStocks()
  const days = lastUpdated ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000) : null
  const stale = days !== null && days > 3 // أكثر من 3 أيام (يستوعب عطلة نهاية الأسبوع)
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {(children || lastUpdated) && (
        <p>
          {children}
          {lastUpdated && (
            <span className="updated"> · آخر تحديث: {new Date(lastUpdated).toLocaleDateString('ar-AE', { dateStyle: 'medium' })}</span>
          )}
          {stale && (
            <span
              title={`لم تُحدَّث البيانات منذ ${days} يومًا — قد تكون قديمة. تحقّق من مهمة التحديث اليومي.`}
              style={{
                marginInlineStart: 8,
                fontSize: 11.5,
                fontWeight: 800,
                color: 'var(--warn)',
                background: 'rgba(255,176,32,0.12)',
                border: '1px solid rgba(255,176,32,0.4)',
                borderRadius: 999,
                padding: '2px 9px',
              }}
            >
              ⚠️ بيانات قديمة ({days} يوم)
            </span>
          )}
        </p>
      )}
    </div>
  )
}
