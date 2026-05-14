/**
 * Global Inbox Badge — barcha modul sahifalari yuqorisida ko'rinadi.
 *
 * Foydalanish:
 *   <GlobalInboxBadge />
 *
 * Bosganda /coordination sahifasiga o'tadi.
 * 30 sekundda bir avtomatik yangilanadi (real-time WebSocket Phase 5b'da qo'shiladi).
 */

import { useQuery } from "@tanstack/react-query";
import { Inbox, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface BasketSummary {
  inbox: number; pending: number; outbox: number; inboxOverdue: number;
}

export function GlobalInboxBadge() {
  const [, navigate] = useLocation();
  const q = useQuery<BasketSummary>({
    queryKey: ["/api/cc/baskets/summary"],
    queryFn: () => apiRequest("GET", "/api/cc/baskets/summary"),
    refetchInterval: 30_000,
    retry: false,
  });

  const s = q.data;
  if (!s) return null;
  const overdue = s.inboxOverdue > 0;

  return (
    <button
      onClick={() => navigate("/coordination")}
      title={`Kommunikatsiya: ${s.inbox} kiruvchi${overdue ? ', ' + s.inboxOverdue + ' muddati o\'tgan' : ''}`}
      style={{
        position: "relative",
        display:  "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36, height: 36,
        borderRadius: 10,
        background: overdue ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
        border:    `1px solid ${overdue ? "rgba(239,68,68,0.30)" : "rgba(255,255,255,0.10)"}`,
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = overdue ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.10)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = overdue ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)"; }}
    >
      <Inbox style={{ width: 16, height: 16, color: overdue ? "#FCA5A5" : "rgba(226,232,240,0.85)" }} />
      {s.inbox > 0 && (
        <span
          style={{
            position: "absolute", top: -3, right: -3,
            minWidth: 18, height: 18,
            background: overdue ? "#EF4444" : "#3B82F6",
            color: "#fff",
            borderRadius: 10,
            fontSize: 10, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "0 5px",
            border: "2px solid #0D1117",
          }}
        >
          {s.inbox > 99 ? '99+' : s.inbox}
        </span>
      )}
      {overdue && (
        <AlertTriangle
          style={{
            position: "absolute", bottom: -3, right: -3,
            width: 12, height: 12, color: "#FCA5A5",
          }}
        />
      )}
    </button>
  );
}
