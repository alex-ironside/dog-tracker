# Phase 6: Walk History - Research

**Researched:** 2026-03-28
**Domain:** Zustand slice pattern (walkHistorySlice), Recharts 3.x ScatterChart, React Sheet form, LocalStorage persistence, Vitest + RTL test patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** A fifth tab "History" is added to App.tsx. Tab order: Dogs | Compatibility | Groups | Calendar | History.
- **D-02:** Calendar tab — each scheduled slot card gains a "Log" button. Clicking pre-fills the dog snapshot from the walk group's current dog list. The behaviorist can remove absent dogs before saving.
- **D-03:** History tab — has a "Log a walk" button at the top + a scrollable list of all past walk log entries. Catch-all path for off-schedule/retrospective logging (manual dog selection, date picker).
- **D-04:** DogPanel History sub-tab — has a "Log a walk for [dog name]" button. That dog is pre-filled; behaviorist selects other dogs, picks outcome, date, and notes.
- **D-05:** Log form fields: date (date picker, defaults to today, supports backdating), outcome enum (Great / Good / Neutral / Poor / Incident), optional free-text notes, multi-select dog list. Pre-populates from Calendar or DogPanel when triggered there.
- **D-06:** Log form is presented in a Sheet (consistent with DogPanel, EdgeSheet). After save, entry is immutable (HIST-03).
- **D-07:** `WalkLogEntry` type: `{ id: string; date: string; outcome: WalkOutcome; notes: string; dogIds: string[]; groupId?: string }` — `WalkOutcome = 'great' | 'good' | 'neutral' | 'poor' | 'incident'`
- **D-08:** `WalkLogEntry` is standalone — NOT formally linked to a WalkSession. `groupId` is optional metadata only.
- **D-09:** `walkHistorySlice` named `walkHistory` in AppState. Follows Zustand `StateCreator<AppState & AllActions, [], [], WalkHistoryActions>` slice pattern. Persisted via existing LocalStorage persist layer.
- **D-10:** `AppState` gains a `walkHistory: WalkLogEntry[]` field (distinct from `walkSessions: WalkSession[]`).
- **D-11:** `DogPanel` gains two tabs: "Profile" (existing form) and "History" (chart + log button). Tab switcher inside panel below header.
- **D-12:** History tab: (1) "Log a walk for [dog name]" button, (2) Recharts scatter/dot chart of outcomes over time, (3) list of recent log entries below chart.
- **D-13:** Profile tab footer (Save/Discard) shown only when Profile tab is active. History tab has no footer.
- **D-14:** Chart type: ScatterChart. X-axis = date, Y-axis = outcome level (numeric mapping). Each dot colour-coded by outcome.
- **D-15:** Shows ALL historical entries (no cap).
- **D-16:** Tooltip on hover: date, outcome label, truncated notes.
- **D-17:** Y-axis labels show outcome names. X-axis shows month/year ticks.
- **D-18:** History tab shows: "Log a walk" button + reverse-chronological list. Filtering: Claude's discretion (keep simple for v1).

### Claude's Discretion

- Exact Tailwind styling — slate palette, shadcn/ui patterns, consistent with existing app.
- Outcome colour palette for chart dots (suggested: green/teal/grey/amber/red for Great→Incident).
- Whether the history list in the History tab supports filtering by dog or outcome — keep simple for v1.
- DogPanel tab implementation (shadcn/ui tabs component vs simple button toggle).
- Whether "Log" button on calendar slot card opens the Sheet inline or navigates to the History tab.

### Deferred Ideas (OUT OF SCOPE)

- Edit/delete walk log entries (entries immutable, HIST-03).
- Filter history list by dog or outcome — v2 enhancement.
- Walk duration logging (LOG-01, v2).
- CSV export of walk logs (LOG-02, v2).
- History visible from calendar slot (Phase 6/7 bridge — defer).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HIST-01 | After a walk, behaviorist can log an outcome: Great / Good / Neutral / Poor / Incident | walkHistorySlice addWalkLog action; WalkLogEntry.outcome enum; WalkLogSheet component |
| HIST-02 | Behaviorist can add free-text notes to a walk log entry | WalkLogEntry.notes: string; notes textarea in log form |
| HIST-03 | Each walk log entry records an immutable snapshot of dogs present | dogIds: string[] copied at log time; no edit action in slice; Sheet closes without edit capability |
| HIST-04 | Each dog has a history view showing walk outcomes over time as a chart | DogPanel History tab; WalkHistoryChart component filtering walkHistory by dogId |
| HIST-05 | Walk history chart uses Recharts (not custom SVG) | Recharts 3.8.1 ScatterChart API documented below |

