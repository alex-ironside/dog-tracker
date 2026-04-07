import { useState, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store'
import { Input } from '@/components/ui/input'
import { scoreGroup, getConflictsInGroup } from '@/lib/scoring'
import type { WalkGroup, CompatibilityStatus } from '@/types'

type SidebarGroupCardProps = {
  group: WalkGroup
  compatMap: Map<string, CompatibilityStatus>
}

function scoreBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-accent/20 text-accent'
  if (score >= 50) return 'bg-primary/15 text-primary'
  return 'bg-destructive/15 text-destructive'
}

export function SidebarGroupCard({ group, compatMap }: SidebarGroupCardProps) {
  const { t } = useTranslation()
  const dogs = useAppStore((s) => s.dogs)
  const addDogToGroup = useAppStore((s) => s.addDogToGroup)
  const removeDogFromGroup = useAppStore((s) => s.removeDogFromGroup)

  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')

  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: group.id,
    data: { type: 'group', groupId: group.id },
  })

  const groupDogs = useMemo(
    () => group.dogIds.map((id) => dogs.find((d) => d.id === id)).filter((d): d is NonNullable<typeof d> => !!d),
    [group.dogIds, dogs]
  )

  const score = useMemo(() => scoreGroup(group.dogIds, compatMap), [group.dogIds, compatMap])
  const hasConflicts = useMemo(
    () => getConflictsInGroup(group.dogIds, compatMap).some((c) => c.status === 'conflict'),
    [group.dogIds, compatMap]
  )

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return dogs
      .filter((d) => !d.archived && !group.dogIds.includes(d.id))
      .filter((d) => !q || d.name.toLowerCase().includes(q))
  }, [dogs, group.dogIds, query])

  return (
    <div className={`rounded-md bg-card border border-border text-sm text-foreground shadow-sm mb-2${isDragging ? ' opacity-50' : ''}`}>
      <div className='flex items-stretch'>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className='flex-1 px-3 py-2 cursor-grab min-w-0'
        >
          <div className='truncate'>{group.name}</div>
          <div className='text-xs text-muted-foreground flex items-center gap-1.5'>
            <span>{t('calendar.dogs', { count: group.dogIds.length })}</span>
            {group.dogIds.length >= 2 && (
              <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium ${scoreBadgeClasses(score)}`}>
                {score}
              </span>
            )}
            {hasConflicts && <AlertTriangle size={11} className='text-primary' />}
          </div>
        </div>
        <button
          type='button'
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className='px-2 text-muted-foreground hover:text-foreground border-l border-border/60'
        >
          {expanded ? '▾' : '▸'}
        </button>
      </div>

      {expanded && (
        <div className='border-t border-border/60 p-2 space-y-2'>
          {groupDogs.length > 0 && (
            <ul className='space-y-1'>
              {groupDogs.map((d) => (
                <li key={d.id} className='flex items-center justify-between gap-2 px-2 py-1 rounded bg-muted/40'>
                  <span className='truncate text-xs'>{d.name}</span>
                  <button
                    type='button'
                    onClick={() => removeDogFromGroup(group.id, d.id)}
                    aria-label={t('groups.removeDogAria', { name: d.name })}
                    className='text-muted-foreground hover:text-destructive text-xs px-1'
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('picker.searchPlaceholder')}
            aria-label={t('picker.searchPlaceholder')}
            className='h-8 text-xs'
          />

          {candidates.length === 0 ? (
            <p className='text-xs text-muted-foreground/70 px-1'>
              {query ? t('picker.noMatches') : t('groups.noActiveDogs')}
            </p>
          ) : (
            <ul className='max-h-40 overflow-y-auto space-y-1'>
              {candidates.map((d) => (
                <li key={d.id}>
                  <button
                    type='button'
                    onClick={() => addDogToGroup(group.id, d.id)}
                    className='w-full text-left text-xs px-2 py-1 rounded hover:bg-muted/60'
                  >
                    + {d.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
