import { useState, useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import type { Dog } from '@/types'

type DogPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingDog: Dog | null
}

export function DogPanel({ open, onOpenChange, editingDog }: DogPanelProps) {
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [notes, setNotes] = useState('')
  const [nameError, setNameError] = useState(false)

  const nameId = useId()
  const breedId = useId()
  const ageId = useId()
  const notesId = useId()

  // Populate form when panel opens or editingDog changes
  useEffect(() => {
    if (open) {
      if (editingDog) {
        setName(editingDog.name)
        setBreed(editingDog.breed)
        setAge(editingDog.age !== null ? String(editingDog.age) : '')
        setNotes(editingDog.notes)
      } else {
        setName('')
        setBreed('')
        setAge('')
        setNotes('')
      }
      setNameError(false)
    }
  }, [open, editingDog])

  function resetAndClose() {
    setNameError(false)
    onOpenChange(false)
  }

  function handleDiscard() {
    resetAndClose()
  }

  function handleSave() {
    if (!name.trim()) {
      setNameError(true)
      return
    }

    const payload = {
      name: name.trim(),
      breed: breed.trim(),
      age: age ? parseInt(age, 10) : null,
      notes: notes.trim(),
    }

    if (editingDog) {
      useAppStore.getState().updateDog(editingDog.id, payload)
    } else {
      useAppStore.getState().addDog(payload)
    }

    resetAndClose()
  }

  const title = editingDog ? 'Edit Dog' : 'Add Dog'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <SheetTitle className="text-lg font-semibold text-slate-900">{title}</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close panel"
            onClick={resetAndClose}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor={nameId} className="text-sm font-medium text-slate-700 leading-normal">
                Name
              </Label>
              <Input
                id={nameId}
                placeholder="e.g. Rex"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError && e.target.value.trim()) setNameError(false)
                }}
                className={cn(
                  'mt-1',
                  nameError && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              {nameError && (
                <p className="text-sm text-red-600 mt-1" role="alert" aria-live="polite">
                  Name is required.
                </p>
              )}
            </div>

            {/* Breed */}
            <div>
              <Label htmlFor={breedId} className="text-sm font-medium text-slate-700 leading-normal">
                Breed
              </Label>
              <Input
                id={breedId}
                placeholder="e.g. Labrador"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Age */}
            <div>
              <Label htmlFor={ageId} className="text-sm font-medium text-slate-700 leading-normal">
                Age
              </Label>
              <Input
                id={ageId}
                type="number"
                min={0}
                placeholder="e.g. 3"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor={notesId} className="text-sm font-medium text-slate-700 leading-normal">
                Notes
              </Label>
              <textarea
                id={notesId}
                rows={3}
                placeholder="Any notes about this dog..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn(
                  'mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-base',
                  'ring-offset-background placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none'
                )}
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 px-6 flex justify-between">
          <Button variant="outline" onClick={handleDiscard}>
            Discard
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save Dog
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
