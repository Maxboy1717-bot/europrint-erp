# IoT / Telemetriya — Yagona Vizyon Registri (EP-IOT) — 2026-08-07

> **Manbalar:** `decisions/16-iot.md` (83 qaror: v1 30 + v2 53) · `FULL-ITEM-LEVEL [Module-16]` (136 item) · `FULL-VISION-EXTRACTION` QISM A (50 qator) + QISM C (TASDIQ-2146 §16, 86 qator) + QISM D (V/VERIFY cross-ref, 22 qator) · `vision-1000-answers/16-iot.md` (50) · `EUROPRINT_BARCHA_JAVOBLAR.md` (Q29/Q40/Q56/Q57/Q69/Q78/Q79/Q88/Q89/Q97/Q98/Q101/Q102/Q108/Q116/Q119/Q128/Q132/Q140) + `SHvB-40-Yonalish-Prompt.md` YO'NALISH 37 + kitob (Станоклар норма / А·Б·С смена / удар / брак% / иш йук)
> **Holat sanasi:** qurilish-holati asosan 2026-07-11 `FULL-ITEM-LEVEL` tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida `apps/api/src/modules/iot/` ga tegan 4 commit (`0b034f84`, `2cfeb8c2`, `0f303945`, `f318bbfe`) qayta tekshirildi (`Δ` qatorida belgilangan).

