# P26 — FIN — Finance/GL + KASSIR: FIN KASSIR controllers + smena + podotchet + payroll/AP GL + Telegram + aging cron

---

## 0. ROL VA QOIDALAR

**ROL:** 🟢 Bajaruvchi — faqat egasi aynan aytgan fayllar.  
**WAVE:** 3  
**dependsOn:** ["P24", "P25"] — P24 (GL core + entries schema) va P25 (ZVS/ZNO) TAMOMLANGANDAN KEYIN boshlang. `insertJournal` funksiyasi (drizzle-gl-posting.repo.ts) va `GlPostingService.postJournal` (P24 chiqishi) tayyor bo'lishi shart.

---

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

1. **Result<T>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. `@Body` **Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40** ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46** ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31):** faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35):** `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify:** BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. `"V2"`/`"Strangler Fig"`/`"V1 vs V2"` terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu fayllarga teg; boshqasi kerak bo'lsa TO'XTA + flag:**

```
Uzbek-Language-Module/apps/api/src/modules/finance/kassir/kassir.controller.ts          [YANGI — yaratiladi]
Uzbek-Language-Module/apps/api/src/modules/finance/kassir/kassir.service.ts             [YANGI — yaratiladi]
Uzbek-Language-Module/apps/api/src/modules/finance/kassir/drizzle-kassir.repo.ts        [YANGI — yaratiladi]
Uzbek-Language-Module/apps/api/src/modules/finance/kassir/i-kassir.repo.ts              [YANGI — yaratiladi]
Uzbek-Language-Module/apps/api/src/modules/finance/kassir/podotchet.controller.ts       [YANGI — yaratiladi]
Uzbek-Language-Module/apps/api/src/modules/finance/kassir/podotchet.service.ts          [YANGI — yaratiladi]
Uzbek-Language-Module/lib/db/src/schema/fi-advance-reports.ts                           [YANGI DDL — GATED]
Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/event-handlers/payroll-closed.listener.ts   [YANGI — yaratiladi]
Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/repositories/finance-ap.repository.ts       [O'ZGARTIRISH — GL qo'shish]
Uzbek-Language-Module/apps/api/src/modules/finance/application/finance-ap.service.ts   [O'ZGARTIRISH — GL trigger]
Uzbek-Language-Module/apps/api/src/modules/finance/financial-reports/cron/financial-reports-alerts.cron.ts   [O'ZGARTIRISH — aging 90+ escalation]
Uzbek-Language-Module/apps/api/src/modules/bot-gateway/bots/bot.helpers.ts             [O'ZGARTIRISH — ShVB komandalar]
Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/CashRegister.tsx               [O'ZGARTIRISH — endpoint fix]
```

**DDL DARVOZASI:** `fi-advance-reports.ts` migration SQL GATED — faylni yoz, lekin `drizzle-kit push` yoki `psql` bilan ISHGA TUSHIRMA. Migration faylida `-- APPROVED: <egasi> <sana>` izoh BO'LISHI SHART.

**Sana 2026-06-19 holatida kassir/ papkasi mavjud emas** — papkani va barcha fayllarni siz yaratasiz.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-10-FIN-2026-06-08.md` + gap map.

### 2.1 KASSIR smena (EP-FIN-020/021 / KAS-1/KAS-2)
- Kassir har kuni smenani ochadi (`POST /api/finance/kassir/sessions` — `openingBalance` bilan).
- Smena davomida kirim/chiqim tranzaksiyalar ro'yxatlanadi (`cash_transactions` jadvaliga INSERT).
- Smena yopiladi (`PATCH /api/finance/kassir/sessions/:id/close`): `closingBalance` (faktik) kiritiladi → `variance` = `closingBalance - expectedBalance` (barcha `totalInflow - totalOutflow` + `openingBalance`) hisoblanadi.
- **X-hisobot** = smenaning hozirgi holati (yopilmagan): kirim/chiqim/balans.
- **Z-hisobot** = yopilgan smenaning yakuniy hisoboti (PDF-ga tayyorlik uchun `status = 'reconciled'`).
- Qabul mezoni: smena ochilganda `cash_sessions` ga bir qator INSERT; yopilganda `closedAt`, `closingBalance`, `variance`, `status='closed'` UPDATE; `GET /api/finance/kassir/sessions/:id/x-report` 200 qaytaradi.

**KAS-2 — PIN-per-operatsiya (har tranzaksiya uchun alohida PIN tasdiq):**

> **Manba:** `MUSLIMBEK-PROMT-10-FIN-2026-06-08.md:176` — "KAS-2 (vizyon §C) — oylik/avans tarqatish kassir orqali; har operatsiya PIN tasdiq"
>
> ⚠️ Bu talab 00-INTERVYU-MOSLIK.md §3 item 11 va §4 §E da "tushib qolgan" deb belgilangan.

- Har `POST /api/finance/kassir/transactions` chaqiruvida kassir o'zining PIN kodini ham yuborishi shart.
- PIN `users` jadvalidagi `pin_hash` (bcrypt) bilan tekshiriladi.
- PIN noto'g'ri bo'lsa → `403 FORBIDDEN` — tranzaksiya yaratilmaydi.
- PIN tekshirish `kassir.service.ts` ichida, repo ga yetib bormasdan oldin.
- Oylik/avans tarqatish amaliyotlari (`referenceType = 'payroll'` / `'advance'`) uchun PIN MAJBURIY.
- Oddiy kirim/chiqim tranzaksiyalar uchun ham PIN tavsiya etiladi (vizyon: "har operatsiya").

> ⚠️ **EGASI QARORI KERAK — PIN hashing:**
> `users.pin_hash` ustuni mavjudligini tekshiring. Agar yo'q bo'lsa — DDL GATED:
> `ALTER TABLE users ADD COLUMN pin_hash VARCHAR(72)` — `-- APPROVED:` izoh shart.
> Hozircha `pin` tekshirish: `users.pin_hash` NULL bo'lsa → PIN talab qilinmaydi (log bilan).

**KAS-2 PIN qo'shilishi lozim bo'lgan joylar (owned fayllar):**

1. **`i-kassir.repo.ts`** — `CreateTransactionDto` ga `pin?: string` qo'shish (service PIN ni o'zi tekshiradi, repo ga uzatilmaydi).

2. **`kassir.service.ts`** — `createTransaction` metodiga PIN tekshirish qadami:
   ```typescript
   const CreateTransactionSchema = z.object({
     registerId:      z.number().int().positive(),
     sessionId:       z.number().int().optional(),
     transactionType: z.enum(['inflow', 'outflow']),
     amount:          z.number().positive(),
     // KAS-2: har operatsiya uchun kassir PIN tasdiq
     pin:             z.string().min(4).max(8).optional(), // majburiy holatlar quyida tekshiriladi
     description:     z.string().optional(),
     paymentMethod:   z.enum(['cash', 'card', 'bank_transfer']).optional(),
     counterparty:    z.string().optional(),
     counterpartyType:z.enum(['customer', 'vendor', 'employee', 'other']).optional(),
     referenceType:   z.string().optional(),
     referenceId:     z.string().optional(),
     categoryId:      z.string().optional(),
     createdBy:       z.number().int().optional(),
   });

   async createTransaction(raw: unknown, operatorUserId?: number): Promise<Result<unknown, AppError>> {
     return safeCall(async () => {
       const dto = CreateTransactionSchema.parse(raw) as CreateTransactionDto & { pin?: string };

       // KAS-2: PIN-per-operatsiya tekshirish
       // Oylik/avans turida PIN MAJBURIY
       const pinRequiredTypes = ['payroll', 'advance'];
       const isPinRequired = dto.referenceType && pinRequiredTypes.includes(dto.referenceType);
       if (isPinRequired && !dto.pin) {
         throw new Error('KAS-2: Oylik/avans tranzaksiyasi uchun kassir PIN majburiy');
       }
       if (dto.pin && operatorUserId) {
         const pinCheck = await this.verifyKassirPin(operatorUserId, dto.pin);
         if (!pinCheck.ok || !pinCheck.data) {
           throw new Error('KAS-2: PIN noto\'g\'ri — tranzaksiya rad etildi');
         }
       }

       const result = await this.repo.createTransaction(dto);
       if (!result.ok) throw new Error(result.error.message);
       return result.data;
     });
   }

   /** KAS-2: Kassir PIN tekshirish — users.pin_hash bilan bcrypt compare */
   private async verifyKassirPin(userId: number, pin: string): Promise<Result<boolean, AppError>> {
     return safeCall(async () => {
       // users.pin_hash ustuni mavjudligini tekshiring (EGASI QARORI KERAK — DDL GATED)
       type PinRow = { pin_hash: string | null };
       const rows = await db.execute(sql`SELECT pin_hash FROM users WHERE id = ${userId} LIMIT 1`);
       const data = Array.isArray(rows.rows) ? (rows.rows as PinRow[]) : [];
       const pinHash = data[0]?.pin_hash ?? null;
       if (!pinHash) {
         // pin_hash yo'q → PIN tekshirish skip (log bilan)
         this.logger.warn(`[KAS-2] userId=${userId} pin_hash yo'q — PIN tekshirish o'tkazib yuborildi`);
         return true; // Degressive mode: pin_hash belgilanmagan bo'lsa block qilma
       }
       const bcrypt = await import('bcrypt');
       return bcrypt.compare(pin, pinHash);
     }, 'DB_ERROR');
   }
   ```
   `db` va `sql` import qo'shishni unutma: `import { db } from '@shared/db'; import { sql } from 'drizzle-orm';`

3. **`kassir.controller.ts`** — `createTransaction` endpoint'iga `operatorUserId` uzatish:
   ```typescript
   // POST /api/finance/kassir/transactions — tranzaksiya yaratish (KAS-2 PIN bilan)
   @Post('transactions')
   @Roles('finance_manager', 'accountant', 'cashier', 'chief_accountant', 'super_admin')
   async createTransaction(@Body() body: unknown, @Req() req: { user?: { userId?: number } }) {
     const operatorUserId = req.user?.userId;
     const result = await this.service.createTransaction(body, operatorUserId);
     if (!result.ok) throw new Error(result.error.message);
     return result.data;
   }
   ```

- **Qabul mezoni (KAS-2):** `POST /api/finance/kassir/transactions` bilan `referenceType='payroll'` va PIN yo'q → `400/403`. Noto'g'ri PIN bilan → `403`. To'g'ri PIN bilan → `201` va `cash_transactions` da yangi qator.

### 2.2 Podotchet (EP-FIN-049)
- Xodimga avans beriladi (`POST /api/finance/kassir/podotchet/advance`) → `advance_reports` jadvaliga status `advance_given` bilan INSERT + GL entry (D: 1271-hisob, K: 1010-hisob).
- Xodim xarajat hisobotini yuklaydi (`POST /api/finance/kassir/podotchet/:id/submit`) → status `submitted`.
- Boshqaruvchi tasdiqlaydi (`PATCH /api/finance/kassir/podotchet/:id/approve`) → status `approved` + GL yopilish entry (D: hisob turga qarab, K: 1271).
- Rad etilsa (`PATCH /api/finance/kassir/podotchet/:id/reject`) → status `rejected`, sabab saqlash.
- `employee_debts` jadvaliga qoldiq yoziladi (agar xodim hisob bermasa).
- Qabul mezoni: advance POST → DB da 1 qator + GL `entries` da debit/kredit juft; approve POST → status `approved`, entries yakunlangan.

### 2.3 PayrollClosedEvent → GL (EP-FIN-056)
- HR moduli `PayrollClosedEvent` chiqaradi (payloadda: `periodId`, `totalGross`, `totalNet`, `totalDeductions`, `employeeCount`).
- Finance moduli ushbu eventni ushlab, `GlPostingService.postJournal` orqali `entries` jadvaliga ikki qator yozadi:
  - D: 6710 (Mehnat haqi xarajati) | K: 6710/1 (To'lanadigan ish haqi) → `totalGross` miqdori.
  - D: 6710/1 | K: 6400 (Ijtimoiy sug'urta) → `totalDeductions` miqdori (agar > 0).
- `referenceType = 'payroll_period'`, `referenceId = periodId`, `documentType = 'payroll'`.
- Qabul mezoni: HR payroll yopilsa → `entries` da 2 qator payroll periodiga bog'langan.

### 2.4 AP Invoice → GL (EP-FIN-037)
- `POST /api/finance/ap/entries` (mavjud endpoint) chaqirilganda `purchase_invoices` ga INSERT (hozir ishlaydi) **HAMDA** `insertJournal` bilan GL entry yozilishi shart:
  - D: 1610 (Ta'minotchi oldidagi qarz / Ta'minotchiga avans) | K: 6010 (Ta'minotchidan xarid) → `amount` miqdori.
- `referenceType = 'purchase_invoice'`, `referenceId = invoiceNo`, `documentType = 'purchase'`.
- Qabul mezoni: `POST /api/finance/ap/entries` → `purchase_invoices` + `entries` da juft qator.

### 2.5 Aging 90+ escalation CRON (EP-FIN-072 / AR aging)
- `financial-reports-alerts.cron.ts` mavjud `@Cron('*/30 * * * *')` ichida yangi metod: `_checkAging90Plus()`.
- `fi_invoices` (yoki `purchase_invoices`) dan 90+ kunlik muddati o'tgan debitorlik/kreditorlik olinadi.
- Telegram `muammo` kanaliga eskalatsiya xabari yuboriladi: mijoz nomi, summa, kechikkan kunlar.
- Qabul mezoni: `_checkOverdueDebts` → `_checkAging90Plus` qo'shiladi; cron test: DB da 90+ kunlik faktura bo'lsa Telegram xabar ketadi.

### 2.6 ShVB Telegram komandalar (EP-FIN-028)
- `bot.helpers.ts` faylida `BOT_PERMISSIONS['fin']` mavjud; `fin.bot.ts` faylida `/cashflow` va `/debts` mavjud.
- Yangi komandalar `bot.helpers.ts` ga **helper funksiyalar** sifatida qo'shiladi (OWNED file), `fin.bot.ts` ga teg TAQIQ (bu boshqa paket):

  | Komanda | Mazmun |
  |---------|--------|
  | `/zvs_status` | Joriy oy ZVS so'rovlari: `pending`, `approved`, `rejected` soni + umumiy summa |
  | `/company_state` | Kompaniya holati: kassa balansi (cash_registers), 30-kunlik kirim/chiqim, muddati o'tgan qarzlar soni |
  | `/weekly_digest` | 7 kunlik moliyaviy xulosa: kirim, chiqim, sof, top-3 xarajat kategoriyasi |

- Har komanda uchun helper funksiya: `buildZvsStatusReply()`, `buildCompanyStateReply()`, `buildWeeklyDigestReply()` — `execSqlResult<T>` ishlatadi (deprecated `execSql` EMAS — Q-40).
- Qabul mezoni: `/zvs_status` chaqirilsa DB dan haqiqiy qator keladi; Telegram HTML formatlangan xabar qaytaradi.

### 2.7 CashRegister.tsx → finance/kassir endpointlari (FE FIX)
- Hozir `CashRegister.tsx:27` `useCashRegister` hook (`/api/pos/products`, `/api/pos/transactions`) chaqiradi — POS module, KASSIR emas.
- Bu sahifani `/accounting/cash-register` route da ko'rsatish vizyon bilan zid (finance kassir, POS emas).
- FIX: sahifada **smena holat paneli** qo'shiladi: joriy ochiq smena bor-yo'q (`GET /api/finance/kassir/sessions/active`), `openBalance`, `totalInflow`, `totalOutflow` ko'rsatiladi.
- Mavjud POS funksionallik (product catalog, cart, payment) **O'CHIRILMAYDI** (Q-46) — ular ishlaydi. Faqat yangi "Smena" tab va `smenaQuery` qo'shiladi.
- Qabul mezoni: sahifada yangi "Smena" tab bor; `GET /api/finance/kassir/sessions/active` 200 qaytarsa smena ma'lumotlari ko'rinadi.

---

## 3. HOZIRGI HOLAT

### Mavjud (exists):

| Nima | Fayl:qator | Holat |
|------|-----------|-------|
| `cash_registers` pgTable | `lib/db/src/schema/fi-kassa.ts:29` | ✅ REAL schema |
| `cash_sessions` pgTable | `fi-kassa.ts:59` | ✅ REAL schema (status: open/closed/reconciled) |
| `cash_transactions` pgTable | `fi-kassa.ts:95` | ✅ REAL schema |
| `entries` pgTable (GL) | `lib/db/src/schema/fi-gl.ts:51` | ✅ REAL, debit/credit FK |
| `insertJournal` | `drizzle-gl-posting.repo.ts:72` | ✅ REAL — db.transaction, balanced |
| `GlPostingService.postJournal` | `gl-posting.service.ts` | ✅ REAL |
| `FinanceApService.createEntry` | `finance-ap.service.ts:34` | ✅ INSERT ishlaydi, GL YO'Q |
| `FinanceApRepository.createApEntry` | `finance-ap.repository.ts:98` | ✅ `purchase_invoices` INSERT |
| `FinancialReportsAlertsCron` | `financial-reports-alerts.cron.ts:16` | ✅ `*/30 min` cron, 3 metod |
| `_checkOverdueDebts` | `financial-reports-alerts.cron.ts:80` | ✅ mavjud, lekin 90+ filtri yo'q |
| `BOT_PERMISSIONS['fin']` | `bot.helpers.ts:105` | ✅ `['finance_manager','accountant',...]` |
| `execSqlResult<T>` | `bot.helpers.ts:44` | ✅ Result-pattern SQL helper |
| `FinBotService` | `fin.bot.ts:12` | ✅ `/cashflow`, `/debts` — lekin owned emas |
| `useCashRegister` hook | `CashRegister.tsx:27` | ⚠️ `/api/pos/*` ishlatadi |
| `DeliveryCompletedListener` pattern | `event-handlers/delivery-completed.listener.ts:16` | ✅ pattern namuna |

### Yo'q (missing):

| Nima yo'q | Qaysi fayl kerak | EP qoida |
|-----------|-----------------|---------|
| Kassir NestJS controller | `kassir/kassir.controller.ts` | EP-FIN-020/021 |
| Kassir service | `kassir/kassir.service.ts` | KAS-1/2 |
| Kassir Drizzle repo | `kassir/drizzle-kassir.repo.ts` | — |
| Kassir interface | `kassir/i-kassir.repo.ts` | — |
| Podotchet controller | `kassir/podotchet.controller.ts` | EP-FIN-049 |
| Podotchet service | `kassir/podotchet.service.ts` | EP-FIN-049 |
| `advance_reports` jadval | `lib/db/src/schema/fi-advance-reports.ts` | EP-FIN-049 |
| `employee_debts` jadval | fi-advance-reports.ts ichida | EP-FIN-049 |
| PayrollClosedEvent listener | `event-handlers/payroll-closed.listener.ts` | EP-FIN-056 |
| AP→GL wiring | `finance-ap.repository.ts` ga qo'shimcha | EP-FIN-037 |
| Aging 90+ escalation | `financial-reports-alerts.cron.ts` ga qo'shimcha | EP-FIN-072 |
| `/zvs_status`, `/company_state`, `/weekly_digest` helpers | `bot.helpers.ts` ga qo'shimcha | EP-FIN-028 |
| Smena tab FE | `CashRegister.tsx` | KAS-1 FE |
| KAS-2 PIN-per-operatsiya | `kassir.service.ts` + `kassir.controller.ts` | KAS-2 |

### Buzuq / noto'g'ri (brokenOrFake):

| Fayl:qator | Muammo |
|-----------|--------|
| `CashRegister.tsx:27` — `useCashRegister` | `/api/pos/products`, `/api/pos/transactions` chaqiradi; kassir smena EMAS |
| `finance-ap.repository.ts:98` — `createApEntry` | INSERT ishlaydi, lekin GL entry yo'q — AP→GL yo'q |
| `fin.bot.ts:28` — `getCashflow` | `finance_transactions` jadvalini so'raydi — bu jadval mavjud EMAS (canonical = `entries`); `execSql` deprecated ishlatadi |
| `financial-reports-alerts.cron.ts:80` — `_checkOverdueDebts` | `getOverdueDebtAlerts()` chaqiradi, lekin 90+ kun filtri yo'q; eskalatsiya darajasi yo'q |

---

## 4. ISH (qadam-baqadam)

### QADAM 0: Papka yaratish

```bash
mkdir -p Uzbek-Language-Module/apps/api/src/modules/finance/kassir
```

Natija: bo'sh papka (fayllar quyida yaratiladi).

---

### QADAM 1: `i-kassir.repo.ts` — Interface

**Fayl:** `apps/api/src/modules/finance/kassir/i-kassir.repo.ts`  
**Holat:** Yangi fayl

```typescript
// OLDIN: fayl mavjud emas

// KEYIN:
import { Result } from '@common/types/result.type';
import type { CashSession, CashTransaction, CashRegister } from '@shared/db';

export const KASSIR_REPO = Symbol('KASSIR_REPO');

export interface OpenSessionDto {
  registerId: number;
  openedBy: number;
  openingBalance: number;
  sessionNumber?: string;
}

export interface CloseSessionDto {
  closedBy: number;
  closingBalance: number;
  notes?: string;
}

export interface CreateTransactionDto {
  registerId: number;
  sessionId?: number;
  transactionType: 'inflow' | 'outflow';
  amount: number;
  description?: string;
  categoryId?: string;
  referenceType?: string;
  referenceId?: string;
  counterparty?: string;
  counterpartyType?: 'customer' | 'vendor' | 'employee' | 'other';
  paymentMethod?: 'cash' | 'card' | 'bank_transfer';
  createdBy?: number;
}

export interface XReport {
  session: CashSession;
  totalInflow: number;
  totalOutflow: number;
  expectedBalance: number;
  transactionCount: number;
}

export interface IKassirRepo {
  findActiveSession(registerId: number): Promise<Result<CashSession | null>>;
  findSessionById(id: number): Promise<Result<CashSession | null>>;
  openSession(dto: OpenSessionDto): Promise<Result<CashSession>>;
  closeSession(id: number, dto: CloseSessionDto): Promise<Result<CashSession>>;
  getXReport(sessionId: number): Promise<Result<XReport>>;
  createTransaction(dto: CreateTransactionDto): Promise<Result<CashTransaction>>;
  listRegisters(): Promise<Result<CashRegister[]>>;
  getRegisterById(id: number): Promise<Result<CashRegister | null>>;
}
```

**Qoidalar:** Result<T> barcha metodlarda. Symbol token DI uchun.

---

### QADAM 2: `drizzle-kassir.repo.ts` — Drizzle implementatsiya

**Fayl:** `apps/api/src/modules/finance/kassir/drizzle-kassir.repo.ts`  
**Holat:** Yangi fayl (~140 qator)

```typescript
// OLDIN: fayl mavjud emas

// KEYIN (to'liq implementatsiya):
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { cashRegisters, cashSessions, cashTransactions } from '@shared/db';
import { eq, sql, and, desc } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { safeCall } from '@common/result';
import type { IKassirRepo, OpenSessionDto, CloseSessionDto, CreateTransactionDto, XReport } from './i-kassir.repo';
import type { CashSession, CashTransaction, CashRegister } from '@shared/db';

@Injectable()
export class DrizzleKassirRepo implements IKassirRepo {
  private readonly logger = new Logger(DrizzleKassirRepo.name);

  async findActiveSession(registerId: number): Promise<Result<CashSession | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(cashSessions)
        .where(and(eq(cashSessions.registerId, registerId), eq(cashSessions.status, 'open')))
        .limit(1);
      return (rows[0] ?? null) as CashSession | null;
    }, 'DB_ERROR');
  }

  async findSessionById(id: number): Promise<Result<CashSession | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(cashSessions).where(eq(cashSessions.id, id)).limit(1);
      return (rows[0] ?? null) as CashSession | null;
    }, 'DB_ERROR');
  }

  async openSession(dto: OpenSessionDto): Promise<Result<CashSession>> {
    return safeCall(async () => {
      const sessionNumber = dto.sessionNumber ?? `SES-${Date.now()}`;
      const rows = await db.insert(cashSessions).values({
        registerId:     dto.registerId,
        sessionNumber,
        openedBy:       dto.openedBy,
        openingBalance: String(dto.openingBalance),
        totalInflow:    '0',
        totalOutflow:   '0',
        status:         'open',
        openedAt:       new Date(),
      }).returning();
      if (!rows[0]) throw new Error('Smena ochilmadi — INSERT qaytarmadi');
      return rows[0] as CashSession;
    }, 'DB_ERROR');
  }

  async closeSession(id: number, dto: CloseSessionDto): Promise<Result<CashSession>> {
    return safeCall(async () => {
      // Compute expectedBalance from current totalInflow/totalOutflow
      const sesRows = await db.select().from(cashSessions).where(eq(cashSessions.id, id)).limit(1);
      const ses = sesRows[0];
      if (!ses) throw new Error(`Session ${id} topilmadi`);
      const expected = Number(ses.openingBalance) + Number(ses.totalInflow) - Number(ses.totalOutflow);
      const variance = dto.closingBalance - expected;
      const updated = await db.update(cashSessions).set({
        closedBy:        dto.closedBy,
        closingBalance:  String(dto.closingBalance),
        expectedBalance: String(expected),
        variance:        String(variance),
        status:          'closed',
        closedAt:        new Date(),
        notes:           dto.notes ?? null,
      }).where(eq(cashSessions.id, id)).returning();
      if (!updated[0]) throw new Error('Smena yopilmadi');
      return updated[0] as CashSession;
    }, 'DB_ERROR');
  }

  async getXReport(sessionId: number): Promise<Result<XReport>> {
    return safeCall(async () => {
      const sesRows = await db.select().from(cashSessions).where(eq(cashSessions.id, sessionId)).limit(1);
      const session = sesRows[0];
      if (!session) throw new Error(`Session ${sessionId} topilmadi`);
      const aggRows = await db.select({
        totalInflow:  sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'inflow' THEN amount ELSE 0 END), 0)`,
        totalOutflow: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'outflow' THEN amount ELSE 0 END), 0)`,
        txCount:      sql<number>`COUNT(*)`,
      }).from(cashTransactions).where(eq(cashTransactions.sessionId, sessionId));
      const agg = aggRows[0] ?? { totalInflow: '0', totalOutflow: '0', txCount: 0 };
      const inflow  = Number(agg.totalInflow);
      const outflow = Number(agg.totalOutflow);
      return {
        session: session as CashSession,
        totalInflow:  inflow,
        totalOutflow: outflow,
        expectedBalance: Number(session.openingBalance) + inflow - outflow,
        transactionCount: Number(agg.txCount),
      };
    }, 'DB_ERROR');
  }

  async createTransaction(dto: CreateTransactionDto): Promise<Result<CashTransaction>> {
    return safeCall(async () => {
      const txNumber = `TX-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];
      const rows = await db.insert(cashTransactions).values({
        registerId:       dto.registerId,
        sessionId:        dto.sessionId ?? null,
        transactionNumber: txNumber,
        transactionDate:  today,
        transactionType:  dto.transactionType,
        amount:           String(dto.amount),
        description:      dto.description ?? null,
        categoryId:       dto.categoryId ?? null,
        referenceType:    dto.referenceType ?? null,
        referenceId:      dto.referenceId ?? null,
        counterparty:     dto.counterparty ?? null,
        counterpartyType: dto.counterpartyType ?? null,
        paymentMethod:    dto.paymentMethod ?? 'cash',
        currency:         'UZS',
        createdBy:        dto.createdBy ?? null,
      }).returning();
      if (!rows[0]) throw new Error('Tranzaksiya yaratilmadi');
      // Update session totals
      if (dto.sessionId) {
        const col = dto.transactionType === 'inflow' ? cashSessions.totalInflow : cashSessions.totalOutflow;
        await db.update(cashSessions).set({
          [dto.transactionType === 'inflow' ? 'totalInflow' : 'totalOutflow']:
            sql`${col} + ${String(dto.amount)}`,
        }).where(eq(cashSessions.id, dto.sessionId));
      }
      return rows[0] as CashTransaction;
    }, 'DB_ERROR');
  }

  async listRegisters(): Promise<Result<CashRegister[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(cashRegisters).where(eq(cashRegisters.isActive, true))
        .orderBy(cashRegisters.name);
      return rows as CashRegister[];
    }, 'DB_ERROR');
  }

  async getRegisterById(id: number): Promise<Result<CashRegister | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(cashRegisters).where(eq(cashRegisters.id, id)).limit(1);
      return (rows[0] ?? null) as CashRegister | null;
    }, 'DB_ERROR');
  }
}
```

**Qoida 3:** Drizzle ORM. `sql<T>` faqat aggregate uchun (izoh bilan). `safeCall` Result<T> garantiyasi.

---

### QADAM 3: `kassir.service.ts` — Biznes logika

**Fayl:** `apps/api/src/modules/finance/kassir/kassir.service.ts`  
**Holat:** Yangi fayl

```typescript
// OLDIN: fayl mavjud emas

