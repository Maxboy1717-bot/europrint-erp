# ORG Phase 1 — MIGRATSIYA TOPILMASI (ishga tushirishdan OLDIN) — 2026-06-08

> ⛔ Hech qanday SQL ishga tushirilmadi. Bu — migratsiyani yozishdan oldingi jonli tekshiruv natijasi (Q-29 verify-don't-trust).
> ⚠️ **Topilma owner qarorining asosini o'zgartiradi** → tasdiqlash kerak (Q-27/Q-34).

---

## 1. ⭐ KRITIK TOPILMA — kanonik jadval TESKARI

Phase 0 da men `positions` ni "boyroq ustun" deb baholagandim → owner `positions` = kanonik karta dedi, `org_functions` → VIEW.
**Jonli FK tekshiruv buni TESKARIga chiqardi:**

| O'lchov | `org_functions` (97) | `positions` (96) |
|---|---|---|
| Unga ishora qiluvchi FK | **29 ta (28 jadval)** | **0 ta** |
| `employees.org_function_id` | 30/30 to'la | — |
| `users.org_function_id` (login) | 30/31 to'la | — |
| BE kod referens | 24 fayl | 17 fayl |
| **Rol** | **HAQIQIY hub/karta** | boy ustun, lekin hech kim ishora qilmaydi |

`org_functions` ga ishora qiluvchi 28 jadval: employees, users, candidates, applications, ai_exam_attempts, vacancies, salary_bands, succession_plans, career_development_plans, guidelines, hr_job_descriptions, hr_onboarding_plans, hr_tz2_ai_question_banks, hr_tz2_contract_versions, job_templates, onboarding_tasks, position_feature_flags, position_permissions, position_required_courses, position_skill_requirements, position_folder_content, questionnaire_responses/templates, tests, hr_question_bank, document_routing_rules (×2), adaptation_programs.

**Qo'shimcha:** `org_functions` va `positions` qatorlmas — id=1 `org_functions`da "Bosh direktor" (dept 19), `positions`da "Egasi" (dept 20). Bir xil id ≠ bir xil ma'no. `org_functions.tskp/target/measurement` = HAMMASI NULL (ko'chiriladigan data yo'q). Ikkalasi ham `department_id` → `org_departments` (daraxt) ga to'g'ri ulanadi (96/96 va 97/97).

## 2. Nega owner rejasi (org_functions→VIEW) XAVFLI (Q-39)
1. **PostgreSQL VIEW ga FK qo'yib bo'lmaydi** → 29 FK constraint'ni DROP qilish kerak.
2. `employees.org_function_id` (30) + `users.org_function_id` (30) `positions` ning BOSHQA ma'noli id'lariga ko'chadi → **xodim↔lavozim + login buziladi** (data buzilishi).
3. 28 jadval buziladi = katta regressiya.

→ Owner rejasi to'g'ri NIYAT (bitta kanonik karta), lekin NOTO'G'RI yo'nalish (men bergan chala Phase 0 sababli).

---

## 3. ✅ TAVSIYA — yo'nalishni TESKARI qilish (xavfsiz, soddaroq, vizyonga mos)

**Kanonik karta = `org_functions`** (haqiqiy hub). `positions` (0 FK) keyin VIEW bo'ladi yoki qoladi.

Bu HAR jihatdan yaxshiroq:
- ❌ FK drop YO'Q · ❌ employee/user re-point YO'Q · ❌ regressiya YO'Q.
- ✅ MASALA-3 **allaqachon hal** — `tskp_measurement_unit` ustuni `org_functions`da BOR (kanonik kartada), faqat to'ldiriladi.
- ✅ Faqat yetishmagan karta-ustunlarini `org_functions`ga ADD + `razryad_levels` yaratish.
- ✅ `positions` ning boyligi (ckp/code/level/salary/rbac) `org_functions`ga ADD COLUMN bilan keladi.

### Taklif qilingan migratsiya (KO'RSATILDI — hali ishga tushmadi)

```sql
-- APPROVED: owner 2026-06-08  (org_functions = kanonik karta — TESKARI yo'nalish tasdiqlangach)

-- A) razryad master-data (MASALA-2)
CREATE TABLE IF NOT EXISTS razryad_levels (
  id              SERIAL PRIMARY KEY,
  level           INTEGER NOT NULL,
  name            TEXT NOT NULL,
  min_requirement TEXT,
  salary_min      NUMERIC(14,2),
  salary_max      NUMERIC(14,2),
  exam_type       TEXT,
  certificate     TEXT,
  description      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (level)
);

-- B) org_functions = kanonik KARTA — yetishmagan karta-ustunlari (idempotent)
ALTER TABLE org_functions
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'active',   -- active/frozen/vacant/archived/io (EP-ORG-083)
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ,                       -- soft-delete (EP-ORG-005)
  ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER REFERENCES razryad_levels(id),  -- EP-ORG-008
  ADD COLUMN IF NOT EXISTS salary_type      TEXT,                              -- ishbay/soatbay/oylik (EP-ORG-024)
  ADD COLUMN IF NOT EXISTS code             TEXT,                              -- karta kodi (EP-ORG-037)
  ADD COLUMN IF NOT EXISTS level            INTEGER,                           -- daraja
  ADD COLUMN IF NOT EXISTS rbac_tier        TEXT,                              -- RBAC (EP-ORG-023)
  ADD COLUMN IF NOT EXISTS min_salary       NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS max_salary       NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS ckp              TEXT,                              -- ЦКП matn (positions.ckp dan)
  ADD COLUMN IF NOT EXISTS ai_exam_enabled  BOOLEAN DEFAULT false,             -- EP-ORG-046
  ADD COLUMN IF NOT EXISTS statistics_type  TEXT,
  ADD COLUMN IF NOT EXISTS manager_id       INTEGER,                           -- ota-karta/rahbar (EP-ORG-021)
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();
-- tskp_measurement_unit ALLAQACHON bor (MASALA-3 — reuse).

-- C) 1 seat = 1 active employee (EP-ORG-002) — race-safe DB unique index
--    (faqat band kartalar: bitta org_function_id ga bitta faol xodim)
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_active_org_function
  ON employees(org_function_id) WHERE org_function_id IS NOT NULL AND status = 'active';

-- D) positions data → org_functions backfill (name bo'yicha, ixtiyoriy — Phase 1 da DEFER mumkin)
--    [Owner tasdiqlasa keyin: UPDATE org_functions f SET ckp=p.ckp, code=p.code, ... FROM positions p WHERE lower(p.name_uz)=lower(f.position_name)]
```

> `positions` → VIEW: Phase 1 da TEGILMAYDI (0 FK, zararsiz). Keyingi qadamda (yoki Phase 6) `positions` ni `org_functions` ustidan VIEW qilamiz — owner xohlasa.

---

## 4. ⛔ STOP — owner qarori kerak
1. **Yo'nalishni tasdiqlang:** kanonik karta = **`org_functions`** (tavsiyam, xavfsiz) — ha/yo'q?
2. Yuqoridagi migratsiya SQL — ha (ishga tushiray) / o'zgartirish?
3. `positions` boyligini `org_functions`ga backfill — Phase 1 da qilaymi yoki DEFER?
4. (D) backfill name-match fuzzy (99 moslik / 96-97 qator) — ehtiyot bo'lib qilaymi yoki qo'lda mapping?

"Ha, org_functions + SQL OK" desangiz → APPROVED marker bilan migratsiyani yozaman → **sizga oxirgi SQL ni ko'rsataman** → ishga tushiraman → DB-proof → davom.

*Tayyorlandi: 2026-06-08 · Bajaruvchi · Hech narsa ishga tushmadi (faqat tekshiruv+taklif).*
