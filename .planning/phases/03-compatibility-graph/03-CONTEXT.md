# Phase 3: Compatibility Graph - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the interactive network graph UI for compatibility data. Dogs appear as nodes; explicitly-set compatibility pairs appear as coloured edges. The behaviorist can click an edge to update status, and click a node to open the dog's profile. The underlying data layer (compatSlice, scoring functions) is already complete from Phase 2 — this phase is purely the visual and interaction layer.

</domain>

<decisions>
## Implementation Decisions

### App Navigation / Layout
- **D-01:** Tabbed layout — a tab bar with two tabs: "Dogs" (existing DogRoster) and "Compatibility" (new graph view). Local React state controls the active tab — no router needed. App.tsx gains a simple tab switcher wrapping DogRoster and the new CompatibilityGraph component.

### Graph Library
- **D-02:** `react-force-graph` — pre-decided in project context (STATE.md accumulated decisions). TypeScript types flagged as needing npm verification before implementation begins.

### Edge Display
- **D-03:** Only draw edges for explicitly-set compatibility pairs (i.e. entries present in `compatibilityEntries`). Dog pairs with no entry are not connected — those dogs appear as isolated nodes. This keeps the graph clean as the roster grows.
- **D-04:** Edge colours by status: green (compatible), grey (neutral), red (conflict), dashed (unknown). Dashed is only relevant if the user explicitly sets a pair to Unknown status — not for unassessed pairs.

### Edge Click Interaction
- **D-05:** Clicking an edge opens a Sheet/drawer — same pattern as DogPanel. The sheet shows both dog names prominently, the current status, and 4 selectable statuses (Compatible / Neutral / Conflict / Unknown) plus a "Remove" option. "Remove" calls `removeCompatibility` and removes the edge entirely (dog pair returns to unassessed).
- **D-06:** Sheet uses the existing `Sheet` shadcn component. No new UI primitives needed.

### Node Appearance & Interaction
- **D-07:** Nodes display dog name only — no breed, no avatar. Keeps the graph readable.
- **D-08:** Clicking a node opens the DogPanel in edit mode (same component used in the Dogs tab). This reuses the existing DogPanel component and gives the behaviorist a natural way to view/edit dog details from the graph.

### Claude's Discretion
- Tab bar visual design (pill style, underline, etc.) — pick what fits the existing Tailwind/shadcn aesthetic.
- Node size, font size, and force simulation parameters — tune for readability with a typical roster size (5–15 dogs).
- Whether the DogPanel opened from node-click uses a separate Sheet instance or reuses the one from DogRoster.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Vision, constraints, key decisions (TDD, Stitch for UI, react-force-graph decision)
- `.planning/REQUIREMENTS.md` — Phase 3 requirements: COMPAT-02, COMPAT-03

### Existing Types
- `src/types/index.ts` — `CompatibilityStatus`, `CompatibilityEntry`, `AppState` — must not redefine

### Existing Store
- `src/store/compatSlice.ts` — `setCompatibility`, `removeCompatibility` actions already implemented; Phase 3 calls these from the UI
- `src/store/index.ts` — Store wiring pattern

### Existing Components to Reuse
- `src/components/DogPanel.tsx` — Existing slide-in panel; node click should open this in edit mode
- `src/components/ui/sheet.tsx` — Sheet component for the edge-click status picker

### No external specs
No ADRs or external design specs for Phase 3. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/store/compatSlice.ts` — `setCompatibility(idA, idB, status)` and `removeCompatibility(idA, idB)` are ready to call from the graph UI
- `src/components/DogPanel.tsx` — Slide-in panel; can be triggered from node click
- `src/components/ui/sheet.tsx` — Used for both edge-click status picker and (potentially) node-click dog panel
- `src/types/index.ts` — `CompatibilityStatus`, `CompatibilityEntry` types

### Established Patterns
- TypeScript strict mode — all new code must satisfy `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Named exports for all modules
- No semicolons, 2-space indent, single quotes
- TDD with Vitest — tests written before or alongside implementation
- Sheet pattern from DogPanel — reuse for edge-click sheet

### Integration Points
- `src/App.tsx` — Gains a tab switcher; currently only renders `<DogRoster />`
- `react-force-graph` — Not yet installed; npm install + TypeScript type verification required before implementation

</code_context>

<specifics>
## Specific Ideas

- **Node click opens DogPanel:** User explicitly wants clicking a dog node to open its edit panel — same DogPanel used in the Dogs tab. Researcher should check if DogPanel needs a prop change to be driven from outside DogRoster.
- **Remove from sheet:** Edge-click sheet includes a Remove option that calls `removeCompatibility` — dog pair returns to unassessed (no edge drawn). `removeCompatibility` is already implemented in the slice.

</specifics>

---

*Phase: 03-compatibility-graph*
*Context gathered: 2026-03-27*
