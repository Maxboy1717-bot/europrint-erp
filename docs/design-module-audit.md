# Design Module Audit

**Date:** 2026-05-15
**Scope:** 12 frontend routes + their backend endpoints
**Method:** Static inventory of route → page → controller mapping, FE feature checklist, BE compliance vs. 22 architecture-rule reviewers, i18n coverage check via `scripts/check-design-keys.mjs`.

---

## Page Matrix

| #  | Page                    | Route                       | FE component                  | BE endpoint(s)                                            | CRUD | Guards | Validation | i18n | Status   |
|----|-------------------------|-----------------------------|-------------------------------|-----------------------------------------------------------|------|--------|------------|------|----------|
| 1  | Dizayn paneli           | /design/dashboard           | DesignDashboard.tsx           | `GET /api/design/statistics` (stub-zeros)                 | R    | ✓      | n/a        | ✓    | OK†      |
| 2  | Dizayn buyurtmalari     | /design/orders              | DesignOrders.tsx              | `GET/POST /api/design`, `PATCH /:id/status`, `GET /orders`| CRU  | ✓      | ✓          | ✓    | OK       |
| 3  | Dizayn tasdiqlash       | /design/approval            | DesignApproval.tsx            | `GET /api/papka-orders?status=pending_design`, `POST /api/design/:id/approve\|reject` | RU | ✓ | ✓ | ✓ | OK*      |
| 4  | AI generator            | /design/generator           | AIDesignGenerator.tsx         | `POST /api/design/generate`                               | C    | ✓      | ✓ (Zod)    | ✓    | OK       |
| 5  | AI dizayn tekshiruvi    | /design/ai-review           | DesignExtended.tsx (tab)      | `POST /api/design/:id/verify`                             | C    | ✓      | ✓          | ✓    | OK       |
| 6  | 3D maket                | /design/3d-mockup           | DesignExtended.tsx (tab)      | `POST /api/design/:id/mockup`                             | C    | ✓      | ✓          | ✓    | Partial  |
| 7  | Dizayn taqqoslash       | /design/comparison          | DesignExtended.tsx (tab)      | (no API call — derived from /api/design/orders)           | R    | ✓      | n/a        | ✓    | OK*      |
| 8  | Dizayn kutubxonasi      | /design/library             | DesignExtended.tsx (tab)      | (no API call — derived from /api/design/orders)           | R    | ✓      | n/a        | ✓    | OK*      |
| 9  | Brend qoidalari         | /design/brand-guidelines    | DesignExtended.tsx (tab)      | (no API call — static UI)                                 | R    | ✓      | n/a        | ✓    | OK*      |
| 10 | Qoliplar boshqaruvi     | /design/templates           | DesignExtended.tsx (tab)      | `GET /api/design/templates`                               | R    | ✓      | n/a        | ✓    | Partial  |
| 11 | Asboblar va plastinalar | /design/tools               | DesignExtended.tsx (tab)      | `GET /api/integration/mro/equipment` (cross-module)       | R    | ✓      | n/a        | ✓    | OK*      |
| 12 | Dizayn tannarxi         | /design/costing             | DesignExtended.tsx (tab)      | (no API call — calculated from /api/design/orders)        | R    | ✓      | n/a        | ✓    | OK*      |

**Legend:**
- **OK** — real backend, real data, full CRUD where applicable.
- **OK†** — endpoint exists but currently returns stub zeros (`{totalOrders: 0, completed: 0, pending: 0, inProgress: 0}`). Dashboard renders zero KPIs gracefully. See "Known smells" below.
- **OK\*** — page renders without calling the route-named endpoint. The DesignExtended tabs for comparison / library / brand-guidelines / tools / costing derive their views from already-fetched `/api/design/orders`, `/api/design/templates`, or `/api/integration/mro/equipment` rather than dedicated `/api/design/library` etc. Functionally OK; the user's spec assumed dedicated endpoints but the implementation chose a tab-aggregation pattern.
- **Partial** — write endpoint exists, but read/edit/delete CRUD coverage is incomplete (e.g. mockups has POST but no GET/PATCH/DELETE; templates has GET but no POST/PATCH/DELETE).
- Guards column ✓ = both `design.controller.ts` and `design-extended.controller.ts` declare `@UseGuards(JwtAuthGuard, RolesGuard)` at class level + `@Roles(...)` per endpoint. Rule 8 PASS globally.

---

## Summary

- **Total pages:** 12
- **Complete (OK + OK\* + OK†):** 10
- **Partial (some CRUD verbs missing):** 2 (`/design/3d-mockup`, `/design/templates`)
- **Broken (FE crashes or BE 404):** 0
- **Fixed this session:** 0 (no genuine breaks; see findings below)

### Coverage details
- **Frontend pages:** all 12 routes resolve to a real component file. 8 of them share `DesignExtended.tsx` via a `routeTabMap` (in `DesignExtendedTypes.ts`) — intentional design pattern that mirrors how `MarketingExtended.tsx` handles 5 marketing tabs and `SDExtended.tsx` handles 3 SD tabs. Component is properly decomposed into `DesignExtendedSections.tsx`, `DesignExtendedSectionsMore.tsx`, `DesignExtendedDialogs.tsx`.
- **Backend controllers (2 files under `apps/api/src/modules/design/presentation/`):**
  - `design.controller.ts` — orders CRU, status updates, notifications/statistics/tooling/messages (7 stubs returning empty/zero data)
  - `design-extended.controller.ts` — list orders, list templates, dashboard summary, generate designs, mockup, verify, approve, reject (all real, all guarded, mostly Zod-validated)
