/**
 * @module delete-confirm-dialog
 * @description React UI component.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface DeleteConfirmDialogProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  isPending?: boolean;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "icon" | "button" | "custom";
  buttonText?: string;
}

export function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
  isPending = false,
  trigger,
  children,
  variant = "icon",
  buttonText,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation("common");
  const resolvedTitle = title ?? t("confirm.delete");
  const resolvedDescription = description ?? t("buAmalniQaytaribBolmaydiMalumot");
  const resolvedButtonText = buttonText ?? t("delete");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children || trigger || (
          variant === "icon" ? (
            <Button size="icon" variant="ghost" data-testid="button-delete-trigger">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : (
            <Button variant="destructive" data-testid="button-delete-trigger">
              <Trash2 className="h-4 w-4 mr-2" />
              {buttonText}
            </Button>
          )
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="text-delete-title">{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription data-testid="text-delete-description">
            {resolvedDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-delete-cancel">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover-elevate"
            data-testid="button-delete-confirm"
          >
            {isPending ? t("ochirilmoqda") : resolvedButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
