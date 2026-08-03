# CCA Guruh 2 — Soxta muvaffaqiyat / Jim ma'lumot yo'qotish (Qoida 10/17/Q-40/Q-43)

> **Rol:** Tahlilchi (QAT'IY READ-ONLY). Hech bir endpoint JONLI chaqirilmadi — kod statik
> tahlili + read-only grep + FE chaqiruv tekshiruvi. Manba: `apps/api/src` + `artifacts/erp-dashboard/src`.
> **Sana:** 2026-06-03. **Branch:** chore/schema-convergence.
> **Asos:** `docs/status2-write-katalog-2026-06-02.md` (kecha) qayta tekshirildi (STALENESS) — qayta hosil qilinmadi.

---

## 0. XULOSA (TL;DR)

- Kecha (06-02) katalogi **18 fake-create** sanagan edi. Bugun (06-03) 5 commit ularning bir qismini tuzatdi.
- **Hozirgi holat: 12 ta soxta-muvaffaqiyat (fake-create/echo) qoldi.** Shundan:
  - **3 ta AKTIV jim ma'lumot yo'qotish** (FE forma chaqiradi, 200 qaytaradi, DB yozmaydi) — **eng yomon**.
  - **1 ta AKTIV soxta workflow** (QC approve/reject — 8 endpoint, 2 jonli sahifa) — **eng yomon**, lekin **halol deferred** (`deferred-decisions.md` STAGE 1.3, sabab: kanonik order-status jadval noaniq).
  - **5 ta o'lik echo** (`POST` echo, lekin yonida REAL `PUT`/`PATCH` bor; FE real yo'ldan saqlaydi) — **yumshoq** (ma'lumot yo'qolmaydi).
  - **3 ta orphan fake** (FE umuman chaqirmaydi) — **past** (faqat kelajak xavfi).
- **6 ta kechagi fake-create BUGUN TUZATILDI** (asset depreciate/insurance/maintenance, SDSettings narx, finance inventory-counts/asset-inventory, warehouse goods-receipt lines, warehouse material create). 2 ta **fake→halol 501** ga aylandi (design/orders, design messages).
- **1 ta kechagi DA'VO STALE/YOLG'ON bo'lib chiqdi:** "NotificationSettings 40 toggle jim tashlanadi" — **NOTO'G'RI**: FE `PATCH /api/notifications/preferences` orqali REAL saqlaydi.
- **Halol 501 (NotImplementedException) write controllerlarda:** ~149 call-site / 42 fayl. Bular qoidaga muvofiq (Qoida 10/17 ruxsat bergan halol "tayyor emas").

**Eng muhim 1 jumla:** Eng katta haqiqiy zarar — **QC approve/reject** (jonli `QCApproval.tsx` + `FinanceApproval.tsx`: foydalanuvchi "Tasdiqlash" bosadi, 200 keladi, lekin order statusi DB'da o'zgarmaydi) — lekin u **bilib turib** deferred (jadval noaniq). Avtomatik tuzatish mumkin bo'lgan toza ko'rinmas yo'qotish — **HR davomat** (`/api/attendance`) va **CRM lead email**.

---

## 1. TO'LIQ FAKE-CREATE / ECHO RO'YXATI (12 ta qolgan)

> Ustunlar: Endpoint | fayl:satr | soxta kod | maqsad jadval bor? | FE chaqiradimi? | tur | severity

### 1.A — AKTIV JIM MA'LUMOT YO'QOTISH (FE saqlaydi, DB yozmaydi) 🔴 ENG YOMON

