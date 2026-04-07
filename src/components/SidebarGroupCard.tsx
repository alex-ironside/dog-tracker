import { useDraggable } from '@dnd-kit/core'
import type { WalkGroup } from '@/types'

type SidebarGroupCardProps = {
  group: WalkGroup
}

export function SidebarGroupCard({ group }: SidebarGroupCardProps) {
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
      {group.name} • {group.dogIds.length} dogs
    </div>
  )
}
