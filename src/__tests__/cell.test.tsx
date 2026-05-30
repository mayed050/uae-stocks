import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { cell } from '@/components/ui/cell'

describe('cell', () => {
  it('يعرض القيمة كما هي', () => {
    render(<span>{cell('قيمة فعلية')}</span>)
    expect(screen.getByText('قيمة فعلية')).toBeInTheDocument()
  })

  it('يعرض شارة «يلزم التحقق» للقيم الفارغة', () => {
    const { container } = render(<span>{cell(null)}</span>)
    const na = container.querySelector('.na')
    expect(na).not.toBeNull()
    expect(na).toHaveTextContent('يلزم التحقق')
  })

  it('يعرض الرقم صفر كقيمة وليس فارغاً', () => {
    render(<span>{cell(0)}</span>)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
