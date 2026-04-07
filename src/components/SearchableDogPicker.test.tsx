import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useDogSearch, DogSearchInput } from './SearchableDogPicker'

const dogs = [
  { name: 'Luna' },
  { name: 'Luca' },
  { name: 'Rex' },
]

describe('useDogSearch', () => {
  it('returns all dogs when query is empty', () => {
    const { result } = renderHook(() => useDogSearch(dogs))
    expect(result.current.filtered).toEqual(dogs)
  })

  it('filters case-insensitively by substring', () => {
    const { result } = renderHook(() => useDogSearch(dogs))
    act(() => result.current.setQuery('LU'))
    expect(result.current.filtered.map((d) => d.name)).toEqual(['Luna', 'Luca'])
  })

  it('returns empty array when nothing matches', () => {
    const { result } = renderHook(() => useDogSearch(dogs))
    act(() => result.current.setQuery('zzz'))
    expect(result.current.filtered).toEqual([])
  })

  it('treats whitespace-only query as empty', () => {
    const { result } = renderHook(() => useDogSearch(dogs))
    act(() => result.current.setQuery('   '))
    expect(result.current.filtered).toEqual(dogs)
  })
})

describe('DogSearchInput', () => {
  it('renders with English placeholder', () => {
    render(<DogSearchInput value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Search dogs…')).toBeInTheDocument()
    expect(screen.getByLabelText('Search dogs…')).toBeInTheDocument()
  })

  it('fires onChange while typing', async () => {
    const onChange = vi.fn()
    render(<DogSearchInput value="" onChange={onChange} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Search dogs…'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('shows clear button only when value is non-empty and clears on click', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<DogSearchInput value="" onChange={onChange} />)
    expect(screen.queryByLabelText('Clear search')).toBeNull()
    rerender(<DogSearchInput value="lu" onChange={onChange} />)
    const clear = screen.getByLabelText('Clear search')
    await userEvent.setup().click(clear)
    expect(onChange).toHaveBeenCalledWith('')
  })
})
