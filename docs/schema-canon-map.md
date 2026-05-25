# Phase 2 — Duplicate pgTable canon recommendations

Total duplicates: 295, live: 240

## `employees` 🔴 LIVE (114 live fayl, DB 69 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/employees.ts` (`employees`, 53/53)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-lms.ts` (`employees`, 13/13)

## `users` 🔴 LIVE (70 live fayl, DB 52 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-users.ts` (`users`, 44/44)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/users.ts` (`users`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts` (`users`, 13/13)

## `sales_orders` 🔴 LIVE (38 live fayl, DB 49 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-orders.ts` (`salesOrders`, 32/32)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts` (`sales_orders`, 19/19)

## `departments` 🔴 LIVE (35 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-users.ts` (`departments`, 20/20)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/departments.ts` (`departments`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-lms.ts` (`departments`, 9/9)

## `positions` 🔴 LIVE (35 live fayl, DB 28 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-users.ts` (`positions`, 24/24)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/positions.ts` (`positions`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-rbac.ts` (`rbacPositions`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-lms.ts` (`positions`, 10/10)

## `warehouses` 🔴 LIVE (33 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts` (`warehouses`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-wms.ts` (`warehouses`, 9/9)

## `production_orders` 🔴 LIVE (25 live fayl, DB 36 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-production.ts` (`productionOrders`, 29/29)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-manufacturing.ts` (`production_orders`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-3.ts` (`production_orders_int`, 14/14)

## `pos_movements` 🔴 LIVE (23 live fayl, DB 55 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`posMovements`, 32/32)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema.ts` (`posMovements`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-2.ts` (`pos_movements_legacy`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-ext.ts` (`pos_movements`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`pos_movements`, 7/7)

## `crm_deals` 🔴 LIVE (18 live fayl, DB 46 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-pipelines.ts` (`crmDeals`, 19/19)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`crm_deals`, 8/8)

## `warehouse_stock` 🔴 LIVE (17 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts` (`warehouseStock`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`warehouse_stock`, 5/5)

## `pos_movement_lines` 🔴 LIVE (16 live fayl, DB 29 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`posMovementLines`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema.ts` (`posMovementLines`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-ext.ts` (`pos_movement_lines`, 11/11)

## `work_centers` 🔴 LIVE (15 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pp.ts` (`ppWorkCenters`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-manufacturing.ts` (`work_centers`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-production.ts` (`workCenters`, 10/10)

## `crm_leads` 🔴 LIVE (11 live fayl, DB 34 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-contacts.ts` (`crmLeads`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`crm_leads`, 10/10)

## `courses` 🔴 LIVE (11 live fayl, DB 31 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms.ts` (`courses`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-schema.ts` (`courses`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`courses_table`, 3/3)

## `sd_customers` 🔴 LIVE (11 live fayl, DB 36 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-europrint-schema.ts` (`sdCustomers`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`sd_customers`, 8/8)

## `mm_materials` 🔴 LIVE (11 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`mm_materials_int`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-2.ts` (`mm_materials_ext`, 4/4)

## `attendance` 🔴 LIVE (10 live fayl, DB 25 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/attendance.ts` (`attendance`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts` (`hr_attendance`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-personal-core.ts` (`attendance`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-lms.ts` (`attendance`, 8/8)

## `kanban_cards` 🔴 LIVE (10 live fayl, DB 29 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-core.ts` (`kanbanCards`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`kanbanCards`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-kanban.ts` (`kanbanCards`, 12/12)

## `pos_movement_types` 🔴 LIVE (10 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema.ts` (`posMovementTypes`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-ext.ts` (`pos_movement_types`, 7/7)

## `discipline_records` 🔴 LIVE (9 live fayl, DB 43 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/discipline.ts` (`disciplineRecords`, 27/27)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`discipline_records`, 25/25)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-personal-core.ts` (`disciplineRecords`, 6/6)

## `vacancies` 🔴 LIVE (9 live fayl, DB 41 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`vacancies`, 21/21)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-questionnaire.ts` (`vacancies`, 12/12)

## `hr_candidate_funnels` 🔴 LIVE (9 live fayl, DB 23 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-recruiter.ts` (`hrCandidateFunnels`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`hr_candidate_funnels`, 7/7)

## `mm_purchase_orders` 🔴 LIVE (9 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`mm_purchase_orders`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`mm_purchase_orders_ext`, 9/9)

## `notifications` 🔴 LIVE (8 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`notificationsApp`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-users.ts` (`notifications`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc.ts` (`notifications`, 9/9)

## `candidates` 🔴 LIVE (8 live fayl, DB 30 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`candidates`, 20/20)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-questionnaire.ts` (`candidates`, 9/9)

## `hr_daily_reports` 🔴 LIVE (8 live fayl, DB 20 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`hrDailyReports`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`hr_daily_reports`, 11/11)

## `cameras` 🔴 LIVE (8 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-iot.ts` (`cameras`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`cameras`, 13/13)

## `camera_events` 🔴 LIVE (8 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`cameraEvents`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-iot.ts` (`camera_events`, 11/11)

## `routings` 🔴 LIVE (8 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-production.ts` (`routings`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-3.ts` (`routings_int`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-manufacturing.ts` (`routings`, 7/7)

## `audit_logs` 🔴 LIVE (7 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai-reports.ts` (`auditLogs`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-rbac.ts` (`auditLogs`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts` (`audit_logs`, 9/9)

## `employee_org_departments` 🔴 LIVE (7 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core-schema.ts` (`employeeOrgDepartments`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`employee_org_departments`, 5/5)

## `pos_barcode_print_queue` 🔴 LIVE (7 live fayl, DB 25 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`posBarcodePrintQueue`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`pos_barcode_print_queue`, 9/9)

