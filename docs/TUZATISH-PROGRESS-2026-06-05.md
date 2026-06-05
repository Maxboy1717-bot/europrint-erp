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

## Keyingi qadamlar (poydevor tayyor, tartibda)
- **#5c** — `iot.sos.raised` (grep: topilmadi — tekshir), `SecurityIncidentDetected` (allaqachon klass — listener ixtiyoriy).
- **#6 (davomi)** — boshqa soxta-create → `repo.save()` (dizayn order #50, LMS, sensor — har biri 1 INSERT).
- **#1** — manager_id: daraxt-yurish (ancestor head) yoki org-head data.
- **#4** — movement event emit → warehouse_stock (kanonik).
- **BOSQICH 2** — sales_orders line-items, entries post* ulash, davomat→payroll.

## Eslatma (verify-don't-trust topilmalari)
- hitl_approvals.id sequence-siz edi (drift) — DDL bilan tuzatildi.
- Leverage #1 (manager_id) 0/30 derive — manbasiz, daraxt-yurish/org-data kerak.
- pos: stock_alerts jadvali YO'Q (reja xato) — low-stock ledger balansidan hisoblandi.