| # | Endpoint | fayl:satr | Soxta kod | Jadval bor? | FE chaqiradi? | Severity |
|---|----------|-----------|-----------|-------------|---------------|----------|
| 1 | `POST /api/attendance` | `general/controllers/general-legacy-b.controller.ts:205` | `return { id: Date.now(), ...dto, created: true }` | ✅ `attendance` BOR | ✅ **HA** — `components/AddAttendanceDialog.tsx:55` → `POST /api/attendance` | 🔴 **HIGH** |
| 2 | `POST /api/crm/leads/:id/emails` | `crm/presentation/crm-leads.controller.ts:186` | `return { id: Date.now(), leadId, ...parsed, sent: true }` | ❌ email-log jadval yo'q | ⚠️ tekshirilmagan (grep FE bo'sh — ehtimoliy orphan) | 🟠 **MED** |
| 3 | `POST /api/iot-sensors` | `iot/presentation/iot-sensors-main.controller.ts:145` | `return { id: Date.now(), ...dto, created: true }` | ✅ `iot_sensors` BOR | ❌ YO'Q (sensor-ro'yxat formasi yo'q) | 🟡 **LOW** — **halol deferred** (`docs/deferred-iot-sensor-create-2026-06-02.md`) |

> **#1 (HR davomat)** — eng toza tuzatiladigan AKTIV yo'qotish: jadval `attendance` BOR, FE `AddAttendanceDialog` aynan `/api/attendance`ga POST qiladi. **Route to'qnashuvi:** `employee-kpi-compat.controller.ts:115` ham `@Post('attendance')` ga ega, lekin uning bazasi `@Controller('employee-kpi')` → `POST /api/employee-kpi/attendance` (REAL, `svc.recordAttendance`). Soxtasi `@Controller()` (bo'sh baza) → `POST /api/attendance`. FE bo'sh-baza (fake) yo'liga uradi.
> **#3 (IoT)** — kanonik real insert MAVJUD (`iot/sensors/sensors.repository.ts:40`) lekin HECH BIR modulda ro'yxatdan o'tmagan (dead-wired) → egasi option (c) deferred. FE chaqiruvchi yo'q → hozir hech narsa yo'qolmayapti.

### 1.B — AKTIV SOXTA WORKFLOW (echo, real workflow kutiladi) 🔴 + halol deferred

| # | Endpoint(lar) | fayl:satr | Soxta kod | FE chaqiradi? | Severity |
|---|---------------|-----------|-----------|---------------|----------|
| 4 | `PATCH/POST /api/qc/approve/finance/:orderId`<br>`PATCH/POST /api/qc/approve/qc/:orderId`<br>`PATCH/POST /api/qc/reject/:orderId`<br>`PATCH/POST /api/qc/inspector-submit/:orderId` (**8 endpoint**) | `qc/presentation/qc-defects.controller.ts:147,157,167,177,187,197,+inspector-submit` | `return { orderId, approved/rejected/submitted: true }` (faqat Zod parse, DB yozmaydi) | ✅ **HA** — `pages/QCApproval.tsx:75,92,119` + `pages/FinanceApproval.tsx:52,68` | 🔴 **HIGH** (lekin **halol deferred**) |

> **Bu eng katta biznes-ta'sirli ko'rinmas yo'qotish:** ikki jonli tasdiqlash sahifasi (QC + Moliya) "Tasdiqlash/Rad etish" bosilganda 200 oladi, ro'yxatni invalidate qiladi, lekin order statusi DB'da o'zgarmaydi → keyingi yuklamada order yana "pending" bo'lib qaytadi.
> **Nega hali fake (commit `5938c65a` ga qaramay):** o'sha commit FAQAT hujjat qo'shdi (`deferred-decisions.md` STAGE 1.3), kodni o'zgartirmadi. Sabab (Q-34): real "UPDATE" jadvali GENUINELY noaniq — `papka_orders` xabar jadvali (lekin `FinanceApproval` uni order deb o'qiydi), `GET /api/qc/pending/qc` backend handleri yo'q, `qc_inspections` bo'sh, `sales_orders` da `qc_status` ustuni yo'q. Egasiz jadval tanlash = yomonroq. **Halol deferred deb tasniflanadi**, lekin AKTIV foydalanuvchi-ko'rinadigan no-op bo'lib qoladi.

### 1.C — O'LIK ECHO (POST echo, lekin yonida REAL PUT/PATCH; FE real yo'ldan saqlaydi) 🟢 YUMSHOQ