## `sd_leads` 🔴 LIVE (7 live fayl, DB 22 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-europrint-schema.ts` (`sdLeads`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`sd_leads`, 13/13)

## `sales_invoices` 🔴 LIVE (7 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-misc.ts` (`sales_invoices`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-orders.ts` (`salesInvoices`, 12/12)

## `crm_activities` 🔴 LIVE (6 live fayl, DB 37 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`crm_activities`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-deal-products.ts` (`crmActivities`, 9/9)

## `salary_history` 🔴 LIVE (6 live fayl, DB 39 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/payroll.ts` (`salaryHistory`, 31/31)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts` (`salary_history`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`salaryHistory`, 8/8)

## `certificates` 🔴 LIVE (6 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms.ts` (`certificates`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-questionnaire.ts` (`certificates`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`certificates_table`, 3/3)

## `offboarding_cases` 🔴 LIVE (6 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`offboardingCases`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`offboarding_cases`, 10/10)

## `camera_zones` 🔴 LIVE (6 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`cameraZones`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-iot.ts` (`camera_zones`, 6/6)

## `purchase_invoices` 🔴 LIVE (6 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`purchase_invoices`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-raw-materials.ts` (`purchaseInvoices`, 10/10)

## `employee_liability_cases` 🔴 LIVE (6 live fayl, DB 32 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`employeeLiabilityCases`, 23/23)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`employee_liability_cases`, 7/7)

## `downtime_events` 🔴 LIVE (6 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-iot.ts` (`downtimeEvents`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-manufacturing.ts` (`downtime_events`, 11/11)

## `warehouse_transactions` 🔴 LIVE (6 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts` (`warehouseTransactions`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`warehouse_transactions`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`warehouseTransactions`, 7/7)

## `employee_360_assessments` 🔴 LIVE (5 live fayl, DB 23 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/assessment.ts` (`employee360Assessments`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts` (`employee_360_assessments`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`employee360Assessments`, 8/8)

## `crm_contacts` 🔴 LIVE (5 live fayl, DB 27 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-contacts.ts` (`crmContacts`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`crm_contacts`, 7/7)

## `customer_payments` 🔴 LIVE (5 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-compat-5.ts` (`customer_payments`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-ap-core.ts` (`customerPayments`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`customerPayments`, 7/7)

## `employee_skills` 🔴 LIVE (5 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`employeeSkills`, 20/20)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-3.ts` (`employee_skills`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/skills.ts` (`employeeSkills`, 12/12)

## `employee_blocks` 🔴 LIVE (5 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`employee_blocks`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`employeeBlocks`, 9/9)

## `hr_documents` 🔴 LIVE (5 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`hr_documents`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`hrDocuments`, 11/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-2.ts` (`hr_documents_legacy`, 10/10)

## `shift_schedules` 🔴 LIVE (5 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`shiftSchedules`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`shift_schedules`, 8/9)

## `iot_sensors` 🔴 LIVE (5 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`iotSensors`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`iot_sensors`, 6/6)

## `kanban_boards` 🔴 LIVE (5 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-kanban.ts` (`kanbanBoards`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-core.ts` (`kanbanBoards`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`kanbanBoards`, 6/6)

## `kanban_columns` 🔴 LIVE (5 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-core.ts` (`kanbanColumns`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`kanbanColumns`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-kanban.ts` (`kanbanColumns`, 8/8)

## `inventory_counts` 🔴 LIVE (5 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-inventory.ts` (`inventoryCounts`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-ext.ts` (`inventory_counts`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`inventoryCounts`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`inventory_counts`, 6/6)

## `purchase_orders` 🔴 LIVE (5 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-wms.ts` (`purchase_orders`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-raw-materials.ts` (`purchaseOrders`, 8/8)

## `inventory_barcode_assignments` 🔴 LIVE (5 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema.ts` (`inventoryBarcodeAssignments`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`inventory_barcode_assignments`, 3/4)

## `equipment` 🔴 LIVE (5 live fayl, DB 27 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-production.ts` (`equipment`, 24/24)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`equipment`, 8/8)

## `qc_reclamations` 🔴 LIVE (5 live fayl, DB 29 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/qc-schema.ts` (`qcReclamations`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-qc.ts` (`qc_reclamations`, 13/13)

## `materials` 🔴 LIVE (5 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-ext.ts` (`materials`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-2.ts` (`materials_legacy`, 7/7)

## `mm_vendors` 🔴 LIVE (5 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-qc.ts` (`mm_vendors`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`mm_vendors_ext2`, 5/9)

## `budgets` 🔴 LIVE (4 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-budgets.ts` (`budgets`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-ap-core.ts` (`budgets`, 8/8)

## `accounts` 🔴 LIVE (4 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`accounts`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`accounts`, 8/8)

## `gl_documents` 🔴 LIVE (4 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`gl_documents`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`glDocuments`, 11/11)

## `payroll_periods` 🔴 LIVE (4 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`payrollPeriods`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts` (`payroll_periods_hr`, 10/10)

## `income_expense_transactions` 🔴 LIVE (4 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-kassa.ts` (`incomeExpenseTransactions`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`income_expense_transactions`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`incomeExpenseTransactions`, 6/6)

## `absence_tracking` 🔴 LIVE (4 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`absenceTracking`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`absence_tracking`, 11/11)

## `gamification_points` 🔴 LIVE (4 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`gamification_points`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`gamificationPoints`, 7/7)

## `gamification_totals` 🔴 LIVE (4 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`gamification_totals`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`gamificationTotals`, 6/6)

## `enps_surveys` 🔴 LIVE (4 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`enps_surveys`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`enpsSurveys`, 10/10)

## `iot_sensor_readings` 🔴 LIVE (4 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`iot_sensor_readings`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`iotSensorReadings`, 5/5)

