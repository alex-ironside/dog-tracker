import type { StateCreator } from 'zustand'
import type { AppState } from '@/types'

export type GroupActions = {
  addGroup: (name: string) => void
  renameGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
  addDogToGroup: (groupId: string, dogId: string) => void
  removeDogFromGroup: (groupId: string, dogId: string) => void
}

export const createGroupSlice: StateCreator<AppState & GroupActions, [], [], GroupActions> = (set) => ({
  addGroup: (name) => set((state) => ({
    walkGroups: [...state.walkGroups, { id: crypto.randomUUID(), name, dogIds: [] }],
  })),
  renameGroup: (id, name) => set((state) => ({
    walkGroups: state.walkGroups.map((g) => g.id === id ? { ...g, name } : g),
  })),
  deleteGroup: (id) => set((state) => ({
    walkGroups: state.walkGroups.filter((g) => g.id !== id),
  })),
  addDogToGroup: (groupId, dogId) => set((state) => {
    // Remove dogId from any other group first (GROUP-02 enforcement)
    const cleaned = state.walkGroups.map((g) =>
      g.id === groupId ? g : { ...g, dogIds: g.dogIds.filter((d) => d !== dogId) }
    )
    return {
      walkGroups: cleaned.map((g) =>
        g.id === groupId && !g.dogIds.includes(dogId)
          ? { ...g, dogIds: [...g.dogIds, dogId] }
          : g
      ),
    }
  }),
  removeDogFromGroup: (groupId, dogId) => set((state) => ({
    walkGroups: state.walkGroups.map((g) =>
      g.id === groupId ? { ...g, dogIds: g.dogIds.filter((d) => d !== dogId) } : g
    ),
  })),
})
