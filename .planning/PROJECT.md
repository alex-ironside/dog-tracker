# Dog Walk Planner

## What This Is

A scheduling and behavioural management tool for a dog behaviorist running paid social walks. It lets the behaviorist plan groups of compatible dogs across time slots, track walk history and outcomes per dog, and visualise inter-dog compatibility as a network graph. The tool runs entirely in the browser with local storage — no backend or auth required.

## Core Value

A behaviorist can compose a safe, compatible group of dogs and slot them into a walk in seconds.

## Requirements

### Validated

- [x] Dog roster — add, edit, and manage dogs with profile info *(Validated in Phase 01: foundation)*
- [x] LocalStorage persistence — all data saved locally in the browser; no backend or auth *(Validated in Phase 01: foundation)*

### Active
- [ ] Compatibility network graph — visual node graph showing which dogs get along (green edges) or conflict (red edges), editable per pair
- [ ] Group builder — drag and drop dogs into named walk groups; groups are validated against compatibility scores
- [ ] Calendar / time-slot scheduler — drag walk groups into hour slots on a weekly calendar view
- [ ] Group compatibility scoring — math function that scores a proposed group based on pairwise compatibility data
- [ ] Group auto-suggest — algorithm that suggests optimal group compositions from available dogs for a given time slot
- [ ] Walk history per dog — log whether each walk went well or not, with notes; displayed as a graph/chart timeline
### Out of Scope

- Authentication / user accounts — not needed; single-user local tool for now
- Backend / cloud sync — deferred; Firebase migration possible later but not in scope for v1
- Neural network grouping — insufficient data initially; math function is the approach for v1
- Multi-device sync — follows from no backend; local only

## Context

- **Stack**: React 18 + TypeScript SPA, Vite, strict mode (existing repo scaffold)
- **Testing**: TDD with Vitest — tests written before or alongside implementation
- **Design**: Stitch MCP for UI design contracts before implementation
- **Graphs/Charts**: Use a dedicated library (e.g. Recharts, Chart.js, or Nivo) for walk history charts; network graph may use a separate library (e.g. react-force-graph, vis-network, or Cytoscape.js)
- **Time slots**: Approach TBD — likely a custom hour-grid calendar component or a lightweight calendar library
- **User**: A professional dog behaviorist managing multiple client dogs; needs to see compatibility at a glance and build safe groups quickly

## Constraints

- **Tech stack**: React 18 + TypeScript + Vite — existing repo structure
- **Testing**: TDD with Vitest — all features covered with tests
- **Storage**: LocalStorage only for v1 — no network calls, no auth
- **Design**: Stitch MCP — design contracts generated before UI phases execute
- **Compatibility**: Single-user, single-device browser app

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| LocalStorage over Firebase | Fastest path to usable tool; Firebase migration possible later | — Pending |
| Math function over neural network | Not enough data yet to train a model; scoring algorithm is sufficient for v1 | — Pending |
| TDD with Vitest | Behaviorist tool needs reliability; tests prevent regressions as complexity grows | — Pending |
| Stitch for UI design | Ensures consistent, professional UI before coding begins | — Pending |
| Network graph for compatibility | Most intuitive way to see dog relationships at a glance | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 — Phase 01 complete*
