# Tariff Data Model Redesign Plan

## Overview

The current tariff data model uses a `year`-keyed document structure that cannot represent
multiple rate changes within a single calendar year. Ukrainian postal tariffs changed
4–5 times per year during the 1992–1996 hyperinflation period. The fix is to replace
`year: Integer` with `effectiveFrom: LocalDate` — each document becomes a tariff period
that is active from a specific date until the next period starts. Additionally, the UAK
numeric entries in `tariffs.json` are removed: since the denomination code on the stamp IS
the face value, no tariff lookup is needed for fixed-denomination UAK stamps.

This plan extends `DENOMINATION_CURRENCY_REFACTORING_PLAN.md` and supersedes its Phase 3.2
(comma key fix) and Phase 6 (tariff loading) with the redesigned model described here.

---

## Status

| Phase | Description                                                      | Status |
|-------|------------------------------------------------------------------|--------|
| 1     | Redesign `tariffs.json` data model                               | TODO   |
| 2     | Backend: `TariffsDocument` — replace `year` with `effectiveFrom` | TODO   |
| 3     | Backend: `TariffsRepository` — date-based query                  | TODO   |
| 4     | Backend: `TariffsService` + `TariffsController`                  | TODO   |
| 5     | Backend: `TariffsDto` + `TariffsMapper`                          | TODO   |
| 6     | Backend: tests + regenerate `openapi.yaml`                       | TODO   |
| 7     | Frontend: date-based tariff resolution in `stampHelpers.ts`      | TODO   |
| 8     | Frontend: update tests                                           | TODO   |

---

## Part 1 — Root Problem

### Current model

```json
{ "_id": "t2022", "year": 2022, "currencies": { "UAH": { "V": 12, ... } } }
```

One document = one year. Within 1994, the `"Г"` (UAK) letter rate changed 5 times:

| Period                  | Г value     |
|-------------------------|-------------|
| 28.05.1994 – 01.07.1994 | 250         |
| 02.07.1994 – 30.09.1994 | 300         |
| 01.10.1994 – 14.10.1994 | 300         |
| 15.10.1994 – 09.11.1994 | 1800        |
| 10.11.1994 →            | (next rate) |

A single `year: 1994` document cannot hold all these values simultaneously.

### Why UAK numeric entries are removed

The `t1992` block contains entries like `"0,15": 0.15` — where the key equals the value.
UAK stamps have the denomination printed directly on the stamp (e.g. `code: "0.15"`).
There is nothing to resolve via a tariff lookup: the `code` field is already the face value.
Keeping these entries in the tariffs collection is misleading and error-prone (wrong decimal
separator, key=value redundancy).

---

## Part 2 — New Data Model

### Principle: one document = one effective period

Each document represents a set of tariff rates that became effective on a specific date and
remain valid until the next period's `effectiveFrom`. Resolution rule:

> **For a stamp released on date D, use the tariff period with the largest `effectiveFrom ≤ D`.**

### New `tariffs.json` document shape

```json
{
  "_id": "tp-2026-01-01",
  "effectiveFrom": "2026-01-01",
  "currencies": {
    "UAH": {
      "H": 0.6, "U": 24, "V": 24, "L": 24,
      "T": 24,  "D": 24, "F": 48, "M": 72, "X": 96
    },
    "USD": {
      "G": 1.2, "Ж": 1.2, "Z": 1.2, "A": 1.2,
      "Є": 1.2, "C": 1.2, "N": 1.8, "R": 1.8, "W": 1.8, "P": 6
    }
  }
}
```

### Migration of existing year documents → dated periods

Each existing `"year": YYYY` document where rates were stable for the full year becomes a
single period dated `YYYY-01-01`:

| Old `_id` | New `_id`       | New `effectiveFrom` | Notes                              |
|-----------|-----------------|---------------------|------------------------------------|
| `t2026`   | `tp-2026-01-01` | `2026-01-01`        | `updatedAt` removed                |
| `t2025`   | `tp-2025-01-01` | `2025-01-01`        | `updatedAt` removed                |
| `t2024`   | `tp-2024-01-01` | `2024-01-01`        | `updatedAt` removed                |
| `t2022`   | `tp-2022-01-01` | `2022-01-01`        | `updatedAt` removed                |
| `t1992`   | **deleted**     | —                   | UAK fixed stamps, no lookup needed |

