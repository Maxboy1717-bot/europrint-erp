# P01 — GOLDEN: Integration: lib/db schema barrel owner

> **Paket:** P01 | **Modul:** GOLDEN | **To'lqin:** Wave 1 | **DDL darvozasi:** YO'Q
> **Sana yaratildi:** 2026-06-19
> **Fayl:** `lib/db/src/schema/index.ts` — yagona egalik

---

## 0. ROL VA QOIDALAR

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg.
    Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida
    `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit=bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Ushbu agentning to'lqini:** Wave 1 (barcha parallel agentlarning BIRINCHI to'lqini ichida ishlaydi).
**dependsOn:** `[]` — bu agent boshqa hech kimga bog'liq emas. Wave 1 ichida BIRINCHI ishga tushadi.
**Ushbu agent boshqalarga bog'liqlik yaratadi:** Wave 1 da yangi schema fayl yaratgan barcha 49 paket ushbu agentning MANIFEST ro'yxatidan foydalanadi. Ushbu P01 oxirgi bo'lib commit qiladi — sibling paketlarning manifest xabarlarini to'plagan so'ng.

---

## 1. IZOLYATSIYA MANIFESTI

### Faqat shu faylga teg:

```
lib/db/src/schema/index.ts
```

**Mutlaq qoida:** Yuqoridagi bitta fayldan boshqa hech qanday faylni o'zgartirmang, yaratmang, o'chirmang. Boshqa schema fayl ichida xato topsangiz yoki yangi pgTable kerak bo'lsa — TO'XTA, flag qiling, o'zingiz tuzatmang.

### DDL darvozasi: YO'Q

Bu paketda DDL (CREATE TABLE, migration SQL) kerak emas. Barrel faqat `export * from` / `export { ... } from` satrlaridan iborat. Yangi pgTable yaratish boshqa paketlarga tegishli; ularni bu paket faqat RE-EXPORT qiladi.

### Owned file joriy holati:

Fayl: `lib/db/src/schema/index.ts` — 85 qator (2026-06-19 da o'lchandi).

```
// Hozirgi tarkib xulasasi (to'liq ro'yxat §3 da):
//   export * from "./core-schema";           ← line 6
//   export * from "./crm-schema";            ← line 7
//   ... (jami ~40 ta eksport)
//   export { employees, ... } from "./employees"; ← line 82
// Oxirgi satr: 85
```

---

## 2. VIZYON

### Rolning maqsadi (master vizyon)

`lib/db/src/schema/index.ts` — `@workspace/db` paketi (`lib/db`) ning yagona umumiy eshigi. Har qanday backend modul yangi pgTable ishlatmoqchi bo'lganda:

```typescript
import { myNewTable } from '@workspace/db';
```

deb yozadi. Bu import FAQAT `index.ts` barrel orqali ishlaydi. Agar yangi schema fayli barrel ichida ko'rsatilmagan bo'lsa, `@workspace/db` dan import qilingan paytda `Cannot find module` yoki `has no exported member` TypeScript xatosi chiqadi. Bu 50-agent qurishning asosiy integratsiya xavfi.

### Wave 1 da kutilayotgan yangi schema fayllar (manifest):

50-agentlik parallel qurishda quyidagi paketlar Wave 1 da YANGI schema fayllari yaratishi kutiladi. Ular commit qilishdan OLDIN bu agentga MANIFEST xabari yuboradi (aniq fayl nomi bilan). Ushbu agent o'sha manifest asosida `index.ts` ga satr qo'shadi:

| Kutilayotgan emas fayl (Wave 1 sibling manifest) | Ega paket | Eslatma |
|---|---|---|
| `lib/db/src/schema/org-employee-cards.ts` | ORG-paket | employee_cards, card_folders |
| `lib/db/src/schema/ntf-schema.ts` | NTF-paket | notifications tables |
| `lib/db/src/schema/hr-v2-additions.ts` yoki shunga o'xshash | HR-paket | Wave 1 HR yangiliklari |
| `lib/db/src/schema/ai-schema.ts` yoki `ai-planning-schema.ts` | AI-paket | AI planning tables |
| Boshqa sibling manifest fayllar | Har bir Wave-1 paket | Aniq nom manifestdan keladi |

> MUHIM: Yuqoridagi jadval TAXMIN. Aniq fayl nomi har bir sibling paket COMMIT qilgandan keyin manifest xabari sifatida keladi. Bu agent o'sha aniq nomga qarab `index.ts` ga satr yozadi — taxmin bo'yicha emas.

### Qabul mezoni (vizyon mosligi):

1. `@workspace/db` dan import qilingan BARCHA pgTable TypeScript da resolve bo'ladi (tsc 0).
2. `lib/db` build PASS: `pnpm --filter @workspace/db run build` xatosiz tugaydi.
3. Yangi schema fayl yaratgan har bir sibling paket o'z pgTable ni `@workspace/db` dan import qila oladi — alohida fayl yo'lida emas.
4. Mavjud (hozir ishlayotgan) eksportlar o'chirilmaydi, o'zgartirilmaydi (Q-46).
5. Dublikat simvol (bir xil nom ikki fayldan eksport) bo'lmaydi — export ziddiyat TypeScript tsc xatosi beradi.

---

## 3. HOZIRGI HOLAT

### Mavjud eksportlar (index.ts, 2026-06-19):

```typescript
// lib/db/src/schema/index.ts — HOZIRGI 85 SATR:

// line 1-5: JSDoc header
/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

// line 6-18: Asosiy sxema barellari
export * from "./core-schema";
export * from "./crm-schema";
export * from "./design-schema";
export * from "./ecommerce-schema";
export * from "./fi-schema";
export * from "./hr-schema";
export * from "./hr-recruiter";
export * from "./iot-schema";
export * from "./kanban-schema";
export * from "./kanban-extended";
export * from "./lms-schema";
export * from "./lms-extended";
export * from "./website-extended";

// line 19-35: pos-schema selektiv (dublikat simvollar bor)
export {
  posMovementTypes,
  insertPosMovementTypeSchema,
  posWarehouseAccess,
  insertPosWarehouseAccessSchema,
  roleMovementPermissions,
  insertRoleMovementPermissionSchema,
  posTelegramRoutes,
  insertPosTelegramRouteSchema,
  inventoryPassports,
  insertInventoryPassportSchema,
  inventoryBarcodeAssignments,
  insertInventoryBarcodeAssignmentSchema,
  insertPosMovementLineSchema,
  posPdfTemplates,
  insertPosPdfTemplateSchema,
} from "./pos-schema";

