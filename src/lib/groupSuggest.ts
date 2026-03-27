import type { CompatibilityStatus } from '@/types'
import type { ConflictingPair } from './scoring'

export type SuggestedGroup = {
  dogIds: string[]
  score: number
  conflicts: ConflictingPair[]
}

export function suggestGroups(
  availableDogs: string[],
  compatMap: Map<string, CompatibilityStatus>,
  groupSize: number,
  maxResults: number = 3
): SuggestedGroup[] {
  throw new Error('not implemented')
}
