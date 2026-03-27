# External Integrations

*Generated: 2026-03-26*

## Summary

This project has no external integrations. It is a frontend-only SPA with no API calls, no third-party SDKs, no authentication provider, and no environment variables. All data — if any is added — would need to live in-memory or in browser storage until a backend or external service is introduced.

## APIs & External Services

None detected. No fetch calls, no SDK imports, and no service client configuration exist in the source files.

## Data Storage

**Databases:** None

**Browser Storage:** Not yet used (no `localStorage`, `sessionStorage`, or `IndexedDB` references found in source)

**File Storage:** Not applicable — frontend-only

**Caching:** None

## Authentication & Identity

None. No auth provider, session management, or protected routes exist.

## Monitoring & Observability

**Error Tracking:** None

**Analytics:** None

**Logging:** Browser console only (no logging library)

## CI/CD & Deployment

**Hosting:** Not configured — no deployment config files detected (no `vercel.json`, `netlify.toml`, `Dockerfile`, etc.)

**CI Pipeline:** None detected (no `.github/workflows/`, no CI config)

## Environment Configuration

**`.env` files:** None present

**Required env vars:** None

Vite's env var system (`import.meta.env.VITE_*`) is available but not used anywhere in the codebase.

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None

## Gaps / Unknowns

- No deployment target has been decided or configured yet
- If a backend or database is added in the future, environment variable conventions should be established (Vite requires the `VITE_` prefix for browser-exposed vars)
- No CDN, image optimization service, or asset pipeline beyond Vite's built-in bundling
