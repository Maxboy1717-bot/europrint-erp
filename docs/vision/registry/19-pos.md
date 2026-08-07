# POS Monitor — Yagona Vizyon Registri (EP-POS) — 2026-08-07

> ⚠️ **POS nima:** POS Monitor = **zavod ombori planshet ilovasi** (kirim/chiqim/inventar/ichki ko'chirish). **KASSIR EMAS** — kassa/pul → Finance moduli. Bu chegara egasi tomonidan TASDIQ-2146 §19 #1 da qat'iy tasdiqlangan va kodda ham ushlanadi (`pos.module.ts` da 20+ kontroller — hech biri kassa/to'lov terminali emas).
>
> **Manbalar:** `decisions/19-pos.md` (82 qaror: v1 Q1–Q30 + v2 Q31–Q82) · `FULL-ITEM-LEVEL [Module-19]` (132 item: #1..#50 = `vision-1000-answers` #1..#50, #51..#132 = EP-POS-001..082) · `FULL-VISION-EXTRACTION` QISM A (POS 50 qaror) + QISM C (TASDIQ-2146 §19, 82 qator) + QISM D (V/VERIFY cross-ref, 38 qator) + **QISM I2** (OMBOR·POS·KASSIR·TA'MINOT intervyusi, egasining 1–4 iyun to'g'ridan javoblari — 33 qaror + 5 ochiq savol) · `vision-1000-answers/19-pos.md` (50) · `EUROPRINT_BARCHA_JAVOBLAR.md` POS bo'limi (Q1–Q60)
>
> **Holat sanasi:** qurilish-holati asosan 2026-07-11 `FULL-ITEM-LEVEL` tekshiruviga asoslanadi; 2026-07-11 → 2026-08-07 oralig'ida POS'ga tegan **16 commit** qayta tekshirildi (`Δ` qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-POS-001..082)** | **82** |
| **Qaror holati:** ✅ javoblangan | 57 |
| **Qaror holati:** 🔵 ochiq | 25 |
| **Qurilish:** Ha | 31 |
| **Qurilish:** Qisman | 31 |
| **Qurilish:** STALE-DOC | 12 |
| **Qurilish:** Yo'q | 7 |
| **Qurilish:** — (mos item topilmadi) | 1 |
| II QISM (`VR-POS-*`) | 12 |
| 2026-07-11 dan beri o'zgargan (Δ) | 20 |
| ⚠️ Manbalar orasida ziddiyat | 29 |

> **⭐ Eng muhim uch topilma:**
> 1. **12 ta STALE-DOC** — `QISM C` (TASDIQ-2146 §19, 2026-06-27) POS'da tizimli ravishda eskirgan: 12 bandda "Yo'q / grep=0" deb yozilgan narsa aslida **to'liq qurilgan** (texkarta-gate, anomaliya-detektor, poddon-balans, 2-imzo gate, variance-limit, foto-dalil, `WASTE_IN`/`PARTIAL_RECEIPT`/`CUSTOMER_MATERIAL`/`LAB_SAMPLE_OUT` turlari). Modulning haqiqiy qurilish darajasi hujjatlarda ko'rsatilganidan **sezilarli yuqori**.
> 2. **"Qurilgan, lekin ulanmagan" naqshi** — asosiy nosozliklar yo'q-kodda emas, **uzilgan simda**: `PosDepartmentGuard`/`PosWarehouseAccessGuard` hech qayerda `@UseGuards` bilan qo'llanilmagan (bo'lim izolyatsiyasi o'lik); `pos-fifo.service.ts` mavjud bo'lmagan `pos_batches`/`pos_materials` jadvallariga so'rov yuboradi (FIFO/FEFO runtime'da yiqiladi, kechalik cron jimgina no-op); `pos_telegram_routes`/`pos_variance_config`/`pos_barcode_map`/`pos_stock_reservations` — kod jonli, jadval bo'sh.
> 3. **Chegara-qiymatlar CRUD'dan tashqarida** — `business.constants.ts:416-442` da 5 ta POS-anomaliya + `POS_OVER_NORM_FACTOR` konstantalari, `pos/three-way-match.service.ts:14-15` da 5% tolerans, `pos-inactive-materials.job.ts:30` da 90 kun — hammasi kompilyatsiya-vaqtida qattiq yozilgan. Bir xil naqsh **ikki marta** dublikat-servis ko'rinishida chiqdi (karantin-eskalatsiya `9ea7c155` da tuzatildi; **3-way-match hamon tuzatilmagan**).

> **Eslatma (qamrov):** bu fayl **I QISM** — 82 EP-kodli qarorni to'liq qamraydi
> (`grep -c "^### EP-POS-"` → **82**). **II QISM** (VR-POS-I01..I12) = EP-kodsiz
> vizyon-realizatsiya bo'shliqlari — asosan **QISM I2 intervyusidan** (egasining
> to'g'ridan javoblari, 1–4 iyun) va `vision-1000-answers` ning kesishuvchi
> arxitektura javoblaridan. **III QISM** = xaritalash, manba-ziddiyatlari va
> `decisions/19-pos.md` Xulosa-jadvalining tekshiruvi.

> **Eslatma (qurilish ≠ qaror):** ikki o'q **mustaqil**. Masalan EP-POS-032
> (texkarta-material moslik) qaror bo'yicha hamon 🔵 **OCHIQ** (egasi blok-darajasini
> tasdiqlamagan), lekin qurilish bo'yicha **STALE-DOC** — `pos-techcard-gate.service.ts`
> to'liq qurilgan va `movements.controller.ts:179` da ulangan. Teskarisi ham bor:
> EP-POS-024 (MES→FG kirim) qaror bo'yicha ✅ **JAVOBLANGAN**, qurilish **Qisman**
> (listener yo'q — golden-thread uzuq).

> **Eslatma (mapping):** `FULL-ITEM-LEVEL [Module-19]` Item **#(N+50) = EP-POS-N**
> — bu 1:1 xaritalash EP-POS-001..082 ni to'liq qoplaydi (Item #51..#132).
> Item **#1..#50** = `vision-1000-answers` #1..#50 = `EXTRACTION QISM A #1..#50`
> = `QISM D` qatorlari — bular EP-kodsiz va mavzu bo'yicha ulanadi
> (`(taxminiy)` bilan belgilanadi). `QISM C` qatori **§19 #N = EP-POS-N** (to'g'ridan).
> To'liq jadval: **III QISM §1**.

---

## I QISM — EP-kodli qarorlar (EP-POS-001..082)

### EP-POS-001 · POS Monitor asosiy vazifasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Zavod ombori harakatlari (kirim/chiqim/inventar/ichki ko'chirish) — kassa Finance'da qoladi. Tayyor mahsulot (FG) ham shu POS tizimida boshqariladi; amortizatsiya/moliya → FI moduli. (v1-A + kengaytma)
- **Manba:** BARCHA_JAVOBLAR Q1 (ERP ichida modul), Q34 (FG POS'da), Q46 (POS faqat inventar kuzatadi)
- **Dalil (kod):** `movement-enums.ts` — 12 ta `MovementTypeCode` 5 kanonik kategoriyada (`MOVEMENT_CATEGORY_META`); `SELECT count(*) FROM pos_movement_types` → **11 jonli qator**. `pos.module.ts` `presentation/` ostida 20+ kontroller ro'yxatdan o'tkazadi (movements, barcode, inventory-count, shift-handover…) — **kassa/to'lov terminali kontrolleri topilmadi** (chegara kodda ushlangan).
- **Nima yetishmaydi:** modul chegarasi to'g'ri; qolgan bo'shliqlar quyi bandlarda. ⚠️ Lekin egasi I2 intervyusida (§0, s2) "**umuman man xohlagan narsa emas**" deb POS Monitor'ni to'liq qayta loyihalashni talab qilgan — bu qayta-dizayn bajarilgani hech qayerda hujjatlanmagan (→ VR-POS-I01).
- **Bog'liqlik:** EP-POS-028 (harakat turlari), EP-POS-030 (kanonik jadval)
- **action:** READ
- **⤳ Ta'sir:** Butun ombor zanjiri; Finance chegarasi
- **Xoch-havolalar:** `[Module-19] Item 51` · `TASDIQ-2146 §19 #1` · `QISM C 19.1` · `QISM I2 #1`
- **⚠️ ZIDDIYAT:** `QISM C` (2026-06-27) "Ha — 6 harakat turi" vs `[Module-19] Item 51` (2026-07-11) "12 tur / 11 jonli qator". Ikkalasi ham to'g'ri edi o'z sanasida — taksonomiya 6 dan 11-12 ga o'sgan. Registrda **11/12** kanonik.
- **Δ 2026-07-11→08-07:** `2390f42a` (2026-08-04) — o'lik meros `pos.controller.ts` + uning eksklyuziv `PosService` zanjiri o'chirildi (modul chegarasi tozalandi, funksional yo'qotish yo'q).

### EP-POS-002 · Ombor xodimi planshetda kim sifatida kiradi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-04 Δ)*
- **Talab:** ERP login (SSO/JWT) bilan kiradi, rol ERP'dan avto tortiladi — har harakat shaxsga bog'lanadi (v1-A varianti, shaxsiy login).
- **Manba:** BARCHA_JAVOBLAR Q2 (SSO), Q10 (ERP login, rol avto), Q11 (smena emas, faqat audit log)
- **Dalil (kod):** `pos-auth.service.ts` + `pos-auth.controller.ts` mavjud; `SELECT count(*) FROM pos_audit_log` → **65 qator** (hujjatdagi 41 dan o'sgan — jonli foydalanish davom etmoqda).
- **Nima yetishmaydi:** ⚠️ `EXTRACTION QISM A` ochiq-savollari: **operator login imkonsiz** — `role='operator'` jonli sanog'i **0**, `employee↔user` bog'i **0** (VISION-3340 SB0312 STILL-OPEN). Ya'ni omborchi/operator planshetga amalda kira olmaydi — login modeli qurilgan, lekin unga mos rol/foydalanuvchi ma'lumoti yo'q.
- **Bog'liqlik:** EP-POS-003 (bo'lim ko'rinishi), EP-POS-074 (razryad huquqi), EP-POS-080 (audit)
- **action:** LOGIN
- **⤳ Ta'sir:** Audit log, javobgarlik, HR rol
- **Xoch-havolalar:** `[Module-19] Item 52` · `TASDIQ-2146 §19 #2` · `QISM C 19.2` · `QISM I2 #29` *(imzo = ERP login)*
- **Δ 2026-07-11→08-07:** `3d605103` (2026-08-04) — POS gateway WebSocket handshake endi httpOnly cookie auth'ni qabul qiladi (avval FE cookie yuborardi, gateway `auth.token` o'qirdi → planshet real-time ulanmasdi). Bu **chat-modulidagi bir xil auth-drift bug'ining POS varianti**.

### EP-POS-003 · Qaysi omborlar planshetda ko'rinadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Bo'lim asosida — faqat o'sha bo'lim xodimlari o'z ombori chiqimini qiladi; xodim bir necha bo'lim omboriga ega bo'lishi mumkin (HR sozlaydi). Qurilma→ombor qat'iy biriktirish emas, rol/bo'lim asosida ko'rinadi.
- **Manba:** BARCHA_JAVOBLAR Q12 (faqat o'sha bo'lim chiqim), Q13 (30+ bo'lim), Q14 (bir necha bo'lim, HR sozlaydi)
- **Dalil (kod):** `[Module-19] Item 53` = **STALE-DOC**: `QISM C` "department_warehouse_map=0 qator, data kutadi (egasi-data)" endi noto'g'ri — `SELECT count(*) FROM department_warehouse_map` → **47 qator**. Darvoza `PosDepartmentGuard` / `PosWarehouseAccessGuard` (`presentation/guards/pos-department.guard.ts:24-70`) da yozilgan: o'z-bo'lim tekshiruvi + `warehouse_access_grants` + `department_warehouse_map`, `exemptRoles` rol-asosli.
- **Nima yetishmaydi:** ⭐ **O'LIK GUARD (2026-08-07 live tasdiq):** `grep -rn "PosDepartmentGuard\|PosWarehouseAccessGuard" apps/api/src` → faqat **4 hit**: `pos.module-imports.ts:115` (re-export), `pos.module.ts:53,165` (provider+export), `pos-department.guard.ts:25,47` (ta'rif). **Hech qaysi kontrollerda `@UseGuards(PosDepartmentGuard)` YO'Q** — ya'ni bo'lim/ombor izolyatsiyasi to'liq yozilgan, ro'yxatdan o'tgan, mapping ma'lumoti ham 47 qator, lekin **amalda hech qachon ishlamaydi**. Bundan tashqari RBAC karta-permission emas, rol/position-asosli (SB0190; `CARD_PERMISSION_SOURCE_READY=false`), `hr.employee.department_changed` listener'i yo'q (QISM A #35 = Yo'q) → bo'lim o'zgarsa ombor ko'rinishi yangilanmaydi.
- **Bog'liqlik:** EP-POS-002 (login), EP-POS-074 (razryad), EP-POS-080 (audit ko'rinishi)
- **action:** READ
- **⤳ Ta'sir:** HR (ombor-rol mapping), 30+ bo'lim ombori, butun RBAC izolyatsiyasi
- **Xoch-havolalar:** `[Module-19] Item 53` · `[Module-19] Item 35` *(taxminiy — HR dept event)* · `[Module-19] Item 38` *(taxminiy — RBAC guard)* · `EXTRACTION QISM A #35` · `QISM A #38` · `QISM D #38` · `TASDIQ-2146 §19 #3` · `QISM C 19.3` · `QISM I2 #7` *(DEPARTMENT_\* ichki ombor)*
- **⚠️ ZIDDIYAT:** `QISM D #38` (2026-07-07) "GAP: `MovementOwnershipGuard` nomi topilmadi, lekin `PosDepartmentGuard`+`PosWarehouseAccessGuard` **bor**" — bu "bor" degani **ta'rif bor** degani edi, "qo'llanilgan" degani EMAS. 2026-08-07 live tekshiruvi guard'lar hech qayerda `@UseGuards` bilan ulanmaganini ko'rsatdi. `QISM D` xulosasidagi "Qisman" haqiqatda **funksional Yo'q**.
- **Δ 2026-07-11→08-07:** `63ab63b0` (08-05) + `993c5175` (08-06) — POS ombor-ro'yxati predikati WMS bilan moslashtirildi (`deleted_at` tekshiruvi qo'shildi + `isActive` copy-paste bug tuzatildi): avval POS o'chirilgan omborlarni ham ko'rsatardi. **Live tasdiq (08-07):** guard'lar hamon o'lik.

