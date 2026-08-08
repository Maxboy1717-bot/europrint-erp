## [V/VERIFY] CRM (13) — cross-ref hal qilindi

Manba jadval: `docs/vision/FULL-VISION-EXTRACTION-2026-07-07.md` satr 963-1037.
Faqat "cross-ref kerak" bo'lgan 33 qator (5,7,9,11,12,15,16,17,19,20,21,22,23,25,26,27,29,30,31,34,35,36,37,38,39,40,42,43,46,48,49,50).
Kod-ildizi: `apps/api/src/modules/crm/**`, `apps/api/src/modules/sd/**`, `lib/db/src/schema/**`, `artifacts/erp-dashboard/src/**`.

| # | Savol (qisqa) | Oldingi | Hal qilingan status | Dalil (fayl:satr / jadval / grep) |
|---|---|---|---|---|
| 5 | KP "ko'rildi" email-pixel + Telegram belgisi | cross-ref kerak | **Yo'q** | grep `pixel\|opened_at\|viewedAt\|seen_at\|read_receipt` (i) `apps/api/src/modules/crm` → 0 mos. KP-view tracking mexanizmi yo'q |
| 7 | Qarz Finance keshi (5daq TTL) + SD real-time tekshiruv bitim ochishda | cross-ref kerak | **Yo'q** | `crm-deals.controller.ts:116` `@Post()` bitim yaratishda hech qanday debt/credit gate yo'q; grep `creditLimit\|debt` deals-controllerda 0. (SD tomonida customer 360 debt bor, CRM bitim-ochish gate emas) |
| 9 | Caller ID korporativ liniya flagi + qo'lda tanlash | cross-ref kerak | **Yo'q** | `crm-auto-lead.service.ts:37` `ingestCallLead(phone,...)` faqat telefon→lid ingestion; korporativ-liniya flagi / qo'lda tanlash / call-history yo'q. Step-3 SB0630/636 korporativ-raqam modeli "qurilmagan" |
| 11 | VIP/segment har buyurtmadan keyin trigger bilan qayta hisob | cross-ref kerak | **Qisman** | `crm/analytics/rfm.service.ts` (9-segment RFM, pure compute) + `crm-analytics.controller.ts:89` `@Post('rfm/cluster')`. LEKIN on-demand cluster endpoint — event-driven per-order trigger yo'q (grep `@OnEvent` analytics/ → 0), VIP-o'zgarish bildirishnomasi yo'q |
| 12 | Kredit limiti oshganda blok + Daromadlar+direktor tasdig'i | cross-ref kerak | **Yo'q** | `crm-deals.controller.ts:116` `@Post()` bitim ochishda kredit-limit blok yoki tasdiq-oqimi yo'q. (director HITL `DISCOUNT_OVERRIDE` bor lekin CRM bitim-gate emas) |
| 15 | QcReclamationOpenedEvent → CRM jadvaliga (bir yo'nalish) | cross-ref kerak | **Yo'q** | CRM listeners = faqat website-lead + lead-converted (`crm/listeners/`); grep `Reclamation` (i) `crm` → 0 listener. qc_reclamations jadval bor (`schema-misc-qc.ts:39`) ammo CRM'ga event-ko'prik yo'q |
| 16 | 360° ko'rinish parallel so'rov + har blok skeleton | cross-ref kerak | **Qisman** | 360 real: BE `drizzle-sd-customers/customer-360.builder.ts`+`.helpers.ts`, FE `pages/crm/DetailSheetCustomer360.tsx`, `pages/Customer360Page.tsx`. LEKIN grep `Skeleton\|Promise.all\|useQueries` DetailSheetCustomer360.tsx → 0; parallel-blok+skeleton yuklash strategiyasi tasdiqlanmadi |
| 17 | Menejer ketganda korporativ akkaunt HR + yozishma arxiv (read-only) | cross-ref kerak | **Yo'q** | reassign/HR-sync logikasi yo'q (Step-3 SB0662/0668 "taqsimot+HR event yo'q"); grep CRM listeners'da HR-leave/reassign 0 |
| 19 | Format o'zgarishi dialogi faqat ta'sirlangan liniyada | cross-ref kerak | **Yo'q** | grep `format` per-line deal-edit gate `crm` FE/BE → mos yo'q; bunday dialog/constraint qurilmagan |
| 20 | "O'lcham tasdiqlandi" bayrog'i Dizayn bosqichida (gate) | cross-ref kerak | **Yo'q** | Dizayn-modul gate, CRM'da yo'q; grep `size.*confirm\|o'lcham` CRM → 0 |
| 21 | ГП blanka 3 imzo (omborchi+haydovchi+menejer) PIN F5 | cross-ref kerak | **Yo'q** | grep `signature\|blanka\|PIN\|imzo` (i) `crm` → mos yo'q (faqat `sales_orders` so'zi); 3-imzo yuk-chiqarish gate CRM'da qurilmagan |
| 22 | Qayta buyurtmada diff view + har maydon tasdiq | cross-ref kerak | **Yo'q** | grep `reorder\|diff` → faqat custom-fields `reorder(order_index)` (maydon tartibi) va churn "reorder-threshold" izohi; qayta-buyurtma diff-UI/constraint yo'q |
| 23 | Imzolangan spetsifikatsiyada ham Finance qarz bloki ustun | cross-ref kerak | **Yo'q** | yuk-chiqarish Finance-blok CRM'da yo'q (WMS/SD domeni); grep `signed.*spec\|Finance.*block` crm → 0 |
| 25 | SupplyImportIssueEvent → CRM vazifa + direktor panel | cross-ref kerak | **Yo'q** | grep `SupplyImport\|import.issue` (i) `apps/api/src` → 0; CRM listener yo'q |
| 26 | Dizayn/STP kun-limiti oshsa boshliq+sotuvchiga bildirishnoma (E5) | cross-ref kerak | **Yo'q** | grep `escalat\|eskalat\|day.limit\|E5\|Vysotskiy` (i) `crm` → 0 fayl; eskalatsiya marshruti CRM'da yo'q |
| 27 | Qog'oz zayavka profili yangi bitim formasiga pre-fill + snapshot | cross-ref kerak | **Yo'q** | grep `pre-fill\|prefill\|snapshot` crm → mos yo'q; qog'oz-zayavka pre-fill oqimi qurilmagan |
| 29 | Chegirma suiiste'mol bayrog'i (90 kun 3+ marta yoki 10%+, business.constants) | cross-ref kerak | **Yo'q** | grep `discount.*abuse\|abuse.*flag\|discount_count` (i) `apps/api/src` → 0. business.constants'da CRM chegirma-suiiste'mol mezoni yo'q (`director` HITL DISCOUNT_OVERRIDE alohida) |
| 30 | Namuna buyurtmasi PP "namuna" past ustuvorlik + statistika tashqarisi | cross-ref kerak | **Yo'q** | grep `sample\|namuna` (i) `crm` → mos yo'q; "namuna" order-tur kategoriyasi CRM'da yo'q |
| 31 | Korporativ raqam real-time webhook + ruxsatsizda INCIDENT | cross-ref kerak | **Yo'q** | grep `caller\|telephon\|webhook.*incident` (i) CRM → mos yo'q; Step-3 SB0630/636 korporativ-raqam modeli "qurilmagan" |
| 34 | Chiqimli/chiqimsiz narx IChM dan avto + "norma yo'q" ogohlantirish | cross-ref kerak | **Yo'q** | grep `IChM\|chiqim.*norma\|cost.*price` CRM → mos yo'q; KP narx-avto-hisob IChM integratsiyasi CRM'da yo'q |
| 35 | ГП-kod profiliga QC brak/rad belgisi + qayta buyurtma ogohlantirish | cross-ref kerak | **Yo'q** | grep `brak\|QC.*flag\|reorder.*warn` crm → mos yo'q; QC↔CRM brak-flag ulanishi yo'q |
| 36 | "Прошло (kun)" "Yuk chiqdi"da to'xtaydi; qisman to'lov to'xtatmaydi | cross-ref kerak | **Yo'q** | grep `proshlo\|days.since.*ship\|shipment.*counter` crm → mos yo'q; yuk-chiqishda to'xtaydigan kun-hisoblagich CRM'da yo'q |
| 37 | Yutildi→bekor qilinganda KPI avto-tuzatish eventi | cross-ref kerak | **Yo'q** | `crm-deals.controller.ts:141` faqat `@Patch(':id/won')` markWon (DealWonEvent); bekor-qilish→KPI-avtotuzatish endpoint/event yo'q (grep `cancel\|reopen\|kpi` deals-controller → 0) |
| 38 | Keyingi buyurtma eslatma vaqti AI avto-hisob (standart 30 kun) | cross-ref kerak | **Yo'q** | grep `reminder\|next.*order` (i) crm → mos yo'q; keyingi-buyurtma AI-eslatma qurilmagan |
| 39 | Valyuta 5%+ sakrasa KP/bitim "qayta hisob kerak" statusi | cross-ref kerak | **Yo'q** | grep `recalc\|qayta.hisob\|currency.*jump\|valyuta` (i) crm → 0; valyuta-o'zgarish→status mexanizmi yo'q (Step-3 SB0676 narx-qayta-hisob yo'q) |
| 40 | Ombor kirish talablari Logistika rejasida sales_orders'dan avto-tortiladi | cross-ref kerak | **Yo'q** | Logistika/WMS domeni; CRM'da avto-tortish+ogohlantirish yo'q (grep `warehouse.*entry\|logistics` crm → mos yo'q) |
| 42 | "Menejer fikri/hohishi" strukturali (kategoriya+matn) + AI onboarding | cross-ref kerak | **Yo'q** | grep `onboarding\|opinion\|hohish\|structured.note` (i) crm → faqat rfm/clv izohlarida "onboarding" so'zi; strukturali opinion-maydon + AI-onboarding tavsiya yo'q |
| 43 | Korporativ raqam nazorati real-time + ruxsatsizda INCIDENT (НО-2) | cross-ref kerak | **Yo'q** | #31 bilan bir mexanizm — korporativ-raqam modeli/webhook/incident CRM'da yo'q (SB0630/636) |
| 46 | Mas'ul operator/usta PP rejalashtirishda "tavsiya" | cross-ref kerak | **Yo'q** | PP-rejalashtirish domeni; CRM'da yo'q. grep crm → mos yo'q |
| 48 | CRM audit tizim-wide audit_log (7 yil) + WHERE module='CRM' | cross-ref kerak | **Yo'q** | grep `audit_log\|AuditService\|recordAudit\|logAction` `crm` → 0 fayl; CRM entitilar audit_log'ga yozmaydi |
| 49 | Klishe/STP 3→7 kun 2-bosqichli avto-eskalatsiya (E5) | cross-ref kerak | **Yo'q** | grep `escalat\|klishe\|clishe\|E5` (i) crm → 0; #26 bilan bir xil — eskalatsiya yo'q |
| 50 | CRM oflayn (PWA): lid+faollik, KP faqat onlayn; conflict=server ustun | cross-ref kerak | **Yo'q** | grep `offline\|serviceWorker\|indexedDB\|sync.conflict` (i) `pages/crm` → 0 fayl; CRM oflayn-yozuv/sync qurilmagan |

### Xulosa
- **Ha:** 0
- **Qisman:** 2 (#11 RFM segmentatsiya bor ammo on-demand cluster, event-trigger emas; #16 360° ko'rinish real ammo parallel-blok+skeleton yuklash tasdiqlanmadi)
- **Yo'q:** 31
- **data-check kerak:** 0

Umumiy naqsh: bu 33 "cross-ref" qatorlarining aksariyati cross-modul gate/UI/event xususiyatlari (yuk-chiqarish imzolari, korporativ-telefoniya, eskalatsiya, valyuta/narx qayta-hisob, audit_log, PWA-oflayn) — CRM modulida qurilmagan. Faqat RFM segmentatsiya (analytics/) va Customer-360 ko'rinishi qisman mavjud.
