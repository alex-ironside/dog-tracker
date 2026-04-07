import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import { WalkLogSheet } from './WalkLogSheet'
import type { Dog } from '@/types'

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

const dog2: Dog = {
  id: 'dog-2',
  name: 'Max',
  breed: 'Poodle',
  age: 2,
  notes: '',
  archived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const archivedDog: Dog = {
  id: 'dog-3',
  name: 'OldDog',
  breed: 'Beagle',
  age: 10,
  notes: '',
  archived: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

beforeEach(() => {
  useAppStore.setState(
    { dogs: [dog1, dog2, archivedDog], walkHistory: [] },
    false
  )
})

describe('WalkLogSheet - Rendering', () => {
  it('renders Sheet with title "Log a Walk" when open', () => {
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Log a Walk')).toBeInTheDocument()
  })

  it('renders custom title when provided', () => {
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} title="Log Walk for Buddy" />)
    expect(screen.getByText('Log Walk for Buddy')).toBeInTheDocument()
  })

  it('renders date input defaulting to today', () => {
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    const todayStr = new Date().toISOString().split('T')[0]
    const dateInput = screen.getByDisplayValue(todayStr)
    expect(dateInput).toBeInTheDocument()
  })

  it('renders 5 outcome buttons', () => {
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /great/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neutral/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /poor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /incident/i })).toBeInTheDocument()
  })

  it('renders active dogs as checkboxes (excludes archived)', () => {
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByLabelText(/buddy/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/olddog/i)).not.toBeInTheDocument()
  })
})

describe('WalkLogSheet - Interaction', () => {
  it('clicking an outcome button sets aria-pressed="true"', async () => {
    const user = userEvent.setup()
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    const greatBtn = screen.getByRole('button', { name: /great/i })
    expect(greatBtn).toHaveAttribute('aria-pressed', 'false')
    await user.click(greatBtn)
    expect(greatBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('WalkLogSheet - Validation', () => {
  it('shows "Please select an outcome." when saving without outcome', async () => {
    const user = userEvent.setup()
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    // Select a dog so only outcome is missing
    await user.click(screen.getByLabelText(/buddy/i))
    await user.click(screen.getByRole('button', { name: /save walk log/i }))
    expect(await screen.findByText('Please select an outcome.')).toBeInTheDocument()
  })

  it('shows "Select at least one dog." when saving without dogs', async () => {
    const user = userEvent.setup()
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    // Select outcome only
    await user.click(screen.getByRole('button', { name: /great/i }))
    await user.click(screen.getByRole('button', { name: /save walk log/i }))
    expect(await screen.findByText('Select at least one dog.')).toBeInTheDocument()
  })
})

describe('WalkLogSheet - Save', () => {
  it('successful save calls addWalkLog and closes sheet', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const addWalkLog = vi.fn()
    useAppStore.setState((s) => ({ ...s, addWalkLog }))

    render(<WalkLogSheet open={true} onOpenChange={onOpenChange} initialDogIds={['dog-1']} />)

    await user.click(screen.getByRole('button', { name: /good/i }))
    await user.click(screen.getByRole('button', { name: /save walk log/i }))

    expect(addWalkLog).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'good',
        dogIds: ['dog-1'],
      })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('WalkLogSheet - inline add dog', () => {
  it('clicking "+ New dog" reveals the name input', async () => {
    const user = userEvent.setup()
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    expect(screen.queryByPlaceholderText('Dog name')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '+ New dog' }))
    expect(screen.getByPlaceholderText('Dog name')).toBeInTheDocument()
  })

  it('typing a name and clicking Save adds the dog and auto-selects it', async () => {
    const user = userEvent.setup()
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '+ New dog' }))
    await user.type(screen.getByPlaceholderText('Dog name'), 'Rex')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().dogs.some((d) => d.name === 'Rex')).toBe(true)
    const checkbox = screen.getByLabelText(/rex/i) as HTMLInputElement
    expect(checkbox).toBeChecked()
  })

  it('Save is disabled when name is empty or whitespace', async () => {
    const user = userEvent.setup()
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '+ New dog' }))
    const saveBtn = screen.getByRole('button', { name: 'Save' })
    expect(saveBtn).toBeDisabled()
    await user.type(screen.getByPlaceholderText('Dog name'), '   ')
    expect(saveBtn).toBeDisabled()
  })

  it('Cancel hides the form and does not add a dog', async () => {
    const user = userEvent.setup()
    render(<WalkLogSheet open={true} onOpenChange={vi.fn()} />)
    const before = useAppStore.getState().dogs.length
    await user.click(screen.getByRole('button', { name: '+ New dog' }))
    await user.type(screen.getByPlaceholderText('Dog name'), 'Ghost')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByPlaceholderText('Dog name')).not.toBeInTheDocument()
    expect(useAppStore.getState().dogs.length).toBe(before)
  })
})
