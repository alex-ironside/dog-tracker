import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduledGroupCard } from './ScheduledGroupCard'

// Mock dnd-kit since we don't need real drag in these unit tests
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    setNodeRef: () => {},
    attributes: {},
    listeners: {},
    transform: null,
    isDragging: false,
  }),
}))

const defaultProps = {
  groupId: 'group-1',
  groupName: 'Morning Walk',
  dogCount: 2,
  hasConflicts: false,
  score: 85,
  onRemove: vi.fn(),
  onLog: vi.fn(),
  dayName: 'Mon',
  hour: 9,
  dogNames: [],
  dogIds: [],
  multiWalkCounts: new Map<string, number>(),
  highlightDogId: null,
}

describe('ScheduledGroupCard', () => {
  it('renders dog name pills when dogNames prop is provided', () => {
    render(
      <ScheduledGroupCard
        {...defaultProps}
        dogNames={['Rex', 'Luna']}
        dogIds={['dog-1', 'dog-2']}
        multiWalkCounts={new Map()}
      />
    )

    expect(screen.getByText('Rex')).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()
  })

  it('renders multi-walk badge x2 on pill when multiWalkCounts has count > 1', () => {
    render(
      <ScheduledGroupCard
        {...defaultProps}
        dogNames={['Rex', 'Luna']}
        dogIds={['dog-1', 'dog-2']}
        multiWalkCounts={new Map([['dog-1', 2]])}
      />
    )

    // The x2 badge should appear for Rex (dog-1) but not Luna (dog-2)
    expect(screen.getByText('x2')).toBeInTheDocument()
  })

  it('does NOT render multi-walk badge when count is 1', () => {
    render(
      <ScheduledGroupCard
        {...defaultProps}
        dogNames={['Rex']}
        dogIds={['dog-1']}
        multiWalkCounts={new Map([['dog-1', 1]])}
      />
    )

    expect(screen.queryByText('x1')).not.toBeInTheDocument()
    expect(screen.queryByText(/^x\d/)).not.toBeInTheDocument()
  })

  it('applies highlight ring class when highlightDogId matches a dog', () => {
    const { container } = render(
      <ScheduledGroupCard
        {...defaultProps}
        dogNames={['Rex', 'Luna']}
        dogIds={['dog-1', 'dog-2']}
        multiWalkCounts={new Map()}
        highlightDogId="dog-1"
      />
    )

    // Find the pill for Rex — it should have ring-2 styling
    const pills = container.querySelectorAll('span[class*="rounded-full"]')
    const rexPill = Array.from(pills).find(el => el.textContent?.includes('Rex'))
    expect(rexPill?.className).toContain('ring-2')

    // Luna's pill should NOT have the ring
    const lunaPill = Array.from(pills).find(el => el.textContent?.includes('Luna'))
    expect(lunaPill?.className).not.toContain('ring-2')
  })

  it('does not crash when multiWalkCounts is empty', () => {
    expect(() =>
      render(
        <ScheduledGroupCard
          {...defaultProps}
          dogNames={['Rex']}
          dogIds={['dog-1']}
          multiWalkCounts={new Map()}
        />
      )
    ).not.toThrow()
  })
})
