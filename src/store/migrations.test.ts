import { describe, it, expect } from 'vitest'
import { migrate, CURRENT_SCHEMA_VERSION } from './migrations'

describe('migrations', () => {
  it('CURRENT_SCHEMA_VERSION is 2', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(2)
  })

  it('migrates v1 state to v2 by adding walkHistory: []', () => {
    const v1State = {
      schemaVersion: 1,
      dogs: [{ id: 'dog-1', name: 'Rex', breed: '', age: null, notes: '', archived: false, createdAt: '', updatedAt: '' }],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
    }
    const result = migrate(v1State, 1)
    expect(result.walkHistory).toEqual([])
    expect(result.schemaVersion).toBe(2)
    expect(result.dogs).toHaveLength(1)
  })

  it('preserves existing walkHistory during v1->v2 migration if somehow present', () => {
    const v1StateWithHistory = {
      schemaVersion: 1,
      dogs: [],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
      walkHistory: [{ id: 'entry-1', date: '2026-03-28', outcome: 'great', notes: '', dogIds: ['dog-1'] }],
    }
    const result = migrate(v1StateWithHistory, 1)
    expect(result.walkHistory).toHaveLength(1)
  })

  it('v2 state passes through unchanged', () => {
    const v2State = {
      schemaVersion: 2,
      dogs: [],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
      walkHistory: [],
    }
    const result = migrate(v2State, 2)
    expect(result.schemaVersion).toBe(2)
    expect(result.walkHistory).toEqual([])
  })
})
