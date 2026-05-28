/**
 * @module HRCareerPathDialogs
 * @description Dialog components for HRCareerPath page.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';

export function NewPlanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employeeName: "", currentPosition: "", targetPosition: "", targetDate: "", mentorName: "", notes: "",
  });

  const create = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/succession/career-plans", {
        employee_name: form.employeeName,
        current_position_title: form.currentPosition,
        target_position_title: form.targetPosition,
        target_date: form.targetDate || null,
        mentor_name: form.mentorName || null,
        notes: form.notes || null,
        status: "active",
        progress_percent: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/succession/career-plans"] });
      toast({ title: "Yangi kasbiy reja yaratildi" });
      setForm({ employeeName: "", currentPosition: "", targetPosition: "", targetDate: "", mentorName: "", notes: "" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiKasbiyRivojlanishRejasi")}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label>{t("xodimIsmi1")}</Label>
            <Input value={form.employeeName} onChange={e => f("employeeName", e.target.value)} placeholder={t("toliqIsmi")} className="mt-1" />
          </div>
          <div>
            <Label>{t("joriyLavozim")}</Label>
            <Input value={form.currentPosition} onChange={e => f("currentPosition", e.target.value)} placeholder={t("hozirgiLavozim")} className="mt-1" />
          </div>
          <div>
            <Label>{t("maqsadLavozim")}</Label>
            <Input value={form.targetPosition} onChange={e => f("targetPosition", e.target.value)} placeholder={t("erishmochiBolganLavozim")} className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("muddat")}</Label>
              <Input type="date" value={form.targetDate} onChange={e => f("targetDate", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t("mentor")}</Label>
              <Input value={form.mentorName} onChange={e => f("mentorName", e.target.value)} placeholder={t("mentorIsmi")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>{t("Izoh")}</Label>
            <Input value={form.notes} onChange={e => f("notes", e.target.value)} placeholder={t("qoshimchaMalumot1")} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.employeeName || !form.targetPosition || create.isPending}
          >
            {create.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
