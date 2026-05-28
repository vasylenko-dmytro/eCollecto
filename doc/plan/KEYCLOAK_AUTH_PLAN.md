# Keycloak Authentication & Authorization — Implementation Plan

> **Project context:** Java 25 · Spring Boot 4 · React 19 · Vite 7 · React Router 7  
> **Pattern:** Authorization Code + PKCE (browser) · Bearer-only Resource Server (backend)  
> **Status notation:** 🔲 — not started · 🔄 — in progress · ✅ — done

---

## Phase dependency map

```
Phase 0 (Docker/Keycloak running)
    └─► Phase 1 (Backend Security)
            └─► Phase 2 (Frontend Redux + OIDC)
                    └─► Phase 3 (Route Guards + Protected Pages)
                                └─► Phase 4 (Protected API Endpoints)
                                            └─► Phase 5 (Testing + CI)
```

---

## Phase 0 — Infrastructure: Docker Compose + Keycloak Realm

**Goal:** Keycloak and MongoDB run locally with a single command. Backend and frontend require no manual setup.

### 0.1 Root `.env` file

Create `/.env` in the repository root:

```dotenv
# MongoDB
MONGO_INITDB_DATABASE=ecollecto
MONGO_PORT=27017

# Keycloak
KC_VERSION=26.2
KC_PORT=8180
KC_ADMIN=admin
KC_ADMIN_PASSWORD=admin
KC_REALM=ecollecto

# Backend
BACKEND_PORT=8080
SPRING_SECURITY_OAUTH2_ISSUER=http://localhost:8180/realms/ecollecto

# Frontend
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=ecollecto
VITE_KEYCLOAK_CLIENT_ID=ecollecto-ui
```

### 0.2 `docker-compose.yml` in the repository root

```yaml
services:
  mongodb:
    image: mongo:8
    container_name: ecollecto-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: ${MONGO_INITDB_DATABASE}
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongo_data:/data/db

  keycloak:
    image: quay.io/keycloak/keycloak:${KC_VERSION}
    container_name: ecollecto-keycloak
    restart: unless-stopped
    command: start-dev --import-realm
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KC_ADMIN}
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KC_ADMIN_PASSWORD}
      KC_DB: dev-mem
      KC_HTTP_PORT: ${KC_PORT}
    ports:
      - "${KC_PORT}:${KC_PORT}"
    volumes:
      - ./keycloak:/opt/keycloak/data/import

  # Redis — commented out, needed in the AI phase
  # redis:
  #   image: redis:7-alpine
  #   container_name: ecollecto-redis
  #   ports:
  #     - "6379:6379"

volumes:
  mongo_data:
```

### 0.3 `keycloak/` directory structure

```
keycloak/
└── realm-export.json     ← imported automatically on Keycloak startup
```

### 0.4 `keycloak/realm-export.json` — Realm configuration

Minimal `ecollecto` realm export:

```json
{
  "realm": "ecollecto",
  "enabled": true,
  "registrationAllowed": true,
  "resetPasswordAllowed": true,
  "loginWithEmailAllowed": true,
  "roles": {
    "realm": [
      { "name": "user",     "composite": false },
      { "name": "admin",    "composite": false },
      { "name": "ai-admin", "composite": false }
    ]
  },
  "clients": [
    {
      "clientId": "ecollecto-ui",
      "name": "eCollecto Frontend",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": false,
      "redirectUris": [
        "http://localhost:5173/*",
        "http://localhost:4173/*"
      ],
      "webOrigins": [
        "http://localhost:5173",
        "http://localhost:4173"
      ],
      "attributes": {
        "pkce.code.challenge.method": "S256"
      }
    },
    {
      "clientId": "ecollecto-backend",
      "name": "eCollecto Backend",
      "enabled": true,
      "publicClient": false,
      "bearerOnly": true,
      "standardFlowEnabled": false
    }
  ],
  "users": [
    {
      "username": "testuser",
      "enabled": true,
      "email": "testuser@ecollecto.dev",
      "firstName": "Test",
      "lastName": "User",
      "credentials": [{ "type": "password", "value": "password", "temporary": false }],
      "realmRoles": ["user"]
    },
    {
      "username": "admin",
      "enabled": true,
      "email": "admin@ecollecto.dev",
      "firstName": "Admin",
      "lastName": "User",
      "credentials": [{ "type": "password", "value": "admin", "temporary": false }],
      "realmRoles": ["user", "admin"]
    }
  ]
}
```

