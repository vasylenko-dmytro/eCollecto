# Implementation Plan: Year Navigation + MongoDB Seed

**Goal:** Migrate from ~43 stamps (2022 only) to a full database of ~2500 stamps (all years),
without ever allowing the UI to load all records onto a single page.

**Core rule:** The MongoDB seed runs **last** — only after no frontend page calls
`GET /api/stamps` (all) without a year filter.

---

## Status

| Phase | Name                            | Status |
|-------|---------------------------------|--------|
| 1     | Backend: year endpoints         | TODO   |
| 2     | Frontend: typed API wrappers    | TODO   |
| 3     | Frontend: year navigation pages | TODO   |
| 4     | Frontend: routing switch        | TODO   |
| 5     | MongoDB seed                    | TODO   |
| 6     | End-to-end verification         | TODO   |

---

## Phase 1 — Backend: year endpoints

> Works against the current small database (~43 stamps). Safe.

### 1.1 · `dto/YearSummaryDto.java` — new DTO

**New file:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/dto/YearSummaryDto.java`

```java
package com.vasylenko.ecollectobackend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Year summary with stamp count.")
public class YearSummaryDto {
    @Schema(description = "Release year.", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer year;

    @Schema(description = "Number of stamps released in this year.", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long count;
}
```

### 1.2 · `StampRepository.java` — add two methods

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/stamp/StampRepository.java`

```java
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface StampRepository extends MongoRepository<StampDocument, String> {

    @Query("{ 'release.year': ?0 }")
    List<StampDocument> findByReleaseYear(int year);

    @Aggregation(pipeline = {
        "{ $group: { _id: '$release.year', count: { $sum: 1 } } }",
        "{ $project: { _id: 0, year: '$_id', count: 1 } }",
        "{ $sort: { year: -1 } }"
    })
    List<YearCount> findDistinctReleaseYears();

    // Inner projection interface
    interface YearCount {
        Integer getYear();
        Long getCount();
    }
}
```

> **Alternative:** if `@Aggregation` is not supported in the current Spring Data MongoDB version,
> use `MongoTemplate` with `Aggregation.group()` directly inside `StampService`.

### 1.3 · `StampService.java` — two new public methods

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/stamp/StampService.java`

Add after `findAll()`:

```java
public List<StampDto> findByYear(int year) {
    List<StampDocument> documents = stampRepository.findByReleaseYear(year);
    Set<String> designerIds = documents.stream()
            .map(StampDocument::getMeta).filter(Objects::nonNull)
            .map(StampDocument.Meta::getDesignerIds).filter(Objects::nonNull)
            .flatMap(Collection::stream).collect(Collectors.toSet());
    Map<String, String> designerNames = loadDesignerNames(designerIds);
    return documents.stream()
            .map(doc -> stampMapper.toDto(doc, designerNames))
            .collect(Collectors.toList());
}

public List<YearSummaryDto> findDistinctYears() {
    return stampRepository.findDistinctReleaseYears().stream()
            .map(yc -> new YearSummaryDto(yc.getYear(), yc.getCount()))
            .collect(Collectors.toList());
}
```

Add import: `import com.vasylenko.ecollectobackend.dto.YearSummaryDto;`

### 1.4 · `StampController.java` — update `GET /api/stamps` + new `GET /api/stamps/years`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/stamp/StampController.java`

Replace `getAllStamps()` and add the new endpoint:

```java
// Updated GET /api/stamps — now accepts optional ?year= query param
@GetMapping("/stamps")
@Operation(summary = "List stamps", description = "Retrieve all stamps, optionally filtered by year.")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "Stamps retrieved.",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = StampDto.class)))),
        @ApiResponse(responseCode = "500", description = "Server error.",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
})
public ResponseEntity<List<StampDto>> getAllStamps(
        @RequestParam(required = false) Integer year) {
    List<StampDto> stamps = (year != null)
            ? stampService.findByYear(year)
            : stampService.findAll();
    return ResponseEntity.ok(stamps);
}

// New GET /api/stamps/years
@GetMapping("/stamps/years")
@Operation(summary = "List stamp years", description = "Retrieve distinct release years with stamp counts, sorted descending.")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "Years retrieved.",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = YearSummaryDto.class)))),
        @ApiResponse(responseCode = "500", description = "Server error.",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
})
public ResponseEntity<List<YearSummaryDto>> getStampYears() {
    return ResponseEntity.ok(stampService.findDistinctYears());
}
```

Add import: `import com.vasylenko.ecollectobackend.dto.YearSummaryDto;`

### 1.5 · Regenerate OpenAPI contract and frontend types

```powershell
# From project root:
./gradlew.bat :backend:ecollecto-backend:test   # regenerates openapi.yaml via OpenApiSpecTest

# From frontend directory:
cd frontend/ecollecto-ui
npm run generate                                 # regenerates api.generated.ts + schemas.generated.ts
cd ../..
```

Commit: `openapi.yaml`, `api.generated.ts`, `schemas.generated.ts`.

---

## Phase 2 — Frontend: typed API wrappers

> No UI changes — just centralising fetch logic.

### 2.1 · `src/shared/api/stampsApi.ts` — new file

**New file:** `frontend/ecollecto-ui/src/shared/api/stampsApi.ts`

```typescript
import { apiFetch } from './apiClient';
import type { components } from '../../features/product/types/api.generated';

type StampDto       = components['schemas']['StampDto'];
type YearSummaryDto = components['schemas']['YearSummaryDto'];

export const fetchAllStamps    = (signal?: AbortSignal) =>
    apiFetch<StampDto[]>('/api/stamps', { signal });

export const fetchStampsByYear = (year: number, signal?: AbortSignal) =>
    apiFetch<StampDto[]>(`/api/stamps?year=${year}`, { signal });

export const fetchStampById    = (id: string, signal?: AbortSignal) =>
    apiFetch<StampDto>(`/api/stamp/${id}`, { signal });

export const fetchStampYears   = (signal?: AbortSignal) =>
    apiFetch<YearSummaryDto[]>('/api/stamps/years', { signal });
```

> `YearSummaryDto` will appear in `api.generated.ts` after Phase 1.5.
> Until then, declare the type inline:
> `type YearSummaryDto = { year: number; count: number };`

---

## Phase 3 — Frontend: new pages

> Develop and test against the small database (~43 stamps). Safe — `YearStampsPage` loads only one year at a time.

### 3.1 · `CatalogPage` (`/stamps`) — new page

**New file:** `frontend/ecollecto-ui/src/pages/Catalog/CatalogPage.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStampYears } from '../../shared/api/stampsApi';

type YearSummary = { year: number; count: number };

export default function CatalogPage({ searchTerm }: { searchTerm: string }) {
  const [years, setYears] = useState<YearSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    setIsLoading(true);
    fetchStampYears(controller.signal)
      .then(data => { if (mounted) setYears(data); })
      .catch(err => { if (mounted && err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; controller.abort(); };
  }, []);

  if (isLoading) return <div className="p-12 text-gray-500">Loading catalog...</div>;
  if (error) return <div className="p-12 text-red-500">{error}</div>;

  const filtered = years.filter(y => y.year.toString().includes(searchTerm));

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Ukrainian Stamps by Year</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(({ year, count }) => (
          <Link
            key={year}
            to={`/stamps/year/${year}`}
            className="flex flex-col items-center justify-center rounded-lg bg-neutral-800 hover:bg-yellow-400 hover:text-black text-white p-6 transition-colors"
          >
            <span className="text-2xl font-bold">{year}</span>
            <span className="text-sm mt-1 text-gray-400 group-hover:text-black">{count} stamps</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### 3.2 · `YearStampsPage` (`/stamps/year/:year`) — new page

**New file:** `frontend/ecollecto-ui/src/pages/Catalog/YearStampsPage.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchStampsByYear } from '../../shared/api/stampsApi';
import { ProductCard } from '../../features/product';
import { ProductSchema } from '../../features/product/types/schemas/product.schema';
import type { Product } from '../../features/product/types/product';
import NoSearchResults from '../../features/product/components/NoSearchResults';

export default function YearStampsPage({ searchTerm }: { searchTerm: string }) {
  const { year } = useParams<{ year: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!year) return;
    const controller = new AbortController();
    let mounted = true;
    setIsLoading(true);
    fetchStampsByYear(Number(year), controller.signal)
      .then(raw => {
        if (mounted) setProducts(ProductSchema.array().parse(raw));
      })
      .catch(err => { if (mounted && err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; controller.abort(); };
  }, [year]);

  if (isLoading) return <div className="p-12 text-gray-500">Loading {year} stamps...</div>;
  if (error) return <div className="p-12 text-red-500">{error}</div>;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.stampSKU.toString().includes(searchTerm)
  );

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
      <div className="mb-6">
        <Link to="/stamps" className="text-yellow-400 hover:underline text-sm">← Back to Catalog</Link>
        <h1 className="text-2xl font-bold text-white mt-2">Stamps of {year}</h1>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          {filtered.map(product => (
            <div key={product.stamp_id}>
              <Link to={`/stamps/${product.stamp_id}`} className="block transition-transform hover:scale-[1.01]">
                <ProductCard product={product} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <NoSearchResults searchTerm={searchTerm} />
      )}
    </div>
  );
}
```

### 3.3 · `LandingPage` (`/`) — new page

**New file:** `frontend/ecollecto-ui/src/pages/Landing/LandingPage.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStampsByYear, fetchStampYears } from '../../shared/api/stampsApi';
import { ProductCard } from '../../features/product';
import { ProductSchema } from '../../features/product/types/schemas/product.schema';
import type { Product } from '../../features/product/types/product';
import { useAuth } from 'react-oidc-context';

