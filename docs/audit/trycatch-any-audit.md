# try/catch SWALLOW + `any` Type Audit — EuroPrint ERP

**Date:** 2026-06-06
**Role:** ANALYST (read-only) — no code changed, no commit. This report only.
**Scope:** BE `apps/api/src` (NestJS) + FE `artifacts/erp-dashboard/src` (React). `*.spec.ts`/`*.test.*` excluded from counts.
**Method:** ripgrep counts + sample-reading actual catch bodies and `any` sites (not guessed).

---

## TL;DR

| | BE (`apps/api/src`) | FE (`erp-dashboard/src`) |
|---|---|---|
| try/catch blocks | **2,419** | **358** |
| — truly empty `catch {}` | **0** ✅ | **0** ✅ |
| — swallow → `[] / null / {}` | ~40 sites / ~25 files | ~30 files |
| — proper `Err()` / `throw` (Result pattern) | dominant (~460+ matched) | n/a (React Query `onError`) |
| explicit `any` types | **3** ✅ | **92** |
| tsconfig `strict` / `noImplicitAny` | **ON** ✅ | `noImplicitAny` ON, `strictNullChecks` ON |

**Headline:** The backend is in genuinely good shape — `strict: true`, only **3** `any`, **0** empty catches, and the money-critical write paths (GL posting, journal insert) correctly return `Err`. The real cleanup is two concentrated pockets, not a system-wide rot:

1. **`legacy-warehouse.helpers.ts`** — write helpers (`updatePapkaOrderRaw`, `createMachineTaskRaw`, `createPlanningOperationRaw`) swallow DB-write failures and `return null`. 🔴 stock/write danger.
2. **`shared-schema.ts`** (FE) — ~80 core domain types (incl. `GlDocument`, `SalesOrder`, `PurchaseOrder`, `Order`, `Product`, `RawMaterial`, `MaterialBalance`) are all aliased to `Record<string, any>`. 🔴 every money/stock object on the FE is untyped.

---

# ═══ PART 1 — try/catch SWALLOW audit ═══

## Counts

- **BE total try/catch:** 2,419 (non-spec)
- **FE total try/catch:** 358
- **Empty `catch {}` / `catch(e){}`:** **0** in BE, **0** in FE ✅ (no error vanishes entirely)
- **Dominant pattern is GOOD:** the codebase mandates the Result pattern (CLAUDE.md Qoida 1). The overwhelming majority of catches do `return Err(AppErr(...))` or rethrow as `HttpException` — error is propagated, not hidden. ~460+ catch blocks matched `return Err(/throw/success:false`.

### BE catch count per module (top)

| Module | catches | Module | catches |
|---|---|---|---|
| hr | 403 | crm | 68 |
| pos | 229 | agents | 63 |
| finance | 201 | mm | 58 |
| wms | 133 | qc | 51 |
| sd | 100 | remaining | 50 |
| iot | 99 | communication-center | 43 |
| pp | 81 | general | 42 |
| lms | 79 | director | 40 |
| erp | 74 | notifications | 37 |

> High module counts ≠ bad. e.g. `finance` (201) — sampled GL write path returns `Err` correctly. Count is just volume, not risk.

## 🔴 BAD — swallows that hide a real failure (money / stock / write FIRST)

### 🔴🔴 PRIORITY — STOCK / WRITE paths that silently "succeed"

| File:line | Pattern | Why BAD |
|---|---|---|
| `modules/general/services/legacy-warehouse.helpers.ts:103` | `updatePapkaOrderRaw … } catch { return null; }` | **WRITE swallow.** A failed `UPDATE papka_orders` returns `null` — caller cannot distinguish "update failed" from "no row". Order-data write silently lost. |
| `modules/general/services/legacy-warehouse.helpers.ts:134` | `createMachineTaskRaw … } catch { return null; }` | **WRITE swallow.** Failed `INSERT INTO machine_tasks` → `null`; machine task silently not created. |
| `modules/general/services/legacy-warehouse.helpers.ts:164` | `createPlanningOperationRaw … } catch { return null; }` | **WRITE swallow.** Failed `INSERT INTO planning_operations` → `null`; planning op silently lost. |

