# EuroPrint ERP — 4 Haftalik Production Plan (2026-05-20)

**Boshlash**: 2026-05-20 (1-kun)
**Yakun**: 2026-06-16 (20-kun)
**Maqsad**: 70% → 100% production-ready, prod-deploy
**Bajaruvchi**: Solo, sequential
**Asosiy qoida**: ADD-ONLY (faqat yangi qo'shamiz), bitta istisno — `departments`+`positions` o'rniga org-sxema

---

## 🗓️ HAFTA 1 — Org-Sxema Migration

### Kun 1 (2026-05-20) — DB backup + Audit + Plan

**Maqsad**: Migration uchun to'liq xaritalash + xavfsiz boshlash

**Vazifalar**:
1. **DB backup** (men qilaman):
   - `pg_dump` → `backups/2026-05-20-pre-migration.dump`
   - Yangi DB schema snapshot: `lib/db/schema-snapshot-pre.json`
   - Backup verifikatsiya: restore test'i sandboxda

2. **Audit ro'yxati yozish**:
   - `docs/migration/dep-pos-fk-map.md` — barcha 58 FK joylari
   - `docs/migration/dep-pos-be-files.md` — 72 BE fayl ro'yxati
   - `docs/migration/dep-pos-fe-files.md` — 80 FE fayl ro'yxati
   - Har biri uchun: nima qiladi, qanday almashtirish kerak

3. **Vysotskiy 7 Otdeleniye seed plan**:
   - `docs/migration/vysotskiy-7-tree.md` — to'liq daraxt (Egasi → CEO → 7 Otd → Otdellar → Sektsiyalar → Sektorlar)
   - 30+ bo'lim joylashuvi har Otdeleniye ichida
   - 112 ta lavozim → har biri `org_functions` ga o'tkazish (departmentId + positionName + tskp + level)

**Deliverable kuni oxirida**: DB backup hayotda, migration plan to'liq yozilgan
**Verify**: `pg_restore --list backup.dump | wc -l` > 0; docs/migration/ 4 ta fayl

---

### Kun 2 (2026-05-21) — Backfill: xodimlar org-tree'ga

**Maqsad**: 400 xodim eski FK'lardan org-tree'ga ko'chiriladi

**Vazifalar**:
1. **Yangi seed**: `lib/db/src/seed-vysotskiy.ts`
   - 7 Otdeleniye yaratish (org_departments, level=2)
   - 30+ bo'lim yaratish (level=3, parent = Otdeleniye)
   - Sektsiyalar (level=4) + Sektorlar (level=5) — kerakli joylarda
   - Har bir lavozim uchun `org_functions` (departmentId + positionName + nameUz + nameRu + tskp + tskpRu + tskpTarget)

2. **Backfill skripti**: `apps/api/src/scripts/migrate-employees-to-org.ts`
   - Har employee uchun:
     - `departments.code` → kerakli `org_departments.id` topish
     - `positions.code` → kerakli `org_functions.id` topish (departmentId match)
     - `employee_org_departments` ga INSERT
     - `employee_functions` ga INSERT (workloadPercent=100, isPrimary=true)

3. **Verifikatsiya**: 400 employee = 400 `employee_org_departments` + 400 `employee_functions`

**Deliverable**: 400 xodim org-tree'da, eski FK'lar hali ham ishlaydi
**Verify**: `SELECT COUNT(*) FROM employees WHERE id NOT IN (SELECT user_id FROM employee_functions)` = 0

---

### Kun 3 (2026-05-22) — 58 FK Migration

**Maqsad**: Barcha FK references `departments.id` → `org_departments.id`, `positions.id` → `org_functions.id`

**Vazifalar**:
1. **Schema o'zgartirish** (15 schema faylda):
   - `core-users.ts`, `core-schema.ts`, `employees.ts`, `users.ts`
   - `hr-architecture-additions.ts`, `hr-compensation.ts`, `hr-personal-core.ts`, `hr-performance-ext.ts`
   - `fi-gl.ts`, `position-permissions.ts`, va boshqalar
   - Har FK ni `references(() => orgDepartments.id)` ga o'tkazish
   - Yangi column nomi: `orgDepartmentId`, `orgFunctionId` (eski ham qolsin parallel)

2. **Drizzle migration generate**:
   - `pnpm --filter @workspace/db run generate`
   - Migration file inspect + manual edit:
     - `ALTER TABLE x ADD COLUMN org_department_id INT REFERENCES org_departments(id)`
     - `UPDATE x SET org_department_id = (mapping query)`
     - Eski column'lar 1 hafta tegmaydi (rollback xavfsizlik)

3. **Migration test**:
   - Sandbox DB ga apply
   - Sample SELECT bilan tekshirish
   - Rollback test (`migration:down`)

**Deliverable**: 58 FK migrated, eski column'lar parallel, sandbox PASS
**Verify**: `pnpm --filter @europrint/api exec tsc --noEmit` → 0 error

---

### Kun 4 (2026-05-23) — Backend refactor (72 fayl)

**Maqsad**: BE service/repository/controller'lar org-tree'dan o'qisin

**Vazifalar**:
1. **Avtomatik replace** (sed-script):
   - `db.select().from(departments)` → `db.select().from(orgDepartments)`
   - `eq(departments.id, X)` → `eq(orgDepartments.id, X)`
   - Manual ko'rib chiqish (sed-script noto'g'ri tegmagan joylari)

2. **Per-modul tekshirish** (72 fayl):
   - HR modullari: 30 fayl (employees, attendance, payroll, leave, ...)
   - Finance: 10 fayl (gl, ap, ar, kassa)
   - WMS/POS: 10 fayl (warehouses bilan ishlash)
   - Org-structure: 5 fayl (asosiy)
   - Boshqalar: 17 fayl

3. **Typecheck barcha o'zgarishlardan keyin**:
   - `pnpm --filter @europrint/api exec tsc --noEmit`
   - Har 10 ta fayldan keyin commit

**Deliverable**: BE typecheck PASS, eski API endpoint'lar yangi schema'dan o'qiydi
**Verify**: `bash scripts/reviewer-result-pattern.sh` + `reviewer-array-safety.sh` PASS

---

### Kun 5 (2026-05-24) — Frontend refactor + DROP TABLE

**Maqsad**: FE org-tree'dan o'qisin + eski jadvallar o'chsin

**Vazifalar**:
1. **Frontend o'zgartirish** (80 fayl):
   - `useQuery(['/api/departments'])` → `useQuery(['/api/org-structure/departments'])`
   - `useQuery(['/api/positions'])` → `useQuery(['/api/org-structure/functions'])`
   - `Department` type → `OrgDepartment` import
   - `Position` type → `OrgFunction` import

2. **Sahifa ko'rsatish**: Departments.tsx, Positions.tsx, Employees.tsx, OrgChartPage.tsx
   - Yangi API'dan o'qiydi
   - Dropdown'lar org-tree'dan select qiladi

3. **FINAL DROP**:
   ```sql
   ALTER TABLE employees DROP COLUMN department_id;
   ALTER TABLE employees DROP COLUMN position_id;
   ALTER TABLE employees DROP COLUMN manager_department_id;
   -- (boshqa 55 ta column)
   DROP TABLE positions;
   DROP TABLE departments;
   ```

4. **Schema fayllarini ham o'chirish**:
   - `lib/db/src/schema/departments.ts` — DELETE
   - `lib/db/src/schema/positions.ts` — DELETE
   - `lib/db/src/schema/master-config.ts` — qolsin (leaveTypes, shiftTypes va h.k.)
   - `lib/db/src/seed.ts` — eski dept+pos qismi olib tashlanadi

**Deliverable**: Org-sxema yagona manba, eski jadvallar yo'q
**Verify**: 
- `grep -r "from.*departments['\"]" lib/db/src/schema/` → 0
- `pnpm --filter @workspace/erp-dashboard run typecheck` → PASS
- `node check-route-dups.mjs` → 0 yangi dup

---

## 🗓️ HAFTA 2 — POS MONITOR yangi funksiyalar

### Kun 6 (2026-05-25) — useHardwareScanner Hook

**Maqsad**: Global skaner detector (USB/Bluetooth/keyboard wedge)

**Vazifalar**:
1. **Yangi hook**: `artifacts/erp-dashboard/src/pos-monitor/hooks/useHardwareScanner.ts`
   - Keyboard wedge detection: 10-50ms ichida 6-20 keystroke → skaner
   - WebHID API: `navigator.hid.requestDevice()` (Chrome/Edge)
   - Web Serial API: `navigator.serial.requestPort()` (Chrome/Edge)
   - Event callback: `onScan(barcode: string, source: 'wedge'|'hid'|'serial'|'camera')`

2. **Skaner connection status komponenti**: `pos-monitor/components/ScannerStatus.tsx`
   - Ulangan/uzilgan/batareya (HID device data)

3. **Test sahifa**: PosDashboard.tsx ga test integratsiyasi — har scan toast'da ko'rinadi

**Deliverable**: Hook ishlaydi, har bir scan event'ni qaytaradi
**Verify**: Manual test — USB skaner bilan har turli sahifada scan

---

### Kun 7 (2026-05-26) — 7 sahifa skaner workflow

**Maqsad**: Har sahifada skaner kerakli workflow'ni bajaradi

**Vazifalar**:
1. **PosMovementKirim** — har scan = yangi qator yoki +1 miqdor
2. **PosMovementChiqim** — har scan = balans guard tekshiruv + qator topib chiqim
3. **PosInventory** (sanab) — har scan = joriy ro'yxatda topib +1 (xato bo'lsa "boshqa material" ogohlantirish)
4. **PosMaterial360** — scan = o'sha material sahifasiga navigatsiya (1 scan = 1 navigate)
5. **PosMyInventory** — operator o'ziga material qabul qiladi scan bilan
6. **PosLotTraceability** — lot QR scan = tarix ko'rsatadi
7. **PosQuarantine** — karantindan chiqarish scan bilan tasdiqlash

