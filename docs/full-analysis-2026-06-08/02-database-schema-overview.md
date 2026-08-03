# 02 — Ma'lumotlar Bazasi Sxema Inventari (Drizzle, canonical)

> **Hujjat turi:** REPORT-ONLY. Hech narsa o'zgartirilmadi.
> **Sana:** 2026-06-08
> **Manba:** `lib/db/src/schema/**` (canonical Drizzle sxema). Tahlil chegarasi 01-hisobotda.
> **Usul:** `lib/db/src/schema` ostidagi 96 ta `.ts` fayl tolerant parser bilan tahlil qilindi (`pgTable(...)` har bir ta'rifi: SQL nomi, ustunlar, tip, PK, FK, indeks). To'liq ustun-darajasidagi ma'lumot (har bir ustun + tip) `02-schema-columns.csv` hamroh faylida (8 110 qator).
> **Eslatma — backend superset:** `apps/api/src/shared/db` ichidagi mahalliy superset (455 `pgTable`) bu hisobotga **kiritilmagan** — u canonical bilan birga **03-hisobotda** (drift/duplikatlar) tahlil qilinadi.

---

## 1. Umumiy raqamlar

| Ko'rsatkich | Qiymat |
|---|---|
| Parser topgan `pgTable` ta'riflar (canonical) | **670** |
| `grep -o 'pgTable('` xom hisob | 697 (farq: izoh/helper/dinamik — quyida) |
| Jami ustunlar | **8110** |
| Sxema fayllari | **96** |
| Jami FK (`.references()`) | **785** |
| Bitta ustunli PK belgisi bo'lmagan jadvallar (composite PK ham yo'q) | **4** |
| Bir xil SQL nomli ta'riflar (collision) | **1** (`stock_ledger`) |

> **Parser vs grep farqi (697 → 670):** `grep` `pgTable(` matnini har joyda sanaydi (izohlar, helper funksiyalar, `.d.ts` namunalar). Parser faqat `export const X = pgTable(` yoki to'g'ri sintaksisdagi ta'riflarni oladi. 670 — ishonchli, deduplikatsiya qilinmagan ta'riflar soni.

### 1.1 Ustun tiplari taqsimoti

| Drizzle tip | Ustunlar soni |
|---|---|
| `varchar` | 2225 |
| `integer` | 1290 |
| `timestamp` | 1277 |
| `text` | 1179 |
| `numericMoney` | 575 |
| `serial` | 560 |
| `boolean` | 350 |
| `jsonb` | 180 |
| `decimal` | 126 |
| `date` | 120 |
| `numeric` | 101 |
| `uuid` | 96 |
| `real` | 4 |
| `bigserial` | 4 |
| `recruitmentFunnelStageEnum` | 2 |
| `inet` | 2 |
| `bigint` | 2 |
| `smallint` | 1 |
| `confirmStepEnum` | 1 |
| `confirmDecisionEnum` | 1 |
| `barcodeTypeEnum` | 1 |
| `stockAlertTypeEnum` | 1 |
| `stockAlertSeverityEnum` | 1 |
| `glStageNameEnum` | 1 |
| `glPostingStatusEnum` | 1 |
| `inventoryPlanStatusEnum` | 1 |
| `varianceTypeEnum` | 1 |
| `movementTypeEnum` | 1 |
| `movementStatusEnum` | 1 |
| `requestStatusEnum` | 1 |
| `liabilityStatusEnum` | 1 |
| `reservationStatusEnum` | 1 |
| `countStatusEnum` | 1 |
| `printStatusEnum` | 1 |

> `numericMoney` — maxsus pul tipi (`numeric-money.ts`), moliyaviy aniqlik uchun. `recruitmentFunnelStageEnum` va shu kabilar — `pgEnum` ustun sifatida.

---

## 2. Domen bo'yicha xulosa

| Domen | Jadvallar | Ustunlar |
|---|---|---|
| HR | 108 | 1298 |
| Sales / CRM / Marketing | 92 | 1168 |
| Production / QC (PP/MES) | 83 | 1223 |
| Inventory / Warehouse (MM/WMS) | 67 | 881 |
| Finance (FI) | 54 | 650 |
| POS | 43 | 582 |
| Core / Admin | 42 | 504 |
| LMS | 36 | 326 |
| Tasks / Kanban | 32 | 236 |
| SaaS / Security / Strategic | 28 | 289 |
| Orders / Workflow | 23 | 208 |
| Other | 20 | 310 |
| IoT | 15 | 169 |
| Communications | 14 | 133 |
| AI | 10 | 99 |
| Planning / Kaizen | 3 | 34 |

---

## 3. To'liq jadval inventari (domen bo'yicha)

Har bir qator: SQL jadval nomi, Drizzle o'zgaruvchi nomi, fayl:satr, ustunlar soni, PK bormi, FK soni, indeks soni. **Ustunlarning to'liq nomlari va tiplari** `02-schema-columns.csv` faylida.


