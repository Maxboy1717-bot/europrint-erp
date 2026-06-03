# UI KOD-SKAN — MODUL 6: MES / IoT planshet / Ishlab chiqarish

> **ROL: 🔵 Tahlilchi (QAT'IY READ-ONLY).** Faqat KOD qatlami tahlili (brauzer YO'Q).
> Hech bir fayl/kod/DB o'zgartirilmadi — faqat shu hisobot yozildi.
> **Sana:** 2026-06-02 · **FE root:** `artifacts/erp-dashboard/src`
> **Vizyon manbasi:** A+.11 (IoT planshet — ishchi skaner, katta tugma, sodda) + A+.12 (mexaniklar — uskuna 360 + sensor real-time issiqlik/bosim/vibratsiya). Vizyon dalillari: `docs/iot-tablet-asl-holat-2026-06-02.md`, `docs/agent11-iot-sensor-2026-06-02.md`.
> ⚠️ **Eslatma:** bu hisobot faqat FE **dizayn/i18n/dublikat/komponent** qatlamini baholaydi. Backend STUB holati (501 endpointlar) alohida hisobotlarda — bu yerda faqat "FE kodi nima qiladi" nuqtai nazaridan tegiladi.

---

## 0. QISQA HUKM (1 paragraf)

MES/IoT FE **dizayn-token jihatidan deyarli toza** (0 ta arbitrary hex, faqat 1 ta dinamik `style={{color}}` — token-hosil). Lekin **ikkita katta tizimli muammo** bor: (1) **i18n bo'linishi** — IoT **planshet** (A+.11) butunlay `t(uz,ru)` xom-bilingual ishlatadi (178 chaqiruv, 18 ta lokal helper), uz-cyr (3-til) yo'q, **kamida 2 ta buzuq aralash-skript matn** bor; IoT **dashboard/sensor** sahifalari esa to'g'ri `useTranslation('iot')` kalit tizimi (159 kalit×3 til) ishlatadi — ya'ni bitta modul ichida ikki xil yondashuv. (2) **dublikat sensor sahifalari** — bir xil `/api/iot-sensors/*` ma'lumotini ko'rsatadigan **3 ta alohida sahifa** (`IoTDashboard`, `IoTExtended`, orphan `IotSensorsPage`). Bundan tashqari MES sahifalarida **ko'p sonli hardcoded UZ matn** (`useTranslation` import qilingan, lekin KPI/toast/subtitle xom UZ), **sidebar nav title'lari xom UZ** (tarjima qilinmaydi), va A+.12 "mexanik uskuna 360" uchun **dedicated sahifa YO'Q** — faqat order-360 ichidagi kichik `ProductionOrder360Equipment` komponenti bor, hamda IoTDashboard "maintenance" tab'i mexanikka aloqasiz HR/kamera bo'limlarini (davomat/xona/salomatlik) aralashtirib yuborgan.

**Modul UI tayyorligi (dizayn/struktura nuqtai):** A+.11 planshet UI ~**85%** (sodda, katta tugma — kuchli), lekin i18n 3-til va buzuq matn kamchiliklari. A+.12 sensor-monitoring ~**70%** (boy, tarjima qilingan), lekin dublikat + scope aralashishi + xom Tailwind ranglar. "Mexanik uskuna 360" alohida sahifasi ~**15%** (faqat order-scoped fragment).

---

## 1. SAHIFA INVENTARI

