# P50 — GOLDEN: Integration: navigation — sidebar constants + all FE route registries

> **WAVE 4** | Oxirgi integratsiya paketi | DDL: YO'Q | dependsOn: P11, P14, P19, P23, P30, P32, P34, P36, P43, P45, P47, P49
>
> **dependsOn izohi:** P51 (manager_id backfill) va P52 (GL #76) — faqat BE/DDL paketlar,
> FE sahifalar chiqarmaydi → P50 ularni kutmaydi.

---

## 0. ROL VA QOIDALAR

Sen **Bajaruvchi (Executor)** agentsan. Faqat quyidagi qoidalar bloki va bu direktivadagi
ko'rsatmalarga amal qil. Hech qanday tashqi qaror qabul qilma.

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi.
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE
    ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil,
    supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration
    faylida '-- APPROVED:' izoh shart. Bu paket DDL talab QILMAYDI — DDL YO'Q.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit→saqla→qayta o'qi→ko'rinadimi). FE uchun: sidebar link → sahifa ochiladi.
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu yerda
    to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Bu agent WAVE 4 da ishlaydi** — barcha wave-1..3 paketlar (P11/P14/P19/P23/P30/
P32/P34/P36/P43/P45/P47/P49) tugagandan keyin boshlanadi. Ularning yaratgan yangi
FE sahifalarini sidebar + route registrylarga ulash bu agentning yagona vazifasi.

**dependsOn paketlar va ular yaratgan yangi sahifalar:**

| Paket | Modul | Yangi FE sahifalar (misol) |
|-------|-------|---------------------------|
| P11   | SD    | SDAdvanceControl, SDWarehouseRental (extended sahifalar) |
| P14   | PP    | PPShiftPlanFact, PPSmenaHandover sahifalari |
| P19   | QC    | QCGatesPage, QCInlineCheckPage yangi komponentlar |
| P23   | MM    | MMCheckBot, MMCreditorDebts real sahifalar |
| P30   | HR    | HR rating/onboarding yangi sahifalar (agar mavjud) |
| P32   | COR   | CouncilProtocolPage, BasketPage |
| P34   | LMS   | LMSCorePage, LMSOperatorCert |
| P36   | AI    | AIAgentsExtended, AIAnomalyPage |
| P43   | KAN   | KanbanBoardExtended, StrategicKanbanPage |
| P45   | IoT   | IoTCameraAndonPage, IoTMachineDetailPage |
| P47   | CRM   | CRMVisitPage, CRMDealWonPage |
| P49   | NTF/POS | NotificationBellPage, POSMonitorExtended |

---

## 1. IZOLYATSIYA MANIFESTI

Bu agent faqat quyidagi 11 fayl bilan ishlaydi. Boshqa hech qanday faylga tegma.
Agar boshqa fayl kerak bo'lsa — TO'XTA va egasiga flag qil.

```
OWNED FILES (EuroPrint-Clean ishchi papkasidan mutlaq yo'llar):

1.  Uzbek-Language-Module/artifacts/erp-dashboard/src/components/sidebar/constants.ts
2.  Uzbek-Language-Module/artifacts/erp-dashboard/src/components/constants.ts
3.  Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/HRRoutes.tsx
4.  Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx
5.  Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/WarehouseRoutes.tsx
6.  Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx
7.  Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/DirectorRoutes.tsx
8.  Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/AdminRoutes.tsx
9.  Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/CRMRoutes.tsx
10. Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx
11. Uzbek-Language-Module/artifacts/erp-dashboard/src/routes/StubRoutes.tsx
```

> ESLATMA: Barcha owned fayl yo'llari EuroPrint-Clean ishchi papkasidan (CWD)
> `Uzbek-Language-Module/artifacts/erp-dashboard/...` shaklida ko'rsatilgan.
> Bash buyruqlarida (cd Uzbek-Language-Module → ...) esa `artifacts/erp-dashboard/...`
> qisqartmasi ishlatiladi — bu to'g'ri (CWD o'zgaradi).

**DDL DARVOZASI:** Bu paketda DDL (CREATE TABLE / migration) YO'Q. Faqat TypeScript
fayllari o'zgaradi. DDL darvozasi qo'llanilmaydi.

**QOIDA 22 — Sidebar regress himoyasi (majburiy):**
- Yangi `/pos/*` URL bilan sidebar yozuvi QO'SHILMAYDI (Qoida 22 — POS = yagona
  `pos-monitor`).
- `warehouse/hub/<CODE>` standalone sidebar yozuvi QO'SHILMAYDI (ombor turlari =
  dashboard tab filteri).
- `check-sidebar-regress.mjs` skripti commit oldidan ishga tushiriladi.

---

## 2. VIZYON

### 2.1 GOLDEN integratsiya maqsadi

P50 — 50 ta parallel agentning so'nggi paketi. Uning vazifasi:

1. Wave 1-3 paketlari yaratgan **barcha yangi FE sahifalarni** tegishli route
   registry fayllariga qo'shish (lazy import + `[path, Component]` tuple).
2. Yangi sahifalar uchun **sidebar konstantasiga** tegishli yozuvlar qo'shish —
   faqat vizyon xaritasida mavjud bo'lgan, hali sidebar'da yo'q sahifalar uchun.
3. Mavjud `StubRoutes.tsx`dagi stub (`Stub`) yozuvlarini wave-1..3 da yaratilgan
   real sahifalarga almashtirish.
4. `AppRouter.tsx` **OWNED FILE EMAS** — AppRouter'ga tegma. Faqat route array
   eksportlarini yangilaymiz; AppRouter ularni `ALL_MODULE_ROUTES` orqali avtomatik
   ko'radi.

### 2.2 Qoida 20 — Route-Page sinxronizatsiyasi

> Fayl MAVJUD bo'lgandan KEYIN sidebar'ga qo'shing. Agar sahifa hali tayyor emas —
> `EPComingSoon` wrapper yarating. Stub sahifalar uchun sidebar yozuvi qo'SHILMAYDI
> (Qoida 20).

Bu degani: har bir yangi sidebar yozuvi uchun tegishli `lazy(() => import(...))` +
route tuple mavjud bo'lishi shart. Avval route, keyin sidebar.

### 2.3 Qoida 22 tekshiruv — sidebar regress chiziq

Quyidagi URL'lar sidebar'da HECH QACHON alohida yozuv bo'lmasligi kerak:
- `/pos/dashboard`, `/pos/stock`, `/pos/movements`, `/pos/requests`,
  `/pos/barcode`, `/pos/inventory`, `/pos/warehouse`, `/pos/sync`
