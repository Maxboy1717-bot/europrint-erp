/**
 * @module ReclamationSection
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Search } from "lucide-react";

const ReclamationSchema = z.object({
  clientName:   z.string().min(1, "Mijoz nomi majburiy"),
  claimDate:    z.string().optional(),
  issueType:    z.enum(["quality", "quantity", "delivery", "other"]),
  description:  z.string().min(5, "Batafsil tavsif majburiy (kamida 5 belgi)"),
  deadlineDays: z.coerce.number().min(1, "Muddat kamida 1 kun bo'lishi kerak"),
});
type ReclamationData = z.infer<typeof ReclamationSchema>;
import { QCReclamation } from "./types";
import { useTranslation } from '@/lib/i18n';

export function ReclamationSection() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [showRecDialog, setShowRecDialog] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const { data: recList = [], isLoading: rLoad } = useQuery<QCReclamation[]>({ queryKey: ["/api/qc/reclamations"] });
  const { data: recStats } = useQuery<Record<string, unknown>>({ queryKey: ["/api/qc/reclamations/stats"] });

  const recForm = useForm<ReclamationData>({
    resolver: zodResolver(ReclamationSchema),
    defaultValues: { clientName: "", claimDate: new Date().toISOString().split("T")[0], issueType: "other", description: "", deadlineDays: 5 },
  });

  const createRec = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/reclamations", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/qc/reclamations"] }); setShowRecDialog(false); toast({ title: "Reklamatsiya yaratildi" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("mijozReklamatsiyalari")}</h2>
          <p className="text-sm text-muted-foreground">{t("mijozlardanKelganShikoyatlarniBoshqarish")}</p>
        </div>
        <Button onClick={() => setShowRecDialog(true)} data-testid="button-add-complaint">
          <Plus className="h-4 w-4 mr-2" />{t("reklamatsiyaYaratish")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: "Jami shikoyatlar", value: (recStats?.totalCount as number) ?? 0, color: "text-[var(--ep-red)]" },
          { label: "Ochiq (Active)", value: (recStats?.activeCount as number) ?? 0, color: "text-[var(--ep-yellow)]" },
          { label: "O'rtacha vaqt", value: ((recStats?.avgResolutionDays as number) ?? 0) + " kun", color: "text-[var(--ep-blue)]" },
          { label: "Qoniqish darajasi", value: ((recStats?.satisfactionRate as number) ?? 95) + "%", color: "text-[var(--ep-green)]" },
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
            <Input placeholder={t("mijozYokiMuammoBoyichaQidirish")} className="pl-8" value={searchQ} onChange={e => setSearchQ(e.target.value)} data-testid="input-complaint-search" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("mijoz1")}</TableHead>
              <TableHead>{t("muammoTuri")}</TableHead>
              <TableHead>{t("daraja")}</TableHead>
              <TableHead>{t("holati")}</TableHead>
              <TableHead>{t("muddat")}</TableHead>
              <TableHead>{t("date")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rLoad ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : recList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("reklamatsiyalarTopilmadi")}
                </TableCell></TableRow>
              ) : (Array.isArray(recList) ? recList : []).filter((r: QCReclamation) => !searchQ || r.clientName?.toLowerCase().includes(searchQ.toLowerCase()) || r.issue?.toLowerCase().includes(searchQ.toLowerCase())).map((r: QCReclamation) => (
                <TableRow key={r.id} data-testid={`row-complaint-${r.id}`} className="hover:bg-muted/40 transition-colors">
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
          </Table></div>
        </CardContent>
      </Card>

      <Dialog open={showRecDialog} onOpenChange={setShowRecDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiReklamatsiya")}</DialogTitle></DialogHeader>
          <form onSubmit={recForm.handleSubmit(d => createRec.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("mijozNomi")}</Label>
              <Input {...recForm.register("clientName")} placeholder={t("mchjEuroinvest")} data-testid="input-complaint-client" />
              {recForm.formState.errors.clientName && <p className="text-xs text-destructive">{recForm.formState.errors.clientName.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("muammoTuri")}</Label>
                <Select onValueChange={v => recForm.setValue("issueType", v as "other" | "quantity" | "quality" | "delivery")} defaultValue="other">
                  <SelectTrigger data-testid="select-complaint-type" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">{t("sifatNuqsoni")}</SelectItem>
                    <SelectItem value="quantity">{t("kamomad")}</SelectItem>
                    <SelectItem value="delivery">{t("yetkazibBerishKechikishi")}</SelectItem>
                    <SelectItem value="other">{t("boshqa")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Muddat (kunlarda)</Label>
                <Input type="number" {...recForm.register("deadlineDays")} data-testid="input-complaint-deadline" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("batafsilTavsifi")}</Label>
              <Textarea {...recForm.register("description")} placeholder={t("muammoTafsilotlariniYozing")} data-testid="input-complaint-desc" />
              {recForm.formState.errors.description && <p className="text-xs text-destructive">{recForm.formState.errors.description.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRecDialog(false)}>{t("Bekor")}</Button>
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
