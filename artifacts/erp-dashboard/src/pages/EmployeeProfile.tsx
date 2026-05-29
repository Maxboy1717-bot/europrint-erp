/**
 * @module EmployeeProfile
 * @description React page component. Route-level UI.
 */

import { useParams, Link, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Shield, ShieldCheck, ShieldAlert } from "lucide-react";

import { GsdGraph } from "@/components/GsdGraph";

import type {
  Employee, PassportData, BankAccount, EmergencyContact, AttendanceRecord,
  DisciplineRecord, Certificate, AbcAnalysis, CourseProgressRecord,
  SafetyViolation, PerformanceMetric, TransferRecord, OrgStructureAssignment,
  EmploymentContract, SalaryHistoryRecord, BonusRecord, FineRecord,
  OvertimeRecord, CashAdvanceRecord, LeaveRequest, SickLeaveRecord, BusinessTrip,
  ShiftSwapRecord, SkillGapData, MentorshipData, MesSummary, WmsSummary,
  CustomerComplaint, AssessmentSkipRecord, ZoneTrackingLog
} from "./employee-profile/profile-types";

import { PassportDialog } from "@/components/employee/dialogs/PassportDialog";
import { BankAccountDialog } from "@/components/employee/dialogs/BankAccountDialog";
import { EmergencyContactDialog } from "@/components/employee/dialogs/EmergencyContactDialog";
import { ContractDialog } from "@/components/employee/dialogs/ContractDialog";
import { SalaryDialog } from "@/components/employee/dialogs/SalaryDialog";
import { BonusDialog } from "@/components/employee/dialogs/BonusDialog";
import { FineDialog } from "@/components/employee/dialogs/FineDialog";
import { OvertimeDialog } from "@/components/employee/dialogs/OvertimeDialog";
import { CashAdvanceDialog } from "@/components/employee/dialogs/CashAdvanceDialog";
import { LeaveRequestDialog } from "@/components/employee/dialogs/LeaveRequestDialog";
import { SickLeaveDialog } from "@/components/employee/dialogs/SickLeaveDialog";
import { BusinessTripDialog } from "@/components/employee/dialogs/BusinessTripDialog";
import { EditEmployeeDialog } from "@/components/employee/dialogs/EditEmployeeDialog";
import { ProfileHeader } from "@/components/employee/ProfileHeader";
import { TabNavigation } from "@/components/employee/TabNavigation";
import { EPPageHeader } from "@/components/ep";

const PersonalTab = lazy(() => import("./employee-profile/PersonalTab").then(m => ({ default: m.PersonalTab })));
const WorkTab = lazy(() => import("./employee-profile/WorkTab").then(m => ({ default: m.WorkTab })));
const AttendanceTab = lazy(() => import("./employee-profile/AttendanceTab").then(m => ({ default: m.AttendanceTab })));
const DocumentsTab = lazy(() => import("./employee-profile/DocumentsTab").then(m => ({ default: m.DocumentsTab })));
const DisciplineTab = lazy(() => import("./employee-profile/RemainingTabs").then(m => ({ default: m.DisciplineTab })));
const LearningTab = lazy(() => import("./employee-profile/RemainingTabs").then(m => ({ default: m.LearningTab })));
const AdaptationTab = lazy(() => import("./employee-profile/AdaptationTab").then(m => ({ default: m.AdaptationTab })));
const CareerTab = lazy(() => import("./employee-profile/CareerTab").then(m => ({ default: m.CareerTab })));
const AssetsTab = lazy(() => import("./employee-profile/AssetsTab").then(m => ({ default: m.AssetsTab })));
const ObligationsTab = lazy(() => import("./employee-profile/ObligationsTab").then(m => ({ default: m.ObligationsTab })));
const DailyReportsTab = lazy(() => import("./employee-profile/DailyReportsTab").then(m => ({ default: m.DailyReportsTab })));
const HRCapitalTab = lazy(() => import("./employee-profile/HRCapitalTab").then(m => ({ default: m.HRCapitalTab })));
const TechAccessTab = lazy(() => import("./employee-profile/TechAccessTab").then(m => ({ default: m.TechAccessTab })));
const OffboardingTab = lazy(() => import("./employee-profile/OffboardingTab").then(m => ({ default: m.OffboardingTab })));
const CorporateInventoryTab = lazy(() => import("./employee-profile/CorporateInventoryTab").then(m => ({ default: m.CorporateInventoryTab })));
const MonthlyReportTab = lazy(() => import("./employee-profile/MonthlyReportTab").then(m => ({ default: m.MonthlyReportTab })));
const FinanceTab = lazy(() => import("./employee-profile/FinanceTab").then(m => ({ default: m.FinanceTab })));
const PerformanceTab = lazy(() => import("./employee-profile/PerformanceTab").then(m => ({ default: m.PerformanceTab })));
const GoalsTab = lazy(() => import("./employee-profile/GoalsTab").then(m => ({ default: m.GoalsTab })));
const OneOnOneTab = lazy(() => import("./employee-profile/OneOnOneTab").then(m => ({ default: m.OneOnOneTab })));
const SafetyTab = lazy(() => import("./employee-profile/RemainingTabs").then(m => ({ default: m.SafetyTab })));
const AssessmentTab = lazy(() => import("./employee-profile/AssessmentTab").then(m => ({ default: m.AssessmentTab })));
const MachineOperatorTab = lazy(() => import("./employee-profile/MachineOperatorTab").then(m => ({ default: m.MachineOperatorTab })));

