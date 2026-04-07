import { useDraggable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import type { WalkGroup } from '@/types'

type SidebarGroupCardProps = {
  group: WalkGroup
}

export function SidebarGroupCard({ group }: SidebarGroupCardProps) {
  const { t } = useTranslation()
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: group.id,
    data: { type: 'group', groupId: group.id },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-3 py-2 rounded-md bg-card border border-border text-sm text-foreground shadow-sm cursor-grab mb-2${isDragging ? ' opacity-50' : ''}`}
    >
      {group.name} • {t('calendar.dogs', { count: group.dogIds.length })}
    </div>
  )
}
