# MES / Ishlab chiqarish — Yagona Vizyon Registri (EP-MES) — 2026-08-07

> **Manbalar:** `decisions/08-mes.md` (82 qaror) · `FULL-ITEM-LEVEL [Module-08]` (132 item; Item 51..132 = EP-MES-001..082) · `FULL-VISION-EXTRACTION` QISM A (vision-1000 #1..50) / QISM C (TASDIQ-2146 §08 08.1..08.82) / QISM D (VERIFY cross-ref hal) · `vision-1000-answers/08-mes.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida kod tegan bandlar qayta tekshirildi (Δ qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-MES-001..082)** | **82** |
| **Qaror holati:** ✅ javoblangan | 66 |
| **Qaror holati:** 🔵 ochiq | 16 |
| **Qurilish:** Ha | 7 |
| **Qurilish:** Qisman | 39 |
| **Qurilish:** Yo'q | 33 |
| **Qurilish:** STALE-DOC | 3 |
| **Qurilish:** — (mos item topilmadi) | 0 |
| 2026-07-11 dan beri o'zgargan (Δ) | 23 |
| ⚠️ Manbalar orasida ziddiyat | 17 |

> **Eslatma (qamrov):** bu fayl **I QISM** — 82 EP-kodli qarorni to'liq qamraydi
> (`grep -c "^### EP-MES-"` → **82**). **II QISM** (VR-MES-I01..I12) = EP-kodsiz, faqat
> `vision-1000-answers` / `FULL-ITEM-LEVEL` da uchraydigan vizyon-realizatsiya bo'shliqlari.
> **III QISM** = raqamlash xaritasi, ziddiyatlar jurnali va manba-metodologiya izohlari.

> **Eslatma (qurilish ≠ qaror):** ikki o'q mustaqil. Masalan EP-MES-015 (OEE target) qaror
> bo'yicha hamon 🔵 OCHIQ, lekin qurilish bo'yicha **Qisman** (2026-07-10/11 da `mes_oee_targets`
> versiyalangan jadval + FE ulanishi qurildi, egasining chegara-qiymatlari kutilmoqda). Teskarisi
> ham bor: EP-MES-039 (~30 mashina) qaror bo'yicha ✅ JAVOBLANGAN, qurilish bo'yicha **Yo'q**
> (egasi hali haqiqiy mashina ro'yxatini bermagan).

> **Eslatma (tipografiya):** `decisions/08-mes.md` da kirill `JAVОБЛАНГАН` varianti tekshirildi
> (`grep -c "JAVОБЛАНГАН"` → **0**), hammasi lotin `JAVOBLANGAN`. Jonli sanoq: 66 ✅ + 16 🔵 = 82.
> ⚠️ `decisions/08-mes.md` ning O'Z Xulosasi "33 javoblangan / 49 ochiq" deydi — bu **noto'g'ri**
> (III QISM §3.2 ga qarang); band-ma-band sanoq 66/16 beradi.

> **Eslatma (mapping):** `FULL-ITEM-LEVEL [Module-08]` **Item N+50 = EP-MES-N** (1:1, siljishsiz):
> Item 51 = EP-MES-001 … Item 132 = EP-MES-082. Item 1..50 = `vision-1000-answers/08-mes.md`
> #1..#50 — EP-kodsiz alohida o'q, mavzu bo'yicha ulanadi → `(taxminiy)` bilan belgilanadi.
> `EXTRACTION QISM C` satr raqami `08.N` = EP-MES-N (aynan mos).

---

## I QISM — EP-kodli qarorlar (EP-MES-001..082)

### EP-MES-001 · Ishlab chiqarish sessiyasi 3-bosqich ("hop3")
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — to'liq 3 bosqich (tayyorgarlik/sozlash → asosiy → yakunlash). Kitob izohlari ("настройка муракаб - вакт кетди", "переделка 3 соат") sozlash va yakunlash vaqti alohida o'lchanishi kerakligini ko'rsatadi → OEE Availability to'g'ri bo'ladi.
- **Manba:** v1-A + kitob (sozlash/qayta-ishlash izohlari, EP-MES-046/047 bilan bog'liq)
- **Dalil (kod):** `production_sessions` ustun ro'yxati (`q.cjs`) — `setup_seconds`, `main_seconds`, `teardown_seconds` mavjud; `production-session.aggregate.ts:85-91` `GsdStage` (SETUP/MAIN/TEARDOWN) real.
- **Bog'liqlik:** EP-MES-048 (sozlash vaqti), EP-MES-046 (yakunlash/переделка), EP-MES-002
- **action:** UPDATE
- **⤳ Ta'sir:** OEE (Availability), sessiya modeli, jonli monitoring
- **Xoch-havolalar:** `[Module-08] Item 51` · `EXTRACTION QISM C 08.1` · `TASDIQ-2146 §08 #1`
- **Δ 2026-07-11→08-07:** —

### EP-MES-002 · Bosqichlar avtomatmi yoki operator bosadimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** B/C — operator tugmasi bilan qo'lda (sensor bor mashinada keyin avto = aralash). Zavodda IoT sensor YO'Q (EP-MES-080), hozir hamma ma'lumot qo'lda; avto-aniqlash da'vosi haqiqatga zid.
- **Manba:** BARCHA_JAVOBLAR (IoT yo'q, qog'oz/Excel) + v2 Q50 (EP-MES-080) — qo'lda boshlash
- **Dalil (kod):** `IoTProductionDashboard.tsx` qo'lda bosqich boshqaruvi; Item 80 (EP-MES-030) da mustaqil tasdiqlangan `login→sessiya→checklist→crew→brak→downtime→handover` DB-backed zanjiri bilan izchil. **Δ:** `useIoTTablet.ts` — `startProductionFromChecklist`/`startSession` avval backend'ning 422 BLOCKED javobini yutib "ishlab chiqarish boshlandi" ko'rsatardi; `res.ok` tekshiruvi qo'shildi (`7f4d7b6d`).
- **Bog'liqlik:** EP-MES-080 (qo'lda oqim), EP-MES-018 (bosqich tugmasi)
- **action:** UPDATE
- **⤳ Ta'sir:** EP-MES-080 (IoT'siz boshlash), operator UI
- **Xoch-havolalar:** `[Module-08] Item 52` · `EXTRACTION QISM C 08.2` · `TASDIQ-2146 §08 #2` · `vision-1000 #18` *(taxminiy)*
- **Δ 2026-07-11→08-07:** `7f4d7b6d` — tablet FE 7 mutatsiyada xatoni yutardi; eng jiddiy holat aynan sessiya-boshlash edi (xavfsizlik chek-list darvozasi FE'da butunlay chetlab o'tilardi). Endi 422 foydalanuvchiga ko'rsatiladi.

### EP-MES-003 · Smena modelini aniqlash (3 smena standart)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 3 smena, soatlari sozlanadigan. Kun tartibi hujjati 12 soatlik smena beradi; kitobda smenalar A/B/C harf-nomi bilan (EP-MES-061). Hozirgi kod morning/afternoon/night → A/B/C + vaqt oralig'iga ko'chiriladi.
- **Manba:** kitob (Кун тартиби 12 soat + "А смена") + Q132/Q133 (smena orgsxemadan) + v1-A
- **Dalil (kod):** `shift_types` jonli (`q.cjs`, 3 qator: MORNING/EVENING/NIGHT, har biri `duration_hours=9.0`); `mes.dto.ts:19` smena enum = `['morning','afternoon','night']` — kodda hech qayerda A/B/C literal yo'q.
- **Nima yetishmaydi:** ham nom (MORNING/EVENING/NIGHT ≠ A/B/C), ham davomiylik (9 soat ≠ 12 soat) spetsifikatsiyadan chetlashadi; "sozlanadigan soat" CRUD'i tasdiqlanmagan.
- **Bog'liqlik:** EP-MES-061 (A/B/C nom), EP-MES-062 (doimiy biriktirish)
- **action:** UPDATE
- **⤳ Ta'sir:** Hamma hisobot bo'linishi, EP-MES-061 (A/B/C nom), EP-MES-062 (doimiy biriktirish)
- **Xoch-havolalar:** `[Module-08] Item 53` · `EXTRACTION QISM C 08.3` · `TASDIQ-2146 §08 #3`
- **Δ 2026-07-11→08-07:** —

### EP-MES-004 · Brigada (jamoa) tushunchasini qo'shish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — to'liq brigada (a'zolar + brigadir + smena). Zavod formasi har stansiyaga operator + yordamchi(lar) yozadi (EP-MES-033); karton sexida jamoa ishlaydi.
- **Manba:** kitob (А смена tarkibi: Тураходжаев/Маматалиев/...; operator+yordamchi) + v1-A
- **Dalil (kod):** `machine_crews` jonli (`q.cjs`, 2 qator, `session_id 999/998`, `master_id=0`) — ustunlar `master_id`/`polmaster_id`/`shogird_id`/`rokler_id` = 4 qat'iy rol, "brigadir" roli va brigada-darajali guruhlash yo'q. **Δ:** `machine_crew_members` jadvali + `mes-crew-members.repo.ts` (N-a'zoli, hissa%-li) qurildi (`3556262a`).
- **Nima yetishmaydi:** o'zgaruvchan a'zolikli brigada tushunchasi (brigadir + smena biriktirish) hamon yo'q; `machine_crews` 4-rolli qat'iy tuzilma bo'lib qolmoqda, `machine_crew_members` bilan ikkilanish yuzaga keldi.
- **Bog'liqlik:** EP-MES-005 (tarkib kim belgilaydi), EP-MES-033, EP-MES-062, EP-MES-014 (brigada-OEE)
- **action:** CREATE
- **⤳ Ta'sir:** Bonus/reyting (jamoa), karta-model, EP-MES-033 (operator+yordamchi)
- **Xoch-havolalar:** `[Module-08] Item 54` · `EXTRACTION QISM C 08.4` · `TASDIQ-2146 §08 #4` · `vision-1000 #23` *(taxminiy)*
- **Δ 2026-07-11→08-07:** `3556262a` — `machine_crew_members` (1 operator + N nomli yordamchi + hissa%) jadval+repo qurildi; brigadir/smena-biriktirish hamon yopilmagan.

### EP-MES-005 · Brigada tarkibini kim belgilaydi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — brigadir smena boshida tizimda tasdiqlaydi (jonli holatga mos) + B element: HR doimiy A/B/C biriktirish bazadan keladi, kunlik o'zgarish (kasallik/ta'til) qayd. Kitob doimiy tarkib + rotatsiya beradi.
- **Manba:** v1-A + kitob (doimiy A-smena tarkibi, EP-MES-062)
- **Dalil (kod):** EP-MES-004 bilan bir xil `machine_crews` ustun ro'yxati — tasdiq/biriktirish-vakolati ustuni umuman yo'q. QISM D (VERIFY #23): `iot-tablet.controller.ts:363,377-396` crew get/save endpointlari bor, lekin save = `INSERT ON CONFLICT DO NOTHING` (o'rta-smena almashtirish/update yo'q), HR real-time event yo'q.
- **Nima yetishmaydi:** brigadir-tasdiq oqimi va HR-doimiy-A/B/C biriktirish; kunlik o'zgarish (kasallik/ta'til) qaydi.
- **Bog'liqlik:** EP-MES-004 va EP-MES-003 avval qurilishi shart; EP-MES-062
- **action:** APPROVE
- **⤳ Ta'sir:** Davomat (HR), EP-MES-062, intizom
- **Xoch-havolalar:** `[Module-08] Item 55` · `EXTRACTION QISM C 08.5` · `TASDIQ-2146 §08 #5` · `QISM D VERIFY #23`
- **⚠️ ZIDDIYAT:** QISM C/FULL-ITEM "mexanizm yo'q" vs `36e116a1` (2026-07-09) "real crew upsert for mid-shift change". Kommit audit sanasidan OLDIN, lekin audit DB-probe uni ko'rmagan → `7ec31c9e` "migrations-not-applied" bayrog'i bilan izohlanadi.
- **Δ 2026-07-11→08-07:** —

### EP-MES-006 · Material sarfini avtomatik norma bo'yicha yechish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** B — avto-hisob, lekin operator/usta tasdiqlaganda yechiladi (nazorat saqlanadi). Karton sexida material eng katta xarajat; tashqi IoT yo'q → tasdiq bosqichi xato sarfni bloklaydi. Keyin to'liq A (avto + GL) ga o'tiladi.
- **Manba:** v1 (A/B) + BARCHA_JAVOBLAR (sarf nazorati) + karta-model (real tannarx)
- **Dalil (kod):** `mes_material_consumption` 1 qator (`q.cjs`); `material_norms` 0 qator — avto-norma hisobi o'qiydigan jadval bo'sh. **Δ:** `mes-shifts-stats.repo.ts` — `recordMaterialConsumption()` endi `execIssueFromWarehouseStock`/`execInsertWmsTransaction` bilan `warehouse_stock` ni kamaytiradi va `WmsGoodsIssuedEvent` chiqaradi → Dr COGS/Cr Inventory GL yozuvi jonli listener orqali ketadi (`2066f70b`). Tasdiq-bosqichi: `checkMaterialActSignatures` (`start-session.handler.ts:113`) + tablet-yo'lidagi inline gate (`iot-tablet.controller.ts:616-633`).
- **Nima yetishmaydi:** `material_norms` bo'sh → "avto-norma bo'yicha yechish" hamon hisoblanmaydi; yechim operator kiritgan miqdorga tayanadi, normadan emas.
- **Bog'liqlik:** EP-MES-007 (norma manbai), EP-MES-034/072 (norma jadvali), WMS/GL
- **action:** EVENT
- **⤳ Ta'sir:** WMS (ombordan yechim), FIN/GL (tannarx), EP-MES-007 (norma manbai)
- **Xoch-havolalar:** `[Module-08] Item 56` · `EXTRACTION QISM C 08.6` · `TASDIQ-2146 §08 #6` · `vision-1000 #11/#13/#49` *(taxminiy)*
- **Δ 2026-07-11→08-07:** `2066f70b` — MES sarf → WMS chegirma → GL yozuvi zanjiri ulandi (SB0555 STILL-OPEN yopildi); `a4f406f7` + `f318bbfe` — material-akt 2-imzo darvozasi sessiya-boshlashni bloklaydi (ikkala start yo'lida).

### EP-MES-007 · Norma manbai (texkarta) qayerdan keladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — texkarta/BOM yagona manba (PP modulidan), MES faqat o'qiydi. Kitob "Тех карта дубликатлари" oргполитikasi: asosiy texkarta = yagona ishonchli manba, dublikat taqiqlanadi.
- **Manba:** kitob (Тех карта дубликатлари сиёсати — yagona manba) + v1-A
- **Dalil (kod):** `technology_cards` jonli va boy (`q.cjs`, 37 ustun: `format_a`/`format_b`/`operations`/`total_duration_minutes`/`version`); `material_norms.technology_card_id` FK-shaklidagi ustun mavjud, lekin `material_norms` 0 qator.
- **Nima yetishmaydi:** texkarta ↔ per-stansiya norma bog'lanishi sxemada bor, ma'lumot bilan to'ldirilmagan; MES per-stansiya ishlab-chiqarish normasini o'qimaydi.
- **Bog'liqlik:** EP-MES-006, EP-MES-008, EP-MES-034/072 (norma jadvali)
- **action:** READ
- **⤳ Ta'sir:** PP (texkarta/routing), EP-MES-006 (avto-sarf), dublikat-taqiq
- **Xoch-havolalar:** `[Module-08] Item 57` · `EXTRACTION QISM C 08.7` · `TASDIQ-2146 §08 #7`
- **Δ 2026-07-11→08-07:** —

### EP-MES-008 · Norma chetlashuvini (haqiqiy vs norma) kuzatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har sessiyada farq% + smena/brigada jamlanma + ogohlantirish. Kitob "Заявка бумаги" rejalashtirilgan material ↔ haqiqiy sarf taqqoslashni talab qiladi (EP-MES-065); ortiqcha sarf = yashirin yo'qotish.
- **Manba:** kitob (Заявка бумаги rejani sarf bilan taqqos) + BARCHA_JAVOBLAR (yashirin yo'qotish) + v1-A
- **Dalil (kod):** EP-MES-007 bilan bir xil `material_norms` 0-qator dalili — farq% uchun ham norma, ham fakt kerak, norma tomoni bo'sh.
- **Bog'liqlik:** EP-MES-034/035/072 (norma jadvali klasteri), EP-MES-056 (versiyalash)
- **action:** READ
- **⤳ Ta'sir:** WMS, FIN (tannarx), EP-MES-065 (zayavka↔sarf)
- **Xoch-havolalar:** `[Module-08] Item 58` · `EXTRACTION QISM C 08.8` · `TASDIQ-2146 §08 #8` · `EXTRACTION QISM A #4/#17` *(taxminiy — norma-versiyalash bilan bir ildiz)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-009 · SOS (favqulodda chaqiruv) oqimini aniqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — bosqichli eskalatsiya (usta → bo'lim boshlig'i → direktor, vaqt o'tsa avto-ko'tariladi). Hujjat/eskalatsiya org-sxema bo'yicha yuradi (vertikal), sakramaydi.
- **Manba:** BARCHA_JAVOBLAR Q79-80/Q122 (org-sxema marshrut + eskalatsiya) + Q132 (smena roli orgsxemadan) + v1-A
- **Dalil (kod):** `mes-sos-escalation.service.ts` (`assignOnRaise`/`escalateOverdue`) + `mes-sos-escalation.repo.ts:20` `SOS_ESCALATION_TIMEOUT_MINUTES = 10` — real org-zanjir eskalatsiyasi (`org_departments.parent_id` bo'ylab), Telegram signali faqat zanjir cho'qqisida. **Δ:** `escalateOverdue()` endi `CcSpawnRequestedEvent` → `MES_ESCALATION` CC hujjatini avto-ochadi (`072fce93`).
- **Nima yetishmaydi:** vizyon 15/30-daqiqali bosqichli taymerni so'raydi, kod yagona tekis 10-daqiqali timeout ishlatadi; direktorning "kut" holati va 30-daq reset yo'q (vision-1000 #9).
- **Bog'liqlik:** EP-MES-018 (to'xtash avto-signali), EP-MES-010/011 (sabab), NTF/CC
- **action:** EVENT
- **⤳ Ta'sir:** Org-struktura (vertikal marshrut), NTF, CC, DIR
- **Xoch-havolalar:** `[Module-08] Item 59` · `EXTRACTION QISM C 08.9` · `TASDIQ-2146 §08 #9` · `EXTRACTION QISM A #9`
- **Δ 2026-07-11→08-07:** `072fce93` — SOS zanjiri cho'qqiga chiqqanda CC'da `MES_ESCALATION` hujjati avtomatik ochiladi (shablon seed bilan); taymer semantikasi o'zgarmadi.

### EP-MES-010 · SOS sabab toifalari (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — 5-6 standart toifa + "boshqa" (izoh majburiy). Kitobda barcha to'xtash sabablari yozma + toifalanadi (material/texnologik/sifat/kadr/режа-хато/бошқа).
- **Manba:** kitob (smena-xulosa: 6 toifali sabab ajratish) + v1-A
- **Dalil (kod):** `mes_downtime_reasons` `SELECT *` — **16 qator, 6 toifa** (breakdown/material/setup/maintenance/quality/organizational), QISM C jadvalining "7 generik kod" da'vosi emas. 9 kod `created_at = 2026-07-04` (DT-HYDR, DT-SENSOR, DT-MAT-QUAL, DT-MAT-WAIT, DT-CHANGEOVER, DT-CALIBRATE, DT-QUAL-REWORK, DT-BRIEFING, DT-STAFF) — QISM C jadvali yozilgandan keyin qo'shilgan.
- **Nima yetishmaydi:** `DT-STAFF` "kadr" toifasini qisman qoplaydi, lekin alohida "режа-хато" (rejalashtirish xatosi) kodi 16 tasi ichida hamon yo'q.
- **Bog'liqlik:** EP-MES-011 (downtime kodlar), EP-MES-036 (ish yo'q), EP-MES-077 (majburiy sabab)
- **action:** CREATE
- **⤳ Ta'sir:** SOS tahlili, EP-MES-011 (downtime kodlar), takror-sabab
- **Xoch-havolalar:** `[Module-08] Item 60` · `EXTRACTION QISM C 08.10` · `TASDIQ-2146 §08 #10` · `EXTRACTION QISM A #10`
- **⚠️ ZIDDIYAT:** QISM C (2026-06-27) "7 generik kod" vs jonli DB (2026-07-11) "16 kod / 6 toifa". Yangi + `SELECT *` dalilli manba ustun → QISM C satri **STALE-DOC**. Sabab: `mes-downtime-reasons-expand-2026-07-04.sql` auditdan keyin qo'llanilgan.
- **Δ 2026-07-11→08-07:** —

### EP-MES-011 · Downtime (to'xtash) sabab kodlarini boyitish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — karton/qadoq sexiga xos to'liq kodlar (15-25 ta). Kitob aniq downtime sabablari beradi: changeover/настройка, qog'oz uzilishi, bo'yoq, qolib kechikishi (EP-MES-076), remont (EP-MES-078), ish-yo'q (EP-MES-066), переделka (EP-MES-075).
- **Manba:** kitob (sabab izohlari: настройка/переделка/ремонт/колиб/иш йук) + v1-A
- **Dalil (kod):** o'sha `SELECT *` — `mes_downtime_reasons` 16 qator (hujjatdagi 7 emas), ular orasida haqiqiy ishlab-chiqarishga xos kodlar bor (DT-CHANGEOVER, DT-MAT-WAIT, DT-QUAL-REWORK, DT-CALIBRATE). Alohida `downtime_reason_codes` jadvali (boshqa jadval) hamon **0 qator** — hujjatning "downtime_reason_codes BO'SH" da'vosi shu jadval uchun to'g'ri.
- **Nima yetishmaydi:** 16 kod 15-25 maqsadning quyi chegarasida; ikki parallel jadval (`mes_downtime_reasons` jonli vs `downtime_reason_codes` bo'sh) — kanonik jadval e'lon qilinmagan.
- **Bog'liqlik:** EP-MES-010, EP-MES-036/047/075/076/078 (har biri alohida kod talab qiladi)
- **action:** CREATE
- **⤳ Ta'sir:** OEE tahlil, EP-MES-066/075/076/078
- **Xoch-havolalar:** `[Module-08] Item 61` · `EXTRACTION QISM C 08.11` · `TASDIQ-2146 §08 #11`
- **⚠️ ZIDDIYAT:** QISM C "7 generik" vs jonli 16 kod → STALE-DOC. Shuningdek ikki jadval mavjudligi (`mes_downtime_reasons` vs `downtime_reason_codes`) hal qilinmagan dublikat — STANDARTLAR bo'yicha kanonik tanlanishi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-MES-012 · Rejali vs rejasiz to'xtash ajratish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — har sababkodga rejali/rejasiz/sifat turi avtomatik biriktiriladi → to'g'ri OEE. Kun tartibi rejali to'xtashlarni (tanaffus/tushlik/namoz) aniq beradi (EP-MES-049/050/051).
- **Manba:** kitob (Кун тартиби rejali tanaffuslar + sabab toifalash) + v1-A
- **Dalil (kod):** `mes_downtime_reasons.is_planned` ustuni mavjud va 16 qatorning hammasida haqiqiy true/false qiymat bilan to'ldirilgan (`SELECT *`); `downtime_events.is_planned` ham mavjud va ikkala jonli qatorda to'ldirilgan. `get-oee.handler.ts` (6-23 qator) — Availability formulasi `is_planned=true` to'xtashni yo'qotish maxrajidan chiqaradi (SB0430 fix).
- **Bog'liqlik:** EP-MES-011 (kod master-data), EP-MES-049/050/051 (tanaffus)
- **action:** UPDATE
- **⤳ Ta'sir:** OEE (Availability), EP-MES-049/050/051, sabab master-data
- **Xoch-havolalar:** `[Module-08] Item 62` · `EXTRACTION QISM C 08.12` · `TASDIQ-2146 §08 #12` · `EXTRACTION QISM A #16`
- **Δ 2026-07-11→08-07:** —

### EP-MES-013 · Downtime'ni kim va qachon kiritadi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — operator darhol (boshlanishi qo'lda belgilanadi, sabab keyin) → jonli va aniq. IoT yo'q, lekin uzun to'xtash darhol kiritilsa jonli monitoring ishlaydi; aralash (C) ham maqbul.
- **Manba:** v1-A + EP-MES-080 (qo'lda kiritish)
- **Dalil (kod):** `downtime_events` jonli (2 qator), ustunlar `reported_by`/`started_at`/`reason_code` mavjud; `SELECT *` — mavjud ikkala qatorda `reported_by` **NULL**.
- **Nima yetishmaydi:** endpoint/jadval yo'li bor, lekin haqiqatda yozilgan ma'lumotda operator identifikatori yo'q — "operator darhol kiritadi" dalillanmagan.
- **Bog'liqlik:** EP-MES-080 (qo'lda kiritish), EP-MES-016/017 (jonli monitoring)
- **action:** CREATE
- **⤳ Ta'sir:** Jonli monitoring, OEE, operator UI
- **Xoch-havolalar:** `[Module-08] Item 63` · `EXTRACTION QISM C 08.13` · `TASDIQ-2146 §08 #13` · `EXTRACTION QISM A #10`
- **⚠️ ZIDDIYAT:** QISM C 08.13 = **Ha** ("/api/iot/downtime-events; reported_by/started_at/reason_code") vs FULL-ITEM-LEVEL = **Qisman** (ikkala qatorda `reported_by` NULL). Qatorli DB-dalil kuchliroq → Qisman.
- **Δ 2026-07-11→08-07:** —

### EP-MES-014 · OEE'ni qaysi darajada ko'rsatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — hamma darajada (mashina + smena + brigada + sex). Karta-modelda har birlik o'z GSD'siga ega; brigada bali bonus bilan bog'lanadi.
- **Manba:** v1-A + karta-model (har birlik GSD) + ShVB
- **Dalil (kod):** `get-oee.handler.ts:53-71` — VISION-3340 #46 bo'yicha real 4-darajali `groupBy`: mashina darajasi real/default; smena darajasi `production_sessions.shift_id` ni o'qiydi lekin `shift_id` NULL bo'lgani uchun `[]` qaytaradi; sex darajasi `work_centers.org_department_id` bilan xuddi shunday darvozalangan; brigada darajasi ochiq-oydin `Err(NOT_IMPLEMENTED)` qaytaradi — hech bir MES jadvalida brigada ustuni yo'q.
- **Nima yetishmaydi:** smena/sex — kod tayyor, ma'lumot bog'lanmagan (egasi-data); brigada — haqiqiy kod bo'shlig'i (sxema ustuni yo'q).
- **Bog'liqlik:** EP-MES-004 (brigada modeli), EP-MES-003/061 (smena), EP-MES-038 (sex/bo'lim)
- **action:** READ
- **⤳ Ta'sir:** Karta-model (GSD), bonus/reyting, dashboard
- **Xoch-havolalar:** `[Module-08] Item 64` · `EXTRACTION QISM C 08.14` · `TASDIQ-2146 §08 #14` · `EXTRACTION QISM A #3`
- **⚠️ ZIDDIYAT:** QISM C "mashina real; smena/brigada/sex rollup **yo'q**" vs FULL-ITEM-LEVEL "kaskad kod-jihatdan to'liq, faqat smena/sex data-bloklangan". Kod o'qilgan dalil aniqroq → kaskad mavjud, ma'lumot yetishmaydi.
- **Δ 2026-07-11→08-07:** —

### EP-MES-015 · OEE maqsad (target) va ogohlantirish chegarasi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har mashina/sexga alohida maqsad + kritik chegara. Kitob har stansiyaga aniq norma (Станоклар норма) va brak% (EP-MES-073) beradi → maqsad ham stansiya darajasida mantiqiy.
- **Manba:** v1-A + kitob (stansiya-darajali norma/brak%)
- **Dalil (kod):** 2026-07-11 auditida: `MESExtended.tsx:146` `Number(m.oee || 0) >= 85` — chegara React komponentiga hardcode qilingan, target/threshold sozlash jadvali topilmagan. **Δ:** `mes-oee-targets.repo.ts` (`mes_oee_targets` — versiyalangan, `is_active` bilan, stansiya-darajali) qurildi va `MESExtended.tsx:66` endi shundan o'qiydi ("85 hardcode emas") (`636a39d6`, `a7a5fb04`).
- **Nima yetishmaydi:** haqiqiy target qiymatlari egasi-data (business_settings/CRUD orqali kiritilishi kerak); ogohlantirish signali (chegaradan oshganda kimga ketishi) hamon ulanmagan.
- **Bog'liqlik:** EP-MES-036 (o'zgartirish huquqi — vision-1000 #36), EP-MES-073 (brak% chegarasi), EP-MES-081 (НО)
- **action:** UPDATE
- **⤳ Ta'sir:** Avto-signal, GSD bajarilishi, EP-MES-073
- **Xoch-havolalar:** `[Module-08] Item 65` · `EXTRACTION QISM C 08.15` · `TASDIQ-2146 §08 #15` · `EXTRACTION QISM A #29/#36`
- **Δ 2026-07-11→08-07:** `636a39d6` + `a7a5fb04` — `mes_oee_targets` versiyalangan sozlama jadvali (НО/direktor huquqi) + FE ulanishi; hardcoded 85 olib tashlandi. Status Yo'q → **Qisman**.

### EP-MES-016 · Jonli monitoring ekrani (sex tablosi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — to'liq jonli tablo (har mashina rangli holat + jonli OEE/miqdor). Kitob "kim hozir qaysi mashinada" jonli bandlik talabini beradi (EP-MES-073/EP-MES-043).
- **Manba:** v1-A + kitob (operator→mashina jonli jadval)
- **Dalil (kod):** `MESExtended.tsx` (OEE/KPI-karta sahifasi) mavjud; rangli/svetofor per-mashina tablo topilmagan (EP-MES-047 bilan bir xil salbiy grep). QISM D (VERIFY #47): `IoTProductionDashboardSections.tsx:82-92,323` da faqat running/stopped rang + online/offline + vaqt-qolgan sariq indikatorlari bor. **Δ:** `mes.gateway.ts` (WS gateway) o'lik fayl sifatida o'chirildi (`d74a12db`) — "jonli" tomonning yagona infratuzilma dalili yo'qoldi.
- **Nima yetishmaydi:** vizyon so'ragan "rangli jonli sex-tablosi" (har mashina holati + jonli OEE/miqdor) mavjud OEE-dashboarddan alohida qurilmagan.
- **Bog'liqlik:** EP-MES-017 (yangilanish), EP-MES-043 (kim qaysi mashinada), EP-MES-039 (mashina master-data)
- **action:** READ
- **⤳ Ta'sir:** EP-MES-043 (jonli bandlik), EP-MES-017 (yangilanish tezligi)
- **Xoch-havolalar:** `[Module-08] Item 66` · `EXTRACTION QISM C 08.16` · `TASDIQ-2146 §08 #16` · `QISM D VERIFY #47`
- **Δ 2026-07-11→08-07:** `d74a12db` — `mes.gateway.ts` o'chirildi (hech bir modulda ro'yxatdan o'tmagan, mavjud bo'lmagan `mes-oee-cron.service` ga havola qilardi). Sahifa qoldi, jonli push infratuzilmasi yo'q.

### EP-MES-017 · Jonli yangilanish tezligi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** B — har 1-5 daqiqada yangilanish (yengil, IoT yo'q sharoitda yetarli). Operator qo'lda kiritgani uchun real-time push hozir ortiqcha yuk; SOS alohida darhol push.
- **Manba:** v1 (A/B) + EP-MES-080 (qo'lda kiritish konteksti)
- **Dalil (kod):** 2026-07-11: `mes.gateway.ts:73-75` `pushOeeUpdate()` `oee:update` ni `oee:{workCenterId}` xonasiga emit qilardi; `@SubscribeMessage('oee:subscribe')`/`shift:subscribe` (55,66) bor edi. Lekin `grep -rl "pushOeeUpdate"` faqat `mes.gateway.ts` ning o'zini qaytarardi — hech bir cron/servis uni chaqirmasdi; docstring'dagi `mes-oee-cron.service` fayli repoda umuman yo'q edi. **Δ:** butun fayl o'chirildi (`d74a12db`).
- **Nima yetishmaydi:** endi WS push infratuzilmasi ham yo'q — 1-5 daqiqalik kadens ham, SOS-push ajratish ham qurilmagan (FE polling darajasi tasdiqlanmagan).
- **Bog'liqlik:** EP-MES-016 (tablo), EP-MES-009 (SOS darhol push)
- **action:** READ
- **⤳ Ta'sir:** Monitoring yuki, SOS (alohida darhol)
- **Xoch-havolalar:** `[Module-08] Item 67` · `EXTRACTION QISM C 08.17` · `TASDIQ-2146 §08 #17`
- **⚠️ ZIDDIYAT:** QISM C (2026-06-27) "WS OEE push **bor**" vs FULL-ITEM-LEVEL (2026-07-11) "chaqiruvchisi yo'q — o'lik kod" vs jonli kod (2026-08-07) "fayl o'chirilgan". Uch manba uchta har xil holat beradi; eng yangi + jonli-kod dalili ustun → **Yo'q**.
- **Δ 2026-07-11→08-07:** `d74a12db` — o'lik `mes.gateway.ts` (81 qator) Q-46 bo'yicha to'liq o'chirildi. Status Qisman → **Yo'q** (kod-bazasi haqiqatiga moslashtirildi, regress emas).

### EP-MES-018 · To'xtagan mashina avto-ogohlantirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avto-signal bosqichli (15 daq → usta, 30 daq → direktor). Uzoq to'xtash = katta yo'qotish; eskalatsiya org-sxema marshruti bilan mos (EP-MES-009).
- **Manba:** v1-A + EP-MES-009 (eskalatsiya) + org-sxema
- **Dalil (kod):** `production-agent.service.ts` docstring (9-12) uchta operatsiyani sanaydi: `monitorOrders` (kechikkan buyurtmalar), `calculateOEE`, `detectBottleneck` (125) — hech biri "mashina N daqiqa to'xtadi → eskalatsiya" emas; alohida to'xtagan-mashina-timeout cron fayli topilmadi.
- **Nima yetishmaydi:** `machine_status_logs.status='stopped'` davomiyligini o'qiydigan cron (sxema o'zgarishi shart emas — `status_started_at` bor) + bosqichli signal.
- **Bog'liqlik:** EP-MES-009 (mavjud SOS cron shablon sifatida ishlatilishi mumkin); chegaralar egasi-data
- **action:** EVENT
- **⤳ Ta'sir:** NTF, org-sxema marshrut, jonli monitoring
- **Xoch-havolalar:** `[Module-08] Item 68` · `EXTRACTION QISM C 08.18` · `TASDIQ-2146 §08 #18`
- **Δ 2026-07-11→08-07:** —

### EP-MES-019 · Operator kartasiga ulash (karta-model)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har sessiya/brigada natijasi operator kartasiga yoziladi (GSD bajarilishi). Karta-model = asosiy vizyon; natija kartaga yozilmasa oylik/reyting/o'sish ishlamaydi.
- **Manba:** karta-model vizyon (MEMORY org_card_centric) + LOYIHA-BITGAN (karta poydevor) + v1-A
- **Dalil (kod):** `production_sessions.operator_card_id` ustuni jonli (`information_schema.columns`); `MES_TO_HR_360` `production-session.aggregate.ts` va `org-structure/ckp-mes-feed.listener.ts` da havola qilingan; `operator_daily_stats` mavjud lekin **0 qator**; `SELECT count(*) FROM production_sessions WHERE operator_card_id IS NOT NULL` → **0** (jami 8 qatordan).
- **Nima yetishmaydi:** ustun, event turi va quyi-oqim listeneri kodda bor, lekin natija→karta→oylik rollupi hech qachon to'ldirilmagan — faqat sxema darajasida ulangan.
- **Bog'liqlik:** EP-MES-020 (GSD ball), EP-MES-021 (razryad), EP-MES-027 (bonus); ⭐ ORG/KARTALAR
- **action:** EVENT
- **⤳ Ta'sir:** ⭐ ORG/KARTALAR (poydevor), oylik/reyting/o'sish, EP-MES-020/021
- **Xoch-havolalar:** `[Module-08] Item 69` · `EXTRACTION QISM C 08.19` · `TASDIQ-2146 §08 #19` · `EXTRACTION QISM A #14/#19`
- **Δ 2026-07-11→08-07:** —

### EP-MES-020 · Operator GSD (ЦКП) ko'rsatkichi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — bir nechta GSD (yaroqli miqdor + OEE + norma ichida sarf) vaznli ball. ShVB modelida har lavozimda statistik ko'rsatkich shart; zavod formasi "соф махсулот"ni asosiy beradi (EP-MES-064).
- **Manba:** v1-A + ShVB (GSD/ЦКП) + kitob (соф махсулот, EP-MES-064)
- **Dalil (kod):** `production_sessions` da `actual_quantity`, `defect_quantity`, `produced_qty`, `defect_qty` (dublikat juftlik) va `oee` ustunlari mavjud (`information_schema.columns`). Bu xom maydonlar yonida vaznli-GSD formulasi ustuni yoki maxsus hisob-servisi topilmadi.
- **Nima yetishmaydi:** ko'p-omilli ЦКП vaznli formulasi (yaroqli miqdor + OEE + norma-ichi-sarf) yo'q; `produced_qty`/`actual_quantity` dublikati kanonik maydonni noaniq qiladi.
- **Bog'liqlik:** EP-MES-019 (karta-ulanish avval to'ldirilishi shart), EP-MES-026 (smena bali), EP-MES-060 (соф махсулот)
- **action:** READ
- **⤳ Ta'sir:** Karta-model, baholash, EP-MES-064
- **Xoch-havolalar:** `[Module-08] Item 70` · `EXTRACTION QISM C 08.20` · `TASDIQ-2146 §08 #20`
- **Δ 2026-07-11→08-07:** —

### EP-MES-021 · Razryad (malaka darajasi) va natija bog'lanishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — razryad normani va bahoni belgilaydi, MES natijasi razryad-o'sishga ta'sir qiladi. Karta-modelda razryad → talab → o'sish → oylik zanjiri bor; 2021 ShVB mustaqil-ish ruxsati (EP-MES-052) razryad bilan bog'liq.
- **Manba:** v1-A + karta-model (razryad zanjiri) + kitob (2021 ShVB)
- **Dalil (kod):** `razryad_levels` jonli va to'ldirilgan (`q.cjs`, **6 qator**: level/coefficient/salary_min/max/exam_type). `Grep "razryad_levels|razryadLevels" path=apps/api/src/modules/mes` → **fayl topilmadi** — MES moduli bu jadvalga umuman murojaat qilmaydi.
- **Nima yetishmaydi:** master-data real, lekin MES↔razryad kod-darajali bog'lanishi umuman yo'q ("tasdiqlanmagan" emas, **mavjud emas**); razryad-o'sish biznes-qoidalari egasi-data.
- **Bog'liqlik:** EP-MES-052/053/054 (malaka darvozalari), EP-MES-019 (karta), HR
- **action:** READ
- **⤳ Ta'sir:** Karta-model, HR (razryad o'sishi), EP-MES-052/053
- **Xoch-havolalar:** `[Module-08] Item 71` · `EXTRACTION QISM C 08.21` · `TASDIQ-2146 §08 #21` · `EXTRACTION QISM A #44` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-022 · Brak (defekt) sababini toifalash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tayyor brak-sabab toifalari + mas'ul bosqich. Kitob har brak holatini yozma sabab bilan beradi; OTK sifat hujjatlarini rasmiy qayd qiladi (5-departament sifat siyosati).
- **Manba:** kitob (ОТК sifat qaydlari + brak sabab izohlari) + QC moduli + v1-A
- **Dalil (kod):** `SELECT count(*) FROM inline_qc_checks` → **0**. `mes_downtime_reasons` da `category='quality'` kodlar bor (`DT-QUAL`, `DT-QUAL-REWORK`). `production_sessions.current_stage` ustuni mavjud, lekin aniq brak yozuvini aniq bosqichga bog'laydigan jadval/ustun topilmadi.
- **Nima yetishmaydi:** sifat-toifali downtime kodlari master-data sifatida bor, lekin "brak toifasi + mas'ul bosqich" jadvali (`inline_qc_checks`) bo'sh; defekt↔bosqich atribusiyasi mexanizmi yo'q.
- **Bog'liqlik:** EP-MES-060 (umumiy/brak/sof), EP-MES-073 (brak%), QC moduli
- **action:** CREATE
- **⤳ Ta'sir:** QC moduli, Quality OEE, EP-MES-073 (brak%)
- **Xoch-havolalar:** `[Module-08] Item 72` · `EXTRACTION QISM C 08.22` · `TASDIQ-2146 §08 #22` · `EXTRACTION QISM A #6/#10`
- **Δ 2026-07-11→08-07:** —

### EP-MES-023 · Smenadan smenaga topshirish (handover)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — rasmiy handover yozuvi (tugamagan ish + nosozlik + izoh, keyingi smena tasdiqlaydi). Kitob: bajarilmagan reja kelingi kunga "sababsiz ko'chib qolmaydi", smena yakuni yozma xulosa bilan yopiladi.
- **Manba:** kitob (smena-xulosa oргполитика: yozma yakun, sabab ko'chmasligi) + v1-A
- **Dalil (kod):** `shift_handovers` ustunlari tasdiqlandi (`handed_over_by`, `received_by`, `signature_data`, `status`); qator soni = **0**. `iot-tablet.controller.ts:235-299`: `POST tablet/handover` real `INSERT INTO shift_handovers`; `PATCH tablet/handover/:id/accept` (278-299) real `UPDATE ... SET received_by=..., signature_data=..., status='completed' WHERE status <> 'completed'` + topilmasa/allaqachon yopilgan bo'lsa 422 — ya'ni ikki-imzoli qabul darvozasi **kod-jihatdan to'liq**.
- **Nima yetishmaydi:** mexanizm to'liq, lekin hech qachon ishlatilmagan (0 qator); "arbitr" (smena boshlig'i) roli va handover-qabulisiz smena yopilmasligi gate'i (vision-1000 #31/#46) alohida qurilmagan.
- **Bog'liqlik:** EP-MES-026 (smena bali), EP-MES-079 (AI xulosa), PP (reja tuzatish)
- **action:** CREATE
- **⤳ Ta'sir:** Javobgarlik, EP-MES-079 (AI smena xulosasi), PP (reja tuzatish)
- **Xoch-havolalar:** `[Module-08] Item 73` · `EXTRACTION QISM C 08.23` · `TASDIQ-2146 §08 #23` · `EXTRACTION QISM A #2/#21/#31/#46/#50`
- **⚠️ ZIDDIYAT:** QISM C "qabul-tasdiq ustuni **to'liq emas**" vs FULL-ITEM-LEVEL "accept/confirm mexanizmi to'liq qurilgan, faqat ishlatilmagan". Kod o'qilgan dalil ustun → mexanizm to'liq, bo'shliq = jonli qo'llanish.
- **Δ 2026-07-11→08-07:** —

### EP-MES-024 · Ish topshirig'i (work order) MES'ga qanday tushadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — rejadan (PP) avtomatik, operator ro'yxatdan tanlaydi → reja-fakt bog'liq. Kitob: operator "режалаштириш бўлимидан берилган режа асосида" ishlaydi; smena reja PP'dan avto-tuziladi (EP-MES-063).
- **Manba:** kitob (operator режа асосида ishlaydi + Режалаштириш marshrut) + v1-A + EP-MES-063
- **Dalil (kod):** `production_sessions.production_order_id` jonli va **8/8** qatorda to'ldirilgan (`SELECT count(*) ... IS NOT NULL` → 8); `mes_papka_orders` **0 qator**. `pp-released-mes.listener.ts` jonli (SB0287 RESOLVED) — PP↔MES event ko'prigi real.
- **Nima yetishmaydi:** FK bog'lanishi ishlaydi, lekin ish-buyrug'ini avto-to'ldiradigan PP-tomon reja hujjati (`mes_papka_orders`) butunlay bo'sh → "avto-tushish" jonli rejadan isbotlanmagan.
- **Bog'liqlik:** EP-MES-063 (reja-forma avto-tuzish), EP-MES-031 (А смена План), PP moduli
- **action:** EVENT
- **⤳ Ta'sir:** PP (reja), reja-fakt taqqoslash, EP-MES-063
- **Xoch-havolalar:** `[Module-08] Item 74` · `EXTRACTION QISM C 08.24` · `TASDIQ-2146 §08 #24` · `EXTRACTION QISM A #32/#42`
- **Δ 2026-07-11→08-07:** —

### EP-MES-025 · Reja vs fakt (ishlab chiqarish bajarilishi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har order va smenada reja/fakt/farq% + sabab (kam bajarilsa). Kitob "Сменалик режани назорат" oргполitikasi: har kuni reja-bajarilish + bajarilmaslik sababi majburiy tahlil.
- **Manba:** kitob (smena-reja-nazorat oргполитika: reja/fakt/sabab) + А смена План formasi (режа/факт) + v1-A
- **Dalil (kod):** `production_sessions` da `target_quantity` va `actual_quantity` mavjud va 8/8 qatorda to'ldirilgan; jadvalda `variance_percent` ustuni **yo'q**, farq-darvozasiga bog'langan sabab/izoh ustuni ham yo'q.
- **Nima yetishmaydi:** farq% saqlanmaydi/hisoblanmaydi va majburiy-sabab majburlash yo'q — bu taqdimot/biznes-logika bo'shlig'i, ma'lumot bo'shlig'i emas.
- **Bog'liqlik:** EP-MES-077 (majburiy sabab), EP-MES-032 (reja/fakt vaqt), EP-MES-072 (norma)
- **action:** READ
- **⤳ Ta'sir:** GSD/smena bali, PP (kunlik tahlil), EP-MES-077 (majburiy sabab)
- **Xoch-havolalar:** `[Module-08] Item 75` · `EXTRACTION QISM C 08.25` · `TASDIQ-2146 §08 #25` · `EXTRACTION QISM A #40`
- **Δ 2026-07-11→08-07:** —

### EP-MES-026 · Smenani baholash (ball)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — vaznli ball (OEE + reja-fakt + brak + sarf), sozlanadigan vazn (kodda MES_SCORE_MAX bor). Bitta tushunarli ball reyting/bonus uchun asos.
- **Manba:** v1-A + kod (MES_SCORE_MAX) + ShVB (statistik ball)
- **Dalil (kod):** `SELECT count(*) FROM mes_shift_evaluations` → **0** (jadval mavjud — so'rov "relation does not exist" bermay, 0 qaytardi). QISM D (VERIFY #7): smena yopish = `closeShiftEvaluation` (`mes-shifts-stats.controller.ts:78`) — qo'lda ball.
- **Nima yetishmaydi:** ball-jadvali tayyor, lekin 0 qator; vaznli formula/sozlanadigan vazn xizmati topilmadi (vazn qiymatlari egasi-data → `business_settings`).
- **Bog'liqlik:** EP-MES-023 (handover), EP-MES-027 (bonus), EP-MES-020 (GSD)
- **action:** READ
- **⤳ Ta'sir:** Reyting/bonus, karta-model, EP-MES-027
- **Xoch-havolalar:** `[Module-08] Item 76` · `EXTRACTION QISM C 08.26` · `TASDIQ-2146 §08 #26` · `EXTRACTION QISM A #29/#50` · `QISM D VERIFY #7`
- **Δ 2026-07-11→08-07:** —

### EP-MES-027 · Bonus/reytingga ulanish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ball → A/B/C toifa → bonus avto-hisob (payroll bilan). ShVB modelida natija → reyting → bonus zanjiri bor; xodim kunlik hisoboti (Q116) oylik kartaga ulanadi.
- **Manba:** v1-A + ShVB (natija→reyting→bonus) + BARCHA_JAVOBLAR Q116/Q119 (xodim hisobot→oylik)
- **Dalil (kod):** `mes_shift_evaluations` = 0 qator (zanjirning manba-ma'lumoti yo'q). `Grep "payroll|bonus" path=apps/api/src/modules/mes -i` → faqat 1 moslik, `mes-brak-limit.repo.ts` (aloqasiz defekt-limit repo). QISM D (VERIFY #30): ЦКП-fakt feed yutuq-foizni yozadi (`ckp-mes-feed.listener.ts:118 recordFact`) + gamification leaderboard bor, lekin belgilangan-summa-bonus → HR-tasdiq → Payroll oqimi topilmadi.
- **Bog'liqlik:** EP-MES-026 avval to'ldirilishi shart; bonus summasi (A/B/C so'm) — egasi-data
- **action:** EVENT
- **⤳ Ta'sir:** FIN/Payroll, karta-model, HR
- **Xoch-havolalar:** `[Module-08] Item 77` · `EXTRACTION QISM C 08.27` · `TASDIQ-2146 §08 #27` · `EXTRACTION QISM A #30` · `QISM D VERIFY #30`
- **Δ 2026-07-11→08-07:** —

### EP-MES-028 · AI ishlab chiqarish nazoratchisi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — AI jonli kuzatadi + kunlik hisobot + anomaliya signali (kodda mes-monitor/production-agent bor). 460 javob AI nazoratni qattiq talab qiladi (kunlik hisobot, anomaliya).
- **Manba:** BARCHA_JAVOBLAR (AI kamera production monitoring, kunlik hisobot) + kod (production-agent) + v1-A
- **Dalil (kod):** `ai-agents/mes/mes-monitor.service.ts:131-234` — real z-score anomaliya detektori: `computeZScore()`, `classifySeverity()`, `handleSeverityAction()` → `handleAutoStop()`/`handleAlert()`, `logAnomalyDecision` (ishonch bali + alternativalar) va `mes.machine.anomaly_alert` HITL-eskalatsiya eventi. Shu faylda `Grep "llm|generateNarrative|openai|anthropic|claude" -i` → **moslik yo'q**.
- **Nima yetishmaydi:** deterministik anomaliya/HITL quvuri real, lekin LLM-narrativ hisobot **tasdiqlangan yo'qlik** (shunchaki tekshirilmagan emas); `generateShiftReport()` faqat agregat.
- **Bog'liqlik:** EP-MES-079 (AI kunlik xulosa) bilan bir ildiz
- **action:** AI
- **⤳ Ta'sir:** AI moduli, EP-MES-079 (AI smena xulosasi), DIR (kunlik)
- **Xoch-havolalar:** `[Module-08] Item 78` · `EXTRACTION QISM C 08.28` · `TASDIQ-2146 §08 #28` · `EXTRACTION QISM A #7/#27/#45` · `QISM D VERIFY #7/#27`
- **Δ 2026-07-11→08-07:** —

### EP-MES-029 · Materiallar partiyasini (lot) kuzatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har sessiyada ishlatilgan partiya/rulon yoziladi (traceability). Kitob "Заявка бумаги" rulon/format/папка bilan beradi; brak chiqsa qaysi material partiyasi/yetkazib beruvchini topish kerak.
- **Manba:** kitob (Заявка бумаги: рулон/папка) + BARCHA_JAVOBLAR (POS partiya/Code-128, FIFO/FEFO) + v1-A
- **Dalil (kod):** `mes_material_consumption` **1 qator**; `information_schema.columns` — `batch_number` ustuni mavjud va shu yagona qatorda to'ldirilgan. FIFO/FEFO tartib-logikasi (muddat/kirim-sana bo'yicha saralash maydoni) na ustunlarda, na kod-greplarda topilmadi. QISM D (VERIFY #12): `recordMaterialConsumption(...batch_number...)` har sarf uchun partiya-raqamli satr yozadi (`mes-shifts-stats.service.ts:71`), lekin foiz-hissa saqlash yo'q.
- **Nima yetishmaydi:** FIFO/FEFO tartiblash va ko'p-partiyali foiz-hissa (A 60% / B 40%) yo'q; 1 qator bilan traceability isbotlanmaydi.
- **Bog'liqlik:** EP-MES-065/066 (qog'oz), WMS (partiya), QC
- **action:** CREATE
- **⤳ Ta'sir:** WMS (partiya), QC (traceability), EP-MES-065/066 (qog'oz)
- **Xoch-havolalar:** `[Module-08] Item 79` · `EXTRACTION QISM C 08.29` · `TASDIQ-2146 §08 #29` · `EXTRACTION QISM A #12` · `QISM D VERIFY #12`
- **Δ 2026-07-11→08-07:** —

### EP-MES-030 · Texkarta amal qilinishi (adherence)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har bosqich belgilanadi (checklist) + chetlashuv qaydi. Kitob: texkarta xatosi/etishmasligi aniqlansa smena texnologi 15 daqiqada bosh texnologga xabar beradi → chetlashuv qayd shart.
- **Manba:** kitob (texkarta xatosi 15-daq xabar siyosati) + PP routing + v1-A
- **Dalil (kod):** `production-session.aggregate.ts:393-410` `passChecklist()` — real, **fail-closed** darvoza (`requiredTotal===0` → BLOCKED; bajarilmagan majburiy band → BLOCKED); 4 faylda havola qilingan, shu jumladan `start-session.handler.ts:66` va `iot-tablet.controller.ts:400-408` (422 BLOCKED). `setup_checklists` ustunlari: `all_materials_scanned`, `all_settings_confirmed`, `all_crew_assigned`, `test_piece_approved` (4 bool), qator soni **0**.
- **Nima yetishmaydi:** chek-list dag'al 4-bool darvoza — per-band pass/fail massivi va erkin-matnli "chetlashuv" maydoni yo'q; jonli DB'da 0 qator (fail-closed bo'lgani uchun bu amalda har sessiya-boshlashni bloklaydi); "bo'lim boshlig'i override" mexanizmi topilmadi.
- **Bog'liqlik:** `setup_checklists` seed + hujjatlashtirilgan override roli; EP-MES-007 (texkarta)
- **action:** UPDATE
- **⤳ Ta'sir:** QC (sifat standart), PP (routing), texnolog eskalatsiya
- **Xoch-havolalar:** `[Module-08] Item 80` · `EXTRACTION QISM C 08.30` · `TASDIQ-2146 §08 #30` · `EXTRACTION QISM A #8` · `QISM D VERIFY #8`
- **⚠️ ZIDDIYAT:** QISM D (VERIFY #8) darvozani **Ha** deb yopgan ("real enforcement, ikkala start yo'lida ulangan") vs FULL-ITEM-LEVEL **Qisman** (chek-list o'zi 4-bool, chetlashuv maydoni yo'q, 0 qator). Ikkalasi ham to'g'ri, lekin har xil savolga javob beradi: *darvoza* qurilgan (Ha), *adherence qaydi* qurilmagan (Qisman) → registr Qisman'ni oladi.
- **Δ 2026-07-11→08-07:** —

### EP-MES-031 · "А смена План" formasini ekranga aynan ko'chirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — formani aynan ustun-ma-ustun ko'chirish (smena → mashina → buyurtma satri). Zavod 5 yil shu forma bilan ishlaydi; tanish forma = usta o'rganishsiz ishlatadi.
- **Manba:** kitob (А смена План.xlsx haqiqiy forma) + v2-A
- **Dalil (kod):** `MESExtended.tsx` = modulning FE dashboardi (OEE/KPI-karta sahifasi, `worldClass` hardcode 146-qator dalili bilan) — smena-reja-forma sahifasi/route'i topilmadi. `Grep "papka_no|KT4438|papkaNo" path=apps/api/src/modules/mes` → fayl topilmadi (MES ostida reja-forma endpointi yo'q).
- **Nima yetishmaydi:** `FormPage` shabloniga mos yangi FE sahifa (Q-41) + `mes_papka_orders` ni smenaga to'ldirish; forma ustunlari/layouti = egasi-data (repoda raqamli shablon yo'q).
- **Bog'liqlik:** EP-MES-063 va EP-MES-064 ni bloklaydi; EP-MES-024 (`mes_papka_orders` to'ldirilishi) bilan umumiy manba
- **action:** CREATE
- **⤳ Ta'sir:** PP reja → MES forma → smena hisobot zanjiri
- **Xoch-havolalar:** `[Module-08] Item 81` · `EXTRACTION QISM C 08.31` · `TASDIQ-2146 §08 #31` · `EXTRACTION QISM A #39` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-032 · Reja vaqti vs fakt vaqtni 4 ALOHIDA maydonda saqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 4 maydon to'liq (reja-boshlash / fakt-boshlash / reja-tugatish / fakt-tugatish). Forma reja va faktni yonma-yon yozadi → kechikish shu yerdan o'lchanadi.
- **Manba:** kitob (А смена План: ишни бошлаш/тугатиш режа+факт) + v2-A
- **Dalil (kod):** to'liq `production_sessions` ustun ro'yxati (38 ustun) — `started_at`/`ended_at` va dublikat `start_time`/`end_time` (ikki nomlash avlodi) bor, lekin **birorta ham** reja-vaqt ustuni yo'q (`planned_start`/`planned_end` va shunga o'xshash).
- **Nima yetishmaydi:** bo'shliq hujjatdagi "4 maydon to'liq emas" dan **jiddiyroq** — kerakli reja-vaqt maydonlarining 0 tasi mavjud; qo'shimcha ravishda fakt-vaqt ikki juftlikda dublikat.
- **Bog'liqlik:** EP-MES-025 (reja-fakt), EP-MES-063 (reja-forma)
- **action:** CREATE
- **⤳ Ta'sir:** Kechikish tahlili, reja-fakt (EP-MES-025), OEE
- **Xoch-havolalar:** `[Module-08] Item 82` · `EXTRACTION QISM C 08.32` · `TASDIQ-2146 §08 #32`
- **Δ 2026-07-11→08-07:** —

