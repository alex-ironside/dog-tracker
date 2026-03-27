# Phase 4: Group Builder - Research

**Researched:** 2026-03-27
**Domain:** dnd-kit drag-and-drop, Zustand slice pattern, SVG overlay, Vitest/jsdom testing
**Confidence:** HIGH

## Summary

Phase 4 introduces the Group Builder: a two-panel drag-and-drop UI where a behaviorist drags dogs from a roster into named walk groups. The data layer (`WalkGroup` / `walkGroups`) already exists in `src/types/index.ts` and `src/store/index.ts` — it just needs a `groupSlice` wired in. The scoring functions (`scoreGroup`, `getConflictsInGroup`) are already complete in `src/lib/scoring.ts`.

The chosen DnD library is **dnd-kit** (`@dnd-kit/core` 6.3.1). It uses a context/hook pattern (`DndContext`, `useDraggable`, `useDroppable`) where drag state is NOT committed until `onDragEnd` fires — aligning exactly with D-16. Testing dnd-kit drag interactions in jsdom is fundamentally impractical because dnd-kit relies on `getBoundingClientRect` (always zero in jsdom). The standard testing strategy is to call `onDragEnd` handlers directly with a constructed event object to test state transitions, bypassing actual drag simulation.

Conflict visualization uses an absolutely-positioned SVG overlay over the group's dog card grid. The overlay reads DOM element positions via `getBoundingClientRect` and draws `<line>` elements between conflicting mini-card pairs. This requires `useRef` on each card and a `useLayoutEffect` to read positions. The `EdgeSheet` component is already prop-driven and can be opened from `GroupBuilder` without any modification.

**Primary recommendation:** Install `@dnd-kit/core` only (sortable not needed for this use case). Implement `groupSlice` following `dogSlice` as the exact pattern. Test DnD state logic by calling `onDragEnd` prop callbacks directly — do not attempt to simulate pointer events in jsdom.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add a third tab "Groups" to App.tsx. Tab order: Dogs | Compatibility | Groups.
- **D-02:** Conflicting pairs inside a group are shown as red SVG lines connecting two mini dog cards. Uses `getConflictsInGroup` to identify pairs. Only `conflict` status triggers a line (D-04).
- **D-03:** Clicking a red conflict line opens the existing `EdgeSheet` component.
- **D-04:** Unknown-status pairs are NOT shown as conflict lines — only `conflict` status triggers a red line.
- **D-05:** Groups are created via a "+ Add Group" button. New groups get default name "Group 1", "Group 2", etc. Group name is editable inline.
- **D-06:** If no groups exist when the Groups tab opens, one empty group is auto-created ("Group 1").
- **D-07:** Groups are deletable via a delete button on the group panel header. Deleting returns all dogs to the roster.
- **D-08:** Groups are persisted to LocalStorage via Zustand persist layer (same `dogTracker-store` key). `groupSlice` follows the same slice pattern as `dogSlice` and `compatSlice`.
- **D-09:** Left panel is a compact list — dog name + drag handle (GripVertical) only. Not a reuse of DogRoster. Dogs in a group are greyed out and non-draggable, with a label showing which group (D-10).
- **D-11:** Only active (non-archived) dogs appear in the Group Builder roster.
- **D-12:** Groups are stacked vertically. No horizontal scroll.
- **D-13:** Within each group panel, dogs are displayed as mini cards in a horizontal row. Each mini card shows: dog name + × remove button.
- **D-14:** Group panel header shows: group name (editable inline) | group score (live, from `scoreGroup`) | ⚠ warning icon if any conflicts exist | delete button.
- **D-15:** Dog can be removed via × button on mini card. Removed dog returns to roster. Drag-back to roster is also supported (GROUP-05).
- **D-16:** dnd-kit is the DnD library. Single `DndContext` wraps both panels. Drag state committed only in `onDragEnd`.
- **D-17:** GroupBuilder is a new top-level component `src/components/GroupBuilder.tsx` rendered under the Groups tab.

### Claude's Discretion

