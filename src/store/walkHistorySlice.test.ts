import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createWalkHistorySlice, type WalkHistoryActions } from './walkHistorySlice'
import type { AppState } from '@/types'

type TestStore = AppState & WalkHistoryActions

function createTestStore() {
  return create<TestStore>()((...a) => ({
    schemaVersion: 2,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    walkHistory: [],
    ...createWalkHistorySlice(...a),
  }))
}

describe('walkHistorySlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('addWalkLog appends an entry to walkHistory with a generated 36-char UUID id', () => {
    store.getState().addWalkLog({
      date: '2026-03-28',
      outcome: 'great',
      notes: 'All dogs got along well',
      dogIds: ['dog-1', 'dog-2'],
    })
    const history = store.getState().walkHistory
    expect(history).toHaveLength(1)
    expect(history[0].id).toBeDefined()
    expect(history[0].id).toHaveLength(36)
  })

  it('addWalkLog stores the outcome field from the input', () => {
    store.getState().addWalkLog({
      date: '2026-03-28',
      outcome: 'great',
      notes: '',
      dogIds: ['dog-1'],
    })
    expect(store.getState().walkHistory[0].outcome).toBe('great')
  })

  it('addWalkLog stores the notes field from the input', () => {
    store.getState().addWalkLog({
      date: '2026-03-28',
      outcome: 'neutral',
      notes: 'Dogs were a bit distracted',
      dogIds: ['dog-1'],
    })
    expect(store.getState().walkHistory[0].notes).toBe('Dogs were a bit distracted')
  })

  it('addWalkLog stores dogIds as an array matching the input', () => {
    store.getState().addWalkLog({
      date: '2026-03-28',
      outcome: 'good',
      notes: '',
      dogIds: ['dog-1', 'dog-2', 'dog-3'],
    })
    expect(store.getState().walkHistory[0].dogIds).toEqual(['dog-1', 'dog-2', 'dog-3'])
  })

  it('addWalkLog stores optional groupId when provided', () => {
    store.getState().addWalkLog({
      date: '2026-03-28',
      outcome: 'poor',
      notes: 'Tension between two dogs',
      dogIds: ['dog-1', 'dog-2'],
      groupId: 'group-42',
    })
    expect(store.getState().walkHistory[0].groupId).toBe('group-42')
  })

  it('addWalkLog stores the date string as provided', () => {
    store.getState().addWalkLog({
      date: '2026-01-15',
      outcome: 'incident',
      notes: 'Minor scuffle',
      dogIds: ['dog-1'],
    })
    expect(store.getState().walkHistory[0].date).toBe('2026-01-15')
  })

  it('multiple addWalkLog calls accumulate entries (walkHistory grows)', () => {
    store.getState().addWalkLog({ date: '2026-03-26', outcome: 'great', notes: '', dogIds: ['dog-1'] })
    store.getState().addWalkLog({ date: '2026-03-27', outcome: 'good', notes: '', dogIds: ['dog-2'] })
    store.getState().addWalkLog({ date: '2026-03-28', outcome: 'neutral', notes: '', dogIds: ['dog-3'] })
    expect(store.getState().walkHistory).toHaveLength(3)
  })

  it('updateWalkLog and deleteWalkLog actions exist on the slice', () => {
    expect(store.getState()).toHaveProperty('updateWalkLog')
    expect(store.getState()).toHaveProperty('deleteWalkLog')
  })
})
