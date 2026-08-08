# GL garbage-row archive — entries.id=85 (POS-GL-1)

**Purpose:** Permanent, git-versioned archive of the row removed from the canonical
`entries` ledger by the F1 item of `docs/audit/ACCOUNTING-STANDARDS-AUDIT-2026-07-06.md`,
per the owner's explicit approval: *"purge the 62.8B garbage POS-GL-1 entry... archive it
first."* This file is the archive. The row is NOT recoverable from any DB table after
removal — this document plus git history is the sole durable record.

## Why this row is garbage, not a real transaction (root cause, traced 2026-07-06)

- **`entries.id=85`** (`entry_number='POS-GL-1'`) posted **62,823,437,295 UZS** (62.8 billion)
  against `document_type='pos_movement', document_id=1`.
- **Source `pos_movements.id=1`**: `total_amount=0.00`, `status='pending'` (never
  completed/approved as a real movement), `ai_gl_status='PENDING'`, `gl_document_id=NULL`.
- The posting code (`gl-posting-log.repository.ts:postMovementToLedger`) does **not** read
  `pos_movements.total_amount` at all — it computes the GL amount fresh from
  `SUM(pos_movement_lines.quantity * unit_price)`. That line-item data (`pos_movement_lines.id=1`,
  `created_at=2026-05-11`, the same instant as the movement itself — i.e. original seed
  data, not something that changed later) has `quantity=15,123`, `unit_price=4,154,165` for
  `material_cards.id=18` ("Qalam (qora)" — a black pen). **The material's real catalog price
  is `unit_price=5,000` UZS** (`material_cards.unit_price`) — the line's stored unit price is
  **~830× the real price**, and 15,123 pens in one POS movement is not a plausible real
  quantity. `15123 × 4154165 = 62,823,437,295` — the math is internally consistent; the
  *inputs* are synthetic/corrupted seed data, not a real transaction.
- **Bonus finding, relevant to F2/F3 of the same loop:** `pos_gl_posting_log.id=3`
  (`movement_id=1`, `stage_name='VERIFY'`, `processed_at=2026-06-20`) recorded a **staged
  preview** of `gl_entries=[{"debit":5000,"credit":0,"accountCode":"2110"}]` — i.e. the
  review-stage UI showed a human approver a sane `5,000` figure (matching 1 pen at catalog
  price) before they clicked approve (`approved_by=1`, `approved_at=2026-07-01`). The
  **actual posting recomputed the amount fresh from the real (corrupted) line data at
  approval time**, producing 62.8B instead of the 5,000 that was reviewed. This means the
  number a human approves in this flow is **not guaranteed to be the number that gets
  posted** — a distinct, deeper process-integrity gap beyond "add an amount>0 gate" (F2)
  worth folding into F3's writer-unification design.

## Full archived row (`entries`, before deletion)

```json
{
  "id": 85,
  "entry_number": "POS-GL-1",
  "entry_date": "2026-07-01",
  "document_type": "pos_movement",
  "document_id": 1,
  "debit_account_id": 5,
  "credit_account_id": 19,
  "amount": "62823437295.0000",
  "description": "POS harakat #1 (EXTERNAL_IN)",
  "created_by": 1,
  "created_at": "2026-07-01T15:21:38.143Z",
  "debit_account": "1010",
  "credit_account": "6000",
  "reference_id": null,
  "reference_type": null,
  "posted_by": null,
  "posted_at": null,
  "currency": "UZS",
  "tenant_id": 1
}
```

## Archived source data (kept live, NOT deleted — only the GL entry above is removed)

`pos_movements.id=1` and `pos_movement_lines.id=1` are left in place (out of this item's
explicit scope, which is "purge the GL entry," not the source movement) but are flagged
here as known-corrupted seed data:

```json
// pos_movements.id=1
{ "id": 1, "movement_number": "POS-2026-00001", "movement_type": "EXTERNAL_IN",
  "total_amount": "0.00", "status": "pending", "ai_gl_status": "PENDING",
  "gl_document_id": null, "created_by": 1, "created_at": "2026-05-11T14:05:12.050Z" }

// pos_movement_lines.id=1
{ "id": 1, "movement_id": 1, "material_id": 18, "quantity": "15123.0000",
  "unit_price": "4154165.00", "total_price": "62823437295.00",
  "created_at": "2026-05-11T14:05:12.058Z" }
```

**Residual risk flagged for F2/F3:** because `pos_movements.id=1` remains `status='pending'`
with corrupted line data, and `postMovementToLedger` has no status-gate (only idempotency +
amount>0 + account-mapping checks), this same garbage total could theoretically be
re-posted if the movement is ever re-submitted through the approval flow again before F2's
gates land. F2/F3 should close this specific path, not just the generic amount>0 case.

## Restore statement (if this decision is ever reversed — not expected, kept for completeness)

```sql
INSERT INTO entries
  (id, entry_number, entry_date, document_type, document_id, debit_account_id,
   credit_account_id, amount, description, created_by, created_at, debit_account,
   credit_account, reference_id, reference_type, posted_by, posted_at, currency, tenant_id)
VALUES
  (85, 'POS-GL-1', '2026-07-01', 'pos_movement', 1, 5, 19, 62823437295.0000,
   'POS harakat #1 (EXTERNAL_IN)', 1, '2026-07-01T15:21:38.143Z', '1010', '6000',
   NULL, NULL, NULL, NULL, 'UZS', 1);
-- Note: id=85 may collide with the serial sequence's next value if entries.id is
-- SERIAL/IDENTITY -- check `SELECT last_value FROM entries_id_seq` before restoring.
```

## Ledger totals, before and after (informational — ΣDebit=ΣCredit is guaranteed by
construction for any subset of these balanced-pair rows, per the audit's own caveat;
this is not a correctness proof, just the requested sanity figure)

- **Before:** 7 rows, ΣDebit = ΣCredit = 62,963,781,568 UZS
- **After (dry-run verified, then applied):** 6 rows, ΣDebit = ΣCredit = 140,344,273 UZS