### EP-POS-004 · Kirim (priyomka) jarayoni qanday boshlanadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** EXTERNAL_IN 5 bosqichli oqim: DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL. Yetkazib beruvchi/zakaz konteksti bilan boshlanadi; skan/AI kamera bilan. (v1-A/C ruhida)
- **Manba:** BARCHA_JAVOBLAR Q21 (EXTERNAL_IN 5 bosqich), Q30 (kirim avval karantinga), Q40 (inventar pasporti faqat EXTERNAL_IN)
- **Dalil (kod):** `quarantine-workflow.service.ts:23-32` — `STATUS_FLOW` = `draft→pending→karantin→qc_review→approved/rejected/cancelled`; `pos.events.ts:66-75` `EXTERNAL_IN` yaratilganda avtomatik `moveToQuarantine()` chaqiradi.
- **Nima yetishmaydi:** 5-bosqich (AI_GL) qoidaviy (rule-based) `GL_PAIRS`, haqiqiy AI emas (qv. EP-POS-013). Karantin chiqishida QC dalolatnomasi majburiy emas (I2 #8 talabi: "QC dalolatnoma+parametr kiritmaguncha BLOK") — bu blok topilmadi.
- **Bog'liqlik:** EP-POS-008 (tasdiq bosqichlari), EP-POS-034 (karantin), EP-POS-012/013 (GL), EP-POS-051 (qabul akti)
- **action:** CREATE
- **⤳ Ta'sir:** MM (zakaz/narx), QC (karantin), GL
- **Xoch-havolalar:** `[Module-19] Item 54` · `[Module-19] Item 1` *(taxminiy — bosqich event + eskalatsiya)* · `EXTRACTION QISM A #1` · `TASDIQ-2146 §19 #4` · `QISM C 19.4` · `QISM I2 #8`
- **Δ 2026-07-11→08-07:** `4d7422fc` (08-06) — karantin **48-soatlik eskalatsiyasi CRUD-sozlanadigan** qilindi (`business_settings`). `9ea7c155` (08-07) — ⭐ **ikkita parallel karantin-eskalatsiya yo'li birlashtirildi**: `quarantine-workflow.service.ts` `business_settings` dan o'qirdi, `pos-inventory-passport.service.ts:64,70` esa literal `48` ishlatardi → egasi soatni CRUD orqali o'zgartirsa ikki tizim **ziddiyatli** ishlardi. **2026-08-06 topilmasi TASDIQLANADI.**

### EP-POS-005 · Chiqim (otpusk) sababi majburiymi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Sabab majburiy — harakat turi orqali ro'yxatdan: INTERNAL_ISSUE (bo'limga), EXTERNAL_OUT (tayyor mahsulot sotuvi), INTERNAL_TRANSFER (ko'chirish), DAMAGE (brak), INTERNAL_RETURN (qaytarish, sabab majburiy). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q22–Q26 (harakat turlari), Q24 (INTERNAL_RETURN sabab majburiy)
- **Dalil (kod):** `pos_movements.return_reason` ustuni `information_schema.columns` bilan jonli tasdiqlangan; `movement-enums.ts` 12 tipli harakat kodini sanaydi, har biri `movement.dto.ts` da sabab-talabini boshqaradi.
- **Nima yetishmaydi:** sabab **matn** sifatida majburiy, lekin **katalog** (master-data sabab ro'yxati) yo'q — `pos_overage_reasons` katalogi topilmadi (`QISM D #30`: grep overage → 0). Ya'ni sabablar erkin matn, tahlil qilib bo'lmaydi.
- **Bog'liqlik:** EP-POS-028 (harakat turlari master-data), EP-POS-044 (norma-fakt sabab), EP-POS-067 (shoshilinch chiqim sabab)
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot, GL-yozuv, QC (DAMAGE)
- **Xoch-havolalar:** `[Module-19] Item 55` · `TASDIQ-2146 §19 #5` · `QISM C 19.5`
- **Δ 2026-07-11→08-07:** `b225479e` (07-11) — favqulodda chiqimda `is_unplanned` + sabab majburiyligi qo'shildi (qv. EP-POS-067).

### EP-POS-006 · Barcode/QR skanerlash — material identifikatsiyasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Skaner asosiy, qo'lda qidirish zaxira. Ikki usul: dedicated scanner (USB/Bluetooth) + AI kamera (ZXing.js brauzerda, OpenCV server fallback). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q16 (ikkalasi: scanner + AI kamera), Q17 (ZXing.js + OpenCV), Q18 (topilmasa qo'lda qidirish)
- **Dalil (kod):** `pos-barcode.service.ts` + `barcode.controller.ts` mavjud va `pos.module.ts` da ro'yxatdan o'tgan. `SELECT count(*) FROM pos_barcode_map` → **0 qator** — barcode↔material xaritasi hamon bo'sh.
- **Nima yetishmaydi:** servis/kontroller jonli, lekin **ma'lumot yo'q** (0 qator) → skaner amalda hech nimani topa olmaydi. Egasi-data (barcode master-data seed).
- **Bog'liqlik:** EP-POS-007 (label chop), EP-POS-033 (gofra qavat barcode), EP-POS-078 (yangi kartochka)
- **action:** READ
- **⤳ Ta'sir:** AI kamera, MM (kartochka)
- **Xoch-havolalar:** `[Module-19] Item 56` · `TASDIQ-2146 §19 #6` · `QISM C 19.6` · `QISM I2 #9` *(rulon kg+QR)* · `QISM I2 #10` *(pre-work skan gate)*
- **Δ 2026-07-11→08-07:** —

### EP-POS-007 · Material barcode'i qayerdan keladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Kirim paytida ERP o'z label'ini avto chop etadi (EXTERNAL_IN tasdiqlanganda) + qo'lda reprint. Format: ZPL/EPL/PDF. Standart barcode: EAN-13 + Code-128 (partiya uchun). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q15 (EAN-13 + Code-128), Q19 (avto label EXTERNAL_IN + reprint, ZPL/EPL/PDF)
- **Dalil (kod):** `pos.events.ts:76-85` — `EXTERNAL_IN` yaratilganda `AutoBarcodeService.generateForMovement()` chaqiriladi va `[AutoBarcode] ${movementNumber}: N ta barkod yaratildi` log yozadi; `auto-barcode.service.ts` mavjud.
- **Nima yetishmaydi:** `QISM A #28` bo'yicha offline holatda `pos_print_queue` ga tushish + retry aynan tasdiqlanmagan (Qisman); ZPL/EPL formatlari kodda tasdiqlanmadi (faqat Code-128 generatsiyasi).
- **Bog'liqlik:** EP-POS-006 (skaner), EP-POS-025 (lot Code-128), EP-POS-073 (PDF chop)
- **action:** CREATE
- **⤳ Ta'sir:** Printer, MM (barcode standarti)
- **Xoch-havolalar:** `[Module-19] Item 57` · `[Module-19] Item 28` *(taxminiy — label event + print_queue)* · `EXTRACTION QISM A #28` · `TASDIQ-2146 §19 #7` · `QISM C 19.7` · `QISM I2 #27` *(pres kirim: kg→shtrix-kod→yopishtir)*
- **Δ 2026-07-11→08-07:** —

### EP-POS-008 · Harakat tasdiqlash — bir yoki ikki bosqich
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Harakat turiga qarab: EXTERNAL_IN = 5 bosqich (karantin+QC+menejer); EXTERNAL_OUT = menejer+moliya+AI; INTERNAL_ISSUE = menejer 1 imzo; INTERNAL_RETURN = tasdiqsiz; bir xil tip TRANSFER = tezkor (tasdiqsiz). Muvozanat (v1-A).
- **Manba:** BARCHA_JAVOBLAR Q21–Q25 (har tip uchun tasdiq darajasi)
- **Dalil (kod):** `SELECT count(*) FROM pos_movement_confirmations` → **17 qator** (hujjatdagi 3 dan o'sgan); `pos-movement-status.service.ts` ko'p-bosqichli `STATUS_FLOW`/tasdiq quvurini boshqaradi (`pos.events.ts` bo'ylab chaqiriladi).
- **Nima yetishmaydi:** bosqichlararo **24-soatlik eskalatsiya** yo'q — `pos_movement_escalations` jadvali mavjud emas, `stage_changed`/`escalated` eventlari yo'q (`[Module-19] Item 1`). Harakat bosqichda tiqilib qolsa hech kim xabardor bo'lmaydi (faqat birinchi `pending` xabari ketadi).
- **Bog'liqlik:** EP-POS-004 (kirim oqimi), EP-POS-009 (kim tasdiqlaydi), EP-POS-071 (Telegram)
- **action:** APPROVE
- **⤳ Ta'sir:** Org-karta (tasdiqlovchi), Finance (EXTERNAL_OUT)
- **Xoch-havolalar:** `[Module-19] Item 58` · `[Module-19] Item 1` *(taxminiy — 24h eskalatsiya)* · `EXTRACTION QISM A #1` · `TASDIQ-2146 §19 #8` · `QISM C 19.8`
- **Δ 2026-07-11→08-07:** `bfcadd20` (08-04) — so'rov approve/reject holat-guard'lari tuzatildi (avval 400 qaytarardi, ya'ni tasdiqlash amalda ishlamasdi); `6a8964a7` (08-04) — so'rov holat-filtri lug'ati real UPPERCASE qiymatlarga moslashtirildi.

### EP-POS-009 · Tasdiqni kim beradi (karta-model bilan bog'liq)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Ombor menejeri asosiy tasdiqlovchi (INTERNAL_ISSUE 1 imzo, TRANSFER boshqa tip), EXTERNAL_OUT'da +moliya. Bo'lim so'rovida: bo'lim menejeri tasdiq. Org-karta vertikali bilan uyg'unlashtiriladi.
- **Manba:** BARCHA_JAVOBLAR Q23 (ombor menejer), Q22 (EXTERNAL_OUT +moliya), Q50 (bo'lim menejer tasdiq)
- **Dalil (kod):** `pos.events.ts:98-110` — `onMovementPending()` `eventRepo.findByRoles([...])` orqali `warehouse_manager`/`pos_manager` rollariga xabar beradi; `pos-movement-status.service.ts:199` FINANCE-approve yo'nalishi.
- **Nima yetishmaydi:** tasdiqlovchi **rol** bo'yicha topiladi, **org-karta vertikali (`manager_id`) bo'yicha emas** — vizyon "Org-karta vertikali bilan uyg'unlashtiriladi" deydi, kod esa qattiq rol-ro'yxatiga tayanadi. Karta-permission seam o'lik (SB0190).
- **Bog'liqlik:** EP-POS-008, EP-POS-074 (razryad), EP-POS-075 (vertikal hisobot)
- **action:** APPROVE
- **⤳ Ta'sir:** Org-karta (manager_id), HR
- **Xoch-havolalar:** `[Module-19] Item 59` · `TASDIQ-2146 §19 #9` · `QISM C 19.9`
- **Δ 2026-07-11→08-07:** —

### EP-POS-010 · Balans-guard — manfiy qoldiqni taqiqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Differensial: aktivlar → TO'LIQ BLOK (qoldiqdan ortiq chiqarib bo'lmaydi); iste'mol materiallar → OGOHLANTIRISH + ruxsat. (v1-A aktivga, v1-B iste'molga — material turiga qarab)
- **Manba:** BARCHA_JAVOBLAR Q38 (aktiv blok / iste'mol ogohlantirish+ruxsat)
- **Dalil (kod):** `pos-balance-guard.service.ts` to'liq o'qildi — `checkLine()` `material_type='asset'` kamomadida **qattiq bloklaydi**, `'consumable'` da yumshoq ogohlantiradi (menejer override'iga ruxsat), DB xatosida **fail-CLOSED** (:69-78). `movement.service.ts:97` da ulangan. `QISM A #11`: TOCTOU (oversell/negative stock) tuzatilgan (`7e8d7bd9`), barcode TOCTOU (`9f8a62e1`) — `SELECT FOR UPDATE` pessimistik lok.
- **Nima yetishmaydi:** — (vizyonga to'liq mos)
- **Bog'liqlik:** EP-POS-011 (minimal qoldiq), EP-POS-066 (rezerv), EP-POS-068 (qisman rulon)
- **action:** CREATE (guard)
- **⤳ Ta'sir:** Inventar aniqligi, GL
- **Xoch-havolalar:** `[Module-19] Item 60` · `[Module-19] Item 11` *(taxminiy — SELECT FOR UPDATE + CHECK)* · `EXTRACTION QISM A #11` · `TASDIQ-2146 §19 #10` · `QISM C 19.10`
- **Δ 2026-07-11→08-07:** `1753ed0d` (08-04) — stock-ledger balansi endi kanonik `warehouse_stock` dan o'qiydi/yozadi (avval drift bor edi). ✅ **POS↔WMS sinxronizatsiyasi regressiyasiz** (dublikat-yozish o'chirilgan, overdraw-himoya saqlangan) — 2026-08-06 topilmasi TASDIQLANADI.

### EP-POS-011 · Balans-guard chegarasi — minimal qoldiq ogohlantirishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har materialga minimal qoldiq belgilanadi, pasayganda avto-ogohlantirish (AI rejalashtirish + ta'minot). AI to'liq yordamchi (EP-POS-019) bilan birlashadi. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q57 (AI rejalashtirish), Q56 (ombor qoldiqlari hisoboti) + EP-POS-019/065 bilan bog'liq
- **Dalil (kod):** `pos-low-stock.job.ts` to'liq o'qildi — soatlik cron `warehouse_keeper` rolidagilarga in-app + Telegram ogohlantirish yuboradi. Faylda `mm_purchase_requests` / `erp_purchase_requisitions` ga hech qanday INSERT **yo'q**.
- **Nima yetishmaydi:** ogohlantirish ishlaydi, **avto sotib-olish so'rovi (PR) yaratilmaydi** — vizyondagi "AI rejalashtirish + ta'minot" zanjirining ikkinchi yarmi qurilmagan (qv. EP-POS-065, `QISM D #36`).
- **Bog'liqlik:** EP-POS-019 (AI), EP-POS-065 (avto PR), EP-POS-060 (muddat ogohlantirishi)
- **action:** EVENT/AI
- **⤳ Ta'sir:** AI, MM (snabjeniye), Notifications
- **Xoch-havolalar:** `[Module-19] Item 61` · `[Module-19] Item 36` *(taxminiy — AI PR)* · `EXTRACTION QISM A #36` · `QISM D #36` · `TASDIQ-2146 §19 #11` · `QISM C 19.11`
- **Δ 2026-07-11→08-07:** —

### EP-POS-012 · GL-koprik — harakat moliyaga qanday tushadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-04 Δ)*
- **Talab:** Har harakatda avto GL-yozuv (Debit/Credit) — EXTERNAL_IN 5-bosqichida AI hisoblaydi. Real-time. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q43 (avto GL, AI hisoblaydi), Q21 (5-bosqich AI_GL), Q39 (real-time PostgreSQL)
- **Dalil (kod):** `pos.events.ts:133-146` — `onMovementApproved()` har tasdiqda `AutoGlPostingService.postForMovement()` ni sinxron chaqiradi. `[Module-19] Item 2` = **STALE-DOC**: `auto-gl-posting.service.ts:140-164` endi **har bir subledger oyog'ini kanonik `entries`ga ham ko'chiradi** (`GlPostingService.postJournal()`, izohda "SB0817 fix") — ya'ni "faqat `pos_gl_postings` subledger'ga yozadi" da'vosi eskirgan.
- **Nima yetishmaydi:** kanonik yozuv **best-effort** — muvaffaqiyatsizlikda faqat `logger.warn`, rollback yo'q; 11 jonli harakat turidan **4 tasi** (`WASTE_IN`, `LAB_SAMPLE_OUT`, `PARTIAL_RECEIPT`, `CUSTOMER_MATERIAL`) `calculateEntries()` ning xaritalanmagan `default` shoxiga tushadi (`:82-83`) → **nol GL yozuvi** (na subledger, na kanonik).
- **Bog'liqlik:** EP-POS-013 (hisoblar), EP-POS-016 (inventar GL), EP-POS-022 (storno), EP-POS-036/049/052/062 (xaritalanmagan turlar)
- **action:** CREATE/EVENT
- **⤳ Ta'sir:** Finance (entries), AI
- **Xoch-havolalar:** `[Module-19] Item 62` · `[Module-19] Item 2` *(taxminiy — AI_GL entries)* · `EXTRACTION QISM A #2` · `TASDIQ-2146 §19 #12` · `QISM C 19.12`
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A #2` va Ochiq-savollar (2026-07-04, SB0817 "STILL-OPEN": "kanonik `entries` EMAS") vs `[Module-19] Item 2` (2026-07-11: "SB0817 fix jonli"). **Item 2 to'g'ri** — fayl o'qib tasdiqlangan. Lekin ikkalasi ham qisman haq: yozuv bor, ammo best-effort va 4 tur xaritalanmagan.
- **Δ 2026-07-11→08-07:** `69558fb6` (08-04) — kanonik `entries` oynasi uchun **kunlik reconciliation cron** qo'shildi (best-effort yozuv tushib qolsa ertasi kuni yopiladi). Bu SB0817/Two-Worlds B3 ning qolgan yarmini yopadi.

### EP-POS-013 · GL-yozuv qaysi hisoblarga tushadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-13 Δ)*
- **Talab:** Harakat turi/sababiga qarab AI Debit/Credit hisoblaydi (chiqim sababi → tegishli hisob). 1C integratsiya yo'q — ERP moliya moduli yetarli; faqat ichki hisobot. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q43 (AI Debit/Credit), Q44 (1C yo'q), Q45 (ichki hisobot)
- **Dalil (kod):** `auto-gl-posting.service.ts:33-46,57-84` — `GL_ACCOUNTS` / `calculateEntries()` switch **11 harakat turidan 7 tasini** aniq BHMS debit/credit kodlariga xaritalaydi (jonli O'zbekiston hisob rejasi kodlari). Modulda 1C integratsiyasiga havola topilmadi (vizyonga mos).
- **Nima yetishmaydi:** ⭐ **4 tur xaritalanmagan** (`WASTE_IN`, `LAB_SAMPLE_OUT`, `PARTIAL_RECEIPT`, `CUSTOMER_MATERIAL`) — bular EP-POS-036 (chiqindi), EP-POS-049 (lab namuna), EP-POS-052 (qisman qabul), EP-POS-062 (mijoz materiali) vizyon-talablarining moliyaviy oyog'i. "AI hisoblaydi" emas — **qoidaviy (rule-based) switch**.
- **Bog'liqlik:** EP-POS-012, EP-POS-019 (AI), EP-POS-036/049/052/062
- **action:** AI/CREATE
- **⤳ Ta'sir:** Finance (CoA), AI
- **Xoch-havolalar:** `[Module-19] Item 63` · `TASDIQ-2146 §19 #13` · `QISM C 19.13`
- **Δ 2026-07-11→08-07:** `4241faa0` (07-13) — Finance'ga **5 ta yangi GL hisobi** qo'shildi (loss / waste-income / marketing / referral / in-transit). `waste-income` aynan `WASTE_IN` (EP-POS-036/037) xaritalanishi uchun kerak edi — hisob endi bor, lekin `calculateEntries()` da `case 'WASTE_IN'` hamon **yo'q**.

### EP-POS-014 · Materialni baholash usuli (kirimda narx)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** FIFO (partiya narxi bo'yicha). Valyuta — qaysi valyutada xarajat bo'lsa o'sha. (v1-B FIFO — egasi tavsiyadagi o'rtacha emas, FIFO tanlagan)
- **Manba:** BARCHA_JAVOBLAR Q35 (FIFO partiya narxi), Q36 (har qanday valyuta)
- **Dalil (kod):** `pos_movement_lines.currency` / `exchange_rate` / `total_price_base` / `unit_price_base` ustunlari jonli. `pos_movements.currency/exchangeRate/totalAmountBase` (`pos-schema-v2.ts:89-92`) + `resolveExchangeRate` darvozasi (`pos-movement.service.ts:405-413` — chet-valyuta kursi yo'q bo'lsa GATE, `exchange_rates` jadvali).
- **Nima yetishmaydi:** ⭐ **FIFO tanlash servisi ishlamaydi** — `pos-fifo.service.ts` `getCandidates()`/`allocate()` **`pos_batches`** jadvalidan so'raydi, `to_regclass('public.pos_batches')` → **`null`**. Kanonik jadval `material_batches`. Ya'ni ustunlar bor, saqlash ishlaydi, lekin **taqsimlash mantiqi runtime'da yiqiladi**. Partiya-darajali valyuta (`batch_currency`/`batch_exchange_rate`) yo'q (`QISM D #48`).
- **Bog'liqlik:** EP-POS-025 (lot), EP-POS-060 (FEFO), EP-POS-068 (qisman chiqim), EP-POS-057 (birlik konversiyasi)
- **action:** CREATE
- **⤳ Ta'sir:** GL summasi, ombor qiymati
- **Xoch-havolalar:** `[Module-19] Item 64` · `[Module-19] Item 5` *(taxminiy — FIFO batch)* · `[Module-19] Item 48` *(taxminiy — multi-currency FIFO)* · `EXTRACTION QISM A #5` · `QISM A #34` · `QISM A #42` · `QISM A #48` · `QISM D #34` · `QISM D #42` · `QISM D #48` · `TASDIQ-2146 §19 #14` · `QISM C 19.14`
- **⚠️ ZIDDIYAT:** `QISM C 19.14` (2026-06-27) "**Ha** — pos-fifo.service; currency/exchange_rate/total_base" vs `[Module-19] Item 5/64` (2026-07-11) "`pos_batches` jadval **mavjud emas**, metodlar runtime'da throw qiladi". Item to'g'ri (`to_regclass` bilan tasdiqlangan) — QISM C fayl **mavjudligini** ko'rgan, uning **ishlashini** emas.
- **Δ 2026-07-11→08-07:** —

### EP-POS-015 · Inventar (sanab chiqish) jarayoni
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-04 Δ)*
- **Talab:** Planshetda skaner bilan sanash, tizim farqni avto ko'rsatadi. Tunda yoki dam olish kunida o'tkaziladi (ish to'xtamaydi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q52 (tunda/dam kuni), Q16 (skan), Q39 (real-time)
- **Dalil (kod):** `pos_inventory_counts` jadvali jonli (`information_schema.tables`); `pos-inventory-count.service.ts` + `inventory-count.controller.ts` mavjud. Ustunlar `countType/scheduledFor/autoGenerated/cycleAbcSegment` (`pos-schema-v2.ts:463,478-480`).
- **Nima yetishmaydi:** **tungi avto-generatsiya cron'i topilmadi** (`QISM D #22`) — "tunda o'tkaziladi" qo'lda rejalashtiriladi. MASTER-STATUS 5.5 (`pos-inventory-count` for-loop tranzaksiyasiz) hamon ochiq.
- **Bog'liqlik:** EP-POS-016 (farq tasdig'i), EP-POS-017 (davriylik), EP-POS-063 (freeze), EP-POS-064 (limit)
- **action:** CREATE
- **⤳ Ta'sir:** GL, ombor balansi
- **Xoch-havolalar:** `[Module-19] Item 65` · `[Module-19] Item 22` *(taxminiy — sikl-sanash)* · `EXTRACTION QISM A #22` · `QISM D #22` · `TASDIQ-2146 §19 #15` · `QISM C 19.15` · `QISM I2 #31`
- **Δ 2026-07-11→08-07:** `6b0be639` (08-04) — o'lik meros `inventory-adjust` endpoint'i o'chirildi (**soxta muvaffaqiyat** qaytarardi, hech qanday chaqiruvchi yo'q edi) — ya'ni inventar tuzatish "ishladi" deb ko'rsatib, aslida hech nima yozmasdi.

### EP-POS-016 · Inventar farqini kim tasdiqlaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Avto GL posting, lekin moliya bo'limi tekshiradi va tasdiqlaydi (farq → zarar/ortiqcha yozuvi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q53 (avto GL + moliya tasdig'i)
- **Dalil (kod):** `pos-secondary-events.handler.ts:82-89` — `@OnEvent('pos.inventory_count.completed')` `finance_head` ga Telegram ("GL tuzatmalar qo'llandi") + in-app xabar yuboradi.
- **Nima yetishmaydi:** bu **xabar berish**, **tasdiq darvozasi emas** — moliya "tekshiradi va tasdiqlaydi" deyilgan, lekin GL yozuvi moliya tasdig'ini kutmaydi (avto qo'llanadi, keyin xabar ketadi). Avto-tasdiq limiti (EP-POS-064) ham yo'q.
- **Bog'liqlik:** EP-POS-064 (±N% limit), EP-POS-012 (GL), EP-POS-015
- **action:** APPROVE
- **⤳ Ta'sir:** Finance, audit
- **Xoch-havolalar:** `[Module-19] Item 66` · `[Module-19] Item 23` *(taxminiy — avto-tasdiq limiti)* · `EXTRACTION QISM A #23` · `QISM D #23` · `TASDIQ-2146 §19 #16` · `QISM C 19.16`
- **Δ 2026-07-11→08-07:** —

### EP-POS-017 · Inventar qancha tez-tez o'tkaziladi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** **A-default:** Sikl-sanash (har kuni bir guruh material aylanma) — uzluksiz aniqlik. BARCHA_JAVOBLAR faqat "qachon" (tunda/dam kuni) ni belgilagan, "qancha tez-tez" (davriylik) ni emas — egasi tasdig'i kerak.
- **Manba:** v1 Q17 (A-default); BARCHA_JAVOBLAR Q52 faqat vaqtni belgilaydi, davriylikni emas
- **Dalil (kod):** `pos_inventory_plans` jadvali `to_regclass` bilan jonli tasdiqlangan. Hech qanday **davriylik qiymati** ("har N kunda bir guruh") cron'ga ulanmagan — `apps/api/src/modules/pos/application/jobs/` da davriylikni haydovchi cron yo'q.
- **Nima yetishmaydi:** davriylik qiymati **egasi-DATA**. ⭐ **Lekin I2 intervyusi (§17 A6) buni allaqachon javoblagan:** "rulon/hom-ashyo **haftalik**, qolgani **oylik**; tunda/dam kuni, zona muzlatiladi". Ya'ni `decisions/19-pos.md` bu bandni 🔵 OCHIQ deb belgilagan, ammo I2 manbada javob **bor**.
- **Bog'liqlik:** EP-POS-015, EP-POS-063 (freeze), VR-POS-I06
- **action:** —
- **⤳ Ta'sir:** Aniqlik darajasi, MES (ish to'xtamasligi)
- **Xoch-havolalar:** `[Module-19] Item 67` · `[Module-19] Item 22` *(taxminiy)* · `EXTRACTION QISM A #22` · `QISM D #22` · `TASDIQ-2146 §19 #17` · `QISM C 19.17` · `QISM I2 #31` ⭐
- **⚠️ ZIDDIYAT:** `decisions/19-pos.md` + `QISM C 19.17` (ikkalasi "egasi-data / OCHIQ") vs **`QISM I2 #31`** (2026-06-08, egasining to'g'ridan javobi): "rulon/hom-ashyo **haftalik**, qolgani **oylik**". Intervyu javob bergan, qaror-xaritasi buni ko'rmagan. **Tavsiya:** qaror-holatini ✅ ga o'tkazish (`business_settings` da `pos.cycle_count_period_days_hot=7` / `..._cold=30` bilan CRUD-sozlanadigan qilib).
- **Δ 2026-07-11→08-07:** —

### EP-POS-018 · Ichki ko'chirish (ombordan omborga)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Yagona INTERNAL_TRANSFER harakati: bir xil tip = tezkor (tasdiqsiz), boshqa tip = menejer tasdiq. Manba kamayadi, qabul qo'shiladi. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q25 (INTERNAL_TRANSFER)
- **Dalil (kod):** `movement-enums.ts:12` — `INTERNAL_TRANSFER` o'z `KOCHIRISH` kategoriyasida; `pos_movements.from_warehouse_id`/`to_warehouse_id` ustunlari jonli. `QISM D #43`: `auto-gl-posting.service.ts:150` filtri `debitAccount !== creditAccount` — 1010↔1010 kanonik `entries`ga **yozilmaydi** (netto nol, to'g'ri).
- **Nima yetishmaydi:** subledger `pos_gl_postings` ga hamon **wash-qator** yoziladi (`:76-78` `calculateEntries()` da `INTERNAL_TRANSFER` case) — ya'ni "GL yozuv yo'q" faqat yarim bajarilgan. "Bir xil tip = tasdiqsiz / boshqa tip = menejer" farqlanishi kodda tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-031 (ichki logistika), EP-POS-012 (GL), EP-POS-047 (WIP)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor balansi, menejer tasdiq
- **Xoch-havolalar:** `[Module-19] Item 68` · `[Module-19] Item 43` *(taxminiy — transfer GL-skip)* · `EXTRACTION QISM A #43` · `QISM D #43` · `TASDIQ-2146 §19 #18` · `QISM C 19.18`
- **Δ 2026-07-11→08-07:** —

### EP-POS-019 · AI-taklif — nima tavsiya qiladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** AI to'liq yordamchi: rejalashtirish (zakaz tavsiyasi), Debit/Credit hisoblash, GL. AI analytics rejalashtirish uchun. (v1-A ruhida — to'liq aqlli yordamchi)
- **Manba:** BARCHA_JAVOBLAR Q57 (AI rejalashtirish), Q43 (AI GL), Q58 (real-time ERP integratsiya)
- **Dalil (kod):** GL tomoni real, lekin **qoidaviy** (`GL_PAIRS`/`calculateEntries`, qv. EP-POS-013). **AI xarid-tavsiya dvigateli topilmadi** — `Grep "mm_purchase_requests|AI_AUTO"` POS'da hech nima qaytarmadi. `material-norms.service.ts` da AI-norma (tarixiy iste'moldan o'rtacha, `POS_AI_NORM_MIN_SAMPLE_SIZE`) bor — bu yagona "AI"-ga o'xshash qism, u ham statistik o'rtacha.
- **Nima yetishmaydi:** vizyondagi "to'liq aqlli yordamchi" yo'q — na LLM, na tavsiya dvigateli. ⚠️ I2 #26: egasi AI-planning'ni `/erp-dashboard/planning` da ko'rmoqchi — memory bo'yicha bu **ochiq bo'shliq**.
- **Bog'liqlik:** EP-POS-011, EP-POS-020 (anomaliya), EP-POS-065 (avto PR), VR-POS-I09
- **action:** AI
- **⤳ Ta'sir:** AI, MM, Notifications
- **Xoch-havolalar:** `[Module-19] Item 69` · `[Module-19] Item 36` *(taxminiy)* · `EXTRACTION QISM A #36` · `QISM D #36` · `TASDIQ-2146 §19 #19` · `QISM C 19.19` · `QISM I2 #26`
- **Δ 2026-07-11→08-07:** —

### EP-POS-020 · AI anomaliya aniqlash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** AI shubhali harakatni belgilab boshliqqa signal (proaktiv). BARCHA_JAVOBLAR AI'ni rejalashtirish/GL uchun tasdiqlagan, lekin anomaliya-signal mexanizmini aniq belgilamagan — egasi tasdig'i kerak (EP-POS-077 bilan birga).
- **Manba:** v1 Q20 (A-default); BARCHA_JAVOBLAR Q57 (AI bor, anomaliya aniq emas)
- **Dalil (kod):** `[Module-19] Item 70` = **STALE-DOC**. `QISM C 19.20` "Yo'q; POS'da detektor yo'q" **noto'g'ri** — `pos-anomaly.service.ts` to'liq o'qildi: to'liq qoidaviy anomaliya-detektori mavjud, harakatlarni `pos_anomaly_flags` (jonli jadval) ga belgilaydi, boshliq rollariga xabar beradi va `broadcastPosEvent('anomaly.detected', …)` uzatadi. `pos-anomalies.controller.ts` + `pos-anomaly.listener.ts` ham bor. `QISM D #15`: `evaluateMovement()` (`:64`), `(movement_id, rule_code)` UNIQUE (idempotent), `ANOMALY_ALERT_ROLES` (`:39`), **blok yo'q** (E1 printsipiga mos).
- **Nima yetishmaydi:** alohida `penalty_confirmed` (boshliq-tasdiq) ustuni tasdiqlanmadi — vizyon `flagged_by_ai` (avto) va `penalty_confirmed` (inson) ni **ikki alohida ustun** deb talab qiladi. ⚠️ **Ochiq (2026-08-06):** anomaliya qoidalarining chegara-qiymatlari (5 ta konstanta) kompilyatsiya-vaqtida qattiq yozilgan — egasi CRUD orqali sozlay olmaydi (Q-40 / threshold-CRUD qoidasini buzadi).
- **Bog'liqlik:** EP-POS-077 (tungi anomaliya), EP-POS-044 (norma-fakt), VR-POS-I11
- **action:** —
- **⤳ Ta'sir:** AI, HR (boshliq signal)
- **Xoch-havolalar:** `[Module-19] Item 70` · `[Module-19] Item 15` *(taxminiy — flagged_by_ai/penalty_confirmed)* · `EXTRACTION QISM A #15` · `QISM D #15` · `TASDIQ-2146 §19 #20` · `QISM C 19.20`
- **⚠️ ZIDDIYAT:** `QISM C 19.20` (2026-06-27) + `decisions` Xulosa ("Yo'q — detektor yo'q, EP-POS-020 OCHIQ") vs `QISM D #15` (2026-07-07) va `[Module-19] Item 70` (2026-07-11) — **detektor to'liq qurilgan**. QISM C xato; qaror-o'qi hamon OCHIQ, qurilish-o'qi STALE-DOC.
- **Δ 2026-07-11→08-07:** —

### EP-POS-021 · Offline rejim — internet yo'qda
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** To'liq offline rejim ishlaydi (internet o'chsa ham), keyin avto-sinxron. Responsive web (PWA). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q8 (to'liq offline), Q3 (responsive web)
- **Dalil (kod):** `pos-sync.service.ts` to'liq o'qildi — `push()`/`pull()` delta-sinxron, `PENDING`/`SYNCED`/`CONFLICT` holatlari; `pos_movements.is_offline_sync`/`offline_queue_id` ustunlari jonli. `QISM D #44` = **Ha**: FE `PosOfflineBanner.tsx:17,26` IndexedDB `pos_monitor_offline` + `crypto.randomUUID()` (:51) + `useOfflineSync` hook; BE `pos_offline_queue.retryCount` (`pos-schema-v2.ts:520`). `QISM D #4` = **Ha**: `clientUuid` dedup → `ConflictException`, `markConflict` + `conflictReason`, `idempotencyKey`.
- **Nima yetishmaydi:** idempotentlik **UUID** bilan (vizyonda SHA256 aytilgan — funksional ekvivalent, lekin spetsifikatsiyadan og'ish). "3 retry" chegarasi `retryCount` ustunida bor, lekin qat'iy 3-limitni majburlash tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-070 (konflikt), EP-POS-026 (PWA ekran)
- **action:** CREATE
- **⤳ Ta'sir:** Sinxron, balans/GL
- **Xoch-havolalar:** `[Module-19] Item 71` · `[Module-19] Item 4` · `[Module-19] Item 44` *(taxminiy)* · `EXTRACTION QISM A #4` · `QISM A #44` · `QISM D #4` · `QISM D #44` · `TASDIQ-2146 §19 #21` · `QISM C 19.21`
- **Δ 2026-07-11→08-07:** —

### EP-POS-022 · Harakatni bekor qilish/tuzatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Faqat DRAFT holatda bekor; tasdiqlangan harakat — teskari (storno) harakat yoziladi (o'chirish yo'q, tarix saqlanadi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q27 (DRAFT bekor / tasdiqlangan = teskari harakat)
- **Dalil (kod):** `MovementStatus.CANCELLED` jonli, `onMovementCancelled` handler bor (`pos.events.ts:241-247`); `pos_movements_archive` jadvali jonli.
- **Nima yetishmaydi:** ⭐ **STORNO YO'Q.** `QISM D #29`: grep `storno|reversal|reverse|reversed` @ pos → mazmunli hit yo'q (faqat massiv `.reverse()`). Teskari GL yozuvi, `original_movement_id`, ikki-storno 409 guard'i — **hech biri yo'q**. Ya'ni tasdiqlangan harakatni tuzatishning yagona yo'li = `INTERNAL_RETURN` yoki `INVENTORY_ADJUST` (semantik jihatdan boshqa narsa) → GL'da toza audit-iz yo'q.
- **Bog'liqlik:** EP-POS-012 (GL), EP-POS-080 (audit), EP-POS-016
- **action:** DELETE/CREATE (storno)
- **⤳ Ta'sir:** Audit, GL tarixi
- **Xoch-havolalar:** `[Module-19] Item 72` · `[Module-19] Item 29` *(taxminiy — storno)* · `EXTRACTION QISM A #29` · `QISM D #29` · `TASDIQ-2146 §19 #22` · `QISM C 19.22`
- **⚠️ ZIDDIYAT:** `QISM C 19.22` (2026-06-27) "**Ha** — quarantine cancelled; movements_archive" vs `QISM D #29` + `[Module-19] Item 72` "storno mexanizmi umuman yo'q". QISM C bekor-qilishni ko'rgan, **storno**ni emas — ular boshqa talab. Registrda **Qisman**.
- **Δ 2026-07-11→08-07:** —

### EP-POS-023 · Brak/yaroqsiz material harakati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Alohida DAMAGE (zarar akti) harakati — QC moduliga avtomatik o'tadi + GL zarar hisobiga. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q26 (DAMAGE → QC avto)
- **Dalil (kod):** `movement-enums.ts:11` — `DAMAGE` o'z `ZARAR` kategoriyasida; `auto-gl-posting.service.ts:73-75` — `case 'DAMAGE'` `DAMAGE_EXPENSE`/`WAREHOUSE_RM` ga yozadi; `pos-secondary-events.handler.ts:64-74` — `@OnEvent('pos.damage.qc_required')` `qc_inspector` roliga xabar beradi.
- **Nima yetishmaydi:** — (uch oyoq ham ulangan: tur + GL + QC event). Qolgan bo'shliq: brak **normasi** har buyurtmaga va normadan oshsa xodimdan ushlab qolish (I2 #11) — bu POS'da yo'q (→ VR-POS-I05).
- **Bog'liqlik:** EP-POS-036 (chiqindi), EP-POS-069 (foto-dalil), EP-POS-013
- **action:** CREATE/EVENT
- **⤳ Ta'sir:** QC, Finance (zarar)
- **Xoch-havolalar:** `[Module-19] Item 73` · `TASDIQ-2146 §19 #23` · `QISM C 19.23` · `QISM I2 #11`
- **Δ 2026-07-11→08-07:** `4241faa0` (07-13) — Finance'da `loss` GL hisobi qo'shildi (DAMAGE xaritalanishini mustahkamlaydi).

### EP-POS-024 · Tayyor mahsulot (FG) ishlab chiqarishdan ombarga qabuli
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** FG bir xil POS tizimida boshqariladi; ERP MES bilan to'liq real-time integratsiya (REST API) — MES sessiyasidan FG-kirim. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q34 (FG POS'da), Q58 (MES real-time integratsiya)
- **Dalil (kod):** FG uchun GL (`WAREHOUSE_FG` hisobi) `auto-gl-posting.service.ts` da ulangan (`EXTERNAL_OUT` COGS oyog'i). **`mes.production_session.completed` listener'i POS'da YO'Q** (`[Module-19] Item 31` = Yo'q, SB0569/SB0553 STILL-OPEN) → avtomatik MES→POS FG-kirimi jonli emas.
- **Nima yetishmaydi:** ⭐ **GOLDEN-THREAD UZUQ** — MES sessiyasi yopilganda avto FG-kirim DRAFT (QC_PENDING) yaratilmaydi. I2 #13 egasining talabi: "Tayyor mahsulot KIRIM **MES'dan** (planning+MES real), faqat buyurtmaga, menejer javobgar" — bu zanjir amalda ishlamaydi; FG omborga qo'lda kiritiladi.
- **Bog'liqlik:** EP-POS-047 (WIP), EP-POS-048 (FG pasporti), EP-POS-072 (FG jo'natish), VR-POS-I04
- **action:** CREATE/EVENT
- **⤳ Ta'sir:** MES, ombor balansi
- **Xoch-havolalar:** `[Module-19] Item 74` · `[Module-19] Item 31` *(taxminiy — MES→FG listener)* · `[Module-19] Item 49` *(taxminiy — mes_session_id FK)* · `EXTRACTION QISM A #31` · `QISM A #49` · `QISM D #49` · `TASDIQ-2146 §19 #24` · `QISM C 19.24` · `QISM I2 #13`
- **Δ 2026-07-11→08-07:** —

### EP-POS-025 · Partiya/seriya (lot) kuzatuvi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Partiya kuzatiladi (Code-128 partiya uchun, FIFO/FEFO partiya narxi bo'yicha). Muddatli → FEFO, muddatsiz → FIFO. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q15 (Code-128 partiya), Q35 (FIFO partiya narxi), Q37 (FEFO/FIFO)
- **Dalil (kod):** `pos_movement_lines.lot_number`/`batch_number`/`serial_number_item_id` ustunlari jonli; `SELECT count(*) FROM batch_lot_movements` → jadval bor, **0 qator**. `QISM D #6` = **Ha**: `pos-fifo.service.ts:46-72` `getCandidates` `hasExpiry` → FEFO (`expiry_date ASC`) / FIFO (`received_date ASC`), `WHERE status='ACTIVE'` (EXPIRED partiya kandidatdan chiqariladi = blok).
- **Nima yetishmaydi:** ⭐ FIFO/FEFO tanlash servisi **mavjud bo'lmagan jadvallarga** (`pos_batches`, `pos_materials`) so'rov yuboradi → runtime'da ishlamaydi (qv. EP-POS-014). `batch_lot_movements` 0 qator.
- **Bog'liqlik:** EP-POS-014 (FIFO), EP-POS-060 (muddat), EP-POS-033 (barcode)
- **action:** CREATE
- **⤳ Ta'sir:** QC, MM, muddat
- **Xoch-havolalar:** `[Module-19] Item 75` · `[Module-19] Item 5` · `[Module-19] Item 6` *(taxminiy)* · `EXTRACTION QISM A #5` · `QISM A #6` · `QISM D #6` · `TASDIQ-2146 §19 #25` · `QISM C 19.25`
- **⚠️ ZIDDIYAT:** `QISM D #6` (2026-07-07) "**Ha** — `pos_batches` (data-check rowcount)" vs `[Module-19] Item 6` (2026-07-11) "`to_regclass('pos_batches')` → **null**, jadval yo'q, cron har kecha jimgina no-op". Item to'g'ri — QISM D "data-check" ni bajarmagan. **Bu POS'dagi eng jiddiy yashirin nosozlik:** har kecha 02:00 da `markExpiredBatches` xato beradi, xato `Err` ichida yutiladi, log'da hech nima ko'rinmaydi.
- **Δ 2026-07-11→08-07:** —

### EP-POS-026 · POS Monitor planshet ekrani ko'rinishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-04 Δ)*
- **Talab:** Responsive web (PC + planshet + smartphone), skaner-markaz. Xato: kichik → toast, katta → modal dialog. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q3 (responsive web), Q9 (toast/modal)
- **Dalil (kod):** `[Module-19] Item 76` — auditning o'zi "**mustaqil qayta tekshirilmadi** (faqat frontend da'vosi)" deb belgilagan: o'sha o'tish faqat `apps/api/src` ni qamragan, FE fayllari o'qilmagan. `QISM C 19.26` (2026-06-27) "Ha — `PosMonitorApp` + `PosLayout`; 44 sahifa".
- **Nima yetishmaydi:** responsive layout mustaqil tasdiqlanmagan. ⭐ **Eng muhimi:** I2 #1 da egasi "**umuman man xohlagan narsa emas**" degan — ya'ni mavjud 44 sahifa uning talabiga javob bermaydi; to'liq qayta loyihalash so'ralgan, bajarilgani hujjatlanmagan (→ VR-POS-I01). I2 #6: ombor ko'rinishi **Excel jadval** bo'lishi kerak (kartochka emas) — bu FE talab ham tekshirilmagan.
- **Bog'liqlik:** EP-POS-021 (PWA), EP-POS-082 (til/ko'rinish), VR-POS-I01, VR-POS-I02
- **action:** READ
- **⤳ Ta'sir:** UX, i18n
- **Xoch-havolalar:** `[Module-19] Item 76` · `TASDIQ-2146 §19 #26` · `QISM C 19.26` · `QISM I2 #1` ⭐ · `QISM I2 #6`
- **⚠️ ZIDDIYAT:** `QISM C 19.26` "Ha" vs `[Module-19] Item 76` "mustaqil tasdiqlanmadi" vs **`QISM I2 #1`** (egasi: "xohlagan narsam emas"). Registrda **Qisman** — kod bor, lekin egasi qabul qilmagan.
- **Δ 2026-07-11→08-07:** `3d605103` (08-04) — WebSocket cookie-auth tuzatildi → planshetda real-time yangilanish endi ishlaydi (avval jimgina ulanmasdi).

### EP-POS-027 · Harakat hisoboti va smena yopilishi
- **Qaror holati:** ✅ JAVOBLANGAN *(qisman — smena formal yopilishi sodda)*
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Smena boshqaruvi kerak emas — faqat audit log (kim qachon kirdi/chiqdi). Kunlik harakat jurnali + ombor qoldiqlari hisoboti bor. (v1-B ruhida — rasmiy yopilish yumshoq)
- **Manba:** BARCHA_JAVOBLAR Q11 (smena emas, audit log), Q56 (harakat jurnali, qoldiqlar)
- **Dalil (kod):** `pos-reports.service.ts` mavjud; `SELECT count(*) FROM pos_audit_log` → **65 qator**. `pos_shift_audit` jadvali ham bor.
- **Nima yetishmaydi:** — (qaror bo'yicha to'liq). ⚠️ Lekin `decisions` ning o'z eslatmasi: v2 EP-POS-050 (smena topshirish akti, 2 imzo) bu qarorni **ziddiyatga** solib qo'yadi (qv. EP-POS-050 ZIDDIYAT).
- **Bog'liqlik:** EP-POS-050 (smena akti — ziddiyat), EP-POS-075 (vertikal hisobot), EP-POS-080 (audit)
- **action:** READ/EXPORT
- **⤳ Ta'sir:** Audit, HR
- **Xoch-havolalar:** `[Module-19] Item 77` · `TASDIQ-2146 §19 #27` · `QISM C 19.27`
- **Δ 2026-07-11→08-07:** —

### EP-POS-028 · Master-data — harakat turlari ro'yxati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Harakat turlari aniq belgilangan: EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE (kod-darajada qat'iy). Yangi sabab/sozlama admin panelda kengaytiriladi (Notifications matritsasi bilan birga). (v1-A/B aralash — turlar qat'iy, sabablar moslashuvchan)
- **Manba:** BARCHA_JAVOBLAR Q21–Q26 (movement types qat'iy)
- **Dalil (kod):** `SELECT count(*) FROM pos_movement_types` → **11 qator** (hujjatdagi 7 dan o'sgan); `movement-enums.ts` mos 12-kodli enum + `is_issue`/yo'nalish semantikasini belgilaydi.
- **Nima yetishmaydi:** turlar qat'iy va to'liq (12 kod), lekin **sabablar katalogi** (admin panelda kengaytiriladigan) yo'q — `pos_overage_reasons` topilmadi. `EXTRACTION QISM A` ochiq-savoli "taksonomiya faqat 2/6 tur jonli" (2026-07-04) endi eskirgan: 11 tur jonli.
- **Bog'liqlik:** EP-POS-005 (sabab), EP-POS-013 (GL xaritasi — 4 tur xaritalanmagan), EP-POS-071 (Notif matritsasi)
- **action:** CREATE (admin)
- **⤳ Ta'sir:** GL mapping, Notifications
- **Xoch-havolalar:** `[Module-19] Item 78` · `TASDIQ-2146 §19 #28` · `QISM C 19.28`
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A` Ochiq-savollar (2026-07-04, SB0536/SB0540): "faqat 2/6 tur jonli (EXTERNAL_IN, INTERNAL_ISSUE)" vs `[Module-19] Item 78` (2026-07-11): "**11 qator**". Bu **data**-o'sishi (jadval qatorlari), taksonomiya kodi doim 12 edi. Item to'g'ri.
- **Δ 2026-07-11→08-07:** —

### EP-POS-029 · POS Monitor karta-model bilan integratsiya (GSD)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** To'liq ERP integratsiya (HR ham). Omborchi statistikasi POS harakatlaridan chiqadi (analytics: ombor menejer kunlik). Aniq 3-ko'rsatkichli GSD formula EP-POS-056'da nozik (ochiq).
- **Manba:** BARCHA_JAVOBLAR Q58 (HR real-time integratsiya), Q57 (ombor menejer kunlik analytics)
- **Dalil (kod):** `Grep "PosGsdService|pushDailyMetrics|hr_kpi_snapshots"` → **fayl yo'q**. `warehouse-kpi.service.ts` bor, lekin karta/GSD jadvaliga yozishi tasdiqlanmadi. SB0300 STILL-OPEN (karta GSD write yo'q), SB0572 UNVERIFIABLE.
- **Nima yetishmaydi:** ⭐ **Karta-model bog'i umuman yo'q** — POS harakatlaridan chiqadigan KPI hech qachon xodim kartasiga yozilmaydi. Bu **karta-markazli vizyonning** POS'dagi asosiy uzilishi: harakatlar bor, KPI hisoblanadi, lekin `hr_kpi_snapshots` / `card_id` ga yozuv yo'li mavjud emas.
- **Bog'liqlik:** EP-POS-056 (GSD formula — egasi-data), EP-POS-075 (vertikal hisobot), EP-POS-074
- **action:** AI/READ
- **⤳ Ta'sir:** HR (karta GSD), Director
- **Xoch-havolalar:** `[Module-19] Item 79` · `[Module-19] Item 14` *(taxminiy — KPI→karta)* · `EXTRACTION QISM A #14` · `TASDIQ-2146 §19 #29` · `QISM C 19.29`
- **Δ 2026-07-11→08-07:** —

### EP-POS-030 · POS Monitor va ikki-ombor dunyosi (kanonik jadval)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-04 Δ)*
- **Talab:** Real-time har harakat darhol PostgreSQL'ga yoziladi; ERP DB ning bir qismi (alohida server yo'q). Kanonik jadval = yagona haqiqat (WMS `warehouse_stock` yo'nalishi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q1 (ERP DB qismi), Q39 (real-time PostgreSQL); memory `reference_live_db_location` (kanonik = `warehouse_stock`)
- **Dalil (kod):** `SELECT count(*) FROM warehouse_stock` → **39 qator**; `information_schema.columns` to'liq jonli sxemani tasdiqlaydi (`quantity`/`available_quantity`/`reserved_quantity`/`owner_type`/`bin_location_id`…); `pos-warehouse-integration-movement.service.ts` dagi `decreaseFromWarehouseStock()`/`increaseToWarehouseStock()` to'g'ridan-to'g'ri unga yozadi.
- **Nima yetishmaydi:** — (kanonik jadval yagona, dublikat yozuv yo'q). ✅ **2026-08-06 topilmasi TASDIQLANADI:** POS↔WMS sinxronizatsiyasi regressiyasiz.
- **Bog'liqlik:** EP-POS-010 (balans-guard), EP-POS-066 (rezerv), EP-POS-061 (bin)
- **action:** CREATE
- **⤳ Ta'sir:** WMS, butun ombor balansi
- **Xoch-havolalar:** `[Module-19] Item 80` · `[Module-19] Item 16` *(taxminiy — reserved/available)* · `EXTRACTION QISM A #16` · `TASDIQ-2146 §19 #30` · `QISM C 19.30`
- **Δ 2026-07-11→08-07:** `1753ed0d` (08-04) — stock-ledger balansi kanonik `warehouse_stock` ga to'liq o'tkazildi. `63ab63b0`+`993c5175` (08-05/06) — POS ombor-ro'yxati predikati WMS bilan moslashtirildi (`deleted_at` + `isActive` bug).

### EP-POS-031 · Ichki logistika harakati alohida turmi (yarim tayyor ko'chirish)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Ha — INTERNAL_TRANSFER (ombor ko'chirish) harakati mavjud; yarim tayyor sex-pozitsiyalar orasida shu orqali ko'chadi, balans ko'rinadi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q25 (INTERNAL_TRANSFER), Q29 (PRODUCTION_* omborlari)
- **Dalil (kod):** `[Module-19] Item 81` = Item 68 bilan bir xil — `INTERNAL_TRANSFER` harakat turi jonli, `from_warehouse_id`/`to_warehouse_id` ustunlari bilan. `QISM C 19.31`: `PRODUCTION_OFFSET`/`PRODUCTION_FLEXO` + `WIP` omborlari jonli.
- **Nima yetishmaydi:** — (qurilgan). Qolgan bo'shliq: I2 #33 dagi to'liq PP routing zanjiri (hom-ashyo→flekso→ofset→kashirovka→tigel→qadoqlash) bo'yicha **qoldiq nazorati** har bosqichda tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-018, EP-POS-047 (WIP bosqichlari)
- **action:** CREATE
- **⤳ Ta'sir:** MES (sex qoldig'i), PP, ombor balansi
- **Xoch-havolalar:** `[Module-19] Item 81` · `TASDIQ-2146 §19 #31` · `QISM C 19.31` · `QISM I2 #33`
- **Δ 2026-07-11→08-07:** —

### EP-POS-032 · Texkarta-material mosligi tekshiruvi (chiqimdan oldin)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Chiqimda buyurtma tanlanadi → texkarta materiali bilan skan mos kelmasa qizil ogohlantirish + bloklash (A3: hech kim — qat'iy blok yoki A1: smena boshlig'i ruxsati). BARCHA_JAVOBLAR bu texkarta-mosligi guardini aniq yoritmagan — eng qimmat xato bo'lgani uchun egasi tasdig'i muhim.
- **Manba:** v2 Q32 (A-default); BARCHA_JAVOBLAR'da to'g'ridan to'g'ri yo'q
- **Dalil (kod):** `[Module-19] Item 82` = **STALE-DOC**. `QISM C 19.32` "Yo'q; grep=0; balance-guard faqat miqdor" **noto'g'ri** — `pos-techcard-gate.service.ts` to'liq o'qildi: `checkLines()` chiqim qatoridagi material texkartaga mos kelmasa **qattiq bloklaydi** (`allowed:false`), WMS `OutboundEnforcementService.checkIssueAllowed` ni qayta ishlatadi, natijani `pos_movement_techcard` (jonli jadval) ga saqlaydi, `recheckOnOrderChange()` buyurtma o'zgarganda qayta tekshiradi; `movements.controller.ts:179` da ulangan. `QISM D #3`: `pos-movement.service.ts:281-288` `BadRequestException`.
- **Nima yetishmaydi:** **boshliq-override yo'li yo'q** — `grep override_approved_by` → 0. Ya'ni faqat A3 (qat'iy blok) qurilgan, A1 (smena boshlig'i ruxsati) yo'q. Egasi qaysi variantni tanlashini tasdiqlamagan → qaror-o'qi hamon 🔵.
- **Bog'liqlik:** EP-POS-033 (gofra qavat), EP-POS-044 (norma-fakt), EP-POS-076 (buyurtma o'zgarishi)
- **action:** —
- **⤳ Ta'sir:** PP (texkarta), MES (to'xtash), QC (brak)
- **Xoch-havolalar:** `[Module-19] Item 82` · `[Module-19] Item 3` *(taxminiy)* · `EXTRACTION QISM A #3` · `QISM D #3` · `TASDIQ-2146 §19 #32` · `QISM C 19.32`
- **⚠️ ZIDDIYAT:** `QISM C 19.32` "Yo'q (grep=0)" vs `QISM D #3` (2026-07-07) va `[Module-19] Item 82` (2026-07-11) — **to'liq qurilgan va ulangan**. QISM C xato (noto'g'ri kalit-so'z bilan qidirgan).
- **Δ 2026-07-11→08-07:** —

### EP-POS-033 · Gofra qavati / qog'oz grammaji chiqimda farqlanadimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har grammaj/qavat alohida material kartasi (barcode darajasida farqli) — EAN-13 har kartochka uchun unikal; aralashtirib bo'lmaydi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q15 (EAN-13 har material), Q18 (yangi kartochka)
- **Dalil (kod):** `pos-techcard-gate.service.ts:32-33,73` — ixtiyoriy `issuedLayer` (gofra-qavat) parametri `OutboundEnforcementService.checkIssueAllowed` ga uzatiladi → qavat-moslik darvoza darajasida **mavjud**. `pos_barcode_map` hamon **0 qator**.
- **Nima yetishmaydi:** qavat-spetsifik barcode master-data'si to'ldirilmagan (egasi-DATA). Ya'ni mexanizm bor, ma'lumot yo'q → amalda gofra qavatlari farqlanmaydi.
- **Bog'liqlik:** EP-POS-006 (barcode xarita), EP-POS-032 (texkarta gate), EP-POS-078 (karta yaratish)
- **action:** CREATE
- **⤳ Ta'sir:** MM (katalog), QC
- **Xoch-havolalar:** `[Module-19] Item 83` · `[Module-19] Item 32` *(taxminiy — rulon sertifikati)* · `QISM D #32` · `TASDIQ-2146 §19 #33` · `QISM C 19.33` · `QISM I2 #9`
- **Δ 2026-07-11→08-07:** —

### EP-POS-034 · Laboratoriya qabuli — kirim laborantga bog'liqmi (karantin)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** Ha — barcha EXTERNAL_IN avval KARANTIN omboriga; QC tasdiqlasa → asosiy omborga, chiqim shundan keyin. Karantindan chiqishni QC tasdiqlaydi. (v2-A; A2/A3)
- **Manba:** BARCHA_JAVOBLAR Q30 (kirim → karantin → QC), Q21 (5-bosqich KARANTIN→QC), Q29 (QUARANTINE ombori)
- **Dalil (kod):** `[Module-19] Item 84` = Item 54 bilan bir xil — `quarantine-workflow.service.ts` `moveToQuarantine()` / `STATUS_FLOW` (`karantin→qc_review→approved`) tasdiqlangan.
- **Nima yetishmaydi:** I2 #8 talabi "QC **dalolatnoma + parametr kiritmaguncha BLOK**" — QC natijasini majburiy hujjat bilan bog'lash darvozasi topilmadi; `qc_review` holatidan `approved` ga o'tish uchun dalolatnoma talab qilinmaydi.
- **Bog'liqlik:** EP-POS-004 (kirim oqimi), EP-POS-035 (rad etilsa), EP-POS-049 (lab namuna)
- **action:** APPROVE
- **⤳ Ta'sir:** QC (lab xulosasi), MM, PP
- **Xoch-havolalar:** `[Module-19] Item 84` · `TASDIQ-2146 §19 #34` · `QISM C 19.34` · `QISM I2 #8` · `QISM I2 #5`
- **Δ 2026-07-11→08-07:** `4d7422fc` (08-06) — karantin 48-soatlik eskalatsiyasi `business_settings` ga o'tkazildi (CRUD-sozlanadigan). `9ea7c155` (08-07) — ⭐ **ikkinchi (parallel) karantin yo'li birlashtirildi**: `pos-inventory-passport.service.ts:64,70` literal `48` ishlatardi → egasi CRUD'da soatni o'zgartirsa ikki tizim ziddiyatli ishlardi; shu commit'da `pos-telegram-ext.service.ts:20` dagi aniqlanmagan `POS_TELEGRAM_BOT_TOKEN` ham tuzatildi (`TELEGRAM_BOT_TOKEN` ga fallback) — avval "QC tekshiruv kerak" xabari **jimgina no-op** edi. **2026-08-06/07 topilmalari TASDIQLANADI** (live: `pos-telegram-ext.service.ts:26` da fallback bor).

### EP-POS-035 · Lab "rad etdi" bo'lsa material taqdiri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** QC CHIQARISH qarori → ta'minotchiga qaytariladi; yoki DEFECTIVE omborga. Bloklangan holatda chiqarib bo'lmaydi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q31 (QC CHIQARISH → ta'minotchiga qaytish), Q29 (DEFECTIVE ombori)
- **Dalil (kod):** `quarantine-workflow.service.ts:24,32` — `rejected` holati bor va `cancelled` ga oqadi. Lab-radidan **maxsus** ishga tushadigan `DEFECTIVE`/`SCRAP` harakat-turi shoxi topilmadi.
- **Nima yetishmaydi:** ⭐ `QISM A #46` / `QISM C 19.59`: `qc.inspection.rejected` → avto `EXTERNAL_RETURN` + kredit-nota + yetkazib beruvchi reytingini kamaytirish zanjiri **yo'q** (`grep credit_note` → 0). Material "rad etildi" deb belgilanadi, keyin qo'lda hal qilinadi.
- **Bog'liqlik:** EP-POS-059 (ta'minotchiga qaytarish), EP-POS-052 (qisman qabul), EP-POS-037 (makulatura ombori)
- **action:** CREATE/REJECT
- **⤳ Ta'sir:** QC, MM (yetkazib beruvchi reytingi), Finance (qaytarish)
- **Xoch-havolalar:** `[Module-19] Item 85` · `[Module-19] Item 46` *(taxminiy — QC rejected→EXTERNAL_RETURN)* · `EXTRACTION QISM A #46` · `TASDIQ-2146 §19 #35` · `QISM C 19.35` · `QISM I2 #11`
- **⚠️ ZIDDIYAT:** `QISM C 19.35` (2026-06-27) "**Ha** — STATUS_FLOW rejected; SCRAP-MAIN live" vs `[Module-19] Item 85` (2026-07-11) "**Qisman** — lab-radidan ishga tushadigan DEFECTIVE/SCRAP shoxi yo'q". Item to'g'ri: `rejected` holati bor, ammo **material taqdiri avtomatik hal qilinmaydi**.
- **Δ 2026-07-11→08-07:** —

### EP-POS-036 · Chiqindi va qoldiq (отходы) hisobga olinadimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-13 Δ)*
- **Talab:** **A-default:** Alohida "chiqindi/qoldiq kirimi" harakati (makulatura ombori) — keyin sotuv/qayta ishlatish hisobga tushadi (A1: stanok normasidan avto reja-fakt). BARCHA_JAVOBLAR chiqindi-harakatini aniq belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q36 (A-default); BARCHA_JAVOBLAR'da to'g'ridan to'g'ri yo'q
- **Dalil (kod):** `[Module-19] Item 86` = **STALE-DOC**. `QISM C 19.36` "Yo'q; grep=0; alohida tur yo'q" **noto'g'ri** — `movement-enums.ts:16` da `WASTE_IN = 'WASTE_IN'` harakat turi mavjud (izoh: "chiqindi/qoldiq (makulatura) kirim"), `KIRIM` kategoriyasida. `QISM D #20`: kontekst maydoni `wasteSource` (`pos-schema-v2.ts:32,212`), `pos-movement.service.ts:425` da saqlanadi.
- **Nima yetishmaydi:** ⭐ **`auto-gl-posting.service.ts` switch'ida `case 'WASTE_IN'` YO'Q** → xaritalanmagan `default` shoxiga tushadi, **nol GL yozuvi**. Ya'ni chiqindi kirimi miqdor sifatida yoziladi, lekin **hech qanday qiymatga ega emas** — "keyin sotuv hisobga tushadi" zanjiri uzuq. Reja-fakt (stanok normasidan) ham yo'q.
- **Bog'liqlik:** EP-POS-037 (makulatura ombori), EP-POS-013 (GL xaritasi), EP-POS-068 (bichish qoldig'i), EP-POS-023 (DAMAGE)
- **action:** —
- **⤳ Ta'sir:** Finance (chiqindi sotuvi), MM (makulatura kartasi)
- **Xoch-havolalar:** `[Module-19] Item 86` · `[Module-19] Item 20` *(taxminiy — SCRAP_IN)* · `EXTRACTION QISM A #20` · `QISM D #20` · `TASDIQ-2146 §19 #36` · `QISM C 19.36` · `QISM I2 #11`
- **⚠️ ZIDDIYAT:** `QISM C 19.36` "Yo'q — alohida tur yo'q" vs `[Module-19] Item 86` "`WASTE_IN` turi **bor**". Item to'g'ri; lekin QISM C ning asosiy tashvishi (chiqindi hisobga olinmaydi) **hamon o'rinli** — GL xaritasi yo'q.
- **Δ 2026-07-11→08-07:** `4241faa0` (07-13) — Finance'ga **`waste-income` GL hisobi** qo'shildi. Hisob endi mavjud, lekin `calculateEntries()` da `WASTE_IN` case'i **hali yozilmagan** — bir qadam qoldi.

