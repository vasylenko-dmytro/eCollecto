# eCollecto — GitHub Copilot Agent Prompt

> Вставь этот промпт в чат GitHub Copilot (Agent mode) в IntelliJ IDEA.
> Модель: Claude Sonnet 4.6 (или последняя доступная Sonnet).

---

## CONTEXT

You are working as an autonomous engineering agent on the **eCollecto** project — a Ukrainian stamp collection application.

### Repository structure
```
ecollecto/
├── backend/ecollecto-backend/     # Java 25 + Spring Boot 4 + MongoDB REST API
├── frontend/ecollecto-ui/         # React 19 + Vite 7 + TypeScript + Tailwind CSS 4
├── collection/*.json              # Sample catalog data (source of truth for test fixtures)
└── settings.gradle                # Gradle multi-project root
```

### Current stack (confirmed)
- **Backend:** Java 25, Spring Boot 4, Spring Web, Spring Data MongoDB, Spring Validation, Springdoc OpenAPI, Lombok, JaCoCo
- **Frontend:** React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 4
- **API:** Read-only REST, base path `/api`, feature-sliced: `stamp/`, `fdc/`, `designer/`, `tariff/`
- **DTOs:** Flattened for UI, mixed naming: `stamp_id` (snake_case), `stampSKU` (camelCase) — do NOT rename these
- **Error shape:** `{ message, code, status }` — preserve everywhere

### Confirmed issues from codebase analysis
1. `vite.config.ts` proxies `/api` to `http://localhost:8085`, but `application.properties` uses port `8080` — **config drift**
2. `frontend/ecollecto-ui/src/features/product/schema/*` contains `mongoose` schemas — **architecturally wrong in a browser SPA**
3. `CollectionPage.tsx` loads `/api/stamps` (public catalog) — **no real user collection model exists yet**
4. Backend README mentions Spring AI MCP, but Spring AI is **not in build.gradle** — doc drift
5. Error handling is split: `GlobalExceptionHandler` + controller-local `@ExceptionHandler` — **inconsistent**
6. No frontend tests exist; backend has JUnit + JaCoCo
7. No Docker Compose, no CI, no Mongock migrations, no Redux, no Keycloak integration

---

## EXECUTIVE STRATEGY

Do **not** rewrite the UI. Work incrementally:
1. Keep the public catalog working throughout all changes
2. Fix critical cleanup issues first
3. Dockerize supporting services (MongoDB, Keycloak)
4. Add user domain model + Spring Security + Keycloak
5. Introduce Redux Toolkit for cross-page auth/collection state
6. Add CI quality gates and vulnerability scanning
7. Add AI features only after identity and protected data models are stable

---

## PHASE 1 — CRITICAL CLEANUP

### 1.1 Fix port drift
- Read `backend/ecollecto-backend/src/main/resources/application.properties`
- Read `frontend/ecollecto-ui/vite.config.ts`
- Correct port is `8080`
- Create root-level `.env`:
  ```env
  BACKEND_PORT=8080
  MONGO_PORT=27017
  KEYCLOAK_PORT=8180
  MONGO_URI=mongodb://localhost:27017/ecollecto
  KEYCLOAK_ISSUER=http://localhost:8180/realms/ecollecto
  ```
- Update `vite.config.ts` to proxy `/api` to `http://localhost:8080`
- Add a comment: `// Fixed: was incorrectly pointing to 8085, backend runs on 8080`
- Update backend README if it still references the wrong port

### 1.2 Remove browser-side Mongoose
- Read all files under `frontend/ecollecto-ui/src/features/product/schema/`
- For each schema: identify what it models → create a matching TypeScript interface in `frontend/ecollecto-ui/src/features/product/types/`
- Remove the `mongoose` import from the schema files
- Check `frontend/ecollecto-ui/package.json`: if `mongoose` is listed as a dependency, remove it
- Delete the schema files after all types are migrated
- Run `npm run build` in `frontend/ecollecto-ui` to verify no regressions

### 1.3 Centralize exception handling
- Read `GlobalExceptionHandler.java`
- Read each controller for local `@ExceptionHandler(Exception.class)` methods
- Move all handlers into `GlobalExceptionHandler`
- Ensure these cases are covered with the `{ message, code, status }` shape:
  - `EntityNotFoundException` / custom not-found → 404
  - `MethodArgumentNotValidException` → 400 with field-level detail
  - `AccessDeniedException` → 403
  - Generic `Exception` → 500
  - (stub) `AuthenticationException` → 401 (needed for Phase 4)
