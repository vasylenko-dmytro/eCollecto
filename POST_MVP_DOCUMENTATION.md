# Post-MVP Documentation

This document reorganizes the roadmap from `PROJECT_RECOMMENDATIONS.md` into post-MVP delivery tracks.

## Current baseline
- Repository shape: Gradle multi-project with `backend/ecollecto-backend` and `frontend/ecollecto-ui`.
- Backend stack today: Java 25, Spring Boot 4, Spring Web, Spring Data MongoDB, Validation, Springdoc OpenAPI, Lombok, JaCoCo.
- Frontend stack today: React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 4.
- Current technical observations that affect post-MVP work:
  - API is read-only and feature-sliced by domain (`stamp`, `fdc`, `designer`, `tariff`).
  - DTOs are flattened for UI consumption; backend/frontend payload shape alignment is important.
  - Frontend uses local `useEffect` + `fetch` + `AbortController`, with minimal shared state in `src/app/App.tsx`.
  - `vite.config.ts` proxies `/api` to `8085`, while backend docs and `application.properties` use `8080`.
  - Frontend still contains browser-side `mongoose` schema files, which should be treated as legacy until proven necessary.
  - Backend has tests; frontend test coverage is currently absent.

## Critical
**Status:** In Progress

This track covers the engineering foundations that should be strengthened before the platform grows with protected user features and AI integrations.

### 1. Dockerized supporting services
- Create a root-level Docker Compose setup for all non-app supporting services.
- Start with:
  - MongoDB
  - Keycloak
  - optional future services such as AI service, vector store, or SonarQube
- Keep Spring and frontend configuration environment-driven so local, CI, and containerized environments follow the same wiring pattern.
- Add persistent volumes for MongoDB and Keycloak where local data persistence is useful.
- Provide seeded Keycloak realm/client import files for `ecollecto`, including `ecollecto-ui` and `ecollecto-backend` clients.
- Add bootstrap instructions so a new engineer can bring up all supporting services without manual installation.
- Use Docker Compose as the default way to standardize local service setup and reduce environment drift.

### 2. Frontend modernization
- Keep functional components as the standard UI model.
- Introduce Redux Toolkit for shared cross-page state only:
  - auth/session
  - current user profile
  - collection / wishlist / favorites
  - AI chat session and recommendation results
  - async request status for protected user features
- Keep local UI state in `useState` where state is component-specific.
- Use Redux thunks for business-level async API calls such as session bootstrap, profile load, collection updates, AI requests, and protected route data loading.
- Continue with Tailwind CSS instead of introducing another component framework.
- Build a shared branding layer from the Ukrposhta stamp-site palette using Tailwind theme tokens, shared utility classes, and reusable components/layout patterns.
- Apply the branded Tailwind system first to new authenticated pages such as profile, collection management, protected views, and AI assistant screens.
- Use Formik + Yup for operational forms such as profile settings, collection item notes, admin enrichment forms, and other validation-heavy flows.
- Continue using React Router with clearer route groups:
  - public routes
  - authenticated routes
  - admin routes
- Evolve the frontend structure toward:
  - `src/app/store.ts`
  - `src/app/providers/`
  - `src/features/auth/`
  - `src/features/collection/`
  - `src/features/ai/`
  - `src/shared/api/`
  - `src/shared/theme/`

### 3. CI quality gates and code health
- Add CI checks for:
  - backend tests
  - frontend build
  - frontend lint
  - OpenAPI / contract validation
  - dependency vulnerability scanning
  - Sonar static analysis for maintainability, bugs, code smells, and security hotspots
- Add backend dependency vulnerability checks for Gradle dependencies.
- Add frontend dependency vulnerability checks for npm dependencies.
- Fail CI on critical and high-severity vulnerabilities once the initial baseline is stabilized.
- Use SonarLint locally in IDEs for immediate feedback.
- Use SonarQube or SonarCloud in CI for centralized analysis and reporting.
- Add security-focused checks for new auth, Docker, and AI-related code so secrets, weak defaults, and risky dependency changes are caught early.

### 4. Contract governance and backend engineering consistency
- Preserve the global error model `{ message, code, status }`.
- Move toward centralized exception handling in `GlobalExceptionHandler`.
- Keep controller-local exception handlers only where a feature truly requires a custom contract.
- Add explicit handling for:
  - access denied / unauthorized
  - validation errors
  - AI provider timeouts/failures
  - Keycloak/token parsing failures
- Treat these files as the contract sources of truth together:
  - `backend/ecollecto-backend/doc/API.md`
  - controller annotations
  - `backend/ecollecto-backend/openapi.yaml`
- Require matching TypeScript updates in `frontend/ecollecto-ui/src/features/product/types` whenever backend DTOs change.
- Add lightweight contract checks in CI for key DTO payloads such as `StampDto`, `FirstDayCoverDto`, and `TariffsDto`.

### 5. Additional critical cleanup items
- Remove or quarantine browser-side `mongoose` usage in `frontend/ecollecto-ui/src/features/product/schema/*` unless it has a proven runtime purpose.
- Replace frontend schema-like artifacts with plain TypeScript models or validation schemas where appropriate.
- Add frontend testing with Vitest + React Testing Library.
- Cover route behavior, auth guards, collection flows, AI chat state transitions, and tariff formatting.
- Reconcile configuration drift:
  - backend port `8080` vs Vite proxy `8085`
  - backend README AI wording vs actual dependencies
