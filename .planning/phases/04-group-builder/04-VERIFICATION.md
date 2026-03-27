---
phase: 04-group-builder
verified: 2026-03-27T16:00:00Z
status: human_needed
score: 11/11 must-haves verified
human_verification:
  - test: "Drag a dog from the roster into a group panel"
    expected: "Dog card appears in the group, roster row greys out with 'in [GroupName]' label"
    why_human: "Real pointer drag events cannot be simulated in jsdom; DndContext is mocked in tests"
  - test: "Drag a dog from a group panel back onto the roster"
    expected: "Dog is removed from the group and becomes draggable in the roster again"
    why_human: "Same drag limitation as above"
  - test: "Add two conflicting dogs to the same group (compatibility status = 'conflict')"
    expected: "A red SVG line connects the two dog cards inside the group body"
    why_human: "getBoundingClientRect returns 0 in jsdom; line coordinates are real layout values only available in a browser"
  - test: "Click the red conflict line between two dogs"
    expected: "EdgeSheet opens showing both dog names and the current 'conflict' status"
    why_human: "SVG click target area is layout-dependent; cannot verify in jsdom"
  - test: "Add a dog with Unknown compatibility to a group alongside another dog"
    expected: "No red line appears for the unknown-status pair (only the amber warning icon shows)"
    why_human: "Visual absence of SVG line requires real layout to confirm the filter is applied correctly end-to-end"
  - test: "Inline group name editing"
    expected: "Clicking group name turns it into an input; pressing Enter saves; pressing Escape reverts"
    why_human: "Focus/blur cycle behavior is most reliable in a live browser"
---

# Phase 4: Group Builder Verification Report

**Phase Goal:** Let the behaviorist drag dogs from the roster into named walk groups, with live compatibility scoring and inline conflict highlighting on each drop.
**Verified:** 2026-03-27T16:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All truths are drawn from the `must_haves` frontmatter of Plans 01 and 02.

#### Plan 01 must-haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Behaviorist sees a Groups tab in the app | VERIFIED | `App.tsx` line 33: third tab button with text "Groups", `activeTab === 'groups'` renders `<GroupBuilder />` |
| 2 | Behaviorist can create a named walk group | VERIFIED | `groupSlice.ts` `addGroup(name)` creates UUID group; `GroupBuilder.tsx` "+ Add Group" button calls it; auto-creates "Group 1" on mount |
| 3 | Behaviorist can drag a dog from the roster into a group | VERIFIED (automated only) | `DndContext` + `PointerSensor` wired; `handleDragEnd` calls `addDogToGroup`; GroupBuilder test confirms store mutation on mock drag |
| 4 | A dog cannot appear in two groups simultaneously | VERIFIED | `groupSlice.ts` lines 23-26: `addDogToGroup` removes dogId from all other groups before inserting; dedicated test passes |
| 5 | Behaviorist can remove a dog from a group via remove button or drag-back | VERIFIED | `MiniDogCard` renders remove button with `aria-label`; `handleDragEnd` with `over.id === 'roster'` calls `removeDogFromGroup`; both paths tested |
| 6 | Dogs already in a group appear greyed out in the roster | VERIFIED | `RosterRow.tsx`: `isAssigned` branch applies `opacity-60 cursor-not-allowed`; "in [GroupName]" label; GroupBuilder test passes |

