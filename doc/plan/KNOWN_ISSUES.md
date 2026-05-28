# Known Issues

Tracked code-quality issues identified during review. Ordered by impact.

All issues listed below have been resolved. This file is kept for historical reference.

## ✅ 1. Mongoose schema code in the browser bundle
**Priority: Critical — fix before new features are built** | **Status: RESOLVED**

Files: `frontend/ecollecto-ui/src/features/product/schema/stamp.schema.ts`, `designer.schema.ts`, `firstDayCover.schema.ts`, `tariffs.schema.ts`  
`mongoose` is listed as a dependency in `package.json`.

**Problem:** Backend ORM/data-layer concepts (Mongoose `Schema`, `model`) are shipped inside the React SPA. This is architecturally incorrect and inflates the browser bundle.  
**Fix applied:** Removed `mongoose` from `package.json`. Deleted all 4 schema files (no active imports existed). Plain TypeScript interfaces in `src/features/product/types/` are used instead.

---

## ✅ 2. Raw `<a href>` navigation in Header
**Priority: High** | **Status: RESOLVED**

File: `frontend/ecollecto-ui/src/shared/layout/Header.tsx`

**Problem:** Raw `<a href>` anchors cause full page reloads and bypass React Router's SPA routing.  
**Fix applied:** Replaced all raw anchors with `Link` / `NavLink` from `react-router-dom`. Replaced the dead Log-in anchor with a disabled `<button>`.

---

## ✅ 3. Self-referencing card links in CollectionPage and FirstDayPage
**Priority: High** | **Status: RESOLVED**

Files: `frontend/ecollecto-ui/src/pages/Collection/CollectionPage.tsx`, `frontend/ecollecto-ui/src/pages/FirstDay/FirstDayPage.tsx`

**Problem:** Each card linked back to the same page it was on, making the click interaction non-functional.  
**Fix applied:** `CollectionPage` cards now link to `/stamps/{stamp_id}`. `FirstDayPage` wrapping `<Link>` removed (no detail route exists yet).

---

## ✅ 4. Duplicate exception handling in controllers
**Priority: Medium** | **Status: RESOLVED**

Files: `DesignerController.java`, `FirstDayCoverController.java`, `StampController.java`, `TariffsController.java`

**Problem:** All four controllers defined a generic `@ExceptionHandler(Exception.class)` duplicating `GlobalExceptionHandler`, creating divergent error responses.  
**Fix applied:** Removed local `@ExceptionHandler` from all 4 controllers. `GlobalExceptionHandler` is now the single source of truth. All controller tests updated to use `.setControllerAdvice(new GlobalExceptionHandler())` and assert `INTERNAL_SERVER_ERROR` code.

---

## ✅ 5. Manual DTO mapping in service classes
**Priority: Medium** | **Status: RESOLVED**

Files: `DesignerService.java`, `StampService.java`, `FirstDayCoverService.java`, `TariffsService.java`

**Problem:** DTO mapping was implemented manually in service methods, mixing mapping and business logic.  
**Fix applied:** Introduced MapStruct mappers (`@Mapper(componentModel = "spring")`): `DesignerMapper`, `TariffsMapper`, `FirstDayCoverMapper`, `StampMapper`. All services updated to inject and use their mapper. Service tests updated with `@Spy` real mapper instances.

---

## ✅ 6. TypeScript/ESLint version mismatch
**Priority: Low** | **Status: RESOLVED**

Files: `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`

**Problem:** `tsconfig.app.json` targets `ES2022`, `tsconfig.node.json` targets `ES2023`, and `eslint.config.js` used `ecmaVersion: 2020`.  
**Fix applied:** Raised ESLint `ecmaVersion` to `2022` to match the app TS target.

---

## ✅ 7. `@Data` on Mongo `@Document` classes
**Priority: Low** | **Status: RESOLVED**

Files: `DesignerDocument.java`, `StampDocument.java`, `TariffsDocument.java`, `FirstDayCoverDocument.java`

**Problem:** `@Data` generates broad Lombok semantics on MongoDB persistence models, risking issues with proxy models and lazy loading.  
**Fix applied:** Replaced `@Data` with explicit `@Getter`, `@Setter`, `@ToString`, and `@EqualsAndHashCode` on all 4 document classes and their inner static classes.
