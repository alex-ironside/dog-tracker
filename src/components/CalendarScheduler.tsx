import { useState, useMemo, useEffect } from 'react'
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
import { slotKey, parseSlotKey, HOURS } from '@/lib/calendarUtils'
import { buildCompatMap, inferStatusFromHistory, pairKey } from '@/lib/scoring'

export function CalendarScheduler() {
  const { t } = useTranslation()
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [highlightDogId, setHighlightDogId] = useState<string | null>(null)
  const [startHour, setStartHour] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio:calHours')
      return saved ? JSON.parse(saved).start : 8
    } catch {
      return 8
    }
  })
  const [endHour, setEndHour] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio:calHours')
      return saved ? JSON.parse(saved).end : 19
    } catch {
      return 19
    }
  })
  const [logSheet, setLogSheet] = useState<{
    open: boolean
    dogIds: string[]
    groupId: string
    groupName: string
  }>({ open: false, dogIds: [], groupId: '', groupName: '' })

  useEffect(() => {
    localStorage.setItem('portfolio:calHours', JSON.stringify({ start: startHour, end: endHour }))
  }, [startHour, endHour])

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

  const multiWalkCountsByDay = useMemo(() => {
    const countsByDay = new Map<number, Map<string, number>>()
    for (const session of walkSessions) {
      const { dayOfWeek } = session.slot
      const group = walkGroups.find((g) => g.id === session.groupId)
      if (!group) continue
      if (!countsByDay.has(dayOfWeek)) {
        countsByDay.set(dayOfWeek, new Map())
      }
      const dayCounts = countsByDay.get(dayOfWeek)!
      for (const dogId of group.dogIds) {
        dayCounts.set(dogId, (dayCounts.get(dogId) ?? 0) + 1)
      }
    }
    return countsByDay
  }, [walkSessions, walkGroups])

  const filteredHours = useMemo(
    () => HOURS.filter((h) => h >= startHour && h <= endHour),
    [startHour, endHour]
  )

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
      <h1 className='font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground'>{t('nav.calendar')}</h1>
      <p className='text-sm text-muted-foreground mt-1'>{t('calendar.subtitle')}</p>
    </header>
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 mb-3'>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-muted-foreground'>Highlight dog:</label>
          <select
            value={highlightDogId ?? ''}
            onChange={(e) => setHighlightDogId(e.target.value || null)}
            className='text-sm border border-border rounded px-2 py-1 bg-background'
          >
            <option value=''>None</option>
            {dogs.filter((d) => !d.archived).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-muted-foreground'>Hours:</label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className='text-sm border border-border rounded px-2 py-1 bg-background'
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
          <span className='text-muted-foreground'>-</span>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className='text-sm border border-border rounded px-2 py-1 bg-background'
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
      </div>

      <div className='flex flex-col md:flex-row rounded-2xl border border-border overflow-hidden w-full md:w-[90%]'>
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
          multiWalkCountsByDay={multiWalkCountsByDay}
          highlightDogId={highlightDogId}
          hours={filteredHours}
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
