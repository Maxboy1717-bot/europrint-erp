-- APPROVED: egasi "hamma vizyon" 2026-06-26
-- T20-A1-PAYROLL-RAZRYAD-LMS — Gap #1 (PAYROLL generatePeriodRows upsert kaliti)
--
-- MAQSAD: payroll_rows ga (period_id, employee_id) bo'yicha UNIQUE indeks qo'shiladi.
--   generatePeriodRows har xodim uchun bitta qator yozadi va qayta-generatsiyada
--   (idempotent) ON CONFLICT (period_id, employee_id) DO UPDATE bilan yangilaydi —
--   bu indeks ON CONFLICT spetsifikatsiyasi uchun KERAK (aks holda 42P10 xato).
--
-- XAVFSIZLIK (Q-46/Q-39): ADDITIV + idempotent. Mavjud data BUZILMAYDI
--   (jadval bo'sh + dublikat yo'q — jonli tekshirildi 2026-06-26). DROP/o'chirish YO'Q.
--   CREATE UNIQUE INDEX IF NOT EXISTS — qayta-apply xavfsiz.

CREATE UNIQUE INDEX IF NOT EXISTS uq_payroll_rows_period_employee
  ON public.payroll_rows (period_id, employee_id);
