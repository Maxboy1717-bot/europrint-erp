# Report 02 — Database Schema Overview

**Project:** EuroPrint ERP
**Audit pass:** Round 2 (forensic re-verification)
**Date:** 2026-05-27
**Repository root:** `Uzbek-Language-Module/` (referred to as `$ROOT`)
**Live DB measurement:** re-ran `_drift_check.mjs` against the current `_db_tables.txt` / `_db_cols.txt`.

This report covers ONLY the schema layout — Drizzle file inventory, table grouping, drift, migration journals, naming conventions and re-export plumbing. Per-column field definitions for every table are out of scope; round 1 dedicated long table cards to a handful of headline tables, this pass focuses on coverage and structure.

---

## Diff vs round 1

- **Round-1 said "lib/db = 665 unique tables, apps/api = 362 unique, combined ~906".** Re-counted: lib/db has **673 unique names** across **96 `.ts` files** (`grep -rln "pgTable(" lib/db/src/schema --include="*.ts" | wc -l` = 96; `grep -rn pgTable\\( lib/db/src/schema | grep -oP "pgTable\\(\\\"[^\\\"]+" | sort -u | wc -l` = 673). apps/api/src/shared/db has **395 unique names** across **53 `.ts` files**. Combined unique names = **914**, not "~906 after dedup".
- **Round-1 said the live DB has 951 tables/views and `_drift_report_fresh.txt` is the authoritative drift document.** That file is **stale**. `_db_tables.txt` now has **1024 rows** (re-run of the snapshot since the fresh report was generated). When `_drift_check.mjs` is executed against the current `_db_tables.txt`, the result is **957 Drizzle pgTable unique names, 1024 DB tables+views, 0 Drizzle tables missing in DB, 46 missing columns across 23 tables** — vastly improved over the snapshot (which claimed 73 missing tables, 527 missing columns across 177 tables). The numbers below use the live re-run, not the stale text file.
- **Round-1 said `ow_*` (Order Workflow) has 16 tables, all absent from DB.** Wrong twice. The file now defines **22 tables** (`grep -c pgTable\\( lib/db/src/schema/order-workflow-schema.ts` = 22), and **all of them are in the live DB** — `grep -c "^ow_" /tmp/db_tables.txt` = 22. The entire module was materialised between round-1 and round-2.
- **Round-1 said `pos_inventory_passport` is "migration-only — no Drizzle schema yet".** Now in DB (`pos_inventory_passport` is in `_db_tables.txt`); the Drizzle definition lives in `lib/db/src/schema/pos-schema.ts` and is re-exported by name from `lib/db/src/schema/index.ts:28-29` (`inventoryPassports`).
- **Round-1 said `lms_lessons`, `lms_events`, `lms_sessions` are missing from DB.** All three now present in `_db_tables.txt`.
- **Round-1 said the apps/api drizzle journal contains only `0000`, migrations 0001–0016 run "outside the journal".** Correct, but it understated the picture: the `lib/db` journal `lib/db/drizzle/meta/_journal.json` contains **12 entries (0000_nice_kylun → 0011_consolidated_legacy_fixes)** and the on-disk directory has **two extra files (0016, 0050) that are NOT in the journal**. Two parallel migration systems, neither covers everything.
- **Round-1 said `migrations-drift.ts` has "1151 entries".** Current file has **1193 entries** (`grep -cE "^\s*\{ name:" apps/api/src/shared/db/invariants/migrations-drift.ts`) totalling **1018 ADD COLUMN + 172 CREATE TABLE + a few PRIMARY KEY/INDEX statements**, applied on **every API boot** from `apps/api/src/main.ts:103`. Round-1 listed it but did not describe the in-process invocation chain.
- **Round-1 missed the `apps/api/src/shared/db/schema-db-only-generated.ts` file.** It is an **89-table auto-generated batch** of pgTable definitions for live DB tables that were missing from Drizzle (header dated 2026-05-22). Listed below.
- **Round-1 missed the multi-level barrel structure.** `lib/db/src/schema/index.ts` re-exports from leaf files, but many leaf files (`hr-schema.ts`, `pp-schema.ts`, `fi-schema.ts`, `mm-schema.ts`, `sd-schema.ts`, `crm-schema.ts`, `core-schema.ts`) are themselves **pure re-export shells** with no `pgTable()` calls. The actual tables live two levels deep.
- **Round-1 missed that `pnpm db:migrate` is broken.** The root `package.json:26` delegates to `pnpm --filter @europrint/api run migrate`, but `apps/api/package.json` has no `migrate` script. Migrations are only runnable from `lib/db` (`lib/db/package.json:22-25`).

---

## 1. Two-system overview

Two separate Drizzle ORM schema directories coexist, each with its own connection pool, its own barrel `index.ts`, and partially overlapping table coverage.

### 1.1 System A — `lib/db/` (`@workspace/db`)

- **Workspace package:** `@workspace/db` (publishable workspace lib).
- **Entry point:** `lib/db/src/index.ts:18-19` creates the pool and exports `db` + `pool`, then re-exports the schema barrel `lib/db/src/schema/index.ts`.
- **Drizzle Kit config:** `lib/db/drizzle.config.ts` — `schema: "./src/schema/index.ts"`, `out: "./drizzle"`, `dialect: "postgresql"`. **This is the only `drizzle.config.ts` in the repo**; `apps/api` has none.
- **Migrations directory:** `lib/db/drizzle/` (15 files visible: 0000-0011, 0016, 0050, plus `0009_*.sql.template`).
- **Journal:** `lib/db/drizzle/meta/_journal.json` — 12 entries (0000 → 0011).
- **Schema-file count:** 119 `.ts` files in `lib/db/src/schema/` (including barrel re-exports). 96 actually contain `pgTable(` calls; the other 23 are pure re-export shells (`hr-schema.ts`, `fi-schema.ts`, `pp-schema.ts`, `mm-schema.ts`, etc.) or helper modules (`numeric-money.ts`).
- **pgTable definitions:** 692 calls / **673 unique table names**.
- **Build target:** `lib/db/tsconfig.cjs.json` (CJS); `apps/api` imports the compiled CJS output via `_moduleAliases: "@europrint/schemas": "../../lib/db/dist/cjs"` (`apps/api/package.json:6`).

### 1.2 System B — `apps/api/src/shared/db/`

- **NOT a separate workspace package.** Imported within the API via path alias `@shared/db` (`apps/api/package.json:10`).
- **Entry point:** `apps/api/src/shared/db/schema.ts:14-32` — this file simultaneously (a) re-exports from 18 split schema modules and (b) creates a SECOND `Pool` (`apps/api/src/shared/db/schema.ts:94-95`) using `NEON_DATABASE_URL || DATABASE_URL`. So `lib/db` and `apps/api/shared/db` each open their own pg connection pool.
- **Drizzle Kit config:** **none**. The directory's SQL files are hand-curated.
- **Migrations directory:** `apps/api/drizzle/` (17 numbered files: 0000-0016).
- **Journal:** `apps/api/drizzle/meta/_journal.json` — **only 1 entry, `0000_volatile_ender_wiggin`**. Migrations 0001–0016 exist on disk but are NOT in the journal.
- **Additional ad-hoc migrations:** `apps/api/src/shared/db/migrations/` — 41 raw `.sql` files (drift-fix scripts, seeds, view definitions, etc.). Not journaled. Not auto-applied.
- **Boot-time DDL runner:** `apps/api/src/shared/db/invariants.ts` + `invariants/migrations-{schema,triggers,crm,drift}.ts`. Total **34 + 13 + 60 + 1193 = 1300 idempotent DDL statements** invoked from `apps/api/src/main.ts:95-107` on every boot.
- **Schema-file count:** 76 `.ts` files in `apps/api/src/shared/db/` (excluding `node_modules`, `migrations/`, and `invariants/`). 53 contain `pgTable(` calls; the rest are barrels, helpers, or re-exports.
- **pgTable definitions:** 453 calls / **395 unique table names**.

### 1.3 Combined and overlap

- Unique combined Drizzle names: `grep -rn pgTable\\( lib/db/src/schema apps/api/src/shared/db | grep -oP "pgTable\\(\\\"[^\\\"]+" | sort -u | wc -l` = **914**.
- The drift checker scans `lib/db/src/schema` and `apps/api/src` (the wider apps/api tree, not just `shared/db`), which adds 43 more pgTable names from `apps/api/src/modules/.../infrastructure/` (mostly test stubs and per-module schemas). That is why `_drift_check.mjs` reports **957 unique names**.
- Overlap (tables defined in BOTH `lib/db` AND `apps/api/src/shared/db`): the round-1 count of ~121 is approximately correct. Cross-reference today: `users`, `employees`, `attendance`, `departments`, `positions`, `crm_leads`, `crm_deals`, `crm_contacts`, `crm_companies`, `crm_pipelines`, `crm_stages`, `payroll_periods`, `payroll_rows`, `salary_history`, `accounts`, `gl_documents`, `gl_lines`, `production_orders`, `kanban_boards`, `kanban_columns`, `kanban_cards`, `kanban_flows`, `kanban_robots`, all `chat_*` tables, all `aisha_*` tables, `audit_logs`, `accounting_periods`, `entries`, `lms_courses`, `lms_enrollments`, `lms_modules`, `lms_exams`, `lms_certificates`, etc.
- Most overlap is **re-export-style** (apps/api file does `export { foo } from '@workspace/db'`), but **~25 tables are independently redefined** in apps/api (`users` in `schema-core.ts:28` AND `schema-compat-1a.ts:9` AND `schema-misc-app-a.ts:19` AND lib/db `users.ts:13` — four parallel declarations of the same table).

