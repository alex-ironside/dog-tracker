---
phase: quick-fix
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/scoring.ts
  - src/components/CompatibilityGraph.tsx
  - src/components/GroupBuilder.tsx
  - src/components/WalkHistory.tsx
  - src/components/ui/sheet.tsx
  - src/components/CompatibilityGraph.test.tsx
autonomous: true
requirements: [GRAPH-HISTORY, SCORE-HISTORY, PAIR-RELATION-HISTORY, DUPLICATE-CLOSE]

must_haves:
  truths:
    - "Graph shows dashed links between dogs that walked together but have no explicit compatibility entry"
    - "Group scores reflect walk history outcomes when no explicit compatibility is set"
    - "Walk history entries show clickable pair buttons that open EdgeSheet for setting compatibility"
    - "Sheet drawers show only one close button (the custom header one, not a duplicate)"
  artifacts:
    - path: "src/lib/scoring.ts"
      provides: "inferStatusFromHistory function"
      exports: ["inferStatusFromHistory"]
    - path: "src/components/CompatibilityGraph.tsx"
      provides: "History-inferred graph links with dashed style"
      contains: "fromHistory"
    - path: "src/components/GroupBuilder.tsx"
      provides: "compatMap augmented with history-inferred statuses"
      contains: "inferStatusFromHistory"
    - path: "src/components/WalkHistory.tsx"
      provides: "Per-pair EdgeSheet interaction from walk entries"
      contains: "EdgeSheet"
    - path: "src/components/ui/sheet.tsx"
      provides: "SheetContent without built-in close button"
  key_links:
    - from: "src/lib/scoring.ts"
      to: "src/components/CompatibilityGraph.tsx"
      via: "inferStatusFromHistory import"
      pattern: "inferStatusFromHistory"
    - from: "src/lib/scoring.ts"
      to: "src/components/GroupBuilder.tsx"
      via: "inferStatusFromHistory import"
      pattern: "inferStatusFromHistory"
    - from: "src/components/WalkHistory.tsx"
      to: "src/components/EdgeSheet.tsx"
      via: "EdgeSheet component render"
      pattern: "EdgeSheet"
---

<objective>
Fix four bugs/missing features: (1) graph view not showing walk-history-inferred relationships, (2) group compatibility scores defaulting to 25% for dogs with good walk history but no explicit entry, (3) no way to set per-pair compatibility from walk history view, (4) duplicate close button in all sheet drawers.

Purpose: Walk history data should feed into compatibility scoring and graph visualization. Users need a way to set pair compatibility directly from history entries. UI polish for duplicate close buttons.
Output: Updated scoring lib, graph component, group builder, walk history, and sheet component.
</objective>

<execution_context>
@.planning/quick/260329-obb-fix-graph-relations-from-history-fix-com/260329-obb-PLAN.md
</execution_context>

<context>

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/types/index.ts:
```typescript
export type CompatibilityStatus = 'compatible' | 'neutral' | 'conflict' | 'unknown'
export type WalkOutcome = 'great' | 'good' | 'neutral' | 'poor' | 'incident'
export type WalkLogEntry = {
  id: string; date: string; outcome: WalkOutcome; notes: string; dogIds: string[]; groupId?: string
}
export type Dog = { id: string; name: string; breed: string; age: number | null; notes: string; archived: boolean; createdAt: string; updatedAt: string }
export type CompatibilityEntry = { dogIdA: string; dogIdB: string; status: CompatibilityStatus }
```

From src/lib/scoring.ts:
```typescript
export function pairKey(idA: string, idB: string): string
export function buildCompatMap(entries: CompatibilityEntry[]): Map<string, CompatibilityStatus>
export function scoreGroup(dogIds: string[], compatMap: Map<string, CompatibilityStatus>): number
export function getConflictsInGroup(dogIds: string[], compatMap: Map<string, CompatibilityStatus>): ConflictingPair[]
```