> Bular Qoida 10 buzadi (soxta `{success:true}`), lekin **ma'lumot yo'qolmaydi** — chunki FE haqiqiy saqlash uchun qo'shni REAL `PUT`/`PATCH` endpointini ishlatadi. POST shunchaki ishlatilmaydigan vestigial qoldiq.

| # | O'lik POST echo | fayl:satr | REAL saqlash yo'li (yonida) | FE qaysi yo'lni ishlatadi |
|---|-----------------|-----------|------------------------------|----------------------------|
| 5 | `POST /api/finance/cfo-config` | `finance/presentation/finance-cfo-config.controller.ts:37` `{success:true}` | `PUT /:key` → `cfoConfig.update()` (REAL) | `pages/CfoConfigSettings.tsx:47` → **PUT** ✅ |
| 6 | `POST /api/cc/notification-prefs` | `communication-center/presentation/cc-notification-prefs.controller.ts:39` `{success:true}` | `PUT` → `repo.upsert()` (REAL) | (NotificationSettings FE boshqa endpoint ishlatadi — pastga qara) |
| 7 | `POST /api/ideal-rasm` | `remaining/ideal-rasm.controller.ts:32` `{success:true}` | `PUT` / `PUT :key` → `svc.updateAll/updateOne()` (REAL) | tekshirilmagan (PUT real) |
| 8 | `PATCH /api/warehouse/transfers/:id/status` | `wms/presentation/wms-warehouse-gateway.controller.ts:102` `{ id, ...dto }` echo | (yo'q — transfer status real update yo'q) | tekshirilmagan | 
| 9 | `GET /api/warehouse/transfers/:id` | `wms/presentation/wms-warehouse-gateway.controller.ts:89` `{ id, status:'pending' }` hardcoded | (READ-echo, write emas) | tekshirilmagan |

> #8/#9 aslida "yonida real yo'q" — lekin #8 PATCH transfer-status va #9 GET hardcoded **kam ishlatiladigan** (transfer ro'yxati boshqa endpointdan keladi). Ular o'lik/echo, lekin AKTIV forma-yo'qotish emas. #5/#6/#7 esa aniq "POST o'lik, PUT real".

### 1.D — ORPHAN FAKE (FE umuman chaqirmaydi) 🟡 PAST

| # | Endpoint | fayl:satr | Soxta kod | FE chaqiradi? |
|---|----------|-----------|-----------|---------------|
| 10 | `POST /api/wms/inventory` | `wms/presentation/wms-inventory.controller.ts:51` | `return { success: true }` (`crudSvc` in'eksiya qilingan, lekin ishlatilmagan) | ❌ YO'Q |
| 11 | `POST /api/wms/stock` | `wms/presentation/wms-stock.controller.ts:52` | `return { success: true }` | ❌ YO'Q |
| 12 | `POST /api/warehouse-rental/.../recalculate` | `wms/presentation/warehouse-rental.controller.ts:119` | `{ success: true }` | tekshirilmagan (kichik) |

---

## 2. FALSE-POSITIVE bo'lib chiqqan signallar (REAL — soxta EMAS)

Grep marker chiqargan, lekin tekshirilganda REAL bo'lgan (katalog metodologiyasini tasdiqlaydi):

| Endpoint | fayl:satr | Nega REAL |
|----------|-----------|-----------|
| `general-legacy-a` `machine-tasks` / `planning/operations` | `general-legacy-a.controller.ts:160,179` | `id: Date.now()` FAQAT `.catch()` ichida (xato fallback). Avval real `svc.create*()` chaqiriladi. |
| design-extended `markNotificationRead` | `design-extended.controller.ts:80-82` | `svc.markNotificationRead(id)` (REAL UPDATE) THEN `{ id, read:true }` tasdiq qaytaradi. |
| barcode-warehouse.service `{success:true}` ×6 | `compatibility/barcode-warehouse.service.ts:82,93,104,113,157,171` | Real `UPDATE ... WHERE id=...` so'rovidan KEYIN `{success:true}` tasdiq (so'rov→tasdiq pattern). |
| candidates-compat `deleteCandidate` | `compatibility/candidates-compat.service.ts:182` | Real `UPDATE candidates SET deleted_at=NOW()` THEN `{ ok:true, deleted:true }` (soft-delete). |
| WMS gateway `BIN-/LOT-/INV-/${Date.now()}` | `wms-gateway-*.controller.ts:128,129,158,134` | `Date.now()` — bu **raqam-generatsiya** (bin/lot/batch kodi), fake-create ID emas. |
| admin/auth/ai/cc-workflow `{ ok:true, data:... }` ×ko'p | turli | Bu **Result pattern** (`ok:true` = muvaffaqiyat belgisi), soxta javob emas. |