## `lms_certificates` 🔴 LIVE (4 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-extended.ts` (`lmsCertificates`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`lms_certificates`, 5/5)

## `pos_inventory_count_lines` 🔴 LIVE (4 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`posInventoryCountLines`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`pos_inventory_count_lines`, 1/3)

## `position_permissions` 🔴 LIVE (4 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/position-permissions.ts` (`positionPermissions`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-rbac.ts` (`positionPermissions`, 5/5)

## `sd_payments` 🔴 LIVE (4 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-europrint-schema.ts` (`sdPayments`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`sd_payments`, 6/6)

## `boms` 🔴 LIVE (4 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-3.ts` (`boms_int`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-manufacturing.ts` (`boms`, 7/7)

## `adaptation_programs` 🔴 LIVE (3 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/adaptation.ts` (`adaptationPrograms`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-compensation.ts` (`adaptationPrograms`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`adaptation_programs`, 6/6)

## `adaptation_records` 🔴 LIVE (3 live fayl, DB 28 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/adaptation.ts` (`adaptationRecords`, 19/19)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-core.ts` (`adaptationRecords`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`adaptation_records`, 7/7)

## `adaptation_milestones` 🔴 LIVE (3 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/adaptation.ts` (`adaptationMilestones`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`adaptation_milestones`, 8/8)

## `approval_requests` 🔴 LIVE (3 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-budgets.ts` (`approval_requests`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai-reports.ts` (`approvalRequests`, 14/14)

## `crm_lead_stages` 🔴 LIVE (3 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-deal-products.ts` (`crmLeadStages`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`crm_lead_stages`, 5/5)

## `employee_files` 🔴 LIVE (3 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/employees.ts` (`employeeFiles`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`employee_files`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-compensation.ts` (`employeeFiles`, 4/4)

## `budget_lines` 🔴 LIVE (3 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-budgets.ts` (`budgetLines`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`budget_lines`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-budgets.ts` (`budget_lines`, 6/6)

## `cost_centers` 🔴 LIVE (3 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`costCenters`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`cost_centers`, 9/9)

## `profit_centers` 🔴 LIVE (3 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`profit_centers`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`profitCenters`, 8/8)

## `leave_requests` 🔴 LIVE (3 live fayl, DB 33 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/leave.ts` (`leaveRequests`, 23/23)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-lms.ts` (`leave_requests`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`leaveRequests`, 11/11)

## `safety_incidents` 🔴 LIVE (3 live fayl, DB 28 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/safety.ts` (`safetyIncidents`, 25/25)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`safety_incidents`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`safetyIncidents`, 10/10)

## `hr_conflict_reports` 🔴 LIVE (3 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts` (`hr_conflict_reports`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`hrConflictReports`, 7/7)

## `violation_catalog` 🔴 LIVE (3 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`violationCatalog`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`violation_catalog`, 11/11)

## `badge_catalog` 🔴 LIVE (3 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`badgeCatalog`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`badge_catalog`, 11/11)

## `pip_plans` 🔴 LIVE (3 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`pip_plans`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`pipPlans`, 14/14)

## `document_approval_steps` 🔴 LIVE (3 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`documentApprovalSteps`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`document_approval_steps`, 6/8)

## `hr_interview_sessions` 🔴 LIVE (3 live fayl, DB 28 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`hr_interview_sessions`, 28/28)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`hrInterviewSessions`, 23/23)

## `iot_alerts` 🔴 LIVE (3 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`iotAlerts`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`iot_alerts`, 7/7)

## `lessons` 🔴 LIVE (3 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms.ts` (`lessons`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-schema.ts` (`lessons`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`lessons`, 4/4)

## `stock_reservations` 🔴 LIVE (3 live fayl, DB 31 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-batch-mgmt.ts` (`stockReservations`, 21/21)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`posStockReservations`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`stock_reservations`, 8/8)

## `three_way_match_results` 🔴 LIVE (3 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-mro.ts` (`threeWayMatchResults`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`three_way_match_results`, 7/7)

## `mro_items` 🔴 LIVE (3 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-mro.ts` (`mroItems`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2-mro.ts` (`mro_items`, 11/11)

## `goods_receipts` 🔴 LIVE (3 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-purchase.ts` (`goodsReceipts`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`goods_receipts`, 9/9)

## `employee_inventory_ledger` 🔴 LIVE (3 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`employeeInventoryLedger`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`employee_inventory_ledger`, 3/6)

## `design_orders` 🔴 LIVE (3 live fayl, DB 29 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-design.ts` (`designOrders`, 24/24)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc.ts` (`design_orders`, 22/22)

## `sd_customer_contacts` 🔴 LIVE (3 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-customer-relations.ts` (`sdCustomerContacts`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`sd_customer_contacts`, 6/6)

## `sd_customer_documents` 🔴 LIVE (3 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-customer-relations.ts` (`sdCustomerDocuments`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`sd_customer_documents`, 5/5)

## `sd_customer_competitors` 🔴 LIVE (3 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-customer-relations.ts` (`sdCustomerCompetitors`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`sd_customer_competitors`, 5/5)

## `sd_contracts` 🔴 LIVE (3 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-europrint-schema.ts` (`sdContracts`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-misc.ts` (`sd_contracts`, 10/10)

## `mm_goods_receipts` 🔴 LIVE (3 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`mm_goods_receipts_int`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`mm_goods_receipts`, 5/8)

## `employee_assets` 🔴 LIVE (3 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-2.ts` (`employee_assets`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc.ts` (`employee_assets`, 9/9)

## `asset_items` 🔴 LIVE (2 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`asset_items`, 15/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/admin-assets.ts` (`assetItems`, 14/15)

## `ai_report_categories` 🔴 LIVE (2 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai-reports.ts` (`aiReportCategories`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`ai_report_categories`, 7/7)

