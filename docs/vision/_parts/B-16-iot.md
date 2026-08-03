## [B/TASDIQ] IoT / Telemetriya (16) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 16.1 | Mashina reestri "Станоклар норма" nomlari bilan seed | 2026-06-27 | TASDIQ-2146 §16 #1 | Zavod shu nomlar bilan ishlaydi | equipment reestri | SM-52/KBA-105/Тигель/Гофра/ФСМ seed | Qisman (equipment 7 qator, nomlar generik DEMO) | Struktura bor, nomlar noto'g'ri |
| 16.2 | Har mashinaga norma/soat + norma/12 soat | 2026-06-27 | TASDIQ-2146 §16 #2 | IoT haqiqiy bilan solishtiradi (performance %) | equipment/production_sessions | norma_per_hour/per_12h ustuni | Yo'q (faqat work_centers.norma_*_per_shift, sex-daraja) | Mashina-daraja norma yo'q |
| 16.3 | Norma РД4→Ген.Директор imzo-zanjiri tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §16 #3 | Kitobdagidek approval | norma-approval | imzo-zanjir + audit | Yo'q (EP-IOT-054 APPROVE qurilmagan) | Norma jadvali yo'q → zanjir yo'q |
| 16.4 | O'lchov birligi mashinaga qarab (м2/лист/штук/удар) | 2026-06-27 | TASDIQ-2146 §16 #4 | Har mashinada o'z birligi | production_sessions | unit/uom ustuni | Yo'q (faqat birliksiz qty) | Birlik biriktiruvi yo'q |
| 16.5 | Тигель udar/лист alohida hisoblagich | 2026-06-27 | TASDIQ-2146 §16 #5 | Resurs + ishlab chiqarish | telemetriya | udar/stroke ustuni | Yo'q (zarba-sensor o'rnatilmagan) | Fazaviy |
| 16.6 | Udar sonidan TO eslatmasi (har 1 mln udar) | 2026-06-27 | TASDIQ-2146 §16 #6 | Qolip resursi | ow_molds | udar-counter + eslatma mantiqasi | Yo'q (counter yo'q) | ow_molds bor, counter yo'q |
| 16.7 | SM/KBA ranglar soni (4+0/4+4) kuzatilsin | 2026-06-27 | TASDIQ-2146 §16 #7 | Texnik topshiriqdan | production_sessions/equipment | color_count/section ustuni | Yo'q (A-default, qurilmagan) | Texnik kartadan kelishi kerak |
| 16.8 | "иш йук" (idle) alohida holat/sabab | 2026-06-27 | TASDIQ-2146 §16 #8 | Rejalashtirish kamchiligi, nosozlikdan ajraladi | mes_downtime_reasons | idle kod qo'shish | Qisman (7 kod bor, idle YO'Q) | Struktura kengaytirishga tayyor |
| 16.9 | "Колиб тайёр эмас" to'xtash sababi + mas'ul | 2026-06-27 | TASDIQ-2146 §16 #9 | Qolip tsexi mas'ul | mes_downtime_reasons | alohida kod | Yo'q (DT-SETUP umumiy) | Kitob-sabab seed qilinmagan |
| 16.10 | "переделка" (kayta urilди) brak sabab kodi | 2026-06-27 | TASDIQ-2146 §16 #10 | Sabab kodi + izoh | defect_catalog | переделка kodi seed | Qisman (/defect REAL @iot-tablet.controller.ts:477, seed yo'q) | Endpoint bor, sabab seed emas |
| 16.11 | "настройка" setup vaqti ishlashdan ajratilsin | 2026-06-27 | TASDIQ-2146 §16 #11 | OEE'da hisobga olinadi | production_sessions | setup-stage sim | Qisman (setup_seconds/current_stage ustun bor, sim yo'q) | Struktura bor, oqim to'liq emas |
| 16.12 | Smena (А/Б/С) bo'yicha holat va norma | 2026-06-27 | TASDIQ-2146 §16 #12 | Smena boshlig'iga biriktiriladi | production_sessions.shift_id | А-Б-С KPI agregat | Qisman (shift ustunlar bor, data 0) | KPI agregatsiya tasdiqlanmadi |
| 16.13 | "keyingi иш" navbat Andon/IoT ekranida | 2026-06-27 | TASDIQ-2146 §16 #13 | MES'dan next job | machine_tasks | next-job ko'rsatuvi | Yo'q (machine_tasks 0 qator, A-default) | machine-status-current bor, next yo'q |
| 16.14 | Har mashinaga operator + yordamchi biriktirilsin | 2026-06-27 | TASDIQ-2146 §16 #14 | HR kartasidan kim ishlatdi | machine_crews | ekipaj biriktirish | Qisman (crew POST/GET REAL @controller:284,296, data 2 qator) | Ishlaydi, data minimal |
| 16.15 | Гофра м2-hisoblagich Ombor bilan bog'lansin | 2026-06-27 | TASDIQ-2146 §16 #15 | Isrof nazorati (м2 ↔ material) | gofra sensor | м2-balans taqqoslash | Yo'q (gofra-sensor yo'q) | Fazaviy |
| 16.16 | UV/лак sarfi varaqqa bog'lab kuzatilsin | 2026-06-27 | TASDIQ-2146 §16 #16 | Haqiqiy ↔ kutilgan lak sarf | telemetriya | lak-sarf jadval/endpoint | Yo'q (formula bilan, sensorsiz) | Egasi-javob #39 |
| 16.17 | Ламинация plyonka sarfi va isrofi | 2026-06-27 | TASDIQ-2146 §16 #17 | Chegaradan oshsa ogohlantirish | telemetriya | plyonka-sarf/isrof kuzatuv | Yo'q (sensorsiz) | Fazaviy |
| 16.18 | Степлер/Склейка qo'l ish joylari IoT'ga (tabletdan) | 2026-06-27 | TASDIQ-2146 §16 #18 | Норма bilan solishtiriladi, sensor yo'q | equipment reestri | qo'l-ish-joylari reestrga | Qisman (tablet REAL, mashina-data yo'q) | Mexanizm bor, data yo'q |
| 16.19 | Резка kirim nuqtasi (zanjir boshi) | 2026-06-27 | TASDIQ-2146 §16 #19 | Zanjir bo'ylab yo'qotish | operatsiya-zanjir | miqdor-uzatish mantiqasi | Yo'q | Zanjir uzatuvi yo'q |
| 16.20 | "отработано часов" vs 12 soatlik smena | 2026-06-27 | TASDIQ-2146 §16 #20 | Vaqt tahlili | production_sessions | 12-soat-baza breakdown hisoboti | Qisman (running/stopped/setup_seconds ustun bor, data 0) | Struktura bor, hisobot tasdiqlanmadi |
| 16.21 | Smena uzunligi 8/10/12 soat mashinaga sozlanadi | 2026-06-27 | TASDIQ-2146 §16 #21 | Mashina/sexga qarab | config | smena-uzunlik ustuni/konfig | Yo'q | Konfig topilmadi |
| 16.22 | "ко-во работ" (smenada ish soni) o'lchansin | 2026-06-27 | TASDIQ-2146 §16 #22 | Har biriga sozlash vaqti | telemetriya | job-count agregatsiya | Yo'q | Endpoint yo'q |
| 16.23 | Брак % chegaradan oshsa avto alert (ekran+Telegram) | 2026-06-27 | TASDIQ-2146 §16 #23 | Smena boshlig'i + sifatga signal | iot_alerts | brak%-monitoring + alert | Yo'q (iot_alerts 0 qator) | Brak-qayd bor, monitoring yo'q |
| 16.24 | Brak chegarasi mashina turiga qarab | 2026-06-27 | TASDIQ-2146 §16 #24 | IChB belgilaydi | config | brak-chegara konfig jadval | Yo'q | Konfig jadvali yo'q |
| 16.25 | Авто vs ручная кашировка samaradorligi | 2026-06-27 | TASDIQ-2146 §16 #25 | CAPEX qaror (m2/soat, brak, mehnat) | equipment reestri | 3-tur reestr + taqqoslama | Yo'q (reestr generik) | Taqqoslama hisobot yo'q |
| 16.26 | Mashina "иш %" (yuklanish) + bottleneck | 2026-06-27 | TASDIQ-2146 §16 #26 | Kun/hafta yuklanish, bo'g'iz | OEE/CRP | yuklanish % + bottleneck bayroq | Qisman (OEE REAL, bottleneck PP/CRP orqali) | Egasi-javob #49 |
| 16.27 | "Согласовано РД4/Утверждено Ген.Директор" norma tasdiq | 2026-06-27 | TASDIQ-2146 §16 #27 | Audit jurnali bilan | norma-approval | approval zanjir + audit | Yo'q (EP-IOT-054 qurilmagan) | Mashina-norma jadvali yo'q |
| 16.28 | ФСМ tezligi va uzilishi (зажор) | 2026-06-27 | TASDIQ-2146 §16 #28 | Ko'paysa ogohlantirish | equipment/telemetriya | ФСМ reestr + tiqilish counter | Yo'q (sensorsiz) | ФСМ reestrda yo'q |
| 16.29 | Тигель qolip resursi udar soniga bog'lash + eslatma | 2026-06-27 | TASDIQ-2146 §16 #29 | Resurs chegarasi → eslatma | ow_molds | udar-counter/resurs-chegara ustun | Yo'q | Eslatma mantiqasi yo'q |
| 16.30 | Defekt sababini operator tayyor ro'yxatdan tanlasin | 2026-06-27 | TASDIQ-2146 §16 #30 | Qolip yarim/podrezka/rang/ho'l + izoh | defect_catalog | tayyor sabab ro'yxati seed | Qisman (/defect REAL @controller:477, seed tasdiqlanmadi) | Endpoint sabab-kod qabul qiladi |
| 16.31 | Smena topshirish (А→Б) mashina holati qayd | 2026-06-27 | TASDIQ-2146 §16 #31 | Tugatilmagan ish + qolip/material + izoh | mes_shift_handovers | handover ekran + qayd | Ha (/tablet/handover REAL @controller:197, raqamli imzo) | Mexanizm to'liq, data 0 |
| 16.32 | "иш йук" da muqobil ishga (паддон/арчиш) o'tkazish qayd | 2026-06-27 | TASDIQ-2146 §16 #32 | Vaqt alohida sanaladi | HR-tabel + IoT | muqobil-ish kodi | Yo'q (qurilmagan) | Egasi-javob #36/#46 |
| 16.33 | Гофра намлik/клей sensor bilan kuzatilsin | 2026-06-27 | TASDIQ-2146 §16 #33 | Chegaradan chiqsa ogohlantirish | maxsus sensor | namlik/yelim-harorat sensor | Yo'q (sensorsiz) | Fazaviy |
| 16.34 | Ofset краска qutisi darajasi kuzatilsin | 2026-06-27 | TASDIQ-2146 §16 #34 | Past bo'lsa Ombordan avto talab | sensor | bo'yoq-daraja sensor/alert | Yo'q (sensorsiz) | |
| 16.35 | Автовысечка картон vs гофра ajratilsin | 2026-06-27 | TASDIQ-2146 §16 #35 | O'z normasi bilan | equipment reestri | rejim-ajratish + norma | Yo'q (reestr generik) | Norma-data yo'q |
| 16.36 | Mashina ON/OFF vaqti avto yozilsin | 2026-06-27 | TASDIQ-2146 §16 #36 | Tabel rejasi bilan solishtiriladi | machine_status_logs | avto ON/OFF tok-sensor yozuvi | Qisman (status_logs 9 qator, avto-sensor yo'q, qo'lda/AI) | Struktura bor |
| 16.37 | Энергия idle (bekor yonib turgan) tok topish | 2026-06-27 | TASDIQ-2146 §16 #37 | Bo'sh tok ogohlantiriladi | energiya | idle-tok ajratish | Yo'q (501 @iot-main.controller.ts:153, EP-IOT-018-PENDING) | 🔑 sensor o'rnatilgach |
| 16.38 | Kompressor/havo (пневматика) bosimi kuzatilsin | 2026-06-27 | TASDIQ-2146 §16 #38 | Tushsa ogohlantirish | sensor | bosim sensor-monitoring | Yo'q (qurilmagan) | Egasi-javob #18 |
| 16.39 | Andon normaga nisbatan real bajarish (qizil/yashil) | 2026-06-27 | TASDIQ-2146 §16 #39 | Target vs haqiqiy + ortda qolish % | production_sessions | to'liq Andon ekrani + norma-asos | Qisman (target/actual_qty bor, FE OEELiveMonitorPage, norma yo'q) | Norma mashina-kartasida yo'q |
| 16.40 | Окошка alohida bosqich/operatsiya | 2026-06-27 | TASDIQ-2146 §16 #40 | Plyonka sarfi + brak | equipment reestri | operatsiya reestrga | Yo'q | Reestrda yo'q |
| 16.41 | Тиснение/Конгрев folga sarfi va udar | 2026-06-27 | TASDIQ-2146 §16 #41 | Isrof ko'rsatiladi | telemetriya | folga-sarf/udar kuzatuv | Yo'q (udar-counter yo'q) | |
| 16.42 | Mashina-mashina НЗП buyurtma kuzatilsin | 2026-06-27 | TASDIQ-2146 §16 #42 | Qaysi mashinada, qancha kutdi | planning_operations | IoT-NZP integratsiya | Yo'q (planning_operations bor, IoT integr. tasdiqlanmadi) | |
| 16.43 | "Папка №" IoT yozuviga bog'lansin | 2026-06-27 | TASDIQ-2146 §16 #43 | Buyurtma kodiga bog'lash | production_sessions.production_order_id | sessiya↔папка bog'lanish | Qisman (papka_no ustunlar bor, data 0) | Struktura bor, data yo'q |
| 16.44 | Sensor signal yo'qolsa "noma'lum" vaqt ajratilsin | 2026-06-27 | TASDIQ-2146 §16 #44 | OEE maxrajiga kirmaydi (halol hisob) | production_sessions.last_signal_at | maxrajdan chiqarish qoidasi | Qisman (last_signal_at bor, qoida tasdiqlanmadi) | Egasi-javob #12 |
| 16.45 | Mashina TO tarixi qog'ozdan IoT'ga | 2026-06-27 | TASDIQ-2146 §16 #45 | MTBF ko'rinadi | equipment_maintenance | tarix-data ko'chirish | Qisman (jadvallar+ustunlar bor, data ko'chirilmagan) | DEMO machines |
| 16.46 | TO ehtiyot qismi Ombor bilan bog'lansin | 2026-06-27 | TASDIQ-2146 §16 #46 | Chiqim + min.zaxira ogohlantirish | mro_inventory | ta'mir-qism→Ombor-chiqim | Yo'q (mro_inventory alohida) | IoT'da bog'lanish yo'q |
| 16.47 | "Norma bajarilmadi" avto sabab tahlil (downtime breakdown) | 2026-06-27 | TASDIQ-2146 §16 #47 | Avto: '3 soat иш йук + 1 soat созлаш' | downtime_events | avto-breakdown hisoboti | Qisman (setup/run/stopped_seconds bor, tahlil tasdiqlanmadi) | Norma-asos yo'q to'siq |
| 16.48 | Brak material qayta ishlatish (макулатура) | 2026-06-27 | TASDIQ-2146 §16 #48 | Material balansi | waste_records | IoT-brak→makulatura kuzatuv | Yo'q (waste_records alohida) | |
| 16.49 | Sensor/o'lchagich kalibrovka muddati eslatmasi | 2026-06-27 | TASDIQ-2146 §16 #49 | Data ishonchi | telemetriya | sensor kalibr-eslatma | Yo'q (ai_calibration_runs faqat AI-model) | Sensorsiz |
| 16.50 | Kamera-AI himoya vositasi (qo'lqop/ko'zoynak) tekshirsin | 2026-06-27 | TASDIQ-2146 §16 #50 | Yo'q bo'lsa ogohlantirish/qayd | camera/vision | real vision-inferens (PPE) | Yo'q (config/dashboard CRUD, model yo'q, 0 qator) | 🔑 AI-kamera o'rnatilmagan |
| 16.51 | Kamera-AI xavfli zonada odam yo'qligini tekshirsin | 2026-06-27 | TASDIQ-2146 §16 #51 | Odam kirsa darhol ogohlantirish | camera_alerts | xavfli-zona vision-detect | Yo'q (camera_alerts 0 qator, faqat doc-comment) | 🔑 kamera o'rnatilgach |
| 16.52 | Tungi smena (С) avto nazorat kuchaytirilsin | 2026-06-27 | TASDIQ-2146 §16 #52 | Anomaliya/idle chegara pasaytiriladi + Telegram | config | pasaytirilgan-chegara + eskalatsiya | Yo'q | Topilmadi |
| 16.53 | Mashina boshlashdan majburiy "tayyorlik checklist" | 2026-06-27 | TASDIQ-2146 §16 #53 | To'ldirilmasa ish ochilmaydi | setup_checklists | majburlash mexanizmi | Ha (REAL @iot-tablet.controller.ts:331-348, fail-safe BLOCK) | Mexanizm to'liq ishlaydi |
| 16.54 | Mashina samaradorligi GSD/ЦКП ShVB'ga avto uzatilsin | 2026-06-27 | TASDIQ-2146 §16 #54 | Ishlab chiqarish statistikasi | oee_records | avto GSD→ShVB event-zanjir | Qisman (OEE REAL, uzatish tasdiqlanmadi, 0 qator) | ЦКП IoT/MES'dan keyin avto |
| 16.55 | Mashina ko'rsatkichini operator KPI'siga bog'lash | 2026-06-27 | TASDIQ-2146 §16 #55 | Idle/material/qolip chiqarib tashlanadi | machine_crews | OEE→oylik adolatli-koeff | Qisman (operator_id/crew bog'lanish bor, HR bog'lanish tasdiqlanmadi) | Mexanizm-asos bor |
| 16.56 | Ofset plastina (колиб/CTP) tayyorlik navbatda | 2026-06-27 | TASDIQ-2146 §16 #56 | Preprint'dan indikator | machine-navbat | plastina-tayyor indikatori | Yo'q (navbat-ko'rsatuv ham yo'q, Q11 bilan) | |
| 16.57 | Sensor qaysi mashinalarga qo'yiladi (bosqichli) | 2026-06-27 | TASDIQ-2146 §16 #57 | 3-5 asosiy (Гофра/KBA/ФСМ) | sensor_devices | egasi CAPEX qarori | egasi-data (sensor_devices 0 qator) | 🔑 IoT fizikan o'rnatilmagan |
| 16.58 | Mashina holati ranglari (5 holat master) | 2026-06-27 | TASDIQ-2146 §16 #58 | Ishlayapti/To'xtagan/Sozlanmoqda/Nosoz/O'chiq | machine_status_logs | 5-holat enum seed/cheklov | Qisman (status/previous_status ustun bor, enum tasdiqlanmadi) | Struktura bor |
| 16.59 | Mashina uptime ko'rsatkichi (avto, GSD'ga) | 2026-06-27 | TASDIQ-2146 §16 #59 | Smena/kun/hafta | oee-calculator | avto-uptime→GSD ulash | Qisman (availability REAL, GSD ulanish tasdiqlanmadi, data 0) | Hisob-asos bor |
| 16.60 | To'xtash sababini tayyor ro'yxatdan yozish | 2026-06-27 | TASDIQ-2146 §16 #60 | Planlangan/planlanmagan ajraladi | mes_downtime_reasons | sabab tanlash mexanizmi | Ha (/downtime-events REAL @controller:577, 7 kod is_planned bayroq) | Mexanizm to'liq |
| 16.61 | To'xtash sabablari ro'yxati (8-10 standart master) | 2026-06-27 | TASDIQ-2146 §16 #61 | + kitob real sabablar | mes_downtime_reasons | 8-10 kod + kitob-sabab | Qisman (7/10, kitob-sabab yetishmaydi) | иш йук/колиб/переделка yo'q |
| 16.62 | Anomaliya ogohlantirishi | 2026-06-27 | TASDIQ-2146 §16 #62 | Avto aniqlash + darhol alert (ekran+Telegram) | iot_alerts | real anomaliya-data | Qisman (handlerlar bor, iot_alerts 0, sensorsiz) | Struktura-tayyor |
| 16.63 | Anomaliya chegaralarini kim belgilaydi | 2026-06-27 | TASDIQ-2146 §16 #63 | Admin/IChB sozlaydi | iot_devices.thresholds | mashina-turi + approval | Qisman (thresholds JSONB + update-handler REAL, approval tasdiqlanmadi) | Mexanizm-asos bor |
| 16.64 | Anomaliya kelganda workflow (texnik vazifa + xabar) | 2026-06-27 | TASDIQ-2146 §16 #64 | Avto vazifa + mexanikga xabar + jurnal | maintenance workflow | anomaly→task uchidan-uchiga | Yo'q (handler bor, zanjir 0-data) | |
| 16.65 | Telemetriya tarixi saqlash muddati (downsampling) | 2026-06-27 | TASDIQ-2146 §16 #65 | 3-6 oy keyin kunlik siqish | mes_telemetry | downsampling/retention cron | Yo'q (mes_telemetry 384 qator, cron yo'q) | Egasi-javob #30 |
| 16.66 | Kamera-AI xona inspeksiyasi (ideal-rasm, har 2 soat) | 2026-06-27 | TASDIQ-2146 §16 #66 | AI ball + anomaliya taqqoslash | ideal_rasm_targets | real vision-taqqoslash + cron | Yo'q (0 qator, endpoint repo-backed, inferens yo'q) | 🔑 infratuzilma yo'q |
| 16.67 | Kamera-AI nimani tekshiradi (5-7 mezon master) | 2026-06-27 | TASDIQ-2146 §16 #67 | tozalik/himoya/yo'lak/tartib/xavfsizlik | inspeksiya-mezon | mezon master-ro'yxat seed | Yo'q | AI-kamera yo'q |
| 16.68 | Inspeksiya buzilishini tuzatish jurnali (yopiq sikl) | 2026-06-27 | TASDIQ-2146 §16 #68 | mas'ul→muddat→tuzatildi | room-inspections | buzilish→correction yopiq-sikl | Yo'q (endpoint bor, oqim tasdiqlanmadi, 0 data) | |
| 16.69 | MES bilan ulanish (ish buyrug'i ↔ mashina, oltin-ip) | 2026-06-27 | TASDIQ-2146 §16 #69 | Chiqarilgan dona avto-yoziladi | production_sessions ╳ mes_sessions | to'liq sinxron | Qisman (bog'lanish-asos bor, sessiya-jadval bo'linishi) | IOT-MES gap, har biri 8 qator |
| 16.70 | OEE (3 omil) ko'rsatkichi | 2026-06-27 | TASDIQ-2146 §16 #70 | Vaqt+tezlik+sifat avto + trend | oee-calculator | to'liq 3-omil kalkulyator | Ha (REAL @oee-calculator.service.ts:118-121, clamp+Zod, WS) | Kalkulyator to'liq |
| 16.71 | RUL — qolgan resurs (predictive maintenance) | 2026-06-27 | TASDIQ-2146 §16 #71 | Oddiy qoidaga asoslangan prognoz | predictive-maintenance | evristik RUL prognoz | Qisman (REAL @service 304 qator, sensor-data 0) | Mexanizm bor, data yo'q |
| 16.72 | TO jadvali (reja-profilaktika) | 2026-06-27 | TASDIQ-2146 §16 #72 | Ish soatiga bog'liq + eslatma + bajarildi | maintenance_orders | avto-jadval + eslatma cron | Qisman (ustunlar+jadvallar bor, avto-generatsiya tasdiqlanmadi) | Struktura bor |
| 16.73 | TO ishlari ro'yxati (master-data) | 2026-06-27 | TASDIQ-2146 §16 #73 | Standart ishlar + davriylik | TO-master | mashina-turi katalog | Yo'q (mes_maintenance_tasks bor, katalog emas) | |
| 16.74 | Energiya (tok) iste'moli (mashina darajasi) | 2026-06-27 | TASDIQ-2146 §16 #74 | Har mashina necha kVt | energiya | mashina-daraja o'lchash | egasi-data (501 @iot-main.controller.ts:153, EP-IOT-018-PENDING) | 🔑 sensor fizikan yo'q |
| 16.75 | Energiya hisobot va ogohlantirish | 2026-06-27 | TASDIQ-2146 §16 #75 | Norma + oshganda alert + haftalik | energiya | hisobot/ogohlantirish | Yo'q (501, sensorsiz) | 🔑 egasi-data |
| 16.76 | Birlik mahsulotga energiya sarfi (ShVB) | 2026-06-27 | TASDIQ-2146 §16 #76 | Avto energiya/MES dona + GSD | energiya | birlik-energiya hisob | Yo'q (energiya-data yo'q, 501) | 🔑 egasi-data |
| 16.77 | Sex katta ekrani (Andon tablosi) | 2026-06-27 | TASDIQ-2146 §16 #77 | Barcha mashina + to'xtaganlar qizil + jonli | iot.gateway/FE | to'liq Andon-grid tablo | Qisman (machine-status-current + WS bor, FE grid tasdiqlanmadi) | Asos bor |
| 16.78 | Operator tableti (mashina yonida) | 2026-06-27 | TASDIQ-2146 §16 #78 | Holat + to'xtash + defekt + hisobot | iot-tablet | to'liq tablet ilova | Ha (FE IoTTablet + BE 20+ endpoint REAL) | Eng kuchli qism |
| 16.79 | Sensor uzilganda "Aloqa yo'q" holati | 2026-06-27 | TASDIQ-2146 §16 #79 | Signal yo'q ≠ to'xtagan + texnikga xabar | production_sessions.last_signal_at | alohida-holat-flag + xabar | Qisman (last_signal_at bor, flag/oqim tasdiqlanmadi) | |
| 16.80 | Holat/xabarlar kimga boradi (karta-model marshrut) | 2026-06-27 | TASDIQ-2146 §16 #80 | anomaliya→mexanik, uzun-to'xtash→sex boshlig'i | sos-alert event | IoT-xabar→org-karta marshrut | Qisman (sos-alert event bor, marshrut tasdiqlanmadi) | Asos bor |
| 16.81 | Mashina samaradorligini kartaga bog'lash (GSD lavozimga) | 2026-06-27 | TASDIQ-2146 §16 #81 | OEE/uptime → operator/mexanik kartasi | operator_card_id | avto-GSD→karta event | Qisman (card_id + crew bor, event-zanjir tasdiqlanmadi, data 0) | Asos bor, sim to'liq emas |
| 16.82 | Defekt/sifatni mashinaga bog'lash (MES orqali) | 2026-06-27 | TASDIQ-2146 §16 #82 | Qaysi mashina ko'p brak | quality-defects | smena + Pareto agregat | Qisman (/defect + /inline-qc REAL, tahlil tasdiqlanmadi) | Brak-qayd ishlaydi |
| 16.83 | IoT smena hisoboti (avtomatik, invoys PDF) | 2026-06-27 | TASDIQ-2146 §16 #83 | Sex/Telegram + rasmiy invoys PDF | completion-report | avto-hisobot + invoys-PDF | Qisman (completion-report REAL, invoys-PDF yo'q) | |
| 16.84 | Telegram orqali IoT xabarlari (ShVB bot) | 2026-06-27 | TASDIQ-2146 §16 #84 | Faqat muhim hodisalar, sozlanadi | telegram integr. | IoT-hodisa→Telegram marshrut | Yo'q (iot_alerts 0, marshrut tasdiqlanmadi) | Telegram alohida modul |
| 16.85 | Mashinalar reestri (master-data, yagona haqiqat) | 2026-06-27 | TASDIQ-2146 §16 #85 | Barcha IoT/ta'mir/sifat shunga bog'lanadi | equipment | yagona reestr + real data | Qisman (equipment reestr-asos bor 7 qator, data DEMO) | Struktura kanonik, content test |
| 16.86 | Energiya iste'molini Finance bilan bog'lash (tannarx) | 2026-06-27 | TASDIQ-2146 §16 #86 | Sarf → tannarxga avto | energiya→GL | kVt×soat koeff→GL | Yo'q (energiya-data yo'q, 501) | 🔑 egasi-javob #17/#27 |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Mashina norma/soat + norma/12 soat ustuni | 2026-06-27 | TASDIQ-2146 §16 #2 | Mashina-daraja norma jadvali yo'q | IoT |
| Norma РД4→Direktor imzo-zanjiri | 2026-06-27 | TASDIQ-2146 §16 #3 | Norma jadvali yo'q → EP-IOT-054 APPROVE qurilmagan | IoT |
| Mashinaga o'lchov birligi (м2/лист/удар) | 2026-06-27 | TASDIQ-2146 §16 #4 | production_sessions unit ustuni yo'q | IoT |
| Тигель udar/лист hisoblagichi | 2026-06-27 | TASDIQ-2146 §16 #5 | Zarba-sensor o'rnatilmagan (fazaviy) | IoT |
| Udardan TO eslatmasi (1 mln udar) | 2026-06-27 | TASDIQ-2146 §16 #6 | udar-counter/qolip-resurs jadvali yo'q | IoT |
| SM/KBA ranglar soni (4+0/4+4) | 2026-06-27 | TASDIQ-2146 §16 #7 | color_count ustuni qurilmagan (A-default) | IoT |
| "Колиб тайёр эмас" sabab + mas'ul | 2026-06-27 | TASDIQ-2146 §16 #9 | Kitob-sabab kodi seed qilinmagan | IoT |
| Гофра м2 ↔ Ombor material balans | 2026-06-27 | TASDIQ-2146 §16 #15 | Gofra-sensor o'rnatilmagan (fazaviy) | IoT |
| UV/лак sarfi varaqqa bog'lash | 2026-06-27 | TASDIQ-2146 §16 #16 | Formula/sensor qurilmagan (#39) | IoT |
| Ламинация plyonka sarfi/isrofi | 2026-06-27 | TASDIQ-2146 §16 #17 | Sensorsiz, kuzatuv yo'q | IoT |
| Резка kirim nuqtasi (zanjir uzatuv) | 2026-06-27 | TASDIQ-2146 §16 #19 | Operatsiya-zanjir miqdor-uzatuv yo'q | IoT |
| Smena uzunligi 8/10/12 sozlanadi | 2026-06-27 | TASDIQ-2146 §16 #21 | Konfig ustuni topilmadi | IoT |
| "ко-во работ" smenada ish soni | 2026-06-27 | TASDIQ-2146 §16 #22 | Job-count agregatsiya yo'q | IoT |
| Брак % chegara avto-alert (Telegram) | 2026-06-27 | TASDIQ-2146 §16 #23 | iot_alerts 0, monitoring yo'q | IoT |
| Brak chegarasi mashina turiga | 2026-06-27 | TASDIQ-2146 §16 #24 | Konfig jadvali yo'q | IoT |
| Авто/ручная кашировка taqqoslash | 2026-06-27 | TASDIQ-2146 §16 #25 | Reestr generik, taqqoslama yo'q | IoT |
| Norma tasdiq zanjiri (audit jurnal) | 2026-06-27 | TASDIQ-2146 §16 #27 | Mashina-norma jadvali yo'q | IoT |
| ФСМ tezligi/uzilishi (зажор) | 2026-06-27 | TASDIQ-2146 §16 #28 | ФСМ reestrda yo'q, counter yo'q | IoT |
| Тигель qolip resursi + eslatma | 2026-06-27 | TASDIQ-2146 §16 #29 | udar-counter/resurs-chegara yo'q | IoT |
| "иш йук" muqobil ish qaydi | 2026-06-27 | TASDIQ-2146 §16 #32 | Muqobil-ish kodi qurilmagan (#36/#46) | IoT |
| Гофра намлik/клей sensor | 2026-06-27 | TASDIQ-2146 §16 #33 | Maxsus sensor fazaviy | IoT |
| Ofset краска qutisi darajasi | 2026-06-27 | TASDIQ-2146 §16 #34 | Sensorsiz | IoT |
| Автовысечка картон vs гофра | 2026-06-27 | TASDIQ-2146 §16 #35 | Reestr generik, norma-data yo'q | IoT |
| Энергия idle-tok topish | 2026-06-27 | TASDIQ-2146 §16 #37 | 🔑 Energiya-sensor o'rnatilmagan (501) | IoT |
| Kompressor/havo bosimi | 2026-06-27 | TASDIQ-2146 §16 #38 | Sensor qurilmagan (#18) | IoT |
| Окошка alohida operatsiya | 2026-06-27 | TASDIQ-2146 §16 #40 | Reestrda yo'q | IoT |
| Тиснение/Конгрев folga sarfi/udar | 2026-06-27 | TASDIQ-2146 §16 #41 | udar-counter umuman yo'q | IoT |
| Mashina-mashina НЗП kuzatuv | 2026-06-27 | TASDIQ-2146 §16 #42 | IoT-NZP integratsiya tasdiqlanmadi | IoT |
| TO ehtiyot qismi Ombor bilan | 2026-06-27 | TASDIQ-2146 §16 #46 | IoT'da ta'mir-qism→Ombor bog'lanish yo'q | IoT |
| Brak → makulatura kuzatuv | 2026-06-27 | TASDIQ-2146 §16 #48 | IoT-brak→makulatura taqdir yo'q | IoT |
| Sensor kalibrovka muddati eslatmasi | 2026-06-27 | TASDIQ-2146 §16 #49 | Sensorsiz | IoT |
| Kamera-AI himoya vositasi (PPE) | 2026-06-27 | TASDIQ-2146 §16 #50 | 🔑 AI-kamera infratuzilma yo'q, 0 qator | IoT |
| Kamera-AI xavfli zona (odam) | 2026-06-27 | TASDIQ-2146 §16 #51 | 🔑 Vision-model yo'q, camera_alerts 0 | IoT |
| Tungi smena avto nazorat | 2026-06-27 | TASDIQ-2146 §16 #52 | Pasaytirilgan-chegara/eskalatsiya yo'q | IoT |
| Ofset plastina navbatda indikator | 2026-06-27 | TASDIQ-2146 §16 #56 | Navbat-ko'rsatuv ham yo'q (Q11) | IoT |
| Sensor qaysi mashinalarga (bosqichli) | 2026-06-27 | TASDIQ-2146 §16 #57 | 🔑 IoT fizikan o'rnatilmagan, CAPEX qaror | IoT |
| Anomaliya→workflow (vazifa+xabar) | 2026-06-27 | TASDIQ-2146 §16 #64 | Uchidan-uchiga zanjir 0-data | IoT |
| Telemetriya downsampling/retention | 2026-06-27 | TASDIQ-2146 §16 #65 | Cron qurilmagan (#30) | IoT |
| Kamera-AI xona inspeksiyasi (2 soat) | 2026-06-27 | TASDIQ-2146 §16 #66 | 🔑 Vision-inferens yo'q, cron yo'q | IoT |
| Kamera-AI mezon master (5-7) | 2026-06-27 | TASDIQ-2146 §16 #67 | AI-kamera infratuzilmasi yo'q | IoT |
| Inspeksiya tuzatish jurnali (yopiq sikl) | 2026-06-27 | TASDIQ-2146 §16 #68 | Yopiq-sikl oqimi tasdiqlanmadi, 0 data | IoT |
| TO ishlari master-data ro'yxati | 2026-06-27 | TASDIQ-2146 §16 #73 | Standart-ishlar katalogi yo'q | IoT |
| Energiya (tok) iste'moli mashina-daraja | 2026-06-27 | TASDIQ-2146 §16 #74 | 🔑 Energiya-sensor fizikan yo'q (501) | IoT |
| Energiya hisobot/ogohlantirish | 2026-06-27 | TASDIQ-2146 §16 #75 | 🔑 Sensorsiz (501) | IoT |
| Birlik mahsulotga energiya sarfi | 2026-06-27 | TASDIQ-2146 §16 #76 | 🔑 Energiya-data yo'q (501) | IoT |
| Telegram IoT xabarlari (ShVB bot) | 2026-06-27 | TASDIQ-2146 §16 #84 | iot_alerts 0, marshrut tasdiqlanmadi | IoT |
| Energiya → Finance (tannarx GL) | 2026-06-27 | TASDIQ-2146 §16 #86 | 🔑 Energiya-data yo'q (#17/#27) | IoT |
