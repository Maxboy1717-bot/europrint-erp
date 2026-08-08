# P37 — CC (Communication Center): CC 14 vision doc-types seed + op-code logging + Phase4 schema/causality

> Paket: P37 · To'lqin: Wave 1 · DependsOn: [] · DDL: HA (darvoza ochiq)
> Bajaruvchi: Muslimbek · Tayyorlagan: Claude (advisor) · Sana: 2026-06-19

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi.

**QOIDALAR BLOKI (Q-47 — har direktivada bo'ladi):**

1. **Result<T>** hamma repo/service metodida; `throw/null/undefined` TAQIQ.
2. `@Body()` **Zod** bilan validate qilinadi; `class-validator` TAQIQ.
3. **Drizzle ORM** asosiy; raw SQL faqat murakkab holat (izoh + `typedExecute<T>`).
4. **Q-40** ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46** ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **Fayl izolyatsiyasi (Q-23/Q-31):** faqat owned-file ro'yxatidagi fayllar; boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil.
7. **DDL darvozasi (Q-35):** CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Bu paket DDL talab qiladi — migrationni YOZ lekin `-- GATED` belgila, `psql` orqali ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify:** BE `tsc 0`, FE `tsc 0`, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = `docs/audit/MUSLIMBEK-PROMT-16-CC-2026-06-08.md` (CC vizyon hujjati) + `docs/XARITA-REJA-YONALISH.md`; kod vizyonga zid bo'lsa (ishlasa ham) = xato.
13. **Op-code logging (qoida J):** har CC operatsiya `level=info code=EP-CC-###` formatida `cc_audit_trail`'ga + `this.logger.log(...)` yozadi.

**Wave:** 1 · **DependsOn:** `[]` (bloklovchi paket yo'q)

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.**

```
OWNED FILES (mutlaq yo'llar):
1.  Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-workflow.service.ts
2.  Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-baskets.service.ts
3.  Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-ai-interview.service.ts
4.  Uzbek-Language-Module/apps/api/src/modules/communication-center/cron/cc-sla.cron.ts
5.  Uzbek-Language-Module/apps/api/src/modules/communication-center/events/cc-event.listener.ts
6.  Uzbek-Language-Module/apps/api/drizzle/0017_cc_vision_templates_seed.sql   ← GATED DDL
7.  Uzbek-Language-Module/apps/api/drizzle/0018_cc_phase4_schema.sql           ← GATED DDL
8.  Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-write.repo.ts
9.  Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/types.ts
10. Uzbek-Language-Module/artifacts/erp-dashboard/src/components/cc/DocumentDetailModal.tsx
```

**MUHIM ESLATMA:** Paket spetsifikatsiyasida fayl nomlari `0015_cc_vision_templates_seed.sql` va `0016_cc_phase4_schema.sql` deb ko'rsatilgan, lekin bu raqamlar allaqachon boshqa migratsiyalar tomonidan band:
- `0015_critical_schema_fixes.sql` — allaqachon mavjud
- `0016_pos_inventory_passport.sql` — allaqachon mavjud

Shuning uchun **keyingi erkin raqamlar ishlatiladi:**
- `0017_cc_vision_templates_seed.sql`
- `0018_cc_phase4_schema.sql`

Ishni boshlashdan oldin `ls apps/api/drizzle/` bilan joriy eng katta raqamni tasdiqla va mos yangi raqam tanla.

**DDL DARVOZASI:** `0017` va `0018` fayllari yoziladi, LEKIN `psql` yoki Drizzle migrate orqali ishga tushirilmaydi. Har fayl `-- GATED: egasi ruxsati kutilmoqda` belgisi bilan boshlanadi. Egasi `-- APPROVED: <ism> <sana>` qo'shib, "ha, ishga tushir" degunga qadar fayl faqat gitda saqlanadi.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-16-CC-2026-06-08.md` (to'liq o'qi — 299 qator)

### 2.1 Qabul mezonlari (feature bo'yicha)

| Feature | Manba (EP-CC-###) | Qabul mezoni |
|---|---|---|
| **14 ta vizyon hujjat turi** | EP-CC-019, EP-CC-002 | `SELECT code FROM cc_document_templates ORDER BY code` → 14 qator, hamma vizyon kodlari mavjud (ZVS/ZNO/DOKLAD_REAL/RASPORYAZHENIE/PRIKAZ/PROTOKOL/UMUMIY_ARIZA/REJA_OZGARTIRISH/SMENA_YAKUNI/ORGPOLITIKA/SIFAT_OGOH/TAMINOT_ZAЯВKA/REJA_QOGOZI/NAZORAT_VARAKASI) |
| **Eski HR seed almashtirish** | EP-CC-019 | Eski 14 template (ADVANCE/VACATION/SALARY_RAISE/.../ ZRS_ZVS) `is_active = false` bo'ladi; yangi vizyon tiplar `is_active = true` |
| **EP-CC-### op-code logging** | Qoida J | Har CC servis metodida `this.logger.log(...)` va `cc_audit_trail` yozuvi `code` ustuni bilan; `SELECT code FROM cc_audit_trail LIMIT 5` → `EP-CC-###` formatda qiymatlar |
| **Phase4 DDL: `responsible_card_id`** | E2 (card-centric), EP-CC-021 | `cc_documents` jadvalida `responsible_card_id integer REFERENCES org_functions(id)` ustun mavjud (GATED) |
| **Phase4 DDL: `archive_until`** | EP-CC-016 | `cc_documents` jadvalida `archive_until date` ustun mavjud (GATED) |
| **Phase4 DDL: `series_tag`** | EP-CC-061 | `cc_documents` jadvalida `series_tag varchar(40)` ustun mavjud (GATED) |
| **Phase4 DDL: `cc_approvals.basis_document_id`** | EP-CC-042 | `cc_approvals` jadvalida `basis_document_id uuid REFERENCES cc_documents(id)` mavjud (GATED) |
| **Phase4 DDL: `cc_approvals.ai_analysis`** | EP-CC-022 | `cc_approvals` jadvalida `ai_analysis jsonb` ustun mavjud (GATED) |
| **FE causality field** | EP-CC-042 | `DocumentDetailModal.tsx` da approvals bo'limida `basis_document_id` (autocomplete) maydon ko'rsatiladi; mavjud hujjat `cc_approvals.basis_document_id` dan o'qiladi |

### 2.2 CC tizimi haqida vizyon konteksti

EuroPrint CC = zavod ichidagi **barcha rasmiy hujjatlar** uchun yagona platforma (A-System/Bitrix o'rnini bosadi, EP-CC-065). Hujjat org-sxema bo'yicha vertikal (yuqoriga) ketadi — **hammasi DIREKTORGA** tugaydi (EP-CC-028, egasi override).

Hozirgi seed 14 template bor (ADVANCE/VACATION/...) — bular **HR arizalari**, vizyon hujjat turlaridan FARQLI. Vizyon 14 tur — **zavod jarayon hujjatlari** (ZVS, ZNO, doklad, rasporyazhenie, prikaz, protokol, va boshqalar). Bu paket shu almashtiruvni amalga oshiradi.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (to'g'ri ishlaydi — Q-46 bo'yicha O'CHIRILMAYDI)

| Fayl | Qator | Holat |
|---|---|---|
| `apps/api/drizzle/0006_communication_center.sql` | 1–402 | ✅ Real — 15 CC jadval DDL + eski 14 template seed (ADVANCE..ZRS_ZVS) |
| `apps/api/drizzle/0007_cc_user_pins.sql` | — | ✅ Real — `cc_user_pins` jadval |
| `apps/api/drizzle/0008_cc_workflow_steps_seed.sql` | — | ✅ Real — 14 workflow zanjir (MANAGER_OF_SENDER→CEO pattern) |
| `cc-workflow.service.ts` | 1–248 | ✅ Real — createDraft/sendDocument/approve/reject/resubmit/cancel, `Logger` mavjud |
| `cc-baskets.service.ts` | 1–34 | ✅ Real — listBasket/summary/move/getOne, delegate repo orqali |
| `cc-ai-interview.service.ts` | 1–80+ | ✅ Real — AI orqali intervyu, sessiya saqlash, `AiRouterCallService.callClaude` |
| `cc-sla.cron.ts` | 1–80+ | ✅ Real cron — `markInboxOverdue`, `autoRejectOverdue48h`, `escalateApprovals`, `expireDelegations` |
| `cc-event.listener.ts` | 1–80+ | ✅ Real — `CcSpawnRequestedEvent` tinglovchi, draft yaratadi |
| `cc-documents-write.repo.ts` | 1–80+ | ✅ Real raw SQL — `createDraft`, `transition`, `createApproval`, `signApproval`, `cancel`, va boshqalar |
| `types.ts` | 1–76 | ✅ Real — `DocumentRow`, `TemplateRow`, `WorkflowStepRow`, `CreateDraftInput` interfeyslari |
| `DocumentDetailModal.tsx` | 1–145 | ✅ Real — ikkita `useQuery`, holat/ustuvor Badge-lar, aiBody/senderComment ko'rinadi |

### 3.2 Buzuq / Qisman / Yo'q (tuzatiladi)

| Muammo | Fayl:Qator | Gap |
|---|---|---|
| **Eski HR seed vizyon bilan mos emas** | `0006_cc_comm_center.sql:309–390` | 14 template kodi (ADVANCE/VACATION/SALARY_RAISE/IMPROVEMENT/DOKLAD/REPORT/TRAINING/FIX_ERRORS/FINANCIAL_AID/CONTRACT_END/TRANSFER/SCHEDULE_CHANGE/ORDER/ZRS_ZVS) vizyon hujjat turlaridan farqli — EP-CC-019 bo'yicha zavod-spetsifik turlar kerak |
| **Op-code logging yo'q** | `cc-workflow.service.ts` butun fayl | `Logger` mavjud lekin `EP-CC-###` kod formati yo'q; `cc_audit_trail.code` ustuni `NULL` bo'ladi |
| **Op-code logging yo'q** | `cc-baskets.service.ts` butun fayl | Logger yo'q umuman |
| **Op-code logging yo'q** | `cc-ai-interview.service.ts` butun fayl | `Logger` mavjud lekin EP-CC kodi yo'q |
| **Op-code logging yo'q** | `cc-sla.cron.ts` butun fayl | `Logger` mavjud lekin EP-CC kodi yo'q |
| **Op-code logging yo'q** | `cc-event.listener.ts` butun fayl | `Logger` mavjud lekin EP-CC kodi yo'q |
| **`cc_documents.responsible_card_id` yo'q** | `0006...sql` jadval | E2 card-centric: hujjat javobgar lavozim kartasiga bog'liq bo'lishi kerak — ustun DDL'da yo'q |
| **`cc_documents.archive_until` yo'q** | `0006...sql` jadval | EP-CC-016: 10 yil/3 yil saqlash muddati — ustun yo'q |
| **`cc_documents.series_tag` yo'q** | `0006...sql` jadval | EP-CC-061 СЕРИЯ — ustun yo'q |
| **`cc_approvals.basis_document_id` yo'q** | `0006...sql` `cc_approvals` | EP-CC-042 causality — ustun yo'q |
| **`cc_approvals.ai_analysis` yo'q** | `0006...sql` `cc_approvals` | EP-CC-022 AI tahlil — ustun yo'q |
| **`DocumentDetailModal` causality maydoni yo'q** | `DocumentDetailModal.tsx:1–145` | Approvals bo'limi umuman ko'rsatilmaydi; `basis_document_id` FE maydoni yo'q |
| **`types.ts` eski interfeyslari** | `types.ts:8–35 (DocumentRow)` | Yangi ustunlar (`responsibleCardId`, `archiveUntil`, `seriesTag`) `DocumentRow`'da yo'q |
| **`types.ts` eski `TemplateRow`** | `types.ts:37–50` | `communicationType`, `isMandatory` maydonlari yo'q |
| **`cc_sla.cron.ts:197-201`** | `cc-sla.cron.ts` | `spawnRecurringDocuments()` = no-op stub: hali ishlaydi deyilgan lekin "hozir hech narsa qilmaydi" — bu bosqichda QOLDIRILADI (scope emas), lekin `EP-CC-` log qo'shiladi |
| **`cc-event.listener.ts:141-145`** | `cc-event.listener.ts` | `autoSend=true` path drops: "tizim PIN'i mexanizmi keyingi versiyada" — bu bosqichda QOLDIRILADI (scope emas), lekin `EP-CC-` log qo'shiladi |

### 3.3 `cc_audit_trail` ustunlarini tekshir

`0006_communication_center.sql` da `cc_audit_trail` jadval ta'rifini o'qi:

```sql
-- Fayl: 0006_communication_center.sql, taxminan 190–210 qator
```

**Muhim:** `cc_audit_trail`'da `code` ustuni mavjudligini tekshir. Agar yo'q bo'lsa — bu ham 0018 migratsiyasiga qo'shiladi:

```sql
-- Tekshirish:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'cc_audit_trail' AND column_name = 'code';
```

Agar natija bo'sh bo'lsa, 0018 migratsiyasiga quyidagini qo'sh:
```sql
ALTER TABLE cc_audit_trail ADD COLUMN IF NOT EXISTS code varchar(20);
CREATE INDEX IF NOT EXISTS cc_audit_code_idx ON cc_audit_trail(code);
```

---

## 4. ISH (qadam-baqadam)

> Har qadam oxirida: tsc 0 tasdiqla + commit (agar mustaqil guruh bo'lsa).

---

### QADAM 1: `types.ts` — yangi ustunlarni `DocumentRow` va `TemplateRow`'ga qo'sh

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/types.ts`

**Muammo:** `DocumentRow` va `TemplateRow` interfeyslari Phase4 DDL ustunlarini bilmaydi. Tip xavfsizligi uchun avval interfeys yangilanadi.

**Oldin (types.ts:8–35 — `DocumentRow`):**
```typescript
export interface DocumentRow {
  id:                string;
  documentNumber:    string;
  // ... (27 ta maydon)
  archivedAt:        string | null;
}
```

**Keyin — `DocumentRow`'ga 3 ta yangi optional maydon qo'sh (hozirgi 27 ta maydonga qo'shimcha):**
```typescript
export interface DocumentRow {
  id:                  string;
  documentNumber:      string;
  templateId:          string;
  templateVersion:     number;
  senderUserId:        number;
  branchId:            string | null;
  basketState:         BasketState;
  basketOwnerUserId:   number | null;
  basketEnteredAt:     string;
  isInboxOverdue:      boolean;
  workflowState:       WorkflowState;
  currentStepOrder:    number;
  subject:             string;
  aiBody:              string;
  aiAnswers:           Record<string, unknown>;
  senderComment:       string | null;
  priority:            Priority;
  language:            Language;
  parentDocumentId:    string | null;
  version:             number;
  cancelledByUserId:   number | null;
  cancelledReason:     string | null;
  cancelledAt:         string | null;
  createdAt:           string;
  updatedAt:           string;
  archivedAt:          string | null;
  // Phase4 yangi ustunlar (DDL 0018 orqali qo'shiladi — optional, ustun bo'lmaguncha null)
  responsibleCardId:   number | null;
  archiveUntil:        string | null;
  seriesTag:           string | null;
}
```

**`TemplateRow`'ga yangi maydonlar qo'sh (types.ts:37–50 ga):**
```typescript
export interface TemplateRow {
  id:                string;
  code:              string;
  nameUz:            string;
  nameRu:            string;
  category:          string;
  version:           number;
  isActive:          boolean;
  defaultPriority:   Priority;
  numberFormat:      string;
  inboxSlaHours:     number;
  reminderHours:     number;
  escalationHours:   number;
  // Phase1+ qo'shimcha maydonlar (optional — DB'da bo'lmaguncha null)
  communicationType: string | null;
  isMandatory:       boolean | null;
}
```

**`ApprovalRow` interfeysi qo'sh (agar yo'q bo'lsa):**
```typescript
// cc_approvals jadvalining satri (read)
export interface ApprovalRow {
  id:                  string;
  documentId:          string;
  stepOrder:           number;
  approverUserId:      number;
  state:               string;
  comment:             string | null;
  signedAt:            string | null;
  signatureHash:       string | null;
  deadlineAt:          string | null;
  rejectionStops:      boolean;
  createdAt:           string;
  updatedAt:           string;
  // Phase4 yangi ustunlar (DDL 0018 orqali — optional)
  basisDocumentId:     string | null;
  aiAnalysis:          Record<string, unknown> | null;
}
```

**Self-verify:** `pnpm --filter @europrint/api run tsc --noEmit` — 0 xato.

---

### QADAM 2: `0017_cc_vision_templates_seed.sql` — 14 ta vizyon hujjat turi seed

**Fayl (YANGI):** `Uzbek-Language-Module/apps/api/drizzle/0017_cc_vision_templates_seed.sql`

**Maqsad:** Eski HR-oriented 14 template `is_active = false` qilinadi; yangi zavod-spetsifik 14 vizyon turi `is_active = true` bilan qo'shiladi.

**Vizyon 14 hujjat turi (manba: `MUSLIMBEK-PROMT-16-CC-2026-06-08.md:24`):**

| # | Vizyon nomi | Kod | Kategoriya | SLA soat | Raqam formati |
|---|---|---|---|---|---|
| 1 | ZVS (Zakaz na vnutrenniy servis) | `ZVS` | xabar | 4 | `ZVS-{YYYY}-{SEQ}` |
| 2 | ZNO (Zakaz na vneshnyuyu operatsiyu) | `ZNO` | xabar | 4 | `ZNO-{YYYY}-{SEQ}` |
| 3 | Doklad | `DOKLAD` | hisobot | 48 | `DOK-{YYYY}-{SEQ}` |
| 4 | Rasporyazhenie (farmoyish) | `RASPORYAZHENIE` | buyruq | 24 | `RASH-{YYYY}-{SEQ}` |
| 5 | Prikaz (yuqoridan buyruq) | `PRIKAZ` | buyruq | 24 | `PRIK-{YYYY}-{SEQ}` |
| 6 | Protokol (majlis bayonnomasi) | `PROTOKOL` | hisobot | 24 | `PROT-{YYYY}-{SEQ}` |
| 7 | Umumiy ariza | `UMUMIY_ARIZA` | ariza | 24 | `ARZ-{YYYY}-{SEQ}` |
| 8 | Reja o'zgartirish | `REJA_OZGARTIRISH` | rejalashtirish | 24 | `REJOZ-{YYYY}-{SEQ}` |
| 9 | Smena yakuni xulosasi | `SMENA_YAKUNI` | hisobot | 8 | `SMYAK-{YYYY}-{SEQ}` |
| 10 | Orgpolitika (korxona siyosati) | `ORGPOLITIKA` | siyosat | 72 | `ORGP-{YYYY}-{SEQ}` |
| 11 | Sifat ogohlantirishi | `SIFAT_OGOH` | sifat | 1 | `SIFOG-{YYYY}-{SEQ}` |
| 12 | Ta'minot zaявkasi | `TAMINOT_ZAYAVKA` | ta'minot | 4 | `TAMZ-{YYYY}-{SEQ}` |
| 13 | Reja qog'ozi | `REJA_QOGOZI` | rejalashtirish | 4 | `REJQ-{YYYY}-{SEQ}` |
| 14 | Nazorat varakasi | `NAZORAT_VARAKASI` | nazorat | 24 | `NAZV-{YYYY}-{SEQ}` |

**Fayl tuzilishi:**
```sql
-- GATED: egasi ruxsati kutilmoqda
-- APPROVED: <ism> <sana>  ← egasi shu qatorni to'ldirgandan keyin run qilish mumkin
-- 0017_cc_vision_templates_seed.sql
-- Maqsad: EP-CC-019 — 14 ta zavod-spetsifik vizyon hujjat turi seed
-- EP-CC-002: cc_document_templates faqat super_admin tomonidan yaratiladi/o'zgartiriladi.
--   Direct DDL seed = DBA/owner; application-layer = @Roles('super_admin') guard majburiy.

-- 1. Eski HR-oriented template'larni passivlashtir (o'chirma — Q-46)
UPDATE cc_document_templates
SET is_active = false
WHERE code IN (
  'ADVANCE','VACATION','SALARY_RAISE','IMPROVEMENT','DOKLAD','REPORT',
  'TRAINING','FIX_ERRORS','FINANCIAL_AID','CONTRACT_END','TRANSFER',
  'SCHEDULE_CHANGE','ORDER','ZRS_ZVS'
);

-- 2. Yangi vizyon template'larni qo'sh (ON CONFLICT = yangilashtir)
INSERT INTO cc_document_templates
  (code, name_uz, name_ru, category, ai_questions, number_format,
   inbox_sla_hours, reminder_hours, escalation_hours, is_active)
VALUES

  -- 1. ZVS
  ('ZVS', 'ZVS — Ichki xizmat buyurtmasi', 'ЗВС — Заказ внутреннего сервиса',
   'xabar',
   '[
     {"key":"service_type","qUz":"Xizmat turi (nima kerak)","qRu":"Тип сервиса (что требуется)","required":true,"type":"text"},
     {"key":"department","qUz":"Qaysi bo''limdan","qRu":"От какого отдела","required":true,"type":"text"},
     {"key":"deadline","qUz":"Kerak bo''lish muddati","qRu":"Срок выполнения","required":true,"type":"date"},
     {"key":"amount","qUz":"Taxminiy summa (UZS)","qRu":"Примерная сумма (UZS)","required":false,"type":"number"},
     {"key":"justification","qUz":"Asoslantirish","qRu":"Обоснование","required":true,"type":"text"}
   ]'::jsonb,
   'ZVS-{YYYY}-{SEQ}', 4, 2, 8, true),

  -- 2. ZNO
  ('ZNO', 'ZNO — Tashqi operatsiya buyurtmasi', 'ЗНО — Заказ внешней операции',
   'xabar',
   '[
     {"key":"operation_type","qUz":"Tashqi operatsiya turi","qRu":"Тип внешней операции","required":true,"type":"text"},
     {"key":"vendor","qUz":"Yetkazib beruvchi/xizmatchi","qRu":"Поставщик/подрядчик","required":true,"type":"text"},
     {"key":"amount","qUz":"Taxminiy summa (UZS)","qRu":"Примерная сумма (UZS)","required":true,"type":"number"},
     {"key":"deadline","qUz":"Bajarish muddati","qRu":"Срок выполнения","required":true,"type":"date"},
     {"key":"justification","qUz":"Asoslantirish","qRu":"Обоснование","required":true,"type":"text"}
   ]'::jsonb,
   'ZNO-{YYYY}-{SEQ}', 4, 2, 8, true),

  -- 3. DOKLAD
  ('DOKLAD', 'Doklad', 'Доклад',
   'hisobot',
   '[
     {"key":"topic","qUz":"Mavzu","qRu":"Тема","required":true,"type":"text"},
     {"key":"problem","qUz":"Muammo/holat","qRu":"Проблема/ситуация","required":true,"type":"text"},
     {"key":"facts","qUz":"Aniq faktlar va raqamlar","qRu":"Конкретные факты и цифры","required":true,"type":"text"},
     {"key":"recommendations","qUz":"Tavsiyalar","qRu":"Рекомендации","required":true,"type":"text"},
     {"key":"resources","qUz":"Kerakli resurslar","qRu":"Необходимые ресурсы","required":false,"type":"text"}
   ]'::jsonb,
   'DOK-{YYYY}-{SEQ}', 48, 36, 96, true),

  -- 4. RASPORYAZHENIE
  ('RASPORYAZHENIE', 'Farmoyish (rasporyazhenie)', 'Распоряжение',
   'buyruq',
   '[
     {"key":"recipient_position","qUz":"Kimga (lavozim)","qRu":"Кому (должность)","required":true,"type":"text"},
     {"key":"instruction","qUz":"Farmoyish matni","qRu":"Текст распоряжения","required":true,"type":"text"},
     {"key":"deadline","qUz":"Bajarish muddati","qRu":"Срок выполнения","required":true,"type":"date"},
     {"key":"expected_result","qUz":"Kutilayotgan natija","qRu":"Ожидаемый результат","required":true,"type":"text"}
   ]'::jsonb,
   'RASH-{YYYY}-{SEQ}', 24, 18, 48, true),

  -- 5. PRIKAZ
  ('PRIKAZ', 'Buyruq (prikaz)', 'Приказ',
   'buyruq',
   '[
     {"key":"order_type","qUz":"Buyruq turi (qabul/ishdan chiqarish/bonus/boshqa)","qRu":"Тип приказа","required":true,"type":"text"},
     {"key":"affected_employees","qUz":"Kimga tegishli (lavozim/xodim)","qRu":"Кого касается","required":true,"type":"text"},
     {"key":"order_text","qUz":"Buyruq to''liq matni","qRu":"Полный текст приказа","required":true,"type":"text"},
     {"key":"effective_date","qUz":"Kuchga kirish sanasi","qRu":"Дата вступления в силу","required":true,"type":"date"}
   ]'::jsonb,
   'PRIK-{YYYY}-{SEQ}', 24, 18, 48, true),

  -- 6. PROTOKOL
  ('PROTOKOL', 'Majlis bayonnomasi (protokol)', 'Протокол собрания',
   'hisobot',
   '[
     {"key":"meeting_date","qUz":"Majlis sanasi","qRu":"Дата собрания","required":true,"type":"date"},
     {"key":"participants","qUz":"Ishtirokchilar (lavozimlar)","qRu":"Участники (должности)","required":true,"type":"text"},
     {"key":"agenda","qUz":"Kun tartibi","qRu":"Повестка дня","required":true,"type":"text"},
     {"key":"decisions","qUz":"Qabul qilingan qarorlar","qRu":"Принятые решения","required":true,"type":"text"},
     {"key":"responsible","qUz":"Mas''ul shaxslar va muddatlar","qRu":"Ответственные и сроки","required":true,"type":"text"}
   ]'::jsonb,
   'PROT-{YYYY}-{SEQ}', 24, 18, 48, true),

  -- 7. UMUMIY_ARIZA
  ('UMUMIY_ARIZA', 'Umumiy ariza', 'Общее заявление',
   'ariza',
   '[
     {"key":"request_subject","qUz":"Ariza mavzusi","qRu":"Тема заявления","required":true,"type":"text"},
     {"key":"description","qUz":"Talab/iltimos tafsiloti","qRu":"Описание запроса","required":true,"type":"text"},
     {"key":"justification","qUz":"Asoslantirish","qRu":"Обоснование","required":true,"type":"text"},
     {"key":"expected_date","qUz":"Kutilayotgan ko''rib chiqish sanasi","qRu":"Ожидаемая дата рассмотрения","required":false,"type":"date"}
   ]'::jsonb,
   'ARZ-{YYYY}-{SEQ}', 24, 18, 48, true),

  -- 8. REJA_OZGARTIRISH (EP-CC-046/047)
  ('REJA_OZGARTIRISH', 'Reja o''zgartirish', 'Изменение плана',
   'rejalashtirish',
   '[
     {"key":"initiator","qUz":"Tashabbuskor (F.I.O / lavozim)","qRu":"Инициатор (ФИО / должность)","required":true,"type":"text"},
     {"key":"reason_group","qUz":"Sabab guruhi","qRu":"Группа причины","required":true,"type":"select","options":["material_yoq","dastgoh_buzilishi","mijoz_talabi","rejalashtirish_xatosi","rahbar_qarori"]},
     {"key":"description","qUz":"Izoh (batafsil)","qRu":"Комментарий (подробно)","required":true,"type":"text"},
     {"key":"expected_result","qUz":"Kutilgan natija","qRu":"Ожидаемый результат","required":true,"type":"text"},
     {"key":"affected_order","qUz":"Bog''liq ishlab chiqarish buyurtmasi (raqam)","qRu":"Связанный производственный заказ","required":false,"type":"text"}
   ]'::jsonb,
   'REJOZ-{YYYY}-{SEQ}', 24, 18, 48, true),

  -- 9. SMENA_YAKUNI (EP-CC-049)
  ('SMENA_YAKUNI', 'Smena yakuni xulosasi', 'Итоговый отчёт смены',
   'hisobot',
   '[
     {"key":"shift_date","qUz":"Smena sanasi","qRu":"Дата смены","required":true,"type":"date"},
     {"key":"shift_type","qUz":"Smena turi (kun/tun)","qRu":"Тип смены (день/ночь)","required":true,"type":"select","options":["kun","tun"]},
     {"key":"plan_quantity","qUz":"Reja miqdori","qRu":"Плановое количество","required":true,"type":"number"},
     {"key":"fact_quantity","qUz":"Fakt miqdori","qRu":"Фактическое количество","required":true,"type":"number"},
     {"key":"defects","qUz":"Nuqsonlar (turi va miqdori)","qRu":"Дефекты (тип и количество)","required":false,"type":"text"},
     {"key":"downtime_reason","qUz":"To''xtash sabablari (agar bo''lsa)","qRu":"Причины простоя (если были)","required":false,"type":"text"},
     {"key":"comment","qUz":"Smena izohi","qRu":"Комментарий по смене","required":true,"type":"text"}
   ]'::jsonb,
   'SMYAK-{YYYY}-{SEQ}', 8, 6, 12, true),

  -- 10. ORGPOLITIKA (EP-CC-052/063)
  ('ORGPOLITIKA', 'Orgpolitika (korxona siyosati)', 'Организационная политика',
   'siyosat',
   '[
     {"key":"current_state","qUz":"Hozirgi holat (tavsif)","qRu":"Текущее состояние","required":true,"type":"text"},
     {"key":"goal","qUz":"Maqsad","qRu":"Цель","required":true,"type":"text"},
     {"key":"action_detail","qUz":"Harakatlar detalizatsiyasi","qRu":"Детализация действий","required":true,"type":"text"},
     {"key":"ideal_picture","qUz":"Mukammal manzara","qRu":"Идеальная картина","required":true,"type":"text"},
     {"key":"target_positions","qUz":"Maqsadli lavozimlar","qRu":"Целевые должности","required":true,"type":"text"}
   ]'::jsonb,
   'ORGP-{YYYY}-{SEQ}', 72, 48, 96, true),

  -- 11. SIFAT_OGOH (EP-CC-072, 15 min SLA per EP-CC-051)
  ('SIFAT_OGOH', 'Sifat ogohlantirishi', 'Предупреждение о качестве',
   'sifat',
   '[
     {"key":"defect_type","qUz":"Nuqson turi","qRu":"Тип дефекта","required":true,"type":"text"},
     {"key":"quantity","qUz":"Nuqsonli birlik miqdori","qRu":"Количество дефектных единиц","required":true,"type":"number"},
     {"key":"location","qUz":"Aniqlangan joy (станция/участок)","qRu":"Место обнаружения","required":true,"type":"text"},
     {"key":"batch_number","qUz":"Partiya raqami","qRu":"Номер партии","required":false,"type":"text"},
     {"key":"immediate_action","qUz":"Darhol ko''rilgan chora","qRu":"Немедленно принятые меры","required":true,"type":"text"}
   ]'::jsonb,
   'SIFOG-{YYYY}-{SEQ}', 1, 1, 2, true),

  -- 12. TAMINOT_ZAYAVKA (EP-CC-058/059)
  ('TAMINOT_ZAYAVKA', 'Ta''minot zaявkasi', 'Заявка на снабжение',
   'taminot',
   '[
     {"key":"material_name","qUz":"Material nomi","qRu":"Наименование материала","required":true,"type":"text"},
     {"key":"quantity","qUz":"Miqdori","qRu":"Количество","required":true,"type":"number"},
     {"key":"unit","qUz":"O''lchov birligi","qRu":"Единица измерения","required":true,"type":"text"},
     {"key":"order_number","qUz":"Bog''liq buyurtma raqami","qRu":"Связанный номер заказа","required":false,"type":"text"},
     {"key":"needed_by","qUz":"Qachonga kerak (sana/smena)","qRu":"Когда нужно","required":true,"type":"date"},
     {"key":"priority_reason","qUz":"Shoshilinchlik sababi (agar bor)","qRu":"Причина срочности","required":false,"type":"text"}
   ]'::jsonb,
   'TAMZ-{YYYY}-{SEQ}', 4, 2, 6, true),

  -- 13. REJA_QOGOZI (EP-CC-060)
  ('REJA_QOGOZI', 'Reja qog''ozi', 'Рабочий лист плана',
   'rejalashtirish',
   '[
     {"key":"rulon_id","qUz":"Rulon ID (ombor kodidan)","qRu":"ID рулона (из склада)","required":true,"type":"text"},
     {"key":"plan_quantity","qUz":"Reja miqdori (kg/m)","qRu":"Плановое количество (кг/м)","required":true,"type":"number"},
     {"key":"fact_weight","qUz":"Fakt vazn (kg)","qRu":"Фактический вес (кг)","required":true,"type":"number"},
     {"key":"returned_quantity","qUz":"Qaytarilgan miqdor","qRu":"Возвращённое количество","required":true,"type":"number"},
     {"key":"notes","qUz":"Izoh","qRu":"Примечания","required":false,"type":"text"}
   ]'::jsonb,
   'REJQ-{YYYY}-{SEQ}', 4, 2, 6, true),

  -- 14. NAZORAT_VARAKASI (EP-CC-055)
  ('NAZORAT_VARAKASI', 'Nazorat varakasi', 'Контрольный лист',
   'nazorat',
   '[
     {"key":"card_position","qUz":"Lavozim kartasi (tekshiriladigan)","qRu":"Карточка должности (проверяемая)","required":true,"type":"text"},
     {"key":"check_period","qUz":"Tekshiruv davri","qRu":"Период проверки","required":true,"type":"text"},
     {"key":"checklist_items","qUz":"Tekshiruv bandlari (vergul bilan)","qRu":"Пункты проверки","required":true,"type":"text"},
     {"key":"result_summary","qUz":"Umumiy natija (qisqacha)","qRu":"Итоговый результат","required":true,"type":"text"}
   ]'::jsonb,
   'NAZV-{YYYY}-{SEQ}', 24, 18, 48, true)

