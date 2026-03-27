---
phase: 04-group-builder
plan: 01
subsystem: ui
tags: [react, zustand, dnd-kit, drag-and-drop, typescript, vitest, tdd]

# Dependency graph
requires:
  - phase: 03-compatibility-graph
    provides: compatibilityEntries in store, scoring functions in src/lib/scoring.ts
  - phase: 02-compatibility-system
    provides: scoreGroup, getConflictsInGroup, buildCompatMap from src/lib/scoring.ts
  - phase: 01-foundation
    provides: Zustand store with persist middleware, dogSlice/compatSlice slice pattern, AppState type with walkGroups already defined
provides:
  - groupSlice with addGroup, renameGroup, deleteGroup, addDogToGroup, removeDogFromGroup
  - GroupBuilder two-panel DnD layout (roster + groups panels)
  - RosterRow draggable dog row with greyed-out assigned state
  - GroupPanel droppable card with inline-editable name, score badge, conflict warning, delete button
  - MiniDogCard mini card inside group with remove button
  - Groups tab in App.tsx (third tab after Dogs and Compatibility)
  - GROUP-02 enforcement: addDogToGroup removes dog from other group before adding
affects: [04-02]

# Tech tracking
tech-stack:
  added:
    - "@dnd-kit/core@6.3.1 — drag context, useDraggable, useDroppable, DragOverlay, sensors"
    - "@dnd-kit/utilities@3.2.2 — CSS.Translate.toString() for drag transform styles"
  patterns:
    - "Zustand slice pattern (createGroupSlice follows dogSlice/compatSlice exactly)"
    - "useShallow from zustand/react/shallow to avoid infinite re-render loop from selector returning new arrays"
    - "DnD testing via mocked DndContext capturing onDragEnd callback on window.__dndCallbacks"
    - "RosterPanel as nested component accessing store directly for clean separation from GroupBuilder"

key-files:
  created:
    - src/store/groupSlice.ts
    - src/store/groupSlice.test.ts
    - src/components/GroupBuilder.tsx
    - src/components/GroupBuilder.test.tsx
    - src/components/RosterRow.tsx
    - src/components/GroupPanel.tsx
    - src/components/MiniDogCard.tsx
  modified:
    - src/store/index.ts
    - src/App.tsx
    - package.json

key-decisions:
  - "useShallow selector in GroupBuilder to prevent Zustand re-render loop — filter/map selectors return new arrays each render, causing infinite update cycle in tests without shallow equality"
  - "RosterPanel defined as module-level component reading from store directly — avoids prop drilling dogs/walkGroups down from GroupBuilder"
  - "GroupBuilder mock pattern captures onDragEnd via window.__dndCallbacks — avoids jsdom pointer event simulation limitation (getBoundingClientRect always zero)"

patterns-established:
  - "Pattern: DnD state testing by mocking DndContext and capturing onDragEnd on window.__dndCallbacks, then calling with act()"
  - "Pattern: useSensors mock returns [] to avoid infinite render loop from new array reference on each render"

requirements-completed: [GROUP-01, GROUP-02, GROUP-05]

# Metrics
duration: 7min
completed: 2026-03-27
---

# Phase 4 Plan 01: Group Builder — Store, DnD Layout, Groups Tab Summary

**Zustand groupSlice with GROUP-02 dog-exclusivity enforcement, dnd-kit two-panel GroupBuilder layout (roster + droppable group cards), and Groups tab in App.tsx**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-27T15:24:51Z
- **Completed:** 2026-03-27T15:31:43Z
- **Tasks:** 2
- **Files modified:** 9 (7 created, 2 modified)

## Accomplishments