</phase_requirements>

---

## Summary

Phase 6 adds walk outcome logging (HIST-01 through HIST-05) to the existing React 18 + Zustand + Vite SPA. The work splits into two plans: Plan 01 adds the data layer (`walkHistorySlice`, types, migration, persistence), and Plan 02 adds the UI layer (Recharts chart in DogPanel, WalkLogSheet form, History tab in App.tsx, Log button on CalendarSlot).

The primary technical risk is Recharts. The project STATE.md flagged "Recharts version (2.x vs 3.x) needs npm verification before Phase 6." **Verification result: npm latest is 3.8.1 (not 2.x).** This is significant — Recharts 3.0 introduced breaking changes (CategoricalChartState removed, `activeIndex` removed from Scatter, tooltip changes). The ScatterChart API itself is still composable and stable; the main impact is that any code that accessed internal chart state via props no longer works. For this project's use case (simple scatter plot with tooltip) no breaking change applies. Recharts 3 also requires `react-is` as a peer dependency.

The data model is clean and aligns with established slice patterns. `walkHistorySlice` mirrors `scheduleSlice` in structure. The LocalStorage persist layer already exists; only `partialize` and the schema version need updating. ResizeObserver is already stubbed globally in `src/test/setup.ts` — no additional test setup required for Recharts component tests.

**Primary recommendation:** Install `recharts` and `react-is` (peer dep), add `walkHistory: []` to the store initialiser and `partialize`, bump `CURRENT_SCHEMA_VERSION` to 2 with a v1→v2 migration that adds `walkHistory: []`, then build slice + UI in two plans.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 (latest) | ScatterChart for outcome timeline | Locked decision (HIST-05, STATE.md, Init decision) |
| react-is | (peer dep, use version matching React 18) | Recharts 3 peer dependency | Required by recharts 3.x |
| zustand | ^5.0.12 (already installed) | walkHistorySlice state | Already the app state manager |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Sheet | already in project | WalkLogSheet form container | Locked (D-06) — consistent with DogPanel, EdgeSheet |
| shadcn/ui Button, Input, Label | already in project | Form controls in WalkLogSheet | Standard across all form panels |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ScatterChart | LineChart or BarChart | ScatterChart is locked (D-14); scatter/dot plot better for sparse data at irregular intervals |
| recharts 3.x | recharts 2.x | 2.x not current; 3.x is npm latest and has identical ScatterChart usage for this use case |

**Installation:**
```bash
npm install recharts react-is
```

**Version verification:** Confirmed 2026-03-28 via `npm view recharts version` → `3.8.1`

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 6:
```
src/
├── store/
│   └── walkHistorySlice.ts      # new: WalkHistoryActions + createWalkHistorySlice
├── components/
│   ├── WalkHistory.tsx           # new: 5th tab content (log button + entry list)
│   ├── WalkLogSheet.tsx          # new: shared log form Sheet (3 entry points)
│   └── WalkHistoryChart.tsx      # new: Recharts ScatterChart for a single dog
├── types/
│   └── index.ts                  # extend: WalkOutcome, WalkLogEntry, AppState.walkHistory
```

Existing files modified:
```
src/
├── App.tsx                       # add 'history' tab + <WalkHistory />
├── store/index.ts                # wire createWalkHistorySlice; add walkHistory to init + partialize
├── store/migrations.ts           # bump CURRENT_SCHEMA_VERSION to 2; v1→v2 adds walkHistory: []
├── components/DogPanel.tsx       # add Profile/History tab switcher
├── components/CalendarSlot.tsx   # add Log button (or ScheduledGroupCard gains Log button)
```

### Pattern 1: walkHistorySlice (mirrors scheduleSlice)

**What:** A Zustand `StateCreator` exporting `WalkHistoryActions` with a single `addWalkLog` action. No edit/delete (HIST-03 immutability).

**When to use:** All state mutations flow through the slice.

