# Phase 6: Walk History - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers walk outcome logging and per-dog history charts. The behaviorist can log a walk's outcome (Great/Good/Neutral/Poor/Incident) with optional notes and an immutable dog snapshot — triggerable from three entry points: the Calendar tab (scheduled slot card), the History tab (new 5th tab), or the DogPanel History sub-tab. Each dog's profile sheet gains a "History" tab showing a Recharts scatter/dot chart of outcomes over time. All data persists to LocalStorage via the existing persist layer.

</domain>

<decisions>
## Implementation Decisions

### App Navigation
- **D-01:** A fifth tab "History" is added to App.tsx. Tab order: Dogs | Compatibility | Groups | Calendar | History.

### Logging Entry Points (three paths to same log form)
- **D-02:** **Calendar tab** — each scheduled slot card gains a "Log" button. Clicking pre-fills the dog snapshot from the walk group's current dog list. The behaviorist can remove absent dogs before saving.
- **D-03:** **History tab** — has a "Log a walk" button at the top + a scrollable list of all past walk log entries. This is the catch-all path for off-schedule or retrospective logging (manual dog selection, date picker).
- **D-04:** **DogPanel — History sub-tab** — the History tab inside DogPanel has a "Log a walk for [dog name]" button. That dog is pre-filled; the behaviorist selects the other dogs present, picks the outcome, date, and notes.

### Log Form (shared across all entry points)
- **D-05:** The log form includes: date (date picker, defaults to today — supports backdating), outcome enum (Great / Good / Neutral / Poor / Incident), optional free-text notes, and a dog selection list (multi-select from active dogs). When triggered from Calendar or DogPanel, the relevant dogs are pre-populated.
- **D-06:** The log form is presented in a Sheet (consistent with DogPanel, EdgeSheet — not a modal). After save, the entry is immutable (HIST-03 — dog snapshot cannot be edited).

### Data Model
- **D-07:** A new `WalkLogEntry` type is added to `src/types/index.ts`:
  ```
  WalkLogEntry = {
    id: string
    date: string          // ISO date string (YYYY-MM-DD) — not a full timestamp
    outcome: WalkOutcome  // 'great' | 'good' | 'neutral' | 'poor' | 'incident'
    notes: string
    dogIds: string[]      // immutable snapshot of dogs present
    groupId?: string      // optional reference to the WalkGroup (if logged from calendar)
  }
  ```
- **D-08:** `WalkLogEntry` is standalone — it is NOT formally linked to a `WalkSession`. When logged from a calendar slot, the `groupId` is stored as optional metadata only. The log is self-contained and queryable per-dog without needing the schedule to exist.
- **D-09:** `walkHistorySlice` (naming: `walkHistory` in AppState) stores `walkHistory: WalkLogEntry[]`. Follows the same Zustand `StateCreator<AppState & AllActions, [], [], WalkHistoryActions>` slice pattern. Persisted via the existing LocalStorage persist layer.
- **D-10:** `AppState` gains a `walkHistory: WalkLogEntry[]` field (distinct from the existing `walkSessions: WalkSession[]` which is the calendar schedule).

### Dog Profile Evolution
- **D-11:** `DogPanel` gains two tabs: "Profile" (existing edit form, unchanged) and "History" (chart + log button). The tab switcher lives inside the panel below the header.
- **D-12:** The History tab contains: (1) a "Log a walk for [dog name]" button at the top, (2) the Recharts scatter/dot chart of this dog's outcomes over time, (3) a list of recent log entries below the chart (date, outcome badge, truncated notes).
- **D-13:** The Profile tab footer (Save / Discard buttons) is only shown when the Profile tab is active — the History tab has no footer (the log button is inline).

### Walk History Chart
- **D-14:** Chart type: **scatter/dot plot** (Recharts `ScatterChart`). X-axis = date, Y-axis = outcome level (Great → Incident mapped to numeric values for positioning). Each dot is colour-coded by outcome.
- **D-15:** Shows ALL historical entries (no cap). Recharts scales accordingly.
- **D-16:** Tooltip on hover: shows date, outcome label, and truncated notes (if any).
- **D-17:** Y-axis labels show the outcome names (Great, Good, Neutral, Poor, Incident). X-axis shows month/year ticks.

