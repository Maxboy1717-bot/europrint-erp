# PHASE 05 — ЦКП / GSD TIZIMI (BAJARUVCHI DIREKTIVA)

> **Bajaruvchi:** Muslimbek (🟢 Bajaruvchi roli — Qoida 23/Q-27).
> **Manba:** [00-MASTER-REJA.md](00-MASTER-REJA.md) FAZA 5 + [ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md](../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md) §ckp (12%) + [decisions/01-org-kartalar.md](../decisions/01-org-kartalar.md) (EP-ORG-014..018, 049..052, 096..098, 111..113, 121, 130, 135 + Q4/Q7/Q14..Q19/Q36/Q41/Q49/Q55/Q56/Q189/Q195/Q804/Q814/Q819).
> **Bog'liqlik:** FAZA 0 (org_departments = yagona karta), FAZA 1 (employee_cards M:N + stake_fraction), FAZA 4 (oylik kartadan) TUGAGAN bo'lishi shart. Bu faza ЦКП-gate'ni FAZA 4 payroll'ga ULAYDI. FAZA 10 (AI per-karta) bu fazada qurilgan struktura ustiga AI-chatbot-savol va AI-grading qo'shadi — bu yerda STRUKTURA + GATE + graceful-fallback qilinadi, AI-kalit kutilmaydi.
> **Eng past mavzu:** ckp = 12% (`ai_ckp_scores` 0 qator + unwired). Bu faza ЦКП "miya"sining oylik-gate halqasini real qiladi.

---

## § 1. KONTEKST VA MAQSAD

### 1.1 Vizyon (master rejadan)
ЦКП (Цель Конечного Продукта / Yakuniy Mahsulot Maqsadi) — har kartaning kunlik o'lchanadigan natijasidir. Vizyon zanjiri:

```
Karta ЦКП ta'rifi (HR yozadi: maqsad + birlik + chastota + formula)
   │
   ├── MASHINASIZ xodim  → AI-chatbot har kuni ЦКП'dan savol so'raydi → kunlik fakt
   ├── MASHINACHI (operator) → IoT/MES (mes_production_sessions) → karta'ga avto-feed → kunlik fakt
   │
   ▼
ckp_fact_values (kunlik FAKT-qiymat: karta + sana + bajarilgan + norma + manba)
   │
   ├── kaskad-agregat (karta ЦКП → bo'lim ЦКП → otdeleniye GSD-metrika)
   ├── multi-product slot (1 karta = 1..N продукт, har biri alohida)
   ├── formula-turi (miqdor% / sifat / muddat% / holat)
   │
   ▼
DEADLINE gate (egasi: 16 soat vs 3 soat) → deadline o'tsa o'sha kun ЦКП yozilmaydi
   │
   ▼
ai_ckp_scores.salary_gate_pass (kunlik) → FAZA 4 payroll: gate=false bo'lsa o'sha kun oyligi YOZILMAYDI
```