### 0.5 Infrastructure startup commands

```bash
# Start MongoDB + Keycloak
docker compose up -d

# Verify Keycloak (should return 200)
curl http://localhost:8180/realms/ecollecto/.well-known/openid-configuration

# Stop
docker compose down

# Delete data (reset MongoDB)
docker compose down -v
```

### 0.6 Update `backend/ecollecto-backend/src/main/resources/application.properties`

```properties
spring.application.name=eCollecto
server.port=${BACKEND_PORT:8080}

# MongoDB — now from env or via Docker
spring.mongodb.uri=${SPRING_MONGODB_URI:mongodb://localhost:27017/ecollecto}

spring.main.banner-mode=off
spring.main.lazy-initialization=true

logging.level.org.springframework.data.mongodb.core.MongoTemplate=INFO

# Spring Security — OAuth2 Resource Server (uncommented in Phase 1)
# spring.security.oauth2.resourceserver.jwt.issuer-uri=${SPRING_SECURITY_OAUTH2_ISSUER}
```

**Phase 0 checklist:**
- 🔲 `/.env` created
- 🔲 `/docker-compose.yml` created
- 🔲 `/keycloak/realm-export.json` created
- 🔲 `docker compose up -d` — both services healthy
- 🔲 Keycloak Admin UI accessible: `http://localhost:8180`
- 🔲 Realm `ecollecto` imported automatically
- 🔲 Test users `testuser` / `admin` created
- 🔲 `application.properties` parameterised via env

---

## Phase 1 — Backend: Spring Security Resource Server

**Goal:** Backend validates JWT tokens issued by Keycloak. Public endpoints `/api/stamps`, `/api/designers`, etc. remain open. Protected endpoints (future `/api/me/*`) require the `ROLE_USER` role.

### 1.1 Add dependencies to `gradle/libs.versions.toml`

```toml
[versions]
# ... existing versions ...
spring-security-oauth2 = "6.5.0"   # managed by Spring Boot BOM — no explicit version.ref needed

[libraries]
# ... existing libraries ...
spring-security-oauth2-resource-server = { module = "org.springframework.boot:spring-boot-starter-oauth2-resource-server" }
spring-boot-starter-security           = { module = "org.springframework.boot:spring-boot-starter-security" }
```

> **Important:** Spring Boot 4 BOM manages Spring Security versions automatically. No `version.ref` needed — `module` is sufficient.

### 1.2 Add dependencies to `backend/ecollecto-backend/build.gradle`

```groovy
dependencies {
    // ... existing dependencies ...
    implementation libs.spring.boot.starter.security
    implementation libs.spring.security.oauth2.resource.server

    // For Security tests
    testImplementation 'org.springframework.security:spring-security-test'
}
```

### 1.3 Configure `application.properties`