### 3.1 HR (108)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `adaptation_programs` | adaptationPrograms | adaptation.ts:12 | 10 | ✓ | 0 | 0 |
| `adaptation_records` | adaptationRecords | adaptation.ts:25 | 19 | ✓ | 4 | 0 |
| `employee_360_assessments` | employee360Assessments | assessment.ts:12 | 16 | ✓ | 1 | 0 |
| `employee_strengths_weaknesses` | employeeStrengthsWeaknesses | assessment.ts:35 | 13 | ✓ | 1 | 0 |
| `succession_plans` | successionPlans | assessment.ts:54 | 11 | ✓ | 2 | 0 |
| `employee_transfer_history` | employeeTransferHistory | assessment.ts:72 | 15 | ✓ | 1 | 0 |
| `exit_interviews` | exitInterviews | assessment.ts:90 | 17 | ✓ | 1 | 0 |
| `attendance` | attendance | attendance.ts:12 | 24 | ✓ | 1 | 4 |
| `attendance_records` | attendanceRecords | attendance.ts:52 | 10 | ✓ | 1 | 3 |
| `daily_attendance_summary` | dailyAttendanceSummary | attendance.ts:70 | 11 | ✓ | 0 | 1 |
| `abc_analysis` | abcAnalysis | attendance.ts:86 | 18 | ✓ | 1 | 1 |
| `departments` | departments | departments.ts:10 | 23 | ✓ | 0 | 3 |
| `discipline_records` | disciplineRecords | discipline.ts:12 | 27 | ✓ | 1 | 0 |
| `discipline_appeals` | disciplineAppeals | discipline.ts:49 | 12 | ✓ | 2 | 0 |
| `employees` | employees | employees.ts:14 | 53 | ✓ | 4 | 8 |
| `employment_contracts` | employmentContracts | employees.ts:88 | 20 | ✓ | 1 | 2 |
| `employee_passports` | employeePassports | employees.ts:116 | 11 | ✓ | 1 | 0 |
| `employee_bank_accounts` | employeeBankAccounts | employees.ts:130 | 11 | ✓ | 1 | 1 |
| `employee_emergency_contacts` | employeeEmergencyContacts | employees.ts:146 | 9 | ✓ | 1 | 1 |
| `employee_files` | employeeFiles | employees.ts:160 | 10 | ✓ | 1 | 2 |
| `career_development_plans` | careerDevelopmentPlans | hr-architecture-additions.ts:55 | 13 | ✓ | 3 | 2 |
| `ai_interview_sessions_ext` | aiInterviewSessionsExt | hr-architecture-additions.ts:79 | 14 | ✓ | 0 | 1 |
| `employee_ideas` | employeeIdeas | hr-compensation.ts:58 | 3 | ✓ | 1 | 0 |
| `hr_ai_attendance` | hrAiAttendance | hr-goals.ts:12 | 9 | ✓ | 0 | 1 |
| `hr_employee_goals` | hrEmployeeGoals | hr-goals.ts:25 | 12 | ✓ | 0 | 1 |
| `hr_late_arrivals` | hrLateArrivals | hr-goals.ts:41 | 12 | ✓ | 0 | 1 |
| `hr_health_alerts` | hrHealthAlerts | hr-goals.ts:57 | 12 | ✓ | 0 | 1 |
| `hr_user_blocks` | hrUserBlocks | hr-goals.ts:73 | 8 | — | 0 | 0 |
| `hr_employee_one_on_ones` | hrEmployeeOneOnOnes | hr-goals.ts:85 | 10 | ✓ | 0 | 1 |
| `hr_onboarding_processes` | hrOnboardingProcesses | hr-goals.ts:99 | 16 | ✓ | 0 | 0 |
| `hr_onboarding_milestones` | hrOnboardingMilestones | hr-goals.ts:119 | 11 | ✓ | 0 | 0 |
| `employee_balances` | employeeBalances | hr-goals.ts:134 | 11 | ✓ | 0 | 0 |
| `employee_monthly_cards` | employeeMonthlyCards | hr-goals.ts:149 | 15 | ✓ | 0 | 1 |
| `overtime_policy` | overtimePolicy | hr-overtime-schema.ts:39 | 13 | ✓ | 0 | 1 |
| `employee_separation` | employeeSeparation | hr-overtime-schema.ts:87 | 8 | ✓ | 0 | 1 |
| `hr_leave_balances` | hrLeaveBalances | hr-overtime-schema.ts:108 | 8 | ✓ | 0 | 0 |
| `adaptation_feedback` | adaptationFeedback | hr-performance-core.ts:26 | 4 | ✓ | 1 | 0 |
| `employee_work_centers` | employeeWorkCenters | hr-performance-core.ts:72 | 4 | ✓ | 2 | 0 |
| `employee_face_encodings` | employeeFaceEncodings | hr-performance-core.ts:95 | 5 | ✓ | 1 | 0 |
| `face_recognition_logs` | faceRecognitionLogs | hr-performance-ext.ts:14 | 8 | ✓ | 3 | 0 |
| `position_skill_requirements` | positionSkillRequirements | hr-performance-ext.ts:57 | 14 | ✓ | 0 | 0 |
| `shift_requirements` | shiftRequirements | hr-performance-ext.ts:96 | 10 | ✓ | 0 | 0 |
| `shift_handovers` | shiftHandovers | hr-performance-ext.ts:121 | 15 | ✓ | 0 | 0 |
| `certificates` | certificates | hr-questionnaire.ts:19 | 9 | ✓ | 1 | 0 |
| `questionnaire_responses` | questionnaireResponses | hr-questionnaire.ts:37 | 2 | ✓ | 1 | 0 |
| `hr_candidate_funnels` | hrCandidateFunnels | hr-recruiter.ts:147 | 11 | ✓ | 2 | 3 |
| `hr_funnel_history` | hrFunnelHistory | hr-recruiter.ts:194 | 9 | ✓ | 2 | 0 |
| `hr_tool_test_results` | hrToolTestResults | hr-recruiter.ts:213 | 7 | ✓ | 3 | 0 |
| `hr_productivity_interviews` | hrProductivityInterviews | hr-recruiter.ts:256 | 4 | ✓ | 3 | 5 |
| `hr_onboarding_plans` | hrOnboardingPlans | hr-recruiter.ts:315 | 13 | ✓ | 3 | 0 |
| `hr_employee_onboardings` | hrEmployeeOnboardings | hr-recruiter.ts:363 | 9 | ✓ | 3 | 1 |
| `hr_job_descriptions` | hrJobDescriptions | hr-recruiter.ts:405 | 11 | ✓ | 3 | 1 |
| `hr_weekly_statistics` | hrWeeklyStatistics | hr-recruiter.ts:533 | 12 | ✓ | 1 | 1 |
| `hr_references_checks` | hrReferencesChecks | hr-recruiter.ts:573 | 5 | ✓ | 2 | 2 |
| `employee_career_profiles` | employeeCareerProfiles | hr-safety.ts:25 | 10 | ✓ | 1 | 0 |
| `hr_capital_profiles` | hrCapitalProfiles | hr-safety.ts:45 | 9 | ✓ | 1 | 0 |
| `hr_conflict_reports` | hrConflictReports | hr-safety.ts:73 | 7 | ✓ | 0 | 0 |
| `notification_logs` | notificationLogs | hr-safety.ts:95 | 10 | ✓ | 0 | 0 |
| `employee_comparison_logs` | employeeComparisonLogs | hr-transfers.ts:20 | 5 | ✓ | 3 | 0 |
| `face_embeddings` | faceEmbeddings | hr-transfers.ts:50 | 4 | ✓ | 1 | 0 |
| `hr_tz2_territory_logs` | hrTz2TerritoryLogs | hr-tz2-schema.ts:66 | 9 | ✓ | 1 | 2 |
| `hr_tz2_attendance_photos` | hrTz2AttendancePhotos | hr-tz2-schema.ts:100 | 9 | ✓ | 1 | 2 |
| `hr_tz2_ai_question_banks` | hrTz2AiQuestionBanks | hr-tz2-schema.ts:132 | 15 | ✓ | 1 | 3 |
| `hr_tz2_room_reference_photos` | hrTz2RoomReferencePhotos | hr-tz2-schema.ts:164 | 10 | ✓ | 0 | 1 |
| `hr_tz2_ai_room_analysis` | hrTz2AiRoomAnalysis | hr-tz2-schema.ts:191 | 13 | ✓ | 1 | 2 |
| `hr_tz2_internal_job_postings` | hrTz2InternalJobPostings | hr-tz2-schema.ts:230 | 15 | ✓ | 2 | 3 |
| `hr_tz2_internal_applications` | hrTz2InternalApplications | hr-tz2-schema.ts:265 | 9 | ✓ | 2 | 3 |
| `hr_tz2_talent_pool` | hrTz2TalentPool | hr-tz2-schema.ts:295 | 13 | ✓ | 2 | 2 |
| `hr_tz2_contract_versions` | hrTz2ContractVersions | hr-tz2-schema.ts:327 | 17 | ✓ | 3 | 2 |
| `hr_tz2_signed_policies` | hrTz2SignedPolicies | hr-tz2-schema.ts:371 | 10 | ✓ | 1 | 2 |
| `hr_tz2_recruiter_kpi_daily` | hrTz2RecruiterKpiDaily | hr-tz2-schema.ts:402 | 13 | ✓ | 1 | 2 |
| `hr_tz2_monthly_employee_cards` | hrTz2MonthlyEmployeeCards | hr-tz2-schema.ts:437 | 23 | ✓ | 1 | 2 |
| `violation_catalog` | violationCatalog | hr-v2-schema.ts:24 | 12 | ✓ | 0 | 0 |
| `absence_tracking` | absenceTracking | hr-v2-schema.ts:42 | 11 | ✓ | 1 | 0 |
| `employee_blocks` | employeeBlocks | hr-v2-schema.ts:57 | 9 | ✓ | 1 | 0 |
| `badge_catalog` | badgeCatalog | hr-v2-schema.ts:70 | 11 | ✓ | 0 | 0 |
| `employee_badges` | employeeBadges | hr-v2-schema.ts:85 | 6 | ✓ | 1 | 0 |
| `gamification_points` | gamificationPoints | hr-v2-schema.ts:95 | 7 | ✓ | 1 | 0 |
| `gamification_totals` | gamificationTotals | hr-v2-schema.ts:106 | 6 | ✓ | 1 | 0 |
| `hr_daily_reports` | hrDailyReports | hr-v2-schema.ts:116 | 12 | ✓ | 1 | 0 |
| `hr_daily_report_audit` | hrDailyReportAudit | hr-v2-schema.ts:135 | 7 | ✓ | 0 | 0 |
| `career_paths` | careerPaths | hr-v2-schema.ts:146 | 13 | ✓ | 3 | 0 |
| `career_path_steps` | careerPathSteps | hr-v2-schema.ts:166 | 10 | ✓ | 2 | 0 |
| `skill_catalog` | skillCatalog | hr-v2-schema.ts:180 | 8 | ✓ | 0 | 0 |
| `employee_skill_scores` | employeeSkillScores | hr-v2-schema.ts:192 | 7 | ✓ | 1 | 1 |
| `enps_surveys` | enpsSurveys | hr-v2-schema.ts:207 | 10 | ✓ | 0 | 0 |
| `enps_responses` | enpsResponses | hr-v2-schema.ts:224 | 7 | ✓ | 2 | 0 |
| `pip_plans` | pipPlans | hr-v2-schema.ts:235 | 14 | ✓ | 1 | 0 |
| `pip_progress_updates` | pipProgressUpdates | hr-v2-schema.ts:256 | 6 | ✓ | 1 | 0 |
| `visitor_log` | visitorLog | hr-v2-schema.ts:266 | 15 | ✓ | 1 | 0 |
| `workflow_route_configs` | documentWorkflowRoutes | hr-v2-schema.ts:288 | 6 | ✓ | 0 | 0 |
| `hr_documents` | hrDocuments | hr-v2-schema.ts:297 | 12 | ✓ | 1 | 0 |
| `document_approval_steps` | documentApprovalSteps | hr-v2-schema.ts:312 | 9 | ✓ | 1 | 0 |
| `document_signatures` | documentSignatures | hr-v2-schema.ts:324 | 6 | ✓ | 1 | 0 |
| `hr_interview_sessions` | hrInterviewSessions | hr-v2-schema.ts:334 | 23 | ✓ | 0 | 0 |
| `hr_interview_questions` | hrInterviewQuestions | hr-v2-schema.ts:364 | 13 | ✓ | 0 | 0 |
| `offboarding_cases` | offboardingCases | hr-v2-schema.ts:383 | 17 | ✓ | 0 | 0 |
| `offboarding_checklist_items` | offboardingChecklistItems | hr-v2-schema.ts:407 | 11 | ✓ | 0 | 0 |
| `shift_schedules` | shiftSchedules | hr-v2-schema.ts:422 | 9 | ✓ | 1 | 0 |
| `vacancies` | vacancies | recruitment.ts:12 | 42 | ✓ | 0 | 0 |
| `candidates` | candidates | recruitment.ts:66 | 29 | ✓ | 1 | 0 |
| `interviews` | interviews | recruitment.ts:106 | 16 | ✓ | 2 | 0 |
| `job_templates` | jobTemplates | recruitment.ts:129 | 11 | ✓ | 0 | 0 |
| `questionnaire_templates` | questionnaireTemplates | recruitment.ts:143 | 8 | ✓ | 0 | 0 |
| `questionnaire_questions` | questionnaireQuestions | recruitment.ts:154 | 10 | ✓ | 1 | 0 |
| `ai_cv_screenings` | aiCvScreenings | recruitment.ts:167 | 14 | ✓ | 2 | 0 |
| `ai_interview_sessions` | aiInterviewSessions | recruitment.ts:184 | 15 | ✓ | 2 | 0 |
| `ai_interview_messages` | aiInterviewMessages | recruitment.ts:202 | 8 | ✓ | 1 | 0 |

