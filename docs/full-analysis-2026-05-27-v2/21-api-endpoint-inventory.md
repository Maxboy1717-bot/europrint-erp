# Report 21 — API Endpoint Inventory

**Audit date:** 2026-05-27 (second pass)
**Scope:** `apps/api/src/` (controllers only)
**Method:** AST-style scan via Python (`@Controller`, `@Get/@Post/@Put/@Patch/@Delete/@Options/@All`) cross-checked with `grep -rE` on `.controller.ts` files. Frontend calls extracted from `artifacts/erp-dashboard/src` (`fetch()`, `apiRequest('METHOD', '/api/…')`, `api.*()`, `useQuery({ queryKey: ['/api/…'] })`).
**Round-1 source:** `docs/full-analysis-2026-05-27/21-api-endpoint-inventory.md`

---

## Diff vs round 1

| Topic | Round 1 | Round 2 (verified) | Delta |
|---|---|---|---|
| Total controllers (files containing `@Controller`) | 338 | 336 (337 `.controller.ts` files, but `kanban-ext.controller.ts` re-exports only) | −2 (rounding) |
| Distinct `@Controller(...)` decorator instances (multi-class files counted) | not stated | 369 | new |
| Total route declarations | 2,851 | **2,942** (Python full walk) / **2,917** (grep on `.controller.ts`) | +66 to +91 |
| Unique (method, path) pairs | 2,785 | **2,912** | +127 |
| Cross-file duplicate (method, path) pairs — raw | 15 (listed) | **30** (raw count, no dead-code filtering) | +15 |
| Cross-file duplicate (method, path) pairs — **after removing unregistered controllers** | not assessed | **0** | major |
| Bare `@Controller()` decorator instances | 12 | **11** | −1 |
| `notImplemented()` call sites in `*.controller.ts` (raw) | ~92 routes | **225** call sites (across 39 files) | +133 |
| `notImplemented()` call sites in **registered** controllers | not split out | **190** (37 files) | new split |
| `POST /finance/invoices/create` returns `Math.random()` invoiceId | P0 claimed | **FALSE** — handler at `finance-invoices.controller.ts:97-119` now uses `invoiceRepo.saveInvoice()` and returns the real DB row id | resolved |
| `GET /mes/orders|shifts|maintenance` return `[]` | P1 claimed | **FALSE** — all three now delegate to `svc.getProductionOrders()`, `svc.getShifts()`, `svc.getMaintenanceRequests()` (`mes-shifts-stats.controller.ts:162-199`) | resolved |
| `GET /sd/contracts` returns `[]` | P2 claimed | **PARTIAL** — only on `catch` (line 63); happy path queries DB | partially resolved |
| HR stub controllers shadow real HR routes (15 P0 dups) | P0 claimed | **FALSE** — `HrDashboardStubsController` and `HrDashboardStubsWriteController` are commented out in `hr.providers.ts:160-168` (TODO HR-STUB-DUP). The route declarations exist in the files on disk but never reach the Nest router. | resolved at runtime; dead code still on disk |

The headline round-1 finding ("15 P0 duplicate routes from HR stubs shadowing real handlers") is the result of static scanning that did not look at module registration. Once the unregistered controller files are excluded, **zero cross-file route collisions remain.**

---

## 1. Total route count (verified)

Python walked every `.controller.ts` under `apps/api/src` and matched the regex `^\s*@(Get|Post|Put|Patch|Delete|Options|All)\(\s*(?:['"]([^'"]*)['"])?\s*\)` against each line, attributing each decorator to the nearest preceding `@Controller(prefix)`.

| Bucket | Count |
|---|---|
| `.controller.ts` files on disk | 338 (one — `kanban-ext.controller.ts` — has no decorators, just re-exports) |
| Distinct `@Controller(...)` decorator instances | 369 (some files declare multiple controller classes — e.g. `compatibility/resources.controller.ts` declares 3) |
| Total route declarations (Python walk) | **2,942** |
| Total via `grep -rE "@(Get\|Post\|Put\|Patch\|Delete)\(" --include="*.controller.ts"` | **2,917** |
| Source of discrepancy | 25 routes: a handful of controllers (`crm-extended`, `employee-kpi-compat`, the two unregistered HR stub files) declared decorators on lines that did not match the loose `^\s*@…\(` grep but did match Python's inline parsing. Verified by file-by-file diff. |
| **Canonical figure used in this report** | **2,942** (Python — full walk) |
| Unique `(method, path)` pairs | **2,912** |
| Cross-file collisions (raw, before live-code filter) | **30** pairs (see §4) |
| Cross-file collisions **after dropping the 7 known-unregistered controllers** | **0** |
| Routes that reach an HTTP handler at all (in registered controllers) | **2,886** (subtract 56 routes that live in the 7 unregistered files — see §5) |

Round 1 reported 2,851. The +91 delta is **real new code**, not a parser difference: the Python walk reproduces grep's 2,917 figure when filtered to the same set of files. The extra +25 from the Python figure comes from controllers whose decorators are written on the same line as the method body or are indented unusually.

---

## 2. Routes by HTTP verb

From the Python walk over all `.controller.ts` files:

| Verb | Count | Share |
|---|---|---|
| GET | 1,619 | 55.0% |
| POST | 820 | 27.9% |
| PATCH | 268 | 9.1% |
| DELETE | 142 | 4.8% |
| PUT | 93 | 3.2% |
| OPTIONS | 0 | 0% |
| ALL | 0 | 0% |
| **Total** | **2,942** | |

Live-only (subtract the 56 routes in the 7 unregistered controllers):

| Verb | Live count |
|---|---|
| GET | 1,581 |
| POST | 810 |
| PATCH | 264 |
| DELETE | 140 |
| PUT | 91 |
| **Total live** | **2,886** |

PUT is rare on purpose — most updates use PATCH. There are zero `@Options` and zero `@All` declarations, so any preflight handling relies on the NestJS global CORS middleware rather than per-route opt-in.

---

## 3. Top modules by route count

Module key is the first directory segment under `apps/api/src/modules/` (or top-level if not under `modules/`). Counts are routes per module across all `.controller.ts` files (live-only — unregistered controllers removed).

| # | Module | Route count |
|---|---|---|
| 1 | `hr` | 344 |
| 2 | `compatibility` | 340 |
| 3 | `finance` | 176 |
| 4 | `wms` | 157 |
| 5 | `pos` | 149 |
| 6 | `iot` | 137 |
| 7 | `crm` | 120 |
| 8 | `remaining` | 116 |
| 9 | `director` | 105 |
| 10 | `marketing` | 99 |
| 11 | `kanban` | 93 |
| 12 | `sd` | 93 |
| 13 | `ai` | 86 |
| 14 | `lms` | 81 |
| 15 | `qc` | 80 |
| 16 | `erp` | 79 |
| 17 | `integration` | 69 |
| 18 | `mm` | 69 |
| 19 | `pp` | 58 |
| 20 | `chat` | 53 |

Subtotal of top 20 = 2,544 routes ≈ 88% of the live surface.

### Top 25 individual controller files by route count

| # | File | Routes |
|---|---|---|
| 1 | `modules/marketing/presentation/marketing-analytics-stubs.controller.ts` | 57 (all return HTTP 501 — see §7) |
| 2 | `modules/agents/agents.controller.ts` | 51 |
| 3 | `modules/compatibility/employees-compat-sub.controller.ts` | 49 |
| 4 | `modules/hr/presentation/hr-dashboard.controller.ts` | 43 (15 of these hardcode `{ items: [], total: 0 }` — see §6) |
| 5 | `modules/compatibility/barcode-warehouse.controller.ts` | 29 |
| 6 | `modules/iot/presentation/iot-main.controller.ts` | 29 |
| 7 | `modules/erp/erp-reports.controller.ts` | 28 |
| 8 | `modules/mm/presentation/mm-dashboard.controller.ts` | 27 (16 of these call `notImplemented()`) |
| 9 | `modules/hr/presentation/hr-compat-a.controller.ts` | 26 |
| 10 | `modules/sd/presentation/sd-customers.controller.ts` | 24 |
| 11 | `modules/erp/erp-products.controller.ts` | 23 |
| 12 | `modules/org-structure/org-structure.controller.ts` | 23 |
| 13 | `modules/sd/presentation/sd-quotations.controller.ts` | 23 |
| 14 | `modules/general/controllers/general-legacy-b.controller.ts` | 22 |
| 15 | `modules/integration/integration-extended.controller.ts` | 22 |
| 16 | `modules/kanban/presentation/kanban-boards.controller.ts` | 22 |
| 17 | `modules/marketing/presentation/marketing-analytics.controller.ts` | 22 |
| 18 | `modules/compatibility/europrint-control.controller.ts` | 21 |
| 19 | `modules/compatibility/resources.controller.ts` | 21 (3 distinct `@Controller(...)` classes) |
| 20 | `modules/pos/presentation/warehouse-features.controller.ts` | 21 |
| 21 | `modules/compatibility/asset-management.controller.ts` | 20 |
| 22 | `modules/erp/erp-orders.controller.ts` | 19 |
| 23 | `modules/iot/presentation/iot-tablet.controller.ts` | 19 (14 of 19 are `notImplemented()`) |
| 24 | `modules/kanban/presentation/kanban-cards.controller.ts` | 19 |
| 25 | `modules/pos/presentation/pos.controller.ts` | 19 |

---

## 4. Duplicate route pairs

### 4.1 Raw cross-file duplicates (30 pairs)

These are `(method, path)` keys that appear in more than one `.controller.ts` file. The parameter normalisation step replaces every `:name` segment with `:var` before comparing, so `/foo/:id` and `/foo/:userId` count as the same key.

