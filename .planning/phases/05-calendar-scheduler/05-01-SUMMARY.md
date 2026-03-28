---
phase: 05-calendar-scheduler
plan: 01
subsystem: calendar-scheduler
tags: [store, dnd, calendar, ui, tdd]
dependency_graph:
  requires: [src/types/index.ts, src/store/index.ts, src/store/groupSlice.ts]
  provides: [src/store/scheduleSlice.ts, src/lib/calendarUtils.ts, src/components/CalendarScheduler.tsx, src/components/WeekCalendar.tsx, src/components/GroupSidebar.tsx, src/components/CalendarSlot.tsx, src/components/SidebarGroupCard.tsx]
  affects: [src/App.tsx, src/store/index.ts]
tech_stack:
  added: []
  patterns: [createScheduleSlice (Zustand slice), DndContext+DragOverlay (dnd-kit), useDroppable per slot cell, useDraggable group cards, CSS Grid calendar layout, useShallow selector]
key_files:
  created:
    - src/store/scheduleSlice.ts
    - src/store/scheduleSlice.test.ts
    - src/lib/calendarUtils.ts
    - src/lib/calendarUtils.test.ts
    - src/components/CalendarScheduler.tsx
    - src/components/GroupSidebar.tsx
    - src/components/SidebarGroupCard.tsx
    - src/components/WeekCalendar.tsx
    - src/components/CalendarSlot.tsx
  modified:
    - src/store/index.ts
    - src/App.tsx
decisions:
  - "onDragEnd in CalendarScheduler is a stub — Plan 02 wires occupied-slot guard and store actions"
  - "scheduleGroup does not reject occupied slots — that guard lives in onDragEnd (Plan 02)"
  - "CalendarSlot renders session data from real store sessionMap, not placeholder data"
metrics:
  duration: 5m
  completed: "2026-03-28"
  tasks: 2
  files: 11
---

# Phase 05 Plan 01: Schedule Data Layer + Calendar Tab UI Skeleton Summary

**One-liner:** Zustand scheduleSlice (add-or-move semantics) + calendarUtils + full Calendar tab split-panel UI with CSS Grid weekly view, draggable group sidebar, and Droppable slot cells.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | scheduleSlice + calendarUtils with TDD | 14fc686 | Done |
| 2 | Calendar tab UI — CalendarScheduler, GroupSidebar, WeekCalendar, CalendarSlot, App.tsx tab | ca55f1d | Done |

## What Was Built

### Task 1: scheduleSlice + calendarUtils (TDD)

**RED → GREEN cycle:**
- Wrote failing tests for `scheduleSlice` and `calendarUtils` before implementation
- Both test files failed on import (files didn't exist) — confirmed RED
- Implemented `calendarUtils.ts` and `scheduleSlice.ts` — all 18 tests went GREEN

**scheduleSlice** (`src/store/scheduleSlice.ts`):
- `scheduleGroup(groupId, slot)` — add-or-move: removes existing session for group before adding new one
- `unscheduleGroup(groupId)` — removes session by groupId, no-op if not found
- `clearSlot(slot)` — removes session by dayOfWeek+hour+minute match, no-op if empty
- No occupied-slot guard (intentional — that logic goes in `onDragEnd`, Plan 02)
- Wired into `AppStore` type and store creator in `src/store/index.ts`

**calendarUtils** (`src/lib/calendarUtils.ts`):
- `slotKey(slot)` → `"dayOfWeek:hour:minute"` string (canonical key for sessionMap lookups)
- `parseSlotKey(key)` → `TimeSlot` (reverse of slotKey)
- `HOURS` = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] (13 entries, 07:00-19:00)
- `getMondayOfWeek(weekOffset)` → Date (Monday of current week + offset)
- `getWeekDays(weekOffset)` → 7 Dates (Mon-Sun)
- `formatColumnHeader(date)` → `"Mon 24"` format
- `formatWeekLabel(monday)` → `"Week of Mon, 24 Mar 2026"` format

### Task 2: Calendar Tab UI

**CalendarScheduler** (`src/components/CalendarScheduler.tsx`):
- `DndContext` wrapper with PointerSensor (distance: 8) + KeyboardSensor
- Local state: `weekOffset` (0 = current week), `activeDragId`
- `sessionMap` (O(1) lookup by slotKey), `scheduledGroupIds` (Set) derived via useMemo
- `handleDragEnd` is a stub (logs nothing, clears activeDragId) — Plan 02 wires full logic
- `DragOverlay` shows group name + dog count card with opacity-70

**GroupSidebar** (`src/components/GroupSidebar.tsx`):
- `useDroppable({ id: 'group-sidebar' })` — drop target for drag-back unschedule
- Filters `walkGroups` to only show unscheduled ones
- Empty states: "No groups yet" (none exist) / "All groups are scheduled" (all placed)
- `bg-slate-100` highlight when `isOver`

**SidebarGroupCard** (`src/components/SidebarGroupCard.tsx`):
- `useDraggable({ id: group.id, data: { type: 'group', groupId: group.id } })`
- `opacity-50` when dragging, `cursor-grab` styling

**WeekCalendar** (`src/components/WeekCalendar.tsx`):
- CSS Grid: `64px repeat(7, 1fr)` columns × `40px repeat(13, 64px)` rows
- Sticky corner (z-30), sticky day headers (z-20), sticky hour labels (z-10)
- Week navigation with ChevronLeft/ChevronRight buttons, aria-labels
- `getDay()` used directly for `dayOfWeek` — correct JS convention (0=Sun, 1=Mon...6=Sat)

**CalendarSlot** (`src/components/CalendarSlot.tsx`):
- `useDroppable({ id: slotKeyStr })` per cell
- `ring-2 ring-primary ring-inset` when `isOver`
- Renders session group name + dog count if slot occupied
- `aria-label` describes occupied/empty state

**App.tsx changes:**
- Fourth tab "Calendar" added after Groups
- `activeTab` type extended to `'dogs' | 'compatibility' | 'groups' | 'calendar'`
- `CalendarScheduler` renders at full height (no wrapper padding — same pattern as GroupBuilder)

## Test Results

```
Test Files: 28 passed
Tests:      280 passed (18 new: 9 scheduleSlice + 9 calendarUtils)
```

Previous suite: 26 files, 262 tests — no regressions.

## Verification

1. `npx vitest run src/store/scheduleSlice.test.ts src/lib/calendarUtils.test.ts` — 18/18 pass
2. `npx vite build` — clean build (0 TypeScript errors)
3. `npx vitest run` — 280/280 tests pass, no regressions

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `handleDragEnd` (clears activeDragId only, no store dispatch) | `src/components/CalendarScheduler.tsx:54` | Intentional per plan — Plan 02 wires full DnD logic including occupied-slot guard |

The stub does not block the plan's goal (data layer + visual surface established). Plan 02 completes the DnD wiring.
