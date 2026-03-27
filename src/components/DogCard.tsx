import { GripVertical, Pencil, Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Dog } from '@/types'

type DogCardProps = {
  dog: Dog
  onEdit: (dog: Dog) => void
  onArchive: (dog: Dog) => void
  onUnarchive: (dog: Dog) => void
}

function buildMeta(dog: Dog): string {
  const parts: string[] = []
  if (dog.breed) parts.push(dog.breed)
  if (dog.age !== null && dog.age !== undefined) parts.push(`${dog.age} yrs`)
  return parts.join(' · ')
}

export function DogCard({ dog, onEdit, onArchive, onUnarchive }: DogCardProps) {
  const meta = buildMeta(dog)

  return (
    <div
      className={cn(
        'border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-150',
        dog.archived
          ? 'bg-slate-100 opacity-60'
          : 'bg-white shadow-sm'
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={16} className="text-slate-300 cursor-grab mt-1 shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 leading-normal">{dog.name}</h3>
          {meta && (
            <p className="text-sm text-slate-500 leading-normal">{meta}</p>
          )}
          {dog.notes && (
            <p className="text-sm text-slate-500 leading-normal line-clamp-2 mt-1">{dog.notes}</p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 mt-3 pt-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(dog)}
          className="flex items-center gap-1"
        >
          <Pencil size={14} />
          Edit
        </Button>

        {dog.archived ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnarchive(dog)}
            className="flex items-center gap-1"
          >
            <ArchiveRestore size={14} />
            Unarchive
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(dog)}
            className="text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Archive size={14} />
            Archive
          </Button>
        )}
      </div>
    </div>
  )
}
