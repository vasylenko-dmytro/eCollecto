# eCollecto Backend

Spring Boot service that serves the eCollecto stamp collection data via a read-only REST API backed by MongoDB. It also exposes a Spring AI MCP server for integration tooling.

## Features
- Read-only REST endpoints for stamps, first day covers, designers, and tariffs
- MongoDB persistence with Spring Data repositories
- Global error handling with a consistent error response schema
- JaCoCo test coverage reporting

## Tech Stack
- Java 25 (Gradle toolchain)
- Spring Boot 4
- Spring Web + Validation
- Spring Data MongoDB
- Spring AI MCP Server
- Lombok

## Requirements
- JDK 25 installed (or a toolchain that can provision it)
- MongoDB running locally (default)

## Configuration
Default config lives at `src/main/resources/application.properties`:

- `spring.mongodb.uri` (default: `mongodb://localhost:27017/ecollecto`)
- `spring.ai.mcp.server.enabled` (default: `true`)

Override with environment variables or `-D` flags as needed, for example:

```bash
./gradlew bootRun -Dspring.mongodb.uri=mongodb://localhost:27017/ecollecto
```

## Run Locally

```bash
./gradlew :backend:ecollecto-backend:bootRun
```

On Windows PowerShell:

```powershell
.\gradlew.bat :backend:ecollecto-backend:bootRun
```

The app starts on `http://localhost:8080` by default.

## Test

```bash
./gradlew :backend:ecollecto-backend:test
```

JaCoCo report output: `backend/ecollecto-backend/build/reports/jacoco/test/html/index.html`.

## API
Base path: `/api`

Endpoints:
- `GET /api/stamps`
- `GET /api/stamp/{id}`
- `GET /api/first-day-covers`
- `GET /api/first-day-covers/{id}`
- `GET /api/designers`
- `GET /api/designer/{id}`
- `GET /api/tariffs`
- `GET /api/tariffs/{year}/{currency}`
- `GET /api/tariffs/{year}/{currency}/{letter}`

Error responses follow:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "status": 404
}
```

See full examples in `doc/API.md`.

## Project Structure
- `src/main/java/com/vasylenko/ecollectobackend` Spring Boot app and feature modules
- `src/main/resources` application config
- `src/test/java` unit and web layer tests
- `doc` API docs
