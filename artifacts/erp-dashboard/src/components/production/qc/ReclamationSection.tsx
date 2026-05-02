import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { FileText, Plus, Search } from "lucide-react";
import { QCReclamation } from "./types";

export function ReclamationSection() {
  const { toast } = useToast();
  const [showRecDialog, setShowRecDialog] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const { data: recList = [], isLoading: rLoad } = useQuery<QCReclamation[]>({ queryKey: ["/api/qc/reclamations"] });
  const { data: recStats } = useQuery<Record<string, unknown>>({ queryKey: ["/api/qc/reclamations/stats"] });

  const recForm = useForm({ defaultValues: { clientName: "", claimDate: new Date().toISOString().split("T")[0], issueType: "other", description: "", deadlineDays: 5 } });

  const createRec = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/reclamations", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/qc/reclamations"] }); setShowRecDialog(false); toast({ title: "Reklamatsiya yaratildi" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mijoz Reklamatsiyalari</h2>
          <p className="text-sm text-muted-foreground">Mijozlardan kelgan shikoyatlarni boshqarish</p>
        </div>
        <Button onClick={() => setShowRecDialog(true)} data-testid="button-add-complaint">
          <Plus className="h-4 w-4 mr-2" />Reklamatsiya Yaratish
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {([
          { label: "Jami shikoyatlar", value: (recStats?.totalCount as number) ?? 0, color: "text-red-600" },
          { label: "Ochiq (Active)", value: (recStats?.activeCount as number) ?? 0, color: "text-amber-600" },
          { label: "O'rtacha vaqt", value: ((recStats?.avgResolutionDays as number) ?? 0) + " kun", color: "text-blue-600" },
          { label: "Qoniqish darajasi", value: ((recStats?.satisfactionRate as number) ?? 95) + "%", color: "text-green-600" },
        ]).map(s => (
          <Card key={s.label}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Mijoz yoki muammo bo'yicha qidirish..." className="pl-8" value={searchQ} onChange={e => setSearchQ(e.target.value)} data-testid="input-complaint-search" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mijoz</TableHead>
              <TableHead>Muammo turi</TableHead>
              <TableHead>Daraja</TableHead>
              <TableHead>Holati</TableHead>
              <TableHead>Muddat</TableHead>
              <TableHead>Sana</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rLoad ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Yuklanmoqda...</TableCell></TableRow>
              ) : recList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />Reklamatsiyalar topilmadi
                </TableCell></TableRow>
              ) : (Array.isArray(recList) ? recList : []).filter((r: QCReclamation) => !searchQ || r.clientName?.toLowerCase().includes(searchQ.toLowerCase()) || r.issue?.toLowerCase().includes(searchQ.toLowerCase())).map((r: QCReclamation) => (
                <TableRow key={r.id} data-testid={`row-complaint-${r.id}`}>
                  <TableCell className="font-medium">{r.clientName}</TableCell>
                  <TableCell>{r.issue}</TableCell>
                  <TableCell><Badge variant={r.priority === "high" ? "destructive" : "secondary"}>{r.priority}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                  <TableCell>{r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showRecDialog} onOpenChange={setShowRecDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yangi Reklamatsiya</DialogTitle></DialogHeader>
          <form onSubmit={recForm.handleSubmit(d => createRec.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mijoz nomi</Label>
              <Input {...recForm.register("clientName")} placeholder="MChJ EuroInvest..." data-testid="input-complaint-client" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Muammo turi</Label>
                <Select onValueChange={v => recForm.setValue("issueType", v)} defaultValue="other">
                  <SelectTrigger data-testid="select-complaint-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">Sifat nuqsoni</SelectItem>
                    <SelectItem value="quantity">Kamomad</SelectItem>
                    <SelectItem value="delivery">Yetkazib berish kechikishi</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Muddat (kunlarda)</Label>
                <Input type="number" {...recForm.register("deadlineDays")} data-testid="input-complaint-deadline" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Batafsil tavsifi</Label>
              <Textarea {...recForm.register("description")} placeholder="Muammo tafsilotlarini yozing..." data-testid="input-complaint-desc" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRecDialog(false)}>Bekor</Button>
              <Button type="submit" disabled={createRec.isPending} data-testid="button-save-complaint">
                {createRec.isPending ? "Yuborilmoqda..." : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
