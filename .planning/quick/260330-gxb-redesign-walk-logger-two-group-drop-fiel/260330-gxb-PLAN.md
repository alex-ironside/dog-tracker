---
phase: quick-260330-gxb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/types/index.ts
  - src/components/WalkLogSheet.tsx
  - src/lib/scoring.ts
  - src/components/WalkHistory.tsx
autonomous: true
requirements: [REDESIGN-GROUPS-UI, REMOVE-PAIR-OUTCOMES, PER-GROUP-OUTCOMES]

must_haves:
  truths:
    - "In Two groups mode, user sees a pool of unassigned dogs and two group boxes (A blue, B amber) instead of a 3-column A/B button table"
    - "Each group box has its own independent outcome selector; walk-level Outcome field is hidden in groups mode"
    - "Per-pair outcomes section is completely removed from all modes"
    - "All together mode is unchanged — checkbox list + single walk-level outcome"
    - "Saved walk log entry in groups mode contains groupAOutcome and groupBOutcome in groupContext, no pairOutcomes field"
    - "Walk history displays per-group outcome badges next to Group A / Group B labels"
    - "scoring.ts inferGroupContextConflicts works with per-group outcomes instead of pairOutcomes"
  artifacts:
    - path: "src/types/index.ts"
      provides: "GroupContext with groupAOutcome/groupBOutcome fields"
      contains: "groupAOutcome"
    - path: "src/components/WalkLogSheet.tsx"
      provides: "Redesigned two-groups UI with pool + group boxes + per-group outcomes"
      contains: "groupAOutcome"
    - path: "src/lib/scoring.ts"
      provides: "Updated inferGroupContextConflicts using per-group outcomes"
      contains: "groupAOutcome"
    - path: "src/components/WalkHistory.tsx"
      provides: "Per-group outcome badges in history display"
      contains: "groupAOutcome"
  key_links:
    - from: "src/components/WalkLogSheet.tsx"
      to: "src/types/index.ts"
      via: "GroupContext type with groupAOutcome/groupBOutcome"
      pattern: "groupAOutcome.*groupBOutcome"
    - from: "src/components/WalkLogSheet.tsx"
      to: "store.addWalkLog"
      via: "save handler passes groupContext with per-group outcomes"
      pattern: "groupAOutcome.*groupBOutcome"
    - from: "src/lib/scoring.ts"
      to: "src/types/index.ts"
      via: "inferGroupContextConflicts reads groupAOutcome/groupBOutcome from GroupContext"
      pattern: "entry\\.groupContext"
---

<objective>
Redesign WalkLogSheet two-groups mode: replace A/B button table with pool + two group boxes, add per-group outcome selectors, remove per-pair outcomes entirely, update scoring and history display.

Purpose: Dogs sometimes behave fine in pairs but a third dog causes fights. Per-group outcomes (instead of per-pair) capture sub-group-level behavior more naturally and with less friction than clicking through every pair combination.

Output: Updated WalkLogSheet UI, GroupContext type with per-group outcomes, scoring logic using group outcomes, history display with per-group badges.
</objective>

<execution_context>
@.claude/get-shit-done/workflows/execute-plan.md
@.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260330-gxb-redesign-walk-logger-two-group-drop-fiel/260330-gxb-CONTEXT.md
@.planning/quick/260330-gxb-redesign-walk-logger-two-group-drop-fiel/260330-gxb-RESEARCH.md
@src/types/index.ts
@src/components/WalkLogSheet.tsx
@src/lib/scoring.ts
@src/components/WalkHistory.tsx

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/types/index.ts:
```typescript
export type WalkOutcome = 'great' | 'good' | 'neutral' | 'poor' | 'incident'

export type GroupContext = {
  groupA: string[]
  groupB: string[]
}

export type WalkLogEntry = {
  id: string
  date: string
  outcome: WalkOutcome
  notes: string
  dogIds: string[]
  groupId?: string
  pairOutcomes?: Record<string, WalkOutcome>
  groupContext?: GroupContext
}
```

