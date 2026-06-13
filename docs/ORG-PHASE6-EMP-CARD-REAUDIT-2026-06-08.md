# ORG #02 — Faza 6 RE-AUDIT (read-only): xodim↔karta (M:N) + oylik→profil

> **Bajaruvchi 🟢 | READ-ONLY re-audit | KOD YO'Q | 2026-06-13**
> Har bir dalil jonli `europrint` DB'da `_audit/q.cjs` bilan isbotlangan (Q-29 verify-don't-trust) + kod `fayl:satr`.
> Bu **KATTA DARVOZA**: model + oylik + DDL o'zgarishi. Egasi tasdiqlamaguncha hech narsa qurilmaydi.
> Manba direktiv: `docs/audit/MUSLIMBEK-PROMT-02K-PHASE6-EMP-CARD-SALARY-2026-06-08.md`.

---

## 0. XULOSA (TL;DR) — egasi qaror qabul qilishi kerak bo'lgan 4 nuqta

| # | Qaror | Nega kerak | Tavsiyam |
|---|-------|------------|----------|
| **D1** | **Oylik manbasi**: kartaning "to'liq oylik"i qaysi qiymat? | `org_functions`'da yagona oylik ustuni YO'Q — faqat `min_salary`/`max_salary` (diapazon) | `max_salary`'ni "to'liq oylik" deb olish (yoki yangi yagona `salary` ustuni qo'shish) — **egasi tanlaydi** |
| **D2** | **≤1 faol xodim/karta** qoidasini hozir majburlaymizmi? | Jonli data 10 ta kartada 2-3 faol xodim saqlaydi → partial unique index **CREATE paytida QULAYDI** | Variant **C** (app-guard, DB unique-index keyinroq) yoki **A** (seat-split) — **egasi tanlaydi** |
| **D3** | **`employee_cards` M:N jadval** yaratishni tasdiqlash | FORMULA A (xodim → ko'p karta yig'indisi) skalyar `org_function_id` bilan IMKONSIZ | HA — yaratish (DDL pastda, Q-35 tasdiq kerak) |
| **D4** | **Oylik birligi** (oylik/soatbay) normalizatsiyasi | `salary_type` hammada NULL — turli birlikni yig'ish ma'nosiz | Hozircha hammasi "oylik" deb faraz; egasi tasdiqlasin |

⚠️ **Eng muhim tushuncha (D2):** direktiv "har karta ≤1 faol xodim" deydi, LEKIN jonli data buning **teskarisi** (kartada ko'p xodim). Bu ziddiyat seat-split (EP-ORG-037) bilan hal bo'ladi — qaysi variantni tanlashingiz Faza 6 ko'lamini belgilaydi.

---

## 1. HOZIRGI MODEL (jonli DB-proof)

### 1.1 Bog'lanish: `employees.org_function_id` (skalyar FK, junction EMAS)
- `employees.org_function_id` = `integer`, **nullable**, default yo'q.
- FK: `fk_employees_org_fn` → `org_functions(id)` **ON DELETE SET NULL** (`pg_get_constraintdef` bilan tasdiqlandi).
- ⭐ **Bu ustunda UNIQUE index YO'Q** (`pg_indexes` → `[]`) → ya'ni model **allaqachon "ko'p xodim → 1 karta"** ga ruxsat beradi.

### 1.2 Sanoqlar (jonli)
```
SELECT COUNT(*) total, COUNT(org_function_id) linked, COUNT(DISTINCT org_function_id) distinct_cards,
       COUNT(*) FILTER(WHERE status='active') active FROM employees
→ total=30, linked=30 (100%), distinct_cards=17, active=30 (hammasi 'active')
```
- 30 faol xodim → 17 ta kartaga taqsimlangan = o'rtacha **1.76 xodim/karta**.

### 1.3 Atomik guard (EP-ORG-002) — faqat ILOVA qatlamida, DB majburlamaydi
- `card.repository.ts:117-123` `activeOccupantCount()`: `SELECT COUNT(*)::int FROM employees WHERE org_function_id=${cardId} AND status='active'`.
- `card.service.ts:53-57` `canAssignEmployee()`: `canAssign = (activeOccupants === 0)` (qat'iy 1-o'rin qoidasi).
- ⚠️ **YAGONA chaqiruvchi = read-only `GET :id/can-assign` (`card.controller.ts:79-82`)**. Hech bir yozuv/assign yo'li guardni chaqirmaydi, DB unique-index ham yo'q → **guard maslahatviy (advisory), majburiy emas**.

### 1.4 ≤1 qoidasini buzgan kartalar (jonli — KRITIK)
```
SELECT e.org_function_id, COUNT(*) cnt, f.position_name FROM employees e
JOIN org_functions f ON f.id=e.org_function_id WHERE e.status='active'
GROUP BY 1,3 HAVING COUNT(*)>1 ORDER BY cnt DESC
```
| karta | xodim | lavozim |
|-------|-------|---------|
| 11 | 3 | HR Boshlig'i |
| 12 | 3 | Sotuvlar Boshlig'i |
| 14 | 3 | Bosh Buxgalter |
| 13,15,16,17,22,23,24 | 2 | (Marketing/IshlabChiqarish/Ombor/Sifat/Flekso/Ofset/O'qitish Boshlig'i) |

➡️ **10 ta karta** ≤1 qoidasini buzadi (23 faol xodim ularda). Xotira "11/12/14 = 3 ta" deb yozgani **TO'G'RI lekin TO'LIQ EMAS** — yana 7 ta karta 2 tadan.

### 1.5 Junction jadval
- `employee_cards`, `employee_org_functions`, `employee_positions`, `staff_cards`, +4 boshqa nom → hammasi `to_regclass = NULL` = **MAVJUD EMAS**.

---

## 2. MAQSAD MODEL (M:N) — multiplikatsiya teskarisi

| | Hozir | Maqsad (direktiv) |
|---|-------|-------------------|
| Xodim → karta | **1 ta** (skalyar) | **Ko'p** (bir xodim bir nechta karta egasi) |
| Karta → xodim | **Ko'p** (cheklovsiz) | **≤1 faol** (atomik o'rin) |

