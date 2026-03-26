# Architecture Research

**Domain:** React SPA — scheduling, graph visualisation, drag-and-drop, LocalStorage persistence
**Researched:** 2026-03-26
**Confidence:** HIGH (Zustand, dnd-kit, Vitest are stable, well-documented libraries; patterns are established)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Roster  │  │  Graph   │  │ Builder  │  │  Calendar    │   │
│  │  Feature │  │  Feature │  │  Feature │  │   Feature    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │             │             │               │            │
├───────┴─────────────┴─────────────┴───────────────┴────────────┤
│                       Store Layer (Zustand)                     │
│  ┌───────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────┐  │
│  │  dogStore │  │CompatStore   │  │ walkStore │  │ uiStore  │  │
│  └─────┬─────┘  └──────┬───────┘  └─────┬─────┘  └────┬─────┘  │
│        │               │               │              │         │
├────────┴───────────────┴───────────────┴──────────────┴─────────┤
│                    Domain / Algorithm Layer                     │
│  ┌───────────────────┐   ┌──────────────────────────────────┐   │
│  │  scoring.ts        │   │  groupSuggest.ts                 │   │
│  │  (pure math fns)   │   │  (pure algorithm, no I/O)       │   │
│  └───────────────────┘   └──────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                   Storage Adapter Layer                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  StorageAdapter interface                                │   │
│  │  LocalStorageAdapter (v1)   FirebaseAdapter (future)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| Roster Feature | Dog CRUD, profile display | `features/roster/` |
| Graph Feature | Compatibility network display and edge editing | `features/graph/` using react-force-graph or Cytoscape.js |
| Builder Feature | Drag-and-drop group assembly with live compatibility feedback | `features/builder/` using dnd-kit |
| Calendar Feature | Weekly grid, drag walk groups into hour slots | `features/calendar/` using dnd-kit |
| dogStore | Dogs collection, CRUD actions | Zustand slice |
| compatStore | CompatibilityEdge map, score cache | Zustand slice |
| walkStore | WalkGroups, TimeSlots, WalkRecords (history) | Zustand slice |
| uiStore | Selected dog, active panel, modal state | Zustand slice |
| scoring.ts | Pure function: score a proposed group | `lib/scoring.ts` |
| groupSuggest.ts | Pure function: suggest optimal groups | `lib/groupSuggest.ts` |
| StorageAdapter | Interface all stores write/read through | `storage/StorageAdapter.ts` |

---

## Core Domain Model

All types live in `src/types/domain.ts`.

```typescript
// ─── Primitive IDs ────────────────────────────────────────────────────────────
type DogId      = string   // crypto.randomUUID()
type GroupId    = string
type RecordId   = string
type SlotId     = string

// ─── Dog ──────────────────────────────────────────────────────────────────────
interface Dog {
  id:          DogId
  name:        string
  breed:       string        // free text
  ownerName:   string
  ownerPhone:  string
  notes:       string
  avatarUrl?:  string        // optional local blob URL or placeholder
  createdAt:   string        // ISO 8601
  archivedAt?: string        // ISO 8601 — soft delete; present means archived
}

// ─── Compatibility ────────────────────────────────────────────────────────────
// Score: 1 = excellent, 0 = neutral/unknown, -1 = conflict
// Store every pair once: key is `${dogIdA}:${dogIdB}` where dogIdA < dogIdB
type CompatScore = 1 | 0.5 | 0 | -0.5 | -1

interface CompatibilityEdge {
  dogIdA:    DogId          // always the lexicographically smaller ID
  dogIdB:    DogId
  score:     CompatScore
  notes:     string
  updatedAt: string         // ISO 8601
}

// ─── Walk Group ───────────────────────────────────────────────────────────────
interface WalkGroup {
  id:         GroupId
  name:       string
  dogIds:     DogId[]
  createdAt:  string
}

// ─── Time Slot ────────────────────────────────────────────────────────────────
interface TimeSlot {
  id:         SlotId
  date:       string        // ISO 8601 date (YYYY-MM-DD)
  startHour:  number        // 0–23
  durationMins: number      // typically 60
  groupId:    GroupId | null
}

// ─── Walk Record (history) ────────────────────────────────────────────────────
type WalkOutcome = 'excellent' | 'good' | 'neutral' | 'poor' | 'incident'

interface WalkRecord {
  id:         RecordId
  slotId:     SlotId
  groupId:    GroupId
  dogIds:     DogId[]       // snapshot at time of walk (group may change later)
  date:       string        // ISO 8601 date
  outcome:    WalkOutcome
  notes:      string
  createdAt:  string
}

// ─── Root state shape (all stores combined) ───────────────────────────────────
interface AppState {
  dogs:          Record<DogId, Dog>
  edges:         Record<string, CompatibilityEdge>   // key: `${idA}:${idB}`
  groups:        Record<GroupId, WalkGroup>
  slots:         Record<SlotId, TimeSlot>
  records:       Record<RecordId, WalkRecord>
}
```

