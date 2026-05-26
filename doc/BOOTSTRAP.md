# eCollecto — Local Development Bootstrap

This guide walks a new engineer through bringing up every dependency and running both the backend and frontend from a clean clone, **without any manual tool installation beyond JDK and Docker**.

---

## Prerequisites

| Tool               | Version       | Notes                                                                                                            |
|--------------------|---------------|------------------------------------------------------------------------------------------------------------------|
| **JDK**            | 25            | Required by the Gradle toolchain. [Download Temurin 25](https://adoptium.net/). Set `JAVA_HOME` to the JDK root. |
| **Docker Desktop** | latest stable | Required for MongoDB and Keycloak. [Download](https://www.docker.com/products/docker-desktop/).                  |
| **Git**            | any           | Standard clone/branch workflow.                                                                                  |

> **Node.js is NOT needed.** The Gradle Node plugin (`download = true` in `frontend/ecollecto-ui/build.gradle`) downloads and manages Node 24.7.0 and npm 11.6.0 automatically into `.gradle/` on first run.

---

## Step 1 — Clone the repository

```bash
git clone <repo-url>
cd eCollecto
```

---

## Step 2 — Create environment files

The project reads configuration from two `.env` files that are **not** committed to git (they are listed in `.gitignore`). Templates are provided.

### 2a. Root `.env` (Docker Compose + backend + frontend config)

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

The default values in `.env.example` work for local development without modification. Edit only if your local ports conflict:

| Variable                         | Default                                  | Purpose                  |
|----------------------------------|------------------------------------------|--------------------------|
| `MONGO_PORT`                     | `27017`                                  | MongoDB host port        |
| `KC_PORT`                        | `8180`                                   | Keycloak HTTP port       |
| `KC_ADMIN` / `KC_ADMIN_PASSWORD` | `admin` / `admin`                        | Keycloak bootstrap admin |
| `BACKEND_PORT`                   | `8080`                                   | Spring Boot server port  |
| `SPRING_SECURITY_OAUTH2_ISSUER`  | `http://localhost:8180/realms/ecollecto` | JWT issuer URI           |

### 2b. Frontend Vite variables

```bash
# Linux / macOS
cp frontend/ecollecto-ui/.env.example frontend/ecollecto-ui/.env.local

# Windows PowerShell
Copy-Item frontend\ecollecto-ui\.env.example frontend\ecollecto-ui\.env.local
```

These Vite variables point the React app at the local Keycloak instance:
- `VITE_KEYCLOAK_URL=http://localhost:8180`
- `VITE_KEYCLOAK_REALM=ecollecto`
- `VITE_KEYCLOAK_CLIENT_ID=ecollecto-ui`

---

## Step 3 — Start supporting services (MongoDB + Keycloak)

```bash
docker compose up -d
```

This starts two containers:
- **`ecollecto-mongo`** — MongoDB 8, exposed on `localhost:27017`, data persisted in the `mongo_data` Docker volume.
- **`ecollecto-keycloak`** — Keycloak 26.2, exposed on `localhost:8180`. The `ecollecto` realm is imported automatically from `keycloak/realm-export.json` on first startup.

> **First-run note:** Keycloak downloads its image and imports the realm; allow ~30–60 seconds before the admin UI is reachable.

### Verify services are healthy

```bash
# Should print a JSON document with "issuer" and "authorization_endpoint" keys
curl http://localhost:8180/realms/ecollecto/.well-known/openid-configuration

# Should return MongoDB version info
docker exec ecollecto-mongo mongosh --eval "db.version()" --quiet
```

---

## Step 4 — Seed MongoDB with sample data

The backend requires data in four MongoDB collections. Seed them from the canonical JSON files in `collection/`:

```bash
# Copy JSON files into the container, then import each collection
docker cp collection/stamp.json          ecollecto-mongo:/tmp/stamp.json
docker cp collection/designers.json      ecollecto-mongo:/tmp/designers.json
docker cp collection/first_day_covers.json ecollecto-mongo:/tmp/first_day_covers.json
docker cp collection/tariffs.json        ecollecto-mongo:/tmp/tariffs.json

docker exec ecollecto-mongo mongoimport --db ecollecto --collection stamp           --jsonArray --file /tmp/stamp.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection designers       --jsonArray --file /tmp/designers.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection first_day_covers --jsonArray --file /tmp/first_day_covers.json
docker exec ecollecto-mongo mongoimport --db ecollecto --collection tariffs         --jsonArray --file /tmp/tariffs.json
```

> **Already seeded?** If you re-run these commands against a populated database, `mongoimport` will fail on duplicate `_id` values. Either drop the collections first (see [Reset the database](#reset-the-database)) or add `--mode upsert` to each import command.

### Verify data loaded

```bash
docker exec ecollecto-mongo mongosh ecollecto --eval "
  printjson({
    stamps:           db.stamp.countDocuments(),
    designers:        db.designers.countDocuments(),
    first_day_covers: db.first_day_covers.countDocuments(),
    tariffs:          db.tariffs.countDocuments()
  })
" --quiet
```

Expected output: four positive integers.

---

## Step 5 — Start the backend

```bash
# Linux / macOS
./gradlew :backend:ecollecto-backend:bootRun

# Windows PowerShell
.\gradlew.bat :backend:ecollecto-backend:bootRun
```

- First run downloads all Gradle dependencies and compiles the project (~1–2 min).
- The Spring Boot app starts on **http://localhost:8080**.

### Verify the backend

```bash
curl http://localhost:8080/api/stamps
# → JSON array of stamp objects

curl http://localhost:8080/api/designers
# → JSON array of designer objects
```

---

## Step 6 — Start the frontend

Open a **second terminal** (keep the backend running in the first):

```bash
# Linux / macOS
./gradlew :frontend:ecollecto-ui:npmDev

# Windows PowerShell
.\gradlew.bat :frontend:ecollecto-ui:npmDev
```

- First run downloads Node 24.7.0, npm 11.6.0, and all npm packages (~1–2 min).
- Vite dev server starts on **http://localhost:5173**.
- API requests to `/api/*` are proxied to `http://localhost:8080` (configured in `vite.config.ts`).

Open **http://localhost:5173** in a browser. You should see the stamp browse page.

---

## Test user accounts

The `ecollecto` Keycloak realm is pre-seeded with two users (from `keycloak/realm-export.json`):

| Username   | Password   | Realm roles     |
|------------|------------|-----------------|
| `testuser` | `password` | `user`          |
| `admin`    | `admin`    | `user`, `admin` |

Click **Sign in** in the header to authenticate via Keycloak (Authorization Code + PKCE). After login you are redirected back to the app.

**Keycloak Admin UI:** http://localhost:8180  
Login with the bootstrap admin credentials from your `.env`: `KC_ADMIN` / `KC_ADMIN_PASSWORD` (default: `admin` / `admin`). Select the `ecollecto` realm to inspect clients, roles, and users.

---

## Running tests

```bash
# Backend (JUnit 5 + JaCoCo)
.\gradlew.bat :backend:ecollecto-backend:test

# Coverage report: backend/ecollecto-backend/build/reports/jacoco/test/html/index.html

# Frontend lint
.\gradlew.bat :frontend:ecollecto-ui:npmLint

# Frontend tests (Vitest + React Testing Library)
# From the frontend module directory:
cd frontend/ecollecto-ui
npm test

# Or run Vitest in watch mode:
npm run test:watch
```

---

## Stopping services

```bash
# Stop Docker containers (data is preserved in the mongo_data volume)
docker compose down

# Stop Gradle processes: Ctrl+C in each terminal running bootRun / npmDev
```

---

## Reset the database

```bash
# Stop containers and delete all Docker volumes (wipes MongoDB data)
docker compose down -v

# Start fresh
docker compose up -d

# Re-seed (repeat Step 4)
```

---

## Service URL reference

| Service                       | URL                                                                     |
|-------------------------------|-------------------------------------------------------------------------|
| Frontend (dev)                | http://localhost:5173                                                   |
| Backend API                   | http://localhost:8080/api                                               |
| Backend OpenAPI UI            | http://localhost:8080/swagger-ui/index.html                             |
| Keycloak Admin                | http://localhost:8180                                                   |
| Keycloak Realm OIDC discovery | http://localhost:8180/realms/ecollecto/.well-known/openid-configuration |

---

## Troubleshooting

### `JAVA_HOME` not set or wrong JDK version

```
error: release version 25 not supported
```

Set `JAVA_HOME` to a JDK 25 installation, or let the Gradle toolchain resolver download it automatically by ensuring internet access on first build.

### Backend fails to connect to MongoDB (`MongoSocketOpenException`)

- Confirm the container is running: `docker ps | grep ecollecto-mongo`
- Check the port in your `.env` matches the MongoDB container mapping (`MONGO_PORT=27017`).
- The backend reads `SPRING_MONGODB_URI`; if that env var is set in your shell it overrides the default. Unset it or set it to `mongodb://localhost:27017/ecollecto`.

### Backend fails to start — `Connection refused` to Keycloak (`issuer-uri`)

Spring Security fetches the OIDC discovery document at startup. If Keycloak is not running yet:

```
Failed to resolve issuer "http://localhost:8180/realms/ecollecto"
```

Start Docker services first (`docker compose up -d`) and wait for Keycloak to finish importing the realm before starting the backend.

### Keycloak realm not imported automatically

Check the Keycloak logs:

```bash
docker logs ecollecto-keycloak
```

The realm import file is mounted from `./keycloak/` into the container at `/opt/keycloak/data/import`. Make sure that directory exists and `realm-export.json` is present.

### Port conflicts

If `8080`, `8180`, or `27017` are already in use on your machine, edit `.env` to assign different ports before running `docker compose up`. Update `SPRING_SECURITY_OAUTH2_ISSUER` to match the new Keycloak port, and update `frontend/ecollecto-ui/.env.local` → `VITE_KEYCLOAK_URL` accordingly.

### `mongoimport: command not found` inside the container

The official `mongo:8` image includes `mongoimport`. If you get this error, ensure you are targeting the correct container name (`ecollecto-mongo`) and that the container is running.

### npm install fails inside Gradle

The Gradle Node plugin downloads Node and npm into `.gradle/nodejs/`. Ensure your machine has internet access on first run and that no proxy blocks `nodejs.org` or `registry.npmjs.org`.

