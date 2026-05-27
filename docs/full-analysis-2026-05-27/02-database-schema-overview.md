# 02 — Database Schema Overview

**Audit date:** 2026-05-27
**Auditor:** forensic-agent (read-only)
**Scope:** All `pgTable(...)` definitions across `lib/db/src/schema/` (665 tables) and `apps/api/src/shared/db/` (362 tables), plus migration files in `apps/api/drizzle/` (migrations 0000–0016) and `lib/db/drizzle/` (migrations 0000–0050).

---

## 1. Schema Layer Architecture

The monorepo has **two parallel Drizzle schema systems** that partially overlap:

| Layer | Path | pgTable count | Purpose |
|-------|------|--------------|---------|
| **lib/db** (canonical) | `lib/db/src/schema/*.ts` | 665 unique table names | Shared workspace library; consumed by `@workspace/db` |
| **apps/api/shared/db** (API-local) | `apps/api/src/shared/db/schema-*.ts` | 362 unique table names | API-specific definitions; some re-export from lib/db, some are local stubs |
| **Overlap** | Both define same table name | 121 tables | Most are re-exports; ~20 are independent redefinitions |
| **Only in lib/db** | 544 tables | | Not exposed to API runtime directly |
| **Only in apps/api** | 241 tables | | Local stubs, compat shims, AI agent tables |

The live DB (as measured by `_drift_report_fresh.txt`) has **951 tables/views**. Drizzle definitions total **957 unique names**. Drizzle is ahead of the DB by 73 tables (Drizzle-only) and the DB has ~20 tables not in any Drizzle file.

---

## 2. Schema File Inventory (lib/db/src/schema)

Each file listed with its table exports. Line numbers reference the `pgTable(` call.

### Domain: Core / Users / Auth

---

### Table: users
File: `lib/db/src/schema/users.ts:13`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| username | varchar(50) | NOT NULL, UNIQUE |
| email | varchar(100) | UNIQUE |
| password_hash | varchar(255) | NOT NULL |
| first_name | varchar(100) | NOT NULL |
| last_name | varchar(100) | NOT NULL |
| middle_name | varchar(100) | — |
| position_id | integer | FK → positions.id ON DELETE SET NULL |
| department_id | integer | FK → departments.id ON DELETE SET NULL |
| phone | varchar(20) | — |
| avatar_url | text | — |
| telegram_chat_id | varchar(50) | — |
| language | varchar(5) | DEFAULT 'uz' |
| is_active | boolean | NOT NULL DEFAULT true |
| last_login_at | timestamp | — |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |
| full_name | text | — (convergence addition) |
| employee_id | integer | — |
| role | varchar(50) | DEFAULT 'employee' |
| status | varchar(20) | DEFAULT 'active' |
| profile_image_url | text | — |
| manager_id | integer | — |
| hierarchy_level | integer | — |
| ckp_code | varchar(100) | — |
| rfid_card | varchar(100) | — |
| age | integer | — |
| gender | varchar(20) | — |
| children_count | integer | — |
| marital_status | varchar(30) | — |
| children_education | text | — |
| household_size | integer | — |
| household_members | text | — |
| housing_type | varchar(50) | — |
| latitude | numeric | — |
| longitude | numeric | — |
| shift | varchar(50) | — |
| district | varchar(100) | — |
| salary_type | varchar(50) | — |
| workshop_zone | varchar(50) | — |
| lang | varchar(5) | — |
| birth_date | date | — |
| hire_date | date | — |
| address | text | — |
| attestation_date | date | — |
| deleted_at | timestamp | — (soft delete) |
| failed_login_attempts | integer | DEFAULT 0 |
| locked_until | timestamp | — |
| telegram_id | varchar(50) | — |
| org_department_id | integer | — |
| org_function_id | integer | — |
| department | varchar(100) | — |

Indexes: `idx_users_position_id`, `idx_users_department_id`, `idx_users_is_active`
Check: `language IN ('uz','ru','en') OR NULL`

**Note:** The `users` table in migration 0000 is a minimal stub (id integer, username, email, full_name, role, department_id, manager_id only). Migration 0015 adds `password_hash`, `is_active`, `last_login_at`, `failed_login_attempts`, `locked_until`. The live Drizzle schema has 50+ columns; the DB table started minimal and is being patched column by column.

---

### Table: departments
File: `lib/db/src/schema/departments.ts:10`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| tenant_id | integer | NOT NULL DEFAULT 1 |
| code | varchar(30) | NOT NULL, UNIQUE |
| name_uz | varchar(150) | NOT NULL |
| name_ru | varchar(150) | — |
| parent_id | integer | FK → departments.id ON DELETE SET NULL (self-ref) |
| manager_id | integer | — |
| vysotskiy_function | varchar(50) | — |
| level | integer | DEFAULT 1 |
| sort_order | integer | DEFAULT 0 |
| is_active | boolean | NOT NULL DEFAULT true |
| description | text | — |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |
| name | varchar(150) | — (convergence) |
| name_en | varchar(150) | — |
| organization_number | varchar(50) | — |
| description_ru | text | — |
| vep | text | — |
| vep_ru | text | — |
| statistics_type | varchar(50) | — |
| department_code | varchar(50) | — |
| icon | varchar(50) | — |
| color | varchar(30) | — |
| head_id | integer | — |

