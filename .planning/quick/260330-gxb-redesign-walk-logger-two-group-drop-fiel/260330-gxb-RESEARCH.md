# Quick Task 260330-gxb: Walk Logger Redesign — Research

**Researched:** 2026-03-30
**Domain:** WalkLogSheet component, types, scoring logic, WalkHistory display
**Confidence:** HIGH (all findings from direct source inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Each group gets its own outcome (Group A: great, Group B: poor) — independent outcomes per sub-group, replaces the single walk-level outcome in two-groups mode.
- Keep the "All together" / "Two groups" toggle. "All together" mode is unchanged.
- Dog assignment UX: pool of unassigned dogs at the top, click to assign into Group A or Group B. Unassigned dogs are excluded from the walk log.
- Per-pair outcomes section removed entirely — not shown in any mode.
- In "Two groups" mode, the top-level Outcome field is replaced by per-group outcome selectors inside each group box.

### Claude's Discretion
- Visual treatment of group boxes (colored headers matching existing blue/amber theme for A/B)
- Whether to use click-to-assign chips or keep A/B buttons per dog in pool
- Exact layout of pool + two group fields within the sheet's scrollable body

### Deferred Ideas (OUT OF SCOPE)
- None listed.
</user_constraints>

---

## Summary

The redesign is self-contained within `WalkLogSheet.tsx` (UI state) and `src/types/index.ts` (data shape). The store slice (`walkHistorySlice.ts`) accepts `Omit<WalkLogEntry, 'id'>` so any field additions to `WalkLogEntry` pass through without touching the slice. The primary work is: (1) extend `GroupContext` with per-group outcomes, (2) rewrite the two-groups UI section in `WalkLogSheet`, (3) fix the save payload, and (4) update `scoring.ts` and `WalkHistory.tsx` which both read `pairOutcomes` from stored entries.

**Primary recommendation:** Add `groupAOutcome` and `groupBOutcome` to `GroupContext` in types; remove `pairOutcomes` from `WalkLogEntry`; replace the A/B button table with a pool-then-boxes layout; update scoring and history display to use per-group outcomes instead.

---

## Finding 1: Type Changes Required

### Current `GroupContext`
```typescript
// src/types/index.ts line 40-43
export type GroupContext = {
  groupA: string[]
  groupB: string[]
}
```

### Current `WalkLogEntry` fields to change
- `pairOutcomes?: Record<string, WalkOutcome>` — **remove** (line 52)
- `groupContext?: GroupContext` — **keep**, but extend `GroupContext`

### Required change
```typescript
export type GroupContext = {
  groupA: string[]
  groupB: string[]
  groupAOutcome?: WalkOutcome   // outcome for Group A's sub-walk
  groupBOutcome?: WalkOutcome   // outcome for Group B's sub-walk
}
```

`pairOutcomes` on `WalkLogEntry` should be removed from the type. It is optional (`?`) so existing persisted records without it already type-check — removing the field only affects write paths and readers.

**Backward compatibility:** Existing records in localStorage may have `pairOutcomes` set. Since the field is optional and TypeScript ignores extra keys in persisted JSON, old records remain readable. No schema migration is needed (schema is at v3 per recent commits; this change does not alter the structure enough to warrant bumping it, but the planner should confirm).

---

## Finding 2: WalkLogSheet State to Remove

The following state and derived values are exclusively in service of per-pair outcomes and can be removed:

| Item | Line | Safe to remove |
|------|------|---------------|
| `pairOutcomes` state + `setPairOutcomes` | 47 | Yes — no callers outside WalkLogSheet |
| `dogPairs` useMemo | 92-105 | Yes — only used by pairOutcomes UI and `allPairsCovered` |
| `allPairsCovered` derived boolean | 108-109 | Yes — only affects outcome validation logic |
| `pairKey` import | 7 | Yes — only used for `dogPairs` |
| Per-pair outcomes JSX block | 406-456 | Yes |

### New state to add
```typescript
const [groupAOutcome, setGroupAOutcome] = useState<WalkOutcome | null>(null)
const [groupBOutcome, setGroupBOutcome] = useState<WalkOutcome | null>(null)
```

These must be reset to `null` in the `useEffect` that resets the form on `open`.

---

## Finding 3: Outcome Validation Change

Current logic (lines 144-148) makes walk-level outcome optional when `allPairsCovered`. After the redesign:

- **"All together" mode:** walk-level `outcome` is required (unchanged).
- **"Two groups" mode:** walk-level `outcome` field is hidden. Instead, validate that `groupAOutcome !== null` and `groupBOutcome !== null`. Both groups must have at least one dog AND an outcome before saving.

The top-level outcome field rendered at lines 250-279 should be **conditionally rendered** — visible only when `groupMode === 'together'`.

Save logic in groups mode:
```typescript
// outcome on WalkLogEntry: use groupAOutcome as the "primary" walk-level outcome
// OR store a sentinel (e.g. 'neutral') — confirm with planner
const resolvedOutcome = groupMode === 'groups'
  ? (groupAOutcome ?? 'neutral')   // walk-level field kept for backward compat with history display
  : (outcome ?? 'neutral')

const groupContextPayload = groupMode === 'groups'
  ? { groupA, groupB, groupAOutcome: groupAOutcome!, groupBOutcome: groupBOutcome! }
  : undefined
```

Note: `WalkLogEntry.outcome` is non-optional in the type, so a value must always be passed to `addWalkLog`. The planner should decide whether to use `groupAOutcome` as the canonical walk-level outcome in groups mode (simplest) or always use `'neutral'` as a placeholder.

---

## Finding 4: Pool + Two Group Boxes UX

The current approach (3-column table with A/B buttons per row) uses `groupAssignments: Record<dogId, 'A' | 'B' | null>`. The existing `handleGroupAssign` function and `groupA`/`groupB` derived useMemo values can be **kept as-is** — the assignment logic does not change, only the rendering changes.

**New layout structure for "Two groups" mode:**

```
┌─ Pool (unassigned dogs) ────────────────┐
│  [Buddy chip]  [Max chip]  [Luna chip]  │
└─────────────────────────────────────────┘

┌─ Group A (blue) ──────────────────┐  ┌─ Group B (amber) ──────────────┐
│  [Rex chip]  [Bella chip]         │  │  [Coco chip]                   │
│  Outcome: [Great][Good][...]      │  │  Outcome: [Great][Good][...]   │
└───────────────────────────────────┘  └────────────────────────────────┘
```

**Click behavior:**
- Click a dog chip in the pool → assign to A (first click) or show A/B choice. Given the CONTEXT.md note about click-to-assign, the simplest pattern: clicking a pool dog assigns it to Group A; clicking an assigned dog in a group chip removes it back to pool. Clicking a Group A dog with a second "send to B" affordance moves it to B.
- Alternatively (simpler): clicking a pool dog cycles through unassigned → A → B → unassigned. This avoids needing an explicit "move to B" button. CONTEXT.md leaves this to Claude's discretion.

**Recommendation:** Use a single-click cycle: pool → A → B → pool. Each chip shows its current assignment badge. This is the most compact UX and avoids needing two separate click targets.

---

## Finding 5: Impact on scoring.ts

`inferGroupContextConflicts` at line 70-71 currently guards with:
```typescript
if (!entry.groupContext || !entry.pairOutcomes) continue
```

After removing `pairOutcomes`, this guard skips all group-context entries. The function needs updating to use per-group outcomes instead.

**New logic:** When `groupContext` has `groupAOutcome` or `groupBOutcome`, the outcome of a cross-group pair can be inferred from the group outcomes rather than a per-pair record. The simplest replacement: if both groups had poor/incident outcomes, treat all cross-group pairs as having that outcome. If only one group had it, use that group's outcome for cross-group pairs involving that group's dogs.

Concrete replacement for line 71-78:
```typescript
if (!entry.groupContext) continue
const { groupA, groupB, groupAOutcome, groupBOutcome } = entry.groupContext
// Derive cross-group outcome: worst of the two group outcomes
const crossOutcome = (() => {
  const outcomes = [groupAOutcome, groupBOutcome].filter(Boolean) as WalkOutcome[]
  if (outcomes.includes('incident')) return 'incident'
  if (outcomes.includes('poor')) return 'poor'
  return null
})()
if (!crossOutcome) continue
// Then use crossOutcome in place of entry.pairOutcomes[pk] ?? entry.outcome
```

**Confidence:** MEDIUM — this logic is a reasonable adaptation but the exact semantics (worst-of vs per-dog-group) should be confirmed during planning.

---

## Finding 6: Impact on WalkHistory.tsx

`WalkHistory.tsx` uses `entry.pairOutcomes` in one place:

- Line 71: `const pairSpecificOutcome = entry.pairOutcomes?.[pk]`
- Line 72: `const showBadge = pairSpecificOutcome !== undefined && pairSpecificOutcome !== entry.outcome`

This badge displays a different outcome on a pair button when that pair had an override. After removing `pairOutcomes`, this badge logic becomes moot — the badge can be removed or replaced with a group-outcome indicator on the group A/B label rows (already rendered at lines 100-110).

`groupContext.groupA`/`groupB` access (lines 43-60) is unaffected — those fields stay.

The group-names display block (lines 100-110) currently shows `entry.outcome` via `OutcomeBadge`. After the redesign, entries in groups mode will have `groupContext.groupAOutcome` and `groupContext.groupBOutcome`. The planner should add per-group outcome badges to those lines.

---

## Finding 7: Test File Impact

`WalkLogSheet.test.tsx` has **no tests referencing pairOutcomes, dogPairs, or groupContext**. The existing tests cover:
- Rendering (title, date, outcome buttons, dog checkboxes) — unaffected
- Outcome button interaction — unaffected (walk-level outcome in together mode stays)
- Validation: "Please select an outcome." and "Select at least one dog." — validation logic changes in groups mode; existing tests are for together-mode paths and remain valid
- Save test: checks `outcome` and `dogIds` in payload — still valid for together mode

**New tests needed:**
- Two-groups mode renders pool + two group boxes
- Clicking a pool dog assigns it (cycle or A/B)
- Per-group outcome selectors appear in each group box
- Validation: groups mode requires both groups to have dogs AND outcomes
- Save in groups mode passes `groupContext` with `groupAOutcome`/`groupBOutcome`, no `pairOutcomes`

`WalkHistory.test.tsx` and scoring tests should be checked separately if they exercise `pairOutcomes` — the grep found **no test files match** `pairOutcomes` or `groupContext`, so no test files outside WalkLogSheet.test.tsx need updating.

---

## Don't Hand-Roll

| Problem | Use Instead |
|---------|-------------|
| Chip/pill styling | Inline Tailwind with `cn()` — existing pattern throughout codebase |
| Cycle-click state | Simple `groupAssignments` record, existing `handleGroupAssign` with modified toggle logic |
| Outcome button row | Reuse existing `OUTCOME_OPTIONS` map and button pattern — already used for walk-level outcome |

---

## Open Questions

1. **Walk-level `outcome` field in groups mode** — `WalkLogEntry.outcome` is required. Should it hold `groupAOutcome` (simplest), or always be `'neutral'` as a placeholder? Affects history display default. Recommendation: use `groupAOutcome` so the existing `OutcomeBadge` in history still shows a meaningful value for Group A.

2. **`inferGroupContextConflicts` outcome semantics** — With per-group outcomes replacing per-pair outcomes, the cross-group conflict inference becomes coarser (group-level vs pair-level). This is acceptable for v1 — worth noting in plan as an acknowledged tradeoff.

3. **Schema version** — The `pairOutcomes` removal is a non-breaking change (optional field, existing records unaffected). No migration needed unless the team wants to explicitly version the GroupContext shape change. Current schema is v3.

---

## Sources

All findings from direct source inspection (HIGH confidence):
- `src/types/index.ts` — WalkLogEntry and GroupContext types
- `src/components/WalkLogSheet.tsx` — full component including state, handlers, and JSX
- `src/components/WalkLogSheet.test.tsx` — full test suite
- `src/lib/scoring.ts` — inferGroupContextConflicts and inferStatusFromHistory
- `src/components/WalkHistory.tsx` — pairOutcomes display and groupContext rendering
- `src/store/walkHistorySlice.ts` — addWalkLog action (pass-through, no changes needed)
- Grep across all test files: zero matches for pairOutcomes/groupContext

**Research date:** 2026-03-30
**Valid until:** Indefinite (static codebase snapshot)
