-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- 04-coordination — clean-additive schema items with an already-decided (A-default
-- or ✅ JAVOBLANGAN) shape, per docs/audit/decisions/04-coordination.md. Additive
-- only (nullable / defaulted); no existing column renamed or removed (Q-46).
-- ============================================================================

-- EP-COR-019 (build-queue #57): приказ kategoriyalar (HR/Moliya/Operatsion/Strategik/Umumiy).
-- EP-COR-021 (build-queue, also #60): kuchga kirish sanasi — chiqarilgan sanadan farqli bo'lishi mumkin.
ALTER TABLE prikaz
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS effective_date DATE;
COMMENT ON COLUMN prikaz.category IS '04-cc EP-COR-019: HR | Moliya | Operatsion | Strategik | Umumiy (kengaytiriladi).';
COMMENT ON COLUMN prikaz.effective_date IS '04-cc EP-COR-021: kuchga kirish sanasi (signed_at''dan farqli bo''lishi mumkin).';

-- EP-COR-043: доклад turlari (rejali/sorovga_javob/muammo). EP-COR-044: SLA muddat
-- (standart 3 ish kuni, shoshilinch 1 ish kuni — cron kelgusi bosqichda yoziladi, bu
-- faqat qiymatni saqlaydigan ustun). EP-COR-046: 6 majburiy maydondan yo'q bo'lgan 2 tasi
-- (Davr, Ilova) — mavjud subject/problem/result/proposal RENAME qilinmaydi (Q-46).
ALTER TABLE dokla
  ADD COLUMN IF NOT EXISTS doc_type TEXT,
  ADD COLUMN IF NOT EXISTS sla_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;
COMMENT ON COLUMN dokla.doc_type IS '04-cc EP-COR-043: rejali | sorovga_javob | muammo.';
COMMENT ON COLUMN dokla.sla_deadline_at IS '04-cc EP-COR-044: standart +3 ish kuni, shoshilinch +1 ish kuni (hisoblovchi kod kelgusi bosqich).';
COMMENT ON COLUMN dokla.period IS '04-cc EP-COR-046 "Davr" — hisobot davri (masalan 2026-06 yoki 2026-Q2).';
COMMENT ON COLUMN dokla.attachment_url IS '04-cc EP-COR-046 "Ilova" — biriktirilgan fayl/havola.';

-- EP-COR-067/097 (build-queue ##67): доклад/распоряжение ↔ Buyurtma/Papka yagona kalit
-- (design_orders.papka_order_id bilan bir xil naqsh — integer, nullable).
ALTER TABLE dokla
  ADD COLUMN IF NOT EXISTS papka_order_id INTEGER;
ALTER TABLE rasporyazhenie
  ADD COLUMN IF NOT EXISTS papka_order_id INTEGER;
COMMENT ON COLUMN dokla.papka_order_id IS '04-cc EP-COR-067/097: Buyurtma/Papka yagona kalit bog''lami.';
COMMENT ON COLUMN rasporyazhenie.papka_order_id IS '04-cc EP-COR-067/097: Buyurtma/Papka yagona kalit bog''lami.';

-- EP-COR-036 (build-queue ##56): manfaatlar to'qnashuvi (COI) — a'zo o'z manfaatdor
-- masalasida ovoz berish/kvorumga kiritilmasligi kerak bo'lgan holatni belgilaydi.
ALTER TABLE council_members
  ADD COLUMN IF NOT EXISTS conflict_of_interest BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN council_members.conflict_of_interest IS '04-cc EP-COR-036: true bo''lsa shu a''zo manfaatdor masalada ovoz/kvorumdan chetlashtiriladi.';
