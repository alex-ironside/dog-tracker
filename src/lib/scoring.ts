import type { CompatibilityStatus, CompatibilityEntry } from '@/types'

export type ConflictingPair = { idA: string; idB: string; status: 'conflict' | 'unknown' }

export function pairKey(_idA: string, _idB: string): string {
  throw new Error('not implemented')
}

export function buildCompatMap(_entries: CompatibilityEntry[]): Map<string, CompatibilityStatus> {
  throw new Error('not implemented')
}

export function scoreGroup(_dogIds: string[], _compatMap: Map<string, CompatibilityStatus>): number {
  throw new Error('not implemented')
}

export function getConflictsInGroup(_dogIds: string[], _compatMap: Map<string, CompatibilityStatus>): ConflictingPair[] {
  throw new Error('not implemented')
}
