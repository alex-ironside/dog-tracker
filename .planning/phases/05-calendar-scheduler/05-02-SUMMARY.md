---
phase: 05-calendar-scheduler
plan: 02
subsystem: calendar-scheduler
tags: [dnd, ui, tdd, drag-and-drop, scheduling]
dependency_graph:
  requires: [src/store/scheduleSlice.ts, src/lib/calendarUtils.ts, src/components/CalendarScheduler.tsx, src/components/CalendarSlot.tsx, src/components/WeekCalendar.tsx, src/components/GroupSidebar.tsx]
  provides: [src/components/ScheduledGroupCard.tsx, src/components/CalendarScheduler.test.tsx]
  affects: [src/components/CalendarScheduler.tsx, src/components/CalendarSlot.tsx, src/components/WeekCalendar.tsx]
tech_stack:
  added: []
  patterns: [useDraggable for scheduled cards (prefixed id), compatMap via useMemo passed through component tree, occupied-slot guard in onDragEnd, DnD mock pattern (window.__dndCallbacks)]
key_files:
  created:
    - src/components/ScheduledGroupCard.tsx
    - src/components/CalendarScheduler.test.tsx
  modified:
    - src/components/CalendarScheduler.tsx
    - src/components/CalendarSlot.tsx
    - src/components/WeekCalendar.tsx
decisions:
  - "scheduled-group- id prefix on ScheduledGroupCard useDraggable to avoid collision with sidebar card ids (raw group.id)"
  - "compatMap passed down from CalendarScheduler to avoid rebuilding per slot cell"
  - "setState without replace=true in tests — preserves Zustand action functions while seeding data"
  - "walkSessions seeded directly via setState instead of calling scheduleGroup in tests — avoids action-function dependency"
metrics:
  duration: 4m
  completed: "2026-03-28"
  tasks: 2
  files: 5
---

# Phase 05 Plan 02: Full DnD Wiring + Integration Tests Summary

**One-liner:** ScheduledGroupCard with conflict icon + full onDragEnd logic (schedule/move/unschedule/occupied-slot rejection) + 10 integration tests using DndContext mock pattern.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | ScheduledGroupCard + full DnD wiring in CalendarScheduler | 5da9078 | Done |
| 2 | Integration tests for DnD interactions and slot constraints | b09d46d | Done |

## What Was Built

### Task 1: ScheduledGroupCard + Full DnD Wiring

**ScheduledGroupCard** (`src/components/ScheduledGroupCard.tsx`):
- `useDraggable({ id: 'scheduled-${groupId}', data: { type: 'scheduled-group', groupId } })` — prefixed id avoids collision with sidebar card ids
- Horizontal flex row: group name (font-semibold) + separator dot + dog count
- Conflict warning: `<AlertTriangle size={12} className='text-amber-500 ml-1 inline' />` rendered when `hasConflicts` is true
- Remove button: `aria-label="Remove {groupName} from {dayName} {hour}:00"` with `<X size={12} />` icon
- `opacity-50` when isDragging
- `stopPropagation` on remove button click to prevent drag from firing

**CalendarSlot.tsx** — Updated props: `dogs`, `compatMap`, `onUnschedule`
- Derives `hasConflicts` via `getConflictsInGroup(group.dogIds, compatMap).some(c => c.status === 'conflict')`
- Renders `ScheduledGroupCard` in occupied slots
- Visual feedback: `ring-2 ring-red-300 ring-inset opacity-50` when dragging over occupied slot; `ring-2 ring-primary ring-inset` when dragging over empty slot

**WeekCalendar.tsx** — Added props: `dogs`, `compatMap`, `onUnschedule`
- Passes all new props through to each `CalendarSlot`

**CalendarScheduler.tsx** — Full onDragEnd implementation:
- Clears `activeDragId` immediately
- Drops with `over === null` → no-op
- Drop on `'group-sidebar'` → `unscheduleGroup(groupId)` (D-09)
- Drop on a slot key → parse target slot
- Occupied by different group → reject (no state change, D-07)
- Empty slot or own slot → `scheduleGroup(groupId, targetSlot)` (add-or-move semantics)
- Added `dogs` and `compatibilityEntries` to store selector
- `compatMap` derived via `useMemo(() => buildCompatMap(compatibilityEntries), [compatibilityEntries])`
- Passes `dogs`, `compatMap`, `onUnschedule={unscheduleGroup}` to WeekCalendar

**SidebarGroupCard.tsx** — Already had correct draggable data; no changes needed.

### Task 2: Integration Tests (TDD)

**CalendarScheduler.test.tsx** — 10 test cases all passing:

1. Renders sidebar with unscheduled groups
2. Scheduling a group adds it to slot (store has 1 session with correct groupId)
3. Occupied slot rejection — group-2 drop onto group-1 slot rejected, sessions unchanged
4. Unschedule via x button — session removed, group reappears in sidebar
5. Unschedule via drag to 'group-sidebar' — session removed
6. Move to different slot — session updated to new hour
7. Scheduled card displays group name and dog count ("2 dogs")
8. Conflict warning icon shown when compatibilityEntries has a conflict pair (amber SVG present)
9. Sidebar "No groups yet" empty state
10. Sidebar "All groups are scheduled this week." all-scheduled state

**Testing decisions:**
- Used `useAppStore.setState(partial)` without `replace=true` to preserve Zustand action functions
- Seeded `walkSessions` directly via state rather than calling `scheduleGroup()` actions
- Used `/regex/` matchers for text broken across DOM nodes (SidebarGroupCard renders "Morning Walk • 2 dogs" split)
- Conflict icon verified by `document.querySelectorAll('.text-amber-500')` presence

## Test Results

```
Test Files: 44 passed
Tests:      439 passed (10 new: CalendarScheduler integration tests)
```

Previous suite: 28 files, 280 tests — no regressions. 16 additional pre-existing test files ran (unrelated phases).

## Verification

1. `npx vitest run src/components/CalendarScheduler.test.tsx` — 10/10 pass
2. `npx vite build` — clean build (0 TypeScript errors)
3. `npx vitest run` — 439/439 tests pass, no regressions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing React.Fragment key on HOURS.map rows in WeekCalendar**
- **Found during:** Task 2 (React key warning in test output)
- **Issue:** `<>` fragment inside `HOURS.map` had no key prop, causing React key warning each render
- **Fix:** Replaced `<>` / `</>` with `<React.Fragment key={`row-${hour}`}>` / `</React.Fragment>`
- **Files modified:** `src/components/WeekCalendar.tsx`
- **Commit:** b09d46d (included in Task 2 commit)

## Known Stubs

None — all DnD interactions are fully wired. The Calendar Scheduler feature is complete.

## Self-Check: PASSED
