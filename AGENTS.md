# AGENTS.md

## Repo map
- Root is a Gradle multi-project build (`settings.gradle`) with two real modules: `backend/ecollecto-backend` and `frontend/ecollecto-ui`. Do not add app source code at the root.
- Root convenience tasks exist in `build.gradle`: `devBackend` -> `:backend:ecollecto-backend:bootRun`, `devFrontend` -> `:frontend:ecollecto-ui:npmDev`.
- Canonical sample data lives in `collection/*.json`; backend test fixtures mirror this shape under `backend/ecollecto-backend/src/test/resources/test-data`.

## Big picture
- The backend is a read-only Spring Boot + MongoDB API. Main entry: `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/EcollectoBackendApplication.java`.
- Feature packages are vertical slices: `stamp/`, `fdc/`, `designer/`, `tariff/`, each usually containing `*Document`, `*Repository`, `*Service`, `*Controller`.
- DTOs live centrally in `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/dto/` and are shaped to match the frontend payloads exactly (`doc/API.md` explicitly says this).
- The frontend is a React/Vite SPA. Routing is in `frontend/ecollecto-ui/src/app/App.tsx`; route pages live in `src/pages`, reusable UI in `src/features/product` and `src/shared`.
- Primary flow: React pages `fetch('/api/...')` -> Vite dev proxy -> Spring controllers/services -> Mongo repositories -> DTO JSON back to the UI.

## Backend conventions
- API base path is `/api`; representative endpoints are in `stamp/StampController.java`, `fdc/FirstDayCoverController.java`, `designer/DesignerController.java`, `tariff/TariffsController.java`.
- Services do nontrivial response shaping. Example: `stamp/StampService.java` bulk-loads designer IDs and flattens nested Mongo documents into `StampDto` strings such as comma-joined designers/themes.
- Error shape is `{ message, code, status }` (`dto/ErrorResponse.java`, `doc/API.md`). There is a global advice in `common/exception/GlobalExceptionHandler.java`, but several controllers also define local `@ExceptionHandler(Exception.class)` methods; preserve existing behavior when editing a controller.
- `TariffsService` is the lookup layer for year/currency/letter access; frontend denomination formatting depends on `GET /api/tariffs` returning the latest year’s currency map.
- JSON naming matters: backend tests assert snake_case fields like `stamp_id` (`StampControllerTest.java`). Avoid renaming DTO properties casually.

## Frontend conventions
- Pages use local `useState` + `useEffect` + `fetch` + `AbortController` rather than a shared data library; see `src/pages/Home/HomePage.tsx` and `src/pages/Product/ProductPage.tsx`.
- Search state is lifted to `App.tsx` and passed into route pages.
- Type definitions in `src/features/product/types/*.ts` intentionally mirror backend response fields, including mixed naming such as `stamp_id` and `stampSKU`.
- Shared denomination formatting lives in `src/shared/utils/stampHelpers.ts`; it caches `/api/tariffs` and derives display values from tariff letters like `W` or strings like `F+8.00`.
- Use the `@` alias for `src` imports when it helps (`vite.config.ts`), but existing code also uses relative imports—follow the local file’s style.

## Commands agents should prefer
- Backend dev: `./gradlew.bat :backend:ecollecto-backend:bootRun`
- Backend tests: `./gradlew.bat :backend:ecollecto-backend:test`
- Frontend dev via Gradle-managed Node: `./gradlew.bat :frontend:ecollecto-ui:npmDev`
- Frontend build/lint via Gradle: `./gradlew.bat :frontend:ecollecto-ui:npmBuild` and `./gradlew.bat :frontend:ecollecto-ui:npmLint`
- Direct npm scripts also exist in `frontend/ecollecto-ui/package.json` (`dev`, `build`, `lint`, `preview`).

## Source-of-truth files for changes
- API contract: start with `backend/ecollecto-backend/doc/API.md`, then verify against controller annotations and `backend/ecollecto-backend/openapi.yaml`.
- Runtime config: `backend/ecollecto-backend/src/main/resources/application.properties` (`server.port=8080`, Mongo URI).
- Dev proxy: `frontend/ecollecto-ui/vite.config.ts` proxies `/api` to `http://localhost:8080` (aligned with backend `server.port=8080`).
- Build tooling: backend uses Java 25 + Spring Boot 4 (`backend/ecollecto-backend/build.gradle`); frontend uses Gradle Node plugin with Node `24.7.0` and npm `11.6.0` (`frontend/ecollecto-ui/build.gradle`).
- Project roadmap: `doc/ROADMAP.md` — single canonical post-MVP delivery plan.
- Known code issues: `KNOWN_ISSUES.md` — current technical debt items and their priority.

## Change guidance specific to this repo
- If you change a backend response shape, update the matching TS type in `frontend/ecollecto-ui/src/features/product/types` and recheck all pages that fetch that endpoint.
- For new backend features, follow the existing feature-package slice instead of adding generic shared layers.
- Prefer Gradle wrapper commands from repo root; the project already exposes per-module tasks and avoids root app code.
- When documenting or fixing integration issues, call out observed doc/config drift explicitly rather than assuming the README is correct.

