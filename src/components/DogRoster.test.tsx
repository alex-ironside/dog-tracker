import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import { DogRoster } from './DogRoster'

function renderRoster() {
  return render(<DogRoster />)
}

beforeEach(() => {
  useAppStore.setState({ dogs: [], walkGroups: [], compatibilityEntries: [], walkSessions: [] })
})

describe('DogRoster - Empty state', () => {
  it('renders "No dogs yet" heading', () => {
    renderRoster()
    expect(screen.getByRole('heading', { name: /no dogs yet/i })).toBeInTheDocument()
  })

  it('renders empty state body text', () => {
    renderRoster()
    expect(screen.getByText('Add your first dog to get started.')).toBeInTheDocument()
  })

  it('renders an "Add Dog" button', () => {
    renderRoster()
    // There may be multiple Add Dog buttons (header + empty state CTA)
    const buttons = screen.getAllByRole('button', { name: /add dog/i })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })
})

describe('DogRoster - Add flow', () => {
  it('clicking "Add Dog" opens panel with title "Add Dog"', async () => {
    const user = userEvent.setup()
    renderRoster()
    const addBtn = screen.getAllByRole('button', { name: /add dog/i })[0]
    await user.click(addBtn)
    expect(await screen.findByText('Add Dog', { selector: 'h2,h3,[role="dialog"] *,[data-state="open"] *' })).toBeInTheDocument()
  })

  it('submitting with empty name shows error "Name is required."', async () => {
    const user = userEvent.setup()
    renderRoster()
    await user.click(screen.getAllByRole('button', { name: /add dog/i })[0])
    const saveBtn = await screen.findByRole('button', { name: /save dog/i })
    await user.click(saveBtn)
    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
  })

  it('filling name "Rex" and clicking "Save Dog" adds card to grid', async () => {
    const user = userEvent.setup()
    renderRoster()
    await user.click(screen.getAllByRole('button', { name: /add dog/i })[0])
    const nameInput = await screen.findByPlaceholderText('e.g. Rex')
    await user.type(nameInput, 'Rex')
    await user.click(screen.getByRole('button', { name: /save dog/i }))
    expect(await screen.findByText('Rex')).toBeInTheDocument()
  })
})

describe('DogRoster - Edit flow', () => {
  beforeEach(() => {
    useAppStore.setState({
      dogs: [{
        id: 'test-id-1',
        name: 'Rex',
        breed: 'Labrador',
        age: 3,
        notes: '',
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
    })
  })

  it('clicking "Edit" on a card opens panel with title "Edit Dog"', async () => {
    const user = userEvent.setup()
    renderRoster()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(await screen.findByText('Edit Dog')).toBeInTheDocument()
  })

  it('panel pre-populates with name field value', async () => {
    const user = userEvent.setup()
    renderRoster()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = await screen.findByPlaceholderText('e.g. Rex') as HTMLInputElement
    expect(nameInput.value).toBe('Rex')
  })

  it('changing name to "Max" and saving updates the card', async () => {
    const user = userEvent.setup()
    renderRoster()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = await screen.findByPlaceholderText('e.g. Rex') as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'Max')
    await user.click(screen.getByRole('button', { name: /save dog/i }))
    expect(await screen.findByText('Max')).toBeInTheDocument()
  })
})

describe('DogRoster - Archive flow', () => {
  beforeEach(() => {
    useAppStore.setState({
      dogs: [{
        id: 'test-id-1',
        name: 'Rex',
        breed: 'Labrador',
        age: 3,
        notes: '',
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
    })
  })

  it('clicking "Archive" shows dialog with "Archive Rex?"', async () => {
    const user = userEvent.setup()
    renderRoster()
    await user.click(screen.getByRole('button', { name: /archive/i }))
    expect(await screen.findByText('Archive Rex?')).toBeInTheDocument()
  })

  it('confirming archive removes card from active view', async () => {
    const user = userEvent.setup()
    renderRoster()
    await user.click(screen.getByRole('button', { name: /^archive$/i }))
    // Click the confirmation Archive button in the dialog
    const confirmBtn = await screen.findByRole('button', { name: /^archive$/i })
    await user.click(confirmBtn)
    await waitFor(() => {
      expect(screen.queryByText('Rex')).not.toBeInTheDocument()
    })
  })
})

describe('DogRoster - Show archived toggle', () => {
  beforeEach(() => {
    useAppStore.setState({
      dogs: [{
        id: 'test-id-1',
        name: 'Archie',
        breed: 'Poodle',
        age: 2,
        notes: '',
        archived: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
    })
  })

  it('enabling "Show archived dogs" toggle shows archived dogs', async () => {
    const user = userEvent.setup()
    renderRoster()
    // Toggle is off by default — Archie should not appear
    expect(screen.queryByText('Archie')).not.toBeInTheDocument()
    const toggle = screen.getByRole('switch', { name: /show archived dogs/i })
    await user.click(toggle)
    expect(await screen.findByText('Archie')).toBeInTheDocument()
  })
})

describe('DogRoster - Unarchive flow', () => {
  beforeEach(() => {
    useAppStore.setState({
      dogs: [{
        id: 'test-id-1',
        name: 'Archie',
        breed: 'Poodle',
        age: 2,
        notes: '',
        archived: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
    })
  })

  it('clicking "Unarchive" on archived card restores it to active view', async () => {
    const user = userEvent.setup()
    renderRoster()
    // Enable show archived toggle first
    const toggle = screen.getByRole('switch', { name: /show archived dogs/i })
    await user.click(toggle)
    const unarchiveBtn = await screen.findByRole('button', { name: /unarchive/i })
    await user.click(unarchiveBtn)
    // Now disable toggle — dog should still appear as active
    await user.click(screen.getByRole('switch', { name: /show archived dogs/i }))
    expect(await screen.findByText('Archie')).toBeInTheDocument()
  })
})