### EP-POS-037 · Makulatura (ikkilamchi qog'oz) ombori alohida turmi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** **A-default:** Makulatura alohida ombor turi + barcode rangida farqli (toza topliner bilan aralashmaydi). BARCHA_JAVOBLAR ombor turlarini (MAIN/QUARANTINE/PRODUCTION/FINISHED/DEPARTMENT/QC/DEFECTIVE) sanagan, makulaturani alohida belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q37 (A-default); BARCHA_JAVOBLAR Q29 (ombor turlari, makulatura yo'q)
- **Dalil (kod):** `[Module-19] Item 87` = Qisman/STALE-DOC — `WASTE_IN` **harakat turi** mavjud (Item 86), bu `QISM C` ning "warehouses'da makulatura yo'q" umumiy da'vosiga harakat-turi darajasida zid. Lekin **ombor turi** (warehouse_type) darajasida makulatura uchun alohida tur topilmadi — QISM C ning aynan ombor-turiga oid da'vosi rad etilmadi.
- **Nima yetishmaydi:** alohida `SCRAP`/makulatura `warehouse_type` yo'q; makulatura sotuvi daromadi va uning GL xaritalanishi yo'q; "barcode rangida farqli" talab kodda yo'q. ⭐ **I2 #11 egasining javobi:** "Makulatura + brak + QC-rad = **bitta ombor**" — ya'ni egasi buni allaqachon javoblagan, `decisions` 🔵 OCHIQ deb belgilagan.
- **Bog'liqlik:** EP-POS-036 (chiqindi turi), EP-POS-035 (QC-rad), EP-POS-023 (brak)
- **action:** —
- **⤳ Ta'sir:** MM, EP-POS-032 (texkarta mosligi)
- **Xoch-havolalar:** `[Module-19] Item 87` · `[Module-19] Item 20` *(taxminiy)* · `EXTRACTION QISM A #20` · `QISM D #20` · `TASDIQ-2146 §19 #37` · `QISM C 19.37` · `QISM I2 #11` ⭐ · `QISM I2 #4`
- **⚠️ ZIDDIYAT:** `decisions` "🔵 OCHIQ — egasi tasdig'i kerak" vs **`QISM I2 #11`** (2026-06-08, egasi to'g'ridan): "makulatura+brak+QC-rad = **bitta ombor**". Bundan tashqari `QISM I2 #4` egasining 7 asosiy ombor ro'yxatida "**makulatura-brak**" alohida turadi. Ya'ni javob **bor**: bitta birlashgan ombor. **Tavsiya:** qaror-holatini ✅ ga o'tkazish.
- **Δ 2026-07-11→08-07:** `4241faa0` (07-13) — `waste-income` GL hisobi (makulatura sotuvi daromadi uchun) qo'shildi.

