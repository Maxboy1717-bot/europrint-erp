-- =============================================================================
-- DEMO CRM SEED
-- Fayl: docs/migration/seed/seed-demo-02-crm.sql
-- Yaratildi: 2026-06-20
-- Maqsad: CRM dashboard vizyonini ko'rsatish uchun demo/namuna ma'lumotlar
--         (Q-40: demo deb belgilangan — soxta emas)
-- Idempotent: ON CONFLICT + WHERE NOT EXISTS bilan takroriy ishlatsa xato bermaydi
-- DIQQAT: Sxema o'zgartirmaydi — faqat data INSERT
-- Kanonik: crm_companies / crm_leads / crm_deals
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Mavjud demo lead/deal tozalash (JUNK/NULL name leads demo uchun qulay emas)
--    Faqat NULL name + status_id IN (JUNK, IN_PROCESS) larni o'chiramiz
--    (bular dasturchi test qoldiqlardan tashkil topgan)
-- ---------------------------------------------------------------------------
UPDATE crm_leads
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND name IS NULL
  AND status_id IN ('JUNK', 'IN_PROCESS', 'CONVERTED', 'NEW')
  AND id < 2000;  -- faqat eski qo'lda yaratilganlar (auto-sequence 1000000+)

-- ---------------------------------------------------------------------------
-- 1. CRM_COMPANIES — O'zbek kompaniyalar (demo)
--    crm_companies.title = NOT NULL (default 'Unknown')
--    idempotent: title bo'yicha tekshiramiz (unikal constraint yo'q)
-- ---------------------------------------------------------------------------
INSERT INTO crm_companies (
  title, phone, email, address, industry, company_size,
  status, customer_type, segment, tenant_id,
  assigned_by_id, created_by_id, date_create
)
SELECT v.title, v.phone, v.email, v.address, v.industry, v.company_size,
       'active', 'legal', 'B2B', 1,
       1, 1, NOW()
FROM (VALUES
  ('Toshkent Matbaa Uyushma OAJ',   '+998711001234', 'info@tmu.uz',        'Toshkent sh., Mirzo-Ulugbek t.', 'Printing',    'medium'),
  ('Samarqand Digital Press MChJ',  '+998662345678', 'admin@sdpress.uz',   'Samarqand sh., Registon ko''ch.', 'Publishing',  'small'),
  ('UzPack Premium Qadoqlash',      '+998612009900', 'order@uzpack.uz',    'Namangan sh., Sanoat zonasi',    'Packaging',   'large'),
  ('Buxoro Reklama Agentligi',      '+998652001122', 'reklama@buxad.uz',   'Buxoro sh., Ark maydon, 5',      'Advertising', 'small')
) AS v(title, phone, email, address, industry, company_size)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_companies WHERE title = v.title AND deleted_at IS NULL
);

-- ---------------------------------------------------------------------------
-- 2. CRM_LEADS — 8 ta lead, turli voronka bosqichlarda (demo)
--    Kanonik status yo'nalishlari (status_description = API statusId):
--      NEW       → yangi tushgan (1-bosqich)
--      IN_PROCESS→ muloqot boshlandi (2-bosqich)
--      ANALYSIS  → ehtiyoj tahlili (3-bosqich)
--      FINAL     → taklif yuborildi (4-bosqich)
--      CONVERTED → muvaffaqiyatli aylantirildi
--      LOST      → yo'qotildi
--
--    crm_leads ustunlari (barcha NULL-ga ruxsat):
--      name, title, status, status_id, status_description
--      phones (jsonb), emails (jsonb)
--      assigned_by_id, created_by_id, date_create, tenant_id
--      opportunity_amount, budget, source_id, notes
-- ---------------------------------------------------------------------------
INSERT INTO crm_leads (
  name, contact_name, title, status, status_id, status_description,
  phones, emails,
  contact_phone, contact_email,
  assigned_by_id, created_by_id,
  date_create, tenant_id,
  opportunity_amount, budget,
  source_id, notes,
  company_title
)
SELECT
  v.name, v.name, v.title, v.status, v.status_id, v.status_description,
  v.phones::jsonb, v.emails::jsonb,
  v.phone, v.email,
  1, 1,
  NOW() - (v.days_ago || ' days')::interval,
  1,
  v.opportunity_amount, v.budget,
  v.source_id, v.notes,
  v.company_title