| # | Method | Path | Locations | Live status |
|---|---|---|---|---|
| 1 | POST | `/auth/refresh` | `modules/auth/presentation/auth.controller.ts:147` + `modules/general/controllers/admin-auth.controller.ts:40` | **DEAD pair** — `AdminAuthController` (general) and `AdminAuthController` (legacy) are not imported by any module. Only the real `AuthController` is registered. |
| 2 | GET | `/departments` | `modules/compatibility/departments-positions-compat.controller.ts:16` + `modules/compatibility/resources.controller.ts:114` | **DEAD pair** — `DepartmentsPositionsCompatController` is declared but not listed in `compatibility.module.ts`. Only `DepartmentsCompatController` (resources.controller) is registered. |
| 3 | GET | `/positions` | `modules/compatibility/departments-positions-compat.controller.ts:23` + `modules/compatibility/resources.controller.ts:179` | **DEAD pair** — same reason. |
| 4 | GET | `/hr/offboarding/cases` | `modules/hr/offboarding/hr-offboarding.controller.ts:34` + `modules/hr/presentation/hr-dashboard-stubs.controller.ts:69` | **DEAD pair** — `HrDashboardStubsController` is commented out in `hr.providers.ts:167` ("TODO HR-STUB-DUP"). |
| 5 | POST | `/hr/offboarding/cases` | `modules/hr/offboarding/hr-offboarding.controller.ts:55` + `modules/hr/presentation/hr-dashboard-stubs-write.controller.ts:78` | **DEAD pair** — stubs-write also commented out (`hr.providers.ts:168`). |
| 6 | GET | `/hr/onboarding-checklists` | `modules/hr/onboarding-checklists/onboarding-checklists.controller.ts:51` + `modules/hr/presentation/hr-dashboard-stubs.controller.ts:83` | **DEAD pair** — same. |
| 7 | POST | `/hr/onboarding-checklists` | `modules/hr/onboarding-checklists/onboarding-checklists.controller.ts:62` + `modules/hr/presentation/hr-dashboard-stubs-write.controller.ts:88` | **DEAD pair**. |
| 8 | PATCH | `/hr/onboarding-checklists/:id` | `modules/hr/onboarding-checklists/onboarding-checklists.controller.ts:81` + `modules/hr/presentation/hr-dashboard-stubs-write.controller.ts:99` | **DEAD pair**. |
| 9 | GET | `/hr/adaptation/:id` | `modules/hr/presentation/hr-dashboard.controller.ts:111` + `modules/hr/presentation/hr-dashboard-stubs.controller.ts:33` | **DEAD pair**. |
| 10 | GET | `/hr/alumni/:id` | `…hr-dashboard.controller.ts:121` + `…hr-dashboard-stubs.controller.ts:41` | **DEAD pair**. |
| 11 | GET | `/hr/daily-reports` | `…hr-dashboard.controller.ts:126` + `…hr-dashboard-stubs.controller.ts:48` | **DEAD pair**. |
| 12 | GET | `/hr/daily-reports/department` | `…hr-dashboard.controller.ts:131` + `…hr-dashboard-stubs.controller.ts:55` | **DEAD pair**. |
| 13 | GET | `/hr/daily-reports/my` | `…hr-dashboard.controller.ts:136` + `…hr-dashboard-stubs.controller.ts:62` | **DEAD pair**. |
| 14 | GET | `/hr/offboarding/questions` | `…hr-dashboard.controller.ts:153` + `…hr-dashboard-stubs.controller.ts:76` | **DEAD pair**. |
| 15 | GET | `/hr/fp-cycle` | `…hr-dashboard.controller.ts:162` + `…hr-dashboard-stubs.controller.ts:90` | **DEAD pair**. |
| 16 | GET | `/hr/hrc-tests/employee` | `…hr-dashboard.controller.ts:167` + `…hr-dashboard-stubs.controller.ts:97` | **DEAD pair**. |
| 17 | GET | `/hr/hrc-tests/public` | `…hr-dashboard.controller.ts:172` + `…hr-dashboard-stubs.controller.ts:104` | **DEAD pair**. |
| 18 | GET | `/hr/hrc-tests/stats` | `…hr-dashboard.controller.ts:177` + `…hr-dashboard-stubs.controller.ts:111` | **DEAD pair**. |
| 19 | GET | `/hr/360/reviewable` | `…hr-dashboard.controller.ts:182` + `…hr-dashboard-stubs.controller.ts:118` | **DEAD pair**. |
| 20 | GET | `/hr/birthdays/settings` | `…hr-dashboard.controller.ts:187` + `…hr-dashboard-stubs.controller.ts:125` | **DEAD pair**. |
| 21 | GET | `/hr/birthdays/settings/:id` | `…hr-dashboard.controller.ts:199` + `…hr-dashboard-stubs.controller.ts:133` | **DEAD pair**. |
| 22 | GET | `/hr/ai-interview/session` | `…hr-dashboard.controller.ts:204` + `…hr-dashboard-stubs.controller.ts:140` | **DEAD pair**. |
| 23 | GET | `/hr/ai-interview/session/:id/review` | `…hr-dashboard.controller.ts:209` + `…hr-dashboard-stubs.controller.ts:148` | **DEAD pair**. |
| 24 | GET | `/hr/documents/employee` | `…hr-dashboard.controller.ts:214` + `…hr-dashboard-stubs.controller.ts:155` | **DEAD pair**. |
| 25 | GET | `/hr/documents/my` | `…hr-dashboard.controller.ts:219` + `…hr-dashboard-stubs.controller.ts:162` | **DEAD pair**. |
| 26 | GET | `/hr/documents/pending` | `…hr-dashboard.controller.ts:224` + `…hr-dashboard-stubs.controller.ts:169` | **DEAD pair**. |
| 27 | GET | `/hr/employee-corp` | `…hr-dashboard.controller.ts:229` + `…hr-dashboard-stubs.controller.ts:176` | **DEAD pair**. |
| 28 | GET | `/hr/employees/operator-stats` | `…hr-dashboard.controller.ts:234` + `…hr-dashboard-stubs.controller.ts:191` | **DEAD pair**. |
| 29 | GET | `/hr/enps/surveys/results` | `…hr-dashboard.controller.ts:239` + `…hr-dashboard-stubs.controller.ts:198` | **DEAD pair**. |
| 30 | GET | `/hr/abc-analysis/:id/calculate` | `…hr-dashboard.controller.ts:244` + `…hr-dashboard-stubs.controller.ts:206` | **DEAD pair**. |

### 4.2 Live duplicates (after dropping unregistered controllers)

The following 7 controllers are present on disk but **never imported by any `@Module()`** (verified via `grep -rE "<ClassName>" apps/api/src` against every controller name; only the file that defines the class matches, never an import or module providers list):

1. `modules/hr/presentation/hr-dashboard-stubs.controller.ts` (26 routes) — explicitly commented out in `apps/api/src/modules/hr/hr.providers.ts:167` with the comment *"TODO HR-STUB-DUP: Both stub controllers removed — their routes duplicate HrDashboardController (Fastify rejects duplicates)"*.
2. `modules/hr/presentation/hr-dashboard-stubs-write.controller.ts` (9 routes) — same.
3. `modules/compatibility/departments-positions-compat.controller.ts` (2 routes) — declared but not in `compatibility.module.ts:108-160`.
4. `modules/general/controllers/admin-auth.controller.ts` (1 route) — declared but `LegacyModule` (`apps/api/src/modules/general/legacy.module.ts:17`) only registers `GeneralLegacyAController` and `GeneralLegacyBController`.
5. `modules/legacy/controllers/admin-auth.controller.ts` (an empty/skeleton class) — not imported anywhere.
6. `modules/legacy/controllers/general-legacy-a.controller.ts` (9 routes) — not imported anywhere (the live legacy file is `modules/general/controllers/general-legacy-a.controller.ts`).
7. `modules/legacy/controllers/general-legacy-b.controller.ts` (8 routes) — same.

Total dead routes in these 7 files: **56**.

After removing them from the duplicate set: **0 live cross-file duplicates remain**.

Same-file duplicates (one method registered twice in the same controller class — would be a real bug because Nest accepts the last decorator silently): **0**. The round-1 report of "~50 same-file repeated decorators" came from a regex artifact (some controllers were counted twice when the same decorator span matched multiple capture groups). Re-running the extraction with proper anchoring shows zero same-file duplicates.

The active code base therefore has **no route-table collisions**. The dead files on disk are noise that the build still type-checks; deleting them or moving them to a `__deprecated/` folder would prevent regressions if someone ever re-adds them to a providers list.

---

## 5. Bare @Controller() instances

11 (not 12) controllers declare `@Controller()` with no path argument. Each route in these controllers attaches at the API root (`/`) unless the route decorator itself starts with a sub-path, in which case the route lands at that sub-path with no module prefix.

| # | File | Line | Class | Registered? | Effective base | Route count |
|---|---|---|---|---|---|---|
| 1 | `modules/compatibility/departments-positions-compat.controller.ts` | 14 | `DepartmentsPositionsCompatController` | **No** — not in compatibility.module.ts | n/a | 2 (dead) |
| 2 | `modules/compatibility/settings-admin.controller.ts` | 47 | `SettingsAdminController` | Yes (compatibility.module.ts:129) | `/` — routes are `/guidelines`, `/contact-settings`, `/system-settings`, … | 13 |
| 3 | `modules/ecommerce/ecommerce-catalog.controller.ts` | 24 | `EcommerceCatalogController` | Yes (ecommerce.module.ts:31) | `/admin/*` — every method specifies its own sub-path like `'admin/products'`, `'admin/categories'` | 10 |
| 4 | `modules/ecommerce/ecommerce-customers.controller.ts` | 22 | `EcommerceCustomersController` | Yes (ecommerce.module.ts:34) | `/admin/customers/*` | 4 |
| 5 | `modules/ecommerce/ecommerce-orders.controller.ts` | 25 | `EcommerceOrdersController` | Yes (ecommerce.module.ts:32) | `/admin/customer-orders/*` | 5 |
| 6 | `modules/ecommerce/ecommerce-public.controller.ts` | 22 | `EcommercePublicController` | Yes (ecommerce.module.ts:33) | `/api/products/*`, `/api/categories/*` (route decorators include the prefix) | 4 |
| 7 | `modules/ecommerce/website/website-media.controller.ts` | 27 | `WebsiteMediaController` | Yes (ecommerce.module.ts:37) | `/website/media/*` (route decorators include it) | 9 |
| 8 | `modules/ecommerce/website/website.controller.ts` | 26 | `WebsiteController` | Yes (ecommerce.module.ts:36) | `/website/*` | 6 |
| 9 | `modules/general/controllers/admin-auth.controller.ts` | 26 | `AdminAuthController` | **No** — neither `general/legacy.module.ts` nor any other module imports it | n/a | 1 (dead) |
| 10 | `modules/general/controllers/general-legacy-a.controller.ts` | 39 | `GeneralLegacyAController` | Yes (general/legacy.module.ts:17) | `/` — routes are `/face-embeddings`, `/attendance`, `/papka-orders`, … | 16 |
| 11 | `modules/general/controllers/general-legacy-b.controller.ts` | 45 | `GeneralLegacyBController` | Yes (general/legacy.module.ts:17) | `/` — routes are `/legacy-*` and `/iot/*` etc. | 22 |

Of the 11 bare-controller declarations:
- **3 are unregistered dead code** (`#1`, `#9`, and a similar bare-controller variant in `modules/legacy/controllers/admin-auth.controller.ts` that I tracked separately under §4 → 7 unregistered controllers in total when counting the 4 non-bare ones in `legacy/controllers/` and `hr-dashboard-stubs*`).
- **8 are live** and add ~89 root-level routes. Live route counts: `settings-admin` (13) + `ecommerce-*` (28) + `website*` (15) + `general-legacy-a` (16) + `general-legacy-b` (22) ≈ 94 routes.

The collision risk that the round-1 report flagged is the concern that adding a new top-level module path (say `/guidelines` somewhere else) would silently shadow one of these. There is no live collision today (see §4), but the pattern is fragile.

---

## 6. Hardcoded / empty-return endpoints

These handlers do not query the database — they return a constant. The sample below is drawn from grep over `*.controller.ts` for `return []`, `return {}`, `return { items: [], total: 0 }`, `return { data: [] }`, `return { …: null }`, `return { success: true }`.

### 6.1 The big cluster: `hr-dashboard.controller.ts` (15 hardcoded routes)

After the HR stub controllers were commented out (see §4), the real `HrDashboardController` was left holding the dashboard routes — but it never gained a service implementation. These 15 handlers currently return synthetic empty payloads:

| Path | Line | Hardcoded return |
|---|---|---|
| `GET /hr/adaptation/:id` | 113 | `{ adaptation: null }` |
| `GET /hr/alumni` | 118 | `{ items: [], total: 0 }` |
| `GET /hr/alumni/:id` | 123 | `{ alumni: null }` |
| `GET /hr/daily-reports` | 128 | `{ items: [], total: 0 }` |
| `GET /hr/daily-reports/department` | 133 | `{ items: [], total: 0 }` |
| `GET /hr/daily-reports/my` | 138 | `{ items: [], total: 0 }` |
| `POST /hr/daily-reports` | 145 | `{ created: true }` |
| `GET /hr/offboarding/questions` | 155 | `{ items: [], total: 0 }` |
| `GET /hr/fp-cycle` | 164 | `{ items: [], total: 0 }` |
| `GET /hr/hrc-tests/employee` | 169 | `{ items: [], total: 0 }` |
| `GET /hr/hrc-tests/public` | 174 | `{ items: [], total: 0 }` |
| `GET /hr/hrc-tests/stats` | 179 | `{ stats: null }` |
| `GET /hr/360/reviewable` | 184 | `{ items: [], total: 0 }` |
| `GET /hr/birthdays/settings` | 189 | `{ settings: null }` |
| `POST /hr/birthdays/settings` | 196 | `{ saved: true }` |
| `GET /hr/birthdays/settings/:id` | 201 | `{ settings: null }` |
| `GET /hr/ai-interview/session` | 206 | `{ items: [], total: 0 }` |
| `GET /hr/ai-interview/session/:id/review` | 211 | `{ review: null }` |
| `GET /hr/documents/employee` | 216 | `{ items: [], total: 0 }` |
| `GET /hr/documents/my` | 221 | `{ items: [], total: 0 }` |
| `GET /hr/documents/pending` | 226 | `{ items: [], total: 0 }` |
| `GET /hr/employee-corp` | 231 | `{ items: [], total: 0 }` |
| `GET /hr/employees/operator-stats` | 236 | `{ stats: null }` |
| `GET /hr/enps/surveys/results` | 241 | `{ items: [], total: 0 }` |
| `GET /hr/abc-analysis/:id/calculate` | 246 | `{ result: null }` |

The `hr.providers.ts` TODO comment makes the situation explicit:
> *"Follow-up: either (a) extract unique stubs into a /v2 prefix controller, or (b) convert HrDashboardController mock returns to notImplemented() 501."*

Path (b) has not been done yet. From the frontend's perspective, these endpoints return 200 with empty data — they look like working endpoints that legitimately have no records, which is **strictly worse than 501**. Several FE pages (HRDashboard, HRQuestionBankAdmin) hit these routes and show empty cards as if the data were real.

