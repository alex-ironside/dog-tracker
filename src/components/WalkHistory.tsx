import { useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { WalkLogSheet } from '@/components/WalkLogSheet'
import { cn } from '@/lib/utils'
import type { WalkLogEntry, WalkOutcome } from '@/types'

const OUTCOME_BADGE: Record<WalkOutcome, { bg: string; text: string; label: string }> = {
  great:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Great' },
  good:     { bg: 'bg-teal-100',   text: 'text-teal-700',   label: 'Good' },
  neutral:  { bg: 'bg-slate-100',  text: 'text-slate-600',  label: 'Neutral' },
  poor:     { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Poor' },
  incident: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Incident' },
}

function OutcomeBadge({ outcome }: { outcome: WalkOutcome }) {
  const badge = OUTCOME_BADGE[outcome]
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', badge.bg, badge.text)}>
      {badge.label}
    </span>
  )
}

function WalkLogEntryRow({ entry }: { entry: WalkLogEntry }) {
  const dogs = useAppStore((s) => s.dogs)

  const dogNames = entry.dogIds
    .map((id) => {
      const dog = dogs.find((d) => d.id === id)
      return dog ? dog.name : 'Unknown'
    })
    .join(', ')

  return (
    <div className="border border-slate-200 rounded-md px-4 py-3 bg-white">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500">{entry.date}</span>
        <OutcomeBadge outcome={entry.outcome} />
        <span className="text-sm text-slate-700">{dogNames}</span>
      </div>
      {entry.notes && (
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{entry.notes}</p>
      )}
    </div>
  )
}

export function WalkHistory() {
  const walkHistory = useAppStore((s) => s.walkHistory)
  const [sheetOpen, setSheetOpen] = useState(false)

  const sortedEntries = [...walkHistory].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Walk History</h2>
        <Button variant="default" onClick={() => setSheetOpen(true)}>
          Log a walk
        </Button>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-slate-900">No walks logged yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Log your first walk to start tracking outcomes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEntries.map((entry) => (
            <WalkLogEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <WalkLogSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
