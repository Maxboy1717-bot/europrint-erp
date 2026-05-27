# Audit: 02 — CRM Lead Oqimi Trace

**Sana:** 2026-05-25

---

## 1. Frontend: Lead Yaratish Formasi

**Fayl:** `artifacts/erp-dashboard/src/components/crm/quick-create/LeadForm.tsx`

`react-hook-form` + `zodResolver` bilan bog'langan forma. Quyidagi fieldlar mavjud:

| Field | Tip | Majburiy |
|---|---|---|
| title | string | Ha |
| name | string | Yo'q |
| lastName | string | Yo'q |
| phone | string | Yo'q |
| email | string | Yo'q |
| companyTitle | string | Yo'q |
| source | string | Yo'q |
| sourceDescription | string | Yo'q |
| priority | string | Ha (default: "normal") |
| budget | number | Yo'q |
| opportunityAmount | number | Yo'q |
| comments | string | Yo'q |
| assignedById | string | Yo'q |

**Schema:** `artifacts/erp-dashboard/src/components/crm/quick-create/lead-schema.ts` (Zod validatsiya)

**Muammo 1 (Minor):** `priority` field payload'ga kiritilgan (`priority: data.priority`), lekin `LeadCreateSchema` (backend, `crm-leads.controller.ts:20-37`) da `priority` qabul qilmaydi — u passthrough orqali o'tadi. Schema'da e'lon qilinmagan, faqat DB schemada `sourceScore` mavjud, `priority` ustuni yo'q.

**Muammo 2 (Jiddiy):** `opportunityAmount` ikki xil nom bilan yuboriladi:
```ts
// LeadForm.tsx:79
opportunityAmount: data.opportunityAmount?.toString() || null,
opportunity:       data.opportunityAmount  || null,   // also map to opportunity field
```
Backend `normalizeLeadDto` funksiyasi ikkalasini ham kutmaydi — faqat `dto.companyId`, `dto.assignedTo`/`dto.assignedById` ni normalize qiladi. `opportunityAmount` yo'qolib ketadi.

---

## 2. API Chaqiruvi

**Fayl:** `artifacts/erp-dashboard/src/components/crm/quick-create/LeadForm.tsx:83`

```
POST /api/crm/leads/quick
```

**Payload:**
```json
{
  "title": "...",
  "name": "...",
  "lastName": "...",
  "companyTitle": "...",
  "phones": [{"value": "...", "type": "WORK"}],
  "emails": [{"value": "...", "type": "WORK"}],
  "sourceId": "...",
  "sourceDescription": "...",
  "priority": "normal",
  "budget": "0",
  "opportunityAmount": "0",
  "opportunity": 0,
  "comments": "...",
  "assignedById": "..."
}
```

**Muammo 3 (Jiddiy):** `lib/api/crm.ts:9` da `crmApi.createLead()` boshqa endpoint ishlatadi:
```
POST /api/crm/leads
```
LeadForm esa `POST /api/crm/leads/quick` ga to'g'ridan `apiRequest` chaqiradi, `crmApi.createLead()` ni ishlatmaydi. Ikki xil yo'l — kod nomuvofiq.

---

## 3. Backend: CRM Controller

**Fayl:** `apps/api/src/modules/crm/presentation/crm-leads.controller.ts`

**Routlar:**

| Method | Path | Handler | Arxitektura |
|---|---|---|---|
| GET | /crm/leads | `list()` | `LeadsService.findAll()` — to'g'ridan service |
| GET | /crm/leads/quick | `quickLeads()` | `LeadsService.findAll()` — to'g'ridan service |
| GET | /crm/leads/:id | `getById()` | `LeadsService.findOne()` |
| POST | /crm/leads | `create()` | `LeadsService.create()` — **CQRS yo'q** |
| PATCH | /crm/leads/:id/stage | `updateStage()` | `LeadsService.update()` — **CQRS yo'q** |
| PATCH | /crm/leads/:id/qualify | `qualify()` | `commandBus.execute(QualifyLeadCommand)` — CQRS |
| POST | /crm/leads/quick | `createQuickLead()` | `LeadsService.create()` — **CQRS yo'q** |

**Muammo 4 (Arxitektura):** `POST /crm/leads` va `POST /crm/leads/quick` CQRS `commandBus` orqali emas, to'g'ridan `LeadsService.create()` ni chaqiradi. Loyihada `CreateLeadHandler` mavjud (`create-lead.handler.ts`), lekin controller uni ishlatmaydi.

**Muammo 5 (Arxitektura):** `PATCH /crm/leads/:id/stage` `LeadsService.update()` ni chaqiradi. `crm-leads-ops.controller.ts` da esa `PATCH /crm/leads/:id/pipeline-stage` `UpdateLeadStageCommand` (CQRS) ishlatadi. Bir xil operatsiya uchun ikkita endpoint — ikki xil arxitektura.

