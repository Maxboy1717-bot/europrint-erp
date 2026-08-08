# Ombor (WMS) + POS Monitor — To'liq Modul Tahlili

> **Sana:** 2026-07-10
> **Rol:** 🔵 Tahlilchi (Qoida 23 — read-only). Hech bir kod/konfig fayli o'zgartirilmadi. DB'ga faqat `SELECT` va `BEGIN…ROLLBACK` sinovlari yuborildi.
> **Qamrov:** FE ombor sahifalari · POS Monitor tablet sub-app · BE `modules/wms` (28 controller) · BE `modules/pos` (28 controller) · ma'lumot qatlami (jadval/VIEW/yozuvchi) · FE↔BE shartnoma.
> **Metod:** marshrut + endpoint inventari dasturiy yig'ildi → 6 ta mustaqil agent chuqur o'qidi → **har bir bosh da'vo qayta tekshirildi** (Q-29 verify-don't-trust). Bir nechta agent da'vosi rad etildi — quyida belgilangan.

---

## 0. Arxitektura — ikki modul ataylab ajratilgan

Sidebar manbasida aniq yozilgan (`components/sidebar/constants.ts:323`):

> *"Arxitektura: ERP = ko'rish/nazorat; amaliyot (kirim/chiqim/qabul) = POS Monitor."*

Ombor sidebar klasteri (`constants.ts:321-341`) shu bo'yicha 4 bo'limga bo'lingan:

| Bo'lim | Yozuvlar |
|---|---|
| **NAZORAT (ERP)** | Moliya nazorati · Omborlar · Tayyor mahsulot ombori · Import yo'lda kuzatuv · Xarid so'rovi (P2P) |
| **AMALIYOT** | **POS Monitor (kirim/chiqim)** — `pos-monitor` |
| **INVENTAR / HISOBOT** | Inventarizatsiya · Tafovut tasdiqlash · Qabul akti (GRN) · Reservation Panel · Material 360° · Tayyor mahsulot ijara |
| **SOZLAMALAR** | Ombor sozlamalari |

**Xulosa:** WMS va POS Monitor bir-birining dublikati EMAS — biri nazorat/hisobot, ikkinchisi zavod ombori amaliyoti (tablet). Lekin **backend darajasida** ikkalasi bir xil domenlar uchun parallel endpoint oilalarini saqlaydi (§5.3).

**Mount:** `App.tsx:95` — `/pos-monitor` bilan boshlanadigan har qanday yo'l `PrivateRoute` va `AppShell`dan **oldin** ushlanadi va `PosMonitorApp` render qilinadi. Ya'ni sub-app umumiy ERP qobig'idan tashqarida yashaydi.

---

## 1. Raqamlar

