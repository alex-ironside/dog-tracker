---
phase: 4
slug: group-builder
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 + React Testing Library 16.3.2 |
| **Config file** | `vite.config.ts` (test section) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | GROUP-01 | unit (slice) | `npx vitest run src/store/groupSlice.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | GROUP-02 | unit (slice) | `npx vitest run src/store/groupSlice.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 0 | GROUP-05 | unit (slice) | `npx vitest run src/store/groupSlice.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-04 | 01 | 1 | GROUP-01 | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | ❌ W0 | ⬜ pending |
| 4-01-05 | 01 | 1 | GROUP-02 | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | ❌ W0 | ⬜ pending |
| 4-01-06 | 01 | 1 | GROUP-05 | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | GROUP-03 | unit (component) | `npx vitest run src/components/GroupBuilder.test.tsx` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | GROUP-04 | unit (component) | `npx vitest run src/components/GroupPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 4-02-03 | 02 | 2 | GROUP-04 | unit (component) | `npx vitest run src/components/GroupPanel.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/store/groupSlice.test.ts` — stubs for GROUP-01, GROUP-02, GROUP-05 slice actions
- [ ] `src/components/GroupBuilder.test.tsx` — stubs for GROUP-01, GROUP-02, GROUP-03, GROUP-05 (drag state via mocked onDragEnd)
- [ ] `src/components/GroupPanel.test.tsx` — stubs for GROUP-04 conflict line rendering (mocks `getBoundingClientRect`)

*No new test framework needed — existing Vitest infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag handle visual affordance | GROUP-01 | CSS pointer/cursor styling, not assertable via RTL | Load app, confirm GripVertical cursor appears on hover over roster rows |
| SVG conflict lines positioned correctly | GROUP-04 | `getBoundingClientRect` returns 0 in jsdom; line coordinates are runtime layout | Load app with two conflicting dogs in a group, confirm red lines connect their cards |
| Conflict line click opens EdgeSheet | GROUP-04 | SVG click target area is layout-dependent | Click a red conflict line, confirm EdgeSheet opens with correct dog names |
| Inline group name editing | GROUP-01 | Focus/blur cycle requires live browser | Click group name, confirm it becomes editable input |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