From src/components/EdgeSheet.tsx:
```typescript
type EdgeSheetProps = {
  open: boolean; onOpenChange: (open: boolean) => void;
  dogNameA: string; dogNameB: string; currentStatus: CompatibilityStatus;
  onSetStatus: (status: CompatibilityStatus) => void; onRemove: () => void
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add inferStatusFromHistory to scoring lib + augment CompatibilityGraph and GroupBuilder</name>
  <files>src/lib/scoring.ts, src/components/CompatibilityGraph.tsx, src/components/GroupBuilder.tsx, src/components/CompatibilityGraph.test.tsx</files>
  <action>
**1. Add `inferStatusFromHistory` to `src/lib/scoring.ts`:**

```typescript
export function inferStatusFromHistory(
  dogIdA: string,
  dogIdB: string,
  walkHistory: WalkLogEntry[]
): CompatibilityStatus | null {
  const pairWalks = walkHistory.filter(
    (e) => e.dogIds.includes(dogIdA) && e.dogIds.includes(dogIdB)
  )
  if (pairWalks.length === 0) return null
  if (pairWalks.some((e) => e.outcome === 'incident')) return 'conflict'
  if (pairWalks.some((e) => e.outcome === 'poor')) return 'neutral'
  const goodCount = pairWalks.filter(
    (e) => e.outcome === 'great' || e.outcome === 'good'
  ).length
  return goodCount / pairWalks.length >= 0.5 ? 'compatible' : 'neutral'
}
```

Add `import type { WalkLogEntry } from '@/types'` to the imports (add `WalkLogEntry` to existing import).

**2. Augment `src/components/CompatibilityGraph.tsx`:**

- Add `fromHistory?: boolean` to the `GraphLink` type definition (line 9).
- Import `pairKey` and `inferStatusFromHistory` from `@/lib/scoring`.
- Add `const walkHistory = useAppStore((s) => s.walkHistory)` inside `CompatibilityGraph` component.
- Replace the `graphData` useMemo (lines 38-41) with augmented version:

```typescript
const graphData = useMemo(() => {
  const base = buildGraphData(allDogs, compatibilityEntries)
  const explicitPairs = new Set(
    compatibilityEntries.map((e) => pairKey(e.dogIdA, e.dogIdB))
  )
  const activeDogIds = allDogs.filter((d) => !d.archived).map((d) => d.id)
  const historyLinks: GraphLink[] = []
  for (let i = 0; i < activeDogIds.length; i++) {
    for (let j = i + 1; j < activeDogIds.length; j++) {
      const key = pairKey(activeDogIds[i], activeDogIds[j])
      if (!explicitPairs.has(key)) {
        const inferred = inferStatusFromHistory(activeDogIds[i], activeDogIds[j], walkHistory)
        if (inferred) {
          historyLinks.push({
            source: activeDogIds[i],
            target: activeDogIds[j],
            status: inferred,
            fromHistory: true,
          })
        }
      }
    }
  }
  return { nodes: base.nodes, links: [...base.links, ...historyLinks] }
}, [allDogs, compatibilityEntries, walkHistory])
```

- Update `linkLineDash` prop (line 135) to also use dashed `[3, 3]` for history-inferred links:
```typescript
linkLineDash={(link) => {
  const l = link as GraphLink
  if (l.fromHistory) return [3, 3]
  return l.status === 'unknown' ? [5, 5] : []
}}
```

- Do NOT change `buildGraphData` function signature or implementation — it is tested directly.

**3. Augment `src/components/GroupBuilder.tsx`:**

- Add `walkHistory` to the `useShallow` selector destructuring (add `walkHistory: s.walkHistory` to the object).
- Import `inferStatusFromHistory` from `@/lib/scoring` (add to existing import).
- Replace the `compatMap` useMemo (line 120) with augmented version:

```typescript
const compatMap = useMemo(() => {
  const map = buildCompatMap(compatibilityEntries)
  const activeDogIds = dogs.filter((d) => !d.archived).map((d) => d.id)
  for (let i = 0; i < activeDogIds.length; i++) {
    for (let j = i + 1; j < activeDogIds.length; j++) {
      const key = pairKey(activeDogIds[i], activeDogIds[j])
      if (!map.has(key)) {
        const inferred = inferStatusFromHistory(activeDogIds[i], activeDogIds[j], walkHistory)
        if (inferred) map.set(key, inferred)
      }
    }
  }
  return map
}, [compatibilityEntries, dogs, walkHistory])
```

**4. Fix test files:**

In `src/components/CompatibilityGraph.test.tsx`, update the `beforeEach` (line 72) to include `walkHistory: []`:
```typescript
useAppStore.setState({ dogs: [], walkGroups: [], compatibilityEntries: [], walkSessions: [], walkHistory: [] })
```
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npx vitest run src/components/CompatibilityGraph.test.tsx src/components/GroupBuilder.test.tsx 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `inferStatusFromHistory` exported from scoring.ts
    - Graph shows history-inferred links with dashed [3,3] style, distinct from unknown [5,5] and explicit []
    - Explicit entries always take precedence over history inference
    - GroupBuilder compatMap includes history-inferred statuses for pairs without explicit entries
    - All existing CompatibilityGraph and GroupBuilder tests pass
  </done>
</task>

<task type="auto">
  <name>Task 2: Add per-pair EdgeSheet to WalkHistory + remove duplicate close button from sheet.tsx</name>
  <files>src/components/WalkHistory.tsx, src/components/ui/sheet.tsx</files>
  <action>
**1. Remove duplicate close button from `src/components/ui/sheet.tsx`:**

In the `SheetContent` component (lines 54-72), remove the `SheetPrimitive.Close` block (lines 66-69). The resulting SheetContent should render:
```tsx
<SheetPortal>
  <SheetOverlay />
  <SheetPrimitive.Content
    ref={ref}
    className={cn(sheetVariants({ side }), className)}
    {...props}
  >
    {children}
  </SheetPrimitive.Content>
