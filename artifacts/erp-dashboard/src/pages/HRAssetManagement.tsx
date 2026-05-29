/**
 * @module HRAssetManagement
 * @description Route-level page component for HR Asset Management.
 * Owns all React state, TanStack Query data-fetching, and mutations;
 * delegates rendering to HRAssetManagementSections and HRAssetManagementDialogs.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Asset, Department, Employee,
  AssetForm, AssignForm, ReturnForm, ReportForm,
  EMPTY_FORM, EMPTY_ASSIGN, EMPTY_RETURN, EMPTY_REPORT,
} from "./HRAssetManagementTypes";
import { AssetStats, AssetFilters, AssetTable } from "./HRAssetManagementSections";
import { AddAssetDialog, AssignDialog } from "./HRAssetManagementDialogs";
import { ReturnDialog, ReportDialog, DetailDialog } from "./HRAssetManagementActionsDialogs";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function HRAssetManagement() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // --- filter state ---
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // --- dialog / form state ---
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AssetForm>(EMPTY_FORM);

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assignForm, setAssignForm] = useState<AssignForm>(EMPTY_ASSIGN);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnForm, setReturnForm] = useState<ReturnForm>(EMPTY_RETURN);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState<ReportForm>(EMPTY_REPORT);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filterCategory !== "all") params.append("category", filterCategory);
  if (filterStatus !== "all") params.append("status", filterStatus);
  if (filterDepartment !== "all") params.append("department_id", filterDepartment);

  const { data: rawAssets, isLoading, refetch } = useQuery<Asset[]>({
    queryKey: ["/api/assets", search, filterCategory, filterStatus, filterDepartment],
    queryFn: async () => {
      const d: unknown = await apiRequest('GET', `/api/assets?${params.toString()}`);
      return Array.isArray(d)
        ? (d as Asset[])
        : Array.isArray((d as { data?: Asset[] })?.data)
          ? (d as { data: Asset[] }).data
          : [];
    },
  });

  const assets = Array.isArray(rawAssets) ? rawAssets : [];

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      let data: unknown;
      try { data = await apiRequest('GET', "/api/hr/employees?limit=500"); }
      catch { return []; }
      return Array.isArray(data)
        ? (data as Employee[])
        : ((data as { employees?: Employee[] }).employees ?? []);
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/org-departments"],
    queryFn: async () => {
      let data: unknown;
      try { data = await apiRequest('GET', "/api/org-departments"); }
      catch { return []; }
      return Array.isArray(data) ? (data as Department[]) : [];
    },
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/assets", {
      ...form,
      value: form.value ? Number(form.value) : 0,
      purchase_date: form.purchase_date || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setAddOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Jihoz qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/assets/${selectedAsset?.id}/assign`, assignForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setAssignOpen(false);
      setAssignForm(EMPTY_ASSIGN);
      toast({ title: "Jihoz xodimga berildi" });
    },
    onError: (err: Error) => toast({ title: err?.message || "Xatolik yuz berdi", variant: "destructive" }),
  });

  const returnMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/assets/${selectedAsset?.id}/return`, returnForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setReturnOpen(false);
      setReturnForm(EMPTY_RETURN);
      toast({ title: "Jihoz qaytarildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const reportMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/assets/${selectedAsset?.id}/report`, reportForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setReportOpen(false);
      setReportForm(EMPTY_REPORT);
      toast({ title: "Hisobot yuborildi. Maosh chegirmasi navbatga qo'shildi." });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const openDetail = async (asset: Asset) => {
    const res = await apiRequest('GET', `/api/assets/${asset.id}`);
    {
      const data = (res as Asset);
      setDetailAsset(data);
      setDetailOpen(true);
    }
  };

  const stats = {
    total: assets.length,
    available: assets.filter(a => a.status === "available").length,
    assigned: assets.filter(a => a.status === "assigned").length,
    broken: assets.filter(a => ["broken", "lost", "damaged"].includes(a.status)).length,
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("aktivlarBoshqaruvi")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("xodimlargaBerilganJihozlarKalitlarVa")}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("yangiJihoz")}
        </Button>
      </div>

      <AssetStats {...stats} />

      <AssetFilters
        search={search} onSearchChange={setSearch}
        filterCategory={filterCategory} onCategoryChange={setFilterCategory}
        filterStatus={filterStatus} onStatusChange={setFilterStatus}
        filterDepartment={filterDepartment} onDepartmentChange={setFilterDepartment}
        departments={Array.isArray(departments) ? departments : []}
        onRefresh={() => refetch()}
      />

      <AssetTable
        assets={assets}
        isLoading={isLoading}
        onDetail={openDetail}
        onAssign={asset => { setSelectedAsset(asset); setAssignOpen(true); }}
        onReturn={asset => { setSelectedAsset(asset); setReturnOpen(true); }}
        onReport={asset => { setSelectedAsset(asset); setReportOpen(true); }}
      />

      {/* Dialogs */}
      <AddAssetDialog
        open={addOpen} onOpenChange={setAddOpen}
        form={form} onFormChange={setForm}
        onSubmit={() => addMutation.mutate()}
        isPending={addMutation.isPending}
      />

      <AssignDialog
        open={assignOpen} onOpenChange={setAssignOpen}
        asset={selectedAsset}
        form={assignForm} onFormChange={setAssignForm}
        employees={Array.isArray(employees) ? employees : []}
        onSubmit={() => assignMutation.mutate()}
        isPending={assignMutation.isPending}
      />

      <ReturnDialog
        open={returnOpen} onOpenChange={setReturnOpen}
        asset={selectedAsset}
        form={returnForm} onFormChange={setReturnForm}
        onSubmit={() => returnMutation.mutate()}
        isPending={returnMutation.isPending}
      />

      <ReportDialog
        open={reportOpen} onOpenChange={setReportOpen}
        asset={selectedAsset}
        form={reportForm} onFormChange={setReportForm}
        onSubmit={() => reportMutation.mutate()}
        isPending={reportMutation.isPending}
      />

      <DetailDialog
        open={detailOpen} onOpenChange={setDetailOpen}
        asset={detailAsset}
      />
    </div>
  );
}
