# Phase 1: Foundation - Research

**Researched:** 2026-03-26
**Domain:** Zustand v5 + persist middleware, Vitest v4 + RTL, Tailwind CSS v3 + shadcn/ui, TypeScript domain modelling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use Tailwind CSS — install and configure in Phase 1. This is the project-wide CSS convention; all subsequent phases use Tailwind utility classes. Replace the existing `src/index.css` plain CSS approach.
- **D-02:** Single JSON blob under one Zustand persist key (e.g. `dogTracker-store`). One `schemaVersion` field at the top level governs the entire state tree. Simpler migration path — one migration function, one key to manage.
- **D-03:** Export/import of the full state as JSON is a desired future capability but out of Phase 1 scope. Design the `LocalStorageAdapter` interface with this in mind (i.e. expose a method to get/set the raw JSON string), but don't build the UI for it yet.
- **D-04:** Card grid layout — responsive multi-column grid (2–3 columns on wide screen, 1 column when narrow). Each card shows name, breed, age, and status.
- **D-05:** Cards should be styled to be drag-ready — they will become draggable in Phase 4 (Group Builder). Phase 1 renders them as static cards but the visual design should anticipate drag handles or card affordances.
- **D-06:** Add/edit opens in a slide-in panel from the right — no full-page navigation. Keeps the roster visible as context.
- **D-07:** Archived dogs are visually distinct on the card (muted/greyed out) and filtered out of the active view by default. A toggle to show archived dogs may be added at Claude's discretion.

### Claude's Discretion

- Tailwind config details (dark mode, colour palette, custom tokens) — use sensible defaults; no specific palette specified.
- ESLint flat config (`eslint.config.js`) is missing from the scaffold — create it as part of Phase 1 setup.
- Path alias (`@/` → `src/`) — may be added at Claude's discretion when setting up Vite/TS config.
- Type file organisation (`src/types/index.ts` vs. domain-split files) — Claude decides based on what's cleanest for a 6-phase project.
- Archived dog toggle (show/hide) — implement if it fits cleanly within the UI.

### Deferred Ideas (OUT OF SCOPE)

- JSON export/import UI — User wants to export/import full app state as a JSON file. Not in Phase 1 requirements. The `LocalStorageAdapter` interface should make this easy to add later. Candidate for Phase 2 or a standalone utility phase.
- Walk history indicators on dog cards — Show positive/negative walk interaction history on cards in the roster. This requires walk history data (Phase 6 scope) — defer to Phase 6 or a Phase 6 enhancement.
- Friends-of-friends compatibility inference — Transitive compatibility suggestions. New algorithmic capability, not in current requirements. Add to roadmap backlog.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | App state persists to LocalStorage on every change | Zustand `persist` middleware with `localStorage` storage handles this automatically via subscriptions |
| FOUND-02 | App restores full state from LocalStorage on page load | `persist` middleware rehydrates on store creation — automatic |
| FOUND-03 | LocalStorage schema is versioned (`schemaVersion`) with a migration function | `persist` options: `version` (integer) + `migrate(persistedState, version)` function pattern |
| FOUND-04 | Vitest + React Testing Library harness is configured; features developed test-first | Vitest v4 + jsdom + `@testing-library/react` v16 + `@testing-library/jest-dom` v6 |
| DOGS-01 | Behaviorist can add a dog with name, breed, age, and optional notes | `Dog` type + `addDog` action on store + slide-in Sheet form with `shadcn/ui` |
| DOGS-02 | Behaviorist can edit a dog's profile details | `updateDog` action + same Sheet form pre-populated |
| DOGS-03 | Behaviorist can archive (soft-delete) a dog — archived dogs are hidden but history preserved | `archived: boolean` field on `Dog` + `archiveDog`/`unarchiveDog` actions + filter in view |
| DOGS-04 | Behaviorist can view the full roster of active dogs | Filtered grid reading from store with `dog.archived === false` |
</phase_requirements>

---

## Summary