FROM (VALUES
  -- name, title, status, status_id, status_description,
  -- phones, emails, phone, email, days_ago,
  -- opportunity_amount, budget, source_id, notes, company_title
  (
    'Rustam Mirzayev',  'Demo: Gofra quti buyurtmasi',
    'new',       'NEW',        'NEW',
    '[{"value":"+998901234501","type":"WORK"}]',
    '[{"value":"r.mirzayev@tmu.uz","type":"WORK"}]',
    '+998901234501', 'r.mirzayev@tmu.uz',
    14,
    12000000, 15000000, 'WEBSITE',
    'Toshkent Matbaa Uyushma: 10,000 dona gofra quti kerak',
    'Toshkent Matbaa Uyushma OAJ'
  ),
  (
    'Dilnoza Yusupova', 'Demo: Katalog chop etish',
    'in_process', 'IN_PROCESS', 'IN_PROCESS',
    '[{"value":"+998932345601","type":"WORK"}]',
    '[{"value":"d.yusupova@sdpress.uz","type":"WORK"}]',
    '+998932345601', 'd.yusupova@sdpress.uz',
    10,
    8500000, 10000000, 'REFERRAL',
    'Samarqand Digital Press: 5000 dona A4 katalog, ofset baskı',
    'Samarqand Digital Press MChJ'
  ),
  (
    'Behruz Toshmatov', 'Demo: Polietilen qopchalar',
    'analysis', 'IN_PROCESS', 'ANALYSIS',
    '[{"value":"+998712345601","type":"WORK"}]',
    '[{"value":"b.toshmatov@uzpack.uz","type":"WORK"}]',
    '+998712345601', 'b.toshmatov@uzpack.uz',
    7,
    45000000, 50000000, 'COLD_CALL',
    'UzPack: oylik 50,000 dona PE qopcha buyurtmasi muhokama qilinmoqda',
    'UzPack Premium Qadoqlash'
  ),
  (
    'Kamola Nazarova',  'Demo: Reklama bannerlar',
    'analysis', 'IN_PROCESS', 'ANALYSIS',
    '[{"value":"+998652001155","type":"WORK"}]',
    '[{"value":"k.nazarova@buxad.uz","type":"WORK"}]',
    '+998652001155', 'k.nazarova@buxad.uz',
    5,
    6000000, 8000000, 'WEBSITE',
    'Buxoro Reklama: 50 dona 3x6m banner, UV chop',
    'Buxoro Reklama Agentligi'
  ),
  (
    'Jahongir Qodirov', 'Demo: Korxona logotipi stiker',
    'final', 'IN_PROCESS', 'FINAL',
    '[{"value":"+998901111222","type":"WORK"}]',
    '[{"value":"j.qodirov@company.uz","type":"WORK"}]',
    '+998901111222', 'j.qodirov@company.uz',
    3,
    3200000, 4000000, 'REFERRAL',
    'Stiker buyurtmasi: 20,000 dona vinyl stiker, har xil olchamlarda. Taklif yuborildi.',
    NULL
  ),
  (
    'Sarvinoz Holiqova', 'Demo: Toy taklifnomalari',
    'final', 'IN_PROCESS', 'FINAL',
    '[{"value":"+998711234000","type":"WORK"}]',
    '[{"value":"s.holiqova@mail.uz","type":"WORK"}]',
    '+998711234000', 's.holiqova@mail.uz',
    2,
    4800000, 5000000, 'SOCIAL_MEDIA',
    'Toy taklifnomalari: 500 dona premium karton, tilla bosma. Shartnoma kelishilmoqda.',
    NULL
  ),
  (
    'Murod Eshmatov',   'Demo: Yillik hisobot kitobchalar',
    'converted', 'CONVERTED', 'CONVERTED',
    '[{"value":"+998932001234","type":"WORK"}]',
    '[{"value":"m.eshmatov@corp.uz","type":"WORK"}]',
    '+998932001234', 'm.eshmatov@corp.uz',
    20,
    22000000, 25000000, 'EXHIBITION',
    'Muvaffaqiyatli: 1000 dona A5 hisobot kitobcha, tam rangli. Deal yaratildi.',
    'Toshkent Matbaa Uyushma OAJ'
  ),
  (
    'Feruza Abdullayeva', 'Demo: Qayta ishlash etiketkalar',
    'lost', 'JUNK', 'LOST',
    '[{"value":"+998712222333","type":"WORK"}]',
    '[{"value":"f.abdullayeva@eco.uz","type":"WORK"}]',
    '+998712222333', 'f.abdullayeva@eco.uz',
    25,
    9000000, 12000000, 'WEBSITE',
    'Yoqotildi: narx raqobatchilardan yuqori. Kelajakda qayta muloqot rejasi bor.',
    NULL
  )
) AS v(
  name, title, status, status_id, status_description,
  phones, emails, phone, email, days_ago,
  opportunity_amount, budget, source_id, notes, company_title
)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_leads
  WHERE name = v.name AND deleted_at IS NULL
);