### 3.2 Sales / CRM / Marketing (92)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `crm_comments` | crmComments | crm-activities.ts:60 | 7 | ✓ | 1 | 0 |
| `crm_entity_history` | crmEntityHistory | crm-activities.ts:95 | 9 | ✓ | 1 | 0 |
| `crm_invoice_stages` | crmInvoiceStages | crm-activities.ts:132 | 7 | ✓ | 0 | 0 |
| `crm_followup_activities` | crmFollowupActivities | crm-activities.ts:160 | 8 | ✓ | 1 | 0 |
| `crm_leads` | crmLeads | crm-contacts.ts:21 | 25 | ✓ | 2 | 8 |
| `crm_contacts` | crmContacts | crm-contacts.ts:124 | 25 | ✓ | 2 | 5 |
| `crm_contact_companies` | crmContactCompanies | crm-contacts.ts:211 | 5 | ✓ | 2 | 0 |
| `customer_contacts` | customerContacts | crm-contacts.ts:341 | 10 | ✓ | 1 | 1 |
| `crm_product_categories` | crmProductCategories | crm-deal-products.ts:16 | 6 | ✓ | 0 | 0 |
| `crm_deal_products` | crmDealProducts | crm-deal-products.ts:72 | 16 | ✓ | 1 | 0 |
| `crm_activities` | crmActivities | crm-deal-products.ts:112 | 9 | ✓ | 1 | 0 |
| `crm_lead_stages` | crmLeadStages | crm-deal-products.ts:177 | 7 | ✓ | 0 | 0 |
| `crm_watchers` | crmWatchers | crm-docs.ts:32 | 5 | ✓ | 1 | 0 |
| `crm_custom_fields` | crmCustomFields | crm-docs.ts:57 | 9 | ✓ | 0 | 0 |
| `crm_robots` | crmRobots | crm-docs.ts:93 | 8 | ✓ | 0 | 0 |
| `crm_documents` | crmDocuments | crm-docs.ts:136 | 9 | ✓ | 1 | 0 |
| `customer_interactions` | customerInteractions | crm-pipelines.ts:17 | 13 | ✓ | 2 | 4 |
| `customer_documents` | customerDocuments | crm-pipelines.ts:47 | 7 | ✓ | 2 | 2 |
| `customer_complaints` | customerComplaints | crm-pipelines.ts:67 | 12 | ✓ | 2 | 3 |
| `customer_competitors` | customerCompetitors | crm-pipelines.ts:99 | 8 | ✓ | 2 | 1 |
| `crm_pipelines` | crmPipelines | crm-pipelines.ts:140 | 6 | ✓ | 0 | 0 |
| `crm_stages` | crmStages | crm-pipelines.ts:164 | 6 | ✓ | 0 | 2 |
| `crm_deals` | crmDeals | crm-pipelines.ts:199 | 31 | ✓ | 2 | 12 |
| `crm_proposal_products` | crmProposalProducts | crm-proposals.ts:89 | 12 | ✓ | 2 | 0 |
| `crm_invoices` | crmInvoices | crm-proposals.ts:124 | 17 | ✓ | 4 | 0 |
| `crm_invoice_products` | crmInvoiceProducts | crm-proposals.ts:191 | 13 | ✓ | 2 | 0 |
| `crm_invoice_payments` | crmInvoicePayments | crm-proposals.ts:224 | 10 | ✓ | 2 | 0 |
| `public_products` | publicProducts | ecommerce-schema.ts:16 | 20 | ✓ | 2 | 0 |
| `customer_accounts` | customerAccounts | ecommerce-schema.ts:55 | 15 | ✓ | 1 | 0 |
| `customer_orders` | customerOrders | ecommerce-schema.ts:84 | 16 | ✓ | 3 | 0 |
| `portfolio_items` | portfolioItems | ecommerce-schema.ts:125 | 12 | ✓ | 1 | 0 |
| `website_pages` | websitePages | ecommerce-schema.ts:154 | 11 | ✓ | 0 | 0 |
| `website_banners` | websiteBanners | ecommerce-schema.ts:179 | 15 | ✓ | 0 | 0 |
| `website_settings` | websiteSettings | ecommerce-schema.ts:209 | 7 | ✓ | 0 | 0 |
| `public_categories` | publicCategories | ecommerce-schema.ts:228 | 13 | ✓ | 0 | 0 |
| `customer_order_items` | customerOrderItems | ecommerce-schema.ts:250 | 12 | ✓ | 2 | 0 |
| `product_favorites` | productFavorites | ecommerce-schema.ts:271 | 4 | ✓ | 2 | 0 |
| `website_reviews` | websiteReviews | ecommerce-schema.ts:287 | 12 | ✓ | 3 | 0 |
| `website_chat_logs` | websiteChatLogs | ecommerce-schema.ts:308 | 7 | ✓ | 1 | 0 |
| `marketing_campaigns` | marketingCampaigns | marketing-schema.ts:16 | 13 | ✓ | 0 | 0 |
| `marketing_content` | marketingContent | marketing-schema.ts:58 | 12 | ✓ | 0 | 0 |
| `marketing_ads` | marketingAds | marketing-schema.ts:93 | 16 | ✓ | 1 | 0 |
| `marketing_leads` | marketingLeads | marketing-schema.ts:139 | 19 | ✓ | 0 | 0 |
| `content_calendar` | contentCalendar | marketing-schema.ts:179 | 13 | ✓ | 0 | 0 |
| `exhibitions` | exhibitions | marketing-schema.ts:210 | 23 | ✓ | 0 | 0 |
| `exhibition_leads` | exhibitionLeads | marketing-schema.ts:259 | 13 | ✓ | 0 | 0 |
| `pr_activities` | prActivities | marketing-schema.ts:287 | 16 | ✓ | 0 | 0 |
| `marketing_budget_items` | marketingBudgetItems | marketing-schema.ts:324 | 10 | ✓ | 0 | 0 |
| `social_conversations` | socialConversations | marketing-schema.ts:358 | 19 | ✓ | 0 | 0 |
| `social_messages` | socialMessages | marketing-schema.ts:396 | 13 | ✓ | 0 | 0 |
| `social_api_configs` | socialApiConfigs | marketing-schema.ts:426 | 11 | ✓ | 0 | 0 |
| `content_posts` | contentPosts | marketing-schema.ts:452 | 19 | ✓ | 0 | 0 |
| `blog_posts` | blogPosts | marketing-schema.ts:486 | 18 | ✓ | 0 | 0 |
| `marketing_budget_lines` | marketingBudgetLines | marketing-schema.ts:520 | 9 | ✓ | 0 | 0 |
| `marketing_settings` | marketingSettings | marketing-schema.ts:552 | 6 | ✓ | 0 | 0 |
| `nps_responses` | npsResponses | marketing-schema.ts:573 | 5 | ✓ | 0 | 0 |
| `marketing_ab_tests` | marketingAbTests | marketing-schema.ts:594 | 17 | ✓ | 0 | 0 |
| `marketing_lead_contacts` | marketingLeadContacts | marketing-schema.ts:630 | 7 | ✓ | 0 | 0 |
| `customer_credit_limits` | customerCreditLimits | sd-billing.ts:36 | 15 | ✓ | 2 | 0 |
| `credit_check_logs` | creditCheckLogs | sd-billing.ts:66 | 9 | ✓ | 2 | 0 |
| `sales_targets` | salesTargets | sd-billing.ts:84 | 18 | ✓ | 2 | 0 |
| `daily_target_tracking` | dailyTargetTracking | sd-billing.ts:121 | 9 | ✓ | 1 | 0 |
| `commission_rules` | commissionRules | sd-billing.ts:139 | 16 | ✓ | 1 | 0 |
| `commission_calculations` | commissionCalculations | sd-billing.ts:173 | 17 | ✓ | 3 | 0 |
| `order_commissions` | orderCommissions | sd-billing.ts:197 | 8 | ✓ | 3 | 0 |
| `sales_forecasts` | salesForecasts | sd-billing.ts:214 | 14 | ✓ | 1 | 0 |
| `sd_customer_contacts` | sdCustomerContacts | sd-customer-relations.ts:36 | 16 | ✓ | 1 | 3 |
| `sd_customer_interactions` | sdCustomerInteractions | sd-customer-relations.ts:83 | 13 | ✓ | 1 | 4 |
| `sd_customer_documents` | sdCustomerDocuments | sd-customer-relations.ts:136 | 9 | ✓ | 1 | 3 |
| `sd_customer_competitors` | sdCustomerCompetitors | sd-customer-relations.ts:179 | 8 | ✓ | 1 | 1 |
| `sd_customer_complaints` | sdCustomerComplaints | sd-customer-relations.ts:219 | 8 | ✓ | 1 | 3 |
| `deliveries` | deliveries | sd-delivery.ts:18 | 12 | ✓ | 2 | 4 |
| `delivery_items` | deliveryItems | sd-delivery.ts:74 | 13 | ✓ | 3 | 3 |
| `billing_documents` | billingDocuments | sd-delivery.ts:115 | 13 | ✓ | 2 | 4 |
| `billing_items` | billingItems | sd-delivery.ts:176 | 14 | ✓ | 4 | 2 |
| `quotations` | quotations | sd-delivery.ts:222 | 12 | ✓ | 0 | 3 |
| `sd_customers` | sdCustomers | sd-europrint-schema.ts:20 | 16 | ✓ | 0 | 0 |
| `sd_contacts` | sdContacts | sd-europrint-schema.ts:71 | 9 | ✓ | 1 | 0 |
| `sd_leads` | sdLeads | sd-europrint-schema.ts:91 | 20 | ✓ | 1 | 0 |
| `sd_lead_activities` | sdLeadActivities | sd-europrint-schema.ts:132 | 5 | ✓ | 1 | 0 |
| `sd_price_formulas` | sdPriceFormulas | sd-europrint-schema.ts:151 | 1 | ✓ | 0 | 0 |
| `sd_quotations` | sdQuotations | sd-europrint-schema.ts:205 | 15 | ✓ | 2 | 0 |
| `sd_quotation_items` | sdQuotationItems | sd-europrint-schema.ts:236 | 22 | ✓ | 1 | 0 |
| `sd_orders` | sdOrders | sd-europrint-schema.ts:274 | 44 | ✓ | 2 | 0 |
| `sd_order_timeline` | sdOrderTimeline | sd-europrint-schema.ts:343 | 6 | ✓ | 0 | 0 |
| `sd_payments` | sdPayments | sd-europrint-schema.ts:355 | 12 | ✓ | 2 | 0 |
| `sd_storage_fees` | sdStorageFees | sd-europrint-schema.ts:386 | 12 | ✓ | 1 | 0 |
| `sd_contracts` | sdContracts | sd-europrint-schema.ts:404 | 13 | ✓ | 0 | 0 |
| `sd_manager_quotas` | sdManagerQuotas | sd-europrint-schema.ts:432 | 8 | ✓ | 0 | 0 |
| `order_status_logs` | orderStatusLogs | sd-order-items.ts:166 | 9 | ✓ | 2 | 0 |
| `sales_order_items` | salesOrderItems | sd-order-items.ts:181 | 14 | ✓ | 1 | 0 |
| `sales_orders` | salesOrders | sd-orders.ts:92 | 35 | ✓ | 0 | 8 |