- `wms/warehouse-type/RM-MAIN`, `wms/warehouse-type/FG-STORE`, va boshqa
  `warehouse/hub/<CODE>` shaklidagi deep-link turlari

### 2.4 Qabul mezonlari — vizyon tomoni

- Har bir wave-1..3 paketi yaratgan sahifa lazy import + route bilan ro'yxatdan
  o'tgan.
- Sidebar'da yangi yozuv = vizyon xaritasidagi haqiqiy mavjud sahifa (Qoida 20).
- `scripts/check-sidebar-routes.mjs` ⟶ 0 xato.
- `scripts/check-sidebar-regress.mjs` ⟶ 0 regress.
- FE tsc 0 xato.
- `pnpm --filter erp-dashboard run build` muvaffaqiyatli tugaydi.

---

## 3. HOZIRGI HOLAT

### 3.1 constants.ts (sidebar) — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/components/sidebar/constants.ts`

Hozir 645+ qator. Modullar: tz01..tz17, kanban, coordination, chat.

Ko'rilgan bo'shliqlar (sidebar da yo'q yoki stub URL bilan):

| Modul | URL (sidebar) | Holat |
|-------|---------------|-------|
| tz01 (SD) | `sd/advance-control` | Mavjud — SDExtended stub emas |
| tz04 (QC) | `qc/standards` | Redirect qilingan, `qc-module`ga borar |
| tz06 (PP) | `pp/oee-monitor` | OEELiveMonitorPage mavjud ✅ |
| tz07 (MES) | `mes/smena-handover` | MESExtended stub — P14/P16 real sahifa yaratgan bo'lishi kerak |
| tz12 (LMS) | `lms/knowledge-base` | KnowledgeBase real ✅ |
| coordination | `coordination?tab=baskets` | CoordinationPage ✅ |
| tz16 (DIR) | `director/ai-summary` | DirectorExtended — P29 real yaratgan bo'lishi mumkin |

Qo'shilmagan bo'lishi mumkin bo'lgan yozuvlar (P32 COR / P43 KAN / P47 CRM bo'yicha):
- CRM funnel/RFM/cohort sahifalari — `crm/funnel`, `crm/rfm`, `crm/cohort` routelari
  mavjud lekin tz01 sidebarida yo'q.
- Kanban modul — mavjud, lekin agar P43 yangi sahifalar yaratgan bo'lsa, ular
  `kanban` groupiga qo'shilishi kerak.

### 3.2 HRRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/HRRoutes.tsx`  
**Qatorlar:** 1-108

Mavjud eksportlar: `HR_ROUTES` (55 route), `AI_HR_ROUTES` (2 route), `SELF_SERVICE_ROUTES` (1 route).

P27/P28/P30 yaratgan yangi HR sahifalar agar ushbu ro'yxatda yo'q bo'lsa, qo'shiladi.

### 3.3 ProductionRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx`  
**Qatorlar:** 1-197

Mavjud eksportlar: `PRODUCTION_ROUTES`, `MES_ROUTES`, `QC_ROUTES`, `DESIGN_ROUTES`,
`MRO_ROUTES`, `IOT_ROUTES`.

P14 (PP shift-planfact), P15/P16/P17 (MES), P19 (QC gates), P44/P45 (IoT) yaratgan
yangi sahifalar agar ro'yxatda yo'q bo'lsa, qo'shiladi.

### 3.4 WarehouseRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/WarehouseRoutes.tsx`  
**Qatorlar:** 1-93

`WAREHOUSE_ROUTES` (53 route) mavjud. P20/P21/P22/P23 yaratgan yangi WMS/MM sahifalar
qo'shiladi.

### 3.5 FinanceRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx`  
**Qatorlar:** 1-65

`FINANCE_ROUTES` (29 route) mavjud. P24/P25/P26 yaratgan yangi FIN sahifalar qo'shiladi.

### 3.6 DirectorRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/DirectorRoutes.tsx`  
**Qatorlar:** 1-63

`DIRECTOR_ROUTES` (28 route) mavjud. P29 (DIR state engine) yaratgan yangi sahifalar
qo'shiladi.

### 3.7 AdminRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/AdminRoutes.tsx`  
**Qatorlar:** 1-102

`ADMIN_ROUTES`, `INTEGRATION_ROUTES`, `SAAS_ROUTES`, `LMS_ADMIN_ROUTES`,
`LMS_LEARNER_ROUTES`, `KAIZEN_ROUTES`, `ORDERS_REGISTRY_ROUTES`,
`ARCHITECTURE_GAP_ROUTES` mavjud. P33/P34 (LMS) va P42/P43 (KAN) yangi sahifalar
qo'shiladi.

### 3.8 CRMRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/CRMRoutes.tsx`  
**Qatorlar:** 1-102

`SALES_ROUTES`, `MARKETING_ROUTES` mavjud. P39/P40/P47 (CRM) va P41 (MKT) yangi
sahifalar qo'shiladi.

### 3.9 AnalyticsRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx`  
**Qatorlar:** 1-44

`ANALYTICS_ROUTES` (15 route) mavjud. P49 (NTF) yangi sahifalar qo'shiladi.

### 3.10 StubRoutes.tsx — hozirgi holat

**Fayl:** `artifacts/erp-dashboard/src/routes/StubRoutes.tsx`  
**Qatorlar:** 1-124

`STUB_ROUTES` (88 route) mavjud. Hozirda stub (`Stub`) sifatida qolganlar:
- `/ai/wms` — WmsAnalytics o'chirildi (to'g'ri holat, qoldirish)
- `/export` — hali qurilmagan (qoldirish)
- `/micro-modules` — deferred (qoldirish)
- `/modules` — deferred (qoldirish)
- `/pos/printer-config` — printer HW config, deferred (qoldirish)
- `/sap` — SAP integration (qoldirish)

Wave-1..3 tomonidan yaratilgan real sahifalar agar StubRoutes'da stub sifatida
tursa, ularni tegishli real route fayllariga ko'chirib, stub yozuvini o'chirish kerak.

---

## 4. ISH (qadam-baqadam)

### PRE-CONDITION TEKSHIRUV (0-qadam — Majburiy)

Ish boshlamay oldin quyidagi tekshiruvlarni bajaring:

