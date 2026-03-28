# Phase 5: Calendar Scheduler - Research

**Researched:** 2026-03-28
**Domain:** React drag-and-drop calendar grid, Zustand slice, dnd-kit DndContext architecture
**Confidence:** HIGH

## Summary

Phase 5 builds a two-panel Calendar tab: a left sidebar listing draggable walk groups and a right CSS Grid weekly calendar (07:00–19:00, 7 days). The user drags groups into slots. The schedule is persisted to LocalStorage via the existing Zustand persist layer.

Three important discoveries from codebase reading change the implementation picture relative to the CONTEXT.md decisions:

First, `WalkSession`, `TimeSlot`, and `walkSessions: WalkSession[]` are already defined in `src/types/index.ts` and `src/store/index.ts` — the data shape for schedule entries exists. The schedule slice must use or replace this field; it cannot ignore it (the persisted store already serialises `walkSessions`). The recommended approach is to use `walkSessions: WalkSession[]` as the persisted data store and derive a lookup map (slot key → WalkSession) in the component or via a store selector. This avoids a migration and keeps the type system consistent.

Second, dnd-kit DndContexts are completely isolated — a Draggable in one DndContext cannot drop onto a Droppable in a different DndContext. Decision D-06 ("separate DndContext for Calendar tab") means the Calendar's DndContext is separate from GroupBuilder's DndContext, which is safe because the two tabs are never rendered simultaneously. Inside the Calendar tab, the group sidebar and the calendar grid MUST share one DndContext. This is the correct interpretation of D-06.

Third, no date utility library (date-fns, dayjs, Temporal) is installed. Week navigation math must use vanilla JS Date methods.

**Primary recommendation:** Use `walkSessions: WalkSession[]` (already in AppState) as the persisted schedule; implement `scheduleSlice` actions that operate on this array; derive a `Map<slotKey, WalkSession>` in the component for O(1) drop-target lookup. Wrap the entire CalendarScheduler component (sidebar + grid) in one DndContext.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Add a fourth tab "Calendar" to App.tsx. Tab order: Dogs | Compatibility | Groups | Calendar. Same tab bar pattern as prior phases.
- D-02: Split-panel layout — left sidebar listing available groups (draggable), right side showing the CSS Grid weekly calendar. Mirrors the Group Builder two-panel pattern.
- D-03: Groups that are scheduled appear greyed out (or removed) from the sidebar; only unscheduled groups are available to drag.
- D-04: Calendar shows a specific week with Prev / Next navigation arrows and a "Week of [date]" label. Displayed week offset is local UI state (not persisted). Default is the current calendar week on mount.
- D-05: Column headers show abbreviated day names and dates ("Mon 24", "Tue 25"). Row labels show hour times ("07:00", "08:00", …, "19:00").
- D-06: A second DndContext wraps the Calendar tab, separate from Group Builder's DndContext — they are on different tabs so there is no conflict.
- D-07: One-group-per-slot constraint enforced on drop (CAL-03). If a slot is occupied, the drop is rejected.
- D-08: A group can only be in one slot at a time. Dropping into a new slot first removes it from any previous slot.
- D-09: Both unschedule methods supported (CAL-05): × button on scheduled group card, and drag the card from slot back to the group sidebar.
- D-10: Scheduled slot cards show: group name + dog count + ⚠ conflict warning icon if any conflict pairs exist. Example: "Group 1 • 4 dogs ⚠". Consistent with Group Builder header pattern.
- D-11: scheduleSlice stores schedule as a map keyed by `{weekOffset}:{dayOfWeek}:{hour}` (or similar canonical string key) → groupId. Week offset is integer relative to ISO week of app init, or stored as `{ isoWeek, year }` — researcher decides cleanest canonical key scheme satisfying CAL-06 (no epoch timestamps).
- D-12: scheduleSlice follows the same Zustand StateCreator<AppState & AllActions> slice pattern as groupSlice, dogSlice, and compatSlice. Persisted to LocalStorage via the existing persist layer.

### Claude's Discretion
- Exact CSS Grid implementation for the calendar (row = hour, col = day is conventional).
- Sidebar group card appearance — follow existing MiniDogCard / RosterRow aesthetic from Phase 4.
- Whether the week offset state lives in local component state or a lightweight uiSlice — recommend the cleanest approach.
- Tailwind styling details — slate palette, shadcn/ui patterns, consistent with existing app.

