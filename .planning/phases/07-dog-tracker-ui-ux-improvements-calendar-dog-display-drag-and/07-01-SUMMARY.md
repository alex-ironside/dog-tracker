---
plan: 07-01
phase: 07
subsystem: calendar
tags: [calendar, ux, dog-pills, highlight, hour-range, tdd]
dependency_graph:
  requires: []
  provides: [dog-name-pills, multi-walk-indicator, dog-highlight-control, flexible-calendar-height, hour-range-selector]
  affects: [ScheduledGroupCard, CalendarSlot, WeekCalendar, CalendarScheduler]
tech_stack:
  added: []
  patterns: [prop-threading, useMemo, localStorage-persistence, tdd-red-green]
key_files:
  created:
    - src/components/ScheduledGroupCard.test.tsx
  modified:
    - src/components/ScheduledGroupCard.tsx
    - src/components/CalendarSlot.tsx
    - src/components/WeekCalendar.tsx
    - src/components/CalendarScheduler.tsx
    - src/components/CalendarScheduler.test.tsx
decisions:
  - endHour default set to 19 (not 20) because HOURS = [7..19]; 20 is outside the array
  - Slot highlight (border-2 border-primary) skipped when isOver to avoid class conflict with drag ring
metrics:
  duration: 15m
  completed: 2026-04-13
  tasks_completed: 2
  files_modified: 5
  files_created: 1
---

# Phase 7 Plan 01: Calendar Improvements Summary

## One-liner

Dog name pills with x2 multi-walk badges, a dog-highlight spotlight select, flexible grid height, and an hour-range selector persisted to localStorage.

## What Was Built

### Task 1: Dog name pills + multi-walk indicator (commit 8a8dfbc)

- `ScheduledGroupCard` gains four new props: `dogNames`, `dogIds`, `multiWalkCounts: Map<string, number>`, `highlightDogId`.
- A second row renders inside the card — a `flex flex-wrap gap-1` strip of pill `<span>` elements, one per dog.
- Each pill shows `x{N}` badge (styled `text-primary font-bold`) when `multiWalkCounts.get(dogId) > 1`.
- Highlighted pills get `ring-2 ring-primary bg-primary/10` via the `cn()` utility.
- Card outer layout changed from `flex items-center justify-between` to `flex flex-col gap-1`; the original row is preserved as a nested `flex items-center justify-between` div.
- `CalendarSlot` now destructures `dogs` (was declared but not used), resolves dog names from `group.dogIds`, and accepts/passes `multiWalkCounts` and `highlightDogId`.
- When `highlightDogId` is set and the slot's group contains that dog, the slot cell gains `border-2 border-primary` (only when not in drag-over state).
- `WeekCalendar` accepts `multiWalkCountsByDay: Map<number, Map<string, number>>`, `highlightDogId`, and `hours: number[]`. It passes per-day counts to each `CalendarSlot` and drives `gridTemplateRows` from `hours.length`.
- `CalendarScheduler` computes `multiWalkCountsByDay` in a `useMemo` by iterating `walkSessions`.

### Task 2: Dog highlight control + fixed height removal + hour-range selector (commit 3193040)

- `highlightDogId` state + `<select>` rendered above the calendar grid listing all non-archived dogs.
- `startHour` / `endHour` state (defaults 8 / 19) read from and persisted to `localStorage` under `portfolio:calHours`.
- `filteredHours` computed with `HOURS.filter(h => h >= startHour && h <= endHour)` and passed as `hours` to `WeekCalendar`.
- Removed `h-[600px]` from the flex container in `CalendarScheduler`.
- Removed `overflow-auto` from the grid wrapper and `overflow-hidden` from the outer flex column in `WeekCalendar`.
- Added 4 new tests to `CalendarScheduler.test.tsx` (TDD: RED then GREEN).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] endHour default corrected from 20 to 19**
- **Found during:** Task 2 implementation
- **Issue:** Plan specified default `endHour: 20` but `HOURS = Array.from({ length: 13 }, (_, i) => i + 7)` only goes to 19. Using 20 would yield an empty `filteredHours` when start=8, end=20 (20 not in array, filter produces nothing past 19 anyway, but the select value wouldn't match any option).
- **Fix:** Default changed to 19 in both `CalendarScheduler` state initialization and test assertions.
- **Files modified:** `src/components/CalendarScheduler.tsx`, `src/components/CalendarScheduler.test.tsx`
- **Commit:** 3193040

**2. [Rule 2 - Missing] hour-range test assertions adapted for option elements**
- **Found during:** Task 2 TDD
- **Issue:** `queryByText('07:00')` threw "found multiple elements" because `<option>` elements in the selects also matched. Test needed to filter out option elements to check only row label cells.
- **Fix:** Tests use `queryAllByText` + filter by `el.tagName !== 'OPTION'`.
- **Files modified:** `src/components/CalendarScheduler.test.tsx`

## Known Stubs

None — all dog name data is wired from the store through `CalendarScheduler` → `WeekCalendar` → `CalendarSlot` → `ScheduledGroupCard`.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary changes. All data flows remain local (Zustand store + localStorage).

## Self-Check: PASSED

- src/components/ScheduledGroupCard.test.tsx — FOUND
- src/components/ScheduledGroupCard.tsx — FOUND
- src/components/CalendarSlot.tsx — FOUND
- src/components/WeekCalendar.tsx — FOUND
- src/components/CalendarScheduler.tsx — FOUND
- Commit 8a8dfbc — FOUND
- Commit 3193040 — FOUND
- All 215 tests pass (npm run test)
- npm run build passes with no type errors
