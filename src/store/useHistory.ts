import { useQuery } from '@tanstack/react-query'
import { historyQuery } from './queries'

/** نقطة تاريخية مضغوطة: [التاريخ "YYYY-MM-DD"، الإغلاق]. */
export type HistPoint = [string, number]
export type HistoryMap = Record<string, HistPoint[]>

const EMPTY: HistoryMap = {}

/** يحمّل أسعار دبي التاريخية مرّة واحدة (مخزّنة في عميل الاستعلامات)، ويُرجع خريطة الرمز → نقاط. */
export function useHistory(): HistoryMap {
  return useQuery(historyQuery).data ?? EMPTY
}
