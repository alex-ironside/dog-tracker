---
phase: quick-260330-pey
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/types/index.ts
  - src/store/migrations.ts
  - src/components/WalkLogSheet.tsx
  - src/lib/scoring.ts
  - src/components/WalkHistory.tsx
autonomous: true
requirements: [QUICK-PEY]

must_haves:
  truths:
    - "Group walk logs capture ONE outcome for the Group A vs Group B encounter, not per-group outcomes"
    - "Existing walk history entries with groupAOutcome/groupBOutcome are migrated to single groupOutcome"
    - "Scoring uses groupContext.groupOutcome directly for all dog pairs in a group walk"
    - "Walk history display shows one outcome badge for the group encounter"
  artifacts:
    - path: "src/types/index.ts"
      provides: "GroupContext with single groupOutcome field"
      contains: "groupOutcome"
    - path: "src/store/migrations.ts"
      provides: "v3->v4 migration deriving groupOutcome from worst of old fields"
      contains: "CURRENT_SCHEMA_VERSION = 4"
    - path: "src/components/WalkLogSheet.tsx"
      provides: "Single shared outcome picker for group encounter"
    - path: "src/lib/scoring.ts"
      provides: "Simplified scoring reading groupContext.groupOutcome"
    - path: "src/components/WalkHistory.tsx"
      provides: "Single outcome badge for group walk entries"
  key_links:
    - from: "src/components/WalkLogSheet.tsx"
      to: "src/types/index.ts"
      via: "GroupContext.groupOutcome field used in save payload"
      pattern: "groupOutcome"
    - from: "src/lib/scoring.ts"
      to: "src/types/index.ts"
      via: "reads groupContext.groupOutcome for status inference"
      pattern: "groupContext\\.groupOutcome"
    - from: "src/store/migrations.ts"
      to: "src/types/index.ts"
      via: "migrates old fields to new groupOutcome shape"
      pattern: "groupOutcome"
---

<objective>
Replace per-group outcomes (groupAOutcome/groupBOutcome) with a single groupOutcome representing the Group A vs Group B encounter relationship.

Purpose: The user wants to log how Group A and Group B interacted with each other -- one relationship outcome -- not separate per-group verdicts which duplicate the existing compatibility system.
Output: Updated data model, migration, UI, scoring, and history display all using single groupOutcome.
</objective>

<execution_context>
@.planning/quick/260330-pey-fix-walk-logging-group-relationship-grou/260330-pey-RESEARCH.md
</execution_context>

<context>
@src/types/index.ts
@src/store/migrations.ts
@src/components/WalkLogSheet.tsx
@src/lib/scoring.ts
@src/components/WalkHistory.tsx

<interfaces>
From src/types/index.ts:
```typescript
export type WalkOutcome = 'great' | 'good' | 'neutral' | 'poor' | 'incident'

// CURRENT (to be changed):
export type GroupContext = {
  groupA: string[]
  groupB: string[]
  groupAOutcome?: WalkOutcome  // REMOVE
  groupBOutcome?: WalkOutcome  // REMOVE
}

// TARGET:
// export type GroupContext = {
//   groupA: string[]
//   groupB: string[]
//   groupOutcome: WalkOutcome   // single encounter outcome
// }
```

