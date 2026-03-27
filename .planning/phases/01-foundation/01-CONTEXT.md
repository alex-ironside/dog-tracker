# Phase 1: Foundation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the foundational layer everything else builds on: domain type definitions, Zustand store with LocalStorage persistence, schema versioning with migration scaffold, Vitest + React Testing Library harness, and the Dog Roster UI (list, add, edit, archive). No compatibility data, no graph, no drag-and-drop groups yet.

</domain>

<decisions>
## Implementation Decisions

### Styling
- **D-01:** Use Tailwind CSS — install and configure in Phase 1. This is the project-wide CSS convention; all subsequent phases use Tailwind utility classes. Replace the existing `src/index.css` plain CSS approach.

### LocalStorage / Persistence
- **D-02:** Single JSON blob under one Zustand persist key (e.g. `dogTracker-store`). One `schemaVersion` field at the top level governs the entire state tree. Simpler migration path — one migration function, one key to manage.
- **D-03:** Export/import of the full state as JSON is a desired future capability but out of Phase 1 scope. Design the `LocalStorageAdapter` interface with this in mind (i.e. expose a method to get/set the raw JSON string), but don't build the UI for it yet.

### Dog Roster UI
- **D-04:** Card grid layout — responsive multi-column grid (2–3 columns on wide screen, 1 column when narrow). Each card shows name, breed, age, and status.
- **D-05:** Cards should be styled to be drag-ready — they will become draggable in Phase 4 (Group Builder). Phase 1 renders them as static cards but the visual design should anticipate drag handles or card affordances.
- **D-06:** Add/edit opens in a slide-in panel from the right — no full-page navigation. Keeps the roster visible as context.
- **D-07:** Archived dogs are visually distinct on the card (muted/greyed out) and filtered out of the active view by default. A toggle to show archived dogs may be added at Claude's discretion.

### Claude's Discretion
- Tailwind config details (dark mode, colour palette, custom tokens) — use sensible defaults; no specific palette specified.
- ESLint flat config (`eslint.config.js`) is missing from the scaffold — create it as part of Phase 1 setup.
- Path alias (`@/` → `src/`) — may be added at Claude's discretion when setting up Vite/TS config.
- Type file organisation (`src/types/index.ts` vs. domain-split files) — Claude decides based on what's cleanest for a 6-phase project.
- Archived dog toggle (show/hide) — implement if it fits cleanly within the UI.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Vision, constraints, key decisions (LocalStorage v1, TDD, StorageAdapter interface)
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: FOUND-01–04, DOGS-01–04

### No external specs
Phase 1 has no ADRs or external design specs. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/App.tsx` — root component; Phase 1 wires the Dog Roster into it
- `src/index.css` — global CSS; will be replaced/extended with Tailwind base styles

### Established Patterns
- TypeScript strict mode fully enabled — all code must satisfy `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Function declarations for top-level components (not `const` arrow functions) — see `App.tsx`
- No semicolons, 2-space indent, single quotes — observed in scaffold code
- No JSX React import needed (`"jsx": "react-jsx"` automatic runtime)

### Integration Points
- `src/main.tsx` → mounts `<App />` — Phase 1 wires Dog Roster into App
- No existing components, hooks, stores, or utilities — Phase 1 creates the project structure from scratch

</code_context>

<specifics>
## Specific Ideas

- **Card drag-readiness**: The user mentioned cards "will be draggable" — design Phase 1 dog cards with the Phase 4 drag-and-drop use case in mind (visual affordances, consistent sizing). dnd-kit installation is Phase 4 scope, not Phase 1.
- **Walk history on cards**: User wants future indication of positive/negative past walk interactions on dog cards — deferred to Phase 6 (walk history).
- **Friends-of-friends inference**: User wants algorithmic suggestion of potential compatibility based on transitive relationships (if A↔B, B↔D then A might like D) — not in current requirements, captured as backlog idea.

</specifics>

<deferred>
## Deferred Ideas

- **JSON export/import UI** — User wants to export/import full app state as a JSON file. Not in Phase 1 requirements. The `LocalStorageAdapter` interface should make this easy to add later. Candidate for Phase 2 or a standalone utility phase.
- **Walk history indicators on dog cards** — Show positive/negative walk interaction history on cards in the roster. This requires walk history data (Phase 6 scope) — defer to Phase 6 or a Phase 6 enhancement.
- **Friends-of-friends compatibility inference** — Transitive compatibility suggestions (A likes B and C, B and C like D → suggest A may like D). New algorithmic capability, not in current requirements. Add to roadmap backlog.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-26*