**Key design decisions:**
- Use `Record<Id, Entity>` maps (not arrays) — O(1) lookup by ID, trivially serialisable to JSON
- Edge key normalisation (`idA < idB` lexicographically) means every pair has exactly one entry
- `WalkRecord.dogIds` snapshots the group members at walk time — history survives group edits
- `archivedAt` soft-deletes dogs rather than destroying compatibility history

---

## Storage Adapter Interface

All stores communicate with storage exclusively through this interface. LocalStorage is v1; Firebase is a future swap.

```typescript
// src/storage/StorageAdapter.ts

export interface StorageAdapter {
  /** Load the entire persisted state. Returns null if nothing stored yet. */
  load(): Promise<AppState | null>

  /** Persist the entire state. Called after every store mutation. */
  save(state: AppState): Promise<void>

  /** Remove all persisted data (used in tests and "reset app" UI). */
  clear(): Promise<void>
}
```

```typescript
// src/storage/LocalStorageAdapter.ts

const STORAGE_KEY = 'dog-tracker-v1'

export class LocalStorageAdapter implements StorageAdapter {
  async load(): Promise<AppState | null> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AppState
    } catch {
      console.error('Failed to parse stored state — returning null')
      return null
    }
  }

  async save(state: AppState): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
}
```

**Why async even though localStorage is synchronous:**
- The interface must match future async adapters (Firebase, IndexedDB)
- `async` on sync operations is zero-cost (resolves immediately)
- Swapping to Firebase later requires only a new class, not a signature change

**Testing with an InMemoryAdapter:**
```typescript
// src/storage/InMemoryAdapter.ts  (test use only)

export class InMemoryAdapter implements StorageAdapter {
  private data: AppState | null = null

  async load()  { return this.data ? { ...this.data } : null }
  async save(s) { this.data = { ...s } }
  async clear() { this.data = null }
}
```

---

## Zustand Store Architecture

### Store Slices

Use Zustand's slice pattern: each domain slice owns its state and actions, then they are combined into one store. This gives clean separation while avoiding the cross-store communication overhead of multiple independent stores.

```
src/store/
├── index.ts              ← createStore combining all slices; exports useStore
├── dogSlice.ts           ← Dog CRUD
├── compatSlice.ts        ← CompatibilityEdge CRUD + score cache
├── walkSlice.ts          ← WalkGroup, TimeSlot, WalkRecord
└── uiSlice.ts            ← UI-only transient state (selected IDs, modals)
```