From src/lib/scoring.ts:
```typescript
export function pairKey(idA: string, idB: string): string
export function inferStatusFromHistory(dogIdA: string, dogIdB: string, walkHistory: WalkLogEntry[]): CompatibilityStatus | null
export function inferGroupContextConflicts(walkHistory: WalkLogEntry[]): { triggerIds: string[]; targetId: string; status: CompatibilityStatus }[]
```

From src/components/WalkLogSheet.tsx:
```typescript
const OUTCOME_OPTIONS: { value: WalkOutcome; label: string; textColor: string }[]
// Existing state: groupAssignments Record<string, 'A' | 'B' | null>, groupA/groupB derived via useMemo
// Existing handler: handleGroupAssign(dogId, group) — toggles assignment
```

From src/components/WalkHistory.tsx:
```typescript
function OutcomeBadge({ outcome }: { outcome: WalkOutcome })
// Used in WalkLogEntryRow to display walk outcome
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Type changes and remove pairOutcomes from WalkLogSheet + scoring</name>
  <files>src/types/index.ts, src/components/WalkLogSheet.tsx, src/lib/scoring.ts</files>
  <action>
**1. src/types/index.ts — Extend GroupContext, remove pairOutcomes:**

Update `GroupContext` to add optional per-group outcome fields:
```typescript
export type GroupContext = {
  groupA: string[]
  groupB: string[]
  groupAOutcome?: WalkOutcome
  groupBOutcome?: WalkOutcome
}
```

Remove `pairOutcomes` from `WalkLogEntry`:
```typescript
export type WalkLogEntry = {
  id: string
  date: string
  outcome: WalkOutcome
  notes: string
  dogIds: string[]
  groupId?: string
  groupContext?: GroupContext
}
```

No schema migration needed — `pairOutcomes` was optional; existing persisted records with it are fine (TypeScript ignores extra JSON keys at runtime).

**2. src/components/WalkLogSheet.tsx — Redesign two-groups mode:**

**Remove** these items entirely:
- `pairOutcomes` state and `setPairOutcomes` (line 47)
- `dogPairs` useMemo (lines 92-105)
- `allPairsCovered` derived boolean (lines 108-109)
- `pairKey` import (line 7)
- Per-pair outcomes JSX block (lines 406-456)
- `pairOutcomesPayload` in handleSave (line 184)
- `pairOutcomes: pairOutcomesPayload` from the addWalkLog call (line 195)
- `setPairOutcomes({})` from the reset useEffect (line 64)

**Add** new state:
```typescript
const [groupAOutcome, setGroupAOutcome] = useState<WalkOutcome | null>(null)
const [groupBOutcome, setGroupBOutcome] = useState<WalkOutcome | null>(null)
```
Reset both to `null` in the `useEffect` that runs on `open`.

**Replace the two-groups JSX** (the `else` branch of `groupMode === 'together'`, lines 341-403). New layout:

```
Pool (unassigned dogs) — rounded box at top
  Dog chips (inline-flex, rounded-full pills)
  Each chip has the dog name; clicking calls handleGroupAssign cycling: unassigned -> A -> B -> unassigned

Group A box (blue border/header) — below pool
  Blue header bar: "Group A" label
  Dog chips inside (blue bg pills, click to remove back to pool)
  Outcome selector row: reuse OUTCOME_OPTIONS buttons (same pattern as walk-level)

Group B box (amber border/header) — below Group A
  Amber header bar: "Group B" label
  Dog chips inside (amber bg pills, click to remove back to pool)
  Outcome selector row: reuse OUTCOME_OPTIONS buttons
