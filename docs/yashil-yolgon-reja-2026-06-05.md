# 🟢🔴 YASHIL YOLG'ON + STUB + DUBLIKAT — TO'LIQ XARITA va TUZATISH REJASI
> Sana: 2026-06-05 | Rol: 🔵 TAHLILCHI (read-only) | Hech narsa o'zgartirilmadi (faqat o'qish + grep + shu fayl)
> Manba: `docs/status-raqam-katalog-2026-06-05-1619.md` (boshlang'ich ro'yxat) — **har element jonli kodda QAYTA tekshirildi** (verify-don't-trust).
> Bu **REJA** — ijro keyin, bosqichma-bosqich, egasi ruxsati bilan. Har da'vo qavs ichida `fayl:satr` bilan.

---

## ⭐ ENG MUHIM TUZATISH (katalog ≠ haqiqat)
Katalog "**~20-25 yashil yolg'on**" dedi, eng katta signal `sd-customers.controller :224,281,331,363` (4 ta `return {}`). **Jonli tekshiruv: bular YOLG'ON EMAS.** Har biri AVVAL haqiqiy o'chirishni bajaradi (`await svc.softDelete/deleteContact/deleteDocument/deleteCompetitor`), keyin bo'sh `{}` qaytaradi — ya'ni **ish bajariladi, faqat javob tanasi bo'sh** (sd-customers.controller.ts:222-224 + izoh :216-218 "P3-26 audit verified softDelete does real work").

Xuddi shu naqsh hamma joyda: `await svc.delete(); return {};` = **haqiqiy o'chirish, kosmetik bo'sh javob**, yolg'on emas. Shu sabab `return {}` ro'yxatining ~90% i **soxta-pozitiv**:
- crm-activities:131, crm-companies:156, crm-followup-compat:98, telegram-bots:79/93/107, kanban-boards:107/140, mm-goods:91/147, mm-vendors-pr:163 — **HAMMASI haqiqiy** (delete/notify), yolg'on emas.
- `order-status.service` :53/61/68/75/84/91/98, `fi.service` :105/172, `employees-compat-financials` :231, `ai-interview` helper :48 — `{success:true}` lekin AVVAL haqiqiy `await repo.update/delete` bor → **haqiqiy**.

➡️ **Haqiqiy yashil yolg'on = `{success:true}`/`{sent:true}`/echo bo'lib, OLDIDAN hech qanday `await` real-amal YO'Q.** Shu mezon bilan **9 ta haqiqiy + 3 ta yarim (xato-yo'lida yolg'on)** topildi.

---

## 📊 ROLL-UP (umumiy raqamlar)
| Kategoriya | Soni | Izoh |
|---|---|---|
| 🔴 **Haqiqiy yashil yolg'on** | **9** | "ishladi" deydi, hech narsa qilmaydi (ma'lumot yo'qoladi) |
| 🟠 **Yarim yolg'on** (xato-yo'lida) | **3** | happy-path real, lekin `.catch(()=>soxta echo)` xatoni yashiradi |
| 🟠 **501 stub** (halol "tayyor emas") | **~140** | 38 fayl / 19 modul; ~50 tasi "Feature gated #FX-*" ataylab o'chirilgan |
| 🔵 **Dublikat/yashirin** klaster | **~8** | 7 route-to'qnashuv + 1 alias + jadval "ikki olam" |
| 🟢 500 xato riski | **0** | (katalog tasdiqlandi) |

**Metafora:** Yashil yolg'on = *do'kon kassiri "to'ladingiz" deb chek beradi, lekin pulni kassaga solmaydi*. 501 stub = *peshtaxtada "tez orada" yozuvi* (halol). Dublikat = *bitta mahsulot 2 peshtaxtada, narxi har xil*.

---

# 🔴 PART A — YASHIL YOLG'ON (ustuvor; to'liq, tekshirilgan)