### 1.1 IoT planshet (A+.11) — `pages/IoTTablet.tsx` + `pages/iot/` (1 root + 11 sub-fayl)
| Fayl | Rol |
|---|---|
| `IoTTablet.tsx` | orkestrator (login→schedule→production→checklist→completion) |
| `iot/IoTLoginPanel.tsx` | operator kirish ekrani (tabel + PIN) |
| `iot/IoTSchedulePanel.tsx` | smena/jihoz/buyurtma tanlash |
| `iot/IoTProductionDashboard.tsx` | asosiy ish ekrani (start/stop/brak/QC/SOS/handover) |
| `iot/IoTProductionDashboardSections.tsx` / `...Dialogs.tsx` / `...Types.ts` | bo'lim/dialog/tip |
| `iot/IoTChecklistModal.tsx` | material skaner cheklisti |
| `iot/IoTCompletionReport.tsx` (+`Sections`/`Steps`/`Types`) | yakun hisoboti |
| `iot/useIoTTablet*.ts` (7 hook fayl) | mantiq (mutation/data/auth/alerts/core/formatters/types) |

→ Route: `/iot/tablet` (`ProductionRoutes.tsx:192`). **Jami ~12 .tsx + 7 hook**. **Inline `t(uz,ru)` helper: 18 ta ta'rif, 178 ta bilingual chaqiruv.**

### 1.2 IoT sensor/dashboard (A+.12 yaqin) — 3 ta ATRAFLASHUVCHI sahifa
| Sahifa | Route(lar) | Tab'lar |
|---|---|---|
| `IoTDashboard.tsx` (+`IotSensorsReadingsTab`/`IotOeeAlertsTab`/`IotMaintenanceMonitorTab`/`IotDashboardHelpers`) | `/iot/dashboard` | sensors, oee, alerts, readings, **maintenance, attendance, rooms, health** (8 tab) |
| `IoTExtended.tsx` (+`IoTExtendedSections`/`...SectionsExtra`/`...Dialogs`/`...Types`) | `/iot/sensor-monitoring`, `/iot/predictive-maintenance`, `/iot/oee-live`, `/iot/digital-twin`, `/iot/alerts` | sensors, alerts, oee, predictive, twin (5 tab) |
| `IotSensorsPage.tsx` | `/iot-sensors` (StubRoutes) | yakka sensor grid |

→ **Uchalasi `/api/iot-sensors/*` dan o'qiydi → funksional dublikat** (4-band).

### 1.3 MES (ishlab chiqarish) — 6 root sahifa + bo'laklar
| Sahifa | Route(lar) |
|---|---|
| `MESHomeDashboard.tsx` (+`Sections`/`Widgets`/`Types`) | `/mes/dashboard-home` |
| `MESWorkCenters.tsx` (+`Sections`/`Dialogs`/`Types`) | `/mes/work-centers` |
| `MESProducts.tsx` | `/mes/products` |
| `MESDowntimes.tsx` | `/mes/downtimes` |
| `MESWorkerAssignments.tsx` | `/mes/workers` |
| `MESExtended.tsx` (+`TabsA..D`/`Dialogs`/`Types`) | `/mes/oee-monitor`, `/reason-log`, `/zone-management`, `/maintenance-request`, `/gamification`, `/machine-norms`, `/smena-handover` (1 sahifa, 7 route) |

### 1.4 Ishlab chiqarish (Production) — qo'shimcha
| Sahifa | Route |
|---|---|
| `ERPProduction.tsx` | `/erp-production` |
| `ProductionReport.tsx` | `/production/orders` |
| `ProductionOrder360.tsx` (+`Bom`/`Cost`/`Equipment`/`Quality`/`Shifts`/`TimeAnalysis`/`Timeline`/`Sections`/`Types`) | `/production/orders/:id` |
| `ProductionFactsPage.tsx` | `/production-facts` (StubRoutes) |

