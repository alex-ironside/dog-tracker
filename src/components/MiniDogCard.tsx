import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

type MiniDogCardProps = {
  dogId: string
  dogName: string
  onRemove: () => void
}

export function MiniDogCard({ dogId, dogName, onRemove }: MiniDogCardProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dogId })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border text-sm text-foreground touch-none ${isDragging ? 'cursor-grabbing opacity-50' : 'cursor-grab'}`}
    >
      <span>{dogName}</span>
      <button
        type='button'
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        aria-label={t('groups.removeDogAria', { name: dogName, defaultValue: `Remove ${dogName} from group` })}
        className='p-0 h-4 w-4 inline-flex items-center justify-center text-muted-foreground/70 hover:text-destructive'
      >
        <X size={12} />
      </button>
    </div>
  )
}
