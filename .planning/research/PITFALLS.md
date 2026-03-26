# Pitfalls Research

**Domain:** React SPA — drag-and-drop scheduler + network graph + LocalStorage persistence
**Researched:** 2026-03-26
**Confidence:** MEDIUM (external search unavailable; based on Context7 + direct library knowledge at training depth)

---

## Critical Pitfalls

### Pitfall 1: Drag State Lives in Two Places at Once

**What goes wrong:**
The drag library (dnd-kit) maintains its own internal drag state (what is being dragged, where the pointer is, what the active drop target is). Application code maintains separate state (dog roster, group membership, calendar slots). When a drop completes, these two sources of truth must be reconciled in `onDragEnd`. Developers often mutate app state optimistically during drag (on every `onDragOver`) instead of committing only on drop, creating race conditions where a failed drop or a cancelled drag leaves app state dirty.

**Why it happens:**
The desire for live visual feedback during drag (seeing the item "slot in" as you hover) leads developers to write state mutations inside `onDragOver`, which fires dozens of times per second. If the drag is then cancelled (`onDragCancel`), those mutations are already applied.

**How to avoid:**
Separate "drag preview state" (local, ephemeral, drives visual overlay only) from "committed state" (persisted app state, drives actual data). Only mutate committed state in `onDragEnd` after confirming `event.over` is non-null. Use dnd-kit's `DragOverlay` for the floating preview — it renders a clone outside the DOM tree and avoids touching real state.

**Warning signs:**
Dropping a dog into a group and then pressing Escape leaves the dog in both its source and destination group. Rapid drag-cancel cycles corrupt group membership arrays.

**Phase to address:**
Group Builder phase (drag dogs into walk groups).

---

### Pitfall 2: Network Graph Library Owns the DOM — React Cannot Reconcile It

**What goes wrong:**
Libraries like `react-force-graph`, `vis-network`, and Cytoscape.js manage their own canvas or SVG DOM internally. They are not React-managed. When you pass updated node/edge data as props, the library re-renders its own internal scene — but React's virtual DOM diffing never sees those changes. This causes two classes of failure: (a) React state updates that should trigger a graph re-render silently do nothing because the library cached its previous data, and (b) React tries to unmount and remount the graph container on re-render, destroying the library's internal state (camera position, layout, force simulation).

**Why it happens:**
Developers wrap these libraries in a React component and treat them like ordinary controlled components. But they require imperative updates via a ref (e.g., `graphRef.current.graphData(newData)`), not prop-driven re-renders. The React component wrapper that "passes data as props" is often just a wrapper around an imperative call anyway — and if that wrapper re-creates the library instance on every render, state is lost.

**How to avoid:**
Use `useRef` to hold the graph instance. Pass initial data once on mount. Apply subsequent changes imperatively via the ref API (`graphRef.current.graphData(...)` for react-force-graph, or the network API for vis-network). Stabilise the container element's identity with a stable `key` so React never unmounts it. Wrap the entire graph in `React.memo` with a custom comparison to prevent unnecessary parent-triggered re-renders.

**Warning signs:**
Adding a new compatibility edge in app state, but the graph doesn't update until the page reloads. Or: the graph resets its layout/zoom every time any other state changes.

**Phase to address:**
Compatibility Network Graph phase.

---

### Pitfall 3: LocalStorage Schema Changes Break Existing Data Silently

**What goes wrong:**
The app writes a `dogs` array to LocalStorage in v1. In v2, dogs gain a `temperamentScore` field. When a v1 user opens the v2 app, they load stale data without `temperamentScore`. TypeScript types say the field exists; runtime value is `undefined`. Every downstream function that reads `dog.temperamentScore` either crashes or silently produces `NaN` in compatibility calculations.

**Why it happens:**
Developers design the schema once, write `JSON.parse(localStorage.getItem('dogs'))` everywhere, and never add a version check. The app works in development (fresh data), fails for real users with old data.

