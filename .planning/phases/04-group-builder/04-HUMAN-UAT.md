---
status: partial
phase: 04-group-builder
source: [04-VERIFICATION.md]
started: 2026-03-27T16:51:00Z
updated: 2026-03-27T16:51:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Drag a dog from the roster into a group panel
expected: Dog card appears in the group, roster row greys out with 'in [GroupName]' label
result: [pending]

### 2. Drag a dog from a group panel back onto the roster
expected: Dog is removed from the group and becomes draggable in the roster again
result: [pending]

### 3. Add two conflicting dogs to the same group (compatibility status = 'conflict')
expected: A red SVG line connects the two dog cards inside the group body
result: [pending]

### 4. Click the red conflict line between two dogs
expected: EdgeSheet opens showing both dog names and the current 'conflict' status
result: [pending]

### 5. Add a dog with Unknown compatibility to a group alongside another dog
expected: No red line appears for the unknown-status pair (only the amber warning icon shows)
result: [pending]

### 6. Inline group name editing
expected: Clicking group name turns it into an input; pressing Enter saves; pressing Escape reverts
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
