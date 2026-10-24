import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { AppProviders } from '@/store'
import ScreenerCards from '@/features/screener/ScreenerCards'
import { makeStock } from './factory'

const rows = [makeStock({ sym: 'AAA', name: 'شركة أ — وصف', change: 1.25 }), makeStock({ sym: 'BBB', name: 'شركة ب', change: -0.5, cat: 'growth' })]

function renderCards(over: Partial<Parameters<typeof ScreenerCards>[0]> = {}) {
  const props = { rows, sort: 'mcap' as const, desc: true, onSort: vi.fn(), onOpen: vi.fn(), ...over }
  render(
    <AppProviders client={new QueryClient()}>
      <ScreenerCards {...props} />
    </AppProviders>,
  )
  return props
}

describe('المستكشف بالبطاقات (الجوال)', () => {
  it('بطاقة لكل سهم بالاسم والتغيّر والتصنيف، والنقر يفتح السهم', () => {
    const { onOpen } = renderCards()
    const cards = within(screen.getByRole('list', { name: /نتائج المستكشف — 2/ })).getAllByRole('listitem')
    expect(cards).toHaveLength(2)
    expect(within(cards[0]!).getByText('شركة أ')).toBeInTheDocument()
    expect(within(cards[0]!).getByText(/1\.25%/)).toBeInTheDocument()
    expect(within(cards[1]!).getByText('نمو')).toBeInTheDocument()
    fireEvent.click(within(cards[1]!).getByRole('button', { name: /شركة ب/ }))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ sym: 'BBB' }))
  })

  it('الترتيب من القائمة المنسدلة وزر الاتجاه', () => {
    const { onSort } = renderCards()
    fireEvent.change(screen.getByLabelText('ترتيب حسب'), { target: { value: 'name' } })
    expect(onSort).toHaveBeenLastCalledWith('name', false) // الاسم تصاعديًا أولًا
    fireEvent.click(screen.getByRole('button', { name: /الترتيب تنازلي/ }))
    expect(onSort).toHaveBeenLastCalledWith('mcap', false)
  })
})
