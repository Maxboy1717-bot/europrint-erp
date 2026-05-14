/**
 * @module OffboardingTabSections
 * @description Section card components for OffboardingTab.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, Clock, AlertCircle, AlertTriangle, MessageSquare,
  ClipboardList, Package, Key, ScrollText, FileSignature, BadgeCheck,
  Handshake, UserX,
} from "lucide-react";
import type { OffboardingCase, ChecklistItem } from "./OffboardingTabTypes";
import { useTranslation } from '@/lib/i18n';
import {
  STATUS_BADGE, DISMISSAL_MAP, RETURN_STATUS_MAP,
} from "./OffboardingTabTypes";

// ── Checklist icon map ────────────────────────────────────────────────────────
const CHECKLIST_ICONS: Record<string, React.ReactNode> = {
  exit_interview:    <MessageSquare className="h-4 w-4" />,
  work_handover:     <Handshake className="h-4 w-4" />,
  equipment_returned:<Package className="h-4 w-4" />,
  id_card_returned:  <BadgeCheck className="h-4 w-4" />,
  erp_access_revoked:<Key className="h-4 w-4" />,
  nda_reviewed:      <ScrollText className="h-4 w-4" />,
  settlement_done:   <ClipboardList className="h-4 w-4" />,
  final_document:    <FileSignature className="h-4 w-4" />,
};

// ── CaseOverviewCard ──────────────────────────────────────────────────────────
interface CaseOverviewCardProps {
  oCase: OffboardingCase;
  pct: number;
}

export function CaseOverviewCard({oCase, pct }: CaseOverviewCardProps) {
  const { t } = useTranslation('common');
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserX className="h-4 w-4 text-[var(--ep-primary)]" />
          {t("offboardingMalumotlari")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{t('status10')}</p>
            <Badge variant={STATUS_BADGE[oCase.status]?.variant ?? "secondary"} className="mt-0.5">
              {STATUS_BADGE[oCase.status]?.label ?? oCase.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("ketishSababi")}</p>
            <p className="font-medium text-sm">{DISMISSAL_MAP[oCase.dismissal_type] ?? oCase.dismissal_type}</p>
          </div>
          {oCase.last_working_day && (
            <div>
              <p className="text-xs text-muted-foreground">{t("oxirgiIshKuni")}</p>
              <p className="font-medium text-sm flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {new Date(oCase.last_working_day).toLocaleDateString("uz-UZ")}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">{t("boshlangan")}</p>
            <p className="text-sm">{new Date(oCase.created_at).toLocaleDateString("uz-UZ")}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Jarayon: {oCase.completed_items}/{oCase.total_items}</span>
            <span className={pct === 100 ? "text-[var(--ep-green)] font-medium" : ""}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {oCase.blocks_settlement && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-3">
            <AlertTriangle className="h-4 w-4 text-[var(--ep-red)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--ep-red)] dark:text-red-400">{t("hisobKitobBlokda")}</p>
              <p className="text-xs text-[var(--ep-red)]/80 dark:text-red-400/70">
                {t("chiqishSuhbatiningBarchaSavollariToldirilmagan")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── ExitInterviewCard ─────────────────────────────────────────────────────────
interface ExitInterviewCardProps {
  oCase: OffboardingCase;
  showInterviewForm: boolean;
  onShowForm: () => void;
  formSlot: React.ReactNode;
}

export function ExitInterviewCard({ oCase, showInterviewForm, onShowForm, formSlot }: ExitInterviewCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[var(--ep-blue)]" />
            {t("chiqishSuhbati")}
          </span>
          {!oCase.exit_interview_done && oCase.status === "active" && !showInterviewForm && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onShowForm}>
              {t("otkazish")}
            </Button>
          )}
          {oCase.exit_interview_done && (
            <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showInterviewForm ? (
          formSlot
        ) : oCase.exit_interview_done && oCase.exitInterview?.answers ? (
          <div className="space-y-3">
            {Object.entries(oCase.exitInterview.answers).map(([key, value]) => (
              <div key={key} className="text-sm">
                <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                <p className="font-medium">{String(value)}</p>
              </div>
            ))}
          </div>
        ) : oCase.exit_interview_done ? (
          <div className="flex items-center gap-2 text-sm text-[var(--ep-green)] dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t("suhbatOtkazildi")}</span>
            {oCase.exit_interview_notes && (
              <span className="text-muted-foreground ml-1">— {oCase.exit_interview_notes}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{t("suhbatHaliOtkazilmagan")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── EquipmentReturnCard ───────────────────────────────────────────────────────
interface EquipmentReturnCardProps {
  oCase: OffboardingCase;
  equipmentItems: ChecklistItem[];
  onMarkItem: (params: { caseId: number; itemId: number; done?: boolean; returnStatus?: string }) => void;
  isPending: boolean;
}

export function EquipmentReturnCard({ oCase, equipmentItems, onMarkItem, isPending }: EquipmentReturnCardProps) {
  const { t } = useTranslation("common");
  if (equipmentItems.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--ep-purple)]" />
          {t("mulkQaytarishHolati")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {equipmentItems.map(item => {
          const rsInfo = RETURN_STATUS_MAP[item.return_status] ?? RETURN_STATUS_MAP.pending;
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                {item.done
                  ? <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)] shrink-0" />
                  : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                }
                <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium ${rsInfo.color}`}>{rsInfo.label}</span>
                {oCase.status === "active" && !item.done && (
                  <Select
                    value={item.return_status}
                    onValueChange={v =>
                      onMarkItem({ caseId: oCase.id, itemId: item.id, returnStatus: v, done: v === "returned" })
                    }
                  >
                    <SelectTrigger className="h-6 text-xs w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="returned">{t("qaytarildi")}</SelectItem>
                      <SelectItem value="damaged">{t("shikastlangan")}</SelectItem>
                      <SelectItem value="missing">{t("yoqolgan")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── FullChecklistCard ─────────────────────────────────────────────────────────
interface FullChecklistCardProps {
  oCase: OffboardingCase;
  checklist: ChecklistItem[];
  onMarkItem: (params: { caseId: number; itemId: number; done?: boolean; returnStatus?: string }) => void;
  isPending: boolean;
}

export function FullChecklistCard({ oCase, checklist, onMarkItem, isPending }: FullChecklistCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[var(--ep-blue)]" />
          To'liq Chek-list ({oCase.completed_items}/{oCase.total_items})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {(Array.isArray(checklist) ? checklist : []).map(item => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
              item.done ? "bg-green-50 dark:bg-green-900/10" : "hover:bg-muted/30"
            }`}
          >
            <div className={`shrink-0 ${item.done ? "text-[var(--ep-green)]" : "text-muted-foreground"}`}>
              {item.done
                ? <CheckCircle2 className="h-4 w-4" />
                : CHECKLIST_ICONS[item.item_key] ?? <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
              }
            </div>
            <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
              {item.label}
            </span>
            {item.done && item.done_at && (
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(item.done_at).toLocaleDateString("uz-UZ")}
              </span>
            )}
            {!item.done && oCase.status === "active"
              && item.item_key !== "exit_interview"
              && item.item_key !== "equipment_returned"
              && item.item_key !== "id_card_returned" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2 shrink-0"
                onClick={() => onMarkItem({ caseId: oCase.id, itemId: item.id, done: true })}
                disabled={isPending}
              >
                {t("Bajarildi")}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
