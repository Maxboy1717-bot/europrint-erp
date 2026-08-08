-- APPROVED: egasi 'Savdo-sity referens-o'rganish — idempotency-key (H-8-uslub)' 2026-07-01
-- POS movements idempotency-key — additive faqat (Q-46). Double-tap/retry bir xil harakatni
-- ikki marta yaratmasligi uchun (Savdo-sity POS.tsx "audit H-8" naqshi, SD sd_advance_idempotency_keys
-- naqshiga o'xshash — bu yerda alohida jadval o'rniga to'g'ridan-to'g'ri ustun, chunki bitta
-- idempotency-key = bitta harakat-yaratish urinishi, ko'p-marta chaqiriladigan order-scoped emas).

ALTER TABLE pos_movements ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_movements_idempotency_key
  ON pos_movements (idempotency_key) WHERE idempotency_key IS NOT NULL;