### EP-MES-033 · Operator + Ёрдамчи juftligini har stansiyaga biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN *(sub-savol "yordamchi ulushi" 🔵 A-default: razryadga qarab)*
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har stansiyaga 1 operator + N yordamchi roli (hissa har kimga to'g'ri). Forma har mashinaga операtor + ёрдамчи alohida yozadi (mas. ФСМ: Хужамбердиева + Холмирзаева). Sub-savol (yordamchi ulushi): 🔵 A-default = razryadga qarab (EP-MES-021 bilan mos).
- **Manba:** kitob (А смена План: Оператор/Ёрдамчи satrlari) + v2-A
- **Dalil (kod):** 2026-07-11 auditida: `machine_crews` ustunlari `master_id`, `polmaster_id`, `shogird_id`, `rokler_id` — aynan 4 qat'iy nomli rol ustuni, takrorlanuvchi/N-kardinallikli "yordamchi" ro'yxati yo'q, foiz/hissa ustuni yo'q. **Δ:** `machine_crew_members` jadvali + `mes-crew-members.repo.ts` qurildi (`3556262a`) — aynan (session_id, employee_id, rol, hissa%) modeli.
- **Nima yetishmaydi:** eski `machine_crews` (4 qat'iy rol) o'chirilmagan/ko'chirilmagan — ikki parallel jamoa-modeli yashaydi; jonli qator + FE ulanishi tasdiqlanmagan.
- **Bog'liqlik:** EP-MES-004 (brigada), EP-MES-021 (razryad = ulush bazasi), EP-MES-044
- **action:** CREATE
- **⤳ Ta'sir:** Oylik/reyting (yordamchi hissasi), karta-model, EP-MES-004
- **Xoch-havolalar:** `[Module-08] Item 83` · `EXTRACTION QISM C 08.33` · `TASDIQ-2146 §08 #33`
- **⚠️ ZIDDIYAT:** FULL-ITEM-LEVEL (2026-07-11) "hissa% ustuni yo'q, Q-35 sxema-qayta-qurish kerak" vs `3556262a` (2026-07-10) — jadval AUDITDAN OLDIN qurilgan. Sabab = `7ec31c9e` "migrations-not-applied": migratsiya repoda, jonli DB'da emas.
- **Δ 2026-07-11→08-07:** `3556262a` — `machine_crew_members` (1 operator + N nomli yordamchi + hissa%) qurildi. Status Yo'q → **Qisman**.

### EP-MES-034 · Normani SOATLIK + 12-SOATLIK ikki bazada saqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — asosiy = soatlik, 12-soatlik avto-hisob (×12 − tanaffuslar). Станоклар норма ikkala bazani beradi; bitta haqiqat uchun avto-hisob.
- **Manba:** kitob (Станоклар норма: норма штук 1час + за 12 часов) + Кун тартиби (12 soat) + v2-A
- **Dalil (kod):** `information_schema.tables WHERE table_name LIKE '%norm%'` → faqat `material_norms`. Uning ustunlari `product_id, technology_card_id, material_category_id, material_id, norm_quantity_per_1000, unit, waste_percentage, ...` — bu **1000 donaga material sarfi BOM normasi**, ishlab-chiqarish tezligi normasi emas; qator soni 0. Hech bir jadvalda soatlik/12-soatlik ikki baza ustuni yo'q.
- **Nima yetishmaydi:** `material_norms` dan ALOHIDA per-stansiya ishlab-chiqarish-tezligi jadvali (station_id, unit, hourly_rate, twelve_hour_rate, effective_date); tezlik qiymatlari egasi-data.
- **Bog'liqlik:** EP-MES-039 (mashina master-data) avval kerak; EP-MES-008/035/045/049/072/077/095 shu jadvalga tayanadi
- **action:** CREATE
- **⤳ Ta'sir:** EP-MES-049 (sof ish vaqti), norma master-data
- **Xoch-havolalar:** `[Module-08] Item 84` · `EXTRACTION QISM C 08.34` · `TASDIQ-2146 §08 #34` · `EXTRACTION QISM A #4/#17` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-035 · Normaning o'lchov birligini stansiyaga qarab (м2/лист/штук/удар-лист)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har stansiya turining o'z birligi (м2/лист/дона/удар). Гофра = м2, печать = лист, ФСМ = штук, тигель = удар. Birlik tasdiqlangan master-data (EP-MES-082).
- **Manba:** kitob (Станоклар норма: ед.изм har stansiyaga) + v2-A
- **Dalil (kod):** `equipment` jadvalining to'liq ustun ro'yxatida o'lchov-birligi ustuni yo'q. `unit_of_measures` jadvali mavjud, **19 qator** (`code, name, category, base_unit_id, conversion_factor`), lekin stansiya/jihoz bilan bog'lovchi biror ustun yo'q.
- **Nima yetishmaydi:** stansiya×birlik junction jadvali (yoki `equipment.default_unit_id` FK) mavjud 19-qatorli `unit_of_measures` ga havola bilan; qaysi birlik qaysi mashinaga tegishli — egasi-data.
- **Bog'liqlik:** EP-MES-082 (tasdiqlangan birlik — bir xil bo'shliq), EP-MES-039 (mashina katalogi), EP-MES-034
- **action:** CREATE
- **⤳ Ta'sir:** Norma/bajarilish to'g'riligi, EP-MES-082 (tasdiqlangan birlik)
- **Xoch-havolalar:** `[Module-08] Item 85` · `EXTRACTION QISM C 08.35` · `TASDIQ-2146 §08 #35`
- **Δ 2026-07-11→08-07:** —

