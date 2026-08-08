# AI Kameralar — to'liq holat tahlili (2026-08-08)

> **Qisqa javob:** Kod tomoni **~20 800 qator** bilan g'oyat to'liq qurilgan (backend ~6 450,
> frontend ~14 380). Jonli bazada **hamma jadval 0 qator**. Sabab kod emas — **ikkita mustaqil
> infratuzilma darvozasi** yopiq: (1) jismoniy kamera + uni tizimga ulaydigan bridge dasturi
> sotib olinmagan/o'rnatilmagan, (2) yuz-tanish mikroservisi (`hr-face-ai`) hech qachon
> deploy qilinmagan. Bugungi tekshiruvda **2 ta haqiqiy kod-xatosi** ham topildi va tuzatildi
> (pastda).

---

## 1. Kim egasi? — Uch modul, bitta xususiyat

Xotiradagi ochiq savol ("Kamera-AI kimniki — IoT'nikimi yoki HR'nikimi?") noto'g'ri qo'yilgan
ekan — javob **ikkitasi ham, va yana uchinchisi**:

| Modul | Nima qiladi | Kod hajmi | Asosiy jadvallar |
|---|---|---|---|
| **`iot/`** | Kamera reestri, hodisa-qabul (`camera_events`), VLM (vision-LLM) tahlili, xavfsizlik/sifat buzilishi, dashboard, issiqlik-xaritasi, hodisalar (alerts) | ~3 350 qator, 19 fayl | `cameras`, `camera_events`, `camera_ai_configs`, `camera_alerts`, `camera_safety_violations`, `camera_quality_defects`, `camera_snapshots`, `camera_zones`, `camera_detections`, `camera_logs`, `ai_camera_cross_check`, `camera_dashboard_stats`, `camera_employee_reports` |
| **`hr/attendance/` + `hr/inspection/`** | Yuz-tanish orqali davomat, xona-holat inspeksiyasi (etalon-taqqoslash), hissiyot/charchoq tahlili | ~3 100 qator | `face_embeddings`, `hr_tz2_attendance_photos`, `hr_tz2_daily_attendance`, `hr_tz2_ai_room_analysis`, `hr_tz2_room_reference_photos`, `hr_tz2_security_alerts`, `ideal_rasm_targets` |
| **`security/`** | Tashrifchi, hodisa (incident), PPE tekshiruvi, zona-kirish, davomat-yozuvi | ~1 940 qator, 2 controller | `security_visitors`, `security_incidents`, `security_ppe_checks`, `security_access`, `security_attendance` |

Frontendda bu uchtasi **26 route**ga yoyilgan (`CameraRoutes.tsx`) va sidebar'da **ikki alohida
bo'lim**ga joylashgan: `tz13 Xavfsizlik` va `tz15 IoT va Kamera`. ⚠️ **"Kameralar" va "Kamera
Dashboard" ikkala bo'limda ham bor** — bitta sahifaga ikki yo'ldan kirish mumkin. Bu xato emas,
lekin egasi qaysi joyni "asosiy" deb belgilashi tavsiya etiladi (Q-41 — UI izchillik).

---

## 2. Uch mustaqil quvur (pipeline)

### A) IoT — kamera hodisasi → AI tahlil → alert
```
Kamera/NVR (jismoniy)
  → POST /iot/camera-events  (screenshot_url bilan)
  → camera-ai.service.ts analyzeByMissions()
      → AiRouterService.call('iot.camera_vision_analyze')  ⚠️ AI-KALIT KERAK
      → topilma → camera_events + camera_alerts (ikkalasi ham yoziladi, 0b034f84 bilan ulangan)
```
- Ingestion — umumiy REST endpoint, ONVIF/RTSP emas. Har qanday kamera-bridge dasturi
  screenshot URL bilan shu yerga POST qila oladi.
- `analyzeByMissions()` **on-demand API** — cron emas. Kimdir (bridge dastur yoki FE
  "Tahlil laboratoriyasi") uni chaqirishi kerak.
- ⚠️ **Yangi topilma:** `camera_alerts` qatori yaratiladi, lekin **hech kimga bildirishnoma
  ketmaydi** — faqat DB'ga yoziladi. Kamera+API-kalit yoqilgan kunda ham, birov `camera-alerts`
  sahifasini ochmasa, hech kim bilmaydi. Bu — sessiyaning boshqa 6+ joyida tuzatilgan xuddi shu
  naqsh (alert yaratildi, lekin CreateNotificationCommand chaqirilmadi), lekin bu yerda **jonli
  ta'siri yo'q** (quvur o'zi ishlamayapti) — tuzatish ma'nosiz bo'lardi, shuning uchun faqat
  qayd etilmoqda: kamera+kalit kelganda, `createCameraAlert()` dan keyin bildirishnoma
  yuborilishi kerak. Qabul qiluvchi rol `alert_type`ga bog'liq (xavfsizlik→Security,
  sifat→QC) — bu **egasi qarori**.