> ## ⭐ ENG MUHIM O'QISH QOIDASI — bu modulda "Yo'q" ikki xil
>
> IoT modulida `Qurilish holati: Yo'q` **ikki butunlay boshqa sababdan** kelib chiqadi va
> ularni aralashtirish mumkin emas:
>
> | Belgi | Ma'nosi | Nima qilish kerak |
> |---|---|---|
> | **🔩 CAPEX-gate** | Jismoniy datchik/kamera **sotib olinmagan va o'rnatilmagan** (egasi-CAPEX qarori). Ma'lumot manbasi yo'q. Kod tomoni datchik kelgach qurilishi mumkin — ba'zi joyda allaqachon qurilgan va bo'sh ishlab turibdi. | Egasi CAPEX qarori qabul qilsin. Dasturchiga topshiriq **emas**. |
> | **⌨️ KOD-kamchiligi** | Ma'lumot manbasi bor yoki kerak emas, lekin kod yozilmagan/ulanmagan. | Dasturchiga topshiriq **beriladi**, hozir qurilishi mumkin. |
>
> Har bandning **Nima yetishmaydi** qatori shu ikkisini aniq ajratadi. Ko'p bandda ikkalasi
> ham bor (masalan energiya: sensor ham yo'q, GL-taqsimot kodi ham yo'q) — u holda ikkalasi
> ham yoziladi.
>
> **Tasdiqlangan asos (2026-08-07 jonli):** telemetriya infratuzilmasi **BOR** — `mes_telemetry`
> jadvali (876 qator), `record-sensor-reading.handler.ts`, qo'lda HTTP ingest ishlaydi.
> Avtomatik push qiluvchi **jismoniy manba yo'q**: `sensor_devices`=0, `iot_sensor_readings`=0,
> `iot_alerts`=0, `camera_events`=0, `camera_ai_configs`=0. `iot_devices`=6 qator,
> `iot_devices.id` = **integer** (jonli tasdiqlangan). `equipment`=7 qator (generik DEMO nomlar),
> `production_sessions`=8, `machine_status_logs`=9, `machine_crews`=2,
> `mes_downtime_reasons`=**16** (2026-06-27 dagi "7" da'vosi eskirgan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-IOT-001..083)** | **83** |
| **Qaror holati:** ✅ javoblangan | 37 |
| **Qaror holati:** 🔵 ochiq | 46 |
| **Qurilish:** Ha | 5 |
| **Qurilish:** Qisman | 33 |
| **Qurilish:** Yo'q | 44 |
| **Qurilish:** STALE-DOC | 1 |
| 🔩 **CAPEX-gate bandlar** (jismoniy datchik/kamera yo'q) | **24** |
| ⌨️ CAPEX ta'siri **YO'Q/kam** — hozir qurilishi mumkin | 40+ |
| II QISM (`VR-IOT-I01..I06`) | 6 |
| ⚠️ Manbalar orasida ziddiyat | 8 |
| Δ 2026-07-11 dan beri o'zgargan | 9 |

> **Eslatma (qurilish ≠ qaror):** ikki o'q **mustaqil**. Masalan EP-IOT-039 (setup vaqti) qaror
> bo'yicha ✅ JAVOBLANGAN va qurilish bo'yicha ham **STALE-DOC** (aslida qurilgan, hujjat eskirgan);
> teskarisi — EP-IOT-058 (smena topshirish) qaror bo'yicha 🔵 **OCHIQ**, qurilish bo'yicha esa
> mexanizm **Ha** (`@Post('tablet/handover')` real). EP-IOT-010 (kamera inspeksiya) qaror bo'yicha
> ✅ JAVOBLANGAN, qurilish **Yo'q**.

> **Eslatma (sanoq tekshiruvi):** `decisions/16-iot.md` ning o'z Xulosasi (37 ✅ / 46 🔵) band-ma-band
> qayta sanaldi — **farq YO'Q**, ikkala ro'yxat 1:1 mos keladi (`grep` bilan tasdiqlangan). Batafsil:
> **III QISM §2**.

> ⭐ **Eng muhim xulosa (bir jumlada):** IoT modulining 83 bandidan **24 tasi** jismoniy datchik/kamera
> yo'qligi sababli (🔩 CAPEX egasi-qarori) to'xtagan; **qolgan ~40 tasi hech qanday apparatga bog'liq
> emas va bugun qurilishi mumkin** — ular tabletdan, MES sessiyasidan yoki master-data'dan ishlaydi.
> "IoT qurilmagan, chunki datchik yo'q" degan umumiy taassurot **noto'g'ri**: modulning yarmidan ko'pi
> kod/data-kamchiligi.

> **Eslatma (mapping):** `FULL-ITEM-LEVEL [Module-16]` Item **1..50** = `vision-1000-answers/16-iot.md`
> #1..#50 = `EXTRACTION QISM A` #1..#50 (EP-kodsiz kesishuvchi javoblar → mavzu bo'yicha ulanadi,
> `(taxminiy)` bilan belgilanadi); Item **51..106** = `TASDIQ-2146 §16` #1..#56 = **EP-IOT-031..083**
> (v2, 53 savol + 3 ortiqcha item — III QISM §1); Item **107..136** = `TASDIQ-2146 §16` #57..#86 =
> **EP-IOT-001..030** (v1, 1:1). `QISM C` qatori `16.N` = `TASDIQ-2146 §16 #N`.

---

## I QISM — EP-kodli qarorlar (EP-IOT-001..083)

### EP-IOT-001 · Sensor qaysi mashinalarga qo'yiladi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avval 3-5 ta asosiy mashina (eng ko'p to'xtaydigan/eng qimmati). IoT hali o'rnatilmagan (egasi); bosqichma-bosqich joriy = tez natija, kam xarajat. Kitob bo'yicha eng kritik nomzodlar: Гофра линия, KBA-105/SM-72 (ofset), ФСМ.
- **Manba:** v1-A + egasi (IoT hali yo'q, Excel/qo'lda) + kitob (asosiy mashinalar)
- **Dalil (kod):** `[Module-16] Item 107` — `SELECT count(*) FROM sensor_devices` → **0 qator** (2026-07-11 passda tasdiqlangan). Audit bu qatorni "explicitly a hardware rollout decision, not a code gap" deb belgilaydi va 🔑 CAPEX-qaror sifatida bayroqlaydi.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (sof)** — jismoniy datchik o'rnatilmagan, egasi 3-5 ta ustuvor mashinani tanlab, datchik xaridini tasdiqlashi kerak. ⌨️ **Kod-kamchiligi YO'Q** — bu band uchun kod topshirig'i mavjud emas; qaysi mashinaga qo'yish sof egasi-qarori.
- **Bog'liqlik:** Bu **ildiz-bloker**: Item 5/9/33/45/55/56/65/78/79/83/84/87/88/91/99 va yana ko'plari shu bir qarorga bog'langan. EP-IOT-029 (mashina reestri), EP-IOT-018 (energiya sensori)
- **action:** CREATE
- **⤳ Ta'sir:** CAPEX (Moliya), mashina-reestr (EP-IOT-029), bosqichli joriy etish
- **Xoch-havolalar:** `[Module-16] Item 107` · `TASDIQ-2146 §16 #57` · `QISM C 16.57`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-002 · Mashina holati ranglari (master-ro'yxat)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 5 holat: Ishlayapti(yashil)/To'xtagan(qizil)/Sozlanmoqda(sariq)/Nosoz(qora)/O'chiq(kulrang). ShVB YO'NALISH 37 `machineStatus` real holatlarni talab; kitob "ремонтда" + "настройка" + "иш йук" 5 holatga aniq mos.
- **Manba:** ShVB Y37 (machineStatus) + kitob (ремонт/настройка/иш йук) + v1-A
- **Dalil (kod):** `[Module-16] Item 108` (= Item 86 takrori) — `machine_status_logs.status` **erkin-matn `varchar`**, DB-darajasidagi enum EMAS (`information_schema` bilan tasdiqlangan). Jonli data'da da'vo qilingan 5 holatdan faqat **2 tasi** bor: `running`, `stopped`. `machine_status_logs`=9 qator.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy)** — 5 holatning enum/master-lug'ati yo'q, `status` ustuni erkin matn; `Sozlanmoqda`/`Nosoz`/`O'chiq` holatlari kodda umuman ta'riflanmagan. 🔩 CAPEX qisman: avtomatik holat-o'zgarishini datchik push qilishi kerak, lekin qo'lda/tabletdan ham kiritilishi mumkin — **shuning uchun bu band datchiksiz ham hozir qurilishi mumkin**.
- **Bog'liqlik:** EP-IOT-021 (Andon ekran), EP-IOT-058/059 (иш йук / колиб сабаблари), Item 86 (ON/OFF avto yozuv)
- **action:** CREATE
- **⤳ Ta'sir:** Andon ekran (EP-IOT-021), holat hisoboti, MES
- **Xoch-havolalar:** `[Module-16] Item 108` · `[Module-16] Item 86` *(takror)* · `TASDIQ-2146 §16 #58` · `QISM C 16.58`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-003 · Mashina uptime (ish vaqti) ko'rsatkichi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik (sensor signalidan, smena/kun/hafta) + GSD'ga ulash. ShVB YO'NALISH 37: `uptime` + "IT tizim uptime %" GSD; karta-model — mashina GSD operatorga (EP-IOT-025). IoT o'rnatilguncha qo'lda/MES'dan; o'rnatilgach avto.
- **Manba:** ShVB Y37 (uptime, iotGsd) + karta-model (GSD) + v1-A
- **Dalil (kod):** `[Module-16] Item 109` — `drizzle-iot-oee.repo.ts:57-69` da real `availability_pct` formulasi tasdiqlangan (haqiqiy sessiya-vaqtidan hisoblaydi, stub emas). GSD-ulanish `apps/api/src/modules/org-structure` grep'i bilan **tasdiqlanmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi** — uptime→karta GSD yozuviga avto-oqim yo'q (SB0300/0326 "per-karta samaradorlik rollup ishlamaydi"). 🔩 CAPEX: hisob `production_sessions` dan ishlaydi (8 qator bor), shuning uchun **datchiksiz ham ishlaydi** — CAPEX faqat "avtomatik sensor signalidan" qismini bloklaydi, qo'lda/tablet manbasi yetarli.
- **Bog'liqlik:** EP-IOT-014 (OEE), EP-IOT-025 (karta GSD), Item 38/104 (ckp-mes-feed / GSD hodisa zanjiri)
- **action:** EVENT
- **⤳ Ta'sir:** ShVB GSD (EP-IOT-051), OEE (EP-IOT-014), karta GSD (EP-IOT-025)
- **Xoch-havolalar:** `[Module-16] Item 109` · `[Module-16] Item 47` *(bir xil dalil)* · `TASDIQ-2146 §16 #59` · `QISM C 16.59`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-004 · To'xtash (downtime) sababini yozish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** **Ha** *(2026-07-11)*
- **Talab:** A — tayyor sabab ro'yxatidan operator tanlaydi (planlangan/planlanmagan ajraladi). ShVB YO'NALISH 37 `downtime.entity` + `downtimeReason`; MES'da `downtime_reason_codes` allaqachon bor. Kitobning real sabablari (иш йук/колиб/переделка) tayyor ro'yxatga aylanadi.
- **Manba:** ShVB Y37 (downtime.entity, downtimeReason) + MES (downtime_reason_codes mavjud) + kitob + v1-A
- **Dalil (kod):** `[Module-16] Item 110` — `mes_downtime_reasons` real, **16 qator** (2026-06-27 dagi "7" da'vosidan o'sgan), `is_planned` boolean ustuni mavjud va to'ldirilgan. `@Post('downtime-events')` — `iot-tablet.controller.ts:1123` (manba jadvalda 577-satr yozilgan — fayl o'sgani uchun satr-raqami eskirgan, endpoint esa real).
- **Nima yetishmaydi:** Mexanizm **to'liq ishlaydi** — kamchilik yo'q. Manba jadvaldagi qator-soni va satr-raqami eskirgan (STALE-DOC), lekin band-mohiyati bo'yicha yopilgan. 🔩 CAPEX ta'siri **yo'q** — operator tabletdan tanlaydi, datchik shart emas.
- **Bog'liqlik:** EP-IOT-005 (sabab ro'yxati mazmuni), EP-IOT-058/059/060/061 (kitob sabablari)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-005 (sabab ro'yxati), Pareto tahlil, MES integratsiya
- **Xoch-havolalar:** `[Module-16] Item 110` · `TASDIQ-2146 §16 #60` · `QISM C 16.60`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-005 · To'xtash sabablari ro'yxati (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(STALE-DOC — qator-soni)* *(2026-07-11)*
- **Talab:** A — 8-10 standart sabab (ta'mirlash/material yo'q/qolip almashtirish/sozlash/tozalash/tok yo'q/operator yo'q/sifat). Kitob real sabablarni beradi: **иш йук** (EP-IOT-036), **колиб тайёр эмас** (EP-IOT-037), **переделка** (EP-IOT-038), **настройка муракаб** (EP-IOT-039) — bular ro'yxatga majburiy kiradi.
- **Manba:** kitob (иш йук/колиб/переделка/настройка real izohlar) + v1-A + MES downtime kodlari
- **Dalil (kod):** `[Module-16] Item 111` — manba jadval "7/10, kitob-sabab yetishmaydi" deydi; jonli `SELECT * FROM mes_downtime_reasons` → **16 qator**, ya'ni **son bo'yicha maqsad oshib ketgan**. Lekin mazmun-tekshiruvi: 16 kodning **hech biri** vizyon-spetsifikatsiyadagi "иш йук"/"колиб"/"переделка" so'zlariga so'zma-so'z mos kelmaydi.
- **Nima yetishmaydi:** ⌨️ **Kod/data-kamchiligi** — kitobdagi 4 ta real fabrika-sababi (иш йук / колиб тайёр эмас / переделка / настройка муракаб) seed qilinmagan. Bu **sof seed vazifasi**, hozir bajarilishi mumkin. 🔩 CAPEX ta'siri **yo'q**.
- **Bog'liqlik:** EP-IOT-058 (иш йук), EP-IOT-059 (колиб), EP-IOT-060 (переделка), EP-IOT-061 (настройка)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-036..039 (kitob sabablari), MPS/MRP, ShVB
- **Xoch-havolalar:** `[Module-16] Item 111` · `TASDIQ-2146 §16 #61` · `QISM C 16.61`
- **⚠️ ZIDDIYAT:** `QISM C 16.61` / manba jadval (2026-06-27) "7 kod bor" vs `[Module-16] Item 111` (2026-07-11 jonli) "16 qator". Ikkalasi ham o'z sanasida to'g'ri — jadval 2026-06-27 dan keyin o'sgan. **Son maqsadi bajarilgan, mazmun maqsadi bajarilmagan.**
- **Δ 2026-07-11→08-07:** —

### EP-IOT-006 · Anomaliya (g'ayrioddiy holat) ogohlantirishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik aniqlash + darhol ogohlantirish (sex ekrani + Telegram). ShVB YO'NALISH 37 `sensorAlert`. IoT sensor o'rnatilgandan keyin (hozir yo'q) — fazaviy.
- **Manba:** ShVB Y37 (sensorAlert) + v1-A + egasi (sensor hali yo'q)
- **Dalil (kod):** `[Module-16] Item 112` — `anomaly-detected.handler.ts` real (stub emas), CRITICAL da MES'ni **pauza qiladi**. `iot_alerts`=**0 qator** — chunki uni ishga tushiradigan datchik yo'q.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — kod tayyor va bo'sh ishlab turibdi; jismoniy datchik o'rnatilmagan, shuning uchun bironta anomaliya hech qachon yaratilmagan. ⌨️ Kod-kamchiligi (ikkilamchi): Telegram jo'natish handler ichida **yo'q** (qv. EP-IOT-028), sex ekrani (Andon) FE'da yo'q (qv. EP-IOT-021).
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri), EP-IOT-008 (workflow), EP-IOT-021 (Andon), EP-IOT-028 (Telegram)
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat (EP-IOT-008), Telegram (EP-IOT-028), CC marshrut (EP-IOT-024)
- **Xoch-havolalar:** `[Module-16] Item 112` · `[Module-16] Item 7` *(taxminiy — eskalatsiya matritsasi)* · `EXTRACTION QISM A #7` · `TASDIQ-2146 §16 #62` · `QISM C 16.62`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-007 · Anomaliya chegaralarini kim belgilaydi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har mashina turi uchun chegara admin/ishlab chiqarish boshlig'i sozlaydi. Kitobning norma-tasdiq zanjiri (РД4→Ген.Директор, EP-IOT-024 v2/Q24) chegara ham nazoratli o'rnatilishini ko'rsatadi. AI avto-chegara (B) keyin.
- **Manba:** v1-A + kitob (norma tasdiq zanjiri) + egasi (sensor hali yo'q)
- **Dalil (kod):** `[Module-16] Item 113` — `iot-sensors.controller.ts:113` `@Patch('devices/:id/thresholds')` real, `UpdateDeviceThresholdsCommand` bilan quvvatlangan. `iot_devices.thresholds` ustuni mavjud (**JSONB**), `iot_devices`=**6 qator** jonli.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi** — xom PATCH ustida **admin/IChB tasdiq-oqimi (approval workflow) yo'q**; kitobning РД4→Ген.Директор imzo-zanjiri chegara-o'zgarishiga qo'llanmagan. 🔩 CAPEX ta'siri **kam** — chegara sozlash mexanizmi datchiksiz ham ishlaydi (6 qurilma jonli), faqat chegara qaysi haqiqiy o'lchovga qo'llanishi datchikka bog'liq.
- **Bog'liqlik:** EP-IOT-006 (anomaliya), EP-IOT-053 (norma tasdiq zanjiri), mashina-turi master-data
- **action:** UPDATE
- **⤳ Ta'sir:** Anomaliya signal sifati, mashina-turi master-data
- **Xoch-havolalar:** `[Module-16] Item 113` · `TASDIQ-2146 §16 #63` · `QISM C 16.63`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-008 · Anomaliya kelganda nima bo'ladi (workflow)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avto: texnik xizmat vazifasi ochiladi + mas'ul mexanikga xabar + jurnal. Karta-model: xabar to'g'ri kartaga (mexanik). IoT sensor o'rnatilgach faollashadi.
- **Manba:** v1-A + karta-model (xabar marshrut, EP-IOT-024) + ShVB Y37 (sensorAlert)
- **Dalil (kod):** `[Module-16] Item 114` — `anomaly-detected.handler.ts` **to'liq o'qilgan**: handler faqat (a) `iot_alerts` ga INSERT qiladi va (b) CRITICAL da MES'ga `PauseSessionCommand` yuboradi. Texnik-xizmat vazifasi yaratish yoki Telegram jo'natish handler ichida **umuman yo'q**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (aniq va hozir qurilishi mumkin)** — "avto texnik vazifa + mexanikga xabar" yarmi yozilmagan; `mes_maintenance_tasks`/`maintenance_orders` ga ulanish yo'q. 🔩 CAPEX-gate (ikkilamchi): handler'ni ishga tushiruvchi anomaliya hech qachon kelmaydi (datchik yo'q), lekin **kodni yozish uchun datchik kutish shart emas**.
- **Bog'liqlik:** EP-IOT-016 (TO jadvali), EP-IOT-017 (TO ishlari), EP-IOT-024 (karta marshrut), Item 72/73 (`mes_maintenance_tasks`/`maintenance_orders`)
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat (EP-IOT-016), CC, jurnal
- **Xoch-havolalar:** `[Module-16] Item 114` · `TASDIQ-2146 §16 #64` · `QISM C 16.64`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-009 · Telemetriya tarixini saqlash muddati
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — batafsil 3-6 oy, keyin kunlik o'rtachaga siqib uzoq saqlash (downsampling). Tahlil + baza joyiga muvozanat. Texnik qaror; IoT o'rnatilgach amal qiladi.
- **Manba:** v1-A + texnik amaliyot (time-series downsampling)
- **Dalil (kod):** `[Module-16] Item 115` — manba jadval "`mes_telemetry` 384 qator, cron yo'q" deydi; jonli `SELECT count(*) FROM mes_telemetry` → **876** (o'sgan). `downsampl`/`retention` grep'i → **0 mos**, ya'ni cron-bo'shlig'i da'vosi hamon to'g'ri. `QISM D #30`: retention faqat POS/HR-hujjat arxivida (`common/database/queries-data-retention.ts:42,79,116` — 7/3/10 yil); telemetriya downsample/kunlik-o'rtacha job **yo'q**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — `mes_telemetry` da 876 real qator bor, ya'ni siqiladigan ma'lumot **allaqachon mavjud**; downsampling cron'i yozilmagan. 🔩 CAPEX ta'siri **YO'Q** — bu band datchikka bog'liq emas. ⭐ **Egasi-qarori kerak:** 3 oymi yoki 6 oy (chegara `business_settings` ga default bilan qo'yilib CRUD orqali sozlanishi kerak).
- **Bog'liqlik:** EP-IOT-041 (noma'lum vaqt), `mes_telemetry` cron tarixi
- **action:** CRON
- **⤳ Ta'sir:** Baza hajmi, trend tahlil, OEE tarixi
- **Xoch-havolalar:** `[Module-16] Item 115` · `[Module-16] Item 30` *(taxminiy)* · `EXTRACTION QISM A #30` · `QISM D #30` · `TASDIQ-2146 §16 #65` · `QISM C 16.65`
- **⚠️ ZIDDIYAT:** manba jadval (2026-06-27) "384 qator" vs jonli (2026-07-11) "876 qator" — **STALE-DOC**, cron-bo'shlig'i qismi esa hamon to'g'ri. Ikkinchi ziddiyat: `QISM D #30` va `Item 115` "downsample/retention job **yo'q**" deydi, lekin jonli `apps/api/src/cron/iot-data-cleanup.cron.ts` **BOR va ro'yxatdan o'tgan** — quyidagi Δ ga qarang.
- **Δ 2026-07-11→08-07:** ⭐ **Jonli topilma 2026-08-07 — "yashil-yolg'on" cron.** `apps/api/src/cron/iot-data-cleanup.cron.ts` mavjud, `@Cron('0 2 * * 6')` (har shanba 02:00), `cron.module.ts:123` da provider sifatida ro'yxatdan o'tgan va `cron-status.service.ts:124` da "IoT ma'lumotlarini tozalash" deb ko'rsatiladi — ya'ni **CRON monitoringida "bor" deb ko'rinadi**. Lekin metod tanasi **butunlay bo'sh**: bironta DB so'rovi yo'q, faqat izohlar ("90 kun → coldstore S3 Glacier", "raw data delete, aggregated hourly summaries keep"), `result.processed = 0` qattiq yozilgan va `logger.log('✅ IotDataCleanup: processed=0')` chiqaradi. ⌨️ **Bu kod-kamchiligining eng xavfli turi** — audit "cron yo'q" deb topgan, aslida cron **bor lekin hech narsa qilmaydi va muvaffaqiyat deb log yozadi**. `mes_telemetry` 876 qator hech qachon siqilmaydi/arxivlanmaydi.

### EP-IOT-010 · Kamera-AI bilan xona inspeksiyasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — AI rasm baholaydi + ball + anomaliya. Q97: har bo'lim/xona ideal-rasm orqali AI nazorat; Q98: ideal-xona bilan **har 2 soatda** taqqoslash. ShvB inspektor-menejer yo'nalishi (Y29) bilan to'liq mos. Bu sensor EMAS → hozir joriy etiladigan boshlang'ich.
- **Manba:** BARCHA_JAVOBLAR Q97/Q98 (ideal-xona AI taqqoslash, har 2 soatda) + ShVB Y29 (inspektor) + v1-A
- **Dalil (kod):** `[Module-16] Item 116` — `SELECT count(*) FROM ideal_rasm_targets` → **0 qator**; 2-soatlik cron grep bilan **topilmadi**. `EXTRACTION QISM A #2`: `camera_ai_configs`=0 qator (SB0502 PARTIAL), kamera-AI DB bo'sh (SB0332 STILL-OPEN). VLM kod bor (`analyze-camera` / `detect-safety-violations.tool.ts`), jonli qo'llanish 0.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate** — AI-kamera infratuzilmasi jismonan o'rnatilmagan. ⌨️ **Kod-kamchiligi (parallel, hozir qurilishi mumkin)** — 2-soatlik taqqoslash cron'i va `ideal_rasm_targets` ga etalon-rasm yuklash oqimi yozilmagan (`QISM D #22`: `reference_image`/`etalon`/`ideal_state`/`baseline_image` grep → iot/=0 va FE=0). ⚠️ **Egasi eslatmasi:** decisions bu bandni "bu sensor EMAS → hozir joriy etiladigan boshlang'ich" deb belgilagan — ya'ni egasi buni **datchik-CAPEX'dan alohida, oldinroq** ko'rgan.
- **Bog'liqlik:** EP-IOT-011 (mezon ro'yxati), EP-IOT-012 (tuzatish jurnali), EP-IOT-047/048 (xavfsizlik), Item 22 (etalon-rasm yuklash)
- **action:** AI
- **⤳ Ta'sir:** HR inspeksiya, EP-IOT-011/012, xavfsizlik (EP-IOT-047/048)
- **Xoch-havolalar:** `[Module-16] Item 116` · `[Module-16] Item 22` *(taxminiy)* · `EXTRACTION QISM A #22` · `QISM D #22` · `TASDIQ-2146 §16 #66` · `QISM C 16.66`
- **Δ 2026-07-11→08-07:** ⭐ **KATTA O'ZGARISH.** (1) **Jonli tekshiruv 2026-08-07:** `RoomAnalysisCron` — `apps/api/src/modules/hr/inspection/room-analysis.cron.ts:32` `@Cron('0 */2 * * *')` = **aynan har 2 soatda**, `inspection.module.ts:17` da provider sifatida **ro'yxatdan o'tgan** (o'lik emas), `camera_events` dan snapshot oladi, `InspectionService` bilan etalon-taqqoslash qiladi va anomaliyada `NotificationBotService` orqali HR_MANAGER/HR_DIRECTOR/SECURITY ga Telegram yuboradi. Ya'ni Q98 ning "har 2 soatda" talabi **kod darajasida bajarilgan**. (2) `0b034f84` (2026-08-05) — o'lik `apps/api/src/cron/reference-image-compare.cron.ts` **o'chirildi** (hech qachon `cron.module.ts` da ro'yxatdan o'tmagan, `@Cron` hech qachon ishlamagan; `RoomAnalysisCron` ning yomonroq dublikati edi, `@google/generative-ai` ni to'g'ridan-to'g'ri hardcode qilgan). Uning 3 ta jadvali (`room_references`, `room_reference_comparisons`, `camera_snapshots`) yetim qoldi — o'chirish Q-35 egasi-imzosini talab qiladi.
- **⚠️ ZIDDIYAT:** `[Module-16] Item 116` (2026-07-11) "no 2-hour cron found via grep" **XATO/chala** — cron `iot/` da emas, **`hr/inspection/`** da joylashgan (`RoomAnalysisCron`, `@Cron('0 */2 * * *')`, module'da ro'yxatdan o'tgan). Audit faqat IoT modulini grep qilgan. To'g'ri holat: **2-soatlik cron BOR va ro'yxatdan o'tgan**; yetishmagani — `ideal_rasm_targets`=0 va kamera jismonan yo'q, ya'ni cron har 2 soatda "no rooms registered yet" deb bo'sh qaytadi.

### EP-IOT-011 · Kamera-AI nimani tekshiradi (master-ro'yxat)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — 5-7 mezon (tozalik/himoya vositasi/yo'lak/tartib/xavfsizlik). Q29 (inspeksiya: Checklist + Foto + Xarita), Q97 (har bo'lim/xona checklist + ideal-rasm). Mezon ro'yxati izchil ball uchun shart.
- **Manba:** BARCHA_JAVOBLAR Q29/Q97 (checklist + ideal-rasm mezonlari) + v1-A
- **Dalil (kod):** `[Module-16] Item 117` — `apps/api/src/modules/aisha` va `apps/api/src/modules/iot` grep qilindi (tozalik/tartib/xavfsizlik mezon master-ro'yxati) → **mos seed-data topilmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod/data-kamchiligi (asosiy, hozir qurilishi mumkin)** — 5-7 mezonli master-lug'at jadvali va seed'i yozilmagan; `RoomAnalysisCron` allaqachon ishlab turibdi, unga beriladigan mezon ro'yxati yo'q. 🔩 **CAPEX-gate (ikkilamchi)** — AI-kamera jismonan o'rnatilmagan, shuning uchun mezon bo'yicha baholanadigan rasm kelmaydi. ⭐ **Egasi-data ham kerak:** mezonlarning aniq so'zlanishi (5-7 ta) egasidan.
- **Bog'liqlik:** EP-IOT-010 (xona inspeksiyasi), EP-IOT-012 (ball/jurnal), EP-IOT-047 (himoya vositasi PPE)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-010 (ball), HR inspeksiya, EP-IOT-047 (himoya vositasi)
- **Xoch-havolalar:** `[Module-16] Item 117` · `TASDIQ-2146 §16 #67` · `QISM C 16.67`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-012 · Inspeksiya buzilishini tuzatish jurnali
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-05 Δ)*
- **Talab:** A — har buzilish → mas'ul → muddat → tuzatildi tasdig'i (yopiq sikl). Q40 (etika: jurnal + bosqichli jazo + xodim ko'radi), Q128 (jarima → xodim profiliga), Q69 (qoidabuzarlikni inspektor + HR + bo'lim boshlig'i ko'radi). Yopiq sikl = javobgarlik.
- **Manba:** BARCHA_JAVOBLAR Q40/Q69/Q128 (jurnal + javobgarlik + profil) + ShVB Y29 (correctionPlan) + v1-A
- **Dalil (kod):** `[Module-16] Item 118` — audit `room_inspections` nomli jadvalni topolmadi (SQL xato: "не существует под этим именем"), "room-inspections" endpoint havolasi bor deb bildirdi, lekin **jonli jadval nomini mustaqil tasdiqlay olmadi** va 0 data sababli "yopiq-sikl tuzatish oqimi tasdiqlanmagan/ehtimol yo'q" deb belgiladi.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi** — "mas'ul → muddat → tuzatildi tasdig'i" yopiq sikli to'liq emas; jarima→xodim profiliga (Q128) zanjiri IoT tomonidan tasdiqlanmagan. 🔩 **CAPEX-gate** — kamera-AI jismonan yo'q, jurnalga tushadigan buzilish 0.
- **Bog'liqlik:** EP-IOT-010/011 (inspeksiya manbasi), HR jarima/intizom, `camera_alerts`
- **action:** CREATE
- **⤳ Ta'sir:** HR jarima/intizom, QC reklamatsiya, audit
- **Xoch-havolalar:** `[Module-16] Item 118` · `TASDIQ-2146 §16 #68` · `QISM C 16.68`
- **Δ 2026-07-11→08-07:** ⭐ `0b034f84` (2026-08-05) — **yopiq siklning uzilgan yarmi ulandi.** `camera-ai.service.ts` `analyzeByMissions()` AI topilmalarini faqat `camera_events` ga yozardi, `camera_alerts` ga **hech qachon** yozmasdi — natijada allaqachon qurilgan inson-tasdiq (acknowledge/resolve) UI+API (`CameraAlertsRouteController`, `camera-alerts.tsx`, ikkalasi ham to'liq marshrutlangan) **abadiy bo'sh turardi**. Endi har saqlangan topilma uchun `camera_event_id` bilan bog'langan `camera_alerts` qatori yaratiladi. Ya'ni "buzilish → mas'ul ko'radi → tasdiqlaydi" siklining **birinchi bo'g'ini endi ulangan**; "muddat + tuzatildi tasdig'i" bo'g'ini hamon yo'q.

### EP-IOT-013 · MES bilan ulanish (ish buyrug'i ↔ mashina)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — sensor hisoblagich → MES buyrug'iga avto bog'lanadi (chiqarilgan dona avto-yoziladi). ShVB YO'NALISH 37: "MES bilan integratsiya — sensor → MES downtime avto", MESDashboard bilan birlash. Oltin-ip yadrosi. IoT sensorsiz hozir qo'lda; o'rnatilgach avto.
- **Manba:** ShVB Y37 (MES integratsiya, MESDashboard birlash) + oltin-ip + v1-A
- **Dalil (kod):** `[Module-16] Item 119` — `SELECT count(*) FROM production_sessions` → **8 qator**; bog'lovchi ustunlar `production_order_id` va `equipment_id` mavjud va 8 qatorning **hammasida to'ldirilgan**. Lekin IoT'ning `production_sessions` va MES'ning o'z sessiya-jadvali **ikki alohida oqim** (qator-soni pariteti audit tomonidan qayd etilgan) — yagona birlashgan oqim emas.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy)** — IoT↔MES sessiya-jadvallari birlashtirilmagan (ikki-dunyo naqshi); "chiqarilgan dona avto-yoziladi" zanjiri sensorsiz qo'lda ishlaydi, lekin sessiya-konsolidatsiya krossmodul vazifasi sifatida ochiq. 🔩 CAPEX: "sensor hisoblagichdan avto" qismi datchikka bog'liq, lekin **buyurtma↔mashina bog'lanishi datchiksiz allaqachon ishlaydi** (8 jonli sessiya).
- **Bog'liqlik:** MES modul sessiya-jadval konsolidatsiyasi (krossmodul), EP-IOT-040 (Папка bog'lash), EP-IOT-026 (defekt)
- **action:** EVENT
- **⤳ Ta'sir:** MES (avto bajarildi), EP-IOT-040 (Папка bog'lash), EP-IOT-026 (defekt)
- **Xoch-havolalar:** `[Module-16] Item 119` · `TASDIQ-2146 §16 #69` · `QISM C 16.69`
- **Δ 2026-07-11→08-07:** `f318bbfe` (2026-08-07) — **IoT tablet ↔ MES darvozasi haqiqiy oqimga ulandi.** `POST /iot/production-sessions/:id/start` (FE chaqiradigan **yagona** start yo'li) `checkMaterialActSignatures` ni hech qachon chaqirmasdi — 5-bosqichli material-komplekt darvozasi `POST /mes/sessions/:id/start` da yashab turardi, uni **hech bir sahifa chaqirmaydi**. Endi tablet marshruti ham xuddi shu qoidani inline majburlaydi: sessiya buyurtmasiga komplekt bor va tasdiqlanmagan bo'lsa → **422 BLOCKED**; komplekt umuman yo'q bo'lsa → o'tkazadi (NULL-pass naqshi). Bu EP-IOT-013 ning "oltin-ip" bo'g'inini kuchaytiradi.

### EP-IOT-014 · OEE (umumiy samaradorlik) ko'rsatkichi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** **Ha** *(2026-07-11)*
- **Talab:** A — to'liq OEE (3 omil: vaqt + tezlik + sifat) avtomatik + trend. ShVB YO'NALISH 37 `machineEfficiency` + `plannedVsActual`; MES'da OEE snapshot allaqachon bor. Kitob: норма штук (tezlik) + брак% (sifat) + ишлаган соат (vaqt) = 3 omil to'liq.
- **Manba:** ShVB Y37 (machineEfficiency) + MES (OEE snapshot mavjud) + kitob (norma/брак/соат) + v1-A
- **Dalil (kod):** `[Module-16] Item 120` — `apps/api/src/modules/iot/oee/oee-calculator.service.ts:118-121` tasdiqlangan: `clamp(safeDiv(...))` availability/performance/quality uchun — **uchala omil ham hisoblanadi** va [0,1] ga qisiladi, Zod validatsiyasi fayl sarlavha-izohida qayd etilgan. Audit: "genuinely complete calculator; feeds from real `production_sessions` columns" — bog'liqlik yo'q.
- **Nima yetishmaydi:** Kalkulyator **to'liq** — kamchilik yo'q. ⚠️ Yonaki eslatma: `setup` toifasining aniq formulasi hamon proksi (qv. EP-IOT-061 va `EXTRACTION QISM A #47` — SB0322 "threshold-proxy readings>80, (running−down)/(running−down−setup) formula emas"). 🔩 CAPEX ta'siri **yo'q** — 8 jonli sessiyadan hisoblaydi.
- **Bog'liqlik:** EP-IOT-003 (uptime), EP-IOT-051 (GSD), EP-IOT-061 (setup toifasi)
- **action:** EVENT
- **⤳ Ta'sir:** EP-IOT-003 (uptime), EP-IOT-051 (GSD), mashina taqqoslash
- **Xoch-havolalar:** `[Module-16] Item 120` · `[Module-16] Item 47` *(taxminiy — setup formulasi)* · `EXTRACTION QISM A #47` · `TASDIQ-2146 §16 #70` · `QISM C 16.70`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-015 · RUL — qolgan resurs (predictive maintenance)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — oddiy qoidaga asoslangan prognoz (ish soati/sikl bo'yicha) avval; ishonchli, tez. AI prognoz (B) keyin (ko'p data kerak). Kitob udar-resurs (EP-IOT-004 v2/Q4, EP-IOT-026 v2/Q26 qolip udar) bu yo'nalishni qo'llab-quvvatlaydi.
- **Manba:** v1-A + kitob (udar/sikl resurs) + egasi (data hali yo'q)
- **Dalil (kod):** `[Module-16] Item 121` — `apps/api/src/modules/iot/oee/predictive-maintenance.service.ts` = **304 qator** (`wc -l` bilan tasdiqlangan), stub emas, real evristik RUL xizmati. `SELECT count(*) FROM iot_sensor_readings` → **0 qator**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (sof va aniq)** — 304 qatorlik kod **tayyor va to'g'ri**, lekin `iot_sensor_readings` bo'sh, ya'ni bironta prognoz chiqara olmaydi. Datchik kelgach **kod o'zgartirishsiz ishlaydi**. ⌨️ Kod-kamchiligi (ikkilamchi): udar-hisoblagich (EP-IOT-055/056) yo'qligi sababli "sikl bo'yicha" muqobil manba ham mavjud emas.
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri, Item 107), EP-IOT-016 (TO jadvali), EP-IOT-056 (udar-resurs)
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat jadvali (EP-IOT-016), qolip resursi (EP-IOT-026 v2)
- **Xoch-havolalar:** `[Module-16] Item 121` · `[Module-16] Item 50` *(taxminiy)* · `EXTRACTION QISM A #50` · `TASDIQ-2146 §16 #71` · `QISM C 16.71`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-016 · Texnik xizmat jadvali (reja-profilaktika)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik jadval (ish soatiga bog'liq) + eslatma + bajarildi belgisi. Kitob "ремонтда" tarixini (EP-IOT-042 v2) tizimlashtirish bilan bog'liq. TPM checklist (EP-IOT-050 v2) ham shu yo'nalish.
- **Manba:** v1-A + kitob (ремонт tarixi) + egasi (sensorsiz: ish-soati MES'dan)
- **Dalil (kod):** `[Module-16] Item 122` — `SELECT count(*) FROM maintenance_orders` → **0 qator**. Jadval/ustunlar mavjud (manba jadval da'vosi rad etilmagan), lekin "ish-soatidan avto-generatsiya" cron'i grep bilan **tasdiqlanmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — ish-soatiga qarab TO jadvalini avto-yaratuvchi cron yozilmagan; eslatma va "bajarildi" belgisi oqimi yo'q. 🔩 CAPEX ta'siri **kam** — decisions o'zi "sensorsiz: ish-soati MES'dan" deb belgilagan, ya'ni `production_sessions` (8 qator) manba sifatida **yetarli**, datchik shart emas. ⭐ **Egasi-data:** TO davriyligi (soat/sikl) `business_settings` ga default bilan qo'yilib CRUD orqali sozlanishi kerak.
- **Bog'liqlik:** EP-IOT-017 (ishlar ro'yxati), EP-IOT-015 (RUL), EP-IOT-042/043 v2 (tarix/ehtiyot qism), EP-IOT-008 (anomaliya→vazifa)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-017 (ishlar ro'yxati), EP-IOT-042/043 v2 (tarix/ehtiyot qism)
- **Xoch-havolalar:** `[Module-16] Item 122` · `TASDIQ-2146 §16 #72` · `QISM C 16.72`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-017 · Texnik xizmat ishlari ro'yxati (master-data)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mashina turi bo'yicha standart ishlar + davriylik jadvali (yog'lash/filtr/kamar/kalibrlash). Izchil bajarish; mexanik unutmaydi.
- **Manba:** v1-A + texnik amaliyot (TPM)
- **Dalil (kod):** `[Module-16] Item 123` — `SELECT count(*) FROM mes_maintenance_tasks` → **0 qator**; audit tasdiqlaydi: bu **vazifa-jurnali** jadvali, standart-ish katalogi **emas**. Ya'ni master-data jadvali umuman mavjud emas.
- **Nima yetishmaydi:** ⌨️ **Kod/data-kamchiligi (sof, hozir qurilishi mumkin)** — mashina-turi bo'yicha standart TO ishlari katalogi (vazifa-jurnalidan **alohida** jadval) yaratilmagan va seed qilinmagan. 🔩 CAPEX ta'siri **YO'Q** — bu sof master-data vazifasi. ⭐ **Egasi-data kerak:** standart TO protseduralari va ularning davriyligi egasidan/mexanikdan.
- **Bog'liqlik:** EP-IOT-016 (jadval), EP-IOT-046 v2 (kalibrovka), EP-IOT-008 (anomaliya→vazifa)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-016 (jadval), EP-IOT-046 v2 (kalibrovka)
- **Xoch-havolalar:** `[Module-16] Item 123` · `TASDIQ-2146 §16 #73` · `QISM C 16.73`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-018 · Energiya (tok) iste'molini kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mashina darajasida o'lchash (har mashina necha kVt) — sababni topadi. IoT energiya-sensor hali yo'q (egasi); o'rnatish CAPEX talab — fazaviy. Avval umumiy sex hisoblagichi (B) bo'lishi mumkin.
- **Manba:** v1-A + egasi (sensor hali yo'q)
- **Dalil (kod):** `[Module-16] Item 124` (= Item 17/87 takrori) — `iot-main.controller.ts:144-157` **501 (Not Implemented)** qaytaradigan endpoint. `EXTRACTION QISM A #17`: "energiya endpoint 501 (SB0345 STILL-OPEN, sensor 0)".
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (ildiz)** — energiya-hisoblagich/datchik sotib olinmagan va o'rnatilmagan; **hech qanday energiya ma'lumoti mavjud emas**. Decisions o'zi "o'rnatish CAPEX talab — fazaviy" deb aniq yozgan. ⌨️ Kod-kamchiligi (ikkilamchi): endpoint 501 stub, lekin **buni to'ldirish ma'nosiz** — ma'lumot manbasi yo'q. ⭐ Egasi B-variantni (avval umumiy sex hisoblagichi) tanlasa, **arzonroq CAPEX bilan** boshlanishi mumkin.
- **Bog'liqlik:** **Ildiz-bloker** EP-IOT-019, EP-IOT-020, EP-IOT-030 uchun (Item 27/87/124/125/126/136 hammasi shunga bog'liq). EP-IOT-001 (umumiy datchik-CAPEX)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-019/020 (energiya hisobot/birlik), EP-IOT-030 (Finance tannarx)
- **Xoch-havolalar:** `[Module-16] Item 124` · `[Module-16] Item 17` *(taxminiy)* · `[Module-16] Item 87` *(takror)* · `EXTRACTION QISM A #17` · `TASDIQ-2146 §16 #74` · `QISM C 16.74`
- **Δ 2026-07-11→08-07:** `2cfeb8c2` (2026-08-06) — `iot-main.controller.ts` dan o'lik `notImplemented` **importi** olib tashlandi (0 chaqiruvchi). Bu **kosmetik tozalash**, endpoint holatini o'zgartirmaydi.

### EP-IOT-019 · Energiya bo'yicha hisobot va ogohlantirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — norma + oshganda ogohlantirish + haftalik energiya hisoboti. Bo'sh turib tok yeyish (EP-IOT-034 v2) eng oson tejaladigan xarajat. Energiya-sensor o'rnatilgach.
- **Manba:** v1-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 125` — xuddi shu **501** endpoint tasdiqlangan; asosiy ma'lumot manbasi bo'lmagani uchun ustiga hisobot/ogohlantirish qatlami **umuman qurilmagan**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (qattiq bloker)** — EP-IOT-018 ga to'liq bog'liq; energiya datchigi yo'q. ⌨️ Kod-kamchiligi: haftalik hisobot cron'i va norma-oshdi ogohlantirishi yozilmagan — **lekin ma'lumotsiz sinab bo'lmaydi**. ⭐ **Egasi-data:** energiya normasi (kVt chegarasi) `business_settings` ga default bilan qo'yilishi kerak.
- **Bog'liqlik:** EP-IOT-018 (qattiq bloker), EP-IOT-034 v2 (idle tok)
- **action:** CRON
- **⤳ Ta'sir:** Moliya (tejash), EP-IOT-034 v2 (idle tok)
- **Xoch-havolalar:** `[Module-16] Item 125` · `TASDIQ-2146 §16 #75` · `QISM C 16.75`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-020 · Birlik mahsulotga energiya sarfi (ShVB statistikasi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avtomatik (energiya / MES dona) + GSD'ga ulash. ShVB GSD ko'rsatkichi. Energiya-sensor + MES dona ikkalasi kerak → fazaviy.
- **Manba:** v1-A + ShVB GSD (karta-model) + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 126` — xuddi shu **501** endpoint tasdiqlangan; birlikka-hisob asosiy energiya ma'lumotisiz ishlay olmaydi.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (qattiq bloker)** — formulaning **maxraji** (MES dona) allaqachon bor (`production_sessions` 8 qator), **surati** (energiya) yo'q. Ya'ni datchik kelishi bilan hisob darhol mumkin. ⌨️ Kod-kamchiligi: GSD'ga ulash zanjiri ham yo'q (EP-IOT-025 bilan bir xil bo'shliq).
- **Bog'liqlik:** EP-IOT-018 (qattiq bloker), EP-IOT-025 (karta GSD), EP-IOT-051 (ShVB GSD)
- **action:** EVENT
- **⤳ Ta'sir:** ShVB GSD (EP-IOT-051), tannarx, samaradorlik trendi
- **Xoch-havolalar:** `[Module-16] Item 126` · `TASDIQ-2146 §16 #76` · `QISM C 16.76`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-021 · Sex katta ekrani (Andon tablosi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — katta tablo: barcha mashina holati + to'xtaganlari qizil + jonli yangilanadi. Tez ko'rinish, boshliq tepada turmaydi. Andon = norma vs haqiqiy (EP-IOT-036 v2/Q36) bilan birlashadi.
- **Manba:** v1-A + ShVB Y37 (machineStatus jonli) + kitob (Andon norma)
- **Dalil (kod):** `[Module-16] Item 127` — `IotGateway` **ro'yxatdan o'tgan** (real) deb tasdiqlangan va `machine-status-current` uslubidagi ma'lumot mavjud (`machine_status_logs`=**9 qator**), lekin `find artifacts/erp-dashboard/src -iname "*andon*"` → **0 natija**: FE'da Andon grid sahifasi **umuman yo'q**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — BE quvuri (WebSocket gateway + `machine_status_logs`) **tayyor**; faqat FE Andon grid sahifasi yozilmagan. Audit aynan shunday xulosa qiladi: "backend plumbing (WS gateway) is now actually ready". 🔩 CAPEX ta'siri **kam** — 9 jonli holat-yozuvi allaqachon bor, tablet/qo'lda manba yetarli; datchik faqat yangilanish tezligini oshiradi.
- **Bog'liqlik:** EP-IOT-002 (5 holat), EP-IOT-041 (keyingi ish navbati), EP-IOT-046 (norma vs haqiqiy)
- **action:** READ
- **⤳ Ta'sir:** EP-IOT-036 v2 (target vs haqiqiy), EP-IOT-011 v2 (hozirgi+keyingi ish)
- **Xoch-havolalar:** `[Module-16] Item 127` · `[Module-16] Item 21` *(taxminiy — stale-badge)* · `EXTRACTION QISM A #21` · `TASDIQ-2146 §16 #77` · `QISM C 16.77`
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A #21` (2026-07-04, SB0315/0358) "`IotGateway` NestJS provider sifatida **ro'yxatdan o'tmagan** (o'lik WebSocket)" vs `[Module-16] Item 127` (2026-07-11) "`IotGateway` confirmed **registered** (real)". Kechroq va jonli tekshiruv (Item 127) ustun — gateway 2026-07-04 dan 07-11 gacha ro'yxatga qo'shilgan. Ya'ni **QISM A ning "Andon umuman yo'q" bahosi yarim eskirgan**: BE bor, FE yo'q.
- **Δ 2026-07-11→08-07:** —

### EP-IOT-022 · Operator tableti (mashina yonida)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** **Ha** *(2026-08-06 Δ)*
- **Talab:** A — har mashinada tablet: holat + to'xtash sababi + defekt + smena hisoboti. Audit: iot-tablet controller allaqachon bor. Q116/Q119: uskunada ishlaydigan xodim avto-kunlik hisobot → invoys PDF. Qo'l ish joylari ham tabletdan (EP-IOT-016 v2/Q16).
- **Manba:** audit (iot-tablet controller mavjud) + BARCHA_JAVOBLAR Q116/Q119 + v1-A
- **Dalil (kod):** `[Module-16] Item 128` — `iot-tablet.controller.ts` da **26 endpoint** (`grep -c` bilan sanalgan). FE tasdiqlangan: `artifacts/erp-dashboard/src/pages/IoTTablet.tsx` + 7 ta yordamchi hook fayli (`useIoTTablet*.ts`) + smoke-test fayli. Audit xulosasi: "genuinely the strongest-built part of the IoT module, confirmed both BE and FE".
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (yumshoq)** — jismoniy tabletlar sotib olinganmi, egasi tasdiqlashi kerak (kod tomoni tayyor). ⭐ **Egasi-data blokeri (kritik):** `EXTRACTION QISM A` Step-3 — **0 ta operator-rol foydalanuvchi** mavjud (SB0312), ya'ni hech kim tabletga operator sifatida kira olmaydi; bu butun tablet/smena/GSD/sensor-sessiya oqimini to'sadi. ⌨️ Kod-kamchiligi: rasmiy invoys-PDF varianti (Q119) topilmadi — qv. EP-IOT-027.
- **Bog'liqlik:** ⭐ operator-akkauntlar (egasi-data, SB0312), EP-IOT-027 (smena hisobot), EP-IOT-046/047 v2 (qo'l ish / defekt sabab tablet)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-027 (smena hisobot), EP-IOT-016/027 v2 (qo'l/defekt sabab tablet)
- **Xoch-havolalar:** `[Module-16] Item 128` · `[Module-16] Item 15` *(taxminiy — kashi qo'l ishi)* · `EXTRACTION QISM A #15` · `TASDIQ-2146 §16 #78` · `QISM C 16.78`
- **Δ 2026-07-11→08-07:** ⭐ **Ikki jiddiy "yashil-yolg'on" tuzatildi.** (1) `0f303945` (2026-08-06) — FE `useIoTTablet.ts` `scanMaterial` da `try/catch{ignore}` xatoni yutardi, mutatsiya **har doim "muvaffaqiyatli"** deb hal bo'lardi (401/xato skanlash ham "Material skanlandi" deb ko'rsatilardi); `fetch` HTTP 401/500 da reject qilmagani uchun `res.ok` tekshiruvi qo'shildi. BE `persistKitItemScan` da `UPDATE...RETURNING` natijasi faqat `batchId` berilganda tekshirilardi — mavjud bo'lmagan id bilan skanlash **HAR DOIM `{scanned:true}` qaytarardi**; endi doim tekshiriladi, topilmasa `NotFoundException` (rollback-tx bilan DB-isbotlangan). (2) `f318bbfe` (2026-08-07) — tablet start marshrutiga material-komplekt 2-imzo darvozasi ulandi (qv. EP-IOT-013). (3) `2cfeb8c2` — o'lik `notImplemented` importi olib tashlandi (kosmetik).

### EP-IOT-023 · Sensor uzilganda / signal kelmasa
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "Aloqa yo'q" alohida holat sifatida ko'rsatiladi + texnikga xabar. Halol hisob: "signal yo'q" ≠ "to'xtagan". Bu EP-IOT-041 v2 (noma'lum vaqt ajratish) bilan bir mantiq.
- **Manba:** v1-A + EP-IOT-041 v2 (data sifati)
- **Dalil (kod):** `[Module-16] Item 129` (= Item 12/94 takrori) — `last_signal_at` ustuni **mavjud** deb tasdiqlangan; xom timestamp ustunidan tashqari "signal yo'qoldi → texnikni xabardor qil" bayrog'i/oqimi **tasdiqlanmadi**. `QISM D #12`: `mes/application/queries/get-oee.handler.ts:8-20` real maxraj-hisobi bor (`plannedProductionTime = totalTime − plannedDowntime`, `is_planned=true` maxrajdan chiqariladi), lekin "aloqa yo'q / no-data" **alohida chiqarib-tashlanadigan toifa emas** — faqat `is_planned` bayrog'i.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — `last_signal_at` dan "aloqa yo'q" holatini chiqaruvchi mantiq va texnikka xabar yozilmagan; OEE maxrajidan "no-data" ni chiqaruvchi alohida toifa yo'q. 🔩 CAPEX: datchik bo'lmagani uchun "signal uzildi" hodisasi hech qachon yuz bermaydi — **lekin kodni yozish uchun datchik kutish shart emas**.
- **Bog'liqlik:** EP-IOT-071 (aloqa yo'q OEE maxraji), EP-IOT-014 (OEE), Item 12/94
- **action:** EVENT
- **⤳ Ta'sir:** EP-IOT-041 v2 (noma'lum vaqt), OEE data sifati
- **Xoch-havolalar:** `[Module-16] Item 129` · `[Module-16] Item 12` *(taxminiy)* · `[Module-16] Item 94` *(takror)* · `EXTRACTION QISM A #12` · `QISM D #12` · `TASDIQ-2146 §16 #79` · `QISM C 16.79`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-024 · Holat va xabarlar kimga boradi (karta-model)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — xabar turi bo'yicha kartaga marshrutlanadi (anomaliya→mexanik, uzun to'xtash→sex boshlig'i). Karta-model poydevor: har xabar to'g'ri lavozim kartasiga. Q78/Q79/Q132: hujjat/xabar org-sxema bo'yicha (vertikal+gorizontal), CC orqali.
- **Manba:** BARCHA_JAVOBLAR Q78/Q79/Q132 (org-sxema marshrut) + karta-model + v1-A
- **Dalil (kod):** `[Module-16] Item 130` — `apps/api/src/modules/iot/domain/events/sos-alert-raised.event.ts` mavjud, `iot-tablet.service.ts`, `drizzle-iot-tablet.repo.ts`, `iot-tablet.controller.ts` da havolalari bor — ya'ni **real SOS-alert hodisasi 4 faylda ishlaydi**. Uning ustida karta-model marshrut qoidasi (anomaliya→mexanik, uzun to'xtash→sex boshlig'i) **tasdiqlanmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy)** — xabar-turi ↔ org-karta marshrut jadvali yo'q; hodisa bor, adres yo'q. 🔩 CAPEX ta'siri **YO'Q** — SOS tabletdan keladi, datchik shart emas. ⭐ **Krossmodul bog'liqlik:** Org-struktura modulining karta-marshrut qoidalari (kim-kimga) hamon egasi-data bilan to'ldirilmagan.
- **Bog'liqlik:** Org-struktura karta-marshrut qoidalari (krossmodul), CC (Comm.Center), EP-IOT-028 (Telegram), EP-IOT-008 (anomaliya workflow)
- **action:** EVENT
- **⤳ Ta'sir:** CC (Comm.Center), NTF, EP-IOT-028 (Telegram)
- **Xoch-havolalar:** `[Module-16] Item 130` · `TASDIQ-2146 §16 #80` · `QISM C 16.80`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-025 · Mashina samaradorligini kartaga bog'lash (GSD)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mashina OEE/uptime → operator/mexanik kartasi GSD'ga avto kiradi. Karta-model: natija lavozimga bog'lanadi; operator o'z mashinasi uchun javob beradi. Q116 (uskuna xodimi STKP/hisobot avto). Adolatlilik uchun idle/material chiqarib tashlanadi (EP-IOT-052 v2).
- **Manba:** karta-model (GSD lavozimga) + BARCHA_JAVOBLAR Q116 + ShVB Y37 (iotGsd) + v1-A
- **Dalil (kod):** `[Module-16] Item 131` — `production_sessions.operator_card_id` ustuni **mavjud**; `machine_crews`=**2 qator**. Uchdan-uchgacha (end-to-end) avto-GSD→karta hodisasi **tasdiqlanmadi**. `EXTRACTION QISM A #38`: `ckp-mes-feed` listener RESOLVED (SB0003/0184), lekin data siyrak.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy)** — OEE/uptime natijasi kartaning GSD yozuviga qaytmaydi (SB0300/0326, top-list #9: "per-karta samaradorlik rollup ishlamaydi"); idle/material vaqtini adolat uchun chiqarib tashlash mantiqi ham yo'q. 🔩 CAPEX ta'siri **kam** — `operator_card_id` va OEE kalkulyatori tayyor, faqat oxirgi bo'g'in ulanmagan.
- **Bog'liqlik:** EP-IOT-014 (OEE), EP-IOT-003 (uptime), EP-IOT-052 v2 (adolatli bog'lash), Item 104/105 (GSD hodisa zanjiri)
- **action:** EVENT
- **⤳ Ta'sir:** HR (KPI/bonus), ShVB GSD, EP-IOT-052 v2 (adolatli bog'lash)
- **Xoch-havolalar:** `[Module-16] Item 131` · `[Module-16] Item 29` *(taxminiy — og'irlikli GSD)* · `[Module-16] Item 38` *(taxminiy — ЦКП og'irligi)* · `EXTRACTION QISM A #29` · `EXTRACTION QISM A #38` · `TASDIQ-2146 §16 #81` · `QISM C 16.81`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-026 · Defekt/sifat muammosini mashinaga bog'lash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — defekt → mashina + smena + vaqt avto bog'lanadi (MES orqali). Qaysi mashina ko'p brak chiqaradi → sozlash/ta'mir kerakligi. Kitob брак% + смена (А/Б/С) bilan bog'liq (EP-IOT-008/010 v2).
- **Manba:** v1-A + kitob (брак% + смена) + MES integratsiya
- **Dalil (kod):** `[Module-16] Item 132` — `iot-tablet.controller.ts:757` defekt endpoint'i real: `production_sessions`/`downtime_events` ga yozadi va kod-izohiga ko'ra (757-784 satrlar) QC ning `ReportDefectCommand` iga **ko'prik quradi**. Pareto/mashina-bo'yicha agregatsiya hisoboti grep bilan **topilmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — "qaysi mashina eng ko'p brak chiqaradi" Pareto-tahlil hisoboti yozilmagan. Defekt yozish + QC ko'prigi **ishlaydi**. 🔩 CAPEX ta'siri **YO'Q** — defekt operator tabletidan kiritiladi.
- **Bog'liqlik:** QC (Pareto), EP-IOT-060 (переделка kodi), EP-IOT-073/074 (brak chegarasi), EP-IOT-040 (smena)
- **action:** EVENT
- **⤳ Ta'sir:** QC (Pareto), EP-IOT-027 v2 (defekt sabab), EP-IOT-021 v2 (brak chegarasi)
- **Xoch-havolalar:** `[Module-16] Item 132` · `[Module-16] Item 43` *(taxminiy — brak↔buyurtma vaqt bo'yicha)* · `EXTRACTION QISM A #43` · `TASDIQ-2146 §16 #82` · `QISM C 16.82`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-027 · IoT smena hisoboti (avtomatik)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avto smena hisoboti + sex boshlig'iga/Telegram'ga yuboriladi. Q116/Q119: uskunada ishlaydigan xodim hisoboti **avtomatik yuboriladi, rasmiy invoys PDF** (qancha ishlagani/kutilgan natija/oylik/avans/qarz). ShVB Y37 `shiftProductivity` + `iotReport`.
- **Manba:** BARCHA_JAVOBLAR Q116/Q119 (avto invoys PDF) + ShVB Y37 (iotReport) + v1-A
- **Dalil (kod):** `[Module-16] Item 133` — `apps/api/src/modules/iot` da "completion-report" grep qilindi: manba jadvalning "real completion-report endpoint" da'vosi fayl-strukturasiga mos (rad etilmagan), lekin IoT modulida "invoys"/"pdf" grep'i → **invoys-uslubidagi PDF generatori topilmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — Q119 talab qilgan **rasmiy invoys-PDF** varianti (qancha ishlagani / kutilgan natija / oylik / avans / qarz) yozilmagan; avto-jo'natish (sex boshlig'i / Telegram) ham tasdiqlanmagan. 🔩 CAPEX ta'siri **YO'Q** — hisobot sessiya-ma'lumotidan tuziladi.
- **Bog'liqlik:** EP-IOT-022 (tablet), EP-IOT-028 (Telegram), HR (oylik/avans/qarz ma'lumoti)
- **action:** CRON
- **⤳ Ta'sir:** ShVB haftalik statistika, HR (xodim hisoboti), Telegram
- **Xoch-havolalar:** `[Module-16] Item 133` · `[Module-16] Item 46` *(taxminiy — smena PDF muqobil ish)* · `EXTRACTION QISM A #46` · `QISM D #46` · `TASDIQ-2146 §16 #83` · `QISM C 16.83`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-028 · Telegram orqali IoT xabarlari (ShVB bot)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — faqat muhim hodisalar (uzun to'xtash, anomaliya, ta'mir kerak) Telegram'ga. Q101/Q102: har modul uchun alohida bot (ERP'ga ulangan); Q140: bildirishnoma vaqtlari sozlanadi. Shovqinsiz = foydali.
- **Manba:** BARCHA_JAVOBLAR Q101/Q102/Q140 (modul boti + sozlanadi) + ShVB Y38 + v1-A
- **Dalil (kod):** `[Module-16] Item 134` — `iot_alerts`=**0 qator**; `anomaly-detected.handler.ts` **to'liq o'qildi** — unda **hech qanday Telegram jo'natish chaqirig'i yo'q**, faqat `iot_alerts` INSERT va MES pauza-buyrug'i.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (aniq va hozir qurilishi mumkin)** — `anomaly-detected.handler.ts` ichiga (yoki `iot_alerts` INSERT ustidagi listener'ga) Telegram-bot jo'natishi qo'shilishi kerak. 🔩 CAPEX-gate (ikkilamchi): datchik yo'qligi sababli jo'natiladigan hodisa 0. ⭐ **Egasi-data:** qaysi hodisa turlari "muhim" sanaladi va bot/kanal konfiguratsiyasi egasidan kerak (Telegram token — modul bo'ylab umumiy bloker).
- **Bog'liqlik:** EP-IOT-006/008 (anomaliya quvuri), EP-IOT-024 (marshrut), Telegram token (umumiy bloker), EP-IOT-073 (brak alert)
- **action:** EVENT
- **⤳ Ta'sir:** NTF, CC marshrut (EP-IOT-024), tungi smena (EP-IOT-049 v2)
- **Xoch-havolalar:** `[Module-16] Item 134` · `[Module-16] Item 7` *(taxminiy)* · `EXTRACTION QISM A #7` · `TASDIQ-2146 §16 #84` · `QISM C 16.84`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-029 · Mashinalar reestri (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yagona mashinalar reestri (nomi/turi/inventar/sex/sana/mas'ul karta) — barcha IoT/ta'mir/sifat shunga bog'lanadi. Yagona haqiqat manbai. Kitob "Станоклар норма" ro'yxati 1:1 seed (EP-IOT-031 v2).
- **Manba:** v1-A + kitob (Станоклар норма reestri) + master-data prinsip (yagona haqiqat)
- **Dalil (kod):** `[Module-16] Item 135` (= Item 51 takrori) — `equipment`=**7 qator**, nomlar **generik DEMO**; struktura kanonik (yagona jadval), lekin mazmun ishlab-chiqarish-real emas.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (sof)** — struktura tayyor, faqat 7 ta demo-nom haqiqiy "Станоклар норма" nomlariga almashtirilishi kerak (SM-52/SM-72/KBA-105/Тигель 1-10/Гофра линия/ФСМ). ⌨️ Kod-kamchiligi **YO'Q**. 🔩 CAPEX ta'siri **YO'Q** — reestr datchiksiz ham to'liq ishlaydi. ⚠️ Bu **#89 30-mashina ro'yxati** egasi-data blokeri bilan bir xil.
- **Bog'liqlik:** EP-IOT-031 (kitob nomlari 1:1), EP-IOT-032 (norma), **hamma IoT operatsiyasi**
- **action:** CREATE
- **⤳ Ta'sir:** **Hamma IoT operatsiyasi**, EP-IOT-031 v2 (kitob nomlari), texnik xizmat, defekt
- **Xoch-havolalar:** `[Module-16] Item 135` · `[Module-16] Item 51` *(takror)* · `TASDIQ-2146 §16 #85` · `QISM C 16.85` · `QISM C 16.1`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-030 · Energiya iste'molini Finance bilan bog'lash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — energiya sarfi → tannarxga avto qo'shiladi (Finance bilan ulanadi). To'liq biznes ko'rinish; energiya = real pul. Energiya-sensor (EP-IOT-018) o'rnatilgach faollashadi → fazaviy.
- **Manba:** v1-A + oltin-ip (tannarx) + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 136` — xuddi shu `iot-main.controller.ts:144-157` **501** endpoint; GL/Finance'ga oqadigan energiya ma'lumoti **mavjud emas**. `EXTRACTION QISM A #27`: "energiya endpoint 501 (SB0345), sensor 0".
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (ildiz, EP-IOT-018 orqali)** — energiya datchigi yo'q. ⌨️ **Kod-kamchiligi (parallel)** — kVt×koeffitsient→GL yozuv job'i yozilmagan; audit buni "straightforward given GL posting patterns already used elsewhere" deb baholaydi, ya'ni **ma'lumot kelishi bilan tez quriladi**. ⭐ **Egasi-data:** aniq GL hisob-raqam xaritasi (GL mapping) egasidan kerak — bu umumiy ochiq blokerlardan biri.
- **Bog'liqlik:** EP-IOT-018 (qattiq bloker), EP-IOT-020, GL mapping (egasi-data), Item 27/87/124/125/126
- **action:** EVENT
- **⤳ Ta'sir:** Finance (tannarx/foyda), EP-IOT-018/020 (energiya)
- **Xoch-havolalar:** `[Module-16] Item 136` · `[Module-16] Item 27` *(taxminiy)* · `EXTRACTION QISM A #27` · `TASDIQ-2146 §16 #86` · `QISM C 16.86`
- **Δ 2026-07-11→08-07:** —

---

### ⎯⎯ I QISM davomi — v2 (kitob-grounded) qarorlar: EP-IOT-031..083 ⎯⎯

> Bu blok `decisions/16-iot.md` ning "II QISM — v2" bo'limiga mos keladi (hammasi EP-kodli,
> shuning uchun bu registrda **I QISM ichida** qoladi; registrning II QISM'i EP-kodsiz bandlar uchun).
> `FULL-ITEM-LEVEL` xaritalashi: **Item 51..106** ← `TASDIQ-2146 §16 #1..#56`. §16 da **3 ta qator
> `decisions/` dagi mustaqil EP emas, balki **sub-savol**: `#3`/Item 53 (norma imzo-zanjiri) =
> EP-IOT-032 sub, `#6`/Item 56 (udar→TO eslatmasi) = EP-IOT-034 sub, `#21`/Item 71 (smena uzunligi
> 8/10/12) = EP-IOT-048 sub. Shu sababli 56 item ↔ 53 EP-kod. Aniq offset:
> Item 51-52 → EP 031-032 · Item 54-55 → EP 033-034 · Item 57-70 → EP (Item−22) · Item 72-106 → EP (Item−23).
> Batafsil: **III QISM §1**.

### EP-IOT-031 · Mashina reestri "Станоклар норма" jadvaliga 1:1 mos
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — reestr xuddi "Станоклар норма" nomlari bilan seed (SM-52/SM-72/KBA-105/Тигель 1-10/Гофра линия/ФСМ/...). Zavod allaqachon shu nomlar bilan ishlaydi; yangi nom = smena tabeli bilan nomuvofiqlik.
- **Manba:** kitob (Станоклар норма.xlsx aniq nomlar) + EP-IOT-029 v1 (yagona reestr) + v2-A
- **Dalil (kod):** `[Module-16] Item 51` — `SELECT id, name, type FROM equipment LIMIT 10` → **7 qator**, nomlar generik: "Ofset mashina #1 (DEMO)", "Offset Bosma Mashinasi 1", "Flexoprint Mashinasi 1", "Qirqish Dastgohi 1" — talab qilingan "SM-52/KBA-105/Тигель/Гофра/ФСМ" nomlanishiga **mos emas**.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (sof, boshqa hech narsa emas)** — jadval strukturasi va 7 qator bor; faqat haqiqiy mashina ro'yxati (nom/tur/inventar) kiritilishi kerak. Audit: "pure data-seeding task, needs owner-supplied real machine list". ⌨️ Kod-kamchiligi **YO'Q**. 🔩 CAPEX ta'siri **YO'Q**. ⚠️ Bu **#89 "30-mashina ro'yxati"** ochiq egasi-savoli bilan bir xil bloker.
- **Bog'liqlik:** EP-IOT-029 (v1 reestr), EP-IOT-032 (norma — reestr real bo'lmasa norma yozib bo'lmaydi)
- **action:** CREATE
- **⤳ Ta'sir:** MES, Ishlab chiqarish (norma), Smena tabeli, EP-IOT-029
- **Xoch-havolalar:** `[Module-16] Item 51` · `[Module-16] Item 135` *(takror)* · `TASDIQ-2146 §16 #1` · `QISM C 16.1`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-032 · Har mashinaga "норма штук 1 час" qiymati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mashina kartasida norma/soat + norma/12 soat saqlanadi; IoT haqiqiy bilan solishtiradi (performance % avto). Kitob "норма штук 1 час" + "за 12 часов" aniq bor. **Sub (norma kim tasdiqlaydi):** A — "Согласовано РД4 + Утверждено Ген.Директор" imzo-zanjir (kitobdagidek, EP-IOT-054 bilan bir).
- **Manba:** kitob (норма штук 1 час/12 часов + РД4/Ген.Директор imzo) + v2-A + sub-A
- **Dalil (kod):** `[Module-16] Item 52` — `information_schema` da `work_centers` bo'yicha `norma%` qidirildi → faqat `norma_kg_per_shift`, `norma_m2_per_shift` (**sex/smena darajasi**). **Mashina-darajadagi `norma_per_hour`/`norma_per_12h` ustuni hech qayerda yo'q.** Sub-savol `[Module-16] Item 53`: `apps/api/src/modules/iot` da "EP-IOT-054" grep → **0 mos**, norma-tasdiq zanjiri endpoint'i yo'q.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — `equipment` ga (`work_centers` ga **emas**) `norma_per_hour`/`norma_per_12h` ustunlari qo'shilishi va IoT taqqoslashi ulanishi kerak; schema-o'zgarish Q-35 darvozasi bilan **allaqachon ruxsat etilgan**. ⭐ **Egasi-DATA:** har mashina uchun aniq norma qiymatlari egasidan kerak (schema emas, data). 🔩 CAPEX ta'siri **YO'Q** — norma qo'lda kiritiladi, datchik faqat haqiqiy tomonini o'lchaydi.
- **Bog'liqlik:** EP-IOT-031 (reestr real bo'lishi shart — qattiq bloker), EP-IOT-054 (imzo-zanjiri), EP-IOT-014 (OEE Performance)
- **action:** CREATE
- **⤳ Ta'sir:** OEE Performance, EP-IOT-024 v2 (tasdiq zanjiri), HR (oylik)
- **Xoch-havolalar:** `[Module-16] Item 52` · `[Module-16] Item 53` *(sub — imzo-zanjiri)* · `TASDIQ-2146 §16 #2` · `TASDIQ-2146 §16 #3` · `QISM C 16.2` · `QISM C 16.3`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-033 · O'lchov birligi mashinaga qarab (м2/лист/штук/удар)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mashinada o'z birligi. Kitob aniq: Гофра=м2, ofset=лист, Тигель=удар/лист, qolgan=штук. Hammasini "dona"ga keltirsak gofra/tigel xato chiqadi.
- **Manba:** kitob (м2/лист/штук/удар aniq taqsimot) + v2-A
- **Dalil (kod):** `[Module-16] Item 54` — `production_sessions` ustunlari sanaldi (**38 ustun**), `unit`/`uom` ustuni **yo'q**. Ya'ni miqdor birliksiz `qty` sifatida saqlanadi.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — `production_sessions` ga `unit` ustuni qo'shish (yoki `equipment.type` dan yechish) va hisobotlarda ishlatish. 🔩 CAPEX ta'siri **YO'Q** — birlik master-data, datchikka bog'liq emas. ⚠️ Bu **jimgina xato manbai**: hozir gofra м2 va tigel удар bir xil birliksiz `qty` da yig'iladi.
- **Bog'liqlik:** EP-IOT-014 (OEE), EP-IOT-034 (udar/лист), EP-IOT-031 (mashina turi)
- **action:** CREATE
- **⤳ Ta'sir:** OEE, Ishlab chiqarish hisoboti, Norma, EP-IOT-004 v2 (udar)
- **Xoch-havolalar:** `[Module-16] Item 54` · `TASDIQ-2146 §16 #4` · `QISM C 16.4`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-034 · Tigel uchun "удар/лист" hisoblagichi alohida
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Тигель'da udar va лист ikkalasi alohida hisoblanadi (resurs + ishlab chiqarish). Tigel resursi udar soniga bog'liq. **Sub (udar→texnik xizmat eslatmasi):** Ha — har N mln udarda eslatma (EP-IOT-056 qolip resursi bilan bir). IoT zarba-sensor hali yo'q → fazaviy.
- **Manba:** kitob (Тигель udar/лист) + v2-A + sub-Ha + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 55` — `iot_sensors`=**0 qator**; hech bir IoT jadvalida udar/stroke hisoblagich ustuni topilmadi. Sub-savol `[Module-16] Item 56`: `ow_molds` ustunlari = `id, order_id, vendor, order_sent_at, expected_at, received_at, status, reject_reason, photo_proof_url` — **stroke-counter/resurs-chegara ustuni yo'q**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — Тигель pressiga jismoniy **zarba-sanovchi datchik** o'rnatilmagan; audit "Code-buildable-now — n/a until sensor exists" deb aniq belgilaydi. ⌨️ Kod-kamchiligi (parallel, hozir qurilishi mumkin): `ow_molds` ga `stroke_count`/`resource_remaining` ustuni va 1 mln-udar eslatma job'i — **datchiksiz ham qo'lda kiritish bilan ishlashi mumkin**.
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri), EP-IOT-056 (qolip resursi), EP-IOT-033 (birlik), EP-IOT-016 (TO)
- **action:** EVENT
- **⤳ Ta'sir:** EP-IOT-026 v2 (qolip resursi), Texnik xizmat, OEE
- **Xoch-havolalar:** `[Module-16] Item 55` · `[Module-16] Item 56` *(sub — TO eslatmasi)* · `[Module-16] Item 79` *(takror — qolip resursi)* · `TASDIQ-2146 §16 #5` · `TASDIQ-2146 §16 #6` · `QISM C 16.5` · `QISM C 16.6`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-035 · SM/KBA bosma ranglar soni (seksiya) kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har bosma ishi uchun rang/seksiya soni (4+0/4+4) yoziladi (texnik topshiriqdan). Bo'yoq sarfi/plastina/tezlik rang soniga bog'liq. Texnik karta (PP)dan keladi, IoT o'qiydi.
- **Manba:** kitob (ofset SM/KBA + краска) + v2-A
- **Dalil (kod):** `[Module-16] Item 57` — `production_sessions` ustun ro'yxatida `color_count`/`section` ustuni **yo'q**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — `color_count` ustuni qo'shilib, sessiya boshlanishida texnik topshiriqdan to'ldirilishi kerak. 🔩 CAPEX ta'siri **YO'Q** — qiymat texnik kartadan keladi, datchikdan emas. ⚠️ Bu ustun yo'qligi `EXTRACTION QISM A #41` (rang o'zgarsa qo'shimcha bo'yoq→PR) oqimini ham to'sadi.
- **Bog'liqlik:** EP-IOT-041 v2-oqim (rang-o'zgarish tasdig'i, `QISM D #41` = Yo'q), Ombor (bo'yoq), PP texnik karta
- **action:** UPDATE
- **⤳ Ta'sir:** Ombor (bo'yoq), Dizayn (rang), Norma, EP-IOT-031 v2 (bo'yoq daraja)
- **Xoch-havolalar:** `[Module-16] Item 57` · `[Module-16] Item 41` *(taxminiy)* · `EXTRACTION QISM A #41` · `QISM D #41` · `TASDIQ-2146 §16 #7` · `QISM C 16.7`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-036 · "иш йук" (idle) alohida holat sifatida
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(STALE-DOC — qator-soni)* *(2026-07-11)*
- **Talab:** A — "Иш йук" alohida toifa (rejalashtirish kamchiligi), nosozlikdan ajraladi. Kitob takror: "ходимлар иш йуклиги сабабли...". Aralashtirsak nosozlik statistikasi buziladi, ShVB noto'g'ri xulosa.
- **Manba:** kitob (иш йук real izohlar) + EP-IOT-005 (sabab ro'yxati) + v2-A
- **Dalil (kod):** `[Module-16] Item 58` — manba jadval "7 kod bor, idle YO'Q" deydi; jonli `SELECT * FROM mes_downtime_reasons ORDER BY id` → **16 qator** (id 1-7 asl + 17-25 `created_at` bo'yicha 2026-07-04 da qo'shilgan), toifalar: breakdown/material/setup/maintenance/quality/organizational. **16 kodning hech biri so'zma-so'z "idle"/"иш йук" emas** — eng yaqini `DT-MAT-WAIT` ("Materialni kutish"), bu **boshqa tushuncha**.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA + seed** — "иш йук" (rejalashtirish kamchiligi) kodi mavjud emas; audit: "pure seed-data task once owner confirms the exact idle-code taxonomy". ⌨️ Kod-kamchiligi: struktura tayyor, faqat seed. 🔩 CAPEX ta'siri **YO'Q**. ⚠️ **Muhim farq:** "Materialni kutish" ≠ "иш йук" — birinchisi ta'minot muammosi, ikkinchisi rejalashtirish kamchiligi; aralashtirilsa ShVB noto'g'ri xulosa chiqaradi (aynan decisions ogohlantirgan xato).
- **Bog'liqlik:** EP-IOT-005 (sabab ro'yxati), EP-IOT-059 (muqobil ish), EP-IOT-070 (OEE'dan chiqarish)
- **action:** CREATE
- **⤳ Ta'sir:** MPS/MRP (rejalashtirish), ShVB samaradorlik, EP-IOT-029 v2 (muqobil ish)
- **Xoch-havolalar:** `[Module-16] Item 58` · `[Module-16] Item 10` *(taxminiy — kamera muqobil ish tasdig'i)* · `EXTRACTION QISM A #10` · `TASDIQ-2146 §16 #8` · `QISM C 16.8`
- **⚠️ ZIDDIYAT:** `QISM C 16.8` (2026-06-27) "7 kod bor, idle YO'Q, struktura kengaytirishga tayyor" vs `[Module-16] Item 58` (2026-07-11) "16 qator". Son o'sgan, **mazmun bo'shlig'i o'zgarmagan**.
- **Δ 2026-07-11→08-07:** —

### EP-IOT-037 · "Колиб тайёрланмагани" to'xtash sababi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Колиб тайёр эмас" alohida sabab + mas'ul bo'lim (qolip tsexi) biriktiriladi. Kitob real: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат". Javobgarlik aniq.
- **Manba:** kitob ("колиб таергарлик -4 соат" real izoh) + EP-IOT-005 + v2-A
- **Dalil (kod):** `[Module-16] Item 59` — xuddi shu `mes_downtime_reasons` mazmun-dumpi (16 qator): "Колиб тайёр эмас" ga mos kod **yo'q**; `DT-SETUP` ("Dastgoh sozlash") umumiy tashlandiq sifatida qolgan.
- **Nima yetishmaydi:** ⌨️ **Kod/data-kamchiligi (sof, hozir qurilishi mumkin)** — `DT-MOLD-NOTREADY` kodi + "mas'ul bo'lim" maydoni seed qilinishi kerak. Audit: "Owner-gated — none beyond seed-data approval", ya'ni **egasi-blokeri deyarli yo'q**. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-005 (sabab ro'yxati), EP-IOT-053 v2 (plastina holati), Qolip tsexi (org-karta mas'ul)
- **action:** CREATE
- **⤳ Ta'sir:** Qolip/штамп tsexi, Ishlab chiqarish reja, EP-IOT-053 v2 (plastina holati)
- **Xoch-havolalar:** `[Module-16] Item 59` · `TASDIQ-2146 §16 #9` · `QISM C 16.9`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-038 · "Иш икки марта кайта урилган" (переделка) brak sabab kodi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "Кайта урилди (переделка)" sabab kodi + qisqa izoh. Kitob: "иш икки марта кайта урилган колиб яримтали + подрезка". Qayta urish = vaqt + material yo'qotish; sababi yozilsa takror oldini olinadi.
- **Manba:** kitob ("кайта урилган" real izoh) + EP-IOT-005 + v2-A
- **Dalil (kod):** `[Module-16] Item 60` — `SELECT code, name_uz, name_ru FROM defect_catalog ORDER BY id` → **23 qator**, hammasi sifat-defekt turlari (o'lcham, dog', yirtiq, bo'yoq muammolari) — **hech biri "переделка"/rework emas**. Endpoint `iot-tablet.controller.ts:757` `@Post('production-sessions/:id/defect')` real va **erkin-matn `reasonDescription`** qabul qiladi.
- **Nima yetishmaydi:** ⌨️ **Kod/data-kamchiligi (sof seed vazifasi)** — "переделка" katalog kodi yo'q, shuning uchun operator uni erkin matnda yozadi va **Pareto tahlil qilib bo'lmaydi** (aynan decisions ogohlantirgan muammo). 🔩 CAPEX ta'siri **YO'Q**. ⚠️ `QISM D #23`: "переделка qo'shimcha material → ALOHIDA buyurtma tannarxiga" oqimi ham **yo'q** (`rework|peredelka|qayta.?ishlov` grep → faqat `oee-calculator.service.ts:29` izohi).
- **Bog'liqlik:** EP-IOT-005, EP-IOT-057 (defekt sabab ro'yxati), EP-IOT-026 (defekt→mashina), QC Pareto
- **action:** CREATE
- **⤳ Ta'sir:** QC (брак%), Norma, EP-IOT-027 v2 (defekt sabab ro'yxati)
- **Xoch-havolalar:** `[Module-16] Item 60` · `[Module-16] Item 23` *(taxminiy)* · `EXTRACTION QISM A #23` · `QISM D #23` · `TASDIQ-2146 §16 #10` · `QISM C 16.10`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-039 · "Билма заказ настройкаси муракаб" — setup vaqti alohida
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** **STALE-DOC** *(hujjat eskirgan — aslida qurilgan)* *(2026-07-08)*
- **Talab:** A — setup vaqti alohida holat (сozlanmoqda) sifatida sanaladi, OEE'da hisobga olinadi. Kitob: "Билма заказ настройкаси муракаб - вакт кетди". Setup ishlash vaqtiga qo'shilsa norma soxta past.
- **Manba:** kitob ("настройка муракаб - вакт кетди") + EP-IOT-002 (sozlanmoqda holati) + v2-A
- **Dalil (kod):** `[Module-16] Item 61` — manba jadval "setup_seconds/current_stage ustun bor, **sim yo'q**" deydi. Jonli `drizzle-iot-oee.repo.ts` o'qildi: real availability formulasi endi `setup_seconds` ni ish vaqtidan **aniq ayiradi**, ya'ni setup vaqti jonli so'rovda **haqiqatan ham** unumli OEE vaqtidan ajratilgan — "saqlanadi lekin ishlatilmaydi" ustun emas. Commit `81ef299f` (2026-07-08) hujjatdan **keyin** kelgan.
- **Nima yetishmaydi:** **Hech narsa yetishmaydi** — band yopilgan, faqat hujjat eskirgan. ⚠️ Yonaki: setup **chegarasi** (normadan 20% oshsa ogohlantirish, `EXTRACTION QISM A #47`) hamon yo'q va SB0322 bo'yicha formulaning bir qismi `readings>80` proksi bo'lib qolgan. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-014 (OEE), EP-IOT-002 (sozlanmoqda holati), EP-IOT-049 (ish soni × setup)
- **action:** UPDATE
- **⤳ Ta'sir:** OEE (Availability), Norma, Smena hisoboti, EP-IOT-019 v2 (ish soni)
- **Xoch-havolalar:** `[Module-16] Item 61` · `[Module-16] Item 47` *(taxminiy — setup 20% chegarasi)* · `EXTRACTION QISM A #47` · `TASDIQ-2146 §16 #11` · `QISM C 16.11`
- **⚠️ ZIDDIYAT:** `QISM C 16.11` (2026-06-27) "struktura bor, sim yo'q" vs `[Module-16] Item 61` (2026-07-11 jonli) "formula `setup_seconds` ni ayiradi, `81ef299f` 2026-07-08". **Jonli tekshiruv ustun** — band qurilgan.
- **Δ 2026-07-11→08-07:** —

### EP-IOT-040 · Smena (А/Б/С) bo'yicha holat va norma ajratish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har smena (А/Б/С) bo'yicha alohida ko'rsatkich + smena boshlig'iga biriktiriladi. Kitobda smenalar А/Б/С belgilangan. ShVB smena boshliqlarini taqqoslash uchun shart.
- **Manba:** kitob (А/Б/С смена) + Q132/Q133 (smena orgsxemadan) + v2-A
- **Dalil (kod):** `[Module-16] Item 62` — `production_sessions.shift_id` ustuni **mavjud** (jonli sessiyalarda). `apps/api/src/modules/iot` grep'i bo'yicha **smena-bo'yicha KPI agregatsiya endpoint'i topilmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — А/Б/С bo'yicha KPI rollup xizmati/endpoint'i yozilmagan; smena boshlig'i kartasiga biriktirish ham yo'q. 🔩 CAPEX ta'siri **YO'Q** — `shift_id` allaqachon to'ldiriladi.
- **Bog'liqlik:** EP-IOT-058 (smena topshirish), HR (smena boshlig'i KPI), ShVB
- **action:** EVENT
- **⤳ Ta'sir:** HR (smena boshlig'i KPI), ShVB, EP-IOT-010 v2 (smena KPI)
- **Xoch-havolalar:** `[Module-16] Item 62` · `TASDIQ-2146 §16 #12` · `QISM C 16.12`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-041 · "Станокдаги ишлар · кейинги иши" navbat Andon'da
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mashina kartasida "hozirgi ish + keyingi ish" MES'dan kelib ko'rsatiladi. Operator keyingi ishni ko'rsa, qolip/material oldindan tayyorlanadi → to'xtash kamayadi. Zavodda qog'ozda allaqachon yuritiladi.
- **Manba:** kitob (Станокдаги Ишлар + кейинги иши tabel) + EP-IOT-021 (Andon) + v2-A
- **Dalil (kod):** `[Module-16] Item 63` — `SELECT count(*) FROM machine_tasks` → **0 qator**. Audit: "Hard-blocked by Item 21/77 (Andon doesn't exist)".
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof)** — MES vazifa-navbatiga "keyingi ish" so'rovi va uni ko'rsatuvchi ekran yozilmagan; Andon FE sahifasi ham yo'q (EP-IOT-021). 🔩 CAPEX ta'siri **YO'Q** — navbat MES rejadan keladi, datchikdan emas. ⚠️ Decisions ta'kidlaydi: "zavodda **qog'ozda allaqachon yuritiladi**" — ya'ni ma'lumot mavjud, faqat ERP ichida emas (ERP tashqarisida ish YO'Q qoidasini buzadi).
- **Bog'liqlik:** EP-IOT-021 (Andon — qattiq bloker), MES ish navbati
- **action:** READ
- **⤳ Ta'sir:** MES (ish navbati), Ishlab chiqarish reja, EP-IOT-039 v2 (НЗП)
- **Xoch-havolalar:** `[Module-16] Item 63` · `TASDIQ-2146 §16 #13` · `QISM C 16.13`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-042 · Har mashinaga operator va yordamchi biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — smena yozuvida operator + yordamchi(lar) biriktiriladi (HR kartasidan). Kitob tabel: "Оператор: ___ / Ёрдамчи: ___". Brak/rekord kimning smenasida — KPI/o'qitish manzili aniq.
- **Manba:** kitob (Оператор/Ёрдамчи tabel) + karta-model + v2-A
- **Dalil (kod):** `[Module-16] Item 64` — `SELECT count(*) FROM machine_crews` → **2 qator**; `iot-tablet.controller.ts:416` (SELECT) va `:436` (INSERT, maydonlar `master_id, polmaster_id, shogird_id, rokler_id`) real. Ekipaj-biriktirish CRUD **ishlaydi va jonli data'si bor**.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (asosiy bloker)** — atigi 2 qator; sabab `[Module-16] Item 1` dagi **0 operator-rol foydalanuvchi** blokeri (SB0312). Mexanizm ishlaydi, foydalanuvchi yo'q. ⌨️ Kod-kamchiligi **deyarli yo'q**. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** ⭐ operator-akkauntlar (SB0312, egasi-data), EP-IOT-025 (mashina GSD→karta), HR (KPI/darslik)
- **action:** CREATE
- **⤳ Ta'sir:** HR (KPI, darslik), karta-model, EP-IOT-025 (mashina GSD→karta)
- **Xoch-havolalar:** `[Module-16] Item 64` · `[Module-16] Item 1` *(taxminiy — operator-login blokeri)* · `EXTRACTION QISM A #1` · `TASDIQ-2146 §16 #14` · `QISM C 16.14`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-043 · Гофра линия м2 hisoblagich Ombor (karton) bilan bog'lash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ishlab chiqarilgan м2 ↔ sarflangan material м2 avto solishtiriladi, farq ogohlantiriladi. Farq = yo'qotish/brak → isrof/o'g'irlik ko'rinadi. Гофра м2-sensor o'rnatilgach.
- **Manba:** kitob (Гофра м2) + oltin-ip (material balans) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 65` — Item 9 bilan bir xil sweep: **м2-hisoblagich kodi topilmadi**, `iot_sensors`=0. `QISM D #9`: `gofra|m2|counter.?diff|3.?%|qc.?gate` grep → iot/ = **0**; `oee/oee-calculator.service.ts:42` faqat hisoblagich-rollover/soat-drift qo'riqchisi, м2-farq→QC-gate→GL funksiyasi **yo'q**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — Гофра liniyasiga jismoniy м2-sanovchi datchik o'rnatilmagan; audit: "Owner-gated — needs a physical gofra m²-counting sensor (CAPEX decision)", "Code-buildable-now — n/a until sensor exists". ⌨️ Kod-kamchiligi (parallel): 3% farq→QC+ombor signali va "tekshirish kutilmoqda" holati (`EXTRACTION QISM A #9`) hech qayerda yozilmagan — **bu qismni qo'lda o'lchov bilan ham qurish mumkin**.
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri), Ombor material balansi, QC-gate GL, `QISM D #9`
- **action:** EVENT
- **⤳ Ta'sir:** Ombor, Sifat (brak), Moliya, EP-IOT-030 v2 (gofra namlik)
- **Xoch-havolalar:** `[Module-16] Item 65` · `[Module-16] Item 9` *(taxminiy)* · `EXTRACTION QISM A #9` · `QISM D #9` · `TASDIQ-2146 §16 #15` · `QISM C 16.15`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-044 · UV/Трафаретный лак sarfi kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — лак mashinalarida varaq/m2 → lak sarf normasi (haqiqiy ↔ kutilgan). Lak qimmat material; sarf normasi nazorati. Sensor/qo'lda hisob — fazaviy.
- **Manba:** kitob (UV лак/Трафаретный лак) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 66` — Item 39 bilan bir xil sweep: **lak-sarfi kuzatuv jadvali/endpoint'i topilmadi**. `EXTRACTION QISM A #39`: "Qisman — formula-asos mumkin, sensor 0 (SB0316); jonli hisob tasdiqlanmagan".
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy va hozir qurilishi mumkin)** — decisions o'zi vaqtinchalik yechimni belgilagan: **formula bilan hisob** (varaq hajmi × normativ sarf koeffitsienti) datchikgacha ishlaydi, operator tabletdan "aniq sarflangan" ni tuzatish sifatida kiritadi (`vision-1000-answers #39`). Bu formula **yozilmagan** — ya'ni CAPEX kutish shart emas edi. 🔩 CAPEX-gate (ikkilamchi): avtomat o'lchashga o'tish datchikni talab qiladi.
- **Bog'liqlik:** EP-IOT-022 (tablet kiritish), Ombor (лак/химикат), EP-IOT-045 (bir xil naqsh — plyonka)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (лак/химикат), Moliya
- **Xoch-havolalar:** `[Module-16] Item 66` · `[Module-16] Item 39` *(taxminiy)* · `EXTRACTION QISM A #39` · `TASDIQ-2146 §16 #16` · `QISM C 16.16`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-045 · Ламинация plyonka (рулон) sarfi va isrofi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — plyonka sarfi + isrof % har ишда yoziladi, chegaradan oshsa ogohlantiriladi. Yuqori isrof = sozlama/operator muammosi. Fazaviy.
- **Manba:** kitob (Ламинация катта/кичик/полуавтомат) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 67` — `apps/api/src/modules/iot` da "plyonka"/"laminat" grep → **sarf/isrof kuzatuv kodi topilmadi**; `iot_sensors`=0.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy)** — audit aniq belgilaydi: "build consumption-vs-waste tracking **once at least a manual entry point exists (tablet form)**" — ya'ni tablet formasi orqali **datchiksiz ham qurilishi mumkin**. 🔩 CAPEX-gate (ikkilamchi): avtomat o'lchov uchun plyonka-sarf datchigi kerak. ⭐ **Egasi-qarori:** datchikmi yoki qo'lda-kiritish siyosatimi — audit buni egasi-qarori deb belgilagan. ⭐ **Chegara (isrof %)** `business_settings` ga default bilan qo'shilib CRUD orqali sozlanishi kerak.
- **Bog'liqlik:** EP-IOT-022 (tablet), EP-IOT-044 (bir xil naqsh — lak), Ombor (plyonka)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (plyonka), Sifat
- **Xoch-havolalar:** `[Module-16] Item 67` · `TASDIQ-2146 §16 #17` · `QISM C 16.17`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-046 · Степлер/Склейка — qo'l mehnati mashinalari IoT'ga
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — qo'l ish joylari tabletdan qo'lda kiritiladi (норма штук bilan solishtiriladi), sensor yo'q. Qo'l joylariga sensor qiyin/qimmat; lekin norma (kitobda bor) hisoblanishi kerak. IoT umuman o'rnatilmagan = bu eng real yo'l.
- **Manba:** kitob (Степлер 1/2/3, Склейка, Окошка norma) + egasi (IoT yo'q, qo'lda) + EP-IOT-022 (tablet) + v2-A
- **Dalil (kod):** `[Module-16] Item 68` — tablet controller real (26 endpoint); `equipment` 7 qatorining **hech biri stepler/yelim qo'l ish joyi nomida emas** (Item 51 mazmun-dumpi bilan tasdiqlangan).
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (sof)** — tabletdan qo'lda kiritish mexanizmi **real va yetarli darajada umumiy**; faqat Степлер 1/2/3, Склейка, Окошка ish joylari `equipment` reestriga kiritilmagan. ⌨️ Kod-kamchiligi: норма bilan solishtirish EP-IOT-032 ga bog'liq (norma ustuni yo'q). 🔩 CAPEX ta'siri **YO'Q** — decisions aynan "sensor yo'q, tabletdan" deb tanlagan.
- **Bog'liqlik:** EP-IOT-031 (reestr seed — qattiq bloker), EP-IOT-032 (norma), EP-IOT-022 (tablet), EP-IOT-090-oqim (Окошка)
- **action:** CREATE
- **⤳ Ta'sir:** Operator tableti, Norma, EP-IOT-037 v2 (Окошка)
- **Xoch-havolalar:** `[Module-16] Item 68` · `[Module-16] Item 15` *(taxminiy — kashi qo'l ishi)* · `EXTRACTION QISM A #15` · `TASDIQ-2146 §16 #18` · `QISM C 16.18`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-047 · Резка material kirim nuqtasi (zanjir boshi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Резка chiqishi keyingi bosqich uchun "kirish miqdori" bo'lib zanjir bo'ylab kuzatiladi. Keyingi mashina braki oldingi varaq sonidan o'lchanadi; Резка raqami bo'lmasa zanjir yo'qotishini kuzatib bo'lmaydi.
- **Manba:** kitob (Резка birinchi operatsiya) + oltin-ip (operatsiya zanjiri) + v2-A
- **Dalil (kod):** `[Module-16] Item 69` — `apps/api/src/modules/iot` da operatsiyalar orasidagi miqdor-topshirish (chain-of-custody) mexanizmi grep qilindi → **mos kod topilmadi**. `QISM D #45`: `rezka|hisoblagich|5.?%|counter.?diff` iot/ = **0** — hisoblagich-solishtirish→QC-gate→GL funksiyasi yo'q.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — ketma-ket operatsiyalar orasida miqdor-topshirish yozuvi qurilishi kerak (Резка dan boshlab). Audit: "Owner-gated — none identified", ya'ni **egasi-blokeri YO'Q**. 🔩 CAPEX ta'siri **YO'Q** — miqdor tabletdan kiritiladi. ⭐ **Chegara (5% farq)** `business_settings` ga default bilan qo'shilishi kerak.
- **Bog'liqlik:** EP-IOT-092-oqim (operatsiyalararo kutish, bir xil data-model), MES operatsiya zanjiri, QC-gate GL
- **action:** EVENT
- **⤳ Ta'sir:** MES (operatsiya zanjiri), Sifat, EP-IOT-039 v2 (НЗП)
- **Xoch-havolalar:** `[Module-16] Item 69` · `[Module-16] Item 45` *(taxminiy)* · `[Module-16] Item 42` *(bog'liq data-model)* · `EXTRACTION QISM A #45` · `QISM D #45` · `TASDIQ-2146 §16 #19` · `QISM C 16.19`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-048 · "отработано часов" vs 12 soatlik smena
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — smena = 12 soat baza; ishlangan/bo'sh/sozlash/remont soatlarga bo'linadi. Kitob "отработано часов" + "норма штук за 12 часов". Bu ShVB asosiy yo'qotish ko'rsatkichi. **Sub (smena uzunligi 8/10/12 mashinaga qarab):** Ha — mashina/sexga qarab sozlanadi.
- **Manba:** kitob (отработано часов + 12 часов) + Кун тартиби (12 soat) + v2-A + sub-Ha
- **Dalil (kod):** `[Module-16] Item 70` — `production_sessions` da `running_time_seconds`, `stopped_time_seconds`, `setup_seconds` **hammasi mavjud** va real OEE formulasi tomonidan **ishlatiladi**. `production_sessions`=**8 qator**, ya'ni 12-soatlik smena taqsimoti hisoboti amalda sinovdan o'tmagan. Sub-savol `[Module-16] Item 71`: smena-uzunligi konfiguratsiya jadvali/ustuni grep → **0 mos**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi** — (a) 12-soatlik taqsimot hisoboti (ishlangan/bo'sh/sozlash/remont) qurilmagan; (b) **sub-savol:** mashina/sex bo'yicha `shift_length_hours` konfiguratsiya maydoni **yo'q** — hozir 12 soat qattiq taxmin. ⭐ **Egasi-DATA:** har sex/mashina uchun haqiqiy smena uzunligi siyosati. 🔩 CAPEX ta'siri **YO'Q** — vaqt ustunlari sessiyadan keladi.
- **Bog'liqlik:** EP-IOT-014 (OEE), EP-IOT-039 (setup ajratish — qurilgan), EP-IOT-040 (smena), EP-IOT-097-oqim (norma sabab tahlili)
- **action:** EVENT
- **⤳ Ta'sir:** OEE (vaqt tahlili), ShVB, EP-IOT-044 v2 (norma sabab tahlili)
- **Xoch-havolalar:** `[Module-16] Item 70` · `[Module-16] Item 71` *(sub — smena uzunligi)* · `TASDIQ-2146 §16 #20` · `TASDIQ-2146 §16 #21` · `QISM C 16.20` · `QISM C 16.21`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-049 · "ко-во работ" (ish/buyurtma soni) smenada
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — smenada bajarilgan ish soni + har biriga sozlash vaqti sanaladi. Kitob "ко-во работ". Ko'p kichik ish = ko'p sozlash = past norma; buni bilmasak operatorni noto'g'ri ayblaymiz.
- **Manba:** kitob ("ко-во работ") + EP-IOT-039 v2 (setup) + v2-A
- **Dalil (kod):** `[Module-16] Item 72` — `apps/api/src/modules/iot` da smena-bo'yicha ish-soni agregatsiya endpoint'i grep → **0 mos**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (eng oson bandlardan biri)** — audit: "build a `COUNT(production_sessions)` per shift/machine aggregation endpoint (**straightforward given `shift_id` exists**)"; "Owner-gated — none identified". 🔩 CAPEX ta'siri **YO'Q**. ⚠️ Bu band **hech qanday bloker ostida emas** — sof qurilish topshirig'i.
- **Bog'liqlik:** EP-IOT-040 (`shift_id` — mavjud), EP-IOT-039 (setup vaqti — qurilgan), adolatli norma bahosi
- **action:** EVENT
- **⤳ Ta'sir:** Norma (adolatli baho), EP-IOT-044 v2 (sabab tahlili)
- **Xoch-havolalar:** `[Module-16] Item 72` · `TASDIQ-2146 §16 #22` · `QISM C 16.22`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-050 · Брак % chegaradan oshganda avto ogohlantirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — брак % chegaradan oshsa → smena boshlig'i + sifatga darhol signal (ekran + Telegram). Kitobda "брак %" ustuni bor. Brak kech bilinsa partiya yaroqsiz; erta to'xtatish kerak.
- **Manba:** kitob (брак % ustuni) + v2-A + EP-IOT-028 (Telegram)
- **Dalil (kod):** `[Module-16] Item 73` — `iot_alerts`=**0 qator**; ⭐ **`MesBrakLimitRepository` `iot.module.ts` providerlarida MAVJUD** (tasdiqlangan), ya'ni brak-chegara tekshiruvi bor, lekin unga **Telegram-alert ulanishi topilmadi**. `EXTRACTION QISM A #13`: `iot_alert_escalation_log` jadvali tasdiqlanmagan.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (aniq, "yarim-ulangan" naqsh)** — mavjud `MesBrakLimitRepository`/brak-limit tekshiruvini `iot_alerts` INSERT + Telegram jo'natishga **ulash** kerak. Bu **klassik "qurilgan lekin ulanmagan"** holat. ⭐ **Egasi-DATA:** mashina turi bo'yicha brak-foiz chegaralari (EP-IOT-051). 🔩 CAPEX ta'siri **YO'Q** — brak operator tabletidan kiritiladi.
- **Bog'liqlik:** EP-IOT-051 (chegara konfiguratsiyasi — qattiq bloker), EP-IOT-028 (Telegram), `iot_alert_escalation_log` (mavjud emas)
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (QC), ShVB, Telegram, EP-IOT-051 v2 (brak chegarasi)
- **Xoch-havolalar:** `[Module-16] Item 73` · `[Module-16] Item 13` *(taxminiy — eskalatsiya logi)* · `EXTRACTION QISM A #13` · `TASDIQ-2146 §16 #23` · `QISM C 16.23`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-051 · Brak chegarasi mashina turiga qarab
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mashina turiga o'z brak chegarasi (ishlab chiqarish boshlig'i belgilaydi). Gofra/ofset/tigel/kashировka normal brak% turlicha; bitta umumiy chegara = noaniq.
- **Manba:** kitob (mashina turlari farqi) + v2-A
- **Dalil (kod):** `[Module-16] Item 74` — `apps/api/src/modules/iot` da mashina-turi bo'yicha brak-chegara konfiguratsiya jadvali grep → **mos jadval/konfig topilmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi** — `brak_threshold_by_machine_type` konfiguratsiya jadvali yaratilishi kerak. ⭐ **Egasi-DATA (kritik):** har mashina turi uchun aniq brak-foizi. ⚠️ **Qoida eslatmasi (⭐ threshold = doim CRUD):** bu qiymatlar chatda so'ralmasin — `business_settings` ga oqilona default bilan qo'shilib, CRUD ekran orqali IChB tomonidan sozlansin. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-050 (qattiq juftlik — ikkalasi shu konfiguratsiyaga muhtoj), EP-IOT-031 (mashina turi reestri)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-050 v2 (brak ogohlantirish), QC
- **Xoch-havolalar:** `[Module-16] Item 74` · `TASDIQ-2146 §16 #24` · `QISM C 16.24`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-052 · Авто vs ручная кашировка samaradorligi taqqoslash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — авто/yarim-avto/qo'l кашировка solishtirma hisoboti (m2/soat, brak, mehnat). Egasi avto-mashina investitsiya qaytishini raqamda ko'rishi uchun. Kitob кашировка 3 turda.
- **Manba:** kitob (кашировка авто/полуавтомат/ручная) + v2-A
- **Dalil (kod):** `[Module-16] Item 75` — `equipment` mazmun-dumpi faqat generik nomlar ko'rsatadi; **avto-vs-qo'l kashировka turi ajratmasi ham, taqqoslash hisoboti ham yo'q**.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (birlamchi)** — `equipment` da kashировka turlari (avto/yarim-avto/qo'l) ajratilmagan, chunki reestr demo-nomlarda. ⌨️ Kod-kamchiligi: `equipment` ga laminatsiya-turi maydoni + CAPEX taqqoslash hisoboti. 🔩 **CAPEX bilan bog'liq, lekin teskari yo'nalishda** — bu band **datchik talab qilmaydi**; aksincha, u **egasiga CAPEX qaroriga asos beruvchi hisobot** (avto-mashina investitsiyasi o'zini qoplaydimi).
- **Bog'liqlik:** EP-IOT-031 (reestr — qattiq bloker), EP-IOT-001 (datchik ustuvorligi qarori), Moliya CAPEX
- **action:** READ
- **⤳ Ta'sir:** Moliya (CAPEX qaror), ShVB, EP-IOT-001 v1 (sensor ustuvorligi)
- **Xoch-havolalar:** `[Module-16] Item 75` · `TASDIQ-2146 §16 #25` · `QISM C 16.25`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-053 · Mashina "иш %" (yuklanish foizi) ko'rsatkichi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har mashina yuklanish % (kun/hafta) + bo'g'iz (bottleneck) belgilanadi. Kitobda "иш %". Doim band = bo'g'iz; doim bo'sh = ortiqcha quvvat → reja/investitsiya.
- **Manba:** kitob ("иш %") + v2-A
- **Dalil (kod):** `[Module-16] Item 76` (= Item 49 takrori) — OEE/yuklanish hisobi **real** (Item 20/47 dalili), lekin bottleneck-bayrog'ining PP/CRP ga uzatilishi **mustaqil topilmadi**. `EXTRACTION QISM A #49`: "real-time avto-to'ldirish (reja%/downtime) STILL-OPEN (SB0384), 0 IoT data"; talab — OEE hafta <40% bo'lsa avto "bottleneck" belgisi Director EP-DIR-001 formulasiga PP/CRP orqali kirishi.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy)** — bottleneck bayrog'i va uning PP/CRP→Director zanjiri qurilmagan. 🔩 CAPEX ta'siri **kam** — OEE hisobi 8 jonli sessiyadan ishlaydi, lekin ma'noli yuklanish-foizi uchun **ko'proq jonli data** kerak (bu operator-login blokeri, datchik emas). ⭐ **Chegara (40%)** `business_settings` ga qo'shilishi kerak.
- **Bog'liqlik:** EP-IOT-014 (OEE), Director EP-DIR-001 (holat formulasi), PP/CRP quvvat rejasi
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish quvvat rejasi (CRP), ShVB
- **Xoch-havolalar:** `[Module-16] Item 76` · `[Module-16] Item 49` *(takror)* · `EXTRACTION QISM A #49` · `TASDIQ-2146 §16 #26` · `QISM C 16.26`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-054 · "Согласовано РД4 / Утверждено Ген.Директор" norma tasdiq zanjiri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — norma o'zgarishi РД (ishlab chiqarish boshlig'i) → Direktor tasdig'idan o'tadi (audit jurnali bilan). Kitob hisoboti imzo bilan tasdiqlanadi (Yulchiev M. + Pozilov A.). Norma o'zgarsa oylik o'zgaradi → faqat tasdiqlangani amal qiladi.
- **Manba:** kitob (Согласовано РД4 + Утверждено Ген.Директор real imzo) + Q78/Q79 (org-sxema hujjat marshrut) + v2-A
- **Dalil (kod):** `[Module-16] Item 77` (= Item 53 takrori) — "EP-IOT-054" grep → **0 mos**; ildiz sabab: **mashina-norma jadvali umuman yo'q** (EP-IOT-032), tasdiqlanadigan ob'ekt mavjud emas.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi** — imzo-zanjiri endpoint'i (РД4→Direktor) yozilmagan; **lekin EP-IOT-032 (norma ustuni) dan keyin qurilishi kerak** (qattiq tartib). ⭐ **Egasi-DATA:** "РД4" tashkiliy jihatdan **kim** — karta xaritalashi egasidan kerak (audit shuni aniq belgilaydi). 🔩 CAPEX ta'siri **YO'Q**. ⚠️ **Bog'liq vizyon-talabi hamon bajarilmagan:** `EXTRACTION QISM A #14` — "norma o'zgarsa ESKI norma qo'llanadi, yangi faqat keyingi smenadan" (versiyalash + effective-date, SB0421) **yo'q**.
- **Bog'liqlik:** EP-IOT-032 (norma jadvali — qattiq bloker), norma versiyalash/effective-date (SB0421), HR oylik
- **action:** APPROVE
- **⤳ Ta'sir:** HR (oylik), ShVB, Audit, EP-IOT-032 v2 (norma)
- **Xoch-havolalar:** `[Module-16] Item 77` · `[Module-16] Item 53` *(takror)* · `[Module-16] Item 14` *(taxminiy — norma versiyalash)* · `EXTRACTION QISM A #14` · `TASDIQ-2146 §16 #27` · `TASDIQ-2146 §16 #3` · `QISM C 16.27`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-055 · ФСМ tezligi va uzilishi (зажор)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ФСМ tezlik + tiqilish soni kuzatiladi, ko'paysa ogohlantiriladi. Ko'p tiqilish = karton namligi/sozlama muammosi. ФСМ-sensor o'rnatilgach.
- **Manba:** kitob (ФСМ большой/маленький/полуавтомат) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 78` — `equipment` ning 7 jonli qatorida **ФСМ nomli mashina yo'q**; tiqilish/tezlik hisoblagich kodi ham grep bilan topilmadi.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate** — ФСМ ga jismoniy tezlik/tiqilish datchigi kerak (audit: "Owner-gated — needs a physical speed/jam sensor (CAPEX decision)"). ⭐ **Egasi-DATA (parallel):** ФСМ hatto reestrga **kiritilmagan** — bu datchikdan oldingi, arzon qadam. ⌨️ Kod-kamchiligi: tiqilish-sanovchi maydon; `EXTRACTION QISM A #33` — FSM tiqilish chegarasi dinamik (namlik sensoriga qarab) bo'lishi kerak, **namlik sensori ham yo'q** (SB0316).
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri), EP-IOT-031 (reestr seed), namlik sensori (`QISM A #33`)
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (karton namligi), Ombor
- **Xoch-havolalar:** `[Module-16] Item 78` · `[Module-16] Item 33` *(taxminiy — dinamik tiqilish chegarasi)* · `EXTRACTION QISM A #33` · `TASDIQ-2146 §16 #28` · `QISM C 16.28`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-056 · Тигель/висечка qolip (штамп) resursini udar soniga bog'lash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har qolip kartasi + udar hisoblagichi + resurs chegarasi → almashtirish eslatmasi. Eskirgan qolip brak beradi; oldindan eslatsa partiya buzilmaydi. EP-IOT-034 (udar) bilan bog'liq.
- **Manba:** kitob (die-cut qolip resursi) + EP-IOT-034 v2 + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 79` (= Item 56 ildiz-sababi) — `ow_molds` ustunlarida **stroke-counter/resurs-chegara maydoni yo'q** (`id, order_id, vendor, order_sent_at, expected_at, received_at, status, reject_reason, photo_proof_url`).
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — zarba-sanovchi datchik yo'q (Item 55 qattiq blokeri). ⌨️ Kod-kamchiligi (parallel): `ow_molds` ga `stroke_count`/`resource_remaining` ustunlari + eslatma job'i — schema-o'zgarish Q-35 bilan ruxsat etilgan; **qo'lda udar-kiritish bilan datchiksiz ham ishlashi mumkin**. ⭐ **Egasi-DATA:** har qolip turi uchun resurs chegarasi (necha mln udar).
- **Bog'liqlik:** EP-IOT-034 (udar hisoblagichi — qattiq bloker), EP-IOT-016 (TO jadvali), Qolip tsexi
- **action:** EVENT
- **⤳ Ta'sir:** Qolip tsexi, Sifat, Texnik xizmat, EP-IOT-034 v2
- **Xoch-havolalar:** `[Module-16] Item 79` · `[Module-16] Item 56` *(ildiz-sabab)* · `[Module-16] Item 19` *(taxminiy — zaxira qolip avto-PR)* · `EXTRACTION QISM A #19` · `QISM D #19` · `TASDIQ-2146 §16 #29` · `QISM C 16.29`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-057 · Defekt sababini operator tabletdan tanlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tayyor sabab ro'yxati (kitobdagi real holatlardan: qolip yarim/podrezka/rang ketdi/karton ho'l) + ixtiyoriy izoh. Erkin matn tahlil qilib bo'lmaydi; Pareto (eng ko'p brak sababi) chiqadi.
- **Manba:** kitob (real defekt sabablari) + EP-IOT-022 (tablet) + EP-IOT-038 v2 (переделka) + v2-A
- **Dalil (kod):** `[Module-16] Item 80` — `defect_catalog` (23 qator) va `iot-tablet.controller.ts:757` endpoint'i real; endpoint katalog kodlariga havola qila oladigan `reason`/`reasonDescription` maydonini qabul qiladi, **lekin** 23 qator orasida shu banddagi aniq ro'yxat (qolip yarim / подрезка / rang ketdi / karton ho'l) **yo'q** — hammasi generik sifat-defekt kodlari (o'lcham, dog', yirtiq, bo'yoq).
- **Nima yetishmaydi:** ⌨️ **Kod/data-kamchiligi (sof seed)** — kitobdagi real defekt sabablari `defect_catalog` ga seed qilinmagan; hozir operator erkin matn yozadi → **Pareto chiqmaydi** (decisions aynan shundan ogohlantirgan). ⚠️ Bog'liq muammo (2026-08-06 auditi): `defect_catalog` uchun **CRUD yo'q** — katalog faqat migratsiya-seed orqali o'zgaradi, ya'ni egasi ERP ichida yangi defekt turi qo'sha olmaydi (ERP tashqarisida ish YO'Q qoidasini buzadi). 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-038 (переделка kodi), EP-IOT-026 (defekt→mashina), QC Pareto, `defect_catalog` CRUD (krossmodul, QC)
- **action:** CREATE
- **⤳ Ta'sir:** Sifat (Pareto), Operator tableti, QC
- **Xoch-havolalar:** `[Module-16] Item 80` · `[Module-16] Item 60` *(bir xil ildiz)* · `TASDIQ-2146 §16 #30` · `QISM C 16.30`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-058 · Smena topshirish (А→Б) paytida mashina holati
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** **Ha** *(mexanizm)* / data 0 *(2026-07-11)*
- **Talab:** A — smena topshirish ekrani: tugatilmagan ish + mashina holati + qolip/material + izoh. Topshirilmasa keyingi smena nimadan boshlashini bilmaydi → yana sozlash/yo'qotish.
- **Manba:** kitob (А→Б→С smena) + EP-IOT-040 v2 (smena ajratish) + v2-A
- **Dalil (kod):** `[Module-16] Item 81` — `iot-tablet.controller.ts:237` `@Post('tablet/handover')` **real**; kod-izohi 2-imzo majburlashiga havola qiladi (SB0304/0324/0349) va `shift_handovers` ga INSERT qiladi. Manba jadvaldagi "197-satr" eskirgan (haqiqiy 237), **mexanizmning o'zi haqiqiy**. `shift_handovers`=**0 qator**.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (yagona bloker)** — mexanizm to'liq, lekin **0 operator-rol foydalanuvchi** (Item 1 / SB0312) sababli hech kim topshirmagan. ⌨️ Kod-kamchiligi: `EXTRACTION QISM A #3` talab qilgan **eskalatsiya zanjiri** (15 daq→ShVB, 30→sex, 45→direktor) yozilmagan. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** ⭐ operator-akkauntlar (SB0312), EP-IOT-040 (smena), eskalatsiya zanjiri (`QISM A #3`)
- **action:** CREATE
- **⤳ Ta'sir:** ShVB, MES, HR
- **Xoch-havolalar:** `[Module-16] Item 81` · `[Module-16] Item 3` *(taxminiy — eskalatsiya)* · `EXTRACTION QISM A #3` · `TASDIQ-2146 §16 #31` · `QISM C 16.31`
- **⚠️ ZIDDIYAT:** `QISM C 16.31` / manba jadval "197-satr" vs jonli "237-satr" — **STALE-DOC** (fayl o'sgan), mexanizm real.
- **Δ 2026-07-11→08-07:** —

### EP-IOT-059 · "иш йук" soatlarida muqobil ishga (паддон/арчиш) o'tkazish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Иш йук → muqobil ish (арчиш/паддон/тозалаш)" qayd etiladi, vaqt alohida sanaladi. Kitob: "ходимлар иш йуклиги учун арчишда ишлади", "паддон кадоклаган". Bo'sh turmagan xodim mehnati hisobga olinmasa = soxta past samaradorlik + norozilik.
- **Manba:** kitob (арчиш/паддон real izohlar) + EP-IOT-036 v2 (иш йук) + v2-A
- **Dalil (kod):** `[Module-16] Item 82` — Item 36/46 bilan bir xil sweep: IoT modulida "muqobil" ish-o'tkazish kodi uchun **0 mos**. `QISM D #36`: `alternative.?work|muqobil|alt.?work` → faqat `pos/.../warehouse-kpi.repository.ts:96` izohi (bog'liq emas); IoT/HR tomonida **muqobil-ish kodi yo'q**. `QISM D #46`: smena-PDF muqobil-ish ham yo'q.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — muqobil-ish toifasi, HR tabelida alohida kod va bir xil tarif qoidasi yozilmagan. 🔩 CAPEX ta'siri **YO'Q** — vaqt tabletdan kiritiladi. ⚠️ **Krossmodul:** HR tabel kodi HR modulida qurilishi kerak. ⚠️ Bog'liq: `EXTRACTION QISM A #10` "kamera muqobil ishni tasdiqlaydi" **kamera-CAPEX ostida**, lekin **tablet-kiritish varianti CAPEX'siz ishlaydi**.
- **Bog'liqlik:** EP-IOT-036 (иш йук kodi — qattiq bloker), HR tabel (krossmodul), EP-IOT-027 (smena PDF), kamera tasdig'i (`QISM A #10`)
- **action:** CREATE
- **⤳ Ta'sir:** HR (mehnat hisobi, oylik), ShVB
- **Xoch-havolalar:** `[Module-16] Item 82` · `[Module-16] Item 36` *(taxminiy)* · `[Module-16] Item 46` *(taxminiy)* · `[Module-16] Item 10` *(taxminiy)* · `EXTRACTION QISM A #36` · `EXTRACTION QISM A #46` · `QISM D #36` · `QISM D #46` · `TASDIQ-2146 §16 #32` · `QISM C 16.32`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-060 · Гофра намлик/клей (yelim) parametri kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — gofra linia yelim harorati + namlik sensor bilan, chegaradan chiqsa ogohlantirish. Yelim/namlik noto'g'ri = qatlam ko'chishi (расслоение) → butun rulon brak. Maxsus sensor — fazaviy.
- **Manba:** kitob (Гофра линия sifat) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 83` — `iot_sensors`=**0 qator**; namlik/yelim-harorati sensor kodi **topilmadi**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (sof)** — jismoniy namlik/yelim-harorat datchigi kerak; audit: "Code-buildable-now — **n/a until sensor exists**", "Owner-gated — needs a physical humidity/glue-temperature sensor (CAPEX)". ⌨️ Kod-kamchiligi **YO'Q** — bu band datchiksiz mazmunsiz. ⚠️ `EXTRACTION QISM A #33` (FSM dinamik tiqilish chegarasi) ham aynan shu namlik datchigiga bog'liq.
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri), EP-IOT-043 (gofra м2), EP-IOT-055 (ФСМ tiqilish)
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (qatlam ko'chishi), Ombor (karton/yelim), EP-IOT-043 v2
- **Xoch-havolalar:** `[Module-16] Item 83` · `[Module-16] Item 33` *(taxminiy)* · `EXTRACTION QISM A #33` · `TASDIQ-2146 §16 #33` · `QISM C 16.33`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-061 · Ofset бо'yoq (краска) qutisi darajasi kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — bo'yoq darajasi past bo'lsa ogohlantirish + Ombordan avto talab. Bo'yoq o'rtada tugasa rang o'zgaradi (brak)/to'xtash. Sensor/qo'lda — fazaviy.
- **Manba:** kitob (SM/KBA краска) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 84` — `apps/api/src/modules/iot` da "краска qutisi"/siyoh-darajasi sensori grep → **0 mos**; `iot_sensors`=0.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — jismoniy siyoh-darajasi datchigi kerak, u avto-WMS-talab tetigiga ulanadi. ⌨️ Kod-kamchiligi (parallel): decisions "Sensor/**qo'lda**" varianti ham ruxsat bergan — operator tabletdan "bo'yoq kam" belgilashi **hozir qurilishi mumkin**. ⚠️ `QISM D #41` (rang o'zgarsa qo'shimcha bo'yoq→PR) ham **Yo'q**, u datchik talab qilmaydi.
- **Bog'liqlik:** EP-IOT-001 (datchik), EP-IOT-035 (rang soni ustuni), Ombor bo'yoq talabi (PR)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (bo'yoq talab), Sifat (rang), EP-IOT-035 v2
- **Xoch-havolalar:** `[Module-16] Item 84` · `[Module-16] Item 41` *(taxminiy)* · `EXTRACTION QISM A #41` · `QISM D #41` · `TASDIQ-2146 §16 #34` · `QISM C 16.34`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-062 · Автовысечка картон vs гофра ajratish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — картон va гофра висечка alohida o'lchanadi (o'z normasi bilan). Kitobda 2 qator (картон/гофра). Karton va gofra normasi/braki/tezligi har xil; aralashtirsak hisobot noto'g'ri.
- **Manba:** kitob (Автовысечка картон/гофра 2 qator) + EP-IOT-033 v2 (birlik) + v2-A
- **Dalil (kod):** `[Module-16] Item 85` — `equipment` mazmun-dumpi generik nomlar ko'rsatadi; **картон-vs-гофра rejim ajratmasi ham, rejim-bo'yicha norma ma'lumoti ham yo'q**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — висечка mashinasining `equipment` qatoriga rejim maydoni + alohida norma qiymatlari. ⭐ **Egasi-DATA:** har rejim uchun norma qiymatlari. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-031 (reestr — qattiq bloker), EP-IOT-032 (norma), EP-IOT-033 (birlik)
- **action:** CREATE
- **⤳ Ta'sir:** Norma, Hisobot, EP-IOT-031 v2 (reestr)
- **Xoch-havolalar:** `[Module-16] Item 85` · `TASDIQ-2146 §16 #35` · `QISM C 16.35`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-063 · Mashina ON/OFF vaqti avto yozish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mashina ON/OFF avto yoziladi + tabel rejasi bilan solishtiriladi (kechikish ko'rinadi). Smena 8:00 da boshlanishi kerak, mashina 8:40 da yonsa = yo'qotish. Tok-sensor o'rnatilgach.
- **Manba:** kitob (ish boshlanish vaqti) + Q108 (kirish vaqti nazorati) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 86` — `machine_status_logs`=**9 qator**; `SELECT DISTINCT status` → faqat `stopped`, `running` (da'vo qilingan 5 holatdan 2 tasi). Avtomatik **tok-datchigiga asoslangan ON/OFF aniqlash topilmadi** — holat fayl izohiga ko'ra qo'lda/AI tomonidan qo'yiladi, datchikdan emas.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate** — haqiqiy avto-aniqlash uchun tok-datchigi kerak. ⌨️ Kod-kamchiligi (parallel, hozir qurilishi mumkin): **tabel rejasi bilan solishtirish** (8:00 reja vs 8:40 yonish) mantiqi **umuman yozilmagan** — bu qo'lda/tabletdan kiritilgan holat bilan ham ishlaydi va HR intizom uchun darhol qiymat beradi. Shuningdek 5 holat enumi yo'q (EP-IOT-002).
- **Bog'liqlik:** EP-IOT-002 (5 holat), EP-IOT-064 (idle tok), HR intizom (Q108 kirish vaqti)
- **action:** EVENT
- **⤳ Ta'sir:** HR (intizom), ShVB, Energiya, EP-IOT-064 v2 (idle tok)
- **Xoch-havolalar:** `[Module-16] Item 86` · `[Module-16] Item 108` *(takror)* · `[Module-16] Item 37` *(taxminiy — kirish vs ish-joyi vaqti)* · `EXTRACTION QISM A #37` · `QISM D #37` · `TASDIQ-2146 §16 #36` · `QISM C 16.36`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-064 · Энергия idle (бекор ёниб турган) vaqtni topish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ishlash tok ↔ bo'sh (idle) tok ajratiladi, bo'sh tok ogohlantiriladi. Bo'sh yonib turgan mashina pulni yeydi, mahsulot yo'q = eng oson tejaladigan xarajat. Energiya-sensor o'rnatilgach.
- **Manba:** kitob (idle) + EP-IOT-019 v1 (energiya hisobot) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 87` — xuddi shu `iot-main.controller.ts:144-157` **501** endpoint; kodda **`'EP-IOT-018-PENDING'` deb aniq halol-501** yozilgan.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (sof, halol belgilangan)** — audit: "Code-buildable-now — **n/a until sensor exists; endpoint scaffold already correct**". ⌨️ Kod-kamchiligi **YO'Q** — karkas to'g'ri qurilgan va o'zini `EP-IOT-018-PENDING` deb halol e'lon qiladi (bu **yaxshi namuna**: yashil-yolg'on emas, ochiq 501). ⚠️ Decisions bu bandni "eng oson tejaladigan xarajat" deb belgilagan — ya'ni **energiya datchigi CAPEX'i eng tez o'zini qoplaydigan investitsiya** bo'lishi mumkin.
- **Bog'liqlik:** EP-IOT-018 (qattiq bloker), EP-IOT-063 (ON/OFF), Moliya (energiya xarajat)
- **action:** EVENT
- **⤳ Ta'sir:** Moliya (energiya xarajat), ShVB, EP-IOT-063 v2
- **Xoch-havolalar:** `[Module-16] Item 87` · `[Module-16] Item 17` *(taxminiy)* · `[Module-16] Item 124` *(takror)* · `EXTRACTION QISM A #17` · `TASDIQ-2146 §16 #37` · `QISM C 16.37`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-065 · Kompressor/havo (пневматика) bosimi kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — kompressor bosimi + havo uzilishi sensor bilan, tushsa ogohlantirish. Bosim tushsa bir necha mashina birdan sekinlashadi/to'xtaydi; bitta kompressor nazorati ko'p mashinani himoya qiladi. Sensor — fazaviy.
- **Manba:** kitob (tigel/ФСМ/висечка havoda ishlaydi) + v2-A + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 88` (= Item 18 takrori) — `QISM D #18`: `compressor|kompressor` grep `apps/api/src` + `artifacts/erp-dashboard/src` bo'yicha → **butun kodda 0 mos**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — kompressor bosim-datchigi yo'q. ⌨️ Kod-kamchiligi (parallel): `EXTRACTION QISM A #18` talab qilgan **"bitta umumiy kompressor muammosi" hodisasi + bog'liq mashinalarni avto-downtime ga o'tkazish** mantiqi umuman yo'q — bu qism **qo'lda e'lon qilingan hodisa** bilan ham ishlashi mumkin edi. ⚠️ Decisions ta'kidlaydi: **bitta datchik ko'p mashinani himoya qiladi** — ya'ni CAPEX/foyda nisbati yuqori.
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri), umumiy-hodisa mantiqi (`QISM A #18`), Texnik xizmat
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat, ShVB (yashirin to'xtash sababi)
- **Xoch-havolalar:** `[Module-16] Item 88` · `[Module-16] Item 18` *(takror)* · `EXTRACTION QISM A #18` · `QISM D #18` · `TASDIQ-2146 §16 #38` · `QISM C 16.38`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-066 · Andon normaga nisbatan real bajarish (target ↔ haqiqiy)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Andon: target vs haqiqiy + ortda qolish % (qizil/yashil). Operator o'z natijasini target bilan real vaqtda ko'rsa, o'zini tezlashtiradi; kitob normasi qog'ozda emas, ekranda jonli. EP-IOT-021 (Andon) bilan bir.
- **Manba:** kitob (норма штук target) + EP-IOT-021 (Andon) + EP-IOT-032 v2 (norma) + v2-A
- **Dalil (kod):** `[Module-16] Item 89` — `production_sessions` da `target_quantity`/`actual_quantity` ustunlari **mavjud va to'ldirilgan**. `find artifacts/erp-dashboard/src -iname "*andon*"` → **0 natija**; maxsus Andon-brendli qizil/yashil ekran topilmadi (Item 21 topilmasi bilan mos).
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — ma'lumot (target/actual) **allaqachon bor**, faqat qizil/yashil ekran chizilmagan. 🔩 CAPEX ta'siri **YO'Q**. ⚠️ To'liq ma'no uchun EP-IOT-032 (mashina-darajadagi norma) kerak — hozir `target_quantity` buyurtmadan keladi, normadan emas.
- **Bog'liqlik:** EP-IOT-021 (Andon ekran — qattiq bloker), EP-IOT-032 (norma), EP-IOT-082 (bonus)
- **action:** READ
- **⤳ Ta'sir:** ShVB, Operator motivatsiyasi, EP-IOT-052 v2 (bonus)
- **Xoch-havolalar:** `[Module-16] Item 89` · `[Module-16] Item 127` *(bog'liq — Andon yo'q)* · `TASDIQ-2146 §16 #39` · `QISM C 16.39`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-067 · Окошка (deraza yelimlash) alohida bosqich
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Окошка alohida operatsiya + plyonka sarfi + brak. Qo'shimcha material (oyna plyonka) + vaqt; alohida bo'lmasa narx/norma noto'g'ri.
- **Manba:** kitob (Окошка) + EP-IOT-046 v2 (qo'l ish joylari) + v2-A
- **Dalil (kod):** `[Module-16] Item 90` — `equipment` mazmun-dumpida "окошка" operatsiyasi **ro'yxatga olinmagan**. `QISM D #42`: `okoshka|okno|inter.?operation|operatsiyalararo|waiting.?between` grep iot/+mes/ → **0 mos** — "Окошка tugadi" tabletdan belgilash va operatsiyalararo kutish toifasi ham yo'q.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — окошка ni alohida operatsiya turi sifatida reestrga qo'shish; audit: "Owner-gated — **none identified**". 🔩 CAPEX ta'siri **YO'Q**. ⚠️ Ikkilamchi bo'shliq: operatsiyalararo kutish vaqti alohida saqlanmaydi (`QISM A #42`) — OEE zanjiri uchun muhim.
- **Bog'liqlik:** EP-IOT-031 (reestr), EP-IOT-046 (qo'l ish joylari), EP-IOT-047 (operatsiyalararo data-model)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor (oyna plyonka), Narx (Costing)
- **Xoch-havolalar:** `[Module-16] Item 90` · `[Module-16] Item 42` *(taxminiy)* · `EXTRACTION QISM A #42` · `QISM D #42` · `TASDIQ-2146 §16 #40` · `QISM C 16.40`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-068 · Тиснение/Конгрев (folga) folga sarfi va udar
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — folga sarfi (м/ish) + udar soni kuzatiladi, isrof ko'rsatiladi. Folga qimmat; har bosishga qancha folga ketishi → xarajat/isrof. Sensor/qo'lda — fazaviy.
- **Manba:** kitob (Тигель тиснение/конгрев) + EP-IOT-034 v2 (udar) + v2-A
- **Dalil (kod):** `[Module-16] Item 91` — Item 55/56/79 bilan bir xil sweep: **butun kod bazasida udar-hisoblagich mexanizmi umuman yo'q**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate** — folga-sarfi/zarba datchigi kerak; audit: "Code-buildable-now — **n/a until stroke-counting infra exists at all**". ⌨️ Kod-kamchiligi (parallel): decisions "Sensor/**qo'lda**" variantini ham ruxsat bergan — folga sarfini tabletdan kiritish **hozir qurilishi mumkin** va folga qimmat bo'lgani uchun tez qiymat beradi.
- **Bog'liqlik:** EP-IOT-034 (udar hisoblagichi — ildiz), EP-IOT-001 (datchik), Ombor (folga)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (folga), Moliya
- **Xoch-havolalar:** `[Module-16] Item 91` · `[Module-16] Item 55/56/79` *(bir xil ildiz)* · `TASDIQ-2146 §16 #41` · `QISM C 16.41`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-069 · Mashina-mashina yarim tayyor (НЗП) kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har buyurtma operatsiya zanjiri bo'ylab kuzatiladi (qaysi mashinada, qancha kutdi). Ish bir necha mashinadan o'tadi (Резка→Печать→Лак→Висечка→ФСМ→Степлер→Упаковка); qayerda qotib qolgani bilinmasa savdo muddat ayta olmaydi.
- **Manba:** kitob (operatsiya zanjiri) + oltin-ip (НЗП) + EP-IOT-047 v2 (Резка zanjir) + v2-A
- **Dalil (kod):** `[Module-16] Item 92` — `SELECT count(*) FROM planning_operations` → **0 qator**; IoT tomonidagi integratsiya tasdiqlanmagan, chunki asos jadvalning o'zi bo'sh.
- **Nima yetishmaydi:** ⭐ **Krossmodul DATA blokeri** — `planning_operations` PP moduli tomonidan to'ldirilishi kerak; audit: "Owner-gated — **none beyond build**; depends on PP module populating `planning_operations`". ⌨️ Kod-kamchiligi: `planning_operations` ↔ IoT sessiya-ma'lumoti orasidagi НЗП-kuzatuv join'i yozilmagan. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** PP moduli (`planning_operations` to'ldirilishi — qattiq bloker), EP-IOT-047 (zanjir boshi), Savdo (muddat)
- **action:** EVENT
- **⤳ Ta'sir:** MES, Savdo (muddat), Ishlab chiqarish reja
- **Xoch-havolalar:** `[Module-16] Item 92` · `TASDIQ-2146 §16 #42` · `QISM C 16.42`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-070 · "Папка №" (buyurtma papkasi) IoT yozuviga bog'lash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har mashina ishi "Папка №" + buyurtma kodiga bog'lanadi. Kitob har ish "Папка №" (18660, 19868) bilan yuritiladi. Zavod papka raqami bilan ishlaydi; IoT papkaga ulanmasa buyurtmani topib bo'lmaydi.
- **Manba:** kitob (Папка № real raqamlar) + oltin-ip (buyurtma kuzatuvi) + v2-A
- **Dalil (kod):** `[Module-16] Item 93` — `production_sessions` da `production_order_id`/`order_id` ustunlari **mavjud** (2 variant). `production_sessions`=**8 qator** — haqiqiy папка-bog'lash ko'lamda sinovdan o'tmagan.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (asosiy)** — bog'lovchi ustunlar bor, jonli foydalanish 8 sessiya bilan minimal (operator-login blokeri). ⌨️ Kod-kamchiligi: **ikki variant ustun** (`production_order_id` va `order_id`) — kanonik qaysi biri ekani aniqlanmagan, bu "ikki-dunyo" naqshining kichik ko'rinishi. 🔩 CAPEX ta'siri **YO'Q**. ⚠️ `EXTRACTION QISM A #1` — sessiyasiz brakni 15 daqiqada retroaktiv Папка№ ga bog'lash **topilmadi**.
- **Bog'liqlik:** ⭐ operator-akkauntlar (SB0312), EP-IOT-013 (MES bog'lash), retroaktiv bog'lash (`QISM A #1`)
- **action:** CREATE
- **⤳ Ta'sir:** MES, Savdo, Costing, EP-IOT-013 v1 (MES bog'lash)
- **Xoch-havolalar:** `[Module-16] Item 93` · `[Module-16] Item 1` *(taxminiy — retroaktiv Папка bog'lash)* · `[Module-16] Item 43` *(taxminiy — brak↔buyurtma)* · `EXTRACTION QISM A #1` · `EXTRACTION QISM A #43` · `TASDIQ-2146 §16 #43` · `QISM C 16.43`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-071 · Sensor signal yo'qolsa "noma'lum" vaqt ajratish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — sensor uzilgan vaqt "ma'lumot yo'q" sifatida ajratiladi (uptime'ga ham, downtime'ga ham qo'shilmaydi) — halol hisob. "Ishladi" desak soxta yaxshi, "to'xtadi" desak soxta yomon. EP-IOT-023 v1 bilan bir.
- **Manba:** v2-A + EP-IOT-023 v1 (sensor uzilganda) + data-sifati prinsipi
- **Dalil (kod):** `[Module-16] Item 94` (= Item 12 takrori) — `last_signal_at` ustuni **mavjud**, lekin `drizzle-iot-oee.repo.ts` (to'liq o'qilgan) da **OEE maxrajidan aniq chiqarib-tashlash qoidasi topilmadi**. `QISM D #12`: `get-oee.handler.ts:8-20` da real maxraj-hisobi bor (`plannedProductionTime = totalTime − plannedDowntime`, `is_planned=true` chiqariladi), lekin **"aloqa yo'q / no-data" alohida toifa emas** — faqat `is_planned` bayrog'i mavjud.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — "ma'lumot yo'q" uchtinchi toifa OEE hisobiga qo'shilishi kerak (hozir faqat planlangan/planlanmagan ikkilik). `EXTRACTION QISM A #12` buni **vizyon-talabi** deb aniq belgilagan. 🔩 CAPEX-gate (ikkilamchi): datchik yo'qligida "signal yo'qoldi" hodisasi yuz bermaydi — **lekin qoida hozir yozilishi kerak**, aks holda datchik kelgach OEE **soxta** bo'ladi.
- **Bog'liqlik:** EP-IOT-023 (bir xil mantiq), EP-IOT-014 (OEE), EP-IOT-076 (kalibrovka ishonchi)
- **action:** EVENT
- **⤳ Ta'sir:** OEE, Data sifati, EP-IOT-023 v1
- **Xoch-havolalar:** `[Module-16] Item 94` · `[Module-16] Item 12` *(takror)* · `[Module-16] Item 129` *(takror)* · `EXTRACTION QISM A #12` · `EXTRACTION QISM A #20` · `QISM D #12` · `TASDIQ-2146 §16 #44` · `QISM C 16.44`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-072 · Mashina texnik xizmat tarixi qog'ozdan IoT'ga
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mashina kartasida ta'mir tarixi (sana/ish/qism/xarajat) — eskirish va MTBF ko'rinadi. Zavodda "ремонтда" yozuvlari allaqachon bor. Qaysi mashina tez-tez sinadi → almashtirish/kapital ta'mir qarori. Q77 (barcha hujjat ERP'da).
- **Manba:** kitob ("ремонтда" mavjud yozuvlar) + Q77 (hujjatlar ERP'da) + EP-IOT-016 v1 (texnik xizmat) + v2-A
- **Dalil (kod):** `[Module-16] Item 95` — `SELECT count(*) FROM equipment_maintenance` → **0 qator**; `equipment`=7 (DEMO). Jadval/ustunlar mavjud (rad etilmagan), lekin **qog'oz yozuvlaridan bironta tarixiy ma'lumot ko'chirilmagan**.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (asosiy)** — zavodda "ремонтда" yozuvlari **qog'ozda bor**, ERP'ga kiritilmagan (ERP tashqarisida ish YO'Q qoidasini buzadi). ⌨️ Kod-kamchiligi: `QISM D #26` — tarixiy **Excel-import** (qisman import + xato-qator hisoboti, `QISM A #26`) grep bilan **topilmadi**; ya'ni ko'chirish vositasi yo'q, faqat qo'lda CRUD. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-031 (reestr real bo'lishi shart), EP-IOT-016 (TO jadvali), tarixiy import (`QISM A #26`)
- **action:** CREATE
- **⤳ Ta'sir:** Texnik xizmat, Moliya (CAPEX), EP-IOT-016 v1
- **Xoch-havolalar:** `[Module-16] Item 95` · `[Module-16] Item 26` *(taxminiy — Excel import)* · `EXTRACTION QISM A #26` · `QISM D #26` · `TASDIQ-2146 §16 #45` · `QISM C 16.45`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-073 · Texnik xizmat ehtiyot qismi Ombor bilan bog'lash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ta'mirda ishlatilgan qism Ombordan chiqim + min. zaxira ogohlantirish (подшипник/ремень/нож). Ehtiyot qism hisobsiz ishlatilsa kerakli payt yo'q bo'ladi.
- **Manba:** oltin-ip (ombor-ta'mir bog'lanish) + EP-IOT-016 v1 + v2-A
- **Dalil (kod):** `[Module-16] Item 96` — `SELECT count(*) FROM mro_inventory` → **0 qator**; u IoT ning texnik-xizmat sxemasidan **alohida jadval** va grep bilan bironta join/ko'prik kodi **topilmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — ta'mir-buyrug'i qism-sarfi ↔ `mro_inventory`/WMS chiqim ko'prigi yozilishi kerak; audit: "Owner-gated — **none identified beyond build**". ⭐ Egasi-DATA: `mro_inventory` bo'sh (ehtiyot qism nomenklaturasi). 🔩 CAPEX ta'siri **YO'Q**. ⚠️ `QISM D #19`: zaxira qolip yo'q bo'lsa avto-PR ham **yo'q** (`spare|zaxira|auto.?pr|reorder|mold` grep → faqat `predictive-maintenance.service.ts:41` izohi).
- **Bog'liqlik:** EP-IOT-015 (predictive maintenance `mro_inventory` ni ishlatadi), EP-IOT-016/017, WMS (krossmodul), avto-PR (`QISM D #19`)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (ehtiyot qism), Texnik xizmat
- **Xoch-havolalar:** `[Module-16] Item 96` · `[Module-16] Item 19` *(taxminiy — avto-PR)* · `[Module-16] Item 50` *(taxminiy — PM qism yo'q)* · `EXTRACTION QISM A #19` · `EXTRACTION QISM A #50` · `QISM D #19` · `TASDIQ-2146 §16 #46` · `QISM C 16.46`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-074 · "Norma bajarilmadi" sababi avto tahlil
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — norma bajarilmaganda avto sabab tahlili (downtime breakdown) ko'rsatiladi: "3 soat иш йук + 1 soat сozlash". Operator "ulgurmadim" desa yetarli emas; obyektiv baho kerak. Kitob real sabablar (EP-IOT-036..039) shu tahlilga material.
- **Manba:** kitob (real sabablar majmuasi) + EP-IOT-036..039/048 v2 (downtime/idle/setup) + v2-A
- **Dalil (kod):** `[Module-16] Item 97` — `production_sessions` da `setup_seconds`, `running_time_seconds` (`main_seconds`), `stopped_time_seconds` **mavjud** va real OEE formulasi ularni **ishlatadi** — ya'ni taqsimot-hisoboti uchun xom ma'lumot **tayyor**. Avto-yaratiladigan "3 soat иш йук + 1 soat созлаш" uslubidagi matnli hisobot **topilmadi**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof)** — mavjud vaqt-ustunlari ustiga tahliliy hisobot qurilishi kerak. ⚠️ **Ikki qattiq bloker:** (a) EP-IOT-032 — taqqoslanadigan **mashina-darajadagi norma yo'q**; (b) EP-IOT-036 — "иш йук" sabab kodi **seed qilinmagan**, ya'ni tahlil aynan kitobdagi eng muhim sababni **nomlay olmaydi**. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-032 (norma — qattiq bloker), EP-IOT-036 (иш йук kodi — qattiq bloker), EP-IOT-039 (setup — qurilgan), EP-IOT-082 (adolatli bonus)
- **action:** EVENT
- **⤳ Ta'sir:** ShVB, HR (KPI), Norma, EP-IOT-052 v2 (adolatli bonus)
- **Xoch-havolalar:** `[Module-16] Item 97` · `TASDIQ-2146 §16 #47` · `QISM C 16.47`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-075 · Brak material qayta ishlatish (макулатура) kuzatish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — brak miqdori → makulatura/qayta ishlash sifatida yoziladi (to'liq material balansi). Brak material ham pul; qancha makulaturaga ketdi/qaytdi bilinmasa yo'qotish to'liq ko'rinmaydi.
- **Manba:** kitob (брак material) + oltin-ip (material balans) + v2-A
- **Dalil (kod):** `[Module-16] Item 98` — `SELECT count(*) FROM waste_records` → **0 qator**; IoT→`waste_records` ko'prigi grep bilan **topilmadi**. `QISM D #35`: `rework.*gl|scrap.*30|30.?day.*gl|deferred.*writeoff` grep `apps/api` → **0** (topilgan `mes-shifts-stats.repo.ts:234` "30 days" = statistika interval-sanitizeri, bog'liq emas).
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — mavjud defekt-endpoint'ini (Item 60 / `iot-tablet.controller.ts:757`) makulatura belgilanganda `waste_records` yozuvi yaratishga **ulash** kerak; audit: "Owner-gated — **none identified**". ⚠️ Bog'liq bo'shliq: `EXTRACTION QISM A #35` — brak material "qayta ishlov kutilmoqda" holati + **30 kun ichida zarar GL** kuzatuvi ham yo'q. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-026/057 (defekt yozuvi), Ombor, GL 30-kunlik kuzatuv (`QISM A #35`)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor, Moliya, Ekologiya hisoboti
- **Xoch-havolalar:** `[Module-16] Item 98` · `[Module-16] Item 35` *(taxminiy)* · `EXTRACTION QISM A #35` · `QISM D #35` · `TASDIQ-2146 §16 #48` · `QISM C 16.48`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-076 · Mashina sertifikat/kalibrovka muddati eslatmasi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har sensor/o'lchagich kalibrovka muddati + eslatma (tarozi/harorat/bosim). Kalibrlanmagan sensor noto'g'ri o'qiydi → barcha IoT raqami yolg'on. Sensor o'rnatilgach.
- **Manba:** v2-A + data-ishonchi prinsipi + egasi (sensorsiz)
- **Dalil (kod):** `[Module-16] Item 99` — `SELECT count(*) FROM ai_calibration_runs` → **0 qator**; bu jadval **faqat model-kalibratsiyasi** uchun, sensor-kalibrovka eslatmasi mantiqi **emas** (tasdiqlangan). `EXTRACTION QISM A #4/#44`: kalibratsiya retrospektiv-tuzatish va "ishonchsiz/tekshirilmagan davr" belgisi **yo'q** (SB0361 STILL-OPEN).
- **Nima yetishmaydi:** 🔩 **CAPEX-gate** — kalibrlanadigan jismoniy datchik yo'q; audit: "Code-buildable-now — **n/a until physical sensors exist to calibrate**". ⌨️ Kod-kamchiligi (parallel, muhim): "ishonchsiz" belgisi va uni **HR oylik/KPI dan avto chiqarish** qoidasi (`QISM A #44`) hozir yozilmasa, datchik kelgach **soxta hisob HR oyligiga o'tadi** — bu qoida oldindan qurilishi kerak.
- **Bog'liqlik:** EP-IOT-001 (datchik ildiz-blokeri), EP-IOT-071 (noma'lum vaqt), EP-IOT-082 (HR KPI), SB0361
- **action:** CRON
- **⤳ Ta'sir:** Sifat (data ishonchi), Texnik xizmat, EP-IOT-071 v2
- **Xoch-havolalar:** `[Module-16] Item 99` · `[Module-16] Item 4` *(taxminiy)* · `[Module-16] Item 44` *(taxminiy)* · `EXTRACTION QISM A #4` · `EXTRACTION QISM A #44` · `TASDIQ-2146 §16 #49` · `QISM C 16.49`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-077 · Kamera-AI operator himoya vositasi (qo'lqop/ko'zoynak) tekshirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-05 Δ — quvur ulandi, data hamon 0)*
- **Talab:** A — kamera-AI himoya vositasini tekshiradi, yo'q bo'lsa ogohlantiradi/qayd etadi. Q57 (AI kamera: yuz + inspeksiya + real-time), Q56 (xonadagi AI kamera nazorat qiladi). Mashina yonida jarohat xavfi yuqori. **AI kamera = boshlang'ich (sensor emas).**
- **Manba:** BARCHA_JAVOBLAR Q56/Q57 (AI kamera nazorat) + ShVB Y29 (inspeksiya) + v2-A
- **Dalil (kod):** `[Module-16] Item 100` — `camera_ai_configs`=**0 qator**; `apps/api/src/modules/aisha/application/tools/analyze-camera-feed.tool.ts` **mavjud** (umumiy VLM vositasi), lekin PPE-spetsifik (qo'lqop/ko'zoynak) inferens ulanishi tasdiqlanmagan. `EXTRACTION QISM A #11/#48`: `detect-safety-violations.tool.ts` VLM **real**, lekin **0 jonli qo'llanish**.
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — AI-kamera infratuzilmasi jismonan o'rnatilmagan (0 qator). ⌨️ Kod-kamchiligi (parallel): PPE-aniqlash prompt/mantiqi `analyze-camera-feed.tool.ts` ustiga qurilishi kerak; mezon ro'yxati ham yo'q (EP-IOT-011). ⚠️ **Muhim ajratma:** decisions bu bandni "**AI kamera = boshlang'ich (sensor emas)**" deb belgilagan — ya'ni egasi kamera-CAPEX ni mashina-datchik CAPEX'idan **oldinroq** ko'rgan.
- **Bog'liqlik:** EP-IOT-010/011 (kamera inspeksiya + mezon), EP-IOT-078 (xavfli zona), Xavfsizlik (Техника хавфсизлиги)
- **action:** AI
- **⤳ Ta'sir:** Xavfsizlik (Техника хавфсизлиги), HR, EP-IOT-011 (mezon)
- **Xoch-havolalar:** `[Module-16] Item 100` · `[Module-16] Item 11` *(taxminiy)* · `[Module-16] Item 31` *(taxminiy — checklist vs kamera ziddiyati)* · `EXTRACTION QISM A #11` · `EXTRACTION QISM A #31` · `TASDIQ-2146 §16 #50` · `QISM C 16.50`
- **Δ 2026-07-11→08-07:** ⭐ `0b034f84` (2026-08-05) — **PPE/xavfsizlik topilmalari endi alert-UI ga yetadi.** `camera-ai.service.ts` `analyzeByMissions()` AI topilmalarini faqat `camera_events` ga yozardi, `camera_alerts` ga yozmasdi — natijada mavjud inson-tasdiq UI+API (`CameraAlertsRouteController`, `camera-alerts.tsx`) **abadiy bo'sh** edi. Endi har topilma uchun `camera_event_id` bilan bog'langan `camera_alerts` qatori yaratiladi. ⚠️ **Lekin qurilish holati hamon "Yo'q"** — quvur ulandi, jismoniy kamera yo'qligi sababli quvurdan **hech narsa oqmaydi** (`camera_events`=0, `camera_alerts`=0).

