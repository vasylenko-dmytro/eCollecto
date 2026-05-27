# Refactor Roadmap

## Overall direction
Refactor the platform in phases so the current public catalog remains stable while the codebase becomes ready for Dockerized infrastructure, Keycloak-based security, a separate AI service, and multi-service routing.

## 1. Backend architecture refactor (Spring Boot)
**Keep the existing feature-sliced structure and extend it deliberately**
- Current vertical slices (`stamp/`, `fdc/`, `designer/`, `tariff/`) are the right direction.
- Continue adding new domains in the same style:
  - `user/`
  - `collection/`
  - `security/`
  - `ai/` only for temporary isolation if AI work starts before the separate AI service exists
  - `common/` for shared exception, config, and infrastructure code

**Enforce clear responsibilities inside each slice**
- Controller layer: HTTP mapping, status codes, request validation entry points.
- Service layer: business logic, DTO shaping, orchestration.
- Repository layer: Mongo access only.
- DTOs stay separate from Mongo `*Document` classes.

**Centralize cross-cutting concerns**
- Keep the standard error shape `{ message, code, status }`.
- Move toward one consistent `GlobalExceptionHandler`, with local controller handlers only when a feature truly needs a custom contract.
- Consolidate shared config into `common/` packages for:
  - Mongo configuration
  - security configuration
  - serialization/deserialization rules
  - CORS and HTTP-level concerns

## 2. Contracts and API consistency
**Treat backend responses as frontend contracts**
- Keep DTOs aligned with the existing React payload expectations.
- Treat these as the contract sources of truth together:
  - `doc/API.md`
  - controller annotations
  - `openapi.yaml`
- Any DTO change must be reflected in `frontend/ecollecto-ui/src/features/product/types`.

**Preserve the current public catalog shape while extending safely**
- Keep existing read-only catalog endpoints stable.
- Add new protected feature endpoints under clear namespaces such as `/api/me/**` and `/api/admin/**`.
- Add contract checks in CI for critical DTOs such as `StampDto`, `FirstDayCoverDto`, and `TariffsDto`.

## 3. Infrastructure and configuration refactor
**Move local infrastructure to Docker Compose**
- Add a root-level Docker Compose setup for supporting services:
  - MongoDB
  - Keycloak
  - future AI service
  - optional Redis, RabbitMQ, Qdrant, observability stack
- Use a shared root `.env` file so backend, frontend, gateway, MongoDB, and Keycloak consume aligned configuration.
- Resolve the current `8080` vs `8085` drift during this step rather than keeping multiple hard-coded values.

**Introduce MongoDB migrations early**
- Add a migration tool such as `Mongock` before user-domain and AI-related data structures start changing frequently.
- Use migrations for:
  - document shape changes
  - backfills
  - bulk cleanup jobs
  - repeatable environment bootstrap

## 4. Security-ready refactor
**Prepare the backend for Keycloak and Spring Security resource-server mode**
- Create a dedicated `security/` package for:
  - resource-server configuration
  - JWT authority mapping
  - current-user extraction helpers
  - protected endpoint rules
- Design the code so public catalog APIs can remain open while user-owned and admin-owned endpoints are protected.
- Keep OAuth flow selection and browser-session concerns separate from domain logic.

## 5. Frontend refactor direction
**Refactor toward a clear feature structure**
- Evolve the frontend toward:
  - `features/auth/`
  - `features/collection/`
  - `features/ai/`
  - `shared/api/`
  - `shared/theme/`
- Keep functional components.
- Use Redux Toolkit for shared cross-page state and thunks for business-level async API calls.

**Fix current frontend red flags early**
- Treat browser-side `mongoose` schemas in `frontend/ecollecto-ui/src/features/product/schema/*` as an immediate-priority cleanup item.
- Replace them with:
  - plain TypeScript interfaces when only typing is needed
  - Zod/Yup schemas when runtime validation is needed
- Do not keep backend ORM/data-layer concepts in the browser bundle.

## 6. AI-stage platform refactor
**Plan for a separate AI service instead of permanently embedding AI in the main backend**
- Preferred target architecture:
  - frontend
  - API gateway / BFF
  - `ecollecto-backend`
  - `ecollecto-ai-service`
- Keep the current backend focused on catalog, user domain, and protected business APIs.
- Move AI concerns into the separate AI service:
  - prompt orchestration
  - provider integrations
  - embeddings / vector search
  - RAG workflows
  - inference-heavy tasks

**Design for resilience**
- Add Circuit Breaker and Fallback patterns where the main backend or gateway calls the AI service.
- AI failures must never break the core stamp catalog.

## 7. Quality gates and testing
**Backend**
- Keep service tests and controller contract tests strong.
- Add checks around protected endpoint behavior as security is introduced.

**Frontend**
- Add tests for:
  - home/catalog flows
  - product details
  - collection features
  - auth guards
  - AI-related state transitions

**CI**
- Run:
  - backend tests
  - frontend lint, build, and tests
  - dependency vulnerability scanning
  - Sonar static analysis
  - API contract validation

## 8. Refactor roadmap (order of work)
1. Stabilize DTOs, controllers, and contract documentation for the current public catalog.
2. Move supporting services to Docker Compose and align configuration via a shared root `.env` file.
3. Add `Mongock` before the user domain and protected write flows start changing Mongo document structures.
4. Remove browser-side `mongoose` from the React app and replace it with TS interfaces or Zod/Yup.
5. Introduce Redux Toolkit, thunks, API modules, and frontend tests.
6. Add Keycloak/Spring Security resource-server integration for protected user/admin endpoints.
7. Introduce the API gateway/BFF and the separate AI service as part of the AI platform rollout.
8. Add Redis, then later RabbitMQ/Qdrant/observability as AI needs become real.
