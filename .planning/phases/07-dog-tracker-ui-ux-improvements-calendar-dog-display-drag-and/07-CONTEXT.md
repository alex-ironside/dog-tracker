# Phase 7: UI/UX Improvements — Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Mode:** Smart Discuss (autonomous)

<domain>
## Phase Boundary

Three independent UI/UX improvement areas:

1. **Calendar dog display** — scheduled slots show only group name + dog count today; they need to list individual dog names. If a dog has more than one walk on the same day, that should be visible on the card. Users also want a way to highlight/locate a specific dog across all calendar slots. The calendar is 600px fixed height with `overflow: auto` — it needs to expand to show all rows without scrolling. Also needs date range / timeframe selection (currently week-nav only).

2. **Group builder drag-and-drop** — dogs can be in multiple groups simultaneously; each group renders a MiniDogCard per dog using `useDraggable(id: dog.id)`. When a dog is in N groups, N cards share the same draggable ID, causing dnd-kit to treat them as one element — dragging one visually drags all. Each card needs a unique ID scoped to its group.

3. **Enter-to-save on all forms** — `DogPanel.tsx` has no `onKeyDown` handler; saving requires clicking the Save button. Every text/number input in the app (add dog, edit dog, any CU operation) should submit the form on Enter. This is a standard UX expectation.

</domain>

<decisions>
## Implementation Decisions

### Calendar — dog list in scheduled slots

**Q: How to display dog names in ScheduledGroupCard?**
A: List dog names as a compact wrapped row of small pills/chips inside the card, below the existing group name + score badge row. Keep the card scannable — name only (no breed/age). If the group has many dogs, show all (cards can grow in height; the grid row height is min-64px and can expand).

**Q: What counts as "more than 1 walk same day" and how to surface it?**
A: A dog appears in multiple scheduled sessions on the same calendar day. The walk log (WalkLogEntry) has its own history — but for the calendar view, "same day" means the same dayOfWeek (same column) has two or more slots that include this dog. Render a small indicator (e.g. orange dot or "×2" badge) on each dog pill where this condition is true, with a tooltip "2 walks today".

**Q: How to highlight a dog across calendar view?**
A: Add a dog-highlight control — a searchable select or simple dropdown above the calendar grid listing all dogs. When a dog is selected, any slot that contains that dog is visually highlighted (e.g. slot border becomes accent color, matching dog pill glows). Deselect by clearing the control. This is a filter/spotlight mode, not a filter that hides other slots.

**Q: Calendar height — expand to no-scroll?**
A: Remove the fixed `h-[600px]` on CalendarScheduler and let the WeekCalendar grid grow to its natural height (13 hours × 64px = ~832px). Remove `overflow: auto` from the grid container. Sticky row headers and column headers remain. The page itself can scroll if needed — the calendar grid should not have its own scrollbar.

**Q: Date range / timeframe selection?**
A: Add an hour range selector: two selects (Start hour / End hour) defaulting to 08:00–20:00, allowing the user to narrow the visible hours (e.g. 08:00–14:00 for morning-only schedules). The `HOURS` constant in calendarUtils is the source; the selector filters which hours are rendered. Persist selection to localStorage under `portfolio:calHours`. No custom date-range picker beyond the existing week navigation.

### Group builder — drag-and-drop unique IDs

**Q: Root cause and fix?**
A: `MiniDogCard` calls `useDraggable({ id: dog.id })`. When the same dog appears in multiple groups, identical IDs are registered with dnd-kit, which treats the later registration as overwriting the earlier one — dragging one triggers all. Fix: change the draggable ID to `${groupId}-${dog.id}` and thread `groupId` into MiniDogCard as a prop. The `onDragEnd` handler in `GroupBuilder` must parse the group portion out when needed, or carry it via `data`. No other changes to store or scoring needed.

### Enter-to-save

**Q: Which forms are in scope?**
A: All Create/Update operations: DogPanel (add dog, edit dog profile), any inline add inputs (GroupBuilder has a quick-add dog input that already handles Enter — verify it's wired). Exclude read-only fields and search inputs.

**Q: Implementation pattern?**
A: Add `onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}` to each text and number input inside CU forms. For textareas (Notes), Enter should NOT submit — it inserts a newline (standard expectation). Shift+Enter in text inputs also should not submit (allow multiline paste). Apply to: Name, Breed, Age inputs in DogPanel.

</decisions>

<code_context>
## Existing Code Insights

- `ScheduledGroupCard.tsx` — renders group name, dog count badge, score badge, conflict indicator, Log button, X button. Dog names not shown. Needs dog name pills added.
- `CalendarScheduler.tsx` — `h-[600px]` container, manages `weekOffset` state. Needs hour-range state added.
- `WeekCalendar.tsx` — `overflow: auto` grid, `HOURS` array drives row count. Needs hour-range filter prop.
- `MiniDogCard.tsx` — `useDraggable({ id: dog.id })` — duplicate ID bug. Fix: use `${groupId}-${dog.id}`.
- `GroupPanel.tsx` — renders MiniDogCards; has `groupId` in scope — can pass it down.
- `GroupBuilder.tsx` — `onDragEnd` handler — parse group-scoped draggable IDs.
- `DogPanel.tsx` — `handleSave()` exists. Name, Breed, Age inputs have no `onKeyDown`. Notes is a textarea — do NOT add Enter-to-save there.
- Schema: `ScheduledSession` has `groupId` and `slot: { dayOfWeek, hour, minute }`. Dogs are on the Group object via `dogIds`. CalendarScheduler has access to store groups to resolve dog names for rendering.

</code_context>

<specifics>
## Specific Requirements

### Calendar
- [ ] ScheduledGroupCard lists dog names as pills (name only)
- [ ] Dog pill shows "×N" badge if that dog appears in N>1 slots on the same day (same dayOfWeek column)
- [ ] Dog highlight control above calendar — select a dog → highlight matching slots + pills
- [ ] Calendar grid height: remove fixed height + overflow-auto; let it grow naturally
- [ ] Hour range selector: Start/End hour dropdowns (08–20 range), persisted to localStorage

### Group builder
- [ ] MiniDogCard draggable ID changed to `${groupId}-${dog.id}`
- [ ] GroupPanel threads groupId into MiniDogCard
- [ ] GroupBuilder onDragEnd updated to parse new ID format

### Enter-to-save
- [ ] DogPanel Name input: Enter → handleSave()
- [ ] DogPanel Breed input: Enter → handleSave()
- [ ] DogPanel Age input: Enter → handleSave()
- [ ] Notes textarea: no change (Enter = newline)
- [ ] Verify GroupBuilder quick-add input already handles Enter (it does per prior phase notes)

</specifics>

<deferred>
## Deferred Ideas

- Full date-range picker (calendar → specific date range): out of scope; week navigation is sufficient for v1
- Drag dog directly from one group to another (cross-group DnD): not requested; remove-then-add is acceptable
- Bulk dog multi-select in group builder: not in scope

</deferred>
