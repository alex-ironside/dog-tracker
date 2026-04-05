---
phase: quick-260330-rzw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/store/walkHistorySlice.ts
  - src/store/index.ts
  - src/lib/scoring.ts
  - src/components/WalkLogSheet.tsx
  - src/components/WalkHistory.tsx
autonomous: true
requirements: [EDIT-WALK, DELETE-WALK, FIX-GROUP-ENCOUNTER-DISPLAY]

must_haves:
  truths:
    - "User can edit an existing walk log entry (date, outcome, notes, dogs, group assignments)"
    - "User can delete a walk log entry with confirmation"
    - "Group encounters (e.g. Group AB vs Group C) display as a single group-level line, not as separate A->C, B->C pair buttons"
    - "inferStatusFromHistory skips cross-group pairs from group encounters (only intra-group pairs inferred)"
    - "Intra-group dog pairs still display individually in WalkHistory"
  artifacts:
    - path: "src/store/walkHistorySlice.ts"
      provides: "updateWalkLog and deleteWalkLog store actions"
      exports: ["WalkHistoryActions"]
    - path: "src/components/WalkLogSheet.tsx"
      provides: "Edit mode support via editEntry prop"
    - path: "src/components/WalkHistory.tsx"
      provides: "Edit/delete buttons, group-level encounter display"
    - path: "src/lib/scoring.ts"
      provides: "Fixed inferStatusFromHistory and inferGroupContextConflicts"
  key_links:
    - from: "src/components/WalkHistory.tsx"
      to: "src/store/walkHistorySlice.ts"
      via: "useAppStore.getState().updateWalkLog / deleteWalkLog"
      pattern: "useAppStore\\.getState\\(\\)\\.(updateWalkLog|deleteWalkLog)"
    - from: "src/components/WalkHistory.tsx"
      to: "src/components/WalkLogSheet.tsx"
      via: "editEntry prop passed to WalkLogSheet"
      pattern: "editEntry="
    - from: "src/components/WalkLogSheet.tsx"
      to: "src/store/walkHistorySlice.ts"
      via: "updateWalkLog called on save in edit mode"
      pattern: "updateWalkLog"
---

<objective>
Add edit and delete capabilities to walk log entries, and fix the group encounter display bug where group-to-group encounters are incorrectly expanded into individual dog-to-dog pair lines.

Purpose: Walk logs are currently append-only with no way to correct mistakes. Group encounters show misleading individual pair conflicts (A->C, B->C) instead of the actual group-level encounter (Group AB vs C).

Output: Editable/deletable walk logs, correct group-level encounter display in WalkHistory, and fixed scoring inference that respects group boundaries.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260330-rzw-edit-and-delete-walk-logs-fix-group-enco/260330-rzw-RESEARCH.md

<interfaces>
From src/types/index.ts:
```typescript
export type WalkOutcome = 'great' | 'good' | 'neutral' | 'poor' | 'incident'

export type GroupContext = {
  groupA: string[]
  groupB: string[]
  groupOutcome?: WalkOutcome
}

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

From src/store/walkHistorySlice.ts:
```typescript
export type WalkHistoryActions = {
  addWalkLog: (entry: Omit<WalkLogEntry, 'id'>) => void
}
```

From src/store/index.ts:
```typescript
export type AppStore = AppState & DogActions & CompatActions & GroupActions & ScheduleActions & WalkHistoryActions
```

From src/lib/scoring.ts:
```typescript
export function pairKey(idA: string, idB: string): string
export function inferStatusFromHistory(dogIdA: string, dogIdB: string, walkHistory: WalkLogEntry[]): CompatibilityStatus | null
export function inferGroupContextConflicts(walkHistory: WalkLogEntry[]): { triggerIds: string[]; targetId: string; status: CompatibilityStatus }[]
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add updateWalkLog/deleteWalkLog store actions and fix scoring.ts group encounter logic</name>
  <files>src/store/walkHistorySlice.ts, src/lib/scoring.ts</files>
  <action>
**walkHistorySlice.ts:**
1. Add `updateWalkLog` to `WalkHistoryActions` type: `updateWalkLog: (id: string, updates: Partial<Omit<WalkLogEntry, 'id'>>) => void`
2. Add `deleteWalkLog` to `WalkHistoryActions` type: `deleteWalkLog: (id: string) => void`
3. Implement `updateWalkLog`: use `findIndex` + `map` with spread (same pattern as `updateDog` in dogSlice.ts). Preserve the entry's `id` — apply `updates` via spread on matching entry.
4. Implement `deleteWalkLog`: use `filter(e => e.id !== id)`.
5. Use `useAppStore.getState()` pattern for consistency (these are store actions so they use `set` directly).

**scoring.ts — inferStatusFromHistory fix:**
In `inferStatusFromHistory(dogIdA, dogIdB, walkHistory)`:
- When filtering `pairWalks`, for entries with `groupContext`, check if dogIdA and dogIdB are in DIFFERENT groups (one in groupA, other in groupB). If so, SKIP that entry — cross-group pair status should not be inferred from group encounters.
- Only include entries where both dogs are in the SAME group (both in groupA or both in groupB), OR entries without groupContext.
- This means: `pairWalks` filter adds condition: if `e.groupContext` exists, only include if both dogs are in `e.groupContext.groupA` or both in `e.groupContext.groupB`.