### EP-MES-036 · "иш йук" (ish yo'qligi) holatini downtime'dan ALOHIDA hisoblash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — "ish yo'q" alohida tur, sababi rejalashtirishga yoziladi (operator aybsiz). Kitob: "ходимлар 3 соат иш йуклиги учун арчишда ишлади" — bu mashina nosozligi emas, режа-хато (smena-xulosa 6-toifa).
- **Manba:** kitob (Станоклар норма "иш йук" ustun + smena-xulosa режа-хато toifasi) + v2-A
- **Dalil (kod):** 2026-07-11 auditida: 16 kodli `mes_downtime_reasons` ro'yxati qayta tekshirilgan — hech biri "ish yo'q" ni ifodalamaydi (`DT-MAT-WAIT` = material-yetkazish kutuvi, boshqa tushuncha); `downtime_reason_codes` 0 qator. **Δ:** `mes-downtime-nowork-2026-07-11.sql` — `('DT-NOWORK', 'Ish yo''q (topshiriq berilmagan bo''sh vaqt)', 'no-work', ...)` seed; `get-oee.handler.ts:87-122,285-291` — `NO_WORK_CATEGORY = 'no-work'`, `noWorkTime` alohida chelak, span'dan BIRINCHI ayriladi va Availability maxrajiga kirmaydi (`013b21a6`).
- **Bog'liqlik:** EP-MES-005 (ish-yo'q eventi), EP-MES-037 (qayta-biriktirish) shu toifaga tayanadi
- **action:** CREATE
- **⤳ Ta'sir:** PP rejalashtirish GSD'si, sabab toifalash (EP-MES-010/011)
- **Xoch-havolalar:** `[Module-08] Item 86` · `EXTRACTION QISM C 08.36` · `TASDIQ-2146 §08 #36` · `EXTRACTION QISM A #5` *(taxminiy)*
- **⚠️ ZIDDIYAT:** ikki mustaqil audit-o'tishi kelishmagan (Yo'q vs STALE-DOC) — FULL-ITEM-LEVEL buni yangi tekshiruv bilan hal qilgan: hujjatning "7 kod" raqami eskirgan, ammo qobiliyat-bo'shlig'i o'sha paytda haqiqiy edi. 2026-07-11 dagi `DT-NOWORK` seed bilan bo'shliq yopildi.
- **Δ 2026-07-11→08-07:** `013b21a6` — `DT-NOWORK` kodi + OEE'da alohida "no-work" chelagi (operator aybsiz vaqt Availability jazosidan chiqarildi). Status Yo'q → **Ha**.