- Remove controller-local handlers after consolidation
- Run `./gradlew :backend:ecollecto-backend:test` to verify

### 1.4 Reconcile backend README AI drift
- Read `backend/ecollecto-backend/README.md`
- Read `backend/ecollecto-backend/build.gradle`
- Remove or reword the Spring AI MCP mention if the dependency is not present
- Add a `// TODO Phase AI: Spring AI will be added here` comment in build.gradle

---

## PHASE 2 — DOCKER COMPOSE + INFRASTRUCTURE

### 2.1 Root-level Docker Compose
Create `docker-compose.yml` at the repo root:

```yaml
services:
  mongodb:
    image: mongo:7
    ports:
      - "${MONGO_PORT:-27017}:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: ecollecto

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    ports:
      - "${KEYCLOAK_PORT:-8180}:8080"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    command: start-dev --import-realm
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json

  # redis:
  #   image: redis:7-alpine
  #   ports:
  #     - "6379:6379"
  #   # Planned for: AI response caching, rate limiting, short-lived chat session state

volumes:
  mongo_data:
```

### 2.2 Keycloak realm export
Create `keycloak/realm-export.json` with:
- Realm: `ecollecto`
- Client `ecollecto-ui`: public client, Authorization Code + PKCE, redirect URIs `http://localhost:5173/*`
- Client `ecollecto-backend`: bearer-only resource server audience
- Client `ecollecto-ai-service`: confidential client, client credentials (stubbed for later)
- Realm roles: `user`, `admin`, `ai-admin`
- Test user: username `testuser`, password `password`, role `user`
- Test admin: username `testadmin`, password `admin`, roles `user` + `admin`

### 2.3 Mongock migration setup
Add to `backend/ecollecto-backend/build.gradle`:
```groovy
implementation 'io.mongock:mongock-springboot-v3:5.4.4'
implementation 'io.mongock:mongodb-springdata-v4-driver:5.4.4'
```

Create `src/main/java/com/vasylenko/ecollectobackend/migration/M001_CreateIndexes.java`:
```java
@ChangeUnit(id = "create-user-domain-indexes", order = "001", author = "ecollecto")
public class M001_CreateIndexes {
    @Execution
    public void createIndexes(MongoTemplate mongoTemplate) {
        // Index: CollectionItemDocument.userId
        // Index: WishlistItemDocument.userId
        // Index: UserProfileDocument (unique on userId)
    }
    @RollbackExecution
    public void rollback(MongoTemplate mongoTemplate) { }
}
```

Enable Mongock in `application.properties`:
```properties
mongock.migration-scan-package=com.vasylenko.ecollectobackend.migration
```

---

## PHASE 3 — USER DOMAIN MODEL (backend)

### 3.1 User domain packages
Create the following structure under `.../ecollectobackend/`:

**`user/` package:**
```
UserProfileDocument.java     @Document("user_profiles")
  Fields: String id, String userId (Keycloak sub — unique index),
          String displayName, String email, Instant createdAt

UserProfileRepository.java
  Optional<UserProfileDocument> findByUserId(String userId);

UserProfileService.java
  UserProfileDto getOrCreate(String userId, String email, String displayName);

UserProfileController.java
  GET /api/me  →  UserProfileDto  (authenticated)
```

**`collection/` package:**
```
CollectionItemDocument.java  @Document("collection_items")
  Fields: String id, String userId, String stampId,
          String condition, String notes, BigDecimal purchasePrice, Instant addedAt

CollectionItemRepository.java
  List<CollectionItemDocument> findAllByUserId(String userId);
  Optional<CollectionItemDocument> findByUserIdAndStampId(String userId, String stampId);

CollectionItemService.java
CollectionItemController.java
  GET    /api/me/collection
  POST   /api/me/collection/items     body: AddCollectionItemRequest
  DELETE /api/me/collection/items/{stampId}
```

**`wishlist/` package:**
```
WishlistItemDocument.java    @Document("wishlist_items")
  Fields: String id, String userId, String stampId, Integer priority, Instant addedAt

WishlistItemRepository.java
WishlistItemService.java
WishlistItemController.java
  GET    /api/me/wishlist
  POST   /api/me/wishlist/items
  DELETE /api/me/wishlist/items/{stampId}
```