**Example (inferred from groupSlice.ts + scheduleSlice.ts patterns in codebase):**
```typescript
// Source: src/store/groupSlice.ts and scheduleSlice.ts (project patterns)
import type { StateCreator } from 'zustand'
import type { AppState, WalkLogEntry } from '@/types'

export type WalkHistoryActions = {
  addWalkLog: (entry: Omit<WalkLogEntry, 'id'>) => void
}

export const createWalkHistorySlice: StateCreator<
  AppState & WalkHistoryActions,
  [],
  [],
  WalkHistoryActions
> = (set) => ({
  addWalkLog: (entry) =>
    set((state) => ({
      walkHistory: [
        ...state.walkHistory,
        { ...entry, id: crypto.randomUUID() },
      ],
    })),
})
```

### Pattern 2: Store wiring (mirrors existing index.ts pattern)

Wire the slice in `src/store/index.ts`. Three changes: import slice, add to `AppStore` type, add to store initialiser, add `walkHistory` to `partialize`.

```typescript
// src/store/index.ts additions (Source: existing index.ts pattern)
import { createWalkHistorySlice, type WalkHistoryActions } from './walkHistorySlice'

export type AppStore = AppState & DogActions & CompatActions & GroupActions
  & ScheduleActions & WalkHistoryActions

// In create():
walkHistory: [],
...createWalkHistorySlice(...a),

// In partialize:
walkHistory: state.walkHistory,
```

### Pattern 3: Schema migration (bump version)

```typescript
// src/store/migrations.ts — bump to 2, add v1→v2 branch
export const CURRENT_SCHEMA_VERSION = 2

export function migrate(persistedState: unknown, version: number): AppState {
  const state = persistedState as AppState

  if (version < 2) {
    return {
      ...state,
      walkHistory: [],
      schemaVersion: 2,
    }
  }

  return { ...state, schemaVersion: CURRENT_SCHEMA_VERSION }
}
```

### Pattern 4: Recharts ScatterChart for outcome timeline

**Data model for chart:** Transform `WalkLogEntry[]` (filtered to current dog) into `{ x: number, y: number, label: string, notes: string }[]` where `x` is a timestamp (ms) derived from the ISO date string and `y` is a numeric outcome level.

**Outcome numeric mapping:**
```typescript
const OUTCOME_Y: Record<WalkOutcome, number> = {
  great:    5,
  good:     4,
  neutral:  3,
  poor:     2,
  incident: 1,
}
```

**ScatterChart shell (Recharts 3.x API — HIGH confidence):**
```tsx
// Source: recharts.github.io/en-US/api/ScatterChart + npm recharts@3.8.1 peer dep check
import {
  ScatterChart, Scatter, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'

<ResponsiveContainer width="100%" height={220}>
  <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="x"
      type="number"
      domain={['auto', 'auto']}
      tickFormatter={(ms: number) =>
        new Date(ms).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      }
      name="Date"
    />
    <YAxis
      dataKey="y"
      type="number"
      domain={[0, 6]}
      ticks={[1, 2, 3, 4, 5]}
      tickFormatter={(v: number) => OUTCOME_LABELS[v] ?? ''}
      width={60}
    />
    <Tooltip
      content={<WalkHistoryTooltip />}
    />
    <Scatter
      data={chartData}
      fill="#64748b"
    />
  </ScatterChart>
</ResponsiveContainer>
```

**Note on dot colouring by outcome:** Standard `<Scatter fill>` sets one colour for all dots. To colour each dot individually, pass a custom `shape` render prop or use a `Cell` component for each point. The simplest approach is a custom `shape` that reads the datum's `outcome` field and returns a circle with the appropriate colour.

```tsx
// Custom shape for per-outcome colour (Source: recharts Scatter API)
const OUTCOME_COLORS: Record<WalkOutcome, string> = {
  great:    '#22c55e',  // green-500
  good:     '#14b8a6',  // teal-500
  neutral:  '#94a3b8',  // slate-400
  poor:     '#f59e0b',  // amber-500
  incident: '#ef4444',  // red-500
}

function OutcomeDot(props: any) {
  const { cx, cy, payload } = props
  const color = OUTCOME_COLORS[payload.outcome as WalkOutcome] ?? '#94a3b8'
  return <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={1} />
}

// Usage:
<Scatter data={chartData} shape={<OutcomeDot />} />
```

### Pattern 5: DogPanel tab switcher