Uncomment the line from step 0.6:

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=${SPRING_SECURITY_OAUTH2_ISSUER:http://localhost:8180/realms/ecollecto}
```

### 1.4 Create the `common/security/` package

```
backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/common/security/
├── SecurityConfig.java          ← main configuration
├── JwtAuthorityConverter.java   ← maps Keycloak roles → Spring GrantedAuthority
└── CurrentUserService.java      ← utility for extracting userId from JWT (needed in Phase 4)
```

### 1.5 `SecurityConfig.java`

```java
package com.vasylenko.ecollectobackend.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthorityConverter jwtAuthorityConverter;

    public SecurityConfig(JwtAuthorityConverter jwtAuthorityConverter) {
        this.jwtAuthorityConverter = jwtAuthorityConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())                          // stateless API — CSRF not needed
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ─── Public catalog (readable by everyone) ───
                .requestMatchers(HttpMethod.GET, "/api/stamps").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stamp/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/first-day-covers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/first-day-covers/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/designer/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tariffs").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tariffs/**").permitAll()
                // ─── Actuator / OpenAPI ───
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll()
                // ─── Protected routes (Phase 4) ───
                .requestMatchers("/api/me/**").hasRole("USER")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // ─── Everything else requires authentication ───
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthorityConverter))
            );

        return http.build();
    }
}
```

### 1.6 `JwtAuthorityConverter.java`

Keycloak places roles inside `realm_access.roles`. Spring Security expects `GrantedAuthority` in the `ROLE_USER` format.

```java
package com.vasylenko.ecollectobackend.common.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class JwtAuthorityConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractRealmRoles(jwt);
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return Collections.emptyList();

        List<String> roles = (List<String>) realmAccess.get("roles");
        if (roles == null) return Collections.emptyList();

        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toList());
    }
}
```

### 1.7 `CurrentUserService.java`

```java
package com.vasylenko.ecollectobackend.common.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    public String getCurrentUserId() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return jwt.getSubject(); // Keycloak sub = user UUID
    }

    public String getCurrentUserEmail() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return jwt.getClaim("email");
    }
}
```

### 1.8 Configure CORS in `config/` or `SecurityConfig`

```java
// Add to SecurityConfig.securityFilterChain():
.cors(cors -> cors.configurationSource(corsConfigurationSource()))

// Add @Bean:
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "${CORS_ALLOWED_ORIGIN:http://localhost:5173}",
        "http://localhost:4173"
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

### 1.9 Update `GlobalExceptionHandler` — add 401/403

Add handlers to `common/exception/GlobalExceptionHandler.java`:

```java
@ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
@ResponseStatus(HttpStatus.FORBIDDEN)
public ErrorResponse handleAccessDenied(AccessDeniedException ex) {
    return new ErrorResponse("Access denied", "FORBIDDEN", 403);
}

@ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public ErrorResponse handleUnauthorized(AuthenticationException ex) {
    return new ErrorResponse("Unauthorized", "UNAUTHORIZED", 401);
}
```

### 1.10 Update API.md — add HTTP status codes

In `backend/ecollecto-backend/doc/API.md`, add to the HTTP Status Codes section:
- `401 UNAUTHORIZED` — missing or invalid JWT
- `403 FORBIDDEN` — insufficient permissions

**Phase 1 checklist:**
- 🔲 `spring-security` + `oauth2-resource-server` dependencies added to `libs.versions.toml` and `build.gradle`
- 🔲 `SecurityConfig.java` created — public `/api/*` accessible without a token
- 🔲 `JwtAuthorityConverter.java` — Keycloak roles → ROLE_USER/ROLE_ADMIN
- 🔲 `CurrentUserService.java` created
- 🔲 CORS configured (origin: `http://localhost:5173`)
- 🔲 `GlobalExceptionHandler` — 401/403 handling
- 🔲 `application.properties` — `issuer-uri` set
- 🔲 `./gradlew :backend:ecollecto-backend:test` — all tests green (Security does not break existing controller tests)
- 🔲 `curl http://localhost:8080/api/stamps` — 200 OK without a token
- 🔲 `curl http://localhost:8080/api/me` — 401 without a token

---

## Phase 2 — Frontend: Redux Toolkit + OIDC Auth

**Goal:** Set up the auth state store. Connect the OIDC client. On application startup — attempt a silent session restore.

### 2.1 Install dependencies

```bash
cd frontend/ecollecto-ui
npm install @reduxjs/toolkit react-redux oidc-client-ts react-oidc-context
```

| Package | Purpose |
|---------|---------|
| `@reduxjs/toolkit` | store, slice, thunk |
| `react-redux` | provider and hooks |
| `oidc-client-ts` | PKCE + OIDC protocol |
| `react-oidc-context` | React wrapper over `oidc-client-ts`, auto-refresh |

### 2.2 New file structure

