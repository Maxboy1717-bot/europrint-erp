/**
 * @module RobotsViewDialog
 * @description Create / edit robot form dialog for RobotsView.
 */

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import type { Robot, RobotFormValues } from "./RobotsViewTypes";
import { TRIGGER_TYPES, ACTION_TYPES } from "./RobotsViewTypes";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
interface RobotFormDialogProps {
  open: boolean;
  editingRobot: Robot | null;
  form: UseFormReturn<RobotFormValues>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: RobotFormValues) => void;
}

export function RobotFormDialog({open,
  editingRobot,
  form,
  isSaving,
  onClose,
  onSubmit,
}: RobotFormDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {editingRobot ? "Robotni tahrirlash" : "Yangi robot yaratish"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-1">
          <Label>{t("nomi")}</Label>
            <Input {...form.register("name")} placeholder={t("robotNomi")} data-testid="input-robot-name" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
          <Label>{t("progress.description")}</Label>
            <Textarea
              {...form.register("description")}
              placeholder={t("robotHaqidaQisqachaMalumot")}
              rows={3}
              data-testid="input-robot-description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("obyektTuri")}</Label>
              <Controller control={form.control} name="entityType" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-entity-type" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">{t("lidlar")}</SelectItem>
                    <SelectItem value="deals">{t("bitimlar")}</SelectItem>
                    <SelectItem value="contacts">{t("kontaktlar")}</SelectItem>
                    <SelectItem value="companies">{t("kompaniyalar")}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
          <Label>{t("triggerTuri")}</Label>
              <Controller control={form.control} name="triggerType" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-trigger-type" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          {form.watch("triggerType") === "TIME_ELAPSED" && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label>{t("vaqtSoatda")}</Label>
              <Input
                type="number"
                value={(form.watch("triggerConditions")?.hours as number) || 24}
                onChange={(e) => form.setValue("triggerConditions", {
                  ...form.getValues("triggerConditions"),
                  hours: parseInt(e.target.value) || 24,
                })}
                placeholder="24"
                min={1}
                data-testid="input-time-elapsed-hours"
              />
              <p className="text-xs text-muted-foreground">{t("nechaSoatFaoliyatsizlikdanKeyinIshga")}</p>
            </div>
          )}

          {form.watch("triggerType") === "FIELD_CHANGED" && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label>{t("maydonNomi")}</Label>
              <Input
                value={(form.watch("triggerConditions")?.fieldName as string) || ""}
                onChange={(e) => form.setValue("triggerConditions", {
                  ...form.getValues("triggerConditions"),
                  fieldName: e.target.value,
                })}
                placeholder={t('statusTitleBudget')}
                data-testid="input-field-name"
              />
            </div>
          )}

          <div className="space-y-1">
          <Label>{t("harakatTuri")}</Label>
            <Controller control={form.control} name="actionType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="select-action-type" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          {form.watch("actionType") === "SEND_NOTIFICATION" && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label>{t("xabarMatni")}</Label>
              <Textarea
                value={(form.watch("actionConfig")?.message as string) || ""}
                onChange={(e) => form.setValue("actionConfig", {
                  ...form.getValues("actionConfig"),
                  message: e.target.value,
                })}
                placeholder={t("xabarMatni1")}
                rows={2}
                data-testid="input-notification-message"
              />
            </div>
          )}

          {form.watch("actionType") === "CREATE_TASK" && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
          <Label>{t("vazifaSarlavhasi")}</Label>
                <Input
                  value={(form.watch("actionConfig")?.taskTitle as string) || ""}
                  onChange={(e) => form.setValue("actionConfig", {
                    ...form.getValues("actionConfig"),
                    taskTitle: e.target.value,
                  })}
                  placeholder={t("vazifaSarlavhasi")}
                  data-testid="input-task-title"
                />
              </div>
              <div className="space-y-1">
          <Label>{t("vazifaTavsifi")}</Label>
                <Textarea
                  value={(form.watch("actionConfig")?.taskDescription as string) || ""}
                  onChange={(e) => form.setValue("actionConfig", {
                    ...form.getValues("actionConfig"),
                    taskDescription: e.target.value,
                  })}
                  placeholder={t("vazifaTavsifi")}
                  rows={2}
                  data-testid="input-task-description"
                />
              </div>
            </div>
          )}

          {form.watch("actionType") === "CHANGE_STAGE" && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label>{t("yangiBosqichId")}</Label>
              <Input
                value={(form.watch("actionConfig")?.newStageId as string) || ""}
                onChange={(e) => form.setValue("actionConfig", {
                  ...form.getValues("actionConfig"),
                  newStageId: e.target.value,
                })}
                placeholder={t('newInProgressC0')}
                data-testid="input-new-stage"
              />
            </div>
          )}

          {form.watch("actionType") === "SEND_EMAIL" && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
          <Label>{t('emailMavzusi')}</Label>
                <Input
                  value={(form.watch("actionConfig")?.emailSubject as string) || ""}
                  onChange={(e) => form.setValue("actionConfig", {
                    ...form.getValues("actionConfig"),
                    emailSubject: e.target.value,
                  })}
                  placeholder={t('emailMavzusi')}
                  data-testid="input-email-subject"
                />
              </div>
              <div className="space-y-1">
          <Label>{t('emailMatni')}</Label>
                <Textarea
                  value={(form.watch("actionConfig")?.emailBody as string) || ""}
                  onChange={(e) => form.setValue("actionConfig", {
                    ...form.getValues("actionConfig"),
                    emailBody: e.target.value,
                  })}
                  placeholder={t('emailMatni')}
                  rows={3}
                  data-testid="input-email-body"
                />
              </div>
            </div>
          )}

          {form.watch("actionType") === "SEND_TELEGRAM" && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label>{t("telegramXabarMatni")}</Label>
              <Textarea
                value={(form.watch("actionConfig")?.telegramMessage as string) || ""}
                onChange={(e) => form.setValue("actionConfig", {
                  ...form.getValues("actionConfig"),
                  telegramMessage: e.target.value,
                })}
                placeholder={t("telegramXabarMatni")}
                rows={2}
                data-testid="input-telegram-message"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label>{t("faolHolat")}</Label>
              <p className="text-xs text-muted-foreground">{t("robotYaratilgandanKeyinIshgaTushadi")}</p>
            </div>
            <Controller control={form.control} name="isActive" render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-robot-active" />
            )} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSaving} data-testid="button-save-robot">
              {isSaving ? (
                <><EPLoader className="mr-2" />{t("saqlanmoqda")}</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />{editingRobot ? "Yangilash" : "Yaratish"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
