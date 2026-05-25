/** @module AIProductionPlanningDetailDialog @description Plan detail dialog component including the inner Gantt, schedule, batch-groups, and decisions log tabs. */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Play, Printer, RotateCcw, XCircle } from "lucide-react";
import {
  AiPlan, AiDecision, BatchGroup, DetailTab,
  getConfidenceColor, printPlan,
} from "./AIProductionPlanningTypes";
import { GanttChart } from "./AIProductionPlanningChart";
import { StatusBadge } from "./AIProductionPlanningSections";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from "@/lib/i18n/tLabel";
// ─── Decisions List ───────────────────────────────────────────────────────────
function DecisionsList({ decisions, onAccept, isPending }: {
  decisions: AiDecision[] | undefined;
  onAccept: (id: string) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-2">
      {(!decisions || decisions.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-4">{t("logYozuvlariYoq")}</p>
      )}
      {(Array.isArray(decisions) ? decisions : []).map((dec) => (
        <div
          key={dec.id}
          className={cn("p-3 rounded-lg text-sm border",
            dec.decisionType === "override" ? "border-amber-300 bg-amber-50"
            : dec.decisionType === "reschedule" ? "border-blue-300 bg-blue-50"
            : "bg-muted/30")}
          data-testid={`row-decision-${dec.id}`}
        >
          <div className="flex justify-between gap-2 mb-1">
            <Badge className={cn("text-[10px] no-default-hover-elevate",
              dec.decisionType === "override" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800")}>
              {dec.decisionType === "override" ? "OVERRIDE"
                : dec.decisionType === "reschedule" ? "RESCHEDULE"
                : dec.decisionType.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(dec.createdAt).toLocaleString("uz-UZ")}
            </span>
          </div>
          <p className="text-muted-foreground">{dec.description}</p>
          {dec.status === "proposed" && (
            <Button
              size="sm" className="mt-2"
              onClick={() => onAccept(dec.id)}
              disabled={isPending}
              data-testid={`button-accept-decision-${dec.id}`}
            >
              {t("receive")}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PlanDetailDialog ─────────────────────────────────────────────────────────
export interface PlanDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: AiPlan | null;
  detailTab: DetailTab;
  onDetailTabChange: (t: DetailTab) => void;
  batchGroups: { batchGroups: BatchGroup[]; totalMachines: number } | undefined;
  onApprove: () => void;
  onReject: () => void;
  onExecute: () => void;
  onReschedule: () => void;
  onAcceptDecision: (id: string) => void;
  isRejectPending: boolean;
  isExecutePending: boolean;
  isAcceptDecisionPending: boolean;
}

export function PlanDetailDialog({
  open, onOpenChange, plan, detailTab, onDetailTabChange,
  batchGroups, onApprove, onReject, onExecute, onReschedule,
  onAcceptDecision, isRejectPending, isExecutePending, isAcceptDecisionPending,
}: PlanDetailDialogProps) {
  const { t } = useTranslation("common");
  if (!plan) return null;

  const metaStats = [
    { label: tLabel('common.confidence', "Ishonch"),      value: `${plan.confidenceScore}%`,        color: getConfidenceColor(plan.confidenceScore) },
    { label: "Buyurtmalar",  value: String(plan.totalOrders ?? 0),     color: "" },
    { label: tLabel('common.mashinaSoat', "Mashina soat"), value: String(plan.totalMachineHours ?? 0), color: "" },
    { label: "Bajarilish",   value: plan.estimatedCompletion ?? "-",   color: "" },
  ];

  const TABS: [DetailTab, string][] = [
    ["schedule", "Jadval"], ["gantt", "Gantt"], ["batch", "Batch Grupp"], ["decisions", "Log"],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span data-testid="text-detail-plan-number" className="font-bold">{plan.planNumber}</span>
            <StatusBadge status={plan.status} />
          </DialogTitle>
        </DialogHeader>

        {/* Meta stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {metaStats.map((s, i) => (
            <div key={`k-${i}`} className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p
                className={cn("text-xl font-bold", s.color)}
                data-testid={`text-detail-${s.label.toLowerCase().replace(/ /g, "-")}`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Optimization metrics */}
        {plan.optimizationMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {Object.entries(plan.optimizationMetrics).map(([k, v]) => (
              <div key={k} className="flex justify-between p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className="font-bold" data-testid={`text-metric-${k}`}>{v}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Inner tabs */}
        <div className="flex border-b gap-0">
          {TABS.map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => onDetailTabChange(tab)}
              className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                detailTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground")}
              data-testid={`detail-tab-${tab}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Schedule */}
        {detailTab === "schedule" && (plan.planData?.length ?? 0) > 0 && (
          <ScrollArea className="max-h-64 rounded-lg border bg-muted/20">
            <div className="divide-y">
              {(Array.isArray(plan.planData) ? plan.planData : []).map((item, i) => (
                <div key={`k-${i}`} className="flex items-center gap-3 p-3 text-sm" data-testid={`row-schedule-${i}`}>
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold no-default-hover-elevate shrink-0">
                    {item.sequence}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.papkaNo}</p>
                    <p className="text-xs text-muted-foreground">{item.machineName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">{item.startTime} – {item.endTime}</p>
                    <p className="text-xs text-muted-foreground">{item.duration} min</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Gantt */}
        {detailTab === "gantt" && <GanttChart items={plan.planData || []} />}

        {/* Batch groups */}
        {detailTab === "batch" && (
          <div className="space-y-2" data-testid="batch-groups">
            {batchGroups?.batchGroups?.map((g, i) => (
              <div key={`k-${i}`} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">{g.machine}</span>
                  <Badge className="text-xs no-default-hover-elevate">{g.count} buyurtma</Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{t("tejash")}<strong className="text-[var(--ep-green)]">{g.changeoverReduction}</strong></span>
                  <span>{t("energiya")}<strong className="text-[var(--ep-blue)]">{g.estimatedEnergySaving}</strong></span>
                  <span>Jami: {Math.round(g.totalDuration / 60)} soat</span>
                </div>
              </div>
            )) || (
              <p className="text-sm text-muted-foreground text-center py-4">{t("Yuklanmoqda...")}</p>
            )}
          </div>
        )}

        {/* Decisions log */}
        {detailTab === "decisions" && (
          <DecisionsList
            decisions={plan.decisions}
            onAccept={onAcceptDecision}
            isPending={isAcceptDecisionPending}
          />
        )}

        <DialogFooter className="flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => printPlan(plan)} data-testid="button-print-plan">
            <Printer className="h-4 w-4 mr-1" /> {t("pdfChopEtish")}
          </Button>
          <Button variant="outline" size="sm" onClick={onReschedule} data-testid="button-reschedule">
            <RotateCcw className="h-4 w-4 mr-1" /> {t("qaytaRejalash")}
          </Button>
          {plan.status === "pending_review" && (
            <>
              <Button size="sm" onClick={onApprove} data-testid="button-approve-plan">
                <CheckCircle className="h-4 w-4 mr-1" /> {t("verify")}
              </Button>
              <Button variant="destructive" size="sm" onClick={onReject} disabled={isRejectPending} data-testid="button-reject-plan">
                <XCircle className="h-4 w-4 mr-1" /> {t("reject")}
              </Button>
            </>
          )}
          {(plan.status === "auto_approved" || plan.status === "manually_approved") && (
            <Button size="sm" onClick={onExecute} disabled={isExecutePending} data-testid="button-execute-plan">
              {isExecutePending
                ? <EPLoader className="mr-1" />
                : <Play className="h-4 w-4 mr-1" />}
              Bajarish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
