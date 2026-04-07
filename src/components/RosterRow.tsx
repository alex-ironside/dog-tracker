import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Dog } from '@/types'

type RosterRowProps = {
  dog: Dog
  assignedGroupNames: string[]
}

export function RosterRow({ dog, assignedGroupNames }: RosterRowProps) {
  const { t } = useTranslation()
  const assignedCount = assignedGroupNames.length
  const inMultiple = assignedCount >= 2

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: dog.id,
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  const label =
    assignedCount === 0
      ? null
      : inMultiple
      ? t('roster.inGroups', {
          count: assignedCount,
          defaultValue: `in ${assignedCount} groups`,
        })
      : t('roster.inGroup', {
          group: assignedGroupNames[0],
          defaultValue: `in ${assignedGroupNames[0]}`,
        })

  const baseClasses = 'flex items-center gap-2 px-3 py-2 rounded-md cursor-grab'
  const stateClasses = inMultiple
    ? 'bg-amber-100 ring-1 ring-amber-400 hover:bg-amber-200 dark:bg-amber-900/30 dark:ring-amber-500/60 dark:hover:bg-amber-900/50'
    : 'hover:bg-muted'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${baseClasses} ${stateClasses}`}
      title={assignedGroupNames.join(', ') || undefined}
    >
      <GripVertical size={16} className='text-muted-foreground/50' />
      <span className='text-sm text-foreground flex-1'>{dog.name}</span>
      {label && (
        <span
          className={`text-xs italic ${
            inMultiple ? 'text-amber-700 dark:text-amber-300 font-medium not-italic' : 'text-muted-foreground/70'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  )
}
