/**
 * @module VacationSection
 * @description React UI component.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RefreshCw, Calendar, CheckCircle2, FileText } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HRLeaveRequest, HREmployee } from "./types";

const VacationSchema = z.object({
  type:       z.enum(["annual", "sick", "unpaid"]),
  startDate:  z.string().min(1, "Boshlanish sanasi majburiy"),
  endDate:    z.string().min(1, "Tugash sanasi majburiy"),
  reason:     z.string().optional(),
  employeeId: z.string().optional(),
}).refine(d => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
  message: "Tugash sanasi boshlanish sanasidan kechroq bo'lishi kerak",
  path: ["endDate"],
});
type VacationData = z.infer<typeof VacationSchema>;
import { UseMutationResult } from "@tanstack/react-query";

interface VacationSectionProps {
  leaveRequests: HRLeaveRequest[];
  leaveLoading: boolean;
  refetchLeave: () => void;
  employees: HREmployee[];
  createLeaveRequest: UseMutationResult<any, any, any>;
  pendingLeave: HRLeaveRequest[];
  onLeave: HRLeaveRequest[];
}

export function VacationSection({
  leaveRequests,
  leaveLoading,
  refetchLeave,
  employees,
  createLeaveRequest,
  pendingLeave,
  onLeave,
}: VacationSectionProps) {
  const [showVacDialog, setShowVacDialog] = useState(false);
  const vacForm = useForm<VacationData>({
    resolver: zodResolver(VacationSchema),
    defaultValues: { type: "annual", startDate: "", endDate: "", reason: "", employeeId: "" },
  });

  const getLeaveTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      annual: "Yillik ta'til", sick: "Kasallik", business_trip: "Xizmat safari",
      maternity: "Tug'ruq ta'tili", unpaid: "Hisobsiz ta'til"
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ta'til va Kasallik Nazorati</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchLeave()}>
            <RefreshCw className="h-4 w-4 mr-2" />Yangilash
          </Button>
          <Button onClick={() => setShowVacDialog(true)} data-testid="button-add-vacation">
            <Plus className="h-4 w-4 mr-2" />Ta'til so'rovi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Hozir ta'tilda", v: onLeave.length, c: "text-[var(--ep-blue)]", i: Calendar },
          { l: "Kutilayotgan so'rovlar", v: pendingLeave.length, c: "text-[var(--ep-primary)]", i: CheckCircle2 },
          { l: "Bu oyda yakunlangan", v: "8", c: "text-[var(--ep-green)]", i: FileText },
          { l: "Yillik limit (o'rtacha)", v: "24 kun", c: "text-primary", i: Calendar },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3 flex items-start justify-between">
            <div>
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            </div>
            <s.i className={`h-5 w-5 ${s.c} mt-1`} />
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Oxirgi so'rovlar</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Xodim</TableHead><TableHead>Tur</TableHead>
              <TableHead>Sana</TableHead><TableHead>Kunlar</TableHead>
              <TableHead>Holat</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {leaveLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow>
              ) : leaveRequests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">Ma'lumotlar yo'q</TableCell></TableRow>
              ) : (Array.isArray(leaveRequests) ? leaveRequests : []).map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{req.employeeName || `Xodim #${req.userId}`}</TableCell>
                  <TableCell>{getLeaveTypeLabel(req.type || req.leaveType || "")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {req.startDate ? new Date(req.startDate).toLocaleDateString("uz-UZ") : "—"} - {req.endDate ? new Date(req.endDate).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell>{req.days || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === "approved" ? "default" : req.status === "pending" ? "secondary" : "destructive"}>
                      {req.status === "approved" ? "Tasdiqlangan" : req.status === "pending" ? "Kutilmoqda" : "Rad etilgan"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      <Dialog open={showVacDialog} onOpenChange={setShowVacDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Yangi Ta'til So'rovi</DialogTitle></DialogHeader>
          <form onSubmit={vacForm.handleSubmit(d => createLeaveRequest.mutate(d as Record<string, unknown>))} className="space-y-4">
            <div className="space-y-1">
          <Label>Xodim</Label>
              <Controller control={vacForm.control} name="employeeId" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-vacation-employee" className="h-9"><SelectValue placeholder="Xodimni tanlang" /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(employees) ? employees : []).map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.fullName || e.name || `#${e.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
          <Label>Turi</Label>
              <Controller control={vacForm.control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Yillik ta'til</SelectItem>
                    <SelectItem value="sick">Kasallik</SelectItem>
                    <SelectItem value="unpaid">Ish haqisiz ta'til</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
          <Label>Boshlanish sanasi</Label>
                <Input type="date" {...vacForm.register("startDate")} />
                {vacForm.formState.errors.startDate && <p className="text-xs text-destructive">{vacForm.formState.errors.startDate.message}</p>}
              </div>
              <div className="space-y-1">
          <Label>Tugash sanasi</Label>
                <Input type="date" {...vacForm.register("endDate")} />
                {vacForm.formState.errors.endDate && <p className="text-xs text-destructive">{vacForm.formState.errors.endDate.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
          <Label>Sabab</Label>
              <Input {...vacForm.register("reason")} placeholder="Qisqacha izoh..." />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowVacDialog(false)}>Bekor qilish</Button>
              <Button type="submit" disabled={createLeaveRequest.isPending}>Yuborish</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
