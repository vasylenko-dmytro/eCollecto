# Search Refactoring Plan: Server-Side Stamp Search

## Overview

Full refactoring of stamp search. The current implementation relies on a global `searchTerm` state
in `App.tsx` passed as props to all pages — it does not work correctly: `CatalogPage` only filters
year numbers, `LandingPage` is not connected at all, and the search term is not cleared on route
change. Goal: server-side search via a new `GET /api/stamps/search?q=` endpoint, a dedicated
`/search` page, and URL-based navigation. FDC are excluded from search scope.

---

## Status

| Phase | Description                                        | Status |
|-------|----------------------------------------------------|--------|
| 1     | Backend: search method + endpoint                  | TODO   |
| 2     | Backend: tests + regenerate openapi.yaml           | TODO   |
| 3     | Frontend: API wrapper + regenerate types           | TODO   |
| 4     | Frontend: SearchPage + route                       | TODO   |
| 5     | Frontend: Header refactoring                       | TODO   |
| 6     | Frontend: remove searchTerm from App and pages     | TODO   |

---

## Current Problem Diagnosis

| Problem                                                                            | Location             |
|------------------------------------------------------------------------------------|----------------------|
| `CatalogPage` filters only year numbers, not stamp names or titles                 | `CatalogPage.tsx:37` |
| `LandingPage` does not receive `searchTerm` — not connected to search at all       | `App.tsx:28`         |
| `HomePage` exists but is not registered in any route (dead component)              | `HomePage.tsx`       |
| `searchTerm` is not reset on route change — term "leaks" across pages              | `App.tsx:19`         |
| Search is not reflected in the URL — results cannot be bookmarked or shared        | `Header.tsx`         |
| All filtering is client-side `.filter()` over already-loaded data, no server index | all pages            |

---

## Phase 1 — Backend: Search Method and Endpoint

### 1.1 `StampRepository` — add search query

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/stamp/StampRepository.java`

Add a new method with `@Query` that searches across `name`, `description`, and `meta.series`
fields using MongoDB `$regex` with the `'i'` (case-insensitive) flag:

```java
@Query("{ $or: [ " +
       "{ 'name':        { $regex: ?0, $options: 'i' } }, " +
       "{ 'description': { $regex: ?0, $options: 'i' } }, " +
       "{ 'meta.series': { $regex: ?0, $options: 'i' } }  " +
       "] }")
List<StampDocument> findBySearchQuery(String query);
```

> **Searched fields:** `name`, `description`, `meta.series`.
> `stampSKU` (Integer) is not included in the MongoDB query. If numeric SKU search is needed,
> add a separate branch in the service: if `query` parses as a number, call `findByStampSKU(Integer)`
> and merge results.

---

### 1.2 `StampService` — add `search(String query)` method

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/stamp/StampService.java`

Add a method that mirrors the existing pattern of `findAll()` / `findByYear()`:

```java
public List<StampDto> search(String query) {
    List<StampDocument> documents = stampRepository.findBySearchQuery(query);
    Set<String> designerIds = documents.stream()
            .map(StampDocument::getMeta).filter(Objects::nonNull)
            .map(StampDocument.Meta::getDesignerIds).filter(Objects::nonNull)
            .flatMap(Collection::stream).collect(Collectors.toSet());
    Map<String, String> designerNames = loadDesignerNames(designerIds);
    return documents.stream()
            .map(doc -> stampMapper.toDto(doc, designerNames))
            .collect(Collectors.toList());
}
```

---

### 1.3 `StampController` — new endpoint `GET /api/stamps/search`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/stamp/StampController.java`

Add `@GetMapping("/stamps/search")` **before** the `/stamps/years` mapping so Spring does not
confuse the literal path `/stamps/search` with the variable path `/stamps/{id}`.