Indexes: `idx_departments_parent_id`, `idx_departments_is_active`, `idx_departments_tenant_id`

---

### Domain: HR / Employees

---

### Table: employees
File: `lib/db/src/schema/employees.ts:14`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| tenant_id | integer | NOT NULL DEFAULT 1 |
| user_id | integer | FK → users.id ON DELETE SET NULL, UNIQUE |
| employee_code | varchar(20) | NOT NULL, UNIQUE |
| first_name | varchar(100) | NOT NULL |
| last_name | varchar(100) | NOT NULL |
| middle_name | varchar(100) | — |
| gender | varchar(10) | — |
| birth_date | date | — |
| hire_date | date | NOT NULL |
| contract_type | varchar(20) | DEFAULT 'permanent' |
| contract_start_date | date | — |
| contract_end_date | date | — |
| probation_end_date | date | — |
| base_salary | decimal(12,2) | — |
| daily_rate | decimal(10,2) | — |
| hourly_rate | decimal(8,2) | — |
| department_id | integer | FK → departments.id ON DELETE SET NULL |
| position_id | integer | FK → positions.id ON DELETE SET NULL |
| manager_id | integer | FK → employees.id ON DELETE SET NULL (self-ref) |
| manager_department_id | integer | FK → departments.id ON DELETE SET NULL |
| vysotskiy_category | varchar(10) | — |
| work_center_id | integer | — |
| team_id | integer | — |
| passport_series | varchar(10) | — |
| passport_number | varchar(10) | — |
| passport_issue_date | date | — |
| passport_expiry_date | date | — |
| national_id | varchar(20) | — |
| address_registered | text | — |
| address_actual | text | — |
| phone_number | varchar(20) | — |
| email_personal | varchar(100) | — |
| email_work | varchar(100) | — |
| emergency_contact_name | varchar(100) | — |
| emergency_contact_phone | varchar(20) | — |
| bank_account_number | varchar(34) | — |
| bank_account_currency | varchar(3) | DEFAULT 'UZS' |
| bank_name | varchar(100) | — |
| photo_url | text | — |
| face_encoding_id | varchar(36) | — |
| telegram_chat_id | varchar(50) | — |
| status | varchar(20) | NOT NULL DEFAULT 'active' |
| employment_status | varchar(20) | DEFAULT 'active' |
| is_blocked | boolean | DEFAULT false |
| blocked_reason | text | — |
| block_erp_access | boolean | DEFAULT false |
| is_machine_operator | boolean | DEFAULT false |
| corporate_phone | varchar(50) | — |
| corporate_email | varchar(255) | — |
| retention_years | integer | DEFAULT 3 |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |
| deleted_at | timestamp | — (soft delete) |

Indexes: `idx_employees_status`, `idx_employees_department_id`, `idx_employees_position_id`, `idx_employees_user_id`, `idx_employees_manager_id`, `idx_employees_manager_department_id`, `idx_employees_deleted_at`, `idx_employees_tenant_id`
Checks: `status IN (active/inactive/terminated/on_leave/probation)`, `contract_type`, `gender`

Related tables in same file: `employment_contracts`, `employee_passports`, `employee_bank_accounts`, `employee_emergency_contacts`, `employee_files`

---

### Table: employment_contracts
File: `lib/db/src/schema/employees.ts:88`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| employee_id | integer | NOT NULL FK → employees.id CASCADE |
| contract_number | varchar(50) | UNIQUE |
| contract_type | varchar(20) | — |
| start_date | date | NOT NULL |
| end_date | date | — |
| position_title | varchar(100) | — |
| department_name | varchar(100) | — |
| salary_amount | decimal(12,2) | — |
| probation_period_days | integer | DEFAULT 90 |
| probation_end_date | date | — |
| terms_conditions | text | — |
| signature_employee | date | — |
| signature_manager | date | — |
| signature_hr | date | — |
| document_url | text | — |
| status | varchar(20) | DEFAULT 'draft' |
| termination_reason | varchar(100) | — |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |

---

### Domain: Attendance

---