**How to avoid:**
Introduce a schema version field on day one: `{ schemaVersion: 1, dogs: [...], ... }`. Write a `migrate(raw)` function that detects the version and applies transforms before any app code touches the data. The migrator runs once at app startup, before React state is initialised. For each new field added, the migrator back-fills a sensible default. Keep migration functions cumulative (v1→v2, v2→v3) so no version is skipped.

**Warning signs:**
TypeScript `as DogData` casts in the LocalStorage read path. No `schemaVersion` field in stored data. Tests that only cover fresh-state, never migrated-state scenarios.

**Phase to address:**
Dog Roster / LocalStorage persistence phase (the very first phase that writes data).

---

### Pitfall 4: Compatibility Algorithm Scales as O(n²) Pairs But Blows Up on Missing Data

**What goes wrong:**
The compatibility scorer iterates all pairs in a proposed group: for a group of `k` dogs, there are `k*(k-1)/2` pairs. At small group sizes (3–6 dogs, typical for a walk), this is trivial. The real problem is missing data: if no compatibility observation exists for a pair, the scorer either crashes (accessing undefined), returns a misleadingly high score (treating unknown as compatible), or returns a misleadingly low score (treating unknown as incompatible). Either mistake leads the behaviorist to make unsafe grouping decisions.

**Why it happens:**
The happy path (all pairs have scores) is what gets tested. Missing-pair handling is an afterthought. Because the app starts with zero history, almost every pair is unknown at first.

**How to avoid:**
Define an explicit `CompatibilityStatus` type: `'compatible' | 'incompatible' | 'unknown'`. The scorer must handle `unknown` as a distinct case, not as a default number. Return a scored result that includes a `hasUnknownPairs: boolean` flag and lists which pairs are unknown. Surface this prominently in the UI — the group is "tentatively OK, but 3 pairs have no history." Never silently coerce unknown to 0 or 1.

**Warning signs:**
`compatibility[dogA.id][dogB.id] ?? 1` — treating unknown as fully compatible. No test case for a group where two dogs have never met.

**Phase to address:**
Group Compatibility Scoring phase.

---

### Pitfall 5: Calendar Time-Slot Grid Drift on DST Boundaries

**What goes wrong:**
The weekly calendar stores walk slots as hour offsets (e.g., "Monday 09:00") or as Unix timestamps. When daylight saving time transitions occur mid-week (clocks spring forward or fall back), a slot stored as a timestamp that was "09:00 Monday" becomes "08:00 Monday" or "10:00 Monday" depending on direction. The calendar grid renders at the wrong hour. The user sees their 9am walk appear at 8am or disappear off a visible range.

**Why it happens:**
Developers use `new Date(timestamp)` to derive display hours without normalising to a fixed timezone offset. The local machine's DST offset changes, and `getHours()` returns a different value.

**How to avoid:**
Store slots as `{ dayOfWeek: 'monday', hour: 9, minute: 0 }` — a logical time, not a timestamp. Never use epoch timestamps for recurring weekly slots. For one-off walk dates with a real date, store the ISO 8601 date string (`"2026-03-30T09:00:00"`) without a timezone suffix and treat it as local-time-only. Avoid `Date.getHours()` across DST boundaries.

**Warning signs:**
Walk slots stored as `Date.now()` or numeric epoch. Calendar rendering that calls `new Date(slot.timestamp).getHours()`.

**Phase to address:**
Calendar / Time-Slot Scheduler phase.

---

### Pitfall 6: Drag-and-Drop Is Nearly Untestable Without an Explicit Test Strategy

**What goes wrong:**
Vitest runs in jsdom, which does not implement the HTML5 Drag and Drop API, pointer events, or touch events in a way that dnd-kit relies on. Writing tests against `fireEvent.dragStart` → `fireEvent.drop` sequences fails silently or requires extensive mocking. Developers defer "we'll test this later" and the drag logic — which is where most group-building bugs live — has zero test coverage.

**Why it happens:**
The mismatch between dnd-kit's pointer-event model and jsdom's partial implementation is non-obvious. Developers assume `@testing-library/user-event` drag support works; it has partial support but breaks with dnd-kit's sensor model.

