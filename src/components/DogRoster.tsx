import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { DogGrid } from './DogGrid'
import { DogPanel } from './DogPanel'
import type { Dog } from '@/types'
import { useId } from 'react'

export function DogRoster() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingDog, setEditingDog] = useState<Dog | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [archivingDog, setArchivingDog] = useState<Dog | null>(null)

  const dogs = useAppStore((s) => s.dogs)
  const archiveDog = useAppStore((s) => s.archiveDog)
  const unarchiveDog = useAppStore((s) => s.unarchiveDog)

  const switchId = useId()

  const visibleDogs = showArchived ? dogs : dogs.filter((d) => !d.archived)

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-slate-900 leading-normal">Dog Roster</h1>
        <Button variant="default" onClick={handleAddDog} className="flex items-center gap-1">
          <Plus size={16} />
          Add Dog
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6">
        <Switch
          id={switchId}
          checked={showArchived}
          onCheckedChange={setShowArchived}
          aria-label="Show archived dogs"
        />
        <Label htmlFor={switchId} className="text-sm text-slate-600 cursor-pointer">
          Show archived dogs
        </Label>
      </div>

      {/* Grid */}
      <DogGrid
        dogs={visibleDogs}
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
              They'll be hidden from active views but their history is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Dog</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmArchive}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
