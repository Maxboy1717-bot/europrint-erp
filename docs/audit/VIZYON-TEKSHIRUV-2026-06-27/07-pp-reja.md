# 07 — PP / Rejalashtirish — Mustaqil Tekshiruv (2026-06-27)

**Modul:** 07 PP/Rejalashtirish · 142 savol
**Doc self-claim:** vizyon 46%
**Tekshiruvchi realPct (verifikatsiya qilinadigan 138 savol; egasi-data 4 chiqarildi):** ~39%

**Aggregat (mening qayta-bahom):** bor=15 · qisman=79 · yoq=44 · egasi-data=4
**Isbot da'vo aniqligi:** confirmed=136 · refuted=6

## REFUTED CLAIMS (doc kam-baholagan / noto'g'ri Isbot)
- **07.2** — doc "muqobil stanok ustuni hech qaerda YO'Q" → `tech_card_routes.alt_machine_id` MAVJUD (DB \d tasdiqladi).
- **07.5** — doc "doimiy otxod alohida ustun YO'Q" → `tech_card_routes.scrap_fixed` MAVJUD (doimiy + foizli: scrap_fixed + scrap_pct).
- **07.7** — doc "operatsiya-darajada razryad YO'Q" → `tech_card_routes.min_razryad` MAVJUD.
- **07.68** — doc "Bottleneck/TOC logikasi pp-crp.service'da topilmadi" → `markBottleneck` pp-crp.service.ts:203 REAL bor (07.31 buni to'g'ri keltiradi).
- **07.87** — doc "Frozen-window ustuni/logikasi topilmadi" → `production_orders.is_frozen`+`frozen_until` ustunlari + `isWithinFrozenWindow()` + no-preempt `buildQueue`/`findInsertionSlot` REAL bor.
- **07.67** (egasi-data) — doc "kod-darajasida ish-uzish bloki yo'q" → production-priority.service no-preempt guard REAL bor (denominatordan tashqari).

> Eslatma: 07.124 (grep multiLine=0 → aslida 3 hit, hammasi "no line-items" izohi, mazmun to'g'ri) va 07.142 (grep pareto=0 → aslida 23 hit, lekin qc/sd/finance'da, PP-delay-pareto yo'q) — Isbot grep raqami biroz noaniq, lekin status to'g'ri → refuted EMAS.

---

## 07.1 — Q1 (texkarta 10-lik qadam) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: pp_routing_operations.operation_number+sequence bor, 0 qator.
- Tekshiruv: DB cols tasdiq + 0 qator. To'g'ri.

