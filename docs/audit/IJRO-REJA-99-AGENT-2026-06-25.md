# EUROPRINT ERP — 99-AGENT IJRO REJASI (VIZYONGA YETKAZISH)

> Sana: 2026-06-25 · Manba: [VIZYON-MASTER-REJA-2026-06-25.md](VIZYON-MASTER-REJA-2026-06-25.md) (99-agent tahlil, 45% moslik)
> Bu — IJRO (qurish) rejasi. Tahlil EMAS. Har agent = 1 fayl-izolyatsiyali vazifa, ijro paytida ≥1000 qatorli direktiva (Q-47).

---

## EGASI QARORLARI (qulflangan — 2026-06-25 savol-javob)

| # | Qaror | Tanlov |
|---|-------|--------|
| Q1 | Strategiya | **Vertikal ip** — avval BITTA to'liq zanjir uchma-uch jonli, keyin ko'paytirish |
| Q2 | Bo'linish | **Fayl-izolyatsiya** — har agent 1 fayl, ≥1000 qatorli direktiva, parallel konfliktsiz |
| Q3 | Boshlash | **FAZA 1 muhandislik** — men karta-yadroni quraman, siz data tayyorlaysiz |
| Q4 | Model | **To'liq karta-markaz** — login/oylik/rol/ЦКП/darslik hammasi kartadan; card_id NULL → login YO'Q (admin/super_admin/director istisno) |
| Q5 | Oylik formula | **baza × razryad-koeff × ЦКП-bajarish% × stake-ulush** |
| Q6 | ЦКП gate | **Qattiq 0** — deadline o'tib hisobot berilmasa, o'sha kun oyligi yo'q |
| Q7 | Ko'p-karta | **Login/RBAC = birlamchi (is_primary) karta; oylik = barcha faol kartalar ulush yig'indisi** |
| Q8 | Birinchi ip | **'TEST-' belgili karta** (soxta emas, ochiq namuna) — keyin egasi real data bilan almashtiradi |

---

## VERTIKAL IP (isbotlanadigan yagona zanjir)

```
TEST-karta yaratish
   → login (card-gate: card_id bor → kiradi)
   → RBAC (birlamchi karta rbac_tier'idan)
   → oylik (baza × razryad-koeff × ЦКП% × stake)
   → ЦКП kunlik fakt + gate (deadline o'tsa kun = 0)
   → 1 buyurtma: SD → PP → MES → QC → WMS → FIN(GL)
   → domain_events atomik yozildi (oltin-ip uzilmaydi)
```
Bu zanjir **1 marta jonli ishlaganda** — vizyon-yadro isbotlangan bo'ladi. Keyin shu shablon barcha karta/modulларга ko'paytiriladi.

---

## TO'LQIN 1 — VERTIKAL IP (TEST-karta uchma-uch) · 22 agent

> Eng muhim to'lqin. Ketma-ket bog'liq (A1→A22). Har biri: tsc GREEN + rollback-tx DB-proof + commit.

