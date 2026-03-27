import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import type { Dog, CompatibilityEntry } from '@/types'
import { CompatibilityGraph, buildGraphData } from './CompatibilityGraph'
import App from '@/App'

let capturedOnLinkClick: ((link: unknown) => void) | undefined
let capturedOnNodeClick: ((node: unknown) => void) | undefined

vi.mock('react-force-graph', () => ({
  ForceGraph2D: (props: Record<string, unknown>) => {
    capturedOnLinkClick = props.onLinkClick as typeof capturedOnLinkClick
    capturedOnNodeClick = props.onNodeClick as typeof capturedOnNodeClick
    return (
      <div
        data-testid='force-graph'
        data-on-link-click={props.onLinkClick ? 'registered' : 'none'}
        data-on-node-click={props.onNodeClick ? 'registered' : 'none'}
      />
    )
  },
}))

const activeDog1: Dog = {
  id: 'dog-1',
  name: 'Rex',
  breed: 'Labrador',
  age: 3,
  notes: '',
  archived: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const activeDog2: Dog = {
  id: 'dog-2',
  name: 'Bella',
  breed: 'Poodle',
  age: 2,
  notes: '',
  archived: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const archivedDog: Dog = {
  id: 'dog-3',
  name: 'OldBoy',
  breed: 'Beagle',
  age: 10,
  notes: '',
  archived: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const entry1: CompatibilityEntry = {
  dogIdA: 'dog-1',
  dogIdB: 'dog-2',
  status: 'compatible',
}

const entry2: CompatibilityEntry = {
  dogIdA: 'dog-1',
  dogIdB: 'dog-3',
  status: 'conflict',
}

beforeEach(() => {
  useAppStore.setState({ dogs: [], walkGroups: [], compatibilityEntries: [], walkSessions: [] })
  capturedOnLinkClick = undefined
  capturedOnNodeClick = undefined
})

describe('buildGraphData', () => {
  it('produces nodes only for active (non-archived) dogs', () => {
    const { nodes } = buildGraphData([activeDog1, activeDog2, archivedDog], [])
    expect(nodes).toHaveLength(2)
    expect(nodes.map((n) => n.id)).toContain('dog-1')
    expect(nodes.map((n) => n.id)).toContain('dog-2')
    expect(nodes.map((n) => n.id)).not.toContain('dog-3')
  })

  it('produces links for all compatibility entries', () => {
    const { links } = buildGraphData([activeDog1, activeDog2], [entry1, entry2])
    expect(links).toHaveLength(2)
    expect(links[0]).toMatchObject({ source: 'dog-1', target: 'dog-2', status: 'compatible' })
    expect(links[1]).toMatchObject({ source: 'dog-1', target: 'dog-3', status: 'conflict' })
  })

  it('produces empty links when no entries exist', () => {
    const { links } = buildGraphData([activeDog1, activeDog2], [])
    expect(links).toHaveLength(0)
  })
})

describe('CompatibilityGraph', () => {
  it('renders force-graph testid when dogs exist', () => {
    useAppStore.setState({ dogs: [activeDog1, activeDog2], compatibilityEntries: [entry1] })
    render(<CompatibilityGraph />)
    expect(screen.getByTestId('force-graph')).toBeTruthy()
  })

  it('renders empty state when no active dogs exist', () => {
    useAppStore.setState({ dogs: [], compatibilityEntries: [] })
    render(<CompatibilityGraph />)
    expect(screen.getByText('No compatibility data yet')).toBeTruthy()
  })

  it('edge click opens EdgeSheet with correct dog names', () => {
    useAppStore.setState({
      dogs: [activeDog1, activeDog2],
      compatibilityEntries: [entry1],
    })
    render(<CompatibilityGraph />)
    expect(capturedOnLinkClick).toBeDefined()
    act(() => {
      capturedOnLinkClick!({ source: 'dog-1', target: 'dog-2', status: 'compatible' })
    })
    expect(screen.getByText('Rex & Bella')).toBeTruthy()
  })

  it('node click opens DogPanel for the clicked dog', () => {
    useAppStore.setState({
      dogs: [activeDog1, activeDog2],
      compatibilityEntries: [entry1],
    })
    render(<CompatibilityGraph />)
    expect(capturedOnNodeClick).toBeDefined()
    act(() => {
      capturedOnNodeClick!({ id: 'dog-1', name: 'Rex' })
    })
    // DogPanel opens in edit mode — the title is "Edit Dog"
    expect(screen.getByText('Edit Dog')).toBeTruthy()
  })

  it('setting status via EdgeSheet updates the store', () => {
    useAppStore.setState({
      dogs: [activeDog1, activeDog2],
      compatibilityEntries: [entry1],
    })
    render(<CompatibilityGraph />)
    // Open EdgeSheet via link click
    act(() => {
      capturedOnLinkClick!({ source: 'dog-1', target: 'dog-2', status: 'compatible' })
    })
    // Select "Conflict" and confirm
    fireEvent.click(screen.getByRole('button', { name: 'Conflict' }))
    fireEvent.click(screen.getByRole('button', { name: 'Set compatibility' }))
    const entries = useAppStore.getState().compatibilityEntries
    const updated = entries.find(
      (e) =>
        (e.dogIdA === 'dog-1' && e.dogIdB === 'dog-2') ||
        (e.dogIdA === 'dog-2' && e.dogIdB === 'dog-1')
    )
    expect(updated?.status).toBe('conflict')
  })

  it('remove via EdgeSheet removes the entry from the store', () => {
    useAppStore.setState({
      dogs: [activeDog1, activeDog2],
      compatibilityEntries: [entry1],
    })
    render(<CompatibilityGraph />)
    act(() => {
      capturedOnLinkClick!({ source: 'dog-1', target: 'dog-2', status: 'compatible' })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remove relationship' }))
    expect(useAppStore.getState().compatibilityEntries).toHaveLength(0)
  })

  it('discard via EdgeSheet does not modify the store', () => {
    useAppStore.setState({
      dogs: [activeDog1, activeDog2],
      compatibilityEntries: [entry1],
    })
    render(<CompatibilityGraph />)
    act(() => {
      capturedOnLinkClick!({ source: 'dog-1', target: 'dog-2', status: 'compatible' })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    const entries = useAppStore.getState().compatibilityEntries
    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('compatible')
  })
})

describe('App tab bar', () => {
  it('renders Dogs and Compatibility tab buttons', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Dogs' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Compatibility' })).toBeTruthy()
  })

  it('clicking Compatibility tab shows force-graph component', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ dogs: [activeDog1, activeDog2], compatibilityEntries: [entry1] })
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Compatibility' }))
    expect(screen.getByTestId('force-graph')).toBeTruthy()
  })

  it('clicking Dogs tab shows DogRoster content', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ dogs: [], compatibilityEntries: [] })
    render(<App />)
    // Start on dogs tab, go to compatibility then back
    await user.click(screen.getByRole('tab', { name: 'Compatibility' }))
    await user.click(screen.getByRole('tab', { name: 'Dogs' }))
    // DogRoster empty state should be visible
    expect(screen.getByText('No dogs yet')).toBeTruthy()
  })
})