The context leaves DogPanel tab implementation to Claude's discretion. The existing shadcn/ui component set does not include Radix Tabs in the project yet. A simple button-toggle pattern (matching the existing app tab bar style) avoids adding a new dependency. This is consistent with the `role="tab"` / `aria-selected` pattern in `App.tsx`.

```tsx
// Simple tab toggle inside DogPanel — no new dependency
type DogPanelTab = 'profile' | 'history'
const [activeTab, setActiveTab] = useState<DogPanelTab>('profile')
```

### Anti-Patterns to Avoid

- **Storing full Dog objects in WalkLogEntry:** Only `dogIds: string[]` is stored (D-07). The snapshot is the ID list, not denormalized dog data (names etc. could change, but dog IDs are stable).
- **Using WalkSession for walk log linkage:** `WalkLogEntry` is standalone per D-08. Do not make it depend on `walkSessions` existing.
- **Making addWalkLog accept a full `WalkLogEntry` with `id`:** The slice should generate the UUID internally (matching `scheduleGroup` pattern).
- **Exporting `CURRENT_SCHEMA_VERSION` without bumping it:** Forgetting to bump to `2` will cause the migration to never run on existing users' localStorage.
- **Recharts: passing data prop to ScatterChart instead of Scatter:** Unlike BarChart/LineChart where `data` is on the parent, ScatterChart's `data` prop belongs on `<Scatter data={...}>`, not on `<ScatterChart>`.
- **Recharts: numeric XAxis without `type="number"`:** By default XAxis treats data as categorical. For a date-as-timestamp axis, `type="number"` is required or the axis will render incorrectly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Outcome timeline chart | Custom SVG chart | Recharts ScatterChart | HIST-05 locks this; Recharts handles responsive sizing, tooltip, axis formatting |
| UUID generation | Custom ID generator | `crypto.randomUUID()` | Already used everywhere in project (Dog, WalkSession) — Web Crypto built-in |
| Sheet/slide-over form | Custom modal | shadcn/ui Sheet | Already in project; DogPanel and EdgeSheet use it (D-06 locks this) |
| Date formatting | Custom date utils | `Date.toLocaleDateString()` | Sufficient for axis tick formatting; no extra lib needed |

**Key insight:** The Recharts chart is the only genuinely new dependency. Everything else reuses existing project infrastructure.

---

## Common Pitfalls

### Pitfall 1: Recharts ScatterChart data placement

**What goes wrong:** Passing `data` prop to `<ScatterChart>` instead of `<Scatter>`.
**Why it happens:** BarChart and LineChart accept `data` on the wrapper element; ScatterChart requires `data` on `<Scatter>`.
**How to avoid:** `<Scatter data={chartData} />`, never `<ScatterChart data={chartData}>`.
**Warning signs:** Chart renders axes but no dots.

### Pitfall 2: XAxis type mismatch for timestamp data

**What goes wrong:** XAxis renders all X values as identical or garbled because it defaults to categorical mode.
**Why it happens:** `type` defaults to `'category'`; timestamps need `type="number"`.
**How to avoid:** Always set `<XAxis type="number" dataKey="x" />` when X values are ms timestamps.
**Warning signs:** All dots stacked at one position on the X axis.

### Pitfall 3: Schema version not bumped

**What goes wrong:** `migrate()` runs with `version === 1` but the `if (version < 2)` branch is never reached because `CURRENT_SCHEMA_VERSION` was not changed to `2`.
**Why it happens:** Developer adds migration logic but forgets to bump the exported constant.
**How to avoid:** Change `CURRENT_SCHEMA_VERSION = 1` → `2` in the same commit as adding the migration branch.
**Warning signs:** `walkHistory` is `undefined` at runtime; TypeScript catches it if `AppState` is updated but runtime crashes on `.map`.

### Pitfall 4: partialize omits walkHistory

**What goes wrong:** `walkHistory` is held in Zustand memory but never written to LocalStorage.
**Why it happens:** `partialize` in `index.ts` must explicitly list each key to persist.
**How to avoid:** Add `walkHistory: state.walkHistory` to the `partialize` return.
**Warning signs:** History data lost on page reload.

### Pitfall 5: WalkLogSheet pre-population logic scattered across components

**What goes wrong:** Three entry points (Calendar, History tab, DogPanel) each implement pre-fill logic differently, causing inconsistency.
**Why it happens:** No shared form component.
**How to avoid:** A single `WalkLogSheet` component accepts `initialDogIds?: string[]`, `initialDate?: string`, `initialGroupId?: string` props. All three entry points pass props to this one component.