#### Plan 02 must-haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | When a dog is dropped into a group, the group score badge updates immediately | VERIFIED | `GroupBuilder.tsx` line 144: `scoreGroup(group.dogIds, compatMap)` computed per-render from live store; `GroupPanel.tsx` renders `Score: {score}` badge with color coding; GroupPanel tests for green/yellow/red pass |
| 8 | Conflicting pairs within a group are connected by red SVG lines | VERIFIED (automated only) | `ConflictOverlay.tsx` line 33: filters `c.status === 'conflict'`; renders `<line stroke='#ef4444'>`; `GroupPanel.test.tsx` test with mocked `getBoundingClientRect` confirms `<line>` element present |
| 9 | Unknown-status pairs do NOT show conflict lines | VERIFIED | `computeConflictLines` line 33 explicitly filters to `'conflict'` only; `GroupPanel.test.tsx` "unknown-status pairs do NOT render conflict lines" test passes |
| 10 | Clicking a red conflict line opens the EdgeSheet with the two dog names | VERIFIED (automated only) | `ConflictOverlay.tsx` `onClick={() => onConflictClick(l.idA, l.idB)}`; `GroupBuilder.tsx` line 159: `onConflictClick` sets `edgeSheetState`; `EdgeSheet` rendered with correct props lookup |
| 11 | EdgeSheet allows changing the compatibility status of the conflicting pair | VERIFIED | `GroupBuilder.tsx` lines 184-191: `onSetStatus` calls `setCompatibility`; `onRemove` calls `removeCompatibility`; both close the sheet; existing EdgeSheet tests pass (7 tests) |

**Score: 11/11 truths verified (automated)**

---

## Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/store/groupSlice.ts` | Group state CRUD + GROUP-02 enforcement | Yes | Yes (40 lines, 5 actions) | Yes — spread into `index.ts` via `createGroupSlice` | VERIFIED |
| `src/store/groupSlice.test.ts` | Unit tests for group slice | Yes | Yes (7 tests, all pass) | Yes — imports and calls slice directly | VERIFIED |
| `src/components/GroupBuilder.tsx` | Top-level DnD view | Yes | Yes (196 lines, DndContext, sensors, drag handlers, EdgeSheet) | Yes — imported and rendered in `App.tsx` | VERIFIED |
| `src/components/GroupBuilder.test.tsx` | Component tests | Yes | Yes (8 tests, all pass) | Yes — imports and renders GroupBuilder | VERIFIED |
| `src/components/RosterRow.tsx` | Draggable roster row | Yes | Yes — `useDraggable`, disabled path, opacity-60, GripVertical | Yes — rendered by `GroupBuilder.tsx` | VERIFIED |
| `src/components/GroupPanel.tsx` | Droppable group card | Yes | Yes (148 lines — score badge, conflict overlay, inline rename, delete, mini cards) | Yes — rendered by `GroupBuilder.tsx` with full prop set | VERIFIED |
| `src/components/MiniDogCard.tsx` | Mini card with remove button | Yes | Yes (22 lines, aria-label, X icon) | Yes — rendered by `GroupPanel.tsx` | VERIFIED |
| `src/components/ConflictOverlay.tsx` | SVG red-line renderer | Yes | Yes — `computeConflictLines` + `ConflictOverlay` render component, filters to 'conflict' only | Yes — imported and called from `GroupPanel.tsx` | VERIFIED |
| `src/components/GroupPanel.test.tsx` | Conflict + score tests | Yes | Yes (10 tests including score badges, conflict lines, unknown exclusion, rename, delete) | Yes — tests GroupPanel directly | VERIFIED |

---

## Key Link Verification

### Plan 01 key links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `GroupBuilder.tsx` | `src/store/index.ts` | `useAppStore` selectors for `walkGroups`, `dogs`, `addDogToGroup`, `removeDogFromGroup`, etc. | WIRED | Line 63: `useAppStore(useShallow(...))` reads all required selectors |
| `GroupBuilder.tsx` | `@dnd-kit/core` | `DndContext onDragEnd` handler | WIRED | Line 3-11: imports `DndContext`; line 124: `<DndContext ... onDragEnd={handleDragEnd}>` |
| `App.tsx` | `GroupBuilder.tsx` | Groups tab rendering | WIRED | Line 4: `import { GroupBuilder }`; line 48: `<GroupBuilder />` |
| `src/store/index.ts` | `src/store/groupSlice.ts` | `createGroupSlice` spread into store | WIRED | `index.ts` line 5: import; line 21: `...createGroupSlice(...a)` |

