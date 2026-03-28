# Phase 5: Calendar Scheduler - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers the Calendar Scheduler: a two-panel view where the behaviorist drags walk groups from a sidebar into a navigable weekly hour-slot grid (07:00–19:00). The schedule is stored per-week using `{ dayOfWeek, hour, minute }` slot keys — not epoch timestamps — to avoid DST bugs. dnd-kit is already installed from Phase 4.

</domain>

<decisions>
## Implementation Decisions

### App Navigation
- **D-01:** Add a fourth tab to App.tsx — "Calendar". Tab order: Dogs | Compatibility | Groups | Calendar. Same tab bar pattern as prior phases.

### Layout
- **D-02:** The Calendar tab uses a split-panel layout — left sidebar listing available groups (draggable), right side showing the CSS Grid weekly calendar. Mirrors the Group Builder two-panel pattern.
- **D-03:** Groups that are scheduled appear greyed out (or removed) from the sidebar; only unscheduled groups are available to drag.

### Week Navigation
- **D-04:** The calendar shows a specific week with Prev / Next navigation arrows and a "Week of [date]" label. The displayed week offset is local UI state (not persisted). Default is the current calendar week on mount.
- **D-05:** Column headers show abbreviated day names and dates (e.g. "Mon 24", "Tue 25"). Row labels show hour times (e.g. "07:00", "08:00", …, "19:00").

### Drag-and-Drop
- **D-06:** Groups are dragged from the left sidebar and dropped into calendar slots. A second `DndContext` surface wraps the Calendar tab (separate from the Group Builder's DndContext — they are on different tabs so there's no conflict).
- **D-07:** One-group-per-slot constraint enforced on drop (CAL-03). If a slot is occupied, the drop is rejected (slot does not accept the drag).
- **D-08:** A group can only be in one slot at a time (CAL-03). Dropping into a new slot first removes it from any previous slot.

### Unscheduling
- **D-09:** Both interaction methods are supported (CAL-05):
  - × button on the scheduled group card in the slot — click to unschedule
  - Drag the card from the slot back to the group sidebar

### Slot Display
- **D-10:** Scheduled slot cards show: group name + dog count + ⚠ conflict warning icon if the group contains any conflict pairs. Example: "Group 1 • 4 dogs ⚠". Consistent with the Group Builder header pattern (D-14 from Phase 4).

### Data Layer
- **D-11:** `scheduleSlice` stores schedule as a map keyed by `{weekOffset}:{dayOfWeek}:{hour}` (or similar canonical string key) → `groupId`. Week offset is an integer relative to the ISO week of app init, or simply stored as `{ isoWeek, year }` — researcher should decide the cleanest canonical key scheme that satisfies CAL-06 (no epoch timestamps).
- **D-12:** `scheduleSlice` follows the same Zustand `StateCreator<AppState & AllActions>` slice pattern as `groupSlice`, `dogSlice`, and `compatSlice`. Persisted to LocalStorage via the existing persist layer.

### Claude's Discretion
- Exact CSS Grid implementation for the calendar (row = hour, col = day is the conventional layout).
- Sidebar group card appearance — follow the existing MiniDogCard / RosterRow aesthetic from Phase 4.
- Whether the week offset state lives in local component state or a lightweight `uiSlice` — researcher should recommend the cleanest approach.
- Tailwind styling details — slate palette, shadcn/ui patterns, consistent with existing app.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Vision, constraints, key decisions (TDD, Tailwind, LocalStorage, Stitch for UI)
- `.planning/REQUIREMENTS.md` — Phase 5 requirements: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06

### Existing Store
- `src/store/groupSlice.ts` — Slice pattern to follow for `scheduleSlice`
- `src/store/dogSlice.ts` — Slice pattern reference
- `src/store/index.ts` — Where `createScheduleSlice` will be wired in; `AppState` gains `schedule` field
- `src/store/migrations.ts` — May need a migration for new `schedule` field

### Existing Types
- `src/types/index.ts` — `Dog`, `Group`, `AppState` — must not redefine; `ScheduleEntry` / `ScheduleSlot` type to be added

### Existing Lib Functions
- `src/lib/scoring.ts` — `getConflictsInGroup(dogs, compatMap)` used to determine conflict warning in slot card (D-10)

### Existing Components to Reuse
- `src/components/GroupBuilder.tsx` — Reference for the two-panel DnD layout pattern (D-02)
- `src/components/GroupPanel.tsx` — Reference for the group score/conflict header pattern (D-10)
- `src/App.tsx` — Gains a fourth tab ("Calendar"); same tab pattern

### Phase 4 Context (decisions carried forward)
- `.planning/phases/04-group-builder/04-CONTEXT.md` — Group panel design, DnD architecture, conflict display patterns

### No external specs
No ADRs or external design specs for Phase 5. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/scoring.ts` — `getConflictsInGroup` ready for conflict warning in slot cards
- `src/components/GroupBuilder.tsx` — Two-panel DnD pattern to mirror in CalendarScheduler
- `src/App.tsx` — Fourth tab added; renders `<CalendarScheduler />` when active
- `src/store/groupSlice.ts` — `scheduleSlice` follows this exact slice structure

### Established Patterns
- TypeScript strict mode — all new code must satisfy `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Named exports for all modules
- No semicolons, 2-space indent, single quotes
- TDD with Vitest — tests written before or alongside implementation
- Zustand slice pattern: `StateCreator<AppState & AllActions, [], [], ScheduleActions>`
- Sheet/panel for status interactions (not modals)

### Integration Points
- `src/store/index.ts` — Wire `createScheduleSlice`; `AppState` gains `schedule` field
- `src/App.tsx` — Fourth tab; renders `<CalendarScheduler />`
- `src/store/migrations.ts` — Schema migration for new `schedule` field

</code_context>

<deferred>
## Deferred Ideas

- **Click slot to view group details** — Clicking a scheduled slot card to open a detail sheet (showing dogs, score, conflict list). Not in Phase 5 scope; could be a Phase 5.1 or Phase 6 bridge.
- **Persist current week offset** — Saving the viewed week to LocalStorage so it survives refresh. Not in scope; local UI state for now.
- **Auto-schedule suggestions** — Using `suggestGroups` to recommend group placements for a week. Deferred post-v1 (SUGG-01).

</deferred>

---

*Phase: 05-calendar-scheduler*
*Context gathered: 2026-03-27*
