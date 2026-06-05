# TUZATISH PROGRESS — Transmissiya ulash (leverage tartibi)
> Boshlandi: 2026-06-05 | Rol: EDITOR (bitta agent, inline, subagent yo'q) | DB: europrint

## BOSQICH 0 — kanonik qarorlar (egasi, 2026-06-05)
**sales_orders** (buyurtma) · **entries** (GL) · **warehouse_stock** (stock).
→ to'liq: `docs/transmissiya-bosqich0-qarorlar-2026-06-05.md`

## BOSQICH 1 — ijro jurnali (har biri: verify→fix→DB-proof→commit)
| # | Leverage | Nima qilindi | DB-proof | Commit |
|---|---|---|---|---|
| 1 | **#5 PO HITL** | STRING `'PO_REQUIRES_DIRECTOR_APPROVAL'` (poId=0, save-oldidan, CQRS route qilolmaydi) → `PoRequiresDirectorApprovalEvent` klass + `@EventsHandler` → `hitl_approvals` insert (direktor dashboard o'qiydi). + owner-approved DDL: hitl_approvals.id'ga identity (sequence drift). | direktor pending PO ko'radi; auto-id; cleanup 0 | `68d3cb56` |

## Keyingi qadamlar (poydevor tayyor, tartibda)
- **#5b** — `THREE_WAY_MATCH_FAILED` (goods-receipt.handler.ts:74) → klass + listener (target: procurement_approvals / GR flag).
- **#5c** — `iot.sos.raised`, `SecurityIncidentDetected` → klass + listener.
- **#6** — soxta-create → `repo.save()` (dizayn order #50, LMS, security — har biri 1 INSERT).
- **#1** — manager_id: daraxt-yurish (ancestor head) yoki org-head data.
- **#4** — movement event emit → warehouse_stock (kanonik).
- **BOSQICH 2** — sales_orders line-items, entries post* ulash, davomat→payroll.

## Eslatma (verify-don't-trust topilmalari)
- hitl_approvals.id sequence-siz edi (drift) — DDL bilan tuzatildi.
- Leverage #1 (manager_id) 0/30 derive — manbasiz, daraxt-yurish/org-data kerak.
- pos: stock_alerts jadvali YO'Q (reja xato) — low-stock ledger balansidan hisoblandi.
