import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompatBadge } from './CompatBadge'

describe('CompatBadge', () => {
  it('renders Compatible text for compatible status', () => {
    const { container } = render(<CompatBadge status='compatible' />)
    expect(screen.getByText('Compatible')).toBeTruthy()
    expect(container.querySelector('span')).toBeTruthy()
  })

  it('renders Neutral text for neutral status', () => {
    render(<CompatBadge status='neutral' />)
    expect(screen.getByText('Neutral')).toBeTruthy()
  })

  it('renders Conflict text for conflict status', () => {
    render(<CompatBadge status='conflict' />)
    expect(screen.getByText('Conflict')).toBeTruthy()
  })

  it('renders Unknown text and border-dashed class for unknown status', () => {
    const { container } = render(<CompatBadge status='unknown' />)
    expect(screen.getByText('Unknown')).toBeTruthy()
    const span = container.querySelector('span')
    expect(span?.className).toContain('border-dashed')
  })
})