```java
@GetMapping("/stamps/search")
@Operation(summary = "Search stamps", description = "Search stamps by name, description or series.")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Search results.",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = StampDto.class)))),
    @ApiResponse(responseCode = "400", description = "Missing or blank query parameter.",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "500", description = "Server error.",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
})
public ResponseEntity<List<StampDto>> searchStamps(@RequestParam String q) {
    if (q == null || q.isBlank()) {
        return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(stampService.search(q.trim()));
}
```

---

### 1.4 Update `API.md`

**File:** `backend/ecollecto-backend/doc/API.md`

Add a section in the Stamps block after `GET /api/stamps/years`:

```markdown
#### GET /api/stamps/search

Searches stamps by name, description, or series (case-insensitive substring match).

**Parameters:**
- `q` (query, required) — search term (min 1 character after trim)

**Response:** `200 OK` — array of `StampDto` (may be empty `[]`)
**Response:** `400 BAD REQUEST` — if `q` is missing or blank

**Example:** `GET /api/stamps/search?q=Trident`
```

---

## Phase 2 — Backend Tests + Regenerate `openapi.yaml`

### 2.1 `StampControllerTest` — add test cases

**File:** `backend/ecollecto-backend/src/test/java/com/vasylenko/ecollectobackend/stamp/StampControllerTest.java`

Add three new tests:

| Test                                   | Scenario                                       | Expected                             |
|----------------------------------------|------------------------------------------------|--------------------------------------|
| `shouldReturnSearchResults`            | `stampService.search("Trident")` returns 1 DTO | `200 OK`, `$[0].stamp_id == "s1974"` |
| `shouldReturnEmptyListWhenNoMatch`     | `search(...)` returns `List.of()`              | `200 OK`, `$` is empty array         |
| `shouldReturnBadRequestWhenQueryBlank` | `GET /api/stamps/search` without `?q=`         | `400 BAD REQUEST`                    |

### 2.2 Run tests → regenerate `openapi.yaml`

```powershell
./gradlew.bat :backend:ecollecto-backend:test
```

`OpenApiSpecTest` automatically updates `backend/ecollecto-backend/openapi.yaml` with the new
endpoint. Commit the updated `openapi.yaml`.

---

## Phase 3 — Frontend: API Wrapper + Regenerate Types

### 3.1 Regenerate types from the updated spec

```powershell
cd frontend/ecollecto-ui
npm run generate
```

This updates `src/features/product/types/api.generated.ts` and `schemas.generated.ts`.
Never edit these files manually.

### 3.2 Add `fetchStampSearch()` to `stampsApi.ts`

**File:** `frontend/ecollecto-ui/src/shared/api/stampsApi.ts`

```typescript
export const fetchStampSearch = (q: string, signal?: AbortSignal) =>
  apiFetch<StampDto[]>(`/api/stamps/search?q=${encodeURIComponent(q)}`, { signal });
```

---

## Phase 4 — Frontend: `SearchPage` + Route

### 4.1 Create `src/pages/Search/SearchPage.tsx`

Page behavior:

- Reads `?q=` from URL via `useSearchParams()`
- On mount and on every `q` change calls `fetchStampSearch(q, signal)` with `AbortController`
- State pattern identical to `YearStampsPage`: `useState` for `results`, `isLoading`, `error`
- Renders a `ProductCard` grid with `<Link to={`/stamps/${stamp_id}`}>`
- Shows `NoSearchResults` when `results` is empty and `q` is non-empty
- Shows a neutral placeholder ("Start typing to search stamps...") when `q` is empty
- Shows loading / error states like all other pages

### 4.2 Add `/search` route to `App.tsx`

**File:** `frontend/ecollecto-ui/src/app/App.tsx`

```typescript
import SearchPage from '../pages/Search/SearchPage';
// in the Public routes block:
<Route path="/search" element={<SearchPage />} />
```

---

## Phase 5 — Frontend: Header Refactoring

**File:** `frontend/ecollecto-ui/src/shared/layout/Header.tsx`

