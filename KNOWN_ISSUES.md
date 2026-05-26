# Known Issues

Tracked code-quality issues identified during review. Ordered by impact.

## 1. Mongoose schema code in the browser bundle
**Priority: Critical — fix before new features are built**

Files: `frontend/ecollecto-ui/src/features/product/schema/stamp.schema.ts`, `designer.schema.ts`, `firstDayCover.schema.ts`, `tariffs.schema.ts`  
`mongoose` is listed as a dependency in `package.json`.

**Problem:** Backend ORM/data-layer concepts (Mongoose `Schema`, `model`) are shipped inside the React SPA. This is architecturally incorrect and inflates the browser bundle.  
**Fix:** Remove `mongoose` from `package.json`. Replace schema files with plain TypeScript interfaces (already partially present in `src/features/product/types/`) or Zod/Yup schemas where runtime validation is needed. Delete the schema files once all imports are migrated.

---

## 2. Raw `<a href>` navigation in Header
**Priority: High**

File: `frontend/ecollecto-ui/src/shared/layout/Header.tsx` (lines 37–39, 66–73, 91–92)

**Problem:** Raw `<a href>` anchors cause full page reloads and bypass React Router's SPA routing.  
**Fix:** Replace with `Link` / `NavLink` from `react-router-dom`.

---

## 3. Self-referencing card links in CollectionPage and FirstDayPage
**Priority: High**

Files: `frontend/ecollecto-ui/src/pages/Collection/CollectionPage.tsx` (line 81), `frontend/ecollecto-ui/src/pages/FirstDay/FirstDayPage.tsx` (line 83)

**Problem:** Each card links back to the same page it is on (`/collection` and `/firstday` respectively), making the click interaction non-functional.  
**Fix:** Either remove the clickable wrapper until a detail route exists, or link to the appropriate detail route (e.g., `/stamps/{id}`). For the Collection page, also replace incorrect use of `/api/stamps` with a real user-collection API call once the user domain is implemented.

---

## 4. Duplicate exception handling in controllers
**Priority: Medium**

Files: `DesignerController.java` (line 81), `FirstDayCoverController.java` (line 82), `StampController.java` (line 82), `TariffsController.java` (line 132)

**Problem:** All four controllers define a generic `@ExceptionHandler(Exception.class)` that duplicates the `GlobalExceptionHandler`. This creates divergent error responses and makes error behavior harder to reason about.  
**Fix:** Remove controller-local generic handlers. Centralize in `GlobalExceptionHandler`. Add explicit handling there for: 404, 400 (validation), 403 (access denied), 401 (auth), 500 (generic), and future AI provider / Keycloak failures.

---

## 5. Manual DTO mapping in service classes
**Priority: Medium**

Files: `DesignerService.java` (line 53), `StampService.java` (line 92), `FirstDayCoverService.java` (line 90), `TariffsService.java` (line 96)

**Problem:** DTO mapping is implemented manually in service methods, mixing mapping logic with business logic and making services harder to test in isolation.  
**Fix:** Introduce MapStruct mappers (`@Mapper(componentModel = "spring")`). Move mapping out of service classes into dedicated mapper interfaces.

---

## 6. TypeScript/ESLint version mismatch
**Priority: Low**

Files: `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`

**Problem:** `tsconfig.app.json` targets `ES2022`, `tsconfig.node.json` targets `ES2023`, and `eslint.config.js` uses `ecmaVersion: 2020`. The configuration is inconsistent and makes tooling harder to reason about.  
**Fix:** Align all targets. Recommended: raise ESLint `ecmaVersion` to `2022` to match the app TS target, or document the intentional split.

---

## 7. `@Data` on Mongo `@Document` classes
**Priority: Low**

Files: `DesignerDocument.java`, `StampDocument.java`, `TariffsDocument.java`, `FirstDayCoverDocument.java`

**Problem:** `@Data` generates broad Lombok semantics (including `equals`/`hashCode` based on all fields) on MongoDB persistence models, which can cause issues with Mongo's proxy model and lazy loading.  
**Fix:** Replace `@Data` with explicit `@Getter`, `@Setter`, and a controlled `@ToString` / `@EqualsAndHashCode(exclude = ...)`.

