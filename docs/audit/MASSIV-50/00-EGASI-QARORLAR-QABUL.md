# MASSIV-50 — EGASI O'RNIDA QABUL QILINGAN QARORLAR

> **Sana:** 2026-06-19 · Egasi vakolat berdi ("mani o'rnimga qo'yib ko'ring") → maslahatchi (Claude) quyidagi
> qiymat/qarorlarni **oqilona standart** sifatida qabul qildi, build to'xtamasligi uchun. **Egasi istalgan vaqt
> o'zgartira oladi** — barchasi sozlanadigan (master-data/config), kodga qotirilmagan.
> ⚠️ Bitta istisno (#10) — real odam-ma'lumoti, o'ylab topilmagan.

| # | Soha | QABUL QILINGAN qiymat/qaror | Joyi |
|---|------|------------------------------|------|
| 1 | AQL nashri | **ISO 2859-1**, daraja **AQL 2.5** | P18/P19 |
| 2 | AI ЦКП vaznlari | ЦКП **40%** · sifat **30%** · muddat **20%** · boshqa **10%**; o'tish bali **60** | P36 `ai_ckp_config` |
| 3 | EP_COST_RATIO | **0.65** (tannarx koeff., sozlanadigan) | P08 `erp_settings` |
| 4 | SD tiraj toleransi | **±10%** | P09/P10 |
| 5 | Qog'oz namlik chegarasi | **12%** (standart; per-tur sozlanadi) | P22 |
| 6 | Gofra take-up koeff. | A=**1.54** · B=**1.36** · C=**1.45** · E=**1.27** · BC=**1.43** (standart gofra omillari) | P53 |
| 7 | Imtihon o'tish/retake | o'tish **70%** · maks **3** urinish | P04 `razryad_levels` |
| 8 | Kassir PIN | **4 raqam** | P27/KAS-2 |
| 9 | Bonus % (klass) | A=**15%** · B=**10%** · C=**0%** | P27 |
| 11 | GL#76 cost-center | **`org_departments` node** (parallel master EMAS); `entries.cost_center_id` FK; `sex_category` `entries` darajasida (A-yondashuv) | P52 |
| 12 | workflow_rules | **HOZIR quriladi** (defer emas) | P32 |
| 13 | org-kaskad (EP-ORG-041) | **HOZIR quriladi** — yangi bo'lim → POS-ombor + RBAC avto | P04/P05 |
| 14 | oshxona | **Finance ichida** (kassir/oshxona sub-feature — naqd bilan bog'liq) | P26 |
| 15 | ZNO GL kodlari | **BHMS CoA seed**dan (42 hisob mavjud); mos hisoblar tanlanadi, sozlanadigan | P25 |

## ⚠️ #10 — manager_id (yagona real-data kiritma)
124 ta node uchun "kim kimga rahbar?" (`head_user_id`) — **o'ylab topilmaydi** (Q-40: soxta data taqiq). Qabul qilingan qaror:
- **Struktura:** manager_id = daraxtда bevosita yuqori node `head_user_id` (rekursiv, NULL bo'lsa keyingi yuqoriga).
- **Default holat:** `head_user_id` NULL bo'lgan node uchun manager_id NULL qoladi (tizim NULL'ni xato bermay ko'taradi).
- **Egasi:** haqiqiy rahbar tayinlashlarini kiritsa → backfill avtomatik ishlaydi. Bu yagona real-dunyo kiritma.

> Bu qarorlar `00-EGASI-QIYMATLARI.md` dagi placeholderlarni to'ldiradi. Build endi bularга tayanib davom etadi.
