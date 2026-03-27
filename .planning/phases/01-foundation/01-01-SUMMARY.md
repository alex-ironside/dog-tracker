---
phase: 01-foundation
plan: 01
subsystem: testing
tags: [zustand, tailwind, shadcn, vitest, typescript, react, localStorage]

# Dependency graph
requires: []
provides:
  - Zustand v5 store with persist middleware, single key 'dogTracker-store', schemaVersion=1
  - Full domain type definitions: Dog, WalkGroup, CompatibilityStatus, CompatibilityEntry, TimeSlot, WalkSession, AppState
  - dogSlice with addDog, updateDog, archiveDog, unarchiveDog actions
  - Schema migration scaffold (CURRENT_SCHEMA_VERSION=1, migrate function)
  - StorageAdapter interface + LocalStorageAdapter with getRawJSON/setRawJSON for future export/import
  - Tailwind v3 + shadcn/ui (slate theme, CSS variables) — button, sheet, alert-dialog, switch, label, input
  - Vitest v2 + jsdom v24 + React Testing Library test harness
  - cn() utility for Tailwind class merging
  - Path alias @/ → src/
affects: [02-dog-roster, all subsequent phases]

# Tech tracking
tech-stack:
  added:
    - zustand@5.0.12 with persist middleware
    - tailwindcss@3.4.19 + postcss + autoprefixer + tailwindcss-animate
    - shadcn@2.3.0 (CLI) — button, sheet, alert-dialog, switch, label, input components
    - vitest@2.1.9 + jsdom@24 + @testing-library/react@16 + @testing-library/user-event@14 + @testing-library/jest-dom@6
    - class-variance-authority + clsx + tailwind-merge + lucide-react
    - @types/node for path.resolve in vite.config.ts
  patterns:
    - Zustand slice pattern: StateCreator<AppStore, [], [], SliceActions> with createDogSlice spread
    - Zustand persist with partialize to exclude action functions from serialized state
    - Non-persisted test store: create() without persist for unit tests (isolates from localStorage)
    - cn() utility pattern for conditional Tailwind class merging

key-files:
  created:
    - src/types/index.ts
    - src/store/index.ts
    - src/store/dogSlice.ts
    - src/store/migrations.ts
    - src/lib/storage.ts
    - src/lib/utils.ts
    - src/test/setup.ts
    - src/store/dogSlice.test.ts
    - src/store/store.test.ts
    - tailwind.config.js
    - postcss.config.js
    - components.json
    - src/components/ui/button.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/alert-dialog.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/label.tsx
    - src/components/ui/input.tsx
    - src/vite-env.d.ts
  modified:
    - vite.config.ts
    - tsconfig.app.json
    - tsconfig.json
    - package.json
    - src/index.css

key-decisions:
  - "Use vitest@2.x not v4 — Vitest v4 requires Node 22+; project runs Node 20.9.0"
  - "Use jsdom@24 not v29 — jsdom@29 uses @exodus/bytes (ESM-only) which breaks CJS require() in jsdom internals on Node 20"
  - "shadcn init bypassed — CLI fails tailwind config validation on ESM projects (package.json type:module); created components.json manually with correct schema"
  - "tsconfig.json root file needs compilerOptions.paths for shadcn CLI alias detection (CLI reads root tsconfig.json, not tsconfig.app.json)"
  - "Use crypto.randomUUID() for Dog IDs — built-in Web Crypto API, no dependency needed"
  - "void version in migrations.ts to satisfy noUnusedParameters strict mode while documenting intent"

patterns-established:
  - "Pattern: Zustand slices use StateCreator<AppStore, [], [], SliceActions> — always spread createXSlice(...a) in combined store"
  - "Pattern: Test stores created with plain create() (no persist) — avoids localStorage coupling in unit tests"
  - "Pattern: partialize in persist config explicitly lists only data fields — action functions never serialized"
  - "Pattern: src/test/setup.ts with afterEach cleanup — prevents RTL DOM accumulation across tests"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04]

# Metrics
duration: 9min
completed: 2026-03-27
---

# Phase 01 Plan 01: Foundation Toolchain Summary

**Zustand v5 store with localStorage persist + schema migration, Tailwind v3 + shadcn/ui slate theme, Vitest v2 test harness with 17 passing tests for Dog CRUD slice**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-03-27T08:22:30Z
- **Completed:** 2026-03-27T08:30:57Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Full toolchain installed: Tailwind v3, shadcn/ui v3 (6 components), Vitest v2, Zustand v5, all testing libraries
- Domain types defined (Dog, WalkGroup, CompatibilityStatus, CompatibilityEntry, TimeSlot, WalkSession, AppState) in a single `src/types/index.ts`
- Zustand store with persist middleware writing to localStorage key 'dogTracker-store' with schemaVersion and migration scaffold
- dogSlice with full CRUD (addDog, updateDog, archiveDog, unarchiveDog) and StorageAdapter interface for future export/import
- 17 unit tests all passing; npm run build exits 0 with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, configure Tailwind v3 + shadcn/ui + Vitest, set up path alias** - `cd71457` (chore)
2. **Task 2: Define domain types, create Zustand store with persist + schema versioning, implement dogSlice, write unit tests** - `8b55092` (feat)

## Files Created/Modified

