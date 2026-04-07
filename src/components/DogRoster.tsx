import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/store'
import { useDogSearch, DogSearchInput } from '@/components/SearchableDogPicker'
import { DogGrid } from './DogGrid'
import { DogPanel } from './DogPanel'
import type { Dog } from '@/types'
import { useId } from 'react'

export function DogRoster() {
  const { t } = useTranslation()
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingDog, setEditingDog] = useState<Dog | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [archivingDog, setArchivingDog] = useState<Dog | null>(null)

  const dogs = useAppStore((s) => s.dogs)
  const archiveDog = useAppStore((s) => s.archiveDog)
  const unarchiveDog = useAppStore((s) => s.unarchiveDog)

  const switchId = useId()

  const visibleDogs = showArchived ? dogs : dogs.filter((d) => !d.archived)
  const { query, setQuery, filtered: searchedDogs } = useDogSearch(visibleDogs)

  function handleAddDog() {
    setEditingDog(null)
    setPanelOpen(true)
  }

  function handleEditDog(dog: Dog) {
    setEditingDog(dog)
    setPanelOpen(true)
  }

  function handleArchiveDog(dog: Dog) {
    setArchivingDog(dog)
  }

  function handleConfirmArchive() {
    if (archivingDog) {
      archiveDog(archivingDog.id)
      setArchivingDog(null)
    }
  }

  function handleUnarchiveDog(dog: Dog) {
    unarchiveDog(dog.id)
  }

  return (
    <div>
      {/* Header bar */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t('roster.title', { defaultValue: 'Dog Roster' })}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('roster.subtitle', { defaultValue: 'Your pack at a glance.' })}</p>
        </div>
        <Button variant="default" size="lg" onClick={handleAddDog} className="flex items-center gap-2 shadow-sm">
          <Plus size={16} />
          {t('roster.addDog', { defaultValue: 'Add Dog' })}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <DogSearchInput value={query} onChange={setQuery} className="max-w-xs" />
        <Switch
          id={switchId}
          checked={showArchived}
          onCheckedChange={setShowArchived}
          aria-label={t('roster.showArchivedDogs')}
        />
        <Label htmlFor={switchId} className="text-sm text-muted-foreground cursor-pointer">
          {t('roster.showArchivedDogs')}
        </Label>
      </div>

      {/* Grid */}
      <DogGrid
        dogs={searchedDogs}
        onEdit={handleEditDog}
        onArchive={handleArchiveDog}
        onUnarchive={handleUnarchiveDog}
        onAddDog={handleAddDog}
      />

      {/* Add / Edit panel */}
      <DogPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        editingDog={editingDog}
      />

      {/* Archive confirmation dialog */}
      <AlertDialog open={!!archivingDog} onOpenChange={(open) => { if (!open) setArchivingDog(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archivingDog?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('roster.archiveHidden')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('roster.keepDog')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmArchive}
            >
              {t('common.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
