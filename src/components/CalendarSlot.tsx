import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { slotKey } from '@/lib/calendarUtils'
import { getConflictsInGroup, scoreGroup } from '@/lib/scoring'
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
  onLog: (groupId: string, dogIds: string[], groupName: string) => void
  multiWalkCounts: Map<string, number>
  highlightDogId: string | null
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
  onLog,
  multiWalkCounts,
  highlightDogId,
}: CalendarSlotProps) {
  const { t } = useTranslation()
  const slotKeyStr = slotKey({ dayOfWeek, hour, minute })
  const { setNodeRef, isOver } = useDroppable({ id: slotKeyStr })

  const session = sessionMap.get(slotKeyStr)
  const group = session ? walkGroups.find((g) => g.id === session.groupId) : undefined
  const dayName = DAY_NAMES[dayOfWeek]

  const hasConflicts = group
    ? getConflictsInGroup(group.dogIds, compatMap).some((c) => c.status === 'conflict')
    : false
  const score = group ? scoreGroup(group.dogIds, compatMap) : 0

  const ariaLabel = session && group
    ? `${dayName} ${hour}:00 — ${group.name}, ${t('calendar.dogs', { count: group.dogIds.length })}`
    : `${dayName} ${hour}:00 — ${t('calendar.emptySlot', { defaultValue: 'empty' })}`

  const isOccupied = !!(session && group)
  const slotHighlight = highlightDogId && group && group.dogIds.includes(highlightDogId)
  const ringClass = isOver
    ? isOccupied
      ? ' ring-2 ring-red-300 ring-inset opacity-50'
      : ' ring-2 ring-primary ring-inset'
    : slotHighlight
      ? ' border-2 border-primary'
      : ''

  const dogNames = group
    ? group.dogIds.map((id) => dogs.find((d) => d.id === id)?.name ?? '?')
    : []

  return (
    <div
      ref={setNodeRef}
      role='gridcell'
      aria-label={ariaLabel}
      className={`border-b border-r border-border/60 p-1 min-h-[48px]${ringClass}`}
    >
      {session && group && (
        <ScheduledGroupCard
          groupId={session.groupId}
          groupName={group.name}
          dogCount={group.dogIds.length}
          hasConflicts={hasConflicts}
          score={score}
          onRemove={() => onUnschedule(session.groupId)}
          onLog={() => onLog(session.groupId, group.dogIds, group.name)}
          dayName={dayName}
          hour={hour}
          dogNames={dogNames}
          dogIds={group.dogIds}
          multiWalkCounts={multiWalkCounts}
          highlightDogId={highlightDogId}
        />
      )}
    </div>
  )
}