**Guard:** `JwtAuthGuard` + `RolesGuard` mavjud. Ruxsat berilgan rollar: `['sales_manager', 'SALES', 'crm_manager', 'director', 'super_admin']`.

**Normalizatsiya funksiyasi (`normalizeLeadDto`, satr 57-72):** Bitrix-style payload'ni camelCase'ga aylantiradi. Lekin `title`, `companyTitle`, `sourceDescription`, `budget`, `opportunityAmount`, `priority`, `comments` fieldlari normalize qilinmaydi — yo'qolib ketadi.

---

## 4. CQRS Handler

**Fayl:** `apps/api/src/modules/crm/application/commands/create-lead.handler.ts`

`CreateLeadHandler` mavjud, lekin `POST /crm/leads` controller tomonidan **ishlatilmaydi**. Handler quyidagilari qiladi:

1. Email bo'yicha duplicate tekshiruvi (`leadRepo.findByEmail`)
2. Value Object'lar yaratadi: `Email`, `PhoneNumber`, `LeadStatus`, `AIScore`
3. `AIScore` — **`Math.random() * 100`** (satr 86) — tasodifiy son, haqiqiy AI yo'q
4. `leadRepo.save(lead)` — `DrizzleLeadRepository` ga yozadi

**Muammo 6 (Jiddiy):** Handler ishlatilmaydi. Controller to'g'ridan `LeadsService → DrizzleCrmLeadsRepository` ga boradi. Ya'ni:
- Duplicate email tekshiruvi yo'q
- Domain aggregate (`Lead`) yaratilmaydi
- Domain event'lar chiqarilmaydi
- DDD pattern buziladi

**Fayl:** `apps/api/src/modules/crm/application/commands/update-lead-stage.handler.ts`

`UpdateLeadStageHandler` CQRS orqali ishlaydi:
1. `repo.findStage(stageId)` — stage mavjudligini tekshiradi
2. `repo.updateLeadStage(leadId, stageId)` — yangilaydi
3. Ixtiyoriy: `repo.insertActivityNote(leadId, notes)` — faoliyat yozadi

---

## 5. Repository — save() Tahlili

**Ikki parallel repository mavjud:**

