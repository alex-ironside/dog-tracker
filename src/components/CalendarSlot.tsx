import { useDroppable } from '@dnd-kit/core'
import { slotKey } from '@/lib/calendarUtils'
import type { TimeSlot, WalkSession, WalkGroup } from '@/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarSlotProps = {
  dayOfWeek: TimeSlot['dayOfWeek']
  hour: number
  minute: number
  sessionMap: Map<string, WalkSession>
  walkGroups: WalkGroup[]
}

export function CalendarSlot({ dayOfWeek, hour, minute, sessionMap, walkGroups }: CalendarSlotProps) {
  const slotKeyStr = slotKey({ dayOfWeek, hour, minute })
  const { setNodeRef, isOver } = useDroppable({ id: slotKeyStr })

  const session = sessionMap.get(slotKeyStr)
  const group = session ? walkGroups.find((g) => g.id === session.groupId) : undefined
  const dayName = DAY_NAMES[dayOfWeek]

  const ariaLabel = session && group
    ? `${dayName} ${hour}:00 — ${group.name}, ${group.dogIds.length} dogs`
    : `${dayName} ${hour}:00 — empty`

  return (
    <div
      ref={setNodeRef}
      role='gridcell'
      aria-label={ariaLabel}
      className={`border-b border-r border-slate-100 p-1 min-h-[48px]${isOver ? ' ring-2 ring-primary ring-inset' : ''}`}
    >
      {session && group && (
        <div className='px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs'>
          {group.name} • {group.dogIds.length} dogs
        </div>
      )}
    </div>
  )
}
