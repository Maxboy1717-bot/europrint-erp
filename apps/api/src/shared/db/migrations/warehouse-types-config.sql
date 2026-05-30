-- warehouse-types-config.sql
-- 2026-05-30 — Ombor tip KONFIGURATSIYASI (config-driven poydevor, Maxboy vision).
-- Yangi ombor turi qo'shish = bitta INSERT (kod o'zgartmasdan). `rules` JSONB cheksiz kengaytirish uchun.
-- Idempotent: CREATE TABLE IF NOT EXISTS + INSERT ON CONFLICT DO NOTHING.
--
-- Qo'llash: psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/warehouse-types-config.sql

CREATE TABLE IF NOT EXISTS warehouse_types (
  code             varchar(40) PRIMARY KEY,
  name_uz          text NOT NULL,
  name_ru          text,
  category         varchar(30) NOT NULL,
  icon             varchar(40),
  inbound_flow     varchar(30) NOT NULL DEFAULT 'standard',
  outbound_flow    varchar(30) NOT NULL DEFAULT 'standard',
  needs_quarantine boolean NOT NULL DEFAULT false,
  needs_qc         boolean NOT NULL DEFAULT false,
  unit_basis       varchar(20) NOT NULL DEFAULT 'unit',
  label_template   varchar(30) NOT NULL DEFAULT 'standard',
  rules            jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order       integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warehouse_types_category ON warehouse_types(category);
CREATE INDEX IF NOT EXISTS idx_warehouse_types_active   ON warehouse_types(is_active);

-- Kanonik ombor turlari. Yangi tur kerak bo'lsa shu yerga 1 qator qo'shiladi (config-driven).
INSERT INTO warehouse_types
  (code, name_uz, name_ru, category, icon, inbound_flow, outbound_flow, needs_quarantine, needs_qc, unit_basis, label_template, sort_order) VALUES
  ('raw_material',         'Hom ashyo ombori',       'Склад сырья',             'material',   'Package',    'procurement_qc', 'production_issue', true,  true,  'unit',   'standard', 10),
  ('paper_rolls',          'Rulon qog''oz ombori',   'Склад рулонной бумаги',   'material',   'ScrollText', 'procurement_qc', 'production_issue', true,  true,  'weight', 'roll',     20),
  ('household_mro',        'Ho''jalik ombori',       'Хозяйственный склад',     'material',   'Hammer',     'procurement',    'consume',          false, false, 'unit',   'standard', 30),
  ('finished_goods',       'Tayyor mahsulot ombori', 'Склад готовой продукции', 'finished',   'Boxes',      'mes_qc',         'sales_order',      false, true,  'unit',   'finished', 40),
  ('production',           'Ishlab chiqarish ombori','Производственный склад',  'production', 'Factory',    'mes',            'production_issue', false, false, 'unit',   'standard', 50),
  ('defective',            'Brak/defekt ombori',     'Склад брака',             'waste',      'Trash2',     'qc_reject',      'dispose',          false, false, 'unit',   'standard', 60),
  ('waste_paper',          'Makulatura ombori',      'Склад макулатуры',        'waste',      'Recycle',    'waste_collect',  'sell',             false, false, 'weight', 'standard', 70),
  ('tools_equipment',      'Asbob-uskuna ombori',    'Склад инструментов',      'tools',      'Wrench',     'procurement',    'issue_return',     false, false, 'unit',   'standard', 80),
  ('department_warehouse', 'Bo''lim ombori',         'Складовое подразделение', 'department', 'Building2',  'transfer_in',    'order_consume',    false, false, 'unit',   'standard', 90)
ON CONFLICT (code) DO NOTHING;