→ **Modul jami (non-test, kanonik daraxt): ~50+ .tsx**. (`.claude/worktrees/` ostidagi nusxalar e'tiborga olinmadi — ular agent worktree snapshotlari.)

---

## 2. i18n RAW-KALIT / RASVO MATN

### 2.1 ❌ IoT planshet — butunlay xom-bilingual `t(uz,ru)`, uz-cyr YO'Q
A+.11 planshet **i18n kalit tizimini umuman ishlatmaydi**. Har faylda lokal `const t = (uz, ru) => lang === "uz" ? uz : ru;` (18 ta ta'rif):
- `iot/IoTLoginPanel.tsx:25`, `iot/IoTSchedulePanel.tsx:40`, `iot/IoTProductionDashboard.tsx:40`, `iot/IoTProductionDashboardDialogs.tsx:29,81`, `iot/IoTProductionDashboardSections.tsx:18,49,106,172,207,237`, `iot/IoTChecklistModal.tsx:38`, `iot/IoTCompletionReport*.tsx` (×6).
- **178 ta `t("uz","ru")` bilingual chaqiruv** — har bir matn kodga "muzlatilgan".
- `pages/iot` da `useTranslation` / `@/lib/i18n` import **0 ta** (grep tasdiq).
- `iot.json` katalogida planshet kalitlari **YO'Q** (grep `sozlash|brak|toxtalish|operatorKirishi` → 0).

→ **Oqibat:** (a) **uz-cyr (3-til) planshetda umuman ishlamaydi** — faqat uz/ru qattiq-kodlangan; loyiha 3-tilli (`uz` + `uz-cyr` + `ru`, `iot.json` 159×3). (b) Tarjima kodga tarqalgan, markazlashmagan, regress xavfi yuqori.

### 2.2 ❌ Buzuq aralash-skript matn (planshet) — KRITIK sifat nuqsoni
- `iot/IoTProductionDashboard.tsx:69` — `labelUz: "Uskunа nosozligi"` — **"Uskunа" so'zida lotin emas, KIRILL "а" harfi** (aralash-skript; brauzerda noto'g'ri ko'rinadi/qidiruv buziladi).
- `iot/IoTProductionDashboard.tsx:109` — `ruLabel: "Проблемы with качеством"` — **ruscha matnga inglizcha "with" so'zi sizib kirgan** (avtotarjima qoldig'i; "Проблемы **с** качеством" bo'lishi kerak).

### 2.3 ✅ IoT dashboard/sensor — to'g'ri kalit tizimi (lekin kalit nomlari camelCase)
- `IoTDashboard.tsx:27` `useTranslation('iot')`; `IotSensorsReadingsTab`/`IotOeeAlertsTab`/`IotMaintenanceMonitorTab` hammasi `t('camelCaseKey')`.
- `IotSensorsPage.tsx:53` `useTranslation('common')` → `t("iotSensorlar")`, `t("sensorlarTopilmadi")`, `t("jami")`, `t("faol")`, `t("nofaol")`.
- ⚠️ Kalitlar **camelCase** (`t('oeeTitle')`, `t('predictiveMaintenance')`, `t('riskCritical')` ...) — bu **raw-kalit DEGANI EMAS**: `iot.json` da uz/ru/uz-cyr (159×3) bor → ekranda tarjima ko'rinadi, camelCase EMAS. (`grep iotSensorlar|oeeTitle|noActiveSensors|predictiveMaintenance` → `locales/{uz,ru,uz-cyr}/{common,iot}.json` da topildi.)

### 2.4 ⚠️ Hardcoded UZ matn — `useTranslation` import qilingan, lekin ishlatilmagan
Quyidagi sahifalarda `useTranslation` chaqirilgan, lekin matnlar baribir xom UZ (yoki xom EN):
- `IoTDashboard.tsx:230` `{"Machines"}`, `:240` `{"Oee"}` — **xom inglizcha** UI matn (tab/karta sarlavhasi), `t()` chetlab o'tilgan.
- `IoTExtended.tsx:77` `toast({ title: "Sensor qo'shildi" })`, `:85` `"Ogohlantirish hal qilindi"`, `:100` `Kritik`, `:97` `t("iotSensorMonitoring")` ishlatadi-yu lekin qolgan matnlar xom UZ.
- `MESExtended.tsx` — `kpiItems` (113–116) butunlay xom UZ: `"O'rtacha OEE"`, `"World Class (≥85%)"`, `"Ta'mirlashda"`, `"Jami Stanoqlar"`, `desc: "Stanoq"/"Hozir nosoz"/"Monitoring ostida"`; toast `:99` `"Texnik xizmat so'rovi yuborildi"`, `:180` `"Smena o'tkazish boshlandi"`; subtitle `:126` `"OEE monitoring, smena boshqaruvi, texnik xizmat"`; `:131` `"Aktiv smena"`.
- `MESHomeDashboard.tsx:68` `"Ishlab chiqarish real-vaqt monitoringi"`, `:76` `"{n} sessiya to'xtagan"` — xom UZ.

→ Bu sahifalar **faqat qisman tarjimalangan**: ramka (header/refresh) `t()`, lekin asosiy ish-matni xom UZ → RU/uz-cyr rejimida ham UZ ko'rinadi.

### 2.5 ❌ Sidebar nav title'lari xom UZ (tarjima qilinmaydi)
`components/sidebar/constants.ts` — MES/IoT nav yozuvlari **hammasi qattiq-kodlangan UZ string**:
- `:276` `title: "MES Dashboard"`, `:278` `"IoT Planshet"`, `:279` `"Kunlik Reja"`, `:281` `"Ish Markazlari"`, `:286` `"OEE Monitoring"`, `:289` `"Ishlab Chiqarish Monitor"`, `:528` `"IoT Dashboard"`, `:529` `"Sensor Monitoring"`, `:542` `"Predictive Maintenance"`, `:544` `"Digital Twin"` ...
→ Title'lar `t()` orqali EMAS → **sidebar RU/uz-cyr da ham UZ ko'rinadi** (modul bo'ylab umumiy muammo, faqat MES/IoT emas).

---

## 3. DIZAYN TOKEN BUZILISHI

### 3.1 ✅ Xom hex / inline rang — deyarli toza (Qoida 21 bo'yicha BLOK-darajada 0)
- **Tailwind arbitrary hex** (`text-[#...]`, `bg-[#...]`) butun MES/IoT modulida: **0 ta** (grep tasdiq).
- **Inline `style={{color/background: '#...'}}` xom hex:** **1 ta**, va u **dinamik token-hosil** — `IotDashboardHelpers.tsx:72` `<span style={{ color }}>` (`color` prop'i `getStatusColor` → `var(--ep-*)` dan keladi, OeeGauge SVG `stroke={color}` bilan bir xil). → **maqbul** (Qoida 21 inline xom hex'ni bloklaydi, lekin bu o'zgaruvchi, literal hex emas).

### 3.2 ⚠️ Xom Tailwind palette ranglar (WARN-tier, token EMAS) — 192 ta / 24 fayl
`var(--ep-*)` token o'rniga to'g'ridan Tailwind palette ishlatilgan (Qoida 21 buni token bilan almashtirishni so'raydi; BLOK emas, lekin dizayn-tizimdan chetlash):
- **Jami: 192 ta hodisa, 24 faylda.** Eng ko'p: `IotMaintenanceMonitorTab.tsx` (bg-red-50/green-50/yellow-50/orange-50 ×ko'p, border-red-300/green-200), `MESHomeDashboard*` (bg-emerald-500/900/50, bg-red-900/500/50, bg-amber-*), `MESDowntimes.tsx` (bg-red-900/500/50, border-red-800), `MESExtendedTabsA.tsx` (bg-yellow-500/red-500).
- Aралаш namuna: `IoTProductionDashboardDialogs.tsx:147` — `border-4 border-amber-500 text-[var(--ep-yellow)]` (bir elementda token + xom palette aralash).
- IoTDashboard KPI: `:210` `bg-green-500 animate-pulse`, `:226` `bg-amber-100 text-amber-800`.

→ Funksional zarar yo'q (ranglar to'g'ri ko'rinadi), lekin **markazlashgan tema/dark-mode token bilan boshqarilmaydi** → kelajakda rang o'zgartirish 24 faylni qo'lda tahrirni talab qiladi.

