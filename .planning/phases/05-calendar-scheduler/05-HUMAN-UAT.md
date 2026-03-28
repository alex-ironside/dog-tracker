---
status: partial
phase: 05-calendar-scheduler
source: [05-VERIFICATION.md]
started: 2026-03-28T17:49:00Z
updated: 2026-03-28T17:49:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Visual layout — split panel, sticky headers

expected: Sidebar is 280px wide on the left; day headers and time label column stay fixed while grid content scrolls underneath.
result: [pending]

### 2. Drag-and-drop feel — pointer drag

expected: Group appears in the dropped slot; moves on rescheduling; returns to sidebar on drag-back. DragOverlay shows the card during drag with opacity-70.
result: [pending]

### 3. Conflict warning icon visibility

expected: A small amber triangle icon appears after the dog count on the scheduled card when two dogs in a group have a Conflict compatibility entry.
result: [pending]

### 4. Week navigation date accuracy

expected: Week label advances one net week after clicking Next twice and Previous once. Day column headers show correct dates for that week.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
