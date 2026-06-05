# 🏗️ GROUP 4 — 501 STUB QURISH REJASI (chuqur tahlil, 19 modul)
> Sana: 2026-06-05 | Manba: 2 workflow (33 agent, DB-tasdiq bilan) + verify-don't-trust
> Har stub: nima qiladi · kerakli jadval (bor/yangi) · qayta-ishlatish · ish-hajmi. Ijro = bu reja bo'yicha tartib bilan.

## 📊 UMUMIY
- ~**170 stub** / 19 modul. Ko'pchiligida **jadval ALLAQACHON BOR** (✅) → DDL kerak emas.
- ⚠️ **~28 yangi jadval** kerak (Q-35 = egasi ruxsati) — pastda ro'yxat.
- 🔵 **#FX-gated** (ataylab o'chirilgan = mahsulot qarori) — pastda ro'yxat.
- 🔴 **QC echo-stub'lar = yashil yolg'on** (`{approved:true}` fake) — ustuvor.

## 🎯 IJRO TARTIBI (tavsiya)
1. 🔴 **QC echo-yolg'onlar** (approve/reject/inspector-submit `{...:true}` fake) — kichik DDL (`qc_approvals` yoki status ustun) → real saqlash. Q-40.
2. 🟢 **DDL-siz o'qish/agregatsiya** (eng ko'p, xavfsiz): pos(5), lms(4), pp(5), compat(6), mm-po(3), wms transactions/orders-by-date/material-kits, integration(6), hr dashboard-stats/fp-cycle/hrc-tests/360/ai-interview/documents/enps, mm vendor-invoices/3way/fleet/vehicles/driver, design-security ppe/fire/daily/tooling/design-orders, misc marketing(inbox/exhibitions/ab/settings/blog) + material-balance + org-history, iot (deyarli hammasi).
3. ⚠️ **DDL kerak bo'lganlar** (egasi har jadvalni tasdiqlaydi, `APPROVED:` izoh + DB-proof): pastdagi ro'yxat.
4. 🔵 **#FX-gated** — egasi "qurilsinmi?" deb hal qiladi (oxirda).

