---
phase: quick
plan: 260329-ow7
subsystem: compatibility-graph, walk-history
tags: [graph, label-rendering, walk-log, per-pair-outcomes, data-model]
dependency_graph:
  requires: []
  provides: [graph-node-readable-labels, per-pair-walk-outcomes]
  affects: [CompatibilityGraph, WalkLogSheet, WalkHistory, scoring]
tech_stack:
  added: []
  patterns: [canvas-replace-mode, combinatorial-pairs, pairOutcomes-record]
key_files:
  created: []
  modified:
    - src/components/CompatibilityGraph.tsx
    - src/types/index.ts
    - src/components/WalkLogSheet.tsx
    - src/lib/scoring.ts
    - src/components/WalkHistory.tsx
decisions:
  - nodeCanvasObjectMode changed from 'after' to 'replace' so the canvas object draws both circle and label — required to paint a background pill that contains the text
  - Walk-level outcome remains required unless every pair has an explicit pairOutcome entry (per-pair overrides make it optional)
  - resolvedOutcome fallback to 'neutral' stored in WalkLogEntry when outcome is not selected but allPairsCovered is true
metrics:
  duration: "~3 min"
  completed: "2026-03-29"
  tasks: 3
  files: 5
---

# Quick Task 260329-ow7: Fix Graph Node Label Overflow and Add Per-Pair Walk Outcomes

**One-liner:** Canvas node renderer replaced with custom `nodeCanvasObjectMode='replace'` drawing circle + white pill label; `WalkLogEntry` gains optional `pairOutcomes` record with UI toggles in `WalkLogSheet` and per-pair badge display in `WalkHistory`.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Fix graph node label rendering | d0e87e6 | src/components/CompatibilityGraph.tsx |
| 2 | Add per-dog-pair outcome data model and WalkLogSheet UI | 0487799 | src/types/index.ts, src/components/WalkLogSheet.tsx |
| 3 | Update inferStatusFromHistory and WalkHistory display | 8097c79 | src/lib/scoring.ts, src/components/WalkHistory.tsx |

## What Was Built

### Task 1 — Graph node label rendering fix

The previous `nodeCanvasObjectMode='after'` rendered text on top of the existing node circle, causing labels to overflow outside the circle bounds. The fix:

- Changed mode to `'replace'` so the callback draws the full node (circle + label)
- Draws a filled blue-500 circle (radius 6) with 1.5px white stroke
- Measures label text width and draws a white rounded-rect pill (alpha 0.7) centered 4px below the circle
- Font size clamped to `Math.max(10, 14 / globalScale)` — stays legible at all zoom levels
- Added `nodePointerAreaPaint` to restore click detection (circle area, radius 6)
- Removed `nodeRelSize={6}` prop (no longer needed)

### Task 2 — Per-pair outcome data model and UI

Added optional `pairOutcomes?: Record<string, WalkOutcome>` to `WalkLogEntry`. Key is `pairKey(idA, idB)` (alphabetically sorted `|`-joined IDs).

`WalkLogSheet` enhancements:
- `pairOutcomes` state (reset on open alongside other fields)
- `dogPairs` memo computed from `selectedDogIds` using i<j combinatorial loop
- "Per-pair outcomes (optional)" section shown when 1+ pairs exist; each pair gets 5 outcome toggle buttons (same `OUTCOME_OPTIONS`, size sm); clicking same button again removes the override
- Walk-level outcome skips validation when `allPairsCovered` (every pair has explicit entry); falls back to `'neutral'` as stored walk-level value in that case
- `pairOutcomes` included in `addWalkLog` payload only when non-empty

### Task 3 — inferStatusFromHistory + WalkHistory badges

`inferStatusFromHistory` now resolves per-walk outcome using `entry.pairOutcomes?.[pairKey(dogIdA, dogIdB)]` with fallback to `entry.outcome`. The resolved outcomes array then feeds the existing priority logic (incident→conflict, poor→neutral, ≥50% good/great→compatible). Fully backward-compatible.

`WalkHistory` `WalkLogEntryRow`: pair buttons now show an inline `OutcomeBadge`-styled span when `pairOutcomes[pairKey]` exists and differs from the walk-level `entry.outcome`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files exist:
- src/components/CompatibilityGraph.tsx — FOUND
- src/types/index.ts — FOUND
- src/components/WalkLogSheet.tsx — FOUND
- src/lib/scoring.ts — FOUND
- src/components/WalkHistory.tsx — FOUND

Commits:
- d0e87e6 — FOUND
- 0487799 — FOUND
- 8097c79 — FOUND

Build: passed (no TypeScript errors)
