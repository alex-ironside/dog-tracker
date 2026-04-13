import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupBuilder } from './GroupBuilder'
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

function makeDog(id: string, name: string, archived = false) {
  return {
    id,
    name,
    breed: 'Mixed',
    age: 2,
    notes: '',
    archived,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function makeGroup(id: string, name: string, dogIds: string[] = []) {
  return { id, name, dogIds }
}

beforeEach(() => {
  useAppStore.setState({
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    schemaVersion: 1,
  })
  delete (window as any).__dndCallbacks
})

describe('GroupBuilder', () => {
  it('renders roster panel with active dogs', () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'Rex'), makeDog('d2', 'Buddy')],
      walkGroups: [makeGroup('g1', 'Group 1')],
    })
    render(<GroupBuilder />)
    expect(screen.getByText('Rex')).toBeInTheDocument()
    expect(screen.getByText('Buddy')).toBeInTheDocument()
  })

  it('archived dogs do not appear in the roster', () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'ArchivedDog', true)],
      walkGroups: [makeGroup('g1', 'Group 1')],
    })
    render(<GroupBuilder />)
    expect(screen.queryByText('ArchivedDog')).not.toBeInTheDocument()
  })

  it('dogs in a group show greyed out with "in [GroupName]" label', () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'Rex')],
      walkGroups: [makeGroup('g1', 'Group 1', ['d1'])],
    })
    render(<GroupBuilder />)
    expect(screen.getByText('in Group 1')).toBeInTheDocument()
  })

  it('onDragEnd with over=groupId and data payload calls addDogToGroup with plain dogId', async () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'Rex')],
      walkGroups: [makeGroup('g1', 'Group 1')],
    })
    render(<GroupBuilder />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'g1-d1', data: { current: { dogId: 'd1', groupId: 'g1' } } },
        over: { id: 'g1', data: { current: {} } },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    expect(useAppStore.getState().walkGroups[0].dogIds).toContain('d1')
  })

  it('onDragEnd from roster (plain id, no data payload) calls addDogToGroup correctly', async () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'Rex')],
      walkGroups: [makeGroup('g1', 'Group 1')],
    })
    render(<GroupBuilder />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'd1', data: { current: {} } },
        over: { id: 'g1', data: { current: {} } },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    expect(useAppStore.getState().walkGroups[0].dogIds).toContain('d1')
  })

  it("onDragEnd with over='roster' and data payload calls removeDogFromGroup with plain dogId", async () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'Rex')],
      walkGroups: [makeGroup('g1', 'Group 1', ['d1'])],
    })
    render(<GroupBuilder />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'g1-d1', data: { current: { dogId: 'd1', groupId: 'g1' } } },
        over: { id: 'roster', data: { current: {} } },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    expect(useAppStore.getState().walkGroups[0].dogIds).not.toContain('d1')
  })

  it("onDragEnd with over='roster' and no data payload falls back to active.id for dogId", async () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'Rex')],
      walkGroups: [makeGroup('g1', 'Group 1', ['d1'])],
    })
    render(<GroupBuilder />)

    act(() => {
      ;(window as any).__dndCallbacks.onDragEnd({
        active: { id: 'd1', data: { current: {} } },
        over: { id: 'roster', data: { current: {} } },
        delta: { x: 0, y: 0 },
        collisions: null,
      })
    })

    expect(useAppStore.getState().walkGroups[0].dogIds).not.toContain('d1')
  })

  it('+ Add Group button creates a new group', async () => {
    useAppStore.setState({
      dogs: [],
      walkGroups: [makeGroup('g1', 'Group 1')],
    })
    render(<GroupBuilder />)
    const user = userEvent.setup()
    await user.click(screen.getByText('+ Add Group'))
    expect(useAppStore.getState().walkGroups).toHaveLength(2)
  })

  it('auto-creates "Group 1" when no groups exist on mount', () => {
    useAppStore.setState({ dogs: [], walkGroups: [] })
    render(<GroupBuilder />)
    expect(useAppStore.getState().walkGroups).toHaveLength(1)
    expect(useAppStore.getState().walkGroups[0].name).toBe('Group 1')
  })

  it('remove button on MiniDogCard calls removeDogFromGroup', async () => {
    useAppStore.setState({
      dogs: [makeDog('d1', 'Rex')],
      walkGroups: [makeGroup('g1', 'Group 1', ['d1'])],
    })
    render(<GroupBuilder />)
    const user = userEvent.setup()
    const removeBtn = screen.getByRole('button', { name: 'Remove Rex from group' })
    await user.click(removeBtn)
    expect(useAppStore.getState().walkGroups[0].dogIds).not.toContain('d1')
  })
})
