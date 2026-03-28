---
phase: 6
slug: walk-history
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | HIST-01, HIST-02 | unit | `npm run test -- --run src/store/walkHistorySlice.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | HIST-03 | unit | `npm run test -- --run src/store/walkHistorySlice.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | HIST-05 | unit | `npm run test -- --run src/store/migrations.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | HIST-04 | unit | `npm run test -- --run src/components/WalkHistoryChart.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | HIST-01 | unit | `npm run test -- --run src/components/WalkLogSheet.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | HIST-04 | unit | `npm run test -- --run src/components/DogPanel.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/store/walkHistorySlice.test.ts` — stubs for HIST-01, HIST-02, HIST-03
- [ ] `src/store/migrations.test.ts` — stubs for HIST-05 schema migration
- [ ] `src/components/WalkHistoryChart.test.tsx` — stubs for HIST-04 chart rendering
- [ ] `src/components/WalkLogSheet.test.tsx` — stubs for HIST-01 log form
- [ ] `src/components/DogPanel.test.tsx` — stubs for HIST-04 profile tab integration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Log button on CalendarSlot opens sheet with pre-filled dogs | HIST-01 | DnD context / portal rendering | Open Calendar tab, confirm a scheduled slot has Log button; click it and verify dogs pre-populated |
| History tab (5th app tab) visible and navigable | HIST-01 | App navigation | Load app, confirm 5 tabs in header, click History tab |
| Scatter chart renders in DogPanel History tab | HIST-04 | Visual rendering | Open a dog with walk history, confirm chart displays with coloured dots and tooltip on hover |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
