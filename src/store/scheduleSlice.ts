import type { StateCreator } from 'zustand'
import type { AppState, TimeSlot } from '@/types'

export type ScheduleActions = {
  scheduleGroup: (groupId: string, slot: TimeSlot) => void
  unscheduleGroup: (groupId: string) => void
  clearSlot: (slot: TimeSlot) => void
}

export const createScheduleSlice: StateCreator<AppState & ScheduleActions, [], [], ScheduleActions> = (set) => ({
  scheduleGroup: (groupId, slot) => set((state) => {
    // Remove existing session for this group (add-or-move, D-08)
    const filtered = state.walkSessions.filter((s) => s.groupId !== groupId)
    return {
      walkSessions: [...filtered, { id: crypto.randomUUID(), groupId, slot }],
    }
  }),
  unscheduleGroup: (groupId) => set((state) => ({
    walkSessions: state.walkSessions.filter((s) => s.groupId !== groupId),
  })),
  clearSlot: (slot) => set((state) => ({
    walkSessions: state.walkSessions.filter(
      (s) => !(s.slot.dayOfWeek === slot.dayOfWeek && s.slot.hour === slot.hour && s.slot.minute === slot.minute)
    ),
  })),
})
