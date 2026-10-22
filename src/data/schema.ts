/**
 * عقد البيانات (Zod 4 Mini): المصدر الوحيد لشكل data.json وأنواع TypeScript المشتقة منه.
 * يُستخدم في ثلاثة مواضع: التحقق وقت التشغيل عند جلب data.json، واختبار يفحص الملفات
 * المُلتزَمة، وسير عمل التحديث اليومي قبل دفع أي بيانات جديدة.
 * نسخة Mini (≈ 9KB مضغوطة بدل ≈ 28KB) لأن العقد يُشحن إلى المتصفح.
 */
import * as z from 'zod/mini'

const isoDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ بصيغة YYYY-MM-DD'))
const price = z.number().check(z.positive())
const nullable = <T extends z.ZodMiniType>(t: T) => z.nullable(t)
const optNullable = <T extends z.ZodMiniType>(t: T) => z.optional(z.nullable(t))

export const DividendSchema = z.object({
  ps: nullable(z.string()),
  yld: nullable(z.string()),
  lastEnt: nullable(isoDate),
  exd: nullable(isoDate),
  rec: nullable(isoDate),
  pay: nullable(isoDate),
  agm: nullable(isoDate),
  freq: nullable(z.string()),
  note: z.optional(z.string()),
  nextExd: z.optional(isoDate),
  nextPay: z.optional(isoDate),
  watch: z.optional(z.boolean()),
})

export const StockSchema = z.object({
  sym: z.string().check(z.regex(/^[A-Z0-9]+$/, 'رمز بأحرف لاتينية كبيرة وأرقام')),
  name: z.string().check(z.minLength(1)),
  ex: z.enum(['DFM', 'ADX']),
  sector: z.string().check(z.minLength(1)),
  cat: z.enum(['income', 'growth', 'risk']),
  yahoo: optNullable(z.string()),
  tradingview: optNullable(z.string()),
  priceAuto: z.optional(z.boolean()),
  price: nullable(price),
  // حدّ معقولية: تغيّر يومي يتجاوز ±50% يدلّ غالبًا على خطأ وحدة (مثل الفلس بدل الدرهم)
  change: optNullable(z.number().check(z.gte(-50), z.lte(50))),
  open: optNullable(price),
  high: optNullable(price),
  low: optNullable(price),
  volume: optNullable(z.int().check(z.nonnegative())),
  asof: nullable(isoDate),
  mcap: nullable(z.string()),
  pe: nullable(z.number()),
  eps: nullable(z.string()),
  roe: nullable(z.string()),
  net: nullable(z.string()),
  rev: nullable(z.string()),
  div: DividendSchema,
})

export const IndexQuoteSchema = z.object({
  code: z.string(),
  name: z.string(),
  ex: z.enum(['DFM', 'ADX']),
  value: price,
  change: nullable(z.number()),
  changePct: nullable(z.number()),
  asof: isoDate,
})

export const DatasetSchema = z
  .object({
    lastUpdated: nullable(z.iso.datetime()),
    source: z.string(),
    stocks: z.array(StockSchema).check(z.minLength(1)),
    indices: z.optional(z.record(z.string(), IndexQuoteSchema)),
  })
  .check(
    z.superRefine((d, ctx) => {
      const seen = new Set<string>()
      d.stocks.forEach((s, i) => {
        if (seen.has(s.sym)) ctx.addIssue({ code: 'custom', input: s.sym, path: ['stocks', i, 'sym'], message: `رمز مكرّر: ${s.sym}` })
        seen.add(s.sym)
        if (s.high != null && s.low != null && s.high < s.low) {
          ctx.addIssue({ code: 'custom', input: s.high, path: ['stocks', i, 'high'], message: `${s.sym}: الأعلى أقل من الأدنى` })
        }
      })
    }),
  )

/** يتحقق من بيانات مجهولة المصدر؛ يُرجع البيانات أو رسالة خطأ مقروءة. */
export function parseDataset(json: unknown): { ok: true; data: z.infer<typeof DatasetSchema> } | { ok: false; error: string } {
  const r = DatasetSchema.safeParse(json)
  return r.success ? { ok: true, data: r.data } : { ok: false, error: z.prettifyError(r.error) }
}

/** سجل الأسعار التاريخية (history.json): الرمز → نقاط [تاريخ، إغلاق]. */
export const HistorySchema = z.object({
  updated: z.optional(z.iso.datetime()),
  history: z.record(z.string(), z.array(z.tuple([isoDate, price]))),
})

/** حيازات المحفظة المحفوظة في المتصفح (حماية من بيانات تالفة أو قديمة الشكل). */
export const HoldingsSchema = z.array(
  z.object({
    sym: z.string(),
    amount: z.number().check(z.nonnegative()),
    shares: z.number().check(z.nonnegative()),
    cost: z.optional(z.number().check(z.nonnegative())), // الحيازات القديمة بلا تكلفة تُرحَّل: التكلفة = المبلغ
  }),
)
