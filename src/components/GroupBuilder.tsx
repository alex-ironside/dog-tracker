import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { RosterRow } from '@/components/RosterRow'
import { GroupPanel } from '@/components/GroupPanel'
import { EdgeSheet } from '@/components/EdgeSheet'
import { useAppStore } from '@/store'
import { scoreGroup, getConflictsInGroup, buildCompatMap, pairKey } from '@/lib/scoring'

function RosterPanel() {
  const { setNodeRef, isOver } = useDroppable({ id: 'roster' })
  const dogs = useAppStore((s) => s.dogs)
  const walkGroups = useAppStore((s) => s.walkGroups)

  const activeDogs = dogs.filter((d) => !d.archived)

  // Build dogId -> groupName map
  const dogGroupMap = new Map<string, string>()
  for (const group of walkGroups) {
    for (const dogId of group.dogIds) {
      dogGroupMap.set(dogId, group.name)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-[280px] min-w-[280px] border-r border-slate-200 overflow-y-auto p-4 transition-colors${isOver ? ' bg-slate-100' : ' bg-slate-50'}`}
    >
      <p className='text-sm font-semibold text-slate-700 mb-3'>Available Dogs</p>
      {activeDogs.length === 0 ? (
        <p className='text-sm text-slate-400 px-3 py-4'>No active dogs. Add dogs in the Dogs tab.</p>
      ) : (
        activeDogs.map((dog) => (
          <RosterRow
            key={dog.id}
            dog={dog}
            assignedGroupName={dogGroupMap.get(dog.id) ?? null}
          />
        ))
      )}
    </div>
  )
}

type EdgeSheetState = {
  open: boolean
  dogIdA: string
  dogIdB: string
}

export function GroupBuilder() {
  const { dogs, walkGroups, compatibilityEntries, addGroup, renameGroup, deleteGroup, addDogToGroup, removeDogFromGroup, setCompatibility, removeCompatibility } = useAppStore(
    useShallow((s) => ({
      dogs: s.dogs,
      walkGroups: s.walkGroups,
      compatibilityEntries: s.compatibilityEntries,
      addGroup: s.addGroup,
      renameGroup: s.renameGroup,
      deleteGroup: s.deleteGroup,
      addDogToGroup: s.addDogToGroup,
      removeDogFromGroup: s.removeDogFromGroup,
      setCompatibility: s.setCompatibility,
      removeCompatibility: s.removeCompatibility,
    }))
  )

  const activeDogs = dogs.filter((d) => !d.archived)

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [edgeSheetState, setEdgeSheetState] = useState<EdgeSheetState | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // Auto-create group on mount (D-06)
  useEffect(() => {
    if (useAppStore.getState().walkGroups.length === 0) {
      useAppStore.getState().addGroup('Group 1')
    }
  }, [])

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const dogId = event.active.id as string
    const over = event.over

    if (!over) return

    const overId = over.id as string

    if (overId === 'roster') {
      // drag-back to roster: remove dog from its group (GROUP-05)
      const group = walkGroups.find((g) => g.dogIds.includes(dogId))
      if (group) {
        removeDogFromGroup(group.id, dogId)
      }
    } else {
      // drop onto a group: add dog to that group (GROUP-02 handled inside addDogToGroup)
      addDogToGroup(overId, dogId)
    }
  }

  const compatMap = useMemo(() => buildCompatMap(compatibilityEntries), [compatibilityEntries])

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className='flex h-full'>
          {/* Left panel: roster */}
          <RosterPanel />

          {/* Right panel: groups */}
          <div className='flex-1 overflow-y-auto bg-white p-4 flex flex-col gap-4'>
            <Button
              variant='outline'
              className='self-start'
              onClick={() => addGroup(`Group ${walkGroups.length + 1}`)}
            >
              + Add Group
            </Button>

            {walkGroups.map((group) => {
              const groupDogs = group.dogIds
                .map((id) => activeDogs.find((d) => d.id === id))
                .filter((d): d is NonNullable<typeof d> => d != null)

              const score = scoreGroup(group.dogIds, compatMap)
              const conflicts = getConflictsInGroup(group.dogIds, compatMap)
              const hasConflicts = conflicts.some((c) => c.status === 'conflict')

              return (
                <GroupPanel
                  key={group.id}
                  group={group}
                  dogs={groupDogs}
                  onRename={(name) => renameGroup(group.id, name)}
                  onDelete={() => deleteGroup(group.id)}
                  onRemoveDog={(dogId) => removeDogFromGroup(group.id, dogId)}
                  score={score}
                  hasConflicts={hasConflicts}
                  conflicts={conflicts}
                  onConflictClick={(idA, idB) => setEdgeSheetState({ open: true, dogIdA: idA, dogIdB: idB })}
                />
              )
            })}
          </div>
        </div>

        <DragOverlay>
          {activeDragId ? (
            <div className='px-3 py-2 rounded-md bg-white shadow-lg opacity-70 text-sm'>
              {activeDogs.find((d) => d.id === activeDragId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {edgeSheetState && (
        <EdgeSheet
          open={edgeSheetState.open}
          onOpenChange={(open) => {
            if (!open) setEdgeSheetState(null)
          }}
          dogNameA={dogs.find((d) => d.id === edgeSheetState.dogIdA)?.name ?? ''}
          dogNameB={dogs.find((d) => d.id === edgeSheetState.dogIdB)?.name ?? ''}
          currentStatus={compatMap.get(pairKey(edgeSheetState.dogIdA, edgeSheetState.dogIdB)) ?? 'unknown'}
          onSetStatus={(status) => {
            setCompatibility(edgeSheetState.dogIdA, edgeSheetState.dogIdB, status)
            setEdgeSheetState(null)
          }}
          onRemove={() => {
            removeCompatibility(edgeSheetState.dogIdA, edgeSheetState.dogIdB)
            setEdgeSheetState(null)
          }}
        />
      )}
    </>
  )
}
