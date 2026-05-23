# Vysotskiy 7 Otdeleniye — Org-Tree Plan

**Manba**: Hujjat (Q&A 200/200), Q120-Q200

## Daraxt strukturasi

```
0. ROOT
└── L1: Egasi (Owner)
    └── L1: Bosh Direktor (CEO)
        ├── L2: 7 Otdeleniye (vysotskiyFunction)
        │   ├── 1. Qurilish bo'linmasi (construction)
        │   ├── 2. Tarqatish bo'linmasi (distribution)
        │   ├── 3. Ishlab chiqarish (production)
        │   ├── 4. Texnik ta'minot (tech_support)
        │   ├── 5. Moliya (finance)
        │   ├── 6. Rivojlanish (development)
        │   └── 7. Ma'muriy bo'lim (administrative)
        │
        └── L3: Otdellar (30+ bo'lim — har Otdeleniye ichida)
        └── L4: Sektsiyalar (kerakli joylarda)
        └── L5: Sektorlar (eng past)
```

## 7 Otdeleniye — to'liq mapping

### 1. Qurilish bo'linmasi (`vysotskiyFunction = 'construction'`)
**Vazifa**: Personnel + Kommunikatsiyalar + Marketing
**Otdellar (L3)**:
- HR bo'limi (HR_DEPT)
- Marketing bo'limi (MARKETING_DEPT)
- IT bo'limi (IT_DEPT)
- Reception (RECEPTION_DEPT)
- Brending va PR (BRAND_DEPT)

### 2. Tarqatish bo'linmasi (`distribution`)
**Vazifa**: Sales + CRM + Customer Service
**Otdellar (L3)**:
- Sotuv bo'limi (SALES_DEPT)
- CRM va Mijoz xizmati (CRM_DEPT)
- Logistika va Yetkazib berish (LOGISTICS_DEPT)
- Customer Care (CUSTOMER_CARE_DEPT)

### 3. Ishlab chiqarish (`production`)
**Vazifa**: Offset + Flexo + Digital + Prepress
**Otdellar (L3)**:
- Prepress (PREPRESS_DEPT)
- Offset bosma (OFFSET_DEPT)
- Raqamli bosma (DIGITAL_DEPT)
- Postpress (POSTPRESS_DEPT)
- Katta format (LARGEFORMAT_DEPT)
- Qadoqlash (PACKAGING_DEPT)
- Sex menejmenti (PROD_MGMT_DEPT)
**Sektsiyalar (L4)**:
- OFFSET ichida: SM52 stansiya, SM74 stansiya, XL106 stansiya
- DIGITAL ichida: Ricoh stansiya, Xerox stansiya, Konica stansiya

### 4. Texnik ta'minot (`tech_support`)
**Vazifa**: Uskunalar + IT + Xom ashyo
**Otdellar (L3)**:
- Texnik xizmat (MAINTENANCE_DEPT) — uskuna xizmati
- Ombor (WAREHOUSE_DEPT)
- Xom ashyo ombori (RAW_MATERIAL_DEPT)
- MRO (MRO_DEPT)
- Xavfsizlik xizmati (SECURITY_DEPT)
- Oshxona (CANTEEN_DEPT)

### 5. Moliya (`finance`)
**Vazifa**: Buxgalteriya + Kassa + Budjet
**Otdellar (L3)**:
- Buxgalteriya (ACCOUNTING_DEPT)
- Kassa (CASH_DEPT)
- Budjet va planlash (BUDGET_DEPT)
- Avans hisobotlar (ADVANCE_DEPT)
- Soliq va hisobot (TAX_DEPT)

### 6. Rivojlanish (`development`)
**Vazifa**: IT/ERP + Marketing strategiyasi + Innovatsiya
**Otdellar (L3)**:
- ERP rivojlanishi (ERP_DEV_DEPT)
- Marketing strategiyasi (MKT_STRAT_DEPT)
- Innovatsiya va AI (INNOVATION_DEPT)
- Dizayn bo'limi (DESIGN_DEPT)

