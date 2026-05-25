import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { queryClient } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safeStorage";
import { KANBAN_QUERY_KEY } from "@/hooks/use-kanban-dnd";

/**
 * T5.2 — Real-time Kanban sync.
 *
 * Opens a Socket.io connection to the `/recruitment` namespace and
 * invalidates the recruitment pipeline query whenever the backend
 * broadcasts a `candidate:moved` event.
 *
 * The backend emits this event from `RecruitmentGateway`
 * (apps/api/src/modules/hr/recruitment/recruitment.gateway.ts) after
 * `RecruitmentFunnelService.moveFunnelStage` succeeds.
 *
 * Authentication: the JWT access token (same one used by REST) is
 * passed via socket handshake auth. The gateway disconnects clients
 * with missing/invalid tokens or unauthorized roles.
 *
 * Connection lifecycle: one socket per component instance; cleaned up
 * on unmount. The hook is a no-op (no socket created) if there is no
 * access token in storage — useful in tests and pre-login routes.
 */
export interface CandidateMovedEvent {
  funnelId?: number;
  candidateId?: number;
  fromStage?: string | null;
  toStage?: string;
  changedById?: number;
  occurredAt?: string;
}

export function useKanbanRealtime(onEvent?: (payload: CandidateMovedEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const token = safeStorage.getItem("access_token");
    if (!token) return;

    const wsUrl = `${window.location.protocol}//${window.location.host}`;
    const basePath = (import.meta.env.BASE_URL ?? "/erp-dashboard/").replace(/\/$/, "");
    const socketPath = `${basePath}/socket.io`;

    const socket: Socket = io(`${wsUrl}/recruitment`, {
      auth: { token },
      transports: ["websocket", "polling"],
      path: socketPath,
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: 3,
    });

    const handler = (payload: CandidateMovedEvent) => {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
      const fn = onEventRef.current;
      if (fn) fn(payload ?? {});
    };

    socket.on("candidate:moved", handler);

    return () => {
      socket.off("candidate:moved", handler);
      socket.disconnect();
    };
  }, []);
}