The `updatedAt: Instant` field is removed from the document — `effectiveFrom` replaces it
semantically (it represents when the tariff became effective, which is exactly what
`updatedAt` was approximating).

### 1994 example in the new format

```json
[
  {
    "_id": "tp-1994-05-28",
    "effectiveFrom": "1994-05-28",
    "currencies": { "UAK": { "Г": 250, "...other letters for this period...": 0 } }
  },
  {
    "_id": "tp-1994-07-02",
    "effectiveFrom": "1994-07-02",
    "currencies": { "UAK": { "Г": 300, "...all other letters...": 0 } }
  },
  {
    "_id": "tp-1994-10-01",
    "effectiveFrom": "1994-10-01",
    "currencies": { "UAK": { "Г": 300, "...all other letters...": 0 } }
  },
  {
    "_id": "tp-1994-10-15",
    "effectiveFrom": "1994-10-15",
    "currencies": { "UAK": { "Г": 1800, "...all other letters...": 0 } }
  },
  {
    "_id": "tp-1994-11-10",
    "effectiveFrom": "1994-11-10",
    "currencies": { "UAK": { "Г": "...", "...all other letters...": 0 } }
  }
]
```

> Each period document must contain the **full** currency/letter map for that period —
> not just the letters that changed. This makes each document self-contained and avoids
> needing to merge values across multiple periods.

---

## Part 3 — Backend Changes

### Phase 2 — `TariffsDocument`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/tariff/TariffsDocument.java`

Replace `year: Integer` and `updatedAt: Instant` with `effectiveFrom: LocalDate`:

```java
@Document(collection = "tariffs")
public class TariffsDocument extends BaseDocument {
    private LocalDate effectiveFrom;                        // replaces year + updatedAt
    private Map<String, Map<String, Double>> currencies;    // unchanged
}
```

> `LocalDate` is serialized as a `"YYYY-MM-DD"` string in MongoDB via Spring Data,
> which is correct for date-only fields with no timezone ambiguity.

---

### Phase 3 — `TariffsRepository`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/tariff/TariffsRepository.java`

Replace `findByYear(Integer year)` with two new methods:

```java
public interface TariffsRepository extends MongoRepository<TariffsDocument, String> {

    // All periods sorted newest first (used for GET /api/tariffs)
    List<TariffsDocument> findAllByOrderByEffectiveFromDesc();

    // Active period for a stamp: latest effectiveFrom that is <= releaseDate
    Optional<TariffsDocument> findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
            LocalDate releaseDate);
}
```

---

### Phase 4 — `TariffsService` + `TariffsController`

#### 4.1 `TariffsService`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/tariff/TariffsService.java`

Replace `getByYear(Integer year)` with `getByDate(LocalDate date)`:

```java
// Before
public TariffsDocument getByYear(Integer year) { ... }

// After
public TariffsDocument getByDate(LocalDate date) {
    return repository.findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(date)
            .orElseThrow(() -> new NotFoundException("No tariff period found for date " + date));
}

// findAll now uses the date-ordered repository method
public List<TariffsDto> findAll() {
    return repository.findAllByOrderByEffectiveFromDesc().stream()
            .map(tariffsMapper::toDto)
            .collect(Collectors.toList());
}
```

`getTariffsByCurrency()` and `getTariffByLetter()` accept `LocalDate date` instead of
`Integer year`:

```java
// Before
public Optional<Map<String, Double>> getTariffsByCurrency(Integer year, Currency currency)

// After
public Optional<Map<String, Double>> getTariffsByCurrency(LocalDate date, Currency currency)
```

#### 4.2 `TariffsController`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/tariff/TariffsController.java`

Replace `{year}` path variable with `{date}` (`LocalDate`, format `YYYY-MM-DD`):