| # | Endpoint (fayl:satr) | Hozir nima qiladi (yolg'on) | Haqiqiy qilish uchun | Ish | Dublikat? |
|---|---|---|---|---|---|
| A1 | **POST /api/wms/stock** (wms-stock.controller.ts:51) | `createStock()` → `{success:true}` — **hech qanday DB yozuvi yo'q**; ombor qoldig'i kiritildi deb ko'rsatadi, lekin yo'qoladi | `WmsCrudService` (allaqachon inject `crudSvc`) ga `createStock` qo'sh → `warehouse_stock` ga INSERT/upsert | M | ⚠️ Ombor qoldig'i `warehouse_stock` (kanonik) — POS/WMS sync orqali yoziladi. Bu endpoint o'rniga sync yo'lini kanonik qil (Part C/stock) |
| A2 | **POST /api/wms/inventory** (wms-inventory.controller.ts:50) | `createInventoryAdjustment()` → `{success:true}` — inventarizatsiya tuzatmasi **saqlanmaydi** | `crudSvc` ga adjustment metod → `warehouse_transactions` (+`warehouse_stock` yangilash) | M | warehouse_transactions (real jadval mavjud) |
| A3 | **POST /api/crm/leads/:id/emails** (crm-leads.controller.ts:186) | `{id:<ts>, ...body, sent:true}` — **email yuborilmaydi, hech narsa saqlanmaydi**; sotuvchi "yuborildi" deб o'ylaydi | Communication-center messaging xizmatiga ulash (real provayder/navbat) + `sd_lead_activities`/`crm_lead_emails` ga log | M | ✅ communication-center (cc) — kanonik xabar yo'li. Buni cc ga ulash (Part C/messaging) |
| A4 | **POST /api/upload** (general-legacy-a.controller.ts:185) | `uploadFile()` → `{url:'', filename:'', message:'Fayl yuklandi'}` — **fayl saqlanmaydi**, "yuklandi" deb yolg'on | `storage.controller` (real upload mavjud) ga yo'naltir yoki StorageService chaqir | M | ✅ **storage.controller real upload bor** → bu o'lik dublikat, retire yoki redirect |
| A5 | **POST /api/lms/progress/complete** (lms-core.controller.ts:129) | `completeCourse()` → `{success:true}` — kurs tugatildi deydi, lekin **progress/sertifikat yozilmaydi** | `LmsService` ga `completeCourse` → enrollment/progress UPDATE (+certificate) | M | lms enrollment/progress jadvali |
| A6 | **POST /api/finance/cfo-config** (finance-cfo-config.controller.ts:36) | `create()` → `{success:true}` (izoh: "not yet implemented") — moliya konfig **saqlanmaydi** | `CfoConfigService` (inject mavjud) ga real save → `cfo_config` jadval | S-M | — (ehtimol ⚠️DDL: cfo_config jadval kerakmi tekshir) |
| A7 | **POST /api/cc/notification-prefs** (cc-notification-prefs.controller.ts:38) | `create()` → `{success:true}` — bildirishnoma sozlamasi **saqlanmaydi** (repo inject qilingan, lekin chaqirilmagan!) | `CcNotificationPrefsRepository` (mavjud) `.create/upsert` ni chaqir | S | cc_notification_prefs jadval (repo bor) |
| A8 | **POST /api/warehouse-rental/recalculate** (warehouse-rental.controller.ts:119) | `recalculate()` → `{success:true}` — **qayta hisob yo'q** (controllerning qolgani real: markPaid awaits svc) | `WarehouseRentalService` ga `recalculate` (mavjud markPaid yonida) | S-M | — |
| A9 | **POST /api/ideal-rasm** (ideal-rasm.controller.ts:31) | `create()` → `{success:true}` (ACL demonstrator) | `IdealRasmService` ga real save (yoki agar demo bo'lsa — o'chir) | S | — (past ustuvorlik, demo) |

