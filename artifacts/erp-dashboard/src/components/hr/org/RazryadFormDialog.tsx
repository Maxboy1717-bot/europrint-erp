/**
 * @module RazryadFormDialog
 * @description Create / edit dialog for razryad (grade) master-data. Mirrors CardFormDialog.
 *   Persists to /api/org-structure/razryad-levels (POST/PATCH). UNIQUE(level) → 409 → clear toast.
 */

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

export interface RazryadLevel {
  id: number;
  level: number;
  name: string;
  min_requirement?: string | null;
  salary_min?: string | number | null;
  salary_max?: string | number | null;
  exam_type?: string | null;
  certificate?: string | null;
  description?: string | null;
  coefficient?: string | number | null;
  exam_pass_threshold?: string | number | null;
  max_retakes?: string | number | null;
  min_months?: string | number | null;
  is_active?: boolean;
}

const RAZRYAD_KEY = "/api/org-structure/razryad-levels";

type FormState = {
  level: string;
  name: string;
  minRequirement: string;
  salaryMin: string;
  salaryMax: string;
  examType: string;
  certificate: string;
  description: string;
  coefficient: string;
  examPassThreshold: string;
  maxRetakes: string;
  minMonths: string;
};

function toForm(r?: RazryadLevel | null): FormState {
  return {
    level: r?.level != null ? String(r.level) : "",
    name: r?.name ?? "",
    minRequirement: r?.min_requirement ?? "",
    salaryMin: r?.salary_min != null ? String(r.salary_min) : "",
    salaryMax: r?.salary_max != null ? String(r.salary_max) : "",
    examType: r?.exam_type ?? "",
    certificate: r?.certificate ?? "",
    description: r?.description ?? "",
    coefficient: r?.coefficient != null ? String(r.coefficient) : "",
    examPassThreshold: r?.exam_pass_threshold != null ? String(r.exam_pass_threshold) : "",
    maxRetakes: r?.max_retakes != null ? String(r.max_retakes) : "",
    minMonths: r?.min_months != null ? String(r.min_months) : "",
  };
}

const numOrUndef = (s: string): number | undefined => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
};

export function RazryadFormDialog({
  open,
  onClose,
  razryad,
}: {
  open: boolean;
  onClose: () => void;
  razryad?: RazryadLevel | null;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!razryad?.id;

  const [form, setForm] = useState<FormState>(() => toForm(razryad));

  const prevId = useRef<number | undefined>(razryad?.id);
  if (prevId.current !== razryad?.id) {
    prevId.current = razryad?.id;
    setForm(toForm(razryad));
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        level: numOrUndef(form.level),
        name: form.name,
        minRequirement: form.minRequirement || undefined,
        salaryMin: numOrUndef(form.salaryMin),
        salaryMax: numOrUndef(form.salaryMax),
        examType: form.examType || undefined,
        certificate: form.certificate || undefined,
        description: form.description || undefined,
        coefficient: numOrUndef(form.coefficient),
        examPassThreshold: numOrUndef(form.examPassThreshold),
        maxRetakes: numOrUndef(form.maxRetakes),
        minMonths: numOrUndef(form.minMonths),
      };
      return isEdit
        ? apiRequest("PATCH", `${RAZRYAD_KEY}/${razryad!.id}`, payload)
        : apiRequest("POST", RAZRYAD_KEY, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RAZRYAD_KEY] });
      toast({ title: isEdit ? t("razryadYangilandi") : t("razryadQoshildi") });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "";
      toast({
        title: msg.includes("409") ? t("razryadDarajaBand") : t("Xatolik"),
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {isEdit ? t("razryadnitahrirlash") : t("yangiRazryad")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div>
            <Label>{t("razryadDarajasiRaqam")} *</Label>
            <Input type="number" value={form.level} onChange={(e) => set("level", e.target.value)} />
          </div>
          <div>
            <Label>{t("nomi")} *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("masalanKattaMashinist")} />
          </div>
          <div>
            <Label>{t("minOylik")}</Label>
            <Input type="number" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
          </div>
          <div>
            <Label>{t("maxOylik")}</Label>
            <Input type="number" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
          </div>
          <div>
            <Label>{t("koeffitsiyent", "Oylik koeffitsiyenti")}</Label>
            <Input type="number" step="0.05" min="0.01" max="20" value={form.coefficient}
              onChange={(e) => set("coefficient", e.target.value)} placeholder="×1.00" />
          </div>
          <div>
            <Label>{t("imtihonTuri")}</Label>
            <Input value={form.examType} onChange={(e) => set("examType", e.target.value)} />
          </div>
          <div>
            <Label>{t("sertifikat")}</Label>
            <Input value={form.certificate} onChange={(e) => set("certificate", e.target.value)} />
          </div>
          <div className="sm:col-span-2 border-t border-border/50 pt-2 mt-1">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t("osishShartlari", "O'sish shartlari (nima qilsa razryad oshadi)")}
            </p>
          </div>
          <div>
            <Label>{t("imtihonOtishBali", "Imtihon o'tish bali (%)")}</Label>
            <Input type="number" min="0" max="100" value={form.examPassThreshold}
              onChange={(e) => set("examPassThreshold", e.target.value)} placeholder={t("masalan70", "masalan 70")} />
          </div>
          <div>
            <Label>{t("maxQaytaTopshirish", "Maks. qayta topshirish")}</Label>
            <Input type="number" min="0" max="10" value={form.maxRetakes}
              onChange={(e) => set("maxRetakes", e.target.value)} placeholder="masalan 2" />
          </div>
          <div>
            <Label>{t("keyingiRazryadgachaOy", "Keyingi razryadgacha (oy)")}</Label>
            <Input type="number" min="0" max="120" value={form.minMonths}
              onChange={(e) => set("minMonths", e.target.value)} placeholder="≥3" />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("minimalTalab")}</Label>
            <Input value={form.minRequirement} onChange={(e) => set("minRequirement", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("tavsif")}</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.level || !form.name || mutation.isPending}>
            {mutation.isPending ? t("saqlanmoqda") : t("saqlash")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
