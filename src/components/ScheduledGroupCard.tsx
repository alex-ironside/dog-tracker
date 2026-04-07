import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ScheduledGroupCardProps = {
  groupId: string
  groupName: string
  dogCount: number
  hasConflicts: boolean
  score: number
  onRemove: () => void
  onLog: () => void
  dayName: string
  hour: number
}

function scoreBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-accent/20 text-accent'
  if (score >= 50) return 'bg-primary/15 text-primary'
  return 'bg-destructive/15 text-destructive'
}

export function ScheduledGroupCard({
  groupId,
  groupName,
  dogCount,
  hasConflicts,
  score,
  onRemove,
  onLog,
  dayName,
  hour,
}: ScheduledGroupCardProps) {
  const { t } = useTranslation()
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `scheduled-${groupId}`,
    data: { type: 'scheduled-group', groupId },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-2 py-1 rounded bg-muted border border-border text-xs text-foreground flex items-center justify-between gap-1${isDragging ? ' opacity-50' : ''}`}
    >
      <span className='flex items-center gap-1 min-w-0'>
        <span className='font-semibold truncate'>{groupName}</span>
        <span className='text-muted-foreground/70'>•</span>
        <span>{t('calendar.dogs', { count: dogCount })}</span>
        {dogCount >= 2 && (
          <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium shrink-0 ${scoreBadgeClasses(score)}`}>
            {score}
          </span>
        )}
        {hasConflicts && (
          <AlertTriangle size={12} className='text-primary ml-0.5 inline shrink-0' />
        )}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onLog()
        }}
        aria-label={t('calendar.logWalkAria', { group: groupName, day: dayName, hour, defaultValue: `Log walk for ${groupName} at ${dayName} ${hour}:00` })}
        className="text-xs text-muted-foreground hover:text-foreground/90 shrink-0"
      >
        {t('calendar.log', { defaultValue: 'Log' })}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label={t('calendar.removeAria', { group: groupName, day: dayName, hour, defaultValue: `Remove ${groupName} from ${dayName} ${hour}:00` })}
        className='shrink-0'
      >
        <X size={12} className='text-muted-foreground/70 hover:text-destructive' />
      </button>
    </div>
  )
}
