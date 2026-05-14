/**
 * @module MMVendors
 * @description Yetkazuvchilar boshqaruvi (MM moduli — warehouse-amber accent).
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPPageHeader> breadcrumb · 20px title · subtitle · verb-first CTA
 *     - 3-tile <EPKpiCard> row (Jami / Faol / Nofaol) with warehouse-amber accent
 *     - <EPErrorState> with retry for fetch failures
 *     - <EPSkeletonKpiRow> while loading
 *
 *   Sub-files (MMVendorsSections, MMVendorsDialogs) retain their existing
 *   styling for now; orchestration layer migrated only.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Truck, CheckCircle2, PauseCircle } from "lucide-react";

import {
  VENDOR_FORM_DEFAULTS,
  VENDOR_QUERY_KEY,
  vendorFormSchema,
  type Vendor,
  type VendorFormData,
} from "./MMVendorsTypes";
import { VendorsTableCard } from "./MMVendorsSections";
import {
  CreateVendorDialog,
  DeleteVendorAlert,
  EditVendorDialog,
} from "./MMVendorsDialogs";
import { useTranslation } from '@/lib/i18n';
import {
  EPPageHeader, EPKpiCard, EPErrorState, EPSkeletonKpiRow,
} from "@/components/ep";

export default function MMVendors() {
  const { t } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const {
    data: vendors = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Vendor[]>({
    queryKey: [VENDOR_QUERY_KEY],
    enabled: !!isAuthenticated,
  });

  const createForm = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: VENDOR_FORM_DEFAULTS,
  });
  const editForm = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: VENDOR_FORM_DEFAULTS,
  });

  const createMutation = useMutation({
    mutationFn: (data: VendorFormData) => apiRequest("POST", "/api/mm/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDOR_QUERY_KEY] });
      toast({ title: "Yetkazuvchi yaratildi" });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Yetkazuvchi yaratishda xatolik",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VendorFormData }) =>
      apiRequest("PATCH", `/api/mm/vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDOR_QUERY_KEY] });
      toast({ title: "Yetkazuvchi yangilandi" });
      setEditDialogOpen(false);
      setSelectedVendor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Yetkazuvchi yangilashda xatolik",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mm/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDOR_QUERY_KEY] });
      toast({ title: "Yetkazuvchi o'chirildi" });
      setDeleteDialogOpen(false);
      setSelectedVendor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Yetkazuvchi o'chirishda xatolik",
        variant: "destructive",
      });
    },
  });

  function handleCreate(data: VendorFormData) {
    createMutation.mutate(data);
  }
  function handleEdit(vendor: Vendor) {
    setSelectedVendor(vendor);
    editForm.reset({
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      nameRu: vendor.nameRu ?? "",
      address: vendor.address ?? "",
      phone: vendor.phone ?? "",
      email: vendor.email ?? "",
      taxId: vendor.taxId ?? "",
      paymentTerms: vendor.paymentTerms ?? "",
      currency: vendor.currency ?? "UZS",
      isActive: vendor.isActive,
    });
    setEditDialogOpen(true);
  }
  function handleUpdate(data: VendorFormData) {
    if (selectedVendor) updateMutation.mutate({ id: selectedVendor.id, data });
  }
  function handleDeleteClick(vendor: Vendor) {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  }
  function handleDeleteConfirm() {
    if (selectedVendor) deleteMutation.mutate(selectedVendor.id);
  }

  const safeVendors = Array.isArray(vendors) ? vendors : [];

  const filteredVendors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return safeVendors;
    return safeVendors.filter(
      (v) =>
        v.vendorCode?.toLowerCase().includes(q) ||
        v.name?.toLowerCase().includes(q) ||
        v.nameRu?.toLowerCase().includes(q),
    );
  }, [safeVendors, searchQuery]);

  const stats = useMemo(() => {
    const active = safeVendors.filter((v) => v.isActive).length;
    return {
      total: safeVendors.length,
      active,
      inactive: safeVendors.length - active,
    };
  }, [safeVendors]);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboardMm")}<b className="text-foreground">{t("yetkazuvchilar")}</b></>}
        title={t("yetkazuvchilar")}
        subtitle={t("barchaYetkazuvchilarRoyxatiVaBoshqaruvi")}
        actions={
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="ep-btn-primary-shimmer gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("yangiYetkazuvchiQoshish")}
          </Button>
        }
      />

      {isLoading ? (
        <EPSkeletonKpiRow count={3} />
      ) : !isError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <EPKpiCard
            label={t("jamiYetkazuvchilar")}
            value={stats.total}
            icon={Truck}
            iconBg="warehouse"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={t("active")}
            value={stats.active}
            icon={CheckCircle2}
            iconBg="var(--ep-green)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={t("inactive")}
            value={stats.inactive}
            icon={PauseCircle}
            iconBg="var(--ep-muted)"
            enterDelayMs={120}
          />
        </div>
      )}

      {isError ? (
        <EPErrorState onRetry={refetch} />
      ) : (
        <VendorsTableCard
          vendors={filteredVendors}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateClick={() => setCreateDialogOpen(true)}
          onEditClick={handleEdit}
          onDeleteClick={handleDeleteClick}
        />
      )}

      <CreateVendorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        form={createForm}
        isPending={createMutation.isPending}
        onSubmit={handleCreate}
      />

      <EditVendorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        form={editForm}
        isPending={updateMutation.isPending}
        onSubmit={handleUpdate}
      />

      <DeleteVendorAlert
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        vendor={selectedVendor}
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