### 6.2 Other genuine hardcoded returns

| Endpoint | File:line | Hardcoded body | Notes |
|---|---|---|---|
| `GET /mm/vendor-performance` | `modules/mm/presentation/mm-vendors-pr.controller.ts:56` | `return [];` | Documented as a deliberate stub — *"Real DB pull will land when vendor_performance schema is added; for now we serve an empty list (page renders empty state cleanly)."* |
| `GET /security/visitors` | `modules/security/presentation/security.controller.ts:154` | `getVisitors() { return []; }` | One-liner; service exists but `visitors` table is not yet populated. |
| `POST /mm/purchase-orders` (line 64), `PATCH /mm/purchase-orders/:id` (line 90) | `modules/mm/presentation/mm-purchase-orders.controller.ts:64,90` | `} catch (_e) { return []; }` | Errors are swallowed silently — caller sees empty array instead of HTTP 500. Genuine P2 bug — the underlying service call may have failed for a structural reason that the caller cannot see. |
| `GET /sd/contracts` | `modules/sd/presentation/sd-contracts.controller.ts:63` | `} catch (_e) { return []; }` | Same pattern — only triggers on error. Happy path performs a real `db.select().from(sd_contracts)…` query. |
| `GET /accounting/three-way-match` (conditional) | `modules/finance/presentation/finance-accounting.controller.ts:138` | `if (!orderId) return [];` | Defensive — input validation rather than fake data. Acceptable. |
| `GET /kanban/notifications` | `modules/kanban/presentation/kanban-boards.controller.ts:173` | `if (!result.ok) return []` | Error-path stub; happy path queries DB. |
| `GET /kanban/cards/search` (3 routes) | `modules/kanban/presentation/kanban-cards.controller.ts:88, 104, 107` | `return { items: [], total: 0 };` | Two are inside `if (!result.ok)` guards, but the third (line 107) is a final fallback that ALWAYS fires if no branch returns earlier — looks like the search has no actual implementation behind it. |
| `GET /kanban/reports/aggregate` | `modules/kanban/presentation/kanban-reports.controller.ts:226` | `if (!result.ok) return { items: [], total: 0 };` | Error-path stub. |
| `GET /wms/warehouses/list` (one branch) | `modules/wms/presentation/wms-warehouses.controller.ts:146` | `return { items: [], total: 0 };` | Inside an error guard. |
| `GET /hr/inspection` | `modules/hr/inspection/inspection.controller.ts:90` | `if (!r.ok) return { items: [], total: 0 };` | Error-path stub. |
| `GET /hr/employees-ext/*` | `modules/hr/presentation/hr-employees-ext.controller.ts:169, 179` | `return { data: [] }` / `return { data: null }` | Error-path stubs. |
| `POST /kanban/boards/:id` | `modules/kanban/presentation/kanban-boards.controller.ts:182` | `return { ok: true };` | After real `markAllNotificationsRead()` — acceptable ACK shape. |
| `POST /cc/notification-prefs` | `modules/communication-center/presentation/cc-notification-prefs.controller.ts:39` | `return { success: true };` | One-liner — no service call visible; needs follow-up. |
| `POST /finance/cfo-config` | `modules/finance/presentation/finance-cfo-config.controller.ts:37` | `return { success: true };` | One-liner — no service call visible; needs follow-up. |
| `POST /remaining/ideal-rasm` | `modules/remaining/ideal-rasm.controller.ts:32` | `return { success: true };` | One-liner — likely stub. |
| `POST /lms/completeCourse` | `modules/lms/presentation/lms-core.controller.ts:129` | `async completeCourse(@Body() _body: …) { return { success: true }; }` | One-liner — completion not actually recorded. |
| `PATCH /mm/dashboard/pay-vendor-invoice/:id` | `modules/mm/presentation/mm-dashboard.controller.ts:251` | `return { success: true };` | One-liner — payment is not recorded. |
| `POST /warehouse-rental/recalculate` | `modules/wms/presentation/warehouse-rental.controller.ts:119` | `return { success: true };` | One-liner stub. |
| `POST /wms/inventory/*`, `POST /wms/stock/*` | `wms-inventory.controller.ts:51`, `wms-stock.controller.ts:52` | `return { success: true };` | One-liner stubs. |
| `GET /lms/certificates/:id/status` | `modules/lms/presentation/lms-certificates-standalone.controller.ts:76` | `return { id, status: 'unknown', issuedAt: null, expiresAt: null };` | Synthetic literal — service exists but is not called. |
| `GET /qc/parameters/:id/run-test` | `modules/qc/presentation/qc-parameters.controller.ts:124` | `return { id, results: [], passed: null, testedAt: null };` | Synthetic literal. |
| `GET /remaining/order-status/:id/breakdown` | `modules/remaining/order-status.controller.ts:121` | `return { orderId, breakdown: null, machineId: null };` | Synthetic literal. |
| `GET /org-structure/:nodeId/portret` | `modules/org-structure/org-structure.controller.ts:249` | `return { nodeId, portret: null };` | Synthetic literal. |
| `GET /hr/recruitment/probation/:id/review` | `modules/hr/recruitment/hr-vacancies-probation.controller.ts:115` | `return { data: { pipeline_id: id, review: null } };` | Synthetic literal. |
| `GET /admin/login-info` | `modules/admin/presentation/controllers/admin-extra.controller.ts:88` | `return { message: 'Use /api/auth/login for authentication', data: null };` | Documentation stub — acceptable. |
| `GET /crm/activities/by-employee` | `modules/crm/presentation/crm-activities.controller.ts:131` | `return {};` | One-liner — needs verification. |
| `GET /crm/companies/duplicates` | `modules/crm/presentation/crm-companies.controller.ts:156` | `return {};` | One-liner — needs verification. |
| `GET /crm/followup-activities/by-deal/:id` | `modules/crm/presentation/crm-followup-compat.controller.ts:98` | `return {};` | One-liner — needs verification. |
| `GET /bot-gateway/(2 routes)` | `modules/bot-gateway/bot-gateway.controller.ts:77, 128` | `if (!botSvc) return {};`, `if (!chatId) return {};` | Defensive input checks — acceptable. |
| `GET /hr/telegram-bots/(3 routes)` | `modules/hr/telegram-bots/telegram-bots.controller.ts:79, 93, 107` | `return {};` | Three one-liners — bot integration not wired up. |
| `POST /aisha/(3 routes)` | `modules/aisha/presentation/controllers/chat.controller.ts:68, 79, 133` | `return { success: true, data: { … } };` | Real Aisha calls — `data:` block contains computed payload. Acceptable. |
| `POST /chat/files/(3 routes)` | `modules/chat/chat-uploads.controller.ts:96, 107, 159` | `return { ok: true };` | After real upload. Acceptable ACK shape. |
| `POST /cc/documents/(1 route)` | `modules/communication-center/presentation/cc-documents.controller.ts:146` | `return { ok: true };` | ACK shape. |

The `return {}` after `await svc.softDelete(...)` (e.g. `modules/sd/presentation/sd-customers.controller.ts:207, 264, 314, 346`; `modules/mm/presentation/mm-goods.controller.ts:91, 147`; `modules/mm/presentation/mm-vendors-pr.controller.ts:163`; `modules/kanban/presentation/kanban-boards.controller.ts:107, 140`) is **not** a fake return — it is the conventional empty 200 body for a DELETE endpoint. Round 1 incorrectly flagged these as "Fake responses".

### 6.3 Categorisation summary

| Category | Routes |
|---|---|
| Truly hardcoded (no service call, returns constant) | **~30** (most concentrated in `hr-dashboard.controller.ts`) |
| Error-fallback `return []` / `return {}` (happy path is real) | ~14 (kanban, wms, hr-employees-ext, sd-contracts, mm-purchase-orders, etc.) |
| Defensive input checks (returns empty when input is missing) | ~5 |
| DELETE handlers returning `{}` after real soft-delete | ~10 (correctly flagged as **NOT fake** in this report) |
| ACK `return { ok: true }` / `return { success: true }` after real work | ~5 |

Round 1's "16 fake endpoints" figure was a mix of category 1 (real bug), category 2 (acceptable error fallback), and category 4 (not a bug at all). The actually-fake-data count is closer to **30, dominated by the 25-route HR dashboard cluster**.

---

## 7. 501 endpoints

`notImplemented()` (defined at `apps/api/src/common/exceptions/not-implemented.ts:29`) throws an `HttpException` with HTTP 501 and body `{ message: 'Endpoint not yet implemented: <route>', code: 'NOT_IMPLEMENTED' }`. Per project rule P3-26 this is the correct way to mark an unimplemented stub.

| Bucket | Count |
|---|---|
| Total `notImplemented()` call sites in any `.controller.ts` file | **225** |
| `notImplemented()` call sites in **live (registered) controllers** | **190** (35 invocations live in the two unregistered `hr-dashboard-stubs*` files) |
| Distinct route declarations that resolve to a `notImplemented()` body | **211** (Python heuristic — each `@Method(...)` followed by `notImplemented(...)` within 15 lines) |

### Top 15 live controllers by `notImplemented()` count

| # | File | `notImplemented()` calls |
|---|---|---|
| 1 | `modules/marketing/presentation/marketing-analytics-stubs.controller.ts` | 57 (every method in this controller is 501) |
| 2 | `modules/mm/presentation/mm-dashboard.controller.ts` | 16 |
| 3 | `modules/iot/presentation/iot-tablet.controller.ts` | 14 |
| 4 | `modules/integration/integration-employee.controller.ts` | 10 |
| 5 | `modules/finance/presentation/finance-extended-payroll.controller.ts` | 9 |
| 6 | `modules/wms/presentation/wms-barcode.controller.ts` | 8 |
| 7 | `modules/hr/presentation/hr-compat-a.controller.ts` | 6 |
| 8 | `modules/wms/presentation/wms-integration.controller.ts` | 6 |
| 9 | `modules/compatibility/saas.controller.ts` | 5 |
| 10 | `modules/design/presentation/design.controller.ts` | 5 |
| 11 | `modules/security/presentation/security.controller.ts` | 5 |
| 12 | `modules/ai/presentation/ai.controller.ts` | 4 |
| 13 | `modules/pos/presentation/pos-stub.controller.ts` | 4 |
| 14 | `modules/pp/technology/technology.controller.ts` | 4 |
| 15 | `modules/hr/presentation/hr-dashboard-extra.controller.ts` | 3 |

### Sample of 501 routes (15 of 211)

| Method | Path | File:line |
|---|---|---|
| GET | `/ai/bottleneck/analysis` | `modules/ai/presentation/ai.controller.ts:169` |
| GET | `/ai/forecast/demand` | `modules/ai/presentation/ai.controller.ts:176` |
| POST | `/ai/rush-orders/:id/approve` | `modules/ai/presentation/ai.controller.ts:192` |
| GET | `/europrint-control/menus/admin` | `modules/compatibility/europrint-control-director.controller.ts:122` |
| PUT | `/saas/tenants/:id` | `modules/compatibility/saas.controller.ts:118` |
| POST | `/saas/tenants/:id/onboard` | `modules/compatibility/saas.controller.ts:141` |
| GET | `/warehouse/movements` | `modules/compatibility/warehouse-catalog.controller.ts:66` |
| GET | `/design/notifications` | `modules/design/presentation/design.controller.ts:152` |
| POST | `/finance/payroll/calculate` | `modules/finance/presentation/finance-extended-payroll.controller.ts:28` |
| GET | `/finance/payroll-tax-rules` | `modules/finance/presentation/finance-extended-payroll.controller.ts:78` |
| GET | `/finance/cash-flow` | `modules/finance/presentation/finance-main.controller.ts:96` |
| PATCH | `/iot/material-kit-items/:id/scan` | `modules/iot/presentation/iot-tablet.controller.ts:160` |
| POST | `/iot/production-sessions` | `modules/iot/presentation/iot-tablet.controller.ts:172` |
| POST | `/mm/purchase-requisitions/:id/submit` | `modules/mm/presentation/mm-purchase-orders.controller.ts:*` |
| POST | `/marketing/content/ai-generate` | `modules/marketing/presentation/marketing-analytics-stubs.controller.ts:*` |

The `marketing-analytics-stubs` controller is the largest single source — 57 routes covering NPS, churn-risk, social-API, AI-content, calendar, exhibitions, PR, attribution, and competitive-intelligence endpoints. Every one returns 501. The controller is registered in `marketing.module.ts:37`, so the frontend pages that bind to these paths get an explicit 501 (good — round 1 was right about this being correct behaviour for a known-incomplete module).