**Combined store type:**
```typescript
// src/store/index.ts
type StoreState =
  DogSlice &
  CompatSlice &
  WalkSlice &
  UiSlice

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createDogSlice(...a),
      ...createCompatSlice(...a),
      ...createWalkSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: 'dog-tracker-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

**Note on Zustand persist middleware vs. custom StorageAdapter:**
The custom `StorageAdapter` interface (above) is the right choice for this project because:
- It provides a clean boundary for testing (swap in `InMemoryAdapter`)
- It gives explicit control over when saves fire
- It's not tied to Zustand internals if the state library changes

Implement persistence via a `useEffect` in a `<PersistenceManager />` component that watches the store and calls `adapter.save()` on change — OR wrap store mutations to call `adapter.save()` after each action. The Zustand `persist` middleware is simpler but couples you to Zustand's API surface for the save logic.

**Recommendation:** Use the custom `StorageAdapter` class, called from a thin Zustand middleware written once in `src/store/persistMiddleware.ts`.

### Slice Interfaces

```typescript
// src/store/dogSlice.ts
interface DogSlice {
  dogs: Record<DogId, Dog>
  addDog:    (dog: Omit<Dog, 'id' | 'createdAt'>) => Dog
  updateDog: (id: DogId, patch: Partial<Omit<Dog, 'id'>>) => void
  archiveDog:(id: DogId) => void
  activeDogs:() => Dog[]    // computed — filters archivedAt === undefined
}

// src/store/compatSlice.ts
interface CompatSlice {
  edges: Record<string, CompatibilityEdge>
  setEdge:   (idA: DogId, idB: DogId, score: CompatScore, notes: string) => void
  getEdge:   (idA: DogId, idB: DogId) => CompatibilityEdge | undefined
  scoreGroup:(dogIds: DogId[]) => number   // delegates to lib/scoring.ts
}

// src/store/walkSlice.ts
interface WalkSlice {
  groups:  Record<GroupId, WalkGroup>
  slots:   Record<SlotId, TimeSlot>
  records: Record<RecordId, WalkRecord>
  // Groups
  createGroup:    (name: string, dogIds: DogId[]) => WalkGroup
  updateGroup:    (id: GroupId, patch: Partial<Omit<WalkGroup, 'id'>>) => void
  deleteGroup:    (id: GroupId) => void
  // Slots
  createSlot:     (date: string, startHour: number, durationMins: number) => TimeSlot
  assignGroup:    (slotId: SlotId, groupId: GroupId | null) => void
  deleteSlot:     (slotId: SlotId) => void
  // Records
  logWalk:        (slotId: SlotId, outcome: WalkOutcome, notes: string) => WalkRecord
  recordsForDog:  (dogId: DogId) => WalkRecord[]
}

