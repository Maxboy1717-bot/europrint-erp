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
  title = "O'chirishni tasdiqlaysizmi?",
  description = "Bu amalni qaytarib bo'lmaydi. Ma'lumot butunlay o'chiriladi.",
  onConfirm,
  isPending = false,
  trigger,
  children,
  variant = "icon",
  buttonText = "O'chirish",
}: DeleteConfirmDialogProps) {
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
          <AlertDialogTitle data-testid="text-delete-title">{title}</AlertDialogTitle>
          <AlertDialogDescription data-testid="text-delete-description">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-delete-cancel">Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover-elevate"
            data-testid="button-delete-confirm"
          >
            {isPending ? "O'chirilmoqda..." : "Ha, o'chirish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