```
src/
├── app/
│   ├── store.ts                     ← Redux store
│   ├── providers/
│   │   ├── ReduxProvider.tsx        ← <Provider store={store}>
│   │   └── AuthProvider.tsx         ← <AuthProvider> from react-oidc-context
│   ├── App.tsx                      ← update: wrap in providers
│   └── main.tsx
├── features/
│   └── auth/
│       ├── authSlice.ts             ← { user, isAuthenticated, isLoading }
│       ├── authThunks.ts            ← loadUserProfile (Phase 4)
│       ├── hooks/
│       │   └── useAuth.ts           ← convenience hook
│       └── components/
│           ├── LoginButton.tsx
│           ├── LogoutButton.tsx
│           └── UserMenu.tsx
```

### 2.3 `src/app/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 2.4 `src/features/auth/authSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export const authReducer = authSlice.reducer;
```

### 2.5 `src/features/auth/hooks/useAuth.ts`

```typescript
import { useSelector } from 'react-redux';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import type { RootState } from '../../../app/store';

export function useAuth() {
  const oidcAuth = useOidcAuth();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || oidcAuth.isLoading,
    signIn: () => oidcAuth.signinRedirect(),
    signOut: () => oidcAuth.signoutRedirect(),
    getAccessToken: () => oidcAuth.user?.access_token ?? null,
  };
}
```

### 2.6 OIDC configuration and `src/app/providers/AuthProvider.tsx`

```typescript
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { setUser, clearUser } from '../../features/auth/authSlice';
import type { AppDispatch } from '../store';

const oidcConfig = {
  authority: import.meta.env.VITE_KEYCLOAK_URL + '/realms/' + import.meta.env.VITE_KEYCLOAK_REALM,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  automaticSilentRenew: true,
};

// Syncs OIDC user → Redux store
function AuthSync({ children }: { children: React.ReactNode }) {
  const oidcAuth = useOidcAuth();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (oidcAuth.isAuthenticated && oidcAuth.user) {
      const profile = oidcAuth.user.profile;
      const realmAccess = (profile as Record<string, unknown>)['realm_access'] as
        { roles?: string[] } | undefined;
      dispatch(setUser({
        sub:   profile.sub ?? '',
        email: profile.email ?? '',
        name:  profile.name ?? '',
        roles: realmAccess?.roles ?? [],
      }));
    } else if (!oidcAuth.isLoading) {
      dispatch(clearUser());
    }
  }, [oidcAuth.isAuthenticated, oidcAuth.isLoading, oidcAuth.user, dispatch]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <OidcAuthProvider {...oidcConfig}>
      <AuthSync>{children}</AuthSync>
    </OidcAuthProvider>
  );
}
```

### 2.7 `src/app/providers/ReduxProvider.tsx`

```typescript
import { Provider } from 'react-redux';
import { store } from '../store';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

### 2.8 Update `src/app/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReduxProvider } from './providers/ReduxProvider';
import { AuthProvider } from './providers/AuthProvider';
import App from './App';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ReduxProvider>
  </StrictMode>,
);
```

### 2.9 Vite environment variables

Create `frontend/ecollecto-ui/.env.local`:

```dotenv
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=ecollecto
VITE_KEYCLOAK_CLIENT_ID=ecollecto-ui
```

Add `.env.local` to `frontend/ecollecto-ui/.gitignore` (secrets must not go to git).  
Create `frontend/ecollecto-ui/.env.example` as a template.

### 2.10 Create `src/features/auth/components/LoginButton.tsx`

```tsx
import { useAuth } from '../hooks/useAuth';

export function LoginButton() {
  const { signIn } = useAuth();
  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Sign in
    </button>
  );
}
```

### 2.11 Create `src/features/auth/components/UserMenu.tsx`

```tsx
import { useAuth } from '../hooks/useAuth';

