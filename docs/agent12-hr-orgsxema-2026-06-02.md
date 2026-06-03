# AGENT12 — HR / ORG-SXEMA / XODIM CHUQUR TAHLIL (2026-06-02)

> **FAQAT TAHLIL** — hech narsa o'zgartirilmadi. Har da'vo **kod (fayl:satr) + jonli DB (`europrint`@127.0.0.1:5432)** bilan tasdiqlangan.
> Backend jonli (:3030, org endpointlar 401 = guard ishlayapti). Brauzer ishlatilmadi — kod+DB yetarli dalil berdi (belgilangan joylarda "brauzer tasdiq kerak" deb yozildi).
> Egasi VIZYONI: org-sxema = hamma modul skeleti (tasdiq zanjiri + ruxsat); lavozim kartochkasi (kerakli jihozlar); HR→oshxona; HR→kassir (oylik); xodim profili ("Mening jihozlarim/inventarim"); xodim kodi (shtrix).

---

## 0. QISQA HUKM

| Vizyon bo'lagi | Holat | % |
|---|---|---|
| Org-sxema sahifasi (ierarxiya, KPI, drag-move, export) | ✅ ISHLAYDI | ~90% |
| Org-sxema = **tasdiq zanjiri** skeleti (P2P + CC) | ✅ ISHLAYDI (kod), data-gap bilan | ~70% |
| Org-sxema = **ruxsat** skeleti (position RBAC matritsa, guard enforce) | ✅ ISHLAYDI | ~75% |
| Lavozim kartochkasi (Portret wizard) | ⚠️ QISMAN-STUB (UI boy, **backend saqlamaydi**) | ~30% |
| Lavozim kartochkasi → **kerakli jihozlar** | ❌ YO'Q (model yo'q) | ~5% |
| Xodim profili (20+ tab, CRUD) | ✅ ISHLAYDI (UI+endpoint), data bo'sh | ~75% |
| Xodim profili → "Mening jihozlarim/inventarim" | ⚠️ QISMAN (endpoint bor, data=0) | ~45% |
| Xodim kodi (employee_code) | ⚠️ QISMAN (matn kod bor, **shtrix/QR YO'Q**) | ~40% |
| HR → kassir (oylik) | ⚠️ QISMAN (payroll servis bor, 0 shartnoma/hisob) | ~35% |
| HR → oshxona | ❌ YO'Q (canteen log MRO'da, HR'ga ulanmagan) | ~5% |
| HR↔users data-yaxlitligi (`employees.user_id`) | ❌ BUZUQ (30/30 NULL, id≠id) | — |

**UMUMIY HR/ORG-SXEMA bajarilishi: ~55–60%.** Skelet (org-tree + tasdiq zanjiri + position-RBAC) HAQIQATAN qurilgan va kod darajasida ishlaydi — bu vizyonning eng muhim "tana" qismi va u BOR. Lekin: (a) lavozim kartochkasi backend stub + "kerakli jihozlar" modeli yo'q; (b) `employees↔users` ulanmagani CC tasdiq-resolverini va profil↔org bog'lanishini buzadi; (c) xodim kodi shtrix emas; (d) HR→oshxona umuman yo'q; (e) hamma operatsion data bo'sh (0 shartnoma, 0 asset, 0 podotchet) — qurilish bosqichi.

---

## 1. HR / ORG DB JADVALLAR (count) — JONLI

### 1.1. Jami HR/org doirasidagi jadvallar: **161 ta** (information_schema)
`hr_*`, `org_*`, `employee_*`, `position*`, `department*`, `leave*`, `payroll*`, `attendance*`, `recruit*`, `onboard*`, `offboard*`, `skill*`, `pip*`, `enps*`, `shift*`, `discipline*`, `career*`.

### 1.2. Asosiy ORG/POZITSIYA jadvallari (qator soni)
| Jadval | Qator | Izoh |
|---|---|---|
| `org_departments` | **142** (141 active) | ✅ Org-tree YADROSI — real EuroPrint struktura |
| `org_functions` | 97 | Lavozim funksiyalari lug'ati |
| `positions` | 96 | Lavozimlar |
| `position_permissions` | **1380** | ✅ RBAC matritsa (92 lavozim × 15 modul) |
| `position_feature_flags` | 32 | Feature flag'lar |
| `position_folders` | **0** | ❌ Lavozim materiallari (papka) — bo'sh |
| `position_folder_content` | **0** | ❌ bo'sh |
| `position_required_courses` | **0** | ❌ Lavozim kerakli kurslar — bo'sh |
| `position_skill_requirements` | **0** | ❌ Lavozim kerakli ko'nikma — bo'sh |
| `employees` | 30 | HR xodim yozuvi |
| `employee_org_departments` | **30** | ✅ Xodim↔bo'lim M:N (user_id bilan) |
| `employee_functions` | 0 | bo'sh |
| `departments` | 18 | Eski/parallel dept jadval |
| `users` | 31 | ✅ Auth + org head manbai |
| `org_chart_settings` / `org_chart_snapshots` | 0 / 0 | bo'sh |

### 1.3. Xodim jihoz/inventar/profil jadvallari (HAMMASI BO'SH)
| Jadval | Qator |
|---|---|
| `employee_assets` | **0** |
| `employee_inventory_ledger` | **0** |
| `employee_issuance_log` | **0** |
| `employee_contracts` | **0** |
| `employee_passports` | **0** |
| `employee_bank_accounts` | **0** |
| `employee_emergency_contacts` | **0** |
| `employee_files` | **0** |
| `employee_skills` | 2 |
| `hr_documents` | 0 |
| `hr_leave_requests` | **29** ✅ |
| `payroll_contracts` | **0** |
| `payroll_calculations` | **0** |
| `attendance_records` | 0 |
| `skill_catalog` | 0 |

> **Xulosa:** struktura (jadvallar) boy va to'liq, lekin **operatsion data deyarli yo'q** (faqat org-tree 142 + position-perms 1380 + 30 xodim + 29 ta'til so'rovi to'ldirilgan). Bu — **qurilish bosqichi**, ko'chiriladigan data yo'q (MEMORY: live DB bo'sh holatda).

---

## 2. ORG-SXEMA SAHIFASI — ✅ ISHLAYDI (~90%)

### 2.1. `OrgStructureHierarchy.tsx` (FE: `artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx`)
**To'liq interaktiv org-chart sahifasi:**
- KPI kartochkalar: Jami bo'limlar / Jami nodes / Xodimlar / Vakant (% bilan) / 30-kun o'zgarish — `/api/org-structure/stats` dan (real).
- Zoom/pan canvas (TreeCanvas), wheel-zoom, fit-to-screen, reset (satr 71–102).
- Qidiruv + filter (daraja 0–4 checkbox + status: hammasi/vakant/band) — `filterTree()` (satr 140–156).
- **Bo'lim qo'shish** (AddNodeDialog) → `POST /api/org-structure/nodes` (real).
- **Drag-to-move** node → `PATCH /api/org-structure/nodes/:id/move` (real, cycle-check bilan).
- **Vakantlar xabari** → `POST /api/org-departments/notify-vacancies`.
- **Export PDF + Excel** → `/api/org-structure/export/{pdf,excel}` (binary blob, OrgExportService real).
- Node bosilsa → `/org-structure/hierarchy/node/:id` (OrgNodeDetail).

### 2.2. Backend `org-structure.controller.ts` (24 endpoint)
`apps/api/src/modules/org-structure/org-structure.controller.ts` — `@UseGuards(JwtAuthGuard)` + `@Roles(admin,manager,supervisor,viewer,director)` + AuditInterceptor.

| Endpoint | Holat | Dalil |
|---|---|---|
| `GET hierarchy` | ✅ REAL | `org-queries.repo.ts:21` — `org_departments` daraxti, employeeCount subquery |
| `GET stats` | ✅ REAL | `:56` — totalNodes/Depts/Employees/Capacity/recentChanges |
| `GET nodes/flat` | ✅ REAL | `:71` paginated |
| `GET nodes/:id` | ✅ REAL | `:108` node+employees+children |
| `POST/PATCH/DELETE nodes` | ✅ REAL | `org-mutations.repo.ts` |
| `PATCH nodes/:id/move` | ✅ REAL | service cycle-detector (satr 108–154) |
| `PATCH users/:userId/node` | ✅ REAL | assignUser |
| `GET export/{excel,pdf}` | ✅ REAL | OrgExportService |
| `GET nodes/:id/folder` + POST/DELETE | ✅ REAL (DB 0) | position-folder.repo (ensureTable) |
| `GET employees/:userId/folder` | ✅ REAL | folder by user |
| **`GET nodes/:nodeId/approval-chain`** | ✅ REAL | `:166` rekursiv CTE parent→root, head_user_id (vizyon!) |
| **`GET nodes/:nodeId/direct-manager`** | ✅ REAL | `:190` parent head |
| **`GET nodes/:nodeId/telegram-group`** | ✅ REAL | `:209` head telegram_chat_id |
| `GET nodes/:nodeId/portret` | ❌ **STUB** | `:251` → `return { nodeId, portret: null }` (DB'ga bormaydi) |
| `POST nodes/:nodeId/portret` | ❌ **STUB** | `:258` → `return { nodeId, ...dto, created: true }` (saqlamaydi!) |
| `GET nodes/:nodeId/history` | ❌ **501** | `:223` `notImplemented()` |
| `GET nodes/:nodeId/hr-requests` | ❌ **501** | `:232` `notImplemented()` |
| `POST nodes/:nodeId/hr-requests` | ❌ **501** | `:242` `notImplemented()` |

### 2.3. Org-tree real kontenti (DB)
Top: **Ma'muriyat** (owner, head=user 34) → **Bosh Direktor ofisi** (ceo, head=35) → 14 ta department (Sotuvlar, Moliya, Ishlab chiqarish, Ombor, Sifat nazorati, Marketing, Kadrlar bo'limi, O'qitish, Yetkazib berish, PR, Hamkorlar, Yurist...) + 6 ta `otdeleniye` (Qurilish/Ishlab chiqarish/Texnik ta'minot/Moliya/Rivojlanish/Ma'muriy bo'linma) + 92 ta `position` node.
**node_type taqsimoti:** position×92, department×18, otdeleniye×13, director×11, section×5, ceo×1, owner×1 (7 daraja).

> **⚠️ DATA SIFATI muammosi:** 141 active node'dan faqat **18 tasida `head_user_id` bor** (hammasi `department` turidagi). Qolgan 123 node (positions, otdeleniye, director nodes) rahbarsiz. Tasdiq zanjiri `head_user_id` ga tayanadi → ko'p node uchun zanjir **kalta** chiqadi. Bundan tashqari **dublikat tugunlar** bor: "Ma'muriyat" ham owner (id 19) ham department (id 44); "Qurilish bo'linmasi" 2 marta — daraxt biroz chigal.

---

## 3. ORG-SXEMA = TASDIQ ZANJIRI SKELETI — ✅ ISHLAYDI (kod), data-gap bilan (~70%)

Vizyonning YURAGI: "org-sxema = hamma modul skeleti, tasdiq zanjiri". Bu **2 mustaqil joyda haqiqatan qurilgan:**

### 3.1. P2P (Xarid) tasdiq zanjiri — `procurement-approval-chain.service.ts`
`apps/api/src/modules/pos/application/services/procurement-approval-chain.service.ts`
- `resolveChainFromDepartment()` (satr 57): **rekursiv CTE** `org_departments.parent_id` bo'ylab bo'limdan ROOT/direktorgacha yuradi, har bosqich `head_user_id` = tasdiqlovchi (satr 62–81).
- `excludeUserId` — so'rov beruvchi o'zini tasdiqlamaydi; ketma-ket bir xil rahbar dedup (satr 94–99).
- `findEmployeeDepartment()` — `employee_org_departments` dan birlamchi bo'lim (is_primary).
- **Wired:** `procurement.controller.ts:36` → `GET /api/pos/procurement/approval-chain/:employeeId`. So'rov yaratish/decide/receive ham shu controllerda (satr 44–89).
- **MEMORY tasdiq:** P2P YADRO jonli test qilingan (ombor-pos-master-plan §17).

### 3.2. Kommunikatsiya Markazi (CC) tasdiq-resolveri — `cc-org-resolver.service.ts`
`apps/api/src/modules/communication-center/application/cc-org-resolver.service.ts`
- `resolveApprover(positionCode, senderUserId)` — 4 format:
  - `CEO` → org_departments root head_user_id (satr 42).
  - `MANAGER_OF_SENDER` → `employees.manager_id` → user_id (satr 53). ⚠️ `employees.user_id` NULL → buzuq (4-bo'lim).
  - `DEPT_HEAD` → sender bo'limining `org_departments.head_user_id` via `employee_org_departments` (satr 67). ✅ ishlaydi.
  - `POSITION:<CODE>` → `positions.code` bo'yicha faol xodim (satr 83). ⚠️ `employees.user_id` NULL → buzuq.
- **Delegatsiya** (`cc_delegations`, satr 102): rahbar ta'tilda → o'rinbosar — bu vizyonning "tasdiq delegatsiyasi" (master-plan §2.7) — kod darajasida BOR.

### 3.3. Phase 4 fan-out (MEMORY: a8b9b039)
Order → manager bo'lim tanlaydi → 70% avans (AdvanceApprovedEvent) → har bo'limga fan-out tracked job. `sd_order_departments` + saga. 5/6 bo'lim wired+jonli isbotlangan (`session_2026-06-01_phase4_fanout.md`). Bu org-sxema bo'lim-skeletining boshqa modulga (sd→ow_*) tarqalishi.

> **Hukm:** Tasdiq zanjiri kod darajasida HAQIQATAN org-sxemaga bog'langan (2 resolver + fan-out). Kamchilik: (a) faqat 18 node'da head bor → zanjir kalta; (b) `employees.user_id` NULL → CC'ning 2 resolveri ishlamaydi; (c) `approval_matrix_config` (summaga qarab bosqich) hali zanjirga to'liq ulanmagan (master-plan §7.3 talab); (d) UI'da bu zanjirni ko'rsatadigan sahifa = OrgNodeDetail approval-chain endpoint, lekin foydalanuvchi-yo'naltirilgan tasdiq inbox alohida tekshirilmadi.

---

## 4. ORG-SXEMA = RUXSAT SKELETI (Position-RBAC) — ✅ ISHLAYDI (~75%)

Vizyon: "org-sxema lavozim = ruxsat skeleti". Bu HAQIQATAN qurilgan va **server-side enforce qilinadi** (oldingi hisobotlar buni o'tkazib yuborgan bo'lishi mumkin).

### 4.1. Matritsa: `position_permissions` (1380 qator)
- 92 lavozim × 15 modul (MM, DESIGN, ECOMMERCE, PP, WMS, CRM, POS, LOGISTICS, LMS, HR, QC, BI, FI, SD, MDM).
- access_level taqsimoti: NONE×919, READ×306, FULL×79, READ_PLUS×44, LIMITED×32.
- Ustunlar: position_id, module_code, access_level, extra_actions(jsonb), valid_from/until, org_function_id.

### 4.2. Server-side ENFORCEMENT: `permission.guard.ts`
`apps/api/src/common/guards/permission.guard.ts`
- `@RequirePermission('HR:WRITE')` ko'rilsa → guard `user.positionId` bo'yicha `positionPermissions` jadvalini o'qiydi (`checkFromDb`, satr 48), modul→level map quradi, `LEVELS.indexOf(level) >= required` tekshiradi (satr 60). Redis cache (RbacCacheService).
- admin/super_admin/director — bypass (satr 31, 68). positionId yo'q → 403 (satr 70).
- **Breadth:** `@RequirePermission` **177 marta, 32 controllerda** ishlatilgan — eng ko'p yangi modullarda: **pos×17, finance×7, wms×2, qc×2, pp, crm, ai**. Ya'ni eng yangi Ombor/POS/Finance modullari position-RBAC bilan himoyalangan.

### 4.3. FE consumer: `usePositionPermissions.ts`
`/api/auth/me/permissions` (`me-permissions.controller.ts`) → FE modul-level UI gating. `position_feature_flags` (32) ham keladi.

> **Hukm:** Org-sxema lavozim → ruxsat **ham UI gating, ham backend guard enforcement** sifatida ishlaydi. Kamchilik: enforcement faqat `@RequirePermission`-belgilangan 177 route'da (eski modullar 4-global-guard bilan, lekin position-matritsa emas, role-based). Matritsa modul-darajali (granular action emas — `extra_actions` jsonb bor lekin guard uni o'qimaydi).

---

## 5. LAVOZIM KARTOCHKASI — ⚠️ QISMAN-STUB (~30%); "KERAKLI JIHOZLAR" ❌ YO'Q (~5%)

### 5.1. UI: OrgNodeDetail "Portret" tab (`OrgNodePortretTab.tsx`) — boy wizard
`artifacts/erp-dashboard/src/pages/OrgNodePortretTab.tsx` — **7 bosqichli lavozim portreti/kartochkasi:**
- Blok A (Lavozim tahlili), B (Demografik talab), C (Vazifa & Natija), D (**TOOL TEST** — 10 traits + IQ/leadership/replication min), E (Tajriba & Bilim), III (Ish sharoiti — ish grafigi, social_package), IV (Kandidatga aytiladi).
- Progress %, "HR ga so'rov" tugma (HRRequestDialog), saqlash.

### 5.2. ❌ KRITIK: backend STUB — portret SAQLANMAYDI
- `GET .../portret` → `org-structure.controller.ts:251` qaytaradi `{ nodeId, portret: null }` (DB'ga umuman bormaydi).
- `POST .../portret` → `:258` qaytaradi `{ nodeId, ...dto, created: true }` — **hech narsa yozmaydi** (soxta success).
- `GET/POST .../hr-requests` → `:232/:242` `notImplemented()` (501).
- Natija: foydalanuvchi 7 bosqichni to'ldirib "Saqlash" bossa → toast "saqlandi ✓", lekin **reload qilsa hammasi yo'qoladi**. Bu vizyonning "lavozim kartochkasi" qismini funksional emas qiladi.

### 5.3. ❌ "KERAKLI JIHOZLAR" (required equipment per position) — MODEL YO'Q
- `positions` va `org_departments` jadvalida **equipment/tool/asset/jihoz ustuni YO'Q** (tasdiqlandi: bo'sh natija).
- `position_equipment` / `position_required_assets` kabi jadval **YO'Q**.
- Faqat `position_skill_requirements` (0) + `position_required_courses` (0) + Portret'dagi `social_package` bor.
- Ya'ni vizyonning "lavozim kartochkasi → kerakli jihozlar (kompyuter/asbob...)" qismi **umuman modellashtirilmagan**. Faqat erkin-matnli "Folder" tab (document/video/test/LMS — DB 0) bor.

### 5.4. "Folder" tab (lavozim materiallari) — ✅ wired, DB bo'sh
- `position_folders` (0) — document/video/test/LMS kurs. `GET/POST/DELETE nodes/:id/folder` real (ensureTable bilan). Lekin 0 qator.

---

## 6. XODIM PROFILI — ✅ ISHLAYDI (UI+endpoint), data bo'sh (~75%)

### 6.1. `EmployeeProfile.tsx` — ulkan profil (`artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx`)
**20+ tab**, har biri lazy-load + CRUD dialog:
personal, work, documents, discipline, development, adaptation, career, **assets** (jihozlar), **obligations** (podotchet/majburiyat), attendance, daily-reports, finance, performance, goals, one-on-one, hr-capital, **corporate-inventory**, monthly-report, offboarding, machine-operator.
- ~15 ta saqlash mutation: passport/bank/emergency/contract/salary-history/bonus/fine/overtime/cash-advance/leave/sick/business-trip/role/update (POST `/api/employees/:id/*`).
- Rol o'zgartirish (admin/HR) → `PATCH /api/hr/employees/:id {role}`.
- ProfileHeader (ABC/sertifikat/payroll summary), kirish huquqlari kartochkasi.

### 6.2. Backend `hr-employees.controller.ts` (9 route)
`GET / · GET :id · GET :employeeId/kpi · POST · PUT :id · PATCH :id/status · DELETE :id · POST :employeeId/salary-review`. CRUD to'liq (MEMORY: salary-review + documents real).

### 6.3. Xodim↔bo'lim biriktirish (vizyon: HR sozlaydi) — ✅
`OrgStructureSection.tsx` (employee dialog): **M:N multi-select** — xodim qaysi bo'lim(lar)da ishlashini tanlaydi (kamida 1 majburiy), chips bilan. `employee_org_departments` ga yoziladi (30 qator = hamma xodim biriktirilgan). Bu vizyonning "HR→ombor: bir xodim bir necha bo'lim omboridan oladi, HR sozlaydi" (master-plan §2.6) asosi.

> **Kamchilik:** profil data BO'SH (0 passport/contract/bank/asset). UI+endpoint tayyor, faqat to'ldirilmagan (qurilish bosqichi). 30 xodim bazaviy ma'lumotlari bor.

---

## 7. XODIM PROFILI → "MENING JIHOZLARIM/INVENTARIM" — ⚠️ QISMAN (~45%)

### 7.1. AssetsTab + ObligationsTab + CorporateInventoryTab (FE)
- `AssetsTab.tsx`: `GET /api/assets/employee/:id` — berilgan/qaytarilgan jihozlar (icon, S/N, condition, sana). **View-only** (bu yerda berish/qaytarish mutation yo'q). DB `employee_assets`=0.
- ObligationsTab — podotchet/cash-advance (baseSalary bilan).
- CorporateInventoryTab — korporativ inventar (isHr bilan).

### 7.2. Backend "me/inventory" — REAL, POS modulida (`pos/employees`)
`apps/api/src/modules/pos/presentation/employee.controller.ts` (`@Controller('pos/employees')`):
- `GET me/inventory` (satr 189), `GET me/checklist` (198), `POST me/return` (207) — **xodim o'z inventarini ko'radi + qaytaradi** (vizyon "Mening inventarim" master-plan §10.1).
- `GET me/balance` (69), `GET :userId/balance` (54), `GET :userId/statement` (90) — podotchet balansi/vrachka.
- `POST liability` (124), `PATCH liability/:id` (142), `POST write-off` (106) — moddiy javobgarlik.
- `GET :id/hr-check` (226) — **HR offboarding bloki** (vizyon §10.5: ishdan chiqishda hamma narsa qaytarilmaguncha HR access bermaydi).
- Hammasi `@RequirePermission('pos.liability.*')` bilan.
- DB: `employee_inventory_ledger`=0, `employee_issuance_log`=0, `employee_assets`=0 — **backend to'liq, data bo'sh**.

> **Hukm:** "Mening jihozlarim/inventarim" backend YADROSI (POS modulida, employee_ledger) to'liq qurilgan va guard bilan; FE profil tab'lari ulangan. Lekin: (a) hech qachon ishlatilmagan (0 qator); (b) berish oqimi (ombor→xodim asbob) UI alohida; (c) AssetsTab `/api/assets/employee` vs ledger `/api/pos/employees/me/inventory` — 2 manba (asset assignment vs ledger), birlashganligini brauzer tasdiqi kerak.

---

## 8. XODIM KODI (shtrix) — ⚠️ QISMAN (~40%)

- `employees.employee_code` — **30/30 to'ldirilgan, unikal** (`EP-2025-005`, `EP-2025-006`, ...). Matnli xodim kodi BOR.
- `users.employee_id` + `users.ckp_code` ham bor.
- ❌ **Shtrix/QR YO'Q:** `employees`/`users` jadvalida barcode/qr/badge ustuni yo'q. FE'da shtrix render kutubxonasi (jsbarcode/qrcode) faqat **POS scanner**da (`PosBarcodeScanner.tsx`, `useHardwareScanner.ts`) — material skanlash uchun, **xodim bejisi uchun emas**.
- Vizyon "xodim kodi (shtrix)" — matn kod bor, lekin skanlanadigan shtrix/QR generatsiya/badge **YO'Q**. POS scanner infratuzilmasi mavjud (qayta ishlatish mumkin).

---

## 9. HR → BOSHQA MODUL

### 9.1. HR → KASSIR (oylik) — ⚠️ QISMAN (~35%)
- `finance-extended-payroll.service.ts` — payroll YAGONA haqiqiy yozuvchisi (MEMORY `session_2026-05-29`: real `FinanceExtendedPayrollService`, compute() FE bilan bayt-ma-bayt INPS8/JSHD12/1.12M, calculate/runPayroll idempotent/approve).
- DB: `payroll_contracts`=0, `payroll_calculations`=0 — **0 shartnoma, 0 hisob**.
- FE `/accounting/payroll-automation` — payroll UI bor lekin BO'SH (asl-holat hisoboti §B: "0 shartnoma, Ma'lumot topilmadi").
- Vizyon "HR→kassir oylik tarqatish" — payroll-hisoblash bor, lekin **kassirga ulanish + tarqatish oqimi yo'q** (asl-holat: kassir = retail POS, noto'g'ri konsept).

### 9.2. HR → OSHXONA — ❌ YO'Q (~5%)
- `mro_canteen_logs` (0 qator) — **MRO modulida**, faqat aggregate ustunlar (meal_name, portion_count, employees_served=raqam, cost). **Xodim FK YO'Q.**
- `CanteenManagementPage.tsx` (MRO) — alohida oshxona xarajat logi.
- HR↔oshxona bog'lanish (xodim ovqat allokatsiyasi/talon) **umuman yo'q**.

### 9.3. HR → CC / Kanban / Telegram — ✅ qisman
- CC org-resolver (3-bo'lim) — HR org strukturasidan tasdiqlovchi.
- `hr.bot.ts` (telegram), `telegram-bots/*.repo.ts` — org_departments dan rahbar/profil.
- 25+ kompat/integration servis `org_departments` o'qiydi (employee-list-acl, hr-dashboard, daily-report, monthly-card...).

---

## 10. HR SAHIFALAR (sidebar) — ~30 ta

`constants.ts` "Xodimlar" guruhi (yagona kanonik sidebar):
- **TASHKILOT:** HR Dashboard, **Org Tuzilma** (`org-structure/hierarchy`), HR Xarita (`hr-map`), Rekruting Voronka, AI Intervyu.
- **360° PROFIL:** Xodimlar (`employees`), AI HR Dashboard.
- **DAVOMAT VA SMENA:** Smena Jadvali, Ta'til va Kasallik, Xodim Baholash, Ko'nikmalar Matritsasi, Succession.
- **ONBOARDING:** Onboarding, Offboarding, Sog'liq Nazorati, Kasbiy O'sish, Xavfsizlik.
- **HR V2:** Kunlik Hisobot, Reception, Referral, HR Brend.
- + HR Capital Testlar, HR↔LMS, camera-employees/ratings, employee-kpi, HR Agent.

HR controllerlar: **40 ta** (`*.controller.ts` HR modulida) — recruitment(6), attendance, leave, payroll, onboarding, offboarding, pip, enps, feedback-360, skills-matrix, daily-report, safety, shift, applications, ai-interview-v2, reception, career-path, inspection, hr-assets, + presentation(15: employees/dashboard/payroll/leave/questionnaire/goals/gsd...).

---

## 11. ❌ KRITIK DATA-YAXLITLIK MUAMMOSI: `employees` ↔ `users` UZILGAN

Tasdiqlandi (DB):
- `employees`=30, `users`=31.
- `employees.id` JOIN `users.id` → **0 mos** (id_match=0) — ya'ni employee ID ≠ user ID.
- `employees.user_id` → **30/30 NULL** (emp_with_user=0).
- `employee_org_departments.user_id` JOIN users → **30/30 mos** ✅.

**Oqibat:**
1. CC org-resolver `MANAGER_OF_SENDER` (`employees.manager_id`→user_id) va `POSITION:CODE` (`employees.user_id`) — **NULL tufayli ishlamaydi** (BadRequestException qaytaradi).
2. `org-queries.repo.ts:201,214` `getDirectManager`/`getTelegramGroup` — `LEFT JOIN employees e ON e.id::text = u.id::text` — id≠id tufayli telegram_chat_id **doim NULL**.
3. Xodim profili (`/api/hr/employees/:id`, employees.id bo'yicha) ↔ org (user_id bo'yicha) — 2 xil identifikator → bog'lanish nozik.

> Bu vizyonning eng kuchli qismi (org-sxema skeleti) ustiga qurilgan, lekin `employees↔users` ko'prigi qurilmagani uchun zanjirning bir qismi (CC employee-based resolverlar, telegram) jonli data'da uziladi. **Tuzatish: `employees.user_id` ni to'ldirish yoki bitta kanonik identifikatorga ko'chish.**

---

## 12. XULOSA — necha %

| Bo'lim | % | Holat |
|---|---|---|
| Org-sxema sahifasi | ~90% | ✅ to'liq interaktiv, real data |
| Tasdiq zanjiri skeleti (P2P+CC+fan-out) | ~70% | ✅ kod, data-gap (head 18/141, user_id NULL) |
| Ruxsat skeleti (position-RBAC + guard) | ~75% | ✅ enforce, 177 route |
| Lavozim kartochkasi (Portret) | ~30% | ⚠️ UI boy, backend STUB |
| Lavozim → kerakli jihozlar | ~5% | ❌ model yo'q |
| Xodim profili (20+ tab CRUD) | ~75% | ✅ UI+endpoint, data 0 |
| Mening jihozlarim/inventarim | ~45% | ⚠️ backend bor (POS), data 0 |
| Xodim kodi (shtrix) | ~40% | ⚠️ matn kod bor, shtrix yo'q |
| HR→kassir (oylik) | ~35% | ⚠️ payroll servis bor, 0 data, kassir ulanmagan |
| HR→oshxona | ~5% | ❌ yo'q |

### **UMUMIY HR/ORG-SXEMA: ~55–60%**

**Kuchli (vizyon "tana"):** Org-tree (142 node, real EuroPrint), tasdiq zanjiri (P2P + CC resolver + delegatsiya + fan-out), position-RBAC matritsa (1380, guard enforce), xodim profili (20+ tab), xodim↔bo'lim M:N. Bu — vizyonning skelet g'oyasi va u HAQIQATAN qurilgan.

**Zaif:** (1) Lavozim kartochkasi backend STUB (portret saqlanmaydi) — bu vizyon nuqtasi funksional emas. (2) "Kerakli jihozlar" modeli umuman yo'q. (3) `employees.user_id` NULL → CC employee-resolverlari va telegram jonli data'da uzilgan. (4) Xodim kodi shtrix emas (matn). (5) HR→oshxona yo'q; HR→kassir to'liq ulanmagan. (6) Hamma operatsion data bo'sh (qurilish bosqichi).

**Keyingi qadam (egasi rejasi uchun):** 1) Portret backend'ini real qilish (`org_node_portret`/portret_data JSONB jadval) — eng tez yutuq. 2) `position_equipment` jadval + lavozim kartochkasiga "kerakli jihozlar". 3) `employees.user_id` to'ldirish (CC resolver + telegram tuzaladi). 4) Xodim kodiga QR/shtrix badge (POS scanner infra qayta ishlatib). 5) HR→kassir oylik tarqatish oqimi. 6) HR→oshxona (xodim ovqat allokatsiya/talon).

---

*Tahlil 2026-06-02 — kod (fayl:satr) + jonli DB (`europrint`). Hech narsa o'zgartirilmadi. Brauzer ishlatilmadi (kod+DB yetarli dalil).*