---

## 3. KECHAGI KATALOG bilan FARQ (06-02 → 06-03)

### 3.A — BUGUN TUZATILGAN (fake → REAL) ✅ 6 ta

| Kechagi # | Endpoint | Tuzatuvchi commit | Hozirgi holat |
|-----------|----------|-------------------|---------------|
| #1 | `POST /asset-management/insurance` | `64d093f3` | REAL — `svc.createInsurance` → `repo.insertInsurance` (`db.insert`) |
| #2 | `PUT/POST /asset-management/assets/:id/depreciate` | `64d093f3` | REAL — `svc.depreciateAsset` → `repo.depreciateAsset` (`db.update`) |
| #3 | `PUT/PATCH /asset-management/maintenance/:id/complete` | `64d093f3` | REAL — `svc.completeMaintenance` → `repo.completeMaintenance` |
| #6 | `POST /finance-extended/inventory-counts` | (06-02..03) | REAL — `svc.createInventoryCount(dto)` (`finance-extended-income.controller.ts:84`) |
| #7 | `POST /finance-extended/asset-inventory` | (06-02..03) | REAL — `svc.createAsset(dto)` (`:101`) |
| #10 | `POST /warehouse/goods-receipts/:id/lines` | (06-02..03) | REAL — `svc.addGoodsReceiptLine(...)` (`wms-warehouse-gateway.controller.ts:205`) |
| (forma) | SDSettings narx (WHERE id=NULL, `{updated:true}`) | `29d637a6` | REAL — `upsertPriceFormula` → `INSERT...ON CONFLICT` + `UPDATE WHERE id=1` (`drizzle-quotation.repo.ts:225`) |
| (yangi) | `POST /warehouse/materials` | `1a45b326` | REAL — `svc.createMaterial(dto)` → material_cards INSERT |

### 3.B — fake → HALOL 501 ga aylandi ✅ (yaxshilanish) 2 ta

| Kechagi # | Endpoint | Hozirgi holat |
|-----------|----------|---------------|
| #4 | `POST /design/orders` | Halol `NotImplementedException` (`design.controller.ts:206`) + izoh (kanonik yo'l = `POST /design`) |
| #5 | `POST /design/orders/:id/messages` | Halol `NotImplementedException` (`:218`) — `design_order_messages` jadval yo'q |

### 3.C — HALI FAKE (regress emas, eski qoldiq) ⚠️ — yuqoridagi §1 ro'yxati

