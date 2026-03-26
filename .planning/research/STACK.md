# Stack Research

**Domain:** React SPA — drag-and-drop scheduling, network graph, chart history, LocalStorage persistence
**Researched:** 2026-03-26
**Confidence:** MEDIUM (all external verification tools blocked in this session; findings are from training data, cutoff August 2025; see verification flags throughout)

---

## Important: Research Tool Limitation

All external tools (WebSearch, WebFetch, Context7 MCP, Bash) were denied permissions in this session. Every recommendation below is based on training-data knowledge current to August 2025. Each section includes a **Verify** flag identifying what to confirm before locking in a version number.

---

## Recommended Stack

### Core Technologies (existing — do not change)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| React | 18.3.1 | UI rendering | Already installed |
| TypeScript | 5.5.3 | Type safety | Already installed; strict mode on |
| Vite | 5.4.1 | Dev server + bundler | Already installed |

### Drag-and-Drop: `@dnd-kit/core` + `@dnd-kit/sortable`

**Recommendation: dnd-kit**

| Package | Version (training) | Purpose | Confidence |
|---------|-------------------|---------|------------|
| `@dnd-kit/core` | ~6.1.x | Pointer/touch drag engine | MEDIUM |
| `@dnd-kit/sortable` | ~8.0.x | Sortable list preset | MEDIUM |
| `@dnd-kit/utilities` | ~3.2.x | Utility hooks | MEDIUM |

**Why dnd-kit over alternatives:**

- **Accessibility-first**: Built-in keyboard navigation and ARIA announcements. React DnD and react-beautiful-dnd do not provide this out of the box.
- **React 18 compatible**: Built for concurrent-mode React; react-beautiful-dnd has open issues with React 18 StrictMode double-invocation and is effectively unmaintained (Atlassian stopped active development ~2022).
- **No DOM manipulation**: Pure React state model, no direct DOM mutations. This makes it testable with React Testing Library.
- **Flexible collision detection**: Ships with `closestCenter`, `closestCorners`, `rectIntersection` strategies, and supports custom collision algorithms — essential for snapping dogs onto calendar time-slot cells.
- **Multiple containers**: `@dnd-kit/sortable` supports dragging between multiple droppable containers (dog roster → group → time slot) natively.

**Architecture note for the calendar grid:** dnd-kit does not ship a calendar component. The calendar grid is custom (see Calendar section below). Each time-slot `<div>` becomes a `<Droppable>` container; each dog card becomes a `<Draggable>`. This is the standard pattern.

**Verify:** Run `npm show @dnd-kit/core version` or check https://www.npmjs.com/package/@dnd-kit/core for current version before pinning.

---

### Network / Force Graph: `react-force-graph`

**Recommendation: react-force-graph (2D)**

| Package | Version (training) | Purpose | Confidence |
|---------|-------------------|---------|------------|
| `react-force-graph` | ~1.44.x | Force-directed node-edge graph | MEDIUM |

**Why react-force-graph:**

- **WebGL + Canvas rendering**: Uses `three-forcegraph` under the hood; handles dozens of nodes (the dog roster will be ~10–50) with no performance concerns.
- **React 18 compatible**: Wrapper around `force-graph` (plain JS), which is actively maintained by vasturiano.
- **Interactive editing hooks**: `onNodeClick`, `onLinkClick`, `onNodeDrag`, `onBackgroundClick` callbacks allow implementing edge creation/deletion UI. The graph state (nodes + links) lives in React state; the component re-renders the graph when state changes.
- **2D mode is sufficient**: `react-force-graph` exports both `ForceGraph2D` (Canvas) and `ForceGraph3D` (WebGL/Three.js). For a compatibility map, 2D is clearer and lighter.
- **TypeScript types**: `@types/react-force-graph` or bundled types available.

**Alternative considered — Cytoscape.js via `react-cytoscapejs`:**
More powerful layout engine and styling API, but significantly heavier (~300 KB), requires a separate React wrapper that has lagged behind Cytoscape core releases, and the API is more complex for this use case. Use Cytoscape when you need advanced graph analytics (shortest path, clustering algorithms surfaced in UI). For a visual compatibility map with ~50 nodes, react-force-graph is the right weight.

**Alternative considered — vis-network via `react-vis-graph-network`:**
Older library with less active maintenance. Not recommended.

**Editable edge pattern:** To make edges editable (click to toggle compatible/incompatible, right-click to delete), manage an adjacency list in Zustand state. On `onLinkClick`, update the link's `color`/`value` in state. The force graph re-renders from the new state. Node addition is the same: push to `nodes` array in state.

