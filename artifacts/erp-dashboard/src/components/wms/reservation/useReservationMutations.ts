/**
 * @module useReservationMutations
 * @description React UI component.
 */

import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OptimizationResult } from "./types";

interface UseReservationMutationsProps {
  lang: "uz" | "ru";
  setOptimizationResult: (data: OptimizationResult | null) => void;
  setIsAddBatchOpen: (open: boolean) => void;
  setBatchForm: (form: { batchNumber: string; materialName: string; materialType: string; quantity: string; availableQuantity: string; unit: string; expiryDate: string; receivedDate: string; location: string; costPerUnit: string; qualityGrade: string }) => void;
}

export function useReservationMutations({
  lang,
  setOptimizationResult,
  setIsAddBatchOpen,
  setBatchForm,
}: UseReservationMutationsProps) {
  const { toast } = useToast();

  const optimizeMutation = useMutation({
    mutationFn: async (params: { materialType: string; quantity: number }) => {
      const res = await apiRequest('GET', `/api/ai-reservation/optimize?materialType=${encodeURIComponent(params.materialType)}&quantity=${params.quantity}`) as unknown as Response;
      if (!res.ok) throw new Error("Optimization failed");
      return res.json();
    },
    onSuccess: (data: OptimizationResult) => {
      setOptimizationResult(data);
      toast({ title: lang === "uz" ? "Optimallashtirish tayyor" : "Оптимизация готова" });
    },
    onError: () => {
      toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" });
    },
  });

  const createRequestMutation = useMutation<any, any, any>({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest<{ optimization?: OptimizationResult }>("POST", "/api/ai-reservation/request", data);
    },
    onSuccess: (data: { optimization?: OptimizationResult }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation/dashboard"] });
      if (data.optimization) setOptimizationResult(data.optimization);
      toast({ title: lang === "uz" ? "So'rov yaratildi" : "Запрос создан" });
    },
    onError: () => {
      toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" });
    },
  });

  const confirmMutation = useMutation<any, any, any>({
    mutationFn: async (id: string) => {
      return apiRequest<Record<string, unknown>>("POST", `/api/ai-reservation/requests/${id}/confirm`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation"] });
      toast({ title: lang === "uz" ? "Tasdiqlandi" : "Подтверждено" });
    },
  });

  const cancelRequestMutation = useMutation<any, any, any>({
    mutationFn: async (id: string) => {
      return apiRequest<Record<string, unknown>>("POST", `/api/ai-reservation/requests/${id}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation"] });
      toast({ title: lang === "uz" ? "Bekor qilindi" : "Отменено" });
    },
  });

  const addBatchMutation = useMutation<any, any, any>({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest<Record<string, unknown>>("POST", "/api/ai-reservation/batches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation/batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation/dashboard"] });
      setIsAddBatchOpen(false);
      setBatchForm({
        batchNumber: "", materialName: "", materialType: "", quantity: "",
        availableQuantity: "", unit: "kg", expiryDate: "", receivedDate: "",
        location: "", costPerUnit: "", qualityGrade: "A",
      });
      toast({ title: lang === "uz" ? "Partiya qo'shildi" : "Партия добавлена" });
    },
    onError: () => {
      toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" });
    },
  });

  return {
    optimizeMutation,
    createRequestMutation,
    confirmMutation,
    cancelRequestMutation,
    addBatchMutation,
  };
}
