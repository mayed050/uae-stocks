import type { ReactNode } from 'react'
import { NA } from '@/constants/ui'

/**
 * يعرض قيمة الخلية، أو شارة «يلزم التحقق» إن كانت فارغة/غير متوفرة.
 * موحّد بدل تكرار نفس الدالة (`cell`/`v`) في عدة صفحات.
 */
export function cell(x: string | number | null | undefined): ReactNode {
  return x === null || x === undefined || x === '' ? <span className="na">{NA}</span> : x
}