**Verify:** Check https://www.npmjs.com/package/react-force-graph for current version. Confirm React 18 peer dep is satisfied.

---

### Line / History Charts: `recharts`

**Recommendation: Recharts**

| Package | Version (training) | Purpose | Confidence |
|---------|-------------------|---------|------------|
| `recharts` | ~2.12.x | Composable SVG charts | MEDIUM |

**Why Recharts over Nivo:**

- **Bundle size**: Recharts is ~150 KB gzipped; Nivo is ~400 KB+ because it pulls in D3 as a full peer dependency. For a LocalStorage SPA loaded from a file, bundle size matters.
- **React 18 compatible**: Recharts 2.x fully supports React 18. Nivo also supports React 18 but requires careful package version alignment.
- **TypeScript**: Recharts ships its own types; no `@types/` package needed.
- **Composable API**: `<LineChart>`, `<Line>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`, `<Legend>` are individual React components. This is a good fit for TDD — each chart is a pure component driven entirely by prop data, easily testable.
- **Walk outcome history use case**: A `<LineChart>` with one `<Line>` per dog, plotting outcome score (or binary pass/fail encoded as 1/0) over date, is a standard Recharts pattern with good docs.

**Alternative considered — Chart.js via `react-chartjs-2`:**
Canvas-based rather than SVG, which makes snapshot testing harder and accessibility worse. Recharts' SVG output is directly inspectable in tests. Not recommended for this use case.

**Alternative considered — Nivo:**
Better aesthetics out of the box and more chart variety, but heavier and the responsive container pattern is more complex. Prefer Recharts unless you need Nivo's specific chart types (treemap, calendar heatmap, etc.).

**Verify:** Run `npm show recharts version` or check https://www.npmjs.com/package/recharts. Confirm Recharts 2.x is still the stable release line (a Recharts 3.x alpha was in progress as of my cutoff).

---

### Calendar / Time-Slot Grid: Custom component (no library)

**Recommendation: Build a custom weekly grid component — do not reach for a calendar library.**

**Rationale:**

Full calendar libraries (FullCalendar, react-big-calendar, react-scheduler) are built around _event_ data models (start/end datetime, attendees) and their internal state machines conflict with external drag-and-drop state management. Integrating dnd-kit droppable zones into a FullCalendar render is fighting the library.

The scheduling requirement here is simpler: a weekly grid of hour-slot cells, each of which is a droppable zone. This is 40–80 lines of CSS Grid + React, not a calendar problem.

**Custom grid structure:**

```
WeeklyCalendar
  ├── [Mon, Tue, Wed, Thu, Fri, Sat, Sun] columns
  └── [07:00 … 18:00] rows
       └── TimeSlotCell (each is a DndKit <Droppable>)
            └── WalkGroupCard (each is a DndKit <Draggable>)
```

CSS Grid with `grid-template-columns: repeat(7, 1fr)` and `grid-template-rows: repeat(N, 1fr)` is the right tool. Hour-slot height is fixed (e.g. 60px per hour). The grid header row shows day labels.

**When to reach for a library instead:** If the requirement grows to include recurring events, timezone handling, month/year views, or iCal import/export — then FullCalendar Pro or react-big-calendar makes sense. Not for v1.

---

### State Management + LocalStorage: `zustand` with `persist` middleware

**Recommendation: Zustand with the built-in `persist` middleware**

| Package | Version (training) | Purpose | Confidence |
|---------|-------------------|---------|------------|
| `zustand` | ~5.0.x | Global state management | MEDIUM |

**Why Zustand over Jotai:**

- **Single-store model**: All app state (dogs, groups, schedule, compatibility edges, walk history) lives in one store. This makes the LocalStorage serialisation trivially simple — the entire store serialises to one JSON blob.
- **`persist` middleware is built-in**: `zustand/middleware` exports `persist`. Wrap the store creator with `persist(fn, { name: 'dog-tracker', storage: createJSONStorage(() => localStorage) })`. No separate library needed.
- **Flat API**: `useStore(state => state.dogs)` selector pattern. No providers, no atoms to compose. For a single-developer tool, the lower ceremony is a real productivity advantage.
- **Immer integration**: `zustand/middleware` also exports `immer`. Combined with `persist`, deeply nested state mutations (updating one edge in the compatibility adjacency list) are ergonomic without spreading.
- **TypeScript**: Zustand 5 ships proper TypeScript types and the `create<T>()` API is well-typed.

