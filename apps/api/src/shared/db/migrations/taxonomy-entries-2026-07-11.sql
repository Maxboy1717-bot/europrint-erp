-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- §2 Taksonomiya CRUD (OWNER-JAVOBLAR-2026-07-11): mahsulot turi / chegirma / bezash / qadoqlash /
-- aloqa turi / hujjat turi / kod-prefiks va boshqa nomli ro'yxatlar — bitta umumiy mexanizm.
-- Egasi kategoriya ostiga yozuv qo'shadi (nom uz/ru + tartib + ixtiyoriy attrs jsonb qo'shimcha
-- maydonlar uchun, masalan mahsulot-turi o'lchamlari). Mavjud maxsus jadvallar (pp_flute_types,
-- crm_activity_types, crm_stages) tegilmaydi — bu faqat YANGI taksonomiyalar uchun.
CREATE TABLE IF NOT EXISTS taxonomy_entries (
  id          SERIAL PRIMARY KEY,
  category    VARCHAR(60)  NOT NULL,              -- 'product_type','discount_type','decoration_type','packaging_type',...
  code        VARCHAR(60)  NOT NULL,              -- kanonik kod (kategoriya ichida unikal)
  name_uz     VARCHAR(200) NOT NULL,
  name_ru     VARCHAR(200),
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  attrs       JSONB,                              -- ixtiyoriy qo'shimcha maydonlar (o'lcham, koeff, semantics...)
  description TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT taxonomy_entries_cat_code_uniq UNIQUE (category, code)
);
CREATE INDEX IF NOT EXISTS taxonomy_entries_category_idx ON taxonomy_entries(category);
