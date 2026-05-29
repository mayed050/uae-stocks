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

  const withDays = cands.map((c) => ({ ...c, n: daysUntil(c.d) }))

  // أولاً: أقرب تاريخ مستقبلي (n >= 0)
  const future = withDays
    .filter((c): c is { d: Date; label: string; ps?: string | null; n: number } => c.n !== null && c.n >= 0)
    .sort((a, b) => a.n - b.n)

  if (future.length) return { n: future[0].n, label: future[0].label, ps: future[0].ps }

  // ثانياً: إن لم يوجد مستقبلي، أعد آخر تاريخ منقضٍ مع علامة "تم الإيداع"
  const past = withDays
    .filter((c): c is { d: Date; label: string; ps?: string | null; n: number } => c.n !== null && c.n < 0)
    .sort((a, b) => b.n - a.n) // الأقرب للحاضر أولاً

  if (past.length) {
    return {
      n: past[0].n,
      label: 'تم الإيداع ✅',
      ps: item.div.ps,
      payHint: item.div.pay ?? undefined
    }
  }

  if (item.div.watch) return { n: null, watch: true, label: 'توزيع قادم (التاريخ لم يُعلن)', ps: item.div.ps, payHint: item.div.nextPay }
  return null
}

/** هل يقع ضمن نافذة التنبيه (0–30 يومًا مستقبلاً) أو توزيع مُراقب بلا تاريخ. */
export function isAlert(u: Upcoming | null): boolean {
  if (!u) return false
  // فقط التوزيعات القادمة خلال 30 يوماً، أو العناصر المراقبة (watch) بدون تاريخ
  // التواريخ الماضية (n < 0) لا تُشعل تنبيهاً — تُعرض فقط في جدول التقويم
  return Boolean(u.watch) || (u.n !== null && u.n >= 0 && u.n <= 30)
}