### Plan 02 key links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `GroupPanel.tsx` | `ConflictOverlay.tsx` | `ConflictOverlay` rendered inside group body | WIRED | `GroupPanel.tsx` line 6: import; line 140: `<ConflictOverlay lines={conflictLines} .../>` rendered when `conflictLines.length > 0` |
| `GroupBuilder.tsx` | `EdgeSheet.tsx` | EdgeSheet state managed in GroupBuilder, opened on conflict line click | WIRED | Line 16: `import { EdgeSheet }`; lines 175-193: `edgeSheetState` controls rendering |
| `ConflictOverlay.tsx` | `src/lib/scoring.ts` | `getConflictsInGroup` provides conflict pairs | WIRED (via GroupPanel) | `GroupBuilder.tsx` line 18 imports `getConflictsInGroup`; passes result as `conflicts` prop to `GroupPanel` which passes to `computeConflictLines` |

**Note on ConflictOverlay architecture:** The implementation diverges from the plan's prop shape in a meaningful way. Plan 02 specified `ConflictOverlay` receive `conflicts`, `cardRefs`, and `containerRef` as props and run `useLayoutEffect` internally. The actual implementation splits this into two: `computeConflictLines` (a pure function) called from `GroupPanel`'s `useLayoutEffect`, and `ConflictOverlay` (a pure render component) that receives pre-computed `lines`. This is architecturally superior — it avoids ref timing issues where a child's `useLayoutEffect` fires before the parent's ref is set. The goal is achieved with better reliability.

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `GroupBuilder.tsx` | `dogs`, `walkGroups`, `compatibilityEntries` | `useAppStore` (Zustand + localStorage persist) | Yes — reads from live Zustand store backed by localStorage | FLOWING |
| `GroupPanel.tsx` | `score`, `conflicts`, `hasConflicts` | `scoreGroup` / `getConflictsInGroup` computed per-render in `GroupBuilder.tsx` from live `compatMap` | Yes — pure functions over live store data | FLOWING |
| `ConflictOverlay.tsx` | `lines` | `computeConflictLines` called in `GroupPanel`'s `useLayoutEffect` from DOM rects | Yes — reads live DOM positions at layout time | FLOWING (browser only — jsdom returns 0s; see human verification) |
| `RosterRow.tsx` | `assignedGroupName` | `dogGroupMap` built per-render in `RosterPanel` from live `walkGroups` | Yes — derived from live store | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| groupSlice unit tests (7 tests) | `npx vitest run src/store/groupSlice.test.ts` | 7 passed | PASS |
| GroupBuilder component tests (8 tests) | `npx vitest run src/components/GroupBuilder.test.tsx` | 8 passed | PASS |
| GroupPanel tests (10 tests) | `npx vitest run src/components/GroupPanel.test.tsx` | 10 passed | PASS |
| Full suite regression (131 tests) | `npx vitest run` | 131 passed, 13 files | PASS |
| Production build (TypeScript + Vite) | `npm run build` | Built in 15.63s, no errors | PASS |
| ESLint | `npm run lint` | FAIL — missing `eslint.config.js` | PRE-EXISTING (see note) |

**ESLint note:** `npm run lint` fails with "ESLint couldn't find an eslint.config.(js|mjs|cjs) file." This is a pre-existing issue — no ESLint config was ever created (packages installed, config omitted). The Phase 4 commits did not introduce this; it is present back to Phase 1's initial commit. Not a Phase 4 gap.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| GROUP-01 | Plan 01 | Behaviorist can create a named walk group and drag dogs from the roster into it | SATISFIED | `addGroup` + `addDogToGroup` in slice; GroupBuilder two-panel layout; drag handlers wired; Groups tab in App.tsx |
| GROUP-02 | Plan 01 | Each dog can only appear in one group at a time | SATISFIED | `groupSlice.ts` `addDogToGroup` removes from other groups first (line 24-26); dedicated test "removes dogId from other group when already assigned" passes |
| GROUP-03 | Plan 02 | When a dog is dropped into a group, a compatibility badge shows the group's overall compatibility score | SATISFIED | `GroupPanel.tsx` renders `Score: {score}` badge with green/yellow/red color coding computed via `scoreGroup`; 3 GroupPanel score tests pass |
| GROUP-04 | Plan 02 | Conflicts within a group are highlighted inline (not just as a summary warning) | SATISFIED | `ConflictOverlay.tsx` SVG lines inside group body; `AlertTriangle` warning icon in header; only 'conflict' status draws lines (not 'unknown'); GroupPanel tests confirm both |
| GROUP-05 | Plan 01 | Behaviorist can remove a dog from a group by dragging back or via a remove button | SATISFIED | `MiniDogCard` remove button calls `onRemoveDog`; `handleDragEnd` with `over.id === 'roster'` calls `removeDogFromGroup`; both paths tested |

