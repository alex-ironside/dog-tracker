import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createGroupSlice, type GroupActions } from './groupSlice'
import type { AppState } from '@/types'

type TestStore = AppState & GroupActions

function createTestStore() {
  return create<TestStore>()((...a) => ({
    schemaVersion: 1,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    ...createGroupSlice(...a),
  }))
}

describe('groupSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('addGroup creates a group with correct name, UUID id, and empty dogIds', () => {
    store.getState().addGroup('Walk A')
    const groups = store.getState().walkGroups
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('Walk A')
    expect(groups[0].id).toBeDefined()
    expect(groups[0].id).toHaveLength(36) // UUID format
    expect(groups[0].dogIds).toEqual([])
  })

  it('renameGroup updates the name of the group with matching id', () => {
    store.getState().addGroup('Walk A')
    const id = store.getState().walkGroups[0].id
    store.getState().renameGroup(id, 'Walk B')
    expect(store.getState().walkGroups[0].name).toBe('Walk B')
  })

  it('deleteGroup removes the group from walkGroups array', () => {
    store.getState().addGroup('Walk A')
    store.getState().addGroup('Walk B')
    const id = store.getState().walkGroups[0].id
    store.getState().deleteGroup(id)
    const groups = store.getState().walkGroups
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('Walk B')
  })

  it('addDogToGroup adds dogId to the correct group', () => {
    store.getState().addGroup('Walk A')
    const groupId = store.getState().walkGroups[0].id
    store.getState().addDogToGroup(groupId, 'dog-1')
    expect(store.getState().walkGroups[0].dogIds).toContain('dog-1')
  })

  it('addDogToGroup removes dogId from other group when already assigned (GROUP-02)', () => {
    store.getState().addGroup('Walk A')
    store.getState().addGroup('Walk B')
    const groupAId = store.getState().walkGroups[0].id
    const groupBId = store.getState().walkGroups[1].id

    store.getState().addDogToGroup(groupAId, 'dog-1')
    expect(store.getState().walkGroups[0].dogIds).toContain('dog-1')

    store.getState().addDogToGroup(groupBId, 'dog-1')
    const groups = store.getState().walkGroups
    expect(groups.find(g => g.id === groupAId)!.dogIds).not.toContain('dog-1')
    expect(groups.find(g => g.id === groupBId)!.dogIds).toContain('dog-1')
  })

  it('addDogToGroup does not duplicate dogId in the same group', () => {
    store.getState().addGroup('Walk A')
    const groupId = store.getState().walkGroups[0].id
    store.getState().addDogToGroup(groupId, 'dog-1')
    store.getState().addDogToGroup(groupId, 'dog-1')
    expect(store.getState().walkGroups[0].dogIds).toHaveLength(1)
  })

  it('removeDogFromGroup removes dogId from the group', () => {
    store.getState().addGroup('Walk A')
    const groupId = store.getState().walkGroups[0].id
    store.getState().addDogToGroup(groupId, 'dog-1')
    store.getState().addDogToGroup(groupId, 'dog-2')
    store.getState().removeDogFromGroup(groupId, 'dog-1')
    const dogIds = store.getState().walkGroups[0].dogIds
    expect(dogIds).not.toContain('dog-1')
    expect(dogIds).toContain('dog-2')
  })
})
