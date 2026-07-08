/**
 * @module HRRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const Employees = lazy(() => import("@/pages/Employees"));
const EmployeeProfile = lazy(() => import("@/pages/EmployeeProfile"));
const HRMap = lazy(() => import("@/pages/HRMap"));
const RecruitingKanban = lazy(() => import("@/pages/RecruitingKanban"));
const HRSuccessionPlanning = lazy(() => import("@/pages/HRSuccessionPlanning"));
const SkillsMatrix = lazy(() => import("@/pages/SkillsMatrix"));
const Mentorship = lazy(() => import("@/pages/Mentorship"));
const EventsCalendar = lazy(() => import("@/pages/EventsCalendar"));
const Applications = lazy(() => import("@/pages/Applications"));
const ShiftSchedule = lazy(() => import("@/pages/ShiftSchedule"));
const ShiftTypesConfig = lazy(() => import("@/pages/ShiftTypesConfig"));
const RazryadLevelConfig = lazy(() => import("@/pages/RazryadLevelConfig"));
const ErrorCatalogConfig = lazy(() => import("@/pages/ErrorCatalogConfig"));
const QuestionBankConfig = lazy(() => import("@/pages/QuestionBankConfig"));
const HRDashboard = lazy(() => import("@/pages/HRDashboard"));
const HRCapitalTests = lazy(() => import("@/pages/HRCapitalTests"));
const OrgStructureHierarchy = lazy(() => import("@/pages/OrgStructureHierarchy"));
const OrgNodeDetail = lazy(() => import("@/pages/OrgNodeDetail"));
// Cards + Razryad catalog moved INSIDE Org Tuzilma (tabs) — no standalone pages (owner 2026-06-17).
// Old /org-structure/cards · /cards/:id · /razryad-levels routes now redirect (see AppRouter).
const HROnboarding = lazy(() => import("@/pages/HROnboarding"));
const HRVacationSick = lazy(() => import("@/pages/HRVacationSick"));
const HROffboarding = lazy(() => import("@/pages/HROffboarding"));
const HRHealthMonitoring = lazy(() => import("@/pages/HRHealthMonitoring"));
const HRCareerPath = lazy(() => import("@/pages/HRCareerPath"));
const HRSafety = lazy(() => import("@/pages/HRSafety"));
const RecruiterKPIPage = lazy(() => import("@/pages/RecruiterKPIPage"));
const ReceptionPage = lazy(() => import("@/pages/ReceptionPage"));
const DailyReportPage = lazy(() => import("@/pages/DailyReportPage"));
const HRAssetManagement = lazy(() => import("@/pages/HRAssetManagement"));
const ReferralPage = lazy(() => import("@/pages/ReferralPage"));
const CandidateReport = lazy(() => import("@/pages/CandidateReport"));
const HRAIDashboard = lazy(() => import("@/pages/HRAIDashboard"));
const AIInterviewPage = lazy(() => import("@/pages/AIInterviewPage"));
const InternalJobBoard = lazy(() => import("@/pages/InternalJobBoard"));
const HRBrandPage = lazy(() => import("@/pages/HRBrandPage"));
const WeeklyPlanPage = lazy(() => import("@/pages/WeeklyPlanPage"));
const InspectionPage = lazy(() => import("@/pages/InspectionPage"));
const HRPip = lazy(() => import("@/pages/HRPip"));
const HRGamification = lazy(() => import("@/pages/HRGamification"));
const HRBirthdays = lazy(() => import("@/pages/HRBirthdays"));
const Discipline = lazy(() => import("@/pages/Discipline"));
const HRConflict = lazy(() => import("@/pages/HRConflict"));
const HRAlumni = lazy(() => import("@/pages/HRAlumni"));
const HREnps = lazy(() => import("@/pages/HREnps"));
const Questionnaire = lazy(() => import("@/pages/Questionnaire"));
const QuestionnaireTemplates = lazy(() => import("@/pages/QuestionnaireTemplates"));
const SevenFunctions = lazy(() => import("@/pages/SevenFunctions"));
const RaciMatrix = lazy(() => import("@/pages/RaciMatrix"));
const HRMilestones = lazy(() => import("@/pages/HRMilestones"));
const JobDescriptionsPage = lazy(() => import("@/pages/JobDescriptionsPage"));

export const HR_ROUTES: [string, React.ComponentType][] = [
  ['/employees',                        Employees],
  ['/employees/:id',                    EmployeeProfile],
  ['/hr-map',                           HRMap],
  ['/hr/recruiting',                    RecruitingKanban],
  ['/skills-matrix',                    SkillsMatrix],
  ['/mentorship',                       Mentorship],
  ['/events-calendar',                  EventsCalendar],
  ['/applications',                     Applications],
  ['/shift-schedule',                   ShiftSchedule],
  ['/hr/shift-types-config',            ShiftTypesConfig],
  ['/hr/razryad-config',               RazryadLevelConfig],  // config-mexanizm: imtihon %/retakes/oylik
  ['/hr-dashboard',                     HRDashboard],
  ['/hr-capital/tests',                 HRCapitalTests],
  ['/org-structure/hierarchy',          OrgStructureHierarchy],
  ['/org-structure/hierarchy/node/:id', OrgNodeDetail],
  ['/org-structure/error-catalog',      ErrorCatalogConfig],  // XATO-KATALOG: defect-dropdown manbai CRUD
  ['/org-structure/question-bank',      QuestionBankConfig],  // EP-ORG-046: AI-imtihon savollar banki CRUD
  ['/hr/onboarding',                    HROnboarding],
  ['/hr/vacation-sick',                 HRVacationSick],
  ['/hr/succession',                    HRSuccessionPlanning],
  ['/hr/offboarding',                   HROffboarding],
  ['/hr/health-monitoring',             HRHealthMonitoring],
  ['/hr/career-path',                   HRCareerPath],
  ['/hr/safety',                        HRSafety],
  ['/hr/recruiter-kpi',                 RecruiterKPIPage],
  ['/hr/reception',                     ReceptionPage],
  ['/hr/daily-reports',                 DailyReportPage],
  ['/hr/assets',                        HRAssetManagement],
  ['/hr/referrals',                     ReferralPage],
  ['/hr/candidate-report/:id',          CandidateReport],
  ['/hr/brand',                         HRBrandPage],
  ['/weekly-plan',                      WeeklyPlanPage],
  ['/hr/inspection',                    InspectionPage],
  // ── Newly implemented HR pages ────────────────────────────────────────────
  ['/hr/pip',                           HRPip],
  ['/hr/gamification',                  HRGamification],
  ['/hr/birthdays',                     HRBirthdays],
  ['/discipline',                       Discipline],
  ['/hr/conflict',                      HRConflict],
  ['/hr/alumni',                        HRAlumni],
  ['/hr/enps',                          HREnps],
  ['/questionnaire',                    Questionnaire],
  ['/questionnaire-templates',          QuestionnaireTemplates],
  ['/seven-functions',                  SevenFunctions],
  ['/raci-matrix',                      RaciMatrix],
  ['/hr/milestones',                    HRMilestones],
  ['/hr/job-descriptions',              JobDescriptionsPage],  // HR lavozim tavsiflar CRUD
];

export const AI_HR_ROUTES: [string, React.ComponentType][] = [
  ['/ai-hr/dashboard',  HRAIDashboard],
  ['/ai-hr/interviews', AIInterviewPage],
];

export const SELF_SERVICE_ROUTES: [string, React.ComponentType][] = [
  ['/hr/internal-jobs', InternalJobBoard],
];
