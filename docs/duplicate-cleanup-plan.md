# Duplikat Tozalash — TO'LIQ REJA

Generated: 2026-05-21

> Har bandda: **CANON** = qoladi, **DELETE** = o'chadi, **MIGRATE** = ma'lumot ko'chadi.
> Risk: 🟢 xavfsiz | 🟡 o'rta | 🔴 yuqori
> Har bandni alohida tasdiqlash mumkin (raqamga "rad" yoki "saqla" deb yozing).

---

## KATEGORIYA 1 — Kanban vs Task (DB JADVAL, 🔴 yuqori)

**Topilma:** 11 ta jadval bir xil mantiq, ikki nom bilan.

| # | DELETE | CANON | Migrate |
|---|---|---|---|
| 1.1 | `task_files` | `kanban_files` | INSERT ... SELECT |
| 1.2 | `task_result_files` | `kanban_result_files` | INSERT ... SELECT |
| 1.3 | `task_results` | `kanban_results` | INSERT ... SELECT |
| 1.4 | `task_tags` | `kanban_tags` | INSERT ... SELECT |
| 1.5 | `task_time_tracks` | `kanban_time_tracks` | INSERT ... SELECT |
| 1.6 | `task_co_executors` | `kanban_co_executors` | INSERT ... SELECT (col mapping) |
| 1.7 | `task_notifications` | `kanban_notifications` | INSERT ... SELECT |
| 1.8 | `task_observers` | `kanban_observers` | INSERT ... SELECT |
| 1.9 | `task_templates` | `kanban_templates` | INSERT ... SELECT |
| 1.10 | `task_checklists` | `kanban_checklists` | INSERT ... SELECT |
| 1.11 | `task_card_tags` | `kanban_card_tags` | INSERT ... SELECT |

**Reason canon:** "kanban_" prefiks loyihada keng tarqalgan, FE Kanban modulida ishlatiladi.
**Risk:** 🔴 — FK references kerak topish, INSERT konfliktlari (id collision) hal qilish.

---

## KATEGORIYA 2 — POS variants (🔴 yuqori)

| # | DELETE | CANON | Migrate |
|---|---|---|---|
| 2.1 | `retail_pos_transactions` | `pos_transactions` | INSERT, sync triggers |
| 2.2 | `retail_pos_products` | `pos_products` (allaqachon VIEW) | tekshirish |
| 2.3 | Drizzle `pos_movements`: pos-schema.ts, schema-ext-a-2.ts, schema-ext-b-2.ts, schema-pos-ext.ts | Canon: `pos-schema-v2.ts` (32 cols) | re-export shim |
| 2.4 | Drizzle `pos_movement_lines`: pos-schema.ts, schema-pos-ext.ts | Canon: `pos-schema-v2.ts` (16 cols) | re-export shim |
| 2.5 | Drizzle `stock_reservations`: pos-schema-v2.ts, schema-ext-c-3.ts | Canon: `mm-batch-mgmt.ts` (21 cols) | re-export shim |

**Reason canon:** `pos-schema-v2.ts` eng to'liq (memory'da 2026-05-20 da master data unification natijasi).

---

## KATEGORIYA 3 — INVOICE (🔴 kritik biznes)

| # | DELETE | CANON | Migrate |
|---|---|---|---|
| 3.1 | `invoices` (legacy) | `sd_invoices` | data ko'chirish + VIEW shim |
| 3.2 | `crm_invoices` (separate from sd_invoices?) | tekshirish kerak — agar same data → `sd_invoices` | — |
| 3.3 | `crm_invoice_payments` | `finance_payments` | INSERT ... SELECT |
| 3.4 | `crm_invoice_products` | `crm_proposal_products` (86% overlap) yoki bo'sh — tekshirish | — |

**Endpoint dups:**
- `/api/finance/invoices` (canon)
- `/api/crm/invoices` (delete — proxy redirect)
- `/api/crm-bitrix/invoices` (delete)
- `/api/legacy/fi/invoices` (delete)

