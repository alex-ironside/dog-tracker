# Phase 3: Compatibility Graph - Research

**Researched:** 2026-03-27
**Domain:** react-force-graph (ForceGraph2D), React + Vitest + RTL, Zustand store integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tabbed layout — a tab bar with two tabs: "Dogs" (existing DogRoster) and "Compatibility" (new graph view). Local React state controls the active tab — no router needed. App.tsx gains a simple tab switcher wrapping DogRoster and the new CompatibilityGraph component.
- **D-02:** `react-force-graph` — pre-decided in project context (STATE.md accumulated decisions). TypeScript types flagged as needing npm verification before implementation begins.
- **D-03:** Only draw edges for explicitly-set compatibility pairs (i.e. entries present in `compatibilityEntries`). Dog pairs with no entry are not connected — those dogs appear as isolated nodes.
- **D-04:** Edge colours by status: green (compatible), grey (neutral), red (conflict), dashed (unknown).
- **D-05:** Clicking an edge opens a Sheet/drawer — same pattern as DogPanel. The sheet shows both dog names prominently, the current status, and 4 selectable statuses (Compatible / Neutral / Conflict / Unknown) plus a "Remove" option. "Remove" calls `removeCompatibility` and removes the edge entirely.
- **D-06:** Sheet uses the existing `Sheet` shadcn component. No new UI primitives needed.
- **D-07:** Nodes display dog name only — no breed, no avatar.
- **D-08:** Clicking a node opens the DogPanel in edit mode (same component used in the Dogs tab).

### Claude's Discretion
- Tab bar visual design (pill style, underline, etc.) — pick what fits the existing Tailwind/shadcn aesthetic.
- Node size, font size, and force simulation parameters — tune for readability with a typical roster size (5–15 dogs).
- Whether the DogPanel opened from node-click uses a separate Sheet instance or reuses the one from DogRoster.

### Deferred Ideas (OUT OF SCOPE)
- None explicitly listed in CONTEXT.md for Phase 3.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMPAT-02 | Compatibility is displayed as an interactive network graph — nodes are dogs, edges are coloured by status (green/grey/red/dashed) | ForceGraph2D `linkColor` + `linkLineDash` props confirmed in bundled .d.ts; `nodeCanvasObject` for node name labels |
| COMPAT-03 | Behaviorist can click an edge on the graph to update the compatibility status between those two dogs | `onLinkClick` prop confirmed in .d.ts; fires with `LinkObject` containing source/target; connects to existing `setCompatibility` / `removeCompatibility` store actions |
</phase_requirements>

---

## Summary

Phase 3 is a pure UI phase. The data layer (`compatSlice`, `CompatibilityEntry`, `CompatibilityStatus`) is fully implemented. The only missing piece is the visual graph and its interaction layer.

`react-force-graph` v1.48.2 ships its own TypeScript declarations at `dist/react-force-graph.d.ts` — the concern logged in STATE.md about TypeScript type availability is resolved. `@types/react-force-graph` does NOT exist on npm, and none is needed. The bundled types expose `ForceGraph2D` with all required props: `graphData`, `linkColor`, `linkLineDash`, `onLinkClick`, `onNodeClick`, `nodeCanvasObject`, `cooldownTicks`, `d3VelocityDecay`, and `onEngineStop`.

The key testing challenge is that `ForceGraph2D` renders to an HTML Canvas, which jsdom does not support. `vitest-canvas-mock` (the standard canvas-mock library) requires vitest ≥3.0.0 but this project pins vitest to v2.x (Node 20.9.0 compatibility constraint). The correct pattern is `vi.mock('react-force-graph', ...)` to replace `ForceGraph2D` with a lightweight `<div data-testid="force-graph" />` stub. Tests then assert on EdgeSheet and DogPanel behaviour exclusively — not on canvas rendering internals.

**Primary recommendation:** Install `react-force-graph@^1.48.2`, use bundled types (no `@types/` package needed), mock the component in tests via `vi.mock`, and keep `graphData` stable with `useMemo`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-force-graph | 1.48.2 (latest) | ForceGraph2D canvas component | Project pre-decision (D-02, STATE.md); ships own TS types |
| react / react-dom | 18.3.1 (already installed) | Component runtime | Already in project |
| zustand | 5.0.12 (already installed) | Store; `setCompatibility`, `removeCompatibility` already implemented | Already in project |

