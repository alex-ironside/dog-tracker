import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import type { Dog, WalkOutcome } from '@/types'

function DraggableChip({ dog, className, onRemove }: {
  dog: Dog; className: string; onRemove?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dog.id })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
      className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium cursor-grab', className)}
    >
      {dog.name}
      {onRemove && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="ml-0.5 focus:outline-none"
          aria-label={`Remove ${dog.name}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

function DroppableBox({ id, children, className }: {
  id: string; children: React.ReactNode; className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const overRing =
    id === 'group-a' ? 'ring-blue-400' :
    id === 'group-b' ? 'ring-amber-400' :
    'ring-slate-300'
  return (
    <div ref={setNodeRef} className={cn(className, isOver && `ring-2 ring-inset ${overRing}`)}>
      {children}
    </div>
  )
}

type WalkLogSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  initialDogIds?: string[]
  initialDate?: string
  initialGroupId?: string
  editEntry?: import('@/types').WalkLogEntry
}

const OUTCOME_OPTIONS: { value: WalkOutcome; label: string; textColor: string }[] = [
  { value: 'great',    label: 'Great',    textColor: 'text-accent' },
  { value: 'good',     label: 'Good',     textColor: 'text-accent' },
  { value: 'neutral',  label: 'Neutral',  textColor: 'text-muted-foreground' },
  { value: 'poor',     label: 'Poor',     textColor: 'text-primary' },
  { value: 'incident', label: 'Incident', textColor: 'text-destructive' },
]

type GroupMode = 'together' | 'groups'
type GroupAssignment = 'A' | 'B' | null

export function WalkLogSheet({
  open,
  onOpenChange,
  title,
  initialDogIds,
  initialDate,
  initialGroupId,
  editEntry,
}: WalkLogSheetProps) {
  const dogs = useAppStore((s) => s.dogs)
  const activeDogs = dogs.filter((d) => !d.archived)

  const isEditing = !!editEntry
  const sheetTitle = title ?? (isEditing ? 'Edit Walk Log' : 'Log a Walk')

  const todayStr = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState(initialDate ?? todayStr)
  const [outcome, setOutcome] = useState<WalkOutcome | null>(null)
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(initialDogIds ?? [])
  const [notes, setNotes] = useState('')
  const [groupMode, setGroupMode] = useState<GroupMode>('together')
  // Map of dogId -> 'A' | 'B' | null
  const [groupAssignments, setGroupAssignments] = useState<Record<string, GroupAssignment>>({})
  const [groupOutcome, setGroupOutcome] = useState<WalkOutcome | null>(null)

  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const [outcomeError, setOutcomeError] = useState(false)
  const [dogsError, setDogsError] = useState(false)
  const [dateError, setDateError] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)

  // Reset / populate form when sheet opens
  useEffect(() => {
    if (open) {
      if (editEntry) {
        setDate(editEntry.date)
        setNotes(editEntry.notes)
        if (editEntry.groupContext) {
          setGroupMode('groups')
          const assignments: Record<string, GroupAssignment> = {}
          editEntry.groupContext.groupA.forEach((id) => { assignments[id] = 'A' })
          editEntry.groupContext.groupB.forEach((id) => { assignments[id] = 'B' })
          setGroupAssignments(assignments)
          setGroupOutcome(editEntry.groupContext.groupOutcome ?? null)
          setOutcome(null)
          setSelectedDogIds([])
        } else {
          setGroupMode('together')
          setGroupAssignments({})
          setGroupOutcome(null)
          setOutcome(editEntry.outcome)
          setSelectedDogIds(editEntry.dogIds)
        }
      } else {
        setDate(initialDate ?? todayStr)
        setOutcome(null)
        setSelectedDogIds(initialDogIds ?? [])
        setNotes('')
        setGroupMode('together')
        setGroupAssignments({})
        setGroupOutcome(null)
      }
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

  function handleDogToggle(dogId: string) {
    setSelectedDogIds((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    )
    if (dogsError) setDogsError(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const dogId = event.active.id as string
    const overId = event.over?.id as string | undefined
    setActiveDragId(null)
    if (!overId) return
    if (overId === 'group-a') {
      setGroupAssignments((prev) => ({ ...prev, [dogId]: 'A' as const }))
      if (dogsError) setDogsError(false)
      if (groupError) setGroupError(null)
    } else if (overId === 'group-b') {
      setGroupAssignments((prev) => ({ ...prev, [dogId]: 'B' as const }))
      if (dogsError) setDogsError(false)
      if (groupError) setGroupError(null)
    } else if (overId === 'pool') {
      setGroupAssignments((prev) => {
        const next = { ...prev }
        delete next[dogId]
        return next
      })
    }
  }

  // Group chip click: removes dog back to pool
  function handleRemoveFromGroup(dogId: string) {
    setGroupAssignments((prev) => {
      const next = { ...prev }
      delete next[dogId]
      return next
    })
  }

  function handleSave() {
    let valid = true

    if (!date) {
      setDateError(true)
      valid = false
    } else {
      setDateError(false)
    }

    if (groupMode === 'together') {
      // Walk-level outcome required in together mode
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
      // Encounter outcome required in groups mode
      if (groupOutcome === null) {
        setGroupError((prev) =>
          prev ?? 'Select an encounter outcome.'
        )
        valid = false
      }
      if (groupA.length + groupB.length === 0) {
        setDogsError(true)
        valid = false
      } else {
        setDogsError(false)
      }
    }

    if (!valid) return

    const groupContextPayload =
      groupMode === 'groups'
        ? { groupA, groupB, groupOutcome: groupOutcome! }
        : undefined

    // Walk-level outcome: use selected in together mode, groupOutcome for group encounter
    const resolvedOutcome = groupMode === 'groups' ? groupOutcome! : outcome!

    const payload = {
      date,
      outcome: resolvedOutcome,
      notes,
      dogIds: effectiveSelectedDogIds,
      groupId: editEntry?.groupId ?? initialGroupId,
      groupContext: groupContextPayload,
    }

    if (isEditing && editEntry) {
      useAppStore.getState().updateWalkLog(editEntry.id, payload)
    } else {
      useAppStore.getState().addWalkLog(payload)
    }

    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <SheetTitle className="text-lg font-semibold text-foreground">{sheetTitle}</SheetTitle>
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
              <label className="text-sm font-medium text-foreground/80 leading-normal block mb-1">
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
                <p className="text-sm text-destructive mt-1" role="alert">
                  Date is required.
                </p>
              )}
            </div>

            {/* Outcome — hidden in groups mode (per-group outcomes shown inside each group box) */}
            {groupMode === 'together' && (
              <div>
                <label className="text-sm font-medium text-foreground/80 leading-normal block mb-1">
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
                        outcome === value ? 'ring-2 ring-offset-1 ring-primary' : ''
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
                  <p className="text-sm text-destructive mt-1" role="alert">
                    Please select an outcome.
                  </p>
                )}
              </div>
            )}

            {/* Dogs present */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground/80 leading-normal">
                  Dogs present
                </label>
                {/* Group mode toggle */}
                <div className="flex rounded-md border border-border overflow-hidden text-xs">
                  <button
                    type="button"
                    className={cn(
                      'px-3 py-1 font-medium transition-colors',
                      groupMode === 'together'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted/50'
                    )}
                    onClick={() => setGroupMode('together')}
                  >
                    All together
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'px-3 py-1 font-medium border-l border-border transition-colors',
                      groupMode === 'groups'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted/50'
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
                      <p className="text-sm text-muted-foreground/70">No active dogs</p>
                    ) : (
                      activeDogs.map((dog) => (
                        <label key={dog.id} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDogIds.includes(dog.id)}
                            onChange={() => handleDogToggle(dog.id)}
                          />
                          <span className="text-sm text-foreground/80">{dog.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {dogsError && (
                    <p className="text-sm text-destructive mt-1" role="alert">
                      Select at least one dog.
                    </p>
                  )}
                </>
              ) : (
                <>
                  {activeDogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground/70">No active dogs</p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      onDragStart={(e) => setActiveDragId(e.active.id as string)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="space-y-3">
                        {/* Pool — unassigned dogs */}
                        {activeDogs.some((d) => !groupAssignments[d.id]) && (
                          <DroppableBox id="pool" className="border border-border rounded-md p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Drag dogs into Group A or Group B
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {activeDogs
                                .filter((d) => !groupAssignments[d.id])
                                .map((dog) => (
                                  <DraggableChip
                                    key={dog.id}
                                    dog={dog}
                                    className="bg-muted text-foreground/80 hover:bg-muted"
                                  />
                                ))}
                            </div>
                          </DroppableBox>
                        )}

                        {/* Group A box */}
                        <DroppableBox id="group-a" className="border-2 border-primary/40 rounded-md overflow-hidden">
                          <div className="bg-muted px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">Group A</span>
                            {groupA.length === 0 && (
                              <span className="text-xs text-muted-foreground">No dogs assigned</span>
                            )}
                          </div>
                          {groupA.length > 0 && (
                            <div className="px-3 py-2 flex flex-wrap gap-2">
                              {groupA.map((id) => {
                                const dog = activeDogs.find((d) => d.id === id)
                                return dog ? (
                                  <DraggableChip
                                    key={id}
                                    dog={dog}
                                    className="bg-primary/15 text-foreground"
                                    onRemove={() => handleRemoveFromGroup(id)}
                                  />
                                ) : null
                              })}
                            </div>
                          )}
                        </DroppableBox>

                        {/* Group B box */}
                        <DroppableBox id="group-b" className="border-2 border-primary/40 rounded-md overflow-hidden">
                          <div className="bg-primary/10 px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-primary">Group B</span>
                            {groupB.length === 0 && (
                              <span className="text-xs text-primary/80">No dogs assigned</span>
                            )}
                          </div>
                          {groupB.length > 0 && (
                            <div className="px-3 py-2 flex flex-wrap gap-2">
                              {groupB.map((id) => {
                                const dog = activeDogs.find((d) => d.id === id)
                                return dog ? (
                                  <DraggableChip
                                    key={id}
                                    dog={dog}
                                    className="bg-primary/15 text-primary"
                                    onRemove={() => handleRemoveFromGroup(id)}
                                  />
                                ) : null
                              })}
                            </div>
                          )}
                        </DroppableBox>

                        {/* Shared encounter outcome picker */}
                        <div className="border border-border rounded-md px-3 py-3">
                          <p className="text-sm font-medium text-foreground/80 mb-0.5">Encounter outcome</p>
                          <p className="text-xs text-muted-foreground mb-2">How did the groups interact?</p>
                          <div className="flex flex-wrap gap-1.5">
                            {OUTCOME_OPTIONS.map(({ value, label, textColor }) => (
                              <Button
                                key={value}
                                variant="outline"
                                size="sm"
                                aria-pressed={groupOutcome === value}
                                className={cn(
                                  textColor,
                                  'text-xs h-7 px-2',
                                  groupOutcome === value ? 'ring-2 ring-offset-1 ring-primary' : ''
                                )}
                                onClick={() => {
                                  setGroupOutcome(value)
                                  if (groupError) setGroupError(null)
                                }}
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <DragOverlay>
                        {activeDragId ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-lg cursor-grabbing">
                            {activeDogs.find((d) => d.id === activeDragId)?.name ?? ''}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                  {groupError && (
                    <p className="text-sm text-destructive mt-1" role="alert">
                      {groupError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-foreground/80 leading-normal block mb-1">
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
        <div className="sticky bottom-0 bg-background border-t border-border py-4 px-6 flex justify-between">
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