---

## 8. Frontend calls → backend 404 candidates

Scan of `artifacts/erp-dashboard/src/**/*.ts(x)` (2,066 source files, excluding tests) extracted **3,956 API call sites** across **2,104 distinct `(method, path)` pairs**. Of those, **185 pairs have no matching backend route** after normalising `:id`/`:cardId`/etc. to `:var`.

### 8.1 Breakdown by top-level segment

| Segment | 404 candidates | Notes |
|---|---|---|
| `/hr` | 47 | Largest cluster — most of these are calls to `/hr/leave/types`, `/hr/leave/balances`, `/hr/payroll/{periods,overtime,bonuses,fines,deductions,salary-history}`, `/hr/kpi/{daily,goals,ratings,productivity}`, `/hr/recruitment/{candidates,interviews}`, `/hr/attendance/{summary,abc-results,late-employees,monthly-report}`, the entire `/hr/discipline/*` subtree (10 endpoints), `/hr/gamification/leaderboard`, `/hr/skills/:id`, `/hr/question-bank/*`, `/hr/zno`, `/hr/zvs`, `/hr/document-workflow/rules`, `/hr/safety/export/pdf`. |
| `/hr-v2` | 17 | Entire `/hr-v2/{daily-reports,pip,enps,documents}/*` subtree — backend has no `/hr-v2` prefix at all. |
| `/marketing` | 13 | `/marketing` root POST, `/marketing/:id` PATCH/DELETE, `/marketing/:id/launch`, `/marketing/budget/:id`, `/marketing/calendar/:id`, `/marketing/exhibitions/:id`, `/marketing/pr/:id`, `/marketing/nps`, `/marketing/ai-assistant`. |
| `/adaptation` | 13 | `/adaptation/{programs,feedback,new-employees,welcome-events}` and their sub-paths — no backend `/adaptation` controller exists. |
| `/crm` | 10 | `/crm/ai/extended/*` (4), `/crm/ai/{churn,voice}` (2), `/crm/deals/:id/stage`, `/crm/deals/close`, `/crm/custom-fields/:id`, `/crm/activities/:id/done`. |
| `/pos` | 10 | `/pos/movements/:id/{lines,status}`, `/pos/movement-types`, `/pos/passports`, `/pos/barcodes`, `/pos/pdf-templates`, `/pos/sync/all`, `/pos/sync/:id`, `/pos/warehouse-access` POST + `/pos/warehouse-access/:id/:id` DELETE. |
| `/core` | 7 | Entire `/core/{departments,positions}` subtree — backend exposes these under `/departments` and `/positions` (or `/org-structure/*`). FE uses an alternate `/core/*` prefix that has no controller. |
| `/seven-functions` | 7 | Entire `/seven-functions/{functions,kpis,analyze}` subtree. |
| `/org-structure` | 6 | `/org-structure/position-folder` (GET/POST/PATCH/DELETE), `/org-structure/functions`, `/org-structure/departments`. |
| `/questionnaire` | 5 | Entire `/questionnaire/*` subtree. |
| Others | 60 | spread across `/chat`, `/security`, `/kanban`, `/agents`, `/sd`, `/employee-kpi`, `/camera-alerts`, `/camera-heatmap`, `/order-status`, `/warehouses`, `/cameras`, `/forecasts`, `/warehouse`, `/accounting`, `/mes`, `/wms`, `/fi`, `/lms`, `/system`, `/integration`, `/equipment`, `/camera-reports`, `/camera-settings`, `/certificates`, `/modules`, `/assignments`, `/goals`, `/material-balance`, `/progress`, `/reports-hub`, `/supply-chain`, `/mm`, `/employees`, `/micro-modules`. |
| **Total** | **185** | |

### 8.2 Most-called 404 candidates (≥ 2 call sites)

| Calls | Method | Path | Sample FE source |
|---|---|---|---|
| 4 | GET | `/hr/leave/requests` | `artifacts/erp-dashboard/src/hooks/use-hr-leave.ts:18` |
| 4 | GET | `/hr/question-bank` | `artifacts/erp-dashboard/src/pages/HRQuestionBankAdmin.tsx:44` |
| 4 | GET | `/org-structure/position-folder` | `artifacts/erp-dashboard/src/pages/PositionFolderPage.tsx:47` |
| 3 | GET | `/adaptation/programs` | `artifacts/erp-dashboard/src/pages/adaptation/ProgramsTab.tsx:55` |
| 3 | GET | `/core/departments` | `artifacts/erp-dashboard/src/pages/OrgDepartmentsPage.tsx:49` |
| 3 | GET | `/hr/payroll/periods` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:11` |
| 3 | GET | `/hr/recruitment/candidates` | `artifacts/erp-dashboard/src/hooks/use-hr-recruitment.ts:34` |
| 3 | GET | `/org-structure/functions` | `artifacts/erp-dashboard/src/pages/DocumentRoutingAdmin.tsx:52` |
| 2 | DELETE | `/core/departments/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:40` |
| 2 | GET | `/adaptation/feedback` | `artifacts/erp-dashboard/src/pages/adaptation/FeedbackTab.tsx:115` |
| 2 | GET | `/adaptation/new-employees` | `artifacts/erp-dashboard/src/pages/adaptation/NewEmployeesTab.tsx:106` |
| 2 | GET | `/adaptation/welcome-events` | `artifacts/erp-dashboard/src/pages/adaptation/WelcomeEventsTab.tsx:87` |
| 2 | GET | `/hr-v2/daily-reports/department` | `artifacts/erp-dashboard/src/pages/DailyReportPage.tsx:64` |
| 2 | GET | `/hr-v2/enps` | `artifacts/erp-dashboard/src/pages/HRDashboard.tsx:90` |
| 2 | GET | `/hr-v2/pip` | `artifacts/erp-dashboard/src/pages/HRDashboard.tsx:84` |
| 2 | GET | `/hr/attendance/abc-results` | `artifacts/erp-dashboard/src/hooks/use-hr-attendance.ts:45` |
| 2 | GET | `/hr/employee-corp/:var` | `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx:276` |
| 2 | GET | `/hr/kpi/daily` | `artifacts/erp-dashboard/src/hooks/use-hr-kpi.ts:11` |
| 2 | GET | `/hr/kpi/goals` | `artifacts/erp-dashboard/src/hooks/use-hr-kpi.ts:26` |
| 2 | GET | `/hr/kpi/ratings` | `artifacts/erp-dashboard/src/hooks/use-hr-kpi.ts:41` |
| 2 | GET | `/hr/payroll/bonuses` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:72` |
| 2 | GET | `/hr/payroll/fines` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:87` |
| 2 | GET | `/hr/payroll/overtime` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:57` |
| 2 | GET | `/hr/recruitment/interviews` | `artifacts/erp-dashboard/src/hooks/use-hr-recruitment.ts:57` |
| 2 | GET | `/progress/summary` | `artifacts/erp-dashboard/src/pages/ProgressPage.tsx:40` |
| 2 | GET | `/reports-hub` | `artifacts/erp-dashboard/src/pages/ReportsHub.tsx:77` |
| 2 | PATCH | `/lms/lessons/:var` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:17` |
| 2 | PATCH | `/marketing/:var` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:49` |
| 2 | POST | `/core/departments` | `artifacts/erp-dashboard/src/lib/api/misc.ts:36` |
| 2 | POST | `/marketing` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:47` |
| 2 | POST | `/marketing/:var/launch` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:51` |
| 2 | POST | `/order-status/:var/machine-breakdown` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:123` |
| 2 | POST | `/security/visitors` | `artifacts/erp-dashboard/src/pages/SecurityDashboard.tsx:114` |
| 2 | PUT | `/adaptation/feedback/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:234` |
| 2 | PUT | `/adaptation/programs/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:232` |
| 2 | PUT | `/system` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:151` |

### 8.3 Notable 404 clusters

**`/hr/discipline/*` (10 endpoints, all from `artifacts/erp-dashboard/src/lib/api/hr.ts:33-51`)**

All 10 routes are defined by the same `hr.ts` API helper. There is no `/hr/discipline` controller anywhere in the backend. Either this code path is dead (no UI hits the helper) or every call returns 404 silently. Worth verifying which pages import these helpers.

**`/hr/gamification/{leaderboard, badges/catalog}`**

Backend has `/hr/gamification` paths? Let me cross-check: there is no `gamification` directory under `apps/api/src/modules/hr/`. These FE calls definitely 404.

**`/adaptation/*` (13 endpoints across 4 pages)**

The `adaptation` pages (`ProgramsTab.tsx`, `FeedbackTab.tsx`, `NewEmployeesTab.tsx`, `WelcomeEventsTab.tsx`) call a flat `/adaptation/{resource}` API that has no backend. The actual HR adaptation backend lives under `/hr/adaptation/*` — so these are likely renamed paths that the FE wasn't updated for.

**`/hr-v2/*` (17 endpoints)**

There is no `/hr-v2` prefix in the backend at all. All `/hr-v2/{daily-reports, documents, enps, pip}/*` calls 404. Likely a planned v2 namespace that was never built.

**`/core/{departments,positions}` (7 endpoints)**

FE expects `/core/*` — backend exposes the same data at `/departments` and `/positions` (via `compatibility/resources.controller.ts`) and at `/org-structure/*` (via `org-structure.controller.ts`). Three different conventions for the same data.

**`/questionnaire/*` (5 endpoints)**

No backend `questionnaire` controller. The closest match is `/hr/question-bank` — same observation as `/hr/discipline`: helper file `artifacts/erp-dashboard/src/lib/api/lms.ts:28-36` calls a non-existent prefix.

**`/seven-functions/*` (7 endpoints from `lib/api/misc.ts:53-65`)**

No backend `seven-functions` controller. Looks like an entire feature module is missing from the backend.

---

## 9. Orphan backend endpoints

**999** backend `(method, path)` pairs (out of 2,886 live) are never called by `artifacts/erp-dashboard/src` — 35% of the API surface.

This figure overstates the problem because (a) the FE extractor only sees direct calls (it misses paths assembled from variables at runtime), (b) some endpoints are called by mobile clients or external integrators that this audit doesn't cover, and (c) some are internal admin/cron endpoints. But the absolute scale (1 in 3 live endpoints unused) deserves attention.

### 9.1 Orphans by top-level segment (top 30)

| Segment | Orphan count |
|---|---|
| `/hr` | 120 |
| `/pos` | 80 |
| `/legacy` | 54 |
| `/crm` | 38 |
| `/marketing` | 36 |
| `/agents` | 29 |
| `/hr-v2` | 29 |
| `/kanban` | 27 |
| `/finance` | 26 |
| `/sd` | 25 |
| `/warehouse` | 24 |
| `/employees` | 24 |
| `/iot` | 24 |
| `/cc` | 23 |
| `/admin` | 18 |
| `/erp` | 18 |
| `/mm` | 17 |
| `/wms` | 17 |
| `/qc` | 16 |
| `/pp` | 15 |
| `/chat` | 14 |
| `/mes` | 13 |
| `/lms` | 12 |
| `/financial-reports` | 11 |
| `/integration` | 11 |
| `/org-structure` | 11 |
| `/director` | 10 |
| `/camera` | 8 |
| `/design` | 8 |
| `/crm-bitrix` | 7 |

Note `/hr-v2` shows as orphaned with 29 routes — but §8 above shows the FE actively calls 17 `/hr-v2` paths. The mismatch means **the FE calls a different set of `/hr-v2/*` paths than what the backend exposes**, which is even worse than the raw orphan/404 numbers suggest. The two namespaces never actually intersect.

### 9.2 Orphans by individual controller (top 30)

