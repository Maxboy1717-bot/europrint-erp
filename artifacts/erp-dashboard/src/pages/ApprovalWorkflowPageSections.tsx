/**
 * @module ApprovalWorkflowPageSections
 * @description List section (skeleton, empty state, workflow cards) for ApprovalWorkflowPage.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { Workflow, STATUS_MAP, fmtAmt } from "./ApprovalWorkflowPageTypes";
import { useTranslation } from '@/lib/i18n';

interface WorkflowListProps {
  isLoading: boolean;
  filtered: Workflow[];
  tab: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function WorkflowList({ isLoading, filtered, tab, onApprove, onReject }: WorkflowListProps) {
  const { t } = useTranslation("common");
  if (isLoading) {
    return (
      <div className="space-y-3">
        {([1, 2, 3]).map(i => (
          <Card key={`k-${i}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="h-3 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-24 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {tab === "pending" ? "Kutilayotgan arizalar yo'q" : "Tarix topilmadi"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map(w => {
        const status = w.status ?? "pending";
        const sc = STATUS_MAP[status] ?? STATUS_MAP.pending;
        const docType   = w.documentType ?? w.document_type ?? "—";
        const docNum    = w.documentNumber ?? w.document_number;
        const requester = w.requestedBy ?? w.requested_by;
        const createdAt = w.created_at ?? w.createdAt;
        return (
          <Card key={w.id} className="hover:shadow-md transition-shadow" data-testid={`card-workflow-${w.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm">{docType}</span>
                    {docNum && <span className="font-mono text-xs text-muted-foreground">{docNum}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-muted-foreground">
                    <span>{fmtAmt(w.amount, w.currency)}</span>
                    {requester && <span>Yuboruvchi: {requester}</span>}
                    {createdAt && (
                      <span>{new Date(createdAt).toLocaleDateString("uz-UZ")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                  {status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-[var(--ep-green)] border-green-200 hover:bg-green-50"
                        onClick={() => onApprove(w.id)}
                        data-testid={`button-approve-workflow-${w.id}`}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t("verify")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => onReject(w.id)}
                        data-testid={`button-reject-workflow-${w.id}`}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        {t("reject")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
