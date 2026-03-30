import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { WalkLogSheet } from '@/components/WalkLogSheet'
import { EdgeSheet } from '@/components/EdgeSheet'
import { buildCompatMap, pairKey } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import type { WalkLogEntry, WalkOutcome, Dog, CompatibilityStatus } from '@/types'

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

function WalkLogEntryRow({
  entry,
  dogs,
  compatMap,
  onPairClick,
}: {
  entry: WalkLogEntry
  dogs: Dog[]
  compatMap: Map<string, CompatibilityStatus>
  onPairClick: (idA: string, idB: string, nameA: string, nameB: string, status: CompatibilityStatus) => void
}) {
  const dogNames = entry.dogIds
    .map((id) => dogs.find((d) => d.id === id)?.name ?? 'Unknown')
    .join(', ')

  // Derive group name lists when groupContext is present
  const groupANames = entry.groupContext
    ? entry.groupContext.groupA.map((id) => dogs.find((d) => d.id === id)?.name ?? 'Unknown')
    : null
  const groupBNames = entry.groupContext
    ? entry.groupContext.groupB.map((id) => dogs.find((d) => d.id === id)?.name ?? 'Unknown')
    : null

  const pairs: { idA: string; idB: string; nameA: string; nameB: string; status: CompatibilityStatus; crossGroup: boolean }[] = []
  for (let i = 0; i < entry.dogIds.length; i++) {
    for (let j = i + 1; j < entry.dogIds.length; j++) {
      const idA = entry.dogIds[i]
      const idB = entry.dogIds[j]
      const nameA = dogs.find((d) => d.id === idA)?.name ?? 'Unknown'
      const nameB = dogs.find((d) => d.id === idB)?.name ?? 'Unknown'
      const status = compatMap.get(pairKey(idA, idB)) ?? 'unknown'
      const crossGroup = entry.groupContext
        ? (entry.groupContext.groupA.includes(idA) && entry.groupContext.groupB.includes(idB)) ||
          (entry.groupContext.groupB.includes(idA) && entry.groupContext.groupA.includes(idB))
        : false
      pairs.push({ idA, idB, nameA, nameB, status, crossGroup })
    }
  }

  const crossGroupPairs = pairs.filter((p) => p.crossGroup)
  const intraGroupPairs = pairs.filter((p) => !p.crossGroup)

  function renderPairButton(pair: typeof pairs[0]) {
    return (
      <button
        key={`${pair.idA}-${pair.idB}`}
        onClick={() => onPairClick(pair.idA, pair.idB, pair.nameA, pair.nameB, pair.status)}
        className="inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700"
      >
        {pair.nameA} &amp; {pair.nameB}
      </button>
    )
  }

  const hasPerGroupOutcomes = !!(entry.groupContext?.groupAOutcome || entry.groupContext?.groupBOutcome)

  return (
    <div className="border border-slate-200 rounded-md px-4 py-3 bg-white">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500">{entry.date}</span>
        {/* Show walk-level badge only when no per-group outcomes are present */}
        {!hasPerGroupOutcomes && <OutcomeBadge outcome={entry.outcome} />}
        {entry.groupContext && groupANames && groupBNames ? (
          <span className="text-sm text-slate-700">
            <span className="text-blue-700 font-medium">Group A:</span>{' '}
            {groupANames.join(', ')}
            {entry.groupContext.groupAOutcome && (
              <>{' '}<OutcomeBadge outcome={entry.groupContext.groupAOutcome} /></>
            )}
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-amber-700 font-medium">Group B:</span>{' '}
            {groupBNames.join(', ')}
            {entry.groupContext.groupBOutcome && (
              <>{' '}<OutcomeBadge outcome={entry.groupContext.groupBOutcome} /></>
            )}
          </span>
        ) : (
          <span className="text-sm text-slate-700">{dogNames}</span>
        )}
      </div>
      {entry.notes && (
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{entry.notes}</p>
      )}
      {pairs.length > 0 && entry.groupContext ? (
        <div className="mt-2 space-y-1">
          {crossGroupPairs.length > 0 && (
            <div>
              <span className="text-xs text-slate-400 font-medium mr-1">Cross-group:</span>
              <span className="inline-flex flex-wrap gap-1">
                {crossGroupPairs.map(renderPairButton)}
              </span>
            </div>
          )}
          {intraGroupPairs.length > 0 && (
            <div>
              <span className="text-xs text-slate-400 font-medium mr-1">Within group:</span>
              <span className="inline-flex flex-wrap gap-1">
                {intraGroupPairs.map(renderPairButton)}
              </span>
            </div>
          )}
        </div>
      ) : pairs.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {pairs.map(renderPairButton)}
        </div>
      ) : null}
    </div>
  )
}

export function WalkHistory() {
  const walkHistory = useAppStore((s) => s.walkHistory)
  const dogs = useAppStore((s) => s.dogs)
  const compatibilityEntries = useAppStore((s) => s.compatibilityEntries)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [edgeSheet, setEdgeSheet] = useState<{
    open: boolean; idA: string; idB: string; nameA: string; nameB: string; status: CompatibilityStatus
  }>({ open: false, idA: '', idB: '', nameA: '', nameB: '', status: 'unknown' })

  const compatMap = useMemo(() => buildCompatMap(compatibilityEntries), [compatibilityEntries])
  const sortedEntries = [...walkHistory].sort((a, b) => b.date.localeCompare(a.date))

  function handlePairClick(idA: string, idB: string, nameA: string, nameB: string, status: CompatibilityStatus) {
    setEdgeSheet({ open: true, idA, idB, nameA, nameB, status })
  }

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
            <WalkLogEntryRow
              key={entry.id}
              entry={entry}
              dogs={dogs}
              compatMap={compatMap}
              onPairClick={handlePairClick}
            />
          ))}
        </div>
      )}

      <WalkLogSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <EdgeSheet
        open={edgeSheet.open}
        onOpenChange={(open) => setEdgeSheet((s) => ({ ...s, open }))}
        dogNameA={edgeSheet.nameA}
        dogNameB={edgeSheet.nameB}
        currentStatus={edgeSheet.status}
        onSetStatus={(status) => {
          useAppStore.getState().setCompatibility(edgeSheet.idA, edgeSheet.idB, status)
          setEdgeSheet((s) => ({ ...s, open: false }))
        }}
        onRemove={() => {
          useAppStore.getState().removeCompatibility(edgeSheet.idA, edgeSheet.idB)
          setEdgeSheet((s) => ({ ...s, open: false }))
        }}
      />
    </div>
  )
}
