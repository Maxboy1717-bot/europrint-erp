/**
 * @module StatRegulationsPage
 * @description Director stat regulations: list + create.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface StatRegulation {
  id: number;
  name_uz: string;
  name_ru?: string | null;
  unit?: string | null;
  frequency: string;
  target_value?: string | null;
  source_module?: string | null;
}

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Kunlik" },
  { value: "weekly", label: "Haftalik" },
  { value: "monthly", label: "Oylik" },
];

function freqBadge(f: string) {
  const opt = FREQUENCY_OPTIONS.find((o) => o.value === f);
  return <Badge variant="outline">{opt?.label ?? f}</Badge>;
}

export default function StatRegulationsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nameUz, setNameUz] = useState("");
  const [unit, setUnit] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [targetValue, setTargetValue] = useState("");
  const [sourceModule, setSourceModule] = useState("");

  const { data, isLoading } = useQuery<{ data: StatRegulation[] }>({
    queryKey: ["/api/director/stat-regulations"],
  });
  const regulations = Array.isArray(data?.data) ? data.data : [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("POST", "/api/director/stat-regulations", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/stat-regulations"] });
      setIsDialogOpen(false);
      setNameUz(""); setUnit(""); setFrequency("daily"); setTargetValue(""); setSourceModule("");
      toast({ title: "Stat-reglament qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!nameUz.trim()) {
      toast({ title: "Nomini kiriting", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name_uz: nameUz.trim(),
      unit: unit.trim() || null,
      frequency,
      target_value: targetValue ? Number(targetValue) : null,
      source_module: sourceModule.trim() || null,
    });
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">{t("statReglamentlar", "Stat-reglamentlar")}</h1>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-stat-reg">
          <Plus className="h-4 w-4 mr-2" />
          {t("qoshish", "Qo'shish")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : regulations.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("statReglamentlarTopilmadi", "Stat-reglamentlar topilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nom", "Nom")}</TableHead>
                    <TableHead>{t("birlik", "Birlik")}</TableHead>
                    <TableHead>{t("chastota", "Chastota")}</TableHead>
                    <TableHead>{t("maqsadQiymat", "Maqsad qiymat")}</TableHead>
                    <TableHead>{t("modul", "Modul")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regulations.map((reg) => (
                    <TableRow key={reg.id} data-testid={`row-stat-reg-${reg.id}`}>
                      <TableCell className="font-medium">{reg.name_uz}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {reg.unit ?? "—"}
                      </TableCell>
                      <TableCell>{freqBadge(reg.frequency)}</TableCell>
                      <TableCell className="text-sm">
                        {reg.target_value ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {reg.source_module ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("yangiStatReglament", "Yangi stat-reglament")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("nom", "Nom")} (UZ) *</Label>
              <Input
                value={nameUz}
                onChange={(e) => setNameUz(e.target.value)}
                placeholder={t("nomUz", "Stat-reglament nomi")}
                data-testid="input-stat-reg-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("birlik", "Birlik")}</Label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="m², dona, %"
                  data-testid="input-stat-reg-unit"
                />
              </div>
              <div>
                <Label>{t("maqsadQiymat", "Maqsad qiymat")}</Label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="100"
                  data-testid="input-stat-reg-target"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("chastota", "Chastota")}</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger data-testid="select-stat-reg-freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("manbaModul", "Manba modul")}</Label>
                <Input
                  value={sourceModule}
                  onChange={(e) => setSourceModule(e.target.value)}
                  placeholder="mes, wms, hr"
                  data-testid="input-stat-reg-module"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
