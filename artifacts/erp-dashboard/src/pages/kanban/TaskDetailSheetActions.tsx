/**
 * @module TaskDetailSheetActions
 * @description Bottom action bar and task-completion dialog for TaskDetailSheet.
 * Contains: ActionBtn primitive, the 5-button bar (timer / accept / complete /
 * comment shortcut / file shortcut / delete), and the "Vazifani yakunlash" dialog.
 */

import React from "react";
import { Button }   from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Trash2, Play, Square,
  Check, CheckCheck,
  Paperclip, MessageSquare,
} from "lucide-react";
import { TONE, type ActionBtnProps, type TaskDetailSheetActionsProps } from "./TaskDetailSheetTypes";
import { useTranslation } from '@/lib/i18n';

// ── ActionBtn ─────────────────────────────────────────────────────────────────

/** Small icon+label button used in the action bar. */
export function ActionBtn({
  onClick,
  disabled,
  tone,
  icon,
  label,
  "data-testid": testId,
}: ActionBtnProps) {
  const { t } = useTranslation("common");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${TONE[tone] ?? TONE.slate}`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── TaskDetailSheetActions ────────────────────────────────────────────────────

/**
 * Renders the sticky bottom action bar plus the completion confirmation dialog.
 * All mutation callbacks are injected from the orchestrator (TaskDetailSheet).
 */
export function TaskDetailSheetActions({
  isTracking,
  isCompleted,
  isAccepted,
  onStartTime,
  onStopTime,
  isTimerPending,
  onAccept,
  isAcceptPending,
  onOpenComplete,
  isCompletePending,
  onTabChange,
  onDelete,
  showCompleteDialog,
  onCompleteDialogChange,
  completionReport,
  onCompletionReportChange,
  onConfirmComplete,
  t,
}: TaskDetailSheetActionsProps) {
  return (
    <>
      {/* ── 5-button action bar ──────────────────────────────────────────── */}
      <div className="px-3.5 py-2.5 border-t bg-muted/20 flex gap-2 items-center flex-shrink-0">
        {/* Timer toggle */}
        <ActionBtn
          onClick={() => (isTracking ? onStopTime() : onStartTime())}
          disabled={isTimerPending}
          tone={isTracking ? "destructive" : "emerald"}
          icon={isTracking ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          label={isTracking ? "To'xtatish" : "Boshlash"}
          data-testid="button-start-task"
        />

        {/* Accept / Complete */}
        {!isCompleted && (
          !isAccepted ? (
            <ActionBtn
              onClick={onAccept}
              disabled={isAcceptPending}
              tone="blue"
              icon={<Check className="h-3.5 w-3.5" />}
              label={t("receive")}
              data-testid="button-accept-task"
            />
          ) : (
            <ActionBtn
              onClick={onOpenComplete}
              disabled={isCompletePending}
              tone="violet"
              icon={<CheckCheck className="h-3.5 w-3.5" />}
              label={t("finishBtn")}
              data-testid="button-complete-task"
            />
          )
        )}

        {/* Comment shortcut */}
        <ActionBtn
          onClick={() => onTabChange("chat")}
          tone="slate"
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label={t("Izoh")}
        />

        {/* File shortcut */}
        <ActionBtn
          onClick={() => onTabChange("files")}
          tone="slate"
          icon={<Paperclip className="h-3.5 w-3.5" />}
          label={t("fayl")}
        />

        <div className="flex-1" />

        {/* Delete */}
        <DeleteConfirmDialog
          title={t("vazifaniOchirish")}
          description={t("buAmalniQaytaribBolmaydiVazifa")}
          onConfirm={onDelete}
          isPending={false}
        >
          <button
            data-testid="button-delete-task"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[var(--ep-red)] bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.actions.delete}
          </button>
        </DeleteConfirmDialog>
      </div>

      {/* ── Complete dialog ──────────────────────────────────────────────── */}
      <Dialog open={showCompleteDialog} onOpenChange={onCompleteDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("vazifaniYakunlash")}</DialogTitle>
            <DialogDescription>
              {t("vazifaBajarilishiHaqidaQisqachaHisobot")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={completionReport}
              onChange={e => onCompletionReportChange(e.target.value)}
              placeholder={t("bajarilganIshlarHaqida")}
              className="min-h-[120px]"
              data-testid="input-completion-report"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onCompleteDialogChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={onConfirmComplete}
              disabled={isCompletePending}
              className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"
              data-testid="button-confirm-complete"
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              {t("finishBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