### 1.4 Headline numbers (re-measured 2026-05-27)

| Metric | Value | Source |
|---|---|---|
| `lib/db/src/schema/*.ts` files | 119 | `ls lib/db/src/schema -R \| grep \\.ts$` |
| ... files containing `pgTable(` | 96 | `grep -rln pgTable\\( lib/db/src/schema \| wc -l` |
| ... total `pgTable(` calls | 692 | `grep -rn pgTable\\( lib/db/src/schema \| wc -l` |
| ... unique table names in lib/db | 673 | `\| grep -oP pgTable\\\\(...... \| sort -u \| wc -l` |
| `apps/api/src/shared/db/*.ts` files | 76 | `ls apps/api/src/shared/db \| grep \\.ts$` |
| ... files containing `pgTable(` | 53 | grep |
| ... total `pgTable(` calls | 453 | grep |
| ... unique table names in apps/api | 395 | grep + sort -u |
| Combined unique pgTable names | 914 | union sort -u |
| Drift checker `pgTable` count (wider scan) | 957 | `node _drift_check.mjs` (scans full `apps/api/src`) |
| Live DB tables + views | 1024 | `wc -l _db_tables.txt` |
| Drizzle tables MISSING from DB | **0** | `_drift_check.mjs` re-run |
| Drizzle cols MISSING from DB | **46** (across 23 tables) | `_drift_check.mjs` re-run |
| Boot-time idempotent DDL statements | 1300 | counts below |

---

## 2. lib/db schema files

### 2.1 Pure barrel re-export shells (no `pgTable(`)

These files only re-export from sibling files. They keep `index.ts` short and let consumers say `import { ... } from '@workspace/db/schema/hr-schema'` without knowing the split layout.

| File | Re-exports from |
|---|---|
| `lib/db/src/schema/hr-schema.ts:6-9` | `./hr-recruitment`, `./hr-personal`, `./hr-performance`, `./hr-extended` |
| `lib/db/src/schema/hr-recruitment.ts:6-8` | `./hr-questionnaire`, `./hr-employees-docs`, `./hr-recruiter` |
| `lib/db/src/schema/hr-personal.ts:6-7` | `./hr-personal-core`, `./hr-compensation` |
| `lib/db/src/schema/hr-performance.ts:6-7` | `./hr-performance-core`, `./hr-transfers` |
| `lib/db/src/schema/hr-extended.ts:6-8` | `./hr-performance-ext`, `./hr-safety`, `./hr-goals` |
| `lib/db/src/schema/fi-schema.ts:6-9` | `./fi-gl`, `./fi-ap-ar`, `./fi-banking`, `./fi-advanced` |
| `lib/db/src/schema/mm-schema.ts:6-10` | `./mm-procurement`, `./mm-materials`, `./mm-advanced`, `./mm-logistics`, `./mm-mro` |
| `lib/db/src/schema/mm-materials.ts:6-7` | `./mm-material-cards`, `./mm-batch-mgmt` |
| `lib/db/src/schema/pp-schema.ts:7-11` | `./pp/pp-production`, `./pp/pp-papka`, `./pp/pp-iot`, `./pp/pp-design`, `./pp/pp-enhanced` |
| `lib/db/src/schema/crm-schema.ts:6-8` | `./crm-core`, `./crm-deals`, `./crm-extended` |
| `lib/db/src/schema/crm-extended.ts:6-7` | `./crm-docs`, `./crm-activities` |
| `lib/db/src/schema/sd-schema.ts:6-7` | `./sd-core`, `./sd-extended` |
| `lib/db/src/schema/core-schema.ts:13-17` | `./core/core-users`, `./core/core-ai`, `./core/core-ai-reports`, `./core/core-rules`, `./core/core-enterprise` (this file ALSO defines its own 20 tables below the re-exports — mixed shell) |

`crm-core.ts`, `crm-deals.ts`, `sd-core.ts`, `sd-extended.ts`, `hr-questionnaire.ts`, `hr-employees-docs.ts`, etc. are tiny leaf files; some have only re-exports, others have a handful of pgTables.

### 2.2 Leaf files with `pgTable(` calls — top 30 by table count

Counts via `grep -c pgTable\\( <file>`.

| Count | File | Tables (first names) |
|---|---|---|
| 27 | `lib/db/src/schema/lms-schema.ts` | `guidelines`, `mentors`, `courses`, `modules`, `lessons`, `tests`, `questions`, `attempts`, `answers`, `assignments`, `progress`, `aiExamAttempts`, `videoProgress`, `achievements`, `userAchievements`, `userPoints`, `skills`, `userSkills`, `onboardingTasks`, `userOnboardingProgress`, `mentorships`, `mentorshipSessions`, `hrCapitalCourses`, `hrCapitalModules`, `hrCapitalQuizQuestions`, `hrCapitalQuizAttempts`, `courseProgress` |
| 27 | `lib/db/src/schema/hr-v2-schema.ts` | `violationCatalog`, `absenceTracking`, `employeeBlocks`, `badgeCatalog`, `employeeBadges`, `gamificationPoints`, `gamificationTotals`, `hrDailyReports`, `hrDailyReportAudit`, `careerPaths`, `careerPathSteps`, `skillCatalog`, `employeeSkillScores`, `enpsSurveys`, `enpsResponses`, `pipPlans`, `pipProgressUpdates`, `visitorLog`, `documentWorkflowRoutes` (table name `workflow_route_configs`), `hrDocuments`, `documentApprovalSteps`, `documentSignatures`, `hrInterviewSessions`, `hrInterviewQuestions`, `offboardingCases`, `offboardingChecklistItems`, `shiftSchedules` |
| 24 | `lib/db/src/schema/pos-schema-v2.ts` | `posMovements`, `posMovementLines`, `posMaterialRequests`, `posMaterialRequestLines`, `employeeIssuanceLog`, `employeeInventoryLedger`, `employeeWriteOffActs`, `employeeWriteOffActLines`, `employeeLiabilityCases`, `productionMaterialAllocs`, `posStockReservations`, `posSerialNumberItems`, `posInventoryCounts`, `posInventoryCountLines`, `posOfflineQueue`, `posBarcodePrintQueue`, `posDamageQcLinks`, `departmentWarehouseMap`, `materialCategoryDeptRules`, `materialCardSuggestions`, `posThreeWayMatch`, `posTelegramSessions`, `posAuditLog`, `posPrinterConfig` |
| 24 | `lib/db/src/schema/kanban/kanban-extended.ts` | `taskSubtasks`, `taskChecklists`, `taskChecklistItems`, `taskTags`, `taskCardTags`, `taskReminders`, `taskTimeEntries`, `taskCollaborators`, `taskTemplates`, `taskFiles`, `taskStatusHistory`, `taskResults`, `taskResultFiles`, `taskChatMessages`, `taskChatMessageFiles`, `taskTimeTracks`, `taskObservers`, `taskCoExecutors`, `taskProjects`, `taskProjectMembers`, `automationRobots`, `taskFlows`, `taskNotifications`, `taskViewPreferences` |
| 23 | `lib/db/src/schema/pp/pp-production.ts` | `productionFactsSM72`, `workCenters`, `products`, `orders`, `productionPlanHeader`, `productionPlanLines`, `productionFact`, `downtimeLogs`, `bomHeaders`, `bomItems`, `routings`, `routingOperations`, `productionOrders`, `productionOrderOperations`, `productionOrderComponents`, `workCenterCapacity`, `shiftCalendars`, `mrpRuns`, `mrpResults`, `equipment`, `shiftEvaluations`, `productionQcChecks`, `productionStatusHistory` |
| 23 | `lib/db/src/schema/pp/pp-enhanced.ts` | `machineCrews`, `setupChecklists`, `checklistItems`, `materialConsumption`, `defectReports`, `bomTemplates`, `technologyCards`, `materialNorms`, `orderProductionHistory`, `assetInventory`, `productCategories`, `productMasters`, `orderApprovals`, `wasteRecords`, `wasteTargets`, `oeeRecords`, `aiProductionPlans`, `aiPlanningDecisions`, `aiPlanningConfig`, `equipmentMaintenance`, `sosAlerts`, `assetMaintenanceRecords`, `assetInsurance` |
| 22 | `lib/db/src/schema/order-workflow-schema.ts` | `owOrders`, `owOrderLines`, `owOrderSurveys`, `owOrderSamples`, `owContracts`, `owTechCards`, `owMolds`, `owCliches`, `owMaterialRequirements`, `owProductionPlans`, `owWorkOrders`, `owQcResults`, `owPackagingRecords`, `owFgTransfers`, `owShippingRequests`, `owDeliveries`, `owReworkEvents`, `owPalletRecoveries`, `owCreditLimits`, `owPaymentPlanEntries`, `owDocumentWorkflowInstances`, `owOrderStatusHistory` |
| 20 | `lib/db/src/schema/wms-schema.ts` | `warehouses`, `warehouseZones`, `warehouseBins`, `stockTransfers`, `stockTransferLines`, `stockMoves`, `warehouseTransactions`, `warehouseStock`, `dailyWarehousePlans`, `barcodeMovements`, `exitLogs`, `barcodePrintQueue`, `pickingTasks`, `cycleCountResults`, `stockMovementGLPostings`, `inventoryValuation`, `productionMaterialBalance`, `internalRequests`, `warehouseRentalSettings`, `warehouseRentalRecords` |
| 20 | `lib/db/src/schema/core-schema.ts` | `contactSettings`, `systemSettings`, `meetingRooms`, `calendarEvents`, `reminders`, `broadcasts`, `surveys`, `surveyResponses`, `applications`, `applicationResponses`, `companyGoals`, `companyPlanItems`, `orgDepartments`, `orgFunctions`, `employeeFunctions`, `employeeOrgDepartments`, `companyTskp`, `hrAlumni`, `hrHealthCheckups`, `hrOnboardingChecklists` |
| 19 | `lib/db/src/schema/marketing-schema.ts` | (19 tables — marketing campaigns, leads, social posts, etc.) |
| 16 | `lib/db/src/schema/strategic-ext-schema.ts` | strategic planning, KPI dashboards, `token_blacklist`, etc. |
| 16 | `lib/db/src/schema/iot-schema.ts` | sensor devices, readings, alerts |
| 14 | `lib/db/src/schema/chat-schema.ts` | `chatRooms`, `chatMembers`, `chatMessages`, `chatReactions`, `chatPolls`, `chatPollVotes`, `chatMessageTasks`, `chatStarredMessages`, `chatUserPresence`, `chatEmojiPacks`, `chatCustomEmoji`, `chatJoinRequests`, `chatPushSubscriptions`, `chatVideoCalls` |
| 13 | `lib/db/src/schema/sd-europrint-schema.ts` | `sdCustomers`, `sdContacts`, `sdLeads`, `sdLeadActivities`, `sdPriceFormulas`, `sdQuotations`, `sdQuotationItems`, `sdOrders`, `sdOrderTimeline`, `sdPayments`, `sdStorageFees`, `sdContracts`, `sdManagerQuotas` |
| 12 | `lib/db/src/schema/hr-tz2-schema.ts` | territory logs, attendance photos, room reference photos, AI room analysis |
| 12 | `lib/db/src/schema/hr-recruiter.ts` | `hrVacancyProfiles`, `hrCandidateFunnels`, `hrFunnelHistory`, `hrToolTestResults`, `hrProductivityInterviews`, `hrOnboardingPlans`, `hrEmployeeOnboardings`, `hrJobDescriptions`, `hrMotivationPlans`, `hrWeeklyStatistics`, `hrReferencesChecks`, `hrJobOffers` |
| 12 | `lib/db/src/schema/ecommerce-schema.ts` | website chat logs, customer orders, public products/categories, reviews |
| 11 | `lib/db/src/schema/mm-logistics.ts` | logistics-side tables |
| 10 | `lib/db/src/schema/hr-goals.ts` | KPI definitions, goals, OKRs |
| 10 | `lib/db/src/schema/fi-gl.ts` | `accounts`, `entries`, `costCenters`, `profitCenters`, `glDocuments`, `glLines`, `accountingPeriods`, `payrollPeriods`, `payrollRows`, `cfoConfig` |
| 10 | `lib/db/src/schema/fi-expenses.ts` | expense categories, receipts, advances |
| 9 | `lib/db/src/schema/recruitment.ts` | applicant tracking |
| 9 | `lib/db/src/schema/qc-schema.ts` | QC checks, defects, reclamations |
| 9 | `lib/db/src/schema/pp/pp-papka.ts` | `papkaOrders`, `excelImportBatches`, `excelSourceColumns`, `excelImportRows`, `formulaDefinitions`, `formulaCalculations`, `planningOperations`, `productionFacts`, `machineTasks` |
| 9 | `lib/db/src/schema/pos-schema-extensions.ts` | POS extensions (TG sessions, audit) |
| 8 | `lib/db/src/schema/sd-billing.ts` | SD billing-side tables |
| 8 | `lib/db/src/schema/mm-mro.ts` | maintenance, PM schedules |
| 8 | `lib/db/src/schema/fi-payroll-ext.ts` | extended payroll (`pos_transactions` lives here, line 228) |
| 7 | `lib/db/src/schema/pp/pp-iot.ts` | `sensorDevices`, `productionSessions`, `sensorReadings`, `downtimeEvents`, `workerSessionEvents`, `oeeSnapshots`, `downtimeReasonCodes` |

