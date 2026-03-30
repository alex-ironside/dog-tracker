---
name: Walk Logger Redesign — Two Group Drop Fields
description: Context for redesigning WalkLogSheet two-groups mode with drop fields, per-group outcome, remove per-pair outcomes
type: project
---

# Quick Task 260330-gxb: Walk Logger Redesign — Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Task Boundary

Redesign the "Two groups" mode in WalkLogSheet:
- Replace the current A/B button table with two visual group "drop fields" (pool + two group boxes)
- Each group gets its own outcome selector
- Remove the "Per-pair outcomes" section entirely
- Keep the "All together" / "Two groups" toggle

The domain motivation: dogs sometimes behave fine in pairs, but a third dog joining causes fights — external interference from group composition matters. Logging sub-groups captures which dogs were physically together, enabling context-aware compatibility inference.

</domain>

<decisions>
## Implementation Decisions

### Per-group outcome meaning
Each group gets its own outcome (Group A: great, Group B: poor). These are independent outcomes for each sub-group's walk, not an A↔B interaction score. This replaces the current walk-level single outcome when in "Two groups" mode.

### "All together" mode
Keep the toggle. "All together" stays as-is (simple checkbox list + single walk-level outcome). Only the "Two groups" view changes.

### Dog assignment UX
A pool of unassigned dogs appears at the top of the "Two groups" view. Dogs are clicked/assigned into Group A or Group B fields below. Unassigned dogs remain in the pool and are excluded from the walk log (only A + B dogs are recorded).

### Per-pair outcomes section
Removed entirely — not shown in any mode. The new per-group outcome replaces it.

### Walk-level outcome in groups mode
When in "Two groups" mode, the top-level "Outcome" field is replaced by per-group outcome selectors inside each group box. The save logic uses each group's outcome independently.

### Claude's Discretion
- Visual treatment of group boxes (colored headers matching existing blue/amber theme for A/B)
- Whether to use click-to-assign chips or keep A/B buttons per dog in pool
- Exact layout of pool + two group fields within the sheet's scrollable body

</decisions>

<specifics>
## Specific Ideas

- Group A: blue styling (matching existing bg-blue-50/text-blue-700)
- Group B: amber styling (matching existing bg-amber-50/text-amber-700)
- The GroupBuilder uses DnD but a sheet context suits click-to-assign better
- The current `groupA`/`groupB` state and `groupContext` payload already exist in the store — reuse them
- `pairOutcomes` state and `dogPairs` useMemo can be removed
- The `allPairsCovered` logic can be removed
- Per-group outcomes should be stored separately (e.g. `groupAOutcome`, `groupBOutcome`) and passed via `groupContext` or a new field

</specifics>