### Table: attendance
File: `lib/db/src/schema/attendance.ts:12`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| tenant_id | integer | NOT NULL DEFAULT 1 |
| employee_id | integer | NOT NULL FK → employees.id CASCADE |
| attendance_date | date | NOT NULL |
| check_in_time | timestamp | — |
| check_out_time | timestamp | — |
| status | varchar(20) | DEFAULT 'present' |
| late_minutes | integer | DEFAULT 0 |
| early_leave_minutes | integer | DEFAULT 0 |
| overtime_minutes | integer | DEFAULT 0 |
| source | varchar(50) | — |
| verified_by | integer | — |
| verification_timestamp | timestamp | — |
| notes | text | — |
| is_approved | boolean | DEFAULT false |
| approved_by | integer | — |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |
| check_in | timestamp | — (convergence alias) |
| check_out | timestamp | — (convergence alias) |
| user_id | integer | — |
| date | date | — (convergence alias) |
| is_early_leave | boolean | — |
| minutes_late | integer | — |
| minutes_early | integer | — |
| hours_worked | decimal(6,2) | — |

Indexes: `idx_attendance_employee_id`, `idx_attendance_attendance_date`, `idx_attendance_status`
Unique: `uq_attendance_emp_date` on (employee_id, attendance_date)
Check: `status IN (present/absent/late/half_day/on_leave/sick_leave/business_trip/remote/holiday)`

**Note:** Migration 0014 changed `check_in_time` and `check_out_time` from TEXT to TIME. The Drizzle schema defines them as `timestamp`. Type mismatch exists.

Related tables in same file: `attendance_records`, `daily_attendance_summary`, `abc_analysis`

---

### Table: attendance_records
File: `lib/db/src/schema/attendance.ts:52`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| employee_id | integer | NOT NULL FK → employees.id CASCADE |
| event_type | varchar(10) | NOT NULL |
| event_time | timestamp | NOT NULL |
| source | varchar(50) | — |
| face_confidence | decimal(5,3) | — |
| location_id | integer | — |
| device_id | varchar(50) | — |
| raw_data | jsonb | — |
| created_at | timestamp | NOT NULL DEFAULT now() |

Check: `event_type IN ('in','out')`

---

### Table: daily_attendance_summary
File: `lib/db/src/schema/attendance.ts:70`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| attendance_date | date | NOT NULL |
| total_employees | integer | — |
| present_count | integer | — |
| absent_count | integer | — |
| late_count | integer | — |
| on_leave_count | integer | — |
| sick_leave_count | integer | — |
| business_trip_count | integer | — |
| department_id | integer | — |
| created_at | timestamp | NOT NULL DEFAULT now() |

Unique: `uq_daily_summary_date_dept` on (attendance_date, department_id)

**Drift:** All columns in this table (attendance_date, total_employees, present_count, etc.) are missing from the live DB per `_drift_report_fresh.txt`. The table exists in DB but is essentially empty-schema.

---

### Table: abc_analysis
File: `lib/db/src/schema/attendance.ts:86`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| employee_id | integer | NOT NULL FK → employees.id CASCADE |
| analysis_period_start | date | NOT NULL |
| analysis_period_end | date | NOT NULL |
| attendance_score | decimal(5,2) | — |
| quality_score | decimal(5,2) | — |
| task_completion_score | decimal(5,2) | — |
| lms_training_score | decimal(5,2) | — |
| safety_compliance_score | decimal(5,2) | — |
| teamwork_collaboration_score | decimal(5,2) | — |
| total_score | decimal(5,2) | — |
| category | varchar(1) | — |
| previous_category | varchar(1) | — |
| category_change | varchar(20) | — |
| bonus_percentage | decimal(5,2) | — |
| notes | text | — |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |

Unique: `uq_abc_emp_period` on (employee_id, analysis_period_start)
Check: `category IN ('A','B','C') OR NULL`

---

### Domain: Payroll / Finance

---

### Table: salary_history
File: `lib/db/src/schema/payroll.ts:11`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| tenant_id | integer | NOT NULL DEFAULT 1 |
| employee_id | integer | NOT NULL FK → employees.id CASCADE |
| salary_period_start | date | NOT NULL |
| salary_period_end | date | NOT NULL |
| base_salary | decimal(12,2) | — |
| days_worked | integer | — |
| hours_worked | decimal(6,2) | — |
| salary_earned | decimal(12,2) | — |
| abc_bonus | decimal(12,2) | — |
| performance_bonus | decimal(12,2) | — |
| attendance_bonus | decimal(12,2) | — |
| other_bonuses | decimal(12,2) | — |
| total_bonuses | decimal(12,2) | — |
| overtime_hours_1_5x | decimal(6,2) | — |
| overtime_hours_2_0x | decimal(6,2) | — |
| overtime_payment | decimal(12,2) | — |
| inps_12_percent | decimal(12,2) | — |
| jshd_12_percent | decimal(12,2) | — |
| tax_personal_income | decimal(12,2) | — |
| other_deductions | decimal(12,2) | — |
| total_deductions | decimal(12,2) | — |
| fines | decimal(12,2) | — |
| cash_advance_repayment | decimal(12,2) | — |
| net_salary | decimal(12,2) | — |
| status | varchar(20) | DEFAULT 'draft' |
| paid_date | date | — |
| paid_by | integer | — |
| payment_method | varchar(50) | — |
| notes | text | — |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |
| user_id | integer | — (convergence) |
| effective_date | timestamp | — |
| previous_salary | decimal(12,2) | — |
| new_salary | decimal(12,2) | — |
| change_type | varchar(30) | — |
| change_percent | decimal(5,2) | — |
| reason | text | — |
| approved_by | integer | — |
| amount | decimal(18,2) | — |
| currency | varchar(10) | DEFAULT 'UZS' |
| created_by | integer | — |

