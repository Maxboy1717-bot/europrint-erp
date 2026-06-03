# MOBIL-1 — Tablet / Mobil / Offline tayyorlik auditi (kod asosida, READ-ONLY)

**Sana:** 2026-06-02
**Skop:** `artifacts/erp-dashboard` (IoT tablet, POS-monitor, camera-ai, PWA, scanner, touch)
**Usul:** Faqat kod tahlili (brauzer YO'Q). Hech qanday fayl o'zgartirilmagan.
**Rol:** 🔵 Tahlilchi (Qoida 23) — faqat shu hisobot yozildi.

---

## Umumiy baho

| Mezon | Holat | Izoh |
|------|-------|------|
| 1. Responsive | ⚠️ qisman | IoT tablet va asosiy ERP responsive; POS-monitor faqat 2 ta media-query |
| 2. Offline | ⚠️ qisman | PWA SW + background-sync + IndexedDB BOR, lekin 3 ta alohida/parallel tizim; Dexie qatlami ulanmagan (dead) |
| 3. Scanner | ✅ bor | Kamera (BarcodeDetector), USB wedge, WebHID, Web Serial — to'liq |
| 4. Big-button UX | ✅ bor | IoT tablet namunaviy (h-14..h-24, text-2xl/4xl, inputMode numeric) |
| 5. PWA / Capacitor | ⚠️ qisman | PWA installable (VitePWA build PASS); Capacitor/native wrapper YO'Q |
| 6. Touch monitor | ✅ bor | onClick/touch ishlaydi, katta target; PIN inputMode numeric |

---

## 1. Responsive — ⚠️ QISMAN

**Viewport meta** ✅ bor — `index.html:5`: `width=device-width, initial-scale=1.0, maximum-scale=1`
(`maximum-scale=1` zoom'ni o'chiradi — tablet kiosk uchun maqbul, lekin accessibility'ni cheklaydi).

**Tailwind responsive breakpoint ishlatilishi** (butun `src/**/*.tsx`):
- `sm:` → 943 marta
- `md:` → 669 marta
- `lg:` → 695 marta

Asosiy ERP dashboard responsive jihatdan yetarlicha qamrab olingan.

**IoT tablet** — responsive grid bor, masalan `IoTProductionDashboard.tsx:67` `grid-cols-1 sm:grid-cols-2`. Tablet landscape uchun moslangan (`min-h-screen`, fixed katta tugmalar).

**POS-monitor** — ⚠️ eng zaif joy. Butun `src/pos-monitor/**` bo'ylab faqat **2 ta** `@media` qoidasi:
- `pos-monitor/styles/pos-theme.css:362` — `max-width:1024px` → sidebar 200px
- `pos-monitor/styles/pos-theme.css:365` — `max-width:768px` → sidebar drawer (translateX)
POS-monitor sahifalari ko'pincha inline `style={{}}` va fixed `px` o'lchamlar ishlatadi (Tailwind breakpoint emas) → kichik telefon ekranida content moslashuvi cheklangan. Tablet (≥768px landscape) uchun yetarli, telefon-portret uchun emas.

---

## 2. Offline rejim — ⚠️ QISMAN (lekin infratuzilma kuchli)

### PWA Service Worker + Workbox — ✅ bor va build'da generatsiya bo'ladi
`vite.config.ts` `VitePWA({ registerType:"autoUpdate", injectRegister:"auto" })`:
- `dist/public/sw.js`, `dist/public/workbox-4a5d746f.js`, `dist/public/registerSW.js`, `dist/public/manifest.webmanifest` — **build PASS, mavjud**.
- `registerSW.js`: `navigator.serviceWorker.register('/erp-dashboard/sw.js', { scope:'/erp-dashboard/' })` — avtomatik ulanadi (main.tsx'da qo'lda chaqiruv shart emas).

### Precache + runtime caching — vite.config.ts:
- **Precache:** `**/*.{css,html,ico,png,svg,woff,woff2}` (`globPatterns`).
- **NetworkFirst** (oflayn fallback cache): `assets/*.js|css`, `/api/pos/products`, `/api/pos/sales/daily`, `/api/mes/tasks`, `/api/employees`, `/api/sales-orders`.
- **NetworkOnly** (hech qachon cache yo'q): `/api/auth/`, `/api/ai-agents`.
- **Background Sync queue** (oflayn yozuvni navbatga qo'yib, online'da avto yuborish):
  - `pos-sales-sync-queue` (POST/PUT `/api/pos/sales`, 24 soat)
  - `mes-tasks-sync-queue` (POST/PUT `/api/mes/tasks`, 8 soat)
  - `hr-report-sync-queue` (POST `/api/hr/daily-report`, 24 soat)

→ Internet uzilganda GET'lar cache'dan o'qiladi, write'lar navbatga tushadi va qaytganda avto-sinxronlanadi. **Bu eng kuchli oflayn jihat.**

### ⚠️ Muammo: 3 ta ALOHIDA/PARALLEL oflayn tizim mavjud
1. **Workbox backgroundSync** (yuqorida) — SW darajasida, deklarativ.
2. **`pos-monitor/hooks/useOfflineSync.ts`** — XOM IndexedDB (`pos_monitor_offline` DB, v2). Navbat + materials/stock cache + 409-conflict resolver + 3× retry. Faqat `PosOfflineBanner.tsx` orqali ishlatiladi (`PosLayout`, `PosMovementKirim`). Ishlaydi.
3. **`pages/iot/useIoTTabletAlerts.ts`** — IoT tablet **localStorage**-asosli alohida navbat (`enqueueOfflineAction`/`flushOfflineQueue`, online/offline listener). Mustaqil, kichik.

### ❌ DEAD: Dexie qatlami ulanmagan
- `lib/pos-db.ts` (Dexie `EuroPrintPOS` DB: products + pendingSales + syncMeta) va `lib/pos-sync.ts` (`syncPendingSales`) — **to'liq yozilgan, lekin HECH BIR sahifa ulamaydi**. Iste'molchi faqat `lib/__tests__/pos-sync.test.ts` (test) + `README.md`.
- `CashRegister.tsx` pos-db/pos-sync'ni **import qilmaydi** — ya'ni manifest reklama qilgan "POS Kassa oflayn rejimida" funksiyasi kassada faol emas.
- Xulosa: manifest `"EuroPrint ERP — POS Kassa ... oflayn rejimida"` deydi, lekin haqiqiy oflayn POS-Kassa savdo navbати (Dexie) ulanmagan. Oflayn faqat (a) Workbox bg-sync va (b) POS-monitor ombor harakatlari (useOfflineSync) uchun real.

### Orphan SW
- `public/chat-sw.js` (push-notification SW) — `src/**` ichida HECH QAYERDA `register()` qilinmaydi (grep 0 natija). Build'ga ko'chiriladi (`dist/public/chat-sw.js`) lekin ulanmagan = dead.

---

## 3. Scanner (barcode / QR) — ✅ BOR (eng mukammal qism)

Kutubxonalar: `@zxing/library@0.21.3` (package.json dep) + native `BarcodeDetector` API.

### Kamera (QR/barcode) — ✅
`pos-monitor/components/PosBarcodeScanner.tsx`:
- `navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" } })` (orqa kamera) — `:98`
- `new BarcodeDetector({ formats:["qr_code","code_128","code_39","ean_13","ean_8","upc_a","upc_e","itf"] })` — `:104`
- `requestAnimationFrame` loop bilan real-time detect (`:107-119`), topilganda audio "ping" (`playPing`, `:44`).
- Fallback: brauzer qo'llamasa "Bu brauzer kamera skanerni qo'llab-quvvatlamaydi" (`:93`).
- Manual input + scan-history tugmalari ham bor.

### USB / Hardware scanner — ✅ (3 kanal)
`pos-monitor/hooks/useHardwareScanner.ts`:
- **Keyboard wedge** (USB HID klaviatura emulyatsiyasi): tez tugma-burst (≥4 belgi <50ms, Enter bilan tugaydi) → `:96-126`. Input/textarea fokusda bo'lsa o'tkazib yuboradi.
- **WebHID** (`navigator.hid.requestDevice`, Chrome/Edge) — to'g'ridan USB drayver, CR/LF-terminated ASCII dekodlash → `:128-173`.
- **Web Serial** (`navigator.serial.requestPort`) — RS-232/USB-serial; ⚠️ faqat pairing tasdiqlangan, oqim o'qish stub'i to'liq emas (`:186` izoh: "for now we just confirm pairing").

Ikkinchi wedge implementatsiya `pos-monitor/hooks/useBarcode.ts:74-104` (≥6 belgi, 150ms debounce) — backendga `barcodeApi.scan` yuboradi.

### Telegram Mini-App — ✅
`pages/mini-app/TelegramMiniAppScanScreen.tsx` — barcode input + kamera rejimi + scan natija kartochkasi (zaxira/stok ko'rsatadi).

### Boshqa
`getUserMedia` ishlatadigan joylar: PosBarcodeScanner, FaceRegistration, AIInterviewPublicPage, TelegramMiniApp, VoiceRecorder (chat). `camera-ai-modern` moduli kamera-skaner EMAS — bu server-side IP-kamera AI workbench (getUserMedia yo'q).

---

## 4. Big-button / qo'lqopli qo'l uchun sodda UX — ✅ BOR (namunaviy)

IoT tablet UI eng production-ready (memory'ga mos). `pages/iot/`:
- **Login PIN:** `IoTLoginPanel.tsx:45` `inputMode="numeric"`, `:49,:60` `text-2xl h-14` (katta markazlashgan PIN maydonlari), `:65` `h-14 text-xl` login tugma.
- **Asosiy ish tugmalari** (`IoTProductionDashboardDialogs.tsx`):
  - `:86` "Setup tugatish" — `h-24 text-2xl font-black col-span-2` (eng katta CTA)
  - `:99` brak — `h-20 text-xl`, `:147` to'xtalish — `h-20 text-xl border-4`
  - `:44` stop-session — `h-14 px-8 text-lg`
  - `active:scale-95/[0.99]` bosish feedback'i.
- **Raqam kiritish:** `:108,:175` brak/downtime — `text-4xl h-20 text-center inputMode="numeric"` (qo'lqopli qo'l uchun ulkan).
- **Reason tanlash:** SelectTrigger `h-14 text-lg`.
- **Handover/QC:** `h-16/h-14 text-xl/text-lg`.
- **Energy-save overlay:** `IoTProductionDashboard.tsx:58` `<EnergySavingOverlay>` + `:33` `h-14 px-6 text-lg` "Energiya tejash" tugma (ekran kuyishi/uyqu).

Tugma o'lchamlari WCAG/Apple HIG 44px target'dan ancha katta (h-14 = 56px, h-20 = 80px, h-24 = 96px). ✅ Qo'lqopli zavod sharoiti uchun mos.

---

## 5. PWA / Capacitor — ⚠️ QISMAN

### PWA — ✅ installable
- `manifest.webmanifest` (+ vite.config inline manifest): `display:"standalone"`, `start_url`/`scope:"/erp-dashboard/"`, theme/bg color, `lang:"uz"`, 192+512 maskable ikonkalar, `shortcuts:["POS Kassa"]`.
- `icon-192.png` + `icon-512.png` `public/` da mavjud.
- VitePWA build to'liq SW + manifest generatsiya qiladi (dist tasdiqlandi).
- ⚠️ `devOptions.enabled:false` — SW faqat production build'da, dev-server'da YO'Q (dev'da oflayn sinab bo'lmaydi).
- ⚠️ `injectRegister:"auto"` — `index.html`'da PWA install prompt/`beforeinstallprompt` handler ko'rinmaydi; o'rnatish brauzer native UI'ga tayanadi (custom "Install" tugma yo'q).

### Capacitor / native wrapper — ❌ YO'Q
- `capacitor.config.*` fayl YO'Q. `package.json`/`src`'da `capacitor`, `cordova`, React Native iz YO'Q (grep 0).
- Telegram Mini-App (`telegram-web-app.js` `index.html:13` + `pages/mini-app/`) — bu yagona "native-ga yaqin" qobiq (Telegram WebApp). APK/IPA paketlash mexanizmi yo'q.
- Demak: faqat brauzer-PWA + Telegram Mini-App. Mahalliy do'kondan (Play/App Store) o'rnatiladigan native ilova YO'Q.

---

## 6. Touch monitor (kassir PIN, ombor) — ✅ BOR

- Barcha interaktiv elementlar standart `onClick` (touch'da ham ishlaydi) — Radix UI + shadcn komponentlari touch-friendly.
- Kassir/ishchi PIN: `inputMode="numeric"` → mobil/tablet'da raqamli klaviatura chiqadi (`IoTLoginPanel.tsx:45`).
- POS-monitor sidebar mobil'da drawer'ga aylanadi (`pos-theme.css:365`, `.pos-sidebar.open`).
- Katta touch-target tugmalar (4-bo'lim) → barmoq bilan aniq bosish.
- ⚠️ Maxsus xom touch-event (`onTouchStart`/gesture/swipe) deyarli yo'q — pinch-zoom `maximum-scale=1` bilan o'chirilgan. Kiosk uchun OK; lekin swipe-asosli UX yo'q.
- ⚠️ On-screen raqamli klaviatura (custom numpad) komponenti yo'q — tizim klaviaturasiga tayanadi (kiosk rejimida tizim klaviaturasi bo'lmasa muammo bo'lishi mumkin).

---

## Tavsiyalar (faqat tavsiya — Qoida 23: bajarish egasi ruxsatisiz EMAS)

**P0 (kelishuv/integratsiya bo'shliqlari):**
1. **Dexie POS-Kassa oflayn qatlamini ulash yoki o'chirish.** `lib/pos-db.ts` + `lib/pos-sync.ts` to'liq yozilgan, ammo `CashRegister`/POS sahifalari ulamaydi (faqat test). Manifest "oflayn POS Kassa" deydi — yoki uni real ulang, yoki dead kodni olib tashlab manifest matnini tuzating.
2. **Oflayn tizimlarni birlashtirish.** 3 ta parallel navbat (Workbox bg-sync, xom-IndexedDB useOfflineSync, IoT localStorage) bir-birini bilmaydi → konflikt/takror sinxron xavfi. Bitta kanonik oflayn-quera qatlamiga keltirish tavsiya etiladi (Dexie tabiiy nomzod).
3. **`public/chat-sw.js` orphan** — hech qayerda register qilinmaydi. Push kerak bo'lsa ulang (lekin VitePWA `sw.js` bilan scope to'qnashuviga ehtiyot bo'ling), aks holda o'chiring.

**P1 (responsive/UX):**
4. **POS-monitor responsive'ni kuchaytirish** — inline `px`/`style` o'rniga Tailwind `sm:/md:` breakpoint; telefon-portret uchun grid moslash (hozir faqat 2 media-query).
5. **Web Serial scanner o'qish oqimini tugatish** (`useHardwareScanner.ts:186` stub) — hozir faqat pairing, barcode dekodlash yo'q.

**P2 (PWA polish):**
6. Custom `beforeinstallprompt` "Ilovani o'rnatish" tugmasi qo'shish (hozir faqat brauzer native).
7. Kiosk uchun on-screen numpad komponenti (tizim klaviaturasi bo'lmagan tablet/monitor stsenariysi uchun).
8. Ag't native ilova kerak bo'lsa — Capacitor qobig'i (manifest+SW allaqachon tayyor, qo'shish oson).

---

## Fayl ma'lumotnomasi
- PWA config: `artifacts/erp-dashboard/vite.config.ts` (VitePWA, workbox runtimeCaching, backgroundSync)
- Manifest: `artifacts/erp-dashboard/public/manifest.webmanifest`
- Viewport: `artifacts/erp-dashboard/index.html:5`
- Kamera scanner: `artifacts/erp-dashboard/src/pos-monitor/components/PosBarcodeScanner.tsx`
- HW scanner (wedge/HID/serial): `artifacts/erp-dashboard/src/pos-monitor/hooks/useHardwareScanner.ts`
- Wedge #2: `artifacts/erp-dashboard/src/pos-monitor/hooks/useBarcode.ts`
- Offline (xom IndexedDB): `artifacts/erp-dashboard/src/pos-monitor/hooks/useOfflineSync.ts`
- Offline (Dexie — DEAD): `artifacts/erp-dashboard/src/lib/pos-db.ts`, `src/lib/pos-sync.ts`
- IoT offline (localStorage): `artifacts/erp-dashboard/src/pages/iot/useIoTTabletAlerts.ts`
- Big-button UX: `artifacts/erp-dashboard/src/pages/iot/IoTLoginPanel.tsx`, `IoTProductionDashboardDialogs.tsx`
- POS responsive: `artifacts/erp-dashboard/src/pos-monitor/styles/pos-theme.css:362-370`
- Orphan push SW: `artifacts/erp-dashboard/public/chat-sw.js`
</content>
</invoke>
