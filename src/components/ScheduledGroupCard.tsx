import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, X } from 'lucide-react'

type ScheduledGroupCardProps = {
  groupId: string
  groupName: string
  dogCount: number
  hasConflicts: boolean
  onRemove: () => void
  onLog: () => void
  dayName: string
  hour: number
}

export function ScheduledGroupCard({
  groupId,
  groupName,
  dogCount,
  hasConflicts,
  onRemove,
  onLog,
  dayName,
  hour,
}: ScheduledGroupCardProps) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `scheduled-${groupId}`,
    data: { type: 'scheduled-group', groupId },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs text-slate-900 flex items-center justify-between gap-1${isDragging ? ' opacity-50' : ''}`}
    >
      <span className='flex items-center gap-1 min-w-0'>
        <span className='font-semibold truncate'>{groupName}</span>
        <span className='text-slate-400'>•</span>
        <span>{dogCount} dogs</span>
        {hasConflicts && (
          <AlertTriangle size={12} className='text-amber-500 ml-1 inline shrink-0' />
        )}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onLog()
        }}
        aria-label={`Log walk for ${groupName} at ${dayName} ${hour}:00`}
        className="text-xs text-slate-500 hover:text-slate-700 shrink-0"
      >
        Log
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label={`Remove ${groupName} from ${dayName} ${hour}:00`}
        className='shrink-0'
      >
        <X size={12} className='text-slate-400 hover:text-red-500' />
      </button>
    </div>
  )
}
