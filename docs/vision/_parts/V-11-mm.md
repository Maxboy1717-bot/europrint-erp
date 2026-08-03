## [V/VERIFY] MM/Ta'minot (11) — cross-ref hal qilindi

Search roots: `apps/api/src/modules/mm/**`, `apps/api/src/modules/pos/**` (3-way/quarantine), `apps/api/src/cron/**`, `lib/db/src/schema/**`. Faqat asosiy hujjatda "cross-ref kerak" belgilangan qatorlar.

| # | Savol (qisqa) | Oldingi | Hal qilingan status | Dalil (fayl:satr / jadval / grep) |
|---|---|---|---|---|
| 3 | Past reytingli vendorga PO PENDING_DIRECTOR + modal | cross-ref kerak | **Qisman** | Director-HITL infra REAL: `create-purchase-order.handler.ts:57-61` event publish, `po-requires-director-approval.listener.ts:20-23` INSERT hitl_approvals, `hitl-approvals.controller.ts:52-76` approve/reject. LEKIN trigger = **summa > 50M** (`getConfigNumber('po_max_amount_uzs')`), vendor past-reyting emas |
| 4 | "Qora ro'yxat" QC taklif (QC→ta'minot tasdiq) + Kanban | cross-ref kerak | **Yo'q** | grep `blacklist\|qora.ro` MM'da mavjud emas (faqat auth token-blacklist). Vendor blacklist-suggest workflow yo'q |
| 5 | Tender muddati config (default 5 kun), 2 javob | cross-ref kerak | **Yo'q** | grep `tender` MM modulida 0 natija |
| 6 | Sabab kategoriya + BE Zod validatsiya | cross-ref kerak | **Yo'q** | `mm-purchase-orders.controller.ts:200-217` createPo Zod schemasiz plain `@Body` dto; sabab-kategoriya enum maydoni yo'q. grep `reason.categor` 0 |
| 8 | Avans qisman kelishida proporsional zachet | cross-ref kerak | **Yo'q** | MM'da avans/zachet logikasi yo'q; `advance-reminder.cron.ts` = HR stub (`processed=0`, faqat izoh) |
| 9 | MB kursi CBU API real-time + fallback + audit-log | cross-ref kerak | **Qisman** | REAL CBU fetch: `cron/currency-rates.cron.ts:20,45-96` (`cbu.uz/.../json/` → exchange_rates + currencies INSERT), xatolik `CronStatusService.recordFailure` (audit). LEKIN kunlik 09:00 cron (real-time emas); explicit last-known fallback yo'q (skip qiladi) |
| 10 | Muddati o'tgan ariza tasdiq + "+N kun" ogohlantirish | cross-ref kerak | **Yo'q** | `overdue-po.cron.ts:13-24` = STUB (PO-delivery, `processed=0`, DB so'rovsiz); ariza-tasdiq overdue reporti yo'q |
| 12 | QC lab qc_inspections'da, MM'da API yo'q (E6) | cross-ref kerak | **Ha** | Qaror bajarilgan: `qc/presentation/qc-inspections.controller.ts` yagona manba; MM modul fayllar ro'yxatida QC endpoint YO'Q (arxitektura to'g'ri) |
| 13 | Gramaj ±dopusk material kartasida + laborant override | cross-ref kerak | **Yo'q** | Per-material gramaj dopusk + override yo'q. MM'dagi yagona `tolerance` = 3-way-match (`drizzle-mm.repo.ts:263 MM_THREE_WAY_MATCH_TOLERANCE`) — boshqa narsa |
| 14 | Toplanner vs makulator kross-tekshiruv + STOP parallel | cross-ref kerak | **Yo'q** | grep `toplanner\|makulator` 0 natija |
| 15 | Ustuvorlik holat > FIFO sana | cross-ref kerak | **Yo'q** | Status-birinchi-keyin-FIFO chiqim saralash MM/WMS'da topilmadi |
| 16 | Muddati o'tgan lak/kley avto karantin (kunlik cron) + GL zarar | cross-ref kerak | **Qisman** | Karantin infra REAL: `pos/application/services/quarantine-workflow.service.ts`, `wms-quarantine.repository.ts`; expiry `material-life.repository.ts`. LEKIN kunlik expiry→karantin cron YO'Q (`cron/` da faqat stock-alert/cert-expiry); GL zarar yozuvi tasdiqlanmagan |
| 17 | Xavfli kimyo RBAC `warehouse:hazardous:write` + IoT 3-modul event | cross-ref kerak | **Yo'q** | grep `hazardous` faqat `warehouse_bins.bin_type='hazardous'` storage atributi (`wms-schema.ts:168,180`); `warehouse:hazardous:write` permission yo'q; IoT 3-modul event yo'q |
| 18 | Mijoz materiali warehouse_stock owner_type + BOM/tannarx istisno | cross-ref kerak | **Qisman** | `owner_type` ustuni REAL: `wms/material-life.repository.ts:30,74,101,131` (read/update), `i-material-life.repo.ts:7` EP-WMS-123. LEKIN `material_cards` da (warehouse_stock emas); BOM/tannarx istisno tasdiqlanmagan |
| 19 | Klishe/trafaret MM asbob katalog + SD takror auto + 3-yil cron | cross-ref kerak | **Qisman** | `design_tooling` jadval REAL: `schema/pp/pp-design.ts:219-247` (tooling_type: cliche/screen/flexo/plate...). LEKIN PP-Design modulida (MM emas); SD-takror auto-tekshiruv + 3-yil eskirish cron topilmadi |
| 20 | Rekvizit SLA 2 kun + vendor_requisite_history | cross-ref kerak | **Yo'q** | grep `vendor_requisite_history` = 0 (schema/kod); SLA workflow yo'q |
| 21 | Shartnoma qoldig'i kirim kursida + 0 → hard stop | cross-ref kerak | **Yo'q** | MM'da shartnoma-qoldiq hard-stop mexanizmi topilmadi (shartnoma jadvali/blok yo'q) |
| 22 | "Aloqador shaxs" bayrog'i ARIZA + direktor imzo | cross-ref kerak | **Yo'q** | grep `aloqador\|related.person` MM'da 0; requisition dto/schema'da flag yo'q |
| 24 | CRON 23:00 to'lov ogohlantirish + production-calendar + PaymentCompleted yopish | cross-ref kerak | **Yo'q** | 23:00 to'lov cron yo'q; `overdue-po.cron.ts` (09:00) va `advance-reminder.cron.ts` (10:00) STUB va boshqa domen; PaymentCompleted→notif-close yo'q |
| 25 | 100% to'langanda yangi PO yumshoq blok + budget_lines guruh | cross-ref kerak | **Yo'q** | `budget_lines` jadval Finance'da (`schema-finance-budgets.ts`), lekin MM PO-create'da 100%-paid soft-block logikasi yo'q (`create-purchase-order.handler.ts` faqat summa-threshold) |
| 26 | Shoshilinch PO direktor Telegram webhook "ha" + Kanban 2 kun | cross-ref kerak | **Yo'q** | Urgent-PO Telegram webhook-approve + subsequent Kanban task topilmadi |
| 29 | Analog tasdiqlash QC orqali (MM'da endpoint yo'q) + AI taklif | cross-ref kerak | **Qisman** | Substitute/analog atributlari WMS'da: `i-material-life.repo.ts:7` EP-WMS-101 (substitute/analog), `material-life.service.ts`. MM'da endpoint YO'Q (qarorga mos). LEKIN QC-gate analog-tasdiq + AI-taklif oqimi tasdiqlanmagan |
| 32 | Landed cost MIQDOR nisbatida taqsim + GL qabulda | cross-ref kerak | **Yo'q** | grep `landed.cost` MM'da 0 natija |
| 33 | Sverka akti on-demand + oy oxiri cron digest (gl_entries PDF) | cross-ref kerak | **Yo'q** | Vendor sverka akti/reconciliation on-demand + oy-oxiri cron topilmadi |
| 34 | Vendor muloqot jurnali vendor_communications | cross-ref kerak | **Yo'q** | grep `vendor_communications` = 0 (schema/kod) |
| 35 | Narx muzokara izi immutable (F5) + AI tavsiya | cross-ref kerak | **Yo'q** | grep `negotiat\|muzokara` MM'da 0; immutable muzokara log yo'q |
| 36 | Makulatura vtorsyryo WMS INTERNAL_TRANSFER + alohida daromad CoA | cross-ref kerak | **Qisman** | `INTERNAL_TRANSFER` movement-type REAL: `seed-pos-movement-types.ts:29`, `pos-schema-v2.ts:710`. LEKIN makulatura-vtorsyryo ombori + alohida daromad-hisob ulanmagan; `seed-gl-account-mappings-pos.sql:5` — INTERNAL_TRANSFER GL-postingdan **ataylab chiqarilgan** |
| 37 | Rohler/poddon equipment_assets + GL zarar | cross-ref kerak | **Yo'q** | grep `equipment_assets` = 0 (schema/kod) |
| 38 | "Qimmat partiya" >50mln/import → komissiya SLA 4soat | cross-ref kerak | **Yo'q** | Ketma-ket 3-imzo komissiya workflow + 4-soat SLA topilmadi; >50M = direktor HITL (summa), qabul-komissiyasi emas |
| 39 | Vendor artikul→bir necha material "noaniqlik" + unique index | cross-ref kerak | **Yo'q** | grep `vendor_article` = 0; vendor-artikul→material kross-xarita jadvali yo'q |
| 40 | Yoqilg'i talon per-mashina + +10% cron + >20% direktor | cross-ref kerak | **Qisman** | Fleet/fuel CRUD REAL: `mm-dashboard.controller.ts:109-147` (fleet/vehicles + fleet/fuel-logs GET/POST), `mm-dashboard.service.ts:35-49`. LEKIN +10%/>20% pog'onali escalation cron topilmadi |
| 41 | Boj/broker service-type PO, faqat direktor, 3-way yo'q | cross-ref kerak | **Yo'q** | grep `service.type` PO turi MM'da 0; service-PO ajratilgan oqim yo'q |
| 42 | AI prognoz WMS chiqim tarixidan + 1-tugma qabul + override | cross-ref kerak | **Yo'q** | WMS-sarf-tarixidan AI forecast + 1-tugma auto-ariza + override oqimi topilmadi (agents/ mavjud, lekin bu oqim tasdiqlanmagan) |
| 43 | Yangi vendor "Faol"ga 3 ketma-ket sinov partiya + config summa | cross-ref kerak | **Yo'q** | grep `trial\|sinov.partiya` MM'da 0; vendor 3-sinov-partiya qoidasi yo'q |
| 44 | Rulon qoldiqlari PP push + soft-lock 24soat bron | cross-ref kerak | **Yo'q** | grep `soft.lock\|rulon.*bron` = 0; DB-lock bron mexanizmi yo'q |
| 45 | 10+ shartnoma DIGEST + avto "To'xtatilgan" | cross-ref kerak | **Yo'q** | Shartnoma digest + avto-holat o'zgarish topilmadi |
| 46 | "Narx tejovi" KPI = byudjet vs fakt narx | cross-ref kerak | **Yo'q** | `getSupplierPerformance`/`getPriceHistory` (`mm-dashboard.service.ts:51-57`) mavjud, lekin byudjet-vs-fakt "narx tejovi" KPI formulasi yo'q |
| 49 | Material guruh byudjet Finance budget_lines'da, karta bo'yicha | cross-ref kerak | **Qisman** | `budget_lines` jadval REAL: `schema-finance-budgets.ts`, `finance/budgets/drizzle-finance-budgets.repo.ts`. LEKIN ta'minot-karta biriktirish (per-karta) tasdiqlanmagan; MM↔budget_lines ulanish yo'q |

**Xulosa:** 38 cross-ref qatordan: 1 Ha, 9 Qisman, 28 Yo'q, 0 data-check.
- Qisman (9): 3, 9, 16, 18, 19, 29, 36, 40, 49 — infra/jadval mavjud, lekin vizyon-spetsifik oqim/trigger/joylashuv to'liq emas.
- Ha (1): 12 — qaror arxitekturada bajarilgan (MM'da QC endpoint yo'q, qc_inspections QC-modulida kanonik).