// src/store/uiSlice.ts
interface UiSlice {
  selectedDogId:   DogId | null
  activePanelTab:  'roster' | 'builder' | 'calendar' | 'history'
  modalOpen:       boolean
  setSelectedDog:  (id: DogId | null) => void
  setActiveTab:    (tab: UiSlice['activePanelTab']) => void
  openModal:       () => void
  closeModal:      () => void
}
```

---

## Folder Structure

```
src/
├── types/
│   └── domain.ts              # All domain interfaces and ID types
│
├── lib/
│   ├── scoring.ts             # scoreGroup(dogs, edges): number  — pure fn
│   ├── scoring.test.ts        # Vitest unit tests
│   ├── groupSuggest.ts        # suggestGroups(dogs, edges, size): DogId[][]  — pure fn
│   └── groupSuggest.test.ts
│
├── storage/
│   ├── StorageAdapter.ts      # Interface definition
│   ├── LocalStorageAdapter.ts # Production implementation
│   └── InMemoryAdapter.ts     # Test / dev implementation
│
├── store/
│   ├── index.ts               # Combined store, useStore export
│   ├── dogSlice.ts
│   ├── compatSlice.ts
│   ├── walkSlice.ts
│   ├── uiSlice.ts
│   └── persistMiddleware.ts   # Thin middleware wiring StorageAdapter to store
│
├── features/
│   ├── roster/
│   │   ├── RosterPanel.tsx      # Container: reads dogStore, renders list
│   │   ├── DogCard.tsx          # Presentational: one dog
│   │   ├── DogForm.tsx          # Add/edit form
│   │   └── RosterPanel.test.tsx
│   │
│   ├── graph/
│   │   ├── CompatGraph.tsx      # Container: wraps react-force-graph/cytoscape
│   │   ├── EdgeEditor.tsx       # Popover: edit score for a pair
│   │   ├── graphHelpers.ts      # Transform store state → graph node/edge format
│   │   ├── graphHelpers.test.ts
│   │   └── CompatGraph.test.tsx
│   │
│   ├── builder/
│   │   ├── GroupBuilder.tsx     # DnD context root, orchestrates slots
│   │   ├── DraggableDog.tsx     # dnd-kit draggable dog chip
│   │   ├── GroupDropZone.tsx    # dnd-kit droppable group container
│   │   ├── CompatBadge.tsx      # Live score badge, reads compatSlice
│   │   └── GroupBuilder.test.tsx
│   │
│   ├── calendar/
│   │   ├── WeekCalendar.tsx     # Container: weekly hour grid
│   │   ├── HourSlot.tsx         # dnd-kit droppable hour cell
│   │   ├── GroupChip.tsx        # dnd-kit draggable group tile
│   │   ├── calendarHelpers.ts   # Date/slot utility fns
│   │   ├── calendarHelpers.test.ts
│   │   └── WeekCalendar.test.tsx
│   │
│   └── history/
│       ├── HistoryPanel.tsx     # Container: per-dog walk history
│       ├── WalkTimeline.tsx     # Recharts/Nivo chart of outcomes over time
│       ├── WalkLogForm.tsx      # Form to record walk outcome
│       └── HistoryPanel.test.tsx
│
├── components/                 # Truly shared presentational components
│   ├── Modal.tsx
│   ├── Button.tsx
│   └── Badge.tsx
│
├── hooks/
│   └── usePersistence.ts       # Initialises adapter, loads state on mount
│
├── test/
│   └── setup.ts                # @testing-library/jest-dom imports
│
├── App.tsx                     # Shell: tab nav, renders active feature panel
├── main.tsx
└── index.css
```

**Structure rationale:**
- `features/` groups by domain feature, not by component type — each feature is a vertical slice (container + presentational + tests)
- `lib/` holds pure algorithmic functions with no React dependency — trivially testable
- `storage/` is isolated so the adapter can be swapped without touching stores
- `store/` is isolated from features — features import from `store/`, never vice versa
- `components/` is for genuinely shared UI atoms only, not feature logic

---

## Architectural Patterns

### Pattern 1: Feature Vertical Slices

**What:** Each feature folder contains its container component, presentational sub-components, helpers, and tests together. Features import from `store/` and `lib/`, but not from each other.

**When to use:** When a project has 3+ distinct features with separate concerns — prevents a flat `components/` folder with 40 files where you can't tell what belongs together.

**Trade-offs:** Slightly more directories. Worth it past ~3 features.

**Example:**
```
features/builder/
  GroupBuilder.tsx       ← imports useStore, dnd-kit
  DraggableDog.tsx       ← presentational, receives dogId prop
  GroupDropZone.tsx      ← presentational, receives groupId prop
  CompatBadge.tsx        ← reads compatSlice.scoreGroup
  GroupBuilder.test.tsx  ← tests builder interactions
```

### Pattern 2: Repository / Storage Adapter

**What:** All persistence goes through a `StorageAdapter` interface. Stores never call `localStorage` directly. Tests inject `InMemoryAdapter`.

**When to use:** Always — even if you never migrate to Firebase, the testability alone justifies it.

**Trade-offs:** Two extra files (`LocalStorageAdapter.ts`, `InMemoryAdapter.ts`). Zero runtime cost.

**Example:**
```typescript
// store/persistMiddleware.ts
export function withPersist(adapter: StorageAdapter) {
  return (config: StateCreator<AppState>) =>
    (set: SetState<AppState>, get: GetState<AppState>, api: StoreApi<AppState>) => {
      const result = config(
        (partial, replace) => {
          set(partial, replace)
          adapter.save(get())      // fire-and-forget; errors logged, not thrown
        },
        get,
        api
      )
      return result
    }
}
```

### Pattern 3: Pure Algorithm Module

**What:** Grouping math and compatibility scoring live in `src/lib/` as pure TypeScript functions with no React, no store, no I/O.

**When to use:** Any logic with inputs → outputs that doesn't need side effects.

**Trade-offs:** Requires passing data in rather than reading from store — slightly more verbose call sites, but dramatically easier to test.

**Example:**
```typescript
// src/lib/scoring.ts