**scoring.ts — inferGroupContextConflicts fix:**
- Remove the redundant inner nested loop over individual cross-group pairs (lines 81-82: `for idA of groupA, for idB of groupB`).
- Instead, iterate groups directly: if `groupA.length >= 2`, emit one entry with `triggerIds = [...groupA].sort()` and iterate only `groupB` for `targetId`. If `groupB.length >= 2`, emit one entry with `triggerIds = [...groupB].sort()` and iterate only `groupA` for `targetId`.
- The key construction and deduplication logic stays the same, just remove the unnecessary nesting.
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Store has updateWalkLog and deleteWalkLog actions. inferStatusFromHistory skips cross-group pairs from group encounters. inferGroupContextConflicts iterates groups not individual pairs.</done>
</task>

<task type="auto">
  <name>Task 2: Add edit mode to WalkLogSheet and edit/delete UI to WalkHistory</name>
  <files>src/components/WalkLogSheet.tsx, src/components/WalkHistory.tsx</files>
  <action>
**WalkLogSheet.tsx — edit mode:**
1. Add optional prop `editEntry?: WalkLogEntry` to `WalkLogSheetProps`.
2. In the `useEffect` that fires on `open` change: if `editEntry` is provided, populate form state from it instead of defaults:
   - `setDate(editEntry.date)`
   - `setOutcome(editEntry.outcome)`
   - `setSelectedDogIds(editEntry.dogIds)`
   - `setNotes(editEntry.notes)`
   - If `editEntry.groupContext` exists: `setGroupMode('groups')`, reconstruct `groupAssignments` by mapping each dog in `editEntry.groupContext.groupA` to 'A' and each in `editEntry.groupContext.groupB` to 'B', set `setGroupOutcome(editEntry.groupContext.groupOutcome ?? null)`.
   - Otherwise keep defaults (together mode, etc.)
3. In `handleSave`: if `editEntry` is provided, call `useAppStore.getState().updateWalkLog(editEntry.id, { date, outcome: resolvedOutcome, notes, dogIds: effectiveSelectedDogIds, groupId: initialGroupId, groupContext: groupContextPayload })` instead of `addWalkLog`.
4. Change the sheet title: if `editEntry` is provided, use "Edit Walk Log" as the `SheetTitle` text (override the `title` prop).
5. Change the save button text: "Update Walk Log" when editing, "Save Walk Log" when creating.

**WalkHistory.tsx — edit/delete buttons:**
1. Add state for edit: `const [editEntry, setEditEntry] = useState<WalkLogEntry | null>(null)`. The `WalkLogSheet` should receive `editEntry={editEntry ?? undefined}` and when the sheet closes, clear it.
2. Add edit and delete buttons to each `WalkLogEntryRow`. Pass `onEdit` and `onDelete` callbacks as props.
   - Edit button: small icon button (Pencil icon from lucide-react), calls `onEdit(entry)`.
   - Delete button: small icon button (Trash2 icon from lucide-react), calls `onDelete(entry.id)`.
   - Place them in the top-right of the entry row (absolute positioned or flex end).
3. `onEdit` handler in `WalkHistory`: sets `editEntry` state and opens the sheet (`setSheetOpen(true)`).
4. `onDelete` handler in `WalkHistory`: calls `window.confirm('Delete this walk log?')` and if confirmed, calls `useAppStore.getState().deleteWalkLog(id)`.
5. When `sheetOpen` changes to false (via `onOpenChange`), also clear `editEntry` to null.

**WalkHistory.tsx — fix group encounter display:**
In `WalkLogEntryRow`, replace the cross-group pairs section (lines 109-115) with a single group-level encounter line:
- When `entry.groupContext` exists and `crossGroupPairs.length > 0`, instead of rendering individual cross-group pair buttons, render a single non-clickable label: `"Group A vs Group B"` (using the group names already computed as `groupANames` and `groupBNames`). Do NOT render individual `renderPairButton` calls for cross-group pairs.
- Keep the intra-group pairs section unchanged — those are genuine dog-to-dog relationships within the same group and should still render as individual clickable pair buttons.
- The "Cross-group:" label becomes unnecessary since there is just one group-level line. Replace it with something like: `"{groupANames.join(', ')} vs {groupBNames.join(', ')}"` styled as a non-interactive badge.
  </action>
  <verify>
    <automated>cd "C:/Users/alex/Documents/private/dog tracker" && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>WalkLogSheet supports edit mode via editEntry prop, pre-populating all fields including group assignments. WalkHistory shows edit/delete buttons on each entry row. Delete uses window.confirm. Group encounters display as a single group-level line instead of individual cross-group pair buttons. Build succeeds with no TypeScript errors.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes — no type errors
2. `npm run build` succeeds — production build works
3. Manual verification: open app, create a group encounter walk log, verify it shows as single group line (not individual pairs)
4. Manual verification: edit a walk log, verify fields pre-populate correctly
5. Manual verification: delete a walk log with confirmation
</verification>

<success_criteria>
- Walk log entries have visible edit and delete buttons
- Edit opens WalkLogSheet pre-populated with entry data (including group assignments if group mode)
- Delete shows confirmation dialog and removes entry from store
- Group encounter walks show single "Group A vs Group B" line instead of individual cross-group pair buttons
- Intra-group pairs still show as individual clickable buttons
- inferStatusFromHistory no longer infers individual pair status from cross-group encounters
- TypeScript compiles, production build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260330-rzw-edit-and-delete-walk-logs-fix-group-enco/260330-rzw-SUMMARY.md`
</output>
