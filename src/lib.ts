import type { Stock } from './data'

export interface Upcoming {
  n: number | null        // الأيام المتبقية
  label: string
  ps?: string | null
  watch?: boolean
  payHint?: string
}

export function parseISO(s: string | null | undefined): Date | null {
  if (!s) return null
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(+m[1], +m[2] - 1, +m[3])
}

export function daysUntil(d: Date | null): number | null {
  if (!d) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

/** أقرب تاريخ استحقاق قادم (الاستبعاد الأساسي أو الشريحة القادمة أو آخر يوم شراء). */
export function upcoming(item: Stock): Upcoming | null {
  const cands: { d: Date; label: string; ps?: string | null }[] = []
  const e1 = parseISO(item.div.exd); if (e1) cands.push({ d: e1, label: 'تاريخ الاستبعاد', ps: item.div.ps })
  const e2 = parseISO(item.div.nextExd); if (e2) cands.push({ d: e2, label: 'الشريحة القادمة', ps: item.div.note ?? item.div.ps })
  const le = parseISO(item.div.lastEnt); if (le) cands.push({ d: le, label: 'آخر يوم شراء', ps: item.div.ps })

  const future = cands
    .map((c) => ({ ...c, n: daysUntil(c.d) }))
    .filter((c): c is { d: Date; label: string; ps?: string | null; n: number } => c.n !== null && c.n >= 0)
    .sort((a, b) => a.n - b.n)

  if (future.length) return { n: future[0].n, label: future[0].label, ps: future[0].ps }
  if (item.div.watch) return { n: null, watch: true, label: 'توزيع قادم (التاريخ لم يُعلن)', ps: item.div.ps, payHint: item.div.nextPay }
  return null
}

/** هل يقع ضمن نافذة التنبيه (≤30 يومًا) أو توزيع مُراقب بلا تاريخ. */
export function isAlert(u: Upcoming | null): boolean {
  if (!u) return false
  return Boolean(u.watch) || (u.n !== null && u.n <= 30)
}
