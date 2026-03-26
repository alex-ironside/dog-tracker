# UI Spec — Phase 1: Foundation (Dog Roster)

**Written:** 2026-03-26
**Phase scope:** Dog Roster only — list, add, edit, archive. No compatibility graph, no group builder, no calendar.
**Requirements covered:** DOGS-01, DOGS-02, DOGS-03, DOGS-04

---

## 1. Design System

### 1.1 Toolchain

| Tool | Version / notes |
|------|-----------------|
| Tailwind CSS | v3 — configured in Phase 1 |
| shadcn/ui | Initialized on top of Tailwind; component source copied into `src/components/ui/` |
| lucide-react | Icon library |

### 1.2 Colour Tokens

**60/30/10 split:**
- 60% dominant surface: `slate-50` (page background) and `white` (card backgrounds) — the primary canvas.
- 30% secondary: `slate-100` (archived card fill), `slate-200` (borders), `slate-500` / `slate-400` (body and meta text) — structural and informational chrome.
- 10% accent: `blue-600` — reserved exclusively for primary CTA buttons ("Add Dog", "Save Dog"). `red-600` / `red-700` is the destructive semantic colour, used only for the Archive confirm action.

| Role | Token | Hex |
|------|-------|-----|
| Page background | `slate-50` | `#f8fafc` |
| Card background | `white` | `#ffffff` |
| Primary CTA (button fill) | `blue-600` | `#2563eb` |
| Primary CTA hover | `blue-700` | `#1d4ed8` |
| Text — primary | `slate-900` | `#0f172a` |
| Text — secondary / meta | `slate-500` | `#64748b` |
| Border | `slate-200` | `#e2e8f0` |
| Archived card background | `slate-100` | `#f1f5f9` |
| Archived card text | `slate-400` | `#94a3b8` |
| Destructive (archive action) | `red-600` | `#dc2626` |
| Destructive hover | `red-700` | `#b91c1c` |

### 1.3 Typography

| Role | Classes |
|------|---------|
| Page title | `text-2xl font-semibold text-slate-900 leading-normal` |
| Card — dog name | `text-base font-semibold text-slate-900 leading-normal` |
| Card — meta line | `text-sm text-slate-500 leading-normal` |
| Panel — section label | `text-sm font-medium text-slate-700 leading-normal` |
| Input label | `text-sm font-medium text-slate-700 leading-normal` |
| Error message | `text-sm text-red-600 leading-normal` |
| Empty state heading | `text-base font-medium text-slate-600 leading-relaxed` |
| Empty state body | `text-sm text-slate-400 leading-relaxed` |

Line-height rule: `leading-relaxed` (1.625) for body and empty-state copy; `leading-normal` (1.5) for labels, meta lines, and UI chrome text.

### 1.4 Spacing & Radius

- Page padding: `px-4 py-6` (mobile) → `px-8 py-8` (md+)
- Card grid gap: `gap-4`
- Card padding: `p-4`
- Card border radius: `rounded-xl` (shadcn default `rounded-lg` acceptable)
- Panel width: `w-full max-w-md` — fixed right-side sheet

### 1.5 Shadows

- Card (resting): `shadow-sm`
- Card (drag-ready hover, Phase 1 uses CSS only): `hover:shadow-md transition-shadow duration-150`
- Panel overlay backdrop: `bg-black/40`

---

## 2. Layout

### 2.1 Page Shell

