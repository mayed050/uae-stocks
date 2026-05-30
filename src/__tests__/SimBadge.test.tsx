import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SimBadge from '@/components/ui/SimBadge'

describe('SimBadge', () => {
  it('يعرض النص الافتراضي', () => {
    render(<SimBadge />)
    expect(screen.getByText('بيانات توضيحية')).toBeInTheDocument()
  })

  it('يقبل نصاً ووصفاً مخصّصين', () => {
    render(<SimBadge title="شرح">قيم توضيحية</SimBadge>)
    const el = screen.getByText('قيم توضيحية')
    expect(el).toHaveClass('sim-badge')
    expect(el).toHaveAttribute('title', 'شرح')
  })
})
