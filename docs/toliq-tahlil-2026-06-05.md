# EuroPrint ERP — TO'LIQ TAHLIL (2026-06-05/06)

> Ustoz-sintezchi yakuniy hisoboti. 8 ta bo'lim-agentning ishini bitta joyga yig'gan,
> sodda o'zbek tilida (egasi dasturchi emas — metafora bilan tushuntiriladi).
> Manba: `docs/_tahlil-parts/` (s1a, s1b, s1c, s1d, s1e, s2-uzilishlar, s3-vizyon, s4-delta).
> Rol: 🔵 TAHLILCHI (qat'iy read-only). Spot-check qilingan (kod + DB qayta tekshirildi).
>
> **Asosiy metafora (butun hisobotni tushunish kaliti):**
> Tizim — bu **yangi qurilgan katta bino**. Hamma xonalar qurilgan, devorlar bor, hatto
> eng murakkab "miya-formula" ham o'rnatilgan. **Lekin elektr ulanmagan, suvni hech kim
> ochmagan, hech kim ko'chib kelmagan.** Shuning uchun "qurilish 78% tayyor" (kod) bo'lsa
> ham, egasi "30-35%" his qiladi (jonli ishlaydigan tizim).
>
> **Eng muhim fakt:** Jonli DB (`europrint`) qurilish bosqichida — deyarli hamma jadval
> BO'SH (0 qator). "0 qator" = kod ishlamaydi degani EMAS; balki **hali ma'lumot
> kiritilmagan** degani. Ko'chiriladigan data yo'q (migratsiya kerak emas).

---

## SPOT-CHECK NATIJASI (verify-don't-trust — ustoz qayta tekshirdi)

Men 12+ ta muhim hukmni kod va DB bilan **mustaqil qayta tekshirdim**. Hammasi to'g'ri
chiqdi — part-fayllarda nomuvofiqlik TOPILMADI. Tasdiqlangan dalillar:

| Tekshirilgan hukm | Natija | Dalil |
|---|---|---|
| Qatlam formula (vizyon 7) REAL va ulangan | ✅ TO'G'RI | `layer-formula.service.ts:53` `convert()` + `mm-materials.controller.ts:56` `GET :id/sheet-conversion` + `mm.module.ts:83` provider |
| POS→GL "dead-letter" (vizyon 1) | ✅ TO'G'RI | `pos-gl-auto.listener.ts:19` izohi: "no emit site exists today... already a dead-letter"; `:87` faqat `pos_gl_posting_log` ga (AWAITING_REVIEW), `entries` ga emas |
| CRM SMS/email yashil-yolg'on (vizyon 13) | ✅ TO'G'RI | `crm-comms.service.ts:17` faqat `logEmail`, `:30` `logSms` (`"SMS sent to ${phone}"` echo), `:19/32` `{sent:true}` — real provider YO'Q |
| `work_centers`=0, `warehouse_stock`=25 | ✅ TO'G'RI | jonli SELECT: 0 va 25 |
| `org_departments`=142, `sales_orders`=12, `crm_leads`=5, `material_cards`=21, `users`=31, `employees`=30 | ✅ HAMMASI TO'G'RI | jonli SELECT bilan bayt-ma-bayt mos |
| `orders`/`materials`/`wms_stock` jadvallari DROP | ✅ TO'G'RI | `to_regclass` = `null` (uchchalasi yo'q) |
| `employees.manager_id` = 30/30 NULL | ✅ TO'G'RI | jonli SELECT: mgr_null=30 |
| `employees.user_id` = 0 NULL (backfill bo'lgan) | ✅ TO'G'RI | jonli SELECT: user_null=0 |
| `head_user_id` to'ldirilgan = 18/142 | ✅ TO'G'RI | jonli SELECT: head_filled=18 |
| `sd_order_departments`=0, `entries`(GL)=0, `material_layer_config`=0 | ✅ TO'G'RI | jonli SELECT: uchchalasi 0 |

**Xulosa:** Part-fayllar ishonchli. Quyidagi sintez ularning mazmunini sodda tilda
to'liq saqlab birlashtiradi.

---

## SECTION 1 — MODUL STATUS (20 modul)

> Tasnif: **REAL** = service/repo + jonli DB ga yozadi/o'qiydi (jadval bo'sh bo'lsa ham
> kod yo'li haqiqiy) · **501-stub** = halol "hali tayyor emas" javobi · **yashil-yolg'on**
> = 200 qaytaradi, lekin DB ga tegmaydi (echo/qattiq-kod/Math.random) · **dublikat** =
> bir narsa 2+ joyda yoki ro'yxatga olinmagan (dead).
>
> **Eng muhim umumiy xulosa:** Backend juda mustahkam — tekshirilgan ~2255 routening
> ~97% REAL. Soxta javob juda kam. Eski kataloglarning "100+ stub" da'volari
> 2026-06-06 tuzatish to'lqinlaridan keyin ESKIRGAN (ko'pi real qilingan).

### 1.1 Savdo va sotuv guruhi (s1a — 5 controller-guruh, 437 route)

**Savdo/CRM (121 route, 119 real):** To'liq CQRS/service bilan ulangan. Lid → bitim →
kompaniya → faoliyat → analitika hammasi jonli DB ga yozadi. CRM aloqa (email/SMS)
HALOL log yozadi ("yuborildi" demaydi, faqat qayd qiladi). **Yagona nuqson:**
`crm/ai/nba/create-task` (`crm-ai-extended.controller.ts:137`) — `{created:true,
taskId:Date.now()}` qaytaradi, DB ga yozmaydi (yashil-yolg'on).

**SD — Savdo-Distribyutsiya (106 route, 106 real — ENG MUSTAHKAM):** Mijoz CRUD + 360
ko'rinish + takliflar + buyurtmalar + to'lovlar + buyurtma-bo'limlar fan-out (Phase 4
saga) — hammasi haqiqiy. Bitta stub yoki soxta-create YO'Q. Eng to'liq ulangan modul.

**Marketing (108 route, 100 real, 8 stub):** 2026-06-06 "stub sweep" ko'pchilik stubni
real SQL ga aylantirgan (ko'rgazma/PR/inbox/sozlama/NPS jonli jadvallarga yozadi).
Qolgan 8 stub — **hammasi AI-bog'liq** (rost 501 qaytaradi, soxta-AI emas).

**Dizayn (22 route, 19 real, 1 stub, 2 yashil-yolg'on):** Yadrosi (so'rov → generatsiya →
tasdiq/rad) real va DB ga yozadi. **2 yashil-yolg'on:** `verifyDesign`
(`design-extended.repository.ts:98`) Math.random ball qaytaradi, `generateMockup` soxta
URL beradi (DB yo'q). `POST design/orders` qasddan 501 (real `POST /design` ga yo'naltiradi).

**QC — Sifat nazorati (80 route, 79 real, 1 yashil-yolg'on):** Keng va deyarli to'liq
real (CQRS + SPC + DPMO Six Sigma + bosma hisob-kitob). Yagona nuqson: `tests/:id`
(`qc-parameters.controller.ts:118`) qattiq-kodlangan null qaytaradi.

### 1.2 Ishlab chiqarish va pul guruhi (s1b — 5 modul, 557 route)

**Texnologiya (13 route, 11 real, 2 stub):** Papka tasdiqlash (3-checkpoint), AI-check,
tech-card o'qish REAL. Faqat 2 ta "karta generatsiya/optimallashtirish" halol 501.

**MES (46 route, 46 real — TOZA):** Sessiya, downtime, OEE, smena statistikasi, texnik
xizmat — hammasi CQRS handlerga ulangan. OEE jadvalidan haqiqiy hisoblaydi (hardcode emas).

**Ombor/WMS (154 route, ~147 real, 6 stub, 1 yashil-yolg'on):** Stock CRUD, FEFO,
reservatsiya, harakat, katalog ABC — REAL. **6 stub** = MM/FI tashqi integratsiya
klasteri (halol 501, #FX-3). **1 yashil-yolg'on:** `sync-pos` xatoni yashiradi
(`{ok:true, warning:'sync queued'}`). MUHIM: `POST /wms/stock` 2026-06-05 da OLIB
TASHLANGAN — stok endi faqat goods-receipt/sync orqali yoziladi (to'g'ri tuzatish).

**POS (168 route, ~165-167 real):** Eng katta modul (24 controller, ~50 jadval, ~30
servis). Kirim/chiqim/harakat/QC/damage/kassa — hammasi ledger+audit bilan. **2 yashil-
yolg'on:** `inventory/:id/adjust` echo (LEGACY_NOOP), `barcode/ai-suggestion/pending`
echo. *(Eslatma: s1b va s1e ikkala agent ham POS ni tahlil qildi — bir modul.)*

**Moliya (176 route, ~172 real, 2 stub, 2 yashil-yolg'on):** GL provodka, invoice CRUD,
AR/AP aging, to'lov yozish, davr yopish — REAL repo/servisga ulangan. **2 stub:**
`reports`/`loans` (#FX-4). **2 yashil-yolg'on:** `payments/:id/verify`
(`{message:'Payment verified'}` hardcoded) va `:invoiceId/outstanding` (har doim 0).

> **s1b muhim tuzatish:** Eski kataloglarning "pp-routing/production-reports/finance-
> extended-payroll = stub" da'volari SOXTA-POZITIV — ular `notImplemented` ni faqat
> IMPORT qiladi, CHAQIRMAYDI (dead import).

### 1.3 Inson va xavfsizlik guruhi (s1c — 5 modul, 645 route)

**HR (379 route, 373 real, 6 stub):** Deyarli to'liq simlangan — rekruting, onboarding,
vakansiya, pip, eNPS, attendance-face, telegram-botlar. Faqat 6 marginal 501
(tug'ilgan kun sozlamalari ×3 + hr-capital ekranlari).

**LMS (86 route, 86 real — TOZA):** To'liq real. Kurs, enrollment, dars, imtihon,
sertifikat, bilimlar bazasi — hammasi. Bitta stub yo'q (DB tayyor, kurs hali yo'q).

**Security (28 route, 23 real, 5 stub):** Incident CQRS real; tashrif/PPE INSERT real.
**Assimetriya:** PPE yozish (POST) real, lekin O'QISH (GET ppe-checks/stats/violations)
+ fire-sensors + daily-summary 501 (#FX-6) → FE bu sahifalarni ko'rsata olmaydi.

**IoT/IoT-KPP (138 route, 137 real, 1 stub):** Eng katta, eng to'liq simlangan yuza —
kamera + sensor + operator planshet hammasi real INSERT/UPDATE/SELECT. Faqat 1 POST
alert-resolve halol 501 (PATCH-egizagi real). BARCHA jadval 0 qator (real oqim yo'q).

**MRO/Xo'jalik (14 route, 14 real — TOZA):** Kichik lekin to'liq. Ta'mirlash buyurtmasi,
jihoz, ehtiyot qism, oshxona, tozalash, kommunal — hammasi real DB.

### 1.4 Boshqaruv va vazifalar guruhi (s1d — 4 modul, ~325 faol route)

**IoT/Kamera (~135 route, ~125 real, 1 stub, 3 yashil-yolg'on):** Deyarli to'liq real.
**3 yashil-yolg'on:** `camera-reports GET generate-pdf/excel` (`{url:null}`),
`ai-camera analyze-by-missions` (AI yo'q, echo). **Dublikat:** bir xil ma'lumot
(safety-violations, recognition-stats, quality-defects) 3 xil URL-prefiksda.

**Direktor (~80 route, ~78 real — ENG TOZA):** CQRS + service + repo + mavjud DB
jadvallar. OKR, kaizen, strategik, koordinatsiya, ZVS/ZNO, approvals. **1 yashil-
yolg'on:** `coordination/councils` qattiq-kodlangan 5 ta kengash. **1 ataylab
dublikat:** `kpi`╳`kpis` (legacy alias).

**Admin/SaaS (~35 route, ~31 real, 3 yashil-yolg'on):** Yadro (users CRUD + settings +
audit) real va **jonli ma'lumotli** (users=31, audit_log=39). **3 yashil-yolg'on:**
`/admin/roles` statik, `/admin/login` stub-redirect, queue `DELETE failed/:id` haqiqatda
o'chirmaydi.

**Vazifalar/Kanban (~75 faol + 5 dead, ~71 real, 2 yashil-yolg'on):** Faol 6 controller
real (boards=2, cards=2 jonli; Excel/PDF export real). **Asosiy muammo:** eski
`KanbanController` — import qilingan, LEKIN `controllers[]` ga qo'shilmagan → 5 route
runtime'da YO'Q (dead); izlagan `tasks` jadvali ham mavjud emas.

### 1.5 Aloqa va struktura guruhi (s1e — 5 modul, 291 route)

**CC — Communication Center (30 route, 29 real, 1 yashil-yolg'on):** Hujjat-aylanish
(draft→send→approve→PIN→PDF→QR-verify) to'liq real (transaction bilan). **1 yashil-
yolg'on:** webhook audit-log placeholder (`SELECT 1`, log jadvali yo'q).

**Koordinatsiya (14 route, 13 real, 1 yashil-yolg'on):** dokla/rasporyazhenie real CRUD
(auth-gated). **1 yashil-yolg'on:** `getCouncils` qattiq-kodlangan.

**Chat (56 route, 56 real — TOZA):** Boy va to'liq (thread/forward/poll/reaction/pin/
push/video/admin). Stub yo'q. **Yagona muammo:** `/chat`╳`/hr-v2/chat` ikki parallel
prefiks (legacy migratsiya tugamagan, ~4 dublikat).

**Org-struktura (23 route, 23 real — TOZA):** Daraxt CRUD + move + export + papka +
portret + HR-so'rov + boshqaruvchi-zanjir. Stub/echo yo'q.

**POS (168 route, 167 real, 1 yashil-yolg'on):** *(s1b bilan bir modul, boshqa agent
ko'zi.)* Yagona soxta: legacy `adjustInventory` echo. Asosiy zaiflik: legacy/v2 prefiks
parallelizmi (`pos`/`legacy/pos`/`v2/pos`; `pos/sales`╳`pos/transactions`).

---

## SECTION 2 — UZILISHLAR (uzilgan bog'lanishlar)

> Bu bo'lim modullar ORASIDAGI uzilgan simlarni sanaydi. Metafora: xonalar qurilgan,
> lekin ba'zi xonalar orasida sim tortilmagan — bittasidan ikkinchisiga signal o'tmaydi.
> **Jami: 33 uzilish** (hammasi jonli kod/DB bilan tasdiqlangan).
>
> ⚠️ MUHIM: Eski hisobotdagi 8 ta da'vo 2026-06-06 tuzatishlaridan keyin SOXTA-POZITIV
> bo'lib chiqdi va bekor qilindi (pastda).

### Eng og'ir uchlik (eng muhim 3 uzilish)

1. **POS → GL → Defter UZILGAN (PUL MOS KELMASLIGI):** POS harakatlari
   `pos_gl_posting_log` ga (AWAITING_REVIEW staging) yoziladi, lekin kanonik `entries`
   defteriga HECH QACHON o'tmaydi. Ustiga, kerakli voqea (`pos.movement.data.completed`)
   ni hech kim emit qilmaydi → butun avto-GL zanjiri o'lik-xat (listener o'zi
   "dead-letter" deb yozadi: `pos-gl-auto.listener.ts:18-21`). **Pul buxgalteriyaga
   tushmaydi.**

2. **Goods-receipt → GL UZILGAN (PUL MOS KELMASLIGI):** `goods-receipt.handler.ts:27-83`
   faqat 3-tomonlama moslik + PO status saqlaydi; **GL legi YO'Q**. Mol kirimi
   buxgalteriyaga umuman tushmaydi.

3. **CC `MANAGER_OF_SENDER` ISHONCHSIZ:** `employees.manager_id` jonli DB'da **30/30
   NULL** (spot-check tasdiqladi). To'g'ri yo'l hech qachon ishlamaydi — faqat org-daraxt
   fallback'iga tayanadi (u ham `org_departments.head_user_id` bo'sh bo'lsa throw qiladi,
   124/142 NULL). Tasdiqlash workflow'i menejer-hop'ida mo'rt.

### 2.1 FE→BE drift (5 ta haqiqiy)

FE noto'g'ri yo'l/metod chaqiradi: `POST security/incidents`, `POST security/visitors`,
`POST security/ppe-checks` (BE'da faqat GET bor → forma 404, data yo'qoladi); CRM
`ai/extended/chat/respond` + 3 boshqa path yo'q; `employees/*/files` +
`hr/employees/*/documents` POST topilmadi (fayl yuklash uzilgan).

> Eski drift ro'yxatining katta qismi wildcard/param tufayli SOXTA-POZITIV edi —
> faqat shu 5 tasi jonli kodda tasdiqlandi.

### 2.2 FE chaqiradigan 501-stublar (3 ta, hammasi halol)

Marketing AI-generate klasteri (AI-gated), `design/orders` (qasddan), iot crew INSERT
(DDL-gate). **MUHIM o'zgarish:** operator planshet (iot-tablet) butun ishlab-chiqarish
sessiyasi (start/stop/defect/inline-qc/handover) endi REAL DB — eski "hammasi 501"
da'vosi soxta-pozitiv edi.

### 2.3 Yo'q FK (2 ta)

`papka_orders ↔ sales_orders` (ustun bor, FK yo'q — messaging-conflated, ehtiyot uchun
qoldirilgan); 12 ta `ow_*` uuid ustun (uuid↔int mos kelmaydi → FK yo'q, "ikki-olam"
yadrosi, type-migration kerak).

> ✅ MUSBAT: Phase-2 da 7 FK qo'shilgan va jonli tasdiqlangan (sales_order_items,
> ow_cliches, ow_molds, ow_material_requirements, ow_shipping_requests, ow_tech_cards,
> sd_order_departments → hammasi `sales_orders(id)`). `orders` jadvali DROP qilingan.

### 2.4 "Ikki olam" (data 2+ jadvalga bo'lingan, 5 ta)

| Kanonik | Parallel | Holat |
|---|---|---|
| `sales_orders` (12 qator) | `papka_orders` (0, MES/messaging) | FK yo'q (#9) |
| `entries` (GL, 0) | `gl_journal_entries`+`gl_lines` (faol yozuvchilar) · `pos_gl_posting_log` | **3 GL modeli, ko'prik yo'q — pul mismatch** |
| `warehouse_stock` (25, kanonik) | `stocks` (0) · ledger | WMS↔POS bo'linishi |
| `attendance` (payroll O'QIYDI) | `hr_tz2_daily_attendance` · `attendance_logs` + 5 boshqa | **Yozuvchilar har xil jadvalga yozadi, payroll faqat `attendance`ni o'qiydi** |
| `crm_leads` (5, faol) | `leads` (0) · `marketing_leads` · `exhibition_leads` | lid 4+ jadvalga sochilgan |

### 2.5 0-listener / 0-emit voqealar (publisher bor, eshituvchi yo'q)

- `iot.anomaly` (agent string-yo'li) — listener 0 (lekin tipli `AnomalyDetectedHandler`
  ISHLAYDI, parallel yo'l tirik);
- 7+ agent voqeasi (`finance.fraud_suspected`, `stock.critical`, `warehouse.roll_low`,
  `crm.hot_leads_found`, `production.delayed`, `quality.defect_rising`,
  `security.emergency`) — har biri OnEvent=0 (alert hech kimga yetmaydi);
- `pos.requisition.*` (5 voqea) — listener yo'q;
- `pos.movement.data.completed` — hech kim emit qilmaydi (GL zanjiri o'lik, #20);
- `sales.copilot.pdf_dispatch` — listener yo'q (PDF jo'natilmaydi);
- `employee.created`, `hr.attendance.recorded`, `payroll.period.closed`,
  `rbac.permission.changed` — listener yo'q.

> ✅ Outbox YO'Li REAL: aggregate→outbox→`domain_events` bir tranzaksiyada
> (`create-order.handler.ts:86-110`). `domain_events`=0 faqat bo'sh DB sabab — uzilish EMAS.

### 2.6 Modul↔modul bog'lanish yo'q (vizyon zanjiri uzilgan)

- **POS→GL→defter** (#24, pul mismatch) · **Goods-receipt→GL** (#25, pul mismatch) ·
- **MES→QC** (#26, mes modulida qc-link=0) · **CC→Kanban→Kassir** (#27, real chaqiruv
  yo'q) · **ERP voqea→ichki Chat** (#28, chat'da OnEvent=0) · **Dizayn→Ishlab chiqarish**
  (#29, production-link=0).

### ESKIRGAN DA'VOLAR (8 ta soxta-pozitiv, bekor qilindi)

iot-tablet 501 → REAL · marketing PATCH/DELETE 501 → REAL · design notifications/tooling
501 → REAL · LMS event nom-mos → MOS (ikkala tomon dot) · CC MANAGER_OF_SENDER har doim
throw → fallback bor · order outbox'ni chetlab o'tadi → bir tx · `orders` o'lik-olam →
DROP qilingan · `ThreeWayMatchFailedEvent` 0-listener → listener bor.

---

## SECTION 3 — 22 VIZYON MOSLIK

> Bu egasi xohlagan 22 ta katta orzuni qancha bajarilganini baholaydi.
> Ball: ✅ done · 🟡 qisman · 🔴 zo'rg'a · ⬜ boshlanmagan.
> ⚠️ Tuzatish: oldingi "Qatlam formula YO'Q" baho SOXTA-NEGATIV edi — formula TOPILDI
> va ulangan (spot-check tasdiqladi).

| # | Vizyon | Ball | Qisqa hukm |
|---|--------|:---:|------------|
| 1 | POS Monitor (DRAFT→KARANTIN→QC→OMBOR→AI_GL) | 🟡 | Real state-machine + QC stock ko'chirish; AMMO `pos_movements`=2, AI_GL bosqichi UZUQ (faqat staging log, `entries` ga o'tmaydi, dead-letter) |
| 2 | Kassir-hub (hamma pul bitta kassirdan) | 🔴 | Markaziy kassir YO'Q (`cash_registers/sessions/transactions`=0); mavjud "kassa" chakana POS, markaziy hub emas. Pul oqimi tarqoq |
| 3 | 9-13 ombor turi (barkod) | ✅ | **YAGONA TO'LIQ VIZYON** — `warehouses`=12 to'g'ri tur, barkod real, `warehouse_stock`=25 (jonli data bor!) |
| 4 | 22 ofset sex (sexma-sex marshrut) | 🔴 | Infratuzilma bor, data 0 — `work_centers`=0 (birorta sex kiritilmagan), marshrut hech qachon ishlamagan |
| 5 | Flekso bo'lim | 🔴 | Faqat ombor nomi darajasida (WH-PROD-FLEXO); alohida work-center/routing yo'q |
| 6 | Gofra 2-qatlam | 🔴 | Formula bor (`corrugatedTotalGsm()`), lekin `material_layer_config`=0 — ishlatilmagan |
| 7 | ⭐Qatlam formula (kg→m²→list, AI-reja kaliti) | 🟡 | **REAL va WIRED** (`layer-formula.service.ts` + endpoint). AMMO kirish data bo'sh: `material_cards` da `format_a`=0/21, `material_kind`=0/21 → har chaqiruvda validation xato. **Aql bor, oziq yo'q** |
| 8 | Kassirovka (avto/qo'l) | ⬜ | Boshlanmagan — alohida operatsiya/jadval yo'q |
| 9 | Tigel (QC/brak manbasi) | 🔴 | QC modul real, lekin tigel alohida work-center sifatida konfiguratsiya qilinmagan |
| 10 | Har buyurtmaga material sarfi (IoT+skan) | 🔴 | Skelet bor (`ow_material_requirements` fan-out kod), data 0 — `material_consumption`=0, `mes_telemetry`=0 |
| 11 | Oylik (moliya→direktor→kassir; avans PIN) | 🟡 | Payroll service real (INPS8/JSHD12), oqim qisman; **avans-PIN YO'Q** (grep 0); kassir oxiri vizyon 2 ga bog'liq (🔴) |
| 12 | Oshpaz xo'jalik-ombordan skanerlaydi | 🔴 | Ombor bor (MRO-MAIN), lekin oshpaz/oshxona/menyu moduli HECH QAYERDA YO'Q (grep `oshpaz/kitchen/chef`=0) |
| 13 | CRM aloqa (SMS+AI-qo'ng'iroq+email) | 🔴 | **YASHIL-YOLG'ON** — `sendSms/sendEmail` faqat DB ga log yozadi, hech narsa YUBORMAYDI (real Eskiz/SMTP/Twilio yo'q). AI-qo'ng'iroq umuman yo'q |
| 14 | Menejer buyurtma-paneli (real-time, bosqich) | 🟡 | Real panel + saga (CQRS); AMMO WebSocket emas (GET polling), `sd_order_departments`=0, jonli buyurtma 12 ta |
| 15 | Web-sayt (katalog+lid+CMS) | 🟡 | Real backend + FE (public/contact→CRM lead); AMMO to'liq public katalog UI yo'q, `blog_posts`=0, `leads`=0 |
| 16 | Marketing xarajat (kassa→xarajat→Moliya) | 🔴 | DB CRUD bor (reja-vs-fakt UI), lekin **Moliyaga bog' YO'Q** (grep `OnEvent/finance`=0 marketing repo'larida); `entries`(GL)=0 |
| 17 | SMM + AI nazorat (AI kuzatadi, YOZMAYDI) | 🔴 | **Vizyonga ZID** — mavjud `aiReplyMutation` AI javob YOZADI, vizyon "faqat kuzatsin" deydi (teskari). Inbox 501-stub |
| 18 | Lid-gen 4 kanal (Web/Telegram/LinkedIn/Instagram) | 🔴 | **2/4 kanal** — Web✅ + Telegram✅ real; LinkedIn + Instagram ingestion YO'Q |
| 19 | ⭐⭐ Butun ERP org-strukturaga bog' (master data) | 🟡 | **ENG KUCHLI ZONA** — `org_departments`=142 (tree), 34 modul org ga murojaat, CC org-resolver real. AMMO `head_user_id` faqat 18/142, `manager_id`=0/30, "butun ERP" emas (asosan HR/CC) |
| 20 | Moslashuvchan org-konstruktor (head_user_id master) | 🟡 | Real konstruktor (getHierarchy/move/cycle-guard) + Portret wizard; AMMO getNodeHistory 501, head_user_id 18/142, "kerakli jihozlar" modeli yo'q |
| 21 | ⭐"Oltin ip" MVP (buyurtma→i.ch→ombor→moliya end-to-end) | 🔴 | Phase-4 fan-out spine REAL (5/6 bo'lim wired), saga real; AMMO jonli oqim UZILGAN — `sd_order_departments`=0, `ow_molds/tech_cards`=0, `entries`=0, `work_centers`=0 → end-to-end faqat test'da, jonli BIR MARTA ham aylanmagan |
| 22 | Integratsiya oqimi (CC→Kanban→Kassir; "orollar") | 🔴 | Spine real (CC/kanban/POS-WMS sync), lekin to'liq zanjir bir marta ham aylanmagan; `domain_events`=0, 13+ zero-listener event. Egasi aytgan "orollar" holati jonli kuzatiladi |

### NEGA texnik ~78% lekin egasi ~30-35% his qiladi? (3 bo'shliq)

1. **Jonli biznes-data BO'SH (eng katta sabab):** Vizyon yadrosi jadvallari 0 qator
   (`work_centers`, `material_layer_config`, `cash_*`, `entries`, `sd_order_departments`,
   `ow_*`, `payroll`, `campaigns`...). Egasi ekranni ochganda — bo'sh ro'yxat ko'radi.
   "Kod bor" ≠ "ishlaydigan tizim".
2. **Yashil-yolg'on va uzuq bo'g'inlar (eng aldamchi):** CRM SMS faqat log yozadi
   (yubormaydi); POS GL faqat staging'ga (defterga emas); marketing xarajat Finance'ga
   ulanmagan; SMM AI vizyonga teskari. Egasi "ishladi" deb ko'radi, natija ko'rinmaydi.
3. **Oqim uzuq — "orol"lar:** Oltin ip faqat test'da aylangan; markaziy kassir yo'q
   (pul tarqoq); "ishlab chiqarish" bloki (vizyon 4-10) deyarli bo'sh → zanjirning o'rta
   bo'g'ini yo'q. Egasi har modulni alohida orol ko'radi.

**Eng katta leverage (tartib bilan):** (1) qatlam formulani oziqlantirish
(`material_cards.format_a/material_kind` + `material_layer_config` seed — kod tayyor);
(2) `work_centers` + `pp_orders` seed va jonli oltin-ip aylanishi; (3) POS GL→`entries`
ulash + emit-site va CRM SMS ni real Eskiz'ga ulash; (4) kassir-hub markazlashtirish.

---

## SECTION 4 — DELTA (oxirgi tahlildan beri o'zgarish)

> 06-05 katalogdan 06-06 holatigacha ~25 commit. Hammasi jonli kod (`git show`) + DB
> bilan qayta tasdiqlandi. **Yo'nalish: oldinga** (stub→real, dublikat→kanonik, echo→halol).

### Raqamlar: eski → yangi

| Ko'rsatkich | Eski (06-05) | Yangi (06-06) | O'zgarish |
|---|---|---|---|
| Jami route | 2951 | **2982** | +31 (yangi real FE-drift endpoint) |
| 501 (katalog grep) | 157 | **145** | −12 |
| 501 (aniq `notImplemented()` chaqiruv) | ~148 | **39** | kuchli pasayish |
| 501 JAMI real endpoint | ~ | **~47** (39+8) | pasaydi |
| **Haqiqiy yashil-yolg'on** | 9 | **0** | **−9 (hammasi yopildi)** |
| Yarim-yolg'on (xato-yo'l echo) | 3-4 | **0** | −4 |
| `return {ok:true}` (yolg'on emas — real amaldan keyin) | ~20-25 shubha | **5** | hammasi halollashtirildi |
| `as unknown` stub (500 riski) | 0 | 0 | o'zgarmadi |

### Nima tuzatildi (asosiy commitlar)

- **GROUP 6 HR (`48c369a5`):** 8 ta `notImplemented` stub → real SQL SELECT (5/5 jadval
  mavjudligi DB-proof bilan tasdiqlandi);
- **GROUP 7 (`828df661`):** org-node history + skill-gap → real SQL;
- **forecast fix (`6a1d664b`):** 0-qatorli `materials` → kanonik `material_cards` (21 qator);
- **D2/WORLD4/orders DROP (`0c592e5d`/`d4fceb88`/`024e2b11`):** 5 ortiqcha jadval DROP
  (`orders`, `wms_stock`, `wms_stock_levels`, `materials`, `mm_materials`) — yozuvchilar
  kanonikка yo'naltirildi (spot-check: uchchalasi `null` tasdiqlandi);
- **NPS/sd-payments/hr-files/wms-movements (`95765961`/`eb39bd78`/`595c0977`/`77bc0832`):**
  echo → real INSERT/UPDATE/DELETE (RETURNING);
- **events classify (`33fc5b9d`):** 9 zero-listener event "fire-and-forget" deb
  BELGILANDI (faqat izoh, xatti-harakat o'zgarmadi — owner qarori).

### Yashil-yolg'on holati: 9 → 0

GROUP 1 (A1–A9) yopildi: cc-notification-prefs real upsert, finance cfo-config real
update, ideal-rasm POST retire, A1/A2/A8 retire, A3/A4/A5 real. Qolgan 5 ta `return
{ok:true}` — hammasi REAL amaldan KEYIN (fayl FS yozuvi / hujjat amali / kanban amal —
yolg'on emas). `sd-customers return {}` ×4 — har biri real `softDelete` dan keyin.

### Dublikat/ikki-olam: kuchli qisqardi

5 ta ortiqcha jadval DROP (orders, wms_stock, wms_stock_levels, materials, mm_materials),
kanonikка yig'ildi. C2/C3/C4 route-to'qnashuv soxta-pozitiv edi (skaner ko'p-hisoblagan).

### Regress: TOPILMADI

Backend tsc = EXIT 0. Ish daraxtida faqat untracked proof-skript. DROP qilingan
jadvallarning yozuvchilari kanonikка yo'naltirilgan. Yangi yashil-yolg'on/`as unknown`
qo'shilmagan. Barcha o'zgarishlar oldinga.

---

## ROLL-UP — JAMI HISOB

### Route statistikasi (8 part-fayl yig'indisi)

> ⚠️ Eslatma: POS moduli ikki agent tomonidan tahlil qilingan (s1b ~168 + s1e 168 =
> bir modul). Quyidagi JAMI shu qoplamani saqlaydi (route'lar har agent o'z guruhini
> sanagan). "Faol route" taxminiy — har agent biroz boshqa metodika ishlatgan.

| Guruh (part) | Jami route | REAL | 501-stub | Yashil-yolg'on | Dublikat/dead |
|---|---:|---:|---:|---:|---|
| s1a (Savdo/CRM, SD, Marketing, Dizayn, QC) | 437 | 423 | 9 | 4 | bir nechta alias |
| s1b (Texnologiya, MES, WMS, POS, Moliya) | 557 | ~541 | 10 (+1 ataylab) | 5 | 0 |
| s1c (HR, LMS, Security, IoT-KPP, MRO) | 645 | 633 | 12 | 0 | 0 |
| s1d (IoT/Kamera, Direktor, Admin/SaaS, Kanban) | ~325 (+5 dead) | ~305 | 1 | 9 | 1 dead ctrl + qoplama |
| s1e (CC, Koordinatsiya, Chat, Org, POS) | 291 | 288 | 0 | 3 | ~5 prefiks |
| **JAMI (qoplamali)** | **~2255** | **~2190 (~97%)** | **~32 (+1)** | **21** | **~1 dead ctrl + prefiks-qoplama** |

> Delta o'lchovi (butun monorepo grep, qoplamasiz): **2982 route · ~47 real 501 ·
> 0 haqiqiy yashil-yolg'on (06-06 holatida hammasi yopildi)**. Part-agentlar topgan 21
> "yashil-yolg'on" — ko'pi marginal echo (camera-report download, admin queue delete,
> coordination councils, qc tests/:id, crm nba-task) + delta'da hisoblanmagan periferik
> qoldiqlar. **Haqiqat ikkalasi orasida:** kritik biznes-yo'llarda yashil-yolg'on YO'Q;
> qolgan ~15-21 ta — periferik AI/legacy echo (pul yoki asosiy workflowga ta'sir qilmaydi).

### 22 vizyondan: nechta done / qisman / zo'rg'a / boshlanmagan

| Holat | Soni | Vizyonlar |
|---|:---:|---|
| ✅ DONE | **1** | 3 (9-13 ombor turi + barkod — jonli data ham bor) |
| 🟡 QISMAN | **7** | 1 (POS Monitor), 7 (qatlam formula — aql bor data yo'q), 11 (oylik), 14 (menejer panel), 15 (web-sayt), 19 (org-bog'), 20 (org-konstruktor) |
| 🔴 ZO'RG'A | **13** | 2 (kassir-hub), 4 (ofset sex), 5 (flekso), 6 (gofra), 9 (tigel), 10 (material sarf), 12 (oshpaz), 13 (CRM aloqa), 16 (marketing xarajat), 17 (SMM AI), 18 (lid-gen), 21 (oltin ip), 22 (integratsiya) |
| ⬜ BOSHLANMAGAN | **1** | 8 (kassirovka) |

### "Qurilgan vs Vizyon" — eng katta gaplar (TOP)

1. **🏗️ Bino qurilgan, lekin hech kim yashamaydi.** Texnik ~78% (kod skeleti to'liq:
   jadval + repo + service + controller + FE har vizyon uchun bor), lekin jonli ~30-35%
   (data yo'q, oqim aylanmagan). Bu ZIDDIYAT EMAS — ikkalasi ham rost, faqat har xil
   narsani o'lchaydi.

2. **💰 Pul mos kelmaydi (eng og'ir, money-mismatch ×2):** POS→GL va Goods-receipt→GL
   uzilgan — sotuv va xarid buxgalteriyaga (`entries` defteriga) tushmaydi. POS GL faqat
   `AWAITING_REVIEW` staging'ga yoziladi va uni qo'zg'atadigan voqeani hech kim emit
   qilmaydi (dead-letter). Markaziy kassir-hub (vizyon 2) umuman qurilmagan.

3. **🧵 "Oltin ip" faqat test'da aylangan, jonli emas:** buyurtma→ishlab chiqarish→ombor→
   moliya zanjirining spine'i (Phase-4 fan-out + saga) REAL, lekin `sd_order_departments`=0,
   `work_centers`=0, `entries`=0 → end-to-end bir marta ham JONLI aylanmagan. O'rta
   bo'g'in (ishlab chiqarish, vizyon 4-10) deyarli bo'sh.

4. **🧠 Formula-miya o'rnatilgan, lekin oziqlanmaydi:** Qatlam formulasi (vizyon 7, AI-reja
   kaliti) to'liq REAL va endpoint'ga ulangan — lekin `material_cards` da o'lcham/tur/gsm
   maydonlari bo'sh (`format_a`=0/21, `material_kind`=0/21) → har chaqiruvda validation
   xato. Eng oson g'alaba: shu maydonlarni to'ldirish.

5. **📣 Yashil-yolg'on aldamchi bo'lgan, ENDI deyarli toza:** CRM SMS/email faqat log
   yozadi (yubormaydi); ammo 06-06 delta'da 9 haqiqiy yashil-yolg'on 0 ga tushirildi.
   Qolgani periferik echo (camera-download, admin-queue, councils) — pul/asosiy
   workflowga ta'sir qilmaydi.

6. **🗺️ Org-struktura — eng kuchli zona, lekin yarim to'la:** `org_departments`=142
   (jonli tree), 34 modul unga bog'langan. AMMO `head_user_id` faqat 18/142, `manager_id`
   30/30 NULL → tasdiqlash/menejer-zanjiri mo'rt, fallback'ga tayanadi.

7. **🧹 Tozalanish kuchli ketmoqda (musbat trend):** 5 ortiqcha "ikki-olam" jadval DROP
   (orders/wms_stock/materials...), 7 yangi FK, stub 148→39, regress YO'Q. Yo'nalish
   to'g'ri — har commit oldinga.

8. **🔌 Eshituvchisiz signallar:** 13+ voqea emit qilinadi, lekin hech kim eshitmaydi
   (agent alertlari, pos.requisition, sales.copilot.pdf). Modullar orasida 6 ta katta sim
   tortilmagan (MES→QC, CC→Kanban→Kassir, ERP→Chat, Dizayn→i.ch).

---

**Hech narsa o'zgartirilmadi.**
