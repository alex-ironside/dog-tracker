---
phase: quick-fix
plan: 01
subsystem: compatibility-graph, group-builder, walk-history, ui
tags: [scoring, history-inference, graph, walk-history, sheet]
dependency_graph:
  requires: [phase-06-walk-history]
  provides: [inferStatusFromHistory, history-dashed-links, walk-history-pair-buttons, single-close-button]
  affects: [CompatibilityGraph, GroupBuilder, WalkHistory, sheet]
tech_stack:
  added: []
  patterns: [history-inferred-compatibility, walk-outcome-scoring]
key_files:
  created: []
  modified:
    - src/lib/scoring.ts
    - src/components/CompatibilityGraph.tsx
    - src/components/GroupBuilder.tsx
    - src/components/WalkHistory.tsx
    - src/components/ui/sheet.tsx
    - src/components/CompatibilityGraph.test.tsx
decisions:
  - inferStatusFromHistory uses incident > poor > good/great hierarchy: incident=conflict, any poor=neutral, >=50% good/great=compatible
  - History-inferred links use [3,3] dash pattern distinct from unknown [5,5] and explicit [] links
  - Explicit compat entries always take precedence — history only fills gaps where no explicit entry exists
  - SheetContent built-in close button removed; each consumer (EdgeSheet, WalkLogSheet, DogPanel) owns its own close button
metrics:
  duration: ~8min
  completed_date: "2026-03-29T15:45:14Z"
  tasks: 2
  files: 6
---

# Quick Fix 260329-obb: Fix Graph Relations from History + Fix Compatibility Scoring + Add Walk History Pair Buttons + Remove Duplicate Close Button Summary

**One-liner:** Walk history now feeds into compatibility graph (dashed links) and group scoring, history entries show clickable per-pair buttons opening EdgeSheet, and sheet drawers no longer render a duplicate close button.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add inferStatusFromHistory to scoring lib + augment CompatibilityGraph and GroupBuilder | ceff89a | src/lib/scoring.ts, src/components/CompatibilityGraph.tsx, src/components/GroupBuilder.tsx, src/components/CompatibilityGraph.test.tsx |
| 2 | Add per-pair EdgeSheet to WalkHistory + remove duplicate close button from sheet.tsx | 87c9048 | src/components/WalkHistory.tsx, src/components/ui/sheet.tsx |

## What Was Built

**inferStatusFromHistory (scoring.ts):** New exported function that derives a `CompatibilityStatus` from walk log history for a pair. Outcome hierarchy: any `incident` → `conflict`; any `poor` → `neutral`; otherwise `compatible` if ≥50% walks were `great`/`good`, else `neutral`. Returns `null` if no shared walks exist.

**CompatibilityGraph augmentation:** `graphData` useMemo now appends history-inferred links for active dog pairs without explicit compatibility entries. History links carry `fromHistory: true` and render as `[3,3]` dashed lines (distinct from `unknown` at `[5,5]` and explicit at `[]`).

**GroupBuilder augmentation:** `compatMap` useMemo now iterates all active dog pairs after building from explicit entries, filling missing pairs with `inferStatusFromHistory`. Groups containing dogs with good walk history now score above 25% unknown.

**WalkHistory per-pair buttons:** `WalkLogEntryRow` now accepts `dogs`, `compatMap`, and `onPairClick` as props (instead of reading store directly). For entries with 2+ dogs, all unique pairs are rendered as clickable pill buttons (e.g., "Rex & Bella"). Clicking opens `EdgeSheet` with the pair's current status, allowing direct compatibility setting from history view.

**Sheet duplicate close button removed:** `SheetContent` in `sheet.tsx` no longer renders the built-in `SheetPrimitive.Close` button (and removes the unused `X` import). Each sheet consumer already has its own close button in the header.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- All CompatibilityGraph tests pass (13/13)
- All GroupBuilder tests pass (8/8)
- All WalkHistory tests pass (6/6)
- Full test suite: 991 tests pass across 99 test files
- Note: 5 pre-existing failures in other worktrees (`clicking Compatibility tab shows force-graph component` — force-graph/jsdom interaction issue, unrelated to this fix)
- `npm run build` succeeds with no TypeScript errors

## Self-Check: PASSED

- `src/lib/scoring.ts` — modified, inferStatusFromHistory exported
- `src/components/CompatibilityGraph.tsx` — modified, fromHistory dashed links present
- `src/components/GroupBuilder.tsx` — modified, history-augmented compatMap present
- `src/components/WalkHistory.tsx` — modified, EdgeSheet and pair buttons present
- `src/components/ui/sheet.tsx` — modified, SheetPrimitive.Close removed
- Commits ceff89a and 87c9048 verified in git log