### Deferred Ideas (OUT OF SCOPE)
- Click slot to view group details (open a detail sheet showing dogs, score, conflict list). Phase 5.1 or 6 candidate.
- Persist current week offset to LocalStorage. Local UI state only for now.
- Auto-schedule suggestions using suggestGroups. Post-v1 (SUGG-01).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAL-01 | Weekly calendar grid with hour slots (07:00–19:00) | CSS Grid 7-col × 13-row layout; sticky headers via position:sticky in overflow scroll container |
| CAL-02 | Drag walk group from group builder into hour slot | Single DndContext wrapping sidebar + grid; useDroppable on each slot cell |
| CAL-03 | One group per slot; one slot per group | onDragEnd guard: reject if slot occupied (D-07); remove-then-add if group already scheduled (D-08) |
| CAL-04 | Scheduled slots show group name + dog count | Slot card renders WalkSession → WalkGroup lookup → name + dogIds.length |
| CAL-05 | Unschedule via × button or drag back to sidebar | × button calls removeSession action; sidebar is a Droppable with id 'group-sidebar' |
| CAL-06 | Slots stored as { dayOfWeek, hour, minute } — not epoch timestamps | TimeSlot type already exists in types/index.ts; WalkSession uses it |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| @dnd-kit/core | 6.3.1 | DndContext, useDraggable, useDroppable, DragOverlay | Already installed from Phase 4; project standard |
| zustand | 5.0.12 | scheduleSlice state | Already installed; project standard |
| react | 18.3.1 | Component rendering | Project standard |
| tailwindcss | 3.4.19 | CSS Grid utility classes, sticky positioning | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.7.0 | X (close) icon for unschedule button | Already used in GroupPanel for Trash2/AlertTriangle |
| @testing-library/react | 16.3.2 | Component tests | All new components |
| vitest | 2.1.9 | Test runner | All new tests |

