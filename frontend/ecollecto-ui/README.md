# eCollecto UI

React + Vite frontend for browsing stamps, collections, and first-day covers. Authenticated users can log in via Keycloak (Authorization Code + PKCE) to access protected features.

## Overview
- Single-page app with React Router routes for home, product detail, collection, and first-day views.
- Data loaded from the Java backend via REST endpoints (proxied in dev).
- Auth session managed with `react-oidc-context` + `oidc-client-ts` and synced to Redux Toolkit.
- Tailwind CSS v4 for styling with a small custom CSS entrypoint.

## Tech Stack
- React 19 + TypeScript
- Vite 7 (dev server + build)
- React Router 7
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Redux Toolkit + React Redux (auth/session state)
- react-oidc-context + oidc-client-ts (Keycloak PKCE flow)
- Zod (runtime schema validation)
- Vitest + React Testing Library (unit tests)

## Getting Started

### Via Gradle (recommended)
```powershell
.\gradlew.bat :frontend:ecollecto-ui:npmDev
```

### Via npm directly
1) Copy the env file and fill in Keycloak values:
```bash
cp .env.example .env.local
```
2) Install dependencies:
```bash
npm install
```
3) Run the dev server:
```bash
npm run dev
```

The dev server proxies API requests to `http://localhost:8080` (see `vite.config.ts`). Keycloak must be running on `http://localhost:8180` with the `ecollecto` realm imported.

## Scripts
- `npm run dev` — Start the Vite dev server.
- `npm run build` — Type-check and build for production.
- `npm run preview` — Serve the production build locally.
- `npm run lint` — Run ESLint across the project.
- `npm test` — Run all tests once (Vitest).
- `npm run test:watch` — Run tests in watch mode.
- `npm run test:coverage` — Run with V8 coverage report.
- `npm run generate` — Regenerate `api.generated.ts` and `schemas.generated.ts` from `openapi.yaml`.
- `npm run generate:types` — Regenerate TypeScript types only (openapi-typescript).
- `npm run generate:schemas` — Regenerate Zod schemas only (openapi-zod-client).

## Routes
Defined in `src/app/App.tsx`:
- `/` — Stamps listing (Home).
- `/stamps/:id` — Stamp detail page.
- `/collection` — Collection grid.
- `/firstday` — First day of issue list.
- `*` — Not found page.

Protected and admin routes use `src/app/routes/ProtectedRoute.tsx` and `AdminRoute.tsx`.

## API Usage
The UI fetches data from these endpoints:
- `GET /api/stamps` — List stamps (used by Home and Collection pages).
- `GET /api/stamp/:id` — Stamp detail (Product page).
- `GET /api/first-day-covers` — First day covers list.
- `GET /api/tariffs` — Postal tariff data used for denomination formatting.
- `GET /api/me` — Authenticated user profile (requires Bearer JWT, called after login).

Development requests are proxied to `http://localhost:8080` by Vite.

## Generated Types
`api.generated.ts` and `schemas.generated.ts` are auto-generated from `backend/ecollecto-backend/openapi.yaml`. **Never edit them manually.** Regenerate after any backend DTO change:

```bash
npm run generate
```

Zod schemas in `src/features/product/types/schemas/` are thin re-exports of `schemas.generated.ts`.

## Project Structure
Full project map (large generated directories omitted: `.gradle/`, `node_modules/`, `build/`, `dist/`).
```
.
├─ build.gradle           # Gradle wrapper config for the UI module
├─ eslint.config.js       # ESLint config
├─ index.html             # Vite HTML entrypoint
├─ package.json           # NPM scripts and dependencies
├─ tailwind.config.ts     # Tailwind config
├─ tsconfig.json          # Base TS config
├─ vite.config.ts         # Vite config + dev proxy
└─ src/
   ├─ app/
   │  ├─ App.tsx          # Router and layout composition
   │  ├─ main.tsx         # App entry point
   │  ├─ store.ts         # Redux store
   │  ├─ providers/       # AuthProvider (OIDC), ReduxProvider
   │  └─ routes/          # ProtectedRoute, AdminRoute
   ├─ assets/             # Static assets (icons, images)
   ├─ features/
   │  ├─ auth/            # authSlice, authThunks, auth components and hooks
   │  └─ product/         # Product UI components, domain types, generated types
   ├─ pages/              # Route-level pages (Home, Product, Collection, FirstDay, NotFound)
   ├─ shared/
   │  ├─ api/             # apiClient.ts (shared fetch wrapper)
   │  ├─ layout/          # Header, Footer
   │  └─ utils/           # stampHelpers.ts (denomination formatting)
   └─ styles/             # Global styles (Tailwind entry)
```