- groupSlice with 5 actions (addGroup, renameGroup, deleteGroup, addDogToGroup, removeDogFromGroup) — 7 unit tests passing
- GroupBuilder two-panel layout: roster panel (left, ~280px) with draggable RosterRow items, groups panel (right, flex-1) with droppable GroupPanel cards
- GROUP-02 enforced in addDogToGroup: removes dog from any other group before adding to target group
- GROUP-05: drag-back to roster triggers removeDogFromGroup via onDragEnd handler checking over.id === 'roster'
- Auto-creates "Group 1" on first mount when no groups exist (D-06)
- Inline-editable group name (click to edit, blur/Enter commits, Escape reverts)
- Score badge per group (green/yellow/red) via scoreGroup from existing scoring.ts
- Conflict warning icon (AlertTriangle) when getConflictsInGroup returns conflict pairs
- MiniDogCard with X remove button inside each group
- Groups tab added to App.tsx as third tab after Dogs and Compatibility
- 121 total tests passing (106 pre-existing + 15 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: groupSlice with TDD, store wiring, Groups tab in App.tsx** - `727cb47` (feat)
2. **Task 2: GroupBuilder two-panel DnD layout with roster, group panels, drag interactions** - `ec27e2b` (feat)

## Files Created/Modified

- `src/store/groupSlice.ts` — GroupActions type + createGroupSlice with all 5 actions
- `src/store/groupSlice.test.ts` — 7 unit tests covering all group slice actions including GROUP-02 enforcement
- `src/store/index.ts` — Added createGroupSlice import, GroupActions to AppStore type, spread into create()
- `src/components/GroupBuilder.tsx` — Top-level DnD component; DndContext with onDragEnd, RosterPanel sub-component, useShallow selector
- `src/components/GroupBuilder.test.tsx` — 8 component tests via mocked DndContext + window.__dndCallbacks pattern
- `src/components/RosterRow.tsx` — Compact draggable dog row; greyed-out with "in [GroupName]" label when assigned
- `src/components/GroupPanel.tsx` — Droppable group card; inline-editable name, score badge, warning icon, delete button, MiniDogCard map
- `src/components/MiniDogCard.tsx` — Small dog card inside group with X remove button
- `src/App.tsx` — Added Groups tab (third), imported GroupBuilder, updated activeTab type to 3-way union
- `package.json` — Added @dnd-kit/core@6.3.1 and @dnd-kit/utilities@3.2.2

## Decisions Made

- **useShallow selector in GroupBuilder:** Multiple separate `useAppStore((s) => s.dogs.filter(...))` calls return new array references on every render, triggering infinite Zustand re-renders in tests. Fixed by using `useShallow` from `zustand/react/shallow` with a single combined selector.
- **RosterPanel as module-level component:** Keeps GroupBuilder clean by reading store data directly rather than receiving large props objects.
- **useSensors mock returns `[]`:** The plan's suggested mock (`(...args) => args`) returned a new array reference on every call, causing render loops. Fixed by returning a stable empty array `[]`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed infinite render loop in GroupBuilder tests caused by unstable useSensors mock**
- **Found during:** Task 2 (GroupBuilder component tests)
- **Issue:** Plan's mock `useSensors: (...args: any[]) => args` returns a new array on each call; DndContext receiving new sensors prop every render triggered Zustand subscription loop (Maximum update depth exceeded)
- **Fix:** Changed mock to `useSensors: (..._args: any[]) => []` returning a stable empty array; changed mock `useSensor` signature to match. Also used `useShallow` in GroupBuilder component to stabilize store selectors.
- **Files modified:** src/components/GroupBuilder.test.tsx, src/components/GroupBuilder.tsx
- **Verification:** All 8 GroupBuilder tests pass; full suite 121/121
- **Committed in:** ec27e2b (Task 2 commit)

**2. [Rule 1 - Bug] Removed unused RosterDropZone component that caused duplicate useDroppable('roster') registration**
- **Found during:** Task 2 (debugging render loop)
- **Issue:** GroupBuilder.tsx had both a `RosterDropZone` component (unused) and `RosterPanel` component both calling `useDroppable({ id: 'roster' })`, creating duplicate droppable registration
- **Fix:** Removed the unused `RosterDropZone` component
- **Files modified:** src/components/GroupBuilder.tsx
- **Verification:** No duplicate registrations, tests pass
- **Committed in:** ec27e2b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in test setup/component code)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep — test and component code only.

## Issues Encountered

- Zustand selector infinite render loop: `filter()` inside useAppStore selector creates new array every render — must use useShallow or read raw arrays and filter inside render. This is a known Zustand pitfall when using transformation selectors.
- dnd-kit mock sensor instability: the plan's suggested mock pattern `useSensors: (...args) => args` was unstable; required change to return constant empty array.

## Known Stubs

None — all GroupBuilder functionality is wired to real store state and actions.

## Next Phase Readiness

- Plan 04-02: Conflict SVG overlay inside GroupPanel ready to be added (GroupPanel has `relative` body div and `containerRef` already)
- EdgeSheet reuse from Phase 03 already available for conflict line click-through
- getConflictsInGroup and buildCompatMap already called in GroupBuilder for `hasConflicts` prop

---
*Phase: 04-group-builder*
*Completed: 2026-03-27*