Phase 1 is the foundational layer: TypeScript domain types, a Zustand v5 store with persist middleware providing LocalStorage persistence and schema versioning, and the Dog Roster UI built with Tailwind CSS v3 + shadcn/ui components. The project is a bare Vite + React 18 scaffold with no testing framework, no UI library, and no state management installed yet.

The primary technical risks are: (1) the shadcn/ui CLI now defaults to Tailwind v4 — the project's locked decision is Tailwind v3, so the install must use `shadcn@2.3.0` specifically; (2) Zustand v5 uses a double-parentheses `create<T>()()` TypeScript pattern and the `StateCreator` type annotation for slices is slightly different from v4; (3) Vitest v4 requires Node 20+ (the environment runs Node v20.9.0 — just meets the minimum).

The UI-SPEC (01-UI-SPEC.md) is the authoritative design contract for the Dog Roster. All component decisions, colour tokens, copy, and interaction flows are already locked there. Research does not revisit those decisions — it focuses on the implementation patterns that make them executable.

**Primary recommendation:** Install Tailwind v3 + `shadcn@2.3.0` (not `shadcn@latest`), configure Vitest in `vite.config.ts` (not a separate config file), and implement the Zustand store as a single combined store with a `dogSlice` — apply `persist` to the combined store, not to individual slices.

---

## Project Constraints (from CLAUDE.md)

| Directive | Constraint |
|-----------|------------|
| TypeScript strict mode | `strict: true`, `noUnusedLocals`, `noUnusedParameters` fully enabled — every type must be declared, no implicit any, no unused imports |
| JSX runtime | `"jsx": "react-jsx"` — no `import React` needed in component files |
| Code style | No semicolons, 2-space indent, single quotes — match existing `App.tsx` |
| Function components | Top-level components use `function` declarations, not `const` arrow functions |
| No test framework yet | Phase 1 installs Vitest — `npm run test` must be added to `package.json` as part of setup |

---

## Standard Stack

### Core

| Library | Version (verified) | Purpose | Why Standard |
|---------|--------------------|---------|--------------|
| zustand | 5.0.12 (latest) | State management + LocalStorage persistence | Official `persist` middleware; minimal boilerplate; TypeScript-native |
| tailwindcss | 3.x (pinned to v3) | Utility-first CSS | Locked decision D-01; v3 compatible with `shadcn@2.3.0` |
| shadcn/ui | CLI `shadcn@2.3.0` | Copy-in component library (Button, Sheet, AlertDialog, Switch, Label) | Locked in UI-SPEC; components live in `src/components/ui/` |
| lucide-react | 0.475+ | Icon library | Used by shadcn/ui; already part of shadcn vite-template-v3 |
| vitest | 4.1.2 (latest) | Unit and integration test runner | TDD requirement FOUND-04; tight Vite integration — no separate bundler config |
| @testing-library/react | 16.3.2 (latest) | React component testing | Standard for RTL; works with Vitest/jsdom |
| @testing-library/user-event | 14.6.1 (latest) | Realistic user interaction simulation | Required for form interaction tests |
| @testing-library/jest-dom | 6.9.1 (latest) | DOM assertion matchers | Provides `toBeInTheDocument()`, `toHaveValue()`, etc. |
| jsdom | 29.0.1 (latest) | Browser environment emulation in Node | Vitest `environment: 'jsdom'` depends on this |

### Supporting

