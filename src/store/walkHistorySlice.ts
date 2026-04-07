import type { StateCreator } from 'zustand'
import type { AppState, WalkLogEntry } from '@/types'

export type WalkHistoryActions = {
  addWalkLog: (entry: Omit<WalkLogEntry, 'id'>) => void
  updateWalkLog: (id: string, entry: Omit<WalkLogEntry, 'id'>) => void
  deleteWalkLog: (id: string) => void
}

export const createWalkHistorySlice: StateCreator<AppState & WalkHistoryActions, [], [], WalkHistoryActions> = (set) => ({
  addWalkLog: (entry) => set((state) => ({
    walkHistory: [
      ...state.walkHistory,
      { ...entry, id: crypto.randomUUID() },
    ],
  })),
  updateWalkLog: (id, entry) => set((state) => ({
    walkHistory: state.walkHistory.map((e) => e.id === id ? { ...entry, id } : e),
  })),
  deleteWalkLog: (id) => set((state) => ({
    walkHistory: state.walkHistory.filter((e) => e.id !== id),
  })),
})