### Pitfall 6: Recharts ResponsiveContainer in jsdom tests

**What goes wrong:** Chart renders with `width=0, height=0` in tests because jsdom cannot measure DOM elements.
**Why it happens:** `ResponsiveContainer` uses ResizeObserver to measure its container; jsdom has no real layout.
**How to avoid:** The project already globally stubs `ResizeObserver` in `src/test/setup.ts`. Chart rendering tests should assert on `<svg>` presence or accessible elements, not pixel dimensions. Alternatively, stub `ResponsiveContainer` in tests: `vi.mock('recharts', async () => ({ ...(await vi.importActual('recharts')), ResponsiveContainer: ({ children }) => <div>{children}</div> }))`.
**Warning signs:** Tests throw `ResizeObserver is not defined` or chart renders `width=0`.

### Pitfall 7: DogPanel footer visible on History tab

**What goes wrong:** Save/Discard footer appears when History tab is active.
**Why it happens:** Footer is always rendered at the bottom of the Sheet.
**How to avoid:** Conditional render: `{activeTab === 'profile' && <footer>...</footer>}` (D-13 locks this behaviour).

---

## Code Examples

### WalkOutcome type and mapping

```typescript
// src/types/index.ts additions
export type WalkOutcome = 'great' | 'good' | 'neutral' | 'poor' | 'incident'

export type WalkLogEntry = {
  id: string
  date: string        // YYYY-MM-DD
  outcome: WalkOutcome
  notes: string
  dogIds: string[]
  groupId?: string
}
```

### Slice unit test pattern (mirrors scheduleSlice.test.ts)

```typescript
// src/store/walkHistorySlice.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createWalkHistorySlice, type WalkHistoryActions } from './walkHistorySlice'
import type { AppState } from '@/types'

type TestStore = AppState & WalkHistoryActions

function createTestStore() {
  return create<TestStore>()((...a) => ({
    schemaVersion: 2,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    walkHistory: [],
    ...createWalkHistorySlice(...a),
  }))
}

describe('walkHistorySlice', () => {
  let store: ReturnType<typeof createTestStore>
  beforeEach(() => { store = createTestStore() })

  it('addWalkLog appends an entry with a generated id', () => {
    store.getState().addWalkLog({
      date: '2026-03-28',
      outcome: 'great',
      notes: 'Good run',
      dogIds: ['dog-1', 'dog-2'],
    })
    const entries = store.getState().walkHistory
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toHaveLength(36)
    expect(entries[0].outcome).toBe('great')
    expect(entries[0].dogIds).toEqual(['dog-1', 'dog-2'])
  })
})
```

### WalkHistoryChart data transform

