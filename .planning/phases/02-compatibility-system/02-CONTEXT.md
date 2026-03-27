# Phase 2: Compatibility System - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the pure data and algorithm layer for dog compatibility — no graph UI. Three deliverables: `compatSlice` (Zustand slice for reading/writing pairwise compatibility status), `scoreGroup` (pure scoring function), and `suggestGroups` (auto-suggest algorithm). The graph UI that lets the behaviorist visually set and view compatibility is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### UI Scope
- **D-01:** Phase 2 is a pure data/algorithm layer — no UI. COMPAT-01 ("behaviorist can set compatibility") is satisfied by the store action existing. The Phase 3 graph is the only UI entry point for setting compatibility.

### Compatibility Status
- **D-02:** The 4-value enum already defined in Phase 1 types is correct: `'compatible' | 'neutral' | 'conflict' | 'unknown'`. No numeric 1–10 scale needed for v1.
- **D-03:** Unknown is explicitly NOT safe — it must be treated as a penalty in scoring, not equivalent to Neutral.

### Pair Symmetry / Key Strategy
- **D-04:** Canonical pair key = `[idA, idB].sort().join('|')`. All slice lookups and writes use this key regardless of argument order. Symmetry is enforced at the slice level.

### Scoring Formula
- **D-05:** Claude's discretion — design what makes sense and adjust after seeing it in use. Primary requirement: conflicts and unknowns are penalised. The group score is secondary to pair-level conflict data.
- **D-06:** The algorithm layer must expose pair-level conflict data (which specific pairs conflict or are unknown within a group), not just a group-level number. Phase 4 needs this to draw red lines between conflicting dog cards in the group view.
- **D-07:** A `getConflictsInGroup(dogs, compatMap)` (or equivalent) function returning conflicting/unknown pairs is required alongside `scoreGroup`. This is what Phase 4 will consume to render inline conflict indicators.

### Auto-Suggest
- **D-08:** `suggestGroups(availableDogs, compatMap, groupSize, maxResults?)` — `maxResults` defaults to 3.
- **D-09:** Implementation must use an iterative loop, not recursion.
- **D-10:** When no conflict-free group exists, return the best available options (fewest conflicts, then highest score) — never an empty array unless the pool has fewer dogs than `groupSize`. Let the behaviorist decide whether to proceed.

### Claude's Discretion
- Scoring weights for compatible/neutral/conflict/unknown (design a sensible formula; user will review and adjust after use).
- Whether `getConflictsInGroup` is a standalone export or part of the `compatSlice` actions.
- Internal data structure for `compatMap` passed to pure functions (could be `CompatibilityEntry[]`, a `Map<string, CompatibilityStatus>`, or a derived lookup object — pick what's cleanest for the pure functions).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Vision, constraints, key decisions (TDD, Zustand slice pattern, StorageAdapter)
- `.planning/REQUIREMENTS.md` — Phase 2 requirements: COMPAT-01, COMPAT-04, SCORE-01, SCORE-02, SCORE-03, SCORE-04

### Existing Type Definitions
- `src/types/index.ts` — `CompatibilityStatus`, `CompatibilityEntry`, `AppState` already defined; Phase 2 must not redefine or conflict with these

### Existing Store Pattern
- `src/store/dogSlice.ts` — Pattern to follow for `compatSlice`: `StateCreator<AppState & AllActions, [], [], CompatActions>`, named exports

### No external specs
No ADRs or external design specs for Phase 2. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/index.ts` — `CompatibilityStatus` union and `CompatibilityEntry` type ready to use; `AppState.compatibilityEntries: CompatibilityEntry[]` already in store state
- `src/store/dogSlice.ts` — Slice pattern to follow exactly
- `src/store/index.ts` — Where `createCompatSlice` will be wired in alongside `createDogSlice`
- `src/lib/storage.ts`, `src/lib/utils.ts` — Existing lib utilities; scoring and suggest go in `src/lib/` alongside these

### Established Patterns
- TypeScript strict mode — all functions must satisfy `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Named exports for all modules
- No semicolons, 2-space indent, single quotes
- Pure functions in `src/lib/` — no store imports, no side effects
- Test files co-located with store slices (e.g. `dogSlice.test.ts`) and in `src/test/` for integration

### Integration Points
- `src/store/index.ts` — Wire `createCompatSlice` into the spread at store creation; `CompatActions` added to `AppStore` type
- `compatibilityEntries` array already initialised as `[]` in the store — Phase 2 populates it via slice actions

</code_context>

<specifics>
## Specific Ideas

- **Group view vision (Phase 4 input):** When a dog is added to a group with conflicting dogs, a red line appears connecting the conflicting pair in the group card grid. Clicking that line opens a dialog showing their compatibility history and walk notes. Phase 2's algorithm layer must expose the pair-level conflict data that makes this possible.
- **Unknown is visually distinct (COMPAT-04):** The data layer must preserve Unknown as a separate status — never coerce it to Neutral. The Phase 3 graph will render Unknown edges as dashed lines.

</specifics>

<deferred>
## Deferred Ideas

- **Notes on compatibility entries** — User's vision for the conflict-line dialog includes "notes from walk." The current `CompatibilityEntry` type has no notes field. This likely belongs in Phase 6 (Walk History) or as a Phase 3 enhancement once the graph UI exists.
- **Walk history in conflict dialog** — Showing walk history when clicking a conflict line requires Phase 6 data. Defer to Phase 6 or a Phase 4/6 bridge.

</deferred>

---

*Phase: 02-compatibility-system*
*Context gathered: 2026-03-27*