export function UserMenu() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {user?.name ?? user?.email}
      </span>
      <button
        onClick={() => signOut()}
        className="px-3 py-1 text-sm bg-gray-200 dark:bg-neutral-600 rounded hover:bg-gray-300 transition"
      >
        Sign out
      </button>
    </div>
  );
}
```

### 2.12 Update `src/shared/layout/Header.tsx`

Replace the `disabled <button>` placeholder (Log-in stub from KNOWN_ISSUES) with a dynamic block:

```tsx
import { useAuth } from '../../features/auth/hooks/useAuth';
import { LoginButton } from '../../features/auth/components/LoginButton';
import { UserMenu }    from '../../features/auth/components/UserMenu';

// Inside the header JSX:
{isAuthenticated ? <UserMenu /> : <LoginButton />}
```

**Phase 2 checklist:**
- 🔲 `npm install @reduxjs/toolkit react-redux oidc-client-ts react-oidc-context`
- 🔲 `src/app/store.ts` created
- 🔲 `src/features/auth/authSlice.ts` created
- 🔲 `src/app/providers/AuthProvider.tsx` + `ReduxProvider.tsx` created
- 🔲 `src/app/main.tsx` updated — both providers wrap `<App>`
- 🔲 `.env.local` / `.env.example` created
- 🔲 `LoginButton` / `UserMenu` components created
- 🔲 Header updated — sign-in button / user menu work
- 🔲 `./gradlew :frontend:ecollecto-ui:npmBuild` — build passes without errors
- 🔲 In the browser: "Sign in" button → redirect to Keycloak login → redirect back → user name shown in header

---

## Phase 3 — Frontend: Route Guards + Route Groups

**Goal:** Split routes into public / authenticated / admin. Unauthenticated users cannot reach protected pages.

### 3.1 Create `src/app/routes/`

```
src/app/routes/
├── PublicRoute.tsx        ← accessible by everyone
├── ProtectedRoute.tsx     ← requires isAuthenticated
└── AdminRoute.tsx         ← requires role 'admin'
```

### 3.2 `src/app/routes/ProtectedRoute.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}
```

### 3.3 `src/app/routes/AdminRoute.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  const isAdmin = user?.roles.includes('admin') ?? false;

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin)          return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}
```

### 3.4 Update `src/app/App.tsx` — add route groups

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute }     from './routes/AdminRoute';
// ... existing imports ...

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-neutral-700 transition-colors duration-300">
        <Header onSearch={setSearchTerm} />

        <main className="flex-1">
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/"           element={<HomePage searchTerm={searchTerm} />} />
            <Route path="/stamps/:id" element={<ProductPage />} />
            <Route path="/collection" element={<CollectionPage searchTerm={searchTerm} />} />
            <Route path="/firstday"   element={<FirstDayPage searchTerm={searchTerm} />} />

            {/* ── Protected routes (ROLE_USER) ── */}
            <Route element={<ProtectedRoute />}>
              {/* Phase 4: <Route path="/me/collection" element={<MyCollectionPage />} /> */}
              {/* Phase 4: <Route path="/me/wishlist"   element={<WishlistPage />} /> */}
            </Route>

            {/* ── Admin routes (ROLE_ADMIN) ── */}
            <Route element={<AdminRoute />}>
              {/* Phase 4: <Route path="/admin" element={<AdminPage />} /> */}
            </Route>

            <Route path="/forbidden" element={<div className="p-8 text-center text-red-500">403 — Access Denied</div>} />
            <Route path="*"          element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
```

### 3.5 Handling the OIDC callback redirect

`react-oidc-context` automatically handles `?code=...` after the Keycloak redirect. Make sure `redirect_uri = window.location.origin` covers all routes (not just `/callback`). If a dedicated path is needed, add:

```tsx
// In App.tsx routes:
<Route path="/auth/callback" element={<AuthCallbackPage />} />
```

```tsx
// src/pages/AuthCallback/AuthCallbackPage.tsx
import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const auth = useAuth();
  if (auth.isLoading) return <div>Authenticating...</div>;
  return <Navigate to="/" replace />;
}
```

**Phase 3 checklist:**
- 🔲 `ProtectedRoute.tsx` and `AdminRoute.tsx` created
- 🔲 `App.tsx` updated — three route groups
- 🔲 Redirect to `/` after login works
- 🔲 Navigating to a protected route without a token → redirect to `/`
- 🔲 Navigating to an admin route without the role → redirect to `/forbidden`
- 🔲 `./gradlew :frontend:ecollecto-ui:npmLint` — no errors

