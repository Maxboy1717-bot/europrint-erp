# 10 — BOSQICH 7: MOLIYA (FIN)

> GL → kassa → byudjet → e-hisob-faktura → ish haqi GL.
> **Holat: 🔧 ~45% mavjud** — entries kanonik; accounts mavjud; e-faktura yo'q; real GL posting stub.
> ⛔ SAP#76: `gl_journal_entries` va `gl_lines` jadvallariga TEGMA. Faqat `entries`.

---

## 7.1 Kanonik jadvallar

```sql
entries              -- ⭐ GL KANONIK (debit/credit yozuvlari, immutable)
accounts             -- Hisob rejasi (Chart of Accounts)
budgets              -- Byudjet sarlavhasi
budget_lines         -- Byudjet satrlari (account + miqdor)
cash_accounts        -- Kassa/bank hisoblari
cash_transactions    -- Kassa harakati (append-only)
invoices             -- Hisob-faktura (debitorlik/kreditorlik)
invoice_lines        -- Faktura satrlari
```

⛔ TEGMA (SAP#76): `gl_journal_entries`, `gl_lines` — 0 qator, parallel model, eski arxitektura.
```bash
grep -rn "gl_journal_entries\|glJournalEntries" apps/api/src/ # 0 bo'lishi kerak
```

---

## 7.2 GL Posting qoidalari

GL = `entries` jadvaliga ikki yonlama yozuv (debit = kredit).

```ts
// GL Posting (ATOMIC — db.transaction() majburiy):
async postJournal(legs: GlLeg[], ref: GlRef, tx?: DbTransaction): Promise<Result<void>> {
  const runner = tx ?? this.db;
  
  // Debit = Kredit tekshiruvi:
  const totalDebit = legs.filter(l => l.side === 'DEBIT').reduce((s, l) => s + l.amount, 0);
  const totalCredit = legs.filter(l => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return Err('GL imbalance: debit ≠ credit');
  }

  return runner.transaction(async (innerTx) => {
    for (const leg of legs) {
      await innerTx.insert(entries).values({
        account_id: leg.accountId,
        side: leg.side,
        amount: leg.amount,
        currency: leg.currency ?? 'UZS',
        reference_type: ref.type,
        reference_id: ref.id,
        description: leg.description,
        posted_at: new Date(),
        created_by: ref.userId,
      });
    }
    return Ok(undefined);
  });
}
```

---

## 7.3 Standart GL Operatsiyalari

Har operatsiya uchun debit/kredit jufti:

| Operatsiya | Debit | Kredit |
|------------|-------|--------|
| Sotish (buyurtma tasdiqlandi) | 1200 Debitorlar | 9000 Daromad |
| Material qabul (xarid) | 1500 Materiallar | 6200 Kreditorlar |
| Ish haqi | 7000 Mehnat xarajati | 6800 To'lanishi kerak ish haqi |
| INPS (8%) | 7001 INPS xarajati | 6801 INPS to'lovi |
| NDFL (12%) | Xodim hisob raqami | 3300 Soliq majburiyati |
| Kassa kirim | 1000 Kassa | 1200 Debitorlar |
| Kassa chiqim | 6000 Xarajat | 1000 Kassa |

```ts
// Hisob kodlari (accounts.code):
// 1000 — Kassa
// 1200 — Debitorlar (accounts receivable)
// 1500 — Materiallar
// 6200 — Kreditorlar (accounts payable)
// 7000 — Mehnat xarajati
// 9000 — Daromad
```

---

## 7.4 Ish Haqi GL Posting (HR → FIN)

```ts
// PayrollClosedEvent listener (FIN):
@OnEvent('hr.payroll.period.closed')
async handlePayrollClosed(event: PayrollClosedEvent): Promise<void> {
  const legs: GlLeg[] = [
    { accountId: ACCOUNT_LABOR_EXPENSE, side: 'DEBIT', amount: event.totalGross },
    { accountId: ACCOUNT_INPS_EXPENSE, side: 'DEBIT', amount: event.totalInps },
    { accountId: ACCOUNT_PAYABLE_SALARY, side: 'CREDIT', amount: event.totalNet },
    { accountId: ACCOUNT_PAYABLE_INPS, side: 'CREDIT', amount: event.totalInps },
    { accountId: ACCOUNT_TAX_NDFL, side: 'CREDIT', amount: event.totalNdfl },
  ];
  await this.glService.postJournal(legs, { type: 'PAYROLL', id: event.periodId, userId: SYSTEM_USER });
}
```

---

## 7.5 E-Hisob-Faktura (UZB format)

UZB e-faktura formati (`soliq.uz` API bilan integratsiya):

```ts
interface UzbEInvoice {
  invoice_number: string;          // 'SF-2026-001'
  invoice_date: string;            // '2026-06-18'
  seller_tin: string;              // Sotuvchi INN
  buyer_tin: string;               // Xaridor INN
  lines: Array<{
    product_code: string;          // IKPU kodi
    name: string;
    quantity: number;
    unit_code: string;             // '796' (dona), '166' (metr)
    price: number;                 // UZS
    vat_rate: number;              // 12
    vat_amount: number;
    total: number;
  }>;
  total_without_vat: number;
  total_vat: number;
  total_with_vat: number;
}
```

---

## 7.6 Byudjet vs Actual

```ts
// Byudjet varyans:
async getBudgetVariance(periodId: number): Promise<BudgetVarianceResult[]> {
  return this.db.select({
    accountId: budgetLines.accountId,
    budgeted: budgetLines.amount,
    actual: sql<number>`COALESCE(SUM(CASE WHEN e.side='DEBIT' THEN e.amount ELSE -e.amount END), 0)`,
    variance: sql<number>`${budgetLines.amount} - COALESCE(SUM(...), 0)`,
  })
  .from(budgetLines)
  .leftJoin(entries, and(eq(entries.accountId, budgetLines.accountId), /* period filter */))
  .where(eq(budgetLines.budgetId, periodId))
  .groupBy(budgetLines.accountId, budgetLines.amount);
}
```

---

## 7.7 Acceptance kriterlari

```
☐ GL posting atomic (db.transaction(), debit=kredit tekshiruvi)
☐ Sotish → debitorlik + daromad GL entries
☐ Xarid qabul → materiallar + kreditorlik GL entries
☐ Ish haqi yopilishi → mehnat xarajati + soliq GL entries
☐ POS harakatlar → kassa GL entries
☐ Byudjet vs actual varyans hisoboti
☐ E-faktura yaratish (UZB format)
☐ gl_journal_entries/gl_lines ga hech qanday yozuv yo'q (SAP#76)
☐ tsc 0 + test PASS
```

---

## 7.8 Ko'chiriladigan qismlar

| Qism | Holat |
|------|-------|
| `apps/api/src/modules/finance/` | ✅ ko'chir, real posting to'ldir |
| `lib/db/src/schema/entries.ts` | ✅ kanonik, ko'chir |
| `lib/db/src/schema/accounts.ts` | ✅ ko'chir (42 BHMS seed bor) |
| `lib/db/src/schema/cash-transactions.ts` | ✅ ko'chir (append-only) |
| E-faktura servis | 🔲 yangi (soliq.uz API) |
| Byudjet CRUD | 🔧 qisman mavjud |

---
*Keyingi: [11_Bosqich8_CRM.md](11_Bosqich8_CRM.md)*
