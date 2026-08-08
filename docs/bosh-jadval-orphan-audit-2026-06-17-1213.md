# Bo'sh jadval va Orphan sxema tekshiruvi

**Sana/vaqt:** 2026-06-17, 12:13
**Tekshiruvchi:** Tahlilchi agent (faqat o'qish — DB'ga faqat SELECT, hech narsa o'zgartirilmadi)
**Baza:** `europrint` (jonli, read-only)
**Oldingi hisobot:** `docs/bosh-jadval-orphan-audit-2026-06-08-1013.md` (9 kun oldin)

---

## ⚠️ O'lchov usuli (oldingi tekshiruv bilan bir xil)

Topshiriqdagi tayyor pg-"estimate" so'rovi bu bazada **ishonchsiz** (statistika yig'ilmagan —
butun 971 jadvalni "bo'sh" deb ko'rsatdi). Shu sabab oldingi tekshiruvdagidek **aniq `COUNT(*)`**
bilan har bir jadval sanaldi (`query_to_xml` orqali bitta read-only so'rovda). Quyidagi raqamlar —
taxmin emas, **aniq**. Bu oldingi hisobot bilan bir xil usul, demak solishtirish to'g'ri.

---

## 1. HOZIRGI RAQAMLAR (aniq sanoq)

| Ko'rsatkich | Soni |
|---|---|
| **Jami jadval** (base table) | **971** |
| **Bo'sh jadval** (0 qator) | **831** |
| **To'la jadval** (data bor) | **140** |
| Drizzle-only orphaned (kodda `pgTable` bor, jonli **base table** yo'q) | **55** |
| └ shundan jonli DB'da **VIEW** sifatida mavjud (aslida yo'qolmagan) | **53** |
| └ **chinakam yo'q** (na jadval, na view) | **⭐ 2** |
| Dublikat `pgTable` (bir nom kodda 2+ marta ta'riflangan) | **11** |

> Bo'sh ulush: 831/971 = **~85.6%** jadval hali bo'sh. Tizim hali **qurilish bosqichida**.

---

## 2. ⭐ O'ZGARISH (delta) — 2026-06-08 → 2026-06-17

| Ko'rsatkich | Oldin (06-08) | Hozir (06-17) | O'zgarish |
|---|---|---|---|
| Jami jadval | 968 | 971 | **+3** 🆕 |
| Bo'sh jadval | 830 | 831 | **+1** |
| **To'la jadval** | 138 | 140 | **+2 ✅** (data ko'paydi) |
| Drizzle-only orphaned (jami) | 55 | 55 | **0** (o'zgarmadi) |
| └ chinakam yo'q | 2 | 2 | **0** (o'zgarmadi) |
| Dublikat pgTable | 11 | 11 | **0** (o'zgarmadi) |

**Qisqacha:** 9 kunda **+3 yangi jadval** qo'shildi va **+2 jadval to'ldi** (data tushdi).
Orphaned va dublikat raqamlar **butunlay o'zgarmadi** — ya'ni kod va jonli baza orasidagi
moslik **buzilmadi** (yangi drift YO'Q, bu yaxshi belgi). Mavjud data jadvallari ham ancha o'sdi
(pastdagi 3-bo'limga qarang).

---

## 3. Data o'sishi — eng faol jadvallar (oldingi hisobotda nomlangan)

Oldingi hisobotda ko'rsatilgan jadvallarning bugungi holati — tizim faol ishlatilayotganini
ko'rsatadi:

| Jadval | Oldin (06-08) | Hozir (06-17) | O'sish |
|---|---|---|---|
| daily_reports | 3 150 | **5 040** | +1 890 📈 |
| agents_audit_log | 4 794 | **6 377** | +1 583 📈 |
| audit_logs | 9 374 | **9 436** | +62 |
| position_permissions | 1 380 | 1 380 | 0 |
| org_departments | 142 | 142 | 0 |

> Kunlik hisobotlar (`daily_reports`) va agent audit jurnali (`agents_audit_log`) eng tez
> o'smoqda — demak ishchilar/agentlar tizimni har kuni ishlatyapti.

---

## 4. ✅ Yangi to'lgan jadval (oldin bo'sh, endi data bor)

Eng aniq yangi-to'lgan jadval:

| Jadval | Hozirgi qator | Izoh |
|---|---|---|
| **`notifications`** | **1 355** | Oldingi hisobotning eng katta jadvallar ro'yxatida **umuman yo'q edi** (1 355 qator bo'lsa, u holda 5-o'rinda turardi). Demak bu 9 kunda 0 dan to'ldi — **bildirishnoma tizimi ishga tushdi** ✅ |

> **Eslatma (halollik uchun):** Oldingi hisobot to'liq 138 ta to'la jadval ro'yxatini saqlamagan
> edi (faqat eng kattalarini sanagan), shuning uchun barcha yangi-to'lgan jadvallarni **bittalab**
> aniqlash mumkin emas. Net o'zgarish **+2 to'la jadval** ekani aniq. Bu kamchilikni tuzatish uchun
> bu hisobotning **oxirida hozirgi to'liq 140 jadval ro'yxati** keltirildi — keyingi tekshiruv shu
> bilan aniq solishtira oladi.

---

## 5. Drizzle-only "orphaned" — o'zgarmadi (55 → 55)

Qat'iy hisobda **55** nom kodda `pgTable` bilan ta'riflangan, lekin jonli DB'da base table yo'q.
Shundan **53 tasi VIEW** sifatida bazada bor (yo'qolmagan — memory'dagi `sd_sales_orders`=VIEW
naqshiga mos, xato emas).

### ⭐ Chinakam yo'q (na jadval, na view) — hamon faqat 2 ta (o'zgarmadi):

| Nom | Izoh |
|---|---|
| `ow_orders` | Kodda pgTable bor, jonli DB'da umuman yo'q. "Ikki buyurtma dunyosi" masalasi. |
| `pp_orders` | Kodda pgTable bor, jonli DB'da umuman yo'q. Ishlab chiqarish rejasi buyurtmalari. |

> Bu 2 ta — kod jonli DB bilan **haqiqatan kelishmaydigan** yagona joy, va **9 kunda o'zgarmadi**
> (yangi orphaned **paydo bo'lmadi** ✅). Tuzatish — egasi/bajaruvchi ishi; bu yerda faqat belgilab qo'yildi.

---

## 6. Dublikat `pgTable` — o'zgarmadi (11 → 11)

Bir nom kodda 2+ marta ta'riflangan (barrel/stub naqshi — runtime xatosi bermaydi, lekin
chalkashlik manbai). Ro'yxat oldingi hisobot bilan **bir xil**:

```
accounting_periods   attendance   courses   inventory_counts   leave_requests
lms_tests   marketing_content_posts   marketing_social_accounts   materials
salary_history   users
```

> Yangi dublikat **qo'shilmadi** (kod-drift oshmadi ✅).

---

## ⭐ XULOSA (egaga, sodda til)

**Tizim oldinga ketdi, drift oshmadi.** 9 kunda 3 ta yangi jadval qo'shildi, 2 ta jadval data bilan
to'ldi (eng muhimi — **bildirishnoma tizimi `notifications` 0 dan 1 355 qatorga to'ldi**, ishga tushdi).
Kunlik hisobotlar va agent jurnali ming-minglab qator bilan o'smoqda — tizim har kuni ishlatilyapti.
Eng yaxshisi: kod bilan baza orasidagi **moslik buzilmadi** — orphaned (55, shundan chinakam yo'q 2 ta:
`ow_orders`, `pp_orders`) va dublikat (11) raqamlari **butunlay o'zgarmadi**, ya'ni yangi
kod-drift **YO'Q**. Hali jadvallarning ~86% bo'sh — bu normal, tizim qurilmoqda.

---

## Ilova — Hozirgi to'liq 140 ta to'la jadval ro'yxati (keyingi tekshiruv uchun bazaviy)

> Keyingi audit shu ro'yxat bilan aniq solishtirib, qaysi jadval yangi to'lganini bittalab aniqlay oladi.

```
audit_logs=9436, agents_audit_log=6377, daily_reports=5040, position_permissions=1380,
notifications=1355, org_departments=142, warehouse_bins=126, org_functions=97, positions=96,
hr_onboarding_milestones=90, hr_leave_balances=90, cc_rejection_reasons=84, gamification_points=77,
kanban_time_tracks=48, accounts=42, audit_log=41, cc_workflow_steps=34, chat_messages=34,
position_feature_flags=32, users=31, weekly_plans=31, hr_onboarding_processes=30, shift_assignments=30,
absence_tracking=30, employees=30, employee_org_departments=30, employee_cards=30, discipline_records=30,
employee_ratings=29, hr_leave_requests=29, hr_v2_documents=26, warehouse_stock=25, raci_assignments=24,
hr_v2_daily_reports=24, material_cards=21, rpt_ishlab_chiqarish=21, rpt_kreditorlar=21,
rpt_ombor_qoldiq=21, inventory_policy=21, rpt_kassa_transactions=21, batch_lots=21,
agent_modules_registry=20, hr_job_descriptions=20, fine_rules=20, employee_career_profiles=19,
enps_responses=19, departments=18, questionnaire_responses=18, succession_plans=18,
hr_health_checkups=18, vendors=15, employee_referrals=15, units=15, cc_document_templates=14,
sales_orders=12, chat_members=12, badge_catalog=12, work_centers=12, warehouses=12,
hr_candidate_funnels=11, cfo_config=11, candidates=11, kanban_columns=10, violation_catalog=10,
imposition_layouts=10, warehouse_zones=9, warehouse_employees=9, warehouse_types=9, nps_responses=9,
sd_customers=9, sd_customer_contacts=8, gl_account_mappings=8, pos_movement_types=7,
company_functions=7, material_categories=7, stock_transfer_lines=7, sd_customer_interactions=7,
raci_tasks=6, inventory_counts=6, chat_rooms=6, document_workflow_routes=6, stock_transfers=5,
councils=5, crm_tasks=5, ai_interview_sessions=5, retail_pos_products=5, crm_leads=5,
material_movements=5, strategic_categories=5, leave_types=5, hr_interview_sessions=5,
kanban_co_executors=4, safety_incidents=4, currencies=4, kanban_observers=4, strategic_milestones=4,
visitor_log=4, pip_plans=4, hr_alumni=3, adaptation_programs=3, hr_conflict_reports=3, crm_comments=3,
cc_ai_sessions=3, pos_movement_confirmations=3, crm_activities=3, offboarding_cases=3, goals=3,
hr_onboarding_plans=3, questionnaire_templates=3, employee_files=2, hr_documents=2, kanban_cards=2,
vendor_performance=2, pos_movement_lines=2, pos_movements=2, kanban_boards=2, employee_skills=2,
payroll_tax_rules=2, exhibitions=1, payroll_periods=1, downtime_events=1, sd_price_formulas=1,
kanban_results=1, document_workflow_instances=1, kanban_files=1, chat_emoji_packs=1,
kanban_notifications=1, pos_gl_posting_log=1, hr_brand_settings=1, ai_planning_plans=1, stock_ledger=1,
mm_vendor_ratings=1, qc_approvals=1, micro_module_views=1, entries=1, micro_modules=1,
mes_material_consumption=1, financial_ratios_snapshot=1, enps_surveys=1, node_hr_requests=1
```
