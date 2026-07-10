-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 09-qc #48 — QC brak statistika Director paneliga durable outbox event-stream orqali;
-- QC servisi momentan uzilganda Director paneli oxirgi SNAPSHOT'ni + "ma'lumot N daqiqa eski"
-- belgisini ko'rsatadi.
--
-- MUHIM: real-time oqim = KANONIK outbox (domain_events + OutboxRepository/OutboxPublisher,
-- STANDARTLAR.md §15). Yangi `qc_outbox` YARATILMAYDI — u domain_events ni takrorlagan bo'lardi
-- (schema-queue "zero %outbox% tables" tekshiruvi domain_events ni nomida "outbox" yo'qligi uchun
-- o'tkazib yuborgan). Bu migration faqat Director paneli QC uzilganda o'qiydigan durable
-- read-model SNAPSHOT'ni qo'shadi (mavjud oee_snapshots / financial_ratios_snapshot naqshiga mos).

CREATE TABLE IF NOT EXISTS qc_brak_snapshot (
  id              serial PRIMARY KEY,
  scope           varchar(64)   NOT NULL DEFAULT 'global',
  total_braks     integer       NOT NULL DEFAULT 0,
  total_brak_qty  numeric(18,4) NOT NULL DEFAULT 0,
  open_defects    integer       NOT NULL DEFAULT 0,
  scrap_7days_qty numeric(18,4) NOT NULL DEFAULT 0,
  top_reason      text,
  by_stage        jsonb         NOT NULL DEFAULT '[]'::jsonb,
  by_reason       jsonb         NOT NULL DEFAULT '[]'::jsonb,
  computed_at     timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- Bitta durable snapshot per scope (single-writer UPSERT target — ON CONFLICT (scope)).
CREATE UNIQUE INDEX IF NOT EXISTS uq_qc_brak_snapshot_scope ON qc_brak_snapshot (scope);

-- 'global' scope qatorini seed qilamiz: Director paneli birinchi hisoblashdan oldin ham
-- snapshot o'qiy oladi. computed_at NULL qoladi → panel "hech qachon hisoblanmagan / eski"
-- fallback holatini ko'rsatadi (mavjud qatorlar regress bo'lmaydi — jadval yangi).
INSERT INTO qc_brak_snapshot (scope)
SELECT 'global'
WHERE NOT EXISTS (SELECT 1 FROM qc_brak_snapshot WHERE scope = 'global');
