import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { WalkLogSheet } from '@/components/WalkLogSheet'
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
import { slotKey, parseSlotKey } from '@/lib/calendarUtils'
import { buildCompatMap, inferStatusFromHistory, pairKey } from '@/lib/scoring'

export function CalendarScheduler() {
  const { t } = useTranslation()
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [logSheet, setLogSheet] = useState<{
    open: boolean
    dogIds: string[]
    groupId: string
    groupName: string
  }>({ open: false, dogIds: [], groupId: '', groupName: '' })

  const {
    walkSessions,
    walkGroups,
    dogs,
    compatibilityEntries,
    walkHistory,
    scheduleGroup,
    unscheduleGroup,
  } = useAppStore(
    useShallow((s) => ({
      walkSessions: s.walkSessions,
      walkGroups: s.walkGroups,
      dogs: s.dogs,
      compatibilityEntries: s.compatibilityEntries,
      walkHistory: s.walkHistory,
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

  const compatMap = useMemo(() => {
    const map = buildCompatMap(compatibilityEntries)
    const activeDogIds = dogs.filter((d) => !d.archived).map((d) => d.id)
    for (let i = 0; i < activeDogIds.length; i++) {
      for (let j = i + 1; j < activeDogIds.length; j++) {
        const key = pairKey(activeDogIds[i], activeDogIds[j])
        if (!map.has(key)) {
          const inferred = inferStatusFromHistory(activeDogIds[i], activeDogIds[j], walkHistory)
          if (inferred) map.set(key, inferred)
        }
      }
    }
    return map
  }, [compatibilityEntries, dogs, walkHistory])

  const activeDragGroup = activeDragId
    ? walkGroups.find((g) => g.id === activeDragId) ?? null
    : null

  function handleDragStart(event: DragStartEvent) {
    const groupId = event.active.data.current?.groupId as string | undefined
    setActiveDragId(groupId ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const groupId = active.data.current?.groupId as string
    const overId = over.id as string

    if (overId === 'group-sidebar') {
      // Drag back to sidebar = unschedule (D-09)
      unscheduleGroup(groupId)
      return
    }

    // overId is a slot key string
    const targetSlot = parseSlotKey(overId)

    // D-07: reject if slot is occupied by a DIFFERENT group
    const existingSession = sessionMap.get(overId)
    if (existingSession && existingSession.groupId !== groupId) {
      // Slot occupied by another group — reject drop, no state change
      return
    }

    // If dropping on own slot (no-op) or empty slot (schedule/move)
    if (!existingSession || existingSession.groupId === groupId) {
      scheduleGroup(groupId, targetSlot)
    }
  }

  return (
    <>
    <header className='mb-6'>
      <h1 className='font-display text-4xl font-semibold tracking-tight text-foreground'>{t('nav.calendar')}</h1>
      <p className='text-sm text-muted-foreground mt-1'>{t('calendar.subtitle')}</p>
    </header>
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='flex h-[600px] rounded-2xl border border-border overflow-hidden'>
        <GroupSidebar
          walkGroups={walkGroups}
          scheduledGroupIds={scheduledGroupIds}
          compatMap={compatMap}
        />
        <WeekCalendar
          weekOffset={weekOffset}
          onPrevWeek={() => setWeekOffset((w) => w - 1)}
          onNextWeek={() => setWeekOffset((w) => w + 1)}
          sessionMap={sessionMap}
          walkGroups={walkGroups}
          dogs={dogs}
          compatMap={compatMap}
          onUnschedule={unscheduleGroup}
          onLog={(groupId, dogIds, groupName) =>
            setLogSheet({ open: true, dogIds, groupId, groupName })
          }
        />
      </div>

      <WalkLogSheet
        open={logSheet.open}
        onOpenChange={(open) => setLogSheet((prev) => ({ ...prev, open }))}
        title={`Log Walk — ${logSheet.groupName}`}
        initialDogIds={logSheet.dogIds}
        initialGroupId={logSheet.groupId}
      />

      <DragOverlay>
        {activeDragGroup ? (
          <div className='px-3 py-2 rounded-md bg-card shadow-lg opacity-70 text-sm'>
            {activeDragGroup.name} • {activeDragGroup.dogIds.length} dogs
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </>
  )
}
