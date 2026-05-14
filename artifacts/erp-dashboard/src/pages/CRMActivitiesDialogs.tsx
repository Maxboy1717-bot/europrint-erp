/**
 * @module CRMActivitiesDialogs
 * @description Create-activity dialog for CRMActivities.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  type Deal,
  type NewActivityState,
  activityTypes,
} from "./CRMActivitiesTypes";

import { useTranslation } from "@/lib/i18n";
interface CreateActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newActivity: NewActivityState;
  onActivityChange: (updated: NewActivityState) => void;
  deals: Deal[] | undefined;
  createActivityMutation: UseMutationResult<unknown, unknown, NewActivityState>;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function CreateActivityDialog({ open, onOpenChange, newActivity, onActivityChange, deals, createActivityMutation, t, tCommon, }: CreateActivityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("createActivity")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{tCommon("type")}</Label>
            <Select
              value={newActivity.type}
              onValueChange={(v) => onActivityChange({ ...newActivity, type: v })}
            >
              <SelectTrigger data-testid="select-activity-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(activityTypes) ? activityTypes : []).map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(type.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("subject")}</Label>
            <Input
              value={newActivity.subject}
              onChange={(e) => onActivityChange({ ...newActivity, subject: e.target.value })}
              placeholder={t("activitySubject")}
              data-testid="input-activity-subject"
            />
          </div>

          <div>
            <Label>{tCommon("description")}</Label>
            <Textarea
              value={newActivity.description}
              onChange={(e) => onActivityChange({ ...newActivity, description: e.target.value })}
              placeholder={t("additionalInfo")}
              data-testid="input-activity-description"
            />
          </div>

          <div>
            <Label>{tCommon("priority")}</Label>
            <Select
              value={newActivity.priority}
              onValueChange={(v) => onActivityChange({ ...newActivity, priority: v })}
            >
              <SelectTrigger data-testid="select-activity-priority" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{tCommon("low")}</SelectItem>
                <SelectItem value="medium">{tCommon("medium")}</SelectItem>
                <SelectItem value="high">{tCommon("high")}</SelectItem>
                <SelectItem value="urgent">{t("urgentPriority")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("deal")}</Label>
            <Select
              value={newActivity.dealId}
              onValueChange={(v) => onActivityChange({ ...newActivity, dealId: v })}
            >
              <SelectTrigger data-testid="select-activity-deal" className="h-9">
                <SelectValue placeholder={tCommon("select")} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(deals) ? deals : []).map((deal) => (
                  <SelectItem key={deal.id} value={deal.id.toString()}>
                    {deal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("scheduledTime")}</Label>
            <Input
              type="datetime-local"
              value={newActivity.scheduledAt}
              onChange={(e) => onActivityChange({ ...newActivity, scheduledAt: e.target.value })}
              data-testid="input-activity-scheduled"
            />
          </div>

          <Button
            onClick={() => createActivityMutation.mutate(newActivity)}
            disabled={!newActivity.subject || createActivityMutation.isPending}
            className="w-full"
            data-testid="button-submit-activity"
          >
            {createActivityMutation.isPending ? t("creating") : tCommon("create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
