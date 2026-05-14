-- ============================================================================
-- Migration: 0015_critical_schema_fixes
-- Maqsad: Kritik sxema muammolarini tuzatish
--
-- C-05: users jadvalidagi yetishmagan autentifikatsiya ustunlari
-- C-06: payroll.employee_id UUID → INTEGER (employees.id bilan mos kelishi uchun)
-- C-07: positions jadvalidagi yetishmagan ustunlar (seed ma'lumotlari uchun)
-- ============================================================================

-- ============================================================================
-- C-05: users — autentifikatsiya uchun yetishmagan ustunlar
-- DrizzleAuthRepo ishlashi uchun bu ustunlar shart.
-- ============================================================================
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_hash"          text,
  ADD COLUMN IF NOT EXISTS "is_active"              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "last_login_at"          timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "failed_login_attempts"  integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_until"           timestamp with time zone;

-- ============================================================================
-- C-07: positions — seed va RBAC uchun yetishmagan ustunlar
-- ============================================================================
ALTER TABLE "positions"
  ADD COLUMN IF NOT EXISTS "code"      varchar(50),
  ADD COLUMN IF NOT EXISTS "name_uz"   text,
  ADD COLUMN IF NOT EXISTS "name_ru"   text,
  ADD COLUMN IF NOT EXISTS "level"     integer    NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "rbac_tier" varchar(20) NOT NULL DEFAULT 'READ',
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

-- ============================================================================
-- C-06: payroll.employee_id UUID → INTEGER
-- Xavfsiz usul: eski ustun nom o'zgartirib yangi INT ustun qo'shish.
-- Mavjud UUID ma'lumotlar saqlash uchun eski ustun "employee_id_legacy" sifatida qoladi.
-- ============================================================================

-- 1. Eski UUID ustunni zaxira sifatida saqlash
ALTER TABLE "payroll"
  RENAME COLUMN "employee_id" TO "employee_id_legacy";

-- 2. Yangi INTEGER ustun qo'shish (employees.id ga FK)
ALTER TABLE "payroll"
  ADD COLUMN "employee_id" integer;

-- 3. Agar UUID-dan INT-ga avtomatik o'tkazish mumkin bo'lsa (masalan, employees.user_id orqali) — moslash
-- Hozircha NULL — dastur darajasida to'ldirish kerak.

-- 4. employees jadvaliga FK qo'shish (agar to'ldirilgandan keyin)
-- ALTER TABLE "payroll"
--   ADD CONSTRAINT "payroll_employee_id_fk"
--   FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;
-- (Ustun to'ldirilgandan keyin quyidagini qo'lda bajarish kerak)

-- ============================================================================
-- L-02: deals.id va leads.id — DEFAULT gen_random_uuid() yo'q
-- INSERT ...  VALUES (...) dan id tashlab qo'yilsa PostgreSQL error beradi.
-- ============================================================================
ALTER TABLE "deals" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "leads" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- crm_deals va crm_leads uchun ham
ALTER TABLE "crm_deals" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "crm_leads" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- ============================================================================
-- Indekslar
-- ============================================================================
CREATE INDEX IF NOT EXISTS "users_is_active_idx"
  ON "users" ("is_active")
  WHERE "is_active" = true;

CREATE INDEX IF NOT EXISTS "positions_code_idx"
  ON "positions" ("code")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "payroll_employee_id_idx"
  ON "payroll" ("employee_id");
