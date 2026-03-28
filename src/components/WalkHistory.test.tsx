import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import { WalkHistory } from './WalkHistory'
import type { Dog, WalkLogEntry } from '@/types'

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
  date: '2026-03-15',
  outcome: 'great',
  notes: 'Excellent walk',
  dogIds: ['dog-1'],
}

const entry2: WalkLogEntry = {
  id: 'entry-2',
  date: '2026-03-20',
  outcome: 'poor',
  notes: '',
  dogIds: ['dog-1'],
}

beforeEach(() => {
  useAppStore.setState({ dogs: [dog1], walkHistory: [] }, false)
})

describe('WalkHistory', () => {
  it('renders "Walk History" heading', () => {
    render(<WalkHistory />)
    expect(screen.getByRole('heading', { name: /walk history/i })).toBeInTheDocument()
  })

  it('renders "Log a walk" button', () => {
    render(<WalkHistory />)
    expect(screen.getByRole('button', { name: /log a walk/i })).toBeInTheDocument()
  })

  it('renders empty state "No walks logged yet" when no entries', () => {
    render(<WalkHistory />)
    expect(screen.getByText('No walks logged yet')).toBeInTheDocument()
    expect(screen.getByText('Log your first walk to start tracking outcomes.')).toBeInTheDocument()
  })

  it('renders walk log entries when walkHistory has data', () => {
    useAppStore.setState({ walkHistory: [entry1, entry2] }, false)
    render(<WalkHistory />)
    expect(screen.queryByText('No walks logged yet')).not.toBeInTheDocument()
    expect(screen.getByText('2026-03-15')).toBeInTheDocument()
    expect(screen.getByText('2026-03-20')).toBeInTheDocument()
  })

  it('renders entry date, outcome badge, and dog names', () => {
    useAppStore.setState({ walkHistory: [entry1] }, false)
    render(<WalkHistory />)
    expect(screen.getByText('2026-03-15')).toBeInTheDocument()
    expect(screen.getByText('Great')).toBeInTheDocument()
    expect(screen.getByText('Buddy')).toBeInTheDocument()
  })

  it('opens WalkLogSheet when "Log a walk" is clicked', async () => {
    const user = userEvent.setup()
    render(<WalkHistory />)
    await user.click(screen.getByRole('button', { name: /log a walk/i }))
    // WalkLogSheet title appears
    expect(screen.getByText('Log a Walk')).toBeInTheDocument()
  })
})