**How to avoid:**
Separate drag orchestration from business logic. The business logic functions (`addDogToGroup(groupId, dogId, state)`, `removeDogFromGroup(...)`, `reorderGroup(...)`) are pure functions with no dnd-kit dependency — test these exhaustively in Vitest. The drag handler in the component becomes a thin dispatcher that calls those pure functions. For integration-level drag testing, use Playwright (real browser, real pointer events). Do not try to unit-test dnd-kit sensor behaviour in jsdom.

**Warning signs:**
Business logic embedded directly in `onDragEnd` handler. No pure functions extractable from the drag handler. All drag tests marked as `.skip`.

**Phase to address:**
Group Builder phase; establish the pure-function pattern at the start.

---

### Pitfall 7: Force-Graph Layout Thrashes on Every React Re-Render

**What goes wrong:**
`react-force-graph` runs a physics simulation to position nodes. Each time it receives new `graphData` props, it restarts or perturbs the simulation. If the parent component re-renders for any reason (unrelated state change, context update, parent resize), and the `graphData` object is recreated inline (`graphData={{ nodes: dogs.map(...), links: compat.map(...) }}`), the simulation restarts, nodes fly around, and the user loses their manual layout.

**Why it happens:**
React re-renders recreate object literals. `{ nodes: [...] }` is a new reference on every render even if the contents are identical. The graph library sees a new object and treats it as new data.

**How to avoid:**
Memoize the `graphData` object with `useMemo`, depending only on the actual dog and compatibility data. Keep the memo dependency array tight. Consider using `useCallback` on node/link mutator functions passed to the graph. Use `cooldownTicks` / `d3AlphaDecay` props to let the simulation settle quickly rather than running indefinitely.

**Warning signs:**
Nodes jitter whenever anything on the page changes. `graphData` prop constructed as an object literal directly in JSX.

**Phase to address:**
Compatibility Network Graph phase.

---

### Pitfall 8: LocalStorage Quota Exceeded Throws a Synchronous Exception

**What goes wrong:**
`localStorage.setItem()` throws a `DOMException` with name `QuotaExceededError` when storage is full (browser limit ~5MB, shared across the origin). If the app calls `setItem` without a try/catch, the unhandled exception silently rolls back the write — the user's data is not saved, and they may not know.

**Why it happens:**
LocalStorage quota errors are rare in development (small dataset). Developers never test for it. For a dog walk planner with photos or base64-encoded images, 5MB is reachable. Even without images, repeated writes of walk history across many dogs can accumulate.

**How to avoid:**
Always wrap `localStorage.setItem` in a try/catch. On `QuotaExceededError`, show a user-visible warning ("Storage nearly full — consider exporting your data"). Never store binary data or large blobs in LocalStorage — store file references or use IndexedDB for anything larger than simple JSON. Keep the data model lean: walk history as arrays of `{ date, outcome, notes }`, not embedded objects with full dog snapshots.

**Warning signs:**
`localStorage.setItem` calls without error handling. Dog profile objects that embed photo data as base64 strings. No storage size monitoring.

**Phase to address:**
Dog Roster / LocalStorage persistence phase.

---

### Pitfall 9: Calendar Slot Overlap Detection Fails on Boundary Conditions

**What goes wrong:**
Two walk groups are scheduled for "09:00–10:00" and "10:00–11:00". An overlap check using `startA < endB && startB < endA` correctly identifies these as non-overlapping. But if the end time of a slot is stored as `endTime: 10` (integer hour) and start as `startTime: 10`, the boundary case `10 < 10` is false — correct. However, if times are stored as floating-point minutes-since-midnight (e.g., `540` for 9:00, `600` for 10:00), and a walk runs 90 minutes, the check must handle non-hour boundaries too. Inconsistent time representation causes false positives (blocking valid adjacent slots) or false negatives (allowing double-booking).

**Why it happens:**
The time representation is chosen ad-hoc. "Hours only" works until someone books a 90-minute walk. "Minutes since midnight" works but is easy to compare incorrectly at boundaries.

**How to avoid:**
Use a single canonical time representation throughout: minutes-since-midnight as integers (e.g., 9:00 = 540, 10:30 = 630). Define a single `slotsOverlap(a, b)` pure function used everywhere. Write explicit test cases for: exact adjacency, zero-duration slots, identical slots, and off-hour boundaries. Never represent times as hour integers alone.

