import { scoreGroup, getConflictsInGroup } from './scoring'
import type { ConflictingPair } from './scoring'
import type { CompatibilityStatus } from '@/types'

export type SuggestedGroup = {
  dogIds: string[]
  score: number
  conflicts: ConflictingPair[]
}

function combinations(arr: string[], k: number): string[][] {
  const result: string[][] = []
  const n = arr.length
  if (k > n || k <= 0) return result
  const indices = Array.from({ length: k }, (_, i) => i)
  while (true) {
    result.push(indices.map(i => arr[i]))
    let i = k - 1
    while (i >= 0 && indices[i] === i + n - k) i--
    if (i < 0) break
    indices[i]++
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1
  }
  return result
}

export function suggestGroups(
  availableDogs: string[],
  compatMap: Map<string, CompatibilityStatus>,
  groupSize: number,
  maxResults: number = 3
): SuggestedGroup[] {
  if (availableDogs.length < groupSize) return []

  const allCombinations = combinations(availableDogs, groupSize)
  const scored: SuggestedGroup[] = allCombinations.map(dogIds => ({
    dogIds,
    score: scoreGroup(dogIds, compatMap),
    conflicts: getConflictsInGroup(dogIds, compatMap),
  }))

  scored.sort((a, b) => {
    if (a.conflicts.length !== b.conflicts.length) return a.conflicts.length - b.conflicts.length
    return b.score - a.score
  })

  return scored.slice(0, maxResults)
}
