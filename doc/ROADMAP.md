# eCollecto — Project Roadmap

This is the single canonical post-MVP delivery plan. It covers the engineering foundations, feature delivery, and AI evolution in three tracks: **Critical**, **Features**, and **AI**.

## Current baseline

- **Repository:** Gradle multi-project — `backend/ecollecto-backend` and `frontend/ecollecto-ui`.
- **Backend stack:** Java 25, Spring Boot 4, Spring Web, Spring Data MongoDB, Validation, Springdoc OpenAPI, Lombok, JaCoCo.
- **Frontend stack:** React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 4.
- **API:** Read-only REST at `/api`, feature-sliced by domain: `stamp/`, `fdc/`, `designer/`, `tariff/`.
- **Known state:**
  - **[RESOLVED]** DTOs are flattened for UI consumption; backend/frontend payload shape alignment is critical. `StampMapper` converts nested MongoDB structures (`denomination` object → string, `designerIds` array → resolved comma-joined name string, `themes` array → comma-joined string). The full pipeline is now automated: `StampMapper` → `openapi.yaml` (via `OpenApiSpecTest`) → `api.generated.ts` + `schemas.generated.ts` (via `npm run generate`) → TypeScript types (via `z.infer<>`). A change to any mapper output field automatically propagates to frontend types on next `generate` run.
  - **[RESOLVED]** Zod schemas added for runtime validation; OpenAPI contract validation added — `openapi.yaml` is generated from controller annotations by `OpenApiSpecTest`, CI fails on drift.
  - **[SOLUTION]** Frontend uses local `useEffect` + `fetch` + `AbortController`; minimal shared state in `App.tsx`.
  - **[RESOLVED]** Browser-side `mongoose` schema files removed; plain TypeScript interfaces used instead.
  - **[RESOLVED]** Backend tests exist; frontend test coverage is absent.
  - **[RESOLVED]** Docker Compose added (MongoDB + Keycloak). 
  - **[RESOLVED]** CI added (GitHub Actions). No Mongock migrations yet. 
  - **[RESOLVED]** Redux Toolkit introduced. 
  - **[RESOLVED]** Keycloak integration complete.

---

## Track 1 — Critical Foundations
**Status: In Progress**

Engineering foundations needed before protected user features and AI integrations can be built safely.

### 1. Dockerized supporting services
- **[RESOLVED]** Add a root-level Docker Compose file for all non-app supporting services.
- **[RESOLVED]** Start with: MongoDB, Keycloak; comment out Redis placeholder (planned for AI phase).
- **[RESOLVED]** Use a shared root `.env` for backend, frontend, gateway, MongoDB, and Keycloak configuration so all environments read from one place.
- **[RESOLVED]** Add persistent volumes for MongoDB and Keycloak where local data persistence matters.
- **[RESOLVED]** Provide a seeded Keycloak realm/client import (`keycloak/realm-export.json`) for `ecollecto`, including `ecollecto-ui` and `ecollecto-backend` clients.
- **[RESOLVED]** Add bootstrap docs so a new engineer can bring up dependencies without manual installation.
- **[RESOLVED]** Keep Spring and frontend config environment-driven so local, CI, and Docker environments share the same wiring.
- Add a MongoDB migration tool (`Mongock`) before user-domain and write-flow document structures start changing.

### 2. Frontend modernization
- **[SOLUTION]** Keep functional components as the standard UI model.
- **[RESOLVED]** **Remove browser-side `mongoose` usage** from `src/features/product/schema/*` immediately — this is architecturally wrong in a browser bundle.
  - **[RESOLVED]** Replace with plain TypeScript interfaces where only typing is needed.
  - **[RESOLVED]** Replace with Zod/Yup schemas where runtime validation is needed.
- **[RESOLVED]** Introduce **Redux Toolkit** for cross-page shared state only:
  - **[RESOLVED]** auth/session, current user profile, collection / wishlist / favorites, AI chat session and recommendation results, async request status for protected features.
- **[SOLUTION]** Keep local component state in `useState`.
- **[RESOLVED]** Use **Redux thunks** for business-level async API calls: session bootstrap, profile load, collection updates, AI requests, protected route data.
- Adopt **Formik + Yup** for operationally important forms: profile settings, collection item metadata, admin enrichment forms.
- **[RESOLVED]** Continue with **React Router** — add clear route groups: public routes, authenticated routes, admin routes.
- **[RESOLVED]** Replace raw `<a href>` navigation in `Header.tsx` with `Link` / `NavLink` from `react-router-dom` to avoid full page reloads.
- **[RESOLVED]** Fix self-referencing links in `CollectionPage.tsx` and `FirstDayPage.tsx` (currently both point to the same page they are on).
- **[SOLUTION]** Continue with **Tailwind CSS** — build a shared branding layer from the Ukrposhta stamp palette using Tailwind theme tokens and reusable components.
- **[RESOLVED]** Evolve frontend folder structure toward:
  ```
  src/app/store.ts
  src/app/providers/        (Redux, theme, auth bootstrap)
  src/features/auth/
  src/features/collection/
  src/features/wishlist/
  src/features/ai/          (stub)
  src/shared/api/           (API client wrappers)
  src/shared/theme/         (Tailwind tokens, brand palette)
  ```

