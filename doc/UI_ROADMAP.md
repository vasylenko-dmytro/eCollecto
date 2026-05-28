# eCollecto — UI/UX & Pages Implementation Roadmap

This document is the single canonical plan for frontend page expansion and UX improvements.
It covers catalog restructuring, user-facing protected pages, and UI polish.
All guidance from `ecollecto_uxui_improvement_guide.md` has been merged here — that file has been deleted.

> **Sync note (2026-05-28):** Sections corrected against actual code state. Gaps discovered:
> - `ProductCard.tsx` still has border-t row dividers, a dead `<a href="#">` overlay anchor, and a dead `<a href="#">` "Details" button — should all use React Router `<Link>`.
> - `Header.tsx` line 43 still has `alt="sCollecto"` (F3 not done).
> - `Footer.tsx` line 9 brand text is still `sCollecto`; brand `<a href="/">` should be `<Link to="/">` (F3 + F4 partially not done).
> - `Footer.tsx` Subscribe button is an `<a href="#">` — should be a `<button>` inside a unified-height wrapper (F4 not done).
> - All Block B–E items — not yet started.

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

**File:** `src/features/product/components/ProductCard.tsx` (UX Guide §2)

> ⚠️ **Outstanding (actual code audit):** All three items below not yet applied.

- Remove `border-t` row dividers between metadata fields (lines 52, 66, 80 — currently replicate the `<hr />` effect with `border-t border-gray-300 dark:border-neutral-900`).
- Apply typography hierarchy: labels → `text-gray-400`, values → `text-white font-medium`.
- Make card a flex column with `mt-auto` on the "Details" button wrapper so all buttons align at the bottom (wrapper exists but the "Details" `<a>` must become a proper `<Link to={...}>` — the dead `<a href="#">` overlay on line 45 and "Details" anchor on line 98 both need replacing with Router-aware links; the parent `<Link>` in `HomePage.tsx` wraps the whole card so the overlay anchor should simply be removed).

**File:** `src/shared/layout/Header.tsx` (UX Guide §5)

- Replace plain `<a>` tags with `<NavLink>` using active style (yellow accent or bottom border). *(NavLink already present for nav items — add active class logic.)*
- Fix `alt="sCollecto"` on line 43 → `alt="eCollecto"`. *(F3 — outstanding.)*

---

## Block B — Backend: Collection / Wishlist / Favorites Feature Slices

All three follow the same vertical-slice pattern: `*Document` → `*Repository` → `*Service` → `*Controller`.
Each item is stored in its own MongoDB collection (not embedded in `UserDocument`) for scalability.

### B1 · Feature slice `collection/`

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

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/me/collection` | Returns `[{ stampId, addedAt }]` for the authenticated user |
| `POST` | `/api/me/collection/items` | Body: `{ stampId }` — adds stamp; returns 201 or 409 if already present |
| `DELETE` | `/api/me/collection/items/{stampId}` | Removes stamp; returns 204 or 404 |

### B2 · Feature slice `wishlist/`

**New files:** `WishlistItemDocument.java`, `WishlistRepository.java`, `WishlistService.java`, `WishlistController.java`

Same document shape as `CollectionItemDocument` with `MongoDB collection: user_wishlists`.

Endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/me/wishlist` | Returns wishlist items for the authenticated user |
| `POST` | `/api/me/wishlist/items` | Body: `{ stampId }` — adds stamp |
| `DELETE` | `/api/me/wishlist/items/{stampId}` | Removes stamp |

### B3 · Feature slice `favorites/`

**New files:** `FavoriteDocument.java`, `FavoritesRepository.java`, `FavoritesService.java`, `FavoritesController.java`

Same document shape. `MongoDB collection: user_favorites`.

Endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/me/favorites` | Returns favorites for the authenticated user |
| `POST` | `/api/me/favorites/items` | Body: `{ stampId }` — adds stamp |
| `DELETE` | `/api/me/favorites/items/{stampId}` | Removes stamp |

### B4 · Regenerate contract

Same as A2: run backend tests → commit `openapi.yaml` → run `npm run generate` → commit generated TS files.

---

## Block C — Frontend: Redux Slices for User-Owned Data

**File:** `src/app/store.ts` — register three new reducers.

### C1 · `src/features/collection/collectionSlice.ts`

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

### C2 · `src/features/wishlist/wishlistSlice.ts`

```typescript
interface WishlistState {
  stampIds: string[];
  status: 'idle' | 'loading' | 'error';
}
```

Thunks: `fetchWishlist`, `addToWishlist(stampId)`, `removeFromWishlist(stampId)`.

### C3 · `src/features/favorites/favoritesSlice.ts`

```typescript
interface FavoritesState {
  stampIds: string[];
  status: 'idle' | 'loading' | 'error';
}
```

Thunks: `fetchFavorites`, `addToFavorites(stampId)`, `removeFromFavorites(stampId)`.

### C4 · Bootstrap on login

**File:** `src/app/providers/AuthProvider.tsx`

> ⚠️ **Hard blocker for Block E icon states:** `AuthProvider.tsx` currently dispatches only `setUser` + `loadUserProfile` after auth. Must also dispatch `fetchCollection`, `fetchWishlist`, `fetchFavorites` so icon states on catalog cards are correct from the first render. C1–C3 slices must exist before this step.

After a successful auth session, also dispatch `fetchCollection`, `fetchWishlist`, `fetchFavorites`.

---

## Block D — Frontend: Protected User Pages

All four pages sit inside the existing `<ProtectedRoute>` wrapper in `App.tsx`.

### D1 · `ProfilePage` (`/me`)

**New file:** `src/pages/Profile/ProfilePage.tsx`

- Reads `auth.user` from Redux (`name`, `email`, Keycloak sub) — **no extra API call** needed for display.
- Shows three stat widgets in a row:
  - 📦 *In Collection* — `collection.stampIds.length`
  - ⭐ *On Wishlist* — `wishlist.stampIds.length`
  - ♥ *Favorites* — `favorites.stampIds.length`
- Quick-nav cards linking to `/me/collection`, `/me/wishlist`, `/me/favorites`.
- Placeholder "Edit profile" button (Formik + Yup form — future `PATCH /api/me`).

### D2 · `MyCollectionPage` (`/me/collection`)

**New file:** `src/pages/Profile/MyCollectionPage.tsx`

- Reads `collection.stampIds` from Redux (already loaded at login).
- For stamp details: one `GET /api/stamp/{id}` per item **or** a future `POST /api/stamps/batch` endpoint (avoid N+1 on first iteration by batching).
- Layout:
  - Progress panel per year: *"Collected X of Y stamps from 2022"* + thin progress bar (UX Guide §4).
  - Filter tabs: `All` / `Collected` / `Missing` (compares against `GET /api/stamps/years` data).
  - Grid of `StampImageCollectionGallery` cards with grayscale for uncollected items.
- Hover interactions (UX Guide §4): uncollected → green `+` overlay; collected → `✓` checkmark.
- `EmptyState` component: stamp album icon + *"Your album is empty!"* + yellow CTA → `/stamps`.

### D3 · `WishlistPage` (`/me/wishlist`)

**New file:** `src/pages/Profile/WishlistPage.tsx`

- Reads `wishlist.stampIds` from Redux.
- Grid of `ProductCard` with two action buttons per card:
  - "Move to Collection" → dispatches `addToCollection` + `removeFromWishlist`.
  - "Remove" (× icon) → dispatches `removeFromWishlist`.
- `EmptyState`: wishlist icon + *"Your wishlist is empty"* + CTA → `/stamps`.

### D4 · `FavoritesPage` (`/me/favorites`)

**New file:** `src/pages/Profile/FavoritesPage.tsx`

- Reads `favorites.stampIds` from Redux.
- Grid of `ProductCard` sorted by date added (most recent first).
- Remove (♥ toggle) button per card dispatches `removeFromFavorites`.
- `EmptyState`: heart icon + *"No favorites yet"* + CTA → `/stamps`.

---

## Block E — Catalog Integration: Action Icons

**Goal:** Show ownership state on every stamp card and the product detail page.

### E1 · `ProductCard.tsx` — icon row (authenticated users only)

Three small icon buttons in the card footer, visible only when `isAuthenticated`:

| Icon | Redux check | Action on click |
|------|-------------|-----------------|
| ✓ (green if owned) | `collection.stampIds.includes(id)` | `addToCollection` / `removeFromCollection` |
| ★ (yellow if wishlisted) | `wishlist.stampIds.includes(id)` | `addToWishlist` / `removeFromWishlist` |
| ♥ (red if favorited) | `favorites.stampIds.includes(id)` | `addToFavorites` / `removeFromFavorites` |

Icons are purely icon buttons with `aria-label`; they do not break the card's `<Link>` navigation.

### E2 · `ProductPage.tsx` — action buttons

Same three actions as larger labeled buttons in the stamp detail view:
*"Add to Collection"* / *"Add to Wishlist"* / *"Save as Favorite"* — toggling with visual feedback.

### E3 · `App.tsx` — add protected routes

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

### F1 · Stamp image — drop-shadow & contrast (`ProductCard.tsx`, `StampContainer.tsx`)

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

### F2 · First Day of Issue page — layout & heading hierarchy (`FirstDayPage.tsx`, `FirstDayCollection.tsx`)

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

### F3 · Brand name — sCollecto → eCollecto

> ⚠️ **Outstanding — two locations, neither fixed:**

**File:** `src/shared/layout/Header.tsx` line 43
```tsx
// Before
<img src={brandIcon} alt="sCollecto" className="h-8 w-auto"/>
// After
<img src={brandIcon} alt="eCollecto" className="h-8 w-auto"/>
```

**File:** `src/shared/layout/Footer.tsx` line 9
```tsx
// Before
<a className="..." href="/" aria-label="Brand">sCollecto</a>
// After — use Link, fix brand name
<Link className="..." to="/" aria-label="Brand">eCollecto</Link>
```
> Also add `import { Link } from 'react-router-dom';` to `Footer.tsx`.

### F4 · Footer — Subscribe input alignment + button fix (`Footer.tsx`)

> ⚠️ **Outstanding — Subscribe button is `<a href="#">`, not a `<button>`, and heights are mismatched.**

- Set both elements to the same explicit height using a unified wrapper:
  ```tsx
  <div className="flex h-10 rounded overflow-hidden border border-gray-600">
    <input className="flex-1 px-3 bg-neutral-800 text-white outline-none" placeholder="Enter your email" />
    <button type="button" className="px-4 bg-yellow-400 text-black font-medium hover:bg-yellow-300">
      Subscribe
    </button>
  </div>
  ```

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

### G2 · `src/shared/api/catalogApi.ts`

Covers designers, first-day-covers, tariffs:

```typescript
export const fetchDesigners     = () => apiFetch<DesignerDto[]>('/api/designers');
export const fetchFirstDayCovers = () => apiFetch<FirstDayCoverDto[]>('/api/first-day-covers');
export const fetchTariffs        = () => apiFetch<TariffsDto>('/api/tariffs');
```

### G3 · `src/shared/api/userApi.ts`

Covers protected `/api/me/*` endpoints:

```typescript
export const fetchUserProfile    = ()              => apiFetch<UserDto>('/api/me');
export const fetchCollection     = ()              => apiFetch<CollectionItemDto[]>('/api/me/collection');
export const addToCollection     = (stampId: string) => apiFetch<void>('/api/me/collection/items', { method: 'POST', body: JSON.stringify({ stampId }) });
export const removeFromCollection = (stampId: string) => apiFetch<void>(`/api/me/collection/items/${stampId}`, { method: 'DELETE' });
// … same pattern for wishlist and favorites
```

### G4 · Migration guidance

- Replace inline `fetch('/api/stamps')` calls in `HomePage.tsx`, `CollectionPage.tsx`, `FirstDayPage.tsx`, `ProductPage.tsx` with the new typed wrappers.
- New pages (`CatalogPage`, `YearStampsPage`, `LandingPage`) must use wrappers from day one — do not introduce new inline fetch calls.
- Redux thunks (Block C) must also use `userApi.ts` rather than calling `apiFetch` directly.

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

| Page | Where pagination applies |
|------|---------------------------|
| `YearStampsPage` | Years with >40 stamps (rare but guard against it) |
| `CatalogPage` (if expanded to stamp list view) | If year grid ever shows full stamp list |
| `MyCollectionPage` | Large collections paginated locally or server-side |

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

| § | Issue | Where fixed | Status |
|---|-------|-------------|--------|
| §1 | Brand name *sCollecto* → *eCollecto* in logo | `Header.tsx` alt + `Footer.tsx` brand text (F3) | ⏳ Outstanding |
| §2 | Card `border-t` dividers between metadata fields | `ProductCard.tsx` — remove row borders (A6) | ⏳ Outstanding |
| §2 | Dead `<a href="#">` overlay and "Details" anchor | `ProductCard.tsx` — replace with `<Link>` (A6) | ⏳ Outstanding |
| §2 | Misaligned "Details" button (variable card heights) | `ProductCard.tsx` flex + `mt-auto` (A6) | ⏳ Outstanding |
| §2 | Flat gray image background, no depth | `ProductCard.tsx`, `StampContainer.tsx` drop-shadow (F1) | ⏳ Outstanding |
| §3 | First Day page — large empty space, unbalanced layout | `FirstDayCollection.tsx` two-column grid (F2) | ⏳ Outstanding |
| §3 | First Day page — title same scale as labels | `FirstDayCollection.tsx` `text-xl font-bold` (F2) | ⏳ Outstanding |
| §4 | No progress context in collection | `MyCollectionPage` progress bar (D2) | ⏳ Block D |
| §4 | No filters (All / Collected / Missing) | `MyCollectionPage` filter tabs (D2) | ⏳ Block D |
| §4 | No hover states on grayscale stamps | `MyCollectionPage` `group-hover` overlays (D2) | ⏳ Block D |
| §4 | Empty state for new users | `EmptyState` component (D2) | ⏳ Block D |
| §5 | No active NavLink highlight | `Header.tsx` `NavLink` active style (A6) | ⏳ Outstanding |
| §5 | Footer input/button height mismatch + wrong element type | `Footer.tsx` unified height wrapper + `<button>` (F4) | ⏳ Outstanding |
| §5 | Footer brand link not a React Router `<Link>` | `Footer.tsx` (F3) | ⏳ Outstanding |
| §6 | No landing / welcome page | `LandingPage` (A3) | ✅ **[RESOLVED]** |
| — | Inline fetch boilerplate in every page | Typed API wrappers in `shared/api/` (G1–G4) | ⏳ G1 **[RESOLVED]**, G2–G4 pending |
| — | No pagination — loads all ~2500 stamps | `PaginationControls` + URL state (H1–H3) | ⏳ Block H |

---

## Delivery Order

```
G1 → G2 → G3           (typed API layer — no UI changes, unblocks everything)
A1 → A2                 (backend contract for year endpoints)
A3 → A4 → A5 → A6      (frontend catalog pages, use typed wrappers from G)
H1 → H2 → H3           (pagination, integrate into YearStampsPage from A5)
B1 → B2 → B3 → B4      (backend user slices + contract)
C1 → C2 → C3 → C4      (frontend Redux slices; C4 requires C1–C3 done first)
D1 → D2 → D3 → D4      (protected pages)
E1 → E2 → E3           (catalog action icons + routing)
F1 → F2 → F3 → F4      (standalone UX polish — no dependencies, bundle with any PR above)
```

Block G has no external dependencies — do it first.
Blocks A and B can be worked on in parallel (frontend / backend split).
Block C depends on B4 (generated types) and must complete before D and E.
Block H (pagination) backend side must land alongside or before A1.
Block F has no dependencies — each step is an isolated visual fix.

