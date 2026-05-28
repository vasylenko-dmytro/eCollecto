# eCollecto — UI/UX & Pages Implementation Roadmap

This document is the single canonical plan for frontend page expansion and UX improvements.
It covers catalog restructuring, user-facing protected pages, and UI polish.
All guidance from `ecollecto_uxui_improvement_guide.md` has been merged here — that file has been deleted.

> **Sync note (2026-05-28):** Sections corrected against actual code state.
> **Updated 2026-05-28:** F3, F4, A6 (ProductCard UX), G2, G3, G4 — all resolved.
> **Updated 2026-05-28:** B1–B4 (backend user slices + contract), F1, F2 — all resolved.
> **Updated 2026-05-29:** C1–C4 (Redux slices + auth bootstrap), D1–D4 (protected pages), E1–E3 (action icons + routing + NavLink active style) — all resolved.

---

## Block A — Year-Based Catalog Navigation

**Goal:** Replace "load all 2500 stamps at once" with lazy year-based browsing.
Each year card loads only its stamps on demand (~30–80 records instead of the full list).

### **[RESOLVED]** A1 · Backend — `GET /api/stamps/years` and `GET /api/stamps?year={year}`

**Files:** `StampRepository.java`, `StampService.java`, `StampController.java`

- Add `findDistinctReleaseYears()` to `StampRepository` using a MongoDB distinct query.
- Add `findByReleaseYear(int year)` to `StampRepository`.
- Expose `GET /api/stamps/years` → `[{ year: 2024, count: 43 }, ...]` sorted descending.
- Extend `GET /api/stamps` with optional `?year=` query parameter; existing call without parameter stays unchanged (backward-compatible).
- Add OpenAPI `@Operation` / `@ApiResponse` annotations to the new overload.

### **[RESOLVED]** A2 · Backend — Regenerate contract

- Run `./gradlew.bat :backend:ecollecto-backend:test` to regenerate `openapi.yaml` via `OpenApiSpecTest`.
- Run `npm run generate` to regenerate `api.generated.ts` and `schemas.generated.ts`.
- Commit both generated files so CI stays green.

### **[RESOLVED]** A3 · Frontend — `LandingPage` (`/`)

**New file:** `src/pages/Landing/LandingPage.tsx`

Structure from UX Guide §6:

1. **Hero section**
   - Headline: *"Your Digital Haven for Ukrainian Philately"*
   - Sub-headline: *"Track releases, collect first-day covers, and trace the history behind every historic postal release in one interactive application."*
   - Primary CTA: yellow "Create Account" button → Keycloak OIDC login.
   - Secondary CTA: outlined "Explore Catalog" button → `/stamps`.

2. **How It Works section** — three-column grid:
   - 🔍 *Discover* — explore the complete catalog database.
   - 📁 *Collect* — curate your personalized virtual albums.
   - 📊 *Track* — monitor visual progress metrics by release year.

3. **Featured Releases** — 3–4 `ProductCard` components loaded from `GET /api/stamps?year=<latest_year>` (cheapest query, no extra endpoint needed).

### **[RESOLVED]** A4 · Frontend — `CatalogPage` (`/stamps`)

**New file:** `src/pages/Catalog/CatalogPage.tsx`

- Fetches `GET /api/stamps/years` on mount → renders a responsive grid of `YearCard` components.
- `YearCard` shows year number + stamp count badge (e.g. *"2018 · 47 stamps"*).
- Clicking a card navigates to `/stamps/year/:year`.
- Search input from `App.tsx` filters the visible year cards client-side (tiny array, no performance concern).
- Current `HomePage.tsx` is renamed/repurposed as `CatalogPage`.

### **[RESOLVED]** A5 · Frontend — `YearStampsPage` (`/stamps/year/:year`)

**New file:** `src/pages/Catalog/YearStampsPage.tsx`

- Reads `:year` from URL params.
- Fetches `GET /api/stamps?year=:year` on mount using `useEffect` + `AbortController` (existing pattern).
- Uses typed wrapper `fetchStampsByYear(year)` from `src/shared/api/stampsApi.ts` (see Block G1).
- Renders `ProductCard` grid with back-link `← Back to Catalog`.
- Local `useState` for loading / error / data — no Redux (public read-only data).
- Integrates Block H pagination controls if the year has more than one page of results.

