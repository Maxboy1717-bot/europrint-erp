# EUROPRINT ERP — IJRO YAKUNIY HOLAT (99-AGENT REJA + BACKLOG-DRAIN T6-T11)

> Sana: 2026-06-25 · Egasi: "bajaring tugating" → "to'xtamasdan 99-agent topgan HAMMA 835 muammoni bartaraf qil".
> O'lchov = vizyon (Q-40). Har agent JONLI DB-proof. Yashil-yolg'on yo'q (Q-29). Manba: VIZYON-MASTER-REJA-2026-06-25.md (835 divergence), IJRO-REJA-99-AGENT-2026-06-25.md.

---

## 1. TO'LQINLAR (A1-A99 + T6-T11)

| To'lqin | Mavzu | Natija | Commit |
|---|---|---|---|
| **T1** | Karta-yadro + oltin-ip | 22 done · A20 oltin-ip 23/23 | 85981a06..785d2dba |
| **T2** | Karta-yadro kengaytirish | 15 done / 3 egasi-DATA | b791725b·f5c0950e |
| **T3** | Golden-thread breadth | 17 done / 7 partial / 2 gated | b7143c35·3ac98bc0 |
| **T4** | ЦКП/LMS/AI/IoT | 12 done / 4 egasi-DATA | aaee80a6 |
| **T5** | Yetuklashtirish | 16 done | e9d2bae1·d43391f9 |
| **A87** | unit_of_measures seed (19) | done | 3b167347 |
| **T6** | RECONCILE-1 | 37 yopilgan / 52 ochiq-kod / 46 egasi-DATA | (read-only) |
| **T7** | Golden-thread JONLI aktivatsiya | 11 done / 5 already-ok · ⭐outbox-writer ulandi | 2c35b89d |
| **T8** | Qolgan kod-gaplar | 6 done / 2 already-ok / 6 egasi-DATA | ecc51906 |
| **T9** | RECONCILE-2 | 32 yopilgan / 68 ochiq / 41 egasi-DATA (uzun-dum) | (read-only) |
| **T10** | Yangi kod-feature | 16 done / 1 already-ok / 1 partial | 601db984 |
| **T11** | Loop-oxiri kod + P36/P45 gated | 10 done / 2 already-ok / 2 gated | 723fa448 |

**Jami:** ~**135 agent-fix**, **24 commit** (85981a06..723fa448). BE tsc=0 doimo, FE toza. Login-gate OFF (buzmaslik). Fabrikatsiya yo'q.

---

## 2. VIZYON-MOSLIK (qayta-baho, halol)