### EP-MES-037 · Ish-yo'q paytida xodimni boshqa ishga o'tkazishni qayd qilish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ish-yo'q vaqtiga "qaytarilgan ish" (archish/kadoklash/avtokarton) yoziladi → haqiqiy unum. Kitob aniq beradi: "иш йуклиги сабабли арчишда ишлаган / паддон кадоклаган / автокартонда ишлади".
- **Manba:** kitob (Станоклар норма izohlari: qayta-biriktirilgan ish) + v2-A
- **Dalil (kod):** `apps/api/src/modules/mes` da ham, `machine_crews`/`production_sessions` da ham qayta-biriktirish ("qaytarilgan ish") mexanizmi topilmadi.
- **Nima yetishmaydi:** (session_id, from_task, to_task, reassigned_at) shaklidagi qayta-biriktirish yozuvi — endi EP-MES-036 dagi `DT-NOWORK` mavjud bo'lgani uchun bloki olib tashlandi.
- **Bog'liqlik:** EP-MES-036 (endi qurilgan → bu band buildable-now), EP-MES-044, HR davomat
- **action:** CREATE
- **⤳ Ta'sir:** Haqiqiy unum, EP-MES-044 (bir necha mashina), HR davomat
- **Xoch-havolalar:** `[Module-08] Item 87` · `EXTRACTION QISM C 08.37` · `TASDIQ-2146 §08 #37`
- **Δ 2026-07-11→08-07:** —

### EP-MES-038 · Ofset va Flekso bo'limini alohida normalash (НО 12-1 / НО 12-2)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Ofset / Flekso alohida bo'lim (o'z norma + НО-mas'ul + hisobot). Kitob: "отдел ОФСЕТ" (Махмудов 12-1) va "отдел ФЛЕКСО" (Юсупов 12-2) alohida norma jadvallari.
- **Manba:** kitob (Станоклар норма: ОФСЕТ/ФЛЕКСО alohida + НО-mas'ul) + v2-A
- **Dalil (kod):** `work_centers` qatorlari generik bosma-jarayon nomlari (Pre-press, Offset bosma 1/2, Raqamli bosma, Qirqish, Laminatsiya...); `equipment.category` qiymatlari ham generik (`printing`, `cutting`, `finishing`, `digital`) — Ofset↔Flekso bo'lim ajratmasi va НО-mas'ul ustuni sxemada yo'q. `Grep "НО|department_head|bo.?lim.*mas.?ul" path=apps/api/src/modules/mes -i` → fayl topilmadi.
- **Nima yetishmaydi:** bo'lim (Ofset НО 12-1 / Flekso НО 12-2) master-data jadvali + per-bo'lim norma scope'i; kim НО 12-1, kim 12-2 — egasi-data.
- **Bog'liqlik:** EP-MES-081 ni bloklaydi; EP-MES-039 (jihoz katalogi + bo'lim biriktirish) kerak; vision-1000 #35 (RBAC bo'lim-scope)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura (НО lavozimlari), EP-MES-081 (НО-mas'ul), hisobot
- **Xoch-havolalar:** `[Module-08] Item 88` · `EXTRACTION QISM C 08.38` · `TASDIQ-2146 §08 #38` · `EXTRACTION QISM A #35` · `QISM D VERIFY #35`
- **Δ 2026-07-11→08-07:** —

### EP-MES-039 · Aniq mashina ro'yxatini master-data qilib kiritish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — kitobdagi to'liq mashina ro'yxati (~30 ta) master-data. Резка, Гф линия, SM-52/SM-72/KBA-105, Трафарет/UV лак, Ламинация, кашировка, Автовысечка, Тигель 1-10, ФСМ, Окошка, Степлер, Эмбоссинг.
- **Manba:** kitob (Станоклар норма: aniq mashina ro'yxati) + v2-A
- **Dalil (kod):** `SELECT name, category, type FROM equipment ORDER BY id` → aynan **7 qator**, jumladan "Ofset mashina #1 (DEMO)", "Offset Bosma Mashinasi 1/2", "Flexoprint Mashinasi 1", "Qirqish Dastgohi 1", "Laminatsiya Mashinasi", "Raqamli Bosma Mashinasi" — ochiq-oydin placeholder/demo/kategoriya-darajali yozuvlar, haqiqiy ~30 mashinali zavod katalogi emas.
- **Nima yetishmaydi:** kod-jihatdan hech narsa — sof ma'lumot kiritish; ro'yxat (nom, tur, quvvat, ish-markazi) **faqat egasida** bor.
- **Bog'liqlik:** ⭐ modulning eng katta ildiz-blokeri — EP-MES-001(vision #1)/026/028/040/042/034/035/038/040/042/054/069/073/119 ga tarqaladi
- **action:** CREATE
- **⤳ Ta'sir:** Norma/OEE/sarf bog'lanishi, EP-MES-040 (tigel), EP-MES-042 (mashina×bo'lim)
- **Xoch-havolalar:** `[Module-08] Item 89` · `EXTRACTION QISM C 08.39` · `TASDIQ-2146 §08 #39`
- **Δ 2026-07-11→08-07:** —

### EP-MES-040 · Tigel pressini 1-10 raqamlangan alohida birlik qilish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har tigel (1-10) alohida birlik + turi (oddiy/тиснение/конгрев). Kitob Тигель 1..10 ni alohida satr qiladi; rejalovchi konkret tigelga ish beradi.
- **Manba:** kitob (Станоклар норма: Тигель 1-10 alohida) + v2-A
- **Dalil (kod):** EP-MES-039 dagi bir xil `equipment` dump (7 qator) — 7 qatorning birortasida "Тигель"/"Tigel" yo'q.
- **Nima yetishmaydi:** sof ma'lumot kiritish (sxema o'zgarishi shart emas — `equipment.name`/`equipment_number` ixtiyoriy mashina identifikatorini qo'llab-quvvatlaydi); tigel nomlash/soni va turi (oddiy vs тиснение) — egasi-data.
- **Bog'liqlik:** EP-MES-039 avval hal bo'lishi shart
- **action:** CREATE
- **⤳ Ta'sir:** Aniq yuklash/bandlik, EP-MES-039, jonli monitoring
- **Xoch-havolalar:** `[Module-08] Item 90` · `EXTRACTION QISM C 08.40` · `TASDIQ-2146 §08 #40`
- **Δ 2026-07-11→08-07:** —

### EP-MES-041 · Stansiyaga "keyingi ish" (очередь) ko'rsatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har mashinada joriy + navbatdagi 2-3 ish. Forma "Станокдаги Ишлар" + "кейинги иши" ustuni beradi; uzluksizlik uchun.
- **Manba:** kitob (А смена План: кейинги иши ustuni) + v2-A
- **Dalil (kod):** `machine_tasks` ustunlari mavjud (`routing_operation_id`, `work_center_id`, `status`, `priority`, `planned_quantity`, `completion_percent`, ...); `SELECT count(*) FROM machine_tasks` → **0 qator**.
- **Nima yetishmaydi:** jadval tuzilmasi navbat-ko'rsatishga tayyor, lekin 0 qator — ko'rsatiladigan jonli navbat yo'q; FE'da "joriy + keyingi 2-3" render komponenti tasdiqlanmagan.
- **Bog'liqlik:** EP-MES-067/068 bilan bir xil `machine_tasks`-to'ldirish bo'shlig'i; PP
- **action:** READ
- **⤳ Ta'sir:** Uzluksizlik, EP-MES-038/039 (marshrut), PP
- **Xoch-havolalar:** `[Module-08] Item 91` · `EXTRACTION QISM C 08.41` · `TASDIQ-2146 §08 #41` · `EXTRACTION QISM A #42` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-042 · Bir mashina ikki bo'limda (Флексо vs Упаковка) ishlashini ajratish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mashina + bo'lim (Flekso/Upakovka) birikmasi alohida birlik. Forma: "ФСМ Флексо" va "ФСМ ФЛЕКСО Упаковка", "Степлер ... ФЛЕКСО/УПАКОВКА".
- **Manba:** kitob (А смена План: mashina+bo'lim birikmasi) + v2-A
- **Dalil (kod):** `equipment` sxemasida yagona `work_center_id` FK ustuni bor (1:1 mashina→ish-markazi, `information_schema.columns` bilan tasdiqlangan); modul bo'yicha o'tkazilgan sxema-qidiruvida mashina×bo'lim junction jadvali umuman topilmadi.
- **Nima yetishmaydi:** `equipment_department_assignments` shaklidagi junction jadval; qaysi fizik mashinalar ikki bo'limda ishlashi — egasi-data.
- **Bog'liqlik:** EP-MES-039 (haqiqiy katalog) avval kerak; EP-MES-038 (bo'lim ajratish)
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot aralashmasligi, EP-MES-038, EP-MES-045
- **Xoch-havolalar:** `[Module-08] Item 92` · `EXTRACTION QISM C 08.42` · `TASDIQ-2146 §08 #42`
- **Δ 2026-07-11→08-07:** —

### EP-MES-043 · "Kim hozir qaysi mashinada" jonli bandlik jadvali
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — jonli "operator → mashina" jadvali (band/bo'sh). Forma har operator ismini mashina yonida beradi (Холматов → Трафарет Лак); usta SOS/ish-yo'q'da kimni ko'chirishni bilishi kerak.
- **Manba:** kitob (А смена План: operator↔mashina) + v2-A + EP-MES-016
- **Dalil (kod):** `SELECT work_center_id, status, operator_id FROM machine_status_logs LIMIT 5` → namunadagi har qatorda `operator_id: null` (jami 9 qatordan) — jadval faqat mashina ishlayapti/to'xtadi holatini kuzatadi, qaysi operator qaysi mashinada ekanini hech qachon emas.
- **Nima yetishmaydi:** sessiya boshlanganda `machine_status_logs.operator_id` ni aktiv `production_sessions.worker_id`/`operator_card_id` dan to'ldirish + shu join ustiga jonli "kim qayerda" tablosi.
- **Bog'liqlik:** EP-MES-019 (`operator_card_id` to'ldirilishi) ishonchli operator manbasi uchun kerak; EP-MES-016
- **action:** READ
- **⤳ Ta'sir:** Tez qaror (ko'chirish), EP-MES-016 (monitoring), EP-MES-044
- **Xoch-havolalar:** `[Module-08] Item 93` · `EXTRACTION QISM C 08.43` · `TASDIQ-2146 §08 #43`
- **Δ 2026-07-11→08-07:** —

### EP-MES-044 · Bir operator bir vaqtda bir necha mashina yuritishini qayd qilish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — operator bir necha mashinaga (foiz/vaqt ulushi bilan). Forma: bitta operator bir necha tigel/stansiyani yuritadi (Холматов ikki normada).
- **Manba:** kitob (А смена План: bir operator ko'p stansiya) + v2-A
- **Dalil (kod):** `production_sessions.equipment_id` — yagona integer FK (massiv ham, junction ham emas), `machine_crews` da foiz/vaqt-ulush ustuni yo'q (EP-MES-033 bilan bir xil dump) → tuzilma "1 sessiya = 1 mashina" ni tasdiqlaydi. **Δ:** `machine_crew_members` (hissa%-li) qurildi (`3556262a`), lekin u **sessiya ichidagi jamoa ulushi**, operator→ko'p-mashina modeli emas.
- **Nima yetishmaydi:** (operator_id, machine_id, sana, share_percent) shaklidagi ko'p-mashina biriktirish modeli — bu sessiya-modelini qayta loyihalash (Q-34 dizayn qarori, egasi imzosi kerak).
- **Bog'liqlik:** EP-MES-033 (jamoa-modeli qayta qurilishi bilan tushunchaviy kesishadi), EP-MES-040 (tigellar), EP-MES-037
- **action:** CREATE
- **⤳ Ta'sir:** Haqiqatga mos natija, EP-MES-040 (tigellar), EP-MES-033
- **Xoch-havolalar:** `[Module-08] Item 94` · `EXTRACTION QISM C 08.44` · `TASDIQ-2146 §08 #44`
- **Δ 2026-07-11→08-07:** `3556262a` — `machine_crew_members` hissa%-ni keltirdi, lekin operator→ko'p-mashina o'qini yopmaydi; status **Yo'q** bo'lib qoladi.

### EP-MES-045 · Yakuniy qadoqlash (упаковка 1 сотрудник) ni alohida bosqich/norma qilish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — qadoqlash alohida bosqich + norma (1 ishchi / 12 soat). Forma "упаковка (1 сотрудник)" alohida norma beradi.
- **Manba:** kitob (Станоклар норма: упаковка 1 сотрудник) + v2-A
- **Dalil (kod):** `production-session.aggregate.ts` — sessiyaning `GsdStage` modelida aynan 3 bosqich bor (SETUP/MAIN/TEARDOWN, EP-MES-001/048 da "Ha" deb tasdiqlangan); to'rtinchi "qadoqlash" bosqichi agregatda yo'q.
- **Nima yetishmaydi:** `GsdStage` ni `PACKAGING` bilan kengaytirish + shu bosqichga alohida norma yozuvi; "1 ishchi/12 soat" raqami egasi tasdig'ini kutadi.
- **Bog'liqlik:** EP-MES-034 (per-stansiya norma jadvali) yangi bosqich normasini saqlash uchun kerak; EP-MES-038 (marshrut tugashi)
- **action:** CREATE
- **⤳ Ta'sir:** Oxirgi bosqich unumi, EP-MES-038 (marshrut tugashi)
- **Xoch-havolalar:** `[Module-08] Item 95` · `EXTRACTION QISM C 08.45` · `TASDIQ-2146 §08 #45`
- **Δ 2026-07-11→08-07:** —

### EP-MES-046 · "переделка" (qayta ishlash) ni alohida yo'qotish qilish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — "qayta ishlash" alohida tur + sababi (qolib/sozlash/material) + soat. Kitob: "Колиб нотугри килинган - переделка 3 соат", "иш икки марта кайта урилган".
- **Manba:** kitob (Станоклар норма izohlari: переделка soat) + v2-A
- **Dalil (kod):** `mes_downtime_reasons` dump — `DT-QUAL-REWORK` ("Qayta ishlov (rework) sababli to'xtash", `category=quality`, `is_planned=false`) **mavjud**, `mes-downtime-reasons-expand-2026-07-04.sql` bilan qo'shilgan (2026-06-27 auditidan 5 kun keyin). Lekin `SELECT reason_code, notes, is_planned, duration_minutes FROM downtime_events LIMIT 10` → faqat 2 test qator (`reason_code = 'unknown'` / `'EQUIPMENT_FAILURE'`) — hech biri `DT-QUAL-REWORK` ni ishlatmaydi.
- **Nima yetishmaydi:** master-data kodi bor, lekin uchidan-uchiga "sabab + soat" qayd qilinishi jonli qatorda isbotlanmagan. QISM D (VERIFY #25): MES modulida rework-toifasi/GL-moddasi ham yo'q (`grep rework mes/` → 0), `qc-rework.listener` PP tarafida.
- **Bog'liqlik:** EP-MES-075 (majburiy izoh), EP-MES-011 (kod master-data), EP-MES-001 (hop3 yakunlash)
- **action:** CREATE
- **⤳ Ta'sir:** Aniq yo'qotish, OEE, EP-MES-011, EP-MES-001 (hop3 yakunlash)
- **Xoch-havolalar:** `[Module-08] Item 96` · `EXTRACTION QISM C 08.46` · `TASDIQ-2146 §08 #46` · `EXTRACTION QISM A #25` · `QISM D VERIFY #25`
- **⚠️ ZIDDIYAT:** QISM C "7 kodda переделка turi **yo'q**" vs jonli DB "DT-QUAL-REWORK bor" → QISM C satri **STALE-DOC**. Ammo funksional bo'shliq (jonli qo'llanish + GL rework-moddasi) hamon ochiq.
- **Δ 2026-07-11→08-07:** —

### EP-MES-047 · Qolib (shtamp/forma) tayyor emasligini downtime sababi qilish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — "qolib/forma tayyor emas" alohida sabab kodi → KB/konstruktor bo'limiga ulanadi. Kitob: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат".
- **Manba:** kitob (Станоклар норма izohi: qolib kechikishi 4 soat) + v2-A
- **Dalil (kod):** 2026-07-11: EP-MES-036/046 uchun ishlatilgan 16-qatorli `mes_downtime_reasons` dump — 16 kodning birortasi "qolib"/mold/die ga ishora qilmaydi (eng yaqini `DT-SETUP`/`DT-CALIBRATE`, ular generik sozlash kodlari); MES modulida KB (konstruktorlik byurosi) signal ulanishi topilmadi. **Δ:** `mes-downtime-mold-2026-07-11.sql` — `('DT-MOLD', 'Qolip/pichoq-shakl almashtirish', 'changeover', is_planned=true)` idempotent seed (`a7a5fb04`).
- **Nima yetishmaydi:** KB/konstruktor bo'limiga signal (kimga ketishi — egasi-data) va takror-hodisa hisoblagichi (EP-MES-076) hamon yo'q. Shuningdek seed `is_planned=true`/`changeover` beradi, vizyon esa "tayyor emas" ni **rejasiz** yo'qotish deb qaraydi.
- **Bog'liqlik:** EP-MES-076 (takror→KB) bevosita shunga tayanadi; EP-MES-011
- **action:** CREATE
- **⤳ Ta'sir:** KB/konstruktor signal, downtime kodlar (EP-MES-011), takror-sabab
- **Xoch-havolalar:** `[Module-08] Item 97` · `EXTRACTION QISM C 08.47` · `TASDIQ-2146 §08 #47` · `EXTRACTION QISM A #6`
- **⚠️ ZIDDIYAT:** yangi `DT-MOLD` kodi `is_planned=true, category='changeover'` bilan seed qilingan; vizyon (kitob izohi "уз вактида колибни таергарлик курмаганимиз") buni **rejasiz yo'qotish** deb ta'riflaydi → OEE Availability'da noto'g'ri tomonga tushishi mumkin. Egasi/НО tasdig'i kerak.
- **Δ 2026-07-11→08-07:** `a7a5fb04` — `DT-MOLD` sabab kodi seed qilindi. Status Yo'q → **Qisman** (kod bor, KB-signal yo'q).

### EP-MES-048 · Murakkab sozlash (настройка/приладка) ni alohida vaqt qilish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — sozlash/приладка alohida bosqich + vaqti → OEE Availability to'g'ri. Kitob: "Билма заказ настройкаси муракаб - вакт кетди"; "настройка"/"приладка"/"Настройка лак" satrlar.
- **Manba:** kitob (Станоклар норма: настройка/приладка satrlari) + v2-A
- **Dalil (kod):** `production_sessions` sxemasi `setup_seconds`, `main_seconds`, `teardown_seconds` ni alohida ustun sifatida tasdiqlaydi; `production-session.aggregate.ts` dagi 3-bosqichli `GsdStage` bilan mos (EP-MES-001 bilan bir xil dalil). `mes_downtime_reasons` da `DT-CHANGEOVER` ("Mahsulot almashinuvi", `category=setup`, `is_planned=true`) ham bor.
- **Bog'liqlik:** EP-MES-001 (hop3 tayyorgarlik), EP-MES-074 (changeover ko'rsatkichi), EP-MES-014
- **action:** CREATE
- **⤳ Ta'sir:** OEE (Availability), EP-MES-001 (hop3 tayyorgarlik), EP-MES-014
- **Xoch-havolalar:** `[Module-08] Item 98` · `EXTRACTION QISM C 08.48` · `TASDIQ-2146 §08 #48` · `EXTRACTION QISM A #18` *(taxminiy — "sozlash 2× uzun signal")*
- **Δ 2026-07-11→08-07:** —

### EP-MES-049 · Normani SOF ISH VAQTIGA hisoblash (tanaffus/tushlik/namoz chegirib)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — smenadan tanaffus/tushlik/namoz avto-chegiriladi → "sof ish vaqti" normaga asos. Kun tartibi aniq: tanaffus 10:00-10:20, tushlik 12:00-13:30, poldnik 16:00-16:20, namoz vaqtlari.
- **Manba:** kitob (Кун тартиби: aniq tanaffus vaqtlari) + v2-A
- **Dalil (kod):** `Grep "namoz|tushlik|lunch|prayer" path=apps/api/src/modules/mes -i` → faqat `apps/api/src/modules/mes/README.md` (hujjat eslatmasi), **nol** implementatsiya fayli. Tanaffus vaqtini ayiradigan mexanizm ham, per-stansiya norma jadvali (EP-MES-034 da ham yo'q deb tasdiqlangan) ham yo'q.
- **Nima yetishmaydi:** sof-ish-soniya = smena soniyalari − rejalashtirilgan tanaffus soniyalari hisobi; aniq tanaffus oynalari (10:00 / 12:00 / namoz) egasi tasdig'ini kutadi.
- **Bog'liqlik:** EP-MES-034 (norma jadvali) avval kerak; EP-MES-050/051/071 shu mexanizmga tayanadi
- **action:** UPDATE
- **⤳ Ta'sir:** HR davomat + OEE Availability, EP-MES-034 (12-soatlik)
- **Xoch-havolalar:** `[Module-08] Item 99` · `EXTRACTION QISM C 08.49` · `TASDIQ-2146 §08 #49` · `EXTRACTION QISM A #16`
- **Δ 2026-07-11→08-07:** —

### EP-MES-050 · 3-smenali tushlikni navbat bilan boshqarish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — MES tushlik navbatini ko'rsatadi (1/2/3-to'lqin) → mashina to'xtamaydi. Kun tartibi: "3 сменалик тушлик 12:00-13:30 (хар бир смена учун 30 минут)".
- **Manba:** kitob (Кун тартиби: 3-smenali tushlik) + v2-A
- **Dalil (kod):** EP-MES-049 bilan bir xil salbiy grep (`namoz|tushlik|lunch|prayer` → implementatsiya fayli yo'q); `SELECT code, name_uz, duration_hours FROM shift_types` — faqat MORNING/EVENING/NIGHT, to'lqin/tushlik-navbat metama'lumoti yo'q.
- **Nima yetishmaydi:** tushlik-to'lqin jadvali (machine_id/shift_id → to'lqin 1/2/3); to'lqin taqsimoti qoidasi — egasi-data.
- **Bog'liqlik:** EP-MES-049/051/071 bilan kesishadi; EP-MES-061 (A/B/C smena modeli)
- **action:** READ
- **⤳ Ta'sir:** Unum (mashina to'xtamasligi), EP-MES-049, EP-MES-041 (tanaffus marker)
- **Xoch-havolalar:** `[Module-08] Item 100` · `EXTRACTION QISM C 08.50` · `TASDIQ-2146 §08 #50`
- **Δ 2026-07-11→08-07:** —