### Supporting (already installed — no new installs)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | 1.1.15 | Sheet (drawer) primitive | EdgeSheet and DogPanel already use it |
| lucide-react | 1.7.0 | Icons (close X button) | Existing DogPanel pattern |
| tailwindcss | 3.4.19 | Styling | All existing components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-force-graph | vis-network, cytoscape.js, @antv/g6 | All heavier; react-force-graph was pre-decided and is purpose-built for force-directed graphs |
| vi.mock for canvas | vitest-canvas-mock | vitest-canvas-mock requires vitest ≥3.0.0; project pins vitest 2.x for Node 20.9.0 compat |

**Installation:**
```bash
npm install react-force-graph
```

**Version verification (confirmed 2026-03-27):**
```
react-force-graph@1.48.2 (dist-tags.latest)
```
Types are bundled — the `exports` field points to `./dist/react-force-graph.d.ts`.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── CompatibilityGraph.tsx   # ForceGraph2D wrapper; graphData via useMemo; edge/node click handlers
│   ├── EdgeSheet.tsx            # Sheet for edge-click: dog names, 4 status buttons, Remove
│   └── CompatBadge.tsx         # Coloured pill for CompatibilityStatus (reused Phase 4)
├── App.tsx                      # Gains tab switcher (useState<'dogs'|'compatibility'>)
└── types/index.ts               # No changes — CompatibilityStatus already defined
```

### Pattern 1: Stable `graphData` with `useMemo`

The force simulation runs on the `graphData` object reference. A new object on every render causes the simulation to restart (thrash). `useMemo` with `[dogs, compatibilityEntries]` as deps gives a stable reference between unrelated re-renders.

**What:** Derive `{ nodes, links }` from store slices using `useMemo`.
**When to use:** Any time store-derived data feeds ForceGraph2D.

```typescript
// Source: react-force-graph bundled types + standard React memoisation pattern
import { useMemo } from 'react'
import type { Dog, CompatibilityEntry, CompatibilityStatus } from '@/types'

type GraphNode = { id: string; name: string }
type GraphLink = { source: string; target: string; status: CompatibilityStatus }

function buildGraphData(dogs: Dog[], entries: CompatibilityEntry[]) {
  const nodes: GraphNode[] = dogs
    .filter((d) => !d.archived)
    .map((d) => ({ id: d.id, name: d.name }))

  const links: GraphLink[] = entries.map((e) => ({
    source: e.dogIdA,
    target: e.dogIdB,
    status: e.status,
  }))

  return { nodes, links }
}

// Inside CompatibilityGraph component:
const graphData = useMemo(
  () => buildGraphData(dogs, compatibilityEntries),
  [dogs, compatibilityEntries]
)
```

### Pattern 2: `onLinkClick` for Edge Interaction

**What:** ForceGraph2D fires `onLinkClick(link, event)`. At call time `link.source` and `link.target` have been mutated by d3 from `string` IDs into full `NodeObject` references. Extract `.id` safely.

```typescript
// Source: react-force-graph bundled .d.ts — LinkObject<NodeType, LinkType>
// link.source / link.target are string|number|NodeObject after simulation hydration
function handleLinkClick(link: GraphLink & { source: unknown; target: unknown }) {
  const sourceId = typeof link.source === 'object' && link.source !== null
    ? (link.source as GraphNode).id
    : String(link.source)
  const targetId = typeof link.target === 'object' && link.target !== null
    ? (link.target as GraphNode).id
    : String(link.target)
  setEdgeSheet({ open: true, idA: sourceId, idB: targetId, status: link.status })
}
```

### Pattern 3: `nodeCanvasObject` for Name Labels

**What:** Custom Canvas rendering draws the dog name below the node circle. Uses 2D canvas API directly.

```typescript
// Source: react-force-graph bundled .d.ts — CanvasCustomRenderFn<NodeObject>
nodeCanvasObject={(node, ctx, globalScale) => {
  const label = (node as GraphNode).name
  const fontSize = 14 / globalScale
  ctx.font = `${fontSize}px sans-serif`
  ctx.fillStyle = '#1e293b' // slate-800
  ctx.textAlign = 'center'
  ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + 8 / globalScale)
}}
nodeCanvasObjectMode={() => 'after'} // draw after default node circle
```

### Pattern 4: vi.mock for ForceGraph2D in Tests

**What:** `ForceGraph2D` renders a `<canvas>` element that jsdom does not support. Mock the entire module to avoid runtime errors. Tests focus on interaction behaviour (EdgeSheet opens, store action fires) not canvas rendering.

```typescript
// Source: established Vitest pattern; see vitest docs on vi.mock
import { vi } from 'vitest'

