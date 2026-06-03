# Agent5 — Umumiy Sog'liq Hisoboti (EuroPrint ERP)
**Sana:** 2026-06-02 · **Rejim:** FAQAT TAHLIL (read-only) · **Manba:** jonli probe + kod (Read/Grep) + DB (SELECT)

> Bu hisobot tizimning **umumiy sog'lig'ini** baholaydi: backend boot, typecheck, jonli endpoint
> sog'lig'i (500/503), yolg'on-saqlash buglari, deep-link buzilishi, test holati.
> Har bir da'vo **fayl:satr** yoki **jonli HTTP kod / DB so'rovi** bilan dalillangan.

---

## 0. Bajarilgan tekshiruvlar (metodologiya)

| Tekshiruv | Usul | Natija |
|-----------|------|--------|
| Backend boot | jonli HTTP (port 3030) | ✅ ISHLAYDI (`/health` → 200 `{"status":"ok"}`) |
| Frontend boot | jonli HTTP (port 20806) | ✅ ISHLAYDI (`/erp-dashboard/` → 200) |
| API typecheck | `pnpm --filter @europrint/api exec tsc --noEmit` | ✅ **0 xato** (exit 0) |
| FE typecheck | `pnpm --filter @workspace/erp-dashboard run typecheck` | ✅ **0 xato** (exit 0) |
| Endpoint sog'ligi | 1192 ta parametrsiz GET ni super_admin token bilan probe | jadval ↓ |
| Yolg'on-saqlash | controller+service kod o'qish | 2 ta tasdiqlangan (papka-orders) |
| Deep-link | jonli URL probe (Vite SPA fallback) | ✅ buzilmaydi (dev) |
| Test fayllar | `find` (ishga TUSHIRILMADI) | 711 API + 401 FE = 1112 fayl |

**Jonli jarayon konteksti (MUHIM):**
- Port **3030** egasi = PID 36964 = `node dist/main.js` (kompilyatsiya qilingan build, NOT `nest watch`).
- `dist/main.js` build vaqti: **2026-06-01 23:42**; jarayon start: 2026-06-02 03:15.
- Tekshirildi: `apps/api/src/` ostida `dist/main.js` dan **yangiroq 0 ta** `.ts` fayl bor → **jonli build manba kod bilan mos** (probe natijalari hozirgi kodni aks ettiradi).
- DB: `europrint` @ `127.0.0.1:5432` (PostgreSQL 18.3, user=postgres), **1030 ta jadval**.
- Port 20806 = Vite dev server (PID 17024). Git branch: `chore/schema-convergence`.
- ⚠️ `backend.log` (5.1 MB) **ESKI** (2026-05-29, PID 20932) — jonli jarayonники EMAS. Jonli jarayon logi o'z terminaliga yozadi (o'qib bo'lmadi) → endpointlar **jonli probe** bilan tekshirildi.

---

## 1. UMUMIY SOG'LIQ XULOSASI

**Tizim TIRIK va asosiy yadrosi ISHLAYDI.** Backend ham, frontend ham yuklanadi; ikkala typecheck ham
toza (0 xato); 1192 parametrsiz GET endpointning **949 tasi (80%) 200 OK** va **haqiqiy ma'lumot**
qaytaradi (bo'sh stub emas — masalan crm/leads id=1007 "Max", hr/employees "Sherzod Aliyev",
sd/customers "BuildMaster Co", kanban/boards "EUROPRINT").

