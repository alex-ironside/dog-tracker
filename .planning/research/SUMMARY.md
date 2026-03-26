# Project Research Summary

**Project:** Dog Walk Planner
**Domain:** Single-user browser SPA — drag-and-drop scheduling, network graph visualisation, LocalStorage persistence
**Researched:** 2026-03-26
**Confidence:** MEDIUM (external tools unavailable during research; all findings from training data through August 2025)

## Executive Summary

This is a professional behaviorist tool for composing safe dog walk groups, scheduling them onto a weekly calendar, and tracking walk outcomes over time. The domain is unusual — no off-the-shelf product covers behavioural compatibility management — which means the UI patterns borrow from generic scheduling and drag-and-drop tools (Trello-style group builder, calendar week grid) while the core differentiator is custom: pairwise compatibility tracking, a scoring algorithm, and a force-directed network graph. The recommended architecture is a React SPA with Zustand state management, dnd-kit for drag-and-drop, react-force-graph for the compatibility graph, and Recharts for walk history charts. All data lives in LocalStorage via an abstracted adapter interface that supports a future Firebase migration without touching application code.

The highest implementation risk in this project is the intersection of three independently tricky subsystems: drag-and-drop state management (dnd-kit requires a strict separation between ephemeral drag-preview state and committed app state), the force-graph library (react-force-graph manages its own DOM and requires imperative updates via ref, not prop re-renders), and LocalStorage schema migration (must be versioned from day one or any future field addition silently corrupts existing user data). All three risks are well-understood and have clear mitigation patterns, but each must be addressed deliberately in the first phase that introduces the subsystem — they cannot be retrofitted cheaply.

The recommended build order follows strict feature dependencies: LocalStorage infrastructure and the dog roster must come first because every other feature depends on dogs existing in persistent state. Compatibility entry and scoring come next because the group builder and auto-suggest are meaningless without pairwise data. The calendar and walk history follow once groups can be composed and scheduled. Auto-suggest is a v1.x feature, not a v1 launch blocker — it requires sufficient pairwise data to be useful, which won't exist until after the core loop has been used in real sessions.

---

## Key Findings

### Recommended Stack

