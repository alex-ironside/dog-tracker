import type { AppState, WalkOutcome } from '@/types'

export const CURRENT_SCHEMA_VERSION = 4

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
    return migrate(
      {
        ...state,
        schemaVersion: 3,
      },
      3
    )
  }

  if (version < 4) {
    // Migrate groupAOutcome/groupBOutcome -> single groupOutcome (worst of the two)
    const outcomeRank: Record<string, number> = { incident: 4, poor: 3, neutral: 2, good: 1, great: 0 }
    const migratedHistory = state.walkHistory.map((entry) => {
      if (!entry.groupContext) return entry
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gc = entry.groupContext as any
      const groupAOutcome: WalkOutcome | undefined = gc.groupAOutcome
      const groupBOutcome: WalkOutcome | undefined = gc.groupBOutcome
      if (!groupAOutcome && !groupBOutcome) return entry

      let groupOutcome: WalkOutcome
      if (groupAOutcome && groupBOutcome) {
        groupOutcome = outcomeRank[groupAOutcome] >= outcomeRank[groupBOutcome] ? groupAOutcome : groupBOutcome
      } else {
        groupOutcome = (groupAOutcome ?? groupBOutcome)!
      }

      const { groupAOutcome: _a, groupBOutcome: _b, ...restGroupContext } = gc
      return {
        ...entry,
        groupContext: { ...restGroupContext, groupOutcome },
      }
    })

    return {
      ...state,
      walkHistory: migratedHistory,
      schemaVersion: 4,
    }
  }

  return { ...state, schemaVersion: CURRENT_SCHEMA_VERSION }
}
