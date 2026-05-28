# eCollecto UI

React + Vite frontend for browsing stamps, collections, and first-day covers. Authenticated users can log in via Keycloak (Authorization Code + PKCE) to access protected features.

## Overview
- Single-page app with React Router routes for a landing page, multi-year stamp catalog, product detail, collection, and first-day views.
- Data loaded from the Java backend via REST endpoints (proxied in dev) through a dedicated API layer (`shared/api/stampsApi.ts`).
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

| Path                 | Page             | Notes                                                  |
|----------------------|------------------|--------------------------------------------------------|
| `/`                  | `LandingPage`    | Hero, how-it-works, latest-year preview                |
| `/stamps`            | `CatalogPage`    | Year-selector hub linking to per-year grids            |
| `/stamps/year/:year` | `YearStampsPage` | Full stamp grid for one release year                   |
| `/stamps/:id`        | `ProductPage`    | Stamp detail                                           |
| `/collection`        | `CollectionPage` | Multi-year personal collection grid with year selector |
| `/firstday`          | `FirstDayPage`   | First day of issue list                                |
| `/forbidden`         | inline           | 403 Access Denied                                      |
| `*`                  | `NotFoundPage`   | 404 catch-all                                          |

Protected and admin routes use `src/app/routes/ProtectedRoute.tsx` and `AdminRoute.tsx`.

## API Usage
The UI fetches data from these backend endpoints via `src/shared/api/stampsApi.ts`:

| Endpoint                      | Used by                                                                       |
|-------------------------------|-------------------------------------------------------------------------------|
| `GET /api/stamps/years`       | `CatalogPage`, `CollectionPage`, `LandingPage` — loads year list with counts  |
| `GET /api/stamps?year={year}` | `YearStampsPage`, `CollectionPage`, `LandingPage` — loads stamps for one year |
| `GET /api/stamp/:id`          | `ProductPage` — stamp detail                                                  |
| `GET /api/first-day-covers`   | `FirstDayPage`                                                                |
| `GET /api/tariffs`            | `stampHelpers.ts` — denomination formatting cache                             |
| `GET /api/me`                 | Protected profile endpoint (requires Bearer JWT)                              |

All requests go through `src/shared/api/apiClient.ts` which attaches the OIDC Bearer token from session storage when present. Development requests are proxied to `http://localhost:8080` by Vite.

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
   ├─ pages/
   │  ├─ Landing/         # LandingPage — hero + latest-year preview
   │  ├─ Catalog/         # CatalogPage (year hub) + YearStampsPage (per-year grid)
   │  ├─ Collection/      # CollectionPage — multi-year personal collection
   │  ├─ FirstDay/        # FirstDayPage
   │  ├─ Home/            # HomePage (legacy browse view)
   │  ├─ NotFound/        # NotFoundPage
   │  └─ Product/         # ProductPage — stamp detail
   ├─ shared/
   │  ├─ api/
   │  │  ├─ apiClient.ts  # Shared fetch wrapper (attaches Bearer token)
   │  │  └─ stampsApi.ts  # Stamps-specific API functions (fetchStampYears, fetchStampsByYear, …)
   │  ├─ layout/          # Header, Footer
   │  └─ utils/           # stampHelpers.ts (denomination formatting)
   └─ styles/             # Global styles (Tailwind entry)