**Drift:** `amount`, `currency`, `created_by` missing from live DB per drift report.

---

### Table: payroll_calculations
File: `lib/db/src/schema/fi-payroll-calc.ts:100`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| period_id | varchar | FK → payroll_periods.id ON DELETE SET NULL |
| employee_id | integer | NOT NULL FK → users.id CASCADE |
| contract_id | varchar | FK → payroll_contracts.id ON DELETE SET NULL |
| pay_type | varchar(20) | NOT NULL |
| work_days | integer | DEFAULT 0 |
| work_hours | numeric | DEFAULT 0 |
| overtime_hours | numeric | DEFAULT 0 |
| production_units | numeric | DEFAULT 0 |
| base_pay | numeric | NOT NULL DEFAULT 0 |
| hourly_pay | numeric | DEFAULT 0 |
| piecework_pay | numeric | DEFAULT 0 |
| overtime_pay | numeric | DEFAULT 0 |
| bonuses | numeric | DEFAULT 0 |
| allowances | numeric | DEFAULT 0 |
| gross_pay | numeric | NOT NULL |
| tax_inps | numeric | NOT NULL DEFAULT 0 |
| tax_jshd | numeric | NOT NULL DEFAULT 0 |
| total_taxes | numeric | NOT NULL DEFAULT 0 |
| other_deductions | numeric | DEFAULT 0 |
| advances | numeric | DEFAULT 0 |
| loans | numeric | DEFAULT 0 |
| total_deductions | numeric | NOT NULL DEFAULT 0 |
| net_pay | numeric | NOT NULL |
| min_wage_top_up | numeric | DEFAULT 0 |
| status | varchar(20) | NOT NULL DEFAULT 'draft' |
| calculated_at | timestamp | — |
| approved_by | integer | FK → users.id ON DELETE SET NULL |
| approved_at | timestamp | — |
| paid_at | timestamp | — |
| notes | text | — |
| created_at | timestamp | NOT NULL DEFAULT now() |

Checks: `pay_type IN (fixed/hourly/piecework)`, `status IN (draft/calculated/approved/paid)`
Indexes: `idx_payroll_calculations_employee_id`, `idx_payroll_calculations_period_id`, `idx_payroll_calculations_status`, `idx_payroll_calculations_created_at`

**Runtime risk:** No service queries this table. It exists in Drizzle schema but `grep -r payrollCalculations apps/api/src` returns no matches. Dormant.

---

### Table: pos_transactions
File: `lib/db/src/schema/fi-payroll-ext.ts:228`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| transaction_number | varchar(30) | NOT NULL, UNIQUE |
| customer_id | varchar | — |
| customer_name | text | — |
| cashier_id | integer | FK → users.id ON DELETE SET NULL |
| items | jsonb | NOT NULL |
| subtotal | numeric | NOT NULL |
| tax_amount | numeric | NOT NULL DEFAULT 0 |
| tax_rate | numeric | DEFAULT 12 |
| discount_amount | numeric | DEFAULT 0 |
| total_amount | numeric | NOT NULL |
| payment_method | varchar(20) | NOT NULL |
| payment_details | jsonb | — |
| status | varchar(20) | NOT NULL DEFAULT 'completed' |
| receipt_number | varchar(30) | — |
| notes | text | — |
| created_at | timestamp | NOT NULL DEFAULT now() |

Checks: `payment_method IN (cash/card/transfer/mixed)`, `status IN (completed/refunded/pending/cancelled)`

**Note:** This table name clashes conceptually with `retail_pos_transactions` (the table actually used by the POS module). `pos_transactions` is not queried by any service code. Dormant.

---

### Table: retail_pos_transactions
File: `lib/db/src/schema/pos-retail.ts:43`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| cashier_id | integer | NOT NULL FK → users.id |
| customer_id | integer | FK → sd_customers.id |
| transaction_type | varchar(30) | NOT NULL DEFAULT 'sale' |
| total_amount | numeric(18,2) | NOT NULL |
| discount_amount | numeric(18,2) | DEFAULT 0 |
| tax_amount | numeric(18,2) | DEFAULT 0 |
| payment_method | varchar(20) | NOT NULL |
| status | varchar(20) | DEFAULT 'completed' |
| receipt_number | varchar(50) | UNIQUE |
| notes | text | — |
| created_at | timestamp | DEFAULT now() |