### 🟠 Yarim yolg'on (happy-path real, xato-yo'lida yolg'on) — barchasi `general-legacy-a.controller.ts`
| # | Endpoint (fayl:satr) | Muammo | Haqiqiy qilish uchun | Ish |
|---|---|---|---|---|
| A10 | **POST /api/machine-tasks** (:160) | `await svc.createMachineTask().catch(()=>({...body, id:<ts>}))` — DB xato bo'lsa **soxta muvaffaqiyat** qaytaradi, xatoni yashiradi | `.catch` fallbackni olib tashla → xato 500/throw qilsin | S |
| A11 | **POST /api/planning/operations** (:179) | xuddi shu `.catch(()=>{...body, id:<ts>})` | `.catch` ni olib tashla | S |
| A12 | **PATCH papka-orders/:id** (:142) | `svc.updatePapkaOrder().catch(()=>body)` — xatoda eski body echo | `.catch` ni olib tashla yoki real xato qaytar | S |

> ⚠️ **Pul/ma'lumot xavfi eng yuqori:** A1, A2 (ombor qoldig'i yo'qoladi), A4 (hujjat yo'qoladi), A10/A11 (ishlab chiqarish yozuvi xatoda yo'qoladi), A3 (mijozga email ketmaydi). Shular BIRINCHI.

---

# 🟠 PART B — 501 STUBLAR (halol "tayyor emas", modul bo'yicha)

> 501 = yolg'on emas (foydalanuvchiga "tayyor emas" deb aniq aytadi). ~50 tasi `@ApiResponse 501 "Feature gated off #FX-*"` — **ataylab o'chirilgan** (kelajak funksiya). ⚠️DDL = yangi jadval kerak (egasi ruxsati).

| # | Modul / Endpointlar (fayl) | Nima qilishi kerak | Nega stub | Ish | Dublikat? |
|---|---|---|---|---|---|
| B1 | **IoT tablet ×14** (iot-tablet.controller.ts:97–228): tablet/shift, tablet/sessions (GET/POST), tablet/handover, material-kit-items/:id/scan (POST/PATCH), production-sessions (POST), :id/crew, :id/{start,stop,defect,evaluation,material-return,inline-qc} | Sex-tablet ish oqimi (smena, ishlab chiqarish sessiyasi, brak, material qaytarish) | Sex-tablet ilovasi qurilmagan; jadvallar yo'q | L | ⚠️DDL: `production_sessions`, `tablet_sessions`, `material_kit_scans` |
| B2 | **IoT qolgan ×7** (iot-sensors-main:123/134 predictive-maintenance, alerts/:id/resolve; iot-main:270/282 downtime-reason-codes, devices/:id PATCH; iot-alerts:70 POST alerts; iot-enhanced:130 orders) | Sensor bashorat, alert hal qilish, qurilma yangilash | IoT analitika qurilmagan | M-L | ⚠️DDL ehtimol (downtime_reason_codes) |
| B3 | **MM vendor-invoice + fleet ×17** (mm-dashboard.controller.ts:151–243): vendor-invoices (GET/:id/approve/match/payment), three-way-match, 3way-match/:id, fleet/{maintenance,deliveries,vehicles/locations,driver/expenses}, materials/:id/suppliers — **"#FX-2 gated"** | Yetkazib-beruvchi hisob-fakturasi + avtopark moduli | Ataylab o'chirilgan (FX-2) | L | ⚠️DDL: `vendor_invoices`, `fleet_*`, `material_suppliers` |
| B4 | **MM purchase-orders ×3** (mm-purchase-orders.controller.ts:99/158/169): GET/:id, DELETE/:id, PATCH/:id | Xarid buyurtmasi ko'rish/o'chirish/yangilash | list/create real, lekin :id amallari stub | M | `purchase_orders` jadval bormi tekshir (list ishlasa bor) |
| B5 | **HR dashboard ×15 + extra ×3** (hr-dashboard.controller.ts ×15; hr-dashboard-extra:89/111/118 contracts, hr-capital courses/stats) | HR dashboard vidjetlari, shartnomalar, HR-kapital statistika | Dashboard agregatsiyalari qurilmagan | M-L | ⚠️DDL: `hr_contracts`; ⚠️ hr.providers.ts:164 route-to'qnashuv izohi (Part C) |
| B6 | **HR HRC-tests ×5** (hr-compat-a.controller.ts:244–314): tool-test questions (POST/PATCH/DELETE), sessions POST, employee/:id/results | Asbob-test (HRC) savol/sessiya/natija | HRC test moduli qurilmagan | M | ⚠️DDL: `hrc_test_questions/sessions/results` |
| B7 | **Integration-employee ×10** (integration-employee.controller.ts:116–192): employee-complaints, assessment-skips, skill-gap, mentorships, mes-summary, wms-summary, expense (GET/POST), invoice (GET/POST) | Modullararo xodim agregatsiyasi + xarajat/faktura | Integration aggregatsiyalari qurilmagan | M-L | ⚠️DDL: `employee_expenses`, `employee_invoices`; mes/wms-summary = mavjud jadvallardan agregatsiya (DDL yo'q) |
| B8 | **WMS integration ×6 + catalog ×2** (wms-integration:85–121 mm/fi integration summaries, POST integration; wms-catalog:143/152 transactions, orders-by-date) | MM↔WMS↔FI integratsiya xulosalari, tranzaksiyalar | Agregatsiya qurilmagan | M | warehouse_transactions mavjud (transactions uchun DDL yo'q) |
| B9 | **WMS barcode/printer ×8** (wms-barcode.controller.ts:62–144): printer-config (GET/POST/PATCH/DELETE), material-kits (GET/POST/PATCH/:id/items) | Printer sozlama + material-kit | Jadvallar yo'q | M | ⚠️DDL: `printer_configs`, `material_kits` |
| B10 | **Finance ×6** (reports:77 production-efficiency; finance-main:106/152 reports, loans; finance-extended-payroll:94/101 tax-calendar, salary-benchmark/:id) | Hisobotlar, kreditlar, soliq taqvimi | Agregatsiya/jadval yo'q | M | ⚠️DDL: `loans`; tax-calendar = statik/hisob (DDL yo'q) |
| B11 | **AI ×5** (ai.controller.ts:181–208 forecast/demand, rush-orders {list,approve,reject} "#FX-5"; ai-agents:252 :agentId/trigger) | Talab bashorati, shoshilinch buyurtma, agent ishga tushirish | Ataylab gated (FX-5) | M-L | — |
| B12 | **PP technology ×4 + production-reports ×1** (technology.controller.ts:107–128 cards GET/generate/:id/optimize; production-reports:81 orders) | Texnologik karta CRUD + ishlab chiqarish hisoboti | Texkarta moduli qurilmagan | M-L | ⚠️ `pp_tech_cards` jadval bormi tekshir |
| B13 | **POS ×5** (pos-stub.controller.ts:112–124 sales/daily, inventory/{low-stock,movements,monthly-report}; stock:103 stock/movements) | POS sotuv/inventar hisobotlari | Agregatsiya qurilmagan | M | ⚠️ POS=ombor monitor; `warehouse_*` dan agregatsiya (DDL yo'q ehtimol) |
| B14 | **Security/PPE ×5** (security.controller.ts:189–213 daily-summary, fire-sensors, ppe-checks/stats/violations) | Xavfsizlik kunlik xulosa, yong'in sensori, PPE nazorati | IoT/PPE jadvallari yo'q | M-L | ⚠️DDL: `ppe_checks`, `fire_sensors` |
| B15 | **QC ×3** (qc-new:116 control-charts; qc-defects:129/137 braks/cost-impact, pending/qc) | SPC nazorat grafiklari, brak xarajati | Agregatsiya/SPC qurilmagan | M | `control_chart_point` jadval bor (DDL yo'q ehtimol) |
| B16 | **LMS ×4** (lms-misc:110/176/186 video-progress, progress, progress/user/:id; lms-lessons:131 modules) | Video/kurs progressi, modullar | Progress/module jadvallari | M | A5 (completeCourse) bilan bir model |
| B17 | **Kanban ×3** (kanban-cards:186/193 chat-messages/:id/files GET/POST; kanban-reports:236 projects) | Chat fayl biriktirish, loyihalar | Fayl saqlash + projects jadval | M | storage (A4) + ⚠️DDL `kanban_projects` |
| B18 | **Design ×4** (design.controller.ts:159–190 notifications, tooling, tooling/:id/wear-forecast, orders/:id/messages) | Dizayn bildirishnoma, asbob, xabarlar | Jadvallar yo'q | M | ⚠️DDL: `design_tooling`, `design_notifications` |
| B19 | **Compat/SaaS ×7** (saas:132–162 tenant modules, onboard, orders-registry; warehouse-catalog:92 movements; europrint-control-director:124 menus/admin) | Ko'p-ijarachi (SaaS) + admin menyu | SaaS bir-ijarachi loyihada **kerak emas** ehtimol | S | 🔵 **warehouse-catalog:92 → "use /wms/movements instead"** (alias, retire — Part C); orders-registry → sales_orders dublikati |
| B20 | **Misc ×3** (marketing-analytics-stubs:?; material-balance:123 movements; org-structure:247 nodes/:id/history) | Marketing analitika, material harakati, node tarixi | Agregatsiya/audit-log yo'q | M | material-balance/movements = warehouse_transactions dublikati; org node-history = audit_logs dan |

**Stub xulosasi:** ~140 dan **~50 "Feature gated #FX-*"** (ataylab — ehtimol hozir kerak emas), **~40 ⚠️DDL** (yangi jadval = egasi ruxsati), **~50 mavjud jadvaldan agregatsiya** (DDL yo'q = tezroq). Eng arzon g'alaba: agregatsiya-stublar (transactions, mes/wms-summary, POS hisobotlar, QC control-charts) — jadval bor, faqat query yozish kerak.

---

# 🔵 PART C — DUBLIKAT / YASHIRIN ROUTE (qaytib kelmasligi uchun)

| # | Amal (action) | Joylar (file:line) | Kanonik (qoldiriladi) | Retire/alias | Izoh |
|---|---|---|---|---|---|
| C1 | Ombor harakatlari | `warehouse-catalog.controller.ts:92` (alias) ╳ `/wms/movements` | **/wms/movements** | warehouse-catalog `GET /warehouse/movements` (kod o'zi "use /wms/movements instead" deydi) | Eng aniq dublikat — retire |
| C2 | DELETE incident | `hr-compat-safety.controller.ts:91` ╳ `hr-safety.controller.ts:59` | **hr-safety** | hr-compat-safety | Bir xil METOD+path 2 faylda (pre-commit ogohlantirgan) |
| C3 | Kunlik hisobot/xodim | `daily-report.controller.ts:119` ╳ `:133` (bir fayl, 2 marta) | bittasi | ikkinchisi | Bir faylda ikki marta — birini o'chir |
| C4 | warehouse KPI | `general-legacy-b.controller.ts:82` ╳ `wms-catalog.controller.ts:102` | **wms-catalog** | general-legacy-b | warehouse/dashboard/kpis ikki joyda |
| C5 | warehouse ro'yxati | `general-legacy-b.controller.ts:60` ╳ `wms-gateway-warehouses.controller.ts:88` | **wms-gateway-warehouses** | general-legacy-b | warehouse/warehouses ikki joyda |
| C6 | LMS attempt submit | `lms-attempts.controller.ts:84` ╳ `:97` | bittasi | ikkinchisi | Bir faylda ikki marta |
| C7 | Auth refresh | `auth.controller.ts:147` ╳ `general/admin-auth.controller.ts:40` | **auth.controller** | admin-auth (+ CLAUDE.md Qoida A: admin-auth noto'g'ri secret ishlatadi — xavfsizlik) | Pre-commit ogohlantirgan |
| C8 | Order yaratish (ikki olam) | `sales_orders` (kanonik) ╳ `orders` (legacy base) ╳ `sd_sales_orders` (VIEW); `saas.controller:162` orders-registry stub; `order-status.service` (qaysi jadval?) | **sales_orders** | orders-registry stub; order-status repo jadvalini tekshir | Oldingi tahlil: 2-olam masalasi (memory) |
| C9 | Stock (ikki olam) | `warehouse_stock` (kanonik) ╳ `stocks` ╳ `current_stock` (VIEW); A1/A2 (wms-stock/inventory green-lie) ╳ POS sync | **warehouse_stock** | A1/A2 ni sync-yo'liga ulash | A1/A2 tuzatishda shu kanonikka yoz |
| C10 | Xabar yuborish | communication-center (cc) ╳ `crm-leads:186` (A3 green-lie) ╳ telegram-bots (real) | **communication-center** | A3 ni cc ga ulash | A3 tuzatishda |

**FE sahifalar:** FE da `StubRoutes.tsx` + `EPComingSoon` + `AppRouter` (101 ref) — bu **boshqariladigan placeholder tizimi** (yashirin dublikat emas). Ma'lum eski FE dublikatlar (quotation 2 sahifa, order 3 joy, CRM 8 menyu) **oldingi sessiyalarda birlashtirilgan** (memory). ⚠️ **Bu turda FE-route'ни chuqur skan qilmadim** — agar kerak bo'lsa, alohida "FE-route dedup" tahlili tavsiya etiladi (bu hisobot BE'ga qaratilgan).

---

## 🎯 TAVSIYA ETILGAN IJRO TARTIBI
1. **🔴 BIRINCHI — ma'lumot yo'qotadigan yashil yolg'onlar:** A1, A2 (ombor qoldig'i), A4 (hujjat), A10/A11 (ishlab chiqarish yozuvi xatoda), A3 (mijoz email). Har biri kanonik jadvalga yozsin (C8/C9/C10 bilan birga — twin qoldirmaslik uchun).
2. **🟠 IKKINCHI — kichik config yolg'onlar:** A7 (cc-prefs, repo bor=S), A6 (cfo-config), A8 (rental recalc), A5 (lms complete), A12, A9.
3. **🔵 UCHINCHI — dedupe (Part C):** C1 (alias retire), C2–C7 (route-to'qnashuvlar), keyin C8/C9/C10 (jadval ikki-olam) — **fix qilishdan OLDIN** kanonik tanlansin, aks holda twin qaytadi.
4. **🟠 TO'RTINCHI — stublar:** avval **DDL-siz agregatsiya** stublar (tez g'alaba: B8 transactions, B7 mes/wms-summary, B13 POS, B15 QC, B16 LMS), keyin **⚠️DDL** stublar (egasi har jadvalni tasdiqlaydi: B1/B3/B6/B9/B14/B18). "#FX gated" (B11, B3) — ehtimol hozir kerak emas, oxirida.

> Har ijro qadami: kanonik tanla → reja → egasi ruxsati → tuzat → DB-proof (kirit→saqla→qayta o'qi) → twin/alias retire → commit. **Twinни retire qilmasdan yangi real yozma** (aks holda C-dagi dublikat qaytadi).

---

## Metodologiya (har raqam qanday tekshirildi)
- 501: `grep notImplemented(` → 148 chaqiruv / 41 fayl (katalog "157/35" ≈ to'g'ri, lekin aniq emas; 3 tasi helper/izoh, ~140 real endpoint).
- Yashil yolg'on: `grep "return {}", "return {success:true}", "id:<ts>"` + **har metodni ochib `await` real-amal bor-yo'qligini tekshirdim** (verify-don't-trust) → 9 real + 3 yarim (qolgani haqiqiy delete/notify).
- Dublikat: pre-commit route-skaneri (7 to'qnashuv) + kod-ichi alias izohlari + memory (ikki-olam).
- ⚠️ Workflow (38 agent) **server rate-limit** sababli ishlamadi → controller-ma-controller inline o'qildi (egasi "depth over speed" ko'rsatmasiga mos).

> 🔵 (Tahlil bosqichida) Hech narsa o'zgartirilmagandi — keyin EDITOR rejimida ijro boshlandi (pastda).

---

## 🛠️ IJRO HOLATI — GROUP 1 (2026-06-05, EDITOR)
- ✅ **A7** (cc-notification-prefs `POST` upsert) — **DONE**, commit `1d65eaf0` (DB-proof: upsert `urgent_only=true` saqlandi → cleanup 0). Twin-PUT bilan bir xil kanonik repo.upsert.
- ✅ **A1** (wms-stock `createStock` retire) — **DONE** (createStock o'chirildi; FE ishlatmaydi, stock sync/goods-receipt orqali yoziladi). ⚠️ Mening tahririm commit qilinmasdan turib **parallel sessiya supurib ketdi** → commit `e36e36ee` (Muslimbek) ichiga tushib qoldi.

### ⚠️ PARALLEL SESSIYA TO'QNASHUVI (Qoida 23 buzildi)
Shu branch (`chore/schema-convergence`) da **boshqa bajaruvchi sessiya FAOL** (Muslimbek, `e36e36ee` 17:02 — "design" commit). U `git add -A`/`git add .` ishlatib mening A1 `wms-stock` faylimni **o'z commitiga supurib** kiritdi. Qoida 23: *"bir vaqtda FAQAT BITTA bajaruvchi"* + *"`git add -A` TAQIQLANGAN"*. ➡️ **TAVSIYA:** parallel sessiyani to'xtating YOKI menga alohida `worktree`/branch bering — aks holda har bir commit qilinmagan tahrir yo'qoladi/aralashadi.

### ⏭️ GROUP 1 qolgan 7 item — QAROR KERAK (tekshiruv tugadi)
| Item | Tekshiruv natijasi | Tavsiya / kerak |
|---|---|---|
| **A2** wms-inventory `createInventoryAdjustment` | bare POST'ni FE ishlatmaydi; crudSvc'da create metod YO'Q; qurish = 2-stock-yozuvchi (double-write) | **A1 kabi RETIRE** (qurmaslik). Tasdiqlang? |
| **A4** `POST /api/upload` | FE (AddLessonDialog) **multipart** yuboradi, `{filePath}` kutadi; storage.controller `PUT /storage/upload?key=` (boshqa kontrakt). Hozir bo'sh javob → lesson-fayl yuklash **buzilgan** | **Real qil**: /api/upload → multipart→UPLOADS_DIR (storage mantig'ini ulash), `{filePath}` qaytar. Tasdiqlang? |
| **A3** crm `sendLeadEmail` | communication-center = kanonik xabar yo'li; topib ulash kerak | Yondashuv: cc'ga ula, halol "queued" (sent:true EMAS). Tekshiruv davom |
| **A5** lms `completeCourse` | LmsService progress-yozuv kerak | Tekshiruv davom |
| **A6** finance `cfo-config` | `cfo_config` jadval bor-yo'qligi tekshirilmagan | Jadval yo'q bo'lsa → **DDL ruxsati** (STOP-ask) |
| **A8** warehouse-rental `recalculate` | "qayta hisob" ANIQ EMAS (servisда recalc yo'q) | **1 qatorli spec** kerak: nimani qayta hisoblaydi? |
| **A9** ideal-rasm `create` | ACL demonstrator | Real saqlaymizmi yoki **olib tashlaymizmi**? |