From src/lib/scoring.ts:
```typescript
export function inferStatusFromHistory(dogIdA: string, dogIdB: string, walkHistory: WalkLogEntry[]): CompatibilityStatus | null
export function inferGroupContextConflicts(walkHistory: WalkLogEntry[]): { triggerIds: string[]; targetId: string; status: CompatibilityStatus }[]
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update data model, migration, and scoring</name>
  <files>src/types/index.ts, src/store/migrations.ts, src/lib/scoring.ts</files>
  <action>
1. In `src/types/index.ts`, update `GroupContext`:
   - Remove `groupAOutcome?: WalkOutcome` and `groupBOutcome?: WalkOutcome`
   - Add `groupOutcome?: WalkOutcome` (optional because old entries may not have it pre-migration, and together-mode entries don't use it)

2. In `src/store/migrations.ts`:
   - Bump `CURRENT_SCHEMA_VERSION` from 3 to 4
   - Add `if (version < 4)` migration block:
     - Iterate `state.walkHistory`, for entries with `groupContext` that have `groupAOutcome` or `groupBOutcome`:
       - Derive `groupOutcome` = worst of the two using outcomeRank: `{ incident: 4, poor: 3, neutral: 2, good: 1, great: 0 }` -- pick the one with the higher rank value
       - If only one exists, use that one
       - Delete `groupAOutcome` and `groupBOutcome` from the entry's groupContext
     - Return migrated state with `schemaVersion: 4`

3. In `src/lib/scoring.ts`:
   - `inferStatusFromHistory`: Replace the block checking `e.groupContext?.groupAOutcome && e.groupContext?.groupBOutcome` with a simpler check for `e.groupContext?.groupOutcome`. When present, use `groupContext.groupOutcome` directly for ALL pairs (both cross-group and same-group). No more per-group distinction needed -- the outcome represents the entire encounter.
   - `inferGroupContextConflicts`: Replace the logic that reads `groupAOutcome`/`groupBOutcome` and derives `crossOutcome` from worst-of. Instead, read `entry.groupContext.groupOutcome` directly. If not present or not 'incident'/'poor', skip. The rest of the trigger/target logic stays the same.
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>GroupContext type has single groupOutcome field. Migration converts old entries. Scoring reads groupOutcome directly. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Update WalkLogSheet UI and WalkHistory display</name>
  <files>src/components/WalkLogSheet.tsx, src/components/WalkHistory.tsx</files>
  <action>
1. In `src/components/WalkLogSheet.tsx`:
   - Remove `groupAOutcome` and `groupBOutcome` state variables entirely
   - Add a single `groupOutcome` state: `const [groupOutcome, setGroupOutcome] = useState<WalkOutcome | null>(null)`
   - Update the reset in `useEffect` to clear `groupOutcome` (remove `setGroupAOutcome(null)` and `setGroupBOutcome(null)`)
   - Remove the outcome picker sections inside the Group A box (lines ~463-486) and Group B box (lines ~513-536). Each DroppableBox should only contain the header + chip area, no outcome picker inside.
   - Add ONE shared outcome picker BELOW the two group boxes but still inside the DndContext/groups section, after the Group B DroppableBox. Label it "Encounter outcome" with a subtitle "How did the groups interact?". Use the same OUTCOME_OPTIONS button row style but reference `groupOutcome`/`setGroupOutcome`.
   - Update validation in `handleSave` groups branch: replace check for `groupAOutcome === null || groupBOutcome === null` with `groupOutcome === null`. Error message: "Select an encounter outcome."
   - Update `groupContextPayload`: `{ groupA, groupB, groupOutcome: groupOutcome! }` (no groupAOutcome/groupBOutcome)
   - Update `resolvedOutcome` for groups mode: `groupMode === 'groups' ? groupOutcome! : outcome!`

2. In `src/components/WalkHistory.tsx`:
   - In `WalkLogEntryRow`, replace `hasPerGroupOutcomes` logic. Instead: `const hasGroupOutcome = !!entry.groupContext?.groupOutcome`
   - When `entry.groupContext` is present, show a single `OutcomeBadge` for `entry.groupContext.groupOutcome` (if present) next to the date, BEFORE the group names.
   - Remove the per-group outcome badges that currently appear after each group's dog names (lines ~93-95 for groupAOutcome and ~99-101 for groupBOutcome)
   - The display should read: `[date] [Outcome badge] Group A: Rex, Bella | Group B: Charlie`
   - Keep the cross-group / within-group pair buttons unchanged -- they are compatibility navigation, not outcome display.
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>WalkLogSheet shows one shared "Encounter outcome" picker for Two Groups mode (no per-group pickers). WalkHistory shows one outcome badge per group walk entry. App builds without errors.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` -- no type errors
2. `npm run build` -- production build succeeds
3. Manual: open app, switch to Two Groups mode in walk logger, confirm single outcome picker below both group boxes
4. Manual: check existing walk history entries display single badge per group encounter
</verification>

<success_criteria>
- GroupContext type has `groupOutcome` field, no `groupAOutcome`/`groupBOutcome`
- Schema version is 4 with working migration from v3
- WalkLogSheet Two Groups mode shows ONE outcome picker labeled "Encounter outcome" below the group boxes
- WalkHistory group entries show ONE badge for the encounter
- Scoring functions use groupOutcome directly
- App compiles and builds without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260330-pey-fix-walk-logging-group-relationship-grou/260330-pey-SUMMARY.md`
</output>
