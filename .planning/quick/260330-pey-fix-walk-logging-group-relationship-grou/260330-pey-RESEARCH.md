# Quick Task 260330-pey: Fix Walk Logging Group Relationship — Research

**Researched:** 2026-03-30
**Domain:** Walk logging data model, group-level outcome semantics
**Confidence:** HIGH (based on direct code reading)

---

## Summary

The user's complaint is correct and specific: the current group walk UI logs **per-group outcomes** (groupAOutcome / groupBOutcome), each describing how the dogs within a single group fared. But the user wants to log **one outcome for the Group A vs Group B interaction** — i.e., "how did Group A and Group B get along when they met?"

This is a semantic shift: from "how did Group A do?" + "how did Group B do?" to "how did Group A interact with Group B?"

The current implementation (after 260330-gxb) already removed `pairOutcomes` and added per-group outcomes inside each group box. That's directionally better (no duplicate per-dog-pair logging), but the outcome labels are still attached to each group individually rather than to the A→B relationship.

---

## What Currently Exists (Code State as of 260330-i59)

### Data model (`src/types/index.ts`)

```typescript
export type GroupContext = {
  groupA: string[]
  groupB: string[]
  groupAOutcome?: WalkOutcome   // "how did Group A do"
  groupBOutcome?: WalkOutcome   // "how did Group B do"
}

export type WalkLogEntry = {
  id: string
  date: string
  outcome: WalkOutcome          // walk-level fallback; in groups mode = groupAOutcome
  notes: string
  dogIds: string[]
  groupId?: string
  groupContext?: GroupContext
}
```

No `pairOutcomes` field exists — it was removed in 260330-gxb. Confirmed.

### WalkLogSheet UI (`src/components/WalkLogSheet.tsx`)

- "All together" mode: single outcome picker, checkboxes — unchanged, works fine.
- "Two groups" mode: pool → DnD into Group A box or Group B box. Each box has its own outcome picker inside it ("Group A outcome" / "Group B outcome"). Both group outcomes required to save.
- `resolvedOutcome = groupAOutcome` used as the top-level `entry.outcome` (fragile semantic shortcut).

### WalkHistory display (`src/components/WalkHistory.tsx`)

- Shows "Group A: Rex, Bella [Good badge]  |  Group B: Charlie [Incident badge]"
- Shows "Cross-group" and "Within group" pair buttons (compatibility navigation, uses `compatMap`, not per-walk outcomes).

### Scoring (`src/lib/scoring.ts`)

`inferStatusFromHistory` handles group walks: when both `groupAOutcome` and `groupBOutcome` are present, it:
- Same-group pair: uses that group's outcome.
- Cross-group pair: uses the **worse** of the two group outcomes.

`inferGroupContextConflicts` looks at cross-group outcomes to detect hyperedge patterns for the graph.

---

## What the User Actually Wants

> "I need to create a relationship between 2 groups, not between dogs in a group. Group A -> Group B."

One single outcome for the **Group A ↔ Group B encounter**. Not two separate outcomes ("Group A did good" / "Group B had an incident") — one shared verdict for the interaction between the two groups.

Conceptually: "How did this group encounter go?" = one `WalkOutcome` attached to `groupContext`, not two.

---

## What Should Change

### 1. Data model: Replace two group outcomes with one cross-group outcome

```typescript
// REMOVE:
groupAOutcome?: WalkOutcome
groupBOutcome?: WalkOutcome

// ADD:
groupOutcome: WalkOutcome   // outcome for the Group A vs Group B interaction (required)
```

`GroupContext.groupOutcome` is the single outcome for the A→B relationship.

Migration: existing entries that have `groupAOutcome`/`groupBOutcome` need to derive a `groupOutcome` — use the worse of the two (same logic that `inferStatusFromHistory` already applies for cross-group pairs). Bump schema to version 4.

### 2. WalkLogSheet UI: One shared outcome picker

