-- ============================================================================
-- Migration: 0013_missing_indexes_and_fks
-- Maqsad: Tez-tez ishlatiladigan so'rovlar uchun yetishmagan performans indekslari
--
-- FK izoh: kanban junction jadvallari (kanban_card_tags, kanban_observers va boshq.)
-- card_id ni TEXT sifatida saqlaydi, lekin kanban_cards.id SERIAL (INTEGER).
-- PostgreSQL turlar mos kelmasa FK yaratishga ruxsat bermaydi — shuning uchun
-- FK o'rniga index bilan ishlash davom etadi.
-- ============================================================================

-- ── kanban_cards: ustun + tartib bo'yicha (doskanı render qilishda asosiy) ──
CREATE INDEX IF NOT EXISTS "kanban_cards_column_sort_idx"
  ON "kanban_cards" ("column_id", "sort_order" ASC)
  WHERE "deleted_at" IS NULL;

-- ── kanban_cards: board bo'yicha (barcha kartalarni olish) ──────────────────
CREATE INDEX IF NOT EXISTS "kanban_cards_board_idx"
  ON "kanban_cards" ("board_id")
  WHERE "deleted_at" IS NULL;

-- ── kanban_cards: muddatli kartalar uchun (Gantt view) ─────────────────────
CREATE INDEX IF NOT EXISTS "kanban_cards_due_date_idx"
  ON "kanban_cards" ("due_date")
  WHERE "deleted_at" IS NULL AND "due_date" IS NOT NULL;

-- ── kanban_cards: ustun + o'chirilmagan (eng ko'p ishlatiladigan filter) ───
CREATE INDEX IF NOT EXISTS "kanban_cards_column_active_idx"
  ON "kanban_cards" ("column_id")
  WHERE "deleted_at" IS NULL;

-- ── kanban_notifications: foydalanuvchi + o'qilmagan (compound) ────────────
-- 0005 migratsiyasida faqat alohida indekslar bor: (user_id) va (is_read)
-- Bu compound indeks "menga tegishli o'qilmagan bildirishnomalar" so'rovini
-- index-only scan bilan bajaradi.
CREATE INDEX IF NOT EXISTS "kanban_notif_user_unread_idx"
  ON "kanban_notifications" ("user_id", "is_read", "created_at" DESC)
  WHERE "is_read" = false;

-- ── sales_orders: status bo'yicha filter ────────────────────────────────────
CREATE INDEX IF NOT EXISTS "sales_orders_status_idx"
  ON "sales_orders" ("status")
  WHERE "deleted_at" IS NULL;

-- ── sales_orders: o'chirilmaganlar (soft delete guard) ─────────────────────
CREATE INDEX IF NOT EXISTS "sales_orders_active_idx"
  ON "sales_orders" ("created_at" DESC)
  WHERE "deleted_at" IS NULL;

-- ── sales_orders: mijoz bo'yicha (CRM 360 view) ────────────────────────────
CREATE INDEX IF NOT EXISTS "sales_orders_customer_idx"
  ON "sales_orders" ("customer_id")
  WHERE "deleted_at" IS NULL;

-- ── sd_payments: buyurtma bo'yicha (to'lovlarni olish) ─────────────────────
CREATE INDEX IF NOT EXISTS "sd_payments_order_idx"
  ON "sd_payments" ("order_id");

-- ── sd_payments: holat bo'yicha ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "sd_payments_status_idx"
  ON "sd_payments" ("status", "created_at" DESC);

-- ── kanban_tasks: karta bo'yicha (subtask ro'yxati) ─────────────────────────
-- 0000 da kanban_tasks_status_idx bor, lekin card_id indeksi yo'q
CREATE INDEX IF NOT EXISTS "kanban_tasks_card_idx"
  ON "kanban_tasks" ("card_id")
  WHERE "deleted_at" IS NULL;

-- ── kanban_card_comments: karta bo'yicha ────────────────────────────────────
CREATE INDEX IF NOT EXISTS "kanban_comments_card_idx"
  ON "kanban_card_comments" ("card_id", "created_at" DESC);

-- ── kanban_time_tracks: faol tracker uchun ─────────────────────────────────
CREATE INDEX IF NOT EXISTS "kanban_time_running_idx"
  ON "kanban_time_tracks" ("user_id", "is_running")
  WHERE "is_running" = true;

-- ── cc_documents: savatcha bo'yicha (CC Inbox tezligi) ─────────────────────
-- 0006 da cc_doc_basket_owner_idx (basket_owner_user_id, basket_state) bor
-- Qo'shimcha: faqat basket_state bo'yicha (SUPER_ADMIN uchun)
CREATE INDEX IF NOT EXISTS "cc_doc_basket_state_idx"
  ON "cc_documents" ("basket_state", "basket_entered_at" DESC);

-- ── cc_approvals: muddati o'tgan tasdiqlashlar uchun ───────────────────────
-- 0006 da cc_appr_state_idx va cc_appr_deadline_idx alohida bor
-- Compound: SLA cron uchun
CREATE INDEX IF NOT EXISTS "cc_appr_pending_deadline_idx"
  ON "cc_approvals" ("state", "deadline_at" ASC)
  WHERE "state" = 'pending';

-- ── agent_alerts: o'qilmagan ogohlantirishlar (AlertFeed) ──────────────────
-- 0011 da agent_alerts_user_idx (target_user_id, is_read, created_at) bor ✅
-- Qo'shimcha: rol bo'yicha (DIRECTOR alerts)
CREATE INDEX IF NOT EXISTS "agent_alerts_role_idx"
  ON "agent_alerts" ("target_role", "is_read", "created_at" DESC)
  WHERE "is_read" = false;

-- ── refresh_tokens: token lookup (blacklist tekshiruvi har so'rovda) ────────
-- isTokenBlacklisted() WHERE token = $hash AND expires_at > NOW() — indekssiz
-- bu jadval o'sib boradi va full scan bo'ladi.
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_idx"
  ON "refresh_tokens" ("token")
  WHERE "is_revoked" = true;
