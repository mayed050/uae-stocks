import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageHeader from '@/components/ui/PageHeader'
import { QueryClient } from '@tanstack/react-query'
import { AppProviders } from '@/store'

describe('PageHeader', () => {
  it('يعرض العنوان والوصف وشارة آخر تحديث', () => {
    render(
      <AppProviders client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <PageHeader title="عنوان الصفحة">نص الوصف</PageHeader>
      </AppProviders>,
    )
    expect(screen.getByRole('heading', { name: 'عنوان الصفحة' })).toBeInTheDocument()
    expect(screen.getByText(/نص الوصف/)).toBeInTheDocument()
    // تأتي شارة «آخر تحديث» من تاريخ بيانات seed المضمّنة
    expect(screen.getAllByText(/آخر تحديث/).length).toBeGreaterThan(0)
  })
})
