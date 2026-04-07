import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Input } from '@/components/ui/input'
import { RosterRow } from '@/components/RosterRow'
import { useDogSearch, DogSearchInput } from '@/components/SearchableDogPicker'
import { GroupPanel } from '@/components/GroupPanel'
import { EdgeSheet } from '@/components/EdgeSheet'
import { useAppStore } from '@/store'
import { scoreGroup, getConflictsInGroup, buildCompatMap, pairKey, inferStatusFromHistory } from '@/lib/scoring'

function RosterPanel() {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: 'roster' })
  const dogs = useAppStore((s) => s.dogs)
  const walkGroups = useAppStore((s) => s.walkGroups)

  const activeDogs = dogs.filter((d) => !d.archived)
  const { query, setQuery, filtered } = useDogSearch(activeDogs)

  const [addMode, setAddMode] = useState(false)
  const [newDogName, setNewDogName] = useState('')

  function handleAddDog() {
    const trimmed = newDogName.trim()
    if (!trimmed) return
    useAppStore.getState().addDog({ name: trimmed, breed: '', age: null, notes: '' })
    setNewDogName('')
    setAddMode(false)
    setQuery('')
  }

  function cancelAddDog() {
    setNewDogName('')
    setAddMode(false)
  }

  // Build dogId -> group names list
  const dogGroupsMap = new Map<string, string[]>()
  for (const group of walkGroups) {
    for (const dogId of group.dogIds) {
      const list = dogGroupsMap.get(dogId) ?? []
      list.push(group.name)
      dogGroupsMap.set(dogId, list)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-[280px] min-w-[280px] border-r border-border overflow-y-auto p-4 transition-colors${isOver ? ' bg-muted' : ' bg-muted/50'}`}
    >
      <p className='text-sm font-semibold text-foreground/90 mb-3'>{t('groups.availableDogs')}</p>
      <div className='mb-3'>
        {!addMode ? (
          <Button type='button' variant='outline' size='sm' onClick={() => setAddMode(true)}>
            {t('walkLog.addNewDog')}
          </Button>
        ) : (
          <div className='flex items-center gap-2'>
            <Input
              value={newDogName}
              onChange={(e) => setNewDogName(e.target.value)}
              placeholder={t('walkLog.newDogNamePlaceholder')}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddDog()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  cancelAddDog()
                }
              }}
              className='h-8'
            />
            <Button type='button' size='sm' onClick={handleAddDog} disabled={!newDogName.trim()}>
              {t('walkLog.saveNewDog')}
            </Button>
            <Button type='button' variant='outline' size='sm' onClick={cancelAddDog}>
              {t('walkLog.cancelNewDog')}
            </Button>
          </div>
        )}
      </div>
      {activeDogs.length > 0 && (
        <DogSearchInput value={query} onChange={setQuery} className='mb-3' />
      )}
      {activeDogs.length === 0 ? (
        <p className='text-sm text-muted-foreground/70 px-3 py-4'>{t('groups.noActiveDogs')}</p>
      ) : filtered.length === 0 && query ? (
        <p className='text-sm text-muted-foreground/70 px-3 py-4'>{t('picker.noMatches')}</p>
      ) : (
        filtered.map((dog) => {
          const groupNames = dogGroupsMap.get(dog.id) ?? []
          // Key includes assignment count so dnd-kit remounts the draggable
          // after group membership changes — avoids stale pointer state.
          return (
            <RosterRow
              key={`${dog.id}:${groupNames.length}`}
              dog={dog}
              assignedGroupNames={groupNames}
            />
          )
        })
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
  const { t } = useTranslation()
  const { dogs, walkGroups, compatibilityEntries, walkHistory, addGroup, renameGroup, deleteGroup, addDogToGroup, removeDogFromGroup, setCompatibility, removeCompatibility } = useAppStore(
    useShallow((s) => ({
      dogs: s.dogs,
      walkGroups: s.walkGroups,
      compatibilityEntries: s.compatibilityEntries,
      walkHistory: s.walkHistory,
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
      // drag-back to roster: remove dog from all groups it's in (GROUP-05)
      for (const group of walkGroups) {
        if (group.dogIds.includes(dogId)) {
          removeDogFromGroup(group.id, dogId)
        }
      }
    } else {
      // drop onto a group: add dog to that group (GROUP-02 handled inside addDogToGroup)
      addDogToGroup(overId, dogId)
    }
  }

  const compatMap = useMemo(() => {
    const map = buildCompatMap(compatibilityEntries)
    const activeDogIds = dogs.filter((d) => !d.archived).map((d) => d.id)
    for (let i = 0; i < activeDogIds.length; i++) {
      for (let j = i + 1; j < activeDogIds.length; j++) {
        const key = pairKey(activeDogIds[i], activeDogIds[j])
        if (!map.has(key)) {
          const inferred = inferStatusFromHistory(activeDogIds[i], activeDogIds[j], walkHistory)
          if (inferred) map.set(key, inferred)
        }
      }
    }
    return map
  }, [compatibilityEntries, dogs, walkHistory])

  return (
    <>
      <header className='mb-6'>
        <h1 className='font-display text-4xl font-semibold tracking-tight text-foreground'>{t('nav.groups')}</h1>
        <p className='text-sm text-muted-foreground mt-1'>{t('groups.builderTagline')}</p>
      </header>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className='flex h-[600px] rounded-2xl border border-border overflow-hidden'>
          {/* Left panel: roster */}
          <RosterPanel />

          {/* Right panel: groups */}
          <div className='flex-1 overflow-y-auto bg-card p-4 flex flex-col gap-4'>
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
            <div className='px-3 py-2 rounded-md bg-card shadow-lg opacity-70 text-sm'>
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