Indexes: `retail_pos_transactions_cashier_idx`, `retail_pos_transactions_customer_idx`, `retail_pos_transactions_status_idx`, `retail_pos_transactions_date_idx`

**Active:** Queried and mutated by `cash-register.repository.ts`.

---

### Domain: Materials / Inventory

---

### Table: material_cards
File: `lib/db/src/schema/mm-material-cards.ts:60`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| kod | varchar(50) | NOT NULL, UNIQUE |
| xom_ashyo | text | NOT NULL |
| xom_ashyo_ru | text | — |
| unit_of_measure | varchar(20) | NOT NULL |
| category | varchar(30) | — |
| format_a | numeric | — |
| format_b | numeric | — |
| grammage | numeric | — |
| current_stock | numeric | DEFAULT 0 |
| reserved_stock | numeric | DEFAULT 0 |
| available_stock | numeric | DEFAULT 0 |
| min_stock | numeric | DEFAULT 0 |
| max_stock | numeric | — |
| reorder_point | numeric | — |
| unit_price | numeric | — |
| currency | varchar(10) | DEFAULT 'UZS' |
| last_purchase_price | numeric | — |
| last_purchase_date | varchar(10) | — |
| supplier_name | text | — |
| vendor_id | varchar | FK → vendors.id ON DELETE SET NULL |
| description | text | — |
| raw_material_id | varchar | FK → raw_materials.id ON DELETE SET NULL |
| warehouse_id | varchar | FK → warehouses.id ON DELETE SET NULL |
| material_type | varchar(30) | DEFAULT 'raw_material' |
| storage_conditions | jsonb | — |
| shelf_life_days | integer | — |
| abc_segment | varchar(1) | DEFAULT 'C' |
| barcode | varchar(100) | — |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | — |

Indexes: `idx_material_cards_warehouse_id`, `idx_material_cards_category`, `idx_material_cards_is_active`, `idx_material_cards_vendor_id`, `idx_material_cards_abc_segment`
Checks: `material_type`, `abc_segment IN (A/B/C)`, `current_stock >= 0`, `reserved_stock >= 0`

**Critical drift note:** `barcode` column is missing from the live DB per `_drift_report_fresh.txt`.

---

### Table: current_stock
File: `apps/api/src/shared/db/schema-ext-a-1.ts:43`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| material_card_id | integer | NOT NULL |
| warehouse_id | integer | — |
| quantity_on_hand | numeric(15,4) | DEFAULT 0 |
| last_movement_at | timestamp | — |

**Drift:** Live DB `current_stock` table has `material_card_id` column. The Drizzle column name `material_card_id` (JS property name) maps to DB column `material_card_id`. However `_drift_report_fresh.txt` lists `current_stock: material_card_id` as a missing column in DB — meaning the DB table was created with a different column name (likely `material_id`). This is the central `material_card_id` vs `material_id` naming conflict.

---

### Domain: LMS (Learning Management System)

---

### Table: lms_exams
File: `lib/db/src/schema/lms-extended.ts:11`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| title | varchar(200) | NOT NULL |
| course_id | integer | FK → courses.id ON DELETE SET NULL |
| duration_minutes | integer | NOT NULL DEFAULT 60 |
| passing_score | real | NOT NULL DEFAULT 70 |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |

**Status:** In migration snapshot (0000_volatile_ender_wiggin.sql line 4303). Confirmed in DB.

---

### Table: lms_modules
File: `lib/db/src/schema/lms-extended.ts:32`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| course_id | integer | NOT NULL FK → courses.id CASCADE |
| title | varchar(200) | NOT NULL |
| title_ru | text | — |
| description | text | — |
| order | integer | — |
| order_index | integer | NOT NULL DEFAULT 0 |
| sort_order | integer | — |
| created_at | timestamp | NOT NULL DEFAULT now() |
| updated_at | timestamp | NOT NULL DEFAULT now() |
| deleted_at | timestamp | — |

**Status:** In migration snapshot (0000 line 4321). Confirmed in DB.

---

### Table: lms_lessons
File: `lib/db/src/schema/lms-extended.ts:46`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| module_id | integer | NOT NULL FK → lms_modules.id CASCADE |
| title | varchar(200) | NOT NULL |
| content_type | varchar(20) | NOT NULL DEFAULT 'text' |
| content_url | text | — |
| content_body | text | — |
| duration_min | integer | DEFAULT 0 |
| order_index | integer | NOT NULL DEFAULT 0 |
| created_at | timestamp | NOT NULL DEFAULT now() |

Check: `content_type IN (text/video/pdf/audio/quiz/assignment)`

