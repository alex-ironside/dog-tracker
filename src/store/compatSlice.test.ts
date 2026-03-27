import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createCompatSlice, type CompatActions } from './compatSlice'
import type { AppState } from '@/types'

type TestStore = AppState & CompatActions

function createTestStore() {
  return create<TestStore>()((...a) => ({
    schemaVersion: 1,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    ...createCompatSlice(...a),
  }))
}

describe('compatSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it("setCompatibility('dog-a', 'dog-b', 'conflict') stores entry with status 'conflict'", () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'conflict')
    const entries = store.getState().compatibilityEntries
    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('conflict')
  })

  it("setCompatibility with reversed args uses same canonical key (symmetry: entry updated, not duplicated)", () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'conflict')
    store.getState().setCompatibility('dog-b', 'dog-a', 'compatible')
    const entries = store.getState().compatibilityEntries
    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('compatible')
  })

  it('setCompatibility called twice on same pair upserts — entries length stays 1', () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'conflict')
    store.getState().setCompatibility('dog-a', 'dog-b', 'neutral')
    const entries = store.getState().compatibilityEntries
    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('neutral')
  })

  it("setCompatibility with 'unknown' stores status as 'unknown' — never coerced (COMPAT-04)", () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'unknown')
    const entries = store.getState().compatibilityEntries
    expect(entries[0].status).toBe('unknown')
  })

  it("removeCompatibility('dog-a', 'dog-b') removes the entry", () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'conflict')
    store.getState().removeCompatibility('dog-a', 'dog-b')
    expect(store.getState().compatibilityEntries).toHaveLength(0)
  })

  it("removeCompatibility('dog-b', 'dog-a') removes the same entry (canonical key symmetry)", () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'conflict')
    store.getState().removeCompatibility('dog-b', 'dog-a')
    expect(store.getState().compatibilityEntries).toHaveLength(0)
  })

  it('removeCompatibility on non-existent pair does not error — entries unchanged', () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'conflict')
    store.getState().removeCompatibility('dog-x', 'dog-y')
    expect(store.getState().compatibilityEntries).toHaveLength(1)
  })

  it('multiple pairs stored independently — setting pair A|B does not affect pair A|C', () => {
    store.getState().setCompatibility('dog-a', 'dog-b', 'conflict')
    store.getState().setCompatibility('dog-a', 'dog-c', 'compatible')
    const entries = store.getState().compatibilityEntries
    expect(entries).toHaveLength(2)
    const ab = entries.find(
      (e) =>
        (e.dogIdA === 'dog-a' && e.dogIdB === 'dog-b') ||
        (e.dogIdA === 'dog-b' && e.dogIdB === 'dog-a')
    )
    const ac = entries.find(
      (e) =>
        (e.dogIdA === 'dog-a' && e.dogIdB === 'dog-c') ||
        (e.dogIdA === 'dog-c' && e.dogIdB === 'dog-a')
    )
    expect(ab?.status).toBe('conflict')
    expect(ac?.status).toBe('compatible')
  })
})
