import { useNavigate } from '@tanstack/react-router'
import type { Stock } from '@/data'

/** فتح بطاقة سهم فوق الصفحة الحالية بإضافة ?stock= إلى الرابط (زر الرجوع يغلقها). */
export function useOpenStock() {
  const navigate = useNavigate()
  return (s: Stock) => void navigate({ to: '.', search: (prev) => ({ ...prev, stock: s.sym }) })
}