**Status:** NOT in migration 0000 or any subsequent migration. NOT in live DB. Used by `drizzle-lms-misc.repo.ts`. **Runtime risk: HIGH** — any INSERT/SELECT will fail.

---

### Table: lms_certificates
File: `lib/db/src/schema/lms-extended.ts:64`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | NOT NULL FK → users.id CASCADE |
| exam_id | integer | NOT NULL FK → lms_exams.id CASCADE |
| score | real | NOT NULL |
| issued_at | timestamp | NOT NULL DEFAULT now() |
| expires_at | timestamp | — |
| status | varchar(20) | NOT NULL DEFAULT 'active' |
| created_at | timestamp | NOT NULL DEFAULT now() |

Check: `status IN (active/expired/revoked)`
Status: In migration snapshot 0000 line 3644. Confirmed in DB.

---

### Table: lms_events
File: `apps/api/src/shared/db/schema-misc-app-b.ts`
**Status:** Defined in API-local schema. Listed in `_drift_report_fresh.txt` as missing from DB (Drizzle-only). **Runtime risk: MEDIUM** — depends on whether it is queried.

### Table: lms_sessions
File: `apps/api/src/shared/db/schema-misc-app-b.ts`
**Status:** Same — missing from DB.

---

### Domain: POS / Warehouse (pos-schema-v2.ts)

The `pos-schema-v2.ts` file defines the core POS warehouse movement system with 20+ tables, all using `integer('material_id')` as the FK to `material_cards` (PK is `serial`). Key tables:

### Table: pos_movements
File: `lib/db/src/schema/pos-schema-v2.ts` (approx. line 100)
Confirmed in migration 0000 (line 1050). Uses `material_id` column pattern.

### Table: pos_movement_lines
File: `lib/db/src/schema/pos-schema-v2.ts`
Confirmed in migration 0000 (line 1026).

### Table: pos_movement_types
File: `lib/db/src/schema/pos-schema.ts:23`
Confirmed in migration 0000 (line 1040).

### Table: pos_inventory_counts
File: `lib/db/src/schema/pos-schema-v2.ts`
Confirmed in migration 0000.

### Table: pos_inventory_passport
File: migration `0016_pos_inventory_passport.sql` (raw SQL only, no Drizzle schema yet)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| movement_id | integer | NOT NULL FK → pos_movements.id CASCADE |
| material_code | varchar(100) | — |
| supplier_name | varchar(255) | — |
| contract_number | varchar(100) | — |
| waybill_number | varchar(100) | — |
| arrival_date | date | NOT NULL DEFAULT CURRENT_DATE |
| quantity | numeric(14,3) | NOT NULL DEFAULT 0 |
| weight_kg | numeric(10,3) | — |
| volume_m3 | numeric(10,3) | — |
| certificate_number | varchar(100) | — |
| quarantine_started_at | timestamptz | — |
| qc_started_at | timestamptz | — |
| qc_result | varchar(20) | CHECK IN (QABUL/REWORK/CHIQARISH) |
| qc_note | text | — |
| transferred_at | timestamptz | — |
| created_at | timestamptz | NOT NULL DEFAULT NOW() |
| updated_at | timestamptz | NOT NULL DEFAULT NOW() |

**Migration-only — no Drizzle schema yet.**

---

### Domain: CRM

Key tables (all confirmed in migration 0000):

### Table: crm_leads
File: `lib/db/src/schema/crm-contacts.ts:21`
Has `tenant_id` via drift-fix migration. FK pattern: integer PKs.

### Table: crm_deals
File: `lib/db/src/schema/crm-pipelines.ts:199`
Has `tenant_id`. Linked to `crm_pipelines`, `crm_stages`.

### Table: crm_contacts
File: `lib/db/src/schema/crm-contacts.ts:124`
Has `tenant_id`. 30+ columns.

### Table: crm_companies
File: `lib/db/src/schema/crm-contacts.ts:228`
Has `tenant_id`. Large drift — 18 columns missing from DB.

### Table: crm_invoices
File: `lib/db/src/schema/crm-proposals.ts:124`
Drizzle-only as of 2026-05-22 per `migrations-drift.ts`. Added via drift runner.

---

### Domain: Finance (fi-*)

Key tables from `fi-gl.ts`, `fi-ap-ar.ts`, `fi-budgets.ts`, `fi-banking.ts`:

| Table | File | Status |
|-------|------|--------|
| accounts | fi-gl.ts | In DB (migration 0000) |
| payroll_periods | fi-gl.ts | In DB (migration 0000) |
| gl_documents | fi-gl.ts | In DB |
| gl_lines | fi-gl.ts | In DB |
| accounting_periods | fi-gl.ts | In DB (line 407) |
| cost_centers | fi-advanced.ts | In DB (line 2266) |
| profit_centers | fi-advanced.ts | In DB (line 2428) |
| budgets | fi-budgets.ts | In DB (line 457) |
| budget_lines | fi-budgets.ts | In DB (line 448) |
| daily_financial_metrics | fi-payroll-calc.ts | In DB (line 484) |
| ai_finance_insights | fi-payroll-calc.ts | In DB |
| payroll_calculations | fi-payroll-calc.ts | In DB but dormant |

