# eCollecto — UI/UX & Pages Implementation Roadmap

This document is the single canonical plan for frontend page expansion and UX improvements.
It covers catalog restructuring, user-facing protected pages, and UI polish.
All guidance from `ecollecto_uxui_improvement_guide.md` has been merged here — that file has been deleted.

---

## Block A — Year-Based Catalog Navigation

**Goal:** Replace "load all 2500 stamps at once" with lazy year-based browsing.
Each year card loads only its stamps on demand (~30–80 records instead of the full list).

### A1 · Backend — `GET /api/stamps/years` and `GET /api/stamps?year={year}`

**Files:** `StampRepository.java`, `StampService.java`, `StampController.java`

- Add `findDistinctReleaseYears()` to `StampRepository` using a MongoDB distinct query.
- Add `findByReleaseYear(int year)` to `StampRepository`.
- Expose `GET /api/stamps/years` → `[{ year: 2024, count: 43 }, ...]` sorted descending.
- Extend `GET /api/stamps` with optional `?year=` query parameter; existing call without parameter stays unchanged (backward-compatible).
- Add OpenAPI `@Operation` / `@ApiResponse` annotations to the new overload.

### A2 · Backend — Regenerate contract

- Run `./gradlew.bat :backend:ecollecto-backend:test` to regenerate `openapi.yaml` via `OpenApiSpecTest`.
- Run `npm run generate` to regenerate `api.generated.ts` and `schemas.generated.ts`.
- Commit both generated files so CI stays green.

### A3 · Frontend — `LandingPage` (`/`)

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

### A4 · Frontend — `CatalogPage` (`/stamps`)

**New file:** `src/pages/Catalog/CatalogPage.tsx`

- Fetches `GET /api/stamps/years` on mount → renders a responsive grid of `YearCard` components.
- `YearCard` shows year number + stamp count badge (e.g. *"2018 · 47 stamps"*).
- Clicking a card navigates to `/stamps/year/:year`.
- Search input from `App.tsx` filters the visible year cards client-side (tiny array, no performance concern).
- Current `HomePage.tsx` is renamed/repurposed as `CatalogPage`.

### A5 · Frontend — `YearStampsPage` (`/stamps/year/:year`)

**New file:** `src/pages/Catalog/YearStampsPage.tsx`

- Reads `:year` from URL params.
- Fetches `GET /api/stamps?year=:year` on mount using `useEffect` + `AbortController` (existing pattern).
- Renders `ProductCard` grid with back-link `← Back to Catalog`.
- Local `useState` for loading / error / data — no Redux (public read-only data).

### A6 · Frontend — Routing + UX fixes

**File:** `src/app/App.tsx`

- Move `/` → `LandingPage`.
- Add `/stamps` → `CatalogPage`.
- Add `/stamps/year/:year` → `YearStampsPage`.
- Keep `/stamps/:id` → `ProductPage` (no change — existing route still matched after more-specific `/stamps/year/:year`).

**File:** `src/features/product/components/ProductCard.tsx` (UX Guide §2)

- Remove `<hr />` dividers between metadata fields.
- Apply typography hierarchy: labels → `text-gray-400`, values → `text-white font-medium`.
- Make card a flex column with `mt-auto` on the "Details" button wrapper so all buttons align at the bottom.

**File:** `src/shared/layout/Header.tsx` (UX Guide §5)

- Replace plain `<a>` tags with `<NavLink>` using active style (yellow accent or bottom border).
- Unified brand name: use **eCollecto** throughout (fix *sCollecto* logo text).

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

**File:** `src/app/providers/AuthProvider.tsx` (or wherever `loadUserProfile` is dispatched)

After a successful auth session, also dispatch `fetchCollection`, `fetchWishlist`, `fetchFavorites` so the icon states on catalog cards are correct from the first render.

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

These items come from the original UX guide and were not covered in Blocks A–E.
They are self-contained visual fixes with no backend or Redux dependencies.

### F1 · Stamp image — drop-shadow & contrast (`ProductCard.tsx`, `StampContainer.tsx`)

**Issue (UX Guide §2):** Solid light-gray square behind the stamp image looks flat.

- Apply `filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35))` to the `<img>` element so the stamp artwork has a physical, paper-like quality.
- Tailwind utility: `drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]` on the image tag.
- Darken the inner image container slightly relative to the outer card background for additional depth:
  ```tsx
  // inner wrapper
  className="bg-neutral-800 rounded p-2"
  // image
  className="w-full h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
  ```
