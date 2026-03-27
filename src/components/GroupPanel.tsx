import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MiniDogCard } from '@/components/MiniDogCard'
import type { Dog, WalkGroup } from '@/types'

type GroupPanelProps = {
  group: WalkGroup
  dogs: Dog[]
  onRename: (name: string) => void
  onDelete: () => void
  onRemoveDog: (dogId: string) => void
  score: number
  hasConflicts: boolean
}

function scoreBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700'
  if (score >= 50) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export function GroupPanel({ group, dogs, onRename, onDelete, onRemoveDog, score, hasConflicts }: GroupPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })
  const containerRef = useRef<HTMLDivElement>(null)

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
      className={`border border-slate-200 rounded-xl bg-white shadow-sm${isOver ? ' ring-2 ring-primary' : ''}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl'>
        <div className='flex items-center gap-2'>
          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              className='text-sm font-semibold text-slate-900 bg-transparent border border-slate-300 rounded px-1 min-w-[120px] max-w-[240px]'
            />
          ) : (
            <span
              className='text-sm font-semibold text-slate-900 cursor-pointer'
              onClick={handleNameClick}
            >
              {group.name}
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${scoreBadgeClasses(score)}`}>
            Score: {score}
          </span>
          {hasConflicts && (
            <AlertTriangle size={14} className='text-amber-500' />
          )}
        </div>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`Delete ${group.name}`}
          onClick={onDelete}
        >
          <Trash2 size={14} className='text-destructive' />
        </Button>
      </div>

      {/* Body */}
      <div ref={containerRef} className='px-4 py-3 min-h-[64px] relative'>
        {dogs.length === 0 ? (
          <div className='border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center py-4'>
            <span className='text-sm text-slate-400'>Drop a dog here</span>
          </div>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {dogs.map((dog) => (
              <MiniDogCard
                key={dog.id}
                dogName={dog.name}
                onRemove={() => onRemoveDog(dog.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