### 2.3 Headline single-table files

| File | Single table |
|---|---|
| `lib/db/src/schema/users.ts:13` | `users` |
| `lib/db/src/schema/departments.ts:10` | `departments` |
| `lib/db/src/schema/positions.ts:1` | `positions` |
| `lib/db/src/schema/orders-registry-schema.ts:1` | `orders_registry` |
| `lib/db/src/schema/kaizen-schema.ts:1` | `kaizen` (single table) |
| `lib/db/src/schema/ideal-rasm-schema.ts:1` | `ideal_rasm_targets` |
| `lib/db/src/schema/weekly-plans-schema.ts:1` | `weekly_plans` |
| `lib/db/src/schema/website-extended.ts:1` | `website_*` (one table) |
| `lib/db/src/schema/hr-compensation.ts:1` | compensation |
| `lib/db/src/schema/ai-providers-schema.ts:1` | `ai_providers_config` |

### 2.4 Subdirectories

- `lib/db/src/schema/core/` — 5 files (`core-users.ts`, `core-ai.ts`, `core-ai-reports.ts`, `core-rules.ts`, `core-enterprise.ts`).
- `lib/db/src/schema/kanban/` — 2 files (`kanban-core.ts`, `kanban-extended.ts`).
- `lib/db/src/schema/pp/` — 5 files (`pp-production.ts`, `pp-papka.ts`, `pp-iot.ts`, `pp-design.ts`, `pp-enhanced.ts`).
- `lib/db/src/schema/__tests__/` — present, excluded by drift scanner.

There is **no `lib/db/src/schema/sd/`, `lib/db/src/schema/fi/`, `lib/db/src/schema/mm/`** subdir — finance/sales/materials split is by file-name prefix (`fi-*.ts`, `sd-*.ts`, `mm-*.ts`) instead of subfolder, which is inconsistent with the kanban/pp/core convention.

---

## 3. apps/api/src/shared/db schema files

### 3.1 Pure barrel re-export shells (no `pgTable(`)

| File | Re-exports from |
|---|---|
| `apps/api/src/shared/db/schema-business.ts:6-12` | 7 split files (`schema-business-a-1`, `-a-2`, `-b-1`, `-b-2`, `-c-1`, `-c-2`, `-c-3`) |
| `apps/api/src/shared/db/schema-business-c-2.ts:7-9` | `-hr-safety`, `-hr-payroll`, `-misc` sub-files |
| `apps/api/src/shared/db/schema-compat.ts:6-9` | `schema-compat-1`, `-2`, `-3`, `-4` (note: `-5` NOT in this barrel) |
| `apps/api/src/shared/db/schema-compat-1.ts:6-7` | `schema-compat-1a`, `-1b` |
| `apps/api/src/shared/db/schema-ext.ts:6-14` | 9 split files (`schema-ext-a-{1,2,3}`, `-b-{1,2,3}`, `-c-{1,2,3}`) |
| `apps/api/src/shared/db/schema-misc-app.ts:6-7` | `schema-misc-app-a`, `-b` |
| `apps/api/src/shared/db/schema-finance.ts:8-11` | `schema-finance-invoicing`, `-budgets`, `-extended`, `-reports` |
| `apps/api/src/shared/db/schema-aisha.ts` | re-export shell of canonical `aishaConversations`, `aishaToolCalls`, etc. from `@workspace/db` |
| `apps/api/src/shared/db/schema-pos-retail.ts` | re-exports `retailPosProducts`, `retailPosTransactions` from `@workspace/db` |
| `apps/api/src/shared/db/europrint-compat.ts` | combined re-export bridge |

### 3.2 Leaf files with `pgTable(` calls — full inventory

53 files total, totals listed; non-zero only.

