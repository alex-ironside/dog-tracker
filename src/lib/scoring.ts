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

  // Resolve per-walk outcome using groupOutcome when available
  const resolvedOutcomes = pairWalks.map((e) => {
    if (e.groupContext?.groupOutcome) {
      return e.groupContext.groupOutcome
    }
    return e.outcome
  })

  if (resolvedOutcomes.some((o) => o === 'incident')) return 'conflict'
  if (resolvedOutcomes.some((o) => o === 'poor')) return 'neutral'
  const goodCount = resolvedOutcomes.filter((o) => o === 'great' || o === 'good').length
  return goodCount / resolvedOutcomes.length >= 0.5 ? 'compatible' : 'neutral'
}

export function inferGroupContextConflicts(
  walkHistory: WalkLogEntry[]
): { triggerIds: string[]; targetId: string; status: CompatibilityStatus }[] {
  // Collect all cross-group conflict incidents keyed by sorted triggerIds + targetId
  // Key format: sorted(triggerIds).join('|') + '->' + targetId
  const conflictMap = new Map<string, { triggerIds: string[]; targetId: string; worstStatus: CompatibilityStatus }>()

  const statusRank: Record<CompatibilityStatus, number> = {
    conflict: 3,
    neutral: 2,
    compatible: 1,
    unknown: 0,
  }

  for (const entry of walkHistory) {
    if (!entry.groupContext) continue

    const { groupA, groupB, groupOutcome } = entry.groupContext
    if (!groupOutcome || (groupOutcome !== 'incident' && groupOutcome !== 'poor')) continue

    // All cross-group pairs share the encounter outcome
    for (const idA of groupA) {
      for (const idB of groupB) {
        const outcome = groupOutcome

        // The trigger group is the one with 2+ dogs (the group-context source)
        // If groupA has 2+ dogs, A dogs are triggers and B dog is the target
        // If groupB has 2+ dogs, B dogs are triggers and A dog is the target
        // If both have 2+, emit both directions
        if (groupA.length >= 2) {
          const triggerIds = [...groupA].sort()
          const targetId = idB
          const key = triggerIds.join('|') + '->' + targetId
          const inferred: CompatibilityStatus = outcome === 'incident' ? 'conflict' : 'neutral'
          const existing = conflictMap.get(key)
          if (!existing || statusRank[inferred] > statusRank[existing.worstStatus]) {
            conflictMap.set(key, { triggerIds, targetId, worstStatus: inferred })
          }
        }
        if (groupB.length >= 2) {
          const triggerIds = [...groupB].sort()
          const targetId = idA
          const key = triggerIds.join('|') + '->' + targetId
          const inferred: CompatibilityStatus = outcome === 'incident' ? 'conflict' : 'neutral'
          const existing = conflictMap.get(key)
          if (!existing || statusRank[inferred] > statusRank[existing.worstStatus]) {
            conflictMap.set(key, { triggerIds, targetId, worstStatus: inferred })
          }
        }
      }
    }
  }

  return Array.from(conflictMap.values()).map(({ triggerIds, targetId, worstStatus }) => ({
    triggerIds,
    targetId,
    status: worstStatus,
  }))
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
