-- APPROVED: Master-reja 3.5 "Invoys 3-tur: ... eksport-invoys (Incoterms)"
-- (docs/audit/MASTER-REJA-VIZYON-2026-07-02.md:258) + EP-SD-070 "Yetkazib berish sharti
-- (Incoterms soddalashtirilgan)" HOLAT: JAVOBLANGAN (docs/audit/decisions/06-sd.md:503-507)
-- — "variant tanlanadi (samovyvoz / zavod yetkazadi), yetkazsa transport alohida qator".
--
-- Additive faqat (Q-35/Q-46): `invoices` jadvaliga 3 ta ixtiyoriy ustun. Hech biri
-- default/majburiy qiymat bilan FABRIKATSIYA qilinmagan — hammasi NULL-lanadigan,
-- yozilmasa eksport-invoys blok shunchaki "—" ko'rsatadi (Q-40 fail-safe gate, xuddi
-- `wms_in_transit_shipments.incoterm` optional pattern bilan bir xil).
--
-- delivery_term — EP-SD-070 javobiga mos ochiq matn (masalan "Samovyvoz" / "Zavod
--   yetkazadi"); to'liq Incoterms-2020 11-kodli ro'yxat (EXW/FOB/CIF/...) uchun aniq
--   qaror OCHIQ emas — shuning uchun erkin matn ustun, gate qilinmaydi (majburlanmaydi).
-- incoterm_code — agar xodim aniq Incoterms kodini bilsa (masalan eksport shartnomada
--   ko'rsatilgan), ixtiyoriy qisqa kod maydoni; bo'sh bo'lsa PDF'da ko'rsatilmaydi.
-- currency — hisob-faktura valyutasi (EP-SD-071 "dollarda, to'lov kuni kursi bo'yicha
--   so'mda" — allaqachon javoblangan); mavjud bo'lmasa UZS deb ko'rsatiladi (joriy holat
--   bilan bir xil, regressiya yo'q).

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_term VARCHAR(120);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS incoterm_code VARCHAR(16);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(10);