### EP-POS-038 · Rohler/poddon (ko'chirish vositasi) kuzatiladimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Poddon + o'lchov birligi ikkalasi (1 poddon = N rulon/kg avto konversiya) — amaliyotga mos. BARCHA_JAVOBLAR poddon-birligini aniq yoritmagan — egasi tasdig'i kerak.
- **Manba:** v2 Q38 (A-default); BARCHA_JAVOBLAR'da yo'q
- **Dalil (kod):** `[Module-19] Item 88` = **STALE-DOC**. `QISM C 19.38` "Yo'q; movement_lines'da poddon yo'q" **noto'g'ri** — `pos-shift-handover.service.ts:153-179` va `pos-shift-handover.repository.ts:110-140` to'liq o'qildi: `ReturnablePalletSchema` / `recordPallet()` / `getPalletBalance()` poddon/rohler birlik-kuzatuvini **to'liq amalga oshiradi**, maxsus `pos_returnable_pallets` jadvaliga (jonli tasdiqlangan). Endpointlar: `shift-handover.controller.ts:50,105` (`/pallets`, `/pallets/balance`).
- **Nima yetishmaydi:** "1 poddon = N rulon/kg **avto konversiya**" yo'q — poddon soni yozilади, lekin material birligiga konversiya qilinmaydi (qv. EP-POS-057). `RETURNABLE_ASSET` material-turi yo'q. Jadval Drizzle sxemasida emas, xom SQL orqali (`repo:115`).
- **Bog'liqlik:** EP-POS-039 (poddon qaytishi), EP-POS-057 (birlik konversiyasi), EP-POS-050 (smena akti)
- **action:** —
- **⤳ Ta'sir:** MM (poddon konversiyasi), IoT
- **Xoch-havolalar:** `[Module-19] Item 88` · `[Module-19] Item 12` *(taxminiy — RETURNABLE_ASSET)* · `EXTRACTION QISM A #12` · `QISM D #12` · `TASDIQ-2146 §19 #38` · `QISM C 19.38`
- **⚠️ ZIDDIYAT:** `QISM C 19.38` "Yo'q" vs `QISM D #12` (2026-07-07) "Qisman — `recordPallet`+`getPalletBalance` bor" vs `[Module-19] Item 88` (2026-07-11) "**to'liq amalga oshirilgan**". QISM C xato; qurilish darajasi Qisman↔STALE-DOC oralig'ida — registrda **STALE-DOC** (asos bor, konversiya yo'q).
- **Δ 2026-07-11→08-07:** —

### EP-POS-039 · Bo'sh poddon/rohler qaytishi hisobga olinadimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Poddon — qaytariladigan aktiv, ketdi/qaytdi balansi yuritiladi (yo'qolish ko'rinadi). BARCHA_JAVOBLAR tara-aylanmasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q39 (A-default); BARCHA_JAVOBLAR'da yo'q
- **Dalil (kod):** `[Module-19] Item 89` = **STALE-DOC**, Item 88 bilan bir xil dalil — `getPalletBalance()` (`pos-shift-handover.repository.ts:125-140`) aynan "**berildi (out) − qaytdi (in) = qarzdor qoldiq**" ni hisoblaydi, `QISM C` ning "tara-aylanma topilmadi" da'vosini to'g'ridan-to'g'ri rad etadi.
- **Nima yetishmaydi:** `QISM D #12`: **overdue → Finance jarima tasdig'i** yo'q — ya'ni poddon qaytmasa moliyaviy oqibat kelib chiqmaydi (`pos.tara.overdue` event yo'q). `RETURNABLE_ASSET` material-turi yo'q.
- **Bog'liqlik:** EP-POS-038, EP-POS-059 (ta'minotchiga qaytarish), Finance (jarima)
- **action:** —
- **⤳ Ta'sir:** IoT (aktiv kuzatuvi), Finance (aktiv)
- **Xoch-havolalar:** `[Module-19] Item 89` · `[Module-19] Item 12` *(taxminiy)* · `EXTRACTION QISM A #12` · `QISM D #12` · `TASDIQ-2146 §19 #39` · `QISM C 19.39`
- **⚠️ ZIDDIYAT:** `QISM C 19.39` "Yo'q — tara-aylanma topilmadi" vs `[Module-19] Item 89` "`getPalletBalance()` aynan shu balansni hisoblaydi". QISM C xato.
- **Δ 2026-07-11→08-07:** —

### EP-POS-040 · Kunlik ishlab chiqarish rejasi planshetga tushadimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — POS MES/PP bilan to'liq real-time integratsiya; kunlik reja → "bugun chiqariladigan materiallar" PP'dan ko'rinadi (A1: % ko'rsatkich bilan). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q58 (PP/MES real-time integratsiya), Q57 (AI rejalashtirish)
- **Dalil (kod):** `SELECT count(*) FROM daily_warehouse_plans` → **0 qator** (jadval bor, ma'lumot yo'q); `apps/api/src/modules/pos` da **PP→POS reja-push listener'i topilmadi**.
- **Nima yetishmaydi:** ⭐ jadval bor, listener yo'q, ma'lumot yo'q → planshetda "bugun chiqariladigan" ro'yxati **hech qachon ko'rinmaydi**. FULL-ITEM tasnifi: **Code-buildable-now** (`pp.daily_plan.published` uslubidagi listener yozish); egasi-gate yo'q. Bog'liqlik: PP moduli kunlik-reja eventini chiqarishi kerak.
- **Bog'liqlik:** EP-POS-041 (prostoy), EP-POS-042 (sex talabi), EP-POS-056 (reja% GSD)
- **action:** READ
- **⤳ Ta'sir:** PP (kunlik reja), MES
- **Xoch-havolalar:** `[Module-19] Item 90` · `TASDIQ-2146 §19 #40` · `QISM C 19.40` · `QISM I2 #26`
- **Δ 2026-07-11→08-07:** —

### EP-POS-041 · Bekor turish (простой) signali — material yetishmasa
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** **A-default:** Sex "material kutyapman" tugmasi → vaqt sanog'i → omborchi/boshliqqa signal (sabab aniq qayd). BARCHA_JAVOBLAR bu logistika-prostoy mexanizmini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q41 (A-default); BARCHA_JAVOBLAR'da yo'q
- **Dalil (kod):** `[Module-19] Item 91` = Item 25 bilan bir xil topilma — `apps/api/src/modules/pos` da maxsus downtime/prostoy signal servisi yoki jadvali **topilmadi**. `QISM D #25`: grep `downtime|pos_downtime` @ pos + schema → **0 hit**; `pos_downtime_requests` jadvali va MES `mes_downtime_logs` FK bog'i yo'q.
- **Nima yetishmaydi:** butun mexanizm yo'q. FULL-ITEM tasnifi: **Code-buildable-now**, egasi-gate yo'q (faqat A-default tasdig'i kerak).
- **Bog'liqlik:** EP-POS-040 (kunlik reja), EP-POS-042 (sex talabi), MES (to'xtash)
- **action:** —
- **⤳ Ta'sir:** MES (to'xtash sababi), Coordination, HR (logist GSD)
- **Xoch-havolalar:** `[Module-19] Item 91` · `[Module-19] Item 25` *(taxminiy)* · `EXTRACTION QISM A #25` · `QISM D #25` · `TASDIQ-2146 §19 #41` · `QISM C 19.41`
- **Δ 2026-07-11→08-07:** —

### EP-POS-042 · Sexning material talabi (so'rov) planshetdan keladimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-04 Δ)*
- **Talab:** Ha — tasdiqlanadigan ichki so'rov majburiy: xodim → bo'lim menejer tasdiq → ombor xodimi beradi → Ledger DEBIT (talab↔chiqim bog'liq). (v2-A; A1 sex/bo'lim menejer)
- **Manba:** BARCHA_JAVOBLAR Q50 (bo'lim so'rov workflow), Q51 (so'rov majburiy)
- **Dalil (kod):** `pos-requisition-workflow.service.ts` + `pos-requisition-workflow/pos-requisition.helpers.ts` mavjud; `pos-secondary-events.handler.ts:30-62` `pos.request.pending`/`approved`/`rejected`/`issued` event-handlerlarini to'liq amalga oshiradi.
- **Nima yetishmaydi:** — (oqim to'liq). Qolgan nozik: talab↔chiqim bog'i (`Ledger DEBIT`) aynan tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-009 (tasdiq), EP-POS-043 (buyurtmaga biriktirish), EP-POS-067 (shoshilinch)
- **action:** CREATE/APPROVE
- **⤳ Ta'sir:** MES, Coordination, Kanban
- **Xoch-havolalar:** `[Module-19] Item 92` · `TASDIQ-2146 §19 #42` · `QISM C 19.42`
- **Δ 2026-07-11→08-07:** `bfcadd20` (08-04) — so'rov approve/reject holat-guard'lari tuzatildi (avval **400 xato** qaytarardi → tasdiqlash amalda ishlamasdi); `6a8964a7` (08-04) — so'rov holat-filtri lug'ati real UPPERCASE qiymatlarga moslashtirildi (avval filtr hech nima qaytarmasdi). **Ikkalasi ham "qurilgan, lekin ishlamaydigan" toifasidagi bug'lar edi.**

### EP-POS-043 · Buyurtmaga material sarfini biriktirish (kalkulyatsiya)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — POS MM/FI/MES bilan to'liq integratsiya; har chiqim buyurtmaga biriktiriladi → buyurtma material tannarxi avto yig'iladi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q58 (MM/FI/MES integratsiya), Q43 (avto GL)
- **Dalil (kod):** `pos_movements.purchase_order_id` ustuni jonli tasdiqlangan; jonli-yozuv yo'li `goods-receipt.repository.ts` orqali. `QISM C 19.43` (2026-06-27): "jonli **2 movement**, to'liq emas".
- **Nima yetishmaydi:** ustun bor, lekin harakatlarning **ko'pchiligida to'ldirilmaydi** → "buyurtma material tannarxi avto yig'iladi" amalda ishlamaydi. `mes_session_id` FK ham yo'q (`QISM D #49`: grep → 0 hit) → MES↔POS bog'i uzuq.
- **Bog'liqlik:** EP-POS-044 (norma-fakt), EP-POS-058 (ortgan material), EP-POS-024 (MES bog'i)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (tannarx), SD (rentabellik), PP (norma-fakt)
- **Xoch-havolalar:** `[Module-19] Item 93` · `[Module-19] Item 49` *(taxminiy — mes_session_id)* · `QISM D #49` · `TASDIQ-2146 §19 #43` · `QISM C 19.43`
- **Δ 2026-07-11→08-07:** —

### EP-POS-044 · Norma-fakt farqi (ortiqcha sarf) ogohlantirishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** **A-default:** Norma oshsa qizil ogohlantirish + sabab so'raydi (brak/qayta sozlash). BARCHA_JAVOBLAR norma-fakt anomaliya-guardini aniq belgilamagan — egasi tasdig'i kerak (EP-POS-020/077 bilan).
- **Manba:** v2 Q44 (A-default); BARCHA_JAVOBLAR'da to'g'ridan to'g'ri yo'q
- **Dalil (kod):** `material-norms.service.ts` to'liq o'qildi — faqat AI-hosila normalarni hisoblab `material_norms` ga saqlaydi. `Grep "material-norms|MaterialNorms"` `pos-movement.service.ts` da → **mos kelmadi** → chiqim vaqtida hech qanday taqqoslash/blok/qizil-bayroq guard'i **yo'q**. `QISM D #30`: `pp_routing_operations` dan norma olish + `pos_overage_reasons` katalogi ham yo'q (grep overage → 0).
- **Nima yetishmaydi:** butun guard yo'q. FULL-ITEM tasnifi: **Code-buildable-now** (saqlangan normani `pos-movement.service.ts` chiqim yo'liga ulash, fakt↔norma taqqoslash, oshsa sabab majburiy). ⚠️ **Bog'liqlik:** `material_norms` jadvali hozir **0 qator** — taqqoslash ma'noli bo'lishi uchun avval real ma'lumot kerak.
- **Bog'liqlik:** EP-POS-020 (anomaliya), EP-POS-032 (texkarta gate), EP-POS-043 (tannarx), EP-POS-077
- **action:** —
- **⤳ Ta'sir:** PP (norma), Finance, AI (anomaliya)
- **Xoch-havolalar:** `[Module-19] Item 94` · `[Module-19] Item 30` *(taxminiy — pp_routing_operations norma)* · `EXTRACTION QISM A #30` · `QISM D #30` · `TASDIQ-2146 §19 #44` · `QISM C 19.44`
- **⚠️ ZIDDIYAT:** ⭐ **Egasi-savol ~1 oydan beri javobsiz.** `business_settings` da `pos.norma_fakt_farqi_ortiqcha_sarf_94` kaliti **2026-07-11 da yaratilgan** (`business-settings-s1-keys-2026-07-11.sql:52`, id=50) va ikki savol qo'yadi: (1) normadan-oshiq **tolerans %** — "oshsa" degan yalang'och shart barcha chiqimlarning ~yarmini bayroqlaydi, shuning uchun tolerans shart; (2) **normaning kanonik manbasi** — `pp_routing_operations` standart normalari (vizyon #30) vs qurilgan `MaterialNormsService` AI-o'rtachasi (`material_norms`, 0 qator). **2026-08-07 live tekshiruvi:** bu kalitni **hech qaysi kod o'qimaydi** (`grep -rn "norma_fakt_farqi_ortiqcha_sarf" apps/api artifacts` → faqat migratsiya SQL fayli). **2026-08-06 topilmasi TASDIQLANADI.**
- **Δ 2026-07-11→08-07:** —

### EP-POS-045 · Turniket/kirish-chiqish bilan bog'lanishmi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Login ERP SSO orqali (rol avto). Turniket RFID alohida HR/davomat tizimi — POS login = ERP login (B varianti ruhida, ikki tizim ajratilgan). RFID=login majburiy emas.
- **Manba:** BARCHA_JAVOBLAR Q2 (SSO), Q10 (ERP login)
- **Dalil (kod):** `pos-auth.service.ts`/`pos-auth.controller.ts` mavjud (ERP SSO login, Item 52); POS modulida RFID/turniket integratsiyasi **topilmadi** — bu qasddan chegara tashqarisi (HR alohida hal qiladi), ya'ni **vizyonga mos**.
- **Nima yetishmaydi:** — (chegara to'g'ri chizilgan)
- **Bog'liqlik:** EP-POS-002 (login), HR (davomat)
- **action:** LOGIN
- **⤳ Ta'sir:** HR (davomat), IoT (RFID), EP-POS-002
- **Xoch-havolalar:** `[Module-19] Item 95` · `TASDIQ-2146 §19 #45` · `QISM C 19.45`
- **Δ 2026-07-11→08-07:** —

### EP-POS-046 · A-System bilan bog'liqlik (eski tizim)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** **A-default:** ERP A-System'ni butunlay almashtiradi (yagona haqiqat). BARCHA_JAVOBLAR 1C-yo'qligini aytgan, lekin A-System taqdirini aniq hal qilmagan — egasi qarori (Q-25 master reja).
- **Manba:** v2 Q46 (A-default); BARCHA_JAVOBLAR Q44 (1C yo'q) — A-System emas
- **Dalil (kod):** `apps/api/src/modules/pos` to'liq katalog ro'yxatida A-System ko'prigi/adapteri fayllari **topilmadi**.
- **Nima yetishmaydi:** ⭐ **To'liq EGASI-GATE** — FULL-ITEM tasnifi: "code-buildable-now = n/a, migratsiya/parallel-ishlash qarori qabul qilinmaguncha"; butun A-System migratsiya strategiyasi (almashtirish vs parallel) egasining aniq qarori (Q-25 master). Bu EP-POS-079 (boshlang'ich qoldiq) ni ham bloklaydi.
- **Bog'liqlik:** EP-POS-079 (boshlang'ich qoldiq — bevosita bloklangan)
- **action:** —
- **⤳ Ta'sir:** Butun ombor/PP zanjiri
- **Xoch-havolalar:** `[Module-19] Item 96` · `TASDIQ-2146 §19 #46` · `QISM C 19.46`
- **Δ 2026-07-11→08-07:** —

### EP-POS-047 · Yarim tayyor (WIP) bosqichlari kuzatiladimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Ha — PRODUCTION_* omborlari mavjud; har bosqichdan keyin yarim tayyor alohida pozitsiya (WIP ko'rinadi), MES integratsiya. (v2-A/C)
- **Manba:** BARCHA_JAVOBLAR Q29 (PRODUCTION_* omborlari), Q58 (MES integratsiya)
- **Dalil (kod):** `auto-gl-posting.service.ts:35` — `WAREHOUSE_WIP: '2010'` hisobi aniqlangan; `INTERNAL_TRANSFER` turi (Item 68) bosqichlararo ko'chirish mexanizmi sifatida tasdiqlangan. `QISM C 19.47`: `WIP-MAIN` + `PRODUCTION_OFFSET`/`PRODUCTION_FLEXO` omborlari jonli.
- **Nima yetishmaydi:** MES integratsiyasi (`mes_session_id` FK) yo'q → WIP pozitsiyalari MES sessiyalariga bog'lanmagan (qv. EP-POS-024/043). I2 #33 dagi to'liq routing zanjiri (kashirovka/tigel/qadoqlash) omborlari tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-031, EP-POS-018, EP-POS-024
- **action:** CREATE
- **⤳ Ta'sir:** MES (WIP), PP, Finance (WIP qiymati)
- **Xoch-havolalar:** `[Module-19] Item 97` · `TASDIQ-2146 §19 #47` · `QISM C 19.47` · `QISM I2 #33`
- **Δ 2026-07-11→08-07:** —