### 3.2 DTOs for user domain
Create under `.../dto/`:
- `UserProfileDto.java`
- `CollectionItemDto.java` — include denormalized stamp name (call StampService)
- `WishlistItemDto.java`
- `AddCollectionItemRequest.java` — `@NotBlank String stampId`, optional condition/notes/purchasePrice
- `AddWishlistItemRequest.java` — `@NotBlank String stampId`, optional priority

### 3.3 Stub controllers with TODO markers
Controllers return mock data or empty lists for now:
```java
// TODO Phase 4: replace with JWT extraction
private String getMockUserId() { return "mock-user-123"; }
```

---

## PHASE 4 — SPRING SECURITY + KEYCLOAK

### 4.1 Add security dependencies
In `backend/ecollecto-backend/build.gradle`:
```groovy
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
```

### 4.2 Create security configuration
Create `common/security/SecurityConfig.java`:

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public catalog — keep open
                .requestMatchers(HttpMethod.GET, "/api/stamps/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stamp/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/first-day-covers/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designers/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designer/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tariffs/**").permitAll()
                // Protected
                .requestMatchers("/api/me/**").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtConverter()))
            );
        return http.build();
    }
    // keycloakJwtConverter(): maps Keycloak realm_access.roles → Spring ROLE_ authorities
}
```

### 4.3 Current-user helper
Create `common/security/CurrentUserResolver.java`:
```java
// static String getUserId(Jwt jwt) { return jwt.getSubject(); }
```

### 4.4 Wire userId into controllers
Replace `getMockUserId()` stubs with:
```java
@AuthenticationPrincipal Jwt jwt
String userId = CurrentUserResolver.getUserId(jwt);
```

### 4.5 Keycloak config
In `application.properties` (commented by default):
```properties
# Uncomment when Keycloak is running via Docker Compose:
# spring.security.oauth2.resourceserver.jwt.issuer-uri=${KEYCLOAK_ISSUER:http://localhost:8180/realms/ecollecto}
```

### 4.6 CORS
Add environment-driven CORS config in `SecurityConfig`:
```properties
cors.allowed-origins=http://localhost:5173
```

---

## PHASE 5 — FRONTEND: REDUX TOOLKIT + AUTH

### 5.1 Install dependencies
Run in `frontend/ecollecto-ui`:
```bash
npm install @reduxjs/toolkit react-redux keycloak-js formik yup
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

### 5.2 Redux store structure
```
src/app/store.ts
src/app/providers/StoreProvider.tsx
src/app/providers/AuthProvider.tsx        # Keycloak init → dispatch initAuth()

src/features/auth/authSlice.ts
  # state: { user: UserProfile | null, token: string | null, isAuthenticated: boolean, status }
src/features/auth/authThunks.ts           # initAuth(), logout()
src/features/auth/useAuth.ts              # hook wrapping useSelector(selectAuth)

src/features/collection/collectionSlice.ts
src/features/collection/collectionThunks.ts
  # fetchCollection(), addItem(request), removeItem(stampId)

src/features/wishlist/wishlistSlice.ts
src/features/wishlist/wishlistThunks.ts

src/shared/api/apiClient.ts
  # fetch wrapper that injects Authorization: Bearer <token>
```

### 5.3 Route guards
In `src/app/App.tsx`:
```tsx
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};
```

Protect:
- `/collection` → `<ProtectedRoute>`
- `/profile` → `<ProtectedRoute>`
- `/admin/*` → role check for `admin`

### 5.4 Fix CollectionPage
- Unauthenticated: show "Sign in to view your collection" + sign-in button
- Authenticated: dispatch `fetchCollection()`, render real collection items
- Remove incorrect usage of `/api/stamps`

### 5.5 Add collection/wishlist actions on ProductPage
When authenticated:
- "Add to Collection" button → `collectionThunks.addItem({ stampId })`
- "Add to Wishlist" button → `wishlistThunks.addItem({ stampId })`
- Visual indicator if item already in collection/wishlist

### 5.6 Ensure folder structure exists
```
src/app/store.ts
src/app/providers/
src/features/auth/
src/features/collection/
src/features/wishlist/
src/features/ai/          # stub directory only
src/shared/api/
src/shared/theme/         # Tailwind tokens, Ukrposhta brand palette
```

---

## PHASE 6 — FRONTEND TESTING

