/**
 * @module ThreeBasketsPanel
 * @description Compact Communication-Center summary widget for the Kanban board.
 *   Shows live basket counts from /api/cc/baskets/summary and links to the full
 *   Communication Center (Coordination -> baskets). Read-only by design: the full
 *   document workflow (open / move / PIN) lives in the Coordination CC, so this
 *   widget only surfaces the real counts instead of the previous hardcoded mock.
 */

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Inbox, Clock, Send, AlertTriangle, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { KanbanTranslations } from "./types";

interface BasketSummary {
  inbox: number;
  pending: number;
  outbox: number;
  inboxOverdue: number;
}

interface ThreeBasketsProps {
  t: KanbanTranslations;
}

// Full Communication Center lives in the Coordination page, baskets tab.
const CC_BASKETS_ROUTE = "/coordination?tab=baskets";

export function ThreeBasketsPanel({ t }: ThreeBasketsProps) {
  const [, navigate] = useLocation();

  const { data, isLoading, isError } = useQuery<BasketSummary>({
    queryKey: ["/api/cc/baskets/summary"],
    queryFn: () => apiRequest<BasketSummary>("GET", "/api/cc/baskets/summary"),
    refetchInterval: 30_000,
    retry: false,
  });

  const s = data ?? { inbox: 0, pending: 0, outbox: 0, inboxOverdue: 0 };

  const baskets = [
    { key: "incoming", label: t.baskets.incoming, icon: Inbox, count: s.inbox,   iconClass: "text-[var(--ep-blue)]" },
    { key: "pending",  label: t.baskets.pending,  icon: Clock, count: s.pending, iconClass: "text-[var(--ep-yellow)]" },
    { key: "outgoing", label: t.baskets.outgoing, icon: Send,  count: s.outbox,  iconClass: "text-[var(--ep-green)]" },
  ] as const;

  return (
    <Card className="mx-4 mb-4 p-3" data-testid="card-three-baskets">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[var(--ep-blue)]" />
          <span className="text-sm font-semibold text-foreground">{t.baskets.title}</span>
          {s.inboxOverdue > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-[var(--ep-red)] border-red-200">
              <AlertTriangle size={11} />
              {s.inboxOverdue} {t.baskets.overdueLabel}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(CC_BASKETS_ROUTE)}
          data-testid="link-open-cc"
        >
          To'liq ko'rish
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        {[...baskets].map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => navigate(CC_BASKETS_ROUTE)}
            data-testid={`basket-summary-${b.key}`}
            className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <b.icon className={`w-4 h-4 ${b.iconClass}`} />
            {isLoading ? (
              <span className="h-6 w-8 rounded bg-muted animate-pulse" data-testid={`basket-skeleton-${b.key}`} />
            ) : (
              <span className="text-lg font-bold text-foreground">{b.count}</span>
            )}
            <span className="text-xs text-muted-foreground">{b.label}</span>
          </button>
        ))}
      </div>

      {isError && (
        <p className="mt-2 text-center text-xs text-muted-foreground">{t.baskets.empty}</p>
      )}
    </Card>
  );
}