**Reason canon:** Sales domain → sd_invoices; Finance payments → finance_payments.
**Risk:** 🔴 — biznes-kritik data, audit qoldirish kerak.

---

## KATEGORIYA 4 — Master data ekstraktsiya (🟡 o'rta)

### 4.1 `category` ustuni — 66 jadval ishlatadi

**Hozir:** Har jadvalda alohida string `category` ustuni.
**Plan:** Yangi master `master_categories` jadvali (id, name, name_ru, parent_id, scope).
**Migrate:** Har jadvalda `category` → `category_id` (FK). Sekin-asta, alohida sessiyada.
**Risk:** 🟡 — 66 jadval o'zgaradi, lekin oddiy text → integer FK.

### 4.2 `material_id` vs `material_card_id` — yagona nom

| Hozir | Tavsiya |
|---|---|
| `material_id` (46 jadval) | CANON |
| `material_card_id` (36 jadval) | DELETE, ALTER → `material_id` |

**Migrate:** `ALTER TABLE X RENAME COLUMN material_card_id TO material_id`.
**Risk:** 🟡 — 36 jadvalda ALTER + BE kod yangilash kerak.

### 4.3 `currency` ustuni — 64 jadval

**Hozir:** Free-text `currency` (UZS, USD, ...).
**Plan:** Yangi `currencies` master (id, code, name, symbol, exchange_rate).
**Migrate:** Sekin — yangi feature, eskini saqlash mumkin.
**Risk:** 🟢 — additive, yo'qotmaydi.

---

## KATEGORIYA 5 — HR Drizzle dublikatlari (🟡 o'rta)

Hammasi schema-level — ma'lumot bir jadvalda, faqat Drizzle ta'rif ikkilangan.

| # | DELETE (Drizzle) | CANON (Drizzle) |
|---|---|---|
| 5.1 | `hr-personal-core.ts:attendance` (8 cols), `schema-business-c-2-hr-payroll.ts`, `schema-hr-lms.ts` | `attendance.ts:attendance` (17 cols) |
| 5.2 | `hr-personal-core.ts:disciplineRecords` (6 cols), `schema-business-a-1.ts` (25 cols) | `discipline.ts:disciplineRecords` (27 cols) |
| 5.3 | `skills.ts:employeeSkills` (12 cols), `schema-business-c-3.ts` (10 cols) | `hr-performance-ext.ts:employeeSkills` (20 cols) |
| 5.4 | `kpi.ts:employeeRatings` (14 cols), `schema-ext-c-2.ts` (6 cols) | `hr-performance-ext.ts:employeeRatings` (25 cols) |
| 5.5 | `kpi.ts:employeeDailyKpi` (13 cols), `schema-ext-c-2.ts` (5 cols) | `hr-performance-ext.ts:employeeDailyKpi` (20 cols) |
| 5.6 | `hr-compensation.ts:adaptationPrograms`, `schema-business-c-2-hr-safety.ts` | `adaptation.ts:adaptationPrograms` (10 cols) |
| 5.7 | `hr-performance-core.ts:adaptationRecords` (15 cols), `schema-business-c-2-hr-safety.ts` (7 cols) | `adaptation.ts:adaptationRecords` (19 cols) |
| 5.8 | `hr-safety.ts:employee360Assessments` (8 cols), `schema-business-c-2-hr-payroll.ts` (13 cols) | `assessment.ts:employee360Assessments` (16 cols) |
| 5.9 | `hr-safety.ts:successionPlans` (8 cols), `schema-ext-c-2.ts` (7 cols) | `assessment.ts:successionPlans` (11 cols) |
| 5.10 | `hr-safety.ts:attendanceRecords` (7 cols), `schema-ext-b-2.ts` (8 cols) | `attendance.ts:attendanceRecords` (10 cols) |
| 5.11 | `schema-business-c-2-hr-safety.ts:safetyIncidents` (11 cols), `hr-safety.ts` (10 cols) | `safety.ts:safetyIncidents` (25 cols) |
| 5.12 | `hr-safety.ts:ppeCompliance` (6 cols), `schema-business-c-2-hr-safety.ts` (7 cols) | `safety.ts:ppeCompliance` (10 cols) |
| 5.13 | `hr-safety.ts:hazardZones` (10 cols), `schema-business-c-2-hr-safety.ts` (11 cols) | `safety.ts:hazardZones` (12 cols) |
| 5.14 | `hr-safety.ts:shiftSwapRequests` (12 cols), `schema-ext-c-2.ts` (6 cols) | `shifts.ts:shiftSwapRequests` (11 cols)* |
| 5.15 | `payroll.ts:salaryHistory` (31 cols)*, `schema-business-c-2-hr-payroll.ts` (10 cols) | `payroll.ts:salaryHistory` (31 cols) |
| 5.16 | `hr-employees-docs.ts:leaveRequests` (11 cols), `schema-hr-lms.ts` (15 cols) | `leave.ts:leaveRequests` (23 cols) |
| 5.17 | `employees.ts:employeeFiles` (10 cols), `hr-compensation.ts` (4), `schema-ext-c-2.ts` (6) | `employees.ts:employeeFiles` (10 cols) |
| 5.18 | `hr-architecture-additions.ts:aiCvScreenings` (15 cols), `recruitment.ts` (14 cols) | `hr-performance-ext.ts:aiCvScreenings` (20 cols) |
| 5.19 | `recruitment.ts:aiInterviewSessions` (15 cols), `schema-ext-c-3.ts` (8 cols) | `hr-performance-ext.ts:aiInterviewSessions` (14 cols)* |
| 5.20 | `hr-architecture-additions.ts:jobTemplates` (14), `recruitment.ts` (11) | `hr-questionnaire.ts:jobTemplates` (23 cols) |

