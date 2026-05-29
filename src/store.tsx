import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { SEED } from './data'
import type { Dataset, Stock } from './data'

interface StoreValue {
  stocks: Stock[]
  lastUpdated: string | null
  source: string
  loading: boolean
}

const Ctx = createContext<StoreValue>({
  stocks: SEED.stocks,
  lastUpdated: SEED.lastUpdated,
  source: SEED.source,
  loading: true,
})

export function StocksProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Dataset>(SEED)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}data.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no data.json'))))
      .then((json: Dataset) => {
        if (alive && json?.stocks?.length) setData(json)
      })
      .catch(() => {
        /* يبقى الاعتماد على البيانات المُضمَّنة */
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <Ctx.Provider value={{ stocks: data.stocks, lastUpdated: data.lastUpdated, source: data.source, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export function useStocks() {
  return useContext(Ctx)
}