| Orphan routes | File |
|---|---|
| 29 | `modules/agents/agents.controller.ts` |
| 20 | `modules/pos/presentation/warehouse-features.controller.ts` |
| 19 | `modules/pos/presentation/pos.controller.ts` |
| 19 | `modules/compatibility/employees-compat-sub.controller.ts` |
| 18 | `modules/remaining/fi.controller.ts` |
| 18 | `modules/marketing/presentation/marketing-analytics-stubs.controller.ts` |
| 16 | `modules/hr/presentation/hr-dashboard-stubs.controller.ts` (already dead — see §5) |
| 14 | `modules/compatibility/resources.controller.ts` |
| 12 | `modules/communication-center/presentation/cc-documents.controller.ts` |
| 11 | `modules/finance/financial-reports/presentation/financial-reports.controller.ts` |
| 11 | `modules/hr/presentation/hr-compat-a.controller.ts` |
| 11 | `modules/org-structure/org-structure.controller.ts` |
| 10 | `modules/marketing/presentation/marketing-analytics.controller.ts` |
| 9 | `modules/legacy/controllers/general-legacy-a.controller.ts` (already dead — see §4) |
| 9 | `modules/pos/presentation/reports.controller.ts` |
| 9 | `modules/sd/presentation/sd-customers.controller.ts` |
| 8 | `modules/crm/presentation/crm-ai-extended.controller.ts` |
| 8 | `modules/iot/presentation/iot-tablet.controller.ts` |
| 8 | `modules/kanban/presentation/kanban-checklist.controller.ts` |
| 8 | `modules/legacy/controllers/general-legacy-b.controller.ts` (already dead) |
| 8 | `modules/pos/presentation/employee.controller.ts` |
| 7 | `modules/crm/presentation/crm-bitrix-compat.controller.ts` |
| 7 | `modules/ai-agents/presentation/ai-agents.controller.ts` |
| 7 | `modules/finance/presentation/finance-main.controller.ts` |
| 7 | `modules/compatibility/document-workflow-v2.controller.ts` |
| 7 | `modules/hr/onboarding/onboarding.controller.ts` |
| 7 | `modules/iot/presentation/iot-main.controller.ts` |
| 7 | `modules/sd/presentation/sd-quotations.controller.ts` |
| 6 | `modules/admin/presentation/controllers/admin-extra.controller.ts` |
| 6 | `modules/compatibility/crm-extended.controller.ts` |

### 9.3 Sample orphan endpoints (first 30 alphabetically)

| Method | Path | File:line |
|---|---|---|
| DELETE | `/chat/push/unsubscribe` | `modules/chat/chat-uploads.controller.ts:102` |
| DELETE | `/crm-bitrix/invoices/:var` | `modules/crm/presentation/crm-bitrix-compat.controller.ts:136` |
| DELETE | `/crm-bitrix/proposals/:var` | `modules/crm/presentation/crm-bitrix-compat.controller.ts:130` |
| DELETE | `/crm/deals/:var` | `modules/crm/presentation/crm-deals.controller.ts:177` |
| DELETE | `/departments/:var` | `modules/compatibility/resources.controller.ts:135` |
| DELETE | `/exceptions/:var` | `modules/remaining/exception-log.controller.ts:158` |
| DELETE | `/hr/leave/:var` | `modules/hr/presentation/hr-leave.controller.ts:165` |
| DELETE | `/lms/courses/:var` | `modules/lms/presentation/lms-courses.controller.ts:121` |
| DELETE | `/marketing/settings/social-api/:var` | `modules/marketing/presentation/marketing-analytics-stubs.controller.ts:133` |
| DELETE | `/pos/wh-features/employees/:var` | `modules/pos/presentation/warehouse-features.controller.ts:93` |
| DELETE | `/positions/:var` | `modules/compatibility/resources.controller.ts:206` |
| DELETE | `/pp/bom/:var` | `modules/pp/presentation/pp-bom.controller.ts:109` |
| DELETE | `/pp/routing/:var` | `modules/pp/presentation/pp-routing.controller.ts:112` |
| DELETE | `/qc/inspections/:var` | `modules/qc/presentation/qc-inspections.controller.ts:118` |
| DELETE | `/warehouse/printer-config/:var` | `modules/wms/presentation/wms-barcode.controller.ts:95` |
| GET | `/360/assessments` | `modules/hr/feedback-360/feedback-360.controller.ts:55` |
| GET | `/360/dashboard` | `modules/hr/feedback-360/feedback-360.controller.ts:33` |
| GET | `/360/feedback` | `modules/hr/feedback-360/feedback-360.controller.ts:40` |
| GET | `/360/responses` | `modules/hr/feedback-360/feedback-360.controller.ts:70` |
| GET | `/3way-match/results/v2` | `modules/remaining/three-way-match.controller.ts:51` |
| GET | `/accounting/accounts` | `modules/finance/presentation/finance-accounting.controller.ts:62` |
| GET | `/accounting/dashboard` | `modules/finance/presentation/finance-accounting.controller.ts:48` |
| GET | `/admin/audit` | `modules/admin/presentation/controllers/admin-extra.controller.ts:42` |
| GET | `/admin/categories` | `modules/ecommerce/ecommerce-catalog.controller.ts:82` |
| GET | `/admin/categories/:var` | `modules/ecommerce/ecommerce-catalog.controller.ts:91` |
| GET | `/admin/cron-status` | `modules/admin/presentation/controllers/admin-cron-status.controller.ts:30` |
| GET | `/admin/customer-orders` | `modules/ecommerce/ecommerce-orders.controller.ts:33` |
| GET | `/admin/customer-orders/:var` | `modules/ecommerce/ecommerce-orders.controller.ts:42` |
| GET | `/admin/customers` | `modules/ecommerce/ecommerce-customers.controller.ts:30` |
| GET | `/admin/customers/:var` | `modules/ecommerce/ecommerce-customers.controller.ts:39` |

The entire `/admin/{products, categories, customers, customer-orders, ecommerce/stats}` cluster from the EcommerceModule is orphaned — the FE never hits these. Whether this is because the ecommerce/admin UI hasn't been built yet, or because admin uses a different sub-app, is worth verifying.

The 4 `/360/*` routes from `hr/feedback-360/feedback-360.controller.ts` are also orphans — yet the HR 360-review feature is visible in many `Hr360*` page components. The FE calls likely use `/hr/360/*` paths that go to `hr-dashboard.controller.ts` instead, leaving the dedicated 360 controller unused.

The 29 orphan routes in `agents.controller.ts` (most of `/agents/{crm,finance,hr,inventory,iot,…}/*`) suggest the entire AI-agents experiment is unused by the dashboard — only a couple of `/agents/crm/customer360` and `/agents/crm/churn` are called, and even those are flagged in §8 as 404 candidates because the FE uses the path without a `/:id` parameter while the BE requires one.

---

## 10. Findings summary

### P0

1. **`HrDashboardController` returns hardcoded empty data on 25 dashboard routes** (`modules/hr/presentation/hr-dashboard.controller.ts:111-246`). After the stubs were commented out in `hr.providers.ts`, these routes ended up at 200/empty instead of 501/`NOT_IMPLEMENTED`. Frontend pages can't distinguish "no data" from "endpoint not implemented", which makes the dashboard look broken. The `hr.providers.ts:166` TODO explicitly notes this: *"convert HrDashboardController mock returns to notImplemented() 501."* — that work has not been done.

2. **185 FE calls hit non-existent BE routes (404 candidates).** Of these, the high-volume failures are in `use-hr-leave`, `use-hr-payroll`, `use-hr-kpi`, `use-hr-recruitment`, `use-hr-attendance`, the entire `/hr/discipline/*` subtree (10 endpoints from `lib/api/hr.ts:33-51`), the entire `/hr-v2/*` namespace (17 endpoints), the entire `/adaptation/*` namespace (13 endpoints), the `/seven-functions/*` namespace (7 endpoints), the `/questionnaire/*` namespace (5 endpoints), and the `/core/*` namespace (7 endpoints). Each call returns 404 to the user; query hooks retry, surface errors, and pollute logs.

### P1

3. **999 orphan backend routes (34.6% of the live API surface) have no FE consumer.** The worst offenders are `agents.controller.ts` (29 orphans), `warehouse-features.controller.ts` (20), `pos.controller.ts` (19), `employees-compat-sub.controller.ts` (19), `remaining/fi.controller.ts` (18), `marketing-analytics-stubs.controller.ts` (18 — the 501 stubs already in §7). Either delete these endpoints, document why they exist (mobile/external clients?), or wire the FE to them.

4. **7 controller files are not imported by any module** (~56 routes of dead code on disk):
   - `modules/hr/presentation/hr-dashboard-stubs.controller.ts` (26 routes)
   - `modules/hr/presentation/hr-dashboard-stubs-write.controller.ts` (9 routes)
   - `modules/compatibility/departments-positions-compat.controller.ts` (2 routes)
   - `modules/general/controllers/admin-auth.controller.ts` (1 route)
   - `modules/legacy/controllers/admin-auth.controller.ts` (0 routes — empty class)
   - `modules/legacy/controllers/general-legacy-a.controller.ts` (9 routes)
   - `modules/legacy/controllers/general-legacy-b.controller.ts` (8 routes)

   These bloat the route audit (round 1 was tripped up by exactly this) and risk being re-introduced if someone naïvely re-adds them to a `controllers: []` list. Delete or move to `__dead/`.

5. **8 controllers register routes at the API root via bare `@Controller()`**: `settings-admin` (13 routes), `general-legacy-a/b` (38 routes), and 5 ecommerce/website controllers (28 routes). The pattern works today because nothing else uses the same root paths, but any new top-level route in another module could silently shadow one of these. Add explicit base prefixes (e.g. `@Controller('settings')`, `@Controller('legacy')`).

6. **`return { ok: true }` / `return { success: true }` on POST endpoints without a visible service call** (8 endpoints across `cc-notification-prefs:39`, `finance-cfo-config:37`, `ideal-rasm:32`, `lms-core:129`, `mm-dashboard:251`, `warehouse-rental:119`, `wms-inventory:51`, `wms-stock:52`). These look like one-liner stubs — verify whether the underlying service is being called via destructuring or whether the handler is genuinely fake.

### P2

7. **`POST/PATCH /mm/purchase-orders` silences errors** (`mm-purchase-orders.controller.ts:64, 90`): `} catch (_e) { return []; }`. Errors disappear from the client; the user sees an empty list and the server logs may or may not record the underlying failure. Remove the try/catch or rethrow.

8. **`/hr-v2` namespace gap** — the FE calls 17 `/hr-v2/*` paths, the BE exposes 29 `/hr-v2/*` paths, and **the two sets don't intersect** (every FE `/hr-v2` call is in §8's 404 list, every BE `/hr-v2` route is in §9's orphan list). A v2 redesign was planned, both sides drifted independently. Pick one direction and align.

9. **Round-1 inaccuracies, for the record:**
   - `POST /finance/invoices/create` no longer uses `Math.random()` — it writes to the DB and returns the row id (`finance-invoices.controller.ts:97-119`). Already fixed.
   - `GET /mes/orders|shifts|maintenance` do call the service now (`mes-shifts-stats.controller.ts:162-199`). Already fixed.
   - `return {}` after `await svc.softDelete(...)` is the conventional empty-200 DELETE response, not a fake handler. Several round-1 P2 entries (`sd-customers`, `mm-goods`, `mm-vendors-pr`, `kanban-boards`) fall into this category and should be removed from the "fake responses" list.
   - The 15 HR-stub-shadows-real claim is incorrect at runtime — both stub controllers are commented out in `hr.providers.ts`. The route declarations exist in the source files but never reach Nest's router.
   - `kanban-ext.controller.ts` is a re-export barrel (lines 1-10), not a dead `@Controller()` with zero methods. Not orphan.

### P3

10. **Marketing analytics stubs** (`marketing-analytics-stubs.controller.ts`, 57 routes returning 501): this is correct behaviour per project rule P3-26 for endpoints whose service layer doesn't exist yet. Document the timeline for implementing them or downgrade the API tags to `Beta`.

11. **Three frontend `lib/api/*.ts` helper files (`hr.ts`, `misc.ts`, `misc-b.ts`, `lms.ts`)** define entire API surfaces for namespaces that don't exist on the backend (`/hr/discipline/*`, `/hr/gamification/*`, `/core/*`, `/seven-functions/*`, `/questionnaire/*`, `/adaptation/*`, `/hr-v2/*`). Audit which UI components import these helpers; the unused ones are dead code that can be deleted, the used ones are live bugs that need backend work.

12. **The OpenAPI/Orval client** (`lib/api-client-react/src/generated/api.ts` per round 1) covers an unknown subset of the 2,886 live routes. Generate coverage stats: of the 1,581 GETs, how many appear in the generated client? Routes not in the client are necessarily called via raw `apiRequest()` / `fetch()` with hand-written paths — exactly the pattern that produced the 185 404 candidates in §8.

---

### Key counts at a glance

