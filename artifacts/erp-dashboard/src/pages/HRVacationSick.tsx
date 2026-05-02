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
import { Calendar, Plus, RefreshCw } from "lucide-react";

interface LeaveRequest {
  id: number | string;
  userId?: number | string;
  employeeId?: number | string;
  type?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Yillik ta'til",
  sick: "Kasallik",
  business_trip: "Xizmat safari",
  maternity: "Tug'ruq ta'tili",
  unpaid: "Hisobsiz ta'til",
};

export default function HRVacationSick() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const form = useForm({
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
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h1 className="font-semibold text-base">HR — Ta'til va Kasallik</h1>
          {pending.length > 0 && (
            <Badge variant="secondary">{pending.length} so'rov kutmoqda</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
          </Button>
          <Button size="sm" onClick={() => setShowDialog(true)} data-testid="button-add-vacation">
            <Plus className="h-3.5 w-3.5 mr-1.5" />So'rov Yuborish
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {([
            { label: "Ta'tilda (hozir)", value: onLeave.length, color: "text-green-600" },
            { label: "Kutilmoqda", value: pending.length, color: "text-orange-600" },
            { label: "Tasdiqlangan", value: approved.length, color: "text-blue-600" },
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Boshlanish</TableHead>
                  <TableHead>Tugash</TableHead>
                  <TableHead>Sabab</TableHead>
                  <TableHead>Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                ) : (leaveRequests as LeaveRequest[]).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Ta'til so'rovlari yo'q</TableCell></TableRow>
                ) : (leaveRequests as LeaveRequest[]).slice(0, 30).map((v) => (
                  <TableRow key={v.id} data-testid={`row-vacation-${v.id}`}>
                    <TableCell className="font-medium">{v.userId || v.employeeId || `#${v.id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{LEAVE_TYPE_LABELS[v.type || v.leaveType || ""] || v.type || "—"}</Badge>
                    </TableCell>
                    <TableCell>{v.startDate ? new Date(v.startDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell>{v.endDate ? new Date(v.endDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{v.reason || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === "approved" ? "default" : v.status === "rejected" ? "destructive" : "secondary"}>
                        {v.status === "approved" ? "Tasdiqlangan" : v.status === "rejected" ? "Rad etilgan" : "Kutilmoqda"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ta'til / Kasallik So'rovi</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => createLeave.mutate(d))} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Turi</Label>
              <Controller control={form.control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-leave-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAVE_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Boshlanish</Label>
                <Input type="date" {...form.register("startDate")} data-testid="input-start-date" />
              </div>
              <div className="space-y-2">
                <Label>Tugash</Label>
                <Input type="date" {...form.register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sabab</Label>
              <Input {...form.register("reason")} placeholder="Ta'til sababi..." />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Bekor</Button>
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