### 3.3 Production / QC (PP/MES) (83)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `mes_tasks` | mesTasks | mes-schema.ts:20 | 10 | ✓ | 0 | 3 |
| `mes_papka_orders` | mesPapkaOrders | mes-schema.ts:54 | 15 | ✓ | 0 | 3 |
| `mes_shift_handovers` | mesShiftHandovers | mes-schema.ts:92 | 6 | ✓ | 0 | 2 |
| `mes_shift_evaluations` | mesShiftEvaluations | mes-schema.ts:121 | 8 | ✓ | 0 | 2 |
| `mes_maintenance_tasks` | mesMaintenanceTasks | mes-schema.ts:155 | 10 | ✓ | 0 | 2 |
| `mes_production_sessions` | mesProductionSessions | mes-schema.ts:179 | 13 | ✓ | 0 | 3 |
| `mes_shift_stats` | mesShiftStats | mes-schema.ts:207 | 9 | ✓ | 0 | 2 |
| `design_orders` | designOrders | pp/pp-design.ts:22 | 31 | ✓ | 4 | 0 |
| `brand_templates` | brandTemplates | pp/pp-design.ts:77 | 18 | ✓ | 1 | 0 |
| `designs` | designs | pp/pp-design.ts:108 | 20 | ✓ | 4 | 0 |
| `designOrderMessages` | designOrderMessages | pp/pp-design.ts:144 | 10 | ✓ | 2 | 0 |
| `designOrderNotifications` | designOrderNotifications | pp/pp-design.ts:170 | 9 | ✓ | 2 | 0 |
| `design_comments` | designComments | pp/pp-design.ts:196 | 7 | ✓ | 2 | 0 |
| `design_tooling` | designTooling | pp/pp-design.ts:219 | 20 | ✓ | 1 | 0 |
| `machine_crews` | machineCrews | pp/pp-enhanced.ts:20 | 13 | ✓ | 1 | 0 |
| `setup_checklists` | setupChecklists | pp/pp-enhanced.ts:43 | 14 | ✓ | 3 | 0 |
| `checklist_items` | checklistItems | pp/pp-enhanced.ts:65 | 13 | ✓ | 1 | 0 |
| `material_consumption` | materialConsumption | pp/pp-enhanced.ts:86 | 15 | ✓ | 4 | 0 |
| `defect_reports` | defectReports | pp/pp-enhanced.ts:109 | 14 | ✓ | 2 | 0 |
| `bom_templates` | bomTemplates | pp/pp-enhanced.ts:131 | 9 | ✓ | 0 | 0 |
| `technology_cards` | technologyCards | pp/pp-enhanced.ts:146 | 18 | ✓ | 2 | 0 |
| `material_norms` | materialNorms | pp/pp-enhanced.ts:172 | 19 | ✓ | 4 | 0 |
| `order_production_history` | orderProductionHistory | pp/pp-enhanced.ts:199 | 32 | ✓ | 3 | 0 |
| `asset_inventory` | assetInventory | pp/pp-enhanced.ts:239 | 21 | ✓ | 1 | 0 |
| `product_categories` | productCategories | pp/pp-enhanced.ts:283 | 13 | ✓ | 0 | 0 |
| `product_masters` | productMasters | pp/pp-enhanced.ts:308 | 23 | ✓ | 3 | 0 |
| `order_approvals` | orderApprovals | pp/pp-enhanced.ts:339 | 22 | ✓ | 2 | 0 |
| `waste_records` | wasteRecords | pp/pp-enhanced.ts:376 | 19 | ✓ | 0 | 0 |
| `waste_targets` | wasteTargets | pp/pp-enhanced.ts:400 | 9 | ✓ | 0 | 0 |
| `oee_records` | oeeRecords | pp/pp-enhanced.ts:431 | 16 | ✓ | 0 | 0 |
| `ai_production_plans` | aiProductionPlans | pp/pp-enhanced.ts:455 | 19 | ✓ | 0 | 0 |
| `ai_planning_decisions` | aiPlanningDecisions | pp/pp-enhanced.ts:477 | 9 | ✓ | 1 | 0 |
| `ai_planning_config` | aiPlanningConfig | pp/pp-enhanced.ts:489 | 10 | ✓ | 0 | 0 |
| `equipment_maintenance` | equipmentMaintenance | pp/pp-enhanced.ts:516 | 16 | ✓ | 0 | 0 |
| `sos_alerts` | sosAlerts | pp/pp-enhanced.ts:551 | 11 | ✓ | 1 | 0 |
| `asset_maintenance_records` | assetMaintenanceRecords | pp/pp-enhanced.ts:573 | 13 | ✓ | 1 | 0 |
| `asset_insurance` | assetInsurance | pp/pp-enhanced.ts:616 | 13 | ✓ | 1 | 0 |
| `sensor_devices` | sensorDevices | pp/pp-iot.ts:15 | 17 | ✓ | 2 | 0 |
| `production_sessions` | productionSessions | pp/pp-iot.ts:51 | 33 | ✓ | 4 | 0 |
| `sensor_readings` | sensorReadings | pp/pp-iot.ts:101 | 6 | ✓ | 2 | 0 |
| `downtime_events` | downtimeEvents | pp/pp-iot.ts:113 | 16 | ✓ | 2 | 0 |
| `worker_session_events` | workerSessionEvents | pp/pp-iot.ts:149 | 10 | ✓ | 2 | 0 |
| `oee_snapshots` | oeeSnapshots | pp/pp-iot.ts:175 | 18 | ✓ | 1 | 0 |
| `downtime_reason_codes` | downtimeReasonCodes | pp/pp-iot.ts:201 | 9 | ✓ | 0 | 0 |
| `papka_orders` | papkaOrders | pp/pp-papka.ts:16 | 35 | ✓ | 5 | 0 |
| `excel_import_batches` | excelImportBatches | pp/pp-papka.ts:68 | 15 | ✓ | 0 | 0 |
| `excel_source_columns` | excelSourceColumns | pp/pp-papka.ts:100 | 11 | ✓ | 1 | 0 |
| `excel_import_rows` | excelImportRows | pp/pp-papka.ts:117 | 11 | ✓ | 1 | 0 |
| `formula_definitions` | formulaDefinitions | pp/pp-papka.ts:134 | 19 | ✓ | 0 | 0 |
| `formula_calculations` | formulaCalculations | pp/pp-papka.ts:167 | 12 | ✓ | 3 | 0 |
| `planning_operations` | planningOperations | pp/pp-papka.ts:185 | 24 | ✓ | 3 | 0 |
| `production_facts` | productionFacts | pp/pp-papka.ts:225 | 21 | ✓ | 3 | 0 |
| `machine_tasks` | machineTasks | pp/pp-papka.ts:259 | 24 | ✓ | 7 | 0 |
| `production_facts_sm72` | productionFactsSM72 | pp/pp-production.ts:19 | 10 | ✓ | 1 | 4 |
| `work_centers` | workCenters | pp/pp-production.ts:48 | 8 | ✓ | 1 | 30 |
| `products` | products | pp/pp-production.ts:98 | 10 | ✓ | 0 | 3 |
| `orders` | orders | pp/pp-production.ts:125 | 12 | ✓ | 2 | 6 |
| `production_plan_header` | productionPlanHeader | pp/pp-production.ts:160 | 12 | ✓ | 0 | 4 |
| `production_plan_lines` | productionPlanLines | pp/pp-production.ts:193 | 9 | ✓ | 0 | 4 |
| `production_fact` | productionFact | pp/pp-production.ts:218 | 15 | ✓ | 0 | 6 |
| `downtime_logs` | downtimeLogs | pp/pp-production.ts:255 | 12 | ✓ | 1 | 4 |
| `bom_headers` | bomHeaders | pp/pp-production.ts:286 | 15 | ✓ | 2 | 3 |
| `bom_items` | bomItems | pp/pp-production.ts:323 | 14 | ✓ | 1 | 3 |
| `routings` | routings | pp/pp-production.ts:365 | 16 | ✓ | 2 | 3 |
| `routing_operations` | routingOperations | pp/pp-production.ts:402 | 19 | ✓ | 2 | 3 |
| `production_orders` | productionOrders | pp/pp-production.ts:446 | 35 | ✓ | 6 | 6 |
| `production_order_operations` | productionOrderOperations | pp/pp-production.ts:510 | 11 | ✓ | 3 | 3 |
| `production_order_components` | productionOrderComponents | pp/pp-production.ts:541 | 6 | ✓ | 2 | 3 |
| `work_center_capacity` | workCenterCapacity | pp/pp-production.ts:569 | 15 | ✓ | 1 | 2 |
| `shift_calendars` | shiftCalendars | pp/pp-production.ts:604 | 15 | ✓ | 1 | 3 |
| `mrp_runs` | mrpRuns | pp/pp-production.ts:645 | 13 | ✓ | 0 | 3 |
| `mrp_results` | mrpResults | pp/pp-production.ts:677 | 14 | ✓ | 2 | 5 |
| `equipment` | equipment | pp/pp-production.ts:718 | 24 | ✓ | 1 | 5 |
| `shift_evaluations` | shiftEvaluations | pp/pp-production.ts:764 | 14 | ✓ | 0 | 2 |
| `production_qc_checks` | productionQcChecks | pp/pp-production.ts:794 | 11 | ✓ | 1 | 3 |
| `production_status_history` | productionStatusHistory | pp/pp-production.ts:822 | 7 | ✓ | 1 | 3 |
| `qc_standards` | qcStandards | qc-schema.ts:22 | 8 | ✓ | 0 | 0 |
| `qc_parameter_definitions` | qcParameterDefinitions | qc-schema.ts:44 | 2 | ✓ | 0 | 0 |
| `qc_material_tests` | qcMaterialTests | qc-schema.ts:71 | 7 | ✓ | 1 | 0 |
| `qc_reclamations` | qcReclamations | qc-schema.ts:205 | 28 | ✓ | 2 | 0 |
| `qc_braks` | qcBraks | qc-schema.ts:257 | 15 | ✓ | 3 | 0 |
| `qc_supplier_quality` | qcSupplierQuality | qc-schema.ts:293 | 11 | ✓ | 1 | 0 |
| `inline_qc_checks` | inlineQcChecks | qc-schema.ts:319 | 7 | ✓ | 0 | 0 |

### 3.4 Inventory / Warehouse (MM/WMS) (67)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `stock_reservations` | stockReservations | mm-batch-mgmt.ts:31 | 21 | ✓ | 4 | 5 |
| `material_categories` | materialCategories | mm-batch-mgmt.ts:80 | 2 | ✓ | 0 | 0 |
| `material_kits` | materialKits | mm-batch-mgmt.ts:93 | 8 | ✓ | 4 | 9 |
| `material_kit_items` | materialKitItems | mm-batch-mgmt.ts:130 | 12 | ✓ | 3 | 3 |
| `material_inventory_valuations` | materialInventoryValuations | mm-batch-mgmt.ts:206 | 12 | ✓ | 3 | 4 |
| `ai_material_insights` | aiMaterialInsights | mm-inventory.ts:18 | 13 | ✓ | 3 | 4 |
| `inventory_counts` | inventoryCounts | mm-inventory.ts:65 | 25 | ✓ | 2 | 4 |
| `inventory_count_lines` | inventoryCountLines | mm-inventory.ts:126 | 15 | ✓ | 3 | 4 |
| `ai_reservation_requests` | aiReservationRequests | mm-inventory.ts:166 | 17 | ✓ | 1 | 3 |
| `ai_material_batches` | aiMaterialBatches | mm-inventory.ts:195 | 17 | ✓ | 0 | 4 |
| `material_barcodes` | materialBarcodes | mm-inventory.ts:242 | 30 | ✓ | 6 | 6 |
| `production_consumption` | productionConsumption | mm-inventory.ts:297 | 16 | ✓ | 2 | 4 |
| `vendor_performance_metrics` | vendorPerformanceMetrics | mm-logistics.ts:32 | 16 | ✓ | 1 | 0 |
| `vehicle_locations` | vehicleLocations | mm-logistics.ts:59 | 11 | ✓ | 1 | 0 |
| `driver_expenses` | driverExpenses | mm-logistics.ts:81 | 12 | ✓ | 1 | 0 |
| `creditor_debts` | creditorDebts | mm-logistics.ts:107 | 11 | ✓ | 1 | 0 |
| `mm_vehicles` | vehicles | mm-logistics.ts:130 | 17 | ✓ | 0 | 0 |
| `mm_vehicle_fuel_logs` | vehicleFuelLogs | mm-logistics.ts:162 | 12 | ✓ | 2 | 0 |
| `mm_deliveries` | mmDeliveries | mm-logistics.ts:204 | 33 | ✓ | 2 | 0 |
| `mro_cleaning_schedules` | mroCleaningSchedules | mm-logistics.ts:253 | 8 | ✓ | 0 | 0 |
| `mro_utility_readings` | mroUtilityReadings | mm-logistics.ts:275 | 8 | ✓ | 0 | 0 |
| `mro_facilities` | mroFacilities | mm-logistics.ts:296 | 10 | ✓ | 0 | 0 |
| `batches` | batches | mm-material-cards.ts:17 | 12 | ✓ | 3 | 5 |
| `material_layer_config` | materialLayerConfig | mm-material-cards.ts:112 | 6 | ✓ | 1 | 1 |
| `min_stock_alerts` | minStockAlerts | mm-material-cards.ts:139 | 10 | ✓ | 0 | 4 |
| `consumption_suggestions` | consumptionSuggestions | mm-material-cards.ts:174 | 9 | ✓ | 3 | 4 |
| `material_batches` | materialBatches | mm-material-cards.ts:205 | 19 | ✓ | 3 | 5 |
| `operator_material_balance` | operatorMaterialBalance | mm-mro.ts:19 | 12 | ✓ | 3 | 0 |
| `vendor_invoices` | vendorInvoices | mm-mro.ts:50 | 22 | ✓ | 6 | 0 |
| `vendor_invoice_lines` | vendorInvoiceLines | mm-mro.ts:86 | 14 | ✓ | 1 | 0 |
| `three_way_match_results` | threeWayMatchResults | mm-mro.ts:111 | 16 | ✓ | 4 | 0 |
| `mro_items` | mroItems | mm-mro.ts:144 | 13 | ✓ | 1 | 0 |
| `mro_requests` | mroRequests | mm-mro.ts:170 | 17 | ✓ | 4 | 0 |
| `mro_consumption` | mroConsumption | mm-mro.ts:200 | 12 | ✓ | 3 | 0 |
| `mro_budgets` | mroBudgets | mm-mro.ts:223 | 10 | ✓ | 0 | 0 |
| `purchase_order_items` | purchaseOrderItems | mm-purchase.ts:32 | 7 | ✓ | 2 | 2 |
| `goods_receipts` | goodsReceipts | mm-purchase.ts:70 | 17 | ✓ | 4 | 5 |
| `goods_receipt_lines` | goodsReceiptLines | mm-purchase.ts:115 | 14 | ✓ | 2 | 4 |
| `goods_receipt_items` | goodsReceiptItems | mm-purchase.ts:159 | 6 | ✓ | 2 | 2 |
| `goods_issues` | goodsIssues | mm-purchase.ts:187 | 5 | ✓ | 1 | 4 |
| `goods_issue_items` | goodsIssueItems | mm-purchase.ts:219 | 5 | ✓ | 2 | 2 |
| `raw_materials` | rawMaterials | mm-raw-materials.ts:19 | 11 | ✓ | 2 | 5 |
| `purchase_invoices` | purchaseInvoices | mm-raw-materials.ts:68 | 10 | ✓ | 2 | 4 |
| `vendors` | vendors | mm-raw-materials.ts:169 | 11 | ✓ | 0 | 2 |
| `purchase_orders` | purchaseOrders | mm-raw-materials.ts:207 | 17 | ✓ | 2 | 6 |
| `warehouse_types` | warehouseTypes | wms-schema.ts:63 | 7 | ✓ | 0 | 2 |
| `procurement_requests` | procurementRequests | wms-schema.ts:92 | 2 | ✓ | 0 | 0 |
| `procurement_request_items` | procurementRequestItems | wms-schema.ts:119 | 7 | ✓ | 1 | 1 |
| `procurement_approvals` | procurementApprovals | wms-schema.ts:133 | 8 | ✓ | 1 | 2 |
| `warehouse_zones` | warehouseZones | wms-schema.ts:155 | 6 | ✓ | 1 | 18 |
| `warehouse_bins` | warehouseBins | wms-schema.ts:188 | 5 | ✓ | 1 | 2 |
| `stock_transfers` | stockTransfers | wms-schema.ts:226 | 18 | ✓ | 7 | 4 |
| `stock_transfer_lines` | stockTransferLines | wms-schema.ts:269 | 13 | ✓ | 3 | 1 |
| `warehouse_transactions` | warehouseTransactions | wms-schema.ts:342 | 14 | ✓ | 3 | 0 |
| `warehouse_stock` | warehouseStock | wms-schema.ts:391 | 15 | ✓ | 2 | 0 |
| `daily_warehouse_plans` | dailyWarehousePlans | wms-schema.ts:424 | 9 | ✓ | 0 | 0 |
| `barcode_movements` | barcodeMovements | wms-schema.ts:453 | 19 | ✓ | 4 | 0 |
| `exit_logs` | exitLogs | wms-schema.ts:490 | 21 | ✓ | 2 | 0 |
| `barcode_print_queue` | barcodePrintQueue | wms-schema.ts:527 | 12 | ✓ | 2 | 0 |
| `picking_tasks` | pickingTasks | wms-schema.ts:557 | 21 | ✓ | 6 | 0 |
| `cycle_count_results` | cycleCountResults | wms-schema.ts:599 | 18 | ✓ | 7 | 0 |
| `stock_movement_gl_postings` | stockMovementGLPostings | wms-schema.ts:639 | 19 | ✓ | 5 | 0 |
| `inventory_valuation` | inventoryValuation | wms-schema.ts:675 | 14 | ✓ | 1 | 0 |
| `production_material_balance` | productionMaterialBalance | wms-schema.ts:706 | 14 | ✓ | 1 | 0 |
| `internal_requests` | internalRequests | wms-schema.ts:732 | 16 | ✓ | 1 | 0 |
| `warehouse_rental_settings` | warehouseRentalSettings | wms-schema.ts:774 | 6 | ✓ | 1 | 0 |
| `warehouse_rental_records` | warehouseRentalRecords | wms-schema.ts:795 | 16 | ✓ | 3 | 0 |