| Count | File | Highlights |
|---|---|---|
| 58 | `schema-db-only-generated.ts` | **Auto-generated 2026-05-22.** 89 DB-only tables — best-effort Drizzle definitions for tables that exist in the DB but are missing from `lib/db`. Header lists the 89 tables and notes "TODO: Move each of these to the appropriate lib/db/src/schema/*.ts file". Currently a parking lot. Of the 89, exactly 1 (`departments`) has already been re-exported back from `@workspace/db`. |
| 21 | `schema-business-b-1.ts` | finance / payroll stubs |
| 19 | `schema-kanban.ts` | canonical kanban (boards/columns/cards/flows/robots/checklists/checklistItems/cardComments/cardWatchers/notifications/templates/timeTracks/tags/cardTags/results/resultFiles/observers/coExecutors/files) |
| 18 | `schema-ext-c-1.ts` | mostly ERP/MES, daily reports, MRP |
| 17 | `schema-misc-app-b.ts` | `attendance`, `lms_sessions`, `lms_tests`, `lms_courses`, `lms_enrollments`, `lms_events`, `mentorships`, `applications`, `application_responses`, `surveys`, `survey_responses`, `broadcasts`, `skills`, `user_skills`, `invoices`, `iot_alerts`, `admins` |
| 17 | `schema-business-b-2.ts` | finance reports, payroll entries |
| 14 | `schema-business-c-1.ts` | `lms_tests`, `lms_questions`, `hr_interview_sessions`, `employee_badges`, `gamification_points`, `gamification_totals`, `position_folders`, `papka_orders`, `ai_report_categories`, `ai_report_definitions`, `ai_report_subscriptions`, `asset_items`, `mes_downtime_reasons`, `purchase_invoices` |
| 14 | `schema-compat-3.ts` | MRO/production/security compat: `mroInventory`, `productionOrders`, `routings`, `routingOperations`, `bomHeaders`, `bomItems`, `workCenters`, `downtimeEvents`, `downtimeReasonCodes`, `machineCrews`, `equipmentMaintenance`, `qcReclamations`, `qcBraks`, `securityAccess`, `securityAttendance` (note: 15 named items, 14 pgTables — some re-exports) |
| 14 | `schema-ext-c-2.ts` | various extended stubs |
| 13 | `schema-compat-2.ts` | finance/payroll/sales compat: `payrollPeriods`, `payrollRows`, `leaveRequests`, `positionPermissions`, `glDocuments`, `accounts`, `salesInvoices`, `documentSequences`, `salesOrders`, `sdLeads`, `purchaseOrderItems`, `warehouseZones`, `warehouseStock`, `posMovements`, `posMovementTypes` |
| 12 | `schema-business-c-2-hr-safety.ts` | `hr_brand_settings`, `safety_incidents`, `safety_training_records`, `hazard_zones`, `ppe_compliance`, `hr_leave_requests`, `shift_schedules`, `document_templates`, `workflow_route_configs`, `adaptation_programs`, `adaptation_records`, `adaptation_milestones` |
| 12 | `schema-compat-4.ts` | `logisticsRoutes`, `iotSensors`, `designLibraryItems`, `hitlApprovals`, `customerOrders`, `customerAccounts`, `publicProducts`, `websitePages`, `portfolioItems`, `modules`, `tests`, `assignments`, `courses`, `mmDeliveries`, `sdOrders`, `productionSessions`, `stockTransferLines` |
| 11 | `schema-ext-a-1.ts` | `current_stock` (line 43), stocks, ideal_rasm_targets, etc. |
| 11 | `schema-misc-qc.ts` | qc defects/reclamations |
| 10 | `schema-compat-1a.ts` | `users` (line 9), `crmLeads`, `crmDeals`, `crmContacts`, … |
| 10 | `schema-ext-b-3.ts` | various |
| 10 | `schema-finance-extended.ts` | `cfoConfigTable`, `entries`, `accountingPeriods`, `financeCategories`, `incomeExpenseTransactions`, `orderCostings`, `orderCostingLines`, `inventoryCounts`, `warehouseTransactions`, `invoicePayments` |
| 9 | `schema-hr-lms.ts` | `employees`, `attendance`, `payroll`, `lms_courses`, `lms_enrollments`, `departments`, `positions`, `user_panels`, `lms_support_tickets` |
| 9 | `schema-ext-a-2.ts` | `pos_movements_legacy`, etc. |
| 9 | `schema-misc-iot.ts` | sensor devices/readings |
| 8 | `schema-misc.ts` | `deliveries`, `design_orders`, `maintenance_orders`, `kanban_tasks`, `campaigns`, `security_incidents`, `employee_assets`, `technology_approvals` |
| 8 | `schema-sprint2.ts` | sprint-2 tables (`supplier_price_tiers`, `inventory_policy`, `material_recommendation`, `mps_periods`, `pp_mrp_runs`, `pp_mrp_run_lines`, `product_learning_curves`, `pp_routing_operations`) |
| 7 | `schema-core.ts` | `users` (line 28), `refresh_tokens`, `audit_logs`, `settings`, `leads`, `deals`, `sales_orders` |
| 7 | `schema-ai.ts` | `aiExamAttempts` (table `lms_exam_attempts`), `aiInsights`, `aiPlanningPlans`, `aiPlanningConfig`, `aiReservationRequests`, `aiReservationBatches`, `aiHrInterviews` |
| 7 | `schema-business-a-2.ts` | various |
| 7 | `schema-business-c-2-hr-payroll.ts` | `salary_history`, `payroll_periods_hr`, `hr_attendance`, `hr_360_feedback`, `hr_health_checkups`, `hr_conflict_reports`, `employee_360_assessments` |
| 6 | `schema-finance-reports.ts` | finance report snapshots |
| 6 | `schema-manufacturing.ts` | `boms`, `routings`, `production_orders`, `mes_sessions`, `work_centers`, `downtime_events` |
| 6 | `schema-pos-ext.ts` | POS extended movement/inventory tables |
| 6 | `schema-wms.ts` | WMS canonical (warehouses/stock_items/stock_movements/vendors/purchase_orders/qc_inspections) |
| 5 | `schema-admin-ext.ts` | `audit_logs_ext`, `system_alerts`, `admin_filters` |
| 5 | `schema-business-a-1.ts` | mostly re-exports from `@workspace/db` plus `enps_survey_responses` |
| 5 | `schema-business-c-2-misc.ts` | catchall |
| 5 | `schema-compat-1b.ts` | more compat stubs |
| 5 | `schema-ext-a-3.ts` | extended stubs |
| 5 | `schema-ext-b-2.ts` | extended stubs |
| 5 | `schema-ext-b-1.ts` | extended stubs |
| 5 | `schema-hr-tz2.ts` | TZ-2 HR canonical (territory, photos, daily attendance, room refs, AI room analysis) |
| 5 | `schema-misc-app-a.ts` | `users` (line 19), `hrEmployees`, `leaveRequestsApp`, `orgDepartments`, `employeeOrgDepartments` |
| 4 | `schema-business-a-2-mro.ts` | MRO stubs |
| 4 | `schema-business-c-3.ts` | catchall |
| 4 | `schema-ext-c-3.ts` | extended stubs |
| 4 | `schema-marketing-ext.ts` | marketing email templates, social posts |
| 3 | `schema-finance-invoicing.ts` | `invoices`, `payments`, `gl_entries` |
| 3 | `schema-sprint3.ts` | sprint-3 tables |
| 3 | `schema-compat-5.ts` | `customer_payments`, `wms_stock`, `salaryHistory` |
| 2 | `schema-finance-budgets.ts` | budgets, budget_lines |
| 2 | `schema-rbac.ts` | `positionPermissions`, `auditLogs` |
| 1 | `schema-ai-agents.ts` | `aiDecisionLog` |
| 1 | `schema-forecast.ts` | `forecast_series` |
| 1 | `schema-outbox.ts` | `domain_events` |
| 1 | `schema-pp.ts` | `ppWorkCenters` |
| 1 | `schema-qc-spc.ts` | `control_chart_point` |

### 3.3 Helper / glue files (no `pgTable`)

- `apps/api/src/shared/db/schema-compat-helpers.ts` — re-exports `pgTable/uuid/text/...` from `drizzle-orm/pg-core` and defines `ts()` shortcut for timestamptz and `stub()` identity helper.
- `apps/api/src/shared/db/schema-compat-zod.ts` — Zod insert schemas only (no Drizzle tables).
- `apps/api/src/shared/db/schema-enums.ts` — `pgEnum(...)` definitions.
- `apps/api/src/shared/db/db-cqrs.ts` — DB read/write split for CQRS.
- `apps/api/src/shared/db/typed-execute.ts` — typed wrapper around `db.execute`.
- `apps/api/src/shared/db/tenant-context.ts` + `tenant-context.interceptor.ts` — multi-tenancy guard.
- `apps/api/src/shared/db/seed-pos-movement-types.ts` — boot-time seed of 7 POS movement type rows (called from `apps/api/src/main.ts:111`).
- `apps/api/src/shared/db/europrint-compat.ts` — convenience re-export bridge for legacy import paths.

---

## 4. Domain inventory

Mapping schema files → business domain. Counts are tables-in-DB per prefix (live grep of `_db_tables.txt`).

### 4.1 Core / Auth / Users

- `lib/db/src/schema/users.ts` — `users` (50+ columns).
- `lib/db/src/schema/departments.ts` — `departments`.
- `lib/db/src/schema/positions.ts` — `positions`.
- `lib/db/src/schema/core-schema.ts` + `core/core-users.ts` + `core/core-ai.ts` + `core/core-ai-reports.ts` + `core/core-rules.ts` + `core/core-enterprise.ts` — settings, calendar events, broadcasts, orgDepartments, orgFunctions, companyGoals, ai_report_categories/definitions/runs.
- `lib/db/src/schema/saas-schema.ts` — tenants, plans.
- `lib/db/src/schema/position-permissions.ts` — RBAC bridge to lib/db.
- `lib/db/src/schema/security-ops-schema.ts` — security ops (camera, RACI matrix).
- `apps/api/src/shared/db/schema-core.ts` — local `users` redefinition + `refresh_tokens`, `audit_logs`, `settings`, `leads`, `deals`, `sales_orders`.
- `apps/api/src/shared/db/schema-rbac.ts` — `positionPermissions`, `auditLogs`.
- `apps/api/src/shared/db/schema-admin-ext.ts` — `audit_logs_ext`, `system_alerts`, `admin_filters`.

### 4.2 HR (60+ tables in DB)

