-- =============================================================================
-- DEMO DATA: Marketing namuna — 6 kampaniya × 8 kanal
-- Fayl: docs/migration/seed/seed-demo-02-marketing.sql
-- Maqsad: Dashboard vizyonini ko'rsatish (DEMO/namuna, real data emas)
-- Idempotent: ON CONFLICT DO NOTHING + DELETE WHERE demo=true
-- Kanonik jadvallar: marketing_campaigns, marketing_ads, marketing_leads
-- =============================================================================

BEGIN;

-- ─── 1. MARKETING CAMPAIGNS (6 ta) ────────────────────────────────────────────
-- marketing_campaigns.id = varchar(36), NOT NULL, no default → UUID strings
-- Ustunlar: id, name, description, type, status, budget, spent_amount,
--           platform, start_date, end_date, target_audience, goals,
--           created_at, updated_at, created_by, deleted_at

INSERT INTO marketing_campaigns
  (id, name, description, type, status, budget, spent_amount, platform,
   start_date, end_date, target_audience, goals, created_at, updated_at, created_by)
VALUES
  -- Kampaniya 1: Instagram + Facebook (Social Media)
  (
    'demo-camp-001',
    '[DEMO] Yangi Yil Chegirma Kampaniyasi',
    'Yangi yil munosabati bilan 20% chegirma — gofra va ofset mahsulotlar.',
    'social_media',
    'completed',
    15000000, -- 15 mln so'm
    13250000, -- 13.25 mln so'm sarflangan
    'instagram,facebook',
    '2025-12-01 00:00:00',
    '2026-01-10 23:59:59',
    'Korporativ mijozlar, savdo bo''limlari',
    'Yangi mijozlar jalb qilish; mavjud mijozlarni saqlab qolish; 50 ta lid',
    NOW(), NOW(), 1
  ),
  -- Kampaniya 2: Google Ads (Search + Display)
  (
    'demo-camp-002',
    '[DEMO] Google Qidiruv — Gofra Qutilari',
    'Google Search va Display tarmog''ida gofra qutilari uchun kontekstli reklama.',
    'digital',
    'active',
    8500000,
    4200000,
    'google',
    '2026-01-15 00:00:00',
    '2026-03-31 23:59:59',
    'Ishlab chiqarish korxonalari, distribyutorlar',
    'Saytga tashrifchilar +40%; buyurtmalar +25 ta/oy',
    NOW(), NOW(), 1
  ),
  -- Kampaniya 3: Telegram
  (
    'demo-camp-003',
    '[DEMO] Telegram Kanal — Mahsulot Yangiliklari',
    'Telegram kanalida haftalik yangiliklar, aksiyalar va texnologiya yangiliklari.',
    'content',
    'active',
    3000000,
    1800000,
    'telegram',
    '2026-02-01 00:00:00',
    '2026-06-30 23:59:59',
    'Mavjud mijozlar, sanoat mutaxassislari',
    'Obunachillar +200; engagement 15%+; lidlar +10/oy',
    NOW(), NOW(), 1
  ),
  -- Kampaniya 4: Email Marketing
  (
    'demo-camp-004',
    '[DEMO] B2B Email Kampaniya — Ko''rgazma Taklif',
    'Xalqaro ko''rgazmalar va yarmarka haqida B2B email newsletter.',
    'email',
    'active',
    2500000,
    900000,
    'email',
    '2026-03-01 00:00:00',
    '2026-05-31 23:59:59',
    'Import/eksport kompaniyalari, yirik distribyutorlar',
    'Open rate 30%+; 20 ta yangi kontakt; 5 ta meeting',
    NOW(), NOW(), 1
  ),
  -- Kampaniya 5: YouTube Video
  (
    'demo-camp-005',
    '[DEMO] YouTube — Ishlab Chiqarish Jarayoni Video',
    'Fabrika ishlab chiqarish jarayonini ko''rsatuvchi brandli video kontent.',
    'video',
    'draft',
    5000000,
    0,
    'youtube',
    '2026-07-01 00:00:00',
    '2026-09-30 23:59:59',
    'Potentsial investorlar, yirik korporativ mijozlar',
    'Video ko''rishlar 10 ming+; 15 ta so''rov',
    NOW(), NOW(), 1
  ),
  -- Kampaniya 6: Ko'p kanal (Instagram + Telegram + Google)
  (
    'demo-camp-006',
    '[DEMO] Bahor Mega Aksiya — Ko''p Kanal',
    'Bahor mavsumida 4 kanalda bir vaqtda olib boriladigan mega kampaniya.',
    'omnichannel',
    'active',
    25000000,
    11500000,
    'instagram,telegram,google,email',
    '2026-04-01 00:00:00',
    '2026-05-31 23:59:59',
    'Barcha segmentlar: kichik biznes, o''rta biznes, korporativ',
    'Umumiy tushum +30%; 100 ta yangi lid; brand awareness',
    NOW(), NOW(), 1
  )
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  status       = EXCLUDED.status,
  budget       = EXCLUDED.budget,
  spent_amount = EXCLUDED.spent_amount,
  updated_at   = NOW();

