# Backend Endpoint Inventarizatsiyasi — EuroPrint ERP

**Sana:** 2026-06-02
**Agent:** agent1-backend-endpointlar
**Usul:** READ-ONLY statik tahlil. `apps/api/src` dagi 344 ta `*.controller.ts` fayli AST-darajasida (brace-balanced body capture bilan) parse qilindi, har bir handler tanasi REAL/PARTIAL/STUB ga ajratildi; izoh ichidagi soxta dekoratorlar filtrlandi; global guard zanjiri va `@Public` mexanizmi kod bilan tasdiqlandi; DB ulanish (`europrint`@127.0.0.1:5432) bilan baza holati tekshirildi.
**Backend root:** `apps/api/src` · **Global route prefiks:** `/api` (`main-bootstrap.ts:172` → `app.setGlobalPrefix('api')`)

---

## 0. QISQA XULOSA (raqamlar bilan)

| Ko'rsatkich | Qiymat |
|---|---|
| Controller **fayllar** (`*.controller.ts`) | **344** |
| Controller **klasslar** (`export class *Controller`) | **364** (ba'zi faylda 2 ta klass) |
| **Modullar** (`*.module.ts`) | 64 |
| **Aniqlangan endpointlar** (izohlar chiqarib tashlangan) | **2961** |
| — GET | 1616 |
| — POST | 833 |
| — PATCH | 275 |
| — DELETE | 144 |
| — PUT | 93 |
| **REAL** (DB/servis ulangan) | **2683 (≈90.6%)** |
| **PARTIAL** (qisman: event-only / soxta-fallback) | **5** |
| **STUB** (501 / hardcoded / soxta-create) | **274 (≈9.2%)** |
| **Funksional (REAL+PARTIAL, ya'ni STUB EMAS)** | **≈90.8%** |
| `@Public` (JWT-siz) endpointlar | **37** (ko'pi login/OTP/webhook/storefront yoki ikkilamchi token-guard bilan) |
| **Runtime duplikat route** | **0** (topilgan 7 "duplikat" — hammasi izoh artefakti yoki o'lik orphan) |
| Controller ichida **xavfli `sql.raw(o'zgaruvchi)`** | **0** |
| Controller ichida **to'g'ridan `this.db.*`** | **0** (transport qatlami toza) |
| **O'lik (orphan) controller** | **2** (`AdminAuthController`, `PosController`) ≈ 23 route hech qachon runtimega chiqmaydi |

> **Asosiy xulosa:** Backend endpoint yuzasi **juda katta va asosan funksional** (≈91% DB/servisga ulangan). Eski hisobotlardagi "ko'p stub", "ko'p duplikat route", "ochiq guardsiz endpointlar", "xavfli raw SQL" da'volari **bo'rttirilgan** — bu tahlil ularning aksini kod bilan isbotlaydi. Asosiy texnik qarz: ~274 ta stub (asosan 7 ta "dashboard/stubs" controllerda to'plangan) va 14 ta xavfli "soxta-create" endpoint (POST qabul qiladi, lekin DB ga yozmaydi).

---

## 1. GLOBAL GUARD ZANJIRI (xavfsizlik konteksti — MUHIM)

`apps/api/src/app.module.ts:193-197` — **5 ta GLOBAL `APP_GUARD`** ro'yxatdan o'tgan:

```
{ provide: APP_GUARD, useClass: FastifyThrottlerGuard }
{ provide: APP_GUARD, useClass: JwtAuthGuard }
{ provide: APP_GUARD, useClass: RolesGuard }
{ provide: APP_GUARD, useClass: SodGuard }
{ provide: APP_GUARD, useClass: PermissionGuard }
```

**Natija:** Har bir endpoint **default holatda JWT bilan himoyalangan** — controllerda `@UseGuards` yo'qligi "ochiq" degani EMAS. Faqat `@Public()` dekoratori JwtAuthGuard ni chetlab o'tadi (`jwt-auth.guard.ts:67-72` → `IS_PUBLIC_KEY` reflector orqali; `public.decorator.ts:10`). Bu memory'dagi "no-guard=open da'volari FALSE" qaydini tasdiqlaydi.

---

## 2. TOIFA TA'RIFLARI (tasniflash mantig'i)

| Toifa | Ta'rif | Dalil |
|---|---|---|
| **REAL** | Handler servis/repo metodini chaqiradi (`this.svc.x()`), yoki to'g'ridan DB (`db`/`sql`/`drizzle`), yoki `unwrapOrThrow(await fn())` modul-funksiyasi, yoki real fs/validatsiya | tana tahlili |
| **PARTIAL** | Servisga ulangan, lekin to'liq emas: faqat event emit qiladi (persist yo'q), yoki soxta fallback qaytaradi | tana tahlili |
| **STUB-501** | `notImplemented('...')` yoki `HttpException(..., 501)` tashlaydi | `not-implemented.ts:29` helper |
| **STUB-STATIC** | DB-siz hardcoded literal qaytaradi, yoki lokal `stub()` thrower chaqiradi | tana tahlili |
| **STUB-FAKE-CREATE** | POST/PATCH qabul qiladi, lekin DB ga yozmaydi — `{ id: Date.now(), ...dto, created: true }` yoki `return 0` | **eng xavfli** — sukutda ma'lumot yo'qoladi |
| **STUB-EMPTY / FAKE-OK** | `return {}` / `return []` / `return { ok: true }` | Qoida 10 buzilishi |

> **Eslatma (aniqlik):** Boshlang'ich avtomatik tasnif 126 STUB-STATIC va 46 PARTIAL bergan edi. Qo'lda namuna-tekshiruv bilan **10 ta STUB-STATIC** (validate/stir, validate/luhn, auth/me, auth/health, pos/auth/ping, storage/* fayl-server, +4 servis-ulangan) va **41 ta PARTIAL** (`compatibility/*/v2` — `toDomain` so'zi "toDo" ga mos kelgan soxta-signal, aslida `this.extendedSvc.*` chaqiradi) **REAL** ekani aniqlandi va REAL ga ko'chirildi. Yakuniy raqamlar shu tuzatishni hisobga oladi.

---

## 3. MODUL BO'YICHA JADVAL (controller-papka darajasi)

Funksional % = (REAL + 0.5×PARTIAL) / Jami. Tartib: jami endpoint kamayishi bo'yicha.

| Modul | Jami | REAL | PARTIAL | STUB | Funksional % |
|---|---|---|---|---|---|
| hr | 370 | 334 | 1 | 35 | 90% |
| compatibility | 339 | 294 | 29* | 16 | 91% |
| finance | 176 | 159 | 0 | 17 | 90% |
| pos | 168 | 159 | 0 | 9 | 95% |
| wms | 157 | 130 | 0 | 27 | 83% |
| iot | 137 | 111 | 0 | 26 | 81% |
| crm | 120 | 117 | 0 | 3 | 98% |
| remaining | 116 | 97 | 13* | 6 | 89% |
| director | 105 | 104 | 0 | 1 | 99% |
| sd | 104 | 104 | 0 | 0 | **100%** |
| marketing | 99 | 67 | 0 | 32 | **68%** ⚠ |
| kanban | 93 | 88 | 1 | 4 | 95% |
| ai | 87 | 79 | 0 | 8 | 91% |
| lms | 81 | 73 | 0 | 8 | 90% |
| qc | 80 | 68 | 0 | 12 | 85% |
| erp | 79 | 78 | 0 | 1 | 99% |
| integration | 69 | 58 | 0 | 11 | 84% |
| mm | 69 | 48 | 0 | 21 | **70%** ⚠ |
| pp | 58 | 52 | 0 | 6 | 90% |
| chat | 53 | 53 | 0 | 0 | **100%** |
| agents | 51 | 50 | 0 | 1 | 98% |
| mes | 46 | 45 | 0 | 1 | 98% |
| general | 39 | 34 | 1 | 4 | 88% |
| ecommerce | 38 | 38 | 0 | 0 | **100%** |
| communication-center | 30 | 29 | 0 | 1 | 97% |
| security | 25 | 17 | 0 | 8 | **68%** ⚠ |
| org-structure | 23 | 18 | 0 | 5 | 78% |
| design | 22 | 16 | 0 | 6 | 73% |
| admin | 20 | 18 | 0 | 2 | 90% |
| legacy | 18 | 13 | 0 | 5 | 72% |
| pos-v2 | 15 | 15 | 0 | 0 | **100%** |
| mro | 14 | 14 | 0 | 0 | **100%** |
| ai-agents | 12 | 11 | 0 | 1 | 92% |
| notifications | 11 | 11 | 0 | 0 | **100%** |
| auth | 9 | 7 | 0 | 2 | 78% |
| aisha | 5 | 4 | 0 | 1 | 80% |
| export | 5 | 5 | 0 | 0 | **100%** |
| logistics | 5 | 4 | 1 | 0 | 90% |
| order-workflow | 5 | 5 | 0 | 0 | **100%** |
| core | 3 | 3 | 0 | 0 | **100%** |
| common | 2 | 0 | 0 | 2 | (validate — aslida REAL, pastga qarang) |
| storage | 2 | 1 | 0 | 1 | (serveFile — aslida REAL) |
| bot-gateway | 1 | 1 | 0 | 0 | **100%** |

\* `PARTIAL` ustunidagi `compatibility` (29) va `remaining` (13) raqamlari avtomatik tasnif soni — bularning aksariyati `/v2` ACL-wrapper bo'lib **aslida REAL** (3-bo'lim eslatmasiga qarang). To'g'rilangan global funksional % = **90.8%**.

> **Eng zaif modullar (haqiqiy stub bo'yicha):** marketing (68%, atayin `-stubs` controller), mm (70%, `mm-dashboard`), security (68%), design (73%), iot (81%), wms (83%).

---

## 4. STUB ENDPOINTLAR — ALOHIDA RO'YXAT (274 ta, 86 faylda)

### 4.1 Eng ko'p stub to'plangan controllerlar (TOP 20)

| Stub soni | Controller | Izoh |
|---|---|---|
| 32 | `marketing/presentation/marketing-analytics-stubs.controller.ts` | Atayin stub-controller; lokal `stub()` thrower (`:29`). NPS/churn/leads/inbox REAL, lekin exhibitions/PR/settings/AB-test/ai-generate STUB |
| 18 | `hr/presentation/hr-dashboard.controller.ts` | HRC-tests, birthdays, 360, ai-interview, fp-cycle, documents — 501 |
| 17 | `mm/presentation/mm-dashboard.controller.ts` | Vendor-invoices, 3way-match, fleet, vehicles — 501 |
| 14 | `iot/presentation/iot-tablet.controller.ts` | production-sessions, material-kit, shift, handover — 501 (orders/equipment/login/sos REAL) |
| 10 | `integration/integration-employee.controller.ts` | complaints, skill-gap, mentorships, expense, invoice — 501 |
| 10 | `qc/presentation/qc-defects.controller.ts` | approve/reject/inspector-submit (PATCH+POST juftlik) — hardcoded |
| 8 | `security/presentation/security.controller.ts` | daily-summary, fire-sensors, ppe-checks/stats/violations — 501 |
| 8 | `wms/presentation/wms-barcode.controller.ts` | printer-config CRUD, material-kits — 501 |
| 6 | `ai/presentation/ai.controller.ts` | forecast/demand, rush-orders, bottleneck, shift-recommendations |
| 6 | `design/presentation/design.controller.ts` | notifications, tooling, wear-forecast, orders/messages |
| 6 | `wms/presentation/wms-integration.controller.ts` | mm/fi integration, summary — 501 |
| 5 | `compatibility/asset-management.controller.ts` | depreciate, maintenance/complete |
| 5 | `compatibility/saas.controller.ts` | tenants/modules, onboard, orders-registry — 501 |
| 5 | `hr/presentation/hr-compat-a.controller.ts` | hrc-tests questions/sessions/results — 501 |
| 5 | `org-structure/org-structure.controller.ts` | nodes history/hr-requests/portret |
| 5 | `pos/presentation/pos-stub.controller.ts` | sales/daily, inventory low-stock/movements/monthly, adjust |
| 4 | `finance/presentation/finance-extended-income.controller.ts` | asset-inventory summary, ai-finance-insights, +2 fake-create |
| 4 | `iot/presentation/iot-sensors-main.controller.ts` | predictive-maintenance, alerts/resolve, +1 fake-create |
| 4 | `pp/technology/technology.controller.ts` | cards CRUD/generate/optimize — 501 |
| 3 | (finance-main, finance-payments, hr-dashboard-extra, hr-vacancies, iot-main, kanban-cards, lms-misc, mm-purchase-orders, wms-catalog, wms-warehouse-gateway) | har biri 3 ta |

To'liq 86-faylli ro'yxat tahlil ma'lumotlarida (har bir endpoint route + fayl:satr bilan aniqlangan).

### 4.2 ⚠ ENG XAVFLI: STUB-FAKE-CREATE (14 ta) — POST qabul qiladi, DB ga YOZMAYDI

Bular sukutda **ma'lumot yo'qotadi** — FE muvaffaqiyat deb o'ylaydi, lekin hech narsa saqlanmaydi:

| Method | Route | Fayl:satr |
|---|---|---|
| POST | `/api/finance/payments` | `finance/presentation/finance-payments.controller.ts:70` → `{ paymentId: Date.now(), ...dto, created: true }` |
| POST | `/api/design/orders` | `design/presentation/design.controller.ts:196` |
| POST | `/api/design/orders/:id/messages` | `design/presentation/design.controller.ts:207` |
| POST | `/api/hr/recruitment/vacancies` | `hr/recruitment/hr-vacancies.controller.ts:173` |
| POST | `/api/inventory/materials` | `wms/presentation/inventory-materials.controller.ts:109` → `{ id: Date.now(), ...dto, created: true }` |
| POST | `/api/pp/routing` | `pp/presentation/pp-routing.controller.ts:73` → `return 0` |
| POST | `/api/crm/leads/:id/emails` | `crm/presentation/crm-leads.controller.ts:183` |
| POST | `/api/asset-management/insurance` | `compatibility/asset-management.controller.ts:190` |
| POST | `/api/finance-extended/inventory-counts` | `finance/presentation/finance-extended-income.controller.ts:82` |
| POST | `/api/finance-extended/asset-inventory` | `finance/presentation/finance-extended-income.controller.ts:99` |
| POST | `/api/iot-sensors` | `iot/presentation/iot-sensors-main.controller.ts:140` |
| POST | `/api/org-structure/nodes/:nodeId/portret` | `org-structure/org-structure.controller.ts:257` |
| POST | `/api/warehouse/goods-receipts/:id/lines` | `wms/presentation/wms-warehouse-gateway.controller.ts:198` |
| POST | `/api/attendance` | `general/controllers/general-legacy-b.controller.ts:201` |

+ 1 ta STUB-FAKE-OK: `POST /api/supply-chain/refresh` (`remaining/system.controller.ts:83` → `{ ok: true }`).

### 4.3 STUB-EMPTY (3 ta — `return []`/bo'sh)

- `POST /api/agents/alerts/:id/read` — `agents/agents.controller.ts:201`
- `GET /api/mm/vendor-performance` — `mm/presentation/mm-vendors-pr.controller.ts:54`
- `GET /api/security/visitors` — `security/presentation/security.controller.ts:152`

### 4.4 Haqiqiy PARTIAL (5 ta)

| Route | Fayl:satr | Sabab |
|---|---|---|
| `PATCH /api/logistics/:id/complete` | `logistics/presentation/logistics.controller.ts:128` | Event emit qiladi (DELIVERY_COMPLETED), lekin DB ga persist yo'q |
| `GET /api/employees/extra/:id` | `compatibility/employees-extra.controller.ts:71` | Qisman fallback |
| `POST /api/papka-orders` | `general/controllers/general-legacy-a.controller.ts:87` | Legacy qisman |
| `POST /api/hr-v2/enps/respond` | `hr/enps/enps.controller.ts:82` | Qisman |
| `GET /api/kanban/reports/export` | `kanban/presentation/kanban-reports.controller.ts:76` | Export qisman |

---

## 5. @Public (JWT-SIZ) ENDPOINTLAR — 37 ta

**MUHIM:** "Public" = global JwtAuthGuard chetlab o'tiladi, lekin ko'pchiligida **ikkilamchi token-guard** yoki **session-token tekshiruvi** bor. Hech biri "to'liq ochiq xavf" emas.

### 5.1 Atayin ommaviy (login / OTP / refresh / webhook / storefront) — XAVFSIZ
- `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp` — auth oqimi
- `GET /api/auth/health` — health (statik, normal)
- `POST /api/bot/:bot/webhook` — Telegram webhook (`@Controller('bot')` klass-darajada `@Public`)
- `GET /api/cc/verify/:id` — hujjat ommaviy tasdig'i (`@Controller('cc/verify')` klass-darajada `@Public`)
- `POST /api/client-errors` — FE xato loglovchi (cap bilan, memory: security fix)
- **Ecommerce storefront (10):** `/api/public/categories|products/:slug|orders|contact`, `/api/website/banners|portfolio|news|settings|pages` — ommaviy sayt, to'g'ri

### 5.2 Token-guard bilan himoyalangan @Public ( tashqi PWA/tablet)
- **iot-tablet (3 read):** `GET /api/iot/tablet/orders|worker-schedule|equipment` — har birida `@UseGuards(TabletTokenGuard)` (`iot-tablet.controller.ts:62,74,86`). `login`/`sos-alert` ham public, lekin login token beradi. **Memory tasdig'i:** ilgari guardsiz edi, endi TabletTokenGuard bilan 401.
- **pos mini-app (7):** `@Controller('pos/mini-app')` klass-darajada `@Public` (`mini-app.controller.ts:54`), lekin har metod `resolveSession(this.telegramService, sessionToken)` orqali `x-tg-session` Telegram tokenini tekshiradi. `auth` endpoint token beradi.
- **pos mini-app-history (3):** `/api/pos/mini-app/history|pending-approvals|warehouses` — `@Public`, session bilan
- **hr ai-interview-v2 (3):** `/api/hr-v2/ai-interview/session/:token/...` — `:token` URL-token bilan validatsiya (`validate`/`submit`/`camera-rejected`)
- **pos-auth (2):** `POST /api/pos/auth/login` (token beradi), `GET /api/pos/auth/ping` (health)

> **Eslatma:** `storage` controller (`@Get('*')` fayl-server) `@Public` EMAS — global JwtAuthGuard himoyalaydi (memory: upload/serve 401 ga tuzatilgan, tasdiqlandi: `storage.controller.ts` da hech qanday `@Public` yo'q).

---

## 6. DUPLIKAT ROUTELAR — 0 ta runtime duplikat

Avtomatik skanerlash dastlab 7 ta "duplikat" topdi, lekin **har birini kod bilan tekshirib, hammasi soxta (false-positive)** ekani aniqlandi:

| "Duplikat" | Haqiqiy holat |
|---|---|
| `GET /warehouse/warehouses` | `general-legacy-b.controller.ts:60` — **izohga olingan** (`// @Get(...) — moved to WmsWarehouseGatewayController`) |
| `GET /warehouse/dashboard/kpis` | `general-legacy-b.controller.ts:82` — **izohga olingan** |
| `GET /hr-v2/daily-reports/employee/:id` | `daily-report.controller.ts:119` — **izoh** (JSDoc tartib eslatmasi) |
| `DELETE /hr/safety/incidents/:id` | `hr-compat-safety.controller.ts:91` — **izoh** |
| `POST /attempts/:id/submit` | `lms-attempts.controller.ts:97` — **JSDoc izoh** ichida; haqiqiy endpoint `:88`, `LmsAttemptsAliasController` (`:109`) atayin bo'sh (Fastify duplikat-warning ni o'chirish uchun) |
| `POST /sd/contracts` | `sd-contracts.controller.ts:5` — **izoh** (POST aslida `sd-quotations` da) |
| `POST /auth/refresh` (auth + admin-auth) | **O'lik orphan** — pastga qarang |

> Bu eski hisobotlardagi "32 duplikat route" da'vosini bekor qiladi: izoh ichidagi `@Get(...)` matnlari haqiqiy route emas.

---

## 7. O'LIK (ORPHAN) CONTROLLERLAR — 2 ta (~23 dead route)

Hech qaysi `*.module.ts` / `*.providers.ts` barrel `controllers:[]` massiviga kirmagan, ya'ni **runtimega route map bo'lmaydi**:

| Controller | Fayl(lar) | Dead route | Izoh |
|---|---|---|---|
| `AdminAuthController` | `general/controllers/admin-auth.controller.ts` + `legacy/controllers/admin-auth.controller.ts` (2 nusxa, bir xil nom) | `POST /api/auth/refresh` (general), `POST /api/admin/auth/refresh` (legacy) | `LegacyModule` faqat `GeneralLegacyA/BController` ni ro'yxatdan o'tkazadi (`legacy.module.ts:17`). Bu juftlik `auth/refresh` "duplikat"ini o'lik qiladi. **Tavsiya: o'chirish.** |
| `PosController` | `pos/presentation/pos.controller.ts` (`@Controller('legacy/pos')`) | `/api/legacy/pos/*` — 19 ta route (movement-types, warehouse-access, movements...) | `pos.module.ts` 24 ta boshqa controllerni ro'yxatga oladi, lekin `PosController` ni EMAS. Faqat `metadata.ts` (Swagger auto-gen) da uchraydi. **Tavsiya: o'chirish yoki ro'yxatga olish.** |

> **Tekshiruv usuli:** 364 controller klassi `controllers:` massiviga kiruvchi barcha module + providers barrel fayllarda qidirildi → 362 ro'yxatda, 2 orphan.

---

## 8. RAW SQL / XAVFSIZLIK (controller darajasi)

| Tekshiruv | Natija |
|---|---|
| Controller ichida `sql.raw(o'zgaruvchi)` | **0** — yo'q |
| Controller ichida to'g'ridan `this.db.*` | **0** — transport qatlami toza (Qoida 15 OK) |
| `sql\`` template / `db.execute` ishlatadigan controllerlar | 12 (hammasi parametrli `sql\`${...}\`` — xavfsiz): cc-documents, cc-public, cc-webhook, hr-employee-goals, hr-questionnaire, kanban-cards, qc-reclamations, 5×wms-gateway-* |
| Butun `src` da `sql.raw(` | 26 ta — **hammasi himoyalangan**: DDL-migration helperlar (`ddlRun` + `DDL_PREFIX_RE` guard, `schema.ts:114-120`), yoki yopiq whitelist (`compare-periods.tool.ts:78` — `meta.table` ALLOWED dict'dan, sanalar regex+parametrli) |

**Eski CLAUDE.md flag'lari tuzatilgan:**
- `legacy.service.ts:27` — endi izoh: `SECURITY: PA-S4a — historic sql.raw(rawQuery) pass-through has been [removed]`
- `admin-auth.controller.ts:33` (noto'g'ri JWT secret) — endi `JWT_REFRESH_SECRET` `getOrThrow` bilan (`general/.../admin-auth.controller.ts:45`) — **lekin bu controller o'zi orphan/dead**

> **Xulosa:** Request-payload'dan controller orqali kelib chiqadigan **SQL injection yuzasi amalda yopiq.**

---

## 9. NIMA FUNKSIONAL, NIMA YO'Q (3 toifa bo'yicha umumlashma)

### ✅ ISHLAYDI (REAL — 2683, ≈90.6%)
- To'liq ishlaydigan modullar (100%): **sd, chat, ecommerce, mro, notifications, pos-v2, export, order-workflow, core, bot-gateway**
- Deyarli to'liq (95%+): crm (98%), director (99%), erp (99%), agents (98%), mes (98%), kanban (95%), pos (95%), communication-center (97%)
- Phase 4 order→department fan-out spine (memory tasdig'i) REAL; CRM lead→deal REAL; finance GL/AR/AP real DB insert; HR payroll compute REAL

### 🟡 QISMAN-STUB (PARTIAL/aralash — 5 haqiqiy PARTIAL + stub-aralash modullar)
- `logistics/:id/complete` (event-only, persist yo'q)
- `compatibility/*/v2` (41 ta) — texnik jihatdan REAL, lekin migration-TODO izohli ACL-wrapperlar (kelajakda kanonik route ga ko'chiriladi)
- Aralash modullar: iot (81% — tablet PWA yarmi 501), wms (83% — barcode/integration 501)

### ❌ YO'Q-BUZUQ (STUB — 274, ≈9.2%)
- **Atayin stub-controller:** marketing-analytics-stubs (32) — exhibitions, PR, AB-test, inbox, settings, ai-generate
- **Dashboard 501-to'plamlari:** hr-dashboard (18), mm-dashboard (17), integration-employee (10), security (8), wms-barcode (8)
- **⚠ Xavfli soxta-create (14):** payments/design-orders/vacancies/materials/routing — DB ga yozmaydi (4.2-bo'lim)
- **O'lik route (23):** AdminAuthController + PosController (7-bo'lim)

---

## 10. TAVSIYALAR (ustuvorlik bilan)

1. **🔴 DARHOL — 14 ta STUB-FAKE-CREATE** (4.2): bular sukutda ma'lumot yo'qotadi. Yo real DB insert qo'shing, yo `notImplemented()` ga o'tkazing (Qoida 10/17). Eng kritiki: `POST /api/finance/payments`, `POST /api/inventory/materials`, `POST /api/hr/recruitment/vacancies`.
2. **🟠 O'lik kod tozalash:** 2 orphan controller (`AdminAuthController` ×2 nusxa, `PosController` 19 route) — o'chiring yoki ro'yxatga oling. 7 ta izohga olingan duplikat-eslatmani ham tozalash mumkin.
3. **🟠 Eng zaif modullarni to'ldirish:** marketing (32 stub), mm-dashboard (17), iot-tablet PWA (14), security (8). Bu FE sahifalar uchun ko'rinadigan "ishlamaydi" effekti beradi.
4. **🟡 `compatibility/*/v2` (41):** kanonik route'larga ko'chirilgach o'chiring (texnik qarz, lekin funksional).
5. **Hujjat yangilash:** CLAUDE.md dagi "~50 soxta javob", "FAIL: 678/143", "22 stub route" raqamlari eskirgan — bu tahlil aniq joriy holatni beradi (274 stub, 0 runtime dup, 0 xavfli raw SQL controllerda).

---

## Ilova — Tahlil metodologiyasi va aniqlik

- **Body capture:** brace-balanced, string/comment-aware; `@ApiResponse({schema:{...}})` katta JSDoc bloklari to'g'ri o'tkazib yuborildi (sigLine paren-balance bilan aniqlandi).
- **Izoh filtri:** blok-izoh (`/* */`) va satr-izoh (`//`, `*`) ichidagi `@Get/@Post...` matnlari chiqarib tashlandi → 7 ta soxta endpoint olib tashlandi (2968 → 2961).
- **@Public:** metod-darajali VA klass-darajali (`@Controller` ustidagi `@Public`) — har ikkisi hisobga olindi (37 ta).
- **Qo'lda validatsiya:** 60+ endpoint tanasi to'g'ridan o'qib tasdiqlandi (sd-customers, ai, iot-tablet, mini-app, marketing-stubs, validate, storage, compatibility/v2, finance fake-create va h.k.).
- **DB:** `node _audit/q.cjs` orqali `europrint`@127.0.0.1 ulanish tasdiqlandi (`current_database()=europrint, user=postgres`).
- **Cheklov:** Bu STATIK tahlil. "REAL" = handler DB/servisga ulangan degani; jonli DB jadval mavjudligi yoki 503 qaytarish-qaytarmasligi alohida tekshiruv talab qiladi (memory: ba'zi REAL endpointlar drift tufayli 503 berishi mumkin, masalan CRP efficiency_rate). Funksional % = "kod ulangan", "jonli 200 qaytaradi" emas.