```
┌─────────────────────────────────────────────────┐
│  Header bar                                      │
│  "Dog Roster"              [Add Dog]  ← PRIMARY FOCAL POINT
├─────────────────────────────────────────────────┤
│  Filter bar (optional toggle)                    │
│  [Show archived] (checkbox or toggle)            │
├─────────────────────────────────────────────────┤
│                                                  │
│  Card grid  (1 col → 2 col md → 3 col lg)        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Dog card │  │ Dog card │  │ Dog card │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Primary focal point:** The "Add Dog" CTA button in the header bar. It is the only blue-600 filled element in the resting state of the page.

Grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### 2.2 Slide-in Panel (Add / Edit)

- Renders as a right-side sheet (shadcn `<Sheet side="right" />`).
- Triggered by "Add Dog" CTA or clicking the edit action on a card.
- Roster stays visible beneath the dimmed backdrop.
- Panel closes via: X button (top-right of panel), clicking the backdrop, or pressing Escape.

---

## 3. Components

### 3.1 Header Bar

```
Dog Roster                              [Add Dog]
```

- `<h1>` with page title left-aligned.
- "Add Dog" — shadcn `<Button variant="default">` (blue-600 fill, white text).
- Icon: `<PlusIcon size={16} />` from lucide-react, leading the label.

### 3.2 Dog Card

```
┌─────────────────────────────────┐
│  ⠿  [drag handle — static Ph1] │  ← cursor-grab visual affordance
│                                 │
│  Rex                            │  ← name, font-semibold
│  Labrador · 3 yrs               │  ← breed · age, text-sm text-slate-500
│                                 │
│  [Notes excerpt if present]     │  ← text-sm text-slate-500, line-clamp-2
│                                 │
│  ─────────────────────────────  │
│  [Edit]           [Archive]     │  ← ghost / destructive buttons
└─────────────────────────────────┘
```

**Drag-handle affordance (Phase 1, static):**
- `<GripVertical size={16} className="text-slate-300 cursor-grab" />` top-left of card.
- No drag behaviour wired — visual only. dnd-kit is Phase 4 scope.

**Card states:**

| State | Visual treatment |
|-------|-----------------|
| Active dog | `bg-white border border-slate-200 shadow-sm` |
| Archived dog | `bg-slate-100 border border-slate-200 opacity-60` |
| Hover (all) | `hover:shadow-md transition-shadow duration-150` |

**Footer actions:**
- Edit: `<Button variant="ghost" size="sm">` with `<PencilIcon size={14} />` + "Edit"
- Archive: `<Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">` with `<ArchiveIcon size={14} />` + "Archive"
- Archived cards swap Archive for Unarchive: `<ArchiveRestoreIcon size={14} />` + "Unarchive"

### 3.3 Empty State

Shown when there are no dogs matching the current filter (active or all).

```
┌─────────────────────────────────────────────────┐
│                                                  │
│            🐾  (optional static icon)            │
│                                                  │
│           No dogs yet                            │
│   Add your first dog to get started.             │
│                                                  │
│              [Add Dog]                           │
│                                                  │
└─────────────────────────────────────────────────┘
```

- Centred vertically and horizontally in the grid area.
- Heading: `text-base font-medium text-slate-600 leading-relaxed`
- Body: `text-sm text-slate-400 leading-relaxed`
- CTA: same "Add Dog" button as the header.

### 3.4 Add / Edit Panel (Sheet)

**Panel header:**
- Title: "Add Dog" (add mode) / "Edit Dog" (edit mode) — `text-lg font-semibold`
- Close button: `<X size={18} />` top-right, `<Button variant="ghost" size="icon" aria-label="Close panel" />`

**Form fields:**

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Name | Text input | Required — "Name is required." | "e.g. Rex" |
| Breed | Text input | Optional | "e.g. Labrador" |
| Age | Number input (integer, min 0) | Optional | "e.g. 3" |
| Notes | Textarea (3 rows) | Optional | "Any notes about this dog…" |

**Field layout:** Vertical stack, `space-y-4`, each field wrapped in a `<div>` with label above input.

**Validation behaviour:**
- Validate on submit attempt (not on blur).
- Inline error appears below the relevant field: `<p className="text-sm text-red-600 mt-1">Name is required.</p>`
- Name field border turns red on error: `border-red-500 focus-visible:ring-red-500`

**Panel footer (sticky):**
```
[Discard]                    [Save Dog]
```
- Discard: `<Button variant="outline">` — closes panel without saving. Label is "Discard" in both add mode and edit mode (discards any unsaved input).
- Save Dog: `<Button variant="default">` (blue-600).
- Footer is sticky at panel bottom: `sticky bottom-0 bg-white border-t border-slate-200 py-4 px-6`

### 3.5 Archive Confirmation Dialog

Triggered when the user clicks "Archive" on a dog card.

Uses shadcn `<AlertDialog />`.

```
Archive Rex?

They'll be hidden from active views but
their history is preserved.

[Keep Dog]          [Archive]
```