</SheetPortal>
```

Remove the `X` import from `lucide-react` since it is no longer used in this file.

**2. Refactor `src/components/WalkHistory.tsx` to add per-pair EdgeSheet:**

Replace the entire file with the following structure. Keep `OUTCOME_BADGE` and `OutcomeBadge` unchanged.

Add imports:
```typescript
import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { WalkLogSheet } from '@/components/WalkLogSheet'
import { EdgeSheet } from '@/components/EdgeSheet'
import { buildCompatMap, pairKey } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import type { WalkLogEntry, WalkOutcome, Dog, CompatibilityStatus } from '@/types'
```

Refactor `WalkLogEntryRow` to accept props instead of using `useAppStore` directly:
```typescript
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

  const pairs: { idA: string; idB: string; nameA: string; nameB: string; status: CompatibilityStatus }[] = []
  for (let i = 0; i < entry.dogIds.length; i++) {
    for (let j = i + 1; j < entry.dogIds.length; j++) {
      const idA = entry.dogIds[i]
      const idB = entry.dogIds[j]
      const nameA = dogs.find((d) => d.id === idA)?.name ?? 'Unknown'
      const nameB = dogs.find((d) => d.id === idB)?.name ?? 'Unknown'
      const status = compatMap.get(pairKey(idA, idB)) ?? 'unknown'
      pairs.push({ idA, idB, nameA, nameB, status })
    }
  }

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
      {pairs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pairs.map(({ idA, idB, nameA, nameB, status }) => (
            <button
              key={`${idA}-${idB}`}
              onClick={() => onPairClick(idA, idB, nameA, nameB, status)}
              className="text-xs rounded px-2 py-0.5 border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700"
            >
              {nameA} &amp; {nameB}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

Update `WalkHistory` component to manage EdgeSheet state:
```typescript
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
```
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npx vitest run src/components/WalkHistory.test.tsx 2>&1 | tail -20 && npx vitest run 2>&1 | tail -10</automated>
  </verify>
  <done>
    - SheetContent no longer renders a built-in SheetPrimitive.Close — only the custom close buttons in each component remain (one per drawer)
    - Walk history entries with 2+ dogs show clickable pair buttons (e.g., "Rex & Bella")
    - Clicking a pair button opens EdgeSheet with the pair's current compatibility status
    - Setting compatibility via EdgeSheet updates the store
    - All existing WalkHistory tests pass; full test suite passes
  </done>
</task>

</tasks>

<verification>
1. `npx vitest run` — all tests pass
2. `npm run build` — no TypeScript errors
3. Manual: Open graph tab with dogs that have walk history but no explicit compatibility — dashed links appear
4. Manual: Open group builder, add dogs with walk history — scores reflect history (not 25% unknown)
5. Manual: Open walk history, click a pair button on an entry — EdgeSheet opens with correct status
6. Manual: Open any sheet drawer — only one close X button visible (top-right)
</verification>

<success_criteria>
- Walk history data feeds into graph visualization as dashed links for pairs without explicit entries
- Walk history data feeds into group scoring, replacing 25% unknown default with inferred status
- Walk history entries show clickable per-pair buttons that open EdgeSheet
- All sheet drawers have exactly one close button
- All existing tests pass; build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260329-obb-fix-graph-relations-from-history-fix-com/260329-obb-SUMMARY.md`
</output>
