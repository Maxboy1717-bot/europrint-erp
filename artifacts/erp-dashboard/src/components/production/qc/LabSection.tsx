import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { FileCheck, RefreshCw, Plus } from "lucide-react";
import { QCLabTest } from "./types";

interface LabSectionProps {
  activeTab: string;
}

export function LabSection({ activeTab }: LabSectionProps) {
  const { toast } = useToast();
  const [showLabDialog, setShowLabDialog] = useState(false);

  const { data: labTests = [], isLoading: labLoading, refetch: refetchLab } = useQuery<QCLabTest[]>({
    queryKey: ["/api/qc/lab-tests"],
    enabled: activeTab === "lab",
  });

  const labForm = useForm({
    defaultValues: { materialName: "", lotNumber: "", grammatura: "", qalinlik: "", bosim: "", namlik: "", operatorName: "", result: "pass" }
  });

  const createLabTest = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/lab-tests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/lab-tests"] });
      setShowLabDialog(false);
      labForm.reset();
      toast({ title: "Laboratoriya natijasi saqlandi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Laboratoriya Testlari</h2>
          <p className="text-sm text-muted-foreground">Qog'oz va gofrokarton parametrlari o'lchovi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchLab()} data-testid="button-refresh-lab">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
          </Button>
          <Button onClick={() => setShowLabDialog(true)} data-testid="button-add-lab-test">
            <Plus className="h-4 w-4 mr-2" />Test Qo'shish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {([
          { label: "Jami Testlar", value: labTests.length, color: "text-primary" },
          { label: "O'tdi", value: (Array.isArray(labTests) ? labTests : []).filter((t: QCLabTest) => t.result === "pass").length, color: "text-green-600" },
          { label: "Rad etildi", value: (Array.isArray(labTests) ? labTests : []).filter((t: QCLabTest) => t.result === "fail").length, color: "text-red-600" },
          { label: "Shartli", value: (Array.isArray(labTests) ? labTests : []).filter((t: QCLabTest) => t.result === "conditional").length, color: "text-yellow-600" },
        ]).map(s => (
          <Card key={s.label}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Qog'oz Sifat Parametrlari Normalari</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Parametr</TableHead>
              <TableHead>Birlik</TableHead>
              <TableHead>Min norma</TableHead>
              <TableHead>Max norma</TableHead>
              <TableHead>Standart</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {([
                { param: "Grammatura", unit: "g/m²", min: "100", max: "500", std: "ISO 536" },
                { param: "Qalinlik", unit: "mm", min: "0.1", max: "5.0", std: "ISO 534" },
                { param: "Yorilish bosimi", unit: "kPa", min: "200", max: "—", std: "ISO 2759" },
                { param: "Namlik", unit: "%", min: "5", max: "12", std: "ISO 287" },
                { param: "Ko'chish qarshiligi (ECT)", unit: "kN/m", min: "4.0", max: "—", std: "ISO 3037" },
              ]).map((r, i) => (
                <TableRow key={`k-${i}`} data-testid={`row-param-${i}`}>
                  <TableCell className="font-medium">{r.param}</TableCell>
                  <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                  <TableCell>{r.min}</TableCell>
                  <TableCell>{r.max}</TableCell>
                  <TableCell><Badge variant="outline">{r.std}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Test Jurnali</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Sana</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Grammatura</TableHead>
              <TableHead>Qalinlik</TableHead>
              <TableHead>Bosim</TableHead>
              <TableHead>Namlik</TableHead>
              <TableHead>Natija</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {labLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : labTests.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />Laboratoriya testlari yo'q
                </TableCell></TableRow>
              ) : labTests.slice(0, 20).map((t: QCLabTest) => (
                <TableRow key={t.id} data-testid={`row-lab-${t.id}`}>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.testDate ? new Date(t.testDate).toLocaleDateString("uz-UZ") : t.createdAt ? new Date(t.createdAt).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell className="font-medium">{t.materialName || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{t.lotNumber || "—"}</TableCell>
                  <TableCell>{t.grammatura ? `${t.grammatura} g/m²` : "—"}</TableCell>
                  <TableCell>{t.qalinlik ? `${t.qalinlik} mm` : "—"}</TableCell>
                  <TableCell>{t.bosim ? `${t.bosim} kPa` : "—"}</TableCell>
                  <TableCell>{t.namlik ? `${t.namlik}%` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={t.result === "pass" ? "default" : t.result === "fail" ? "destructive" : "secondary"}>
                      {t.result === "pass" ? "O'tdi" : t.result === "fail" ? "Rad" : "Shartli"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showLabDialog} onOpenChange={setShowLabDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yangi Lab Testi</DialogTitle></DialogHeader>
          <form onSubmit={labForm.handleSubmit((d) => createLabTest.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Material nomi</Label>
                <Input {...labForm.register("materialName")} placeholder="Kraft qog'oz..." data-testid="input-lab-material" />
              </div>
              <div className="space-y-1.5">
                <Label>Lot raqami</Label>
                <Input {...labForm.register("lotNumber")} placeholder="LOT-2024-001" data-testid="input-lab-lot" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Grammatura (g/m²)</Label>
                <Input type="number" {...labForm.register("grammatura")} placeholder="300" data-testid="input-lab-grammatura" />
              </div>
              <div className="space-y-1.5">
                <Label>Qalinlik (mm)</Label>
                <Input type="number" step="0.01" {...labForm.register("qalinlik")} placeholder="2.50" data-testid="input-lab-qalinlik" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bosim (kPa)</Label>
                <Input type="number" {...labForm.register("bosim")} placeholder="350" data-testid="input-lab-bosim" />
              </div>
              <div className="space-y-1.5">
                <Label>Namlik (%)</Label>
                <Input type="number" step="0.1" {...labForm.register("namlik")} placeholder="8.5" data-testid="input-lab-namlik" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operator</Label>
                <Input {...labForm.register("operatorName")} placeholder="F.I.O" data-testid="input-lab-operator" />
              </div>
              <div className="space-y-1.5">
                <Label>Natija</Label>
                <Select onValueChange={(v) => labForm.setValue("result", v)} defaultValue="pass">
                  <SelectTrigger data-testid="select-lab-result">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">O'tdi</SelectItem>
                    <SelectItem value="fail">Rad etildi</SelectItem>
                    <SelectItem value="conditional">Shartli qabul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLabDialog(false)}>Bekor</Button>
              <Button type="submit" disabled={createLabTest.isPending} data-testid="button-save-lab-test">
                {createLabTest.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