vi.mock('react-force-graph', () => ({
  ForceGraph2D: ({ onLinkClick, onNodeClick }: {
    onLinkClick?: (link: unknown) => void
    onNodeClick?: (node: unknown) => void
  }) => (
    <div
      data-testid="force-graph"
      data-on-link-click={onLinkClick ? 'registered' : 'none'}
      data-on-node-click={onNodeClick ? 'registered' : 'none'}
    />
  ),
}))
```

Tests then programmatically invoke `onLinkClick`/`onNodeClick` callbacks to simulate clicks without rendering canvas.

### Pattern 5: `linkLineDash` for Unknown Status

**What:** ForceGraph2D 2D variant supports `linkLineDash` as a prop accepting `number[] | null` per accessor. Use `[5, 5]` for unknown, `[]` (or `null`) for solid edges.

```typescript
// Source: react-force-graph bundled .d.ts — linkLineDash prop confirmed
linkLineDash={(link) => (link as GraphLink).status === 'unknown' ? [5, 5] : []}
```

### Pattern 6: Tab Switcher in App.tsx

**What:** Simple local state, no router. Tab bar uses ARIA roles for accessibility per UI-SPEC.

```typescript
// Source: CONTEXT.md D-01, UI-SPEC tab bar contract
const [activeTab, setActiveTab] = useState<'dogs' | 'compatibility'>('dogs')
```

### Anti-Patterns to Avoid
- **Unstable graphData reference:** Creating `{ nodes, links }` inline inside JSX or a non-memoised function causes the force simulation to restart on every render. Always use `useMemo`.
- **Reading `link.source`/`link.target` as strings after simulation:** d3 mutates these to object references. Always guard with `typeof === 'object'`.
- **Installing `@types/react-force-graph`:** This package does NOT exist on npm. The bundled `.d.ts` at `dist/react-force-graph.d.ts` is the authoritative source of types.
- **Using `vitest-canvas-mock`:** Requires vitest ≥3.0.0; incompatible with this project's vitest 2.x pin.
- **Importing `three` in tests:** The `.d.ts` references `three` types (for 3D variants). These should not cause compile errors when only importing `ForceGraph2D`, but if they do, the mock eliminates the issue entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Force-directed layout | Custom D3 simulation wired to React | `react-force-graph` ForceGraph2D | Simulation stability, zoom/pan, canvas performance, pointer hit detection |
| Dashed canvas lines | Manual `ctx.setLineDash` per frame | `linkLineDash` prop | Built into the library; declarative |
| Node hit detection | Manual distance math on click coords | Built-in `onNodeClick` / `onLinkClick` | The library handles coordinate transforms and hit areas |

**Key insight:** Canvas pointer hit detection is deceptively complex (zoom + pan transforms, device pixel ratio). `react-force-graph` handles all of it via `force-graph` kapsule internally.

---

## Common Pitfalls

### Pitfall 1: d3 Mutates `source`/`target` to Objects
**What goes wrong:** After the simulation initialises, `link.source` and `link.target` change from `string` IDs to full node objects. Code that does `link.source === dogId` fails silently.
**Why it happens:** d3-force resolves references in-place after the first tick.
**How to avoid:** In `onLinkClick`, always extract the `.id` with a type guard: `typeof link.source === 'object' ? link.source.id : link.source`.
**Warning signs:** EdgeSheet opens but shows wrong dogs / undefined names.

### Pitfall 2: Canvas Breaks jsdom — Tests Crash
**What goes wrong:** `ForceGraph2D` calls `canvas.getContext('2d')` on mount. jsdom returns `null`. The library throws an uncaught error.
**Why it happens:** jsdom does not implement Canvas API.
**How to avoid:** `vi.mock('react-force-graph', ...)` at the top of every test file that renders `CompatibilityGraph`. The mock renders a plain `<div>`.
**Warning signs:** `TypeError: Cannot read properties of null (reading 'fillRect')` in test output.

### Pitfall 3: Simulation Thrash from Unstable `graphData`
**What goes wrong:** Graph nodes jump around constantly; simulation never settles.
**Why it happens:** A new `graphData` object reference on every render triggers `ForceGraph2D` to restart the simulation from scratch.
**How to avoid:** Wrap `buildGraphData(...)` in `useMemo([dogs, compatibilityEntries])`. `dogs` and `compatibilityEntries` are stable Zustand slice references that only change on store writes.
**Warning signs:** Nodes visibly reset position every time the sheet opens/closes.

### Pitfall 4: `three` Type Import Errors in TypeScript Strict Mode
**What goes wrong:** `react-force-graph.d.ts` imports from `three` (for 3D graph variants). If `three` is not installed, TypeScript may complain about missing module.
**Why it happens:** The single `.d.ts` file covers all four graph variants (2D, 3D, VR, AR).
**How to avoid:** Install `react-force-graph` which transitively includes `3d-force-graph` and its `three` dependency. If tsc strict errors appear, add `"skipLibCheck": true` to `tsconfig.app.json` (it is already likely set given shadcn usage).
**Warning signs:** `Cannot find module 'three'` TypeScript errors during `npm run build`.

### Pitfall 5: DogPanel Driven from Two Locations
**What goes wrong:** `DogPanel` is currently owned by `DogRoster` with internal state. Node clicks from the graph need to open it from outside `DogRoster`.
**Why it happens:** DogPanel already accepts `open`, `onOpenChange`, `editingDog` as props (confirmed in source). It is correctly designed for external control.
**How to avoid:** Do NOT lift state into App.tsx if a separate `DogPanel` instance inside `CompatibilityGraph` is cleaner. A second `DogPanel` instance in `CompatibilityGraph` is the simplest approach — both `DogRoster` and `CompatibilityGraph` own separate instances, each with local state. No state lifting needed.
**Warning signs:** Unnecessary prop drilling or App.tsx accumulating graph-specific state.

---

## Code Examples

### CompatibilityGraph skeleton (verified props from bundled .d.ts)

```typescript
// Source: react-force-graph dist/react-force-graph.d.ts (v1.48.2)
import { ForceGraph2D } from 'react-force-graph'
import { useMemo, useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import type { CompatibilityStatus } from '@/types'

type GraphNode = { id: string; name: string }
type GraphLink = { source: string; target: string; status: CompatibilityStatus }

const STATUS_COLOR: Record<CompatibilityStatus, string> = {
  compatible: '#22c55e',
  neutral: '#94a3b8',
  conflict: '#ef4444',
  unknown: '#cbd5e1',
}

export function CompatibilityGraph() {
  const dogs = useAppStore((s) => s.dogs.filter((d) => !d.archived))
  const compatibilityEntries = useAppStore((s) => s.compatibilityEntries)

  const graphData = useMemo(() => ({
    nodes: dogs.map((d): GraphNode => ({ id: d.id, name: d.name })),
    links: compatibilityEntries.map((e): GraphLink => ({
      source: e.dogIdA,
      target: e.dogIdB,
      status: e.status,
    })),
  }), [dogs, compatibilityEntries])

  return (
    <ForceGraph2D
      graphData={graphData}
      nodeRelSize={6}
      d3VelocityDecay={0.4}
      cooldownTicks={100}
      linkColor={(link) => STATUS_COLOR[(link as GraphLink).status]}
      linkWidth={(link) => (link as GraphLink).status === 'conflict' ? 3 : 2}
      linkLineDash={(link) => (link as GraphLink).status === 'unknown' ? [5, 5] : []}
      onLinkClick={(link) => { /* open EdgeSheet */ }}
      onNodeClick={(node) => { /* open DogPanel */ }}
    />
  )
}
```

### EdgeSheet skeleton

```typescript
// Source: existing DogPanel.tsx pattern; Sheet from @/components/ui/sheet
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { CompatBadge } from './CompatBadge'
import type { CompatibilityStatus } from '@/types'

type EdgeSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dogNameA: string
  dogNameB: string
  currentStatus: CompatibilityStatus
  onSetStatus: (status: CompatibilityStatus) => void
  onRemove: () => void
}

