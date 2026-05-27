# Security Features

## High-level security direction
For eCollecto, the security direction should be:
1. keep the public catalog readable without forcing authentication,
2. protect user-owned and admin-owned functionality with Spring Security + Keycloak,
3. prepare for a later BFF/API gateway model once the platform becomes multi-service,
4. harden the system against abuse, provider failures, and configuration drift.

## 1. Authentication and identity
**Recommended identity provider**
- Use Keycloak as the identity provider.
- Store user IDs, logins, and passwords in Keycloak, not in the application database.
- Do not build a custom username/password authentication subsystem in the backend unless there is a business reason to avoid Keycloak.

**Backend security model**
- Use Spring Security in resource-server mode.
- Add:
  - `spring-boot-starter-security`
  - `spring-boot-starter-oauth2-resource-server`
- Validate JWTs using issuer/JWK configuration.
- Map Keycloak roles to Spring authorities such as:
  - `ROLE_USER`
  - `ROLE_ADMIN`
  - `ROLE_AI_ADMIN`

## 2. OAuth 2.0 / OIDC flow usage
**Authorization Code + PKCE**
- Use this for the React browser application.
- It is the correct public-client flow for user sign-in.

**Client Credentials**
- Use this only for service-to-service communication:
  - AI service integrations
  - background jobs
  - internal admin automation
- Do not use client credentials from the browser frontend.

**Gateway/BFF direction**
- Once the API gateway is introduced as part of the multi-service architecture, implement it as a BFF (Backend for Frontend).
- Let the gateway exchange the authorization code with Keycloak.
- Let the browser session be maintained via Secure HttpOnly cookies.
- This reduces token exposure in the frontend runtime and centralizes browser-session handling.

## 3. Authorization model
**Role design**
- Anonymous:
  - public catalog browsing if that remains the product strategy
- USER:
  - personal collection
  - wishlist
  - preferences
  - AI features tied to personal data
- ADMIN:
  - management endpoints
  - enrichment tooling
  - operational/admin capabilities
- AI_ADMIN:
  - AI-specific administration if it needs to be distinct from broader admin privileges

**Endpoint protection direction**
- Keep public read-only catalog endpoints open initially:
  - `GET /api/stamps`
  - `GET /api/stamp/{id}`
  - `GET /api/first-day-covers`
  - `GET /api/designers`
  - `GET /api/tariffs`
- Protect user-owned endpoints such as:
  - `GET /api/me`
  - `GET /api/me/collection`
  - `POST /api/me/collection/items`
  - `DELETE /api/me/collection/items/{stampId}`
- Protect admin endpoints such as:
  - `POST /api/admin/ai/enrich-stamp/{id}`

**Implementation guidance**
- Prefer method-level security with `@EnableMethodSecurity`.
- Keep authorization rules close to service logic when ownership rules matter.

## 4. Securing the HTTP layer
**CORS**
- Allow only known frontend/browser origins.
- Keep the allowed origins environment-driven so Docker/local/prod setups stay aligned.

**CSRF and session strategy**
- For direct bearer-token APIs, stateless resource-server mode is acceptable.
- For the later BFF model with Secure HttpOnly cookies, re-evaluate CSRF protection and cookie policies carefully.

**HTTPS everywhere**
- Enforce TLS in production.
- Keep gateway/proxy and backend deployment aligned on HTTPS expectations.

## 5. Data and API-level safety
**DTO boundaries**
- Never bind external input directly to Mongo `*Document` classes.
- Keep DTO validation explicit.

**Input validation**
- Use Bean Validation for protected write endpoints and admin APIs.
- Validate IDs, filters, paging parameters, free text, and AI/admin inputs.

**Mongo safety**
- Keep using repository methods or typed query APIs.
- Do not accept arbitrary Mongo query payloads from clients.

**Error model**
- Preserve the standard error shape used by the backend:
  - `{ message, code, status }`
- Avoid leaking stack traces and internal provider details.

## 6. Gateway, abuse protection, and resilience
**Gateway responsibilities**
- Once introduced, the API gateway should own:
  - routing
  - CORS
  - request correlation
  - shared auth/token forwarding
  - rate limiting
  - optional response aggregation

**Rate limiting and abuse protection**
- Rate-limit login/session-related flows.
- Rate-limit public AI-facing and catalog endpoints that can be abused.
- Use IP-based, user-based, or token-based throttling as appropriate.

**AI-specific resilience**
- Add Circuit Breaker and Fallback patterns where the gateway or backend calls the AI service.
- AI failures must not affect availability of the core stamp catalog.

## 7. Secrets, monitoring, and operational security
**Secrets management**
- Keep Mongo credentials, Keycloak configuration, AI provider credentials, and gateway secrets in environment variables or a proper secret store.
- Prefer shared configuration through Docker Compose `.env` for local environments.

**Monitoring and auditing**
- Log auth events and privileged actions with correlation IDs.
- Track failed logins, suspicious usage spikes, and AI abuse/rate-limit breaches.

**Dependency and config hygiene**
- Keep Spring Boot, Spring Security, Mongo dependencies, and gateway/security libraries updated.
- Enable dependency vulnerability scanning in CI.
- Use SonarLint locally and SonarQube/SonarCloud in CI for security hotspots and maintainability issues.
