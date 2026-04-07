import { useState, useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { WalkLogSheet } from '@/components/WalkLogSheet'
import { EdgeSheet } from '@/components/EdgeSheet'
import { buildCompatMap, pairKey } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import type { WalkLogEntry, WalkOutcome, Dog, CompatibilityStatus } from '@/types'

const OUTCOME_BADGE: Record<WalkOutcome, { bg: string; text: string; label: string }> = {
  great:    { bg: 'bg-accent/20',  text: 'text-accent',  label: 'Great' },
  good:     { bg: 'bg-accent/15',   text: 'text-accent',   label: 'Good' },
  neutral:  { bg: 'bg-muted',  text: 'text-muted-foreground',  label: 'Neutral' },
  poor:     { bg: 'bg-primary/15',  text: 'text-primary',  label: 'Poor' },
  incident: { bg: 'bg-destructive/15',    text: 'text-destructive',    label: 'Incident' },
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
  onEdit,
  onDelete,
}: {
  entry: WalkLogEntry
  dogs: Dog[]
  compatMap: Map<string, CompatibilityStatus>
  onPairClick: (idA: string, idB: string, nameA: string, nameB: string, status: CompatibilityStatus) => void
  onEdit: (entry: WalkLogEntry) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
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
        className="inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 border border-border hover:border-foreground/40 bg-muted/50 hover:bg-muted text-foreground/80"
      >
        {pair.nameA} &amp; {pair.nameB}
      </button>
    )
  }

  const hasGroupOutcome = !!entry.groupContext?.groupOutcome

  return (
    <div className="border border-border rounded-md px-4 py-3 bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap flex-1">
        <span className="text-sm text-muted-foreground">{entry.date}</span>
        {/* Show walk-level badge when no group encounter outcome is present */}
        {!hasGroupOutcome && <OutcomeBadge outcome={entry.outcome} />}
        {entry.groupContext && groupANames && groupBNames ? (
          <span className="text-sm text-foreground/80">
            {hasGroupOutcome && (
              <>{' '}<OutcomeBadge outcome={entry.groupContext.groupOutcome!} />{' '}</>
            )}
            <span className="text-foreground font-medium">{t('history.groupALabel')}</span>{' '}
            {groupANames.join(', ')}
            <span className="mx-2 text-muted-foreground/50">|</span>
            <span className="text-primary font-medium">{t('history.groupBLabel')}</span>{' '}
            {groupBNames.join(', ')}
          </span>
        ) : (
          <span className="text-sm text-foreground/80">{dogNames}</span>
        )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-1 rounded text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted"
            aria-label={t('history.editWalkAria')}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1 rounded text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10"
            aria-label={t('history.deleteWalkAria')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {entry.notes && (
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.notes}</p>
      )}
      {pairs.length > 0 && entry.groupContext ? (
        <div className="mt-2 space-y-1">
          {crossGroupPairs.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground/70 font-medium mr-1">{t('history.crossGroup')}</span>
              <span className="inline-flex flex-wrap gap-1">
                {crossGroupPairs.map(renderPairButton)}
              </span>
            </div>
          )}
          {intraGroupPairs.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground/70 font-medium mr-1">{t('history.withinGroup')}</span>
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
  const { t } = useTranslation()
  const walkHistory = useAppStore((s) => s.walkHistory)
  const dogs = useAppStore((s) => s.dogs)
  const compatibilityEntries = useAppStore((s) => s.compatibilityEntries)
  const deleteWalkLog = useAppStore((s) => s.deleteWalkLog)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<WalkLogEntry | undefined>(undefined)
  const [edgeSheet, setEdgeSheet] = useState<{
    open: boolean; idA: string; idB: string; nameA: string; nameB: string; status: CompatibilityStatus
  }>({ open: false, idA: '', idB: '', nameA: '', nameB: '', status: 'unknown' })

  const compatMap = useMemo(() => buildCompatMap(compatibilityEntries), [compatibilityEntries])
  const sortedEntries = [...walkHistory].sort((a, b) => b.date.localeCompare(a.date))

  function handlePairClick(idA: string, idB: string, nameA: string, nameB: string, status: CompatibilityStatus) {
    setEdgeSheet({ open: true, idA, idB, nameA, nameB, status })
  }

  function handleEdit(entry: WalkLogEntry) {
    setEditEntry(entry)
    setSheetOpen(true)
  }

  function handleDelete(id: string) {
    if (confirm('Delete this walk log?')) {
      deleteWalkLog(id)
    }
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open)
    if (!open) setEditEntry(undefined)
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t('history.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('history.subtitle')}</p>
        </div>
        <Button variant="default" size="lg" onClick={() => { setEditEntry(undefined); setSheetOpen(true) }} className="shadow-sm">
          {t('history.logWalk')}
        </Button>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-foreground">{t('history.empty')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('history.emptyBody')}
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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <WalkLogSheet open={sheetOpen} onOpenChange={handleSheetOpenChange} editEntry={editEntry} />

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
