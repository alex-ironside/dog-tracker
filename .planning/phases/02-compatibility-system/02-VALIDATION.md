---
phase: 2
slug: compatibility-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 |
| **Config file** | `vite.config.ts` (inline `test:` block) |
| **Quick run command** | `npm run test:run -- src/store/compatSlice.test.ts src/lib/scoring.test.ts src/lib/groupSuggest.test.ts` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run task-specific test file (see Per-Task map below)
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | COMPAT-01 | unit | `npm run test:run -- src/store/compatSlice.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | COMPAT-01 | unit | `npm run test:run -- src/store/compatSlice.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | COMPAT-04 | unit | `npm run test:run -- src/store/compatSlice.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | SCORE-01, SCORE-02 | unit | `npm run test:run -- src/lib/scoring.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | SCORE-03 | static/unit | TypeScript strict compilation + `npm run lint` | N/A | ⬜ pending |
| 02-02-03 | 02 | 2 | SCORE-01 | unit | `npm run test:run -- src/lib/scoring.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | SCORE-04 | unit | `npm run test:run -- src/lib/groupSuggest.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | SCORE-04 | unit | `npm run test:run -- src/lib/groupSuggest.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/store/compatSlice.test.ts` — stubs for COMPAT-01, COMPAT-04
- [ ] `src/lib/scoring.test.ts` — stubs for SCORE-01, SCORE-02, SCORE-03
- [ ] `src/lib/groupSuggest.test.ts` — stubs for SCORE-04

*No framework config gaps — Vitest is fully configured from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SCORE-03 purity | SCORE-03 | TypeScript convention check | Run `npm run lint` and confirm no store imports in `src/lib/scoring.ts` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