Remove the per-group outcome pickers inside each group box. Add one outcome picker below the two group boxes, labeled something like "Encounter outcome" or "How did the groups interact?".

The walk-level `entry.outcome` field becomes this shared group outcome (no more awkward `resolvedOutcome = groupAOutcome!` hack).

### 3. Scoring: Simplify `inferStatusFromHistory` for group walks

Currently for cross-group pairs it takes the worse of groupAOutcome/groupBOutcome. With the new model it just uses `groupContext.groupOutcome` directly. For same-group pairs (both dogs in Group A, or both in Group B), there is no per-group outcome anymore — fall back to `entry.outcome` (= the shared group encounter outcome). This is acceptable because the user's intent is to capture the inter-group interaction, not intra-group dynamics.

### 4. Scoring: Simplify `inferGroupContextConflicts`

Currently it checks `groupAOutcome` and `groupBOutcome` and derives a `crossOutcome` by taking the worse. With the new model, just read `groupContext.groupOutcome` directly. Less code, same or better accuracy.

### 5. WalkHistory display: One badge for the group encounter

Remove the separate outcome badges per group. Show one badge alongside "Group A: ... | Group B: ...". Or change the label to reflect the inter-group relationship: "Group A vs Group B: [Good]".

---

## What Should NOT Change

- "All together" mode: completely untouched. Single outcome, checkbox dogs, saves with no `groupContext`. No change needed.
- `GroupContext.groupA` / `groupContext.groupB` arrays: keep as-is. They define which dogs were in which group.
- The DnD pool → group-box UI: keep as-is. The assignment mechanism is fine; only the outcome section changes.
- `pairOutcomes`: already removed in 260330-gxb. Do not re-add.
- Cross-group/within-group pair buttons in WalkHistory: these open EdgeSheet for compatibility navigation. They use `compatMap` (not per-walk outcomes). Keep them — they let the user jump to the compatibility editor from a walk entry. They are NOT duplicating outcome logging; they are navigation.

---

## Schema Migration

Current `CURRENT_SCHEMA_VERSION = 3` (set in 260330-gxb or p9k).

Version 4 migration: for any entry where `groupContext` exists and has `groupAOutcome` or `groupBOutcome` but no `groupOutcome`:
- Derive `groupOutcome` = worse of `groupAOutcome` and `groupBOutcome`
- Remove `groupAOutcome` and `groupBOutcome`

After migration, `GroupContext` shape:
```typescript
export type GroupContext = {
  groupA: string[]
  groupB: string[]
  groupOutcome: WalkOutcome
}
```

---

## Impact on `entry.outcome` (top-level field)

Currently in groups mode: `entry.outcome = groupAOutcome` (a hack). With the new model: `entry.outcome = groupOutcome` (the shared encounter outcome). This is clean — the top-level outcome field now always means "the outcome of the walk/encounter" regardless of mode.

---

## Files to Change

| File | Change |
|------|--------|
| `src/types/index.ts` | `GroupContext`: remove `groupAOutcome?`, `groupBOutcome?`; add `groupOutcome: WalkOutcome` |
| `src/store/migrations.ts` | Bump to v4; derive `groupOutcome` from old fields |
| `src/components/WalkLogSheet.tsx` | Remove per-group outcome pickers; add one shared outcome picker below both group boxes |
| `src/lib/scoring.ts` | `inferStatusFromHistory`: use `groupContext.groupOutcome` directly. `inferGroupContextConflicts`: same. |
| `src/components/WalkHistory.tsx` | Remove per-group outcome badges; show one badge for the encounter |

No other files need changes (graph hyperedge logic in CompatibilityGraph uses `inferGroupContextConflicts` which gets simplified, not broken).

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Current code state | HIGH | Read all files directly |
| Required data model change | HIGH | User intent is unambiguous |
| Migration strategy | HIGH | Standard worst-of pattern already used in scoring.ts |
| Scoring impact | HIGH | One field substitution, no logic rethink needed |