### EP-IOT-078 · Kamera-AI xavfli zonada odam yo'qligini tekshirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-05 Δ — quvur ulandi, data hamon 0)*
- **Talab:** A — kamera-AI xavfli zonani kuzatadi, odam kirsa darhol ogohlantiradi. Висечка/тигель barmoq kesishi mumkin; AI eng og'ir baxtsiz hodisa oldini oladi. Q57/Q89 (AI kamera real-time + holat kuzatish). AI kamera yo'nalishi joriy etilmoqda.
- **Manba:** BARCHA_JAVOBLAR Q57/Q89 (AI kamera real-time kuzatish) + v2-A
- **Dalil (kod):** `[Module-16] Item 101` — `SELECT count(*) FROM camera_alerts` → **0 qator**. Audit: zona-kirish aniqlashni **mavjud `detect-safety-violations.tool.ts` ustiga** qurish mumkin ("already exists").
- **Nima yetishmaydi:** 🔩 **CAPEX-gate (asosiy)** — kamera jismonan o'rnatilmagan. ⌨️ Kod-kamchiligi (parallel): zona-kirish aniqlash mantiqi va `EXTRACTION QISM A #28/#48` talab qilgan **3 amal ketma-ketligi** ((a) darhol xavfsizlikka sinxron signal, (b) blok-ro'yxat tekshiruvi async, (c) hodisa log) hamda **"hodisa faqat inson yopadi"** qoidasi yozilmagan. ⚠️ Bu **hayot-xavfi** bandi — decisions "signal kechiktirib bo'lmaydi" deb ta'kidlagan.
- **Bog'liqlik:** EP-IOT-077 (PPE — bir xil kamera bloker), EP-IOT-079 (tungi smena), Xavfsizlik, Texnik xizmat (mashina to'xtatish)
- **action:** AI
- **⤳ Ta'sir:** Xavfsizlik, Texnik xizmat (mashina to'xtatish), EP-IOT-077 v2
- **Xoch-havolalar:** `[Module-16] Item 101` · `[Module-16] Item 11` *(taxminiy)* · `[Module-16] Item 28` *(taxminiy — tungi zona)* · `[Module-16] Item 48` *(taxminiy — 3 amal)* · `EXTRACTION QISM A #11` · `EXTRACTION QISM A #28` · `EXTRACTION QISM A #48` · `TASDIQ-2146 §16 #51` · `QISM C 16.51`
- **Δ 2026-07-11→08-07:** `0b034f84` (2026-08-05) — EP-IOT-077 bilan bir xil: AI topilmalari endi `camera_alerts` ga yozilib, inson-tasdiq UI ga yetadi. Jismoniy kamera bo'lmagani uchun jonli ta'sir **0**.

