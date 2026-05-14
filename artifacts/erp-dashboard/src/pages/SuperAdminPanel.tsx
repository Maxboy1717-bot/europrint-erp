/**
 * @module SuperAdminPanel
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, Globe, FileText, RefreshCw, Plus } from "lucide-react";

import {
  Tenant, ModuleDef, PlatformStats, ExpiryAlertsData, AuditLogEntry, AuditFilters,
} from "./SuperAdminPanelTypes";
import {
  PlatformStatsCards,
  ExpiryAlertsCard,
  TenantsTab,
  AuditLogTab,
  AddTenantDialog,
  EditModulesDialog,
  AuditDetailDialog,
} from "./SuperAdminPanelSections";

export default function SuperAdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tenants");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmDeleteTenantId, setConfirmDeleteTenantId] = useState<string | null>(null);
  const [editModulesDialog, setEditModulesDialog] = useState<Tenant | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [newTenant, setNewTenant] = useState({ name: "", domain: "", plan: "basic", contactEmail: "", contactPhone: "" });

  const [auditPage, setAuditPage] = useState(1);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({ action: "", table: "", userId: "", search: "", from: "", to: "" });
  const [auditDetailLog, setAuditDetailLog] = useState<AuditLogEntry | null>(null);
  const auditLimit = 50;

  const { data: tenantsData, isLoading: tenantsLoading, refetch } = useQuery<{ tenants: Tenant[]; total: number }>({
    queryKey: ["/api/saas/tenants"],
  });

  const { data: modulesData } = useQuery<{ modules: ModuleDef[] }>({
    queryKey: ["/api/saas/modules"],
  });

  const { data: platformStats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/saas/platform-stats"],
    refetchInterval: 60000,
  });

  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery<{ data: AuditLogEntry[]; total: number }>({
    queryKey: ["/api/admin/audit-filtered", auditFilters, auditPage, auditLimit],
    queryFn: () => {
      const params = new URLSearchParams();
      if (auditFilters.action) params.set("action", auditFilters.action);
      if (auditFilters.table) params.set("table", auditFilters.table);
      if (auditFilters.userId) params.set("userId", auditFilters.userId);
      if (auditFilters.search) params.set("search", auditFilters.search);
      if (auditFilters.from) params.set("from", auditFilters.from);
      if (auditFilters.to) params.set("to", auditFilters.to);
      params.set("page", String(auditPage));
      params.set("limit", String(auditLimit));
      return apiRequest("GET", `/api/admin/audit-filtered?${params}`);
    },
    enabled: activeTab === "audit",
  });

  const { data: auditTablesData } = useQuery<{ tables: string[] }>({
    queryKey: ["/api/admin/audit-tables"],
    enabled: activeTab === "audit",
  });

  const { data: expiryData } = useQuery<ExpiryAlertsData>({
    queryKey: ["/api/saas/expiry-alerts"],
    refetchInterval: 300000,
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/saas/tenants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saas/platform-stats"] });
      setAddDialogOpen(false);
      setNewTenant({ name: "", domain: "", plan: "basic", contactEmail: "", contactPhone: "" });
      toast({ title: "Tenant yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/saas/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      toast({ title: "Status yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateModulesMutation = useMutation({
    mutationFn: ({ id, modulesEnabled }: { id: string; modulesEnabled: string[] }) =>
      apiRequest("PATCH", `/api/saas/tenants/${id}/modules`, { modulesEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      setEditModulesDialog(null);
      toast({ title: "Modullar yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/saas/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saas/platform-stats"] });
      toast({ title: "Tenant o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const onboardMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/saas/tenants/${id}/onboard`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      toast({ title: "Onboarding muvaffaqiyatli bajarildi", description: "Tenant faollashtirildi va Telegram xabari yuborildi" });
    },
    onError: () => toast({ title: "Onboarding xatoligi", variant: "destructive" }),
  });

  const tenants = tenantsData?.tenants ?? [];
  const modules = modulesData?.modules ?? [];
  const auditLogs = auditData?.data ?? [];
  const auditTotal = auditData?.total ?? 0;
  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / auditLimit));
  const auditTables = auditTablesData?.tables ?? [];

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}s ${m}d`;
  };

  const handleAuditFilterChange = (key: keyof AuditFilters, value: string) => {
    setAuditFilters(prev => ({ ...prev, [key]: value }));
    setAuditPage(1);
  };

  const resetAuditFilters = () => {
    setAuditFilters({ action: "", table: "", userId: "", search: "", from: "", to: "" });
    setAuditPage(1);
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />Super Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">SaaS platformasini boshqaring — tenantlar, modullar, litsenziyalar</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="icon" variant="ghost" onClick={() => activeTab === "audit" ? refetchAudit() : refetch()} data-testid="button-refresh-saas">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {activeTab === "tenants" && (
            <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-tenant">
              <Plus className="w-4 h-4 mr-2" />Yangi Tenant
            </Button>
          )}
        </div>
      </div>

      <PlatformStatsCards
        platformStats={platformStats}
        statsLoading={statsLoading}
        formatUptime={formatUptime}
      />

      {activeTab === "tenants" && (
        <ExpiryAlertsCard expiryData={expiryData} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />Tenantlar
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <TenantsTab
            tenants={tenants}
            tenantsLoading={tenantsLoading}
            onboardMutation={{ mutate: (id) => onboardMutation.mutate(id), isPending: onboardMutation.isPending }}
            updateStatusMutation={{ mutate: (args) => updateStatusMutation.mutate(args) }}
            onEditModules={(t) => { setEditModulesDialog(t); setSelectedModules([...t.modulesEnabled]); }}
            onDeleteTenant={(id) => setConfirmDeleteTenantId(id)}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogTab
            auditLogs={auditLogs}
            auditLoading={auditLoading}
            auditTotal={auditTotal}
            auditLimit={auditLimit}
            auditPage={auditPage}
            auditTotalPages={auditTotalPages}
            auditTables={auditTables}
            auditFilters={auditFilters}
            onFilterChange={handleAuditFilterChange}
            onResetFilters={resetAuditFilters}
            onPageChange={setAuditPage}
            onViewDetail={setAuditDetailLog}
          />
        </TabsContent>
      </Tabs>

      <AddTenantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        newTenant={newTenant}
        setNewTenant={setNewTenant}
        isPending={createTenantMutation.isPending}
        onSubmit={() => createTenantMutation.mutate({ ...newTenant })}
      />

      <EditModulesDialog
        editModulesDialog={editModulesDialog}
        modules={modules}
        selectedModules={selectedModules}
        setSelectedModules={setSelectedModules}
        isPending={updateModulesMutation.isPending}
        onClose={() => setEditModulesDialog(null)}
        onSave={() => editModulesDialog && updateModulesMutation.mutate({ id: editModulesDialog.id, modulesEnabled: selectedModules })}
      />

      <AuditDetailDialog
        log={auditDetailLog}
        onClose={() => setAuditDetailLog(null)}
      />

      <ConfirmDialog
        open={confirmDeleteTenantId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteTenantId(null); }}
        title="Tenantni o'chirish"
        description="Ushbu tenantni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteTenantId !== null) deleteTenantMutation.mutate(confirmDeleteTenantId); }}
      />
    </div>
  );
}
