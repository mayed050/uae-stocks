import Financials from '@/features/financials/Financials'
import { useOpenStock } from './useOpenStock'

export default function FinancialsPage() {
  return <Financials onOpen={useOpenStock()} />
}