| Metric | Value |
|---|---|
| Live route declarations | 2,886 |
| Total route declarations (including 56 in dead files) | 2,942 |
| Cross-file duplicate (method, path) pairs (raw) | 30 |
| Cross-file duplicate pairs (after dead-code filter) | 0 |
| Bare `@Controller()` declarations | 11 (8 live + 3 dead) |
| Routes returning HTTP 501 via `notImplemented()` (live) | 190 |
| Routes hardcoding empty/null payloads (live, fake) | ~30 (25 of them in `hr-dashboard.controller.ts`) |
| Frontend → backend 404 candidates | 185 (drawn from 2,066 FE files, 3,956 call sites) |
| Backend orphan routes (no FE consumer found) | 999 |
| Controllers entirely unused (not in any module providers list) | 7 files / 56 routes |

---

## Appendix A — Full list of 185 FE 404 candidates (alphabetical)

Format: `count · METHOD · path · first observed FE source`

| ct | M | path | FE source |
|---|---|---|---|
| 1 | POST | `/accounting/gl-documents/:var/post` | `artifacts/erp-dashboard/src/components/finance/GLDocumentsTab.tsx:81` |
| 1 | POST | `/adaptation/feedback` | `artifacts/erp-dashboard/src/pages/adaptation/FeedbackTab.tsx:113` |
| 2 | PUT | `/adaptation/feedback/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:234` |
| 2 | GET | `/adaptation/feedback` | `artifacts/erp-dashboard/src/pages/adaptation/FeedbackTab.tsx:115` |
| 1 | POST | `/adaptation/new-employees` | `artifacts/erp-dashboard/src/pages/adaptation/NewEmployeesTab.tsx:104` |
| 1 | PATCH | `/adaptation/new-employees/:var` | `artifacts/erp-dashboard/src/pages/adaptation/NewEmployeesTab.tsx:118` |
| 2 | GET | `/adaptation/new-employees` | `artifacts/erp-dashboard/src/pages/adaptation/NewEmployeesTab.tsx:106` |
| 1 | POST | `/adaptation/programs` | `artifacts/erp-dashboard/src/pages/adaptation/ProgramsTab.tsx:53` |
| 1 | DELETE | `/adaptation/programs/:var` | `artifacts/erp-dashboard/src/pages/adaptation/ProgramsTab.tsx:87` |
| 2 | PUT | `/adaptation/programs/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:232` |
| 3 | GET | `/adaptation/programs` | `artifacts/erp-dashboard/src/pages/adaptation/ProgramsTab.tsx:55` |
| 1 | POST | `/adaptation/welcome-events` | `artifacts/erp-dashboard/src/pages/adaptation/WelcomeEventsTab.tsx:85` |
| 1 | PATCH | `/adaptation/welcome-events/:var` | `artifacts/erp-dashboard/src/pages/adaptation/WelcomeEventsTab.tsx:99` |
| 2 | GET | `/adaptation/welcome-events` | `artifacts/erp-dashboard/src/pages/adaptation/WelcomeEventsTab.tsx:87` |
| 1 | GET | `/agents/crm/churn` | `artifacts/erp-dashboard/src/components/crm/CustomerCard.tsx:33` |
| 1 | GET | `/agents/crm/customer360` | `artifacts/erp-dashboard/src/components/crm/CustomerCard.tsx:28` |
| 1 | GET | `/assignments` | `artifacts/erp-dashboard/src/pages/EmployeeStats.tsx:63` |
| 1 | PUT | `/camera-alerts` | `artifacts/erp-dashboard/src/lib/api/camera.ts:26` |
| 1 | POST | `/camera-alerts/analyze-by-missions` | `artifacts/erp-dashboard/src/lib/api/camera.ts:10` |
| 1 | POST | `/camera-heatmap/generate-excel` | `artifacts/erp-dashboard/src/lib/api/camera.ts:16` |
| 1 | POST | `/camera-heatmap/generate-pdf` | `artifacts/erp-dashboard/src/lib/api/camera.ts:18` |
| 1 | GET | `/camera-reports/:var` | `artifacts/erp-dashboard/src/pages/camera-reports-types.ts:84` |
| 1 | POST | `/camera-settings` | `artifacts/erp-dashboard/src/pages/camera-settings.tsx:68` |
| 1 | DELETE | `/cameras/:var` | `artifacts/erp-dashboard/src/pages/cameras-management.tsx:112` |
| 1 | POST | `/cameras` | `artifacts/erp-dashboard/src/pages/cameras-management.tsx:77` |
| 1 | DELETE | `/certificates/:var` | `artifacts/erp-dashboard/src/pages/Certificates.tsx:69` |
| 1 | PATCH | `/chat/admin/rooms/:var/archive` | `artifacts/erp-dashboard/src/pages/chat/ChatAdminPage.tsx:55` |
| 1 | DELETE | `/chat/messages/:var/pin` | `artifacts/erp-dashboard/src/components/chat/page/PinnedMessages.tsx:49` |
| 1 | PATCH | `/chat/rooms/:var` | `artifacts/erp-dashboard/src/components/chat/page/RoomSettingsModal.tsx:74` |
| 2 | POST | `/core/departments` | `artifacts/erp-dashboard/src/lib/api/misc.ts:36` |
| 2 | DELETE | `/core/departments/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:40` |
| 1 | PUT | `/core/departments/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:38` |
| 3 | GET | `/core/departments` | `artifacts/erp-dashboard/src/pages/OrgDepartmentsPage.tsx:49` |
| 1 | POST | `/core/positions` | `artifacts/erp-dashboard/src/lib/api/misc.ts:42` |
| 1 | DELETE | `/core/positions/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:46` |
| 1 | PUT | `/core/positions/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:44` |
| 1 | POST | `/crm/ai/churn` | `artifacts/erp-dashboard/src/lib/api/api-coverage.ts:35` |
| 1 | POST | `/crm/ai/extended/auto-tasks/create` | `artifacts/erp-dashboard/src/lib/api/ai.ts:78` |
| 1 | POST | `/crm/ai/extended/chat/respond` | `artifacts/erp-dashboard/src/lib/api/ai.ts:74` |
| 1 | POST | `/crm/ai/extended/churn/analyze` | `artifacts/erp-dashboard/src/lib/api/ai.ts:80` |
| 1 | POST | `/crm/ai/extended/voice/analyze-call` | `artifacts/erp-dashboard/src/lib/api/ai.ts:82` |
| 1 | POST | `/crm/ai/voice` | `artifacts/erp-dashboard/src/lib/api/api-coverage.ts:37` |
| 1 | PATCH | `/crm/activities/:var/done` | `artifacts/erp-dashboard/src/hooks/use-crm.ts:126` |
| 1 | GET | `/crm/custom-fields/:var` | `artifacts/erp-dashboard/src/pages/CRMSettings.tsx:47` |
| 1 | PATCH | `/crm/deals/close` | `artifacts/erp-dashboard/src/pages/CrmFunnelAnalytics.tsx:215` |
| 1 | POST | `/crm/deals/:var/stage` | `artifacts/erp-dashboard/src/lib/api/api-coverage.ts:31` |
| 1 | GET | `/employee-kpi/department-summary` | `artifacts/erp-dashboard/src/lib/api/api-coverage.ts:58` |
| 1 | GET | `/employee-kpi/top-performers` | `artifacts/erp-dashboard/src/lib/api/api-coverage.ts:56` |
| 1 | POST | `/employees/:var/files` | `artifacts/erp-dashboard/src/pages/employee-profile/DocumentsTabDialogs.tsx:69` |
| 1 | GET | `/equipment:var` | `artifacts/erp-dashboard/src/lib/api/pp.ts:46` (template-literal artefact) |
| 1 | GET | `/fi/gl-entries` | `artifacts/erp-dashboard/src/lib/api/api-coverage.ts:242` |
| 1 | GET | `/forecasts` | `artifacts/erp-dashboard/src/pages/ForecastAnalytics.tsx:97` |
| 1 | POST | `/forecasts/run` | `artifacts/erp-dashboard/src/pages/ForecastAnalytics.tsx:95` |
| 1 | PATCH | `/goals/:var` | `artifacts/erp-dashboard/src/pages/GoalsKPI.tsx:77` |
| 1 | GET | `/hr-v2/daily-reports` | `artifacts/erp-dashboard/src/pages/DailyReportPage.tsx:70` |
| 2 | GET | `/hr-v2/daily-reports/department` | `artifacts/erp-dashboard/src/pages/DailyReportPage.tsx:64` |
| 1 | POST | `/hr-v2/documents` | `artifacts/erp-dashboard/src/lib/api/hr.ts:123` |
| 1 | GET | `/hr-v2/documents/employee` | `artifacts/erp-dashboard/src/pages/employee-profile/DocumentsTab.tsx:57` |
| 1 | GET | `/hr-v2/documents/employee/:var` | `artifacts/erp-dashboard/src/pages/employee-profile/DocumentsTab.tsx:60` |
| 1 | PATCH | `/hr-v2/documents/steps/:var/approve` | `artifacts/erp-dashboard/src/lib/api/hr.ts:127` |
| 1 | PATCH | `/hr-v2/documents/steps/:var/reject` | `artifacts/erp-dashboard/src/lib/api/hr.ts:129` |
| 1 | PATCH | `/hr-v2/documents/:var/submit` | `artifacts/erp-dashboard/src/lib/api/hr.ts:125` |
| 1 | POST | `/hr-v2/enps` | `artifacts/erp-dashboard/src/lib/api/hr.ts:132` |
| 1 | PATCH | `/hr-v2/enps/:var/close` | `artifacts/erp-dashboard/src/lib/api/hr.ts:136` |
| 1 | PATCH | `/hr-v2/enps/:var/launch` | `artifacts/erp-dashboard/src/lib/api/hr.ts:138` |
| 1 | POST | `/hr-v2/enps/respond` | `artifacts/erp-dashboard/src/lib/api/hr.ts:134` |
| 2 | GET | `/hr-v2/enps` | `artifacts/erp-dashboard/src/pages/HRDashboard.tsx:90` |
| 1 | POST | `/hr-v2/pip` | `artifacts/erp-dashboard/src/lib/api/hr.ts:141` |
| 1 | PATCH | `/hr-v2/pip/:var/acknowledge` | `artifacts/erp-dashboard/src/lib/api/hr.ts:145` |
| 1 | POST | `/hr-v2/pip/:var/progress` | `artifacts/erp-dashboard/src/lib/api/hr.ts:143` |
| 2 | GET | `/hr-v2/pip` | `artifacts/erp-dashboard/src/pages/HRDashboard.tsx:84` |
| 1 | PATCH | `/hr/adaptation/:var` | `artifacts/erp-dashboard/src/pages/employee-profile/AdaptationTab.tsx:80` |
| 2 | GET | `/hr/attendance/abc-results` | `artifacts/erp-dashboard/src/hooks/use-hr-attendance.ts:45` |
| 1 | POST | `/hr/abc-analysis/:var/calculate` | `artifacts/erp-dashboard/src/pages/EmployeeStats.tsx:121` |
| 1 | GET | `/hr/attendance/late-employees` | `artifacts/erp-dashboard/src/hooks/use-hr-attendance.ts:60` |
| 1 | GET | `/hr/attendance/monthly-report` | `artifacts/erp-dashboard/src/hooks/use-hr-attendance.ts:68` |
| 1 | GET | `/hr/attendance/summary` | `artifacts/erp-dashboard/src/hooks/use-hr-attendance.ts:22` |
| 1 | POST | `/hr/discipline` | `artifacts/erp-dashboard/src/lib/api/hr.ts:39` |
| 1 | PATCH | `/hr/discipline/:var/acknowledge` | `artifacts/erp-dashboard/src/lib/api/hr.ts:43` |
| 1 | PATCH | `/hr/discipline/:var/approve` | `artifacts/erp-dashboard/src/lib/api/hr.ts:41` |
| 1 | POST | `/hr/discipline/absence/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:47` |
| 1 | PATCH | `/hr/discipline/absence/:var/excuse` | `artifacts/erp-dashboard/src/lib/api/hr.ts:49` |
| 1 | POST | `/hr/discipline/block/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:45` |
| 1 | GET | `/hr/discipline/blocked` | `artifacts/erp-dashboard/src/pages/HRDashboard.tsx:81` |
| 1 | POST | `/hr/discipline/catalog` | `artifacts/erp-dashboard/src/lib/api/hr.ts:33` |
| 1 | DELETE | `/hr/discipline/catalog/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:37` |
| 1 | PUT | `/hr/discipline/catalog/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:35` |
| 1 | PATCH | `/hr/discipline/unblock/:var` | `artifacts/erp-dashboard/src/lib/api/hr.ts:51` |
| 1 | GET | `/hr/document-workflow/rules` | `artifacts/erp-dashboard/src/pages/DocumentRoutingAdmin.tsx:47` |
| 1 | PATCH | `/hr/employee-corp/:var` | `artifacts/erp-dashboard/src/pages/employee-profile/CorporateInfoCard.tsx:50` |
| 2 | GET | `/hr/employee-corp/:var` | `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx:276` |
| 1 | POST | `/hr/employees/:var/documents` | `artifacts/erp-dashboard/src/pages/employee-profile/DocumentsTabDialogs.tsx:196` |
| 1 | POST | `/hr/gamification/badges/catalog` | `artifacts/erp-dashboard/src/lib/api/hr.ts:78` |
| 1 | GET | `/hr/gamification/leaderboard` | `artifacts/erp-dashboard/src/pages/HRDashboard.tsx:87` |
| 2 | GET | `/hr/kpi/daily` | `artifacts/erp-dashboard/src/hooks/use-hr-kpi.ts:11` |
| 2 | GET | `/hr/kpi/goals` | `artifacts/erp-dashboard/src/hooks/use-hr-kpi.ts:26` |
| 1 | GET | `/hr/kpi/productivity` | `artifacts/erp-dashboard/src/hooks/use-hr-kpi.ts:56` |
| 2 | GET | `/hr/kpi/ratings` | `artifacts/erp-dashboard/src/hooks/use-hr-kpi.ts:41` |
| 1 | GET | `/hr/leave/balances` | `artifacts/erp-dashboard/src/hooks/use-hr-leave.ts:49` |
| 4 | GET | `/hr/leave/requests` | `artifacts/erp-dashboard/src/hooks/use-hr-leave.ts:18` |
| 1 | GET | `/hr/leave/types` | `artifacts/erp-dashboard/src/hooks/use-hr-leave.ts:11` |
| 2 | GET | `/hr/payroll/bonuses` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:72` |
| 1 | GET | `/hr/payroll/deductions` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:102` |
| 2 | GET | `/hr/payroll/fines` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:87` |
| 2 | GET | `/hr/payroll/overtime` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:57` |
| 3 | GET | `/hr/payroll/periods` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:11` |
| 1 | GET | `/hr/payroll/salary-history` | `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts:50` |
| 1 | POST | `/hr/question-bank` | `artifacts/erp-dashboard/src/pages/HRQuestionBankAdmin.tsx:50` |
| 1 | DELETE | `/hr/question-bank/:var` | `artifacts/erp-dashboard/src/pages/HRQuestionBankAdmin.tsx:61` |
| 1 | PATCH | `/hr/question-bank/:var` | `artifacts/erp-dashboard/src/pages/HRQuestionBankAdmin.tsx:56` |
| 4 | GET | `/hr/question-bank` | `artifacts/erp-dashboard/src/pages/HRQuestionBankAdmin.tsx:44` |
| 3 | GET | `/hr/recruitment/candidates` | `artifacts/erp-dashboard/src/hooks/use-hr-recruitment.ts:34` |
| 2 | GET | `/hr/recruitment/interviews` | `artifacts/erp-dashboard/src/hooks/use-hr-recruitment.ts:57` |
| 1 | GET | `/hr/safety/export/pdf` | `artifacts/erp-dashboard/src/pages/HRSafety.tsx:138` |
| 1 | DELETE | `/hr/skills/:var` | `artifacts/erp-dashboard/src/pages/SkillsMatrix.tsx:57` |
| 1 | PATCH | `/hr/skills/:var` | `artifacts/erp-dashboard/src/pages/SkillsMatrix.tsx:51` |
| 1 | GET | `/hr/zno:var` | `artifacts/erp-dashboard/src/pages/HRZnoPage.tsx:67` (template-literal artefact) |
| 1 | GET | `/hr/zvs:var` | `artifacts/erp-dashboard/src/pages/HRZvsPage.tsx:39` (template-literal artefact) |
| 1 | PUT | `/integration/mro/:var/approve` | `artifacts/erp-dashboard/src/lib/api/operations.ts:35` |
| 1 | GET | `/kanban/flows` | `artifacts/erp-dashboard/src/pages/kanban/FlowsDialog.tsx:44` |
| 1 | GET | `/kanban/reports` | `artifacts/erp-dashboard/src/pages/kanban/ReportsDialog.tsx:78` |
| 1 | GET | `/kanban/resource-allocation` | `artifacts/erp-dashboard/src/pages/kanban/ResourceAllocationView.tsx:18` |
| 2 | PATCH | `/lms/lessons/:var` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:17` |
| 2 | POST | `/marketing` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:47` |
| 1 | DELETE | `/marketing/:var` | `artifacts/erp-dashboard/src/lib/api/crm.ts:104` |
| 2 | PATCH | `/marketing/:var` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:49` |
| 2 | POST | `/marketing/:var/launch` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:51` |
| 1 | POST | `/marketing/ai-assistant` | `artifacts/erp-dashboard/src/pages/MarketingDashboardPanels.tsx:25` |
| 1 | DELETE | `/marketing/budget/:var` | `artifacts/erp-dashboard/src/pages/MarketingBudget.tsx:49` |
| 1 | DELETE | `/marketing/calendar/:var` | `artifacts/erp-dashboard/src/pages/MarketingCalendar.tsx:56` |
| 1 | PATCH | `/marketing/calendar/:var` | `artifacts/erp-dashboard/src/pages/MarketingCalendar.tsx:65` |
| 1 | DELETE | `/marketing/exhibitions/:var` | `artifacts/erp-dashboard/src/pages/MarketingExhibitions.tsx:93` |
| 1 | PATCH | `/marketing/exhibitions/:var` | `artifacts/erp-dashboard/src/pages/MarketingExhibitions.tsx:88` |
| 1 | POST | `/marketing/nps` | `artifacts/erp-dashboard/src/pages/MarketingDashboardDialogs.tsx:33` |
| 1 | DELETE | `/marketing/pr/:var` | `artifacts/erp-dashboard/src/pages/MarketingPR.tsx:50` |
| 1 | PATCH | `/marketing/pr/:var` | `artifacts/erp-dashboard/src/pages/MarketingPR.tsx:45` |
| 1 | POST | `/material-balance/movements` | `artifacts/erp-dashboard/src/pages/MaterialBalance.tsx:94` |
| 1 | POST | `/mes/sessions/start` | `artifacts/erp-dashboard/src/hooks/use-mes.ts:91` |
| 1 | POST | `/micro-modules` | `artifacts/erp-dashboard/src/pages/lms-extended/MicroLearningTab.tsx:30` |
| 1 | POST | `/mm/vendor-performance` | `artifacts/erp-dashboard/src/pages/VendorPerformance.tsx:50` |
| 1 | DELETE | `/modules/:var` | `artifacts/erp-dashboard/src/pages/CourseDetail.tsx:70` |
| 1 | GET | `/order-status/log` | `artifacts/erp-dashboard/src/pages/OrderStatusPage.tsx:86` |
| 2 | POST | `/order-status/:var/machine-breakdown` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:123` |
| 1 | GET | `/org-structure/departments` | `artifacts/erp-dashboard/src/pages/DocumentRoutingAdmin.tsx:57` |
| 3 | GET | `/org-structure/functions` | `artifacts/erp-dashboard/src/pages/DocumentRoutingAdmin.tsx:52` |
| 1 | POST | `/org-structure/position-folder` | `artifacts/erp-dashboard/src/pages/PositionFolderPage.tsx:53` |
| 1 | DELETE | `/org-structure/position-folder/:var` | `artifacts/erp-dashboard/src/pages/PositionFolderPage.tsx:64` |
| 1 | PATCH | `/org-structure/position-folder/:var` | `artifacts/erp-dashboard/src/pages/PositionFolderPage.tsx:59` |
| 4 | GET | `/org-structure/position-folder` | `artifacts/erp-dashboard/src/pages/PositionFolderPage.tsx:47` |
| 1 | POST | `/pos/barcodes` | `artifacts/erp-dashboard/src/lib/api/pos.ts:78` |
| 1 | POST | `/pos/movement-types` | `artifacts/erp-dashboard/src/lib/api/pos.ts:61` |
| 1 | POST | `/pos/movements/:var/lines` | `artifacts/erp-dashboard/src/lib/api/pos.ts:47` |
| 1 | PUT | `/pos/movements/:var/status` | `artifacts/erp-dashboard/src/lib/api/pos.ts:49` |
| 1 | POST | `/pos/passports` | `artifacts/erp-dashboard/src/lib/api/pos.ts:76` |
| 1 | POST | `/pos/pdf-templates` | `artifacts/erp-dashboard/src/lib/api/pos.ts:80` |
| 1 | POST | `/pos/sync/:var` | `artifacts/erp-dashboard/src/pages/PosSyncPage.tsx:56` |
| 1 | POST | `/pos/sync/all` | `artifacts/erp-dashboard/src/pages/PosSyncPage.tsx:44` |
| 1 | DELETE | `/pos/warehouse-access/:var/:var` | `artifacts/erp-dashboard/src/lib/api/pos.ts:66` |
| 1 | POST | `/pos/warehouse-access` | `artifacts/erp-dashboard/src/lib/api/pos.ts:64` |
| 2 | GET | `/progress/summary` | `artifacts/erp-dashboard/src/pages/ProgressPage.tsx:40` |
| 1 | POST | `/questionnaire` | `artifacts/erp-dashboard/src/lib/api/lms.ts:32` |
| 1 | DELETE | `/questionnaire/:var` | `artifacts/erp-dashboard/src/lib/api/lms.ts:36` |
| 1 | PUT | `/questionnaire/:var` | `artifacts/erp-dashboard/src/lib/api/lms.ts:34` |
| 1 | PUT | `/questionnaire/questions/:var` | `artifacts/erp-dashboard/src/lib/api/lms.ts:28` |
| 1 | POST | `/questionnaire/responses` | `artifacts/erp-dashboard/src/lib/api/lms.ts:30` |
| 2 | GET | `/reports-hub` | `artifacts/erp-dashboard/src/pages/ReportsHub.tsx:77` |
| 1 | PUT | `/sd/payments/:var` | `artifacts/erp-dashboard/src/components/sd/europrint/PaymentsTab.tsx:58` |
| 1 | GET | `/sd/quotations/:var` | `artifacts/erp-dashboard/src/pages/SDQuotations.tsx:92` |
| 1 | POST | `/security/incidents` | `artifacts/erp-dashboard/src/pages/SecurityDashboard.tsx:136` |
| 1 | POST | `/security/ppe-checks` | `artifacts/erp-dashboard/src/pages/SecurityDashboard.tsx:148` |
| 2 | POST | `/security/visitors` | `artifacts/erp-dashboard/src/pages/SecurityDashboard.tsx:114` |
| 1 | POST | `/seven-functions/analyze` | `artifacts/erp-dashboard/src/lib/api/misc.ts:65` |
| 1 | POST | `/seven-functions/functions` | `artifacts/erp-dashboard/src/lib/api/misc.ts:53` |
| 1 | DELETE | `/seven-functions/functions/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:57` |
| 1 | PUT | `/seven-functions/functions/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:55` |
| 1 | POST | `/seven-functions/kpis` | `artifacts/erp-dashboard/src/lib/api/misc.ts:59` |
| 1 | DELETE | `/seven-functions/kpis/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:63` |
| 1 | PUT | `/seven-functions/kpis/:var` | `artifacts/erp-dashboard/src/lib/api/misc.ts:61` |
| 1 | GET | `/supply-chain` | `artifacts/erp-dashboard/src/pages/SupplyChainDashboard.tsx:27` |
| 2 | PUT | `/system` | `artifacts/erp-dashboard/src/lib/api/misc-b.ts:151` |
| 1 | POST | `/warehouse/materials` | `artifacts/erp-dashboard/src/pages/MaterialCardsPage.tsx:49` |
| 1 | POST | `/warehouse/movements` | `artifacts/erp-dashboard/src/pages/MaterialsAccounting.tsx:34` |
| 1 | DELETE | `/warehouses/:var` | `artifacts/erp-dashboard/src/lib/api/wms.ts:98` |
| 1 | POST | `/warehouses/notify-vacancies` | `artifacts/erp-dashboard/src/lib/api/wms.ts:42` |
| 1 | GET | `/wms/stock/fefo` | `artifacts/erp-dashboard/src/hooks/use-wms.ts:107` |

