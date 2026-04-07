import { useState, useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { WalkHistoryChart } from '@/components/WalkHistoryChart'
import { WalkLogSheet } from '@/components/WalkLogSheet'
import type { Dog, WalkOutcome } from '@/types'

type DogPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingDog: Dog | null
}

const OUTCOME_BADGE: Record<WalkOutcome, { className: string; label: string }> = {
  great:    { className: 'bg-accent/20 text-accent border border-accent/40',           label: 'Great' },
  good:     { className: 'bg-accent/10 text-accent/90 border border-accent/30',        label: 'Good' },
  neutral:  { className: 'bg-muted text-muted-foreground border border-border',        label: 'Neutral' },
  poor:     { className: 'bg-primary/15 text-primary border border-primary/30',        label: 'Poor' },
  incident: { className: 'bg-destructive/15 text-destructive border border-destructive/40', label: 'Incident' },
}

function OutcomeBadge({ outcome }: { outcome: WalkOutcome }) {
  const badge = OUTCOME_BADGE[outcome]
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', badge.className)}>
      {badge.label}
    </span>
  )
}

export function DogPanel({ open, onOpenChange, editingDog }: DogPanelProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [notes, setNotes] = useState('')
  const [nameError, setNameError] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile')
  const [logSheetOpen, setLogSheetOpen] = useState(false)

  const walkHistory = useAppStore((s) => s.walkHistory)

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
      setActiveTab('profile')
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

  const recentEntries = editingDog
    ? [...walkHistory]
        .filter((e) => e.dogIds.includes(editingDog.id))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10)
    : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <SheetTitle className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close panel"
            onClick={resetAndClose}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Tab bar — only shown in edit mode */}
        {editingDog && (
          <div role="tablist" className="flex border-b border-border px-6">
            <button
              role="tab"
              aria-selected={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              className={`py-2 text-sm font-semibold mr-4 ${
                activeTab === 'profile'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground/90'
              }`}
            >
              Profile
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              className={`py-2 text-sm font-semibold ${
                activeTab === 'history'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground/90'
              }`}
            >
              History
            </button>
          </div>
        )}

        {/* Profile form */}
        {activeTab === 'profile' && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor={nameId} className="text-sm font-medium text-foreground/90 leading-normal">
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
                    nameError && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {nameError && (
                  <p className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                    Name is required.
                  </p>
                )}
              </div>

              {/* Breed */}
              <div>
                <Label htmlFor={breedId} className="text-sm font-medium text-foreground/90 leading-normal">
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
                <Label htmlFor={ageId} className="text-sm font-medium text-foreground/90 leading-normal">
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
                <Label htmlFor={notesId} className="text-sm font-medium text-foreground/90 leading-normal">
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
        )}

        {/* History tab body */}
        {activeTab === 'history' && editingDog && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <WalkHistoryChart dogId={editingDog.id} />
            <Button
              variant="default"
              className="mt-4 w-full"
              onClick={() => setLogSheetOpen(true)}
            >
              Log a walk for {editingDog.name}
            </Button>
            <div className="mt-4 space-y-2">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="border border-border rounded-md px-3 py-2 bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                    <OutcomeBadge outcome={entry.outcome} />
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
            <WalkLogSheet
              open={logSheetOpen}
              onOpenChange={setLogSheetOpen}
              title={`Log Walk for ${editingDog.name}`}
              initialDogIds={[editingDog.id]}
            />
          </div>
        )}

        {/* Sticky Footer — only shown on Profile tab (D-13) */}
        {activeTab === 'profile' && (
          <div className="sticky bottom-0 bg-card border-t border-border py-4 px-6 flex justify-between">
            <Button variant="outline" onClick={handleDiscard}>
              {t('common.discard')}
            </Button>
            <Button variant="default" onClick={handleSave}>
              {t('dogPanel.saveDog', { defaultValue: 'Save Dog' })}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