- dnd-kit sensor configuration (pointer/touch/keyboard) — use sensible defaults
- Exact Tailwind styling of mini cards, roster rows, and group panels — follow existing app aesthetic (slate palette, rounded-xl, shadcn/ui patterns)
- Whether conflict SVG lines are implemented with absolute-positioned SVG overlay or CSS-only approach
- Tab label: "Groups" or "Group Builder" — pick what fits the tab bar width

### Deferred Ideas (OUT OF SCOPE)

- JSON state export/import UI
- Auto-suggest into groups (SUGG-01 is v2)
- Walk history in conflict dialog (requires Phase 6 data)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GROUP-01 | Behaviorist can create a named walk group and drag dogs from the roster into it | dnd-kit `useDraggable`/`useDroppable` + `groupSlice.addGroup` + `groupSlice.addDogToGroup`; `WalkGroup` type already defined in `src/types/index.ts` |
| GROUP-02 | Each dog can only appear in one group at a time | Enforced in `addDogToGroup` action: check all groups before adding; roster greys out already-assigned dogs (D-10) |
| GROUP-03 | When a dog is dropped into a group, a compatibility badge shows the group's overall compatibility score | `scoreGroup(group.dogIds, compatMap)` called on every group state change; `CompatBadge` already exists for display |
| GROUP-04 | Conflicts within a group are highlighted inline (not just as a summary warning) | `getConflictsInGroup` identifies conflict pairs; absolute-positioned SVG overlay draws red `<line>` elements between mini card DOM positions |
| GROUP-05 | Behaviorist can remove a dog from a group by dragging back or via a remove button | × button calls `groupSlice.removeDogFromGroup`; roster is also a droppable target so drag-back fires `onDragEnd` with `over.id === 'roster'` |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | Drag context, useDraggable, useDroppable, sensors | Pre-decided (D-16/roadmap); most accessible, lightest React DnD library |
| zustand | 5.0.12 (already installed) | groupSlice state management | Already in use; slice pattern established |
| lucide-react | 1.7.0 (already installed) | GripVertical drag handle, TriangleAlert warning, X remove button | Already in use throughout app |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | 3.2.2 | CSS.Translate.toString() for drag transform style | Needed alongside core to apply transform styles to draggable nodes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core | react-beautiful-dnd | rbd is deprecated (Atlassian); dnd-kit is maintained |
| @dnd-kit/core | @hello-pangea/dnd | Viable but not pre-decided; dnd-kit has better TypeScript support |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

**Version verification:** Confirmed via `npm view` on 2026-03-27:
- `@dnd-kit/core` → 6.3.1
- `@dnd-kit/utilities` → 3.2.2

## Architecture Patterns

### Recommended Project Structure

```
src/
├── store/
│   ├── groupSlice.ts       # NEW — GroupActions, createGroupSlice
│   └── index.ts            # MODIFIED — wire groupSlice; add groups to AppStore & partialize
├── components/
│   ├── GroupBuilder.tsx    # NEW — top-level component (D-17)
│   ├── GroupRosterPanel.tsx # NEW — left panel compact roster (D-09)
│   ├── GroupPanel.tsx      # NEW — single group card with droppable + SVG overlay (D-12/13/14)
│   └── GroupMiniCard.tsx   # NEW — mini dog card inside a group (D-13)
└── App.tsx                 # MODIFIED — third tab (D-01)
```

### Pattern 1: groupSlice

**What:** Zustand StateCreator following the exact pattern of `dogSlice.ts`.
**When to use:** All group state mutations.

```typescript
// Source: src/store/dogSlice.ts pattern
import type { StateCreator } from 'zustand'
import type { AppState, WalkGroup } from '@/types'

export type GroupActions = {
  addGroup: (name: string) => void
  renameGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
  addDogToGroup: (groupId: string, dogId: string) => void
  removeDogFromGroup: (groupId: string, dogId: string) => void
}

export const createGroupSlice: StateCreator<AppState & GroupActions, [], [], GroupActions> = (set) => ({
  addGroup: (name) => set((state) => ({
    walkGroups: [...state.walkGroups, { id: crypto.randomUUID(), name, dogIds: [] }],
  })),
  addDogToGroup: (groupId, dogId) => set((state) => {
    // Remove dogId from any other group first (enforces GROUP-02)
    const cleaned = state.walkGroups.map((g) =>
      g.id === groupId ? g : { ...g, dogIds: g.dogIds.filter((id) => id !== dogId) }
    )
    return {
      walkGroups: cleaned.map((g) =>
        g.id === groupId && !g.dogIds.includes(dogId)
          ? { ...g, dogIds: [...g.dogIds, dogId] }
          : g
      ),
    }
  }),
  // ...
})
```

