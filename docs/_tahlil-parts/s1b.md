# SECTION 1B — MODUL STATUS (Texnologiya · MES · Ombor/WMS · POS · Moliya)

> Tahlilchi: jonli kod + DB tasdig'i (verify-don't-trust). Har da'vo fayl:satr yoki DB natija bilan.
> DB holati: `europrint` jadvallari MAVJUD lekin BO'SH (0 qator) — bu "qurilish bosqichi" (memory: `reference_live_db_location.md`), stub emas.
> Tasnif: REAL = service/repo + real DB o'qish/yozish · 501-stub = `notImplemented()` · yashil-yolgon = 200 lekin DB ga yozmaydi (echo/hardcoded) · dublikat.

---

### Texnologiya (pp/technology)
- Jami route: 13 · REAL: 11 · 501-stub: 2 · yashil-yolgon: 0 · dublikat: 0
- Jadval:

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| GET /technology/dashboard | REAL | technology.controller.ts:39 → svc.getDashboard() |
| GET /technology/orders | REAL | technology.controller.ts:46 → svc.getOrders() |
| GET /technology/orders/:id/approval-log | REAL | technology.controller.ts:53 → svc.getApprovalLog() |
| GET /technology/orders/:id/tech-card | REAL | technology.controller.ts:60 → svc.getOrderTechCard() |
| GET /technology/tech-cards | REAL | technology.controller.ts:67 → svc.getTechCards() |
| GET /technology/materials/alternatives | REAL | technology.controller.ts:74 |
| POST /technology/orders/:id/ai-check | REAL | technology.controller.ts:81 → svc.runAiCheck() |
| POST /technology/orders/:id/approve | REAL | technology.controller.ts:88 → svc.approveOrder() |
| POST /technology/orders/:id/reject | REAL | technology.controller.ts:97 → svc.rejectOrder() |
| GET /technology/cards | REAL | technology.controller.ts:107 → svc.getCards() |
| GET /technology/cards/:id | REAL | technology.controller.ts:120 → svc.getCardById() (404 tekshiruv) |
| **POST /technology/cards/generate** | **501-stub** | technology.controller.ts:114 `notImplemented(...)` |
| **POST /technology/cards/:id/optimize** | **501-stub** | technology.controller.ts:130 `notImplemented(...)` |

