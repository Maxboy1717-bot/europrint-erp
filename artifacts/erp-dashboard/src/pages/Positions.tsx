/**
 * @module Positions
 * @description Lavozimlar boshqaruvi sahifasi (HR moduli).
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPPageHeader> breadcrumb + title + subtitle + verb-first CTA
 *     - 4-tile <EPKpiCard> row (Jami / Faol / Boshqaruv / Tanlovda)
 *     - <EPErrorState> branch for fetch failures
 *     - <EPSkeletonKpiRow> while data loads
 *     - .ep-btn-primary-shimmer hover effect on primary action
 *
 *   The Sections/Dialogs sub-files keep their existing styling for now —
 *   only the orchestration layer is being migrated. Table-row pills can be
 *   upgraded to <EPStatusPill> in a follow-up.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Briefcase, Users, ShieldCheck, UserSearch,
} from "lucide-react";

import {
  type Position, type Department, type PositionForm, EMPTY_FORM,
} from "./PositionsTypes";
import { PositionFormDialog, PositionDeleteDialog, KpiTemplateDialog } from "./PositionsDialogs";
import { PositionsFilters, PositionsTable } from "./PositionsSections";
import { useTranslation } from '@/lib/i18n';
import {
  EPPageHeader, EPKpiCard, EPErrorState, EPSkeletonKpiRow,
} from "@/components/ep";

export default function Positions() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<PositionForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [kpiDialogPos, setKpiDialogPos] = useState<Position | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Queries
  const {
    data: positions = [],
    isLoading,
    isError, error,
    refetch,
  } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: PositionForm) => {
      const payload = {
        ...data,
        level: Number(data.level) || 1,
        headcount: Number(data.headcount) || 1,
        min_salary: data.min_salary ? Number(data.min_salary) : null,
        max_salary: data.max_salary ? Number(data.max_salary) : null,
        department_id: data.department_id || null,
        name: data.name_uz || data.name,
      };
      if (editing) return apiRequest("PATCH", `/api/positions/${editing.id}`, payload);
      return apiRequest("POST", "/api/positions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: editing ? "Lavozim yangilandi" : "Lavozim qo'shildi" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Lavozim o'chirildi" });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      const msg = err?.message || "O'chirishda xatolik";
      toast({
        title: msg.includes("employees")
          ? "Xodimlari bor lavozimni o'chirish mumkin emas"
          : msg,
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  const kpiTemplateMutation = useMutation({
    mutationFn: ({ id, templateKey }: { id: string; templateKey: string }) =>
      apiRequest("PATCH", `/api/positions/${id}/kpi-template`, { templateKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "KPI shabloni biriktirildi" });
      setKpiDialogPos(null);
      setSelectedTemplate("");
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  // Handlers
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (pos: Position) => {
    setEditing(pos);
    setForm({
      name: pos.name || "",
      name_uz: pos.name_uz || pos.name || "",
      name_ru: pos.name_ru || "",
      code: pos.code || "",
      official_title: pos.official_title || "",
      department_id: pos.department_id || "",
      level: pos.level || 1,
      is_management: pos.is_management,
      is_active: pos.is_active,
      headcount: pos.headcount || 1,
      min_salary: pos.min_salary != null ? String(pos.min_salary) : "",
      max_salary: pos.max_salary != null ? String(pos.max_salary) : "",
      description: pos.description || "",
    });
    setDialogOpen(true);
  };

  const getDeptName = (id: string | null) => {
    if (!id) return "—";
    const d = (Array.isArray(departments) ? departments : []).find((d) => d.id === id);
    return d?.name_uz || d?.name || "—";
  };

  const list = Array.isArray(positions) ? positions : [];

  // KPI stats — "Tanlovda" = total headcount slots across all active positions
  const stats = useMemo(() => {
    const active = list.filter((p) => p.is_active).length;
    const management = list.filter((p) => p.is_management).length;
    const totalHeadcount = list
      .filter((p) => p.is_active)
      .reduce((sum, p) => sum + (p.headcount || 0), 0);
    return { total: list.length, active, management, totalHeadcount };
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (deptFilter !== "all" && p.department_id !== deptFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(s) ||
        p.name_uz?.toLowerCase().includes(s) ||
        p.name_ru?.toLowerCase().includes(s) ||
        p.code?.toLowerCase().includes(s)
      );
    });
  }, [list, search, deptFilter]);

  const handleKpiClick = (pos: Position, currentKey: string) => {
    setKpiDialogPos(pos);
    setSelectedTemplate(currentKey);
  };

  const handleKpiClose = () => {
    setKpiDialogPos(null);
    setSelectedTemplate("");
  };

  const handleKpiAssign = () => {
    if (kpiDialogPos && selectedTemplate) {
      kpiTemplateMutation.mutate({ id: kpiDialogPos.id, templateKey: selectedTemplate });
    }
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboardHr")}<b className="text-foreground">{t("lavozimlar")}</b></>}
        title={t("lavozimlar")}
        subtitle={t("kompaniyaLavozimlariRoyxatiVaBoshqaruvi")}
        actions={
          <Button onClick={openAdd} className="ep-btn-primary-shimmer gap-1.5">
            <Plus className="h-4 w-4" />
            {t("yangiLavozimQoshish")}
          </Button>
        }
      />

      {/* KPI row */}
      {isLoading ? (
        <EPSkeletonKpiRow count={4} />
      ) : !isError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <EPKpiCard
            label={t("jamiLavozimlar")}
            value={stats.total}
            icon={Briefcase}
            iconBg="hr"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={t("active")}
            value={stats.active}
            icon={Users}
            iconBg="var(--ep-green)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={t("boshqaruv")}
            value={stats.management}
            icon={ShieldCheck}
            iconBg="var(--ep-blue)"
            enterDelayMs={120}
          />
          <EPKpiCard
            label={t("jamiShtat")}
            value={stats.totalHeadcount}
            icon={UserSearch}
            iconBg="primary"
            enterDelayMs={180}
          />
        </div>
      )}

      {isError ? (
        <EPErrorState onRetry={refetch}  error={error} />
      ) : (
        <>
          <PositionsFilters
            search={search}
            onSearchChange={setSearch}
            deptFilter={deptFilter}
            onDeptFilterChange={setDeptFilter}
            departments={Array.isArray(departments) ? departments : []}
            filteredCount={filtered.length}
          />

          <PositionsTable
            positions={filtered}
            isLoading={isLoading}
            getDeptName={getDeptName}
            onEdit={openEdit}
            onDelete={setDeleteId}
            onKpiClick={handleKpiClick}
          />
        </>
      )}

      <PositionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        departments={Array.isArray(departments) ? departments : []}
        isPending={saveMutation.isPending}
        onSave={() => saveMutation.mutate(form)}
      />

      <PositionDeleteDialog
        deleteId={deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
      />

      <KpiTemplateDialog
        position={kpiDialogPos}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        isPending={kpiTemplateMutation.isPending}
        onClose={handleKpiClose}
        onAssign={handleKpiAssign}
      />
    </div>
  );
}
