import { useDroppable } from '@dnd-kit/core'
import { slotKey } from '@/lib/calendarUtils'
import { getConflictsInGroup } from '@/lib/scoring'
import { ScheduledGroupCard } from '@/components/ScheduledGroupCard'
import type { TimeSlot, WalkSession, WalkGroup, Dog, CompatibilityStatus } from '@/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarSlotProps = {
  dayOfWeek: TimeSlot['dayOfWeek']
  hour: number
  minute: number
  sessionMap: Map<string, WalkSession>
  walkGroups: WalkGroup[]
  dogs: Dog[]
  compatMap: Map<string, CompatibilityStatus>
  onUnschedule: (groupId: string) => void
}

export function CalendarSlot({
  dayOfWeek,
  hour,
  minute,
  sessionMap,
  walkGroups,
  dogs,
  compatMap,
  onUnschedule,
}: CalendarSlotProps) {
  const slotKeyStr = slotKey({ dayOfWeek, hour, minute })
  const { setNodeRef, isOver } = useDroppable({ id: slotKeyStr })

  const session = sessionMap.get(slotKeyStr)
  const group = session ? walkGroups.find((g) => g.id === session.groupId) : undefined
  const dayName = DAY_NAMES[dayOfWeek]

  const hasConflicts = group
    ? getConflictsInGroup(group.dogIds, compatMap).some((c) => c.status === 'conflict')
    : false

  const ariaLabel = session && group
    ? `${dayName} ${hour}:00 — ${group.name}, ${group.dogIds.length} dogs`
    : `${dayName} ${hour}:00 — empty`

  const isOccupied = !!(session && group)
  const ringClass = isOver
    ? isOccupied
      ? ' ring-2 ring-red-300 ring-inset opacity-50'
      : ' ring-2 ring-primary ring-inset'
    : ''

  return (
    <div
      ref={setNodeRef}
      role='gridcell'
      aria-label={ariaLabel}
      className={`border-b border-r border-slate-100 p-1 min-h-[48px]${ringClass}`}
    >
      {session && group && (
        <ScheduledGroupCard
          groupId={session.groupId}
          groupName={group.name}
          dogCount={group.dogIds.length}
          hasConflicts={hasConflicts}
          onRemove={() => onUnschedule(session.groupId)}
          dayName={dayName}
          hour={hour}
        />
      )}
    </div>
  )
}
