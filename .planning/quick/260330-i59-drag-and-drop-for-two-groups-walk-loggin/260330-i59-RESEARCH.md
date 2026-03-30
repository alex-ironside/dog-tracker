# Quick Task 260330-i59 - Research: Drag-and-Drop for Two Groups Walk Logger + Groups Tab

**Researched:** 2026-03-30
**Domain:** @dnd-kit/core v6 drag-and-drop patterns in existing React/TypeScript codebase
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Two separate DnD improvements are requested:

1. **WalkLogSheet Two Groups view** — currently uses click-to-cycle (pool -> A -> B -> pool). No DnD at all. The task asks to add DnD so pool chips and group box slots are drag-and-drop targets, with the entire dog chip draggable (not just an icon).

2. **GroupBuilder RosterRow (Groups tab)** — `RosterRow.tsx` already uses `useDraggable` from dnd-kit, but `{...listeners}` is spread only on the `<GripVertical>` icon element. Moving `{...listeners}` to the outer `<div>` (which already has `ref`, `style`, and `{...attributes}`) makes the whole row draggable.

The existing DnD library is `@dnd-kit/core` ^6.3.1 + `@dnd-kit/utilities` ^3.2.2. No new dependencies are required.

---

## Existing DnD Stack

| Library | Version | Usage in codebase |
|---------|---------|-------------------|
| `@dnd-kit/core` | ^6.3.1 | `DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`, `PointerSensor`, `KeyboardSensor` |
| `@dnd-kit/utilities` | ^3.2.2 | `CSS.Translate.toString()` for drag transform styles |

No sortable (`@dnd-kit/sortable`) is used anywhere. The pattern throughout is plain `useDraggable` + `useDroppable`.

---

## Bug Analysis: Why Group B Cannot Receive Dogs

`WalkLogSheet` does NOT use dnd-kit at all in its Two Groups view. The pool uses `handlePoolDogClick` which cycles `null -> A -> B -> null`. The problem statement says "users cannot add a dog to Group B" — this is because clicking a pool chip assigns it to A on first click; a second click on the same chip assigns it to B. If users don't know to click twice, Group B is never populated. There is no drag path to Group B whatsoever.

The fix replaces the click-cycle with DnD: drag from pool into Group A box or Group B box directly.

---

## Architecture Patterns

### Pattern 1: Whole-div draggable (Groups tab fix)

**File:** `src/components/RosterRow.tsx`

**Current code (lines 34-43):**
```tsx
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  className='...'
>
  <GripVertical size={16} className='text-slate-300' {...listeners} />
  <span ...>{dog.name}</span>
</div>
```

**Fix:** Move `{...listeners}` from `<GripVertical>` to the outer `<div>`. The outer div already has `ref`, `style`, `attributes` — it just needs `listeners` too.

```tsx
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}          // moved here
  className='...'
>
  <GripVertical size={16} className='text-slate-300' />   {/* no listeners */}
  <span ...>{dog.name}</span>
</div>
```

This is the canonical dnd-kit pattern: `setNodeRef`, `attributes`, `listeners`, and `style` all on the same element.

### Pattern 2: DnD in WalkLogSheet Two Groups view

`WalkLogSheet` lives inside a Radix `<Sheet>` (a portal/dialog). dnd-kit works fine inside portals — `DndContext` just needs to wrap the draggable + droppable elements. Place `DndContext` inside the Two Groups branch (or around the entire sheet body).

**Draggable items:** Pool dog chips — each `useDraggable({ id: dog.id })`. The entire `<button>` / chip becomes the drag handle by spreading `listeners` + `attributes` on it (not a nested icon).

**Droppable targets:** Group A box and Group B box — each `useDroppable({ id: 'group-a' })` / `useDroppable({ id: 'group-b' })`. The pool container can also be a droppable (`id: 'pool'`) so assigned dogs can be dragged back.

