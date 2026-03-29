import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { pairKey } from '@/lib/scoring'
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

type GroupMode = 'together' | 'groups'
type GroupAssignment = 'A' | 'B' | null

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
  const [pairOutcomes, setPairOutcomes] = useState<Record<string, WalkOutcome>>({})
  const [groupMode, setGroupMode] = useState<GroupMode>('together')
  // Map of dogId -> 'A' | 'B' | null
  const [groupAssignments, setGroupAssignments] = useState<Record<string, GroupAssignment>>({})

  const [outcomeError, setOutcomeError] = useState(false)
  const [dogsError, setDogsError] = useState(false)
  const [dateError, setDateError] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setDate(initialDate ?? todayStr)
      setOutcome(null)
      setSelectedDogIds(initialDogIds ?? [])
      setNotes('')
      setPairOutcomes({})
      setGroupMode('together')
      setGroupAssignments({})
      setOutcomeError(false)
      setDogsError(false)
      setDateError(false)
      setGroupError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Derived group lists from assignments
  const groupA = useMemo(
    () => activeDogs.filter((d) => groupAssignments[d.id] === 'A').map((d) => d.id),
    [activeDogs, groupAssignments]
  )
  const groupB = useMemo(
    () => activeDogs.filter((d) => groupAssignments[d.id] === 'B').map((d) => d.id),
    [activeDogs, groupAssignments]
  )

  // In group mode, selectedDogIds = union of A + B
  const effectiveSelectedDogIds = useMemo(() => {
    if (groupMode === 'groups') return [...groupA, ...groupB]
    return selectedDogIds
  }, [groupMode, groupA, groupB, selectedDogIds])

  // Compute all pairs from selected dogs
  const dogPairs = useMemo(() => {
    const pairs: { idA: string; idB: string; nameA: string; nameB: string; key: string }[] = []
    const ids = effectiveSelectedDogIds
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const idA = ids[i]
        const idB = ids[j]
        const nameA = dogs.find((d) => d.id === idA)?.name ?? 'Unknown'
        const nameB = dogs.find((d) => d.id === idB)?.name ?? 'Unknown'
        pairs.push({ idA, idB, nameA, nameB, key: pairKey(idA, idB) })
      }
    }
    return pairs
  }, [effectiveSelectedDogIds, dogs])

  // All pairs have explicit pairOutcome → walk-level outcome is optional
  const allPairsCovered =
    dogPairs.length >= 1 && dogPairs.every((p) => pairOutcomes[p.key] !== undefined)

  function handleDogToggle(dogId: string) {
    setSelectedDogIds((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    )
    if (dogsError) setDogsError(false)
  }

  function handleGroupAssign(dogId: string, group: 'A' | 'B') {
    setGroupAssignments((prev) => {
      const current = prev[dogId]
      // Toggle off if same group selected
      if (current === group) {
        const next = { ...prev }
        delete next[dogId]
        return next
      }
      return { ...prev, [dogId]: group }
    })
    if (dogsError) setDogsError(false)
    if (groupError) setGroupError(null)
  }

  function handleSave() {
    let valid = true

    if (!date) {
      setDateError(true)
      valid = false
    } else {
      setDateError(false)
    }

    // Walk-level outcome is optional only when every pair has an explicit pairOutcome
    if (outcome === null && !allPairsCovered) {
      setOutcomeError(true)
      valid = false
    } else {
      setOutcomeError(false)
    }

    if (groupMode === 'together') {
      if (selectedDogIds.length === 0) {
        setDogsError(true)
        valid = false
      } else {
        setDogsError(false)
      }
    } else {
      // In group mode, both groups must have at least 1 dog
      if (groupA.length === 0 || groupB.length === 0) {
        setGroupError(
          groupA.length === 0 && groupB.length === 0
            ? 'Assign at least one dog to each group.'
            : groupA.length === 0
            ? 'Group A must have at least one dog.'
            : 'Group B must have at least one dog.'
        )
        valid = false
      } else {
        setGroupError(null)
      }
      if (groupA.length + groupB.length === 0) {
        setDogsError(true)
        valid = false
      } else {
        setDogsError(false)
      }
    }

    if (!valid) return

    // Use 'neutral' as walk-level fallback when allPairsCovered and no outcome selected
    const resolvedOutcome = outcome ?? 'neutral'
    const pairOutcomesPayload = Object.keys(pairOutcomes).length > 0 ? pairOutcomes : undefined

    const groupContextPayload =
      groupMode === 'groups' ? { groupA, groupB } : undefined

    useAppStore.getState().addWalkLog({
      date,
      outcome: resolvedOutcome,
      notes,
      dogIds: effectiveSelectedDogIds,
      groupId: initialGroupId,
      pairOutcomes: pairOutcomesPayload,
      groupContext: groupContextPayload,
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 leading-normal">
                  Dogs present
                </label>
                {/* Group mode toggle */}
                <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs">
                  <button
                    type="button"
                    className={cn(
                      'px-3 py-1 font-medium transition-colors',
                      groupMode === 'together'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    )}
                    onClick={() => setGroupMode('together')}
                  >
                    All together
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'px-3 py-1 font-medium border-l border-slate-200 transition-colors',
                      groupMode === 'groups'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    )}
                    onClick={() => setGroupMode('groups')}
                  >
                    Two groups
                  </button>
                </div>
              </div>

              {groupMode === 'together' ? (
                <>
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
                </>
              ) : (
                <>
                  {activeDogs.length === 0 ? (
                    <p className="text-sm text-slate-400">No active dogs</p>
                  ) : (
                    <div className="border border-input rounded-md overflow-hidden">
                      {/* Column headers */}
                      <div className="grid grid-cols-3 text-xs font-semibold border-b border-slate-200">
                        <div className="px-3 py-1.5 text-slate-500">Dog</div>
                        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-center">Group A</div>
                        <div className="px-3 py-1.5 bg-amber-50 text-amber-700 text-center">Group B</div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {activeDogs.map((dog) => {
                          const assignment = groupAssignments[dog.id] ?? null
                          return (
                            <div
                              key={dog.id}
                              className="grid grid-cols-3 items-center border-b border-slate-100 last:border-b-0"
                            >
                              <span className="px-3 py-1.5 text-sm text-slate-700 truncate">
                                {dog.name}
                              </span>
                              <div className="flex justify-center py-1">
                                <button
                                  type="button"
                                  onClick={() => handleGroupAssign(dog.id, 'A')}
                                  className={cn(
                                    'w-7 h-7 rounded-full text-xs font-bold transition-colors',
                                    assignment === 'A'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-blue-50 text-blue-400 hover:bg-blue-100'
                                  )}
                                >
                                  A
                                </button>
                              </div>
                              <div className="flex justify-center py-1">
                                <button
                                  type="button"
                                  onClick={() => handleGroupAssign(dog.id, 'B')}
                                  className={cn(
                                    'w-7 h-7 rounded-full text-xs font-bold transition-colors',
                                    assignment === 'B'
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-amber-50 text-amber-400 hover:bg-amber-100'
                                  )}
                                >
                                  B
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {groupError && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {groupError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Per-pair outcomes */}
            {dogPairs.length >= 1 && (
              <div>
                <label className="text-sm font-medium text-slate-700 leading-normal block mb-0.5">
                  Per-pair outcomes <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Override the default outcome for specific pairs.
                </p>
                <div className="space-y-2">
                  {dogPairs.map(({ idA, idB, nameA, nameB, key }) => (
                    <div key={key}>
                      <span className="text-sm text-slate-600 block mb-1">
                        {nameA} &amp; {nameB}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {OUTCOME_OPTIONS.map(({ value, label, textColor }) => {
                          const selected = pairOutcomes[key] === value
                          return (
                            <Button
                              key={value}
                              variant="outline"
                              size="sm"
                              aria-pressed={selected}
                              className={cn(
                                textColor,
                                'text-xs h-7 px-2',
                                selected ? 'ring-2 ring-offset-1 ring-slate-500' : ''
                              )}
                              onClick={() => {
                                setPairOutcomes((prev) => {
                                  if (prev[key] === value) {
                                    // Toggle off — clear override
                                    const next = { ...prev }
                                    delete next[key]
                                    return next
                                  }
                                  return { ...prev, [key]: value }
                                })
                              }}
                            >
                              {label}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
