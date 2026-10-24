import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'

/* مكوّنات عرض مشتركة لتبويبات النتائج المالية. */

/** قسم بعنوان وتذييل يذكر المصدر. */
export function Section({ title, source, children }: { title: string; source?: ReactNode; children: ReactNode }) {
  return (
    <section className="fin-sec">
      <h3 className="fin-sec-h">{title}</h3>
      {children}
      {source && <p className="fin-src">{source}</p>}
    </section>
  )
}

/** شبكة مقاييس: تسمية وقيمة وتلميح اختياري. */
export function Stats({ items }: { items: { label: string; value: string; hint?: string; tone?: 'up' | 'down' }[] }) {
  return (
    <dl className="fin-stats">
      {items.map((it) => (
        <div key={it.label} className="fin-stat">
          <dt>{it.label}</dt>
          <dd className={it.tone}>
            {it.value}
            {it.hint && <span className="fin-hint">{it.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function OfficialLink({ url, label }: { url: string; label: string }) {
  return (
    <a className="fin-official" href={url} target="_blank" rel="noopener noreferrer">
      {label} <ExternalLink size={13} className="ico" aria-hidden />
    </a>
  )
}

/** حالة غياب السجل المالي للسهم في مصدر البيانات. */
export function NoFinancials({ pending, failed }: { pending: boolean; failed: boolean }) {
  if (pending) return <div className="chart-skeleton" role="status" aria-label="جارٍ تحميل البيانات المالية" style={{ height: 180 }} />
  return (
    <p className="fin-empty">
      {failed ? 'تعذّر تحميل البيانات المالية الآن — حاول لاحقًا.' : 'لا تتوفر بيانات مالية تفصيلية لهذا السهم في مصدر البيانات.'}
    </p>
  )
}
