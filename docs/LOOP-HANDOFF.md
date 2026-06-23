# LOOP HANDOFF — relay baton (har 20-daqiqa iteratsiya o'qiydi + yangilaydi)

> ⭐ Egasi 2026-06-23: har 20 daqiqada bitta iteratsiya, to'xtamaydi, vizyon to'liq tugaguncha.
> **HAR ITERATSIYA PROTOKOLI (sifatli + tez):**
> 1. **TEKSHIR** — bu faylni + `500K_QURISH_REJA_PROMPT.md` §6 + git holatni o'qi; oldingi ✅ ishni regress-test (jonli DB-proof hali ushlaydimi); in-flight Workflow bormi (TaskList) — bo'lsa uni qayta ishla, yo'q bo'lsa keyingisini boshla.
> 2. **OL** — "KEYINGI BUILDABLE" navbatdan birinchi ✅-emasni ol (yoki yangi disconnected-real/orphan piece scope qil).
> 3. **SCOPE** — Workflow (fan-out scope + adversarial verify, Q-29). ⚠️ Scope agentlari bu loyihada KO'P yashil-yolg'on berdi (uuid╳int schema-manufacturing.ts o'lik-binding'dan; "no-op/broken/two-worlds") — HAR tip/holat da'vosini O'ZING `node _audit/q.cjs` (information_schema) + kod-Read bilan JONLI tasdiqla.
> 4. **QUR** — Result/Zod/Drizzle. Two-worlds'ni bosh-dasturchi sifatida YECH (kanonik integer; data bo'sh→konvergatsiya, data bor→additiv int-link). **FABRIKATSIYA TAQIQ (Q-40):** real DATA/AI yo'q bo'lsa SOXTA yozma — STRUKTURA qur + pastdagi ro'yxatga yoz.
> 5. **TEST + JONLI SINAB** — `tsc` GREEN (mening fayllarimda 0 yangi xato) + END-TO-END real-data DB-proof (rollback-tx: kirit→oqdi→ko'rindi). Plumbing/struktura-only YETARLI EMAS.
> 6. **BOSHQA MUAMMOLAR** — ish davomida topilgan boshqa muammolarni "BOSHQA TOPILGAN MUAMMOLAR" ga yoz (keyingi agentga baton).
> 7. **COMMIT** — faqat o'z fayllarim, push-siz, `--no-verify`, Co-Authored-By. Bu faylni yangila (✅ belgila + holat). Locked skip: crm/ai/ai-agents/integration/org-structure/auth/finance-reports + sd create-invoice.handler.

---

## HOLAT (oxirgi yangilanish: 2026-06-23)
- ✅ **Golden-thread yadro 4/5:** SD→PP (`59341adf` real fix) · PP→MES (proven) · MES→QC (proven) · QC→WMS (real persistent: warehouse_stock.75/76). Hammasi jonli DB-proof.
- ⛔ **WMS→FIN(invoice):** GATED — 3 invoice-jadval (invoices uuid / sales_invoices text / fi_invoices) integer sales_orders'ga ulanmaydi + create-invoice.handler LOCKED.

## KEYINGI BUILDABLE (navbat — fabrikatsiyasiz, jonli-isbotli; har biri SCOPE+JONLI-VERIFY shart)
1. [ ] SD design→sample sub-flow (SoDesignRequested → design_order yaratish) — ⚠️ oldin event-system two-worlds belgilangan (@EventsHandler class ╳ {eventName:string}); JONLI qayta tekshir, ulanishi mumkinmi.
2. [ ] PP routing-execution: production_order → routing_operations bajarish/holat.
3. [ ] MES sessiya OEE per-session hisob (availability/performance/quality ustunlar bor) — to'liq ulanganmi.
4. [ ] QC rework → To'lqin-2 routing-graf (production_order_operations.rework_*) ulanishi.
5. [ ] WMS FEFO-issue (goods-issue) → warehouse_stock kamayishi + GL.
6. [ ] Director/LMS/Marketing/POS-CC disconnected-real wiring (Wave-8 scan nomzodlari — ko'pi allaqachon qurilgan yoki gated; JONLI tekshir).
> ESLATMA: bu navbatning ko'pi allaqachon ishlashi yoki gated bo'lishi mumkin — har birini JONLI tekshirib, ishlasa ISBOTLA+✅, buzuq bo'lsa TUZAT, gated bo'lsa pastga ko'chir.

## ⛔ EGASI-DATA KUTADI (qurilMAYDI — fabrikatsiya taqiq; egasi bersa STRUKTURA darrov tiriladi)
22-sex ro'yxati · norma/brak qiymatlari · marka take-up/chiqindi/kley · 21-material seed · CKP koeff · manager_id (kim-kimni-boshqaradi) · STKP vazn · razryad imtihon % · head_user_id · smena jadvali · served-rate qoidalari.

## 🟡 AI-KALIT KUTADI
AISHA dispatcher · AI 7-step planning · karta-AI fit-scorer · OEE-AI · Finance-AI · lead-scoring · AI-kamera VLM.

## ⚙️ ARXITEKTURA-QAROR
kanonik invoice-jadval (invoices uuid / sales_invoices text / fi_invoices) · 2-order-dunyo · LOCKED: create-invoice.handler (egasi ochishi kerak).

## BOSHQA TOPILGAN MUAMMOLAR (har iteratsiya bu yerga yozadi → keyingi agent oladi)
- (hozircha bo'sh)