### 1.2 Bu fazaning aniq maqsadi
1. **`ckp_fact_values` jadval** — kunlik ЦКП fakt-qiymatini saqlovchi KANONIK jadval (hozir umuman yo'q — barcha ЦКП faqat `org_departments.tskp` matn + `tskp_target` norma sifatida turibdi, fakt YO'Q).
2. **Qo'lda + AI-chatbot kunlik kiritish** — mashinasiz karta uchun ЦКП savolini AI generatsiya qiladi (graceful, AI-kalitsiz template-savol), javob → `ckp_fact_values`.
3. **IoT/MES → karta avto-feed** — `mes_production_sessions` (worker_id, actual_quantity, defect_quantity) → operator kartasiga kunlik fakt; `operator-hourly-invoice.cron` + `pp_production_facts` bog'liqligini real tablega o'tkazish (hozir cron unregistered + jadval yo'q = o'lik kod).
4. **Kaskad-agregat** — karta ЦКП → parent karta (bo'lim) → otdeleniye GSD-metrika, `CkpReportedEvent` event-driven, atomik (`SELECT ... FOR UPDATE`).
5. **Multi-product slot** — `card_ckp_products` jadval (1 karta = 1..N продукт).
6. **Formula-turi** — `org_departments.ckp_formula_type` enum (`MIQDOR_PCT`/`SIFAT`/`MUDDAT_PCT`/`HOLAT`).
7. **Xato-katalog** — `card_error_catalog` (kartaga bog'langan tipik xatolar; hodisa shu kataloqdan tanlanadi).
8. **Deadline gate → kun-oyligi** — `ckp-deadline.cron` deadline o'tgan kunlarda `salary_gate_pass=false` yozadi (egasi 16/3 raqamini bermaguncha — DEFAULT struktura, faqat egasi-data deadline raqami).

### 1.3 FABRIKATSIYA TAQIQ (Q-40, Q2 egasi qarori)
- ЦКП **norma qiymatlari** (tskp_target, deadline raqami, formula-turi per-karta) = EGASI-DATA. Productionda 0 dan to'ladi.
- Bu faza **MEXANIZMni** quradi: jadval + endpoint + cron + gate + UI + graceful-fallback. **SOXTA ЦКП qiymat (random/hardcode) YOZILMAYDI.**
- AI-kalit yo'q bo'lsa: AI-chatbot savol → **template-savol** (kartaning `tskp` matnidan deterministik jumla), AI-grading → **null score + graceful** (FAZA 10 to'ldiradi). Hech qachon soxta ball emas.

---

## § 2. QOIDALAR BLOKI (HAR BOSQICHDA MAJBURIY)

> Bu blok har bosqich oldidan o'qiladi. Manba: `CLAUDE.md` (Qoida A,B,1-23 + Q-24..Q-47), `LOYIHA_QOIDALARI.md`, `STANDARTLAR.md`, `DIZAYN_QOIDALARI.md`.

### 2.1 Kod uslubi
- **TypeScript strict.** Validatsiya = **Zod** (class-validator TAQIQ). DB = **Drizzle ORM** (raw SQL faqat LATERAL/recursive agregat kabi murakkab holatda + izoh — Qoida 4).
- **Result<T>** majburiy: repo + service `Promise<Result<T>>` qaytaradi; `return null`/`throw new Error()` TAQIQ (Qoida 1). `import { Ok, Err, isOk, Result } from '@common/result'`.
- **Array.isArray()** har `.map/.filter/.reduce/.find` oldidan (Qoida 2).
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13). Oshsa `*Types.ts`/`*Sections.tsx`/`*Dialogs.tsx`.
- **Magic number TAQIQ** — `apps/api/src/common/constants/business.constants.ts` (Qoida 12). ЦКП vaznlari/threshold shu yerda.
- **Controller faqat transport** (Qoida 6): hisob-kitob servisga. **Service `db.*` chaqirmaydi** (Qoida 15) — faqat repo orqali.
- **`process.env` TAQIQ** — `ConfigService.getOrThrow` (Qoida 7).
- **Guard:** har controller `@UseGuards(JwtAuthGuard)` (Qoida 8) + ЦКП yozish `@Roles(...)`.

### 2.2 Regress-himoya (Q-39 / Q-46)
- Ishlab turgan + to'g'ri kod **O'CHIRILMAYDI** (org_departments.tskp matn-tahrir, EditDialog persist, razryad badge — ISHLAYDI, qoladi).
- Buzuq/o'lik/dublikat **TO'LIQ o'chiriladi** (chala emas). O'chirishdan oldin: (a) ishlamasligini Q-29 verify, (b) import yo'qligini grep bilan tasdiqla.
  - `operator-hourly-invoice.cron.ts` — cron.module.ts'da YO'Q (unregistered) + `pp_production_facts` jadval yo'q → ishga tushsa CRASH. **Bu fazada TO'G'IRLANADI** (jadval yaratiladi yoki MES'ga ulanadi + register), o'chirilmaydi.
  - `daily-report-deadline.cron.ts` — unregistered. ЦКП-deadline cron'i bu bilan ARALASHTIRILMAYDI (u xodim-asosli `hr_daily_reports`, biz karta-asosli `ckp_fact_values`). Yangi `ckp-deadline.cron` quriladi.

### 2.3 Fabrikatsiya TAQIQ (Q-40)
Data/AI yo'q → STRUKTURA + GATE qur, egasi-data ro'yxatiga yoz (§10). SOXTA qiymat YOZMA.

### 2.4 Migration (Q-35)
- `migrations-drift.ts` (`apps/api/src/shared/db/invariants/migrations-drift.ts`) idempotent `ALTER ... ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`.
- `CREATE TABLE`/`DROP` faqat **`// APPROVED: Claude (egasi vakolati) 2026-06-25 — <sabab>`** izoh bilan (namuna: shu fayl satr 884).
- Idempotent: 2 marta ishlatilsa xato bermaydi.

### 2.5 Dizayn (Q3 / Qoida 21/41/42/43)
- EP token (`var(--ep-*)`/`var(--mod-*)`) + shablon (ListPage/DetailPage/FormPage) + komponent (`components/ep`, `components/ui`). **Xom rang / inline-style TAQIQ** (`scripts/check-design-tokens.mjs`).
- Tab ≤2 daraja. Har forma **REAL saqlaydi** (FE mutation → BE → DB → qayta-yuklashda ko'rinadi — F1/F2).

### 2.6 Verify (Q-29 / Q-32 / Q-40)
Har faza oxiri: **tsc GREEN** (o'z fayllarda 0 xato) + **rollback-tx DB-proof** (`_audit/bproof-*.cjs`: kirit→oqdi→ko'rindi→ROLLBACK) + **jonli isbot** (login + HTTP). Struktura-only YETARLI EMAS.

### 2.7 Commit (Q-23 / GIT_QOIDALARI)
Faqat o'z fayl: `git add <aniq-fayl>` (HECH QACHON `-A`), `git commit --no-verify -m "..."`, oxirida `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Har bosqich alohida commit.

### 2.8 Atama
Muloqotda doim **KARTA** (node/tugun emas). ЦКП = lotin "ЦКП" (Cyrillic) yoki "tskp" (kod-identifikator).

---

## § 3. JORIY HOLAT (FAYL:SATR + DB-FAKT — JONLI TASDIQLANGAN)

> Barchasi `node _audit/q.cjs` (read-only, 127.0.0.1:5432 europrint) + Read/Grep bilan 2026-06-25 tasdiqlangan.

### 3.1 DB-fakt (jonli)
| Jadval / ustun | Holat | Dalil (q.cjs) |
|---|---|---|
| `ckp_fact_values` | **YO'Q** | `to_regclass('ckp_fact_values')` → `null` |
| `pp_production_facts` | **YO'Q** | `to_regclass('pp_production_facts')` → `null` (operator-hourly-invoice.cron shunga SELECT qiladi → crash) |
| `ai_ckp_scores` | MAVJUD, **0 qator, unwired** | 13 ustun: id/employee_id/score_date/ckp_score/attendance_score/quality_score/plan_score/time_score/ai_explanation/`salary_gate_pass`(bool)/raw_metrics(jsonb)/created_at/updated_at. **`card_id` ustuni YO'Q** (per-employee, per-karta emas — Q189). |
| `ai_ckp_chat_logs` | MAVJUD, **0 qator, unwired** | 6 ustun: id/employee_id/role/content/session_id/created_at. |
| `company_tskp` | MAVJUD, **0 qator, unwired** | grep companyTskp apps/api/src → 0. |
| `function_kpis` | MAVJUD, **0 qator, unwired** | target/current/formula bor, controller yo'q. |
| `org_departments.tskp / tskp_ru` | MAVJUD, **25/144 to'ldirilgan** | text. EditDialog HR tahrirlaydi — ISHLAYDI. |
| `org_departments.tskp_target` | MAVJUD, **0/144** | integer (norma). |
| `org_departments.tskp_measurement_unit` | MAVJUD, **0/144** | varchar (SON/FOIZ/VAQT enum FE'da). |
| `org_departments.statistics_type` | MAVJUD | text (faqat "tur" teg, qiymat emas). |
| `org_departments.ckp_formula_type` | **YO'Q** | formula-turi ustuni yo'q (EP-ORG-130). |
| `org_departments.parent_id` | MAVJUD | kaskad uchun ierarxiya bor. |
| `mes_production_sessions` | MAVJUD, **8 qator** | worker_id, actual_quantity, defect_quantity, started_at, ended_at — operator-feed manbai (real). |
| `operator_hourly_invoices` | MAVJUD | cron yozadi (lekin cron unregistered). |
| `card_ckp_products` (multi-product) | **YO'Q** | EP-ORG-096. |
| `card_error_catalog` (xato-katalog) | **YO'Q** | EP-ORG-097; `defect_catalog` ham `to_regclass` → null. |

### 3.2 Kod-fakt (fayl:satr)
| Fayl | Holat |
|---|---|
| `apps/api/src/shared/db/schema-ai-fit.ts:27-50` | `aiCkpScores` + `aiCkpChatLogs` Drizzle def MAVJUD; satr 6-7 izoh: "the CKP service is out of scope". Faqat `aiFitScores` wired. |
| `apps/api/src/cron/operator-hourly-invoice.cron.ts:41-69` | `@Cron('5 * * * *')`; SELECT `pp_production_facts pf` (satr 62) — jadval YO'Q → crash; satr 88 izoh "actual PDF generation deferred". **cron.module.ts providers'da YO'Q** (unregistered). |
| `apps/api/src/cron/daily-report-deadline.cron.ts:31` | `@Cron('0 23 * * *')`; xodim-asosli (`hr_daily_reports`), karta-ЦКП EMAS. **cron.module.ts'da YO'Q** (unregistered). |
| `apps/api/src/cron/daily-report.cron.ts:19` | `@Cron('0 16 * * 1-5')`; REGISTERED (cron.module.ts:71); xodim-asosli absence-marker, ЦКП-karta EMAS. |
| `apps/api/src/cron/cron.module.ts:45-92` | providers ro'yxati — operator-hourly-invoice / daily-report-deadline YO'Q; `CardRepository` standalone provider (satr 80) MAVJUD. |
| `apps/api/src/modules/org-structure/org-structure.controller.ts:37-72` | `OrgNodeSchema` Zod: tskp/tskpRu max(500), tskpTarget int, tskpMeasurementUnit enum SON/FOIZ/VAQT — ISHLAYDI. |
| `apps/api/src/modules/org-structure/org-structure.module.ts:29-33` | controllers/providers — ЦКП-controller/service YO'Q. |
| `apps/api/src/modules/ai/application/services/ai-fit.service.ts:59-86` | REAL AI pattern: `aiRouter.call(req)` → `isOk` → parse → repo.insert; **AI fail bo'lsa graceful fallback** (satr 64-73). Bu naqsh ЦКП AI-savol/grading uchun NAMUNA. |
| `apps/api/src/modules/ai/application/services/ai-router.service.ts:63` | `async call(req: AiRequest): Promise<Result<AiResponse>>`. |
| `apps/api/src/cron/cron-status.service.ts` | `recordSuccess(jobName)` / `recordFailure(jobName, err)` — cron status pattern. |

---

## § 4. BOSQICHMA-BOSQICH IMPLEMENTATSIYA

> Tartib bog'liqlikka ko'ra: 4.1 (formula-turi + DB) → 4.2 (`ckp_fact_values` jadval+repo) → 4.3 (qo'lda+AI-chatbot kiritish) → 4.4 (MES avto-feed) → 4.5 (kaskad-agregat event) → 4.6 (multi-product slot) → 4.7 (xato-katalog) → 4.8 (deadline cron → gate) → 4.9 (FAZA 4 payroll ulanish nuqtasi) → 4.10 (FE/dizayn).
> Har bosqich oxirida: tsc + commit. § 8 da to'liq self-verify.

---

### BOSQICH 4.1 — Formula-turi + karta ЦКП-meta ustunlari (DB poydevor)

**Fayl:** `apps/api/src/shared/db/invariants/migrations-drift.ts` (idempotent ALTER bloki qo'shiladi)

**Maqsad:** EP-ORG-130 (4 formula-turi) + EP-ORG-014 chastota (frequency) + EP-ORG-111 tur-teg. Bular `org_departments` (kanonik karta) ustunlari.

**OLDIN (DB):** `org_departments`'da `ckp_formula_type`, `ckp_frequency`, `ckp_report_deadline_hours` ustunlari YO'Q (q.cjs §3.1).

**KEYIN (migration SQL — § 5.1 ga to'liq):** 3 ustun ADD COLUMN IF NOT EXISTS (formula-turi enum, chastota, deadline-soat per-karta).

**Sabab:** Formula-turi ЦКП fakt-qiymatni qanday baholashni belgilaydi (miqdor% = bajarilgan/norma; holat = ha/yo'q→1.0/0.0). Chastota = kunlik/haftalik. Deadline-soat = egasi 16/3 raqamini per-karta override (default NULL → kompaniya-default).

**Drizzle schema yangilash:** `apps/api/src/shared/db/schema-org*.ts` (org_departments def qaysi faylda bo'lsa — grep `pgTable('org_departments'`) ga 3 ustun qo'shiladi (Drizzle↔DB mosligi uchun, Qoida DRIZZLE_STANDARTLARI).

---

### BOSQICH 4.2 — `ckp_fact_values` KANONIK jadval + repo + service

**Yangi fayllar:**
- `apps/api/src/modules/org-structure/ckp/ckp-fact.repository.ts`
- `apps/api/src/modules/org-structure/ckp/ckp-fact.service.ts`
- `apps/api/src/modules/org-structure/ckp/ckp.controller.ts`
- `apps/api/src/modules/org-structure/ckp/dto/ckp.dto.ts` (Zod)
- Drizzle def: `apps/api/src/shared/db/schema-ckp.ts` (yangi)

**Maqsad:** ЦКП FAKT-qiymatini saqlaydigan jadval. Bu butun fazaning yuragi — hozir fakt-qiymat HECH QAYERDA saqlanmaydi (faqat norma `tskp_target` bor).

**Jadval (DB — § 5.2 to'liq):** `ckp_fact_values` — id, `card_id`(FK org_departments), `employee_id`(FK, kim bajardi — ko'p-karta uchun), `product_id`(FK card_ckp_products, NULL=karta-darajasi), `fact_date`, `target_value`(o'sha kun normasi snapshot), `actual_value`(bajarilgan), `achievement_pct`(hisoblanadi), `source`(enum: MANUAL/AI_CHAT/MES_AUTO/IOT), `formula_type`(snapshot), `status`(enum: pending/submitted/late/missed), `submitted_at`, `notes`, audit.

**OLDIN (kod):** ЦКП fakt-yozish servisi yo'q.

**KEYIN (repo namuna — § 6 ga to'liq Result<T>):**
```typescript
async upsertFact(input: CkpFactInsert): Promise<Result<CkpFactRow>> {
  try {
    const rows = await db.insert(ckpFactValues).values({
      cardId: input.cardId, employeeId: input.employeeId,
      productId: input.productId ?? null, factDate: input.factDate,
      targetValue: input.targetValue, actualValue: input.actualValue,
      achievementPct: this.calcAchievement(input),  // service hisoblaydi, controller emas
      source: input.source, formulaType: input.formulaType,
      status: 'submitted', submittedAt: sql`now()`,
    }).onConflictDoUpdate({
      target: [ckpFactValues.cardId, ckpFactValues.employeeId, ckpFactValues.productId, ckpFactValues.factDate],
      set: { actualValue: input.actualValue, achievementPct: ..., status: 'submitted', submittedAt: sql`now()` },
    }).returning();
    if (!rows[0]) return Err(AppErr('INTERNAL', 'ckp fact insert qaytmadi'));
    return Ok(rows[0]);
  } catch (e) { return Err(AppErr('INTERNAL', String(e))); }
}
```

**Sabab:** ON CONFLICT (card+employee+product+date) — kunlik idempotent (bot 2 marta so'rasa dublikat yo'q). `achievement_pct` SERVICE hisoblaydi (Qoida 6), formula-turiga qarab (§ 6.2).

**Endpoint (controller):**
- `POST /api/org-structure/ckp/fact` — qo'lda/bot fakt yozish (Zod validate).
- `GET /api/org-structure/ckp/fact?cardId=&from=&to=` — karta ЦКП tarixi.
- `GET /api/org-structure/ckp/aggregate/:cardId?date=` — kaskad-agregat (bo'lim/otdeleniye).

**Modul ro'yxatga olish:** `org-structure.module.ts:30-31` — `CkpController` controllers'ga, `CkpFactService`+`CkpFactRepository` providers'ga (BOSQICH 4.2 commit).

---

### BOSQICH 4.3 — Qo'lda + AI-chatbot kunlik kiritish (mashinasiz karta)

**Yangi fayllar:**
- `apps/api/src/modules/org-structure/ckp/ckp-chatbot.service.ts`
- `apps/api/src/cron/ckp-chatbot-ask.cron.ts` (kunlik savol yuborish)

**Maqsad:** EP-ORG-016 / Q-16 / Q819. Mashinasiz karta uchun har kuni AI savol generatsiya qiladi → Telegram yuboradi → javob `ckp_fact_values`'ga.

**OLDIN:** `ai_ckp_chat_logs` 0 qator + HECH BIR servis import qilmaydi (schema-ai-fit.ts:6 "out of scope"). Savol-generator kodi yo'q.

**KEYIN — AI-savol generatsiya (AiFitService:98-118 namunasi bo'yicha):**
```typescript
async generateDailyQuestion(card: CardCkpMeta): Promise<Result<string>> {
  // graceful: AI-kalit yo'q yoki fail → template-savol (FABRIKATSIYA emas, deterministik)
  const req: AiRequest = {
    taskType: 'hr.performance_review',
    prompt: [
      `Karta: "${card.name}". ЦКП ta'rifi: "${card.tskp}".`,
      `O'lchov birligi: ${card.measurementUnit}. Kunlik norma: ${card.target ?? 'belgilanmagan'}.`,
      'Shu kartadagi xodimga BUGUNGI ЦКП natijasini so\'raydigan BITTA aniq savol yoz (o\'zbekcha, qisqa).',
    ].join('\n'),
    systemPrompt: 'Sen ЦКП-hisobot yordamchisisan. Faqat bitta savol matnini qaytar.',
    maxTokens: 120, temperature: 0.4,
    metadata: { feature: 'ckp-chatbot', cardId: card.id },
  };
  const ai = await this.aiRouter.call(req);
  if (!isOk(ai)) {
    // GRACEFUL FALLBACK — template-savol (soxta emas, kartaning real tskp matnidan)
    const q = `Bugungi "${card.tskp}" bo'yicha natijangizni kiriting (${card.measurementUnit ?? 'birlik'}):`;
    await this.repo.logChat({ employeeId: card.employeeId, role: 'assistant', content: q, sessionId: this.sessionId(card) });
    return Ok(q);
  }
  await this.repo.logChat({ employeeId: card.employeeId, role: 'assistant', content: ai.data.text, sessionId: this.sessionId(card) });
  return Ok(ai.data.text);
}
```

**Javobni qabul qilish:** `POST /api/org-structure/ckp/chat/answer` — xodim javobi → `ai_ckp_chat_logs` (role='user') + AI raqamni ajratadi (yoki Zod `actualValue` to'g'ridan) → `CkpFactService.upsertFact({ source: 'AI_CHAT', ... })`.

**Cron (`ckp-chatbot-ask.cron.ts`):** `@Cron('0 9 * * *')` — har kuni 09:00 (Tashkent) mashinasiz aktiv kartalar (statistics_type != 'mes' yoki frequency='daily') uchun savol yuboradi. `@Optional() TelegramService` (operator-hourly-invoice.cron:39 namunasi). **cron.module.ts'ga REGISTER** (provider + import).

**Sabab:** AI-kalitsiz ham ishlaydi (Q-40 graceful). `ai_ckp_chat_logs` endi REAL writer oladi (unwired→wired).

---

### BOSQICH 4.4 — IoT/MES → karta avto-feed (mashinachi/operator)

**Fayl:** `apps/api/src/modules/org-structure/ckp/ckp-mes-feed.service.ts` (yangi) + `apps/api/src/cron/operator-hourly-invoice.cron.ts` (TO'G'IRLASH).

**Maqsad:** EP-ORG-017 / Q-17 / Q49 / Q56. Operator ЦКП avtomatik `mes_production_sessions`'dan kartaga.

**OLDIN:** `operator-hourly-invoice.cron.ts:62` `pp_production_facts` jadvaliga SELECT — **jadval YO'Q** → crash; cron unregistered (o'lik). MES→karта ЦКП feed listeneri yo'q.

**KEYIN (TO'G'IRLASH — regress-himoya, o'chirmaymiz):** `pp_production_facts` o'rniga REAL jonli `mes_production_sessions` (worker_id, actual_quantity, defect_quantity) dan o'qish:
```sql
-- KEYIN (operator-hourly-invoice.cron — pp_production_facts → mes_production_sessions)
LEFT JOIN mes_production_sessions ms
  ON ms.worker_id = e.id
  AND ms.ended_at BETWEEN ${periodStart} AND ${now}
...
COALESCE(SUM(ms.actual_quantity), 0)::int AS units_produced,
COALESCE(SUM(ms.defect_quantity), 0)::int AS units_defective,
```
**Sabab:** `pp_production_facts` real DB'da yo'q; `mes_production_sessions` (8 qator, jonli) operator-ish faktining haqiqiy manbai. Crash sababini olib tashlaydi + REAL data ulaydi.

**MES→ЦКП feed (yangi service):** Operator kartasiga kunlik fakt yozadi:
```typescript
async feedFromMes(factDate: string): Promise<Result<number>> {
  // har operator-xodimning aktiv kartasi (employee_cards, FAZA 1) + shu kunlik mes_production_sessions yig'indisi
  // → CkpFactService.upsertFact({ source: 'MES_AUTO', actualValue: sum(actual_quantity), ... })
  // formula MIQDOR_PCT bo'lsa achievement = actual/target*100
}
```
Cron `ckp-mes-feed.cron.ts` `@Cron('30 23 * * *')` (kun yopilishida) yoki MES-session-closed event listener (FAZA 10 IoT'ga defer qilinishi mumkin — bu yerda kunlik cron yetarli).

**REGISTER:** operator-hourly-invoice.cron + ckp-mes-feed → cron.module.ts providers (+ import). Endi o'lik emas.

---

### BOSQICH 4.5 — Kaskad-agregat (karta → bo'lim → otdeleniye) + CkpReportedEvent

**Yangi fayllar:**
- `apps/api/src/modules/org-structure/ckp/ckp-cascade.listener.ts`
- `apps/api/src/modules/org-structure/ckp/events/ckp-reported.event.ts`
- `apps/api/src/modules/org-structure/ckp/ckp-aggregate.repository.ts`

**Maqsad:** EP-ORG-112 / Q4 / EP-ORG-020 (otdeleniye gsd_metric). Quyi karta ЦКП → yuqori karta (parent_id) ga to'planadi; otdeleniye darajasida GSD-metrika.

**OLDIN:** `CkpReportedEvent` YO'Q (grep → 0); kaskad agregat listener/row-lock yo'q. `parent_id` bor lekin SUM/AVG qiluvchi kod yo'q.

**KEYIN — event (org-cascade.listener pattern, org-structure.module.ts:26 namunasi):**
```typescript
// ckp-reported.event.ts
export class CkpReportedEvent {
  constructor(public readonly cardId: number, public readonly factDate: string,
              public readonly achievementPct: number) {}
}
// CkpFactService.upsertFact oxirida: this.eventEmitter.emit('ckp.reported', new CkpReportedEvent(...))
```
```typescript
// ckp-cascade.listener.ts — atomik agregat (SELECT ... FOR UPDATE, Q4)
@OnEvent('ckp.reported')
async onCkpReported(ev: CkpReportedEvent): Promise<void> {
  // parent_id zanjiri bo'yicha yuqoriga: bo'lim ЦКП = AVG(quyi kartalar achievement_pct)
  // ckp_aggregate jadvalga (card_id=parent, fact_date, agg_pct, child_count) UPSERT — atomik tx
  await db.transaction(async (tx) => {
    // WITH RECURSIVE parent zanjiri + FOR UPDATE row-lock
  });
}
```

**Agregat jadval (DB — § 5.3):** `ckp_aggregate` — parent_card_id, fact_date, agg_value, agg_pct, child_count, formula_type. Otdeleniye GSD = eng yuqori parent (node_type='otdeleniye') agregati.

**Sabab:** Vizyon "yuqori karta ЦКП quyilardan to'planadi" (Q4). Atomik tx + FOR UPDATE bir vaqtda 2 fakt kelganda race-condition'ni oldini oladi.

---

### BOSQICH 4.6 — Multi-product slot (1 karta = 1..N продукт)

**Fayllar:** `apps/api/src/shared/db/schema-ckp.ts` (jadval) + `ckp-fact.repository.ts` (product_id ulanishi) + FE slot UI.

**Maqsad:** EP-ORG-096 / EP-ORG-135. Karta ichida "ЦКП + 1..N продукт"; har продукт alohida kuzatiladi; bo'sh slot "tugallanmagan".

**OLDIN:** `card_ckp_products` jadval YO'Q (q.cjs). Karta faqat bitta `tskp` matn.

**KEYIN (DB — § 5.4):** `card_ckp_products` — id, card_id(FK), product_name, target_value, measurement_unit, formula_type, slot_no(1-4), is_active. `ckp_fact_values.product_id` shunga FK (NULL=karta-darajasi umumiy).

**Bo'sh slot gate (EP-ORG-135):** `GET /api/org-structure/ckp/products/:cardId/incomplete` → bo'sh (target NULL) slotlar → FE "tugallanmagan" + rahbarga Kanban-topshiriq (FAZA 9 admin bilan birga yoki shu yerda notification).

**Sabab:** Vizyon kartani ko'p-mahsulotli qiladi (gofra liniya = bir necha mahsulot). Har slot alohida fakt.

---

### BOSQICH 4.7 — Xato-katalog (card_error_catalog)

**Fayllar:** `apps/api/src/shared/db/schema-ckp.ts` (jadval) + `ckp.controller.ts` (CRUD) + FE.

**Maqsad:** EP-ORG-097. "Ko'p uchraydigan xatolar" katalogi; hodisa shu kataloqdan tanlanadi (statistika to'planadi → AI takror-xato signali FAZA 10).

**OLDIN:** `card_error_catalog` / `defect_catalog` jadval YO'Q (q.cjs `to_regclass` → null). CLAUDE.md seed gapiradi lekin jonli DB'da yaratilmagan.

**KEYIN (DB — § 5.5):** `card_error_catalog` — id, card_id(FK, NULL=global), error_code, error_name_uz/ru, severity(enum: low/medium/high), is_active. + `card_error_incidents` — id, card_id, error_catalog_id(FK), employee_id, incident_date, notes (hodisa yozuvi).

**Endpoint:** `POST/GET/PUT /api/org-structure/ckp/error-catalog` (CRUD, RD-tasdiq), `POST /api/org-structure/ckp/error-incident` (hodisa).

**Sabab:** Vizyon "hodisa katalogdan tanlanadi → statistika". FAZA 10 AI bu statistikadan takror-xato signali beradi.

---

### BOSQICH 4.8 — Deadline cron → kun-oyligi gate

**Yangi fayl:** `apps/api/src/cron/ckp-deadline.cron.ts`

**Maqsad:** EP-ORG-018 / Q-18 / Q36 / Q121 / Q-ZIDDIYAT-DEADLINE. Deadline o'tib ЦКП kelmasa → o'sha kun `salary_gate_pass=false`.

**OLDIN:** Karta-asosli ЦКП-deadline cron YO'Q. `daily-report-deadline.cron` (unregistered) xodim-asosli, `hr_daily_reports`. `ai_ckp_scores.salary_gate_pass` bor lekin HECH KIM hisoblamaydi (grep salaryGatePass → faqat schema).

**KEYIN — deadline cron (egasi-data deadline raqamiga DEFAULT struktura):**
```typescript
@Cron('0 * * * *')  // har soat — deadline tekshiruvi (3 vs 16 soatni qamrab oladi)
async checkCkpDeadlines(): Promise<void> {
  // KONSTANTA: CKP_DEFAULT_DEADLINE_HOURS — business.constants.ts (egasi 16/3 bermaguncha DEFAULT, fabrikatsiya emas)
  // har aktiv karta: bugungi ckp_fact_values bormi? yo'q + (now - kun_boshi) > deadline_hours → ai_ckp_scores UPSERT salary_gate_pass=false
  // bor → salary_gate_pass=true (kun yozildi)
}
```
**MUHIM (FABRIKATSIYA TAQIQ):** deadline raqami egasidan (16 vs 3 — §10). Hozir `business.constants.ts`'da `CKP_DEFAULT_DEADLINE_HOURS = 16` (spec-default) + per-karta `org_departments.ckp_report_deadline_hours` override. Egasi yakuniy raqamni bergach KONSTANTA yangilanadi. Soxta ЦКП-qiymat yozilmaydi — faqat gate-bayrog'i.

**`ai_ckp_scores` REAL writer:** bu cron + CkpFactService `salary_gate_pass`'ni yozadi → unwired→wired. (`ai_ckp_scores.card_id` ustuni qo'shiladi — § 5.6, Q189 per-karta uchun.)

**REGISTER:** cron.module.ts providers + import.

---

### BOSQICH 4.9 — FAZA 4 payroll ulanish nuqtasi (gate halqasi)

**Fayl:** `apps/api/src/modules/hr/payroll/application/handlers/calculate-payroll.handler.ts` (FAZA 4'da kartaga ulangan) — ЦКП-gate chaqirish nuqtasi.

**Maqsad:** EP-ORG-052 / Q-16. "Hisobot bermaslik → o'sha kun oylik yo'q". ЦКП kunlik gate → oylik kun-bo'yicha kamayadi.

**OLDIN:** payroll.service.ts ЦКП'ni tekshirmaydi (grep org_function_id/card/ЦКП → 0).

**KEYIN (ulanish nuqtasi — FAZA 4 handler ichida):**
```typescript
// calculate-payroll.handler — har xodim-karta uchun ish-kunlarini hisoblashda:
const gateResult = await this.ckpGateService.countGatedDays(employeeId, cardId, periodStart, periodEnd);
// gateResult.data = { workDays, gatedOutDays }  → effectiveDays = workDays - gatedOutDays
// oylik = razryad-koeff × baza × ulush × (effectiveDays / workDays)
```
**Yangi service:** `CkpGateService.countGatedDays(...)` — `ai_ckp_scores` dan `salary_gate_pass=false` kunlar sonini qaytaradi (Result<{workDays, gatedOutDays}>).

**Sabab:** ЦКП-gate FAZA 4 oylik-formulasiga real ta'sir qiladi. Bu bog'lanish "ckp 12% → real gate" ni yopadi. (FAZA 4 darslik-gate ulanish nuqtasi bilan bir xil joy.)

**Regress-himoya:** FAZA 4 handler'iga FAQAT gate-multiplier qo'shiladi; mavjud razryad-koeff×baza×ulush O'CHMAYDI.

---

### BOSQICH 4.10 — FE + Dizayn (ЦКП tab + slot + xato-katalog)

**Fayllar (FE):** `artifacts/erp-dashboard/src/...` — OrgNodeDetail ichida "ЦКП" tab (yangi yoki mavjud MainTab/RazryadTab yonida).

**Maqsad:** Q3 dizayn izchillik. ЦКП fakt-tarix, slot, xato-katalog, formula-turi UI.

**Komponentlar (mavjud EP shablon + token):**
- `CkpTab.tsx` — DetailPage shablon ichida; EPCard + EPStatusPill (gate holati). `var(--ep-*)` token (xom rang TAQIQ).
- `CkpProductSlots.tsx` — 1..4 продукт slot (bo'sh slot kulrang "tugallanmagan").
- `CkpFactHistory.tsx` — kunlik fakt jadval (useQuery + F1 loading skeleton).
- `CkpErrorCatalogDialog.tsx` — xato-katalog CRUD (useMutation + F2 onError + ConfirmDialog o'chirishda — Qoida 14).

**Forma saqlash (Q-43):** har forma REAL mutation → BE → DB. ЦКП fakt qo'lda kiritish formasi: `POST /api/org-structure/ckp/fact` → DB → qayta-yuklashda ko'rinadi.

**Tab ≤2 daraja (Q-42):** OrgNodeDetail asosiy tab → "ЦКП" → ichida sub-tab (Fakt / Slot / Xato) MAKS 2 daraja.

**Sahifa:** `/org-structure` → karta tanlash → OrgNodeDetail → "ЦКП" tab. Yangi route YO'Q (mavjud detail ichida).

---

## § 5. DB (MIGRATION SQL — APPROVED)

> Hammasi `migrations-drift.ts` idempotent bloki. Har `CREATE TABLE` oldidan `// APPROVED: Claude (egasi vakolati) 2026-06-25 — <sabab>`.

### 5.1 org_departments ЦКП-meta ustunlari (BOSQICH 4.1)
```sql
-- APPROVED: Claude (egasi vakolati) 2026-06-25 — karta ЦКП formula-turi/chastota/deadline (EP-ORG-130/014/121)
ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS ckp_formula_type varchar(16)
    CHECK (ckp_formula_type IN ('MIQDOR_PCT','SIFAT','MUDDAT_PCT','HOLAT'));
ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS ckp_frequency varchar(16) DEFAULT 'daily'
    CHECK (ckp_frequency IN ('daily','weekly','monthly'));
ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS ckp_report_deadline_hours integer;  -- NULL = kompaniya default; egasi 16/3 beradi
```

### 5.2 ckp_fact_values (BOSQICH 4.2 — KANONIK)
```sql
-- APPROVED: Claude (egasi vakolati) 2026-06-25 — ЦКП kunlik FAKT-qiymat kanonik jadval (EP-ORG-016/017/050, hozir yo'q)
CREATE TABLE IF NOT EXISTS ckp_fact_values (
  id              serial PRIMARY KEY,
  card_id         integer NOT NULL REFERENCES org_departments(id),
  employee_id     integer REFERENCES employees(id),         -- ko'p-karta: kim bajardi (NULL=karta umumiy)
  product_id      integer REFERENCES card_ckp_products(id), -- multi-product (NULL=karta darajasi)
  fact_date       date NOT NULL,
  target_value    numeric(14,2),                            -- o'sha kun normasi snapshot (egasi-data, NULL ruxsat)
  actual_value    numeric(14,2),                            -- bajarilgan
  achievement_pct numeric(6,2),                             -- service hisoblaydi formula-turiga ko'ra
  source          varchar(12) NOT NULL DEFAULT 'MANUAL'
                    CHECK (source IN ('MANUAL','AI_CHAT','MES_AUTO','IOT')),
  formula_type    varchar(16),                              -- snapshot org_departments.ckp_formula_type
  status          varchar(12) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','submitted','late','missed')),
  submitted_at    timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ckp_fact_card_emp_prod_date
  ON ckp_fact_values (card_id, COALESCE(employee_id,0), COALESCE(product_id,0), fact_date);
CREATE INDEX IF NOT EXISTS idx_ckp_fact_card_date ON ckp_fact_values (card_id, fact_date);
```

### 5.3 ckp_aggregate (BOSQICH 4.5)
```sql
-- APPROVED: Claude (egasi vakolati) 2026-06-25 — ЦКП kaskad agregat (karta→bo'lim→otdeleniye, EP-ORG-112/020/Q4)
CREATE TABLE IF NOT EXISTS ckp_aggregate (
  id             serial PRIMARY KEY,
  parent_card_id integer NOT NULL REFERENCES org_departments(id),
  fact_date      date NOT NULL,
  agg_value      numeric(14,2),
  agg_pct        numeric(6,2),
  child_count    integer NOT NULL DEFAULT 0,
  formula_type   varchar(16),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ckp_agg_parent_date ON ckp_aggregate (parent_card_id, fact_date);
```

### 5.4 card_ckp_products (BOSQICH 4.6)
```sql
-- APPROVED: Claude (egasi vakolati) 2026-06-25 — karta multi-product slot (EP-ORG-096/135)
CREATE TABLE IF NOT EXISTS card_ckp_products (
  id               serial PRIMARY KEY,
  card_id          integer NOT NULL REFERENCES org_departments(id),
  product_name     varchar(200) NOT NULL,
  target_value     numeric(14,2),     -- egasi-data (NULL=tugallanmagan slot)
  measurement_unit varchar(8) CHECK (measurement_unit IN ('SON','FOIZ','VAQT')),
  formula_type     varchar(16) CHECK (formula_type IN ('MIQDOR_PCT','SIFAT','MUDDAT_PCT','HOLAT')),
  slot_no          integer NOT NULL CHECK (slot_no BETWEEN 1 AND 4),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_card_product_slot ON card_ckp_products (card_id, slot_no) WHERE is_active;
```

### 5.5 card_error_catalog + card_error_incidents (BOSQICH 4.7)
```sql
-- APPROVED: Claude (egasi vakolati) 2026-06-25 — karta xato-katalog + hodisa (EP-ORG-097)
CREATE TABLE IF NOT EXISTS card_error_catalog (
  id           serial PRIMARY KEY,
  card_id      integer REFERENCES org_departments(id),  -- NULL = global xato
  error_code   varchar(32) NOT NULL,
  error_name_uz varchar(200) NOT NULL,
  error_name_ru varchar(200),
  severity     varchar(8) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_card_error_code ON card_error_catalog (COALESCE(card_id,0), error_code);

CREATE TABLE IF NOT EXISTS card_error_incidents (
  id               serial PRIMARY KEY,
  card_id          integer NOT NULL REFERENCES org_departments(id),
  error_catalog_id integer NOT NULL REFERENCES card_error_catalog(id),
  employee_id      integer REFERENCES employees(id),
  incident_date    date NOT NULL DEFAULT current_date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_card_error_incident_card ON card_error_incidents (card_id, incident_date);
```

### 5.6 ai_ckp_scores.card_id (BOSQICH 4.8 — per-karta, Q189)
```sql
-- APPROVED: Claude (egasi vakolati) 2026-06-25 — ai_ckp_scores per-karta (ko'p-karta gate, Q189)
ALTER TABLE ai_ckp_scores ADD COLUMN IF NOT EXISTS card_id integer REFERENCES org_departments(id);
ALTER TABLE ai_ckp_scores ADD COLUMN IF NOT EXISTS fact_date date;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_ckp_emp_card_date
  ON ai_ckp_scores (employee_id, COALESCE(card_id,0), score_date);
```

> **Drizzle:** har jadval `apps/api/src/shared/db/schema-ckp.ts` ga pgTable def + `lib/db/src/schema/index.ts` (yoki europrint-compat barrel) ga re-export — Drizzle↔DB mosligi (DRIZZLE_STANDARTLARI).

---

## § 6. ZOD / RESULT / DRIZZLE NAMUNA

### 6.1 Drizzle def (`apps/api/src/shared/db/schema-ckp.ts`)
```typescript
import { pgTable, serial, integer, date, numeric, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const ckpFactValues = pgTable('ckp_fact_values', {
  id:             serial('id').primaryKey(),
  cardId:         integer('card_id').notNull(),
  employeeId:     integer('employee_id'),
  productId:      integer('product_id'),
  factDate:       date('fact_date').notNull(),
  targetValue:    numeric('target_value', { precision: 14, scale: 2 }),
  actualValue:    numeric('actual_value', { precision: 14, scale: 2 }),
  achievementPct: numeric('achievement_pct', { precision: 6, scale: 2 }),
  source:         varchar('source', { length: 12 }).notNull().default('MANUAL'),
  formulaType:    varchar('formula_type', { length: 16 }),
  status:         varchar('status', { length: 12 }).notNull().default('pending'),
  submittedAt:    timestamp('submitted_at', { withTimezone: true }),
  notes:          text('notes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});
export type CkpFactRow    = typeof ckpFactValues.$inferSelect;
export type CkpFactInsert = typeof ckpFactValues.$inferInsert;
// + ckpAggregate, cardCkpProducts, cardErrorCatalog, cardErrorIncidents (xuddi shu uslub)
```

### 6.2 Zod DTO (`dto/ckp.dto.ts`) — formula-turi qabul
```typescript
import { z } from 'zod';
export const CKP_FORMULA = ['MIQDOR_PCT','SIFAT','MUDDAT_PCT','HOLAT'] as const;
export const CKP_SOURCE  = ['MANUAL','AI_CHAT','MES_AUTO','IOT'] as const;

export const CkpFactCreateSchema = z.object({
  cardId:      z.number().int().positive(),
  employeeId:  z.number().int().positive().nullable().optional(),
  productId:   z.number().int().positive().nullable().optional(),
  factDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetValue: z.number().nullable().optional(),
  actualValue: z.number(),
  source:      z.enum(CKP_SOURCE).default('MANUAL'),
  notes:       z.string().max(1000).optional(),
}).strict();
export type CkpFactCreateDto = z.infer<typeof CkpFactCreateSchema>;
```

### 6.3 Service achievement hisoblash (formula-turiga ko'ra — Qoida 6/12)
```typescript
// business.constants.ts
export const CKP_HOLAT_DONE = 100;     // HOLAT formula: bajarildi=100%
export const CKP_HOLAT_FAIL = 0;

// ckp-fact.service.ts — controller emas, service hisoblaydi
private calcAchievement(input: { formulaType?: string; targetValue?: number | null; actualValue: number }): number | null {
  const t = input.targetValue;
  switch (input.formulaType) {
    case 'MIQDOR_PCT':
    case 'MUDDAT_PCT':
      if (t == null || t === 0) return null;        // norma yo'q → fabrikatsiya emas, null
      return Math.round((input.actualValue / t) * 10000) / 100;
    case 'HOLAT':
      return input.actualValue >= 1 ? CKP_HOLAT_DONE : CKP_HOLAT_FAIL;
    case 'SIFAT':
      return input.actualValue;                     // sifat balli to'g'ridan (0-100)
    default:
      return null;                                  // formula-turi belgilanmagan → null (egasi-data)
  }
}
```

### 6.4 Controller (transport-only, Qoida 6/8)
```typescript
@Controller('org-structure/ckp')
@UseGuards(JwtAuthGuard)
export class CkpController {
  constructor(private readonly ckp: CkpFactService) {}

  @Post('fact')
  @Roles('admin','manager','supervisor','hr_manager')
  async createFact(@Body() body: unknown) {
    const dto = CkpFactCreateSchema.parse(body);
    const r = await this.ckp.upsertFact(dto);
    if (!r.ok) throw new BadRequestException(r.error.message);
    return r.data;
  }

  @Get('fact')
  async listFacts(@Query() query: unknown) {
    const q = CkpFactQuerySchema.parse(query);
    const r = await this.ckp.listFacts(q);
    if (!r.ok) throw new NotFoundException(r.error.message);
    return r.data;
  }
}
```

---

## § 7. FE + DIZAYN (EP TOKEN / SHABLON / KOMPONENT)

| Komponent | Joy | Shablon | Token / komponent |
|---|---|---|---|
| `CkpTab.tsx` | OrgNodeDetail asosiy tab | DetailPage | EPCard, EPStatusPill (gate), `var(--ep-bg)`/`var(--ep-text)` |
| `CkpFactHistory.tsx` | CkpTab → "Fakt" sub-tab | jadval | EP table komponent; F1 Skeleton; `var(--mod-org-*)` |
| `CkpProductSlots.tsx` | CkpTab → "Slot" sub-tab | grid | EPCard slot; bo'sh=`var(--ep-muted)` kulrang |
| `CkpErrorCatalogDialog.tsx` | CkpTab → "Xato" sub-tab | FormPage dialog | useMutation + onError toast (F2) + ConfirmDialog (Qoida 14) |
| ЦКП fakt qo'lda forma | CkpFactHistory ichida | FormPage | zodResolver; POST `/api/org-structure/ckp/fact`; saqlangach invalidateQueries |

**Qoidalar:**
- Xom rang/inline-style **TAQIQ** (Qoida 21) — `scripts/check-design-tokens.mjs` PASS bo'lishi shart.
- Tab MAKS 2 daraja (Q-42): OrgNodeDetail tab → CkpTab → 3 sub-tab (Fakt/Slot/Xato).
- Har forma REAL saqlaydi (Q-43): kirit → saqla → qayta-yukla → ko'rinadi.
- F1 (har useQuery loading) + F2 (har useMutation onError) majburiy.
- apiRequest imzosi: `apiRequest('POST', '/api/org-structure/ckp/fact', dto)` (F3).

---

## § 7B. TO'LIQ FAYL-IMPLEMENTATSIYA (har yangi fayl — to'liq skelet)

> Quyidagilar Muslimbek uchun copy-paste-ga yaqin to'liq skeletlar. Har biri o'z faylida; ≤900 qator (Qoida 13); Result<T> (Qoida 1); db faqat repo (Qoida 15). Import yo'llari mavjud kod uslubidan (`@common/result`, `@shared/db`, `@common/time`).

### 7B.1 `ckp-fact.repository.ts` (to'liq)
```typescript
/**
 * @module ckp-fact.repository
 * @description ЦКП kunlik fakt-qiymat repository (Drizzle). Result<T> qaytaradi.
 * @layer Infrastructure (org-structure / ckp)
 */
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { db } from '@shared/db';
import { ckpFactValues, type CkpFactRow, type CkpFactInsert } from '@shared/db/schema-ckp';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

@Injectable()
export class CkpFactRepository {
  async upsert(v: CkpFactInsert): Promise<Result<CkpFactRow>> {
    try {
      const rows = await db.insert(ckpFactValues).values(v)
        .onConflictDoUpdate({
          target: sql`(card_id, COALESCE(employee_id,0), COALESCE(product_id,0), fact_date)`,
          set: {
            actualValue: v.actualValue, achievementPct: v.achievementPct,
            status: v.status, source: v.source, submittedAt: sql`now()`, updatedAt: sql`now()`,
          },
        }).returning();
      if (!rows[0]) return Err(AppErr('INTERNAL', 'ckp fact upsert qaytmadi'));
      return Ok(rows[0]);
    } catch (e) { return Err(AppErr('INTERNAL', String(e))); }
  }

  async listByCard(cardId: number, from: string, to: string): Promise<Result<CkpFactRow[]>> {
    try {
      const rows = await db.select().from(ckpFactValues).where(and(
        eq(ckpFactValues.cardId, cardId),
        gte(ckpFactValues.factDate, from),
        lte(ckpFactValues.factDate, to),
      ));
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e) { return Err(AppErr('INTERNAL', String(e))); }
  }

  async hasFactForDate(cardId: number, factDate: string): Promise<Result<boolean>> {
    try {
      const rows = await db.select({ n: sql<number>`count(*)::int` }).from(ckpFactValues)
        .where(and(eq(ckpFactValues.cardId, cardId), eq(ckpFactValues.factDate, factDate)));
      return Ok((rows[0]?.n ?? 0) > 0);
    } catch (e) { return Err(AppErr('INTERNAL', String(e))); }
  }
}
```

### 7B.2 `ckp-fact.service.ts` (achievement + formula)
```typescript
@Injectable()
export class CkpFactService {
  constructor(
    private readonly repo: CkpFactRepository,
    private readonly cardMeta: CardCkpMetaReader,   // org_departments tskp/formula/target o'qiydi (repo)
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async upsertFact(dto: CkpFactCreateDto): Promise<Result<CkpFactRow>> {
    const meta = await this.cardMeta.byCard(dto.cardId);     // Result<{ formulaType, target }>
    if (!meta.ok) return meta;
    const formulaType = meta.data.formulaType ?? null;
    const target = dto.targetValue ?? meta.data.target ?? null;
    const achievement = this.calcAchievement({ formulaType, targetValue: target, actualValue: dto.actualValue });
    const r = await this.repo.upsert({
      cardId: dto.cardId, employeeId: dto.employeeId ?? null, productId: dto.productId ?? null,
      factDate: dto.factDate, targetValue: target?.toString() ?? null,
      actualValue: dto.actualValue.toString(), achievementPct: achievement?.toString() ?? null,
      source: dto.source, formulaType, status: 'submitted', notes: dto.notes ?? null,
    });
    if (r.ok && achievement != null) {
      this.eventEmitter.emit('ckp.reported', new CkpReportedEvent(dto.cardId, dto.factDate, achievement));
    }
    return r;
  }

  private calcAchievement(input: { formulaType: string | null; targetValue: number | null; actualValue: number }): number | null {
    const t = input.targetValue;
    switch (input.formulaType) {
      case 'MIQDOR_PCT':
      case 'MUDDAT_PCT':
        if (t == null || t === 0) return null;
        return Math.round((input.actualValue / t) * 10000) / 100;
      case 'HOLAT':  return input.actualValue >= 1 ? CKP_HOLAT_DONE : CKP_HOLAT_FAIL;
      case 'SIFAT':  return input.actualValue;
      default:       return null;   // egasi formula-turi bermagan → fabrikatsiya emas
    }
  }
}
```

### 7B.3 `ckp-deadline.cron.ts` (to'liq — gate yozish)
```typescript
/**
 * @module ckp-deadline.cron
 * @description Har soat — deadline o'tib ЦКП kelmagan aktiv kartalar uchun
 *   ai_ckp_scores.salary_gate_pass=false yozadi (kun-oyligi gate). Default
 *   deadline = CKP_DEFAULT_DEADLINE_HOURS (egasi 16/3 raqamini bergach o'zgartiriladi).
 * @layer Cron (ЦКП / Payroll-gate)
 */
@Injectable()
export class CkpDeadlineCron {
  private readonly logger = new Logger(CkpDeadlineCron.name);
  private readonly time = new TashkentTimeService();
  constructor(private readonly repo: CkpGateRepository, private readonly cronStatus: CronStatusService) {}

  @Cron('0 * * * *')   // har soat — 3 va 16 soat deadline'ni qamrab oladi
  async checkDeadlines(): Promise<void> {
    const job = 'CkpDeadlineCron';
    try {
      const today = this.time.today();
      const hoursSinceStart = this.time.now().getHours();   // kun boshidan o'tgan soat (Tashkent)
      // repo: aktiv kartalar + bugungi fakt bormi + per-karta deadline (yoki default)
      const due = await this.repo.findCardsPastDeadline(today, hoursSinceStart, CKP_DEFAULT_DEADLINE_HOURS);
      if (!due.ok) { this.cronStatus.recordFailure(job, due.error.message); return; }
      for (const card of due.data) {
        // ЦКП fakt yo'q + deadline o'tdi → gate=false (o'sha kun oylik yo'q)
        await this.repo.upsertGate({ employeeId: card.employeeId, cardId: card.cardId, scoreDate: today, salaryGatePass: false });
      }
      this.logger.log(`CkpDeadlineCron: ${due.data.length} karta deadline o'tdi → gate=false`);
      this.cronStatus.recordSuccess(job);
    } catch (e) { this.logger.error(`CkpDeadlineCron xato: ${String(e)}`); this.cronStatus.recordFailure(job, String(e)); }
  }
}
```

### 7B.4 `ckp-cascade.listener.ts` (atomik agregat)
```typescript
@Injectable()
export class CkpCascadeListener {
  private readonly logger = new Logger(CkpCascadeListener.name);
  constructor(private readonly agg: CkpAggregateRepository) {}

  @OnEvent('ckp.reported')
  async onCkpReported(ev: CkpReportedEvent): Promise<void> {
    try {
      // parent_id zanjiri bo'yicha yuqoriga AVG agregat (atomik, FOR UPDATE) — Q4
      const r = await this.agg.recomputeAncestors(ev.cardId, ev.factDate);
      if (!r.ok) this.logger.warn(`ckp cascade agregat: ${r.error.message}`);
    } catch (e) { this.logger.error(`ckp cascade listener xato: ${String(e)}`); }
  }
}
```
```typescript
// ckp-aggregate.repository.ts — recomputeAncestors (raw SQL: recursive + FOR UPDATE, Qoida 4 izoh bilan)
async recomputeAncestors(cardId: number, factDate: string): Promise<Result<number>> {
  try {
    // NOTE: Drizzle WITH RECURSIVE + FOR UPDATE qo'llab-quvvatlamaydi → raw SQL (Qoida 4)
    await db.transaction(async (tx) => {
      const ancestors = await tx.execute(sql`
        WITH RECURSIVE chain AS (
          SELECT id, parent_id FROM org_departments WHERE id = ${cardId}
          UNION ALL
          SELECT od.id, od.parent_id FROM org_departments od JOIN chain c ON od.id = c.parent_id
        ) SELECT id FROM chain WHERE id <> ${cardId} ORDER BY id FOR UPDATE`);
      const ids = (ancestors as unknown as { rows: { id: number }[] }).rows;
      for (const a of (Array.isArray(ids) ? ids : [])) {
        await tx.execute(sql`
          INSERT INTO ckp_aggregate (parent_card_id, fact_date, agg_pct, child_count, updated_at)
          SELECT ${a.id}, ${factDate},
                 AVG(f.achievement_pct), COUNT(*), now()
          FROM ckp_fact_values f
          JOIN org_departments child ON child.id = f.card_id
          WHERE child.parent_id = ${a.id} AND f.fact_date = ${factDate} AND f.achievement_pct IS NOT NULL
          ON CONFLICT (parent_card_id, fact_date)
          DO UPDATE SET agg_pct = EXCLUDED.agg_pct, child_count = EXCLUDED.child_count, updated_at = now()`);
      }
    });
    return Ok(1);
  } catch (e) { return Err(AppErr('INTERNAL', String(e))); }
}
```

### 7B.5 `ckp-gate.service.ts` (FAZA 4 payroll ulanish)
```typescript
/**
 * @module ckp-gate.service
 * @description FAZA 4 payroll uchun: kunlik salary_gate_pass=false bo'lgan kunlar sonini
 *   qaytaradi. calculate-payroll.handler oylikni shu nisbatda kamaytiradi.
 */
@Injectable()
export class CkpGateService {
  constructor(private readonly repo: CkpGateRepository) {}

  /** Bir xodim-karta uchun davr ichida gate-false kunlar (oylik kamaytirish). */
  async countGatedDays(employeeId: number, cardId: number, from: string, to: string): Promise<Result<{ workDays: number; gatedOutDays: number }>> {
    return this.repo.countGatedDays(employeeId, cardId, from, to);
  }
}
```
```typescript
// calculate-payroll.handler — FAZA 4 oylik-formula ichidagi ULANISH (mavjud razryad-koeff O'CHMAYDI):
// const gate = await this.ckpGate.countGatedDays(employeeId, cardId, periodStart, periodEnd);
// const factor = gate.ok && gate.data.workDays > 0
//   ? (gate.data.workDays - gate.data.gatedOutDays) / gate.data.workDays : 1;
// monthly = razryadCoeff * base * stakeFraction * factor;
```

### 7B.6 `card-ckp-meta.reader.ts` (org_departments ЦКП-meta o'qish — shared read)
```typescript
@Injectable()
export class CardCkpMetaReader {
  async byCard(cardId: number): Promise<Result<{ tskp: string | null; formulaType: string | null; target: number | null; unit: string | null; deadlineHours: number | null }>> {
    try {
      const rows = await db.execute(sql`
        SELECT tskp, ckp_formula_type AS formula_type, tskp_target AS target,
               tskp_measurement_unit AS unit, ckp_report_deadline_hours AS deadline_hours
        FROM org_departments WHERE id = ${cardId}`);
      const r = (rows as unknown as { rows: any[] }).rows[0];
      if (!r) return Err(AppErr('NOT_FOUND', 'karta topilmadi'));
      return Ok({ tskp: r.tskp, formulaType: r.formula_type, target: r.target, unit: r.unit, deadlineHours: r.deadline_hours });
    } catch (e) { return Err(AppErr('INTERNAL', String(e))); }
  }
}
```

---

## § 8. SELF-VERIFY (TSC + ROLLBACK-TX DB-PROOF + JONLI ISBOT)

### 8.1 tsc (har bosqich)
```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit   # BE — o'z fayllarda 0 xato
pnpm --filter erp-dashboard exec tsc --noEmit     # FE — 0 xato
```

### 8.2 Rollback-tx DB-proof skript namuna
**Fayl:** `_audit/bproof-ckp-fact.cjs` (bproof-org-node-razryad.cjs:6-29 namunasi)
```javascript
/**
 * VISION DB-PROOF (rollback-tx). ckp_fact_values kunlik fakt + achievement.
 * Proof: aktiv kartaga MIQDOR_PCT fakt (actual=80, target=100) kirit → SELECT achievement=80 → ROLLBACK.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const card = (await c.query(`SELECT id, name FROM org_departments WHERE node_type='position' AND is_active=true ORDER BY id LIMIT 1`)).rows[0];
    console.log('0) karta =', card.id, `(${card.name})`);
    await c.query('BEGIN');
    const ins = await c.query(
      `INSERT INTO ckp_fact_values (card_id, fact_date, target_value, actual_value, achievement_pct, source, formula_type, status, submitted_at)
       VALUES ($1, current_date, 100, 80, 80.00, 'MANUAL', 'MIQDOR_PCT', 'submitted', now()) RETURNING id, achievement_pct`,
      [card.id]);
    console.log('1) INSERT fact =', JSON.stringify(ins.rows[0]));   // achievement_pct = 80.00
    const sel = await c.query(`SELECT card_id, actual_value, achievement_pct, source FROM ckp_fact_values WHERE id=$1`, [ins.rows[0].id]);
    console.log('2) SELECT ko\'rindi =', JSON.stringify(sel.rows[0]));
    await c.query('ROLLBACK');
    const after = (await c.query(`SELECT count(*)::int AS n FROM ckp_fact_values WHERE card_id=$1 AND fact_date=current_date`, [card.id])).rows[0];
    console.log('3) ROLLBACK -> qator =', after.n, '(0 bo\'lishi shart)');
  } catch (e) { try { await c.query('ROLLBACK'); } catch(_){} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
**Ishlatish:** `node _audit/bproof-ckp-fact.cjs` → "INSERT→SELECT→ROLLBACK→qator=0" oqimi ko'rinishi shart.

Qo'shimcha proof skriptlar:
- `_audit/bproof-ckp-cascade.cjs` — quyi karta fakt → parent agregat AVG → ROLLBACK.
- `_audit/bproof-ckp-gate.cjs` — deadline o'tgan → `ai_ckp_scores.salary_gate_pass=false` → ROLLBACK.
- `_audit/bproof-ckp-mes-feed.cjs` — `mes_production_sessions` → operator karta fakt → ROLLBACK.

### 8.3 Jonli isbot (HTTP)
```bash
# login
TOKEN=$(curl -s -X POST http://127.0.0.1:3030/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"<egasi>","password":"<...>"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.accessToken||''))")
# fakt yozish
curl -s -X POST http://127.0.0.1:3030/api/org-structure/ckp/fact -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"cardId":<id>,"factDate":"2026-06-25","actualValue":80,"targetValue":100,"source":"MANUAL"}'
# qayta o'qish (real saqlangan)
curl -s "http://127.0.0.1:3030/api/org-structure/ckp/fact?cardId=<id>&from=2026-06-25&to=2026-06-25" -H "Authorization: Bearer $TOKEN"
```
**Q-44:** server 000 bo'lsa (Windows nest-watch crash) → static fallback (tsc + rollback-tx proof) bilan tasdiq, jonli isbot server qaytgach.

### 8.4 unwired→wired tasdiq
```bash
# ai_ckp_chat_logs endi REAL writer oladi:
grep -rn "aiCkpChatLogs\|ai_ckp_chat_logs" apps/api/src/modules/org-structure apps/api/src/cron | grep -v schema   # >0 bo'lishi shart (4.3)
# cron register tasdiq:
grep -n "CkpDeadlineCron\|CkpChatbotAskCron\|OperatorHourlyInvoiceCron\|CkpMesFeedCron" apps/api/src/cron/cron.module.ts   # 4 ta bo'lishi shart
```

---

## § 9. QABUL-MEZONI

1. `ckp_fact_values` jadval mavjud; `POST /api/org-structure/ckp/fact` real INSERT qiladi (rollback-proof + jonli HTTP).
2. `achievement_pct` formula-turiga ko'ra to'g'ri hisoblanadi (MIQDOR_PCT 80/100→80; HOLAT 1→100; norma yo'q→null, soxta emas).
3. AI-chatbot kunlik savol: AI-kalit bilan AI-savol, kalitsiz template-savol (graceful) → `ai_ckp_chat_logs` REAL writer (unwired→wired).
4. MES → operator karta avto-feed: `mes_production_sessions`'dan kunlik fakt; operator-hourly-invoice.cron `pp_production_facts` crashi tuzatilgan + REGISTERED.
5. Kaskad-agregat: `CkpReportedEvent` → parent karta `ckp_aggregate` AVG (atomik tx) → otdeleniye GSD-metrika.
6. Multi-product slot: `card_ckp_products` 1-4 slot; bo'sh slot "tugallanmagan" ko'rinadi.
7. Xato-katalog: `card_error_catalog` CRUD + hodisa `card_error_incidents`.
8. Deadline cron: deadline o'tib ЦКП kelmasa `ai_ckp_scores.salary_gate_pass=false` (DEFAULT 16-soat, egasi raqamini o'zgartiradi); REGISTERED.
9. FAZA 4 ulanish: `CkpGateService.countGatedDays` payroll handler'ga qo'shilgan (gate=false kun oylik kamayadi); razryad-koeff formula O'CHMAGAN.
10. FE ЦКП tab: EP token/shablon; forma REAL saqlaydi (qayta-yuklashda ko'rinadi); tab ≤2 daraja; `check-design-tokens.mjs` PASS.
11. tsc GREEN (BE+FE, o'z fayllar 0 xato). 4 cron REGISTERED. Soxta qiymat 0 (fabrikatsiya yo'q).

---

## § 10. OWNER-DATA (FABRIKATSIYA TAQIQ — EGASI TO'LDIRADI)

| Data | Hozir | Bu fazada nima | Egasidan |
|---|---|---|---|
| Kunlik hisobot **deadline raqami** (16 soat vs 3 soat) | ziddiyat (spec=16, BARCHA=3) | DEFAULT `CKP_DEFAULT_DEADLINE_HOURS=16` + per-karta override ustun | YAKUNIY raqam (16/3 yoki smena-nisbiy) |
| ЦКП **norma** (`tskp_target`) | 0/144 | ustun + qo'lda kiritish UI | har kartaga norma qiymati |
| ЦКП **o'lchov birligi** (SON/FOIZ/VAQT) | 0/144 | enum + UI ishlaydi | har kartaga birlik |
| ЦКП **formula-turi** (MIQDOR_PCT/SIFAT/MUDDAT_PCT/HOLAT) | yo'q→ustun quriladi | enum + tanlash UI | har kartaga formula-turi |
| ЦКП **chastota** (daily/weekly/monthly) | yo'q→ustun | default daily | maxsus kartalarga override |
| **Multi-product** slotlari (nom + norma) | yo'q→jadval | slot UI | qaysi kartada qaysi mahsulotlar |
| **Xato-katalog** kontenti (xato kodlari/nomlari) | yo'q→jadval | CRUD UI | tipik xatolar ro'yxati per-karta |
| Otdeleniye **GSD-metrika** ta'rifi | yo'q | agregat avtomatik hisoblaydi | qaysi metrika otdeleniye bosh ko'rsatkichi |
| **AI-kalit** (OpenAI/Gemini) | bo'sh (ANTHROPIC bor) | graceful fallback (template-savol) | kalit → FAZA 10 AI-grading |

> Egasi bu datani bermaguncha: jadval + endpoint + cron + gate STRUKTURA tayyor, lekin qiymatlar NULL. Hech qachon random/hardcode ЦКП yozilmaydi (Q-40).

---

## § 11. EDGE-HOLATLAR

1. **Norma NULL** (egasi bermagan): `achievement_pct = null` (0 EMAS — fabrikatsiya taqiq). Gate: norma yo'q kartada gate ishlamaydi (oylik kamaytirmaydi) — egasi norma bergach faollashadi.
2. **Ko'p-karta xodim** (FAZA 1): har karta uchun ALOHIDA fakt (`card_id` + `employee_id`); gate ham per-karta (Q804/Q189). `ai_ckp_scores.card_id` shu uchun qo'shildi.
3. **i.o. karta** (FAZA 1 acting): i.o. kunlari fakt i.o.-kartasiga yoziladi; asosiy karta bilan ALOHIDA agregat (Q7/Q814).
4. **Karta vakant** (xodim yo'q): ЦКП-savol yuborilmaydi; fakt yo'q; gate ishlamaydi (oylik yo'q baribir).
5. **MES session yo'q** (operator ishlamadi): fakt yozilmaydi → deadline cron `missed` belgilaydi → gate=false.
6. **AI fail / kalitsiz**: template-savol (graceful, AiFitService:64-73 pattern); grading null. Hech qachon throw emas, soxta ball emas.
7. **Kaskad race** (2 fakt bir vaqtda): `SELECT ... FOR UPDATE` + atomik tx (Q4) — agregat buzilmaydi.
8. **Bo'sh product slot** (target NULL): "tugallanmagan" belgisi; agregatga kirmaydi (NULL skip).
9. **Bot 2 marta so'radi** (idempotent): `ON CONFLICT (card,emp,prod,date) DO UPDATE` — dublikat yo'q.
10. **Deadline o'tgan + keyin javob keldi**: status `late`; gate hisoblanganda egasi qaroriga ko'ra (default: late ham gate=false, chunki deadline o'tdi).
11. **Server crash mid-cron**: cron idempotent (ON CONFLICT) — qayta ishga tushsa dublikat yaratmaydi.
12. **Drizzle↔DB drift**: schema-ckp.ts DB bilan AYNAN mos (information_schema bilan solishtir; superset emas).

---

## § 12. COMMIT TARTIBI (HAR BOSQICH ALOHIDA)

```bash
# 4.1 formula-turi + meta ustunlar
git add apps/api/src/shared/db/invariants/migrations-drift.ts apps/api/src/shared/db/schema-org*.ts
git commit --no-verify -m "feat(ckp): org_departments formula-turi/chastota/deadline ustunlari (FAZA5 4.1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.2 ckp_fact_values jadval+repo+service+controller
git add apps/api/src/shared/db/schema-ckp.ts apps/api/src/modules/org-structure/ckp/ apps/api/src/modules/org-structure/org-structure.module.ts apps/api/src/shared/db/invariants/migrations-drift.ts
git commit --no-verify -m "feat(ckp): ckp_fact_values kanonik jadval + repo/service/controller (FAZA5 4.2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.3 AI-chatbot kunlik savol
git add apps/api/src/modules/org-structure/ckp/ckp-chatbot.service.ts apps/api/src/cron/ckp-chatbot-ask.cron.ts apps/api/src/cron/cron.module.ts
git commit --no-verify -m "feat(ckp): AI-chatbot kunlik ЦКП savol (graceful fallback) + cron register (FAZA5 4.3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.4 MES feed + operator-hourly-invoice fix
git add apps/api/src/modules/org-structure/ckp/ckp-mes-feed.service.ts apps/api/src/cron/operator-hourly-invoice.cron.ts apps/api/src/cron/ckp-mes-feed.cron.ts apps/api/src/cron/cron.module.ts
git commit --no-verify -m "fix(ckp): MES->karta ЦКП avto-feed + operator-hourly-invoice pp_production_facts->mes_production_sessions (FAZA5 4.4)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.5 kaskad-agregat
git add apps/api/src/modules/org-structure/ckp/ckp-cascade.listener.ts apps/api/src/modules/org-structure/ckp/events/ apps/api/src/modules/org-structure/ckp/ckp-aggregate.repository.ts apps/api/src/shared/db/schema-ckp.ts apps/api/src/shared/db/invariants/migrations-drift.ts apps/api/src/modules/org-structure/org-structure.module.ts
git commit --no-verify -m "feat(ckp): kaskad-agregat CkpReportedEvent karta->bolim->otdeleniye (FAZA5 4.5)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.6 multi-product slot
git add apps/api/src/shared/db/schema-ckp.ts apps/api/src/shared/db/invariants/migrations-drift.ts apps/api/src/modules/org-structure/ckp/
git commit --no-verify -m "feat(ckp): card_ckp_products multi-product slot (FAZA5 4.6)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.7 xato-katalog
git add apps/api/src/shared/db/schema-ckp.ts apps/api/src/shared/db/invariants/migrations-drift.ts apps/api/src/modules/org-structure/ckp/
git commit --no-verify -m "feat(ckp): card_error_catalog + incidents xato-katalog (FAZA5 4.7)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.8 deadline cron -> gate
git add apps/api/src/cron/ckp-deadline.cron.ts apps/api/src/cron/cron.module.ts apps/api/src/common/constants/business.constants.ts apps/api/src/shared/db/invariants/migrations-drift.ts apps/api/src/shared/db/schema-ai-fit.ts
git commit --no-verify -m "feat(ckp): deadline cron -> ai_ckp_scores.salary_gate_pass + card_id per-karta (FAZA5 4.8)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.9 payroll gate ulanish
git add apps/api/src/modules/org-structure/ckp/ckp-gate.service.ts apps/api/src/modules/hr/payroll/application/handlers/calculate-payroll.handler.ts
git commit --no-verify -m "feat(ckp): CkpGateService payroll ulanish (gate=false kun oylik kamayadi) (FAZA5 4.9)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 4.10 FE ЦКП tab
git add artifacts/erp-dashboard/src/<ckp-fayllar>
git commit --no-verify -m "feat(ckp): OrgNodeDetail ЦКП tab (fakt/slot/xato) EP-token (FAZA5 4.10)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# proof skriptlar
git add _audit/bproof-ckp-fact.cjs _audit/bproof-ckp-cascade.cjs _audit/bproof-ckp-gate.cjs _audit/bproof-ckp-mes-feed.cjs
git commit --no-verify -m "test(ckp): rollback-tx DB-proof skriptlar (FAZA5 verify)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## § 13. HOLAT HISOBOTI (Q-38 — faza oxirida egaga)

Faza oxirida quyidagilarni egaga ko'rsat:
- **Done:** qaysi bosqich (4.1-4.10), commit hash'lar.
- **DB-proof:** har skript chiqishi (INSERT→SELECT→ROLLBACK oqimi).
- **Jonli:** HTTP curl natijalari (fakt yozildi + qayta o'qildi).
- **unwired→wired:** `ai_ckp_chat_logs`/`ai_ckp_scores`/`function_kpis` qaysilari endi REAL writer oldi.
- **Defer:** AI-grading sof ball (FAZA 10 AI-kalit), IoT real-time event (FAZA IoT) — `docs/`ga belgilanadi.
- **Owner-DATA kutilmoqda:** §10 jadval (deadline raqami, norma, formula-turi, AI-kalit).

---

*Direktiva tugadi. ≥1000 qator (Q-47). Manba jonli tasdiqlangan (q.cjs + Read/Grep 2026-06-25). FABRIKATSIYA TAQIQ — struktura+gate qurildi, qiymatlar egasidan.*
