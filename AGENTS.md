# AGENTS.md

## Repo map
- Root is a Gradle multi-project build (`settings.gradle`) with two real modules: `backend/ecollecto-backend` and `frontend/ecollecto-ui`. Do not add app source code at the root.
- Root convenience tasks exist in `build.gradle`: `devBackend` -> `:backend:ecollecto-backend:bootRun`, `devFrontend` -> `:frontend:ecollecto-ui:npmDev`.
- Canonical sample data lives in `collection/*.json`; backend test fixtures mirror this shape under `backend/ecollecto-backend/src/test/resources/test-data`.

## Big picture
- The backend is a Spring Boot + MongoDB API with public read-only catalog endpoints and protected user endpoints. Main entry: `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/EcollectoBackendApplication.java`.
- Feature packages are vertical slices: `stamp/`, `fdc/`, `designer/`, `tariff/`, `user/`, each usually containing `*Document`, `*Repository`, `*Service`, `*Controller` and a `*Mapper` (MapStruct).
- DTOs live centrally in `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/dto/` and are shaped to match the frontend payloads exactly (`doc/API.md` explicitly says this).
- The frontend is a React/Vite SPA. Routing is in `frontend/ecollecto-ui/src/app/App.tsx`; route pages live in `src/pages`, reusable UI in `src/features/product`, auth in `src/features/auth`, and shared utilities in `src/shared`.
- Primary flow: React pages `fetch('/api/...')` -> Vite dev proxy -> Spring controllers/services -> Mongo repositories -> DTO JSON back to the UI.

## Backend conventions
- API base path is `/api`; public catalog endpoints in `stamp/StampController.java`, `fdc/FirstDayCoverController.java`, `designer/DesignerController.java`, `tariff/TariffsController.java`; protected user endpoint in `user/UserController.java` (`GET /api/me` requires Bearer JWT).
- DTO mapping is done by **MapStruct** mappers (`@Mapper(componentModel = "spring")`): `StampMapper`, `DesignerMapper`, `FirstDayCoverMapper`, `TariffsMapper`. Services inject and call their mapper; they no longer perform manual field-by-field mapping.
- Error shape is `{ message, code, status }` (`dto/ErrorResponse.java`, `doc/API.md`). The global advice `common/exception/GlobalExceptionHandler.java` is the **sole** handler for all exceptions — no controller-local `@ExceptionHandler` methods remain. Do not add local handlers when editing controllers.
- `TariffsService` is the lookup layer for year/currency/letter access; frontend denomination formatting depends on `GET /api/tariffs` returning the latest year's currency map.
- JSON naming matters: backend tests assert snake_case fields like `stamp_id` (`StampControllerTest.java`). Avoid renaming DTO properties casually.
- Security lives in `common/security/`: `SecurityConfig.java` (OAuth2 resource-server, CORS, public/protected route rules), `JwtAuthorityConverter.java` (maps Keycloak realm roles to Spring `ROLE_USER` / `ROLE_ADMIN`), `CurrentUserService.java` (extracts Keycloak subject from the JWT).

## Frontend conventions
- Pages use local `useState` + `useEffect` + `fetch` + `AbortController` rather than a shared data library; see `src/pages/Home/HomePage.tsx` and `src/pages/Product/ProductPage.tsx`.
- Search state is lifted to `App.tsx` and passed into route pages.
- **Redux Toolkit** is used only for cross-page shared state: auth/session (`src/features/auth/authSlice.ts`, `authThunks.ts`). Local component state stays in `useState`.
- **Auth integration** uses `react-oidc-context` + `oidc-client-ts` (Authorization Code + PKCE via Keycloak). The `AuthProvider` in `src/app/providers/AuthProvider.tsx` wraps the app; `ReduxProvider.tsx` wraps Redux. Protected routes use `src/app/routes/ProtectedRoute.tsx`; admin routes use `AdminRoute.tsx`.
- Type definitions in `src/features/product/types/*.ts` intentionally mirror backend response fields, including mixed naming such as `stamp_id` and `stampSKU`.
- **Generated types**: `api.generated.ts` (via `openapi-typescript`) and `schemas.generated.ts` (via `openapi-zod-client`) are auto-generated from `backend/ecollecto-backend/openapi.yaml` by running `npm run generate` inside `frontend/ecollecto-ui`. Never edit these files manually; run `npm run generate` after any backend DTO or OpenAPI spec change.
- Zod schemas for runtime validation are in `src/features/product/types/schemas/` (thin re-exports of `schemas.generated.ts`).
- Shared denomination formatting lives in `src/shared/utils/stampHelpers.ts`; it caches `/api/tariffs` and derives display values from tariff letters like `W` or strings like `F+8.00`.
- Use the `@` alias for `src` imports when it helps (`vite.config.ts`), but existing code also uses relative imports — follow the local file's style.

## Commands agents should prefer
- Backend dev: `./gradlew.bat :backend:ecollecto-backend:bootRun`
- Backend tests: `./gradlew.bat :backend:ecollecto-backend:test`
- Frontend dev via Gradle-managed Node: `./gradlew.bat :frontend:ecollecto-ui:npmDev`
- Frontend build/lint via Gradle: `./gradlew.bat :frontend:ecollecto-ui:npmBuild` and `./gradlew.bat :frontend:ecollecto-ui:npmLint`
- Frontend type generation (after backend DTO / OpenAPI changes): `cd frontend/ecollecto-ui && npm run generate`
- Direct npm scripts also exist in `frontend/ecollecto-ui/package.json` (`dev`, `build`, `lint`, `preview`, `test`, `generate`).

## Source-of-truth files for changes
- API contract: start with `backend/ecollecto-backend/doc/API.md`, then verify against controller annotations and `backend/ecollecto-backend/openapi.yaml` (auto-generated by `OpenApiSpecTest`; CI fails if stale).
- Runtime config: `backend/ecollecto-backend/src/main/resources/application.properties` (`server.port=8080`, Mongo URI, Keycloak issuer URI).
- Dev proxy: `frontend/ecollecto-ui/vite.config.ts` proxies `/api` to `http://localhost:8080` (aligned with backend `server.port=8080`).
- Build tooling: backend uses Java 25 + Spring Boot 4 (`backend/ecollecto-backend/build.gradle`); frontend uses Gradle Node plugin with Node `24.7.0` and npm `11.6.0` (`frontend/ecollecto-ui/build.gradle`).
- Project roadmap: `doc/ROADMAP.md` — single canonical post-MVP delivery plan.
- Known code issues: `KNOWN_ISSUES.md` — current technical debt items and their priority (all resolved as of current baseline).

## Change guidance specific to this repo
- If you change a backend response shape, regenerate types (`npm run generate`) and update any manual type files in `frontend/ecollecto-ui/src/features/product/types`; recheck all pages that fetch the affected endpoint.
- After any backend DTO or controller annotation change, run `./gradlew.bat :backend:ecollecto-backend:test` to regenerate `openapi.yaml` (done by `OpenApiSpecTest`), then commit the updated spec and regenerated frontend types.
- For new backend features, follow the existing feature-package slice (add `*Document`, `*Repository`, `*Service`, `*Mapper`, `*Controller`) instead of adding generic shared layers.
- Prefer Gradle wrapper commands from repo root; the project already exposes per-module tasks and avoids root app code.
- When documenting or fixing integration issues, call out observed doc/config drift explicitly rather than assuming the README is correct.