### EP-IOT-079 · Tungi smena (С) avto nazorat kuchaytirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — tungi smenada anomaliya/idle chegarasi pasaytiriladi + masofadan xabar (Telegram). Tunda nazoratchi kam; mashina bo'sh tursa/sinsa hech kim ko'rmaydi. Q108 (kirish/chiqish vaqti nazorati) bilan bog'liq.
- **Manba:** kitob (С смена) + EP-IOT-028 (Telegram) + Q108 + v2-A
- **Dalil (kod):** `[Module-16] Item 102` — `apps/api/src/modules/iot` da tungi-smena spetsifik chegara-pasaytirish konfiguratsiyasi grep → **0 mos**; Item 7 topilmasi bilan mos ("tungi 20% past" mantiqi anomaliya-handlerida yo'q).
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (aniq va oson)** — audit: mavjud `IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO` konstanta-asosidagi tekshiruvga **tungi-smena koeffitsienti** qo'shish kifoya (`anomaly-detected.handler.ts`). ⭐ **Egasi-DATA:** tungi smena chegara qiymatlari — ⚠️ **threshold = doim CRUD qoidasi:** chatda so'ralmasin, `business_settings` ga default (20% past) bilan qo'shilib CRUD orqali sozlansin. 🔩 CAPEX-gate (ikkilamchi): anomaliya manbai datchik.
- **Bog'liqlik:** EP-IOT-006/008 (anomaliya quvuri), EP-IOT-028 (Telegram), EP-IOT-040 (smena), EP-IOT-078 (tungi xavfli zona)
- **action:** EVENT
- **⤳ Ta'sir:** ShVB, Telegram bot, HR (tungi smena)
- **Xoch-havolalar:** `[Module-16] Item 102` · `[Module-16] Item 7` *(taxminiy — eskalatsiya matritsasi)* · `[Module-16] Item 28` *(taxminiy)* · `EXTRACTION QISM A #7` · `EXTRACTION QISM A #28` · `TASDIQ-2146 §16 #52` · `QISM C 16.52`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-080 · Mashina boshlashdan oldin "tayyorlik tekshiruvi" (checklist)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** **Ha** *(mexanizm)* / data 0 *(2026-07-11)*
- **Talab:** A — mashina boshlashdan oldin majburiy checklist (yog'/tozalik/qolip/material), to'ldirilmasa ish ochilmaydi. Tayyorgarliksiz boshlangani uchun to'xtash (EP-IOT-037/039) ko'p; checklist xatoni boshida ushlaydi. Q16/Q95 (onboarding/checklist HR belgilaydi) modeliga mos.
- **Manba:** TPM amaliyot + kitob (qolip/material kechikish muammosi) + Q16/Q95 (checklist) + v2-A
- **Dalil (kod):** `[Module-16] Item 103` — `iot-tablet.controller.ts:561-592` checklist yo'q/chala bo'lsa **422 BLOCKED** qaytaradi (**fail-closed**). Manba jadval "331-348" satrlarini keltiradi — hozirgi haqiqiy satr 561-592 (fayl o'sgan), **mexanizmning o'zi haqiqiy va fail-safe**. `QISM D #8`: MES tomonida ham real darvoza — `start-session.handler.ts:63-77` (`passChecklist`, chala→BLOCK) + `drizzle-mes.repo.ts:161-167` real SQL `setup_checklists`+`checklist_items` ustidan.
- **Nima yetishmaydi:** ⭐ **Egasi-DATA (yagona jiddiy bo'shliq)** — `QISM D #8` ogohlantiradi: agar `setup_checklists` **0 qator** bo'lsa, **hamma sessiya blok bo'ladi** (data-empty fail-closed). Ya'ni checklist shablonlari kiritilmasa **ishlab chiqarish umuman boshlanmaydi**. ⌨️ Kod-kamchiligi: ShVB ning "sabab yozib ochish" (override) huquqi tasdiqlanmagan. 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** ⭐ `setup_checklists` seed (egasi-data, **kritik**), operator-akkauntlar (SB0312), EP-IOT-013 (MES sessiya)
- **action:** CREATE
- **⤳ Ta'sir:** Texnik xizmat (TPM), Sifat, ShVB, EP-IOT-050 v1 (checklist)
- **Xoch-havolalar:** `[Module-16] Item 103` · `[Module-16] Item 8` *(taxminiy)* · `EXTRACTION QISM A #8` · `QISM D #8` · `TASDIQ-2146 §16 #53` · `QISM C 16.53`
- **⚠️ ZIDDIYAT:** manba jadval "331-348 satr" vs jonli "561-592 satr" — **STALE-DOC** (fayl o'sgan), mexanizm real.
- **Δ 2026-07-11→08-07:** `f318bbfe` (2026-08-07) — tablet start marshrutiga **material-komplekt 2-imzo darvozasi** ham qo'shildi (checklist darvozasidan alohida, lekin bir xil start yo'lida): komplekt bor va tasdiqlanmagan bo'lsa 422 BLOCKED.

### EP-IOT-081 · Mashina samaradorligi GSD/ЦКП ShVB'ga uzatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — IoT ko'rsatkichlari (uptime/norma%/brak) avto ShVB GSD'ga (ishlab chiqarish bo'limi statistikasi) uzatiladi. Vizyon: har bo'lim o'z ЦКП/statistikasi bilan o'lchanadi; qo'lda emas, avto. Egasi: "mashina ЦКП IoT/MES'dan keyin avto". ShVB Y37 `iotGsd`.
- **Manba:** egasi (mashina ЦКП IoT/MES'dan avto) + ShVB Y37 (iotGsd) + karta-model (Vysotskiy 7) + v2-A
- **Dalil (kod):** `[Module-16] Item 104` — `SELECT count(*) FROM oee_records` → **0 qator**; OEE hisobining o'zi real (Item 47/120 dalili), lekin `oee_records`→GSD/ЦКП hodisa-zanjiri jonli tasdiqlanmagan. `EXTRACTION QISM A #38`: `ckp-mes-feed` listener **RESOLVED** (SB0003/0184), lekin data siyrak.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi** — OEE hisoblanadi, lekin `oee_records` ga **yozilmaydi** (0 qator), shuning uchun ЦКП feed'iga hech narsa yetmaydi. Bu **"hisoblanadi lekin saqlanmaydi"** uzilishi. ⭐ Egasi-DATA: jonli sessiya kam (operator-login blokeri). 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-014 (OEE — real), EP-IOT-025 (karta GSD), `ckp-mes-feed` listener (Item 38), ShVB Vysotskiy 7
- **action:** EVENT
- **⤳ Ta'sir:** ShVB (Vysotskiy 7), karta-model, Statistik bo'lim, EP-IOT-003/014/025
- **Xoch-havolalar:** `[Module-16] Item 104` · `[Module-16] Item 38` *(taxminiy)* · `EXTRACTION QISM A #38` · `TASDIQ-2146 §16 #54` · `QISM C 16.54`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-082 · Mashina ko'rsatkichini operator oylik/KPI'siga bog'lash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — bonusga ta'sir qiladi, lekin faqat operatorga bog'liq qism (idle/material/qolip chiqarib tashlanadi) — adolatli. Sensor xatosi yoki "иш йук" (operator aybi emas) oylikka noto'g'ri ta'sir qilmasligi kerak. Q116 (uskuna xodimi hisoboti → oylik), karta-model GSD→bonus.
- **Manba:** karta-model (GSD→oylik adolatli) + BARCHA_JAVOBLAR Q116 + EP-IOT-074 v2 (sabab tahlili) + v2-A
- **Dalil (kod):** `[Module-16] Item 105` — `production_sessions.operator_card_id` va `machine_crews` **mavjud**; `apps/api/src/modules/hr` grep'i bo'yicha **HR-KPI ko'prigi tasdiqlanmadi**. "idle/material/qolip chiqarib tashlangan" adolatli KPI koeffitsienti mavjud emas.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (asosiy va xavfli)** — operator↔sessiya bog'lanishi bor, lekin **adolat filtri yo'q**. Agar bu holatda HR ko'prigi qurilsa, operator **o'zi aybdor bo'lmagan** idle/material/qolip vaqti uchun jazolanadi — decisions aynan shundan ogohlantirgan. ⚠️ Shu bilan bir qatorda `EXTRACTION QISM A #44` talab qilgan **"ishonchsiz" belgisi → HR oylik/KPI dan avto chiqarish** ham yo'q (EP-IOT-076). 🔩 CAPEX ta'siri **YO'Q**.
- **Bog'liqlik:** EP-IOT-074 (sabab tahlili — adolat manbasi), EP-IOT-076 (ishonchsiz belgisi), EP-IOT-036 (иш йук kodi), HR moduli (krossmodul), EP-IOT-059 (muqobil ish hisobi)
- **action:** EVENT
- **⤳ Ta'sir:** HR (oylik/bonus), ShVB, karta-model, EP-IOT-059 v2 (muqobil ish hisobi)
- **Xoch-havolalar:** `[Module-16] Item 105` · `[Module-16] Item 29` *(taxminiy — og'irlikli GSD)* · `[Module-16] Item 44` *(taxminiy — ishonchsiz belgisi)* · `EXTRACTION QISM A #29` · `EXTRACTION QISM A #44` · `TASDIQ-2146 §16 #55` · `QISM C 16.55`
- **Δ 2026-07-11→08-07:** —

### EP-IOT-083 · Ofset plastina (колиб/CTP) tayyorlik holati navbatda
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mashina navbatidagi har ish yonida "plastina/qolip tayyor" indikatori (preprint'dan). Plastina tayyor bo'lmasa mashina kutadi (EP-IOT-037 qolip muammosi turkumi); navbatda holat ko'rinsa preprint oldindan tayyorlaydi.
- **Manba:** kitob (ofset plastina kutish muammosi) + EP-IOT-041 v2 (navbat) + EP-IOT-037 v2 + v2-A
- **Dalil (kod):** `[Module-16] Item 106` (= Item 34 takrori) — `QISM D #34`: `plate|plastina|klishe|forma.?tayyor` grep iot/+mes/ → **0 mos**; plastina-tayyorlik ogohlantirishi **yo'q**.
- **Nima yetishmaydi:** ⌨️ **Kod-kamchiligi (sof, hozir qurilishi mumkin)** — plastina-tayyorlik indikatori va ogohlantirishi yozilmagan. ⚠️ **Muhim vizyon-cheklovi (`QISM A #34`):** tizim faqat **ogohlantiradi**, PP navbatini **AVTO qayta tartiblamaydi** — qaror inson (ishlab chiqarish boshlig'i) qo'lida (E1 prinsipi). 🔩 CAPEX ta'siri **YO'Q**. ⚠️ Bog'liq: EP-IOT-041 (navbat ekrani) va EP-IOT-021 (Andon) ham yo'q, ya'ni indikatorni ko'rsatadigan joy hozircha mavjud emas.
- **Bog'liqlik:** EP-IOT-041 (navbat — qattiq bloker), EP-IOT-021 (Andon), EP-IOT-037 (колиб тайёр эмас sababi), Dizayn/Preprint
- **action:** READ
- **⤳ Ta'sir:** Dizayn/Preprint, MES, Ishlab chiqarish reja
- **Xoch-havolalar:** `[Module-16] Item 106` · `[Module-16] Item 34` *(takror)* · `EXTRACTION QISM A #34` · `QISM D #34` · `TASDIQ-2146 §16 #56` · `QISM C 16.56`
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-realizatsiya bo'shliqlari (VR-IOT-I01..I06)

> Bu bandlar birorta `EP-IOT-NNN` qaroriga to'liq mos kelmaydi — ular **kesishuvchi
> blokerlar** yoki jonli-kod topilmalari bo'lib, ko'p EP bandini bir vaqtda to'sadi.
> Manba: `EXTRACTION QISM A` Step-3 (ochiq savollar), `QISM D` xulosalari va
> **2026-08-07 jonli tekshiruvi**.

### VR-IOT-I01 · ⭐ 0 ta operator-rol foydalanuvchi — butun modulning eng katta blokeri
- **Tur:** Egasi-DATA (apparat emas, kod emas)
- **Dalil:** `EXTRACTION QISM A` Step-3, SB0312 (2026-07-04, STILL-OPEN) — "0 operator-rol foydalanuvchi: hech kim tabletga operator sifatida kira olmaydi". Jonli tasdiq: `production_sessions`=8, `machine_crews`=2, `shift_handovers`=**0**, `setup_checklists` foydalanish 0.
- **Nima yetishmaydi:** Operator akkauntlari yaratilmagan. **To'liq qurilgan** mexanizmlar (EP-IOT-022 tablet 26 endpoint, EP-IOT-042 ekipaj CRUD, EP-IOT-058 smena topshirish, EP-IOT-080 checklist darvozasi) hech qachon ishlatilmagan.
- **Ta'sir qiladigan EP bandlari:** EP-IOT-022, 042, 058, 070, 080, 081, 082 (va bilvosita OEE/GSD zanjirining hammasi)
- **⚠️ Muhim:** bu **CAPEX emas** — datchik sotib olish shart emas, faqat foydalanuvchi yaratish kerak. Modulning "ishlamayapti" ko'rinishining eng katta yagona sababi.

### VR-IOT-I02 · ⚠️ `iot-data-cleanup.cron.ts` — ro'yxatdan o'tgan, lekin bo'sh "yashil-yolg'on" cron
- **Tur:** Kod-kamchiligi (xavfli tur — monitoring aldanadi)
- **Dalil (jonli 2026-08-07):** `apps/api/src/cron/iot-data-cleanup.cron.ts` — `@Cron('0 2 * * 6')`, `cron.module.ts:123` da provider, `cron-status.service.ts:124` da "IoT ma'lumotlarini tozalash (Shanba 02:00)" deb ko'rsatiladi. **Metod tanasida bironta DB so'rovi yo'q** — faqat izohlar ("90 kun → coldstore S3 Glacier", "raw data delete, aggregated hourly summaries keep"), `result.processed = 0` qattiq yozilgan, so'ng `logger.log('✅ IotDataCleanup: processed=0')`.
- **Nima yetishmaydi:** Retention/arxivlash mantiqi umuman yozilmagan; `mes_telemetry` (876 qator) hech qachon siqilmaydi. CRON monitoringi esa "bor va muvaffaqiyatli" deb ko'rsatadi.
- **Ta'sir qiladigan EP bandlari:** EP-IOT-009 (telemetriya retention)
- **⚠️ Ziddiyat manbasi:** `[Module-16] Item 115` va `QISM D #30` "downsample/retention job **yo'q**" deydi — grep `iot/` va `common/database/` da qidirgan, `apps/api/src/cron/` ni ko'rmagan. Cron **bor**, lekin **bo'sh** — ikkala da'vo ham qisman noto'g'ri.

### VR-IOT-I03 · `RoomAnalysisCron` IoT modulida emas, HR modulida yashaydi
- **Tur:** Arxitektura/hujjat drifti (kod ishlaydi)
- **Dalil (jonli 2026-08-07):** `apps/api/src/modules/hr/inspection/room-analysis.cron.ts:32` — `@Cron('0 */2 * * *')` (**har 2 soatda**, Q98 talabiga aynan mos), `inspection.module.ts:17` da provider sifatida ro'yxatdan o'tgan; `camera_events` dan snapshot oladi, `InspectionService` bilan etalon-taqqoslash qiladi, anomaliyada `NotificationBotService` orqali HR_MANAGER/HR_DIRECTOR/SECURITY ga Telegram yuboradi.
- **Nima yetishmaydi:** Kod **ishlaydi**, lekin `ideal_rasm_targets`=0 va kamera yo'qligi sababli har 2 soatda "no rooms registered yet" deb bo'sh qaytadi. Auditlar uni topolmagan, chunki faqat `iot/` modulini grep qilgan.
- **Ta'sir qiladigan EP bandlari:** EP-IOT-010, 011, 012, 077, 078
- **⚠️ Qaror kerak:** kamera-AI xona inspeksiyasi **IoT moduliniki**mi yoki **HR moduliniki**mi — `EXTRACTION QISM A #24` egasi javobiga ko'ra "kamera infratuzilmasi **IoT'niki**", lekin kod HR'da. Bu drift hujjatlashtirilishi yoki ko'chirilishi kerak.

### VR-IOT-I04 · Yetim jadvallar: `room_references`, `room_reference_comparisons`, `camera_snapshots`
- **Tur:** Schema-chiqindi (egasi-imzosi kerak)
- **Dalil:** `0b034f84` (2026-08-05) o'lik `reference-image-compare.cron.ts` ni o'chirdi (hech qachon `cron.module.ts` da ro'yxatdan o'tmagan, `@Cron` hech qachon ishlamagan, `@google/generative-ai` ni hardcode qilgan `RoomAnalysisCron` dublikati edi). Uning 3 ta jadvali **jonli DB'da qoldi** — commit izohi: "confirmed orphaned but dropping live tables needs explicit owner sign-off (Q-35)".
- **Nima yetishmaydi:** Egasi-qarori — bu 3 jadvalni o'chirish yoki `RoomAnalysisCron` ga ulash.
- **Ta'sir qiladigan EP bandlari:** EP-IOT-010 (etalon-rasm arxivi), EP-IOT-012

### VR-IOT-I05 · Norma/routing versiyalash + effective-date yo'q (SB0421) — IoT ╳ PP
- **Tur:** Krossmodul kod-kamchiligi
- **Dalil:** `EXTRACTION QISM A` Step-3 (SB0421, 2026-07-04) — "Norma/routing versiya + effective-date yo'q; **eski norma keyingi smenagacha** qo'llanmaydi". `QISM A #14` vizyon-talabi: norma o'zgartirilsa **ESKI norma** qo'llanadi, yangisi **faqat keyingi smenadan** (retroaktiv o'zgarish yo'q — audit tozaligi).
- **Nima yetishmaydi:** Versiyalash sxemasi qurilmagan. Bu EP-IOT-032 (norma) va EP-IOT-054 (imzo-zanjiri) qurilgandan **keyin darhol kerak bo'ladi**, aks holda norma o'zgarishi **HR oyligini orqaga qarab buzadi**.
- **Ta'sir qiladigan EP bandlari:** EP-IOT-032, 054, 074, 082

### VR-IOT-I06 · `iot_devices.id` = **integer** (jonli sxema fakti)
- **Tur:** Sxema fakti (qurilish topshirig'i emas — kelajakdagi drift oldini olish uchun qayd)
- **Dalil (jonli tasdiqlangan):** `iot_devices.id` ustuni **integer** (UUID emas), jadvalda **6 qator**, `thresholds` ustuni **JSONB**.
- **Nima uchun muhim:** Boshqa IoT/MES jadvallari uuid FK ishlatadi; `iot_devices` ga FK qo'shiladigan har qanday yangi kod **integer** kutishi shart. Bu tarixiy uuid╳integer driftlaridan biri (qv. "12 uuid FK deferred").
- **Ta'sir qiladigan EP bandlari:** EP-IOT-007 (thresholds PATCH), EP-IOT-001/023/071 (datchik reestri)

---

## III QISM — raqamlash, sanoq va manba-ziddiyatlari

### §1 — Xaritalash jadvali (`FULL-ITEM-LEVEL [Module-16]` ↔ `EP-IOT`)

| FIL Item | Manba | EP-IOT |
|---|---|---|
| **1..50** | `vision-1000-answers` #1..#50 = `EXTRACTION QISM A` #1..#50 | EP-kodsiz — mavzu bo'yicha `(taxminiy)` ulanadi |
| **51..52** | `TASDIQ-2146 §16 #1..#2` | EP-IOT-031..032 |
| **53** | `§16 #3` | EP-IOT-032 **sub** (norma imzo-zanjiri) + EP-IOT-054 |
| **54..55** | `§16 #4..#5` | EP-IOT-033..034 |
| **56** | `§16 #6` | EP-IOT-034 **sub** (udar→TO eslatmasi) |
| **57..70** | `§16 #7..#20` | EP-IOT-(Item−22) = 035..048 |
| **71** | `§16 #21` | EP-IOT-048 **sub** (smena uzunligi 8/10/12) |
| **72..106** | `§16 #22..#56` | EP-IOT-(Item−23) = 049..083 |
| **107..136** | `§16 #57..#86` | EP-IOT-(Item−106) = 001..030 |

**Nima uchun 136 item ↔ 83 EP:** 50 (EP-kodsiz kesishuvchi javoblar) + 3 (sub-savol) + 83 (EP-kodli) = 136. ✔

### §2 — `decisions/16-iot.md` Xulosa jadvalining tekshiruvi

`decisions/16-iot.md` o'z Xulosasida "✅ JAVOBLANGAN: 37 / 🔵 OCHIQ: 46" deb yozadi.
Band-ma-band qayta sanaldi:
- `grep -c '^- \*\*Holat:\*\* ✅ JAVOBLANGAN'` → **37**
- `grep -c '^- \*\*Holat:\*\* 🔵 OCHIQ'` → **46**
- `grep -c '^### EP-IOT-'` → **83**

Registrdagi ro'yxat manba ro'yxati bilan **1:1 mos keladi** (37 ta ✅ bandning kodlari
aynan bir xil). **FARQ YO'Q** — bu fayl to'g'ri (ba'zi boshqa modullardan farqli o'laroq).

### §3 — Manba-ziddiyatlari (8 ta, band ichida `⚠️ ZIDDIYAT` bilan belgilangan)

| EP | Ziddiyat | Kim ustun |
|---|---|---|
| EP-IOT-005 | `mes_downtime_reasons` "7 kod" (2026-06-27) ╳ "16 qator" (2026-07-11 jonli) | Jonli — son o'sgan, **mazmun bo'shlig'i qolgan** |
| EP-IOT-009 | `mes_telemetry` "384 qator" ╳ "876 qator"; hamda "retention cron yo'q" ╳ jonli **bo'sh cron bor** (VR-IOT-I02) | Jonli — cron bor lekin ishlamaydi |
| EP-IOT-010 | Item 116 "no 2-hour cron found" ╳ jonli `RoomAnalysisCron` `@Cron('0 */2 * * *')` **ro'yxatdan o'tgan** (VR-IOT-I03) | Jonli — audit faqat `iot/` ni grep qilgan |
| EP-IOT-021 | QISM A "`IotGateway` ro'yxatdan **o'tmagan**, o'lik WS" (07-04) ╳ Item 127 "**registered**, real" (07-11) | Kechroq (Item 127) — BE tayyor, FE yo'q |
| EP-IOT-036 | "7 kod, idle YO'Q" ╳ "16 qator" | Ikkalasi ham — son o'sgan, "иш йук" hamon yo'q |
| EP-IOT-039 | "setup ustun bor, **sim yo'q**" ╳ jonli "formula `setup_seconds` ni ayiradi" (`81ef299f`, 07-08) | Jonli — **band qurilgan**, hujjat eskirgan |
| EP-IOT-058 | handover "197-satr" ╳ jonli "237-satr" | Jonli — STALE-DOC, mexanizm real |
| EP-IOT-080 | checklist "331-348 satr" ╳ jonli "561-592 satr" | Jonli — STALE-DOC, mexanizm real |

**Naqsh:** 8 ziddiyatning **6 tasi bir xil turdagi** — 2026-06-27 / 2026-07-11 auditlari
kodning keyingi o'sishidan orqada qolgan (STALE-DOC), 2 tasi esa (EP-IOT-009, EP-IOT-010)
**audit qamrovi tor bo'lgani uchun** yuzaga kelgan (faqat `iot/` moduli grep qilingan,
`cron/` va `hr/inspection/` ko'rilmagan).

### §4 — 2026-08-06 auditining "9 mutatsiyadan 2 tasi tuzatilgan" topilmasi — **jonli tekshiruv 2026-08-07**

2026-08-06 auditi tablet FE'da "yashil-yolg'on" mutatsiya naqshini topgan
(xato yutiladi, mutatsiya har doim muvaffaqiyatli hal bo'ladi) va **9 mutatsiyadan
faqat 2 tasi tuzatilgan** deb belgilagan ("bir joyda tuzatilib, qo'shnilari unutilgan").

**Qolgan 7 tasi jonli kodda tekshirildi — natija: HAMMASI TUZATILGAN.**
`artifacts/erp-dashboard/src/pages/iot/useIoTTablet.ts` da **10 ta `res.ok` qo'riqchisi**
mavjud (satrlar 136, 166, 186, 192, 208, 226, 247, 268, 286, 316) — ya'ni sessiya,
material-skan, ekipaj, checklist (2 ta), to'xtatish, brak, handover, QC, prostoy —
**barcha mutatsiya yo'llari** endi HTTP xatosini `throw` qiladi.

Qolgan `catch {}` bloklar tekshirildi va **qonuniy** deb topildi:
- `useIoTTabletAlerts.ts:154` — `tabletFetchWithOffline`, oflayn navbatga qo'yish (`enqueueOfflineAction`), **ataylab**;
- `useIoTTabletAlerts.ts:190` — SOS jo'natish, `res.ok` tekshiruvi **bor** (182-satr), catch faqat tarmoq-xatosi toast'i;
- `useIoTTabletCore.ts:157` — `JSON.parse(localStorage)` himoyasi, tarmoq bilan bog'liq emas;
- `useIoTTabletData.ts` — `if (!res.ok) return []` naqshi (o'qish so'rovlari, mutatsiya emas).

**Xulosa:** bu audit-topilmasi **YOPILGAN**. `0f303945` (2026-08-06) `scanMaterial` ni
tuzatgan va qo'shni mutatsiyalar ham (avvalroq yoki shu to'lqinda) `res.ok` qo'riqchisiga
ega bo'lgan. BE tomonida ham `persistKitItemScan` endi `UPDATE...RETURNING` natijasini
**doim** tekshiradi (rollback-tx bilan DB-isbotlangan).

### §5 — 🔩 CAPEX-gate bandlarining to'liq ro'yxati (24 ta)

Bu bandlarda **jismoniy datchik/kamera yo'qligi** asosiy yoki teng darajadagi bloker:

**Mashina-datchik (ildiz: EP-IOT-001):** EP-IOT-006, 015, 034, 043, 055, 056, 060, 061, 063, 065, 068, 076, 083 *(qisman)*
**Energiya-datchik (ildiz: EP-IOT-018):** EP-IOT-018, 019, 020, 030, 064
**AI-kamera (ildiz: kamera infratuzilmasi):** EP-IOT-010, 011, 012, 077, 078
**Tablet apparati (yumshoq):** EP-IOT-022

⭐ **Egasi uchun eng muhim CAPEX ustuvorligi (decisions'dan chiqarilgan):**
1. **AI-kamera** — decisions uni "sensor EMAS → hozir joriy etiladigan **boshlang'ich**" deb belgilagan (EP-IOT-010/077); kod quvuri `0b034f84` bilan **to'liq ulangan**, faqat kamera kutilmoqda.
2. **Energiya-hisoblagich** — "bo'sh yonib turgan mashina pulni yeydi... **eng oson tejaladigan xarajat**" (EP-IOT-064); B-varianti (avval umumiy sex hisoblagichi) arzonroq boshlanish beradi.
3. **Kompressor bosim-datchigi** — "**bitta kompressor nazorati ko'p mashinani himoya qiladi**" (EP-IOT-065), CAPEX/foyda nisbati yuqori.
4. **Mashina-datchik (3-5 ta ustuvor)** — EP-IOT-001; EP-IOT-052 (авто vs ручная кашировка taqqoslash hisoboti) shu qarorga **raqamli asos** beradi, lekin uning o'zi hali qurilmagan.
