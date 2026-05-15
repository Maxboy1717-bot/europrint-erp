/**
 * @module SecurityDashboard
 * @description Route-level orchestrator for the Security Dashboard page.
 * Owns all server-state (useQuery / useMutation), local UI state (dialogs,
 * active tab, form values), and derived counts. Delegates all rendering to
 * SecurityDashboardCards, SecurityDashboardSections, and
 * SecurityDashboardDialogs.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

import {
  DEFAULT_VISITOR_FORM,
  DEFAULT_INCIDENT_FORM,
  DEFAULT_PPE_FORM,
  type AttendanceRecord,
  type DailySummary,
  type Visitor,
  type SecurityIncident,
  type PPECheck,
  type FireSensor,
  type AccessZone,
  type VisitorForm,
  type IncidentForm,
  type PPEForm,
} from "./SecurityDashboardTypes";

import { SecurityKpiStrip } from "./SecurityDashboardCards";

import { AttendanceTab, VisitorsTab } from "./SecurityDashboardSections";
import { IncidentsTab, PPETab, ZonesTab, FireTab } from "./SecurityDashboardManagement";

import {
  VisitorDialog,
  IncidentDialog,
  PPEDialog,
} from "./SecurityDashboardDialogs";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SecurityDashboard() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // --- tab ---
  const [activeTab, setActiveTab] = useState("overview");

  // --- dialog open flags ---
  const [visitorDialogOpen, setVisitorDialogOpen] = useState(false);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [ppeDialogOpen, setPpeDialogOpen] = useState(false);

  // --- form state ---
  const [visitorForm, setVisitorForm] = useState<VisitorForm>(DEFAULT_VISITOR_FORM);
  const [incidentForm, setIncidentForm] = useState<IncidentForm>(DEFAULT_INCIDENT_FORM);
  const [ppeForm, setPpeForm] = useState<PPEForm>(DEFAULT_PPE_FORM);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: records, isLoading: recordsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/security/attendance-records"],
  });

  const { data: summary } = useQuery<DailySummary>({
    queryKey: ["/api/security/daily-summary"],
    refetchInterval: 60_000,
  });

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/security/visitors"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/security/visitors")) as unknown as Response;
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: incidents = [] } = useQuery<SecurityIncident[]>({
    queryKey: ["/api/security/incidents"],
  });

  const { data: ppeChecks = [] } = useQuery<PPECheck[]>({
    queryKey: ["/api/security/ppe-checks"],
  });

  const { data: fireSensors = [] } = useQuery<FireSensor[]>({
    queryKey: ["/api/security/fire-sensors"],
    refetchInterval: 60_000,
  });

  const { data: accessZones = [] } = useQuery<AccessZone[]>({
    queryKey: ["/api/security/access-zones"],
    refetchInterval: 60_000,
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createVisitorMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/security/visitors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/visitors"] });
      setVisitorDialogOpen(false);
      setVisitorForm(DEFAULT_VISITOR_FORM);
      toast({ title: "Tashrif qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const exitVisitorMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/security/visitors/${id}/exit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/visitors"] });
      toast({ title: "Chiqish qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createIncidentMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/security/incidents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/incidents"] });
      setIncidentDialogOpen(false);
      setIncidentForm(DEFAULT_INCIDENT_FORM);
      toast({ title: "Hodisa qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createPpeMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/security/ppe-checks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/ppe-checks"] });
      setPpeDialogOpen(false);
      setPpeForm(DEFAULT_PPE_FORM);
      toast({ title: "PPE tekshiruvi qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // -------------------------------------------------------------------------
  // Derived counts (for KPI strip)
  // -------------------------------------------------------------------------

  const activeVisitors = (Array.isArray(visitors) ? visitors : []).filter((v) => !v.exitedAt);
  const openIncidents = (Array.isArray(incidents) ? incidents : []).filter((i) => i.status === "open").length;
  const failedPPECount = (Array.isArray(ppeChecks) ? ppeChecks : []).filter(
    (p) => !p.helmetOk || !p.vestOk || !p.glovesOk || !p.bootsOk,
  ).length;
  const warningAlerts = (Array.isArray(fireSensors) ? fireSensors : []).filter(
    (a) => a.status === "warning",
  ).length;

  // -------------------------------------------------------------------------
  // Submit handlers
  // -------------------------------------------------------------------------

  function handleAddVisitor() {
    createVisitorMutation.mutate({
      ...visitorForm,
      enteredAt: new Date().toISOString(),
      status: "inside",
    });
  }

  function handleAddIncident() {
    if (!incidentForm.description || !incidentForm.location || !incidentForm.reportedBy) {
      toast({ title: "Barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    createIncidentMutation.mutate({ ...incidentForm, status: "open" });
  }

  function handleAddPPE() {
    if (!ppeForm.employeeName || !ppeForm.department) {
      toast({ title: "Xodim ismi va bo'limni kiriting", variant: "destructive" });
      return;
    }
    createPpeMutation.mutate({ ...ppeForm });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Page header */}
      <div>
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("xavfsizlikNazorati")}</b></>}
        title={t("xavfsizlikNazorati")}
        subtitle={t("kirishNazoratiPpeHodisalarEvakuatsiya")}
      />
      </div>

      {/* KPI cards */}
      <SecurityKpiStrip
        summary={summary}
        activeVisitors={activeVisitors}
        openIncidents={openIncidents}
        failedPPECount={failedPPECount}
        warningAlerts={warningAlerts}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/40 p-1 rounded-lg flex-wrap h-auto">
          <TabsTrigger value="overview" data-testid="tab-security-overview" className="data-[state=active]:bg-card">{t("kirishJurnali")}</TabsTrigger>
          <TabsTrigger value="visitors" data-testid="tab-security-visitors" className="data-[state=active]:bg-card">{t("tashrifchilar")}</TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-security-incidents" className="data-[state=active]:bg-card">{t("hodisalar")}</TabsTrigger>
          <TabsTrigger value="ppe" data-testid="tab-security-ppe" className="data-[state=active]:bg-card">PPE</TabsTrigger>
          <TabsTrigger value="zones" data-testid="tab-security-zones" className="data-[state=active]:bg-card">{t("zonalar")}</TabsTrigger>
          <TabsTrigger value="fire" data-testid="tab-security-fire" className="data-[state=active]:bg-card">{t("signallar")}</TabsTrigger>
        </TabsList>

        <AttendanceTab records={records} isLoading={recordsLoading} />

        <VisitorsTab
          visitors={Array.isArray(visitors) ? visitors : []}
          isLoading={visitorsLoading}
          onAdd={() => setVisitorDialogOpen(true)}
          onExit={(id) => exitVisitorMutation.mutate(id)}
          exitPending={exitVisitorMutation.isPending}
        />

        <IncidentsTab
          incidents={Array.isArray(incidents) ? incidents : []}
          onAdd={() => setIncidentDialogOpen(true)}
        />

        <PPETab
          ppeChecks={Array.isArray(ppeChecks) ? ppeChecks : []}
          onAdd={() => setPpeDialogOpen(true)}
        />

        <ZonesTab accessZones={Array.isArray(accessZones) ? accessZones : []} />

        <FireTab fireSensors={Array.isArray(fireSensors) ? fireSensors : []} />
      </Tabs>

      {/* Dialogs */}
      <VisitorDialog
        open={visitorDialogOpen}
        onOpenChange={setVisitorDialogOpen}
        form={visitorForm}
        onChange={(patch) => setVisitorForm((p) => ({ ...p, ...patch }))}
        isPending={createVisitorMutation.isPending}
        onSubmit={handleAddVisitor}
      />

      <IncidentDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        form={incidentForm}
        onChange={(patch) => setIncidentForm((p) => ({ ...p, ...patch }))}
        onSubmit={handleAddIncident}
      />

      <PPEDialog
        open={ppeDialogOpen}
        onOpenChange={setPpeDialogOpen}
        form={ppeForm}
        onChange={(patch) => setPpeForm((p) => ({ ...p, ...patch }))}
        onSubmit={handleAddPPE}
      />
    </div>
  );
}