### EP-POS-048 · Texnik pasport / partiya hujjati FG kirimda
- **Qaror holati:** ✅ JAVOBLANGAN *(qisman)*
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Har harakatda akt (PDF) + invoice; partiya kuzatiladi (Code-128). Texnik pasport QC/SD bilan bog'lanadi (FG kirimda partiya+pasport, jo'natishda tayyor). (v2-A ruhida; pasport-FG bog'lanishi nozik)
- **Manba:** BARCHA_JAVOBLAR Q41 (harakat akti+invoice PDF), Q15 (Code-128 partiya), Q58 (QC/SD integratsiya)
- **Dalil (kod):** `pos_movement_lines.passport_id` ustuni jonli; `pos-inventory-passport.service.ts` / `pos-inventory-passport.repository.ts` mavjud, `pos_inventory_passport` jadvali bilan — `SELECT count(*)` → **0 qator** (kod bor, ma'lumotda ishlatilmaydi).
- **Nima yetishmaydi:** pasport↔FG↔QC/SD bog'i amalda ishlatilmaydi (0 qator); "jo'natishda tayyor" zanjiri tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-024 (FG kirim), EP-POS-025 (lot), EP-POS-072 (jo'natish), EP-POS-073 (PDF)
- **action:** CREATE
- **⤳ Ta'sir:** QC (texnik pasport), SD (jo'natish), EP-POS-025
- **Xoch-havolalar:** `[Module-19] Item 98` · `TASDIQ-2146 §19 #48` · `QISM C 19.48`
- **Δ 2026-07-11→08-07:** `9ea7c155` (08-07) — `pos-inventory-passport.service.ts:64,70` dagi **literal 48-soat** karantin-eskalatsiyasi olib tashlandi va kanonik `business_settings` yo'liga birlashtirildi (qv. EP-POS-004/034 — ikkita parallel eskalatsiya muammosi).

### EP-POS-049 · Lab namuna olish ombordan harakatmi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** "Lab namunasi" alohida chiqim sababi (kichik, lekin qayd) — balans aniq. BARCHA_JAVOBLAR namuna-harakatini aniq belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q49 (A-default); BARCHA_JAVOBLAR'da yo'q
- **Dalil (kod):** `[Module-19] Item 99` = **STALE-DOC**. `QISM C 19.49` "Yo'q; chiqim sababi topilmadi" **noto'g'ri** — `movement-enums.ts:17,108` da `LAB_SAMPLE_OUT` harakat turi aynan shu maqsad uchun mavjud, `CHIQIM` kategoriyasida. `QISM D #13`: kontekst maydonlari `labSampleReason`/`labTestRef` (`pos-schema-v2.ts:200-201`), `pos-movement.service.ts:425` da saqlanadi.
- **Nima yetishmaydi:** ⭐ **GL xaritasi yo'q** — `auto-gl-posting.service.ts:57-84` da `case 'LAB_SAMPLE_OUT'` yo'q → `default` shoxiga tushadi, **nol GL yozuvi**. Vizyon "QC xarajat GL" va "salbiy → storno" talab qiladi — ikkalasi ham yo'q (storno umuman yo'q, EP-POS-022).
- **Bog'liqlik:** EP-POS-013 (GL xaritasi), EP-POS-034 (QC karantin), EP-POS-022 (storno)
- **action:** —
- **⤳ Ta'sir:** QC (lab), EP-POS-005 (chiqim sababi)
- **Xoch-havolalar:** `[Module-19] Item 99` · `[Module-19] Item 13` *(taxminiy — LAB_SAMPLE)* · `EXTRACTION QISM A #13` · `QISM D #13` · `TASDIQ-2146 §19 #49` · `QISM C 19.49`
- **⚠️ ZIDDIYAT:** `QISM C 19.49` "Yo'q — tur topilmadi" vs `[Module-19] Item 99` "`LAB_SAMPLE_OUT` **bor**". Item to'g'ri; QISM C ning asosiy tashvishi (balansga ta'siri qayd etilmaydi) faqat GL tomonida o'rinli.
- **Δ 2026-07-11→08-07:** —

### EP-POS-050 · Smenadan smenaga material topshirish (Omborchi akti)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Smena topshirish akti (2 imzo: topshiruvchi/qabul qiluvchi). BARCHA_JAVOBLAR Q11'da "smena boshqaruvi kerak emas, faqat audit log" deydi — bu A-default bilan ZIDLIKDA; egasi qaror qilishi kerak (audit-log yetarli yoki rasmiy topshirish akti).
- **Manba:** v2 Q50 (A-default) ╳ BARCHA_JAVOBLAR Q11 (smena emas, audit log) — ZIDLIK
- **Dalil (kod):** `[Module-19] Item 100` = **STALE-DOC**. `QISM C 19.50` "Yo'q; 2-imzo yo'q" **noto'g'ri** — `pos-shift-handover.service.ts:1-110` to'liq o'qildi: aniq izoh "2-IMZO GATE: akt 'closed' holatiga FAQAT topshiruvchi (from) VA qabul qiluvchi (to) ikkalasi ham imzolasa", `applySignature()` buni majburlaydi. `QISM D #7`: `sign()` (`:68-91`), endpoint `shift-handover.controller.ts:77` `/:id/sign`, `photo_evidence_url` (`repo:49`). Jadval **0 qator** — kod bor, amalda ishlatilmaydi.
- **Nima yetishmaydi:** **PIN e-imzo yo'q** (grep pin → yo'q), **PDF generatsiyasi yo'q**, **"imzosiz keyingi smena blok" yo'q**. Ya'ni 2-imzo darvozasi bor, lekin akt hujjati va keyingi-smena blokirovkasi yo'q.
- **Bog'liqlik:** EP-POS-027 (smena yopilishi — ZIDLIK), EP-POS-038/039 (poddon topshirish), EP-POS-073 (PDF)
- **action:** —
- **⤳ Ta'sir:** HR (javobgarlik), EP-POS-027 (smena yopilishi)
- **Xoch-havolalar:** `[Module-19] Item 100` · `[Module-19] Item 7` *(taxminiy — smena akti PDF+PIN)* · `EXTRACTION QISM A #7` · `QISM D #7` · `TASDIQ-2146 §19 #50` · `QISM C 19.50`
- **⚠️ ZIDDIYAT (ikki qavat):** (1) **Vizyon ichida:** v2 Q50 (2-imzo akti) ╳ BARCHA_JAVOBLAR Q11 ("smena boshqaruvi kerak emas") — `decisions` ning o'zi buni ZIDLIK deb belgilagan, egasi hal qilishi kerak. (2) **Manbalar orasida:** `QISM C 19.50` "2-imzo yo'q" vs `QISM D #7` + `Item 100` "2-imzo gate **real va majburlanadi**". Ya'ni **egasi hal qilmagan narsa allaqachon qurilgan** — bu qurilish-oldin-qaror holatining aniq namunasi.
- **Δ 2026-07-11→08-07:** —

### EP-POS-051 · Yuk topshirish-qabul akti (kirimda yetkazib beruvchi bilan)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** Ha — har harakatda akt (PDF): harakat raqami, sana, materiallar, kim topshirdi/qabul qildi, rekvizitlar. EXTERNAL_IN'da zakaz-fakt farqi qayd etiladi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q41 (harakat akti), Q42 (kim topshirdi/qabul qildi PDF'da)
- **Dalil (kod):** `pos_movements.act_pdf_path` ustuni jonli; `pos-pdf.service.ts` mavjud; `three-way-match.service.ts` + `three_way_matched` ustuni jonli; `pos.events.ts:148-158` — `EXTERNAL_IN` tasdiqlanganda avtomatik 3-way-match chaqiruvi.
- **Nima yetishmaydi:** `QISM D #33`: **STIR/TIN (`supplier_tin`) ustuni yo'q** — `pos_movements` da faqat `supplierId`/`supplierName` (`pos-schema-v2.ts:83,133`), 9-raqamli regex validatsiyasi yo'q. Vizyon rekvizitlarni talab qiladi. I2 #28 raqamlash standarti (`HOM-KIRIM-2026-00001`) POS'da tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-052 (qisman qabul), EP-POS-073 (PDF chop), EP-POS-081 (nomuvofiqlik)
- **action:** CREATE/EXPORT
- **⤳ Ta'sir:** Finance (da'vo), MM, EP-POS-004
- **Xoch-havolalar:** `[Module-19] Item 101` · `[Module-19] Item 21` *(taxminiy — qabul akti 3 qator)* · `[Module-19] Item 33` *(taxminiy — STIR/TIN)* · `EXTRACTION QISM A #21` · `QISM A #33` · `QISM D #33` · `TASDIQ-2146 §19 #51` · `QISM C 19.51` · `QISM I2 #28`
- **⚠️ ZIDDIYAT:** ⭐ **2026-08-06/07 topilmasi QISMAN RAD ETILADI.** Da'vo: "`three-way-match.service.ts:14-15` `QTY/AMOUNT_TOLERANCE_PCT` bugun `mm.three_way_amount_tolerance_pct` ga o'tkazildi". **Live tekshiruv (2026-08-07):** o'tkazish **boshqa faylda** bo'lgan — `apps/api/src/modules/remaining/three-way-match.service.ts:23,47` endi `getBusinessSettingNumber('mm.three_way_amount_tolerance_pct', TOLERANCE_PCT_DEFAULT)` ishlatadi, **lekin POS'niki hamon qattiq yozilgan**:
>     `apps/api/src/modules/pos/application/services/three-way-match.service.ts:14` `const QTY_TOLERANCE_PCT = 0.05;`
>     `apps/api/src/modules/pos/.../three-way-match.service.ts:15` `const AMOUNT_TOLERANCE_PCT = 0.05;`
>     `:43` `const status = (qtyVar > QTY_TOLERANCE_PCT || amountVar > AMOUNT_TOLERANCE_PCT) ? 'VARIANCE' : 'MATCHED';`
>   Ya'ni **ikkita parallel 3-way-match servisi** bor va faqat bittasi CRUD-sozlanadigan qilingan — bu EP-POS-004 dagi "ikkita parallel karantin-eskalatsiya" bilan **bir xil naqsh**. Egasi tolerance'ni CRUD'da o'zgartirsa, POS kirimi hamon 5% da qoladi.
- **Δ 2026-07-11→08-07:** —

### EP-POS-052 · Kam yetkazilgan/buzuq material qabul rejimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Qisman qabul (kelgan miqdor) + ochiq qoldiq + buzuq qismi alohida sabab (DAMAGE/karantin). BARCHA_JAVOBLAR qisman-qabulni aniq belgilamagan (faqat karantin+QC oqimi bor) — egasi tasdig'i kerak.
- **Manba:** v2 Q52 (A-default); BARCHA_JAVOBLAR Q30 (karantin) qisman holatni yopmaydi
- **Dalil (kod):** `[Module-19] Item 102` = **STALE-DOC**. `QISM C 19.52` "Yo'q; grep=0" **noto'g'ri** — `movement-enums.ts:18` da `PARTIAL_RECEIPT` harakat turi mavjud (izoh: "kam/buzuq material qisman qabul"), `goods_receipts.qc_passed_items`/`qc_required_items` ustunlari qisman-qabul bo'linishini qo'llab-quvvatlaydi. `QISM D #21`: kontekst maydonlari `orderedQty`/`acceptedQty`/`rejectedQty`/`partialReason` (`pos-schema-v2.ts:203-206`).
- **Nima yetishmaydi:** ⭐ **GL xaritasi yo'q** (`case 'PARTIAL_RECEIPT'` yo'q → nol GL). **Debit-nota / `mm_credit_notes` bog'i YO'Q** (`grep credit_note` → 0) — ya'ni kam yetkazilgan miqdor uchun yetkazib beruvchiga moliyaviy da'vo avtomatik chiqmaydi.
- **Bog'liqlik:** EP-POS-051 (qabul akti), EP-POS-059 (qaytarish/kredit-nota), EP-POS-013 (GL), EP-POS-081
- **action:** —
- **⤳ Ta'sir:** MM, Finance, EP-POS-051
- **Xoch-havolalar:** `[Module-19] Item 102` · `[Module-19] Item 21` *(taxminiy)* · `EXTRACTION QISM A #21` · `QISM D #21` · `TASDIQ-2146 §19 #52` · `QISM C 19.52`
- **⚠️ ZIDDIYAT:** `QISM C 19.52` "Yo'q — qisman-qabul yo'q" vs `[Module-19] Item 102` "`PARTIAL_RECEIPT` **bor** + `goods_receipts` ustunlari". Item to'g'ri.
- **Δ 2026-07-11→08-07:** —

### EP-POS-053 · Tozalik / 5S holati planshetda
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Tozalik/5S POS Monitor doirasidan tashqarida (Coordination/checklist moduli) — POS faqat material harakati. (v2-A; toza chegara)
- **Manba:** BARCHA_JAVOBLAR Q56 (POS hisobotlari faqat material/ombor/inventar), POS scope material-faqat
- **Dalil (kod):** `apps/api/src/modules/pos` ning to'liq **128-faylli** ro'yxatida 5S bilan bog'liq servis/kontroller **yo'q** — ya'ni "POS'da bo'lmasligi kerak" talabi **to'g'ri bajarilgan** (Ha = qasddan yo'qlik).
- **Nima yetishmaydi:** — (chegara to'g'ri)
- **Bog'liqlik:** Coordination (5S checklist)
- **action:** READ
- **⤳ Ta'sir:** Coordination, HR (intizom)
- **Xoch-havolalar:** `[Module-19] Item 103` · `TASDIQ-2146 §19 #53` · `QISM C 19.53`
- **Δ 2026-07-11→08-07:** —

### EP-POS-054 · Ish joyni ruxsatsiz tashlab ketish (planshet bog'liqligi)
- **Qaror holati:** ✅ JAVOBLANGAN *(qisman)*
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Audit log har klik/kirish-chiqishni qaydlaydi (IP+timestamp). Maxsus "harakatsizlik signali" alohida belgilanmagan — audit log asosida nazorat (B ruhida, turniket/davomat HR'da). Proaktiv signal — ochiq nozik.
- **Manba:** BARCHA_JAVOBLAR Q6 (to'liq audit log: har klik, IP, timestamp), Q11 (kim qachon kirdi/chiqdi)
- **Dalil (kod):** `pos_audit_log` (65 qator, jonli) har foydalanuvchi harakatini vaqt-belgisi bilan yozadi — harakatsizlikni aniqlash uchun asos bor, lekin **maxsus idle/harakatsizlik detektor servisi topilmadi**. ⚠️ `pos-inactive-materials.job.ts` bor, lekin u **material** harakatsizligini tekshiradi, **xodim** harakatsizligini emas.
- **Nima yetishmaydi:** proaktiv signal yo'q. ⚠️ **Ochiq (2026-08-06/07 tasdiq):** `pos-inactive-materials.job.ts:30` — `getInactiveMaterials(90)`, **90 kun qattiq yozilgan** (`:13,39,46,57` da ham takrorlanadi). Bu chegara `business_settings` da emas → egasi CRUD orqali sozlay olmaydi (threshold-CRUD qoidasini buzadi). **2026-08-06 topilmasi TASDIQLANADI.**
- **Bog'liqlik:** EP-POS-080 (audit), EP-POS-041 (prostoy), HR (intizom)
- **action:** READ/EVENT
- **⤳ Ta'sir:** HR (intizom), EP-POS-041
- **Xoch-havolalar:** `[Module-19] Item 104` · `TASDIQ-2146 §19 #54` · `QISM C 19.54`
- **Δ 2026-07-11→08-07:** —

### EP-POS-055 · Energiya/resurs (suv/gaz/svet) tejash POS'da
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Energiya — IoT/Coordination moduli, POS Monitor'da YO'Q (toza chegara). POS faqat material harakati + inventar. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q56 (POS hisobotlari material-faqat), Q46 (POS faqat inventar)
- **Dalil (kod):** 128-faylli POS modul ro'yxatida energiya/resurs-tejash kodi **topilmadi** — chegara to'g'ri saqlangan (Ha = qasddan yo'qlik).
- **Nima yetishmaydi:** — (chegara to'g'ri)
- **Bog'liqlik:** IoT (hisoblagich), Coordination
- **action:** READ
- **⤳ Ta'sir:** IoT (hisoblagich), Director (KPI)
- **Xoch-havolalar:** `[Module-19] Item 105` · `TASDIQ-2146 §19 #55` · `QISM C 19.55` · `QISM I2 #30` *(o'g'irlik nazorati — IoT/Security tomonda)*
- **Δ 2026-07-11→08-07:** —

### EP-POS-056 · Omborchi GSD: "reja bajarilish %" kitobdan
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** **A-default:** Uch ko'rsatkich (reja % + kechikish soni + og'ish soni) POS harakatlaridan avto → logist kartasiga. BARCHA_JAVOBLAR HR integratsiya + ombor menejer analytics borligini aytgan, lekin aynan 3-ko'rsatkich formulasini belgilamagan — egasi tasdig'i kerak (kitob aynan bu raqamlarni belgilagan).
- **Manba:** v2 Q56 (A-default); BARCHA_JAVOBLAR Q57/Q58 (analytics bor, aniq formula yo'q)
- **Dalil (kod):** Item #14/#79 bilan bir xil topilma — `PosGsdService`/karta-KPI yozuv yo'li **topilmadi**; `warehouse-kpi.service.ts` bor, lekin karta jadvaliga yozmaydi.
- **Nima yetishmaydi:** ⭐ **Ikki tomonlama blok:** (1) **Code-buildable-now** — `hr_kpi_snapshots` ga cron-yozuv; (2) **Owner-gated** — aniq 3-ko'rsatkich formulasi (reja% / kechikish / og'ish) egasi-DATA. Bu EP-POS-029 ning aniq formulasi.
- **Bog'liqlik:** EP-POS-029 (GSD integratsiya), EP-POS-040 (reja% manbasi), EP-POS-075
- **action:** —
- **⤳ Ta'sir:** HR (karta GSD), Director, EP-POS-029
- **Xoch-havolalar:** `[Module-19] Item 106` · `[Module-19] Item 14` *(taxminiy)* · `[Module-19] Item 79` · `EXTRACTION QISM A #14` · `TASDIQ-2146 §19 #56` · `QISM C 19.56`
- **Δ 2026-07-11→08-07:** —

### EP-POS-057 · Material birligi konversiyasi (rulon↔kg↔m)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har materialga konversiya jadvali (1 rulon = N kg = M metr) → avto o'tkazish (FIFO partiya narxi shu birlikda). Valyuta ham har xil. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q35 (FIFO partiya), Q36 (har qanday valyuta); MM birlik integratsiyasi Q58
- **Dalil (kod):** `pos_movement_lines.unit`/`unit_price`/`total_price` + baza-valyuta ustunlari (`unit_price_base`/`total_price_base`) **qiymat** konversiyasi uchun jonli. **O'lchov-birligi (rulon↔kg↔m) konversiya jadvali/servisi modulda topilmadi** — `unit_of_measure` faqat `warehouse_stock` da, konversiya-koeffitsient jadvali sifatida emas.
- **Nima yetishmaydi:** ⭐ **Valyuta konversiyasi bor, o'lchov konversiyasi yo'q** — `QISM C 19.57` da ham shunday aytilgan. Konversiya-koeffitsientlari master-data'si egasi-DATA. I2 #9: har rulon kg+QR+taxminiy m² (AI) — bu ham yo'q.
- **Bog'liqlik:** EP-POS-014 (FIFO narx), EP-POS-038 (poddon=N rulon), EP-POS-068 (bichish)
- **action:** CREATE
- **⤳ Ta'sir:** MM (birlik), EP-POS-014
- **Xoch-havolalar:** `[Module-19] Item 107` · `TASDIQ-2146 §19 #57` · `QISM C 19.57` · `QISM I2 #9`
- **Δ 2026-07-11→08-07:** —

