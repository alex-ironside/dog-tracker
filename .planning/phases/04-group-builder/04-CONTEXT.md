# Phase 4: Group Builder - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers the Group Builder: a two-panel UI where the behaviorist drags dogs from a compact roster panel into named walk groups, with live compatibility scoring and inline SVG conflict-line highlighting. The underlying data layer (groupSlice) is new; scoring and conflict functions (scoreGroup, getConflictsInGroup) are already complete from Phase 2.

</domain>

<decisions>
## Implementation Decisions

### App Navigation
- **D-01:** Add a third tab to App.tsx — "Groups". Tab order: Dogs | Compatibility | Groups. Same tab bar pattern as Phases 1–3.

### Conflict Visualization
- **D-02:** Conflicting pairs inside a group are shown as red SVG lines connecting the two mini dog cards. This matches the Phase 2 vision ("red line connecting the conflicting pair in the group card grid"). Use `getConflictsInGroup` to identify which pairs to draw lines between.
- **D-03:** Clicking a red conflict line opens the existing `EdgeSheet` component (same Sheet used in Phase 3 for edge-click). Shows both dog names + compatibility status picker. No new UI component needed.
- **D-04:** Unknown-status pairs are NOT shown as conflict lines — only `conflict` status triggers a red line. Unknown pairs may affect the group score but do not draw a line.

### Group Creation & Management
- **D-05:** Groups are created via a "+ Add Group" button in the groups panel. New groups get a default name (e.g. "Group 1", "Group 2"). Group name is editable inline — clicking the name makes it an input field.
- **D-06:** If no groups exist when the behaviorist first opens the Groups tab, one empty group is auto-created ("Group 1").
- **D-07:** Groups are deletable via a delete button on the group panel header. Deleting a group returns all its dogs to the available roster.
- **D-08:** Groups are persisted to LocalStorage via the Zustand persist layer (same `dogTracker-store` key). `groupSlice` follows the same slice pattern as `dogSlice` and `compatSlice`.

### Roster Panel (left side)
- **D-09:** The left panel is a compact list — dog name + drag handle (GripVertical) only. No breed, age, edit, or archive buttons. This is a purpose-built roster component for the Group Builder, not a reuse of DogRoster.
- **D-10:** Dogs already assigned to any group are greyed out and non-draggable in the roster, with a label indicating which group they're in (e.g. "in Group 1"). They remain visible in the list — not hidden.
- **D-11:** Only active (non-archived) dogs appear in the Group Builder roster.

### Group Panel Layout (right side)
- **D-12:** Groups are stacked vertically — one group per row. No horizontal scroll. As groups are added, the panel scrolls down.
- **D-13:** Within each group panel, dogs are displayed as mini cards in a horizontal row. Each mini card shows: dog name + × remove button. No breed/age detail.
- **D-14:** The group panel header shows: group name (editable inline) | group score (live, from `scoreGroup`) | ⚠ warning icon if any conflicts exist | delete button.
- **D-15:** Dog can be removed from a group via the × button on its mini card. Removed dog returns to available in the roster. Drag-back to the roster is also supported per GROUP-05.

### DnD Implementation
- **D-16:** dnd-kit is the drag-and-drop library (pre-decided in roadmap plans). A single `DndContext` wraps both panels. Drag state is committed only in `onDragEnd` — no optimistic UI during drag.
- **D-17:** The GroupBuilder view is a new top-level component (`src/components/GroupBuilder.tsx`) rendered under the Groups tab in App.tsx.

### Claude's Discretion
- dnd-kit sensor configuration (pointer/touch/keyboard sensors) — use sensible defaults.
- Exact Tailwind styling of mini cards, roster rows, and group panels — follow the existing app aesthetic (slate palette, rounded-xl, shadcn/ui patterns).
- Whether conflict SVG lines are implemented with absolute-positioned SVG overlay or CSS-only approach — researcher should evaluate what works cleanly with the dnd-kit layout.
- Tab label: "Groups" or "Group Builder" — pick what fits the tab bar width.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Vision, constraints, key decisions (TDD, Tailwind, LocalStorage, Stitch for UI)
- `.planning/REQUIREMENTS.md` — Phase 4 requirements: GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05

### Existing Store
- `src/store/dogSlice.ts` — Slice pattern to follow for `groupSlice`
- `src/store/compatSlice.ts` — Slice pattern reference
- `src/store/index.ts` — Where `createGroupSlice` will be wired in; `AppState` type needs `groups` field added

### Existing Types
- `src/types/index.ts` — `Dog`, `CompatibilityStatus`, `AppState` — must not redefine; `Group` type to be added

### Existing Lib Functions
- `src/lib/scoring.ts` — `scoreGroup(dogs, compatMap)` and `getConflictsInGroup(dogs, compatMap)` are ready to call from the group panel UI

### Existing Components to Reuse
- `src/components/EdgeSheet.tsx` — Reuse for conflict line click (D-03); check if it needs a prop change to be driven from GroupBuilder
- `src/components/CompatBadge.tsx` — May be used for group score display; already exists
- `src/components/ui/sheet.tsx` — Underlying Sheet component

### No external specs
No ADRs or external design specs for Phase 4. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/scoring.ts` — `scoreGroup` and `getConflictsInGroup` ready; Phase 4 calls these on every group state change
- `src/components/EdgeSheet.tsx` — Existing conflict/status picker sheet; reuse for conflict line click
- `src/components/DogCard.tsx` — Has `GripVertical` icon already (drag-ready from Phase 1 D-05); the Group Builder uses its own compact roster row component, but DogCard is the reference for visual consistency
- `src/App.tsx` — Gains a third tab ("Groups"); same tab pattern as the existing two tabs

### Established Patterns
- TypeScript strict mode — all new code must satisfy `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Named exports for all modules
- No semicolons, 2-space indent, single quotes
- TDD with Vitest — tests written before or alongside implementation
- Zustand slice pattern: `StateCreator<AppState & AllActions, [], [], GroupActions>`
- Sheet/panel for status interactions (not modals)

### Integration Points
- `src/store/index.ts` — Wire `createGroupSlice` alongside existing slices; `AppState` gains `groups: Group[]`
- `src/App.tsx` — Third tab added; renders `<GroupBuilder />` when active
- `src/store/migrations.ts` — May need a schema migration if `groups` field is new to the persisted state

</code_context>

<specifics>
## Specific Ideas

- **Conflict line click → EdgeSheet:** User confirmed clicking a red SVG conflict line should open the existing EdgeSheet. Researcher should verify whether EdgeSheet needs a new prop to be triggered from outside CompatibilityGraph.
- **Import/export tie-in:** User noted that group persistence to LocalStorage "ties in with import/export." This reinforces the deferred JSON export/import idea from Phase 1 — groups must be included in the exported state blob when that feature is built.

</specifics>

<deferred>
## Deferred Ideas

- **JSON state export/import UI** — User noted groups should be included when the export/import feature is built. This remains deferred from Phase 1 context; groups are now another reason to prioritise it post-v1.
- **Auto-suggest into groups** — Using `suggestGroups` to pre-populate a group from algorithm suggestions. Not in Phase 4 scope (SUGG-01 is v2). Behaviorist composes groups manually in this phase.
- **Walk history in conflict dialog** — Showing walk history when clicking a conflict line requires Phase 6 data. Defer to Phase 6 or a Phase 4/6 bridge (noted in Phase 2 context).

</deferred>

---

*Phase: 04-group-builder*
*Context gathered: 2026-03-27*