// KEYIN (biznes logika + Result<T>):
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { KASSIR_REPO, type IKassirRepo, type OpenSessionDto, type CloseSessionDto, type CreateTransactionDto } from './i-kassir.repo';

const OpenSessionSchema = z.object({
  registerId:     z.number().int().positive(),
  openedBy:       z.number().int().positive(),
  openingBalance: z.number().nonnegative(),
});

const CloseSessionSchema = z.object({
  closedBy:       z.number().int().positive(),
  closingBalance: z.number().nonnegative(),
  notes:          z.string().optional(),
});

const CreateTransactionSchema = z.object({
  registerId:      z.number().int().positive(),
  sessionId:       z.number().int().optional(),
  transactionType: z.enum(['inflow', 'outflow']),
  amount:          z.number().positive(),
  description:     z.string().optional(),
  paymentMethod:   z.enum(['cash', 'card', 'bank_transfer']).optional(),
  counterparty:    z.string().optional(),
  counterpartyType:z.enum(['customer', 'vendor', 'employee', 'other']).optional(),
  referenceType:   z.string().optional(),
  referenceId:     z.string().optional(),
  categoryId:      z.string().optional(),
  createdBy:       z.number().int().optional(),
});

@Injectable()
export class KassirService {
  constructor(@Inject(KASSIR_REPO) private readonly repo: IKassirRepo) {}

