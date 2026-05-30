import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '@/components/ui/StatCard'

describe('StatCard', () => {
  it('يعرض القيمة والعنوان والسطر الفرعي', () => {
    render(<StatCard value="1,000 درهم" label="إجمالي المستثمر" sub="3 شركات" />)
    expect(screen.getByText('1,000 درهم')).toBeInTheDocument()
    expect(screen.getByText('إجمالي المستثمر')).toBeInTheDocument()
    expect(screen.getByText('3 شركات')).toBeInTheDocument()
  })

  it('يطبّق لون القيمة الممرّر', () => {
    render(<StatCard value="5%" label="عائد" color="rgb(33, 201, 139)" />)
    expect(screen.getByText('5%')).toHaveStyle({ color: 'rgb(33, 201, 139)' })
  })

  it('يحذف السطر الفرعي عند غيابه', () => {
    const { container } = render(<StatCard value="1" label="بلا سطر فرعي" />)
    expect(container.querySelector('.stat-sub')).toBeNull()
  })
})