## `ai_report_subscriptions` 🔴 LIVE (2 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai-reports.ts` (`aiReportSubscriptions`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`ai_report_subscriptions`, 6/6)

## `hr_health_checkups` 🔴 LIVE (2 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core-schema.ts` (`hrHealthCheckups`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts` (`hr_health_checkups`, 9/9)

## `crm_proposals` 🔴 LIVE (2 live fayl, DB 26 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-proposals.ts` (`crmProposals`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`crm_proposals`, 8/8)

## `crm_invoices` 🔴 LIVE (2 live fayl, DB 30 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-proposals.ts` (`crmInvoices`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`crm_invoices`, 7/7)

## `entries` 🔴 LIVE (2 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`entries`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`entries`, 7/7)

## `gl_lines` 🔴 LIVE (2 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`glLines`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`gl_lines`, 10/10)

## `accounting_periods` 🔴 LIVE (2 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`accounting_periods`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`accountingPeriods`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`accountingPeriods`, 5/5)

## `cash_transactions` 🔴 LIVE (2 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-kassa.ts` (`cashTransactions`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`cashTransactions`, 7/7)

## `questionnaire_templates` 🔴 LIVE (2 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`questionnaireTemplates`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`questionnaireTemplates`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-questionnaire.ts` (`questionnaireTemplates`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`questionnaire_templates`, 5/5)

## `questionnaire_questions` 🔴 LIVE (2 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`questionnaireQuestions`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`questionnaireQuestions`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-questionnaire.ts` (`questionnaireQuestions`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`questionnaire_questions`, 8/8)

## `adaptation_feedback` 🔴 LIVE (2 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`adaptation_feedback`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-core.ts` (`adaptationFeedback`, 4/4)

## `employee_ratings` 🔴 LIVE (2 live fayl, DB 39 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`employeeRatings`, 25/25)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kpi.ts` (`employeeRatings`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`employee_ratings`, 6/6)

## `hr_tz2_attendance_photos` 🔴 LIVE (2 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-tz2-schema.ts` (`hrTz2AttendancePhotos`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-tz2.ts` (`hr_tz2_attendance_photos`, 9/9)

## `career_paths` 🔴 LIVE (2 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`careerPaths`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`career_paths`, 9/10)

## `skill_catalog` 🔴 LIVE (2 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`skillCatalog`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-misc.ts` (`skill_catalog`, 7/7)

## `hr_interview_questions` 🔴 LIVE (2 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`hrInterviewQuestions`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`hr_interview_questions`, 2/2)

## `ideal_rasm_targets` 🔴 LIVE (2 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/ideal-rasm-schema.ts` (`idealRasmTargets`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`ideal_rasm_targets`, 9/9)

## `camera_alerts` 🔴 LIVE (2 live fayl, DB 20 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`cameraAlerts`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-iot.ts` (`camera_alerts`, 13/13)

## `lms_exams` 🔴 LIVE (2 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-extended.ts` (`lmsExams`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`lms_exams`, 5/5)

## `lms_exam_attempts` 🔴 LIVE (2 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-extended.ts` (`lmsExamAttempts`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`lms_exam_attempts`, 6/6)

## `tests` 🔴 LIVE (2 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms.ts` (`tests`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-schema.ts` (`tests`, 11/11)

## `inventory_count_lines` 🔴 LIVE (2 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-inventory.ts` (`inventoryCountLines`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-ext.ts` (`inventory_count_lines`, 11/11)

## `mro_cleaning_schedules` 🔴 LIVE (2 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2-mro.ts` (`mro_cleaning_schedules`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-logistics.ts` (`mroCleaningSchedules`, 8/8)

## `mro_utility_readings` 🔴 LIVE (2 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2-mro.ts` (`mro_utility_readings`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-logistics.ts` (`mroUtilityReadings`, 8/8)

## `mro_facilities` 🔴 LIVE (2 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-logistics.ts` (`mroFacilities`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2-mro.ts` (`mro_facilities`, 8/8)

## `vendor_invoices` 🔴 LIVE (2 live fayl, DB 26 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-mro.ts` (`vendorInvoices`, 22/22)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`vendor_invoices`, 10/10)

## `mro_requests` 🔴 LIVE (2 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-mro.ts` (`mroRequests`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2-mro.ts` (`mro_requests`, 13/13)

## `mro_budgets` 🔴 LIVE (2 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-mro.ts` (`mroBudgets`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`mro_budgets`, 8/8)

## `raw_materials` 🔴 LIVE (2 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-raw-materials.ts` (`rawMaterials`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`raw_materials`, 10/10)

## `vendors` 🔴 LIVE (2 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/mm-raw-materials.ts` (`vendors`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-wms.ts` (`vendors`, 10/10)

## `ow_orders` 🔴 LIVE (2 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-order-workflow.ts` (`owOrders`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/order-workflow-schema.ts` (`owOrders`, 15/15)

## `ow_material_requirements` 🔴 LIVE (2 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/order-workflow-schema.ts` (`owMaterialRequirements`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-order-workflow.ts` (`owMaterialRequirements`, 8/8)

## `ow_payment_plan_entries` 🔴 LIVE (2 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/order-workflow-schema.ts` (`owPaymentPlanEntries`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-order-workflow.ts` (`owPaymentPlanEntries`, 10/10)

## `employee_issuance_log` 🔴 LIVE (2 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`employeeIssuanceLog`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`employee_issuance_log`, 4/4)

## `department_warehouse_map` 🔴 LIVE (2 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`departmentWarehouseMap`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`department_warehouse_map`, 4/4)

## `position_feature_flags` 🔴 LIVE (2 live fayl, DB 6 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/position-permissions.ts` (`positionFeatureFlags`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-rbac.ts` (`positionFeatureFlags`, 5/5)

