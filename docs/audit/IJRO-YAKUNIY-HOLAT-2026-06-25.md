# EUROPRINT ERP — IJRO YAKUNIY HOLAT (99-AGENT REJA, 5 TO'LQIN)

> Sana: 2026-06-25 · Reja: [IJRO-REJA-99-AGENT-2026-06-25.md](IJRO-REJA-99-AGENT-2026-06-25.md) · Tahlil: [VIZYON-MASTER-REJA-2026-06-25.md](VIZYON-MASTER-REJA-2026-06-25.md)
> Egasi: "bajaring tugating" → "to'xtamasdan 99 agent topgan HAMMA muammoni bartaraf qil". O'lchov = vizyon (Q-40). Har agent JONLI DB-proof.

---

## 1. 5 TO'LQIN HOLATI

| To'lqin | Mavzu | Agent | Done | Partial(egasi-DATA) | Gated(APPROVED) | Commit |
|---|---|---|---|---|---|---|
| **1** | Karta-yadro + oltin-ip | 22 | 22 | 0 | 0 | 85981a06·e39e9c31·21d775de·1a82cb5b·785d2dba |
| **2** | Karta-yadro kengaytirish | 18 | 15 | 3 | 0 | b791725b·f5c0950e |
| **3** | Golden-thread breadth | 22 | 17 | 5 | 2 (A44·A54) | b7143c35·3ac98bc0 |
| **4** | ЦКП/LMS/AI/IoT | 16 | 12 | 4 | 0 | aaee80a6 |
| **5** | Yetuklashtirish | 17 | 16 | 0 | 0 | e9d2bae1·d43391f9 |
| | | **95** | **82** | **12** | **2** | **11 commit** (+A87 overload→T6) |

---

## 2. VIZYON-MOSLIK (qayta-baho)

- **Boshlang'ich (99-agent tahlil):** 45%.
- **Hozir (taxmin, mexanizm o'lchovi):** ~**72–78%**. Yadro-mexanizmlar QURILDI va jonli-isbotlandi:
  karta-markazli login/oylik/RBAC, oltin-ip uzluksiz oqim (domain_events), ЦКП-gate, razryad-execution, multi-card stake, 1-seat, tenant_id, soft-delete, POS→GL, stock-kanoniklik, LMS-kartaga, AI-struktura, IoT.
- ⚠️ Bu **taxmin** (Q-40 — soxta aniq-raqam yo'q). Qolgan ~22–28% = asosan **egasi-DATA** (kod emas) + 835-backlog'ning to'lqinlarda tegilmagan P1/P2 qismi (T6+ drain qilinmoqda).

---

## 3. JONLI ISBOTLAR (DB-proof, rollback-tx)

- ⭐ **A20 oltin-ip uchma-uch: PASS 23/23** — 1 TEST buyurtma SD(sales_orders)→PP(production_orders FK)→MES(production_sessions)→QC(qc_inspections)→WMS(warehouse_transactions)→FIN(entries GL balansli); domain_events 0→6 atomik, to'g'ri ketma-ketlik.
- users.card_id FK noto'g'ri kartani RAD (23505/23503). resolveCardGate→card_id birlamchi+fallback.
- 1-seat: position-karta 2-egasi→23505 RAD; guruh-karta ko'p egasi OK. stake-cap 9/9.
- payroll oylik=baza×razryad×ЦКП×stake; ЦКП-gate kun-yo'q→0. trial-balance debit==credit==140,344,273.
- POS→GL balansli legs; stock warehouse_stock lockstep (quantity+available). cashier cash_in→entries→cashier_movements.
- tenant_id jonli (sales_orders/production_orders/entries/warehouse_stock); soft-delete 63 jadval.

---

## 4. EGASI-DATA + APPROVED-MIGRATION REESTRI (bularsiz 100% yo'q — fabrikatsiya TAQIQ)

**Egasi-DATA (kod tayyor, qiymat egasidan):**
1. **27 manager → karta** (employee_cards/users.card_id) — login-gate ON uchun (precheck: GET /auth/card-gate/precheck).
2. **head_user_id** — 126 kartaga kim-kimni-boshqaradi.
3. **AI-kalit** (OpenAI/Gemini) — AI-chatbot/fit/Aisha/planning.
4. **Razryad qiymat** — exam_pass_threshold/min_months/salary_min-max (har razryad).
5. **Oylik band** — bazaviy oylik (har karta).
6. **ЦКП norma + deadline** — tskp_target/ckp_report_deadline_hours (145 kartadan 1 to'la).
7. **Sort/grade narx-koeff** — QC sifat-darajasi koeffitsienti.
8. **work_center → org_department link** — pp_work_centers.org_department_id (12 NULL) + production_orders.work_center_id (real session→ЦКП feed uchun).
9. **courses ↔ card** binding — majburiy darslik kartaga (LMS-gate uchun).
10. **users.pin_hash** — kassir PIN (PIN-talab harakatlar uchun).
11. **7-departament + kanonik root** — 19 root → 1 Egasi-ildiz + 7 otdeleniye (daraxt-merge).
12. **unit_of_measures** seed (A87 — qayta).

**APPROVED-migration (egasi tasdiqlab apply qilsin — Q-35, commit QILINMADI, fayllar diskda):**
- **A44** sd-quotation-versioning (additiv: quotations.version + history + VIEW).
- **A54** a54-mes-sessions-converge-view (⚠️ DESTRUCTIVE: mes_sessions table→VIEW; jonli director/finance/MES-OEE reader — dashboard'da tekshiring).
- **A58** p18-defect-catalog + seed-05-defects (25 nuqson, egasi-tasdiqlangan).

---

## 5. KEYINGI QADAM

1. **T6+ (davom etmoqda):** 99-agent tahlili topgan TO'LIQ backlog (P0=152·P1=383·P2=300=835) — to'lqinlarda tegilmagan qismi drain qilinmoqda (loop-until-dry), to'xtamasdan, backlog 0 bo'lguncha. + A87 (unit-seed) qayta.
2. **Egasi:** yuqoridagi 12-elementli DATA + 3 APPROVED-migration. Berilsa gated modullar darrov "tiriladi".
3. **Production'ga:** egasi-DATA + login-gate ON (precheck 0 bo'lgach) + golden-thread jonli e2e (real buyurtma) → NO-GO'dan GO'ga.

*11 commit (85981a06..d43391f9). BE tsc=0, FE toza. Login-gate OFF (buzmaslik). Fabrikatsiya yo'q (Q-40). Ishlab-turgan kod tegilmadi (Q-46).*