---

## Phase 4 — Protected API Endpoints + Frontend API Client

**Goal:** Add the first protected endpoints. Frontend sends a Bearer token in the Authorization header.

### 4.1 Create `src/shared/api/apiClient.ts`

Centralised HTTP client with a Bearer token from OIDC:

```typescript
import { User } from 'oidc-client-ts';

function getAccessToken(): string | null {
  const oidcKey = `oidc.user:${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}:${import.meta.env.VITE_KEYCLOAK_CLIENT_ID}`;
  const raw = sessionStorage.getItem(oidcKey);
  if (!raw) return null;
  const user = User.fromStorageString(raw);
  return user?.access_token ?? null;
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

### 4.2 Backend: User Domain — `user/` package

Create a minimal user package for storing profiles:

```
backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/user/
├── UserDocument.java        ← @Document("users")
├── UserRepository.java      ← MongoRepository<UserDocument, String>
├── UserService.java         ← getOrCreateProfile(String keycloakSub)
├── UserController.java      ← GET /api/me
└── UserMapper.java          ← MapStruct
```

#### `UserDocument.java`

```java
@Document("users")
@Getter @Setter
@ToString @EqualsAndHashCode(of = "id")
public class UserDocument {
    @Id
    private String id;          // = Keycloak sub (UUID)
    private String email;
    private String name;
    private Instant createdAt;
    private Instant updatedAt;
}
```

#### `UserController.java`

```java
@RestController
@RequestMapping("/api/me")
public class UserController {

    private final UserService        userService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public UserDto getProfile() {
        String userId = currentUserService.getCurrentUserId();
        return userService.getOrCreateProfile(userId);
    }
}
```

### 4.3 Frontend: `src/features/auth/authThunks.ts`

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../shared/api/apiClient';

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export const loadUserProfile = createAsyncThunk(
  'auth/loadProfile',
  async () => apiFetch<UserProfile>('/api/me')
);
```

### 4.4 Update `authSlice.ts` — handle thunk

```typescript
import { loadUserProfile } from './authThunks';

// In extraReducers:
builder
  .addCase(loadUserProfile.fulfilled, (state, action) => {
    if (state.user) {
      state.user.name  = action.payload.name;
      state.user.email = action.payload.email;
    }
  });
```

**Phase 4 checklist:**
- 🔲 `src/shared/api/apiClient.ts` created
- 🔲 `GET /api/me` — 200 with token, 401 without token
- 🔲 `user/` package created in the backend
- 🔲 `loadUserProfile` thunk called after login
- 🔲 `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/me` — 200
- 🔲 `curl http://localhost:8080/api/me` — 401

---

## Phase 5 — Tests and CI

**Goal:** Automate security configuration verification. Add to the CI pipeline.

### 5.1 Backend — Security integration tests

Update existing controller tests to ensure they work with `@WithMockUser`.

Create `SecurityConfigTest.java`:

```java
@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void publicEndpoints_shouldBeAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/stamps"))
               .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/me"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void protectedEndpoint_withUserRole_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/me"))
               .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void adminEndpoint_withUserRole_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/admin/test"))
               .andExpect(status().isForbidden());
    }
}
```

### 5.2 Frontend — `useAuth` hook tests

```typescript
// src/__tests__/features/auth/useAuth.test.ts
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Mock react-oidc-context and redux store
describe('useAuth', () => {
  it('returns isAuthenticated=false when not logged in', () => {
    // ...
  });
  it('signIn() calls oidcAuth.signinRedirect', () => {
    // ...
  });
});
```

### 5.3 GitHub Actions workflow — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '25', distribution: 'temurin' }
      - run: ./gradlew :backend:ecollecto-backend:test
      - run: ./gradlew :backend:ecollecto-backend:jacocoTestReport

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'npm', cache-dependency-path: frontend/ecollecto-ui/package-lock.json }
      - run: cd frontend/ecollecto-ui && npm ci
      - run: cd frontend/ecollecto-ui && npm run lint
      - run: cd frontend/ecollecto-ui && npm run build
      - run: cd frontend/ecollecto-ui && npm run test