## 07.2 — Q2 (stanok + muqobil) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: refuted)
- Doc Isbot: "muqobil stanok ustuni hech qaerda YO'Q".
- Tekshiruv: `tech_card_routes.alt_machine_id` MAVJUD (0 qator, switch-logika yo'q). Da'vo "hech qaerda yo'q" NOTO'G'RI.

## 07.3 — Q3 (norma dona/soat) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: run_time_per_unit_min + machine_time; PpCrpService o'qiydi.
- Tekshiruv: cols + pp-crp.service.ts:130-140 tasdiq.

## 07.4 — Q4 (setup alohida) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: setup_time + setup_time_min; CRP formula.
- Tekshiruv: cols + pp-crp.service requiredMins=setup_time_min+run×qty tasdiq.

## 07.5 — Q5 (doimiy+foizli otxod) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: refuted)
- Doc Isbot: scrap_pct bor, "doimiy otxod alohida ustun YO'Q".
- Tekshiruv: `tech_card_routes.scrap_fixed`+`scrap_pct` IKKALASI MAVJUD. Doimiy otxod ustuni BOR. Da'vo NOTO'G'RI.

## 07.6 — Q6 (versiyali+tasdiq) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: version+status+lab_approved+maket_approved+created_by.
- Tekshiruv: cols + technology.repository.ts:238 yozadi; tech_card_versions=1. Arxiv-snapshot noaniq, lekin bor.

## 07.7 — Q7 (operatsiya razryad+LMS) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: refuted)
- Doc Isbot: "pp_routing_operations'da razryad/operatsiya-darajasi talabi YO'Q".
- Tekshiruv: `tech_card_routes.min_razryad` MAVJUD — operatsiya-razryad ustuni BOR. Da'vo NOTO'G'RI.

## 07.8 — Q8 (karton spetsifikatsiya) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: format_a/b/gofra_profile/print_params/material_type + pp_flute_types; 1 qator NULL.
- Tekshiruv: cols + pp_flute_types=5; technology_cards=1 qator direction='flx-gof', gofra_profile bo'sh.

## 07.9 — Q9 (tabiiy birlik) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: gofra-conversion + norma_m2/kg_per_shift; operatsiya-birlik yo'q.
- Tekshiruv: gofra-conversion.service.ts + work_centers.norma_m2/kg cols tasdiq.

## 07.10 — Q10 (reja vs haqiqiy) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: average_actual_duration+based_on_orders_count; production_facts 0.
- Tekshiruv: cols + production_facts=0 tasdiq.

## 07.11 — Q11 (dona/soat ╳ daqiqa/dona) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: run_time_per_unit_min + capacity_per_hour NULL.
- Tekshiruv: ikkala col tasdiq.

## 07.12 — Q12 (kichik tiraj sekin) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: CRP setup+run×qty.
- Tekshiruv: pp-crp.service formula tasdiq.

## 07.13 — Q13 (norma kombinatsiya) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: param-variatsiya ustuni yo'q.
- Tekshiruv: pp_routing_operations param-norma yo'q.

## 07.14 — Q14 (norma% smena KPI) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: production_facts.operator1-3+brak; 0 qator.
- Tekshiruv: cols + production_facts=0 tasdiq.

## 07.15 — Q15 (stanok karta) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: 12 qator code/name/type/capacity/cost_per_hour/is_active; holat/yil/format yo'q.
- Tekshiruv: work_centers=12; status/yil/format yo'q (faqat is_active). Tasdiq.

## 07.16 — Q16 (quvvat=ish soati) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: hours_per_day×capacity availHours.
- Tekshiruv: pp-crp.service.ts:165-175 availHours formula tasdiq.

## 07.17 — Q17 (stanok kalendari) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: CRP 5-kun qat'iy; individual kalendar yo'q.
- Tekshiruv: CRP_WORKING_DAYS_PER_WEEK=5 (pp-crp.service.ts:81); erp_shift_calendars=0.

## 07.18 — Q18 (PM kalendar) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: mro-stop.listener bor; CRP PM chiqarmaydi.
- Tekshiruv: mro-stop.listener.ts mavjud; equipment_maintenance=0; CRP faqat efficiency.

## 07.19 — Q19 (format cheklovi) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: width/length/format ustuni yo'q.
- Tekshiruv: work_centers cols — yo'q. Tasdiq.

## 07.20 — Q20 (OEE koeffitsient) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: efficiency_rate; CRP clamp.
- Tekshiruv: 12 qator efficiency_rate (0.75-0.98); clamp tasdiq.

## 07.21 — Q21 (stanok guruhi) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: machine_group ustuni yo'q.
- Tekshiruv: grep machine_group=0.

## 07.22 — Q22 (4 kesim drill-down) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: production_facts 0; reader=0.
- Tekshiruv: production_facts=0.

## 07.23 — Q23 (reja-fakt solishtirish) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: planned/confirmed_quantity+planned/actual_cost+start/end bor; og'ish-dvigatel yo'q.
- Tekshiruv: production_orders cols tasdiq.

## 07.24 — Q24 (og'ish sababi kodli) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: mes_downtime_reasons 7 + downtime_reason_codes 0.
- Tekshiruv: mes_downtime_reasons=7, downtime_reason_codes=0.

## 07.25 — Q25 (og'ish chegara signal) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: PP threshold jadvali yo'q.
- Tekshiruv: tasdiq.

## 07.26 — Q26 (smena yopish+MES) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: machine_status_logs 9; shift_handovers 0.
- Tekshiruv: machine_status_logs=9, shift_handovers=0.

## 07.27 — Q27 (deadline→mijoz) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: compareFlexible deadline→band.
- Tekshiruv: production-priority.service.ts compareFlexible urgent→deadline→rank→id tasdiq.

## 07.28 — Q28 (4 daraja enum) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: PoPriority enum + RANK 1-4.
- Tekshiruv: enum SHOSHILINCH/YUQORI/ODDIY/PAST + PO_PRIORITY_RANK tasdiq.

## 07.29 — Q29 (kim+jurnal) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: production_order_status_log 0; RBAC noaniq.
- Tekshiruv: production_order_status_log=0.

## 07.30 — Q30 (preemption no-preempt) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: frozen interleave qilinmaydi; findInsertionSlot.
- Tekshiruv: buildQueue frozen-birinchi + findInsertionSlot "never step over frozen" tasdiq.

## 07.31 — Q31 (bottleneck navbat) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: markBottleneck (203-208) + priorityService.
- Tekshiruv: markBottleneck pp-crp.service.ts:203 mavjud.

## 07.32 — Q32 (buyurtma split) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: aggregate'da split yo'q.
- Tekshiruv: grep split aggregate=0.

## 07.33 — Q33 (reorder+avto so'rov) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: RopTriggerHandler avto requisitions.
- Tekshiruv: rop-trigger.handler.ts (wms) inventory_policy.reorder_point+material_cards real mexanizm.

## 07.34 — Q34 (lead time formula) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: inventory_policy.lead_time_days; material_cards lead_time yo'q.
- Tekshiruv: inventory_policy.lead_time_days=31; material_cards lead_time yo'q.

## 07.35 — Q35 (ATP buyurtma qabul) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: calculateAtp real; SD-UI ulanish noaniq.
- Tekshiruv: mps-atp.handler.ts calculateAtp firstNegativePeriod+canPromise REAL.

## 07.36 — Q36 (material rezerv) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: production_material_allocs 0 qator.
- Tekshiruv: allocs=0, balance=0.

## 07.37 — Q37 (zagotovka zaxira) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: zagotovka-zaxira modeli yo'q.
- Tekshiruv: PP-da WIP-reja-avval logika yo'q.

## 07.38 — Q38 (lot/FIFO) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: PP lot/FIFO reader yo'q.
- Tekshiruv: PP-reja FIFO yo'q.

## 07.39 — Q39 (reorder davriy) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: reorder statik; cron yo'q.
- Tekshiruv: tasdiq.

## 07.40 — Q40 (smena 4 o'lcham) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: shift_schedules 30 (HR); stanok×buyurtma yo'q.
- Tekshiruv: shift_schedules=30.

## 07.41 — Q41 (smena turlari) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: shift_type data; shablon+tanaffus tasdiqlanmadi.
- Tekshiruv: shift_types=3 master bor; tanaffus noaniq.

## 07.42 — Q42 (smena malaka) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: malaka↔operatsiya solishtiruv yo'q.
- Tekshiruv: tasdiq.

## 07.43 — Q43 (zaxira ishchi) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: avto-almashtiruvchi yo'q.
- Tekshiruv: tasdiq.

## 07.44 — Q44 (peresmenka) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: shift_handovers 0 qator.
- Tekshiruv: shift_handovers=0; mes_shift_handovers=VIEW.

## 07.45 — Q45 (sverxurochniy oylik) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: PP-da sverxurochniy→oylik yo'q.
- Tekshiruv: PP-tomonda yo'q.

## 07.46 — Q46 (smena dashboard) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: bo'laklar bor; production_facts 0.
- Tekshiruv: tasdiq.

## 07.47 — EP-PP-041 (norma manbai) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: average_actual_duration; 1 qator.
- Tekshiruv: cols tasdiq.

## 07.48 — EP-PP-042 (norma turi) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: run_time_min+machine_time+capacity_per_hour; op 0.
- Tekshiruv: routing_operations.run_time_min col bor; pp_routing_operations=0.

## 07.49 — EP-PP-043 (setup→kichik tiraj) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: setup_duration_minutes+setup_time_min; op 0.
- Tekshiruv: cols tasdiq.

## 07.50 — EP-PP-044 (norma material) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: print_params+gofra_profile + pp_flute_types 5.
- Tekshiruv: cols + pp_flute_types=5.

## 07.51 — EP-PP-045 (norma% KPI) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: variance_percent/brak_percent; mes_shift_stats 6; production_facts 0.
- Tekshiruv: cols + mes_shift_stats=6.

## 07.52 — EP-PP-046 (stanok karta) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: min_max_crew/unit_preference; yil/manufacturer/format yo'q.
- Tekshiruv: min_crew_size/max_crew_size/unit_preference cols bor; yil/format yo'q.

## 07.53 — EP-PP-047 (quvvat birligi) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: hours_per_day+capacity+capacity_per_hour.
- Tekshiruv: cols + pp-crp.service tasdiq.

## 07.54 — EP-PP-048 (ish jadvali) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: work_center_capacity 0; erp_shift_calendars 0.
- Tekshiruv: ikkalasi 0 qator.

## 07.55 — EP-PP-049 (PM kalendar) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: equipment_maintenance+mro_equipment; PM↔CRP yo'q.
- Tekshiruv: equipment_maintenance=0; CRP PM o'qimaydi.

## 07.56 — EP-PP-050 (format cheklovi) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: max/min format yo'q.
- Tekshiruv: tasdiq.

## 07.57 — EP-PP-051 (efficiency WIRED) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: efficiency_rate 12 qator; clamp.
- Tekshiruv: 12 qator real (0.75-0.98); clamp tasdiq.

## 07.58 — EP-PP-052 (parallel guruh) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: stanok-guruh ustuni yo'q.
- Tekshiruv: machine_group=0.

## 07.59 — EP-PP-053 (4 kesim) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: production_fact 4 kesim 1 qator; mes_shift_stats 6.
- Tekshiruv: production_fact (singular) cols 1 qator; mes_shift_stats=6.

## 07.60 — EP-PP-054 (4 metrik) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: fact/good/scrap/rework+start/end; muddat/tannarx alohida yo'q.
- Tekshiruv: production_fact cols tasdiq.

## 07.61 — EP-PP-055 (5-guruh sabab) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: downtime_reason_codes 0 (seed yo'q).
- Tekshiruv: downtime_reason_codes=0.

## 07.62 — EP-PP-056 (chegara signal) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: chegara jadvali yo'q.
- Tekshiruv: tasdiq.

## 07.63 — EP-PP-057 (smena yopish+MES) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: production-shift-reports.controller bor; production_facts 0.
- Tekshiruv: controller mavjud; mes_shift_stats=6.

## 07.64 — EP-PP-058 (tartiblash) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: priority+is_urgent+pp_queued_at; algoritm jonli isbotlanmadi.
- Tekshiruv: production-priority.service algoritm aslida bor; cols tasdiq.

## 07.65 — EP-PP-059 (4 daraja+rang) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: priority+is_urgent; enum/rang aniq emas.
- Tekshiruv: enum kod bor; rang FE.

## 07.66 — EP-PP-060 (kim+jurnal) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: status_log 0; RBAC yo'q.
- Tekshiruv: production_order_status_log=0.

## 07.67 — EP-PP-061 (preemption taqiq) [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: refuted)
- Doc Isbot: "kod-darajasida ish-uzish bloki yo'q".
- Tekshiruv: no-preempt guard REAL (findInsertionSlot+isWithinFrozenWindow+buildQueue). Da'vo NOTO'G'RI. Egasi-data flag qoladi (policy qiymati).

## 07.68 — EP-PP-062 (bottleneck TOC) [DOC: ❌] → [VERIFIED: qisman] (CLAIM: refuted)
- Doc Isbot: "Bottleneck/TOC pp-crp.service'da topilmadi".
- Tekshiruv: markBottleneck pp-crp.service.ts:203 REAL (07.31 ham). Aniqlash bor, avto-navbat qisman. yoq→qisman.

## 07.69 — EP-PP-063 (split kolliziya) [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Doc Isbot: split ustuni yo'q; egasi hal qiladi.
- Tekshiruv: production_orders'da split yo'q.

## 07.70 — EP-PP-064 (reorder+avto) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: inventory_policy 31; rop-trigger.
- Tekshiruv: inventory_policy=31; rop-trigger.handler.ts real.

## 07.71 — EP-PP-065 (lead time) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: lead_time_days; uzoq/tez toifa egasi-data.
- Tekshiruv: inventory_policy.lead_time_days=31.

## 07.72 — EP-PP-066 (ATP) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: pp_mrp_runs/lines 0; CRP real.
- Tekshiruv: pp_mrp_runs=0, lines=0.

## 07.73 — EP-PP-067 (reja gorizonti) [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Doc Isbot: planning_horizon_days+horizon_periods; master egasi-data.
- Tekshiruv: pp_mrp_runs cols tasdiq.

## 07.74 — EP-PP-068 (allokatsiya) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: allocs+balance+ai_reservation_batches; data isbotlanmadi.
- Tekshiruv: allocs=0, balance=0, ai_reservation_batches=0.

## 07.75 — EP-PP-069 (WIP) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: balance+batch_lots; reja-avval logika yo'q.
- Tekshiruv: batch_lots=21; WIP-reja logika yo'q.

## 07.76 — EP-PP-070 (lot/FIFO blok) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: batch_lots+warehouse_batches; FIFO jonli emas.
- Tekshiruv: batch_lots=21, warehouse_batches=0.

## 07.77 — EP-PP-071 (dinamik reorder) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: reorder statik; cron yo'q.
- Tekshiruv: tasdiq.

## 07.78 — EP-PP-072 (smena 4 o'lcham) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: shift_schedules 30+shift_assignments 30; kalit NULL.
- Tekshiruv: ikkalasi 30 qator.

## 07.79 — EP-PP-073 (operator+yordamchi) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: machine_crews ko'p-rol 2 qator; NULL.
- Tekshiruv: machine_crews=2; ko'p-rol cols tasdiq.

## 07.80 — EP-PP-074 (smena master) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: shift_types 3 qator + overtime_multiplier.
- Tekshiruv: shift_types=3, cols tasdiq.

## 07.81 — EP-PP-075 (smena malaka) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: required_skill_name; solishtirish jonli emas.
- Tekshiruv: work_centers cols + tech_card_routes.min_razryad bor; logika yo'q.

## 07.82 — EP-PP-076 (yo'qlik almashish) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: shift_swap_requests 0.
- Tekshiruv: shift_swap_requests=0.

## 07.83 — EP-PP-077 (peresmenka) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: shift_handovers 0; mes_shift_handovers VIEW.
- Tekshiruv: shift_handovers=0; VIEW tasdiq.

## 07.84 — EP-PP-078 (sverxurochniy) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: overtime_multiplier 3 qator; payroll yo'q.
- Tekshiruv: shift_types.overtime_multiplier tasdiq.

## 07.85 — EP-PP-079 (smena nazorat) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: mes_shift_stats 6; mes-shifts-stats.service+controller.
- Tekshiruv: mes_shift_stats=6; mes-shifts-stats.service.ts mavjud.

## 07.86 — EP-PP-080 (kunlik replan) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: replan CRON yo'q.
- Tekshiruv: grep dailyReplan=0.

## 07.87 — EP-PP-081 (frozen window) [DOC: ❌] → [VERIFIED: qisman] (CLAIM: refuted)
- Doc Isbot: "Frozen-window ustuni yoki logikasi topilmadi; yaqin-kun himoyasi qurilmagan".
- Tekshiruv: `production_orders.is_frozen`+`frozen_until` MAVJUD; `isWithinFrozenWindow()` (production-priority.service.ts:168) + no-preempt buildQueue/findInsertionSlot + ai-planning Step6 frozen-qoida REAL. Da'vo NOTO'G'RI — mexanizm bor (avto kunlik-muzlatish wiring yo'q → qisman).

