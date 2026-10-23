import { useQuery } from '@tanstack/react-query'
import { historyQuery } from './queries'

/** نقطة تاريخية مضغوطة: [التاريخ "YYYY-MM-DD"، الإغلاق]. */
export type HistPoint = [string, number]
export type HistoryMap = Record<string, HistPoint[]>

const EMPTY: HistoryMap = {}

/** يحمّل أسعار دبي التاريخية مرّة واحدة (مخزّنة في عميل الاستعلامات): خريطة الرمز → نقاط، وحالة التحميل. */
export function useHistory(): { history: HistoryMap; pending: boolean } {
  const q = useQuery(historyQuery)
  return { history: q.data ?? EMPTY, pending: q.isPending }
}
