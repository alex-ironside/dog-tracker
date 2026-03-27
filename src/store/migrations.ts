import type { AppState } from '@/types'

export const CURRENT_SCHEMA_VERSION = 1

export function migrate(persistedState: unknown, version: number): AppState {
  const state = persistedState as AppState

  // Future migrations: if (version === 0) { /* transform v0 → v1 */ }
  // Each case transforms from version N to N+1, then falls through

  void version

  return { ...state, schemaVersion: CURRENT_SCHEMA_VERSION }
}