| O'lchov | Qiymat |
|---|---|
| Ombor/POS qamrovidagi FE marshrut | 62 (24 sidebar'da, 32 orphan, 4 dinamik) |
| Ombor FE sahifasi (chuqur o'qilgan) | 43 |
| POS Monitor ekrani | 27 (+1 legacy sahifa) |
| BE controller (wms) | 28 — **28/28 ro'yxatdan o'tgan** |
| BE controller (pos) | 28 registered + 1 **o'lik** |
| BE endpoint (ombor/POS qamrovi) | 436 |
| FE API chaqiruv joyi | 323 (70 fayl) |
| FE'da matn-mosligi topilmagan BE endpoint | 240 → shundan **~123 haqiqatan o'lik**, ~117 typed-klient orqali jonli |
| FE→BE haqiqiy siniq chaqiruv | **1** (15 shubhadan) |
| Global guard | 5 × `APP_GUARD` (`app.module.ts:195-199`) |

---

## 2. ⭐ Kritik topilmalar (hammasi shaxsan tasdiqlangan)

### P0-1 — POS Monitor WebSocket qatlami butunlay ishlamaydi

FE (`pos-monitor/socket/pos-socket.ts:16-22`) faqat cookie'ga tayanadi (`withCredentials: true`), izohda ham shunday deyilgan: *"alohida pos_session token YO'Q… cookie orqali same-origin autentifikatsiya"*.

BE (`pos.gateway.ts:43-51`) `extractToken()` esa **faqat** `handshake.auth.token` va `handshake.query.token` ni o'qiydi — cookie'ni umuman parse qilmaydi. Natija `pos.gateway.ts:84-90`:

```
const token = extractToken(client);
if (!token) { logger.warn('Rejected unauthenticated connection'); client.disconnect(true); return; }
```

**Har bir POS socket ulanishi rad etiladi.** Real-time bildirishnoma, harakat yangilanishi, GL xabari — hech biri yetib bormaydi. `usePOSSocket` hech qachon ishga tushmaydi.

Ustiga, agar auth tuzatilsa ham **8 ta FE listener'dan faqat 3 tasi** haqiqiy emitter'ga to'g'ri keladi:

| FE tinglaydi | BE emit qiladimi |
|---|---|
| `movement.created` | ✅ `pos.events.ts:63` |
| `gl.posted` | ✅ `pos.events.ts:138` |
| `notification.new` | ✅ `pos-notifications.service.ts:161` |
| `movement.status_changed` | ❌ BE `movement.confirmed` chiqaradi |
| `stock.low_alert` | ❌ BE `stock.alert` chiqaradi |
| `warehouse.stock.updated` | ❌ hech qachon chiqarilmaydi |
| `quarantine.expired` | ❌ hech qachon chiqarilmaydi |
| `requisition.approved` | ❌ faqat ichki `eventEmitter`, socket'ga uzatilmaydi |

### P0-2 — `PATCH /pos/requests/:id/submit` mavjud emas → foydalanuvchi yo'lida 404

FE: `pos-monitor/api/pos-monitor.api.ts:317` → `RequisitionDetail.tsx:69` ("qoralamani yuborish" tugmasi).
BE `requests.controller.ts`: `@Get()`, `@Get(':id')`, `@Post()`, `@Patch('approve')`, `@Patch('reject')`, `@Post('issue')` — **`:id/submit` yo'q**.

### P0-3 — `POST /api/warehouse-rental/recalculate` → 404, va sababi ibratli

FE: `WarehouseRental.tsx:93` mutация + `:123` "Qayta hisoblash" tugmasi (sidebar'dagi `/wms/rental` sahifasida).
BE `warehouse-rental.controller.ts:115-118` — endpoint 2026-06-05 da o'chirilgan, izohi:

> *"green-lie retire: `POST /api/warehouse-rental/recalculate` returned {success:true} and recomputed NOTHING… **No FE caller** (WarehouseRental page has no recalculate call)."*

Izohdagi asos **noto'g'ri**: FE chaqiruv ham, tugma ham bor edi va hozir ham bor. Soxta-javob ("yashil yolg'on") to'g'ri olib tashlangan, lekin FE tomoni qoldirilgan → endi tugma 404 beradi.

### P0-4 — Ijara yozuvlari jadvali doim bo'sh ko'rinadi (javob-shakli nomuvofiqligi)

BE `warehouse-rental.controller.ts:44-47`: `return { items, total: items.length }`
FE `WarehouseRental.tsx:102`: `const records = recordsData?.records ?? []`

`.records` hech qachon mavjud emas → **sidebar'dagi `/wms/rental` sahifasi ma'lumot bo'lsa ham bo'sh jadval ko'rsatadi**. (`queryClient.ts:81-90` dagi `safeArray` to'ri `records` kalitini biladi, lekin bu sahifa undan foydalanmaydi.)

### P1-5 — GL: kanonik `entries` mirror atomik emas

`auto-gl-posting.repository.ts:120` — POS subledger (`pos_gl_postings`) yozuvi **to'liq atomik** (`db.transaction` + tx ichida idempotentlik tekshiruvi).

`auto-gl-posting.service.ts:148-162` — kanonik `entries` ledgeriga mirror **subledger tranzaksiyasidan keyin**, alohida chaqiruvda bajariladi va xatolik faqat `logger.warn` bilan yutiladi:

```
if (!glR.ok) { this.logger.warn(`[AutoGL] Kanonik entries yozuvi muvaffaqiyatsiz…`); }
```

Kod izohi buni ataylab ("best-effort") deb belgilaydi. Natija: `pos_gl_postings` da qator bo'lib, `entries` da mos qator bo'lmasligi mumkin → **ikki ledger vaqt o'tib ajralib ketadi**.

Ijobiy tomoni: POS **kanonik `entries`** ga yozadi (`gl_entries` yoki `gl_journal_entries`+`gl_lines` ga emas) — bu loyihaning GL kanonini hurmat qiladi.

### P1-6 — Xom mahsulot qabuli (goods-receipt) GL yozmaydi va atomik emas

`GlPostingService.postGoodsReceipt` (`gl-posting.service.ts:63`, Dr Inventory / Cr AP) mavjud, lekin **hech kim chaqirmaydi** — faqat izohlarda tilga olinadi.

`drizzle-mm-goods.repo.ts:43-44` — stock UPSERT va status yangilash **ikki alohida `await`**, bitta tranzaksiyada emas.

Taqqoslash uchun: **goods-issue** (chiqim) zanjiri to'liq — bitta tranzaksiyada stock kamayadi + ledger yoziladi, keyin `WmsGoodsIssuedListener` `entries` ga GL joylaydi. **FG qabuli** ham atomik (`drizzle-wms.repo.ts:235`), lekin inventar GL legi yo'q (faqat ijara taymeri).

### P1-7 — Ikkita raqobatchi "inventarizatsiya yaratish", biri har doim xato beradi

| Implementatsiya | Holat |
|---|---|
| `POST /api/warehouse/inventory-counts` (`wms-gateway-inventory.controller.ts:147`) | ✅ **To'g'ri** — `count_number` generatsiya qiladi, `count_date` ni `'YYYY-MM-DD'` matn sifatida yozadi. Sidebar sahifasi (`/wms/inventory`) shuni ishlatadi. |
| `POST /api/wms/inventory-counts` (`wms-counts.repository.ts:35`) | ❌ **Har doim xato** — `count_number` (NOT NULL, default yo'q) yozilmaydi va `count_date` ga `NOW()` beriladi |

**DB-isbot** (jonli `europrint`, `BEGIN…ROLLBACK`, hech narsa saqlanmadi):

```
INSERT (count_number siz) -> XATO: значение не умещается в тип character varying(10)
UPDATE deleted_at         -> XATO: столбец "deleted_at" ... не существует
```

Sabab aniq: `inventory_counts.count_date` = **`varchar(10)`** (sana matn sifatida), `NOW()` esa ~29 belgi. Yonidagi `softDeleteInventoryCount` (`wms-crud.repository.ts:142`) `deleted_at`/`deleted_by` ustunlariga yozadi — bu ustunlar `inventory_counts` da **umuman yo'q**.

**Yumshatuvchi holat:** bu buzuq juftlik `lib/api/wms.ts:10,78` da o'ralgan, lekin **hech bir sahifa chaqirmaydi** → o'lik-va-buzuq kod, foydalanuvchi yo'lida emas. (Bu men agentning "runtime'da yiqiladi" da'vosiga qo'shgan aniqlashtirishim.)

### P1-8 — `warehouse_stock` jonli DB'da FK himoyasiz

Jonli DB so'rovi (`information_schema.table_constraints`) faqat bitta FK topdi:

```
warehouse_stock_bin_location_id_fkey → bin_location_id
```

Sxemada e'lon qilingan `warehouse_id → warehouses` va `material_id → material_cards` FK'lari **jonli bazada yo'q**. Oqibati: kontaminatsiya gardi (FG id'si xom jadvalga tushmasligi) faqat **ilova kodida** yashaydi.

Kontaminatsiya gardining o'zi to'g'ri yozilgan: `qc-passed.listener.ts:113-150` va `qc-failed-fg.listener.ts:122-159` FG'ni **faqat `product_id`** bo'yicha kalitlaydi, `material_id` ga `COALESCE` fallback yo'q. FG jadvali esa `product_id → products` FK bilan strukturaviy himoyalangan (`warehouse-stock-fg-split-2026-07-09.sql:23`, jonli DB'da mavjud). Ya'ni **FG tomoni himoyalangan, xom tomoni emas.**

### P2-9 — O'lik BE kod

| Nima | Isbot |
|---|---|
| `pos.controller.ts` (`@Controller('legacy/pos')`) | Hech bir modulda ro'yxatdan o'tmagan → 0 jonli route |
| `logistics.controller.ts` (5 route) | FE `/api/logistics/*` ni **hech qachon** chaqirmaydi; `LogisticsDashboard` `/api/mm/fleet/*` ishlatadi |
| `barcode-warehouse.controller.ts` — 28 route'dan **25 tasi** | FE faqat 3 tasini chaqiradi (`production-receive`, `cycle-count`, `operator-balance/:id/resolve` — `lib/api/wms.ts:59-63`) |
| `wms-integration.controller.ts:100-136` | 6 × `notImplemented()` → HTTP 501, FE chaqiruvchisi yo'q |
| POS Monitor klientidagi o'lik eksportlar | `inTransitApi`, P1 `materialLifeApi`, P1 `varianceApi`, `syncApi.push/pull`, `handoversApi.getPallets`, `requestsApi.fulfill` — noto'g'ri URL yoki chaqiruvchisiz. `pos-wms-extra.api.ts:7-18` izohi buzuqligini o'zi tan oladi, lekin eski versiya o'chirilmagan (Q-46 buzilishi) |

---

## 3. Rad etilgan da'volar (soxta-pozitivlar)

Bu bo'lim ataylab kiritildi — tekshirmasdan qabul qilinsa, xato ish paketlari tug'iladi.

| Da'vo | Haqiqat |
|---|---|
| «`pos/mini-app` butunlay `@Public()` → ochiq teshik» | **Rad etildi.** 9 route ham, jumladan 4 mutatsiya, `resolveSession()` bilan Telegram sessiya-tokenini tekshiradi (`mini-app.controller.ts:113,121,129,137,147`; `mini-app-history.controller.ts:43,53,61`). `approve`/`reject` qo'shimcha `assertCanManageRequest()` bilan bo'lim-darajasida cheklangan. Faqat `POST /auth` ochiq — login endpoint uchun normal. Kompensatsiya to'liq. |
| «`/barcode-warehouse/*` butunlay o'lik» | **Qisman rad etildi.** 3 route jonli (`lib/api/wms.ts:59-63`). O'lik — 25 tasi, hammasi emas. |
| «`LogisticsDashboard` mock/placeholder» | **Rad etildi.** Real `useQuery`: `/api/mm/fleet/vehicles`, `/fuel-logs`, `/maintenance`, `/deliveries`, `/api/mm/vehicles/locations`. Hardcoded massiv yo'q. O'lik bo'lgani — BE `logistics` controller'i, sahifa emas. |
| «240 BE endpoint o'lik» | **Rad etildi.** Skript faqat literal URL satrini ko'radi. ~117 tasi `BASE` konstanta / template orqali jonli (POS tablet klienti, `lib/api/*`). Haqiqatan o'lik — ~123. |
| «15 ta FE→BE siniq chaqiruv» | **Rad etildi.** 14 tasi regex artefakti (base-konstanta, template param, query-string). Haqiqiy siniq — **1 ta** (`/warehouse-rental/recalculate`). |
| «`POST /api/wms/inventory-counts` runtime'da yiqiladi» | **Tasdiqlandi, lekin aniqlashtirildi.** Sabab agent aytgan `count_number NOT NULL` emas — asosiy sabab `count_date varchar(10)` ga `NOW()` yozilishi. Va bu endpoint hech bir sahifadan chaqirilmaydi. |
| «`kanban-ext.controller.ts` o'lik controller» (oldingi audit) | Bu tahlil qamrovida emas, lekin oldingi hisobotda tekshirilgan: re-export barreli, o'lik emas. |

---

## 4. Frontend — Ombor sahifalari

**Kanonik (sidebar'dan ochiladigan) 13 WMS sahifa:** `/wms/overview`, `/wms/warehouses`, `/warehouse/finished-goods`, `/wms/in-transit`, `/wms/procurement`, `/wms/inventory`, `/wms/variance-approval`, `/wms/grn`, `/wms/reservation`, `/inventory/materials`, `/wms/rental`, `/wms/settings` (+ `pos-monitor`). Tashqi lekin jonli: `/iot/daily-view`, `/accounting/materials`, `/accounting/inventory-valuation`.

**Orphan (faqat URL yozib kirish mumkin) — 32 marshrut.** Eng muhimlari:

| Sahifa | Muammo |
|---|---|
| `/wms/dashboard` (WMSDashboard) | `/wms/overview` ning dublikati. O'rnini bosgan sahifaning izohi uni "eski rasvo" deb ataydi (`WarehouseDashboardPage.tsx:5`) |
| `/wms/material/360/:id` (WarehouseMaterial360, 817 qator) | `/inventory/materials/:id` dagi 360° ko'rinishning dublikati, boshqa endpoint oilasi bilan |
| `/wms/kpi-hub` | Sidebar'siz; ustiga `navigate("/warehouse/hub/${code}")` (`:143`) — **mavjud bo'lmagan marshrut** |
| `/warehouse/goods-receiving`, `/warehouse/reservations`, `/warehouse/inventory-count` | Sidebar'dagi `/wms/*` bilan bir xil komponent — ortiqcha alias yo'llar |

**Sifat bayroqlari:**
- `WarehouseKirimWizard.tsx:143`, `WarehouseQCReview.tsx:91`, `WarehouseQuarantine.tsx:54-61` — native `alert()` / `confirm()` / `prompt()` ishlatadi, EP dialoglari o'rniga (Qoida 14/41 ruhiga zid)
- `WarehouseBarcodeQueue.tsx:42-49` — klient tomonda **N+1** (har harakat uchun alohida so'rov); `printSelected()` (`:90-96`) faqat `alert()` chiqaradi, hech narsa saqlamaydi → **yagona tasdiqlangan "saqlamaydigan tugma"** (Q-43)
- `useReservationMutations.ts:53,63` · `WarehouseMaterialKits.tsx:57,67` · `WarehouseDailyView.tsx:66` — `useMutation` da `onError` yo'q (F2)
- `WarehouseKpiHub.tsx:55-57`, `EmployeeInventory.tsx:38-39` — xatolar `.catch(() => [])` bilan jimgina yutiladi
- `WarehouseReportsAllTypes.ts:43,105,110` — "FIFO Qarilik", "Ta'minotchi Reytingi", "Label Tarixi" **uchalasi ham** `/reports/top-materials` yuklaydi (Q-40: ishlaydi ≠ to'g'ri)

**Tayyor mahsulot ajratmasi (Batch-3) — FE tomonda TO'G'RI.** FG'ni faqat bitta sahifa o'qiydi: `/warehouse/finished-goods` (`FinishedGoodsStock.tsx:30` → `/api/pos/warehouse-config/finished-goods-stock`). Qolgan 42 sahifaning hech biri `warehouse_stock_fg` ga tegmaydi. Aralashuv yo'q.

**Bitta entity — ko'p endpoint oilasi (parchalanish ildizi):**

| Entity | Nechta oila |
|---|---|
| Material katalogi | **5** — `/api/inventory/materials`, `/api/warehouse/materials`, `/api/material-cards`, `/api/raw-materials`, `/api/pos/wms/materials` |
| Stok/balans | **6** — `/api/pos/warehouse-config/…`, `/api/warehouse/stock`, `/api/wms/stock`, `/api/material-balance/*`, `/api/wms/material-life`, `/api/pos/warehouse-config/finished-goods-stock` |
| Ombor masteri | **3** — `/api/pos/warehouse-config/warehouses`, `/api/warehouse/warehouses`, `/api/pos/wms/warehouses` |
| Material 360° | **2** — `/api/inventory/materials/:id/360-card` vs `/api/pos/wh-features/material/:id/profile` |
| Inventarizatsiya | **2** — `/api/warehouse/inventory-counts` vs `/api/wms/inventory-counts` |
| Ijara | **2** — `/api/warehouse-rental/*` vs `/api/wms/rental/*` |
| Dashboard/KPI | **3** — `/api/pos/warehouse-config/dashboard`, `/api/warehouse/dashboard/*`, `/api/pos/wh-features/kpi/*` |

Arxitektura darajasida bu **ikki dunyo**: `react-query` + `/api/warehouse/*`&`/api/wms/*` dunyosi va xom `apiRequest` + `/api/pos/*` dunyosi yonma-yon yashaydi.

---

## 5. POS Monitor sub-app

### 5.1 Ekranlar (27 + 1 legacy)

Barcha kontent marshrutlari `AuthGuard` (yoki `/admin` uchun `AdminGuard`) bilan o'ralgan (`PosMonitorApp.tsx:62-88`). Autentifikatsiyasiz hech bir ekran ochilmaydi (klient tomonda; haqiqiy himoya — BE cookie-auth).

Asosiy oqimlar: `PosMovementKirim` (barcode-gen + karantin passporti + QC + GL + PDF), `PosMovementChiqim` (skaner-gated, rezervatsiya blokli), `PosPresKirim` (press kg→barcode→ichki kirim), `PosInventory` (inventarizatsiya + tafovut konfig + muzlatilgan zonalar), `PosHandovers` (2-imzoli smena topshirig'i), `PosMyInventory` (xodim javobgarligi), `PosQuarantine`/`PosQCReview`, `PosReports`, `PosAdmin` (sync/printer/GL tasdiq).

### 5.2 Infratuzilma

| Komponent | Holat |
|---|---|
| `useOfflineSync.ts` — offline navbat | ✅ **Haqiqiy IndexedDB** (`pos_monitor_offline` v2): `queue` + `materials_cache` + `stock_cache`. `online` hodisasida real `movementsApi.create` / `requestsApi.create` orqali qayta yuboradi; 409 → konflikt modali; <3 urinish |
| `useHardwareScanner.ts` | ✅ Klaviatura-wedge va WebHID ishlaydi. Web Serial — faqat juftlashtiradi, oqimni o'qimaydi (`:186-188`) |
| `lib/pos-print.ts`, `lib/telegram.ts` | ✅ Ishlaydi |
| `usePOSSocket.ts` + `pos-socket.ts` | ❌ **Butunlay inert** — P0-1 ga qarang |

### 5.3 Legacy sirt

`pages/PosMonitorPage.tsx` (892 qator) ikki marshrutdan ochiladi: `/pos-monitor/legacy-main` (`PosMonitorApp.tsx:128`) va `/wms/pos-monitor` (`WarehouseRoutes.tsx:61`). Funksional jihatdan yangi Kirim/Chiqim oqimlarini takrorlaydi, lekin **butunlay boshqa endpoint to'plami** ustida ishlaydi (`/pos/operations/*` vs yangi `/pos/movements` + `/pos/stock`). Ya'ni haqiqiy legacy dublikat, ikkita jonli marshrut bilan ushlab turilgan.

---

## 6. Backend

### 6.1 Ro'yxatga olish va himoya

`WmsModule` → `app.module.ts:132`. `PosModule` → `app.module.ts:154`. Ikkalasi ham bir marta.
28/28 WMS controller ro'yxatda; POS'da 28 registered + 1 o'lik (`pos.controller.ts`).

**5 ta global guard** (`app.module.ts:195-199`): `FastifyThrottlerGuard`, `JwtAuthGuard`, `RolesGuard`, `SodGuard`, `PermissionGuard`. Shuning uchun class-darajasidagi dekorator yo'qligi ochiq teshik degani emas.

Yagona harfma-harf Qoida-8 buzilishi: `WmsExtendedController` (`wms-extended.controller.ts:44`) da na `@UseGuards`, na `@Public()` bor — amalda global guard himoyalaydi, yozuv metodlarida `@Roles` ham bor.

### 6.2 POS ↔ WMS ustma-ustligi

| Mas'uliyat | POS controller | WMS ekvivalenti |
|---|---|---|
| Harakat / chiqim | `Movements`, `PosOperations`, `StockIssuable` | `/wms/goods-issue`, `/wms/movements` |
| Stok so'rovi / kam-qoldiq | `Stock`, `PosWms`, `WarehouseConfig` | `/wms/stock`, `/wms/low-stock` |
| Inventarizatsiya / tafovut | `InventoryCount` (10 route) | `/wms/inventory-counts`, `/wms/count-lines`, `/wms/freeze-zones` |
| Barcode | `Barcode` (7 route) | `/wms/barcode/scan` |
| So'rovlar | `Procurement`, `Requests` | `/wms/internal-requests` |

POS'ga **xos** (dublikat emas): xodim javobgarlik ledgeri, smena topshirig'i, Telegram mini-app, GL subledger, material normalari, tablet auth/sync.

### 6.3 Qoida buzilishlari

| Qoida | Joy | Izoh |
|---|---|---|
| 6 (controller = transport) | `wms-catalog.controller.ts:158,179` | Controller ichida to'g'ridan `db.execute` |
| 6 | `pos-stub.controller.ts:85-91` | Controller ichida `INSERT INTO pos_stock_ledger` + xato jimgina yutiladi (`catch (_e) {}`) |
| 6 + N+1 | `pos-operations.controller.ts:77-83` | Har ombor uchun alohida so'rov halqasi |
| 15 (service'da `db.*` yo'q) | `procurement-request.service.ts:171`, `warehouse-config.service.ts:210` | To'g'ridan `db.transaction` |
| 17 (`notImplemented` taqiq) | `wms-integration.controller.ts:100-136` | 6 ta — halol 501, lekin qoida buzilgan |
| B (`sql.raw(o'zgaruvchi)`) | `supplier-rating.repository.ts:210` | `Math.trunc()` bilan butun songa keltirilgan → inyeksiya yo'q, faqat pattern-hidi |

Ijobiy: POS modulida `return { ok: true }`, `notImplemented`, `sql.raw(variable)` **umuman yo'q**. Result pattern ikkala modulda ham amalda saqlangan.

---

## 7. Ma'lumot qatlami

### 7.1 Kanonik vs dublikat

| Tushuncha | Kanonik (yozuvchisi bor) | Dublikat (yozuvchisiz) |
|---|---|---|
| Xom qoldiq | **`warehouse_stock`** (39 qator) | `stocks`, `wms_stock`, `wms_stock_levels`, `wms_stock_batches`, `wms_inventory` |
| Tayyor mahsulot | **`warehouse_stock_fg`** (yozuvchilar ulangan) | — (toza, yangi ajratma) |
| Harakat ledgeri | **`wms_transactions`** | `stock_moves` (0 qator, yozuvchisiz), `pos_movements_legacy/_archive` |
| Stock→GL log | `stock_movement_gl_postings` | `stock_gl_postings` — sof dublikat (ikkalasi ham bo'sh, faol yo'lda emas) |
| Inventarizatsiya | **`inventory_counts`** (17 qator) | `pos_inventory_counts` (VIEW), sxemada 2 marta qayta e'lon |

### 7.2 VIEW ustidan yozish

Jonli DB tasdig'i:

| Obyekt | Turi |
|---|---|
| `warehouse_stock` | BASE TABLE |
| `warehouse_stock_fg` | BASE TABLE |
| `current_stock` | **VIEW** (`warehouse_stock` ustidan) |
| `wms_inventory_counts` | **VIEW** (`inventory_counts` ustidan) |

`current_stock` ga hech kim yozmaydi — yaxshi. `wms_inventory_counts` VIEW'iga esa **yoziladi** (`wms-counts.repository.ts:36`, `wms-crud.repository.ts:142`) — VIEW auto-updatable bo'lgani uchun texnik jihatdan ruxsat, lekin ikkala yozuv ham buzuq (P1-7).

### 7.3 Oltin zanjir

| Zanjir | Holat |
|---|---|
| Chiqim (goods-issue) → stock ↓ → ledger → GL `entries` | ✅ **To'liq**, bitta tranzaksiyada + `WmsGoodsIssuedListener` |
| FG qabul → `warehouse_stock_fg` ↑ → ledger | ✅ Atomik (`drizzle-wms.repo.ts:235`), lekin **inventar GL legi yo'q** (faqat ijara taymeri) |
| Xom qabul (goods-receipt) → stock ↑ → GL | ❌ **Uzilgan** — GL yo'q, event yo'q, atomik emas (P1-6) |

---

## 8. Ishonch darajasi

### Yuqori — men shaxsan `file:line` yoki DB so'rovi bilan tasdiqladim

- P0-1 socket auth nomuvofiqligi (`pos-socket.ts:16-22` ↔ `pos.gateway.ts:43-51,84-90`)
- P0-2 `PATCH /pos/requests/:id/submit` yo'qligi (`requests.controller.ts` route ro'yxati)
- P0-3 `/warehouse-rental/recalculate` 404 + BE izohidagi noto'g'ri asos (`:115-118`)
- P0-4 `records` vs `{items,total}` (`:44-47` ↔ `WarehouseRental.tsx:102`)
- P1-5 GL mirror atomik emasligi (`auto-gl-posting.service.ts:148-162`)
- P1-7 ikkala buzuq yozuv — **jonli DB'da `BEGIN…ROLLBACK` bilan xato ko'rsatildi**, sabab `count_date varchar(10)`
- P1-8 `warehouse_stock` da yagona FK (`information_schema.table_constraints` so'rovi)
- P2-9 `pos.controller.ts` ro'yxatda yo'qligi, `logistics` controller FE'da chaqirilmasligi, `barcode-warehouse` dan 3/28 jonli
- Global 5 guard (`app.module.ts:195-199`)
- `pos/mini-app` kompensatsiyasi (9 route ham `resolveSession`)
- Sidebar arxitektura izohi (`constants.ts:323`)

### O'rta — agent hisobotidan, men tanlab tekshirdim

- FE sahifalar jadvali (43 sahifa) — 12 tasini spot-tekshirdim
- POS Monitor ekranlar jadvali (27) — mount, guard, offline sync, socket tekshirildi
- Qoida buzilishlari ro'yxati (Qoida 6/15/17/B)
- Endpoint oilalari parchalanishi

### Tekshirilmagan

- **MM va Logistics sahifalari** (`/mm/vendors`, `/mm/purchase-orders`, `/mm/dashboard`, `MMExtended` 3 route, `LogisticsDashboard` 7 route) — chuqur o'qilmadi. Faqat `LogisticsDashboard` ning mock emasligi tasdiqlandi.
- **`WarehouseRental` sub-fayllari** (`WarehouseRentalDialogs.tsx`, `WarehouseRentalSettings.tsx`) — saqlash yo'llari tekshirilmadi.
- **BE entity tengligi**: `/api/warehouse/materials` va `/api/inventory/materials` aynan bir jadvalgami; `/api/warehouse/stock` va `/api/wms/stock` bir manbagami — controller→repo→jadval zanjiri to'liq kuzatilmadi.
- **Semantik "echo" fake'lar**: faqat aniq imzo (`notImplemented`, `{ok:true}`, `{data:[]}`) qidirildi. Jonli endpoint ichida noto'g'ri hisoblangan qiymat qaytarilishi mumkin — bu per-service tekshiruv talab qiladi.
- **`QCExtended` uslubidagi dinamik endpointlar** — statik grep ko'rmaydi.
- Orphan aniqlash statik grep'ga tayanadi (`setLocation`/`href`/`<Link>`); o'zgaruvchi bilan qurilgan navigatsiya e'tibordan chetda qolishi mumkin → 32 raqami **yuqori chegara**.

---

## 9. Tavsiya qilingan ish paketlari

> Qoida 23: **tavsiya ≠ ruxsat**. Hech biri egasining aniq "ha, bajar" so'zisiz bajarilmaydi.

### Paket A — Foydalanuvchi ko'radigan siniqliklar (eng yuqori ustuvorlik)

| # | Ish | Fayl |
|---|---|---|
| 1 | Ijara jadvali bo'sh ko'rinishi | `WarehouseRental.tsx:102` — `.records` → `.items` |
| 2 | "Qayta hisoblash" tugmasi 404 | `WarehouseRental.tsx:93,123` — tugmani olib tashlash **yoki** BE endpointni spec bilan qaytarish (egasi qarori: formula qanday?) |
| 3 | Rekvizitsiya "yuborish" 404 | `pos-monitor/api/pos-monitor.api.ts:317` ↔ `requests.controller.ts` — BE'da `:id/submit` yo'q |

### Paket B — POS real-time qatlamini tiklash

| # | Ish | Fayl |
|---|---|---|
| 4 | Socket auth: BE cookie'ni o'qisin **yoki** FE `auth.token` yuborsin | `pos.gateway.ts:43-51` / `pos-socket.ts:16-22` |
| 5 | 5 ta mos kelmaydigan event nomini birlashtirish | `usePOSSocket.ts` ↔ `pos.events.ts`, `pos-secondary-events.handler.ts:94` |

### Paket C — Ma'lumot yaxlitligi (DB)

| # | Ish |
|---|---|
| 6 | `warehouse_stock` ga `warehouse_id` va `material_id` FK'larini qo'shish (migratsiya = **egasi ruxsati**, Q-35) |
| 7 | Xom goods-receipt'ni bitta tranzaksiyaga o'rash + `GlPostingService.postGoodsReceipt` ni ulash (`drizzle-mm-goods.repo.ts:43-44`) |
| 8 | GL mirror'ini atomik qilish yoki outbox'ga o'tkazish (`auto-gl-posting.service.ts:148`) |

### Paket D — O'lik va buzuq kodni olib tashlash (Q-46)

| Nima | Hajm |
|---|---|
| `pos.controller.ts` (ro'yxatda yo'q) | 1 fayl |
| `logistics.controller.ts` + moduli (FE chaqirmaydi) | 5 route |
| `barcode-warehouse.controller.ts` dan 25 o'lik route | 3 tasini saqlab qolish kerak |
| `wms-counts.repository.ts:35` + `wms-crud.repository.ts:142` buzuq juftlik va ular ustidagi 2 route | Yoki tuzatish, yoki o'chirish |
| POS klientidagi o'lik eksportlar: `inTransitApi`, P1 `materialLifeApi`, P1 `varianceApi`, `syncApi.push/pull`, `handoversApi.getPallets`, `requestsApi.fulfill` | `pos-monitor/api/*` |
| `WMSDashboard` (+`WMSDashboard{Types,Sections,Alerts,Dialogs}`), `WarehouseKpiHub`, `WarehouseMaterial360` (817 qator) | Orphan dublikatlar |

### Paket E — Sifat va izchillik

| # | Ish |
|---|---|
| 9 | Native `alert()`/`confirm()`/`prompt()` → EP dialoglari (`WarehouseKirimWizard.tsx:143`, `WarehouseQCReview.tsx:82,91`, `WarehouseQuarantine.tsx:54-61`) |
| 10 | `WarehouseBarcodeQueue.tsx:90-96` — "Print" tugmasi hech narsa saqlamaydi (Q-43); N+1 (`:42-49`) |
| 11 | 3 ta hisobot bitta endpointni yuklaydi (`WarehouseReportsAllTypes.ts:43,105,110`) — Q-40 |
| 12 | `onError` yo'q 5 ta mutation (F2) |
| 13 | Qoida 6/15 buzilishlari (`wms-catalog.controller.ts:158,179`; `pos-stub.controller.ts:85`; `procurement-request.service.ts:171`; `warehouse-config.service.ts:210`) |

### Paket F — Arxitektura (egasi qarori kerak)

| Savol |
|---|
| Material katalogi uchun **bitta** kanonik endpoint oilasi qaysi? (hozir 5 ta) |
| Stok o'qish uchun kanonik oila qaysi? (hozir 6 ta) |
| `/api/warehouse/inventory-counts` va `/api/wms/inventory-counts` — qaysi biri qoladi? |
| `PosMonitorPage` (legacy, 892 qator) — yangi Kirim/Chiqim oqimi bilan almashtirilsinmi? |
| `WarehouseMaterial360` va `/inventory/materials/:id` 360° — qaysi biri kanonik? |
| `/warehouse/hub` marshruti (CLAUDE.md Qoida 22 da kanonik deb yozilgan, kodda yo'q) — yaratilsinmi? |

---

*Hisobot 2026-07-10 da 🔵 Tahlilchi rolida tuzildi. Kod, konfiguratsiya, DB o'zgartirilmadi. Barcha bosh da'volar `fayl:qator` yoki jonli DB so'rovi bilan qo'llab-quvvatlangan; agentlarning 6 ta da'vosi tekshiruvda rad etildi (§3); tekshirilmagan joylar §8 da aniq belgilangan.*

---

## Ilova A — To'liq ro'yxatlar

### A1. Ombor/POS qamrovidagi FE marshrutlari (68)

| Yo'l | Sidebar | Komponent | Route fayl |
|---|---|---|---|
| `/accounting/inventory-valuation` | **YES** | InventoryValuation | `FinanceRoutes.tsx:54` |
| `/accounting/materials` | **YES** | MaterialsAccounting | `FinanceRoutes.tsx:48` |
| `/ai/wms` | NO | WmsAnalyticsPage | `StubRoutes.tsx:70` |
| `/integration/gl-posting` | NO | GLPostingMonitor | `AdminRoutes.tsx:54` |
| `/inventory/materials` | **YES** | WMSMaterials | `WarehouseRoutes.tsx:88` |
| `/inventory/materials/:id` | dyn | WMSMaterials | `WarehouseRoutes.tsx:89` |
| `/iot/material-kits` | NO | WarehouseMaterialKits | `ProductionRoutes.tsx:222` |
| `/logistics` | redir | LogisticsDashboard | `WarehouseRoutes.tsx:106` |
| `/logistics/drivers` | **YES** | LogisticsDashboard | `WarehouseRoutes.tsx:111` |
| `/logistics/fuel` | **YES** | LogisticsDashboard | `WarehouseRoutes.tsx:110` |
| `/logistics/gps` | **YES** | LogisticsDashboard | `WarehouseRoutes.tsx:109` |
| `/logistics/route-planning` | **YES** | LogisticsDashboard | `WarehouseRoutes.tsx:108` |
| `/logistics/transport` | **YES** | LogisticsDashboard | `WarehouseRoutes.tsx:107` |
| `/logistics/vehicle-schedule` | **YES** | LogisticsDashboard | `WarehouseRoutes.tsx:112` |
| `/material-cards` | NO | MaterialCardsPage | `StubRoutes.tsx:118` |
| `/mm/check-bot` | **YES** | MMExtended | `WarehouseRoutes.tsx:102` |
| `/mm/creditor-debts` | **YES** | MMExtended | `WarehouseRoutes.tsx:103` |
| `/mm/dashboard` | **YES** | MMDashboard | `WarehouseRoutes.tsx:101` |
| `/mm/purchase-orders` | **YES** | MMPurchaseOrders | `WarehouseRoutes.tsx:100` |
| `/mm/supplier-portal` | **YES** | MMExtended | `WarehouseRoutes.tsx:104` |
| `/mm/vendors` | **YES** | MMVendors | `WarehouseRoutes.tsx:99` |
| `/mro/building-inventory` | **YES** | FacilityInventoryPage | `ProductionRoutes.tsx:209` |
| `/mro/office-inventory` | **YES** | FacilityInventoryPage | `ProductionRoutes.tsx:206` |
| `/print/imposition` | NO | ImpositionCalculator | `ProductionRoutes.tsx:163` |
| `/raw-materials` | NO | RawMaterialsPage | `StubRoutes.tsx:128` |
| `/sd/warehouse-rental` | **YES** | SDExtended | `CRMRoutes.tsx:84` |
| `/tech/material-alternatives` | **YES** | TechPPExtended | `ProductionRoutes.tsx:119` |
| `/warehouse/barcodes` | NO | BarcodeSystem | `WarehouseRoutes.tsx:67` |
| `/warehouse/finished-goods` | **YES** | FinishedGoodsStockPage | `WarehouseRoutes.tsx:59` |
| `/warehouse/goods-receiving` | NO | GoodsReceiving | `WarehouseRoutes.tsx:64` |
| `/warehouse/inventory-count` | NO | InventoryCount | `WarehouseRoutes.tsx:63` |
| `/warehouse/reports` | NO | WarehouseReports | `WarehouseRoutes.tsx:66` |
| `/warehouse/reservations` | NO | StockReservation | `WarehouseRoutes.tsx:65` |
| `/warehouse/rolls` | NO | RollManagementPage | `DirectorRoutes.tsx:53` |
| `/wms/audit-log` | NO | WarehouseAuditLog | `WarehouseRoutes.tsx:85` |
| `/wms/barcodes-queue` | NO | WarehouseBarcodeQueue | `WarehouseRoutes.tsx:79` |
| `/wms/bins` | NO | WarehouseBinsPage | `WarehouseRoutes.tsx:93` |
| `/wms/dashboard` | NO | WMSDashboard | `WarehouseRoutes.tsx:73` |
| `/wms/employee-inventory` | NO | EmployeeInventory | `WarehouseRoutes.tsx:82` |
| `/wms/eoq` | NO | WmsEoqPage | `WarehouseRoutes.tsx:96` |
| `/wms/goods-issue` | NO | WmsGoodsIssuePage | `WarehouseRoutes.tsx:95` |
| `/wms/grn` | **YES** | GoodsReceiving | `WarehouseRoutes.tsx:68` |
| `/wms/in-transit` | **YES** | WmsInTransitPage | `WarehouseRoutes.tsx:97` |
| `/wms/inventory` | **YES** | InventoryCount | `WarehouseRoutes.tsx:70` |
| `/wms/kirim-new` | NO | WarehouseKirimWizard | `WarehouseRoutes.tsx:83` |
| `/wms/kpi-hub` | NO | WarehouseKpiHub | `WarehouseRoutes.tsx:74` |
| `/wms/material-balance` | NO | MaterialBalance | `WarehouseRoutes.tsx:86` |
| `/wms/material-unit-price` | nav | MaterialUnitPriceConfig | `WarehouseRoutes.tsx:91` |
| `/wms/material/360/:id` | dyn | WarehouseMaterial360 | `WarehouseRoutes.tsx:77` |
| `/wms/notifications` | NO | NotificationCenter | `WarehouseRoutes.tsx:84` |
| `/wms/overview` | **YES** | WarehouseDashboardPage | `WarehouseRoutes.tsx:55` |
| `/wms/passports` | NO | WarehouseInventoryPassport | `WarehouseRoutes.tsx:80` |
| `/wms/pos-monitor` | NO | PosMonitorPage | `WarehouseRoutes.tsx:61` |
| `/wms/procurement` | **YES** | ProcurementPage | `WarehouseRoutes.tsx:56` |
| `/wms/qc-review` | NO | WarehouseQCReview | `WarehouseRoutes.tsx:81` |
| `/wms/quarantine` | NO | WarehouseQuarantine | `WarehouseRoutes.tsx:78` |
| `/wms/rental` | **YES** | WarehouseRental | `WarehouseRoutes.tsx:72` |
| `/wms/reports` | NO | WarehouseReportsAll | `WarehouseRoutes.tsx:75` |
| `/wms/reports-all` | NO | WarehouseReportsAll | `WarehouseRoutes.tsx:76` |
| `/wms/reservation` | **YES** | StockReservation | `WarehouseRoutes.tsx:69` |
| `/wms/rulon-cards` | NO | RulonCards | `WarehouseRoutes.tsx:92` |
| `/wms/scanner` | NO | BarcodeScanner | `WarehouseRoutes.tsx:87` |
| `/wms/settings` | **YES** | WMSSettings | `WarehouseRoutes.tsx:90` |
| `/wms/variance-approval` | **YES** | WMSVarianceApproval | `WarehouseRoutes.tsx:71` |
| `/wms/warehouse-stock/:id` | dyn | WarehouseStockPage | `WarehouseRoutes.tsx:58` |
| `/wms/warehouses` | **YES** | WarehousesPage | `WarehouseRoutes.tsx:57` |
| `/wms/warehouses/:type` | dyn | WarehouseTypePage | `WarehouseRoutes.tsx:60` |
| `/wms/zones` | NO | WarehouseZonesPage | `WarehouseRoutes.tsx:94` |

### A2. Backend endpointlari (436) — controller bo'yicha


#### `BarcodeWarehouseCompatController` — 28 route  
`modules/compatibility/barcode-warehouse.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/barcode-warehouse/dashboard` | 34 |
| GET | `/barcode-warehouse/barcodes` | 39 |
| POST | `/barcode-warehouse/barcodes/:id/qc-decision` | 44 |
| POST | `/barcode-warehouse/barcodes/:id/qc` | 50 |
| GET | `/barcode-warehouse/picking-tasks` | 56 |
| GET | `/barcode-warehouse/print-queue` | 61 |
| GET | `/barcode-warehouse/exit-logs` | 66 |
| GET | `/barcode-warehouse/operator-balance` | 71 |
| GET | `/barcode-warehouse/cycle-counts` | 76 |
| POST | `/barcode-warehouse/cycle-counts/submit` | 81 |
| DELETE | `/barcode-warehouse/barcodes/:id` | 87 |
| PATCH | `/barcode-warehouse/barcodes/:id` | 92 |
| GET | `/barcode-warehouse/cycle-count` | 97 |
| POST | `/barcode-warehouse/cycle-count/submit` | 102 |
| POST | `/barcode-warehouse/receive` | 108 |
| POST | `/barcode-warehouse/production-receive` | 114 |
| POST | `/barcode-warehouse/production-complete` | 120 |
| POST | `/barcode-warehouse/pick/:taskId` | 126 |
| POST | `/barcode-warehouse/picking/:taskId/complete` | 132 |
| PATCH | `/barcode-warehouse/operator-balance/:id/resolve` | 138 |
| PATCH | `/barcode-warehouse/qc/:id` | 143 |
| GET | `/barcode-warehouse/barcodes/scan/:id` | 149 |
| POST | `/barcode-warehouse/exit/:id/notify-security` | 154 |
| POST | `/barcode-warehouse/issue` | 161 |
| GET | `/barcode-warehouse/operator-debts` | 168 |
| GET | `/barcode-warehouse/debts/:id` | 173 |
| POST | `/barcode-warehouse/cycle-count` | 178 |
| PATCH | `/barcode-warehouse/debts/:id` | 184 |

#### `WarehouseFeaturesController` — 22 route  
`modules/pos/presentation/warehouse-features.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/wh-features/warehouse/:warehouseId/employees` | 55 |
| GET | `/pos/wh-features/user/:userId/warehouses` | 63 |
| POST | `/pos/wh-features/warehouse/:warehouseId/employees` | 70 |
| DELETE | `/pos/wh-features/employees/:assignmentId` | 93 |
| POST | `/pos/wh-features/movement/:movementId/auto-barcode` | 105 |
| GET | `/pos/wh-features/movement/:movementId/barcodes` | 112 |
| GET | `/pos/wh-features/material/:materialId/profile` | 121 |
| POST | `/pos/wh-features/movement/:movementId/gl-post` | 133 |
| GET | `/pos/wh-features/movement/:movementId/gl-postings` | 140 |
| POST | `/pos/wh-features/movement/:movementId/gl-approve` | 147 |
| GET | `/pos/wh-features/gl/journal` | 157 |
| GET | `/pos/wh-features/kpi/warehouses` | 175 |
| GET | `/pos/wh-features/kpi/system` | 182 |
| GET | `/pos/wh-features/grn` | 191 |
| POST | `/pos/wh-features/grn` | 209 |
| POST | `/pos/wh-features/grn/:id/approve` | 230 |
| GET | `/pos/wh-features/quarantine` | 242 |
| POST | `/pos/wh-features/movement/:id/move-to-quarantine` | 249 |
| POST | `/pos/wh-features/movement/:id/qc-decision` | 256 |
| GET | `/pos/wh-features/three-way-match/variances` | 269 |
| POST | `/pos/wh-features/three-way-match` | 276 |
| POST | `/pos/wh-features/three-way-match/auto` | 296 |

#### `WmsCountsController` — 16 route  
`modules/wms/presentation/wms-counts.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/inventory-counts` | 54 |
| GET | `/wms/inventory-counts/accuracy` | 72 |
| GET | `/wms/inventory-counts/:id/variances` | 82 |
| PATCH | `/wms/inventory-counts/:id/approve` | 95 |
| GET | `/wms/count-deviation-reasons` | 104 |
| POST | `/wms/count-lines` | 115 |
| GET | `/wms/freeze-zones` | 132 |
| POST | `/wms/freeze-zones` | 142 |
| PATCH | `/wms/freeze-zones/:id/release` | 157 |
| POST | `/wms/inventory-counts` | 165 |
| DELETE | `/wms/inventory-counts/:id` | 176 |
| GET | `/wms/internal-requests` | 188 |
| POST | `/wms/internal-requests` | 196 |
| PATCH | `/wms/internal-requests/:id` | 211 |
| GET | `/wms/batches` | 225 |
| GET | `/wms/production-supply` | 232 |

#### `MaterialBalanceController` — 15 route  
`modules/remaining/material-balance.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/material-balance/overview` | 27 |
| GET | `/material-balance/alerts` | 32 |
| GET | `/material-balance/internal-requests` | 37 |
| PATCH | `/material-balance/internal-requests/:id/approve` | 42 |
| PATCH | `/material-balance/internal-requests/:id/issue` | 53 |
| GET | `/material-balance/production` | 60 |
| POST | `/material-balance/production/take` | 67 |
| POST | `/material-balance/production/use` | 74 |
| POST | `/material-balance/production/return` | 81 |
| POST | `/material-balance/negative-stock-check` | 88 |
| GET | `/material-balance/:materialId/history` | 93 |
| GET | `/material-balance/movements` | 106 |
| POST | `/material-balance/movements` | 116 |
| GET | `/material-balance/:materialId/reconciliation` | 168 |
| GET | `/material-balance/warehouse/:warehouseId` | 173 |

#### `WmsWarehouseGatewayController` — 14 route  
`modules/wms/presentation/wms-warehouse-gateway.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/warehouse/transfers` | 82 |
| GET | `/warehouse/transfers/:id` | 98 |
| PATCH | `/warehouse/transfers/:id/status` | 115 |
| POST | `/warehouse/internal-requests` | 138 |
| GET | `/warehouse/goods-receipts/stats` | 155 |
| GET | `/warehouse/goods-receipts` | 163 |
| POST | `/warehouse/goods-receipts` | 174 |
| GET | `/warehouse/goods-receipts/:id/lines` | 189 |
| POST | `/warehouse/goods-receipts/lines/:id/qc` | 198 |
| PATCH | `/warehouse/goods-receipts/lines/:id/qc` | 212 |
| POST | `/warehouse/goods-receipts/:id/lines` | 226 |
| POST | `/warehouse/goods-receipts/:id/quarantine` | 239 |
| POST | `/warehouse/goods-receipts/:id/qc-decision` | 252 |
| POST | `/warehouse/goods-receipts/:id/complete` | 269 |

#### `EmployeeController` — 13 route  
`modules/pos/presentation/employee.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/employees/:userId/balance` | 57 |
| GET | `/pos/employees/me/balance` | 72 |
| GET | `/pos/employees/department/:code/balance` | 84 |
| GET | `/pos/employees/:userId/statement` | 93 |
| POST | `/pos/employees/write-off` | 109 |
| POST | `/pos/employees/liability` | 127 |
| PATCH | `/pos/employees/liability/:id` | 145 |
| POST | `/pos/employees/dismiss-check` | 167 |
| GET | `/pos/employees/me/inventory` | 192 |
| GET | `/pos/employees/me/inventory/pdf` | 202 |
| GET | `/pos/employees/me/checklist` | 220 |
| POST | `/pos/employees/me/return` | 229 |
| GET | `/pos/employees/:id/hr-check` | 248 |

#### `WmsCatalogController` — 13 route  
`modules/wms/presentation/wms-catalog.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/reports/abc-analysis` | 37 |
| GET | `/warehouse/reports/aging` | 45 |
| GET | `/warehouse/reports/expiry` | 53 |
| GET | `/warehouse/reports/stock-balance` | 64 |
| GET | `/warehouse/reports/turnover` | 76 |
| GET | `/warehouse/stats/total` | 89 |
| GET | `/warehouse/dashboard` | 99 |
| GET | `/warehouse/dashboard/kpis` | 117 |
| GET | `/warehouse/dashboard/movement-summary` | 125 |
| GET | `/warehouse/dashboard/alerts` | 133 |
| GET | `/warehouse/dashboard/top-materials` | 141 |
| GET | `/warehouse/transactions` | 154 |
| GET | `/warehouse/orders-by-date/:date` | 167 |

#### `WmsExtendedController` — 12 route  
`modules/wms/presentation/wms-extended.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/stats/total` | 56 |
| GET | `/wms/materials/:id/fifo-cost` | 64 |
| GET | `/wms/transactions` | 71 |
| POST | `/wms/transactions` | 88 |
| GET | `/wms/alerts` | 98 |
| POST | `/wms/check-alerts` | 106 |
| GET | `/wms/suggestions` | 116 |
| GET | `/wms/low-stock` | 123 |
| POST | `/wms/barcode/scan` | 132 |
| PATCH | `/wms/transactions/:id` | 144 |
| DELETE | `/wms/transactions/:id` | 158 |
| GET | `/wms/movements` | 171 |

#### `InventoryCountController` — 10 route  
`modules/pos/presentation/inventory-count.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/inventory-counts/variance-config` | 61 |
| PATCH | `/pos/inventory-counts/variance-config` | 69 |
| GET | `/pos/inventory-counts` | 81 |
| POST | `/pos/inventory-counts` | 90 |
| POST | `/pos/inventory-counts/lines/record` | 99 |
| POST | `/pos/inventory-counts/lines/bulk-record` | 106 |
| GET | `/pos/inventory-counts/:id/variance` | 115 |
| GET | `/pos/inventory-counts/:id/variance-decision` | 124 |
| PATCH | `/pos/inventory-counts/approve` | 133 |
| GET | `/pos/inventory-counts/:id/pdf` | 142 |

#### `MovementsController` — 10 route  
`modules/pos/presentation/movements.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/movements` | 73 |
| GET | `/pos/movements/:id` | 82 |
| POST | `/pos/movements` | 91 |
| PATCH | `/pos/movements/:id/status` | 106 |
| POST | `/pos/movements/qc-decision` | 120 |
| POST | `/pos/movements/damage` | 129 |
| GET | `/pos/movements/:id/pdf` | 138 |
| GET | `/pos/movements/:id/confirmations` | 162 |
| POST | `/pos/movements/:id/recheck-techcard` | 171 |
| GET | `/pos/movements/:id/history` | 184 |

#### `WarehouseRentalController` — 10 route  
`modules/wms/presentation/warehouse-rental.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse-rental/records` | 40 |
| POST | `/warehouse-rental/records` | 52 |
| GET | `/warehouse-rental/summary` | 62 |
| GET | `/warehouse-rental/settings` | 71 |
| PATCH | `/warehouse-rental/settings` | 81 |
| POST | `/warehouse-rental/records/:id/close` | 93 |
| POST | `/warehouse-rental/records/:id/mark-paid` | 103 |
| PATCH | `/warehouse-rental/records/:id/close` | 124 |
| PATCH | `/warehouse-rental/records/:id/mark-paid` | 133 |
| PUT | `/warehouse-rental/settings` | 147 |

#### `WmsGatewayBinZoneController` — 10 route  
`modules/wms/presentation/wms-gateway-binszone.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/bins` | 86 |
| POST | `/warehouse/bins` | 128 |
| GET | `/warehouse/bins/:id/360` | 156 |
| GET | `/warehouse/bins/:id` | 175 |
| PATCH | `/warehouse/bins/:id` | 195 |
| DELETE | `/warehouse/bins/:id` | 216 |
| GET | `/warehouse/zones` | 228 |
| POST | `/warehouse/zones` | 252 |
| PATCH | `/warehouse/zones/:id` | 278 |
| DELETE | `/warehouse/zones/:id` | 300 |

#### `ReportsController` — 9 route  
`modules/pos/presentation/reports.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/reports/kpi` | 30 |
| GET | `/pos/reports/stock` | 37 |
| GET | `/pos/reports/movement-stats` | 49 |
| GET | `/pos/reports/top-materials` | 57 |
| GET | `/pos/reports/audit` | 64 |
| GET | `/pos/reports/three-way-match` | 89 |
| GET | `/pos/reports/liabilities` | 96 |
| GET | `/pos/reports/abc-analysis` | 103 |
| GET | `/pos/reports/inactive-materials` | 111 |

#### `WmsGatewayInventoryController` — 9 route  
`modules/wms/presentation/wms-gateway-inventory.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/inventory-counts-stats` | 77 |
| GET | `/warehouse/inventory-counts` | 101 |
| POST | `/warehouse/inventory-counts` | 134 |
| GET | `/warehouse/inventory-counts/lines/:lineId` | 168 |
| PATCH | `/warehouse/inventory-counts/lines/:lineId` | 206 |
| GET | `/warehouse/inventory-counts/:id` | 240 |
| PATCH | `/warehouse/inventory-counts/:id` | 310 |
| PATCH | `/warehouse/inventory-counts/:id/status` | 333 |
| POST | `/warehouse/inventory-counts/:id/generate-lines` | 357 |

#### `WarehouseCatalogController` — 8 route  
`modules/compatibility/warehouse-catalog.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/materials` | 49 |
| POST | `/warehouse/materials` | 58 |
| PUT | `/warehouse/materials/:id` | 69 |
| GET | `/warehouse/batches/stats` | 79 |
| GET | `/warehouse/batches` | 84 |
| POST | `/warehouse/batches` | 94 |
| PATCH | `/warehouse/batches/:id` | 100 |
| POST | `/warehouse/movements` | 105 |

#### `WmsBarcodeController` — 8 route  
`modules/wms/presentation/wms-barcode.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/printer-config` | 81 |
| POST | `/warehouse/printer-config` | 96 |
| PATCH | `/warehouse/printer-config/:id` | 117 |
| DELETE | `/warehouse/printer-config/:id` | 143 |
| GET | `/warehouse/material-kits` | 158 |
| POST | `/warehouse/material-kits` | 167 |
| PATCH | `/warehouse/material-kits/:id/status` | 196 |
| GET | `/warehouse/material-kits/:id/items` | 207 |

#### `WmsGatewayWarehousesController` — 8 route  
`modules/wms/presentation/wms-gateway-warehouses.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/warehouses/stats/total` | 68 |
| GET | `/warehouse/warehouses` | 92 |
| POST | `/warehouse/warehouses` | 127 |
| GET | `/warehouse/warehouses/:id/stock` | 168 |
| GET | `/warehouse/warehouses/:id/stats` | 215 |
| GET | `/warehouse/warehouses/:id` | 315 |
| PATCH | `/warehouse/warehouses/:id` | 329 |
| DELETE | `/warehouse/warehouses/:id` | 355 |

#### `WmsInTransitController` — 8 route  
`modules/wms/presentation/wms-in-transit.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/in-transit/shipments` | 44 |
| GET | `/wms/in-transit/shipments/:id` | 55 |
| POST | `/wms/in-transit/shipments` | 64 |
| POST | `/wms/in-transit/shipments/:id/customs` | 75 |
| POST | `/wms/in-transit/shipments/:id/arrived` | 89 |
| POST | `/wms/in-transit/shipments/:id/cancel` | 104 |
| GET | `/wms/in-transit/shipments/:id/documents` | 112 |
| POST | `/wms/in-transit/shipments/:id/documents` | 124 |

#### `BarcodeController` — 7 route  
`modules/pos/presentation/barcode.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/pos/barcode/scan` | 52 |
| GET | `/pos/barcode/lookup` | 61 |
| POST | `/pos/barcode/assign` | 74 |
| POST | `/pos/barcode/print` | 83 |
| POST | `/pos/barcode/generate-ean13` | 92 |
| POST | `/pos/barcode/ai-suggestion/review` | 101 |
| GET | `/pos/barcode/ai-suggestion/pending` | 110 |

#### `MaterialNormsController` — 7 route  
`modules/pos/presentation/material-norms.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/material-norms` | 83 |
| GET | `/pos/material-norms/deviation` | 98 |
| GET | `/pos/material-norms/:id` | 108 |
| POST | `/pos/material-norms` | 116 |
| PATCH | `/pos/material-norms/:id` | 134 |
| DELETE | `/pos/material-norms/:id` | 142 |
| POST | `/pos/material-norms/ai-recalculate` | 149 |

#### `PosOperationsController` — 7 route  
`modules/pos/presentation/pos-operations.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/operations/warehouses` | 68 |
| GET | `/pos/operations/warehouses/:id/stock` | 90 |
| POST | `/pos/operations/warehouses/:id/issue` | 104 |
| POST | `/pos/operations/warehouses/:id/receive` | 128 |
| GET | `/pos/operations/p2p/pending` | 152 |
| POST | `/pos/operations/p2p/:requestId/receive` | 173 |
| GET | `/pos/operations/materials/:materialId/movements` | 196 |

#### `ShiftHandoverController` — 7 route  
`modules/pos/presentation/shift-handover.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/handovers` | 41 |
| GET | `/pos/handovers/pallets/balance` | 50 |
| GET | `/pos/handovers/:id` | 59 |
| POST | `/pos/handovers` | 67 |
| POST | `/pos/handovers/:id/sign` | 77 |
| POST | `/pos/handovers/:id/cancel` | 91 |
| POST | `/pos/handovers/pallets` | 105 |

#### `IotMaterialKitsController` — 7 route  
`modules/wms/presentation/iot-material-kits.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/iot/material-kits` | 38 |
| POST | `/iot/material-kits` | 49 |
| POST | `/iot/material-kits/generate` | 63 |
| GET | `/iot/material-kits/:id` | 78 |
| PATCH | `/iot/material-kits/:id/prepare` | 88 |
| PATCH | `/iot/material-kits/:id/ready` | 100 |
| GET | `/iot/material-kits/:id/items` | 111 |

#### `MaterialLifeController` — 7 route  
`modules/wms/presentation/material-life.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/material-life/aging-alerts` | 76 |
| GET | `/wms/material-life/hazard-stock` | 86 |
| GET | `/wms/material-life/:id` | 97 |
| PATCH | `/wms/material-life/:id` | 107 |
| GET | `/wms/material-life/:id/substitutes` | 116 |
| POST | `/wms/material-life/:id/substitutes` | 128 |
| DELETE | `/wms/material-life/substitutes/:subId` | 143 |

#### `WmsIntegrationController` — 7 route  
`modules/wms/presentation/wms-integration.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/warehouse/warehouses/:id/sync-pos` | 73 |
| GET | `/warehouse/integration/mm/pending-deliveries` | 98 |
| GET | `/warehouse/integration/mm/reorder-suggestions` | 105 |
| GET | `/warehouse/integration/fi/stock-valuation` | 112 |
| GET | `/warehouse/integration/summary` | 119 |
| GET | `/warehouse/integration` | 126 |
| POST | `/warehouse/integration` | 133 |

#### `GlController` — 6 route  
`modules/pos/presentation/gl.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/gl/movement/:id` | 35 |
| POST | `/pos/gl/approve/:movementId` | 43 |
| POST | `/pos/gl/entry/:id/approve` | 54 |
| POST | `/pos/gl/entry/:id/reject` | 64 |
| GET | `/pos/gl/pending` | 74 |
| GET | `/pos/gl/journal` | 81 |

#### `MiniAppController` — 6 route  
`modules/pos/presentation/mini-app.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/pos/mini-app/auth` | 92 |
| POST | `/pos/mini-app/barcode/scan` | 109 |
| GET | `/pos/mini-app/materials` | 117 |
| POST | `/pos/mini-app/requests` | 125 |
| PATCH | `/pos/mini-app/requests/:id/approve` | 133 |
| PATCH | `/pos/mini-app/requests/:id/reject` | 142 |

#### `ProcurementController` — 6 route  
`modules/pos/presentation/procurement.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/procurement/approval-chain/:employeeId` | 36 |
| POST | `/pos/procurement/requests` | 44 |
| GET | `/pos/procurement/requests` | 54 |
| GET | `/pos/procurement/requests/:id` | 70 |
| POST | `/pos/procurement/requests/:id/decide` | 78 |
| POST | `/pos/procurement/requests/:id/receive` | 89 |

#### `RequestsController` — 6 route  
`modules/pos/presentation/requests.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/requests` | 48 |
| GET | `/pos/requests/:id` | 57 |
| POST | `/pos/requests` | 66 |
| PATCH | `/pos/requests/approve` | 75 |
| PATCH | `/pos/requests/reject` | 84 |
| POST | `/pos/requests/issue` | 93 |

#### `StockController` — 6 route  
`modules/pos/presentation/stock.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/stock` | 45 |
| POST | `/pos/stock/adjust` | 52 |
| GET | `/pos/stock/low-alerts` | 70 |
| GET | `/pos/stock/expiry-alerts` | 77 |
| GET | `/pos/stock/movements` | 90 |
| GET | `/pos/stock/:warehouseId/:materialId` | 103 |

#### `WarehouseConfigController` — 6 route  
`modules/pos/presentation/warehouse-config.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/warehouse-config/types` | 26 |
| GET | `/pos/warehouse-config/warehouses` | 34 |
| GET | `/pos/warehouse-config/warehouses/:id/stock` | 43 |
| GET | `/pos/warehouse-config/materials/:materialId/movements` | 51 |
| GET | `/pos/warehouse-config/dashboard` | 59 |
| GET | `/pos/warehouse-config/finished-goods-stock` | 67 |

#### `InventoryMaterialsController` — 6 route  
`modules/wms/presentation/inventory-materials.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/inventory/materials` | 58 |
| GET | `/inventory/materials/:id/360-card` | 75 |
| PUT | `/inventory/materials/:id` | 86 |
| DELETE | `/inventory/materials/:id` | 98 |
| POST | `/inventory/materials` | 109 |
| GET | `/inventory/materials/low-stock` | 121 |

#### `WmsStockController` — 6 route  
`modules/wms/presentation/wms-stock.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/stock` | 53 |
| GET | `/wms/stock/:id` | 65 |
| GET | `/wms/stock/fefo/:materialId/:warehouseId` | 77 |
| POST | `/wms/stock/reserve` | 91 |
| PATCH | `/wms/stock/:id` | 112 |
| DELETE | `/wms/stock/:id` | 125 |

#### `WmsWarehousesController` — 6 route  
`modules/wms/presentation/wms-warehouses.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/warehouses` | 52 |
| GET | `/wms/warehouses/:id` | 64 |
| POST | `/wms/warehouses` | 79 |
| PATCH | `/wms/warehouses/:id/toggle-active` | 119 |
| GET | `/wms/warehouses/:id/inventory` | 141 |
| DELETE | `/wms/warehouses/:id` | 167 |

#### `PosWarehouseIntegrationController` — 5 route  
`modules/compatibility/pos-warehouse-integration.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/wh/stock` | 41 |
| GET | `/pos/wh/barcode/:barcode` | 61 |
| POST | `/pos/wh/movements` | 69 |
| GET | `/pos/wh/movements` | 110 |
| GET | `/pos/wh/alerts` | 130 |

#### `WarehouseLabelController` — 5 route  
`modules/compatibility/warehouse-label.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/warehouse/label/print` | 28 |
| GET | `/warehouse/label/batches` | 34 |
| GET | `/warehouse/label/history` | 42 |
| PATCH | `/warehouse/label/batches/:id/status` | 50 |
| POST | `/warehouse/label/print-job` | 58 |

#### `GeneralLegacyBController` — 5 route  
`modules/general/controllers/general-legacy-b.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/stock` | 58 |
| GET | `/warehouse/transfers` | 63 |
| GET | `/warehouse/lots` | 68 |
| GET | `/warehouse/internal-requests` | 73 |
| GET | `/warehouse/dashboard/warehouse-occupancy` | 80 |

#### `LogisticsController` — 5 route  
`modules/logistics/presentation/logistics.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/logistics` | 64 |
| GET | `/logistics/:id` | 87 |
| POST | `/logistics` | 98 |
| PATCH | `/logistics/:id/assign-driver` | 114 |
| PATCH | `/logistics/:id/complete` | 131 |

#### `InventoryPassportController` — 5 route  
`modules/pos/presentation/inventory-passport.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/pos/inventory-passport` | 27 |
| GET | `/pos/inventory-passport/quarantine` | 34 |
| GET | `/pos/inventory-passport/:movementId` | 41 |
| GET | `/pos/inventory-passport` | 48 |
| POST | `/pos/inventory-passport/:movementId/qc-decision` | 65 |

#### `PosWmsController` — 5 route  
`modules/pos/presentation/pos-wms.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/wms/warehouses` | 33 |
| GET | `/pos/wms/materials` | 44 |
| GET | `/pos/wms/warehouse/:warehouseId/stock` | 66 |
| GET | `/pos/wms/warehouse/:warehouseId/movements` | 86 |
| GET | `/pos/wms/low-stock` | 109 |

#### `PrinterConfigController` — 5 route  
`modules/pos/presentation/printer-config.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/printer-config` | 40 |
| GET | `/pos/printer-config/active` | 46 |
| POST | `/pos/printer-config` | 54 |
| PATCH | `/pos/printer-config/:id` | 61 |
| POST | `/pos/printer-config/:id/test` | 71 |

#### `WarehouseOpenController` — 5 route  
`modules/pos/presentation/warehouse-open.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/my-warehouses` | 42 |
| GET | `/pos/label-config` | 50 |
| GET | `/pos/label-config/warehouse/:id` | 58 |
| GET | `/pos/label-config/:type` | 66 |
| PATCH | `/pos/label-config` | 74 |

#### `RulonCardController` — 5 route  
`modules/wms/presentation/rulon-card.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/wms/rulon-cards` | 58 |
| GET | `/wms/rulon-cards` | 68 |
| GET | `/wms/rulon-cards/:id` | 86 |
| PATCH | `/wms/rulon-cards/:id/weight` | 98 |
| PATCH | `/wms/rulon-cards/:id/status` | 110 |

#### `WmsGatewayWarehouseLotsController` — 5 route  
`modules/wms/presentation/wms-gateway-warehouse-lots.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/warehouse/warehouses/:id/zones` | 60 |
| GET | `/warehouse/warehouses/:id/bins` | 82 |
| GET | `/warehouse/warehouses/:id/lots` | 108 |
| POST | `/warehouse/warehouses/:id/lots` | 149 |
| PATCH | `/warehouse/warehouses/:id/lots/:lotId` | 180 |

#### `WmsGoodsIssueController` — 5 route  
`modules/wms/presentation/wms-goods-issue.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/goods-issue` | 58 |
| GET | `/wms/goods-issue/:id` | 69 |
| POST | `/wms/goods-issue` | 79 |
| PATCH | `/wms/goods-issue/:id` | 100 |
| DELETE | `/wms/goods-issue/:id` | 113 |

#### `WmsInventoryController` — 5 route  
`modules/wms/presentation/wms-inventory.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/inventory` | 55 |
| GET | `/wms/inventory/low-stock` | 68 |
| GET | `/wms/inventory/:id` | 79 |
| PATCH | `/wms/inventory/:id` | 93 |
| DELETE | `/wms/inventory/:id` | 106 |

#### `MaterialCardsCompatController` — 4 route  
`modules/compatibility/resources.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/material-cards` | 77 |
| GET | `/material-cards/:id` | 82 |
| POST | `/material-cards` | 87 |
| PATCH | `/material-cards/:id/unit-price` | 93 |

#### `WarehouseBarcodeOpsController` — 4 route  
`modules/compatibility/warehouse-barcode-ops.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/warehouse/barcode/generate` | 28 |
| POST | `/warehouse/barcode/scan` | 34 |
| POST | `/warehouse/barcode/bulk-generate` | 40 |
| GET | `/warehouse/barcode/print/:id` | 46 |

#### `PosStubController` — 4 route  
`modules/pos/presentation/pos-stub.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/inventory/low-stock` | 47 |
| GET | `/pos/inventory/movements` | 53 |
| GET | `/pos/inventory/monthly-report` | 65 |
| PATCH | `/pos/inventory/:productId/adjust` | 75 |

#### `DeliveryRequestFulfillmentController` — 3 route  
`modules/pos/presentation/delivery-request-fulfillment.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/pos/delivery-requests/:documentId/fulfill` | 45 |
| POST | `/pos/delivery-requests/:documentId/fulfill-live` | 64 |
| GET | `/pos/delivery-requests/compare/:salesOrderId` | 83 |

#### `MiniAppHistoryController` — 3 route  
`modules/pos/presentation/mini-app-history.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/mini-app/history` | 35 |
| GET | `/pos/mini-app/pending-approvals` | 49 |
| GET | `/pos/mini-app/warehouses` | 57 |

#### `PosAuthController` — 3 route  
`modules/pos/presentation/pos-auth.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/pos/auth/login` | 36 |
| POST | `/pos/auth/validate` | 56 |
| GET | `/pos/auth/ping` | 70 |

#### `PosNotificationsController` — 3 route  
`modules/pos/presentation/pos-notifications.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/notifications` | 35 |
| POST | `/pos/notifications/:id/read` | 42 |
| POST | `/pos/notifications/read-all` | 52 |

#### `SyncController` — 3 route  
`modules/pos/presentation/sync.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/pos/sync/push` | 49 |
| POST | `/pos/sync/pull` | 60 |
| GET | `/pos/sync/status` | 68 |

#### `InventoryAdvancedController` — 3 route  
`modules/wms/presentation/inventory-advanced.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/inventory/advanced/analytics` | 30 |
| GET | `/inventory/advanced/counts` | 37 |
| GET | `/inventory/advanced/barcodes` | 53 |

#### `WmsAnalyticsController` — 3 route  
`modules/wms/presentation/wms-analytics.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/inventory-turnover` | 30 |
| GET | `/wms/dead-stock` | 38 |
| GET | `/wms/rop-alerts` | 46 |

#### `WmsRentalController` — 3 route  
`modules/wms/presentation/wms-rental.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/wms/rental/receive` | 46 |
| PATCH | `/wms/rental/:id` | 77 |
| DELETE | `/wms/rental/:id` | 92 |

#### `WmsSettingsController` — 3 route  
`modules/wms/presentation/wms-settings.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/settings` | 38 |
| POST | `/wms/settings` | 47 |
| PATCH | `/wms/settings/:id` | 56 |

#### `PosAnomaliesController` — 2 route  
`modules/pos/presentation/pos-anomalies.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/pos/anomalies` | 45 |
| GET | `/pos/anomalies/:id` | 56 |

#### `StockIssuableController` — 2 route  
`modules/pos/presentation/stock-issuable.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/pos/barcode/generate` | 56 |
| GET | `/pos/stock/issuable/:barcode` | 79 |

#### `WmsEoqController` — 2 route  
`modules/wms/presentation/wms-eoq.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/wms/eoq/calculate` | 46 |
| POST | `/wms/eoq/recalculate-all` | 57 |

#### `WmsOverflowController` — 2 route  
`modules/wms/presentation/wms-overflow.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/wms/goods-issue/overflow` | 64 |
| POST | `/wms/goods-issue/enforce-check` | 88 |

#### `WmsSupplierRatingController` — 2 route  
`modules/wms/presentation/wms-supplier-rating.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/wms/suppliers/rating` | 49 |
| GET | `/wms/suppliers/:id/rating` | 59 |

#### `MmRawMaterialsController` — 1 route  
`modules/mm/presentation/mm-raw-materials.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/raw-materials` | 39 |

### A3. Frontend API chaqiruvlari (323) — fayl bo'yicha

| Fayl | Chaqiruv soni | Endpointlar |
|---|---|---|
| `hooks/use-wms.ts` | 40 | `/api/warehouse/dashboard/kpis` `/api/warehouse/warehouses` `/api/warehouse/stock` `/api/warehouse/lots` `/api/warehouse/transfers` `/api/warehouse/internal-requests` `/api/wms/low-stock` `/api/warehouse/dashboard/warehouse-occupancy` … |
| `lib/api/wms.ts` | 37 | `/api/wms/inventory-counts` `/api/wms/internal-requests` `/api/wms/internal-requests/${id}` `/api/wms/transactions` `/api/wms/check-alerts` `/api/wms/goods-issue` `/api/wms/rental/receive` `/api/wms/stock/reserve` … |
| `pages/MaterialBalance.tsx` | 16 | `/api/material-balance/overview` `/api/material-balance/alerts` `/api/material-balance/internal-requests` `/api/material-balance/production` `/api/material-balance/movements` `/api/material-balance/internal-requests/${id}/approve` `/api/material-balance/internal-requests/${id}/issue` … |
| `pages/InventoryCount.tsx` | 15 | `/api/warehouse/inventory-counts-stats` `/api/warehouse/inventory-counts` `/api/warehouse/warehouses` `/api/warehouse/inventory-counts/${id}` `/api/warehouse/inventory-counts/${id}/status` `/api/warehouse/inventory-counts/${id}/generate-lines` `/api/warehouse/inventory-counts/lines/${lineId}` … |
| `components/wms/receiving/useGoodsReceivingHooks.ts` | 14 | `/api/warehouse/goods-receipts` `/api/warehouse/goods-receipts/${receiptId}/lines` `/api/warehouse/goods-receipts/lines/${lineId}/qc` `/api/warehouse/goods-receipts/${receiptId}/complete` `/api/warehouse/goods-receipts/stats` `/api/warehouse/warehouses` `/api/warehouse/materials` `/api/warehouse/bins` … |
| `pages/BarcodeSystem.tsx` | 14 | `/api/warehouse/batches` `/api/warehouse/materials` `/api/warehouse/warehouses` `/api/warehouse/batches/stats` `/api/warehouse/batches/${id}` `/api/warehouse/barcode/generate` `/api/warehouse/barcode/scan` `/api/warehouse/barcode/bulk-generate` … |
| `pages/WMSDashboard.tsx` | 12 | `/api/warehouse/dashboard/kpis` `/api/warehouse/dashboard/movement-summary` `/api/warehouse/dashboard/alerts` `/api/warehouse/dashboard/top-materials` `/api/warehouse/warehouses` `/api/wms/internal-requests` … |
| `lib/api/wms-in-transit.ts` | 9 | `/api/wms/in-transit/shipments` `/api/wms/in-transit/shipments/${id}/customs` `/api/wms/in-transit/shipments/${id}/arrived` `/api/wms/in-transit/shipments/${id}/cancel` `/api/wms/in-transit/shipments/${id}/documents` `/api/wms/suppliers/rating` … |
| `pages/WarehouseRental.tsx` | 9 | `/api/warehouse-rental/summary` `/api/warehouse-rental/records` `/api/warehouse-rental/records${statusFilter` `/api/warehouse-rental/settings` `/api/warehouse-rental/records/${id}/close` `/api/warehouse-rental/records/${id}/mark-paid` `/api/warehouse-rental/recalculate` … |
| `pages/GLPostingMonitor.tsx` | 8 | `/api/pos/gl/pending` `/api/pos/gl/journal` `/api/pos/gl/entry/${id}/approve` `/api/pos/gl/entry/${id}/reject` |
| `pages/RulonCards.tsx` | 8 | `/api/wms/rulon-cards` `/api/wms/rulon-cards/${item` |
| `pages/WarehouseBinsPage.tsx` | 8 | `/api/warehouse/bins` `/api/warehouse/bins${qs` `/api/warehouse/warehouses` `/api/warehouse/zones` |
| `pages/WarehouseDailyView.tsx` | 6 | `/api/warehouse/orders-by-date` `/api/warehouse/material-kits` `/api/warehouse/material-kits/${data.kitId}/status` `/api/warehouse/material-kits/${kit.id}/items` |
| `pages/WarehouseZonesPage.tsx` | 6 | `/api/warehouse/zones` `/api/warehouse/zones${qs` `/api/warehouse/warehouses` |
| `pages/WmsAnalyticsPage.tsx` | 6 | `/api/wms/inventory-turnover` `/api/wms/dead-stock` `/api/wms/rop-alerts` |
| `pages/MaterialCardsPage.tsx` | 5 | `/api/warehouse/materials` `/api/warehouse/materials/${id}` |
| `pages/WmsGoodsIssuePage.tsx` | 5 | `/api/wms/goods-issue` `/api/material-cards` `/api/warehouse/warehouses` |
| `pages/WMSSettings.tsx` | 5 | `/api/wms/settings` `/api/wms/settings/${id}` |
| `components/wms/MaterialDialog.tsx` | 4 | `/api/inventory/materials` `/api/inventory/materials/${editMaterial` |
| `hooks/use-wms.test.ts` | 4 | `/api/warehouse/goods-receipts` `/api/wms/goods-issue` `/api/wms/barcode/scan` `/api/warehouse/transfers` |
| `pages/barcode/PrinterSettingsTab.tsx` | 4 | `/api/warehouse/printer-config` `/api/warehouse/printer-config/${id}` |
| `pages/WarehouseKirimWizard.tsx` | 4 | `/api/pos/wms/warehouses` `/api/pos/wms/materials` `/api/pos/movements` `/api/pos/inventory-passport` |
| `pages/WarehouseMaterial360.tsx` | 4 | `/api/wms/material-life/aging-alerts` `/api/wms/material-life/hazard-stock` `/api/wms/material-life` |
| `pages/WmsInTransitPage.tsx` | 4 | `/api/wms/in-transit/shipments` `/api/wms/suppliers/rating` |
| `pages/__tests__/NotificationCenter.test.tsx` | 4 | `/api/pos/notifications` `/api/pos/notifications/read-all` |
| `components/wms/inventory/BlindCountPanel.tsx` | 3 | `/api/wms/count-deviation-reasons` `/api/wms/freeze-zones` `/api/warehouse/inventory-counts` |
| `pages/MaterialUnitPriceConfig.tsx` | 3 | `/api/material-cards` `/api/material-cards/${id}/unit-price` |
| `pages/NotificationCenter.tsx` | 3 | `/api/pos/notifications` `/api/pos/notifications/${id}/read` `/api/pos/notifications/read-all` |
| `pages/WarehouseQCReview.tsx` | 3 | `/api/pos/wh-features/quarantine` `/api/pos/movements/${movement.id}` `/api/pos/wh-features/movement/${selected.id}/qc-decision` |
| `pages/WarehouseRentalDialogs.tsx` | 3 | `/api/warehouse-rental/records` `/api/warehouse-rental/summary` |
| `pages/WarehouseRentalSettings.tsx` | 3 | `/api/warehouse-rental/settings` |
| `pages/WarehouseReports.tsx` | 3 | `/api/warehouse/reports/stock-balance` `/api/warehouse/reports/turnover` `/api/warehouse/reports/abc-analysis` |
| `pages/WMSMaterials.tsx` | 3 | `/api/inventory/materials` |
| `components/Material360Card.tsx` | 2 | `/api/inventory/materials` `/api/inventory/materials/${materialId}/360-card` |
| `components/wms/reports/AbcAnalysisTab.tsx` | 2 | `/api/warehouse/reports/abc-analysis` |
| `components/wms/reports/AgingTab.tsx` | 2 | `/api/warehouse/reports/aging` |
| `components/wms/reports/ExpiryTab.tsx` | 2 | `/api/warehouse/reports/expiry` |
| `components/wms/reports/StockBalanceTab.tsx` | 2 | `/api/warehouse/reports/stock-balance` |
| `components/wms/reports/TurnoverTab.tsx` | 2 | `/api/warehouse/reports/turnover` |
| `pages/barcode/LabelPrintDialog.tsx` | 2 | `/api/warehouse/label/print` |
| `pages/MMDashboard.tsx` | 2 | `/api/warehouse/materials` `/api/wms/transactions` |
| `pages/RawMaterialsPage.tsx` | 2 | `/api/raw-materials` |
| `pages/WarehouseBarcodeQueue.tsx` | 2 | `/api/pos/movements` `/api/pos/wh-features/movement/${m.id}/barcodes` |
| `pages/WarehouseQuarantine.tsx` | 2 | `/api/pos/wh-features/quarantine` `/api/pos/wh-features/movement/${id}/qc-decision` |
| `components/ModuleSidebar.tsx` | 1 | `/api/warehouse/warehouses` |
| `components/orders/useWizardState.ts` | 1 | `/api/raw-materials` |
| `lib/api/material-life.ts` | 1 | `/api/wms/material-life` |
| `lib/api/pos-operations.api.ts` | 1 | `/api/pos/operations` |
| `lib/api/procurement.api.ts` | 1 | `/api/pos/procurement` |
| `lib/api/warehouse-features.ts` | 1 | `/api/pos/wh-features` |
| `lib/api/warehouse.api.ts` | 1 | `/api/pos/warehouse-config` |
| `lib/api/wms-count.ts` | 1 | `/api/wms` |
| `pages/BarcodeScanner.tsx` | 1 | `/api/wms/barcode/scan` |
| `pages/BOMManagement.tsx` | 1 | `/api/material-cards` |
| `pages/EmployeeInventory.tsx` | 1 | `/api/pos/employees/me/inventory` |
| `pages/GoodsReceiving.tsx` | 1 | `/api/warehouse/goods-receipts` |
| `pages/MaterialsAccounting.tsx` | 1 | `/api/warehouse/movements` |
| `pages/MMPurchaseOrders.tsx` | 1 | `/api/raw-materials` |
| `pages/PlanningBoard.tsx` | 1 | `/api/material-cards` |
| `pages/RoutingConfiguration.tsx` | 1 | `/api/material-cards` |
| `pages/WarehouseAuditLog.tsx` | 1 | `/api/pos/reports/audit` |
| `pages/WarehouseInventoryPassport.tsx` | 1 | `/api/pos/inventory-passport` |
| `pages/WarehouseReportsAllTypes.ts` | 1 | `/api/pos` |
| `pages/WmsEoqPage.tsx` | 1 | `/api/wms/eoq/calculate` |
| `pages/WMSVarianceApproval.tsx` | 1 | `/api/wms/inventory-counts` |
| `pos-monitor/api/pos-wms-extra.api.ts` | 1 | `/api/pos` |
| `pos-monitor/components/PosAdminSections.tsx` | 1 | `/api/wms/warehouses` |
| `pos-monitor/pages/PosAdmin.tsx` | 1 | `/api/wms/warehouses/${id}/toggle-active` |
| `pos-monitor/pages/PosMaterialNew.tsx` | 1 | `/api/material-cards` |
| `pos-monitor/pages/PosMyInventory.tsx` | 1 | `/api/pos/employees/me/inventory/pdf` |

### A4. FE'da aniq matn-mosligi topilmagan BE endpointlari (240)

> ⚠️ Bu ro'yxat "o'lik" degani EMAS. Skript faqat literal URL satrlarini ko'radi; `BASE` konstanta yoki template bilan qurilgan chaqiruvlarni ko'rmaydi. Tekshiruvga ko'ra ~117 tasi aslida jonli (POS tablet klienti va `lib/api/*` orqali), ~123 tasi haqiqatan o'lik.

```
/barcode-warehouse/barcodes
/barcode-warehouse/barcodes/:p
/barcode-warehouse/barcodes/:p/qc
/barcode-warehouse/barcodes/:p/qc-decision
/barcode-warehouse/barcodes/scan/:p
/barcode-warehouse/cycle-count/submit
/barcode-warehouse/cycle-counts
/barcode-warehouse/cycle-counts/submit
/barcode-warehouse/dashboard
/barcode-warehouse/debts/:p
/barcode-warehouse/exit-logs
/barcode-warehouse/exit/:p/notify-security
/barcode-warehouse/issue
/barcode-warehouse/operator-balance
/barcode-warehouse/operator-debts
/barcode-warehouse/pick/:p
/barcode-warehouse/picking-tasks
/barcode-warehouse/picking/:p/complete
/barcode-warehouse/print-queue
/barcode-warehouse/production-complete
/barcode-warehouse/qc/:p
/barcode-warehouse/receive
/inventory/advanced/analytics
/inventory/advanced/barcodes
/inventory/advanced/counts
/inventory/materials/:p
/inventory/materials/low-stock
/iot/material-kits
/iot/material-kits/:p
/iot/material-kits/:p/items
/iot/material-kits/:p/prepare
/iot/material-kits/:p/ready
/iot/material-kits/generate
/logistics
/logistics/:p
/logistics/:p/assign-driver
/logistics/:p/complete
/material-balance/:p/history
/material-balance/:p/reconciliation
/material-balance/negative-stock-check
/material-balance/production/return
/material-balance/production/take
/material-balance/production/use
/material-balance/warehouse/:p
/material-cards/:p
/pos/anomalies
/pos/anomalies/:p
/pos/auth/login
/pos/auth/ping
/pos/auth/validate
/pos/barcode/ai-suggestion/pending
/pos/barcode/ai-suggestion/review
/pos/barcode/assign
/pos/barcode/generate
/pos/barcode/generate-ean13
/pos/barcode/lookup
/pos/barcode/print
/pos/barcode/scan
/pos/delivery-requests/:p/fulfill
/pos/delivery-requests/:p/fulfill-live
/pos/delivery-requests/compare/:p
/pos/employees/:p/balance
/pos/employees/:p/hr-check
/pos/employees/:p/statement
/pos/employees/department/:p/balance
/pos/employees/dismiss-check
/pos/employees/liability
/pos/employees/liability/:p
/pos/employees/me/balance
/pos/employees/me/checklist
/pos/employees/me/return
/pos/employees/write-off
/pos/gl/approve/:p
/pos/gl/movement/:p
/pos/handovers
/pos/handovers/:p
/pos/handovers/:p/cancel
/pos/handovers/:p/sign
/pos/handovers/pallets
/pos/handovers/pallets/balance
/pos/inventory-counts
/pos/inventory-counts/:p/pdf
/pos/inventory-counts/:p/variance
/pos/inventory-counts/:p/variance-decision
/pos/inventory-counts/approve
/pos/inventory-counts/lines/bulk-record
/pos/inventory-counts/lines/record
/pos/inventory-counts/variance-config
/pos/inventory-passport/:p
/pos/inventory-passport/:p/qc-decision
/pos/inventory-passport/quarantine
/pos/inventory/:p/adjust
/pos/inventory/low-stock
/pos/inventory/monthly-report
/pos/inventory/movements
/pos/label-config
/pos/label-config/:p
/pos/label-config/warehouse/:p
/pos/material-norms
/pos/material-norms/:p
/pos/material-norms/ai-recalculate
/pos/material-norms/deviation
/pos/mini-app/auth
/pos/mini-app/barcode/scan
/pos/mini-app/history
/pos/mini-app/materials
/pos/mini-app/pending-approvals
/pos/mini-app/requests
/pos/mini-app/requests/:p/approve
/pos/mini-app/requests/:p/reject
/pos/mini-app/warehouses
/pos/movements/:p/confirmations
/pos/movements/:p/history
/pos/movements/:p/pdf
/pos/movements/:p/recheck-techcard
/pos/movements/:p/status
/pos/movements/damage
/pos/movements/qc-decision
/pos/my-warehouses
/pos/operations/materials/:p/movements
/pos/operations/p2p/:p/receive
/pos/operations/p2p/pending
/pos/operations/warehouses
/pos/operations/warehouses/:p/issue
/pos/operations/warehouses/:p/receive
/pos/operations/warehouses/:p/stock
/pos/printer-config
/pos/printer-config/:p
/pos/printer-config/:p/test
/pos/printer-config/active
/pos/procurement/approval-chain/:p
/pos/procurement/requests
/pos/procurement/requests/:p
/pos/procurement/requests/:p/decide
/pos/procurement/requests/:p/receive
/pos/reports/abc-analysis
/pos/reports/inactive-materials
/pos/reports/kpi
/pos/reports/liabilities
/pos/reports/movement-stats
/pos/reports/stock
/pos/reports/three-way-match
/pos/reports/top-materials
/pos/requests
/pos/requests/:p
/pos/requests/approve
/pos/requests/issue
/pos/requests/reject
/pos/stock
/pos/stock/:p/:p
/pos/stock/adjust
/pos/stock/expiry-alerts
/pos/stock/issuable/:p
/pos/stock/low-alerts
/pos/stock/movements
/pos/sync/pull
/pos/sync/push
/pos/sync/status
/pos/warehouse-config/dashboard
/pos/warehouse-config/finished-goods-stock
/pos/warehouse-config/materials/:p/movements
/pos/warehouse-config/types
/pos/warehouse-config/warehouses
/pos/warehouse-config/warehouses/:p/stock
/pos/wh-features/employees/:p
/pos/wh-features/gl/journal
/pos/wh-features/grn
/pos/wh-features/grn/:p/approve
/pos/wh-features/kpi/system
/pos/wh-features/kpi/warehouses
/pos/wh-features/material/:p/profile
/pos/wh-features/movement/:p/auto-barcode
/pos/wh-features/movement/:p/gl-approve
/pos/wh-features/movement/:p/gl-post
/pos/wh-features/movement/:p/gl-postings
/pos/wh-features/movement/:p/move-to-quarantine
/pos/wh-features/three-way-match
/pos/wh-features/three-way-match/auto
/pos/wh-features/three-way-match/variances
/pos/wh-features/user/:p/warehouses
/pos/wh-features/warehouse/:p/employees
/pos/wh/alerts
/pos/wh/barcode/:p
/pos/wh/movements
/pos/wh/stock
/pos/wms/low-stock
/pos/wms/warehouse/:p/movements
/pos/wms/warehouse/:p/stock
/warehouse/bins/:p
/warehouse/bins/:p/360
/warehouse/dashboard
/warehouse/goods-receipts/:p/qc-decision
/warehouse/goods-receipts/:p/quarantine
/warehouse/integration
/warehouse/integration/fi/stock-valuation
/warehouse/integration/mm/pending-deliveries
/warehouse/integration/mm/reorder-suggestions
/warehouse/integration/summary
/warehouse/label/batches
/warehouse/label/batches/:p/status
/warehouse/label/history
/warehouse/label/print-job
/warehouse/orders-by-date/:p
/warehouse/stats/total
/warehouse/transactions
/warehouse/transfers/:p
/warehouse/transfers/:p/status
/warehouse/warehouses/:p/bins
/warehouse/warehouses/:p/lots
/warehouse/warehouses/:p/lots/:p
/warehouse/warehouses/:p/stats
/warehouse/warehouses/:p/stock
/warehouse/warehouses/:p/sync-pos
/warehouse/warehouses/:p/zones
/warehouse/warehouses/stats/total
/warehouse/zones/:p
/wms/alerts
/wms/batches
/wms/count-lines
/wms/eoq/recalculate-all
/wms/freeze-zones/:p/release
/wms/goods-issue/enforce-check
/wms/goods-issue/overflow
/wms/in-transit/shipments/:p
/wms/inventory
/wms/inventory-counts/:p/approve
/wms/inventory-counts/:p/variances
/wms/inventory-counts/accuracy
/wms/inventory/low-stock
/wms/material-life/:p
/wms/material-life/:p/substitutes
/wms/material-life/substitutes/:p
/wms/materials/:p/fifo-cost
/wms/movements
/wms/production-supply
/wms/rulon-cards/:p
/wms/rulon-cards/:p/status
/wms/rulon-cards/:p/weight
/wms/suppliers/:p/rating
/wms/warehouses/:p/inventory
```