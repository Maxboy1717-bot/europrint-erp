/**
 * @module DetailSheetTabs
 * @description Tab-content panel components for the history and AI analysis
 * tabs inside DetailSheet:
 *   - HistoryTab  — "Tarix" tab (activities + change log)
 *   - AITab       — "AI Tahlil" tab (AIAnalysisPanel + ExtendedAIPanel)
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { CheckCircle, Clock, Zap } from "lucide-react";
import { format } from "date-fns";
import type { CrmActivity, HistoryRecord } from "./DetailSheetTypes";
import { HISTORY_ACTION_LABELS } from "./DetailSheetTypes";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { ExtendedAIPanel } from "./ExtendedAIPanel";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// HistoryTab — "Tarix" tab
// ---------------------------------------------------------------------------

interface HistoryTabProps {
  activities: CrmActivity[];
  historyData: HistoryRecord[];
}

export function HistoryTab({ activities, historyData }: HistoryTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="tarix" className="m-0">
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {activities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("faoliyatlar")}
              </h4>
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 mb-2 p-2 border-l-2 border-blue-200 pl-3"
                >
                  {act.isDone ? (
                    <CheckCircle className="h-4 w-4 text-[var(--ep-green)] mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-[var(--ep-primary)] mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{act.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {act.type} •{" "}
                      {act.dueDate
                        ? format(new Date(act.dueDate), "dd.MM.yyyy HH:mm")
                        : "Muddat yo'q"}
                      {act.isDone && (
                        <span className="ml-1 text-[var(--ep-green)]">{t("bajarildi")}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("ozgarishlarTarixi")}
            </h4>
            {historyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("tarixBosh")}</p>
            ) : (
              historyData.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-3 mb-2 p-2 border-l-2 border-gray-200 pl-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {HISTORY_ACTION_LABELS[h.action] || h.action}
                      {h.action === "stage_changed" &&
                        ` (${h.oldStageId} → ${h.newStageId})`}
                      {h.fieldName && ` [${h.fieldName}]`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.user?.fullName || "Tizim"} •{" "}
                      {format(new Date(h.createdAt), "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// AITab — "AI Tahlil" tab
// ---------------------------------------------------------------------------

interface AITabProps {
  entityType: string;
  entityId: number;
}

export function AITab({ entityType, entityId }: AITabProps) {
  return (
    <TabsContent value="ai" className="m-0">
      <div className="space-y-6">
        <AIAnalysisPanel entityType={entityType} entityId={entityId} />
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {t("kengaytirilganAiFunksiyalari")}
          </h3>
          <ExtendedAIPanel entityType={entityType} entityId={entityId} />
        </div>
      </div>
    </TabsContent>
  );
}
