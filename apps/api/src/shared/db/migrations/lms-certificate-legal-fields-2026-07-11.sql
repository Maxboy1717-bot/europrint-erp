-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- LMS-12 #30 — Legal-minimal certificate fields + SHA-256
-- Vision: docs/audit/vision-1000-answers/12-lms.md #30 — "Yuridik minimal ma'lumot:
-- to'liq ism, lavozim, tashkilot nomi, mavzu-mavzu tasdiq sanasi+vaqti, IP manzil,
-- raqamli imzo hash (SHA-256) — F5 (immutable hujjat) talabiga to'liq mos."
-- ----------------------------------------------------------------------------
-- ism (holderName, employees JOIN) va sana (issued_at/issued_date) allaqachon
-- certificates jadvalida mavjud. Yetishmayotgan ikkita texnik ustun shu migration
-- bilan qo'shiladi:
--   - issued_ip:  sertifikat chiqarilgan paytdagi so'rovchi IP manzili
--   - cert_hash:  sertifikat payload (employee/course/cert-raqami/muddat/kim berdi)
--     ustidan SHA-256 hex-digest — raqamli imzo o'rnini bosuvchi immutable tasdiq
-- Additive-only: mavjud ustunlar o'zgarmaydi, ikkalasi ham NULL-qabul qiluvchi
-- (eski qatorlar buzilmaydi, Q-39). Wired in both certificate-issuance write paths
-- (LmsCertRepo.saveCertificate for POST /lms/certificates/issue,
-- LmsCoursesExtendedRepository.saveCertificate for POST /certificates) — both
-- insert into this same table.
-- Actually applied at boot (idempotent, IF NOT EXISTS) via
-- apps/api/src/shared/db/invariants/migrations-schema.ts -> ensureSchemaAdditions() —
-- this file is the human-readable mirror of that entry.
-- ============================================================================

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_ip VARCHAR(64);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS cert_hash VARCHAR(64);