All 5 requirements mapped to Phase 4 are satisfied. No orphaned requirements found for Phase 4 in REQUIREMENTS.md.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/GroupBuilder.tsx` | 89-93 | `useEffect` with `useAppStore.getState()` to avoid stale closure on mount auto-create | Info | Intentional pattern per plan; not a stub — avoids re-triggering if groups already exist |

No TODOs, FIXMEs, placeholder returns, or empty implementations found in any Phase 4 files.

---

## Human Verification Required

### 1. Live Drag-and-Drop: Roster to Group

**Test:** Open the Groups tab in the browser. Add 2+ dogs in the Dogs tab first. Return to Groups tab. Drag a dog from the roster panel (left) into a group panel (right).
**Expected:** The dog card appears inside the group. The roster row greys out with an "in [GroupName]" label. The score badge in the group header updates.
**Why human:** `DndContext` is mocked in tests; real `PointerSensor` with `activationConstraint: { distance: 8 }` cannot be exercised in jsdom.

### 2. Live Drag-Back to Roster

**Test:** With a dog already in a group, drag it from the group body back over the roster panel.
**Expected:** Dog is removed from the group. The roster row becomes draggable again (cursor-grab, no grey label).
**Why human:** Same drag limitation as above.

### 3. Red Conflict Lines Positioned Correctly

**Test:** Set compatibility between Dog A and Dog B to "Conflict" (via Compatibility tab). Add both dogs to the same group.
**Expected:** A red SVG line connects the two dog cards inside the group body.
**Why human:** `getBoundingClientRect` returns 0 in jsdom; line coordinates are computed from real DOM layout positions only available in a browser. Automated test confirms the line element exists with mocked rects, but visual positioning requires a browser.

### 4. Conflict Line Click Opens EdgeSheet

**Test:** With two conflicting dogs in a group and a red line visible, click the red line.
**Expected:** The EdgeSheet slides in, showing both dog names and the current "Conflict" status selected. The status can be changed.
**Why human:** SVG click target area and positioning are layout-dependent. Jsdom confirms `onClick` is wired; browser confirms the click target is reachable.

### 5. Unknown-Status Exclusion (Visual Confirmation)

**Test:** Add two dogs with Unknown compatibility to the same group.
**Expected:** The amber `AlertTriangle` warning icon appears in the group header, but NO red line connects the two dog cards. Only the "Conflict" status produces lines.
**Why human:** Automated test confirms no `<line>` element with mocked zero rects, but visual confirmation in a real browser validates the full end-to-end behavior.

### 6. Inline Group Name Editing

**Test:** In the Groups tab, click on a group name (e.g., "Group 1").
**Expected:** The name becomes an editable input. Typing a new name and pressing Enter saves it. Pressing Escape reverts to the original name.
**Why human:** Focus/blur cycles and keyboard interactions are most reliable to verify in a live browser due to jsdom focus limitations.

---

## Gaps Summary

No automated gaps were found. All 11 must-have truths pass automated verification. The 6 human verification items above are required to fully validate the drag-and-drop interaction and SVG positioning behavior that cannot be exercised in jsdom.

The phase goal — "let the behaviorist drag dogs from the roster into named walk groups, with live compatibility scoring and inline conflict highlighting on each drop" — is implemented end-to-end in the codebase. All GROUP-01 through GROUP-05 requirements are satisfied.

---

_Verified: 2026-03-27T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
