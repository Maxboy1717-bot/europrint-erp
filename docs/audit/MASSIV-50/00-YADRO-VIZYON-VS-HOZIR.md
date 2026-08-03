# YADRO: VIZYON vs HOZIRGI HOLAT — 4 ta asosiy soha

**Sana:** 2026-06-19
**Qamrov:** OMBORLAR (WMS) · POS Monitor · ISHLAB CHIQARISH (MES + PP) · KASSIR (Moliya ichida)
**Maqsad:** Egasi (owner) vizyoni bilan jonli koddagi haqiqiy holatni yonma-yon, halol solishtirish.
**Tekshirildi:** Asosiy da'volar jonli kodga qarshi solishtirildi (OEE formulasi, sessiya jadval ikkilanishi, kassir yo'qligi, POS kassa apparatining noto'g'ri joylashuvi, MES→POS tinglovchi yo'qligi) — barchasi tasdiqlandi.

---

## 0. UMUMIY XULOSA (yadro qanchalik tayyor)

| Soha | Tayyorlik bahosi | Bir qatorli hukm |
|------|:---:|------|
| **OMBORLAR (WMS)** | **~30–35% (C−)** | Skelet bor (warehouse_stock kanonik, bins/zones/batch_lots, barcode, FEFO so'rovi, QC tinglovchi, 40+ FE marshrut), ammo 3 ta eng muhim zavod-funksiyasi (rulon-karta, karantin GATE, FIFO/FEFO chiqim) UMUMAN YO'Q; GL faqat sxemada; dashboard qattiq yolg'on (hardcoded). |
| **POS Monitor** | **~40–45% (C)** | Harakat holat-mashinasi, warehouse_stock ulanishi, GL subledger, karantin, barkod, offline navbat, Telegram qobiq bor — lekin egasining asosiy "override"lari (texkarta bloki, majburiy foto, 2-imzo) va MES/pres-kirim/SCRAP_IN/storno UMUMAN YO'Q; retail kassa apparati hamon noto'g'ri shu modulda; kanonik GL bo'sh DB'da jimgina ishlamaydi. |
| **ISHLAB CHIQARISH — MES** | **~30–35% (C−)** | Sessiya CRUD + IoT planshet amallari real, MesCompletedEvent chiqariladi — lekin OEE formulasi matematik buzuq (doim 100/100), sessiya jadvali ikkita jonli olamga bo'lingan, 3-bosqich yo'q, TB checklist no-op, A/B/C smena yo'q, 'operator' roli IOT_READ'da yo'q (operatorlar 403 oladi), stanok master-data seed qilinmagan. |
| **ISHLAB CHIQARISH — PP** | **~40% (C)** | MRP matematikasi real ishlaydi, CRP real, texkarta CRUD lab-gate bilan bor, PP→MES sessiya ochish ulangan — lekin 7-bosqichli holat tsikli faqat 5 ta status, frozen zone/prioritet/ZARUR zona yo'q, AI 7-qadamli planner yig'ilmagan, gofra/sloy formulasi (MM'da) PP BOM tomonidan chaqirilmaydi, "A smena reja" jadvali yo'q. |
| **KASSIR (Moliya)** | **~5–10% (D−)** | Deyarli qurilmagan. Faqat umumiy GL posting (insertJournal→entries, atomik, real) va FP-tsikl cron skeleti ishlaydi; har bir kassir-funksiyasi (smena ochish/yopish, PIN, har-som-hisobli qarz, podotchet hayot-tsikli, chek-AI, kunlik PDF, oylik→kassir→PIN) 0%; FE "Kassa" sahifasi retail kassa apparati, vizyondagi kassir-hub EMAS. |

> **Yagona muhim haqiqat:** kod _strukturaviy_ jihatdan ko'p joyda mavjud (jadvallar, modullar, marshrutlar), lekin _biznes-majburlash darvozalari_ (gates) — ya'ni modulning haqiqiy qiymatini beradigan qoidalar — ko'pincha yo'q yoki no-op. Bo'sh DB bu holatni yashiradi: ko'p narsa "ishlayaptiganday" ko'rinadi, chunki tekshiradigan ma'lumot yo'q.

---

## 1. OMBORLAR (Warehouses / WMS)

### QANDAY BO'LISHI KERAK / HOZIR QANDAY / FARQ

| # | QANDAY BO'LISHI KERAK | HOZIR QANDAY | FARQ (jiddiylik) |
|---|------------------------|--------------|------------------|
| 1 | 7 kanonik ombor turi seed qilingan va majburlanadi (Rulon qog'oz, Tayyor mahsulot+ijara, Hom-ashyo, Xo'jalik, Jihozlar, Makulatura/brak, Asbob-uskunalar) | `warehouses` jadvali CHECK bilan 20+ tur variantini qamraydi; `warehouseTypes` config jadvali bor — ammo 7 kanonik tur uchun SEED yo'q; enum aralash registr ('main' VA 'MAIN' ikkalasi ham) | **O'RTA** — sxema bor, master-data yo'q |
| 2 | **Rulon-karta entity**: noyob ID, QR avto-chop, kenglik, diametr, gramaj, og'irlik, AI uzunlik = og'irlik/(gramaj×kenglik), namlik%, status; IoT skan ish boshlanishidan oldin texkartaga tekshiradi | **Maxsus rulon-karta jadvali UMUMAN YO'Q**; `paper_rolls` faqat CHECK ichidagi tur satri; IoT skan endpoint bor lekin gramaj↔texkarta tekshiruvi yo'q | **KRITIK** — eng qimmat ombor turining nol maxsus ishlovi |
| 3 | Strukturali manzil A-12-3-2 (Zona→Qator→Javon→Yacheyka), bo'sh slot avto-taklif | `warehouseBins` jadvalida zone/row/shelf/level ustunlari bor, bins CRUD bor — lekin A-12-3-2 birlashtirilgan formatter yo'q, avto-taklif yo'q | **O'RTA** — faqat ma'lumot modeli |
| 4 | Harakat raqami HOM-KIRIM-2026-00001 (tur+amal+yil+ketma-ketlik) | `move_number`/`transfer_number`/`document_number` maydonlari bor — lekin ketma-ketlik generatori yoki format YO'Q; raqamlar ad-hoc | **YUQORI** — generator yo'q |
| 5 | **Kirim 5-bosqich**: DRAFT→KARANTIN→QC(PASS/REWORK/REJECT)→ASOSIY; har tashqi kirim avval karantinga; ±2% avto-qabul, undan yuqori menejer tasdig'i+majburiy sabab; gramaj falsa karantin blok | Kirim sehrgar sahifasi bor; `qc-passed.listener` QcPassedEvent'ni tinglab `receiveFg()` chaqiradi — lekin **5-bosqich KARANTIN GATE yo'q**: holat-mashinasi yo'q, ±2% tekshiruvi yo'q, majburiy foto yo'q; karantin sahifasi faqat UI, BE majburlash yo'q | **KRITIK** — kirim to'g'ridan-to'g'ri warehouse_stock'ga, QC darvozasiz |
| 6 | Chiqimda FIFO/FEFO majburlanadi; partiya-har-kirim oldinga/orqaga kuzatuvchanlik; muddati o'tganda BLOK | `fefo-stock.handler` FEFO so'rovi qiladi — lekin chiqim yo'li (`goods-issue.handler`) **FEFO partiya tanlashni majburlamaydi**: `issueFromWarehouseStock` faqat agregat miqdorni kamaytiradi; batchMovements sxemasi chiqim buyrug'iga ulanmagan | **KRITIK** — partiya kuzatuvchanlik faqat sxema |
| 7 | Overflow mantiq: bo'lim ichki omborlari (DEPARTMENT_*) asosiy ombordan +/− farqni kuzatadi; AI buyurtma narxiga taqsimlaydi | `departmentWarehouseMap` jadvali bor — overflow xizmati, +2kg delta yozish, AI ikki-ombor taqsimoti YO'Q | **YUQORI** — yo'q |
| 8 | Gofra-qatlam nomuvofiqlik bloki + chiqimda texkarta material mosligi bloki; EXTERNAL_OUT chegaradan yuqori 2-imzo | Vizyon hujjatlarida bor, lekin **kodda UMUMAN yo'q** | **KRITIK** — P0 xavfsizlik funksiyasi (noto'g'ri material ishlab chiqarishga ketmasligi) |
| 9 | Inventarizatsiya: tsiklik (A-haftalik, B-oylik, C-yillik), ko'r-sanash (operator tizim balansini ko'rmaydi), ±1% avto-tuzatish, zona muzlatish | `inventory-counts` endpointlar bor — lekin **ikki jadval ishlatiladi** (`inventory_counts` ╳ `wms_inventory_counts` = drift); ko'r-sanash, zona-muzlatish, ABC chastota YO'Q | **YUQORI** — drift + majburlash yo'q |
| 10 | Tayyor mahsulot: MES tugashi avto FG kirim; AI kamera har chiqim; ijara 30 kun bepul keyin kunlik m² MENEJERGA yoziladi; lahtak (qoldiq) javobgar shaxsga | `qc-passed.listener` FG'ni qabul qiladi (ishlaydi); `warehouseRentalRecords` jadvali managerId/areaM2/dailyRate bilan bor (sxema darajasida); **lahtak jadvali/xizmati YO'Q**; AI kamera: exitLogs'da photoPath bor lekin haqiqiy integratsiya yo'q | **YUQORI/O'RTA** — ijara sxemada, lahtak butunlay yo'q |
| 11 | **Kassir-bog'lanish**: xodim olgan har bir mol/pul uning profiliga qarz; mol omborga kirim bo'lganda yopiladi; profil: jami olgan/maqsad/tasdiqda/qarz | `procurementRequests` bor — lekin **employee_debt jadvali YO'Q**, WMS↔Moliya↔HR o'zaro bog'lanish YO'Q | **YUQORI** — faqat sxema-orzu |
| 12 | Kirim/chiqim/inventar farqida GL avto-posting kanonik `entries` jadvaliga, atomik | `stockMovementGLPostings` jadvali bor — lekin uni to'ldiradigan **xizmat YO'Q**; `entries` WMS'dan hech qanday posting olmaydi | **YUQORI** — faqat sxema, runtime yozuvchi yo'q |
| 13 | Kunlik CRON: balans+harakatlar+signal CC/Telegram; AI dinamik min/max; reorder'da avto PR | `wms-eoq.service` bor; `rop-trigger.handler` bor — lekin **kunlik stok CRON yo'q**, taqchillik signali CC/Telegram'ga yo'q | **O'RTA** |
| 14 | To'liq audit jurnal (7-yil immutable), PDF aktlar, 2-imzo QR blank, ERP login = imzo | `AuditInterceptor` ko'p controllerlarda bor; lekin 7-yil saqlash, PDF aktlar, QR blank YO'Q; WMS'da PDF xizmati yo'q | **O'RTA/PAST** |
| 15 | Excel-ko'rinishidagi jadval (karta emas), EP Linear Soft dizayn, --mod-wms-* rang | FE'da 40+ marshrut bor, lekin `getDashboard()` **qattiq yolg'on stub** qaytaradi {totalItems:0,...}; integration endpointlar 501 | **O'RTA** — yashil yolg'on |
| 16 | Op-kod EP-WMS-### REGISTRY.md'ga | Hujjatlarda bor, lekin kodda **EP-WMS pattern topilmadi** | **O'RTA** |
| 17 | Barkod ota-bola ierarxiyasi FIFO tanlovni boshqaradi | `materialBarcodes` bor lekin parentId/hierarchyPath ustuni YO'Q; skan chiqimda FIFO'ni majburlamaydi | **PAST** |

**Tasdiqlangan kodda:** `get-oee` mavzusiga aloqasi yo'q — bu yerda asosiy 3 kritik bo'shliq jonli kodga qarshi tasdiqlandi: rulon-karta jadvali yo'q, karantin holat-mashinasi yo'q, `issueFromWarehouseStock` partiya tanlamaydi.

**Hukm:** WMS ~30–35%. Infratuzilma skeleti mustahkam, lekin uchta eng kritik zavod-funksiyasi (rulon-karta, karantin gate, FIFO/FEFO chiqim) butunlay yo'q; GL faqat sxema; kassir-bog'lanish va overflow yo'q; dashboard qattiq yolg'on.

---

## 2. POS Monitor (zavod ombor planshet ilovasi)

> **DIQQAT:** POS Monitor = zavod ombor planshet ilovasi (kirim/chiqim/inventar). Bu KASSA APPARATI EMAS. Pul Moliya moduliga tegishli.

### QANDAY BO'LISHI KERAK / HOZIR QANDAY / FARQ

| # | QANDAY BO'LISHI KERAK | HOZIR QANDAY | FARQ (jiddiylik) |
|---|------------------------|--------------|------------------|
| 1 | Yagona zavod ombor planshet ilovasi (kassa apparati EMAS) | BE modul ~100 fayl bilan strukturaviy mustahkam | **OK (struktura)** |
| 2 | Harakat turlari: EXTERNAL_IN (5-bosqich), EXTERNAL_OUT (3-bosqich), INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE | Enum to'g'ri: EXTERNAL_IN/OUT, INTERNAL_*, DAMAGE, INVENTORY_ADJ_+/− | **OK** |
| 3 | Kanonik stok = warehouse_stock; current_stock = VIEW; GL = entries, harakat tugashida FIFO narx bilan avto-posting | `processCompletedMovement` warehouse_stock'ga to'g'ri yozadi (upsert/decrement); GL_PAIRS → gl_posting_log → Finance tasdiqlab `entries`'ga ikki-bosqich | **OK (asosiy yo'l)** |
| 4 | **Texkarta guard (EP-POS-032)**: INTERNAL_ISSUE'da skan material texkartaga mos kelmasa QATTIQ BLOK; faqat smena_boshlig'/reja_rahbar override | `lifecycle-block.service` `min_interval_days` (qayta-berish oralig'i) tekshiradi — bu **texkarta mosligi EMAS**; texkarta guard YO'Q | **KRITIK** — semantik jihatdan boshqa narsa |
| 5 | **Majburiy foto (EP-POS-069)**: shikast/brak/katta farqda planshet kamera majburiy, fotosiz davom etib bo'lmaydi | FE'da fayl input bor — lekin BE'da DAMAGE harakatini fotosiz **bloklash yo'q**; foto ixtiyoriy | **KRITIK** — qattiq blok (422) bo'lishi kerak |
| 6 | **2-imzo PDF akt (EP-POS-050)**: beruvchi+oluvchi imzosi | PDF'da imzo qatorlari bor — lekin BE ikki haqiqiy imzolovchini **majburlamaydi** | **YUQORI** |
| 7 | MES→POS FG kirim: MesSessionCompletedEvent → POS tinglovchi FG_FROM_MES harakatini yaratadi (QC'siz) | **Tinglovchi UMUMAN YO'Q** (grep tasdiqladi) — FG ombor MES'dan avto-to'lmaydi | **KRITIK** — nol-tinglovchi no-op |
| 8 | Pres-kirim tez yo'l: operator kg kiritadi → barkod chop → ERP avto WIP kirim (tasdiqsiz) | **UMUMAN YO'Q** (grep tasdiqladi) — 501 stub ham yo'q | **KRITIK/O'RTA** — funksiya yo'q |
| 9 | SCRAP_IN harakat turi (makulatura) — owner spec kelguncha 501 stub | Enum'da YO'Q, 501 stub ham yo'q | **O'RTA** |
| 10 | Storno (tasdiqlangan harakatni teskari qilish, original o'zgarmas) | **UMUMAN YO'Q** (grep tasdiqladi) — tasdiqlangan harakatni bekor qilish ishlanmaydi | **YUQORI** |
| 11 | Barkod: USB/Bluetooth skaner asosiy + ZXing.js kamera fallback | useBarcode hook USB/BT'ni ushlaydi; kamera `BarcodeDetector` Web API ishlatadi (faqat Chrome, Android planshetlarda ishonchsiz) — **ZXing.js YO'Q** | **O'RTA** — noto'g'ri texnologiya |
| 12 | FEFO chiqim (bo'yoq/kley), boshqalarga FIFO; harakat tugashida lot tanlash | `pos-fifo.service` bor — lekin `processCompletedMovement` uni **chaqirmaydi** (oddiy upsertStockIn) | **O'RTA** — xizmat bor, ulanmagan |
| 13 | Offline PWA: IndexedDB navbat, conflict→needs-review | `useOfflineSync` 3 store bilan ishlaydi, 409 conflict aniqlash, qo'lda hal qilish | **OK** |
| 14 | Telegram Mini App: Telegraf.js, skan/harakat/tarix/tasdiq | `pos-telegram.service` HMAC validatsiya, Redis sessiya, sendAlert bor | **OK (qobiq)** |
| 15 | GSD metrikalar (3 ta) HR org-kartaga | **Kod YO'Q** (grep tasdiqladi) | **YUQORI** |
| 16 | AI anomaliya (g'ayritabiiy soat/me'yordan ortiq miqdor) → menejer | **Kod YO'Q** | **O'RTA** |
| 17 | Kassa apparati Moliyada bo'lishi kerak (POS'da EMAS) | `cash-register.controller/service/repository` hamon **POS modulida** (retail_pos_transactions); noto'g'ri domen | **YUQORI** — noto'g'ri joylashuv |

**Tasdiqlangan kodda:** MES→POS tinglovchi (FG_FROM_MES/MesCompletedEvent), pres-kirim, SCRAP_IN, storno — barchasi grep bilan POS modulida **yo'qligi tasdiqlandi**. `cash-register.*` POS modulida joylashgani tasdiqlandi.

**Hukm:** POS Monitor ~40–45%. Holat-mashinasi, warehouse_stock ulanishi, GL subledger, karantin, barkod, offline navbat, Telegram qobig'i bor — lekin egasi asosiy override'lari (texkarta blok, majburiy foto, 2-imzo), barcha MES/pres-kirim/SCRAP_IN flow'lar, storno, GSD, AI anomaliya YO'Q; retail kassa kodi noto'g'ri shu yerda; kanonik GL bo'sh DB'da jimgina ishlamaydi.

---

## 3. ISHLAB CHIQARISH — Production (MES + PP)

> **DIQQAT:** Ishlab chiqarish omborni TO'LDIRADI: MES tugatadi → tayyor mahsulot (FG) → WMS qabul qiladi → POS Monitor planshetida ko'rinadi. Bu zanjir hozir uzilgan (MES→POS tinglovchi yo'q, §2.7).

### 3A. MES — QANDAY BO'LISHI KERAK / HOZIR QANDAY / FARQ

| # | QANDAY BO'LISHI KERAK | HOZIR QANDAY | FARQ (jiddiylik) |
|---|------------------------|--------------|------------------|
| 1 | Yagona kanonik sessiya jadvali (production_sessions 34-ustun ╳ mes_sessions 13-ustun hal qilinishi) | **IKKI JADVAL JONLI** — har ikkisiga ham yoziladi/o'qiladi; kanonik qaror yo'q | **KRITIK** — jonli ikki-olam (Phase 0 ishi) |
| 2 | 3-bosqichli sessiya: SOZLASH→ASOSIY→YAKUNLASH, har bosqichda 4 vaqt belgisi | Agregatda 6 holat (READY/CHECKLIST_PENDING/RUNNING/PAUSED/COMPLETED/SENT_TO_QC); SOZLASH/ASOSIY/YAKUNLASH **YO'Q** | **KRITIK** |
| 3 | OEE 4 darajada (stanok/smena/brigada/sex); A=net_run/scheduled, P=actual/(norm×net_run), Q=sof/umumiy | `get-oee.handler` DI-ulangan, lekin **formula buzuq**: A = actualTime/actualTime (doim 100%), P = sessiya soni (doim 100%), Q ko'pincha 0; bo'sh jadvaldan o'qiydi; 4-daraja yo'q | **KRITIK** — matematik buzuq |
| 4 | Smena A/B/C; brigada doimiy A/B/C'ga biriktirilgan | Hech qayerda A/B/C enum **YO'Q** | **KRITIK** |
| 5 | TB xavfsizlik + smena tayyorlik checklist sessiya boshidan oldin majburiy; checklist'siz BLOK | `passChecklist()` faqat statusni o'zgartiradigan **no-op shim**; haqiqiy checklist ma'lumoti yo'q | **KRITIK** |
| 6 | Downtime sabab kodlari: 20+ sex-spesifik, 3 tur (rejali/rejasiz/sifat) + alohida 'ish-yo'q' | 8 ta umumiy inglizcha kod hardcoded; sex-spesifik kodlar, 3-tur, 'ish-yo'q' YO'Q | **YUQORI** |
| 7 | SOS eskalatsiya org-chart vertikaliga (operator→usta→bo'lim→direktor), 15/30 daq avto | SOS insert real (`sos_alerts`) — lekin org-chart eskalatsiya zanjiri **YO'Q** | **YUQORI** |
| 8 | ~30 nomli stanok seed (Gofra liniya, SM-52/72, KBA-105, Tigel 1-10) norma/brak/oee_target bilan | Stanok master-data seed **YO'Q** | **YUQORI** |
| 9 | Material yechish operator/usta TASDIG'I bilan; norma texkartadan avto; WMS yechish faqat tasdiqda | `recordMaterialConsumption` oddiy INSERT — norma yo'q, tasdiq yo'q, WMS yechish yo'q | **YUQORI** |
| 10 | MES→QC→HR→WMS zanjir to'liq ulangan; bonus TAKLIF (avto emas) HR navbatiga | MesCompletedEvent/MesToHr360Event chiqariladi — lekin QC'da @EventsHandler **topilmadi**; bonus taklif YO'Q | **YUQORI** |
| 11 | Sessiya natijasi vaznli GSD ballni operator kartasiga (sof+OEE+norma-sarf), razryad o'sishiga | hr-gsd.* fayllari bor — lekin sessiyani o'qib kartaga ball yozadigan yo'l YO'Q | **YUQORI** |
| 12 | AI smena xulosasi (top yo'qotish+brigada reytingi+takror sabab) | handover DB'ga yoziladi — lekin AI xulosa generatsiyasi YO'Q | **O'RTA** |
| 13 | machine_crews POST (operator+yordamchi); IOT_READ'da 'operator' roli | Faqat GET crew bor, **POST yo'q**; IOT_READ'da 'operator' YO'Q → operatorlar /api/iot/*'da 403 oladi | **YUQORI** — operatorlar bloklangan |
| 14 | Jonli sex tablosi: har stanok plitka RUNNING/IDLE/DOWNTIME/SOS, jonli OEE, 1-5 daq polling | `mes.gateway` WebSocket bor — lekin sex tablosi FE sahifasi YO'Q | **O'RTA** |

### 3B. PP — QANDAY BO'LISHI KERAK / HOZIR QANDAY / FARQ

| # | QANDAY BO'LISHI KERAK | HOZIR QANDAY | FARQ (jiddiylik) |
|---|------------------------|--------------|------------------|
| 1 | Texkarta 6 element (material/bosma/kesim/qolip/qo'shimcha/tartib) + BOM + marshrut, versiyalangan lab-gate | TechnologyService to'liq CRUD (createCard/labApprove/maketApprove/getBom/addRoute/getVersions) real DB | **OK** |
| 2 | 3 reja-start darvozasi AND: maket-tasdiq AND texkarta+lab-tasdiq AND material-mavjud; 7-bosqich tsikl | Agregatda 5 status (PLANNED/RELEASED/IN_PROGRESS/COMPLETED/CANCELLED) — owner 7-bosqichi **YO'Q**; 3-darvoza AND yo'q | **YUQORI** |
| 3 | Buyurtma 7-status + prioritet (4 daraja + ZARUR zona) + frozen zone ~3 kun (faqat owner/direktor ochadi) + no-preemption | Faqat 5 status; frozen zone/prioritet/ZARUR zona/no-preemption **YO'Q** | **YUQORI** |
| 4 | MRP: BOM×tiraj+scrap ╳ warehouse_stock; taqchillik→avto PR Xaridga; rezervatsiya; lot FIFO/FEFO; dinamik reorder CRON | `RunMrpHandler`+`PpIntelligenceService` **real ishlaydi** (BOM→hisob→pp_mrp_run_lines); LEKIN taqchillik→avto PR yo'q, rezervatsiya yo'q, lot FIFO/FEFO yo'q, reorder CRON yo'q | **O'RTA** — yadro ishlaydi, kengaytmalar yo'q |
| 5 | CRP: work_centers.efficiency_rate; per-stanok utilizatsiya %, bottleneck flag, 4-hafta | `PpCrpService` **real**; utilizatsiya hisoblaydi, 85%+ bottleneck flag, COALESCE bilan crash yo'q | **OK** |
| 6 | AI 7-qadamli planner: buyurtma→material→bron→marshrut→vaqt→reja→ijrochi; planner 1-klik tasdiq | `AiPlannerService` (Johnson/CPM/EOQ) bor — lekin 7-qadam **yagona flow'ga yig'ilmagan**; 1-2 = MRP, 3-7 zanjir yo'q | **YUQORI** |
| 7 | Gofra/sloy formulasi: kg→m²→list (GSM+take-up); MM LayerFormulaService PP BOM tomonidan ishlatiladi | `LayerFormulaService` MM'da to'liq mavjud — lekin PP BOM/texkarta uni **chaqirmaydi** | **YUQORI** — ulanmagan |
| 8 | Smena reja ekrani: smena×stanok×buyurtma×operator+yordamchi, 4 vaqt, ZARUR zona, drag-drop, kunlik re-plan CRON | Smena CRUD bor (production_sessions) — lekin "A smena reja" jadval ekrani, 4 vaqt, ZARUR zona, drag-drop, re-plan CRON **YO'Q** | **YUQORI** |

**Tasdiqlangan kodda:** OEE formulasi haqiqatan buzuq (61-62-qatorlarda `totalActualTime` va `totalPlannedTime` bir xil qiymat → A doim 100%; 67-qator `totalActualOutput += 1` → sessiya soni, real birlik emas). Sessiya jadval ikkilanishi tasdiqlandi: `mes_sessions` va `production_sessions` ikkalasi ham MES modulida jonli yozuvchilarga ega.

**Hukm:** MES ~30–35% (asosiy CRUD/IoT real, lekin OEE buzuq, sessiya ikki-olam, 3-bosqich/checklist/A-B-C/seed yo'q, operatorlar 403). PP ~40% (MRP+CRP+texkarta real va ulangan, lekin 7-status/frozen-zone/prioritet/AI-7-qadam/gofra-formula-ulanish/smena-reja yo'q).

---

## 4. KASSIR (Kassir hub — Moliya moduli ichida)

> **DIQQAT:** KASSIR = Moliya ichidagi alohida hub (naqd pul, oylik→PIN tasdiq, podotchet/avans). Bu POS Monitor EMAS. FE'dagi "Kassa" sahifasi esa retail kassa apparati — bu ham kassir-hub EMAS.

### QANDAY BO'LISHI KERAK / HOZIR QANDAY / FARQ

| # | QANDAY BO'LISHI KERAK | HOZIR QANDAY | FARQ (jiddiylik) |
|---|------------------------|--------------|------------------|
| 1 | Yagona kassir butun naqdni boshqaradi; ERP'dan tashqarida pul harakatlanmaydi | **Maxsus kassir submodul YO'Q** — cashier_shift yo'q, smena endpoint yo'q, KAS-1/KAS-2 jadvallari yo'q | **KRITIK** — 0% |
| 2 | Smena ochish/yopish + X/Z kunlik hisobot (KAS-1) | **NOL implementatsiya** — endpoint yo'q, jadval yo'q, X/Z hisobot yo'q | **KRITIK** — 0% |
| 3 | Oylik taqsimoti: hisob→direktor→kassir→xodim PIN tasdig'i (KAS-2) | **YO'Q** — PIN ustuni yo'q, PIN validatsiya endpointi yo'q | **KRITIK** — 0% |
| 4 | Har avans (podotchet): berildi→advance_reports→chek yuklash→AI o'qish→inson tasdig'i→GL posting; muddat o'tsa HR cheginma | `payroll_advances` (eski) list/pending uchun bor — lekin advance_reports jadvali **YO'Q**, chek yuklash/AI/GL/HR cheginma yo'q | **YUQORI** — ~10% |
| 5 | **Har-som-hisobli**: pul olgan xodimga qarz yoziladi; mol omborga kirgunча qoladi; profil: jami/maqsad/tasdiqda/qarz | employee_debts jadvali **YO'Q**, endpoint YO'Q, profil ko'rinishi YO'Q | **KRITIK** — 0% |
| 6 | Chek-AI: xodim chek yuklaydi→AI o'qib solishtiradi→inson yakuniy qaror | Moliyada chek-AI endpoint **YO'Q**, stub ham yo'q | **YUQORI** — 0% |
| 7 | Kunlik per-xodim PDF: kun oxirida avto→Telegram+ERP→xodim tasdiqlaydi | `financial-reports-daily.cron` 18:00'da **kompaniya-darajasidagi** xulosa yuboradi — per-xodim PDF va tasdiq YO'Q | **YUQORI** — 0% (xodim darajasi) |
| 8 | Naqd limit nazorati: balans vs limit→CRON ogohlantirish→eskalatsiya | **YO'Q** — cash_limit config yo'q, CRON yo'q | **YUQORI** — 0% |
| 9 | Bir nechta bank hisobi (UZS/valyuta) alohida, umumiy balans dashboard | `bank_accounts` jadvali balance bilan bor — lekin kassir dashboard'ga **ulanmagan** | **O'RTA** — uzilgan |
| 10 | Oylik→GL: PayrollClosedEvent→kanonik `entries` | PayrollClosedEvent 3 ro'yxatdan o'tgan Finance tinglovchilar ichida **YO'Q**; oylik payroll_rows'ga yoziladi, `entries`'ga tasdiqlanmagan | **YUQORI** — ulanmagan |
| 11 | 4-hisob dashboard (MAIN/TAX/HEAD/WORKING real balanslar) | FinanceDashboard payroll davrlari + AR/AP ko'rsatadi — 4-hisob balanslari **EMAS** | **YUQORI** — 0% |
| 12 | Oylik navbati reyting bo'yicha (formula keyinga, placeholder kerak) | **YO'Q** (vizyonda ham keyinga qoldirilgan) | **PAST** — 0% (kelishilgan) |
| 13 | Barcha naqd harakatlar real ikki-yozuv `entries`'ga | `insertJournal` (DrizzleGlPostingRepository) **REAL va atomik** — db.transaction, hisob kodlarini ID'ga yechadi, `entries`'ga yozadi | **OK** — yagona ishlaydigan qism |

**Tasdiqlangan kodda:** Moliyada cashier/kassir submodul yo'qligi tasdiqlandi; advance_reports / employee_debt jadvallari kodda yo'qligi tasdiqlandi.

**Hukm:** Kassir sub-modul deyarli qurilmagan (~5–10%). Faqat umumiy GL posting (insertJournal→entries, atomik, real) va FP-tsikl cron skeleti ishlaydi; har bir kassir-spesifik funksiya — smena (KAS-1), PIN (KAS-2), har-som-hisobli, podotchet hayot-tsikli, chek-AI, kunlik PDF, naqd limit, oylik→kassir→PIN — 0%; FE "Kassa" sahifasi retail kassa apparati.

---

## 5. ARXITEKTURA IZOHI — egasi tez-tez aralashtiradigan asosiy munosabatlar

Egasi (va ko'p tahlillar) quyidagi uchta tushunchani aralashtirib yuboradi. Aniqlik kiritamiz:

### 5.1. POS Monitor ≠ Kassa apparati

- **POS Monitor = ZAVOD OMBOR PLANSHETI.** Uning vazifasi: kirim / chiqim / inventar / harakatlar / karantin / barkod. U zavod sexida, ombor ishchisi qo'lida.
- **Bu KASSA APPARATI EMAS.** Pul (naqd) bu modulga tegishli emas.
- **Hozirgi xato:** `cash-register.controller/service/repository` va `retail_pos_transactions` jadvali hamon **POS modulida joylashgan** (§2.17). Bu noto'g'ri domen — ko'chirilishi kerak.

### 5.2. KASSIR = Moliya ichidagi alohida hub

- **KASSIR** = naqd pul, oylik→PIN tasdiq, podotchet/avans, har-som-hisobli qarzni boshqaradigan **Moliya moduli ichidagi alohida markaz**.
- Yagona kassir butun naqdni boshqaradi; ERP'dan tashqarida pul harakatlanmaydi.
- **Hozirgi xato:** FE'dagi "Kassa" yorlig'i retail kassa apparatiga (`CashRegister.tsx`) yo'naltiradi — bu kassir-hub EMAS (§4.1). Kassir-hub deyarli qurilmagan.
- **Demak:** "POS Monitor"dagi kassa kodi va "Kassa" sahifasi — ikkalasi ham noto'g'ri narsa; haqiqiy kassir-hub Moliyada yangidan qurilishi kerak.

### 5.3. Ishlab chiqarish OMBORNI TO'LDIRADI (oqim yo'nalishi)

Asosiy ma'lumot oqimi quyidagicha bo'lishi kerak:

```
MES (sessiya tugadi)
   └─► MesSessionCompletedEvent
          └─► POS Monitor tinglovchisi: FG_FROM_MES harakati
                 └─► WMS: warehouse_stock'ga tayyor mahsulot (FG) kirim
                        └─► POS Monitor planshetida ko'rinadi (chiqim/jo'natma uchun)
```

- Ishlab chiqarish (MES) **manba**; ombor (WMS/POS Monitor) **qabul qiluvchi**.
- **Hozirgi xato:** bu zanjir **uzilgan** — MES `MesCompletedEvent`'ni chiqaradi, lekin POS modulida uni tinglaydigan handler **umuman yo'q** (§2.7, grep bilan tasdiqlangan). Demak MES tugaganda FG ombor avtomatik to'lmaydi.

### 5.4. Umumiy naqshlar (egasi bilishi kerak)

1. **Sxema ≠ ishlaydigan funksiya.** Ko'p jadvallar mavjud (stockMovementGLPostings, departmentWarehouseMap, warehouseRentalRecords, payroll_advances), lekin ularni to'ldiradigan/majburlaydigan _runtime xizmat yo'q_. Jadval bo'lishi = funksiya bor degani emas.
2. **Darvozalar (gates) yo'q.** Karantin gate, texkarta blok, gofra-qatlam blok, majburiy foto, PIN, har-som-hisobli — bularning hammasi modulning haqiqiy qiymati. Holat-mashinalar va enumlar bor, lekin _majburlash_ yo'q.
3. **Bo'sh DB yashiradi.** OEE 100/100 qaytaradi, GL posting jimgina `posted:false` qaytaradi, dashboard {0,0,0,0} qaytaradi — chunki tekshiradigan ma'lumot yo'q. Bu "yashil yolg'on" — ko'rinishda ishlaydi, aslida yo'q.
4. **Ikki-olam splitlari.** MES sessiya jadvali (mes_sessions ╳ production_sessions) — ikkalasi ham jonli yozuvchilarga ega; kanonik qaror egasidan kutilmoqda.

---

## 6. YO'NALISH — kelajak qadamlar uchun ustuvorlik (Phase 0 darajasi)

Tartib (eng kritik avval):

1. **MES sessiya kanonik qaror** (mes_sessions ╳ production_sessions) — egasi tanlashi shart, qolgan barcha MES ishi shunga bog'liq.
2. **OEE formulasini tuzatish** — hozir matematik buzuq (doim 100/100), real norma_rate va birlik kiritishi kerak.
3. **Kassir-hubni Moliyada qurish** — KAS-1 (smena), KAS-2 (PIN), har-som-hisobli, podotchet hayot-tsikli; retail kassa kodini POS'dan ko'chirish.
4. **MES→POS FG zanjirini ulash** — MesSessionCompletedEvent tinglovchisi (hozir umuman yo'q).
5. **WMS kritik darvozalar** — karantin gate, FIFO/FEFO chiqim, rulon-karta entity, gofra/texkarta blok.
6. **GL runtime yozuvchilari** — sxema bor jadvallar (stockMovementGLPostings) uchun haqiqiy posting xizmatlari; gl_account_mappings seed.

---

**Manba:** 4 ta soha tahlili (OMBOR, POS, PROD, KASSIR) — har biri shouldBe/isNow/gap/verdict bilan. Asosiy da'volar jonli kodga (`apps/api/src/modules/`) qarshi tasdiqlangan (2026-06-19).
