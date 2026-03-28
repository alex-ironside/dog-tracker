import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import { WalkHistoryChart } from './WalkHistoryChart'
import type { Dog, WalkLogEntry } from '@/types'

// Mock ResponsiveContainer to avoid jsdom layout issues
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  }
})

const dog1: Dog = {
  id: 'dog-1',
  name: 'Buddy',
  breed: 'Labrador',
  age: 3,
  notes: '',
  archived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const entry1: WalkLogEntry = {
  id: 'entry-1',
  date: '2026-03-01',
  outcome: 'great',
  notes: 'Great run!',
  dogIds: ['dog-1'],
}

const entry2: WalkLogEntry = {
  id: 'entry-2',
  date: '2026-03-10',
  outcome: 'neutral',
  notes: '',
  dogIds: ['dog-1', 'dog-2'],
}

beforeEach(() => {
  useAppStore.setState({ dogs: [dog1], walkHistory: [] }, false)
})

describe('WalkHistoryChart', () => {
  it('renders "No walks logged yet" when dog has no walk history entries', () => {
    render(<WalkHistoryChart dogId="dog-1" />)
    expect(screen.getByText('No walks logged yet')).toBeInTheDocument()
  })

  it('renders a chart container (not empty state) when dog has walk history entries', () => {
    useAppStore.setState({ walkHistory: [entry1, entry2] }, false)
    render(<WalkHistoryChart dogId="dog-1" />)
    // Chart is rendered (not the empty state message)
    expect(screen.queryByText('No walks logged yet')).not.toBeInTheDocument()
    // The aria-label wrapper div is present
    expect(
      screen.getByRole('generic', { name: /walk outcome history for buddy/i })
    ).toBeInTheDocument()
  })

  it('renders aria-label "Walk outcome history for Buddy"', () => {
    useAppStore.setState({ walkHistory: [entry1] }, false)
    render(<WalkHistoryChart dogId="dog-1" />)
    expect(
      screen.getByRole('generic', { name: /walk outcome history for buddy/i })
    ).toBeInTheDocument()
  })
})