### 3.5 Finance (FI) (54)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `invoice_payments` | invoicePayments | fi-ap-core.ts:28 | 13 | ✓ | 2 | 3 |
| `customer_payments` | customerPayments | fi-ap-core.ts:72 | 14 | ✓ | 1 | 3 |
| `bank_accounts` | bankAccounts | fi-ap-core.ts:120 | 8 | ✓ | 0 | 2 |
| `cash_flow_transactions` | cashFlowTransactions | fi-ap-core.ts:152 | 6 | ✓ | 1 | 4 |
| `budgets` | budgets | fi-ap-core.ts:188 | 23 | ✓ | 2 | 3 |
| `budget_lines` | budgetLines | fi-budgets.ts:38 | 8 | ✓ | 3 | 3 |
| `order_costings` | orderCostings | fi-budgets.ts:68 | 20 | ✓ | 3 | 3 |
| `order_costing_lines` | orderCostingLines | fi-budgets.ts:115 | 9 | ✓ | 1 | 2 |
| `ar_aging_buckets` | arAgingBuckets | fi-budgets.ts:151 | 7 | ✓ | 0 | 2 |
| `ap_aging_buckets` | apAgingBuckets | fi-budgets.ts:186 | 8 | ✓ | 1 | 1 |
| `cfo_bot_expenses` | cfoBotExpenses | fi-expenses.ts:23 | 12 | ✓ | 0 | 4 |
| `cfo_bot_documents` | cfoBotDocuments | fi-expenses.ts:45 | 9 | ✓ | 0 | 2 |
| `cfo_bot_health_logs` | cfoBotHealthLogs | fi-expenses.ts:61 | 8 | ✓ | 0 | 2 |
| `cfo_bot_reminders` | cfoBotReminders | fi-expenses.ts:75 | 9 | ✓ | 0 | 3 |
| `expense_requests` | expenseRequests | fi-expenses.ts:121 | 21 | ✓ | 4 | 4 |
| `expense_reports` | expenseReports | fi-expenses.ts:165 | 13 | ✓ | 3 | 3 |
| `expense_attachments` | expenseAttachments | fi-expenses.ts:197 | 10 | ✓ | 1 | 1 |
| `advance_payments` | advancePayments | fi-expenses.ts:220 | 18 | ✓ | 6 | 4 |
| `invoice_payment_matching` | invoicePaymentMatching | fi-expenses.ts:264 | 8 | ✓ | 3 | 2 |
| `bank_statements` | bankStatements | fi-expenses.ts:286 | 13 | ✓ | 2 | 3 |
| `rpt_kassa_transactions` | kassaTransactions | fi-financial-reports.ts:17 | 10 | ✓ | 0 | 1 |
| `rpt_ombor_qoldiq` | omborQoldiq | fi-financial-reports.ts:35 | 11 | ✓ | 0 | 2 |
| `rpt_debitorlar` | debitorlar | fi-financial-reports.ts:54 | 8 | ✓ | 0 | 2 |
| `rpt_kreditorlar` | kreditorlar | fi-financial-reports.ts:74 | 12 | ✓ | 0 | 2 |
| `rpt_balans` | balans | fi-financial-reports.ts:94 | 13 | ✓ | 0 | 1 |
| `rpt_ishlab_chiqarish` | ishlabChiqarish | fi-financial-reports.ts:113 | 12 | ✓ | 0 | 1 |
| `accounts` | accounts | fi-gl.ts:23 | 8 | ✓ | 0 | 0 |
| `cost_centers` | costCenters | fi-gl.ts:89 | 10 | ✓ | 2 | 0 |
| `profit_centers` | profitCenters | fi-gl.ts:115 | 8 | ✓ | 1 | 0 |
| `gl_documents` | glDocuments | fi-gl.ts:139 | 20 | ✓ | 0 | 5 |
| `gl_lines` | glLines | fi-gl.ts:194 | 10 | ✓ | 4 | 0 |
| `accounting_periods` | accountingPeriods | fi-gl.ts:219 | 7 | ✓ | 0 | 0 |
| `payroll_periods` | payrollPeriods | fi-gl.ts:256 | 18 | ✓ | 0 | 0 |
| `cfo_config` | cfoConfig | fi-gl.ts:333 | 5 | ✓ | 0 | 0 |
| `cash_registers` | cashRegisters | fi-kassa.ts:29 | 8 | ✓ | 1 | 2 |
| `cash_sessions` | cashSessions | fi-kassa.ts:59 | 12 | ✓ | 3 | 3 |
| `cash_transactions` | cashTransactions | fi-kassa.ts:95 | 11 | ✓ | 4 | 5 |
| `income_expense_transactions` | incomeExpenseTransactions | fi-kassa.ts:181 | 12 | ✓ | 2 | 4 |
| `payroll_contracts` | payrollContracts | fi-payroll-calc.ts:21 | 6 | ✓ | 1 | 3 |
| `payroll_tax_rules` | payrollTaxRules | fi-payroll-calc.ts:63 | 6 | ✓ | 0 | 2 |
| `payroll_calculations` | payrollCalculations | fi-payroll-calc.ts:100 | 19 | ✓ | 4 | 4 |
| `daily_financial_metrics` | dailyFinancialMetrics | fi-payroll-calc.ts:173 | 8 | ✓ | 0 | 1 |
| `stock_ledger` | stockLedger | fi-payroll-ext.ts:155 | 15 | ✓ | 3 | 2 |
| `budget_controls` | budgetControls | fi-payroll-ext.ts:183 | 14 | ✓ | 0 | 3 |
| `pos_transactions` | posTransactions | fi-payroll-ext.ts:228 | 17 | ✓ | 1 | 5 |
| `pos_products` | posProducts | fi-payroll-ext.ts:259 | 12 | ✓ | 0 | 2 |
| `cfo_bot_settings` | cfoBotSettings | fi-payroll-ext.ts:292 | 12 | ✓ | 0 | 1 |
| `cfo_bot_conversations` | cfoBotConversations | fi-payroll-ext.ts:310 | 7 | ✓ | 0 | 2 |
| `salary_history` | salaryHistory | payroll.ts:11 | 41 | ✓ | 1 | 0 |
| `bonus_payments` | bonusPayments | payroll.ts:59 | 15 | ✓ | 1 | 0 |
| `overtime_payments` | overtimePayments | payroll.ts:77 | 11 | ✓ | 1 | 0 |
| `employee_fines` | employeeFines | payroll.ts:91 | 11 | ✓ | 1 | 0 |
| `cash_advances` | cashAdvances | payroll.ts:105 | 14 | ✓ | 1 | 0 |
| `salary_bands` | salaryBands | payroll.ts:122 | 10 | ✓ | 0 | 0 |

