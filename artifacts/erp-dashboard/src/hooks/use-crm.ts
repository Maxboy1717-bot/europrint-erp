import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";

export function useCRMDashboard() {
  return useQuery({ queryKey: ["/api/crm/dashboard"] });
}

export function useCRMLeads(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["/api/crm/leads", filters],
    select: (data) => safeArray(data, "leads"),
  });
}

export function useCRMLead(id: string | number) {
  return useQuery({
    queryKey: ["/api/crm/leads", id],
    enabled: !!id,
  });
}

export function useCRMDeals(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["/api/crm/deals", filters],
    select: (data) => safeArray(data, "deals"),
  });
}

export function useCRMPipeline() {
  return useQuery({ queryKey: ["/api/crm/pipeline"] });
}

export function useCRMActivities(leadId?: string | number) {
  return useQuery({
    queryKey: ["/api/crm/activities", leadId],
    enabled: leadId !== undefined,
  });
}

export function useCreateLead() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/crm/leads", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] }),
  });
}

export function useQualifyLead() {
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string | number;
      [key: string]: unknown;
    }) => apiRequest("PATCH", `/api/crm/leads/${id}/qualify`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] }),
  });
}

export function useConvertLeadToDeal() {
  return useMutation({
    mutationFn: (leadId: string | number) =>
      apiRequest("POST", `/api/crm/leads/${leadId}/convert`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
    },
  });
}

export function useCreateDeal() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/crm/deals", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] }),
  });
}

export function useMarkDealWon() {
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string | number;
      [key: string]: unknown;
    }) => apiRequest("PATCH", `/api/crm/deals/${id}/won`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] }),
  });
}

export function useSendLeadEmail() {
  return useMutation({
    mutationFn: ({
      leadId,
      ...data
    }: {
      leadId: string | number;
      [key: string]: unknown;
    }) => apiRequest("POST", `/api/crm/leads/${leadId}/emails`, data),
  });
}
