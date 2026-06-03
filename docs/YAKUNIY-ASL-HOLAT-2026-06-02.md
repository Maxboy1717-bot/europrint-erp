# EuroPrint ERP — YAKUNIY ASL HOLAT HISOBOTI (2026-06-02)

> **FAQAT TAHLIL — read-only.** Hech bir kod/config/DB/migration o'zgartirilmadi. Bu hisobot —
> 15 ta agent (agent1..agent15, `*-2026-06-02.md`) + 9 ta asl-holat/ombor/iot/security hujjatining
> **sintezi va birlashtirilgan hukmi**. Har raqam manba hisobotdan olingan (har bo'limda manba ko'rsatilgan).
> Agentlar usuli: kod (Read/Grep, fayl:satr) + jonli DB (`europrint`@127.0.0.1:5432, `node _audit/q.cjs` SELECT) +
> qisman brauzer (:20806, Super Admin). Verify-don't-trust qoidasiga amal qilingan.
>
> **Egasi vizyoni manbasi:** `docs/ombor-pos-master-plan.md` (74+ savolli intervyu) +
> `docs/asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md` (11 vizyon nuqtasi).

---

## 0. BIR JUMLALIK HUKM (egasi uchun)

**EuroPrint ERP — texnik jihatdan ulkan va mustahkam qurilgan SKELET, lekin operatsion jihatdan deyarli BO'SH va modullar bir-biriga ULANMAGAN.** Backend juda boy (344 controller, ~2961 endpoint, ~91% kod-darajada real, BE+FE tsc 0 xato, 5 global guard bilan himoyalangan), frontend deyarli to'liq (441 route, ~280 sahifa, ~90% render bo'ladi). LEKIN: (a) jonli DB **88% bo'sh** (qurilish bosqichi); (b) modullararo **integratsiya oqimi uzilgan** (kod-darajada ~46%, jonli-oqim ~15-20%); (c) bir nechta **konseptual xato** (kassir = chakana POS, Kanban 3-savat mock, MES sexma-sex marshrut yo'q); (d) ~106 endpoint **DB drift** tufayli 503 beradi. Egasi "ballonsiz mashina" deganida HAQ — **dvigatel (modullar) bor va quvvatli, lekin transmissiya (oqim/integratsiya) ulanmagan + bir nechta g'ildirak (kassir-hub, sexma-sex marshrut, CC oqimi) yo'q**.

---

## 1. BUTUN TIZIM HOLATI — MODUL BO'YICHA JADVAL (necha % tayyor)

Har modul **2 o'lcham** bilan: (A) **Kod/skelet** — qurilgan, wired, tsc-toza; (B) **Jonli/oqim** — haqiqatan ishlatilgan, data bor, end-to-end oqadi. Vizyonga nisbatan % = ikki o'lcham va egasi talabini hisobga olgan yagona baho.

| # | Modul | Kod/skelet | Jonli/oqim | Vizyonga % | Asosiy holat | Manba |
|---|---|---:|---:|---:|---|---|
| 1 | **Ombor / WMS / POS Monitor** | ~85% | ~25% | **~62%** | Eng kuchli modul. POS↔ombor atomik issue/receive REAL (material_movements=3 jonli); 5-bosqich pipeline qurilgan+wired lekin oxirigacha haydalmagan (2 movement pending'da qotgan); 94 sahifa dublikat | agent6 |
| 2 | **Kanban** | ~75% | ~40% | **~55%** | Dvigatel ishlaydi (8 ko'rinish, CRUD real DB); LEKIN 3-Savat 100% MOCK, maxfiylik=0%, tasdiq zanjiri primitiv, test-axlat data | agent8 |
| 3 | **Kommunikatsiya Markazi (CC)** | ~75% | ~5% | **~40%** | Backend chuqur+sifatli (workflow/AI Claude/PIN/bot/SLA); LEKIN cc_documents=0, cc_user_pins=0, employees.manager_id=0 → hech qachon ishlatilmagan + 2 parallel tizim | agent9 |
| 4 | **Kassir / Pul / Moliya** | ~55% | ~12% | **~12-15%** | KONSEPT XATO: "Kassa"=chakana POS. Egasi naqd-nazorat+oylik hub istaydi. Payroll/avans/podotchet KODI real lekin UI-yetim + hamma 0 qator | agent7 |
| 5 | **MES / Ishlab chiqarish / PP** | ~70% | ~15% | **~30-35%** | Boy skelet (45+80 fayl, AI planner Johnson/CPM/EOQ real); LEKIN 0 sex/0 marshrut/0 sessiya; sexma-sex transfer=501 stub; routing yaratish=`return 0`; 4 drift bug; 3 parallel session | agent10 |
| 6 | **IoT / Sensor / Tablet** | ~65% | ~12% | **~25-30%** | Sensor O'QISH yo'li real (threshold bilan); LEKIN sensor YOZISH DB'ga yozmaydi, tablet 13/18 endpoint=501, WebSocket o'lik, 0 operator akkaunt (login imkonsiz), 8 IoT jadval=0 | agent11 |
| 7 | **HR / Org-sxema / Xodim** | ~75% | ~30% | **~55-60%** | Org-tree REAL (142 node), tasdiq zanjiri+position-RBAC (1380) enforce; LEKIN lavozim kartochka backend STUB, "kerakli jihozlar" model yo'q, employees.user_id=NULL (30/30), HR→oshxona yo'q | agent12 |
| 8 | **AI / Agentlar** | ~90% | ~0% | **~35%** | Keng skelet (4 modul, ~158 route, 25 tool); LEKIN faqat Claude tirik (OpenAI/Gemini kalit yo'q), 14 agentdan 5 AI/9 SQL-placeholder, hamma AI jadval=0, env nomi parchalangan | agent15 |
| 9 | **CRM / SD (Sotuv)** | ~95% | ~35% | **~70%** | Eng sog'lom oqim: CRM→SD→Kanban+Logistics avto-fan REAL; lead→deal convert REAL; SD 100% funksional (104 endpoint); jonli 5 lid + 12 buyurtma | agent1, agent4, agent5 |
| 10 | **Backend (umumiy)** | ~91% | ~80% | **~85%** | 344 controller, 2961 endpoint, 90.6% REAL kod, 5 global guard, 0 xavfli raw SQL, BE tsc 0; 274 stub (14 xavfli fake-create); 106 endpoint 503 (DB drift) | agent1, agent5 |
| 11 | **Frontend (umumiy)** | ~90% | ~40% | **~62%** | 441 route, ~280 sahifa, ~90% render, FE tsc 0; LEKIN ko'p sahifa bo'sh (DB), 110+ multiplekser route IA-chalkash, 1 buzuq sahifa (/wms/dashboard), mock/placeholder bor | agent3 |
| 12 | **Integratsiya (modullararo)** | ~46% | ~15-20% | **~30%** | 11 vizyon-bog'lanishdan 5.05/11; CRM→SD+org-sxema kuchli; LEKIN CC↔Kanban yo'q, Kanban↔Kassir yo'q, jonli stok event chiqarmaydi, 4 kritik hodisa 0-publisher | agent4 |
| 13 | **Arxitektura / Kod sifati** | B−/C+ | — | — | Mikro a'lo (fayl<900, Result pattern FAIL=2, array-safety FAIL=5, 5 guard); makro bo'lingan (2 yozuv-yo'li, 2 schema olami, compatibility=14819 satr monolit) | agent14 |
| 14 | **Xavfsizlik** | A−/B+ | — | — | Mustahkam: 4-5 global guard, 1273 @Roles, 0 SQL-inj, 0 hardcoded secret, 2 eski teshik (iot-tablet/storage) yopiq tasdiq; 3-4 past-o'rta hardening (OTP cap, JWT alg-pin) | agent13 |
| 15 | **DB (struktura)** | — | 12% data | — | 953 base jadval + 80 view = 1033; 88% (836) BO'SH; 75 "jadval" aslida VIEW; 69 DEAD; ~16 oila semantik dublikat (mijoz×7, material×7, stok×9...) | agent2 |

### 1.1 Modullarni reyting bo'yicha (vizyonga eng yaqindan eng uzoqgacha)

```
~70% ████████████████░░░░  CRM/SD (sotuv) — eng sog'lom oqim
~62% ██████████████░░░░░░  Ombor/POS · Frontend (umumiy)
~55% ████████████░░░░░░░░  Kanban · HR/Org-sxema
~40% █████████░░░░░░░░░░░  Kommunikatsiya Markazi
~35% ████████░░░░░░░░░░░░  MES/Ishlab chiqarish · AI/Agentlar
~30% ███████░░░░░░░░░░░░░  Integratsiya (modullararo) · IoT
~13% ███░░░░░░░░░░░░░░░░░  Kassir/Pul (konsept xato)
```

> **Eslatma:** Backend (85%) va xavfsizlik (A−) yuqori, chunki ular **texnik infratuzilma** — egasi vizyoni esa **operatsion oqim**ni o'lchaydi. Shuning uchun "yagona vizyon %" pastroq (8-bo'limga qarang).

---

## 2. TOP 10 MUAMMO (ustuvorlik bilan)

| # | Muammo | Ta'sir | Manba | Tur |
|---|---|---|---|---|
| **P1** | **Modullararo integratsiya oqimi uzilgan** — CC↔Kanban yo'q, Kanban↔Kassir yo'q, jonli stok yo'li `StockUpdatedEvent` chiqarmaydi → ROP/GL/broadcast tetiklanmaydi; 4 kritik hodisa 0-publisher (dead-letter) | **Vizyon yuragi.** "Ballonsiz mashina"ning asosiy sababi | agent4 (U1-U9) | TO'LDIRISH+ULASH |
| **P2** | **Kassir konsepti butunlay noto'g'ri** — `/accounting/cash-register`=chakana do'kon POS (barkod/savat/QQS/qaytim). Egasi naqd-nazorat+oylik/avans hub istaydi. Real kassir jadvallar (cash_*) 0 yozuvchi | Eng muhim modul amalda mavjud emas (~12%) | agent7 §2 | NOLDAN (konsept) + mavjud dvigatel ulash |
| **P3** | **106 endpoint DB drift tufayli 503** — 12 jadval umuman yo'q (zvs, qc_approvals, mm_vendor_ratings, mes_work_centers...); ustun drift (updated_at, zone_id, course_id...); FK tur drift (uuid↔int) | 80%→ko'p modul "ishlamaydi" effekti; employee-kpi 4/4, employee-files 2/2 to'liq buzuq | agent5 §3 | STRUKTURA TUZATISH (DDL) |
| **P4** | **Jonli DB 88% bo'sh + 5-bosqich pipeline'lar haydalmagan** — ombor EXTERNAL_IN 2 movement pending'da qotgan; MES 0 sex/0 marshrut; CC 0 hujjat; AI 0 chaqiruv; barcha operatsion jadval ~0 | Hamma "ishlaydigan" modul amalda bo'sh ko'rinadi; end-to-end isbot yo'q | agent2, agent6, agent9, agent10, agent15 | TO'LDIRISH (seed + jonli sinash) |
| **P5** | **MES sexma-sex marshrut + IoT skaner = YO'Q/stub** — `tablet/handover`=501, `material-kit-items/:id/scan`=501, routing yaratish=`return 0`; buyurtma Flekso→Ofset kuzatilmaydi; 0 operator akkaunt (login imkonsiz) | Vizyon yadrosi (sexma-sex ishlab chiqarish) yo'q | agent10 §7, agent11 §2,§8 | NOLDAN (operatsion endpoint) |
| **P6** | **Kanban 3-Savat 100% MOCK + maxfiylik 0%** — `ThreeBasketsPanel` hardcoded 5 karta; `getBoards()` rol/org filtri yo'q, "Barcha rollar" dead UI; har kim hamma doskani ko'radi | Vizyon: Bitrix24 maxfiy Kanban + CC→karta oqimi — yo'q yoki soxta | agent8 §4,§5 | TO'LDIRISH (maxfiylik) + ULASH (CC→karta) |
| **P7** | **14 ta xavfli STUB-FAKE-CREATE (POST qabul qiladi, DB'ga yozmaydi)** — payments/design-orders/vacancies/materials/routing → `{id: Date.now(), created: true}` | Sukutda **ma'lumot yo'qoladi**, FE "saqlandi" deydi | agent1 §4.2 | TUZATISH (real insert yoki 501) |
| **P8** | **employees.user_id NULL (30/30) + employees.id≠users.id** — CC org-resolver (MANAGER_OF_SENDER=14 shablonning 1-qadami), telegram, profil↔org bog'lanishi buziladi | CC butunlay ishlamaydi; org-sxema oqimining bir qismi jonli uziladi | agent9 §3.5, agent12 §11 | TUZATISH (data-yaxlitlik) |
| **P9** | **Material yaratish bo'lingan** — `POST /mm/materials`→`materials`(0); butun ombor oqimi `material_cards`(21) o'qiydi → yangi material omborda ko'rinmaydi; PosMonitor'da "Yangi material" tugma yo'q | Asosiy master-data oqimi uzilgan | agent6 §5, agent2 §4 | TUZATISH (kanonikga yo'naltirish) |
| **P10** | **Arxitektura makro-bo'linish** — 2 parallel yozuv-yo'li (CQRS vs flat-slice), 2 schema olami (@workspace/db vs @europrint/schemas), 154 dublikat pgTable, compatibility=14819 satr monolit | Maintenance/comprehension qarzi (runtime bug emas, DB superset qoplaydi) | agent14 §3,§4,§5 | KONVERGENSIYA (nazorat ostida) |

> **Eslatma:** Xavfsizlik bloker-darajada muammo YO'Q (agent13: 2 eski teshik yopiq, faqat hardening). Shuning uchun TOP-10 da xavfsizlik yo'q — bu **pozitiv**.

---

## 3. YUTUQLAR (nima yaxshi qurilgan — adolat uchun)

1. **Backend yuzasi katta va asosan REAL.** 344 controller, 2961 endpoint, **90.6% kod-darajada DB/servisga ulangan** (agent1). Eski hisobotlardagi "ko'p stub/duplikat/guardsiz/xavfli raw SQL" da'volari **bo'rttirilgan** — kod bilan rad etildi (0 runtime dup, 0 xavfli raw SQL controllerda).

2. **Xavfsizlik tayanchi MUSTAHKAM.** 4-5 global guard (Throttler→Jwt→Roles→Sod→Permission), 1273 @Roles + 177 @RequirePermission, 0 SQL-injection, 0 hardcoded secret, akkaunt-lock + CSRF + httpOnly cookie + JWT blacklist. 2 eski kritik teshik (iot-tablet, storage) **yopiq tasdiqlandi** (jonli 401) (agent13).

3. **Kod sifati mikro-darajada a'lo.** BE+FE tsc **0 xato**; eng katta qo'lda fayl 595/892 satr (900 chegara hurmat qilinadi); Result pattern FAIL=2 (avval 143), array-safety FAIL=5 (avval 678) — **dramatik yaxshilangan** (agent14). CLAUDE.md baseline raqamlari eskirgan.

4. **CRM→SD→Kanban+Logistics oqimi ISHLAYDI (end-to-end event-fan).** DealWon→order→3 consumer real INSERT; lead→deal convert real; SD 100% funksional (agent1, agent4).

5. **Org-sxema substrati REAL va to'liq.** 142 bo'lim (real EuroPrint struktura), tasdiq zanjiri rekursiv CTE (P2P + CC resolver + delegatsiya), position-RBAC matritsa 1380 qator **server-side enforce** (agent12).

6. **Phase 4 order→department fan-out backend-isbotlangan.** 1 buyurtma/5 bo'lim/1 avans → hammasi job→done (mold/design/cliche/logistics/warehouse) (agent4 link 1, memory).

7. **Ombor yadrosi atomik va jonli ishlagan.** POS Monitor issue/receive (minus saldo blok, RETURNING), config-driven 9 ombor turi, /wms/overview real 248.7M so'm/12 ombor/23 stok, inventarizatsiya 6 jonli (agent6).

8. **AI/MES'da haqiqiy algoritmlar.** Johnson's rule + CPM + EOQ + MRP/MPS/CRP + VRP + z-score anomaly — **matematik real** (soxta emas), faqat data yo'q (agent10 §9, agent15 §7).

9. **CC backend chuqur+sifatli.** Workflow engine (sequential/parallel/delegation), AI Claude intervyu (real callClaude), bcrypt PIN, Telegram bot, SLA cron, QR verify, HMAC webhook — hammasi stub EMAS (agent9).

10. **Ratchet himoyalari ishlaydi.** schema-dup (165), no-new-stubs, design-tokens, sidebar-regress — yangi qarz qo'shilishini bloklaydi (agent14).

---

## 4. NOLDAN QURISH vs TO'LDIRISH/ULASH (eng muhim ajratish)

Egasi uchun eng qimmatli xulosa: **ko'p narsa allaqachon qurilgan — asosiy ish "qurish" emas, "ulash + to'ldirish + tuzatish".** Quyida aniq ajratma:

### 4A. ❌ NOLDAN QURISH KERAK (kod/model umuman yo'q)
| Narsa | Nega yo'q | Hajm |
|---|---|---|
| **Kassir-hub UI** (smena ochish/yopish, naqd kirim/chiqim, oylik/avans tarqatish ro'yxati) | Faqat chakana POS bor; real kassir jadvallar (cash_*) 0 yozuvchi | O'rta (UI + bir nechta endpoint; dvigatel qismlar bor) |
| **MES sexma-sex operatsion endpointlar** (session start/stop, skaner→sarf, handover, inline-QC) | 13/18 tablet endpoint = 501 stub | Katta (13 endpoint) |
| **Lavozim "kerakli jihozlar" modeli** (position_equipment) | positions jadvalida equipment ustun yo'q, jadval yo'q | Kichik (1 jadval + UI) |
| **HR→oshxona** (xodim ovqat allokatsiya/talon) | mro_canteen_logs faqat aggregate, xodim FK yo'q | Kichik-o'rta |
| **CC→Kanban ko'prigi** (CcDocument→avto-karta) | Hech qanday listener cc_documents→kanban | Kichik (1 listener, OrderCreatedEvent naqshi bor) |
| **Kanban→Kassir oqimi** (pul-vazifa) | Grep 0 | Kichik-o'rta |
| **gl_posting_log jadvali** (POS GL listener yozadigan) | Jadval umuman yo'q | Kichik (1 jadval) |
| **Xodim shtrix/QR badge** | employees jadvalida barcode ustun yo'q (matn kod bor) | Kichik (POS scanner infra qayta ishlatish) |

### 4B. 🟡 TO'LDIRISH KERAK (kod bor, lekin DATA yo'q / config bo'sh / seed yo'q)
| Narsa | Holat | Ish |
|---|---|---|
| **Ombor 5-bosqich pipeline** | KOD+WIRED, lekin 2 movement pending'da qotgan | 1 EXTERNAL_IN ni oxirigacha haydash (DRAFT→KARANTIN→QC→COMPLETED) |
| **MES sex/marshrut** | CRUD real, lekin 0 sex/0 marshrut | Flekso/Ofset = 2 qator seed; marshrut = `return 0` tuzatib seed |
| **CC hujjat oqimi** | Backend+seed (14 shablon) bor, cc_documents=0 | 1 hujjat uchidan-uchiga + PIN onboarding + manager_id to'ldirish |
| **3 IoT sensor** | Schema tayyor (type/unit/min-max), 8 jadval 0 qator | 3 sensor seed + ingest yo'lini ulash |
| **AI** | 158 route real, hamma AI jadval 0 | Claude bilan jonli sinash + Gemini/OpenAI kalit |
| **HR/profil/payroll** | 20+ tab + endpoint real, 0 shartnoma/0 asset | Data to'ldirish (qurilish bosqichi) |
| **gl_account_mappings** | Jadval bor, hardcode ishlatiladi, 0 qator | Mapping seed + real o'qish |

### 4C. 🔧 TUZATISH KERAK (kod bor, lekin BUZUQ — drift/bug/noto'g'ri ulanish)
| Narsa | Bug | Ish |
|---|---|---|
| **106 endpoint 503** | DB drift (12 jadval yo'q + ustun + FK tur) | Drift migratsiya (DDL) |
| **14 STUB-FAKE-CREATE** | POST DB'ga yozmaydi (`{id:Date.now()}`) | Real insert yoki 501 |
| **employees.user_id NULL** | 30/30 NULL → CC/telegram uziladi | user_id to'ldirish yoki kanonik id |
| **Material bo'linish** | mm/materials→materials(0), ombor→material_cards(21) | Kanonikga yo'naltirish |
| **MES 4 drift bug** | mes_downtime_events/mes_material_consumption jadval yo'q | Jadval yarat yoki to'g'ri jadvalga |
| **Sensor YOZISH** | RecordSensorReadingHandler DB'ga yozmaydi | saveReading()ga ulash |
| **IoT WebSocket** | IotGateway provider emas + chaqiruvchi yo'q | Providerga qo'shish + ingest'da push |
| **AI vision-QC/prepress** | Rasmni URL matn sifatida yuboradi (ko'rmaydi) | Real base64 (analyze_camera_feed naqshi) |
| **Lavozim Portret backend** | STUB (saqlamaydi) | org_node_portret JSONB jadval |
| **jonli stok event** | StockUpdatedEvent chiqarmaydi | warehouse-config.service'ga event qo'shish |

### 4D. ✅ KONVERGENSIYA (nazorat ostida refactor — runtime bug emas, qarz)
- 2 yozuv-yo'li → 1 kanonik repo (CRM crm_deals isboti)
- 2 schema olami → 1 (~95 repo ko'chirish)
- compatibility monolit (14819 satr) → domen modullariga taqsim
- 69 DEAD jadval + 154 dublikat pgTable + 94 dublikat ombor sahifa tozalash
- AI 4 modul + 2 "agent" tizimi konsolidatsiya

> **XULOSA:** Egasi vizyonining ~70%i **allaqachon kod-darajada qurilgan** (4A noldan-qurish ro'yxati nisbatan qisqa). Asosiy ish **4B (to'ldirish) + 4C (tuzatish) + 4D (konvergensiya)** — ya'ni mavjud dvigatelni ulash va jonlashtirish.

---

## 5. KRITIK BUGLAR (darhol e'tibor — ma'lumot yo'qotish / sahifa buziladi)

| # | Bug | Joy | Oqibat |
|---|---|---|---|
| B1 | **14 STUB-FAKE-CREATE** — POST qabul qiladi, DB'ga yozmaydi | `finance/payments`, `inventory/materials`, `hr/recruitment/vacancies`, `design/orders`, `pp/routing`(`return 0`) +9 | **Sukutda ma'lumot yo'qoladi** — FE "saqlandi" deydi, hech narsa saqlanmaydi (agent1 §4.2) |
| B2 | **106 endpoint 503 (DB drift)** | 12 jadval yo'q + ustun + FK tur | Modul "ishlamaydi" effekti; employee-kpi/employee-files 100% buzuq (agent5 §3) |
| B3 | **Sensor YOZISH DB'ga yozmaydi** | `RecordSensorReadingHandler` aggregate-only, `saveReading()` o'lik | `POST devices/:id/readings` UUID qaytaradi lekin yozmaydi (Qoida 10 buzilishi) (agent11 §3.4) |
| B4 | **Anomaliya DB'ga yozilmaydi** | `AnomalyDetectedHandler` faqat log | iot_alerts hech qachon to'lmaydi (agent11 §3.5) |
| B5 | **4 ta MES drift bug → 500** | `mes_downtime_events`/`mes_material_consumption`/`operator_certifications` jadval yo'q + shift-handover/evaluation VIEW ustun yo'q | Tegishli POST/PATCH 500 beradi (agent10 §2,§12) |
| B6 | **4 ta error-handler bug → 503** | `/pp/bom`, `/pp/mps`, `/sd/orders/export`, `/finance/ratios` — `undefined.message`/`.getValue()` | Ochishda darhol 503 (null-guard yo'q) (agent5 §4) |
| B7 | **`/wms/dashboard` BUZUQ** | WMSDashboard — ErrorBoundary "Xatolik yuz berdi" | Yagona tasdiqlangan buzuq sahifa (agent3 §3, agent6 §11) |
| B8 | **`/inventory/materials` BO'SH** | 21 material bor, "Material topilmadi" (0) | materials(0) o'qiydi, material_cards(21) emas (agent3, agent6 §5) |
| B9 | **routing yaratish `return 0`** | `pp-routing.controller.ts:78` servisni chetlab o'tadi | Marshrut yaratish hech narsa qilmaydi → 0 marshrut (agent10 §4) |
| B10 | **employees.user_id NULL (30/30)** | CC MANAGER_OF_SENDER (14 shablon 1-qadami) har doim xato | Hech bir CC hujjat birinchi inboxga yetmaydi (agent9 §3.5, agent12 §11) |
| B11 | **CC autoSend ishlamaydi** | `cc-event.listener.ts:97` autoSend=true bo'lsa ham draft'da qoladi | Boshqa modullar CC'ga real hujjat yubora olmaydi (agent9 §3.12) |
| B12 | **Stock reservation casing bug** | `reserve()` `'active'` yozadi, `cancel()` `'ACTIVE'` tekshiradi | Bron bekor qilinmaydi (0 qator bo'lgani uchun hozir bilinmaydi) (agent6 §7) |
| B13 | **reference-image-compare cron buzuq** | `fileUri` ichki URL Gemini'ga ishlamaydi + kalit nomi noto'g'ri | Kalit qo'shilsa ham ishlamaydi (agent15 §8) |

> **Eng kritik:** B1 (ma'lumot yo'qotish) va B2 (106 endpoint o'lik). Bular FE'da "ishlaydi" ko'rinadi, lekin amalda ishlamaydi → egasining "ishlamayotgandek" tuyg'usining texnik manbai.

---

## 6. INTEGRATSIYA XARITASI (modullararo oqim)

Egasi vizyonining 11 bog'lanishi (agent4 dan, kod+DB dalili bilan):

```
✅ ISHLAYDIGAN ZANJIRLAR (kuchli):
  [CRM] mark-deal-won → DealWonEvent ──┬──► [Notifications] ✅
                                       └──► [SD] → CreateOrderCommand → OrderCreatedEvent ──┬──► [Kanban] karta INSERT ✅
                                                                                            ├──► [Logistics] ✅
                                                                                            └──► [Notifications] ✅
  [SD] advance-payment → AdvanceApprovedEvent ──► [SD] fan-out (5 bo'lim job) ✅ (backend isbot)
       ⚠️ LEKIN: sd_order_departments=0 (UI yo'q) → jonli fire bo'lmaydi
  [Org-sxema] org_departments(142) ──► procurement-approval-chain (rekursiv CTE) ✅
  [QC] QcPassedEvent ──► [WMS] receiveFg ✅ ; SupplierFailEvent ──► [MM] ✅
  [POS Monitor] issue/receive ──► warehouse_stock + material_movements(3) ✅ (sinxron, event emas)
  [HR] payroll-closure ──► gl_journal_entries INSERT ✅ (jonli 0)

❌ UZILGAN ZANJIRLAR (vizyon yuragi):
  [POS jonli stok] ──✗──► StockUpdatedEvent CHIQARMAYDI ──✗──► [WMS] ROP avto-reorder (U3)
       (warehouse_transactions=0 vs material_movements=3 = isbot)
  [MES] complete ──► MesCompletedEvent ──► [QC] mes-completed.listener ⚠️ NO-OP (faqat log) (U5)
       (MES→QC tekshiruv ochish o'rta bo'g'in yo'q)
  [CC] ──✗──► [Kanban] ko'prik UMUMAN YO'Q (U1) ; CC bo'sh (cc_documents=0)
  [Kanban] ──✗──► [Kassir] oqim YO'Q (U2) ; kassir=retail POS
  [POS] pos-gl-auto.listener ──✗──► gl_posting_log (0 publisher + JADVAL YO'Q) (U4,U6)
  [SD] ──✗──► SoSampleRequested/SoDesignRequested (0 publisher) → QC/Design kirish DEAD (U4)
  [Tech] ──✗──► TechThreeCheckpointEvent (0 publisher) → avans avto-tetik yo'q
  [HR] offboarding_cases(3) ──✗──► [POS] O'QIMAYDI → access-block yo'q (U9)
  [AI] o'qiydi/hisoblaydi ──✗──► avto-so'rov yaratmaydi (U8: 2 P2P bo'lingan)

KONFIG/TETIK BO'SH (kod bor, ishga tushmaydi):
  sd_order_departments=0 · inventory_policy=0 (ROP) · cc_documents=0 · employees.manager_id=0
  · gl_journal_entries=0 · domain_events=0 (outbox) · warehouse_transactions=0
```

**Integratsiya diagnozi (agent4):** 3 ta raqobatlashuvchi event mexanizmi (CQRS EventBus + EventEmitter2+ERP_EVENTS + xom string); EventBridge (37 yozuv) faqat **bir tomonlama** (CQRS→string). Natija: zanjirlar **alohida bo'g'inlar sifatida qurilgan, lekin uchlari ulanmagan** — eng kuchli backend spine (fan-out, org-tasdiq) UI'siz; jonli yo'llar (POS stok) integratsiya hodisasini chiqarmaydi; CC↔Kanban/Kanban↔Kassir umuman yo'q.

**Yagona raqam:** Integratsiya **kod-darajada ~46%** (5.05/11), **jonli-oqim ~15-20%**.

---

## 7. TAVSIYA ETILGAN ISH TARTIBI (FAQAT TAVSIYA — bajarilmadi)

> Bu **tavsiya** — egasi qaroriga qoldiriladi. Tartib: eng katta ta'sir / eng kam kuch nisbati bo'yicha.

### Bosqich 0 — Asos tozalash (tez yutuq, 1-2 kun)
1. **14 STUB-FAKE-CREATE'ni tuzatish** (B1) — real insert yoki 501. Eng kritiki: payments/materials/vacancies. Sukut ma'lumot yo'qotishni to'xtatadi.
2. **DB drift migratsiya** (B2/P3) — 12 jadval CREATE + yetishmagan ustun ADD + FK tur uuid↔int birlashtirish. 106 endpoint tiriladi. (Memory "migration kerak emas" deydi, lekin bu DATA emas, STRUKTURA drifti — DDL zarur.)
3. **employees.user_id to'ldirish** (B10/P8) — CC resolver + telegram + profil↔org tiriladi.

### Bosqich 1 — Kassir-hub (eng muhim yetishmovchilik, P2)
4. "Kassa" sahifasini **kassir-hub**ga aylantirish: smena, naqd kirim/chiqim, oylik/avans tarqatish, podotchet/qarz ko'rinishi — mavjud `payroll_advances` + `employee_inventory_ledger` + `cash_*` jadvallariga ulash (dvigatel qismlar bor).
5. Chakana POS'ni alohida "Retail" moduliga ko'chirish (kassirdan ajratish).
6. Avans backend'iga FE sahifa (API tayyor: `finance/advances/*`).

### Bosqich 2 — Integratsiya oqimini ulash (vizyon yuragi, P1)
7. **Jonli stok yo'lini** (`warehouse-config.service`) `StockUpdatedEvent` chiqaradigan qilish → ROP+GL jonlanadi (U3).
8. **gl_posting_log jadvalini yaratish** + POS GL'ni `PosMovementCompletedEvent` publish qilib jonlantirish, GL ledger'ni birlashtirish (U4,U6).
9. **CC→Kanban ko'prigi** (CcDocument tasdiqlangach Kanban karta, OrderCreatedEvent naqshi) + boshqa modullardan CC'ga publish (U1).
10. **MES→QC avto-inspection** ochish (PP callback yoki QcOpenInspection) (U5).

### Bosqich 3 — Modullarni jonlashtirish (to'ldirish, P4)
11. **Ombor 5-bosqich pipeline**ni 1 EXTERNAL_IN bilan oxirigacha haydash (isbot).
12. **CC**: PIN onboarding + manager_id + 1 hujjat uchidan-uchiga (B10,B11).
13. **MES**: Flekso/Ofset sex seed + routing `return 0` tuzatib seed; sexma-sex handover endpointlarini real qilish (P5).
14. **IoT**: 3 sensor seed + ingest ulash (B3) + anomaliya persist (B4) + WebSocket ulash; operator akkaunt (login imkonsizligini hal qilish).
15. **Kanban**: maxfiylik (org_department_id + getBoards scoping) + 3-Savat mock→real CC (P6); test-axlat tozalash.

### Bosqich 4 — Sifat / IA / konvergensiya (P10)
16. **Material bo'linishni tuzatish** (mm/materials→material_cards) (P9/B8).
17. **94 ombor sahifa → ~12**; /wms/dashboard tuzatish (B7); POS SPA raw-kalit i18n.
18. **Lavozim Portret backend** (org_node_portret JSONB) + "kerakli jihozlar" model.
19. **AI**: Gemini env nomi birlashtirish + vision real base64 + 5 stub yopish (agent15 §13).
20. **Konvergensiya** (nazorat ostida): 2 yozuv-yo'li→1, 2 schema→1, compatibility taqsim, 69 DEAD tozalash, AI 4 modul konsolidatsiya.

### Hardening (production'dan oldin, bloker emas)
21. OTP per-session attempt-cap + JWT alg-pin + JWT secret rotatsiya + website yozish rol-gate (agent13 §9).

---

## 8. UMUMIY XULOSA — TIZIM NECHA % TAYYOR (vizyonga)

### 8.1 Ikki xil raqam (ikkalasi ham to'g'ri)

| O'lcham | % | Ma'no |
|---|---|---|
| **Texnik / kod-skelet tayyorligi** | **~75-80%** | Backend (91% real endpoint), FE (90% render), tsc 0, xavfsizlik A−, arxitektura B−/C+. Ulkan, mustahkam qurilma. |
| **Egasi vizyoni (operatsion oqim) bajarilishi** | **~30-35%** | Modullar alohida ishlaydi, lekin integratsiya uzilgan, DB 88% bo'sh, kassir/sexma-sex/CC-oqim yo'q yoki soxta. |

### 8.2 Nega bu farq (egasiga sodda til)

> **Sizning ERP'ingiz — juda yaxshi qurilgan, lekin hali yo'lga tushmagan zavod.** Binolar (modullar) qad rostlagan, mashinalar (dvigatellar — Ombor, CRM, AI algoritmlar, org-sxema) o'rnatilgan va sifatli. LEKIN: (1) konveyer lentalari (modullararo oqim) ulanmagan — bir sex mahsulotni keyingisiga avtomatik o'tkazmaydi; (2) bitta muhim sex (kassir-hub) noto'g'ri qurilgan (do'kon kassasi qilingan); (3) zavod hali ishlab chiqarishni boshlamagan (DB 88% bo'sh — hech bir to'liq sikl haydalmagan); (4) ba'zi mashinalarda nosozlik (106 endpoint 503, 14 fake-create ma'lumot yutadi).
>
> Shuning uchun har bir sexni alohida ko'rsangiz "ishlaydi", lekin butun zavodni bir oqim sifatida ishga tushirsangiz — to'xtaydi. Bu **"ballonsiz mashina"** — dvigatel bor va quvvatli, lekin g'ildirak (oqim) ulanmagan.

### 8.3 Yaxshi xabar

Egasi vizyonining **~70%i allaqachon kod-darajada mavjud** (4-bo'lim). Asosiy ish — **noldan qurish EMAS**, balki:
- **Ulash** (integratsiya oqimi, CC→Kanban, Kanban→Kassir, stok→event),
- **To'ldirish** (DB seed + pipeline'larni jonli haydash),
- **Tuzatish** (106 drift, 14 fake-create, employees.user_id, material bo'linish),
- **Konseptni to'g'rilash** (kassir-hub).

### 8.4 Yagona raqam

**Tizim texnik jihatdan ~78% qurilgan, lekin egasi vizyoni (ishlaydigan, ulangan, jonli tizim) bo'yicha ~30-35% tayyor.** Ikkalasi orasidagi farq = **integratsiya + jonlashtirish + bir nechta tuzatish** — bu mavjud ulkan asos ustida nisbatan boshqariladigan ish (noldan qurish emas).

---

## 9. MANBALAR (15 agent + asos hujjatlar)

| Agent | Mavzu | Asosiy raqam |
|---|---|---|
| agent1 | Backend endpointlar | 344 controller, 2961 endpoint, 90.6% real, 274 stub, 14 fake-create |
| agent2 | DB jadvallar | 953 base + 80 view, 88% bo'sh, 75 VIEW-alias, 69 DEAD |
| agent3 | Frontend sahifalar | 441 route, ~280 sahifa, ~62% tayyor, 1 buzuq |
| agent4 | Integratsiya | 11 bog'lanish 5.05/11, kod ~46%, jonli ~15-20% |
| agent5 | Umumiy sog'liq | 949/1192 GET=200, 106×503, BE+FE tsc 0 |
| agent6 | Ombor moduli | ~62% kod / ~25% jonli, 94 sahifa dublikat |
| agent7 | Kassir/moliya | ~12-15%, konsept xato (retail POS) |
| agent8 | Kanban | ~55%, 3-savat mock, maxfiylik 0% |
| agent9 | Kommunikatsiya | ~40%, cc_documents=0, 2 parallel tizim |
| agent10 | MES/ishlab chiqarish | ~30-35%, 0 sex/marshrut, sexma-sex stub |
| agent11 | IoT/sensor/tablet | ~25-30%, sensor o'qish real/yozish stub |
| agent12 | HR/org-sxema | ~55-60%, org-tree real, user_id NULL |
| agent13 | Xavfsizlik | A−/B+, 2 teshik yopiq, faqat hardening |
| agent14 | Arxitektura | B−/C+, 2 yozuv-yo'li, 2 schema olami |
| agent15 | AI modullar | ~35%, faqat Claude tirik, 14 agent→5 AI |

**Asos hujjatlar:** `ombor-pos-master-plan.md` (vizyon, 74+ savol), `asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md` (11 nuqta), `ombor-jadvallari-inventarizatsiya-2026-06-02.md`, `ombor-dizayn-dublikat-tahlil-2026-06-02.md`, `iot-tablet-asl-holat-2026-06-02.md`, `security-pentest-2026-06-01.md`, `communication-center-roadmap.md`.

---

*Yakuniy sintez: agent16-yakuniy · 2026-06-02 · FAQAT read-only — hech narsa o'zgartirilmadi.
15 agent hisoboti + 9 asos hujjat o'qildi va birlashtirildi. Har raqam manba agentdan; ziddiyatlar
(masalan integratsiya "kod ~46% vs jonli ~15%") ikkala raqam bilan saqlandi (verify-don't-trust).*
