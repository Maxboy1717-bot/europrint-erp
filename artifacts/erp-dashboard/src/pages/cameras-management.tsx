/**
 * @module cameras-management
 * @description Route-level page component for Cameras Management.
 *              Owns all state, React-Query queries/mutations, and
 *              top-level layout.  Delegates display to:
 *                - cameras-management-sections  (stats cards, table)
 *                - cameras-management-dialogs   (add / edit dialogs)
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { safeArray } from "@/lib/queryClient";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  cameraFormSchema,
  buildTranslations,
  type CameraData,
  type WorkCenter,
  type CameraFormData,
  type Language,
} from "./cameras-management-types";
import { CameraStatsCards, CameraTable } from "./cameras-management-sections";
import { AddCameraDialog, EditCameraDialog } from "./cameras-management-dialogs";
import { EPErrorState, EPPageHeader } from "@/components/ep";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CamerasManagement() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>("uz");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);

  const t = buildTranslations(language);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: camerasRaw, isLoading, isError, error, refetch } = useQuery<CameraData[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: workCenters } = useQuery<WorkCenter[]>({
    queryKey: ["/api/pp/work-centers"],
  });

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  const form = useForm<CameraFormData>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: {
      code: "",
      name: "",
      nameRu: "",
      rtspUrl: "",
      ipAddress: "",
      location: "",
      isActive: true,
    },
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const addMutation = useMutation({
    mutationFn: (data: CameraFormData) => apiRequest("POST", "/api/cameras", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: t.title, description: language === "uz" ? "Kamera qo'shildi" : "Камера добавлена" });
    },
    onError: () => {
      toast({
        title: language === "uz" ? "Xato" : "Ошибка",
        description: language === "uz" ? "Kamera qo'shishda xato" : "Ошибка при добавлении камеры",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: CameraFormData & { id: string }) =>
      apiRequest("PATCH", `/api/cameras/${id}`, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      setEditingCamera(null);
      form.reset();
      toast({ title: t.title, description: language === "uz" ? "Kamera yangilandi" : "Камера обновлена" });
    },
    onError: () => {
      toast({
        title: language === "uz" ? "Xato" : "Ошибка",
        description: language === "uz" ? "Kamerani yangilashda xato" : "Ошибка при обновлении камеры",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/cameras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({ title: t.title, description: language === "uz" ? "Kamera o'chirildi" : "Камера удалена" });
    },
    onError: () => {
      toast({
        title: language === "uz" ? "Xato" : "Ошибка",
        description: language === "uz" ? "Kamerani o'chirishda xato" : "Ошибка при удалении камеры",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/cameras/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
    },
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const onSubmit = (data: CameraFormData) => {
    if (editingCamera) {
      updateMutation.mutate({ ...data, id: editingCamera.id });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEdit = (camera: CameraData) => {
    setEditingCamera(camera);
    form.reset({
      code:         camera.code,
      name:         camera.name,
      nameRu:       camera.nameRu       ?? "",
      rtspUrl:      camera.rtspUrl      ?? "",
      ipAddress:    camera.ipAddress    ?? "",
      port:         camera.port         ?? undefined,
      username:     camera.username     ?? "",
      password:     camera.password     ?? "",
      workCenterId: camera.workCenterId ?? undefined,
      location:     camera.location     ?? "",
      isActive:     camera.isActive,
    });
  };

  const handleEditDialogChange = (open: boolean) => {
    if (!open) setEditingCamera(null);
  };

  // -------------------------------------------------------------------------
  // Early returns
  // -------------------------------------------------------------------------

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`sk-${i}`} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const safeCameras = safeArray<CameraData>(camerasRaw);
  const activeCameras = (Array.isArray(safeCameras) ? safeCameras : []).filter((c) => c.isActive).length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t.dashboard}<b className="text-foreground">{language === "uz" ? "Kameralar boshqaruvi" : "Управление камерами"}</b></>}
        title={language === "uz" ? "Kameralar boshqaruvi" : "Управление камерами"}
        subtitle={t.subtitle}
      />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={language === "uz" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
              data-testid="button-lang-uz"
            >
              UZ
            </Button>
            <Button
              variant={language === "ru" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
              data-testid="button-lang-ru"
            >
              RU
            </Button>
          </div>

          {/* Add dialog (trigger rendered inside) */}
          <AddCameraDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            form={form}
            workCenters={workCenters}
            t={t}
            isPending={addMutation.isPending}
            onSubmit={onSubmit}
          />
        </div>
      </div>

      {/* ---- Stats ---- */}
      <CameraStatsCards total={safeCameras.length} active={activeCameras} t={t} />

      {/* ---- Table ---- */}
      <CameraTable
        cameras={Array.isArray(safeCameras) ? safeCameras : []}
        workCenters={workCenters}
        language={language}
        t={t}
        isDeletePending={deleteMutation.isPending}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        onToggleStatus={(id, isActive) => toggleStatusMutation.mutate({ id, isActive })}
      />

      {/* ---- Edit dialog ---- */}
      <EditCameraDialog
        open={!!editingCamera}
        onOpenChange={handleEditDialogChange}
        form={form}
        workCenters={workCenters}
        t={t}
        isPending={updateMutation.isPending}
        onSubmit={onSubmit}
      />
    </div>
  );
}