**Key note:** The `WalkGroup` type is ALREADY defined in `src/types/index.ts` (`id`, `name`, `dogIds: string[]`) and `walkGroups: WalkGroup[]` is already in `AppState` and in the `partialize` list in `src/store/index.ts`. No type additions needed — only add `GroupActions` to `AppStore` type and spread `createGroupSlice`.

### Pattern 2: DndContext with onDragEnd

**What:** Single `DndContext` wrapping both panels in `GroupBuilder.tsx`. Drag state committed only on `onDragEnd`.
**When to use:** Entire GroupBuilder component.

```typescript
// Source: dndkit.com official docs
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor)
)

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over) return
  const dogId = active.id as string
  const overId = over.id as string
  if (overId === 'roster') {
    // find which group has this dog and remove it
    const group = walkGroups.find((g) => g.dogIds.includes(dogId))
    if (group) removeDogFromGroup(group.id, dogId)
  } else {
    // overId is a group id
    addDogToGroup(overId, dogId)
  }
}

return (
  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <GroupRosterPanel />
    <GroupPanelList />
  </DndContext>
)
```

### Pattern 3: useDraggable Dog Row

**What:** Each roster row wraps `useDraggable`. The drag handle (`GripVertical`) receives `listeners`; the row element receives `setNodeRef` and `attributes`.
**When to use:** Each active, unassigned dog in the roster panel.

```typescript
// Source: dndkit.com/api-documentation/draggable
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function DraggableRosterRow({ dog }: { dog: Dog }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: dog.id })
  const style = { transform: CSS.Translate.toString(transform) }
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <GripVertical size={16} {...listeners} />
      <span>{dog.name}</span>
    </div>
  )
}
```

For dogs already assigned to a group (D-10): render without `useDraggable`, greyed out, with a label.

### Pattern 4: useDroppable Group Panel

**What:** Each group panel and the roster panel are droppable targets.
**When to use:** `GroupPanel` and `GroupRosterPanel` containers.

```typescript
// Source: dndkit.com/api-documentation/droppable
import { useDroppable } from '@dnd-kit/core'

function GroupPanel({ group }: { group: WalkGroup }) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })
  return (
    <div ref={setNodeRef} className={isOver ? 'ring-2 ring-primary' : ''}>
      {/* mini cards */}
    </div>
  )
}

// Roster also needs to be droppable for drag-back (D-15/GROUP-05)
function GroupRosterPanel() {
  const { setNodeRef, isOver } = useDroppable({ id: 'roster' })
  return <div ref={setNodeRef}>...</div>
}
```

### Pattern 5: SVG Conflict Line Overlay

**What:** Absolute-positioned `<svg>` overlay inside each group panel. Draws `<line>` elements between conflicting mini-card DOM elements.
**When to use:** When `getConflictsInGroup` returns any pairs.

