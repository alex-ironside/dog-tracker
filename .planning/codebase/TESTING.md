# Testing Patterns
*Generated: 2026-03-26*

## Summary

No test framework is installed or configured. The project is a fresh Vite scaffold and contains zero test files. CLAUDE.md explicitly notes "No test framework configured yet." Testing infrastructure must be added from scratch before any tests can be written.

## Current State

**Test runner:** None installed.

**Test files:** None exist anywhere in `src/`.

**Coverage tooling:** None.

**Test scripts in `package.json`:** None. The only scripts are `dev`, `build`, `lint`, and `preview`.

## What Is Not Tested

Everything. The entire application is untested:

- `src/App.tsx` — root component, renders `<h1>Dog Tracker</h1>`
- `src/main.tsx` — entry point, DOM mount logic

## Recommended Setup (when adding tests)

Based on the existing stack (Vite + React 18 + TypeScript), the natural choice is **Vitest** with **React Testing Library**.

**Packages to install:**
```bash
npm install --save-dev vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**`vite.config.ts` addition:**
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**`package.json` scripts to add:**
```json
"test": "vitest",
"test:ui": "vitest --ui",
"coverage": "vitest run --coverage"
```

**Test file convention to adopt:**
- Co-locate tests with source: `src/App.test.tsx` alongside `src/App.tsx`
- Or place in a `src/__tests__/` directory — choose one and stick to it.

**Naming pattern:** `[ComponentName].test.tsx` for components, `[util].test.ts` for pure functions.

## Gaps / Unknowns

- No decision has been made on test file placement (co-located vs. `__tests__` directory).
- No coverage threshold targets have been set.
- No E2E test framework (Playwright, Cypress) has been considered — unknown if the project will need one.
- No mock strategy is established (MSW for network, vi.mock for modules, etc.).