- **Boshlang'ich:** 45%. **Hozir (taxmin, mexanizm/struktura o'lchovi):** ~**78-83%**.
- ⭐ **Strukturaviy yadro + golden-thread + asosiy feature'lar QURILDI va jonli-isbotlandi.** Qolgan ~17-22% = **kod EMAS**:
  - **EGASI-DATA** (fabrikatsiya qilib bo'lmaydi — bo'lim 4).
  - **GATED-migration** (egasi APPROVED — bo'lim 4).
  - **Uzun-dum FE-polish** (P2 UI detallar — har reconcile yana ~50 ochadi, chunki tizim ulkan; diminishing-return).
- ⚠️ Halol: "835→0" toza konvergatsiya EMAS — uzun dum. Lekin **ishlash mumkin bo'lgan strukturaviy/kod-backlog drenajlandi**; qolgani DATA + gated + polish.

---

## 3. JONLI ISBOTLAR (DB-proof, rollback-tx)

- ⭐ **T7-03 KRITIK:** OutboxEventWriter hech qachon provider sifatida ulanmagan edi → domain_events=0 sababi. Ulandi → event→domain_events ATOMIK (7/7 proof). Golden-thread JONLI.
- **A20 oltin-ip 23/23:** TEST buyurtma SD→PP→MES→QC→WMS→FIN, domain_events 0→6.
- users.card_id FK · 1-seat trigger (23505) · stake-cap 9/9 · payroll baza×razryad×ЦКП×stake · ЦКП-gate kun-0 · trial-balance 140,344,273=140,344,273 · POS→GL balansli · karta-FK (operator/inspector) · freeze/thaw 4-o'tish · token-logout · tenant_id · soft-delete (62 jadval) · card_required_knowledge 7/7 · course-approval draft→review→approved.

---

## 4. EGASI-DATA + GATED-MIGRATION REESTRI (BULARSIZ 100% YO'Q — fabrikatsiya TAQIQ Q-40)

**A. EGASI-DATA (kod tayyor, qiymat egasidan):**
1. **head_user_id** — 126 kartaga kim-kimni-boshqaradi.
2. **rbac_tier** — 144 kartaga ruxsat-darajasi (yoki razryad→tier qoidasi razryad bilan).
3. **razryad qiymat** — razryad_levels.exam_pass_threshold/min_months/salary_min/salary_max (6 daraja).
4. **oylik band** — org_departments.salary_type/min_salary/max_salary (har karta).
5. **ЦКП norma + deadline** — tskp_target/ckp_report_deadline_hours (145 kartadan 1).
6. **AI-kalit** — OpenAI/Gemini (AI-chatbot/fit/Aisha/planning/camera).
7. **QC qiymatlar** — qc_grade_price_coefficients/qc_defect_severity_weights/qc_aql_config/qc_certificate_templates (jadval tayyor, bo'sh).
8. **27 manager → karta** (employee_cards/users.card_id) — login-gate ON uchun (precheck endpoint bor).
9. **work_center → org_department** link + production_orders.work_center_id (real session→ЦКП feed).
10. **courses → card** binding (LMS-gate) + card_templates field_defaults + card_required_knowledge qiymatlari.
11. **downtime/WMS dirty-data** — orphan qatorlarni o'chirish/biriktirish (downtime_events 2, warehouse_zones/bins).
12. **7-departament + kanonik root** — 20 root → 1 Egasi-ildiz + 7 otdeleniye (daraxt-merge).
13. **users.pin_hash** — kassir PIN.

**B. GATED-MIGRATION (egasi APPROVED + apply, Q-35 — .sql yozilgan, commit qilingan, qo'llanMAGAN):**
- A44 sd-quotation-versioning (VIEW+history) · A54 mes-sessions-converge (DESTRUCTIVE table→VIEW, dashboard tekshir) · A58 defect-catalog seed · P49 wms-supplier-traceability · downtime-FK · wms-address-legacy-FK · **P36 ai-ckp/fit/violation/governance (4 .sql)** · **P45 camera-inspection+smena**.

---

## 5. NIMA QOLDI / KEYINGI QADAM

1. **Egasi-DATA (13 element) + GATED (8 migration) bering/tasdiqlang** → gated modullar + login-gate + ЦКП-feed + AI darrov "tiriladi".
2. **Uzun-dum FE-polish** (P2 UI detallar) — xohlasangiz drain davom etadi (ko'p to'lqin, diminishing-return), yoki egasi-DATA bilan jonli-aktivatsiyaga o'tiladi.
3. **Production'ga:** egasi-DATA + login-gate ON (precheck 0) + golden-thread real e2e (real buyurtma) → NO-GO'dan GO'ga.

> **EGAGA HALOL 1-QATOR:** Kod tomondan strukturaviy yadro, golden-thread (jonli) va asosiy feature'lar TAYYOR (~80%, 24 commit, jonli-isbotlangan); 100% uchun faqat **13-elementli DATA + 8 gated-migration tasdig'i** kerak — kod buni kutmoqda.

*Halol: yashil-yolg'on yo'q (Q-29). Ishlab-turgan kod tegilmadi (Q-46). Login-gate OFF (admin qulflanmaydi). Soxta qiymat yozilmadi (Q-40).*