```typescript
// Inside WalkHistoryChart component
const OUTCOME_Y: Record<WalkOutcome, number> = {
  great: 5, good: 4, neutral: 3, poor: 2, incident: 1,
}
const OUTCOME_LABEL: Record<number, string> = {
  5: 'Great', 4: 'Good', 3: 'Neutral', 2: 'Poor', 1: 'Incident',
}

const chartData = entries.map((e) => ({
  x: new Date(e.date).getTime(),   // ms timestamp for numeric XAxis
  y: OUTCOME_Y[e.outcome],
  outcome: e.outcome,
  notes: e.notes,
  date: e.date,
}))
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recharts 2.x (assumed in STATE.md) | recharts 3.8.1 | recharts 3.0 released ~2024 | Breaking: CategoricalChartState gone, `activeIndex` removed from Scatter. No impact for this use case. |
| `data` on `<ScatterChart>` (2.x pattern) | `data` on `<Scatter>` | recharts 3.x | Must pass data to `<Scatter>`, not the wrapper chart |

**Deprecated/outdated:**
- `CategoricalChartState` (recharts internal): removed in 3.0. Not used in this project.
- `activeIndex` prop on `<Scatter>`: removed in 3.0. Not used in this project.

---

## Open Questions

1. **Log button on CalendarSlot: inline Sheet or navigate to History tab?**
   - What we know: D-02 says clicking pre-fills the dog snapshot; D-06 says form is a Sheet.
   - What's unclear: Whether `WalkLogSheet` mounts in CalendarSlot/CalendarScheduler context or whether the button switches the app tab to History.
   - Recommendation: Open `WalkLogSheet` inline (Sheet portal from CalendarSlot context). This is simpler and consistent with EdgeSheet pattern. Planner should confirm.

2. **DogPanel: shadcn/ui Tabs vs simple button toggle?**
   - What we know: Radix Tabs is not currently in the project; D-11 leaves this to Claude's discretion.
   - What's unclear: Whether adding `@radix-ui/react-tabs` is worthwhile for two tabs.
   - Recommendation: Use a simple button-toggle pattern matching App.tsx tab bar. Avoids a new dependency for two tabs.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | 20.9.0 | — |
| npm | package install | ✓ | bundled | — |
| recharts | HIST-05 | ✗ (not installed) | — | None — must install |
| react-is | recharts 3 peer dep | ✗ (not installed) | — | None — install alongside recharts |

**Missing dependencies with no fallback:**
- `recharts` — must be installed before Plan 02 tasks. Install: `npm install recharts react-is`

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 + React Testing Library 16.3.2 |
| Config file | `vite.config.ts` (vitest inline config, `test.environment: 'jsdom'`) |
| Setup file | `src/test/setup.ts` (jest-dom matchers, ResizeObserver stub, afterEach cleanup) |
| Quick run command | `npm run test:run -- src/store/walkHistorySlice.test.ts` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-01 | addWalkLog stores outcome in walkHistory | unit (slice) | `npm run test:run -- src/store/walkHistorySlice.test.ts` | ❌ Wave 0 |
| HIST-02 | addWalkLog stores notes field | unit (slice) | `npm run test:run -- src/store/walkHistorySlice.test.ts` | ❌ Wave 0 |
| HIST-03 | dogIds snapshot immutable (no edit action exposed) | unit (slice) | `npm run test:run -- src/store/walkHistorySlice.test.ts` | ❌ Wave 0 |
| HIST-04 | WalkHistoryChart renders for dog's entries | unit (component) | `npm run test:run -- src/components/WalkHistoryChart.test.tsx` | ❌ Wave 0 |
| HIST-05 | WalkHistoryChart renders a Recharts SVG element | unit (component) | `npm run test:run -- src/components/WalkHistoryChart.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:run -- <relevant test file>`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/store/walkHistorySlice.test.ts` — covers HIST-01, HIST-02, HIST-03
- [ ] `src/components/WalkHistoryChart.test.tsx` — covers HIST-04, HIST-05
- [ ] `src/components/WalkLogSheet.test.tsx` — integration: form submit, pre-fill from props
- [ ] `src/components/WalkHistory.test.tsx` — 5th tab content: log button, entry list render

*(No new framework install needed — Vitest + RTL already configured)*

---

## Sources

### Primary (HIGH confidence)

- `src/store/groupSlice.ts` — slice pattern to mirror for walkHistorySlice
- `src/store/scheduleSlice.ts` — slice pattern reference; unit test pattern
- `src/store/index.ts` — wiring and partialize pattern
- `src/store/migrations.ts` — migration pattern; must bump version
- `src/test/setup.ts` — ResizeObserver already globally stubbed
- `npm view recharts version` (run 2026-03-28) → `3.8.1`
- `npm view recharts@3.8.1 peerDependencies` → requires `react`, `react-dom`, `react-is`
- [recharts.github.io/en-US/api/ScatterChart](https://recharts.github.io/en-US/api/ScatterChart/) — ScatterChart props

### Secondary (MEDIUM confidence)

- [github.com/recharts/recharts/wiki/3.0-migration-guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — breaking changes in 3.0 vs 2.x; CategoricalChartState removed, activeIndex removed from Scatter
- WebSearch: "recharts 3 ScatterChart example XAxis YAxis data format typescript 2025" — confirmed `data` goes on `<Scatter>`, XAxis needs `type="number"` for timestamps

### Tertiary (LOW confidence)

- None — all critical claims verified via primary or secondary sources.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — npm registry confirmed recharts 3.8.1; peer deps verified
- Architecture: HIGH — directly derived from existing project slice and component patterns
- Recharts API: MEDIUM — recharts.github.io API docs + migration guide; official but recharts docs have historically had 404s on some paths (core API pages confirmed accessible)
- Pitfalls: HIGH — pitfalls 1-5 verified from code; pitfall 6 confirmed by existing `src/test/setup.ts` ResizeObserver stub

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (recharts releases frequently but minor versions don't break ScatterChart API)