```typescript
// Source: standard React/SVG pattern
function ConflictOverlay({ conflicts, cardRefs, containerRef }: ConflictOverlayProps) {
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; idA: string; idB: string }>>([])

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const computed = conflicts
      .filter((c) => c.status === 'conflict') // D-04: only 'conflict' triggers line
      .map((c) => {
        const refA = cardRefs.current.get(c.idA)
        const refB = cardRefs.current.get(c.idB)
        if (!refA || !refB) return null
        const rA = refA.getBoundingClientRect()
        const rB = refB.getBoundingClientRect()
        return {
          x1: rA.left + rA.width / 2 - containerRect.left,
          y1: rA.top + rA.height / 2 - containerRect.top,
          x2: rB.left + rB.width / 2 - containerRect.left,
          y2: rB.top + rB.height / 2 - containerRect.top,
          idA: c.idA,
          idB: c.idB,
        }
      })
      .filter(Boolean)
    setLines(computed as typeof lines)
  }, [conflicts, cardRefs])

  return (
    <svg
      className='absolute inset-0 w-full h-full pointer-events-none'
      style={{ pointerEvents: 'none' }}
    >
      {lines.map((l) => (
        <line
          key={`${l.idA}-${l.idB}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke='red' strokeWidth={2}
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
          onClick={() => onConflictLineClick(l.idA, l.idB)}
        />
      ))}
    </svg>
  )
}
```

The container needs `position: relative` and the SVG overlay `position: absolute; inset: 0`. The SVG lines need `pointer-events: all` to be clickable while the SVG itself has `pointer-events: none` to avoid blocking card interactions.

**ResizeObserver note:** The test setup already stubs `ResizeObserver` globally. If the overlay uses one for re-computing positions on resize, it will work in tests without extra setup.

### Pattern 6: EdgeSheet Reuse (D-03)

`EdgeSheet` is already fully prop-driven. To open it from `GroupBuilder` when a conflict line is clicked, maintain local state in `GroupBuilder` (or `GroupPanel`):

```typescript
const [edgeSheetState, setEdgeSheetState] = useState<{
  open: boolean
  dogIdA: string
  dogIdB: string
  currentStatus: CompatibilityStatus
} | null>(null)
```

No props need to be added to `EdgeSheet` — it accepts `open`, `onOpenChange`, `dogNameA`, `dogNameB`, `currentStatus`, `onSetStatus`, `onRemove` as-is. Call `setCompatibility` from the store in `onSetStatus`.

### Auto-create Group on Tab Open (D-06)

Handle in `GroupBuilder.tsx` using a `useEffect`:

```typescript
useEffect(() => {
  if (walkGroups.length === 0) {
    addGroup('Group 1')
  }
}, []) // run once on mount
```

### Anti-Patterns to Avoid

- **Optimistic drag state:** Do not move dogs in store during drag (`onDragOver`). Only commit in `onDragEnd` (D-16).
- **Separate DndContexts per panel:** Use one `DndContext` wrapping both panels so drops across panels work.
- **Re-using DogRoster for the left panel:** D-09 is explicit — build a purpose-built compact roster component.
- **Computing SVG line positions in render:** Use `useLayoutEffect` to read DOM rects after paint, not during render.
- **Using `@dnd-kit/sortable`:** This phase does not require sortable ordering within groups. Only `@dnd-kit/core` is needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag activation with pointer/touch/keyboard | Custom event listeners | `PointerSensor`, `KeyboardSensor` from dnd-kit | Accessibility, browser compatibility, activation constraints handled |
| Drag transform CSS | Manual CSS calculation | `CSS.Translate.toString(transform)` from `@dnd-kit/utilities` | Handles scale, translate, null-safety |
| Group scoring | Custom scoring logic | `scoreGroup()` from `src/lib/scoring.ts` | Already implemented and tested |
| Conflict identification | Custom pair comparison | `getConflictsInGroup()` from `src/lib/scoring.ts` | Already implemented and tested |
| Unique IDs | Custom ID generation | `crypto.randomUUID()` (Web Crypto, no import needed) | Established project pattern from dogSlice |

**Key insight:** The scoring and conflict detection are already done. Phase 4 is purely UI wiring.

## Common Pitfalls

### Pitfall 1: WalkGroup type already exists — don't add a Group type

**What goes wrong:** Adding a new `Group` type to `src/types/index.ts` when `WalkGroup` is already defined there with the correct shape (`id`, `name`, `dogIds: string[]`). TypeScript strict mode will not error immediately but causes confusion.
**Why it happens:** CONTEXT.md mentions "Group type to be added" but on reading the actual types file, `WalkGroup` already covers the need.
**How to avoid:** Read `src/types/index.ts` before adding types. Use `WalkGroup` as the type throughout. `walkGroups: WalkGroup[]` is already in `AppState` and in `partialize`.
**Warning signs:** Importing `Group` anywhere when `WalkGroup` is the canonical type.

### Pitfall 2: groupSlice not wired into AppStore type

**What goes wrong:** Adding `createGroupSlice` to the `create()` call but forgetting to add `GroupActions` to the `AppStore` type alias in `src/store/index.ts`. TypeScript will error on any store selector returning group actions.
**Why it happens:** The `AppStore = AppState & DogActions & CompatActions` type must be extended.
**How to avoid:** Update `AppStore` to `AppState & DogActions & CompatActions & GroupActions` when adding the slice.

### Pitfall 3: dnd-kit drag simulation does not work in jsdom

**What goes wrong:** Tests attempt to simulate `pointerdown`/`pointermove`/`pointerup` sequences to trigger drag-and-drop, but dnd-kit uses `getBoundingClientRect` internally (always returns zeros in jsdom), so drags never resolve to any droppable.
**Why it happens:** jsdom does not implement layout — all rects are `{top:0, left:0, width:0, height:0}`.
**How to avoid:** Test drag outcomes by calling the `onDragEnd` prop directly with a constructed `DragEndEvent` — see Test Architecture section. Test component rendering and state-driven UI (greyed-out dogs, score display) separately.
**Warning signs:** Tests that fire pointer events on draggable elements but never see state change.

### Pitfall 4: SVG line positions go stale after layout changes

**What goes wrong:** SVG conflict lines point to wrong positions after the group panel resizes (e.g., adding/removing dogs changes card positions).
**Why it happens:** `getBoundingClientRect` values are snapshot-based and must be re-read after every layout change.
**How to avoid:** Include `group.dogIds` as a dependency in the `useLayoutEffect` that computes line positions, so positions recompute whenever the group composition changes.

### Pitfall 5: Multiple droppable registrations with same id

**What goes wrong:** Two group panels accidentally share the same `id` passed to `useDroppable`, causing dnd-kit to behave unpredictably.
**Why it happens:** Using a static string instead of `group.id`.
**How to avoid:** Always pass `group.id` (UUID) as the `id` to `useDroppable`. The roster panel uses the reserved string `'roster'`.

### Pitfall 6: App.tsx tab test expects exactly two tabs

**What goes wrong:** The existing test `'renders Dogs and Compatibility tab buttons'` in `CompatibilityGraph.test.tsx` still passes, but a new test for the Groups tab added to App.tsx or the existing test would need updating if it queried by count.
**Why it happens:** The test currently only asserts the first two tabs exist — it does not assert count.
**How to avoid:** The existing test does not need changes. Add Group tab tests in a new `GroupBuilder.test.tsx` or alongside the App tab bar tests.

## Code Examples

### groupSlice minimal skeleton

```typescript
// Source: mirrors src/store/dogSlice.ts pattern
import type { StateCreator } from 'zustand'
import type { AppState, WalkGroup } from '@/types'

