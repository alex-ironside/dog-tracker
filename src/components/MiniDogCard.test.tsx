import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MiniDogCard } from './MiniDogCard'

// Capture useDraggable call arguments for assertion
const mockUseDraggable = vi.fn()

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    useDraggable: (args: any) => {
      mockUseDraggable(args)
      return {
        setNodeRef: () => {},
        attributes: {},
        listeners: {},
        transform: null,
        isDragging: false,
      }
    },
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MiniDogCard', () => {
  it('calls useDraggable with composite id when groupId and dogId are provided', () => {
    render(
      <MiniDogCard
        groupId="g1"
        dogId="d1"
        dogName="Rex"
        onRemove={vi.fn()}
      />
    )
    expect(mockUseDraggable).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'g1-d1' })
    )
  })

  it('passes dogId and groupId in data payload to useDraggable', () => {
    render(
      <MiniDogCard
        groupId="g1"
        dogId="d1"
        dogName="Rex"
        onRemove={vi.fn()}
      />
    )
    expect(mockUseDraggable).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dogId: 'd1', groupId: 'g1' }),
      })
    )
  })

  it('renders the dog name', () => {
    render(
      <MiniDogCard
        groupId="g1"
        dogId="d1"
        dogName="Buddy"
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('Buddy')).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn()
    render(
      <MiniDogCard
        groupId="g1"
        dogId="d1"
        dogName="Rex"
        onRemove={onRemove}
      />
    )
    const user = userEvent.setup()
    const removeBtn = screen.getByRole('button', { name: /remove rex from group/i })
    await user.click(removeBtn)
    expect(onRemove).toHaveBeenCalled()
  })
})
