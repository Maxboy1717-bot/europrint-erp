# ORG #02 — Faza 7 RE-AUDIT (read-only): vakansiya + i.o. (acting) + glossary + karta-eskirish

> **Bajaruvchi 🟢 | READ-ONLY re-audit | KOD YO'Q | 2026-06-13**
> Har dalil jonli `europrint` DB'da `_audit/q.cjs` + 5-o'lchovli read-only Workflow bilan isbotlangan (Q-29).
> Faza 7 = ORG ning OXIRGI feature fazasi. Vakansiya = DUBLIKAT XAVFI → reuse, parallel dunyo QURMA (C6).
> Manba direktiv: `docs/audit/MUSLIMBEK-PROMT-02L-PHASE7-VACANCY-IO-2026-06-08.md`.

---

## 0. XULOSA — egasi qaror qabul qilishi kerak bo'lgan nuqtalar

| # | Qaror | Nega | Tavsiyam |
|---|-------|------|----------|
| **D1** | Vakansiya **SLA** manbasi | `vacancies`'da `sla_days` yo'q; faqat `closing_date` (sana) bor | **closing_date'ni reuse** (0 DDL) — keyin kerak bo'lsa sla_days qo'shiladi |
| **D2** | i.o. (acting) xodim karta **1-o'rin** limitiga kiradimi? | acting = vaqtinchalik, asosiy o'rinni egallamasligi kerak | **YO'Q** — acting o'rin sarflmaydi (servis-darajali shart) |
| **D3** | DDL (3 ta ALTER) tasdig'i | is_acting/acting_supplement/last_reviewed_at yo'q | HA — 3 ta qo'shimcha NULLABLE ustun (pastda) |
| **D4** | Mavjud `DrizzleHrVacanciesRepository` ni kengaytirish | create()/findAll() org_function_id/priority/counts ni TASHLAB yuboradi → Vakant tab bo'sh | HA — kengaytir (kartaga ulash uchun zarur) |

⚠️ **Auto-revert mexanizmi** (texnik qaror, Q-34 — o'zim hal qilaman, ma'lumot uchun): **on-read filtri** (`is_active AND (ended_at IS NULL OR ended_at > now())`) = haqiqat manbai + ingichka kunlik cron (tozalash). Sabab: cron o'tkazib yuborilsa ham on-read har doim to'g'ri.

---

## 1. VAKANSIYA (REUSE — parallel dunyo QURILMAYDI, C6)

### 1.1 `vacancies` jadval (mavjud, boy)
- 44 ustun, **0 qator** (bo'sh, qurilish bosqichi). Kalit ustunlar BOR: `org_function_id` (KARTA bog'lanishi), `priority` (varchar, default 'normal' — **EP-ORG-073 allaqachon bor!**), `open_positions`+`number_of_positions`, `status`, `created_at`, `closing_date` (date), `salary_min/max`.
- ❌ **SLA ustuni YO'Q** (sla/sla_days/deadline/due_date/target_close_date — hech biri) → aging `created_at`'dan **hisoblanadi**.

### 1.2 Mavjud recruitment moduli (REAL — REUSE)
`apps/api/src/modules/hr/recruitment/` — to'liq, `@Controller('hr/recruitment')`, HR-gated:
- `hr-vacancies.controller.ts` (CRUD: GET vacancies, GET :id, POST vacancies) → `HrVacanciesService` → `DrizzleHrVacanciesRepository` (REAL).
- `recruitment.controller.ts` (funnel/kanban), `recruitment-offers`, `hr-vacancies-pipeline/probation/analytics` — REAL.
- FE: 33 fayl (RecruitingKanban, InternalJobBoard, RecruiterKPIPage, VacancyPortretDialog, ...) — REAL.

### 1.3 ⚠️ KRITIK GAP (D4 ning sababi)
- `DrizzleHrVacanciesRepository.create()` faqat `(title, description, department, status)` INSERT qiladi — **`org_function_id`, `priority`, `number_of_positions`, `open_positions`, `closing_date` ni TASHLAB yuboradi** (hr-vacancies.controller.ts:179-181 ataylab tashlaydi).
- `findAll()` faqat `id,title,department,status,is_active,created_at` SELECT qiladi — `org_function_id`/`priority`/counts'ni qaytarmaydi.
- FE RecruitingKanban boy maydonlarni yuboradi, BE tashlaydi → **FE↔BE drift**.
- ➡️ **Natija:** Vakant tab (Faza 5, `card.repository.ts:158` `WHERE org_function_id`) TO'LIQ ULANGAN va to'g'ri, lekin create yo'li `org_function_id` yozmagani uchun **doim bo'sh**.

### 1.4 Vakant tab (Faza 5) — ULANGAN
FE `CardDetail.tsx:53` → `GET /api/org-structure/cards/:id/vacancies` → `card.repository.ts:158` `SELECT ... FROM vacancies WHERE org_function_id=${cardId} AND deleted_at IS NULL`. To'g'ri o'qiydi, lekin yozuvchi yo'q.

