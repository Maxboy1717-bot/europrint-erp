-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Modul 04 (Coordination) — dokla (hisobot/memo) va rasporyazhenie (farmoyish/directive)
-- o'chirish endi soft-delete + audit-trail (owner qarori, 2026-07-13 chat). Avval
-- coordination.repository.ts deleteDokla()/deleteRasp() haqiqiy Drizzle .delete()
-- hard-DELETE edi (qaytarib bo'lmaydigan). deleted_at/deleted_by — additive, nullable
-- (Q-35/Q-46).
--
-- sd_customers.deleted_at/deleted_by shaklini aynan aks ettiradi (VISION-3340 #63,
-- commit 01daa468): deleteDokla/deleteRasp endi UPDATE ... SET deleted_at=NOW(),
-- deleted_by=<caller id> bajaradi (real DELETE emas). Barcha SELECT/list/stats o'qish
-- yo'llari endi deleted_at IS NULL bilan filtrlanadi: coordination.repository.ts
-- (listDokla, getDoklaById, getStatsDokla, createRaspFromDokla, listRasporyazhenie,
-- getRaspById, getStatsRasp), director-data.repository.ts (queryAiSummary overdue
-- count), rasporyazhenie-escalation.cron.ts (kunlik overdue-eskalatsiya).
--
-- deleted_at TIMESTAMP (timezone'siz) — dokla/rasporyazhenie'ning mavjud
-- created_at/updated_at/done_at ustunlari va sd_customers.deleted_at bilan bir xil
-- tip (barchasi live'da `timestamp without time zone`).
ALTER TABLE IF EXISTS dokla ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE IF EXISTS dokla ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

ALTER TABLE IF EXISTS rasporyazhenie ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE IF EXISTS rasporyazhenie ADD COLUMN IF NOT EXISTS deleted_by INTEGER;