**Warning signs:**
Multiple places in the codebase comparing time slot start/end with different logic. No unit tests for `slotsOverlap` with boundary inputs.

**Phase to address:**
Calendar / Time-Slot Scheduler phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip schema versioning on first write | Simpler code to start | Any schema change silently breaks existing data; requires manual LocalStorage clear to recover | Never — add `schemaVersion: 1` from day one, costs nothing |
| Inline business logic in `onDragEnd` | Faster to write | Untestable; drag logic has no unit coverage; bugs discovered only at runtime | Never — extract pure functions always |
| Treat unknown compatibility as compatible | Passes all happy-path tests | Behaviorist makes unsafe grouping decisions based on false "all clear" | Never — `unknown` must be a visible state |
| Use a `key` on the graph container to force remount on data change | Graph updates reliably | Destroys layout and simulation state on every data change; terrible UX | Only acceptable during initial prototyping |
| Store entire app state as one JSON blob in a single LocalStorage key | Simple to read/write | Hard to partially update; one corrupt field corrupts everything; harder to migrate | Acceptable for v1 if a migrator is in place |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| dnd-kit + React state | Calling `setState` inside `onDragOver` (fires at 60fps) | Only commit state in `onDragEnd`; use `DragOverlay` for preview |
| react-force-graph / vis-network + React | Passing `graphData` as an inline object literal; no ref usage | Memoize `graphData`; use `useRef` for imperative API calls |
| LocalStorage + TypeScript | `JSON.parse(raw) as MyType` with no validation | Validate/migrate through a typed `migrate(raw)` function before typing |
| Vitest + dnd-kit | `fireEvent.drag*` to test drag interactions | Extract pure state functions; use Playwright for E2E drag tests |
| Stitch MCP + component implementation | Implementing UI before Stitch contract is generated | Always generate Stitch design contract first; treat it as the component's API surface |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `graphData` recreated on every render | Graph nodes jitter; layout resets constantly | `useMemo` on graph data, tight dependency array | Immediately visible with any parent re-render |
| Compatibility matrix recalculated on every group change | Noticeable lag when adding a dog to a group with many dogs | Memoize pair scores; cache `compatibilityMatrix` derived from raw scores | ~20+ dogs in the roster |
| Walk history rendered as a full re-render chart on every note edit | Chart re-renders while user is typing in the notes field | Separate chart component from notes input; debounce chart updates | Visible immediately if both are in the same component |
| All LocalStorage reads on every render | Slight stutter; reads are synchronous and block the main thread | Read once at app startup into React state; never read from LocalStorage in render | Noticeable at ~50+ reads per render cycle |
| Force simulation running indefinitely | CPU usage stays high; fans spin | Set `cooldownTicks` (react-force-graph) or `stabilizationIterations` (vis-network) to bound simulation | Constant; always degrades UX |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing sensitive behavioural notes in LocalStorage without any notice | User may share browser profile or device; data is readable by any JS on the origin | Add a clear "data stored locally on this device" notice in the UI; document the privacy model |
| Eval-ing or interpolating LocalStorage data into DOM | XSS if data is ever tampered or if a future extension injects values | Always render LocalStorage data as React text nodes (never `dangerouslySetInnerHTML`); this is unlikely to be a real concern for a local single-user tool but costs nothing to do correctly |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual indication of compatibility during drag | Behaviorist drops a dog into a group, only then sees it's incompatible | Show compatibility colour coding on potential drop targets in real time during drag (green/amber/red highlight) |
| Graph layout resets when editing a node label | Behaviorist has arranged nodes into a meaningful spatial layout; editing a name blows it away | Lock node positions during label edits; only re-run layout on explicit "re-layout" action |
| Calendar slots too narrow on mobile | Behaviorist uses phone to check schedule; can't tap/drop on 60px-wide hour slots | Design hour-grid with minimum 44px touch targets; consider a list view for mobile |
| Unknown compatibility shown as neutral grey | Behaviorist mistakes unknown for "no issues" | Use a visually distinct "unknown" state (e.g., dashed edge, question mark icon) that communicates "we don't know yet", not "fine" |
| Walk history chart shows all time without filtering | With 2+ years of data, early walks drown out recent trends | Default to last 90 days; provide a simple date range control |

