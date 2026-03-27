# Coding Conventions
*Generated: 2026-03-26*

## Summary

This is a freshly scaffolded Vite + React 18 + TypeScript project with minimal application code. Conventions are largely established by the toolchain defaults rather than a body of existing application code. TypeScript strict mode is fully enabled. No formatter (Prettier, Biome) is configured; the only linting enforced is ESLint via `npm run lint`, though no ESLint config file is present at the project root.

## TypeScript Usage

**Strictness:** Maximum. `tsconfig.app.json` enables all of the following:
- `"strict": true` — enables `strictNullChecks`, `noImplicitAny`, etc.
- `"noUnusedLocals": true`
- `"noUnusedParameters": true`
- `"noFallthroughCasesInSwitch": true`
- `"noUncheckedSideEffectImports": true`

**Target:** ES2020 for app code (`tsconfig.app.json`), ES2022 for build config (`tsconfig.node.json`).

**Module system:** ESNext modules with `"moduleResolution": "bundler"` — use bare specifier imports, no `.js` extensions needed.

**JSX transform:** `"jsx": "react-jsx"` (automatic runtime) — do NOT import React at the top of every file.

**Non-null assertion:** Used in `src/main.tsx` (`document.getElementById('root')!`) for the DOM mount point. This is the only real application code, so treat it as the established pattern for DOM queries with known presence.

## File and Component Conventions

**File naming:**
- Component files use PascalCase: `App.tsx`
- Non-component files use camelCase: `main.tsx`, `index.css`
- Config files use kebab-case or dot-prefix per tool convention

**Component style:** Function declarations (not arrow functions assigned to `const`) for top-level components:
```tsx
// App.tsx — use this pattern
function App() {
  return (...)
}
export default App
```

**Exports:** Default export for components (`export default App`). No named exports observed yet on components.

**No type annotations on return values** in the single existing component — relying on inference. This is consistent with idiomatic modern React + TypeScript.

## Import Organization

Observed order in `src/main.tsx`:
1. Named imports from external packages (`react`, `react-dom/client`)
2. CSS side-effect imports (`./index.css`)
3. Local module imports (`./App`)

No path aliases are configured in `vite.config.ts` or `tsconfig.app.json`. Use relative paths.

## Styling

**Approach:** Plain CSS via `src/index.css`. No CSS modules, no CSS-in-JS, no utility framework.

**Global resets in place:**
- `box-sizing: border-box` on all elements
- `margin: 0` on `body`
- `font-family: system-ui, sans-serif` on `body`

New styles belong in `src/index.css` until a component-specific CSS strategy is established.

## React Patterns

**StrictMode:** Enabled in `src/main.tsx`. All components run in strict mode — double-invocation of effects and render functions in development is expected and intentional.

**Prop types:** No PropTypes library present. Use TypeScript interfaces/types for all prop definitions.

**State management:** No state management library installed. Use React built-ins (`useState`, `useReducer`, `useContext`) until complexity warrants a library.

## Code Style (no formatter configured)

No Prettier or Biome config exists. The existing code follows these observable patterns:
- 2-space indentation
- No semicolons at end of statements (see `App.tsx`)
- Single quotes for strings
- No trailing commas visible in short files

These are not enforced by tooling — future contributors may diverge.

## Linting

**Tool:** ESLint 9.x (`"eslint": "^9.9.0"` in devDependencies), run via `npm run lint`.

**Plugins installed:** `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.

**Config file:** No `eslint.config.*` file found at the project root. ESLint 9 requires a flat config file (`eslint.config.js`) — running `npm run lint` will currently fail or use defaults only. A config file needs to be created.

## Gaps / Unknowns

- No ESLint config file (`eslint.config.js`) exists — linting behavior is undefined until one is added.
- No formatter (Prettier, Biome) is configured. Code style consistency relies on convention only.
- No path aliases defined — unknown if the team intends to add them as the project grows.
- No established pattern for custom hooks, contexts, or services — the app has no feature code yet.
- Component prop typing pattern (inline type vs. named interface vs. named type alias) is not yet established.
