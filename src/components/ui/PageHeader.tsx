import type { ReactNode } from 'react'
import { useStocks } from '@/store'

/**
 * ترويسة صفحة موحّدة: عنوان + وصف + شارة «آخر تحديث» تلقائية (من بيانات المتجر).
 * توحّد مقاسات العناوين وتُظهر حداثة البيانات في كل الصفحات.
 */
export default function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  const { lastUpdated } = useStocks()
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {(children || lastUpdated) && (
        <p>
          {children}
          {lastUpdated && (
            <span className="updated"> · آخر تحديث: {new Date(lastUpdated).toLocaleDateString('ar-AE', { dateStyle: 'medium' })}</span>
          )}
        </p>
      )}
    </div>
  )
}