### Interface changes:

| Before                                      | After                            |
|---------------------------------------------|----------------------------------|
| `{ onSearch: (term: string) => void }` prop | Remove prop entirely             |
| `onChange` → `onSearch(value)`              | Only `setSearchValue(value)`     |
| No navigation                               | `const navigate = useNavigate()` |
| No submit handler                           | `<form onSubmit={handleSubmit}>` |

### `handleSubmit` logic:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (searchValue.trim()) {
    navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    setIsSearchOpen(false);
  }
};
```

**Cancel** — keep as-is: `setSearchValue("") + setIsSearchOpen(false)`.
No back-navigation on cancel — the user stays on the current page.

---

## Phase 6 — Frontend: Remove `searchTerm` from `App` and Pages

### 6.1 `App.tsx` — remove global search state

**File:** `frontend/ecollecto-ui/src/app/App.tsx`

- Remove `const [searchTerm, setSearchTerm] = useState('')`
- Remove `onSearch={setSearchTerm}` from `<Header>`
- Remove `searchTerm={searchTerm}` prop from all `<Route element=...>`

### 6.2 Pages — remove `searchTerm` prop and client-side filtering

| File                 | What to remove                                                                                                                               |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `CatalogPage.tsx`    | `{ searchTerm }` prop; `const filtered = years.filter(...)` line; render `years` directly                                                    |
| `YearStampsPage.tsx` | `{ searchTerm }` prop; `const filtered = products.filter(...)` line; render `products` directly; remove `NoSearchResults` import             |
| `CollectionPage.tsx` | `{ searchTerm }` prop; `const filteredProducts = ...filter(...)` line; render `collectionProducts` directly; remove `NoSearchResults` import |
| `FirstDayPage.tsx`   | `{ searchTerm }` prop; `const filteredProducts = ...filter(...)` line; render `collectionProducts` directly; remove `NoSearchResults` import |

### 6.3 Delete dead `HomePage` component

**File:** `frontend/ecollecto-ui/src/pages/Home/HomePage.tsx` — delete entirely.
The component is not registered in any `App.tsx` route. Check `src/__tests__/pages/` for any
imports of `HomePage` and remove the corresponding test files.

---

## New Search Flow Diagram

```
User types in Header input
        ↓
  onSubmit (Enter)
        ↓
navigate('/search?q=...')
        ↓
  SearchPage mounted
        ↓
useSearchParams() → q
        ↓
fetchStampSearch(q) → GET /api/stamps/search?q=...
        ↓
StampController → StampService.search(q)
        ↓
StampRepository.findBySearchQuery(q)  ← MongoDB $regex (name, description, meta.series)
        ↓
List<StampDocument> → StampMapper → List<StampDto>
        ↓
ProductCard grid rendered on /search
```

---

## Notes

### MongoDB `$regex` vs `$text` Index

|                    | `$regex`                    | `$text` index                     |
|--------------------|-----------------------------|-----------------------------------|
| Search type        | Substring, any position     | Full words (tokenized)            |
| Uses index         | No (full collection scan)   | Yes, fast                         |
| Ukrainian language | Works                       | Requires `language: "none"`       |
| Recommendation     | Sufficient for ~2500 stamps | Add if latency becomes noticeable |

To migrate to `$text` later: add `@TextIndexed` annotation on fields `name`, `description`,
`meta.series` in `StampDocument.java` and replace `@Query` with `MongoTemplate` + `TextCriteria`.

### Minimum Query Length

Recommended: `q.length >= 2` both on the backend (return `400`) and on the frontend
(do not call `navigate` when `searchValue.trim().length < 2`).

### Frontend Tests After Refactoring

- Check `src/__tests__/pages/` — update any test that passed `searchTerm` as a prop
- Add `SearchPage.test.tsx` — smoke test: renders when `?q=Trident`, mock `fetchStampSearch`

