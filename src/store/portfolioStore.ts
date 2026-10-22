import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersistStorage } from 'zustand/middleware'
import { HoldingsSchema } from '@/data/schema'

/** حيازة في المحفظة: cost = إجمالي تكلفة الشراء (أساس التكلفة) لحساب العائد الحقيقي والربح/الخسارة. */
export interface Holding { sym: string; amount: number; shares: number; cost: number }

interface Persisted { portfolio: Holding[]; goal: number }

interface PortfolioState extends Persisted {
  setGoal: (g: number) => void
  add: (sym: string, price: number, amount: number) => void
  remove: (sym: string) => void
  setAmount: (sym: string, amount: number, price: number) => void
  setShares: (sym: string, shares: number, price: number) => void
  setCost: (sym: string, cost: number) => void
}

// المفاتيح القديمة نفسها في localStorage — فتبقى محافظ المستخدمين الحالية كما هي دون ترحيل يدوي.
const KEY_PORTFOLIO = 'dividend_portfolio'
const KEY_GOAL = 'dividend_goal'

/** محفظة نموذجية لأول زيارة (أسعار الشراء الافتراضية مضمّنة في التكلفة). */
const SAMPLE: Holding[] = [
  { sym: 'DEWA', amount: 15000, shares: 15000 / 2.61, cost: 14200 },
  { sym: 'EMIRATESNBD', amount: 30000, shares: 30000 / 27.62, cost: 26500 },
  { sym: 'EMAAR', amount: 25000, shares: 25000 / 11.78, cost: 23800 },
]

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // تخزين محظور (تصفّح خاص / إعدادات المتصفح)
  }
}

/** تخزين يقرأ ويكتب بالشكل القديم (مصفوفة + رقم) بدل غلاف zustand الافتراضي. */
const legacyStorage: PersistStorage<Persisted> = {
  getItem: () => {
    const rawP = read(KEY_PORTFOLIO)
    const rawG = read(KEY_GOAL)
    if (rawP === null && rawG === null) return null
    let portfolio = SAMPLE
    if (rawP !== null) {
      try {
        const r = HoldingsSchema.safeParse(JSON.parse(rawP))
        // ترحيل: الحيازات القديمة بلا cost تأخذ التكلفة = المبلغ (ربح/خسارة = 0 مبدئيًا)
        if (r.success) portfolio = r.data.map((h) => ({ ...h, cost: h.cost ?? h.amount }))
      } catch {
        /* JSON تالف — تُستخدم المحفظة النموذجية */
      }
    }
    const g = rawG !== null ? parseFloat(rawG) : NaN
    return { state: { portfolio, goal: Number.isFinite(g) && g > 0 ? g : 1000 }, version: 0 }
  },
  setItem: (_name, value) => {
    try {
      localStorage.setItem(KEY_PORTFOLIO, JSON.stringify(value.state.portfolio))
      localStorage.setItem(KEY_GOAL, String(value.state.goal))
    } catch {
      /* التخزين غير متاح — تبقى المحفظة في الذاكرة لهذه الجلسة */
    }
  },
  removeItem: () => {
    try {
      localStorage.removeItem(KEY_PORTFOLIO)
      localStorage.removeItem(KEY_GOAL)
    } catch {
      /* لا شيء */
    }
  },
}

const sharesFor = (amount: number, price: number) => (price > 0 ? amount / price : 0)

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      portfolio: SAMPLE,
      goal: 1000,
      setGoal: (goal) => set({ goal }),
      add: (sym, price, amount) =>
        set((s) =>
          s.portfolio.some((p) => p.sym === sym)
            ? s
            : { portfolio: [...s.portfolio, { sym, amount, shares: sharesFor(amount, price), cost: amount }] },
        ),
      remove: (sym) => set((s) => ({ portfolio: s.portfolio.filter((p) => p.sym !== sym) })),
      setAmount: (sym, amount, price) =>
        set((s) => ({ portfolio: s.portfolio.map((p) => (p.sym === sym ? { ...p, amount, shares: sharesFor(amount, price) } : p)) })),
      setShares: (sym, shares, price) =>
        set((s) => ({ portfolio: s.portfolio.map((p) => (p.sym === sym ? { ...p, shares, amount: shares * price } : p)) })),
      // أساس التكلفة لا يمسّ الكمية ولا القيمة السوقية
      setCost: (sym, cost) => set((s) => ({ portfolio: s.portfolio.map((p) => (p.sym === sym ? { ...p, cost } : p)) })),
    }),
    {
      name: KEY_PORTFOLIO,
      storage: legacyStorage,
      partialize: (s) => ({ portfolio: s.portfolio, goal: s.goal }),
    },
  ),
)
