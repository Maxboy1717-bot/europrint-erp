# PERF-1 — Tezlik / Og'ir So'rovlar Tahlili (kod + DB asosida)

> Sana: 2026-06-02 · Rol: 🔵 Tahlilchi (read-only) · Brauzer yo'q → kod + jonli DB
> (`europrint`, read-only `_audit/q.cjs`) asosida statik tahlil. Tarmoq vaqtlari (live
> timing) o'lchanmadi. Faqat shu hisobot yoziladi, kod/DB o'zgartirilmaydi.

## Qisqa kontekst (DB holati)
- Jonli `europrint` DB: **1032 jadval**, **1816 indeks**, lekin deyarli BO'SH
  (qurilish bosqichi). Eng katta jadvallar: `agents_audit_log` 3721, `daily_reports`
  **1890**, `audit_logs` 790; qolganlari < 100 qator. Ya'ni hozir hech narsa sekin
  emas — bularning hammasi **DB to'lganda yuzaga chiqadigan kelajak-risk**.
- Bitta istisno allaqachon o'smoqda: `daily_reports` 1890 qator va uning
  `employee_id` / `user_id` / `production_order_id` ustunlari **indekssiz** (pastda).

---

## 1. N+1 So'rov Patternlari

Statik qidiruv: `for (… of …)` ichida `await db/repo` chaqiruvi → 45 fayl nomzod.
Tasdiqlangan haqiqiy N+1 (list/detail yo'lida, har-qator so'rov):

| # | Fayl:qator | Pattern | Ta'sir |
|---|------------|---------|--------|
| **N1** | `modules/pp/application/queries/get-mrp-report.handler.ts:33-67` | Har `production_orders` qatori uchun BOM `SELECT` (`:38`), keyin har BOM-item uchun `stock_items` `SELECT` SKU bo'yicha (`:47`). 2 qavatli ichma-ich loop = **O(orders × items)** alohida so'rov | MRP hisobotda buyurtmalar/BOM-item ko'paysa portlaydi. To'g'rilash: bitta JOIN-li so'rov yoki `inArray(skus)` bilan ommaviy o'qish |
| **N2** | `modules/chat/chat-advanced.controller.ts:146-150` | Poll yaratilganda har `room member` uchun `getTotalUnreadCount(userId)` alohida so'rov (loop ichida) | Katta xonalarda har poll = N ta count-query. `getBulkUnread()` ga ko'chirilishi kerak (CLAUDE.md Qoida 6 da ham qayd etilgan) |
| **N3** | `modules/pos/application/services/warehouse-kpi.service.ts:62-68` | Har ombor (`row`) uchun `getUnitBreakdown(warehouseId)` alohida so'rov | Ombor soni ortganda KPI dashboard sekinlашadi. LATERAL/GROUP BY bilan bitta so'rovga jamlash mumkin |

Boshqa 42 nomzod (`pos-request.service`, `quarantine-workflow`, `mm-vendors-pr`,
`cash-register.repository`, ko'p `cron/*` va `telegram-bots/*`) ham loop-ichida-await
ishlatadi, **lekin** aksariyati:
- cron/seed/migration (foydalanuvchi so'roviga ta'sir qilmaydi, fon ish), yoki
- kichik fiksatsiyalangan ro'yxat (masalan bo'limlar) ustidan yuradi.

Ular real **endpoint** issiq-yo'lida emas, shuning uchun N1–N3 ustuvor.

**Tozalangan (false-positive — diqqat):**
- `modules/crm/analytics/cohort.service.ts` — 9 ta loop bor, **lekin barchasi
  xotirada** ishlaydi (Map/Set), DB so'rovi yo'q. Faylning o'zida "50k+ orders bo'lsa
  single-pass'ga ko'chir" izohi bor — yaxshi.
- `customer-360.helpers.ts` — barcha hisob xotirada, N+1 emas.
- `crm/leads/leads.service.ts:15-25` — to'g'ri paginatsiya (`page/limit/offset`),
  limit repo qatlamida. Memory'dagi "employees list 5 N+1 subquery" allaqachon
  olib tashlangan — qayta paydo bo'lmagan.

---

## 2. Yetishmayotgan Indekslar (kelajak-risk; DB hozir bo'sh)

Jonli DB'da FK-ga o'xshash issiq ustunlarni tekshirdik (`order_id, employee_id,
tenant_id, material_id, customer_id, production_order_id, user_id, room_id,
department_id`):

- Bunday ustunlar jami: **529**
- Ulardan **indekssiz: 383 (≈ 72%)**