-- ---------------------------------------------------------------------------
-- 3. CRM_DEALS — 4 ta deal, turli bosqichlarda (demo)
--    crm_deals.id = uuid (nullable)
--    status = text (domain: qualification/proposal/negotiation/won/lost)
--    forecast_amount = numeric
--    stage_semantic_id = varchar (deal pipeline stage)
--    assigned_by_id = integer (admin user id = 1)
-- ---------------------------------------------------------------------------
-- NOTE: crm_deals is a VIEW over 'deals' table.
--   deals.amount (NOT NULL), deals.title (NOT NULL), deals.currency (NOT NULL default 'UZS'),
--   deals.status (NOT NULL default 'new'), deals.created_at (NOT NULL default now()).
--   Insert via the view: amount = forecast_amount (same business value).
INSERT INTO crm_deals (
  title, status, stage_semantic_id, stage_id,
  amount, forecast_amount, opportunity, currency,
  probability, assigned_by_id, created_by_id,
  date_create
)
SELECT
  v.title, v.status, v.stage_semantic_id, v.stage_semantic_id,
  v.amount, v.amount, v.amount, 'UZS',
  v.probability, 1, 1,
  NOW() - (v.days_ago || ' days')::interval
FROM (VALUES
  (
    'Demo: UzPack — PE Qopchalar Kontrakt',
    'negotiation', 'NEGOTIATION',
    45000000::numeric, 75, 5
  ),
  (
    'Demo: Murod Eshmatov — Hisobot Kitobcha',
    'won', 'WON',
    22000000::numeric, 100, 20
  ),
  (
    'Demo: Samarqand Digital Press — Katalog',
    'proposal', 'PROPOSAL',
    8500000::numeric, 40, 10
  ),
  (
    'Demo: Toshkent Matbaa — Gofra Quti',
    'qualification', 'QUALIFICATION',
    12000000::numeric, 20, 14
  )
) AS v(title, status, stage_semantic_id, amount, probability, days_ago)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_deals WHERE title = v.title AND deleted_at IS NULL
);

-- ---------------------------------------------------------------------------
-- Tekshiruv: Hisob
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  lead_count INT;
  deal_count INT;
  company_count INT;
BEGIN
  SELECT COUNT(*) INTO lead_count   FROM crm_leads   WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO deal_count   FROM crm_deals   WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO company_count FROM crm_companies WHERE deleted_at IS NULL;

  RAISE NOTICE 'CRM DEMO SEED natija: leads=%, deals=%, companies=%',
    lead_count, deal_count, company_count;

  IF lead_count < 8 THEN
    RAISE WARNING 'Kutilgan leads soni 8 dan kam: %', lead_count;
  END IF;
  IF deal_count < 4 THEN
    RAISE WARNING 'Kutilgan deals soni 4 dan kam: %', deal_count;
  END IF;
END
$$;

COMMIT;
