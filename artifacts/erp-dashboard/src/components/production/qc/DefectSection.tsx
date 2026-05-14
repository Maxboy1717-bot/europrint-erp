/**
 * @module DefectSection
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
import { AlertTriangle, Plus, Search } from "lucide-react";

const DefectSchema = z.object({
  materialName: z.string().min(1, "Material nomi majburiy"),
  quantity:     z.coerce.number().min(0.001, "Miqdor musbat bo'lishi kerak"),
  reason:       z.string().min(1, "Sabab majburiy"),
  stage:        z.enum(["incoming", "production", "finished"]),
  operatorName: z.string().min(1, "Operator majburiy"),
});
type DefectData = z.infer<typeof DefectSchema>;
import { QCBrak } from "./types";

import { useTranslation } from '@/lib/i18n';
export function DefectSection() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [showDefectDialog, setShowDefectDialog] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const { data: brakList = [], isLoading: bLoad } = useQuery<QCBrak[]>({ queryKey: ["/api/qc/braks"] });
  const { data: brakStats } = useQuery<Record<string, unknown>>({ queryKey: ["/api/qc/braks/stats"] });

  const defectForm = useForm<DefectData>({
    resolver: zodResolver(DefectSchema),
    defaultValues: { materialName: "", quantity: 0, reason: "", stage: "incoming", operatorName: "" },
  });

  const createDefect = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/braks", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/qc/braks"] }); setShowDefectDialog(false); toast({ title: "Brak qayd etildi" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Brak Ma'lumotlari</h2>
          <p className="text-sm text-muted-foreground">Ishlab chiqarish va xomashyo nuqsonlari hisobi</p>
        </div>
        <Button onClick={() => setShowDefectDialog(true)} data-testid="button-add-defect">
          <Plus className="h-4 w-4 mr-2" />Brak Qayd Etish
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: "Bugungi Brak", value: (brakStats?.todayCount as number) ?? 0, color: "text-[var(--ep-red)]" },
          { label: "Jami Miqdor", value: ((brakStats?.totalQty as number) ?? 0) + " kg", color: "text-[var(--ep-yellow)]" },
          { label: "Asosiy Sabab", value: (brakStats?.topReason as string) ?? "—", color: "text-[var(--ep-blue)]" },
          { label: "Sifat Ko'rsatkichi", value: ((brakStats?.qualityRate as number) ?? 98) + "%", color: "text-[var(--ep-green)]" },
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
            <Input placeholder="Material yoki sabab bo'yicha qidirish..." className="pl-8" value={searchQ} onChange={e => setSearchQ(e.target.value)} data-testid="input-defect-search" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t('Material')}</TableHead>
              <TableHead>Miqdor</TableHead>
              <TableHead>Sabab</TableHead>
              <TableHead>Bosqich</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Sana</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {bLoad ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Yuklanmoqda...</TableCell></TableRow>
              ) : brakList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />Braklar topilmadi
                </TableCell></TableRow>
              ) : (Array.isArray(brakList) ? brakList : []).filter((b: QCBrak) => !searchQ || b.materialName?.toLowerCase().includes(searchQ.toLowerCase()) || b.reason?.toLowerCase().includes(searchQ.toLowerCase())).map((b: QCBrak) => (
                <TableRow key={b.id} data-testid={`row-defect-${b.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{b.materialName}</TableCell>
                  <TableCell>{b.quantity} kg</TableCell>
                  <TableCell>{b.reason}</TableCell>
                  <TableCell><Badge variant="outline">{b.stage}</Badge></TableCell>
                  <TableCell>{b.operatorName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      <Dialog open={showDefectDialog} onOpenChange={setShowDefectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Brak Qayd Etish</DialogTitle></DialogHeader>
          <form onSubmit={defectForm.handleSubmit(d => createDefect.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('materialMahsulot')}</Label>
              <Input {...defectForm.register("materialName")} placeholder="Gofrokarton T-24..." data-testid="input-defect-material" />
              {defectForm.formState.errors.materialName && <p className="text-xs text-destructive">{defectForm.formState.errors.materialName.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Miqdor (kg)</Label>
                <Input type="number" {...defectForm.register("quantity")} data-testid="input-defect-qty" />
                {defectForm.formState.errors.quantity && <p className="text-xs text-destructive">{defectForm.formState.errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Bosqich</Label>
                <Select onValueChange={v => defectForm.setValue("stage", v)} defaultValue="incoming">
                  <SelectTrigger data-testid="select-defect-stage" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Kiruvchi nazorat</SelectItem>
                    <SelectItem value="production">Ishlab chiqarish</SelectItem>
                    <SelectItem value="finished">Tayyor mahsulot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sabab</Label>
              <Input {...defectForm.register("reason")} placeholder="Yirtilish, rang nomutanosibligi..." data-testid="input-defect-reason" />
              {defectForm.formState.errors.reason && <p className="text-xs text-destructive">{defectForm.formState.errors.reason.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Mas'ul operator</Label>
              <Input {...defectForm.register("operatorName")} placeholder="Ism sharif" data-testid="input-defect-operator" />
              {defectForm.formState.errors.operatorName && <p className="text-xs text-destructive">{defectForm.formState.errors.operatorName.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDefectDialog(false)}>Bekor</Button>
              <Button type="submit" disabled={createDefect.isPending} data-testid="button-save-defect">
                {createDefect.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
