/**
 * @module ActivityPanelHistoryTab
 * @description History tab content for ActivityPanel.
 * Split from ActivityPanel.tsx (Rule 16).
 */

import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

interface HistoryItem {
  id: number; action: string; fieldName: string | null;
  oldValue: string | null; newValue: string | null; createdAt: string;
  user?: { id: string; firstName: string; lastName: string };
}

interface Props {
  entityType: string;
  entityId: number;
  t: (key: string) => string;
}

export function ActivityPanelHistoryTab({ entityType, entityId, t }: Props) {
  const { data: history, isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/crm/history", { entityType, entityId }],
  });

  const fmtRelative = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: uz }); }
    catch { return d; }
  };

  return (
    <ScrollArea className="h-full px-4">
      <div className="space-y-3 pb-4">
        {isLoading ? (
          <div className="text-center py-4 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>
        ) : !history?.length ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t("tarixYoq")}</p>
          </div>
        ) : (
          (Array.isArray(history) ? history : []).map((item) => (
            <div key={item.id} className="flex gap-3 text-sm border-l-2 border-muted pl-3 py-1" data-testid={`history-${item.id}`}>
              <div className="flex-1">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {item.user?.firstName || "Tizim"} {item.user?.lastName || ""}
                  </span>{" "}
                  {item.action === "created" && "yaratdi"}
                  {item.action === "updated" && `${item.fieldName || "ma'lumotlarni"} yangiladi`}
                  {item.action === "stage_changed" && (
                    <>bosqichni <span className="line-through text-[var(--ep-red)]">{item.oldValue}</span> dan <span className="text-[var(--ep-green)]">{item.newValue}</span> {t("gaOzgartirdi")}</>
                  )}
                  {item.action === "deleted" && "o'chirdi"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtRelative(item.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
