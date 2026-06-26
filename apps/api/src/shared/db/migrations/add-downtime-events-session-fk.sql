-- ===========================================================================
-- Migration: add-downtime-events-session-fk.sql              (2026-06-26, T8-02)
-- HOLAT: GATED — egasi qarori KUTILMOQDA (Q-35 owner-gated DDL + Q-40 fabrikatsiya taqiq)
--        Bu fayl HALI QO'LLANMAGAN. Pastdagi "EGASI QARORI" bajarilmaguncha QO'LLAMANG.
-- ===========================================================================
-- Vazifa (T8-02): downtime↔session FK ni tuzatish. Promt premisasi:
--   "downtime jadval session_id TEXT vs production_sessions.id UUID — FK buzilgan".
--
-- ⚠️ JONLI-DB TEKSHIRUVI (information_schema + _audit/q.cjs, 2026-06-26) — premisa NOTO'G'RI:
--   • downtime_events.session_id  = integer (int4), NOT NULL   — TEXT EMAS.
--   • production_sessions.id      = integer (int4) BASE TABLE  — UUID EMAS.
--   • mes_production_sessions     = VIEW (production_sessions ustida), id=integer.
--   → TYPE MOS (integer↔integer). Type-change / yangi uuid-ustun KERAK EMAS.
--   → "FK buzilgan" sababi TYPE EMAS, balki ORPHAN DATA (pastga qarang).
--
-- KANONIK FK NISHONI = production_sessions(id):
--   • production_sessions = BASE TABLE (FK nishoni bo'la oladi).
--   • mes_production_sessions = VIEW (FK nishoni BO'LA OLMAYDI).
--   • Qardosh MES jadvallar allaqachon shu naqshda:
--       mes_sos_events.session_id        → FK → production_sessions(id)
--       mes_material_consumption.session_id → FK → production_sessions(id)
--     downtime_events.session_id da bunday FK YO'Q (constraint ro'yxati bo'sh).
--
-- 🛑 FK QO'SHISHGA TO'SIQ — 2 ORPHAN qator (jonli, 2026-06-26):
--   downtime_events.id=2  session_id=42  → production_sessions'da 42 YO'Q
--   downtime_events.id=3  session_id=1   → production_sessions'da 1  YO'Q
--   (production_sessions mavjud id: 35,36,37,38,39,40,41,43)
--   Ikkala qator ham FK'ni 23503 bilan BUZADI. session_id NOT NULL — NULL qilib
--   bo'lmaydi. Bu 2 "42"/"1" downtime QAYSI haqiqiy sessiyaga tegishli ekanini
--   FABRIKATSIYA QILIB BO'LMAYDI (Q-40) — egasi DATA qaror qabul qilishi shart.
--
-- ❗ EGASI QARORI KERAK (ownerDataNeeded) — quyidagilardan BIRINI tanlang:
--   (A) 2 orphan qator TEST-AXLAT bo'lsa → ularni O'CHIRISH (DELETE) ga ruxsat bering.
--       Keyin pastdagi (A) blok + FK blokni ishga tushiring.
--   (B) Har orphan haqiqiy sessiyaga tegishli bo'lsa → to'g'ri session_id ni bering
--       (id=2→? , id=3→?), UPDATE qiling, keyin FK blokni ishga tushiring.
--   Bajaruvchi (agent) bu DELETE/UPDATE ni O'ZI bajarmaydi (DESTRUCTIVE/DATA).
--
-- ON DELETE: NO ACTION (default) — bola downtime'i bor sessiyani o'chirib bo'lmaydi
--   (xavfsiz; tasodifiy kaskad yo'q). Qardosh mes_* FK'lari ham shunday.
--
-- IDEMPOTENT: FK pg_constraint'da tekshiriladi; mavjud bo'lsa o'tkazib yuboriladi.
--
-- Qo'llash (egasi orphan qarorini berib bo'lgach, manual):
--   psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/add-downtime-events-session-fk.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- (A) ORPHAN TOZALASH — EGASI RUXSATISIZ ISHGA TUSHIRMANG.
--     Faqat egasi "ha, 42/1 = test-axlat, o'chir" desa kommentdan chiqaring.
-- ---------------------------------------------------------------------------
-- DELETE FROM downtime_events WHERE session_id NOT IN (SELECT id FROM production_sessions);

-- ---------------------------------------------------------------------------
-- (B) ORPHAN QAYTA-MAP — egasi to'g'ri session_id bersa (misol; qiymatni egasi beradi):
-- ---------------------------------------------------------------------------
-- UPDATE downtime_events SET session_id = <REAL_SESSION_ID> WHERE id = 2;
-- UPDATE downtime_events SET session_id = <REAL_SESSION_ID> WHERE id = 3;

-- ---------------------------------------------------------------------------
-- FK — orphanlar (A) yoki (B) bilan hal qilingach xavfsiz. Idempotent.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'downtime_events_session_id_fkey') THEN
    ALTER TABLE downtime_events ADD CONSTRAINT downtime_events_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES production_sessions(id) ON DELETE NO ACTION;
  END IF;
END $$;

-- Tekshiruv (kutilgan: 1 qator — downtime_events → production_sessions):
--   SELECT conname, conrelid::regclass AS child, confrelid::regclass AS parent
--   FROM pg_constraint WHERE conname = 'downtime_events_session_id_fkey';
