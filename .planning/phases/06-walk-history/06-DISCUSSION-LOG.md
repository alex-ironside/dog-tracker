# Phase 6: Walk History — Discussion Log

**Session:** 2026-03-28
**Mode:** Interactive discuss-phase

---

## Gray Areas Selected

All four areas selected for discussion:
1. Logging entry point
2. Log-to-group linkage
3. Dog profile evolution
4. Chart encoding

---

## Area 1: Logging Entry Point

**Q: Where does the behaviorist trigger 'log this walk's outcome'?**
Options presented: Calendar slot, Dogs tab per-dog, New History tab
**A:** Multiple entry points — dog, history, and calendar tabs

**Q: For the Calendar entry point — button on scheduled slot card?**
**A:** Yes — button on slot card. Dogs auto-snapshotted from group.

**Q: What lives in the History tab?**
**A:** Log form + entries list (the History tab has both a 'Log a walk' button and a past entries list)

**Q: For the Dogs tab entry point — what triggers logging from there?**
**A:** Log button inside DogPanel (profile sheet) — that dog pre-filled, select other dogs present

---

## Area 2: Log-to-Group Linkage

**Q: Is a walk log entry formally linked to a WalkSession, or standalone?**
**A:** Standalone — optional group reference. `WalkLogEntry` is self-contained; `groupId` stored as metadata only when logged from calendar.

**Q: When logging from a calendar slot, are dogs auto-populated from the group?**
**A:** Yes — auto-populated from group, behaviorist can remove absent dogs before saving.

**Q: When logging manually, how does the behaviorist specify the date?**
**A:** Date picker defaulting to today — supports backdating for retrospective logging.

---

## Area 3: Dog Profile Evolution

**Q: How does the DogPanel evolve to show walk history?**
**A:** Tabs inside DogPanel — "Profile" tab (existing edit form) and "History" tab (chart + log button). Selected mockup:
```
DogPanel sheet
┌───────────────────┐
│ Buddy           [X]│
│ [Profile][History] │
├───────────────────┤
│  Walk outcomes     │
│  [Recharts chart]  │
│  Great ■■■■■■    │
│  Neutral ■■        │
│  ...               │
└───────────────────┘
```

**Q: Where does the 'Log a walk for [dog]' button live?**
**A:** In the History tab — the Profile tab remains a pure edit form.

---

## Area 4: Chart Encoding

**Q: What chart type for the walk outcome timeline?**
**A:** Scatter/dot plot with date x-axis. Colour-coded by outcome. Selected mockup:
```
Outcome
  Great  •       •  •
  Good      •  •
  Neutral
  Poor         •
  Incident
         Jan   Feb  Mar
```

**Q: Show all entries or cap at a recent window?**
**A:** All entries — no cap, Recharts scales accordingly.

**Q: Tooltip on hover?**
**A:** Yes — tooltip shows date, outcome label, and truncated notes.

---

*Discussion complete. CONTEXT.md written.*
