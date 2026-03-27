import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Dog } from '@/types'

type RosterRowProps = {
  dog: Dog
  assignedGroupName: string | null
}

export function RosterRow({ dog, assignedGroupName }: RosterRowProps) {
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
      <div className='flex items-center gap-2 px-3 py-2 rounded-md opacity-60 cursor-not-allowed bg-slate-100'>
        <GripVertical size={16} className='text-slate-300' />
        <span className='text-sm text-slate-900 flex-1'>{dog.name}</span>
        <span className='text-xs text-slate-400 italic'>in {assignedGroupName}</span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className='flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 cursor-grab'
    >
      <GripVertical size={16} className='text-slate-300' {...listeners} />
      <span className='text-sm text-slate-900 flex-1'>{dog.name}</span>
    </div>
  )
}
