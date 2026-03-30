---
phase: quick-260330-pey
plan: 01
subsystem: walk-logging
tags: [data-model, migration, scoring, ui, walk-history]
dependency_graph:
  requires: [260330-gxb, 260330-i59]
  provides: [single-group-encounter-outcome]
  affects: [WalkLogSheet, WalkHistory, scoring, migrations]
tech_stack:
  added: []
  patterns: [schema-migration, worst-of-two-derivation]
key_files:
  created: []
  modified:
    - src/types/index.ts
    - src/store/migrations.ts
    - src/lib/scoring.ts
    - src/components/WalkLogSheet.tsx
    - src/components/WalkHistory.tsx
decisions:
  - "groupOutcome is optional on GroupContext to remain compatible with pre-migration data and together-mode entries"
  - "v3->v4 migration derives groupOutcome as the worst of groupAOutcome/groupBOutcome using the same outcomeRank pattern already in scoring.ts"
  - "inferStatusFromHistory no longer distinguishes same-group vs cross-group pairs — both use groupOutcome directly, reflecting that the outcome describes the inter-group encounter"
metrics:
  duration: "~8min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 5
---

# Quick Task 260330-pey: Fix Walk Logging Group Relationship Summary

**One-liner:** Replaced dual per-group outcomes (groupAOutcome/groupBOutcome) with a single groupOutcome field representing the Group A vs Group B encounter, including schema v4 migration, simplified scoring, and updated UI/history display.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Update data model, migration, and scoring | 018d1e2 | src/types/index.ts, src/store/migrations.ts, src/lib/scoring.ts |
| 2 | Update WalkLogSheet UI and WalkHistory display | b2d3dd4 | src/components/WalkLogSheet.tsx, src/components/WalkHistory.tsx |

## What Was Done

### Task 1: Data model, migration, and scoring

- `GroupContext` type: removed `groupAOutcome?` and `groupBOutcome?`, added `groupOutcome?: WalkOutcome`
- `CURRENT_SCHEMA_VERSION` bumped from 3 to 4
- v3→v4 migration iterates walkHistory, derives `groupOutcome` as the worse of old fields (using outcomeRank: incident=4, poor=3, neutral=2, good=1, great=0), deletes old fields
- `inferStatusFromHistory`: simplified — when `groupContext.groupOutcome` is present, use it for all dog pairs in the walk (no more same-group vs cross-group distinction)
- `inferGroupContextConflicts`: reads `groupContext.groupOutcome` directly instead of deriving worst-of from two fields; skips entries where outcome is not 'incident' or 'poor'
- Removed unused `WalkOutcome` import from scoring.ts

### Task 2: UI and history display

- `WalkLogSheet`: removed `groupAOutcome`/`groupBOutcome` state variables, replaced with single `groupOutcome` state
- Removed outcome pickers from inside Group A and Group B boxes
- Added one shared "Encounter outcome" picker below both group boxes with subtitle "How did the groups interact?"
- Validation updated: checks `groupOutcome === null` with error "Select an encounter outcome."
- `groupContextPayload` now sends `{ groupA, groupB, groupOutcome: groupOutcome! }`
- `resolvedOutcome` (top-level entry.outcome) now uses `groupOutcome` in group mode
- `WalkHistory`: replaced `hasPerGroupOutcomes` with `hasGroupOutcome`; single `OutcomeBadge` rendered before group names; removed per-group outcome badges

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Verification

- `npx tsc --noEmit`: passes (no output)
- `npm run build`: succeeds (build in 7.54s; chunk size warning is pre-existing)

## Self-Check: PASSED

- src/types/index.ts: FOUND, contains `groupOutcome`
- src/store/migrations.ts: FOUND, CURRENT_SCHEMA_VERSION = 4, v3→v4 migration block present
- src/lib/scoring.ts: FOUND, uses `groupContext.groupOutcome` directly
- src/components/WalkLogSheet.tsx: FOUND, single `groupOutcome` state, encounter outcome picker below group boxes
- src/components/WalkHistory.tsx: FOUND, single `OutcomeBadge` for group encounter
- Commit 018d1e2: FOUND
- Commit b2d3dd4: FOUND
