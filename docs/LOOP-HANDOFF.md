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
1. [🔍 TAHLIL QILINDI — keyingi: app-run bilan jonli-isbotli build] SD design→sample sub-flow. JONLI tasdiqlangan 3-nuqtali uzilish: (a) `design/.../so-design-requested.listener.ts:22` handle()=faqat log (green-lie stub, repo inject YO'Q, constructor bo'sh); (b) `SoDesignRequestedEvent` klassi hech qayerda `new ...` bilan publish qilinmaydi; (c) `create-order.handler.ts:136-148` plain-object `{eventName:'DesignRequired'}` (string) yuboradi — @EventsHandler(class)ga MOS EMAS; (d) outbox `'sd.order.design_requested'` chiqaradi-yu `@OnEvent` listener yo'q. **XAVFSIZ FIX-SPEC** (faqat design-listener fayli, create-order.handler'ga TEGMA — u SD→PP uchun ishlaydi): listener'ni `@OnEvent('sd.order.design_requested')` ga o'tkaz + `DrizzleDesignOrdersSvcRepository` inject + payload `{orderId,at}` dan `salesOrderId` olib `design_orders` INSERT (drizzle-design-orders-svc.repo.create). ⚠️ AVVAL outbox-publisher o'sha string'ni EventEmitter2 bilan emit qilishini Read bilan tasdiqla. ISBOT: tsc + DB-proof(INSERT) + kod-trace; JONLI firing = app-run kerak. ✅ TASDIQ: repo token `DESIGN_ORDERS_SVC_REPO` (design.module.ts:34, `./orders/drizzle-design-orders-svc.repo`) inject uchun mavjud. ⚠️ Keyingi agent: (1) @OnEvent uchun design.module'ga EventEmitterModule importligini tekshir (hozir faqat CqrsModule); yo'q bo'lsa EITHER import qo'sh EITHER create-order.handler'da `eventBus.publish(new SoDesignRequestedEvent(orderId,productId,customerId))` klass yuborib CQRS @EventsHandler'da qoldir (lekin create-order.handler'ga ehtiyot — SD→PP ishlaydi). (2) outbox-publisher (domain_events→EventEmitter2) joyini top + 'sd.order.design_requested' emit qilishini tasdiqla.
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
- **[iter-1] EVENT-ARXITEKTURA NOIZCHILLIGI (umumiy):** 3 xil event-mexanizm aralash — (1) CQRS `eventBus.publish(new XEvent())` klass, (2) `eventBus.publish({eventName:'string'})` plain-object, (3) outbox `domain_events` → EventEmitter2 `@OnEvent('string')`. Ba'zi publisher'lar plain-object string yuboradi-yu listener `@EventsHandler(class)` kutadi → JIM tushadi (SD design/sample shu holat). `EventBridgeService.EVENT_NAME_MAP` ba'zi nomlarни (DesignRequired/SampleRequired) map qilmaydi. **Keyingi agent:** har golden-thread sub-link event-wiring'ini publisher+listener ikkala tomonni Read qilib tekshirsin; outbox-string + `@OnEvent` yo'li eng ishonchli (durable).
- **[iter-1] JONLI-ISBOT cheklovi:** event-driven link'lar (design/sample/rework/OEE) rollback-tx bilan UCHMA-UCH isbotlab bo'lmaydi — event-bus + outbox-tik kerak. To'liq jonli-isbot uchun BACKEND ishlab turishi + real buyurtma API orqali yaratilishi kerak (auth bilan). DB-proof faqat INSERT-mantig'ini isbotlaydi, event-firing'ni emas. **Egasi/keyingi:** app-run + test-login bo'lsa, bu link'lar HTTP orqali to'liq jonli sinaladi.