The three `:var`-prefixed paths (`/equipment:var`, `/hr/zno:var`, `/hr/zvs:var`) are extraction artefacts where the FE source used a template literal like `/api/equipment${id ? '/' + id : ''}` — the `${…}` was normalised to `:var` but the surrounding slash was already consumed. They almost certainly correspond to real backend routes (`/equipment/:id`, `/hr/zno/:id`, `/hr/zvs/:id`) that the diff failed to match. The remaining 182 are genuine 404 candidates.

---

## Appendix B — Orphan backend routes sampled by segment

### `/hr` (115 orphans — first 10)

```
DELETE /hr/leave/:var                       modules/hr/presentation/hr-leave.controller.ts:165
GET    /hr/360/dept-summary                 modules/hr/presentation/hr-compat-a.controller.ts:90
GET    /hr/360/review                       modules/hr/presentation/hr-compat-a.controller.ts:71
GET    /hr/360/reviewable                   modules/hr/presentation/hr-dashboard.controller.ts:182
GET    /hr/abc-analysis/:var/calculate      modules/hr/presentation/hr-dashboard.controller.ts:244
GET    /hr/adaptation/:var                  modules/hr/presentation/hr-dashboard.controller.ts:111
GET    /hr/ai-interview/session/:var/review modules/hr/presentation/hr-dashboard.controller.ts:209
GET    /hr/alumni/:var                      modules/hr/presentation/hr-dashboard.controller.ts:121
GET    /hr/attendance/:var/summary/:var     modules/hr/presentation/hr-attendance.controller.ts:62
GET    /hr/attendance/face/health           modules/hr/attendance/attendance-face.controller.ts:151
```