| Library | Version (verified) | Purpose | When to Use |
|---------|----------|---------|-------------|
| class-variance-authority | 0.7.1 | Variant-driven component classes | shadcn/ui dependency; used inside ui/ components |
| clsx | 2.1.1 | Conditional class merging | shadcn/ui dependency; use in any component needing conditional classes |
| tailwind-merge | 3.5.0 | Merge conflicting Tailwind classes | shadcn/ui dependency; used inside `cn()` utility |
| tailwindcss-animate | 1.0.7 | CSS animation utilities | shadcn/ui Sheet slide-in animation |
| autoprefixer | 10.4.27 | Vendor prefix PostCSS plugin | Required by Tailwind v3 PostCSS setup |
| postcss | 8.5.8 | CSS transformation pipeline | Required by Tailwind v3 |
| @types/node | 22.x | Node type definitions | Required for `path.resolve()` in `vite.config.ts` |
| nanoid | 5.1.7 | Collision-resistant ID generation | Generate `id` fields on `Dog` and other domain records |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn@2.3.0 (Tailwind v3) | shadcn@latest + Tailwind v4 | v4 is the future default, but the UI-SPEC is locked to v3 colour tokens (HSL-based). v4 uses OKLCH. Upgrading would require reworking the entire design system — out of Phase 1 scope. |
| nanoid | `crypto.randomUUID()` | `crypto.randomUUID()` is built-in (Web Crypto API, available in all modern browsers) and requires no dependency. Either works; nanoid is marginally more ergonomic. Recommend `crypto.randomUUID()` to avoid adding a dependency. |
| jsdom | happy-dom | Both supported by Vitest; jsdom is more complete, battle-tested, and what shadcn docs reference |
| Separate `vitest.config.ts` | `vite.config.ts` `test:` block | Vitest recommends keeping config in vite.config.ts when sharing the same Vite setup — avoids duplicated plugin config |

**Installation (Tailwind v3 + shadcn v3 path):**

```bash
# 1. State management
npm install zustand

# 2. Tailwind v3 + PostCSS
npm install -D tailwindcss@3 postcss autoprefixer tailwindcss-animate

# 3. Vitest + testing libraries
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom

# 4. shadcn/ui dependencies (installed by shadcn init, but listed for clarity)
npm install class-variance-authority clsx tailwind-merge lucide-react

# 5. Path alias support
npm install -D @types/node

# 6. Initialize shadcn with v3 CLI
npx shadcn@2.3.0 init

# 7. Add required shadcn components
npx shadcn@2.3.0 add button sheet alert-dialog switch label
```

**Version verification (npm view output, 2026-03-26):**
- zustand: 5.0.12
- vitest: 4.1.2
- @testing-library/react: 16.3.2
- @testing-library/user-event: 14.6.1
- @testing-library/jest-dom: 6.9.1
- tailwindcss: 4.2.2 latest BUT v3 pinned to major `3` → install with `tailwindcss@3`
- shadcn (CLI): 4.1.0 (latest = v4 CLI = Tailwind v4) → must use `shadcn@2.3.0` for Tailwind v3 projects

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── types/
│   └── index.ts            # All domain types: Dog, WalkGroup, WalkSession, etc.
├── store/
│   ├── index.ts            # Combined store: create() + persist middleware
│   ├── dogSlice.ts         # Dog CRUD + archive actions (StateCreator<AppState>)
│   └── migrations.ts       # Schema migration functions keyed by version number
├── lib/
│   ├── storage.ts          # LocalStorageAdapter — thin wrapper around window.localStorage
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
├── components/
│   ├── ui/                 # shadcn/ui source components (Button, Sheet, AlertDialog, etc.)
│   ├── DogCard.tsx         # Individual dog card with drag affordance
│   ├── DogGrid.tsx         # Responsive grid of DogCard items + empty state
│   ├── DogPanel.tsx        # Slide-in Sheet with add/edit form
│   └── DogRoster.tsx       # Page shell: header bar, filter bar, DogGrid
├── App.tsx                 # Mounts <DogRoster />
├── main.tsx                # ReactDOM.createRoot
├── index.css               # Tailwind directives + shadcn CSS custom properties
└── test/
    ├── setup.ts            # @testing-library/jest-dom import + cleanup
    └── (co-located tests)  # *.test.tsx alongside components, or tests/ dir
```

One `src/types/index.ts` file for all domain types is the right choice for a 6-phase project at this size. Domain-split files add navigation overhead without benefit until the type count grows significantly.

### Pattern 1: Domain Types

```typescript
// src/types/index.ts
// Source: locked decisions in CONTEXT.md + requirements in REQUIREMENTS.md

