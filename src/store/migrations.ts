import type { AppState } from '@/types'

export const CURRENT_SCHEMA_VERSION = 3

export function migrate(persistedState: unknown, version: number): AppState {
  const state = persistedState as AppState

  if (version < 2) {
    return migrate(
      {
        ...state,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walkHistory: (state as any).walkHistory ?? [],
        schemaVersion: 2,
      },
      2
    )
  }

  if (version < 3) {
    // groupContext is optional on WalkLogEntry — no structural changes needed
    return {
      ...state,
      schemaVersion: 3,
    }
  }

  return { ...state, schemaVersion: CURRENT_SCHEMA_VERSION }
}
