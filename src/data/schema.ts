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
  nextPs: z.optional(z.string()),
  // التوزيع الفعلي لآخر 12 شهرًا بالدرهم (من العائد الجاري) — يُستخدم حين يغيب التكرار
  ttmPs: z.optional(z.number().check(z.nonnegative())),
  watch: z.optional(z.boolean()),
  // مصدر الحقول المملوءة آليًا (غير المتحقق منها بعد) — تُعرض بعلامة «يلزم التحقق»
  auto: z.optional(z.object({ src: z.string(), asof: isoDate, fields: z.array(z.string()) })),
  // الإفصاح الرسمي الذي رُوجع عليه الحدث يدويًا: يُعرض رابطًا، ويُسكت تعارضات الحدث نفسه مع TradingView
  src: z.optional(z.object({ url: z.string().check(z.regex(/^https:\/\//, 'رابط https')), label: z.string().check(z.minLength(1)), asof: isoDate })),
})

export const StockSchema = z.object({
  sym: z.string().check(z.regex(/^[A-Z0-9]+$/, 'رمز بأحرف لاتينية كبيرة وأرقام')),
  name: z.string().check(z.minLength(1)),
  ex: z.enum(['DFM', 'ADX']),
  sector: z.string().check(z.minLength(1)),
  cat: z.enum(['income', 'growth', 'risk', 'unrated']),
  // سهم مكتشف آليًا من قائمة السوق: كل بياناته آلية ولم تُراجَع يدويًا
  auto: z.optional(z.boolean()),
  logo: optNullable(z.string()),
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
  high52: optNullable(price),
  low52: optNullable(price),
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

/** البيانات المالية التفصيلية (financials.json) من TradingView: الرمز → سجل؛ المبالغ بالدرهم والنسب بالمئة. */
const n = nullable(z.number())
export const FinRecordSchema = z.object({
  asof: isoDate,
  ttm: z.object({ rev: n, net: n, eps: n, grossM: n, opM: n, netM: n, roe: n, roa: n, fcf: n, ebitda: n }),
  bal: z.object({ assets: n, liab: n, equity: n, debt: n, cash: n, netDebt: n, bvps: n, curRatio: n, de: n }),
  val: z.object({ pb: n, ps: n, evEbitda: n, payout: n }),
  own: z.object({ shares: n, float: n, floatPct: n, isin: nullable(z.string()) }),
  rel: z.object({ last: nullable(isoDate), next: nullable(isoDate) }),
  perf: z.object({ w: n, m1: n, m3: n, ytd: n, y1: n }),
  tech: z.object({ rsi: n, sma50: n, sma200: n, beta: n, avgVol30: n }),
  fy: z.array(z.object({ y: z.int(), rev: n, net: n, eps: n, dps: n, assets: n, debt: n, fcf: n })),
  // السجل الربعي لا يُحفظ إلا إن تحقّقت تسمياته (مجموع أرباع السنة = رقمها السنوي)
  fq: nullable(z.array(z.object({ q: z.string().check(z.regex(/^Q[1-4] \d{4}$/)), rev: n, net: n }))),
})
export const FinancialsSchema = z.object({
  updated: z.iso.datetime(),
  source: z.string(),
  stocks: z.record(z.string(), FinRecordSchema),
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