### Key Modules
- `src/app/App.tsx` — Router and layout composition.
- `src/app/store.ts` — Redux Toolkit store.
- `src/app/providers/AuthProvider.tsx` — OIDC/Keycloak provider wrapping the app.
- `src/features/auth/authSlice.ts` — Auth/session Redux slice.
- `src/shared/layout/Header.tsx` / `Footer.tsx` — Global navigation and footer.
- `src/shared/utils/stampHelpers.ts` — Denomination formatting with tariff lookups.
- `src/features/product/types/api.generated.ts` — Auto-generated TypeScript types from OpenAPI spec.
- `src/features/product/types/schemas.generated.ts` — Auto-generated Zod schemas from OpenAPI spec.

## Data Loading Patterns
Pages use `useEffect` + `fetch` with `AbortController` to load data and handle:
- Loading state
- Error state
- Cancellation on unmount

Redux Toolkit is used for cross-page shared state only (auth/session). Local component state stays in `useState`.

## Styling
Tailwind CSS is imported via `src/styles/index.css`:
```css
@import 'tailwindcss';
```

## Testing

The project uses **Vitest + React Testing Library** with a jsdom environment.

### Setup
- Test runner config: `vitest.config.ts`
- Global test setup (jest-dom matchers): `src/__tests__/setup.ts`
- All tests live under `src/__tests__/`

### Scripts
- `npm test` — run all tests once (`vitest run`)
- `npm run test:watch` — run in watch mode
- `npm run test:coverage` — run with V8 coverage report

### Test Suites

| File                                             | What's covered                                                                                                                                                            |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `__tests__/schemas/product.schema.test.ts`       | Valid shapes, nullable fields, bad types, missing fields                                                                                                                  |
| `__tests__/schemas/firstdayissue.schema.test.ts` | Valid FDC, all-null fields, invalid shapes                                                                                                                                |
| `__tests__/schemas/tariffs.schema.test.ts`       | Valid tariffs, empty currencies, wrong value types                                                                                                                        |
| `__tests__/utils/stampHelpers.test.ts`           | UAH/USD letter keys, letter+surcharge, numeric strings, null/undefined, unknown keys, network failure, bad Zod data, empty API response, multi-year latest-year selection |
| `__tests__/components/NoSearchResults.test.tsx`  | Renders term, empty term, special characters                                                                                                                              |
| `__tests__/pages/NotFoundPage.test.tsx`          | 404 heading, error text, home link                                                                                                                                        |
| `__tests__/pages/HomePage.test.tsx`              | Loading, product list, link href, filter by name/SKU/year/case, no results, API 500/503, network error, non-Error rejection, empty array                                  |
| `__tests__/pages/CollectionPage.test.tsx`        | Loading, gallery render, link href, all filters, no results, API 500, network error, non-Error rejection                                                                  |
| `__tests__/pages/FirstDayPage.test.tsx`          | Loading, FDC render, filter by name/year/case, no results, 404 error, network error, non-Error rejection                                                                  |
| `__tests__/pages/ProductPage.test.tsx`           | Loading, StampContainer/InformationSection render, fetch URL, 404→NotFoundPage, 500/503 error, network error, non-Error rejection                                         |
| `__tests__/app/App.test.tsx`                     | Route `/`, `/collection`, `/firstday`, `/stamps/:id`, unknown→404, nav links, initial searchTerm, searchTerm propagation                                                  |

### Test Patterns
- **Fetch** is mocked per test with `vi.stubGlobal('fetch', ...)`.
- **Heavy child components** (e.g. `StampContainer`, `FirstDayCollection`, `StampImageCollectionGallery`) are replaced with lightweight stubs via `vi.mock(...)` to keep page tests focused on page-level behaviour.
- **stampHelpers** cache is reset between test groups using `vi.resetModules()` + dynamic `import()`.
- **Router context** is provided via `MemoryRouter` (or `MemoryRouter` + `Routes`/`Route` for `useParams`).
- **Negative scenarios** cover: HTTP error codes (404, 500, 503), network rejections, non-`Error` throwables, empty API arrays, invalid Zod payloads, unknown tariff keys, and missing/mistyped schema fields.

## Notes
- Copy `.env.example` to `.env.local` and fill in the Keycloak OIDC values before running locally.
- The UI assumes the backend is running on port `8080` and Keycloak on port `8180` in development.