- Reassess whether Java 25 + Spring Boot 4 is the long-term enterprise baseline the team wants, or whether an LTS-aligned baseline would reduce operational risk.

## Features
**Status:** Next Iteration (Soon)

This track covers the next functional expansion of the product, centered on user identity, authorization, and protected features.

### 1. Introduce a real user domain
Before security is added broadly, define user-owned business entities explicitly:
- user profile
- owned stamps / collection items
- wishlist
- favorites
- AI chat history
- audit/activity records

### 2. Product access model
- Keep catalog browsing public if the product should remain publicly explorable.
- Add protected endpoints only for user-owned and admin-owned data.
- Example protected feature endpoints:
  - `GET /api/me`
  - `GET /api/me/collection`
  - `POST /api/me/collection/items`
  - `DELETE /api/me/collection/items/{stampId}`
  - `GET /api/me/recommendations`
- Keep public catalog endpoints public initially:
  - `GET /api/stamps`
  - `GET /api/stamp/{id}`
  - `GET /api/first-day-covers`
  - `GET /api/designers`
  - `GET /api/tariffs`

### 3. Security architecture
- Use Keycloak as the identity provider.
- Use Spring Security as the backend resource-server security layer.
- Store user IDs, logins, and passwords in Keycloak rather than in the application database.
- Avoid old Keycloak-specific Spring adapters; use standard OAuth 2.0 / OIDC support in Spring Security.
- Backend implementation should add:
  - `spring-boot-starter-security`
  - `spring-boot-starter-oauth2-resource-server`
  - issuer/JWK-based JWT validation
  - JWT-to-authority mapping for roles such as:
    - `ROLE_USER`
    - `ROLE_ADMIN`
    - `ROLE_AI_ADMIN`
- Create a dedicated security package, for example `common/security/`.
- Add OpenAPI security schemes for protected endpoints.
- Use `@AuthenticationPrincipal Jwt jwt` or a dedicated abstraction to extract current user identity.
- Persist only application-specific user metadata in Mongo; credentials remain only in Keycloak.

### 4. OAuth 2.0 flow usage
#### Authorization Code + PKCE
Use this for the React SPA:
- browser-safe public-client flow
- no frontend client secret
- supports user sign-in, refresh, logout, and OIDC identity claims
- SPA sends the access token to the backend as a bearer token

#### Client Credentials
Use this only for service-to-service access:
- admin automation
- backend jobs
- AI service integrations
- internal protected APIs

Do not use client credentials from the browser frontend, because that flow identifies the client application rather than the user.

### 5. Keycloak realm and client setup
Create at least:
- Realm: `ecollecto`
- Clients:
  - `ecollecto-ui` - public client with authorization code + PKCE
  - `ecollecto-backend` - backend resource server audience
  - `ecollecto-ai-service` - confidential client for service-to-service access if AI is split out
- Roles:
  - `user`
  - `admin`
  - `ai-admin`

### 6. Frontend security integration
- Add an OIDC client library such as `keycloak-js` or a standards-based OIDC React wrapper.
- Keep auth session state in Redux Toolkit.
- Add route guards for authenticated and admin-only pages.
- Add token refresh and logout handling.
- Keep unauthenticated browsing for public catalog routes if product strategy requires it.
- Align protected frontend routes with backend authorization boundaries.

## AI
**Status:** Next Half-Year Plan

This track covers AI capabilities that should be added after the platform has stable infrastructure, identity, and protected user data.

### 1. Best-fit AI additions for eCollecto
Prioritize the following AI opportunities:
1. natural-language search over stamps and first-day covers
2. personalized recommendations for signed-in users
3. collection assistant chatbot
4. admin metadata enrichment
5. image-based stamp identification later

These directions align with `backend/ecollecto-backend/doc/features/AI_list.md`.

### 2. Phased AI rollout
#### Phase 1 - lower risk / high value
- natural-language search translated into structured filters
- heuristic recommendations using series, designer, year, and theme
- admin metadata enrichment

#### Phase 2 - authenticated AI experiences
- personalized recommendations from user collection and wishlist data
- user-aware chat assistant
- per-user chat history and saved prompts

#### Phase 3 - larger AI platform investments
- embeddings + vector search
- RAG over stamp, designer, and tariff knowledge
- image recognition microservice
- moderation, guardrails, and usage quotas

### 3. AI architecture
- Keep Spring Boot as the main API/orchestration layer.
- Do not mix all AI logic directly into the core catalog code.
- Start with a dedicated backend boundary such as:
  - `ai/controller`
  - `ai/service`
  - `ai/dto`
- Split into a separate `ai-service` once model orchestration, provider integrations, vector search, or inference load becomes large enough.
- Keep future AI service integration compatible with Dockerized local infrastructure and protected service-to-service communication.

### 4. AI security and operational rules
- AI endpoints should use authenticated user context once user-specific features exist.
- Admin enrichment endpoints must be role-protected.
- Never trust LLM output directly; validate structured responses before storing them.
- Log provider latency, failure rates, token usage, and cost.
- Treat AI rollout as dependent on the completion of core identity, authorization, and platform-quality work from the earlier sections.

## Suggested high-level delivery order
1. Critical foundations: Dockerized services, frontend modernization, CI quality gates, contract governance, cleanup work.
2. Features: user domain, Keycloak/Spring Security, OAuth flows, protected backend/frontend features.
3. AI: search, recommendations, enrichment, assistant, and later advanced AI platform capabilities.