### 3. CI quality gates and code health
- **[RESOLVED]** Add CI (e.g., GitHub Actions) running:
  - **[RESOLVED]** backend tests
  - **[RESOLVED]** frontend lint, build, and tests
  - **[RESOLVED]** OpenAPI / contract validation (fail if generated spec diverges from committed `openapi.yaml`)
  - **[RESOLVED]** dependency vulnerability scanning (Gradle + npm)
  - **[RESOLVED]** Static analysis for maintainability, bugs, code smells, and security hotspots
- **[RESOLVED]** Fail CI on critical and high-severity vulnerabilities once the initial baseline is stabilized.
- **[RESOLVED]** CodeQL running in CI.
- **[RESOLVED]** Add frontend testing: **Vitest + React Testing Library**.
  - **[RESOLVED]** Cover: route behaviour, error states, loading states, search filtering, tariff denomination formatting, and Zod schema validation (positive and negative scenarios). 108 tests across 11 suites in `src/__tests__/`.

### 4. Contract governance and backend consistency
- **[RESOLVED]** Preserve the global error model `{ message, code, status }`. `ErrorResponse.java` defines the shape; `GlobalExceptionHandler` centralises all app-level exceptions (404, 400, 403, 401, 500). JWT filter-chain 401/403 are now also handled: `SecurityConfig` configures `authenticationEntryPoint` and `accessDeniedHandler` on the `oauth2ResourceServer` so Spring Security filter-level auth failures use the same `ErrorResponse` JSON, bypassing the default `WWW-Authenticate` header response.
- **[RESOLVED]** Move toward centralized exception handling in `GlobalExceptionHandler`; keep controller-local handlers only where a feature truly needs a custom contract.
- **[RESOLVED]** Add explicit handling for: access denied / unauthorized (403/401), validation errors (400), AI provider timeouts/failures, Keycloak/token parsing failures.
- **[RESOLVED]** Contract source-of-truth hierarchy (updated): controller annotations + `OpenApiConfig.java` **drive** `openapi.yaml` (auto-generated by `OpenApiSpecTest`, committed, CI fails if stale). `API.md` is a human-readable narrative supplement — not a spec. Any controller/DTO change must be followed by `./gradlew :backend:ecollecto-backend:test` to regenerate and commit `openapi.yaml`.
  - **[RESOLVED]** Rule: any backend DTO change requires matching TypeScript updates in `frontend/ecollecto-ui/src/features/product/types`. Automated via `npm run generate` (`openapi-typescript` + `openapi-zod-client`). Backend DTO annotations drive `openapi.yaml` (via `OpenApiSpecTest`), which drives both `api.generated.ts` and `schemas.generated.ts`.
  - **[RESOLVED]** Zod schemas in `types/schemas/` are the runtime validation layer. `api.generated.ts` is auto-generated from `openapi.yaml` by `openapi-typescript` (`npm run generate:types`). CI fails if either file is stale. Fixed a schema name collision bug (`StampDto` inner classes `ImagesDto`/`ReleaseDto` were overwritten by `FirstDayCoverDto`'s identically-named inner classes in the generated spec — resolved with `@Schema(name=...)`).
  - **[RESOLVED]** `schemas.generated.ts` is auto-generated from `openapi.yaml` by `openapi-zod-client` (`npm run generate:schemas`). Backend DTOs now carry `@Schema(requiredMode = REQUIRED, nullable = true)` annotations so the generated spec encodes required/nullable correctly. `npm run generate` regenerates both files. Schema adapter files (`schemas/*.schema.ts`) are thin re-exports of the generated schemas.
  - **[RESOLVED]** Add lightweight contract checks in CI for key DTO payloads: `StampDto`, `FirstDayCoverDto`, `TariffsDto` — enforced via `api.generated.ts` and `schemas.generated.ts` drift check in CI.
- **[RESOLVED]** Move manual DTO mapping from service methods into dedicated **MapStruct** mappers (`@Mapper(componentModel = "spring")`).
- **[RESOLVED]** Replace `@Data` on Mongo `@Document` classes with explicit `@Getter`, `@Setter`, and controlled `@ToString` / `@EqualsAndHashCode`.

### 5. Additional critical cleanup
- **[RESOLVED]** Introduce a **Gradle version catalog** (`gradle/libs.versions.toml`) for consistent plugin and library versions across modules.
- **[RESOLVED]** Align TypeScript and ESLint targets: `tsconfig.app.json` uses ES2022, `tsconfig.node.json` uses ES2023, `eslint.config.js` uses `ecmaVersion: 2020`.

---

## Track 2 — Features
**Status: Next Iteration**

Functional expansion centered on user identity, authorization, and protected features.

### 1. User domain model
Define user-owned business entities explicitly before adding security broadly:
- user profile
- owned stamps / collection items
- wishlist
- favorites
- AI chat history
- audit/activity records

### 2. Product access model
- **[RESOLVED]** Keep catalog browsing public (public can remain publicly explorable).
- **[RESOLVED]** Add protected endpoints only for user-owned and admin-owned data.

**Public catalog endpoints (keep open):**
- **[RESOLVED]** `GET /api/stamps`, `GET /api/stamp/{id}`, `GET /api/first-day-covers`, `GET /api/designers`, `GET /api/tariffs`

**Protected user endpoints:**
- **[RESOLVED]** `GET /api/me`, `GET /api/me/collection`, `POST /api/me/collection/items`, `DELETE /api/me/collection/items/{stampId}`, `GET /api/me/wishlist`, `POST /api/me/wishlist/items`, `GET /api/me/recommendations`

**Protected admin endpoints:**
- `POST /api/admin/ai/enrich-stamp/{id}`

### 3. Security architecture
- **[RESOLVED]** Use **Keycloak** as the identity provider. Store credentials in Keycloak; persist only application-specific metadata in Mongo.
- **[RESOLVED]** Use **Spring Security** in resource-server mode:
  - **[RESOLVED]** `spring-boot-starter-security`
  - **[RESOLVED]** `spring-boot-starter-oauth2-resource-server`
  - **[RESOLVED]** JWT validation via issuer/JWK configuration
  - **[RESOLVED]** JWT-to-authority mapping for `ROLE_USER`, `ROLE_ADMIN`, `ROLE_AI_ADMIN`
  - **[RESOLVED]** Use `@EnableMethodSecurity` and keep authorization rules close to service logic where ownership rules matter
- **[RESOLVED]** Create a dedicated `common/security/` package for: resource-server config, JWT authority mapping, current-user extraction, protected endpoint rules.
- **[RESOLVED]** Add OpenAPI security schemes for protected endpoints.
- **[RESOLVED]** Use `@AuthenticationPrincipal Jwt jwt` or a dedicated current-user abstraction to extract the Keycloak subject.
- **[RESOLVED]** Avoid old Keycloak-specific Spring adapters — use standard OAuth 2.0 / OIDC Spring Security support.

### 4. OAuth 2.0 flow selection
- **[RESOLVED]** **Authorization Code + PKCE** for the React SPA: browser-safe public-client flow, no frontend client secret, supports SSO/refresh/logout/OIDC claims.
- **Client Credentials** for service-to-service only: admin automation, backend jobs, AI microservice integrations. Do not use from the browser.

### 5. Keycloak realm setup
- **[RESOLVED]** Realm: `ecollecto`
- **[RESOLVED]** Clients: `ecollecto-ui` (public, Auth Code + PKCE, redirect `http://localhost:5173/*`), `ecollecto-backend` (bearer-only resource server), `ecollecto-ai-service` (confidential, client credentials — stubbed for AI phase)
- **[RESOLVED]** Realm roles: `user`, `admin`, `ai-admin`

### 6. Frontend security integration
- **[RESOLVED]** Add an OIDC client library (`keycloak-js` or a standards-based OIDC React wrapper).
- **[RESOLVED]** Keep auth session in Redux Toolkit.
- **[RESOLVED]** Add route guards for authenticated and admin-only pages.
- **[RESOLVED]** Add token refresh and logout handling.
- **[RESOLVED]** Keep unauthenticated browsing for public catalog routes.
- **HTTP layer rules:**
  - **[RESOLVED]** CORS: allow only known frontend origins; keep allowed origins environment-driven.
  - **[RESOLVED]** For direct bearer-token APIs: stateless resource-server mode (no sessions, CSRF disabled).
  - For the later BFF model with Secure HttpOnly cookies: re-evaluate CSRF protection and cookie policies carefully.
  - **[SOLUTION]** Enforce TLS in production.

### 7. Public catalog improvements (parallel track)
- Better search and filtering on public catalog endpoints with URL-friendly filter/sort state.
- Visual indicators on catalog items showing whether an authenticated user already owns or wishlisted an item.
- Extend read-only catalog endpoints carefully without breaking existing DTO shape contracts.

---

## Track 3 — AI
**Status: Next Half-Year Plan**

AI capabilities to be added after the platform has stable infrastructure, identity, and protected user data.

### 1. Best-fit AI additions for eCollecto
1. Natural-language search over stamps and first-day covers
2. Personalized recommendations for signed-in users
3. Collection assistant chatbot
4. Admin metadata enrichment
5. Image-based stamp identification (later)

See `backend/ecollecto-backend/doc/features/AI_list.md` for detailed feature specifications.

### 2. AI architecture
- Target topology: **frontend → API gateway / BFF → `ecollecto-backend` → `ecollecto-ai-service`**
- Keep `ecollecto-backend` focused on catalog/domain APIs and user-owned data.
- Move all AI-specific concerns into `ecollecto-ai-service`: prompt orchestration, provider integrations, embeddings, vector search, RAG pipelines, inference-heavy workflows, AI-specific rate limiting and provider-failure handling.
- The **API gateway / BFF** owns: routing, CORS, request correlation, rate limiting, shared auth/token forwarding, optional response aggregation. Do not put catalog logic or AI orchestration logic into the gateway.
- Implement the gateway as a **BFF** for browser-facing traffic: gateway exchanges the authorization code with Keycloak; browser session maintained via Secure HttpOnly cookies; reduces token exposure in the frontend runtime.
- Add **Circuit Breaker and Fallback** patterns at the gateway or the calling backend boundary. AI failures must never affect the core stamp catalog.

### 3. Phased AI rollout

**Phase 1 — low risk, high value**
- Natural-language search (LLM to structured filters) and heuristic recommendations (series, designer, year, theme).
- Admin metadata enrichment using LLM APIs.
- Introduce `ecollecto-ai-service` as the target runtime boundary even for a small initial implementation.
- Introduce **Redis** for: AI response caching, rate limiting, short-lived conversational state, async job status.

**Phase 2 — authenticated AI experiences**
- Personalized recommendations from user collection and wishlist data.
- User-aware chat assistant with per-user history and saved prompts.
- API gateway introduction as the single browser-facing entry point for multi-service traffic.

**Phase 3 — advanced AI platform**
- Embeddings + vector search, RAG over stamp/designer/tariff knowledge.
- Image recognition microservice.
- **RabbitMQ** for async enrichment and background AI workflows.
- **Observability stack** (metrics, logs, tracing, latency, token usage, cost visibility).
- **Qdrant** or equivalent vector database for semantic retrieval, similarity recommendations, and RAG.
- Moderation, guardrails, and usage quotas.

### 4. AI security rules
- AI endpoints use authenticated user context once user-specific features exist.
- Admin enrichment endpoints: `ROLE_ADMIN` protected.
- Never trust LLM output directly — validate structured responses before persisting them.
- Log provider latency, failure rate, token usage, and cost.
- Route frontend AI traffic through the API gateway for consistent auth, rate limits, and correlation.
- Use fallback responses / graceful degradation for AI failures so non-AI catalog capabilities continue working.

### 5. Secrets, monitoring, and operational security
- Keep Mongo credentials, Keycloak config, AI provider credentials, and gateway secrets in environment variables or a proper secret store.
- Use Docker Compose `.env` for local environments.
- Log auth events and privileged actions with correlation IDs.
- Track failed logins, suspicious usage spikes, and AI rate-limit breaches.
- Keep Spring Boot, Spring Security, Mongo, and gateway/security libraries updated; enable dependency vulnerability scanning in CI.

---

## Delivery order summary

1. **Critical foundations** — Dockerized services, frontend modernization, CI quality gates, contract governance, immediate cleanup (Mongoose removal, exception consolidation, DTO mappers).
2. **Features** — User domain model, Keycloak + Spring Security resource server, OAuth flows, protected backend/frontend features, collection/wishlist/favorites.
3. **AI** — API gateway introduction, separate AI service, search, recommendations, enrichment, assistant, then advanced AI platform (Redis → RabbitMQ → Qdrant → observability).

### Executive approach
Do **not** rewrite the UI. Work incrementally:
- Keep the current public catalog working throughout all changes.
- Standardize local infrastructure with Docker for MongoDB, Keycloak, and future services.
- Introduce Redux Toolkit only for cross-page authenticated state.
- Add vulnerability checks and Sonar analysis early.
- Add AI features only after user identity and protected data models are stable.
