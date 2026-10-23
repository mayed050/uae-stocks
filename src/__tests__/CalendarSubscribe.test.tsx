import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CalendarSubscribe from '@/components/CalendarSubscribe'

describe('الاشتراك في التقويم', () => {
  it('روابط Google وwebcal تشير إلى تقويم السهم', () => {
    render(<CalendarSubscribe sym="EMAAR" />)
    const webcal = screen.getByRole('link', { name: /Apple \/ Outlook/ }).getAttribute('href')!
    expect(webcal).toMatch(/^webcal:\/\/.+\/calendar\/EMAAR\.ics$/)
    const google = screen.getByRole('link', { name: /Google/ }).getAttribute('href')!
    expect(google).toBe(`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`)
  })

  it('نسخ الرابط يؤكّد النجاح، ويعرض الرابط إن منع المتصفح الحافظة', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<CalendarSubscribe />)
    fireEvent.click(screen.getByRole('button', { name: /نسخ رابط تقويم توزيعات السوق كاملًا/ }))
    expect(await screen.findByText(/نُسخ الرابط/)).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/calendar\/all\.ics$/))
    fireEvent.click(screen.getByRole('button', { name: /نسخ رابط/ }))
    expect(await screen.findByText(/calendar\/all\.ics$/)).toBeInTheDocument()
  })
})
