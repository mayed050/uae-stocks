import Screener from '@/features/screener/Screener'
import { useOpenStock } from './useOpenStock'

export default function ScreenerPage() {
  return <Screener onOpen={useOpenStock()} />
}