### A. `DrizzleLeadRepository` (Domain repo)
**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/drizzle-lead.repo.ts`

`save()` metodi yozadigan fieldlar (9 ta):
- `customer_id`, `status`, `status_description` (ai_score bilan), `contact_email`, `contact_phone`, `contact_name`, `source`, `notes`, `manager_id`, `created_at`, `updated_at`

**Schema bilan solishtirish** (`crm-contacts.ts`, `crmLeads` table):

| Schema ustuni | `save()` da yoziladi | Izoh |
|---|---|---|
| `title` | **Yo'q** | Majburiy (`notNull()`) — DB xatosi |
| `name` | **Yo'q** | `contact_name` orqali bilvosita |
| `lastName` | **Yo'q** | — |
| `companyTitle` | **Yo'q** | — |
| `sourceId` | **Yo'q** | `source` ishlatilgan (noto'g'ri ustun nomi) |
| `statusId` | **Yo'q** | `status` ishlatilgan (noto'g'ri ustun nomi) |
| `phones` | **Yo'q** | JSONB, yo'qolib ketadi |
| `emails` | **Yo'q** | JSONB, yo'qolib ketadi |
| `assignedById` | **Yo'q** | `manager_id` ishlatilgan (noto'g'ri ustun) |
| `budget` | **Yo'q** | — |
| `opportunityAmount` | **Yo'q** | — |
| `comments` | **Yo'q** | — |

**Muammo 7 (Kritik):** `DrizzleLeadRepository.save()` `title` ustunini yozmaydi, lekin schema `title text NOT NULL` deb talab qiladi. Agar `CreateLeadHandler` ishlatilsa, DB `NOT NULL constraint` xatosi beradi.

**Muammo 8 (Kritik):** `save()` `source` va `status` kabi eski `contact_*` ustun nomlarini ishlatadi, holbuki schema Bitrix24 uslubidagi `sourceId`, `statusId` ustunlarini kutadi. Bu repo eski sxemaga (migration'dan oldingi holat) yozilgan, yangi sxema bilan mos emas.

### B. `DrizzleCrmLeadsRepository` (Application repo)
**Fayl:** `apps/api/src/modules/crm/leads/drizzle-crm-leads.repo.ts`

`create()` metodi yozadigan fieldlar (8 ta):
- `contact_name`, `contact_phone`, `contact_email`, `status`, `source`, `notes`, `customer_id`, `manager_id`

**Muammo 9 (Kritik):** Bu repo ham eski ustun nomlarini (`contact_name`, `contact_phone`) ishlatadi. Schema'da bu ustunlar yo'q — faqat `name`, `lastName`, `phones` (JSONB) mavjud. Runtime da Drizzle bu field'larni topa olmaydi va insert xato beradi.

**Muammo 10 (Kritik):** `softDelete()` `crmLeads.deleted_at` (snake_case) ishlatadi (satr 93), lekin Drizzle accessor camelCase bo'lishi kerak: `crmLeads.deletedAt`. Bu runtime xatosiga olib keladi.

---

## 6. Schema Moslik Tekshiruvi

**Schema fayl:** `lib/db/src/schema/crm-contacts.ts` — `crmLeads` table

Schema (Bitrix24 uslub) vs Repository yozish:

| Schema ustuni | Domain Repo (`drizzle-lead.repo.ts`) | App Repo (`drizzle-crm-leads.repo.ts`) |
|---|---|---|
| `title` (NOT NULL) | Yo'q — **Kritik xato** | Yo'q — **Kritik xato** |
| `name` | Yo'q | Yo'q |
| `lastName` | Yo'q | Yo'q |
| `companyTitle` | Yo'q | Yo'q |
| `sourceId` | `source` (noto'g'ri nom) | `source` (noto'g'ri nom) |
| `statusId` | `status` (noto'g'ri nom) | `status` (noto'g'ri nom) |
| `phones` (JSONB) | Yo'q | Yo'q |
| `emails` (JSONB) | Yo'q | Yo'q |
| `assignedById` | `manager_id` (noto'g'ri nom) | `manager_id` (noto'g'ri nom) |
| `budget` | Yo'q | Yo'q |
| `opportunityAmount` | Yo'q | Yo'q |
| `comments` | Yo'q | Yo'q |
| `deletedAt` | `deleted_at` (satr 93) — **Runtime xato** | `deleted_at` (satr 93) — **Runtime xato** |

**Xulosa:** Ikkala repository ham schema bilan mos emas. Bu migratsiya yoki refaktoring chala qolganini ko'rsatadi.

---

## 7. Kanban Drag-Drop

**Frontend hook:** `artifacts/erp-dashboard/src/components/crm/workspace/useCRMWorkspace.ts`

`handleDragEnd` (satr 212-235) `@dnd-kit/core` `DragEndEvent`'ini qabul qiladi:
1. `over.data.current?.stageId` ni oladi
2. `moveItemMutation.mutate({ itemId, stageId })` chaqiradi

`moveItemMutation` (satr 159-185):
- Leads uchun: `PATCH /api/crm/leads/{id}/stage` body: `{ stage_id: stageId }`
- Deals uchun: `PATCH /api/crm/deals/{id}/stage`

**Backend (kanban uchun):** `crm-leads.controller.ts:151-158`
```ts
@Patch(':id/stage')
async updateStage(@Param('id') id: string, @Body() dto: unknown) {
  const statusId = String(parsed.stage_id ?? parsed.statusId ?? parsed.stageId ?? parsed.status ?? 'NEW');
  const res = await this.leadsService.update(id, { status: statusId.toLowerCase() });
}
```

Bu `LeadsService.update()` → `DrizzleCrmLeadsRepository.update()` chaqiradi:
```ts
await db.update(crmLeads).set(dto as Partial<...>).where(eq(crmLeads.id, id))
```

**Muammo 11 (Jiddiy):** `{ status: "new" }` ni update qiladi, lekin sxemada ustun `statusId` (camelCase). Drizzle `status` nomini taniy olmaydi — update hech narsa o'zgartirmaydi (silent fail).

**`crm-leads-ops.controller.ts` da parallel endpoint:**
- `PATCH /crm/leads/:id/pipeline-stage` — `UpdateLeadStageCommand` (CQRS) orqali ishlaydi
- Bu CQRS handler `findStage()` va `updateLeadStage()` qiladi va stage ID ni integer sifatida kutadi
- Frontend esa `PATCH /crm/leads/:id/stage` ga string `stageId` yuboradi

**Muammo 12 (Arxitektura):** Ikkita stage update endpoint mavjud, frontend faqat bittasini (eski, to'g'ridan service) ishlatadi. CQRS endpoint (`/pipeline-stage`) frontend tomonidan ishlatilmaydi.

---

## 8. Convert to Deal

**Frontend button:** `artifacts/erp-dashboard/src/components/crm/lead/LeadActions.tsx:31-38`
- "Dealga o'tkazish" tugmasi mavjud (`data-testid="button-convert-lead"`)
- `onConvert` callback chaqiradi

**Frontend API:** `artifacts/erp-dashboard/src/lib/api/crm.ts:17`
```ts
convertLead: (id, data?) => apiRequest("POST", `/api/crm/leads/${id}/convert`, data)
```

**Backend handler:** `apps/api/src/modules/crm/presentation/crm-leads-ops.controller.ts:80-93`
```
POST /crm/leads/:id/convert → ConvertLeadToDealCommand (CQRS)
```

`ConvertLeadToDealHandler` (`apps/api/src/modules/crm/application/commands/convert-lead-to-deal.handler.ts`):
1. Lead'ni `leadRepo.findById()` bilan yuklaydi — **`DrizzleLeadRepository`** (domain repo)
2. `Lead.convertToDeal()` — faqat "qualified" lead'lar convert bo'lishi mumkin
3. `dealRepo.save(deal)` — yangi deal saqlaydi
4. `lead.convertToDeal(dealId)` — lead statusini o'zgartiradi
5. `leadRepo.update(lead)` — lead'ni yangilaydi
6. `LeadConvertedEvent` publish qiladi

**Muammo 13 (Kritik):** `ConvertLeadToDealHandler` `DrizzleLeadRepository.findById()` ishlatadi (satr 61-64). Bu repo `toDomain()` da `row['email']`, `row['first_name']`, `row['ai_score']` ustunlarini kutadi (satr 136-150), lekin schema'da bu ustunlar yo'q (`contact_email`, `contact_name`, `status_description` eski ustunlar edi). `toDomain()` bo'sh qiymatlar qaytaradi.

**Muammo 14 (Jiddiy):** `Lead.convertToDeal()` faqat "qualified" lead'larni convert qiladi. Lekin Lead hech qachon "qualify" bo'lmagan bo'lsa (chunki `CreateLeadHandler` ishlatilmaydi va qualify oqimi to'liq ishlamaydi), convert hamisha xato beradi.

---

## Oqim Xulosasi

| Qadam | Holat | Muammo |
|---|---|---|
| LeadForm — render va validatsiya | Ishlaydi | `priority`, `budget`, `opportunityAmount` backend schema bilan mos emas |
| LeadForm → `POST /api/crm/leads/quick` | Yetib boradi | Payload normalize qilinganda ko'p field yo'qoladi |
| Controller `createQuickLead()` | Ishlaydi | CQRS ishlatilmaydi, `CreateLeadHandler` bypass |
| `LeadsService.create()` | Ishlaydi | — |
| `DrizzleCrmLeadsRepository.create()` | **Buzilib ketgan** | Eski `contact_*` ustunlarini ishlatadi, yangi schema bilan mos emas |
| DB insert (crm_leads) | **Xato** | `title NOT NULL` constraint buziladi; ustun nomlari noto'g'ri |
| Kanban drag-drop → `PATCH /stage` | **Silent fail** | `status` field nomi noto'g'ri — DB update hech narsa o'zgartirmaydi |
| Convert to Deal → `POST /convert` | **Xato** | `DrizzleLeadRepository.toDomain()` noto'g'ri ustun nomlaridan bo'sh Lead qaytaradi; "qualified" tekshiruvi muvaffaqiyatsiz |
| `LeadConvertedEvent` publish | **Yetib bormaydi** | Oldingi qadam xato beradi |

### Kritik muammolar ro'yxati

1. **`crm_leads` table `title NOT NULL`** — ikki repository ham `title` yozmaydi. Har qanday insert xato beradi.
2. **Eski ustun nomlari** — `contact_name`, `contact_phone`, `status`, `source`, `manager_id` ishlatilmoqda; schema `name`, `phones` (JSONB), `statusId`, `sourceId`, `assignedById` kutadi. Bu migratsiya schema'si bilan repo sinxronlashtirilmagan.
3. **`crmLeads.deleted_at` vs `crmLeads.deletedAt`** — Drizzle ORM camelCase accessor kerak, snake_case runtime xatosi beradi.
4. **`CreateLeadHandler` ishlatilmaydi** — CQRS pattern e'lon qilingan, lekin controller bypass qiladi. Domain logic, duplicate check, domain events ishlamaydi.
5. **Kanban stage update silent fail** — `{ status: "new" }` noto'g'ri field nom, hech narsa o'zgarmaydi.
6. **Convert to Deal** — `toDomain()` noto'g'ri field nomlar tufayli bo'sh Lead qaytaradi; convert oqimi ishlamaydi.
7. **Ikkita parallel repository** — `DrizzleLeadRepository` (domain) va `DrizzleCrmLeadsRepository` (application) — ikkalasi ham schema bilan mos emas va bir-biridan farqli ustun nomlari ishlatadi.
