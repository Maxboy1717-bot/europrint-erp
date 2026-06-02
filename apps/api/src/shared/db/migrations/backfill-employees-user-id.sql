-- ===========================================================================
-- Migration: backfill-employees-user-id.sql            (2026-06-02)
-- ===========================================================================
-- Sabab (problem):
--   `employees.user_id` jonli `europrint` bazasida 30/30 NULL edi, va
--   `employees.id` ≠ `users.id` (0 mos). Natijada org-sxema asosidagi 2 ta
--   resolver jim buziladi:
--     1) communication-center/cc-org-resolver.service.ts
--        - resolveManagerOfSender()  (WHERE e.user_id = senderUserId)
--        - resolveByPosition()       (SELECT e.user_id ... AND e.user_id IS NOT NULL)
--        → user_id NULL bo'lgani uchun BadRequestException.
--     2) org-structure/org-queries.repo.ts  getDirectManager / getTelegramGroup
--        → `JOIN employees e ON e.id::text = u.id::text` hech qachon mos kelmaydi.
--
-- KANONIK BOG'LANISH (DB so'rovlari bilan ISBOTLANGAN, taxmin emas):
--   `users.employee_id` → `employees.id`  (users dagi aniq FK ustun).
--   • 30/30 user'da employee_id bor, dublikatsiz, toza 1:1 bijeksiya.
--   • email, phone_number va full_name signallari AYNAN bir xil 30 juftni beradi.
--   • Drizzle schema ham shuni tasdiqlaydi:
--       lib/db/src/schema/employees.ts → userId = integer('user_id')
--         .references(() => users.id, { onDelete: 'set null' }).unique()
--     Ya'ni `employees.user_id → users.id` — dizayn bo'yicha kanonik ko'prik;
--     u shunchaki jonli data'da to'ldirilmagan edi.
--   • 31-chi user = `admin` (super_admin, employee_id NULL) — xodim emas, to'g'ri.
--
-- Bu migration ADD-ONLY va IDEMPOTENT:
--   - faqat `user_id IS NULL` qatorlarni to'ldiradi (mavjud bog'lanishni o'zgartirmaydi),
--   - qayta ishga tushirilsa 0 qator yangilanadi.
--   - `employees.user_id` UNIQUE — har bir user_id yagona xodimga tegishli
--     bo'lgani uchun (users.employee_id unique) cheklov buzilmaydi.
--
-- Qo'lda ishlatish (agar boot self-heal ishlamasa):
--   psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/backfill-employees-user-id.sql
-- Boot'da avtomatik: OrgStructureService.onModuleInit() → backfillEmployeeUserId()
--   (apps/api/src/common/database/ddl-migrations.ts).
-- ===========================================================================

UPDATE employees e
SET    user_id = u.id
FROM   users u
WHERE  u.employee_id = e.id      -- kanonik FK
  AND  e.user_id IS NULL;        -- ADD-ONLY + idempotent: faqat bo'sh qatorlar

-- Tekshiruv (kutilgan: linked = 30, still_null = 0):
--   SELECT COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS linked,
--          COUNT(*) FILTER (WHERE user_id IS NULL)     AS still_null
--   FROM employees;
