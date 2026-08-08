# EUROPRINT ERP — MA'LUMOTLAR BAZASI ERD (Matnli)

> **Asosiy jadvallar munosabatlari. Kanonik jadvallar va FK bog'lanishlar.**
> ❌ = bu jadval TEGMA (legacy/deprecated) · ✅ = kanonik jadval
> Bog'liq: [LUGAT.md](LUGAT.md) §4 · ADR-001..006

---

## 1. TASHKILOT VA XODIMLAR

```
razryad_levels (1-6)
    │ id ←─────────────────────────┐
    │                               │
org_functions (✅ KANONIK KARTA)   │
    │ id ←──────────────────────┐  │
    │ razryad_level_id ─────────┘  │
    │ department_id ─────────────→ org_departments
    │                               │
users                               │
    │ id ←──────────────────────────┤──── 29 ta jadval bu FK dan foydalanadi
    │ role_id ───────────────────→ roles
    │                               │
hr_employees ←─────────────────────┘
    │ id
    │ user_id ──────────────────→ users
    │ org_function_id ──────────→ org_functions ✅
    │ manager_id ───────────────→ hr_employees (self-ref: yuqori daraja)
    │ razryad_level_id ─────────→ razryad_levels

positions ❌ (legacy — 0 FK, foydalanilmaydi; positions→VIEW rejalashtirilgan)
```

---

## 2. MATERIAL VA SAVDO

```
material_cards ✅ (KANONIK)
    │ id ←──────────────────────────────────┐
    │                                        │
sd_customers (✅ KANONIK)                   │
    │ id ←──────────────────┐               │
    │                        │               │
sales_orders ✅ (KANONIK)   │               │
    │ id ←──────────────┐   │               │
    │ customer_id ───────┘   │ sd_customers  │
    │                         ╰─────────────→ sd_customers
    │
sales_order_items
    │ sales_order_id ───────→ sales_orders ✅
    │ material_card_id ─────→ material_cards ✅
    │ unit_of_measure ──────→ unit_of_measures

orders ❌ (PP ga tegishli, SD emas; T1 texnik qarz — ikki dunyo muammosi)
```

---

## 3. ISHLAB CHIQARISH REJASI

```
technology_cards ✅ (MASTER spec)
    │ id ←──────────────────────┐
    │                            │
technology_card_items            │
    │ technology_card_id ────────┘
    │ material_card_id ─────────→ material_cards ✅

work_centers
    │ id ←──────────────────────┐
    │                            │
work_orders                      │
    │ id ←──────────────────┐   │
    │ sales_order_id ────────────→ sales_orders ✅
    │ technology_card_id ────────→ technology_cards ✅
    │ work_center_id ────────────┘

tech_cards ❌ (buyurtma nusxasi — T4; technology_cards = master)
```

---

## 4. MES (ISHLAB CHIQARISH IJROSI)

```
shift_schedules
    │ id ←──────────────────────┐
    │                            │
shift_handovers ✅ (KANONIK)    │
    │ shift_id ──────────────────┘
    │ supervisor_id ────────────→ users

mes_shift_handovers ❌ (VIEW over shift_handovers — ALTER TAQIQ!)

production_sessions
    │ id ←──────────────────────┐
    │ work_order_id ─────────────→ work_orders
    │ shift_id ──────────────────→ shift_schedules
    │ operator_id ───────────────→ users

mes_operations
    │ production_session_id ─────→ production_sessions
    │ work_center_id ────────────→ work_centers
```

---

## 5. SIFAT NAZORATI

```
defect_catalog (lookup — seed-05)
    │ code (PK) ←───────────────┐
    │                            │
quality_checks                   │
    │ id                         │
    │ work_order_id ─────────────→ work_orders
    │ inspected_by ──────────────→ users
    │                            │
qc_check_defects                 │
    │ qc_check_id ───────────────→ quality_checks
    │ defect_code ───────────────┘ defect_catalog
```

---

## 6. OMBOR

```
warehouse_stock ✅ (KANONIK — bitta yozuv nuqtasi)
    │ material_card_id ─────────→ material_cards ✅
    │ warehouse_code            → enum: RM-MAIN|WIP|FG|QUARANTINE|MRO

current_stock ❌ (VIEW over warehouse_stock — INSERT TAQIQ)
stocks ❌ (eski, TEGMA — T2)
wms_stock ❌ (eski, TEGMA — T2)

warehouse_transactions
    │ material_card_id ─────────→ material_cards ✅
    │ reference_id              → work_orders.id OR sales_orders.id (polymorphic)
    │ created_by ───────────────→ users
```

---

## 7. MOLIYA (GL)

```
accounts ✅ (BHMS Chart of Accounts)
    │ code (PK) ←───────────────┐
    │ parent_code ───────────────┘ (self-ref tree)
    │
entries ✅ (KANONIK GL — SAP#76)
    │ account_id ───────────────→ accounts (code)
    │ created_by ───────────────→ users
    │ reference_type            → "sales_order"|"payroll"|"purchase"
    │ reference_id              → polymorphic

gl_journal_entries ❌ (TEGMA FOREVER — SAP#76, ADR-003, 0 qator)
gl_lines ❌ (TEGMA — SAP#76)
```

---

## 8. CRM

```
crm_leads
    │ id ←──────────────────────┐
    │ assigned_to ───────────────→ users
    │
crm_deals
    │ lead_id ───────────────────→ crm_leads
    │ assigned_by_id ────────────→ users (NOT NULL — fallback zanjir kerak!)
    │ sd_customer_id ────────────→ sd_customers ✅
    │
crm_pipeline_stages (lookup)
```

---

## 9. IoT

```
iot_sensors
    │ id ←──────────────────────┐
    │ work_center_id ────────────→ work_centers
    │
iot_readings (APPEND-ONLY — DELETE TAQIQ!)
    │ sensor_id ─────────────────→ iot_sensors
    │
iot_alerts
    │ sensor_id ─────────────────→ iot_sensors
    │ resolved_by ───────────────→ users
```

---

## 10. ASOSIY LOOKUP JADVALLAR

```
roles             ← users.role_id
unit_of_measures  ← sales_order_items.unit_of_measure, warehouse_transactions
razryad_levels    ← org_functions.razryad_level_id, hr_employees
defect_catalog    ← qc_check_defects.defect_code
accounts          ← entries.account_id
```

---

## Kanonik vs Eskirgan Jadvallar Xaritasi

| Kanonik ✅ | Eskirgan ❌ | Sabab |
|-----------|-----------|-------|
| `org_functions` | `positions` | 29 FK vs 0 FK — ADR-001 |
| `sales_orders` | `orders` | SD kanonik — ADR-002 |
| `entries` | `gl_journal_entries`, `gl_lines` | SAP#76 — ADR-003 |
| `warehouse_stock` | `stocks`, `wms_stock` | Single source — ADR-004 |
| `technology_cards` | `tech_cards` | Master vs snapshot — ADR-006 |
| `shift_handovers` | `mes_shift_handovers` | VIEW (ALTER TAQIQ) |
| `current_stock` | — | VIEW — faqat o'qish |
| `material_id` | `material_card_id` | Ustun rename — A2 drift fix |

---

*EuroPrint ERP · DB ERD · Versiya: 2026-06-18*