### EP-POS-058 · Buyurtma yopilgach ortib qolgan material
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** INTERNAL_RETURN (qaytarish) harakati — ortgan material omborga qaytadi, sabab majburiy, tannarxdan chiqadi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q24 (INTERNAL_RETURN, sabab majburiy), Q48 (iste'mol → stokka qaytadi)
- **Dalil (kod):** `movement-enums.ts:10` — `INTERNAL_RETURN` `KIRIM` kategoriyasida; `pos_movements.return_reason` ustuni jonli; `auto-gl-posting.service.ts:70-71` — `case 'INTERNAL_RETURN'` teskari `WAREHOUSE_RM`/`DEPT_EXPENSE` oyog'ini yozadi (tannarxdan chiqarish real).
- **Nima yetishmaydi:** — (uch talab ham bajarilgan: tur + sabab + GL). Qolgan: I2 #16 "lahtak (qoldiq) aybdor profiliga o'tadi, aybdorni ombor menejeri qo'lda belgilaydi" — bu POS'da yo'q (→ VR-POS-I05).
- **Bog'liqlik:** EP-POS-043 (tannarx), EP-POS-068 (bichish qoldig'i), EP-POS-076 (buyurtma o'zgarishi)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (tannarx), EP-POS-043
- **Xoch-havolalar:** `[Module-19] Item 108` · `TASDIQ-2146 §19 #58` · `QISM C 19.58` · `QISM I2 #16`
- **Δ 2026-07-11→08-07:** —

### EP-POS-059 · Yetkazib beruvchiga qaytarish (vozvrat)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** QC CHIQARISH qarori → ta'minotchiga qaytish harakati → Finance da'vo/kredit-nota. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q31 (CHIQARISH → ta'minotchiga qaytish)
- **Dalil (kod):** `pos_movements.supplier_id`/`supplier_name`/`return_reason` ustunlari jonli. **Kredit-nota eventi yoki Finance-da'vo listener'i modulda topilmadi** (`mm_credit_notes` ga havola yo'q — Item 21/46 da tasdiqlangan).
- **Nima yetishmaydi:** ⭐ zanjirning **moliyaviy oyog'i yo'q**: qaytarish yoziladi, lekin kredit-nota chiqmaydi va yetkazib beruvchi reytingi kamaymaydi (`QISM A #46`: vendor rating Two-Worlds A11 IN-PROGRESS 60%). QC-radidan avto-`EXTERNAL_RETURN` ham yo'q.
- **Bog'liqlik:** EP-POS-035 (lab rad), EP-POS-052 (qisman qabul), Finance (kredit-nota), MM (reyting)
- **action:** CREATE/REJECT
- **⤳ Ta'sir:** Finance (kredit-nota), MM (yetkazib beruvchi reytingi)
- **Xoch-havolalar:** `[Module-19] Item 109` · `[Module-19] Item 46` *(taxminiy — QC rejected→EXTERNAL_RETURN)* · `EXTRACTION QISM A #46` · `TASDIQ-2146 §19 #59` · `QISM C 19.59`
- **Δ 2026-07-11→08-07:** —

### EP-POS-060 · Material muddati (срок годности) — bo'yoq/elim
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Muddatli materiallarga FEFO (muddati qisqa birinchi) + yaqinlashganda ogohlantirish; muddatsiz → FIFO. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q37 (muddatli → FEFO)
- **Dalil (kod):** `pos.stock.expiry_alert` eventi qayta ishlanadi (`pos-secondary-events.handler.ts:97-100`); muddat-cron real: `pos-fifo-recalculate.job.ts:17` (`0 2 * * *`) `markExpiredBatches`. **Lekin FEFO tartiblash mantiqi buzilgan `pos-fifo.service.ts` ichida** — `hasExpiry()` mavjud bo'lmagan `pos_materials` jadvalidan so'raydi (Item #6).
- **Nima yetishmaydi:** ⭐ **Cron har kecha jimgina yiqiladi:** SQL xatosi `markExpiredBatches` ichida `Err` sifatida yutiladi → log'da hech nima ko'rinmaydi, muddati o'tgan partiya **hech qachon `EXPIRED` deb belgilanmaydi** → "muddati o'tgan TO'LIQ BLOK" amalda ishlamaydi. `QISM D #37`: aynan **22:00** kunlik cron va `pos_expiry_notifications` unique-indeksi (bir kun-bir xabar dedup) yo'q → takroriy ogohlantirish mumkin.
- **Bog'liqlik:** EP-POS-014 (FIFO), EP-POS-025 (lot), EP-POS-011 (ogohlantirish)
- **action:** EVENT/AI
- **⤳ Ta'sir:** QC, MM, EP-POS-025
- **Xoch-havolalar:** `[Module-19] Item 110` · `[Module-19] Item 6` · `[Module-19] Item 37` *(taxminiy)* · `EXTRACTION QISM A #6` · `QISM A #37` · `QISM D #6` · `QISM D #37` · `TASDIQ-2146 §19 #60` · `QISM C 19.60`
- **⚠️ ZIDDIYAT:** `QISM C 19.60` (2026-06-27) "**Ha** — pos-fifo hasExpiry FEFO" vs `[Module-19] Item 6/110` (2026-07-11) "`pos_materials`/`pos_batches` **jadvallari yo'q**, kod o'lik". Item to'g'ri.
- **Δ 2026-07-11→08-07:** —

### EP-POS-061 · Joylashuv (ombordagi joy / yacheyka) kuzatiladimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Bin location freeform (operator o'zi yozadi: A-3-12, Tokcha-5, istalgan matn), kirimda belgilanadi, chiqimda ko'rsatiladi. (v2-A ruhida, freeform)
- **Manba:** BARCHA_JAVOBLAR Q33 (Bin location freeform)
- **Dalil (kod):** `pos_movement_lines.bin_id` va `warehouse_stock.bin_location_id` ustunlari `information_schema.columns` bilan jonli tasdiqlangan. `QISM D #9`: `posMovementLines.binId` (`pos-schema-v2.ts:161`), `pos-movement.service.ts:499`, inventar `binLocation` (`pos-inventory-count-query.service.ts:60,116`).
- **Nima yetishmaydi:** `QISM D #9`: **sig'im/capacity ogohlantirishi YO'Q** (grep capacity → POS ichida 0 hit), `wms_bin_locations` bilan bog' topilmadi. Vizyon "freeform + dropdown, sig'im OGOHLANTIRISH" talab qiladi — dropdown va sig'im yo'q.
- **Bog'liqlik:** EP-POS-030 (warehouse_stock), EP-POS-015 (inventar), WMS (bin master-data)
- **action:** CREATE
- **⤳ Ta'sir:** IoT, MES, ichki logistika marshruti
- **Xoch-havolalar:** `[Module-19] Item 111` · `[Module-19] Item 9` *(taxminiy — bin capacity)* · `EXTRACTION QISM A #9` · `QISM D #9` · `TASDIQ-2146 §19 #61` · `QISM C 19.61`
- **Δ 2026-07-11→08-07:** —

### EP-POS-062 · Mijoz materiali (давальческое) ajratiladimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** "Mijoz materiali" alohida turi — miqdor kuzatiladi, qiymat zavod GL'ga tushmaydi (to'g'ri huquqiy holat). BARCHA_JAVOBLAR давальческое-ni belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q62 (A-default); BARCHA_JAVOBLAR'da yo'q
- **Dalil (kod):** `[Module-19] Item 112` = **STALE-DOC**. `QISM C 19.62` "Yo'q; grep=0; tur yo'q" **noto'g'ri** — `movement-enums.ts:19` da `CUSTOMER_MATERIAL` harakat turi mavjud (izoh: "mijoz-mol (davalcheskoe) kirim"), `KIRIM` kategoriyasida. `QISM D #19`: kontekst maydonlari `customerId`/`customerName`/`isCustomerOwned` (`pos-schema-v2.ts:208-210`).
- **Nima yetishmaydi:** ⭐ `warehouse_stock.owner_type` (CLIENT/consignment bayrog'ini olib yuruvchi ustun) **POS modulida hech qayerda ishlatilmaydi** → tur egalik-kuzatuviga ham, GL-skip qoidasiga ham ulanmagan. `CLIENT_RETURN` turi yo'q. GL "skip" faqat tasodifan ishlaydi (`default` case yo'qligi sababli), qasddan qoida sifatida emas.
- **Bog'liqlik:** EP-POS-013 (GL xaritasi), EP-POS-030 (owner_type), SD (mijoz)
- **action:** —
- **⤳ Ta'sir:** Finance (balans), SD (mijoz), EP-POS-012
- **Xoch-havolalar:** `[Module-19] Item 112` · `[Module-19] Item 19` *(taxminiy — ownership_type=CLIENT)* · `EXTRACTION QISM A #19` · `QISM D #19` · `TASDIQ-2146 §19 #62` · `QISM C 19.62`
- **⚠️ ZIDDIYAT:** `QISM C 19.62` "Yo'q — tur yo'q" vs `[Module-19] Item 112` "`CUSTOMER_MATERIAL` **bor**". Item to'g'ri; lekin egalik-kuzatuvi yo'qligi sababli funksional natija QISM C aytganiga yaqin.
- **Δ 2026-07-11→08-07:** —

### EP-POS-063 · Inventar paytida ombor "muzlatiladimi" (freeze)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Inventar tunda yoki dam olish kunida o'tkaziladi (ish to'xtatilmaydi) — freeze muammosi shu bilan hal: harakat yo'q vaqtda sanaladi. Zona-level freeze alohida talab emas. (v2-A muqobili)
- **Manba:** BARCHA_JAVOBLAR Q52 (tunda/dam kuni, ish to'xtatilmaydi)
- **Dalil (kod):** `pos_inventory_plans` jadvali jonli (Item 67). `pos-inventory-count.service.ts` da aniq **zona-darajali "freeze" mexanizmi topilmadi** — bu `decisions` ning o'z nozikligiga ("zona-freeze talab emas") mos.
- **Nima yetishmaydi:** freeze qasddan qurilmagan (qaror shunday), lekin uni almashtiruvchi "tunda avto-rejalash" cron'i ham yo'q (qv. EP-POS-015) → amalda sanash vaqti kafolatlanmagan. ⚠️ **I2 #31 egasi "zona muzlatiladi" degan** — bu `decisions` ning "zona-freeze talab emas" xulosasiga zid.
- **Bog'liqlik:** EP-POS-015, EP-POS-017 (davriylik)
- **action:** —
- **⤳ Ta'sir:** MES, EP-POS-015
- **Xoch-havolalar:** `[Module-19] Item 113` · `TASDIQ-2146 §19 #63` · `QISM C 19.63` · `QISM I2 #31` ⭐
- **⚠️ ZIDDIYAT:** `decisions` + `QISM C 19.63` "zona-freeze **talab emas**" vs **`QISM I2 #31`** (egasi, 2026-06-08): "tunda/dam kuni, **zona muzlatiladi**". Egasi freeze'ni aytgan; qaror-xaritasi uni "talab emas" deb yopgan. **Tekshirilishi kerak.**
- **Δ 2026-07-11→08-07:** —

### EP-POS-064 · Inventar farqi chegarasi (avto-tasdiq limiti)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Belgilangan chegaragacha (±N% yoki summa) avto, undan ortig'i tasdiq talab. BARCHA_JAVOBLAR Q53 "avto GL + moliya tasdig'i" deydi (har farqqa), lekin avto-limit chegarasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q64 (A-default); BARCHA_JAVOBLAR Q53 (moliya tasdig'i, limit aniq emas)
- **Dalil (kod):** `[Module-19] Item 114` = **STALE-DOC**. `QISM C 19.64` "Yo'q; limit kodi topilmadi; har farq moliya" **noto'g'ri** — `pos-variance-config.service.ts` to'liq o'qildi: `AUTO_APPROVE`/`ESCALATE` qarori jonli `pos_variance_config` jadvalidan o'qilgan **sozlanadigan ±N% va ±N so'm** chegarasiga qarshi qo'llanadi. `QISM D #23`: `getThreshold` (`:77`), `decideForLine` (`:131`), **fail-CLOSED**; endpointlar `inventory-count.controller.ts:61,69,124`.
- **Nima yetishmaydi:** ⭐ **`pos_variance_config` qatorlari soni tasdiqlanmagan** (`QISM D #23`: "rowcount TEKSHIR — config bo'sh → hammasi eskalatsiya"). Ya'ni chegara CRUD-sozlanadigan qilib qurilgan, lekin egasi hali qiymat kiritmagan → fail-CLOSED tufayli **har bir farq eskalatsiya qilinadi**, bu QISM C ning "har farq moliya" kuzatuvini tushuntiradi. Bundan tashqari eskalatsiya **menejerga** boradi, vizyondagi "Finance PENDING_REVIEW" ga emas.
- **Bog'liqlik:** EP-POS-016 (moliya tasdig'i), EP-POS-015
- **action:** —
- **⤳ Ta'sir:** Finance, EP-POS-016
- **Xoch-havolalar:** `[Module-19] Item 114` · `[Module-19] Item 23` *(taxminiy)* · `EXTRACTION QISM A #23` · `QISM D #23` · `TASDIQ-2146 §19 #64` · `QISM C 19.64`
- **⚠️ ZIDDIYAT:** `QISM C 19.64` "limit kodi yo'q" vs `QISM D #23` + `Item 114` "`pos-variance-config.service.ts` aynan shuni amalga oshiradi". Item to'g'ri; QISM C ning kuzatuvi (har farq moliyaga boradi) **bo'sh konfiguratsiya + fail-CLOSED** ning natijasi edi.
- **Δ 2026-07-11→08-07:** —

### EP-POS-065 · Tezkor minimal qoldiq — kim zakaz beradi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Minimaldan tushsa AI rejalashtirish → avto sotib olish talabi MM/snabjeniyega (proaktiv). MM bilan real-time integratsiya. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q57 (AI rejalashtirish), Q58 (MM integratsiya)
- **Dalil (kod):** Item #36/#61 bilan bir xil — `PosLowStockJob` to'liq o'qildi: **faqat bildirishnoma** yuboradi; past-qoldiq yo'lida `erp_purchase_requisitions`/`mm_purchase_requests` INSERT **topilmadi**. `QISM D #36`: `procurement-request.service.ts` = **qo'lda** tasdiq-zanjiri; `AI_AUTO` + kunlik-unique race-guard yo'q.
- **Nima yetishmaydi:** ⭐ zanjirning yarmi yo'q — omborchi xabar oladi, lekin **sotib olish so'rovi avtomatik yaratilmaydi**. I2 #23 dagi to'liq ta'minot-zanjiri (savdo→AI ombor tekshiradi→ta'minotchi so'rov→CC 3-savat→Kanban→xarid→logistika→ombor kirim) shu nuqtada uziladi.
- **Bog'liqlik:** EP-POS-011 (minimal qoldiq), EP-POS-019 (AI), MM (procurement), VR-POS-I08
- **action:** AI/EVENT
- **⤳ Ta'sir:** MM (snabjeniye), Finance (byudjet), EP-POS-011
- **Xoch-havolalar:** `[Module-19] Item 115` · `[Module-19] Item 36` *(taxminiy)* · `EXTRACTION QISM A #36` · `QISM D #36` · `TASDIQ-2146 §19 #65` · `QISM C 19.65` · `QISM I2 #23`
- **Δ 2026-07-11→08-07:** —

### EP-POS-066 · Buyurtma uchun rezerv (band qilish)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** **A-default:** Reja material rezervlaydi → erkin qoldiq alohida ko'rinadi (jami ╳ erkin). BARCHA_JAVOBLAR rezerv/band mexanizmini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q66 (A-default); BARCHA_JAVOBLAR'da yo'q
- **Dalil (kod):** `stock-reservation.service.ts` `reserve()` metodi o'qildi — `warehouse_stock` orqali `available_quantity` ni tekshiradi, `pos_stock_reservations` jadvalidan (jonli, **0 qator**) va `warehouse_stock.reserved_quantity` ustunidan foydalanadi.
- **Nima yetishmaydi:** kod jonli, **ma'lumot yo'q** (0 rezerv). `QISM A #16`: PP eventidan avto-rezerv (`pp.plan.published` → reserve) tasdiqlanmagan → "reja material rezervlaydi" avtomatik ishlamaydi, faqat qo'lda chaqiruv orqali.
- **Bog'liqlik:** EP-POS-010 (balans-guard), EP-POS-030 (warehouse_stock), EP-POS-040 (kunlik reja)
- **action:** —
- **⤳ Ta'sir:** PP (reja), MES, EP-POS-040
- **Xoch-havolalar:** `[Module-19] Item 116` · `[Module-19] Item 16` *(taxminiy — reserved_qty/available_qty)* · `EXTRACTION QISM A #16` · `TASDIQ-2146 §19 #66` · `QISM C 19.66`
- **Δ 2026-07-11→08-07:** —

### EP-POS-067 · Shoshilinch chiqim (rejasiz/ruxsatli)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11 Δ)*
- **Talab:** **A-default:** Rejasiz chiqim ruxsat etiladi, lekin majburiy sabab + boshliq darhol xabardor. BARCHA_JAVOBLAR sabab-majburiyligini (Q24) yopadi, lekin "rejadan tashqari" maxsus oqimni belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q67 (A-default); BARCHA_JAVOBLAR Q24 qisman (sabab), rejasiz-oqim yo'q
- **Dalil (kod):** `[Module-19] Item 117` (2026-07-11 auditи) = **Yo'q** — `is_unplanned`/`variance_qty` ustuni yoki maxsus favqulodda-chiqim oqimi topilmadi.
- **Nima yetishmaydi:** qaror-o'qi hamon 🔵 (egasi "rejadan tashqari" oqimni tasdiqlamagan), lekin qurilish **Δ dan keyin Qisman** — quyidagi commit auditdan **keyin** kirgan.
- **Bog'liqlik:** EP-POS-005 (sabab), EP-POS-042 (so'rov), EP-POS-071 (Telegram)
- **action:** —
- **⤳ Ta'sir:** PP, EP-POS-042
- **Xoch-havolalar:** `[Module-19] Item 117` · `[Module-19] Item 17` *(taxminiy — is_unplanned)* · `EXTRACTION QISM A #17` · `TASDIQ-2146 §19 #67` · `QISM C 19.67`
- **Δ 2026-07-11→08-07:** ⭐ `b225479e` (2026-07-11) — **`feat(pos): #17/#117 favqulodda chiqim is_unplanned + sabab majburiy + Telegram push`**. Ya'ni `[Module-19] Item 117` "Yo'q" xulosasi commit bilan **bir kunda** eskirgan: `is_unplanned` ustuni, majburiy sabab va boshliqqa darhol Telegram push qurildi. **Audit STALE.**

### EP-POS-068 · Bichish/qirqish chiqimi (ko'p materialdan bo'lak)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** **A-default:** Qisman chiqim — rulon qoldig'i o'lchov birligida kamayadi (ochiq rulon). BARCHA_JAVOBLAR qisman-rulon chiqimini aniq belgilamagan (real-time stok bor, lekin bo'lak-chiqim nozik) — egasi tasdig'i kerak (EP-POS-057 konversiya bilan).
- **Manba:** v2 Q68 (A-default); BARCHA_JAVOBLAR Q39 (real-time) qisman
- **Dalil (kod):** FIFO qisman-taqsimlash mantiqi kontseptual jihatdan `pos-fifo.service.ts:78-103` da mavjud (`allocate()` partiyalar bo'ylab bo'ladi), lekin Item #5 da aniqlanganidek bu metod **mavjud bo'lmagan `pos_batches`** jadvalidan so'raydi → jonli ma'lumotga qarshi ishlay olmaydi. "Ochiq rulon" qoldig'iga xos oqim topilmadi.
- **Nima yetishmaydi:** ⭐ `QISM A #11` bo'yicha `SELECT FOR UPDATE` + `CHECK(quantity>=0)` **qurilgan** (TOCTOU tuzatilgan) — ya'ni manfiy qoldiq himoyasi bor; lekin **rulonning o'lchov-birligida kamayishi** (kg/m konversiyasi) yo'q (EP-POS-057). I2 #9 egasi: "500→400 bo'linmaydi lekin qaytish nazorat" — bu nozik qoida kodda yo'q.
- **Bog'liqlik:** EP-POS-014 (FIFO), EP-POS-057 (birlik konversiyasi), EP-POS-010, EP-POS-036 (qoldiq)
- **action:** —
- **⤳ Ta'sir:** MM (o'lchov), EP-POS-057
- **Xoch-havolalar:** `[Module-19] Item 118` · `[Module-19] Item 5` · `[Module-19] Item 11` *(taxminiy)* · `EXTRACTION QISM A #5` · `QISM A #11` · `TASDIQ-2146 §19 #68` · `QISM C 19.68` · `QISM I2 #9`
- **Δ 2026-07-11→08-07:** —

### EP-POS-069 · Foto-dalil (kirim/brak/inventar farqi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Buzuq qabul/brak/katta farqda foto majburiy (planshet kamerasidan) — dalil bilan himoya. BARCHA_JAVOBLAR AI kamera barcode-o'qish uchun bor, lekin foto-dalil biriktirishni aniq belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q69 (A-default); BARCHA_JAVOBLAR Q16/Q20 (kamera barcode uchun, foto-dalil emas)
- **Dalil (kod):** `[Module-19] Item 119` = **STALE-DOC**. `QISM C 19.69` "Yo'q; grep=0 (faqat cash-register)" **noto'g'ri** — `pos_movements.photo_evidence_url` ustuni jonli va `movement.dto.ts:70` har harakat-yaratish chaqiruviga `photoEvidenceUrl` ni ulaydi (izohda "VISION-3340 #60"); `pos-movement.service.ts`, `movement.dto.ts`, `pos-movement.repository.ts` da havola qilinadi. `pos-shift-handover.repository.ts:49,91,115` da ham `photo_evidence_url`.
- **Nima yetishmaydi:** ⭐ maydon **ixtiyoriy**, majburiy emas — "majburiy" talabi **majburlanmaydi** (QISM C tashvishining aynan shu qismi hamon o'rinli). `QISM D #8`: `evidence_urls` **JSONB** ustuni (ko'p foto) YO'Q — faqat bitta URL; **MinIO/S3** saqlash va **QC da'voga inline uzatish** topilmadi.
- **Bog'liqlik:** EP-POS-023 (brak), EP-POS-052 (buzuq qabul), EP-POS-016 (inventar farqi), EP-POS-051 (akt)
- **action:** —
- **⤳ Ta'sir:** QC, Finance (da'vo), EP-POS-051
- **Xoch-havolalar:** `[Module-19] Item 119` · `[Module-19] Item 8` *(taxminiy — evidence_urls JSONB)* · `EXTRACTION QISM A #8` · `QISM D #8` · `TASDIQ-2146 §19 #69` · `QISM C 19.69`
- **⚠️ ZIDDIYAT:** `QISM C 19.69` "grep=0 — foto biriktirish yo'q" vs `[Module-19] Item 119` "`photo_evidence_url` **jonli va 3 faylda ishlatiladi**". Item to'g'ri; QISM C noto'g'ri kalit-so'z (`attachment`) bilan qidirgan.
- **Δ 2026-07-11→08-07:** —

### EP-POS-070 · Offline yozilgan harakat to'qnashuvi (konflikt)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** **A-default:** Sinxronda to'qnashuv aniqlansa — harakat "tekshirilsin" holatiga, boshliq hal qiladi. BARCHA_JAVOBLAR to'liq offline (Q8) + real-time (Q39) ni tasdiqlagan, lekin konflikt-rezolyutsiyasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q70 (A-default); BARCHA_JAVOBLAR Q8 (offline), Q39 (real-time) — konflikt yo'q
- **Dalil (kod):** Item #4 da to'liq aniqlangan — `pos-sync.service.ts` `push()` `repo.markConflict(entry.id, reason)` va `getStatus()` dagi `conflict` hisoblagichi orqali CONFLICT holatini aniq kuzatadi; takroriy `clientUuid` uchun 409 `ConflictException`. Jadval cheklovi: `pos_offline_queue.sync_status CHECK (PENDING/SYNCED/FAILED/CONFLICT)` (`pos-schema-v2.ts:510-526`).
- **Nima yetishmaydi:** CONFLICT holati **yoziladi**, lekin "boshliq hal qiladi" rezolyutsiya-oqimi (kimga boradi, qanday hal qilinadi) tasdiqlanmadi — `QISM C 19.70` "holat to'liq emas" shuni nazarda tutgan.
- **Bog'liqlik:** EP-POS-021 (offline), EP-POS-010 (balans-guard), EP-POS-081 (nizo — o'xshash naqsh)
- **action:** —
- **⤳ Ta'sir:** EP-POS-010 (balans-guard), EP-POS-021 (offline)
- **Xoch-havolalar:** `[Module-19] Item 120` · `[Module-19] Item 4` *(taxminiy)* · `EXTRACTION QISM A #4` · `QISM D #4` · `TASDIQ-2146 §19 #70` · `QISM C 19.70`
- **Δ 2026-07-11→08-07:** —

### EP-POS-071 · Telegram/bildirishnoma — qaysi hodisa kimga
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** To'liq Telegram Mini App (barcode skan, so'rov, tarix, tasdiqlash); topilmasa admin Telegram xabar. Hodisa→rol matritsasi admin panelda sozlanadi (v2-A ruhida). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q59 (Telegram Mini App), Q18 (admin Telegram xabar)
- **Dalil (kod):** Rol-asosli Telegram marshrutlash `pos.events.ts` / `pos-secondary-events.handler.ts` bo'ylab keng qurilgan (`eventRepo.findByRoles([...])` naqshi 6+ marta). `SELECT count(*) FROM pos_telegram_routes` → **0 qator** — sozlanadigan hodisa→rol matritsa jadvali bor, lekin **bo'sh**; joriy marshrutlash har-handler'dagi **qattiq yozilgan rol ro'yxatlari** bilan, jadval bilan emas. `QISM D #40`: `/pos/mini-app/auth` (`mini-app.controller.ts:81,92`) → `pos-telegram.service.ts:98` `validateInitData` (initData HMAC-SHA256) → `posTelegramSessions` session-token.
- **Nima yetishmaydi:** ⭐ (1) **matritsa amalda ishlatilmaydi** — egasi "qaysi hodisa kimga" ni sozlay olmaydi (qattiq kod); (2) sof JWT-SSO emas, session-token modeli; FE `/pos/mini-app` route'i CLAUDE.md F4 bo'yicha **o'chirilgan**; (3) ⚠️ **O'lik dublikat (2026-08-07 live tasdiq):** `apps/api/src/modules/pos/application/services/telegram-bot.service.ts` (144 qator) — `pos.module.ts:61,234` da provider sifatida ro'yxatdan o'tgan va `pos.module-imports.ts:145` da re-eksport qilingan, lekin **hech qayerda inyeksiya qilinmaydi/chaqirilmaydi** (grep → faqat ta'rif + modul ro'yxati + re-eksport). **2026-08-06 topilmasi TASDIQLANADI.**
- **Bog'liqlik:** EP-POS-008 (eskalatsiya), EP-POS-028 (master-data), Notifications moduli
- **action:** EVENT/NTF
- **⤳ Ta'sir:** Notifications, EP-POS-028
- **Xoch-havolalar:** `[Module-19] Item 121` · `[Module-19] Item 40` *(taxminiy — Mini App JWT SSO)* · `[Module-19] Item 1` *(taxminiy — eskalatsiya)* · `EXTRACTION QISM A #1` · `QISM A #40` · `QISM D #40` · `TASDIQ-2146 §19 #71` · `QISM C 19.71`
- **Δ 2026-07-11→08-07:** `9ea7c155` (08-07) — `pos-telegram-ext.service.ts:20-27` dagi **aniqlanmagan `POS_TELEGRAM_BOT_TOKEN`** tuzatildi: env-var `.env`/`.env.example`/`env.schema.ts` ning hech qaysisida aniqlanmagan edi → **har bir bildirishnoma jimgina no-op** bo'lardi ("QC tekshiruv kerak" / "Tasdiqlash kutilmoqda" hech kimga yetmasdi). Endi kanonik `TELEGRAM_BOT_TOKEN` ga fallback bor (live: `:26`).

### EP-POS-072 · Tayyor mahsulot jo'natish (отгрузка) POS'dami
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-04 Δ)*
- **Talab:** EXTERNAL_OUT FAQAT tayyor mahsulot ombori (POS'da), SD bilan bog'liq: tasdiq ombor menejer + moliya + AI (to'lov tekshiruv). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q22 (EXTERNAL_OUT FG ombori, +moliya+AI), Q58 (SD integratsiya)
- **Dalil (kod):** `movement-enums.ts:8` — `EXTERNAL_OUT` turi tasdiqlangan; `pos_movements.invoice_id`/`three_way_matched` ustunlari jonli; `auto-gl-posting.service.ts:63-65` `EXTERNAL_OUT` da AR/Revenue + COGS yozadi; FINANCE-approve marshruti (Item 59) tasdiqlangan.
- **Nima yetishmaydi:** ⚠️ 2026-07-11 auditida `QISM D #26` "kredit-limit tekshiruvi **yo'q**" va `QISM A #39` "SD status avto-yangilanishi cross-ref kerak" edi — ikkalasi ham Δ da yopildi (pastga qarang). I2 #14 talabi (**AI kamera** chiqimda suratga oladi + buyurtmaga bog'laydi, invoys QR o'qiydi, ombor+xavfsizlik tasdiqlaydi) hamon yo'q.
- **Bog'liqlik:** EP-POS-024 (FG kirim), EP-POS-048 (pasport), EP-POS-073 (накладная), SD
- **action:** CREATE/APPROVE
- **⤳ Ta'sir:** SD (jo'natish), Finance (sotuv), EP-POS-024
- **Xoch-havolalar:** `[Module-19] Item 122` · `[Module-19] Item 26` *(taxminiy — kredit-limit)* · `[Module-19] Item 39` *(taxminiy — dispatched event→SD)* · `EXTRACTION QISM A #26` · `QISM A #39` · `QISM D #26` · `TASDIQ-2146 §19 #72` · `QISM C 19.72` · `QISM I2 #14`
- **Δ 2026-07-11→08-07:** ⭐ **ikkita katta bo'shliq yopildi:** `9599b862` (07-11) — `#26 EXTERNAL_OUT chiqimda mijoz kredit-limiti real-time tekshiriladi` (`QISM D #26` "grep `credit_limit` → 0 hit" endi eskirgan); `567ce6f8` (08-04) — `EXTERNAL_OUT` da tovar ombordan chiqqanda **SD'ga event chiqariladi** (`QISM A #39` "SD status avto" yopildi).

### EP-POS-073 · Marshrut varaqasi (накладная) chop etish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Har harakatda akt (PDF) + invoice (alohida PDF) chop etiladi; label ZPL/EPL/PDF. Qog'oz накладная opsiyasi printerga. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q41 (harakat akti PDF + invoice), Q19 (label ZPL/EPL/PDF), Q55 (PDF+Excel)
- **Dalil (kod):** `pos_movements.act_pdf_path`/`invoice_pdf_path` ustunlari jonli; `pos-pdf.service.ts`/`pos-pdf.types.ts` mavjud; `pos.events.ts:196-239` — `_saveCompletedActPdf()` `completed` holatida akt PDF'ni generatsiya qiladi va saqlaydi, Telegram xabari bilan.
- **Nima yetishmaydi:** ZPL/EPL label formatlari tasdiqlanmadi (faqat PDF). I2 #29 talabi (**bitta umumiy zamonaviy shablon**, imzo = ERP login avtomatik) — `pdf_templates` bor, lekin yagona-shablon standarti tasdiqlanmadi.
- **Bog'liqlik:** EP-POS-007 (label), EP-POS-051 (akt), EP-POS-072 (jo'natish), EP-POS-050 (smena akti PDF — yo'q)
- **action:** EXPORT
- **⤳ Ta'sir:** EP-POS-007 (printer), SD (jo'natish hujjati)
- **Xoch-havolalar:** `[Module-19] Item 123` · `TASDIQ-2146 §19 #73` · `QISM C 19.73` · `QISM I2 #29` · `QISM I2 #28`
- **Δ 2026-07-11→08-07:** —