### Not Needed
No date utility library (date-fns, dayjs) is required. The week navigation math is simple enough for vanilla JS — the project has no date library installed and adding one would be disproportionate.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── CalendarScheduler.tsx   # Top-level: DndContext wrapper + split panel
│   ├── GroupSidebar.tsx        # Left panel: draggable group cards (unscheduled only)
│   ├── WeekCalendar.tsx        # Right panel: CSS Grid + week nav
│   └── SlotCard.tsx            # Scheduled group card within a slot cell
├── store/
│   └── scheduleSlice.ts        # scheduleActions (addSession, removeSession, moveSession)
```

### Pattern 1: DndContext Architecture for the Calendar Tab

**What:** One DndContext wraps the entire CalendarScheduler component (GroupSidebar + WeekCalendar). The sidebar is a Droppable zone (id: `'group-sidebar'`). Each hour-slot cell is a Droppable (id: the slot key string). Group cards in the sidebar are Draggable with `data: { type: 'group', groupId }`. Slot cards (already scheduled) are also Draggable with `data: { type: 'scheduled-group', groupId, slotKey }`.

**Critical constraint (HIGH confidence, verified from dnd-kit official docs):** Draggables and Droppables cannot cross DndContext boundaries. A Draggable registered in Context A will never fire `onDragEnd` with an `over` target from Context B. D-06's intent — "separate from GroupBuilder's DndContext" — is correct and feasible because GroupBuilder and CalendarScheduler are on different tabs and are never in the DOM simultaneously. Inside CalendarScheduler, everything must share one DndContext.

**When to use:** Always for CalendarScheduler. The GroupBuilder's DndContext is unaffected.

**Example (mirrors GroupBuilder.tsx pattern):**
```typescript
// Source: src/components/GroupBuilder.tsx (existing)
export function CalendarScheduler() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const draggedGroupId = active.data.current?.groupId as string
    const overId = over.id as string

    if (overId === 'group-sidebar') {
      // Drag back to sidebar = unschedule
      removeSession(draggedGroupId)
    } else {
      // overId is a slot key — schedule the group
      scheduleGroup(draggedGroupId, overId, weekOffset)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className='flex h-full'>
        <GroupSidebar />
        <WeekCalendar weekOffset={weekOffset} />
      </div>
      <DragOverlay>...</DragOverlay>
    </DndContext>
  )
}
```

### Pattern 2: Slot Key Scheme (CAL-06 compliance)

**What:** Canonical string key for a calendar slot that encodes no epoch timestamp and is DST-safe.

**Decision — use `{isoYear}-W{isoWeek}:{dayOfWeek}:{hour}:{minute}`**

Rationale:
- Encodes ISO year + ISO week number + day-of-week (0–6) + hour + minute
- Fully human-readable, debuggable in DevTools
- DST-safe: no timestamps, no UTC offset involved
- Unique across years (isoYear prevents collision between e.g. W01 of 2025 and W01 of 2026)
- The `weekOffset` in local UI state is used to COMPUTE the isoYear/isoWeek pair for display, but the key stored in WalkSession.slot uses TimeSlot's `dayOfWeek + hour + minute` — not the week identifier. Week navigation loads the grid view for a given week; the persisted WalkSession stores which recurring slot (day-of-week, hour) the group is in, independent of week number.

**Revised recommendation — reconciling D-11 with the existing `walkSessions` field:**

The existing `WalkSession` type already uses `TimeSlot = { dayOfWeek: 0|1|2|3|4|5|6, hour: number, minute: number }`. This already satisfies CAL-06. The schedule slice should operate on `walkSessions: WalkSession[]`.

The "map keyed by canonical string" from D-11 is a runtime lookup optimization, not the persisted shape. In the component, derive:
```typescript
const sessionMap = useMemo(
  () => new Map(walkSessions.map(s => [slotKey(s.slot), s])),
  [walkSessions]
)
```

Where `slotKey` is:
```typescript
function slotKey(slot: TimeSlot): string {
  return `${slot.dayOfWeek}:${slot.hour}:${slot.minute}`
}
```

This key is stable (no week identity needed) because schedules are "recurring" — a session at Monday 09:00 applies every week. Week navigation only affects the display dates in column headers, not the schedule data. This aligns with how the `WalkSession` type is defined.

### Pattern 3: Week Navigation Math (vanilla JS, no date library)

**What:** Given `weekOffset: number` (0 = current week, +1 = next week, -1 = last week), compute the Monday Date of the displayed week. Then derive the 7 day Dates for column headers.

```typescript
// Source: vanilla JS, MDN-verified approach
function getMondayOfWeek(weekOffset: number): Date {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 1=Mon...6=Sat
  // Distance from today back to Monday
  const distToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + distToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekDays(weekOffset: number): Date[] {
  const monday = getMondayOfWeek(weekOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

// Format: "Mon 24"
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function formatColumnHeader(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()}`
}

// "Week of Mon 24 Mar"
function formatWeekLabel(monday: Date): string {
  return `Week of ${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}
```

**DST safety:** All operations use local calendar date arithmetic (`setDate` / `getDate`). No epoch arithmetic, no UTC conversion. getDate/setDate adjust within the local timezone, so DST transitions (which shift the wall clock by 1 hour) do not cause the date to change.

**Week offset state:** Local `useState<number>` in CalendarScheduler. Not persisted (per deferred list).

### Pattern 4: CSS Grid Calendar Layout

**What:** A scrollable container with a CSS Grid that supports sticky row labels and sticky column headers.

**Grid structure:**
```
[empty corner] [Mon 24] [Tue 25] [Wed 26] [Thu 27] [Fri 28] [Sat 29] [Sun 30]
[07:00]        [cell]   [cell]   ...
[08:00]        [cell]   ...
...
[19:00]        [cell]   ...
```

8 columns (1 label + 7 days), 14 rows (1 header + 13 hours 07–19 inclusive).

**Tailwind approach:**
```tsx
// Outer scroll container
<div className='overflow-auto flex-1'>
  {/* CSS Grid — 8 cols: 64px label + 7 equal day cols */}
  <div
    className='grid min-w-[640px]'
    style={{
      gridTemplateColumns: '64px repeat(7, 1fr)',
      gridTemplateRows: '40px repeat(13, 64px)',
    }}
  >
    {/* Corner cell */}
    <div className='sticky top-0 left-0 z-30 bg-white border-b border-r border-slate-200' />

    {/* Day headers — sticky top */}
    {weekDays.map((date) => (
      <div key={date.toISOString()} className='sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600'>
        {formatColumnHeader(date)}
      </div>
    ))}

    {/* Hour rows */}
    {HOURS.map((hour) => (
      <>
        {/* Row label — sticky left */}
        <div key={`label-${hour}`} className='sticky left-0 z-10 bg-white border-b border-r border-slate-200 flex items-center justify-center text-xs text-slate-500'>
          {String(hour).padStart(2, '0')}:00
        </div>

        {/* Slot cells — one per day */}
        {weekDays.map((_, dayIndex) => (
          <SlotCell key={`${dayIndex}-${hour}`} dayOfWeek={dayIndex} hour={hour} />
        ))}
      </>
    ))}
  </div>
</div>
```

**Sticky header technique (HIGH confidence):** `position: sticky` works inside CSS Grid items. Column headers use `sticky top-0`. Row labels use `sticky left-0`. The corner cell uses both (`sticky top-0 left-0`) and a higher z-index (z-30) so it overlaps both axes when scrolling. The scroll container must be the element with `overflow-auto`, not the window.

**HOURS array:**
```typescript
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // [7,8,...,19]
```

### Pattern 5: scheduleSlice Design

**State shape:** Use the existing `walkSessions: WalkSession[]` field in AppState. Do not add a new top-level field (avoids migration).

**Actions:**
```typescript
export type ScheduleActions = {
  scheduleGroup: (groupId: string, slot: TimeSlot) => void   // add or move
  unscheduleGroup: (groupId: string) => void                  // remove by groupId
  clearSlot: (slot: TimeSlot) => void                         // remove by slot
}
```

**Implementation (follows groupSlice pattern exactly):**
```typescript
// Source: src/store/groupSlice.ts pattern
export const createScheduleSlice: StateCreator<AppState & ScheduleActions, [], [], ScheduleActions> = (set) => ({
  scheduleGroup: (groupId, slot) => set((state) => {
    // Remove any existing session for this group (D-08: one slot per group)
    const filtered = state.walkSessions.filter((s) => s.groupId !== groupId)
    // Also remove any existing session in this slot (D-07: one group per slot)
    const cleared = filtered.filter(
      (s) => !(s.slot.dayOfWeek === slot.dayOfWeek && s.slot.hour === slot.hour && s.slot.minute === slot.minute)
    )
    return {
      walkSessions: [...cleared, { id: crypto.randomUUID(), groupId, slot }],
    }
  }),
  unscheduleGroup: (groupId) => set((state) => ({
    walkSessions: state.walkSessions.filter((s) => s.groupId !== groupId),
  })),
  clearSlot: (slot) => set((state) => ({
    walkSessions: state.walkSessions.filter(
      (s) => !(s.slot.dayOfWeek === slot.dayOfWeek && s.slot.hour === slot.hour && s.slot.minute === slot.minute)
    ),
  })),
})
```

**Note on D-07 (reject occupied slot):** The drop guard in `onDragEnd` should check whether the target slot is occupied before calling `scheduleGroup`. If occupied AND the dragged group is not the current occupant, return without calling scheduleGroup. If the dragged item IS the current occupant (user dropped it back in the same slot), it is a no-op. If the dragged group is from the sidebar and the slot is occupied, reject. This logic lives in the component's `onDragEnd`, not in the slice action.

**Alternative considered — `scheduleGroup` rejects on occupied slot:** Putting the reject logic in the slice means the component cannot tell whether a drop was accepted or rejected for DragOverlay feedback. The component is a better place for this guard.

### Pattern 6: GroupSidebar Droppable (drag-back unschedule)

The sidebar is a Droppable zone that accepts drop events for scheduled group cards being dragged back. Same pattern as `RosterPanel` in GroupBuilder.tsx:

```typescript
function GroupSidebar() {
  const { setNodeRef, isOver } = useDroppable({ id: 'group-sidebar' })
  // ...
  return (
    <div ref={setNodeRef} className={`... ${isOver ? 'bg-slate-100' : 'bg-slate-50'}`}>
      {unscheduledGroups.map((group) => (
        <DraggableGroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}
```

In `onDragEnd`:
```typescript
if (over.id === 'group-sidebar') {
  unscheduleGroup(active.data.current.groupId)
}
```

### Anti-Patterns to Avoid

- **Two DndContexts within CalendarScheduler:** Cross-context drag is impossible in dnd-kit. Do not create one DndContext for the sidebar and another for the grid.
- **Epoch timestamps in slot keys:** Violates CAL-06. Do not use `Date.getTime()`, `new Date().toISOString()`, or UTC milliseconds as slot identifiers.
- **weekOffset in the store:** Week navigation is local UI state. Do not persist it (per deferred list in CONTEXT.md).
- **Adding a new `schedule` field to AppState:** `walkSessions: WalkSession[]` is already in AppState and persisted. Introducing a second schedule-related field would require a migration and duplicate the concept.
- **Slot cells as Draggable:** Only group cards are Draggable. Slot cells are Droppable. Scheduled cards in slots are also Draggable (to support drag-back-to-sidebar).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag and drop | Custom pointer event tracking | @dnd-kit/core | Already installed; handles accessibility, keyboard, pointer, touch |
| Slot key collision detection | Custom hash | Simple string template + Map lookup | O(1) lookup with Map; trivially testable |
| Week date arithmetic | Custom calendar library | Vanilla JS setDate/getDate | Sufficient for weekly offset; no DST edge cases at this level |
| Conflict detection | New implementation | Existing `getConflictsInGroup` from scoring.ts | Already tested; identical requirement to Group Builder |

**Key insight:** dnd-kit's data property on `useDraggable` and `useDroppable` is the correct mechanism to distinguish dragged item types and accepted drop targets within a single DndContext — no external type registry needed.

---

## Common Pitfalls

### Pitfall 1: DndContext Isolation (CRITICAL)
**What goes wrong:** Developer creates two separate DndContexts — one for the group sidebar and one for the calendar grid — expecting drag to work across them.
**Why it happens:** D-06 says "separate DndContext" which could be misread as "two DndContexts inside CalendarScheduler".
**How to avoid:** One DndContext wraps the entire CalendarScheduler component. D-06 means separate from GroupBuilder's DndContext, not internal separation.
**Warning signs:** `onDragEnd` fires with `over === null` when dropping onto a calendar cell.

### Pitfall 2: walkSessions Already Persisted
**What goes wrong:** Developer adds a new `schedule: Record<string, string>` field to AppState, adds it to `partialize`, and bumps schemaVersion — but `walkSessions` still exists and is persisted in parallel, creating two sources of truth.
**Why it happens:** D-11 describes a "map" which sounds like a new field.
**How to avoid:** Use `walkSessions: WalkSession[]` as the persisted array. Derive a map in the component via `useMemo`. Do not add a new field.
**Warning signs:** Two schedule-related fields in AppState; `partialize` in index.ts includes both.

### Pitfall 3: Sticky Headers Not Sticking
**What goes wrong:** `position: sticky` on grid children does not work because the scroll container is `overflow: visible` or `overflow: hidden`.
**Why it happens:** sticky requires a scrollable ancestor with `overflow: auto` or `overflow: scroll`.
**How to avoid:** Wrap the CSS Grid in a `div` with `overflow-auto` (Tailwind) or `overflow: auto` (CSS). The `flex-1` panel must also not clip the sticky children.
**Warning signs:** Headers scroll away with the content.

### Pitfall 4: dayOfWeek Convention
**What goes wrong:** `Date.getDay()` returns 0 for Sunday, 1 for Monday. The grid is Mon–Sun. Using `getDay()` directly for column index gives Sunday as column 0.
**Why it happens:** JS uses Sunday=0 convention; ISO uses Monday=1.
**How to avoid:** In `getMondayOfWeek`, correct for Sunday: `day === 0 ? -6 : 1 - day`. For column index in the grid, use `(date.getDay() + 6) % 7` (Monday=0, Sunday=6) to match grid column order.
**Warning signs:** Schedule appears on wrong column, especially for Sunday.

### Pitfall 5: store.test.ts Hard-codes walkSessions in setState
**What goes wrong:** `store.test.ts` already hard-codes `walkSessions: []` in `beforeEach`. After wiring `createScheduleSlice`, if scheduleActions require new initial state not provided by `setState`, tests break.
**Why it happens:** The test resets state manually without matching the new slice shape.
**How to avoid:** Add schedule actions to the store reset in beforeEach: the existing `walkSessions: []` is sufficient since `scheduleSlice` operates on that field. No change to store.test.ts needed for the state shape, only for the `AppStore` type export.

### Pitfall 6: DragOverlay Requires Separate Draggable Rendering
**What goes wrong:** DragOverlay renders outside the DndContext scroll container. If the DragOverlay child tries to call `useDroppable` or `useDraggable` directly, it throws.
**Why it happens:** DragOverlay is a portal; its children are not sensors-aware.
**How to avoid:** DragOverlay renders a plain presentational component (just the visual card), not a draggable/droppable component. Pass `activeDragId` as state and render the appropriate card appearance.

---

## Code Examples

Verified patterns from existing codebase:

### slotKey helper
```typescript
// Derive from existing TimeSlot type in src/types/index.ts
import type { TimeSlot } from '@/types'

export function slotKey(slot: TimeSlot): string {
  return `${slot.dayOfWeek}:${slot.hour}:${slot.minute}`
}
```

### scheduleSlice wiring in index.ts
```typescript
// Mirrors existing pattern in src/store/index.ts
import { createScheduleSlice, type ScheduleActions } from './scheduleSlice'

export type AppStore = AppState & DogActions & CompatActions & GroupActions & ScheduleActions

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dogs: [],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
      ...createDogSlice(...a),
      ...createCompatSlice(...a),
      ...createGroupSlice(...a),
      ...createScheduleSlice(...a),
    }),
    {
      // partialize already includes walkSessions — no change needed
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        dogs: state.dogs,
        walkGroups: state.walkGroups,
        compatibilityEntries: state.compatibilityEntries,
        walkSessions: state.walkSessions,
      }),
    }
  )
)
```

### Conflict warning in slot card
```typescript
// Uses existing getConflictsInGroup from src/lib/scoring.ts
import { getConflictsInGroup, buildCompatMap } from '@/lib/scoring'

// In slot card component:
const compatMap = useMemo(() => buildCompatMap(compatibilityEntries), [compatibilityEntries])
const conflicts = getConflictsInGroup(group.dogIds, compatMap)
const hasConflicts = conflicts.some((c) => c.status === 'conflict')

// Render:
<span>{group.name} • {group.dogIds.length} dogs {hasConflicts && <AlertTriangle size={12} className='text-amber-500 inline' />}</span>
```

### dnd-kit mock pattern for tests (from GroupBuilder.test.tsx)
```typescript
// Reuse the same mock pattern established in Phase 4
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    DndContext: ({ onDragEnd, onDragStart, children }: any) => {
      ;(window as any).__dndCallbacks = { onDragEnd, onDragStart }
      return <>{children}</>
    },
    DragOverlay: ({ children }: any) => <>{children}</>,
    useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
    useDraggable: () => ({ setNodeRef: () => {}, attributes: {}, listeners: {}, transform: null, isDragging: false }),
    useSensor: (_sensor: any, _opts?: any) => null,
    useSensors: (..._args: any[]) => [],
  }
})
```

---

## Data Layer Deep Dive

### Existing Types (already in src/types/index.ts)
```typescript
export type TimeSlot = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  hour: number
  minute: number
}