Largest single domain. Spread across **24 lib/db files + 5 apps/api files**.

- **lib/db:** `employees.ts` (6 tables — `employees`, `employment_contracts`, `employee_passports`, `employee_bank_accounts`, `employee_emergency_contacts`, `employee_files`), `hr-v2-schema.ts` (27 tables, including violations, badges, gamification, daily reports, PIP, career paths, eNPS, offboarding, shift schedules), `hr-recruiter.ts` (12 tables — vacancy profiles, candidate funnels, motivation plans, weekly statistics, reference checks, job offers), `hr-performance-core.ts`, `hr-performance-ext.ts`, `hr-transfers.ts`, `hr-personal-core.ts`, `hr-compensation.ts`, `hr-safety.ts`, `hr-goals.ts`, `hr-questionnaire.ts`, `hr-employees-docs.ts`, `hr-tz2-schema.ts` (territory logs, attendance photos, AI room analysis), `hr-overtime-schema.ts`, `hr-missing-schema.ts`, `hr-architecture-additions.ts`, `payroll.ts`, `attendance.ts` (4 tables — `attendance`, `attendance_records`, `daily_attendance_summary`, `abc_analysis`), `discipline.ts`, `leave.ts`, `recruitment.ts`, `adaptation.ts`, `assessment.ts`, `safety.ts`.
- **apps/api:** `schema-hr-lms.ts` (`employees`, `attendance`, `payroll`, `departments`, `positions`, `user_panels`), `schema-business-c-2-hr-payroll.ts` (`salary_history`, `payroll_periods`, `hr_attendance`, `hr_360_feedback`, `employee_360_assessments`), `schema-business-c-2-hr-safety.ts` (12 safety+leave+adaptation tables), `schema-hr-tz2.ts` (5 TZ-2 canonical re-exports), `schema-hr-overtime.ts` (overtime policy + employee separation).

### 4.3 Finance (`fi_*`, `payroll_*`, GL/AP/AR)

- **lib/db:** `fi-gl.ts` (10 — accounts, entries, costCenters, profitCenters, glDocuments, glLines, accountingPeriods, payrollPeriods, payrollRows, cfoConfig), `fi-ap-ar.ts`, `fi-ap-core.ts`, `fi-banking.ts`, `fi-budgets.ts`, `fi-advanced.ts`, `fi-payroll-calc.ts` (5 — payrollContracts, payrollTaxRules, payrollCalculations, dailyFinancialMetrics, aiFinanceInsights), `fi-payroll-ext.ts` (8 — including `pos_transactions` at line 228), `fi-expenses.ts` (10), `fi-financial-reports.ts` (6), `fi-kassa.ts` (5).
- **apps/api:** `schema-finance.ts` barrel → `schema-finance-invoicing.ts` (3 — invoices/payments/gl_entries), `schema-finance-budgets.ts` (2), `schema-finance-extended.ts` (10), `schema-finance-reports.ts` (6), `schema-business-b-1.ts` (21), `schema-business-b-2.ts` (17).

### 4.4 POS (41 tables)

- **lib/db:** `pos-schema.ts` (7 — posMovementTypes, posWarehouseAccess, roleMovementPermissions, posTelegramRoutes, inventoryPassports, inventoryBarcodeAssignments, posPdfTemplates), `pos-schema-v2.ts` (24 — see §2.2), `pos-schema-extensions.ts` (9), `pos-retail.ts` (2 — retailPosProducts, retailPosTransactions).
- **apps/api:** `schema-pos-ext.ts` (6 — posMovementTypes/posMovements/posMovementLines/posWarehouseAccess/inventoryCounts/inventoryCountLines/transferRequests/transferRequestLines/materials), `schema-pos-retail.ts` (re-exports lib/db canonical).

### 4.5 MES / PP (production)

- **lib/db:** `pp-schema.ts` barrel → `pp/pp-production.ts` (23), `pp/pp-papka.ts` (9), `pp/pp-iot.ts` (7), `pp/pp-design.ts` (7), `pp/pp-enhanced.ts` (23). `mes-schema.ts` (7 — mesTasks, mesPapkaOrders, mesShiftHandovers, mesShiftEvaluations, mesMaintenanceTasks, mesProductionSessions, mesShiftStats).
- **apps/api:** `schema-manufacturing.ts` (6 — boms, routings, production_orders, mes_sessions, work_centers, downtime_events), `schema-pp.ts` (1 — ppWorkCenters).

### 4.6 WMS / Materials

- **lib/db:** `wms-schema.ts` (20 — see §2.2), `mm-schema.ts` barrel → `mm-material-cards.ts` (5 — batches, materialCards, minStockAlerts, consumptionSuggestions, materialBatches), `mm-batch-mgmt.ts` (6), `mm-procurement.ts`, `mm-advanced.ts`, `mm-logistics.ts` (11), `mm-mro.ts` (8), `mm-purchase.ts` (6), `mm-inventory.ts` (7 — includes `ai_material_insights`), `mm-raw-materials.ts` (5).
- **apps/api:** `schema-wms.ts` (6), `schema-pos-ext.ts` (materials/inventory crossover).

### 4.7 CRM (28 tables)

- **lib/db:** `crm-schema.ts` barrel → `crm-core.ts`, `crm-deals.ts`, `crm-extended.ts` barrel → `crm-docs.ts` (4), `crm-activities.ts` (5), `crm-contacts.ts` (5 — `crmLeads`, `crmContacts`, `crmContactCompanies`, `crmCompanies`, `customerContacts`), `crm-pipelines.ts` (7), `crm-proposals.ts` (5), `crm-deal-products.ts` (5).
- **apps/api:** `schema-compat-1a.ts` (CRM compat: `crmLeads`, `crmDeals`, `crmContacts` redefinitions for DDD save() flow).

### 4.8 SD (Sales & Distribution)

- **lib/db:** `sd-europrint-schema.ts` (13 — sdCustomers, sdContacts, sdLeads, sdLeadActivities, sdPriceFormulas, sdQuotations, sdQuotationItems, sdOrders, sdOrderTimeline, sdPayments, sdStorageFees, sdContracts, sdManagerQuotas), `sd-customer-relations.ts` (5), `sd-billing.ts` (8), `sd-delivery.ts` (5), `sd-orders.ts` (2), `sd-order-items.ts` (2).
- **apps/api:** none directly — re-exports from lib/db.

### 4.9 LMS

- **lib/db:** `lms-schema.ts` (27 — courses, modules, lessons, tests, questions, attempts, answers, assignments, progress, aiExamAttempts, videoProgress, achievements, userAchievements, userPoints, skills, userSkills, onboardingTasks, userOnboardingProgress, mentorships, mentorshipSessions, hrCapitalCourses, hrCapitalModules, hrCapitalQuizQuestions, hrCapitalQuizAttempts, courseProgress, plus 2 more), `lms-extended.ts` (5 — lms_exams, lms_modules, lms_lessons, lms_certificates, lms_test_attempts), `lms.ts` (5 — test_attempts, test_questions, course_modules).
- **apps/api:** `schema-misc-app-b.ts` (`lmsSessions`, `lmsTests`, `lmsCourses`, `lmsEnrollments`, `lmsEvents`), `schema-ai.ts:8` (`aiExamAttempts` → `lms_exam_attempts`).

### 4.10 Kanban / Tasks (46 tables)

- **lib/db:** `kanban/kanban-core.ts` (4 — kanbanBoards, kanbanColumns, kanbanCards, kanbanComments), `kanban/kanban-extended.ts` (24 task_* tables — see §2.2), `kanban-schema.ts`, `kanban-extended.ts` (4 — kanban_tags, kanban_card_tags, kanban_observers, kanban_co_executors, kanban_time_tracks, kanban_results, kanban_result_files, kanban_files, kanban_notifications, kanban_templates).
- **apps/api:** `schema-kanban.ts` (19 — canonical kanbanBoards/Columns/Cards plus 16 extended tables).

### 4.11 Chat / Communication Center (31 tables)

- **lib/db:** `chat-schema.ts` (14), `communication-center.ts`.
- **apps/api:** `schema-chat.ts` (re-exports lib/db canonical + adds snake_case aliases).

### 4.12 AI / Aisha (36 tables)

- **lib/db:** `aisha-schema.ts` (4 — aishaConversations, aishaToolCalls, aishaVoiceAudit, aishaPendingApprovals), `ai-providers-schema.ts` (1), `ai-analytics-schema.ts`, `agent-schema.ts` (5 — agentAlerts, agentCronState, agentModuleHealth, agentModulesRegistry, agentsAuditLog), `core/core-ai.ts`, `core/core-ai-reports.ts`.
- **apps/api:** `schema-ai.ts` (7), `schema-ai-agents.ts` (1 — `aiDecisionLog`), `schema-aisha.ts` (re-export shell).

### 4.13 IoT / Camera

- **lib/db:** `iot-schema.ts` (16), `pp/pp-iot.ts`, `ideal-rasm-schema.ts` (camera-room comparisons).
- **apps/api:** `schema-misc-iot.ts` (9).

### 4.14 Marketing / eCommerce / Website

- **lib/db:** `marketing-schema.ts` (19), `ecommerce-schema.ts` (12 — `public_categories`, `public_products`, `customer_orders`, `customer_order_items`, `product_favorites`, `website_chat_logs`, `website_reviews`, etc.), `website-extended.ts`.
- **apps/api:** `schema-marketing-ext.ts` (4 — `marketing_email_templates`, `marketing_social_posts`).