➡️ FORMULA A ("xodimning hamma kartalari oyligi yig'indisi") **xodim→ko'p karta** ni talab qiladi → skalyar `org_function_id` BUNI QILA OLMAYDI → **`employee_cards` junction MAJBURIY** (D3).
➡️ `employees.org_function_id` **saqlanadi** = "asosiy karta" (is_primary) ko'zgusi (back-compat, Q-39 regress yo'q).

---

## 3. OYLIK MAYDONLARI (FORMULA A uchun) — D1

### 3.1 Karta oyligi
- `org_functions`: faqat `min_salary` (numeric), `max_salary` (numeric), `salary_type` (text). **Yagona "oylik" ustuni YO'Q.**
- Fill-rate: `total=97, has_min=0, has_max=0` → **hamma 97 karta NULL** (qurilish bosqichi).
- `org_functions.razryad_level_id` → FK → `razryad_levels(id)` (`org_functions_razryad_level_id_fkey`).

### 3.2 Razryad oyligi
- `razryad_levels`: `salary_min` (numeric), `salary_max` (numeric) — yana **diapazon**, yagona qiymat emas. `COUNT(*)=0` (**bo'sh**).
- Vizyon (razryad→talab→o'sish→oylik): razryad = oylikning yuqori manbai bo'lishi mumkin; karta ustunlari denormalizatsiya nusxasi.

### 3.3 Xodim oyligi
- `employees`: `salary`, `base_salary`, `salary_base` (3 ta numeric) → **hammasi NULL** (0/30).

### 3.4 ⛔ D1 — egasi qaror qilishi kerak
1. **Diapazonning qaysi cheti** "to'liq oylik"? → `max_salary` (tavsiyam, "to'liq"=shift), yoki `min_salary`, yoki o'rta `(min+max)/2`, yoki **yangi yagona ustun** `org_functions.salary` (migration kerak).
2. **Manba**: kartadan (`org_functions.min/max_salary`) yoki razryaddan (`razryad_levels.salary_max` FK orqali)?
3. ⚠️ Hamma oylik NULL → bugun yig'indi **0** bo'ladi (bu normal); FORMULA A har kartada `COALESCE(NULL→0)` qilishi shart (aks holda SQL'da NULL butun yig'indini NULL qiladi).

---

## 4. OYLIK→PROFIL/PAYROLL YO'LI (regress yuzasi)

### 4.1 Mavjud yo'llar (ikkalasi ham hozir DATASIZ)
- **Payroll dvigateli:** `finance-extended-payroll.service.ts:77-95` `compute()` — faqat `payroll_contracts` o'qiydi (fixed→base_salary / hourly / piecework), `payroll_calculations`'ga yozadi. `payroll_contracts=0` → `calculate` NOT_FOUND qaytaradi. **`employees.base_salary` yoki `org_functions` ni O'QIMAYDI.**
- **Profil yig'indisi:** `employees-compat-profile-raw.service.ts:201-236` `getPayrollSummary()` — `salary_history` ustidan 12-oylik SUM. `salary_history=0` → `null` qaytaradi.
- 14 payroll/salary jadval bor, **hammasi BO'SH**. Hech qaerda FORMULA-A uslubidagi yig'indi YO'Q.

### 4.2 Profil oylik qayerda ko'rinadi
- FE: `EmployeeProfile.tsx:255-264` → `GET /api/employees/:id/payroll-summary` → `ProfileHeader.tsx:180-203` `payrollSummary.totalSalary` (yoki `salaryHistory[0].newSalary` fallback, yoki "Ma'lumot yo'q").
- BE: `employees-compat-sub.controller.ts:282` `@Get(':id/payroll-summary')`.
- ⚠️ **FE/BE nom nomuvofiqligi**: FE `totalSalary` kutadi, BE `totalBase/totalEarned` qaytaradi (hozir ikkisi ham null = ko'rinmaydi).
- ⚠️ Oylik **HR/admin'dan boshqaga maskalangan** (`••••`, `ProfileHeader.tsx:169-175`).

### 4.3 FORMULA A qayerda chiqishi kerak
1. **Xodim profili**: `getPayrollSummary` (`employees-compat-profile-raw.service.ts:201`) ni FORMULA A yig'indisini `totalSalary` sifatida chiqaradigan qilib ulash (bir vaqtda nom nomuvofiqligini ham tuzatadi).
2. **Karta "Xodimlar" tabi (Faza 5)**: `CardDetail.tsx:105-110` jadvaliga oylik ustuni/jami; BE `card.repository.ts:128-135` `listEmployees` ni kengaytirish.

### 4.4 Regress xavflari (payroll/employees)
1. **Dual link split-brain** — `employee_cards` ╳ `org_function_id` ikki manba → karta a'zoligi ziddiyati. **Chora:** `employee_cards` = kanonik, `org_function_id` = sinxron ko'zgu.
2. **Bo'sh data buzilishni yashiradi** — hozir hamma 0, noto'g'ri JOIN/NULL arifmetikasi ko'rinmaydi. **Chora:** seed-qilingan qator bilan verify (jonli bo'sh DB'da emas).
3. **Profil-summary kontrakti** — `getPayrollSummary` null→fallback zanjirini buzmaslik (3-shoxli render).
4. **Oylik maskalash** — yangi yig'indi endpoint ham HR-gate merosini olishi shart (managerga oylik sizdirmaslik).
5. **Payroll dvigatel mustaqilligi** — FORMULA A `employees.base_salary` ga yozsa, `compute()` ikki marta sanab yubormasin.

---

## 5. SERTIFIKAT-KARTADA (EP-ORG-047) — `certificates` reuse, yangi jadval YO'Q

- `certificates` = 24 ustun. Bog'lash: **`employee_id`** (int, nullable) + `user_id` (int NOT NULL). ⚠️ Jadvalda **birorta FK yo'q**.
- Amal qilish muddati: `expiry_date` (date) + `expires_at` (timestamp). 30-kun ogohlantirish uchun `expiry_date` (yoki `COALESCE(expiry_date, expires_at::date)`).
- `COUNT(*)=0` (bo'sh) → strukturaviy ulash, ko'chadigan data yo'q.
- `lms_certificates` + `qc_certificates` MAVJUD lekin **KO'LAMDAN TASHQARI** (Faza 4 qarori — tegmaymiz).
- **Reuse so'rovi (yangi jadval yo'q, C6):**
```sql
SELECT c.id, c.name, c.certificate_number, c.issued_date, c.expiry_date,
       (c.expiry_date IS NOT NULL AND c.expiry_date <= (now()::date + 30)) AS expiring_soon
FROM org_functions f
JOIN employees e   ON e.org_function_id = f.id   -- karta → egasi
JOIN certificates c ON c.employee_id = e.id      -- egasi → sertifikat (kanonik)
WHERE f.id = :cardId AND COALESCE(c.is_active,true)=true
ORDER BY c.expiry_date NULLS LAST;
```
(`employee_id` siyrak bo'lsa fallback: `JOIN certificates c ON c.user_id = e.user_id`.)

---

## 6. REGRESS YUZASI: `employees.org_function_id` o'quvchilari (Q-39)

`org_function_id` **saqlanadi** (asosiy-karta ko'zgusi) → quyidagilar o'zgarmasdan ishlashi SHART:

| # | Fayl:satr | Maqsad |
|---|-----------|--------|
| 1 | `card.repository.ts:120` | `activeOccupantCount` (atomik guard) |
| 2 | `card.repository.ts:132` | `listEmployees` (Xodimlar tabi) |
| 3 | `drizzle-hr-base.repo.ts:46` | `orgPositionName` subquery |
| 4 | `drizzle-hr-base.repo.ts:47` | `orgDepartmentName` subquery |
| 5 | `employee-monthly-card.service.ts:75` | `buildCard` LEFT JOIN |
| 6 | 4 ta cron: `reference-image-compare:59`, `operator-hourly-invoice:60`, `manager-daily-routine:67`, `boomerang-hire:61` | JOIN org_functions |

- **Yozuvchi (writer) YO'Q** runtime'da (`UPDATE employees SET org_function_id` topilmadi; Faza 1 bir martalik backfill qilgan).
- FE'da `employees.org_function_id` o'quvchisi **0** (CardExamsDialog'dagi `orgFunctionId` = karta id, employees ustuni emas).
- ⚠️ False-positive (TEGMASLIK kerak — boshqa jadvallarning bir xil nomli ustuni): `ai_exam_attempts.org_function_id`, `vacancies.org_function_id`, `position_folder_content.org_function_id`, transfer-jadval `source/target_org_function_id`.

---

## 7. DDL TAKLIFI (DRAFT — Q-35 EGASI TASDIG'I KERAK, hali ishga TUSHIRILMAYDI)

- PostgreSQL **18.3** → partial unique index sintaksisi qo'llab-quvvatlanadi.
- FK maqsadlari: `employees.id`=int, `org_functions.id`=int → mos. 17 ta karta mavjud → backfill FK buzmaydi.

```sql
-- ⚠️ DRAFT — EGASI TASDIG'I UCHUN. Ishga tushirilmagan. APPROVED: marker keyin qo'shiladi.
CREATE TABLE IF NOT EXISTS public.employee_cards (
  id           serial PRIMARY KEY,
  employee_id  integer NOT NULL REFERENCES public.employees(id)     ON DELETE CASCADE,
  card_id      integer NOT NULL REFERENCES public.org_functions(id) ON DELETE RESTRICT,
  is_primary   boolean NOT NULL DEFAULT false,
  is_active    boolean NOT NULL DEFAULT true,
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  ended_at     timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- (xodim,karta) faol juftligi takrorlanmasin
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_cards_active_link
  ON public.employee_cards(employee_id, card_id) WHERE is_active;

-- ≤1 FAOL xodim/karta ("bir o'rin"). ⚠️ JONLI DATADA QULAYDI (10 karta >1) — 8.2-bandga qarang.
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_cards_active_card
--   ON public.employee_cards(card_id) WHERE is_active;

CREATE INDEX IF NOT EXISTS ix_employee_cards_employee ON public.employee_cards(employee_id);
CREATE INDEX IF NOT EXISTS ix_employee_cards_card     ON public.employee_cards(card_id);
```

---

## 8. MIGRATSIYA REJASI (idempotent — DRAFT)

### 8.1 Backfill (xodim hech qachon kartasini yo'qotmaydi)
```sql
-- Step 1: jadval + XAVFSIZ indexlar (uq_employee_cards_active_card NI HOZIR YARATMA — 8.2 ga qarang)
-- Step 2: 30 ta mavjud bog'lanishni ko'chirish (idempotent, NOT EXISTS bilan)
INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active, assigned_at)
SELECT e.id, e.org_function_id, true, true, now()
FROM employees e
WHERE e.org_function_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employee_cards ec
                  WHERE ec.employee_id=e.id AND ec.card_id=e.org_function_id);

-- Step 3: ISBOT (migratsiya ichida, mos kelmasa baland xato ber)
-- before: SELECT COUNT(*) FROM employees WHERE org_function_id IS NOT NULL;        → 30 kutiladi
-- after : SELECT COUNT(DISTINCT employee_id) FROM employee_cards WHERE is_active;   → 30 kutiladi
```
- `employees.org_function_id` **DROP/NULL QILINMAYDI** (Q-39) → 6 o'quvchi o'zgarmasdan ishlaydi.

### 8.2 ⛔ D2 — ≤1-faol-xodim/karta to'qnashuvi (egasi variant tanlaydi)
Jonli data 10 kartada >1 faol xodim → `uq_employee_cards_active_card` **CREATE paytida QULAYDI** (Faza 1 deferral'i ham shu: EP-ORG-037 seat-split). 3 variant:

| Variant | Nima | Ta'sir |
|---------|------|--------|
| **A — Seat-split (EP-ORG-037, vizyonga mos)** | 10 over-occupied kartani har-o'rin kartaga ajratish (har faol xodimga alohida `card_id`) → keyin unique index | Eng to'g'ri, lekin katta ish; "3 Operator karta" vizyoniga mos (EP-ORG-094) |
| **B — Faqat asosiy faol** | Har kartada 1 xodim `is_active=true`, qolganlari `is_active=false` (tarix saqlanadi) | Index ishlaydi, lekin 2-3-xodim "faol o'rin"ni yo'qotadi |
| **C — App-guard (DB index keyin)** | Non-unique index + mavjud app-guard (`card.repository.ts:120`) | Eng tez, DB-darajali ≤1 invariant yo'q (hozirgi holatcha) |

**Tavsiyam:** Faza 6 uchun **Variant C** (eng kam regress, vizyon o'zgarmaydi) — seat-split (A) ni alohida keyingi vazifa qiling. Lekin **egasi tanlaydi** (Q-34 dizayn qarori).

---

## 9. QURISH KETMA-KETLIGI (faqat egasi tasdiqlasa — STEP 2+)

1. **DDL** (D3 + D2 tasdiq) — `employee_cards` + tanlangan index strategiyasi (APPROVED marker, SQL ko'rsatib → "ha").
2. **Migratsiya** — backfill (8.1) + isbot (30 in == 30 covered) — SQL ko'rsatib → "ha".
3. **M:N BE** — assign/unassign (atomik guardni hurmat qil), karta egalari, xodim kartalari (Result+Zod+parametrized).
4. **Oylik yig'indi (FORMULA A, D1)** — profil jami = faol kartalar oyligi SUM (COALESCE NULL→0, cheksiz); profil + Xodimlar tabida chiqar; DB-proof (2 karta → to'g'ri jami).
5. **Cert-in-card (EP-ORG-047)** — karta egasi sertifikatlari + 30-kun ogohlantirish (`certificates` reuse, §5).
6. **FE** — assign UI (Faza 5 Xodimlar tabini kengaytir), profilda yig'indi, kartada cert+muddat (EP token+shablon, round-trip).

---

## 10. STOP — EGASI DARVOZASI

✅ Re-audit tugadi (read-only, hech narsa o'zgarmadi — faqat shu hujjat). **KOD YOZILMADI.**
⛔ **Egasi quyidagilarni tasdiqlasin (KOD'dan OLDIN):**
- **D1** oylik manbasi (max_salary? min? yangi ustun? karta vs razryad?)
- **D2** ≤1-faol qoidasi varianti (A seat-split / B primary-only / C app-guard) — **tavsiya: C**
- **D3** `employee_cards` M:N jadval yaratish (HA/yo'q)
- **D4** oylik birligi normalizatsiyasi (hammasi "oylik" deb faraz qilsak bo'ladimi?)

"davom" + D1-D4 javoblari kelganda: §9 ketma-ketligi bo'yicha har bosqichni alohida (ruxsat→qur→verify→commit→isbot) bajaraman.

---

*Manba isbotlari: `_audit/q.cjs` jonli so'rovlar (employees/org_functions/razryad_levels/certificates/payroll information_schema + pg_constraint + pg_indexes + to_regclass), 5-o'lchovli read-only Workflow (337k token, 107 tool-use) + bajaruvchi grounding. Kanonik karta = `org_functions` (29 FK). [[project_org_build_phase1_2026_06_08]] · [[project_org_card_centric_model]] · [[reference_live_db_location]].*