### 3.3 ⚠️ Inline `boxShadow` rgba (token emas, lekin rang/bg emas)
- `MESExtended.tsx:142` `style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}` — xom rgba soyalik. Qoida 21 `color/background` ni bloklaydi, `boxShadow` emas → texnik jihatdan o'tadi, lekin token-soyalik (`var(--ep-shadow-*)` bo'lsa) afzal.

---

## 4. DUBLIKAT / ESKI SAHIFALAR

### 4.1 ❌ 3 ta atraflashuvchi IoT-sensor sahifasi (bir xil data manbai)
`IoTDashboard` (`/iot/dashboard`), `IoTExtended` (`/iot/sensor-monitoring` + 4 boshqa route), `IotSensorsPage` (`/iot-sensors`) — **uchalasi `/api/iot-sensors/*` (live/oee/alerts/dashboard) dan o'qiydi**:
- `IoTDashboard` — eng to'liq (8 tab, i18n kalit, attendance/rooms/health ham).
- `IoTExtended` — 5 tab (sensors/alerts/oee/predictive/twin), **xom UZ toast/matn** (2.4), `AddSensorDialog` (CREATE bor).
- `IotSensorsPage` — yakka grid, **sidebar'da YO'Q** (orphan, faqat StubRoutes `/iot-sensors` direkt URL).
→ **Tavsiya (faqat tavsiya — Qoida 23, bajarish emas):** yagona sensor sahifasiga birlashtirish; `IotSensorsPage` orphan'ni nomzod sifatida o'chirish/yo'naltirish.

