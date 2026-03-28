import type { StateCreator } from 'zustand'
import type { AppState, WalkLogEntry } from '@/types'

export type WalkHistoryActions = {
  addWalkLog: (entry: Omit<WalkLogEntry, 'id'>) => void
}

export const createWalkHistorySlice: StateCreator<AppState & WalkHistoryActions, [], [], WalkHistoryActions> = (set) => ({
  addWalkLog: (entry) => set((state) => ({
    walkHistory: [
      ...state.walkHistory,
      { ...entry, id: crypto.randomUUID() },
    ],
  })),
})