## ⚠️ YANGI JADVALLAR (Q-35 — egasi ruxsati kerak)
`production_session_crew`, `production_session_evaluations`, `integration_configs`, `printer_configs`, `adaptation_records`, `offboarding_questions`, `hrc_test_results`, `hr_birthday_settings`, `employee_corp`, `ai_interview_session_reviews`, `fi_payments` (to'lov — money!), `fleet_maintenance`, `material_suppliers`, `qc_approvals` (yoki status ustunlar), `kanban_message_files`, `kanban_projects`, `skill_gap_analysis`, `expenses` (xarajat), `design_notifications`, `design_order_messages`, `ppe_checks`, `tooling_wear` (yoki ow_molds ustun), `marketing_pr`, `social_api_settings`, `loans`+`loan_payments`, `tax_calendar`, `salary_benchmark`, `financial_reports`.

## 🔵 #FX-GATED (mahsulot qarori — qurilsinmi?)
hr `/hr/contracts` `/hr-capital/courses` `/hr-capital/stats` (#FX-9); finance `/finance/reports` `/finance/loans` `/finance-extended/tax-calendar` `/salary-benchmark` (#FX-4/1); qc `/qc/control-charts` (#FX-11); ai `/ai/forecast/demand` `/ai/rush-orders` ×3 (#FX-5); marketing `/marketing/ai-assistant` `/inbox/ai-reply` `/website/blog/ai-generate` (#FX).

---

# 📋 MODUL BO'YICHA SPETSIFIKATSIYA

## IoT (planshet + sessiya + sensor) — deyarli hammasi ✅bor
| Endpoint | Jadval | DDL? | Qayta-ishlat | Ish |
|---|---|---|---|---|
| GET /iot/tablet/shift | shift_schedules | ✅ | findTodayShift(workerId) | S |
| GET/POST /iot/tablet/sessions | production_sessions | ✅ | findTabletSessions / createSession | S/M |
| POST /iot/tablet/handover | shift_handovers | ✅ | insertHandover + real Zod | M |
| POST+PATCH /iot/material-kit-items/:id/scan | material_kit_items | ✅ | scanKitItem UPDATE | S |
| POST /iot/production-sessions + :id/start/stop | production_sessions | ✅ | updateSessionStatus + oee-calculator | S/M |
| POST :id/defect | downtime_events | ✅ | recordDowntimeForSession | M |
| POST :id/material-return | material_kit_items | ✅ | kit UPDATE | M |
| POST :id/inline-qc | inline_qc_checks | ✅ | insertInlineQc | S |
| GET /iot-sensors/predictive-maintenance | iot_sensor_readings | ✅ | getOee/getSensorTrends + heuristika | L |
| PATCH+POST /iot-sensors/alerts/:id/resolve | iot_alerts | ✅ | acknowledgeAlert(id) | S |
| GET /iot/downtime-reason-codes | downtime_reason_codes | ✅ | getDowntimeReasonCodes | S |
| PATCH /iot/devices/:id | iot_devices | ✅ | updateDevice (404 chek) | M |
| POST /iot/alerts | iot_alerts | ✅ | insertAlert | M |
| GET /iot-enhanced/orders | production_orders | ✅ | listOrders | S |
| GET /iot/production-sessions/:id/crew | ⚠️ production_session_crew (session_id,worker_id,role,joined_at) | DDL | — | M |
| POST /iot/production-sessions/:id/evaluation | ⚠️ production_session_evaluations (session_id,evaluator_id,quality_score,rating,comments) | DDL | — | M |

## AI-agents
| GET... | — |
| POST /api/ai-agents/:agentId/trigger | ai_decision_log | ✅ | AiDecisionLogService.log + AGENT_CODES (404 noma'lum) | M |

## WMS
| Endpoint | Jadval | DDL? | Qayta-ishlat | Ish |
|---|---|---|---|---|
| GET /warehouse/integration/mm/pending-deliveries | goods_receipts | ✅ | getGoodsReceipts('pending') | M |
| GET /warehouse/integration/mm/reorder-suggestions | warehouse_stock | ✅ | lowStock() | M |
| GET /warehouse/integration/fi/stock-valuation | warehouse_stock | ✅ | getStockBalance + narx JOIN | M |
| GET /warehouse/integration/summary | warehouse_stock | ✅ | 3 metod birlash | M |
| GET /warehouse/transactions | warehouse_transactions | ✅ | repo select | S |
| GET /warehouse/orders-by-date/:date | orders | ✅ | due_date filter | S |
| GET/POST/PATCH/GET-items /warehouse/material-kits(+/:id/status,/:id/items) | material_kits + material_kit_items | ✅ | yangi repo (jadval tayyor) | S/M |
| GET+POST /warehouse/integration | ⚠️ integration_configs (name,type,config jsonb,active) | DDL | yangi repo | L |
| GET+POST+PATCH+DELETE /warehouse/printer-config | ⚠️ printer_configs (name,ip,port,paper_size,active) | DDL | yangi repo | M/S |

## HR — dashboard
| Endpoint | Jadval | DDL? | Qayta-ishlat | Ish |
|---|---|---|---|---|
| GET /hr/dashboard-stats | employees | ✅ | getAlerts + COUNT | S |
| GET /hr/fp-cycle | fp_cycles | ✅ | getFpCycle | S |
| GET /hr/hrc-tests/employee, /public | hrc_iq_questions | ✅ | getHrcTestsForUser/getPublicHrcTests | M |
| GET /hr/360/reviewable | employee_360_assessments | ✅ | get360Reviewable | M |
| GET /hr/ai-interview/session | ai_interview_sessions | ✅ | getAiInterviewSessions | S |
| GET /hr/enps/surveys/results | enps_survey_responses | ✅ | getEnpsResults agregat | M |
| GET /hr/documents/employee,/my,/pending | hr_documents | ✅ | getEmployeeDocuments/My/Pending | S |
| GET /hr/adaptation/:id | ⚠️ adaptation_records | DDL | getAdaptationAtRisk pattern | M |
| GET /hr/offboarding/questions | ⚠️ offboarding_questions | DDL | — | M |
| GET /hr/hrc-tests/stats | ⚠️ hrc_test_results | DDL | — | M |
| GET+POST+:id /hr/birthdays/settings | ⚠️ hr_birthday_settings | DDL | — | M/S |
| GET /hr/ai-interview/session/:id/review | ⚠️ ai_interview_session_reviews | DDL | — | M |
| GET /hr/employee-corp | ⚠️ employee_corp | DDL | — | M |

## HR — rest
| Endpoint | Jadval | DDL? | Qayta-ishlat | Ish |
|---|---|---|---|---|
| GET /hr/contracts | employment_contracts | 🔵#FX | findAllContracts | S |
| GET /hr-capital/courses, /stats | courses+employee_skills | 🔵#FX | repo select / agregat | S/M |
| PATCH+DELETE /hr/hrc-tests/tool-test/questions/:id | hrc_iq_questions | ✅ | getHrcTestQuestions + UPDATE/DELETE | S |
| GET /hr/hrc-tests/employee/:employeeId/results | hr_tool_test_results | ✅ | findToolTestResultsByEmployee | S |
| POST /hr/hrc-tests/sessions | hr_interview_sessions | ✅ | createHealthCheckup pattern | M |
| POST /hr/hrc-tests/tool-test/questions | hrc_iq_questions | ✅ | createSkillCatalog pattern | S |
| GET /hr/recruitment/pipeline/:id/checklist | hr_candidate_funnels | ✅ | findRoadmapByPipeline | M |

## MM — dashboard (vendor-invoice + fleet)
| Endpoint | Jadval | DDL? | Qayta-ishlat | Ish |
|---|---|---|---|---|
| GET /mm/vendor-invoices, /:id | vendor_invoices | ✅ | listVendorInvoices / select | S |
| PATCH /mm/vendor-invoices/:id/approve | vendor_invoices | ✅ | status+approved_by update | S |
| PATCH+POST /mm/vendor-invoices/:id/match | vendor_invoices | ✅ | PO+GR JOIN solishtir | M/S |
| GET /mm/three-way-match, /3way-match/:id, POST | vendor_invoices | ✅ | PO↔GR↔Invoice JOIN | M |
| GET /mm/fleet/deliveries, PATCH :id/status, POST | deliveries | ✅ | ow_deliveries pattern (Phase 4) | S |
| GET /mm/vehicles/locations | vehicle_locations | ✅ | getFleetVehicles select | S |
| GET /mm/driver/expenses | driver_expenses | ✅ | getFuelLogs filter | S |
| POST+PATCH /mm/vendor-invoices/:id/payment | ⚠️ fi_payments (money!) | DDL | GL posting pattern | M |
| GET /mm/fleet/maintenance | ⚠️ fleet_maintenance | DDL | createFleetVehicle pattern | M |
| GET /mm/materials/:id/suppliers | ⚠️ material_suppliers | DDL | getPriceHistory+vendors | M |

## MM — purchase-orders (hammasi ✅)
| GET+DELETE+PATCH /mm/purchase-orders/:id | mm_purchase_orders(+items) | ✅ | IMmRepository.getPurchaseOrder + softDelete/save | S/M |

## Finance (asosan #FX/DDL)
| GET /api/reports/production-efficiency | oee_records | ✅ | findProductionEfficiency (OEE agregat) | M |
| GET /finance/reports | ⚠️#FX financial_reports | DDL | financial-reports slice delegate | M |
| GET /finance/loans | ⚠️#FX loans+loan_payments | DDL | yangi LoansService | L |
| GET /finance-extended/tax-calendar | ⚠️#FX tax_calendar | DDL | seed + business.constants | M |
| GET /finance-extended/salary-benchmark/:id | ⚠️#FX salary_benchmark | DDL | finance-actions.repository | M |

## QC (🔴 echo-yolg'onlar + reads)
| Endpoint | Jadval | DDL? | Qayta-ishlat | Ish |
|---|---|---|---|---|
| GET /qc/control-charts | qc_parameters+qc_spc_data | 🔵#FX (jadval bor) | SpcService.getControlChart | M |
| GET /qc/braks/cost-impact | qc_braks | ✅ | Drizzle sum/groupBy | M |
| GET /qc/pending/qc | qc_inspections | ✅ | Drizzle select status=pending | S |
| 🔴 PATCH+POST /qc/approve/finance/:orderId | ⚠️ qc_approvals (yoki sales_orders.qc_finance_status) | DDL | ResolveDefectCommand pattern | M |
| 🔴 PATCH+POST /qc/approve/qc/:orderId | ⚠️ qc_inspections approved_by/at yoki qc_approvals | DDL | UPDATE | M |
| 🔴 PATCH+POST /qc/reject/:orderId | ⚠️ qc_inspections rejected_by/at/reason | DDL | UPDATE | M |
| 🔴 PATCH+POST /qc/inspector-submit/:orderId | qc_inspections+qc_defects | ✅ | ReportDefectCommand + INSERT/UPDATE | M |

## LMS (hammasi ✅)
| GET /video-progress | video_progress | ✅ | findVideoProgress (⚠️ustun drift: user_id/current_time) | S |
| GET /progress, /progress/user/:id | lms_enrollments | ✅ | findAllProgress/findProgressByUser | M |
| GET /modules | lms_modules | ✅ | findAllModules (findModuleById pattern) | S |

## PP (hammasi ✅)
| GET /technology/cards, /:id | technology_cards | ✅ | findTechCards / findOrderTechCard | S |
| POST /technology/cards/generate, /:id/optimize | technology_cards | ✅ | runAiCheck + INSERT/UPDATE | M |
| GET /production/orders | production_orders | ✅ | getOrder360Card JOIN'lar → list | M |

## POS (hammasi ✅, pos_stock_ledger)
| GET /pos/sales/daily | retail_pos_transactions | ✅ | CashRegisterService findByDate agregat | S |
| GET /pos/inventory/low-stock | stock_alerts | ✅ | StockLedgerService.getLowAlerts (delegate) | S |
| GET /pos/inventory/movements, /pos/stock/movements | pos_stock_ledger | ✅ | getLedgerHistory + paginate | S/M |
| GET /pos/inventory/monthly-report | pos_stock_ledger | ✅ | date_trunc month agregat | M |

## Compat (hammasi ✅)
| GET+PATCH /saas/tenants/:id/modules | saas_tenant_modules | ✅ | getTenantById + upsert | S/M |
| POST /saas/tenants/:id/onboard | saas_tenants+modules | ✅ | updateTenantStatus + upsert | L |
| GET+POST /orders-registry | orders_registry | ✅ | erp-extra.repository list/create | S/M |
| GET /europrint-control/menus/admin | role_menus | ✅ | SaasService.getMenus('admin') | S |

## Integration
| GET /integration/employee-complaints | sd_customer_complaints | ✅ | findEmployeeComplaints (list) | S |
| GET /integration/employee-assessment-skips | assessment_skips | ✅ | findEmployeeAssessmentSkips | S |
| GET /integration/employee-mentorships | mentorships | ✅ | findMentorships list | S |
| GET /integration/employee-mes-summary | production_facts | ✅ | findMesProduction agregat | M |
| GET /integration/employee-wms-summary | wms_transactions | ✅ | findWmsTransactions GROUP BY | M |
| GET /integration/invoice + POST | invoices | ✅ (AR/AP kanonik egasi tasdiqlasin) | list/insert finder | M |
| GET /integration/skill-gap | ⚠️ skill_gap_analysis | DDL | — | M |
| GET+POST /integration/expense | ⚠️ expenses | DDL | — | M |

## Design + Security
| GET /design/tooling | ow_cliches+ow_molds+ow_tech_cards | ✅ | UNION/agregat | M |
| POST /design/orders | design_orders | ✅ | RequestDesignCommand (kanonik) | S |
| GET /security/daily-summary | security_incidents+visitors+attendance+ppe_violations | ✅ | 4 manba agregat | M |
| GET /security/fire-sensors | iot_sensors (type fire) | ✅ | iot_sensors repo | S |
| GET /security/ppe-stats, /ppe-violations | ppe_violations | ✅ | ppe_violations GROUP BY / select | S |
| GET /design/notifications | ⚠️ design_notifications (yoki design_orders'dan derive) | DDL | — | M |
| GET+POST /design/orders/:id/messages | ⚠️ design_order_messages | DDL | CreateOrderMessageSchema | M |
| GET /design/tooling/:id/wear-forecast | ⚠️ ow_molds.usage_count/max_uses yoki tooling_wear | DDL | — | L |
| GET /security/ppe-checks | ⚠️ ppe_checks (yoki ppe_violations derive) | DDL | — | M |

## Misc (Marketing + material-balance + org-history)
| GET /marketing/inbox/conversations(+/:id/messages), exhibitions(+:id/leads/qr), ab-tests, settings, /marketing overview | social_*/exhibitions/marketing_* | ✅ | group2 list/insert patterns | S/M |
| POST /marketing/inbox/.../reply, /leads/:id/convert-to-crm, /leads/recalculate-scores | social_messages/crm_leads/marketing_leads | ✅ | CRM convert + lead-scoring | M |
| PATCH /marketing/website/blog/:id/publish, settings | blog_posts/marketing_settings | ✅ | UPDATE | S |
| GET /material-balance/movements | material_movements+warehouse_transactions | ✅ | getHistory (materialId siz) | M |
| GET /org-structure/nodes/:nodeId/history | audit_log (entity_type=org_node) | ✅ | org-queries select(entity_id) | M |
| POST /marketing/content/ai-generate, churn-risk/ai-signal | marketing_content/crm_leads | ✅/🔵 | AiContentService | M |
| GET+POST+PATCH+DELETE /marketing/pr | ⚠️ marketing_pr | DDL | group2 pattern | M |
| GET+POST+PATCH+DELETE /marketing/settings/social-api(+webhook) | ⚠️ social_api_settings | DDL | telegram adapter | M |
| /marketing/ai-assistant, /inbox/ai-reply, /blog/ai-generate | — | 🔵#FX | AiContentService | M |

---
> 🔵 Tahlil read-only edi. Ijro = bu reja bo'yicha, tartib bilan (QC-yolg'on → DDL-siz → DDL[egasi] → #FX[egasi]).