> **Self-incriminating evidence:** the sibling `createPapkaOrderRaw` (same file, line 58) was *deliberately* written with **no** try/catch and a comment: *"let DB errors surface as a 500 so the UI shows a real error instead of a silent fake success."* The 3 functions above violate the author's own stated rule — they are inconsistent swallows, not intentional fallbacks.

### 🔴 Money calculation skewed by silent empty fallback

| File:line | Pattern | Why BAD |
|---|---|---|
| `modules/finance/domain/services/variance-analysis.service.ts:186,198` | `parseBomItems/parseRoutingSteps … catch { return []; }` | A malformed BOM/routing JSON silently becomes **empty** → cost-variance computed against 0 items = wrong variance numbers, no error surfaced. (Borderline 🔴/🟡: parse fallback, but feeds money math.) |
| `modules/finance/domain/services/standard-cost.service.ts:154,166` | `… catch { return []; }` | Same shape — standard-cost rollup silently drops un-parseable components. |

### 🔴 Other write/read swallows worth flagging

| File:line | Pattern | Note |
|---|---|---|
| `modules/pos/infrastructure/repositories/label.repository.ts:17` | `try { … } catch (e) { log.warn(...); return []; }` | POS label DB exec → log-and-return-[]. Read path (label fetch), low money risk, but hides DB errors. 🟡→🔴-lite |
| `modules/mm/presentation/mm-purchase-orders.controller.ts:64,90` | `} catch (_e) { return []; }` | **Purchase-order** list endpoint swallows to `[]` — a DB error renders as "no purchase orders" (looks like empty, is actually broken). Controller-level swallow. |
| `modules/sd/presentation/sd-contracts.controller.ts:67` | `} catch (_e) { return []; }` | SD contracts list swallowed to `[]` — same "looks empty, is broken" hazard. |
| `modules/communication-center/application/cc-stats.service.ts:125,149` | `} catch { return []; }` | Stats — low risk, but error invisible. 🟡 |

## 🟡 SUSPECT — error logged or empty-returned, mostly READ fallbacks (acceptable-ish, but blind)

These return `[]`/`null` on **read** paths. Empty is a plausible answer for a list, so they don't fake a write — but they convert a DB outage into "no data" with no signal:

- `modules/general/services/legacy-warehouse.helpers.ts` — ~12 more `catch { return []; }` on SELECT helpers (machine tasks, planning ops, kanban, orders-by-date).
- `modules/general/services/legacy-attendance.helpers.ts` — ~9 `catch { return []/null; }` (attendance reads).
- `modules/general/services/legacy-iot.service.ts` — 5 `catch { return []; }` (IoT reads).
- `modules/general/services/legacy-kpi.helpers.ts:153` — `catch { return []; }`.
- `modules/admin/infrastructure/repositories/drizzle-user.repo.ts:48,62,76` — `logger.error(...); return null;` on findById/findByUsername/findByEmail. 🟡 (auth lookups → null masks DB error as "user not found"; minor security-relevance but logged).
- `modules/admin/infrastructure/repositories/drizzle-settings.repo.ts:59` — `return null` on settings read.
- `modules/qc/infrastructure/repositories/drizzle-inspection.repo.ts:78` — `logger.error(...); return null;`.
- `modules/ai/forecast/*`, `modules/aisha/application/tools/*`, `modules/compatibility/acl/*`, `modules/remaining/acl/*` — `catch { return []; }` on read/ACL helpers.
- `cron/repositories/absence-block.repository.ts:74` — logs + `return []` **with an explicit comment** ("cron still reports result but won't crash") → arguably 🟢 by intent.

## 🟢 OK — genuinely correct handling (the majority)

- **GL / money write path is correct:** `modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts:52,92` — `catch (e) { return Err(AppErr('DB_ERROR', 'GL_INSERT_FAILED…')); }`. Failures propagate as `Err`. ✅
- `modules/finance/domain/services/gl-posting.service.ts` — double-entry validation returns `Err` on imbalance; never throws raw. ✅
- Hundreds of repo methods follow `catch (e) { return Err(...) }` (Qoida 1) — error becomes a typed Result the caller must handle.
- `lib/objectAcl.ts:102`, `common/result.ts:136` — `catch { return null }` where null is the contractually correct "not found / parse miss".

---

# ═══ PART 2 — `any` audit ═══