### 4.15 Order Workflow (`ow_*`)

- **lib/db:** `order-workflow-schema.ts` (22 tables, ALL now in DB per §0).
- **apps/api:** `schema-order-workflow.ts` (re-export).

### 4.16 Agents infrastructure

- **lib/db:** `agent-schema.ts` (5).
- **apps/api:** `schema-ai-agents.ts` (1 — `aiDecisionLog`).
- Bridge file `apps/api/src/shared/db/schema-db-only-generated.ts:75-83` re-exports the 5 agent_* tables from `@workspace/db` (originally local; promoted to lib/db).

### 4.17 "Misc" / orphan domains

- **lib/db:** `weekly-plans-schema.ts`, `kaizen-schema.ts`, `orders-registry-schema.ts`, `strategic-ext-schema.ts` (token_blacklist + KPI dashboards), `numeric-money.ts` (helper).
- **apps/api:** `schema-misc.ts` (deliveries, design_orders, maintenance_orders, kanban_tasks, campaigns, security_incidents, employee_assets, technology_approvals), `schema-misc-app-{a,b}.ts`, `schema-misc-qc.ts`, `schema-outbox.ts` (`domain_events`), `schema-forecast.ts` (`forecast_series`), `schema-qc-spc.ts` (`control_chart_point`).

### 4.18 Tables in DB but absent from EVERY Drizzle file

110 entries (comm result `comm -13 /tmp/drizzle_tables.txt /tmp/db_tables.txt`). A sampling:

```
ai_interviews                approval_workflow_steps
ai_prompts                   audit_trail_log
ai_providers_config          batch_lot_movements
ai_report_insights           batch_lots
ai_tasks                     business_rules
ai_tasks_queue               cc_ai_sessions
aisha_conversations*         cc_approvals
aisha_pending_approvals*     cc_attachments
... (28 `cc_*` communication-center tables)
```

The `aisha_*` entries appear here because the Drizzle file uses `pgTable("aisha_conversations", {...})` but the drift checker's `comm` analysis is based on a sort-unique table-name diff — `aisha_*` ARE in both — confirming the comm output (which produced 110) double-counts a few due to wider-scan vs narrower-grep difference. The genuinely-absent-from-Drizzle category is dominated by:

- All 28 `cc_*` communication-center tables (no Drizzle definition; consumed via raw SQL).
- `approval_workflow_*` family (5 tables).
- Most `ai_*` and `ai_tasks*` operational tables.
- `audit_trail_log` (separate from `audit_log` / `audit_logs` / `audit_logs_ext`).

---

## 5. Migration journal state

### 5.1 `lib/db/drizzle/` — drizzle-kit managed

```
lib/db/drizzle/
├── 0000_nice_kylun.sql                              (9893 lines, 534 CREATE TABLE)
├── 0001_add_indexes_only.sql
├── 0002_recruitment_funnel_refs_offers.sql
├── 0003_pos_schema_extensions.sql
├── 0004_hr_tz2_foundation.sql
├── 0005_lms_kanban_website_extended.sql
├── 0006_fix_varchar_fk_to_integer.sql
├── 0007_hr_architecture_additions.sql
├── 0008_fk_int_parallel_columns.sql
├── 0009_fk_int_finalize.sql.template                (NOT a real .sql — a template)
├── 0009_master_data_unique_codes.sql
├── 0010_financial_reports_tables.sql
├── 0011_consolidated_legacy_fixes.sql
├── 0016_add_tenant_id_to_hr_tables.sql              (gap: no 0012-0015)
├── 0050_migrate_departments_to_org.sql              (gap)
├── archive/
│   ├── 0002_snapshot.json
│   └── 0002_special_joshua_kane.sql
├── FK_MIGRATION_README.md
└── meta/_journal.json
```

`meta/_journal.json` registers **12 entries (0000 → 0011)**. The on-disk files **0016 and 0050** are present but NOT in the journal — they must be applied by hand or via a separate `psql` script. The `.template` file is also not journaled.

`lib/db/drizzle.config.ts` is the only `drizzle.config.ts` in the repo:

```ts
export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
```

`lib/db/package.json:22-25` exposes:

```
"db:generate": "drizzle-kit generate --config ./drizzle.config.ts",
"db:migrate":  "drizzle-kit migrate  --config ./drizzle.config.ts",
"push":        "drizzle-kit push      --config ./drizzle.config.ts",
"push-force":  "drizzle-kit push --force --config ./drizzle.config.ts"
```

### 5.2 `apps/api/drizzle/` — hand-curated, almost no journal coverage

```
apps/api/drizzle/
├── 0000_volatile_ender_wiggin.sql                   (5458 lines, 451 CREATE TABLE, 24 ENUMs)
├── 0001_chat_messenger_tables.sql
├── 0002_crm_leads_id_sequence.sql
├── 0003_financial_reports_tables.sql
├── 0004_coordination_tables_update.sql
├── 0005_kanban_extended_tables.sql
├── 0006_communication_center.sql
├── 0007_cc_user_pins.sql
├── 0008_cc_workflow_steps_seed.sql
├── 0009_vysotskiy_7_otdeleniye_seed.sql
├── 0010_hr_daily_reports_attendance.sql
├── 0011_agents_infrastructure.sql
├── 0012_agents_missing_tables.sql
├── 0013_missing_indexes_and_fks.sql
├── 0014_type_corrections.sql
├── 0015_critical_schema_fixes.sql
├── 0016_pos_inventory_passport.sql
└── meta/_journal.json                               (ONLY entry: 0000)
```

`meta/_journal.json` (full file):

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1777031803281,
      "tag": "0000_volatile_ender_wiggin",
      "breakpoints": true
    }
  ]
}
```

**There is no `drizzle.config.ts` under `apps/api/`.** There is also no `migrate` script in `apps/api/package.json`. Migrations 0001–0016 therefore cannot be replayed via `drizzle-kit migrate`. They are either applied manually via `psql` or rely on the boot-time invariant runner (§5.4) to catch up.

### 5.3 `apps/api/src/shared/db/migrations/` — ad-hoc raw SQL

41 files. Examples: `drift-fix-{01..04c}*.sql`, `aisha-tables.sql`, `hr-tz2-tables.sql`, `kanban-extended-tables.sql`, `materialized-views.sql`, `search-fts-indexes.sql`, `db-partitioning-prep.sql`, `tax-rate-config.sql`, `hr-demo-seed.sql`, `hr-demo-seed-v2.sql`, `vysotskiy-7-otdeleniye.sql`, `org-chart-seed.sql`, `business-invariants.sql`, `drop-dormant-tables.sql`, `pos-monitor-fix-all.sql`, `warehouse-pos-integration.sql`, `0026_sync_departments_to_org.sql` (the one numbered file).

These are not journaled by anything. There is no script in the repo that iterates this folder.

### 5.4 Boot-time invariant runner — the actual migration "engine"

The closest thing to an active migration system. Lives in `apps/api/src/shared/db/invariants.ts`:

```ts
export async function ensureSchemaAdditions(): Promise<void> {
  const migrations = [...SCHEMA_MIGRATIONS, ...TRIGGER_MIGRATIONS, ...CRM_MIGRATIONS, ...DRIFT_MIGRATIONS];
  for (const m of migrations) {
    try {
      if (typeof m.sql !== 'string' || !m.sql.match(/^\s*(CREATE|ALTER|DROP|INSERT|WITH|DO|COMMENT|GRANT|SET)\s/i)) {
        throw new Error(`PA-S4c: invariant DDL rejected: ${String(m.sql).slice(0, 50)}`);
      }
      await db.execute(sql.raw(m.sql));
    } catch (err) {
      logger.warn(`Schema addition o'tkazildi: ${m.name} — ${String(err)}`);
    }
  }
}
```

Invoked from `apps/api/src/main.ts:103`:

```ts
try {
  await ensureSchemaAdditions();
  logger.log('Schema additions muvaffaqiyatli qo\'llandi');
} catch (e: unknown) {
  logger.warn(`Schema additions xato: ${String(e)}`);
}
```

The four source arrays:

| Constant | File | `name:` count |
|---|---|---|
| `SCHEMA_MIGRATIONS` | `apps/api/src/shared/db/invariants/migrations-schema.ts` (278 lines) | 34 |
| `TRIGGER_MIGRATIONS` | `apps/api/src/shared/db/invariants/migrations-triggers.ts` (208 lines) | 13 |
| `CRM_MIGRATIONS` | `apps/api/src/shared/db/invariants/migrations-crm.ts` (186 lines) | 60 |
| `DRIFT_MIGRATIONS` | `apps/api/src/shared/db/invariants/migrations-drift.ts` (3192 lines, auto-generated 2026-05-21) | **1193** |
| **Total** | | **1300** |

Of the 1193 drift statements: **1018 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`** + **172 `CREATE TABLE IF NOT EXISTS`** + the remainder are PK/index additions. The header reads:

```
@module invariants/migrations-drift
@description AUTO-GENERATED schema drift migrations (Drizzle ↔ DB).
Idempotent (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) so safe to re-run on every boot.
Generated by _audit_out/build-drift-file.mjs on 2026-05-21T06:54:58.668Z.
Coverage:
  - 177 live tables with column drift → ADD COLUMN
  - 135 live Drizzle-only tables → CREATE TABLE
  - Total entries: 1151
```