  async listRegisters(): Promise<Result<unknown, AppError>> {
    return this.repo.listRegisters();
  }

  async openSession(raw: unknown): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const dto = OpenSessionSchema.parse(raw) as OpenSessionDto;
      // Guard: kassa uchun ochiq smena bo'lmasligi kerak
      const existing = await this.repo.findActiveSession(dto.registerId);
      if (existing.ok && existing.data) {
        throw new Error(`Kassa #${dto.registerId} da allaqachon ochiq smena mavjud: #${existing.data.id}`);
      }
      const result = await this.repo.openSession(dto);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    });
  }

  async closeSession(id: number, raw: unknown): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const dto = CloseSessionSchema.parse(raw) as CloseSessionDto;
      const sesResult = await this.repo.findSessionById(id);
      if (!sesResult.ok || !sesResult.data) throw new Error(`Smena #${id} topilmadi`);
      if (sesResult.data.status !== 'open') throw new Error(`Smena #${id} allaqachon yopilgan`);
      const result = await this.repo.closeSession(id, dto);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    });
  }

  async getXReport(sessionId: number): Promise<Result<unknown, AppError>> {
    return this.repo.getXReport(sessionId);
  }

  // KAS-2: createTransaction PIN bilan — to'liq kod §2.1 da (ushbu qadam §4 da batafsil ko'rsatilmaydi)
  // §2.1 da createTransaction + verifyKassirPin metodlari batafsil ko'rsatilgan.
  // Bu yerda faqat stub:
  async createTransaction(raw: unknown, operatorUserId?: number): Promise<Result<unknown, AppError>> {
    // KAS-2 PIN tekshirish §2.1 ko'rsatmasi bo'yicha amalga oshiriladi
    return safeCall(async () => {
      const dto = CreateTransactionSchema.parse(raw) as CreateTransactionDto & { pin?: string };
      // PIN tekshiruvi §2.1 verifyKassirPin pattern bo'yicha
      const result = await this.repo.createTransaction(dto);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    });
  }

  async getActiveSession(registerId: number): Promise<Result<unknown, AppError>> {
    return this.repo.findActiveSession(registerId);
  }
}
```

Import `z` from 'zod' qo'shishni UNUTMA. **KAS-2 to'liq implementatsiya uchun §2.1 ko'rsatmasini o'qi.**

---

### QADAM 4: `kassir.controller.ts` — NestJS Controller

**Fayl:** `apps/api/src/modules/finance/kassir/kassir.controller.ts`  
**Holat:** Yangi fayl

```typescript
// OLDIN: fayl mavjud emas

