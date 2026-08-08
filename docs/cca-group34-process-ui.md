# CCA Guruh 3-4 — Jarayon/Arxitektura + UI/Tab qoidalari (READ-ONLY audit)

**Sana:** 2026-06-03 · **Rejim:** QAT'IY READ-ONLY (faqat shu `docs/` hisobot yozildi)
**Skop:** Duplicate routes · deleted-but-resurrected · orphan/dead listener · dizayn-shablon (Qoida 21/Q-41) · tab ierarxiya (Q-42)
**Backend:** `apps/api/src` · **Frontend:** `artifacts/erp-dashboard/src`

> ⚠️ Metodologiya eslatmasi (Q-29 verify-don't-trust): mavjud skriptlar **statik regex** ishlatadi
> va izoh/dinamik kodni ko'rmaydi → ko'p **false-positive** beradi. Quyida har bir da'vo
> kod bilan jonli tekshirildi va "haqiqiy" vs "soxta signal" ajratildi.

---

## 1. DUPLICATE ROUTES (bir xil METHOD + URL)

### 1.1 Skript natijasi
`node scripts/_dup-routes-scan.mjs` → **Jami route 2939 | TAKROR 7**.

### 1.2 ⚠️ Skript nuqsoni (MUHIM)
`scripts/_dup-routes-scan.mjs:17` regex `@(Get|Post|...)('...')` ni **izoh ichida ham** topadi
(`//` va `/* */` chiqarib tashlanmaydi). Shu sabab 7 "takror"ning **5 tasi soxta** —
bir tomoni allaqachon olib tashlangan, faqat izoh-qoldiq qolgan.

Har bir satr **LIVE** yoki **IZOH** ekani tekshirildi:

| # | Route | Tomon A | Tomon B | Holat |
|---|-------|---------|---------|-------|
| 1 | `DELETE /api/hr/safety/incidents/:id` | `hr/safety/hr-safety.controller.ts:59` **LIVE** | `hr/presentation/hr-compat-safety.controller.ts:91` **IZOH** | ❌ SOXTA — collision yo'q |
| 2 | `GET /api/hr-v2/daily-reports/employee/:id` | `hr/daily-report/daily-report.controller.ts:133` **LIVE** (`employee/:id`) | `…:119` **IZOH** (JSDoc) | ❌ SOXTA — 121=`employee` (query), 133=`employee/:id` (param), **boshqa path** |
| 3 | `GET /api/warehouse/dashboard/kpis` | `wms/presentation/wms-catalog.controller.ts:102` **LIVE** | `general/controllers/general-legacy-b.controller.ts:82` **IZOH** (`// @Get(...) — moved to Wms…`) | ❌ SOXTA — collision yo'q |
| 4 | `GET /api/warehouse/warehouses` | `wms/presentation/wms-gateway-warehouses.controller.ts:88` **LIVE** | `general/controllers/general-legacy-b.controller.ts:60` **IZOH** (`// @Get(...) — moved to Wms…`) | ❌ SOXTA — collision yo'q |
| 5 | `POST /api/attempts/:id/submit` | `lms/presentation/lms-attempts.controller.ts:84` **LIVE** | `…:97` **IZOH** (JSDoc) | ❌ SOXTA — 97 JSDoc; `LmsAttemptsAliasController` (`lms/attempts`) **bo'sh klass** (route yo'q) |
| 6 | `POST /api/auth/refresh` | `auth/presentation/auth.controller.ts:147` **LIVE** | `general/controllers/admin-auth.controller.ts:40` **LIVE** | ✅ **HAQIQIY COLLISION** |
| 7 | `POST /api/sd/contracts` | `sd/presentation/sd-quotations.controller.ts:92` **LIVE** | `sd/presentation/sd-contracts.controller.ts:5` **IZOH** (file-header `@description`) | ❌ SOXTA — `SdContractsController` faqat GET list + PATCH sign; POST `SdQuotationsController`da |

### 1.3 ✅ YAGONA HAQIQIY DUPLIKAT — `POST /api/auth/refresh`
Ikkala handler ham JONLI va aynan `POST /api/auth/refresh` ga ro'yxatdan o'tadi (Fastify boot'da
"duplicate route" xavfi):

- **Kanonik:** `auth/presentation/auth.controller.ts:147` — `@Controller('auth')` + `@Post('refresh')`
  - Zamonaviy CQRS; refresh **rotatsiya** + eski tokenni blacklist; `JWT_REFRESH_SECRET` bilan verify; httpOnly cookie.
