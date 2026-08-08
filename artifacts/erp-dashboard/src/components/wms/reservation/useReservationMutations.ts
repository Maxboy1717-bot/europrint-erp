/**
 * @module useReservationMutations
 * @description React UI component.
 */

import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OptimizationResult, TFunc } from "./types";

interface UseReservationMutationsProps {
  t: TFunc;
  setOptimizationResult: (data: OptimizationResult | null) => void;
  setIsAddBatchOpen: (open: boolean) => void;
  setBatchForm: (form: { batchNumber: string; materialName: string; materialType: string; quantity: string; availableQuantity: string; unit: string; expiryDate: string; receivedDate: string; location: string; costPerUnit: string; qualityGrade: string }) => void;
}

export function useReservationMutations({
  t,
  setOptimizationResult,
  setIsAddBatchOpen,
  setBatchForm,
}: UseReservationMutationsProps) {
  const { toast } = useToast();

  const optimizeMutation = useMutation({
    mutationFn: (params: { materialType: string; quantity: number }) =>
      apiRequest<OptimizationResult>('GET', `/api/ai-reservation/optimize?materialType=${encodeURIComponent(params.materialType)}&quantity=${params.quantity}`),
    onSuccess: (data: OptimizationResult) => {
      setOptimizationResult(data);
      toast({ title: t("Reservation.toastOptimizeReady") });
    },
    onError: () => {
      toast({ title: t("Reservation.toastError"), variant: "destructive" });
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
      toast({ title: t("Reservation.toastRequestCreated") });
    },
    onError: () => {
      toast({ title: t("Reservation.toastError"), variant: "destructive" });
    },
  });

  const confirmMutation = useMutation<any, any, any>({
    mutationFn: async (id: string) => {
      return apiRequest<Record<string, unknown>>("POST", `/api/ai-reservation/requests/${id}/confirm`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation"] });
      toast({ title: t("Reservation.toastConfirmed") });
    },
  });

  const cancelRequestMutation = useMutation<any, any, any>({
    mutationFn: async (id: string) => {
      return apiRequest<Record<string, unknown>>("POST", `/api/ai-reservation/requests/${id}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation"] });
      toast({ title: t("Reservation.toastCancelled") });
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
      toast({ title: t("Reservation.toastBatchAdded") });
    },
    onError: () => {
      toast({ title: t("Reservation.toastError"), variant: "destructive" });
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
