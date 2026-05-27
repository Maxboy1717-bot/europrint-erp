/**
 * @module HRVacationSick
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Plus, RefreshCw } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface LeaveRequest {
  id: number | string;
  userId?: number | string;
  employeeId?: number | string;
  employee_id?: number | string;
  employeeName?: string;
  employee_name?: string;
  type?: string;
  leaveType?: string;
  leave_type?: string;
  status?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  reason?: string;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Yillik ta'til",
  sick: "Kasallik",
  business_trip: "Xizmat safari",
  maternity: "Tug'ruq ta'tili",
  unpaid: "Hisobsiz ta'til",
};

const LeaveRequestSchema = z.object({
  type: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(1),
  employeeId: z.string().optional(),
});

export default function HRVacationSick() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const form = useForm({
    resolver: zodResolver(LeaveRequestSchema),
    defaultValues: { type: "annual", startDate: "", endDate: "", reason: "", employeeId: "" },
  });

  const { data: leaveRequests = [], isLoading, refetch } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/hr/leave-requests"],
  });

  const createLeave = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/leave-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leave-requests"] });
      setShowDialog(false);
      form.reset();
      toast({ title: "So'rov yuborildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const pending = (leaveRequests as LeaveRequest[]).filter((r) => r.status === "pending");
  const approved = (leaveRequests as LeaveRequest[]).filter((r) => r.status === "approved");
  const now = new Date();
  const onLeave = (Array.isArray(approved) ? approved : []).filter((r) => r.startDate && r.endDate && new Date(r.startDate) <= now && new Date(r.endDate) >= now);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">{t("hrTatilVaKasallik")}</h1>
          {pending.length > 0 && (
            <EPStatusPill tone="neutral">{pending.length} so'rov kutmoqda</EPStatusPill>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
          </Button>
          <Button size="sm" onClick={() => setShowDialog(true)} data-testid="button-add-vacation">
            <Plus className="h-3.5 w-3.5 mr-1.5" />{t("sorovYuborish1")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { label: "Ta'tilda (hozir)", value: onLeave.length, color: "text-[var(--ep-green)]" },
            { label: "Kutilmoqda", value: pending.length, color: "text-[var(--ep-primary)]" },
            { label: "Tasdiqlangan", value: approved.length, color: "text-[var(--ep-blue)]" },
            { label: "Jami so'rovlar", value: (leaveRequests as LeaveRequest[]).length, color: "text-muted-foreground" },
          ]).map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>{t("xodim1")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("boshlanish")}</TableHead>
                  <TableHead>{t("tugash")}</TableHead>
                  <TableHead>{t("sabab")}</TableHead>
                  <TableHead>{t("holati")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
                ) : (leaveRequests as LeaveRequest[]).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">{t("tatilSorovlariYoq")}</TableCell></TableRow>
                ) : (leaveRequests as LeaveRequest[]).slice(0, 30).map((v) => (
                  <TableRow key={v.id} data-testid={`row-vacation-${v.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{v.employeeName || v.employee_name || v.employeeId || v.employee_id || `#${v.id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{LEAVE_TYPE_LABELS[v.type || v.leaveType || v.leave_type || ""] || v.type || v.leave_type || "—"}</Badge>
                    </TableCell>
                    <TableCell>{(v.startDate || v.start_date) ? new Date((v.startDate || v.start_date)!).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell>{(v.endDate || v.end_date) ? new Date((v.endDate || v.end_date)!).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{v.reason || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === "approved" ? "default" : v.status === "rejected" ? "destructive" : "secondary"}>
                        {v.status === "approved" ? "Tasdiqlangan" : v.status === "rejected" ? "Rad etilgan" : "Kutilmoqda"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("taTilKasallikSoRovi")}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => createLeave.mutate(d))} className="space-y-4 py-2">
            <div className="space-y-1">
          <Label>{t("type")}</Label>
              <Controller control={form.control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-leave-type" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAVE_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
          <Label>{t("boshlanish")}</Label>
                <Input type="date" {...form.register("startDate")} data-testid="input-start-date" />
              </div>
              <div className="space-y-1">
          <Label>{t("tugash")}</Label>
                <Input type="date" {...form.register("endDate")} />
              </div>
            </div>
            <div className="space-y-1">
          <Label>{t("sabab")}</Label>
              <Input {...form.register("reason")} placeholder={t("tatilSababi1")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>{t("Bekor")}</Button>
              <Button type="submit" disabled={createLeave.isPending}>
                {createLeave.isPending ? "Yuborilmoqda..." : "Yuborish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