## tsconfig strict status ✅

- **BE** `apps/api/tsconfig.json`: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`. (Loosens only `strictBindCallApply`/`strictPropertyInitialization` to false — minor.) Base `tsconfig.base.json` also sets `noImplicitAny: true`. → **No hidden implicit-any in BE.**
- **FE** `artifacts/erp-dashboard/tsconfig.json`: `"noImplicitAny": true`, `"strictNullChecks": true`, `"strictPropertyInitialization": true`, `"useUnknownInCatchVariables": true`. (Extends base; does not re-declare `strict: true` but enables the key flags individually.) → **No hidden implicit-any in FE either** — every `any` is explicit and greppable.

## Counts

- **BE explicit `any`:** **3** (total). ✅ Excellent.
- **FE explicit `any`:** **92** — but **~80 are in one file** (`shared-schema.ts`).

## 🔴 BAD — `any` on money / stock / domain / API data

### 🔴🔴 The big one: `shared-schema.ts` stubs ALL FE domain types to `Record<string, any>`

`artifacts/erp-dashboard/src/shared-schema.ts` declares ~80 core domain types as `Record<string, any>`. Every one of these is a money/stock/domain object that the entire FE consumes **untyped** — a wrong field name or wrong type is a silent runtime bug with zero compiler help:

| Line | Type | Domain risk |
|---|---|---|
| `shared-schema.ts:81` | `GlDocument = Record<string, any>` | 🔴 **MONEY** — GL document |
| `shared-schema.ts:58` | `SalesOrder = Record<string, any>` | 🔴 **MONEY/ORDER** |
| `shared-schema.ts:34` | `InsertSalesOrder = Record<string, any>` | 🔴 **MONEY write payload** |
| `shared-schema.ts:53,54` | `PurchaseOrder`, `PurchaseOrderItem` | 🔴 **MONEY** |
| `shared-schema.ts:60-63` | `SdQuotation`, `Quotation`, `…Item` | 🔴 **MONEY (pricing)** |
| `shared-schema.ts:49,50` | `Order`, `PapkaOrder` | 🔴 **ORDER** |
| `shared-schema.ts:52,31` | `Product`, `InsertProduct` | 🔴 **catalog/stock** |
| `shared-schema.ts:57` | `RawMaterial` | 🔴 **stock** |
| `shared-schema.ts:78` | `MaterialBalance` | 🔴 **STOCK balance** |
| `shared-schema.ts:75,32` | `ProductionFact`, `InsertProductionFact` | 🔴 **production qty** |
| `shared-schema.ts:79,80` | `CostCenter`, `ProfitCenter` | 🔴 **MONEY** |
| `shared-schema.ts:8,9` | `User`, `UserType` | 🔴 core identity |
| `shared-schema.ts:69` | `Vendor` | 🔴 finance master data |
| … ~65 more (KPI, Kanban, Marketing, IoT, Attendance, Task*) | | 🟡 mostly operational |

> This single file is the dominant source of FE type-unsafety. Note `noImplicitAny` is ON, so the compiler is *not* the leak — this is a deliberate `Record<string, any>` alias layer (likely a stub left from a schema-convergence migration). Replacing it with real interfaces is the single highest-leverage `any` fix.

### 🔴 API request/response bodies cast to `Record<string, any>`

`apiRequest(...)` results cast away their type at the call site:

| File:line | Cast |
|---|---|
| `pages/AIInterviewPublicPage.tsx:101` | `(await apiRequest('POST', …)) as Record<string, any>` |
| `pages/barcode/PrinterSettingsTab.tsx:99` | `… as Record<string, any>` (POS printer config) |
| `pages/Courses.tsx:235` | `… as Record<string, any>` |
| `pages/MarketingSettingsSections.tsx:30` | `… as Record<string, any>` |
| `pages/IntegrationManagement.tsx:20,81` | `Record<string, any>` map + `useQuery<any[]>` |
| `components/sd/europrint/OverviewDashboard.tsx:14` | `useQuery<Record<string, any>>` (SD overview) |
| `components/recruiting/types.ts:48` | `portret?: Record<string, any>` |

→ API bodies untyped at the boundary; 🔴 where the body is money/order (SD overview, POS config).

### 🔴 BE — only 3, all minor but noted

| File:line | Usage | Verdict |
|---|---|---|
| `modules/director/infrastructure/repositories/drizzle-approval-write.repo.ts:31` | `db.insert(approvalRequestsTable).values({ …, amount: …, currency: … }) as any` | 🔴-lite — `as any` on a Drizzle **insert of a money approval** (amount/currency). Defeats column-type checking on a money write. Should be typed to the table's insert type. |
| `modules/mes/infrastructure/repositories/drizzle-downtime.repo.ts:118` | `} as any)` on insert values | 🟡 — downtime insert cast; non-money. |
| `global.d.ts:20` | `readonly data?: Record<string, any>` | 🟢 — generic event payload boundary; acceptable. |

## 🟢 OK — genuine boundaries

- BE `global.d.ts` event `data` payload — dynamic by design.
- A handful of FE `Record<string, any>` for genuinely freeform config (`IntegrationManagement` icon map) — acceptable but cheap to type.

---

# ═══ SUMMARY — ranked BAD offenders (can hide money/stock/data bugs) ═══

| # | Offender | Type | Risk | Effort |
|---|---|---|---|---|
| 1 | `shared-schema.ts` — ~80 domain types = `Record<string, any>` (GlDocument, SalesOrder, PurchaseOrder, MaterialBalance, RawMaterial, Product…) | `any` | 🔴🔴 Every money/stock object on FE untyped; silent field bugs | **Large** but mechanical — generate real interfaces (e.g. from Drizzle/Zod). Highest leverage. |
| 2 | `legacy-warehouse.helpers.ts:103,134,164` — `updatePapkaOrderRaw` / `createMachineTaskRaw` / `createPlanningOperationRaw` `catch { return null }` | swallow | 🔴 Stock/order **write** fails silently → "success" with no row | **Small** — remove catch (match sibling `createPapkaOrderRaw`) or return `Err`. 3 spots. |
| 3 | `mm-purchase-orders.controller.ts:64,90` + `sd-contracts.controller.ts:67` `catch { return [] }` | swallow | 🔴 PO / contract list = "looks empty, is actually broken" | **Small** — propagate error / 500. |
| 4 | `variance-analysis.service.ts:186,198` + `standard-cost.service.ts:154,166` `catch { return [] }` on BOM/routing parse | swallow | 🔴 Cost-variance / standard-cost computed on silently-empty data | **Small** — log + surface, or validate JSON. |
| 5 | FE `apiRequest(...) as Record<string, any>` (SD overview, POS printer-config, marketing) | `any` | 🔴 money/order API bodies untyped at boundary | **Small-medium** — type per endpoint (tied to #1). |
| 6 | `drizzle-approval-write.repo.ts:31` insert `as any` (amount/currency money write) | `any` | 🔴-lite money insert bypasses column types | **Tiny** — use table insert type. |
| 7 | ~25 read-path `catch { return [] / null }` (legacy attendance/iot/kpi, admin user/settings repos) | swallow | 🟡 DB outage → silent "no data" | **Medium** — add logging or convert to Result; lower priority. |

## How big is the cleanup?

- **try/catch:** NOT a big swallow problem. 0 empty catches; the codebase already mandates and largely follows the Result/`Err` pattern, and the money-critical GL path is correct. The genuine 🔴 write/money swallows are **~9 sites in 4 files** (#2–#4 above) — a half-day fix. The 🟡 read swallows (~25) are lower-priority hygiene.
- **`any`:** BE is effectively clean (3 sites). FE has 92, but **~80 collapse to fixing one file** (`shared-schema.ts`). Once that's typed, the ~12 `apiRequest … as Record<string,any>` casts can inherit real types. So the `any` cleanup is "1 big mechanical file + ~12 call-site follow-ups," not 92 scattered fights.

## ⚠️ Caveats / honesty notes

- Counts via ripgrep over `*.ts`/`*.tsx` excluding specs. catch totals (2,419 / 358) include all forms; the swallow vs OK split was determined by **sample-reading** representative bodies in money/stock/write modules, not by reading all 2,777 blocks. The 🔴 list is verified by direct read; the 🟡 list is pattern-matched and representative, not exhaustive.
- This is **analysis only** — no code changed, no commit. Feeds a later decision.