---

## "Looks Done But Isn't" Checklist

- [ ] **Drag-and-drop:** Visual drag works — verify that `onDragCancel` and drop-outside-target cases are handled and leave state unchanged
- [ ] **Compatibility graph:** Nodes display — verify that adding a new dog immediately adds a corresponding node without page reload
- [ ] **LocalStorage persistence:** Data saves — verify that `schemaVersion` is present in stored data and that a migration function exists even if v1→v1 is a no-op
- [ ] **Compatibility scorer:** Returns a score — verify that a group with one or more unknown pairs returns `hasUnknownPairs: true` and surfaces it in the UI
- [ ] **Calendar grid:** Slots display — verify that adjacent (non-overlapping) slots are not blocked, and that exact-boundary cases pass the `slotsOverlap` test suite
- [ ] **Walk history chart:** Chart renders — verify that a dog with zero walk history renders an empty state, not a crash or blank white box
- [ ] **Group auto-suggest:** Returns suggestions — verify that a roster with fewer dogs than the minimum group size returns an empty suggestion list, not an error

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Drag state corruption | LOW | Reload page (LocalStorage is the source of truth; in-memory drag state is transient) |
| LocalStorage schema mismatch after update | MEDIUM | Ship a migration function; on first load of new version, migrate data in-place; provide an export-before-migrate option |
| LocalStorage quota exceeded, data lost | HIGH | No recovery of lost write; prevention only; add export-to-JSON feature in first phase to enable manual backup |
| Graph library replaced mid-project | HIGH | Encapsulate graph behind an adapter interface from day one; swapping adapters is a known effort, not a rewrite |
| Compatibility algorithm wrong for edge cases | LOW–MEDIUM | Pure function; fix algorithm, add test, re-run; no DB migration needed |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Drag state in two places | Group Builder | `onDragCancel` test leaves group unchanged |
| Graph library owns DOM | Compatibility Network Graph | Graph updates without remounting on compatibility edit |
| LocalStorage schema migration | Dog Roster (Phase 1) | `schemaVersion` present; migrator function exists and is tested |
| Compatibility unknown pairs | Group Compatibility Scoring | Scorer returns `hasUnknownPairs: true` for unmet pairs |
| DST-driven calendar drift | Calendar Scheduler | Slots stored as `{ dayOfWeek, hour, minute }`; no epoch timestamps |
| Untestable drag logic | Group Builder | Pure state functions exist and have >90% unit test coverage independent of dnd-kit |
| Force graph layout thrash | Compatibility Network Graph | `graphData` is memoized; adding an unrelated dog to roster does not reset graph layout |
| LocalStorage quota exception | Dog Roster (Phase 1) | `setItem` is wrapped in try/catch; QuotaExceededError shows user-visible warning |
| Calendar slot overlap boundary | Calendar Scheduler | `slotsOverlap` unit tests include adjacency, exact-boundary, and off-hour cases |

---

## Sources

- dnd-kit official documentation — architecture and sensor model (https://docs.dndkit.com) — MEDIUM confidence (training knowledge; site blocked during research session)
- react-force-graph GitHub README — imperative API via ref, `graphData` prop behaviour — MEDIUM confidence (training knowledge)
- vis-network documentation — React integration patterns, stabilisation config — MEDIUM confidence (training knowledge)
- MDN Web Docs — LocalStorage `QuotaExceededError`, DST and `Date` API behaviour — HIGH confidence (well-established browser specs)
- Vitest documentation — jsdom limitations, pointer event support — MEDIUM confidence (training knowledge)
- React documentation — `useMemo`, `useRef`, reconciliation and key behaviour — HIGH confidence (well-established React docs)

---

*Pitfalls research for: React SPA — dog walk planner with drag-and-drop, network graph, LocalStorage persistence*
*Researched: 2026-03-26*
