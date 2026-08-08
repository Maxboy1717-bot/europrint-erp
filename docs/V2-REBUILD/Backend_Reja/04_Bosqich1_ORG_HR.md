# 04 — BOSQICH 1: ORG TUZILMA + HR

> EuroPrint'ning poydevori: karta-markaz org + xodim, razryad, smena, oylik.
> Vizyon: [docs/audit/MASTER-SAVOL-JAVOB §Org/HR](../../audit/MASTER-SAVOL-JAVOB-2026-06-08.md).
> **Holat: 🔧 ~60% mavjud** — karta CRUD + razryad tayyor; AI moslik, oylik avtomatlash kerak.
> Bog'liqlik: [01_Poydevor.md](01_Poydevor.md) to'liq bo'lganidan keyin.

---

## 1.1 Karta-markaz model (vizyon)

```
KARTA (org_function) = to'g'ri ishning ta'rifi
  ├── Lavozim nomi (name)
  ├── Bo'lim (org_department_id)
  ├── Razryad talab (required_razryad_level_id)
  ├── Oylik formula (oylik_formula JSONB)
  ├── ЦКП (tsikl qo'shimcha ko'rsatkich)
  ├── Talab (talablar: texnik/shaxsiy JSONB)
  ├── Darslik (lms_course_id FK)
  └── O'z AI'si (xodim↔karta mosligini baholaydi)

XODIM (hr_employee) → kartaga bog'lansa → oylik+ERP
```

Karta birlamchi, xodim ikkilamchi. Ish boshlanmaydi — karta to'ldiriladi avval.

---

## 1.2 Mavjud jadvallar (tekshirilgan, commit 78aefcef)

```sql
-- razryad_levels (1-6 razryad)
CREATE TABLE razryad_levels (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  level INTEGER NOT NULL UNIQUE CHECK (level BETWEEN 1 AND 6),
  name_uz VARCHAR(100) NOT NULL,  -- "Birinchi razryad"
  name_ru VARCHAR(100),
  min_experience_months INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- org_functions (29+ FK hub — kanonik karta jadval)
CREATE TABLE org_functions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  org_department_id INTEGER REFERENCES org_departments(id),
  required_razryad_level_id INTEGER REFERENCES razryad_levels(id),
  oylik_formula JSONB,           -- {base, razryad_koeff, bonus_rules}
  tsikl_kpi JSONB,               -- ЦКП targets
  talablar JSONB,                -- texnik/shaxsiy talablar
  lms_course_id INTEGER,         -- darslik FK
  max_headcount INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

---

## 1.3 Qo'shilishi kerak (vizyon bo'shliqlari)

```sql
-- AI moslik baho (karta↔xodim):
CREATE TABLE IF NOT EXISTS org_function_ai_assessments (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  org_function_id INTEGER NOT NULL REFERENCES org_functions(id),
  hr_employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
  score NUMERIC(5,2),                 -- 0-100 moslik bali
  ai_report TEXT,                     -- AI hisobot
  recommendation VARCHAR(50),         -- 'fit'/'partial'/'unfit'
  assessed_by VARCHAR(50) DEFAULT 'ai',
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Razryad oshirilishi tarixi:
CREATE TABLE IF NOT EXISTS hr_razryad_history (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hr_employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
  old_razryad_level_id INTEGER REFERENCES razryad_levels(id),
  new_razryad_level_id INTEGER NOT NULL REFERENCES razryad_levels(id),
  reason TEXT,
  approved_by INTEGER REFERENCES users(id),
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 1.4 Xodim jadvali (mavjud, to'ldirish)

```ts
// lib/db/src/schema/hr-employees.ts (mavjud):
export const hrEmployees = pgTable('hr_employees', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  orgFunctionId: integer('org_function_id').references(() => orgFunctions.id),
  razryadLevelId: integer('razryad_level_id').references(() => razryadLevels.id),
  orgDepartmentId: integer('org_department_id').references(() => orgDepartments.id),
  employeeNumber: varchar('employee_number', { length: 50 }),
  hiredAt: date('hired_at'),
  firedAt: date('fired_at'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  // Personal:
  birthDate: date('birth_date'),
  gender: varchar('gender', { length: 10 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  // ...boshqa maydonlar
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

---

## 1.5 Service qatlami (mavjud, kengaytirish)

```ts
// apps/api/src/modules/org/application/services/org-functions.service.ts

async findCards(filters: { deptId?: number; razryadId?: number }): Promise<Result<OrgFunction[], AppError>> {
  return this.orgFunctionRepo.findAll(filters);
}

async assessFitness(functionId: number, employeeId: number): Promise<Result<AssessmentResult, AppError>> {
  // AI → Gemini API → moslik bali + hisobot
  // Natija → org_function_ai_assessments jadval
  // Inson tasdig'i kerak (E1 prinsipi)
}

async promoteRazryad(employeeId: number, newLevelId: number, approvedBy: number): Promise<Result<void, AppError>> {
  // hr_razryad_history → INSERT
  // hr_employees.razryad_level_id → UPDATE
  // Oylik formula qayta hisoblash trigger
}
```

---

## 1.6 Smena va oylik (mavjud, kengaytirish)

```sql
-- shift_handovers (mavjud VIEW mes_shift_handovers ustida):
SELECT * FROM shift_handovers; -- kanonik

-- Oylik hisob:
-- INPS: 8% (ish beruvchi)
-- NDFL: 12% (xodim)
-- 1.12M chegara (O'zbekiston, 2026)
-- Razryad koeffitsient: razryad_levels + org_function.oylik_formula
```

---

## 1.7 Acceptance kriterlari (Bosqich 1)

```
☐ Karta CRUD ishlaydi (org_function → create/read/update/soft-delete)
☐ Razryad 1-6 mavjud, xodimga bog'lanadi
☐ Xodim karta orqali bo'limga/razryadga bog'lanadi
☐ Smena hisoboti real DB saqlaydi
☐ Oylik hisob (INPS/NDFL/razryad-koeff) to'g'ri
☐ AI moslik → inson tasdig'i kerak (avtomatik jarima YO'Q)
☐ tsc 0 + test PASS
```

---

## 1.8 Ko'chiriladigan qismlar (eski EuroPrint)

| Fayl | Holat |
|------|-------|
| `apps/api/src/modules/org/` (barcha) | ✅ ko'chir |
| `apps/api/src/modules/hr/` (barcha) | ✅ ko'chir |
| `lib/db/src/schema/org-*.ts` | ✅ ko'chir |
| `lib/db/src/schema/razryad-levels.ts` | ✅ ko'chir |
| `lib/db/src/schema/hr-employees.ts` | ✅ ko'chir |
| `artifacts/erp-dashboard/src/pages/Org*.tsx` | ✅ ko'chir |
| `artifacts/erp-dashboard/src/pages/Employees*.tsx` | ✅ ko'chir |
| AI moslik baho qismi | 🔲 yangi |
| Razryad avtomatlash | 🔲 yangi |

---

*Keyingi: [05_Bosqich2_SD.md](05_Bosqich2_SD.md) — Savdo tizimi*
