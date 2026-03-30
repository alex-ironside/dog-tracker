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
  const [groupMode, setGroupMode] = useState<GroupMode>('together')
  // Map of dogId -> 'A' | 'B' | null
  const [groupAssignments, setGroupAssignments] = useState<Record<string, GroupAssignment>>({})
  const [groupAOutcome, setGroupAOutcome] = useState<WalkOutcome | null>(null)
  const [groupBOutcome, setGroupBOutcome] = useState<WalkOutcome | null>(null)

  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

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
      setGroupMode('together')
      setGroupAssignments({})
      setGroupAOutcome(null)
      setGroupBOutcome(null)
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
      // Both groups need an outcome in groups mode
      if (groupAOutcome === null || groupBOutcome === null) {
        setGroupError((prev) =>
          prev ?? 'Select an outcome for each group.'
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
        ? { groupA, groupB, groupAOutcome: groupAOutcome!, groupBOutcome: groupBOutcome! }
        : undefined

    // Walk-level outcome: use selected in together mode, groupAOutcome as primary fallback in groups mode
    const resolvedOutcome = groupMode === 'groups' ? groupAOutcome! : outcome!

    useAppStore.getState().addWalkLog({
      date,
      outcome: resolvedOutcome,
      notes,
      dogIds: effectiveSelectedDogIds,
      groupId: initialGroupId,
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

            {/* Outcome — hidden in groups mode (per-group outcomes shown inside each group box) */}
            {groupMode === 'together' && (
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
            )}

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
                    <DndContext
                      sensors={sensors}
                      onDragStart={(e) => setActiveDragId(e.active.id as string)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="space-y-3">
                        {/* Pool — unassigned dogs */}
                        {activeDogs.some((d) => !groupAssignments[d.id]) && (
                          <DroppableBox id="pool" className="border border-slate-200 rounded-md p-3">
                            <p className="text-xs font-medium text-slate-500 mb-2">
                              Drag dogs into Group A or Group B
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {activeDogs
                                .filter((d) => !groupAssignments[d.id])
                                .map((dog) => (
                                  <DraggableChip
                                    key={dog.id}
                                    dog={dog}
                                    className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  />
                                ))}
                            </div>
                          </DroppableBox>
                        )}

                        {/* Group A box */}
                        <DroppableBox id="group-a" className="border-2 border-blue-200 rounded-md overflow-hidden">
                          <div className="bg-blue-50 px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-700">Group A</span>
                            {groupA.length === 0 && (
                              <span className="text-xs text-blue-400">No dogs assigned</span>
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
                                    className="bg-blue-100 text-blue-700"
                                    onRemove={() => handleRemoveFromGroup(id)}
                                  />
                                ) : null
                              })}
                            </div>
                          )}
                          <div className="px-3 pb-3">
                            <p className="text-xs font-medium text-slate-500 mb-1.5">Group A outcome</p>
                            <div className="flex flex-wrap gap-1.5">
                              {OUTCOME_OPTIONS.map(({ value, label, textColor }) => (
                                <Button
                                  key={value}
                                  variant="outline"
                                  size="sm"
                                  aria-pressed={groupAOutcome === value}
                                  className={cn(
                                    textColor,
                                    'text-xs h-7 px-2',
                                    groupAOutcome === value ? 'ring-2 ring-offset-1 ring-slate-500' : ''
                                  )}
                                  onClick={() => {
                                    setGroupAOutcome(value)
                                    if (groupError) setGroupError(null)
                                  }}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </DroppableBox>

                        {/* Group B box */}
                        <DroppableBox id="group-b" className="border-2 border-amber-200 rounded-md overflow-hidden">
                          <div className="bg-amber-50 px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-amber-700">Group B</span>
                            {groupB.length === 0 && (
                              <span className="text-xs text-amber-400">No dogs assigned</span>
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
                                    className="bg-amber-100 text-amber-700"
                                    onRemove={() => handleRemoveFromGroup(id)}
                                  />
                                ) : null
                              })}
                            </div>
                          )}
                          <div className="px-3 pb-3">
                            <p className="text-xs font-medium text-slate-500 mb-1.5">Group B outcome</p>
                            <div className="flex flex-wrap gap-1.5">
                              {OUTCOME_OPTIONS.map(({ value, label, textColor }) => (
                                <Button
                                  key={value}
                                  variant="outline"
                                  size="sm"
                                  aria-pressed={groupBOutcome === value}
                                  className={cn(
                                    textColor,
                                    'text-xs h-7 px-2',
                                    groupBOutcome === value ? 'ring-2 ring-offset-1 ring-slate-500' : ''
                                  )}
                                  onClick={() => {
                                    setGroupBOutcome(value)
                                    if (groupError) setGroupError(null)
                                  }}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </DroppableBox>
                      </div>

                      <DragOverlay>
                        {activeDragId ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-800 text-white shadow-lg cursor-grabbing">
                            {activeDogs.find((d) => d.id === activeDragId)?.name ?? ''}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                  {groupError && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {groupError}
                    </p>
                  )}
                </>
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
