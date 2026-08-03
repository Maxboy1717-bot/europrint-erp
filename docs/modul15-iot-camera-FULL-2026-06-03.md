# MODUL 15 — IoT / KAMERA (Aqlli zavod qatlami) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Zavodning "ko'zlari va sezgilari" — AI kameralar (davomat uchun yuz tanish, liniyada
> sifat tekshiruvi), mashinalardagi IoT datchiklar (o'qishlar), sex operator planshetlari, va bularni
> ko'rsatadigan panellar. Bu modul boshqalarga KIRIB boradi (kamera → HR davomat va QC sifat; planshet → MES).

> ⭐⭐ **BIR JUMLALI XULOSA (eng muhim savol — aqlli zavod haqiqiymi yoki demo?):** Datchik ma'lumoti
> SOXTA (random) EMAS — qabul qilish mexanizmi haqiqiy, lekin **hali bironta fizik datchik ulanmagan**,
> shuning uchun bo'sh. AI kameralar haqiqiy (Claude). Demak bu — qurilma kutayotgan haqiqiy SKELET, soxta
> demo emas. LEKIN operator planshet (kundalik sex kirishi) "tayyor emas", va sifat kamerasi brakni
> aniqlaydi-yu, lekin yomon partiyani to'xtatmaydi.

> **DB holati:** datchik/kamera/o'qish jadvallari bor, lekin HAMMASI BO'SH (0 — qurilma ulanmagan).

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: ~30 ta IoT/kamera sahifasi topdim** (juda katta). 2 guruh:

**Kamera (AI kameralar — ~19 sahifa):** Kameralar boshqaruvi (/cameras), Kamera paneli (/camera-dashboard), Kamera ogohlantirishlari (/camera-alerts), AI kamera markazi (/camera-ai), AI tahlil (/ai-camera), Sifat kamerasi (/camera-quality, /quality-defects-camera), Xavfsizlik kamerasi (/camera-safety), Yuz ro'yxatga olish (/face-registration), Yuz monitoringi (/camera/monitoring), Xodim reytingi/issiqlik xaritasi/jonli monitoring/mashinalar/hisobotlar/sozlamalar.

**IoT (datchiklar — ~5 sahifa):** IoT datchiklar (/iot-sensors), IoT paneli (/iot/dashboard), **Operator planshet (/iot/tablet)**, IoT kengaytirilgan (⭐ **5 havola → 1 sahifa**: ogohlantirishlar, raqamli egizak, OEE-jonli, profilaktik ta'mir, datchik monitoringi), IoT yaxshilangan (/iot-enhanced).

---

# 2-QADAM — HAR SAHIFA (guruhlangan)

## 🟢 KAMERA — Boshqaruv + ogohlantirish + AI tahlil
- **Kameralar boshqaruvi** (/cameras): kamera ro'yxatga olish, AI matnini (prompt) sozlash, qoidalar → **REAL** (camera-ai.controller:108 `PUT cameras/:id/prompt`, :128 trigger-rules)
- **Kamera ogohlantirishlari** (/camera-alerts): tasdiqlash/hal qilish → **REAL** (camera-alerts.controller:61,71). "AI tahlil" (analyze-by-missions) → **REAL Claude Vision** (:208)
- **AI tahlil panellari** (summary/safety/quality/productivity/anomaly): **REAL o'qiydi** (camera-ai.controller:39-88)
**Holat:** 🟢. **Foydalanuvchi nima qila olmaydi:** Ishlaydi (kamera AI haqiqiy), lekin data bo'sh.

## 🟢 KAMERA — Yuz tanish (davomat)
- **Yuz ro'yxatga olish** (/face-registration): xodim yuzini ro'yxatga olish → **REAL** (yuz "izi" saqlanadi)
- **Yuz monitoringi** (/camera/monitoring): xodim darvozada yuzini skanerlasa → real
**⭐ CROSS-LINK: Yuz kamera → HR davomat — REAL** (attendance-face.controller territory log, 11-modulda tasdiqlangan). Bu — yagona haqiqiy kirish-kuzatuvi.
**Holat:** 🟢. **Foydalanuvchi nima qila olmaydi:** Ishlaydi (yuz orqali davomat haqiqiy).

## 🟡 KAMERA — Sifat (defekt aniqlash)
- **Sifat kamerasi** (/camera-quality, /quality-defects-camera): AI liniyada brakni aniqlaydi (quality_defects_camera, rasm + ishonch %) → **REAL aniqlaydi**
**⭐ CROSS-LINK: Sifat kamera → QC qaror — UZILGAN.** Kamera brakni ko'radi, lekin avtomatik QC rad/rework **qilmaydi** (4-modulda tasdiqlangan).
**Holat:** 🟡. **Foydalanuvchi nima qila olmaydi:** Kamera brakni ko'radi, lekin yomon partiyani avtomatik to'xtatmaydi (QC qaroriga ulanmagan).

## 🟡 KAMERA — Boshqa (reyting/issiqlik/hisobot/sozlama)
Xodim reytingi, issiqlik xaritasi, jonli monitoring, hisobotlar — asosan **REAL o'qiydi**, lekin data bo'sh. (Avvalgi xavfsizlik tahlirida camera-safety sahifasi tuzatilgan.) 🟡.

## 🟡 IoT — Datchiklar (sensor)
- **IoT datchiklar** (/iot-sensors): datchik ro'yxatga olish → ⚠️ **SOXTA** (`id: Date.now()` — saqlamaydi, iot-sensors-main, avvalgi tahlirdan)
- Datchik paneli/jonli/o'qishlar/tendentsiyalar/tarix → **REAL o'qiydi** (iot-sensors-main.controller:55-108)
- ⭐ **Datchik o'qishi HAQIQIY (simulyatsiya emas)** — qabul mexanizmi real (HTTP/MQTT), random/soxta qiymat YO'Q. LEKIN **0 o'qish** (qurilma ulanmagan)
- "Profilaktik ta'mir", "ogohlantirish hal qilish" → **"tayyor emas"** (:123, :134; alert hal qilish jadval yangilamaydi :158)
**Holat:** 🟡 (qabul real, lekin qurilma ulanmagan → bo'sh; ro'yxatga olish soxta).
**Foydalanuvchi nima qila olmaydi:** Hali datchik ulanmagani uchun hech qanday o'qish ko'rinmaydi; datchik qo'shish tugmasi saqlamaydi.

## 🔴 IoT — Operator planshet (/iot/tablet)
**Nima uchun:** Sex operatori planshetdan ishni boshlaydi, to'xtashni qayd qiladi.
**⭐ CROSS-LINK: Planshet → MES — "TAYYOR EMAS".** Ishni boshlash, sessiya, smena topshirish, material skaner — hammasi 501 (7-modulda tasdiqlangan, iot-tablet.controller:176).
**Holat:** 🔴. **Foydalanuvchi nima qila olmaydi:** Operator planshetdan ishni umuman qayd qila olmaydi.

## 🟡 IoT — Kengaytirilgan (5 havola→1) + Yaxshilangan
Ogohlantirishlar, raqamli egizak, OEE-jonli, profilaktik ta'mir, datchik monitoringi — bitta sahifada. Ko'pi o'qish/501. 🟡.

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali (guruhlangan)
| Guruh/sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Kamera boshqaruv + ogohlantirish + AI | 🟢 | data bo'sh | ~75 |
| Kamera yuz tanish (davomat) | 🟢 | — (HR'ga ulangan) | ~80 |
| Kamera sifat (defekt) | 🟡 | QC qaroriga ulanmagan | ~50 |
| Kamera boshqa (reyting/issiqlik) | 🟡 | data bo'sh | ~50 |
| IoT datchiklar | 🟡 | qurilma yo'q; register soxta | ~45 |
| **Operator planshet** | 🔴 | **tayyor emas (501)** | ~10 |
| IoT kengaytirilgan (5→1) | 🟡 | ko'rish/501 | ~40 |

**Jami: ~3 🟢 · ~10 🟡 · ~1 🔴 → taxminan ~55% haqiqatan ishlaydi.**

## ⭐ VIZYON — asosiy talablar + CROSS-LINKLAR (eng muhim)
| Talab | Holat | Sodda izoh |
|---|---|---|
| **AI yuz-kamera (davomat)** | 🟢 | Real — yuz orqali davomat HR'ga yoziladi |
| **AI sifat-kamera (defekt)** | 🟡 | Aniqlaydi, lekin QC rad/rework qilmaydi |
| **Datchik/qurilma o'qishlari** | 🟡 | Qabul real (simulyatsiya EMAS), lekin 0 qurilma ulangan |
| **Operator planshet** | 🔴 | Tayyor emas (501) |
| **Kamera → HR davomat** | 🟢 REAL | Yagona haqiqiy kirish yo'li |
| **Kamera → QC qaror** | 🔴 UZILGAN | Brakni ko'radi, to'xtatmaydi |
| **Planshet → MES** | 🔴 UZILGAN | 501 |

## ⭐ ZANJIR — aqlli zavod qatlami HAQIQIYmi yoki DEMO? (halol javob)
- **Datchik ma'lumoti SOXTA EMAS** — kodda random/soxta qiymat yo'q, qabul mexanizmi haqiqiy. Bu — qurilma kutayotgan **haqiqiy skelet**, demo emas. LEKIN hali 0 fizik datchik ulangan → hammasi bo'sh
- **Kamera AI haqiqiy** (Claude Vision) — yuz tanish, defekt aniqlash real
- **3 cross-link holati:** Yuz→HR ✅ ishlaydi · Sifat→QC ❌ uzilgan · Planshet→MES ❌ 501

## DB MUAMMOLARI (sodda)
- ✅ Datchik/kamera/o'qish jadvallari bor (iot_sensors, sensor_readings, quality_defects_camera, cameras)
- ❌ Hammasi BO'SH (0 — qurilma ulanmagan)
- ⚠️ Datchik ro'yxatga olish soxta (id:Date.now); ogohlantirish hal qilish jadval yangilamaydi

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🟡 **Fizik qurilma ulanmagan** — qabul mexanizmi tayyor, lekin hech bir datchik/kamera real ma'lumot yubormaydi (bo'sh skelet)
2. 🔴 **Operator planshet 501** — sex operatori planshetdan ishlay olmaydi (7-modul bilan bog'liq)
3. 🔴 **Sifat kamera → QC qaror uzilgan** — brak ko'rinadi, to'xtatilmaydi (4-modul bilan bog'liq)
4. ⚠️ **Datchik ro'yxatga olish soxta** — datchik qo'shish saqlanmaydi

---

## XULOSA (egasiga)
IoT/Kamera — kamera tomonida ancha qurilgan: AI kamera (yuz tanish, defekt aniqlash) HAQIQIY ishlaydi (Claude), va yuz orqali davomat HR'ga ulangan. Datchik tomonida — qabul mexanizmi haqiqiy (simulyatsiya emas), lekin hali bironta fizik datchik ulanmagan, shuning uchun bo'sh.

Asosiy kamchiliklar ulanish darajasida: (1) operator planshet "tayyor emas" (sex ishlay olmaydi), (2) sifat kamerasi brakni ko'radi-yu, lekin QC qaroriga ulanmagan (yomon partiya to'xtamaydi), (3) datchik qo'shish soxta.

⭐ **Halol javob:** "aqlli zavod" qatlami soxta DEMO emas — u haqiqiy, lekin BO'SH skelet (qurilma kutmoqda). Kamera AI haqiqiy, datchik mexanizmi haqiqiy. Faqat fizik qurilmalar ulanishi va 2 ta uzilgan halqa (planshet→MES, kamera→QC) tuzatilishi kerak.

Metafora: zavodga ko'zlar (kameralar) va asab uchlari (datchik joylari) o'rnatilgan — ko'zlar haqiqatan ko'radi (AI kamera ishlaydi), lekin asab uchlariga hali hech narsa ulanmagan (datchik yo'q), va ko'z ko'rgan narsa (brak) miyага (QC qaror) signal yubormaydi.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
