import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupPanel } from './GroupPanel'

// Mock dnd-kit so GroupPanel can render without a DndContext
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  }
})

// Mock getBoundingClientRect for SVG conflict overlay tests
const mockGetBoundingClientRect = vi.fn()
Element.prototype.getBoundingClientRect = mockGetBoundingClientRect

function makeGroup(id: string, name: string, dogIds: string[] = []) {
  return { id, name, dogIds }
}

function makeDog(id: string, name: string) {
  return {
    id,
    name,
    breed: 'Mixed',
    age: 2,
    notes: '',
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const defaultProps = {
  group: makeGroup('g1', 'Group 1', ['a', 'b']),
  dogs: [makeDog('a', 'Rex'), makeDog('b', 'Buddy')],
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onRemoveDog: vi.fn(),
  score: 100,
  hasConflicts: false,
  conflicts: [],
  onConflictClick: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetBoundingClientRect.mockReturnValue({
    left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {},
  })
})

describe('GroupPanel', () => {
  it('score badge renders correct value with green classes for high score', () => {
    render(<GroupPanel {...defaultProps} score={85} />)
    const badge = screen.getByText('Score: 85')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-green-100')
  })

  it('score badge uses yellow classes for mid-range score', () => {
    render(<GroupPanel {...defaultProps} score={60} />)
    const badge = screen.getByText('Score: 60')
    expect(badge.className).toContain('bg-yellow-100')
  })

  it('score badge uses red classes for low score', () => {
    render(<GroupPanel {...defaultProps} score={30} />)
    const badge = screen.getByText('Score: 30')
    expect(badge.className).toContain('bg-red-100')
  })

  it('warning icon shown when hasConflicts is true', () => {
    render(<GroupPanel {...defaultProps} hasConflicts={true} />)
    // AlertTriangle from lucide-react renders as an SVG; check for the container
    const header = screen.getByText('Score: 100').closest('div')!.parentElement!
    // The AlertTriangle SVG will be in the header
    const svgs = header.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('warning icon hidden when hasConflicts is false', () => {
    const { container } = render(<GroupPanel {...defaultProps} hasConflicts={false} />)
    // The header area should not contain the amber warning svg
    const header = container.querySelector('.bg-slate-50')!
    // AlertTriangle is a lucide SVG with amber color class — check class on parent
    const amberEl = header.querySelector('.text-amber-500')
    expect(amberEl).not.toBeInTheDocument()
  })

  it('conflict lines render for conflict-status pairs', async () => {
    // Set up mocked rects so overlay can compute non-zero line positions
    mockGetBoundingClientRect.mockImplementation(function (this: Element) {
      if (this.getAttribute('data-testid') === 'group-body') {
        return { left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => {} }
      }
      if (this.getAttribute('data-card-id') === 'a') {
        return { left: 50, top: 50, width: 80, height: 30, right: 130, bottom: 80, x: 50, y: 50, toJSON: () => {} }
      }
      if (this.getAttribute('data-card-id') === 'b') {
        return { left: 200, top: 50, width: 80, height: 30, right: 280, bottom: 80, x: 200, y: 50, toJSON: () => {} }
      }
      return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} }
    })

    // Render with conflict pairs
    const { container, rerender } = render(
      <GroupPanel
        {...defaultProps}
        conflicts={[{ idA: 'a', idB: 'b', status: 'conflict' }]}
      />
    )

    // Force a re-render to trigger useLayoutEffect with fresh deps and flush state updates
    await act(async () => {
      rerender(
        <GroupPanel
          {...defaultProps}
          conflicts={[{ idA: 'a', idB: 'b', status: 'conflict' }]}
        />
      )
    })

    const line = container.querySelector('line')
    expect(line).toBeInTheDocument()
    expect(line?.getAttribute('stroke')).toBe('#ef4444')
  })

  it('unknown-status pairs do NOT render conflict lines (D-04)', () => {
    const { container } = render(
      <GroupPanel
        {...defaultProps}
        conflicts={[{ idA: 'a', idB: 'b', status: 'unknown' }]}
      />
    )
    const line = container.querySelector('line')
    expect(line).not.toBeInTheDocument()
  })

  it('inline group name edit: click name, type new name, press Enter calls onRename', async () => {
    const onRename = vi.fn()
    render(<GroupPanel {...defaultProps} onRename={onRename} />)
    const user = userEvent.setup()

    const nameSpan = screen.getByText('Group 1')
    await user.click(nameSpan)

    const input = screen.getByDisplayValue('Group 1')
    await user.clear(input)
    await user.type(input, 'New Name')
    await user.keyboard('{Enter}')

    expect(onRename).toHaveBeenCalledWith('New Name')
  })

  it('delete button calls onDelete', async () => {
    const onDelete = vi.fn()
    render(<GroupPanel {...defaultProps} onDelete={onDelete} />)
    const user = userEvent.setup()

    const deleteBtn = screen.getByRole('button', { name: 'Delete Group 1' })
    await user.click(deleteBtn)

    expect(onDelete).toHaveBeenCalled()
  })

  it('remove button on mini card calls onRemoveDog', async () => {
    const onRemoveDog = vi.fn()
    render(<GroupPanel {...defaultProps} onRemoveDog={onRemoveDog} />)
    const user = userEvent.setup()

    const removeBtn = screen.getByRole('button', { name: 'Remove Rex from group' })
    await user.click(removeBtn)

    expect(onRemoveDog).toHaveBeenCalledWith('a')
  })
})
