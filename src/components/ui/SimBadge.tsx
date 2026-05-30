import type { ReactNode } from 'react'

const DEFAULT_TITLE = 'قيم توضيحية مُولّدة خوارزمياً للعرض، وليست بيانات سوق حقيقية لحظية. تأكّد من المصادر الرسمية (DFM / ADX).'

/** شارة موحّدة تُعلّم البيانات المحاكاة/التوضيحية. */
export default function SimBadge({
  children = 'بيانات توضيحية',
  title = DEFAULT_TITLE,
}: {
  children?: ReactNode
  title?: string
}) {
  return <span className="sim-badge" title={title}>{children}</span>
}
