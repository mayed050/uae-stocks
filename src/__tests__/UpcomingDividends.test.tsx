import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { AppProviders } from '@/store'
import { usePortfolioStore } from '@/store/portfolioStore'
import UpcomingDividends from '@/features/overview/UpcomingDividends'
import { makeStock, isoDaysFromNow } from './factory'

const stocks = [
  makeStock({ sym: 'BBB', name: 'شركة ب — وصف' }, { exd: isoDaysFromNow(5), pay: isoDaysFromNow(20), auto: { src: 'tradingview', asof: isoDaysFromNow(0), fields: ['pay'] } }),
  makeStock({ sym: 'AAA', name: 'شركة أ' }, { lastEnt: isoDaysFromNow(0) }),
  makeStock({ sym: 'OLD', name: 'شركة قديمة' }, { exd: isoDaysFromNow(-3) }), // منقضٍ
  makeStock({ sym: 'FAR', name: 'شركة بعيدة' }, { exd: isoDaysFromNow(45) }), // خارج نافذة 30 يومًا
]

function renderAgenda(onOpen = vi.fn()) {
  render(
    <AppProviders client={new QueryClient()}>
      <UpcomingDividends stocks={stocks} onOpen={onOpen} />
    </AppProviders>,
  )
  return onOpen
}

describe('أجندة مواعيد التوزيع القادمة', () => {
  beforeEach(() => usePortfolioStore.setState({ portfolio: [] }))

  it('تعرض مواعيد الثلاثين يومًا فقط، مرتّبة زمنيًا، مع مصدر التاريخ الآلي', () => {
    renderAgenda()
    const items = screen.getAllByRole('listitem')
    expect(items.map((li) => li.querySelector('.ov-ag-sym')?.textContent)).toEqual(['AAA', 'BBB', 'BBB'])
    expect(within(items[0]!).getByText('اليوم')).toBeInTheDocument()
    expect(within(items[0]!).getByText('آخر يوم شراء')).toBeInTheDocument()
    expect(within(items[2]!).getByText('الدفع')).toBeInTheDocument()
    expect(within(items[2]!).getByText('يلزم التحقق')).toBeInTheDocument() // الدفع آلي
    expect(within(items[1]!).queryByText('يلزم التحقق')).toBeNull() // الاستبعاد يدوي
    expect(screen.getByText('3 موعدًا خلال 30 يومًا')).toBeInTheDocument()
  })

  it('«محفظتي» تقصر المواعيد على أسهم المحفظة، وتعرض رسالة حين لا شيء', () => {
    renderAgenda()
    fireEvent.click(screen.getByRole('button', { name: /محفظتي/ }))
    expect(screen.getByText(/لا مواعيد توزيع لأسهم محفظتك/)).toBeInTheDocument()
  })

  it('النقر على موعد يفتح بطاقة السهم', () => {
    const onOpen = renderAgenda()
    fireEvent.click(screen.getAllByRole('button', { name: /شركة أ/ })[0]!)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ sym: 'AAA' }))
  })
})