```java
// Before
@GetMapping("/{year}/{currency}")
public ResponseEntity<Map<String, Double>> getAllTariffsByCurrency(
        @PathVariable Integer year,
        @PathVariable Currency currency)

// After
@GetMapping("/{date}/{currency}")
public ResponseEntity<Map<String, Double>> getAllTariffsByCurrency(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @PathVariable Currency currency)
```

Apply the same change to `/{date}/{currency}/{letter}`.

> Update `API.md` to document the new path format and mark it as a breaking change.

---

### Phase 5 — `TariffsDto` + `TariffsMapper`

#### 5.1 `TariffsDto`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/dto/TariffsDto.java`

```java
// Before
private Integer year;
private Instant updatedAt;

// After
private LocalDate effectiveFrom;   // replaces year + updatedAt
```

#### 5.2 `TariffsMapper`

**File:** `backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend/tariff/TariffsMapper.java`

MapStruct auto-maps `effectiveFrom` since the field name is identical in both the document
and DTO. No manual mapping changes are needed.

---

### Phase 6 — Backend Tests + Regenerate `openapi.yaml`

#### 6.1 Update `TariffsControllerTest`

- Remove all tests using `year` as a path parameter
- Add tests for `/{date}/{currency}` with `LocalDate` values:
  - `GET /api/tariffs/2026-01-01/UAH` → `200 OK` with the 2026 UAH map
  - `GET /api/tariffs/1994-06-15/UAK` → resolves to period `tp-1994-05-28` (Г = 250)
  - `GET /api/tariffs/1994-10-20/UAK` → resolves to period `tp-1994-10-15` (Г = 1800)
  - `GET /api/tariffs/2026-06-01/UAH` → resolves to period `tp-2026-01-01`

#### 6.2 Run tests → regenerate `openapi.yaml`

```powershell
./gradlew.bat :backend:ecollecto-backend:test
```

Commit the updated `openapi.yaml`.

---

## Part 4 — Frontend Changes

### Phase 7 — `stampHelpers.ts` date-based tariff resolution

**File:** `frontend/ecollecto-ui/src/shared/utils/stampHelpers.ts`

#### 7.1 New cache type: sorted array of periods

```typescript
type TariffsByCurrency = Record<string, Record<string, number>>;

type TariffPeriod = {
  effectiveFrom: string;   // "YYYY-MM-DD"
  currencies: TariffsByCurrency;
};

let periodsCache: TariffPeriod[] | null = null;
let periodsPromise: Promise<TariffPeriod[] | null> | null = null;
```

#### 7.2 Updated `loadTariffs()` — stores all periods sorted descending

```typescript
async function loadTariffPeriods(): Promise<TariffPeriod[] | null> {
  if (periodsCache) return periodsCache;
  if (!periodsPromise) {
    periodsPromise = fetch('/api/tariffs')
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (!data) return null;
        const parsed = z.array(TariffsSchema).safeParse(data);
        if (!parsed.success || parsed.data.length === 0) return null;
        // Sort descending so the first match in find() is always the correct period
        return parsed.data
          .map(entry => ({ effectiveFrom: entry.effectiveFrom, currencies: entry.currencies }))
          .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
      })
      .catch(() => null)
      .then(periods => { periodsCache = periods; return periods; });
  }
  return periodsPromise;
}
```

#### 7.3 Active-period resolver

```typescript
function getCurrenciesForDate(
  periods: TariffPeriod[],
  releaseDate: string   // "YYYY-MM-DD" from StampDto.release.date
): TariffsByCurrency | null {
  // Periods are sorted descending; the first entry where effectiveFrom <= releaseDate wins
  const match = periods.find(p => p.effectiveFrom <= releaseDate);
  return match?.currencies ?? null;
}
```

> ISO `YYYY-MM-DD` strings compare correctly with standard lexicographic ordering.
> No `Date` parsing is needed.

#### 7.4 Updated `formatStampValue` — signature and resolution logic

```typescript
// Before
export async function formatStampValue(
  denomination: string | number | null | undefined
): Promise<string>

// After
export async function formatStampValue(
  denomination: string | number | null | undefined,
  currency?: string | null,      // StampDto.meta.denominationCurrency ("UAH" | "USD" | "UAK")
  releaseDate?: string | null    // StampDto.release.date ("YYYY-MM-DD")
): Promise<string>
```

