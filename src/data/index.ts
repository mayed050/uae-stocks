import type * as z from 'zod/mini'
import type { DatasetSchema, DividendSchema, IndexQuoteSchema, StockSchema } from './schema'
import seed from './seed.json'

// الأنواع مشتقة من عقد البيانات (schema.ts) — تعريف واحد للشكل والتحقق معًا.
export type Dividend = z.infer<typeof DividendSchema>
export type Stock = z.infer<typeof StockSchema>
export type IndexQuote = z.infer<typeof IndexQuoteSchema>
export type Dataset = z.infer<typeof DatasetSchema>
export type Exchange = Stock['ex']
export type Category = Stock['cat']

export const CAT_LABEL: Record<Category, string> = {
  income: 'دخل مستقر',
  growth: 'نمو',
  risk: 'مخاطر أعلى',
}

/** البيانات المُضمَّنة كنسخة احتياطية (fallback) إن تعذّر جلب data.json وقت التشغيل. */
export const SEED = seed as Dataset
export const DATA: Stock[] = SEED.stocks
