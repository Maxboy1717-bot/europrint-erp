# IoT Sex-Ekrani (Kiosk) — 30 Yangi Taklif (Maxboy uchun ko'rib chiqish)

**Sana:** 2026-07-04
**Turi:** Faqat brainstorm / tahlil. Hech qanday kod yozilmadi yoki o'zgartirilmadi.
**Asos:** Har taklif kodbazadagi HAQIQIY jadval/modulga bog'langan (mavjudligi tekshirilgan). Bu ekran = mashinaga o'rnatilgan devoriy kiosk (kamerasiz).

> **Muhim eslatma (prerekvizit):** Oldingi tekshiruv (`IOT-TABLET-PAGE-DEEP-DIVE-2026-07-04.md`) ekranning yozuv-marshrutlari (`production-sessions`, `defect`, `downtime`, `handover` …) `@Roles(...IOT_READ)` JWT-guard bilan yopilganini, tablet esa faqat `x-tablet-token` yuborishini aniqlagan — hozir bular 401 qaytaradi. Quyidagi ko'p taklif shu auth-to'siq tuzatilishini nazarda tutadi. Bu to'siq — 0-raqamli asosiy ish (ro'yxatda takliflardan alohida).

Quyidagi takliflar 40 ta allaqachon ma'lum band (20 vizyon-talab + 20 qabul qilingan)dan **butunlay farq qiladi** — takrorlanmagan.

---

## 1. Ish oqimi (workflow) yaxshilanishlari

| # | Taklif | Effort | Bog'liq modul/jadval | Qisqa izoh |
|---|--------|--------|----------------------|------------|
| W1 | Order QR ↔ material barcode bog'liqlik validatsiyasi: skanlangan material shu orderga biriktirilgan checklist tarkibida bo'lmasa — bloklash | MEDIUM | `material_kits`/`material_kit_items` + `material_barcodes` | Noto'g'ri material iste'molini fizik darajada to'xtatadi (dual-scan vizyonining yadrosi) |
| W2 | "Paddon yopildi" tugmasi → child paddon/pallet yorlig'ini ekrandan chop-navbatiga avtomatik yuborish (sex kodi, soni, sana bilan) | LOW-MEDIUM | `barcode_print_queue` + `material_barcodes` | Parent-child barcode strukturasini operator qo'li bilan emas, oqim ichida generatsiya qiladi |
| W3 | Sozlash (setup) vaqtini alohida timer bilan qayd etish — ish boshlashdan oldingi tayyorgarlik | MEDIUM | `oee_records` + `production_sessions` (yangi `setup_seconds` ustuni) | Hozir OEE proksi-formuladan foydalanadi (SB0322); aniq setup-vaqti bilan haqiqiy OEE |
| W4 | "Materialsiz kutish" holati: checklist materiali omborda 0 bo'lsa sessiyani `blocked_waiting_material` ga o'tkazib, MM ga signal | MEDIUM | `warehouse_stock` + `production_sessions.status` | Operator yo'q material bilan "boshladim" deb qo'ymaydi; kutish vaqti aniq o'lchanadi |
| W5 | Vaqtincha operator almashinuvi (tushlik/tanaffus) — to'liq logout qilmay crew ichida "aktiv operator"ni almashtirish | MEDIUM | `production_sessions` crew + `employee_work_centers` | Bir ekran-ko'p smena realligiga mos; uzluksiz sessiya, lekin kim ishlagani aniq |

---

## 2. Ma'lumot sifati va nazorat

