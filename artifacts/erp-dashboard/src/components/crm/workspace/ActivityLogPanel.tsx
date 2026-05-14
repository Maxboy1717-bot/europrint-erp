/**
 * @module ActivityLogPanel
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Plus, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ActivityLogPanelProps } from "./types";
import { useTranslation } from '@/lib/i18n';

export function ActivityLogPanel({
  activityFilter,
  setActivityFilter,
  activities,
  isLoading,
  onAddActivity,
  onDoneActivity,
  onDeleteActivity,
}: ActivityLogPanelProps) {
  const { t } = useTranslation("common");
  const ACTIVITY_TYPES = [
    { value: "call", label: "Qo'ng'iroq" },
    { value: "meeting", label: "Uchrashuv" },
    { value: "email", label: "Email" },
    { value: "follow_up", label: "Kuzatuv" },
    { value: "other", label: "Boshqa" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          {t("meningFaoliyatlarim")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={activityFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setActivityFilter("today")}
            data-testid="button-filter-today"
          >
            {t("today")}
          </Button>
          <Button
            variant={activityFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActivityFilter("all")}
            data-testid="button-filter-all"
          >
            {t("Barchasi")}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={onAddActivity}
            data-testid="button-add-activity"
          >
            <Plus className="h-4 w-4" /> {t("faoliyatQoshish")}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {([1, 2, 3]).map((i) => (
            <Skeleton key={`k-${i}`} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {activityFilter === "today"
                ? "Bugun uchun faoliyat yo'q"
                : "Faoliyatlar topilmadi"}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2 overflow-y-auto pr-2">
        {(Array.isArray(activities) ? activities : []).map((activity) => (
          <div
            key={activity.id}
            data-testid={`card-activity-${activity.id}`}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              activity.isDone
                ? "opacity-60 bg-muted/60"
                : "bg-card"
            }`}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 mt-0.5"
              onClick={() => !activity.isDone && onDoneActivity(activity.id)}
              data-testid={`button-done-activity-${activity.id}`}
            >
              <CheckSquare
                className={`h-4 w-4 ${
                  activity.isDone ? "text-[var(--ep-green)]" : "text-muted-foreground"
                }`}
              />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {activity.subject}
                </span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {(Array.isArray(ACTIVITY_TYPES) ? ACTIVITY_TYPES : []).find((t) => t.value === activity.type)?.label ||
                    activity.type}
                </Badge>
                {activity.isDone && (
                  <Badge className="text-xs shrink-0 bg-green-100 text-green-800 no-default-hover-elevate">
                    {t("Bajarildi")}
                  </Badge>
                )}
              </div>
              {activity.note && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {activity.note}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                {activity.dueDate && (
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      new Date(activity.dueDate) < new Date() && !activity.isDone
                        ? "text-[var(--ep-red)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-3 w-3" />{" "}
                    {format(new Date(activity.dueDate), "dd.MM.yyyy HH:mm")}
                  </span>
                )}
                {activity.entityType && (
                  <span className="text-xs text-muted-foreground">
                    {activity.entityType} #{activity.entityId}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={() => onDeleteActivity(activity.id)}
              data-testid={`button-delete-activity-${activity.id}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