```

### Key Modules
- `src/app/App.tsx` — Router and layout composition.
- `src/app/store.ts` — Redux Toolkit store.
- `src/app/providers/AuthProvider.tsx` — OIDC/Keycloak provider wrapping the app.
- `src/features/auth/authSlice.ts` — Auth/session Redux slice.
- `src/shared/api/apiClient.ts` — Base fetch wrapper; attaches OIDC token from session storage.
- `src/shared/api/stampsApi.ts` — Typed stamp API helpers (`fetchStampYears`, `fetchStampsByYear`, `fetchStampById`, `fetchAllStamps`).
- `src/shared/layout/Header.tsx` / `Footer.tsx` — Global navigation and footer.
- `src/shared/utils/stampHelpers.ts` — Denomination formatting with tariff lookups.
- `src/features/product/types/api.generated.ts` — Auto-generated TypeScript types from OpenAPI spec.
- `src/features/product/types/schemas.generated.ts` — Auto-generated Zod schemas from OpenAPI spec.

## Data Loading Patterns
Pages load data via the typed helpers in `src/shared/api/stampsApi.ts` (which delegate to `apiClient.ts`). Each page uses `useEffect` + `AbortController` to handle:
- Loading state (`isLoading*` flags)
- Error state (error message string)
- Cancellation on unmount via `controller.abort()`

Pages that require a two-step fetch (e.g. years list → stamps for selected year) run two separate `useEffect` hooks: one that fetches the year list on mount, and one that re-runs whenever `selectedYear` changes.

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

| File                                             | What's covered                                                                                                                                                                                                                                                                                                                                                |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `__tests__/schemas/product.schema.test.ts`       | Valid shapes, nullable fields, bad types, missing fields                                                                                                                                                                                                                                                                                                      |
| `__tests__/schemas/firstdayissue.schema.test.ts` | Valid FDC, all-null fields, invalid shapes                                                                                                                                                                                                                                                                                                                    |
| `__tests__/schemas/tariffs.schema.test.ts`       | Valid tariffs, empty currencies, wrong value types                                                                                                                                                                                                                                                                                                            |
| `__tests__/utils/stampHelpers.test.ts`           | UAH/USD letter keys, letter+surcharge, numeric strings, null/undefined, unknown keys, network failure, bad Zod data, empty API response, multi-year latest-year selection                                                                                                                                                                                     |
| `__tests__/components/NoSearchResults.test.tsx`  | Renders term, empty term, special characters                                                                                                                                                                                                                                                                                                                  |
| `__tests__/pages/NotFoundPage.test.tsx`          | 404 heading, error text, home link                                                                                                                                                                                                                                                                                                                            |
| `__tests__/pages/HomePage.test.tsx`              | Loading, product list, link href, filter by name/SKU/year/case, no results, API 500/503, network error, non-Error rejection, empty array                                                                                                                                                                                                                      |
| `__tests__/pages/CollectionPage.test.tsx`        | Years loading indicator, per-year stamp loading indicator, year selector buttons + counts, auto-selection of most recent year, year-switch re-fetch + gallery re-render, gallery render, link href, filters (name/case-insensitive/year/SKU), no-results, empty years list, years-fetch errors (HTTP/network/non-Error), stamps-fetch errors (HTTP/non-Error) |
| `__tests__/pages/FirstDayPage.test.tsx`          | Loading, FDC render, filter by name/year/case, no results, 404 error, network error, non-Error rejection                                                                                                                                                                                                                                                      |
| `__tests__/pages/ProductPage.test.tsx`           | Loading, StampContainer/InformationSection render, fetch URL, 404→NotFoundPage, 500/503 error, network error, non-Error rejection                                                                                                                                                                                                                             |
| `__tests__/app/App.test.tsx`                     | Routes `/`, `/stamps`, `/stamps/year/:year`, `/stamps/:id`, `/collection`, `/firstday`, unknown→404, `/forbidden` 403 page, nav links, initial searchTerm to Collection and Catalog, searchTerm propagation to Collection/FirstDay/Catalog                                                                                                                    |

### Test Patterns
- **API module mocking**: pages whose data-loading is delegated to `stampsApi.ts` (e.g. `CollectionPage`) mock the module with `vi.mock('…/stampsApi', () => ({ fetchStampYears: vi.fn(), fetchStampsByYear: vi.fn() }))` rather than stubbing the global `fetch`. This decouples page logic tests from HTTP plumbing.
- **Direct fetch mocking**: pages that call `fetch` directly (e.g. `HomePage`) use `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(…))`.
- **Heavy child components** (e.g. `StampContainer`, `FirstDayCollection`, `StampImageCollectionGallery`) are replaced with lightweight stubs via `vi.mock(…)` to keep page tests focused on page-level behaviour.
- **stampHelpers** cache is reset between test groups using `vi.resetModules()` + dynamic `import()`.
- **Router context** is provided via `MemoryRouter` (or `MemoryRouter` + `Routes`/`Route` for `useParams`).
- **Negative scenarios** cover: HTTP error codes (404, 500, 503), network rejections, non-`Error` throwables, empty API arrays/year lists, invalid Zod payloads, unknown tariff keys, missing/mistyped schema fields, and stamps-fetch failures independent of years-fetch failures.

## Notes
- Copy `.env.example` to `.env.local` and fill in the Keycloak OIDC values before running locally.
- The UI assumes the backend is running on port `8080` and Keycloak on port `8180` in development.
