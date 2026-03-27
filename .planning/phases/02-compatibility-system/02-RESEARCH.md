# Phase 2: Compatibility System - Research

**Researched:** 2026-03-27
**Domain:** Pure TypeScript algorithms — Zustand slice, pairwise compatibility map, scoring, greedy group suggestion
**Confidence:** HIGH

## Summary

Phase 2 is entirely self-contained: no new npm dependencies, no UI, no external services. All three deliverables (compatSlice, scoreGroup, suggestGroups) operate on types already defined in `src/types/index.ts`. The existing `dogSlice.ts` and its test file are direct templates for both the slice and its co-located tests. The Vitest harness (v2.1.9, jsdom, globals) is already configured and proven in Phase 1.

The scoring formula and greedy suggest algorithm are Claude's discretion (D-05, D-08). The key constraint driving both is that Unknown must be penalised — not treated as Neutral. The pair-level conflict/unknown accessor (`getConflictsInGroup` or equivalent) is a mandatory output that Phase 4 will consume for inline red-line rendering (D-06, D-07).

The suggest algorithm is specified as iterative, not recursive (D-09), and must never return an empty array when the pool has enough dogs (D-10). Both constraints are straightforward to implement with a filtered combination enumeration + sort, and must be covered by unit tests with varied compatibility scenarios.

**Primary recommendation:** Follow the dogSlice pattern exactly. Pure functions in `src/lib/` take a `Map<string, CompatibilityStatus>` as `compatMap` (keyed by canonical pair key) for O(1) lookup in scoring loops. The compatSlice populates `compatibilityEntries[]` and exports a derived selector that converts entries to this map for consumers.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Phase 2 is a pure data/algorithm layer — no UI. COMPAT-01 is satisfied by the store action existing. The Phase 3 graph is the only UI entry point for setting compatibility.
- **D-02:** The 4-value enum already defined in Phase 1 types is correct: `'compatible' | 'neutral' | 'conflict' | 'unknown'`. No numeric 1–10 scale needed for v1.
- **D-03:** Unknown is explicitly NOT safe — it must be treated as a penalty in scoring, not equivalent to Neutral.
- **D-04:** Canonical pair key = `[idA, idB].sort().join('|')`. All slice lookups and writes use this key regardless of argument order. Symmetry is enforced at the slice level.
- **D-06:** The algorithm layer must expose pair-level conflict data (which specific pairs conflict or are unknown within a group), not just a group-level number. Phase 4 needs this to draw red lines.
- **D-07:** A `getConflictsInGroup(dogs, compatMap)` (or equivalent) function returning conflicting/unknown pairs is required alongside `scoreGroup`.
- **D-08:** `suggestGroups(availableDogs, compatMap, groupSize, maxResults?)` — `maxResults` defaults to 3.
- **D-09:** Implementation must use an iterative loop, not recursion.
- **D-10:** When no conflict-free group exists, return the best available options (fewest conflicts, then highest score) — never an empty array unless the pool has fewer dogs than `groupSize`.

### Claude's Discretion

