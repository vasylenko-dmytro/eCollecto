# Feature List

## High-level direction
The next functional evolution of eCollecto should build on the existing public catalog and add protected, user-owned capabilities in a staged way. The first major feature track is not generic CRUD, but a user domain that supports collections, wishlists, recommendations, and later AI-assisted experiences.

## 1. Core post-MVP feature track: user domain
Before adding advanced AI or admin capabilities, define the user-owned domain explicitly:
- user profile
- owned stamps / collection items
- wishlist
- favorites
- AI chat history
- audit/activity records

This gives Keycloak-based security a clear purpose and creates the data foundation required for later recommendation and assistant features.

## 2. Personal collections and wishlists (recommended first feature set)
**Functional scope**
- **User collection**
  - Add/remove stamps and first-day covers to "My Collection"
  - Store per-item metadata such as condition, notes, purchase price, and location
- **Wishlist**
  - Keep a separate list of wanted items
  - Optional priority or target-price fields later
- **Favorites**
  - Lightweight bookmarking for catalog browsing
- **Insights**
  - Counts, completion percentages, and collection summaries

**Backend design**
- Add new domain packages such as:
  - `user/`
  - `collection/`
  - `wishlist/` or a unified list model if preferred
- Example Mongo documents:
  - `UserProfileDocument`
  - `CollectionItemDocument`
  - `WishlistItemDocument`
  - optional `FavoriteItemDocument`
- Add services such as:
  - `CollectionService`
  - `WishlistService`
  - `ProfileService`
- Prefer protected `/api/me/**` endpoints over user ID in the URL when the data is "my data":
  - `GET /api/me`
  - `GET /api/me/collection`
  - `POST /api/me/collection/items`
  - `DELETE /api/me/collection/items/{stampId}`
  - `GET /api/me/wishlist`
  - `POST /api/me/wishlist/items`

**Frontend design**
- Add feature areas such as:
  - `src/features/auth/`
  - `src/features/collection/`
  - `src/features/ai/`
- Add protected pages such as:
  - My Collection
  - My Wishlist
  - Profile
- Add "Add to collection" / "Add to wishlist" actions on product pages and list views.

## 3. Public catalog improvements (parallel to protected features)
The catalog should remain useful even before login-heavy features are complete.

**Recommended improvements**
- Better search and filtering on existing public catalog endpoints
- Route-level search/filter state that is URL-friendly
- Visual indicators for authenticated users when an item is already in their collection or wishlist

**Backend direction**
- Extend existing read-only catalog endpoints carefully without breaking payload shape expectations.
- Add safe query support for filters such as year, theme, or designer where it matches the data model.

## 4. Security-aware feature rollout
Feature delivery should align with the post-MVP security architecture.

**Public endpoints remain public initially**
- `GET /api/stamps`
- `GET /api/stamp/{id}`
- `GET /api/first-day-covers`
- `GET /api/designers`
- `GET /api/tariffs`

**Protected feature endpoints**
- `/api/me/**` for user-owned data
- `/api/admin/**` for admin-only operations such as AI enrichment

**Frontend route groups**
- public routes
- authenticated routes
- admin routes

## 5. Frontend functional direction for features
**State management**
- Use Redux Toolkit for shared state across pages:
  - auth/session
  - current user profile
  - collection / wishlist / favorites
  - AI state when needed
- Use thunks for business-level API calls.

**Forms and validation**
- Use Formik + Yup for profile editing, collection item metadata, admin forms, and other validation-heavy screens.

**Critical frontend cleanup tied to feature delivery**
- Remove browser-side `mongoose` usage from the React app before building more protected functionality on top of it.
- Replace it with plain TypeScript interfaces or Zod/Yup schemas.

## 6. Suggested feature rollout order
1. Introduce the user domain model in backend and frontend.
2. Add Keycloak/Spring Security-protected `/api/me/**` and admin endpoints.
3. Add My Collection, Wishlist, Favorites, and Profile features.
4. Add collection insights and series-completion summaries.
5. Add AI-connected user features such as recommendations and assistant history once the AI platform is ready.