// line 36-82: Qolgan sxemalar
export * from "./pos-schema-v2";
export * from "./pos-schema-extensions";
export * from "./mm-material-cards";
export * from "./marketing-schema";
export * from "./mm-schema";
export * from "./pp-schema";
export * from "./qc-schema";
export * from "./saas-schema";
export * from "./sd-europrint-schema";
export * from "./sd-schema";
export * from "./security-ops-schema";
export * from "./strategic-ext-schema";
export * from "./wms-schema";
export * from "./ai-providers-schema";
export * from "./numeric-money";
export * from "./master-config";
export * from "./position-permissions";
export * from "./hr-v2-schema";
export * from "./weekly-plans-schema";
export * from "./ideal-rasm-schema";
export * from "./kaizen-schema";
export * from "./orders-registry-schema";
export * from "./hr-tz2-schema";
export * from "./order-workflow-schema";
export {
  // Selectively re-export from hr-architecture-additions to avoid duplicate symbols
  // (aiCvScreenings, jobTemplates, questionnaireQuestions, questionnaireTemplates
  //  are defined elsewhere — they're the authoritative copies).
} from "./hr-architecture-additions";
export * from "./pos-retail";
export {
  // Re-export ONLY symbols unique to admin-assets; AssetDisposal/AssetTransfer
  // etc. are the authoritative copies in pp/pp-enhanced.
  assetItems, insertAssetItemSchema, assetMaintenance,
} from "./admin-assets";
export type { AssetItem, InsertAssetItem, AssetMaintenance } from "./admin-assets";
export * from "./fi-financial-reports";
export * from "./communication-center";
export * from "./sd-customer-relations";
export * from "./aisha-schema";
export * from "./chat-schema";
export * from "./hr-overtime-schema";
export * from "./mes-schema";
export * from "./agent-schema";
// Selective re-export from employees.ts
export { employees, insertEmployeeSchema } from "./employees";
export type { Employee, InsertEmployee } from "./employees";
// users already exported via core-schema
```

### Hozir barrel ichida YO'Q bo'lgan schema fayllar:

Audit natijasi (2026-06-19 da `lib/db/src/schema/` papkasi skanlanib topildi):

```
# BARRELDA YO'Q — 64 ta fayl (Wave 1 singling kerak bo'lishi mumkin):