**Har sahifa uchun**: `useHardwareScanner({ onScan: handleScan })` qo'shiladi. Eski kod tegmaydi.

**Deliverable**: 7 ta sahifa skaner bilan to'liq ishlaydi
**Verify**: Manual UAT 7 sahifa, har biri scan workflow'ni o'tkazadi

---

### Kun 8 (2026-05-27) — Skaner UX kengaytirish

**Maqsad**: Professional warehouse scanner UX

**Vazifalar**:
1. **`ScannerFeedback.tsx`**:
   - Audio: ping (topildi), buzz (topilmadi), beep (xato)
   - Vibratsiya: `navigator.vibrate(50)` (mobile)
   - Visual: green/red flash overlay

2. **`ScannerOnlyLayout.tsx`** (skaner-only mode):
   - Full-screen wrapper
   - Klaviatura/sichqoncha hidden
   - Faqat skaner input + katta visual feedback
   - Operator qo'lqop bilan ishlay oladi

3. **Bluetooth skaner**:
   - WebHID via Bluetooth profile
   - Pairing UI (`pos-monitor/components/BluetoothPairing.tsx`)
   - Auto-reconnect

**Deliverable**: Skaner-only mode + Bluetooth ishlaydi
**Verify**: Mobile telefon + Bluetooth skaner bilan UAT