### 1.5 Vizyon GAP
| EP-ORG | Vizyon | Holat |
|--------|--------|-------|
| 072 | Aging 0-14/15-45/45+ | `created_at`'dan **hisoblanadi** (0 DDL) |
| 073 | Priority | Ustun **bor** → faqat wire (0 DDL) |
| 074 | SLA | **D1**: closing_date reuse (0 DDL) yoki +sla_days (1 DDL) |
| 075/076 | Bulk import | Yangi **kod** (0 DDL) |

⭐ **Eng katta yutuq:** mavjud `DrizzleHrVacanciesRepository.create()/findAll()` ni org_function_id+priority+counts+closing_date saqlaydigan/qaytaradigan qilib kengaytirish → Vakant tab + aging + priority + SLA'ni ochadi (yangi jadval yo'q).

---

## 2. I.O. (ACTING) — greenfield, minimal DDL

### 2.1 Mavjud model: YO'Q
DB + kod skani: `acting`/`temporary`/`is_acting`/`substitut`/`vrio`/`i_o` — **hech qaerda yo'q** (org/HR'da). Parallel acting jadval ham yo'q. Greenfield → C6 ziddiyat yo'q.

### 2.2 `employee_cards` REUSE (Faza 6 jadvali)
Mavjud: `employee_id, card_id, is_active, assigned_at, **ended_at**` (sana = auto-revert uchun). **+2 yangi ustun yetarli:**
- `is_acting` boolean DEFAULT false — substantiv tayinlovni i.o.'dan ajratadi
- `acting_supplement` numeric NULL — EP-ORG-061 ustama (faqat is_acting'da ma'noli)

i.o. qatori = `INSERT employee_cards (employee_id, card_id, is_acting=true, acting_supplement=X, is_active=true, assigned_at=NOW(), ended_at=<revert sana>)`.

✅ **Unique-index to'qnashuvi YO'Q:** acting = **bir xil xodim, BOSHQA card_id** → `uq_employee_cards_active_link (employee_id, card_id)` buzilmaydi.

### 2.3 ≤1-o'rin limiti (D2)
Hozir guard = `activeOccupantCount` (`card.repository.ts:122`). **D2:** i.o. xodim asosiy 1-o'rinni egallashi kerakmi? **Tavsiyam: YO'Q** — acting substantiv o'rinni sarflamasligi kerak (servis-darajali shart: `WHERE is_acting = false` occupant-count'da). Egasi tasdiqlasin.

### 2.4 Auto-revert (EP-ORG-060) — texnik tavsiya (o'zim hal qilaman)
**On-read filtr = haqiqat manbai:** har faol-link o'qishi `... AND is_active AND (ended_at IS NULL OR ended_at > now())`. Soat ended_at'dan o'tishi bilan link sum/occupant/list'dan tushadi → pul ham, o'rin ham avtomatik qaytadi. + ingichka kunlik cron (`candidate-archive.cron.ts` shablonida) jismonan `is_active=false` qiladi (tozalash). Hozir ended_at hamma joyda NULL → o'zgarish no-op (regress yo'q).

### 2.5 Ustama → FORMULA A (EP-ORG-061)
Hozirgi `employeeSalaryTotal` (`card.repository.ts:233`): `SUM(COALESCE(f.max_salary,0))`. O'zgarish:
```sql
SELECT ( COALESCE(SUM(COALESCE(f.max_salary,0)),0)
       + COALESCE(SUM(CASE WHEN ec.is_acting THEN COALESCE(ec.acting_supplement,0) ELSE 0 END),0) )::numeric AS total
FROM employee_cards ec JOIN org_functions f ON f.id=ec.card_id
WHERE ec.employee_id=${id} AND ec.is_active AND (ec.ended_at IS NULL OR ec.ended_at > now()) AND f.deleted_at IS NULL
```
⚠️ FORMULA A **3 joyda** (lockstep majburiy, aks holda totallar farq qiladi — Q-40): `employeeSalaryTotal:233`, `listEmployees` inline:139, `listEmployeeCards:220`.

---

## 3. GLOSSARY (EP-ORG-129) — EXTEND, DDL YO'Q

- Faza-3 glossary = `CardFolderDialog.tsx:37-40` inline i18n map (6 atama → i18n kalit, 3 til). **Glossary jadval YO'Q** (DB + kod skani toza).
- **Tavsiya: mavjud inline-i18n tooltip pattern'ni kengaytirish** — Faza-7 atamalarini common.json'ga kalit qo'shib, bir xil Tooltip+t() bilan ko'rsatish. Yangi jadval YO'Q (EP-ORG-129 vizyoni = tooltip lug'at, tahrirlanadigan jadval emas). Ixtiyoriy: GLOSSARY map'ni kichik shared FE faylga ko'chirish (faqat FE refactor, DDL yo'q).

---

## 4. KARTA-ESKIRISH (EP-ORG-137) — 1 ustun DDL

- `org_functions`'da faqat `updated_at` bor (last_reviewed_at YO'Q).
- ⚠️ `updated_at` HAR tahrirda NOW() bo'ladi (create/update/softDelete) → "ko'rib chiqildi" sanasi EMAS (hamma 97 karta = bitta Faza-1 migration vaqti). Reuse = nohalol (Q-40).
- **DDL (1 ustun):** `org_functions ADD last_reviewed_at timestamptz NULL` (default yo'q — hech ko'rilmagan karta = stale).
- **Stale flag = HISOBLANADI:** `(last_reviewed_at IS NULL OR last_reviewed_at < now() - interval '1 year')`.
- **Surface:** karta ro'yxatida stale badge + Statistika tab Field + "Ko'rib chiqildi" tugma → `PATCH :id/review` → `UPDATE last_reviewed_at=NOW()` (AuditInterceptor Tarix'ga yozadi).