Bu ustunlar deyarli hamma JOIN va `WHERE … = ?` filtrlarida ishlatiladi. DB
to'lganda indekssiz ustun = **full table scan** har so'rovda.

Yaqin-muddat eng xavfli (allaqachon data bor jadval):

| Jadval | Indekssiz ustun | Qator (hozir) | Izoh |
|--------|------------------|---------------|------|
| `daily_reports` | `employee_id`, `user_id`, `production_order_id` | **1890** | Eng tez o'sayotgan biznes jadval; HR daily-report endpointlari shu ustunlar bo'yicha filtrlaydi |
| `audit_logs` | `user_id` | 790 | Audit ko'rinishlari user bo'yicha filtrlanadi |
| `attendance` / `attendance_records` | `employee_id`, `user_id` | kam, tez o'sadi | Davomat har kuni qatorlar qo'shadi |

Boshqa katta klaster (DB to'lganda): `customer_orders.customer_id`,
`customer_order_items.order_id`, `bom_items.material_id`, `deliveries.order_id`,
`crm_leads.tenant_id`, `chat_polls.room_id`, `barcode_movements.production_order_id`
— hammasi indekssiz. (To'liq 383 ro'yxatni `_audit/q.cjs` bilan qayta olish mumkin.)

**Tavsiya:** har FK ustuniga `CREATE INDEX IF NOT EXISTS` (migration sifatida,
idempotent — DRIFT-NN uslubida). Avval yuqoridagi 3 ta data-bor jadvaldan boshlash.

---

## 3. Og'ir Endpointlar

- **Paginatsiyasiz list potensiali:** `findAll/list/getAll` metodli ~122 faylda
  fayl ichida `LIMIT` yo'q. Bularning bir qismi **false-positive** (limit repo
  qatlamiga delegatsiya qilingan, masalan `leads.service` → `crmLeadsRepo.findAll(limit,
  offset)`). Ammo ko'pchilik kichik lug'at-endpointlar (`departments`, `positions`,
  `crm-custom-fields`, `calendar-events`, `resources`) **butun jadvalni** qaytaradi —
  lug'at uchun maqbul, lekin tranzaksion jadvallar (orders, movements, reports)
  uchun paginatsiya majburiy bo'lishi kerak.
- **N1 (MRP report)** og'ir endpoint sifatida ham hisoblanadi: buyurtma×BOM×stock
  ichma-ich so'rovlar + JS-da hisob.