## `papka_orders` 🔴 LIVE (2 live fayl, DB 41 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-papka.ts` (`papkaOrders`, 35/35)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`papka_orders`, 9/9)

## `routing_operations` 🔴 LIVE (2 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-production.ts` (`routingOperations`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-3.ts` (`routing_operations_int`, 6/6)

## `shift_assignments` 🔴 LIVE (2 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/shifts.ts` (`shiftAssignments`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-production.ts` (`shiftAssignments`, 7/7)

## `qc_standards` 🔴 LIVE (2 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/qc-schema.ts` (`qcStandards`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-qc.ts` (`qc_standards`, 8/8)

## `qc_final_inspections` 🔴 LIVE (2 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`qc_final_inspections`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/qc-schema.ts` (`qcFinalInspections`, 5/5)

## `qc_supplier_quality` 🔴 LIVE (2 live fayl, DB 20 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/qc-schema.ts` (`qcSupplierQuality`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-qc.ts` (`qc_supplier_quality`, 10/10)

## `sd_customer_interactions` 🔴 LIVE (2 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-customer-relations.ts` (`sdCustomerInteractions`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`sd_customer_interactions`, 6/6)

## `sd_customer_complaints` 🔴 LIVE (2 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-customer-relations.ts` (`sdCustomerComplaints`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`sd_customer_complaints`, 4/8)

## `deliveries` 🔴 LIVE (2 live fayl, DB 26 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc.ts` (`deliveries`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-delivery.ts` (`deliveries`, 12/12)

## `sd_price_formulas` 🔴 LIVE (2 live fayl, DB 26 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-europrint-schema.ts` (`sdPriceFormulas`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`sd_price_formulas`, 5/5)

## `sd_quotations` 🔴 LIVE (2 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-europrint-schema.ts` (`sdQuotations`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`sd_quotations`, 7/7)

## `order_status_logs` 🔴 LIVE (2 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/sd-order-items.ts` (`orderStatusLogs`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`order_status_logs`, 7/7)

## `security_incidents` 🔴 LIVE (2 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/security-ops-schema.ts` (`securityIncidents`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc.ts` (`security_incidents`, 11/11)

## `internal_requests` 🔴 LIVE (2 live fayl, DB 22 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts` (`internalRequests`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`internal_requests`, 6/6)

## `warehouse_rental_records` 🔴 LIVE (2 live fayl, DB 29 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts` (`warehouseRentalRecords`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`warehouse_rental_records`, 8/8)

## `asset_disposals` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-enhanced.ts` (`assetDisposals`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/admin-assets.ts` (`assetDisposals`, 6/8)

## `asset_transfers` 🔴 LIVE (1 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-enhanced.ts` (`assetTransfers`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/admin-assets.ts` (`assetTransfers`, 5/8)

## `ai_usage_logs` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/ai-providers-schema.ts` (`aiUsageLogs`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-reports.ts` (`ai_usage_logs`, 15/15)

## `employee_360_responses` 🔴 LIVE (1 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/assessment.ts` (`employee360Responses`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`employee_360_responses`, 3/5)

## `succession_plans` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/assessment.ts` (`successionPlans`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`successionPlans`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`succession_plans`, 7/7)

## `attendance_records` 🔴 LIVE (1 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/attendance.ts` (`attendanceRecords`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`attendance_records`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`attendanceRecords`, 7/7)

## `ai_report_definitions` 🔴 LIVE (1 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai-reports.ts` (`aiReportDefinitions`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`ai_report_definitions`, 8/8)

## `ai_report_runs` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai-reports.ts` (`aiReportRuns`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`ai_report_runs`, 7/7)

## `currencies` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai-reports.ts` (`currencies`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-3.ts` (`currencies`, 7/7)

## `goals` 🔴 LIVE (1 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai.ts` (`goals`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`goals`, 9/9)

## `knowledge_base` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-ai.ts` (`knowledgeBase`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-qc.ts` (`knowledge_base`, 11/11)

## `kpi_definitions` 🔴 LIVE (1 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-rules.ts` (`kpiDefinitions`, 21/21)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`kpi_definitions`, 8/8)

## `kpi_values` 🔴 LIVE (1 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-rules.ts` (`kpiValues`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`kpi_values`, 7/7)

## `system_alerts` 🔴 LIVE (1 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-rules.ts` (`systemAlerts`, 23/23)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-admin-ext.ts` (`system_alerts`, 9/9)

## `exception_logs` 🔴 LIVE (1 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/core/core-rules.ts` (`exceptionLogs`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`exception_logs`, 5/5)

## `crm_comments` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-activities.ts` (`crmComments`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`crm_comments`, 7/7)

## `crm_custom_fields` 🔴 LIVE (1 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`crm_custom_fields`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-docs.ts` (`crmCustomFields`, 9/9)

## `crm_robots` 🔴 LIVE (1 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/crm-docs.ts` (`crmRobots`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`crm_robots`, 7/7)

## `employee_bank_accounts` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/employees.ts` (`employeeBankAccounts`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`employeeBankAccounts`, 8/8)

## `employee_emergency_contacts` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/employees.ts` (`employeeEmergencyContacts`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`employeeEmergencyContacts`, 7/7)

## `invoice_payments` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-ap-core.ts` (`invoicePayments`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`invoicePayments`, 7/7)

## `cash_flow_transactions` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`cashFlowTransactions`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-ap-core.ts` (`cashFlowTransactions`, 6/6)

## `order_costings` 🔴 LIVE (1 live fayl, DB 20 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-budgets.ts` (`orderCostings`, 20/20)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`orderCostings`, 19/19)

## `order_costing_lines` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-budgets.ts` (`orderCostingLines`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`orderCostingLines`, 5/5)

