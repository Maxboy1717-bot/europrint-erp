/**
 * @module TechApprovalSections
 * @description Self-contained section components for the TechApproval page:
 *              AiCheckPanel — runs AI analysis and renders score/warnings;
 *              ApprovalHistory — fetches and displays the approval log for an order;
 *              MaterialAlternatives — lets the user search for material substitutes.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/queryClient";
import {
  CheckCircle, XCircle, AlertTriangle, Zap, User,
} from "lucide-react";
import type { AiCheckResult, ApprovalLog, MaterialAlt } from "./TechApprovalTypes";
import { apiRequest } from '@/lib/queryClient';

// ─── AI Check Panel ───────────────────────────────────────────────────────────

export function AiCheckPanel({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<AiCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('POST', `/api/technology/orders/${orderId}/ai-check`, {});
      if (res.ok) setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4 animate-pulse" />
        AI tekshirmoqda...
      </div>
    );
  }
  if (!result) return null;

  const scoreColor =
    result.score >= 80 ? "text-[var(--ep-green)]" :
    result.score >= 50 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";

  const statusColor =
    result.status === "passed"   ? "bg-green-100 text-[var(--ep-green)]" :
    result.status === "warnings" ? "bg-amber-100 text-[var(--ep-yellow)]" :
    "bg-red-100 text-[var(--ep-red)]";

  return (
    <div className="space-y-3 p-4 bg-muted rounded-lg" data-testid="ai-check-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Tahlil Natijasi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>{result.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
          <Badge className={`text-xs ${statusColor}`}>
            {result.status === "passed"
              ? "O'tdi"
              : result.status === "warnings"
              ? "Ogohlantirishlar"
              : "Rad"}
          </Badge>
        </div>
      </div>

      {result.warnings.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-[var(--ep-green)]">
          <CheckCircle className="h-4 w-4" />
          {result.recommendation}
        </div>
      ) : (
        <div className="space-y-1">
          {(Array.isArray(result.warnings) ? result.warnings : []).map((w, i) => (
            <div
              key={`k-${i}`}
              className={`flex items-start gap-2 text-xs p-2 rounded ${
                w.level === "error"
                  ? "bg-red-50 text-[var(--ep-red)]"
                  : w.level === "warning"
                  ? "bg-amber-50 text-[var(--ep-yellow)]"
                  : "bg-blue-50 text-[var(--ep-blue)]"
              }`}
              data-testid={`ai-warning-${w.code}`}
            >
              {w.level === "error"
                ? <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                : <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />}
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{result.recommendation}</p>
    </div>
  );
}

// ─── Approval History ─────────────────────────────────────────────────────────

export function ApprovalHistory({ orderId }: { orderId: string }) {
  const { data: log } = useQuery<ApprovalLog>({
    queryKey: ["/api/technology/orders", orderId, "approval-log"],
    queryFn: async () => {
      const r = await apiRequest('GET', `/api/technology/orders/${orderId}/approval-log`);
      if (!r.ok) throw new Error("Log topilmadi");
      return r.json();
    },
  });

  if (!log || log.techAction === "pending") {
    return (
      <p className="text-sm text-muted-foreground italic">
        Hali texnolog harakati yo'q
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm" data-testid="approval-history">
      <div className="flex items-center gap-2">
        <Badge
          className={
            log.isRejected
              ? "bg-red-100 text-[var(--ep-red)] no-default-hover-elevate"
              : "bg-green-100 text-[var(--ep-green)] no-default-hover-elevate"
          }
        >
          {log.isRejected ? "Rad etildi" : "Tasdiqlandi"}
        </Badge>
        {log.approvedAt && (
          <span className="text-muted-foreground text-xs">
            {new Date(log.approvedAt).toLocaleString("uz-UZ")}
          </span>
        )}
      </div>

      {log.approvedBy && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{log.approvedBy}</span>
        </div>
      )}

      {!log.isRejected && (
        <div className="flex gap-3 text-xs">
          <span className={log.checkpoints.bomApproved ? "text-[var(--ep-green)]" : "text-muted-foreground"}>
            {log.checkpoints.bomApproved ? "✓" : "○"} BOM
          </span>
          <span className={log.checkpoints.routingApproved ? "text-[var(--ep-green)]" : "text-muted-foreground"}>
            {log.checkpoints.routingApproved ? "✓" : "○"} Routing
          </span>
          <span className={log.checkpoints.techCardApproved ? "text-[var(--ep-green)]" : "text-muted-foreground"}>
            {log.checkpoints.techCardApproved ? "✓" : "○"} Texkarta
          </span>
        </div>
      )}

      {log.notes && (
        <p className="text-xs text-muted-foreground italic">Izoh: {log.notes}</p>
      )}
    </div>
  );
}

// ─── Material Alternatives ────────────────────────────────────────────────────

export function MaterialAlternatives() {
  const [material, setMaterial] = useState("gofrokarton");
  const { data, refetch, isFetching } = useQuery<{
    material: string;
    alternatives: MaterialAlt[];
    note: string;
  }>({
    queryKey: ["/api/technology/materials/alternatives", material],
    queryFn: async () => {
      const r = await apiRequest('GET', `/api/technology/materials/alternatives?material=${encodeURIComponent(material)}`);
      return r.json();
    },
    enabled: false,
  });

  return (
    <div className="space-y-3" data-testid="material-alternatives">
      <div className="flex gap-2">
        <input
          className="flex-1 text-sm px-3 py-1.5 rounded-md border bg-background"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Material nomi (masalan: gofrokarton)"
          data-testid="input-material-name"
        />
        <Button
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-find-alternatives"
        >
          {isFetching ? "Qidirilmoqda..." : "Muqobil topish"}
        </Button>
      </div>

      {data?.alternatives && (
        <div className="space-y-2">
          {(Array.isArray(data.alternatives) ? data.alternatives : []).map((alt, i) => (
            <div
              key={`k-${i}`}
              className="p-3 bg-muted rounded-lg flex items-start justify-between gap-2"
              data-testid={`material-alt-${i}`}
            >
              <div>
                <p className="font-medium text-sm">{alt.name}</p>
                <p className="text-xs text-muted-foreground">{alt.note}</p>
              </div>
              <Badge className="text-xs bg-green-100 text-[var(--ep-green)] no-default-hover-elevate shrink-0">
                {alt.saving}
              </Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{data.note}</p>
        </div>
      )}
    </div>
  );
}

