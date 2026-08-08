/**
 * @module PendingApprovalsCard
 * @description React UI component.
 *
 * SB0389 (golden-thread): DirectorDashboard fetched /api/director/dashboard
 * (which already computes pendingApprovals + stats) but rendered no widget
 * pointing at the org-approval-workflow (/approvals — ApprovalHub.tsx). This
 * card closes that gap: it reads GET /api/director/approvals/pending (real
 * HITL approval_requests, director/approvals module) and links through to
 * /approvals so the director can act on it — same pattern as AlertsCard.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { ClipboardCheck, CheckCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SectionTitle } from "@/components/director/helpers";
import { useTranslation } from "@/lib/i18n";

interface PendingApprovalItem {
  id: string | number;
  documentType: string;
  documentNumber: string | null;
  amount: number | string;
  currency: string;
  createdAt: string;
}

interface PendingApprovalsResponse {
  items: PendingApprovalItem[];
  total: number;
}

const fmtAmount = (v: number | string, currency: string) => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return `0 ${currency}`;
  return `${n.toLocaleString("uz-UZ")} ${currency}`;
};

export function PendingApprovalsCard() {
  const { t } = useTranslation("common");
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<PendingApprovalsResponse>({
    queryKey: ["/api/director/approvals/pending", { limit: 5 }],
    refetchInterval: 60000,
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total ?? 0;

  return (
    <Card data-testid="card-pending-approvals">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <SectionTitle
            icon={ClipboardCheck}
            title={t("kutilayotganTasdiqlar", "Kutilayotgan tasdiqlar")}
            sub={t("hitlTasdiqSorovlari", "HITL tasdiq so'rovlari")}
            accent="text-[var(--ep-primary)]"
          />
          {total > 0 && (
            <Badge className="bg-orange-100 text-[var(--ep-primary)] border-none" data-testid="badge-pending-approvals-count">
              {total}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <CheckCircle className="w-8 h-8 text-[var(--ep-green)] mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("kutayotganTasdiqYoq", "Kutilayotgan tasdiq yo'q")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLocation("/approvals")}
                className="w-full flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 hover-elevate active-elevate-2 text-left transition-colors"
                data-testid={`pending-approval-item-${item.id}`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {item.documentNumber ?? `#${item.id}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{item.documentType}</p>
                </div>
                <p className="text-xs font-semibold text-foreground shrink-0">
                  {fmtAmount(item.amount, item.currency)}
                </p>
              </button>
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 justify-between"
          onClick={() => setLocation("/approvals")}
          data-testid="btn-goto-approval-hub"
        >
          {t("hammasiniKorish", "Hammasini ko'rish")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
