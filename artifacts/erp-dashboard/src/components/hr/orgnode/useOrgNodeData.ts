/**
 * @module useOrgNodeData
 * @description React UI component.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NodeDetail } from "./types";

import { tLabel } from '@/lib/i18n/tLabel';
export function useOrgNodeData() {
  const [, params] = useRoute("/org-structure/hierarchy/node/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const nodeId = params?.id;

  const { data: node, isLoading, isError, refetch } = useQuery<NodeDetail>({
    queryKey: [`/api/org-structure/nodes/${nodeId}`],
    enabled: !!nodeId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/org-structure/nodes/${nodeId}`),
    onSuccess: () => {
      toast({ title: tLabel('hr.useOrgNodeData.ochirildi', "O'chirildi") });
      navigate("/org-structure/hierarchy");
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const onRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${nodeId}/history`] });
  };

  return {
    nodeId,
    node,
    isLoading,
    isError,
    deleteMutation,
    onRefresh,
    navigate
  };
}
