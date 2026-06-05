# TUZATISH PROGRESS — Transmissiya ulash (leverage tartibi)
> Boshlandi: 2026-06-05 | Rol: EDITOR (bitta agent, inline, subagent yo'q) | DB: europrint

## BOSQICH 0 — kanonik qarorlar (egasi, 2026-06-05)
**sales_orders** (buyurtma) · **entries** (GL) · **warehouse_stock** (stock).
→ to'liq: `docs/transmissiya-bosqich0-qarorlar-2026-06-05.md`

## BOSQICH 1 — ijro jurnali (har biri: verify→fix→DB-proof→commit)
| # | Leverage | Nima qilindi | DB-proof | Commit |
|---|---|---|---|---|
| 1 | **#5 PO HITL** | STRING `'PO_REQUIRES_DIRECTOR_APPROVAL'` (poId=0, save-oldidan, CQRS route qilolmaydi) → `PoRequiresDirectorApprovalEvent` klass + `@EventsHandler` → `hitl_approvals` insert (direktor dashboard o'qiydi). + owner-approved DDL: hitl_approvals.id'ga identity (sequence drift). | direktor pending PO ko'radi; auto-id; cleanup 0 | `68d3cb56` |
| 2 | **#5b 3-way-match** | STRING `'THREE_WAY_MATCH_FAILED'` → `ThreeWayMatchFailedEvent` klass + listener → hitl_approvals (entity_type='three_way_match'). | menejer pending match-fail ko'radi; cleanup 0 | `c0ffa9c5` |
| 3 | **#6 Security** | report-incident FAKE-CREATE (repo yo'q → saqlamaydi) → INCIDENT_REPO inject + save; ⭐ drifted repo.save (string-id→integer, type/location/reported_by yo'q) raw-SQL bilan live ustunlarga tuzatildi. | security_incidents real persist; cleanup 0 | `f41c984c` |
| 4 | **#6 Sensor** | record-sensor-reading FAKE-CREATE (repo yo'q) → SENSOR_REPO inject + saveReading; ⭐ drifted saveReading (iot_sensor_readings=VIEW over sensor_readings, device_id NOT NULL yo'q edi) tuzatildi. | iot_sensor_readings real persist; cleanup 0 | `60f441fb` |
| 5 | **MES→QC no-op** | mes-completed.listener HECH NARSA qilmasdi (faqat log) → real qc_inspection insert (status=pending, order_id=sessionId, reference_type='mes_session'). ⭐ qc save drift (string-id→int, reference_id=uuid, inspector_id=int) → direct drift-proof insert. | QC pending inspeksiya ko'radi; cleanup 0 | `a82cfd82` |
| 6 | **#4 POS movement→GL** | ⭐ verify-don't-trust master-plan tuzatildi: stock ALLAQACHON yoziladi (inline `_processCompletedMovement`); o'lik narsa = GL leg. `PosMovementCompletedEvent`ni publish qilsam WMS-sync listener stock'ni QAYTA yozardi (deferred FIX4 ikki-yozuv). **Variant C** (egasi tasdiqi): event YO'Q — faqat yetishmagan GL leg inline qo'shildi (GL_PAIRS → `pos_gl_posting_log` stage=POST, status=AWAITING_REVIEW; Moliya qo'lda tasdiqlaydi). ⭐ table real nomi=`pos_gl_posting_log` (Drizzle `gl_posting_log` emas); id sequence+enum'lar toza (drift yo'q). | EXTERNAL_IN total=56000→4 balansli entry (debit==credit=112000); ikki-yozuv yo'q; cleanup 0 | `05dcd49b` |

## ⭐ Naqsh (verify-don't-trust): har leverage-fix yashirin drift tutdi
Transmissiya ulaganda har repo.save/insert **buzuq** (drift) bo'lib chiqdi: string-id→integer ustun, VIEW→base-jadval NOT NULL, uuid╳integer, omitted-columns. Ya'ni "yashil skelet" nafaqat ulanmagan — DB-yozuv yo'llari ham drifted edi. Har biri DB-proof bilan tutildi va tuzatildi.

## Keyingi qadamlar (poydevor tayyor, tartibda)
- **#5c** — `iot.sos.raised` (grep: topilmadi — tekshir), `SecurityIncidentDetected` (allaqachon klass — listener ixtiyoriy).
- **#6 (davomi)** — boshqa soxta-create → `repo.save()` (dizayn order #50, LMS, CRM — har biri 1 INSERT).
- **#1** — manager_id: daraxt-yurish (ancestor head) yoki org-head data.
- ~~**#4** — DONE (Variant C, `05dcd49b`): inline GL leg, ikki-yozuvdan qochildi.~~
- **BOSQICH 2** — sales_orders line-items, entries post* ulash, davomat→payroll.

## Eslatma (verify-don't-trust topilmalari)
- hitl_approvals.id sequence-siz edi (drift) — DDL bilan tuzatildi.
- Leverage #1 (manager_id) 0/30 derive — manbasiz, daraxt-yurish/org-data kerak.
- pos: stock_alerts jadvali YO'Q (reja xato) — low-stock ledger balansidan hisoblandi.
