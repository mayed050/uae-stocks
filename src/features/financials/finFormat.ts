import type { Stock } from '@/data'
import { fmtAmount } from '@/format'

/* تنسيق قيم النتائج المالية — كل قيمة غائبة تُعرض «—» لا رقمًا بديلًا.
   الجزء الرقمي يُعزل باتجاه LTR (U+2066…U+2069) فلا تنتقل الإشارة أو % إلى الطرف الآخر داخل النص العربي. */
const ltr = (s: string) => `\u2066${s}\u2069`

/** مبلغ بالدرهم بصيغة مختصرة، مع الإشارة للسالب. */
export function money(n: number | null | undefined): string {
  if (n == null) return '—'
  const [num, ...unit] = fmtAmount(Math.abs(n)).split(' ')
  return ltr((n < 0 ? '−' : '') + num) + (unit.length ? ' ' + unit.join(' ') : '')
}
/** نسبة مئوية بمنزلتين، مع إشارة اختيارية للموجب. */
export function pct(n: number | null | undefined, signed = false): string {
  if (n == null) return '—'
  return ltr(`${signed && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}%`)
}
/** رقم عشري (مضاعف، سعر للسهم…). */
export function dec(n: number | null | undefined, digits = 2): string {
  return n == null ? '—' : ltr((n < 0 ? '−' : '') + Math.abs(n).toFixed(digits))
}
/** رقم بإشارة صريحة (+ / −) — لتغيّر السعر بالدرهم. */
export function signed(n: number | null | undefined, digits = 3): string {
  return n == null ? '—' : ltr(`${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`)
}
/** عدد صحيح بفواصل الآلاف. */
export function int(n: number | null | undefined): string {
  return n == null ? '—' : ltr(Math.round(n).toLocaleString('en-US'))
}
/** تاريخ ISO بصيغة عربية مقروءة. */
export function dateAr(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ar-AE', { day: 'numeric', month: 'long', year: 'numeric' })
}
export const tone = (n: number | null | undefined) => (n == null || n === 0 ? undefined : n > 0 ? 'up' : 'down')

/** رمز السهم في موقع السوق (قد يختلف عن رمز المنصة، مثل MASQ لبنك المشرق). */
export function exchangeCode(s: Stock): string {
  return (s.tradingview ?? `${s.ex}-${s.sym}`).split('-')[1] ?? s.sym
}

/** الروابط الرسمية للسهم: صفحة الشركة في سوق دبي (تداول وإفصاحات)، وصفحة ملكية الأجانب؛ وموقع سوق أبوظبي. */
export function officialLinks(s: Stock): { company: { url: string; label: string }; foreign: { url: string; label: string } } {
  if (s.ex === 'DFM') {
    const code = exchangeCode(s)
    return {
      company: { url: `https://www.dfm.ae/ar/the-exchange/market-information/company/${code}/trading`, label: `صفحة ${code} في سوق دبي المالي` },
      foreign: { url: 'https://www.dfm.ae/ar/the-exchange/statistics-reports/foreign-ownership', label: 'ملكية الأجانب في سوق دبي المالي' },
    }
  }
  const code = exchangeCode(s)
  return {
    company: { url: 'https://www.adx.ae/', label: `موقع سوق أبوظبي — ابحث بالرمز ${code}` },
    foreign: { url: 'https://www.adx.ae/', label: `موقع سوق أبوظبي — بيانات ${code}` },
  }
}
