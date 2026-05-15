/**
 * useAgentAlerts — Agent alertlarini React Query bilan polling (30s).
 * Socket.IO `/agents` namespace mavjud emas, oddiy polling MVP uchun yetarli.
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface AgentAlert {
  id:              string;
  agentName:       string;
  severity:        'info' | 'warning' | 'critical' | 'urgent';
  title:           string;
  message:         string;
  module:          string | null;
  relatedId:       string | null;
  actionRequired:  boolean;
  actions:         Array<{ label: string; action: string; payload?: unknown }>;
  isRead:          boolean;
  createdAt:       string;
}

export function useAgentAlerts(limit = 20) {
  const qc = useQueryClient();

  const list = useQuery<AgentAlert[]>({
    queryKey: ['/api/agents/alerts', limit],
    queryFn: async () => {
      try { return await apiRequest<AgentAlert[]>('GET', `/api/agents/alerts?limit=${limit}`); }
      catch { return []; }
    },
    refetchInterval: 30_000,
    retry: false,
  });

  const markRead = useMutation<unknown, Error, string>({
    mutationFn: (id) => apiRequest('POST', `/api/agents/alerts/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/agents/alerts'] }),
  });

  const alerts = Array.isArray(list.data) ? list.data : [];
  const unread = useMemo(() => alerts.filter(a => !a.isRead).length, [alerts]);

  return {
    alerts,
    unread,
    isLoading: list.isLoading,
    refetch: list.refetch,
    markRead: (id: string) => markRead.mutate(id),
  };
}
