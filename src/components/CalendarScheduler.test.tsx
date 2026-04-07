import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarScheduler } from './CalendarScheduler'
import { useAppStore } from '@/store'

// Mock dnd-kit so we can intercept drag callbacks without real pointer events
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    DndContext: ({ onDragEnd, onDragStart, children }: any) => {
      ;(window as any).__dndCallbacks = { onDragEnd, onDragStart }
      return <>{children}</>
    },
    DragOverlay: ({ children }: any) => <>{children}</>,
    useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
    useDraggable: () => ({ setNodeRef: () => {}, attributes: {}, listeners: {}, transform: null, isDragging: false }),
    useSensor: (_sensor: any, _opts?: any) => null,
    useSensors: (..._args: any[]) => [],
  }
})

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

// Seed state without wiping Zustand action functions (no replace=true)
function seedState(partial: Partial<{
  dogs: ReturnType<typeof makeDog>[]
  walkGroups: { id: string; name: string; dogIds: string[] }[]
  walkSessions: { id: string; groupId: string; slot: { dayOfWeek: number; hour: number; minute: number } }[]
  compatibilityEntries: { dogIdA: string; dogIdB: string; status: string }[]
}>) {
  useAppStore.setState(partial)
}

beforeEach(() => {
  // Reset to a known baseline without destroying action functions
  useAppStore.setState({
    dogs: [
      makeDog('dog-1', 'Rex'),
      makeDog('dog-2', 'Bella'),
    ],
    walkGroups: [
      { id: 'group-1', name: 'Morning Walk', dogIds: ['dog-1', 'dog-2'] },
      { id: 'group-2', name: 'Afternoon Walk', dogIds: [] },
    ],
    walkSessions: [],
    compatibilityEntries: [],
  })
  delete (window as any).__dndCallbacks
})

describe('CalendarScheduler', () => {
  it('renders sidebar with unscheduled groups', () => {
    render(<CalendarScheduler />)
    expect(screen.getByText(/Morning Walk/)).toBeInTheDocument()
    expect(screen.getByText(/Afternoon Walk/)).toBeInTheDocument()
  })

  it('scheduling a group adds it to the slot and removes it from sidebar', () => {
    render(<CalendarScheduler />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'group-1', data: { current: { type: 'group', groupId: 'group-1' } } },
        over: { id: '1:9:0' },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    const sessions = useAppStore.getState().walkSessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].groupId).toBe('group-1')
  })

  it('dropping onto an occupied slot (different group) is rejected', () => {
    useAppStore.setState({
      walkSessions: [
        { id: 'session-1', groupId: 'group-1', slot: { dayOfWeek: 1, hour: 9, minute: 0 } },
      ],
    })

    render(<CalendarScheduler />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'group-2', data: { current: { type: 'group', groupId: 'group-2' } } },
        over: { id: '1:9:0' },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    const sessions = useAppStore.getState().walkSessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].groupId).toBe('group-1')
  })

  it('unschedule via x button removes group from slot and returns to sidebar', async () => {
    useAppStore.setState({
      walkSessions: [
        { id: 'session-1', groupId: 'group-1', slot: { dayOfWeek: 1, hour: 9, minute: 0 } },
      ],
    })

    render(<CalendarScheduler />)

    const user = userEvent.setup()
    const removeBtn = screen.getByRole('button', { name: /Remove Morning Walk/i })
    await user.click(removeBtn)

    expect(useAppStore.getState().walkSessions).toHaveLength(0)
    expect(screen.getByText(/Morning Walk/)).toBeInTheDocument()
  })

  it('unschedule via drag to sidebar removes group from slot', () => {
    useAppStore.setState({
      walkSessions: [
        { id: 'session-1', groupId: 'group-1', slot: { dayOfWeek: 1, hour: 9, minute: 0 } },
      ],
    })

    render(<CalendarScheduler />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'scheduled-group-1', data: { current: { type: 'scheduled-group', groupId: 'group-1' } } },
        over: { id: 'group-sidebar' },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    expect(useAppStore.getState().walkSessions).toHaveLength(0)
  })

  it('moving a scheduled group to a different slot updates its position', () => {
    useAppStore.setState({
      walkSessions: [
        { id: 'session-1', groupId: 'group-1', slot: { dayOfWeek: 1, hour: 9, minute: 0 } },
      ],
    })

    render(<CalendarScheduler />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'scheduled-group-1', data: { current: { type: 'scheduled-group', groupId: 'group-1' } } },
        over: { id: '1:10:0' },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    const sessions = useAppStore.getState().walkSessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].slot.hour).toBe(10)
  })

  it('scheduled card displays group name and dog count', () => {
    useAppStore.setState({
      walkSessions: [
        { id: 'session-1', groupId: 'group-1', slot: { dayOfWeek: 1, hour: 9, minute: 0 } },
      ],
    })

    render(<CalendarScheduler />)

    // Group name appears in the scheduled card
    expect(screen.getAllByText(/Morning Walk/).length).toBeGreaterThan(0)
    expect(screen.getByText('2 dogs')).toBeInTheDocument()
  })

  it('scheduled card shows conflict warning icon when group has conflict pairs', () => {
    useAppStore.setState({
      compatibilityEntries: [
        { dogIdA: 'dog-1', dogIdB: 'dog-2', status: 'conflict' },
      ],
      walkSessions: [
        { id: 'session-1', groupId: 'group-1', slot: { dayOfWeek: 1, hour: 9, minute: 0 } },
      ],
    })

    render(<CalendarScheduler />)

    // AlertTriangle renders as an SVG when conflicts are present
    const warningIcons = document.querySelectorAll('svg.lucide-triangle-alert')
    expect(warningIcons.length).toBeGreaterThan(0)
  })

  it('sidebar shows "No groups yet" when no walk groups exist', () => {
    useAppStore.setState({ walkGroups: [] })

    render(<CalendarScheduler />)

    expect(screen.getByText(/No groups yet/i)).toBeInTheDocument()
  })

  it('sidebar shows "All groups are scheduled" when every group is scheduled', () => {
    useAppStore.setState({
      walkSessions: [
        { id: 'session-1', groupId: 'group-1', slot: { dayOfWeek: 1, hour: 9, minute: 0 } },
        { id: 'session-2', groupId: 'group-2', slot: { dayOfWeek: 1, hour: 10, minute: 0 } },
      ],
    })

    render(<CalendarScheduler />)

    expect(screen.getByText('All groups are scheduled this week.')).toBeInTheDocument()
  })
})
