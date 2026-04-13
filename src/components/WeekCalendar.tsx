import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CalendarSlot } from '@/components/CalendarSlot'
import {
  getWeekDays,
  getMondayOfWeek,
  formatColumnHeader,
  formatWeekLabel,
} from '@/lib/calendarUtils'
import type { TimeSlot, WalkSession, WalkGroup, Dog, CompatibilityStatus } from '@/types'

type WeekCalendarProps = {
  weekOffset: number
  onPrevWeek: () => void
  onNextWeek: () => void
  sessionMap: Map<string, WalkSession>
  walkGroups: WalkGroup[]
  dogs: Dog[]
  compatMap: Map<string, CompatibilityStatus>
  onUnschedule: (groupId: string) => void
  onLog: (groupId: string, dogIds: string[], groupName: string) => void
  multiWalkCountsByDay: Map<number, Map<string, number>>
  highlightDogId: string | null
  hours: number[]
}

export function WeekCalendar({
  weekOffset,
  onPrevWeek,
  onNextWeek,
  sessionMap,
  walkGroups,
  dogs,
  compatMap,
  onUnschedule,
  onLog,
  multiWalkCountsByDay,
  highlightDogId,
  hours,
}: WeekCalendarProps) {
  const { t } = useTranslation()
  const weekDays = getWeekDays(weekOffset)
  const monday = getMondayOfWeek(weekOffset)

  return (
    <div className='flex flex-col flex-1'>
      {/* Week navigation header */}
      <div className='flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0'>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('calendar.prevWeek', { defaultValue: 'Previous week' })}
          onClick={onPrevWeek}
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <span className='text-sm font-semibold text-foreground/90'>
          {formatWeekLabel(monday)}
        </span>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('calendar.nextWeek', { defaultValue: 'Next week' })}
          onClick={onNextWeek}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Grid */}
      <div className='flex-1'>
        <div
          role='grid'
          style={{
            display: 'grid',
            gridTemplateColumns: '64px repeat(7, 1fr)',
            gridTemplateRows: `40px repeat(${hours.length}, minmax(64px, auto))`,
          }}
        >
          {/* Corner cell */}
          <div className='sticky top-0 left-0 z-30 bg-card border-b border-r border-border' />

          {/* Day header cells */}
          {weekDays.map((date, dayIndex) => (
            <div
              key={dayIndex}
              className='sticky top-0 z-20 bg-muted/50 border-b border-r border-border flex items-center justify-center text-xs font-semibold text-muted-foreground'
            >
              {formatColumnHeader(date)}
            </div>
          ))}

          {/* Hour rows */}
          {hours.map((hour) => (
            <React.Fragment key={`row-${hour}`}>
              {/* Hour label */}
              <div
                className='sticky left-0 z-10 bg-card border-b border-r border-border flex items-center justify-center text-xs text-muted-foreground/70'
              >
                {String(hour).padStart(2, '0')}:00
              </div>

              {/* Slot cells for this hour */}
              {weekDays.map((date, dayIndex) => {
                const dayOfWeek = date.getDay() as TimeSlot['dayOfWeek']
                return (
                  <CalendarSlot
                    key={`${dayIndex}-${hour}`}
                    dayOfWeek={dayOfWeek}
                    hour={hour}
                    minute={0}
                    sessionMap={sessionMap}
                    walkGroups={walkGroups}
                    dogs={dogs}
                    compatMap={compatMap}
                    onUnschedule={onUnschedule}
                    onLog={onLog}
                    multiWalkCounts={multiWalkCountsByDay.get(dayOfWeek) ?? new Map()}
                    highlightDogId={highlightDogId}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