export type GroupActions = {
  addGroup: (name: string) => void
  renameGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
  addDogToGroup: (groupId: string, dogId: string) => void
  removeDogFromGroup: (groupId: string, dogId: string) => void
}

export const createGroupSlice: StateCreator<AppState & GroupActions, [], [], GroupActions> = (set) => ({
  addGroup: (name) => set((state) => ({
    walkGroups: [...state.walkGroups, { id: crypto.randomUUID(), name, dogIds: [] }],
  })),
  renameGroup: (id, name) => set((state) => ({
    walkGroups: state.walkGroups.map((g) => g.id === id ? { ...g, name } : g),
  })),
  deleteGroup: (id) => set((state) => ({
    walkGroups: state.walkGroups.filter((g) => g.id !== id),
  })),
  addDogToGroup: (groupId, dogId) => set((state) => {
    const cleaned = state.walkGroups.map((g) =>
      g.id === groupId ? g : { ...g, dogIds: g.dogIds.filter((d) => d !== dogId) }
    )
    return {
      walkGroups: cleaned.map((g) =>
        g.id === groupId && !g.dogIds.includes(dogId)
          ? { ...g, dogIds: [...g.dogIds, dogId] }
          : g
      ),
    }
  }),
  removeDogFromGroup: (groupId, dogId) => set((state) => ({
    walkGroups: state.walkGroups.map((g) =>
      g.id === groupId ? { ...g, dogIds: g.dogIds.filter((d) => d !== dogId) } : g
    ),
  })),
})
```

### store/index.ts diff (additions only)

```typescript
import { createGroupSlice, type GroupActions } from './groupSlice'
// AppStore type:
export type AppStore = AppState & DogActions & CompatActions & GroupActions
// Inside create():
...createGroupSlice(...a),
// partialize already includes walkGroups — no change needed
```

### Test pattern for drag state

```typescript
// Source: dnd-kit issue #261 recommended approach
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'

