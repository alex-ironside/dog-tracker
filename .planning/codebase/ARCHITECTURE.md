# Architecture

*Generated: 2026-03-26*

## Summary

Dog Tracker is a freshly scaffolded React 18 + TypeScript SPA with no backend. The application currently consists of a minimal scaffold — an entry point, a root component, and global styles. No routing, state management, data layer, or feature components have been implemented yet.

## Pattern Overview

**Overall:** Single-Page Application (SPA), frontend only

**Key Characteristics:**
- No backend, no API calls, no server-side rendering
- All data will be client-side only (localStorage, in-memory, or future external API)
- React component tree is the sole architectural unit at present

## Layers

**Entry / Bootstrap:**
- Purpose: Mount the React app into the DOM
- Location: `src/main.tsx`
- Contains: `createRoot` call, StrictMode wrapper, global CSS import
- Depends on: `src/App.tsx`, `src/index.css`
- Used by: `index.html` via `<script type="module" src="/src/main.tsx">`

**Root Component:**
- Purpose: Application shell — currently a placeholder
- Location: `src/App.tsx`
- Contains: Static `<h1>Dog Tracker</h1>` inside a `<div>`
- Depends on: Nothing
- Used by: `src/main.tsx`

**Global Styles:**
- Purpose: CSS reset and base styles
- Location: `src/index.css`
- Contains: `box-sizing: border-box` reset, zero margin body, system font stack
- Imported by: `src/main.tsx` (applied globally)

## Data Flow

No data flow exists yet. The app renders static markup only.

**Anticipated flow once features are added:**
1. User interaction triggers state update in a component or context
2. State change re-renders affected component subtree
3. If persistence is added (localStorage / external API), a service/hook layer would sit between state and storage

**State Management:**
- Not implemented. No context providers, no stores, no hooks beyond what React 18 provides by default.

## Entry Points

**HTML Shell:**
- Location: `index.html`
- Triggers: Browser load
- Responsibilities: Provides `<div id="root">` mount target, loads `src/main.tsx` as an ES module

**JS Entry:**
- Location: `src/main.tsx`
- Triggers: Browser executes module
- Responsibilities: Renders `<App />` wrapped in `<StrictMode>` into `#root`

## Error Handling

**Strategy:** None implemented. No error boundaries, no try/catch, no error UI.

## Cross-Cutting Concerns

**Logging:** None
**Validation:** None
**Authentication:** None
**Routing:** None — single view, no router installed

## Gaps / Unknowns

- No components, hooks, pages, utils, or services directories exist yet — the full feature structure is unbuilt
- Data persistence strategy is undecided (localStorage, IndexedDB, external API, etc.)
- Routing solution not chosen (React Router, TanStack Router, etc.)
- State management approach not chosen (useState/useContext, Zustand, etc.)
- No error boundary strategy defined