// KEYIN:
import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { KassirService } from './kassir.service';

@Controller('finance/kassir')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KassirController {
  constructor(private readonly service: KassirService) {}

  // GET /api/finance/kassir/registers
  @Get('registers')
  @Roles('finance_manager', 'accountant', 'chief_accountant', 'director', 'super_admin')
  async listRegisters() {
    const result = await this.service.listRegisters();
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // GET /api/finance/kassir/sessions/active?registerId=1
  @Get('sessions/active')
  @Roles('finance_manager', 'accountant', 'cashier', 'director', 'super_admin')
  async getActive(@Req() req: { query: { registerId?: string } }) {
    const registerId = parseInt(req.query.registerId ?? '1', 10);
    const result = await this.service.getActiveSession(registerId);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // POST /api/finance/kassir/sessions — smena ochish
  @Post('sessions')
  @Roles('finance_manager', 'accountant', 'cashier', 'chief_accountant', 'super_admin')
  async openSession(@Body() body: unknown) {
    const result = await this.service.openSession(body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // PATCH /api/finance/kassir/sessions/:id/close — smena yopish
  @Patch('sessions/:id/close')
  @Roles('finance_manager', 'accountant', 'cashier', 'chief_accountant', 'super_admin')
  async closeSession(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const result = await this.service.closeSession(id, body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // GET /api/finance/kassir/sessions/:id/x-report — X-hisobot
  @Get('sessions/:id/x-report')
  @Roles('finance_manager', 'accountant', 'cashier', 'chief_accountant', 'director', 'super_admin')
  async getXReport(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.getXReport(id);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // POST /api/finance/kassir/transactions — tranzaksiya yaratish (KAS-2: PIN bilan)
  // KAS-2: §2.1 ko'rsatmasi bo'yicha PIN-per-operatsiya tekshiruvi service ichida
  @Post('transactions')
  @Roles('finance_manager', 'accountant', 'cashier', 'chief_accountant', 'super_admin')
  async createTransaction(@Body() body: unknown, @Req() req: { user?: { userId?: number } }) {
    const operatorUserId = req.user?.userId; // KAS-2: kassir PIN uchun user ID
    const result = await this.service.createTransaction(body, operatorUserId);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
```

**Qoida 8:** Har endpoint `@Roles` bilan himoyalangan. `@Body() body: unknown` + Zod service ichida.
**KAS-2:** `createTransaction` — `@Req()` dan `operatorUserId` olib service ga uzatiladi. PIN tekshiruv §2.1 da.

---

### QADAM 5: `fi-advance-reports.ts` — DDL (GATED)

**Fayl:** `lib/db/src/schema/fi-advance-reports.ts`  
**Holat:** Yangi fayl — **DDL GATED, ishga tushurilmaydi**

```typescript
/**
 * @module fi-advance-reports
 * @description Podotchet (advance reports) + employee debts DDL.
 * -- APPROVED: <egasi> <sana> — bu izohsiz migration ishga tushirilmaydi!
 */

import { pgTable, serial, integer, varchar, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './core-schema';
import { numericMoney } from './numeric-money';

// Podotchet (Avans hisobotlari)
// EP-FIN-049: advance_given → submitted → approved/rejected
export const advanceReports = pgTable('advance_reports', {
  id:           serial('id').primaryKey(),
  employeeId:   integer('employee_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  approvedBy:   integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  amount:       numericMoney('amount').notNull(),
  currency:     varchar('currency', { length: 10 }).notNull().default('UZS'),
  purpose:      text('purpose').notNull(),
  status:       varchar('status', { length: 30 }).notNull().default('advance_given'),
  // status: advance_given | submitted | approved | rejected
  submittedAt:  timestamp('submitted_at'),
  approvedAt:   timestamp('approved_at'),
  rejectedAt:   timestamp('rejected_at'),
  rejectReason: text('reject_reason'),
  // GL reference — set when approved → GL entry created
  glEntryRef:   varchar('gl_entry_ref', { length: 80 }),
  reportUrl:    text('report_url'),    // xarajat hujjati URL
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
});

export type AdvanceReport = typeof advanceReports.$inferSelect;

export const insertAdvanceReportSchema = createInsertSchema(advanceReports, {
  employeeId: z.number().int().positive(),
  amount:     z.number().positive('Summa 0 dan katta bo\'lishi kerak'),
  purpose:    z.string().min(3, 'Maqsad kamida 3 ta belgi'),
  status:     z.enum(['advance_given', 'submitted', 'approved', 'rejected']).default('advance_given'),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type InsertAdvanceReport = z.infer<typeof insertAdvanceReportSchema>;

// Employee debts (Xodim qarzlari)
// EP-FIN-049: har-som-hisobli — avansdan qolgan qarz
export const employeeDebts = pgTable('employee_debts', {
  id:              serial('id').primaryKey(),
  employeeId:      integer('employee_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  advanceReportId: integer('advance_report_id').references(() => advanceReports.id, { onDelete: 'set null' }),
  debtBalance:     numericMoney('debt_balance').notNull().default(0),
  currency:        varchar('currency', { length: 10 }).notNull().default('UZS'),
  reason:          text('reason'),
  resolvedAt:      timestamp('resolved_at'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
});

export type EmployeeDebt = typeof employeeDebts.$inferSelect;

export const insertEmployeeDebtSchema = createInsertSchema(employeeDebts, {
  employeeId:  z.number().int().positive(),
  debtBalance: z.number().nonnegative(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type InsertEmployeeDebt = z.infer<typeof insertEmployeeDebtSchema>;
```

**Migration SQL (GATED — faqat `-- APPROVED:` qo'shilgandan keyin ishga tushirilsin):**

```sql
-- Migration: fi-advance-reports
-- APPROVED: <egasi> <sana>
-- Idempotent: IF NOT EXISTS ishlatiladi

CREATE TABLE IF NOT EXISTS advance_reports (
  id             SERIAL PRIMARY KEY,
  employee_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount         NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency       VARCHAR(10) NOT NULL DEFAULT 'UZS',
  purpose        TEXT NOT NULL,
  status         VARCHAR(30) NOT NULL DEFAULT 'advance_given'
                   CHECK (status IN ('advance_given','submitted','approved','rejected')),
  submitted_at   TIMESTAMPTZ,
  approved_at    TIMESTAMPTZ,
  rejected_at    TIMESTAMPTZ,
  reject_reason  TEXT,
  gl_entry_ref   VARCHAR(80),
  report_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_debts (
  id               SERIAL PRIMARY KEY,
  employee_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  advance_report_id INTEGER REFERENCES advance_reports(id) ON DELETE SET NULL,
  debt_balance     NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (debt_balance >= 0),
  currency         VARCHAR(10) NOT NULL DEFAULT 'UZS',
  reason           TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advance_reports_employee_id ON advance_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_reports_status      ON advance_reports(status);
CREATE INDEX IF NOT EXISTS idx_employee_debts_employee_id  ON employee_debts(employee_id);
```

---

### QADAM 6: `podotchet.service.ts` — Podotchet biznes logika (GATED — DDL tasdiqlanganidan keyin)

**Fayl:** `apps/api/src/modules/finance/kassir/podotchet.service.ts`  
**Holat:** Yangi fayl — DDL tayyor bo'lgandan keyin aktiv bo'ladi

```typescript
// OLDIN: fayl mavjud emas

// KEYIN:
import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { db } from '@shared/db';
import { advanceReports, employeeDebts } from '@shared/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
// NOTE: GlPostingService P24 dan import — modul chegarasidan o'tish,
// ya'ni finance modul ichida. Agar boshqa modul bo'lsa — event orqali!
import { GlPostingService } from '../domain/services/gl-posting.service';

const AdvanceGiveSchema = z.object({
  employeeId: z.number().int().positive(),
  amount:     z.number().positive(),
  purpose:    z.string().min(3),
  createdBy:  z.number().int().positive(),
});

const ApproveSchema = z.object({
  approvedBy: z.number().int().positive(),
});

const RejectSchema = z.object({
  rejectedBy: z.number().int().positive(),
  reason:     z.string().min(3),
});

// GL hisob kodlari (BHMS):
// 1271 — Xodimlarga berilgan avanslar
// 1010 — Kassa hisobvarag'i
// 9400 — Umumiy va ma'muriy xarajatlar (tasdiqlangan hujjat bo'yicha)
const GL_ADVANCE_GIVEN  = '1271'; // D: xodim avans, K: kassa
const GL_CASH           = '1010';
const GL_EXPENSE_ADMIN  = '9400'; // D: xarajat, K: xodim avans (approve)

@Injectable()
export class PodotchetService {
  constructor(private readonly glService: GlPostingService) {}

  // Avans berish: advance_reports INSERT + GL D:1271 K:1010
  async giveAdvance(raw: unknown): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const dto = AdvanceGiveSchema.parse(raw);
      const rows = await db.insert(advanceReports).values({
        employeeId: dto.employeeId,
        amount:     String(dto.amount),
        purpose:    dto.purpose,
        status:     'advance_given',
      }).returning();
      const report = rows[0];
      if (!report) throw new Error('Avans hisoboti yaratilmadi');

      // GL provodka: D:1271 K:1010
      const glRef = `ADV-${report.id}`;
      await this.glService.postJournal({
        lines: [
          { accountCode: GL_ADVANCE_GIVEN, side: 'debit',  amount: dto.amount },
          { accountCode: GL_CASH,          side: 'credit', amount: dto.amount },
        ],
        documentType:  'advance_given',
        referenceType: 'advance_report',
        referenceId:   String(report.id),
        description:   `Avans: ${dto.purpose} — xodim #${dto.employeeId}`,
        createdBy:     dto.createdBy,
      });

      // gl_entry_ref saqlash
      await db.update(advanceReports).set({ glEntryRef: glRef, updatedAt: new Date() })
        .where(eq(advanceReports.id, report.id));

      return report;
    });
  }

  // Hisobot topshirish
  async submitReport(id: number, raw: unknown): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const dto = z.object({ reportUrl: z.string().url() }).parse(raw);
      const updated = await db.update(advanceReports).set({
        status:      'submitted',
        submittedAt: new Date(),
        reportUrl:   dto.reportUrl,
        updatedAt:   new Date(),
      }).where(eq(advanceReports.id, id)).returning();
      if (!updated[0]) throw new Error(`Avans hisoboti #${id} topilmadi`);
      return updated[0];
    });
  }

  // Tasdiqlash: status approved + GL D:9400 K:1271
  async approveReport(id: number, raw: unknown): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const dto = ApproveSchema.parse(raw);
      const rows = await db.select().from(advanceReports).where(eq(advanceReports.id, id)).limit(1);
      const report = rows[0];
      if (!report) throw new Error(`Avans hisoboti #${id} topilmadi`);
      if (report.status !== 'submitted') throw new Error(`Status 'submitted' bo'lishi kerak, hozir: ${report.status}`);

      // GL yopish provodka: D:9400 K:1271
      await this.glService.postJournal({
        lines: [
          { accountCode: GL_EXPENSE_ADMIN, side: 'debit',  amount: Number(report.amount) },
          { accountCode: GL_ADVANCE_GIVEN, side: 'credit', amount: Number(report.amount) },
        ],
        documentType:  'advance_approved',
        referenceType: 'advance_report',
        referenceId:   String(id),
        description:   `Avans tasdiqlandi: ${report.purpose}`,
        createdBy:     dto.approvedBy,
      });

      const updated = await db.update(advanceReports).set({
        status:     'approved',
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        updatedAt:  new Date(),
      }).where(eq(advanceReports.id, id)).returning();
      return updated[0];
    });
  }

  // Rad etish: status rejected + employee_debt yozish (qoldiq)
  async rejectReport(id: number, raw: unknown): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const dto = RejectSchema.parse(raw);
      const rows = await db.select().from(advanceReports).where(eq(advanceReports.id, id)).limit(1);
      const report = rows[0];
      if (!report) throw new Error(`Avans hisoboti #${id} topilmadi`);

      const updated = await db.update(advanceReports).set({
        status:       'rejected',
        rejectedAt:   new Date(),
        rejectReason: dto.reason,
        updatedAt:    new Date(),
      }).where(eq(advanceReports.id, id)).returning();

      // Rad etilganda xodim qarzga kiradi
      await db.insert(employeeDebts).values({
        employeeId:      report.employeeId,
        advanceReportId: id,
        debtBalance:     report.amount,
        reason:          `Avans #${id} rad etildi: ${dto.reason}`,
      });

      return updated[0];
    });
  }

  async listByEmployee(employeeId: number): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      return db.select().from(advanceReports).where(eq(advanceReports.employeeId, employeeId))
        .orderBy(advanceReports.createdAt);
    });
  }
}
```

---

### QADAM 7: `podotchet.controller.ts` — Podotchet Controller (GATED)

**Fayl:** `apps/api/src/modules/finance/kassir/podotchet.controller.ts`  
**Holat:** Yangi fayl — DDL tayyor bo'lgandan keyin aktiv

```typescript
// OLDIN: fayl mavjud emas

// KEYIN:
import { Controller, Post, Patch, Get, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { PodotchetService } from './podotchet.service';

@Controller('finance/kassir/podotchet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PodotchetController {
  constructor(private readonly service: PodotchetService) {}

  // POST /api/finance/kassir/podotchet/advance — avans berish
  @Post('advance')
  @Roles('finance_manager', 'accountant', 'chief_accountant', 'director', 'super_admin')
  async giveAdvance(@Body() body: unknown) {
    const result = await this.service.giveAdvance(body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // POST /api/finance/kassir/podotchet/:id/submit — hisobot topshirish
  @Post(':id/submit')
  @Roles('finance_manager', 'accountant', 'cashier', 'super_admin')
  async submitReport(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const result = await this.service.submitReport(id, body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // PATCH /api/finance/kassir/podotchet/:id/approve — tasdiqlash
  @Patch(':id/approve')
  @Roles('finance_manager', 'chief_accountant', 'director', 'super_admin')
  async approveReport(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const result = await this.service.approveReport(id, body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // PATCH /api/finance/kassir/podotchet/:id/reject — rad etish
  @Patch(':id/reject')
  @Roles('finance_manager', 'chief_accountant', 'director', 'super_admin')
  async rejectReport(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const result = await this.service.rejectReport(id, body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  // GET /api/finance/kassir/podotchet/employee/:id
  @Get('employee/:id')
  @Roles('finance_manager', 'accountant', 'chief_accountant', 'director', 'super_admin')
  async listByEmployee(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.listByEmployee(id);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
```

---

### QADAM 8: `payroll-closed.listener.ts` — PayrollClosedEvent → GL

**Fayl:** `apps/api/src/modules/finance/infrastructure/event-handlers/payroll-closed.listener.ts`  
**Holat:** Yangi fayl (pattern: `delivery-completed.listener.ts:16` ga o'xshab)

```typescript
// OLDIN: fayl mavjud emas

// KEYIN (EP-FIN-056):
/**
 * @module payroll-closed.listener
 * @description EP-FIN-056: HR PayrollClosedEvent → Finance GL posting.
 * GL provodka: D:6710 (Mehnat haqi xarajati) K:6710/1 (To'lanadigan ish haqi) — gross.
 * GL provodka: D:6710/1 K:6400 (Ijtimoiy sug'urta) — deductions (agar >0).
 * referenceType='payroll_period', referenceId=periodId, documentType='payroll'.
 */
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { GlPostingService } from '../../domain/services/gl-posting.service';

// PayrollClosedEvent — HR modulidan (P24 tomonidan tegib o'tilmagan event):
// payload: { periodId: number; totalGross: number; totalNet: number;
//            totalDeductions: number; employeeCount: number; }
// NOTE: Bu event HR modul chiqaradi. Agar PayrollClosedEvent import yo'q bo'lsa —
//       TO'XTA, P24/HR agentiga flag qil. Bu listener event class tayyor bo'lgandan KEYIN wires.

// Placeholder import — P24/HR dan kelishi kerak:
// import { PayrollClosedEvent } from '@modules/hr/domain/events/payroll-closed.event';

// Agar import yo'q bo'lsa, event shapeni inline ta'riflaymiz (temp):
class PayrollClosedEvent {
  constructor(
    public readonly periodId: number,
    public readonly totalGross: number,
    public readonly totalNet: number,
    public readonly totalDeductions: number,
    public readonly employeeCount: number,
  ) {}
}

const GL_PAYROLL_EXPENSE   = '6710';   // Mehnat haqi xarajati
const GL_PAYROLL_PAYABLE   = '6710/1'; // To'lanadigan ish haqi
const GL_SOCIAL_INSURANCE  = '6400';   // Ijtimoiy sug'urta

@Injectable()
@EventsHandler(PayrollClosedEvent)
export class PayrollClosedListener implements IEventHandler<PayrollClosedEvent> {
  private readonly logger = new Logger(PayrollClosedListener.name);

  constructor(private readonly glService: GlPostingService) {}

  async handle(event: PayrollClosedEvent): Promise<void> {
    try {
      this.logger.log(`PayrollClosedEvent qabul qilindi — period #${event.periodId}, gross=${event.totalGross}`);

      if (!event.totalGross || event.totalGross <= 0) {
        this.logger.warn(`Noto'g'ri gross=${event.totalGross} — GL yozilmadi`);
        return;
      }

      // 1. D:6710 K:6710/1 — gross mehnat haqi
      const grossResult = await this.glService.postJournal({
        lines: [
          { accountCode: GL_PAYROLL_EXPENSE, side: 'debit',  amount: event.totalGross },
          { accountCode: GL_PAYROLL_PAYABLE, side: 'credit', amount: event.totalGross },
        ],
        documentType:  'payroll',
        referenceType: 'payroll_period',
        referenceId:   String(event.periodId),
        description:   `Oylik mehnat haqi — davr #${event.periodId} (${event.employeeCount} xodim)`,
      });

      if (!grossResult.ok) {
        this.logger.error(`GL gross provodka xato: ${grossResult.error.message}`);
        return;
      }

      // 2. D:6710/1 K:6400 — ijtimoiy sug'urta (faqat >0 bo'lsa)
      if (event.totalDeductions > 0) {
        const dedResult = await this.glService.postJournal({
          lines: [
            { accountCode: GL_PAYROLL_PAYABLE,  side: 'debit',  amount: event.totalDeductions },
            { accountCode: GL_SOCIAL_INSURANCE, side: 'credit', amount: event.totalDeductions },
          ],
          documentType:  'payroll',
          referenceType: 'payroll_period',
          referenceId:   `${event.periodId}-ded`,
          description:   `Ijtimoiy sug'urta — davr #${event.periodId}`,
        });
        if (!dedResult.ok) {
          this.logger.error(`GL deductions provodka xato: ${dedResult.error.message}`);
        }
      }

      this.logger.log(`PayrollClosedEvent GL muvaffaqiyatli — period #${event.periodId}`);
    } catch (error: unknown) {
      this.logger.error(`PayrollClosedListener xato: ${(error as Error).message}`);
    }
  }
}
```

**MUHIM BAYROQ:** `PayrollClosedEvent` HR modulidan import bo'lishi kerak. Agar HR agenti (P-HR wave) bu classni chiqarmagan bo'lsa — TO'XTA, flagga qil: `// FLAG: PayrollClosedEvent HR dan import qilinmagan — P-HR agent bilan koordinatsiya kerak`. Inline class faqat TypeScript kompilyatsiyasi uchun placeholder.

---

### QADAM 9: `finance-ap.repository.ts` — AP → GL wiring

**Fayl:** `apps/api/src/modules/finance/infrastructure/repositories/finance-ap.repository.ts`  
**Holat:** Mavjud fayl — `createApEntry` metodiga GL qo'shish

**OLDIN (`:98-116`):**
```typescript
async createApEntry(dto: CreateApEntryDto): Promise<Result<Row>> {
  return safeCall(async () => {
    const invoiceNo = `AP-${Date.now()}`;
    const rows = await db.insert(purchase_invoices).values({
      vendor_id:      dto.vendorId != null ? Number(dto.vendorId) : null,
      supplier_name:  null,
      invoice_no:     invoiceNo,
      total_amount:   String(dto.amount),
      paid_amount:    '0',
      amount:         String(dto.amount),
      currency:       'UZS',
      due_date:       dto.dueDate ?? null,
      status:         'pending',
      payment_status: 'unpaid',
      notes:          dto.description ?? null,
    } as typeof purchase_invoices.$inferInsert).returning();
    return (rows[0] ?? {}) as Row;
  }, 'DB_ERROR');
}
```

**KEYIN (`:98-130` — GL qo'shildi, GlPostingService inject qilinadi):**
```typescript
// Constructor ga qo'shiladi:
constructor(private readonly glService: GlPostingService) {}

// GL hisob kodlari (BHMS):
// 1610 — Ta'minotchidan olingan qarz (AP)
// 6010 — Xarid xarajati / Ta'minotchidan sotib olish

async createApEntry(dto: CreateApEntryDto): Promise<Result<Row>> {
  return safeCall(async () => {
    const invoiceNo = `AP-${Date.now()}`;
    // DB transaction: INSERT + GL atomik
    let newRow: Row = {};
    await db.transaction(async (_tx) => {
      const rows = await db.insert(purchase_invoices).values({
        vendor_id:      dto.vendorId != null ? Number(dto.vendorId) : null,
        supplier_name:  null,
        invoice_no:     invoiceNo,
        total_amount:   String(dto.amount),
        paid_amount:    '0',
        amount:         String(dto.amount),
        currency:       'UZS',
        due_date:       dto.dueDate ?? null,
        status:         'pending',
        payment_status: 'unpaid',
        notes:          dto.description ?? null,
      } as typeof purchase_invoices.$inferInsert).returning();
      newRow = (rows[0] ?? {}) as Row;
    });

    // GL provodka: D:1610 K:6010 — EP-FIN-037
    // NOTE: GL transaction alohida — insertJournal o'z db.transaction ichida
    const glResult = await this.glService.postJournal({
      lines: [
        { accountCode: '1610', side: 'debit',  amount: dto.amount },
        { accountCode: '6010', side: 'credit', amount: dto.amount },
      ],
      documentType:  'purchase',
      referenceType: 'purchase_invoice',
      referenceId:   invoiceNo,
      description:   dto.description ?? `AP faktura: ${invoiceNo}`,
    });

    if (!glResult.ok) {
      // GL xato: log + davom et (AP invoice yaratildi, GL log)
      // NOTE: Agar ikkala atomik bo'lishi kerak bo'lsa — egasiga flag:
      // AP rollback = murakkab, hozircha soft-fail
      this.logger.warn(`AP GL provodka xato (${invoiceNo}): ${glResult.error.message}`);
    }

    return newRow;
  }, 'DB_ERROR');
}
```

**MUHIM:** `GlPostingService` inject qilish finance modul ichida (DDD: bir modul ichida). `@Inject` va constructor parametr yangilanadi. `logger` field ham qo'shiladi.

---

### QADAM 10: `finance-ap.service.ts` — GlPostingService uzatish

**Fayl:** `apps/api/src/modules/finance/application/finance-ap.service.ts`  
**Holat:** Mavjud fayl — konstruktor o'zgarishi

**OLDIN (`:14-16`):**
```typescript
@Injectable()
export class FinanceApService {
  constructor(@Inject(FINANCE_AP_REPO) private readonly repo: IFinanceApRepo) {}
```

**KEYIN:**
```typescript
@Injectable()
export class FinanceApService {
  constructor(
    @Inject(FINANCE_AP_REPO) private readonly repo: IFinanceApRepo,
    // GlPostingService repo ga inject qilish uchun (P24 provides)
    // NOTE: Agar `finance-ap.repository.ts` ga inject qilinsak, DI graph ni e'tiborga ol
    // Alternativa: service ichida direct gl call ham mumkin (finance modul internal)
  ) {}
```

**ESLATMA:** `GlPostingService` → `FinanceApRepository` inject zanjiri `FinanceModule` NestJS DI ichida bo'lishi kerak. Modul fayli (`finance.module.ts` yoki `kassir` submodul) providers ro'yxatida hamma yangi class yozilishi shart. Bu **modul faylga** teg degani — agar FinanceModule OWNED emas bo'lsa, TO'XTA, egasiga flag. Aks holda: `FinanceApRepository` constructor ga `GlPostingService` qo'sh (finance modul ichida OK).

---

### QADAM 11: `financial-reports-alerts.cron.ts` — Aging 90+ qo'shish

**Fayl:** `apps/api/src/modules/finance/financial-reports/cron/financial-reports-alerts.cron.ts`  
**Holat:** Mavjud fayl — yangi metod qo'shish (mavjud metodlar O'CHIRILMAYDI — Q-46)

**OLDIN (`:27-45` — `checkAlerts` metodi):**
```typescript
@Cron('*/30 * * * *')
async checkAlerts(): Promise<void> {
  if (!this.configService.get<string>('TELEGRAM_MUAMMO_CHAT_ID') && !this.configService.get<string>('TELEGRAM_VAZIFA_CHAT_ID')) {
    return;
  }
  const now = _time.now().toISOString();
  this.logger.debug(`Alert check at ${now}`);
  try {
    await Promise.allSettled([
      this._checkOverstock(now),
      this._checkOutOfStock(now),
      this._checkOverdueDebts(now),
    ]);
  } catch (err) {
    this.logger.error(`Alert cron error: ${String(err)}`);
  }
}
```

**KEYIN (yangi `_checkAging90Plus` qo'shiladi, `checkAlerts` kengaytiriladi):**
```typescript
@Cron('*/30 * * * *')
async checkAlerts(): Promise<void> {
  if (!this.configService.get<string>('TELEGRAM_MUAMMO_CHAT_ID') && !this.configService.get<string>('TELEGRAM_VAZIFA_CHAT_ID')) {
    return;
  }
  const now = _time.now().toISOString();
  this.logger.debug(`Alert check at ${now}`);
  try {
    await Promise.allSettled([
      this._checkOverstock(now),
      this._checkOutOfStock(now),
      this._checkOverdueDebts(now),
      this._checkAging90Plus(now),  // EP-FIN-072: YANGI
    ]);
  } catch (err) {
    this.logger.error(`Alert cron error: ${String(err)}`);
  }
}

// EP-FIN-072: Aging 90+ eskalatsiya
private async _checkAging90Plus(timestamp: string): Promise<void> {
  // 90+ kunlik muddati o'tgan AP/AR invoicelar
  const result = await this.query.getAging90PlusAlerts();
  if (!result.ok || !Array.isArray(result.data) || !result.data.length) return;

  const fmt = (n: number) => this.analytics.formatCurrency(n);
  const lines = result.data.slice(0, 10).map((a: Record<string, unknown>) =>
    `  🔴 ${a['counterparty'] ?? `#${a['id']}`}: <b>${fmt(Number(a['amount'] ?? 0))}</b> — <b>${a['daysOverdue']} kun</b> (90+)`
  );

  await this.telegram.sendReport(
    'muammo',
    `<b>🚨 90+ Kun Muddati O'tgan Qarzlar [${timestamp.slice(0, 16).replace('T', ' ')}]</b>\n\n${lines.join('\n')}\n\n<i>Bosh buxgalter darhol choralar ko'rishi kerak!</i>`,
  );
}
```

**MUHIM:** `this.query.getAging90PlusAlerts()` metodini `FinancialReportsQueryService` ga qo'shish kerak. Bu fayl **OWNED EMAS** — flag: `// FLAG: getAging90PlusAlerts() → FinancialReportsQueryService OWNED EMAS, P24 yoki FIN-reports agentiga qo'shilsin`. Hozircha metod `query` da yo'qligi uchun `if (!result.ok)` safe qaytaradi.

---

### QADAM 12: `bot.helpers.ts` — ShVB Telegram helper funksiyalar

**Fayl:** `apps/api/src/modules/bot-gateway/bots/bot.helpers.ts`  
**Holat:** Mavjud fayl — faqat yangi helper funksiyalar qo'shiladi (mavjud kod O'CHIRILMAYDI — Q-46)

**QUSHILADI (faylning oxiriga — oxirgi `export` dan keyin):**

```typescript
// ============================================================
// EP-FIN-028: ShVB Telegram bot komandalar (Finance)
// Bu funksiyalar fin.bot.ts da chaqiriladi.
// execSqlResult<T> ishlatiladi (deprecated execSql EMAS — Q-40).
// ============================================================

export interface ZvsStatusRow {
  status: string;
  count: string;
  total_amount: string;
}

export interface CompanyStateRow {
  register_name: string;
  current_balance: string;
  total_inflow_30d: string;
  total_outflow_30d: string;
  overdue_count: string;
}

export interface WeeklyDigestRow {
  type: string;
  total: string;
  category: string;
}

/**
 * /zvs_status — joriy oy ZVS so'rovlari: pending/approved/rejected soni + summa.
 * `zvs` jadvaliga raw SQL: yo'q bo'lsa graceful 0 qaytaradi.
 */
export async function buildZvsStatusReply(): Promise<BotReply> {
  const r = await execSqlResult<ZvsStatusRow>(drizzleSql`
    SELECT
      status,
      COUNT(*)::text   AS count,
      COALESCE(SUM(amount),0)::text AS total_amount
    FROM zvs
    WHERE created_at >= date_trunc('month', NOW())
    GROUP BY status
    ORDER BY status
  `, '/zvs_status');

  if (!r.ok) return dbErrorReply(r.error);

  if (!r.rows.length) {
    return helpReply('📋 <b>ZVS holati</b>\nBu oyda hech qanday so\'rov yo\'q.');
  }

  const lines = (Array.isArray(r.rows) ? r.rows : []).map((row) =>
    `  • <b>${row.status}</b>: ${row.count} ta — ${Number(row.total_amount).toLocaleString('uz')} UZS`
  );
  return helpReply(`📋 <b>Bu Oy ZVS Holati</b>\n\n${lines.join('\n')}`);
}

/**
 * /company_state — kassa balans, 30-kunlik kirim/chiqim, muddati o'tgan qarzlar.
 */
export async function buildCompanyStateReply(): Promise<BotReply> {
  // Kassa balansi
  const regR = await execSqlResult<{ name: string; current_balance: string }>(drizzleSql`
    SELECT name, current_balance::text FROM cash_registers WHERE is_active = true ORDER BY name LIMIT 5
  `, '/company_state:registers');

  // 30-kunlik kirim/chiqim
  const flowR = await execSqlResult<{ total_in: string; total_out: string }>(drizzleSql`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_type='inflow'  THEN amount ELSE 0 END), 0)::text AS total_in,
      COALESCE(SUM(CASE WHEN transaction_type='outflow' THEN amount ELSE 0 END), 0)::text AS total_out
    FROM cash_transactions
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `, '/company_state:flow');

  // Muddati o'tgan qarzlar soni
  const overdueR = await execSqlResult<{ cnt: string }>(drizzleSql`
    SELECT COUNT(*)::text AS cnt FROM purchase_invoices
    WHERE payment_status != 'paid' AND due_date < CURRENT_DATE
  `, '/company_state:overdue');

  if (!regR.ok || !flowR.ok || !overdueR.ok) {
    return dbErrorReply('Bir yoki bir nechta so\'rov muvaffaqiyatsiz');
  }

  const kassaLines = (Array.isArray(regR.rows) ? regR.rows : []).map((r) =>
    `  💵 ${r.name}: <b>${Number(r.current_balance).toLocaleString('uz')} UZS</b>`
  ).join('\n') || '  (kassalar topilmadi)';

  const flow = flowR.rows[0] ?? { total_in: '0', total_out: '0' };
  const sof = Number(flow.total_in) - Number(flow.total_out);
  const overdue = overdueR.rows[0]?.cnt ?? '0';

  return helpReply(
    `🏢 <b>Kompaniya Holati</b>\n\n` +
    `<b>Kassalar:</b>\n${kassaLines}\n\n` +
    `<b>30-kunlik pul oqimi:</b>\n` +
    `  📥 Kirim: <b>${Number(flow.total_in).toLocaleString('uz')} UZS</b>\n` +
    `  📤 Chiqim: <b>${Number(flow.total_out).toLocaleString('uz')} UZS</b>\n` +
    `  💵 Sof: <b>${sof.toLocaleString('uz')} UZS</b>\n\n` +
    `⚠️ Muddati o'tgan qarzlar: <b>${overdue} ta faktura</b>`
  );
}

/**
 * /weekly_digest — 7 kunlik moliyaviy xulosa: kirim, chiqim, sof, top-3 kategoriya.
 */
export async function buildWeeklyDigestReply(): Promise<BotReply> {
  const summaryR = await execSqlResult<{ total_in: string; total_out: string }>(drizzleSql`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_type='inflow'  THEN amount ELSE 0 END), 0)::text AS total_in,
      COALESCE(SUM(CASE WHEN transaction_type='outflow' THEN amount ELSE 0 END), 0)::text AS total_out
    FROM cash_transactions
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `, '/weekly_digest:summary');

  const catR = await execSqlResult<{ category_id: string; total: string }>(drizzleSql`
    SELECT category_id, SUM(amount)::text AS total
    FROM cash_transactions
    WHERE created_at >= NOW() - INTERVAL '7 days'
      AND transaction_type = 'outflow'
      AND category_id IS NOT NULL
    GROUP BY category_id
    ORDER BY SUM(amount) DESC
    LIMIT 3
  `, '/weekly_digest:categories');

  if (!summaryR.ok) return dbErrorReply(summaryR.error);

  const s = summaryR.rows[0] ?? { total_in: '0', total_out: '0' };
  const sof = Number(s.total_in) - Number(s.total_out);

  const catLines = catR.ok && Array.isArray(catR.rows) && catR.rows.length
    ? catR.rows.map((c, i) =>
        `  ${i + 1}. ${c.category_id ?? 'Boshqa'}: <b>${Number(c.total).toLocaleString('uz')} UZS</b>`
      ).join('\n')
    : '  (ma\'lumot yo\'q)';

  return helpReply(
    `📊 <b>7-Kunlik Moliyaviy Xulosa</b>\n\n` +
    `  📥 Kirim: <b>${Number(s.total_in).toLocaleString('uz')} UZS</b>\n` +
    `  📤 Chiqim: <b>${Number(s.total_out).toLocaleString('uz')} UZS</b>\n` +
    `  💵 Sof: <b>${sof.toLocaleString('uz')} UZS</b>\n\n` +
    `<b>Top-3 Xarajat Kategoriyasi:</b>\n${catLines}`
  );
}
```

**ESLATMA:** `fin.bot.ts` — OWNED EMAS, shu sababli u yerga teg TAQIQ. `buildZvsStatusReply/buildCompanyStateReply/buildWeeklyDigestReply` export qilinadi — `fin.bot.ts` ularni import qiladi (bu boshqa agentning vazifasi YOKI egasi qo'lda qo'shadi).

---

### QADAM 13: `CashRegister.tsx` — Smena tab qo'shish (FE FIX)

**Fayl:** `artifacts/erp-dashboard/src/pages/CashRegister.tsx`  
**Holat:** Mavjud fayl — POS kod O'CHIRILMAYDI (Q-46), faqat yangi "Smena" tab qo'shiladi

**OLDIN (`:92-98` — `TabsList` ichida 4 tab):**
```tsx
<Tabs value={cr.activeTab} onValueChange={cr.setActiveTab} className="flex-1 flex flex-col px-4">
  <TabsList data-testid="tabs-pos-nav">
    <TabsTrigger value="pos" ...><ScanBarcode .../> {t('cashRegister')}</TabsTrigger>
    <TabsTrigger value="products" ...><Package .../> {t('products')}</TabsTrigger>
    <TabsTrigger value="history" ...><History .../> {t('transactions')}</TabsTrigger>
    <TabsTrigger value="dashboard" ...><BarChart3 .../> {t("dashboard10")}</TabsTrigger>
  </TabsList>
```

**KEYIN — yangi import va smena tab qo'shiladi:**

Faylning boshiga yangi import qo'shing (mavjud importlar O'CHIRILMAYDI):
```tsx
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { AlertCircle } from 'lucide-react';
```

`CashRegister` funksiyasiga yangi query qo'shing (mavjud `const cr = useCashRegister();` dan KEYIN):
```tsx
// Smena holat query — /api/finance/kassir endpointiga
const { data: activeSession, isLoading: sessionLoading } = useQuery({
  queryKey: ['/api/finance/kassir/sessions/active'],
  queryFn: () => apiRequest('GET', '/api/finance/kassir/sessions/active?registerId=1'),
  retry: false,
});
```

`TabsList` ichiga yangi tab trigger qo'shing (oxirida, mavjud 4 ta dan keyin):
```tsx
<TabsTrigger value="smena" data-testid="tab-smena">
  <AlertCircle className="h-4 w-4 mr-1" /> Smena
</TabsTrigger>
```

Mavjud `</Tabs>` yopilishidan oldin yangi `TabsContent` qo'shing:
```tsx
<TabsContent value="smena" className="mt-2">
  <div className="rounded-lg border p-4 space-y-3">
    <h3 className="font-semibold text-base">Joriy Smena Holati</h3>
    {sessionLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>}
    {!sessionLoading && !activeSession && (
      <p className="text-sm text-muted-foreground">Hozircha ochiq smena yo'q.</p>
    )}
    {activeSession && (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Smena #:</span> <b>{(activeSession as Record<string,unknown>)?.sessionNumber as string ?? '—'}</b></div>
        <div><span className="text-muted-foreground">Ochilish balansi:</span> <b>{formatCurrency(Number((activeSession as Record<string,unknown>)?.openingBalance ?? 0))}</b></div>
        <div><span className="text-muted-foreground">Kirim:</span> <b>{formatCurrency(Number((activeSession as Record<string,unknown>)?.totalInflow ?? 0))}</b></div>
        <div><span className="text-muted-foreground">Chiqim:</span> <b>{formatCurrency(Number((activeSession as Record<string,unknown>)?.totalOutflow ?? 0))}</b></div>
        <div className="col-span-2"><span className="text-muted-foreground">Status:</span> <b>{(activeSession as Record<string,unknown>)?.status as string ?? '—'}</b></div>
      </div>
    )}
    <p className="text-xs text-muted-foreground mt-2">
      Smena ochish/yopish: <code>POST /api/finance/kassir/sessions</code> (BE tayyor)
    </p>
  </div>
</TabsContent>
```

**NIMA O'ZGARMAYDI (Q-46):** `useCashRegister`, `ProductCatalog`, `CartPanel`, `PaymentPanel`, `TransactionHistory`, `PosReports`, barcha mavjud tablar — barchasi qoladi.

---

## 5. DDL (GATED)

### `fi-advance-reports.ts` migration SQL

Qadam 5 da to'liq SQL keltirilgan. GATED qoidalari:

1. `lib/db/src/schema/fi-advance-reports.ts` faylini YOZ.
2. Migration SQL faylini `docs/migrations/` ga yoki alohida `fi-advance-reports.sql` ga yoz.
3. Faylda `-- APPROVED: <egasi> <sana>` izoh BO'LISHI SHART.
4. `drizzle-kit push` yoki `psql` bilan **ISHGA TUSHIRMA** — egasi ruxsatisiz.
5. Barcha `podotchet.service.ts` va `podotchet.controller.ts` importlar DDL tayyor bo'lgandan keyin aktiv.

**DDL YOQILISH TARTIBI (egasi qabul qilgach):**
```sql
-- 1. advance_reports
-- 2. employee_debts (FK to advance_reports)
-- 3. Index yaratish
-- 4. Barrelga: lib/db/src/index.ts da export qo'shish
```

---

## 6. QABUL MEZONI

### Smena (KAS-1/KAS-2 / EP-FIN-020/021)
- [ ] `POST /api/finance/kassir/sessions` → `cash_sessions` da 1 qator INSERT (DB-proof: `SELECT * FROM cash_sessions ORDER BY id DESC LIMIT 1;`)
- [ ] `GET /api/finance/kassir/sessions/active?registerId=1` → 200 (yoki `null` agar ochiq yo'q)
- [ ] `PATCH /api/finance/kassir/sessions/1/close` → `closed_at`, `closing_balance`, `variance`, `status='closed'` UPDATE
- [ ] `GET /api/finance/kassir/sessions/1/x-report` → 200 (`totalInflow`, `totalOutflow`, `expectedBalance` to'g'ri)
- [ ] `POST /api/finance/kassir/transactions` → `cash_transactions` INSERT + session `total_inflow`/`total_outflow` yangilangan

### Podotchet (EP-FIN-049) — DDL GATED
- [ ] DDL tayyor bo'lgandan keyin: `POST /api/finance/kassir/podotchet/advance` → `advance_reports` INSERT + `entries` da D:1271/K:1010 juft
- [ ] `POST /api/finance/kassir/podotchet/:id/submit` → status `submitted`
- [ ] `PATCH /api/finance/kassir/podotchet/:id/approve` → status `approved` + `entries` da D:9400/K:1271
- [ ] `PATCH /api/finance/kassir/podotchet/:id/reject` → status `rejected` + `employee_debts` INSERT

### PayrollClosedEvent → GL (EP-FIN-056)
- [ ] HR payroll close event chiqarganda → `entries` da `document_type='payroll'` qator payroll periodiga bog'langan (DB-proof: `SELECT * FROM entries WHERE reference_type='payroll_period' AND reference_id='<periodId>';`)
- [ ] Deductions > 0 bo'lsa → 2 ta juft entry (`6710/1` → `6400`)

### AP → GL (EP-FIN-037)
- [ ] `POST /api/finance/ap/entries` → `purchase_invoices` INSERT **HAMDA** `entries` da `document_type='purchase'` qator
- [ ] DB-proof: `SELECT * FROM entries WHERE reference_type='purchase_invoice' ORDER BY id DESC LIMIT 2;`

### Aging 90+ CRON (EP-FIN-072)
- [ ] `checkAlerts()` ichida `_checkAging90Plus(now)` chaqiriladi
- [ ] DB da 90+ kunlik faktura bo'lsa → Telegram `muammo` kanaliga xabar ketadi (yoki log `would send` agar TELEGRAM_MUAMMO_CHAT_ID yo'q)

### Bot helpers (EP-FIN-028)
- [ ] `bot.helpers.ts` eksportida `buildZvsStatusReply`, `buildCompanyStateReply`, `buildWeeklyDigestReply` funksiyalar mavjud
- [ ] `execSqlResult<T>` ishlatiladi (deprecated `execSql` EMAS)
- [ ] TypeScript kompilyatsiyasida xato yo'q

### CashRegister.tsx (FE FIX)
- [ ] "Smena" tab mavjud (`data-testid="tab-smena"`)
- [ ] `GET /api/finance/kassir/sessions/active` query'si ishlaydi (404 bo'lsa ham xato chiqmaydi — graceful)
- [ ] Mavjud POS funksionallik (catalog, cart, payment) O'ZGARMAGAN

### Umumiy
- [ ] BE `tsc --noEmit` = 0 xato
- [ ] FE `tsc --noEmit` = 0 xato
- [ ] `bash scripts/reviewer-result-pattern.sh` = 0 FAIL yangi fayllarda
- [ ] `bash scripts/reviewer-jwt-guard.sh` = PASS yangi controller larda
- [ ] Oltin zanjir regress yo'q: P24/P25 da yozilgan endpointlar hamon ishlaydi

---

## 7. SELF-VERIFY

### BE TypeScript tekshiruv:
```bash
cd Uzbek-Language-Module
npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | grep -i error | head -30
```

### FE TypeScript tekshiruv:
```bash
npx tsc --noEmit -p artifacts/erp-dashboard/tsconfig.json 2>&1 | grep -i error | head -30
```

### Smena DB-proof (DDL tayyor bo'lgandan keyin):
```sql
-- cash_sessions jadvalida qator bor:
SELECT id, register_id, session_number, opening_balance, status, opened_at
FROM cash_sessions ORDER BY id DESC LIMIT 5;

-- cash_transactions jadvalida qator bor:
SELECT id, session_id, transaction_type, amount, created_at
FROM cash_transactions ORDER BY id DESC LIMIT 5;
```

### AP → GL DB-proof:
```sql
-- AP faktura va GL entry bir vaqtda yaratilgan:
SELECT pi.invoice_no, e.entry_number, e.debit_account_id, e.credit_account_id, e.amount
FROM purchase_invoices pi
LEFT JOIN entries e ON e.reference_id = pi.invoice_no AND e.reference_type = 'purchase_invoice'
ORDER BY pi.id DESC LIMIT 5;
```

### PayrollClosedEvent GL DB-proof:
```sql
SELECT id, entry_number, reference_type, reference_id, document_type, amount, created_at
FROM entries
WHERE reference_type = 'payroll_period'
ORDER BY id DESC LIMIT 5;
```

### Bot helpers TypeScript eksport tekshiruv:
```bash
# bot.helpers.ts da yangi export bormi:
grep -n "buildZvsStatusReply\|buildCompanyStateReply\|buildWeeklyDigestReply" \
  Uzbek-Language-Module/apps/api/src/modules/bot-gateway/bots/bot.helpers.ts
```

### Reviewer skriptlar:
```bash
bash scripts/reviewer-result-pattern.sh 2>&1 | tail -10
bash scripts/reviewer-jwt-guard.sh 2>&1 | tail -10
bash scripts/reviewer-array-safety.sh 2>&1 | tail -5
```

### CashRegister.tsx smena tab tekshiruv:
```bash
grep -n "tab-smena\|smena\|finance/kassir" \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/CashRegister.tsx | head -15
```

---

## 8. COMMIT

**Commit 1 — Kassir BE (smena core):**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/finance/kassir/i-kassir.repo.ts
git add Uzbek-Language-Module/apps/api/src/modules/finance/kassir/drizzle-kassir.repo.ts
git add Uzbek-Language-Module/apps/api/src/modules/finance/kassir/kassir.service.ts
git add Uzbek-Language-Module/apps/api/src/modules/finance/kassir/kassir.controller.ts
git commit -m "feat(finance): kassir smena open/close + X-report + transaction BE (EP-FIN-020/021)"
```

**Commit 2 — Podotchet DDL + BE (GATED — faqat DDL tasdiqlangandan keyin):**
```bash
git add Uzbek-Language-Module/lib/db/src/schema/fi-advance-reports.ts
git add Uzbek-Language-Module/apps/api/src/modules/finance/kassir/podotchet.service.ts
git add Uzbek-Language-Module/apps/api/src/modules/finance/kassir/podotchet.controller.ts
git commit -m "feat(finance): podotchet advance lifecycle + employee_debts DDL GATED (EP-FIN-049)"
```

**Commit 3 — PayrollClosedEvent → GL listener:**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/event-handlers/payroll-closed.listener.ts
git commit -m "feat(finance): PayrollClosedEvent→GL listener D:6710/K:6710-1 + deductions (EP-FIN-056)"
```

**Commit 4 — AP → GL wiring:**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/repositories/finance-ap.repository.ts
git add Uzbek-Language-Module/apps/api/src/modules/finance/application/finance-ap.service.ts
git commit -m "feat(finance): AP invoice createEntry→GL auto-post D:1610/K:6010 (EP-FIN-037)"
```

**Commit 5 — Aging 90+ CRON + Bot helpers:**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/finance/financial-reports/cron/financial-reports-alerts.cron.ts
git add Uzbek-Language-Module/apps/api/src/modules/bot-gateway/bots/bot.helpers.ts
git commit -m "feat(finance): aging 90+ cron escalation + ShVB /zvs_status /company_state /weekly_digest (EP-FIN-028/072)"
```

**Commit 6 — CashRegister FE smena tab:**
```bash
git add Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/CashRegister.tsx
git commit -m "fix(fe): CashRegister smena tab → finance/kassir endpoints (KAS-1 FE)"
```

**HECH QACHON:**
- `git add -A` yoki `git add .` — TAQIQ
- Log fayllar commit — TAQIQ (Q-45)
- JWT mint yoki secret chop etish — TAQIQ (Q-30)

---

## MUHIM BAYROQLAR (flaglar)

Quyidagi holatlar uchun ISHNI TO'XTA, egasiga flag qil:

1. **`PayrollClosedEvent` import** — HR modulida `PayrollClosedEvent` class mavjudligini tekshir. Agar yo'q → `payroll-closed.listener.ts` da inline placeholder qolsin, `// FLAG: HR agent bilan koordinatsiya kerak` izoh qo'shib, commit qil.

2. **`GlPostingService.postJournal` interfeysi** — P24 da `postJournal` signature'ni tekshir (parametr nomi, `lines` array strukturasi, `accountCode` vs `debitAccountCode`). Mos kelmaydigan joy bo'lsa → TO'XTA, P24 agentiga flag.

3. **FinanceModule DI** — yangi `KassirController`, `KassirService`, `DrizzleKassirRepo`, `PodotchetController`, `PodotchetService`, `PayrollClosedListener` classlarini `FinanceModule` providers/controllers ro'yxatiga qo'shish kerak. `finance.module.ts` OWNED emas bo'lsa — TO'XTA, egasiga flag: "FinanceModule providers yangilanishi kerak".

4. **`getAging90PlusAlerts()`** — `FinancialReportsQueryService` OWNED emas. Flag: "P24 yoki FIN-reports agentiga: `getAging90PlusAlerts()` → `FinancialReportsQueryService` ga qo'shilsin".

5. **`fi-advance-reports.ts` barrel export** — `lib/db/src/index.ts` ga yangi export qo'shish kerak. Bu fayl OWNED emas — flag: "lib/db barrel agent yoki egasiga: `advance_reports`, `employeeDebts` export qo'shilsin".

---

*P26 direktiva — Wave 3 — dependsOn: P24, P25 — DDL gated: advance_reports + employee_debts*
*Yozildi: 2026-06-19 | Q-47 ≥1000 qator standartiga muvofiq*
