---
phase: "07"
plan: "07-02"
subsystem: "group-builder"
tags: ["dnd-kit", "drag-and-drop", "bug-fix", "tdd"]
dependency_graph:
  requires: []
  provides: ["unique-draggable-ids-per-group"]
  affects: ["MiniDogCard", "GroupPanel", "GroupBuilder", "RosterRow"]
tech_stack:
  added: []
  patterns: ["composite-draggable-id", "dnd-kit-data-payload"]
key_files:
  created:
    - src/components/MiniDogCard.test.tsx
  modified:
    - src/components/MiniDogCard.tsx
    - src/components/GroupPanel.tsx
    - src/components/GroupBuilder.tsx
    - src/components/GroupBuilder.test.tsx
    - src/components/RosterRow.tsx
decisions:
  - "Use data payload (event.active.data.current.dogId) instead of parsing composite ID string — cleaner and future-proof"
  - "GroupPanel.tsx updated in Task 1 commit to prevent build breakage from required groupId prop"
  - "RosterRow given data: { dogId } for consistency even though plain id still works (dogs are unique in roster)"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-13"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 6
---

# Phase 07 Plan 02: Group Builder DnD Fix Summary

## One-liner

Fixed duplicate draggable ID bug by scoping MiniDogCard IDs to `${groupId}-${dogId}` and threading dogId via dnd-kit data payload.

## What Was Built

The group builder drag-and-drop had a bug: when a dog appeared in multiple groups, all its MiniDogCards shared the same draggable ID (`dog.id`). dnd-kit treats later registrations as overwriting earlier ones, causing all copies to move when any one is dragged.

### Task 1 — MiniDogCard unique draggable ID

- Added `groupId: string` prop to `MiniDogCardProps`
- Changed `useDraggable({ id: dogId })` to `useDraggable({ id: \`${groupId}-${dogId}\`, data: { dogId, groupId } })`
- Updated `GroupPanel.tsx` to pass `groupId={group.id}` to each `MiniDogCard` (required to keep build green)
- Created `MiniDogCard.test.tsx` with mocked `useDraggable` asserting composite ID and data payload

### Task 2 — GroupBuilder onDragEnd data payload extraction

- `handleDragEnd`: extracts `dogId` from `event.active.data.current.dogId` with fallback to `event.active.id` for backward compat
- `handleDragStart`: same extraction so `activeDragId` (used by DragOverlay) holds the plain dog ID, not composite
- `RosterRow.tsx`: added `data: { dogId: dog.id }` to `useDraggable` call for consistency
- Updated `GroupBuilder.test.tsx`: replaced plain-ID drag events with composite-ID events + data payload; added 4 new scenario tests

## Verification

- `npm run build` — passes, no TypeScript errors
- `npm run test:run` — 212 tests pass across 24 test files (no regressions)
- Manual scenario: dog in two groups → drag one card → only that card moves

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated GroupPanel.tsx in Task 1 to avoid build breakage**
- **Found during:** Task 1 implementation
- **Issue:** Making `groupId` a required prop on `MiniDogCard` would immediately break `GroupPanel.tsx` which renders `<MiniDogCard>` without `groupId`. The build and all tests would fail between Task 1 and Task 2 commits.
- **Fix:** Added `groupId={group.id}` to `GroupPanel.tsx`'s `MiniDogCard` render in the same Task 1 commit.
- **Files modified:** `src/components/GroupPanel.tsx`
- **Commit:** 6452710

## Known Stubs

None — all changes are functional, no placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

Files created/modified:
- src/components/MiniDogCard.test.tsx — FOUND
- src/components/MiniDogCard.tsx — FOUND
- src/components/GroupPanel.tsx — FOUND
- src/components/GroupBuilder.tsx — FOUND
- src/components/GroupBuilder.test.tsx — FOUND
- src/components/RosterRow.tsx — FOUND

Commits:
- 6452710 — FOUND: feat(07-02): add groupId prop to MiniDogCard with composite draggable ID
- 8657b74 — FOUND: feat(07-02): update GroupBuilder handleDragEnd to use data payload for dogId
