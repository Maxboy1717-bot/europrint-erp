# P38 — CC (Communication Center): CC full-text search + attachments + scan-import + ZVS→Finance + crons

> **Wave:** 3 | **dependsOn:** P37 | **ddlGate:** false (DDL talab qilinmaydi — FTS index faqat ruxsat bilan)
> **Paket ID:** P38 · **Slug:** cc-search-finance-cron
> **Egasi:** Muslimbek · **Advisor (yozdirgan):** Claude · **Sana:** 2026-06-19

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` ni o'qi.

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin)

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **`@Body` Zod bilan validate**; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri:** REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ. TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati `docs/audit/MUSLIMBEK-PROMT-16-CC-2026-06-08.md`).
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31):** faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35):** CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Bu paket DDL-GATE=false deb belgilangan lekin FTS index uchun egasi `-- APPROVED:` ni tasdiqlashi shart (§5 ga qarang).
8. **`git add <aniq-fayl>` faqat; `-A`/`.` TAQIQ.** Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi**; JWT minting yo'q.
10. **Self-verify:** BE `tsc 0`, FE `tsc 0`, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu yerda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

### Bu agent uchun qo'shimcha cheklovlar

- **Wave 3** = P01-P37 tugagan sharoitda ishlaydi. P37 (CC bog'liq paket) bajarilishi shart — oldin `git log` bilan tekshir.
- **dependsOn: ["P37"]** — P37 commit'i yo'q bo'lsa TO'XTA va egaga report qil.
- Bu paket **CC modulining Phase 5 (EP-CC-017/018/025/027/076) va Phase 3 oxiri (EP-CC-066 monthly analytics + spawnRecurringDocuments stub aktivatsiyasi)** ni qamrab oladi.

---

## 1. IZOLYATSIYA MANIFESTI

### OWNED FILES (faqat shu fayllarga tegish ruxsat berilgan)

```
Uzbek-Language-Module/apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts
Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-read.repo.ts
Uzbek-Language-Module/apps/api/src/modules/communication-center/domain/events/cc-spawn-requested.event.ts
Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-workflow/cc-workflow-approve.helpers.ts
Uzbek-Language-Module/apps/api/src/modules/communication-center/communication-center.module.ts
Uzbek-Language-Module/artifacts/erp-dashboard/src/components/cc/BasketColumn.tsx
```

**QOIDA:** Yuqoridagi 6 fayldan BOSHQA birorta faylga tegma. Agar boshqa fayl o'zgartirish talab qilsa — TO'XTA, egaga xabar ber (flag), va uning "ha" javobi kelguncha kutib tur.

### DDL DARVOZASI

Bu paket `ddlGate: false` deb belgilangan — bu "DDL ta'qiqlangan" degani emas, "DDL approved fayl sifatida narxlanmagan" degani. Biroq FTS index uchun migration kerak:

- **FTS GIN index** (`cc_documents` ustida `to_tsvector`) — migration faylini YOZ lekin egasi `-- APPROVED: <ism> <sana>` izohini qo'shguncha `\i` yoki `migrate:latest` buyrug'ini ISHGA TUSHIRMA.
- Migration fayli: `Uzbek-Language-Module/apps/api/drizzle/0009_cc_fts_index.sql` — **bu fayl OWNED FILES ro'yxatiga KIRMAYDI**. Faqat mazmunini egaga ko'rsat va ruxsat so'ra.

---

## 2. VIZYON

### Manba: `docs/audit/MUSLIMBEK-PROMT-16-CC-2026-06-08.md` — Phase 5 + Phase 3 (EP-CC-066)

CC moduli **3-savat hujjat workflow dvigatel**i — A-System/Bitrix o'rnini bosadi. Bu paket (P38) Phase 5 ni va Phase 3 oxirini yopadi:

| EP-kodi | Xususiyat | Qabul mezoni |
|---------|-----------|--------------|
| EP-CC-017 | Full-text search: `GET /api/cc/documents?q=` | PostgreSQL `to_tsvector('russian', subject \|\| ' ' \|\| ai_body)` GIN indeks; endpoint natija qaytaradi |
| EP-CC-025 | Attachment upload/download: `POST /cc/documents/:id/attachments`, `GET /cc/documents/:id/attachments/:attachId` | `cc_attachments` jadvalga INSERT; fayl saqlash (existing storage); FE drag-drop |
| EP-CC-076 | Scan-import: `POST /api/cc/documents/scan-import` | Skaner rasm + meta → `cc_documents` ROW `source='scan'`, `workflow_state='archived'` |
| EP-CC-027 | ZVS/ZNO → Finance: `ZvsApprovedEvent` emit + Finance listener | Tasdiq → event → Finance payment queue INSERT |
| EP-CC-066 | Monthly analytics cron | Oyning oxirida: reja-o'zgartirish hujjatlari yig'ma → Director uchun yangi hujjat |
| spawnRecurring | Takrorlanuvchi hujjat spawn (stub → real) | `is_recurring=true` shablonlar cron_expression bo'yicha draft yaratadi |

### Vizyon qo'shimcha tafsilotlari

**EP-CC-017 (FTS):**
- `GET /api/cc/documents?q=&templateCode=&dateFrom=&dateTo=&senderId=&workflowState=&page=&limit=`
- Server-side PostgreSQL FTS: `to_tsvector('russian', COALESCE(subject,'') || ' ' || COALESCE(ai_body,''))`
- Pagination majburiy (max 50 ta natija)
- Natija: `{ data: BasketCard[], total, page, limit }`

**EP-CC-025 (Attachments):**
- `POST /api/cc/documents/:id/attachments` — multipart/form-data, file + metadata
- `GET /api/cc/documents/:id/attachments` — list
- `GET /api/cc/documents/:id/attachments/:attachId/download` — binary download
- `cc_attachments` jadval allaqachon DDL-da bor (0006 migration)
- Max fayl hajmi: existing storage config'dan (`MAX_FILE_SIZE_MB` env yoki default 10MB)
- Turdagi fayllar: `application/pdf`, `image/*`, `application/msword`, `application/vnd.openxmlformats*`
- FE: `BasketColumn.tsx`-da attachment badge (fayl soni ko'rsatish)

**EP-CC-076 (Scan-import):**
- `POST /api/cc/documents/scan-import` — multipart: `file` (image/pdf) + JSON meta body: `{ docNumber, seriesTag, docDate, positionCode, templateCode }`
- Natija: `cc_documents` ROW yaratiladi: `workflow_state='archived'`, `basket_state='outbox'`, `ai_body=` fayl URL, `source='scan'`
- cc_attachments'ga ham qo'shiladi (biriktirilgan fayl sifatida)

**EP-CC-027 (ZVS→Finance):**
- `CcWorkflowApproveHelpers` ichida: agar hujjat `templateCode = 'ZVS' OR 'ZNO'` va workflow `finalized` bo'lsa → `ZvsApprovedEvent` emit
- `ZvsApprovedEvent` class: `cc-spawn-requested.event.ts` bilan bir papkada `zvs-approved.event.ts` YANGI fayl — lekin bu OWNED FILES ro'yxatida emas. Faqat `cc-workflow-approve.helpers.ts` ichida emit chaqiriladi (owned).
- Finance moduli listeni (OWNED FILES ro'yxatida emas — faqat flag qilinadi, yozilmaydi)

**EP-CC-066 (Monthly analytics cron):**
- `cc-sla.cron.ts` — `@Cron('0 0 1 * *')` (har oyning 1-kuni 00:00)
- Reja-o'zgartirish hujjatlarini yig'adi → sabab guruhlari bo'yicha → Director uchun yangi hujjat yaratadi
- Yangi hujjat: `templateCode='REPORT'`, `workflow_state='archived'`, `ai_body=yig'ma matn`, `senderUserId=null→system-user-1`

**spawnRecurringDocuments (stub → real):**
- `cc-sla.cron.ts:197-201` — hozir bo'sh stub
- `cc_document_templates.is_recurring=true` va `cron_expression` ustunlari bor (DDL 0006 da tekshir)
- Real implementatsiya: `SELECT * FROM cc_document_templates WHERE is_recurring=true` → har birini cron_expression bilan solishtir (oddiy: `daily/weekly/monthly`) → muddati kelganda CcWorkflowService.createDraft() chaqiradi

---

## 3. HOZIRGI HOLAT

### Mavjud (exists) — tekshirilgan:

**cc-documents.controller.ts (satrs 1-259):**
- Barcha asosiy endpoint'lar REAL: `draft/send/approve/reject/resubmit/cancel/complaint/print/pdf`
- **YO'Q:** `GET /cc/documents?q=` (search), `POST /cc/documents/:id/attachments`, `POST /cc/documents/scan-import`
- 259-satr — fayl tugaydi; yangi endpoint'lar qo'shiladi

**cc-documents-read.repo.ts (satrs 1-116):**
- `getTemplate`, `getStepsForTemplate`, `getById`, `getPendingApprovalsAtStep` — barchasi REAL raw SQL + Result\<T\>
- **YO'Q:** `search(query, filters)` metodi; `listAttachments(docId)` metodi
- 116-satr — fayl tugaydi; yangi metodlar qo'shiladi

**cc-spawn-requested.event.ts (satrs 1-35):**
- Mavjud: `CcSpawnRequestedEvent extends DomainEvent` — props: templateCode/senderUserId/subject/body/priority/language/metadata/autoSend
- **YO'Q:** `ZvsApprovedEvent` (alohida fayl kerak — lekin OWNED FILES'da emas)
- Bu faylga O'ZGARISH KERAK EMAS — ZvsApprovedEvent alohida faylda bo'ladi (flag: P38 scope tashqarida, lekin cc-workflow-approve.helpers.ts ga emit uchun import kerak)

**cc-workflow-approve.helpers.ts (satrs 1-115):**
- `executeApproveTransaction` — REAL DB transaction, Result\<T\> pattern
- `findMyPendingApproval` + `requireDocInProgress` — helper'lar
- **YO'Q:** ZVS/ZNO trigger logic — `finalized` natijasida event emit yo'q
- 115-satr — fayl tugaydi; ZVS trigger mantiq qo'shiladi

**communication-center.module.ts (satrs 1-105):**
- Barcha repo/service/controller/cron/bot/event to'g'ri ro'yxatda
- **YO'Q:** yangi service'lar (CcSearchService, CcAttachmentService) modul providers'da emas — bular OWNED FILES ro'yxatida yangi fayllar emas, lekin module.ts ga ro'yxatga olish kerak

**BasketColumn.tsx (satrs 1-244):**
- 3-savat ustun komponenti — REAL: cards mapping, PinPromptModal, action pills
- **YO'Q:** attachment badge (fayl soni ko'rsatuvchi pill)
- **ESLATMA:** `BasketCard` interface (satr 17-35) attachment ma'lumot uchun kengaytirish kerak

**cc-sla.cron.ts:**
- `markInboxOverdue`, `autoRejectOverdue48h`, `escalateApprovals`, `expireDelegations` — barchasi REAL
- `spawnRecurringDocuments` (satrs 197-201) — **STUB: bo'sh funksiya, placeholder izoh**
- **YO'Q:** monthly analytics cron (`@Cron('0 0 1 * *')`)

### Yo'q (missing):

| Xususiyat | EP-kodi | Sabab |
|-----------|---------|-------|
| FTS search endpoint | EP-CC-017 | Controller'da yo'q; tsvector index yo'q |
| Attachment upload/download | EP-CC-025 | cc_attachments jadval bor lekin endpoint va FE yo'q |
| Scan-import endpoint | EP-CC-076 | Controller'da yo'q |
| ZVS/ZNO→Finance event | EP-CC-027 | `ZvsApprovedEvent` class yo'q; trigger yo'q |
| Monthly analytics cron | EP-CC-066 | `cc-sla.cron.ts`da yo'q |
| Recurring doc spawn (real) | — | Stub: `spawnRecurringDocuments` bo'sh |
| Attachment badge (FE) | EP-CC-025 | `BasketColumn.tsx`da yo'q |

### Buzuq (broken):

| Muammo | Fayl:satr | Tavsif |
|--------|-----------|--------|
| `spawnRecurringDocuments` stub | `cc-sla.cron.ts:197-201` | Izoh: "hozir hech narsa qilmaydi; placeholder" — Q-46 bo'yicha to'liq o'chiriladi yoki to'liq yoziladi (chala qoldirilmaydi) |
| `autoSend=true` warning | `cc-event.listener.ts:141-145` | OWNED FILES'da emas — faqat flag: ushbu stub mavjud, P38 scope tashqarida |
| Stale comment | `cc-sla.cron.ts:211` | "cc_notifications is a VIEW" izoh noto'g'ri — jadval standalone. Bug emas lekin chalkashlik keltirib chiqaradi |

### DDL holati:

- `cc_attachments` jadval `drizzle/0006_communication_center.sql`da bor — **migration allaqachon bajarilgan**
- FTS GIN index (`cc_doc_fts_idx`) — **mavjud emas, migration kerak (owner ruxsati bilan)**
- `cc_document_templates.is_recurring` + `cron_expression` — DDL 0006 da borligini tekshir (`SELECT column_name FROM information_schema.columns WHERE table_name='cc_document_templates'`)

---

## 4. ISH (qadam-baqadam)

> Har qadamdan keyin: `tsc 0` tekshir → commit → egaga holat hisoboti.

---

### QADAM 1: Hozirgi holat verifikatsiyasi (RUXSATSIZ O'ZGARTIRISH YO'Q)

**Maqsad:** haqiqiy mavjud holatni jonli DB bilan tasdiqla (Q-29).

**1.1 — cc_document_templates ustunlarini tekshir:**

```bash
# apps/api/_audit/q.cjs faylidan (read-only DB probe)
node apps/api/_audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='cc_document_templates' ORDER BY ordinal_position"
node apps/api/_audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='cc_attachments' ORDER BY ordinal_position"
node apps/api/_audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='cc_documents' ORDER BY ordinal_position"
node apps/api/_audit/q.cjs "SELECT COUNT(*) FROM cc_document_templates WHERE is_active=true"
```

**Kutilayotgan natija:**
- `cc_document_templates`: `is_recurring`, `cron_expression` ustunlari bor bo'lishi kerak (DDL 0006)
- `cc_attachments`: `id, document_id, filename, file_path, file_size, content_type, uploaded_by_user_id, created_at` kabi ustunlar
- `cc_documents`: `subject, ai_body, workflow_state, template_id, sender_user_id` bor

**1.2 — FTS index mavjudligini tekshir:**

```bash
node apps/api/_audit/q.cjs "SELECT indexname FROM pg_indexes WHERE tablename='cc_documents'"
```

FTS index yo'q bo'lsa → migration zarur (§5 ga o'tish).

**1.3 — P37 tugallanganini tekshir:**

```bash
git log --oneline -10
```

P37 commit'i mavjudligini tasdiqlash. Yo'q bo'lsa — TO'XTA.

---

### QADAM 2: FTS search — BE endpoint + repo metodi

**Fayl:** `cc-documents-read.repo.ts`

**2.1 — `searchDocuments` metodi qo'shish (116-satrdan keyin):**

```typescript
// BEFORE: 116-satr — fayl tugaydi
```

```typescript
// AFTER: 116-satrdan keyin qo'shiladi:

export interface SearchDocumentsFilter {
  q?: string;            // full-text so'rov
  templateCode?: string;
  dateFrom?: string;     // ISO8601
  dateTo?: string;
  senderUserId?: number;
  workflowState?: string;
  page?: number;
  limit?: number;
}

async searchDocuments(
  viewerUserId: number,
  filter: SearchDocumentsFilter,
): Promise<Result<{ rows: DocumentRow[]; total: number }>> {
  try {
    const page  = Math.max(1, filter.page  ?? 1);
    const limit = Math.min(50, Math.max(1, filter.limit ?? 20));
    const offset = (page - 1) * limit;

    // NOTE: raw SQL — Drizzle ORM cannot express tsvector FTS + dynamic
    //   WHERE clauses with optional filters + COUNT(*) OVER() window in
    //   a single typed query builder call. typedExecute<T> pattern used.
    const r = await runQuery<Record<string, unknown>>(sql`
      SELECT
        d.id::text                            AS id,
        d.document_number                     AS "documentNumber",
        d.template_id::text                   AS "templateId",
        d.template_version                    AS "templateVersion",
        d.sender_user_id                      AS "senderUserId",
        d.branch_id::text                     AS "branchId",
        d.basket_state                        AS "basketState",
        d.basket_owner_user_id                AS "basketOwnerUserId",
        d.basket_entered_at                   AS "basketEnteredAt",
        d.is_inbox_overdue                    AS "isInboxOverdue",
        d.workflow_state                      AS "workflowState",
        d.current_step_order                  AS "currentStepOrder",
        d.subject,
        d.ai_body                             AS "aiBody",
        d.ai_answers                          AS "aiAnswers",
        d.sender_comment                      AS "senderComment",
        d.priority,
        d.language,
        d.parent_document_id::text            AS "parentDocumentId",
        d.version,
        d.cancelled_by_user_id                AS "cancelledByUserId",
        d.cancelled_reason                    AS "cancelledReason",
        d.cancelled_at                        AS "cancelledAt",
        d.created_at                          AS "createdAt",
        d.updated_at                          AS "updatedAt",
        d.archived_at                         AS "archivedAt",
        COUNT(*) OVER()::int                  AS "_total"
      FROM cc_documents d
      JOIN cc_document_templates t ON t.id = d.template_id
      WHERE (
        d.sender_user_id = ${viewerUserId}
        OR d.basket_owner_user_id = ${viewerUserId}
        OR EXISTS (
          SELECT 1 FROM cc_approvals a
          WHERE a.document_id = d.id AND a.approver_user_id = ${viewerUserId}
        )
      )
      ${filter.q ? sql`
        AND to_tsvector('russian',
          COALESCE(d.subject, '') || ' ' || COALESCE(d.ai_body, '')
        ) @@ plainto_tsquery('russian', ${filter.q})
      ` : sql``}
      ${filter.templateCode ? sql`AND t.code = ${filter.templateCode}` : sql``}
      ${filter.dateFrom ? sql`AND d.created_at >= ${filter.dateFrom}::timestamptz` : sql``}
      ${filter.dateTo   ? sql`AND d.created_at <= ${filter.dateTo}::timestamptz`   : sql``}
      ${filter.senderUserId ? sql`AND d.sender_user_id = ${filter.senderUserId}` : sql``}
      ${filter.workflowState ? sql`AND d.workflow_state = ${filter.workflowState}` : sql``}
      ORDER BY d.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const total = r.rows.length > 0
      ? Number((r.rows[0] as Record<string, unknown>)['_total'] ?? 0)
      : 0;

    const rows = r.rows.map(row => {
      const { _total, ...rest } = row as Record<string, unknown>;
      return castTo<DocumentRow>(rest);
    });

    return Ok({ rows, total });
  } catch (e) {
    return Err({ message: (e as Error).message, code: 'DB_ERROR' });
  }
}
```

**2.2 — `listAttachments` metodi qo'shish:**

```typescript
async listAttachments(documentId: string): Promise<Result<AttachmentRow[]>> {
  try {
    const r = await runQuery<Record<string, unknown>>(sql`
      SELECT
        id::text                AS id,
        document_id::text       AS "documentId",
        filename,
        file_path               AS "filePath",
        file_size               AS "fileSize",
        content_type            AS "contentType",
        uploaded_by_user_id     AS "uploadedByUserId",
        created_at              AS "createdAt"
      FROM cc_attachments
      WHERE document_id = ${documentId}
      ORDER BY created_at ASC
    `);
    return Ok(castTo<AttachmentRow[]>(r.rows));
  } catch (e) {
    return Err({ message: (e as Error).message, code: 'DB_ERROR' });
  }
}
```

**`types.ts` ga qo'shimcha tip (owned types faylini tekshir — bu fayl OWNED FILES'da bo'lishi mumkin; agar yo'q bo'lsa `cc-documents-read.repo.ts` boshiga qo'sh):**

```typescript
export interface AttachmentRow {
  id: string;
  documentId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  uploadedByUserId: number | null;
  createdAt: string;
}
```

**DB-proof (repo metodi yozilgandan keyin):**

```bash
node apps/api/_audit/q.cjs "INSERT INTO cc_attachments (document_id, filename, file_path, file_size, content_type) SELECT id, 'test.pdf', '/tmp/test.pdf', 1024, 'application/pdf' FROM cc_documents LIMIT 1 RETURNING id"
# Natija: {id: '...'} — INSERT ishladi
node apps/api/_audit/q.cjs "SELECT count(*) FROM cc_attachments WHERE filename='test.pdf'"
# Natija: {count: '1'} — SAQLANGANLIGINI TASDIQLASH
```

---

### QADAM 3: FTS + Attachment endpoint'larini controller'ga qo'shish

**Fayl:** `cc-documents.controller.ts`

**3.1 — Import va schema'lar (fayl boshiga qo'shimchalar):**

```typescript
// BEFORE: fayl 18-satrida mavjud import bloki + 38-satrda DTO schemas
```

```typescript
// AFTER: mavjud import'larga qo'shimcha:
import { Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-fastify';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { CcDocumentsReadRepo } from '../infrastructure/repositories/cc-documents/cc-documents-read.repo';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

// Yangi DTO schemas (mavjud schemas blokiga qo'shish):
const SearchSchema = z.object({
  q:             z.string().min(1).max(500).optional(),
  templateCode:  z.string().max(60).optional(),
  dateFrom:      z.string().datetime().optional(),
  dateTo:        z.string().datetime().optional(),
  senderUserId:  z.coerce.number().int().positive().optional(),
  workflowState: z.enum(['draft', 'in_progress', 'approved', 'rejected', 'cancelled', 'archived']).optional(),
  page:          z.coerce.number().int().positive().default(1),
  limit:         z.coerce.number().int().positive().max(50).default(20),
});

const ScanImportMetaSchema = z.object({
  docNumber:    z.string().min(1).max(60),
  seriesTag:    z.string().max(40).optional(),
  docDate:      z.string().datetime(),
  positionCode: z.string().max(60).optional(),
  templateCode: z.string().max(60).default('ZRS_ZVS'),
});
```

**3.2 — Constructor'ga `readRepo` qo'shish:**

```typescript
// BEFORE (satr 76-82):
constructor(
  private readonly wf:      CcWorkflowService,
  private readonly baskets: CcBasketsService,
  private readonly pin:     CcPinService,
  private readonly pdfSvc:  CcPdfService,
  private readonly configService: ConfigService,
) {}
```

```typescript
// AFTER:
constructor(
  private readonly wf:         CcWorkflowService,
  private readonly baskets:    CcBasketsService,
  private readonly pin:        CcPinService,
  private readonly pdfSvc:     CcPdfService,
  private readonly readRepo:   CcDocumentsReadRepo,
  private readonly configService: ConfigService,
) {}
```

**3.3 — Yangi endpoint'lar (259-satrdan keyin, `}` ni yopmasdan avval qo'shish):**

```typescript
  // ── FTS Search ─────────────────────────────────────────────────────
  /**
   * GET /api/cc/documents?q=&templateCode=&dateFrom=&dateTo=&senderUserId=&workflowState=&page=&limit=
   * EP-CC-017: PostgreSQL tsvector full-text search on subject + ai_body.
   */
  @ApiOperation({ summary: 'Search documents (FTS)' })
  @ApiResponse({ status: 200, description: 'Paginated document list' })
  @Get('documents')
  async searchDocuments(
    @Query() rawQuery: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const filter = SearchSchema.parse(rawQuery);
    const result = await this.readRepo.searchDocuments(user.id, filter);
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return {
      data: result.data.rows,
      total: result.data.total,
      page: filter.page,
      limit: filter.limit,
    };
  }

  // ── Attachments ─────────────────────────────────────────────────────
  /**
   * POST /api/cc/documents/:id/attachments — fayl yuklash (multipart/form-data)
   * EP-CC-025
   */
  @ApiOperation({ summary: 'Upload attachment' })
  @ApiResponse({ status: 201, description: 'Attachment saved' })
  @Post('documents/:id/attachments')
  async uploadAttachment(
    @Param('id') docId: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: { id: number },
  ) {
    // Fastify multipart — @fastify/multipart allaqachon ulangan
    const data = await (req as unknown as { file(): Promise<MultipartFile | undefined> }).file();
    if (!data) throw new BadRequestException('Fayl topilmadi (multipart/form-data)');

    const maxBytes = 10 * 1024 * 1024; // 10MB default (Q-12: business.constants.ts dan olinishi kerak)
    const allowed  = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(data.mimetype)) {
      throw new BadRequestException(`Ruxsat etilmagan fayl turi: ${data.mimetype}`);
    }

    // Fayl saqlash — existing uploads katalogi
    const uploadDir = this.configService.get<string>('UPLOAD_DIR') ?? '/tmp/cc-attachments';
    const ext       = data.filename.split('.').pop() ?? 'bin';
    const savedName = `${randomUUID()}.${ext}`;
    const filePath  = join(uploadDir, savedName);

    let fileSize = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      fileSize += chunk.length;
      if (fileSize > maxBytes) throw new BadRequestException('Fayl hajmi 10MB dan oshib ketdi');
      chunks.push(chunk);
    }
    const buf = Buffer.concat(chunks);
    await import('node:fs/promises').then(fs => fs.writeFile(filePath, buf));

    // DB saqlash
    const r = await runQuery<{ id: string }>(sql`
      INSERT INTO cc_attachments
        (document_id, filename, file_path, file_size, content_type, uploaded_by_user_id)
      VALUES
        (${docId}, ${data.filename}, ${filePath}, ${fileSize}, ${data.mimetype}, ${user.id})
      RETURNING id::text AS id
    `);
    if (!r.rows[0]) throw new InternalServerErrorException('Attachment saqlashda xato');

    // Audit
    await runQuery(sql`
      INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
      VALUES (${docId}, 'attachment_uploaded', ${user.id}, ${`Fayl yuklandi: ${data.filename}`})
    `);

    return { ok: true, attachmentId: r.rows[0].id, filename: data.filename, fileSize };
  }

  /**
   * GET /api/cc/documents/:id/attachments — ro'yxat
   * EP-CC-025
   */
  @ApiOperation({ summary: 'List attachments' })
  @ApiResponse({ status: 200, description: 'Attachment list' })
  @Get('documents/:id/attachments')
  async listAttachments(@Param('id') docId: string) {
    const result = await this.readRepo.listAttachments(docId);
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return { data: result.data };
  }

  /**
   * GET /api/cc/documents/:id/attachments/:attachId/download — binary yuklab olish
   * EP-CC-025
   */
  @ApiOperation({ summary: 'Download attachment' })
  @Get('documents/:id/attachments/:attachId/download')
  @Header('Content-Type', 'application/octet-stream')
  async downloadAttachment(
    @Param('id') docId: string,
    @Param('attachId') attachId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<Buffer> {
    const r = await runQuery<{
      filename: string; file_path: string; content_type: string;
    }>(sql`
      SELECT filename, file_path, content_type
      FROM cc_attachments
      WHERE id = ${attachId} AND document_id = ${docId}
      LIMIT 1
    `);
    if (!r.rows[0]) throw new NotFoundException('Attachment topilmadi');

    const { filename, file_path, content_type } = r.rows[0];
    const fs = await import('node:fs/promises');
    const buf = await fs.readFile(file_path).catch(() => {
      throw new NotFoundException('Fayl topilmadi (storage)');
    });
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.header('Content-Type', content_type);
    return buf;
  }

  // ── Scan-import ─────────────────────────────────────────────────────
  /**
   * POST /api/cc/documents/scan-import — skanerlangan hujjatni arxivga import
   * EP-CC-076: multipart fayl + JSON meta → cc_documents ROW (workflow_state='archived', source='scan')
   */
  @ApiOperation({ summary: 'Scan-import: archive a scanned paper document' })
  @ApiResponse({ status: 201, description: 'Document archived' })
  @Post('documents/scan-import')
  async scanImport(
    @Req() req: FastifyRequest,
    @CurrentUser() user: { id: number },
  ) {
    const parts = (req as unknown as { parts(): AsyncIterable<{
      type: string;
      fieldname: string;
      filename?: string;
      mimetype?: string;
      file?: AsyncIterable<Buffer>;
      value?: string;
    }> }).parts();

    let fileBuf: Buffer | null = null;
    let origFilename = 'scan.pdf';
    let fileMime = 'application/pdf';
    let rawMeta = '';

    for await (const part of parts) {
      if (part.type === 'file' && part.file) {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        fileBuf = Buffer.concat(chunks);
        origFilename = part.filename ?? 'scan.pdf';
        fileMime = part.mimetype ?? 'application/pdf';
      } else if (part.type === 'field' && part.fieldname === 'meta') {
        rawMeta = part.value ?? '';
      }
    }

    if (!fileBuf || fileBuf.length === 0) throw new BadRequestException('Skanerlangan fayl topilmadi');
    const meta = ScanImportMetaSchema.parse(JSON.parse(rawMeta || '{}'));

    // Shablonni topish
    const tmplR = await runQuery<{ id: string }>(sql`
      SELECT id::text AS id FROM cc_document_templates
      WHERE code = ${meta.templateCode} AND is_active = true LIMIT 1
    `);
    if (!tmplR.rows[0]) throw new NotFoundException(`Shablon topilmadi: ${meta.templateCode}`);
    const templateId = tmplR.rows[0].id;

    // Fayl saqlash
    const uploadDir  = this.configService.get<string>('UPLOAD_DIR') ?? '/tmp/cc-attachments';
    const ext        = origFilename.split('.').pop() ?? 'pdf';
    const savedName  = `scan-${randomUUID()}.${ext}`;
    const filePath   = join(uploadDir, savedName);
    await import('node:fs/promises').then(fs => fs.writeFile(filePath, fileBuf!));

    // cc_documents INSERT
    const docR = await runQuery<{ id: string; document_number: string }>(sql`
      INSERT INTO cc_documents
        (template_id, template_version, sender_user_id,
         basket_state, basket_owner_user_id, basket_entered_at,
         workflow_state, current_step_order,
         subject, ai_body, priority, language,
         archived_at, created_at, updated_at)
      SELECT
        ${templateId}::uuid,
        t.version,
        ${user.id},
        'outbox', ${user.id}, NOW(),
        'archived', 0,
        ${meta.docNumber},
        ${filePath},
        'normal', 'uz',
        NOW(), NOW(), NOW()
      FROM cc_document_templates t WHERE t.id = ${templateId}::uuid
      RETURNING id::text AS id, document_number AS "documentNumber"
    `);
    if (!docR.rows[0]) throw new InternalServerErrorException('Hujjat yaratishda xato (scan-import)');
    const newDocId = docR.rows[0].id;

    // cc_attachments INSERT
    await runQuery(sql`
      INSERT INTO cc_attachments
        (document_id, filename, file_path, file_size, content_type, uploaded_by_user_id)
      VALUES
        (${newDocId}, ${origFilename}, ${filePath}, ${fileBuf.length}, ${fileMime}, ${user.id})
    `);

    // cc_audit_trail
    await runQuery(sql`
      INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
      VALUES (${newDocId}, 'scan_imported', ${user.id},
              ${`Skanerlangan hujjat import: ${meta.docNumber} (${meta.seriesTag ?? ''})`})
    `);

    return {
      ok: true,
      documentId: newDocId,
      documentNumber: docR.rows[0].documentNumber ?? meta.docNumber,
      filename: origFilename,
    };
  }
```

**Zarur import qo'shimchalar (fayl boshiga):**

```typescript
// BEFORE (satr 18-24):
import {
  Body, Controller, Get, Param, Post, UseGuards, UseInterceptors, Res, Header,
} from '@nestjs/common';
```

```typescript
// AFTER:
import {
  Body, Controller, Get, Param, Post, Query, Req, UseGuards, UseInterceptors,
  Res, Header, BadRequestException, NotFoundException, InternalServerErrorException,
} from '@nestjs/common';
```

---

### QADAM 4: ZVS/ZNO → Finance event trigger

**Fayl:** `cc-workflow-approve.helpers.ts`

**Holat:** `executeApproveTransaction` funksiyasi `finalized` natija qaytarganda ZVS/ZNO hujjatlari uchun event emit qilish kerak.

**4.1 — EventEmitter2 import qo'shish:**

```typescript
// BEFORE (satr 1-11):
import { Logger, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { db } from '@shared/db';
import type { CcDocumentsRepository, DocumentRow } from '../../infrastructure/repositories/cc-documents.repo';
import type { CcOrgResolverService } from '../cc-org-resolver.service';
```

```typescript
// AFTER:
import { Logger, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { db } from '@shared/db';
import type { CcDocumentsRepository, DocumentRow } from '../../infrastructure/repositories/cc-documents.repo';
import type { CcOrgResolverService } from '../cc-org-resolver.service';
import type { EventEmitter2 } from '@nestjs/event-emitter';

// ZVS/ZNO shablon kodlari — EP-CC-027
const ZVS_FINANCE_CODES = new Set(['ZVS', 'ZNO', 'ZRS_ZVS']);
```

**4.2 — `executeApproveTransaction` signature kengaytirish + event trigger:**

```typescript
// BEFORE (satr 21-26):
export async function executeApproveTransaction(
  args: ApproveArgs,
  docs: CcDocumentsRepository,
  org: CcOrgResolverService,
  logger: Logger,
): Promise<{ ok: true; status: string; remainingApprovers?: number[]; nextStepOrder?: number; nextApproverIds?: number[] }> {
```

```typescript
// AFTER:
export async function executeApproveTransaction(
  args: ApproveArgs,
  docs: CcDocumentsRepository,
  org: CcOrgResolverService,
  logger: Logger,
  eventEmitter?: EventEmitter2,      // optional — EP-CC-027 ZVS/ZNO Finance trigger
  templateCode?: string,             // hujjat shablon kodi (ZVS/ZNO tekshirish uchun)
): Promise<{ ok: true; status: string; remainingApprovers?: number[]; nextStepOrder?: number; nextApproverIds?: number[] }> {
```

**4.3 — `finalized` natijasida ZVS trigger (satr 59 atrofida):**

```typescript
// BEFORE (satr 48-60):
      if (nextOrder == null) {
        unwrapOrThrow(await docs.transition({
          documentId: doc.id,
          newBasketState: 'outbox',
          newBasketOwnerId: doc.senderUserId,
          newWorkflowState: 'approved',
          newCurrentStep: doc.currentStepOrder,
          actorUserId: approverUserId,
          auditAction: 'approved',
          auditComment: comment,
        }));
        return { ok: true, status: 'finalized' };
      }
```

```typescript
// AFTER:
      if (nextOrder == null) {
        unwrapOrThrow(await docs.transition({
          documentId: doc.id,
          newBasketState: 'outbox',
          newBasketOwnerId: doc.senderUserId,
          newWorkflowState: 'approved',
          newCurrentStep: doc.currentStepOrder,
          actorUserId: approverUserId,
          auditAction: 'approved',
          auditComment: comment,
        }));

        // EP-CC-027: ZVS/ZNO → Finance payment queue
        if (eventEmitter && templateCode && ZVS_FINANCE_CODES.has(templateCode)) {
          try {
            eventEmitter.emit('cc.zvs_approved', {
              documentId: doc.id,
              senderUserId: doc.senderUserId,
              templateCode,
              approvedAt: new Date().toISOString(),
            });
            logger.log(`EP-CC-027 ZvsApprovedEvent emitted: doc=${doc.id} code=${templateCode}`);
          } catch (emitErr) {
            // Event emit xatosi hujjat tasdiqlashni bloklamasligi kerak (E1 prinsipi)
            logger.error(`EP-CC-027 emit xatosi (bloklashsiz): ${String(emitErr)}`);
          }
        }

        return { ok: true, status: 'finalized' };
      }
```

**4.4 — `executeApproveTransaction` chaqiruvchi joy (`cc-workflow.service.ts`) — bu fayl OWNED FILES'da EMAS.**

Shuning uchun: `cc-workflow-approve.helpers.ts` ga yangi optional parametrlar qo'shildi (backward-compatible: `eventEmitter` va `templateCode` optional). Chaqiruvchi joyi (`cc-workflow.service.ts`) hozircha eski 4-argument bilan chaqiriladi — ZVS trigger ISHLAMAS. Bu to'g'ri (izolyatsiya qoidasi — OWNED FILES tashqariga tegma). Bu gap-ni egaga report qil: "P38: ZVS trigger `cc-workflow-approve.helpers.ts`da tayyor, lekin `cc-workflow.service.ts` (P38 scope tashqarida) `eventEmitter` + `templateCode` parametrlarini uzatish uchun yangilash kerak — alohida patch."

---

### QADAM 4B: ORGPOLITIKA → asoschi-PIN yakuniy bosqich — EP-CC-063 (YANGI — Gap 2)

**Manba:** EP-CC-063 egasi javob: "orgpolitika/strategik tur marshrutining oxirgi bosqichi = asoschi imzosi (PIN). Faqat orgpolitika + yirik summa egaga (A); oddiy ariza emas."

**Fayl:** `cc-workflow-approve.helpers.ts` (OWNED)

**Qoida:** `ORGPOLITIKA` (va kelajakda boshqa strategik tur) hujjat uchun workflow zanjirining oxirgi bosqichida `FOUNDER` yoki `OWNER` roli sohibi imzosi talab qilinadi. Bu workflow seed (0017)'da ham aks etishi kerak.

**4B.1 — `FOUNDER_REQUIRED_CODES` konstantasi qo'shish (4.1 dagi import blokiga):**

```typescript
// ZVS/ZNO shablon kodlari — EP-CC-027 (allaqachon bor)
const ZVS_FINANCE_CODES = new Set(['ZVS', 'ZNO', 'ZRS_ZVS']);

// ORGPOLITIKA/strategik tur — EP-CC-063: yakuniy bosqich asoschi imzosi (PIN) talab etiladi
const FOUNDER_PIN_REQUIRED_CODES = new Set(['ORGPOLITIKA']);
// EGASI QIYMATI KERAK: boshqa strategik tur kodlari ham shu to'plamga qo'shilishi mumkin
// (masalan yirik summa ZNO/PRIKAZ) — egasi tasdiqlagan bo'lishi shart.
```

**4B.2 — `finalized` natijasida ORGPOLITIKA founder-PIN tekshiruvi:**

```typescript
// 4.3 da qo'shilgan ZVS trigger blokidan KEYIN qo'shish (satr ~808 atrofida):

        // EP-CC-063: ORGPOLITIKA → yakuniy bosqich asoschi imzosi talab qilinadi
        // Workflow seed (0017) da ORGPOLITIKA uchun oxirgi bosqich approver_position_code='FOUNDER'
        // bo'lishi kerak. Bu check shu bosqich muvaffaqiyatli imzolanganda log yozadi.
        if (templateCode && FOUNDER_PIN_REQUIRED_CODES.has(templateCode)) {
          logger.log(
            `EP-CC-063 ORGPOLITIKA founder-PIN finalized: doc=${doc.id} approver=${approverUserId}`
          );
          // NOTE: Agar ushbu `finalized` holat FOUNDER bosqichi EMAS bo'lsa —
          // bu xato: workflow seed'da FOUNDER bosqichi OXIRGI bo'lishi shart (max step_order).
          // Tekshirish: 0017 seed da ORGPOLITIKA uchun oxirgi entry approver_position_code='FOUNDER'.
          // EGASI QIYMATI KERAK: 'FOUNDER' kodi org_functions da kim bo'lishini tasdiqlash kerak
          // (owner/asoschi — Ayubxon Pozilov).
        }

        return { ok: true, status: 'finalized' };
      }
```

**4B.3 — `0017_cc_vision_templates_seed.sql` (P37 GATED DDL) ga ORGPOLITIKA workflow bosqichlarini to'g'rilash:**

> Bu P37 OWNED faylida — P38 da FAQAT ESLATMA va tekshiruv yo'riqnomasi beriladi.

`0017` faylida ORGPOLITIKA workflow steps blokida (CROSS JOIN qismida) oxirgi bosqich `DIRECTOR` o'rniga `FOUNDER` bo'lishi kerak:

```sql
-- 0017 da ORGPOLITIKA uchun alohida workflow steps (xuddi 0017 QADAM 2 CROSS JOIN dan keyin):
-- ORGPOLITIKA: standart 4-bosqich + 5-bosqich (asoschi — EP-CC-063)
INSERT INTO cc_workflow_steps
  (template_id, template_version, step_order, step_type, approver_position_code,
   rejection_stops, time_limit_hours, is_mandatory)
SELECT
  t.id, t.version, 5, 'sequential', 'FOUNDER', true, 168, true
  -- EGASI QIYMATI KERAK: time_limit_hours=168 (7 kun) — egasi tasdiqlashi kerak
FROM cc_document_templates t
WHERE t.code = 'ORGPOLITIKA' AND t.is_active = true
ON CONFLICT ON CONSTRAINT cc_step_order_uq DO NOTHING;
```

> P37 faylini egasi 0017'da shu bosqichni qo'shishi uchun flag qilinadi.

**Qabul mezoni (EP-CC-063):**
- [ ] `cc-workflow-approve.helpers.ts` da `FOUNDER_PIN_REQUIRED_CODES` konstanta mavjud
- [ ] `finalized` blokida ORGPOLITIKA log yozuvi bor (`EP-CC-063` kodi bilan)
- [ ] P37 0017 faylida ORGPOLITIKA uchun 5-bosqich `FOUNDER` bor (yoki egaga flag qilingan)
- [ ] `-- EGASI QIYMATI KERAK` izoh mavjud

---

### QADAM 5: Monthly analytics cron + spawnRecurringDocuments (real)

**Fayl:** `communication-center.module.ts` va `cc-sla.cron.ts` (bu ikkinchisi OWNED FILES'da emas — faqat `communication-center.module.ts` owned).

**Muhim tushuncha:**
- `cc-sla.cron.ts` — OWNED FILES ro'yxatida YO'Q
- `communication-center.module.ts` — OWNED FILES ro'yxatida BOR

Shuning uchun: `cc-sla.cron.ts` ga o'zgarish kiritish uchun egadan ruxsat so'rash kerak. Bu qadamni bajaring:

**5.1 — `communication-center.module.ts` — provider list tekshirish (hozircha o'zgarish yo'q):**

Modul hozirda (`satrs 52-104`):
```typescript
providers: [
  CcBasketsRepository, CcDocumentsReadRepo, CcDocumentsWriteRepo, CcDocumentsRepository,
  CcNotificationPrefsRepository,
  CcBasketsService, CcWorkflowService, CcWorkflowRejectService, CcPinService,
  CcDocumentNumberService, CcOrgResolverService, CcAiInterviewService, CcPdfService, CcStatsService,
  CcGateway, CcSlaCron, CcBotService, CcEventListener,
],
```

`CcSlaCron` allaqachon providers ro'yxatida — cron ishlayapti. Faqat `spawnRecurringDocuments` stub va monthly cron yo'q.

**5.2 — Egaga flag (RUXSAT SO'RASH):**

Qadam 5 bajarilishi uchun egadan quyidagi ruxsat so'ralishi shart:

> "P38: `cc-sla.cron.ts` (OWNED FILES tashqarida) ga ikki qo'shimcha kerak:
> 1. `spawnRecurringDocuments()` stub → real implementatsiya (EP-CC recurring)
> 2. Yangi `@Cron('0 0 1 * *')` monthly analytics cron (EP-CC-066)
>
> Bu faylga tegish uchun ruxsat bering. O'zgarishlar backward-compatible, regress yo'q."

Egasi "ha" degach bajarish tartibi:

**`cc-sla.cron.ts` — `spawnRecurringDocuments` stub o'rniga real implementatsiya:**

```typescript
// BEFORE (satrs 197-201):
  private async spawnRecurringDocuments(): Promise<void> {
    // Soddalashtirilgan implementatsiya — `is_recurring=true` shablonlar uchun
    // har soatda bitta marta sun'iy ravishda yaratish o'tkazib yuboriladi.
    // To'liq cron-expression matching kelajakda qo'shiladi.
    // (Hozir hech narsa qilmaydi; placeholder)
  }
```

```typescript
// AFTER:
  private async spawnRecurringDocuments(): Promise<void> {
    // NOTE: raw SQL — cc_document_templates not in Drizzle schema barrel (CC uses raw-SQL pattern).
    // Fetch all active recurring templates + check if draft already created this hour.
    const r = await runQuery<{
      id: string; code: string; cron_expression: string | null;
    }>(sql`
      SELECT id::text AS id, code, cron_expression
      FROM cc_document_templates
      WHERE is_recurring = true AND is_active = true
    `);

    for (const tmpl of r.rows) {
      // Oddiy cron matching: 'daily'→har kuni, 'weekly'→dushanba, 'monthly'→1-kun
      const now = new Date();
      const shouldSpawn = this.shouldSpawnNow(tmpl.cron_expression, now);
      if (!shouldSpawn) continue;

      // Bu soat/kun uchun allaqachon yaratilganmi?
      const exists = await runQuery<{ cnt: string }>(sql`
        SELECT COUNT(*)::text AS cnt FROM cc_documents
        WHERE template_id = ${tmpl.id}::uuid
          AND workflow_state = 'draft'
          AND created_at > NOW() - INTERVAL '1 hour'
      `);
      if (Number(exists.rows[0]?.cnt ?? 0) > 0) continue;

      // System sender (user_id=1 — super_admin)
      const r2 = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_documents
          (template_id, template_version, sender_user_id,
           basket_state, basket_owner_user_id, basket_entered_at,
           workflow_state, current_step_order,
           subject, ai_body, priority, language,
           created_at, updated_at)
        SELECT
          ${tmpl.id}::uuid, t.version, 1,
          'outbox', 1, NOW(),
          'draft', 0,
          ${'[Avtomatik] ' + tmpl.code + ' — ' + now.toLocaleDateString('uz-UZ')},
          '', 'normal', 'uz',
          NOW(), NOW()
        FROM cc_document_templates t WHERE t.id = ${tmpl.id}::uuid
        RETURNING id::text AS id
      `);
      if (r2.rows[0]) {
        this.logger.log(`spawnRecurring: ${tmpl.code} → doc ${r2.rows[0].id}`);
      }
    }
  }

  /**
   * Oddiy cron_expression matchi: 'daily', 'weekly' (dushanba), 'monthly' (1-kun)
   */
  private shouldSpawnNow(cronExpr: string | null, now: Date): boolean {
    if (!cronExpr) return false;
    const expr = cronExpr.toLowerCase().trim();
    if (expr === 'daily') return now.getMinutes() < 30; // har kuni birinchi yarım soatda
    if (expr === 'weekly') return now.getDay() === 1 && now.getHours() === 6; // dushanba 06:00
    if (expr === 'monthly') return now.getDate() === 1 && now.getHours() === 0; // har oy 1-kuni
    return false;
  }
```

**`cc-sla.cron.ts` — Monthly analytics cron (EP-CC-066):**

```typescript
// 197-satrdan avval — yangi @Cron qo'shish:

  /**
   * Har oy 1-kuni 00:05 — reja-o'zgartirish hujjatlari yig'masi (EP-CC-066)
   * Director uchun avtomat hisobot hujjat yaratadi.
   */
  @Cron('5 0 1 * *')
  async runMonthlyAnalytics(): Promise<void> {
    try {
      await this.generateMonthlyAnalyticsReport();
    } catch (e) {
      this.logger.error(`runMonthlyAnalytics: ${(e as Error).message}`);
    }
  }

  private async generateMonthlyAnalyticsReport(): Promise<void> {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1; // 1-based
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;

    // O'tgan oy reja-o'zgartirish hujjatlarini yig'
    const stats = await runQuery<{
      sabab_group: string; cnt: string;
    }>(sql`
      SELECT
        COALESCE(d.ai_answers->>'sabab_guruhi', 'noma''lum') AS sabab_group,
        COUNT(*)::text AS cnt
      FROM cc_documents d
      JOIN cc_document_templates t ON t.id = d.template_id
      WHERE t.code IN ('REJA_OZGARTIRISH', 'PLAN_CHANGE')
        AND d.workflow_state = 'approved'
        AND EXTRACT(YEAR  FROM d.created_at) = ${prevYear}
        AND EXTRACT(MONTH FROM d.created_at) = ${prevMonth}
      GROUP BY sabab_group
      ORDER BY cnt DESC
    `);

    if (stats.rows.length === 0) {
      this.logger.log(`EP-CC-066: O'tgan oy (${prevYear}-${prevMonth}) reja-o'zgartirish yo'q — hisobot yaratilmadi`);
      return;
    }

    // Director uchun aibo tayyorlash
    const lines = stats.rows.map(r => `- ${r.sabab_group}: ${r.cnt} ta`).join('\n');
    const body  = `## Reja-o'zgartirish hisoboti — ${prevYear}-${String(prevMonth).padStart(2,'0')}\n\n${lines}`;

    // REPORT shablonini topish
    const tmpl = await runQuery<{ id: string }>(sql`
      SELECT id::text AS id FROM cc_document_templates
      WHERE code = 'REPORT' AND is_active = true LIMIT 1
    `);
    if (!tmpl.rows[0]) {
      this.logger.warn('EP-CC-066: REPORT shablon topilmadi — hisobot yaratilmadi');
      return;
    }

    // Director user_id topish (rol bo'yicha)
    const director = await runQuery<{ id: string }>(sql`
      SELECT u.id::text AS id FROM users u
      WHERE u.role = 'director' LIMIT 1
    `);
    const directorId = director.rows[0]?.id ? Number(director.rows[0].id) : 1;

    // cc_documents INSERT — arxivlangan holat
    const newDoc = await runQuery<{ id: string }>(sql`
      INSERT INTO cc_documents
        (template_id, template_version, sender_user_id,
         basket_state, basket_owner_user_id, basket_entered_at,
         workflow_state, current_step_order,
         subject, ai_body, priority, language,
         archived_at, created_at, updated_at)
      SELECT
        ${tmpl.rows[0].id}::uuid, t.version, 1,
        'outbox', ${directorId}, NOW(),
        'archived', 0,
        ${'Reja-o''zgartirish hisoboti ' + prevYear + '-' + String(prevMonth).padStart(2,'0')},
        ${body}, 'normal', 'uz',
        NOW(), NOW(), NOW()
      FROM cc_document_templates t WHERE t.id = ${tmpl.rows[0].id}::uuid
      RETURNING id::text AS id
    `);

    if (newDoc.rows[0]) {
      this.logger.log(`EP-CC-066 monthly report created: doc=${newDoc.rows[0].id} director=${directorId}`);
      await runQuery(sql`
        INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
        VALUES (${newDoc.rows[0].id}, 'monthly_report_generated', NULL,
                ${'EP-CC-066: ' + prevYear + '-' + String(prevMonth).padStart(2,'0') + ' hisoboti'})
      `);
    }
  }
```

---

### QADAM 6: BasketColumn.tsx — attachment badge

**Fayl:** `BasketColumn.tsx`

**Maqsad:** har bir hujjat kartasida attachment soni ko'rsatish (EP-CC-025 FE tomoni).

**6.1 — `BasketCard` interface kengaytirish (satr 17-35):**

```typescript
// BEFORE (satr 17-35):
export interface BasketCard {
  id:                string;
  documentNumber:    string;
  subject:           string;
  templateCode:      string;
  templateNameUz:    string;
  templateNameRu:    string;
  priority:          'low' | 'normal' | 'high' | 'urgent';
  language:          'uz' | 'ru';
  basketState:       'inbox' | 'pending' | 'outbox' | 'archived';
  basketEnteredAt:   string;
  isInboxOverdue:    boolean;
  workflowState:     string;
  currentStepOrder:  number;
  senderName:        string | null;
  basketOwnerUserId: number | null;
  createdAt:         string;
  updatedAt:         string;
}
```

```typescript
// AFTER:
export interface BasketCard {
  id:                string;
  documentNumber:    string;
  subject:           string;
  templateCode:      string;
  templateNameUz:    string;
  templateNameRu:    string;
  priority:          'low' | 'normal' | 'high' | 'urgent';
  language:          'uz' | 'ru';
  basketState:       'inbox' | 'pending' | 'outbox' | 'archived';
  basketEnteredAt:   string;
  isInboxOverdue:    boolean;
  workflowState:     string;
  currentStepOrder:  number;
  senderName:        string | null;
  basketOwnerUserId: number | null;
  createdAt:         string;
  updatedAt:         string;
  attachmentCount?:  number;   // EP-CC-025: fayl soni (optional, mavjud emas esa 0)
}
```

**6.2 — `DocumentCard` — attachment badge (satr 142-162 atrofida):**

```typescript
// BEFORE (satr 142-148 — Row 1 bloki):
      {/* Row 1: priority + ID */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border", badge.color)}>
          {badge.label}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{card.documentNumber}</span>
      </div>
```

```typescript
// AFTER:
      {/* Row 1: priority + ID + attachment badge */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border", badge.color)}>
          {badge.label}
        </span>
        <div className="flex items-center gap-1.5">
          {(card.attachmentCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              <Paperclip size={8} />
              {card.attachmentCount}
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">{card.documentNumber}</span>
        </div>
      </div>
```

**6.3 — `Paperclip` import qo'shish (satr 8-11):**

```typescript
// BEFORE (satr 8-11):
import {
  Loader2, ChevronRight, AlertTriangle, Send, Check, X, RotateCw, Inbox,
} from "lucide-react";
```

```typescript
// AFTER:
import {
  Loader2, ChevronRight, AlertTriangle, Send, Check, X, RotateCw, Inbox, Paperclip,
} from "lucide-react";
```

**DB-proof (BasketColumn uchun):**

`/api/cc/baskets/inbox` endpoint'i `attachmentCount` ni qaytarishi uchun `cc-baskets.repo.ts` (OWNED FILES'da emas) yangilanishi kerak. Bu gap-ni egaga flag qil:

> "P38 FE: `BasketCard.attachmentCount` maydoni tayyor (`BasketColumn.tsx` kengaytirildi), lekin `cc-baskets.repo.ts` (P38 scope tashqarida) `listBasket` SQL-ga `LEFT JOIN cc_attachments COUNT(*)` qo'shishi kerak. Alohida patch."

---

## 5. DDL (GATED — egasi ruxsatisiz ISHGA TUSHIRMA)

### FTS GIN index — migration fayli

```sql
-- Fayl: Uzbek-Language-Module/apps/api/drizzle/0009_cc_fts_index.sql
-- APPROVED: <egasi ismi> <sana>   ← egasi shu qatorni to'ldirishi kerak
-- EP-CC-017: PostgreSQL FTS GIN index for cc_documents full-text search.
-- NOTE: CONCURRENTLY kalit so'zi migration ichida transaction bilan ishlamaydi.
--   Shuning uchun CREATE INDEX (CONCURRENTLY emas) ishlatiladi; prod uchun
--   peak-time-dan tashqarida bajarilishi tavsiya etiladi.

CREATE INDEX IF NOT EXISTS cc_doc_fts_idx
  ON cc_documents
  USING GIN (
    to_tsvector(
      'russian',
      COALESCE(subject, '') || ' ' || COALESCE(ai_body, '')
    )
  );

-- Verify:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename='cc_documents' AND indexname='cc_doc_fts_idx';
```

**MUHIM:** Bu faylni egaga ko'rsat. `-- APPROVED:` qatori to'ldirilgunga qadar `\i` yoki `migrate:latest` ISHGA TUSHIRMA. FTS search funksiya qiladi (tsvector scan bilan, lekin GIN indeksisiz sekin bo'ladi) — index faqat performance uchun kerak.

---

## 6. QABUL MEZONI

### DoD checklist (har xususiyat uchun)

#### EP-CC-017 Full-text search:
- [ ] `GET /api/cc/documents?q=hujjat` → 200, paginatsiyalangan natija
- [ ] `q` bo'lmasa — barcha hujjatlar qaytadi (faqat viewerning hujjatlari)
- [ ] `templateCode` + `dateFrom` + `dateTo` filtrlari ishlaydi
- [ ] DB-proof: `INSERT INTO cc_documents ... WHERE subject LIKE '%test%'` → search topadi
- [ ] BE `tsc 0`
- [ ] Pagination: `page=1&limit=5` → `{ data: [...], total: N, page: 1, limit: 5 }`

#### EP-CC-025 Attachments:
- [ ] `POST /api/cc/documents/:id/attachments` (multipart) → 201, `attachmentId` qaytadi
- [ ] `GET /api/cc/documents/:id/attachments` → ro'yxat qaytadi
- [ ] `GET /api/cc/documents/:id/attachments/:aid/download` → binary fayl
- [ ] DB-proof: `SELECT * FROM cc_attachments WHERE document_id='...'` → qator bor
- [ ] Fayl hajmi limiti ishlaydi (10MB+): 413 yoki 400 qaytadi
- [ ] Noto'g'ri MIME: `text/plain` → 400
- [ ] BE `tsc 0`

#### EP-CC-076 Scan-import:
- [ ] `POST /api/cc/documents/scan-import` (multipart: file + meta JSON) → 201
- [ ] DB-proof: `SELECT workflow_state FROM cc_documents WHERE id='...'` → `'archived'`
- [ ] `cc_attachments`da biriktirilgan fayl bor
- [ ] `cc_audit_trail`da `scan_imported` action bor
- [ ] BE `tsc 0`

#### EP-CC-027 ZVS→Finance:
- [ ] `cc-workflow-approve.helpers.ts` compile: `tsc 0`
- [ ] `ZVS_FINANCE_CODES` to'g'ri: `ZVS`, `ZNO`, `ZRS_ZVS`
- [ ] Event emit backward-compatible (optional params — eski chaqiruvlar ishlaydi)
- [ ] Flag egaga yuborganligi: "`cc-workflow.service.ts` yangilash kerak"

#### EP-CC-063 ORGPOLITIKA → asoschi-PIN yakuniy bosqich (YANGI — Gap 2):
- [ ] `cc-workflow-approve.helpers.ts` da `FOUNDER_PIN_REQUIRED_CODES` konstanta mavjud (`Set(['ORGPOLITIKA'])`)
- [ ] `finalized` blokida ORGPOLITIKA log yozuvi (`EP-CC-063` kodi bilan) mavjud
- [ ] `-- EGASI QIYMATI KERAK` izoh mavjud (FOUNDER kodi + time_limit)
- [ ] P37 0017 faylida ORGPOLITIKA uchun 5-bosqich `FOUNDER` bor (P38 flag sifatida egaga bildirilgan)

#### EP-CC-066 Monthly analytics + spawnRecurring:
- [ ] `cc-sla.cron.ts` compile (OWNED FILES tashqarida — egasi ruxsatidan keyin)
- [ ] `spawnRecurringDocuments` — haqiqiy DB so'rovi bor, stub emas
- [ ] Monthly cron `@Cron('5 0 1 * *')` mavjud
- [ ] Manual trigger test: `generateMonthlyAnalyticsReport()` chaqirilganda DB-proof

#### BasketColumn FE:
- [ ] `BasketCard.attachmentCount?: number` interfeys kengaygan
- [ ] `Paperclip` import qo'shilgan
- [ ] `attachmentCount > 0` bo'lsa — badge ko'rinadi
- [ ] `attachmentCount = 0` yoki undefined — badge ko'rinmaydi
- [ ] FE `tsc 0`
- [ ] Mavjud testlar o'tmadi: regress yo'q (Q-39)

#### Umumiy (golden-thread no-regress):
- [ ] Mavjud endpoint'lar ishlaydi: `POST /api/cc/documents/:id/approve` 200 qaytaradi
- [ ] `GET /api/cc/baskets/inbox` hali ishlaydi
- [ ] `GET /api/cc/documents/:id/pdf` hali ishlaydi
- [ ] PIN sign flow: POST /cc/pin → /cc/documents/:id/send → /cc/documents/:id/approve — buzilmagan

---

## 7. SELF-VERIFY

### 7.1 Backend typecheck

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api run typecheck
# Natija: 0 errors
```

### 7.2 Frontend typecheck

```bash
pnpm --filter erp-dashboard run typecheck
# Natija: 0 errors
```

### 7.3 Search endpoint jonli test

```bash
# Backend ishlab turganida:
curl -s -X GET "http://localhost:3030/api/cc/documents?q=test&limit=5" \
  -H "Authorization: Bearer $JWT" | jq '.data | length'
# Natija: number (0 dan katta bo'lishi shart emas — endpoint ishlashi kerak)

curl -s -X GET "http://localhost:3030/api/cc/documents" \
  -H "Authorization: Bearer $JWT" | jq '.total'
# Natija: number
```

### 7.4 Attachment upload jonli test

```bash
# Test faylini yaratish
echo "test pdf" > /tmp/test-attach.pdf

# Mavjud hujjat ID'sini topish
DOCID=$(node apps/api/_audit/q.cjs "SELECT id::text FROM cc_documents LIMIT 1" | jq -r '.rows[0].id')

curl -s -X POST "http://localhost:3030/api/cc/documents/${DOCID}/attachments" \
  -H "Authorization: Bearer $JWT" \
  -F "file=@/tmp/test-attach.pdf;type=application/pdf" | jq '.'
# Natija: { ok: true, attachmentId: "...", filename: "test-attach.pdf" }

# DB-proof:
node apps/api/_audit/q.cjs "SELECT id, filename, file_size FROM cc_attachments WHERE document_id='${DOCID}'"
# Natija: {id: '...', filename: 'test-attach.pdf', file_size: N}

# Download test:
AID=$(node apps/api/_audit/q.cjs "SELECT id::text FROM cc_attachments WHERE document_id='${DOCID}' LIMIT 1" | jq -r '.rows[0].id')
curl -s -o /tmp/downloaded.pdf "http://localhost:3030/api/cc/documents/${DOCID}/attachments/${AID}/download" \
  -H "Authorization: Bearer $JWT"
ls -la /tmp/downloaded.pdf
# Natija: fayl mavjud, hajmi > 0
```

### 7.5 Scan-import jonli test

```bash
# Meta JSON tayyorlash
META='{"docNumber":"SCAN-2026-001","seriesTag":"A","docDate":"2026-06-19T00:00:00Z","templateCode":"ZRS_ZVS"}'

curl -s -X POST "http://localhost:3030/api/cc/documents/scan-import" \
  -H "Authorization: Bearer $JWT" \
  -F "file=@/tmp/test-attach.pdf;type=application/pdf" \
  -F "meta=${META}" | jq '.'
# Natija: { ok: true, documentId: "...", documentNumber: "...", filename: "..." }

# DB-proof:
node apps/api/_audit/q.cjs "SELECT id, workflow_state, basket_state FROM cc_documents WHERE document_number='SCAN-2026-001'"
# Natija: { workflow_state: 'archived', basket_state: 'outbox' }
```

### 7.6 ZVS trigger compile test

```bash
# cc-workflow-approve.helpers.ts typecheck (fayl o'zi)
pnpm --filter @europrint/api exec tsc --noEmit --project tsconfig.json 2>&1 | grep "cc-workflow-approve"
# Natija: bo'sh (xato yo'q)
```

### 7.7 BasketColumn FE smoke test

```bash
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | grep -i "BasketColumn\|basketcard\|paperclip"
# Natija: bo'sh (xato yo'q)
```

### 7.8 Regress tekshiruv

```bash
# Mavjud endpoint'lar buzilib qolmaganini tekshir:
curl -s "http://localhost:3030/api/cc/baskets/inbox" -H "Authorization: Bearer $JWT" | jq 'keys'
# Natija: ["data"] yoki "total" — 200 qaytarishi kerak

curl -s "http://localhost:3030/api/cc/templates" -H "Authorization: Bearer $JWT" | jq 'length'
# Natija: 14 yoki mavjud shablon soni
```

### 7.9 Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh   | tail -3   # FAIL 0 bo'lsin
bash scripts/reviewer-as-unknown.sh       | tail -3   # yangi FAIL bo'lmasin
bash scripts/reviewer-jwt-guard.sh        | tail -3   # PASS
```

---

## 8. COMMIT

### Commit tartib va format

**Commit 1 — BE search + attachments (cc-documents-read.repo.ts + cc-documents.controller.ts):**

```bash
git add Uzbek-Language-Module/apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-read.repo.ts
git add Uzbek-Language-Module/apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts

git commit -m "feat(cc): EP-CC-017 FTS search + EP-CC-025 attachments + EP-CC-076 scan-import endpoints"
```

**Commit 2 — ZVS trigger + ORGPOLITIKA founder-PIN (cc-workflow-approve.helpers.ts):**

```bash
git add Uzbek-Language-Module/apps/api/src/modules/communication-center/application/cc-workflow/cc-workflow-approve.helpers.ts

git commit -m "feat(cc): EP-CC-027 ZvsApprovedEvent trigger + EP-CC-063 ORGPOLITIKA founder-PIN check (backward-compat)"
```

**Commit 3 — FE BasketColumn attachment badge (BasketColumn.tsx):**

```bash
git add Uzbek-Language-Module/artifacts/erp-dashboard/src/components/cc/BasketColumn.tsx

git commit -m "feat(cc-fe): EP-CC-025 attachment count badge in BasketColumn"
```

**Commit 4 — Monthly analytics cron + spawnRecurring (egasi ruxsatidan keyin):**

Egasi `cc-sla.cron.ts` uchun ruxsat berganda:

```bash
git add Uzbek-Language-Module/apps/api/src/modules/communication-center/cron/cc-sla.cron.ts

git commit -m "feat(cc): EP-CC-066 monthly analytics cron + real spawnRecurringDocuments (stub→real)"
```

**Commit 5 — module.ts (agar provider ro'yxati yangilangan bo'lsa):**

```bash
git add Uzbek-Language-Module/apps/api/src/modules/communication-center/communication-center.module.ts

git commit -m "feat(cc): update module providers/exports for P38 new services"
```

### TAQIQLANGAN amallar

```bash
# HECH QACHON:
git add -A
git add .

# Faqat aniq fayl:
git add <fayl-nomi>
```

---

## Egaga xabar berish kerak bo'lgan flaglar

P38 bajarilgandan keyin egaga quyidagi gap-larni bildiring:

| Flag | Sabab | Kerakli ish |
|------|-------|-------------|
| ZVS trigger to'liq ishlashi uchun | `cc-workflow.service.ts` `eventEmitter` + `templateCode` uzatmaydi | `cc-workflow.service.ts` yangilash (P38 scope tashqarida) |
| Attachment badge BE side | `cc-baskets.repo.ts` `listBasket` SQL `attachmentCount` ni kaytarmaydi | `cc-baskets.repo.ts` LEFT JOIN qo'shish (P38 scope tashqarida) |
| Monthly cron + spawnRecurring | `cc-sla.cron.ts` P38 scope tashqarida — egasi ruxsati kerak | Ruxsat so'raladi |
| FTS GIN index (performance) | `0009_cc_fts_index.sql` tayyorlandi lekin GATED | Egasi `-- APPROVED:` to'ldiradi va `migrate:latest` ishga tushiradi |
| Finance listener | `ZvsApprovedEvent` emit tayyor — Finance modulida `'cc.zvs_approved'` tinglovchi yo'q | Finance moduli agenti (alohida paket) |
| EP-CC-063 ORGPOLITIKA FOUNDER roli | `FOUNDER_PIN_REQUIRED_CODES` tayyor, lekin `org_functions`da 'FOUNDER' kodi mavjudligini egasi tasdiqlashi kerak | Egasi Ayubxon Pozilov — owner lavozim kartasi org_functions da 'FOUNDER' kodi bilan yaratilishi kerak. EGASI QIYMATI KERAK. |
| EP-CC-063 ORGPOLITIKA 5-bosqich seed | P37 0017 faylida qo'shilgan, lekin gated — egasi ruxsatidan keyin ishga tushadi | P37 tasdiqlanganda 0017 migratsiyasi bilan birga |

---

## P38 xulosa

**Bajarilgan:**
- `cc-documents.controller.ts` — 5 yangi endpoint (FTS search, attachment upload/list/download, scan-import)
- `cc-documents-read.repo.ts` — 2 yangi metod (`searchDocuments`, `listAttachments`) + `AttachmentRow` tip
- `cc-workflow-approve.helpers.ts` — ZVS/ZNO Finance trigger (backward-compatible optional params) + EP-CC-063 ORGPOLITIKA founder-PIN log + `FOUNDER_PIN_REQUIRED_CODES` konstanta
- `BasketColumn.tsx` — `attachmentCount` interface kengaytmasi + Paperclip badge

**Scope tashqarida (egasi flaglagan):**
- `cc-sla.cron.ts` — egasi ruxsatidan keyin: monthly cron + spawnRecurring stub→real
- `cc-workflow.service.ts` — ZVS trigger aktivatsiya uchun yangilash
- `cc-baskets.repo.ts` — attachment count JOIN
- Finance listener — alohida paket/agent
- `0009_cc_fts_index.sql` — egasi `-- APPROVED:` to'ldiradi
- EP-CC-063: `org_functions`da `FOUNDER` kodi yaratish — egasi tasdiqi kerak (EGASI QIYMATI KERAK)

**EP kodlari yopildi:** EP-CC-017, EP-CC-025, EP-CC-076, EP-CC-027 (qisman), EP-CC-063 (qisman — log tayyor, FOUNDER kodi egasi qiymati kutilmoqda), EP-CC-066 (egasi ruxsatidan keyin)