export function EdgeSheet({ open, onOpenChange, dogNameA, dogNameB, currentStatus, onSetStatus, onRemove }: EdgeSheetProps) {
  // local selectedStatus state, same deferred-save pattern as DogPanel
}
```

### CompatBadge skeleton

```typescript
// Source: UI-SPEC color table; CompatibilityStatus from src/types/index.ts
import type { CompatibilityStatus } from '@/types'

const BADGE_STYLES: Record<CompatibilityStatus, string> = {
  compatible: 'bg-green-100 text-green-700',
  neutral: 'bg-slate-100 text-slate-600',
  conflict: 'bg-red-100 text-red-700',
  unknown: 'bg-slate-50 text-slate-400 border border-dashed border-slate-300',
}

export function CompatBadge({ status }: { status: CompatibilityStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STYLES[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate `@types/react-force-graph` package | Bundled `.d.ts` inside `react-force-graph` itself | Somewhere around v1.40+ | No separate `@types/` install needed |
| `vitest-canvas-mock@0.x` (jest-canvas-mock wrapper) | `vitest-canvas-mock@1.x` requires vitest ≥3 | v1.0.0 release | Not usable with vitest 2.x; mock via `vi.mock` instead |

**Deprecated/outdated:**
- `@types/react-force-graph`: Does not exist on npm and was never needed — the library ships types.
- `vitest-canvas-mock` for this project: Peer dep requires vitest ^3.0.0 || ^4.0.0; this project uses vitest 2.x.

---

## Open Questions

1. **`skipLibCheck` for `three` transitive types**
   - What we know: `react-force-graph.d.ts` imports from `three`, `3d-force-graph`, `3d-force-graph-vr`, `3d-force-graph-ar`. Installing `react-force-graph` pulls these as dependencies.
   - What's unclear: Whether strict TypeScript (`noUnusedLocals`, `noUnusedParameters`) causes errors from these transitive type imports in `tsconfig.app.json`.
   - Recommendation: Planner should include a build verification step (`npm run build`) immediately after install. If TypeScript errors appear from three/3d-force-graph, add `"skipLibCheck": true` to `tsconfig.app.json`. This is already common in shadcn projects.

2. **Width prop for ForceGraph2D**
   - What we know: ForceGraph2D accepts optional `width` and `height` props. Without them it defaults to the container's size via `ResizeObserver`.
   - What's unclear: Whether the container `flex-1` sizing works cleanly without explicit px values on first render (may need a `useResizeObserver` or wrapping div with explicit height).
   - Recommendation: Use a `ref` + `ResizeObserver` or a `useWindowSize` hook to pass explicit `width`/`height` — avoids a zero-size canvas on first paint.

---

## Environment Availability

Step 2.6: SKIPPED — this phase installs one npm package (`react-force-graph`) from the standard registry; no external services, databases, or CLI tools beyond npm are required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 + React Testing Library 16.3.2 |
| Config file | `vite.config.ts` (`test.environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`) |
| Quick run command | `npm run test -- --run src/components/CompatibilityGraph.test.tsx src/components/EdgeSheet.test.tsx src/components/CompatBadge.test.tsx` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMPAT-02 | All active (non-archived) dogs appear as nodes in graphData | unit | `npm run test -- --run src/components/CompatibilityGraph.test.tsx` | ❌ Wave 0 |
| COMPAT-02 | Edges are derived only from `compatibilityEntries` (no phantom edges) | unit | `npm run test -- --run src/components/CompatibilityGraph.test.tsx` | ❌ Wave 0 |
| COMPAT-02 | CompatBadge renders correct colour class per status | unit | `npm run test -- --run src/components/CompatBadge.test.tsx` | ❌ Wave 0 |
| COMPAT-03 | Clicking an edge (via mock callback) opens EdgeSheet with correct dog names | unit | `npm run test -- --run src/components/CompatibilityGraph.test.tsx` | ❌ Wave 0 |
| COMPAT-03 | Selecting a status and clicking "Set compatibility" calls `setCompatibility` | unit | `npm run test -- --run src/components/EdgeSheet.test.tsx` | ❌ Wave 0 |
| COMPAT-03 | "Remove relationship" calls `removeCompatibility` and closes sheet | unit | `npm run test -- --run src/components/EdgeSheet.test.tsx` | ❌ Wave 0 |
| COMPAT-03 | "Discard changes" closes sheet without calling store actions | unit | `npm run test -- --run src/components/EdgeSheet.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- --run src/components/CompatibilityGraph.test.tsx src/components/EdgeSheet.test.tsx src/components/CompatBadge.test.tsx`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/CompatibilityGraph.test.tsx` — covers COMPAT-02, COMPAT-03 (graph interaction via mock)
- [ ] `src/components/EdgeSheet.test.tsx` — covers COMPAT-03 (status picker, remove, discard)
- [ ] `src/components/CompatBadge.test.tsx` — covers COMPAT-02 visual distinction, COMPAT-04 colour contrast

---

## Project Constraints (from CLAUDE.md)

| Directive | Detail |
|-----------|--------|
| No backend | Frontend-only SPA; no API calls |
| TypeScript strict mode | `strict: true`, `noUnusedLocals`, `noUnusedParameters` in `tsconfig.app.json` |
| No test framework to configure | Vitest + RTL already configured via `vite.config.ts` |
| TDD | Tests written before or alongside implementation |
| Named exports | All new components use named exports (no default exports for components) |
| No semicolons, 2-space indent, single quotes | Code style from CONTEXT.md established patterns |
| Commands | `npm run dev`, `npm run build`, `npm run lint`, `npm run test:run` |

---

## Sources

### Primary (HIGH confidence)
- `react-force-graph@1.48.2` bundled `dist/react-force-graph.d.ts` — ForceGraph2D props: `graphData`, `linkColor`, `linkLineDash`, `linkWidth`, `onLinkClick`, `onNodeClick`, `nodeCanvasObject`, `nodeCanvasObjectMode`, `cooldownTicks`, `d3VelocityDecay`, `onEngineStop` — all confirmed present
- `npm view react-force-graph` — version 1.48.2, latest; peerDeps: `react: '*'`; exports: `types: './dist/react-force-graph.d.ts'`
- `npm view vitest-canvas-mock peerDependencies` — `{ vitest: '^3.0.0 || ^4.0.0' }` — confirms incompatibility with project's vitest 2.x
- `src/store/compatSlice.ts` — `setCompatibility`, `removeCompatibility` signatures confirmed
- `src/components/DogPanel.tsx` — `DogPanelProps: { open, onOpenChange, editingDog }` confirmed; externally controllable
- `src/types/index.ts` — `CompatibilityStatus`, `CompatibilityEntry` confirmed

### Secondary (MEDIUM confidence)
- [vitest-canvas-mock GitHub](https://github.com/wobsoriano/vitest-canvas-mock) — peer dep requirement for vitest 3+
- [react-force-graph GitHub](https://github.com/vasturiano/react-force-graph) — library README pattern for graphData

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-force-graph version and bundled types verified from npm registry and tarball inspection
- Architecture: HIGH — props verified from bundled .d.ts; patterns verified against existing codebase conventions
- Pitfalls: HIGH — d3 mutation and canvas/jsdom issues are well-established; vitest-canvas-mock incompatibility verified from npm peerDeps

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable library, 30-day window)
