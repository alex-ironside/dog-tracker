import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import { DogPanel } from './DogPanel'
import type { Dog } from '@/types'

// Mock recharts so WalkHistoryChart tests work in jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  }
})

const sampleDog: Dog = {
  id: 'test-id-1',
  name: 'Rex',
  breed: 'Labrador',
  age: 3,
  notes: 'Friendly dog',
  archived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

beforeEach(() => {
  useAppStore.setState({ dogs: [], walkGroups: [], compatibilityEntries: [], walkSessions: [], walkHistory: [] }, false)
})

describe('DogPanel - Field rendering', () => {
  it('renders Name, Breed, Age, Notes fields', () => {
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={null} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/breed/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('Name field has placeholder "e.g. Rex"', () => {
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={null} />)
    expect(screen.getByPlaceholderText('e.g. Rex')).toBeInTheDocument()
  })
})

describe('DogPanel - Validation', () => {
  it('validates on submit only — no blur validation', async () => {
    const user = userEvent.setup()
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={null} />)
    const nameInput = screen.getByPlaceholderText('e.g. Rex')
    await user.click(nameInput)
    await user.tab()
    // Error should NOT appear on blur
    expect(screen.queryByText('Name is required.')).not.toBeInTheDocument()
  })

  it('shows "Name is required." error when submitting empty name', async () => {
    const user = userEvent.setup()
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={null} />)
    await user.click(screen.getByRole('button', { name: /save dog/i }))
    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
  })
})

describe('DogPanel - Discard', () => {
  it('Discard button closes panel without saving', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<DogPanel open={true} onOpenChange={onOpenChange} editingDog={null} />)
    await user.click(screen.getByRole('button', { name: /discard/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('DogPanel - Save add mode', () => {
  it('Save Dog calls addDog with correct fields in add mode', async () => {
    const user = userEvent.setup()
    const addDog = vi.fn()
    useAppStore.setState((s) => ({ ...s, addDog }))
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={null} />)
    await user.type(screen.getByPlaceholderText('e.g. Rex'), 'Buddy')
    await user.type(screen.getByPlaceholderText('e.g. Labrador'), 'Beagle')
    await user.type(screen.getByPlaceholderText('e.g. 3'), '4')
    await user.click(screen.getByRole('button', { name: /save dog/i }))
    expect(addDog).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Buddy',
      breed: 'Beagle',
      age: 4,
    }))
  })
})

describe('DogPanel - Save edit mode', () => {
  it('Save Dog calls updateDog with correct fields in edit mode', async () => {
    const user = userEvent.setup()
    const updateDog = vi.fn()
    useAppStore.setState((s) => ({ ...s, updateDog }))
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={sampleDog} />)
    const nameInput = screen.getByPlaceholderText('e.g. Rex') as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'Max')
    await user.click(screen.getByRole('button', { name: /save dog/i }))
    expect(updateDog).toHaveBeenCalledWith('test-id-1', expect.objectContaining({
      name: 'Max',
    }))
  })
})

describe('DogPanel - History tab', () => {
  it('renders Profile and History tab buttons when editing a dog', () => {
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={sampleDog} />)
    const tabs = screen.getAllByRole('tab')
    const tabNames = tabs.map((t) => t.textContent)
    expect(tabNames).toContain('Profile')
    expect(tabNames).toContain('History')
  })

  it('defaults to Profile tab (Profile tab has aria-selected=true)', () => {
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={sampleDog} />)
    const profileTab = screen.getByRole('tab', { name: /profile/i })
    expect(profileTab).toHaveAttribute('aria-selected', 'true')
  })

  it('clicking History tab shows "Log a walk for [name]" button', async () => {
    const user = userEvent.setup()
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={sampleDog} />)
    await user.click(screen.getByRole('tab', { name: /history/i }))
    expect(screen.getByRole('button', { name: /log a walk for rex/i })).toBeInTheDocument()
  })

  it('Profile tab footer (Save/Discard) is not visible when History tab is active (D-13)', async () => {
    const user = userEvent.setup()
    render(<DogPanel open={true} onOpenChange={vi.fn()} editingDog={sampleDog} />)
    await user.click(screen.getByRole('tab', { name: /history/i }))
    expect(screen.queryByRole('button', { name: /save dog/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^discard$/i })).not.toBeInTheDocument()
  })
})