The existing scaffold (React 18, TypeScript 5.5, Vite 5.4) is already correct and should not change. Four libraries need to be added: `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop (chosen over the unmaintained `react-beautiful-dnd` and older `react-dnd` for React 18 compatibility and built-in accessibility); `react-force-graph` for the compatibility network graph (chosen over `react-cytoscapejs` at 3x smaller bundle for a 10–50 node use case); `recharts` for walk history charts (chosen over Nivo at 2.5x smaller bundle, with SVG output that is snapshot-testable); and `zustand` with its built-in `persist` middleware for state management and LocalStorage serialisation. The calendar is a custom CSS Grid component — calendar libraries (FullCalendar, react-big-calendar) have internal event models that conflict with dnd-kit droppable zones and are the wrong abstraction for a simple hour-slot grid.

**Core technologies:**
- `@dnd-kit/core` + `@dnd-kit/sortable`: Drag-and-drop for group builder and calendar — React 18 concurrent-mode safe, accessibility-first, multi-container support
- `react-force-graph` (ForceGraph2D): Compatibility network graph — lightweight Canvas renderer, interactive callbacks for edge editing, adequate for 50 nodes
- `recharts` ^2.x: Walk history line charts — SVG output, composable API, half the bundle size of Nivo
- `zustand` ^5.x + `persist` middleware: Global state + LocalStorage persistence — single store model, trivially serialisable, swap-ready for Firebase
- Custom CSS Grid: Weekly calendar hour-slot grid — 60–80 lines avoids fighting a calendar library's internal state machine
- `vitest` + `@testing-library/react` + `jsdom`: TDD test stack — shares Vite config, Jest-compatible API, fast watch mode

**Version verification needed before implementation:** Confirm recharts 2.x vs 3.x stable release line; confirm zustand 5.x `persist` middleware API; confirm @dnd-kit/core current version and React 18 peer dep.

### Expected Features

The behaviorist's daily workflow is: view the week, identify available dogs, compose a compatible group, assign it to a time slot, then log the outcome after the walk. Every P1 feature directly serves a step in that loop.

**Must have (table stakes — P1):**
- Dog roster with add/edit/archive — foundation for everything; use soft-delete to preserve history
- Pairwise compatibility entry (compatible / neutral / conflict + notes) — core domain input
- Compatibility network graph, read + editable on click — visual overview of all relationships
- Walk group builder with drag-and-drop and inline conflict warnings — primary daily action
- Group compatibility score displayed in builder — go/no-go safety signal; must handle unknown pairs explicitly
- Weekly calendar with hour-slot grid and drag-to-assign groups — scheduling output
- Walk session logger (outcome + notes + dogs present snapshot) — closes the daily loop
- LocalStorage persistence from day one — data loss on refresh makes the tool useless

**Should have after core loop validation (P2 / v1.x):**
- Walk outcome timeline per dog (Recharts line chart) — only valuable once 10+ sessions exist
- Auto-suggest compatible groups — only reliable once pairwise data is sufficiently populated (20+ dogs)
- "Dogs available this slot" filter — QoL win once calendar has real data

**Defer to v2+:**
- Firebase / cloud sync, compatibility matrix view, export to PDF/CSV, walk outcome trend alerts

**Anti-features to reject explicitly:**
- ML/neural network grouping — no training data, opaque decisions in a safety-critical domain; math scoring is more auditable
- Client booking portal, real-time notifications, undo/redo history

### Architecture Approach

The architecture is a four-layer vertical-slice SPA: a feature layer (`features/roster`, `features/graph`, `features/builder`, `features/calendar`, `features/history`) where each feature is a vertical slice owning its container, presentational components, helpers, and tests; a Zustand store layer (`dogSlice`, `compatSlice`, `walkSlice`, `uiSlice`) with slices combined into one persisted store; a pure algorithm layer (`lib/scoring.ts`, `lib/groupSuggest.ts`) with no React or I/O dependencies; and a storage adapter layer (`StorageAdapter` interface, `LocalStorageAdapter`, `InMemoryAdapter`) that decouples persistence from store internals and enables test injection. Features import from the store and lib layers but never from each other. This structure prevents god-component failure, makes algorithm logic unit-testable without rendering React, and isolates the persistence mechanism behind an interface that can swap from LocalStorage to Firebase by replacing a single class.

**Major components:**
1. `features/roster` — Dog CRUD, profile cards, archive/restore
2. `features/graph` — react-force-graph wrapper, edge editor popover, `graphHelpers.ts` transform
3. `features/builder` — dnd-kit DnD context for dogs-into-groups, live CompatBadge scoring
4. `features/calendar` — custom CSS Grid week view, dnd-kit DnD context for groups-into-slots, DST-safe time representation
5. `features/history` — Recharts walk outcome timeline, walk log form
6. `store/` — Zustand slices + `persistMiddleware.ts` wiring `StorageAdapter`
7. `lib/scoring.ts` + `lib/groupSuggest.ts` — pure algorithm functions, fully unit-testable
8. `storage/` — `StorageAdapter` interface, `LocalStorageAdapter`, `InMemoryAdapter`

**Key data model decisions:**
- Use `Record<Id, Entity>` maps, not arrays — O(1) lookup, trivial JSON serialisation
- Edge key normalised as `${smallerId}:${largerId}` — guarantees one entry per pair, symmetric lookup
- `WalkRecord.dogIds` snapshots the group at walk time — history survives later group edits
- `CompatScore` is `1 | 0.5 | 0 | -0.5 | -1`, not a boolean — supports nuanced grouping decisions

### Critical Pitfalls

1. **LocalStorage schema not versioned from day one** — Any added field in v2 silently produces `undefined` in existing data. Add `schemaVersion: 1` to the stored root object immediately; write a `migrate(raw)` function that runs at app startup before any React state is initialised. Cost: near zero. Recovery without this: painful manual data clearing.

2. **Drag state committed in `onDragOver` instead of `onDragEnd`** — `onDragOver` fires at 60fps; mutating app state there means a cancelled drag or Escape keypress leaves state dirty. Only commit state changes in `onDragEnd` after confirming `event.over !== null`. Use dnd-kit's `DragOverlay` for visual feedback during drag; it renders outside the real DOM tree.

3. **`graphData` passed as inline object literal to react-force-graph** — React re-renders recreate object literals on every render; the force simulation restarts, nodes fly around, and the user loses their layout. Memoize `graphData` with `useMemo` with a tight dependency array on actual dog and compatibility data. Use `useRef` for all imperative API calls to the graph instance.

4. **Unknown compatibility pairs treated as neutral (score = 0) without surfacing it** — At app startup, almost every pair is unknown. Silently treating unknown as compatible leads the behaviorist to make unsafe grouping decisions. The scorer must return a `hasUnknownPairs: boolean` flag and the UI must visually distinguish "unknown" from "compatible" (dashed edges, question mark icons — not the same grey as neutral).

5. **Calendar time representation using epoch timestamps** — DST transitions shift timestamps by an hour, misplacing walk slots in the grid. Store slots as `{ date: 'YYYY-MM-DD', startHour: number, durationMins: number }` — a logical time, not a wall-clock instant. Never call `new Date(timestamp).getHours()` for calendar slot rendering.

6. **Business logic embedded in `onDragEnd` handler** — jsdom cannot simulate dnd-kit pointer events reliably, so inline drag logic is untestable. Extract pure functions (`addDogToGroup`, `removeDogFromGroup`, `assignGroupToSlot`) with no dnd-kit dependency; the handler becomes a thin dispatcher. Unit-test pure functions with Vitest; use Playwright for end-to-end drag testing.

---

## Implications for Roadmap

Based on the feature dependency graph from FEATURES.md and the pitfall-to-phase mapping from PITFALLS.md, a six-phase build order is recommended:

### Phase 1: Foundation — Data Layer, Dog Roster, and LocalStorage
**Rationale:** Everything else depends on dogs existing in persistent state. This phase also sets up the storage adapter, schema versioning, and Zustand store architecture that all later phases use. Building it first means persistence and migration are never retrofitted.
**Delivers:** Dog roster (add/edit/archive), LocalStorage persistence with schema versioning, Zustand store slices + StorageAdapter, Vitest test infrastructure
**Addresses features:** Dog roster CRUD, LocalStorage persistence
**Avoids pitfalls:** Schema migration (add `schemaVersion: 1` here), LocalStorage quota exception (wrap `setItem` in try/catch here), direct localStorage calls in components (StorageAdapter pattern established here)
**Research flag:** Standard patterns — skip phase research

### Phase 2: Compatibility Data Entry and Scoring
**Rationale:** The compatibility score is the mathematical core of the tool. The group builder and auto-suggest both depend on it. Building the scoring function first (as a pure algorithm in `lib/scoring.ts`) means it is fully unit-tested before any UI uses it. Compatibility entry UI can be a simple form at this stage; the graph comes next.
**Delivers:** Pairwise compatibility entry (form-based), `lib/scoring.ts` pure function, `compatSlice` in the store, `hasUnknownPairs` surface in UI
**Addresses features:** Pairwise compatibility entry, group compatibility score (algorithm only)
**Avoids pitfalls:** Unknown pairs treated as neutral without surfacing it (addressed here in scorer design)
**Research flag:** Standard patterns — skip phase research

### Phase 3: Compatibility Network Graph
**Rationale:** The graph is the primary compatibility visualisation. It depends on compatibility data existing (Phase 2). This phase has the most library-specific complexity (react-force-graph DOM ownership, layout thrash, memoization) and should be isolated to its own phase so those concerns don't bleed into the group builder work.
**Delivers:** Compatibility network graph (read + editable on click), `features/graph` vertical slice, `graphHelpers.ts` transform
**Addresses features:** Compatibility network graph (editable)
**Avoids pitfalls:** Graph library owns DOM — useRef + imperative updates; force graph layout thrash — useMemo on graphData; graph layout reset on node label edit
**Research flag:** May benefit from a focused session on react-force-graph imperative API patterns before implementation

### Phase 4: Group Builder with Drag-and-Drop
**Rationale:** Group building is the primary daily action. It depends on dogs (Phase 1) and compatibility scoring (Phase 2) being in place so inline conflict warnings and the CompatBadge score are functional from day one. This is the first phase using dnd-kit; the drag state management pattern established here carries forward to the calendar phase.
**Delivers:** Drag-and-drop group builder, inline conflict warnings, group compatibility score badge, `features/builder` vertical slice, pure `addDogToGroup` / `removeDogFromGroup` functions
**Addresses features:** Walk group builder, group compatibility score (UI integration), inline conflict warnings
**Avoids pitfalls:** Drag state committed in onDragOver (establish onDragEnd-only commit pattern here), untestable drag logic (pure functions extracted here)
**Research flag:** Standard dnd-kit multi-container sortable pattern — skip phase research; confirm dnd-kit version before starting

### Phase 5: Calendar Scheduler
**Rationale:** The calendar places groups (Phase 4) into time slots. It is the second dnd-kit surface (separate DndContext from the group builder). This phase also introduces the time representation decision; the DST-safe slot format must be locked in here.
**Delivers:** Weekly CSS Grid calendar, drag groups into hour slots, `features/calendar` vertical slice, `slotsOverlap` pure function with boundary test suite
**Addresses features:** Weekly calendar scheduler
**Avoids pitfalls:** DST-driven calendar drift (store slots as `{ date, startHour, durationMins }`), calendar slot overlap boundary conditions (`slotsOverlap` unit tests)
**Research flag:** Standard patterns — skip phase research

### Phase 6: Walk History Logging and Timeline Chart
**Rationale:** Walk history depends on walk sessions existing (calendar slots from Phase 5). The Recharts timeline is a pure function of walk records per dog — straightforward to implement once the data model is established. This phase closes the full daily loop.
**Delivers:** Walk session logger (outcome + notes, auto-filled from group snapshot), Recharts walk outcome timeline per dog, `features/history` vertical slice
**Addresses features:** Walk session logger, walk outcome timeline per dog
**Avoids pitfalls:** Chart re-renders during note editing (separate chart component from notes input)
**Research flag:** Standard Recharts patterns — skip phase research

### Post-v1 Phases (v1.x after validation)
- **Auto-suggest groups** — depends on sufficient pairwise data existing in real use; implement `lib/groupSuggest.ts` once 20+ dogs are in the system
- **Available-dogs filter** — small QoL win, implement after calendar phase has real data
- **Compatibility matrix view** — supplement to graph once roster exceeds 15 dogs

### Phase Ordering Rationale

- Data before display: Phases 1–2 establish persistent data before any visualisation uses it. This means no UI phase is blocked on data-layer decisions.
- Algorithm before UI: `lib/scoring.ts` (Phase 2) and `lib/groupSuggest.ts` (post-v1) are implemented as tested pure functions before any component calls them. Bugs in the algorithm are caught in unit tests, not by using the UI.
- Graph before builder: The compatibility graph (Phase 3) validates that pairwise data reads correctly from the store before the builder depends on it for inline warnings.
- Builder before calendar: Groups must be composable (Phase 4) before they can be scheduled (Phase 5).
- Pitfall mitigations are front-loaded: Schema versioning (Pitfall 3) is in Phase 1; drag state patterns (Pitfall 1, 6) are established in Phase 4 and reused in Phase 5; graph memoization (Pitfalls 2, 7) is contained in Phase 3.

### Research Flags

Phases likely needing a focused research session before implementation:
- **Phase 3 (Compatibility Graph):** react-force-graph's imperative ref API and `graphData` update pattern are the trickiest integration in this project. A focused review of the library's README and the `onNodeClick` / `onLinkClick` callback API before writing code is recommended. No need for a full research-phase invocation — a targeted read of the library documentation is sufficient.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1:** Zustand slice pattern + persist middleware + StorageAdapter are well-documented and established
- **Phase 2:** Pure TypeScript algorithm functions; no library-specific complexity
- **Phase 4:** dnd-kit multi-container sortable is the primary documented use case for the library
- **Phase 5:** Custom CSS Grid + dnd-kit second context; same patterns as Phase 4
- **Phase 6:** Recharts LineChart with per-dog data series is a standard documented example

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | All recommendations consistent with each other and well-reasoned; external npm verification blocked during research session — confirm recharts stable release line and zustand 5.x persist API before pinning versions |
| Features | MEDIUM | UX patterns (drag-and-drop, network graph conventions) are HIGH confidence; domain-specific workflow is MEDIUM — based on reasoning about a professional behaviorist's needs, not primary user research; validate with actual user before phase 4+ |
| Architecture | HIGH | Zustand slice pattern, StorageAdapter interface, feature vertical slices, and pure algorithm modules are all stable, established patterns with high confidence; dnd-kit context boundary pattern is documented |
| Pitfalls | MEDIUM | LocalStorage, DST, and graph library pitfalls are well-evidenced from library documentation; drag state and testability pitfalls are community-consensus patterns; all nine pitfalls have clear prevention strategies |

**Overall confidence:** MEDIUM

### Gaps to Address

- **User workflow validation:** The daily behaviorist workflow described in FEATURES.md is inferred, not validated with the actual user. Before building the group builder (Phase 4) and calendar (Phase 5), confirm the workflow matches reality. Key question: does the behaviorist compose groups ad hoc per session, or maintain named recurring groups? This affects whether `WalkGroup` should be a reusable template or a per-session construct.
- **Group size constraints:** Research assumes 3–6 dogs per group. Validate the actual min/max group size with the user — this affects the auto-suggest algorithm's complexity and the group builder's visual layout.
- **Photo storage decision:** `Dog.avatarUrl` is in the data model, but photos as base64 in LocalStorage can reach the 5MB quota quickly with a roster of 20+ dogs. Decide before Phase 1 whether to support photos (use IndexedDB or file references) or exclude them from v1.
- **Recharts version:** Confirm whether recharts 2.x or 3.x is the current stable release line before Phase 6. A 3.x major release could have breaking API changes from the 2.x examples in the research.
- **CompatScore granularity:** STACK.md suggests `boolean | 3-point`, FEATURES.md uses `-1 | 0 | 1`, and ARCHITECTURE.md uses `1 | 0.5 | 0 | -0.5 | -1`. Align on one representation before Phase 2. The 5-point scale in ARCHITECTURE.md is the most expressive and is recommended — but confirm with the user whether fine-grained scores are actually useful or whether 3-point (compatible / unknown / conflict) is sufficient.

---

## Sources

### Primary (HIGH confidence)
- React 18 + TypeScript + Vite — existing repo scaffold, directly verifiable
- Zustand documentation — slice pattern, persist middleware, TypeScript API
- dnd-kit documentation — multi-container sortable, DragOverlay, DndContext boundaries
- MDN Web Docs — LocalStorage QuotaExceededError, DST behaviour with Date API
- React documentation — useMemo, useRef, reconciliation, memo

### Secondary (MEDIUM confidence)
- react-force-graph GitHub README — imperative API, graphData prop, ref usage
- Recharts documentation — LineChart composition, responsive container
- Training-data knowledge (cutoff August 2025) — library versions, community patterns
- Domain reasoning — professional dog behaviorist workflow (needs primary user validation)
- Graph colouring / stable matching literature — applied by analogy to auto-suggest algorithm

### Tertiary (needs verification before use)
- npm registry — recharts 2.x vs 3.x stable line (verify before Phase 6)
- npm registry — zustand 5.x persist middleware stability (verify before Phase 1)
- npm registry — @dnd-kit/core current version + React 18 peer dep (verify before Phase 4)

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