### 6.1 Vitest config
In `vite.config.ts`, add:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts',
}
```
Create `src/test/setup.ts`: `import '@testing-library/jest-dom';`

### 6.2 Test targets (priority order)
1. `src/shared/utils/stampHelpers.test.ts` — denomination formatting
2. `src/features/auth/authSlice.test.ts` — auth state transitions
3. `src/pages/Collection/CollectionPage.test.tsx` — renders login prompt when unauthenticated
4. `src/app/ProtectedRoute.test.tsx` — redirects unauthenticated users
5. `src/features/collection/collectionThunks.test.ts` — API + state update

Add to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## PHASE 7 — CI QUALITY GATES

### 7.1 GitHub Actions
Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '25', distribution: 'temurin' }
      - run: ./gradlew :backend:ecollecto-backend:test
      - name: Upload JaCoCo
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: backend/ecollecto-backend/build/reports/jacoco/

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24' }
      - run: npm ci
        working-directory: frontend/ecollecto-ui
      - run: npm run lint
        working-directory: frontend/ecollecto-ui
      - run: npm run test
        working-directory: frontend/ecollecto-ui
      - run: npm run build
        working-directory: frontend/ecollecto-ui
      - run: npm audit --audit-level=high
        working-directory: frontend/ecollecto-ui
```

### 7.2 OpenAPI contract validation
Add to backend CI:
```yaml
- name: Validate OpenAPI spec
  run: ./gradlew :backend:ecollecto-backend:generateOpenApiDocs
```
Fail if generated spec diverges from committed `openapi.yaml`.

---

## PHASE 8 — AI STUBS (structure only, no implementation)

> **Do not implement AI features yet.** Only create structural stubs.

### 8.1 Backend AI package stub
Create `ai/AiController.java` — all endpoints return `501 NOT_IMPLEMENTED`:
```
POST /api/ai/search?q=              — natural language search
GET  /api/ai/recommendations        — personalized (authenticated)
POST /api/ai/chat                   — assistant (authenticated)
POST /api/admin/ai/enrich-stamp/{id} — admin enrichment (ROLE_ADMIN)
```
Add comments:
```java
// TODO: These will route to ecollecto-ai-service via API gateway
// TODO: Circuit breaker + fallback required — AI failures must not affect /api/stamps/**
// TODO: Phase AI arch: frontend → gateway → ecollecto-ai-service (separate service)
```

### 8.2 Frontend AI feature stub
Create `src/features/ai/`:
```
aiSlice.ts    # stub state: { searchResults, recommendations, chatHistory, status }
AiSearch.tsx  # stub component — disabled button "Coming soon"
```

---

## EXECUTION RULES FOR THE AGENT

1. **Read before writing.** Always read the current file content before modifying it.
2. **One phase at a time.** Complete and verify each phase before starting the next.
3. **Verify after every backend change:** `./gradlew :backend:ecollecto-backend:test`
4. **Verify after every frontend change:** `npm run build` in `frontend/ecollecto-ui`
5. **Never rename DTO fields.** `stamp_id`, `stampSKU`, `postmark_id` etc. are frontend contracts — preserve them.
6. **Never remove public catalog endpoints.** `/api/stamps`, `/api/stamp/{id}`, `/api/first-day-covers`, `/api/designers`, `/api/tariffs` must remain publicly accessible throughout all phases.
7. **Follow existing code style.** Backend: Lombok + feature-slice packages. Frontend: functional components.
8. **Document every config drift fix** with a comment explaining what changed and why.
9. **Keep credentials out of code.** No hardcoded passwords, tokens, or secrets — use `.env` or environment variables.
10. **Report blockers explicitly.** If a file is missing, a dependency conflicts, or behavior is ambiguous — say so and propose options rather than guessing.

---

## START COMMAND

Begin with **Phase 1**. First, read these files and report findings before making any changes:

1. `backend/ecollecto-backend/src/main/resources/application.properties`
2. `frontend/ecollecto-ui/vite.config.ts`
3. `frontend/ecollecto-ui/package.json`
4. All files under `frontend/ecollecto-ui/src/features/product/schema/`
5. `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/common/exception/GlobalExceptionHandler.java`
6. `backend/ecollecto-backend/README.md`
7. `backend/ecollecto-backend/build.gradle`

After reading, report:
- Current port values (actual vs expected)
- List of mongoose schema files and what each one models
- Current exception handler coverage: global vs controller-local
- README / build.gradle drift findings (Spring AI mention)

Then begin **Phase 1.1**.
