import { useDroppable } from '@dnd-kit/core'
import { SidebarGroupCard } from '@/components/SidebarGroupCard'
import type { WalkGroup } from '@/types'

type GroupSidebarProps = {
  walkGroups: WalkGroup[]
  scheduledGroupIds: Set<string>
}

export function GroupSidebar({ walkGroups, scheduledGroupIds }: GroupSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'group-sidebar' })

  const unscheduledGroups = walkGroups.filter((g) => !scheduledGroupIds.has(g.id))

  return (
    <div
      ref={setNodeRef}
      className={`w-[280px] min-w-[280px] border-r border-slate-200 overflow-y-auto p-4 transition-colors${isOver ? ' bg-slate-100' : ' bg-slate-50'}`}
    >
      <p className='text-sm font-semibold text-slate-700 mb-3'>Groups</p>
      {walkGroups.length === 0 ? (
        <p className='text-sm text-slate-400 px-1 py-2'>
          No groups yet. Create groups in the Groups tab, then drag them here to schedule walks.
        </p>
      ) : unscheduledGroups.length === 0 ? (
        <p className='text-sm text-slate-400 px-1 py-2'>All groups are scheduled this week.</p>
      ) : (
        unscheduledGroups.map((group) => (
          <SidebarGroupCard key={group.id} group={group} />
        ))
      )}
    </div>
  )
}
