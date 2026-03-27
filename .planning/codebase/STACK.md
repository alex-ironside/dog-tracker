# Technology Stack

*Generated: 2026-03-26*

## Summary

Dog Tracker is a minimal React 18 + TypeScript SPA bootstrapped with Vite. It has no backend, no routing library, no state management library, and no UI component library — just the Vite default scaffold with a single placeholder component. The project is in its earliest stage.

## Languages

**Primary:**
- TypeScript 5.5.3 — all source files (`src/*.tsx`, `vite.config.ts`)

**Secondary:**
- CSS — `src/index.css` (global styles)
- HTML — `index.html` (single entry document)

## Runtime

**Environment:**
- Node.js v20.9.0 (detected on dev machine; no `.nvmrc` or `.node-version` enforcing a version)

**Package Manager:**
- npm 10.1.0
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.3.1 — UI rendering, used via `react-dom/client` `createRoot` in `src/main.tsx`
- React DOM 18.3.1 — DOM renderer

**Build/Dev:**
- Vite 5.4.1 — dev server and production bundler; config at `vite.config.ts`
- `@vitejs/plugin-react` 4.3.1 — Babel-based Fast Refresh for React

**Testing:**
- None configured

## TypeScript Configuration

Two compilation targets via project references (`tsconfig.json`):

| Config | Target | Scope |
|---|---|---|
| `tsconfig.app.json` | ES2020 | `src/` — application code |
| `tsconfig.node.json` | ES2022 | `vite.config.ts` — build tooling |

Strict mode is fully enabled in both configs, including:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`

Module system: ESNext modules with `"moduleResolution": "bundler"`.

## Key Dependencies

**Production:**
- `react` ^18.3.1 — core framework
- `react-dom` ^18.3.1 — DOM bindings

**Dev-only:**
- `@types/react` ^18.3.1 — TypeScript types for React
- `@types/react-dom` ^18.3.1 — TypeScript types for React DOM
- `eslint` ^9.9.0 — linting (flat config format implied by v9)
- `eslint-plugin-react-hooks` ^5.1.0-rc.0 — hooks linting rules
- `eslint-plugin-react-refresh` ^0.4.9 — Vite HMR safety linting
- `typescript` ^5.5.3 — compiler
- `vite` ^5.4.1 — build tooling

## Build Scripts

Defined in `package.json`:

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run lint      # ESLint
npm run preview   # Serve dist/ locally
```

## Configuration Files

| File | Purpose |
|---|---|
| `vite.config.ts` | Vite build config; registers `@vitejs/plugin-react` |
| `tsconfig.json` | Root TS config; references app and node sub-configs |
| `tsconfig.app.json` | TS config for `src/` (application code) |
| `tsconfig.node.json` | TS config for `vite.config.ts` |
| `index.html` | Vite HTML entry point; mounts `<div id="root">` |
| `.gitignore` | Ignores `node_modules` only |

## Gaps / Unknowns

- No `.nvmrc` or `.node-version` — Node version is not pinned in the repo
- No ESLint config file found in the project root (e.g., `eslint.config.js`) despite ESLint being listed as a dependency; config may be missing or yet to be created
- No Prettier or other formatter config detected
- No path aliases configured in `vite.config.ts` or `tsconfig.app.json`
- No CSS preprocessor (Sass, PostCSS, etc.) detected beyond plain CSS
