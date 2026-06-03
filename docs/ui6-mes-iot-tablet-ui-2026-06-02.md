# UI-6 — MES / IoT Planshet UI Tahlili (READ-ONLY)

> Sana: 2026-06-02 · Rol: 🔵 Tahlilchi (faqat-o'qish, brauzer ishlatilmadi — kod tahlili)
> Frontend: `artifacts/erp-dashboard/src` · Vizyon: `docs/ombor-pos-master-plan.md`
> Faqat shu hisobot yoziladi; hech qanday kod/DB o'zgartirilmaydi.

---

## 1. MES — Inventarizatsiya va verdikt

### 1.1. Topilgan MES route'lar (manba: `routes/ProductionRoutes.tsx:122-135`)

| Route | Sahifa fayli | Holat |
|---|---|---|
| `/mes/dashboard-home` | `MESHomeDashboard.tsx` | ✅ Wired |
| `/mes/work-centers` | `MESWorkCenters.tsx` | ✅ Wired (CRUD) |
| `/mes/products` | `MESProducts.tsx` | ✅ Wired |
| `/mes/downtimes` | `MESDowntimes.tsx` | ✅ Wired |
| `/mes/workers` | `MESWorkerAssignments.tsx` | ✅ Wired |
| `/mes/oee-monitor` | `MESExtended.tsx` | ✅ (umumiy MESExtended) |
| `/mes/reason-log` | `MESExtended.tsx` | ⚠️ Bitta fayl 6 ta route'ga |
| `/mes/zone-management` | `MESExtended.tsx` | ⚠️ Bitta fayl 6 ta route'ga |
| `/mes/maintenance-request` | `MESExtended.tsx` | ⚠️ |
| `/mes/gamification` | `MESExtended.tsx` | ⚠️ |
| `/mes/machine-norms` | `MESExtended.tsx` | ⚠️ |
| `/mes/smena-handover` | `MESExtended.tsx` | ⚠️ |

Qo'shimcha ishlab chiqarish/marshrut route'lari (`PRODUCTION_ROUTES`):
- `/erp/pp/routing` → `RoutingConfiguration.tsx` (marshrut/marshrut operatsiyalari)
- `/production/orders/:id` → `ProductionOrder360.tsx` (buyurtma 360, jihoz/sifat/vaqt tablari)
- `/erp/pp/bom` → `BOMManagement.tsx` (`scrapPercentage` maydoni bor — `BOMManagement.tsx:47,168`)

### 1.2. Wired yoki stub?

- **MESWorkCenters** (`MESWorkCenters.tsx:29-65`) — **REAL**: `useQuery(/api/iot/production-sessions, refetchInterval 30s)` + 2 ta mutation: `ppApi.createWorkCenter` (`/api/pp/work-centers`) va `mesApi.createSession`. Ish markazi yaratish + sessiya yaratish forma bilan ishlaydi.
- **MES API klienti** (`lib/api/mes.ts`) **boy va real**: sessiya start/complete/pause/resume, `recordDowntime`, `recordMaterialConsumption`, `closeShiftEvaluation`, smena hisobotlari (`/api/production/shift-reports`), maintenance-request, SOS. Hammasi haqiqiy endpointlarga ketadi.
- **RoutingConfiguration** (`RoutingConfiguration.tsx:66-89`) — **REAL**: `/api/erp/routings`, `/api/erp/routing-operations`, `/api/erp/products`, `/api/erp/work-centers` o'qiydi; routing/operatsiya CREATE/UPDATE/DELETE dialoglar mavjud.

### 1.3. Marshrut (routing) vizualizatsiyasi?

- ⚠️ **Qisman**: `RoutingConfigurationCard.tsx:13` `ArrowRight` ikonkasi bilan **operatsiya ketma-ketligi (operation-sequence strip)** ko'rsatadi (`getRoutingOperations` → ketma-ket strip). Bu chiziqli ro'yxat/strip — **to'liq grafik/Gantt/flow-diagram marshrut vizuali EMAS**.

### 1.4. Skan-bilan-progress (scan-to-progress)?

- ⚠️ MES sahifalarining o'zida emas — **planshetda** (IoTChecklistModal, pastda). MES Work Centers'da skan yo'q; sessiya progress'i `actualQuantity` orqali.

### 1.5. Brak / qoldiq / kamomad kiritish formalari?

- ✅ **Brak**: BOM'da `scrapPercentage`; planshetda to'liq brak forma (pastda §3). MESExtended'da `reason-log`/`downtimes` bor.
- ❌ **Qoldiq/kamomad** (inventory variance) MES UI'da alohida forma sifatida topilmadi — bu Ombor (WMS) modulida (BarcodeScanner "Qoldiq", inventarizatsiya).

### 1.6. Flekso / Ofset chiziqlari?

- ❌ **Maxsus Flekso/Ofset chiziq UI yo'q**. MESWorkCenters umumiy "ish markazi" (`type: machine`) sifatida ishlaydi — Flekso/Ofset alohida sahifa/komponent emas. `flexo`/`offset` faqat `AIDesignGeneratorTypes.ts:48-50` da label sifatida uchraydi.

### MES verdikt
MES asosan **wired va real** (DB'ga boradigan CRUD, refetch, mutation). Lekin: (a) 6 ta route bitta `MESExtended.tsx`'ga yo'naltirilgan (granularlik past); (b) marshrut faqat chiziqli strip, grafik vizual yo'q; (c) **Flekso/Ofset domeni umumlashtirilgan**, sex-maxsus UI yo'q; (d) qoldiq/kamomad MES'da emas.

---

## 2. MES — Vizyon → UI jadvali

| Vizyon talabi | UI holati | Dalil |
|---|---|---|
| MES ishlab chiqarish boshqaruvi | ✅ | `MESWorkCenters.tsx`, `lib/api/mes.ts` (real endpointlar) |
| Flekso / Ofset chiziqlari (sex-maxsus) | ❌ | Umumiy "work center"; Flekso/Ofset alohida UI yo'q |
| Marshrut (routing) konfiguratsiyasi | ✅ | `RoutingConfiguration.tsx` (CRUD, 4 query) |
| Marshrut grafik vizualizatsiyasi | ⚠️ | `RoutingConfigurationCard.tsx` operatsiya-strip (ArrowRight), grafik emas |
| IoT skan → progress | ✅ (planshetda) | `IoTChecklistModal.tsx` ScanLine/Barcode |
| Brak kiritish | ✅ | Planshet BRAK dialog (`IoTProductionDashboardDialogs.tsx:97-142`); BOM scrap% |
| To'xtalish (downtime) | ✅ | Planshet TO'XTALISH dialog + `mesApi.recordDowntime` |
| Qoldiq / kamomad (variance) | ❌ | MES'da yo'q (WMS modulida) |
| OEE monitor | ✅ | `/mes/oee-monitor`, `/pp/oee-monitor` (OEELiveMonitorPage) |
| Smena topshirish (handover) | ✅ | Planshet + `/mes/smena-handover` + `mesApi.createShiftReport` |

---

## 3. IoT / Planshet — Inventarizatsiya va verdikt

### 3.1. Topilgan IoT/planshet route'lar (manba: `routes/ProductionRoutes.tsx:186-196`)

| Route | Sahifa | Holat |
|---|---|---|
| `/iot/tablet` | `IoTTablet.tsx` | ✅ To'liq planshet ilovasi |
| `/iot/dashboard` | `IoTDashboard.tsx` | ✅ Sensor/OEE/Maintenance tablari |
| `/iot/sensor-monitoring` ...×4 + `/iot/alerts` | `IoTExtended.tsx` | ⚠️ Bitta fayl 5 route'ga |
| `/iot/material-kits` | `WarehouseMaterialKits.tsx` | ✅ |
| `/iot/daily-view` | `WarehouseDailyView.tsx` | ✅ |
| (App.tsx:80) `IoTTablet` standalone | `IoTTablet.tsx` | ✅ Layout'siz to'liq ekran |
| `/camera-ai` | `camera-ai-modern/.../CameraAIModernHub.tsx` | ✅ AI kamera hub |
| `/ai-camera` | StubRoutes → `CameraAIAnalyticsPage` | ⚠️ stub-ga yaqin |

`IotSensorsPage.tsx` ham mavjud (`/api/iot/sensors`, 30s refetch) — sensorlar kartochka grid.

### 3.2. Planshet-optimizatsiya (katta tugma, touch, responsive)?

✅ **Juda yaxshi optimizatsiya qilingan** (`IoTTablet.tsx` + `iot/` papka):
- Login: `IoTLoginPanel.tsx:49,60` — `h-14 text-2xl` input, `inputMode="numeric"`, KIRISH tugmasi `h-14 text-xl`.
- Asosiy harakat tugmalari: BRAK/TO'XTALISH `h-20 text-xl`, "SOZLASH TUGADI - BOSHLASH" `h-24 text-2xl` (`IoTProductionDashboardDialogs.tsx:86,99,147`).
- Pastki panel: STOP `h-14`, `active:scale-95` touch feedback.
- Kiritish maydonlari `h-20 text-4xl` (brak miqdori, downtime daqiqa).
- **Energiya tejash rejimi** to'liq-ekran overlay (`IoTProductionDashboardSections.tsx:11-31`).
- 2 til (UZ/RU) bir tugma bilan almashtiriladi; `font-inter`, `min-h-screen`.

### 3.3. 3 ta sensor ko'rsatish?

- ⚠️ Aniq "3 ta sensor" maxsus UI yo'q, lekin **sensor turlari to'liq**: `IotSensorsPage.tsx:40-50` — temperature/humidity/pressure/vibration/gas/noise/camera/motion/energy ikonkalar, batareya/signal/firmware. `IoTDashboard.tsx` live sensor + readings chart (`/api/iot-sensors/live`, 15s). Planshetda esa sensorlar avtomatik downtime aniqlash uchun ishlatiladi (`lastSignalAt` → auto-stop, `IoTProductionDashboard.tsx:42-46`).

### 3.4. Mexanik (mechanics) sahifasi?

- ⚠️ Alohida "mexanik" sahifa yo'q, lekin **predictive maintenance** bor: `IotMaintenanceMonitorTab.tsx` (PmSensor riskLevel/recommendation, `/iot/predictive-maintenance`). `EquipmentPage.tsx` + MRO `/mro/spare-parts`, `/mro/preventive` ta'mirlash bilan bog'liq. To'g'ridan "mexanik ish stoli" UI YO'Q.

### 3.5. Equipment-360 ko'rinishi?

- ⚠️ `EquipmentPage.tsx` — **oddiy jihozlar jadvali** (CRUD + status), 360 emas. **Lekin** `ProductionOrder360Equipment.tsx` mavjud (buyurtma 360 ichida jihoz tab). `Customer360` kabi to'liq "Equipment 360" sahifa **YO'Q** — bu bo'shliq.

### 3.6. AI kamera UI?

- ✅ `camera-ai-modern/` real moduli: `CameraAIModernHub.tsx` (`/camera-ai`) — `fetchCamerasFull`, `fetchCameraDashboardStats`, `fetchPendingAlerts`, `patchCameraAi`, `CameraMissionEditor`, `CameraAnalysisWorkbench`, `AI_TASK_CATALOG`. To'liq AI-kamera vazifa katalogi. (`/ai-camera` esa stub `CameraAIAnalyticsPage`).

### IoT/Planshet verdikt
Planshet ilovasi (`IoTTablet.tsx`) — **eng yetuk, production-ready UI**: login → smena/jadval → sessiya → chek-list (skan) → ishlab chiqarish → brak/downtime/QC/handover/SOS, hammasi **real mutation** bilan. AI kamera moduli ham real. Bo'shliqlar: (a) to'liq "Equipment 360" sahifa yo'q (faqat jadval + buyurtma-360 ichidagi tab); (b) "mexanik" alohida UI yo'q (predictive maintenance bilan qoplangan).

---

## 4. IoT — Vizyon → UI jadvali

| Vizyon talabi | UI holati | Dalil |
|---|---|---|
| Planshet (tablet) ilovasi | ✅ | `IoTTablet.tsx` + `iot/` (login/schedule/dashboard/checklist/report) |
| Katta tugma / touch / responsive | ✅ | `h-14`–`h-24`, `text-2xl/4xl`, `active:scale`, `inputMode` |
| 3 sensor displey | ⚠️ | Sensor turlari to'liq, lekin "3 sensor" maxsus bloki yo'q; auto-stop signalda |
| Mexanik sahifasi | ⚠️ | Predictive maintenance tab bor; alohida mexanik UI yo'q |
| Equipment-360 ko'rinish | ⚠️ | `EquipmentPage` jadval + `ProductionOrder360Equipment` tab; to'liq 360 yo'q |
| AI kamera UI | ✅ | `camera-ai-modern/CameraAIModernHub` (real) |
| Skan → progress | ✅ | `IoTChecklistModal` (ScanLine), `scanMaterial` mutation |
| Brak / downtime / QC kirituvi | ✅ | `IoTProductionDashboardDialogs.tsx` (real mutationlar) |
| Smena topshirish (imzo) | ✅ | Handover dialog + raqamli imzo (`useIoTTablet.ts:230-255`) |
| Offline rejim (vizyon §1.5) | ⚠️ | `useIoTTabletAlerts` offline queue bor; to'liqligi alohida tekshirilsin |

---

## 5. Planshet tayyorligi (tablet-readiness)

| Mezon | Holat | Izoh |
|---|---|---|
| Layout'siz to'liq ekran | ✅ | `App.tsx:80` IoTTablet standalone Suspense |
| Katta touch-target tugmalar | ✅ | 56–96px balandlik |
| Raqamli klaviatura | ✅ | `inputMode="numeric"` login/forma |
| 2 til (UZ/RU) tez almashtirish | ✅ | Har panelda til tugmasi |
| Energiya tejash (ekran o'chirish) | ✅ | To'liq-ekran overlay |
| Auto-stop (signal yo'qolsa) | ✅ | `lastSignalAt` 30s threshold |
| QC eslatma banneri | ✅ | `QcReminderBanner` |
| Offline / IndexedDB sync | ⚠️ | Alerts queue bor; to'liq offline-sync alohida audit kerak |
| Auth — public emasligi | ✅ | Quyida §7 |

---

## 6. Auth: planshet PUBLIC emasligi (memory tekshiruvi)

Memory: "iot-tablet had @Public reads fixed to 401". **FE bu o'zgarishga MOS keladi — UI public kirishni FARAZ QILMAYDI:**

- Login majburiy: `IoTLoginPanel.tsx` — tabel raqami + parol (kamida 3/4 belgi, `useIoTTabletAuth.ts:38-46`).
- `POST /api/iot/tablet/login` → javobdan **`tabletToken`** olinadi va `safeStorage`'ga saqlanadi (`useIoTTabletAuth.ts:49-63`).
- Keyingi yozuvlar `x-tablet-token` header bilan: handover `fetch(... "x-tablet-token": token)` (`useIoTTablet.ts:236-239`), `data.tabletFetch` barcha session/defect/downtime/QC mutationlarda token uzatadi.
- `IoTDashboard.tsx:34,45,53` `getQueryFn({ on401: "throw" })` — 401'ni to'g'ri ushlaydi (silent-public emas).
- **Xulosa:** UI tokenli auth model'ga to'liq moslashgan; "public reads" farazi YO'Q. ✅

> Eslatma: planshet ERP cookie-sessiyasi o'rniga maxsus `x-tablet-token` ishlatadi (raw `fetch`, kodda `eslint-disable no-restricted-globals` izoh bilan tushuntirilgan) — bu dizayn bo'yicha to'g'ri.

---

## 7. Tavsiyalar (faqat tavsiya — bajarish egasi ruxsatisiz YO'Q, Qoida 23)

1. **Flekso/Ofset domen UI** — vizyon sex-maxsus chiziqlarni kutadi; MESWorkCenters'da `type` bo'yicha Flekso/Ofset ko'rinishi/filtri qo'shilsa, vizyonga yaqinlashadi. (⚠️ → ✅)
2. **Marshrut grafik vizuali** — operatsiya-strip'ni flow/Gantt diagrammaga kengaytirish (hozir faqat ArrowRight strip).
3. **Equipment 360** — `Customer360` kabi to'liq jihoz-360 sahifa (tarix, ta'mirlash, sensorlar, OEE) qo'shish; hozir tarqoq (`EquipmentPage` + `ProductionOrder360Equipment`).
4. **Mexanik ish stoli** — predictive maintenance tab'ni alohida mexanik UI sifatida ajratish (so'rovlar navbati, qabul/yopish).
5. **MESExtended granularligi** — 6 ta route bitta faylga; har subdomenni alohida sahifaga bo'lish (sifat/kuzatuv).
6. **Offline-sync auditi** — vizyon §1.5 (IndexedDB local + avto-sync) planshet uchun alohida funksional tekshirilsin.
7. **`/ai-camera` stub** — `camera-ai-modern` hub mavjud bo'lgani uchun stub route'ni real hub'ga redirect qilish.

---

## Asosiy fayllar (absolyut yo'l, dalil sifatida)

- `artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx` (MES/IoT route'lar 122-196)
- `artifacts/erp-dashboard/src/pages/IoTTablet.tsx` + `pages/iot/` (useIoTTablet.ts, useIoTTabletAuth.ts, IoTLoginPanel.tsx, IoTSchedulePanel.tsx, IoTProductionDashboard*.tsx, IoTChecklistModal.tsx)
- `artifacts/erp-dashboard/src/pages/MESWorkCenters.tsx`, `RoutingConfiguration*.tsx`, `EquipmentPage.tsx`, `IotSensorsPage.tsx`, `IoTDashboard.tsx`, `IotMaintenanceMonitorTab.tsx`
- `artifacts/erp-dashboard/src/lib/api/mes.ts`
- `artifacts/erp-dashboard/src/camera-ai-modern/pages/CameraAIModernHub.tsx`