`POST /api/attendance` (#1), CRM email (#2), IoT sensor (#3), QC approve/reject (#4 klaster), cfo-config/cc-prefs/ideal-rasm POST echolari (#5-7), transfer GET/PATCH (#8-9), wms-inventory/stock (#10-11).

### 3.D — STALE/YOLG'ON bo'lib chiqqan kechagi DA'VO ❌ 1 ta

| Da'vo (forma tahlili) | Haqiqat (06-03 tasdiq) |
|------------------------|-------------------------|
| "NotificationSettings matritsa — 40 toggle jim tashlanadi" | **NOTO'G'RI.** FE `pages/NotificationSettings.tsx:64` → `PATCH /api/notifications/preferences` → `notifications.controller.ts:159` → `prefsSvc.updatePreferences(user.id, dto)` = **REAL saqlaydi.** (Topilgan `cc/notification-prefs` POST echo — BOSHQA, ishlatilmaydigan endpoint.) |

> ⭐ Kechagi "MA'LUM RO'YXAT" dagi boshqa bandlar:
> - SDSettings narx → **TUZATILDI** (3.A)
> - QC approve/reject → **TASDIQLANDI fake** (§1.B #4), lekin halol deferred
> - Asset depreciate/maintenance → **TUZATILDI** (3.A)
> - HR davomat (legacy-b `id:Date.now()`) → **TASDIQLANDI fake + AKTIV FE** (§1.A #1)
> - CFO config POST → **o'lik echo** (real yo'l = PUT, §1.C #5)
> - CRM lead email → **TASDIQLANDI fake** (§1.A #2)
> - IoT sensors create → **TASDIQLANDI fake + halol deferred** (§1.A #3)
> - Transfer GET/PATCH echo → **TASDIQLANDI echo** (§1.C #8-9)

---

## 4. HALOL 501 vs SHOULD-WORK

- **Halol 501 (NotImplementedException) write yo'lida:** ~149 call-site / 42 controller fayl. Bular Qoida 10/17 ga MUVOFIQ (halol "tayyor emas", soxta 200 emas).
- **Eng zich halol-501 klasterlari** (status2-katalogdan, qayta tasdiqlandi):
  - **iot/production-sessions** — ~14 endpoint (butun tablet ishlab-chiqarish oqimi stub).
  - **hr-dashboard / hrc-tests** — ~10 (pip, birthdays, daily-reports, sessions, questions).
  - **wms barcode/integration** — ~7.
  - **mm 3way-match / fleet / vendor-invoices** — ~6.
  - **pp technology cards** (generate/optimize/reject) — 3.
  - **lms** (DELETE lessons, misc, view) — 3.
- **"Ishlashi kerak edi" lekin 501** (eng shubhali — kelajak ish): `iot/production-sessions/*` (tablet oqimi UI mavjud), `qc/lab-tests`, `pp/technology/cards/generate`. Bular halol, lekin vizyon bo'yicha funksional bo'lishi kerak.

> **Soxta-muvaffaqiyat (eng yomon) vs halol 501 farqi:** soxta 200 (12 ta, §1) foydalanuvchini ALDAYDI (ishladi deb o'ylaydi); halol 501 (149) ROST ("hali yo'q"). Q-40 bo'yicha faqat soxta-muvaffaqiyat TAQIQ; 501 ruxsat.

---

## 5. FORMA SAQLASH FOIZI (modul bo'yicha)

> **Asos:** kechagi `status2-write-katalog` (1340 write dekorator, 301 fayl) + bugungi tekshiruv.
> Metodologiya cheklovi: 1340 endpoint bittalab o'qilmadi — signal-skan + servis-INSERT tasdiq.
> "Forma" ≈ FE mutation chaqiradigan write endpoint. Quyidagi foizlar **endpoint-darajasi** (forma-komponent emas).

| Modul | Write endpoint (taxm.) | REAL saqlaydi | Soxta/echo | Halol 501 | Saqlash sifati |
|-------|------------------------|---------------|------------|-----------|----------------|
| **finance** (GL/AR/AP/payroll) | ~24 fayl | ~95% | 1 o'lik echo (cfo POST) | 1 (payroll approve) | 🟢 95% |
| **hr** | ~162 endpoint | ~96% | 1 AKTIV fake (davomat) | ~10 (dashboard/tests) | 🟢 ~94% |
| **sd** (order/quotation) | yuqori | ~98% | 0 (SDSettings tuzatildi) | bir nechta | 🟢 ~98% |
| **pp** | ~9 fayl INSERT | ~90% | 0 | 3 (tech cards) | 🟢 ~90% |
| **qc** | ~13 fayl | ~85% defects | **8 echo (approve/reject)** | 2 | 🔴 approve oqimi 0% |
| **wms** | ~19 fayl | ~80% | 4-5 echo/orphan (inventory/stock/transfer/recalc) | ~7 (barcode) | 🟠 ~75% |
| **mm** | ~6 fayl | mix | 0 | ~6 (3way/fleet/invoices) | 🟠 ~60% |
| **mes** | ~7 fayl | ~95% | 0 | bir nechta | 🟢 ~90% |
| **crm** | ~15 fayl | ~93% | 1 fake (lead email) | 0 | 🟢 ~93% |
| **iot** | ~11 fayl | ~10% | 1 fake (sensor) | ~14 (sessions) | 🔴 ~10% |
| **compatibility** (asset/warehouse) | ~142 endpoint | ~95% (asset tuzatildi) | ~2 (transfer echo) | ~5 (saas) | 🟢 ~92% |
| **communication-center** | mix | ~90% | 1 o'lik echo (prefs POST) | bir nechta | 🟢 ~90% |
| **design** | ~4 write | ~50% | 0 (fake→501) | 2 (orders/messages) | 🟡 50% (lekin halol) |
| **lms / kanban / pos** | mix | ~85% | 0 | ~5 (lms/pos-stub) | 🟢 ~85% |

**Umumiy taxmin:** ~1340 write endpointdan **~95%+ REAL saqlaydi**, **12 soxta-muvaffaqiyat** (~0.9%), **~149 halol-501** (~11%). Forma-darajasida (FE mutation) eng achchiq nuqtalar: **QC tasdiqlash (0%)** va **IoT (~10%)**.

---

## 6. TAVSIYALAR (faqat ma'lumot — bajarish egasi ruxsati bilan, Q-23/Q-28)

> Tahlilchi roli: bu tavsiyalar BAJARILMAYDI. Faqat ustuvorlik ko'rsatkichi.

1. **Toza tuzatish (jadval + FE aniq):** `POST /api/attendance` (#1) → `attendance` jadvalga real INSERT (FE `AddAttendanceDialog` mavjud, jadval mavjud — Q-34 toza fix).
2. **O'lik echo tozalash:** `POST` echolarini (cfo-config/cc-prefs/ideal-rasm/wms-inventory/wms-stock) o'chirish yoki halol 501 qilish — ma'lumot yo'qolmaydi, lekin Qoida 10 buzadi (chalg'ituvchi 200).
3. **QC approve/reject (#4):** kanonik order-status jadval qarori egasidan kutilmoqda (`deferred-decisions.md` STAGE 1.3). Qaror chiqquncha **halol 501** ga aylantirish AKTIV aldovni to'xtatadi (hozir 200 qaytaradi → foydalanuvchi tasdiqladim deb o'ylaydi).
4. **CRM lead email (#2):** email-log jadval yo'q → halol 501 yoki jadval + real log (egasi qarori).
5. **IoT sensor (#3):** `SensorsService`/`SensorsRepository` ni `iot.module.ts` ga provider qilib ulash (option a) — kanonik insert mavjud. FE chaqiruvchi yo'q → past ustuvorlik.

---

## 7. QAMROV BAYONOTI (halol)

- **Tekshirilgan:** kechagi 18 fake-create ro'yxatining HAMMASI qayta o'qildi (fayl:satr darajasida); 8 QC endpoint; route-to'qnashuv (`/attendance` ×2 handler) hal qilindi; 6 false-positive REAL deb tasdiqlandi; NotificationSettings da'vosi rad etildi.
- **FE chaqiruv tekshiruvi:** QC, cfo-config, iot, attendance, notification-prefs uchun bajarildi (FE grep). CRM email, ideal-rasm, transfer, wms-inventory/stock uchun FE grep BO'SH (orphan deb belgilandi, lekin to'liq emas).
- **Tekshirilmagan:** ~276 controllerning servis-ichidagi yashirin fake'lari (servis qatlami bittalab o'qilmadi — agar `svc.create()` ichida `Date.now()` echo bo'lsa, bu skanda ko'rinmaydi). Maqsad jadvallar JONLI DB'da tekshirilmadi (bu sessiya `q.cjs` ishlatmadi — kod-darajasi + kechagi DB-tasdiqqa tayandi).
- **Eng ishonchli:** §1.A #1 (HR davomat) va §1.B #4 (QC) — kod + FE chaqiruvi ikkalasi ham tasdiqlangan AKTIV yo'qotish.