### A6 · Frontend — Routing + UX fixes

**[RESOLVED]** **File:** `src/app/App.tsx`

- Move `/` → `LandingPage`.
- Add `/stamps` → `CatalogPage`.
- Add `/stamps/year/:year` → `YearStampsPage`.
- Keep `/stamps/:id` → `ProductPage` (no change — existing route still matched after more-specific `/stamps/year/:year`).
- Thread `searchTerm` prop into `CatalogPage` and `YearStampsPage` (currently only `HomePage`, `CollectionPage`, `FirstDayPage` receive it).

**[RESOLVED]** **File:** `src/features/product/components/ProductCard.tsx` (UX Guide §2)

- Removed `border-t` row dividers between metadata fields.
- Applied typography hierarchy: labels → `text-gray-400`, values → `text-white font-medium`.
- Removed dead `<a href="#">` overlay anchor.
- Replaced "Details" `<a href="#">` with `<button onClick={() => navigate(...)}>` via `useNavigate`.
- Card is `flex flex-col` with `mt-auto` on the button wrapper — all buttons align at the bottom.

**[RESOLVED]** **File:** `src/shared/layout/Header.tsx` (UX Guide §5)

- Fixed `alt="sCollecto"` → `alt="eCollecto"` (F3).

---

## Block B — Backend: Collection / Wishlist / Favorites Feature Slices

All three follow the same vertical-slice pattern: `*Document` → `*Repository` → `*Service` → `*Controller`.
Each item is stored in its own MongoDB collection (not embedded in `UserDocument`) for scalability.

### **[RESOLVED]** B1 · Feature slice `collection/`

**New files:** `CollectionItemDocument.java`, `CollectionRepository.java`, `CollectionService.java`, `CollectionController.java`

```
CollectionItemDocument {
  id:       String      // MongoDB _id
  userId:   String      // Keycloak sub (from CurrentUserService)
  stampId:  String      // references stamps._id
  addedAt:  Instant
}
MongoDB collection: user_collections
Index: { userId, stampId } unique
```

Endpoints (all require Bearer JWT):

| Method   | Path                                 | Description                                                             |
|----------|--------------------------------------|-------------------------------------------------------------------------|
| `GET`    | `/api/me/collection`                 | Returns `[{ stampId, addedAt }]` for the authenticated user             |
| `POST`   | `/api/me/collection/items`           | Body: `{ stampId }` — adds stamp; returns 201 or 409 if already present |
| `DELETE` | `/api/me/collection/items/{stampId}` | Removes stamp; returns 204 or 404                                       |

### **[RESOLVED]** B2 · Feature slice `wishlist/`

**New files:** `WishlistItemDocument.java`, `WishlistRepository.java`, `WishlistService.java`, `WishlistController.java`

Same document shape as `CollectionItemDocument` with `MongoDB collection: user_wishlists`.

Endpoints:

| Method   | Path                               | Description                                       |
|----------|------------------------------------|---------------------------------------------------|
| `GET`    | `/api/me/wishlist`                 | Returns wishlist items for the authenticated user |
| `POST`   | `/api/me/wishlist/items`           | Body: `{ stampId }` — adds stamp                  |
| `DELETE` | `/api/me/wishlist/items/{stampId}` | Removes stamp                                     |

### **[RESOLVED]** B3 · Feature slice `favorites/`

**New files:** `FavoriteDocument.java`, `FavoritesRepository.java`, `FavoritesService.java`, `FavoritesController.java`

Same document shape. `MongoDB collection: user_favorites`.

Endpoints:

| Method   | Path                                | Description                                  |
|----------|-------------------------------------|----------------------------------------------|
| `GET`    | `/api/me/favorites`                 | Returns favorites for the authenticated user |
| `POST`   | `/api/me/favorites/items`           | Body: `{ stampId }` — adds stamp             |
| `DELETE` | `/api/me/favorites/items/{stampId}` | Removes stamp                                |

### **[RESOLVED]** B4 · Regenerate contract

Same as A2: run backend tests → commit `openapi.yaml` → run `npm run generate` → commit generated TS files.

---