- **`get-mrp-report.handler.ts:28`** — `status != completed AND != cancelled`
  bo'yicha **barcha** ochiq buyurtmalarni limitsiz oladi, keyin har biriga
  qo'shimcha so'rov (N1 bilan birga ikki barobar og'ir).
- `SELECT *` (`db.select().from(...)` to'liq ustun) keng jadvallarda keng tarqalgan;
  faqat kerakli ustunlarni tanlash (`columns: {...}`) tarmoq/xotira yukini kamaytiradi.

---

## 4. Frontend Bundle

`artifacts/erp-dashboard/dist/public/assets` — jami **17 MB**, **573 chunk**.

**Yaxshi:** route-darajasida lazy-loading ishlaydi — `src/routes/*Routes.tsx`
(Warehouse 32, Production 64, HR 44, CRM 38, Admin 28, …) `lazy(() => import())`
ishlatadi. Shu sabab 573 ta alohida chunk bor.

**Asosiy muammo — ulkan eager chunk:**
| Chunk | Hajm | Holat |
|-------|------|-------|
| `index-7Ve_GZz7.js` | **3.3 MB** | `index.html` da to'g'ridan-to'g'ri yuklanadi (entry) |
| `index-DPYEfPqu.js` | **3.3 MB** | ikkinchi index (vendor) |
| `MonthlyReportTab` | 388 KB | |
| `generateCategoricalChart` (recharts) | 351 KB | |
| `html2canvas.esm` | 196 KB | |

- `vite.config.ts` da **`build.rollupOptions.output.manualChunks` YO'Q** →
  vendor kutubxonalar bo'lib chiqilmagan, hammasi bitta(ikkita) index'ga yig'ilgan.
  Birinchi paint'da ~3.3 MB JS yuklanadi (gzip'siz).
- **Og'ir kutubxonalar** (`package.json`): `recharts`, `leaflet` +
  `react-leaflet` + `react-leaflet-cluster` + `leaflet.heat`, `jspdf` +
  `jspdf-autotable`, `@e965/xlsx`, `html2canvas`, `@picovoice/porcupine-web`
  (voice wake-word), `@zxing/library` (barcode), `framer-motion`, `dexie`,
  `socket.io-client`, `@hello-pangea/dnd` + `@dnd-kit/*`. Bularning ko'pi faqat
  ayrim sahifalarda kerak — vendor-splitting + sahifaga lazy import shart.
- `sourcemap` prod'da `SENTRY_AUTH_TOKEN` bo'lmasa o'chiq — yaxshi.
- PWA Workbox `maxEntries: 300` JS/CSS assets cache — 573 chunk uchun yetarli,
  lekin chegaraga yaqin.

**Tavsiya:** `manualChunks` qo'shib `react`/`recharts`/`leaflet`/`pdf(jspdf+html2canvas)`/
`xlsx` ni alohida vendor-chunk'larga ajratish; xarita/barcode/voice/pdf
kutubxonalarini faqat ishlatadigan sahifada dinamik `import()` qilish.

---

## 5. Kelajak-Masshtab Risklari

1. **Indekssiz FK (72%)** — DB to'lishi bilan JOIN/filtr full-scan'ga aylanadi.
   Eng birinchi `daily_reports`, `audit_logs`, `attendance*` (allaqachon o'smoqda).
2. **N+1 (MRP/chat/warehouse-kpi)** — qator soni o'sganda chiziqli (yoki MRP'da
   kvadratik) so'rov portlashi.
3. **Limitsiz list** — tranzaksion jadvallar (orders, movements, daily_reports)
   to'lganda butun jadvalni qaytaradigan endpointlar sekinlashadi + katta JSON.
4. **FE client-side filtrlash** — `src/pages` da 353 fayl `useQuery` ishlatadi;
   ko'pi natijani brauzerda `.filter()` qiladi. Backend hozir kichik to'plam
   qaytarayotgani uchun ishlaydi; data o'sganda server-side filtr/paginatsiya kerak.
5. **3.3 MB eager bundle** — sekin tarmoqda (zavod planshetlari, mobil) birinchi
   yuklanish juda sekin; PWA cache faqat takroriy tashrifda yordam beradi.
6. **`SELECT *` keng jadvallarda** — ustun soni ko'p jadvallarda tarmoq/serializatsiya
   yuki.

---

## 6. Tavsiyalar (ustuvorlik bo'yicha)

> Eslatma: bu **tavsiyalar** — Qoida 23 bo'yicha tahlilchi hech narsani bajarmaydi;
> bajarish faqat egasi aniq buyurganda.

**Yuqori (data o'sishidan oldin arzon, katta foyda):**
1. Indeks qo'shish — avval `daily_reports(employee_id)`, `(user_id)`,
   `(production_order_id)`; `audit_logs(user_id)`; `attendance*(employee_id,user_id)`.
   So'ng qolgan 383 FK ustuniga idempotent migration (DRIFT-NN uslubi).
2. `get-mrp-report.handler.ts` — N+1 ni JOIN yoki `inArray` bilan ommaviy o'qishga
   o'tkazish; ochiq buyurtmalarga `LIMIT`/paginatsiya.
3. FE: `vite.config.ts` ga `manualChunks` qo'shib vendor-splitting; xarita/pdf/
   barcode/voice kutubxonalarni sahifaga lazy `import()`.

**O'rta:**
4. `chat-advanced.controller.ts` poll-loop → `getBulkUnread()` (Qoida 6).
5. `warehouse-kpi.service.ts` — per-warehouse breakdown'ni bitta GROUP BY so'rovga.
6. Tranzaksion list-endpointlarga server-side paginatsiya majburiyligini ta'minlash.

**Past (kod sifati):**
7. `SELECT *` o'rniga kerakli ustunlarni tanlash (keng jadvallarda).
8. FE client-side `.filter()` ni server-side filtr/paginatsiyaga ko'chirish
   (data o'sgan sayin).

---

### Dalillar (asosiy fayl:qator)
- N+1: `get-mrp-report.handler.ts:33-67`, `chat-advanced.controller.ts:146-150`,
  `warehouse-kpi.service.ts:62-68`
- Indeks: `_audit/q.cjs` → 383/529 indekssiz FK ustun; `daily_reports` 1890 qator
- Bundle: `dist/public/assets/index-7Ve_GZz7.js` 3.3 MB; `vite.config.ts` da
  `manualChunks` yo'q (104-296 plugins; build 99-103)
- False-positive: `cohort.service.ts` (xotira), `customer-360.helpers.ts` (xotira),
  `leads.service.ts:15-25` (paginatsiya bor)