### EP-MES-051 · Namoz tanaffusini sof-ish-vaqtdan ajratib hisobga olish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — namoz vaqti sof-ish-vaqtdan chegiriladi (bittadan navbat). Kun tartibi: peshin 12:45 +20 daq, asr 18:00 +10 daq, shom 20:00 +10 daq, "битта одам учун".
- **Manba:** kitob (Кун тартиби: namoz vaqtlari + bittadan) + v2-A
- **Dalil (kod):** EP-MES-049/050 bilan aynan bir xil salbiy grep natijasi (`namoz|tushlik|lunch|prayer` faqat README eslatmasini topadi, kod yo'q).
- **Nima yetishmaydi:** EP-MES-049 dagi tanaffus-chegirish mexanizmi, namozga xoslangan + "bittadan navbat" qoidasi bilan; navbat qoidasi egasi tasdig'ini kutadi.
- **Bog'liqlik:** EP-MES-049 (umumiy mexanizm) avval kerak
- **action:** UPDATE
- **⤳ Ta'sir:** Adolat + hurmat, EP-MES-049 (sof ish vaqti)
- **Xoch-havolalar:** `[Module-08] Item 101` · `EXTRACTION QISM C 08.51` · `TASDIQ-2146 §08 #51` · `EXTRACTION QISM A #16`
- **Δ 2026-07-11→08-07:** —

### EP-MES-052 · Mustaqil ishlash ruxsati = MES operatorlik huquqi (2021 ShVB siyosati)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — faqat "mustaqil ruxsat" bayrog'i bor xodim sessiya ochadi (mashina turi bo'yicha). 2021 hujjat: 2 oy amaliy + nazariy/amaliy imtihon + РД-4 yozma xulosa.
- **Manba:** kitob (2021 ShVB mustaqil-ish siyosati: imtihon + РД-4) + v2-A
- **Dalil (kod):** `start-session.handler.ts` da real hard-block: 40-qator izohi "§8.3 LMS SERTIFIKAT TEKSHIRUVI — HARD BLOCK", 50-qator `checkOperatorCertification()`, 57-qator kurs nomi + muddati bilan `FORBIDDEN`. `operator_certifications` ustunlari `operator_id, course_id, course_name, issued_at, expires_at, status` — `machine_id`/`machine_type` ustuni yo'q, jadval **0 qator**. **Δ:** `checkOperatorMachineSkill()` qo'shildi (`start-session.handler.ts:90`) — `work_centers.required_skill_name` o'rnatilgan bo'lsa, muddati o'tmagan mos `employee_skills` qatori talab qilinadi (`4d181f89`).
- **Nima yetishmaydi:** `operator_certifications` 0 qator — hech bir operatorda sertifikat yo'q; "mustaqil ruxsat" bayrog'i (2021 ShVB imtihoni + РД-4 xulosasi) alohida modellashtirilmagan; `work_centers.required_skill_name` qiymatlari egasi-data.
- **Bog'liqlik:** EP-MES-054 (matritsa) granularlik bo'shlig'ini yopadi; EP-MES-021 (razryad), EP-MES-053, HR Skills
- **action:** APPROVE
- **⤳ Ta'sir:** HR onboarding (устоз + imtixon) → MES operator huquqi, EP-MES-053/054
- **Xoch-havolalar:** `[Module-08] Item 102` · `EXTRACTION QISM C 08.52` · `TASDIQ-2146 §08 #52` · `EXTRACTION QISM A #1/#15/#44` · `QISM D VERIFY #1/#15/#44`
- **Δ 2026-07-11→08-07:** `4d181f89` — operator×mashina malaka darvozasi sessiya-boshlashga ulandi (HR `employee_skills` matritsasidan o'qiydi); NULL `required_skill_name` = cheklovsiz (regressiyasiz).

### EP-MES-053 · Ustoz-shogird (мураббий) bog'lanishini MES'da ko'rsatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — shogird sessiyasi "ustoz nazoratida" + natija ikkalasiga (o'qish davri). 2021 hujjat: yangi xodimga Мураббий biriktiriladi (buyruqda, 2 oy birga).
- **Manba:** kitob (2021 ShVB: Мураббий 2 oy) + BARCHA_JAVOBLAR Q145 (kasbiy usta mentor) + v2-A
- **Dalil (kod):** `machine_crews.shogird_id` ustuni mavjud (EP-MES-033 bilan bir xil sxema dump); yonida "ustoz nazoratida" bool bayrog'i yoki brak-atribusiyasini ajratish logikasi topilmadi.
- **Nima yetishmaydi:** nazorat-bayrog'i va shogird brakini ustoz yozuvidan ajratuvchi mexanizm (vision-1000 #14: "shogird braki USTOZ kartasiga ta'sir qilmaydi"); `machine_crews` → karta GSD yozuvi yo'q.
- **Bog'liqlik:** EP-MES-019 (karta GSD yozuvi), EP-MES-021 (razryad o'sishi), EP-MES-058 (o'quv ishi)
- **action:** CREATE
- **⤳ Ta'sir:** HR mentorlik + razryad o'sishi (EP-MES-021), adolatli baho
- **Xoch-havolalar:** `[Module-08] Item 103` · `EXTRACTION QISM C 08.53` · `TASDIQ-2146 §08 #53` · `EXTRACTION QISM A #14`
- **Δ 2026-07-11→08-07:** —

### EP-MES-054 · Operator × mashina malaka matritsasi (qaysi mashinada ishlay oladi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — operator × mashina matritsasi (ishlay oladi / o'rganmoqda / yo'q). ShVB onboarding "mashina turi bo'yicha" amaliy imtihon → har mashinaga alohida huquq.
- **Manba:** kitob (2021 ShVB: mashina turi bo'yicha imtihon) + BARCHA_JAVOBLAR Q135 (SkillsMatrix) + v2-A
- **Dalil (kod):** 2026-07-11: `SELECT count(*) FROM operator_certifications` → 0; ustunlar kurs-asosli (`course_id`, `course_name`), `machine_id`/`machine_type` ustuni umuman yo'q. **Δ:** `drizzle-mes.repo.ts` `checkOperatorMachineSkill()` — mavjud HR `employee_skills` jadvalini (avval MES o'qimagan) `work_centers.required_skill_name` orqali matritsa sifatida ishlatadi; `start-session.handler.ts:90` da hard FORBIDDEN blok (`4d181f89`).
- **Nima yetishmaydi:** vizyon uch holatli matritsa so'raydi (ishlay oladi / **o'rganmoqda** / yo'q) — hozirgi yechim ikki holatli (skill bor/yo'q); `work_centers.required_skill_name` qiymatlari to'ldirilmagan (egasi-data) → amalda hech qayerda blok yoqilmagan.
- **Bog'liqlik:** EP-MES-039 (mashina turlari katalogi), EP-MES-052, EP-MES-021
- **action:** CREATE
- **⤳ Ta'sir:** To'g'ri biriktirish (brak/xavf kamayadi), EP-MES-052, HR Skills
- **Xoch-havolalar:** `[Module-08] Item 104` · `EXTRACTION QISM C 08.54` · `TASDIQ-2146 §08 #54` · `EXTRACTION QISM A #1/#44` · `QISM D VERIFY #1/#44`
- **Δ 2026-07-11→08-07:** `4d181f89` — `checkOperatorMachineSkill()` (HR skill-matritsasi orqali) qurildi va sessiya-boshlashga hard-blok sifatida ulandi. Status Yo'q → **Qisman**.

### EP-MES-055 · "Согласовано РД-4 / Утверждено Ген.Директор" tasdiq zanjirini normaga
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — norma o'zgarishi РД-4 kelishuvi + direktor tasdig'idan o'tadi (versiya saqlanadi). Станоклар норма oxirida "Согласовано РД-4 (Юлчиев) + Утверждено Ген.Директор (Позилов)".
- **Manba:** kitob (Станоклар норма: ikki-bosqichli imzo) + v2-A
- **Dalil (kod):** `material_norms` jadvali mavjud (EP-MES-034 da tasdiqlangan), lekin ustun ro'yxatida `approved_by`/`approval_status`/`version` yo'q — butun sxemada "%norm%" ga mos yagona jadvalda ikki-bosqichli tasdiq tuzilmasi umuman yo'q. **Δ:** `mes_oee_targets` (`636a39d6`) НО/direktor-huquqli versiyalangan sozlama namunasini beradi, lekin u **OEE-maqsad**, ishlab-chiqarish normasi emas.
- **Nima yetishmaydi:** yakuniy norma jadvaliga `approval_status`, `approved_by_rd4`, `approved_by_director`, `approved_at` ustunlari (Q-35 sxema-tasdig'i) + tasdiq oqimining o'zi.
- **Bog'liqlik:** EP-MES-034 (norma jadvali) avval qurilishi shart; EP-MES-056 (versiya), EP-MES-082
- **action:** APPROVE
- **⤳ Ta'sir:** Norma nazorati + tarix, EP-MES-056 (versiya), org-sxema tasdiq
- **Xoch-havolalar:** `[Module-08] Item 105` · `EXTRACTION QISM C 08.55` · `TASDIQ-2146 §08 #55` · `EXTRACTION QISM A #29/#36`
- **Δ 2026-07-11→08-07:** `636a39d6` — analogik ikki-rolli (НО/direktor) versiyalangan sozlama naqshi `mes_oee_targets` da paydo bo'ldi; norma tomonига ko'chirilmagan → status **Yo'q**.

### EP-MES-056 · Norma versiyasi va sanasini saqlash ("Дата: 13.01.2022")
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — norma versiyalanadi (amal sanasi bilan). Станоклар норма "НО 12-2, Дата 13.01.2022" sanasi bilan tasdiqlanadi; o'tgan smena o'sha paytdagi norma bilan baholanadi.
- **Manba:** kitob (Станоклар норма: sana + НО raqami) + v2-A
- **Dalil (kod):** 2026-07-11: `material_norms` ustun dumpi — `effective_date`/`version` ustuni yo'q (QISM A #4/#17 dagi bir xil ildiz). **Δ:** `mes-norma-version-snapshot-2026-07-11.sql` + `start-session.handler.ts:156-167` — sessiya boshlanganda amalda bo'lgan (`effective_date <= started_at`) versiya `production_sessions.norma_version` ga snapshot qilinadi (`48f85a82`).
- **Nima yetishmaydi:** snapshot mexanizmi bor, lekin uni to'ldiradigan **versiyalangan norma jadvalining o'zi** (EP-MES-034) hamon yo'q — hozircha snapshot bo'sh manbadan o'qiydi.
- **Bog'liqlik:** EP-MES-034 (norma jadvali), EP-MES-055 (tasdiq), EP-MES-029/077
- **action:** UPDATE
- **⤳ Ta'sir:** Tarix to'g'riligi, EP-MES-055, o'tmish-baholash
- **Xoch-havolalar:** `[Module-08] Item 106` · `EXTRACTION QISM C 08.56` · `TASDIQ-2146 §08 #56` · `EXTRACTION QISM A #4/#17`
- **⚠️ ZIDDIYAT:** FULL-ITEM-LEVEL (2026-07-11) "effective_date/version ustuni yo'q" vs `48f85a82` (2026-07-10) — kommit auditdan OLDIN. Yana `7ec31c9e` "migrations-not-applied" holati.
- **Δ 2026-07-11→08-07:** `48f85a82` — sessiya-boshlashda norma-versiya snapshot (retro-buzilmaslik) qurildi. Status Yo'q → **Qisman**.

### EP-MES-057 · Mahsulot kodlash formatini saqlash (2025-3499 / KT4438 / папка)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq struktura (yil-raqam / папка / KT-kod / o'lcham / marka) alohida maydonlar. Kitob: "2025-3499 Barbol ... 33.5x24.5x12.5/17815/KT4438/T-24 marka"; usta KT4438 deb qidiradi.
- **Manba:** kitob (А смена План: buyurtma identifikatori) + v2-A
- **Dalil (kod):** `mes_papka_orders.papka_no` ustuni mavjud (PP-tomon hujjat); `production_sessions.production_order_id` 8/8 qatorda to'ldirilgan. `Grep "papka_no|KT4438|papkaNo" path=apps/api/src/modules/mes` → **fayl topilmadi** — MES tomonida papka/KT-kod bo'yicha ko'rsatish yoki qidirish kodi yo'q.
- **Nima yetishmaydi:** raqamli FK ishlaydi, lekin sex ustasi terib qidiradigan KT-kod/папка strukturasi MES UI/API'sida ochilmagan.
- **Bog'liqlik:** EP-MES-031 (А смена План formasi), EP-MES-024, SD/PP
- **action:** CREATE
- **⤳ Ta'sir:** SD buyurtma ↔ PP папка ↔ MES smena bog'lanishi, qidiruv
- **Xoch-havolalar:** `[Module-08] Item 107` · `EXTRACTION QISM C 08.57` · `TASDIQ-2146 §08 #57` · `EXTRACTION QISM A #32`
- **Δ 2026-07-11→08-07:** —

### EP-MES-058 · "Укишга" / "Академияга" — o'quv ishlarini real natijadan ajratish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — "o'quv/Akademiya" alohida ish turi (real natijaga qo'shilmaydi). Forma "Укишга"/"Академияга" satr/ustun beradi; o'quv braki/normasi haqiqiyga qo'shilmaydi.
- **Manba:** kitob (А смена План: Укишга/Академияга) + v2-A
- **Dalil (kod):** 2026-07-11: to'liq `production_sessions` ustun ro'yxatida (38 ustun) o'quv/"Академия" tasnifi uchun bool/bayroq ustuni yo'q edi; QISM D (VERIFY #33) ham `grep academy|study|training.*oee` → 0 fayl bergan. **Δ:** `mes33-production-sessions-is-training.sql` — `is_training boolean NOT NULL DEFAULT false` + `lms_enrollment_id integer` qo'shildi, `mes_production_sessions` VIEW'ga chiqarildi va Drizzle modeliga bog'landi; `get-oee.handler.ts:256-257` — `if (session.isTraining === true) continue` (smena kaskadidan chiqariladi); `POST /mes/production-sessions/:sessionId/training` yozuv yo'li + `markSessionTraining`/`setSessionTraining` (`5bf6e6fd`). Jonli `europrint` da rollback-tx bilan DB-isbotlangan.
- **Bog'liqlik:** EP-MES-053 (shogird), LMS moduli (`lms_enrollments`)
- **action:** CREATE
- **⤳ Ta'sir:** Toza unum/tannarx hisobi, LMS (o'quv), EP-MES-053 (shogird)
- **Xoch-havolalar:** `[Module-08] Item 108` · `EXTRACTION QISM C 08.58` · `TASDIQ-2146 §08 #58` · `EXTRACTION QISM A #33` · `QISM D VERIFY #33`
- **Δ 2026-07-11→08-07:** `5bf6e6fd` — `is_training` + `lms_enrollment_id` ustunlari, OEE'dan chiqarish va LMS-sync yozuv yo'li qurildi. Status Yo'q → **Ha**.

### EP-MES-059 · Gofra (2/5 qatlam) ishini м2 + qatlam bilan alohida hisoblash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — gofra liniyasi м2 + qatlam soni alohida (to'g'ri o'lchov + material). Forma "ЛИНИЯ 5 слой", "Формат гофро (2-слой)", "Гф линия (м2)". Kitob izohi: 5/3-qatlam aralashtirib yuborilishi (logistika xatosi) misol.
- **Manba:** kitob (А смена План + 5/3 qatlam logistika misoli) + v2-A + EP-MES-035 (м2)
- **Dalil (kod):** 2026-07-11: `information_schema.tables LIKE '%gofra%'` → `gofra_config`; mazmuni (`SELECT key, label_uz, value, unit`) atigi 2 generik konfiguratsiya qatori (`waste_pct_default=5%`, `kley_gsm=120g/m²`) — per-liniya 2/5-qatlamli м2+qatlam master-data emas. **Δ:** `mes-gofra-layer-2026-07-11.sql` — `production_sessions.gofra_layer_count SMALLINT` + `gofra_area_m2 NUMERIC(10,2)` qo'shildi (flekso/ofset `format_a/b/gramm` dan ALOHIDA), `schema-compat-4.ts:169` da bog'langan (`a7a5fb04`).
- **Nima yetishmaydi:** ustunlar bor, lekin ularni to'ldiradigan yozuv-yo'li (FE/endpoint) tasdiqlanmagan; "Гф линия" mashinasining o'zi `equipment` da yo'q (EP-MES-039).
- **Bog'liqlik:** EP-MES-035 (м2 birligi), EP-MES-029 (lot), EP-MES-039, WMS (qog'oz qatlam)
- **action:** CREATE
- **⤳ Ta'sir:** To'g'ri o'lchov+material, EP-MES-029 (lot), WMS (qog'oz qatlam)
- **Xoch-havolalar:** `[Module-08] Item 109` · `EXTRACTION QISM C 08.59` · `TASDIQ-2146 §08 #59` · `EXTRACTION QISM A #34`
- **⚠️ ZIDDIYAT:** QISM C "м2+qatlam ustunlari yo'q; Гф линия master-data'da yo'q" vs FULL-ITEM-LEVEL "gofra_config bor lekin talabni bajarmaydi" — ikkalasi ham `production_sessions` dagi 2026-07-11 ustunlarini ko'rmagan (migrations-not-applied).
- **Δ 2026-07-11→08-07:** `a7a5fb04` — `gofra_layer_count` + `gofra_area_m2` ustunlari qo'shildi; yozuv-yo'li hali ulanmagan.

### EP-MES-060 · "умумий сон / Брак сони / Соф махсулот" uchligini saqlash + avto-tekshirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — umumiy + brak + sof (avto-tekshiriladi: sof = umumiy − brak). Forma uch sonni beradi; Quality OEE shu uchlikdan hisoblanadi.
- **Manba:** kitob (А смена План: умумий/брак/соф) + v2-A
- **Dalil (kod):** `production_sessions.actual_quantity`/`defect_quantity` (va `produced_qty`/`defect_qty`) ustunlari mavjud. `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='production_sessions'::regclass AND contype='c'` → **bo'sh natija**, ya'ni jadvalda birorta CHECK cheklovi yo'q.
- **Nima yetishmaydi:** `sof = umumiy − brak` ni DB darajasida majburlaydigan cheklov **tasdiqlangan yo'qlik**; "sof" alohida saqlanmaydi, hosila; miqdor ustunlari ikki nomlash avlodida dublikat.
- **Bog'liqlik:** EP-MES-020 (GSD = соф), EP-MES-022 (brak), EP-MES-073 (brak%)
- **action:** CREATE
- **⤳ Ta'sir:** Quality OEE, EP-MES-022 (brak), EP-MES-020 (GSD = соф)
- **Xoch-havolalar:** `[Module-08] Item 110` · `EXTRACTION QISM C 08.60` · `TASDIQ-2146 §08 #60`
- **Δ 2026-07-11→08-07:** —

### EP-MES-061 · Smenani A/B/C harf-nomi bilan saqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — smena = A/B/C harf + vaqt oralig'i (sozlanadigan). Kitobda smenalar "А смена", "Б", "С" harf bilan; brigada doimiy A/B/C ga biriktirilgan. Hozirgi morning/afternoon/night → A/B/C.
- **Manba:** kitob ("А смена" nomi) + v2-A + EP-MES-003
- **Dalil (kod):** `SELECT code, name_uz, duration_hours FROM shift_types ORDER BY sort_order` → aynan 3 qator: `MORNING`/`EVENING`/`NIGHT`, har biri `duration_hours=9.0` — hech qayerda A/B/C kodi yo'q, davomiylik ham vizyondagi 12 soat emas.
- **Nima yetishmaydi:** A/B/C kodli, 12 soatlik qatorlar (additive seed, downtime-kengaytirish migratsiyasi naqshi bilan); MORNING/EVENING/NIGHT ni qayta nomlash yoki yonma-yon qo'shish — nomlash qarori egasidan.
- **Bog'liqlik:** EP-MES-050 va EP-MES-062 ni bloklaydi; EP-MES-003
- **action:** UPDATE
- **⤳ Ta'sir:** Zavod tiliga moslik, EP-MES-062 (doimiy biriktirish)
- **Xoch-havolalar:** `[Module-08] Item 111` · `EXTRACTION QISM C 08.61` · `TASDIQ-2146 §08 #61`
- **Δ 2026-07-11→08-07:** —

### EP-MES-062 · Brigadani doimiy A/B/C smenaga biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — brigada → doimiy smena (A/B/C) + kunlik o'zgarish (kasallik/ta'til) qayd. Kitob "А смена" doimiy operatorlar bilan (Тураходжаев/Маматалиев/Неъматов/Ходжаев).
- **Manba:** kitob (А смена doimiy tarkib) + v2-A + EP-MES-005
- **Dalil (kod):** bevosita EP-MES-061 topilmasiga tayanadi — `shift_types` da A/B/C kodlari umuman yo'q ekan, "doimiy A/B/C brigada" biriktirish jadvali ham mavjud bo'lolmaydi; bu o'tishdagi sxema-qidiruvda bunday jadval topilmadi.
- **Nima yetishmaydi:** `brigade_shift_assignments` (brigade_id, shift_code, effective_date) — EP-MES-061 dagi A/B/C modeli qurilgach.
- **Bog'liqlik:** EP-MES-061 (A/B/C), EP-MES-004/005 (brigada modeli), HR davomat
- **action:** CREATE
- **⤳ Ta'sir:** Davomat + barqaror baho, EP-MES-005 (tarkib), HR
- **Xoch-havolalar:** `[Module-08] Item 112` · `EXTRACTION QISM C 08.62` · `TASDIQ-2146 §08 #62`
- **Δ 2026-07-11→08-07:** —

### EP-MES-063 · Smena reja-formasini smena BOSHIDA avto-tuzish (планировщик Исаков)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — MES smena boshida reja-formani avto-tuzadi (PP rejasidan) + bosib chiqariladi. Hozir Excel'da qo'lda (Режалаштириш ходими Исаков); avto-tuzish reja-faktni avto-bog'laydi. Davriy: avval B (qo'lda MES'da), keyin A (avto).
- **Manba:** kitob (А смена План qo'lda tuziladi) + v2 (A/B) + EP-MES-024 (PP avto)
- **Dalil (kod):** `SELECT count(*) FROM mes_papka_orders` → **0 qator** (bu o'tishda bir necha marta tasdiqlangan); smena-reja-formasini yaratish uchun `mes_papka_orders` ga murojaat qiladigan avto-generatsiya cron/servisi topilmadi.
- **Nima yetishmaydi:** PP reja-ma'lumotini o'qib, smena uchun `mes_papka_orders` qatorlarini avto-yaratadigan cron/servis + chop etish; PP tomoni ("Исаков rejasi") avval ma'lumot ishlab chiqarishi kerak.
- **Bog'liqlik:** EP-MES-031 (reja-forma sahifasi) va PP manba-ma'lumotiga bog'liq; EP-MES-064
- **action:** CREATE
- **⤳ Ta'sir:** PP (reja), planlovchi vaqti, reja-fakt avto-bog'lanish
- **Xoch-havolalar:** `[Module-08] Item 113` · `EXTRACTION QISM C 08.63` · `TASDIQ-2146 §08 #63` · `EXTRACTION QISM A #39` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-064 · "Режалаштириш ходими" + "Технолог" imzosini smenaga biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har smena rejasiga planlovchi + texnolog (mas'ul). Forma "Режалаштириш ходими: Исаков" + "Технолог: Ёкубжонов/Аслонов" imzolari; imzosiz reja egasiz.
- **Manba:** kitob (А смена План: planlovchi+texnolog imzo) + v2-A
- **Dalil (kod):** na `mes_papka_orders`, na `production_sessions` ustun ro'yxatida planlovchi/texnolog imzo maydoni bor (ikkala ro'yxat bu o'tishda ko'rib chiqilgan — `planner_signed_by`/`technologist_signed_by` yo'q).
- **Nima yetishmaydi:** imzo ustunlari (EP-MES-063 reja-forma mexanizmi qurilgach); kim "planlovchi", kim "texnolog" — org-rol ma'lumoti egasidan.
- **Bog'liqlik:** EP-MES-063 (reja-forma avval bo'lishi shart), EP-MES-081 (mas'ullik), org-sxema
- **action:** APPROVE
- **⤳ Ta'sir:** Javobgarlik aniq, org-sxema (lavozim kartasi), EP-MES-081
- **Xoch-havolalar:** `[Module-08] Item 114` · `EXTRACTION QISM C 08.64` · `TASDIQ-2146 §08 #64`
- **Δ 2026-07-11→08-07:** —

### EP-MES-065 · Qog'oz zayavkasini (Заявка бумаги) MES sarfiga bog'lash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — zayavka → MES haqiqiy sarf → farq (ortiqcha/kam). Заявка бумаги (Формат/Грам/Кг/Лист размер/Папка/заказ) = rejalashtirilgan material; MES = haqiqiy sarf.
- **Manba:** kitob (Заявка бумаги.xlsx) + v2-A + EP-MES-008
- **Dalil (kod):** `information_schema.tables WHERE table_name LIKE '%zayavka%' OR LIKE '%paper%request%'` → **bo'sh natija** — jonli sxemada "Заявка бумаги" jadvali umuman yo'q. **Δ:** `mes-wms-param-compare.service.ts`/`.repo.ts`/`.controller.ts` (`mes.module.ts:45-47` da ro'yxatdan o'tgan) sessiya format/gramm ni WMS partiya parametrlari bilan taqqoslaydi (`5691aaa8`) — bu taqqos o'qining bir qismi, lekin zayavka-hujjatining o'zi emas.
- **Nima yetishmaydi:** qog'oz-zayavka jadvali + `mes_material_consumption` ga qarshi zayavka↔haqiqiy-sarf farq hisobi (Q-35 yangi jadval tasdig'i; WMS/MM tomoni bilan kelishuv).
- **Bog'liqlik:** EP-MES-008 (chetlashuv), EP-MES-066 (format/gramm), EP-MES-029 (lot), WMS/MM
- **action:** CREATE
- **⤳ Ta'sir:** Ombor (qog'oz zayavkasi) ↔ MES sarf ↔ tannarx, WMS
- **Xoch-havolalar:** `[Module-08] Item 115` · `EXTRACTION QISM C 08.65` · `TASDIQ-2146 §08 #65` · `EXTRACTION QISM A #24/#34`
- **Δ 2026-07-11→08-07:** `5691aaa8` — MES↔WMS partiya-parametr taqqoslash slice'i qurildi (`item24-mes-wms-param-compare-2026-07-11.sql`); zayavka-hujjati bo'lmagani uchun asosiy talab hamon **Yo'q**.

### EP-MES-066 · Qog'oz formati (лист размер А×В) + grammni sessiyaga yozish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — sessiyada format (А×В) + gramm + kg yoziladi (aniq material sarfi). Заявка бумаги "Формат/Грам/Лист размер А/В" beradi.
- **Manba:** kitob (Заявка бумаги: format/gramm/kg) + v2-A
- **Dalil (kod):** 2026-07-11: to'liq `production_sessions` ustun dumpida `format_a`/`format_b`/`gramm`/`kg` yo'q edi — faqat generik `target_quantity`/`actual_quantity` (`mes_papka_orders` da `format_a/b` bor, lekin u boshqa, 0-qatorli PP jadvali). **Δ:** `item116-mes-session-paper-format-2026-07-11.sql` — `production_sessions` ga `format_a numeric(12,2)`, `format_b`, `gramm numeric(10,2)`, `kg numeric(14,3)` idempotent qo'shildi; `schema-compat-4.ts:155-160` da bog'landi; `getSession` `SELECT ps.*` orqali avtomatik qaytaradi (`a691a5c3`).
- **Nima yetishmaydi:** ustunlar bor, operator kiritadigan FE maydonlari/yozuv-endpointi tasdiqlanmagan (barcha mavjud sessiyalarda NULL).
- **Bog'liqlik:** EP-MES-065 (zayavka), EP-MES-059 (gofra), EP-MES-029 (lot)
- **action:** CREATE
- **⤳ Ta'sir:** Aniq material sarfi (kg), EP-MES-065, EP-MES-059 (gofra)
- **Xoch-havolalar:** `[Module-08] Item 116` · `EXTRACTION QISM C 08.66` · `TASDIQ-2146 §08 #66` · `EXTRACTION QISM A #24`
- **Δ 2026-07-11→08-07:** `a691a5c3` — `format_a/format_b/gramm/kg` ustunlari sessiyaga qo'shildi. Status Yo'q → **Qisman**.

### EP-MES-067 · "Прошло (дней)" — buyurtma necha kun kutganini ko'rsatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har buyurtmada "necha kun kutdi" + muddat-oshgan ranglanadi. Заявка бумаги "Прошло (дней)" beradi; uzoq kutgan = mijoz norozi xavfi.
- **Manba:** kitob (Заявка бумаги: Прошло дней) + v2-A
- **Dalil (kod):** `machine_tasks` to'liq ustun ro'yxati (EP-MES-041 uchun tasdiqlangan) — `due_date`, `completed_date`, `created_at` bor, lekin hosila "kutilgan kun" ustuni yo'q; jadval baribir **0 qator**.
- **Nima yetishmaydi:** `NOW() - created_at` hisobi so'rov/FE qatlamida (sxema o'zgarishi shart emas) — EP-MES-041 dagi navbat haqiqiy qatorlarga ega bo'lgach.
- **Bog'liqlik:** EP-MES-041 (`machine_tasks` to'ldirilishi) avval kerak; EP-MES-068
- **action:** READ
- **⤳ Ta'sir:** Kechikish ko'rinishi, EP-MES-068 (shoshilinch), SD/mijoz
- **Xoch-havolalar:** `[Module-08] Item 117` · `EXTRACTION QISM C 08.67` · `TASDIQ-2146 §08 #67`
- **Δ 2026-07-11→08-07:** —

### EP-MES-068 · "Зарур заказлар" (shoshilinch) ni navbatda oldinga chiqarish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — shoshilinch bayroq + navbatda yuqoriga + signal. Forma "ЗАРУР ЗАКАЗЛАР" alohida ro'yxat beradi.
- **Manba:** kitob (А смена План: ЗАРУР ЗАКАЗЛАР) + v2-A
- **Dalil (kod):** `machine_tasks.priority` ustuni sxemada tasdiqlandi; `SELECT count(*) FROM machine_tasks WHERE priority IS NOT NULL` → **0** (jadval butunlay bo'sh).
- **Nima yetishmaydi:** prioritet ustuni bor, lekin 0 qator — jonli navbat qayta-tartiblash ham, shoshilinch signal ham tekshirib bo'lmaydi.
- **Bog'liqlik:** EP-MES-041/067 (`machine_tasks` ma'lumoti), PP prioritet
- **action:** UPDATE
- **⤳ Ta'sir:** Muddat saqlanishi, EP-MES-041 (navbat), PP prioritet
- **Xoch-havolalar:** `[Module-08] Item 118` · `EXTRACTION QISM C 08.68` · `TASDIQ-2146 §08 #68` · `EXTRACTION QISM A #21` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-069 · Bitta buyurtmaning mashinalararo marshrutini kuzatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — buyurtma marshruti (qaysi mashina/bosqich/qancha tayyor) jonli. Forma ketma-ketlik beradi: Печать → Ламинация → Высечка → Тигель → ФСМ → Степлер → Упаковка. Kitob: "ярим тайёр маҳсулотни ... участкага етказиб берди".
- **Manba:** kitob (А смена План marshrut + ярим тайёр logistika) + v2-A
- **Dalil (kod):** `SELECT count(*)` → `pp_routing` = 0, `routing_operations` = 0, `routings` = 0, `pp_routing_operations` = 0 — topilgan har bir marshrut jadvali bo'sh. `mes_papka_orders` da `routing_id` ustuni bor, lekin `stage`/jonli-pozitsiya ustuni yo'q va o'zi 0 qator.
- **Nima yetishmaydi:** marshrut jadvallari tuzilmaviy mavjud (hatto to'rttasi — dublikat xavfi), lekin hammasi bo'sh; MES-tomon jonli bosqich-pozitsiyasi ustuni yo'q.
- **Bog'liqlik:** EP-MES-039 (marshrut uchun haqiqiy mashinalar kerak); EP-MES-070 (WIP)
- **action:** READ
- **⤳ Ta'sir:** PP routing ↔ MES bosqich ↔ buyurtma holati, EP-MES-070
- **Xoch-havolalar:** `[Module-08] Item 119` · `EXTRACTION QISM C 08.69` · `TASDIQ-2146 §08 #69`
- **⚠️ ZIDDIYAT:** to'rtta parallel marshrut jadvali (`pp_routing`, `pp_routing_operations`, `routing_operations`, `routings`) — kanonik jadval e'lon qilinmagan (STANDARTLAR §15 dublikat qoidasi buzilishi).
- **Δ 2026-07-11→08-07:** —

### EP-MES-070 · Bosqichlararo yarim tayyor qoldiqni (bottleneck) ko'rsatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har bosqich oraliq qoldig'i (kutayotgan yarim tayyor) ko'rsatiladi → bottleneck ko'rinadi. Kitob: ichki logistika yarim tayyorni o'z vaqtida yetkazsa dastgoh to'xtamaydi.
- **Manba:** v2-A + kitob (ярим тайёр/ички логистика) + EP-MES-069
- **Dalil (kod):** `production-agent.service.ts:139-145` — `detectBottleneck()` real: `SELECT machine_id, COUNT(*) FROM production_operations WHERE status='pending' GROUP BY machine_id ORDER BY queue DESC LIMIT 1` — lekin bitta eng sekin mashinani qaytaradi, butun quvur bo'ylab per-bosqich WIP taqsimotini emas.
- **Nima yetishmaydi:** per-bosqich (bosqichlararo) yarim-tayyor qoldiq ko'rinishi — vizyon so'ragandan tor qamrov.
- **Bog'liqlik:** EP-MES-069 (marshrut), PP (bottleneck signali — vision-1000 #20), WMS (yarim tayyor)
- **action:** READ
- **⤳ Ta'sir:** Bottleneck ko'rinishi, WMS (yarim tayyor), ichki logistika
- **Xoch-havolalar:** `[Module-08] Item 120` · `EXTRACTION QISM C 08.70` · `TASDIQ-2146 §08 #70` · `EXTRACTION QISM A #20`
- **Δ 2026-07-11→08-07:** —

### EP-MES-071 · Tanaffus markerini (УЖИН/ОБЕД/ТУШЛИК/ПОЛДНИК) jadvalda avto-ko'rsatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — tanaffus markerlari jadvalda avto-ko'rinadi + normadan chegiriladi (EP-MES-049/050 bilan). Forma vaqt jadvalida "УЖИН/ОБЕД/Тушлик/ПОЛДНИК" markerlarini beradi.
- **Manba:** kitob (А смена План tanaffus markerlari + Кун тартиби) + v2-A
- **Dalil (kod):** EP-MES-049/050/051 bilan bir xil salbiy grep (`namoz|tushlik|lunch|prayer` → faqat README) — bu o'tishda ko'rilgan jadval/vaqt-panjara kodida tanaffus-marker render mexanizmi topilmadi.
- **Nima yetishmaydi:** EP-MES-049 hisoblagan tanaffus oynalarini FE jadval panjarasida marker sifatida ko'rsatish.
- **Bog'liqlik:** EP-MES-049 avval kerak; EP-MES-050/051
- **action:** READ
- **⤳ Ta'sir:** Norma + jonli kuzatuv tanaffusni hisobga oladi, EP-MES-049/050
- **Xoch-havolalar:** `[Module-08] Item 121` · `EXTRACTION QISM C 08.71` · `TASDIQ-2146 §08 #71`
- **Δ 2026-07-11→08-07:** —

### EP-MES-072 · Soatlik normaning aniq pog'onalarini saqlash (400/500/600/1000/1500...)
- **Qaror holati:** ✅ JAVOBLANGAN *(sub-savol "murakkablikni kim belgilaydi" 🔵 A-default: texnolog texkartada)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — norma mahsulot/murakkablik bo'yicha pog'onali (mashina × ish turi). Forma "1 соатлик норма" 400-3000 oralig'ida beradi; oddiy korobka 1500, murakkab 400. Sub-savol (murakkablikni kim belgilaydi): 🔵 A-default = texnolog texkartada (EP-MES-007 yagona manba bilan mos).
- **Manba:** kitob (А смена План: pog'onali norma) + v2-A
- **Dalil (kod):** EP-MES-034 bilan bir xil topilma — "%norm%" ga mos yagona jadval `material_norms` (material-sarf BOM normasi, 0 qator, stansiya/tezlik-pog'ona ustunlarisiz); butun sxemada pog'onali-tezlik jadvali yo'q.
- **Nima yetishmaydi:** mashina×ish-turi → tezlik pog'onasi (400/500/.../3000) jadvali — EP-MES-034 dagi per-stansiya norma jadvalining bir qismi sifatida; haqiqiy raqamlar egasi-data.
- **Bog'liqlik:** EP-MES-034 (umumiy norma-jadval qurilishi), EP-MES-007 (texkarta = murakkablik manbai), EP-MES-077
- **action:** CREATE
- **⤳ Ta'sir:** Adolatli baho, EP-MES-007 (texkarta), EP-MES-034 (norma baza)
- **Xoch-havolalar:** `[Module-08] Item 122` · `EXTRACTION QISM C 08.72` · `TASDIQ-2146 §08 #72`
- **Δ 2026-07-11→08-07:** —

### EP-MES-073 · Brak%ni stansiya bo'yicha normalash ("брак %")
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mashinaga maqbul brak% + oshganda signal. Станоклар норма har stansiyaga "брак %" beradi; kesimda 1%, lakda 5% bo'lishi mumkin.
- **Manba:** kitob (Станоклар норма: брак %) + v2-A
- **Dalil (kod):** bu o'tishda `apps/api/src/modules/mes` da per-stansiya defekt-foizi chegara jadvali ham, signal-trigger kodi ham topilmadi; `production_sessions.defect_quantity` xom ma'lumot sifatida bor, lekin hech narsa per-stansiya brak% ni sozlangan shift bilan taqqoslamaydi.
- **Nima yetishmaydi:** per-stansiya brak%-chegara jadvali + sessiya-yopishda tekshiruv va signal; chegara qiymatlari egasi-data (`business_settings` orqali CRUD).
- **Bog'liqlik:** EP-MES-039 (per-stansiya identifikatsiya) avval kerak; EP-MES-022/060, EP-MES-015 (target naqshi)
- **action:** CREATE
- **⤳ Ta'sir:** Adolatli sifat nazorati, QC, EP-MES-022/060
- **Xoch-havolalar:** `[Module-08] Item 123` · `EXTRACTION QISM C 08.73` · `TASDIQ-2146 §08 #73`
- **Δ 2026-07-11→08-07:** —

### EP-MES-074 · "ко-во работ" (bir smenada nechta turli ish) ko'rsatkichi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — smenada ish soni + har biriga sozlash vaqti (sozlash yo'qotishini ko'rsatadi). Станоклар норма "ко-во работ" beradi; ko'p mayda ish = ko'p changeover.
- **Manba:** kitob (Станоклар норма: ко-во работ) + v2-A + EP-MES-048 (sozlash)
- **Dalil (kod):** `mes_downtime_reasons` da `DT-CHANGEOVER` ("Mahsulot almashinuvi (changeover)", `category=setup`, `is_planned=true`) bor (16-qatorli dumpda tasdiqlangan), lekin MES modulining hech qayerida smena-darajali "количество работ" (turli-ish soni) metrikasi yoki agregat changeover-vaqt KPI'si topilmadi.
- **Nima yetishmaydi:** smena-darajali agregat (`COUNT(DISTINCT production_order_id)` + `SUM(duration) WHERE reason_code='DT-CHANGEOVER'`) — yangi jadval kerak emas, hisobot qatlami bo'shlig'i.
- **Bog'liqlik:** EP-MES-048 (sozlash bosqichi), EP-MES-011 (kod bor)
- **action:** READ
- **⤳ Ta'sir:** Sozlash yo'qotishi tahlili, EP-MES-048, OEE
- **Xoch-havolalar:** `[Module-08] Item 124` · `EXTRACTION QISM C 08.74` · `TASDIQ-2146 §08 #74`
- **Δ 2026-07-11→08-07:** —

### EP-MES-075 · "переделка" qayta ishlash sabab izohi (kitob izoh madaniyati)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — переделка alohida yo'qotish turi sifatida (EP-MES-046 bilan birga), sabab izohi bilan. Kitob izoh madaniyati: har yo'qotishga sabab yozilgan.
- **Manba:** kitob (Станоклар норма izohlari) + v2 (EP-MES-046 davomi)
- **Dalil (kod):** `iot-tablet.schemas.ts:163-176` — `DowntimeEventSchema.notes` = `z.string().max(2000).optional()`: umumiy izoh maydoni bor, lekin **ixtiyoriy** va `DT-QUAL-REWORK` kodiga xoslashtirilmagan; `downtime_events.notes`/`reason_description` DB'da ham bor.
- **Nima yetishmaydi:** aynan переделка kodi tanlanganda izohni **majburiy** qiladigan majburlash yo'q.
- **Bog'liqlik:** EP-MES-046 (kod mavjud), EP-MES-077 (majburiy sabab naqshi)
- **action:** CREATE
- **⤳ Ta'sir:** EP-MES-046 (qayta ishlash), EP-MES-077 (majburiy sabab)
- **Xoch-havolalar:** `[Module-08] Item 125` · `EXTRACTION QISM C 08.75` · `TASDIQ-2146 §08 #75`
- **⚠️ ZIDDIYAT:** QISM C 08.75 "переделка kodi+izoh **yo'q**" vs jonli DB "kod bor (`DT-QUAL-REWORK`) + `notes` maydoni bor, faqat majburiy emas" → QISM C satri qisman eskirgan (EP-MES-046 STALE-DOC bilan bir ildiz).
- **Δ 2026-07-11→08-07:** —

### EP-MES-076 · Qolib kechikishi sabab kodi (kitob izohi davomi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — "qolib/forma tayyor emas" takrorlanuvchi sabab → KB bo'limiga signal (EP-MES-047 bilan birga). Kitob 4-soatlik takror yo'qotishni beradi.
- **Manba:** kitob (Станоклар норма: qolib kechikishi) + v2 (EP-MES-047 davomi)
- **Dalil (kod):** 2026-07-11: EP-MES-047 bilan bir xil 16-kodli dump — qolib/mold kodi yo'q edi, demak uning ustiga takror-hisoblagich yoki KB-signal ham qurilmagan. **Δ:** `DT-MOLD` kodi seed qilindi (`a7a5fb04`) — ya'ni old shart yopildi.
- **Nima yetishmaydi:** takror-hodisa agregati ("bir mashina + DT-MOLD 7 kunda 3× → KB'ga signal") va KB manzili (qaysi jamoa/rol qabul qiladi — egasi-data).
- **Bog'liqlik:** EP-MES-047 (kod, endi mavjud); EP-MES-011
- **action:** CREATE
- **⤳ Ta'sir:** KB/konstruktor signal, EP-MES-047, takror-sabab tahlili
- **Xoch-havolalar:** `[Module-08] Item 126` · `EXTRACTION QISM C 08.76` · `TASDIQ-2146 §08 #76`
- **Δ 2026-07-11→08-07:** `a7a5fb04` — `DT-MOLD` old sharti qurildi; takror-tahlil + KB-signal hamon yo'q → status **Yo'q**.

### EP-MES-077 · Norma bajarilmasa MAJBURIY sabab so'rash (kitobdagi izoh madaniyati)
- **Qaror holati:** ✅ JAVOBLANGAN *(sub-savol "kim tasdiqlaydi" 🔵 A-default: usta tasdiqlaydi, НО ko'radi)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — norma < chegara bo'lsa sabab majburiy (tayyor ro'yxat + izoh). Kitob smena-xulosa oргполитikasi: har bajarilmaslik sabab bilan yozilishi shart, og'zaki rad etiladi. Sub-savol (kim tasdiqlaydi): 🔵 A-default = usta tasdiqlaydi (NO-mas'ul ko'radi — EP-MES-081).
- **Manba:** kitob (smena-reja-nazorat oргполитика: majburiy sabab) + v2-A
- **Dalil (kod):** per-stansiya ishlab-chiqarish-normasi jadvali mavjud emas (EP-MES-034 da tasdiqlangan — faqat `material_norms`, boshqa tushuncha, 0 qator), demak "norma<chegara" darvozasi baholanadigan chegara qiymatining o'zi yo'q.
- **Nima yetishmaydi:** sessiya-yopishda `actual_rate < norm_rate` bo'lsa sabab maydonini talab qiluvchi validatsiya — EP-MES-034 normasi haqiqiy ma'lumot bilan to'lgach.
- **Bog'liqlik:** EP-MES-034 (norma jadvali + data) to'liq bloklaydi; EP-MES-025 (farq%), EP-MES-081 (kim ko'radi)
- **action:** UPDATE
- **⤳ Ta'sir:** Adolatli baho + takror muammo, EP-MES-010/011, EP-MES-079
- **Xoch-havolalar:** `[Module-08] Item 127` · `EXTRACTION QISM C 08.77` · `TASDIQ-2146 §08 #77` · `EXTRACTION QISM A #40` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-MES-078 · Mashina remonti ("ремонтда") ni ishonchlilik hisobi bilan
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — "remont" alohida tur (rejali/avariya) + mashina ishonchliligi hisobi → profilaktikaga asos. Kitob izohi "ремонтда"; qaysi mashina ko'p buziladi ko'rinishi kerak.
- **Manba:** kitob (Станоклар норма izohi: ремонтда) + v2-A
- **Dalil (kod):** `mes_downtime_reasons` da `DT-MAINT` (`category=maintenance, is_planned=true`) va nosozlik-toifasidagi kodlar (`DT-MECH`, `DT-ELECT`, `DT-HYDR`, `DT-SENSOR` — barchasi `is_planned=false`) 16-qatorli dumpda tasdiqlangan. `SELECT count(*) FROM mes_maintenance_requests` → **0**. `Grep "MTBF|mean.?time.?between" path=apps/api/src/modules -i` → butun backendda fayl topilmadi. **Δ:** `RecordDowntimeHandler` endi `MesBreakdownEvent` chiqaradi va `mes-breakdown-kanban.handler.ts` avariyadan Kanban kartasini avto-yaratadi (`5093fe43`).
- **Nima yetishmaydi:** rejali/avariya ajratmasi tuzilmaviy mavjud, lekin `mes_maintenance_requests` bo'sh va MTBF (o'rtacha nosozliklararo vaqt) hisobi butun kod-bazada yo'q; qo'lda yaratilgan texxizmat so'rovi Kanban'ga tegmaydi.
- **Bog'liqlik:** EP-MES-011 (kodlar), IoT/aktiv PM jadvali, Kanban
- **action:** CREATE
- **⤳ Ta'sir:** Profilaktika rejasi, downtime kodlar (EP-MES-011), IoT/aktiv
- **Xoch-havolalar:** `[Module-08] Item 128` · `EXTRACTION QISM C 08.78` · `TASDIQ-2146 §08 #78` · `EXTRACTION QISM A #37` · `QISM D VERIFY #37`
- **Δ 2026-07-11→08-07:** `5093fe43` — avariya (`category='breakdown'`) downtime'idan Kanban kartasi avto-ochiladi (vision-1000 #37 ning Kanban qismi yopildi); texnik auto-biriktirish va MTBF hamon yo'q.

### EP-MES-079 · AI kunlik smena xulosasi (kitobdagi sabab izohlaridan)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — AI kunlik xulosa (top yo'qotish + brigada reytingi + takror sabab + tavsiya). Kitob smena-xulosa oргполитikasi aynan shu maqsadda; 460 javob AI kunlik hisobotni talab qiladi; egasi har Excel'ni o'qiy olmaydi.
- **Manba:** kitob (smena-xulosa oргполитика + Совершенствование tahlil) + BARCHA_JAVOBLAR (AI kunlik) + v2-A
- **Dalil (kod):** `production-agent.service.ts:148-154` — `generateShiftReport(shiftId)` `SELECT SUM(qty), SUM(defect_qty) FROM production_facts WHERE shift_id=...` ni bajaradi, `this.audit.wrap()` ichida: sof SQL agregat. Faylning o'z docstring'i (18-26) ochiq yozadi: "no LLM involved... deterministic SQL". `llm|generateNarrative|openai|anthropic|claude` grepi moslik bermaydi.
- **Nima yetishmaydi:** LLM-narrativ xulosa (top yo'qotish + brigada reytingi + takror sabab + tavsiya) — **tasdiqlangan yo'qlik**, faylning o'z dizayn-izohi bilan; QISM D (VERIFY #27) rol-darajali proeksiya (direktor qisqa / НО o'rta / smenaboshchi to'liq) ham yo'qligini tasdiqlaydi.
- **Bog'liqlik:** EP-MES-028 (AI nazoratchi), EP-MES-023 (handover), AI moduli (kalit/limit — egasi-data)
- **action:** AI
- **⤳ Ta'sir:** AI nazoratchi ↔ egaga kunlik hisobot ↔ org-baholash, EP-MES-028
- **Xoch-havolalar:** `[Module-08] Item 129` · `EXTRACTION QISM C 08.79` · `TASDIQ-2146 §08 #79` · `EXTRACTION QISM A #7/#27` · `QISM D VERIFY #7/#27`
- **Δ 2026-07-11→08-07:** —

### EP-MES-080 · IoT'siz, faqat operator kiritishi bilan ishga tushirish (Excel → MES)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — to'liq qo'lda kiritish (sensor shart emas) + keyin IoT qo'shilsa avtomatik. Zavodda hozir IoT sensor yo'q, hamma ma'lumot qo'lda Excel'ga; qo'lda ishlaydigan qilib qurilsa darhol foydalanish boshlanadi.
- **Manba:** BARCHA_JAVOBLAR (IoT yo'q, Excel) + v2-A
- **Dalil (kod):** `iot-tablet.controller.ts` — real, DB-backed endpointlar bevosita o'qish bilan tasdiqlandi: `POST tablet/login` (187), `POST tablet/sessions` (160, `autoSeedChecklist()` bilan), `POST tablet/sos-alert` (217), `POST tablet/handover` (237, real `INSERT INTO shift_handovers`), `PATCH tablet/handover/:id/accept` (278, real `UPDATE`), shuningdek downtime/crew/material-kit-scan endpointlari. Faylning header docstring'i (5-9): barchasi haqiqiy DB jadvallariga ulangan. **Δ:** ⭐ `iot-tablet.controller.ts:616-633` — tablet start yo'liga material-akt 2-imzo darvozasi INLINE qo'shildi (`f318bbfe`); `useIoTTablet.ts` 9 mutatsiyada `res.ok` tekshiruvi (`0f303945`, `7f4d7b6d`); `persistKitItemScan` endi `UPDATE...RETURNING` 0 qator bo'lsa `NotFoundException` beradi.
- **Bog'liqlik:** EP-MES-002 (qo'lda bosqich), EP-MES-013/017, EP-MES-030 (checklist darvozasi)
- **action:** CREATE
- **⤳ Ta'sir:** Bugundan ishlash, EP-MES-002 (qo'lda bosqich), EP-MES-013/017
- **Xoch-havolalar:** `[Module-08] Item 130` · `EXTRACTION QISM C 08.80` · `TASDIQ-2146 §08 #80` · `EXTRACTION QISM A #18/#38/#49` · `QISM D VERIFY #49`
- **Δ 2026-07-11→08-07:** ⭐ `f318bbfe` — 2026-08-06 auditining eng jiddiy topilmasi yopildi: FE chaqiradigan **yagona** start yo'li (`POST /iot/production-sessions/:id/start`) `checkMaterialActSignatures` ni umuman chaqirmasdi (darvoza hech chaqirilmaydigan `POST /mes/sessions/:id/start` da yashardi) — endi tablet marshruti ham 422 BLOCKED beradi (to'plamsiz buyurtma = NULL-pass). Shuningdek `PATCH /warehouse/material-kits/:id/status` erkin-matnli statusni qabul qilardi va `confirmed_by` yozmasdi (bitta aktyor o'zi "confirmed" qila olardi) → status lug'ati `material_kits_status_chk` bilan cheklandi, har bosqich aktyorini muhrlaydi, tayyorlovchi o'z to'plamini tasdiqlay olmaydi; FE `WarehouseDailyView` DB CHECK taqiqlagan `'preparing'/'ready'` qiymatlarini yuborardi va Confirm tugmasi umuman yo'q edi → zanjir `pending→prepared→delivered→confirmed` ga to'g'rilandi. `7f4d7b6d` — tablet FE 7 mutatsiyada backend xatosini yutardi (eng og'iri: chek-list 422 sini yashirib "boshlandi" deb ko'rsatish). `0f303945` — material-skan yashil-yolg'oni FE+BE ikkalasida.

### EP-MES-081 · НО 12-1 / НО 12-2 mas'ulini (Юсупов/Махмудов) hisobotга biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har bo'lim hisobotiga НО-mas'ul (lavozim kartasi) biriktiriladi → javobgarlik + eskalatsiya. Станоклар норма mas'ullar beradi (НО 12-2: Юсупов, НО 12-1: Махмудов).
- **Manba:** kitob (Станоклар норма: НО-mas'ullar) + Q132/Q133 (smena roli orgsxemadan) + v2-A
- **Dalil (kod):** 2026-07-11: `Grep "НО|department_head|bo.?lim.*mas.?ul" path=apps/api/src/modules/mes -i` → fayl topilmadi (EP-MES-038 bilan bir xil salbiy natija). **Δ:** `mes-shifts-stats.service.ts`/`.repo.ts`/`.controller.ts` — `getCurrentShift`/`getOee`/`getMaintenance`/`getWorkCenterNorms` endi ko'ruvchining bo'limini `employee_org_departments` dan jonli aniqlaydi va sex-darajali rollarni shunga cheklaydi; boshqaruv/tizim rollari cheklanmaydi; bo'limi yo'q foydalanuvchi **fail-closed** (bo'sh natija) (`647730be`).
- **Nima yetishmaydi:** hisobot **egasini** (НО-mas'ul lavozim kartasi) biriktiruvchi jadval hamon yo'q — faqat ko'rish-scope'i qurildi; `work_center`/`equipment` FK yo'li bo'lmagan endpointlar (`getShifts`, `getPapkaOrders`, `getStats`) scope'siz qoldi (kommitning o'zi buni ochiq bo'shliq deb belgilagan); kim НО 12-1/12-2 — egasi-data.
- **Bog'liqlik:** EP-MES-038 (bo'lim ajratish) avval kerak; EP-MES-064 (imzo), EP-MES-009 (eskalatsiya)
- **action:** APPROVE
- **⤳ Ta'sir:** Org-struktura (НО lavozimlari) ↔ MES hisobot egasi, EP-MES-038/064
- **Xoch-havolalar:** `[Module-08] Item 131` · `EXTRACTION QISM C 08.81` · `TASDIQ-2146 §08 #81` · `EXTRACTION QISM A #35/#48` · `QISM D VERIFY #35/#48`
- **Δ 2026-07-11→08-07:** `647730be` — smena/OEE/texxizmat/norma endpointlarida bo'lim-scope RBAC (vision-1000 #35). Status Yo'q → **Qisman**.

### EP-MES-082 · Tasdiqlangan o'lchov birligini master-data qilish ("ед.изм" RD-4 + direktor)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — stansiya × tasdiqlangan birlik master-data (РД-4 + direktor). Birlik har joyda bir xil (norma/sarf/hisobot bir tilda); Станоклар норма "ед.изм" tasdiq bilan beradi.
- **Manba:** kitob (Станоклар норма: ед.изм + РД-4/direktor imzo) + v2-A + EP-MES-035/055
- **Dalil (kod):** `unit_of_measures` ustunlari: `id, code, name, name_ru, category, base_unit_id, conversion_factor, is_active` — generik birlik-konvertatsiya master jadvali, stansiya/jihoz bilan bog'lovchi biror ustunsiz (EP-MES-035 uchun ishlatilgan bir xil topilma).
- **Nima yetishmaydi:** EP-MES-035 bilan bir xil tuzatish (stansiya×birlik junction yoki `equipment.default_unit_id` FK) + ustiga РД-4/direktor tasdiq bosqichi (EP-MES-055 naqshi); qaysi birlik qaysi mashinaga — egasi-data.
- **Bog'liqlik:** EP-MES-035 (bir xil ildiz), EP-MES-055 (tasdiq zanjiri), EP-MES-039 (jihoz katalogi)
- **action:** CREATE
- **⤳ Ta'sir:** Yagona o'lchov tili, EP-MES-035 (stansiya birligi), EP-MES-055 (tasdiq)
- **Xoch-havolalar:** `[Module-08] Item 132` · `EXTRACTION QISM C 08.82` · `TASDIQ-2146 §08 #82`
- **⚠️ ZIDDIYAT:** EP-MES-035 va EP-MES-082 aynan bir xil sxema-bo'shlig'ini ikki marta so'raydi (FULL-ITEM-LEVEL Item 132 o'zi "duplicate of Item 85's underlying gap" deb yozadi) — bitta qurilish ikkalasini yopadi, lekin registrda ikkita alohida band bo'lib qoladi.
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-realizatsiya bo'shliqlari (VR-MES-I01..I15)

> Bu bandlar `decisions/08-mes.md` da EP-kod olmagan, lekin `vision-1000-answers/08-mes.md`
> (= `FULL-ITEM-LEVEL Item 1..50` = `EXTRACTION QISM A`) da mustaqil talab sifatida turgan
> vizyon elementlari. Ular I QISM bandlariga bog'lanadi, lekin ularning birortasi bilan
> to'liq qoplanmaydi — shuning uchun alohida raqamlanadi.

### VR-MES-I01 · Tugallanmagan sessiya avto-"to'xtatilgan" holatiga tushishi
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #2)*
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Tugallanmagan sessiya avtomatik "to'xtatilgan" statusiga tushadi; keyingi smena operatori uni davom ettira oladi, lekin handover (EP-MES-023) tasdiqlangan bo'lishi shart.
- **Dalil (kod):** `shift_handovers` = 0 qator; `handed_over_by`/`received_by`/`signature_data`/`status` ustunlari bor. Tugallanmagan sessiyani avto-to'xtatuvchi logika bu jadvalga ulanмаган holda topilmadi.
- **Nima yetishmaydi:** avto-suspend cron/handler; "davom ettirish faqat handover tasdiqlangach" darvozasi.
- **Bog'liqlik:** EP-MES-023 (handover), EP-MES-001 (bosqich modeli)
- **Xoch-havolalar:** `[Module-08] Item 2` · `EXTRACTION QISM A #2`

### VR-MES-I02 · Miqdor tuzatish + WMS'ga real-time og'ish eventi (muammo bayrog'i)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #11 + #22)*
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Operator tasdiqdan oldin miqdorni o'zgartira oladi, sabab majburiy; og'ish WMS'ga real-time event bilan uzatiladi. "Sabab=material" tanlansa WMS'da "muammo bayrog'i" avto-qo'yiladi + MM ta'minot bo'limiga event.
- **Dalil (kod):** 2026-07-11: `mes/infrastructure/event-handlers/` da faqat `pp-released-mes.listener.ts` va `sos-alert-raised-mes.listener.ts` — WMS'ga qaragan listener yo'q edi. **Δ:** `2066f70b` MES→WMS chegirma + `WmsGoodsIssuedEvent` yo'lini ochdi.
- **Nima yetishmaydi:** miqdor-tuzatish (tasdiqdan oldin) uchun alohida event, majburiy sabab, WMS "muammo bayrog'i" va MM signali — hech biri qurilmagan.
- **Bog'liqlik:** EP-MES-006 (Δ bilan qisman yopildi), EP-MES-065, WMS/MM
- **Xoch-havolalar:** `[Module-08] Item 11` · `[Module-08] Item 22` · `EXTRACTION QISM A #11/#22`

### VR-MES-I03 · Boshlangan sessiyaga reja retro-kiritilmasligi + audit-log versiyalash
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #17)*
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Allaqachon boshlangan sessiyaga reja retro-kiritilmaydi; yangi miqdor/vaqt faqat keyingi sessiyaga ta'sir qiladi; o'zgarish audit-log'da versiyalanib saqlanadi.
- **Dalil (kod):** 2026-07-11: `material_norms` da versiya/effective-date ustuni yo'q; `technology_cards.version` hujjat-versiyasi, per-sessiya norma-versiyalash mexanizmi emas. **Δ:** `48f85a82` sessiya-boshlashda `production_sessions.norma_version` snapshot'ini kiritdi (EP-MES-056).
- **Nima yetishmaydi:** retro-yozuvni bloklovchi majburlash va o'zgarishlarni versiyalaydigan audit-log.
- **Bog'liqlik:** EP-MES-056 (snapshot), EP-MES-034 (norma jadvali)
- **Xoch-havolalar:** `[Module-08] Item 17` · `[Module-08] Item 4` · `EXTRACTION QISM A #4/#17`

### VR-MES-I04 · Har bosqich natijasini O'Z bo'limiga GSD sifatida yozish
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #19 + #14)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Har bosqich o'z bo'limiga GSD yozadi (Flekso bosqichi → Flekso, Upakovka → Upakovka); yakuniy bosqich to'liq GSD olmaydi. Shogird braki ustoz kartasiga ta'sir qilmaydi.
- **Dalil (kod):** MES modulida `machine_crews` qatorlarini org-karta baholashiga bog'laydigan `card_id`/GSD-yozish yo'li topilmadi (`SB0300/SB0434` STILL-OPEN); `operator_daily_stats` 0 qator.
- **Nima yetishmaydi:** MES→karta GSD yozish yo'li (modulning Step-3 ochiq savoli); bosqich→bo'lim xaritasi (EP-MES-038 ga bog'liq).
- **Bog'liqlik:** EP-MES-019, EP-MES-038, EP-MES-053
- **Xoch-havolalar:** `[Module-08] Item 14` · `[Module-08] Item 19` · `EXTRACTION QISM A #14/#19`

### VR-MES-I05 · Qayta ishlangan mahsulot = "to'g'rilangan sof" + GL da alohida tannarx moddasi
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #25)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Qayta ishlangan mahsulot "to'g'rilangan sof mahsulot" sifatida hisoblanadi (brak emas); GL'da qayta ishlash narxi (qo'shimcha mehnat + material) alohida tannarx moddasiga yoziladi.
- **Dalil (kod):** QISM D (VERIFY #25): MES modulida rework-toifasi/GL-moddasi YO'Q (`grep rework mes/` → 0); `qc-rework.listener.ts` PP tarafida, MES sarf/completion'da rework-kategoriya yozuvi yo'q.
- **Nima yetishmaydi:** rework kategoriyasi + GL hisob-raqami (qaysi hisobga yozilishi — egasi-data).
- **Bog'liqlik:** EP-MES-046/075 (переделка kodi), EP-MES-060 (sof), FIN/GL
- **Xoch-havolalar:** `[Module-08] Item 25` · `EXTRACTION QISM A #25` · `QISM D VERIFY #25`

### VR-MES-I06 · Boshqa mashinada bajarish ruxsati (Tigel-3 → Tigel-5) + texkarta taqqos + audit
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #26)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** PP "Tigel-3" bergan ishni Tigel-5 da bajarish bo'lim boshlig'i / НО-mas'ul ruxsati bilan; ruxsat texkarta (EP-MES-007) bilan taqqoslanadi va audit-log'ga tushadi.
- **Dalil (kod):** QISM D (VERIFY #26): MES'da mashina-almashtirish ruxsat-gate / texkarta-taqqos / audit YO'Q (`grep machine-swap|permitted-machine mes/` → 0); `pos-techcard-gate` POS tarafida, MES sessiyaga bog'lanmagan.
- **Nima yetishmaydi:** ruxsat darvozasi + audit yozuvi; EP-MES-054 matritsasi va EP-MES-039 katalogi bilan bir ildiz.
- **Bog'liqlik:** EP-MES-039/040/054, EP-MES-007
- **Xoch-havolalar:** `[Module-08] Item 26` · `EXTRACTION QISM A #26` · `QISM D VERIFY #26`

### VR-MES-I07 · IoT sensorsiz energiya hisobi (pasport kVt × ish soati)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #28)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** IoT sensor o'rnatilmagan mashinalar uchun energiya sarfi texnik pasportdagi quvvat (kVt) × ish soati formulasi bilan hisoblanadi; sex umumiy schyotchikdan proportsional emas.
- **Dalil (kod):** SB0384 STILL-OPEN — real-time avto-to'ldirish (energy/downtime) tugallanmagan, IoT-data bo'sh (RECONCILIATION #857); formula/hisob ilovada yo'q.
- **Nima yetishmaydi:** `equipment` ga pasport-quvvat (kVt) maydoni + sessiya soatiga ko'paytiruvchi hisob; pasport qiymatlari egasi-data (EP-MES-039 katalogi bilan birga keladi).
- **Bog'liqlik:** EP-MES-039 (mashina katalogi), IoT moduli, FIN (energiya tannarxi)
- **Xoch-havolalar:** `[Module-08] Item 28` · `EXTRACTION QISM A #28`

### VR-MES-I08 · Oflayn ma'lumot timestamp-sync + konflikt-review navbati
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #38)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Oflayn kiritilgan ma'lumotlar internet qaytganda timestamp bo'yicha ketma-ket kiritiladi; parallel kiritilgan bir xil partiyaga tegishli operatsiyalar conflict-review navbatiga tushadi (audit-log 7 yil).
- **Dalil (kod):** QISM D (VERIFY #38): faqat online/offline UI-badge bor (`IoTProductionDashboardSections.tsx:323`); timestamp-sync navbati / konflikt-review queue YO'Q (`grep offline.?sync|conflict.?review mes/iot` → 0).
- **Nima yetishmaydi:** oflayn navbat + konflikt-review oqimi; 7 yillik audit saqlash siyosati.
- **Bog'liqlik:** EP-MES-080 (tablet oqimi), EP-MES-013
- **Xoch-havolalar:** `[Module-08] Item 38` · `EXTRACTION QISM A #38` · `QISM D VERIFY #38`

### VR-MES-I09 · Smena reja-formasi PDF versiyalanishi va arxivlanishi (immutable)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #39)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Smena reja-formasi PDF versiyalanib saqlanadi; smena o'rtasida reja o'zgarsa yangi PDF chop qilinadi, eski versiya arxivlanadi (immutable hujjat — F5).
- **Dalil (kod):** QISM D (VERIFY #39): MES smena-reja PDF generatsiyasi YO'Q (`grep pdf mes/` → 0); PDF servislari faqat POS/SD/Finance'da.
- **Nima yetishmaydi:** reja-forma (EP-MES-031/063) avval qurilishi, keyin PDF versiyalash/arxiv.
- **Bog'liqlik:** EP-MES-031, EP-MES-063, EP-MES-064
- **Xoch-havolalar:** `[Module-08] Item 39` · `EXTRACTION QISM A #39` · `QISM D VERIFY #39`

### VR-MES-I10 · Sessiya yakunida MES → QC final gate event-driven push
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #41)*
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** MES sessiya yakunida event chiqaradi → QC final inspection gate (EP-QC-008) ga BullMQ orqali push; trigger MES eventi (QC cron emas, real-time event-driven).
- **Dalil (kod):** SB0282/SB0286 — MES→QC ulanish jonli (`qc_inspections` = 4 qator, real yoziladi), lekin **raw INSERT** orqali; `QcPassedEvent` keyingi QC qadamida (RECONCILIATION #276/280).
- **Nima yetishmaydi:** event-driven BullMQ push (raw INSERT o'rniga domen eventi); QC final-gate bilan aniq shartnoma.
- **Bog'liqlik:** EP-MES-022 (brak), QC moduli (EP-QC-008), EVENT_KATALOGI
- **Xoch-havolalar:** `[Module-08] Item 41` · `EXTRACTION QISM A #6/#41`

### VR-MES-I11 · `mes_sessions` → `production_sessions` to'liq migratsiya (VIEW emas)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #43 — egasi ruxsati Q-35 kutilmoqda)*
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Eski `mes_sessions` tarixiy ma'lumotlari `production_sessions` ga to'liq migratsiya qilinadi (VIEW emas); migratsiya tranzaktsion + test-run bilan, OEE hisobotlari buzilmasin.
- **Dalil (kod):** SB0355/319/335 RESOLVED — `mes_production_sessions` allaqachon **VIEW** (`relkind=v`) `production_sessions` (`r`) ustida → bitta kanonik jadval (RECONCILIATION #464/1270). `5bf6e6fd` shu VIEW'ni `CREATE OR REPLACE` bilan kengaytirgan (additive naqsh).
- **Nima yetishmaydi:** "ikki-dunyo" ramkasi hal bo'lgan, lekin egasining to'liq-migratsiya ruxsati (Q-35) hamon ochiq — VIEW qoldirish yoki fizik ko'chirish qarori.
- **Bog'liqlik:** EP-MES-001..082 ning hammasi shu jadvalga tayanadi; ADR/STANDARTLAR kanonik jadval qoidasi
- **Xoch-havolalar:** `[Module-08] Item 43` · `EXTRACTION QISM A #43`

### VR-MES-I12 · AI kamera to'xtashini MES downtime'i bilan solishtirish (nomoslik anomaliyasi)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #45)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** AI kamera 20 daqiqa to'xtashni aniqlasa, lekin MES'da downtime kiritilmagan bo'lsa — AI buni anomaliya deb belgilaydi va usta/bo'lim boshlig'iga signal yuboradi; inson tasdig'igacha "tekshirilmagan to'xtash" alohida saqlanadi (avto-jarima yo'q — E1).
- **Dalil (kod):** SB0344/SB0444 STILL-OPEN — Anomaly CRITICAL→MES pause listener + operator self-inspection MES-IoT integratsiyasi yo'q (RECONCILIATION #453/507); IoT-data bo'sh.
- **Nima yetishmaydi:** kamera↔MES nomoslik detektori va "tekshirilmagan to'xtash" OEE holati.
- **Bog'liqlik:** EP-MES-028 (AI anomaliya bazasi bor), EP-MES-013 (downtime kiritish), IoT
- **Xoch-havolalar:** `[Module-08] Item 45` · `EXTRACTION QISM A #45`

### VR-MES-I13 · Bosqich ekranida traffic light (to'plam tayyor/kutilmoqda/blok)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #47)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** MES operatoriga bosqich ekranida traffic light indikatori (yashil/sariq/qizil — to'plam tayyor/kutilmoqda/blok); bloklamaydi, faqat ko'rsatadi; to'plam gate PP tarafida boshqariladi.
- **Dalil (kod):** QISM D (VERIFY #47): `IoTProductionDashboardSections.tsx:82-92,323` — faqat running/stopped rang, online/offline va vaqt-qolgan sariq indikatori bor; bu **bosqich-tayyorlik** traffic-light'i emas.
- **Nima yetishmaydi:** PP to'plam-tayyorligini ko'rsatuvchi uch holatli indikator (bloklamaydigan).
- **Bog'liqlik:** EP-MES-016 (tablo), EP-MES-041 (navbat), PP to'plam-gate
- **Xoch-havolalar:** `[Module-08] Item 47` · `EXTRACTION QISM A #47` · `QISM D VERIFY #47`

### VR-MES-I14 · Akt 2 imzosiz material WMS'dan chiqmaydi va MES sessiyaga kirmaydi
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #49)*
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Akt 2 imzosiz (yoki faqat 1 imzo bo'lsa) material WMS'dan chiqmaydi va MES sessiyasiga kirmaydi (blok); akt imzolanmagan holda smena boshlanmaydi.
- **Dalil (kod):** 2026-07-11 / QISM D (VERIFY #49): MES sessiya-ochishda akt-ikki-imzo material-gate YO'Q (`grep akt|two.?sign mes/` → 0). **Δ:** `a4f406f7` — mavjud `material_kits` jadvali (`prepared_by` = 1-imzo, `confirmed_by` = 2-imzo) ustida `checkMaterialActSignatures()` qurildi va `start-session.handler.ts:113` da bloklaydi. `f318bbfe` — FE chaqiradigan yagona start yo'li (tablet) ham shu qoidani inline majburlaydi (`iot-tablet.controller.ts:616-633`), `PATCH /warehouse/material-kits/:id/status` soxta-ikki-imzosi yopildi (status lug'ati + har bosqich aktyori + tayyorlovchi o'zini tasdiqlay olmaydi), FE `pending→prepared→delivered→confirmed` zanjiri va Confirm tugmasi qo'shildi.
- **Nima yetishmaydi:** to'plami yo'q buyurtma darvozadan **o'tadi** (opt-in NULL-pass konvensiyasi) — barcha buyurtmalar uchun majburiy qilish egasining qarori; WMS tomonida "imzosiz material chiqmaydi" bloki alohida tasdiqlanmagan.
- **Bog'liqlik:** EP-MES-006, EP-MES-030 (checklist darvozasi), EP-MES-080, WMS
- **Xoch-havolalar:** `[Module-08] Item 49` · `EXTRACTION QISM A #49` · `QISM D VERIFY #49`

### VR-MES-I15 · Smena bali handover ikki taraf tasdig'idan keyin "yakuniy" (immutable)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000 #50 + #31 + #46)*
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Smena bali handover IKKI TARAF tasdiqlaganda "yakuniy"; keyin balni o'zgartirish faqat НО-mas'ul + direktor birgalikda, yozma sabab va audit-log yozuvi bilan (immutable — F5). Handover qabul qilinmaguncha smena "yopiq" emas; Payroll smena yopiqligiga bog'liq emas.
- **Dalil (kod):** `shift_handovers` accept-darvozasi kod-jihatdan to'liq (`iot-tablet.controller.ts:278-299`), lekin 0 qator; `mes_shift_evaluations` 0 qator; ball-immutability va "НО+direktor birga o'zgartiradi" mexanizmi topilmadi.
- **Nima yetishmaydi:** ball yakunlash darvozasi, immutability (audit-log) va ikki-rolli tuzatish oqimi; smena boshlig'i arbitraji (#31).
- **Bog'liqlik:** EP-MES-023 (handover), EP-MES-026 (ball), EP-MES-081 (НО), HR/Payroll
- **Xoch-havolalar:** `[Module-08] Item 31` · `[Module-08] Item 46` · `[Module-08] Item 50` · `EXTRACTION QISM A #31/#46/#50`

---

## III QISM — Metodologiya, raqamlash xaritasi va ziddiyatlar jurnali

### §3.1 Raqamlash xaritasi (siljish yo'q)

| Manba | Diapazon | EP-MES ga mos kelishi |
|---|---|---|
| `decisions/08-mes.md` | EP-MES-001..030 (v1, 30 savol) | 1:1 — I QISM |
| `decisions/08-mes.md` | EP-MES-031..082 (v2, 52 savol) | 1:1 — I QISM |
| `FULL-ITEM-LEVEL [Module-08]` | Item **51..132** | **Item N+50 = EP-MES-N** (siljishsiz 1:1) |
| `FULL-ITEM-LEVEL [Module-08]` | Item **1..50** | `vision-1000-answers #1..#50` — EP-kodsiz alohida o'q → II QISM + `(taxminiy)` xoch-havolalar |
| `EXTRACTION QISM C` (TASDIQ-2146) | `08.1..08.82` | `08.N = EP-MES-N` (aynan) |
| `EXTRACTION QISM A` | `#1..#50` | = `vision-1000-answers` bilan bir xil o'q |
| `EXTRACTION QISM D` (VERIFY) | 24 satr (#1,5,7,8,12,15,23,25,26,27,30,33,35,37,38,39,44,47,48,49) | QISM A ning "cross-ref kerak" satrlarini hal qiladi |

> **Tekshiruv:** `FULL-ITEM-LEVEL` hujjatining o'z footeri "covered items #67 through #132 of module 08
> (66 entries)" deydi — ya'ni modul ikki agent tomonidan qoplangan va #67..#92 oralig'ida qamrov
> ustma-ust tushgan. Harvest qilingan matnda **dublikat sarlavha yo'q** (`grep "^### \[Module-08\] Item"`
> → 132 ta noyob sarlavha, 1..132 uzluksiz), demak reconciliation allaqachon bajarilgan — bu registrda
> qo'shimcha dublikat-tanlash talab qilinmadi.

### §3.2 Ziddiyatlar jurnali (17 band + 1 hujjat-darajasidagi meta)

| # | Band | Ziddiyat | Hal |
|---|---|---|---|
| M | *(hujjat darajasi — bandga tegishli emas)* | `decisions/08-mes.md` Xulosasi "✅ 33 / 🔵 49" deydi; band-ma-band sanoq **✅ 66 / 🔵 16** beradi | Band-ma-band sanoq ustun (jonli `grep`). Manba hujjatning Xulosa bloki noto'g'ri — tuzatilishi kerak |
| 1 | EP-MES-005 | QISM C/FULL-ITEM "crew almashtirish mexanizmi yo'q" vs `36e116a1` (07-09) "real crew upsert" | `7ec31c9e` "migrations-not-applied" — kod repoda, jonli DB'da emas |
| 2 | EP-MES-010 | QISM C "7 generik kod" vs jonli DB "16 kod / 6 toifa" | QISM C satri **STALE-DOC** (2026-07-04 migratsiyasi auditdan keyin) |
| 3 | EP-MES-011 | Bir xil "7 vs 16" + ikki parallel jadval (`mes_downtime_reasons` jonli / `downtime_reason_codes` bo'sh) | STALE-DOC + kanonik jadval e'lon qilinmagan (STANDARTLAR §15) |
| 4 | EP-MES-013 | QISM C = **Ha** vs FULL-ITEM = **Qisman** (`reported_by` NULL) | Qatorli DB-dalil ustun → Qisman |
| 5 | EP-MES-014 | QISM C "smena/brigada/sex rollup yo'q" vs FULL-ITEM "kaskad kod-to'liq, data-bloklangan" | Kod o'qilgan dalil aniqroq → kaskad bor, ma'lumot yo'q |
| 6 | EP-MES-017 | QISM C "WS push bor" → FULL-ITEM "o'lik kod" → jonli kod "fayl o'chirilgan" | Eng yangi + jonli kod ustun → **Yo'q** |
| 7 | EP-MES-023 | QISM C "qabul-tasdiq to'liq emas" vs FULL-ITEM "accept-gate kod-to'liq" | Kod o'qilgan dalil ustun → mexanizm to'liq, qo'llanish yo'q |
| 8 | EP-MES-030 | QISM D "Ha" (darvoza) vs FULL-ITEM "Qisman" (adherence qaydi) | Har xil savol; registr **Qisman** (adherence talabi) |
| 9 | EP-MES-033 | FULL-ITEM "hissa% ustuni yo'q" vs `3556262a` (07-10) `machine_crew_members` | migrations-not-applied; Δ bilan Qisman |
| 10 | EP-MES-036 | Ikki audit-o'tishi kelishmagan (Yo'q vs STALE-DOC) | FULL-ITEM yangi tekshiruv bilan hal qilgan; `DT-NOWORK` bilan yopildi |
| 11 | EP-MES-046 | QISM C "7 kodda переделка yo'q" vs jonli `DT-QUAL-REWORK` | STALE-DOC; funksional bo'shliq (jonli qo'llanish + GL rework-moddasi) ochiq |
| 12 | EP-MES-047 | Yangi `DT-MOLD` seed `is_planned=true, category='changeover'`; vizyon buni **rejasiz** yo'qotish deb qaraydi | ⭐ Egasi/НО tasdig'i kerak — OEE Availability'ga noto'g'ri tomonga ta'sir qilishi mumkin |
| 13 | EP-MES-056 | FULL-ITEM (07-11) "effective_date/version ustuni yo'q" vs `48f85a82` (07-10) norma-snapshot | migrations-not-applied; Δ bilan Qisman |
| 14 | EP-MES-059 | QISM C "м2+qatlam ustunlari yo'q" / FULL-ITEM "gofra_config talabni bajarmaydi" vs `a7a5fb04` ustunlari | migrations-not-applied; Δ bilan Qisman |
| 15 | EP-MES-069 | To'rtta parallel marshrut jadvali (`pp_routing`, `pp_routing_operations`, `routing_operations`, `routings`), hammasi bo'sh | Kanonik jadval e'lon qilinmagan (STANDARTLAR §15 dublikat qoidasi) |
| 16 | EP-MES-075 | QISM C "переделка kodi+izoh yo'q" vs jonli "kod bor + `notes` bor, faqat majburiy emas" | QISM C satri qisman eskirgan (EP-MES-046 bilan bir ildiz) |
| 17 | EP-MES-082 | EP-MES-035 va EP-MES-082 bir xil sxema-bo'shlig'ini so'raydi (FULL-ITEM Item 132 o'zi "duplicate" deb yozadi) | Bitta qurilish ikkalasini yopadi; registrda alohida qoladi |

*(Xulosa jadvalidagi "17" = band-darajasidagi `⚠️ ZIDDIYAT` satrlari soni; M-satri hujjat-darajasidagi meta-topilma, sanoqqa kirmaydi.)*

### §3.3 Δ jurnali (2026-07-11 → 2026-08-07)

| Kommit | Sana | Tegishli bandlar | Mazmun |
|---|---|---|---|
| `48f85a82` | 07-10 | EP-MES-056, VR-MES-I03 | Sessiya-boshlashda norma-versiya snapshot (`norma_version`) |
| `013b21a6` | 07-10 | EP-MES-036 | `DT-NOWORK` + OEE'da alohida "no-work" chelagi |
| `3556262a` | 07-10 | EP-MES-004/033/044 | `machine_crew_members` (1 op + N yordamchi + hissa%) |
| `636a39d6` | 07-10 | EP-MES-015, EP-MES-055 | `mes_oee_targets` versiyalangan sozlama (НО/direktor) |
| `a691a5c3` | 07-10 | EP-MES-066 | Sessiyaga `format_a/format_b/gramm/kg` |
| `5691aaa8` | 07-10 | EP-MES-065 | MES↔WMS partiya-parametr taqqoslash slice'i |
| `a7a5fb04` | 07-11 | EP-MES-047/059/076, EP-MES-015 | `DT-MOLD` seed + gofra `layer_count`/`area_m2` + OEE-target FE ulanishi |
| `5bf6e6fd` | 07-11 | EP-MES-058, VR-MES-I11 | `is_training` + `lms_enrollment_id`, OEE'dan chiqarish, VIEW kengaytmasi |
| `072fce93` | 07-13 | EP-MES-009 | SOS eskalatsiya cho'qqisida CC `MES_ESCALATION` hujjati |
| `2066f70b` | 08-04 | EP-MES-006, VR-MES-I02 | Material sarfi → WMS chegirma → GL yozuvi |
| `4d181f89` | 08-04 | EP-MES-052/054 | Operator×mashina malaka matritsasi sessiya-boshlashda |
| `a4f406f7` | 08-04 | EP-MES-006, VR-MES-I14 | Material-akt 2-imzo darvozasi (CQRS start yo'li) |
| `647730be` | 08-04 | EP-MES-081, EP-MES-038 | Smena/OEE/texxizmat/norma endpointlarida bo'lim-scope RBAC |
| `5093fe43` | 08-04 | EP-MES-078 | Avariya downtime'idan Kanban kartasi avto-ochilishi |
| `0f303945` | 08-06 | EP-MES-080 | Tablet material-skan yashil-yolg'oni (FE + BE) |
| `7f4d7b6d` | 08-06 | EP-MES-002, EP-MES-080 | Tablet FE 7 mutatsiyada backend xatosini yutardi |
| `f318bbfe` | 08-07 | ⭐ EP-MES-080, EP-MES-006, VR-MES-I14 | Material-kit 2-imzo darvozasi HAQIQIY tablet oqimiga ulandi + soxta-2-imzo yopildi + FE lug'at drifti |
| `d74a12db` | 08-07 | EP-MES-016, EP-MES-017 | O'lik `mes.gateway.ts` (81 qator) o'chirildi |

### §3.4 Metodologiya izohlari

1. **Ikki holat-o'qi qat'iy ajratilgan.** "Qaror holati" faqat `decisions/08-mes.md` dan keladi
   (egasi javob berdimi), "Qurilish holati" faqat `FULL-ITEM-LEVEL` + jonli-kod tekshiruvidan
   (kod bormi). Ular hech qachon aralashtirilmagan — masalan EP-MES-039 (✅ qaror / Yo'q qurilish)
   va EP-MES-015 (🔵 qaror / Qisman qurilish).
2. **"To'qima yo'q" (Q-40).** FULL-ITEM-LEVEL da mos item topilmagan holat bu modulda **0** marta
   uchradi (Item 51..132 EP-MES-001..082 ni to'liq qoplaydi). Har bir "Dalil (kod)" satri manba
   hujjatning `Evidence` maydonidan yoki bu sessiyada bevosita o'qilgan/greplangan jonli koddan.
3. **Δ bandlarida jonli-kod spot-verify o'tkazildi:** `iot-tablet.controller.ts:616-633`
   (material-kit gate), `start-session.handler.ts:69-167` (5 darvoza: sertifikat → mashina-malaka →
   material-akt → chek-list → norma-snapshot), `get-oee.handler.ts:87-122,256-291`
   (no-work chelagi + training-exclusion), `mes-oee-targets.repo.ts`, `mes-crew-members.repo.ts`,
   `schema-compat-4.ts:155-169` (format/gramm/kg + gofra ustunlari), `mes.gateway.ts` yo'qligi.
4. **`migrations-not-applied` bayrog'i.** `7ec31c9e` (2026-07-11) BATCH-1 schema-wave'ni
   "landed but migrations not applied" deb belgilagan. Shuning uchun 2026-07-10/11 dagi
   MES migratsiyalari repoda mavjud, lekin 2026-07-11 auditining DB-probe'lari ularni
   ko'rmagan — §3.2 dagi 2/10/12-ziddiyatlarning sababi shu. **Egasi uchun amaliy xulosa:**
   bu bandlar "qurilgan" deb hisoblanadi faqat migratsiyalar jonli `europrint` ga qo'llangach.
5. **Egasi-data bloklari (kod bilan yopib bo'lmaydi):** ~30 mashina ro'yxati (EP-MES-039 — modulning
   eng katta ildiz-blokeri, 10+ bandni bloklaydi), per-stansiya norma qiymatlari (EP-MES-034/072),
   stansiya×birlik (EP-MES-035/082), brak% chegaralari (EP-MES-073), OEE target qiymatlari
   (EP-MES-015), bonus A/B/C so'm summasi (EP-MES-027), Ofset/Flekso НО mas'ullari
   (EP-MES-038/081), tanaffus/namoz oynalari (EP-MES-049/051), A/B/C smena nomlash qarori
   (EP-MES-061). Barcha raqamli chegaralar `business_settings` CRUD orqali kiritiladi
   (⭐ chatda so'ralmaydi).