**onDragEnd logic:**
```
draggedDogId = event.active.id
overId = event.over?.id

if overId === 'group-a'  -> setGroupAssignments(prev => ({...prev, [dogId]: 'A'}))
if overId === 'group-b'  -> setGroupAssignments(prev => ({...prev, [dogId]: 'B'}))
if overId === 'pool'     -> remove dogId from groupAssignments (back to unassigned)
```

Assigned dogs in the group boxes (currently rendered as `<button>` chips with X to remove) also need to be draggable so the user can drag them between groups or back to the pool. Each group-box chip gets `useDraggable({ id: dog.id })` as well.

**DragOverlay:** Show a floating chip with the dog name during drag. Use the same `activeDragId` state pattern already used in `GroupBuilder.tsx`.

**Sensors:** Use the same sensor config as `GroupBuilder`:
```ts
useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor)
)
```
The `distance: 8` activation constraint prevents accidental drags on chip clicks.

---

## Component Scope

| Component | Change | Scope |
|-----------|--------|-------|
| `src/components/RosterRow.tsx` | Move `{...listeners}` from `<GripVertical>` to outer `<div>` | 1 line change |
| `src/components/WalkLogSheet.tsx` | Add `DndContext` + `useDraggable` on pool/group chips + `useDroppable` on group boxes + `onDragEnd` handler | Moderate — replaces click-cycle UX in groups branch |

`MiniDogCard` is used only in `GroupPanel` (Groups tab), not in `WalkLogSheet`. No changes needed there.

---

## Common Pitfalls

### Pitfall 1: `listeners` on child instead of drag root
**What goes wrong:** Only the icon/grip becomes draggable; clicking anywhere else on the card starts nothing.
**Fix:** `{...listeners}` goes on the same element as `ref={setNodeRef}`.

### Pitfall 2: dnd-kit inside Radix Sheet portal
**What goes wrong:** Events can be swallowed by Radix focus trap, or `DndContext` is outside the portal so events don't reach it.
**How to avoid:** Place `DndContext` INSIDE the sheet body JSX (inside `<SheetContent>`), wrapping only the Two Groups section. This is fine — dnd-kit doesn't need to be at the document root.

### Pitfall 3: Click-vs-drag conflict on chips
**What goes wrong:** `onClick` fires on drag end in addition to pointer events, toggling assignment unexpectedly.
**How to avoid:** Remove `onClick` from pool/group chips when switching to DnD. The `handlePoolDogClick` click-cycle handler should be removed from pool chips; only `onDragEnd` drives assignment. The remove-from-group X button (separate small button element) can keep its `onClick` for quick removal without dragging.

### Pitfall 4: `activationConstraint: { distance: 8 }` missing
**What goes wrong:** Any pointer-down immediately starts a drag, making it impossible to scroll inside the sheet on mobile/touch.
**Fix:** Always include `activationConstraint: { distance: 8 }` on PointerSensor (matches GroupBuilder pattern).

### Pitfall 5: Missing `isOver` visual feedback on drop zones
**What goes wrong:** User can't tell where the drag will land.
**Fix:** Use `isOver` from `useDroppable` to apply a highlight ring (`ring-2 ring-blue-400` for Group A, `ring-2 ring-amber-400` for Group B) — same pattern as `GroupPanel` and `RosterPanel`.

---

## Don't Hand-Roll

| Problem | Use Instead |
|---------|-------------|
| Drag ghost / overlay | `DragOverlay` from `@dnd-kit/core` (already in GroupBuilder) |
| Transform CSS during drag | `CSS.Translate.toString(transform)` from `@dnd-kit/utilities` |
| Touch/pointer sensor | `PointerSensor` from `@dnd-kit/core` |

---

## Sources

- Direct inspection of `src/components/RosterRow.tsx`, `GroupPanel.tsx`, `GroupBuilder.tsx`, `WalkLogSheet.tsx`, `MiniDogCard.tsx`
- `package.json` — confirmed `@dnd-kit/core` ^6.3.1, `@dnd-kit/utilities` ^3.2.2
- All findings are HIGH confidence (codebase inspection, no external lookup needed)