### `/pos` (80 orphans — first 10)

```
DELETE /pos/wh-features/employees/:var       modules/pos/presentation/warehouse-features.controller.ts:93
GET    /pos/auth/ping                        modules/pos/presentation/pos-auth.controller.ts:70
GET    /pos/barcode/ai-suggestion/pending    modules/pos/presentation/barcode.controller.ts:92
GET    /pos/employees/:var/balance           modules/pos/presentation/employee.controller.ts:54
GET    /pos/employees/:var/hr-check          modules/pos/presentation/employee.controller.ts:226
GET    /pos/employees/:var/statement         modules/pos/presentation/employee.controller.ts:90
GET    /pos/employees/department/:var/balance modules/pos/presentation/employee.controller.ts:81
GET    /pos/employees/me/balance             modules/pos/presentation/employee.controller.ts:69
GET    /pos/employees/me/checklist           modules/pos/presentation/employee.controller.ts:198
GET    /pos/employees/me/inventory           modules/pos/presentation/employee.controller.ts:189
```

### `/crm` (38 orphans — first 10)

```
DELETE /crm/deals/:var                       modules/crm/presentation/crm-deals.controller.ts:177
GET    /crm                                  modules/crm/presentation/crm-extras.controller.ts:148
GET    /crm/activities/:var                  modules/crm/presentation/crm-activities.controller.ts:68
GET    /crm/activities/today                 modules/crm/presentation/crm-activities.controller.ts:60
GET    /crm/ai/autofill/:var/:var            modules/crm/presentation/crm-ai-extended.controller.ts:91
GET    /crm/ai/churn-rescue/:var/:var        modules/crm/presentation/crm-ai-extended.controller.ts:99
GET    /crm/ai/extended/auto-tasks/suggest   modules/crm/presentation/crm-ai-extended.controller.ts:106
GET    /crm/ai/extended/insights             modules/compatibility/crm-extended.controller.ts:89
GET    /crm/ai/leads                         modules/crm/presentation/crm-ai-extended.controller.ts:122
GET    /crm/ai/nba                           modules/crm/presentation/crm-ai-extended.controller.ts:129
```

### `/legacy` (37 orphans — first 10)

```
DELETE /legacy/fi/cost-centers/:var          modules/remaining/fi.controller.ts:87
DELETE /legacy/fi/profit-centers/:var        modules/remaining/fi.controller.ts:119
DELETE /legacy/pos/warehouse-access/:var/:var modules/pos/presentation/pos.controller.ts:81
GET    /legacy/fi/cost-centers               modules/remaining/fi.controller.ts:48
GET    /legacy/fi/cost-centers/:var          modules/remaining/fi.controller.ts:67
GET    /legacy/fi/cost-centers/v2            modules/remaining/fi.controller.ts:57
GET    /legacy/fi/gl-documents               modules/remaining/fi.controller.ts:126
GET    /legacy/fi/gl-entries                 modules/remaining/fi.controller.ts:139
GET    /legacy/fi/invoices                   modules/remaining/fi.controller.ts:144
GET    /legacy/fi/invoices/v2                modules/remaining/fi.controller.ts:156
```

### `/marketing` (36 orphans — first 10)

```
DELETE /marketing/settings/social-api/:var   modules/marketing/presentation/marketing-analytics-stubs.controller.ts:133
GET    /marketing                            modules/marketing/presentation/marketing-analytics-stubs.controller.ts:153
GET    /marketing/ai-assistant               modules/marketing/presentation/marketing-analytics-stubs.controller.ts:54
GET    /marketing/analytics/audience         modules/marketing/presentation/marketing-analytics.controller.ts:181
GET    /marketing/analytics/campaigns        modules/marketing/presentation/marketing-analytics.controller.ts:175
GET    /marketing/analytics/conversion       modules/marketing/presentation/marketing-analytics.controller.ts:187
GET    /marketing/analytics/overview         modules/marketing/presentation/marketing-analytics.controller.ts:169
GET    /marketing/budget/:var                modules/marketing/presentation/marketing-analytics-stubs.controller.ts:97
GET    /marketing/calendar/:var              modules/marketing/presentation/marketing-analytics-stubs.controller.ts:104
GET    /marketing/campaigns/:var             modules/marketing/presentation/marketing.controller.ts:85
```

### `/agents` (29 orphans — first 10)

```
GET /agents/crm/churn/:var          modules/agents/agents.controller.ts:92
GET /agents/crm/customer360/:var    modules/agents/agents.controller.ts:91
GET /agents/crm/score-leads         modules/agents/agents.controller.ts:89
GET /agents/finance/cashflow        modules/agents/agents.controller.ts:117
GET /agents/finance/fraud           modules/agents/agents.controller.ts:119
GET /agents/finance/overdue         modules/agents/agents.controller.ts:118
GET /agents/hr/bonus/:var           modules/agents/agents.controller.ts:138
GET /agents/hr/churn/:var           modules/agents/agents.controller.ts:129
GET /agents/hr/performance/:var     modules/agents/agents.controller.ts:127
GET /agents/inventory/abc           modules/agents/agents.controller.ts:103
```

### `/hr-v2` (29 orphans — first 10)

```
GET /hr-v2/ai-interview/questions/for-job    modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:166
GET /hr-v2/ai-interview/sessions             modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:71
GET /hr-v2/ai-interview/stats                modules/hr/ai-interview-v2/ai-interview-v2.controller.ts:78
GET /hr-v2/career-path                       modules/hr/career-path/career-path.controller.ts:56
GET /hr-v2/career-path/department/:var/ladder modules/hr/career-path/career-path.controller.ts:80
GET /hr-v2/career-path/employee/:var         modules/hr/career-path/career-path.controller.ts:88
GET /hr-v2/chat/messages/:var/thread         modules/chat/chat-advanced-uploads.controller.ts:48
GET /hr-v2/chat/rooms/:var/pinned            modules/chat/chat-advanced.controller.ts:49
GET /hr-v2/daily-reports/employee/:var       modules/hr/daily-report/daily-report.controller.ts:111
GET /hr-v2/reception                         modules/hr/reception/reception.controller.ts:52
```

The `/hr-v2` orphans show that an entire v2 module tree exists in the backend (`ai-interview-v2`, `career-path`, `daily-report`, `reception`) — none of it is wired to FE pages. The FE attempts to call different `/hr-v2` paths (see Appendix A) that no backend handler answers. Two parallel-but-disjoint implementations.

### `/kanban` (27 orphans — first 10)

```
GET /kanban/:var                           modules/kanban/presentation/kanban.controller.ts:80
GET /kanban/analytics/summary              modules/kanban/presentation/kanban-reports.controller.ts:70
GET /kanban/boards/:var                    modules/kanban/presentation/kanban-boards.controller.ts:63
GET /kanban/boards/:var/cards              modules/kanban/presentation/kanban-cards.controller.ts:77
GET /kanban/boards/:var/flows              modules/kanban/presentation/kanban-core.controller.ts:46
GET /kanban/boards/:var/robots             modules/kanban/presentation/kanban-boards.controller.ts:275
GET /kanban/cards/:var/chat                modules/kanban/presentation/kanban-cards.controller.ts:159
GET /kanban/cards/:var/checklists          modules/kanban/presentation/kanban-checklist.controller.ts:37
GET /kanban/cards/:var/co-executors        modules/kanban/presentation/kanban-cards.controller.ts:246
GET /kanban/cards/:var/comments            modules/kanban/presentation/kanban-checklist.controller.ts:107
```

### `/finance` (26 orphans — first 10)

```
GET /finance/accounting             modules/finance/presentation/finance-main.controller.ts:157
GET /finance/accounts               modules/finance/presentation/finance-main.controller.ts:111
GET /finance/advances               modules/finance/presentation/finance-advance.controller.ts:45
GET /finance/advances/pending       modules/finance/presentation/finance-advance.controller.ts:84
GET /finance/budget                 modules/finance/presentation/finance-main.controller.ts:89
GET /finance/budgets/:var           modules/finance/presentation/finance-budgets.controller.ts:75
GET /finance/budgets/:var/variance  modules/finance/presentation/finance-budgets.controller.ts:87
GET /finance/budgets/stats          modules/finance/presentation/finance-budgets.controller.ts:63
GET /finance/expense-reports        modules/finance/presentation/finance-main.controller.ts:129
GET /finance/expense-reports/:var   modules/finance/presentation/finance-main.controller.ts:141
```

---

## Appendix C — Verb breakdown by top module (live routes)

| Module | GET | POST | PUT | PATCH | DELETE | Total |
|---|---|---|---|---|---|---|
| hr | 213 | 84 | 4 | 28 | 15 | 344 |
| compatibility | 224 | 58 | 32 | 19 | 7 | 340 |
| finance | 107 | 47 | 1 | 14 | 7 | 176 |
| wms | 96 | 39 | 3 | 12 | 7 | 157 |
| pos | 75 | 52 | 9 | 8 | 5 | 149 |
| iot | 70 | 39 | 9 | 16 | 3 | 137 |
| crm | 60 | 31 | 0 | 20 | 9 | 120 |
| remaining | 64 | 30 | 5 | 11 | 6 | 116 |
| director | 70 | 28 | 0 | 5 | 2 | 105 |
| marketing | 63 | 22 | 4 | 4 | 6 | 99 |

(Counts derived from the Python walk; numbers may drift by ±1 when controllers declare multiple methods on the same handler.)

---

## Appendix D — Method to reproduce

```bash
# from repo root (apps/api/src)
# Step 1 — total routes via grep (controllers only)
grep -rE "@(Get|Post|Put|Patch|Delete)\(" --include="*.controller.ts" apps/api/src | wc -l
# Output: 2917

# Step 2 — bare @Controller() instances
grep -rnE "^\s*@Controller\(\s*\)" --include="*.ts" apps/api/src
# Output: 11 instances (listed in §5)

# Step 3 — notImplemented usage in controllers
total=0; for f in $(grep -rln "notImplemented(" --include="*.controller.ts" apps/api/src); do
  c=$(grep -c "notImplemented(" "$f"); total=$((total+c));
done; echo $total
# Output: 225

# Step 4 — Python walk for accurate route extraction
# See /tmp/extract_routes.py used in this audit — walks every .controller.ts,
# attributes each @Method() decorator to its enclosing @Controller(prefix),
# emits (method, full_path, file, line) tuples.

# Step 5 — FE call extraction
# See /tmp/extract_fe_calls.py — walks artifacts/erp-dashboard/src,
# matches fetch(...), apiRequest('METHOD', '...'), api.method('...'),
# and useQuery({ queryKey: ['/api/...'] }).

# Step 6 — Dead-controller verification
# For each controller class name X, run:
grep -rE "\b${X}\b" --include="*.ts" apps/api/src
# If the only hit is the file that defines class X, the controller is unregistered.
```

End of report.