### 4.2 ⚠️ `iot/dashboard` sidebar'da IKKI marta
`components/sidebar/constants.ts`:
- `:289` MES moduli ichida `{ title: "Ishlab Chiqarish Monitor", url: "iot/dashboard" }`
- `:528` IoT moduli ichida `{ title: "IoT Dashboard", url: "iot/dashboard" }`
→ **Bir xil sahifa, ikki nav yozuvi, ikki xil title** (foydalanuvchi chalkashadi: ikki menyu bandi bitta ekranga olib boradi).

### 4.3 ⚠️ `IoTExtended` 1 sahifa = 5 sidebar/route — to'g'ri pattern, lekin nomlanish chalg'ituvchi
`/iot/sensor-monitoring`, `/predictive-maintenance`, `/oee-live`, `/digital-twin`, `/alerts` → hammasi `IoTExtended` (tab almashtirish, `URL_TAB_MAP`). Bu **maqbul** tab-route pattern (MESExtended ham shunday: 7 route→1 sahifa). Lekin sidebar'da 5 alohida band borligi, ularning **`IoTDashboard` tab'lari bilan ustma-ust** tushishi (ikkala sahifada ham sensors/oee/alerts/predictive bor) → 4.1 dublikatini kuchaytiradi.

### 4.4 ✅ @deprecated / o'lik route belgisi topilmadi
MES/IoT sahifalarida `@deprecated` JSDoc yoki kommentlangan dead-route topilmadi (kanonik daraxtda). Route↔sahifa mapping izchil (`ProductionRoutes.tsx` + `StubRoutes.tsx`).

---

## 5. KOMPONENT QAYTA-ISHLATISH

### 5.1 ✅ EP primitivlari yaxshi ishlatiladi
Modul bo'ylab umumiy EP komponentlari: **EPStatusPill ×58, EPLoader ×17, EPPageHeader ×9, EPErrorState ×8, ModulePage ×6, ModuleSectionHeader ×3, PillTabs ×2.** → status/loader/header/error holatlari markazlashgan komponentdan keladi (yaxshi).

