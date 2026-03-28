import type { TimeSlot } from '@/types'

export function slotKey(slot: TimeSlot): string {
  return `${slot.dayOfWeek}:${slot.hour}:${slot.minute}`
}

export function parseSlotKey(key: string): TimeSlot {
  const [dayOfWeek, hour, minute] = key.split(':').map(Number)
  return { dayOfWeek: dayOfWeek as TimeSlot['dayOfWeek'], hour, minute }
}

export const HOURS = Array.from({ length: 13 }, (_, i) => i + 7)

export function getMondayOfWeek(weekOffset: number): Date {
  const today = new Date()
  const day = today.getDay()
  const distToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + distToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getWeekDays(weekOffset: number): Date[] {
  const monday = getMondayOfWeek(weekOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatColumnHeader(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()}`
}

export function formatWeekLabel(monday: Date): string {
  return `Week of ${monday.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`
}
