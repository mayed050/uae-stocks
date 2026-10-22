import { QueryClient, queryOptions } from '@tanstack/react-query'
import { SEED } from '@/data'
import { parseDataset, HistorySchema } from '@/data/schema'

/** عميل الاستعلامات للتطبيق: البيانات تتحدّث يوميًا، فلا داعي لإعادة الجلب المتكررة. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60_000, retry: 2, refetchOnWindowFocus: true },
    },
  })
}

async function getJson(file: string, signal: AbortSignal): Promise<unknown> {
  const r = await fetch(`${import.meta.env.BASE_URL}${file}`, { cache: 'no-store', signal })
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`)
  return r.json()
}

/**
 * بيانات السوق: تُعرض البيانات المُضمَّنة فورًا (initialData) ثم تُستبدل بـ data.json الأحدث.
 * أي ملف يخالف عقد البيانات يُرفض فتبقى آخر بيانات سليمة معروضة.
 */
export const datasetQuery = queryOptions({
  queryKey: ['dataset'],
  queryFn: async ({ signal }) => {
    const parsed = parseDataset(await getJson('data.json', signal))
    if (!parsed.ok) throw new Error(`data.json يخالف عقد البيانات:\n${parsed.error}`)
    return parsed.data
  },
  initialData: SEED,
  initialDataUpdatedAt: 0, // المضمَّنة تُعدّ قديمة فيُجلب الأحدث فور التركيب
})

/** أسعار الإغلاق التاريخية (سنة) لأسهم دبي — تُجلب مرّة وتُخزَّن. */
export const historyQuery = queryOptions({
  queryKey: ['history'],
  queryFn: async ({ signal }) => HistorySchema.parse(await getJson('history.json', signal)).history,
  staleTime: 30 * 60_000,
})
