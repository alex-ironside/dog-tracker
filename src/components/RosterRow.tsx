import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Dog } from '@/types'

type RosterRowProps = {
  dog: Dog
  assignedGroupName: string | null
}

export function RosterRow({ dog, assignedGroupName }: RosterRowProps) {
  const { t } = useTranslation()
  const isAssigned = assignedGroupName !== null

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: dog.id,
    disabled: isAssigned,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  if (isAssigned) {
    return (
      <div className='flex items-center gap-2 px-3 py-2 rounded-md opacity-60 cursor-not-allowed bg-muted'>
        <GripVertical size={16} className='text-muted-foreground/50' />
        <span className='text-sm text-foreground flex-1'>{dog.name}</span>
        <span className='text-xs text-muted-foreground/70 italic'>{t('roster.inGroup', { group: assignedGroupName, defaultValue: `in ${assignedGroupName}` })}</span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted cursor-grab'
    >
      <GripVertical size={16} className='text-muted-foreground/50' />
      <span className='text-sm text-foreground flex-1'>{dog.name}</span>
    </div>
  )
}