Resolution waterfall:

```
If currency == "UAK":
  → UAK is fixed denomination; code IS the face value
  → return `${parseFloat(code).toFixed(2)} UAK`
  → (no tariff lookup — UAK tariff data is removed from the collection)

If currency == "UAH" or "USD" and releaseDate is provided:
  → periods = await loadTariffPeriods()
  → activeCurrencies = getCurrenciesForDate(periods, releaseDate)
  → look up code in activeCurrencies[currency]  ← exact, no guessing
  → if letter+surcharge ("F+8.00"): base = activeCurrencies[currency][letter] + extra
  → return "N/A" if not found

If currency is null/unknown (backward-compat fallback):
  → use the first (latest) period's currencies and apply the existing waterfall
```

#### 7.5 Update all call sites — pass `release.date` not `release.year`

```typescript
// Before  (from DENOMINATION_CURRENCY_REFACTORING_PLAN.md)
formatStampValue(
  product.meta.denomination,
  product.meta.denominationCurrency,
  product.release.year        // was: year number
)

// After
formatStampValue(
  product.meta.denomination,
  product.meta.denominationCurrency,
  product.release.date        // now: "YYYY-MM-DD" string
)
```

`product.release.date` is already present in `ProductSchema` (`release.date: z.string()`).

---

### Phase 8 — Frontend Tests

**File:** `frontend/ecollecto-ui/src/__tests__/utils/stampHelpers.test.ts`

Update all mock objects — replace `year:` with `effectiveFrom:`:

```typescript
// Before
{ id: 't-2024', year: 2024, updatedAt: '2024-01-01T00:00:00Z', currencies: { UAH: { W: 12.0 } } }

// After
{ id: 'tp-2024-01-01', effectiveFrom: '2024-01-01', currencies: { UAH: { W: 12.0 } } }
```

New test scenarios:

| Test                                               | Input                                                 | Expected                              |
|----------------------------------------------------|-------------------------------------------------------|---------------------------------------|
| Picks correct period by release date               | `("V", "UAH", "2022-01-21")` with 2022 + 2026 periods | `"12.00 UAH"` (2022 rate)             |
| Picks correct period when rate changed mid-year    | `("Г", "UAK", "1994-08-01")`                          | `"300.00 UAK"` (July 1994 period)     |
| Exact effectiveFrom date match                     | `("Г", "UAK", "1994-07-02")`                          | `"300.00 UAK"`                        |
| Falls back to earlier year when exact year missing | `("V", "UAH", "2023-06-01")` with no 2023 period      | uses 2022 rate                        |
| UAK fixed denomination (no lookup)                 | `("0.15", "UAK", "1992-01-01")`                       | `"0.15 UAK"`                          |
| Latest period updated mock                         | old `year:` fixture                                   | same result with new `effectiveFrom:` |

**File:** `frontend/ecollecto-ui/src/__tests__/schemas/tariffs.schema.test.ts`

Update `validTariff` fixture to use `effectiveFrom` instead of `year` + `updatedAt`:

```typescript
// Before
const validTariff = { id: 'tariff-001', year: 2024, updatedAt: '2024-01-01T00:00:00.000Z', currencies: {...} };

// After
const validTariff = { id: 'tp-2024-01-01', effectiveFrom: '2024-01-01', currencies: {...} };
```

---

## Summary of All Changes

### Data (`collection/ua/tariffs.json`)

| Change                                                                | Detail                                             |
|-----------------------------------------------------------------------|----------------------------------------------------|
| Remove `t1992` block entirely                                         | UAK is fixed denomination, no tariff lookup needed |
| Replace `year` field with `effectiveFrom: "YYYY-MM-DD"`               | One date per effective period                      |
| Remove `updatedAt` field                                              | Replaced semantically by `effectiveFrom`           |
| Rename `_id` from `tYYYY` to `tp-YYYY-MM-DD`                          | e.g. `tp-2026-01-01`                               |
| Add multiple documents per calendar year where rates changed mid-year | e.g. 5 documents for 1994                          |