### 3.6 POS (43)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `retail_pos_products` | retailPosProducts | pos-retail.ts:13 | 14 | ✓ | 0 | 2 |
| `retail_pos_transactions` | retailPosTransactions | pos-retail.ts:43 | 19 | ✓ | 0 | 4 |
| `stock_ledger` | posStockLedger | pos-schema-extensions.ts:55 | 9 | ✓ | 0 | 2 |
| `pos_movement_confirmations` | movementConfirmations | pos-schema-extensions.ts:72 | 9 | ✓ | 0 | 2 |
| `pos_barcode_map` | barcodeMap | pos-schema-extensions.ts:89 | 9 | ✓ | 0 | 2 |
| `pos_material_passports` | materialPassports | pos-schema-extensions.ts:106 | 11 | ✓ | 0 | 2 |
| `pos_stock_alerts` | stockAlerts | pos-schema-extensions.ts:125 | 14 | ✓ | 0 | 3 |
| `pos_gl_posting_log` | glPostingLog | pos-schema-extensions.ts:148 | 11 | ✓ | 0 | 2 |
| `pos_inventory_plans` | inventoryPlans | pos-schema-extensions.ts:167 | 14 | ✓ | 0 | 2 |
| `pos_inventory_variances` | inventoryVariances | pos-schema-extensions.ts:187 | 9 | ✓ | 0 | 2 |
| `pos_notifications` | posNotifications | pos-schema-extensions.ts:204 | 11 | ✓ | 0 | 3 |
| `pos_movements` | posMovements | pos-schema-v2.ts:69 | 44 | ✓ | 0 | 6 |
| `pos_movement_lines` | posMovementLines | pos-schema-v2.ts:147 | 6 | ✓ | 0 | 6 |
| `pos_material_requests` | posMaterialRequests | pos-schema-v2.ts:180 | 16 | ✓ | 0 | 3 |
| `pos_material_request_lines` | posMaterialRequestLines | pos-schema-v2.ts:203 | 10 | ✓ | 0 | 2 |
| `employee_issuance_log` | employeeIssuanceLog | pos-schema-v2.ts:221 | 11 | ✓ | 0 | 2 |
| `employee_inventory_ledger` | employeeInventoryLedger | pos-schema-v2.ts:240 | 17 | ✓ | 0 | 3 |
| `employee_write_off_acts` | employeeWriteOffActs | pos-schema-v2.ts:267 | 14 | ✓ | 0 | 2 |
| `employee_write_off_act_lines` | employeeWriteOffActLines | pos-schema-v2.ts:288 | 9 | ✓ | 0 | 1 |
| `employee_liability_cases` | employeeLiabilityCases | pos-schema-v2.ts:302 | 23 | ✓ | 0 | 3 |
| `production_material_allocs` | productionMaterialAllocs | pos-schema-v2.ts:334 | 22 | ✓ | 0 | 3 |
| `pos_stock_reservations` | posStockReservations | pos-schema-v2.ts:366 | 15 | ✓ | 0 | 3 |
| `pos_serial_number_items` | posSerialNumberItems | pos-schema-v2.ts:391 | 14 | ✓ | 0 | 3 |
| `pos_inventory_counts` | posInventoryCounts | pos-schema-v2.ts:416 | 16 | ✓ | 0 | 2 |
| `pos_inventory_count_lines` | posInventoryCountLines | pos-schema-v2.ts:438 | 16 | ✓ | 0 | 2 |
| `pos_offline_queue` | posOfflineQueue | pos-schema-v2.ts:462 | 11 | ✓ | 0 | 2 |
| `pos_barcode_print_queue` | posBarcodePrintQueue | pos-schema-v2.ts:482 | 14 | ✓ | 0 | 2 |
| `pos_damage_qc_links` | posDamageQcLinks | pos-schema-v2.ts:506 | 16 | ✓ | 0 | 2 |
| `department_warehouse_map` | departmentWarehouseMap | pos-schema-v2.ts:531 | 8 | ✓ | 0 | 2 |
| `material_category_dept_rules` | materialCategoryDeptRules | pos-schema-v2.ts:548 | 7 | ✓ | 0 | 1 |
| `material_card_suggestions` | materialCardSuggestions | pos-schema-v2.ts:563 | 17 | ✓ | 0 | 2 |
| `pos_three_way_match` | posThreeWayMatch | pos-schema-v2.ts:589 | 20 | ✓ | 0 | 2 |
| `pos_telegram_sessions` | posTelegramSessions | pos-schema-v2.ts:617 | 9 | ✓ | 0 | 2 |
| `pos_audit_log` | posAuditLog | pos-schema-v2.ts:634 | 15 | ✓ | 0 | 4 |
| `pos_printer_config` | posPrinterConfig | pos-schema-v2.ts:690 | 9 | ✓ | 0 | 0 |
| `pos_movement_types` | posMovementTypes | pos-schema.ts:23 | 8 | ✓ | 0 | 0 |
| `pos_warehouse_access` | posWarehouseAccess | pos-schema.ts:48 | 9 | ✓ | 3 | 0 |
| `role_movement_permissions` | roleMovementPermissions | pos-schema.ts:67 | 7 | ✓ | 1 | 0 |
| `pos_telegram_routes` | posTelegramRoutes | pos-schema.ts:85 | 7 | ✓ | 2 | 0 |
| `inventory_passports` | inventoryPassports | pos-schema.ts:104 | 15 | ✓ | 2 | 0 |
| `inventory_barcode_assignments` | inventoryBarcodeAssignments | pos-schema.ts:130 | 9 | ✓ | 1 | 0 |
| `pos_pdf_templates` | posPdfTemplates | pos-schema.ts:161 | 11 | ✓ | 2 | 0 |
| `positions` | positions | positions.ts:12 | 27 | ✓ | 1 | 2 |

### 3.7 Core / Admin (42)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `asset_items` | assetItems | admin-assets.ts:14 | 22 | ✓ | 0 | 2 |
| `asset_maintenance` | assetMaintenance | admin-assets.ts:55 | 9 | ✓ | 0 | 0 |
| `asset_disposals` | assetDisposals | admin-assets.ts:79 | 12 | ✓ | 0 | 0 |
| `asset_transfers` | assetTransfers | admin-assets.ts:106 | 15 | ✓ | 0 | 0 |
| `contact_settings` | contactSettings | core-schema.ts:24 | 9 | ✓ | 0 | 0 |
| `system_settings` | systemSettings | core-schema.ts:43 | 17 | ✓ | 0 | 0 |
| `meeting_rooms` | meetingRooms | core-schema.ts:72 | 9 | ✓ | 0 | 0 |
| `calendar_events` | calendarEvents | core-schema.ts:84 | 25 | ✓ | 4 | 0 |
| `reminders` | reminders | core-schema.ts:115 | 12 | ✓ | 1 | 0 |
| `broadcasts` | broadcasts | core-schema.ts:143 | 11 | ✓ | 1 | 0 |
| `surveys` | surveys | core-schema.ts:161 | 14 | ✓ | 1 | 0 |
| `survey_responses` | surveyResponses | core-schema.ts:178 | 5 | ✓ | 2 | 0 |
| `applications` | applications | core-schema.ts:186 | 11 | ✓ | 2 | 0 |
| `application_responses` | applicationResponses | core-schema.ts:200 | 12 | ✓ | 4 | 0 |
| `company_goals` | companyGoals | core-schema.ts:237 | 13 | ✓ | 1 | 0 |
| `company_plan_items` | companyPlanItems | core-schema.ts:265 | 11 | ✓ | 3 | 0 |
| `org_departments` | orgDepartments | core-schema.ts:294 | 15 | ✓ | 1 | 0 |
| `org_functions` | orgFunctions | core-schema.ts:320 | 15 | ✓ | 1 | 0 |
| `employee_functions` | employeeFunctions | core-schema.ts:346 | 7 | ✓ | 2 | 0 |
| `employee_org_departments` | employeeOrgDepartments | core-schema.ts:363 | 5 | ✓ | 2 | 0 |
| `company_tskp` | companyTskp | core-schema.ts:376 | 6 | ✓ | 0 | 0 |
| `hr_alumni` | hrAlumni | core-schema.ts:394 | 12 | ✓ | 1 | 0 |
| `hr_health_checkups` | hrHealthCheckups | core-schema.ts:414 | 9 | ✓ | 1 | 0 |
| `hr_onboarding_checklists` | hrOnboardingChecklists | core-schema.ts:431 | 6 | ✓ | 1 | 0 |
| `ai_alerts` | aiAlerts | core/core-ai-reports.ts:13 | 15 | ✓ | 1 | 0 |
| `document_sequences` | documentSequences | core/core-ai-reports.ts:43 | 7 | ✓ | 0 | 0 |
| `audit_logs` | auditLogs | core/core-ai-reports.ts:59 | 15 | ✓ | 0 | 0 |
| `currencies` | currencies | core/core-ai-reports.ts:79 | 9 | ✓ | 0 | 0 |
| `approval_requests` | approvalRequests | core/core-ai-reports.ts:93 | 17 | ✓ | 3 | 0 |
| `goals` | goals | core/core-ai.ts:14 | 16 | ✓ | 1 | 0 |
| `benchmarks` | benchmarks | core/core-ai.ts:51 | 11 | ✓ | 1 | 0 |
| `ai_insights` | aiInsights | core/core-ai.ts:78 | 15 | ✓ | 0 | 0 |
| `unit_of_measures` | unitOfMeasures | core/core-rules.ts:12 | 9 | ✓ | 0 | 0 |
| `system_alerts` | systemAlerts | core/core-rules.ts:26 | 23 | ✓ | 2 | 0 |
| `admins` | admins | core/core-users.ts:28 | 4 | ✓ | 0 | 0 |
| `notifications` | notifications | core/core-users.ts:36 | 24 | ✓ | 1 | 3 |
| `leave_types` | leaveTypes | master-config.ts:11 | 12 | ✓ | 0 | 0 |
| `shift_types` | shiftTypes | master-config.ts:29 | 12 | ✓ | 0 | 0 |
| `skill_categories` | skillCategories | master-config.ts:44 | 8 | ✓ | 0 | 0 |
| `abc_thresholds` | abcThresholds | master-config.ts:55 | 12 | ✓ | 0 | 0 |
| `position_permissions` | positionPermissions | position-permissions.ts:11 | 8 | ✓ | 1 | 1 |
| `position_feature_flags` | positionFeatureFlags | position-permissions.ts:26 | 5 | ✓ | 1 | 1 |

### 3.8 LMS (36)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `lms_exams` | lmsExams | lms-extended.ts:11 | 8 | ✓ | 1 | 0 |
| `lms_exam_questions` | lmsExamQuestions | lms-extended.ts:22 | 7 | ✓ | 1 | 0 |
| `lms_modules` | lmsModules | lms-extended.ts:32 | 11 | ✓ | 1 | 0 |
| `lms_lessons` | lmsLessons | lms-extended.ts:46 | 9 | ✓ | 1 | 0 |
| `lms_certificates` | lmsCertificates | lms-extended.ts:64 | 8 | ✓ | 2 | 0 |
| `guidelines` | guidelines | lms-schema.ts:15 | 13 | ✓ | 1 | 0 |
| `courses` | courses | lms-schema.ts:52 | 28 | ✓ | 0 | 3 |
| `modules` | modules | lms-schema.ts:99 | 7 | ✓ | 1 | 1 |
| `lessons` | lessons | lms-schema.ts:113 | 8 | ✓ | 1 | 1 |
| `tests` | tests | lms-schema.ts:133 | 11 | ✓ | 4 | 2 |
| `questions` | questions | lms-schema.ts:155 | 9 | ✓ | 1 | 0 |
| `attempts` | attempts | lms-schema.ts:176 | 8 | ✓ | 2 | 2 |
| `answers` | answers | lms-schema.ts:193 | 9 | ✓ | 2 | 0 |
| `assignments` | assignments | lms-schema.ts:207 | 6 | ✓ | 2 | 2 |
| `progress` | progress | lms-schema.ts:223 | 5 | ✓ | 2 | 2 |
| `ai_exam_attempts` | aiExamAttempts | lms-schema.ts:236 | 4 | ✓ | 2 | 13 |
| `video_progress` | videoProgress | lms-schema.ts:323 | 6 | ✓ | 2 | 0 |
| `achievements` | achievements | lms-schema.ts:336 | 9 | ✓ | 0 | 0 |
| `user_achievements` | userAchievements | lms-schema.ts:353 | 5 | ✓ | 2 | 0 |
| `user_points` | userPoints | lms-schema.ts:363 | 6 | ✓ | 1 | 0 |
| `skills` | skills | lms-schema.ts:378 | 4 | ✓ | 0 | 0 |
| `user_skills` | userSkills | lms-schema.ts:392 | 8 | ✓ | 2 | 0 |
| `onboarding_tasks` | onboardingTasks | lms-schema.ts:409 | 12 | ✓ | 1 | 0 |
| `user_onboarding_progress` | userOnboardingProgress | lms-schema.ts:431 | 7 | ✓ | 2 | 0 |
| `mentorships` | mentorships | lms-schema.ts:443 | 7 | ✓ | 3 | 0 |
| `mentorship_sessions` | mentorshipSessions | lms-schema.ts:463 | 6 | ✓ | 1 | 0 |
| `hr_capital_courses` | hrCapitalCourses | lms-schema.ts:564 | 13 | ✓ | 0 | 0 |
| `hr_capital_modules` | hrCapitalModules | lms-schema.ts:581 | 9 | ✓ | 1 | 0 |
| `hr_capital_quiz_questions` | hrCapitalQuizQuestions | lms-schema.ts:594 | 12 | ✓ | 1 | 0 |
| `hr_capital_quiz_attempts` | hrCapitalQuizAttempts | lms-schema.ts:610 | 9 | ✓ | 2 | 0 |
| `course_progress` | courseProgress | lms-schema.ts:650 | 9 | ✓ | 3 | 0 |
| `position_required_courses` | positionRequiredCourses | lms.ts:44 | 7 | ✓ | 2 | 0 |
| `course_modules` | courseModules | lms.ts:56 | 10 | ✓ | 1 | 0 |
| `test_questions` | testQuestions | lms.ts:69 | 10 | ✓ | 0 | 0 |
| `test_attempts` | testAttempts | lms.ts:82 | 13 | ✓ | 1 | 0 |
| `enrollments` | enrollments | lms.ts:98 | 13 | ✓ | 2 | 1 |

