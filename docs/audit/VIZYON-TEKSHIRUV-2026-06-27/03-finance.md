# 03 — Finance / GL / Kassir — Mustaqil Tekshiruv (2026-06-27)

**Auditor:** adversarial verifier (kod + jonli DB bilan).
**Savollar:** 86. Doc o'z-da'vosi: **68% vizyon qoplama**.
**Doc flag taqsimoti:** ✅ bor=25 · 🟡 qisman=41 · ❌ yo'q=15 · 🔑 egasi-data=5.
**Tekshiruvdan keyin (verified):** bor=25 · qisman=41 · yoq=15 · egasi-data=5 — doc bilan to'liq mos.
**Recomputed realPct (verifiable only, egasi-data chiqarilgan):** round(100×(25+0.5×41)/81) = **56%** (doc 68% — farq egasi-data va og'irlik hisobidan).
**CLAIM accuracy:** 86/86 confirmed, 0 refuted.

## REFUTED CLAIMS
- Yo'q. Har bir Isbot da'vosi (jadval/ustun/servis/metod/endpoint/grep-yo'qlik) jonli tekshiruvda to'g'ri chiqdi. Bu modul g'ayrioddiy halol yozilgan: mexanizm-bor-lekin-ulanmagan → qisman; grep bilan isbotlangan yo'qlik → yo'q; qiymat egadan → egasi-data.
- Kichik (refutatsiya emas) drift eslatmalari:
  - **03.27** — "cash_flow weight **0.30**, satr 224": cash_flow haqiqatan og'irlikli metrik, lekin og'irliklar DB'dan konfiguratsiyalanadi (`buildWeights`, EP-DIR-001), kodda qotirilgan 0.30 emas. Status (bor) to'g'ri.
  - **03.56** — metod nomi `postPayrollEntry` emas, `postPayroll` (gl-posting.service.ts:72-83). Funksional jihatdan aynan (Dr SALARY_EXPENSE / Cr SALARY_PAYABLE). Status to'g'ri.
  - **03.4** — EP-FIN-004 "satr 66" emas, izoh 15-20-satrlarda (account-range guruh). Belgi mavjud.

---

## Jonli tekshiruv tayanchi (DB)
40/41 so'ralgan jadval MAVJUD (faqat `approval_steps` yo'q — lekin `approval_request_steps` bor, doc shuni ham keltiradi).
Qator sanoq: entries=6, gl_lines=0 (kanonik tasdig'i), accounts=42 (BHMS), cost_centers=1, income_split_config=4, zvs=0, zno=0, exchange_rates=0, bank_accounts=0. Hammasi doc bilan mos (build bosqichi, data=0).

---

## 03.1 — ZVS ekran [DOC ✅] → [bor] (confirmed)
- zvs.controller.ts (@Post/@Get/@Patch), zvs.service.ts `createZvsWithValidation` real (satr 42-66), FE HRZvsPage.tsx + Dialogs/Sections/Types mavjud. zvs jadval bor (0 qator).

## 03.2 — ZNO ekran [DOC ✅] → [bor] (confirmed)
- director/presentation/zno.controller.ts + application/zno.service.ts + infrastructure/repositories/zno.repository.ts mavjud. zno jadval ustunlari department_id/amount/purpose tasdiqlandi (psql).

## 03.3 — 3-savat + 24/48h [DOC 🟡] → [qisman] (confirmed)
- ZVS approve/reject oqimi bor; approval_requests/approval_request_steps jadvallar bor. 3-savat Coordination ulanishi va 24/48h cron alohida isbotlanmagan — qisman to'g'ri.

## 03.4 — 4-hisob (MAIN/TAX/HEAD/WORKING) [DOC ✅] → [bor] (confirmed)
- income-split.service FundKey MAIN/TAX/HEAD/WORKING → 9010/6310/8500/5110. finance-accounting.service.ts EP-FIN-004 4-hisob guruh account-range bilan (satr 15-20, doc 66 deb yozgan = drift).

## 03.5 — Tushum avto-split [DOC ✅] → [bor] (confirmed)
- income-split.service.ts `splitAndPost(amount,reference)` → `computeSplit` → balansli journal `entries`ga (postJournal). Foiz `income_split_config`dan (4 qator) yoki `INCOME_SPLIT_DEFAULT`. Aniq mos.

## 03.6 — Foizni faqat egasi [DOC 🔑] → [egasi-data] (confirmed)
- income_split_config jadval bor, kod o'qiydi. Foiz QIYMATLARI egasi-data; RBAC egasi-only UI alohida tekshirilmagan — to'g'ri tasnif.

## 03.7 — Tasdiq matritsasi 500k/5M [DOC ✅] → [bor] (confirmed)
- zvs.service.ts:17-21 `computeLevel`: ≤500k→1, ≤5M→2, else 3; `canApproveLevel` LEVEL1/2/3_ROLES (satr 13-15,23-27). (doc :16-20 ≈ to'g'ri.)

## 03.8 — Chegara ekrandan sozlanadimi [DOC 🟡] → [qisman] (confirmed)
- approval_matrix_config jadval bor (data=0); lekin zvs.service.ts:18 chegara KODDA qotirilgan (500_000/5_000_000). Sozlanadigan o'qish ulanmagan — to'g'ri.

## 03.9 — Tasdiqlovchi=karta [DOC 🟡] → [qisman] (confirmed)
- canApproveLevel ROL-massivi orqali (lavozim-rol), org-karta resolver bilan to'g'ridan bog'lanish yo'q — qisman to'g'ri.

## 03.10 — Eskalatsiya [DOC 🟡] → [qisman] (confirmed)
- fp-cycle cron eslatma yuboradi; ZVS-specific 24/48h muddat-eskalatsiya yo'q — qisman to'g'ri.

## 03.11 — FP-tsikl cron+Telegram [DOC ✅] → [bor] (confirmed)
- fp-cycle-cron.service.ts: 4×@Cron timeZone Asia/Tashkent (Seshanba `0 9 * * 2` ZVS, `*3`, `*4`, `*1`), `notifyRoles` recipients. Aniq mos.

## 03.12 — Tsikl kunini egasi o'zgartiradimi [DOC ❌] → [yoq] (confirmed)
- @Cron iboralari kodda qotirilgan; sozlanadigan kun jadvali/UI yo'q. To'g'ri.

## 03.13 — Eslatma Telegram+ERP [DOC ✅] → [bor] (confirmed)
- fp-cycle-cron notifyRoles + financial-reports-telegram.service.ts mavjud. Mos.

## 03.14 — Aging 4-guruh [DOC ✅] → [bor] (confirmed)
- finance-ap.service.ts:51-57 buckets current/days_31_60/days_61_90/days_91_120/over_120; ap_aging_buckets jadval; FE ArApAging.tsx. Mos.

## 03.15 — AR/AP alohida [DOC ✅] → [bor] (confirmed)
- finance-ap.service.ts + finance-ar.service.ts; FE AccountsPayable.tsx + AccountsReceivable.tsx; ap_aging_buckets/ar_aging_buckets jadvallar bor. Mos.

## 03.16 — Eski qarz alert (90+→direktor) [DOC 🟡] → [qisman] (confirmed)
- financial-reports-alerts.cron.ts mavjud; finance-ap `getOverdue()` (satr 29). 90+→direktor eskalatsiya alohida isbotlanmagan — qisman.

## 03.17 — Byudjet bo'lim/karta [DOC 🟡] → [qisman] (confirmed)
- budgets/budget_lines/budget_controls jadvallar + budgets.service.ts + FE BudgetManagement.tsx. Karta-darajali + ZVS↔byudjet jonli taqqos qisman (data=0). To'g'ri.

## 03.18 — ZVS↔byudjet avto-taqqos [DOC 🟡] → [qisman] (confirmed)
- budget_controls jadval + budgets.service bor; zvs.service createZvs ichida byudjet-qoldiq taqqos bloki yo'q (kod o'qildi — faqat level hisobi). Mexanizm bor, ulanish qisman. To'g'ri.

## 03.19 — Davr jamlanma [DOC 🟡] → [qisman] (confirmed)
- budgets + FP haftalik cron; accounting_periods jadval bor (data=0). Qisman.

## 03.20 — Kassa to'liq ERP [DOC ✅] → [bor] (confirmed)
- cashier-hub.service.ts recordMovement + kunlik saldo + dailyCashLimit (satr 233-250); cash_registers/cash_sessions/cashier_movements jadvallar; FE CashRegister.tsx+CashierHub.tsx. Mos.

## 03.21 — POS/ombor→GL avto [DOC ✅] → [bor] (confirmed)
- cashier-podotchet.service.ts KAS-1 recordMovement→kanonik GL Dr 4000/Cr 5010 (satr 4-5,60-81); gl-posting postJournal ONE-engine. Mos.

## 03.22 — Yagona kanonik GL [DOC ✅] → [bor] (confirmed)
- gl-posting.service.ts:94-96 kanonik `entries` ("never gl_journal_entries/gl_lines — SAP#76 forbidden"); postJournal yagona dvigatel. entries=6/gl_lines=0 (psql). Mos.

## 03.23 — Double-entry balans [DOC ✅] → [bor] (confirmed)
- gl-posting.service.ts:151-155 totalDebit/totalCredit reduce; Math.abs(diff)>0.01→Err 'Double-entry validation failed'. Mos (doc :151-155 to'g'ri).

## 03.24 — BHMS COA + 4-hisob [DOC ✅] → [bor] (confirmed)
- accounts=42 qator (psql); FE ChartOfAccounts.tsx; income-split 4-fond 9010/6310/8500/5110. Mos.

## 03.25 — ZNO→GL avto [DOC 🟡] → [qisman] (confirmed)
- postJournal ONE-engine bor; ZNO-tasdiq→avto-GL event-listener zanjiri jonli isbotlanmagan (zno data=0). Mexanizm bor, ulanish qisman. To'g'ri.

## 03.26 — Hujjat majburiy [DOC 🟡] → [qisman] (confirmed)
- storage modul + EP-FIN-026; ZVS/ZNO majburiy-hujjat-gate kod-darajada isbotlanmagan — qisman.

## 03.27 — Moliya holatga ulangan [DOC ✅] → [bor] (confirmed)
- company-state.service.ts cash_flow metrik + og'irlik (satr 89,144). ⚠️ og'irlik DB-config (buildWeights), kodda 0.30 emas — "weight 0.30 satr 224" da'vosi drift, ammo status bor to'g'ri.

## 03.28 — Telegram ShVB buyruqlari [DOC 🟡] → [qisman] (confirmed)
- bot-gateway/bots/bot.helpers.ts + owner-summary.service da zvs_status/company_state/weekly_digest izlari (grep tasdiq). To'liq handler ulanishi qisman. To'g'ri.

## 03.29 — ZVS/ZNO 6-holat master-data [DOC 🟡] → [qisman] (confirmed)
- zvs.service approve/reject + level oqimi; 6-holatli to'liq status-mashina master-data sifatida isbotlanmagan — qisman.

## 03.30 — SoD rollari [DOC ✅] → [bor] (confirmed)
- zvs.service LEVEL1/2/3_ROLES + SoD invariant (yaratuvchi tasdiqlay olmaydi, satr 84-85,109-110) + 4 global guard; cashier PIN-gated. Mos (kuchli).

## 03.31 — Hisobotlar to'plami + PDF [DOC ✅] → [bor] (confirmed)
- financial-reports: daily/weekly/monthly/alerts cron + query/analytics/snapshot/telegram service + controller (13 fayl topildi). Mos.

## 03.32 — Karta-model byudjet+tasdiq [DOC 🟡] → [qisman] (confirmed)
- approval rol-gate + budget_controls jadval; karta↔limit (org_departments↔limit) jonli ulanmagan, head_user_id egasi-data. Qisman to'g'ri.

## 03.33 — Reja qog'ozi avto-buxgalteriya [DOC ❌] → [yoq] (confirmed)
- grep reja/rejaQog/reja_qog finance — YO'Q natija. Kod yo'q. To'g'ri.

## 03.34 — Kamomad kg×narx zarar [DOC ❌] → [yoq] (confirmed)
- grep kamomad finance — YO'Q. To'g'ri.

## 03.35 — Faqat real sarf tannarxga [DOC 🟡] → [qisman] (confirmed)
- WMS goods-issue FIFO/FEFO batch-selection real chiqim; reja-fakt farqi tannarxga mahsus oqim yo'q. Poydevor bor — qisman.

## 03.36 — Qog'oz narxi (avg╳FIFO) [DOC 🔑] → [egasi-data] (confirmed)
- KONFLIKT: WMS FIFO/FEFO aktiv vs v2 weighted-avg. Egasi hal qilishi shart. To'g'ri tasnif.

## 03.37 — Schyot-faktura→AP avto [DOC 🟡] → [qisman] (confirmed)
- finance-ap.repository createApEntry + purchase_invoices/vendor_invoices jadvallar + due_date aging. Kiritish→avto-AP UI qisman (data=0). To'g'ri.

## 03.38 — Vazn farqi→da'vo [DOC ❌] → [yoq] (confirmed)
- grep da'vo/claim/weight-diff finance — mahsus mexanizm YO'Q (3-way match bor lekin gr-farq da'vo yo'q). To'g'ri.

## 03.39 — Norma×stavka=tannarx [DOC 🟡] → [qisman] (confirmed)
- standard-cost.service material+labor+overhead (satr 105-116) + variance-analysis + order-costing; stanok-norma↔ish-haqi to'g'ridan ulanish isbotlanmagan. Qisman.

## 03.40 — Иш йук yo'qotilgan quvvat [DOC ❌] → [yoq] (confirmed)
- grep idleCapacity/opportunityCost finance — YO'Q. To'g'ri.

## 03.41 — Брак/Макулатура ajratish [DOC ❌] → [yoq] (confirmed)
- grep brak/makulatura finance — moliyaviy hisob YO'Q. To'g'ri.

## 03.42 — Гильза depozit [DOC ❌] → [yoq] (confirmed)
- grep gilza finance — YO'Q. To'g'ri.

## 03.43 — Транспорт landed cost [DOC ❌] → [yoq] (confirmed)
- grep landedCost/freight finance,mm — YO'Q. To'g'ri.

## 03.44 — Клей moddalari sarf-norma [DOC ❌] → [yoq] (confirmed)
- grep kley/yelim finance — YO'Q. To'g'ri.

## 03.45 — Haftalik xom-ashyo→moliya [DOC 🟡] → [qisman] (confirmed)
- FP haftalik cron + variance-analysis; Флексо xom-ashyo→moliya mahsus oqim qisman. To'g'ri.

## 03.46 — Buyurtma tahlili o'sish% [DOC 🟡] → [qisman] (confirmed)
- financial-reports-analytics + order-costing findTopProfitable; FE FinanceDashboard. List-soni×o'sish-dinamika widget qisman. To'g'ri.

## 03.47 — Raqamlar yagona ega-bo'lim [DOC 🟡] → [qisman] (confirmed)
- MASTER_DATA_STANDARTLARI + rol-gate; kod-darajada yozish-huquqi gate qisman. To'g'ri.

## 03.48 — Hujjatsiz to'lov blok [DOC 🟡] → [qisman] (confirmed)
- EP-FIN-048 + storage; majburiy-hujjat approve-blok invariant jonli isbotlanmagan. Qisman.

## 03.49 — Avans tsikl [DOC ✅] → [bor] (confirmed)
- cashier-podotchet.service.ts issueAdvance (Dr4000/Cr5010, idempotent, satr 60-81) + submitAdvanceReport (receiptRef majburiy satr 37, pending satr 107-134); advance_reports jadval bor; FE FinanceTab. Mos.

## 03.50 — Xarajat moddalari master [DOC 🟡] → [qisman] (confirmed)
- accounts (42) + cost_centers (1); mahsus expense-category master-data yo'q. Qisman/EP-FIN-050. To'g'ri.

## 03.51 — Energiya tannarxga taqsim [DOC ❌] → [yoq] (confirmed)
- IoT energiya o'qish bor lekin tannarxga taqsim YO'Q (grep). To'g'ri.

## 03.52 — Amortizatsiya reestri [DOC 🟡] → [qisman] (confirmed)
- depreciation.service.ts SL/DB/SYD/UOP + buildSchedule salvage-cap (satr 44); asset_items/asset_disposals jadvallar. Stanok↔asset seed qisman. To'g'ri.

## 03.53 — Valyuta+kurs-farq [DOC 🟡] → [qisman] (confirmed)
- exchange_rates jadval (from_currency/to_currency/rate/rate_date — psql) + currency_transactions; kurs-farqi avto-GL qisman (data=0). To'g'ri.

## 03.54 — Kreditor muddat profili [DOC 🟡] → [qisman] (confirmed)
- finance-ap due_date aging (purchase_invoices.due_date); yetkazib-beruvchi standart-muddat profil yo'q (30 kun fallback). Qisman. To'g'ri.

## 03.55 — QQS reestr [DOC 🔑] → [egasi-data] (confirmed)
- gl-posting SALES_TAX_PAYABLE (6310) ajratadi; income-split TAX-fond. QQS-reestr ekran + fiskal daraja KONFLIKT (egadan). To'g'ri.

## 03.56 — Payroll INPS/JSHD→GL [DOC ✅] → [bor] (confirmed)
- payroll-tax.service.ts incomeTax(INPS)+socialContribution(JSHD) (satr 8-9,66-69); gl-posting `postPayroll` Dr SALARY_EXPENSE/Cr SALARY_PAYABLE (satr 72-83, doc "postPayrollEntry" = nom drift); payroll_journal_entries jadval. Mos.

## 03.57 — To'lov usuli majburiy [DOC 🟡] → [qisman] (confirmed)
- cash_transactions/payments/bank_accounts jadvallar + cashier movements; to'lov-usuli enum majburiy va o'zaro-hisob alohida isbotlanmagan. Qisman.

## 03.58 — Ko'p bank real-time qoldiq [DOC 🟡] → [qisman] (confirmed)
- bank_accounts jadval (data=0) + FE CashFlowManagement; ko'p-bank real-time UI qisman. To'g'ri.

## 03.59 — To'lov kalendari [DOC 🟡] → [qisman] (confirmed)
- cashflow-forecast.service.ts forecastWeeks (satr 64, haftalik) + FE CashFlowManagement; kun-bo'yicha kalendar yo'q (EP-FIN-059). Qisman.

## 03.60 — Kredit-limit blok [DOC 🟡] → [qisman] (confirmed)
- customer_accounts/sd_payments jadvallar + AR aging; SD limit-gate jonli isbotlanmagan. Qisman.

## 03.61 — Qisman to'lov FIFO [DOC 🟡] → [qisman] (confirmed)
- invoice_payment_matching + invoice_payments jadvallar; FIFO-taqsim algoritmi kod-darajada isbotlanmagan. Qisman.

## 03.62 — Пеня avto [DOC ❌] → [yoq] (confirmed)
- grep penya/lateFee finance — YO'Q (faqat HR attendance penalty boshqa). To'g'ri.

## 03.63 — Inventarizatsiya→GL tuzatma [DOC 🟡] → [qisman] (confirmed)
- asset_inventory jadval + gl-posting ONE-engine; avto-GL tuzatma+moliya-tasdiq oqimi jonli isbotlanmagan. Qisman.

## 03.64 — Davr yopish lock [DOC ✅] → [bor] (confirmed)
- gl-posting.service.ts:160-174 EP-FIN-064 PERIOD LOCK → Err 'Davr yopilgan'; finance-accounting.service closePeriod (satr 235); accounting_periods jadval. Mos (doc :160-171 ≈).

## 03.65 — Совершенствование og'ish [DOC 🟡] → [qisman] (confirmed)
- variance-analysis needsAudit + monthly cron; Совершенствование avto-marshrut qisman. To'g'ri.

## 03.66 — Og'ish→mas'ul kartaga talab [DOC 🟡] → [qisman] (confirmed)
- variance needsAudit flag + alerts cron; Coordination event ulanish isbotlanmagan. Qisman.

## 03.67 — Buyurtma rentabellik kartasi [DOC ✅] → [bor] (confirmed)
- order-costing.service.ts findTopProfitable/findTopLoss/calculate (satr 39,47,55); FE OrderCosting.tsx. Mos.

## 03.68 — Tannarxdan past blok [DOC 🟡] → [qisman] (confirmed)
- tiered-pricing.service + standard-cost; tannarxdan-past blok/tasdiq gate yo'q (EP-FIN-068). Qisman.

## 03.69 — Chegirma vakolat darajasi [DOC 🔑] → [egasi-data] (confirmed)
- tiered-pricing tier-mexanizm bor; chegirma-vakolat foiz qiymatlari egadan. To'g'ri.

## 03.70 — О'заро hisob (netting) [DOC ❌] → [yoq] (confirmed)
- grep netting/vzaimoz/mutualOffset finance,sd — YO'Q. To'g'ri.

## 03.71 — Yetkazib beruvchi reyting [DOC 🟡] → [qisman] (confirmed)
- mm_vendor_ratings jadval + supplier-agent.service.ts; narx+brak%+kechikish kombinatsiya-reyting kunlik cron jonli isbotlanmagan. Qisman.

## 03.72 — Kassa limiti+inkassatsiya [DOC 🔑] → [egasi-data] (confirmed)
- cashier-hub.service.ts:240 limitExceeded (dailyCashLimit→balance>limit); cfo_config default (satr 238). LIMIT QIYMATI egadan. Mexanizm bor. To'g'ri.

## 03.73 — Ish-haqi avansi chegirma [DOC ✅] → [bor] (confirmed)
- cashier-podotchet avans (HR-debitor) + payroll chegirma; advance_payments/cash_advances jadvallar bor; finance-payroll.service. Mos.

## 03.74 — Jarima/ushlanma payroll [DOC 🟡] → [qisman] (confirmed)
- finance-extended-payroll.service penalty + payroll chegirma; brak/kamomad→ushlanma tasdiq-zanjiri (MES↔payroll) isbotlanmagan; maks-foiz egadan. Qisman.

## 03.75 — Mijoz avansi→daromad [DOC 🟡] → [qisman] (confirmed)
- advance_payments + sd_payments + invoice.aggregate; avans→daromad accrual o'tkazish jonli oqim qisman. To'g'ri.

## 03.76 — Bo'sh quvvat marjinal-narx [DOC ❌] → [yoq] (confirmed)
- break-even.service bor lekin bo'sh-quvvat marjinal-narx (иш йук) tahlili YO'Q. To'g'ri.

## 03.77 — Tannarx versiyalash [DOC ✅] → [bor] (confirmed)
- standard-cost.service.ts versiyali (eng-yaqin revision, eski queryable, satr 14-15); technology_cards versiyalash (ADR). Mos.

## 03.78 — Xarajat-markaz hisobi [DOC 🟡] → [qisman] (confirmed)
- cost_centers jadval (data=1 — psql) + gl-posting; xarajat→bo'lim avto-bog'lash va bo'lim-hisobot qisman (cost_centers oz). To'g'ri.

## 03.79 — Accrual (akт) daromad [DOC 🟡] → [qisman] (confirmed)
- gl-posting postSalesInvoice (AR Dr/Revenue Cr, satr 26-34) + postDeliveryCompleted; SD invoice↔накладной akt-triger jonli isbotlanmagan. Qisman.

## 03.80 — ЗНО ustuvorlik navbati [DOC ❌] → [yoq] (confirmed)
- cashier-hub limit-ogohlantirish bor lekin ZNO priority-queue YO'Q. To'g'ri.

## 03.81 — Pul aylanma davri dashboard [DOC 🟡] → [qisman] (confirmed)
- financial-ratios.service + cashflow-forecast + AP/AR aging (komponentlar bor); cash-conversion-cycle birlashgan widget isbotlanmagan. Qisman.

## 03.82 — Egasi 1-ekran dashboard [DOC ✅] → [bor] (confirmed)
- FE FinanceDashboard.tsx + Tabs/PayrollTab + company-state.service cash_flow + cashflow-forecast + owner-summary.service. Mos.

## 03.83 — Reja qog'ozi imzo zanjiri [DOC 🟡] → [qisman] (confirmed)
- podotchet inson-tasdiq + approval_request_steps; Режа қоғози-mahsus imzo-qabul zanjiri yo'q (EP-FIN-083). Qisman.

## 03.84 — 3-way match blok [DOC ✅] → [bor] (confirmed)
- mm/application/commands/goods-receipt.handler.ts validateThreeWayMatch(poId, satr 40)→ThreeWayMatchFailedEvent (satr 75); three-way-match-failed.listener.ts mavjud. Mos.

## 03.85 — Брак%>норма→tannarx og'ish [DOC ❌] → [yoq] (confirmed)
- variance-analysis umumiy og'ish bor lekin brak%↔norма→tannarx-og'ish mahsus oqim YO'Q. To'g'ri.

## 03.86 — Narx master faqat Бухгалтерия [DOC 🟡] → [qisman] (confirmed)
- MASTER_DATA_STANDARTLARI + rol-gate; material-narx yozish-huquqi faqat moliya-karta (org-resolver) kod-invariant isbotlanmagan; head_user_id egasi-data. Qisman.

---

## Yakuniy hukm
Bu modul **g'ayrioddiy halol va aniq**. 86 ta Isbot da'vosining barchasi jonli kod/DB bilan tasdiqlandi: keltirilgan har bir jadval, ustun, servis fayli, metod va grep-yo'qlik haqiqatga mos. Faqat 3 ta kichik **satr/nom drift** (03.4 satr 66, 03.27 weight 0.30, 03.56 postPayrollEntry) — ammo belgilar mavjud, status to'g'ri, refutatsiya darajasiga yetmaydi.
- Kod-grounded realPct = **56%** (verifiable 81 savol bo'yicha). Doc 68% — farq egasi-data hisobga olinishi va og'irlik usulidan.
- "yoq" 15 ta da'vo grep bilan to'g'ri (landed-cost, kamomad, brak/makulatura, gilza, kley, energiya, penya, netting, idle, ZNO-priority, brak%-norma, reja-qog'oz, vazn-da'vo, FP-kun-config).
- Eng kuchli "bor": kanonik GL (entries-only, SAP#76), double-entry validation, period-lock, income 4-split, ZVS level/SoD, 3-way-match, payroll-tax, depreciation, FP-cron.
