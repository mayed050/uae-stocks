import seed from './seed.json'

export type Exchange = 'DFM' | 'ADX'
export type Category = 'income' | 'growth' | 'risk'

export interface Dividend {
  ps: string | null
  yld: string | null
  lastEnt: string | null
  exd: string | null
  rec: string | null
  pay: string | null
  agm: string | null
  freq: string | null
  note?: string
  nextExd?: string
  nextPay?: string
  watch?: boolean
}

export interface Stock {
  sym: string
  name: string
  ex: Exchange
  sector: string
  cat: Category
  yahoo?: string | null
  tradingview?: string | null
  priceAuto?: boolean
  price: number | null
  change?: number | null
  open?: number | null
  high?: number | null
  low?: number | null
  volume?: number | null
  asof: string | null
  mcap: string | null
  pe: number | null
  eps: string | null
  roe: string | null
  net: string | null
  rev: string | null
  div: Dividend
}

export interface Dataset {
  lastUpdated: string | null
  source: string
  stocks: Stock[]
}

export const CAT_LABEL: Record<Category, string> = {
  income: 'دخل مستقر',
  growth: 'نمو',
  risk: 'مخاطر أعلى',
}

/** البيانات المُضمَّنة كنسخة احتياطية (fallback) إن تعذّر جلب data.json وقت التشغيل. */
export const SEED = seed as Dataset
export const DATA: Stock[] = SEED.stocks