### 3.9 Tasks / Kanban (32)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `kanban_card_checklists` | kanbanCardChecklists | kanban-extended.ts:10 | 6 | ✓ | 1 | 0 |
| `kanban_card_checklist_items` | kanbanCardChecklistItems | kanban-extended.ts:19 | 6 | ✓ | 1 | 0 |
| `marketing_content_posts` | marketingContentPosts | kanban-extended.ts:28 | 14 | ✓ | 1 | 0 |
| `marketing_social_accounts` | marketingSocialAccounts | kanban-extended.ts:47 | 8 | ✓ | 0 | 0 |
| `kanban_boards` | kanbanBoards | kanban/kanban-core.ts:16 | 6 | ✓ | 0 | 2 |
| `kanban_columns` | kanbanColumns | kanban/kanban-core.ts:44 | 8 | ✓ | 1 | 2 |
| `kanban_cards` | kanbanCards | kanban/kanban-core.ts:72 | 15 | ✓ | 3 | 6 |
| `kanban_comments` | kanbanComments | kanban/kanban-core.ts:141 | 5 | ✓ | 2 | 2 |
| `task_subtasks` | taskSubtasks | kanban/kanban-extended.ts:19 | 9 | ✓ | 2 | 2 |
| `task_checklists` | taskChecklists | kanban/kanban-extended.ts:48 | 5 | ✓ | 1 | 1 |
| `task_checklist_items` | taskChecklistItems | kanban/kanban-extended.ts:71 | 7 | ✓ | 1 | 1 |
| `task_tags` | taskTags | kanban/kanban-extended.ts:96 | 5 | ✓ | 1 | 0 |
| `task_card_tags` | taskCardTags | kanban/kanban-extended.ts:117 | 3 | ✓ | 2 | 2 |
| `task_reminders` | taskReminders | kanban/kanban-extended.ts:136 | 7 | ✓ | 2 | 3 |
| `task_time_entries` | taskTimeEntries | kanban/kanban-extended.ts:160 | 9 | ✓ | 2 | 2 |
| `task_collaborators` | taskCollaborators | kanban/kanban-extended.ts:188 | 4 | ✓ | 2 | 2 |
| `task_templates` | taskTemplates | kanban/kanban-extended.ts:212 | 12 | ✓ | 2 | 0 |
| `task_files` | taskFiles | kanban/kanban-extended.ts:244 | 9 | ✓ | 2 | 2 |
| `task_status_history` | taskStatusHistory | kanban/kanban-extended.ts:274 | 8 | ✓ | 4 | 2 |
| `task_results` | taskResults | kanban/kanban-extended.ts:301 | 6 | ✓ | 2 | 0 |
| `task_result_files` | taskResultFiles | kanban/kanban-extended.ts:322 | 7 | ✓ | 1 | 0 |
| `task_chat_messages` | taskChatMessages | kanban/kanban-extended.ts:347 | 5 | ✓ | 2 | 0 |
| `task_chat_message_files` | taskChatMessageFiles | kanban/kanban-extended.ts:371 | 7 | ✓ | 1 | 0 |
| `task_time_tracks` | taskTimeTracks | kanban/kanban-extended.ts:396 | 9 | ✓ | 2 | 0 |
| `task_observers` | taskObservers | kanban/kanban-extended.ts:423 | 5 | ✓ | 3 | 0 |
| `task_co_executors` | taskCoExecutors | kanban/kanban-extended.ts:441 | 5 | ✓ | 3 | 0 |
| `task_projects` | taskProjects | kanban/kanban-extended.ts:459 | 11 | ✓ | 1 | 0 |
| `task_project_members` | taskProjectMembers | kanban/kanban-extended.ts:493 | 4 | ✓ | 2 | 0 |
| `automation_robots` | automationRobots | kanban/kanban-extended.ts:515 | 11 | ✓ | 2 | 0 |
| `task_flows` | taskFlows | kanban/kanban-extended.ts:551 | 5 | ✓ | 1 | 0 |
| `task_notifications` | taskNotifications | kanban/kanban-extended.ts:578 | 8 | ✓ | 2 | 0 |
| `task_view_preferences` | taskViewPreferences | kanban/kanban-extended.ts:606 | 7 | ✓ | 2 | 0 |

### 3.10 SaaS / Security / Strategic (28)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `saas_tenants` | tenants | saas-schema.ts:12 | 17 | ✓ | 0 | 0 |
| `saas_tenant_modules` | tenantModules | saas-schema.ts:57 | 7 | ✓ | 1 | 0 |
| `saas_tenant_error_logs` | tenantErrorLogs | saas-schema.ts:77 | 10 | ✓ | 1 | 0 |
| `saas_tenant_api_usage` | tenantApiUsage | saas-schema.ts:95 | 6 | ✓ | 1 | 0 |
| `approval_matrix_config` | approvalMatrixConfig | security-ops-schema.ts:17 | 10 | ✓ | 1 | 0 |
| `multi_level_approval_history` | multiLevelApprovalHistory | security-ops-schema.ts:39 | 8 | ✓ | 2 | 0 |
| `security_visitors` | visitors | security-ops-schema.ts:63 | 11 | ✓ | 1 | 0 |
| `job_queue_items` | jobQueueItems | security-ops-schema.ts:83 | 12 | ✓ | 0 | 0 |
| `ppe_violations` | ppeViolations | security-ops-schema.ts:106 | 12 | ✓ | 0 | 0 |
| `system_error_logs` | systemErrorLogs | security-ops-schema.ts:129 | 9 | ✓ | 0 | 0 |
| `security_incidents` | securityIncidents | security-ops-schema.ts:149 | 15 | ✓ | 1 | 0 |
| `security_ppe_checks` | securityPpeChecks | security-ops-schema.ts:184 | 10 | ✓ | 1 | 0 |
| `strategic_categories` | strategicCategories | strategic-ext-schema.ts:17 | 11 | ✓ | 0 | 0 |
| `strategic_tasks` | strategicTasks | strategic-ext-schema.ts:31 | 30 | ✓ | 3 | 0 |
| `strategic_milestones` | strategicMilestones | strategic-ext-schema.ts:67 | 8 | ✓ | 1 | 0 |
| `token_blacklist` | tokenBlacklist | strategic-ext-schema.ts:109 | 5 | ✓ | 0 | 0 |
| `company_functions` | companyFunctions | strategic-ext-schema.ts:121 | 10 | ✓ | 0 | 0 |
| `function_kpis` | functionKpis | strategic-ext-schema.ts:134 | 11 | ✓ | 1 | 0 |
| `raci_tasks` | raciTasks | strategic-ext-schema.ts:160 | 7 | ✓ | 0 | 0 |
| `raci_assignments` | raciAssignments | strategic-ext-schema.ts:170 | 6 | ✓ | 2 | 0 |
| `business_stages` | businessStages | strategic-ext-schema.ts:191 | 11 | ✓ | 0 | 0 |
| `business_crises` | businessCrises | strategic-ext-schema.ts:205 | 9 | ✓ | 0 | 0 |
| `company_health_assessment` | companyHealthAssessment | strategic-ext-schema.ts:217 | 10 | ✓ | 2 | 0 |
| `org_chart_settings` | orgChartSettings | strategic-ext-schema.ts:245 | 8 | ✓ | 1 | 0 |
| `org_chart_snapshots` | orgChartSnapshots | strategic-ext-schema.ts:256 | 7 | ✓ | 1 | 0 |
| `okr_objectives` | okrObjectives | strategic-ext-schema.ts:278 | 12 | ✓ | 2 | 0 |
| `okr_key_results` | okrKeyResults | strategic-ext-schema.ts:296 | 11 | ✓ | 1 | 0 |
| `raci_matrix` | raciMatrix | strategic-ext-schema.ts:340 | 6 | ✓ | 0 | 0 |

### 3.11 Orders / Workflow (23)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `ow_orders` | owOrders | order-workflow-schema.ts:13 | 17 | ✓ | 0 | 2 |
| `ow_order_lines` | owOrderLines | order-workflow-schema.ts:39 | 9 | ✓ | 1 | 1 |
| `ow_order_surveys` | owOrderSurveys | order-workflow-schema.ts:56 | 7 | ✓ | 1 | 0 |
| `ow_order_samples` | owOrderSamples | order-workflow-schema.ts:69 | 8 | ✓ | 1 | 0 |
| `ow_contracts` | owContracts | order-workflow-schema.ts:83 | 10 | ✓ | 1 | 0 |
| `ow_tech_cards` | owTechCards | order-workflow-schema.ts:97 | 11 | ✓ | 1 | 1 |
| `ow_molds` | owMolds | order-workflow-schema.ts:115 | 9 | ✓ | 1 | 0 |
| `ow_cliches` | owCliches | order-workflow-schema.ts:131 | 9 | ✓ | 1 | 0 |
| `ow_material_requirements` | owMaterialRequirements | order-workflow-schema.ts:146 | 9 | ✓ | 1 | 1 |
| `ow_production_plans` | owProductionPlans | order-workflow-schema.ts:162 | 8 | ✓ | 1 | 0 |
| `ow_work_orders` | owWorkOrders | order-workflow-schema.ts:177 | 11 | ✓ | 1 | 0 |
| `ow_qc_results` | owQcResults | order-workflow-schema.ts:195 | 11 | ✓ | 1 | 0 |
| `ow_packaging_records` | owPackagingRecords | order-workflow-schema.ts:213 | 7 | ✓ | 1 | 0 |
| `ow_fg_transfers` | owFgTransfers | order-workflow-schema.ts:224 | 7 | ✓ | 1 | 0 |
| `ow_shipping_requests` | owShippingRequests | order-workflow-schema.ts:235 | 8 | ✓ | 1 | 0 |
| `ow_deliveries` | owDeliveries | order-workflow-schema.ts:247 | 10 | ✓ | 1 | 0 |
| `ow_rework_events` | owReworkEvents | order-workflow-schema.ts:263 | 8 | ✓ | 1 | 0 |
| `ow_pallet_recoveries` | owPalletRecoveries | order-workflow-schema.ts:277 | 7 | ✓ | 1 | 0 |
| `ow_credit_limits` | owCreditLimits | order-workflow-schema.ts:288 | 7 | ✓ | 0 | 1 |
| `ow_payment_plan_entries` | owPaymentPlanEntries | order-workflow-schema.ts:303 | 10 | ✓ | 1 | 1 |
| `ow_document_workflow_instances` | owDocumentWorkflowInstances | order-workflow-schema.ts:322 | 7 | ✓ | 0 | 1 |
| `ow_order_status_history` | owOrderStatusHistory | order-workflow-schema.ts:336 | 8 | ✓ | 1 | 1 |
| `orders_registry` | ordersRegistry | orders-registry-schema.ts:16 | 10 | ✓ | 1 | 0 |

