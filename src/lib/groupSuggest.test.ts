import { describe, it, expect } from 'vitest'
import { suggestGroups, type SuggestedGroup } from './groupSuggest'
import type { CompatibilityStatus } from '@/types'

function makeMap(entries: [string, string, CompatibilityStatus][]): Map<string, CompatibilityStatus> {
  const map = new Map<string, CompatibilityStatus>()
  for (const [a, b, status] of entries) {
    const key = [a, b].sort().join('|')
    map.set(key, status)
  }
  return map
}

describe('suggestGroups', () => {
  it('returns up to 3 ranked groups when all pairs compatible (default maxResults)', () => {
    const dogs = ['d1', 'd2', 'd3', 'd4', 'd5']
    const map = makeMap([
      ['d1', 'd2', 'compatible'], ['d1', 'd3', 'compatible'], ['d1', 'd4', 'compatible'],
      ['d1', 'd5', 'compatible'], ['d2', 'd3', 'compatible'], ['d2', 'd4', 'compatible'],
      ['d2', 'd5', 'compatible'], ['d3', 'd4', 'compatible'], ['d3', 'd5', 'compatible'],
      ['d4', 'd5', 'compatible'],
    ])
    const results = suggestGroups(dogs, map, 3)
    expect(results).toHaveLength(3)
    results.forEach((r: SuggestedGroup) => {
      expect(r.score).toBe(100)
      expect(r.conflicts).toHaveLength(0)
      expect(r.dogIds).toHaveLength(3)
    })
  })

  it('returns exactly 2 results when maxResults=2 and pool has more combinations', () => {
    const dogs = ['d1', 'd2', 'd3', 'd4']
    const map = makeMap([
      ['d1', 'd2', 'compatible'], ['d1', 'd3', 'compatible'], ['d1', 'd4', 'compatible'],
      ['d2', 'd3', 'compatible'], ['d2', 'd4', 'compatible'], ['d3', 'd4', 'compatible'],
    ])
    const results = suggestGroups(dogs, map, 2, 2)
    expect(results).toHaveLength(2)
  })

  it('returns empty array when pool smaller than groupSize', () => {
    const map = makeMap([['d1', 'd2', 'compatible']])
    const results = suggestGroups(['d1', 'd2'], map, 3)
    expect(results).toHaveLength(0)
  })

  it('returns empty array when pool is empty', () => {
    const results = suggestGroups([], new Map(), 2)
    expect(results).toHaveLength(0)
  })

  it('ranks conflict-free groups before groups with conflicts', () => {
    // d1-d2 conflict; groups not containing that pair should come first
    const dogs = ['d1', 'd2', 'd3', 'd4', 'd5']
    const map = makeMap([
      ['d1', 'd2', 'conflict'],
      ['d1', 'd3', 'compatible'], ['d1', 'd4', 'compatible'], ['d1', 'd5', 'compatible'],
      ['d2', 'd3', 'compatible'], ['d2', 'd4', 'compatible'], ['d2', 'd5', 'compatible'],
      ['d3', 'd4', 'compatible'], ['d3', 'd5', 'compatible'], ['d4', 'd5', 'compatible'],
    ])
    const results = suggestGroups(dogs, map, 2, 10)
    // First results should have 0 conflicts
    expect(results[0].conflicts).toHaveLength(0)
    // Groups with conflicts should come after
    const conflictGroups = results.filter(r => r.conflicts.length > 0)
    const cleanGroups = results.filter(r => r.conflicts.length === 0)
    // All clean groups should appear before all conflict groups
    const lastClean = results.lastIndexOf(cleanGroups[cleanGroups.length - 1])
    const firstConflict = results.indexOf(conflictGroups[0])
    expect(lastClean).toBeLessThan(firstConflict)
  })

  it('ranks higher-score group before lower-score group with same conflict count', () => {
    // d1-d2: neutral (score 50), d1-d3: compatible (score 100), d2-d3: compatible
    const dogs = ['d1', 'd2', 'd3']
    const map = makeMap([
      ['d1', 'd2', 'neutral'],
      ['d1', 'd3', 'compatible'],
      ['d2', 'd3', 'compatible'],
    ])
    // groupSize 2: d1-d3 and d2-d3 both score 100, d1-d2 scores 50
    const results = suggestGroups(dogs, map, 2, 3)
    // Last result should be the lowest scored
    expect(results[results.length - 1].score).toBe(50)
  })

  it('returns non-empty result when all pairs conflict (D-10 — never empty when pool valid)', () => {
    const dogs = ['d1', 'd2', 'd3', 'd4']
    const map = makeMap([
      ['d1', 'd2', 'conflict'], ['d1', 'd3', 'conflict'], ['d1', 'd4', 'conflict'],
      ['d2', 'd3', 'conflict'], ['d2', 'd4', 'conflict'], ['d3', 'd4', 'conflict'],
    ])
    const results = suggestGroups(dogs, map, 2)
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBe(3)
    results.forEach(r => {
      expect(r.conflicts.length).toBeGreaterThan(0)
    })
  })

  it('returns 1 group with unknown pairs when all pairs unknown (D-10)', () => {
    const dogs = ['d1', 'd2', 'd3']
    const results = suggestGroups(dogs, new Map(), 3)
    expect(results).toHaveLength(1)
    expect(results[0].score).toBe(25)
    expect(results[0].conflicts).toHaveLength(3)
  })

  it('returns exactly 1 result when maxResults=1', () => {
    const dogs = ['d1', 'd2', 'd3', 'd4']
    const map = makeMap([
      ['d1', 'd2', 'compatible'], ['d1', 'd3', 'compatible'], ['d1', 'd4', 'compatible'],
      ['d2', 'd3', 'compatible'], ['d2', 'd4', 'compatible'], ['d3', 'd4', 'compatible'],
    ])
    const results = suggestGroups(dogs, map, 2, 1)
    expect(results).toHaveLength(1)
  })

  it('returns all combinations when maxResults exceeds total combinations', () => {
    const dogs = ['d1', 'd2', 'd3']
    const map = makeMap([
      ['d1', 'd2', 'compatible'], ['d1', 'd3', 'compatible'], ['d2', 'd3', 'compatible'],
    ])
    // C(3,2) = 3 combinations; maxResults=10 should return exactly 3
    const results = suggestGroups(dogs, map, 2, 10)
    expect(results).toHaveLength(3)
  })

  it('each SuggestedGroup contains dogIds, score, and conflicts', () => {
    const dogs = ['d1', 'd2', 'd3']
    const map = makeMap([
      ['d1', 'd2', 'compatible'], ['d1', 'd3', 'compatible'], ['d2', 'd3', 'compatible'],
    ])
    const results = suggestGroups(dogs, map, 2)
    results.forEach(r => {
      expect(Array.isArray(r.dogIds)).toBe(true)
      expect(typeof r.score).toBe('number')
      expect(Array.isArray(r.conflicts)).toBe(true)
    })
  })
})