- Apply the same treatment to `StampImageCollectionGallery` (used on `CollectionPage`).

### F2 · First Day of Issue page — layout & heading hierarchy (`FirstDayPage.tsx`, `FirstDayCollection.tsx`)

**Issue (UX Guide §3):** Large empty space to the right of the metadata table; issue titles share the same visual scale as data labels.

- **Heading:** increase issue title font size to `text-xl font-bold` (currently blends with label text).
- **Layout:** replace single-column metadata table with a two-column grid directly below the title block:
  ```tsx
  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
    <span className="text-gray-400">Date</span>      <span>22 January 2018</span>
    <span className="text-gray-400">Series</span>    <span>State Seals of Ukraine</span>
    <span className="text-gray-400">Designer</span>  <span>Vasyl Vasylenko</span>
    ...
  </div>
  ```
- Alternatively, use a compact horizontal card layout if the component supports it — e.g. image (left 1/3) + metadata grid (right 2/3) inside a single `flex` row.

### F3 · Brand name — sCollecto → eCollecto (`Header.tsx`, logo SVG/text)

**Issue (UX Guide §1):** Logo text reads *sCollecto* but all documentation, routes, and Keycloak realm use *eCollecto*.

- Locate the logo text node inside `Header.tsx` (or the referenced SVG/image asset).
- Replace `sCollecto` with `eCollecto` everywhere in the component.
- If the logo is an SVG file under `src/assets/`, update the text element there too.
- Single-line fix — recommended to bundle with the first PR that touches `Header.tsx`.

### F4 · Footer — Subscribe input alignment (`Footer.tsx`)

**Issue (UX Guide §5):** Email input and "Subscribe" button have mismatched heights.

- Set both elements to the same explicit height: `h-10` or `h-12`.
- Embed the button visually inside the input's right edge using a wrapper:
  ```tsx
  <div className="flex h-10 rounded overflow-hidden border border-gray-600">
    <input className="flex-1 px-3 bg-neutral-800 text-white outline-none" placeholder="Enter your email" />
    <button className="px-4 bg-yellow-400 text-black font-medium hover:bg-yellow-300">Subscribe</button>
  </div>
  ```

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

All items from the original `ecollecto_uxui_improvement_guide.md` — now fully incorporated:

| § | Issue | Where fixed |
|---|-------|-------------|
| §1 | Brand name *sCollecto* → *eCollecto* in logo | `Header.tsx` (Block F3) |
| §2 | Card `<hr />` dividers between metadata fields | `ProductCard.tsx` (Block A6) |
| §2 | Misaligned "Details" button (variable card heights) | `ProductCard.tsx` flex + `mt-auto` (Block A6) |
| §2 | Flat gray image background, no depth | `ProductCard.tsx`, `StampContainer.tsx` drop-shadow (Block F1) |
| §3 | First Day page — large empty space, unbalanced layout | `FirstDayCollection.tsx` two-column grid (Block F2) |
| §3 | First Day page — title same scale as labels | `FirstDayCollection.tsx` `text-xl font-bold` (Block F2) |
| §4 | No progress context in collection | `MyCollectionPage` progress bar (Block D2) |
| §4 | No filters (All / Collected / Missing) | `MyCollectionPage` filter tabs (Block D2) |
| §4 | No hover states on grayscale stamps | `MyCollectionPage` `group-hover` overlays (Block D2) |
| §4 | Empty state for new users | `EmptyState` component (Block D2) |
| §5 | No active NavLink highlight | `Header.tsx` `NavLink` active style (Block A6) |
| §5 | Footer input/button height mismatch | `Footer.tsx` unified height wrapper (Block F4) |
| §6 | No landing / welcome page | `LandingPage` (Block A3) |


---

## Delivery Order

```
A1 → A2 (backend contract)
A3 → A4 → A5 → A6 (frontend catalog pages)
B1 → B2 → B3 → B4 (backend user slices + contract)
C1 → C2 → C3 → C4 (frontend Redux slices)
D1 → D2 → D3 → D4 (protected pages)
E1 → E2 → E3 (catalog action icons + routing)
F1 → F2 → F3 → F4 (standalone UX polish — no dependencies, can be bundled with any PR above)
```

Blocks A and B can be worked on in parallel (frontend / backend split).
Block C depends on B4 (generated types).
Block D depends on C.
Block E depends on C (icon state reads Redux).
Block F has no dependencies — each step is an isolated visual fix.

