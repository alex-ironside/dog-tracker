import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import type { WalkOutcome } from '@/types'

type WalkLogSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  initialDogIds?: string[]
  initialDate?: string
  initialGroupId?: string
}

const OUTCOME_OPTIONS: { value: WalkOutcome; label: string; textColor: string }[] = [
  { value: 'great',    label: 'Great',    textColor: 'text-green-700' },
  { value: 'good',     label: 'Good',     textColor: 'text-teal-700' },
  { value: 'neutral',  label: 'Neutral',  textColor: 'text-slate-600' },
  { value: 'poor',     label: 'Poor',     textColor: 'text-amber-700' },
  { value: 'incident', label: 'Incident', textColor: 'text-red-700' },
]

export function WalkLogSheet({
  open,
  onOpenChange,
  title = 'Log a Walk',
  initialDogIds,
  initialDate,
  initialGroupId,
}: WalkLogSheetProps) {
  const dogs = useAppStore((s) => s.dogs)
  const activeDogs = dogs.filter((d) => !d.archived)

  const todayStr = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState(initialDate ?? todayStr)
  const [outcome, setOutcome] = useState<WalkOutcome | null>(null)
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(initialDogIds ?? [])
  const [notes, setNotes] = useState('')

  const [outcomeError, setOutcomeError] = useState(false)
  const [dogsError, setDogsError] = useState(false)
  const [dateError, setDateError] = useState(false)

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setDate(initialDate ?? todayStr)
      setOutcome(null)
      setSelectedDogIds(initialDogIds ?? [])
      setNotes('')
      setOutcomeError(false)
      setDogsError(false)
      setDateError(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleDogToggle(dogId: string) {
    setSelectedDogIds((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    )
    if (dogsError) setDogsError(false)
  }

  function handleSave() {
    let valid = true

    if (!date) {
      setDateError(true)
      valid = false
    } else {
      setDateError(false)
    }

    if (outcome === null) {
      setOutcomeError(true)
      valid = false
    } else {
      setOutcomeError(false)
    }

    if (selectedDogIds.length === 0) {
      setDogsError(true)
      valid = false
    } else {
      setDogsError(false)
    }

    if (!valid) return

    useAppStore.getState().addWalkLog({
      date,
      outcome: outcome!,
      notes,
      dogIds: selectedDogIds,
      groupId: initialGroupId,
    })

    onOpenChange(false)
  }

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
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="text-sm font-medium text-slate-700 leading-normal block mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  if (dateError && e.target.value) setDateError(false)
                }}
                className={cn(
                  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base',
                  'ring-offset-background placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
                )}
              />
              {dateError && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  Date is required.
                </p>
              )}
            </div>

            {/* Outcome */}
            <div>
              <label className="text-sm font-medium text-slate-700 leading-normal block mb-1">
                Outcome
              </label>
              <div className="flex flex-wrap gap-2">
                {OUTCOME_OPTIONS.map(({ value, label, textColor }) => (
                  <Button
                    key={value}
                    variant="outline"
                    aria-pressed={outcome === value}
                    className={cn(
                      textColor,
                      outcome === value ? 'ring-2 ring-offset-1 ring-slate-500' : ''
                    )}
                    onClick={() => {
                      setOutcome(value)
                      if (outcomeError) setOutcomeError(false)
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {outcomeError && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  Please select an outcome.
                </p>
              )}
            </div>

            {/* Dogs present */}
            <div>
              <label className="text-sm font-medium text-slate-700 leading-normal block mb-1">
                Dogs present
              </label>
              <div className="max-h-48 overflow-y-auto border border-input rounded-md px-3 py-2">
                {activeDogs.length === 0 ? (
                  <p className="text-sm text-slate-400">No active dogs</p>
                ) : (
                  activeDogs.map((dog) => (
                    <label key={dog.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDogIds.includes(dog.id)}
                        onChange={() => handleDogToggle(dog.id)}
                      />
                      <span className="text-sm text-slate-700">{dog.name}</span>
                    </label>
                  ))
                )}
              </div>
              {dogsError && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  Select at least one dog.
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-slate-700 leading-normal block mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any notes about this walk..."
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 px-6 flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Discard
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save Walk Log
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