- **Legacy (shadow xavfi):** `general/controllers/admin-auth.controller.ts:40` — `@Controller()` (bo'sh prefiks) + `@Post('auth/refresh')`
  - `LegacyService.findAdminById` ga delegatsiya; faqat access-token qaytaradi (rotatsiya yo'q).

> Qaysi biri "yutadi" — modul import tartibiga bog'liq (Fastify oxirgi ro'yxatdan o'tganni
> ishlatadi yoki boot-warning beradi). **Tavsiya (faqat egasi ruxsati bilan):** legacy
> `admin-auth.controller.ts` dagi `@Post('auth/refresh')` ni olib tashlab, kanonik
> `AuthController.refresh` ga yo'naltirish. Bu — Q-39/Q-40 doirasidagi qaror, hozir TEGILMADI.

### 1.4 Compat-controller eslatmasi (collision EMAS)
`deleted-routes.md` (29-48 qator) tasdiqlangan: `modules/compatibility/` dagi 4 controller
(`employees-compat-sub`, `employees-extra`, `warehouse-catalog`, `warehouse-label`) bir
prefiksga **qo'shimcha** route qo'shadi — bular FE tomonidan jonli iste'mol qilinadi,
duplikat EMAS. O'chirilmasin (egasi qarori 2026-06-03).

---

## 2. DELETED-BUT-RESURRECTED

**Manba:** `docs/deleted-routes.md` (2026-06-03 DARAJA 1 "tomir kesish" jurnali).

Jurnaldagi har bir o'chirilgan narsa kodda hali bormi — tekshirildi:

| O'chirilgan | Tur | Kodda bormi? | Holat |
|-------------|-----|--------------|-------|
| `bull`, `@nestjs/bull`, `bcryptjs` | npm dep | package.json'dan olingan | ✅ Tiklanmagan |
| `node-telegram-bot-api` | npm dep | **KEPT** (`telegram.service.ts:9` ishlatadi) | ✅ To'g'ri saqlangan (o'chirilmagan) |
| `/auth`, `/gpt`, `/v2/pos/printer-config` (FE stub-route) | StubRoutes.tsx | 3 yozuv olingan | ✅ Tiklanmagan |
| `/api/gpt/*`, `/api/v2/pos/printer-config/*` (BE) | endpoint | **KEPT** (Settings.tsx:136, PrinterSettingsTab.tsx:99) | ✅ To'g'ri saqlangan |

**Xulosa:** ❌ Resurrected (qaytadan paydo bo'lgan) narsa **YO'Q**. Jurnal toza, regressiya
topilmadi. Faqat boshqa `docs/*delet*|*removed*` fayl yo'q (yagona — `deleted-routes.md`).

> ℹ️ §1.2 dagi "izoh-qoldiq" `@Get` lar — bular *o'chirilgan route izlari* (intentional),
> resurrected EMAS. Lekin ular `_dup-routes-scan.mjs` ni chalg'itadi (§5 tavsiya).

---

## 3. ORPHAN / DEAD LISTENER

### 3.1 @OnEvent inventarizatsiyasi
Backend'da **57 ta distinct** `@OnEvent('...')` topic, **127 ta distinct** emit/eventName
string mavjud.

### 3.2 ⚠️ "Dead listener" statik tahlili ISHONCHSIZ
Naive literal-string mosligida **23 listener** "emitsiz" ko'rinadi, LEKIN bu raqam
**juda shishiq** — quyidagi indirection'lar statik grep'ga ko'rinmaydi:

- **Templated emit:** `pos-movement-status.service.ts:86` → `emit(\`pos.movement.data.${dto.status}\`, …)`
  → `approved`, `qc_approved`, `qc_rework`, `qc_rejected`, `cancelled`, `ai_processing`
  hammasi JONLI (status-driven). ❌ "dead" emas.
- **EVENT_MAP konstanta:** `shared/events/event-bridge.service.ts:64` → `CrmLeadCreatedEvent: 'crm.lead.created'`
  → `crm.lead.created`, `hr.candidate.added`, `finance.invoice.created` map orqali emit qilinadi. ❌ "dead" emas.

Demak avvalgi xotira ("10 dead listener") ham, bu skanning ("23") ham **statik artefakt** —
avtoritetli emas (Q-29: tasdiqlanmagan da'vo).

### 3.3 Candidate dead/unwired (template+map chiqarib tashlangach — qo'lda tasdiq KERAK)
Quyidagi 12 topic'da literal emit, map-qiymat va template emit **topilmadi**. Bu ularni
**potensial** ulanmaган deb belgilaydi, ammo (a) boshqa templated-emit (`pos.gl.${decision}`),
(b) FE/websocket emit, (c) telegram webhook orqali kelishi mumkin — shuning uchun
**runtime/qo'lda tasdiqsiz "o'lik" deb hisoblamaslik kerak**:

| Topic | Listener fayli | Eslatma |
|-------|----------------|---------|
| `attendance.early_departure` | telegram-bots/attendance-bot.service.ts | emit topilmadi |
| `attendance.employee_blocked` | telegram-bots/attendance-bot.service.ts | emit topilmadi |
| `candidate.applied` | telegram-bots/telegram-bots-cron-recruitment.service.ts | emit topilmadi |
| `candidate.stage_changed` | telegram-bots/telegram-bots-cron-recruitment.service.ts | emit topilmadi |
| `incident.created` | telegram-bots/telegram-bots-cron.service.ts | emit topilmadi |
| `document.rejected` | hr/attendance/late-arrival.service.ts | emit topilmadi |
| `lms.course_assigned` | telegram-bots/learning-bot.service.ts | emit topilmadi |
| `lms.certificate_issued` | telegram-bots/learning-bot.service.ts | emit topilmadi |
| `hr.employee.exit` | pos/.../pos-secondary-events.handler.ts | emit topilmadi (cross-modul) |
| `pos.gl.approved` / `pos.gl.rejected` | pos/.../pos-secondary-events.handler.ts | `pos.gl.${x}` template bo'lishi mumkin — tekshirilsin |
| `pos.inventory_count.started` | pos/.../pos-secondary-events.handler.ts | `started` emit topilmadi (`completed` bor) |
| `pos.stock.expiry_alert` | pos/.../pos-secondary-events.handler.ts | `low_alert` bor, `expiry_alert` emit topilmadi |

**Vizyonda kerak belgilash:** bular asosan **HR telegram-bot** + **POS ikkilamchi** workflow
listenerlari. Vizyon (order→dept fan-out, telegram-bot integratsiya) bu hodisalarni
*rejalashtirgan* — ya'ni ko'pchiligi "dead" emas, balki **emitter hali yozilmagan**
(unwired, kelajak ish). O'chirish TAVSIYA QILINMAYDI; emitter qo'shilishi kutilmoqda.

### 3.4 Sidebar regress guard
`node scripts/check-sidebar-regress.mjs` → ✅ "no regressed /pos/* or warehouse-type
subview entries." Qoida 22 toza.

---

## 4. DIZAYN-SHABLON (Qoida 21 / Q-41)

### 4.1 ⭐ ASOSIY TOPILMA — shablonlar UMUMAN MAVJUD EMAS
- Shablon import qiluvchi sahifa skripti: `WarehouseDashboardPage.tsx` (1 ta) topdi, LEKIN bu
  **soxta moslik** — grep `DashboardPage` naqshini fayl/eksport **nomida** topdi.
- `find` bilan tekshiruv: `ListPage*`, `FormPage*`, `DetailPage*`, `DashboardPage*`, `BoardPage*`
  komponent fayllari **TOPILMADI** (0 ta).

**Demak:** Qoida 21/Q-41 mandat qilgan **umumiy dizayn-shablon komponentlari
(`ListPage`/`FormPage`/`DetailPage`/`DashboardPage`/`BoardPage`) hali yaratilmagan.**

### 4.2 Ko'lam
- Top-level sahifa fayllari (`pages/*.tsx`, depth 1): **851**
- Barcha `pages/**/*.tsx` (rekursiv): **1144** (293 tasi ichki subkomponent/dialog/seksiya)
- Shablon ishlatuvchi haqiqiy sahifa: **0 / 851**

**Natija:** har bir sahifa **o'z layout'ini** quradi (Q-41 buzilishi — "yangi sahifa =
mavjud shablon + props" qoidasi bajarilmaydi, chunki shablon hali yo'q). Bu —
*regress* emas, balki **yetishmayotgan poydevor** (shablonlar yaratilishi kerak, keyin
sahifalar bosqichma-bosqich ko'chiriladi). Bu vizyon/egasi qaroriga bog'liq — hozir TEGILMADI.

> Eslatma: `src/components/ep/` + `src/components/ui/` (token + atom komponentlar) MAVJUD;
> yetishmayotgani — ular ustidagi **sahifa-darajali shablonlar**.

---

## 5. TAB IERARXIYA (Q-42 — maks 2 daraja)

### 5.1 Task heuristikasi (`grep -c TabsList > 2`) — chalg'ituvchi
`grep -c "TabsList"` ochuvchi+yopuvchi tag (`<TabsList>` + `</TabsList>`) ni **ikki marta**
sanaydi, shuning uchun "3" ko'pincha atigi 1 ta TabsList degani. Eng yuqori: `MarketingWebsiteCMS.tsx`
("5") — aslida **2 ta yonma-yon `<TabsList>`** (151, 190-satr), import qatori bilan. Nested EMAS.

### 5.2 To'g'ri o'lchov — distinct ochuvchi `<TabsList` tag > 2
**0 ta sahifa** 2 dan ortiq haqiqiy `<TabsList>` ga ega.

### 5.3 To'g'ri o'lchov — haqiqiy ICHMA-ICH `<Tabs>` (Q-42 depth ≥ 2)
`<Tabs>` ichida `<Tabs>` (stack-based) skani:
- Production sahifalarda: **0 ta** (`MESExtendedTabsC.tsx`, `MMExtendedTabs.tsx` — bu "Tabs"
  fayllar aslida **tab-content fragmentlari**, ularda `<Tabs>` 0 ta; parent kompozitsiya qiladi).
- Faqat **2 ta `.smoke.test.tsx`** fayl depth=2 ko'rsatdi (`MESExtendedTabsC.smoke.test.tsx`,
  `MMExtendedTabs.smoke.test.tsx`) — bular test fixture, real sahifa EMAS.

### 5.4 ✅ Xulosa — Q-42 TOZA
Hech bir **production sahifa** 3+ daraja "tab ichida tab" ishlatmaydi. Eng chuquri = 2 daraja
(ruxsat etilgan chegara). **Buzilish topilmadi.**

---

## 6. UMUMIY XULOSA

| Bo'lim | Topilma | Haqiqiy muammo |
|--------|---------|----------------|
| **Duplicate routes** | Skript 7 dedi → 6 SOXTA (izoh artefakti) | ✅ **1 haqiqiy**: `POST /api/auth/refresh` (auth.controller ╳ admin-auth.controller) |
| **Resurrected** | `deleted-routes.md` jurnal | ✅ **0** — toza, regressiya yo'q |
| **Orphan/dead listener** | Skан 23 dedi → template+map bilan shishiq | ⚠️ ~12 candidate **unwired** (emitter hali yo'q, asosan HR-telegram + POS-ikkilamchi); "dead" emas, qo'lda tasdiq kerak |
| **Dizayn-shablon** | 0 / 851 sahifa shablon ishlatadi | ⭐ Shablon komponentlari (`ListPage`...) **umuman mavjud emas** — poydevor yetishmaydi (Q-41) |
| **Tab ierarxiya** | Heuristika 25 sahifa dedi → soxta | ✅ **0** production buzilish — Q-42 toza |

### Vizyonda "kerak" deb belgilangan (o'chirilmaydi)
- §3.3 dagi 12 unwired listener — emitter kelajakda yoziladi (telegram-bot/POS workflow vizyoni).
- §4 dizayn-shablonlar — yaratilishi kerak bo'lgan poydevor, keyin 851 sahifa ko'chiriladi.

### Yagona "darhol" nomzod (faqat egasi ruxsati bilan — Q-28/Q-39)
- `POST /api/auth/refresh` duplikatini hal qilish: legacy `admin-auth.controller.ts:40`
  `@Post('auth/refresh')` olib tashlab, kanonik `AuthController.refresh` (rotatsiya+blacklist)
  ga yagona qilish.

### Skript yaxshilash tavsiyasi (alohida ish)
`scripts/_dup-routes-scan.mjs` izohlarni (`//`, `/* */`, JSDoc) chiqarib tashlamaydi →
6/7 false-positive. Comment-stripping qo'shilsa, skript faqat 1 ta haqiqiy collision'ni
ko'rsatadi va pre-commit signal ishonchli bo'ladi.

---
*Audit: 2026-06-03 · CCA Guruh 3-4 · READ-ONLY · har da'vo kod bilan jonli tasdiqlangan (Q-29).*