| # | Taklif | Effort | Bog'liq modul/jadval | Qisqa izoh |
|---|--------|--------|----------------------|------------|
| D1 | Miqdor sanity-check: skanlangan/kiritilgan material normadan (BOM) ±X% chiqsa qo'shimcha tasdiq so'rash | LOW-MEDIUM | `material_kit_items.required_quantity` | Terish xatosi (masalan 100 o'rniga 1000) ni ushlaydi |
| D2 | Ikki tomonlama brak balansi: operator qayd etgan brak vs QC officer topgan brak farqi katta bo'lsa avto-flag | MEDIUM | `qc_braks` + `inline_qc_checks` | Operator brakni yashirishiga qarshi nazorat (anti-fraud) |
| D3 | Child barcode dublikat-himoyasi: bitta paddon barcode ikki marta iste'mol/skan qilinmasin | LOW | `material_barcodes` + `barcode_movements` | Bir yorliqni qayta ishlatib hisobotni shishirish oldini oladi |
| D4 | Downtime "nol-hisobot" nazorati: sensordan mashina uptime=0 lekin operator downtime qaydsiz → avto-flag menejerga | MEDIUM | `mes_telemetry` + `downtime_events` | Qayd etilmagan to'xtash vaqtini sensordan aniqlaydi (OEE haqiqiyligi) |
| D5 | Order QR holat/tegishlilik tekshiruvi: bekor qilingan yoki boshqa sexga tegishli order skanlansa rad etish | LOW | `production_orders.status` + `org_departments` | Noto'g'ri/eski order bo'yicha ishlab chiqarishni boshlashni bloklaydi |

---

## 3. Menejer/direktor ko'rinishi

| # | Taklif | Effort | Bog'liq modul/jadval | Qisqa izoh |
|---|--------|--------|----------------------|------------|
| M1 | Sex-darajali jonli "andon" devor-paneli: barcha mashinalar holati + aktiv operator fotosi bitta menejer ekranida | MEDIUM | `oee_records` + `production_sessions` + `employees.photo_url` | Uzoqdan bir qarashda butun sexni ko'rish (individual ekranlarning yig'ma ko'rinishi) |
| M2 | Smena yakunida avtomatik "top-3 muammo" xulosasi direktorga (eng ko'p downtime/brak sabablari) | MEDIUM | `downtime_reason_codes` + `qc_braks` | Direktor har smena bo'yicha 3 ta asosiy muammoni o'qimasdan ko'radi |
| M3 | Real-vaqt "reja orqada qolish" issiqlik xaritasi: qaysi mashina reja-timeline (tolerance band)dan chiqqan, rangli | MEDIUM | `ai_planning_plans` + `production_sessions` | Plan-vs-fakt og'ishni mashina kesimida jonli ko'rsatadi |
| M4 | Uskuna 360 profilidan har mashina uchun "keyingi TX (texnik xizmat) muddatigacha N kun" ni ekran + panelда ko'rsatish (predictive-lite) | MEDIUM | `equipment_maintenance` + `asset_maintenance_records` | Reja bo'yicha profilaktikani oldindan ogohlantiradi (buzilishdan oldin) |
| M5 | Menejer bitta tugma bilan AI auto-stop qarorini tasdiqlash/rad etish (masofadan ruxsat) | MEDIUM | `mes_work_orders` + `AiMesMonitorService` (z-score) | AiMesMonitor mashinani PAUSED qilganda menejer HITL tasdiqlaydi |

---

## 4. Avtomatlashtirish va AI

| # | Taklif | Effort | Bog'liq modul/jadval | Qisqa izoh |
|---|--------|--------|----------------------|------------|
| AI1 | Login qilgan operator AI-planner tayinlaganidan farq qilsa — ekranda ogohlantirish + menejerga signal | MEDIUM | `ai_planning_decisions` + `employees.photo_url` | Reja bo'yicha kim turishi kerakligi bilan haqiqiy operatorni solishtiradi |
| AI2 | Mavjud `mes_telemetry` z-score anomaliyasini operator ekranida JONLI ko'rsatish (hozir faqat cron ichida) | LOW | `mes_telemetry` + `AiMesMonitorService` | Logika allaqachon bor — faqat ekranga chiqarish; "sensor hozir" vizyoniga tez yechim |
| AI3 | AI downtime-sabab tavsiyasi: sensor + tarixdan ehtimoliy sababni oldindan taklif qilish, operator faqat tasdiqlaydi | MEDIUM | `downtime_reason_codes` + `mes_telemetry` + `ai_planning_config` | Downtime qaydini tezlashtiradi va standartlashtiradi |
| AI4 | Norma-oshib-ketish bashorati: joriy iste'mol tezligidan order oxirida umumiy material oshishini oldindan ogohlantirish | MEDIUM | `material_kit_items` + `production_sessions` | Norma-overage'ni hodisadan OLDIN, real-vaqtda aytadi |
| AI5 | Brak free-text izohini AI bilan `qc_root_causes` toifasiga avtomatik klassifikatsiya | MEDIUM | `qc_root_causes` + `qc_defects` | Operator erkin yozadi, tizim toifani o'zi qo'yadi (hisobot sifati) |

---

## 5. Xavfsizlik va moslik

| # | Taklif | Effort | Bog'liq modul/jadval | Qisqa izoh |
|---|--------|--------|----------------------|------------|
| S1 | PPE checklist tasdig'iga imzo + vaqt muhri audit izi (kim, qachon, qaysi mashinada) | LOW-MEDIUM | `shift_handovers` shabloni / yangi `ppe_checklist_logs` jadval | Majburiy PPE gate'ni audit uchun isbotlanadigan qiladi |
| S2 | Sertifikat muddati tugashi ogohlantirishi: operator sertifikati (LMS) tugashiga N kun qolsa login'da + menejerga | LOW | `lms_certificates` + `employee_skills` | Muddati o'tgan sertifikat bilan ishlashni oldini oladi (skill-gate'ni to'ldiradi) |
| S3 | Xavfli sensor holatida (masalan qizib ketish) avtomatik majburiy to'xtatish + PPE qayta-tasdiq | MEDIUM | `mes_telemetry` + `downtime_events` | Xavfsizlik-kritik anomaliyada mashinani o'zi to'xtatadi |
| S4 | Ikki-imzo handover "ochiq" oralig'ini cheklash: keyingi smena N daqiqada tasdiqlamasa direktorga eskalatsiya | MEDIUM | `shift_handovers.status` + cron | Handover cheksiz "pending" qolmaydi; mas'uliyat uzatiladi |
| S5 | SOS turini toifalash (tibbiy/yong'in/xavfsizlik/sifat) + har tur uchun alohida marshrut | LOW-MEDIUM | `iot/tablet/sos-alert` (mavjud) + `workflow_rules` | Barcha SOS direktorga emas — tibbiy→med, texnik→MRO kabi to'g'ri manzilga |

---

## 6. Texnik / infratuzilma

| # | Taklif | Effort | Bog'liq modul/jadval | Qisqa izoh |
|---|--------|--------|----------------------|------------|
| T1 | To'liq offline kesh: nafaqat SOS, balki order + checklist ma'lumotini ham lokal saqlash (aloqa uzilsa ish davom etsin) | MEDIUM | `useIoTTabletAlerts` offline queue + localStorage | Hozir faqat write-action'lar navbatga tushadi; read-data ham keshlanishi kerak |
| T2 | Kiosk heartbeat monitoringi: har ekran 30s "tirikman" signali yuborsin, o'chgan ekran menejer panelida qizil | MEDIUM | yangi `kiosk_heartbeats` jadval (`mes_telemetry` shabloniga o'xshash) | O'chib qolgan/uzilgan ekranni darrov bilish |
| T3 | Sensor gateway (MQTT/HTTP bridge): `mes_telemetry`ни haqiqiy qurilmadan to'ldirish (hozir faqat qo'lda POST; `IotGateway` o'lik) | HIGH | `record-sensor-reading.handler` + `IotGateway` (hozir ro'yxatga olinmagan) | "Sensor hozir" vizyonining POYDEVORI — busiz barcha anomaliya/OEE bo'sh qoladi |
| T4 | Kiosk smena-vaqtiga qarab avtomatik logout + keyingi smena login ekrani | MEDIUM | `production_sessions` + smena jadvali (`org` / shift) | Bir ekran-ko'p smena uchun avtomatik re-login gate |
| T5 | Ekran o'zini-health telemetriyasi (PWA versiyasi, tarmoq sifati, oxirgi sinxron) markazda ko'rinsin | LOW-MEDIUM | yangi `kiosk_status` jadval | IT eskirgan/muammoli kiosklarni markazdan ko'radi |

---

## Top 5 — leverage bo'yicha (agar faqat 5 tasi tanlansa)

1. **T3 — Sensor gateway (HIGH).** Bu poydevor: `mes_telemetry` da 424 qator bor, lekin ular qo'lda kiritilgan; haqiqiy qurilma-oqim bo'lmasa "sensor hozir" vizyoni, AI2, AI3, D4, S3, M5 — hammasi bo'sh qoladi. Birinchi bo'lib shuni qurish qolgan yarmini yoqadi.
2. **AI2 — z-score anomaliyani ekranga chiqarish (LOW).** Logika `AiMesMonitorService`da tayyor; faqat surface qilish kerak. T3 dan keyin darhol ko'rinadigan natija, minimal kuch.
3. **W1 — Order↔material barcode validatsiyasi (MEDIUM).** Dual-scan vizyonining yadrosi; noto'g'ri material iste'molini fizik to'xtatadi — sifat va ombor aniqligiga eng katta ta'sir.
4. **M1 — Sex-darajali andon paneli (MEDIUM).** Menejer uchun eng yuqori ko'rinish qiymati; mavjud `oee_records` + `photo_url` ni qayta ishlatadi, yangi hardware talab qilmaydi.
5. **S2 — Sertifikat muddati ogohlantirishi (LOW).** Xavfsizlik/moslik; `lms_certificates` tayyor, arzon, qabul qilingan skill-gate'ni to'ldiradi va real xavfni (muddati o'tgan sertifikat) yopadi.

---

*Faqat brainstorm — hech narsa amalga oshirilmadi. Maxboy tanlaganidan keyin har biri alohida direktiva sifatida rejalashtiriladi.*