**Why not Jotai:**

Jotai's atom model is excellent for fine-grained subscriptions in large apps where re-render performance is critical. For this app (single user, ~50 dogs max, ~200 schedule entries), render performance is not the bottleneck. Jotai's per-atom persistence requires `atomWithStorage` from `jotai/utils` on each atom individually, which creates fragmentation. Zustand's single-store `persist` is a better fit.

**Why not React Context + useReducer:**

Prop drilling through the calendar grid, dog roster, and graph components simultaneously would require either deep nesting of providers or a single massive context that causes unnecessary re-renders. Zustand's selector-based subscriptions avoid both problems.

**Store structure sketch:**

```typescript
interface DogTrackerStore {
  // Roster
  dogs: Dog[]
  addDog: (dog: Dog) => void
  updateDog: (id: string, patch: Partial<Dog>) => void
  removeDog: (id: string) => void

  // Compatibility (adjacency list: dogId → dogId → score -1..1)
  compatibility: Record<string, Record<string, number>>
  setCompatibility: (a: string, b: string, score: number) => void

  // Groups
  groups: WalkGroup[]
  addGroup: (group: WalkGroup) => void
  updateGroup: (id: string, patch: Partial<WalkGroup>) => void
  removeGroup: (id: string) => void

  // Schedule (grouped by ISO week + day + hour)
  schedule: ScheduleEntry[]
  addScheduleEntry: (entry: ScheduleEntry) => void
  removeScheduleEntry: (id: string) => void

  // Walk history
  walkHistory: WalkRecord[]
  addWalkRecord: (record: WalkRecord) => void
}
```

**Verify:** Check https://www.npmjs.com/package/zustand for current version. Confirm that Zustand 5.x (if released) has stable `persist` middleware.

---

### Testing: `vitest` + `@testing-library/react`

**Recommendation: Vitest with React Testing Library and jsdom**

| Package | Version (training) | Purpose | Confidence |
|---------|-------------------|---------|------------|
| `vitest` | ~2.x | Test runner (Vite-native) | MEDIUM |
| `@vitest/coverage-v8` | ~2.x | Coverage via V8 | MEDIUM |
| `@testing-library/react` | ~16.x | Component rendering in tests | MEDIUM |
| `@testing-library/user-event` | ~14.x | Simulates user interactions | MEDIUM |
| `@testing-library/jest-dom` | ~6.x | Extra DOM matchers | MEDIUM |
| `jsdom` | ~24.x | DOM environment for Vitest | MEDIUM |

**Why Vitest:**

- Shares Vite config — no second build pipeline to maintain.
- TypeScript works out of the box with no Babel preset configuration.
- Jest-compatible API (`describe`, `it`, `expect`, `vi.mock`) so existing Jest patterns apply.
- Watch mode is fast because it uses Vite's module graph.

**TDD setup that works with this stack:**

The existing TESTING.md (`.planning/codebase/TESTING.md`) already has the correct Vitest config snippet. The only addition for this stack:

1. **Zustand stores under test**: Create a `resetStore()` action or use `beforeEach(() => useStore.setState(initialState))` to reset between tests. Zustand's `setState` replaces the store, making test isolation clean.

2. **dnd-kit under test**: Drag-and-drop interactions test at the logic layer, not the DOM drag layer. Test the drop handler function directly rather than simulating pointer events through dnd-kit internals.

3. **recharts under test**: Charts are pure functions of data. Snapshot tests on the rendered SVG output catch regressions; unit tests on the data-transformation functions (walk records → chart data points) verify the logic.

4. **react-force-graph under test**: The graph renders to Canvas/WebGL, which jsdom cannot render. Mock the `react-force-graph` module in tests:
   ```typescript
   vi.mock('react-force-graph', () => ({
     ForceGraph2D: ({ graphData }: { graphData: unknown }) => (
       <div data-testid="force-graph" data-nodes={JSON.stringify(graphData)} />
     ),
   }))
   ```
   Test the Zustand store mutations that drive the graph, not the canvas rendering.

**Verify:** Check https://www.npmjs.com/package/vitest for current version (2.x was stable at training cutoff; 3.x may have released).

---

## Installation