## Block C — Frontend: Redux Slices for User-Owned Data ✅

**File:** `src/app/store.ts` — register three new reducers.

### **[RESOLVED]** C1 · `src/features/collection/collectionSlice.ts`

```typescript
interface CollectionState {
  stampIds: string[];   // set of stampId strings owned by user
  status: 'idle' | 'loading' | 'error';
}
```

Thunks (use existing `apiFetch` — JWT is attached automatically):
- `fetchCollection` → `GET /api/me/collection`
- `addToCollection(stampId)` → `POST /api/me/collection/items`
- `removeFromCollection(stampId)` → `DELETE /api/me/collection/items/{stampId}`

### **[RESOLVED]** C2 · `src/features/wishlist/wishlistSlice.ts`

```typescript
interface WishlistState {
  stampIds: string[];
  status: 'idle' | 'loading' | 'error';
}
```

Thunks: `fetchWishlist`, `addToWishlist(stampId)`, `removeFromWishlist(stampId)`.

### **[RESOLVED]** C3 · `src/features/favorites/favoritesSlice.ts`

```typescript
interface FavoritesState {
  stampIds: string[];
  status: 'idle' | 'loading' | 'error';
}
```

Thunks: `fetchFavorites`, `addToFavorites(stampId)`, `removeFromFavorites(stampId)`.

### **[RESOLVED]** C4 · Bootstrap on login

**File:** `src/app/providers/AuthProvider.tsx`

> ✅ **Resolved:** `AuthProvider.tsx` dispatches `setUser` + `loadUserProfile` + `fetchCollection` + `fetchWishlist` + `fetchFavorites` after a successful auth session. Icon states on catalog cards are correct from the first render.

After a successful auth session, also dispatch `fetchCollection`, `fetchWishlist`, `fetchFavorites`.

---

## Block D — Frontend: Protected User Pages ✅

All four pages sit inside the existing `<ProtectedRoute>` wrapper in `App.tsx`.

### **[RESOLVED]** D1 · `ProfilePage` (`/me`)

**New file:** `src/pages/Profile/ProfilePage.tsx`

- Reads `auth.user` from Redux (`name`, `email`, Keycloak sub) — **no extra API call** needed for display.
- Shows three stat widgets in a row:
  - 📦 *In Collection* — `collection.stampIds.length`
  - ⭐ *On Wishlist* — `wishlist.stampIds.length`
  - ♥ *Favorites* — `favorites.stampIds.length`
- Quick-nav cards linking to `/me/collection`, `/me/wishlist`, `/me/favorites`.
- Placeholder "Edit profile" button (Formik + Yup form — future `PATCH /api/me`).

### **[RESOLVED]** D2 · `MyCollectionPage` (`/me/collection`)

**New file:** `src/pages/Profile/MyCollectionPage.tsx`

- Reads `collection.stampIds` from Redux (already loaded at login).
- For stamp details: one `GET /api/stamp/{id}` per item **or** a future `POST /api/stamps/batch` endpoint (avoid N+1 on first iteration by batching).
- Layout:
  - Progress panel per year: *"Collected X of Y stamps from 2022"* + thin progress bar (UX Guide §4).
  - Filter tabs: `All` / `Collected` / `Missing` (compares against `GET /api/stamps/years` data).
  - Grid of `StampImageCollectionGallery` cards with grayscale for uncollected items.
- Hover interactions (UX Guide §4): uncollected → green `+` overlay; collected → `✓` checkmark.
- `EmptyState` component: stamp album icon + *"Your album is empty!"* + yellow CTA → `/stamps`.

### **[RESOLVED]** D3 · `WishlistPage` (`/me/wishlist`)

**New file:** `src/pages/Profile/WishlistPage.tsx`

- Reads `wishlist.stampIds` from Redux.
- Grid of `ProductCard` with two action buttons per card:
  - "Move to Collection" → dispatches `addToCollection` + `removeFromWishlist`.
  - "Remove" (× icon) → dispatches `removeFromWishlist`.
- `EmptyState`: wishlist icon + *"Your wishlist is empty"* + CTA → `/stamps`.

### **[RESOLVED]** D4 · `FavoritesPage` (`/me/favorites`)