ON CONFLICT (code) DO UPDATE SET
  name_uz          = EXCLUDED.name_uz,
  name_ru          = EXCLUDED.name_ru,
  category         = EXCLUDED.category,
  ai_questions     = EXCLUDED.ai_questions,
  number_format    = EXCLUDED.number_format,
  inbox_sla_hours  = EXCLUDED.inbox_sla_hours,
  reminder_hours   = EXCLUDED.reminder_hours,
  escalation_hours = EXCLUDED.escalation_hours,
  is_active        = EXCLUDED.is_active;

-- Workflow steps (0008 da allaqachon bor — har vizyon kodi uchun ham qo'shiladi)
-- Eslatma: 0008_cc_workflow_steps_seed.sql da MANAGER_OF_SENDER→CEO zanjiri bor.
-- Har yangi kod uchun xuddi shu pattern qo'shiladi.
INSERT INTO cc_workflow_steps
  (template_id, template_version, step_order, step_type, approver_position_code,
   rejection_stops, time_limit_hours, is_mandatory)
SELECT
  t.id, t.version, s.step_order, 'sequential', s.approver_code,
  s.stops, s.hours, true
FROM cc_document_templates t
CROSS JOIN (VALUES
  (1, 'MANAGER_OF_SENDER', true,  24),
  (2, 'DEPT_HEAD',         false, 48),
  (3, 'CEO',               false, 72),
  (4, 'DIRECTOR',          true, 120)
) AS s(step_order, approver_code, stops, hours)
WHERE t.code IN (
  'ZVS','ZNO','DOKLAD','RASPORYAZHENIE','PRIKAZ','PROTOKOL',
  'UMUMIY_ARIZA','REJA_OZGARTIRISH','SMENA_YAKUNI','ORGPOLITIKA',
  'SIFAT_OGOH','TAMINOT_ZAYAVKA','REJA_QOGOZI','NAZORAT_VARAKASI'
)
  AND t.is_active = true
ON CONFLICT ON CONSTRAINT cc_step_order_uq DO NOTHING;

-- EP-CC-063: ORGPOLITIKA → 5-bosqich (asoschi/founder imzosi — yakuniy darvoza)
-- EGASI QIYMATI KERAK: time_limit_hours va FOUNDER kodi org_functions da
--   kim bo'lishini egasi tasdiqlashi shart (Ayubxon Pozilov — owner).
INSERT INTO cc_workflow_steps
  (template_id, template_version, step_order, step_type, approver_position_code,
   rejection_stops, time_limit_hours, is_mandatory)
SELECT
  t.id, t.version, 5, 'sequential', 'FOUNDER', true, 168, true
  -- time_limit_hours=168 (7 kun) — EGASI QIYMATI KERAK: egasi tasdiqlasin
FROM cc_document_templates t
WHERE t.code = 'ORGPOLITIKA' AND t.is_active = true
ON CONFLICT ON CONSTRAINT cc_step_order_uq DO NOTHING;

-- SIFAT_OGOH uchun maxsus: 15 daqiqa SLA (alohida update)
-- inbox_sla_hours=1 (1 soat = 15 daqiqa qayta belgilash uchun, to'liq cron qo'llab-quvvatlanganda 0.25)
-- Hozircha 1 soat saqlang — EP-CC-051 to'liq real-time cron keyingi fazada.
```

**MUHIM:** Fayl yaratilgandan keyin ISHGA TUSHIRMA. `git add` va commit qilib qo'y.

---

### QADAM 2B: `super_admin`-only template guard — EP-CC-002

**Manba:** EP-CC-002 egasi javob: "faqat super-admin yaratadi/o'zgartiradi, qolganlar ishlatadi."

**Qo'shilishi kerak bo'lgan joy:** CC template-admin endpoint(lar)i (CREATE/UPDATE/DELETE `cc_document_templates`) — bu owned files tashqarisida (controller), lekin service-darajada ham tekshirilishi shart.

**Fayl izolyatsiyasi (Q-23):** `cc-workflow.service.ts` OWNED — shu faylga qo'shimcha kerak.

**`cc-workflow.service.ts` ga `createDraft` ichida template guard qo'sh:**

`createDraft` faqat FOYDALANISH endpointi — foydalanuvchi mavjud template'dan yangi hujjat yaratadi (ruxsatli). Bu yerda guard KERAK EMAS.

Template yaratish/o'zgartirish — boshqa endpoint (admin panel). Lekin service-darajadagi qoida: agar template CREATE/UPDATE service metodi bo'lsa — `@Roles('super_admin')` guard. Bu paketda template admin metodi yo'q (faqat seed SQL orqali) — keyingi fazaga deferral to'g'ri, lekin ESLATMA qo'shish shart.

**`cc-workflow.service.ts` ga yangi private metod — template guard yordamchi:**

```typescript
// cc-workflow.service.ts ichida (agar template-admin metod qo'shilsa)
// EP-CC-002: faqat super_admin template yarata/o'zgartira oladi.
// @Roles('super_admin') guard controller darajasida ham qo'shilishi shart.
// Pattern (template-admin service method uchun):
private assertSuperAdmin(user: { role: string }): void {
  if (user.role !== 'super_admin') {
    throw new ForbiddenException('EP-CC-002: Shablon yaratish faqat super_admin uchun ruxsat etilgan');
  }
}
```

**Seed SQL (0017) da template qo'shish/o'zgartirish ruxsati izoh:**

```sql
-- EP-CC-002: cc_document_templates jadvali faqat super_admin tomonidan
-- application layer orqali o'zgartiriladi. Direct SQL faqat egasi/DBA.
-- Application-layer guard: @Roles('super_admin') controller dekoratori + service assertSuperAdmin() check.
-- EGASI QIYMATI KERAK: template-admin controller yaratilganda bu qoidani eslab qolish shart.
```

**Qabul mezoni (super_admin guard):**
- [ ] `cc-workflow.service.ts` da `assertSuperAdmin` helper metod mavjud (keyingi fazada template-admin method qo'shilganda ishlatilishi uchun)
- [ ] `0017` SQL faylida `EP-CC-002` izoh mavjud

---

### QADAM 3: `0018_cc_phase4_schema.sql` — Phase4 DDL (GATED)

**Fayl (YANGI):** `Uzbek-Language-Module/apps/api/drizzle/0018_cc_phase4_schema.sql`

**Maqsad:** `cc_documents` va `cc_approvals` jadvallariga yangi ustunlar; `cc_audit_trail.code` ustun (agar yo'q bo'lsa).

**Fayl tuzilishi:**
```sql
-- GATED: egasi ruxsati kutilmoqda
-- APPROVED: <ism> <sana>  ← egasi shu qatorni to'ldirgandan keyin run qilish mumkin
-- 0018_cc_phase4_schema.sql
-- Maqsad: EP-CC-016/021/022/042/061 — Phase 4 schema extensions

-- 1. cc_documents yangi ustunlar
ALTER TABLE cc_documents
  ADD COLUMN IF NOT EXISTS responsible_card_id integer REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_until        date,
  ADD COLUMN IF NOT EXISTS series_tag           varchar(40);

-- 2. cc_approvals yangi ustunlar
ALTER TABLE cc_approvals
  ADD COLUMN IF NOT EXISTS basis_document_id uuid REFERENCES cc_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_analysis        jsonb;

-- 3. cc_audit_trail.code — agar yo'q bo'lsa
ALTER TABLE cc_audit_trail
  ADD COLUMN IF NOT EXISTS code varchar(20);

-- 4. Indekslar
CREATE INDEX IF NOT EXISTS cc_doc_card_idx     ON cc_documents(responsible_card_id);
CREATE INDEX IF NOT EXISTS cc_doc_archive_idx  ON cc_documents(archive_until);
CREATE INDEX IF NOT EXISTS cc_doc_series_idx   ON cc_documents(series_tag);
CREATE INDEX IF NOT EXISTS cc_appr_basis_idx   ON cc_approvals(basis_document_id);
CREATE INDEX IF NOT EXISTS cc_audit_code_idx   ON cc_audit_trail(code);

-- 6. DB-DARAJALI IMMUTABILITY — EP-CC-074 (egasi: "tasdiqlangan hujjat/qayd immutable")
-- APPROVED: <ism> <sana>  ← bu trigger ham alohida egasi tasdiqi bilan ishga tushiriladi
--
-- 6a. cc_documents: workflow_state='approved'|'archived' bo'lgan hujjatni UPDATE/DELETE bloklash
-- Faqat ruxsat etilgan ustunlar (basket_state, basket_owner_user_id, archived_at, archive_until)
-- o'zgartirilishi mumkin; asosiy mazmun (subject/ai_body/ai_answers) qulflanadi.
CREATE OR REPLACE FUNCTION cc_documents_immutability_check()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.workflow_state IN ('approved', 'archived') THEN
    -- DELETE taqiqlangan
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'CC-IMMUTABLE: tasdiqlangan/arxivlangan hujjat o''chirilmaydi (EP-CC-074). doc_id=%', OLD.id;
    END IF;
    -- Asosiy mazmun o'zgartirilsa bloklash
    IF TG_OP = 'UPDATE' THEN
      IF OLD.subject      IS DISTINCT FROM NEW.subject     OR
         OLD.ai_body      IS DISTINCT FROM NEW.ai_body     OR
         OLD.ai_answers   IS DISTINCT FROM NEW.ai_answers  OR
         OLD.template_id  IS DISTINCT FROM NEW.template_id OR
         OLD.sender_user_id IS DISTINCT FROM NEW.sender_user_id THEN
        RAISE EXCEPTION 'CC-IMMUTABLE: tasdiqlangan hujjat asosiy maydoni o''zgartirilmaydi (EP-CC-074). doc_id=%', OLD.id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER cc_documents_immutability_tg
  BEFORE UPDATE OR DELETE ON cc_documents
  FOR EACH ROW EXECUTE FUNCTION cc_documents_immutability_check();

-- 6b. cc_audit_trail: APPEND-ONLY (hech qachon UPDATE/DELETE yo'q — EP-CC-074)
CREATE OR REPLACE FUNCTION cc_audit_trail_append_only()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'CC-IMMUTABLE: audit trail yozuvlari o''zgartirilmaydi va o''chirilmaydi (EP-CC-074). id=%', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER cc_audit_trail_append_only_tg
  BEFORE UPDATE OR DELETE ON cc_audit_trail
  FOR EACH ROW EXECUTE FUNCTION cc_audit_trail_append_only();

-- 5. archive_until auto-backfill (approved hujjatlar uchun)
-- EP-CC-016 egasi javob: "lavozim turiga qarab rahbar 10yil / ishchi 3yil"
-- Qoida: BUYRUQ/SIYOSAT turlari (PRIKAZ/ORGPOLITIKA/RASPORYAZHENIE/PROTOKOL) = 10 yil;
--        qolgan barcha tur (ZVS/ZNO/DOKLAD/ARIZA/SMENA/SIFAT/TAMINOT/REJA) = 3 yil.
-- EGASI QIYMATI KERAK: qaysi template kodi "rahbar-darajali" hujjat sanalishini
--   egasi tasdiqlashi shart. Hozir texnik mantiq bo'yicha (category='buyruq' OR 'siyosat') qo'llaniladi.
UPDATE cc_documents d
SET archive_until = (
  d.created_at + CASE
    WHEN t.category IN ('buyruq', 'siyosat')
      THEN INTERVAL '10 years'   -- PRIKAZ/ORGPOLITIKA/RASPORYAZHENIE/PROTOKOL
    ELSE INTERVAL '3 years'       -- ZVS/ZNO/DOKLAD/ARIZA/SMENA va boshqalar
  END
)::date
FROM cc_document_templates t
WHERE d.template_id = t.id
  AND d.workflow_state = 'approved'
  AND d.archive_until IS NULL;
```

**MUHIM:** Fayl yaratilgandan keyin ISHGA TUSHIRMA. `git add` va commit.

---

### QADAM 4: Op-code logging — `cc-workflow.service.ts`

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-workflow.service.ts`

**Maqsad:** Har asosiy operatsiyaga `EP-CC-###` op-code logging qo'sh. `this.logger` allaqachon mavjud (qator 35). `cc_audit_trail` raw SQL orqali yoziladi (xuddi write.repo kabi pattern).

**Op-code xaritasi (CC vizyon hujjatidan):**

| Metod | Op-code | Ma'no |
|---|---|---|
| `createDraft` | `EP-CC-031` | Qoralama yaratildi |
| `sendDocument` | `EP-CC-001` | Hujjat yuborildi |
| `approve` (muvaffaqiyatli) | `EP-CC-007` | PIN-sign + tasdiqlash |
| `reject` | `EP-CC-009` | Rad etish |
| `resubmit` | `EP-CC-009R` | Qayta yuborish |
| `cancel` | `EP-CC-016C` | Bekor qilish |
| `createComplaint` | `EP-CC-038` | Shikoyat |
| `logPrint` | `EP-CC-018P` | Chop etish |

**Pattern (har metodga qo'shiladi):**

```typescript
// cc-workflow.service.ts ichida yangi private helper metod qo'sh:

private logOpCode(args: {
  code:       string;
  actorId:    number;
  docId:      string;
  extra?:     string;
}): void {
  this.logger.log(
    `level=info code=${args.code} actor_id=${args.actorId} doc_id=${args.docId}${args.extra ? ' ' + args.extra : ''}`,
  );
}
```

**`createDraft` metodiga qo'sh (qator 71 dan keyin, `return created` dan oldin):**

```typescript
// OLDIN (qator 69–71):
    const created = unwrapOrThrow(await this.docs.createDraft({ ... }));
    return created;

// KEYIN:
    const created = unwrapOrThrow(await this.docs.createDraft({ ... }));
    this.logOpCode({ code: 'EP-CC-031', actorId: senderUserId, docId: created.id, extra: `tmpl_id=${dto.templateId}` });
    return created;
```

**`sendDocument` metodiga qo'sh (qator 96, `return` dan oldin):**

```typescript
// OLDIN (qator 95–96):
    await this.transitionToFirstStep(doc, senderUserId, approvers[0], firstStepOrder);
    return { ok: true, documentId: doc.id, currentStepOrder: firstStepOrder, pendingApproverIds: approvers };

// KEYIN:
    await this.transitionToFirstStep(doc, senderUserId, approvers[0], firstStepOrder);
    this.logOpCode({ code: 'EP-CC-001', actorId: senderUserId, docId: doc.id, extra: `step=${firstStepOrder} approvers=${approvers.join(',')}` });
    return { ok: true, documentId: doc.id, currentStepOrder: firstStepOrder, pendingApproverIds: approvers };
```

**`approve` metodiga qo'sh (qator 164 dan keyin, `return` dan oldin):**

```typescript
    const result = executeApproveTransaction( ... );
    this.logOpCode({ code: 'EP-CC-007', actorId: approverUserId, docId: documentId, extra: `approval_id=${mine.id}` });
    return result;
```

**`reject` metodiga qo'sh (qator 183 dan keyin):**

```typescript
    // ...
    this.logOpCode({ code: 'EP-CC-009', actorId: approverUserId, docId: documentId, extra: `stops=${mine.rejectionStops}` });
    return { ok: true, status: 'finalized_rejected' };
```

**`resubmit` metodiga qo'sh:**

```typescript
    // sendDocument chaqiruvidan keyin:
    this.logOpCode({ code: 'EP-CC-009R', actorId: senderUserId, docId: documentId });
```

**`cancel` metodiga qo'sh:**

```typescript
    // return { ok: true } dan oldin:
    this.logOpCode({ code: 'EP-CC-016C', actorId: senderUserId, docId: documentId });
```

**`createComplaint` metodiga qo'sh:**

```typescript
    this.logOpCode({ code: 'EP-CC-038', actorId: complainantUserId, docId: documentId });
```

**`logPrint` metodiga qo'sh:**

```typescript
    this.logOpCode({ code: 'EP-CC-018P', actorId: printedByUserId, docId: documentId });
```

---

### QADAM 5: Op-code logging — `cc-baskets.service.ts`

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-baskets.service.ts`

**Hozirgi holat (qator 1–34):** `Logger` yo'q umuman. Qo'sh:

**Oldin (qator 10–11):**
```typescript
import { Injectable } from '@nestjs/common';
import { CcBasketsRepository } from '../infrastructure/repositories/cc-baskets.repo';
```

**Keyin:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { CcBasketsRepository } from '../infrastructure/repositories/cc-baskets.repo';
```

**Sinf ichida:**
```typescript
@Injectable()
export class CcBasketsService {
  private readonly logger = new Logger(CcBasketsService.name);
  // ... (qolgan kod o'zgarishsiz)
```

**`move` metodiga qo'sh (qator 28 oldidan):**
```typescript
  async move(documentId: string, actorUserId: number, toBasket: BasketState, note?: string) {
    this.logger.log(`level=info code=EP-CC-012 actor_id=${actorUserId} doc_id=${documentId} to_basket=${toBasket}`);
    return unwrapOrThrow(await this.repo.moveBasket(documentId, actorUserId, toBasket, note));
  }
```

**Op-code xaritasi:**
| Metod | Op-code |
|---|---|
| `move` | `EP-CC-012` (basket harakati) |
| `getOne` | log shart emas (read-only) |

---

### QADAM 6: Op-code logging — `cc-sla.cron.ts`

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/communication-center/cron/cc-sla.cron.ts`

**Hozirgi holat:** `Logger` mavjud (qator 29), lekin EP-CC kod yo'q. Har cron natijasiga kod qo'sh:

**`markInboxOverdue` oxirida (qator 77–80 da `r.rows.length` check bor, o'sha yerga qo'sh):**

```typescript
// OLDIN (qator 77–80):
    if (r.rows.length > 0) {
      this.logger.warn(`Inbox SLA: ${r.rows.length} hujjat muddati o'tdi`);

// KEYIN:
    if (r.rows.length > 0) {
      this.logger.warn(`level=warn code=EP-CC-013 count=${r.rows.length} event=inbox_overdue`);
```

**`autoRejectOverdue48h` oxirida (qator topib o'sha yerga):**

```typescript
    this.logger.warn(`level=warn code=EP-CC-010 count=${rejectedCount} event=auto_reject_48h`);
```

**`escalateApprovals` oxirida:**

```typescript
    this.logger.log(`level=info code=EP-CC-010E count=${escalatedCount} event=escalate_approvals`);
```

**`expireDelegations` oxirida:**

```typescript
    this.logger.log(`level=info code=EP-CC-036D count=${expiredCount} event=expire_delegations`);
```

**`spawnRecurringDocuments` (no-op stub — saqlanadi, lekin log qo'shiladi):**

```typescript
  private async spawnRecurringDocuments(): Promise<void> {
    // STUB: hozir hech narsa qilmaydi; placeholder.
    // EP-CC-066 recurring monthly cron keyingi fazada to'liq amalga oshiriladi.
    this.logger.log('level=info code=EP-CC-066 event=spawn_recurring_noop');
  }
```

---

### QADAM 7: Op-code logging — `cc-ai-interview.service.ts`

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-ai-interview.service.ts`

**Maqsad:** `start`, `answer`, `finalize` metodlarida EP-CC-003/004 log qo'sh.

**`start` metodiga (qator 74 — return dan oldin):**
```typescript
    this.logger.log(`level=info code=EP-CC-003 actor_id=${args.userId} tmpl_id=${args.templateId} session_id=${sessionId}`);
    return { sessionId, question: q, total: questions.length };
```

**`finalize` metodiga (hujjat qoralama sifatida saqlanganida):**
```typescript
    this.logger.log(`level=info code=EP-CC-004 actor_id=${userId} session_id=${sessionId} doc_id=${draftDocId}`);
```

**Fallback (AI unavailable) holatiga:**
```typescript
    this.logger.warn(`level=warn code=EP-CC-004F actor_id=${userId} event=ai_fallback_manual`);
```

---

### QADAM 8: Op-code logging — `cc-event.listener.ts`

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/communication-center/events/cc-event.listener.ts`

**Maqsad:** `handle` metodida `EP-CC-014` (cascade spawn) log qo'sh.

**Qator 75 da (draftR muvaffaqiyatli bo'lgandan keyin):**
```typescript
    // OLDIN (qator ~75, draft yaratilgandan keyin):
    if (!isOk(draftR)) { ... }

    // KEYIN — muvaffaqiyatli draft yaratilgandan so'ng:
    this.logger.log(`level=info code=EP-CC-014 event=cc_spawn_draft actor_id=${payload.senderUserId} doc_id=${draftR.data.id} tmpl=${payload.templateCode}`);
```

**`autoSend=true` stub warning log (qator 141–145):**
```typescript
    // OLDIN: this.logger.warn(`tizim PIN'i mexanizmi keyingi versiyada`);
    // KEYIN:
    this.logger.warn(`level=warn code=EP-CC-014A event=autosend_deferred doc_id=${draftR.data.id} reason=system_pin_not_implemented`);
```

---

### QADAM 9: `cc-documents-write.repo.ts` — `createDraft` `responsible_card_id` / `series_tag` qo'llab-quvvatlash

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-write.repo.ts`

**Maqsad:** Phase4 ustunlari DDL orqali qo'shilgandan keyin, `createDraft` INSERT'i ham ulangan bo'lishi uchun `CreateDraftInput` va INSERT ni kengaytir. DDL hali gated bo'lgani uchun — optional pattern ishlatiladi.

**`types.ts` da `CreateDraftInput` ga optional maydonlar qo'sh (Qadam 1 ni to'ldiradi):**
```typescript
export interface CreateDraftInput {
  templateId:         string;
  senderUserId:       number;
  subject:            string;
  aiBody:             string;
  aiAnswers:          Record<string, unknown>;
  senderComment:      string | null;
  priority:           Priority;
  language:           Language;
  branchId:           string | null;
  documentNumber:     string;
  templateVersion:    number;
  // Phase4 optional (DDL 0018 tayyor bo'lganda to'ldiriladi)
  responsibleCardId?: number | null;
  seriesTag?:         string | null;
}
```

**`cc-documents-write.repo.ts` da `createDraft` INSERT ni o'zgartir (qator 32–57):**

INSERT faqat ustun mavjud bo'lganda qo'shadi — avval ustun mavjudligini runtime'da tekshirish o'rniga, optional ustunlar faqat `input.responsibleCardId != null` bo'lganda kiritiladi.

```typescript
  async createDraft(input: CreateDraftInput): Promise<Result<DocumentRow>> {
    try {
      // NOTE: responsible_card_id va series_tag — Phase4 DDL (0018) tayyor bo'lganda faol bo'ladi.
      // Hozircha conditional INSERT: ustun bo'lmasa xato chiqarmaslik uchun faqat value bor holatda.
      // XAVF: 0018 ishga tushirilgunga qadar bu maydonlar INSERT'dan tashqarida qoladi — to'g'ri xatti-harakat.
      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_documents (
          document_number, template_id, template_version, sender_user_id, branch_id,
          basket_state, basket_owner_user_id, basket_entered_at,
          workflow_state, current_step_order,
          subject, ai_body, ai_answers, sender_comment, priority, language
        )
        VALUES (
          ${input.documentNumber}, ${input.templateId}, ${input.templateVersion},
          ${input.senderUserId}, ${input.branchId},
          'outbox', ${input.senderUserId}, NOW(),
          'draft', 0,
          ${input.subject}, ${input.aiBody}, ${JSON.stringify(input.aiAnswers)}::jsonb,
          ${input.senderComment}, ${input.priority}, ${input.language}
        )
        RETURNING id::text AS id
      `);
      const insertedRow = r.rows[0];
      if (!insertedRow) return Err({ message: 'Qoralama yaratilmadi', code: 'DB_ERROR' });

      // Phase4 ustunlar mavjud bo'lsa alohida UPDATE (optional, silently skip if col missing)
      if (input.responsibleCardId != null || input.seriesTag != null) {
        try {
          await runQuery(sql`
            UPDATE cc_documents
            SET
              responsible_card_id = ${input.responsibleCardId ?? null},
              series_tag          = ${input.seriesTag ?? null}
            WHERE id = ${insertedRow.id}
          `);
        } catch {
          // DDL hali ishga tushirilmagan — ustun yo'q; silent skip (log faqat)
          this.logger.warn(`createDraft: Phase4 cols update skipped (DDL gated) for doc ${insertedRow.id}`);
        }
      }

      const created = await this.reader.getById(insertedRow.id);
      if (!created.ok) return Err(created.error);
      if (!created.data) return Err({ message: "Yaratilgan qoralamani o'qib bo'lmadi", code: 'DB_ERROR' });
      return Ok(created.data);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
```

---

### QADAM 10: `DocumentDetailModal.tsx` — causality (basis_document_id) bo'limi + approvals ko'rinishi

**Fayl:** `Uzbek-Language-Module/artifacts/erp-dashboard/src/components/cc/DocumentDetailModal.tsx`

**Hozirgi holat (qator 1–145):** `DocumentDetail` interfeysi approvals ma'lumotini o'z ichiga olmaydi; modal faqat `aiBody` va `senderComment` ko'rsatadi. Approvals bo'limi, shu jumladan `basis_document_id` (causality) ko'rinmaydi.

**Maqsad:**
1. `DocumentDetail` interfeysiga `approvals` array qo'sh
2. Approvals bo'limi render qil (har approval uchun: approver nomi, holat, imzo vaqti, **basis_document_id**)
3. `basis_document_id` mavjud bo'lsa link ko'rsat (click = boshqa hujjat modalini ochadi)

**Qadam 10.1 — Interfeys kengaytir (qator 7–28 ga qo'shish):**

```typescript
interface ApprovalDetail {
  id:               string;
  stepOrder:        number;
  approverName:     string | null;
  state:            string;
  comment:          string | null;
  signedAt:         string | null;
  deadlineAt:       string | null;
  // Phase4 (DDL 0018 tayyor bo'lgandan keyin to'ldiriladi — optional)
  basisDocumentId:  string | null;
  basisDocNumber:   string | null;   // join bilan olinadi
}

interface DocumentDetail {
  id:             string;
  documentNumber: string;
  subject:        string;
  templateCode:   string;
  templateNameUz: string;
  priority:       'low' | 'normal' | 'high' | 'urgent';
  language:       'uz' | 'ru';
  basketState:    string;
  workflowState:  string;
  isInboxOverdue: boolean;
  senderName:     string | null;
  basketEnteredAt: string;
  createdAt:      string;
  // Approvals (CC baskets GET /api/cc/baskets/:id dan keladi, yoki alohida endpoint)
  approvals?:     ApprovalDetail[];
}
```

**Qadam 10.2 — `DocumentDetailModal` funksiyasiga approvals bo'limi qo'sh (qator 120 dan keyin, `</ScrollArea>` dan oldin):**

```tsx
// Hozirgi qator 101–121:
<ScrollArea className="flex-1 p-4">
  {bodyQ.isLoading ? (
    <EPLoader className="mx-auto" />
  ) : (
    <div className="space-y-4">
      <Section title="AI tayyorlagan matn" icon={<FileText size={14} />}>
        ...
      </Section>
      {bodyQ.data?.senderComment && (
        <Section title={t("yuboruvchiIzohi")}>
          ...
        </Section>
      )}
      {/* YANGI: Approvals bo'limi */}
      {(doc?.approvals ?? []).length > 0 && (
        <Section title="Tasdiqlash zanjiri">
          <div className="space-y-2">
            {(doc!.approvals!).map((appr) => (
              <div key={appr.id}
                   className="rounded-lg border bg-muted/20 p-3 text-sm flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {appr.stepOrder}. {appr.approverName ?? "Noma'lum"}
                  </span>
                  <Tag
                    tone={APPROVAL_STATE[appr.state]?.tone ?? "bg-slate-100 text-slate-700 border-slate-200"}
                    label={APPROVAL_STATE[appr.state]?.uz ?? appr.state}
                  />
                </div>
                {appr.signedAt && (
                  <span className="text-xs text-muted-foreground">
                    🕒 {new Date(appr.signedAt).toLocaleString('uz-UZ')}
                  </span>
                )}
                {appr.comment && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    💬 {appr.comment}
                  </span>
                )}
                {/* EP-CC-042: Causality — asos hujjat */}
                {appr.basisDocumentId && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-slate-600">Asos:</span>
                    <button
                      className="font-mono underline text-[var(--ep-blue)] hover:opacity-80"
                      onClick={() => onOpenChange(false)}
                      title={`Asos hujjatni ko'rish: ${appr.basisDocNumber ?? appr.basisDocumentId}`}
                    >
                      {appr.basisDocNumber ?? appr.basisDocumentId.slice(0, 8) + '…'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )}
</ScrollArea>
```

**Qadam 10.3 — `APPROVAL_STATE` konstantasi qo'sh (qator 38 dan keyin, `PRIORITY` dan oldin):**

```typescript
const APPROVAL_STATE: Record<string, { uz: string; tone: string }> = {
  pending:   { uz: "Kutilmoqda",    tone: "bg-amber-50 text-[var(--ep-yellow)] border-amber-200" },
  approved:  { uz: "Tasdiqlandi",   tone: "bg-emerald-50 text-[var(--ep-green)] border-emerald-200" },
  rejected:  { uz: "Rad etildi",    tone: "bg-red-50 text-[var(--ep-red)] border-red-200" },
  delegated: { uz: "Topshirildi",   tone: "bg-blue-50 text-[var(--ep-blue)] border-blue-200" },
  escalated: { uz: "Eskalatsilandi",tone: "bg-purple-50 text-purple-700 border-purple-200" },
};
```

**Eslatma:** `approvals` ma'lumoti `/api/cc/baskets/:id` endpoint'idan kelishi kerak. Agar BE hozir approvals ni shu endpoint'dan qaytarmasa — `DocumentDetailModal` ichida alohida `useQuery` qo'sh:

```typescript
// qator 59 dan keyin:
const approvalsQ = useQuery<{ approvals: ApprovalDetail[] }>({
  queryKey: [`/api/cc/documents/${documentId}/approvals`],
  queryFn: () => apiRequest<{ approvals: ApprovalDetail[] }>(
    "GET", `/api/cc/documents/${documentId}/approvals`
  ),
  enabled: open && !!documentId,
});
```

Agar `/api/cc/documents/:id/approvals` endpoint yo'q bo'lsa — **TO'XTA, egasiga flag qil**: bu owned file tashqarisidagi controller'ga endi yangi endpoint kerak (Q-23 izolyatsiya).

**Q-23 flag:** `cc-documents.controller.ts` OWNED FILE emas. Agar approvals endpoint qo'shish kerak bo'lsa, egasi rozilik bersin. Alternativ: `/api/cc/baskets/:id` existing endpoint'dan approvals ham qaytarilsin — bu `cc-baskets.repo.ts` da o'zgarish talab qiladi (ham OWNED FILE emas). Bajaruvchi shu qarorni egasiga ko'rsatib, "qaysi yo'l?" deb so'raydi.

---

## 5. DDL (GATED)

### 5.1 `0017_cc_vision_templates_seed.sql`

```sql
-- GATED: egasi ruxsati kutilmoqda. ISHGA TUSHIRMA.
-- APPROVED: <egasi_ism> <sana>
--
-- Migratsiya raqamini tasdiqlash:
--   SELECT MAX(version) FROM drizzle.__drizzle_migrations; -- yoki ls apps/api/drizzle/
-- Agar 0017 band bo'lsa, keyingi erkin raqam ishlatilsin.
--
-- Maqsad: EP-CC-019 — Eski HR-oriented 14 template → zavod-spetsifik 14 vizyon turi
--
-- [TO'LIQ MATN QADAM 2 DA — yuqorida ko'rsatildi]
```

**Egasi tasdiqlash jarayoni:**
1. Bajaruvchi faylni yozadi, commit qiladi
2. Egasiga ko'rsatadi: "Bu 14 ta vizyon hujjat turi. Eski HR templatelar `is_active=false` bo'ladi. Tasdiqlaysizmi?"
3. Egasi: "Ha, ishga tushir" → `-- APPROVED: AyubxonP 2026-06-XX` qo'shiladi → `psql < 0017_cc_vision_templates_seed.sql`
4. Verify: `SELECT code, name_uz, is_active FROM cc_document_templates ORDER BY is_active DESC, code;`

### 5.2 `0018_cc_phase4_schema.sql`

```sql
-- GATED: egasi ruxsati kutilmoqda. ISHGA TUSHIRMA.
-- APPROVED: <egasi_ism> <sana>
--
-- Maqsad: Phase4 DDL
--   cc_documents: +responsible_card_id, +archive_until, +series_tag
--   cc_approvals: +basis_document_id, +ai_analysis
--   cc_audit_trail: +code (agar yo'q)
--
-- [TO'LIQ MATN QADAM 3 DA — yuqorida ko'rsatildi]
```

**Egasi tasdiqlash jarayoni:**
1. Faylni yozadi, commit qiladi
2. Egasiga: "Phase4 schema ALTER TABLE. `cc_documents` ga 3 ta ustun, `cc_approvals` ga 2 ta ustun. Tasdiqlaysizmi?"
3. Egasi "ha" → APPROVED → run

**Ruxsatsiz ishga tushirish taqiqlangan (Q-35).**

---

## 6. QABUL MEZONI

### Tekshiruv ro'yxati (har biri ✅ bo'lishi kerak)

- [ ] **BE tsc 0:** `pnpm --filter @europrint/api run tsc --noEmit` — 0 xato
- [ ] **FE tsc 0:** `pnpm --filter erp-dashboard run tsc --noEmit` — 0 xato
- [ ] **`types.ts`:** `DocumentRow` da `responsibleCardId/archiveUntil/seriesTag` mavjud; `ApprovalRow` interfeysi mavjud; `CreateDraftInput` da `responsibleCardId?/seriesTag?` mavjud
- [ ] **Op-code log — cc-workflow.service.ts:** `this.logOpCode({code: 'EP-CC-031', ...})` `createDraft` ichida bor; xuddi shunday boshqa 7 ta metod
- [ ] **Op-code log — cc-baskets.service.ts:** `Logger` mavjud; `move` da `EP-CC-012` log bor
- [ ] **Op-code log — cc-sla.cron.ts:** har cron funksiyasida `EP-CC-###` log bor
- [ ] **Op-code log — cc-ai-interview.service.ts:** `start`/`finalize` da `EP-CC-003`/`EP-CC-004` log bor
- [ ] **Op-code log — cc-event.listener.ts:** `handle` da `EP-CC-014` log bor; autoSend stub da `EP-CC-014A` log bor
- [ ] **DDL fayllari mavjud (gated):** `0017_cc_vision_templates_seed.sql` va `0018_cc_phase4_schema.sql` repoda bor; har biri `-- GATED` bilan boshlanadi; `psql` bilan ishga tushirilmagan
- [ ] **`DocumentDetailModal.tsx`:** `ApprovalDetail` interfeysi mavjud; approvals loop render qiladi; `basisDocumentId` mavjud bo'lsa "Asos:" bo'limi ko'rsatadi; `APPROVAL_STATE` konstanta bor
- [ ] **Regressiya yo'q:** avval ishlagan CC funksiyalar (createDraft/send/approve/reject/cancel) hali ham ishlaydi
- [ ] **Reviewer:** `bash scripts/reviewer-result-pattern.sh` — 0 yangi FAIL
- [ ] **DB-proof (DDL gated bo'lsa, code-proof):** `grep -r 'EP-CC-' apps/api/src/modules/communication-center/ | grep -c logOpCode` → ≥ 8 ta qaytaradi
- [ ] **FE tsc:** `DocumentDetailModal.tsx` importlari buzilmagan; `ApprovalDetail` type to'g'ri ishlatilgan
- [ ] **[YANGI — Gap 1] Immutability trigger:** `0018_cc_phase4_schema.sql` da `cc_documents_immutability_check` trigger funksiyasi va `cc_audit_trail_append_only` trigger funksiyasi mavjud (EP-CC-074)
- [ ] **[YANGI — Gap 3] Arxiv muddati 10yr/3yr:** `0018_cc_phase4_schema.sql` da `archive_until` backfill SQL `category IN ('buyruq','siyosat') → 10 yil, qolganlar → 3 yil` mantig'i bilan yozilgan (EP-CC-016); bitta 3-yil blanket YO'Q
- [ ] **[YANGI — Gap 4] super_admin template guard:** `cc-workflow.service.ts` da `assertSuperAdmin` helper metod mavjud; `0017` SQL da `EP-CC-002` izoh mavjud (EP-CC-002)

### Golden-thread regressiya tekshiruvi

CC moduli oltin zanjirga to'g'ridan kirmasligi mumkin (SD→PP→MES→QC→WMS→FIN), lekin `CcSpawnRequestedEvent` boshqa modullar chiqaradi — shu event listener'lar hali ishlashini tekshir:

```bash
# cc-event.listener.ts compile bo'lishi
pnpm --filter @europrint/api run tsc --noEmit 2>&1 | grep -i 'cc-event'
# Natija: xato yo'q bo'lishi kerak
```

---

## 7. SELF-VERIFY

### Qadam 7.1 — BE tsc

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api run tsc --noEmit 2>&1 | tail -20
# Natija: 0 xato
```

### Qadam 7.2 — FE tsc

```bash
pnpm --filter erp-dashboard run tsc --noEmit 2>&1 | tail -20
# Natija: 0 xato
```

### Qadam 7.3 — Op-code loglar mavjudligi

```bash
# Barcha EP-CC-### loglarni sanash
grep -rn "EP-CC-" Uzbek-Language-Module/apps/api/src/modules/communication-center/application/ \
  | grep -v ".js" | grep "logOpCode\|logger.log\|logger.warn"
# Kutilayotgan natija:
#   cc-workflow.service.ts: EP-CC-031, EP-CC-001, EP-CC-007, EP-CC-009, EP-CC-009R, EP-CC-016C, EP-CC-038, EP-CC-018P
#   cc-baskets.service.ts: EP-CC-012
#   cc-ai-interview.service.ts: EP-CC-003, EP-CC-004, EP-CC-004F
```

```bash
grep -rn "EP-CC-" Uzbek-Language-Module/apps/api/src/modules/communication-center/cron/ | grep -v ".js"
# Kutilayotgan: EP-CC-013, EP-CC-010, EP-CC-010E, EP-CC-036D, EP-CC-066
```

```bash
grep -rn "EP-CC-" Uzbek-Language-Module/apps/api/src/modules/communication-center/events/ | grep -v ".js"
# Kutilayotgan: EP-CC-014, EP-CC-014A
```

### Qadam 7.4 — DDL fayllari mavjud va gated

```bash
ls -la Uzbek-Language-Module/apps/api/drizzle/ | grep -E "001[7-8]_cc"
# Kutilayotgan:
#   0017_cc_vision_templates_seed.sql
#   0018_cc_phase4_schema.sql
```

```bash
head -3 Uzbek-Language-Module/apps/api/drizzle/0017_cc_vision_templates_seed.sql
# Kutilayotgan:
#   -- GATED: egasi ruxsati kutilmoqda
#   -- APPROVED: <ism> <sana>
#   -- 0017_cc_vision_templates_seed.sql
```

### Qadam 7.5 — Template seed mazmun tekshiruvi (DDL gated bo'lsa — kod orqali)

```bash
# 14 ta vizyon kodi bor ekanligini SQL fayldan tekshir
grep "^  '.*'," Uzbek-Language-Module/apps/api/drizzle/0017_cc_vision_templates_seed.sql | wc -l
# Kutilayotgan: 14 (yoki 14 ga yaqin — har template bloki 1 ta code'dan boshlanadi)
```

**DDL ishga tushirilgandan keyin (egasi ruxsatidan keyin):**
```sql
-- DB proof:
SELECT code, name_uz, is_active, inbox_sla_hours
FROM cc_document_templates
ORDER BY is_active DESC, code;
-- Natija: 14 ta is_active=true (yangi vizyon), 14 ta is_active=false (eski HR)

SELECT count(*) FROM cc_document_templates WHERE is_active = true;
-- Natija: 14
```

### Qadam 7.6 — FE causality bo'limi

```bash
grep -n "basisDocumentId\|APPROVAL_STATE\|ApprovalDetail" \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/components/cc/DocumentDetailModal.tsx
# Kutilayotgan: har uch narsa topiladi, 0 xato
```

### Qadam 7.7 — types.ts yangi maydonlar

```bash
grep -n "responsibleCardId\|archiveUntil\|seriesTag\|basisDocumentId\|aiAnalysis" \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/types.ts
# Kutilayotgan: har maydon topiladi
```

### Qadam 7.8 — Reviewer skriptlar

```bash
bash Uzbek-Language-Module/scripts/reviewer-result-pattern.sh 2>&1 | tail -5
# Kutilayotgan: FAIL: 0 (yoki avvalgi holat bilan bir xil)

bash Uzbek-Language-Module/scripts/reviewer-array-safety.sh 2>&1 | tail -5
# Kutilayotgan: FAIL: 0
```

---

## 8. COMMIT

**MUHIM:** `git add -A` yoki `git add .` TAQIQ. Faqat owned fayllar.

### Commit 1: types + op-code logging (no-DDL o'zgarishlar)

```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/types.ts \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-workflow.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-baskets.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-ai-interview.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/cron/cc-sla.cron.ts \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/events/cc-event.listener.ts \
  Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-write.repo.ts

git commit -m "feat(cc): EP-CC-### op-code logging across all CC services + Phase4 type extensions (P37)"
```

### Commit 2: DDL migrations (gated)

```bash
git add \
  Uzbek-Language-Module/apps/api/drizzle/0017_cc_vision_templates_seed.sql \
  Uzbek-Language-Module/apps/api/drizzle/0018_cc_phase4_schema.sql

git commit -m "feat(cc): GATED DDL — 14 vision templates seed (0017) + Phase4 schema + immutability trigger + 10yr/3yr archive (0018) (P37, EP-CC-016/019/021/022/042/061/074)"
```

### Commit 3: FE causality

```bash
git add \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/components/cc/DocumentDetailModal.tsx

git commit -m "feat(cc/fe): DocumentDetailModal — approvals chain + EP-CC-042 causality field (P37)"
```

---

## HOLAT HISOBOTI SHABLONI

Har bosqich tugagach egasiga (Uzbek):

```
P37 holat hisoboti — [sana]

Bajarildi:
✅ types.ts — DocumentRow/TemplateRow/ApprovalRow yangi maydonlar
✅ cc-workflow.service.ts — 8 ta EP-CC-### op-code log (031/001/007/009/009R/016C/038/018P) + assertSuperAdmin helper (EP-CC-002)
✅ cc-baskets.service.ts — Logger + EP-CC-012
✅ cc-sla.cron.ts — 4 ta EP-CC log
✅ cc-ai-interview.service.ts — EP-CC-003/004/004F
✅ cc-event.listener.ts — EP-CC-014/014A
✅ cc-documents-write.repo.ts — Phase4 optional ustunlar
✅ 0017_cc_vision_templates_seed.sql — GATED (14 vizyon turi + EP-CC-002 izoh)
✅ 0018_cc_phase4_schema.sql — GATED (ALTER TABLE + immutability trigger EP-CC-074 + 10yr/3yr arxiv EP-CC-016)
✅ DocumentDetailModal.tsx — approvals + causality bo'limi
✅ BE tsc 0
✅ FE tsc 0
✅ reviewer-result-pattern FAIL: 0

Kutilmoqda (egasi ruxsati):
⏳ 0017 ishga tushirish — "14 vizyon template tasdiqlaysizmi?"
⏳ 0018 ishga tushirish — "cc_documents/cc_approvals Phase4 ustunlar tasdiqlaysizmi?"

Flags (owned file tashqarisi — Q-23):
⚠️ /api/cc/documents/:id/approvals endpoint kerak (cc-documents.controller.ts — owned emas) — causality FE to'liq ishlashi uchun
⚠️ cc-baskets.repo.ts getById approvals ni ham qaytarishi kerak — owned emas
```

---

## EDGE CASES (muhim)

### EC-1: Eski template'larga bog'liq hujjatlar

`0017` migratsiyasi eski template'larni `is_active=false` qiladi, LEKIN ularni DELETE qilmaydi. `cc_documents` jadvalida eski template FK'lar hali ishlaydi. Eski template'larga tegishli `ADVANCE/VACATION/...` hujjatlar ko'rish/approve/reject/cancel mumkin bo'lib qoladi — bu to'g'ri. Faqat yangi hujjat yaratish uchun ular tanlab bo'lmaydi (`is_active=false` filter).

### EC-2: `0017` da workflow steps ON CONFLICT

`cc_step_order_uq` constraint = `(template_id, template_version, step_order, approver_position_code)`. Agar eski template'lar uchun steps allaqachon bor bo'lsa, yangi vizyon template'lar uchun `ON CONFLICT DO NOTHING` xavfsiz ishlaydi.

### EC-3: `responsible_card_id` FK `org_functions(id)` ga

`org_functions` jadval `Uzbek-Language-Module/apps/api/drizzle/` da mavjud (ORG modulidan). `0018` GATED — ishga tushirishdan oldin `org_functions` jadval DB'da borligini tekshir:
```sql
SELECT count(*) FROM org_functions;
```
Agar `org_functions` yo'q bo'lsa — `0018`'da FK o'rniga `DEFERRABLE INITIALLY DEFERRED` ishlatilsin yoki FK `-- SKIP` qilib qo'yilsin (egasiga flag).

### EC-4: `DocumentDetailModal` approvals endpoint yo'q

Agar `/api/cc/documents/:id/approvals` endpoint mavjud bo'lmasa, FE `useQuery` 404 qaytaradi — bu `DocumentDetailModal` crash qilmasligi kerak. `enabled: open && !!documentId` + `{ approvals: [] }` fallback ishlatiladi, ya'ni approvals bo'limi shunchaki ko'rsatilmaydi. Bu to'g'ri xatti-harakat.

### EC-5: Op-code log formati

`level=info code=EP-CC-031 actor_id=5 doc_id=uuid-xxx` — bu **NestJS Logger** string sifatida yoziladi. Agar keyinchalik JSON log shakliga o'tilsa, parser shu formatni ajrata oladi (key=value pattern). Hozircha string format — production'ga chiqishga yetarli.

### EC-6: `series_tag` ORGPOLITIKA uchun

`orgpolitika` hujjatlarda `series_tag` = kategoriya (masalan `"ISHLAB_CHIQARISH"`, `"XAVFSIZLIK"`, va hokazo). Bu maydoni to'ldirish Phase4 UX'ining bir qismi — hozir faqat DB column qo'shiladi, UI (dropdown) keyingi fazada.

### EC-7: `SIFAT_OGOH` — 1 soatlik SLA muammo

Vision bo'yicha `sifat_ogoh` uchun 15 daqiqa SLA (EP-CC-051). Lekin `cc_document_templates.inbox_sla_hours` integer (soat). `1` soat — to'g'ridan-to'g'ri 15 daqiqa emas. Hozircha `1` saqlash kerak. EP-CC-051 to'liq real-time cron (minute-level) keyingi fazada (SLA cron alohida paket). `inbox_sla_hours=1` + seed'da `-- NOTE: EP-CC-051 15min → keyingi fazada fractional support` izoh qo'shilsin.

---

## APPENDIX: CC AUDIT TRAIL CODE XARITASI (to'liq)

Quyidagi jadval `cc_audit_trail.code` ustuniga yoziladigan barcha EP-CC kodlarni ko'rsatadi. Bu P37 izolyatsiyasidan tashqari bo'lgan kodlar ham ko'rsatilgan (boshqa fazalar/paketlar uchun — reference sifatida):

| Kod | Manba | Ma'no |
|---|---|---|
| `EP-CC-001` | cc-workflow.service.ts | Hujjat yuborildi |
| `EP-CC-003` | cc-ai-interview.service.ts | AI intervyu boshlandi |
| `EP-CC-004` | cc-ai-interview.service.ts | AI qoralama yaratildi |
| `EP-CC-004F` | cc-ai-interview.service.ts | AI fallback (manual) |
| `EP-CC-007` | cc-workflow.service.ts | PIN-sign + tasdiqlash |
| `EP-CC-009` | cc-workflow.service.ts | Rad etish |
| `EP-CC-009R` | cc-workflow.service.ts | Qayta yuborish |
| `EP-CC-010` | cc-sla.cron.ts | 48h auto-reject |
| `EP-CC-010E` | cc-sla.cron.ts | Eskalatsiya |
| `EP-CC-012` | cc-baskets.service.ts | Basket harakati |
| `EP-CC-013` | cc-sla.cron.ts | 24h inbox overdue |
| `EP-CC-014` | cc-event.listener.ts | Spawn draft (cascade) |
| `EP-CC-014A` | cc-event.listener.ts | AutoSend deferred |
| `EP-CC-016C` | cc-workflow.service.ts | Bekor qilish |
| `EP-CC-018P` | cc-workflow.service.ts | Chop etish |
| `EP-CC-031` | cc-workflow.service.ts | Qoralama yaratildi |
| `EP-CC-036D` | cc-sla.cron.ts | Delegation muddati o'tdi |
| `EP-CC-038` | cc-workflow.service.ts | Shikoyat |
| `EP-CC-066` | cc-sla.cron.ts | Oylik analytics (noop hozircha) |

---

*P37 direktiva | Wave 1 | DependsOn: [] | DDL: GATED (0017+0018) | Bajaruvchi: Muslimbek | Sana: 2026-06-19 | Qoidalar bloki: Q-47*
