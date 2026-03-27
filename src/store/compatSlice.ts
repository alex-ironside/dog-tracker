import type { StateCreator } from 'zustand'
import type { AppState, CompatibilityStatus, CompatibilityEntry } from '@/types'

export type CompatActions = {
  setCompatibility: (idA: string, idB: string, status: CompatibilityStatus) => void
  removeCompatibility: (idA: string, idB: string) => void
}

function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join('|')
}

export const createCompatSlice: StateCreator<AppState & CompatActions, [], [], CompatActions> = (set) => ({
  setCompatibility: (idA, idB, status) => set((state) => {
    const key = pairKey(idA, idB)
    const existingIndex = state.compatibilityEntries.findIndex(
      (e) => pairKey(e.dogIdA, e.dogIdB) === key
    )
    if (existingIndex !== -1) {
      return {
        compatibilityEntries: state.compatibilityEntries.map((e, i) =>
          i === existingIndex ? { dogIdA: idA, dogIdB: idB, status } : e
        ),
      }
    }
    return {
      compatibilityEntries: [
        ...state.compatibilityEntries,
        { dogIdA: idA, dogIdB: idB, status },
      ],
    }
  }),
  removeCompatibility: (idA, idB) => set((state) => {
    const key = pairKey(idA, idB)
    return {
      compatibilityEntries: state.compatibilityEntries.filter(
        (e) => pairKey(e.dogIdA, e.dogIdB) !== key
      ),
    }
  }),
})