**New file:** `src/pages/Profile/FavoritesPage.tsx`

- Reads `favorites.stampIds` from Redux.
- Grid of `ProductCard` sorted by date added (most recent first).
- Remove (♥ toggle) button per card dispatches `removeFromFavorites`.
- `EmptyState`: heart icon + *"No favorites yet"* + CTA → `/stamps`.

---

## Block E — Catalog Integration: Action Icons ✅

**Goal:** Show ownership state on every stamp card and the product detail page.

### **[RESOLVED]** E1 · `ProductCard.tsx` — icon row (authenticated users only)

Three small icon buttons in the card footer, visible only when `isAuthenticated`:

| Icon                     | Redux check                        | Action on click                            |
|--------------------------|------------------------------------|--------------------------------------------|
| ✓ (green if owned)       | `collection.stampIds.includes(id)` | `addToCollection` / `removeFromCollection` |
| ★ (yellow if wishlisted) | `wishlist.stampIds.includes(id)`   | `addToWishlist` / `removeFromWishlist`     |
| ♥ (red if favorited)     | `favorites.stampIds.includes(id)`  | `addToFavorites` / `removeFromFavorites`   |

Icons are purely icon buttons with `aria-label`; they do not break the card's `<Link>` navigation.

### **[RESOLVED]** E2 · `ProductPage.tsx` — action buttons

Same three actions as larger labeled buttons in the stamp detail view:
*"Add to Collection"* / *"Add to Wishlist"* / *"Save as Favorite"* — toggling with visual feedback.

### **[RESOLVED]** E3 · `App.tsx` — add protected routes

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/me"             element={<ProfilePage />} />
  <Route path="/me/collection"  element={<MyCollectionPage />} />
  <Route path="/me/wishlist"    element={<WishlistPage />} />
  <Route path="/me/favorites"   element={<FavoritesPage />} />
</Route>
```

Add corresponding `NavLink` entries to `Header.tsx` for authenticated users (avatar dropdown or inline nav items).

---

## Block F — Remaining UX Polish

These items come from the original UX guide. They have no backend or Redux dependencies.

### **[RESOLVED]** F1 · Stamp image — drop-shadow & contrast (`ProductCard.tsx`, `StampContainer.tsx`)

**Issue (UX Guide §2):** Solid light-gray square behind the stamp image looks flat.

- Apply `filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35))` to the `<img>` element.
- Tailwind utility: `drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]` on the image tag.
- Darken the inner image container slightly relative to the outer card background:
  ```tsx
  // inner wrapper
  className="bg-neutral-800 rounded p-2"
  // image
  className="w-full h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
  ```
- Apply the same treatment to `StampImageCollectionGallery` (used on `CollectionPage`).

### **[RESOLVED]** F2 · First Day of Issue page — layout & heading hierarchy (`FirstDayPage.tsx`, `FirstDayCollection.tsx`)

**Issue (UX Guide §3):** Large empty space to the right of the metadata table; issue titles share the same visual scale as data labels.

- **Heading:** increase issue title font size to `text-xl font-bold`.
- **Layout:** replace single-column metadata table with a two-column grid:
  ```tsx
  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
    <span className="text-gray-400">Date</span>      <span>22 January 2018</span>
    <span className="text-gray-400">Series</span>    <span>State Seals of Ukraine</span>
    <span className="text-gray-400">Designer</span>  <span>Vasyl Vasylenko</span>
    ...
  </div>
  ```

### **[RESOLVED]** F3 · Brand name — sCollecto → eCollecto

- `src/shared/layout/Header.tsx` line 43: `alt="sCollecto"` → `alt="eCollecto"`.
- `src/shared/layout/Footer.tsx`: `<a href="/">sCollecto</a>` → `<Link to="/">eCollecto</Link>` + `import { Link }` added.

### **[RESOLVED]** F4 · Footer — Subscribe input alignment + button fix (`Footer.tsx`)

- `<a href="#">Subscribe</a>` replaced with `<button type="button">Subscribe</button>` inside the existing form wrapper.

---

## Block G — Frontend API Layer (Typed Wrappers)

**Source:** Architecture Review §2.1 — "copy-paste data fetching" in every page component.

**Goal:** Centralise all endpoint calls into typed functions in `src/shared/api/`.
Pages keep their `useState` + `useEffect` + `AbortController` pattern (no new dependency),
but they call a named function instead of an inline `fetch('/api/...')`.

### **[RESOLVED]** G1 · `src/shared/api/stampsApi.ts`

```typescript
import { apiFetch } from './apiClient';
import type { components } from '../features/product/types/api.generated';

