/**
 * @module usePlanningBoardActions
 * @description Custom hook that encapsulates all mutations and react-hook-form
 * instances for PlanningBoard.  Keeps the page component focused on layout
 * and orchestration.
 */

import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertPlanningOperationSchema,
  insertProductionPlanHeaderSchema,
  insertProductionFactSchema,
} from "@shared/schema";
import type {
  InsertProductionPlanHeader,
  InsertProductionFact,
  InsertPlanningOperation,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ProductionPlanRow, PlanningRunForm } from "./PlanningBoardTypes";

interface UsePlanningBoardActionsOptions {
  lang: "uz" | "ru";
  editingPlan: ProductionPlanRow | null;
  setIsDialogOpen: (open: boolean) => void;
  setOpenPlanDialog: (open: boolean) => void;
  setOpenFactDialog: (open: boolean) => void;
  setEditingPlan: (plan: ProductionPlanRow | null) => void;
  setShowRunDialog: (open: boolean) => void;
  setRunForm: React.Dispatch<React.SetStateAction<PlanningRunForm>>;
  runForm: PlanningRunForm;
}

export function usePlanningBoardActions({
  lang,
  editingPlan,
  setIsDialogOpen,
  setOpenPlanDialog,
  setOpenFactDialog,
  setEditingPlan,
  setShowRunDialog,
  setRunForm,
  runForm,
}: UsePlanningBoardActionsOptions) {
  const { toast } = useToast();

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------

  const form = useForm<InsertPlanningOperation>({
    resolver: zodResolver(insertPlanningOperationSchema),
    defaultValues: {
      papkaOrderId: "",
      operationCode: "",
      operationName: "",
      sequence: 1,
      equipmentId: "",
      plannedDate: format(new Date(), "yyyy-MM-dd"),
      plannedStartTime: "08:00",
      plannedEndTime: "17:00",
      plannedQuantity: 0,
      status: "planned",
    },
  });

  const planForm = useForm<InsertProductionPlanHeader>({
    resolver: zodResolver(insertProductionPlanHeaderSchema),
    defaultValues: {
      planNumber: "",
      planDate: new Date().toISOString().split("T")[0],
      planType: "daily",
      workCenterId: "",
      shift: "",
      status: "draft",
      notes: "",
    },
  });

  const factForm = useForm<InsertProductionFact>({
    resolver: zodResolver(insertProductionFactSchema),
    defaultValues: {
      workCenterId: "",
      productId: "",
      factDate: new Date().toISOString().split("T")[0],
      shift: "",
      factQuantity: 0,
      goodQuantity: 0,
      scrapQuantity: 0,
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/planning/operations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planning/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/schedule"] });
      setIsDialogOpen(false);
      toast({ title: lang === "uz" ? "Operatsiya yaratildi" : "Операция создана" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/planning/operations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planning/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/schedule"] });
      setIsDialogOpen(false);
      toast({ title: lang === "uz" ? "Operatsiya yangilandi" : "Операция обновлена" });
    },
  });

  const savePlan = useMutation({
    mutationFn: async (data: InsertProductionPlanHeader) => {
      if (editingPlan)
        return apiRequest("PUT", `/api/erp/production-plans/${editingPlan.id}`, data);
      return apiRequest("POST", "/api/erp/production-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/production-plans"] });
      setOpenPlanDialog(false);
      planForm.reset();
      setEditingPlan(null);
      toast({
        title: editingPlan
          ? lang === "uz" ? "Reja yangilandi" : "План обновлён"
          : lang === "uz" ? "Reja yaratildi" : "План создан",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: lang === "uz" ? "Xatolik" : "Ошибка",
        description: error.message,
      });
    },
  });

  const saveFact = useMutation({
    mutationFn: async (data: InsertProductionFact) =>
      apiRequest("POST", "/api/erp/production-facts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/production-facts"] });
      setOpenFactDialog(false);
      factForm.reset();
      toast({ title: lang === "uz" ? "Hisobot saqlandi" : "Отчёт сохранён" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: lang === "uz" ? "Xatolik" : "Ошибка",
        description: error.message,
      });
    },
  });

  const createRunMutation = useMutation({
    mutationFn: async (data: PlanningRunForm) => apiRequest("POST", "/api/erp/mrp-runs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/mrp-runs"] });
      setShowRunDialog(false);
      setRunForm({ runName: "", planningHorizon: 30, includeSafetyStock: true, description: "" });
      toast({ title: lang === "uz" ? "MRP run yaratildi" : "MRP Run создан" });
    },
    onError: () => {
      toast({ variant: "destructive", title: lang === "uz" ? "Xato" : "Ошибка" });
    },
  });

  const calculateMRPMutation = useMutation({
    mutationFn: async (runId: string) =>
      apiRequest("POST", `/api/erp/mrp-runs/${runId}/calculate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/mrp-runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/mrp-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/purchase-requisitions"] });
      toast({ title: lang === "uz" ? "MRP hisoblandi" : "MRP рассчитан" });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/mrp-runs"] });
      toast({ variant: "destructive", title: lang === "uz" ? "Xato" : "Ошибка" });
    },
  });

  // ---------------------------------------------------------------------------
  // handleCreateRun — needs access to toast + runForm
  // ---------------------------------------------------------------------------

  const handleCreateRun = () => {
    if (!runForm.runName) {
      toast({
        variant: "destructive",
        title: lang === "uz" ? "Xato" : "Ошибка",
        description: lang === "uz" ? "Run nomini kiriting" : "Введите название",
      });
      return;
    }
    createRunMutation.mutate(runForm);
  };

  return {
    form,
    planForm,
    factForm,
    createMutation,
    updateMutation,
    savePlan,
    saveFact,
    createRunMutation,
    calculateMRPMutation,
    handleCreateRun,
  };
}