## `ar_aging_buckets` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`ar_aging_buckets`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-budgets.ts` (`arAgingBuckets`, 7/7)

## `ap_aging_buckets` 🔴 LIVE (1 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-2.ts` (`ap_aging_buckets`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-budgets.ts` (`apAgingBuckets`, 8/8)

## `financial_kpis` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`financialKPIs`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-budgets.ts` (`financialKPIs`, 2/2)

## `expense_requests` 🔴 LIVE (1 live fayl, DB 24 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-expenses.ts` (`expenseRequests`, 21/21)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`expense_requests`, 10/10)

## `expense_reports` 🔴 LIVE (1 live fayl, DB 20 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-expenses.ts` (`expenseReports`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`expense_reports`, 10/10)

## `advance_payments` 🔴 LIVE (1 live fayl, DB 22 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-expenses.ts` (`advancePayments`, 18/18)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`advance_payments`, 9/9)

## `rpt_kassa_transactions` 🔴 LIVE (1 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-financial-reports.ts` (`kassaTransactions`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-reports.ts` (`kassaTransactions`, 9/9)

## `rpt_ombor_qoldiq` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-financial-reports.ts` (`omborQoldiq`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-reports.ts` (`omborQoldiq`, 10/10)

## `rpt_debitorlar` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-reports.ts` (`debitorlar`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-financial-reports.ts` (`debitorlar`, 8/8)

## `rpt_kreditorlar` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-financial-reports.ts` (`kreditorlar`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-reports.ts` (`kreditorlar`, 11/11)

## `rpt_balans` 🔴 LIVE (1 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-financial-reports.ts` (`balans`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-reports.ts` (`balans`, 12/12)

## `rpt_ishlab_chiqarish` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-financial-reports.ts` (`ishlabChiqarish`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-reports.ts` (`ishlabChiqarish`, 11/11)

## `cfo_config` 🔴 LIVE (1 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` (`cfoConfig`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`cfoConfigTable`, 5/5)

## `finance_categories` 🔴 LIVE (1 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-kassa.ts` (`financeCategories`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`financeCategories`, 5/5)

## `daily_financial_metrics` 🔴 LIVE (1 live fayl, DB 31 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-payroll-calc.ts` (`dailyFinancialMetrics`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-finance-extended.ts` (`dailyFinancialMetrics`, 6/6)

## `employee_daily_kpi` 🔴 LIVE (1 live fayl, DB 28 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`employeeDailyKpi`, 20/20)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kpi.ts` (`employeeDailyKpi`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`employee_daily_kpi`, 5/5)

## `ai_interview_sessions` 🔴 LIVE (1 live fayl, DB 27 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`aiInterviewSessions`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`aiInterviewSessions`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`ai_interview_sessions`, 8/8)

## `position_skill_requirements` 🔴 LIVE (1 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`positionSkillRequirements`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-3.ts` (`position_skill_requirements`, 4/4)

## `interviews` 🔴 LIVE (1 live fayl, DB 25 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`interviews`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-questionnaire.ts` (`interviews`, 8/8)

## `shift_swap_requests` 🔴 LIVE (1 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`shiftSwapRequests`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/shifts.ts` (`shiftSwapRequests`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`shift_swap_requests`, 6/6)

## `ppe_compliance` 🔴 LIVE (1 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/safety.ts` (`ppeCompliance`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`ppe_compliance`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`ppeCompliance`, 6/6)

## `hazard_zones` 🔴 LIVE (1 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/safety.ts` (`hazardZones`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`hazard_zones`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`hazardZones`, 10/10)

## `face_embeddings` 🔴 LIVE (1 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-3.ts` (`face_embeddings`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-transfers.ts` (`faceEmbeddings`, 4/4)

## `hr_tz2_territory_logs` 🔴 LIVE (1 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-tz2-schema.ts` (`hrTz2TerritoryLogs`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-tz2.ts` (`hr_tz2_territory_logs`, 9/9)

## `employee_badges` 🔴 LIVE (1 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`employee_badges`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`employeeBadges`, 6/6)

## `hr_daily_report_audit` 🔴 LIVE (1 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`hrDailyReportAudit`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`hr_daily_report_audit`, 7/7)

## `career_path_steps` 🔴 LIVE (1 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`careerPathSteps`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`career_path_steps`, 8/8)

## `employee_skill_scores` 🔴 LIVE (1 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`employeeSkillScores`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-3.ts` (`employee_skill_scores`, 6/6)

## `enps_responses` 🔴 LIVE (1 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`enpsResponses`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-misc.ts` (`enps_responses`, 7/7)

## `pip_progress_updates` 🔴 LIVE (1 live fayl, DB 6 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`pipProgressUpdates`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-1.ts` (`pip_progress_updates`, 6/6)

## `visitor_log` 🔴 LIVE (1 live fayl, DB 15 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`visitorLog`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-misc.ts` (`visitor_log`, 14/14)

## `workflow_route_configs` 🔴 LIVE (1 live fayl, DB 6 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`documentWorkflowRoutes`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`workflow_route_configs`, 5/5)

## `offboarding_checklist_items` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-v2-schema.ts` (`offboardingChecklistItems`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`offboarding_checklist_items`, 6/6)

## `camera_ai_configs` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/iot-schema.ts` (`cameraAiConfigs`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-iot.ts` (`camera_ai_configs`, 9/9)

## `lms_modules` 🔴 LIVE (1 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-extended.ts` (`lmsModules`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`lms_modules`, 5/5)

## `hr_capital_courses` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms-schema.ts` (`hrCapitalCourses`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`hr_capital_courses`, 7/7)

## `ow_molds` 🔴 LIVE (1 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/order-workflow-schema.ts` (`owMolds`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-order-workflow.ts` (`owMolds`, 5/5)

