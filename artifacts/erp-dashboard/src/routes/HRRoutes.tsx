import { lazy } from "react";

const Employees = lazy(() => import("@/pages/Employees"));
const EmployeeProfile = lazy(() => import("@/pages/EmployeeProfile"));
const OrgChartPage = lazy(() => import("@/pages/OrgChartPage"));
const Adaptation = lazy(() => import("@/pages/Adaptation"));
const HRMap = lazy(() => import("@/pages/HRMap"));
const RecruitingKanban = lazy(() => import("@/pages/RecruitingKanban"));
const SevenFunctionsDashboard = lazy(() => import("@/pages/SevenFunctionsDashboard"));
const RACIMatrixPage = lazy(() => import("@/pages/RACIMatrixPage"));
const HRSuccessionPlanning = lazy(() => import("@/pages/HRSuccessionPlanning"));
const SkillsMatrix = lazy(() => import("@/pages/SkillsMatrix"));
const Mentorship = lazy(() => import("@/pages/Mentorship"));
const EventsCalendar = lazy(() => import("@/pages/EventsCalendar"));
const Applications = lazy(() => import("@/pages/Applications"));
const Questionnaire = lazy(() => import("@/pages/Questionnaire"));
const QuestionnaireTemplates = lazy(() => import("@/pages/QuestionnaireTemplates"));
const ShiftSchedule = lazy(() => import("@/pages/ShiftSchedule"));
const Discipline = lazy(() => import("@/pages/Discipline"));
const HRDashboard = lazy(() => import("@/pages/HRDashboard"));
const HRCapitalCourses = lazy(() => import("@/pages/HRCapitalCourses"));
const HRCapitalTests = lazy(() => import("@/pages/HRCapitalTests"));
const OrgStructureHierarchy = lazy(() => import("@/pages/OrgStructureHierarchy"));
const OrgNodeDetail = lazy(() => import("@/pages/OrgNodeDetail"));
const HROnboarding = lazy(() => import("@/pages/HROnboarding"));
const HRVacationSick = lazy(() => import("@/pages/HRVacationSick"));
const HROffboarding = lazy(() => import("@/pages/HROffboarding"));
const HRAlumni = lazy(() => import("@/pages/HRAlumni"));
const HRHealthMonitoring = lazy(() => import("@/pages/HRHealthMonitoring"));
const HRConflict = lazy(() => import("@/pages/HRConflict"));
const HRCareerPath = lazy(() => import("@/pages/HRCareerPath"));
const HRSafety = lazy(() => import("@/pages/HRSafety"));
const GamificationPage = lazy(() => import("@/pages/GamificationPage"));
const RecruiterKPIPage = lazy(() => import("@/pages/RecruiterKPIPage"));
const ReceptionPage = lazy(() => import("@/pages/ReceptionPage"));
const DailyReportPage = lazy(() => import("@/pages/DailyReportPage"));
const PIPPage = lazy(() => import("@/pages/PIPPage"));
const ENPSPage = lazy(() => import("@/pages/ENPSPage"));
const DocumentWorkflowPage = lazy(() => import("@/pages/DocumentWorkflowPage"));
const HRAssetManagement = lazy(() => import("@/pages/HRAssetManagement"));
const PeerReviewPage = lazy(() => import("@/pages/PeerReviewPage"));
const ReferralPage = lazy(() => import("@/pages/ReferralPage"));
const MilestonePage = lazy(() => import("@/pages/MilestonePage"));
const BirthdayWidget = lazy(() => import("@/pages/BirthdayWidget"));
const CandidateReport = lazy(() => import("@/pages/CandidateReport"));
const HRAIDashboard = lazy(() => import("@/pages/HRAIDashboard"));
const AIInterviewPage = lazy(() => import("@/pages/AIInterviewPage"));
const InternalJobBoard = lazy(() => import("@/pages/InternalJobBoard"));
const HRBrandPage = lazy(() => import("@/pages/HRBrandPage"));
const WeeklyPlanPage = lazy(() => import("@/pages/WeeklyPlanPage"));
const InspectionPage = lazy(() => import("@/pages/InspectionPage"));

export const HR_ROUTES: [string, React.ComponentType][] = [
  ['/employees',                        Employees],
  ['/employees/:id',                    EmployeeProfile],
  ['/org-chart',                        OrgChartPage],
  ['/adaptation',                       Adaptation],
  ['/hr-map',                           HRMap],
  ['/hr/recruiting',                    RecruitingKanban],
  ['/seven-functions',                  SevenFunctionsDashboard],
  ['/business-health',                  RACIMatrixPage],
  ['/raci-matrix',                      RACIMatrixPage],
  ['/hr/succession-planning',           HRSuccessionPlanning],
  ['/skills-matrix',                    SkillsMatrix],
  ['/mentorship',                       Mentorship],
  ['/events-calendar',                  EventsCalendar],
  ['/applications',                     Applications],
  ['/questionnaire',                    Questionnaire],
  ['/questionnaire-templates',          QuestionnaireTemplates],
  ['/shift-schedule',                   ShiftSchedule],
  ['/discipline',                       Discipline],
  ['/hr-dashboard',                     HRDashboard],
  ['/hr-capital/courses',               HRCapitalCourses],
  ['/hr-capital/tests',                 HRCapitalTests],
  ['/org-structure/hierarchy',          OrgStructureHierarchy],
  ['/org-structure/hierarchy/node/:id', OrgNodeDetail],
  ['/hr/onboarding',                    HROnboarding],
  ['/hr/vacation-sick',                 HRVacationSick],
  ['/hr/succession',                    HRSuccessionPlanning],
  ['/hr/offboarding',                   HROffboarding],
  ['/hr/alumni',                        HRAlumni],
  ['/hr/health-monitoring',             HRHealthMonitoring],
  ['/hr/conflict',                      HRConflict],
  ['/hr/career-path',                   HRCareerPath],
  ['/hr/safety',                        HRSafety],
  ['/hr/gamification',                  GamificationPage],
  ['/hr/recruiter-kpi',                 RecruiterKPIPage],
  ['/hr/reception',                     ReceptionPage],
  ['/hr/daily-reports',                 DailyReportPage],
  ['/hr/pip',                           PIPPage],
  ['/hr/enps',                          ENPSPage],
  ['/hr/documents',                     DocumentWorkflowPage],
  ['/hr/assets',                        HRAssetManagement],
  ['/hr/peer-review',                   PeerReviewPage],
  ['/hr/referrals',                     ReferralPage],
  ['/hr/milestones',                    MilestonePage],
  ['/hr/birthdays',                     BirthdayWidget],
  ['/hr/candidate-report/:id',          CandidateReport],
  ['/hr/brand',                         HRBrandPage],
  ['/weekly-plan',                      WeeklyPlanPage],
  ['/hr/inspection',                    InspectionPage],
];

export const AI_HR_ROUTES: [string, React.ComponentType][] = [
  ['/ai-hr/dashboard',  HRAIDashboard],
  ['/ai-hr/interviews', AIInterviewPage],
];

export const SELF_SERVICE_ROUTES: [string, React.ComponentType][] = [
  ['/hr/internal-jobs', InternalJobBoard],
];