The "Total entries: 1151" in the header is the **2026-05-21 snapshot**; the file has since grown to 1193 entries. The boot path is responsible for backfilling everything the static migrations missed.

Additionally `ensureDbInvariants()` (`apps/api/src/shared/db/invariants.ts:27-66`) applies **22 `CHECK` constraints** from `DB_CONSTRAINTS` (`apps/api/src/shared/db/invariants/constraints-data.ts`) on the same boot path, e.g. `chk_inventory_qty_non_negative` on `wms_inventory_batches.quantity_on_hand >= 0`.

### 5.5 Effective migration order at runtime

1. Operator runs `pnpm --filter @workspace/db db:migrate` (only `lib/db` drizzle-kit can do this) → applies `lib/db/drizzle/0000..0011` per journal.
2. Operator must manually `psql` the unjournaled `0016` and `0050` from `lib/db/drizzle/`.
3. Operator must manually `psql` `apps/api/drizzle/0001..0016` (only 0000 is journaled).
4. Operator may manually `psql` files from `apps/api/src/shared/db/migrations/`.
5. On every `apps/api` boot: `ensureDbInvariants()` (22 checks) + `ensureSchemaAdditions()` (1300 idempotent DDL statements) + `seedPosMovementTypes()`.

**No single command performs the full migration.** `pnpm db:migrate` at the root is broken (delegates to a non-existent `apps/api` script).

---

## 6. Re-export and consumption patterns

### 6.1 `lib/db` barrel chain

```
lib/db/src/index.ts
  └─ export * from "./schema"
       └─ lib/db/src/schema/index.ts
            ├─ export * from "./core-schema"           (re-export shell — pulls in core/*)
            ├─ export * from "./crm-schema"            (re-export shell)
            ├─ export * from "./hr-schema"             (re-export shell)
            ├─ export * from "./fi-schema"             (re-export shell)
            ├─ export * from "./mm-schema"             (re-export shell)
            ├─ export * from "./pp-schema"             (re-export shell)
            ├─ export * from "./sd-schema"             (re-export shell)
            ├─ export * from "./lms-schema"
            ├─ export * from "./lms-extended"
            ├─ export * from "./pos-schema-v2"
            ├─ export * from "./pos-schema-extensions"
            ├─ export * from "./mm-material-cards"
            ├─ export * from "./order-workflow-schema"
            ├─ export { posMovementTypes, ... } from "./pos-schema"     (selective)
            ├─ export { employees, insertEmployeeSchema } from "./employees"  (selective — to avoid clash)
            ├─ export { assetItems, insertAssetItemSchema, assetMaintenance } from "./admin-assets"  (selective)
            └─ ... 35 more
```

`lib/db/src/schema/index.ts:60-64` has an empty selective re-export block from `hr-architecture-additions`:

```ts
export {
  // Selectively re-export from hr-architecture-additions to avoid duplicate symbols
  // (aiCvScreenings, jobTemplates, questionnaireQuestions, questionnaireTemplates
  //  are defined elsewhere — they're the authoritative copies).
} from "./hr-architecture-additions";
```

— a comment-only re-export, used as documentation that "this file's symbols are intentionally NOT re-surfaced".

`lib/db/src/schema/index.ts:80-84`:

```ts
// Selective re-export from employees.ts — EmployeeFile/EmploymentContract etc.
// are already exported via hr-schema chain; only export the core employees table here.
export { employees, insertEmployeeSchema } from "./employees";
export type { Employee, InsertEmployee } from "./employees";
// users, User, InsertUser, insertUserSchema already exported via core-schema → core-users → users
```

This is the canonical pattern: when two files would export the same symbol, the barrel cherry-picks one and notes the other as "already exported via X chain".

### 6.2 `apps/api/src/shared/db` barrel chain

`apps/api/src/shared/db/index.ts` is heavier — it does both `export *` and explicit named exports, and pulls from many split files:

```ts
import { db, runQuery } from '@shared/db';
export * from './schema';
export { db, rawSql, runQuery, ddlRun } from './schema';
export * from './schema-business';

// schema-compat-1: CRM + HR compat stubs ...
export { crmLeads, crmDeals, crmContacts, ... } from './schema-compat-1';
// schema-compat-2: Finance/Payroll/Sales compat stubs
export { payrollPeriods, payrollRows, leaveRequests, ... } from './schema-compat-2';
// schema-compat-3: MRO/Production/Security compat stubs
export { mroInventory, productionOrders, ... } from './schema-compat-3';
// schema-compat-4: Logistics/IoT/Design/eCommerce compat stubs
export { logisticsRoutes, iotSensors, ... } from './schema-compat-4';
// schema-compat-5: Finance payments + WMS stock complete schemas
export { customer_payments, wms_stock, salaryHistory } from './schema-compat-5';
// schema-ai, schema-ai-agents, schema-aisha, schema-forecast, schema-qc-spc,
// schema-hr-overtime, schema-misc-app-a, schema-admin-ext, schema-pp, schema-kanban,
// schema-ext, schema-sprint2, schema-chat, schema-hr-tz2, schema-outbox — each enumerated
```

Note `schema-compat-5` is NOT included via the `schema-compat.ts` barrel — it has to be exported by name from `index.ts`. The numbering `1..5` is misleading.

Also note `schema.ts` itself re-exports 18 leaf modules at the top (`schema-enums`, `schema-core`, `schema-manufacturing`, `schema-wms`, `schema-hr-lms`, `schema-finance`, `schema-misc`, `schema-misc-iot`, `schema-misc-qc`, `schema-pos-ext`, `schema-pos-retail`, `schema-rbac`, `schema-misc-app`, `schema-forecast`, `schema-qc-spc`, `schema-hr-overtime`, `schema-sprint3`, `schema-order-workflow`) AND defines its own `schema = { ... }` static object (`apps/api/src/shared/db/schema.ts:145-168`) that lists ~70 named tables — a third-tier mini-registry. This `schema` constant is exported separately but **not passed to `drizzle()`** — `db = drizzle(pool)` with no schema arg (line 95), unlike `lib/db` which does `drizzle(pool, { schema })` (`lib/db/src/index.ts:19`).

### 6.3 Cross-package re-export bridges

The dominant strategy for de-duplication: `apps/api/src/shared/db/schema-<x>.ts` files that contain only `export { foo } from '@workspace/db'` so that local imports keep working without redefining the table:

- `apps/api/src/shared/db/schema-aisha.ts` — all 4 aisha tables re-exported.
- `apps/api/src/shared/db/schema-pos-retail.ts` — `retailPosProducts`, `retailPosTransactions` re-exported.
- `apps/api/src/shared/db/schema-business-a-1.ts:9-50` — 20+ HR tables re-exported with snake_case aliases (`absenceTracking as absence_tracking`, etc.).
- `apps/api/src/shared/db/schema-pp.ts` re-exports `ppWorkCenters` from `@workspace/db`.
- `apps/api/src/shared/db/schema-db-only-generated.ts:75-83` re-exports the 5 `agent_*` tables from `@workspace/db` (originally local, promoted to lib/db).

### 6.4 Duplicate-table redefinitions still in place

Despite the convergence work, several tables remain defined in MULTIPLE files:

- `users`: `lib/db/src/schema/users.ts:13`, `apps/api/src/shared/db/schema-core.ts:28`, `apps/api/src/shared/db/schema-compat-1a.ts:9`, `apps/api/src/shared/db/schema-misc-app-a.ts:19` — **4 parallel definitions**.
- `attendance`: `lib/db/src/schema/attendance.ts:12`, `apps/api/src/shared/db/schema-hr-lms.ts:65`, `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:44`, `apps/api/src/shared/db/schema-misc-app-b.ts:13` — **4 parallel**.
- `departments`: `lib/db/src/schema/departments.ts:10`, `apps/api/src/shared/db/schema-hr-lms.ts:160` (the schema-db-only-generated removed its local copy in favour of `@workspace/db`).
- `employees`: `lib/db/src/schema/employees.ts:14`, `apps/api/src/shared/db/schema-hr-lms.ts:39`, `apps/api/src/shared/db/schema-misc-app-a.ts:37`.
- `applications`, `application_responses`, `surveys`, `survey_responses`, `broadcasts`, `mentorships`, `admins`, `invoices`: each defined in both `lib/db/src/schema/core-schema.ts` AND `apps/api/src/shared/db/schema-misc-app-b.ts`.
- `crm_leads`, `crm_deals`, `crm_contacts`, `crm_companies`, `crm_pipelines`, `crm_stages`: defined in `lib/db/src/schema/crm-contacts.ts` AND `apps/api/src/shared/db/schema-compat-1a.ts` AND `apps/api/src/shared/db/schema-ext.ts` (re-export of crm_leads/deals/contacts from `schema-ext`).
- `production_orders`: `lib/db/src/schema/pp/pp-production.ts:444` AND `apps/api/src/shared/db/schema-manufacturing.ts`. Column types differ (lib/db uses UUID, apps/api uses INTEGER in places).
- `kanban_boards`, `kanban_columns`, `kanban_cards`: `lib/db/src/schema/kanban/kanban-core.ts` AND `apps/api/src/shared/db/schema-kanban.ts:11-44`.