---

### Domain: Order Workflow (ow_* tables)

File: `lib/db/src/schema/order-workflow-schema.ts`
Defines 16 tables: `ow_work_orders`, `ow_tech_cards`, `ow_shipping_requests`, `ow_rework_events`, `ow_contracts`, `ow_credit_limits`, `ow_deliveries`, `ow_document_workflow_instances`, `ow_fg_transfers`, `ow_order_lines`, `ow_order_samples`, `ow_order_surveys`, `ow_packaging_records`, `ow_pallet_recoveries`, `ow_production_plans`, `ow_qc_results`.

**ALL 16 are absent from the live DB** per `_drift_report_fresh.txt`. They are Drizzle-only. No migration creates them. This entire module is not materialized in the DB.

---

### Domain: Agents / AI

File: `lib/db/src/schema/agent-schema.ts`
| Table | Confirmed |
|-------|-----------|
| agent_alerts | Migration 0011 |
| agent_cron_state | Migration 0011 |
| agent_module_health | Migration 0011 |
| agent_modules_registry | Migration 0011 |
| agents_audit_log | Migration 0011 |

---

## 3. Migration File Inventory

### apps/api/drizzle/ (Drizzle-managed, journal entry only for 0000)

| File | Timestamp | Content |
|------|-----------|---------|
| `0000_volatile_ender_wiggin.sql` | 2026-04-21 | Initial schema: 451 CREATE TABLE statements, 24 ENUMs. Core tables: users, employees, departments, attendance, sales_orders, production_orders, kanban_tasks, payroll, lms_courses, lms_enrollments, retail_pos_transactions, etc. |
| `0001_chat_messenger_tables.sql` | 2026-04-27 | Adds 5 chat tables: chat_emoji_packs, chat_custom_emoji, chat_join_requests, chat_push_subscriptions, chat_video_calls |
| `0002_crm_leads_id_sequence.sql` | — | Fixes crm_leads.id sequence |
| `0003_financial_reports_tables.sql` | — | Adds rpt_kassa_transactions, rpt_ombor_qoldiq, rpt_debitorlar (report snapshot tables) |
| `0004_coordination_tables_update.sql` | — | ALTERs dokla and rasporyazhenie — adds missing columns |
| `0005_kanban_extended_tables.sql` | — | Creates kanban_tags, kanban_card_tags, kanban_observers, kanban_co_executors, kanban_time_tracks, kanban_results, kanban_result_files, kanban_files, kanban_notifications, kanban_templates |
| `0006_communication_center.sql` | — | Communication center tables |
| `0007_cc_user_pins.sql` | — | Adds user_pins to communication center |
| `0008_cc_workflow_steps_seed.sql` | — | Seeds workflow steps data |
| `0009_vysotskiy_7_otdeleniye_seed.sql` | — | Seeds Vysotskiy department/grade data |
| `0010_hr_daily_reports_attendance.sql` | — | Adds hr_daily_reports, hr_ai_attendance, hr_late_arrivals |
| `0011_agents_infrastructure.sql` | — | Creates agents_audit_log, agent_module_health, agent_alerts, agent_cron_state, agent_modules_registry |
| `0012_agents_missing_tables.sql` | — | Adds warehouse_rolls, warehouse_roll_usage, purchase_requests |
| `0013_missing_indexes_and_fks.sql` | — | Performance indexes on kanban_cards, sales_orders, employees, pos_movements |
| `0014_type_corrections.sql` | — | ALTERs invoices.amount TEXT→NUMERIC, attendance.check_in_time TEXT→TIME |
| `0015_critical_schema_fixes.sql` | — | Adds password_hash, is_active, failed_login_attempts to users; code/name_uz/name_ru/level to positions; renames payroll.employee_id UUID→employee_id_legacy and adds new integer employee_id |
| `0016_pos_inventory_passport.sql` | — | Creates pos_inventory_passport, adds 'karantin' enum value |

**Journal note:** Only migration 0000 is registered in `meta/_journal.json`. Migrations 0001–0016 are applied outside the Drizzle journal (likely via raw SQL execution or the `migrations-drift.ts` invariant runner).

### lib/db/drizzle/ (Library-level migrations)