it('dropping dog into group calls addDogToGroup', () => {
  useAppStore.setState({ dogs: [dog1], walkGroups: [group1] })
  let capturedOnDragEnd: ((e: DragEndEvent) => void) | undefined

  vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual('@dnd-kit/core')
    return {
      ...actual,
      DndContext: ({ onDragEnd, children }: { onDragEnd: (e: DragEndEvent) => void; children: React.ReactNode }) => {
        capturedOnDragEnd = onDragEnd
        return <>{children}</>
      },
    }
  })

  render(<GroupBuilder />)
  act(() => {
    capturedOnDragEnd!({
      active: { id: 'dog-1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
      over: { id: 'group-1', data: { current: {} }, rect: { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 }, disabled: false },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: new PointerEvent('pointerdown'),
    } as DragEndEvent)
  })
  expect(useAppStore.getState().walkGroups[0].dogIds).toContain('dog-1')
})
```

Alternative (simpler): Test `onDragEnd` logic in isolation as a pure function extracted from the component, without rendering at all.

### Group score display pattern

```typescript
// Uses existing scoreGroup and buildCompatMap from src/lib/scoring.ts
import { scoreGroup, buildCompatMap } from '@/lib/scoring'
import { CompatBadge } from '@/components/CompatBadge'

// In GroupPanel:
const compatMap = buildCompatMap(compatibilityEntries)
const score = scoreGroup(group.dogIds, compatMap)
const scoreStatus: CompatibilityStatus =
  score >= 75 ? 'compatible' : score >= 40 ? 'neutral' : 'conflict'
// Display: <CompatBadge status={scoreStatus} /> plus raw number
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | dnd-kit | 2022 (rbd deprecated by Atlassian) | dnd-kit is the standard React DnD library |
| HTML5 drag events | Pointer/Sensor abstraction (dnd-kit) | dnd-kit v6 | Better touch support, accessibility, no HTML5 DnD constraints |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Deprecated by Atlassian 2022; use dnd-kit instead.
- `@dnd-kit/sortable`: Not needed for this phase — sortable ordering within groups is not a requirement.

## Open Questions

1. **SVG line recomputation during dnd-kit active drag**
   - What we know: During drag, dnd-kit applies `transform` CSS to the dragged element, which changes its bounding rect. If a dragged dog is temporarily inside a group, the SVG line positions may jitter.
   - What's unclear: Whether the conflict overlay should be hidden during active drag or computed from stored state only.
   - Recommendation: Disable conflict line rendering while `active !== null` (dnd-kit provides `useDndMonitor` or `active` from `DndContext`). Re-enable on `onDragEnd`. This is simplest and aligns with D-16 (no optimistic UI during drag).

2. **Next group name counter**
   - What we know: D-05 says new groups get default names "Group 1", "Group 2". This requires tracking the next number.
   - What's unclear: Should the counter be in the slice or derived from existing group names?
   - Recommendation: Derive it in the UI at call time: `addGroup(\`Group ${walkGroups.length + 1}\`)`. No counter state needed in the store.

## Environment Availability

Step 2.6: No external dependencies beyond npm packages. All required tools are already present (Node.js, npm, Vitest, React). dnd-kit is not yet installed — it is a new npm dependency.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | (existing project) | — |
| @dnd-kit/core | DnD implementation | ✗ (not installed) | 6.3.1 on registry | No fallback — must install |
| @dnd-kit/utilities | CSS.Translate helper | ✗ (not installed) | 3.2.2 on registry | No fallback — must install |
| Vitest | Testing | ✓ | 2.1.9 | — |