### B) HR — yuz-tanish + xona-inspeksiya (ikkita alohida, bir xil jadvaldan oziqlanuvchi cron)
```
camera_events (screenshot_url)
  ├─→ RoomSnapshotCron (hr/attendance/, har 2 soatda)
  │     → FaceRecognitionService.recognizeFromUrl()  ⚠️ hr-face-ai KERAK
  │     → matchFace() → hr_tz2_attendance_photos → hissiyot/charchoq tahlili
  │
  └─→ RoomAnalysisCron (hr/inspection/, har 2 soatda)
        → etalon-rasm bilan taqqoslash (ideal_rasm_targets, 0 qator)
        → anomaliyada Telegram (HR_MANAGER/HR_DIRECTOR/SECURITY)
```
- **Ikkalasi ham real, ro'yxatdan o'tgan, ishlaydigan cron** — o'lik kod emas.
  `RoomAnalysisCron` anomaliya topsa **Telegram yuboradi** (bu ikkinchisi to'g'ri ulangan).
- ⚠️ `RoomSnapshotCron` — anomaliya/charchoq hodisasini `EventEmitter2` orqali chiqaradi
  (`hr.room_anomaly`, `hr.fatigue_alert`); `territory.gateway.ts` buni tinglaydi va **faqat
  WebSocket orqali** (`this.server.emit('territory.event', ...)`) jonli ulangan brauzerlarga
  push qiladi. Persistent (DB/Telegram) yo'l **yo'q** — agar o'sha lahzada hech kim
  `camera-live-monitoring`/`territory` ekranini ochib turmagan bo'lsa, signal **abadiy
  yo'qoladi** (replay yo'q). Bu — `camera_alerts` bildirishnoma-yo'qligi bilan bir xil ildiz
  muammosi, boshqa quvurda.
- `ideal_rasm_targets` = 0 qator → hatto kamera ulansa ham, "qaysi xona qanday ko'rinishi
  kerak" etaloni yo'q, taqqoslash hech narsaga tegishli emas.

### C) Security — tashrifchi/hodisa/PPE (kameradan mustaqil, qo'lda kiritish)
```
Xavfsizlik xodimi (qo'lda) → POST /security/report, /security/visitors, /security/ppe-checks
  → security_incidents / security_visitors / security_ppe_checks
```
- Bu quvur **kamera CAPEX'iga bog'liq emas** — barcha yozuvlar qo'lda kiritiladi (masalan PPE
  tekshiruvchisi dalada telefon orqali kiritadi). Kod **halol**: `GET /security/fire-sensors`
  hali qurilmagan bo'lsa `501 NOT_IMPLEMENTED` qaytaradi (Qoida 17 to'g'ri bajarilgan — soxta
  javob yo'q). Bu modulda fantom jadval/ustun **topilmadi**.

---

## 3. Bugun topilgan va tuzatilgan 2 ta real kod-xatosi

Ikkalasi ham **CAPEX'ga bog'liq emas** — kamera ulanmasa ham, ADMIN ekrandan sozlash urinilganda
darhol ta'sir qiladi.

### 3.1 — "AI Nazorat Hub" (`camera-ai`) sozlamalari HECH QACHON saqlanmasdi
`PATCH /api/cameras/:id` (AI-only kalitlar bilan) → `patchCameraAi()` shunchaki
`return Ok({id, patched: body})` deb **kiritilgan qiymatni orqaga qaytarardi, bazaga
yozmasdan** (Q-43 — "ko'rinadi lekin saqlamaydi"). FE "saqlandi" degan toast ko'rsatardi, lekin
sahifa qayta yuklansa hammasi yo'qolardi.

**Nega bu ayniqsa jiddiy edi:** shu paytgacha ham qurilgan, ishlaydigan yozish yo'li bor edi
(`upsertCameraConfig` — boshqa ikki sozlama-ekrani, `CameraAIPrompts.tsx` va
`CameraTriggerRules.tsx`, uni to'g'ri ishlatadi) — lekin "AI Nazorat Hub" undan **foydalanmasdi**.

**Tuzatish (`ef42fa2b`):** `patchCameraAi()` endi haqiqiy `upsertCameraConfig()` ni chaqiradi,
uchala sozlama-ekrani endi **bitta** jadvalga, bitta formatga yoziladi.

### 3.2 — Konfiguratsiya yozilsa ham, o'qish yo'li uni HECH QACHON ko'rmasdi
`camera_ai_configs.detection_types` — jonli bazada **`jsonb`**, lekin Drizzle sxemasi uni
`text()` deb e'lon qilgan (sxema-DB drift). Node-pg drayveri simda `jsonb` ustunini avtomatik
JS massiv/obyektga aylantiradi — Drizzle nima deb o'ylashidan qat'i nazar. Eski kod
`typeof raw === 'string' ? JSON.parse(raw) : []` deb tekshirardi — bu tekshiruv haqiqiy
ma'lumot bo'lganda **har doim yolg'on** chiqardi (chunki `raw` allaqachon massiv, string emas),
ya'ni sozlangan kamera ham "sozlanmagan" deb ko'rinardi va standart missiya-ro'yxatiga qaytardi.