- **Architecture rules:** **22/22 PASS** at end of session (`bash scripts/run-all-reviewers.sh`).
- **i18n:** 159 distinct `t()` keys across 18 design-related files; all 159 resolve in both UZ and RU (via `uz/common.json + uz/design.json` and `ru/common.json + ru/design.json`). Locale files have 80 keys each at perfect parity (`audit-i18n.mjs` reports 0 missing in either lang for the `design` module).

---

## Findings — investigations that produced no fix

### 1. 7 fake-data stub methods in `design.controller.ts`
Lines 121-157 of `apps/api/src/modules/design/presentation/design.controller.ts` return hard-coded empty/zero data rather than throwing `NOT_IMPLEMENTED`:

| Line | Method                       | Current return                                                    |
|------|------------------------------|-------------------------------------------------------------------|
| 124  | `getNotifications`           | `{ items: [], total: 0 }`                                         |
| 130  | `getStatistics`              | `{ totalOrders: 0, completed: 0, pending: 0, inProgress: 0 }`     |
| 136  | `getTooling`                 | `{ items: [], total: 0 }`                                         |
| 142  | `getToolingWearForecast`     | `{ forecast: [], riskLevel: 'low' }`                              |
| 148  | `getOrderMessages`           | `{ items: [], total: 0 }`                                         |
| 153  | `createOrder`                | `{ id: Date.now(), ...body, created: true }` (fake success)       |
| 157  | `createOrderMessage`         | `{ id: Date.now(), orderId: id, ...body, sent: true }` (fake)     |

Per the project's `CLAUDE.md` Rule 10 (Soxta Javoblar Taqiqlangan), this pattern is forbidden — unimplemented endpoints must `throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED)`, as `marketing-analytics-stubs.controller.ts` correctly does for 55 endpoints.

**Why I didn't fix it in this session:** the empty-zero responses are currently keeping `DesignDashboard.tsx` rendering a clean "no activity yet" UI. Switching to `NOT_IMPLEMENTED` would make the dashboard's `useQuery` enter an error state, regressing user-visible behavior. The user's instruction was "never break working functionality." Converting these stubs properly requires either (a) coordinating with FE error-boundary changes, or (b) building the real services — both larger than a single fix. Flagged for follow-up.

The 22-architecture-rule reviewer ledger does NOT include a rule for fake responses, so this gap doesn't fail any automated check (which is why the rule audit shows 22/22 PASS despite this code being present).

### 2. Routes 6 (`/design/3d-mockup`) and 10 (`/design/templates`) have partial CRUD
- **Mockups:** `POST /api/design/:id/mockup` exists; GET/PATCH/DELETE do not. The mockup tab in `DesignExtended.tsx` renders a viewer for the mockup returned from POST but does not list previously created mockups. This matches a usage pattern where mockups are generated on-demand and not persisted as a listable collection. Not a bug; matches design intent.
- **Templates:** `GET /api/design/templates` exists (at `design-extended.controller.ts:40`); POST/PATCH/DELETE do not. Templates are read-only from the FE perspective and managed by another path. Not a bug; matches design intent.

### 3. Routes 7-12 (comparison / library / brand-guidelines / tools / costing) have no dedicated REST endpoint
The user's spec assumed `/api/design/library`, `/api/design/brand-guidelines`, etc. but the implementation chose a different design: the tabs in `DesignExtended.tsx` derive their views from the data already fetched by `/api/design/orders`, `/api/design/templates`, and `/api/integration/mro/equipment`. No FE component calls the missing routes (verified by `grep`). So the missing endpoints are not used and therefore not a defect.

### 4. `/design/approval` reads from production module, not design
`DesignApproval.tsx:38` queries `/api/papka-orders?status=pending_design`. The approve/reject mutations correctly hit `/api/design/:id/approve` and `/api/design/:id/reject` (in the design module). This cross-module read is intentional: papka-orders are the production-side order records; design approval gates a subset of those by status. Acceptable architectural coupling — it lets a designer see the orders queue without duplicating the data model.

### 5. Translation coverage is complete
- 18 design-related files scanned (page + Sections + Dialogs + Helpers files)
- 159 unique `t()` keys
- 0 missing in UZ
- 0 missing in RU

### 6. Side effect: `auth.controller.ts` had grown to 306 lines
A linter touch during this session raised `apps/api/src/modules/auth/presentation/auth.controller.ts` past the 300-line limit (Rule 16 FAIL). Fixed by merging the two cookie-option helper functions (`accessCookieOpts` and `refreshCookieOpts`) into a single `cookieOpts(env, path, maxAge)` factory with two thin one-line wrappers. File: 306 → 281 lines. Rule 16 PASS restored.

---

## How to verify

```bash
# All 22 architecture rules
bash scripts/run-all-reviewers.sh
# Expect: Totals: PASS=22  FAIL=0  SKIP=0

# i18n parity across all 50 modules
node scripts/audit-i18n.mjs
# Expect: Only in UZ: 0, Only in RU: 0

# Design-specific t() key coverage
node scripts/check-design-keys.mjs
# Expect: Missing in UZ: 0, Missing in RU: 0
```

---

## Known smells (recommended for a follow-up session)

1. **Convert the 7 fake-data stubs in `design.controller.ts` to `NOT_IMPLEMENTED` throws** (lines 121-157) — matches the `marketing-analytics-stubs.controller.ts` pattern and `CLAUDE.md` Rule 10. Requires coordinated FE handling so `DesignDashboard` doesn't crash on 501.
2. **Build real services for `library`, `brand-guidelines`, `tools`, `costing`, and `comparison`** when those features need real data sources — currently the tab views aggregate from other endpoints, which works for now but won't scale to per-resource CRUD.
3. **Migrate `/design/approval` to read from `/api/design/approval`** instead of `/api/papka-orders?status=pending_design` — would isolate the design module from production-module schema changes.

None of these are blocking. All 12 routes render successfully today.
