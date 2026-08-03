# MASSIV-50 — EGASI QIYMATLARI / QARORLARI (ishga tushishdan oldin)

> **Sana:** 2026-06-19 · Direktivalar sizning intervyu javoblaringizga **moslashtirildi** (10/10 top-mismatch hal).
> Qolgan yagona narsa — **faqat siz bera oladigan qiymatlar va qarorlar**. Bular ataylab "gated" qoldirilgan:
> agent ularni **o'ylab topmaydi** (Q-40 — soxta raqam taqiq). Siz qiymat bersangiz → migration `-- APPROVED:` →
> paket ishga tushadi.

---

## A — QIYMAT KERAK (agent o'ylab topmadi; sozlanadigan qilib qoldirildi)

| # | Qiymat | Qaysi paket | Hozir | Siz nima berasiz |
|---|--------|-------------|-------|------------------|
| 1 | **AQL nashri** | P18/P19 (QC) | ISO 2859-1 vs MIL-STD-1916 — tanlanmagan | Qaysi standart? (AQL daraja 2.5 saqlanadi) |
| 2 | **AI ЦКП vaznlari + o'tish bali** | P36 (AI) | `ai_ckp_config` jadval bo'sh (Q42: ЦКП40/sifat30/muddat20/boshqa10?) | 4 vazn % + ckp_pass_threshold |
| 3 | **EP_COST_RATIO** | P08 (GOLDEN) | `erp_settings` da NULL (0.65 olib tashlandi) | Tannarx koeffitsiyenti % |
| 4 | **Tiraj toleransi** | P09/P10 (SD) | NULL (±10% default emas) | Necha % og'ish ruxsat? |
| 5 | **Qog'oz namlik chegarasi** | P22 (MM) | `material_cards.max_namlik_pct` per-tur NULL | Har qog'oz turi uchun % |
| 6 | **Gofra take-up + 21 material** | P53 (PP) | flute A/B/C/E/BC koeff + GSM/format seed NULL | Koeffitsiyentlar + material jadvali |
| 7 | **Imtihon o'tish-bali + retake** | P04 (ORG) | `razryad_levels` da NULL (70%/3 olib tashlandi) | Har razryad uchun % + necha urinish |
| 8 | **Kassir PIN formati** | P27 (HR/KAS-2) | 4 vs 6 raqam — tanlanmagan | PIN uzunligi |
| 9 | **Bonus %** | P27 (HR) | tasdiqlanmagan | A/B/C klass bonus stavkalari |

---

## B — ARXITEKTURA QARORI KERAK (HARD BOUNDARY)

| # | Qaror | Qaysi paket | Savol |
|---|-------|-------------|-------|
| 10 | **manager_id ma'lumoti** | P51 (ORG) | 124 ta node uchun "kim kimga rahbar?" (head_user_id) — inson bilimi |
| 11 | **GL#76 cost-center** | P52 (FIN) | (a) FK→`org_departments` vs `cost_centers`; (b) `sex_category` `entries`'da yoki hisobotda; (c) APPROVED |
| 12 | **workflow_rules** | P32 (COR) | Gorizontal yo'l hozir quriladimi yoki defer? |
| 13 | **org-kaskad (EP-ORG-041)** | P04/P05 (ORG) | Yangi bo'lim → POS-ombor + RBAC avto-yaratiladimi? (hozir defer-flag) |
| 14 | **oshxona** | — | Qaysi modulда? (hozir hech qayerda) |
| 15 | **GL hisob raqamlari** | P25 (FIN ZNO) | 5010/5110 o'ylab topilgan edi → olib tashlandi; haqiqiy BHMS kodlari kerak |

---

## C — PROTSEDURA (qiymatlar kelgach)

1. Har migration faylida `-- APPROVED: <ism> <sana>` stampini siz qo'yasiz (~30 DDL, Q-35).
2. Qiymatlar → tegishli config/master-data jadvalga (seed yoki UPDATE) yoziladi.
3. Keyin: W1 (26 paket) parallel → tekshir → W2 (P52/P53 bilan 12) → W3 → W4.

> Manba: `00-INTERVYU-MOSLIK.md` (audit) + re-verify `remainingOwnerValues`. Hech bir qiymat o'ylab topilmagan — barchasi siz uchun ochiq qoldirilgan.