- Title: `Archive [Dog name]?` — `text-lg font-semibold`
- Body: "They'll be hidden from active views but their history is preserved."
- Keep Dog: `<AlertDialogCancel />` (outline variant) — dismisses dialog, no action taken.
- Archive confirm: `<AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" />`

### 3.6 Show Archived Toggle

Located in the filter bar below the header.

```
[  ] Show archived dogs
```

- shadcn `<Switch />` with a `<Label>` — "Show archived dogs"
- Default: off (archived dogs hidden)
- When on: archived dogs appear in the grid with the muted visual treatment described in §3.2

---

## 4. Interaction Flows

### 4.1 Add Dog

1. User clicks "Add Dog" in header.
2. Slide-in panel opens from right (Sheet animation).
3. User fills Name (required), optionally Breed, Age, Notes.
4. User clicks "Save Dog".
   - If Name empty: inline error shown, focus returns to Name field, save aborted.
   - If valid: dog added to store, panel closes, new card appears in grid.
5. User may instead click "Discard", press Escape, or click the backdrop to close without saving.

### 4.2 Edit Dog

1. User clicks "Edit" on a dog card.
2. Slide-in panel opens, pre-populated with that dog's current data.
3. User edits fields.
4. User clicks "Save Dog" → same validation as Add; on success, card updates in-place, panel closes.
5. User may instead click "Discard", press Escape, or click the backdrop to close without saving.

### 4.3 Archive Dog

1. User clicks "Archive" on a dog card.
2. Archive confirmation dialog opens.
3. User confirms → dog's `archived` flag set to `true` in store; dog disappears from active view (unless toggle is on).
4. User clicks "Keep Dog" → dialog closes, no change.

### 4.4 Unarchive Dog

1. User enables "Show archived dogs" toggle.
2. Archived cards appear (muted style).
3. User clicks "Unarchive" on an archived card.
4. No confirmation dialog — immediate action. Dog returns to active state.

---

## 5. Responsive Breakpoints

| Breakpoint | Grid columns | Panel behaviour |
|------------|-------------|-----------------|
| `< md` (< 768 px) | 1 | Full-width sheet |
| `md` (768 px+) | 2 | Fixed-width sheet (`max-w-md`) |
| `lg` (1024 px+) | 3 | Fixed-width sheet (`max-w-md`) |

---

## 6. Accessibility

- All interactive elements reachable via keyboard (Tab order).
- Focusable: cards (focus ring on action buttons, not the card container itself).
- `<label htmlFor>` wired to every form input.
- Archive dialog traps focus while open (shadcn AlertDialog handles this).
- Sheet traps focus while open (shadcn Sheet handles this).
- `aria-live="polite"` region for form validation errors.
- Drag handle `<GripVertical />` has `aria-hidden="true"` in Phase 1 (not interactive).
- Panel close button carries `aria-label="Close panel"` (icon-only element).

---

## 7. Copywriting Reference

| Surface | Copy |
|---------|------|
| Primary CTA | Add Dog |
| Empty state heading | No dogs yet |
| Empty state body | Add your first dog to get started. |
| Archive dialog title | Archive [Dog name]? |
| Archive dialog body | They'll be hidden from active views but their history is preserved. |
| Archive dialog cancel | Keep Dog |
| Field error — Name | Name is required. |
| Filter toggle label | Show archived dogs |
| Panel title — add mode | Add Dog |
| Panel title — edit mode | Edit Dog |
| Save button | Save Dog |
| Panel dismiss button | Discard |
| Unarchive action | Unarchive |

---

## 8. Out of Scope for Phase 1

The following are noted here to prevent scope creep; they are captured as future work:

| Item | Phase |
|------|-------|
| Drag-and-drop behaviour on dog cards | Phase 4 |
| Walk history indicators on cards | Phase 6 |
| Friends-of-friends compatibility badge | Phase 3 / backlog |
| JSON export / import UI | Post-Phase 1 |
| Photo attachment on dog profile | Out of scope v1 |

---

*Phase: 01-foundation*
*UI Spec written: 2026-03-26*
*Revised: 2026-03-26 — checker fixes applied*
