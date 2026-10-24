import { useQuery } from '@tanstack/react-query'
import type { FinRecord } from '@/data'
import { financialsQuery } from './queries'

/** سجل السهم المالي من financials.json (أو null إن لم يتوفر)، وتاريخ التحديث، وحالة التحميل والخطأ. */
export function useFinancials(sym: string): { fin: FinRecord | null; updated: string | null; pending: boolean; failed: boolean } {
  const q = useQuery(financialsQuery)
  return { fin: q.data?.stocks[sym] ?? null, updated: q.data?.updated ?? null, pending: q.isPending, failed: q.isError }
}