### 7. Ma'muriy bo'lim (`administrative`)
**Vazifa**: Egasi ofisi + Rasmiy masalalar + CEO ofisi
**Otdellar (L3)**:
- Egasi ofisi (OWNER_OFFICE)
- CEO ofisi (CEO_OFFICE)
- Yuridik bo'lim (LEGAL_DEPT)
- Audit va inspeksiya (INSPECTION_DEPT)

## Jami statistika

| Daraja | Soni | Misol |
|---|---:|---|
| L0 (root) | 1 | EuroPrint Group |
| L1 (Owner+CEO) | 2 | Owner, CEO |
| **L2 (7 Otdeleniye)** | **7** | Qurilish, Tarqatish, Ishlab chiqarish, ... |
| **L3 (Otdellar)** | **30+** | HR_DEPT, OFFSET_DEPT, ACCOUNTING_DEPT, ... |
| L4 (Sektsiyalar) | 5-10 | OFFSET → SM52/SM74/XL106 stansiyalar |
| L5 (Sektorlar) | 0-5 | Eng past, kerakli joylarda |

## TSKP (ЦКП) misol

Har lavozim uchun (`org_functions.tskp`):

| Lavozim | TSKP | Target |
|---|---|---|
| CEO | Kompaniya 7 funksiyasi muvozanatda ishlashi | 100% |
| HR menejer | 400 xodim faol, 90%+ band, tarif 0 | 90% |
| Offset operator | Kunlik bosma plan / aslida + sifat | 95% |
| Buxgalter | Yopiq oy 5 ish kun ichida + xato 0 | 100% |
| Dizayner | Loyiha sifati 5/5 baho + muddatda | 4.5/5 |

## Mapping qoidalari (eski → yangi)

| Eski `departments.code` | Yangi `org_departments` path |
|---|---|
| EXEC | Owner > CEO > Administrative > CEO Office |
| HR | Construction > HR Dept |
| FIN | Finance > Accounting Dept |
| SALES | Distribution > Sales Dept |
| PROD | Production > Production Mgmt |
| QC | Tech Support > Maintenance (yoki Production > QC subsidiary) |
| WAREHOUSE | Tech Support > Warehouse |
| LOGISTICS | Distribution > Logistics |
| IT | Construction > IT |
| MARKETING | Construction > Marketing |
| LEGAL | Administrative > Legal |
| SECURITY | Tech Support > Security |
| MAINTENANCE | Tech Support > Maintenance |
| DESIGN | Development > Design |
| CANTEEN | Tech Support > Canteen |
| PREPRESS | Production > Prepress |
| OFFSET | Production > Offset |
| DIGITAL | Production > Digital |
| POSTPRESS | Production > Postpress |
| LARGEFORMAT | Production > Largeformat |

## Position mapping (eski → yangi `org_functions`)

Har 112 ta eski position uchun:
- `code` = unchanged (CEO, HR_MANAGER, OFFSET_OPERATOR, ...)
- `departmentId` = mapping yuqoridan (positions.ts ga ko'ra Otdeleniye)
- `positionName` = `positions.nameUz`
- `positionNameRu` = `positions.nameRu`
- `tskp` = to'ldirish (avval bo'sh, keyin admin to'ldiradi)
- `tskpTarget` = NULL boshlanishida

## Tasdiqlash zanjiri qoidalari (workflow uchun)

- **Vertikal**: Operator → Smena boshlig'i → Bo'lim boshlig'i → Otdeleniye rahbari → CEO → Owner
- **Gorizontal**: Bo'lim → tegishli bo'lim (config: workflow_rules jadval)
  - Misol: Avans ariza: Sales > Sales Manager → Finance > Accounting > Cashier
  - Misol: Material so'rovi: PROD > Prod Manager → Tech Support > Warehouse Manager