adaptation.ts            ← adaptation tables
ai-analytics-schema.ts   ← BO'SH (barcha table olib tashlangan, faqat JSDoc qolgan)
assessment.ts            ← assessment tables
attendance.ts            ← attendance tables
crm-activities.ts        ← CRM activities
crm-contacts.ts          ← CRM contacts
crm-core.ts              ← CRM core
crm-deal-products.ts     ← CRM deal products
crm-deals.ts             ← CRM deals
crm-docs.ts              ← CRM docs
crm-extended.ts          ← CRM extended
crm-pipelines.ts         ← CRM pipelines
crm-proposals.ts         ← CRM proposals
departments.ts           ← departments
discipline.ts            ← discipline tables
fi-advanced.ts           ← Finance advanced
fi-ap-ar.ts              ← Finance AP/AR
fi-ap-core.ts            ← Finance AP core
fi-banking.ts            ← Finance banking
fi-budgets.ts            ← Finance budgets
fi-expenses.ts           ← Finance expenses
fi-gl.ts                 ← Finance GL
fi-kassa.ts              ← Finance kassa
fi-payroll-calc.ts       ← Finance payroll calc
fi-payroll-ext.ts        ← Finance payroll ext
hr-compensation.ts       ← HR compensation
hr-employees-docs.ts     ← HR employee docs
hr-extended.ts           ← HR extended
hr-goals.ts              ← HR goals
hr-missing-schema.ts     ← HR missing tables
hr-performance-core.ts   ← HR performance core
hr-performance-ext.ts    ← HR performance ext
hr-performance.ts        ← HR performance
hr-personal-core.ts      ← HR personal core
hr-personal.ts           ← HR personal
hr-questionnaire.ts      ← HR questionnaire
hr-recruitment.ts        ← HR recruitment
hr-safety.ts             ← HR safety
hr-transfers.ts          ← HR transfers
kpi.ts                   ← KPI tables
leave.ts                 ← Leave tables
lms.ts                   ← LMS tables
mm-advanced.ts           ← MM advanced
mm-batch-mgmt.ts         ← MM batch
mm-inventory.ts          ← MM inventory
mm-logistics.ts          ← MM logistics
mm-materials.ts          ← MM materials
mm-mro.ts                ← MM MRO
mm-procurement.ts        ← MM procurement
mm-purchase.ts           ← MM purchase
mm-raw-materials.ts      ← MM raw materials
payroll.ts               ← Payroll tables
positions.ts             ← Positions tables
recruitment.ts           ← Recruitment tables
safety.ts                ← Safety tables
sd-billing.ts            ← SD billing
sd-core.ts               ← SD core
sd-delivery.ts           ← SD delivery
sd-extended.ts           ← SD extended
sd-order-items.ts        ← SD order items
sd-orders.ts             ← SD orders
shifts.ts                ← Shifts tables
skills.ts                ← Skills tables
```

### Muhim topilma:

`ai-analytics-schema.ts` — BO'SH fayl (barcha pgTable lar olib tashlangan, faqat JSDoc bor). Bu faylni barrelga qo'shish zarur emas (bo'sh eksport=xato chiqmaydi lekin ma'nosiz). FAQAT Wave 1 manifest da ko'rsatilsa qo'shiladi.

`hr-compensation.ts` — mavjud, pgTable ta'riflari bor. Lekin bu fayl `hr-recruitment` dan import qiladi; dublikat simvol xavfi bor (§4 da tekshiriladi).

---

## 4. ISH (qadam-baqadam)

### Ushbu agentning ish tartibi Wave 1 da:

```
BOSQICH A: TAYYORGARLIK (boshida)
BOSQICH B: MANIFEST KUTISH (sibling paketlar commit qilguncha)
BOSQICH C: MANIFEST QAYTA ISHLASH (har bir sibling commit dan keyin)
BOSQICH D: ZIDDIYAT TEKSHIRUV (export dublikat skan)
BOSQICH E: BARREL YANGILASH (index.ts ga qo'shish)
BOSQICH F: TSC + BUILD TEKSHIRUV
BOSQICH G: COMMIT
```

---

### Qadam 1: Tayyorgarlik — hozirgi holat tekshiruvi

**Fayl:** `lib/db/src/schema/index.ts`

**Amal:** Read-only. Faylni o'qib, hozirgi eksportlar ro'yxatini xotirada saqlang.

**Maqsad:** Mavjud eksportlarni bilmasdan yangi qo'shsangiz dublikat simvol xatosi chiqishi mumkin.

```bash
# Hozirgi eksportlar:
grep -n "export.*from" lib/db/src/schema/index.ts
# Natija: ~40 ta satr ko'rinadi (§3 da to'liq ro'yxat)
```

**Qoida (Q-46):** Hozirgi 85 satrdan BITTA HAM o'chirilmaydi yoki o'zgartirilmaydi. Faqat YANGI satrlar qo'shiladi.

---

### Qadam 2: Sibling paket manifest protokoli

**Kontekst:** 50-agent parallel qurishda Wave 1 da quyidagi paketlar yangi schema fayllari yaratadi:
- ORG paket: `org-employee-cards.ts` yoki shunga o'xshash
- NTF paket: `ntf-schema.ts` yoki shunga o'xshash
- AI paket: `ai-planning-schema.ts` yoki shunga o'xshash
- HR paket: Yangi HR schema fayllar
- Boshqa Wave 1 paketlar: Aniq fayl nomlari manifestdan keladi

**Manifest protokoli:**

Har bir sibling Wave-1 agent o'z yangi schema faylini yaratgach, shu agentga (P01) xabar yuboradi:

```
FORMAT:
MANIFEST: <paket-id> → lib/db/src/schema/<fayl-nomi>.ts
SIMVOLLAR: <pgTable1>, <pgTable2>, ... (eksport qilinadigan asosiy nomlar)
DUBLIKAT_XAVF: [yo'q | <simvol-nomi> — <boshqa-fayl>da ham bor]
```

**Bu agent manifestsiz hech narsa qo'shmaydi.** Taxmin bo'yicha fayl nomi yozish TAQIQ.

---

### Qadam 3: Har bir manifest uchun — ziddiyat tekshiruvi

**Fayl:** `lib/db/src/schema/index.ts` + manifest dagi yangi fayl

**Maqsad:** Yangi fayl eksport qilgan simvollar mavjud barrel eksportlarda bor-yo'qligini tekshirish.

**Amal (har bir manifest uchun):**

```bash
# 1. Yangi faylning eksportlarini ko'r:
grep -n "^export " lib/db/src/schema/<yangi-fayl>.ts

# 2. Shu nomlar hozirgi barrel da bormi tekshir:
#    (misol: yangi fayl "employeeCards" eksport qilsa)
grep -rn "employeeCards" lib/db/src/schema/index.ts

# 3. Shu nom boshqa schema faylda ham bormi:
grep -rn "export.*employeeCards" lib/db/src/schema/*.ts | grep -v "<yangi-fayl>.ts"
```

**Natijaga qarab qaror:**

| Holat | Amal |
|---|---|
| Dublikat yo'q | `export * from "./<yangi-fayl>"` qo'sh |
| Dublikat bor, yangi fayl = kanonik | Selektiv eksport: faqat unikal simvollarni `export { unikal1, unikal2 } from "./<yangi-fayl>"` |
| Dublikat bor, eski fayl = kanonik | Izoh bilan bo'sh blok: `export { /* <nima sabab> */ } from "./<yangi-fayl>"` |
| Fayl bo'sh (eksport yo'q) | Qo'shmang, manifest flag qaytaring |

**Dublikat misollar (mavjud holatdan):**

```typescript
// YAXSHI NAMUNA — hr-architecture-additions.ts da simvol ziddiyati bor:
export {
  // Selectively re-export from hr-architecture-additions to avoid duplicate symbols
  // (aiCvScreenings, jobTemplates, questionnaireQuestions, questionnaireTemplates
  //  are defined elsewhere — they're the authoritative copies).
} from "./hr-architecture-additions";
// ← Bo'sh blok: kompilyator faylni ko'radi, lekin ziddiyatli simvol import qilinmaydi

// YAXSHI NAMUNA — admin-assets.ts dan faqat unikal simvollar:
export {
  assetItems, insertAssetItemSchema, assetMaintenance,
} from "./admin-assets";
export type { AssetItem, InsertAssetItem, AssetMaintenance } from "./admin-assets";
```

---

### Qadam 4: index.ts ni yangilash — append-only

**Fayl:** `lib/db/src/schema/index.ts`

**Qoida:** FAQAT fayl OXIRIGA qo'shing. Oradagi satrlarni o'zgartirmang.

**Oldin (line 82-85, fayl oxiri):**
```typescript
// Selective re-export from employees.ts — EmployeeFile/EmploymentContract etc.
// are already exported via hr-schema chain; only export the core employees table here.
export { employees, insertEmployeeSchema } from "./employees";
export type { Employee, InsertEmployee } from "./employees";
// users, User, InsertUser, insertUserSchema already exported via core-schema → core-users → users
```

**Keyin (manifest kelgandan so'ng, NAMUNA — aniq simvollar manifestdan keladi):**
```typescript
// Selective re-export from employees.ts — EmployeeFile/EmploymentContract etc.
// are already exported via hr-schema chain; only export the core employees table here.
export { employees, insertEmployeeSchema } from "./employees";
export type { Employee, InsertEmployee } from "./employees";
// users, User, InsertUser, insertUserSchema already exported via core-schema → core-users → users

// ── Wave 1 yangi schema fayllar (manifest asosida qo'shildi: 2026-06-19) ──────────────────
// P<XY>-<MODUL> manifest: lib/db/src/schema/<fayl>.ts
export * from "./<fayl>";
// P<XY>-<MODUL2> manifest — selektiv (dublikat simvol: <simvol> boshqa faylda ham bor):
export {
  <unikal-simvol1>,
  <unikal-simvol2>,
} from "./<fayl2>";
// ────────────────────────────────────────────────────────────────────────────────────────────
```

**Namuna — ORG paket manifest keldi, yangi fayl `org-employee-cards.ts`, simvollar: `employeeCards`, `cardFolders`, `insertEmployeeCardSchema`, `insertCardFolderSchema`, dublikat yo'q:**

```typescript
// P0X-ORG manifest: lib/db/src/schema/org-employee-cards.ts
export * from "./org-employee-cards";
```

**Namuna — NTF paket manifest keldi, yangi fayl `ntf-schema.ts`, lekin `notifications` nomi mavjud `core-schema` da ham bor:**

```typescript
// P0Y-NTF manifest: lib/db/src/schema/ntf-schema.ts
// Selektiv: 'notifications' nomi core-schema.ts da allaqachon bor — faqat ntf-maxsus simvollar:
export {
  ntfChannels,
  ntfSubscriptions,
  ntfTemplates,
  insertNtfChannelSchema,
  insertNtfSubscriptionSchema,
  insertNtfTemplateSchema,
} from "./ntf-schema";
```

**Har bir qo'shilgan blok tepasida izoh (kim, qachon, manifest ID):**
```typescript
// <PAKET-ID> manifest: <fayl-yo'li> (qo'shildi: 2026-06-19)
```

---

### Qadam 5: Mavjud barrelda yo'q lekin zarur bo'lgan fayllarni qo'shish

§3 da 64 ta fayl barrelda yo'q ekani aniqlandi. Bu fayllar Wave 1 da yangi emas — AVVALDAN mavjud. Lekin barrelda yo'qligi tufayli `@workspace/db` dan import qilinmaydi.

**Bu agent ularni ham qo'sha oladimi?**

QOIDA: Bu agent faqat manifest bo'yicha ishlaydi. Mavjud fayllarni o'z-o'zicha qo'sha OLMAYDI — chunki:
1. Ularning dublikat simvol holati tekshirilmagan.
2. Boshqa agent (ular egasi) ularni o'zgartirishi mumkin.
3. Ruxsatsiz kengaytirish Q-6 (fayl izolyatsiyasi) ni buzmaydi, lekin Q-28 (ruxsat darvozasi) ni buzadi.

**Harakatlar:**

```
FLAG — egaga yuboriladi:
Mavjud barrelda yo'q 64 ta fayl topildi. Ularni barrel ga qo'shish kerakmi?
Ro'yxat: adaptation.ts, assessment.ts, attendance.ts, crm-activities.ts,
crm-contacts.ts, crm-core.ts, crm-deal-products.ts, crm-deals.ts,
crm-docs.ts, crm-extended.ts, crm-pipelines.ts, crm-proposals.ts,
departments.ts, discipline.ts, fi-advanced.ts, fi-ap-ar.ts, fi-ap-core.ts,
fi-banking.ts, fi-budgets.ts, fi-expenses.ts, fi-gl.ts, fi-kassa.ts,
fi-payroll-calc.ts, fi-payroll-ext.ts, hr-compensation.ts, hr-employees-docs.ts,
hr-extended.ts, hr-goals.ts, hr-missing-schema.ts, hr-performance-core.ts,
hr-performance-ext.ts, hr-performance.ts, hr-personal-core.ts, hr-personal.ts,
hr-questionnaire.ts, hr-recruitment.ts, hr-safety.ts, hr-transfers.ts,
kpi.ts, leave.ts, lms.ts, mm-advanced.ts, mm-batch-mgmt.ts, mm-inventory.ts,
mm-logistics.ts, mm-materials.ts, mm-mro.ts, mm-procurement.ts, mm-purchase.ts,
mm-raw-materials.ts, payroll.ts, positions.ts, recruitment.ts, safety.ts,
sd-billing.ts, sd-core.ts, sd-delivery.ts, sd-extended.ts, sd-order-items.ts,
sd-orders.ts, shifts.ts, skills.ts.
ISTISNO: ai-analytics-schema.ts — BO'SH fayl, qo'shish shart emas.
Har bir faylning dublikat simvol holati tekshirilmagan.
Egasi ruxsati kerak.
```

**Agar egasi "ha, barini qo'sh" desa:** Qadam 6 ga o'ting.
**Agar egasi "faqat manifest bo'yicha" desa:** Faqat Wave 1 manifest fayllarini qo'shing.

---

### Qadam 6 (egasi ruxsati bo'lsa): Mavjud fayllarni barrelga qo'shish

**Fayl:** `lib/db/src/schema/index.ts`

**Amal:** Har bir faylni qo'shishdan oldin dublikat tekshiruv:

```bash
# Misol: hr-compensation.ts uchun:
# 1. Eksportlarini ko'r:
grep "^export" lib/db/src/schema/hr-compensation.ts | head -20

# 2. Shu nomlar barrel da bormi:
# (natijaga qarab export * yoki selektiv)
```

**Dublikat xavfi yuqori bo'lgan fayllar** (manual tekshiruv talab qiladi):

```
hr-compensation.ts    ← hr-schema.ts orqali ba'zi simvollar allaqachon bor bo'lishi mumkin
hr-recruitment.ts     ← hr-recruiter.ts da ba'zi simvollar bor
crm-activities.ts     ← crm-schema.ts da ba'zi simvollar bor
crm-core.ts           ← crm-schema.ts da ba'zi simvollar bor
fi-gl.ts              ← fi-schema.ts da ba'zi simvollar bor
sd-core.ts            ← sd-schema.ts da ba'zi simvollar bor
```

**Minimal xavfli, to'g'ridan qo'shish mumkin:**

```typescript
// lib/db/src/schema/index.ts ga OXIRIGA qo'shiladi (egasi ruxsati bilan):

// ── Avvaldan mavjud, barrelda yo'q bo'lgan sxema fayllar (2026-06-19 qo'shildi) ─────────
export * from "./adaptation";
export * from "./assessment";
export * from "./attendance";
export * from "./departments";
export * from "./discipline";
export * from "./kpi";
export * from "./leave";
export * from "./lms";
export * from "./payroll";
export * from "./positions";
export * from "./recruitment";
export * from "./safety";
export * from "./shifts";
export * from "./skills";
export * from "./mm-advanced";
export * from "./mm-batch-mgmt";
export * from "./mm-inventory";
export * from "./mm-logistics";
export * from "./mm-materials";
export * from "./mm-mro";
export * from "./mm-procurement";
export * from "./mm-purchase";
export * from "./mm-raw-materials";
export * from "./sd-billing";
export * from "./sd-core";
export * from "./sd-delivery";
export * from "./sd-extended";
export * from "./sd-order-items";
export * from "./sd-orders";
export * from "./fi-advanced";
export * from "./fi-ap-ar";
export * from "./fi-ap-core";
export * from "./fi-banking";
export * from "./fi-budgets";
export * from "./fi-expenses";
export * from "./fi-gl";
export * from "./fi-kassa";
export * from "./fi-payroll-calc";
export * from "./fi-payroll-ext";
// ─────────────────────────────────────────────────────────────────────────────────────────
```

**Selektiv eksport talab qiladigan fayllar (dublikat xavfi):**

```typescript
// hr-* fayllar: avval tsc bilan tekshiring, keyin qo'shing:
// pnpm --filter @workspace/db run build 2>&1 | grep "duplicate identifier"
// Agar xato chiqmasa: export * qo'shing
// Agar xato chiqsa: selektiv export yozing
```

**CRM fayllar (crm-schema.ts allaqachon bor):**
```typescript
// Avval tekshirish:
// diff <(grep "^export" lib/db/src/schema/crm-schema.ts) \
//      <(grep "^export" lib/db/src/schema/crm-core.ts)
// Unikal simvollar borsa selektiv; aks holda bo'sh blok
```

---

### Qadam 7: Har bir qo'shimcha dan keyin — darhol TSC tekshiruvi

**Bu qadam MAJBURIY — har bir yangi satr qo'shilgandan keyin:**

```bash
cd Uzbek-Language-Module
pnpm --filter @workspace/db run build
```

**Kutilayotgan natija:**
```
> @workspace/db build
✓ Built successfully
```

**Agar TypeScript xatosi:**
```
error TS2300: Duplicate identifier 'myTable'
```

Darhol qo'shilgan satrni selektiv eksportga aylantiring:
```typescript
// Oldin:
export * from "./new-schema";

// Keyin (dublikat topildi):
export {
  uniqueSymbol1,
  uniqueSymbol2,
  // 'myTable' bu yerda YO'Q — boshqa faylda kanonik
} from "./new-schema";
```

---

## 5. DDL (agar bor)

**Bu paketda DDL kerak emas.** `lib/db/src/schema/index.ts` — faqat re-export barrel. Hech qanday `pgTable`, `CREATE TABLE`, migration SQL bu faylda yozilmaydi.

**Gated:** Agar biron sabab bilan bu agent `pgTable` yozishga majbur bo'lsa — TO'XTAT. Bu P01 ning izolyatsiyasini buzadi. Yangi pgTable yaratish boshqa paketrning ishidir.

---

## 6. QABUL MEZONI

### Funksional tekshiruv:

- [ ] `lib/db/src/schema/index.ts` mavjud 85 satr O'ZGARTIRILMAGAN (faqat yangi satrlar qo'shilgan)
- [ ] Har bir manifest faylidan kelgan yangi schema fayl barrel da akslanган
- [ ] `pnpm --filter @workspace/db run build` — 0 xato
- [ ] `cd apps/api && pnpm tsc --noEmit` — 0 xato (BE tsc 0)
- [ ] `cd artifacts/erp-dashboard && pnpm tsc --noEmit` — 0 xato (FE tsc 0)
- [ ] Yangi schema faylining pgTable ni `@workspace/db` dan import qilish ishlaydi:

```typescript
// Tekshiruv import (apps/api/src/ da vaqtinchalik test):
import { newTableFromOrg } from '@workspace/db';
// TypeScript bu importni resolve qilishi kerak — "has no exported member" xatosi bo'lmasin
```

### Regressiya tekshiruvi:

- [ ] Mavjud barrel eksportlar buzilmagan: hozirgi 85 satr identik qolgan
- [ ] Golden thread yo'li ishlaydi: SD→PP→MES→QC→WMS→FIN (mavjud chain o'zgarmagan)

```bash
# Golden thread smoke test:
curl -s http://localhost:3030/api/health | grep '"status":"ok"'
```

### Simvol ziddiyati yo'q:

- [ ] `pnpm --filter @workspace/db run build` da `Duplicate identifier` xatosi YO'Q
- [ ] Selektiv eksport bloki to'g'ri izohlanган (qaysi simvol nima uchun chiqarilmagan)

### DB proof (bu paket uchun):

Bu paket faqat barrel — DB da hech narsa o'zgarmaydi. DB proof boshqa paketlarning (pgTable yaratgan) zimmasida. Bu agent uchun DB-proof = `@workspace/db` TypeScript resolve bo'lishi.

---

## 7. SELF-VERIFY

### 7.1 Barrel tekshiruvi

```bash
# Hozirgi holat:
wc -l lib/db/src/schema/index.ts
# Natija: ≥85 (yangi satrlar qo'shilgandan keyin ko'proq)

# Mavjud satrlar o'zgarmaganmi:
git diff lib/db/src/schema/index.ts | grep "^-" | grep -v "^---"
# Natija: FAQAT qo'shimcha (+) satrlar bo'lishi kerak; o'chirilgan (-) satr YO'Q
```

### 7.2 Build tekshiruvi

```bash
# lib/db paketi build:
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @workspace/db run build
# Kutilayotgan: 0 xato

# BE TypeScript:
pnpm --filter @europrint/api run tsc:check
# yoki:
cd apps/api && npx tsc --noEmit 2>&1 | tail -5
# Kutilayotgan: 0 xato
```

### 7.3 Import ishlayotganini tekshirish

```bash
# Yangi eksport qilingan simvolni BE da topish:
# (misol: org-employee-cards.ts dan employeeCards)
grep -rn "from '@workspace/db'" apps/api/src/ | grep "employeeCards" | head -3
# yoki
node -e "const { employeeCards } = require('./lib/db/dist'); console.log(typeof employeeCards);"
```

### 7.4 Dublikat simvol yo'qligini tekshirish

```bash
# Build paytida chiqadigan duplicate identifier:
pnpm --filter @workspace/db run build 2>&1 | grep -i "duplicate"
# Natija: bo'sh (hech narsa chiqmasin)
```

### 7.5 Regressiya tekshiruvi

```bash
# Mavjud ishlayotgan endpoint:
curl -s http://localhost:3030/api/health
# Kutilayotgan: {"status":"ok",...}

# Reviewers:
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-array-safety.sh
```

---

## 8. COMMIT

### Commit tartibi:

```bash
# FAQAT owned file:
git add lib/db/src/schema/index.ts

# Commit xabari:
git commit -m "feat(barrel): P01 wave-1 schema barrel — manifest re-exports appended to lib/db index

- Append-only: existing 85 lines untouched (Q-46)
- Added re-exports for wave-1 new schema files per sibling manifests
- Selective export blocks where duplicate symbols detected
- lib/db build PASS, BE tsc 0, FE tsc 0

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Qoidalar:
- `git add -A` yoki `git add .` TAQIQ (Q-8)
- Faqat `lib/db/src/schema/index.ts` staged qilinadi
- Commit FAQAT Wave 1 tugaganidan keyin (manifest to'liq kelgandan keyin)
- Agar Wave 1 paketlar hali commit qilmagan bo'lsa — bu agent kutadi

### Commit xabari formati:

```
feat(barrel): P01 wave-1 schema barrel — <qisqa tavsif>

- <qo'shilgan fayl 1>: <nima uchun>
- <qo'shilgan fayl 2>: <nima uchun>
- Selektiv: <fayl> — <qaysi simvol chiqarilmagan va nima uchun>
- lib/db build PASS, BE tsc 0, FE tsc 0

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Qo'shimcha: Edge-holatlar va xavf olomlari

### Xavf 1: Ikki Wave-1 paket bir xil fayl nomini yaratsa

Ehtimollik: past, lekin mumkin. Masalan, HR paket `hr-v2-additions.ts` yaratadi, ORG paket ham `hr-v2-additions.ts` yaratadi.

**Chora:**
1. Ikkinchi manifest kelganda — faylni o'qing.
2. Agar bir xil fayl nomi, har xil mazmun — STOP, egaga flag.
3. Agar bir xil fayl nomi, bir xil mazmun — dublikat, egaga flag.

### Xavf 2: Manifest faylida eksport yo'q (bo'sh fayl)

**Chora:** Bo'sh faylni barrelga qo'shmang. Manifest yuborgan agentga javob: "Fayl bo'sh — eksport yo'q — barrel qo'shilmadi."

### Xavf 3: Manifest kechikar kelsa (Wave 1 tugaydi, bu agent hali kutmoqda)

**Chora:** Wave 1 deadline arafasida — manifest kutish to'xtaydi. Kelgan manifestlar qo'shiladi. Kelmagan paketlar uchun: egaga ro'yxat yuboriladi "Bu fayllar hali barrel da yo'q."

### Xavf 4: TSC xatosi — qaysi satr sabab bo'lganini topish

```bash
# Xato satrini toping:
pnpm --filter @workspace/db run build 2>&1 | grep "error TS"
# Natija: lib/db/src/schema/index.ts:NN — xato
# NN = shu satr ni selektiv eksportga aylantiring
```

### Xavf 5: `hr-compensation.ts` dublikat muammosi

Bu fayl `hr-recruitment` dan import qiladi, `hr-schema` bilan simvol kesishuvi bo'lishi mumkin:

```bash
# Tekshirish:
diff <(grep "^export " lib/db/src/schema/hr-schema.ts | sort) \
     <(grep "^export " lib/db/src/schema/hr-compensation.ts | sort)
# Faqat hr-compensation.ts da bo'lgan simvollar = selektiv eksportda qoladi
```

---

## Xulosa — P01 agentning asosiy vazifasi

```
┌─────────────────────────────────────────────────────────┐
│  P01 GOLDEN — Barrel Agent                              │
│                                                         │
│  INPUT:  Wave-1 sibling paketlarning manifest xabarlari │
│          (yangi schema fayl nomlari + simvol ro'yxati)  │
│                                                         │
│  PROCESS: 1. Dublikat simvol tekshiruvi                 │
│           2. Append-only export satr qo'shish           │
│           3. TSC build tekshiruvi                       │
│                                                         │
│  OUTPUT: lib/db/src/schema/index.ts (yangilangan)       │
│          → @workspace/db barcha yangi pgTable lar       │
│            TypeScript da resolve bo'ladi                │
│                                                         │
│  KAFOLAT: Mavjud 85 satr O'ZGARMAYDI (Q-46)            │
│           Faqat append (qo'shish) amaliyoti             │
└─────────────────────────────────────────────────────────┘
```

Bu agent Wave 1 da BIRINCHI ishga tushadi (tayyorgarlik), lekin OXIRGI commit qiladi (barcha manifest kelib bo'lganda). Sibling agentlar o'z yangi schema fayllarini yaratib commit qilgach, bu agent ularni barrelga ulaydi.

---

## Qo'shimcha: 64 ta mavjud fayl — to'liq selektiv tekshiruv jadvali

Quyidagi jadval §3 da aniqlangan 64 ta faylning qo'shish/tekshiruv tartibini batafsil ko'rsatadi. Bu jadval egasi ruxsati bilan `export *` yozishdan OLDIN har bir fayl uchun bajarilishi kerak.

### A-guruh: Kam xavfli — alohida modul, o'z nomlar maydoni (export * xavfsiz)

```bash
# Har biri uchun tekshiruv:
grep -c "^export" lib/db/src/schema/<FAYL>.ts
# ↑ 0 bo'lsa — bo'sh fayl, qo'shmang
# ↑ >0 bo'lsa — pastdagi simvol tekshiruvini bajaring
```

| # | Fayl | Asosiy pgTable nomi (taxmin) | O'xshash barrel eksport | Tavsiya |
|---|---|---|---|---|
| 1 | `adaptation.ts` | adaptationPlans, adaptationTasks | Yo'q | `export *` |
| 2 | `assessment.ts` | assessments, assessmentResults | Yo'q | `export *` |
| 3 | `attendance.ts` | attendanceRecords | `hr-schema` da attendance bor? Tekshir | Selektiv yoki `export *` |
| 4 | `departments.ts` | departments | `core-schema` da departments bormi? | Selektiv |
| 5 | `discipline.ts` | disciplineRecords | `hr-schema` da discipline bormi? | Selektiv |
| 6 | `kpi.ts` | kpiMetrics, kpiResults | Yo'q aniq | `export *` |
| 7 | `leave.ts` | leaveRequests, leaveTypes | `hr-schema` da leave bormi? | Selektiv |
| 8 | `lms.ts` | lmsCourses, lmsLessons | `lms-schema` bilan overlap? | Selektiv |
| 9 | `payroll.ts` | payrollRecords | `hr-schema` da payroll bormi? | Selektiv |
| 10 | `positions.ts` | positions | `core-schema` / `position-permissions` | Selektiv |
| 11 | `recruitment.ts` | recruitmentPipelines | `hr-recruiter` bilan overlap? | Selektiv |
| 12 | `safety.ts` | safetyIncidents | `hr-safety` bilan overlap? | Selektiv |
| 13 | `shifts.ts` | shifts, shiftSchedules | `mes-schema` da shift bormi? | Selektiv |
| 14 | `skills.ts` | skills, employeeSkills | Yo'q aniq | `export *` |

### B-guruh: O'rta xavf — modul prefix bor lekin ota-modul barrel allaqachon bor

```
mm-advanced.ts       ← mm-schema.ts allaqachon barrel da
mm-batch-mgmt.ts     ← mm-schema.ts allaqachon barrel da
mm-inventory.ts      ← mm-schema.ts allaqachon barrel da
mm-logistics.ts      ← mm-schema.ts allaqachon barrel da
mm-materials.ts      ← mm-schema.ts allaqachon barrel da
mm-mro.ts            ← mm-schema.ts allaqachon barrel da
mm-procurement.ts    ← mm-schema.ts allaqachon barrel da
mm-purchase.ts       ← mm-schema.ts allaqachon barrel da
mm-raw-materials.ts  ← mm-schema.ts allaqachon barrel da
```

**Tekshiruv pattern (har biri uchun):**
```bash
# 1. mm-schema.ts da nima bor:
grep "^export" lib/db/src/schema/mm-schema.ts | awk '{print $2}' | sort > /tmp/mm_schema_exports.txt

# 2. mm-advanced.ts da nima bor:
grep "^export" lib/db/src/schema/mm-advanced.ts | awk '{print $2}' | sort > /tmp/mm_advanced_exports.txt

# 3. Farq:
comm -23 /tmp/mm_advanced_exports.txt /tmp/mm_schema_exports.txt
# ← faqat mm-advanced.ts da bo'lgan = barrelga QO'SHISH mumkin
# comm -12 ... = OVERLAP = bu simvollar barrelda BOSHQA fayl orqali allaqachon bor

# 4. Natijaga qarab:
#    Overlap yo'q → export * from "./mm-advanced"
#    Overlap bor → export { unikal1, unikal2 } from "./mm-advanced"
```

```
sd-billing.ts        ← sd-schema.ts allaqachon barrel da
sd-core.ts           ← sd-schema.ts allaqachon barrel da
sd-delivery.ts       ← sd-schema.ts allaqachon barrel da
sd-extended.ts       ← sd-schema.ts allaqachon barrel da
sd-order-items.ts    ← sd-schema.ts allaqachon barrel da
sd-orders.ts         ← sd-schema.ts allaqachon barrel da
```

**Tekshiruv pattern (har biri uchun — SD):**
```bash
grep "^export" lib/db/src/schema/sd-schema.ts | sort > /tmp/sd_schema.txt
grep "^export" lib/db/src/schema/sd-billing.ts | sort > /tmp/sd_billing.txt
comm -23 /tmp/sd_billing.txt /tmp/sd_schema.txt
# Faqat sd-billing.ts unikal simvollar → selektiv eksport
```

### C-guruh: Yuqori xavf — HR simvollar ko'p joyda takrorlanadi

```
hr-compensation.ts   ← hr-schema.ts + hr-recruiter.ts bilan overlap bo'lishi ehtimoli yuqori
hr-employees-docs.ts ← hr-schema.ts orqali ba'zi simvollar bor
hr-extended.ts       ← hr-schema.ts orqali ba'zi simvollar bor
hr-goals.ts          ← hr-schema.ts orqali ba'zi simvollar bor
hr-missing-schema.ts ← "missing" = ehtimol bir vaqtlar barrelga qo'shilmagan
hr-performance-core.ts ← hr-performance.ts + hr-schema.ts bilan overlap
hr-performance-ext.ts  ← hr-performance.ts bilan overlap
hr-performance.ts      ← hr-schema.ts da performance bormi?
hr-personal-core.ts    ← hr-personal.ts bilan overlap
hr-personal.ts         ← hr-schema.ts orqali ba'zi simvollar
hr-questionnaire.ts    ← hr-recruiter.ts da questionnaire bor
hr-recruitment.ts      ← hr-recruiter.ts bilan KATTA overlap xavfi
hr-safety.ts           ← hr-schema.ts da safety bormi?
hr-transfers.ts        ← hr-schema.ts da transfer bormi?
```

**HR guruh uchun to'liq tekshiruv buyrug'i:**
```bash
# hr-schema.ts eksport ro'yxati:
grep "^export\|^  [a-z]" lib/db/src/schema/hr-schema.ts | grep -v "^//" > /tmp/hr_schema.txt

# hr-recruiter.ts eksport ro'yxati:
grep "^export\|^  [a-z]" lib/db/src/schema/hr-recruiter.ts | grep -v "^//" > /tmp/hr_recruiter.txt

# Har bir HR fayl uchun overlap:
for f in hr-compensation hr-employees-docs hr-extended hr-goals hr-missing-schema \
          hr-performance-core hr-performance-ext hr-performance hr-personal-core \
          hr-personal hr-questionnaire hr-recruitment hr-safety hr-transfers; do
  echo "=== $f.ts ==="
  grep "^export" lib/db/src/schema/${f}.ts | sort > /tmp/target.txt
  # hr-schema bilan overlap:
  OVERLAP=$(comm -12 /tmp/target.txt /tmp/hr_schema.txt | wc -l)
  UNIQUE=$(comm -23 /tmp/target.txt /tmp/hr_schema.txt | wc -l)
  echo "  Overlap with hr-schema: $OVERLAP simvol"
  echo "  Unikal (qo'shish mumkin): $UNIQUE simvol"
done
```

### D-guruh: Finance — fi-schema.ts allaqachon barrel da

```
fi-advanced.ts     ← fi-schema.ts bilan overlap?
fi-ap-ar.ts        ← fi-schema.ts bilan overlap?
fi-ap-core.ts      ← fi-schema.ts bilan overlap?
fi-banking.ts      ← fi-schema.ts bilan overlap?
fi-budgets.ts      ← fi-schema.ts bilan overlap?
fi-expenses.ts     ← fi-schema.ts bilan overlap?
fi-gl.ts           ← fi-schema.ts bilan overlap? (GL = general ledger)
fi-kassa.ts        ← fi-schema.ts bilan overlap?
fi-payroll-calc.ts ← fi-schema.ts bilan overlap?
fi-payroll-ext.ts  ← fi-schema.ts bilan overlap?
```

**Finance guruh tekshiruv:**
```bash
grep "^export" lib/db/src/schema/fi-schema.ts | sort > /tmp/fi_schema.txt
for f in fi-advanced fi-ap-ar fi-ap-core fi-banking fi-budgets fi-expenses \
          fi-gl fi-kassa fi-payroll-calc fi-payroll-ext; do
  grep "^export" lib/db/src/schema/${f}.ts | sort > /tmp/fi_target.txt
  UNIQUE=$(comm -23 /tmp/fi_target.txt /tmp/fi_schema.txt | wc -l)
  echo "$f.ts: $UNIQUE ta unikal simvol (qo'shish mumkin)"
done
```

### E-guruh: CRM — crm-schema.ts allaqachon barrel da

```
crm-activities.ts    ← crm-schema.ts bilan overlap?
crm-contacts.ts      ← crm-schema.ts bilan overlap?
crm-core.ts          ← crm-schema.ts bilan overlap?
crm-deal-products.ts ← crm-schema.ts bilan overlap?
crm-deals.ts         ← crm-schema.ts bilan overlap?
crm-docs.ts          ← crm-schema.ts bilan overlap?
crm-extended.ts      ← crm-schema.ts bilan overlap?
crm-pipelines.ts     ← crm-schema.ts bilan overlap?
crm-proposals.ts     ← crm-schema.ts bilan overlap?
```

```bash
grep "^export" lib/db/src/schema/crm-schema.ts | sort > /tmp/crm_schema.txt
for f in crm-activities crm-contacts crm-core crm-deal-products crm-deals \
          crm-docs crm-extended crm-pipelines crm-proposals; do
  grep "^export" lib/db/src/schema/${f}.ts | sort > /tmp/crm_target.txt
  UNIQUE=$(comm -23 /tmp/crm_target.txt /tmp/crm_schema.txt | wc -l)
  echo "$f.ts: $UNIQUE ta unikal simvol"
done
```

---

## Qo'shimcha: Barrel uchun to'liq test skripti

Bu skriptni `lib/db/` da ishga tushiring — barrel to'liqligini tekshiradi:

```bash
#!/bin/bash
# scripts/check-barrel-completeness.sh
# P01 GOLDEN uchun barrel to'liqlik tekshiruvi

SCHEMA_DIR="lib/db/src/schema"
BARREL="$SCHEMA_DIR/index.ts"
MISSING=0

echo "=== Barrel to'liqlik tekshiruvi ==="
echo "Barrel: $BARREL"
echo ""

for f in "$SCHEMA_DIR"/*.ts; do
  fname=$(basename "$f")
  stem="${fname%.ts}"

  # index.ts ni o'tkazib yubor
  [ "$stem" = "index" ] && continue

  # Bo'sh fayllarni o'tkazib yubor
  EXPORT_COUNT=$(grep -c "^export" "$f" 2>/dev/null || echo 0)
  if [ "$EXPORT_COUNT" -eq 0 ]; then
    echo "  ⬜ SKIP (bo'sh): $fname"
    continue
  fi

  # Barrel da bormi tekshir
  if grep -q "from \"./$stem\"" "$BARREL"; then
    echo "  ✅ OK: $fname ($EXPORT_COUNT eksport)"
  else
    echo "  ❌ BARRELDA YO'Q: $fname ($EXPORT_COUNT eksport)"
    MISSING=$((MISSING + 1))
  fi
done

echo ""
echo "=== Natija ==="
echo "Barrelda yo'q fayllar: $MISSING"

if [ "$MISSING" -gt 0 ]; then
  exit 1
else
  echo "✅ Barrel to'liq"
  exit 0
fi
```

**Ishga tushirish:**
```bash
bash scripts/check-barrel-completeness.sh
```

---

## Qo'shimcha: TypeScript simvol ziddiyat tekshiruv skripti

```bash
#!/bin/bash
# scripts/check-barrel-duplicates.sh
# Barrel da potentsial dublikat simvollarni aniqlaydi

SCHEMA_DIR="lib/db/src/schema"
BARREL="$SCHEMA_DIR/index.ts"

echo "=== Simvol ziddiyat tekshiruvi ==="

# Barcha eksport qilingan simvollarni to'pla
ALL_SYMBOLS=$(
  # Barrel da ko'rsatilgan fayllardan eksportlarni o'qi
  grep "from \"\." "$BARREL" | sed 's/.*from "\.\///' | sed 's/".*//' | while read stem; do
    grep "^export" "$SCHEMA_DIR/${stem}.ts" 2>/dev/null | \
      grep -oP "(?<=export (const|function|class|type|interface|enum) )\w+" | \
      while read sym; do echo "$sym $stem"; done
  done
)

# Bir xil simvol ikki xil faylda bormi:
echo "$ALL_SYMBOLS" | awk '{print $1}' | sort | uniq -d | while read dup; do
  FILES=$(echo "$ALL_SYMBOLS" | grep "^$dup " | awk '{print $2}' | tr '\n' ', ')
  echo "  ⚠️  DUBLIKAT: $dup — fayllar: $FILES"
done

echo ""
echo "=== Tekshiruv tugadi ==="
```

**Ishga tushirish:**
```bash
bash scripts/check-barrel-duplicates.sh
```

---

## Qo'shimcha: Wave 1 manifest log shabloni

Bu agent har manifest qabul qilganda quyidagi formatda log yozadi (xotirada yoki `docs/audit/MASSIV-50/P01-manifest-log.txt` faylda):

```
=== P01 MANIFEST LOG ===

[2026-06-19 XX:XX] P0X-ORG manifest QABUL QILINDI
  Fayl: lib/db/src/schema/org-employee-cards.ts
  Simvollar: employeeCards, cardFolders, insertEmployeeCardSchema, insertCardFolderSchema
  Dublikat tekshiruvi: YO'Q
  Barrel harakati: export * from "./org-employee-cards" — QOSHILDI (line 87)
  TSC natija: 0 xato

[2026-06-19 XX:XX] P0Y-NTF manifest QABUL QILINDI
  Fayl: lib/db/src/schema/ntf-schema.ts
  Simvollar: ntfChannels, ntfSubscriptions, ntfTemplates, notifications(OVERLAP!)
  Dublikat tekshiruvi: 'notifications' — core-schema.ts da ham bor
  Barrel harakati: SELEKTIV — 3 unikal simvol qo'shildi, notifications chiqarilmadi
  TSC natija: 0 xato

[2026-06-19 XX:XX] P0Z-AI manifest QABUL QILINDI
  Fayl: lib/db/src/schema/ai-planning-schema.ts
  Simvollar: aiPlanningTasks, aiPlanningResults, insertAiPlanningTaskSchema
  Dublikat tekshiruvi: YO'Q (ai-providers-schema.ts dan farqli simvollar)
  Barrel harakati: export * from "./ai-planning-schema" — QOSHILDI
  TSC natija: 0 xato

=== YAKUNIY HOLAT ===
Wave 1 da qo'shilgan yangi fayllar: N ta
Selektiv eksport (dublikat sababli): M ta
Mavjud 85 satr: O'ZGARMAGAN
Final index.ts satrlari: 85 + N_yangi
lib/db build: PASS
BE tsc: 0
FE tsc: 0
Commit: git add lib/db/src/schema/index.ts
```

---

## Qo'shimcha: Tez-tez beriladigan savollar (FAQ)

**S: Barrelga faqat export * yozsam kifoyami?**

J: Ko'p hollarda ha. Lekin bir xil nomdagi simvol ikki faylda bo'lsa TypeScript `Duplicate identifier` xatosi beradi. Shuning uchun har yangi fayl qo'shilganda darhol `pnpm --filter @workspace/db run build` ishga tushiriladi.

**S: Mavjud barrel eksportlarni optimallashtira olamanmi (tartibni o'zgartirish, gruppalashtirish)?**

J: YO'Q. Q-46 bo'yicha ishlab turgan kod o'zgartirilmaydi. 85 satr identik qoladi. Tartib, guruhlash, refactor — boshqa sessiyada egasi ruxsati bilan.

**S: Yangi schema fayl `@workspace/db` dan emas, to'g'ridan import qilinsa-chi?**

```typescript
// ❌ NOTO'G'RI:
import { newTable } from '../../lib/db/src/schema/new-schema';

// ✅ TO'G'RI:
import { newTable } from '@workspace/db';
```

Barrel maqsadi — barcha import `@workspace/db` orqali o'tishi. To'g'ridan import `@workspace/db` abstraksiyasini buzadi, path coupling yaratadi.

**S: Agar sibling agent o'z schema faylini yaratib, barrel ga o'zi qo'shsa-chi?**

J: Bu Q-6 (fayl izolyatsiyasi) buzilishi. `lib/db/src/schema/index.ts` — FAQAT P01 agentining mulki. Boshqa agent shu faylga tegsa — flag. P01 agent qayta tekshirishi va to'g'rilashi kerak.

**S: `lib/db` build xatosi BE tsc bilan bog'liqmi?**

J: Ha, bevosita. `@workspace/db` to'g'ri eksport qilmasa, `apps/api` da `Cannot find module '@workspace/db'` yoki `has no exported member 'X'` xatosi chiqadi. Shuning uchun bu agent Wave 1 ning eng muhim "integratsiya ko'prigi" hisoblanadi.

**S: Wave 2 da ham shu agent ishlaydimi?**

J: Ha. Wave 2 da ham yangi schema fayl yaratilsa, sibling paketlar yana P01 ga manifest yuboradi. Bu agent Wave bosqichidan qat'iy nazar, yagona barrel egasi sifatida ishlaydi.

**S: `ai-analytics-schema.ts` nima uchun bo'sh?**

J: Fayl boshidagi JSDoc ga ko'ra: "All tables in this file were orphan pgTable definitions (not present in the database) and have been removed". Bu faylni barrelga qo'shish ma'nosiz (eksport yo'q, xato ham chiqmaydi, lekin keraksiz satr). Barrelga qo'shilmaydi.

---

## Qo'shimcha: Barcha qoidalar va ularning bu agentga ta'siri

| Qoida | Bu agentga ta'siri |
|---|---|
| Q-1 Result\<T\> | Bu agent repo/service yozmaydi — ta'sir yo'q |
| Q-2 Zod @Body | Bu agent controller yozmaydi — ta'sir yo'q |
| Q-3 Drizzle ORM | Bu agent pgTable yozmaydi — ta'sir yo'q |
| Q-4 Real INSERT | Bu agent DB yozmaydi — ta'sir yo'q |
| Q-5 Q-46 Buzuq kod o'chir | Mavjud barrel satrlar = ishlab turgan → O'ZGARTIRMA |
| Q-6 Fayl izolyatsiyasi | FAQAT index.ts; boshqa fayl kerak bo'lsa STOP + flag |
| Q-7 DDL darvozasi | Bu paket DDL emas — ta'sir yo'q |
| Q-8 git add aniq fayl | `git add lib/db/src/schema/index.ts` FAQAT |
| Q-9 Log/secret | Barrel faylda log/secret bo'lmasligi aniq |
| Q-10 Self-verify | pnpm build + tsc 0 majburiy |
| Q-11 V2 taqiq | "Strangler Fig" / "V2" so'zi bu faylga kirmasin |
| Q-12 Vizyon-moslik | Barrel = texnik infra; vizyon = barcha modul resolve bo'lishi |
| Q-28 Ruxsat darvozasi | Mavjud 64 fayl uchun egasi ruxsati kerak (§4 Qadam 5) |
| Q-29 Verify-don't-trust | Manifest faylidagi simvollar TEKSHIRILADI, ko'r-ko'rona qo'shilmaydi |
| Q-35 DDL darvozasi | N/A — DDL yo'q |
| Q-40 Ishlaydi≠to'g'ri | TSC 0 = sintaktik to'g'ri; import ishlashi = semantik to'g'ri |
| Q-46 Ishlab turgan kod | 85 satr O'ZGARMAYDI |
| Q-47 Direktiva ≥1000 satr | Shu hujjat |