export type Dog = {
  id: string                 // crypto.randomUUID()
  name: string               // required
  breed: string              // optional — empty string if not provided
  age: number | null         // optional integer
  notes: string              // optional — empty string if not provided
  archived: boolean          // soft-delete flag
  createdAt: string          // ISO 8601 string
  updatedAt: string          // ISO 8601 string
}

export type WalkGroup = {
  id: string
  name: string
  dogIds: string[]
}

export type CompatibilityStatus = 'compatible' | 'neutral' | 'conflict' | 'unknown'

export type CompatibilityEntry = {
  dogIdA: string
  dogIdB: string
  status: CompatibilityStatus
}

export type TimeSlot = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = Sunday, per CAL-06
  hour: number
  minute: number
}

export type WalkSession = {
  id: string
  groupId: string
  slot: TimeSlot
}

export type AppState = {
  schemaVersion: number
  dogs: Dog[]
  walkGroups: WalkGroup[]
  compatibilityEntries: CompatibilityEntry[]
  walkSessions: WalkSession[]
}
```

### Pattern 2: Zustand Store with Persist + Schema Versioning

```typescript
// src/store/index.ts
// Source: Zustand v5 docs + persist middleware guide

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createDogSlice, DogActions } from './dogSlice'
import { AppState } from '../types'

const CURRENT_SCHEMA_VERSION = 1

type AppStore = AppState & DogActions

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      // Initial state values
      schemaVersion: CURRENT_SCHEMA_VERSION,
      dogs: [],
      walkGroups: [],
      compatibilityEntries: [],
      walkSessions: [],
      // Slice actions
      ...createDogSlice(...a),
    }),
    {
      name: 'dogTracker-store',          // D-02: single key
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
      migrate: (persistedState, version) => {
        // Each migration case transforms from version N to N+1
        // Example: if (version === 0) { /* transform */ }
        return persistedState as AppStore
      },
      // partialize: exclude action functions from storage (persist state only)
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        dogs: state.dogs,
        walkGroups: state.walkGroups,
        compatibilityEntries: state.compatibilityEntries,
        walkSessions: state.walkSessions,
      }),
    }
  )
)
```

```typescript
// src/store/dogSlice.ts
// Source: Zustand slices pattern

import { StateCreator } from 'zustand'
import { AppState, Dog } from '../types'

export type DogActions = {
  addDog: (dog: Omit<Dog, 'id' | 'archived' | 'createdAt' | 'updatedAt'>) => void
  updateDog: (id: string, updates: Partial<Omit<Dog, 'id' | 'createdAt'>>) => void
  archiveDog: (id: string) => void
  unarchiveDog: (id: string) => void
}