**Total HR: 20 ta jadval pgTable o'chirish + canon shim.**

---

## KATEGORIYA 6 — Finance Drizzle dups (🟢 xavfsiz)

| # | DELETE | CANON |
|---|---|---|
| 6.1 | `schema-compat-5.ts:customer_payments` (18 cols), `schema-finance-extended.ts` (7 cols) | `fi-ap-core.ts:customerPayments` (13 cols) |
| 6.2 | `schema-ext-b-2.ts:budgetLines` (7), `schema-finance-budgets.ts` (6) | `fi-budgets.ts:budgetLines` (8 cols) |
| 6.3 | `schema-business-b-1.ts:accountingPeriods` (7), `schema-finance-extended.ts` (7) | `fi-gl.ts:accountingPeriods` (5 cols)* |
| 6.4 | `schema-ext-b-1.ts:incomeExpenseTransactions` (8), `schema-finance-extended.ts` (6) | `fi-kassa.ts:incomeExpenseTransactions` (12 cols) |

---

## KATEGORIYA 7 — Marketing/Campaigns dublikati

| # | DELETE | CANON | Migrate |
|---|---|---|---|
| 7.1 | `campaigns` (12 cols) | `marketing_campaigns` (16 cols) | INSERT ... SELECT |

**Reason canon:** `marketing_campaigns` ko'proq field, marketing domain.

---

## KATEGORIYA 8 — LMS Drizzle dups (🟡 o'rta)

| # | DELETE | CANON |
|---|---|---|
| 8.1 | `lms-schema.ts:courses` (10), `schema-ext-a-1.ts:courses_table` (3) | `lms.ts:courses` (18 cols) |
| 8.2 | `lms-schema.ts:lessons` (8), `schema-ext-a-1.ts` (4) | `lms.ts:lessons` (13 cols) |
| 8.3 | `hr-questionnaire.ts:certificates` (6), `schema-ext-a-1.ts` (3) | `lms.ts:certificates` (10 cols) |
| 8.4 | `hr-architecture-additions.ts:questionnaireTemplates` (8), `schema-ext-a-1.ts` (5) | `hr-questionnaire.ts:questionnaireTemplates` (7 cols) yoki `recruitment.ts` (8 cols)* |
| 8.5 | `hr-architecture-additions.ts:questionnaireQuestions` (8), `schema-business-c-1.ts` (8) | `recruitment.ts:questionnaireQuestions` (10 cols) |
| 8.6 | `mm-inventory.ts:inventoryCounts` (15), `schema-ext-c-3.ts` (6), `schema-finance-extended.ts` (7) | `schema-pos-ext.ts:inventoryCounts` (10 cols)* — yoki mm-inventory canon |

