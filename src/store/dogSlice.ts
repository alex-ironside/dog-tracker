import type { StateCreator } from 'zustand'
import type { AppState, Dog } from '@/types'

export type DogActions = {
  addDog: (dog: Omit<Dog, 'id' | 'archived' | 'createdAt' | 'updatedAt'>) => void
  updateDog: (id: string, updates: Partial<Omit<Dog, 'id' | 'createdAt'>>) => void
  archiveDog: (id: string) => void
  unarchiveDog: (id: string) => void
}

export const createDogSlice: StateCreator<AppState & DogActions, [], [], DogActions> = (set) => ({
  addDog: (input) => set((state) => ({
    dogs: [
      ...state.dogs,
      {
        ...input,
        id: crypto.randomUUID(),
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  })),
  updateDog: (id, updates) => set((state) => ({
    dogs: state.dogs.map((dog) =>
      dog.id === id
        ? { ...dog, ...updates, updatedAt: new Date().toISOString() }
        : dog
    ),
  })),
  archiveDog: (id) => set((state) => ({
    dogs: state.dogs.map((dog) =>
      dog.id === id ? { ...dog, archived: true, updatedAt: new Date().toISOString() } : dog
    ),
  })),
  unarchiveDog: (id) => set((state) => ({
    dogs: state.dogs.map((dog) =>
      dog.id === id ? { ...dog, archived: false, updatedAt: new Date().toISOString() } : dog
    ),
  })),
})