/** Returns a group score between -1 (all conflicts) and 1 (all excellent). */
export function scoreGroup(
  dogIds: DogId[],
  edges: Record<string, CompatibilityEdge>
): number {
  if (dogIds.length < 2) return 1
  let total = 0
  let pairs = 0
  for (let i = 0; i < dogIds.length; i++) {
    for (let j = i + 1; j < dogIds.length; j++) {
      const key = edgeKey(dogIds[i], dogIds[j])
      const edge = edges[key]
      total += edge?.score ?? 0   // unknown pairs count as neutral
      pairs++
    }
  }
  return pairs > 0 ? total / pairs : 1
}

export function edgeKey(idA: DogId, idB: DogId): string {
  return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`
}
```

### Pattern 4: dnd-kit Context Boundaries

**What:** Each drag-and-drop surface (group builder, calendar) wraps its own `<DndContext>`. Dogs dragged into groups is one context; groups dragged into calendar slots is a separate context.

**When to use:** When two DnD interactions are independent and share no draggable items.

**Trade-offs:** Two contexts means items can't be dragged across contexts in a single gesture. That's fine here — a dog chip can't be dragged directly into a calendar cell without first being in a group.

**Example:**
```typescript
// features/builder/GroupBuilder.tsx
import { DndContext, closestCenter } from '@dnd-kit/core'

export function GroupBuilder() {
  const { dogs } = useStore()
  function handleDragEnd(event: DragEndEvent) {
    // move dog from roster pool into target group
  }
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <DogPool dogs={activeDogs} />
      <GroupSlotList />
    </DndContext>
  )
}
```

---

## Data Flow

### Drag Dog into Group

```
User drops DogChip onto GroupDropZone
    ↓
dnd-kit onDragEnd fires with { active.id: dogId, over.id: groupId }
    ↓
GroupBuilder.handleDragEnd
    ↓
walkSlice.updateGroup(groupId, { dogIds: [...existing, dogId] })
    ↓
Zustand set() updates store state
    ↓
persistMiddleware calls adapter.save(newState)
    ↓
React re-renders: GroupDropZone shows dog; CompatBadge recalculates score
```

### Compatibility Score Calculation

```
CompatBadge mounts with groupId prop
    ↓
reads group.dogIds from walkSlice
reads edges from compatSlice
    ↓
calls lib/scoring.scoreGroup(dogIds, edges)  ← pure, no store access
    ↓
renders score badge (colour-coded: green/amber/red)
```

### State Hydration on App Load

```
App mounts
    ↓
usePersistence hook calls adapter.load()
    ↓
if (state) useStore.setState(state)
    ↓
all store subscribers re-render with persisted data
```

---

## TDD Architecture

### Test Strategy by Layer

| Layer | Test Type | Tool | Pattern |
|-------|-----------|------|---------|
| `lib/scoring.ts` | Unit | Vitest | Pure fn — assert output for given inputs. No mocks. |
| `lib/groupSuggest.ts` | Unit | Vitest | Pure fn — test edge cases: empty roster, all-conflict pairs, size constraints. |
| `storage/LocalStorageAdapter.ts` | Unit | Vitest + jsdom | Mock `localStorage` via `vi.stubGlobal('localStorage', ...)` or use jsdom's built-in. |
| Store slices | Unit | Vitest | Call actions directly on a fresh store instance; assert state changes. |
| `features/*/graphHelpers.ts` | Unit | Vitest | Pure transform fns — no React needed. |
| Feature components (non-DnD) | Integration | Vitest + RTL | Render with `InMemoryAdapter`, interact via RTL, assert rendered output. |
| DnD interactions | Integration | Vitest + RTL + dnd-kit test utils | Use `@dnd-kit/core` pointer sensor simulation or fire pointer events manually. |
| `StorageAdapter` | Unit | Vitest | Test `InMemoryAdapter` for interface compliance; test `LocalStorageAdapter` with jsdom localStorage. |

### Testing Drag-and-Drop

dnd-kit does not ship a dedicated test helper, but interactions are testable by simulating pointer events at the correct coordinates. The recommended pattern is:

```typescript
// features/builder/GroupBuilder.test.tsx
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'

test('dropping a dog onto a group adds it to the group', async () => {
  const adapter = new InMemoryAdapter()
  // pre-seed state
  await adapter.save(buildState({ dogs: [dogA], groups: [emptyGroup] }))

  render(<TestProviders adapter={adapter}><GroupBuilder /></TestProviders>)

  const dogChip = screen.getByTestId('dog-chip-dogA')
  const dropZone = screen.getByTestId('group-drop-zone-group1')

  // Simulate dnd-kit pointer drag
  fireEvent.pointerDown(dogChip, { clientX: 10, clientY: 10 })
  fireEvent.pointerMove(dropZone, { clientX: 100, clientY: 100 })
  fireEvent.pointerUp(dropZone,   { clientX: 100, clientY: 100 })

  expect(screen.getByTestId('group-drop-zone-group1'))
    .toHaveTextContent('Dog A')
})
```

**Key:** `data-testid` attributes on DnD-enabled elements are the stable test handles. dnd-kit's sensors detect pointer events — no library-specific test API needed.

### Testing LocalStorage Persistence

```typescript
// storage/LocalStorageAdapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageAdapter } from './LocalStorageAdapter'

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageAdapter()
  })

  it('returns null when nothing is stored', async () => {
    expect(await adapter.load()).toBeNull()
  })

  it('round-trips state through save and load', async () => {
    const state = buildMinimalState()
    await adapter.save(state)
    expect(await adapter.load()).toEqual(state)
  })

  it('clear removes stored data', async () => {
    await adapter.save(buildMinimalState())
    await adapter.clear()
    expect(await adapter.load()).toBeNull()
  })

  it('returns null and logs when stored JSON is corrupt', async () => {
    localStorage.setItem('dog-tracker-v1', 'not-json{{{')
    expect(await adapter.load()).toBeNull()
  })
})
```

### Testing Store Slices

```typescript
// store/dogSlice.test.ts
import { createStore } from 'zustand/vanilla'
import { createDogSlice } from './dogSlice'

test('addDog generates an ID and sets createdAt', () => {
  const store = createStore(createDogSlice)
  const dog = store.getState().addDog({
    name: 'Biscuit', breed: 'Labrador', ownerName: 'Jo', ownerPhone: '', notes: ''
  })
  expect(dog.id).toBeTruthy()
  expect(store.getState().dogs[dog.id]).toMatchObject({ name: 'Biscuit' })
})
```

### Testing the Scoring Algorithm

```typescript
// lib/scoring.test.ts
import { scoreGroup, edgeKey } from './scoring'

test('returns 1 for single dog', () => {
  expect(scoreGroup(['a'], {})).toBe(1)
})

test('returns edge score for two dogs', () => {
  const edges = { [edgeKey('a', 'b')]: { score: 1, dogIdA: 'a', dogIdB: 'b', notes: '', updatedAt: '' } }
  expect(scoreGroup(['a', 'b'], edges)).toBe(1)
})

test('unknown pairs count as 0 (neutral)', () => {
  expect(scoreGroup(['a', 'b'], {})).toBe(0)
})

test('averages across all pairs', () => {
  const edges = {
    [edgeKey('a', 'b')]: makeEdge('a', 'b',  1),
    [edgeKey('b', 'c')]: makeEdge('b', 'c', -1),
    [edgeKey('a', 'c')]: makeEdge('a', 'c',  0),
  }
  expect(scoreGroup(['a', 'b', 'c'], edges)).toBe(0)
})
```

---

## Anti-Patterns

### Anti-Pattern 1: God Component

**What people do:** Put all DnD logic, calendar rendering, group management, and compatibility display in one `<App />` component.

**Why it's wrong:** Untestable. Every test requires the entire application to render. State becomes entangled. Cannot be worked on independently.

**Do this instead:** Feature vertical slices. `<App />` renders a tab strip and the active feature panel. Each feature is self-contained.

### Anti-Pattern 2: Direct localStorage Calls in Components

**What people do:** `localStorage.setItem(...)` called inline in event handlers or `useEffect` hooks inside components.

**Why it's wrong:** Impossible to test without a real browser. No migration path to Firebase. Cannot swap storage in tests.

**Do this instead:** `StorageAdapter` interface. Components call store actions; the store's persist middleware calls the adapter.

### Anti-Pattern 3: Compatibility Logic in Components

**What people do:** The compatibility scoring formula embedded in `CompatBadge.tsx` or `GroupBuilder.tsx`.

**Why it's wrong:** Logic is non-reachable by unit tests without rendering React. Cannot be reused in the auto-suggest algorithm. Impossible to reason about edge cases.

**Do this instead:** `lib/scoring.ts` pure function. Component calls `scoreGroup(dogIds, edges)` — the math lives entirely outside React.

### Anti-Pattern 4: Nested DnD Contexts for a Single Surface

**What people do:** Wrap every droppable in its own `<DndContext>` to avoid prop-drilling the `onDragEnd` handler.

**Why it's wrong:** dnd-kit requires one `DndContext` per drag surface — items can only be dragged between containers within the same context. Multiple nested contexts will silently break cross-container drops.

**Do this instead:** One `<DndContext>` per logical drag surface (group builder = one; calendar = one). Pass handlers down or read groupId/slotId from `event.over.data.current`.

### Anti-Pattern 5: Mutable Arrays in Store State

**What people do:** `state.dogs.push(newDog)` inside a Zustand action.

**Why it's wrong:** Zustand requires immutable state updates to trigger re-renders.

**Do this instead:** `Record<Id, Entity>` maps. Adding: `{ ...state.dogs, [newDog.id]: newDog }`. Removing: destructure with rest. Arrays for ordered sequences only when order matters and is explicit.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Features → Store | Import `useStore` selector | Features never import other features |
| Store → Storage | persistMiddleware calls `adapter.save()` | Adapter injected at app init |
| Features → Algorithm | Import pure fn from `lib/` | No store access inside `lib/` |
| Graph library → Store | `graphHelpers.ts` transforms store state to graph format | Isolated transform fn, tested independently |
| DnD library → Store | `onDragEnd` handler calls store action | Handler lives in feature container |

### Firebase Migration Path

When migrating from LocalStorage to Firebase:

1. Write `FirebaseAdapter implements StorageAdapter`
2. Replace `new LocalStorageAdapter()` with `new FirebaseAdapter(firebaseConfig)` in `src/hooks/usePersistence.ts`
3. `save()` becomes a Firestore `setDoc` call; `load()` becomes a `getDoc` call
4. All store slices, features, and tests are unchanged

No other files need to change. This is the entire value of the adapter pattern.

---

## Scaling Considerations

This is a single-user browser tool. Scaling is not a concern. The relevant "scaling" questions are data volume, not user count:

| Concern | At 20 dogs | At 200 dogs |
|---------|------------|-------------|
| LocalStorage capacity | ~50KB — fine | ~500KB — fine (5MB limit) |
| Graph rendering performance | Fine | May need layout algorithm tuning in react-force-graph |
| Group scoring performance | O(n²) pairs — negligible | O(n²) — still negligible for n≤200 |
| Auto-suggest performance | Brute-force fine | May need pruning; flag for Phase when implementing |

---

## Sources

- Zustand slice pattern: https://zustand.docs.pmnd.rs/guides/slices-pattern (MEDIUM confidence — pattern stable since v4, no Context7 verification available in this session)
- dnd-kit architecture: https://docs.dndkit.com (MEDIUM confidence — training data through Aug 2025)
- Vitest + RTL: https://vitest.dev, https://testing-library.com/docs/react-testing-library (HIGH confidence — stable, well-documented)
- dnd-kit pointer event simulation: community pattern, multiple sources agree (MEDIUM confidence)
- Repository/Adapter pattern: classic OOP pattern, not library-specific (HIGH confidence)

---

*Architecture research for: Dog Walk Planner React SPA*
*Researched: 2026-03-26*