---

## 5. KONSOLIDATSIYALANGAN DDL (DRAFT — Q-35 EGASI TASDIG'I, ishga TUSHIRILMAGAN)

Hamma 4 ustun ABSENT tasdiqlangan. Hammasi **NULLABLE = additive, xavfsiz** (30 employee_cards + 97 org_functions + 0 vacancies qatorlari tegilmaydi). Idempotent (`IF NOT EXISTS`).

```sql
-- APPROVED: egasi 2026-06-13 (keyin qo'shiladi)
-- (a) i.o./acting — employee_cards
ALTER TABLE employee_cards
  ADD COLUMN IF NOT EXISTS is_acting boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acting_supplement numeric NULL;

-- (b) karta-eskirish — org_functions
ALTER TABLE org_functions
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz NULL;

-- (c) vakansiya SLA — FAQAT D1 = "+sla_days" tanlansa (aks holda closing_date reuse, bu satr o'chiriladi)
ALTER TABLE vacancies
  ADD COLUMN IF NOT EXISTS sla_days integer NULL;
```

---

## 6. REGRESS YUZASI (Q-39)

- **FORMULA A = 3 SQL joyi, FAQAT `card.repository.ts`'da** (233/139/220) → lockstep tahrir (eng katta xavf = formula drift). Yagona controller kirish nuqtasi.
- Additive NULLABLE ustunlar = xavfsiz (mavjud qatorlar o'zgarmaydi).
- ⚠️ `DrizzleHrVacanciesRepository` (D4) = MAVJUD ishlayotgan kod → ehtiyotkorlik bilan kengaytirish (faqat create INSERT ustunlari + findAll SELECT proyeksiyasi + Zod — mavjud xulq buzilmaydi).
- Cron (auto-revert) = `cron.module.ts` providers'ga yangi qo'shish (mavjud cronlar tegilmaydi).
- C6: vacancies + employee_cards reuse; yangi vacancy/acting jadval YO'Q.

---

## 7. QURISH KETMA-KETLIGI (faqat egasi tasdiqlasa — STEP 2+)

1. **DDL** (D3, owner SQL "ha") — 3 ALTER (yoki D1='closing_date' bo'lsa 2 ALTER).
2. **Vakansiya wire** — DrizzleHrVacanciesRepository create()/findAll() kengaytir (org_function_id+priority+counts+closing_date) + aging buckets (072, compute) + priority (073) + SLA (074) + bulk import (075/076). Vakant tab'ni boyit.
3. **I.o./acting** — employee_cards acting link (is_acting+supplement+ended_at), occupant-count i.o.'ni hisobga olmaydi (D2), auto-revert on-read+cron, supplement→FORMULA A (3 joy lockstep). Xodimlar tab'da i.o. ko'rsatish.
4. **Glossary** — Faza-7 atamalari (tooltip i18n, DDL yo'q).
5. **Karta-eskirish** — last_reviewed_at + stale flag + "Ko'rib chiqildi" tugma (PATCH :id/review).
6. Har bosqich: DB-proof + alohida commit + isbot.

---

## 8. STOP — EGASI DARVOZASI

✅ Re-audit tugadi (read-only, faqat shu hujjat). **KOD YOZILMADI.**
⛔ **Egasi tasdiqlasin (KOD'dan OLDIN):**
- **D1** SLA: closing_date reuse (0 DDL, tavsiya) yoki +sla_days (1 DDL)?
- **D2** i.o. xodim 1-o'rin limitiga kiradimi? (tavsiya: YO'Q)
- **D3** 3 ALTER DDL tasdig'i (D1'ga qarab 2 yoki 3)
- **D4** mavjud DrizzleHrVacanciesRepository'ni kengaytirish (Vakant tab uchun zarur) — ha?

"davom" + D1-D4 javoblari kelganda §7 ketma-ketligi bo'yicha har bosqichni alohida (ruxsat→qur→verify→commit→isbot) bajaraman.

---

*Manba: `_audit/q.cjs` jonli so'rovlar + 5-o'lchovli read-only Workflow (365k token, 74 tool-use, Qoida-23-OK analysis-only) + bajaruvchi grounding. Kanonik karta = `org_functions`. [[project_org_build_phase1_2026_06_08]] · [[project_org_card_centric_model]] · [[reference_live_db_location]].*