export type WalkSession = {
  id: string
  groupId: string
  slot: TimeSlot
}

export type AppState = {
  // ...existing fields...
  walkSessions: WalkSession[]   // already persisted in partialize
}
```

No new types need to be added to `src/types/index.ts`. The implementer should NOT define `ScheduleEntry` or `ScheduleSlot` — the existing types cover all requirements. The `minute` field in `TimeSlot` is always `0` for this phase (hour-granularity grid).

### No Types Migration Required
`walkSessions: WalkSession[]` is already in `AppState` and in the `partialize` function in `index.ts`. No new field, no new migration. `CURRENT_SCHEMA_VERSION` remains `1`.

### scheduleSlice TypeScript signature
```typescript
// src/store/scheduleSlice.ts
import type { StateCreator } from 'zustand'
import type { AppState, TimeSlot } from '@/types'

export type ScheduleActions = {
  scheduleGroup: (groupId: string, slot: TimeSlot) => void
  unscheduleGroup: (groupId: string) => void
  clearSlot: (slot: TimeSlot) => void
}

export const createScheduleSlice: StateCreator<
  AppState & ScheduleActions,
  [],
  [],
  ScheduleActions
> = (set) => ({ /* see Architecture Patterns → Pattern 5 */ })
```

---

## Migration Requirements

**No migration needed.** `walkSessions: WalkSession[]` is already in `AppState`, already in `partialize`, and already serialised to LocalStorage by the existing persist layer. `CURRENT_SCHEMA_VERSION` stays at `1`. `migrations.ts` does not need to change.

**Reason no migration is needed:** The persisted schema for existing users already has `walkSessions: []` (an empty array from store initialisation). Adding schedule actions that operate on this field does not change the schema shape — a user upgrading from a version without schedule actions will have `walkSessions: []` which is a valid initial state.

---

## App.tsx Changes

The App.tsx `activeTab` type expands from `'dogs' | 'compatibility' | 'groups'` to `'dogs' | 'compatibility' | 'groups' | 'calendar'`. A fourth `<button role='tab'>` and a fourth conditional render `<CalendarScheduler />` are added. The tab panel `div className='flex-1'` must use `h-full` or similar to fill height for the CalendarScheduler's split panel (GroupBuilder already uses `h-full` inside).

---

## Implementation Notes Per Plan

### Plan 01: CSS Grid calendar + scheduleSlice

**Goal:** Build the structural skeleton — the navigable CSS Grid and the Zustand slice — so the grid is visible and the data layer is ready for wiring.

**Concrete steps:**
1. Add `scheduleGroup`, `unscheduleGroup`, `clearSlot` to a new `src/store/scheduleSlice.ts`. Type: `StateCreator<AppState & ScheduleActions, [], [], ScheduleActions>`.
2. Wire `createScheduleSlice` into `src/store/index.ts`. Expand `AppStore` type.
3. Add `'calendar'` to `activeTab` union in `App.tsx`. Add Calendar tab button and render `<CalendarScheduler />`.
4. Create `src/components/CalendarScheduler.tsx` — split panel with DndContext wrapper (empty handlers initially).
5. Create `src/components/WeekCalendar.tsx` — CSS Grid (8 cols, 14 rows), week nav arrows, column headers, row labels, slot cells as Droppable stubs.
6. Create `src/components/GroupSidebar.tsx` — Droppable zone listing unscheduled groups.
7. Write tests first: `src/store/scheduleSlice.test.ts` (scheduleGroup, unscheduleGroup, clearSlot, constraints from CAL-03).

**DST-safe slot key:** `slotKey(slot: TimeSlot): string` returns `'${slot.dayOfWeek}:${slot.hour}:${slot.minute}'`. Pure function, no Date involved. Exported from `src/lib/slotUtils.ts` or inline in scheduleSlice.

**Week navigation state:** `const [weekOffset, setWeekOffset] = useState(0)` in CalendarScheduler. Derived Monday date via `getMondayOfWeek(weekOffset)`.

### Plan 02: DnD wiring, slot cards, constraints, and unschedule

**Goal:** Full drag-to-schedule, constraint enforcement, slot card display, and both unschedule methods.

**Concrete steps:**
1. Add `useDraggable` to group cards in `GroupSidebar`. Data: `{ type: 'sidebar-group', groupId }`.
2. Implement `useDroppable` on each slot cell in WeekCalendar. ID: the slotKey string. Data: `{ accepts: ['sidebar-group', 'scheduled-group'] }`.
3. Implement `onDragEnd` in CalendarScheduler with full constraint logic (occupied slot rejection, move logic).
4. Create `src/components/SlotCard.tsx` — scheduled group card with group name, dog count, ⚠ icon, × button. The card is also `useDraggable` (for drag-back-to-sidebar). Data: `{ type: 'scheduled-group', groupId }`.
5. GroupSidebar: grey out / hide scheduled groups (D-03). Filter `walkGroups` by groups not in `walkSessions`.
6. DragOverlay: render ghost of dragged group card.
7. Tests: `src/components/CalendarScheduler.test.tsx` — drag group to slot (CAL-02), occupied slot rejects (CAL-03), × button unschedules (CAL-05), drag-back unschedules (CAL-05), slot card shows name + count + warning (CAL-04).

**Occupied-slot drop guard in onDragEnd:**
```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over) return

  const groupId = active.data.current?.groupId as string
  const overId = over.id as string

  if (overId === 'group-sidebar') {
    unscheduleGroup(groupId)
    return
  }

  // overId is a slotKey — check occupancy
  const isOccupied = walkSessions.some((s) => slotKey(s.slot) === overId)
  const isAlreadyHere = walkSessions.some(
    (s) => s.groupId === groupId && slotKey(s.slot) === overId
  )

  if (isAlreadyHere) return  // no-op: dropped in same slot
  if (isOccupied) return     // D-07: reject occupied slot

  const [dayStr, hourStr, minuteStr] = overId.split(':')
  scheduleGroup(groupId, {
    dayOfWeek: Number(dayStr) as TimeSlot['dayOfWeek'],
    hour: Number(hourStr),
    minute: Number(minuteStr),
  })
}
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | vite.config.ts (inline `test:` key) |
| Quick run command | `npm run test:run -- src/store/scheduleSlice.test.ts` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAL-01 | Weekly grid renders 7 day columns, 13 hour rows | unit (component) | `npm run test:run -- src/components/WeekCalendar.test.tsx` | Wave 0 |
| CAL-01 | Column headers show "Mon 24" format | unit (component) | same | Wave 0 |
| CAL-01 | Week nav Prev/Next arrows change displayed week | unit (component) | same | Wave 0 |
| CAL-02 | Dragging group from sidebar calls scheduleGroup | unit (component) | `npm run test:run -- src/components/CalendarScheduler.test.tsx` | Wave 0 |
| CAL-03 | scheduleGroup enforces one-group-per-slot | unit (slice) | `npm run test:run -- src/store/scheduleSlice.test.ts` | Wave 0 |
| CAL-03 | scheduleGroup enforces one-slot-per-group | unit (slice) | same | Wave 0 |
| CAL-03 | onDragEnd rejects drop onto occupied slot | unit (component) | `npm run test:run -- src/components/CalendarScheduler.test.tsx` | Wave 0 |
| CAL-04 | Slot card shows group name + dog count + warning | unit (component) | `npm run test:run -- src/components/SlotCard.test.tsx` | Wave 0 |
| CAL-05 | × button calls unscheduleGroup | unit (component) | `npm run test:run -- src/components/SlotCard.test.tsx` | Wave 0 |
| CAL-05 | Drag-back-to-sidebar calls unscheduleGroup | unit (component) | `npm run test:run -- src/components/CalendarScheduler.test.tsx` | Wave 0 |
| CAL-06 | WalkSession slot contains {dayOfWeek, hour, minute} | unit (slice) | `npm run test:run -- src/store/scheduleSlice.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:run -- src/store/scheduleSlice.test.ts` (slice tests, fast)
- **Per wave merge:** `npm run test:run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps (all test files are new — none exist yet)
- [ ] `src/store/scheduleSlice.test.ts` — covers CAL-03, CAL-06, slice actions
- [ ] `src/components/CalendarScheduler.test.tsx` — covers CAL-02, CAL-03, CAL-05 (drag back)
- [ ] `src/components/WeekCalendar.test.tsx` — covers CAL-01
- [ ] `src/components/SlotCard.test.tsx` — covers CAL-04, CAL-05 (× button)

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure frontend code, build tools already confirmed working via prior phases, dnd-kit already installed).

---

## Open Questions

1. **D-03: Grey out vs hide from sidebar**
   - What we know: D-03 says "greyed out (or removed)" — either is acceptable.
   - What's unclear: Which is better UX? Greyed out keeps groups visible to confirm they are scheduled; hidden reduces clutter.
   - Recommendation: Hide (filter to `unscheduledGroups` only). The calendar grid shows which groups are scheduled. Greying out adds visual noise with no additional information value. This is Claude's discretion per the CONTEXT.md.

2. **Minute value in TimeSlot for drop parsing**
   - What we know: `TimeSlot.minute` exists in the type; the grid is hour-granularity so minute is always 0.
   - What's unclear: The slotKey `'${dayOfWeek}:${hour}:${minute}'` must be parsed back to a TimeSlot in `onDragEnd`. If minute is always 0, the parse is trivial.
   - Recommendation: Always pass `minute: 0` when constructing TimeSlot from a slotKey. Document in the slice file that this phase only uses 0.

3. **GroupSidebar Droppable overlap with scheduled SlotCard draggable**
   - What we know: A scheduled group card in a slot is Draggable. When dragged, it can land on either the sidebar (unschedule) or another slot (move). The sidebar Droppable must accept `'scheduled-group'` type.
   - What's unclear: If the user drags a scheduled card and releases over nothing, `over` is null — that is a no-op (group stays scheduled), which is correct.
   - Recommendation: In `onDragEnd`, only act if `over` is not null. No change needed to the slice.

---

## Sources

### Primary (HIGH confidence)
- Source: direct codebase read — `src/types/index.ts`, `src/store/groupSlice.ts`, `src/store/index.ts`, `src/store/migrations.ts`, `src/components/GroupBuilder.tsx`, `src/components/GroupPanel.tsx`, `src/App.tsx`, `package.json`, `vite.config.ts`
- [dnd-kit DndContext isolation — official discussion #181](https://github.com/clauderic/dnd-kit/discussions/181) — confirmed cross-context drag is not possible; single DndContext required

### Secondary (MEDIUM confidence)
- [dnd-kit docs: useDroppable data property](https://docs.dndkit.com/api-documentation/droppable/usedroppable) — data.accepts pattern for type-based filtering
- [CSS Grid + position:sticky (ishadeed.com)](https://ishadeed.com/article/position-sticky-css-grid/) — verified sticky headers/columns in CSS Grid require `overflow: auto` on scroll container
- [MDN: Date.prototype.getDay()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay) — Sunday=0 convention confirmed; Monday offset formula verified

### Tertiary (LOW confidence — not required, background context)
- [ISO week date standards](https://tomhazledine.com/what-is-an-iso-week/) — ISO weeks start Monday; relevant for edge-case awareness only (week offset approach used instead)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified by direct package.json read; versions confirmed
- Architecture (DndContext): HIGH — verified against official dnd-kit discussion and library source behaviour
- Data layer: HIGH — verified by direct codebase read of types/index.ts and store/index.ts
- CSS Grid layout: HIGH — position:sticky in CSS Grid is well-documented with official MDN support
- Week math: HIGH — vanilla JS Date approach verified against MDN
- Migration requirements: HIGH — verified by reading migrations.ts and store/index.ts partialize

**Research date:** 2026-03-28
**Valid until:** 2026-05-28 (stable libraries; dnd-kit 6.x API unlikely to change materially within 60 days)