```bash
# 1. Ishchi papkaga o'ting
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module

# 2. Wave-1..3 agentlar o'z ishlarini tugatganini tasdiqlang
git log --oneline -20

# 3. Yangi sahifa fayllarini toping (wave-1..3 yaratganlar)
find artifacts/erp-dashboard/src/pages -name "*.tsx" -newer \
  artifacts/erp-dashboard/src/routes/HRRoutes.tsx | head -50

# 4. FE typecheck hozirgi holatini tekshiring
cd artifacts/erp-dashboard && npx tsc --noEmit 2>&1 | head -30
cd ../..
```

**MUHIM:** Wave-1..3 agentlari hali tugamagan bo'lsa — TO'XTA. P50 faqat
barcha dependsOn paketlar tugagandan keyin boshlanadi.

---

### 1-QADAM: Mavjud yangi sahifalarni inventarizatsiya qilish

Wave-1..3 paketlari yaratgan yangi sahifalarni aniqla. Har bir owned route fayli
uchun quyidagi tekshiruvni bajar:

```bash
# Barcha mavjud sahifa fayllarini ro'yxatga ol
ls artifacts/erp-dashboard/src/pages/*.tsx | wc -l
ls artifacts/erp-dashboard/src/pages/**/*.tsx 2>/dev/null | head -100

# Hozirda route fayllariga qo'shilmagan sahifalarni aniqlash
# (route fayllarida import qilinmagan pages/ fayllar)
node -e "
const fs = require('fs');
const path = require('path');

const pagesDir = 'artifacts/erp-dashboard/src/pages';
const routesDir = 'artifacts/erp-dashboard/src/routes';

const pageFiles = fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.tsx'))
  .map(f => f.replace('.tsx', ''));

const routeContent = fs.readdirSync(routesDir)
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
  .map(f => fs.readFileSync(path.join(routesDir, f), 'utf8'))
  .join('\n');

const unregistered = pageFiles.filter(p => !routeContent.includes(p));
console.log('Ro\'yxatdan o\'tmagan sahifalar:', unregistered.join('\n'));
"
```

Bu skript qaysi sahifa fayllari hech bir route faylida import qilinmaganini
ko'rsatadi. Ularni keyingi qadamlarda tegishli route fayllariga qo'shing.

---

### 2-QADAM: HRRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/HRRoutes.tsx`

P27/P28/P30 yaratgan yangi HR sahifalarni qo'shing. Quyidagi shablon bo'yicha:

**OLDIN (qator 54-55 atrofida):**
```tsx
export const HR_ROUTES: [string, React.ComponentType][] = [
  ['/employees',                        Employees],
  // ... mavjud routelar ...
  ['/hr/milestones',                    HRMilestones],
];
```

**KEYIN — P27/P28/P30 yangi sahifalarini qo'shish:**

Avval wave-1..3 agentlarning yaratgan fayllarini tekshir. Agar quyidagi sahifalar
mavjud bo'lsa, ularni import va route sifatida qo'sh:

```tsx
// Import blokiga (faylning yuqori qismiga) qo'shish — faqat MAVJUD fayllar uchun:
// P27 — HR Rating sahifasi (agar mavjud bo'lsa)
// const HRRatingPage = lazy(() => import("@/pages/HRRatingPage"));
// P28 — HR Recruitment extended (agar mavjud bo'lsa)
// const HRRecruitmentExtended = lazy(() => import("@/pages/HRRecruitmentExtended"));
// P30 — HR onboarding extended (agar mavjud bo'lsa)
// const HROnboardingExtended = lazy(() => import("@/pages/HROnboardingExtended"));
```

**ANIQ QOIDA:** Faqat `artifacts/erp-dashboard/src/pages/` papkasida HAQIQATAN
MAVJUD bo'lgan fayllarni import qil. Mavjud bo'lmagan faylni import qilsang — tsc
xatosi chiqadi. Har bir import oldidan:

```bash
ls artifacts/erp-dashboard/src/pages/<SahifaNomi>.tsx
```

tekshiruvini bajar. Fayl yo'q bo'lsa — o'sha import va route QO'SHILMAYDI.

**Qo'shish tartibi:**
1. Fayl mavjudligini tekshir
2. `lazy(() => import("@/pages/..."))` qatorini import blokiga qo'sh
3. `HR_ROUTES` arrayiga `['/hr/...', ComponentName]` tuple qo'sh
4. Izoh qo'sh: `// P27 — HR rating page`

---

### 3-QADAM: ProductionRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx`

P14 (PP shift-planfact), P15/P16/P17 (MES wiring, OEE, checklist), P19 (QC gates)
yaratgan sahifalarni qo'sh.

**MES_ROUTES uchun misol (P16/P17 OEE va checklist):**

Agar `artifacts/erp-dashboard/src/pages/MESSmenaHandoverPage.tsx` mavjud bo'lsa:

```tsx
// OLDIN (qator 122-135 atrofida):
export const MES_ROUTES: [string, React.ComponentType][] = [
  ['/mes/dashboard-home',       MESHomeDashboard],
  // ...
  ['/mes/smena-handover',       MESExtended],     // ← MESExtended (stub-ga yaqin)
];

// KEYIN — real sahifa mavjud bo'lsa:
const MESSmenaHandoverPage = lazy(() => import("@/pages/MESSmenaHandoverPage"));
// ...
export const MES_ROUTES: [string, React.ComponentType][] = [
  ['/mes/dashboard-home',       MESHomeDashboard],
  // ...
  ['/mes/smena-handover',       MESSmenaHandoverPage],  // P14/P16 real sahifa
];
```

**QC_ROUTES uchun (P19 QC gates):**

Agar `artifacts/erp-dashboard/src/pages/qc/QCGatesPage.tsx` mavjud bo'lsa:

```tsx
// OLDIN (qator 137-155 atrofida):
export const QC_ROUTES: [string, React.ComponentType][] = [
  ['/qc/dashboard-home',    QCDashboard],
  ['/qc/approval',          QCApproval],   // inline QC
  // ...
];

// KEYIN:
const QCGatesPage = lazy(() => import("@/pages/qc/QCGatesPage"));  // P19
// ...
export const QC_ROUTES: [string, React.ComponentType][] = [
  ['/qc/dashboard-home',    QCDashboard],
  ['/qc/approval',          QCApproval],
  ['/qc/gates',             QCGatesPage],    // P19 — yangi inline QC gate
  // ...
];
```

