import { useState, useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'
import { GroupSidebar } from '@/components/GroupSidebar'
import { WeekCalendar } from '@/components/WeekCalendar'
import { slotKey } from '@/lib/calendarUtils'

export function CalendarScheduler() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const { walkSessions, walkGroups, scheduleGroup, unscheduleGroup } = useAppStore(
    useShallow((s) => ({
      walkSessions: s.walkSessions,
      walkGroups: s.walkGroups,
      scheduleGroup: s.scheduleGroup,
      unscheduleGroup: s.unscheduleGroup,
    }))
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const sessionMap = useMemo(
    () => new Map(walkSessions.map((s) => [slotKey(s.slot), s])),
    [walkSessions]
  )

  const scheduledGroupIds = useMemo(
    () => new Set(walkSessions.map((s) => s.groupId)),
    [walkSessions]
  )

  const activeDragGroup = activeDragId
    ? walkGroups.find((g) => g.id === activeDragId) ?? null
    : null

  function handleDragStart(event: DragStartEvent) {
    const groupId = event.active.data.current?.groupId as string | undefined
    setActiveDragId(groupId ?? null)
  }

  function handleDragEnd(_event: DragEndEvent) {
    // STUB: Plan 02 wires the full onDragEnd logic
    setActiveDragId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='flex h-full'>
        <GroupSidebar
          walkGroups={walkGroups}
          scheduledGroupIds={scheduledGroupIds}
        />
        <WeekCalendar
          weekOffset={weekOffset}
          onPrevWeek={() => setWeekOffset((w) => w - 1)}
          onNextWeek={() => setWeekOffset((w) => w + 1)}
          sessionMap={sessionMap}
          walkGroups={walkGroups}
        />
      </div>

      <DragOverlay>
        {activeDragGroup ? (
          <div className='px-3 py-2 rounded-md bg-white border border-slate-200 text-sm text-slate-900 shadow-lg opacity-70'>
            {activeDragGroup.name} • {activeDragGroup.dogIds.length} dogs
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
