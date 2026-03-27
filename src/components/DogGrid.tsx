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
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <h2 className="text-base font-medium text-slate-600 leading-relaxed">No dogs yet</h2>
        <p className="text-sm text-slate-400 leading-relaxed">Add your first dog to get started.</p>
        <Button variant="default" onClick={onAddDog}>Add Dog</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
