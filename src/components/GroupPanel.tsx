import { useState, useRef, useLayoutEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MiniDogCard } from '@/components/MiniDogCard'
import { ConflictOverlay, computeConflictLines } from '@/components/ConflictOverlay'
import type { ConflictLine } from '@/components/ConflictOverlay'
import type { Dog, WalkGroup } from '@/types'

type GroupPanelProps = {
  group: WalkGroup
  dogs: Dog[]
  onRename: (name: string) => void
  onDelete: () => void
  onRemoveDog: (dogId: string) => void
  score: number
  hasConflicts: boolean
  conflicts: Array<{ idA: string; idB: string; status: 'conflict' | 'unknown' }>
  onConflictClick: (idA: string, idB: string) => void
}

function scoreBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-accent/20 text-accent'
  if (score >= 50) return 'bg-primary/15 text-primary'
  return 'bg-destructive/15 text-destructive'
}

export function GroupPanel({ group, dogs, onRename, onDelete, onRemoveDog, score, hasConflicts, conflicts, onConflictClick }: GroupPanelProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: group.id })
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())

  const [conflictLines, setConflictLines] = useState<ConflictLine[]>([])

  // Compute SVG line positions in useLayoutEffect — containerRef is guaranteed set here
  // (GroupPanel owns containerRef, so it's set before this layout effect fires)
  useLayoutEffect(() => {
    setConflictLines(computeConflictLines(conflicts, cardRefs, containerRef))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(conflicts), dogs.length])

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(group.name)

  function handleNameClick() {
    setEditValue(group.name)
    setIsEditing(true)
  }

  function commitRename() {
    if (editValue.trim()) {
      onRename(editValue.trim())
    } else {
      setEditValue(group.name)
    }
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitRename()
    } else if (e.key === 'Escape') {
      setEditValue(group.name)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`border border-border rounded-xl bg-card shadow-sm${isOver ? ' ring-2 ring-primary' : ''}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 rounded-t-xl'>
        <div className='flex items-center gap-2'>
          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              className='text-sm font-semibold text-foreground bg-transparent border border-border rounded px-1 min-w-[120px] max-w-[240px]'
            />
          ) : (
            <span
              className='text-sm font-semibold text-foreground cursor-pointer'
              onClick={handleNameClick}
            >
              {group.name}
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${scoreBadgeClasses(score)}`}>
            Score: {score}
          </span>
          {hasConflicts && (
            <AlertTriangle size={14} className='text-primary' />
          )}
        </div>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('groups.deleteGroupAria', { name: group.name, defaultValue: `Delete ${group.name}` })}
          onClick={onDelete}
        >
          <Trash2 size={14} className='text-destructive' />
        </Button>
      </div>

      {/* Body */}
      <div
        ref={containerRef}
        data-testid='group-body'
        className='px-4 py-3 min-h-[64px] relative'
      >
        {dogs.length === 0 ? (
          <div className='border-2 border-dashed border-border rounded-lg flex items-center justify-center py-4'>
            <span className='text-sm text-muted-foreground/70'>{t('groups.dropDogHere')}</span>
          </div>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {dogs.map((dog) => (
              <div
                key={dog.id}
                data-card-id={dog.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(dog.id, el)
                  else cardRefs.current.delete(dog.id)
                }}
              >
                <MiniDogCard
                  groupId={group.id}
                  dogId={dog.id}
                  dogName={dog.name}
                  onRemove={() => onRemoveDog(dog.id)}
                />
              </div>
            ))}
          </div>
        )}
        {conflictLines.length > 0 && (
          <ConflictOverlay
            lines={conflictLines}
            onConflictClick={onConflictClick}
          />
        )}
      </div>
    </div>
  )
}
