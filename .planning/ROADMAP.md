# Roadmap: Dog Walk Planner

## Overview

Six phases take this project from a blank Vite scaffold to a fully working behaviorist tool. Phase 1 establishes the data foundation and testing harness — everything else builds on top. Phases 2 and 3 build the compatibility system (algorithm first, graph UI second). Phase 4 delivers the core daily action: composing walk groups with drag-and-drop. Phase 5 drops groups into a weekly calendar. Phase 6 closes the loop with walk outcome logging and history charts.

## Phases

- [x] **Phase 1: Foundation** — Data layer, Zustand store, LocalStorage persistence, Vitest harness (completed 2026-03-27)
- [ ] **Phase 2: Compatibility System** — Compatibility data entry, scoring algorithm, and auto-suggest logic
- [ ] **Phase 3: Compatibility Graph** — Interactive network graph UI with editable edges
- [ ] **Phase 4: Group Builder** — Drag-and-drop group composition with live compatibility feedback
- [ ] **Phase 5: Calendar Scheduler** — Weekly hour-slot calendar with drag-and-drop group scheduling
- [ ] **Phase 6: Walk History** — Walk outcome logging and per-dog history chart

## Phase Details

### Phase 1: Foundation
**Goal**: Establish the data model, Zustand store with LocalStorage persistence, schema versioning, and the TDD harness — so every subsequent phase has a tested, persistent foundation to build on.
**Depends on**: Nothing
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, DOGS-01, DOGS-02, DOGS-03, DOGS-04
**Plans:** 2/2 plans complete
**Success Criteria** (what must be TRUE):
  1. Dog can be added, edited, and archived — changes survive a page refresh
  2. LocalStorage data includes a `schemaVersion` field
  3. All store logic is covered by Vitest unit tests
  4. `npm run test` passes with no failures

Plans:
- [x] 01-01-PLAN.md — Toolchain setup (Tailwind v3, shadcn/ui, Vitest, Zustand), domain types, store with persist + schema versioning, dogSlice with unit tests
- [x] 01-02-PLAN.md — Dog Roster UI (card grid, add/edit slide-in panel, archive flow, archived toggle) wired to store, integration tests

### Phase 2: Compatibility System
**Goal**: Define compatibility between dog pairs, implement the scoring algorithm and auto-suggest function as pure, fully-tested library modules — before any graph UI exists.
**Depends on**: Phase 1
**Requirements**: COMPAT-01, COMPAT-04, SCORE-01, SCORE-02, SCORE-03, SCORE-04
**Success Criteria** (what must be TRUE):
  1. Compatibility status between any two dogs can be set to Compatible / Neutral / Conflict / Unknown
  2. `scoreGroup(dogs, compatMap)` returns a 0–100 score; Unknown pairs are penalised, not treated as safe
  3. `suggestGroups(availableDogs, compatMap, groupSize)` returns ranked group compositions
  4. Both functions have 100% unit test coverage in `src/lib/`

Plans:
- [ ] 02-01: Implement `compatSlice` (set/get pairwise status); define `CompatibilityStatus` union type; unit tests
- [ ] 02-02: Implement `src/lib/scoring.ts` — `scoreGroup` pure function with full test suite covering all status combinations and unknown-pair penalty
- [ ] 02-03: Implement `src/lib/groupSuggest.ts` — greedy constraint-satisfaction auto-suggest; unit tests with varied compatibility scenarios

### Phase 3: Compatibility Graph
**Goal**: Render the compatibility data as an interactive force-directed network graph where edges can be clicked to update compatibility status.
**Depends on**: Phase 2
**Requirements**: COMPAT-02, COMPAT-03
**Success Criteria** (what must be TRUE):
  1. All active dogs appear as nodes on the graph
  2. Edges are coloured by status: green (Compatible), grey (Neutral), red (Conflict), dashed (Unknown)
  3. Clicking an edge opens a status picker and persists the change to the store
  4. Graph layout is stable (no constant re-render thrash)

Plans:
- [ ] 03-01: Install and configure react-force-graph (ForceGraph2D); build `GraphAdapter` wrapper with stable `graphData` via `useMemo`; mock in tests via `vi.mock`
- [ ] 03-02: Implement edge click → status picker → `compatSlice` update; add `CompatBadge` component; visual tests with RTL

### Phase 4: Group Builder
**Goal**: Let the behaviorist drag dogs from the roster into named walk groups, with live compatibility scoring and inline conflict highlighting on each drop.
**Depends on**: Phase 3
**Requirements**: GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05
**Success Criteria** (what must be TRUE):
  1. Behaviorist can drag a dog from the roster panel into a group panel
  2. A dog cannot appear in two groups simultaneously
  3. Dropping a dog into a group immediately shows the updated group score
  4. Conflicting pairs within a group are highlighted inline
  5. Dog can be removed from a group by drag-back or remove button

Plans:
- [ ] 04-01: Install dnd-kit; implement two-panel layout (roster ↔ groups) with `DndContext`, `Draggable` dog cards, `Droppable` group panels; commit drag state only in `onDragEnd`
- [ ] 04-02: Wire group drops to `groupSlice`; integrate `scoreGroup` for live score display and `CompatBadge` for inline conflict highlighting; tests for drag state and scoring integration

### Phase 5: Calendar Scheduler
**Goal**: Display a weekly hour-slot grid and let the behaviorist drag walk groups into time slots to build a schedule.
**Depends on**: Phase 4
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06
**Success Criteria** (what must be TRUE):
  1. Weekly calendar shows hour slots from 07:00–19:00 for each day
  2. Walk group can be dragged from the group builder and dropped into a slot
  3. A group can occupy only one slot; a slot holds one group
  4. Scheduled slots show group name and dog count
  5. Group can be removed from a slot (unscheduled)
  6. Slots are stored as `{ dayOfWeek, hour, minute }` — not epoch timestamps

Plans:
- [ ] 05-01: Build CSS Grid weekly calendar component with hour-slot `Droppable` cells (second `DndContext` surface); implement DST-safe slot representation in `scheduleSlice`
- [ ] 05-02: Wire group drag from builder panel to calendar slots; enforce one-group-per-slot constraint; display scheduled group cards; tests for schedule state and slot constraints

### Phase 6: Walk History
**Goal**: Let the behaviorist log walk outcomes after each walk and view per-dog history as a chart timeline.
**Depends on**: Phase 5
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05
**Success Criteria** (what must be TRUE):
  1. Behaviorist can log a walk outcome (Great/Good/Neutral/Poor/Incident) with optional notes
  2. Each log entry records an immutable snapshot of dogs present
  3. Each dog's profile page shows a Recharts chart of their walk outcomes over time
  4. Walk log entries are persisted to LocalStorage

Plans:
- [ ] 06-01: Implement `walkSlice` — log walk session with outcome enum, notes, and dog snapshot; unit tests; persist via `LocalStorageAdapter`
- [ ] 06-02: Install Recharts; build `WalkHistoryChart` component (outcome timeline per dog); integrate into dog profile view; chart rendering tests

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-27 |
| 2. Compatibility System | 0/3 | Not started | - |
| 3. Compatibility Graph | 0/2 | Not started | - |
| 4. Group Builder | 0/2 | Not started | - |
| 5. Calendar Scheduler | 0/2 | Not started | - |
| 6. Walk History | 0/2 | Not started | - |
