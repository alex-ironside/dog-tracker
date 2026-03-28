import type { AppState } from '@/types'

export const CURRENT_SCHEMA_VERSION = 2

export function migrate(persistedState: unknown, version: number): AppState {
  const state = persistedState as AppState

  if (version < 2) {
    return {
      ...state,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      walkHistory: (state as any).walkHistory ?? [],
      schemaVersion: 2,
    }
  }

  return { ...state, schemaVersion: CURRENT_SCHEMA_VERSION }
}
