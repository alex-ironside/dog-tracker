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
        'group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200',
        'hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5',
        dog.archived && 'opacity-50 hover:opacity-70'
      )}
    >
      <div className="flex items-start gap-3">
        <GripVertical size={16} className="text-muted-foreground/40 cursor-grab mt-1.5 shrink-0 group-hover:text-muted-foreground/70 transition-colors" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-semibold text-foreground leading-tight tracking-tight">{dog.name}</h3>
          {meta && (
            <p className="text-sm text-muted-foreground mt-0.5">{meta}</p>
          )}
          {dog.notes && (
            <p className="text-sm text-muted-foreground/80 line-clamp-2 mt-2 italic">{dog.notes}</p>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 mt-4 pt-3 flex items-center justify-between">
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
            className="text-destructive hover:text-destructive flex items-center gap-1"
          >
            <Archive size={14} />
            Archive
          </Button>
        )}
      </div>
    </div>
  )
}
