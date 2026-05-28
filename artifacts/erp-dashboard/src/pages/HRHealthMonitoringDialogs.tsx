/**
 * @module HRHealthMonitoringDialogs
 * @description Dialog components for HRHealthMonitoring page.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';

export function NewCheckupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    departmentName: "", checkupDate: "", nextCheckupDate: "",
    totalEmployees: "", checkupType: "annual", notes: "",
  });

  const create = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/hr/health-checkups", {
        ...form,
        totalEmployees: form.totalEmployees ? parseInt(form.totalEmployees) : null,
        examinedCount: 0,
        status: "scheduled",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/health-checkups"] });
      toast({ title: "Yangi ko'rik rejalashtirildi" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiTibbiyKorikRejalashtirish")}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label>{t("bolimNomi1")}</Label>
            <Input value={form.departmentName} onChange={e => f("departmentName", e.target.value)} placeholder={t("bolimNomi")} className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("korikSanasi")}</Label>
              <Input type="date" value={form.checkupDate} onChange={e => f("checkupDate", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t("keyingiKorik")}</Label>
              <Input type="date" value={form.nextCheckupDate} onChange={e => f("nextCheckupDate", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("xodimlarSoni")}</Label>
              <Input type="number" min={1} value={form.totalEmployees} onChange={e => f("totalEmployees", e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label>{t("korikTuri")}</Label>
              <Select value={form.checkupType} onValueChange={v => f("checkupType", v)}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">{t("yearly")}</SelectItem>
                  <SelectItem value="quarterly">{t("choraklik")}</SelectItem>
                  <SelectItem value="special">{t("maxsus")}</SelectItem>
                  <SelectItem value="pre_employment">{t("ishgaKirish")}</SelectItem>
                </SelectContent>
              </Select>
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
            disabled={!form.departmentName || !form.checkupDate || create.isPending}
          >
            {create.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
