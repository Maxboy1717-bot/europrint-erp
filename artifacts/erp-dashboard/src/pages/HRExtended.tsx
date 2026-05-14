/**
 * @module HRExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, UserX, Users, HeartPulse, MessageSquareWarning,
  TrendingUp, UserPlus, ShieldAlert
} from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

import { OnboardingSection } from "@/components/hr/extended/OnboardingSection";
import { VacationSection } from "@/components/hr/extended/VacationSection";
import { OffboardingSection } from "@/components/hr/extended/OffboardingSection";
import { AlumniSection } from "@/components/hr/extended/AlumniSection";
import { HealthSection } from "@/components/hr/extended/HealthSection";
import { ConflictSection } from "@/components/hr/extended/ConflictSection";
import { CareerSection } from "@/components/hr/extended/CareerSection";
import { SafetySection } from "@/components/hr/extended/SafetySection";

import {
  HREmployee, HRLeaveRequest, AlumniResponse, HealthResponse,
  ChecklistItem, SafetyIncident, PpeRecord, SafetyTraining,
  HazardZone, SafetySummary, DeptSafetySummary, ConflictReport,
  CareerPlan, TabMeta
} from "@/components/hr/extended/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

const URL_TAB_MAP: Record<string, string> = {
  "/hr/onboarding": "onboarding",
  "/hr/vacation-sick": "vacation",
  "/hr/offboarding": "offboarding",
  "/hr/alumni": "alumni",
  "/hr/health-monitoring": "health",
  "/hr/conflict": "conflict",
  "/hr/career-path": "career",
  "/hr/safety": "safety",
};

const tabMeta: Record<string, TabMeta> = {
  "onboarding": { title: "Onboarding",          icon: UserPlus },
  "vacation":   { title: "Ta'til va Kasallik",  icon: Calendar },
  "offboarding":{ title: "Offboarding",         icon: UserX },
  "alumni":     { title: "Alumni",              icon: Users },
  "health":     { title: "Sog'liq Nazorati",   icon: HeartPulse },
  "conflict":   { title: "Konflikt Boshqaruvi", icon: MessageSquareWarning },
  "career":     { title: "Kasbiy O'sish",       icon: TrendingUp },
  "safety":     { title: "Xavfsizlik",          icon: ShieldAlert },
};

export default function HRExtended() {
  const { t } = useTranslation("common");
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "vacation");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["vacation"];
  const { toast } = useToast();

  const { data: leaveRequests = [], isLoading: leaveLoading, refetch: refetchLeave } = useQuery<HRLeaveRequest[]>({
    queryKey: ["/api/hr/leave-requests"],
    select: selectArray<HRLeaveRequest>,
  });

  const { data: employees = [], isLoading: empLoading } = useQuery<HREmployee[]>({
    queryKey: ["/api/hr/employees"],
    select: selectArray<HREmployee>,
  });

  const { data: careerPlans = [], isLoading: careerLoading } = useQuery<CareerPlan[]>({
    queryKey: ["/api/succession/career-plans"],
    select: selectArray<CareerPlan>,
  });

  const { data: conflictReports = [], isLoading: conflictLoading } = useQuery<ConflictReport[]>({
    queryKey: ["/api/hr/conflict-reports"],
    select: selectArray<ConflictReport>,
  });

  const { data: alumniResponse } = useQuery<AlumniResponse>({
    queryKey: ["/api/hr/alumni"]
  });
  const alumniList = alumniResponse?.alumni || [];
  const alumniStats = alumniResponse?.stats || { total: 0, returned: 0, collaborations: 0 };

  const { data: healthResponse } = useQuery<HealthResponse>({
    queryKey: ["/api/hr/health-checkups"]
  });
  const healthCheckups = healthResponse?.checkups || [];
  const healthStats = healthResponse?.stats || { totalExamined: 0, totalEmployees: 0, scheduled: 0, highSick: 0 };

  const { data: checklists = [] } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/hr/onboarding-checklists"],
    select: selectArray<ChecklistItem>,
  });
  const onboardingChecklists = (Array.isArray(checklists) ? checklists : []).filter(c => c.type === "onboarding");
  const offboardingChecklists = (Array.isArray(checklists) ? checklists : []).filter(c => c.type === "offboarding");

  const { data: safetyIncidents = [], isLoading: incidentsLoading } = useQuery<SafetyIncident[]>({
    queryKey: ["/api/hr/safety/incidents"],
    select: selectArray<SafetyIncident>,
  });

  const { data: ppeRecords = [], isLoading: ppeLoading } = useQuery<PpeRecord[]>({
    queryKey: ["/api/hr/safety/ppe-compliance"],
    select: selectArray<PpeRecord>,
  });

  const { data: safetyTrainingsList = [], isLoading: trainingsLoading } = useQuery<SafetyTraining[]>({
    queryKey: ["/api/hr/safety/trainings"],
    select: selectArray<SafetyTraining>,
  });

  const { data: hazardZonesList = [], isLoading: zonesLoading } = useQuery<HazardZone[]>({
    queryKey: ["/api/hr/safety/hazard-zones"],
    select: selectArray<HazardZone>,
  });

  const { data: safetySummary } = useQuery<SafetySummary>({
    queryKey: ["/api/hr/safety/summary"]
  });
  const { data: deptSafetySummary = [] } = useQuery<DeptSafetySummary[]>({
    queryKey: ["/api/hr/safety/department-summary"],
    select: selectArray<DeptSafetySummary>,
  });

  const updateChecklist = useMutation({
    mutationFn: ({ id, completedItems }: { id: string; completedItems: number }) =>
      apiRequest("PATCH", `/api/hr/onboarding-checklists/${id}`, { completedItems }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding-checklists"] });
      toast({ title: "Checklist yangilandi" });
    },
  });

  const createLeaveRequest = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/leave-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leave-requests"] });
      toast({ title: "So'rov yuborildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createConflictReport = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/conflict-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/conflict-reports"] });
      toast({ title: "Hodisa qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createIncident = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/incidents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/summary"] });
      toast({ title: "Xavfsizlik hodisasi qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createTraining = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/trainings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/summary"] });
      toast({ title: "Xavfsizlik treningi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createZone = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/hazard-zones", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/hazard-zones"] });
      toast({ title: "Xavfli zona qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createPpe = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/ppe-compliance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/ppe-compliance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/summary"] });
      toast({ title: "PPE yozuvi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const updateIncidentStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/hr/safety/incidents/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/summary"] });
    },
  });

  const deleteIncident = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr/safety/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/department-summary"] });
      toast({ title: "Hodisa o'chirildi" });
    },
    onError: () => toast({ title: "O'chirishda xatolik", variant: "destructive" }),
  });

  const deleteHazardZone = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hr/safety/hazard-zones/${id}`, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/hazard-zones"] });
      toast({ title: "Xavfli zona o'chirildi" });
    },
    onError: () => toast({ title: "O'chirishda xatolik", variant: "destructive" }),
  });

  const pendingLeave = (Array.isArray(leaveRequests) ? leaveRequests : []).filter((r) => r.status === "pending");
  const onLeave = (Array.isArray(leaveRequests) ? leaveRequests : []).filter((r) => r.status === "approved" && r.startDate && r.endDate && new Date(r.startDate) <= new Date() && new Date(r.endDate) >= new Date());

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const newEmployees = (Array.isArray(employees) ? employees : []).filter((e) => {
    const dateStr = e.hireDate || e.createdAt;
    if (!dateStr) return false;
    return new Date(dateStr) >= ninetyDaysAgo;
  });

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">{t("hrKengaytirilganModullar")}</h1>
        {pendingLeave.length > 0 && (
          <EPStatusPill tone="neutral" className="ml-2">{pendingLeave.length} so'rov kutmoqda</EPStatusPill>
        )}
        <Button variant="ghost" size="sm" onClick={() => refetchLeave()} className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="HR"
            moduleColor="text-[var(--ep-blue)]"
            sectionTitle={meta?.title || ""}
            icon={meta?.icon || (() => null)}
          />

          <TabsContent value="onboarding" className="mt-0">
            <OnboardingSection empLoading={empLoading} newEmployees={newEmployees} onboardingChecklists={onboardingChecklists} updateChecklist={updateChecklist} />
          </TabsContent>

          <TabsContent value="vacation" className="mt-0">
            <VacationSection leaveRequests={leaveRequests} leaveLoading={leaveLoading} refetchLeave={refetchLeave} employees={employees} createLeaveRequest={createLeaveRequest} pendingLeave={pendingLeave} onLeave={onLeave} />
          </TabsContent>

          <TabsContent value="offboarding" className="mt-0">
            <OffboardingSection offboardingChecklists={offboardingChecklists} />
          </TabsContent>

          <TabsContent value="alumni" className="mt-0">
            <AlumniSection alumniList={alumniList} alumniStats={alumniStats} />
          </TabsContent>

          <TabsContent value="health" className="mt-0">
            <HealthSection healthCheckups={healthCheckups} healthStats={healthStats} />
          </TabsContent>

          <TabsContent value="conflict" className="mt-0">
            <ConflictSection conflictReports={conflictReports} conflictLoading={conflictLoading} createConflictReport={createConflictReport} />
          </TabsContent>

          <TabsContent value="career" className="mt-0">
            <CareerSection careerPlans={careerPlans} careerLoading={careerLoading} />
          </TabsContent>

          <TabsContent value="safety" className="mt-0">
            <SafetySection
              safetySummary={safetySummary} deptSafetySummary={deptSafetySummary} safetyIncidents={safetyIncidents} incidentsLoading={incidentsLoading}
              ppeRecords={ppeRecords} ppeLoading={ppeLoading} safetyTrainingsList={safetyTrainingsList} trainingsLoading={trainingsLoading}
              hazardZonesList={hazardZonesList} zonesLoading={zonesLoading} createIncident={createIncident} createTraining={createTraining}
              createZone={createZone} createPpe={createPpe} updateIncidentStatus={updateIncidentStatus} deleteIncident={deleteIncident} deleteHazardZone={deleteHazardZone}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