**Missing dependencies with no fallback:**
- `@dnd-kit/core` and `@dnd-kit/utilities` — must be installed in Wave 0 of Plan 01.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 + React Testing Library 16.3.2 |
| Config file | `vite.config.ts` (test section) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

**Current baseline:** 106 tests, all green.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GROUP-01 | addGroup creates a group with correct name and empty dogIds | unit (slice) | `npx vitest run src/store/groupSlice.test.ts` | Wave 0 |
| GROUP-01 | addDogToGroup adds dog to group | unit (slice) | `npx vitest run src/store/groupSlice.test.ts` | Wave 0 |
| GROUP-01 | GroupBuilder renders roster panel and group panel | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | Wave 0 |
| GROUP-01 | onDragEnd with over=groupId calls addDogToGroup | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | Wave 0 |
| GROUP-02 | addDogToGroup removes dog from previous group before adding to new one | unit (slice) | `npx vitest run src/store/groupSlice.test.ts` | Wave 0 |
| GROUP-02 | Dog already in a group is rendered greyed out in roster | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | Wave 0 |
| GROUP-03 | Group score updates after dog added | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | Wave 0 |
| GROUP-04 | Conflict lines render when getConflictsInGroup returns conflict pairs | unit (component) | `npx vitest run src/components/GroupPanel.test.tsx` | Wave 0 |
| GROUP-04 | Unknown pairs do NOT render conflict lines | unit (component) | `npx vitest run src/components/GroupPanel.test.tsx` | Wave 0 |
| GROUP-05 | removeDogFromGroup removes dog and returns it to roster | unit (slice) | `npx vitest run src/store/groupSlice.test.ts` | Wave 0 |
| GROUP-05 | onDragEnd with over=roster calls removeDogFromGroup | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | Wave 0 |
| — | Groups tab renders in App.tsx | unit (component) | `npx vitest run src/components/CompatibilityGraph.test.tsx` | Existing — extend |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green (106 + new tests) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/store/groupSlice.test.ts` — covers GROUP-01, GROUP-02, GROUP-05 slice actions
- [ ] `src/components/GroupBuilder.test.tsx` — covers GROUP-01, GROUP-02, GROUP-03, GROUP-05 drag state via mocked onDragEnd
- [ ] `src/components/GroupPanel.test.tsx` — covers GROUP-04 conflict line rendering (mocks `getBoundingClientRect`)

*(Existing test infrastructure covers framework and setup — no new config needed)*

## Sources

### Primary (HIGH confidence)

- dndkit.com/api-documentation/draggable — `useDraggable` hook API, transform/style pattern
- dndkit.com/api-documentation/droppable — `useDroppable` hook API
- dndkit.com/api-documentation/context-provider — `DndContext` props, `DragEndEvent` structure
- dndkit.com/api-documentation/sensors — sensor configuration
- npm registry — version verification for `@dnd-kit/core` (6.3.1), `@dnd-kit/utilities` (3.2.2)
- `src/store/dogSlice.ts`, `src/store/compatSlice.ts`, `src/store/index.ts` — confirmed slice patterns
- `src/types/index.ts` — confirmed `WalkGroup` type already defined, `walkGroups` already in `AppState`
- `src/lib/scoring.ts` — confirmed `scoreGroup`, `getConflictsInGroup`, `buildCompatMap` are ready
- `src/components/EdgeSheet.tsx` — confirmed props interface; no modification needed

### Secondary (MEDIUM confidence)

- GitHub issue clauderic/dnd-kit#261 — jsdom testing limitations and recommended strategies (mock onDragEnd, not pointer events)

### Tertiary (LOW confidence)

- WebSearch: SVG overlay positioning pattern — standard React/SVG technique, widely documented but not from a single authoritative source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — dnd-kit versions verified via npm registry; library pre-decided
- Architecture: HIGH — based on reading actual source files; patterns verified against existing code
- Pitfalls: HIGH — WalkGroup type existence verified by reading types file; jsdom DnD limit verified from dnd-kit maintainer
- Test strategy: MEDIUM — mock onDragEnd approach is recommended by maintainer but exact DragEndEvent mock shape may need adjustment for dnd-kit v6 API

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (dnd-kit is stable; Zustand 5 is current)
