import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompatBadge } from './CompatBadge'

describe('CompatBadge', () => {
  it('renders Compatible text and bg-green-100 class for compatible status', () => {
    const { container } = render(<CompatBadge status='compatible' />)
    expect(screen.getByText('Compatible')).toBeTruthy()
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-green-100')
  })

  it('renders Neutral text and bg-slate-100 class for neutral status', () => {
    const { container } = render(<CompatBadge status='neutral' />)
    expect(screen.getByText('Neutral')).toBeTruthy()
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-slate-100')
  })

  it('renders Conflict text and bg-red-100 class for conflict status', () => {
    const { container } = render(<CompatBadge status='conflict' />)
    expect(screen.getByText('Conflict')).toBeTruthy()
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-red-100')
  })

  it('renders Unknown text and border-dashed class for unknown status', () => {
    const { container } = render(<CompatBadge status='unknown' />)
    expect(screen.getByText('Unknown')).toBeTruthy()
    const span = container.querySelector('span')
    expect(span?.className).toContain('border-dashed')
  })
})
