/**
 * @module LabSection
 * @description React UI component.
 */

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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileCheck, RefreshCw, Plus } from "lucide-react";

const LabSchema = z.object({
  materialName: z.string().min(1, "Material nomi majburiy"),
  lotNumber:    z.string().optional(),
  grammatura:   z.string().optional(),
  qalinlik:     z.string().optional(),
  bosim:        z.string().optional(),
  namlik:       z.string().optional(),
  operatorName: z.string().min(1, "Operator majburiy"),
  result:       z.enum(["pass", "fail", "conditional"]),
});
type LabData = z.infer<typeof LabSchema>;
import { QCLabTest } from "./types";

import { useTranslation } from '@/lib/i18n';
interface LabSectionProps {
  activeTab: string;
}

export function LabSection({activeTab }: LabSectionProps) {
  const { t } = useTranslation('common');
  const { t: tQc } = useTranslation('qc');
  const { toast } = useToast();
  const [showLabDialog, setShowLabDialog] = useState(false);

  const { data: labTests = [], isLoading: labLoading, refetch: refetchLab } = useQuery<QCLabTest[]>({
    queryKey: ["/api/qc/lab-tests"],
    enabled: activeTab === "lab",
  });

  const labForm = useForm<LabData>({
    resolver: zodResolver(LabSchema),
    defaultValues: { materialName: "", lotNumber: "", grammatura: "", qalinlik: "", bosim: "", namlik: "", operatorName: "", result: "pass" },
  });

  const createLabTest = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/lab-tests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/lab-tests"] });
      setShowLabDialog(false);
      labForm.reset();
      toast({ title: tQc("labResultSaved") });
    },
    onError: () => toast({ title: tQc("errorOccurred"), variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("laboratoriyaTestlari")}</h2>
          <p className="text-sm text-muted-foreground">{t("qogozVaGofrokartonParametrlariOlchovi")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchLab()} data-testid="button-refresh-lab">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
          </Button>
          <Button onClick={() => setShowLabDialog(true)} data-testid="button-add-lab-test">
            <Plus className="h-4 w-4 mr-2" />{t("testQoshish")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: tQc("totalTests"), value: labTests.length, color: "text-primary" },
          { label: tQc("passed"), value: (Array.isArray(labTests) ? labTests : []).filter((t: QCLabTest) => t.result === "pass").length, color: "text-[var(--ep-green)]" },
          { label: tQc("rejected"), value: (Array.isArray(labTests) ? labTests : []).filter((t: QCLabTest) => t.result === "fail").length, color: "text-[var(--ep-red)]" },
          { label: tQc("conditional"), value: (Array.isArray(labTests) ? labTests : []).filter((t: QCLabTest) => t.result === "conditional").length, color: "text-[var(--ep-yellow)]" },
        ]).map(s => (
          <Card key={s.label}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">{t("qogozSifatParametrlariNormalari")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("parametr")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead>{t("minNorma")}</TableHead>
              <TableHead>{t("maxNorma")}</TableHead>
              <TableHead>{t("standart")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {([
                { param: tQc("paramGrammatura"), unit: "g/m²", min: "100", max: "500", std: "ISO 536" },
                { param: tQc("paramThickness"), unit: "mm", min: "0.1", max: "5.0", std: "ISO 534" },
                { param: tQc("paramBurstPressure"), unit: "kPa", min: "200", max: "—", std: "ISO 2759" },
                { param: tQc("paramHumidity"), unit: "%", min: "5", max: "12", std: "ISO 287" },
                { param: tQc("paramEct"), unit: "kN/m", min: "4.0", max: "—", std: "ISO 3037" },
              ]).map((r, i) => (
                <TableRow key={`k-${i}`} data-testid={`row-param-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{r.param}</TableCell>
                  <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                  <TableCell>{r.min}</TableCell>
                  <TableCell>{r.max}</TableCell>
                  <TableCell><Badge variant="outline">{r.std}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">{t("testJurnali")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t('Material')}</TableHead>
              <TableHead>{t("lot")}</TableHead>
              <TableHead>{t("grammatura")}</TableHead>
              <TableHead>{t("qalinlik")}</TableHead>
              <TableHead>{t("bosim")}</TableHead>
              <TableHead>{t("namlik")}</TableHead>
              <TableHead>{t("natija")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {labLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : labTests.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-[13px] text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("laboratoriyaTestlariYoq")}
                </TableCell></TableRow>
              ) : labTests.slice(0, 20).map((t: QCLabTest) => (
                <TableRow key={t.id} data-testid={`row-lab-${t.id}`} className="hover:bg-muted/40 transition-colors">
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
                      {t.result === "pass" ? tQc("passed") : t.result === "fail" ? tQc("rejectedShort") : tQc("conditional")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      <Dialog open={showLabDialog} onOpenChange={setShowLabDialog}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiLabTesti")}</DialogTitle></DialogHeader>
          <form onSubmit={labForm.handleSubmit((d) => createLabTest.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("materialNomi")}</Label>
                <Input {...labForm.register("materialName")} placeholder={t("kraftQogoz")} data-testid="input-lab-material" />
                {labForm.formState.errors.materialName && <p className="text-xs text-destructive">{labForm.formState.errors.materialName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("lotRaqami")}</Label>
                <Input {...labForm.register("lotNumber")} placeholder="LOT-2024-001" data-testid="input-lab-lot" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tQc("paramGrammaturaUnit")}</Label>
                <Input type="number" {...labForm.register("grammatura")} placeholder="300" data-testid="input-lab-grammatura" />
              </div>
              <div className="space-y-1.5">
                <Label>{tQc("paramThicknessUnit")}</Label>
                <Input type="number" step="0.01" {...labForm.register("qalinlik")} placeholder="2.50" data-testid="input-lab-qalinlik" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tQc("paramPressureUnit")}</Label>
                <Input type="number" {...labForm.register("bosim")} placeholder="350" data-testid="input-lab-bosim" />
              </div>
              <div className="space-y-1.5">
                <Label>{tQc("paramHumidityUnit")}</Label>
                <Input type="number" step="0.1" {...labForm.register("namlik")} placeholder="8.5" data-testid="input-lab-namlik" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("Operator")}</Label>
                <Input {...labForm.register("operatorName")} placeholder="F.I.O" data-testid="input-lab-operator" />
                {labForm.formState.errors.operatorName && <p className="text-xs text-destructive">{labForm.formState.errors.operatorName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("natija")}</Label>
                <Select onValueChange={(v) => labForm.setValue("result", v as "conditional" | "pass" | "fail")} defaultValue="pass">
                  <SelectTrigger data-testid="select-lab-result" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">{t("otdi")}</SelectItem>
                    <SelectItem value="fail">{t("radEtildi")}</SelectItem>
                    <SelectItem value="conditional">{t("shartliQabul")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLabDialog(false)}>{t("Bekor")}</Button>
              <Button type="submit" disabled={createLabTest.isPending} data-testid="button-save-lab-test">
                {createLabTest.isPending ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