---

## KATEGORIYA 9 — Core master data (🔴 kritik)

### 9.1 `users` — 3 ta Drizzle ta'rif

| DELETE | CANON |
|---|---|
| `users.ts:users` (17 cols), `schema-core.ts:users` (13 cols) | `core-users.ts:users` (44 cols) |

### 9.2 `notifications` — 3 ta

| DELETE | CANON |
|---|---|
| `schema-business-a-1.ts:notificationsApp` (10 cols), `schema-misc.ts:notifications` (9 cols) | `core-users.ts:notifications` (9 cols)* |

### 9.3 `audit_logs` — 3 ta

| DELETE | CANON |
|---|---|
| `schema-core.ts:auditLogs` (9 cols), `schema-rbac.ts:auditLogs` (15 cols) | `core-ai-reports.ts:auditLogs` (15 cols)* |

### 9.4 `documents` — biznes hujjatlar

| DELETE | CANON |
|---|---|
| `hr-v2-schema.ts:hrDocuments` (12), `schema-ext-a-2.ts` (10) | `schema-business-a-1.ts:hrDocuments` (16 cols) |

---

## KATEGORIYA 10 — Endpoint duplicate paths (🟡 o'rta)

### 10.1 Same controller, same path multiple times — Express conflict!

| Path | Fayl | Holat |
|---|---|---|
| `/camera-alerts` | camera-alerts.controller.ts | **9 marta!** — ortiqcha o'chirish |
| `/micro-modules` | lms-misc.controller.ts | 6 marta — o'chirish |
| `/warehouses` | resources.controller.ts | 4 marta — o'chirish |
| `/hr-v2/daily-reports/employee/:id` | daily-report.controller.ts | 2 marta same file |

**Plan:** Har faylda dublikat @Get/@Post/... ni manual ko'rib chiqib, ortiqchasini o'chirish.

### 10.2 hr-dashboard-stubs vs hr-dashboard

- `hr-dashboard-stubs.controller.ts` — eski stub controller
- `hr-dashboard.controller.ts` — real implementation

Ikkalasi bir xil endpoint'larga ega (`/hr/adaptation/:id`, `/hr/alumni/:id`, `/hr/daily-reports`, va h.k.) — **20+ overlap**.

**Plan:** `hr-dashboard-stubs.controller.ts` — to'liq DELETE.

---

## KATEGORIYA 11 — Endpoint semantik canonization (🟡 o'rta)

### 11.1 `/stats` — 49 ta URL

**Plan:** Module prefix bilan canon path. Misol:
- ✅ `/api/hr/stats` (canon — HR module)
- ✅ `/api/sales/stats` (canon — sales)
- ✅ `/api/warehouse/stats` (canon — warehouse)
- ❌ `/api/{anything}/stats` duplicate'lar — redirect canon'ga

### 11.2 `/dashboard` — 25 URL

| Saqlash | O'chirish |
|---|---|
| `/api/ai-hr/dashboard` (canon ai-hr) | — |
| `/api/finance/dashboard` (canon finance) | — |
| `/api/mes/dashboard-home` (canon mes) | `/api/mes/dashboard` (dup) |
| `/api/qc/dashboard-home` (canon qc) | `/api/qc/dashboard` (dup) |

### 11.3 `/orders` — 14 URL

| Saqlash | O'chirish |
|---|---|
| `/api/sd/orders` (canon — sales) | `/api/erp/orders` (dup) |
| `/api/production/orders` (canon — MES) | `/api/iot/tablet/orders` (subroute, canon stays) |
| `/api/design/orders` (canon — design) | `/api/mes/orders` (dup) |