### EP-POS-074 · Razryad/malaka — kim qaysi harakatni qila oladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Rol ERP'dan avto tortiladi; faqat o'sha bo'lim xodimlari chiqim qila oladi; har harakat turi tegishli tasdiq (menejer/moliya) talab qiladi. Razryad-darajali huquq org-karta bilan uyg'unlashadi. (v2-A ruhida)
- **Manba:** BARCHA_JAVOBLAR Q10 (rol avto), Q12 (faqat bo'lim chiqim), Q21–Q25 (tasdiq darajalari)
- **Dalil (kod):** `PosDepartmentGuard`/`PosWarehouseAccessGuard` (Item #38, to'liq o'qilgan) rol+bo'lim asosidagi kirishni majburlaydi; guard kodida **razryad-darajali farqlanish topilmadi** — u butun rol ro'yxatini razryaddan qat'i nazar ozod qiladi.
- **Nima yetishmaydi:** ⭐ **ikki qavatli bo'shliq:** (1) razryad-darajali huquq umuman yo'q (karta-permission manbasi tayyor emas — SB0190, `CARD_PERMISSION_SOURCE_READY=false`); (2) ⚠️ **guard'larning o'zi hech qayerda `@UseGuards()` bilan qo'llanilmagan** (2026-08-07 live tasdiq — qv. EP-POS-003) → bo'lim-darajali izolyatsiya ham amalda ishlamaydi. Ya'ni bu bandda **hech qanday huquq-ajratmasi jonli emas**.
- **Bog'liqlik:** EP-POS-003 (bo'lim izolyatsiyasi), EP-POS-002 (login), EP-POS-009 (tasdiq), EP-POS-029 (karta)
- **action:** APPROVE
- **⤳ Ta'sir:** HR (razryad), EP-POS-009, EP-POS-002
- **Xoch-havolalar:** `[Module-19] Item 124` · `[Module-19] Item 38` *(taxminiy — RBAC guard)* · `EXTRACTION QISM A #38` · `QISM D #38` · `TASDIQ-2146 §19 #74` · `QISM C 19.74`
- **Δ 2026-07-11→08-07:** **Live tasdiq (08-07):** `PosDepartmentGuard`/`PosWarehouseAccessGuard` hamon **o'lik** — `grep` faqat ta'rif (`pos-department.guard.ts:25,47`), provider (`pos.module.ts:53,165`) va re-eksport (`pos.module-imports.ts:115`) topdi; hech bir kontrollerda `@UseGuards` yo'q. **2026-08-06 topilmasi TASDIQLANADI.**

### EP-POS-075 · Kunlik hisobotni kim ko'radi (vertikal)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Analytics: AI (rejalashtirish) + Direktor (strategik) + Moliya (oylik) + Ombor menejer (kunlik) — har daraja o'z kesimini ko'radi (vertikal). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q57 (analytics kim uchun — AI/Direktor/Moliya/Menejer)
- **Dalil (kod):** `pos-reports.service.ts` / `warehouse-kpi.service.ts` mavjud (ombor/xodim kesimidagi KPI hisoboti bor, Item 77). **`manager_id` asosidagi yuqoriga-yig'ish (roll-up) zanjiri bu servislarga ulanmagan.**
- **Nima yetishmaydi:** ⭐ vertikal (org-karta `manager_id` bo'ylab) oqim yo'q — hisobotlar mavjud, lekin ular "har daraja o'z kesimini" avtomatik ko'rmaydi. `QISM A #50`: `pos_director_summary` **materialized view** + 5-daqiqalik cron + GL'ga drill-down **yo'q** (grep → 0).
- **Bog'liqlik:** EP-POS-029 (GSD), EP-POS-056 (formula), EP-POS-080 (audit ko'rinishi), Director moduli
- **action:** READ/EXPORT
- **⤳ Ta'sir:** Director, Coordination, EP-POS-056
- **Xoch-havolalar:** `[Module-19] Item 125` · `[Module-19] Item 50` *(taxminiy — director MV)* · `EXTRACTION QISM A #50` · `QISM D #50` · `TASDIQ-2146 §19 #75` · `QISM C 19.75`
- **Δ 2026-07-11→08-07:** —

### EP-POS-076 · Buyurtma o'zgarishi (chiqarilgan materialga ishlov)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** **A-default:** Buyurtma o'zgarsa POS ogohlantiradi + chiqarilgan material qaytarish taklif qilinadi. BARCHA_JAVOBLAR buyurtma-o'zgarish reaktsiyasini belgilamagan (qaytarish harakati bor, lekin o'zgarish-trigger yo'q) — egasi tasdig'i kerak.
- **Manba:** v2 Q76 (A-default); BARCHA_JAVOBLAR Q24 (qaytarish bor), o'zgarish-trigger yo'q
- **Dalil (kod):** `PosTechCardGateService.recheckOnOrderChange()` (`pos-techcard-gate.service.ts:130-167`) qayta-tekshirish mantiqini **to'liq amalga oshiradi** va `movements.controller.ts:179` (`/recheck-techcard`) orqali ochiq — lekin bu **qo'lda chaqiriladigan endpoint**, avtomatik buyurtma-o'zgarish event listener'i emas (`Grep "sd\.order\.updated|order\.updated"` POS'da → 0 hit).
- **Nima yetishmaydi:** ⭐ **listener yo'q** → SD/PP buyurtmani o'zgartirsa POS **hech nima sezmaydi**; planshetda "qaytarish tavsiya" modali yo'q. Qobiliyat bor, tetik yo'q.
- **Bog'liqlik:** EP-POS-032 (texkarta gate), EP-POS-058 (qaytarish), SD/PP (event chiqarish)
- **action:** —
- **⤳ Ta'sir:** PP (reja o'zgarishi), SD, EP-POS-058
- **Xoch-havolalar:** `[Module-19] Item 126` · `[Module-19] Item 18` *(taxminiy — sd.order.updated listener)* · `[Module-19] Item 3` · `EXTRACTION QISM A #18` · `QISM D #18` · `TASDIQ-2146 §19 #76` · `QISM C 19.76`
- **⚠️ ZIDDIYAT:** `QISM C 19.76` "Yo'q — listener topilmadi, avto-trigger yo'q" vs `[Module-19] Item 126` "listener yo'qligi to'g'ri, **lekin qayta-tekshirish qobiliyati bor va chaqiriladi**". Item aniqroq: registrda **Qisman**.
- **Δ 2026-07-11→08-07:** —

### EP-POS-077 · Tungi smena / kechki harakat anomaliyasi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** **A-default:** Smena jadvalidan tashqari vaqt + norma-oshiq chiqim avto shubhali belgilanadi → boshliq. BARCHA_JAVOBLAR audit log (Q6) + AI (Q57) ni tasdiqlagan, lekin vaqt+miqdor anomaliya-detektorini aniq belgilamagan — egasi tasdig'i kerak (EP-POS-020/044 bilan).
- **Manba:** v2 Q77 (A-default); BARCHA_JAVOBLAR Q6 (audit log), Q57 (AI) — anomaliya aniq emas
- **Dalil (kod):** `[Module-19] Item 127` = **STALE-DOC**. `QISM C 19.77` "Yo'q; detektor yo'q" **so'zma-so'z rad etilgan** — `pos-anomaly.service.ts:129` to'g'ridan o'qildi: aniq tungi-smena qoidasi mavjud — `` `Soat ${hour}:00 da ${qty} birlik (…) harakat — tungi smena anomaliyasi` `` → `pos_anomaly_flags` ga jiddiylik darajasi va boshliq xabari bilan yoziladi.
- **Nima yetishmaydi:** ⭐ **Chegaralar CRUD-sozlanmaydi (2026-08-07 live tasdiq).** `apps/api/src/common/constants/business.constants.ts:416-436` da **5 ta POS-anomaliya konstantasi kompilyatsiya-vaqtida qattiq yozilgan**:
>     `:422` `POS_NIGHT_SHIFT_START_HOUR = 22` · `:423` `POS_NIGHT_SHIFT_END_HOUR = 6`
>     `:426` `POS_NIGHT_LARGE_QTY_THRESHOLD = 1000` · `:429` `POS_NIGHT_LARGE_VALUE_THRESHOLD = 50_000_000`
>     `:436` `POS_SEND_RECEIVE_TOLERANCE = 0.001`
>   (qo'shimcha: `:442` `POS_OVER_NORM_FACTOR = 1.10` — EP-POS-044 uchun.) Bular `business_settings` ga ko'chirilishi kerak — egasi smena soatini yoki miqdor chegarasini o'zgartira olmaydi. **2026-08-06 topilmasi TASDIQLANADI.** Norma-oshiq shoxi esa EP-POS-044 dagi yo'q-guard sababli ishlamaydi.
- **Bog'liqlik:** EP-POS-020 (anomaliya detektori), EP-POS-044 (norma-fakt), EP-POS-081 (`POS_SEND_RECEIVE_TOLERANCE`)
- **action:** —
- **⤳ Ta'sir:** AI (anomaliya), HR (smena jadvali), EP-POS-044
- **Xoch-havolalar:** `[Module-19] Item 127` · `[Module-19] Item 15` *(taxminiy)* · `EXTRACTION QISM A #15` · `QISM D #15` · `TASDIQ-2146 §19 #77` · `QISM C 19.77`
- **⚠️ ZIDDIYAT:** `QISM C 19.77` "Yo'q — detektor yo'q" vs `[Module-19] Item 127` "`pos-anomaly.service.ts:129` da **aynan tungi-smena qoidasi bor**". Item to'g'ri (so'zma-so'z zid).
- **Δ 2026-07-11→08-07:** —

### EP-POS-078 · Material kartasini kim yaratadi (omborchimi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Skanerda topilmasa — yangi kartochka yaratish + admin Telegram xabar (MM tasdiqi yo'nalishida). MM bilan to'liq integratsiya; yangi material MM'ga so'rov sifatida boradi. (v2-A ruhida; topilmasa yaratish + admin xabar)
- **Manba:** BARCHA_JAVOBLAR Q18 (topilmasa: qo'lda qidirish + yangi kartochka + admin Telegram), Q58 (MM integratsiya)
- **Dalil (kod):** `QISM D #10`: `material_card_suggestions` jadvali (`pos-schema-v2.ts:611` — `unknownBarcode`/`aiConfidence`/`createdMaterialCardId`) + `pos-barcode-ext.service.ts:55` `reviewAiSuggestion` + endpointlar `barcode.controller.ts:101,110`. `[Module-19] Item 128`: `tmp_`-DRAFT + MM-tasdiq workflow'i **topilmadi**.
- **Nima yetishmaydi:** ⭐ **`tmp_` prefiksli DRAFT karta + `mm_material_requests` ga yo'naltirish + MM-rad → CANCELLED oqimi YO'Q.** Joriy holat = ad-hoc "admin'ga xabar ber" fallback'i, rasmiy MM-tasdiq workflow'i emas → omborchi ish to'xtatmasdan davom eta olmaydi.
- **Bog'liqlik:** EP-POS-006 (barcode), EP-POS-033 (gofra qavat), MM (master-data)
- **action:** CREATE
- **⤳ Ta'sir:** MM (master-data), EP-POS-033, EP-POS-037
- **Xoch-havolalar:** `[Module-19] Item 128` · `[Module-19] Item 10` *(taxminiy — tmp_ DRAFT)* · `EXTRACTION QISM A #10` · `QISM D #10` · `TASDIQ-2146 §19 #78` · `QISM C 19.78`
- **Δ 2026-07-11→08-07:** —

### EP-POS-079 · Eski tizimdan boshlang'ich qoldiq (начальный остаток)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** **A-default:** Ishga tushishda bir martalik to'liq inventar (real sanash) → boshlang'ich qoldiq (eng ishonchli). EP-POS-046 (A-System) hal bo'lgach aniqlanadi. BARCHA_JAVOBLAR boshlang'ich-qoldiq strategiyasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q79 (A-default); BARCHA_JAVOBLAR'da yo'q
- **Dalil (kod):** Item #24 bilan bir xil topilma — POS modulida **opening-balance / import mexanizmi topilmadi**. `QISM D #24`: grep `opening_balance|openingBalance|opening` @ pos → **0 hit**; direktor-tasdig'i oqimi ham yo'q.
- **Nima yetishmaydi:** ⭐ **EGASI-GATE, zanjirli:** FULL-ITEM tasnifi: code-buildable-now = A-System eksport formati ma'lum bo'lgach; **owner-gated = A-System migratsiya strategiyasi (Item #96 / EP-POS-046) avval hal qilinishi shart**. ⚠️ Bu band **FULL COMPANY RESET (2026-07-11)** bilan bevosita bog'liq — DB 0 dan boshlanadi, egasi real kompaniyani CRUD orqali quradi.
- **Bog'liqlik:** EP-POS-046 (A-System — bloklovchi), EP-POS-015 (inventar), EP-POS-012 (opening GL)
- **action:** —
- **⤳ Ta'sir:** EP-POS-046 (A-System), EP-POS-015 (inventar)
- **Xoch-havolalar:** `[Module-19] Item 129` · `[Module-19] Item 24` *(taxminiy — opening balance GL)* · `EXTRACTION QISM A #24` · `QISM D #24` · `TASDIQ-2146 §19 #79` · `QISM C 19.79`
- **Δ 2026-07-11→08-07:** —

### EP-POS-080 · Harakat tarixini kim ko'ra oladi (audit)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** To'liq audit log (har klik, har o'zgarish, IP, timestamp) 7 yil saqlanadi; tarix o'zgarmas (faqat o'qish). Xodim "Mening inventarim" sahifasidan o'zinikini, boshliq/menejer hammasini ko'radi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q6 (to'liq audit), Q7 (7 yil retention), Q47 (xodim o'z inventari)
- **Dalil (kod):** `SELECT count(*) FROM pos_audit_log` → **65 qator**; `pos-audit.service.ts`/`pos-audit.repository.ts` mavjud. FE `PosMyInventory` sahifasi (`QISM C 19.80`).
- **Nima yetishmaydi:** ⚠️ **7 yillik retention amalga oshirilmagan:** `QISM A #41` / `QISM D #41`: grep `PARTITION` @ pos + schema → **0 hit**; `posMovements` oddiy serial PK + indekslar (`pos-schema-v2.ts:144-151`) — yillik partitioning, 3y+ arxiv va UNION-fetch **yo'q**. Katta hajmda ishlash muammosi + 7-yillik saqlash siyosati kafolatlanmagan. Ko'rinish-ajratmasi (`xodim o'ziniki` vs `boshliq hammasi`) esa o'lik guard'lar sababli majburlanmaydi (qv. EP-POS-003).
- **Bog'liqlik:** EP-POS-003 (guard), EP-POS-022 (storno audit), EP-POS-054 (harakatsizlik)
- **action:** READ
- **⤳ Ta'sir:** Director (audit), EP-POS-022 (storno)
- **Xoch-havolalar:** `[Module-19] Item 130` · `[Module-19] Item 41` *(taxminiy — partitioning/arxiv)* · `EXTRACTION QISM A #41` · `QISM D #41` · `TASDIQ-2146 §19 #80` · `QISM C 19.80`
- **⚠️ ZIDDIYAT:** `QISM C 19.80` "**Ha** — audit to'liq" vs `QISM D #41` "7-yillik retention uchun partitioning/arxiv **yo'q**". Ikkalasi turli qismga qaragan; registrda **Qisman** (audit yozuvi bor, retention siyosati yo'q).
- **Δ 2026-07-11→08-07:** —

### EP-POS-081 · Yuk topshirishda nomuvofiqlik (topshir↔qabul farqi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11 Δ)*
- **Talab:** **A-default:** Topshirish↔qabul 2 imzo; farq bo'lsa "nizo" holati + boshliq hal qiladi. BARCHA_JAVOBLAR akt (Q42 kim topshirdi/qabul qildi) ni tasdiqlagan, lekin farq-nizo rezolyutsiyasini belgilamagan — egasi tasdig'i kerak (EP-POS-050 bilan bog'liq, Q11-zidlik).
- **Manba:** v2 Q81 (A-default); BARCHA_JAVOBLAR Q42 qisman (akt bor), nizo-oqim yo'q
- **Dalil (kod):** `[Module-19] Item 131` (2026-07-11 auditи) = **Yo'q** — `pos_movement_confirmations` jadvali bor (17 qator, Item 58), lekin `Grep "nizo|dispute|discrepancy"` (katta-kichik harfsiz) POS'da faqat **boshqa** (oversell-clamping) bug haqidagi izohga mos kelgan; nizo-rezolyutsiya workflow'i topilmadi. FULL-ITEM tasnifi: **Code-buildable-now** (topshirilgan↔qabul qilingan miqdorlar farq qilganda `pos_movement_confirmations` ga nizo holati qo'shish, bo'lim boshlig'iga marshrutlash); egasi-gate yo'q.
- **Nima yetishmaydi:** qaror-o'qi hamon 🔵 (Q11-zidligi bilan bog'liq, EP-POS-050 bilan birga hal qilinishi kerak), qurilish Δ dan keyin Qisman. ⚠️ Farq chegarasi `POS_SEND_RECEIVE_TOLERANCE = 0.001` (`business.constants.ts:436`) — **kompilyatsiya-vaqtida qattiq yozilgan**, CRUD-sozlanmaydi.
- **Bog'liqlik:** EP-POS-050 (2-imzo akti), EP-POS-051 (qabul akti), EP-POS-070 (konflikt — o'xshash naqsh), EP-POS-077 (tolerans konstantasi)
- **action:** —
- **⤳ Ta'sir:** MES (sex qabuli), EP-POS-050, EP-POS-031
- **Xoch-havolalar:** `[Module-19] Item 131` · `TASDIQ-2146 §19 #81` · `QISM C 19.81`
- **Δ 2026-07-11→08-07:** ⭐ `086fb5db` (2026-07-11) — **`feat(pos): #131 yuk topshirish nizo holati (DISPUTED) qo'shildi`**. Ya'ni `[Module-19] Item 131` "Yo'q" xulosasi commit bilan **bir kunda** eskirgan — `DISPUTED` holati qurildi. **Audit STALE.**

### EP-POS-082 · POS Monitor til/ko'rinish (omborchi uchun)
- **Qaror holati:** ✅ JAVOBLANGAN *(qisman — kirill ochiq)*
- **Qurilish holati:** — (mos item topilmadi) *(2026-07-11)*
- **Talab:** O'zbek + Rus (foydalanuvchi tanlaydi), ikonka-markaz responsive dizayn. **Nozik:** kitob kirill-o'zbekda — uchinchi til (kirill) qo'shilishi v2-A taklifi, lekin BARCHA_JAVOBLAR faqat O'zbek(lotin)+Rus deydi → kirill qo'shish egasi qarori.
- **Manba:** BARCHA_JAVOBLAR Q4 (O'zbek + Rus, foydalanuvchi tanlaydi), Q3 (responsive)
- **Dalil (kod):** `[Module-19] Item 132` — audit **mustaqil qayta tekshirmagan**: "bu asosan i18n/FE da'vosi (`name_ru` maydoni); bu o'tishning faqat-backend qamrovi FE i18n konfiguratsiya fayllarini o'qimagan, shuning uchun jadvalning 'uz+ru tasdiq; kirill=egasi qarori' da'vosini `apps/api/src` dan qayta tasdiqlab bo'lmaydi — takrorlash o'rniga bayroqlandi". `QISM C 19.82` (2026-06-27): "Qisman — `name_ru` bor; uz+ru tasdiq; kirill = egasi qarori".
- **Nima yetishmaydi:** ⭐ **Qurilish holati aniqlanmagan** — bu registrdagi yagona "mos item topilmadi" bandi (audit qamrovi tashqarisida qolgan). Kirill (uchinchi til) egasi qarori kutmoqda. Loyiha xotirasi bo'yicha i18n 3-til (uz/ru/en) qurilgan, lekin **kirill-o'zbek** alohida til sifatida emas — `docs/` da translit qatlami bor (i18n Phase 3.2A), POS FE'da tasdiqlanmagan.
- **Bog'liqlik:** EP-POS-026 (ekran), i18n moduli
- **action:** READ
- **⤳ Ta'sir:** i18n, EP-POS-026
- **Xoch-havolalar:** `[Module-19] Item 132` · `TASDIQ-2146 §19 #82` · `QISM C 19.82`
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-bo'shliqlari (VR-POS-I01..I12)

> Bu bandlar `EP-POS-###` qaror-xaritasida **umuman yo'q**, lekin vizyon manbalarida
> aniq talab sifatida turadi. Ko'pchiligi **QISM I2** (`OMBOR-KASSIR-INTERVYU-2026-06-08.md`,
> egasining 1–4 iyun to'g'ridan javoblari) dan keladi — bu POS uchun eng kuchli manba,
> chunki egasi POS Monitor haqida aynan shu yerda gapirgan.

### VR-POS-I01 · POS Monitor to'liq qayta loyihalash talabi
- **Qaror holati:** ✅ JAVOBLANGAN *(egasi aniq talab qilgan)*
- **Qurilish holati:** — (bajarilgani hujjatlanmagan)
- **Talab:** Egasi (§0, s2): POS Monitor'ning hozirgi holati "**umuman man xohlagan narsa emas**" — BE+FE to'liq tahlil + **qayta dizayn** talab qilingan, build'dan **oldin**.
- **Manba:** `QISM I2 #1` + `EXTRACTION QISM A` Ochiq-savollar ("POS Monitor hozirgi holati egasi xohlaganidan EMAS")
- **Dalil (kod):** `QISM C 19.26` "44 FE sahifa, `PosMonitorApp`+`PosLayout`" — ya'ni **eski dizayn ustiga qurish davom etgan**. `[Module-19] Item 76`: FE mustaqil tekshirilmagan. Qayta-dizayn hujjati topilmadi.
- **Nima yetishmaydi:** ⭐ **Butun modul uchun eng yuqori darajadagi ochiq savol.** Barcha 82 EP-bandi mavjud dizayn ustida ishlaydi; agar egasi qayta-dizaynni hamon talab qilsa, ularning FE qismi qayta ko'rib chiqilishi kerak. `EXTRACTION QISM A` buni "hali bajarilmagan" deb ro'yxatga olgan (2026-07-07).
- **Bog'liqlik:** EP-POS-001, EP-POS-026, VR-POS-I02
- **action:** —
- **⤳ Ta'sir:** Butun POS FE

### VR-POS-I02 · Ombor ko'rinishi = Excel jadval (kartochka EMAS)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (tekshirilmagan)
- **Talab:** Egasi (§1, s16): ombor ko'rinishi **Excel-uslubidagi jadval** bo'lishi kerak, kartochka-ko'rinish emas.
- **Manba:** `QISM I2 #6`
- **Dalil (kod):** FE tekshirilmagan (`[Module-19] Item 76` — backend-only qamrov).
- **Nima yetishmaydi:** UI paradigmasi tasdiqlanmagan. ⚠️ Diqqat: bu **"ERP tashqarisida ish YO'Q"** qoidasi bilan uyg'un — egasi Excel-ga o'xshash **ERP ichida** ishlashni istaydi, eksport qilishni emas.
- **Bog'liqlik:** VR-POS-I01, EP-POS-026
- **action:** —
- **⤳ Ta'sir:** POS FE, WMS FE

### VR-POS-I03 · 7 asosiy ombor taksonomiyasi (markaziy ombor YO'Q)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman
- **Talab:** Egasi (§1, s17): **markaziy ombor YO'Q** — 7 asosiy ombor: rulon / tayyor-mahsulot / hom-ashyo / xo'jalik / jihozlar / makulatura-brak / asbob-uskuna. Qo'shimcha (§17 A1): **Jihozlar ombori** (kompyuter/mebel/forma) ≠ **Asbob-uskuna** (qolip/STP/pichoq/klishe) — ikki **alohida** tur. Karantin+Sifat ombori → QC moduli; Flekso+Ofset → PP; Mexaniklar alohida sahifa.
- **Manba:** `QISM I2 #4`, `#5`, `#32`
- **Dalil (kod):** POS'da `MAIN`/`QUARANTINE`/`PRODUCTION_*`/`FINISHED`/`DEPARTMENT_*`/`QC`/`DEFECTIVE`/`WIP`/`SCRAP-MAIN` turlari jonli (`QISM C 19.29/19.31/19.35`). **Makulatura alohida `warehouse_type` yo'q** (Item #87). Jihozlar↔Asbob-uskuna ajratmasi tasdiqlanmadi.
- **Nima yetishmaydi:** egasining 7-ombor taksonomiyasi kodda **to'liq aks etmagan**; ayniqsa makulatura-brak va jihozlar/asbob-uskuna ajratmasi.
- **Bog'liqlik:** EP-POS-037 (makulatura), EP-POS-003 (bo'lim omborlari), WMS
- **action:** —
- **⤳ Ta'sir:** WMS taksonomiyasi, POS ombor ro'yxati

### VR-POS-I04 · Hom-ashyo overflow → bo'lim ichki omboriga (AI ikkala ombordan rasxod)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q
- **Talab:** Egasi (§2, s22-24): 5 kg berilsa va 3 kg ishlatilsa, **+2 kg bo'lim ichki omboriga** o'tadi, hom-ashyo ombori **−2** belgilaydi; AI keyingi ishda **ikkala ombordan** rasxod qiladi. Har bo'limda `DEPARTMENT_*` tipidagi ichki ombor bo'lishi kerak.
- **Manba:** `QISM I2 #7` (+A5)
- **Dalil (kod):** `DEPARTMENT_*` ombor tipi mavjud (`QISM C`), `INTERNAL_ISSUE`/`INTERNAL_RETURN` turlari bor. **Overflow-mantiq (avto qoldiq-ko'chirish + AI ikki-ombordan rasxod) topilmadi.**
- **Nima yetishmaydi:** ⭐ egasining eng aniq operatsion qoidalaridan biri — **qurilmagan**. Bu EP-POS-058 (ortgan material) ning avtomatlashtirilgan varianti.
- **Bog'liqlik:** EP-POS-058, EP-POS-019 (AI), EP-POS-043 (tannarx)
- **action:** —
- **⤳ Ta'sir:** WMS, MES, AI

### VR-POS-I05 · Brak normasi + normadan oshiq → xodimdan ushlab qolish
- **Qaror holati:** ✅ JAVOBLANGAN *(E1 printsipi bilan cheklangan)*
- **Qurilish holati:** Yo'q
- **Talab:** Egasi (§5, s39-48): brak **NORMASI** har buyurtmaga belgilanadi; normadan oshiq brak → **xodimdan ushlanadi**. Lahtak (qoldiq) aybdor profiliga o'tadi, aybdorni **ombor menejeri qo'lda** belgilaydi (§6, s54).
- **Manba:** `QISM I2 #11`, `#16` (+ `vision-1000-answers HR#5`: salbiy ball faqat rahbar tasdig'i bilan — E1)
- **Dalil (kod):** POS'da brak-norma jadvali yoki HR-Payroll ushlab-qolish trigger'i **topilmadi**. `defect_catalog`/`material_norms` bor, lekin buyurtma-darajali brak normasi yo'q.
- **Nima yetishmaydi:** ⭐ zanjir uch joyda uzuq: (1) buyurtma-darajali brak normasi yo'q; (2) POS→HR-Payroll ushlab-qolish eventi yo'q; (3) "aybdorni menejer qo'lda belgilaydi" UI yo'q. ⚠️ **E1 printsipi:** avtomatik jazo mumkin emas — faqat rahbar tasdig'i bilan.
- **Bog'liqlik:** EP-POS-023 (DAMAGE), EP-POS-058 (lahtak), EP-POS-044 (norma), HR-Payroll
- **action:** —
- **⤳ Ta'sir:** HR (payroll ushlab qolish), QC, Finance

### VR-POS-I06 · Sikl-sanash davriyligi: rulon/hom-ashyo haftalik, qolgani oylik
- **Qaror holati:** ✅ JAVOBLANGAN *(egasi javob bergan — `decisions` ko'rmagan)*
- **Qurilish holati:** Yo'q
- **Talab:** Egasi (§17 A6): inventarizatsiya = **sikl-sanash**; **rulon/hom-ashyo — haftalik**, **qolgani — oylik**; tunda/dam kuni, **zona muzlatiladi**.
- **Manba:** `QISM I2 #31`
- **Dalil (kod):** `pos_inventory_plans` bor, davriylikni haydovchi cron **yo'q** (Item #67); zona-freeze **yo'q** (Item #113).
- **Nima yetishmaydi:** ⭐ **EP-POS-017 va EP-POS-063 ni ochiq holatdan chiqaradi.** Bu javob `decisions/19-pos.md` ga hech qachon kirmagan → ikki band ~2 oy "egasi-data kutmoqda" deb turgan, aslida javob 2026-06-08 dan beri mavjud. **Tavsiya:** `business_settings` ga `pos.cycle_count_period_days_hot=7` / `pos.cycle_count_period_days_cold=30` kalitlarini CRUD-sozlanadigan qilib qo'shish.
- **Bog'liqlik:** EP-POS-017 ⭐, EP-POS-063 ⭐, EP-POS-015
- **action:** —
- **⤳ Ta'sir:** Inventar cron, WMS

### VR-POS-I07 · Pres kirim oqimi (POS sahifa → kg → shtrix-kod → avto kirim + AI kamera)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman
- **Talab:** Egasi (§12, s43-44): pres (yarim-tayyor) kirimi — **POS sahifasi** → kg kiritiladi → printer shtrix-kod chiqaradi → yopishtiriladi → ERP **avto kirim** qiladi + AI kamera tasdiqlaydi.
- **Manba:** `QISM I2 #27`
- **Dalil (kod):** `AutoBarcodeService.generateForMovement()` (EP-POS-007) va `INTERNAL_TRANSFER`/WIP (EP-POS-047) qismlari bor. **Pres-spetsifik oqim va AI-kamera tasdig'i topilmadi.**
- **Nima yetishmaydi:** oqim qismlari mavjud, lekin **yagona pres-kirim ssenariysi** sifatida birlashtirilmagan; AI kamera yo'q.
- **Bog'liqlik:** EP-POS-007, EP-POS-047, EP-POS-024, IoT
- **action:** —
- **⤳ Ta'sir:** POS FE, IoT/AI

### VR-POS-I08 · To'liq ta'minot-zanjiri (savdo → AI ombor → CC 3-savat → Kanban → xarid → ombor kirim)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman
- **Talab:** Egasi (§9, s5-6): **oltin-ip xarid tomoni** — savdo buyurtmasi → AI ombor qoldig'ini tekshiradi → ta'minotchiga so'rov → **CC 3-savat** → **Kanban (org-sxema tasdig'i)** → xarid → logistika → **ombor barcode kirim**.
- **Manba:** `QISM I2 #23` (+ `#2` "hech kim qog'oz bilan kelmaydi")
- **Dalil (kod):** POS tomonida zanjir **`pos-low-stock.job` da uziladi** — faqat bildirishnoma, PR yaratilmaydi (EP-POS-065). MM'da 3-way match bor; CC 3-savat "to'liq emas" (I2 ochiq savol).
- **Nima yetishmaydi:** ⭐ **golden-thread ning xarid oyog'i** POS↔MM chegarasida uzuq. Egasi buni ochiq savol sifatida ham qayd etgan ("CC 3-Savat hujjat oqimi TO'LIQ EMAS — keyingi rejalarga to'liq qilish").
- **Bog'liqlik:** EP-POS-065, EP-POS-011, EP-POS-019, MM, CC, Kanban
- **action:** —
- **⤳ Ta'sir:** MM, CC, Kanban, SD

### VR-POS-I09 · AI planning `/erp-dashboard/planning` (savdo menejeri ma'lumoti)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q
- **Talab:** Egasi (§11, s37-38): AI reja `/erp-dashboard/planning` sahifasida; ma'lumot manbai — **savdo menejeri** (+ ishlab chiqarish rahbari qismi).
- **Manba:** `QISM I2 #26` (+ I2 ochiq savol: "AI planning haqiqatan qurilganmi")
- **Dalil (kod):** POS'da AI tavsiya-dvigateli **yo'q** (EP-POS-019); loyiha xotirasida AI-planning **ochiq bo'shliq** deb belgilangan.
- **Nima yetishmaydi:** butun AI-planning qatlami. ⚠️ **Egasi-DATA blokeri:** AI kaliti (API key) hamon ta'minlanmagan (loyiha xotirasi).
- **Bog'liqlik:** EP-POS-019, EP-POS-011, EP-POS-065, PP, AI moduli
- **action:** —
- **⤳ Ta'sir:** AI, PP, POS

### VR-POS-I10 · Hujjat raqamlash standarti (`HOM-KIRIM-2026-00001`) + yagona PDF shablon
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman
- **Talab:** Egasi (§13, s29): raqamlash = **Ombor + harakat-turi + yil + ketma-ket** (`HOM-KIRIM-2026-00001`). (§13, s26-28): PDF = **bitta umumiy zamonaviy shablon**; **imzo = ERP login (avtomatik)**.
- **Manba:** `QISM I2 #28`, `#29`
- **Dalil (kod):** `pos_movements.movement_number` bor va `pos.events.ts` da ishlatiladi (`[AutoBarcode] ${movementNumber}`), lekin **formatning egasi belgilagan sxemaga mosligi tasdiqlanmadi**. `pos-pdf.service.ts` + `pdf_templates` bor (EP-POS-073); yagona-shablon standarti tasdiqlanmadi. Loyiha xotirasi: prikaz raqam-seq shu naqshda qurilgan.
- **Nima yetishmaydi:** raqamlash formati va yagona PDF shabloni auditda tekshirilmagan.
- **Bog'liqlik:** EP-POS-051, EP-POS-073, EP-POS-050
- **action:** —
- **⤳ Ta'sir:** Butun hujjat qatlami (POS + WMS + umumiy)

### VR-POS-I11 · Chiqishda AI kamera + ovoz tahlili + mashina/haydovchi jurnali
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q
- **Talab:** Egasi (§14, s48-49 + §6, s52): o'g'irlik oldini olish — **AI kamera + OVOZ tahlili**; **mashina + haydovchi to'liq yoziladi** (xavfsizlik xodimi tasdiqlaydi). Tayyor mahsulot chiqimida: AI kamera suratga oladi + buyurtmaga bog'laydi, invoys QR o'qiydi, **ombor + xavfsizlik** tasdiqlaydi. "Ishxonadan chiqadigan HAR narsa to'liq ERP rasxod."
- **Manba:** `QISM I2 #30`, `#14`, `#12`
- **Dalil (kod):** POS'da AI kamera **faqat barcode o'qish uchun** ko'zda tutilgan (EP-POS-006, ZXing.js/OpenCV) — surat-dalil, ovoz tahlili, mashina/haydovchi jurnali **yo'q**. `photo_evidence_url` ixtiyoriy (EP-POS-069). Xavfsizlik-tasdiq roli chiqim oqimida yo'q (EP-POS-072 da faqat menejer+moliya).
- **Nima yetishmaydi:** ⭐ egasining o'g'irlik-nazorati vizyoni POS'da deyarli qurilmagan; xavfsizlik tasdiq-bosqichi EXTERNAL_OUT oqimiga qo'shilmagan.
- **Bog'liqlik:** EP-POS-069 (foto), EP-POS-072 (jo'natish), EP-POS-006 (kamera), IoT/Security
- **action:** —
- **⤳ Ta'sir:** IoT/AI, Security, POS chiqim oqimi

### VR-POS-I12 · Tayyor mahsulot IJARA (30 kun bepul → kunlik m² to'lov)
- **Qaror holati:** ✅ JAVOBLANGAN *(sozlanadigan)*
- **Qurilish holati:** Yo'q
- **Talab:** Egasi (§6, s53 + A2): tayyor mahsulot omborda **30 kun bepul** turadi → keyin **kunlik m² ga pul** hisoblanadi → menejerga xabar. **A2: SOZLANADIGAN** (muhim mijozga moslash mumkin).
- **Manba:** `QISM I2 #15`
- **Dalil (kod):** POS/WMS'da ombor-ijara hisoblash cron'i yoki PDF-hisob-fakturasi **topilmadi**. FG ombor (`FINISHED`/`FG-MAIN`) bor, `products` da `areaM2` bor (Batch-3), lekin ijara mantiqi yo'q.
- **Nima yetishmaydi:** butun ijara-daromad oqimi. ⭐ **Threshold-CRUD qoidasiga mos:** 30 kun va kunlik m² narxi `business_settings` da bo'lishi kerak (egasi "sozlanadigan" deb aniq aytgan).
- **Bog'liqlik:** EP-POS-072 (FG jo'natish), EP-POS-024 (FG kirim), Finance
- **action:** —
- **⤳ Ta'sir:** WMS, Finance (daromad), SD

---

## III QISM — Xaritalash, sanoq tekshiruvi va manba-ziddiyatlari

### §1 — Xaritalash jadvali (mapping)

| Manba | Xaritalash qoidasi | Qamrov |
|---|---|---|
| `decisions/19-pos.md` | `### EP-POS-NNN` → registr kaliti (to'g'ridan) | 001..082 (82/82) |
| `FULL-ITEM-LEVEL [Module-19]` | **Item #(N+50) = EP-POS-N** | Item #51..#132 → EP-POS-001..082 (1:1, bo'shliqsiz) |
| `FULL-ITEM-LEVEL [Module-19]` | Item #1..#50 = `vision-1000-answers` #1..#50 — **EP-kodsiz**, mavzu bo'yicha ulanadi | `(taxminiy)` bilan belgilanadi |
| `EXTRACTION QISM A` | `POS (Modul 19) — 50 qaror` #N = `vision-1000-answers` #N = `[Module-19] Item #N` | #1..#50 |
| `EXTRACTION QISM C` | `TASDIQ-2146 §19 #N` = **EP-POS-N** (to'g'ridan, 1:1) | §19 #1..#82 → EP-POS-001..082 |
| `EXTRACTION QISM D` | `V/VERIFY POS (19)` qatori #N = `QISM A #N` (38 ta "cross-ref kerak" satri) | #3,4,6,7,8,9,10,12,13,15,18,19,20,21,22,23,24,25,26,27,29,30,32,33,34,36,37,38,40,41,42,43,44,45,47,48,49,50 |
| `EXTRACTION QISM I2` | `OMBOR·POS·KASSIR·TA'MINOT` intervyusi — **EP-kodsiz**, II QISM ga (VR-POS-I01..I12) + I QISM da xoch-havola | 33 qaror + 5 ochiq savol |

**Tasdiqlangan namunalar (xaritalash to'g'riligini isbotlovchi):** Item #51 "POS = ombor planshet ilovasi, kassa emas" = EP-POS-001 ✓ · Item #82 "Texkarta-material moslik" = EP-POS-032 ✓ · Item #94 "Norma-fakt farqi" = EP-POS-044 ✓ · Item #119 "Foto-dalil" = EP-POS-069 ✓ · Item #132 "POS til/ko'rinish" = EP-POS-082 ✓.

### §2 — Sanoq tekshiruvi (`decisions/19-pos.md` o'z Xulosasi)

`decisions/19-pos.md` sarlavhasi: **"Jami 82 savol (v1=30, v2=52). ✅ JAVOBLANGAN 57 · 🔵 OCHIQ 25"**, oxirida: **"DONE: POS — 82 (javoblangan 57, ochiq 25)"**.

Band-ma-band qayta sanaldi:
- `grep -c "^### EP-POS-" decisions/19-pos.md` → **82** ✓
- Registrda `grep -c "^### EP-POS-"` → **82** ✓ (001..082, bo'shliqsiz — har bir raqam alohida tekshirildi)
- Registr `Qaror holati: ✅` → **57** ✓ · `🔵` → **25** ✓
- `decisions` ning "OCHIQ SAVOLLAR RO'YXATI" jadvali → **25 qator** ✓

**Farq yo'q** — `decisions/19-pos.md` ning o'z Xulosasi bu modulda **to'g'ri** (boshqa modullardan farqli o'laroq). ⚠️ Yagona nozik: `decisions` ning o'z eslatmasi EP-POS-082 ni "til yarim-ochiq (kirill)" deb belgilaydi, lekin javoblangan deb sanaydi — registr shu tasnifni saqladi (✅ *(qisman — kirill ochiq)*).

**Qurilish o'qi taqsimoti (registr, 82/82):** Ha **31** · Qisman **31** · STALE-DOC **12** · Yo'q **7** · — (mos item topilmadi) **1**.

### §3 — `QISM C` (TASDIQ-2146 §19) ning tizimli eskirishi

`QISM C` (2026-06-27) POS uchun **12 bandda** "Yo'q / grep=0" deb yozgan, lekin `FULL-ITEM-LEVEL` (2026-07-11, fayl-o'qish bilan) va `QISM D` (2026-07-07) ularni rad etgan:

| EP-POS | QISM C da'vosi | Haqiqiy holat (fayl-o'qish bilan) |
|---|---|---|
| 020 | "detektor yo'q" | `pos-anomaly.service.ts` — to'liq qoidaviy detektor + `pos_anomaly_flags` |
| 032 | "grep=0; moslik-check yo'q" | `pos-techcard-gate.service.ts` — qattiq blok + `pos_movement_techcard` |
| 036 | "alohida tur yo'q" | `movement-enums.ts:16` `WASTE_IN` |
| 038 | "movement_lines'da poddon yo'q" | `recordPallet()`/`getPalletBalance()` + `pos_returnable_pallets` |
| 039 | "tara-aylanma topilmadi" | `getPalletBalance()` = berildi−qaytdi balansi |
| 049 | "chiqim sababi topilmadi" | `movement-enums.ts:17,108` `LAB_SAMPLE_OUT` |
| 050 | "2-imzo yo'q" | `pos-shift-handover.service.ts` — 2-IMZO GATE majburlanadi |
| 052 | "grep=0; qisman-qabul yo'q" | `movement-enums.ts:18` `PARTIAL_RECEIPT` + `goods_receipts` ustunlari |
| 062 | "grep=0; tur yo'q" | `movement-enums.ts:19` `CUSTOMER_MATERIAL` |
| 064 | "limit kodi topilmadi" | `pos-variance-config.service.ts` — AUTO_APPROVE/ESCALATE, fail-CLOSED |
| 069 | "grep=0 (faqat cash-register)" | `pos_movements.photo_evidence_url` + `movement.dto.ts:70` |
| 077 | "detektor yo'q" | `pos-anomaly.service.ts:129` — aniq tungi-smena qoidasi |

**Naqsh:** `QISM C` grep'ni **noto'g'ri kalit-so'zlar** bilan bajargan (masalan `attachment` o'rniga `photo_evidence_url` kerak edi; `MovementOwnershipGuard` o'rniga `PosDepartmentGuard`). Xulosa: **`QISM C` ni POS'da mustaqil dalil sifatida ishlatmang** — har doim `FULL-ITEM-LEVEL` yoki live-kod bilan tasdiqlang.

### §4 — Auditning o'zi eskirgan bandlar (2026-07-11 dan keyin qurilgan)

| EP-POS | FULL-ITEM (2026-07-11) | Δ commit | Haqiqiy holat |
|---|---|---|---|
| 067 | Item 117 = **Yo'q** | `b225479e` (07-11) | `is_unplanned` + majburiy sabab + Telegram push **qurilgan** |
| 081 | Item 131 = **Yo'q** | `086fb5db` (07-11) | `DISPUTED` nizo holati **qurilgan** |
| 072 | `QISM D #26` = **Yo'q** | `9599b862` (07-11) | Kredit-limit real-time tekshiruvi **qurilgan** |
| 072 | `QISM A #39` = "cross-ref kerak" | `567ce6f8` (08-04) | `EXTERNAL_OUT` → SD eventi **qurilgan** |
| 012 | SB0817 "STILL-OPEN" | `69558fb6` (08-04) | Kanonik `entries` uchun kunlik reconciliation cron **qurilgan** |

### §5 — Manba-ziddiyatlari xulosasi

Registrda **29 ta `⚠️ ZIDDIYAT`** belgilangan. Ular uch toifaga bo'linadi:

1. **QISM C eskirgan (12 ta)** — §3 jadvalida sanaldi.
2. **QISM C/D "fayl bor" ni "ishlaydi" bilan chalkashtirgan (4 ta)** — EP-POS-014/025/060 (`pos_batches`/`pos_materials` jadvallari yo'q, `pos-fifo.service.ts` runtime'da yiqiladi), EP-POS-003 (guard'lar ta'riflangan, lekin `@UseGuards` bilan ulanmagan).
3. **Vizyon-manbalar orasidagi ziddiyat (3 ta, eng muhim)** —
   - **EP-POS-017 / VR-POS-I06:** `decisions` "🔵 OCHIQ — davriylik egasi-data" ╳ `QISM I2 #31` egasi: "rulon/hom-ashyo **haftalik**, qolgani **oylik**". **Javob mavjud, qaror-xaritasi ko'rmagan.**
   - **EP-POS-037:** `decisions` "🔵 OCHIQ — makulatura ombori egasi tasdig'i kerak" ╳ `QISM I2 #11` egasi: "makulatura+brak+QC-rad = **bitta ombor**". **Javob mavjud.**
   - **EP-POS-063:** `decisions` "zona-freeze **talab emas**" ╳ `QISM I2 #31` egasi: "**zona muzlatiladi**".
   - **EP-POS-050 (vizyon ichida):** v2 Q50 "2-imzo akti" ╳ BARCHA_JAVOBLAR Q11 "smena boshqaruvi kerak emas" — `decisions` ning o'zi ZIDLIK deb belgilagan; egasi hal qilishi kerak. ⚠️ Diqqat: **hal qilinmagan narsa allaqachon qurilgan** (2-imzo gate real).
4. **Boshqa (10 ta)** — data-o'sishi (EP-POS-001 6→11 tur, EP-POS-028 2/6→11), qamrov farqi (EP-POS-026/082 FE tekshirilmagan), qismiy-to'g'rilik (EP-POS-012 SB0817, EP-POS-022 bekor≠storno, EP-POS-035, EP-POS-064, EP-POS-076, EP-POS-080).

### §6 — 2026-08-06/07 topilmalarining hukmi

| Topilma | Hukm | Dalil |
|---|---|---|
| Ikkita parallel karantin-eskalatsiya (`quarantine-workflow` CRUD ╳ `pos-inventory-passport:64,70` literal 48) | ✅ **TASDIQLANADI** *(tuzatilgan)* | `4d7422fc` + `9ea7c155`; EP-POS-004/034/048 |
| `POS_TELEGRAM_BOT_TOKEN` hech qayerda aniqlanmagan → jimgina no-op | ✅ **TASDIQLANADI** *(tuzatilgan)* | `pos-telegram-ext.service.ts:20-27` izohi + `:26` fallback; EP-POS-071 |
| `three-way-match.service.ts:14-15` `mm.three_way_amount_tolerance_pct` ga o'tkazildi | ⚠️ **QISMAN RAD ETILADI** | O'tkazish **`modules/remaining/three-way-match.service.ts:47`** da bo'lgan; **`modules/pos/.../three-way-match.service.ts:14-15` hamon `0.05` qattiq yozilgan**. Ikkita parallel servis. EP-POS-051 |
| `pos-inactive-materials.job.ts:30` 90 kun hardcoded | ✅ **TASDIQLANADI** | `:13,30,39,46,57` da takroran `90`; EP-POS-054 |
| `business.constants.ts` 5 ta POS-anomaliya konstantasi compile-time | ✅ **TASDIQLANADI** | `apps/api/src/common/constants/business.constants.ts:416-436` (+`:442` `POS_OVER_NORM_FACTOR`); EP-POS-020/077/081 |
| `business_settings` `pos.norma_fakt_farqi_ortiqcha_sarf_94` (id=50) — hech qaysi kod o'qimaydi | ✅ **TASDIQLANADI** | `grep` faqat `business-settings-s1-keys-2026-07-11.sql:52` topdi; ~1 oydan beri egasi javobini kutmoqda; EP-POS-044 |
| `PosDepartmentGuard`/`PosWarehouseAccessGuard` hech qayerda `@UseGuards` bilan qo'llanilmagan | ✅ **TASDIQLANADI** | `grep` → faqat ta'rif (`:25,47`) + provider (`pos.module.ts:53,165`) + re-eksport (`pos.module-imports.ts:115`); EP-POS-003/074 |
| `telegram-bot.service.ts` (144 qator) — provider, hech qayerda chaqirilmaydi | ✅ **TASDIQLANADI** | `grep TelegramBotService` → 5 hit, hammasi ta'rif/ro'yxat/re-eksport; hech qanday inyeksiya; EP-POS-071 |
| POS↔WMS sinxronizatsiya regressiyasiz | ✅ **TASDIQLANADI** | `1753ed0d` kanonik `warehouse_stock`; `pos-balance-guard` fail-CLOSED; EP-POS-010/030 |
