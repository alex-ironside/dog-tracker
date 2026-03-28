import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createScheduleSlice, type ScheduleActions } from './scheduleSlice'
import type { AppState } from '@/types'

type TestStore = AppState & ScheduleActions

function createTestStore() {
  return create<TestStore>()((...a) => ({
    schemaVersion: 1,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    ...createScheduleSlice(...a),
  }))
}

const testSlot = { dayOfWeek: 1 as const, hour: 9, minute: 0 }
const otherSlot = { dayOfWeek: 2 as const, hour: 10, minute: 0 }

describe('scheduleSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('scheduleGroup adds a WalkSession with correct groupId and slot to walkSessions', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    const sessions = store.getState().walkSessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].groupId).toBe('group-1')
    expect(sessions[0].slot).toEqual(testSlot)
  })

  it('scheduleGroup generates a UUID id on the new WalkSession', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    const session = store.getState().walkSessions[0]
    expect(session.id).toBeDefined()
    expect(session.id).toHaveLength(36)
  })

  it('unscheduleGroup removes the WalkSession matching the given groupId', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    expect(store.getState().walkSessions).toHaveLength(1)
    store.getState().unscheduleGroup('group-1')
    expect(store.getState().walkSessions).toHaveLength(0)
  })

  it('unscheduleGroup is a no-op if groupId is not scheduled', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    store.getState().unscheduleGroup('group-999')
    expect(store.getState().walkSessions).toHaveLength(1)
  })

  it('clearSlot removes the WalkSession whose slot matches dayOfWeek+hour+minute', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    store.getState().clearSlot(testSlot)
    expect(store.getState().walkSessions).toHaveLength(0)
  })

  it('clearSlot is a no-op if no session occupies that slot', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    store.getState().clearSlot(otherSlot)
    expect(store.getState().walkSessions).toHaveLength(1)
  })

  it('scheduleGroup add-or-move: if groupId already has a session, removes old session before adding new one', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    const oldId = store.getState().walkSessions[0].id
    store.getState().scheduleGroup('group-1', otherSlot)
    const sessions = store.getState().walkSessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].slot).toEqual(otherSlot)
    expect(sessions[0].id).not.toBe(oldId)
  })

  it('scheduleGroup does NOT reject occupied slots (no guard in slice)', () => {
    store.getState().scheduleGroup('group-1', testSlot)
    store.getState().scheduleGroup('group-2', testSlot)
    // Both sessions exist — occupied-slot guard is in onDragEnd, not the slice
    expect(store.getState().walkSessions).toHaveLength(2)
  })

  it('minute defaults to 0 in test fixtures — scheduleGroup works with minute: 0', () => {
    const slotWithMinute = { dayOfWeek: 3 as const, hour: 14, minute: 0 }
    store.getState().scheduleGroup('group-3', slotWithMinute)
    expect(store.getState().walkSessions[0].slot.minute).toBe(0)
  })
})