| # | Fayl / joy | Vazifa | Bog'liq |
|---|-----------|--------|---------|
| A1 | `lib/db/src/schema/users.ts` | `card_id` ustun qo'shish (birlamchi karta to'g'ridan link) | — |
| A2 | `apps/api/.../invariants/migrations-drift.ts` | `users.card_id` ADD + index + backfill (employee_cards is_primary'dan) (APPROVED) | A1 |
| A3 | `auth/.../drizzle-auth.repo.ts` | `resolveCardGate`: birlamchi karta `users.card_id`'dan (fallback employee_cards) — cardId/rbacTier/razryad qaytar | A2 |
| A4 | `auth/.../login.service.ts` | Card-gate majburiy: card_id NULL → login YO'Q; admin/super_admin/director bypass; JWT karta-claim | A3 |
| A5 | `common/guards/roles.guard.ts` | RBAC birlamchi karta `rbac_tier`'dan (position_id emas) | A4 |
| A6 | `common/guards/permission.guard.ts` | Modul-ruxsat kartadan (eski position_permissions o'rniga karta-asos) | A5 |
| A7 | `hr/payroll/payroll.service.ts` | Oylik = baza × razryad-koeff × ЦКП% × stake (formula, business.constants) | A3 |
| A8 | `hr/.../drizzle-hr.repo.ts` | Razryad-koeff + salary-band kartadan o'qish (kengaytirish) | A7 |
| A9 | `org-structure/razryad-history.service.ts` | Razryad EXECUTION yo'lini tasdiqlash (2-imzo + 3-oy + threshold) | — |
| A10 | `org-structure/ckp-fact.service.ts` | ЦКП kunlik fakt + deadline-belgisi (gate uchun) | — |
| A11 | `hr/payroll/ckp-gate.*` (yangi) | ЦКП-gate: kun bo'yicha ckp_fact yo'q/deadline o'tgan → o'sha kun oyligi 0 | A7,A10 |
| A12 | `_audit/seed-test-karta.cjs` (yangi) | 'TEST-' karta: org_departments+employee+employee_cards+razryad+salary+ЦКП-norma (ochiq belgilangan) | A2 |
| A13 | `sd/.../*sales-order*.ts` | 1 TEST buyurtma yaratish + `sd.order.created` event emit | A12 |
| A14 | `shared/events/outbox.*` | `domain_events`ga ATOMIK yozish (outbox) + relay processor (oltin-ip yadrosi) | — |
| A15 | `pp/.../sales-order-ready-planning.listener.ts` | SD→PP: buyurtma → production_order (real, DB-proof) | A13,A14 |
| A16 | `mes/.../pp-released-mes.listener.ts` | PP→MES: production_order → session | A15 |
| A17 | `qc/.../mes-completed.listener.ts` | MES→QC: session → qc_inspection | A16 |
| A18 | `wms/.../qc-passed.listener.ts` | QC→WMS: pass → warehouse_stock | A17 |
| A19 | `finance/.../delivery-completed.listener.ts` | WMS→FIN: qabul → GL entry (atomik, tasdiqlash) | A18 |
| A20 | `_audit/bproof-golden-thread.cjs` (yangi) | Uchma-uch JONLI isbot: 1 TEST buyurtma butun zanjirdan o'tdi + domain_events yozildi | A13–A19 |
| A21 | `artifacts/.../EmployeeProfile`/login FE | Login → karta-gate + oylik breakdown (baza/razryad/ЦКП/stake) ko'rsatish | A4,A7 |
| A22 | `artifacts/.../OrgNodeDetail` FE | TEST-karta to'liq jonli: razryad/oylik/ЦКП/stake/holat | A12 |

**To'lqin 1 qabul mezoni:** 1 TEST-xodim login qiladi → oyligi formula bilan ko'rinadi → 1 buyurtma SD→...→GL o'tadi → `domain_events` to'ladi. JONLI DB-proof bilan. **Shu — vizyon-yadro isboti.**

---

## TO'LQIN 2 — KARTA-YADRO KENGAYTIRISH · 20 agent

> To'lqin 1 shabloni barcha karta-mexanizmiga. Parallel (fayl-izolyatsiya, 5 tadan).

| # | Joy | Vazifa |
|---|-----|--------|
| A23 | `org-structure/org-mutations.repo.ts` | 1-karta=1-seat unique guard (DB + app) |
| A24 | `org-structure/card.repository.ts` | Ko'p-karta stake-cap (≤1.0) + owner-override mustahkamlash |
| A25 | `_audit/employee-cards-backfill.*` | employee_cards biriktirish mexanizmi (egasi data bergach to'ldiriladi) |
| A26 | `artifacts/.../EmployeesTab.tsx` | Ko'p-karta + ulush (stake) UI to'liq |
| A27 | `artifacts/.../RazryadTab.tsx` | Razryad o'sish 2-imzo so'rov UI + tarix |
| A28 | `org-structure/razryad.controller.ts` | Razryad sozlama (threshold/min_months) endpoint |
| A29 | `auth/.../login.service.ts` | Login-gate yoqish toggle + 401 surge himoyasi (karta yo'q xodim) |
| A30 | `common/guards/*` | Karta-RBAC barcha controllerда izchil (audit + tuzatish) |
| A31 | `hr/.../employee-profile` | Profil karta-link (users.card_id) ko'rsatish/tahrirlash |
| A32 | `org-structure/*lifecycle*` | Karta 5-holat (active/vacant/io/frozen/archived) UI + o'tish |
| A33–A42 | org/hr/auth FE+BE | Qolgan karta-yadro fayllari (har biri 1 fayl): card CRUD, head_user_id UI, otdeleniye, daraxt-merge tayyorlash, manager-zanjir, login audit, JWT claim test, payroll proration, stake history, card-fit ko'rinishi |

---

## TO'LQIN 3 — GOLDEN-THREAD KENGAYTIRISH · 24 agent

> To'lqin 1 oltin-ipini barcha modulда real qilish (har modul 3-4 fayl).

| # | Modul | Vazifa (fayl-izolyatsiya) |
|---|-------|---------------------------|
| A43–A46 | **SD** | 12 orphan buyurtma→PP ulash; kotirovka versiyalash; SD-customer kanoniklik; SD event emit |
| A47–A50 | **PP** | MRP DB-persist; 9-status; PP→MES release; AI-planning skeleti |
| A51–A54 | **MES** | 3-bosqich session; OEE/telemetriya; xodim↔karta; ikki session-jadval birlashtirish |
| A55–A58 | **QC** | Sort/grade narx-koeff; karta-bog'lanish; MES→QC auto; defekt-katalog |
| A59–A62 | **WMS** | POS taksonomiya; warehouse_stock↔transactions sync; QC→WMS; POS Monitor |
| A63–A66 | **CRM + FIN** | Deal→sales_order avto; voronka bosqich; POS→GL; cashier_movements |

---

## TO'LQIN 4 — ЦКП + GATE + AI + LMS · 16 agent

| # | Joy | Vazifa |
|---|-----|--------|
| A67–A70 | **ЦКП** | MES/IoT→ЦКП feed listener; kunlik agregat; oylik-gate ulash; ЦКП UI |
| A71–A74 | **LMS** | `courses.card_id`; avto-enroll listener; oylik-gate (darslik tugamasa); LMS UI |
| A75–A78 | **AI** | Kunlik AI-chatbot (mashinasiz xodim hisoboti); AI per-karta fit; AI-router; Aisha tool-loop |
| A79–A82 | **IoT** | Operator login (karta-rol); 3-sensor feed; predictive; IoT planshet UI |

---

## TO'LQIN 5 — YETUKLASHTIRISH · 17 agent

| # | Soha | Vazifa |
|---|------|--------|
| A83–A86 | **Moliya** | Kassir UI to'g'rilash; cashier_movements; GL-stock kanoniklik; trial-balance |
| A87–A89 | **Master-data** | unit_of_measures seed; material kanoniklik; soft-delete audit ustun |
| A90–A93 | **Xavfsizlik** | tenant_id rollout (SD/PP/MM/WMS/FIN) — har modul 1 agent; tenant-filter guard |
| A94–A96 | **Frontend** | EP-token xom-hex tozalash; EPPageHeader izchillik; loading/error/empty holat |
| A97–A99 | **Hisobot** | Director 5-ko'rsatkich holat-formula; rpt_ real feed; dashboard real-data |

---

## IJRO METODI (har agent)

1. **Fayl-izolyatsiya (Q-31):** har agent FAQAT o'z faylida; bir faylga 2 ish → ketma-ket; agent commit qilmaydi — bosh agent tekshirib commit qiladi.
2. **Direktiva ≥1000 qator (Q-47):** ijro paytida yoziladi — fayl:satr, oldin/keyin kod, standart, qabul-mezoni, edge, self-verify.
3. **Fabrikatsiya TAQIQ (Q-40):** real data/AI-kalit yo'q → STRUKTURA+gate quriladi, SOXTA qiymat yozilmaydi, egasi-DATA ro'yxatiga qo'shiladi. (TEST-karta ochiq belgilanadi.)
4. **JONLI isbot (Q-29):** tsc GREEN (o'z fayl) + rollback-tx DB-proof (kirit→oqdi→ko'rindi). Struktura-only YETARLI EMAS.
5. **Buzmaslik (Q-39/Q-46):** ishlab turgan kod o'chirilmaydi; faqat buzuq/soxta to'liq tuzatiladi yoki olib tashlanadi.
6. **Tartib:** To'lqin 1 ketma-ket (bog'liq). To'lqin 2-5 har birida 5 tadan parallel (rate-limit).

## EGASI-DATA (parallel tayyorlang — muhandislik kuta olmaydi)

To'lqin 1 TEST bilan ishlaydi; REAL ishga tushishi uchun:
1. **1-real karta** (To'lqin 1 almashtirish): lavozim + xodim + razryad + bazaviy oylik.
2. **Bitta daraxt:** 19 root → 1 Egasi-ildiz + 7 otdeleniye; `head_user_id` (126 NULL).
3. **Razryad qiymatlari:** salary band, exam_pass_threshold, min_months (≥3).
4. **ЦКП:** norma + deadline (16 ╳ 3 soat ziddiyatini hal qil); kurs↔karta.
5. **RBAC tier** (har karta) + **AI-kalit** (OpenAI/Gemini).

---

## KEYINGI QADAM

Reja tasdiqlangach → **To'lqin 1, A1 dan boshlanadi** (`users.card_id` → card-gate → oylik → oltin-ip → TEST uchma-uch isbot). Har agent ijro paytida to'liq direktiva oladi. To'lqin 1 jonli ishlaганда — vizyon-yadro isbotlangan, qolgani shablon.
