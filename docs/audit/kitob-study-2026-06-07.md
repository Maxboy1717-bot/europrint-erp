# D:/kitob — Consolidated Study (knowledge base → ERP import)

**Date:** 2026-06-07 · **Mode:** READ-ONLY synthesis of 4 analyst reports (digests · РД-5 positions · Excel data · other-ERP categorization). Repo cross-checks done live (see CODE COMPARE).

**One-line:** `D:\kitob` (~792 files) is the project's **knowledge/vision/raw-business base** — NOT code. It contains three classes of *new, importable* content the in-repo agent cannot currently see: **(1) РД-5 per-position job-instruction packets** (ready-made org-cards/lavozim-papka seed), **(2) real EuroPrint Excel operating data** (employees, orders, paper-roll stock, machine norms — to seed the near-empty `europrint` DB), and **(3) product-spec PDFs** (carton dielines whose filename = order#+tech-card#+dims+material+layers). The rest is either already-synced project docs or methodology/UI reference.

---

## 1. KITOB INVENTORY — ~792 files in 5 buckets

Totals from `D:\kitob\KITOB-vs-EUROPRINT-CLEAN-SOLISHTIRISH.md` + `EUROPRINT-KITOB-INDEKS.md`: ~805 files = 441 .md + 93 pdf + 92 docx + 83 png + 24 xlsx + 19 rar. Filename diff: kitob 790 unique names, EuroPrint-Clean 6837, **both = 325** (254 .md already in `docs/`), **kitob-only = 465** (160 md, 92 pdf, 92 docx, 67 png, 22 xlsx, 19 rar).