- DB: `tech_cards`=bor/0 · `technology_cards`=bor/0 · `ow_tech_cards`=bor/0 (Phase-4 fan-out manba) · `papka_orders`/`mes_papka_orders`=bor/0
- Holat: Texnologiya yadrosi (papka tasdiqlash 3-checkpoint, AI-check, tech-card o'qish) REAL servisga ulangan. Faqat 2 ta "karta generatsiya/optimallashtirish" funksiyasi hali yozilmagan (halol 501).

---

### MES (mes + pp/production)
- Jami route: 46 · REAL: 46 · 501-stub: 0 · yashil-yolgon: 0 · dublikat: 0
- Jadval (controller bo'yicha):

| Controller / muhim route | Holat | Dalil (fayl:satr) |
|---|---|---|
| mes-operations (8): sessions/downtime/oee | REAL | mes-operations.controller.ts:67,77,96 CommandBus/QueryBus |
| GET /mes/operations/oee | REAL | get-oee.handler.ts:32 `db.select().from(mes_sessions)` (haqiqiy DB hisob, hardcode emas) |
| GET /mes/operations/reason-codes | REAL (statik) | mes-operations.controller.ts:130 — domen konstanta (DOWNTIME_REASON_CODES) |
| mes-shifts-stats (16) | REAL | 19 ta delegatsiya (Bus.execute/unwrap/svc) |
| mes-maintenance (11) | REAL | 18 ta delegatsiya |
| mes-sessions (6) | REAL | CQRS handlerlarga ulangan |
| mes-production-sessions (5) | REAL | CQRS |

- DB: `mes_sessions`=bor/0 · `production_sessions`=bor/0 · `downtime_events`=bor/0 · `mes_operations`=bor/0 · `mes_telemetry`=bor/0 (cron-writer hali yo'q, memory: `api_healthcheck_and_mes_telemetry`)
- Holat: MES to'liq CQRS bilan REAL — sessiya, downtime, OEE, smena statistikasi, texnik xizmat hammasi handlerga ulangan, soxta javob topilmadi. Jadvallar bo'sh, ma'lumot kiritilsa hisob ishlaydi.

---

### Ombor / WMS (wms)
- Jami route: 154 · REAL: ~147 · 501-stub: 6 · yashil-yolgon: 1 · dublikat: 0
- Jadval (muhim/muammoli):

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| wms-stock (6): list/get/fefo/reserve/patch/delete | REAL | wms-stock.controller.ts:56,69,84,105,118,131 CQRS+crudSvc |
| wms-catalog (13): ABC/aging/expiry/turnover | REAL | wms-catalog.controller.ts — 10 ta svc delegatsiya |
| wms-warehouse-gateway (12) / wms-extended (12) | REAL | delegatsiya |
| **GET /warehouse/integration/mm/pending-deliveries** | **501-stub** | wms-integration.controller.ts:85 `notImplemented` (#FX-3) |
| **GET /warehouse/integration/mm/reorder-suggestions** | **501-stub** | wms-integration.controller.ts:92 |
| **GET /warehouse/integration/fi/stock-valuation** | **501-stub** | wms-integration.controller.ts:99 |
| **GET /warehouse/integration/summary** | **501-stub** | wms-integration.controller.ts:106 |
| **GET /warehouse/integration** | **501-stub** | wms-integration.controller.ts:113 |
| **POST /warehouse/integration** | **501-stub** | wms-integration.controller.ts:121 |
| **POST /warehouse/warehouses/:id/sync-pos** | **yashil-yolgon** | wms-integration.controller.ts:73,76 — xatolikda ham `{ ok:true, warning:'sync queued, no event log' }` (logPosSyncEvent chaqiradi, fail bo'lsa yashiradi) |

- DB: `warehouse_stock`=bor/0 (kanonik) · `current_stock`=VIEW(warehouse_stock ustidan) · `stocks`=bor/0 · `warehouses`=bor/0 · `warehouse_transactions`=bor/0 · `inventory_counts`=bor/0 · `wms_bins`=YO'Q (jadval yo'q)
- Eslatma: `POST /api/wms/stock` (createStock) 2026-06-05 da yashil-yolgon bo'lib OLIB TASHLANGAN (wms-stock.controller.ts:46-49 izoh) — stock endi faqat goods-receipt/sync orqali yoziladi (to'g'ri tuzatish).
- Holat: WMS yadrosi (stock CRUD, FEFO, reservatsiya, harakat, katalog ABC) REAL. Faqat MM/FI tashqi integratsiya klasteri (6 route) halol 501 (#FX-3), va sync-pos endpoint xatolikni yashiradigan optimistik javob beradi.

---

### POS (pos) — zavod ombori tablet ilovasi
- Jami route: 168 · REAL: ~165 · 501-stub: 0 · yashil-yolgon: 2 · dublikat: 0
- Jadval (muhim/muammoli):

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| pos/movements (9): create/status/qc/damage/pdf/history | REAL | movements.controller.ts:67-160 — to'liq harakat tizimi (PosMovementService+ledger+audit) |
| pos.controller (19) | REAL | 9 service delegatsiya, echo topilmadi |
| warehouse-features (21) | REAL | 22 delegatsiya |
| cash-register (8) | REAL | 10 delegatsiya → retail_pos_transactions |
| stock / requests / procurement / reports | REAL | svc delegatsiya |
| POST /pos/sales (legacy) | REAL | pos-stub.controller.ts:103 — CashRegisterService.createTransaction ga delegate (haqiqiy persistence; oldin echo edi, tuzatilgan) |
| GET /pos/sales/daily, inventory/low-stock, movements | REAL | pos-stub.controller.ts:116,122,134 → stockLedgerService (pos_stock_ledger) |
| **PATCH /pos/inventory/:productId/adjust** | **yashil-yolgon** | pos-stub.controller.ts:148-150 — `return { productId, adjusted:true, ...dto }` (LEGACY_NOOP echo, DB ga yozmaydi; izoh tan oladi) |
| **GET /pos/barcode/ai-suggestion/pending** | **yashil-yolgon** | barcode.controller.ts:111 — `return { message: 'GET /pos/barcode/ai-suggestion/pending' }` (DB so'rov yo'q, echo) |

- DB: `retail_pos_transactions`=bor (kanonik POS yozuvi) · `pos_stock_ledger`=bor · `pos_transactions`=bor/0
- Holat: POS Monitor (kirim/chiqim/harakat/QC/damage/kassa) REAL va ledger+audit bilan to'liq. Faqat 2 ta legacy endpoint echo qaytaradi (inventory adjust noop + barcode pending suggestion) — ikkalasi ham izohда "legacy/TODO" deb belgilangan.

---

### Moliya (finance)
- Jami route: 176 · REAL: ~172 · 501-stub: 2 (+1 ataylab) · yashil-yolgon: 2 · dublikat: 0
- Jadval (muhim/muammoli):

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| finance-gl (5): entries/post-sales-invoice/post-payroll/trial-balance/ledger | REAL | finance-gl.controller.ts:52,65,80,91,107 → GlPostingService+GlService |
| finance-invoices (5): list/create/post/get | REAL | finance-invoices.controller.ts:76,103,131 → FinanceInvoiceRepo.saveInvoice/updateInvoice (real INSERT/UPDATE) |
| finance-ar (4): aging/overdue/recalc/entries | REAL | finance-ar.controller.ts:39,60,68,78 → FinanceArService |
| finance-ap (4) | REAL | FinanceApService delegatsiya |
| finance-accounting (9): dashboard/accounts/gl-docs/periods/close | REAL | finance-accounting.controller.ts:50-152 → FinanceAccountingService |
| finance-payments: list/record/approve | REAL | finance-payments.controller.ts:63,110,149 → RecordPaymentHandler+actionsSvc |
| finance-extended-income (17) / extended-payroll (9) / extended (6) | REAL | FinanceExtendedService delegatsiya |
| financial-reports POST alerts/send-report | REAL | financial-reports.controller.ts:156 — dailyCron.dailyReport() ni ishga tushiradi |
| **GET /finance/reports** | **501-stub** | finance-main.controller.ts:106 `notImplemented` (#FX-4) |
| **GET /finance/loans** | **501-stub** | finance-main.controller.ts:152 `notImplemented` (#FX-4) |
| **POST /finance/payments/:paymentId/verify** | **yashil-yolgon** | finance-payments.controller.ts:125 — `return { message:'Payment verified', paymentId }` (DB yozmaydi, hardcoded) |
| **GET /finance/payments/:invoiceId/outstanding** | **yashil-yolgon** | finance-payments.controller.ts:136 — `return { data:{ invoiceId, outstanding:0 } }` (har doim 0, hisob yo'q) |
| POST /finance/payments (root) | 501 (ataylab) | finance-payments.controller.ts:78 — NotImplementedException, /record ga yo'naltiradi (orphan to'lov oldini olish) |

- DB: `gl_entries`=bor/0 (kanonik) · `entries`=bor/0 · `gl_journal_entries`+`gl_lines`=bor/0 (faol yozuvchilar, SAP#76 ga ko'chadi — memory) · `finance_invoices`=bor/0 · `sd_invoices`=bor · `accounts`=bor/0 · `cash_registers`/`bank_accounts`=bor/0 · `budgets`=bor/0 · `payments`=bor/0 · `ap_invoices`/`ar_invoices`=YO'Q (jadval yo'q)
- Holat: Moliya yadrosi (GL provodka, invoice CRUD, AR/AP aging, to'lov yozish, davr yopish, hisobot) REAL repo/servisga ulangan. Faqat 2 halol 501 (reports/loans #FX-4) va 2 ta to'lov endpoint (verify + outstanding) hardcoded javob beradi (haqiqiy hisob yo'q). Eslatma: `INV-${Date.now()}` raqami ko'rsatish uchun — invoice o'zi repo orqali real saqlanadi.

---

## YIG'INDI (modullarim bo'yicha)

| Modul | Jami route | REAL | 501-stub | yashil-yolgon | dublikat |
|---|---|---|---|---|---|
| Texnologiya (pp/technology) | 13 | 11 | 2 | 0 | 0 |
| MES (mes + pp/production) | 46 | 46 | 0 | 0 | 0 |
| Ombor/WMS (wms) | 154 | ~147 | 6 | 1 | 0 |
| POS (pos) | 168 | ~165 | 0 | 2 | 0 |
| Moliya (finance) | 176 | ~172 | 2 (+1 ataylab) | 2 | 0 |
| **JAMI** | **557** | **~541 (~97%)** | **10 (+1)** | **5** | **0** |

**Asosiy xulosa:** Backend route'larining ~97% REAL (service/repo + DB delegatsiya). Soxta javob juda kam: 5 ta yashil-yolgon (pos adjust noop, pos barcode pending, wms sync-pos optimistik, finance verify/outstanding hardcoded) + 10 ta halol 501 (texnologiya karta-gen ×2, wms MM/FI integratsiya ×6, finance reports/loans ×2). DB BO'SHLIGI = qurilish bosqichi, stub belgisi EMAS. Eski katalogning "501-stub" da'volari (pp-routing, production-reports, finance-extended-payroll) SOXTA-POZITIV — ular faqat `notImplemented` ni import qiladi, chaqirmaydi (dead import).
