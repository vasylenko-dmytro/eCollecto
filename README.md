# eCollecto

eCollecto is a Ukrainian stamp collection application — a React/Vite SPA backed by a Spring Boot + MongoDB API. Browse stamps, first-day covers, and postal tariff data.

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

### 2. Start Docker services, then seed the database
```bash
docker compose up -d
# wait ~30 s for Keycloak realm import, then seed MongoDB:
docker cp collection/stamp.json           ecollecto-mongo:/tmp/stamp.json
docker cp collection/designers.json       ecollecto-mongo:/tmp/designers.json
docker cp collection/first_day_covers.json ecollecto-mongo:/tmp/first_day_covers.json
docker cp collection/tariffs.json         ecollecto-mongo:/tmp/tariffs.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection stamp            --jsonArray --file /tmp/stamp.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection designers        --jsonArray --file /tmp/designers.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection first_day_covers --jsonArray --file /tmp/first_day_covers.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection tariffs          --jsonArray --file /tmp/tariffs.json
```

### 3. Start the backend
```powershell
.\gradlew.bat :backend:ecollecto-backend:bootRun
# Starts on http://localhost:8080
```

### 4. Start the frontend
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
- `backend/ecollecto-backend/` — Java 25, Spring Boot 4, MongoDB, REST API
- `frontend/ecollecto-ui/` — React 19, TypeScript, Vite 7, Tailwind CSS 4
- `collection/*.json` — canonical sample data (source of truth for test fixtures)

## Key Docs

| Document | Purpose |
|---|---|
| [`doc/BOOTSTRAP.md`](doc/BOOTSTRAP.md) | **New engineer onboarding** — complete environment setup guide |
| [`backend/ecollecto-backend/doc/API.md`](backend/ecollecto-backend/doc/API.md) | REST API reference |
| [`backend/ecollecto-backend/openapi.yaml`](backend/ecollecto-backend/openapi.yaml) | OpenAPI 3 spec |
| [`doc/ROADMAP.md`](doc/ROADMAP.md) | Post-MVP delivery plan (infrastructure, security, AI) |
| [`doc/agent-prompt.md`](doc/agent-prompt.md) | Detailed Copilot agent implementation guide |
| [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) | Known code issues and prioritized fixes |
| [`AGENTS.md`](AGENTS.md) | AI agent operating instructions |

## Module READMEs
- [`backend/ecollecto-backend/README.md`](backend/ecollecto-backend/README.md)
- [`frontend/ecollecto-ui/README.md`](frontend/ecollecto-ui/README.md)

## Running Tests

```powershell
# Backend tests (JUnit + JaCoCo)
.\gradlew.bat :backend:ecollecto-backend:test

# Frontend lint + build check
.\gradlew.bat :frontend:ecollecto-ui:npmLint
.\gradlew.bat :frontend:ecollecto-ui:npmBuild
```