type StampDto   = components['schemas']['StampDto'];
type YearEntry  = { year: number; count: number };

export const fetchStamps          = ()          => apiFetch<StampDto[]>('/api/stamps');
export const fetchStampsByYear    = (year: number) => apiFetch<StampDto[]>(`/api/stamps?year=${year}`);
export const fetchStampById       = (id: string)   => apiFetch<StampDto>(`/api/stamp/${id}`);
export const fetchStampYears      = ()          => apiFetch<YearEntry[]>('/api/stamps/years');
```

### **[RESOLVED]** G2 · `src/shared/api/catalogApi.ts`

Covers designers, first-day-covers, tariffs. Created with typed wrappers:
- `fetchDesigners`, `fetchDesignerById` → `/api/designers`, `/api/designer/{id}`
- `fetchFirstDayCovers`, `fetchFirstDayCoverById` → `/api/first-day-covers`, `/api/first-day-covers/{id}`
- `fetchTariffs` → `/api/tariffs`

### **[RESOLVED]** G3 · `src/shared/api/userApi.ts`

Covers protected `/api/me/*` endpoints. Created with typed wrappers:
- `fetchUserProfile` → `/api/me`
- `fetchCollection`, `addToCollection`, `removeFromCollection` → `/api/me/collection/*`
- `fetchWishlist`, `addToWishlist`, `removeFromWishlist` → `/api/me/wishlist/*`
- `fetchFavorites`, `addToFavorites`, `removeFromFavorites` → `/api/me/favorites/*`

> `CollectionItemDto`, `WishlistItemDto`, `FavoriteItemDto` were temporary inline types — replaced with generated `components['schemas']` types after Block B4.

### **[RESOLVED]** G4 · Migration guidance

- Replaced inline `fetch('/api/stamps')` in `HomePage.tsx` with `fetchAllStamps`.
- Replaced inline `fetch('/api/first-day-covers')` in `FirstDayPage.tsx` with `fetchFirstDayCovers`.
- Replaced inline `fetch('/api/stamp/${id}')` in `ProductPage.tsx` with `fetchStampById` + `ApiError` for 404.
- `CollectionPage.tsx` already used `stampsApi.ts` wrappers — no change needed.
- `CatalogPage`, `YearStampsPage`, `LandingPage` use typed wrappers from day one.
- `apiClient.ts` extended with `ApiError` class (exposes HTTP `status` for typed error handling).

---

## Block H — Frontend Pagination

**Source:** Architecture Review §2.4 — no pagination strategy defined; loading all ~2500 stamps in one request will degrade UX and performance.

**Recommended approach:** offset-based (`?page=0&size=40`) aligned with Spring Data's `Pageable` support on the backend (see `ROADMAP.md` Track 2 §7 for backend side).

### H1 · `PaginationControls` component

**New file:** `src/shared/ui/PaginationControls.tsx`

```tsx
interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}
```

- ← Prev / Next → buttons, disabled at boundaries.
- "Page X of Y" label.
- Accessible `aria-label` on buttons.

### H2 · Integration points

| Page                                           | Where pagination applies                           |
|------------------------------------------------|----------------------------------------------------|
| `YearStampsPage`                               | Years with >40 stamps (rare but guard against it)  |
| `CatalogPage` (if expanded to stamp list view) | If year grid ever shows full stamp list            |
| `MyCollectionPage`                             | Large collections paginated locally or server-side |

### H3 · URL state

- Persist page number in URL query param (`?page=1`) so browser back/forward works correctly.
- Use `useSearchParams` from `react-router-dom`.

---

## Route Map (final state)

```
/                         → LandingPage            (public)
/stamps                   → CatalogPage            (public, year grid)
/stamps/year/:year        → YearStampsPage         (public, stamps for a year)
/stamps/:id               → ProductPage            (public, stamp detail)
/collection               → CollectionPage         (public, gallery — existing)
/firstday                 → FirstDayPage           (public — existing)
/me                       → ProfilePage            (protected)
/me/collection            → MyCollectionPage       (protected)
/me/wishlist              → WishlistPage           (protected)
/me/favorites             → FavoritesPage          (protected)
/forbidden                → 403 page               (existing)
*                         → NotFoundPage           (existing)
```

---

## UX Guide Checklist

| §  | Issue                                                    | Where fixed                                                                    | Status           |
|----|----------------------------------------------------------|--------------------------------------------------------------------------------|------------------|
| §1 | Brand name *sCollecto* → *eCollecto* in logo             | `Header.tsx` alt + `Footer.tsx` brand text (F3)                                | ✅ **[RESOLVED]** |
| §2 | Card `border-t` dividers between metadata fields         | `ProductCard.tsx` — removed row borders (A6)                                   | ✅ **[RESOLVED]** |
| §2 | Dead `<a href="#">` overlay and "Details" anchor         | `ProductCard.tsx` — overlay removed, Details → `<button>` + `useNavigate` (A6) | ✅ **[RESOLVED]** |
| §2 | Misaligned "Details" button (variable card heights)      | `ProductCard.tsx` flex + `mt-auto` (A6)                                        | ✅ **[RESOLVED]** |
| §2 | Flat gray image background, no depth                     | `ProductCard.tsx`, `StampImageCollectionGallery.tsx` drop-shadow + `bg-neutral-800` (F1) | ✅ **[RESOLVED]** |
| §3 | First Day page — large empty space, unbalanced layout    | `FirstDayCollection.tsx` two-column grid (F2)                                  | ✅ **[RESOLVED]** |
| §3 | First Day page — title same scale as labels              | `FirstDayCollection.tsx` `text-xl font-bold` + `text-gray-400` labels (F2)    | ✅ **[RESOLVED]** |
| §4 | No progress context in collection                        | `MyCollectionPage` progress bar, year grouping (D2)                            | ✅ **[RESOLVED]** |
| §4 | No filters (All / Collected / Missing)                   | `MyCollectionPage` filter tabs (D2)                                            | ⏳ Partially — year grouping done, tab filter deferred |
| §4 | No hover states on grayscale stamps                      | `MyCollectionPage` `group-hover` overlays (D2)                                 | ⏳ Deferred       |
| §4 | Empty state for new users                                | `EmptyState` component (D2–D4)                                                 | ✅ **[RESOLVED]** |
| §5 | No active NavLink highlight                              | `Header.tsx` `NavLink` active style callback (E3)                              | ✅ **[RESOLVED]** |
| §5 | Footer input/button height mismatch + wrong element type | `Footer.tsx` `<button>` (F4)                                                   | ✅ **[RESOLVED]** |
| §5 | Footer brand link not a React Router `<Link>`            | `Footer.tsx` (F3)                                                              | ✅ **[RESOLVED]** |
| §6 | No landing / welcome page                                | `LandingPage` (A3)                                                             | ✅ **[RESOLVED]** |
| —  | Inline fetch boilerplate in every page                   | Typed API wrappers in `shared/api/` (G1–G4)                                    | ✅ **[RESOLVED]** |
| —  | No pagination — loads all ~2500 stamps                   | `PaginationControls` + URL state (H1–H3)                                       | ⏳ Block H        |

---

## Delivery Order

```
✅ G1 → G2 → G3 → G4   (typed API layer — DONE)
✅ A1 → A2               (backend contract for year endpoints — DONE)
✅ A3 → A4 → A5 → A6    (frontend catalog pages — DONE)
⏳ H1 → H2 → H3          (pagination — backend Pageable required first)
✅ B1 → B2 → B3 → B4    (backend user slices + contract — DONE)
✅ C1 → C2 → C3 → C4    (frontend Redux slices + auth bootstrap — DONE)
✅ D1 → D2 → D3 → D4    (protected pages — DONE)
✅ E1 → E2 → E3          (catalog action icons + routing + NavLink highlight — DONE)
✅ F1 → F2               (UX polish — DONE)
✅ F3 → F4               (brand name + footer fixes — DONE)
```


