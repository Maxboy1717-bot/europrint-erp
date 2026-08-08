-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #142 (TASDIQ-2146 §06 #92) — Kashirovka (ofset+gofra) alohida operatsiya + narx.
--   Kashirovka = ofset bosma varaqni gofra qatlamga yelimlab birlashtirish alohida
--   pardozlash operatsiyasi. Har taklif qatorida "kerakmi" bayrog'i (PP marshrut markeri)
--   + operatsiya narxi CRUD orqali (sd_price_formulas singleton id=1).
--
-- 1) sd_quotation_items.kashirovka — per-order bayroq / marshrut markeri (mavjud is_new_die
--    uslubida). NOT NULL DEFAULT false — mavjud qatorlar o'zgarmaydi (regressiya yo'q).
-- 2) sd_price_formulas.kashirovka_price — operatsiya narxi (lamination_price/embossing_price
--    yonida). NOT NULL DEFAULT 0 — egasi narxni keyin price-settings CRUD orqali kiritadi;
--    0 bo'lsa calculatePrice ga hech narsa qo'shmaydi (regressiya yo'q).
-- Kanonik jadvallar (STANDARTLAR §15); dup fork YO'Q. Faqat additive; destructive amal yo'q.

ALTER TABLE sd_quotation_items ADD COLUMN IF NOT EXISTS kashirovka boolean NOT NULL DEFAULT false;
ALTER TABLE sd_price_formulas  ADD COLUMN IF NOT EXISTS kashirovka_price numeric NOT NULL DEFAULT 0;