When two Drizzle objects refer to the same physical DB table but expose different column sets, the consumer hits whichever one their import path resolves to — a `EmployeeRepository` may see 50 columns but a sibling service that imports from `schema-misc-app-b.ts` sees only 6.

### 6.5 Application consumption

- The NestJS app pulls from BOTH systems. Repositories under `apps/api/src/modules/.../infrastructure/repositories/drizzle-*.repo.ts` import from `@shared/db` AND `@workspace/db` depending on which file owns the canonical pgTable.
- `apps/api/src/main.ts:24` only imports the invariant runners from `./shared/db/invariants`; the actual `db` pool used by services comes from `@shared/db` (which is `apps/api/src/shared/db/schema.ts`).
- `lib/db/src/index.ts` creates its OWN pool with `process.env.DATABASE_URL`. So during application boot two pg pools open against the same connection string — one inside `lib/db` and one inside `apps/api/shared/db`. Round 1 missed this dual-pool consequence.

---

## 7. Findings summary

1. **(HIGH) Dual schema systems with overlapping tables.** 914 unique Drizzle table names spread across 96 + 53 = 149 files. Same table redefined up to four times (`users`, `attendance`) in incompatible shapes. Bug-class: a future migration that touches column types only updates one of the four definitions, queries from the others either silently truncate, fail type-check, or return wrong data.
2. **(HIGH) `apps/api/drizzle/meta/_journal.json` registers only `0000`.** Migrations 0001 through 0016 (17 files total, post-0000) are NOT journaled. `drizzle-kit migrate` is therefore a no-op for everything past the original snapshot. Re-running migrate on a fresh DB will produce a 2026-04-21 state and a runtime that depends on the boot-time invariant runner to backfill. Provable failure mode: spin up a clean Postgres, run `pnpm --filter @workspace/db db:migrate`, the resulting schema is missing every change made after April. No automated process recovers it.
3. **(HIGH) `pnpm db:migrate` at the root is dead.** `package.json:26` delegates to `pnpm --filter @europrint/api run migrate`, but `apps/api/package.json` has no `migrate` script. The only working migration command is `pnpm --filter @workspace/db db:migrate`, and even that only covers the `lib/db/drizzle/` set (which has its own gaps — files `0016` and `0050` are present on disk but not in the journal).
4. **(HIGH) 1300 idempotent DDL statements execute on every API boot.** `apps/api/src/main.ts:95-107` calls `ensureDbInvariants()` (22 CHECK constraints) and `ensureSchemaAdditions()` (1193 drift fixes + 60 CRM + 34 schema + 13 trigger = 1300). On a cold DB this is the actual migration system. On a warm DB it is 1300 ALTER/CREATE statements with `IF NOT EXISTS` — mostly noop but still measurable boot latency, and each statement opens a transaction.
5. **(MED) Two pg Pools open against the same DATABASE_URL.** `lib/db/src/index.ts:18` and `apps/api/src/shared/db/schema.ts:94` both `new Pool({ connectionString: ... })`. Connection budget effectively halved per logical pool config; Drizzle's `db.execute()` is called against whichever pool the file path led to.
6. **(MED) `apps/api/src/shared/db/schema.ts:95` does NOT pass `{ schema }` to `drizzle()`.** `lib/db/src/index.ts:19` does. Consequence: relational query API (`db.query.users.findMany({ with: { ... } })`) works against `lib/db`'s `db` but not against `apps/api`'s `db`. The apps/api code is forced to use `select().from()` builders.
7. **(MED) 89 DB-only tables parked in `schema-db-only-generated.ts`.** Auto-generated 2026-05-22 with explicit TODOs to move each into the appropriate `lib/db/src/schema/*.ts`. Only 1 (`departments`) has been promoted. The other 88 live as untyped-ish definitions in apps/api with `// TODO: Move ...` comments — works at runtime but the canonical location is wrong.
8. **(MED) 110 live DB tables have NO Drizzle definition anywhere.** Dominated by the `cc_*` Communication Center family (28 tables), `approval_workflow_*` (5), `ai_*` operational tables, `audit_trail_log`. Any code that touches these must use raw SQL — invisible to type checking.
9. **(MED) Comment-only re-export at `lib/db/src/schema/index.ts:60-64`** — empty `export {} from "./hr-architecture-additions"` used as documentation. Functionally a no-op; brittle (a future rename will silently break the intended-not-exported contract).
10. **(MED) Schema-file naming convention is inconsistent.** Three idioms coexist:
    - **Domain prefix + dash:** `fi-gl.ts`, `mm-material-cards.ts`, `crm-contacts.ts`, `hr-recruiter.ts`, `sd-europrint-schema.ts`, `pp-schema.ts`. Most common.
    - **Subdirectory:** `core/core-users.ts`, `kanban/kanban-extended.ts`, `pp/pp-production.ts`. Only HR, Finance, MM lack a sub-folder despite having more files than kanban or core.
    - **Version suffix:** `pos-schema.ts` + `pos-schema-v2.ts` + `pos-schema-extensions.ts` (three coexisting). The v2 file is the active one (24 tables) but `pos-schema.ts` is also re-exported selectively.
    - **`schema-compat-N[a|b].ts`:** apps/api only — splits the compat stubs alphabetically when individual files exceed a size cap. `schema-compat-1.ts` is a 2-line barrel pulling `1a`+`1b`; `2..5` are leaves. `schema-compat-5` is NOT in the `schema-compat.ts` barrel — must be imported directly.
    - **`schema-ext-{a|b|c}-{1|2|3}.ts`:** 9-file matrix used as a parking lot for stub definitions. `schema-ext.ts` re-exports all 9.
    - **`schema-business-{a|b|c}-{1|2}[ -hr-payroll|-hr-safety|-misc|-mro].ts`:** another partition matrix.
    - **`schema-misc-app-{a|b}.ts`:** another two-file split.
    - **`schema-db-only-generated.ts`:** explicit "this is the dump bucket" file.
11. **(LOW) `_drift_report_fresh.txt` is stale.** Claims 73 missing tables / 527 missing cols. Re-running `_drift_check.mjs` today gives 0 missing tables / 46 missing cols. The text snapshot is not regenerated when the underlying schema/DB changes — any consumer reading the static file will draw round-1-era conclusions. **The fresh numbers are 957 Drizzle pgTable / 1024 DB tables / 0 missing tables / 46 missing cols across 23 tables.**
12. **(LOW) Remaining 46-column drift is concentrated.** Top offenders:
    - `crm_invoices` — 8 cols missing (`title`, `deal_id`, `issue_date`, `payment_method`, `bank_details`, `description`, `document_path`, `assigned_by_id`).
    - `lms_questions` — 4 (`text`, `correct_ans`, `points`, `order_index`).
    - `lms_assignments` — 4 (`enrollment_id`, `module_id`, `status`, `score`).
    - `crm_deals` — 4 (`tenant_id`, `name`, `expected_amount`, `assigned_to`).
    - `current_stock` — 1 (`material_card_id` — the historical naming-conflict carryover).
    - `mes_papka_orders.order_number`, `refresh_tokens.jti`, `sd_orders.created_by` and similar singletons.
    Round-1's "Critical drift note: `barcode` column is missing from the live DB" for `material_cards` is **no longer true** — `barcode` is present.
13. **(LOW) Migration file numbering has gaps.** `lib/db/drizzle/` jumps `0011 → 0016 → 0050`. `apps/api/drizzle/` is dense (0000..0016). Two parallel sequences, no shared numbering scheme. The number "0016" exists in both systems and refers to completely different content.
14. **(LOW) The `.template` file `lib/db/drizzle/0009_fk_int_finalize.sql.template` is not a real migration.** No automation handles `.template` extensions; the file is documentation of an unrun migration.
15. **(LOW) `apps/api/src/shared/db/migrations/` is an undisciplined dumping ground.** 41 `.sql` files mixing seed data (`org-chart-seed.sql`, `vysotskiy-7-otdeleniye.sql`), schema fixes (`fix-onboarding-tables.sql`, `fix-succession-candidates-schema.sql`), one-off drift fixes (`drift-fix-{01..04c}*`), views (`pos-finance-view.sql`, `fix-assets-view.sql`), and partitioning prep (`db-partitioning-prep.sql`). No journal, no manifest, no automation iterates this folder. They appear to be historical references that were executed once by hand.
16. **(INFO) Two-system architecture is intentional, per docs.** Files like `docs/schema-canon-map.md`, `docs/schema-convergence-ledger.md`, `docs/schema-dedup-20agent-plan.md`, `docs/schema-merge-plan.md` document the in-progress convergence FROM apps/api stubs TOWARD lib/db canonical. The re-export-shell strategy in `schema-aisha.ts`, `schema-pos-retail.ts`, `schema-pp.ts`, and `schema-business-a-1.ts` is the documented path. Progress is real but incomplete (see findings 1, 7, 8).
17. **(INFO) Outbox / domain events table is present and journaled in invariants.** `apps/api/src/shared/db/schema-outbox.ts` exports `domain_events`, and `migrations-schema.ts:8-32` creates it idempotently. Pattern: PA0-6.
18. **(INFO) `apps/api/src/shared/db/seed-pos-movement-types.ts` is called from `apps/api/src/main.ts:111` and seeds 7 POS movement types.** Only application-level seed wired into boot; the rest live as raw SQL files under `apps/api/src/shared/db/migrations/`.