- `src/types/index.ts` — All domain types: Dog, WalkGroup, CompatibilityStatus, CompatibilityEntry, TimeSlot, WalkSession, AppState
- `src/store/index.ts` — useAppStore with persist middleware, 'dogTracker-store' key, partialize, schema version
- `src/store/dogSlice.ts` — createDogSlice with addDog/updateDog/archiveDog/unarchiveDog
- `src/store/migrations.ts` — CURRENT_SCHEMA_VERSION=1, migrate() scaffold for future schema evolution
- `src/lib/storage.ts` — StorageAdapter interface + LocalStorageAdapter with getRawJSON/setRawJSON
- `src/lib/utils.ts` — cn() utility (clsx + tailwind-merge)
- `src/test/setup.ts` — Vitest setup: @testing-library/jest-dom + afterEach cleanup
- `src/store/dogSlice.test.ts` — 10 tests: addDog (UUID, archived=false, timestamps), updateDog, archiveDog, unarchiveDog, multi-dog, isolation
- `src/store/store.test.ts` — 7 tests: initial state shape, partialize behaviour, migrate function
- `vite.config.ts` — Added path alias @/→src/, vitest jsdom config, setupFiles
- `tsconfig.app.json` — Added baseUrl, paths @/*, vitest/globals types
- `tsconfig.json` — Added compilerOptions.paths for shadcn CLI detection
- `tailwind.config.js` — Tailwind v3 with shadcn slate theme tokens, CSS variable color tokens
- `postcss.config.js` — PostCSS with tailwindcss + autoprefixer
- `components.json` — shadcn@2.3.0 CLI config (manual, bypassed init)
- `src/index.css` — Tailwind directives + shadcn CSS custom properties (slate palette)
- `src/vite-env.d.ts` — Vite client type declarations for CSS imports
- `src/components/ui/{button,sheet,alert-dialog,switch,label,input}.tsx` — shadcn components
- `package.json` — Added test/test:run scripts

## Decisions Made

- Vitest downgraded to v2.x (v4 requires Node 22+; project runs Node 20.9.0)
- jsdom downgraded to v24 (v29 uses ESM-only @exodus/bytes, incompatible with jsdom CJS internals on Node 20)
- shadcn init bypassed in favour of manual components.json (ESM project causes CLI tailwind validation failure)
- tsconfig.json root file updated with compilerOptions.paths (shadcn CLI reads root tsconfig, not tsconfig.app.json)
- crypto.randomUUID() used for Dog IDs (Web Crypto API built-in, no extra dependency)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Downgraded Vitest from v4 to v2 for Node 20 compatibility**
- **Found during:** Task 1 (toolchain verification)
- **Issue:** Vitest v4 requires `node:util` `styleText` export, available only in Node 22+; project runs Node 20.9.0 — startup crash
- **Fix:** `npm install -D vitest@^2.0.0` — installed v2.1.9
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx vitest run` executes and reports "No test files found" (expected pre-tests)
- **Committed in:** cd71457 (Task 1 commit)

**2. [Rule 3 - Blocking] Downgraded jsdom from v29 to v24 for Node 20 compatibility**
- **Found during:** Task 2 (first test run)
- **Issue:** jsdom@29 depends on `@exodus/bytes` (ESM-only package); `html-encoding-sniffer` (jsdom internal) uses `require()` causing ERR_REQUIRE_ESM crash
- **Fix:** `npm install -D jsdom@24`
- **Files modified:** package.json, package-lock.json
- **Verification:** All 17 tests pass
- **Committed in:** 8b55092 (Task 2 commit)

**3. [Rule 3 - Blocking] Bypassed `shadcn init` and created components.json manually**
- **Found during:** Task 1 (shadcn init)
- **Issue:** shadcn@2.3.0 CLI's tailwind config validator fails to load `tailwind.config.js` via `require()` in an ESM project (`package.json` `"type": "module"` makes all .js files ESM)
- **Fix:** Created `components.json` manually with correct shadcn v2 schema; ran `shadcn add` commands directly
- **Files modified:** components.json (new), tailwind.config.js (manually extended with shadcn theme), src/index.css (manually added shadcn CSS custom properties)
- **Verification:** All 6 shadcn components installed; `npm run build` exits 0
- **Committed in:** cd71457 (Task 1 commit)

**4. [Rule 2 - Missing Critical] Added src/vite-env.d.ts for CSS import type declarations**
- **Found during:** Task 2 (TypeScript strict compilation check)
- **Issue:** `tsc --noEmit` failed with `Cannot find module './index.css'` — Vite scaffold is missing its standard `vite-env.d.ts` file that declares `/// <reference types="vite/client" />`
- **Fix:** Created `src/vite-env.d.ts` with the vite/client reference
- **Files modified:** src/vite-env.d.ts (new)
- **Verification:** `tsc -p tsconfig.app.json --noEmit` exits 0
- **Committed in:** 8b55092 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 blocking, 1 blocking + 1 missing critical)
**Impact on plan:** All fixes required for Node 20 compatibility and strict TypeScript compilation. No scope creep.

## Issues Encountered

- shadcn@2.3.0 `init` command incompatible with ESM projects on Windows — resolved by creating components.json manually and using `shadcn add` directly
- Vitest v4 and jsdom v29 both require Node 22+; Node 20.9.0 environment needed specific version pins

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 2 (Dog Roster UI) dependencies are installed: Tailwind, shadcn components (Sheet for slide-in panel, Button, Input, Label, Switch), Zustand store with addDog/updateDog/archiveDog/unarchiveDog actions
- Test harness ready for TDD of all Dog Roster components
- Path alias @/ works for clean imports across all future phases

---
*Phase: 01-foundation*
*Completed: 2026-03-27*