export default function LandingPage() {
  const auth = useAuth();
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    // Load only the latest year — safe even with 2500 stamps in the database
    fetchStampYears(controller.signal)
      .then(years => {
        if (years.length === 0) return;
        const latestYear = years[0].year; // sorted desc in Phase 1.4
        return fetchStampsByYear(latestYear, controller.signal);
      })
      .then(raw => {
        if (raw) setFeatured(ProductSchema.array().parse(raw).slice(0, 4));
      })
      .catch(() => {/* featured section is best-effort */});
    return () => controller.abort();
  }, []);

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
      {/* Hero */}
      <section className="py-24 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Your Digital Haven for Ukrainian Philately
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Track releases, collect first-day covers, and trace the history behind
          every historic postal release in one interactive application.
        </p>
        <div className="flex gap-4 justify-center">
          {auth.isAuthenticated ? (
            <Link to="/me" className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-300">
              My Collection
            </Link>
          ) : (
            <button
              onClick={() => auth.signinRedirect()}
              className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-300"
            >
              Create Account
            </button>
          )}
          <Link to="/stamps" className="px-6 py-3 border border-gray-500 text-white rounded hover:border-yellow-400">
            Explore Catalog
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {[
          { icon: '🔍', title: 'Discover', desc: 'Explore the complete catalog of Ukrainian stamps.' },
          { icon: '📁', title: 'Collect', desc: 'Curate your personalized virtual stamp albums.' },
          { icon: '📊', title: 'Track', desc: 'Monitor progress metrics by release year.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-neutral-800 rounded-lg p-8">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{desc}</p>
          </div>
        ))}
      </section>

      {/* Featured Releases */}
      {featured.length > 0 && (
        <section className="py-12">
          <h2 className="text-xl font-bold text-white mb-6">Latest Releases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map(product => (
              <Link key={product.stamp_id} to={`/stamps/${product.stamp_id}`}
                className="block transition-transform hover:scale-[1.01]">
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/stamps" className="text-yellow-400 hover:underline">View all years →</Link>
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## Phase 4 — Frontend: update routing (critical step)

> After this step `HomePage` is no longer the default route.
> `GET /api/stamps` (all) is not called by any page. **Safe to seed data now.**

### 4.1 · `App.tsx` — update routes

**File:** `frontend/ecollecto-ui/src/app/App.tsx`

Replace the file contents:

```tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer } from '../features/product/index';
import LandingPage from '../pages/Landing/LandingPage';
import CatalogPage from '../pages/Catalog/CatalogPage';
import YearStampsPage from '../pages/Catalog/YearStampsPage';
import ProductPage from '../pages/Product/ProductPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import CollectionPage from '../pages/Collection/CollectionPage';
import FirstDayPage from '../pages/FirstDay/FirstDayPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-neutral-700 transition-colors duration-300">
        <Header onSearch={setSearchTerm} />
        <main className="flex-1">
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/"                   element={<LandingPage />} />
            <Route path="/stamps"             element={<CatalogPage searchTerm={searchTerm} />} />
            <Route path="/stamps/year/:year"  element={<YearStampsPage searchTerm={searchTerm} />} />
            <Route path="/stamps/:id"         element={<ProductPage />} />
            <Route path="/collection"         element={<CollectionPage searchTerm={searchTerm} />} />
            <Route path="/firstday"           element={<FirstDayPage searchTerm={searchTerm} />} />

            {/* ── Protected routes (ROLE_USER) ── */}
            <Route element={<ProtectedRoute />}>
              {/* Block D: <Route path="/me" element={<ProfilePage />} /> */}
              {/* Block D: <Route path="/me/collection" element={<MyCollectionPage />} /> */}
              {/* Block D: <Route path="/me/wishlist" element={<WishlistPage />} /> */}
              {/* Block D: <Route path="/me/favorites" element={<FavoritesPage />} /> */}
            </Route>

            {/* ── Admin routes (ROLE_ADMIN) ── */}
            <Route element={<AdminRoute />}>
              {/* Block B: <Route path="/admin" element={<AdminPage />} /> */}
            </Route>

            <Route path="/forbidden" element={<div className="p-8 text-center text-red-500">403 — Access Denied</div>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
```

> ⚠️ `HomePage.tsx` stays in place — it is simply no longer wired to any route.
> Delete it or move it to `_archive/HomePage.tsx` after verification.

### 4.2 · Verify against the current small database (~43 stamps)

```
/                → LandingPage  (4 featured stamps from 2022)
/stamps          → CatalogPage  (1 year card: "2022 · 43 stamps")
/stamps/year/2022 → YearStampsPage (43 stamps)
/stamps/s1974    → ProductPage  (unchanged)
```

Open DevTools → Network tab → confirm zero calls to `/api/stamps` without a year parameter.

---

## Phase 5 — MongoDB Seed

> **Prerequisite:** Phase 4 is complete and verified. No UI page calls `GET /api/stamps` (all).

### 5.1 · Copy JSON data into classpath resources

```powershell
# From project root
$dest = "backend/ecollecto-backend/src/main/resources/migration-data/ua"
New-Item -ItemType Directory -Force -Path $dest
Copy-Item "collection/ua/designers.json" -Destination $dest
Copy-Item "collection/ua/stamp.json"     -Destination $dest
```

### 5.2 · `DataInitializer.java` — ApplicationRunner for seeding

**New file:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/config/DataInitializer.java`

```java
package com.vasylenko.ecollectobackend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.model.ReplaceOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Seeds MongoDB collections from classpath JSON on startup.
 * Activated only when app.data.init.enabled=true (application-seed.properties or env var).
 * All operations are idempotent: replaceOne with upsert=true by _id.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.data.init.enabled", havingValue = "true")
public class DataInitializer implements ApplicationRunner {

    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("DataInitializer: starting seed...");
        seedCollection("migration-data/ua/designers.json", "designers");
        seedCollection("migration-data/ua/stamp.json", "stamp");
        log.info("DataInitializer: seed complete.");
    }

    private void seedCollection(String classpathResource, String collectionName) throws Exception {
        InputStream is = getClass().getClassLoader().getResourceAsStream(classpathResource);
        if (is == null) {
            log.warn("DataInitializer: resource not found: {}", classpathResource);
            return;
        }
        List<Map<String, Object>> records = objectMapper.readValue(is, new TypeReference<>() {});
        var collection = mongoTemplate.getCollection(collectionName);
        var options = new ReplaceOptions().upsert(true);
        int count = 0;
        for (Map<String, Object> record : records) {
            Document doc = new Document(record);
            collection.replaceOne(new Document("_id", doc.get("_id")), doc, options);
            count++;
        }
        log.info("DataInitializer: upserted {} records into '{}'", count, collectionName);
    }
}
```

### 5.3 · Configuration — enable / disable seed

**`src/main/resources/application.properties`** — add line:
```properties
app.data.init.enabled=false
```

**New file `src/main/resources/application-seed.properties`:**
```properties
app.data.init.enabled=true
```

**`src/test/resources/application.properties`** — add line (seed must never run during tests):
```properties
app.data.init.enabled=false
```

### 5.4 · Run the seed

```powershell
# From project root — start with the seed profile active
./gradlew.bat :backend:ecollecto-backend:bootRun `
  --args='--spring.profiles.active=seed'
```

**Expected log output on success:**
```
DataInitializer: starting seed...
DataInitializer: upserted 135 records into 'designers'
DataInitializer: upserted 2500 records into 'stamp'
DataInitializer: seed complete.
```

Stop the server (`Ctrl+C`) after the seed completes. The seed profile is no longer needed.

> ⚠️ **Idempotency:** Running the seed twice is safe. `replaceOne upsert=true` simply
> overwrites existing documents with the same `_id`. No duplicates are created.

---

## Phase 6 — End-to-end verification

### 6.1 · Start the server in normal mode (no seed profile)

```powershell
./gradlew.bat :backend:ecollecto-backend:bootRun
# or
./gradlew.bat devBackend
```

### 6.2 · Verify the API directly

```powershell
# All years (2500 stamps grouped by year)
Invoke-RestMethod http://localhost:8080/api/stamps/years | ConvertTo-Json

# Stamps for a single year (expect ~30–150 records)
Invoke-RestMethod "http://localhost:8080/api/stamps?year=2022" | ConvertTo-Json -Depth 1

# All stamps — returns all 2500 (but no UI page calls this endpoint anymore)
# Invoke-RestMethod http://localhost:8080/api/stamps | Measure-Object
```

### 6.3 · Verify the UI in the browser

```
http://localhost:5173/               → LandingPage: hero + 4 featured stamps from the latest year
http://localhost:5173/stamps         → CatalogPage: year-card grid (~35 cards: 1991–2025)
http://localhost:5173/stamps/year/2024 → YearStampsPage: only 2024 stamps
http://localhost:5173/stamps/year/1992 → YearStampsPage: only 1992 stamps
http://localhost:5173/stamps/s1974   → ProductPage: stamp detail (unchanged)
```

**DevTools → Network tab — confirm no request to `/api/stamps` without a query parameter.**

### 6.4 · Run the test suite

```powershell
./gradlew.bat :backend:ecollecto-backend:test
./gradlew.bat :frontend:ecollecto-ui:npmBuild
./gradlew.bat :frontend:ecollecto-ui:npmLint
```

---

## New file tree

```
backend/ecollecto-backend/src/
  main/
    java/.../
      config/
        DataInitializer.java               ← Phase 5.2
      dto/
        YearSummaryDto.java                ← Phase 1.1
      stamp/
        StampRepository.java               ← Phase 1.2 (updated)
        StampService.java                  ← Phase 1.3 (updated)
        StampController.java               ← Phase 1.4 (updated)
    resources/
      application.properties              ← Phase 5.3 (add line)
      application-seed.properties         ← Phase 5.3 (new)
      migration-data/
        ua/
          designers.json                  ← Phase 5.1 (copied)
          stamp.json                      ← Phase 5.1 (copied)
  test/
    resources/
      application.properties             ← Phase 5.3 (add line)

frontend/ecollecto-ui/src/
  shared/api/
    stampsApi.ts                          ← Phase 2.1 (new)
  pages/
    Landing/
      LandingPage.tsx                     ← Phase 3.3 (new)
    Catalog/
      CatalogPage.tsx                     ← Phase 3.1 (new)
      YearStampsPage.tsx                  ← Phase 3.2 (new)
  app/
    App.tsx                               ← Phase 4.1 (updated)
```

---

## Checklist

- [ ] **1.1** Create `YearSummaryDto.java`
- [ ] **1.2** Update `StampRepository.java` (`findByReleaseYear`, `findDistinctReleaseYears`)
- [ ] **1.3** Update `StampService.java` (`findByYear`, `findDistinctYears`)
- [ ] **1.4** Update `StampController.java` (optional `?year=`, new `/stamps/years`)
- [ ] **1.5** `./gradlew test` → `npm run generate` → commit `openapi.yaml` + generated TS files
- [ ] **2.1** Create `stampsApi.ts`
- [ ] **3.1** Create `CatalogPage.tsx`
- [ ] **3.2** Create `YearStampsPage.tsx`
- [ ] **3.3** Create `LandingPage.tsx`
- [ ] **4.1** Update `App.tsx` (new routes)
- [ ] **4.2** Verify in browser: DevTools shows zero calls to `/api/stamps` (all)
- [ ] **5.1** Copy JSON files into `migration-data/ua/`
- [ ] **5.2** Create `DataInitializer.java`
- [ ] **5.3** Add property to `application.properties`, `application-seed.properties`, `test/application.properties`
- [ ] **5.4** Run seed profile once, confirm in logs
- [ ] **6.1** Restart without seed profile
- [ ] **6.2** Verify API directly
- [ ] **6.3** Verify UI in browser across all routes
- [ ] **6.4** Run test suite — all green
