/**
 * @module HRCareerPathDialogs
 * @description Dialog components for HRCareerPath page.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface EmployeeOption { id: string | number; fullName: string; }
interface PositionOption { id: string | number; name: string; }

// HR Nazorat fix (2026-07-13): this dialog used to POST free-text
// { employee_name, current_position_title, target_position_title, ... } to
// /api/succession/career-plans. That endpoint's candidate_id column is NOT NULL — a
// free-text-only submission has no real employee id, so the backend always rejected it
// with 400 ("candidate_id / userId talab qilinadi", see succession-compat.service.ts
// createCareerPlan, fixed 2026-07-13 for the sibling Vorislik Rejalari page). Existing
// rows also rendered "—" for name/position because there was no real employee/position
// link to join against.
//
// Fix: select a REAL employee (-> userId) and REAL target position (-> targetPositionId)
// instead of typing free text. The employee's CURRENT position is derived server-side
// from their own employees.position_id (joined as current_position_title in
// getCareerPlans) — no need to ask for it here. mentor/notes stay free text (persisted
// via the development_plan JSON fallback, see succession-compat.service.ts).
export function NewPlanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    userId: "", targetPositionId: "", targetDate: "", mentorName: "", notes: "",
  });

  const { data: employeesData } = useQuery<{ items: EmployeeOption[] }>({
    queryKey: ["/api/hr/employees", { limit: 200 }],
    queryFn: () => apiRequest("GET", "/api/hr/employees?limit=200"),
    enabled: open,
  });
  const employees = Array.isArray(employeesData?.items) ? employeesData.items : [];

  const { data: positionsData } = useQuery<{ data: PositionOption[] }>({
    queryKey: ["/api/hr/positions"],
    queryFn: () => apiRequest("GET", "/api/hr/positions"),
    enabled: open,
  });
  const positions = Array.isArray(positionsData?.data) ? positionsData.data : [];

  const create = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/succession/career-plans", {
        userId: Number(form.userId),
        targetPositionId: Number(form.targetPositionId),
        targetDate: form.targetDate || null,
        mentorName: form.mentorName || null,
        notes: form.notes || null,
        status: "active",
        progress_percent: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/succession/career-plans"] });
      toast({ title: "Yangi kasbiy reja yaratildi" });
      setForm({ userId: "", targetPositionId: "", targetDate: "", mentorName: "", notes: "" });
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
            <Label>{t("xodim1")}</Label>
            <Select value={form.userId} onValueChange={(v) => f("userId", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t("xodimniTanlang")} /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("maqsadLavozim")}</Label>
            <Select value={form.targetPositionId} onValueChange={(v) => f("targetPositionId", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t("erishmochiBolganLavozim")} /></SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={!form.userId || !form.targetPositionId || create.isPending}
          >
            {create.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