### 11.4 `/employees` — 13 URL

| Saqlash | O'chirish |
|---|---|
| `/api/employees` (canon — main) | `/api/hr-map/employees` (move to query param) |
| `/api/employees/:id` (detail) | `/api/chat/employees` (proxy canon) |

### 11.5 `/invoices`, `/movements`, `/materials`, `/courses`, `/leads`, `/assets`

Har biri uchun bir canon endpoint, qolganlari shim/redirect.

---

## KATEGORIYA 12 — FE multi-route Extended pages (🟢 keep)

**Holat:** 12 ta sahifa 5+ URL'ga ulangan (`TechPPExtended` — 12 URL, `DesignExtended` — 8, va h.k.).

**Qaror:** SAQLASH (modul mantig'i tab/sub-page kerak). Sub-pages alohida sahifa qilish — ortiqcha.

**Reason:** Bu Extended sahifalar tab bilan ko'rsatadi, single page application pattern. Yangi sahifa yaratish faqat hajm sababli kerak emas.

---

## KATEGORIYA 13 — Archive cleanup (🟢 xavfsiz)

| DELETE | Sabab |
|---|---|
| `_archive_departments_2026_05_21` | Backup, asl tiklangan, kerak emas |
| `_archive_positions_2026_05_21` | Same |

---

## YAKUN

| Kategoriya | Ta'sir | Risk |
|---|---|---|
| 1. Kanban vs Task (11 jadval) | DB jadval ko'chirish | 🔴 |
| 2. POS variants (5 jadval/dup) | Schema + data merge | 🔴 |
| 3. Invoices (4-5 jadval) | Biznes data merge | 🔴 |
| 4. Master data ekstraktsiya | 66+ jadval refactor | 🟡 |
| 5. HR Drizzle dups (20 jadval) | Drizzle re-export | 🟡 |
| 6. Finance Drizzle dups | Drizzle re-export | 🟢 |
| 7. Marketing campaigns (1) | DB merge | 🟢 |
| 8. LMS Drizzle dups (6) | Drizzle re-export | 🟢 |
| 9. Core users/notifications/audit | Drizzle re-export | 🟡 |
| 10. Endpoint dup paths | Controller cleanup | 🟡 |
| 11. Endpoint canonization | Multi-controller refactor | 🟡 |
| 12. FE Extended pages | SAQLASH | 🟢 |
| 13. Archive cleanup | DROP 2 ta archive | 🟢 |

## Boshlash tartibi tavsiyam

1. **K13 (Archive)** — xavfsiz, 5 daqiqa
2. **K6 (Finance Drizzle)** — xavfsiz, 30 daqiqa
3. **K8 (LMS Drizzle)** — xavfsiz, 30 daqiqa
4. **K5 (HR Drizzle 20 jadval)** — 1-2 soat
5. **K9 (Core users/notif/audit)** — 1 soat
6. **K10 (Endpoint dup paths)** — 1 soat
7. **K7 (Marketing campaigns merge)** — 30 daqiqa
8. **K2 (POS variants)** — 1-2 soat, real DB merge
9. **K11 (Endpoint canonization)** — 2-3 soat
10. **K1 (Kanban/Task merge)** — 2-3 soat, real DB merge
11. **K3 (Invoices merge)** — 2-3 soat, kritik biznes
12. **K4 (Master data ekstraktsiya)** — alohida sprint, ko'p sessiya

## Tasdiqlash usuli

Quyidagi formatda yozing:
```
K1: TASDIQLANDI (yoki: K1.5 saqla, K1.7 rad)
K2: TASDIQLANDI
K3: K3.2 ni keyinroq qaytaramiz, qolganlari TASDIQLANDI
...
K12: SAQLA (keep)
K13: TASDIQLANDI
```

Bajarish tartibi 1→13 (xavfsizdan kritikgacha). Har biri tugagandan keyin BE+FE typecheck + endpoint probe.