| File | Content |
|------|---------|
| `0000_nice_kylun.sql` | Main lib/db initial migration |
| `0001_add_indexes_only.sql` | Index additions |
| `0002_recruitment_funnel_refs_offers.sql` | Recruitment FK changes |
| `0003_pos_schema_extensions.sql` | POS extensions |
| `0004_hr_tz2_foundation.sql` | HR TZ2 module tables |
| `0005_lms_kanban_website_extended.sql` | LMS + kanban + website tables |
| `0006_fix_varchar_fk_to_integer.sql` | FK type corrections |
| `0007_hr_architecture_additions.sql` | HR architecture tables |
| `0008_fk_int_parallel_columns.sql` | Parallel FK integer columns |
| `0009_master_data_unique_codes.sql` | Unique code constraints |
| `0010_financial_reports_tables.sql` | Financial report tables |
| `0011_consolidated_legacy_fixes.sql` | Legacy schema fixes |
| `0016_add_tenant_id_to_hr_tables.sql` | Adds tenant_id to: employees, payroll_periods, salary_history, leave_requests, attendance, discipline_records, candidates, vacancies, aisha_conversations, aisha_tool_calls |
| `0050_migrate_departments_to_org.sql` | Migrates departments to org structure |

### apps/api/src/shared/db/migrations/ (Raw SQL, not Drizzle-managed)

Key files:
- `drift-fix-01-tenant-id.sql` — tenant_id additions
- `drift-fix-02-missing-cols.sql` — column drift fixes
- `hr-tz2-tables.sql` — HR TZ2 tables
- `aisha-tables.sql` — AI assistant tables
- `materialized-views.sql` — Materialized views for reporting
- `search-fts-indexes.sql` — Full-text search indexes
- `db-partitioning-prep.sql` — Partitioning preparation
- `tax-rate-config.sql` — Tax configuration
- Various seed files: `hr-demo-seed.sql`, `org-chart-seed.sql`, `vysotskiy-7-otdeleniye.sql`

---

## 4. Seed Scripts

| File | Purpose |
|------|---------|
| `apps/api/src/database/seeds/admin.seed.ts` | Creates initial admin user |
| `apps/api/src/database/seeds/master-data.seed.ts` | Seeds master reference data |
| `apps/api/src/database/seeds/data/departments.data.ts` | Department seed data |
| `apps/api/src/database/seeds/data/positions.data.ts` | Position seed data |
| `apps/api/src/database/seeds/data/position-permissions.data.ts` | RBAC permission seed |
| `apps/api/src/database/seeds/data/position-feature-flags.data.ts` | Feature flag seed |

---

## 5. Relations / Cross-table Dependencies

The schema uses explicit Drizzle FK references (`references(() => ...)`) rather than a centralized `relations()` block. Key dependency chains:

- `users` ← `employees` (userId FK)
- `departments` ← `employees`, `users`
- `employees` ← `attendance`, `salary_history`, `leave_requests`, `payroll_calculations`, `discipline_records`, `abc_analysis`
- `material_cards` ← `min_stock_alerts`, `consumption_suggestions`, `material_batches`, `pos_movement_lines` (via `material_id` column)
- `payroll_periods` ← `payroll_calculations`, `salary_history`
- `production_orders` ← `pos_inventory_passport` (via movement_id chain)
- `courses` ← `lms_exams`, `lms_modules`, `lms_lessons`, `position_required_courses`
- `warehouses` ← `pos_movements`, `pos_movement_lines`, `warehouse_bins`

---

## Summary

| Metric | Value |
|--------|-------|
| Total pgTable definitions (lib/db) | 665 |
| Total pgTable definitions (apps/api) | 362 |
| Unique table names (combined) | ~906 (after dedup) |
| Tables confirmed in live DB | 951 |
| Drizzle-only (missing from DB) | 73 |
| DB-only (no Drizzle definition) | ~20 |
| Tables with column drift | 177 |
| Total missing columns (Drizzle→DB) | 527 |
| Migration files (apps/api/drizzle) | 17 (0000–0016) |
| Migration files (lib/db/drizzle) | ~14 |
| Seed files | 6 |

## Gaps Table

| Area | Gap |
|------|-----|
| Order Workflow module (ow_* tables) | 16 tables defined in Drizzle, none in DB |
| lms_lessons | In Drizzle + code, missing from DB |
| pos_inventory_passport | Migration SQL only, no Drizzle schema |
| payroll table type | Changed UUID→INTEGER in migration 0015 without Drizzle schema update |
| attendance.check_in_time | Drizzle says `timestamp`, DB was converted to `TIME` in migration 0014 |
| current_stock.material_card_id | Column may be named differently in DB |

## Open Questions / UNVERIFIED

1. Do migrations 0001–0016 actually run on the live DB, or only migration 0000? The journal only registers 0000.
2. Does the `migrations-drift.ts` invariant runner execute on every boot? If so, it handles ~1151 ADD COLUMN / CREATE TABLE operations.
3. What is the exact schema of `current_stock` in the live DB — does the PK `id` and column `material_card_id` exist?
4. Are `lms_events` and `lms_sessions` actually queried in the live system?
5. Is `payroll.employee_id_legacy` (the renamed UUID column) still referenced anywhere in application code?
