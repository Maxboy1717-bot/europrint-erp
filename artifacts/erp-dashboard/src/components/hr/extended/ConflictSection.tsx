import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquareWarning, ShieldAlert, AlertTriangle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { ConflictReport } from "./types";
import { UseMutationResult } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";

interface ConflictSectionProps {
  conflictReports: ConflictReport[];
  conflictLoading: boolean;
  createConflictReport: UseMutationResult<any, any, any>;
}

export function ConflictSection({
  conflictReports,
  conflictLoading,
  createConflictReport,
}: ConflictSectionProps) {
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const conflictForm = useForm({
    defaultValues: { party1: "", party2: "", description: "", severity: "low" }
  });

  const getSeverityLabel = (severity: string) => {
    const map: Record<string, string> = { low: "Past", medium: "O'rta", high: "Yuqori" };
    return map[severity] || severity;
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { open: "Ochiq", investigating: "Ko'rilmoqda", resolved: "Hal etilgan" };
    return map[status] || status;
  };

  const reports = safeArray<ConflictReport>(conflictReports);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Konflikt Boshqaruvi va Intizom</h2>
        <Button onClick={() => setShowConflictDialog(true)} data-testid="button-add-conflict">
          <Plus className="h-4 w-4 mr-2" />Hodisa qayd etish
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {([
          { l: "Ochiq holatlar", v: (Array.isArray(reports) ? reports : []).filter(r => r.status === "open").length, c: "text-red-600", i: AlertTriangle },
          { l: "Ko'rib chiqilmoqda", v: (Array.isArray(reports) ? reports : []).filter(r => r.status === "investigating").length, c: "text-orange-600", i: MessageSquareWarning },
          { l: "Hal etilganlar", v: (Array.isArray(reports) ? reports : []).filter(r => r.status === "resolved").length, c: "text-green-600", i: ShieldAlert },
          { l: "Oylik tahlil", v: "82%", c: "text-primary", i: MessageSquareWarning },
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
        <CardHeader><CardTitle className="text-base">Konflikt va Intizom Hodisalari</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tomonlar</TableHead><TableHead>Tavsif</TableHead>
              <TableHead>Og'irlik</TableHead><TableHead>Sana</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {conflictLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow>
              ) : reports.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Konfliktlar mavjud emas</TableCell></TableRow>
              ) : (Array.isArray(reports) ? reports : []).map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.party1} vs {report.party2}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">{report.description}</TableCell>
                  <TableCell>
                    <Badge variant={report.severity === "high" ? "destructive" : report.severity === "medium" ? "secondary" : "outline"}>
                      {getSeverityLabel(report.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === "resolved" ? "default" : "outline"}>
                      {getStatusLabel(report.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konflikt yoki Intizom Buzilishini Qayd Etish</DialogTitle></DialogHeader>
          <form onSubmit={conflictForm.handleSubmit(d => createConflictReport.mutate(d as Record<string, unknown>))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>1-tomon</Label><Input {...conflictForm.register("party1", { required: true })} placeholder="Ismi-sharifi" /></div>
              <div className="space-y-2"><Label>2-tomon</Label><Input {...conflictForm.register("party2", { required: true })} placeholder="Ismi-sharifi" /></div>
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Input {...conflictForm.register("description", { required: true })} placeholder="Nima sodir bo'ldi?" />
            </div>
            <div className="space-y-2">
              <Label>Og'irlik darajasi</Label>
              <Controller control={conflictForm.control} name="severity" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Past</SelectItem>
                    <SelectItem value="medium">O'rta</SelectItem>
                    <SelectItem value="high">Yuqori (Kritik)</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowConflictDialog(false)}>Bekor qilish</Button>
              <Button type="submit" disabled={createConflictReport.isPending}>Saqlash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
