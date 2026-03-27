import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EdgeSheet } from './EdgeSheet'

describe('EdgeSheet', () => {
  const mockOnSetStatus = vi.fn()
  const mockOnRemove = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderEdgeSheet() {
    return render(
      <EdgeSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        dogNameA="Rex"
        dogNameB="Bella"
        currentStatus="neutral"
        onSetStatus={mockOnSetStatus}
        onRemove={mockOnRemove}
      />
    )
  }

  it('renders both dog names in the sheet title as "Rex & Bella"', () => {
    renderEdgeSheet()
    expect(screen.getByText('Rex & Bella')).toBeTruthy()
  })

  it('shows the current status via CompatBadge', () => {
    renderEdgeSheet()
    // CompatBadge renders a <span> with the status label; use getAllByText and confirm at least one exists
    const neutralElements = screen.getAllByText('Neutral')
    expect(neutralElements.length).toBeGreaterThanOrEqual(1)
  })

  it('clicking "Compatible" then "Set compatibility" calls onSetStatus with "compatible"', () => {
    renderEdgeSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Compatible' }))
    fireEvent.click(screen.getByRole('button', { name: 'Set compatibility' }))
    expect(mockOnSetStatus).toHaveBeenCalledWith('compatible')
    expect(mockOnSetStatus).toHaveBeenCalledTimes(1)
  })

  it('clicking "Conflict" then "Set compatibility" calls onSetStatus with "conflict"', () => {
    renderEdgeSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Conflict' }))
    fireEvent.click(screen.getByRole('button', { name: 'Set compatibility' }))
    expect(mockOnSetStatus).toHaveBeenCalledWith('conflict')
    expect(mockOnSetStatus).toHaveBeenCalledTimes(1)
  })

  it('clicking "Remove relationship" calls onRemove once', () => {
    renderEdgeSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Remove relationship' }))
    expect(mockOnRemove).toHaveBeenCalledTimes(1)
  })

  it('clicking "Discard changes" calls onOpenChange(false) and does not call onSetStatus or onRemove', () => {
    renderEdgeSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    expect(mockOnSetStatus).not.toHaveBeenCalled()
    expect(mockOnRemove).not.toHaveBeenCalled()
  })

  it('status buttons use aria-pressed: selected button is true, others are false', () => {
    renderEdgeSheet()
    const compatibleBtn = screen.getByRole('button', { name: 'Compatible' })
    const neutralBtn = screen.getByRole('button', { name: 'Neutral' })
    const conflictBtn = screen.getByRole('button', { name: 'Conflict' })
    const unknownBtn = screen.getByRole('button', { name: 'Unknown' })

    // Initially none selected — all false
    expect(compatibleBtn.getAttribute('aria-pressed')).toBe('false')
    expect(neutralBtn.getAttribute('aria-pressed')).toBe('false')

    // After clicking Compatible, it should be pressed
    fireEvent.click(compatibleBtn)
    expect(compatibleBtn.getAttribute('aria-pressed')).toBe('true')
    expect(neutralBtn.getAttribute('aria-pressed')).toBe('false')
    expect(conflictBtn.getAttribute('aria-pressed')).toBe('false')
    expect(unknownBtn.getAttribute('aria-pressed')).toBe('false')
  })
})
