# Phase 2: Compatibility System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 02-compatibility-system
**Areas discussed:** UI scope, Scoring formula, Auto-suggest behaviour, Pair symmetry / key strategy

---

## UI Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Pure data layer | Phase 2 = compatSlice + scoring + auto-suggest, no UI. Graph (Phase 3) is the only entry point. | ✓ |
| Simple table/matrix UI | Basic grid/dropdown for setting compatibility in Phase 2 | |
| Minimal select UI per dog pair | Status dropdown on dog profile for each other dog | |

**User's choice:** Pure data layer — confirmed after user clarified they expected the compatibility graph to be the UI entry point (which is Phase 3).

---

## Scoring Formula

| Option | Description | Selected |
|--------|-------------|----------|
| Simple average | Compatible=100, Neutral=50, Conflict=0, Unknown=25; average all pairs | |
| Conflict veto | Any conflict → score=0 immediately | |
| Claude's discretion | Design what makes sense, adjust after use | ✓ |

**User's choice:** Deferred to Claude. User clarified the primary purpose is identifying incompatible dog pairs (not producing a score), and the group score is secondary. The algorithm layer must expose pair-level conflict data.

**User's vision clarified:** Group view shows dog cards in a grid. When dog A (with conflict against D) is added to a group containing D, a red line appears between A and D. Clicking the line opens a dialog showing compatibility history and walk notes.

---

## Auto-Suggest Behaviour

| Option | Description | Selected |
|--------|-------------|----------|
| Top 3, greedy | Fixed top-3 ranked compositions, greedy algorithm | |
| Top N, configurable | maxResults param, default 3, iterative loop | ✓ |

**User's choice:** Top N (default 3), iterative loop (not recursion).

**Small pool handling:**

| Option | Description | Selected |
|--------|-------------|----------|
| Best available | Return least-bad options even with conflicts | ✓ |
| Empty / error | Return empty array when no conflict-free group exists | |

**User's choice:** Best available — let the behaviorist decide.

---

## Pair Symmetry / Key Strategy

Discussed inline — no formal options presented. Decision: sorted ID pair key `[idA, idB].sort().join('|')` — canonical, deterministic, no extra dependency.

---

## Claude's Discretion

- Exact scoring weights for the 4 statuses
- Whether `getConflictsInGroup` is standalone or part of slice actions
- Internal `compatMap` data structure for pure functions

## Deferred Ideas

- Notes field on `CompatibilityEntry` — needed for the conflict-line dialog but not in current types; defer to Phase 6 or Phase 3 enhancement
- Walk history in conflict dialog — requires Phase 6 data; defer
