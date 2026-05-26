# eCollecto

eCollecto is a Ukrainian stamp collection application — a React/Vite SPA backed by a Spring Boot + MongoDB API. Browse stamps, first-day covers, and postal tariff data.

## Quick Start

### Prerequisites
- JDK 25
- Node.js 24+ / npm 11+
- MongoDB running locally on port `27017` (or via Docker — see [Docker section](#docker))

### 1. Clone and install
```bash
git clone <repo-url>
cd eCollecto
```

### 2. Start the backend
```powershell
.\gradlew.bat :backend:ecollecto-backend:bootRun
# Starts on http://localhost:8080
```

### 3. Start the frontend
```powershell
.\gradlew.bat :frontend:ecollecto-ui:npmDev
# Vite dev server on http://localhost:5173 — proxies /api to http://localhost:8080
```

### Docker
A Docker Compose setup for MongoDB (and later Keycloak) is planned as part of the next delivery phase. See [doc/ROADMAP.md](doc/ROADMAP.md).

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