const TabFallback = () => (<div className="space-y-4 py-4"><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-48 w-full rounded-lg" /></div>);
const getInitials = (name: string) => (!name ? "?" : name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase());
const ROLE_OPTIONS = [ { value: "employee", label: "Xodim" }, { value: "hr", label: "HR mutaxassisi" }, { value: "hr_manager", label: "HR menejer" }, { value: "manager", label: "Menejer" }, { value: "director", label: "Direktor" }, { value: "finance", label: "Moliya" }, { value: "finance_manager", label: "Moliya menejer" }, { value: "accountant", label: "Buxgalter" }, { value: "cfo", label: "CFO" }, { value: "warehouse", label: "Ombor" }, { value: "warehouse_manager", label: "Ombor menejer" }, { value: "production", label: "Ishlab chiqarish" }, { value: "production_manager", label: "Ishlab chiqarish menejer" }, { value: "sales", label: "Savdo" }, { value: "it", label: "IT" }, { value: "lms_manager", label: "LMS menejer" }, { value: "pp_manager", label: "PP menejer" }, { value: "qc_manager", label: "QC menejer" }, { value: "super_admin", label: "Super admin" }];
const VALID_TABS = ["personal", "work", "documents", "discipline", "development", "adaptation", "career", "assets", "obligations", "attendance", "daily-reports", "finance", "performance", "goals", "one-on-one", "hr-capital", "corporate-inventory", "monthly-report", "offboarding", "machine-operator"] as const;
type TabValue = typeof VALID_TABS[number];
function parseTabFromSearch(search: string): TabValue { const params = new URLSearchParams(search); const t = params.get("tab") as TabValue | null; return t && VALID_TABS.includes(t as TabValue) ? (t as TabValue) : "personal"; }

// Normalises any API response to a plain array.
// Handles: plain array, { data: [...] }, { items: [...] }, { rows: [...] }, { ok: true, data: [...] }
function toArr<T>(json: unknown): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json as T[];
  if (typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    for (const key of ['data', 'items', 'rows', 'results']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const searchStr = useSearch();
  const [activeTab, setActiveTab] = useState<TabValue>(() => parseTabFromSearch(searchStr));
  const { toast } = useToast();
  const { t } = useTranslation('hr');
  const { t: tCommon } = useTranslation('common');
  const { hasRole } = useAuth();
  const isAdminOrHrManager = hasRole('admin', 'super_admin', 'hr_manager', 'hr');

  useEffect(() => { const tab = parseTabFromSearch(searchStr); if (tab !== activeTab) setActiveTab(tab); }, [searchStr]);
  const handleTabChange = (tab: string) => { const nt = tab as TabValue; setActiveTab(nt); const p = new URLSearchParams(window.location.search); p.set("tab", nt); window.history.pushState(null, "", `${window.location.pathname}?${p.toString()}`); };

  const [passportDialogOpen, setPassportDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [cashAdvanceDialogOpen, setCashAdvanceDialogOpen] = useState(false);
  const [leaveRequestDialogOpen, setLeaveRequestDialogOpen] = useState(false);
  const [sickLeaveDialogOpen, setSickLeaveDialogOpen] = useState(false);
  const [businessTripDialogOpen, setBusinessTripDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [passportForm, setPassportForm] = useState({ passportNumber: "", passportSeries: "", issuedBy: "", issuedDate: "", expiryDate: "", birthPlace: "", citizenship: "Uzbekistan" });
  const [bankForm, setBankForm] = useState({ bankName: "", accountNumber: "", cardNumber: "", cardHolderName: "", mfo: "", inn: "", isPrimary: true });
  const [emergencyForm, setEmergencyForm] = useState({ contactName: "", relationship: "", phoneNumber: "", alternativePhone: "", address: "", isPrimary: true });
  const [contractForm, setContractForm] = useState({ contractNumber: "", contractType: "indefinite", startDate: "", endDate: "", salary: "", workSchedule: "" });
  const [salaryForm, setSalaryForm] = useState({ effectiveDate: "", previousSalary: "", newSalary: "", changeType: "annual_review", notes: "" });
  const [bonusForm, setBonusForm] = useState({ paymentDate: "", amount: "", bonusType: "performance", description: "" });
  const [fineForm, setFineForm] = useState({ fineDate: "", amount: "", fineType: "late", description: "", deductedFromSalary: false });
  const [overtimeForm, setOvertimeForm] = useState({ workDate: "", hours: "", hourlyRate: "", multiplier: "1.5", reason: "" });
  const [cashAdvanceForm, setCashAdvanceForm] = useState({ requestDate: "", amount: "", reason: "", status: "pending" });
  const [leaveRequestForm, setLeaveRequestForm] = useState({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
  const [sickLeaveForm, setSickLeaveForm] = useState({ startDate: "", endDate: "", diagnosis: "", hospitalName: "", doctorName: "", documentNumber: "", isPaid: true, paymentPercent: "100" });
  const [businessTripForm, setBusinessTripForm] = useState({ destination: "", purpose: "", startDate: "", endDate: "", dailyAllowance: "", transportCost: "", accommodationCost: "" });
  const [editForm, setEditForm] = useState({ fullName: "", employeeId: "", phone: "", telegramChatId: "", birthDate: "", hireDate: "", attestationDate: "", address: "", gender: "", status: "", shift: "", workshopZone: "", salaryType: "", positionId: "", departmentId: "", age: "", maritalStatus: "", childrenCount: "", childrenEducation: "", housingType: "", householdSize: "", householdMembers: "", latitude: "", longitude: "" });

  const { data: employee, isLoading: loadingEmployee, isError, refetch} = useQuery<Employee>({ queryKey: ['/api/hr/employees', id], enabled: !!id });
  const { data: passportData, isLoading: loadingPassport } = useQuery<PassportData | null>({
    queryKey: ['/api/employees', id, 'passport'],
    enabled: !!id,
    retry: false,
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/employees/${id}/passport`);
      } catch (e) {
        if ((e as { status?: number })?.status === 404) return null;
        throw e;
      }
    }
  });
  const { data: bankAccounts, isLoading: loadingBanks } = useQuery<BankAccount[]>({ queryKey: ['/api/employees', id, 'bank-accounts'], enabled: !!id });
  const { data: emergencyContacts, isLoading: loadingEmergency } = useQuery<EmergencyContact[]>({ queryKey: ['/api/employees', id, 'emergency-contacts'], enabled: !!id });
  const { data: attendanceData, isLoading: loadingAttendance } = useQuery<AttendanceRecord[]>({ queryKey: ['/api/attendance/user', id], enabled: !!id });
  const { data: disciplineData, isLoading: loadingDiscipline } = useQuery<DisciplineRecord[]>({ queryKey: ['/api/discipline/user', id], enabled: !!id });
  const { data: complaintsData, isLoading: loadingComplaints } = useQuery<{ complaints: CustomerComplaint[] }>({ queryKey: ['/api/integration/employee-complaints', id], enabled: !!id });
  const { data: skipsData, isLoading: loadingSkips } = useQuery<{ skips: AssessmentSkipRecord[] }>({ queryKey: ['/api/integration/employee-assessment-skips', id], enabled: !!id });
  const { data: certificatesData, isLoading: loadingCertificates } = useQuery<Certificate[]>({ queryKey: ['/api/certificates/user', id], enabled: !!id });
  const { data: abcData, isLoading: loadingAbc } = useQuery<AbcAnalysis>({ queryKey: ['/api/abc-analysis/user', id], enabled: !!id });
  const { data: courseProgress, isLoading: loadingProgress } = useQuery<CourseProgressRecord[]>({ queryKey: ['/api/progress/user', id], enabled: !!id });
  const { data: safetyViolations, isLoading: loadingSafety } = useQuery<SafetyViolation[]>({ queryKey: ['/api/safety-violations/user', id], enabled: !!id });
  const { data: metrics } = useQuery<PerformanceMetric[]>({ queryKey: [`/api/erp/employee/${id}/metrics`], enabled: !!id });
  const { data: transfers } = useQuery<TransferRecord[]>({ queryKey: [`/api/erp/employee/${id}/transfer-history`], enabled: !!id });
  const { data: orgStructureData } = useQuery<{ primary: OrgStructureAssignment; all: OrgStructureAssignment[] }>({ queryKey: [`/api/hr/employees/${id}/org-structure`], enabled: !!id });
  const mkArrFn = <T,>(path: string) => async (): Promise<T[]> => {
    try {
      const json = await apiRequest<unknown>('GET', path);
      return toArr<T>(json);
    } catch {
      return [];
    }
  };
  const { data: contracts, isLoading: loadingContracts } = useQuery<EmploymentContract[]>({ queryKey: ['/api/employees', id, 'contracts'], queryFn: mkArrFn<EmploymentContract>(`/api/employees/${id}/contracts`), enabled: !!id });
  const { data: salaryHistory, isLoading: loadingSalaryHistory } = useQuery<SalaryHistoryRecord[]>({ queryKey: ['/api/hr/employees', id, 'salary-history'], queryFn: mkArrFn<SalaryHistoryRecord>(`/api/hr/employees/${id}/salary-history`), enabled: !!id });
  const { data: bonuses, isLoading: loadingBonuses } = useQuery<BonusRecord[]>({ queryKey: ['/api/employees', id, 'bonuses'], queryFn: mkArrFn<BonusRecord>(`/api/employees/${id}/bonuses`), enabled: !!id });
  const { data: fines, isLoading: loadingFines } = useQuery<FineRecord[]>({ queryKey: ['/api/employees', id, 'fines'], queryFn: mkArrFn<FineRecord>(`/api/employees/${id}/fines`), enabled: !!id });
  const { data: overtime, isLoading: loadingOvertime } = useQuery<OvertimeRecord[]>({ queryKey: ['/api/employees', id, 'overtime'], queryFn: mkArrFn<OvertimeRecord>(`/api/employees/${id}/overtime`), enabled: !!id });
  const { data: cashAdvances, isLoading: loadingCashAdvances } = useQuery<CashAdvanceRecord[]>({ queryKey: ['/api/employees', id, 'cash-advances'], queryFn: mkArrFn<CashAdvanceRecord>(`/api/employees/${id}/cash-advances`), enabled: !!id });
  const { data: leaveRequests, isLoading: loadingLeaveRequests } = useQuery<LeaveRequest[]>({ queryKey: ['/api/employees', id, 'leave-requests'], queryFn: mkArrFn<LeaveRequest>(`/api/employees/${id}/leave-requests`), enabled: !!id });
  const { data: sickLeaves, isLoading: loadingSickLeaves } = useQuery<SickLeaveRecord[]>({ queryKey: ['/api/hr/employees', id, 'sick-leaves'], queryFn: mkArrFn<SickLeaveRecord>(`/api/hr/employees/${id}/sick-leaves`), enabled: !!id });
  const { data: businessTrips, isLoading: loadingBusinessTrips } = useQuery<BusinessTrip[]>({ queryKey: ['/api/employees', id, 'business-trips'], queryFn: mkArrFn<BusinessTrip>(`/api/employees/${id}/business-trips`), enabled: !!id });
  const { data: shiftSwaps, isLoading: loadingShiftSwaps } = useQuery<ShiftSwapRecord[]>({ 
    queryKey: ['/api/integration/swap-requests', id], 
    queryFn: async () => {
      try {
        const json = await apiRequest<unknown>('GET', `/api/integration/swap-requests?requestedBy=${id}`);
        return toArr<ShiftSwapRecord>(json);
      } catch {
        return [];
      }
    },
    enabled: !!id 
  });
  const { data: zoneLogs, isLoading: loadingZoneLogs } = useQuery<ZoneTrackingLog[]>({ queryKey: ['/api/attendance/zone-logs', id], enabled: !!id });
  const { data: skillGapData, isLoading: loadingSkillGap } = useQuery<SkillGapData | null>({
    queryKey: ['/api/integration/skill-gap', id],
    queryFn: async () => {
      try {
        const json = await apiRequest<Record<string, unknown> | null>('GET', `/api/integration/skill-gap/${id}`);
        if (!json || typeof json !== 'object') return null;
        const inner = (json as Record<string, unknown>);
        if (!Array.isArray((inner as { gaps?: unknown[] }).gaps)) (inner as { gaps: unknown[] }).gaps = [];
        return inner as unknown as SkillGapData;
      } catch {
        return null;
      }
    },
    enabled: !!id
  });
  const { data: mentorshipData, isLoading: loadingMentorship } = useQuery<MentorshipData>({ 
    queryKey: ['/api/integration/employee-mentorships', id], 
    queryFn: async () => { 
      try {
        return await apiRequest('GET', `/api/integration/employee-mentorships/${id}`);
      } catch {
        return { asMentor: [], asMentee: [] };
      } 
    }, 
    enabled: !!id 
  });
  const { data: mesSummary, isLoading: loadingMes } = useQuery<MesSummary | null>({
    queryKey: ['/api/integration/employee-mes-summary', id],
    queryFn: async () => {
      try {
        const json = await apiRequest<Record<string, unknown> | null>('GET', `/api/integration/employee-mes-summary/${id}?months=3`);
        if (!json || typeof json !== 'object') return null;
        const inner = json as Record<string, unknown>;
        if (!(inner as { summary?: unknown }).summary) {
          (inner as { summary: unknown }).summary = { totalSessions: 0, completedSessions: 0, totalActual: 0, totalTarget: 0, totalDefects: 0, defectPercent: 0, avgOee: 0, goalAchievement: 0, totalRunningMinutes: 0, totalStoppedMinutes: 0, workTimeRatio: 0, totalStoppages: 0 };
        }
        return inner as unknown as MesSummary;
      } catch {
        return null;
      }
    },
    enabled: !!id
  });
  const { data: wmsSummary, isLoading: loadingWms } = useQuery<WmsSummary | null>({
    queryKey: ['/api/integration/employee-wms-summary', id],
    queryFn: async () => {
      try {
        const json = await apiRequest<Record<string, unknown> | null>('GET', `/api/integration/employee-wms-summary/${id}`);
        if (!json || typeof json !== 'object') return null;
        const inner = json as Record<string, unknown>;
        if (!(inner as { summary?: unknown }).summary) {
          (inner as { summary: unknown }).summary = { totalMovements: 0, totalIssued: 0, totalReturned: 0, totalWasted: 0, overallReturnRate: 0 };
        }
        if (!Array.isArray((inner as { materials?: unknown[] }).materials)) {
          (inner as { materials: unknown[] }).materials = [];
        }
        return inner as unknown as WmsSummary;
      } catch {
        return null;
      }
    },
    enabled: !!id
  });
  const { data: payrollSummary } = useQuery<any | null>({ 
    queryKey: ['/api/hr/employees', id, 'payroll-summary'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/hr/employees/${id}/payroll-summary`);
      } catch {
        return null;
      } 
    }, 
    enabled: !!id 
  });
  // Legacy /api/positions + /api/departments removed — dept/function is owned by org-schema.
  const { data: corpInfoForMachine } = useQuery<{ is_machine_operator?: boolean }>({ 
    queryKey: ['/api/hr/employee-corp', id], 
    queryFn: async () => { 
      try {
        return await apiRequest('GET', `/api/hr/employee-corp/${id}`);
      } catch {
        return {};
      } 
    }, 
    enabled: !!id 
  });

  const isMachineOperator = corpInfoForMachine?.is_machine_operator === true;
  const savePassportMutation = useMutation({ mutationFn: async (d: typeof passportForm) => apiRequest("POST", `/api/employees/${id}/passport`, { ...d, userId: id }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'passport'] }); setPassportDialogOpen(false); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveBankMutation = useMutation({ mutationFn: async (d: typeof bankForm) => apiRequest("POST", `/api/employees/${id}/bank-accounts`, { ...d, userId: id }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'bank-accounts'] }); setBankDialogOpen(false); setBankForm({ bankName: "", accountNumber: "", cardNumber: "", cardHolderName: "", mfo: "", inn: "", isPrimary: true }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveEmergencyMutation = useMutation({ mutationFn: async (d: typeof emergencyForm) => apiRequest("POST", `/api/employees/${id}/emergency-contacts`, { ...d, userId: id }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'emergency-contacts'] }); setEmergencyDialogOpen(false); setEmergencyForm({ contactName: "", relationship: "", phoneNumber: "", alternativePhone: "", address: "", isPrimary: true }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveContractMutation = useMutation({ mutationFn: async (d: typeof contractForm) => apiRequest("POST", `/api/employees/${id}/contracts`, { ...d, userId: id, salary: parseFloat(d.salary) || 0 }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'contracts'] }); setContractDialogOpen(false); setContractForm({ contractNumber: "", contractType: "indefinite", startDate: "", endDate: "", salary: "", workSchedule: "" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveSalaryChangeMutation = useMutation({ mutationFn: async (d: typeof salaryForm) => { const p = parseFloat(d.previousSalary) || 0; const n = parseFloat(d.newSalary) || 0; return apiRequest("POST", `/api/hr/employees/${id}/salary-history`, { ...d, userId: id, previousSalary: p, newSalary: n, changePercent: p > 0 ? ((n - p) / p * 100) : 0 }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/hr/employees', id, 'salary-history'] }); setSalaryDialogOpen(false); setSalaryForm({ effectiveDate: "", previousSalary: "", newSalary: "", changeType: "annual_review", notes: "" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveBonusMutation = useMutation({ mutationFn: async (d: typeof bonusForm) => apiRequest("POST", `/api/employees/${id}/bonuses`, { ...d, userId: id, amount: parseFloat(d.amount) || 0 }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'bonuses'] }); setBonusDialogOpen(false); setBonusForm({ paymentDate: "", amount: "", bonusType: "performance", description: "" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveFineMutation = useMutation({ mutationFn: async (d: typeof fineForm) => apiRequest("POST", `/api/employees/${id}/fines`, { ...d, userId: id, amount: parseFloat(d.amount) || 0 }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'fines'] }); setFineDialogOpen(false); setFineForm({ fineDate: "", amount: "", fineType: "late", description: "", deductedFromSalary: false }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveOvertimeMutation = useMutation({ mutationFn: async (d: typeof overtimeForm) => { const h = parseFloat(d.hours) || 0; const r = parseFloat(d.hourlyRate) || 0; const m = parseFloat(d.multiplier) || 1; return apiRequest("POST", `/api/employees/${id}/overtime`, { ...d, userId: id, hours: h, hourlyRate: r, multiplier: m, totalAmount: h * r * m }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'overtime'] }); setOvertimeDialogOpen(false); setOvertimeForm({ workDate: "", hours: "", hourlyRate: "", multiplier: "1.5", reason: "" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveCashAdvanceMutation = useMutation({ mutationFn: async (d: typeof cashAdvanceForm) => apiRequest("POST", `/api/employees/${id}/cash-advances`, { ...d, userId: id, amount: parseFloat(d.amount) || 0 }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'cash-advances'] }); setCashAdvanceDialogOpen(false); setCashAdvanceForm({ requestDate: "", amount: "", reason: "", status: "pending" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveLeaveRequestMutation = useMutation({ mutationFn: async (d: typeof leaveRequestForm) => { const s = new Date(d.startDate); const e = new Date(d.endDate); return apiRequest("POST", `/api/employees/${id}/leave-requests`, { ...d, userId: id, totalDays: Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1, status: "pending" }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'leave-requests'] }); setLeaveRequestDialogOpen(false); setLeaveRequestForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveSickLeaveMutation = useMutation({ mutationFn: async (d: typeof sickLeaveForm) => { const s = new Date(d.startDate); const e = new Date(d.endDate); return apiRequest("POST", `/api/hr/employees/${id}/sick-leaves`, { ...d, userId: id, totalDays: Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1, paymentPercent: parseInt(d.paymentPercent) || 100 }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/hr/employees', id, 'sick-leaves'] }); setSickLeaveDialogOpen(false); setSickLeaveForm({ startDate: "", endDate: "", diagnosis: "", hospitalName: "", doctorName: "", documentNumber: "", isPaid: true, paymentPercent: "100" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const saveBusinessTripMutation = useMutation({ mutationFn: async (d: typeof businessTripForm) => { const s = new Date(d.startDate); const e = new Date(d.endDate); const dt = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1; const da = parseFloat(d.dailyAllowance) || 0; const tc = parseFloat(d.transportCost) || 0; const ac = parseFloat(d.accommodationCost) || 0; return apiRequest("POST", `/api/employees/${id}/business-trips`, { ...d, userId: id, totalDays: dt, totalCost: da * dt + tc + ac, status: "planned" }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'business-trips'] }); setBusinessTripDialogOpen(false); setBusinessTripForm({ destination: "", purpose: "", startDate: "", endDate: "", dailyAllowance: "", transportCost: "", accommodationCost: "" }); toast({ title: tCommon('savedSuccessfully') }); } });
  const updateRoleMutation = useMutation({ mutationFn: async (r: string) => apiRequest("PATCH", `/api/hr/employees/${id}`, { role: r }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/hr/employees', id] }); toast({ title: "Rol muvaffaqiyatli yangilandi" }); } });
  const updateEmployeeMutation = useMutation({ mutationFn: async (d: typeof editForm) => apiRequest("PATCH", `/api/hr/employees/${id}`, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/hr/employees', id] }); queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] }); setEditDialogOpen(false); toast({ title: "Xodim ma'lumotlari muvaffaqiyatli yangilandi" }); } });

  const calculateWorkExperience = () => { if (!employee?.hireDate) return tCommon('unknown'); const h = new Date(employee.hireDate); const n = new Date(); const y = Math.floor((n.getTime() - h.getTime()) / (365.25 * 24 * 60 * 60 * 1000)); const m = Math.floor(((n.getTime() - h.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)); return y > 0 ? `${y} ${t('years')} ${m} ${t('months')}` : `${m} ${t('months')}`; };

  const today = new Date(); const in30 = new Date(today); in30.setDate(today.getDate() + 30);
  const expiredCerts = certificatesData?.filter(c => c.expiryDate && new Date(c.expiryDate) < today) || [];
  const expiringSoonCerts = certificatesData?.filter(c => c.expiryDate && new Date(c.expiryDate) >= today && new Date(c.expiryDate) <= in30) || [];
  const pres = attendanceData?.filter(a => a.status === "present").length || 0; const late = attendanceData?.filter(a => a.isLate).length || 0;
  const attStats = { total: attendanceData?.length || 0, present: pres, absent: attendanceData?.filter(a => a.status === "absent").length || 0, late, sick: attendanceData?.filter(a => a.status === "sick").length || 0, leave: attendanceData?.filter(a => a.status === "leave").length || 0, punctualPercentage: attendanceData?.length ? Math.round(((pres - late) / attendanceData.length) * 100) : 0, totalMinutesLate: attendanceData?.reduce((s, a) => s + (a.minutesLate || 0), 0) || 0 };
  const discStats = { warnings: disciplineData?.filter(d => d.type === "warning").length || 0, penalties: disciplineData?.filter(d => d.type === "penalty").length || 0, rewards: disciplineData?.filter(d => d.type === "reward").length || 0, totalPenaltyAmount: disciplineData?.filter(d => d.type === "penalty").reduce((s, d) => s + (d.amount || 0), 0) || 0, totalRewardAmount: disciplineData?.filter(d => d.type === "reward").reduce((s, d) => s + (d.amount || 0), 0) || 0 };
  const attPie = ([{ name: "Kelgan", value: attStats.present, color: "#10b981" }, { name: "Kelmagan", value: attStats.absent, color: "#ef4444" }, { name: "Kechikkan", value: attStats.late, color: "#f59e0b" }, { name: "Kasallik", value: attStats.sick, color: "#3b82f6" }, { name: "Ta'til", value: attStats.leave, color: "#8b5cf6" }]).filter(d => d.value > 0);

  if (loadingEmployee) return <div className="p-6 space-y-6"><Skeleton className="h-48 w-full rounded-lg" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" /></div></div>;
  if (isError || !employee) return <div className="h-screen flex items-center justify-center"><Card className="p-6">{t('employeeNotFound')}</Card></div>;

  return (
    <div className="space-y-5" style={{ background: "#F0F4F8", minHeight: "100%", margin: "-16px -24px", padding: "16px 24px" }}>
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" asChild className="rounded-full" style={{ background: "#fff", boxShadow: "2px 2px 8px rgba(163,177,198,0.35)" }}><Link href="/employees"><ArrowLeft className="h-4 w-4" /></Link></Button><EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("xodimProfili")}</b></>}
        title={t("xodimProfili")}
      /></div>
      <ProfileHeader employee={employee} abcData={abcData} orgStructureData={orgStructureData} contracts={contracts} certificatesData={certificatesData} payrollSummary={payrollSummary} salaryHistory={salaryHistory} expiredCerts={expiredCerts} expiringSoonCerts={expiringSoonCerts} getInitials={getInitials} onEdit={() => setEditDialogOpen(true)} attendanceStats={attStats} attendanceData={attendanceData} />
      {isAdminOrHrManager && (
        <Card className="border border-border shadow-none"><CardContent className="p-4 flex flex-wrap items-center gap-6"><div className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground"><Shield className="h-3.5 w-3.5" /> {t("kirishHuquqlari")}</div><Select value={employee.role || "employee"} onValueChange={(val) => updateRoleMutation.mutate(val)} disabled={updateRoleMutation.isPending}><SelectTrigger className="h-9 text-xs w-44"><SelectValue /></SelectTrigger><SelectContent>{(Array.isArray(ROLE_OPTIONS) ? ROLE_OPTIONS : []).map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}</SelectContent></Select><div className="flex items-center gap-2">{employee.hasPassword ? <Badge className="bg-green-100 text-green-800 text-xs"><ShieldCheck className="h-3 w-3 mr-1" /> {t("ornatilgan")}</Badge> : <Badge className="bg-red-50 text-[var(--ep-red)] text-xs"><ShieldAlert className="h-3 w-3 mr-1" /> {t("ornatilmagan")}</Badge>}</div></CardContent></Card>
      )}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabNavigation isAdminOrHrManager={isAdminOrHrManager} isMachineOperator={isMachineOperator} status={employee.status} />
        <div className="mt-6"><Suspense fallback={<TabFallback />}>
          <TabsContent value="personal"><PersonalTab employee={employee} t={t} tCommon={tCommon} passportData={passportData} loadingPassport={loadingPassport} passportDialogOpen={passportDialogOpen} setPassportDialogOpen={setPassportDialogOpen} passportForm={passportForm} setPassportForm={setPassportForm} savePassportMutation={savePassportMutation} bankAccounts={bankAccounts || []} loadingBanks={loadingBanks} bankDialogOpen={bankDialogOpen} setBankDialogOpen={setBankDialogOpen} bankForm={bankForm} setBankForm={setBankForm} saveBankMutation={saveBankMutation} emergencyContacts={emergencyContacts || []} loadingEmergency={loadingEmergency} emergencyDialogOpen={emergencyDialogOpen} setEmergencyDialogOpen={setEmergencyDialogOpen} emergencyForm={emergencyForm} setEmergencyForm={setEmergencyForm} saveEmergencyMutation={saveEmergencyMutation} /></TabsContent>
          <TabsContent value="work"><WorkTab employee={employee} t={t} tCommon={tCommon} calculateWorkExperience={calculateWorkExperience} contractDialogOpen={contractDialogOpen} setContractDialogOpen={setContractDialogOpen} contractForm={contractForm} setContractForm={setContractForm} saveContractMutation={saveContractMutation} loadingContracts={loadingContracts} contracts={contracts || []} salaryDialogOpen={salaryDialogOpen} setSalaryDialogOpen={setSalaryDialogOpen} salaryForm={salaryForm} setSalaryForm={setSalaryForm} saveSalaryChangeMutation={saveSalaryChangeMutation} loadingSalaryHistory={loadingSalaryHistory} salaryHistory={salaryHistory || []} transfers={transfers || []} /></TabsContent>
          <TabsContent value="documents"><DocumentsTab employeeId={id!} /></TabsContent>
          <TabsContent value="discipline"><DisciplineTab tCommon={tCommon} disciplineData={disciplineData} loadingDiscipline={loadingDiscipline} disciplineStats={discStats} customerComplaints={complaintsData?.complaints} loadingComplaints={loadingComplaints} assessmentSkips={skipsData?.skips} loadingSkips={loadingSkips} /></TabsContent>
          <TabsContent value="development"><LearningTab tCommon={tCommon} certificatesData={certificatesData} loadingCertificates={loadingCertificates} courseProgress={courseProgress} loadingProgress={loadingProgress} skillGapData={skillGapData} loadingSkillGap={loadingSkillGap} mentorshipData={mentorshipData} loadingMentorship={loadingMentorship} /></TabsContent>
          <TabsContent value="adaptation"><AdaptationTab employeeId={id!} isHr={isAdminOrHrManager} /></TabsContent>
          <TabsContent value="career"><CareerTab employeeId={id!} /></TabsContent>
          <TabsContent value="assets"><AssetsTab employeeId={id!} /></TabsContent>
          <TabsContent value="obligations"><ObligationsTab employeeId={id!} baseSalary={employee.salary} cashAdvances={cashAdvances || []} loadingCashAdvances={loadingCashAdvances} /></TabsContent>
          <TabsContent value="attendance"><AttendanceTab t={t} tCommon={tCommon} attendanceData={attendanceData} attendanceStats={attStats} attendancePieData={attPie} loadingAttendance={loadingAttendance} shiftSwaps={shiftSwaps || []} loadingShiftSwaps={loadingShiftSwaps} zoneLogs={zoneLogs || []} loadingZoneLogs={loadingZoneLogs} /></TabsContent>
          <TabsContent value="daily-reports"><DailyReportsTab employeeId={id!} isMachineOperator={isMachineOperator} /></TabsContent>
          <TabsContent value="finance"><FinanceTab tCommon={tCommon} userId={id} baseSalary={employee.salary} salaryType={employee.salaryType} salaryHistory={salaryHistory || []} bonusDialogOpen={bonusDialogOpen} setBonusDialogOpen={setBonusDialogOpen} bonusForm={bonusForm} setBonusForm={setBonusForm} saveBonusMutation={saveBonusMutation} loadingBonuses={loadingBonuses} bonuses={bonuses || []} fineDialogOpen={fineDialogOpen} setFineDialogOpen={setFineDialogOpen} fineForm={fineForm} setFineForm={setFineForm} saveFineMutation={saveFineMutation} loadingFines={loadingFines} fines={fines || []} overtimeDialogOpen={overtimeDialogOpen} setOvertimeDialogOpen={setOvertimeDialogOpen} overtimeForm={overtimeForm} setOvertimeForm={setOvertimeForm} saveOvertimeMutation={saveOvertimeMutation} loadingOvertime={loadingOvertime} overtime={overtime || []} cashAdvanceDialogOpen={cashAdvanceDialogOpen} setCashAdvanceDialogOpen={setCashAdvanceDialogOpen} cashAdvanceForm={cashAdvanceForm} setCashAdvanceForm={setCashAdvanceForm} saveCashAdvanceMutation={saveCashAdvanceMutation} loadingCashAdvances={loadingCashAdvances} cashAdvances={cashAdvances || []} /></TabsContent>
          <TabsContent value="performance"><PerformanceTab t={t} tCommon={tCommon} loadingAbc={loadingAbc} loadingProgress={loadingProgress} abcData={abcData} courseProgress={courseProgress || []} metrics={metrics || []} attendanceStats={attStats} getGradeColor={(g: string) => g === "A" ? "bg-green-500" : g === "B" ? "bg-yellow-500" : "bg-red-500"} mesSummary={mesSummary} loadingMes={loadingMes} wmsSummary={wmsSummary} loadingWms={loadingWms} />{id && <div className="mt-4"><GsdGraph employeeId={id} canEdit={isAdminOrHrManager} /></div>}</TabsContent>
          <TabsContent value="goals">{id && <GoalsTab userId={parseInt(id)} tCommon={tCommon} />}</TabsContent>
          <TabsContent value="one-on-one">{id && <OneOnOneTab userId={parseInt(id)} tCommon={tCommon} />}</TabsContent>
          <TabsContent value="corporate-inventory"><CorporateInventoryTab employeeId={id!} isHr={isAdminOrHrManager} /></TabsContent>
          <TabsContent value="monthly-report"><MonthlyReportTab employeeId={id!} /></TabsContent>
          {(employee.status === "terminated" || employee.status === "offboarding") && <TabsContent value="offboarding"><OffboardingTab employeeId={id!} /></TabsContent>}
          {isMachineOperator && <TabsContent value="machine-operator"><MachineOperatorTab employeeId={id!} /></TabsContent>}
        </Suspense></div>
      </Tabs>
      <PassportDialog open={passportDialogOpen} onOpenChange={setPassportDialogOpen} form={passportForm} onChange={setPassportForm} onSave={() => savePassportMutation.mutate(passportForm)} isPending={savePassportMutation.isPending} />
      <BankAccountDialog open={bankDialogOpen} onOpenChange={setBankDialogOpen} form={bankForm} onChange={setBankForm} onSave={() => saveBankMutation.mutate(bankForm)} isPending={saveBankMutation.isPending} />
      <EmergencyContactDialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen} form={emergencyForm} onChange={setEmergencyForm} onSave={() => saveEmergencyMutation.mutate(emergencyForm)} isPending={saveEmergencyMutation.isPending} />
      <ContractDialog open={contractDialogOpen} onOpenChange={setContractDialogOpen} form={contractForm} onChange={setContractForm} onSave={() => saveContractMutation.mutate(contractForm)} isPending={saveContractMutation.isPending} />
      <SalaryDialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen} form={salaryForm} onChange={setSalaryForm} onSave={() => saveSalaryChangeMutation.mutate(salaryForm)} isPending={saveSalaryChangeMutation.isPending} />
      <BonusDialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen} form={bonusForm} onChange={setBonusForm} onSave={() => saveBonusMutation.mutate(bonusForm)} isPending={saveBonusMutation.isPending} />
      <FineDialog open={fineDialogOpen} onOpenChange={setFineDialogOpen} form={fineForm} onChange={setFineForm} onSave={() => saveFineMutation.mutate(fineForm)} isPending={saveFineMutation.isPending} />
      <OvertimeDialog open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen} form={overtimeForm} onChange={setOvertimeForm} onSave={() => saveOvertimeMutation.mutate(overtimeForm)} isPending={saveOvertimeMutation.isPending} />
      <CashAdvanceDialog open={cashAdvanceDialogOpen} onOpenChange={setCashAdvanceDialogOpen} form={cashAdvanceForm} onChange={setCashAdvanceForm} onSave={() => saveCashAdvanceMutation.mutate(cashAdvanceForm)} isPending={saveCashAdvanceMutation.isPending} />
      <LeaveRequestDialog open={leaveRequestDialogOpen} onOpenChange={setLeaveRequestDialogOpen} form={leaveRequestForm} onChange={setLeaveRequestForm} onSave={() => saveLeaveRequestMutation.mutate(leaveRequestForm)} isPending={saveLeaveRequestMutation.isPending} />
      <SickLeaveDialog open={sickLeaveDialogOpen} onOpenChange={setSickLeaveDialogOpen} form={sickLeaveForm} onChange={setSickLeaveForm} onSave={() => saveSickLeaveMutation.mutate(sickLeaveForm)} isPending={saveSickLeaveMutation.isPending} />
      <BusinessTripDialog open={businessTripDialogOpen} onOpenChange={setBusinessTripDialogOpen} form={businessTripForm} onChange={setBusinessTripForm} onSave={() => saveBusinessTripMutation.mutate(businessTripForm)} isPending={saveBusinessTripMutation.isPending} />
      <EditEmployeeDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} form={editForm} onChange={setEditForm} onSave={() => updateEmployeeMutation.mutate(editForm)} isPending={updateEmployeeMutation.isPending} />
    </div>
  );
}