## 07.88 — EP-PP-082 (status sikli) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: status + status_log 0; 8-status standart yo'q.
- Tekshiruv: status col bor; status_log=0; status_history=0.

## 07.89 — EP-PP-083 (bekor→yo'qotish) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: cancel-handler yo'q.
- Tekshiruv: tasdiq.

## 07.90 — EP-PP-084 (gang run) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: gang* jadval yo'q.
- Tekshiruv: grep gang.?run=0.

## 07.91 — EP-PP-085 (navbat raqami) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: machine_tasks+pp_queued_at; sequence+drag-drop jonli emas.
- Tekshiruv: machine_tasks=0 (mavjud); pp_queued_at bor.

## 07.92 — EP-PP-086 (algoritm 2-8) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: algoritm-turi hisoblash yo'q.
- Tekshiruv: tasdiq.

## 07.93 — EP-PP-087 (yo'nalish master) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: direction bor; 1 qator; avto-to'ldirish yo'q.
- Tekshiruv: direction='flx-gof' 1 qator.

## 07.94 — EP-PP-088 (koshirofka) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: post_press+direction; avto-bosqich yo'q.
- Tekshiruv: cols tasdiq.

## 07.95 — EP-PP-089 (BOM) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: tech_card_bom + bom.service; 0 qator.
- Tekshiruv: tech_card_bom cols tasdiq, 0 qator; bom.service.ts mavjud.