**IOT_ROUTES uchun (P44/P45):**

Agar `artifacts/erp-dashboard/src/pages/IoTMachineDetailPage.tsx` mavjud bo'lsa:

```tsx
// OLDIN (qator 186-196 atrofida):
export const IOT_ROUTES: [string, React.ComponentType][] = [
  ['/iot/sensor-monitoring',      IoTExtended],
  // ...
];

// KEYIN:
const IoTMachineDetailPage = lazy(() => import("@/pages/IoTMachineDetailPage")); // P44
const IoTCameraAndonPage = lazy(() => import("@/pages/IoTCameraAndonPage"));     // P45
// ...
  ['/iot/machine/:id',            IoTMachineDetailPage],   // P44
  ['/iot/camera-andon',           IoTCameraAndonPage],     // P45
```

**PP ROUTES uchun (P14):**

Agar `artifacts/erp-dashboard/src/pages/PPShiftPlanFact.tsx` mavjud bo'lsa:

```tsx
// PRODUCTION_ROUTES arrayiga qo'shish:
const PPShiftPlanFact = lazy(() => import("@/pages/PPShiftPlanFact")); // P14
// ...
  ['/pp/shift-planfact',         PPShiftPlanFact],  // P14 — shift plan/fact
```

---

### 4-QADAM: WarehouseRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/WarehouseRoutes.tsx`

P20/P21 (WMS), P22/P23 (MM) yaratgan sahifalarni tekshir va qo'sh.

Agar `artifacts/erp-dashboard/src/pages/MMCheckBotPage.tsx` mavjud bo'lsa:

```tsx
// OLDIN (qator 83 atrofida):
  ['/mm/check-bot',               MMExtended],     // ← MMExtended (generic)

// KEYIN:
const MMCheckBotPage = lazy(() => import("@/pages/MMCheckBotPage")); // P23
// ...
  ['/mm/check-bot',               MMCheckBotPage], // P23 — real Check Bot sahifasi
```

Agar `artifacts/erp-dashboard/src/pages/MMCreditorDebtsPage.tsx` mavjud bo'lsa:

```tsx
// OLDIN (qator 84 atrofida):
  ['/mm/creditor-debts',          MMExtended],     // ← generic

// KEYIN:
const MMCreditorDebtsPage = lazy(() => import("@/pages/MMCreditorDebtsPage")); // P23
  ['/mm/creditor-debts',          MMCreditorDebtsPage], // P23
```

WMS yangi sahifalar uchun ham xuddi shu pattern:
- Avval `ls artifacts/erp-dashboard/src/pages/<SahifaNomi>.tsx` tekshir
- Mavjud bo'lsa — import + route qo'sh
- Yo'q bo'lsa — o'tkazib yubor

---

### 5-QADAM: FinanceRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx`

P24/P25/P26 yaratgan yangi Finance sahifalarni qo'sh.

Agar `artifacts/erp-dashboard/src/pages/FinanceCostCentersPage.tsx` mavjud bo'lsa:

```tsx
// OLDIN (qator 54 atrofida):
  ['/fi/cost-centers',                 FinanceExtended],

// KEYIN:
const FinanceCostCentersPage = lazy(() => import("@/pages/FinanceCostCentersPage")); // P26
  ['/fi/cost-centers',                 FinanceCostCentersPage],
```

---

### 6-QADAM: DirectorRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/DirectorRoutes.tsx`

P29 (DIR state engine) yaratgan yangi sahifalarni qo'sh.

Agar `artifacts/erp-dashboard/src/pages/DirectorStateEnginePage.tsx` mavjud bo'lsa:

```tsx
// Import blokiga:
const DirectorStateEnginePage = lazy(() => import("@/pages/DirectorStateEnginePage")); // P29

// DIRECTOR_ROUTES arrayiga:
  ['/director/state-engine',     DirectorStateEnginePage],  // P29
```

---

### 7-QADAM: AdminRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/AdminRoutes.tsx`

P33/P34 (LMS core), P42/P43 (KAN) yaratgan sahifalarni qo'sh.

**LMS sahifalar (P33/P34):**

Agar `artifacts/erp-dashboard/src/pages/LMSCorePage.tsx` mavjud bo'lsa:

```tsx
// LMS_ADMIN_ROUTES ga qo'shish:
const LMSCorePage = lazy(() => import("@/pages/LMSCorePage")); // P33
  ['/lms/core',                    LMSCorePage],   // P33
```

Agar `artifacts/erp-dashboard/src/pages/LMSOperatorCertPage.tsx` mavjud bo'lsa
(va `/lms/operator-certification` hali LMSExtended ga ko'rsayotgan bo'lsa):

```tsx
// OLDIN (qator 75 atrofida):
  ['/lms/operator-certification', LMSExtended],

// KEYIN:
const LMSOperatorCertPage = lazy(() => import("@/pages/LMSOperatorCertPage")); // P34
  ['/lms/operator-certification', LMSOperatorCertPage],  // P34 real
```

**KAN sahifalar (P42/P43):**

Agar `artifacts/erp-dashboard/src/pages/StrategicKanbanPage.tsx` mavjud bo'lsa:

```tsx
// KAIZEN_ROUTES yoki yangi KANBAN_ROUTES ga qo'shish:
const StrategicKanbanPage = lazy(() => import("@/pages/StrategicKanbanPage")); // P43
// KAIZEN_ROUTES ga:
  ['/kanban/strategic',           StrategicKanbanPage],  // P43
```

---

### 8-QADAM: CRMRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/CRMRoutes.tsx`

P39/P40/P47 (CRM visit, deal-won, GSD) va P41 (MKT) yaratgan sahifalarni qo'sh.

Agar `artifacts/erp-dashboard/src/pages/CRMVisitPage.tsx` mavjud bo'lsa:

```tsx
// Import blokiga:
const CRMVisitPage = lazy(() => import("@/pages/CRMVisitPage")); // P47

// SALES_ROUTES arrayiga:
  ['/crm/visits',               CRMVisitPage],    // P47 — CRM tashrif sahifasi
```

Agar `artifacts/erp-dashboard/src/pages/CRMDealWonPage.tsx` mavjud bo'lsa:

```tsx
const CRMDealWonPage = lazy(() => import("@/pages/CRMDealWonPage")); // P40
  ['/crm/deal-won',             CRMDealWonPage],  // P40 — yangi deal won
```

---

### 9-QADAM: AnalyticsRoutes.tsx ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx`

