import { beforeAll, describe, it, expect } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { AppProviders } from '@/store'
import { createAppRouter } from '@/router'
import { LazyStockDetail } from '@/components/lazy'
import { validateRootSearch, validateScreenerSearch, validateFinancialsSearch } from '@/search'

// بطاقة السهم والصفحات حِزم تُجلب عند الطلب، وتحويلها أول مرة في بيئة الاختبار بطيء (مكتبتا الرسم)؛
// فتُحمَّل مرة واحدة مسبقًا كي تقيس الاختبارات سلوك التوجيه لا زمن التحويل.
beforeAll(async () => {
  await Promise.all([LazyStockDetail.preload?.(), import('@/routes/screener'), import('@/routes/dividends')])
}, 60_000)

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

  it('صفحة الشروط لها مسار وعنوان، ورابطها في تذييل كل صفحة', async () => {
    renderAt('/terms')
    expect(await screen.findByRole('heading', { level: 1, name: 'الشروط وإخلاء المسؤولية' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /لا توصية ولا استشارة/ })).toBeInTheDocument()
    expect(document.title).toContain('الشروط وإخلاء المسؤولية')
    const footerLink = document.querySelector('.site-foot a[href$="/terms"]')
    expect(footerLink).not.toBeNull()
  })

  it('رابط التنقّل للصفحة الحالية يحمل حالة النشاط', async () => {
    renderAt('/dividends')
    const links = await screen.findAllByRole('link', { name: /التوزيعات/ })
    expect(links.some((l) => l.classList.contains('active'))).toBe(true)
    const overview = screen.getAllByRole('link', { name: /نظرة عامة/ })
    expect(overview.every((l) => !l.classList.contains('active'))).toBe(true)
  })

  it('لوحة البحث (Ctrl+K) تجد السهم رغم اختلاف الهمزة وتفتح بطاقته', async () => {
    const router = renderAt('/dividends')
    await screen.findByRole('heading', { level: 1, name: /التوزيعات/ })
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const input = await screen.findByPlaceholderText(/ابحث باسم الشركة/)
    fireEvent.change(input, { target: { value: 'اعمار للتطوير' } })
    const option = await screen.findByRole('option', { name: /إعمار للتطوير/ })
    fireEvent.click(option)
    await waitFor(() => expect(router.state.location.search).toEqual({ stock: 'EMAARDEV' }))
    expect(router.state.location.pathname).toBe('/dividends')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})
