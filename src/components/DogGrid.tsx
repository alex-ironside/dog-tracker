import { Button } from '@/components/ui/button'
import { DogCard } from './DogCard'
import type { Dog } from '@/types'

type DogGridProps = {
  dogs: Dog[]
  onEdit: (dog: Dog) => void
  onArchive: (dog: Dog) => void
  onUnarchive: (dog: Dog) => void
  onAddDog: () => void
}

export function DogGrid({ dogs, onEdit, onArchive, onUnarchive, onAddDog }: DogGridProps) {
  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center gap-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">No dogs yet</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Add your first dog to start tracking walks, groups, and compatibility.</p>
        <Button variant="default" onClick={onAddDog} className="mt-2">Add Dog</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {dogs.map((dog) => (
        <DogCard
          key={dog.id}
          dog={dog}
          onEdit={onEdit}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      ))}
    </div>
  )
}