### History Tab (5th app tab)
- **D-18:** The History tab shows: (1) "Log a walk" button at top, (2) a filterable list of all walk log entries in reverse-chronological order (date, group name if applicable, outcome badge, dog names, truncated notes). Filtering is Claude's discretion — keep simple for v1.

### Claude's Discretion
- Exact Tailwind styling — slate palette, shadcn/ui patterns, consistent with existing app.
- Outcome colour palette for chart dots (suggested: green/teal/grey/amber/red for Great→Incident).
- Whether the log entry list in the History tab supports filtering by dog or outcome — keep simple for v1.
- DogPanel tab implementation (shadcn/ui tabs component vs simple button toggle).
- Whether "Log" button on calendar slot card opens the Sheet inline or navigates to the History tab.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Vision, constraints, key decisions (TDD, Tailwind, LocalStorage, Stitch for UI)
- `.planning/REQUIREMENTS.md` — Phase 6 requirements: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05

### Existing Store
- `src/store/groupSlice.ts` — Slice pattern to follow for `walkHistorySlice`
- `src/store/scheduleSlice.ts` — Slice pattern reference; note `walkSessions` is the calendar schedule (distinct from `walkHistory`)
- `src/store/index.ts` — Where `createWalkHistorySlice` will be wired; `AppState` gains `walkHistory: WalkLogEntry[]` field
- `src/store/migrations.ts` — Migration needed for new `walkHistory` field

### Existing Types
- `src/types/index.ts` — `Dog`, `WalkSession`, `AppState` — must not redefine; `WalkLogEntry`, `WalkOutcome` type to be added

### Existing Components to Evolve
- `src/components/DogPanel.tsx` — Gains two-tab structure (Profile / History); chart and log button live in History tab
- `src/components/CalendarSlot.tsx` — Gains "Log" button that opens the walk log sheet
- `src/App.tsx` — Gains fifth tab ("History"); renders `<WalkHistory />` component

### Existing Components to Reference
- `src/components/GroupPanel.tsx` — Reference for outcome badge / score display patterns
- `src/components/EdgeSheet.tsx` — Sheet pattern to follow for the log form sheet

### Prior Phase Context
- `.planning/phases/05-calendar-scheduler/05-CONTEXT.md` — Calendar slot card design, DnD architecture
- `.planning/phases/04-group-builder/04-CONTEXT.md` — Group panel patterns, MiniDogCard component

### No external specs
No ADRs or external design specs for Phase 6. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/DogPanel.tsx` — Existing profile sheet; gains Profile/History tabs in this phase
- `src/components/CalendarSlot.tsx` — Scheduled slot card; gains "Log" button
- `src/store/groupSlice.ts` — Slice pattern to mirror for `walkHistorySlice`
- `src/App.tsx` — Gains fifth tab; `activeTab` union type expands to include `'history'`

### Established Patterns
- TypeScript strict mode — all new code must satisfy `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Named exports for all modules
- No semicolons, 2-space indent, single quotes
- TDD with Vitest — tests written before or alongside implementation
- Zustand slice pattern: `StateCreator<AppState & AllActions, [], [], WalkHistoryActions>`
- Sheet/panel for form interactions (not modals)
- Slate palette + shadcn/ui components

### Integration Points
- `src/store/index.ts` — Wire `createWalkHistorySlice`; `AppState` gains `walkHistory` field
- `src/store/migrations.ts` — Schema migration for new `walkHistory` field
- `src/App.tsx` — Fifth tab added; renders `<WalkHistory />`
- `src/components/DogPanel.tsx` — Tab structure added
- `src/components/CalendarSlot.tsx` — Log button added

</code_context>

<deferred>
## Deferred Ideas

- **Edit/delete walk log entries** — Requirements say entries are immutable after save (HIST-03). Editing is out of scope for v1.
- **Filter history list by dog or outcome** — History tab list is unfiltered for v1; filtering could be a v2 enhancement.
- **Walk duration logging** — LOG-01 (v2 requirement). Not in Phase 6 scope.
- **CSV export of walk logs** — LOG-02 (v2 requirement). Not in Phase 6 scope.
- **History visible from calendar slot** — Clicking a slot to see past walks for that group slot. Could be a Phase 6/7 bridge; defer.

</deferred>

---

*Phase: 06-walk-history*
*Context gathered: 2026-03-28*