### 5.2 ⚠️ Sahifa-darajali shablon (ListPage/DashboardPage/FormPage) YO'Q
Qoida 21 "yangi sahifa = mavjud shablon (ListPage/DetailPage/FormPage/DashboardPage/BoardPage) + PROPS" deydi. Lekin MES/IoT da **kanonik sahifa-shablon ishlatilmaydi** — har sahifa o'z layout'ini primitivlardan (Card/Tabs/grid) qo'lda quradi:
- `MESHomeDashboard`, `MESExtended`, `IoTDashboard`, `IoTExtended` — har biri o'z header+KPI+tab tuzilishini takrorlaydi (struktura o'xshash, lekin umumiy `DashboardPage` shabloni yo'q).
- Natija: KPI-kartochka, tab-bar, "bo'sh holat" naqshlari har faylda qayta yoziladi (DRY emas) — yuqoridagi xom-rang/xom-matn tarqalishining sababi ham shu.

### 5.3 ✅ Planshet (A+.11) — izchil ichki shablon
Planshet o'z ichida izchil: `DashboardHeader`/`OrderCard`/`MetricsCards`/`ProgressSection`/`ActionButtons`/`BottomActionsBar` (Sections+Dialogs fayllarida) qayta ishlatiladi. Katta tugma uslubi (`h-24/h-20/h-16`, `text-2xl/4xl font-black`, `active:scale`) bir xil — yaxshi.

---

## 6. VIZYONGA MOSLIK (A+.11 / A+.12)

### 6.1 A+.11 — IoT planshet (ishchi skaner, KATTA TUGMA, SODDA)
| Vizyon talab | Kod holati | Baho |
|---|---|---|
| Sodda, ishchiga mo'ljallangan ekran | Login→Schedule→Production→Completion oqimi; chrome'siz full-screen (`App.tsx`/route) | ✅ |
| **KATTA tugma** | `h-24 text-2xl font-black` (BOSHLASH, `IoTProductionDashboardDialogs.tsx:86`), `h-20` BRAK/TO'XTALISH (`:99,:147`), `h-16` submit, `h-20` STOP-bar; `text-4xl` raqam input (defect/downtime/QC) | ✅ kuchli |
| Material skaner UI | `IoTChecklistModal` + `useHardwareScanner`/kamera skaner (hookda) | ✅ FE bor (BE 501 — bu hisobot doirasidan tashqari) |
| Sex-ga o'tkazish (handover) | `submitHandover` dialog (`IoTProductionDashboard.tsx:102`) — imzo majburiy | ✅ FE bor |
| SOS panic | `BottomActionsBar` SOS tugma (`animate-bounce`, `var(--ep-red)`) + dialog | ✅ |
| 3-til (uz/uz-cyr/ru) | ❌ faqat uz/ru xom-bilingual; **uz-cyr yo'q** (2.1) | ❌ |
| Toza matn | ❌ 2 ta buzuq aralash-skript (2.2) | ❌ |

→ **A+.11 UI dizayn jihatdan vizyonga juda mos** (sodda + katta tugma). Asosiy FE kamchiliklar: **i18n 3-til yo'q + 2 buzuq matn**.