### Backend

| File                         | Change                                                                                                                     |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| `TariffsDocument.java`       | `year: Integer` + `updatedAt: Instant` → `effectiveFrom: LocalDate`                                                        |
| `TariffsRepository.java`     | `findByYear()` → `findAllByOrderByEffectiveFromDesc()` + `findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc()` |
| `TariffsService.java`        | `getByYear(Integer)` → `getByDate(LocalDate)`; update `getTariffsByCurrency` + `getTariffByLetter` signatures              |
| `TariffsController.java`     | `{year}` path param → `{date}` (`LocalDate` with `@DateTimeFormat(iso = ISO.DATE)`)                                        |
| `TariffsDto.java`            | `year: Integer` + `updatedAt: Instant` → `effectiveFrom: LocalDate`                                                        |
| `TariffsMapper.java`         | Auto-mapped by MapStruct (same field name), no manual changes needed                                                       |
| `Currency.java`              | Add `UAK` (from `DENOMINATION_CURRENCY_REFACTORING_PLAN.md` Phase 2.1)                                                     |
| `API.md`                     | Update tariff endpoints to use `{date}` path format; note breaking change                                                  |
| `TariffsControllerTest.java` | Replace year-based test cases with date-based test cases                                                                   |

### Frontend

| File                                       | Change                                                                                                                                            |
|--------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `shared/utils/stampHelpers.ts`             | `TariffPeriod[]` cache sorted by `effectiveFrom`; `getCurrenciesForDate()` resolver; UAK early-return; `releaseDate` param replaces `releaseYear` |
| All `formatStampValue()` call sites        | Pass `product.release.date` (not `release.year`) as the third argument                                                                            |
| `api.generated.ts`, `schemas.generated.ts` | Regenerate via `npm run generate`                                                                                                                 |
| `__tests__/utils/stampHelpers.test.ts`     | Update all mocks `year:` → `effectiveFrom:`, add date-range and mid-year rate change test cases                                                   |
| `__tests__/schemas/tariffs.schema.test.ts` | Update `validTariff` fixture to `effectiveFrom:`                                                                                                  |

---

## API Breaking Change Notice

| Endpoint                                      | Before                                        | After                                                                        |
|-----------------------------------------------|-----------------------------------------------|------------------------------------------------------------------------------|
| `GET /api/tariffs`                            | Returns `{ id, year, updatedAt, currencies }` | Returns `{ id, effectiveFrom, currencies }`                                  |
| `GET /api/tariffs/{year}/{currency}`          | `{year}` is an integer                        | `GET /api/tariffs/{date}/{currency}` where `{date}` is `YYYY-MM-DD`          |
| `GET /api/tariffs/{year}/{currency}/{letter}` | `{year}` is an integer                        | `GET /api/tariffs/{date}/{currency}/{letter}` where `{date}` is `YYYY-MM-DD` |

The main frontend consumer (`stampHelpers.ts`) calls only `GET /api/tariffs` and resolves
periods locally — it is not affected by the path-parameter endpoint changes.

---

## Notes

### Why each period document must be self-contained

Storing only the changed letters in a period (delta/patch approach) would require merging
multiple documents to reconstruct the full tariff table for a given date. Self-contained
documents are simpler to query, easier to validate, and eliminate any ambiguity about which
letters are active in a given period.

### UAK stamps as permanent fixed-denomination

Unlike UAH/USD non-denominated stamps (whose tariff value changes over time), UAK stamps
from 1992 have a permanent fixed denomination. The Karbovanets was replaced by the Hryvnia
in 1996 at a 100,000:1 ratio. The denomination printed on the stamp IS the face value —
no tariff lookup, no dynamic resolution.

### ISO date string comparison in JavaScript

`"1994-07-02" <= "1994-08-01"` evaluates to `true` using standard string comparison because
ISO 8601 dates in `YYYY-MM-DD` format sort correctly lexicographically. No `Date` object
construction is needed in the period resolver.

