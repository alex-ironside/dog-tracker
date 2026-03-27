# Concerns & Risks
*Generated: 2026-03-26*

## Summary

This project is a blank Vite + React 18 + TypeScript scaffold — essentially a "create-vite" output with minimal customization. No application features have been implemented yet. The risks are almost entirely about what is absent rather than what is broken: there is no data layer, no routing, no state management, no tests, and no persistence strategy in place.

## Technical Debt

**Non-null assertion on root element mount:**
- Location: `src/main.tsx` line 6
- Issue: `document.getElementById('root')!` uses a non-null assertion. If the `#root` div is ever absent (e.g., renamed in `index.html`), this throws a runtime error with no graceful fallback.
- Fix: Add a null guard and render an error boundary or throw a meaningful message.

**`.gitignore` is incomplete:**
- Location: `.gitignore`
- Issue: Only `node_modules` is ignored. Missing standard entries: `dist/`, `.env*`, `.DS_Store`, `*.local`. Build artifacts and future secret files could be accidentally committed.
- Fix: Expand `.gitignore` to cover `dist/`, `.env`, `.env.local`, `.DS_Store`, `coverage/`.

**`App.tsx` has no file extension import for `App`:**
- Location: `src/main.tsx` line 4
- Issue: `import App from './App'` omits the `.tsx` extension. This works with Vite's default resolver but is an implicit dependency on bundler behavior. Strict projects prefer explicit extensions.
- Fix: Low priority — acceptable under Vite conventions, but worth noting for consistency.

**favicon is the default Vite logo:**
- Location: `index.html` line 5 (`/vite.svg`)
- Issue: Placeholder asset remains from scaffolding. Not a bug but indicates the project has not been customized beyond initial setup.

## Security Concerns

**No Content Security Policy (CSP):**
- Location: `index.html`
- Risk: No `<meta http-equiv="Content-Security-Policy">` header or server-side CSP is configured. Once the app grows and loads external resources or handles user data, XSS attack surface is unrestricted.
- Current mitigation: React's JSX escapes output by default, which limits immediate risk.
- Recommendation: Define a CSP before adding any third-party scripts or user-generated content rendering.

**No data sanitization layer:**
- Risk: No input validation or sanitization utilities exist. When forms and user input are added, there is no established pattern to follow.
- Recommendation: Decide on a validation library (e.g., Zod) before building the first data-entry feature.

**Persistence strategy unknown:**
- Risk: If `localStorage` or `IndexedDB` is used for dog tracking data, sensitive pet/owner information will be stored client-side with no encryption.
- Current state: No persistence mechanism exists yet — this is a risk to plan for, not fix now.
- Recommendation: Define the data storage approach early and assess whether any stored fields (owner name, location, vet info) warrant encryption at rest.

## Performance Issues

**No performance concerns at current scale.**

The app renders a single `<h1>`. No images, no data fetching, no lists, no heavy computation. Performance analysis is premature — concerns will emerge as features are built.

**Potential future concern — no code splitting planned:**
- Location: `vite.config.ts`
- Issue: No route-based code splitting is configured. As the app grows, all code will ship in a single bundle unless a router with lazy loading is introduced.
- Recommendation: Adopt React Router or TanStack Router with lazy-loaded routes before the bundle becomes large.

## Missing / Incomplete Features

**The entire application is missing.** The scaffold is a placeholder. Based on the project name "dog tracker," the following are expected but absent:

- No dog profiles (name, breed, age, photo)
- No tracking data model (walks, feeding, medications, vet visits, weight)
- No routing or multi-page navigation
- No state management solution (no Context, Zustand, Redux, etc.)
- No persistence layer (no localStorage, IndexedDB, or backend API)
- No form handling
- No UI component library or design system
- No error boundaries
- No loading/empty states
- No accessibility considerations (ARIA, focus management)

**No test framework:**
- The CLAUDE.md notes "No test framework configured yet." No `*.test.tsx` files exist.
- Risk: Features built without tests have no regression safety net.
- Recommendation: Configure Vitest before building the first real feature — retrofitting tests is harder than starting with them.

**No linting for accessibility:**
- `eslint-plugin-jsx-a11y` is not installed. Accessibility issues will not be caught automatically.

**No environment variable handling:**
- No `.env` files, no `VITE_` prefixed variables. If the app ever calls an external API, there is no established pattern for secrets/config.

## Gaps / Unknowns

**No requirements documentation exists.** It is unclear what "dog tracker" means in scope: is it a single user's personal tool, a multi-dog household app, a vet-facing tool, or something else? This ambiguity affects all architectural decisions (data model, auth, persistence).

**Deployment target is unknown.** No hosting config (Netlify, Vercel, GitHub Pages) is present. The `vite.config.ts` has no `base` path set, which can cause broken asset paths on non-root deployments.

**No decision on offline support.** A dog tracker is a natural candidate for a PWA (offline logging of walks, etc.), but no service worker or manifest is configured.

**Auth requirements are unknown.** No authentication library or pattern is present. If the app will store personal data, auth decisions should be made before building data features.
