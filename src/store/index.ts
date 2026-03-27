import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createDogSlice, type DogActions } from './dogSlice'
import { createCompatSlice, type CompatActions } from './compatSlice'
import type { AppState } from '@/types'
import { CURRENT_SCHEMA_VERSION, migrate } from './migrations'

export type AppStore = AppState & DogActions & CompatActions

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dogs: [],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
      ...createDogSlice(...a),
      ...createCompatSlice(...a),
    }),
    {
      name: 'dogTracker-store',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
      migrate,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        dogs: state.dogs,
        walkGroups: state.walkGroups,
        compatibilityEntries: state.compatibilityEntries,
        walkSessions: state.walkSessions,
      }),
    }
  )
)
