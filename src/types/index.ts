export type Dog = {
  id: string
  name: string
  breed: string
  age: number | null
  notes: string
  archived: boolean
  createdAt: string
  updatedAt: string
}

export type WalkGroup = {
  id: string
  name: string
  dogIds: string[]
}

export type CompatibilityStatus = 'compatible' | 'neutral' | 'conflict' | 'unknown'

export type CompatibilityEntry = {
  dogIdA: string
  dogIdB: string
  status: CompatibilityStatus
}

export type TimeSlot = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  hour: number
  minute: number
}

export type WalkSession = {
  id: string
  groupId: string
  slot: TimeSlot
}

export type AppState = {
  schemaVersion: number
  dogs: Dog[]
  walkGroups: WalkGroup[]
  compatibilityEntries: CompatibilityEntry[]
  walkSessions: WalkSession[]
}