### 6.2 A+.12 — Mexaniklar (uskuna 360 + sensor real-time issiqlik/bosim/vibratsiya)
| Vizyon talab | Kod holati | Baho |
|---|---|---|
| Real-time **issiqlik/bosim/vibratsiya** | `IotSensorsReadingsTab` + `IotSensorsPage` — sensor grid, `TYPE_ICONS`/`SENSOR_ICONS` da temperature/pressure/vibration ikonkalari bor (`IotSensorsPage.tsx:40-50`, `IotDashboardHelpers.tsx:12-20`); `lastReading` + threshold rang (`getStatusColor`) + live-grafik (recharts) | ✅ UI tayyor (data BE'dan — doiradan tashqari) |
| **Uskuna 360** (mexanik uchun bitta uskunaning to'liq ko'rinishi) | ❌ **Dedicated "MechanicWorkstation/uskuna-360" sahifa YO'Q.** Eng yaqin — `ProductionOrder360Equipment.tsx` (smena/ishlab-chiqarish/OEE kartochkasi), lekin u **order-scoped fragment** (buyurtma 360 ichida), mexanik-markazli emas | ❌ yo'q |
| Predictive maintenance | `IoTExtended` "predictive" tab + `IotMaintenanceMonitorTab` (risk-skor, z-score, tavsiya) — i18n kalit, risk-rang | ✅ UI bor |
| Mexanik = alohida rol/sahifa | ❌ Alohida mexanik sahifasi yo'q; sensor/predictive umumiy IoT dashboard ichida | ⚠️ qisman |
| **Scope tozaligi** | ❌ `IoTDashboard` "maintenance" guruhi mexanikka **aloqasiz** tab'larni bog'lagan: `attendance` (kamera davomat), `rooms` (xona inspeksiya), `health` (xodim salomatligi) — bular HR/Kamera/Facilities, mexanik-uskuna emas (`IotMaintenanceMonitorTab.tsx:174,258,324`) | ❌ aralash |

→ **A+.12 sensor real-time qismi UI darajada yaxshi** (3 sensor turi, threshold, grafik, predictive). Lekin **"uskuna 360" mexanik sahifasi yo'q** va **mexanik ekrani HR/kamera bilan aralashgan** (mavzu chegarasi buzilgan). Vizyon "mexanik bitta uskunaga qarab issiqlik/bosim/vibratsiyani ko'radi" deydi — hozir mexanik 8-tabli umumiy dashboardga tushadi, uning yarmi unga aloqasiz.

---

## 7. TOPILMALAR JADVALI (jamlama)

| # | Topilma | Fayl(:satr) | Baho |
|---|---|---|---|
| 1 | Planshet i18n butunlay xom `t(uz,ru)`, uz-cyr yo'q (178 chaqiruv/18 helper) | `pages/iot/*` (masalan `IoTProductionDashboard.tsx:40`) | ❌ |
| 2 | Buzuq aralash-skript: "Uskун**а**" (kirill а) | `iot/IoTProductionDashboard.tsx:69` | ❌ |
| 3 | Buzuq RU: "Проблемы **with** качеством" | `iot/IoTProductionDashboard.tsx:109` | ❌ |
| 4 | Xom EN UI matn `"Machines"` / `"Oee"` (t() chetlab o'tilgan) | `IoTDashboard.tsx:230,240` | ⚠️ |
| 5 | MES KPI/toast/subtitle xom UZ (useTranslation bor, ishlatilmagan) | `MESExtended.tsx:113-116,99,126`; `MESHomeDashboard.tsx:68,76` | ⚠️ |
| 6 | IoTExtended toast/badge xom UZ | `IoTExtended.tsx:77,85,100` | ⚠️ |
| 7 | Sidebar nav title'lari xom UZ (tarjima yo'q) | `components/sidebar/constants.ts:276-296,528-545` | ⚠️ |
| 8 | 3 ta atraflashuvchi sensor sahifasi (bir xil API) | `IoTDashboard` / `IoTExtended` / `IotSensorsPage` | ❌ |
| 9 | `iot/dashboard` sidebar'da 2 marta (ikki title) | `sidebar/constants.ts:289,528` | ⚠️ |
| 10 | `IotSensorsPage` orphan (sidebar'da yo'q) | `IotSensorsPage.tsx` / `StubRoutes.tsx:108` | ⚠️ |
| 11 | Xom Tailwind palette rang 192×/24 fayl (token emas) | `IotMaintenanceMonitorTab.tsx`, `MESHomeDashboard*`, `MESDowntimes.tsx` ... | ⚠️ |
| 12 | Inline rgba boxShadow (token emas) | `MESExtended.tsx:142` | ⚠️ |
| 13 | "Uskuna 360" mexanik sahifasi YO'Q (faqat order-fragment) | `ProductionOrder360Equipment.tsx` (yagona yaqin) | ❌ |
| 14 | Mexanik ekrani HR/kamera bilan aralash (attendance/rooms/health) | `IotMaintenanceMonitorTab.tsx:174,258,324` | ❌ |
| 15 | Sahifa-darajali shablon (DashboardPage) yo'q — har sahifa o'z layout | `MES*`/`IoT*` umumiy | ⚠️ |
| 16 | Planshet katta tugma + sodda oqim (vizyonga mos) | `IoTProductionDashboardDialogs.tsx:86,99,147` | ✅ |
| 17 | EP primitiv qayta-ishlatish (StatusPill/Loader/Header) | modul bo'ylab (58/17/9) | ✅ |
| 18 | Dizayn-token: 0 arbitrary hex, 1 dinamik style (toza) | `IotDashboardHelpers.tsx:72` | ✅ |
| 19 | 3 sensor turi UI (issiqlik/bosim/vibratsiya) + threshold + grafik | `IotSensorsReadingsTab.tsx`, `IotDashboardHelpers.tsx:12` | ✅ |
| 20 | iot.json 159 kalit × 3 til (dashboard/sensor tarjima to'liq) | `locales/{uz,ru,uz-cyr}/iot.json` | ✅ |

---

## 8. XULOSA — FE dizayn/struktura tayyorligi (vizyon nuqtai)

| Jihat | % | Izoh |
|---|---|---|
| A+.11 planshet UI (sodda + katta tugma) | ~85% | dizayn kuchli; i18n 3-til + 2 buzuq matn kamchilik |
| A+.12 sensor real-time UI (3 sensor + threshold + grafik) | ~70% | UI boy + tarjimalangan; lekin dublikat + scope aralash |
| A+.12 "mexanik uskuna 360" sahifasi | ~15% | dedicated sahifa yo'q, faqat order-scoped fragment |
| Dizayn-token tozaligi (xom hex) | ~95% | 0 arbitrary hex; faqat xom Tailwind palette (WARN) |
| i18n butunligi (3-til) | ~55% | dashboard/sensor to'liq; planshet 0; MES qisman; sidebar xom |
| Komponent qayta-ishlatish | ~70% | EP primitiv yaxshi; sahifa-shablon yo'q |
| Dublikat tozaligi | ~50% | 3 sensor sahifasi + sidebar 2× dashboard |

**Asosiy tavsiyalar (faqat TAVSIYA — Qoida 23: bajarish egasi ruxsatisiz YO'Q):**
1. Planshetni `useTranslation('iot')` kalit tizimiga ko'chirish + uz-cyr qo'shish; 2 buzuq matnni tuzatish (#2, #3).
2. 3 sensor sahifasini yagonaga birlashtirish; orphan `IotSensorsPage` ni o'chirish/yo'naltirish; `iot/dashboard` ikki-nav-yozuvini bittaga tushirish.
3. A+.12 uchun **mexanik-markazli "uskuna 360"** sahifasi yaratish (bitta uskuna → issiqlik/bosim/vibratsiya jonli + tarix + predictive), HR/kamera tab'larini IoT dashboard'dan ajratish.
4. MES/IoT xom UZ matnlarni `t()` ga o'tkazish; sidebar title'larni i18n kalitga.
5. Xom Tailwind palette ranglarni `var(--ep-*)` token bilan almashtirish (192×/24 fayl).
6. Umumiy `DashboardPage` shabloni joriy etib, KPI/tab/bo'sh-holat takrorini kamaytirish.

*Tahlil 2026-06-02 — faqat KOD (Read/Grep/Glob). Brauzer ishlatilmadi (asosiy sessiya vizual qatlamni alohida qo'shadi). Hech narsa o'zgartirilmadi — faqat shu hisobot.*
