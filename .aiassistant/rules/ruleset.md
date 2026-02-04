# AI Assistant Rules

## Context-Awareness
- Always check the type correspondence in `backend/.../models` and `frontend/.../types.ts` before proposing changes.

## Relative Paths
- For working with the frontend, use the relative path from the project root: `./frontend/ecollecto-ui`.

## Vite Proxy
- When creating new endpoints, keep in mind that the frontend expects them at the path `/api/*` thanks to the proxy in Vite.