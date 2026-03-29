import type { CompatibilityStatus, CompatibilityEntry, WalkLogEntry } from '@/types'

export type ConflictingPair = { idA: string; idB: string; status: 'conflict' | 'unknown' }

export function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join('|')
}

export function buildCompatMap(entries: CompatibilityEntry[]): Map<string, CompatibilityStatus> {
  return new Map(entries.map(e => [pairKey(e.dogIdA, e.dogIdB), e.status]))
}

export function scoreGroup(dogIds: string[], compatMap: Map<string, CompatibilityStatus>): number {
  const n = dogIds.length
  const totalPairs = (n * (n - 1)) / 2
  if (totalPairs === 0) return 100

  const weights: Record<CompatibilityStatus, number> = {
    compatible: 1.0,
    neutral: 0.5,
    unknown: 0.25,
    conflict: 0.0,
  }

  let sum = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const status = compatMap.get(pairKey(dogIds[i], dogIds[j])) ?? 'unknown'
      sum += weights[status]
    }
  }

  return Math.round((sum / totalPairs) * 100)
}

export function inferStatusFromHistory(
  dogIdA: string,
  dogIdB: string,
  walkHistory: WalkLogEntry[]
): CompatibilityStatus | null {
  const pairWalks = walkHistory.filter(
    (e) => e.dogIds.includes(dogIdA) && e.dogIds.includes(dogIdB)
  )
  if (pairWalks.length === 0) return null
  if (pairWalks.some((e) => e.outcome === 'incident')) return 'conflict'
  if (pairWalks.some((e) => e.outcome === 'poor')) return 'neutral'
  const goodCount = pairWalks.filter(
    (e) => e.outcome === 'great' || e.outcome === 'good'
  ).length
  return goodCount / pairWalks.length >= 0.5 ? 'compatible' : 'neutral'
}

export function getConflictsInGroup(dogIds: string[], compatMap: Map<string, CompatibilityStatus>): ConflictingPair[] {
  const n = dogIds.length
  const result: ConflictingPair[] = []

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const status = compatMap.get(pairKey(dogIds[i], dogIds[j])) ?? 'unknown'
      if (status === 'conflict' || status === 'unknown') {
        result.push({ idA: dogIds[i], idB: dogIds[j], status })
      }
    }
  }

  return result
}
