import { describe, it, expect } from 'vitest'
import { pairKey, buildCompatMap, scoreGroup, getConflictsInGroup } from './scoring'
import type { CompatibilityStatus, CompatibilityEntry } from '@/types'

describe('pairKey', () => {
  it("pairKey('a', 'b') returns 'a|b'", () => {
    expect(pairKey('a', 'b')).toBe('a|b')
  })

  it("pairKey('b', 'a') returns 'a|b' (canonical symmetry)", () => {
    expect(pairKey('b', 'a')).toBe('a|b')
  })

  it("pairKey('dog-z', 'dog-a') returns 'dog-a|dog-z'", () => {
    expect(pairKey('dog-z', 'dog-a')).toBe('dog-a|dog-z')
  })

  it('pairKey is symmetric — same result regardless of argument order', () => {
    expect(pairKey('x', 'y')).toBe(pairKey('y', 'x'))
  })
})

describe('buildCompatMap', () => {
  it('empty entries array returns empty Map', () => {
    const result = buildCompatMap([])
    expect(result.size).toBe(0)
  })

  it('single entry is stored with canonical key', () => {
    const entries: CompatibilityEntry[] = [
      { dogIdA: 'a', dogIdB: 'b', status: 'conflict' },
    ]
    const result = buildCompatMap(entries)
    expect(result.get('a|b')).toBe('conflict')
  })

  it('entry with dogIdA > dogIdB still produces sorted (canonical) key', () => {
    const entries: CompatibilityEntry[] = [
      { dogIdA: 'z', dogIdB: 'a', status: 'neutral' },
    ]
    const result = buildCompatMap(entries)
    expect(result.get('a|z')).toBe('neutral')
    expect(result.has('z|a')).toBe(false)
  })

  it('multiple entries are all present in Map', () => {
    const entries: CompatibilityEntry[] = [
      { dogIdA: 'a', dogIdB: 'b', status: 'compatible' },
      { dogIdA: 'b', dogIdB: 'c', status: 'conflict' },
      { dogIdA: 'a', dogIdB: 'c', status: 'neutral' },
    ]
    const result = buildCompatMap(entries)
    expect(result.size).toBe(3)
    expect(result.get('a|b')).toBe('compatible')
    expect(result.get('b|c')).toBe('conflict')
    expect(result.get('a|c')).toBe('neutral')
  })
})

describe('scoreGroup', () => {
  it('empty array returns 100', () => {
    const map = new Map<string, CompatibilityStatus>()
    expect(scoreGroup([], map)).toBe(100)
  })

  it('single dog returns 100', () => {
    const map = new Map<string, CompatibilityStatus>()
    expect(scoreGroup(['a'], map)).toBe(100)
  })

  it('all compatible pairs (3 dogs) returns 100', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'compatible'],
      ['a|c', 'compatible'],
      ['b|c', 'compatible'],
    ])
    expect(scoreGroup(['a', 'b', 'c'], map)).toBe(100)
  })

  it('all conflict pairs (3 dogs) returns 0', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'conflict'],
      ['a|c', 'conflict'],
      ['b|c', 'conflict'],
    ])
    expect(scoreGroup(['a', 'b', 'c'], map)).toBe(0)
  })

  it('all neutral pairs (3 dogs) returns 50', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'neutral'],
      ['a|c', 'neutral'],
      ['b|c', 'neutral'],
    ])
    expect(scoreGroup(['a', 'b', 'c'], map)).toBe(50)
  })

  it('all unknown pairs (3 dogs) returns 25', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'unknown'],
      ['a|c', 'unknown'],
      ['b|c', 'unknown'],
    ])
    expect(scoreGroup(['a', 'b', 'c'], map)).toBe(25)
  })

  it('mixed: 2 compatible + 1 conflict in 3 pairs returns 67', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'compatible'],
      ['a|c', 'compatible'],
      ['b|c', 'conflict'],
    ])
    // (1.0 + 1.0 + 0.0) / 3 * 100 = 66.666... -> round -> 67
    expect(scoreGroup(['a', 'b', 'c'], map)).toBe(67)
  })

  it('missing pair in compatMap is treated as unknown (0.25 weight, not neutral 0.5)', () => {
    const mapWithMissing = new Map<string, CompatibilityStatus>()
    // 2 dogs, 1 pair missing -> treated as unknown -> score = 25
    expect(scoreGroup(['a', 'b'], mapWithMissing)).toBe(25)
  })

  it('unknown pair scores lower than same group with neutral pair (SCORE-02)', () => {
    const dogsAB = ['a', 'b']
    const mapUnknown = new Map<string, CompatibilityStatus>([['a|b', 'unknown']])
    const mapNeutral = new Map<string, CompatibilityStatus>([['a|b', 'neutral']])
    expect(scoreGroup(dogsAB, mapUnknown)).toBeLessThan(scoreGroup(dogsAB, mapNeutral))
  })

  it('score is always between 0 and 100 inclusive', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'conflict'],
      ['a|c', 'compatible'],
      ['b|c', 'unknown'],
    ])
    const score = scoreGroup(['a', 'b', 'c'], map)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('getConflictsInGroup', () => {
  it('all compatible pairs returns empty array', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'compatible'],
      ['a|c', 'compatible'],
      ['b|c', 'compatible'],
    ])
    expect(getConflictsInGroup(['a', 'b', 'c'], map)).toEqual([])
  })

  it('one conflict pair returns that pair with status conflict', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'compatible'],
      ['a|c', 'conflict'],
      ['b|c', 'compatible'],
    ])
    const result = getConflictsInGroup(['a', 'b', 'c'], map)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ idA: 'a', idB: 'c', status: 'conflict' })
  })

  it('missing pair (not in map) is treated as unknown and included in result', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'compatible'],
    ])
    // a|c and b|c are missing -> unknown -> included
    const result = getConflictsInGroup(['a', 'b', 'c'], map)
    expect(result).toHaveLength(2)
    const statuses = result.map(p => p.status)
    expect(statuses.every(s => s === 'unknown')).toBe(true)
  })

  it('mixed conflict and unknown pairs — both included', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'conflict'],
      // a|c missing -> unknown
      ['b|c', 'compatible'],
    ])
    const result = getConflictsInGroup(['a', 'b', 'c'], map)
    expect(result).toHaveLength(2)
    const hasConflict = result.some(p => p.status === 'conflict')
    const hasUnknown = result.some(p => p.status === 'unknown')
    expect(hasConflict).toBe(true)
    expect(hasUnknown).toBe(true)
  })

  it('neutral pairs are NOT included in result', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'neutral'],
    ])
    expect(getConflictsInGroup(['a', 'b'], map)).toEqual([])
  })

  it('compatible pairs are NOT included in result', () => {
    const map = new Map<string, CompatibilityStatus>([
      ['a|b', 'compatible'],
    ])
    expect(getConflictsInGroup(['a', 'b'], map)).toEqual([])
  })

  it('empty group returns empty array', () => {
    const map = new Map<string, CompatibilityStatus>()
    expect(getConflictsInGroup([], map)).toEqual([])
  })

  it('single dog returns empty array', () => {
    const map = new Map<string, CompatibilityStatus>()
    expect(getConflictsInGroup(['a'], map)).toEqual([])
  })
})