---

### Kun 9 (2026-05-28) — FEFO + Warehouse type kengaytirish

**Maqsad**: Muddatli materiallar uchun FEFO, 30+ bo'lim ombori

**Vazifalar**:
1. **FEFO Service**: `apps/api/src/modules/pos/application/services/pos-fefo.service.ts`
   - Material muddati bor → FEFO (muddati qisqa birinchi)
   - Material muddati yo'q → FIFO (eski kelgan birinchi)
   - `IPosBatchRepository.findOldestByExpiry(materialId)`
   - Movement service'da: chiqim uchun batch tanlash FEFO/FIFO bilan

2. **Warehouse type kengaytirish**:
   - `lib/db/src/schema/wms-schema.ts` enum'ga qo'shish: `department_warehouse`
   - `department_warehouse_map` jadval — `org_departments.id` ↔ `warehouses.id`
   - 30+ DEPARTMENT_* yaratish (Vysotskiy 7 ichidagi bo'limlar uchun)

3. **Frontend filter**: PosWarehouses sahifada bo'lim filtri

**Deliverable**: FEFO ishlaydi, 30+ department warehouse mavjud
**Verify**: Sample data — muddati yaqin batch birinchi chiqadi

---

### Kun 10 (2026-05-29) — Smena Audit + AuditAll

**Maqsad**: Har klik audit log'da

**Vazifalar**:
1. **Smena audit**: `apps/api/src/modules/pos/application/services/pos-shift-audit.service.ts`
   - Login → `shift_audit` jadvalga INSERT (userId, loggedInAt, ip, userAgent)
   - Logout → `loggedOutAt` UPDATE
   - Sessiya tugashi → auto-logout cron

2. **`@AuditAll` decorator**: `apps/api/src/common/decorators/audit-all.decorator.ts`
   - Controller'ga qo'yilsa — barcha endpoint'lar audit log'ga yoziladi
   - Method-level @SkipAudit override

3. **Apply 27 ta POS controller'ga**:
   - `pos.controller.ts`, `pos-wms.controller.ts`, `mini-app.controller.ts` va h.k.
   - `@Controller(...) @AuditAll`

4. **Audit log table** (agar yo'q bo'lsa kengaytirish): action, controller, method, userId, ip, ts, payload (sanitized)

**Deliverable**: Har POS klik audit log'da
**Verify**: 10 ta endpoint chaqirib, `audit_log` jadvalda 10 ta yozuv

---

## 🗓️ HAFTA 3 — AI INTERVIEW + AVTO-CRON'LAR

### Kun 11 (2026-05-30) — Gemini LIVE WebRTC

**Maqsad**: Live video interview ERP ichida ishlaydi

**Vazifalar**:
1. **Gemini LIVE WebSocket gateway**: `apps/api/src/modules/hr/ai-interview-v2/gemini-live.gateway.ts`
   - WebSocket connection Gemini LIVE API ga (`AI_INTEGRATIONS_GEMINI_LIVE_URL`)
   - Bi-directional audio/video stream
   - Token management (refresh)

2. **WebRTC video sahifa**: `artifacts/erp-dashboard/src/pages/AIInterviewLive.tsx`
   - Peer-to-peer connection (kandidat ↔ ERP server)
   - Camera + mikrofon permission
   - Video preview + AI bot avatar

3. **Interview link generator**: `apps/api/src/modules/hr/ai-interview-v2/interview-link.service.ts`
   - Har nomzodga unique link: `https://app/interview/{tokenId}`
   - 24h amal qilish, bir martalik
   - Link Telegram orqali yuboriladi (HR bot)

**Deliverable**: Test nomzod link orqali kirib, AI bilan video gaplashadi
**Verify**: 1 ta tirik test session

---

### Kun 12 (2026-05-31) — AI Behavioral Analyzer

**Maqsad**: Nomzodning xulq-atvori AI tomonidan baholanadi

**Vazifalar**:
1. **Service**: `apps/api/src/modules/hr/ai-interview-v2/behavioral-analyzer.service.ts`
   - Face landmark detection (`@tensorflow-models/face-landmarks-detection`)
   - Emotion classification (Gemini Vision API'ga frame yuborib)
   - Posture detection (gavda holati)
   - Audio sentiment (tovushdan ruhiy holat)

2. **Schema**: `lib/db/src/schema/ai-behavioral-scores.ts`
   - `ai_behavioral_scores`: candidate_id, session_id, ts, emotion, posture_score, audio_sentiment, attention_score

3. **Frontend ko'rsatish**: AIInterviewLive sahifada real-time gauge widgets

4. **Rapor**: Interview tugaganidan keyin behavioral summary PDF

**Deliverable**: Test session — behavioral skor real-time hisoblanadi
**Verify**: 1 ta interview = 1 ta behavioral report

---

### Kun 13 (2026-06-01) — Position Question Bank + Adaptive Test

**Maqsad**: Har lavozim uchun savol banki + adaptive test engine

**Vazifalar**:
1. **Schema**: `lib/db/src/schema/hr-question-bank.ts`
   - `hr_question_bank`: id, org_function_id, category (technical/behavioral/iq/leadership), question, expected_keywords (array), difficulty, lang
   - `hr_question_responses`: candidate_id, question_id, answer, score, ts

2. **Admin UI**: `artifacts/erp-dashboard/src/pages/HRQuestionBankAdmin.tsx`
   - Lavozim tanlash → savollar ro'yxati
   - CRUD: yangi savol qo'shish, tahrirlash, o'chirish
   - Import/Export Excel

3. **Adaptive Test Engine**: `apps/api/src/modules/lms/application/services/adaptive-test.service.ts`
   - Birinchi savol — o'rta darajada
   - Javob to'g'ri → keyingi savol qiyinroq
   - Javob noto'g'ri → keyingi savol osonroq
   - Pirovardida adaptive skor

**Deliverable**: 10 ta lavozim uchun savol bor + adaptive test ishlaydi
**Verify**: 1 ta candidate test'dan o'tadi, score hisoblanadi

---

### Kun 14 (2026-06-02) — 3 ta cron

**Maqsad**: Avto-discipline + avto-jarima + avto-invoice

**Vazifalar**:
1. **`absence-auto-block.cron.ts`** (har kuni 07:00):
   - `SELECT employees WHERE last_attendance_at < NOW() - INTERVAL '3 days'`
   - `UPDATE employees SET block_erp_access = true, blocked_reason = 'Auto-block: 3 day absence'`
   - HR ga Telegram xabar (`notification-bot` orqali)
   - Audit log

2. **`late-arrival-auto-fine.cron.ts`** (har kuni 10:00):
   - Bugun kech kelgan xodimlar (attendance.checkInTime > shift.startTime + grace_period)
   - Auto-document yaratish: `hr_disciplinary_actions` jadvalga PROPOSAL (tasdiqlamaguncha jarima yozilmaydi)
   - Xodimga Telegram: "Kech kelganingiz uchun jarima taklif qilindi, sabab yozing"
   - HR rahbar tasdiqlasa → jarima yoziladi, aks holda bekor

3. **`operator-hourly-invoice.cron.ts`** (har soat oxirida):
   - Uskunada ishlaydigan xodimlar (employees WHERE is_machine_operator = true)
   - Oxirgi 1 soat production facts
   - PDF invoice yaratish (`pdfkit` yoki `@react-pdf/renderer`):
     - Xodim ismi + machine + ishlab chiqarilgan miqdor + sifat % + soatlik to'lov
     - Oylik aggregated qism
   - Xodim profiliga saqlash + Telegram yuborish

**Deliverable**: 3 ta cron ro'yxatdan o'tgan, har kuni ishlaydi
**Verify**: Manual run — 3 sample event yoziladi

---

### Kun 15 (2026-06-03) — Yana 4 ta cron + 1 service

**Maqsad**: Tabriklash + boomerang + reference-image + daily report

**Vazifalar**:
1. **`birthday-greeting.cron.ts`**:
   - 07:30 — hammaga ertalab tabriklash (Telegram broadcast, birthday xodim+1)
   - 18:00 — birthday xodimga shaxsiy AI-yozgan xabar
   - Mavjud rahbarga eslatma

2. **`boomerang-notification.service.ts`** + cron:
   - Yangi vakansiya ochilsa → eski xodimlar bazasidan o'xshashlik (skill match)
   - Top 5 ta eski xodimga Telegram xabar: "Sizga moslashadigan vakansiya"

3. **`reference-image-compare.cron.ts`** (har 2 soatda):
   - Har xona/bo'lim uchun saqlangan ideal-rasm
   - IoT kamera hozirgi suratni olib, Gemini Vision orqali farq detect
   - Sezilarli farq → HR + bo'lim boshlig'iga xabar

4. **`daily-report-deadline.cron.ts`** (har kuni 23:00):
   - Bugun report yubormagan xodimlar
   - "Ishlamagan" status qo'yiladi (HR menejer keyin to'g'irlay oladi)
   - Avto-jarima taklif (yana proposal)

**Deliverable**: 4 ta cron + boomerang ishlaydi
**Verify**: Manual run har biri

---

## 🗓️ HAFTA 4 — POLISH + PRODUCTION DEPLOY

### Kun 16 (2026-06-04) — Document Workflow Engine

**Maqsad**: Hujjat org-chart bo'yicha avtomatik yuradi

**Vazifalar**:
1. **`org-routing-engine.service.ts`**:
   - Input: hujjat turi + boshlovchi xodim
   - Algoritma:
     - Org-tree'dan boshlovchining yo'lini topish
     - Vertikal: yuqori bosqichlarga (rahbar zanjiri)
     - Gorizontal: bo'lim'dan bo'limga (workflow rule'larga ko'ra)
   - Output: tasdiqlash zanjiri (ordered list)

2. **Admin "yo'l chizish" UI**: `artifacts/erp-dashboard/src/pages/DocumentRoutingAdmin.tsx`
   - Hujjat turi tanlash
   - Drag-drop bo'lim/lavozim qo'shish
   - Visual workflow editor (React Flow)
   - Saqlash → DB

3. **Tasdiqlash UX**:
   - Tasdiqlash → o'tadi
   - Yo'q → sabab MAJBURIY (30+ belgi)
   - Tasdiqlangan hujjat IMMUTABLE (edit yo'q, lekin revision yaratish mumkin)

**Deliverable**: Avans ariza misol — to'liq workflow
**Verify**: 1 ariza yuborilib, vertical+horizontal yo'l o'tadi

---

### Kun 17 (2026-06-05) — Per-Position Virtual Folder

**Maqsad**: Har lavozim uchun materiallar to'plami

**Vazifalar**:
1. **Schema**: `lib/db/src/schema/position-folder-content.ts`
   - `position_folder_content`: id, org_function_id, content_type (document/video/test/link), title, url, sort_order

2. **Sahifa**: `artifacts/erp-dashboard/src/pages/PositionFolderPage.tsx`
   - Lavozim tanlash
   - Materiallar: hujjatlar, video, test, link
   - Admin (HR) CRUD
   - Xodim ko'radi: faqat o'z lavozimi yoki bo'lim boshlig'i

3. **Onboarding integratsiya**:
   - Yangi xodim → o'z lavozimi folder'idan materiallar avtomatik onboarding checklist'ga qo'shiladi

**Deliverable**: 10 ta lavozim uchun folder to'ldirilgan
**Verify**: Xodim profilidan o'z lavozimi folder ko'rinadi

---

### Kun 18 (2026-06-06) — Manager Dashboard + Employee Monthly Card

**Maqsad**: Rahbar va xodim aniq ma'lumotga ega

**Vazifalar**:
1. **Manager 3-vaqtli notification**:
   - `manager-daily-routine.cron.ts`
   - 09:00 — "Bugun nima qilish kerak" (vazifalar, jarayonlar)
   - 13:00 — "Yarim kun: bajarilganlar va qolganlar"
   - 18:00 — "Kun yakuni: hisobot va ertangi reja"

2. **Xodim oylik PDF hisobot kartasi**:
   - `employee-monthly-card.service.ts`
   - Har oy 1-kuni o'tgan oy uchun PDF:
     - Davomat (kunlar, kech kelishlar)
     - Mukofotlar, jarimalar
     - KPI, ABC kategoriya, bonus
     - Tashqi qarz/avans
     - Mentor baholash
   - Saqlash: xodim profili → "Oylik kartalar"
   - Rahbar va xodim ko'radi

3. **30 belgi min sabab xodim baholashda**:
   - Frontend validation: 360-feedback formada `validate.min(30, 'Sabab kamida 30 belgi')`

**Deliverable**: 3 ta yangi cron + PDF generator
**Verify**: Sample manager 3 ta xabar oladi; 1 PDF tayyorlanadi

---

### Kun 19 (2026-06-07) — Production Deploy

**Maqsad**: Prod URL live

**Vazifalar**:
1. **Docker prod build**:
   - `Dockerfile.prod` (multi-stage)
   - `docker-compose.prod.yml`
   - Health check + restart policy

2. **Env validation**:
   - `apps/api/src/config/env.schema.ts` (Zod)
   - Boot'da `ConfigService.validate()` — kerakli env'lar yo'q bo'lsa fail

3. **Monitoring**:
   - Pino structured logging
   - Sentry basic integration (errors)
   - PostgreSQL slow query log

4. **Backup cron**:
   - `pg_dump` har kuni 03:00
   - S3 yoki local fs (config-driven)
   - 7-yil retention (eski backup'larni archive)

5. **Deploy**:
   - Server (siz bergan VPS/AWS/Vercel)
   - Migration apply
   - Seed (admin user + Vysotskiy 7)
   - Nginx config
   - SSL (Let's Encrypt)

**Deliverable**: `https://app.europrint.uz` (yoki sizning domeningiz) live
**Verify**: Login → POS → HR → smoke check

---

### Kun 20 (2026-06-08) — E2E Tests + UAT

**Maqsad**: 5 ta kritik flow test bilan qoplanadi

**Vazifalar**:
1. **HR funnel E2E**: `apps/api/test/e2e/hr-funnel.spec.ts`
   - Vakansiya yaratish → Telegram bot link → AI interview → Behavioral skor → Tasdiqlash → Onboarding boshlash

2. **POS movement E2E**: `pos-movement.spec.ts`
   - Scanner orqali kirim → karantin → QC tasdiqlash → asosiy ombor → GL posting

3. **Document workflow E2E**: `document-workflow.spec.ts`
   - Avans ariza → vertikal → gorizontal → tasdiqlanadi → arxivga

4. **Scanner E2E**: `scanner-workflow.spec.ts`
   - 7 ta sahifada manual scan event → kerakli workflow

5. **AI Interview E2E**: `ai-interview.spec.ts`
   - Token link → WebRTC connection → Gemini bot → Behavioral score → Report

**Deliverable**: 5 spec PASS, manual UAT checklist green
**Verify**: `pnpm --filter @europrint/api run test:e2e` exit 0

---

## 📊 Yakuniy KPI

| Metrika | Boshlash (2026-05-20) | Maqsad (2026-06-08) |
|---|---:|---:|
| POS Monitor tayyorlik | 70% | **100%** |
| HR/Rekruter tayyorlik | 70% | **100%** |
| Org-Sxema tayyorlik | 69% | **100%** |
| Eski departments+positions | 152 fayl ishlatadi | **0** |
| Hardware skaner | YO'Q | ✅ USB+BT+wedge+kamera |
| AI Live video interview | YO'Q (text only) | ✅ Gemini LIVE + WebRTC |
| AI behavioral analyzer | YO'Q | ✅ Face+emotion+posture+audio |
| Avto-cron'lar | 5 (existing) | **15** (10 yangi) |
| Production deploy | YO'Q | ✅ Live URL |
| E2E test svit | YO'Q | ✅ 5 ta spec |

---

## ⚠️ Risk Register

| Risk | Daraja | Mitigatsiya |
|---|---|---|
| DB migration 1-hafta noto'g'ri ketsa | YUQORI | Backup + sandbox test + rollback skripti |
| Gemini LIVE API beta — ishlamasligi mumkin | O'RTA | Fallback text mode (mavjud) |
| WebRTC browser kompatibilik | O'RTA | Chrome/Edge sertifikat; Safari/Firefox limited |
| 400 xodim backfill xato bo'lsa | YUQORI | Per-batch transaction + dry-run |
| Production deploy server muammosi | O'RTA | Docker local test + staging environment |
| Hardware skaner driver muammo | PAST | 3 ta fallback (kamera, manual, wedge) |

---

## 🔁 Har kun ritm

- **09:00-12:00**: Asosiy kodlash
- **12:00-13:00**: Tushlik + integratsiya test
- **13:00-17:00**: Tugatish, commit, verify
- **17:00-18:00**: Hujjatlash, ertangi reja, memory yangilash

**Har kun oxirida**: commit + tag + brief log → `docs/daily-log/<kun>.md`

---

*Reja yakuniy. 2026-05-20 dan boshlanadi. Memory + task list yangilangan.*