```

Modify `handleGroupAssign` to support the cycle pattern. Currently it toggles: if same group clicked, removes assignment. Change to a simpler click handler for pool chips:
```typescript
function handlePoolDogClick(dogId: string) {
  setGroupAssignments(prev => {
    const current = prev[dogId]
    if (!current) return { ...prev, [dogId]: 'A' as const }
    if (current === 'A') return { ...prev, [dogId]: 'B' as const }
    // current === 'B' -> remove
    const next = { ...prev }
    delete next[dogId]
    return next
  })
  if (dogsError) setDogsError(false)
  if (groupError) setGroupError(null)
}
```

For chips inside Group A/B boxes, clicking removes the dog back to pool:
```typescript
function handleRemoveFromGroup(dogId: string) {
  setGroupAssignments(prev => {
    const next = { ...prev }
    delete next[dogId]
    return next
  })
}
```

Keep the existing `handleGroupAssign` for the A/B buttons if you prefer, but the pool chips should use the cycle pattern.

Pool chip styling:
- Unassigned: `bg-slate-100 text-slate-700 hover:bg-slate-200`
- Show a small A/B badge on the chip if partially cycling (not needed if cycling is instant)

Group A chip: `bg-blue-100 text-blue-700` with an x icon or just click-to-remove
Group B chip: `bg-amber-100 text-amber-700` with an x icon or just click-to-remove

**Update Outcome section** (lines 250-279): Conditionally render walk-level outcome only when `groupMode === 'together'`. In groups mode, per-group outcome selectors are inside each group box.

**Update validation in handleSave:**
- In `groupMode === 'groups'`: require `groupAOutcome !== null && groupBOutcome !== null` (both groups must have an outcome). Add an `outcomeError` state or reuse existing for groups mode. Show error text below the group boxes.
- Walk-level outcome validation only applies in `together` mode.

**Update save payload in handleSave:**
- `outcome`: in groups mode, use `groupAOutcome ?? 'neutral'` as the walk-level fallback (keeps WalkLogEntry.outcome required field satisfied; groupAOutcome is the "primary" outcome).
- `groupContext`: in groups mode, include `{ groupA, groupB, groupAOutcome: groupAOutcome!, groupBOutcome: groupBOutcome! }`.
- No `pairOutcomes` field at all.

**3. src/lib/scoring.ts — Update both functions that read pairOutcomes:**

**inferStatusFromHistory** (lines 36-54): Remove the `pairOutcomes` lookup. Replace line 48:
```typescript
// Old: const resolvedOutcomes = pairWalks.map((e) => e.pairOutcomes?.[key] ?? e.outcome)
// New: For each walk, if groupContext exists and the pair is cross-group, use the worse of the two group outcomes.
// If the pair is intra-group, use that group's outcome. Otherwise use walk-level outcome.
const resolvedOutcomes = pairWalks.map((e) => {
  if (e.groupContext?.groupAOutcome && e.groupContext?.groupBOutcome) {
    const { groupA, groupB, groupAOutcome, groupBOutcome } = e.groupContext
    const inA_A = groupA.includes(dogIdA)
    const inA_B = groupA.includes(dogIdB)
    // Both in same group -> use that group's outcome
    if (inA_A && inA_B) return groupAOutcome
    const inB_A = groupB.includes(dogIdA)
    const inB_B = groupB.includes(dogIdB)
    if (inB_A && inB_B) return groupBOutcome
    // Cross-group -> use the worse outcome
    const outcomeRank: Record<WalkOutcome, number> = { incident: 4, poor: 3, neutral: 2, good: 1, great: 0 }
    return outcomeRank[groupAOutcome] >= outcomeRank[groupBOutcome] ? groupAOutcome : groupBOutcome
  }
  return e.outcome
})
```

**inferGroupContextConflicts** (lines 56-114): Remove the `!entry.pairOutcomes` guard on line 71. Replace the cross-group outcome resolution:
```typescript
// Old: if (!entry.groupContext || !entry.pairOutcomes) continue
// New:
if (!entry.groupContext) continue
const { groupA, groupB, groupAOutcome, groupBOutcome } = entry.groupContext
if (!groupAOutcome && !groupBOutcome) continue

