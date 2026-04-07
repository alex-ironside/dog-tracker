import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { SidebarGroupCard } from '@/components/SidebarGroupCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store'
import type { WalkGroup, CompatibilityStatus } from '@/types'

type GroupSidebarProps = {
  walkGroups: WalkGroup[]
  scheduledGroupIds: Set<string>
  compatMap: Map<string, CompatibilityStatus>
}

export function GroupSidebar({ walkGroups, scheduledGroupIds, compatMap }: GroupSidebarProps) {
  const { t } = useTranslation()
  const addGroup = useAppStore((s) => s.addGroup)
  const { setNodeRef, isOver } = useDroppable({ id: 'group-sidebar' })
  const [name, setName] = useState('')

  const unscheduledGroups = walkGroups.filter((g) => !scheduledGroupIds.has(g.id))

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    addGroup(trimmed)
    setName('')
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-[280px] min-w-[280px] border-r border-border overflow-y-auto p-4 transition-colors${isOver ? ' bg-muted' : ' bg-muted/50'}`}
    >
      <p className='text-sm font-semibold text-foreground/90 mb-3'>{t('nav.groups')}</p>

      <div className='flex gap-2 mb-3'>
        <Input
          type='text'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder={t('groups.newGroup')}
          aria-label={t('groups.groupName')}
          className='h-8 text-xs'
        />
        <Button
          type='button'
          size='sm'
          onClick={handleAdd}
          disabled={!name.trim()}
          className='h-8 px-2 text-xs'
        >
          {t('groups.addGroup')}
        </Button>
      </div>

      {walkGroups.length === 0 ? (
        <p className='text-sm text-muted-foreground/70 px-1 py-2'>
          {t('groups.sidebarEmpty', { defaultValue: 'No groups yet. Create groups in the Groups tab, then drag them here to schedule walks.' })}
        </p>
      ) : unscheduledGroups.length === 0 ? (
        <p className='text-sm text-muted-foreground/70 px-1 py-2'>{t('groups.allScheduled', { defaultValue: 'All groups are scheduled this week.' })}</p>
      ) : (
        unscheduledGroups.map((group) => (
          <SidebarGroupCard key={group.id} group={group} compatMap={compatMap} />
        ))
      )}
    </div>
  )
}
