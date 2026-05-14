/**
 * @module SaaSExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, RefreshCw } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

import {
  SaaSTenant,
  PlatformStats,
  URL_TAB_MAP,
  AddTenantSchema,
  tabMeta,
} from "./SaaSExtendedTypes";
import {
  TenantsSection,
  OnboardingSection,
  LicensingSection,
  ModulesSection,
  MonitoringSection,
  ErrorsSection,
} from "./SaaSExtendedSections";

export default function SaaSExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "tenants");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["tenants"];
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>("");

  const addForm = useForm({
    resolver: zodResolver(AddTenantSchema),
    defaultValues: { name: "", domain: "", plan: "basic", contactEmail: "", contactPhone: "", usersLimit: 10 },
  });

  // ===================== QUERIES =====================
  const { data: tenantsData, isLoading: tenantsLoading, refetch: refetchTenants } = useQuery<{ tenants?: SaaSTenant[] }>({
    queryKey: ["/api/saas/tenants"],
  });
  const { data: platformStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<PlatformStats>({
    queryKey: ["/api/saas/platform-stats"],
    enabled: activeTab === "monitoring",
  });
  const { data: errorLogsData, isLoading: errorsLoading, refetch: refetchErrors } = useQuery<{ logs?: Record<string, unknown>[]; total?: number }>({
    queryKey: ["/api/saas/error-logs"],
    enabled: activeTab === "errors",
  });

  const tenants: SaaSTenant[] = tenantsData?.tenants || [];

  // ===================== MUTATIONS =====================
  const addTenantMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/saas/tenants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      setShowAddDialog(false);
      addForm.reset();
      toast({ title: "Tenant yaratildi", description: "Yangi tenant muvaffaqiyatli qo'shildi" });
    },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/saas/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      toast({ title: "Status yangilandi" });
    },
  });

  const selectedTenantData = (Array.isArray(tenants) ? tenants : []).find(
    (t: SaaSTenant) => String(t.id) === selectedTenant
  ) || tenants[0];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Globe className="h-3 w-3" />{tenants.length} tenant
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetchTenants()} data-testid="button-refresh-saas">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto">
        </div>

        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="SaaS"
            moduleColor="text-muted-foreground"
            sectionTitle={meta?.title || ""}
            icon={meta?.icon || (() => null)}
          />

          <TenantsSection
            tenants={tenants}
            tenantsLoading={tenantsLoading}
            showAddDialog={showAddDialog}
            setShowAddDialog={setShowAddDialog}
            addForm={addForm}
            onAddSubmit={(d) => addTenantMutation.mutate(d)}
            addPending={addTenantMutation.isPending}
            onSuspend={(id) => updateStatusMutation.mutate({ id, status: "suspended" })}
            onActivate={(id) => updateStatusMutation.mutate({ id, status: "active" })}
          />

          <OnboardingSection
            tenants={tenants}
            onTenantChange={setSelectedTenant}
          />

          <LicensingSection tenants={tenants} />

          <ModulesSection
            tenants={tenants}
            selectedTenant={selectedTenant}
            setSelectedTenant={setSelectedTenant}
            selectedTenantData={selectedTenantData}
          />

          <MonitoringSection
            platformStats={platformStats}
            statsLoading={statsLoading}
            onRefresh={() => refetchStats()}
          />

          <ErrorsSection
            errorLogsData={errorLogsData as { logs?: import("./SaaSExtendedTypes").ErrorLog[]; total?: number } | undefined}
            errorsLoading={errorsLoading}
            onRefresh={() => refetchErrors()}
          />
        </div>
      </Tabs>
    </div>
  );
}
