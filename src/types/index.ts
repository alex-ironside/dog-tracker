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

export type WalkOutcome = 'great' | 'good' | 'neutral' | 'poor' | 'incident'

export type GroupContext = {
  groupA: string[]  // dog IDs in group A
  groupB: string[]  // dog IDs in group B
  groupOutcome?: WalkOutcome  // single outcome for the Group A vs Group B encounter
}

export type WalkLogEntry = {
  id: string
  date: string
  outcome: WalkOutcome
  notes: string
  dogIds: string[]
  groupId?: string
  groupContext?: GroupContext  // only present when user used group mode
}

export type AppState = {
  schemaVersion: number
  dogs: Dog[]
  walkGroups: WalkGroup[]
  compatibilityEntries: CompatibilityEntry[]
  walkSessions: WalkSession[]
  walkHistory: WalkLogEntry[]
}
