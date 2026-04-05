# Quick Task Research: Edit/Delete Walk Logs + Fix Group Encounter Display

**Researched:** 2026-03-30
**Confidence:** HIGH

## Summary

Two issues to address: (1) walk logs are currently append-only with no edit/delete capability, and (2) group encounters are incorrectly expanded to individual dog-to-dog pairs in both the WalkHistory display and the compatibility graph inference.

The data model (`WalkLogEntry`) already captures group-level encounters via `groupContext` with `groupA`, `groupB`, and `groupOutcome`. The bugs are in how downstream consumers expand these to pairwise dog relationships instead of treating them as group-level data.

## Project Constraints (from CLAUDE.md)

- React 18 + TypeScript SPA, Vite, no backend
- LocalStorage persistence via Zustand + persist middleware
- No test framework configured (note: Vitest IS configured per STATE.md decisions, despite CLAUDE.md saying otherwise)
- No Co-Authored-By lines in commits

## Key Files

| File | Role |
|------|------|
| `src/types/index.ts` | `WalkLogEntry`, `GroupContext`, `WalkOutcome` types |
| `src/store/walkHistorySlice.ts` | Only has `addWalkLog` -- needs `updateWalkLog` and `deleteWalkLog` |
| `src/store/index.ts` | Store composition -- needs updated `WalkHistoryActions` type |
| `src/components/WalkLogSheet.tsx` | Walk log creation form -- needs edit mode support |
| `src/components/WalkHistory.tsx` | Walk history list display -- needs edit/delete buttons; contains encounter display bug |
| `src/components/CompatibilityGraph.tsx` | Graph rendering -- consumes `inferGroupContextConflicts` and `inferStatusFromHistory` |
| `src/lib/scoring.ts` | `inferStatusFromHistory` and `inferGroupContextConflicts` -- core logic bugs |

## Bug Analysis: Group Encounter Display

### Bug 1: WalkHistory cross-group pair expansion (WalkHistory.tsx lines 50-63)

`WalkLogEntryRow` generates ALL pairwise combinations across groups via nested loops:

```typescript
for (let i = 0; i < entry.dogIds.length; i++) {
  for (let j = i + 1; j < entry.dogIds.length; j++) {
    // generates A-C, B-C separately when Group A=[A,B], Group B=[C]
  }
}
```

Then lines 109-115 display these as individual "Cross-group" pair buttons (`A & C`, `B & C`). The fix: when `groupContext` exists, display a single group-level encounter line (`Group A vs Group B`) instead of expanding to individual cross-group pairs. Intra-group pairs can still be shown individually since those are actual dog-to-dog relationships within the same group.

### Bug 2: inferStatusFromHistory (scoring.ts lines 36-58)

This function checks if both dogs appeared in the same walk and uses the walk's outcome. For group encounters, it applies the `groupOutcome` to EVERY dog pair that includes one from each group. When Group AB has an "incident" with Group C, it marks both A-C and B-C as individual `conflict` status -- but the conflict was between the GROUPS, not between individual dogs.

**Fix approach:** `inferStatusFromHistory` should skip cross-group pairs from group encounters. For a walk with `groupContext`, only intra-group pairs should have their status inferred from the walk-level outcome. Cross-group relationships should be handled exclusively by `inferGroupContextConflicts` (which already produces group-level hyperedge nodes).

### Bug 3: inferGroupContextConflicts (scoring.ts lines 60-118)

This function ALSO iterates all cross-group pairs (line 81-82: `for idA of groupA, for idB of groupB`). The inner loop body is redundant since the trigger/target logic only depends on group membership, not individual pairs. The nested loop causes duplicate `conflictMap.set()` calls with the same key. While not producing visible duplicates (Map deduplicates), it is wasteful and confusing. The fix: iterate groups, not individual cross-group pairs.

## Edit/Delete Walk Logs

### Current State

- `walkHistorySlice.ts` only exports `addWalkLog`
- The existing test explicitly asserts no edit/delete exists (line 98)
- `WalkLogEntry` has: `id`, `date`, `outcome`, `notes`, `dogIds`, `groupId?`, `groupContext?`

### What Needs to Change

**Store -- walkHistorySlice.ts:**
- Add `updateWalkLog(id: string, updates: Partial<Omit<WalkLogEntry, 'id'>>)` -- findIndex + spread
- Add `deleteWalkLog(id: string)` -- filter by id
- Update `WalkHistoryActions` type
- Update test file to cover new actions

**UI -- WalkHistory.tsx:**
- Add edit and delete buttons to each `WalkLogEntryRow`
- Edit button opens `WalkLogSheet` in edit mode (pre-populated with entry data)
- Delete button shows confirmation dialog then calls `deleteWalkLog`

**UI -- WalkLogSheet.tsx:**
- Accept optional `editEntry?: WalkLogEntry` prop
- When `editEntry` is provided: pre-populate all fields, change title to "Edit Walk Log", change save button to "Update Walk Log"
- On save: call `updateWalkLog` instead of `addWalkLog`

### Cascading Concerns for Delete

Walk log deletion has NO cascading data issues because:
- Compatibility entries (`compatibilityEntries`) are stored independently -- they are not derived from walk logs
- `inferStatusFromHistory` and `inferGroupContextConflicts` dynamically compute from `walkHistory` array -- deleting an entry automatically updates the graph on next render
- No foreign keys reference `WalkLogEntry.id` anywhere in the store
- The graph recalculates on every render via `useMemo` dependent on `walkHistory`

Safe to delete without any cascade logic.

## Architecture Patterns

### Edit Pattern (consistent with existing codebase)

The codebase uses `useAppStore.getState().action()` for save handlers (avoiding stale closures). Follow this same pattern for update/delete. See `dogSlice.ts` for `updateDog` as the existing edit pattern -- uses `findIndex` + `map` with spread.

### Sheet Reuse Pattern

`WalkLogSheet` should handle both create and edit modes via props (similar to how `DogPanel` handles both "Add Dog" and edit flows). The `useEffect` on `open` already resets form state -- for edit mode, it should populate from `editEntry` instead of defaults.

### Confirmation Dialog for Delete

Use a simple `window.confirm()` or a small inline confirmation state. No need for a full modal -- the codebase does not have a confirmation dialog component and adding one is overengineering for this task.

## Common Pitfalls

### Stale Closure in Edit Save
Always use `useAppStore.getState()` in the save handler, not a selector. This is already the pattern in `WalkLogSheet` -- maintain it for the update path.

### Group Mode State in Edit
When editing a group-mode walk log, the form must restore: `groupMode='groups'`, `groupAssignments` reconstructed from `groupContext.groupA` and `groupContext.groupB`, and `groupOutcome`. This is the trickiest part -- the `useEffect` on `open` needs conditional logic based on whether an edit entry is provided.

### ID Stability
`updateWalkLog` must preserve the entry's `id`. Use `Partial<Omit<WalkLogEntry, 'id'>>` for the updates type to prevent accidental ID changes.
