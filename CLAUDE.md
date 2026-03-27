# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Production build (outputs to dist/)
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

## Architecture

React 18 + TypeScript SPA built with Vite. No backend — frontend only.

- Entry point: `src/main.tsx` → renders `src/App.tsx` into `#root`
- TypeScript strict mode enabled (`tsconfig.app.json`)
- No test framework configured yet
