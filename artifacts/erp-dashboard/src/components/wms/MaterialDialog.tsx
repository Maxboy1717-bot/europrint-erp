/**
 * @module MaterialDialog
 * @description React UI component.
 */

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { useTranslation } from '@/lib/i18n';
export interface MaterialRecord {
  id: string;
  kod: string;
  xomAshyo: string;
  xomAshyoRu?: string | null;
  category: string;
  unitOfMeasure: string;
  formatA?: string | null;
  formatB?: string | null;
  grammage?: string | null;
  minStock?: string | null;
  maxStock?: string | null;
  materialType?: string | null;
  abcSegment?: string | null;
  shelfLifeDays?: number | null;
  stockStatus?: string;
  currentStock?: string | number;
}

interface MaterialFormData {
  kod: string; xomAshyo: string; xomAshyoRu: string; category: string;
  unitOfMeasure: string; formatA: string; formatB: string; grammage: string;
  minStock: string; maxStock: string; materialType: string; abcSegment: string; shelfLifeDays: string;
}

const EMPTY_FORM: MaterialFormData = {
  kod: "", xomAshyo: "", xomAshyoRu: "", category: "qogoz",
  unitOfMeasure: "kg", formatA: "", formatB: "", grammage: "",
  minStock: "", maxStock: "", materialType: "raw", abcSegment: "", shelfLifeDays: "",
};

function materialToForm(m: MaterialRecord): MaterialFormData {
  return {
    kod: m.kod || "", xomAshyo: m.xomAshyo || "", xomAshyoRu: m.xomAshyoRu || "",
    category: m.category || "qogoz", unitOfMeasure: m.unitOfMeasure || "kg",
    formatA: m.formatA || "", formatB: m.formatB || "", grammage: m.grammage || "",
    minStock: m.minStock || "", maxStock: m.maxStock || "",
    materialType: m.materialType || "raw", abcSegment: m.abcSegment || "",
    shelfLifeDays: m.shelfLifeDays ? String(m.shelfLifeDays) : "",
  };
}

export function MaterialDialog({ open, onClose, editMaterial }: { open: boolean; onClose: () => void; editMaterial?: MaterialRecord | null; }) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editMaterial;
  const [form, setForm] = useState<MaterialFormData>(editMaterial ? materialToForm(editMaterial) : EMPTY_FORM);

  const set = (field: keyof MaterialFormData) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));
  const setVal = (field: keyof MaterialFormData) => (val: string) =>
    setForm(f => ({ ...f, [field]: val }));

  const createMutation = useMutation({
    mutationFn: (data: MaterialFormData) => apiRequest<{ error?: string }>("POST", "/api/inventory/materials", data),
    onSuccess: (res) => {
      if (res.error) { toast({ title: "Xatolik", description: res.error, variant: "destructive" }); return; }
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/materials"] });
      toast({ title: "Material yaratildi" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik", description: "Server xatosi", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: MaterialFormData) => apiRequest<{ error?: string }>("PUT", `/api/inventory/materials/${editMaterial?.id}`, data),
    onSuccess: (res) => {
      if (res.error) { toast({ title: "Xatolik", description: res.error, variant: "destructive" }); return; }
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/materials"] });
      toast({ title: "Material yangilandi" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik", description: "Server xatosi", variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.kod || !form.xomAshyo || !form.category || !form.unitOfMeasure) {
      toast({ title: "Majburiy maydonlar to'ldirilmagan", variant: "destructive" });
      return;
    }
    if (isEdit) updateMutation.mutate(form);
    else createMutation.mutate(form);
  };

  const categories = ["qogoz", "karton", "boyoq", "plyonka", "kimyoviy", "ehtiyot", "tayyor", "boshqa"];
  const units = ["kg", "ton", "litr", "dona", "m", "m²", "m³", "rol", "qop", "quti"];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6" data-testid="dialog-material-crud">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{isEdit ? "Materialni tahrirlash" : "Yangi material yaratish"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="m-kod">{t('materialKodi1')}</Label>
              <Input id="m-kod" data-testid="input-material-kod" value={form.kod} onChange={set("kod")} placeholder="MAT-001" disabled={isEdit} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-type">{t("tur")}</Label>
              <Select value={form.materialType} onValueChange={setVal("materialType")}>
                <SelectTrigger data-testid="select-material-type" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">{t("xomAshyo")}</SelectItem>
                  <SelectItem value="semi">{t("yarimTayyor")}</SelectItem>
                  <SelectItem value="finished">{t("tayyorMahsulot")}</SelectItem>
                  <SelectItem value="consumable">{t("sarflanadigan")}</SelectItem>
                  <SelectItem value="spare">{t("ehtiyotQism")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="m-name">{t("nomiOZbek")}</Label>
            <Input id="m-name" data-testid="input-material-name" value={form.xomAshyo} onChange={set("xomAshyo")} placeholder={t("materialNomi")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="m-name-ru">{t("nomiRus")}</Label>
            <Input id="m-name-ru" data-testid="input-material-name-ru" value={form.xomAshyoRu} onChange={set("xomAshyoRu")} placeholder={t("untitled")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("kategoriya")}</Label>
              <Select value={form.category} onValueChange={setVal("category")}>
                <SelectTrigger data-testid="select-material-category" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{(Array.isArray(categories) ? categories : []).map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("olchovBirligi1")}</Label>
              <Select value={form.unitOfMeasure} onValueChange={setVal("unitOfMeasure")}>
                <SelectTrigger data-testid="select-material-unit" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{(Array.isArray(units) ? units : []).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="m-abc">{t("abcSegment")}</Label>
              <Select value={form.abcSegment || "none"} onValueChange={v => setVal("abcSegment")(v === "none" ? "" : v)}>
                <SelectTrigger data-testid="select-material-abc" className="h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="A">{t("aYuqoriPrioritet")}</SelectItem>
                  <SelectItem value="B">{t("bORtaPrioritet")}</SelectItem>
                  <SelectItem value="C">{t("cPastPrioritet")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-shelf">{t("yaroqlilikKun")}</Label>
              <Input id="m-shelf" data-testid="input-material-shelf-life" type="number" min="0" value={form.shelfLifeDays} onChange={set("shelfLifeDays")} placeholder="365" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="m-fmt-a">{t("formatAMm")}</Label>
              <Input id="m-fmt-a" data-testid="input-material-format-a" value={form.formatA} onChange={set("formatA")} placeholder="1000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-fmt-b">{t("formatBMm")}</Label>
              <Input id="m-fmt-b" data-testid="input-material-format-b" value={form.formatB} onChange={set("formatB")} placeholder="700" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-grm">{t("grammGM")}</Label>
              <Input id="m-grm" data-testid="input-material-grammage" value={form.grammage} onChange={set("grammage")} placeholder="90" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="m-min">{t("minZaxira")}</Label>
              <Input id="m-min" data-testid="input-material-min-stock" type="number" min="0" value={form.minStock} onChange={set("minStock")} placeholder="500" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-max">{t("maxZaxira")}</Label>
              <Input id="m-max" data-testid="input-material-max-stock" type="number" min="0" value={form.maxStock} onChange={set("maxStock")} placeholder="5000" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} data-testid="button-material-cancel">{t("cancel")}</Button>
            <Button type="submit" disabled={isPending} data-testid="button-material-save">
              {isPending ? "Saqlanmoqda..." : isEdit ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