```

**Phase 5 checklist:**
- 🔲 `SecurityConfigTest.java` — 4 tests green
- 🔲 `useAuth.test.ts` — basic coverage
- 🔲 `.github/workflows/ci.yml` created
- 🔲 CI passes on push to main

---

## Overall checklist by phase

| Phase | Task | Status |
|-------|------|--------|
| **0** | `.env` + `docker-compose.yml` | 🔲 |
| **0** | `keycloak/realm-export.json` | 🔲 |
| **0** | `docker compose up` — Keycloak + Mongo running | 🔲 |
| **1** | Spring Security + OAuth2 Resource Server | 🔲 |
| **1** | `SecurityConfig` — public vs protected paths | 🔲 |
| **1** | `JwtAuthorityConverter` — Keycloak roles → ROLE_* | 🔲 |
| **1** | CORS for `localhost:5173` | 🔲 |
| **1** | GlobalExceptionHandler — 401/403 | 🔲 |
| **2** | Redux Toolkit store + authSlice | 🔲 |
| **2** | AuthProvider (OIDC) + ReduxProvider | 🔲 |
| **2** | LoginButton / UserMenu in Header | 🔲 |
| **3** | ProtectedRoute + AdminRoute components | 🔲 |
| **3** | App.tsx — 3 route groups | 🔲 |
| **4** | `apiFetch` with Bearer token | 🔲 |
| **4** | `GET /api/me` — backend + frontend | 🔲 |
| **5** | Security tests (backend + frontend) | 🔲 |
| **5** | GitHub Actions CI pipeline | 🔲 |

---

## Reference: key URLs

| Service | URL |
|---------|-----|
| Frontend (dev) | `http://localhost:5173` |
| Backend API | `http://localhost:8080/api` |
| Keycloak Admin | `http://localhost:8180` |
| Keycloak Realm | `http://localhost:8180/realms/ecollecto` |
| OIDC Discovery | `http://localhost:8180/realms/ecollecto/.well-known/openid-configuration` |
| Keycloak Token | `http://localhost:8180/realms/ecollecto/protocol/openid-connect/token` |

## Reference: test users (from realm-export.json)

| Username | Password | Roles |
|----------|----------|-------|
| `testuser` | `password` | `user` |
| `admin` | `admin` | `user`, `admin` |

---

## Related project files

| File | What changes |
|------|-------------|
| `gradle/libs.versions.toml` | + security/oauth2 dependencies |
| `backend/ecollecto-backend/build.gradle` | + security/oauth2 dependencies |
| `backend/.../application.properties` | + issuer-uri, parameterised via env |
| `backend/.../common/security/` | new package — SecurityConfig, JwtAuthorityConverter, CurrentUserService |
| `backend/.../common/exception/GlobalExceptionHandler.java` | + 401/403 handlers |
| `backend/.../user/` | new package — UserDocument, UserRepository, UserService, UserController |
| `backend/.../doc/API.md` | + 401/403 statuses, new /api/me endpoints |
| `frontend/ecollecto-ui/package.json` | + redux, oidc dependencies |
| `frontend/ecollecto-ui/.env.local` | VITE_KEYCLOAK_* variables (not in git) |
| `frontend/ecollecto-ui/src/app/main.tsx` | wrapped in providers |
| `frontend/ecollecto-ui/src/app/App.tsx` | route groups |
| `frontend/ecollecto-ui/src/app/store.ts` | new — Redux store |
| `frontend/ecollecto-ui/src/app/providers/` | new directory — providers |
| `frontend/ecollecto-ui/src/features/auth/` | new directory — authSlice, hooks, components |
| `frontend/ecollecto-ui/src/shared/api/apiClient.ts` | new — apiFetch with Bearer token |
| `frontend/ecollecto-ui/src/shared/layout/Header.tsx` | Login/Logout buttons |