## 07.96 — EP-PP-090 (6 element) [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: material_type+print_params+kesim+qolip_id+post_press+ish_tartibi.
- Tekshiruv: technology_cards cols hammasi tasdiq.

## 07.97 — EP-PP-091 (lab gate) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: lab_approved+grammage.service; gate-bloklash isbotlanmadi.
- Tekshiruv: cols + technology-grammage.service.ts mavjud; enforcement noaniq.

## 07.98 — EP-PP-092 (smena 4 raqam) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: plan_quantity+brak+variance 0; 'qolgan' yo'q.
- Tekshiruv: production_facts cols (Остал yo'q), 0 qator.

## 07.99 — EP-PP-093 (brak→rework) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: defect_quantity bor; rework_order grep=0.
- Tekshiruv: grep rework_order|reproduce pp+mes=0 (production_order_operations.rework_count/reason col bor, avto-order yo'q).

## 07.100 — EP-PP-094 (raskroy) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: raskroy_per_list+scrap_pct yozadi; hisob-servis yo'q.
- Tekshiruv: cols + technology.repository.ts:201/230 yozadi.

## 07.101 — EP-PP-095 (AI optimize) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: POST optimize → notImplemented (technology.controller.ts:191).
- Tekshiruv: technology.controller.ts:191 notImplemented tasdiq.

## 07.102 — EP-PP-096 (kichik buyurtma) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep small.?order=0.
- Tekshiruv: tasdiq.

## 07.103 — EP-PP-097 (ZARUR) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: is_urgent; queue handler ZARUR birinchi (54,72).
- Tekshiruv: get-production-queue.handler.ts is_urgent→buildQueue tasdiq.

## 07.104 — EP-PP-098 (menejer xabar) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: responsible_manager_id 0/7 NULL; managerNotify=0.
- Tekshiruv: 0 not-null / 7 total (hammasi NULL).

## 07.105 — EP-PP-099 (tayyorlik %) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: progress bor; bo'lim formula yo'q.
- Tekshiruv: progress col; grep readinessPct=0.

## 07.106 — EP-PP-100 (3 taymer) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: planned/actual start/end; 3-taymer grep=0.
- Tekshiruv: tasdiq.

## 07.107 — EP-PP-101 (kutish zona) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep waitingZone=0.
- Tekshiruv: tasdiq.

## 07.108 — EP-PP-102 (priladka formula) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: setup_minutes statik; rang×daqiqa formula yo'q.
- Tekshiruv: tech_card_routes.setup_minutes col; ai-planning rang-guruh qoida.

## 07.109 — EP-PP-103 (papka №) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: papka_no bor; card_folders 0; generator yo'q.
- Tekshiruv: papka_orders.papka_no col; card_folders=0.

## 07.110 — EP-PP-104 (takror buyurtma) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep repeat=0; chaqirish flow yo'q.
- Tekshiruv: tech_card_versions=1; flow yo'q.

## 07.111 — EP-PP-105 (to'plam gate) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep partSet=0.
- Tekshiruv: tasdiq.

## 07.112 — EP-PP-106 (AI tarix ATP) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: average_actual_duration; history grep=0.
- Tekshiruv: tasdiq.

## 07.113 — EP-PP-107 (kun+смена slot) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: erp_shift_calendars+shift_assignments; CRP 2-slot yo'q.
- Tekshiruv: shift_assignments=30, erp_shift_calendars=0.

## 07.114 — EP-PP-108 (sex tablet) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: production_order_operations.started/completed_at+actual_duration; 0 qator.
- Tekshiruv: cols tasdiq, 0 qator.

## 07.115 — EP-PP-109 (kod lug'ati) [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Doc Isbot: grep code.dictionary=0; egasi KT/PT/E/GL.
- Tekshiruv: grep=0.

## 07.116 — EP-PP-110 (3 kesim hafta) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: weeklyReport DATE_TRUNC('week') (production.repository.ts:105).
- Tekshiruv: production.repository.ts:103 DATE_TRUNC('week',started_at) GROUP BY tasdiq.

## 07.117 — EP-PP-111 (asosiy bosqich) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: tech_card_routes.is_core; 0 qator; hisob yo'q.
- Tekshiruv: is_core col tasdiq, 0 qator.

## 07.118 — EP-PP-112 (oynakcha PVX) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep oynakcha=0.
- Tekshiruv: tasdiq.

## 07.119 — EP-PP-113 (pardoz turi) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep vib.lak=0.
- Tekshiruv: tasdiq.

## 07.120 — EP-PP-114 (qadoq turi) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep packType=0.
- Tekshiruv: tasdiq.

## 07.121 — EP-PP-115 (qolip gate) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: qolip_id+ow_molds; holat ENUM+gate yo'q.
- Tekshiruv: qolip_id col; ow_molds=0; enum yo'q.

## 07.122 — EP-PP-116 (gofra profil) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: pp_flute_types 5+gofra_profile+FE; bog'lash yo'q.
- Tekshiruv: pp_flute_types=5; TechCardsMaster.tsx mavjud.

## 07.123 — EP-PP-117 (format↔stanok) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: format_code+FE; pp_work_centers 12; moslik yo'q.
- Tekshiruv: cols + pp_work_centers=12.

## 07.124 — EP-PP-118 (multi-line) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: 1 mahsulot=1 buyurtma; grep multiLine pp=0.
- Tekshiruv: grep 3 hit lekin "no line-items" izohi (single-product tasdiqlaydi).

## 07.125 — EP-PP-119 (material-tayyorlash) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep delivery.stage pp=0.
- Tekshiruv: tasdiq.

## 07.126 — EP-PP-120 (Bandlik dashboard) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: utilizationPct+isBottleneck+machine-load.handler; FE vizual yo'q.
- Tekshiruv: pp-crp.service utilizationPct/markBottleneck; machine-load.handler.ts mavjud.

## 07.127 — EP-PP-121 (22+ stanok) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: pp_work_centers 12; 22+ to'liq emas.
- Tekshiruv: pp_work_centers=12 < 22+.

## 07.128 — EP-PP-122 (post-press checkbox) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: post_press jsonb; checkbox→marshrut yo'q.
- Tekshiruv: post_press jsonb col tasdiq.

## 07.129 — EP-PP-123 (maket gate) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: maket_approved+setMaketApproved (264)+FE gate-pill; auto-kutish to'liq emas.
- Tekshiruv: technology.repository.ts:264 setMaketApproved; TechCardsDialogs gate-pill mavjud.

## 07.130 — EP-PP-124 (3 gate) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: lab+maket_approved+FE 3 traffic-light; server gate noaniq.
- Tekshiruv: cols+GatePills; release-gate noaniq.

## 07.131 — EP-PP-125 (maket sikli) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: maket_approved boolean; доработка grep=0.
- Tekshiruv: boolean, sikl yo'q.

## 07.132 — EP-PP-126 (konstruktor) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep constructor.stage=0.
- Tekshiruv: tasdiq.

## 07.133 — EP-PP-127 (operator norma%→HR) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: target/actual_quantity+norm_per_hour; normPct grep=0.
- Tekshiruv: production_sessions cols + tech_card_routes.norm_per_hour col; servis yo'q.

## 07.134 — EP-PP-128 (idle vs slow) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep idleVsSlow=0.
- Tekshiruv: tasdiq.

## 07.135 — EP-PP-129 (Excel eksport) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep excelExport pp=0.
- Tekshiruv: grep excelExport|xlsx.export pp=0.

## 07.136 — EP-PP-130 (AI smena to'plam) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: Step5 rang-guruh QOIDA (271); Step7 key-gated stub (294).
- Tekshiruv: pp-ai-planning Step5 rule-only, Step7 pending_ai_key tasdiq.

## 07.137 — EP-PP-131 (AI bottleneck TOC) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: markBottleneck (203)+Step4 bottleneckWorkCenter; TOC Step7 stub.
- Tekshiruv: Step4 bottleneckWorkCenter; markBottleneck real; TOC stub.

## 07.138 — EP-PP-132 (CRP ikki cheklov) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: CRP faqat stanok; labor.constraint=0.
- Tekshiruv: grep labor.constraint pp=0; xodim-cheklovsiz.

## 07.139 — EP-PP-133 (buyurtma turi) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: order_type+production_type; qisqa-marshrut yo'q.
- Tekshiruv: cols tasdiq.

## 07.140 — EP-PP-134 (egasi dashboard) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep owner.dashboard=0.
- Tekshiruv: tasdiq.

## 07.141 — EP-PP-135 (norma kalibrlash) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: average_actual_duration; calibrat=0.
- Tekshiruv: tasdiq.

## 07.142 — EP-PP-136 (AI Pareto) [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: grep pareto=0.
- Tekshiruv: "pareto" 23 hit (qc/sd/finance — PP-delay emas); reason_code+oylik Pareto yo'q. Status to'g'ri.
