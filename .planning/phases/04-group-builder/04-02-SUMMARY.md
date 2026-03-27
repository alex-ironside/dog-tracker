---
phase: 04-group-builder
plan: 02
subsystem: ui
tags: [react, svg, conflict-overlay, dnd-kit, EdgeSheet, vitest, testing]

requires:
  - phase: 04-group-builder/04-01
    provides: GroupPanel, GroupBuilder, MiniDogCard, WalkGroup DnD layout, scoring wiring

provides:
  - ConflictOverlay SVG component (pure render, receives computed line coordinates)
  - computeConflictLines() helper function for DOM position computation
  - GroupPanel: useLayoutEffect-based conflict line computation + ConflictOverlay integration
  - GroupBuilder: EdgeSheet state management, setCompatibility/removeCompatibility wiring
  - GroupPanel.test.tsx: 10 tests covering score badge, conflict lines, D-04 exclusion, inline editing

affects:
  - 05-scheduler (GroupBuilder is the primary interaction surface for calendar integration)

tech-stack:
  added: []
  patterns:
    - "computeConflictLines() helper separates DOM measurement from rendering to fix ref timing bug"
    - "Parent useLayoutEffect pattern: child component receives computed data, not refs, to avoid React commit-order issues"
    - "GroupPanel owns containerRef and computes SVG coordinates; ConflictOverlay is a pure render component"

key-files:
  created:
    - src/components/ConflictOverlay.tsx
    - src/components/GroupPanel.test.tsx
  modified:
    - src/components/GroupPanel.tsx
    - src/components/GroupBuilder.tsx

key-decisions:
  - "ConflictOverlay refactored to pure render component (receives lines as data, not refs) — fixes React commit-order issue where child useLayoutEffect fires before parent containerRef is populated"
  - "computeConflictLines() extracted as standalone function called from GroupPanel's useLayoutEffect — containerRef is guaranteed set there (parent owns the ref)"
  - "flushSync considered and discarded — root cause was ref timing, not batching; architectural fix is cleaner"
  - "D-04 enforced in computeConflictLines filter: only status==='conflict' pairs draw SVG lines, unknown pairs excluded"

patterns-established:
  - "Pattern: When a child component needs a parent's containerRef for DOM measurement, move the measurement into the parent's useLayoutEffect and pass computed data down"

requirements-completed:
  - GROUP-03
  - GROUP-04

duration: 25min
completed: 2026-03-27
---

# Phase 4 Plan 02: Group Builder — Conflict Overlay & EdgeSheet Summary

**SVG conflict line overlay between incompatible dog pairs in group panels, clickable to update compatibility via EdgeSheet, with 10 tests covering score badge colors, D-04 unknown exclusion, and inline editing**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-27T16:35:00Z
- **Completed:** 2026-03-27T16:58:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Created `ConflictOverlay.tsx` as a pure render component drawing red `#ef4444` SVG lines between conflicting mini dog cards
- Wired EdgeSheet in `GroupBuilder` — clicking a conflict line opens the EdgeSheet with dog names and current status; status can be changed or relationship removed
- 10 GroupPanel tests covering score badge color coding (green/yellow/red), conflict line rendering, D-04 unknown exclusion, inline group name editing, delete, and remove dog
- Fixed a React ref timing bug discovered during implementation: child `useLayoutEffect` fires before parent `containerRef` is populated

## Task Commits

1. **Task 1: ConflictOverlay SVG component + GroupPanel integration** — `085a206` (feat)
2. **Task 2: EdgeSheet integration + GroupPanel tests** — `296cf20` (feat)

## Files Created/Modified

- `src/components/ConflictOverlay.tsx` — Pure render SVG overlay + `computeConflictLines()` helper for DOM measurement; exports `ConflictOverlay`, `computeConflictLines`, `ConflictLine`
- `src/components/GroupPanel.tsx` — Added `useLayoutEffect` for conflict line computation, `conflictLines` state, `conflicts`/`onConflictClick` props, `data-testid`/`data-card-id` attributes for testing
- `src/components/GroupBuilder.tsx` — Added EdgeSheet state, `setCompatibility`/`removeCompatibility` from store, `useMemo` for `compatMap`, `onConflictClick` wired to open EdgeSheet
- `src/components/GroupPanel.test.tsx` — 10 tests: score badge (green/yellow/red), conflict lines for 'conflict' status, no lines for 'unknown' (D-04), inline rename, delete, remove dog

## Decisions Made

- **ConflictOverlay as pure render component**: The initial implementation had `useLayoutEffect` inside `ConflictOverlay` to read DOM positions, but this fails because a child's layout effect fires before the parent's `containerRef` is set. The fix: `computeConflictLines()` runs in `GroupPanel`'s own `useLayoutEffect` where `containerRef.current` is guaranteed to be populated.
- **D-04 enforced at computation level**: `computeConflictLines()` filters `status === 'conflict'` only. Unknown pairs never produce SVG lines regardless of how they're passed.
- **useMemo for compatMap**: `GroupBuilder` memoizes `compatMap = buildCompatMap(compatibilityEntries)` to avoid re-building the map on every render.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed React ref timing: ConflictOverlay useLayoutEffect saw null containerRef**
- **Found during:** Task 1 (ConflictOverlay SVG component)
- **Issue:** `ConflictOverlay`'s `useLayoutEffect` fired before the parent `<div ref={containerRef}>` was committed, so `containerRef.current` was null and no lines were computed. Verified via debug logging: "useLayoutEffect fired, containerRef: null".
- **Fix:** Moved the DOM position computation (`computeConflictLines`) into `GroupPanel`'s own `useLayoutEffect` where `containerRef` is owned and guaranteed to be set. `ConflictOverlay` becomes a pure render component receiving `lines: ConflictLine[]` as data.
- **Files modified:** `src/components/ConflictOverlay.tsx`, `src/components/GroupPanel.tsx`
- **Verification:** GroupPanel tests pass including the conflict line render test.
- **Committed in:** `296cf20` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Fix was necessary for correct behavior. Architecture remains clean — ConflictOverlay is now a simpler pure component. The `computeConflictLines` helper preserves all the specified logic (D-04 filtering, center-point calculation, containerRef offset).

## Issues Encountered

- `npm run lint` fails with "ESLint couldn't find an eslint.config.js file" — this is a pre-existing issue that predates this plan (no eslint config was ever committed to the repo). Not introduced by this plan. Build and tests both succeed.

## Known Stubs

None — all data is wired. Conflict lines compute from real DOM positions. EdgeSheet reads from actual store data.

## Next Phase Readiness

- GROUP-03 (live score display) and GROUP-04 (inline conflict highlighting) are complete
- Phase 04 is fully complete — group builder, drag-and-drop, scoring, conflict visualization, and EdgeSheet integration all working
- Phase 05 (calendar/time-slot scheduler) can consume `GroupBuilder` and `walkGroups` store state

---
*Phase: 04-group-builder*
*Completed: 2026-03-27*
