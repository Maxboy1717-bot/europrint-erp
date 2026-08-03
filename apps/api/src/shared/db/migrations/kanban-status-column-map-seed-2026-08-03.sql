-- Migration: kanban-status-column-map-seed-2026-08-03.sql
-- Sabab: `kanban_status_column_map` (schema-kanban.ts:97-102) jonli bazada 0 qator
-- bilan boshlanadi -- ish mexanizmi (KanbanCardsRepository.moveOrderCardByStatusMap,
-- OrderStatusChangedKanbanHandler orqali chaqiriladi) shu sababli hozircha no-op.
-- Shu o'zgarish bilan birga ownerga tayyor in-app CRUD qo'shildi
-- (GET/POST/PUT/DELETE /api/kanban/status-column-map, KanbanStatusColumnMapController).
-- Bu migratsiya CRUD bo'sh-by-default bo'lmasin deb bir nechta "aniq" default
-- qator qo'shadi. HECH QANDAY CREATE TABLE YO'Q -- jadval allaqachon mavjud.
--
-- Jonli DB tekshiruvi (2026-08-03, node _audit/q.cjs, read-only):
--   kanban_boards:            id=2 "Buyurtmalar" (type='sales')
--   kanban_columns(board_id=2): id=2 Navbatda, 3 Flekso, 4 Yuqori bosma,
--                                5 Kesish/Vysechka, 6 Kashirovka, 7 Qadoqlash, 8 Tayyor
--   SD buyurtma kartalari ANIQ shu boardga tushadi -- tasdiq:
--     kanban-cards.repo.ts createKanbanForOrder() board qidiruvi
--     `type = 'sales' OR name ILIKE '%buyurtma%' OR name ILIKE '%order%'`.
--   sales_orders: 0 qator (to'liq kompaniya reset, memory
--     project_full_company_reset_2026_07_11.md) -- haqiqiy status taqsimotini
--     tekshirib bo'lmadi. sd_status qiymatlari shuning uchun KOD-MANBADAN olindi:
--     apps/api/src/modules/sd/domain/value-objects/so-status.vo.ts (SoStatusType) --
--     bu aynan shu qiymatlarni ishlab chiqaruvchi modul; uning
--     UpdateOrderStatusHandler'i sd/domain/events/order-status-changed.event.ts
--     OrderStatusChangedEvent'ini nashr qiladi, uni esa OrderStatusChangedKanbanHandler
--     tinglaydi va moveOrderCardByStatusMap(orderId, newStatus) ga uzatadi --
--     ya'ni shu jadvaldagi sd_status ustuni bilan taqqoslanadigan ANIQ qiymat shu.
--
-- Mapping mantig'i -- FAQAT "aniq" holatlar (egasi buyrug'i: "map the obviously-
-- corresponding ones", noaniqlarini bo'sh qoldirish): ishlab chiqarish bosqichi
-- ustunlari (Flekso/Yuqori bosma/Kesish-Vysechka/Kashirovka/Qadoqlash) har biri
-- MAXSUS texnologik operatsiya -- generic 'in_production'/'in_progress' holati
-- ULARDAN BIRIGA ATAYLAB BOG'LANMAYDI (noto'g'ri taxmin bo'lardi); egasi buni
-- keyinchalik shu CRUD orqali o'zi tayinlaydi.
--   Navbatda (id=2) -- kutish/tayyorgarlik bosqichlari:
--     draft, pending_approval, approved, confirmed, pending_advance,
--     pending_material, ready_for_planning, in_planning, completed_planning,
--     ready_for_production
--   Tayyor (id=8) -- yakunlangan bosqichlar:
--     ready_for_shipment, shipped, delivered, closed
--
-- Idempotent: ON CONFLICT (sd_status) DO NOTHING -- qayta ishga tushirilsa xato
-- bermaydi, qator ikkilanmaydi (sd_status ustida jonli UNIQUE constraint bor:
-- kanban_status_column_map_sd_status_key).
--
-- APPROVED: owner 2026-08-03 (autonomous vision-gap-closure mandate -- data
-- seed only, no CREATE TABLE; table+mapping values fully derived from the
-- already-approved kanban auto-move mechanism this seed configures).

INSERT INTO kanban_status_column_map (sd_status, kanban_column_id) VALUES
  ('draft',                2),
  ('pending_approval',     2),
  ('approved',             2),
  ('confirmed',            2),
  ('pending_advance',      2),
  ('pending_material',     2),
  ('ready_for_planning',   2),
  ('in_planning',          2),
  ('completed_planning',   2),
  ('ready_for_production', 2),
  ('ready_for_shipment',   8),
  ('shipped',              8),
  ('delivered',            8),
  ('closed',               8)
ON CONFLICT (sd_status) DO NOTHING;
