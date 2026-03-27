---
phase: 3
slug: compatibility-graph
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 + React Testing Library 16.3.2 |
| **Config file** | `vite.config.ts` (`test.environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`) |
| **Quick run command** | `npm run test -- --run src/components/CompatibilityGraph.test.tsx src/components/EdgeSheet.test.tsx src/components/CompatBadge.test.tsx` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run src/components/CompatibilityGraph.test.tsx src/components/EdgeSheet.test.tsx src/components/CompatBadge.test.tsx`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | COMPAT-02 | unit | `npm run test -- --run src/components/CompatibilityGraph.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 03-01-02 | 01 | 0 | COMPAT-02 | unit | `npm run test -- --run src/components/CompatBadge.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 03-01-03 | 01 | 0 | COMPAT-03 | unit | `npm run test -- --run src/components/EdgeSheet.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 03-01-04 | 01 | 1 | COMPAT-02 | unit | `npm run test -- --run src/components/CompatibilityGraph.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 03-02-01 | 02 | 2 | COMPAT-03 | unit | `npm run test -- --run src/components/EdgeSheet.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 03-02-02 | 02 | 2 | COMPAT-03 | unit | `npm run test -- --run src/components/CompatibilityGraph.test.tsx` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/CompatibilityGraph.test.tsx` — stubs for COMPAT-02 (graph data, node/edge rendering), COMPAT-03 (edge click opens EdgeSheet)
- [ ] `src/components/EdgeSheet.test.tsx` — stubs for COMPAT-03 (status picker, set compatibility, remove, discard)
- [ ] `src/components/CompatBadge.test.tsx` — stubs for COMPAT-02 (colour class per status)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Graph layout is stable (no thrash) | COMPAT-02 | Visual/temporal — requires watching the canvas stabilise over time | Open app, navigate to Compatibility tab, wait 3 seconds; nodes should settle and stop moving |
| Edge colours render correctly (green/grey/red/dashed) | COMPAT-02 | Canvas rendering — jsdom cannot validate canvas pixel output | Open app with seed data, verify edge colours match status in Compatibility tab |
| ForceGraph2D container fills viewport correctly | COMPAT-02 | Layout sizing — zero-height canvas cannot be detected by RTL | Open app in dev, inspect canvas element; should fill tab content area without 0px height |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