```bash
# State management (with persist + immer middleware)
npm install zustand

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Network graph
npm install react-force-graph

# Charts
npm install recharts

# Testing (dev only)
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Drag-and-drop | `@dnd-kit/core` | `react-beautiful-dnd` | Unmaintained; React 18 StrictMode double-invocation bugs; no keyboard accessibility improvements in years |
| Drag-and-drop | `@dnd-kit/core` | `react-dnd` | Older API, HTML5 drag backend has touch limitations, heavier abstraction than needed |
| Network graph | `react-force-graph` | `react-cytoscapejs` | 3x heavier bundle; complex API; overkill for ~50 nodes |
| Network graph | `react-force-graph` | `vis-network` | Lower activity on maintenance; React wrapper is unofficial and lags |
| Charts | `recharts` | `nivo` | 2.5x larger bundle; overkill for single line-chart use case |
| Charts | `recharts` | `react-chartjs-2` | Canvas rendering hurts test snapshots and accessibility |
| State | `zustand` | `jotai` | Per-atom persistence is fragmented; single store + persist is simpler for full-app LocalStorage serialisation |
| State | `zustand` | `redux-toolkit` | Far too much ceremony for a single-user local tool |
| State | `zustand` | `React Context` | Prop drilling or re-render overhead across deeply nested components |
| Calendar grid | Custom CSS Grid | `react-big-calendar` | Library's internal event model conflicts with dnd-kit; custom grid is ~60 lines |
| Calendar grid | Custom CSS Grid | `FullCalendar` | Same conflict; adds heavy dependency; not justified for a simple week grid |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-beautiful-dnd` | Atlassian stopped active development ~2022; open React 18 StrictMode bugs; no new releases | `@dnd-kit/core` |
| `react-dnd` (with HTML5 backend) | No touch support without extra polyfill; older API design; dnd-kit supersedes it | `@dnd-kit/core` |
| `FullCalendar` / `react-big-calendar` | Internal event model fights dnd-kit; heavy bundle; wrong abstraction level | Custom weekly grid (CSS Grid) |
| `nivo` (full) | ~400 KB bundle for a line chart that Recharts handles in ~150 KB | `recharts` |
| Redux / Redux Toolkit | 5x more boilerplate than Zustand for identical capability; no benefit for a single-user tool | `zustand` |
| `vis-network` / `vis.js` | Declining maintenance; the React wrapper is not officially maintained | `react-force-graph` |

---

## Stack Patterns by Variant

**If compatibility graph grows to 200+ nodes (unlikely for v1):**
- Swap `react-force-graph` (ForceGraph2D) for a WebGL-accelerated renderer like `sigma.js` or `ogma`
- At 50 nodes, react-force-graph Canvas is fine

**If the app needs to work offline as a PWA:**
- Add `vite-plugin-pwa` — no changes to Zustand/localStorage persistence needed
- localStorage already works offline; just adds service worker + manifest

**If Firebase migration happens (post-v1):**
- Replace `createJSONStorage(() => localStorage)` in Zustand persist with a custom Firestore storage adapter
- The store interface stays identical; only the storage backend changes
- This is the main architectural reason to prefer Zustand over direct `localStorage` calls scattered across components

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@dnd-kit/core` ^6.x | React 18.x | Concurrent mode safe |
| `react-force-graph` ^1.x | React 18.x | Wraps vanilla `force-graph` JS; React peer dep is flexible |
| `recharts` ^2.x | React 18.x | Recharts 3.x alpha was in progress at training cutoff — verify stable release |
| `zustand` ^5.x | React 18.x | Zustand 5 dropped the older `create` signature; use `create<T>()()` curried form |
| `vitest` ^2.x | Vite 5.x | Same major version alignment with Vite is recommended |
| `@testing-library/react` ^16.x | React 18.x | RTL 16 dropped React 17 support; correct for this project |

---

## Sources

All findings are from training data (knowledge cutoff August 2025). No external sources were reachable in this session.

**To verify before implementing each library, check:**
- https://www.npmjs.com/package/@dnd-kit/core — current version + React 18 peer dep
- https://www.npmjs.com/package/zustand — confirm 5.x stable + persist middleware docs
- https://www.npmjs.com/package/recharts — confirm 2.x vs 3.x stable line
- https://www.npmjs.com/package/react-force-graph — current version + React 18 peer dep
- https://www.npmjs.com/package/vitest — confirm 2.x vs 3.x
- https://docs.dndkit.com/ — calendar/multi-container sortable pattern

---

*Stack research for: Dog Walk Planner — React SPA scheduling, network graph, charts, LocalStorage*
*Researched: 2026-03-26*