Jonli tranzaksiyada ikkala shaklni ham (`["safety","ppe"]` va
`{"ai_prompt":"...","rules":[...]}`) sinab tasdiqlandi — ikkalasi ham obyekt sifatida qaytadi,
string emas.

**Tuzatish (`ef42fa2b`):** `findCameraConfig()` endi ikkala shaklni ham to'g'ri o'qiydi va
`aiPrompt` maydonini ham qaytaradi (avval umuman qaytarilmasdi).

---

## 4. To'liq ishlaydigan, faqat ma'lumotsiz qismlar

Bu qismlarga **tegilmadi** — ular allaqachon to'g'ri ishlaydi, faqat kirish ma'lumoti yo'q:

- **Xodim ro'yxatdan o'tkazish** (`POST /api/hr/attendance/face/register` →
  `registerEmbeddingFromImages()` → `face_embeddings`) — FE→BE→DB to'liq ulangan.
- **Moslashtirish (matching)** — pgvector kengaytmasi o'rnatilmagan bo'lsa ham, in-process
  kosinus-o'xshashlik bilan **halol fallback** ishlaydi (2026-07-13 da allaqachon tuzatilgan,
  bugungi tahlilda qayta tasdiqlandi).
- **Xavfsizlik moduli** (tashrifchi/hodisa/PPE) — kameraga bog'liq emas, istalgan vaqt
  ishlatilishi mumkin (qo'lda kiritish).
- **`RoomAnalysisCron`** — Telegram bildirishnomasi bilan to'liq ulangan.

---

## 5. Ochiq bloklovchilar — egasi/CAPEX qarori kerak

| # | Nima | Turi |
|---|---|---|
| 1 | Jismoniy kamera + tarmoqqa ulash + bridge dasturi (kamera hodisani `POST /camera-events` ga yuboradigan) | 🔩 CAPEX |
| 2 | `hr-face-ai` mikroservisi — kodda **bitta joyda** eslatiladi (`FACE_AI_SERVICE_URL`, default `http://hr-face-ai:5001`), lekin **hech qanday `docker-compose*.yml` faylida aniqlanmagan**. Yuz-tanish (RoomSnapshotCron VA ro'yxatdan o'tkazish, ikkalasi ham) shunga bog'liq. | 🔩 Infratuzilma-CAPEX (dasturiy, jismoniy emas — mikroservis deploy qilinishi kerak) |
| 3 | AI provayder kaliti (`camera-ai.service.ts` VLM tahlili uchun) | 🔑 API-kalit |
| 4 | `ideal_rasm_targets` — xona etalon-rasmlari seed qilinmagan | ⌨️ Ma'lumot (kod tayyor) |
| 5 | Sidebar dublikat ("Kameralar" ikki bo'limda) | 🎨 UI-izchillik (Q-41, kichik) |
| 6 | `employee_face_encodings` jadvali — **hech qanday kod ishlatmaydi** (grep → 0), `face_embeddings` bilan eskirgan dublikat. O'chirish mumkin (Q-46), lekin bu tahlil doirasida o'chirilmadi — faqat qayd etilmoqda. | 🗑️ O'lik sxema |
| 7 | `camera_alerts` → bildirishnoma yo'q (§2A da tasvirlangan) | ⌨️ Kod-kamchilik (kamera kelganda dolzarb bo'ladi) |
| 8 | `hr.room_anomaly`/`hr.fatigue_alert` → faqat WebSocket, DB/Telegram yo'q, ekran yopiq bo'lsa signal yo'qoladi (§2B) | ⌨️ Kod-kamchilik (kamera+mikroservis kelganda dolzarb bo'ladi) |

---

## 6. Xulosa

Bu — loyihadagi **eng katta "tayyor, lekin kutayotgan" xususiyat**: ~20 800 qator, 26 sahifa,
3 modul, to'liq CRUD+dashboard+hisobot qatlami — va **0 qator jonli ma'lumot**, chunki ikkita
mustaqil infratuzilma bo'lagi (kamera qurilmasi + yuz-tanish mikroservisi) hali sotib
olinmagan/o'rnatilmagan. Bugungi tekshiruvda kod ichidan **haqiqiy ikkita xato** topildi va
tuzatildi — ikkalasi ham CAPEX'dan mustaqil, ya'ni ular hoziroq foydali (admin sozlash
ekranlari endi ishlaydi). Qolgan hamma narsa **kod jihatidan tayyor**, faqat egasi-qaror va
CAPEX kutmoqda.