### (a) PROJECT-DOC OVERLAP — SKIP (~254 .md, already in `docs/`)
Dated analysis/audit/prompt history: `agents/`, `full-analysis/`, `modules/*`, `migration/02-vysotskiy-7-tree.md`, `two-worlds-analysis.md`, `schema-canon-map.md`, `modul1..20-FULL`, `TAHLIL-*`, `ddd-*`, `i18n-*`, etc. Confirmed copies of `Uzbek-Language-Module/docs/`. **No new ERP content** — these are what MEMORY.md already indexes.
- ⚠️ **Exception inside (a):** ~160 top-level `.md` are **kitob-only** — vision/rules/interview-decision docs the in-repo executor agent **cannot see**: `EUROPRINT_BARCHA_JAVOBLAR.md` (POS-60/HR-200/Org requirements base), `EUROPRINT-OMBOR-POS-KASSIR-MASTER-REJA.md` (1878-Q master plan), `EUROPRINT-INTERVYU-QARORLARI.md`, `EUROPRINT-ISHLAB-CHIQARISH-150-SAVOL.md`, `EUROPRINT-CHAT-QOIDALARI-USTOZ.md`, `EUROPRINT-QOIDALAR-BLOKI.md`, `TAHLIL-MASTER-XULOSA-2026-06-05.md` (352 reqs / ~39% done / leverage #1-10). These are **requirements canon — copy into `docs/`, do not skip.**

### (b) ⭐ ERP-IMPORT DATA — Excel → tables (24 xlsx, kitob-only)
Real EuroPrint operating spreadsheets. The 7 highest-value (full mapping in §2):
`EUROPRINT_KOKAND…БАЗА.xls` (employees master, 255 rows) · `Производство 2026 04.xlsx` (order register, 6168 rows, 2024-2026, **most current**, has price/status) · `Ombor rulon qoldig'i.xlsx` (paper-roll stock, 393 rows) · `Станоклар норма.xlsx` + `normalar.xlsx` (machine norms) · `Bandlik.xlsx` (order→dept routing matrix) · `Sm 72 uchun hom ashyolar.xlsx` (consumables + costing rates). Secondary: `Заявка бумаги.xlsx` (3580 paper requisitions, 2025), `otgruska ro'yxati.xlsx` (shipments), `Iyun ishchilar.xlsx` / `Oylik diog.xlsx` (2019 piece-rate output — schema model, not live data).

### (c) ⭐ POSITION CONTENT — РД-5 → lavozim-papka / cards (142 files, kitob-only)
`D:\kitob\РД-5\РД-5\` = **10 distinct POSITION folders** (each = one org-card) under 2 person-owners + 1 shared `Оргполитикалар/` (20 cross-position policies, NOT a card). Each position folder = the physical org-card with a recurring 5-document kit (description + work-instruction + 2 control-sheets + exercise collection + attachments). Full mapping in §2.

### (d) DESIGN — UI etalon (`EuroPrint Design System (1)/`, 65 files, kitob-only)
Packaged user-invocable Agent Skill (`SKILL.md` → `name: europrint-design`). Design tokens ("EP Linear Soft": orange `#FF902F`, warm bg `#FAFAF9`, 10px card radius, per-module hues, `ep-*` keyframes) in `colors_and_type.css` + `_source/design-tokens.css`; **KPI-card anatomy literally spec'd** in README §3.11; working React kit `ui_kits/erp-dashboard/` (AppShell.jsx, Pages.jsx, PosKanbanProfile.jsx 46KB, kit.css 59KB) + `_source/AppShellModern.tsx`; 8 dashboard screenshots; component-preview HTML; brand assets. References same canonical FE as repo (`artifacts/erp-dashboard`). **Polished extract, not new architecture — use as card-redesign reference.**

### (e) METHODOLOGY / REFERENCE (Vysotskiy / orgsxema / product specs)
- **Product-spec PDFs** (kitob-only, ~92): carton dielines — `GILOS_40x60x10_20800_KT4646.pdf`, `APRICOT_KOROBKA_…_37,8x32,5x27,7_5kg_chukur_5_sloy.pdf`, `LED PANEL …_KT5037.pdf`; prepress artwork `REVEREM …_PECHAT/LAK/TISNENIYA/KONGREV.pdf`; `Invoys.pdf`, `Инвойс и упак.pdf`, `sverka.pdf`, `бизнес процесс .drawio.pdf`. **Filename = encoded master-data** `<PRODUCT>_<DIMS>_<ORDER#>_KT<techcard#>` → order/material/tech-card chain (treated as import in §2).
- **Org-methodology** (reference, not import): `Оргсхема_Как_разработать_структуру_компании.doc/.fb2` (Vysotsky 7-function book), `ВЛАДЕЛЕЦ.xmind`, `Глава 1. Роль владельца.docx`, `Оргполитика.docx` (88k chars, EURO PRINT KOKAND, owner А.А.Позилов, 2020-2022; ~17 real processes), `Мотивация.docx`, `Orgsxema.pdf` (5MB, actual org chart), `Сессия первая…пятая домашнее задание.pdf` (**scanned, 0 extractable text — handwritten worksheets**). RAR job-descriptions (R1: Avto tigel, Flekso, Kleylash, Lak, Ofset, Rezka, Qadoq…) → MES/HR source.

---

## 2. ⭐ WHAT TO IMPORT INTO ERP (concrete, with source filename)

### 2A. РД-5 positions → org-card / `position_folders` (each folder = one card)
Source root: `D:/kitob/РД-5/РД-5/`. The **Должностная инструкция** = card master record; sections map ~1:1 to the spec §3 card fields (maqsad, orgsxema-joylashuv, talab/portret, vazifalar, **ЦКП**, ko'rsatkich, RBAC via huquq/javobgarlik). The **Контрольный лист** = the LMS exam that gates salary (spec §9) and seeds the daily-ЦКП chatbot questions (spec §8). The 5-doc kit → `position_folders` rows: Рабочая инструкция→`document`, Контрольный лист→`test`, Сборник упражнений→`document`/`test`, Расмлар *.mp4→`video` / *.png→`document`.

| # | Position folder (= org-card) | Cluster | ЦКП harvested from ДИ |
|---|---|---|---|
| 1 | `Nazirov Humoyun/Dizayn bo'limi rahbari` | Design HEAD | (per-folder ДИ line) |
| 2 | `Nazirov Humoyun/Dizayn bo'limi xodimi` | Design WORKER | (per-folder) |
| 3 | `Nazirov Humoyun/Korrektor` | Proofreader | "Буюртмачи томонидан тасдиқланган маҳсулот дизайни" |
| 4 | `Nazirov Humoyun/Laborant` | Lab | (per-folder) |
| 5 | `Nazirov Humoyun/OTK` | QC/ОТК | (per-folder) |
| 6 | `Абдуллаев Баходиржон/Ички логистика бўлими бошлиғи` | Internal-logistics HEAD | "Ишлаб чиқариш учун тайёр ҳолатга келтирилган ярим тайёр маҳсулотлар" |
| 7 | `Абдуллаев Баходиржон/Ички логистика бўлими ходими` | Internal-logistics WORKER | (per-folder; РИ has 11 tasks) |
| 8 | `Абдуллаев Баходиржон/Режалаштириш бўлими бошлиғи` | Planning HEAD | (per-folder) |
| 9 | `Абдуллаев Баходиржон/Секция внутренней доставки сырья` | Raw-material delivery section | (per-folder) |
| 10 | `Абдуллаев Баходиржон/Смена режалаштириш ходими` | Shift-planning worker | (per-folder) |

Plus `Абдуллаев Баходиржон/Оргполитикалар/` (20 docs) → **NOT cards** → spec PHASE 4 workflow_rules / org-policy engine (each policy header lists which lavozim-papka it binds, e.g. "РУЛОН ҚОҒОЗ БЕРИШ… ТАРТИБ ҚОИДАЛАРИ").

### 2B. Excel → target ERP table
| Source file (D:/kitob/) | Sheet | → ERP table / module | Worth |
|---|---|---|---|
| `EUROPRINT_KOKAND…БАЗА.xls` | `Жами ишчилар` (255r) | **employees** / users (+ org_departments, positions, shifts); Табель рақами→timesheet key | ⭐ HIGH — primary people seed |
| `Производство 2026 04.xlsx` | `Произвоство 2023` (6168r) | **sales_orders + production_orders** (status/dates/price/sum); `Справочник`→status enums | ⭐ HIGH — most current order data |
| `Ombor rulon qoldig'i.xlsx` | main (393r) | **raw_materials + warehouse_stock + warehouse_transactions** (paper rolls, intake/issue/return) | ⭐ HIGH |
| `Sm 72 uchun hom ashyolar.xlsx` | `Hom ashyo` (40r) + cost sheets | consumables→raw_materials; so'm/min rates→production_norms/costing; `savdo bo'limi`→CRM attribution | MED-HIGH (master data; monthly nums 2019) |
| `Станоклар норма.xlsx` + `normalar.xlsx` | `умумий`/`флексо` | **work_centers / production_norms** (merge both; signed=authoritative) | YES (small reference) |
| `Bandlik.xlsx` | `Bandlik` (157r) + per-process | **pp_routing_operations** routing template (order→process→remaining) | YES (structural; orders 2019) |
| `Заявка бумаги.xlsx` | `Заявка` (3580r) | **purchase_requisitions** (MM) | MED (recent, 2025) |
| `otgruska ro'yxati.xlsx` | — | shipments/deliveries (SD) | MED (2026, tiny) |
| `Iyun ishchilar.xlsx`, `Oylik diog.xlsx` | per-machine | production piece-rate / daily-KPI **schema model** | PARTIAL — 2019 historical |

Caveats (verify-don't-trust): dates are Excel serials (+1899-12-30 to convert); БАЗА salary columns are **empty** (no pay data); pre-2020 sheets = schema/model not live data; Bandlik per-process & `Rulon kv` Podrezka sheets are matrix/cross-tab (`#REF!` in places) → need unpivot/clean before import.

### 2C. Product-spec PDFs → order / material / tech-card
Filename is the master-data: `APRICOT_KOROBKA_…_5_sloy.pdf` → order `16143`, `GILOS_…_20800_KT4646.pdf` → order `20800` + tech-card `KT4646`. Title-block fields map: `GOFRA KARTON`→material_cards/raw_materials; sheet `870x845mm` + `5 sloy`→tech_cards (dims+layers); `Pantone`→color; designer `Usmonov U` / approver `X. Xusanboy` / date / `YANGI/ESKI`→design_orders metadata+workflow. PECHAT/LAK/TISNENIYA/KONGREV PDFs → MES/design production operations.

---

## 3. CODE COMPARE — import targets: EXISTS vs BUILD (live repo cross-check)

Verified in `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module`:

| Import target | Repo status | Evidence (verified) |
|---|---|---|
| `position_folders` (РД-5 card layer) | **EXISTS** (real table + repo + service), but **0 rows** + missing rich card columns | `apps/api/src/modules/org-structure/position-folder.repository.ts` — cols: `id, node_id, item_type('document'|'video'|'test'), title, url, description, lms_course_id, created_at` |
| Org-card module | **EXISTS** | `org-structure/` has org-structure + node-portret + org-export + position-folder repos/services |
| `employees` | **EXISTS** | `lib/db/src/schema/employees.ts` |
| `material_cards` | **EXISTS** | `lib/db/src/schema/mm-material-cards.ts` |
| `raw_materials` + `purchase_requisitions` | **EXISTS** | `lib/db/src/schema/mm-raw-materials.ts` |
| `warehouse_stock` | **EXISTS** | `lib/db/src/schema/wms-schema.ts` |
| `sales_orders` / `sd_sales_orders` | **EXISTS** (two-order-worlds caveat; `sd_sales_orders`=VIEW per MEMORY) | `lib/db/src/schema/sd-orders.ts`; `schema-ext-a-1.ts` stub |
| `tech_cards` / `design_orders` | **EXISTS** | `schema-ext-a-2.ts` (tech_cards); `lib/db/src/schema/pp/pp-design.ts` (design_orders) |
| `work_centers` + `production_norms` | **work_centers EXISTS**; dedicated `production_norms` / `production_outputs` tables **NOT FOUND** as pgTable | grep for `production_norms`/`production_outputs` pgTable = 0 hits → **BUILD or map to existing pp tables** |
| **Rich card fields** (maqsad, talab, portret, **tskp/ЦКП**, razryad, RBAC, ko'rsatkich) | **MOSTLY MISSING** as columns — live only as prose in ДИ .docx | no `tskp`/`razryad`/`portret`/`kerakli_xodim` columns in `lib/db/src/schema` (only `hr-recruiter.ts`/`core-schema.ts` incidental hits) → spec PHASE 2 DDL gap |
| Excel-import / employee-import / order-import tooling | **DOES NOT EXIST** | only `seed-*` (rbac, pos-movement-types, sd-marketing) found — **no .xls/.xlsx importer anywhere**; must be BUILT |
| `gate_logs` / `visitor_passes` / `canteen_meals` / `utility_readings` (Оргполитика processes) | **DO NOT EXIST** | confirmed missing — org-policy processes unbacked |

**Summary:** tables for almost all import targets already exist (people/material/order/stock/tech-card). What must be **BUILT**: (1) an **Excel/CSV import pipeline** (none exists), (2) **rich card columns** for the ДИ fields (spec PHASE 2 DDL), (3) a **РД-5 docx→position_folders loader**, (4) optional `production_norms`/`production_outputs` + the Оргполитика tables (gate/canteen) if those processes are activated.

---

## 4. ADDITIONS TO THE PLAN (org-card spec + master plan)

1. **Copy requirements canon into `docs/`** (agent-visibility) — the ~160 kitob-only vision/rules/interview `.md` (BARCHA_JAVOBLAR, OMBOR-POS-KASSIR-MASTER-REJA, INTERVYU-QARORLARI, ISHLAB-CHIQARISH-150-SAVOL, CHAT-QOIDALARI-USTOZ, QOIDALAR-BLOKI, TAHLIL-MASTER-XULOSA-2026-06-05). Raw pdf/docx/xlsx/rar need NOT live in repo.
2. **РД-5 import feature** (org-card spec §16) — docx→`position_folders` loader: parse the 5-doc kit per position → rows (document/video/test) under each node_id; harvest ЦКП lines to seed `tskp` (0/97); add a card-fields DDL (PHASE 2) for maqsad/talab/portret/ЦКП/razryad/RBAC/ko'rsatkich. The 10 РД-5 positions = ready first cards. **razryad is the one field РД-5 ДИ lacks** — ERP-added dynamic layer.
3. **Excel-import tooling** (NEW — nothing exists) — a guarded importer with Excel-serial date conversion + matrix-unpivot; priority order: employees (БАЗА) → orders (Производство 2026 04) → raw_materials+stock (Ombor rulon + Hom ashyo) → work_centers/norms (Станоклар+normalar) → routing template (Bandlik) → costing standards. This is the path to seed the near-empty `europrint` DB.
4. **Product-spec → tech-card seed** — parse PDF filename grammar `<PRODUCT>_<DIMS>_<ORDER#>_KT<techcard#>` + title-block → order/material/tech-card/design-order sample data.
5. **Design-system adoption for card UI** — pull tokens + KPI-card anatomy + React kit from `EuroPrint Design System (1)/` into the card-redesign (already aligns with Qoida 21 token policy + `artifacts/erp-dashboard`).
6. **Org-policy engine (PHASE 4)** — the 20 Оргполитикалар + `Оргполитика.docx` 17 processes → `workflow_rules`; flag the 4 missing tables (gate_logs, visitor_passes, canteen_meals, utility_readings) as owner-gated DDL. Shared chokepoint across discipline/document-route = `manager_id`=NULL (Leverage #1).

---

## EXECUTIVE SUMMARY

**Top ERP-import items (highest value, all kitob-only / NEW):**
1. **`EUROPRINT_KOKAND…БАЗА.xls`** (`Жами ишчилар`, 255 rows) → seed **employees** (no pay data — salary cols empty).
2. **`Производство 2026 04.xlsx`** (6168 rows, 2024-2026, price+status) → seed the **order world** (most current dataset).
3. **`Ombor rulon qoldig'i.xlsx`** (393 rows) → seed **raw_materials + warehouse_stock** (paper rolls + movements).
4. **РД-5 10 position folders** → seed **org-cards / `position_folders`** + harvest **ЦКП** (table exists, 0 rows); ДИ→card master, Контрольный лист→LMS salary-gate exam.
5. Machine norms (`Станоклар норма` + `normalar`) → **work_centers/norms**; product-spec PDFs → **tech_cards** (filename = order#+KT#+dims+layers).

**Biggest additions to the plan:**
- **Excel-import pipeline must be BUILT** — verified: NO .xls/.xlsx importer exists in the repo (only `seed-*` scripts). This is the single missing tool blocking the empty-DB seed.
- **РД-5 docx→card loader + PHASE 2 card-fields DDL** — `position_folders` exists but has 0 rows and lacks the rich ДИ columns (maqsad/talab/portret/ЦКП/razryad/RBAC).
- **Copy ~160 kitob-only requirements `.md` into `docs/`** — currently invisible to the in-repo executor agent.

**Current-state note:** Almost every import *target table* already exists (employees, material_cards, raw_materials, warehouse_stock, sales_orders, tech_cards, design_orders, work_centers, position_folders). The gaps are **tooling (Excel importer = 0), card-field columns, the РД-5 loader**, and 4 Оргполитика tables (gate/visitor/canteen/utility) that don't exist. `production_norms`/`production_outputs` are not present as dedicated pgTables. The РД-5 packets are a perfect physical prototype of the spec's org-card; the Excel files are real seed data for a DB that is currently ~88% empty.

**VERIFY-DON'T-TRUST flags:** РД-5 ЦКП lines, table-existence, and "no importer exists" were confirmed live against the repo. NOT independently re-opened by me: exact per-folder ЦКП for positions 1/2/4/5/8/9/10 (analyst extracted only #3 and #6); Excel row counts (from analyst, who pip-installed openpyxl/xlrd/pyxlsb read-only and deleted helper scripts); Сессия PDFs are image-only (0 text — cannot be parsed without OCR). `sd_sales_orders` is a VIEW (per MEMORY two-worlds), not a base table — import orders into the canonical base table, not the view.
