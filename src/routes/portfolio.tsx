import Portfolio from '@/features/portfolio/Portfolio'
import { useOpenStock } from './useOpenStock'

export default function PortfolioPage() {
  return <Portfolio onOpen={useOpenStock()} />
}
