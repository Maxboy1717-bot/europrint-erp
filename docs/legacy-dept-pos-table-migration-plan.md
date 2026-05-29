# Legacy `departments` / `positions` jadvallarini DROP qilish — bosqichli reja

> **Sana:** 2026-05-29 | **Holat:** REJA (bajarilmagan) | **Egasi:** HR/Platforma
>
> Bu hujjat legacy `departments` + `positions` DB jadvallarini **xavfsiz** olib
> tashlash uchun bosqichli rejani belgilaydi. Hozircha **DROP QILINMAYDI** — pastdagi
> ~50 ta BE consumer avval org-sxemaga (`org_departments` + `org_functions`) ko'chirilishi shart.

---

## 1. Hozirgi holat (2026-05-29 tekshirildi)

| Narsa | Holat |
|---|---|
| FE (form/profil/filtr) | ✅ 100% org-sxema (`/api/org-departments`, `/api/org-functions`) |
| Legacy HTTP endpoint (`/api/departments`, `/api/positions`) | ✅ Olib tashlangan (404) |
| Regress-guard (`check-no-legacy-dept-pos.mjs`) | ✅ Yangi FE ishlatishni bloklaydi |
| Legacy `positions` jadval | ⚠️ 96 qator — JONLI ishlatiladi |
| Legacy `departments` jadval | ⚠️ 18 qator — JONLI ishlatiladi |
| `position_permissions` (ACL) | ⚠️ **1380 qator** — jonli feature |
| `position_required_courses` / `_skill_requirements` / `_folders` | 0 qator (bo'sh — feature ishlatilmagan) |
| `employees.org_function_id` | ✅ 30/30 to'la (org-sxema tayyor) |
| `employees.position_id` / `department_id` | 30/30 (legacy — ko'chiriladi) |
| `users.org_function_id` | ✅ 30/30 to'la |
| `users.position_id` | 30/30 (legacy — auth ishlatadi) |
| `org_functions` / `org_departments` | 97 / 142 qator (org-sxema to'la) |

**Asosiy yengillik:** har bir xodim/foydalanuvchida `org_function_id` ALLAQACHON to'ldirilgan.
Shuning uchun xodimga-bog'liq consumer'lar `position_id → positions` o'rniga
to'g'ridan `org_function_id → org_functions`ga o'tishi mumkin (per-row mapping shart emas).
Faqat `position_permissions` (1380 ACL) `position_id → org_function_id` mapping talab qiladi.

---

## 2. Consumer inventari (~50 BE fayl, 3-kategoriya)

### A. 🔴 KRITIK — auth/ruxsat
- `modules/auth/infrastructure/repositories/drizzle-my-permissions.repo.ts` —
  `users JOIN positions JOIN departments` ruxsat hisoblash.
- `position_permissions` jadval (1380 qator) — lavozim asosidagi ACL.

### B. 🟠 Crons (ishga ta'sir qiladi)
- `cron/birthday.cron.ts` · `cron/daily-report.cron.ts` (operator filtri title bo'yicha) ·
  `cron/fp-cycle.cron.ts` (bo'lim nomi bo'yicha) · `cron/repositories/absence-block.repository.ts`
  (HR/director/manager eskalatsiya title bo'yicha) · `cron/vacancy-deadline.cron.ts`.

### C. 🟡 Feature/analitika
- Rekruting: `succession-compat.service.ts` · `candidates-compat.service.ts` ·
  `hr/career-path/career-path.repository.ts` (current/target position).
- Direktor: `director/analytics/*` (analytics, analytics-extended, zvs, zno, director-data).
- Boshqa: `finance/.../finance-payroll.repository.ts` · `erp/erp-camera.repository.ts` ·
  `communication-center/.../cc-org-resolver.service.ts` · `export/export.repository.ts` ·
  `iot/.../drizzle-iot-tablet.repo.ts` · `employee-kpi-compat.service.ts` ·
  `discipline-records-compat.service.ts` · `hr/shift/shift.repository.ts` ·
  `hr/attendance/territory-log.repository.ts` · `hr/applications/applications.repository.ts` ·
  `hr/presentation/hr-questionnaire.controller.ts` · `hr-employees-ext.repository.ts` ·
  `hr-compat-a/safety.repository.ts` · `common/database/queries-remaining-a/b.ts` ·
  `legacy-warehouse.helpers.ts` · `employees-compat*.service.ts` · `employees-payload.adapter.ts`
  (create'da positionId validatsiyasi).
- Schema/seed/migration: `schema-misc-app-a.ts` (hrPositions/hrDepartments def) ·
  `master-data.seed.ts` · `backfill-org-functions.ts` · bir nechta `*.sql`.

> ⚠️ `org_functions`da `positions.id`ga to'g'ridan bog'lovchi ustun YO'Q. Mapping:
> per-employee `org_function_id` orqali (tayyor), `position_permissions` uchun esa
> `positions.name ↔ org_functions.position_name` bo'yicha (yoki aniq mapping jadvali).

---

## 3. Bosqichli reja (har bosqich: tsc + boot + commit)

### FAZA 0 — Mapping + tayyorgarlik
1. `positions.id → org_functions.id` va `departments.id → org_departments.id` mapping
   jadvalini (yoki CTE) yarating. Tekshiring: har bir ishlatilayotgan `position_id`/
   `department_id` uchun org-ekvivalent bormi (NULL qolmasin).
2. `users`/`employees`da `org_function_id` to'liqligini tasdiqlang (hozir 30/30 — yangi
   xodimlarda ham to'lishini `saveEmployee` da kafolatlang).

### FAZA 1 — 🔴 Auth/ACL (eng kritik, alohida + ehtiyot)
1. `drizzle-my-permissions.repo.ts`: `users JOIN positions/departments` →
   `users.org_function_id JOIN org_functions` (+ `org_functions.department_id JOIN org_departments`).
2. `position_permissions` (1380): `org_function_permissions` ga ko'chiring (yoki `position_id`
   ustunini `org_function_id`ga repoint + data backfill mapping bo'yicha).
3. **Tekshiruv:** login + ruxsatlar (super_admin/hr/director) end-to-end ishlashini tasdiqlang.

### FAZA 2 — Crons
- Har cron'da `leftJoin(hrPositions/hrDepartments)` → `org_functions/org_departments`
  (`employees.org_function_id` orqali). Title/name filtrlarini `org_functions.position_name` /
  `org_departments.name` ga moslang. Har cron'ni qo'lda trigger qilib tekshiring.

### FAZA 3 — Rekruting/karera
- `succession`, `candidates`, `career-path`: `position_id` joinlarni org-sxemaga repoint.
  (Eslatma: bu jadvallarning o'z `position_id` ustunlari bor — backfill mapping kerak.)

### FAZA 4 — Analitika/feature
- Direktor analitika, finance-payroll, camera, comm-center, export, iot, kpi, discipline,
  shift, territory, applications: dept/pos joinlarni org-sxemaga repoint. Modul-ma-modul.

### FAZA 5 — Employee detail tozalash
- `drizzle-hr-base.repo.ts findEmployeeById`: legacy `department_name`/`position_name`
  (hrDepartments/hrPositions join) ni olib tashlang — endi `orgPositionName`/`orgDepartmentName`
  ishlatiladi. Boshqa employee-list query'larda ham.
- `employees-payload.adapter.ts`: create'da `positionId` validatsiyasini `org_function_id`ga
  o'zgartiring yoki olib tashlang.

### FAZA 6 — Legacy FK ustunlarni olib tashlash
- `employees.position_id`, `employees.department_id`, `users.position_id` — barcha consumer
  ko'chgach, `@deprecated` → keyin DROP COLUMN (alohida migration, ADD-ONLY ehtiyot bilan).

### FAZA 7 — Jadvallarni DROP qilish
- `position_permissions` (ko'chirilgan), `position_required_courses/_skill_requirements/_folders`
  (bo'sh — to'g'ridan DROP) → keyin `positions` → `departments`.
- `schema-misc-app-a.ts` dan `hrPositions`/`hrDepartments` Drizzle def'larini olib tashlang.

---

## 4. Tekshirish (har faza)
- `cd apps/api && npx tsc -p tsconfig.json --noEmit` → 0.
- BE boot DI OK (`dev:unsafe` + endpoint probe).
- FAZA 1 dan keyin: **login + ruxsat** majburiy end-to-end test.
- Cron fazalaridan keyin: har cron'ni qo'lda trigger.
- Yakuniy: `grep -rn "hrPositions|hrDepartments|FROM positions|FROM departments"
  apps/api/src` → faqat seed/migration qoladi (jonli kod 0).

## 5. Risk
- **Auth/ACL** (FAZA 1) — noto'g'ri migratsiya = ruxsat buzilishi. Eng katta ehtiyot.
- **1380 ACL qatori** — data migration (mapping bo'yicha), tekshiruvsiz DROP qilinmaydi.
- Crons title/name filtrlari — `org_functions.position_name` matni legacy `positions.title`
  bilan bir xil bo'lishini tasdiqlang (aks holda eskalatsiya/filtr buziladi).

## 6. Hajm bahosi
~50 fayl + 1380-qatorli ACL migratsiyasi + auth + 6+ cron. **Ko'p haftalik, modul-ma-modul**
ish — bir martalik emas. FAZA 1 (auth) eng yuqori xavf; alohida PR + to'liq test bilan.
