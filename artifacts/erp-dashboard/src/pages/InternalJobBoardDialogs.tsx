/**
 * @module InternalJobBoardDialogs
 * @description Apply dialog for InternalJobBoard.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Send, UserCheck } from "lucide-react";
import { InternalVacancy } from "./InternalJobBoardTypes";
import { useTranslation } from '@/lib/i18n';

interface ApplyDialogProps {
  vacancy: InternalVacancy | null;
  open: boolean;
  onClose: () => void;
}

export function ApplyDialog({ vacancy, open, onClose }: ApplyDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [coverNote, setCoverNote] = useState("");

  const applyMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/recruitment/internal-apply/${vacancy?.id}`, {
        cover_note: coverNote,
      }),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) {
        toast({ title: "Xatolik", description: String(data.error), variant: "destructive" });
        return;
      }
      toast({
        title: "Ariza yuborildi!",
        description: `${vacancy?.title} bo'yicha arizangiz HR manegerga tushdi.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/internal-board"] });
      setCoverNote("");
      onClose();
    },
    onError: (err: Error) => {
      const msg = err?.message ?? "Noma'lum xatolik";
      toast({ title: "Xatolik", description: msg, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Ichki ariza — {vacancy?.title}
          </DialogTitle>
        </DialogHeader>

        {vacancy && (
          <div className="py-2 space-y-4">
            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{vacancy.title}</p>
              {vacancy.department_name && (
                <p className="text-xs text-muted-foreground">{vacancy.department_name}</p>
              )}
              {vacancy.salary_min && (
                <p className="text-xs text-[var(--ep-green)]">
                  {Number(vacancy.salary_min).toLocaleString()} so'm dan
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm mb-1 block">Motivatsion xat (ixtiyoriy)</Label>
              <Textarea
                value={coverNote}
                onChange={e => setCoverNote(e.target.value)}
                placeholder={t("negaUshbuLavozimSizUchun")}
                rows={4}
                className="text-sm"
                data-testid="textarea-cover-note"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-[var(--ep-blue)]">
              <p className="font-medium mb-1">{t("muhimEslatma")}</p>
              <p>
                Arizangiz HR menejeriga tushadi va standart tanlov bosqichlari bo'yicha ko'rib chiqiladi.
                Natija haqida Telegram orqali xabar olasiz.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            data-testid="button-submit-apply"
          >
            <Send className="w-4 h-4 mr-1" />
            {applyMutation.isPending ? "Yuborilmoqda..." : "Ariza yuborish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
