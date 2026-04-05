---
status: testing
phase: 06-walk-history
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md]
started: 2026-03-28T21:00:00Z
updated: 2026-03-28T21:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: History Tab Visible
expected: |
  Open the app. The bottom/top nav should show 5 tabs: Dogs, Compatibility, Groups, Calendar, History.
  Clicking "History" switches to the walk history view. With no logs recorded, an empty state is shown
  (e.g. "No walks logged yet" heading/body copy).
awaiting: user response

## Tests

### 1. History Tab Visible
expected: Open the app. The bottom/top nav should show 5 tabs: Dogs, Compatibility, Groups, Calendar, History. Clicking "History" switches to the walk history view. With no logs recorded, an empty state is shown (e.g. "No walks logged yet" heading/body copy).
result: [pending]

### 2. Log a Walk Button (History Tab)
expected: On the History tab, there is a "Log a walk" button. Clicking it opens a Sheet (slide-up/side panel) containing a walk log form.
result: [pending]

### 3. WalkLogSheet Form Fields
expected: The WalkLogSheet form contains: a date field (defaults to today), a row of 5 outcome buttons (great / good / neutral / poor / incident) that act as a toggle — clicking one selects it, a scrollable list of all active dogs with checkboxes, and an optional notes textarea. Trying to save without selecting an outcome or at least one dog shows a validation error or prevents submission.
result: [pending]

### 4. Walk Entry Saved and Displayed
expected: Fill in the WalkLogSheet (pick any outcome, check one or more dogs, optionally add notes) and save. The sheet closes. The History tab now shows the entry in reverse-chronological order with a coloured outcome badge, the date, the dog name(s), and any notes preview.
result: [pending]

### 5. Dog Panel Profile / History Tabs
expected: Go to the Dogs tab and click on an existing dog to edit it. The DogPanel should show two tabs: "Profile" and "History". Clicking "History" shows a scatter chart (WalkHistoryChart) of that dog's walk outcomes over time, plus the last 10 walk entries for this dog. If no walks are logged for that dog, the chart shows "No walks logged yet".
result: [pending]

### 6. Log a Walk from Dog Panel
expected: While viewing a dog's History sub-tab in the DogPanel, there is a "Log a walk for [dog name]" button. Clicking it opens the WalkLogSheet with that dog's checkbox pre-ticked. Saving the entry adds it to the list.
result: [pending]

### 7. Log Button on Calendar Card
expected: Go to the Calendar tab. A scheduled group card (ScheduledGroupCard) should have a small "Log" button. Clicking it opens the WalkLogSheet with all the dogs from that group pre-checked.
result: [pending]

### 8. Add Dog Mode has No Tabs
expected: On the Dogs tab, click the button to add a new dog. The DogPanel should show only the add form — no "Profile" / "History" tab bar, since there is no dog yet.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0

## Gaps

[none yet]
