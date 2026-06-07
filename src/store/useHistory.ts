import { useEffect, useState } from 'react'

/** نقطة تاريخية مضغوطة: [التاريخ "YYYY-MM-DD"، الإغلاق]. */
export type HistPoint = [string, number]
export type HistoryMap = Record<string, HistPoint[]>

let cache: HistoryMap | null = null
let inflight: Promise<HistoryMap> | null = null

function load(): Promise<HistoryMap> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch(`${import.meta.env.BASE_URL}history.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ history?: HistoryMap }>) : Promise.reject(new Error('no history'))))
      .then((j) => {
        cache = j.history ?? {}
        return cache
      })
      .catch(() => {
        cache = {}
        return cache
      })
  }
  return inflight
}

/** يحمّل أسعار دبي التاريخية مرّة واحدة (مخزّنة)، ويُرجع خريطة الرمز → نقاط. */
export function useHistory(): HistoryMap {
  const [h, setH] = useState<HistoryMap>(cache ?? {})
  useEffect(() => {
    let alive = true
    void load().then((m) => {
      if (alive) setH(m)
    })
    return () => {
      alive = false
    }
  }, [])
  return h
}
