-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- vision 07-pp#49 — Director "holat formulasi" PP reja% smena/kunlik SNAPSHOT.
--   Director dashboardi PP reja%-ni REAL-TIME emas, muzlatilgan SNAPSHOT asosida o'qiydi
--   (har smena yopilganda / kunlik cron yozadi). MES offline bo'lsa oxirgi TASDIQLANGAN
--   snapshot "offline" belgisi bilan ko'rsatiladi — noaniq real-time o'rniga xavfsizroq (A5).
--   Formula qat'iy: plan_percent = actual_qty / planned_qty * 100 (egasi DATA'si shart emas).
--   Bo'sh jadval -> Director 0% / "ma'lumot yo'q" default ko'radi.
--
-- #20 (pp_plan_fact_entries — per-order plan/fakt jurnali) dan ALOHIDA: bu Director uchun
--   muzlatilgan agregat snapshot (offline-xavfsiz), jonli agregat EMAS.
-- FAQAT ADD: yangi jadval, destructive amal yo'q. IF NOT EXISTS bilan idempotent.
--   Append-only: har smena/kun bir qator; Director eng oxirgi (captured_at DESC) qatorni o'qiydi.

CREATE TABLE IF NOT EXISTS pp_plan_snapshots (
  id              serial PRIMARY KEY,
  snapshot_date   date NOT NULL,
  period_type     varchar(10) NOT NULL DEFAULT 'daily',
  shift_label     varchar(20),
  work_center_id  integer,
  planned_qty     numeric(18, 4) NOT NULL DEFAULT 0,
  actual_qty      numeric(18, 4) NOT NULL DEFAULT 0,
  plan_percent    numeric(18, 4) NOT NULL DEFAULT 0,
  session_count   integer NOT NULL DEFAULT 0,
  source          varchar(20) NOT NULL DEFAULT 'shift_close',
  captured_at     timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pp_plan_snapshots_period_captured
  ON pp_plan_snapshots (period_type, captured_at);
