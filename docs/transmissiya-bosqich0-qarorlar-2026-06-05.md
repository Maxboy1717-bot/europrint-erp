# Transmissiya ulash — BOSQICH 0 kanonik qarorlar + ijro tartibi
> Sana: 2026-06-05 | Manba: `D:\kitob\TAHLIL-MASTER-XULOSA-2026-06-05.md` + jonli verify (4 SELECT)
> Rol: EDITOR (bitta agent, inline, subagent yo'q). Egasi qarori olingan.

## ✅ BOSQICH 0 — KANONIK QARORLAR (egasi, 2026-06-05)
| Tugun | Tanlov | Sabab |
|---|---|---|
| **Buyurtma jadvali** | **`sales_orders`** | 12 qator bor, panellar o'qiydi, sd_sales_orders=VIEW ustida, Phase-4 fan-out shunga ulangan. papka_orders/ow_orders = o'lik olamlar |
| **GL ledger** | **`entries`** | post* metodlar real (chaqiruvchi yo'q); pos_gl_*/gl_journal_entries = o'lik olamlar |
| **Stock jadvali** | **`warehouse_stock`** | current_stock = uning ustidagi VIEW; WMS-listener shunga yozsa Leverage #4 ikki-yozuvi yo'qoladi |

## ⚠️ VERIFY-DON'T-TRUST topilmalar (prompt tartibini o'zgartiradi)
- **Leverage #1 (manager_id backfill)** — 🔴 MANBASIZ. Jonli: 30/30 employees manager_id NULL; **0/30** xodimning bo'limida head_user_id bor (head bor 18 bo'lim — xodimsiz). Mavjud ma'lumotdan derive bo'lmaydi → daraxt bo'ylab yuqoriga (ancestor head) yurish YOKI org-head data kerak. **Avtonom emas.**
- **Leverage #4 (movement event emit)** — endi STOCK qarori (`warehouse_stock`) bilan **OCHILDI** (ikki-yozuv yo'qoladi).

## 🎯 IJRO TARTIBI (qayta tartiblangan — verify asosida)
**BOSQICH 1 (autonom, kod-toza):**
1. **Leverage #5** — STRING-kalit event → class (`PO_REQUIRES_DIRECTOR_APPROVAL`, `THREE_WAY_MATCH_FAILED`, `iot.sos.raised`, `SecurityIncidentDetected`). Sof kod, bog'liqliksiz. ⬅️ **BIRINCHI**
2. **Leverage #6** — soxta-create → real `repo.save()` (autonom qismlar; ba'zilari kanonik-qaror kerak).
3. **Leverage #1** — manager_id: daraxt-yurish yo'li (ancestor head) tekshiriladi; bo'lmasa org-head data egasidan.
4. **Leverage #4** — movement event emit → warehouse_stock (kanonik tanlangan).

**BOSQICH 2 (kanonik ulash):**
5. **Leverage #2** — sales_orders + sales_order_items yozish yo'li (FE wizard → sales_orders).
6. **Leverage #3** — entries post* metodlarini event'larga ulash (goods-receipt→AP, payment→AR, payroll, POS).
7. **Leverage #7** — davomat → payroll ulash.

**BOSQICH 3:** Leverage #9 (Telegram token + chat_id; GEMINI_API_KEY) — egasi `.env`.
**BOSQICH 4:** Leverage #8 (sloy/qirqim formula skeleti), #10 (operator tablet 501→real + 4 jadval, DDL → egasi ruxsati).

## Qoidalar (har fix)
verify-live → plan → implement (minimal real) → DB-proof (SELECT) → tsc → individual commit → log (`TUZATISH-PROGRESS-2026-06-05.md`). DDL/yangi-route/delete/kanonik = egasi ruxsati. Subagent yo'q.
