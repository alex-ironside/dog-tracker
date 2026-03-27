import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import type { Dog, CompatibilityEntry } from '@/types'
import { CompatibilityGraph, buildGraphData } from './CompatibilityGraph'
import App from '@/App'

vi.mock('react-force-graph', () => ({
  ForceGraph2D: ({ onLinkClick, onNodeClick }: {
    onLinkClick?: (link: unknown) => void
    onNodeClick?: (node: unknown) => void
  }) => (
    <div
      data-testid='force-graph'
      data-on-link-click={onLinkClick ? 'registered' : 'none'}
      data-on-node-click={onNodeClick ? 'registered' : 'none'}
    />
  ),
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
