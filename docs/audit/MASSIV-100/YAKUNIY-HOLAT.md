# MASSIV-100 — ORG-SXEMA (KARTA-markazli) YAKUNIY HOLAT

**Sana:** 2026-06-25 · **Rejim:** avtonom ijro (FAZA-00..11) · **Branch:** chore/schema-convergence
**Manba-reja:** `docs/audit/MASSIV-100/00-MASTER-REJA.md` + PHASE-00..11 direktivalar (13,180 qator)
**Boshlang'ich:** `docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md` — 794 talab, **31% mos**

---

## 1. HAR FAZA HOLATI

| Faza | Mavzu | Holat | Izoh |
|------|-------|-------|------|
| **00** | Yagona kanonik KARTA (`org_departments`) | ✅ TO'LIQ | Ikki-dunyo yopildi: `employee_cards`/`card_folders`/`org_node_portret` FK → `org_departments`; `card.repository` 19 query re-bind; of→od crosswalk VIEW. DB-proof: rollback-tx (A=0 dan). |
| **01** | Xodim KO'P-KARTA + ulush (stake) | ✅ TO'LIQ | `employee_org_departments.stake_fraction`+CHECK; 1-seat guard (karta) + ulush-cap ≤1.0 guard (xodim) + owner-override; backfill solo=1.0. FE: EmployeesTab stake-input. |
| **02** | Login KARTA-gate + RBAC | ✅ MEXANIZM (flag OFF) | `resolveCardGate` (users→employee_cards→org_departments); login-gate env-flag `CARD_LOGIN_GATE_ENABLED` (default OFF=buzmaslik); admin/super_admin/director ALWAYS bypass; JWT karta-claim. |
| **03** | Razryad EXECUTION (o'sish/pasayish) | ✅ TO'LIQ (qiymat=egasi) | `razryad_history`+`razryad_requests`; atomic applyChange (db.transaction); 2-imzo (HR→rahbar); 3-oy guard; imtihon-threshold gate; NULL→reject (fabrikatsiya yo'q). FE: RazryadTab (sozlama+so'rov+tarix). |
| **04** | Oylik KANONIK kartadan | ✅ MEXANIZM (band=egasi) | `getRazryadCoefficient` org_functions→`org_departments` kanonik (razryad_level_id→coefficient; NULL→1.0); `salary_history` audit ustunlari (razryad_coeff/stake_total/proration). |
| **05** | ЦКП kunlik fakt-tizimi | ✅ MEXANIZM (norma=egasi) | `ckp_fact_values` + formula-turi (boolean/quantity_pct) + WITH RECURSIVE kaskad-agregat; norma NULL→0 (fabrikatsiya yo'q). |
| **06** | Karta papkalari (6-bo'lim) | ✅ TO'LIQ | `card_folders` org_departments-kanonik (FAZA-00 orqali), DB-proof tasdiq. |
| **07** | Darslik KARTAGA (xodimga emas) | ✅ MEXANIZM (kurs↔karta=egasi) | kurs↔karta bind kanonik; `lms_cross_card_credits` jadval. |
| **08** | Daraxt + Otdeleniye (Vysotskiy-7) | ✅ MEXANIZM (root+head=egasi) | `org_departments.otdeleniye_no`+CHECK(1-7); manager-zanjir (parent_id=keyingi yuqori daraja); 7-departament root-merge + head_user_id = egasi-DATA. |
| **09** | Karta 5-holat lifecycle | ✅ MEXANIZM (yadro) | `current_state` (active/vacant/io/frozen/archived) + freeze ustunlar (frozen_at/freeze_reason/freeze_until/archived_at). DB-proof: active→frozen+sabab→restore. **Qolgan:** state-machine transition-service app-darajada + field-level audit-diff + Excel ommaviy-import (kattaroq build). |
| **10** | AI per-karta | ✅ MEXANIZM (kalit=egasi) | AiFitService + `ai_fit_scores`/`ai_ckp_scores` MAVJUD; ANTHROPIC kalit ishlaydi (len=108); computeCardFit FAZA-00'da org_departments'ga re-bind. **OpenAI/Gemini kalit = egasi-DATA (bo'sh)** → graceful fallback, fabrikatsiya yo'q. |
| **11** | Dizayn EP-izchillik | ✅ TO'LIQ | Butun org-sxema FE fazasi (8e0aaf2b^..HEAD) **0 yangi inline xom-rang + 0 yangi Tailwind [#hex]** qo'shdi; check-design-tokens gate-mantiqi PASS. Mavjud 3 xom-rang (TreeNodeCard avatar + nuqta-fon) = Muslimbek 2026-05-02, tegilmadi (loyiha diff-aware siyosati + Q-46). |

**Yakun:** 12/12 faza ijro qilindi. **6 faza TO'LIQ**, **6 faza MEXANIZM-TO'LIQ (qiymat/kalit/data egasidan)**.

---

## 2. MEXANIZM-FOIZ

- **Boshlang'ich:** 794 talab, **31% mos** (intervyu-vs-holat).
- **Hozir (taxmin, struktura/mexanizm o'lchovi):** ~**62–68%**.
  - Yadro karta-mexanizmi (kanonik jadval, ko'p-karta, login-gate, razryad-execution, oylik-koeff, ЦКП, darslik-bind, daraxt, lifecycle, AI-struktura, dizayn) — **qurildi va jonli-isbotlandi**.
  - Qolgan ~32–38% — bu **kod emas, DATA/kalit** (3-bo'lim) + 3 kattaroq build-element (Excel-import, field-audit-diff, AI-grading-pipeline OpenAI/Gemini bilan).
- ⚠️ Bu **taxmin** (Q-40 — soxta aniq-raqam yo'q). 100% faqat egasi-DATA berilgach (3-bo'lim) yetiladi.

---

## 3. JONLI ISBOTLAR (DB-proof commitlar, rollback-tx)

| Commit | Isbot |
|--------|-------|
| `61bb5ef6` | FK re-point — employee_cards/card_folders/org_node_portret → org_departments (bad-insert 23503; A=0 dan) |
| `099b2242` | Ko'p-karta stake-cap guard (sum>1.0 reject; idempotent dup-update) |
| `8c9ef494` | resolveCardGate (active-card count, fail-closed) |
| `817453f0` | Razryad applyChange atomic (history+request approve bir tranzaksiyada); 2-imzo + 3-oy + threshold gate |
| `0a715ecc` | Oylik razryad-koeff kanonik kartadan (NULL→1.0 graceful) |
| `fee5ce08` | ЦКП fakt upsert + WITH RECURSIVE kaskad-agregat |
| `735f2126` | card_folders 6-bo'lim org_departments-kanonik |
| `f089ac8c` | darslik kurs↔karta bind + cross-card-credit |
| `a29fa003` | otdeleniye_no CHECK(1-7) + manager-zanjir |
| `6b9b69b8` | Karta 5-holat: active→frozen+sabab+muddat→restore→active |

Har faza: tsc GREEN (o'z fayllarda 0 yangi xato) + rollback-tx DB-proof (jonli DB tegilmadi).

---

## 4. EGASI-DATA REESTRI (BULARSIZ 100% BO'LMAYDI) 🔑

Mexanizm tayyor — quyidagilar **fabrikatsiya qilib bo'lmaydigan haqiqiy DATA/kalit**, faqat egasi beradi:

| # | DATA | Kim ishlatadi | Hozir |
|---|------|---------------|-------|
| 1 | **AI kalit** (OpenAI/Gemini) | FAZA-10 AI-grading/portret pipeline | bo'sh (ANTHROPIC bor) |
| 2 | **head_user_id** (kim-kimni-boshqaradi) | FAZA-08 manager-zanjir, RBAC | 139 kartadan ~18 to'ldirilgan |
| 3 | **Razryad qiymat/threshold/min_months** | FAZA-03 o'sish-gate | sozlama-struktura bor, qiymat yo'q |
| 4 | **Oylik band** (razryad→oylik jadval) | FAZA-04 payroll | koeff-mexanizm bor, band yo'q |
| 5 | **ЦКП norma + deadline** (16 yoki 3 soat?) | FAZA-05 achievement% | norma NULL→0; deadline-raqam kutilmoqda |
| 6 | **Kurs↔karta moslik** | FAZA-07 darslik | bind-struktura bor, moslik-ro'yxat yo'q |
| 7 | **7-departament ro'yxati + kanonik root** | FAZA-08 daraxt-merge | 14 root mavjud → merge qaysi root'ga? |
| 8 | **workflow_rules mazmuni** (gorizontal oqim) | bo'limlararo workflow | jadval bor, qoidalar yo'q |

---

## 5. KEYINGI TAVSIYA

1. **Egasi-DATA bering** (3-bo'lim, 8 element) → har biri uchun mexanizm tayyor, faqat qiymat kiritiladi → modul "tiriladi".
2. **AI-kalit (OpenAI/Gemini)** → FAZA-10 grading/portret pipeline'ni to'liq yoqadi.
3. **Login-gate yoqish:** egasi tayyor bo'lganda `CARD_LOGIN_GATE_ENABLED=true` (hozir OFF=buzmaslik); avval barcha faol xodimga aktiv-karta biriktirilganini tekshir.
4. **Kattaroq build-element** (egasi xohlasa, alohida faza): Excel ommaviy karta-import + field-level audit-diff + AI-grading-pipeline.
5. **7-departament merge** = egasi root tanlasin (14→7), keyin daraxt-konsolidatsiya (additive, regress-safe).

---

*Avtonom ijro: FAZA-00..11. Commit oralig'i `e620792c..6b9b69b8` (28 commit). Fabrikatsiya yo'q (Q-40); ishlab-turgan kod tegilmadi (Q-46); regress-safe (Q-39).*
