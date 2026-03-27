# Codebase Structure

*Generated: 2026-03-26*

## Summary

The project is a Vite-scaffolded React + TypeScript SPA at an early stage. The `src/` directory contains only three files. No feature subdirectories (components, pages, hooks, utils, types, services) have been created yet. The structure represents a clean starting point with no established conventions beyond the scaffold defaults.

## Directory Layout

```
dog-tracker/
├── .claude/                  # Claude Code local config
│   └── settings.local.json
├── .planning/                # GSD planning artifacts (not shipped)
│   └── codebase/             # Codebase analysis documents
├── src/                      # All application source code
│   ├── main.tsx              # App entry point — mounts React into #root
│   ├── App.tsx               # Root component
│   └── index.css             # Global CSS reset and base styles
├── index.html                # HTML shell — Vite entry document
├── package.json              # Dependencies and npm scripts
├── package-lock.json         # Lockfile
├── vite.config.ts            # Vite build configuration
├── tsconfig.json             # TypeScript project references root
├── tsconfig.app.json         # TypeScript config for src/ (strict mode)
├── tsconfig.node.json        # TypeScript config for Vite config file
├── CLAUDE.md                 # Claude Code project instructions
└── .gitignore
```

## Directory Purposes

**`src/`:**
- Purpose: All application source code compiled by Vite
- Contains: Components, entry point, styles
- Key files: `src/main.tsx` (entry), `src/App.tsx` (root component)

**`.planning/`:**
- Purpose: GSD planning and analysis documents
- Generated: By GSD tooling
- Committed: Yes (planning artifacts are version controlled)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (`npm install`)
- Committed: No

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell, loads `src/main.tsx`
- `src/main.tsx`: JS/TS entry, mounts `<App />`

**Configuration:**
- `vite.config.ts`: Build tool config (React plugin only, no aliases set)
- `tsconfig.app.json`: TypeScript strict config covering `src/`
- `package.json`: Scripts and dependency declarations

**Core Logic:**
- `src/App.tsx`: Root component — expand this as the app grows

**Styles:**
- `src/index.css`: Global reset, imported once in `src/main.tsx`

## Naming Conventions

No established conventions beyond scaffold defaults. Scaffold uses:

**Files:**
- Components: PascalCase `.tsx` (e.g., `App.tsx`)
- Entry/config: camelCase `.ts` / `.tsx` (e.g., `main.tsx`, `vite.config.ts`)
- Styles: kebab-case `.css` (e.g., `index.css`)

**Directories:**
- Not yet established — no feature subdirectories exist

## Where to Add New Code

The following structure is recommended as the app grows, consistent with standard Vite + React conventions:

**New UI Component:**
- Implementation: `src/components/[ComponentName].tsx`
- Example: `src/components/DogCard.tsx`

**New Page/View:**
- Implementation: `src/pages/[PageName].tsx`
- Example: `src/pages/Dashboard.tsx`

**Custom Hooks:**
- Implementation: `src/hooks/use[HookName].ts`
- Example: `src/hooks/useDogs.ts`

**Shared Utilities:**
- Implementation: `src/utils/[utilName].ts`
- Example: `src/utils/formatDate.ts`

**TypeScript Types/Interfaces:**
- Implementation: `src/types/[domain].ts`
- Example: `src/types/dog.ts`

**API/Data Services:**
- Implementation: `src/services/[serviceName].ts`
- Example: `src/services/dogService.ts`

**Component-Scoped Styles:**
- Co-locate with component or use CSS modules: `src/components/DogCard.module.css`

## Special Directories

**`.planning/`:**
- Purpose: GSD analysis and planning documents
- Generated: By GSD commands
- Committed: Yes

**`dist/`:**
- Purpose: Vite production build output (`npm run build`)
- Generated: Yes
- Committed: No (in `.gitignore`)

## Gaps / Unknowns

- No path aliases configured in `vite.config.ts` or `tsconfig.app.json` (e.g., `@/` → `src/`) — must be added manually if desired
- No barrel files (`index.ts`) pattern established
- Component co-location vs. flat structure not decided
- CSS strategy not decided (plain CSS, CSS modules, Tailwind, etc.)