P49 (NTF/POS) yaratgan sahifalarni qo'sh.

Agar `artifacts/erp-dashboard/src/pages/NotificationBellPage.tsx` mavjud bo'lsa:

```tsx
// Import blokiga:
const NotificationBellPage = lazy(() => import("@/pages/NotificationBellPage")); // P49

// ANALYTICS_ROUTES arrayiga:
  ['/notifications/bell',        NotificationBellPage],   // P49
```

---

### 10-QADAM: StubRoutes.tsx — stub → real migratsiya

**Fayl:** `artifacts/erp-dashboard/src/routes/StubRoutes.tsx`

Wave-1..3 tomonidan real sahifaga aylangan stub routelarni yangilang.

**Tekshiruv algoritmi:**

```bash
# StubRoutes.tsx da Stub (soxta) ko'rsayotgan routelarni aniqlash
grep "Stub\]" artifacts/erp-dashboard/src/routes/StubRoutes.tsx
```

Hozirda stub (`Stub`) sifatida turganlar:
- `/ai/wms` → WmsAnalytics o'chirildi — `Stub` **QOLADI** (intentional)
- `/export` → hali qurilmagan — **QOLADI**
- `/micro-modules` → deferred — **QOLADI**
- `/modules` → deferred — **QOLADI**
- `/pos/printer-config` → deferred — **QOLADI**
- `/sap` → deferred — **QOLADI**

Agar wave-1..3 paketlari yangi route qo'shgan bo'lsa va ular StubRoutes'da
`Stub` sifatida tursa — ularni real sahifaga almashtir:

```tsx
// MISOL: Agar P49 NotificationBellPage yaratgan bo'lsa va
// '/notifications' allaqachon StubRoutes da stub sifatida tursa:

// OLDIN:
// ['/notifications',   Stub],

// KEYIN — route AnalyticsRoutes'ga ko'chirildi:
// StubRoutes'dan O'CHIR, AnalyticsRoutes'ga QO'SH (9-qadamda bajarildi)
```

**MUHIM:** Route bir joydan o'chirilganda AppRouter va ALL_MODULE_ROUTES'ni
tekshiring — lekin AppRouter OWNED FILE EMAS. Faqat route array fayllarini
o'zgartiring; AppRouter spread operatori orqali ularni avtomatik oladi.

---

### 11-QADAM: sidebar/constants.ts ni yangilash

**Fayl:** `artifacts/erp-dashboard/src/components/sidebar/constants.ts`

Bu qadam eng ehtiyotkorlikni talab qiladi. Qoida 20 va Qoida 22 qat'iy amal qiladi.