## `ow_cliches` 🔴 LIVE (1 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/order-workflow-schema.ts` (`owCliches`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-order-workflow.ts` (`owCliches`, 6/6)

## `ow_order_status_history` 🔴 LIVE (1 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/order-workflow-schema.ts` (`owOrderStatusHistory`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-order-workflow.ts` (`owOrderStatusHistory`, 8/8)

## `retail_pos_products` 🔴 LIVE (1 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-retail.ts` (`retailPosProducts`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-retail.ts` (`retail_pos_products`, 14/14)

## `retail_pos_transactions` 🔴 LIVE (1 live fayl, DB 19 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-retail.ts` (`retailPosTransactions`, 19/19)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-retail.ts` (`retail_pos_transactions`, 19/19)

## `pos_damage_qc_links` 🔴 LIVE (1 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`posDamageQcLinks`, 16/16)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-a-1.ts` (`pos_damage_qc_links`, 4/8)

## `waste_records` 🔴 LIVE (1 live fayl, DB 20 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`waste_records`, 20/20)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-enhanced.ts` (`wasteRecords`, 19/19)

## `waste_targets` 🔴 LIVE (1 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`waste_targets`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-enhanced.ts` (`wasteTargets`, 9/9)

## `machine_tasks` 🔴 LIVE (1 live fayl, DB 29 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-papka.ts` (`machineTasks`, 24/24)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-1.ts` (`machine_tasks`, 8/8)

## `qc_root_causes` 🔴 LIVE (1 live fayl, DB 25 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/qc-schema.ts` (`qcRootCauses`, 14/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-1.ts` (`qc_root_causes`, 7/7)

## `safety_training_records` 🔴 LIVE (1 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/safety.ts` (`safetyTrainingRecords`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-c-2-hr-safety.ts` (`safety_training_records`, 9/9)

## `strategic_categories` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts` (`strategicCategories`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2.ts` (`strategic_categories`, 5/5)

## `strategic_tasks` 🔴 LIVE (1 live fayl, DB 31 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts` (`strategicTasks`, 30/30)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2.ts` (`strategic_tasks`, 12/12)

## `strategic_milestones` 🔴 LIVE (1 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts` (`strategicMilestones`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2.ts` (`strategic_milestones`, 7/7)

## `raci_tasks` 🔴 LIVE (1 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2.ts` (`raci_tasks`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts` (`raciTasks`, 7/7)

## `raci_assignments` 🔴 LIVE (1 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts` (`raciAssignments`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2.ts` (`raci_assignments`, 4/4)

## `okr_objectives` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts` (`okrObjectives`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2.ts` (`okr_objectives`, 10/10)

## `okr_key_results` 🔴 LIVE (1 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts` (`okrKeyResults`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-a-2.ts` (`okr_key_results`, 10/10)

## `weekly_plans` 🔴 LIVE (1 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/weekly-plans-schema.ts` (`weeklyPlans`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-3.ts` (`weekly_plans`, 7/7)

## `stock_moves` 🔴 LIVE (1 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts` (`stockMoves`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-1.ts` (`stock_moves`, 10/10)

## `warehouse_rental_settings` 🔴 LIVE (1 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts` (`warehouseRentalSettings`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-c-2.ts` (`warehouse_rental_settings`, 5/5)

## `employee_strengths_weaknesses` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-transfers.ts` (`employeeStrengthsWeaknesses`, 3/3)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/assessment.ts` (`employeeStrengthsWeaknesses`, 2/13)

## `employee_transfer_history` ⚪ dormant (0 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-transfers.ts` (`employeeTransferHistory`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/assessment.ts` (`employeeTransferHistory`, 9/15)

## `exit_interviews` ⚪ dormant (0 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`exitInterviews`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/assessment.ts` (`exitInterviews`, 3/17)

## `daily_attendance_summary` ⚪ dormant (0 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-transfers.ts` (`dailyAttendanceSummary`, 4/4)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/attendance.ts` (`dailyAttendanceSummary`, 2/11)

## `abc_analysis` ⚪ dormant (0 live fayl, DB 18 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-compensation.ts` (`abcAnalysis`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/attendance.ts` (`abcAnalysis`, 3/18)

## `discipline_appeals` ⚪ dormant (0 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`disciplineAppeals`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/discipline.ts` (`disciplineAppeals`, 6/12)

## `employment_contracts` ⚪ dormant (0 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`employmentContracts`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/employees.ts` (`employmentContracts`, 7/20)

## `employee_passports` ⚪ dormant (0 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`employeePassports`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/employees.ts` (`employeePassports`, 4/11)

## `pos_products` ⚪ dormant (0 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/fi-payroll-ext.ts` (`posProducts`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-ext-b-2.ts` (`pos_products`, 12/12)

## `leave_balances` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`leaveBalances`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/leave.ts` (`leaveBalances`, 6/10)

## `salary_bands` ⚪ dormant (0 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`salaryBands`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/payroll.ts` (`salaryBands`, 9/10)

## `job_templates` ⚪ dormant (0 live fayl, DB 25 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-questionnaire.ts` (`jobTemplates`, 23/23)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`jobTemplates`, 8/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`jobTemplates`, 5/14)

## `ai_cv_screenings` ⚪ dormant (0 live fayl, DB 20 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`aiCvScreenings`, 20/20)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-architecture-additions.ts` (`aiCvScreenings`, 6/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`aiCvScreenings`, 5/14)

## `cash_advances` ⚪ dormant (0 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`cashAdvances`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/payroll.ts` (`cashAdvances`, 5/14)

## `bonus_payments` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`bonusPayments`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/payroll.ts` (`bonusPayments`, 5/15)

## `employee_fines` ⚪ dormant (0 live fayl, DB 11 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`employeeFines`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/payroll.ts` (`employeeFines`, 3/11)