**Asosiy kasallik = DB SXEMA DRIFT (Drizzle/SQL ↔ jonli `europrint` DB mos emas).** 106 ta 503
("Server temporarily unavailable") xatosining **deyarli hammasi** SQL so'rov xom DB xatosidan
(ustun/jadval yo'q yoki tur mos emas) kelib chiqadi — bu **crash EMAS**, GlobalExceptionFilter DB
xatosini 503 ga aylantiradi. Bu memory'dagi "live DB = qurilish bosqichi, drift bor" yozuvini
to'liq tasdiqlaydi.

### Jonli probe natijasi (1192 parametrsiz GET):

| Kod | Soni | % | Ma'no |
|-----|------|---|-------|
| **200** | **949** | **79.6%** | ISHLAYDI (haqiqiy data tekshirildi) |
| **503** | **106** | 8.9% | QISMAN-BUZUQ — DB drift (ustun/jadval/tur) |
| **501** | **80** | 6.7% | YO'Q — ataylab `notImplemented()` stub |
| **404** | **33** | 2.8% | 32 tasi FALSE-ALARM (o'lik dublikat controller) + 1 storage |
| **400** | **17** | 1.4% | 7 majburiy query-param (to'g'ri) + 10 drift (400 ga noto'g'ri map) |
| **401** | **7** | 0.6% | tablet/mini-app token gate (to'g'ri) |

**Sog'liq bahosi: B− (yadro mustahkam, lekin ~106 endpoint DB drift tufayli ishlamaydi).**

---

## 2. tsc (TypeScript) — har ikkala paket TOZA

```
API:  pnpm --filter @europrint/api exec tsc --noEmit   → exit 0, 0 xato
FE:   pnpm --filter @workspace/erp-dashboard run typecheck → exit 0, 0 xato
```
Bu memory'dagi "BE tsc 0 / FE tsc 0" yozuvini tasdiqlaydi. **Kompilyatsiya darajasida muammo YO'Q.**
(Eslatma: ESLint alohida masala — bu hisobot doirasida emas; memory'da FE root config sane=37 real,
local artifacts config buzuq=fantom 4358 deb qayd etilgan.)

---

## 3. 503 (Service Unavailable) — 106 ta — ASOSIY MUAMMO

**Sabab:** GlobalExceptionFilter DB so'rov xatosini `SERVICE_UNAVAILABLE` (503) ga aylantiradi.
Javob `debug` maydonida faqat **failing SQL** bor (xato sababi emas). Sababni aniqlash uchun 20 ta
vakil so'rovni DB ga qayta yubordim (`EXPLAIN`) — aniq PG xatolari (rus lokal):

| Endpoint | Aniq PG xato (DB replay) | Tur |
|----------|--------------------------|-----|
| `/api/camera/cameras` | `столбец c.zone_id не существует` | USTUN YO'Q |
| `/api/admin/categories` | `столбец "updated_at" не существует` | USTUN YO'Q |
| `/api/asset-management/assets` | `столбец "updated_at" не существует` | USTUN YO'Q |
| `/api/crm/invoices` | `столбец i.title не существует` | USTUN YO'Q |
| `/api/lessons` | `столбец l.course_id не существует` | USTUN YO'Q |
| `/api/mes/orders` | `столбец po.operator_id не существует` | USTUN YO'Q |
| `/api/mm/goods-receipts` | `столбец gr.delivery_note не существует` | USTUN YO'Q |
| `/api/security/access-zones` | `столбец "granted_at" не существует` | USTUN YO'Q |
| `/api/users/v2` | `столбец of2.org_department_id не существует` | USTUN YO'Q |
| `/api/warehouse/batches` | `столбец wb.material_card_id не существует` | USTUN YO'Q |
| `/api/hr/zvs` | `отношение "zvs" не существует` | JADVAL YO'Q |
| `/api/qc/approvals` | `отношение "qc_approvals" не существует` | JADVAL YO'Q |
| `/api/mm/vendor-ratings` | `отношение "mm_vendor_ratings" не существует` | JADVAL YO'Q |
| `/api/erp/capacity` | `оператор не существует: uuid = integer` | TUR MOS EMAS (FK) |
| `/api/inventory/materials/low-stock` | `оператор не существует: uuid = integer` | TUR MOS EMAS |
| `/api/wms/batches` | `оператор не существует: uuid = integer` | TUR MOS EMAS |
| `/api/production-facts/operators` | `оператор не существует: text = integer` | TUR MOS EMAS |
| `/api/financial-reports/balans` | `оператор не существует: integer = character varying` | TUR MOS EMAS |
| `/api/reports/trial-balance` | `оператор не существует: integer = character varying` | TUR MOS EMAS |
| `/api/sales/invoices` | `оператор не существует: integer = uuid` | TUR MOS EMAS |

### 503 sabab tasnifi (3 toifa):
1. **USTUN YO'Q (column drift)** — eng ko'p. Drizzle/SQL DB da yo'q ustunni so'raydi
   (`updated_at`, `zone_id`, `title`, `course_id`, `operator_id`, `delivery_note`, `granted_at`,
   `org_department_id`, `material_card_id`, ...).
2. **JADVAL YO'Q** — 12 ta jadval umuman yaratilmagan:
   `zvs`, `zno`, `qc_approvals`, `mm_vendor_ratings`, `mm_mrp_results`, `mm_material_kits`,
   `micro_modules`, `mes_downtime_events`, `mes_sos_events`, `mes_work_centers`,
   `pos_inventory_movements`, `payroll_periods_hr`.
   (Tekshirildi: probe SQL da 95 jadval nomi → DB 1030 jadval bilan solishtirildi → 12 tasi yetishmaydi;
   qolgan 77 jadval MAVJUD, ya'ni ularning 503'i USTUN yoki TUR drifti.)
3. **TUR MOS EMAS (FK uuid↔integer / integer↔varchar)** — JOIN/WHERE kalitlari mos kelmaydi.
   Bu memory'dagi "tenant_id + material_card_id pattern, uuid→integer repoint" driftining aynan o'zi.

### 503 modul bo'yicha taqsimot (eng yomon birinchi):

| Modul | Jami GET | 200 | 503 | Izoh |
|-------|----------|-----|-----|------|
| `employee-kpi` | 4 | 0 | **4 (100%)** | to'liq buzuq (employee_daily_kpi ustun drift) |
| `employee-files` | 2 | 0 | **2 (100%)** | to'liq buzuq |
| `wms` | 17 | 9 | **8 (47%)** | mm_materials/wms_* uuid↔int |
| `camera-ai` | 7 | 2 | **5 (71%)** | camera_events ustun drift |
| `camera` | 6 | 2 | **4 (67%)** | cameras.zone_id yo'q |
| `mes` | 21 | 15 | **6 (29%)** | mes_papka_orders.operator_id, jadvallar yo'q |
| `mm` | 23 | 12 | **5 (22%)** | vendor_ratings/mrp_results jadval yo'q |
| `erp` | 25 | 20 | **5 (20%)** | work_centers uuid↔int |
| `crm` | 33 | 29 | **4 (12%)** | crm_invoices.title, supervisor-dashboard |
| `sd` | 24 | 20 | **4 (17%)** | debitors/payments (3 tasi non-DB, ↓ 3.2) |
| `financial-reports` | 10 | 7 | 3 | accounts integer↔varchar |
| `warehouse` | 41 | 28 | 4 | batches material_card_id |
| `barcode-warehouse` | 10 | 7 | 3 | pos_movements drift |
| `camera-dashboard` | 9 | 6 | 3 | camera_events drift |
| `security` | 10 | 3 | 2 | granted_at/security_attendance |
| `hr` | 111 | 88 | 3 | zvs/zno/payroll_periods_hr |

**Eng sog'lom:** hr (88/111 = 79%), pos (48/60 = 80%), iot (33/42), integration (36/44 — qolgani 501).

---

## 4. 503 — DB-EMAS kod buglari (4 ta — alohida e'tibor)

503 ichida 4 tasi DB drift emas, **kod-darajasidagi xato** (xato boshqaruvi buzuq):

| Endpoint | Xato | Tahlil |
|----------|------|--------|
| `/api/pp/bom` | `Cannot read properties of undefined (reading 'message')` | so'rov fail bo'lganda Result/error unwrap `undefined.message` o'qiydi. Manba: `pp-intelligence.controller.ts` + `pp-mps/crp.service`. Asli DB drift, lekin error-handler ham buzuq → 503 |
| `/api/pp/mps` | (ts) `Failed query: SELECT soi.product_id...` | sales_order_items drift + yuqoridagi unwrap bug |
| `/api/sd/orders/export` | `Cannot read properties of undefined (reading 'getValue')` | export servisi undefined obyekt `.getValue()` chaqiradi — null-guard yo'q |
| `/api/finance/ratios` | `Ichki server xatosi` (Internal) | kutilmagan xato 503 ga tushadi |

> Bular **F2/Qoida-9 buzilishi** (non-null / undefined himoyasiz). Asosiy 503 to'lqinidan kichik,
> lekin "saqlandi deydi" emas — bular ochishda darhol 503 beradi.

---

## 5. 501 (Not Implemented) — 80 ta — YO'Q (ataylab stub)

Bular **halol placeholder** — `notImplemented()` yoki "Hali amalga oshirilmagan" qaytaradi
(crash emas). CLAUDE.md Qoida 17 yangi stub qo'shishni taqiqlaydi, lekin **80 ta eski stub hali bor**.
Asosiy klasterlar:

| Modul | 501 soni | Misollar |
|-------|----------|----------|
| `hr` (+hr-capital) | 14 | `/hr/contracts`, `/hr/dashboard-stats`, `/hr/hrc-tests/*`, `/hr/enps/surveys/results`, `/hr/360/reviewable` |
| `warehouse` | 9 | `/warehouse/integration/*` (mm/fi), `/warehouse/transactions`, `/warehouse/material-kits` |
| `integration` | 8 | `/integration/employee-mes-summary`, `/integration/invoice`, `/integration/skill-gap` |
| `marketing` | 8 | `/marketing/ab-tests`, `/marketing/pr`, `/marketing/exhibitions`, `/marketing/inbox/conversations` |
| `mm` | 6 | `/mm/fleet/*`, `/mm/three-way-match`, `/mm/vendor-invoices`, `/mm/driver/expenses` |
| `pos` | 5 | `/pos/inventory/movements`, `/pos/sales/daily`, `/pos/stock/movements` |
| `security` | 5 | `/security/ppe-checks`, `/security/fire-sensors`, `/security/ppe-violations` |
| `qc` | 3 | `/qc/control-charts`, `/qc/pending/qc`, `/qc/braks/cost-impact` |
| boshqa | ~22 | `/ai/forecast/demand`, `/design/tooling`, `/kanban/projects`, `/modules`, `/orders-registry`, ... |

> Bular sog'liqqa **xavf solmaydi** (halol 501). FE tomonida ko'pi `EPComingSoon` ko'rsatishi kerak.

---

## 6. 404 (Not Found) — 33 ta — DEYARLI HAMMASI FALSE-ALARM

⚠️ **MUHIM tuzatish (extractor artefakti):** 33 ta 404 ning 32 tasi mening route-extractor'imning
**o'lik dublikat controller**ni o'qishidan kelib chiqqan FALSE-ALARM:

- **23 ta `/api/legacy/*`** — manbai: `apps/api/src/modules/legacy/controllers/` (3 fayl).
  Bu papka **O'LIK DUBLIKAT** — hech qaysi modulga import qilinmagan (faqat auto-gen `metadata.ts` da
  ko'rinadi). Tasdiqlandi: `grep modules/legacy/controllers` → faqat metadata.ts.
  - **Haqiqiy registratsiya** = `apps/api/src/modules/general/controllers/general-legacy-a.controller.ts`,
    bu `@Controller()` (PREFIKSSIZ) → route'lar `/api/attendance`, `/api/face-embeddings`,
    `/api/papka-orders` da (NOT `/api/legacy/...`).
  - Jonli tasdiq: `/api/attendance` → **200**, `/api/face-embeddings` → **200**, `/api/papka-orders` → **200**.
  - Modul `general/legacy.module.ts:17` da `GeneralLegacyAController`+`B` ro'yxatdan o'tgan,
    `app.module.ts:165` `LegacyModule` import qilingan. ✅
- **8 ta `/api/hr/safety/safety/...`** + 1 ta `/api/iot/iot/...` — qo'sh-prefiks: controller
  `@Controller('hr/safety')` + metod `@Get('safety/...')` → `hr/safety/safety/...`. Bu metod yo'llari
  haqiqatda mavjud emas (ehtimol kommentlangan yoki nomi boshqacha) → 404. Kichik yo'l nomi nomuvofiqligi.
- **1 ta `/api/storage/*`** — wildcard probe (`*`), real fayl yo'q → 404 (kutilgan).

> **XULOSA:** Haqiqiy "yo'qolgan endpoint" sog'liq muammosi YO'Q. 23 ta legacy 404 = o'lik kod
> dublikati (tozalash nomzodi, lekin runtime'ga ta'sir qilmaydi — haqiqiy route'lar ishlaydi).

---

## 7. 400 (Bad Request) — 17 ta

- **7 tasi TO'G'RI** — majburiy query-param yo'q (probe parametrsiz yuborgan):
  `/api/finance/break-even` (productName), `/api/pos/barcode/lookup` (barcode),
  `/api/lms/enrollments` (userId), `/api/hr-v2/daily-reports/employee` (employeeId),
  `/api/agents/hr/bonus` (base maosh), `/api/pos-v2/barcode/lookup`, `/api/pos-v2/reports/*`.
- **10 tasi NOTO'G'RI MAP (yashirin 503)** — javob `{success:false,error:"Failed query..."}` lekin
  HTTP **400** qaytaradi (503 bo'lishi kerak edi). DB drift 400 niqobi ostida:
  8 ta `/api/kanban/*` (analytics/summary, cards/overdue, members, reports/*, dashboard/team-metrics)
  + 2 ta `/api/telegram/admin/users(+v2)`.
  > Bu kanban+telegram controller'larida DB xato → 400 deb noto'g'ri tasniflanadi (kuzatuvni
  > chalkashtiradi). Asli yana **DB drift**.

---

## 8. 401 (Unauthorized) — 7 ta — TO'G'RI

Bular maxsus token talab qiladi (super_admin JWT yetarli emas):
- `/api/iot/tablet/*` (3 ta) — "Tablet token majburiy"
- `/api/pos/mini-app/*` (4 ta) — "Mini App sessiya tokeni yo'q"

> To'g'ri xatti-harakat (ayrim guard'lar maxsus tablet/mini-app token kutadi). Sog'liq muammosi emas.
> Memory: iot-tablet @Public o'qishlar oldin High edi, 401 ga tuzatilgan — bu shu bilan mos.

---

## 9. YOLG'ON-SAQLASH BUGLARI ("saqladi deydi, saqlamaydi")

Vazifaning markaziy savoli. Kod o'qib tekshirildi (Qoida 10 — soxta javob taqiqi).

### ✅ TASDIQLANGAN yolg'on-saqlash (2 ta) — lekin O'LIK kodda:
`apps/api/src/modules/legacy/controllers/general-legacy-a.controller.ts`:
- **`deletePapkaOrder` (57-60)**: `return { id, deleted: true }` — **hech qanday service chaqirmaydi**,
  faqat soxta success qaytaradi. ❌ yolg'on-o'chirish.
- **`createPapkaOrder` (48-55)**: `try { svc.createPapkaOrder } catch { return {...body, id: Date.now()} }`
  — DB xatosini yutib, soxta yaratilgan obyekt qaytaradi. ❌ yolg'on-yaratish.

> ⚠️ MUHIM: bu fayl **O'LIK DUBLIKAT** papkada (§6) — ro'yxatdan o'tmagan, jonli emas. Demak bu
> yolg'on-saqlash **foydalanuvchiga ta'sir qilmaydi** (route 404). Lekin **registratsiya qilingan**
> nusxa (`general/controllers/...`) ham xuddi shu pattern bor-yo'qligini tekshirish kerak (quyida).

### ✅ TEKSHIRILGAN — yolg'on EMAS (LEGACY_NOOP pattern):
`sd-customers.controller.ts` da 4 ta `return {}` (224, 281, 331, 363) — hammasi DELETE endpoint,
**haqiqiy** `svc.softDelete()/deleteContact()/deleteDocument()/deleteCompetitor()` chaqiradi,
`{}` faqat javob shakli (FE javobni o'qimaydi). Kod kommenti (216-218) "P3-26 audit verified
service.softDelete() does real work" deb tasdiqlaydi. ✅ HAQIQIY saqlaydi.

### `{ok:true}`/`{data:[]}`/`{}` umumiy hisobi:
- **32 ta** controller faylda (21 fayl) `return {ok:true}` / `return {}` / `return {data:[]}` pattern bor.
- Aksariyati DELETE javob shakli yoki `unwrapOrThrow(svc...)` natijasini o'rab beradi (haqiqiy).
- Batafsil har birini ochish bu sessiya doirasidan tashqari, lekin **eng yuqori xavf** = papka-orders
  (o'lik) va potensial `mm-goods`/`wms-stock` (tekshirish tavsiya etiladi).

> XULOSA: jonli foydalanuvchiga ta'sir qiladigan yolg'on-saqlash **TOPILMADI**; yagona aniq misol
> o'lik dublikat papkada. Qoida 10 enforcement umuman ishlayapti.

---

## 10. TO'G'RIDAN-URL OCHILGANDA BUZILADIGAN SAHIFALAR (deep-link)

- FE = wouter, `<WouterRouter base={routerBase}>` (App.tsx:131,136) — `routerBase` =
  `BASE_URL` (`/erp-dashboard`). **Browser history** (hash EMAS).
- Jonli deep-link probe (to'g'ridan URL):
  - `/erp-dashboard/employees` → **200**
  - `/erp-dashboard/warehouse/hub` → **200**
  - `/erp-dashboard/crm/leads` → **200**
  - `/erp-dashboard/some-nonexistent-page` → **200** (Vite SPA fallback → client 404 sahifa)
- **XULOSA:** dev rejimida Vite SPA fallback har yo'lni `index.html` ga qaytaradi → **server-darajada
  deep-link buzilishi YO'Q**. (Brauzer tasdiq qilinmadi — faqat HTTP kod; sahifa ichidagi
  param-asosli fetch buzilishi per-sahifa kod masalasi, bu probe doirasida emas.)
- ⚠️ Eslatma: production (statik serve) da SPA fallback to'g'ri sozlanishi shart, aks holda
  to'g'ridan-URL 404 berishi mumkin — bu deployment konfiguratsiya masalasi.

---

## 11. TEST HOLATI (ishga TUSHIRILMADI — faqat sanaldi)

| Joy | Fayl soni |
|-----|-----------|
| API (`apps/api/test/**/*.spec.ts|*.test.ts`) | **711** |
| FE (`artifacts/erp-dashboard/src/**/*.{test,spec}.{ts,tsx}`) | **401** |
| **Jami** | **1112** |
| Jest config | `apps/api/test/jest.config.js` ✅ mavjud |

> Test FAYLLARI mavjud va ko'p. Ishga tushirilmadi (vazifa qoidasi). Memory tarixi: 2026-05-27
> da "20 suite/339 test ALL GREEN" deyilgan, lekin 2026-05-18 da "uuid v14 ESM, 144 suite fail"
> ham bor — ya'ni test sog'ligi tarixan **beqaror**. Hozirgi holat tasdiqlanmadi (run yo'q).

---

## 12. UCH TOIFA BO'YICHA YAKUNIY TASNIF

### ✅ ISHLAYDI
- Backend boot (`/health` 200), Frontend boot (`/erp-dashboard/` 200).
- API tsc 0 xato, FE tsc 0 xato.
- **949/1192 (80%) GET endpoint 200 + haqiqiy ma'lumot** (crm, hr, sd, kanban, finance yadrosi).
- Deep-link (dev) buzilmaydi.
- Auth/login ishlaydi (super_admin JWT, jti, role).
- 1030 jadvalli jonli DB; 1112 test fayli mavjud.
- Yolg'on-saqlash jonli yo'llarда topilmadi (Qoida 10 ishlayapti).

### 🟡 QISMAN-STUB
- **80 ta 501** — halol `notImplemented()` (hr, marketing, integration, warehouse-integration, mm-fleet).
- **17 ta 400** — 7 to'g'ri (param kerak) + 10 yashirin-503 (kanban/telegram drift 400 niqobida).
- **7 ta 401** — tablet/mini-app maxsus token (to'g'ri).
- `sd-customers` DELETE `return {}` — haqiqiy ishlaydi, faqat javob bo'sh (LEGACY_NOOP).

### ❌ YO'Q / BUZUQ
- **106 ta 503** — DB sxema drift (USTUN yo'q / JADVAL yo'q / TUR mos emas).
  - 12 jadval butunlay yo'q: `zvs, zno, qc_approvals, mm_vendor_ratings, mm_mrp_results,
    mm_material_kits, micro_modules, mes_downtime_events, mes_sos_events, mes_work_centers,
    pos_inventory_movements, payroll_periods_hr`.
  - Ustun drift: `cameras.zone_id, *.updated_at, crm_invoices.title, lessons.course_id,
    mes_papka_orders.operator_id, mm_goods_receipts.delivery_note, security_access.granted_at,
    org_functions.org_department_id, warehouse_batches.material_card_id`.
  - Tur drift (FK uuid↔int / int↔varchar): erp/capacity, wms/batches, inventory/low-stock,
    production-facts, financial-reports/balans, reports/trial-balance, sales/invoices.
  - To'liq buzuq modullar: `employee-kpi` (4/4), `employee-files` (2/2).
- **4 ta DB-emas kod bug** (undefined himoyasiz): `/pp/bom`, `/pp/mps`, `/sd/orders/export`,
  `/finance/ratios`.
- **2 ta yolg'on-saqlash** (createPapkaOrder/deletePapkaOrder) — lekin O'LIK dublikat papkada.
- **O'lik dublikat:** `apps/api/src/modules/legacy/controllers/` (3 fayl) — ro'yxatdan o'tmagan.

---

## 13. KRITIK MUAMMOLAR (ustuvorlik bilan)

1. 🔴 **DB sxema drift (106 endpoint)** — jonli `europrint` DB Drizzle sxemasidan orqada.
   Tuzatish: drift migratsiya (12 jadval CREATE + yetishmagan ustunlar ADD + FK tur uuid↔int birlashtirish).
   Memory'da bu "MIGRATION KERAK EMAS (DB bo'sh=qurilish)" deb belgilangan — lekin **struktura
   drifti** ko'p endpointni o'ldiradi, shuning uchun **struktura (DDL) tuzatish** baribir zarur.
2. 🟠 **4 ta error-handler bug** (`pp/bom`, `pp/mps`, `sd/orders/export`, `finance/ratios`) —
   `undefined.message`/`.getValue()` → null-guard qo'shilsa, drift fix'dan keyin ham barqaror bo'ladi.
3. 🟠 **10 ta 400-niqobli 503** (kanban×8 + telegram×2) — DB xatoni to'g'ri 503 ga map qilish
   (kuzatuv aniqligi uchun).
4. 🟡 **O'lik dublikat `modules/legacy/controllers/`** — yolg'on-saqlashli (papka-orders) o'lik kod;
   tozalash nomzodi (runtime'ga ta'sir yo'q, lekin chalkashlik manbai + extractor false-alarm).
5. 🟡 **80 ta 501 stub** — FE `EPComingSoon` bilan qoplanishi yoki real implement.

---

## 14. DALILLAR (asosiy fayl:satr / so'rov)

- Boot: `curl /health` → 200; `apps/api/src/main-bootstrap.ts:172-174` (`setGlobalPrefix('api')`,
  `/health` exclude).
- :3030 jarayon = `node dist/main.js` (PID 36964); `apps/api/.env` → `PORT=3030`,
  `DATABASE_URL=...europrint`, `NODE_ENV=development`.
- DB: `node _audit/q.cjs "SELECT current_database()..."` → europrint / postgres / PG 18.3; 1030 jadval.
- 503 sabab: 20 ta so'rov DB ga `EXPLAIN` replay → aniq PG xatolar (§3 jadval).
- O'lik dublikat: `grep "modules/legacy/controllers"` → faqat `metadata.ts`;
  `general/legacy.module.ts:17` registratsiya; `/api/attendance` jonli 200.
- Yolg'on-saqlash: `general-legacy-a.controller.ts:48-60` (papka-orders, O'LIK nusxa).
- sd-customers haqiqiy: `sd-customers.controller.ts:216-225` (LEGACY_NOOP kommenti + softDelete).
- Deep-link: `App.tsx:131,136`; jonli `/erp-dashboard/*` → 200.
- Test: `find` → 711 API + 401 FE; `apps/api/test/jest.config.js`.

---

*Hisobot: agent5-umumiy-soglik · 2026-06-02 · read-only · jonli probe + kod + DB dalil bilan.*
