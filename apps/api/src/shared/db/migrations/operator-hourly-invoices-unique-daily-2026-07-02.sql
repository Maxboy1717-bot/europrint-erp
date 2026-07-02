-- APPROVED: egasi 2026-07-02 "hamma muammolarni to'g'irlash — vizyon bo'yicha"
-- G5/A4 verify-fix (adversarial tekshiruv isboti): 2026-07-02 19:00 Toshkentda cron 7 parallel
-- dev-jarayondan (Q-44 Windows nest-watch zombie) bir vaqtda otildi — kod ichidagi
-- read-then-insert idempotency tekshiruvi jarayonlararo poygada yutqazdi: 10 xodimga
-- 7x dublikat invoice (70 qator, hammasi created_at 14:00:00.452-773 UTC oynasida) va
-- 7x dublikat notification yozildi.
-- (1) Dublikat invoice tozalash — har (employee_id, period_start) uchun eng birinchi (MIN id) qoladi;
-- (2) o'chirilgan dublikat invoice'larga reference qilgan notificationlar tozalanadi;
-- (3) UNIQUE indeks — poyga DB darajasida yopiladi (kod: INSERT ... ON CONFLICT DO NOTHING).
-- Additive INDEX + bug-artefakt tozalash — Q-35 doirasida. Idempotent (qayta ishga tushirish xavfsiz).

DELETE FROM notifications n
 WHERE n.type = 'employee_daily_invoice'
   AND n.reference_type = 'operator_hourly_invoice'
   AND n.reference_id IN (
     SELECT o.id FROM operator_hourly_invoices o
      WHERE o.id NOT IN (
        SELECT MIN(id) FROM operator_hourly_invoices GROUP BY employee_id, period_start
      )
   );

DELETE FROM operator_hourly_invoices o
 WHERE o.id NOT IN (
   SELECT MIN(id) FROM operator_hourly_invoices GROUP BY employee_id, period_start
 );

CREATE UNIQUE INDEX IF NOT EXISTS operator_hourly_invoices_employee_period_uniq
  ON operator_hourly_invoices (employee_id, period_start);