export const createDogSlice: StateCreator<AppState & DogActions, [], [], DogActions> = (set) => ({
  addDog: (input) => set((state) => ({
    dogs: [
      ...state.dogs,
      {
        ...input,
        id: crypto.randomUUID(),
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  })),
  updateDog: (id, updates) => set((state) => ({
    dogs: state.dogs.map((dog) =>
      dog.id === id
        ? { ...dog, ...updates, updatedAt: new Date().toISOString() }
        : dog
    ),
  })),
  archiveDog: (id) => set((state) => ({
    dogs: state.dogs.map((dog) =>
      dog.id === id ? { ...dog, archived: true, updatedAt: new Date().toISOString() } : dog
    ),
  })),
  unarchiveDog: (id) => set((state) => ({
    dogs: state.dogs.map((dog) =>
      dog.id === id ? { ...dog, archived: false, updatedAt: new Date().toISOString() } : dog
    ),
  })),
})
```

### Pattern 3: LocalStorageAdapter Interface

```typescript
// src/lib/storage.ts
// D-03: expose get/set raw JSON — future export/import UI hooks here

export interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  // D-03: future JSON export/import — expose raw state blob
  getRawJSON: () => string | null
  setRawJSON: (json: string) => void
}

export class LocalStorageAdapter implements StorageAdapter {
  private readonly key = 'dogTracker-store'

  getItem(key: string) { return localStorage.getItem(key) }
  setItem(key: string, value: string) { localStorage.setItem(key, value) }
  removeItem(key: string) { localStorage.removeItem(key) }
  getRawJSON() { return localStorage.getItem(this.key) }
  setRawJSON(json: string) { localStorage.setItem(this.key, json) }
}
```

### Pattern 4: Vitest Configuration

```typescript
// vite.config.ts — merged into existing Vite config
// Source: Vitest v4 docs + React Testing Library docs

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

```json
// tsconfig.app.json — add to compilerOptions
{
  "types": ["vitest/globals"]
}
```

```json
// package.json — add test script
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### Pattern 5: Tailwind v3 + shadcn/ui Setup

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // shadcn/ui CSS custom properties — populated by `shadcn init`
      // colours, radius, etc. are added here by the CLI
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

```css
/* src/index.css — replace existing content */
@tailwind base;
@tailwind components;
@tailwind utilities;
/* shadcn/ui CSS custom property tokens (populated by `shadcn init`) */
```

### Anti-Patterns to Avoid

- **Applying `persist` to individual slices:** Causes type errors and unexpected rehydration conflicts. Apply `persist` to the combined store only.
- **Using `shadcn@latest` with Tailwind v3:** The latest shadcn CLI generates Tailwind v4 config (`@import "tailwindcss"` and `@tailwindcss/vite` plugin). This is incompatible with the locked decision to use Tailwind v3.
- **Storing action functions in LocalStorage:** Always use `partialize` to exclude action functions from the persisted state. Zustand persist does not serialise functions, but explicit `partialize` makes the intent clear and avoids edge-case serialization warnings.
- **Putting `schemaVersion` only in the state type without initialising it in the store:** The `schemaVersion` field must be in both the `AppState` type and the `persist` `version` option. They must stay in sync. Use a single `CURRENT_SCHEMA_VERSION` constant.
- **Using `const` arrow functions for top-level components:** Project convention is `function` declarations. Violating this will be flagged in code review.
- **Using semicolons or double quotes:** ESLint config must enforce project style. `no-semi`, single quotes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State persistence to LocalStorage | Custom subscription + `localStorage.setItem` on every change | `zustand/middleware` `persist` | Handles serialisation, rehydration, partial state merging, storage engine swapping, and version migration |
| Browser DOM in tests | Custom browser environment setup | `jsdom` via `vitest environment: 'jsdom'` | jsdom emulates full browser API including `localStorage` |
| Component assertions | Raw DOM queries | `@testing-library/jest-dom` matchers | `toBeInTheDocument()`, `toHaveValue()`, `toBeDisabled()` — hundreds of edge cases handled |
| User interaction simulation | `fireEvent` directly | `@testing-library/user-event` | `userEvent` simulates real browser events including focus, blur, keyboard sequences |
| Accessible interactive components | Hand-rolled dialog/sheet | shadcn `AlertDialog`, `Sheet` | Focus trapping, ARIA attributes, Escape key handling — accessibility requirements are met automatically |
| Conditional class composition | String template literals | `clsx` + `tailwind-merge` via `cn()` | Tailwind class conflicts (e.g. `text-red-500` vs `text-slate-500`) require merge intelligence |
| Unique IDs for domain records | Sequential counter or timestamp | `crypto.randomUUID()` | Browser-native, collision-resistant, no dependency required |

**Key insight:** Every "simple" custom implementation in this domain touches edge cases that take days to get right: partial-rehydration merge strategies, focus trap stacking, Tailwind class precedence rules. The libraries exist because these problems are genuinely hard.

---

## Common Pitfalls

### Pitfall 1: Wrong shadcn CLI Version

**What goes wrong:** Running `npx shadcn@latest init` generates a Tailwind v4 project structure with `@import "tailwindcss"` in CSS, `@tailwindcss/vite` in vite config, and OKLCH colour tokens. This is incompatible with the locked Tailwind v3 decision and the existing UI-SPEC colour token definitions (which use HSL).

**Why it happens:** The shadcn CLI's default changed in February 2025 when Tailwind v4 support was added. `shadcn@latest` is now 4.x.

**How to avoid:** Always install `npx shadcn@2.3.0 init` for Tailwind v3 projects. Pin the version in any documentation or scripts.

**Warning signs:** `tailwind.config.js` is absent after init (v4 uses CSS-based config instead), or `index.css` contains `@import "tailwindcss"` instead of `@tailwind base/components/utilities` directives.

### Pitfall 2: `persist` Middleware TypeScript Errors with Slices

**What goes wrong:** TypeScript reports type errors on `StateCreator` when slices are combined with `persist`. The error is often about mutators not matching.

**Why it happens:** In Zustand v5, `StateCreator` takes up to 4 type parameters: `[FullStoreType, Mutators, ChainedMutators, SliceType]`. When using `persist`, the second type parameter must include `[["zustand/persist", unknown]]` for slices that access the persisted store's type.

**How to avoid:** For this project's simple dogSlice (no cross-slice access needed), the basic `StateCreator<AppState & DogActions, [], [], DogActions>` signature is sufficient. Apply `persist` only at the combined store level.

**Warning signs:** TypeScript error `Type ... is not assignable to type 'StateCreator<...>'` when combining slice creators.

### Pitfall 3: `localStorage` Unavailable in Test Environment

**What goes wrong:** Zustand's `persist` middleware calls `localStorage.getItem` during store creation. In jsdom, `localStorage` is available but is reset between test files — not between individual tests in the same file.

**Why it happens:** jsdom's `localStorage` persists within a test file's execution context. Tests that share the same store instance will see side effects from previous tests.

**How to avoid:** Mock or reset `localStorage` in `beforeEach` for store-related tests. Use `vi.stubGlobal` or `Object.defineProperty` to control what `localStorage` returns. Alternatively, test store actions in isolation from the `persist` middleware by testing `dogSlice` logic directly with a non-persisted store.

**Warning signs:** Tests pass individually but fail when run in sequence; store state from test N bleeds into test N+1.

### Pitfall 4: `noUnusedLocals` Breaking shadcn Component Imports

**What goes wrong:** TypeScript strict mode with `noUnusedLocals: true` flags imported shadcn types that are used only in JSX prop positions in ways the compiler doesn't detect.

**Why it happens:** Certain pattern usages (e.g. importing a type for a ref or component variant) may not be recognised as a "use" by TypeScript in some edge cases.

**How to avoid:** Prefer named imports only for what you actually render. Use `import type` for type-only imports. shadcn components are copied source — review them for compliance with strict mode on first init.

**Warning signs:** TypeScript build errors referencing files in `src/components/ui/` that you didn't write.

### Pitfall 5: Vitest Requires Node >= 20

**What goes wrong:** Vitest v4 requires Node 20+. Running on Node 18 throws an install-time or runtime error.

**Why it happens:** Vitest v4 uses Node 20+ APIs.

**How to avoid:** Node v20.9.0 is installed on this machine — confirmed. No action needed. Flag for any CI environment.

**Warning signs:** `npm install vitest` throws `EBADENGINE` or test runner errors about unsupported Node version.

---

## Code Examples

### Store Unit Test Pattern

```typescript
// src/store/dogSlice.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createDogSlice, DogActions } from './dogSlice'
import { AppState } from '../types'

// Test with a non-persisted store to isolate slice logic
function makeTestStore() {
  return create<AppState & DogActions>()((set, get, store) => ({
    schemaVersion: 1,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    ...createDogSlice(set, get, store),
  }))
}

describe('dogSlice', () => {
  let useStore: ReturnType<typeof makeTestStore>

  beforeEach(() => {
    useStore = makeTestStore()
  })

  it('adds a dog with a generated id', () => {
    const { addDog } = useStore.getState()
    addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const dogs = useStore.getState().dogs
    expect(dogs).toHaveLength(1)
    expect(dogs[0].name).toBe('Rex')
    expect(dogs[0].id).toBeTruthy()
    expect(dogs[0].archived).toBe(false)
  })

  it('archives a dog by id', () => {
    const { addDog, archiveDog } = useStore.getState()
    addDog({ name: 'Rex', breed: '', age: null, notes: '' })
    const id = useStore.getState().dogs[0].id
    archiveDog(id)
    expect(useStore.getState().dogs[0].archived).toBe(true)
  })
})
```

### Component Integration Test Pattern

```typescript
// src/components/DogRoster.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DogRoster } from './DogRoster'

describe('DogRoster', () => {
  it('shows empty state when no dogs exist', () => {
    render(<DogRoster />)
    expect(screen.getByText('No dogs yet')).toBeInTheDocument()
  })

  it('opens the add panel when Add Dog is clicked', async () => {
    const user = userEvent.setup()
    render(<DogRoster />)
    await user.click(screen.getByRole('button', { name: /add dog/i }))
    expect(screen.getByText('Add Dog')).toBeInTheDocument()   // panel title
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })
})
```

### cn() Utility

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand `create<T>()` (single parens) | `create<T>()()` double-call for TS (v5 pattern) | Zustand v5 (2024) | Extra `()` required for correct generic inference with middleware; v4 pattern still works but v5 recommends double-call |
| shadcn/ui + Tailwind v3 | shadcn/ui + Tailwind v4 (default) | Feb 2025 | New projects default to Tailwind v4; v3 requires `shadcn@2.3.0` explicitly |
| Tailwind v3 `tailwind.config.js` + PostCSS | Tailwind v4 CSS-first config (`@import "tailwindcss"`) | Tailwind v4 (early 2025) | v4 eliminates `tailwind.config.js` entirely; v3 still uses the JS config file |
| `@testing-library/react` with Jest | `@testing-library/react` with Vitest + jsdom | 2023+ | Full Jest compatibility — same matchers, same `render/screen` API; import `@testing-library/jest-dom/vitest` instead of `@testing-library/jest-dom` |
| React `forwardRef` in shadcn components | Direct ref prop (React 19 pattern) | shadcn Tailwind v4 update | v3 components still use `forwardRef`; v4 components remove it. This project uses v3 so `forwardRef` is present in ui/ source files. |

**Deprecated/outdated:**
- `tailwindcss-animate`: Deprecated by shadcn in favour of `tw-animate-css` — but only for Tailwind v4 projects. For v3, `tailwindcss-animate` is still the correct choice.
- Zustand `devtools` middleware + Redux DevTools: Still works, but not required for Phase 1. Deferrable.

---

## Open Questions

1. **ESLint flat config content**
   - What we know: `package.json` has `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` installed. `eslint.config.js` is absent (noted in CONTEXT.md discretion).
   - What's unclear: What rules to enable for the project's no-semicolons, single-quotes, strict TypeScript style.
   - Recommendation: Create `eslint.config.js` using `@eslint/js` + `typescript-eslint` flat config + `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`. Add `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser`. Include style rules: `semi: ['error', 'never']`, `quotes: ['error', 'single']`.

2. **`crypto.randomUUID()` in test environment**
   - What we know: `crypto.randomUUID()` is available in all modern browsers and Node 14.17+. jsdom v29 provides the Web Crypto API.
   - What's unclear: Whether jsdom v29 exposes `crypto.randomUUID()` without a polyfill.
   - Recommendation: Test on first run. If `crypto.randomUUID` is undefined in tests, add `vi.stubGlobal('crypto', { randomUUID: () => Math.random().toString(36) })` in setup, or use `nanoid` as a fallback.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js >= 20 | Vitest v4 | Yes | v20.9.0 | — |
| npm | Package installation | Yes | 10.1.0 | — |
| Browser (for dev) | Vite dev server | — | — | Irrelevant for tests |
| localStorage | Zustand persist (runtime) | Yes — jsdom provides in tests | jsdom 29.0.1 | — |

No missing dependencies with blocking issues. All required runtimes are available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vite.config.ts` (`test:` block) — Wave 0 creates this |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | State persists to localStorage on change | unit | `vitest run src/store` | Wave 0 |
| FOUND-02 | State restores from localStorage on page load | unit | `vitest run src/store` | Wave 0 |
| FOUND-03 | `schemaVersion` present; migrate function runs on version mismatch | unit | `vitest run src/store/migrations` | Wave 0 |
| FOUND-04 | `npm run test` passes with no failures | smoke | `npm run test -- --run` | Wave 0 |
| DOGS-01 | `addDog` creates dog with correct fields | unit | `vitest run src/store/dogSlice` | Wave 0 |
| DOGS-02 | `updateDog` updates fields and `updatedAt` | unit | `vitest run src/store/dogSlice` | Wave 0 |
| DOGS-03 | `archiveDog` sets `archived: true`; dog absent from active view | unit + integration | `vitest run src/store/dogSlice` + `vitest run src/components/DogRoster` | Wave 0 |
| DOGS-04 | Active roster renders only `archived: false` dogs | integration | `vitest run src/components/DogRoster` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- --run` (full suite, fast — no watch)
- **Per wave merge:** `npm run test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- `src/test/setup.ts` — imports `@testing-library/jest-dom/vitest` and calls `cleanup()` after each test
- `src/store/dogSlice.test.ts` — covers DOGS-01, DOGS-02, DOGS-03, FOUND-01
- `src/store/migrations.test.ts` — covers FOUND-03 (`schemaVersion` field presence, migrate function stub)
- `src/components/DogRoster.test.tsx` — covers DOGS-03 (archive hides dog), DOGS-04 (active roster filter)
- `vitest.config` block in `vite.config.ts` — environment, globals, setupFiles

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view`) — version verification for all packages, 2026-03-26
- [zustand.docs.pmnd.rs/learn/guides/slices-pattern](https://zustand.docs.pmnd.rs/learn/guides/slices-pattern) — slices pattern, StateCreator signature, persist middleware placement
- [github.com/pmndrs/zustand persist.md](https://github.com/pmndrs/zustand/blob/v5.0.0/docs/integrations/persisting-store-data.md) — `version`, `migrate`, `partialize`, `storage` options
- [github.com/shadcn/vite-template-v3](https://github.com/shadcn/vite-template-v3) — canonical Tailwind v3 + shadcn setup: `package.json`, `tailwind.config.js`, `postcss.config.js`
- [vitest.dev/guide/environment](https://vitest.dev/guide/environment.html) — jsdom environment, `environment: 'jsdom'` config
- [testing-library.com/docs/react-testing-library/setup](https://testing-library.com/docs/react-testing-library/setup) — cleanup, globals, setupFiles

### Secondary (MEDIUM confidence)

- [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) — confirmed v4 is now default; v3 = legacy
- [ui.shadcn.com/docs/changelog](https://ui.shadcn.com/docs/changelog) — Feb 2025 Tailwind v4 support added to shadcn
- Multiple WebSearch results confirming `shadcn@2.3.0` for Tailwind v3 projects

### Tertiary (LOW confidence)

- TypeScript examples in Zustand docs inline comments — patterns extrapolated from official docs structure, not verified line-by-line against Zustand v5 source

---

## Metadata

**Confidence breakdown:**
- Standard stack (versions): HIGH — all versions verified against npm registry 2026-03-26
- Architecture patterns: HIGH — Zustand slices + persist pattern from official docs; shadcn setup from official v3 template
- Tailwind v3 vs v4 risk: HIGH — confirmed via shadcn changelog and vite-template-v3 source
- Pitfalls: HIGH — shadcn CLI version pitfall verified by direct doc inspection; others from official docs + community reports cross-checked
- Test architecture: HIGH — Vitest + RTL pattern from official docs

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (30 days — ecosystem is stable for these versions)
