-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- §2 taksonomiya SEED (2-tur): aloqa/yo'nalish/operatsiya turlari (egasi 2026-07-11 tasdiqladi/starter).
INSERT INTO taxonomy_entries (category, code, name_uz, sort_order)
SELECT * FROM (VALUES
  ('contact_type', 'buyruq', 'Buyruq', 1),
  ('contact_type', 'malumot_talabi', 'Ma''lumot talabi', 2),
  ('contact_type', 'bildirishnoma', 'Bildirishnoma', 3),
  ('contact_type', 'sorov', 'So''rov', 4),
  ('contact_type', 'hisobot', 'Hisobot', 5),
  ('direction_type', 'ofs_karton', 'Ofs-karton', 1),
  ('direction_type', 'ofs_gofra', 'Ofs-gofra', 2),
  ('direction_type', 'flekso_gofra', 'Flekso-gofra', 3),
  ('direction_type', 'flekso_karton', 'Flekso-karton', 4),
  ('operation_type', 'lak', 'Lak', 1),
  ('operation_type', 'kley', 'Kley', 2),
  ('operation_type', 'rezka', 'Rezka', 3),
  ('operation_type', 'bosma', 'Bosma', 4),
  ('operation_type', 'kashirovka', 'Kashirovka', 5),
  ('operation_type', 'vysechka', 'Vysechka', 6)
) AS v(category, code, name_uz, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM taxonomy_entries t WHERE t.category=v.category AND t.code=v.code);
