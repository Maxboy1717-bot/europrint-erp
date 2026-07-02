# QAROR-JURNAL — 2026-07-02 "Vizyon bo'yicha tuzatish" to'lqini (Q-26)

> Guruh: **G10 — HUJJATLAR** (faqat `docs/**`; kod fayllariga tegilmagan).
> Barcha sonlar jonli DB `europrint`@:5432 dan `node _audit/q.cjs` bilan o'lchangan (Q-29).

---

## 1. Egasi ruxsati (2026-07-02)

Egasi: **"hamma muammolarni to'g'irlash — vizyon bo'yicha"** — to'lqin-darajali ruxsat.
Qamrov: parallel guruhlar fayl-izolyatsiya (Q-31) bilan ishlaydi; DDL faqat additive
(ALTER TABLE ADD COLUMN / CREATE INDEX / seed, Q-35, yangi CREATE TABLE taqiq);
ishlayotgan funksiya regressiya qilinmaydi (Q-39/Q-46). To'g'rilik o'lchovi = vizyon
hujjatlari (Q-40): `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` +
`docs/audit/OMBOR-TERMINAL-INTERFEYS-SPEC-2026-06-27.md` + `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md`.

## 2. G10 (hujjatlar) o'zgarishlari — qisqa ro'yxat

1. **`docs/ombor-jadvallari-inventarizatsiya-2026-06-02.md`** — boshiga "## 2026-07-02 YANGILANISH"
   bo'limi qo'shildi (jonli qayta-o'lchov):
   - Kanonik-jonli: warehouse_stock 23→37, material_cards 21→31, pos_movements 1→3,
     inventory_counts 6→17, stock_ledger 0→1, wms_goods_issues 0→1, pos_gl_posting_log=2;
   - ⭐ `pos_movement_confirmations` **DEAD→JONLI** (3 qator, writer `stock-ledger.service.ts`,
     real signature_hash) — eski "O'CHIRISH MUMKIN" bahosi bekor;
   - Tozalash-nomzodlar: `pos_stock_alerts` **1078 qator FLOOD** (1 material, soatlik cron
     2026-06-20→07-01, dedup yo'q), `stock_items` 7 ta "(DEMO)" seed-qator,
     `pos_printer_config` (birlik) = kodsiz dublikat (kanonik `pos_printer_configs`);
   - Yangi DEAD-nomzodlar (0 qator + 0 runtime kod, grep-isbot): pos_serial_number_items,
     pos_offline_queue, operator_material_balance, excel_import_batches, ai_material_insights,
     warehouse_rows, warehouse_shelves;
   - `mm_materials` VIEW nishoni almashgan: `materials` → **`material_cards`** (jonli pg_views isbot).
2. **`docs/audit/MASTER-SAVOL-JAVOB-2026-06-08.md`** — EP-POS-007 ga eslatma-qator:
   etiket POS Monitor printeridan chiqadi (egasi kitob:18410), ERPdan emas (2026-06-27 spec).
3. **Ushbu qaror-jurnal fayli** — to'lqin ruxsati + EGASI-DATA kutish ro'yxati qayd etildi.

Boshqa guruhlar (kod-tomon) o'z commit'larida hujjatlanadi — G10 ular nomidan da'vo yozmaydi (Q-29).

## 3. EGASI-DATA — kutilayotgan 4 band (fabrikatsiya TAQIQ)

| # | Band | Nega egasi-data | Hozirgi holat |
|---|---|---|---|
| 1 | **Kassir PIN seed** | PIN qiymatlari xavfsizlik-sezgir, faqat egasi beradi | Seed'da PIN yo'q; kod PIN-oqimga tayyor bo'lganda egasi qiymat kiritadi |
| 2 | **Kategoriya→BHMS hisob raqami mapping** | Buxgalteriya hisob-mapping biznes qarori | Sozlanadigan default qoldirilgan; yakuniy jadvalni egasi tasdiqlaydi |
| 3 | **Reyting 7-faktor og'irliklari** | Og'irlik sonlari (jami=1.0) egasi belgilaydi | Formula/struktura bor (CHAT-TARIXI-YANGI), koeffitsiyentlar kutilmoqda |
| 4 | **head_user_id backfill 127/145** | Kim-kimni-boshqaradi faqat egasi biladi | Jonli o'lchov 2026-07-02: `org_departments` 145 tadan **127 tasida head_user_id NULL** |

---

*Yozilgan: 2026-07-02, G10 (hujjatlar guruhi). Manba-qoidalar: Q-25/Q-26/Q-29/Q-40.*
