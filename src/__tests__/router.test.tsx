import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { AppProviders } from '@/store'
import { createAppRouter } from '@/router'
import { validateRootSearch, validateScreenerSearch, validateFinancialsSearch } from '@/search'

function renderAt(url: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [url] }))
  render(
    <AppProviders client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}

describe('معاملات الرابط', () => {
  it('يقبل رمز سهم صالحًا ويوحّد حالة الأحرف', () => {
    expect(validateRootSearch({ stock: 'emaar' })).toEqual({ stock: 'EMAAR' })
  })
  it('يهمل القيم غير الصالحة بدل رفض الرابط كاملًا', () => {
    expect(validateRootSearch({ stock: '<script>' })).toEqual({})
    expect(validateScreenerSearch({ ex: 'NYSE', cat: 'growth', sort: 'hack', q: '  بنك  ', view: 'sectors' })).toEqual({
      cat: 'growth',
      q: 'بنك',
      view: 'sectors',
    })
    expect(validateFinancialsSearch({ sym: 'fab', tab: 'nope' })).toEqual({ sym: 'FAB' })
  })
})

describe('التوجيه', () => {
  it('رابط ?stock= يفتح بطاقة السهم فوق الصفحة', async () => {
    renderAt('/screener?stock=DEWA')
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(/DEWA/).length).toBeGreaterThan(0)
    expect(document.title).toContain('DEWA')
  })

  it('فلاتر المستكشف تُقرأ من الرابط', async () => {
    renderAt('/screener?ex=ADX&cat=income')
    await screen.findByRole('heading', { name: 'مستكشف الأسهم' })
    // كل الصفوف المعروضة من سوق أبوظبي فقط
    await waitFor(() => {
      const rows = document.querySelectorAll('.tablewrap tbody tr')
      expect(rows.length).toBeGreaterThan(0)
      rows.forEach((r) => expect(r.textContent).toContain('ADX'))
    })
  })

  it('مسار غير معروف يعرض صفحة «غير موجودة» مع رابط للعودة', async () => {
    renderAt('/no-such-page')
    expect(await screen.findByText('الصفحة غير موجودة')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'العودة إلى النظرة العامة' })).toBeInTheDocument()
  })

  it('رابط التنقّل للصفحة الحالية يحمل حالة النشاط', async () => {
    renderAt('/dividends')
    const links = await screen.findAllByRole('link', { name: /التوزيعات/ })
    expect(links.some((l) => l.classList.contains('active'))).toBe(true)
    const overview = screen.getAllByRole('link', { name: /نظرة عامة/ })
    expect(overview.every((l) => !l.classList.contains('active'))).toBe(true)
  })
})