// Derive cross-group outcome: worst of the two group outcomes
const outcomeRank: Record<string, number> = { incident: 4, poor: 3, neutral: 2, good: 1, great: 0 }
const crossOutcome = (() => {
  const outcomes = [groupAOutcome, groupBOutcome].filter(Boolean) as WalkOutcome[]
  if (outcomes.length === 0) return null
  return outcomes.reduce((worst, o) => outcomeRank[o] > outcomeRank[worst] ? o : worst)
})()
if (!crossOutcome || (crossOutcome !== 'incident' && crossOutcome !== 'poor')) continue
```

Then in the inner loop over cross-group pairs (lines 75-104), replace `const outcome = entry.pairOutcomes[pk] ?? entry.outcome` with just `const outcome = crossOutcome` since all cross-group pairs share the derived outcome. The rest of the trigger/target logic stays the same.
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
- GroupContext type has groupAOutcome and groupBOutcome optional fields
- pairOutcomes removed from WalkLogEntry type
- WalkLogSheet two-groups mode shows pool + two group boxes with per-group outcome selectors
- Walk-level Outcome hidden in groups mode, shown in together mode (unchanged)
- Per-pair outcomes JSX and state completely removed
- Save in groups mode produces groupContext with groupAOutcome/groupBOutcome, no pairOutcomes
- scoring.ts compiles with no pairOutcomes references, uses per-group outcomes for inference
- npm run build passes with zero TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Update WalkHistory display for per-group outcomes</name>
  <files>src/components/WalkHistory.tsx</files>
  <action>
**Update WalkLogEntryRow in WalkHistory.tsx:**

**1. Remove pairOutcomes badge logic** in `renderPairButton` (lines 70-72):
- Remove `const pairSpecificOutcome = entry.pairOutcomes?.[pk]` (line 71)
- Remove `const showBadge = pairSpecificOutcome !== undefined && pairSpecificOutcome !== entry.outcome` (line 72)
- Remove the `{showBadge && pairSpecificOutcome && (...)}` JSX inside the button (lines 80-89)
- The pair buttons themselves still render (they open EdgeSheet for compatibility editing) — just remove the outcome override badge

**2. Add per-group outcome badges** to the group display section (lines 100-110):

Currently the group labels show:
```
Group A: Rex, Bella | Group B: Coco
```
with a single `OutcomeBadge` for `entry.outcome` on line 99.

Change: When `entry.groupContext?.groupAOutcome` exists, show per-group outcome badges inline with each group label instead of the single walk-level badge:

```tsx
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
```

When per-group outcomes exist, the walk-level `OutcomeBadge` on line 99 should still render (it shows the "primary" outcome for the walk entry row header). This is fine since `entry.outcome` holds `groupAOutcome` as the fallback value. Alternatively, hide the walk-level badge when groupContext has per-group outcomes to avoid redundancy — use Claude's judgment here, but leaning toward hiding it when per-group badges are shown (cleaner display).

**3. Handle backward compatibility:** Old entries may have `pairOutcomes` in localStorage. The `renderPairButton` no longer reads `pairOutcomes`, so those entries simply show pair buttons without override badges — acceptable degradation.
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
- Walk history entries with groupContext show per-group OutcomeBadge next to each group's dog names
- Walk history entries without groupContext display unchanged (single outcome badge + dog list)
- Old entries with pairOutcomes render without errors (badges just not shown)
- No TypeScript errors, build succeeds
  </done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds with zero errors
2. `npx tsc --noEmit` passes — no type errors from removed pairOutcomes or new GroupContext fields
3. Manual verification: open dev server, navigate to Walk History, click "Log a walk":
   - Toggle to "Two groups" — see pool + group boxes (not the old A/B button table)
   - Click dogs in pool to cycle through A -> B -> unassigned
   - Each group box shows outcome selector buttons
   - Walk-level Outcome is hidden in groups mode
   - Both groups need at least one dog AND an outcome to save
   - Save and verify the entry appears in Walk History with per-group badges
   - Toggle back to "All together" — unchanged checkbox + single outcome
</verification>

<success_criteria>
- Two-groups mode renders pool of unassigned dog chips + two colored group boxes with per-group outcomes
- All together mode is completely unchanged
- Per-pair outcomes section is gone from all modes (no JSX, no state, no type field)
- GroupContext type includes optional groupAOutcome/groupBOutcome
- Walk history shows per-group outcome badges for group-mode entries
- scoring.ts infers conflicts from per-group outcomes (not pairOutcomes)
- Build passes, no TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/260330-gxb-redesign-walk-logger-two-group-drop-fiel/260330-gxb-SUMMARY.md`
</output>
