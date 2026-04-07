import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center gap-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">{t('roster.emptyTitle')}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{t('roster.emptyBody')}</p>
        <Button variant="default" onClick={onAddDog} className="mt-2">{t('roster.addDog')}</Button>
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