- Scoring weights for compatible/neutral/conflict/unknown (design a sensible formula; user will review and adjust after use).
- Whether `getConflictsInGroup` is a standalone export or part of the `compatSlice` actions.
- Internal data structure for `compatMap` passed to pure functions (could be `CompatibilityEntry[]`, a `Map<string, CompatibilityStatus>`, or a derived lookup object — pick what's cleanest for the pure functions).

### Deferred Ideas (OUT OF SCOPE)

- Notes on compatibility entries — belongs in Phase 6 (Walk History) or Phase 3 enhancement.
- Walk history in conflict dialog — requires Phase 6 data.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMPAT-01 | Behaviorist can set a compatibility status between any two dogs: Compatible, Neutral, Conflict, or Unknown | `setCompatibility(idA, idB, status)` action in compatSlice; canonical key (D-04) enforces symmetry |
| COMPAT-04 | Unknown compatibility is visually distinct from Neutral — it is not treated as safe | `CompatibilityStatus` union already has `'unknown'` as a separate value; scoring weights (D-03) penalise Unknown differently from Neutral |
| SCORE-01 | A math function scores a proposed group as a number (0–100) based on all pairwise compatibility statuses | `scoreGroup(dogs, compatMap)` pure function in `src/lib/scoring.ts` |
| SCORE-02 | The scoring function treats Unknown pairs as a penalty (not as Compatible or Neutral) | Scoring weight for `'unknown'` is lower than `'neutral'` — confirmed locked by D-03 |
| SCORE-03 | The scoring function is a pure module in `src/lib/scoring.ts` with full unit test coverage | No store imports, no side effects; co-located test file covers all 4 status values, mixed groups, edge cases |
| SCORE-04 | A group auto-suggest function proposes optimal group compositions from available dogs, tested in isolation | `suggestGroups` in `src/lib/groupSuggest.ts`; iterative combination enumeration; unit tests with varied scenarios |
</phase_requirements>

---

## Standard Stack

### Core (no new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.12 (installed) | compatSlice state management | Already used; Phase 1 pattern to follow exactly |
| vitest | 2.1.9 (installed) | Unit test runner | Configured, proven in Phase 1 |
| TypeScript | 5.5.3 (installed) | Strict typing for all module exports | strict mode enforced; noUnusedLocals/Params |

### No New Dependencies

All Phase 2 deliverables are pure TypeScript over existing types. No npm installs needed.

**Installation:**
```bash
# Nothing to install — all dependencies are present
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── store/
│   ├── compatSlice.ts          # new — follows dogSlice.ts pattern exactly
│   ├── compatSlice.test.ts     # co-located, follows dogSlice.test.ts pattern
│   └── index.ts                # update: wire in createCompatSlice + CompatActions
├── lib/
│   ├── scoring.ts              # new — scoreGroup + getConflictsInGroup pure exports
│   ├── scoring.test.ts         # co-located unit tests
│   ├── groupSuggest.ts         # new — suggestGroups pure export
│   └── groupSuggest.test.ts    # co-located unit tests
└── types/
    └── index.ts                # NO CHANGES — CompatibilityStatus and CompatibilityEntry already defined
```

### Pattern 1: compatSlice — mirrors dogSlice exactly

**What:** A `StateCreator` typed as `StateCreator<AppState & AllActions, [], [], CompatActions>` that reads/writes `compatibilityEntries: CompatibilityEntry[]` in the store.

**When to use:** Any store state that operates on the `compatibilityEntries` array.

**Key actions to export:**
```typescript
// Source: modelled on src/store/dogSlice.ts
export type CompatActions = {
  setCompatibility: (idA: string, idB: string, status: CompatibilityStatus) => void
  removeCompatibility: (idA: string, idB: string) => void
  getCompatibilityMap: () => Map<string, CompatibilityStatus>  // derived selector alternative
}
```

`setCompatibility` must use the canonical key (D-04):
```typescript
const key = [idA, idB].sort().join('|')
```

Upsert behaviour: if entry for this pair already exists, replace it; otherwise append.

### Pattern 2: CompatMap as `Map<string, CompatibilityStatus>`

**What:** The internal representation passed to pure functions. Key is the canonical pair key. Lookup is O(1).

**Why this over `CompatibilityEntry[]`:** Pure functions (`scoreGroup`, `suggestGroups`) do repeated lookups per pair combination. Array scan is O(n) per lookup; Map is O(1). For a group of 8 dogs there are 28 pairs — Map wins clearly.

**How to produce it (two options, pick one at planning time):**

Option A — derived in the slice as a selector exported alongside the slice:
```typescript
// In compatSlice.ts or a selectors.ts
export function buildCompatMap(entries: CompatibilityEntry[]): Map<string, CompatibilityStatus> {
  return new Map(entries.map(e => [[e.dogIdA, e.dogIdB].sort().join('|'), e.status]))
}
```

Option B — computed inline by the caller (e.g. inside `suggestGroups` itself if entries array is passed instead).

Recommendation: expose `buildCompatMap` as a named export from `src/lib/scoring.ts` so both `scoreGroup` and `suggestGroups` share the same helper. Tests can construct Maps directly.

### Pattern 3: scoreGroup — pair enumeration with weights

**What:** Pure function that scores all C(n,2) pairs in a dog group.

**Recommended scoring design (Claude's discretion — D-05):**

```
Per-pair scores:
  compatible  → 1.0  (full credit)
  neutral     → 0.5  (half credit)
  unknown     → 0.25 (penalty — explicitly not safe per D-03)
  conflict    → 0.0  (zero)

group score = (sum of pair scores / total pairs) × 100
```

- A group of all-compatible dogs scores 100.
- A group with one conflict in 3 pairs scores ~67 (2 × 1.0 + 1 × 0.0) / 3 × 100.
- Unknown is penalised to 25% — worse than neutral but not as bad as conflict.
- Edge case: single dog or zero dogs → return 100 (no pairs to score).

**Signature:**
```typescript
export function scoreGroup(dogIds: string[], compatMap: Map<string, CompatibilityStatus>): number
```

Using `dogIds: string[]` rather than `Dog[]` keeps the function minimal — it only needs IDs.

### Pattern 4: getConflictsInGroup — pair-level conflict accessor (D-07)

**What:** Returns all pairs within the group that are `'conflict'` or `'unknown'`.

**Signature:**
```typescript
export type ConflictingPair = { idA: string; idB: string; status: 'conflict' | 'unknown' }

export function getConflictsInGroup(
  dogIds: string[],
  compatMap: Map<string, CompatibilityStatus>
): ConflictingPair[]
```

Returns empty array for a fully compatible group. Phase 4 consumes this to draw red/dashed lines.

### Pattern 5: suggestGroups — iterative combination enumeration

**What:** Generates all C(n, groupSize) combinations iteratively, scores each, sorts by (conflictCount ASC, score DESC), returns top `maxResults`.

**Iterative combination generation (D-09 — no recursion):**

Use an index-based approach — maintain an array of `groupSize` indices into `availableDogs`, advance them in lexicographic order:

```typescript
// Iterative combination generator pattern
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  const n = arr.length
  if (k > n) return
  const indices = Array.from({ length: k }, (_, i) => i)
  while (true) {
    yield indices.map(i => arr[i])
    let i = k - 1
    while (i >= 0 && indices[i] === i + n - k) i--
    if (i < 0) return
    indices[i]++
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1
  }
}
```

Note: generators use `yield` but no recursion — this satisfies D-09.

**Signature:**
```typescript
export function suggestGroups(
  availableDogs: string[],           // dog IDs
  compatMap: Map<string, CompatibilityStatus>,
  groupSize: number,
  maxResults?: number                // defaults to 3 per D-08
): SuggestedGroup[]

export type SuggestedGroup = {
  dogIds: string[]
  score: number
  conflicts: ConflictingPair[]       // empty = fully compatible
}
```

**D-10 implementation:** Sort by `conflicts.length ASC` then `score DESC`, return top `maxResults`. Never return empty unless `availableDogs.length < groupSize`.

### Anti-Patterns to Avoid

- **Redefining CompatibilityStatus:** The type exists in `src/types/index.ts`. Import it; do not redefine.
- **Passing `Dog[]` to pure functions when only IDs are needed:** Keeps lib functions decoupled from the full Dog type.
- **Treating missing pair as Neutral in scoring:** A missing entry means Unknown (D-03). `compatMap.get(key) ?? 'unknown'` is the correct pattern.
- **Recursive combination generation:** D-09 locks this to iterative.
- **Storing compatMap in Zustand state:** The Map is a derived structure built from `compatibilityEntries[]`. Storing it would require manual sync. Compute it at call sites from the entries array.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pair key normalisation | Custom string encoding | `[idA, idB].sort().join('|')` | Already decided in D-04; simple, symmetric, deterministic |
| Combination enumeration | Recursive backtracking | Iterative index-advance pattern (see Pattern 5) | D-09 mandates iterative; pattern is standard and easily unit-testable |
| UUID generation | Custom ID scheme | `crypto.randomUUID()` (already used in dogSlice) | Not needed in Phase 2 — no new entities created |

**Key insight:** There are no complex algorithmic libraries needed here. The scoring and suggestion problems are small enough (behaviorist-scale dog counts — likely < 30 dogs) that a simple O(C(n,k)) enumeration is fast enough. No combinatorial optimisation library is warranted.

## Common Pitfalls

### Pitfall 1: Missing pair treated as Compatible (silent bug)
**What goes wrong:** `compatMap.get(key)` returns `undefined` for a pair with no recorded status. If the caller does `status ?? 'neutral'` or `status ?? 'compatible'`, unknown pairs get free credit.
**Why it happens:** Forgetting D-03 during implementation.
**How to avoid:** Always default to `'unknown'`: `compatMap.get(key) ?? 'unknown'`.
**Warning signs:** Tests pass with all-known pairs but a test with a missing pair shows incorrectly high scores.

### Pitfall 2: Pair key asymmetry
**What goes wrong:** `setCompatibility('a', 'b', 'conflict')` creates key `a|b`. Later `getCompatibility('b', 'a')` constructs key `b|a` and finds nothing — returns `undefined`.
**Why it happens:** Forgetting to sort before joining.
**How to avoid:** Centralise key creation in a single `pairKey(a, b)` helper: `[a, b].sort().join('|')`. Import and use everywhere.
**Warning signs:** Tests calling lookup in the reverse argument order fail to find the entry.

### Pitfall 3: Mutating compatibilityEntries array in slice
**What goes wrong:** Using `state.compatibilityEntries.push(...)` inside a Zustand `set` call instead of returning a new array.
**Why it happens:** Forgetting Zustand requires immutable updates.
**How to avoid:** Follow the dogSlice pattern exactly — spread to new array or use `.map()` / `.filter()`.

### Pitfall 4: suggestGroups returns empty array when pool is valid
**What goes wrong:** If all combinations have conflicts, the function returns `[]` instead of the best available options.
**Why it happens:** Filtering for conflict-free groups before falling back.
**How to avoid:** Do not filter — sort all combinations by quality, return top `maxResults`. Only return empty if `availableDogs.length < groupSize`.

### Pitfall 5: TypeScript strict mode — unused parameters
**What goes wrong:** `noUnusedParameters: true` causes compile errors if a function signature has parameters not used in the body (e.g., a `dogs` parameter when only IDs are needed).
**How to avoid:** Use `dogIds: string[]` not `dogs: Dog[]` where the full Dog object is not needed. All function signatures should be exactly what is used.

### Pitfall 6: Off-by-one in pair count → wrong score normalisation
**What goes wrong:** Scoring formula divides by wrong denominator. For n dogs, pairs = n*(n-1)/2, not n.
**How to avoid:** Compute `const totalPairs = (n * (n - 1)) / 2` where `n = dogIds.length`. Return 100 when `totalPairs === 0`.

## Code Examples

Verified patterns from existing codebase (Phase 1):

### Canonical pair key helper
```typescript
// Recommended helper in src/lib/scoring.ts
export function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join('|')
}
```

### compatSlice structure (mirrors dogSlice.ts)
```typescript
// Source: src/store/dogSlice.ts pattern
import type { StateCreator } from 'zustand'
import type { AppState, CompatibilityStatus, CompatibilityEntry } from '@/types'

export type CompatActions = {
  setCompatibility: (idA: string, idB: string, status: CompatibilityStatus) => void
  removeCompatibility: (idA: string, idB: string) => void
}

export const createCompatSlice: StateCreator<AppState & CompatActions, [], [], CompatActions> = (set) => ({
  setCompatibility: (idA, idB, status) => set((state) => {
    const key = pairKey(idA, idB)
    const existing = state.compatibilityEntries.findIndex(
      e => pairKey(e.dogIdA, e.dogIdB) === key
    )
    const entry: CompatibilityEntry = { dogIdA: idA, dogIdB: idB, status }
    if (existing === -1) {
      return { compatibilityEntries: [...state.compatibilityEntries, entry] }
    }
    return {
      compatibilityEntries: state.compatibilityEntries.map((e, i) =>
        i === existing ? entry : e
      ),
    }
  }),
  removeCompatibility: (idA, idB) => set((state) => {
    const key = pairKey(idA, idB)
    return {
      compatibilityEntries: state.compatibilityEntries.filter(
        e => pairKey(e.dogIdA, e.dogIdB) !== key
      ),
    }
  }),
})
```

### Store wiring (src/store/index.ts update)
```typescript
// Add CompatActions to AppStore type and spread createCompatSlice
export type AppStore = AppState & DogActions & CompatActions

// Inside create():
...createCompatSlice(...a),
```

### Test store pattern (mirrors dogSlice.test.ts)
```typescript
// Source: src/store/dogSlice.test.ts pattern
import { create } from 'zustand'
import { createCompatSlice, type CompatActions } from './compatSlice'
import type { AppState } from '@/types'

type TestStore = AppState & CompatActions

function createTestStore() {
  return create<TestStore>()((...a) => ({
    schemaVersion: 1,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    ...createCompatSlice(...a),
  }))
}
```

### scoreGroup — minimal working implementation sketch
```typescript
// src/lib/scoring.ts
export function scoreGroup(dogIds: string[], compatMap: Map<string, CompatibilityStatus>): number {
  const n = dogIds.length
  const totalPairs = (n * (n - 1)) / 2
  if (totalPairs === 0) return 100

  const weights: Record<CompatibilityStatus, number> = {
    compatible: 1.0,
    neutral: 0.5,
    unknown: 0.25,
    conflict: 0.0,
  }

  let sum = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const status = compatMap.get(pairKey(dogIds[i], dogIds[j])) ?? 'unknown'
      sum += weights[status]
    }
  }
  return Math.round((sum / totalPairs) * 100)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand v4 with slice pattern using `get` | Zustand v5 — `get` removed from StateCreator signature for slices; use `set` with functional updates or `useAppStore.getState()` | Zustand v5 (2024) | dogSlice.ts already uses v5 pattern; Phase 2 must follow the same |

**Deprecated/outdated:**
- Zustand `immer` middleware: Not used in this project; do not introduce. Plain spread updates as in dogSlice.
- Class-based store patterns: Not applicable to Zustand.

## Open Questions

1. **`getCompatibilityMap` as a slice action vs. standalone utility**
   - What we know: The CONTEXT.md leaves this to Claude's discretion.
   - What's unclear: Whether consumers should call `useAppStore(state => buildCompatMap(state.compatibilityEntries))` directly, or whether the slice should expose a bound selector.
   - Recommendation: Expose `buildCompatMap` as a named export from `src/lib/scoring.ts`. Consumers build the map inline using a Zustand selector. This keeps the slice thin and the lib functions fully pure. No bound action needed.

2. **`getConflictsInGroup` placement — scoring.ts vs. compatSlice**
   - What we know: D-07 requires it; CONTEXT.md says placement is Claude's discretion.
   - Recommendation: Place in `src/lib/scoring.ts` as a named pure export alongside `scoreGroup`. No store dependency needed — it takes the same `(dogIds, compatMap)` signature. Phase 4 can import it directly.

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is purely TypeScript code and algorithm changes. No external tools, services, CLIs, or runtimes beyond the existing Node.js/npm setup used in Phase 1. All dependencies are present in node_modules.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vite.config.ts` (inline `test:` block) |
| Quick run command | `npm run test:run -- src/store/compatSlice.test.ts src/lib/scoring.test.ts src/lib/groupSuggest.test.ts` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMPAT-01 | `setCompatibility` stores entry in `compatibilityEntries` | unit | `npm run test:run -- src/store/compatSlice.test.ts` | Wave 0 |
| COMPAT-01 | `setCompatibility` called with reversed args produces same stored entry (symmetry) | unit | `npm run test:run -- src/store/compatSlice.test.ts` | Wave 0 |
| COMPAT-01 | `setCompatibility` second call on same pair upserts (replaces) the entry | unit | `npm run test:run -- src/store/compatSlice.test.ts` | Wave 0 |
| COMPAT-04 | `'unknown'` status is stored and retrieved as `'unknown'` — not coerced to `'neutral'` | unit | `npm run test:run -- src/store/compatSlice.test.ts` | Wave 0 |
| SCORE-01 | `scoreGroup` returns 100 for all-compatible group | unit | `npm run test:run -- src/lib/scoring.test.ts` | Wave 0 |
| SCORE-01 | `scoreGroup` returns 0 for all-conflict group | unit | `npm run test:run -- src/lib/scoring.test.ts` | Wave 0 |
| SCORE-01 | `scoreGroup` returns 100 for single-dog group (no pairs) | unit | `npm run test:run -- src/lib/scoring.test.ts` | Wave 0 |
| SCORE-02 | `scoreGroup` scores a group with one unknown pair lower than the same group with that pair as neutral | unit | `npm run test:run -- src/lib/scoring.test.ts` | Wave 0 |
| SCORE-03 | `scoreGroup` is a pure function (no imports from store, no side effects) | static/unit | TypeScript strict compilation + lint | N/A — enforced by convention |
| SCORE-04 | `suggestGroups` returns top 3 results by default | unit | `npm run test:run -- src/lib/groupSuggest.test.ts` | Wave 0 |
| SCORE-04 | `suggestGroups` returns conflict-free groups first | unit | `npm run test:run -- src/lib/groupSuggest.test.ts` | Wave 0 |
| SCORE-04 | `suggestGroups` returns best available when no conflict-free group exists (not empty) | unit | `npm run test:run -- src/lib/groupSuggest.test.ts` | Wave 0 |
| SCORE-04 | `suggestGroups` returns empty only when pool < groupSize | unit | `npm run test:run -- src/lib/groupSuggest.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:run -- <task-specific test file>`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/store/compatSlice.test.ts` — covers COMPAT-01, COMPAT-04
- [ ] `src/lib/scoring.test.ts` — covers SCORE-01, SCORE-02, SCORE-03
- [ ] `src/lib/groupSuggest.test.ts` — covers SCORE-04

*(No framework config gaps — Vitest is fully configured from Phase 1)*

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 2 |
|-----------|-------------------|
| React 18 + TypeScript SPA, Vite, no backend | Pure TypeScript modules only; no server code |
| `npm run lint` — ESLint enforced | All new files must pass lint before commit |
| TypeScript strict mode (`tsconfig.app.json`) | `noUnusedLocals`, `noUnusedParameters` — every parameter must be used |
| No test framework configured yet (Phase 1 note — now resolved) | Vitest 2.1.9 is configured; tests co-located with source |
| No semicolons, 2-space indent, single quotes | All new files must follow this style (established in Phase 1 code context) |
| Named exports for all modules | No default exports in `compatSlice.ts`, `scoring.ts`, or `groupSuggest.ts` |
| Pure functions in `src/lib/` — no store imports | `scoring.ts` and `groupSuggest.ts` must not import from `src/store/` |
| Test files co-located with source | `compatSlice.test.ts` next to `compatSlice.ts`; `scoring.test.ts` next to `scoring.ts` |

## Sources

### Primary (HIGH confidence)

- `src/types/index.ts` — `CompatibilityStatus`, `CompatibilityEntry`, `AppState.compatibilityEntries` verified directly
- `src/store/dogSlice.ts` — Slice pattern to follow; verified Zustand v5 StateCreator signature
- `src/store/dogSlice.test.ts` — Test pattern; `createTestStore` helper, `describe/it/expect`, co-location confirmed
- `vite.config.ts` — Vitest config verified: globals, jsdom, setupFiles, `@` alias

### Secondary (MEDIUM confidence)

- Zustand v5 StateCreator slice pattern — confirmed from dogSlice.ts (existing project code matches v5 API)
- Iterative combination generation — standard algorithm; no external library needed

### Tertiary (LOW confidence)

- None — all findings verified from project source files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and existing source files
- Architecture: HIGH — derived directly from existing dogSlice.ts and test patterns
- Algorithm design (scoring weights, iterative combinator): MEDIUM — Claude's discretion per D-05; weights are sensible defaults the user will tune after use
- Pitfalls: HIGH — derived from TypeScript strict mode config, Zustand v5 immutability requirements, and D-03/D-04 decisions

**Research date:** 2026-03-27
**Valid until:** 2026-06-27 (stable stack — no fast-moving dependencies)
