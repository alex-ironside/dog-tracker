---
phase: 03-compatibility-graph
plan: 02
subsystem: compatibility-graph
tags: [edge-sheet, dog-panel, graph-interactions, tdd]
dependency_graph:
  requires: [03-01]
  provides: [COMPAT-03]
  affects: [src/components/CompatibilityGraph.tsx]
tech_stack:
  added: []
  patterns:
    - TDD red-green cycle for EdgeSheet
    - act() wrapper for direct React state trigger in tests
    - d3 source/target mutation guard (typeof check before .id access)
    - useAppStore.getState() in event handlers to avoid stale closures
key_files:
  created:
    - src/components/EdgeSheet.tsx
    - src/components/EdgeSheet.test.tsx
  modified:
    - src/components/CompatibilityGraph.tsx
    - src/components/CompatibilityGraph.test.tsx
decisions:
  - act() wrapping required when calling captured graph callbacks directly in tests — jsdom does not auto-batch React state updates triggered outside of user-event
  - EdgeSheet test for CompatBadge "Neutral" uses getAllByText because the Neutral status button and badge both render the same text
key_decisions:
  - act() wrapping required when calling captured graph callbacks directly in tests
  - EdgeSheet CompatBadge test uses getAllByText because status button and badge share label text
metrics:
  duration: 4min
  completed_date: "2026-03-27"
  tasks: 2
  files: 4
---

# Phase 03 Plan 02: Edge & Node Interactions Summary

EdgeSheet component with TDD tests and full graph interaction wiring — edge click opens status picker, node click opens DogPanel edit mode.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Build EdgeSheet component with tests | c3085d3 | src/components/EdgeSheet.tsx, src/components/EdgeSheet.test.tsx |
| 2 | Wire edge-click to EdgeSheet and node-click to DogPanel | 14d3748 | src/components/CompatibilityGraph.tsx, src/components/CompatibilityGraph.test.tsx |

## What Was Built

**EdgeSheet** (`src/components/EdgeSheet.tsx`): Right-side sheet opened on edge click. Shows both dog names as `{Dog A} & {Dog B}` in SheetTitle, CompatBadge for current status, 4 status picker buttons with `aria-pressed`, sticky footer with "Set compatibility" (disabled until selection) and "Discard changes", and "Remove relationship" (destructive, `text-destructive`). Local `selectedStatus` state resets to null on open. Props: `onSetStatus`, `onRemove`, `onOpenChange` — no store calls inside EdgeSheet itself.

**CompatibilityGraph wiring** (`src/components/CompatibilityGraph.tsx`): `handleLinkClick` extracts source/target IDs with d3 mutation guard (`typeof === 'object'` check). `handleNodeClick` looks up dog by ID from full `allDogs` array. EdgeSheet and DogPanel rendered inside graph container. `useAppStore.getState().setCompatibility` and `removeCompatibility` called in EdgeSheet handlers, keeping EdgeSheet pure (no store imports).

## Verification

- `npm run test -- --run src/components/EdgeSheet.test.tsx`: 7/7 pass
- `npm run test -- --run src/components/CompatibilityGraph.test.tsx`: 13/13 pass
- `npm run test:run`: 106/106 pass (full suite, no regressions)
- `npm run build`: exits 0 (chunk size warning is pre-existing from react-force-graph)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test for CompatBadge status used getByText with ambiguous match**

- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** EdgeSheet renders both a "Neutral" status button and a CompatBadge with text "Neutral" — `getByText('Neutral')` found multiple elements and threw
- **Fix:** Changed to `getAllByText('Neutral')` and asserted `length >= 1`
- **Files modified:** src/components/EdgeSheet.test.tsx

**2. [Rule 1 - Bug] Direct callback invocation triggered React state update outside act()**

- **Found during:** Task 2 (test run)
- **Issue:** Calling `capturedOnLinkClick!()` and `capturedOnNodeClick!()` directly in tests caused "not wrapped in act(...)" warning and test failures because React state updates weren't batched
- **Fix:** Wrapped all captured callback invocations in `act(() => { ... })`
- **Files modified:** src/components/CompatibilityGraph.test.tsx

## Known Stubs

None — all EdgeSheet and graph interactions are fully wired to the store.