**Qo'shish mezonlari:**
1. Yangi sahifa fayli MAVJUD
2. Uning route faylda ro'yxatdan o'tgan
3. Vizyon xaritasida bu URL ko'rsatilgan
4. Ushbu URL hali sidebar'da YO'Q
5. Qoida 22 buzilmaydi (POS va warehouse hub regress yo'q)

**CRM/SD bo'yicha sidebar qo'shish misoli:**

Agar `crm/funnel`, `crm/rfm`, `crm/cohort` routelari mavjud bo'lsa va tz01
sidebarida yo'q bo'lsa — qo'shish:

```typescript
// OLDIN (tz01 items ichida, qator ~128 atrofida):
tz01: {
  items: [
    // ...
    { title: "SOTISH", url: "", icon: ShoppingCart, separator: true },
    { title: "Sotish Paneli", url: "sales", icon: ShoppingCart },
    { title: "AI CRM", url: "ai/crm", icon: BrainCircuit },
    // crm funnel/rfm/cohort YO'Q edi
  ]
}

// KEYIN — agar ular route faylda mavjud bo'lsa:
  { title: "CRM TAHLIL", url: "", icon: BarChart3, separator: true },
  { title: "Sotuv Voronkasi", url: "crm/funnel", icon: TrendingUp },
  { title: "RFM Klasterlar", url: "crm/rfm", icon: Grid3X3 },
  { title: "Kohort Tahlil", url: "crm/cohort", icon: BarChart3 },
```

**IoT/MES bo'yicha sidebar qo'shish misoli:**

Agar P44/P45 yaratgan `iot/machine/:id` va `iot/camera-andon` routelari mavjud
bo'lsa va tz15 sidebarida yo'q bo'lsa:

```typescript
// tz15 items ichiga (qator ~540 atrofida):
  { title: "MASHINA REJIMI", url: "", icon: Factory, separator: true },
  { title: "Mashina Detallari", url: "iot/machine/1", icon: Factory },  // deep-link misoli
  { title: "Kamera Andon", url: "iot/camera-andon", icon: Camera },
```

**TAQIQLANGAN sidebar qo'shimchalari (Qoida 22):**
```typescript
// BUNDAY YOZUVLAR MUTLAQO TAQIQLANGAN:
// { title: "POS Dashboard", url: "pos/dashboard", icon: ... }  ← TAQIQ
// { title: "RM Ombor", url: "wms/warehouse-type/RM-MAIN", icon: ... }  ← TAQIQ
// { title: "FG Ombor", url: "wms/warehouse-type/FG-STORE", icon: ... }  ← TAQIQ
```

**Lucide icon import tekshiruvi:**

Yangi sidebar yozuvi uchun yangi icon ishlatilsa, `constants.ts` fayli boshidagi
lucide-react import blokiga qo'shing:

```typescript
// OLDIN (qator 1-102):
import { LayoutDashboard, X,
  // ... ko'p iconlar ...
  Megaphone
} from "lucide-react";

// KEYIN — agar yangi icon kerak bo'lsa:
import { LayoutDashboard, X,
  // ...
  Megaphone,
  NewIconName  // ← faqat haqiqatan ishlatilsa
} from "lucide-react";
```

---

### 12-QADAM: Fayllar joylashuvi tekshiruvi

Barcha OWNED fayllar yagona `Uzbek-Language-Module/artifacts/erp-dashboard/`
papkasida joylashgan — alohida "mirror" nusxalar yo'q. Barcha o'zgarishlar
to'g'ridan-to'g'ri shu papkadagi fayllarga kiritiladi.

**Tekshiruv (cd Uzbek-Language-Module dan):**
```bash
ls artifacts/erp-dashboard/src/routes/
# Natija: HRRoutes.tsx, ProductionRoutes.tsx, WarehouseRoutes.tsx,
#          FinanceRoutes.tsx, DirectorRoutes.tsx, AdminRoutes.tsx,
#          CRMRoutes.tsx, AnalyticsRoutes.tsx, StubRoutes.tsx mavjud bo'lishi kerak
```

Agar kutilgan fayl topilmasa — 12-qadamda egaga flag qil.

---

### 13-QADAM: Qoida 22 tekshiruvi (pre-commit)

```bash
# Sidebar regress tekshiruvi
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
node scripts/check-sidebar-regress.mjs

# Sidebar → route sinxronizatsiyasi
node scripts/check-sidebar-routes.mjs
```

Agar xato topilsa — o'sha yozuvni olib tash (TAQIQLANGAN POS/warehouse URL bo'lsa)
yoki tegishli sahifa faylini yarating (route sinxronizatsiya xatosi bo'lsa).

---

### 14-QADAM: FE typecheck

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard
npx tsc --noEmit 2>&1

# Xato bo'lsa:
# 1. Import qilingan sahifa fayli mavjudmi? → tekshir
# 2. React.ComponentType import to'g'rimi? → tekshir
# 3. Syntax xatosi? → tuzat
```

**FE tsc 0 bo'lmaguncha commit qilinmaydi.**

---

### 15-QADAM: FE build tekshiruvi

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard
pnpm run build 2>&1 | tail -20
```

Build muvaffaqiyatli bo'lishi shart. Xato bo'lsa — tuzat, keyin commit.

---

## 5. DDL (agar bor)

**Bu paketda DDL YO'Q.** P50 faqat TypeScript (FE route + sidebar) fayllari bilan
ishlaydi. Hech qanday `CREATE TABLE`, migration SQL, yoki Drizzle schema o'zgarishi
YO'Q. DDL Darvozasi bu paketga taalluqli emas.

---

## 6. QABUL MEZONI

Quyidagi barcha bandlar bajarilganidan keyingina P50 yakunlangan hisoblanadi:

### Funksionallik

- [ ] Wave-1..3 paketlari yaratgan barcha mavjud sahifa fayllari tegishli route
      registryda lazy import + `[path, Component]` tuple bilan ro'yxatdan o'tgan.
- [ ] Har bir yangi route uchun tegishli route fayli aniqlanган:
  - SD/CRM sahifalar → `CRMRoutes.tsx`
  - PP/MES/QC/Design/MRO/IoT sahifalar → `ProductionRoutes.tsx`
  - WMS/MM/Logistika sahifalar → `WarehouseRoutes.tsx`
  - Finance sahifalar → `FinanceRoutes.tsx`
  - Director/Coordination sahifalar → `DirectorRoutes.tsx`
  - Admin/LMS/Kaizen sahifalar → `AdminRoutes.tsx`
  - HR/AI-HR sahifalar → `HRRoutes.tsx`
  - Analytics/LMS-learner sahifalar → `AnalyticsRoutes.tsx`
  - Yetim (modul aniqlanmagan) sahifalar → `StubRoutes.tsx`
- [ ] Stub (`Stub`) yozuvlaridan wave-1..3 real sahifalariga ko'chirish bajarilgan.
- [ ] Sidebar'da yangi yozuvlar faqat MAVJUD route uchun qo'shilgan (Qoida 20).
- [ ] Qoida 22: `/pos/*` yoki `warehouse/hub/<CODE>` sidebar yozuvlari QO'SHILMAGAN.

### Texnik sifat

- [ ] FE tsc 0 — `npx tsc --noEmit` xatosiz tugaydi.
- [ ] `pnpm run build` muvaffaqiyatli — Vite build 0 xato.
- [ ] `node scripts/check-sidebar-regress.mjs` — 0 regress topilgan.
- [ ] `node scripts/check-sidebar-routes.mjs` — 0 sinxronizatsiya xatosi.
- [ ] Hech qanday `artifacts/erp-dashboard/src/routes/AppRouter.tsx` faylga tegmagan
      (OWNED FILE EMAS).
- [ ] Hech qanday BE fayli o'zgartirilmagan.

### Golden-thread regress tekshiruvi

- [ ] Mavjud sidebar yozuvlari o'chirilmagan yoki o'zgartirilmagan (Qoida 46).
- [ ] Mavjud routelar (oldindan ishlaydigan) o'chirilmagan (Q-39 regress taqiq).
- [ ] Lucide icon import bloki faqat haqiqatan ishlatilgan iconlarni qamragan
      (keraksiz import qo'shilmagan).
- [ ] `getTranslatedMenuGroups` funksiyasi o'zgarmagan yoki saqlanган.
- [ ] `findModuleByPath` funksiyasi o'zgarmagan yoki saqlanган.

### Fayllar joylashuvi

- [ ] Barcha OWNED fayllar `Uzbek-Language-Module/artifacts/erp-dashboard/` papkasida
      mavjud (12-qadam tekshiruvi muvaffaqiyatli).
- [ ] Alohida "mirror" nusxalar yo'q — har bir fayl faqat bir joyda o'zgartirilgan.

---

## 7. SELF-VERIFY

### 7.1 FE typecheck

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard
npx tsc --noEmit
# Natija: 0 xato bo'lishi kerak
```

### 7.2 Sidebar regress

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
node scripts/check-sidebar-regress.mjs
# Natija: "No regress found" yoki shunga o'xshash
```

### 7.3 Route sinxronizatsiya

```bash
node scripts/check-sidebar-routes.mjs
# Natija: sidebar da ko'rsatilgan URLlar route faylda mavjud
```

### 7.4 Yangi routelar ro'yxatda

```bash
# Qo'shilgan route tuplelarini sana
grep -c "\['" artifacts/erp-dashboard/src/routes/HRRoutes.tsx
grep -c "\['" artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx
grep -c "\['" artifacts/erp-dashboard/src/routes/CRMRoutes.tsx
# va hokazo — har birida eski sondan katta bo'lishi kerak (agar yangi qo'shilsa)
```

### 7.5 FE build

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard
pnpm run build 2>&1 | grep -E "error|warning|built in"
# Natija: "built in Xs" — xatosiz
```

### 7.6 Lazy import tekshiruvi

```bash
# Har bir yangi import uchun sahifa fayli mavjudligini tasdiqlang
node -e "
const fs = require('fs');
const routes = [
  'artifacts/erp-dashboard/src/routes/HRRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/CRMRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/WarehouseRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/DirectorRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/AdminRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/StubRoutes.tsx',
];

let allOk = true;
routes.forEach(r => {
  const content = fs.readFileSync(r, 'utf8');
  const imports = [...content.matchAll(/import\([\"']@\/pages\/([^\"']+)[\"']\)/g)];
  imports.forEach(([, page]) => {
    const filePath = 'artifacts/erp-dashboard/src/pages/' + page + '.tsx';
    if (!fs.existsSync(filePath)) {
      // subfolder check
      const subFile = 'artifacts/erp-dashboard/src/pages/' + page;
      if (!fs.existsSync(subFile + '.tsx') && !fs.existsSync(subFile + '/index.tsx')) {
        console.error('MISSING:', filePath, 'in', r);
        allOk = false;
      }
    }
  });
});
if (allOk) console.log('All imports OK');
"
```

### 7.7 AppRouter tekshiruvi (OWNED FILE EMAS — faqat o'qiladi)

```bash
# AppRouter.tsx o'zgartirilmagan ekanini tasdiqlang
git diff artifacts/erp-dashboard/src/routes/AppRouter.tsx
# Natija: hech narsa ko'rinmasligi kerak (0 o'zgarish)
```

### 7.8 Qoida 22 — POS/Warehouse hub tekshiruvi

```bash
# sidebar constants.ts da TAQIQLANGAN yozuvlar yo'qligini tekshir
grep -n "pos/dashboard\|pos/stock\|pos/movements\|warehouse/hub/RM\|warehouse/hub/FG" \
  artifacts/erp-dashboard/src/components/sidebar/constants.ts
# Natija: hech narsa topilmasligi kerak
```

---

## 8. COMMIT

### Commit tartibi

**1-commit** — Route registry yangilanishlari (barcha route fayllar):

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module

git add artifacts/erp-dashboard/src/routes/HRRoutes.tsx
git add artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx
git add artifacts/erp-dashboard/src/routes/WarehouseRoutes.tsx
git add artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx
git add artifacts/erp-dashboard/src/routes/DirectorRoutes.tsx
git add artifacts/erp-dashboard/src/routes/AdminRoutes.tsx
git add artifacts/erp-dashboard/src/routes/CRMRoutes.tsx
git add artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx
git add artifacts/erp-dashboard/src/routes/StubRoutes.tsx

git commit -m "feat(P50): register wave-1..3 FE pages in route registries

- HRRoutes: add P27/P28/P30 HR rating/onboarding/recruitment pages
- ProductionRoutes: add P14 PP shift-planfact, P16/P17 MES OEE/handover,
  P19 QC gates, P44/P45 IoT machine detail/camera-andon pages
- WarehouseRoutes: add P22/P23 MM check-bot/creditor real pages
- FinanceRoutes: add P24/P25/P26 FIN new dedicated pages
- DirectorRoutes: add P29 DIR state-engine page
- AdminRoutes: add P33/P34 LMS core/operator-cert, P42/P43 kanban pages
- CRMRoutes: add P39/P40/P47 CRM visit/deal-won/GSD pages
- AnalyticsRoutes: add P49 NTF bell page
- StubRoutes: promote wave-1..3 real pages from Stub to actual components

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

**2-commit** — Sidebar constants yangilanishlari:

```bash
git add artifacts/erp-dashboard/src/components/sidebar/constants.ts

git commit -m "feat(P50): add sidebar entries for wave-1..3 new pages

- tz01 (SD/CRM): add crm/funnel, crm/rfm, crm/cohort entries
- tz04 (QC): add qc/gates entry for inline QC gate (P19)
- tz06/tz07 (PP/MES): add pp/shift-planfact, mes/smena-handover real entries
- tz15 (IoT): add iot/camera-andon, iot/machine detail entries (P44/P45)
- coordination: add council protocol entry (P32)
- Qoida 22: no /pos/* or warehouse/hub/<CODE> entries added

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

**3-commit (agar kerak bo'lsa)** — Qo'shimcha fayllar bo'lsa (ixtiyoriy):

Agar birinchi ikki commitda qo'shilmagan OWNED fayllar mavjud bo'lsa
(masalan, `components/constants.ts` o'zgartirgan bo'lsa), ularga alohida commit:

```bash
# Misol:
# git add artifacts/erp-dashboard/src/components/constants.ts
# git commit -m "feat(P50): update component constants for wave-1..3 pages
#
# Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit qoidalari

- `git add -A` yoki `git add .` — MUTLAQO TAQIQLANGAN
- Har commit `git status` bilan tekshirilsin
- `AppRouter.tsx` hech qachon commit qilinmaydi (OWNED FILE EMAS)
- BE fayllari hech qachon commit qilinmaydi
- Log fayllar (`*.log`, `backend.log*`) hech qachon commit qilinmaydi (Q-45)

---

## APPENDIX A: Edge-holatlar va qarorlar

### A.1 Sahifa fayli yo'q bo'lsa

Agar wave-1..3 paketi yaratishi kerak bo'lgan sahifa hali yaratilmagan bo'lsa:
1. Route QO'SHILMAYDI
2. Sidebar yozuvi QO'SHILMAYDI
3. `docs/P50-deferred.md` faylini yarating (agar MASSIV-50/ papkasida joy bo'lsa)
   va qaysi sahifalar kutilganda topilmaganini yozing.
4. Egaga xabar bering.

### A.2 StubRoutes'da eski real route'lar

Agar biror route StubRoutes'da tursa LEKIN tegishli route faylida ham bor bo'lsa —
bu duplicate. Bunday holda:
- StubRoutes'dan O'CHIR
- Tegishli route faylida QOLDIR (u allaqachon to'g'ri joyda)

### A.3 Sidebar'da URL hozir `/sd/...` lekin route `/sd/...`ga yo'qligida

```typescript
// constants.ts dagi sidebar URL:
{ title: "Buyurtmalar", url: "sd/sales-orders", icon: ShoppingCart }
// ↑ "sd/sales-orders" → route faylda: ['/sd/sales-orders', SDSalesOrders] ✅ MAVJUD

// Agar URL sidebar'da bor lekin route faylda yo'q bo'lsa:
// 1. Avval sahifa faylini qidiring: pages/SD*.tsx
// 2. Mavjud bo'lsa — route qo'shing
// 3. Yo'q bo'lsa — sidebar yozuvini OLIB TASHLANG (Q-39 buzilishi — eski holat)
```

### A.4 Lucide icon import tartib-intizomi

`constants.ts` faylidagi icon import bloki alifbo tartibida (taxminan) saqlanadi.
Yangi icon qo'shganda mavjud ro'yxatga qo'shib yozing, alohida `import` satri
yaratmang:

```typescript
// NOTO'G'RI — alohida import:
import { NewIcon } from "lucide-react";  // ← TAQIQ

// TO'G'RI — mavjud blokga qo'shing:
import { LayoutDashboard, X,
  // ...
  Megaphone,
  NewIcon  // ← shu yerga
} from "lucide-react";
```

### A.5 `React.ComponentType` import

Route fayllari React'ni import qilmaydi (u global), lekin lazy qaytaruvchi
komponent turi uchun:

```tsx
// HRRoutes.tsx da:
export const HR_ROUTES: [string, React.ComponentType][] = [...]
// ↑ React.ComponentType ishlatiladi — bu to'g'ri
// React import kerak emas (JSX runtime avtomatik)
```

Agar tsc "React is not defined" desa — fayl boshiga `import React from "react"` qo'sh.

### A.6 Bir sahifa bir nechta URL

Ba'zi sahifalar bir nechta URL orqali ochiladi:

```tsx
// TO'G'RI pattern — bir komponent, ikki route:
const SDSalesManagement = lazy(() => import("@/pages/SDSalesManagement"));
// ...
  ['/sd/sales-management',     SDSalesManagement],
  ['/sd/invoices',             SDSalesManagement],  // alias
```

Bu to'g'ri va ruxsat etilgan. Faqat bitta lazy import, bir nechta tuple.

### A.7 Deep-link routelar (`:id` parametr)

```tsx
// Parametrli routelar to'g'ri yoziladi:
  ['/iot/machine/:id',    IoTMachineDetailPage],  // ✅ to'g'ri
  ['/wms/material/360/:id', WarehouseMaterial360], // ✅ mavjud pattern
```

Parametrli routelar `AppRouter.tsx`'dagi `pathMatches` funksiyasi tomonidan
to'g'ri qayta ishlanadi.

---

## APPENDIX B: Tezkor tekshiruv jadvali

Har qadam tugagandan keyin quyidagi checklistdan o'ting:

| Qadam | Tekshiruv | Status |
|-------|-----------|--------|
| Pre-condition | `git log -10` — P11..P49 commitlari ko'rinadi | [ ] |
| 1-qadam | Yangi sahifalar inventarizatsiyasi tugadi | [ ] |
| 2-qadam | HRRoutes.tsx — yangi importlar + routelar qo'shildi | [ ] |
| 3-qadam | ProductionRoutes.tsx — MES/QC/IoT/PP yangi routelar | [ ] |
| 4-qadam | WarehouseRoutes.tsx — MM yangi routelar | [ ] |
| 5-qadam | FinanceRoutes.tsx — FIN yangi routelar | [ ] |
| 6-qadam | DirectorRoutes.tsx — DIR yangi routelar | [ ] |
| 7-qadam | AdminRoutes.tsx — LMS/KAN yangi routelar | [ ] |
| 8-qadam | CRMRoutes.tsx — CRM yangi routelar | [ ] |
| 9-qadam | AnalyticsRoutes.tsx — NTF yangi routelar | [ ] |
| 10-qadam | StubRoutes.tsx — stub → real migratsiya | [ ] |
| 11-qadam | constants.ts — vizyon muvofiq sidebar yozuvlari | [ ] |
| 12-qadam | Mirror fayllar sinxronizatsiyasi (agar kerak) | [ ] |
| 13-qadam | `check-sidebar-regress.mjs` → 0 regress | [ ] |
| 14-qadam | FE tsc 0 | [ ] |
| 15-qadam | FE build muvaffaqiyatli | [ ] |
| Commit 1 | Route registry fayllar committed | [ ] |
| Commit 2 | Sidebar constants committed | [ ] |
| Commit 3 | Qo'shimcha fayllar committed (agar kerak) | [ ] |

---

## APPENDIX C: Vizyon yo'nalishi — modul ↔ sidebar ↔ route mapping

Bu jadval vizyon-muvofiq mapping ni ko'rsatadi. Faqat bu jadvaldagi URL'lar
sidebar'ga qo'shilishi mumkin (va faqat tegishli sahifa mavjud bo'lsa):

| Modul | Sidebar URL | Route fayl | Vizyon |
|-------|-------------|------------|--------|
| SD (tz01) | `crm/funnel` | CRMRoutes | CRM funnel tahlili |
| SD (tz01) | `crm/rfm` | CRMRoutes | RFM klaster tahlili |
| SD (tz01) | `crm/cohort` | CRMRoutes | Kohort tahlil |
| QC (tz04) | `qc/gates` | ProductionRoutes | Inline QC gate nazorati |
| PP (tz06) | `pp/shift-planfact` | ProductionRoutes | Smena plan/fact |
| MES (tz07) | `mes/smena-handover` | ProductionRoutes | Smena topshirish (real) |
| IoT (tz15) | `iot/camera-andon` | ProductionRoutes | Kamera andon signal |
| IoT (tz15) | `iot/machine/1` | ProductionRoutes | Mashina detallari (deep-link) |
| DIR (tz16) | `director/state-engine` | DirectorRoutes | Director state engine |
| LMS (tz12) | `lms/core` | AdminRoutes | LMS asosiy kurslar |
| KAN (kanban) | `kanban/strategic` | AdminRoutes | Strategik kanban |
| CRM (tz01) | `crm/visits` | CRMRoutes | Tashrif boshqaruvi |
| CRM (tz01) | `crm/deal-won` | CRMRoutes | Yutilgan bitimlar |
| NTF | `notifications/bell` | AnalyticsRoutes | Bildirishnoma markazi |

> ESLATMA: Bu jadval VIZYON asosida tuzilgan. Agar wave-1..3 agentlari boshqa
> URL yoki komponent nomlari bilan yaratgan bo'lsa — haqiqiy fayl nomlarini
> ustuvor hisoblang. Faylni topib, uning nomiga mos import yozing.

---

*P50 direktiva — WAVE 4 — GOLDEN Integration: Navigation & Routes*  
*Tuzilgan: 2026-06-19 | Q-47 bo'yicha: 1000+ qator, to'liq, noaniqliksiz*  
*dependsOn: P11, P14, P19, P23, P30, P32, P34, P36, P43, P45, P47, P49*
