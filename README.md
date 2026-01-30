# eCollecto

eCollecto is a stamp collection application with a React/Vite UI and a Spring Boot backend. The UI presents stamp listings, collection views, and first-day covers, while the backend provides REST APIs for stamp data and postal tariffs.

High-level architecture:
- `frontend/ecollecto-ui` - React + Vite single-page application that renders the stamp catalog, collection, and first-day pages. It loads data from REST endpoints (for example `/api/stamps`, `/api/stamp/:id`, `/api/first-day-covers`, `/api/tariffs`) and uses a dev proxy to `http://localhost:8080` via Vite.
- `backend/ecollecto-backend` - Java/Spring Boot API that serves stamp, first-day cover, and tariff data to the UI.

Readme files:
- `frontend/ecollecto-ui/README.md`
- `backend/ecollecto-backend/README.md`