-- ─── 2. MARKETING ADS (8 kanal × kampaniya) ──────────────────────────────────
-- marketing_ads.campaign_id = INTEGER (eski sxema)
-- MUHIM: marketing_ads.campaign_id jadvalda integer tur bor, lekin marketing_campaigns.id varchar.
-- Demo maqsadida ads jadvali mustaqil — campaign_id=0 (FK yo'q, constraint yo'q).
-- Platformalar: instagram, facebook, google, telegram, email, youtube, tiktok, website
-- Ustunlar: id, name, campaign_id, platform, type, status, budget, spent_amount,
--           impressions, clicks, conversions, target_url, ad_content,
--           start_date, end_date, created_at, updated_at, deleted_at

-- Avval eski demo adslarni o'chiramiz (idempotent)
DELETE FROM marketing_ads WHERE name LIKE '[DEMO]%';

INSERT INTO marketing_ads
  (id, name, campaign_id, platform, type, status, budget, spent_amount,
   impressions, clicks, conversions, ad_content,
   start_date, end_date, created_at, updated_at)
VALUES
  -- === INSTAGRAM ADS (Kampaniya 1 & 6) ===
  (
    'demo-ad-001',
    '[DEMO] Instagram Stories — Yangi Yil',
    0, -- campaign_id = 0 (FK bo'lmagan demo)
    'instagram', 'stories', 'completed',
    4500000, 4180000,
    285000, 9120, 187,   -- 285K impressions, 9.1K clicks, 187 konversiya
    'Yangi yil chegirmasi! Gofra qutilarga 20% chegirma. Hoziroq buyurtma bering!',
    '2025-12-01', '2026-01-10',
    NOW(), NOW()
  ),
  (
    'demo-ad-002',
    '[DEMO] Instagram Feed — Mega Aksiya',
    0,
    'instagram', 'image', 'active',
    6000000, 2800000,
    198000, 7650, 142,
    'Bahor mega aksiyasi! Korporativ buyurtmalarda 15% chegirma. Muddati: 31 May!',
    '2026-04-01', '2026-05-31',
    NOW(), NOW()
  ),

  -- === FACEBOOK ADS ===
  (
    'demo-ad-003',
    '[DEMO] Facebook Lead Gen — B2B',
    0,
    'facebook', 'lead_gen', 'completed',
    3200000, 3050000,
    145000, 5280, 93,
    'EuroPrint — O''zbekistondagi #1 gofra va ofset yechimi. Demo buyurtma oling!',
    '2025-12-01', '2026-01-10',
    NOW(), NOW()
  ),

  -- === GOOGLE ADS (Search + Display) ===
  (
    'demo-ad-004',
    '[DEMO] Google Search — Gofra Quti',
    0,
    'google', 'search', 'active',
    5000000, 2900000,
    42000, 3150, 78,    -- Search: kam impression, ko'p konversiya
    'Gofra qutilari yetkazib berish | EuroPrint.uz | Hoziroq buyurtma',
    '2026-01-15', '2026-03-31',
    NOW(), NOW()
  ),
  (
    'demo-ad-005',
    '[DEMO] Google Display — Branding',
    0,
    'google', 'display', 'active',
    3500000, 1300000,
    320000, 4800, 45,
    'EuroPrint — Sifatli qadoqlash yechimi',
    '2026-04-01', '2026-05-31',
    NOW(), NOW()
  ),

  -- === TELEGRAM ADS ===
  (
    'demo-ad-006',
    '[DEMO] Telegram Kanal Post',
    0,
    'telegram', 'sponsored_post', 'active',
    1800000, 1800000,
    95000, 2340, 56,
    'EuroPrint Telegram kanal: haftalik yangiliklar, chegirmalar va texnik maslahatlar.',
    '2026-02-01', '2026-06-30',
    NOW(), NOW()
  ),
  (
    'demo-ad-007',
    '[DEMO] Telegram Mega Aksiya',
    0,
    'telegram', 'sponsored_post', 'active',
    2500000, 1200000,
    67000, 1890, 38,
    'Bahor mega aksiya! Telegram orqali buyurtma bering — qo''shimcha 5% chegirma.',
    '2026-04-01', '2026-05-31',
    NOW(), NOW()
  ),

  -- === EMAIL ADS ===
  (
    'demo-ad-008',
    '[DEMO] Email Newsletter — Ko''rgazma',
    0,
    'email', 'newsletter', 'active',
    900000, 900000,
    12500, 1875, 34,    -- Email: kam yuborilgan, lekin yuqori CTR (15%)
    'Xalqaro qadoqlash ko''rgazmasi 2026 — EuroPrint stendida uchrashamiz!',
    '2026-03-01', '2026-05-31',
    NOW(), NOW()
  ),

  -- === YOUTUBE ADS ===
  (
    'demo-ad-009',
    '[DEMO] YouTube Pre-roll — Fabrika Tour',
    0,
    'youtube', 'video', 'draft',
    5000000, 0,
    0, 0, 0,
    'EuroPrint zavodida bir kun — ishlab chiqarish jarayonini ko''ring (draft)',
    '2026-07-01', '2026-09-30',
    NOW(), NOW()
  ),

  -- === TIKTOK ADS ===
  (
    'demo-ad-010',
    '[DEMO] TikTok Viral Video',
    0,
    'tiktok', 'video', 'active',
    3500000, 1800000,
    450000, 18000, 89,  -- TikTok: eng ko'p reach
    'Gofra quti ishlab chiqarish jarayoni — zavod tour #manufacturing #uzbekistan',
    '2026-04-01', '2026-05-31',
    NOW(), NOW()
  ),

  -- === WEBSITE / SEO ===
  (
    'demo-ad-011',
    '[DEMO] SEO Blog Kontent — Gofra',
    0,
    'website', 'seo_content', 'active',
    2000000, 800000,
    28000, 2100, 29,
    'Blog maqolalari: gofra qutilari qanday tanlanadi? Texnik maslahatlar.',
    '2026-02-01', '2026-06-30',
    NOW(), NOW()
  );

-- ─── 3. MARKETING LEADS (namuna lidlar) ──────────────────────────────────────
-- marketing_leads ustunlari: id(serial), name, company, phone, email,
--   source, channel, campaign_id, status, score, notes, crm_lead_id,
--   assigned_to, lost_reason, created_at, updated_at, deleted_at,
--   first_name, last_name, converted_at

DELETE FROM marketing_leads WHERE notes LIKE '%[DEMO]%';

INSERT INTO marketing_leads
  (id, name, company, phone, email, source, channel, status, score, notes,
   assigned_to, created_at, updated_at)
VALUES
  -- Instagram orqali kelgan lidlar
  ('demo-lead-001', 'Alisher Nazarov', 'Tashkent Savdo LLC', '+998901234561', 'alisher@tssavdo.uz',
   'instagram', 'social_media', 'hot', 87,
   '[DEMO] Instagram Stories reklamasi orqali keldi. Gofra quti 500 dona so''radi.',
   1, NOW() - INTERVAL '15 days', NOW()),

  ('demo-lead-002', 'Gulnora Yusupova', 'GreenPack Industries', '+998901234562', 'g.yusupova@greenpack.uz',
   'instagram', 'social_media', 'warm', 64,
   '[DEMO] Instagram Feed post orqali. Ofset bosma 1000 ta buklet.',
   1, NOW() - INTERVAL '12 days', NOW()),

  -- Facebook orqali
  ('demo-lead-003', 'Botir Saidov', 'MediaBox Co', '+998901234563', 'botir@mediabox.uz',
   'facebook', 'social_media', 'converted', 95,
   '[DEMO] Facebook Lead Gen. Buyurtma berildi — gofra quti 2000 dona.',
   1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days'),

  -- Google orqali
  ('demo-lead-004', 'Jasur Toshmatov', 'KinoBox Studio', '+998901234564', 'jasur@kinobox.uz',
   'google', 'search', 'hot', 82,
   '[DEMO] Google Search "gofra quti narxi" so''rovi. Taklif kutmoqda.',
   1, NOW() - INTERVAL '5 days', NOW()),

  ('demo-lead-005', 'Madina Karimova', 'Karimov Trading', '+998901234565', 'm.karimova@ktrade.uz',
   'google', 'search', 'warm', 71,
   '[DEMO] Google Display banner. Katalog so''radi.',
   1, NOW() - INTERVAL '20 days', NOW()),

  -- Telegram orqali
  ('demo-lead-006', 'Sherzod Umarov', 'UniPack Uzb', '+998901234566', 'sherzod@unipack.uz',
   'telegram', 'social_media', 'new', 45,
   '[DEMO] Telegram kanaldan. Yangilikni ko''rdi, narx so''radi.',
   1, NOW() - INTERVAL '3 days', NOW()),

  ('demo-lead-007', 'Nozima Rashidova', 'BrandBox Agency', '+998901234567', 'nozima@brandbox.uz',
   'telegram', 'social_media', 'warm', 68,
   '[DEMO] Telegram mega aksiya posti. 300 dona buklet buyurtma.',
   1, NOW() - INTERVAL '8 days', NOW()),

  -- Email orqali
  ('demo-lead-008', 'Komiljon Xoliqov', 'ExpoTrade Uzbekistan', '+998901234568', 'k.xoliqov@expotrade.uz',
   'email', 'email', 'converted', 91,
   '[DEMO] Ko''rgazma email newsletter. Meeting bo''ldi, shartnoma imzolandi.',
   1, NOW() - INTERVAL '60 days', NOW() - INTERVAL '40 days'),

  ('demo-lead-009', 'Lola Nazarova', 'Premium Pack Co', '+998901234569', 'lola@prempack.uz',
   'email', 'email', 'warm', 73,
   '[DEMO] Newsletter orqali. Texnik savollari bor.',
   1, NOW() - INTERVAL '18 days', NOW()),

  -- TikTok orqali
  ('demo-lead-010', 'Ravshan Mirzayev', 'Young Entrepreneur 2026', '+998901234570', 'ravshan@yentrepreneur.uz',
   'tiktok', 'social_media', 'new', 38,
   '[DEMO] TikTok video viral. Kichik hajm so''radi (100 dona).',
   1, NOW() - INTERVAL '2 days', NOW()),

  ('demo-lead-011', 'Sarvinoz Tursunova', 'Modern Retail UZ', '+998901234571', 'sarvinoz@modernretail.uz',
   'tiktok', 'social_media', 'warm', 59,
   '[DEMO] TikTok video orqali. Retail qadoqlash kerak.',
   1, NOW() - INTERVAL '6 days', NOW()),

  -- Website/SEO orqali
  ('demo-lead-012', 'Dilnoza Hamidova', 'CafeChain Uzbekistan', '+998901234572', 'dilnoza@cafechain.uz',
   'website', 'organic', 'hot', 84,
   '[DEMO] Blog maqola orqali topdi. 5000 dona qog''oz sumka so''radi.',
   1, NOW() - INTERVAL '7 days', NOW()),

  -- Yo'qotilgan lidlar
  ('demo-lead-013', 'Anvar Sotvoldiyev', 'CompetitorPack', '+998901234573', 'anvar@competitorpack.uz',
   'google', 'search', 'lost', 25,
   '[DEMO] Raqobatchiga ketdi. Narx mos kelmadi.',
   1, NOW() - INTERVAL '35 days', NOW() - INTERVAL '25 days'),

  ('demo-lead-014', 'Zulfiya Akbarova', 'MicroBusiness LLC', '+998901234574', 'zulfiya@microbiz.uz',
   'instagram', 'social_media', 'lost', 31,
   '[DEMO] Byudjet yetmadi. Kichik hajm — minimum buyurtma talabiga mos emas.',
   1, NOW() - INTERVAL '50 days', NOW() - INTERVAL '45 days')
ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  score      = EXCLUDED.score,
  updated_at = NOW();

-- Konvertatsiya qilinganlarni belgilaymiz
UPDATE marketing_leads
SET converted_at = updated_at, status = 'converted'
WHERE notes LIKE '%[DEMO]%'
  AND status = 'converted'
  AND converted_at IS NULL;

-- ─── 4. LEADS SCORE NORMALIZATSIYA ───────────────────────────────────────────
-- hot >= 80, warm 50-79, new < 50, lost/converted alohida
UPDATE marketing_leads
SET score = LEAST(100, GREATEST(0, score))
WHERE notes LIKE '%[DEMO]%';

-- ─── 5. MARKETING BUDGET LINES (kanallar bo'yicha) ───────────────────────────
-- Ustunlar: id(serial), year, month, category, planned_amount, actual_amount,
--           description, approved_by, created_at

DELETE FROM marketing_budget_lines WHERE description LIKE '%[DEMO]%';

INSERT INTO marketing_budget_lines
  (id, year, month, category, planned_amount, actual_amount, description, approved_by, created_at)
VALUES
  -- Q1 2026
  ('demo-bgt-001', 2026, 1, 'instagram',  4500000, 4180000, '[DEMO] Yanvar — Instagram kampaniya', 1, NOW()),
  ('demo-bgt-002', 2026, 1, 'facebook',   3200000, 3050000, '[DEMO] Yanvar — Facebook kampaniya',  1, NOW()),
  ('demo-bgt-003', 2026, 2, 'telegram',   1800000, 1800000, '[DEMO] Fevral — Telegram kanal',      1, NOW()),
  ('demo-bgt-004', 2026, 2, 'google',     5000000, 2900000, '[DEMO] Fevral — Google Search/Display', 1, NOW()),
  ('demo-bgt-005', 2026, 3, 'email',       900000,  900000, '[DEMO] Mart — Email newsletter',       1, NOW()),
  -- Q2 2026
  ('demo-bgt-006', 2026, 4, 'instagram',  6000000, 2800000, '[DEMO] Aprel — Mega aksiya Instagram', 1, NOW()),
  ('demo-bgt-007', 2026, 4, 'telegram',   2500000, 1200000, '[DEMO] Aprel — Mega aksiya Telegram',  1, NOW()),
  ('demo-bgt-008', 2026, 4, 'google',     3500000, 1300000, '[DEMO] Aprel — Google Display',        1, NOW()),
  ('demo-bgt-009', 2026, 4, 'tiktok',     3500000, 1800000, '[DEMO] Aprel — TikTok video',          1, NOW()),
  ('demo-bgt-010', 2026, 4, 'website',    2000000,  800000, '[DEMO] Aprel — SEO kontent',           1, NOW()),
  ('demo-bgt-011', 2026, 5, 'email',       900000,      0,  '[DEMO] May — Email (davom)',            1, NOW()),
  -- Q3 2026 (rejalashtirilgan)
  ('demo-bgt-012', 2026, 7, 'youtube',    5000000,      0,  '[DEMO] Iyul — YouTube video (reja)',   1, NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── 6. VERIFIKATSIYA SO'ROVLARI (izohlarga qo'shish uchun) ──────────────────
-- ROI hisoblash view/query uchun namuna:
-- ROI = (Revenue - Cost) / Cost * 100
-- CAC = Total Spend / Conversions
-- Bu yerda revenue marketing orqali kelgan lidlardan taxminiy:
-- avg order = 3,500,000 so'm; conversion count * avg_order = revenue

-- ─── COMMIT ──────────────────────────────────────────────────────────────────
COMMIT;

-- =============================================================================
-- TEKSHIRUV SO'ROVLARI (seed dan keyin ishga tushirish uchun)
-- =============================================================================
/*
-- 1. Kampaniyalar soni
SELECT COUNT(*), status FROM marketing_campaigns
  WHERE id LIKE 'demo-camp-%' GROUP BY status;

-- 2. Kanallar bo'yicha xarajat va ROI
SELECT
  platform,
  SUM(budget)::bigint AS total_budget,
  SUM(spent_amount)::bigint AS total_spent,
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  SUM(conversions) AS total_conversions,
  CASE WHEN SUM(conversions) > 0
    THEN ROUND(SUM(spent_amount) / SUM(conversions) / 1000) || ' K so''m'
    ELSE 'N/A'
  END AS cac_per_conversion,
  CASE WHEN SUM(spent_amount) > 0
    THEN ROUND(
      ((SUM(conversions) * 3500000 - SUM(spent_amount)) / SUM(spent_amount)::numeric) * 100,
      1
    ) || '%'
    ELSE 'N/A'
  END AS roi_pct
FROM marketing_ads
WHERE name LIKE '[DEMO]%' AND deleted_at IS NULL
GROUP BY platform
ORDER BY total_spent DESC;

-- 3. Lidlar holati
SELECT status, COUNT(*), AVG(score)::int as avg_score
FROM marketing_leads WHERE notes LIKE '%[DEMO]%'
GROUP BY status;
*/
