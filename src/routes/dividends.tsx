import Dividends from '@/features/dividends/Dividends'
import { useOpenStock } from './useOpenStock'

export default function DividendsPage() {
  return <Dividends onOpen={useOpenStock()} />
}
