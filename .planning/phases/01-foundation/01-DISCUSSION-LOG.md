# Phase 1: Foundation - Discussion Log

**Session:** 2026-03-26
**Mode:** Interactive (discuss)

---

## Gray Areas Selected

User selected all three presented areas: CSS / Styling strategy, LocalStorage structure, Dog Roster UI layout.

---

## Area 1: CSS / Styling Strategy

**Q:** Which CSS approach should this project use?

| Option | Description |
|--------|-------------|
| Tailwind CSS | Utility classes, fast to write, consistent design system |
| CSS Modules | Scoped CSS per component |
| Plain CSS (continue) | Extend existing src/index.css |

**Selected:** Tailwind CSS (Recommended)

---

## Area 2: LocalStorage Structure

**Q:** How should Zustand persist state to LocalStorage?

| Option | Description |
|--------|-------------|
| Single key | All state in one JSON blob under one key |
| Per-domain keys | Each slice under its own key |

**Selected:** Single key

**User note:** "The json should also be exportable and importable as json"

**Disposition:** Export/import UI flagged as deferred (not in Phase 1 requirements). LocalStorageAdapter interface design noted to facilitate this.

---

## Area 3: Dog Roster UI Layout

**Q1:** How should the Dog Roster look?

| Option | Description |
|--------|-------------|
| Table / list rows | Dense, scannable, one dog per row |
| Card grid | Visual cards per dog |

**Selected:** Card grid

**User note:** "cards that will be draggable. They should stack and we need a way to point out if these dogs were on a walk together before and the interactions were positive or negative. We also need to inform about potential 'friends of friends'"

**Disposition:**
- Draggable cards → Phase 4 scope; Phase 1 cards designed drag-ready
- Walk history on cards → deferred to Phase 6
- Friends-of-friends inference → deferred to backlog (new capability)

**Q2:** How should adding/editing a dog work?

| Option | Description |
|--------|-------------|
| Inline / slide-in panel | Panel from right, no navigation |
| Modal dialog | Overlay modal |
| Inline expand | Row expands in-place |

**Selected:** Inline / slide-in panel (Recommended)

**Q3 (follow-up):** When you said cards should "stack" — what layout?

| Option | Description |
|--------|-------------|
| Responsive grid | Multi-column, adapts to width |
| Single column | Vertical stack |

**Selected:** Responsive grid (Recommended)

---

## Completion

User confirmed ready for context after all three areas discussed.
