# eCollecto

eCollecto is a Ukrainian stamp collection application — a React/Vite SPA backed by a Spring Boot + MongoDB API. Browse a multi-year stamp catalog, first-day covers, and postal tariff data. Authenticated users can access their personal profile via a Keycloak-secured endpoint.

## Quick Start

> **New engineer?** Follow the complete step-by-step guide in **[doc/BOOTSTRAP.md](doc/BOOTSTRAP.md)** to bring up all dependencies without any manual installation beyond JDK 25 and Docker.

### Prerequisites
- **JDK 25** — only JDK required; Node.js is managed automatically by the Gradle Node plugin.
- **Docker Desktop** — runs MongoDB and Keycloak via `docker compose up -d`.

### 1. Clone and set up environment files
```bash
git clone <repo-url>
cd eCollecto
cp .env.example .env                                                  # root env
cp frontend/ecollecto-ui/.env.example frontend/ecollecto-ui/.env.local  # Vite env
```

### 2. Start Docker services
```bash
docker compose up -d
# Wait ~30 s for Keycloak to import the ecollecto realm
```

### 3. Seed the database

**Recommended — Spring Boot seed profile (idempotent, uses `DataInitializer`):**
```powershell
.\gradlew.bat :backend:ecollecto-backend:bootRun --args="--spring.profiles.active=seed"
# Stop with Ctrl+C after the seed completes — the seed profile is not needed for normal operation
```

Expected output:
```
DataInitializer: upserted 135 records into 'designers'
DataInitializer: upserted 2500 records into 'stamp'
DataInitializer: seed complete.
```

<details>
<summary>Alternative — manual mongoimport</summary>

```bash
docker cp collection/ua/stamp.json            ecollecto-mongo:/tmp/stamp.json
docker cp collection/ua/designers.json        ecollecto-mongo:/tmp/designers.json
docker cp collection/ua/first_day_covers.json ecollecto-mongo:/tmp/first_day_covers.json
docker cp collection/ua/tariffs.json          ecollecto-mongo:/tmp/tariffs.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection stamp            --jsonArray --file /tmp/stamp.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection designers        --jsonArray --file /tmp/designers.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection first_day_covers --jsonArray --file /tmp/first_day_covers.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection tariffs          --jsonArray --file /tmp/tariffs.json
```
</details>

### 4. Start the backend
```powershell
.\gradlew.bat :backend:ecollecto-backend:bootRun
# Starts on http://localhost:8080
```

### 5. Start the frontend
```powershell
.\gradlew.bat :frontend:ecollecto-ui:npmDev
# Vite dev server on http://localhost:5173 — proxies /api to http://localhost:8080
```

### Docker services
`docker-compose.yml` at the repo root configures:
- **MongoDB 8** (`ecollecto-mongo`) — `localhost:27017`, data persisted in the `mongo_data` volume.
- **Keycloak 26.2** (`ecollecto-keycloak`) — `localhost:8180`, `ecollecto` realm auto-imported from `keycloak/realm-export.json`.

Stop with `docker compose down`. Wipe all data with `docker compose down -v`.

## Architecture

```
browser (React + Vite)
  └── fetch /api/*
        └── Vite dev proxy → http://localhost:8080
              └── Spring Boot controllers
                    └── Spring Data MongoDB
```

Module layout:
- `backend/ecollecto-backend/` — Java 25, Spring Boot 4, Spring Security (OAuth2 resource server), Spring Data MongoDB, MapStruct, REST API
- `frontend/ecollecto-ui/` — React 19, TypeScript, Vite 7, Tailwind CSS 4, Redux Toolkit, react-oidc-context (Keycloak PKCE)
- `collection/ua/*.json` — canonical sample data (source of truth for seed files and test fixtures)

### Key backend endpoints

| Endpoint                      | Description                                                                         |
|-------------------------------|-------------------------------------------------------------------------------------|
| `GET /api/stamps/years`       | Year list with stamp counts — drives the multi-year catalog and collection selector |
| `GET /api/stamps?year={year}` | Stamps for a single release year                                                    |
| `GET /api/stamp/{id}`         | Single stamp detail                                                                 |
| `GET /api/first-day-covers`   | First-day cover list                                                                |
| `GET /api/designers`          | Designer list                                                                       |
| `GET /api/tariffs`            | Postal tariff data (denomination formatting)                                        |
| `GET /api/me`                 | Authenticated user profile — requires Bearer JWT                                    |

Full API reference: [`backend/ecollecto-backend/doc/API.md`](backend/ecollecto-backend/doc/API.md) · Interactive docs: `http://localhost:8080/swagger-ui.html`

### Key frontend routes

| Path                 | Page                                                                 |
|----------------------|----------------------------------------------------------------------|
| `/`                  | `LandingPage` — hero, how-it-works, latest-year preview              |
| `/stamps`            | `CatalogPage` — year-selector hub                                    |
| `/stamps/year/:year` | `YearStampsPage` — full grid for one release year                    |
| `/stamps/:id`        | `ProductPage` — stamp detail                                         |
| `/collection`        | `CollectionPage` — multi-year personal collection with year selector |
| `/firstday`          | `FirstDayPage` — first day of issue list                             |

## Key Docs

| Document                                                                           | Purpose                                                                        |
|------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| [`doc/BOOTSTRAP.md`](doc/BOOTSTRAP.md)                                             | **New engineer onboarding** — complete environment setup guide                 |
| [`backend/ecollecto-backend/doc/API.md`](backend/ecollecto-backend/doc/API.md)     | REST API reference                                                             |
| [`backend/ecollecto-backend/openapi.yaml`](backend/ecollecto-backend/openapi.yaml) | OpenAPI 3 spec (auto-generated by `OpenApiSpecTest`; commit after DTO changes) |
| [`doc/ROADMAP.md`](doc/ROADMAP.md)                                                 | Post-MVP delivery plan (infrastructure, security, AI)                          |
| [`doc/agent-prompt.md`](doc/agent-prompt.md)                                       | Detailed Copilot agent implementation guide                                    |
| [`AGENTS.md`](AGENTS.md)                                                           | AI agent operating instructions                                                |

## Module READMEs
- [`backend/ecollecto-backend/README.md`](backend/ecollecto-backend/README.md)
- [`frontend/ecollecto-ui/README.md`](frontend/ecollecto-ui/README.md)

## Running Tests

```powershell
# Backend tests (JUnit + JaCoCo) — also regenerates openapi.yaml
.\gradlew.bat :backend:ecollecto-backend:test

# Frontend unit tests (Vitest + React Testing Library) — 130 tests across 12 suites
.\gradlew.bat :frontend:ecollecto-ui:npmTest

# Frontend lint + build check
.\gradlew.bat :frontend:ecollecto-ui:npmLint
.\gradlew.bat :frontend:ecollecto-ui:npmBuild
```
