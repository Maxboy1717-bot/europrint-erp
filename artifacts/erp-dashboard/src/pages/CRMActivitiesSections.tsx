/**
 * @module CRMActivitiesSections
 * @description Pending and Completed activity list sections for CRMActivities.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Clock, Check, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTranslation } from '@/lib/i18n';
import {
  type Activity,
  priorityColors,
  getActivityIcon,
  getActivityColor,
} from "./CRMActivitiesTypes";

// ─── PendingActivitiesSection ─────────────────────────────────────────────────

interface PendingActivitiesSectionProps {
  pendingActivities: Activity[];
  completeActivityMutation: UseMutationResult<unknown, unknown, number>;
  cancelActivityMutation: UseMutationResult<unknown, unknown, number>;
  t: (key: string) => string;
}

export function PendingActivitiesSection({
  pendingActivities,
  completeActivityMutation,
  cancelActivityMutation,
  t,
}: PendingActivitiesSectionProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("pendingLabel")} ({pendingActivities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {pendingActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("noActivities")}</p>
            ) : (
              (Array.isArray(pendingActivities) ? pendingActivities : []).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <Card key={activity.id} className="hover-elevate" data-testid={`card-activity-${activity.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{activity.subject}</p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={priorityColors[activity.priority]}>
                                {activity.priority}
                              </Badge>
                              {activity.scheduledAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(activity.scheduledAt), "dd.MM.yyyy HH:mm")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => completeActivityMutation.mutate(activity.id)}
                            disabled={completeActivityMutation.isPending}
                            data-testid={`button-complete-${activity.id}`}
                          >
                            <Check className="h-4 w-4 text-[var(--ep-green)]" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={cancelActivityMutation.isPending}
                                data-testid={`button-cancel-${activity.id}`}
                              >
                                <X className="h-4 w-4 text-[var(--ep-red)]" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("bekorQilishniTasdiqlang")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("faoliyatBekorQilinadiVaQayta")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("close2")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelActivityMutation.mutate(activity.id)}
                                >
                                  {t("cancel")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── CompletedActivitiesSection ───────────────────────────────────────────────

interface CompletedActivitiesSectionProps {
  completedActivities: Activity[];
  t: (key: string) => string;
}

export function CompletedActivitiesSection({
  completedActivities,
  t,
}: CompletedActivitiesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-4 w-4 text-[var(--ep-green)]" />
          {t("completedActivities")} ({completedActivities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {completedActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("noCompletedActivities")}
              </p>
            ) : (
              (Array.isArray(completedActivities) ? completedActivities : []).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <Card
                    key={activity.id}
                    className="opacity-75"
                    data-testid={`card-activity-completed-${activity.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${getActivityColor(activity.type)} text-white opacity-50`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate line-through">{activity.subject}</p>
                          {activity.completedAt && (
                            <span className="text-xs text-muted-foreground">
                              {t("completedLabel")}:{" "}
                              {format(new Date(activity.completedAt), "dd.MM.yyyy HH:mm")}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