### 3.12 Other (20)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `employee_daily_kpi` | employeeDailyKpi | kpi.ts:12 | 13 | ✓ | 1 | 1 |
| `performance_goals` | performanceGoals | kpi.ts:31 | 18 | ✓ | 1 | 0 |
| `employee_ratings` | employeeRatings | kpi.ts:55 | 14 | ✓ | 1 | 0 |
| `employee_productivity` | employeeProductivity | kpi.ts:75 | 13 | ✓ | 1 | 1 |
| `operator_daily_stats` | operatorDailyStats | kpi.ts:93 | 13 | ✓ | 1 | 1 |
| `leave_requests` | leaveRequests | leave.ts:12 | 32 | ✓ | 1 | 5 |
| `sick_leaves` | sickLeaves | leave.ts:63 | 13 | ✓ | 1 | 2 |
| `business_trips` | businessTrips | leave.ts:83 | 16 | ✓ | 1 | 3 |
| `leave_balances` | leaveBalances | leave.ts:112 | 10 | ✓ | 1 | 3 |
| `safety_incidents` | safetyIncidents | safety.ts:12 | 25 | ✓ | 2 | 0 |
| `ppe_compliance` | ppeCompliance | safety.ts:45 | 10 | ✓ | 1 | 0 |
| `safety_trainings` | safetyTrainings | safety.ts:58 | 9 | ✓ | 0 | 0 |
| `safety_training_records` | safetyTrainingRecords | safety.ts:70 | 9 | ✓ | 2 | 0 |
| `hazard_zones` | hazardZones | safety.ts:84 | 12 | ✓ | 0 | 0 |
| `shift_assignments` | shiftAssignments | shifts.ts:12 | 9 | ✓ | 1 | 1 |
| `shift_swap_requests` | shiftSwapRequests | shifts.ts:26 | 11 | ✓ | 4 | 0 |
| `employee_skills` | employeeSkills | skills.ts:12 | 12 | ✓ | 1 | 0 |
| `skill_requirements` | skillRequirements | skills.ts:30 | 7 | ✓ | 0 | 0 |
| `users` | users | users.ts:13 | 51 | ✓ | 2 | 3 |
| `website_portfolio` | websitePortfolio | website-extended.ts:8 | 13 | ✓ | 0 | 0 |

### 3.13 IoT (15)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `cameras` | cameras | iot-schema.ts:18 | 11 | ✓ | 1 | 0 |
| `camera_zones` | cameraZones | iot-schema.ts:59 | 6 | ✓ | 1 | 0 |
| `camera_events` | cameraEvents | iot-schema.ts:86 | 11 | ✓ | 2 | 0 |
| `camera_detections` | cameraDetections | iot-schema.ts:136 | 4 | ✓ | 2 | 0 |
| `employee_zone_tracking` | employeeZoneTracking | iot-schema.ts:161 | 5 | ✓ | 2 | 0 |
| `safety_violations` | safetyViolations | iot-schema.ts:193 | 12 | ✓ | 4 | 0 |
| `quality_defects_camera` | qualityDefectsCamera | iot-schema.ts:226 | 11 | ✓ | 4 | 0 |
| `machine_status_logs` | machineStatusLogs | iot-schema.ts:260 | 10 | ✓ | 2 | 0 |
| `camera_alerts` | cameraAlerts | iot-schema.ts:299 | 16 | ✓ | 4 | 0 |
| `camera_dashboard_stats` | cameraDashboardStats | iot-schema.ts:342 | 21 | ✓ | 0 | 0 |
| `iot_sensors` | iotSensors | iot-schema.ts:393 | 15 | ✓ | 0 | 0 |
| `iot_sensor_readings` | iotSensorReadings | iot-schema.ts:414 | 5 | ✓ | 1 | 0 |
| `iot_alerts` | iotAlerts | iot-schema.ts:425 | 11 | ✓ | 2 | 0 |
| `camera_ai_configs` | cameraAiConfigs | iot-schema.ts:463 | 11 | ✓ | 0 | 0 |
| `pm_schedules` | pmSchedules | iot-schema.ts:511 | 20 | ✓ | 0 | 0 |

### 3.14 Communications (14)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `chat_rooms` | chatRooms | chat-schema.ts:21 | 16 | ✓ | 0 | 0 |
| `chat_members` | chatMembers | chat-schema.ts:40 | 12 | ✓ | 0 | 0 |
| `chat_messages` | chatMessages | chat-schema.ts:55 | 19 | ✓ | 0 | 0 |
| `chat_reactions` | chatReactions | chat-schema.ts:77 | 5 | ✓ | 0 | 0 |
| `chat_polls` | chatPolls | chat-schema.ts:85 | 13 | ✓ | 0 | 0 |
| `chat_poll_votes` | chatPollVotes | chat-schema.ts:101 | 6 | ✓ | 0 | 0 |
| `chat_message_tasks` | chatMessageTasks | chat-schema.ts:110 | 10 | ✓ | 0 | 0 |
| `chat_starred_messages` | chatStarredMessages | chat-schema.ts:123 | 4 | ✓ | 0 | 0 |
| `chat_user_presence` | chatUserPresence | chat-schema.ts:130 | 6 | ✓ | 0 | 0 |
| `chat_emoji_packs` | chatEmojiPacks | chat-schema.ts:139 | 7 | ✓ | 0 | 0 |
| `chat_custom_emoji` | chatCustomEmoji | chat-schema.ts:149 | 7 | ✓ | 0 | 0 |
| `chat_join_requests` | chatJoinRequests | chat-schema.ts:159 | 8 | ✓ | 0 | 0 |
| `chat_push_subscriptions` | chatPushSubscriptions | chat-schema.ts:170 | 11 | ✓ | 0 | 0 |
| `chat_video_calls` | chatVideoCalls | chat-schema.ts:184 | 9 | ✓ | 0 | 0 |

### 3.15 AI (10)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `agent_alerts` | agentAlerts | agent-schema.ts:12 | 16 | ✓ | 0 | 0 |
| `agent_cron_state` | agentCronState | agent-schema.ts:32 | 7 | — | 0 | 0 |
| `agent_module_health` | agentModuleHealth | agent-schema.ts:43 | 8 | — | 0 | 0 |
| `agent_modules_registry` | agentModulesRegistry | agent-schema.ts:55 | 8 | — | 0 | 0 |
| `agents_audit_log` | agentsAuditLog | agent-schema.ts:67 | 15 | ✓ | 0 | 0 |
| `ai_usage_logs` | aiUsageLogs | ai-providers-schema.ts:13 | 18 | ✓ | 1 | 0 |
| `aisha_conversations` | aishaConversations | aisha-schema.ts:18 | 7 | ✓ | 0 | 3 |
| `aisha_tool_calls` | aishaToolCalls | aisha-schema.ts:36 | 9 | ✓ | 1 | 3 |
| `aisha_voice_audit` | aishaVoiceAudit | aisha-schema.ts:56 | 5 | ✓ | 1 | 1 |
| `aisha_pending_approvals` | aishaPendingApprovals | aisha-schema.ts:68 | 6 | ✓ | 2 | 2 |

### 3.16 Planning / Kaizen (3)

| SQL jadval | Drizzle var | Fayl:satr | Ust. | PK | FK | Idx |
|---|---|---|---|---|---|---|
| `ideal_rasm_targets` | idealRasmTargets | ideal-rasm-schema.ts:9 | 9 | ✓ | 0 | 0 |
| `kaizen_suggestions` | kaizenSuggestions | kaizen-schema.ts:16 | 13 | ✓ | 2 | 0 |
| `weekly_plans` | weeklyPlans | weekly-plans-schema.ts:9 | 12 | ✓ | 0 | 0 |

---

## 4. PK aniqlanmagan jadvallar (parser bo'yicha, 4 ta)

Quyidagilarda bitta-ustunli `.primaryKey()` ham, composite `primaryKey({...})` ham parser tomonidan topilmadi. Ba'zilari haqiqatan PK'siz (junction/log/view-backed), ba'zilari parser cheklovi bo'lishi mumkin — har birini 03/modul hisobotlarida tekshirish kerak.

| SQL jadval | Fayl:satr | Ustunlar |
|---|---|---|
| `agent_cron_state` | agent-schema.ts:32 | 7 |
| `agent_module_health` | agent-schema.ts:43 | 8 |
| `agent_modules_registry` | agent-schema.ts:55 | 8 |
| `hr_user_blocks` | hr-goals.ts:73 | 8 |

---

## 5. Xulosa

Canonical Drizzle sxema **670 jadval** va **8110 ustun**dan iborat — bu juda yirik domen modeli (96 fayl). Eng katta domenlar: HR (108), Sales / CRM / Marketing (92), Production / QC (PP/MES) (83), Inventory / Warehouse (MM/WMS) (67). Moliyaviy ustunlar uchun maxsus `numericMoney` tipi izchil ishlatilgan (575 ustun). Yagona to'g'ridan-to'g'ri SQL-nom collision — `stock_ledger` (ikki xil ta'rif). PK belgisi topilmagan 4 jadval qo'shimcha tekshiruvni talab qiladi. Backend mahalliy superset (455 jadval) bilan taqqoslash va drift 03-hisobotda.

---

## 6. Kamchiliklar jadvali

| # | Muammo | Jiddiylik | Dalil | Ta'sir | Tavsiya |
|---|---|---|---|---|---|
| B1 | `stock_ledger` ikki marta ta'riflangan (turli ustunlar) | **P1** | `fi-payroll-ext.ts:155` (`stockLedger`, 15 ust.) vs `pos-schema-extensions.ts:55` (`posStockLedger`, 9 ust.) | Bitta fizik jadvalga ikki xil sxema — migratsiya/runtime ziddiyati | Bitta canonical ta'rif; ikkinchisini nom o'zgartirish yoki birlashtirish (03-hisobotda) |
| B2 | 4 jadvalda PK aniqlanmadi | **P2** | 4-bo'lim ro'yxati | PK'siz jadval — replikatsiya/ORM xatti-harakati, dublikat qatorlar xavfi | Har birini tekshirish; haqiqiy PK qo'shish (kerak bo'lsa) |
| B3 | 697 (grep) vs 670 (parser) farqi | **P3** | 1-bo'lim | Izoh/o'lik `pgTable` namunalar bo'lishi mumkin | 23-hisobotda o'lik kod sifatida tekshirish |

---

## 7. Ochiq savollar / TASDIQLANMAGAN

- **TASDIQLANMAGAN:** Bu inventar Drizzle **manba**dan (`src`) olingan. Haqiqiy (live) DB holati bilan moslik 03-hisobotda `_db_tables.txt`/`_db_cols.txt`/migratsiyalar orqali tekshiriladi.
- **TASDIQLANMAGAN:** PK'siz deb belgilangan ba'zi jadvallarda PK boshqa sintaksisda (masalan `.primaryKey()` ko'p qatorli zanjirda) bo'lishi mumkin — parser cheklovi.
- To'liq ustun+tip ro'yxati: `02-schema-columns.csv` (hamroh fayl, 8110 qator).
