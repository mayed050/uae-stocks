/**
 * عقد البيانات (Zod 4): المصدر الوحيد لشكل data.json وأنواع TypeScript المشتقة منه.
 * يُستخدم في ثلاثة مواضع: التحقق وقت التشغيل عند جلب data.json، واختبار يفحص الملفات
 * المُلتزَمة، وسير عمل التحديث اليومي قبل دفع أي بيانات جديدة.
 */
import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ بصيغة YYYY-MM-DD')
const price = z.number().positive()

export const DividendSchema = z.object({
  ps: z.string().nullable(),
  yld: z.string().nullable(),
  lastEnt: isoDate.nullable(),
  exd: isoDate.nullable(),
  rec: isoDate.nullable(),
  pay: isoDate.nullable(),
  agm: isoDate.nullable(),
  freq: z.string().nullable(),
  note: z.string().optional(),
  nextExd: isoDate.optional(),
  nextPay: isoDate.optional(),
  watch: z.boolean().optional(),
})

export const StockSchema = z.object({
  sym: z.string().regex(/^[A-Z0-9]+$/, 'رمز بأحرف لاتينية كبيرة وأرقام'),
  name: z.string().min(1),
  ex: z.enum(['DFM', 'ADX']),
  sector: z.string().min(1),
  cat: z.enum(['income', 'growth', 'risk']),
  yahoo: z.string().nullable().optional(),
  tradingview: z.string().nullable().optional(),
  priceAuto: z.boolean().optional(),
  price: price.nullable(),
  // حدّ معقولية: تغيّر يومي يتجاوز ±50% يدلّ غالبًا على خطأ وحدة (مثل الفلس بدل الدرهم)
  change: z.number().min(-50).max(50).nullable().optional(),
  open: price.nullable().optional(),
  high: price.nullable().optional(),
  low: price.nullable().optional(),
  volume: z.number().int().nonnegative().nullable().optional(),
  asof: isoDate.nullable(),
  mcap: z.string().nullable(),
  pe: z.number().nullable(),
  eps: z.string().nullable(),
  roe: z.string().nullable(),
  net: z.string().nullable(),
  rev: z.string().nullable(),
  div: DividendSchema,
})

export const IndexQuoteSchema = z.object({
  code: z.string(),
  name: z.string(),
  ex: z.enum(['DFM', 'ADX']),
  value: price,
  change: z.number().nullable(),
  changePct: z.number().nullable(),
  asof: isoDate,
})

export const DatasetSchema = z
  .object({
    lastUpdated: z.iso.datetime().nullable(),
    source: z.string(),
    stocks: z.array(StockSchema).min(1),
    indices: z.record(z.string(), IndexQuoteSchema).optional(),
  })
  .superRefine((d, ctx) => {
    const seen = new Set<string>()
    d.stocks.forEach((s, i) => {
      if (seen.has(s.sym)) ctx.addIssue({ code: 'custom', path: ['stocks', i, 'sym'], message: `رمز مكرّر: ${s.sym}` })
      seen.add(s.sym)
      if (s.high != null && s.low != null && s.high < s.low) {
        ctx.addIssue({ code: 'custom', path: ['stocks', i, 'high'], message: `${s.sym}: الأعلى أقل من الأدنى` })
      }
    })
  })

/** يتحقق من بيانات مجهولة المصدر؛ يُرجع البيانات أو رسالة خطأ مقروءة. */
export function parseDataset(json: unknown): { ok: true; data: z.infer<typeof DatasetSchema> } | { ok: false; error: string } {
  const r = DatasetSchema.safeParse(json)
  return r.success ? { ok: true, data: r.data } : { ok: false, error: z.prettifyError(r.error) }
}

/** سجل الأسعار التاريخية (history.json): الرمز → نقاط [تاريخ، إغلاق]. */
export const HistorySchema = z.object({
  updated: z.iso.datetime().optional(),
  history: z.record(z.string(), z.array(z.tuple([isoDate, price]))),
})

/** حيازات المحفظة المحفوظة في المتصفح (حماية من بيانات تالفة أو قديمة الشكل). */
export const HoldingsSchema = z.array(
  z.object({
    sym: z.string(),
    amount: z.number().nonnegative(),
    shares: z.number().nonnegative(),
    cost: z.number().nonnegative().optional(), // الحيازات القديمة بلا تكلفة تُرحَّل: التكلفة = المبلغ
  }),
)
