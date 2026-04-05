# Requirements: Dog Walk Planner

**Defined:** 2026-03-26
**Core Value:** A behaviorist can compose a safe, compatible group of dogs and slot them into a walk in seconds.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: App state (dogs, compatibility, groups, schedule, walk history) persists to LocalStorage on every change
- [x] **FOUND-02**: App restores full state from LocalStorage on page load
- [x] **FOUND-03**: LocalStorage schema is versioned (`schemaVersion`) with a migration function to handle future changes without data loss
- [x] **FOUND-04**: Vitest + React Testing Library harness is configured and all features are developed test-first

### Dog Roster

- [x] **DOGS-01**: Behaviorist can add a dog with name, breed, age, and optional notes
- [x] **DOGS-02**: Behaviorist can edit a dog's profile details
- [x] **DOGS-03**: Behaviorist can archive (soft-delete) a dog — archived dogs are hidden from active views but history is preserved
- [x] **DOGS-04**: Behaviorist can view the full roster of active dogs

### Compatibility Graph

- [x] **COMPAT-01**: Behaviorist can set a compatibility status between any two dogs: Compatible, Neutral, Conflict, or Unknown
- [x] **COMPAT-02**: Compatibility is displayed as an interactive network graph — nodes are dogs, edges are coloured by status (green/grey/red/dashed)
- [x] **COMPAT-03**: Behaviorist can click an edge on the graph to update the compatibility status between those two dogs
- [x] **COMPAT-04**: Unknown compatibility is visually distinct from Neutral — it is not treated as safe

### Group Builder

- [x] **GROUP-01**: Behaviorist can create a named walk group and drag dogs from the roster into it
- [x] **GROUP-02**: Each dog can only appear in one group at a time
- [x] **GROUP-03**: When a dog is dropped into a group, a compatibility badge shows the group's overall compatibility score
- [x] **GROUP-04**: Conflicts within a group are highlighted inline (not just as a summary warning)
- [x] **GROUP-05**: Behaviorist can remove a dog from a group by dragging back or via a remove button

### Compatibility Scoring

- [x] **SCORE-01**: A math function scores a proposed group as a number (0–100) based on all pairwise compatibility statuses
- [x] **SCORE-02**: The scoring function treats Unknown pairs as a penalty (not as Compatible or Neutral)
- [x] **SCORE-03**: The scoring function is a pure module in `src/lib/scoring.ts` with full unit test coverage
- [x] **SCORE-04**: A group auto-suggest function proposes optimal group compositions from available dogs, tested in isolation

### Calendar & Scheduling

- [x] **CAL-01**: Behaviorist can view a weekly calendar grid with hour slots (e.g. 07:00–19:00)
- [x] **CAL-02**: Behaviorist can drag a walk group from the group builder into an hour slot on the calendar
- [x] **CAL-03**: A group can only occupy one slot at a time; the same slot can hold one group
- [x] **CAL-04**: Scheduled slots display the group name and dog count
- [x] **CAL-05**: Behaviorist can remove a group from a slot (unschedule it)
- [x] **CAL-06**: Time slots are stored as logical `{ dayOfWeek, hour, minute }` values — not epoch timestamps — to avoid DST bugs

### Walk History

- [x] **HIST-01**: After a walk, behaviorist can log an outcome: Great / Good / Neutral / Poor / Incident
- [x] **HIST-02**: Behaviorist can add free-text notes to a walk log entry
- [x] **HIST-03**: Each walk log entry records a snapshot of which dogs were present (immutable after save)
- [x] **HIST-04**: Each dog has a history view showing their walk outcomes over time as a chart
- [x] **HIST-05**: Walk history chart uses a dedicated charting library (Recharts) — not custom SVG

## v2 Requirements

### Auto-Suggest

- **SUGG-01**: Behaviorist can request auto-suggested group compositions for a given time slot based on compatibility scores
- **SUGG-02**: Suggestions explain why each group was proposed (compatibility rationale)

### Firebase Migration

- **FIRE-01**: Storage adapter can be swapped from LocalStorage to Firebase without changes to stores or UI
- **FIRE-02**: Data syncs across devices when Firebase is enabled

### Enhanced Compatibility

- **ENH-01**: Compatibility scores support fine-grained numeric ratings (1–10) in addition to enum statuses
- **ENH-02**: Compatibility trends over time are visible on the network graph (improving/degrading relationships)

### Expanded Walk Logging

- **LOG-01**: Walk duration is recorded
- **LOG-02**: Walk logs are exportable as CSV

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication / user accounts | Single-user local tool; no multi-user need in v1 |
| Backend / cloud sync | LocalStorage is sufficient for v1; Firebase deferred to v2 |
| Neural network grouping | Insufficient training data in v1; math function covers the need |
| GPS / route tracking | Out of scope for scheduling tool; adds significant complexity |
| Photo attachments on walk logs | LocalStorage bloat risk; not needed for v1 |
| Mobile app / PWA | Web-first; mobile can follow if there's demand |
| Multi-device sync | Requires backend; deferred with Firebase |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| DOGS-01 | Phase 2 | Complete |
| DOGS-02 | Phase 2 | Complete |
| DOGS-03 | Phase 2 | Complete |
| DOGS-04 | Phase 2 | Complete |
| COMPAT-01 | Phase 3 | Complete |
| COMPAT-02 | Phase 3 | Complete |
| COMPAT-03 | Phase 3 | Complete |
| COMPAT-04 | Phase 3 | Complete |
| SCORE-01 | Phase 3 | Complete |
| SCORE-02 | Phase 3 | Complete |
| SCORE-03 | Phase 3 | Complete |
| SCORE-04 | Phase 3 | Complete |
| GROUP-01 | Phase 4 | Complete |
| GROUP-02 | Phase 4 | Complete |
| GROUP-03 | Phase 4 | Complete |
| GROUP-04 | Phase 4 | Complete |
| GROUP-05 | Phase 4 | Complete |
| CAL-01 | Phase 5 | Complete |
| CAL-02 | Phase 5 | Complete |
| CAL-03 | Phase 5 | Complete |
| CAL-04 | Phase 5 | Complete |
| CAL-05 | Phase 5 | Complete |
| CAL-06 | Phase 5 | Complete |
| HIST-01 | Phase 6 | Complete |
| HIST-02 | Phase 6 | Complete |
| HIST-03 | Phase 6 | Complete |
| HIST-04 | Phase 6 | Complete |
| HIST-05 | Phase 6 | Complete |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