## `overtime_payments` ⚪ dormant (0 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`overtimePayments`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/payroll.ts` (`overtimePayments`, 5/11)

## `sick_leaves` ⚪ dormant (0 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`sickLeaves`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/leave.ts` (`sickLeaves`, 3/13)

## `business_trips` ⚪ dormant (0 live fayl, DB 16 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-employees-docs.ts` (`businessTrips`, 15/15)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/leave.ts` (`businessTrips`, 10/16)

## `ai_interview_messages` ⚪ dormant (0 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`aiInterviewMessages`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/recruitment.ts` (`aiInterviewMessages`, 4/8)

## `performance_goals` ⚪ dormant (0 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-performance-ext.ts` (`performanceGoals`, 13/13)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kpi.ts` (`performanceGoals`, 9/18)

## `position_required_courses` ⚪ dormant (0 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/lms.ts` (`positionRequiredCourses`, 4/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-personal-core.ts` (`positionRequiredCourses`, 4/4)

## `operator_daily_stats` ⚪ dormant (0 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`operatorDailyStats`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kpi.ts` (`operatorDailyStats`, 3/13)

## `safety_trainings` ⚪ dormant (0 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-safety.ts` (`safetyTrainings`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/safety.ts` (`safetyTrainings`, 3/9)

## `employee_productivity` ⚪ dormant (0 live fayl, DB 21 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-transfers.ts` (`employeeProductivity`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kpi.ts` (`employeeProductivity`, 3/13)

## `hr_tz2_room_reference_photos` ⚪ dormant (0 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-tz2-schema.ts` (`hrTz2RoomReferencePhotos`, 10/10)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-tz2.ts` (`hr_tz2_room_reference_photos`, 10/10)

## `hr_tz2_ai_room_analysis` ⚪ dormant (0 live fayl, DB 13 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-hr-tz2.ts` (`hr_tz2_ai_room_analysis`, 13/14)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/hr-tz2-schema.ts` (`hrTz2AiRoomAnalysis`, 13/13)

## `kanban_comments` ⚪ dormant (0 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-core.ts` (`kanbanComments`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`kanbanComments`, 5/5)

## `task_subtasks` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskSubtasks`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskSubtasks`, 9/9)

## `task_checklists` ⚪ dormant (0 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskChecklists`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskChecklists`, 5/5)

## `task_tags` ⚪ dormant (0 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskTags`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskTags`, 5/5)

## `task_card_tags` ⚪ dormant (0 live fayl, DB 3 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskCardTags`, 3/3)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskCardTags`, 3/3)

## `task_reminders` ⚪ dormant (0 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskReminders`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskReminders`, 7/7)

## `task_time_entries` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskTimeEntries`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskTimeEntries`, 9/9)

## `task_collaborators` ⚪ dormant (0 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskCollaborators`, 4/4)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskCollaborators`, 4/4)

## `task_templates` ⚪ dormant (0 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskTemplates`, 12/12)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskTemplates`, 12/12)

## `task_files` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskFiles`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskFiles`, 9/9)

## `task_status_history` ⚪ dormant (0 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskStatusHistory`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskStatusHistory`, 8/8)

## `task_results` ⚪ dormant (0 live fayl, DB 6 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskResults`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskResults`, 6/6)

## `task_result_files` ⚪ dormant (0 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskResultFiles`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskResultFiles`, 7/7)

## `task_chat_messages` ⚪ dormant (0 live fayl, DB 6 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskChatMessages`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskChatMessages`, 5/5)

## `task_chat_message_files` ⚪ dormant (0 live fayl, DB 7 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskChatMessageFiles`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskChatMessageFiles`, 7/7)

## `task_time_tracks` ⚪ dormant (0 live fayl, DB 10 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskTimeTracks`, 9/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskTimeTracks`, 9/9)

## `task_observers` ⚪ dormant (0 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskObservers`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskObservers`, 5/5)

## `task_co_executors` ⚪ dormant (0 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskCoExecutors`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskCoExecutors`, 5/5)

## `task_projects` ⚪ dormant (0 live fayl, DB 12 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskProjects`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskProjects`, 11/11)

## `task_project_members` ⚪ dormant (0 live fayl, DB 5 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskProjectMembers`, 4/4)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskProjectMembers`, 4/4)

## `automation_robots` ⚪ dormant (0 live fayl, DB 14 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`automationRobots`, 11/11)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`automationRobots`, 11/11)

## `task_flows` ⚪ dormant (0 live fayl, DB 8 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskFlows`, 5/5)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskFlows`, 5/5)

## `task_notifications` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskNotifications`, 8/8)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskNotifications`, 8/8)

## `task_view_preferences` ⚪ dormant (0 live fayl, DB 9 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban/kanban-extended.ts` (`taskViewPreferences`, 7/7)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/kanban-schema.ts` (`taskViewPreferences`, 7/7)

## `pos_printer_config` ⚪ dormant (0 live fayl, DB 0 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema-v2.ts` (`posPrinterConfig`, 0/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-business-b-1.ts` (`pos_printer_config`, 0/9)

## `pos_warehouse_access` ⚪ dormant (0 live fayl, DB 0 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pos-schema.ts` (`posWarehouseAccess`, 0/9)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-pos-ext.ts` (`pos_warehouse_access`, 0/9)

## `sensor_devices` ⚪ dormant (0 live fayl, DB 17 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-iot.ts` (`sensorDevices`, 17/17)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-iot.ts` (`sensor_devices`, 5/9)

## `sensor_readings` ⚪ dormant (0 live fayl, DB 6 ustun)
**CANON:** `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/lib/db/src/schema/pp/pp-iot.ts` (`sensorReadings`, 6/6)
- redundant: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/src/shared/db/schema-misc-iot.ts` (`sensor_readings`, 2/7)
