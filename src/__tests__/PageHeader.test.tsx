import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageHeader from '@/components/ui/PageHeader'
import { StocksProvider } from '@/store'

describe('PageHeader', () => {
  it('يعرض العنوان والوصف وشارة آخر تحديث', () => {
    render(
      <StocksProvider>
        <PageHeader title="عنوان الصفحة">نص الوصف</PageHeader>
      </StocksProvider>,
    )
    expect(screen.getByRole('heading', { name: 'عنوان الصفحة' })).toBeInTheDocument()
    expect(screen.getByText(/نص الوصف/)).toBeInTheDocument()
    // تأتي شارة «آخر تحديث» من تاريخ بيانات seed المضمّنة
    expect(screen.getAllByText(/آخر تحديث/).length).toBeGreaterThan(0)
  })
})
