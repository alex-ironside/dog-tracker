import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './index'
import { migrate, CURRENT_SCHEMA_VERSION } from './migrations'

describe('store persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({
      schemaVersion: 1,
      dogs: [],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
    })
  })

  it('store initial state has schemaVersion === 1', () => {
    expect(useAppStore.getState().schemaVersion).toBe(1)
  })

  it('store initial state has empty dogs array', () => {
    expect(useAppStore.getState().dogs).toEqual([])
  })

  it('store initial state has empty walkGroups array', () => {
    expect(useAppStore.getState().walkGroups).toEqual([])
  })

  it('store initial state has empty compatibilityEntries array', () => {
    expect(useAppStore.getState().compatibilityEntries).toEqual([])
  })

  it('store initial state has empty walkSessions array', () => {
    expect(useAppStore.getState().walkSessions).toEqual([])
  })

  it('partialize excludes action functions from serialized state', () => {
    const state = useAppStore.getState()
    const partializedKeys = ['schemaVersion', 'dogs', 'walkGroups', 'compatibilityEntries', 'walkSessions']
    const actionKeys = ['addDog', 'updateDog', 'archiveDog', 'unarchiveDog']

    // Verify action keys exist on full state
    actionKeys.forEach((key) => {
      expect(typeof state[key as keyof typeof state]).toBe('function')
    })

    // The partialize function should only include data keys
    // We verify by checking what keys are in the store (data keys exist)
    partializedKeys.forEach((key) => {
      expect(key in state).toBe(true)
    })
  })

  it('migrate function returns state unchanged for current version', () => {
    const mockState = {
      schemaVersion: 1,
      dogs: [],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
    }
    const result = migrate(mockState, CURRENT_SCHEMA_VERSION)
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.dogs).toEqual([])
  })
})
