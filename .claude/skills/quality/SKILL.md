---
name: quality
description: EuroPrint sifat nazorati — SPC control chart, FMEA RPN, AQL sampling, sertifikat, defect tracking. Trigger so'zlar: "sifat", "QC", "quality", "defect", "SPC", "FMEA", "sertifikat", "inspection", "AQL".
---

# Sifat Nazorati Moduli — Skill

## Modul hududi
- Backend: `apps/api/src/modules/qc/`
- Frontend: `QC*`, `QualityTrendPage.tsx`, `QCModule.tsx`
- Schema: `lib/db/src/schema/qc-schema.ts`

## Asosiy konseptlar

### SPC (Statistical Process Control)
- Control chart: mean ± 3σ (UCL/LCL)
- Out-of-control: sample > UCL OR sample < LCL
- 1-sample edge case: ucl=lcl=value, sd=0
- Empty sample → `Err('NO_SAMPLES')`

### FMEA (Risk Priority Number)
- RPN = Severity × Occurrence × Detection (1–10 each)
- Risk tiers:
```
< 40   → low
40–99  → med
100–199 → high
200+   → critical
```
- Out of range (0, 11, negative, NaN) → `Err('RANGE')`

### Certificate FSM
```
draft → pending → signed → expired
              ↘ rejected → draft (qayta yuborish)
```

### AQL Sample Size (ISO 2859)
```
lot ≤ 8    → 2
9–15        → 3
16–25       → 5
26–50       → 8
51–90       → 13
91–150      → 20
151–280     → 32
281–500     → 50
501+        → 80
```

## API endpointlar
- `GET /api/qc/inspections` — tekshiruvlar
- `POST /api/qc/inspections` — yangi tekshiruv
- `GET /api/qc/control-charts` — SPC chartlar (Sprint H regression)
- `GET /api/qc/certificates` — sertifikatlar
- `POST /api/qc/certificates` — yangi sertifikat
- `POST /api/qc/certificates/:id/sign` — imzolash
- `POST /api/qc/certificates/:id/reject` — rad etish (sabab majburiy)
- `GET /api/qc/material-tests` — material testlari
- `GET /api/qc/final-inspections` — yakuniy inspeksiyalar

## Biznes qoidalari
1. **Defect > 5% threshold** → automatic alert (production module event).
2. **Sertifikat imzolanmagani holda eksport qilinmaydi** (FSM signed bosqichda bo'lishi shart).
3. **Reject sabab majburiy** (Zod min(1) validation).
4. **Inspection result enum**: `pass | fail | rework` (boshqa qiymatlar Zod reject qiladi).

## Test fayllari
- `apps/api/test/qc/spc-fmea.spec.ts` — 13 tests
- `apps/api/test/qc/qc-exhaustive.spec.ts` — 110 tests

## Eslatma
- DB CHECK constraints: `qcMaterialTests`, `qcFinalInspections` da status enum yozilgan (Sprint P2-3 regression).
- Mean/StdDev pure math — Decimal.js majburiy emas (oddiy floats), lekin Money emas.
