/**
 * @module VendorSection
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Plus, Search, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const VendorQualitySchema = z.object({
  supplierName:  z.string().min(1, "Yetkazuvchi nomi majburiy"),
  materialType:  z.string().min(1, "Material turi majburiy"),
  qualityScore:  z.coerce.number().min(0, "Minimum 0").max(100, "Maksimum 100"),
  notes:         z.string().optional(),
});
type VendorQualityData = z.infer<typeof VendorQualitySchema>;
import { format } from "date-fns";
import { QCVendor } from "./types";

export function VendorSection() {
  const { toast } = useToast();
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const { data: vendorList = [], isLoading: vLoad } = useQuery<QCVendor[]>({ queryKey: ["/api/qc/supplier-quality"] });

  const vendorForm = useForm<VendorQualityData>({
    resolver: zodResolver(VendorQualitySchema),
    defaultValues: { supplierName: "", materialType: "", qualityScore: 80, notes: "" },
  });

  const createVendor = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/supplier-quality", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/qc/supplier-quality"] }); setShowVendorDialog(false); toast({ title: "Yetkazuvchi baholandi" }); },
  });

  const scoreColor = (s: number) => s >= 85 ? "text-[var(--ep-green)]" : s >= 70 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Yetkazuvchi Sifat Reytingi</h2>
          <p className="text-sm text-muted-foreground">Materiallar sifati bo'yicha yetkazuvchilar baholash</p>
        </div>
        <Button onClick={() => setShowVendorDialog(true)} data-testid="button-add-vendor">
          <Plus className="h-4 w-4 mr-2" />Baholash Qo'shish
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: "Jami Yetkazuvchilar", value: vendorList.length, icon: Building2, color: "text-[var(--ep-blue)]" },
          { label: "A'lo (≥85)", value: (Array.isArray(vendorList) ? vendorList : []).filter((v: QCVendor) => (v.qualityScore ?? 0) >= 85).length, icon: CheckCircle, color: "text-[var(--ep-green)]" },
          { label: "O'rta (70-84)", value: (Array.isArray(vendorList) ? vendorList : []).filter((v: QCVendor) => (v.qualityScore ?? 0) >= 70 && (v.qualityScore ?? 0) < 85).length, icon: AlertTriangle, color: "text-[var(--ep-yellow)]" },
          { label: "Past (<70)", value: (Array.isArray(vendorList) ? vendorList : []).filter((v: QCVendor) => (v.qualityScore ?? 0) < 70).length, icon: XCircle, color: "text-[var(--ep-red)]" },
        ]).map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Yetkazuvchi qidirish..." className="pl-8" value={searchQ} onChange={e => setSearchQ(e.target.value)} data-testid="input-vendor-search" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Yetkazuvchi</TableHead>
                <TableHead>Material turi</TableHead>
                <TableHead>Sifat bali</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vLoad ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : (Array.isArray(vendorList) ? vendorList : []).filter((v: QCVendor) => !searchQ || v.supplierName?.toLowerCase().includes(searchQ.toLowerCase())).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">Yetkazuvchi ma'lumotlari topilmadi</TableCell></TableRow>
              ) : (Array.isArray(vendorList) ? vendorList : []).filter((v: QCVendor) => !searchQ || v.supplierName?.toLowerCase().includes(searchQ.toLowerCase())).map((v: QCVendor) => (
                <TableRow key={v.id} data-testid={`row-vendor-${v.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{v.supplierName}</TableCell>
                  <TableCell>{v.materialType}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${scoreColor(v.qualityScore ?? 0)}`}>{v.qualityScore ?? 0}/100</span>
                    <div className="w-20 h-1.5 bg-muted rounded mt-1">
                      <div className={`h-1.5 rounded ${(v.qualityScore ?? 0) >= 85 ? 'bg-green-500' : (v.qualityScore ?? 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${v.qualityScore ?? 0}%` }} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(v.qualityScore ?? 0) >= 85 ? "default" : (v.qualityScore ?? 0) >= 70 ? "secondary" : "destructive"}>
                      {(v.qualityScore ?? 0) >= 85 ? "A'lo" : (v.qualityScore ?? 0) >= 70 ? "Qoniqarli" : "Takomillashtirish kerak"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.createdAt ? format(new Date(v.createdAt), "dd.MM.yyyy") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Yetkazuvchi Sifatini Baholash</DialogTitle></DialogHeader>
          <form onSubmit={vendorForm.handleSubmit(d => createVendor.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Yetkazuvchi nomi</Label>
              <Input {...vendorForm.register("supplierName")} placeholder="EuroPrint Paper..." data-testid="input-vendor-name" />
              {vendorForm.formState.errors.supplierName && <p className="text-xs text-destructive">{vendorForm.formState.errors.supplierName.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Material turi</Label>
                <Input {...vendorForm.register("materialType")} placeholder="Kraft, Testliner..." data-testid="input-vendor-material" />
                {vendorForm.formState.errors.materialType && <p className="text-xs text-destructive">{vendorForm.formState.errors.materialType.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Sifat bali (0-100)</Label>
                <Input type="number" {...vendorForm.register("qualityScore")} data-testid="input-vendor-score" />
                {vendorForm.formState.errors.qualityScore && <p className="text-xs text-destructive">{vendorForm.formState.errors.qualityScore.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowVendorDialog(false)}>Bekor</Button>
              <Button type="submit" disabled={createVendor.isPending} data-testid="button-save-vendor">
                {createVendor.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
