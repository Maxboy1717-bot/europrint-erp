/**
 * @module CardFormDialog
 * @description Create / edit dialog for the canonical ORG CARD (org_functions).
 *   Persists to /api/org-structure/cards (POST create, PATCH edit) — Q-43 round-trip.
 */

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

export interface OrgCard {
  id: number;
  position_name: string;
  position_name_ru?: string | null;
  department_id?: number | null;
  code?: string | null;
  level?: number | null;
  razryad_level_id?: number | null;
  salary_type?: string | null;
  min_salary?: string | number | null;
  max_salary?: string | number | null;
  rbac_tier?: string | null;
  status?: string | null;
  tskp?: string | null;
  tskp_target?: string | null;
  tskp_measurement_unit?: string | null;
  statistics_type?: string | null;
  ai_exam_enabled?: boolean | null;
  function_description?: string | null;
  function_description_ru?: string | null;
}

const CARDS_KEY = "/api/org-structure/cards";

type FormState = {
  positionName: string;
  positionNameRu: string;
  departmentId: string;
  code: string;
  level: string;
  razryadLevelId: string;
  salaryType: string;
  minSalary: string;
  maxSalary: string;
  rbacTier: string;
  status: string;
  tskp: string;
  tskpTarget: string;
  tskpMeasurementUnit: string;
  statisticsType: string;
  aiExamEnabled: boolean;
  functionDescription: string;
  functionDescriptionRu: string;
};

function toForm(card?: OrgCard | null): FormState {
  return {
    positionName: card?.position_name ?? "",
    positionNameRu: card?.position_name_ru ?? "",
    departmentId: card?.department_id != null ? String(card.department_id) : "",
    code: card?.code ?? "",
    level: card?.level != null ? String(card.level) : "",
    razryadLevelId: card?.razryad_level_id != null ? String(card.razryad_level_id) : "",
    salaryType: card?.salary_type ?? "",
    minSalary: card?.min_salary != null ? String(card.min_salary) : "",
    maxSalary: card?.max_salary != null ? String(card.max_salary) : "",
    rbacTier: card?.rbac_tier ?? "",
    status: card?.status ?? "active",
    tskp: card?.tskp ?? "",
    tskpTarget: card?.tskp_target ?? "",
    tskpMeasurementUnit: card?.tskp_measurement_unit ?? "",
    statisticsType: card?.statistics_type ?? "",
    aiExamEnabled: Boolean(card?.ai_exam_enabled),
    functionDescription: card?.function_description ?? "",
    functionDescriptionRu: card?.function_description_ru ?? "",
  };
}

const numOrUndef = (s: string): number | undefined => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
};

export function CardFormDialog({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card?: OrgCard | null;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!card?.id;

  // Razryad dropdown options (Phase 2 — real master-data from /api/org-structure/razryad-levels).
  const { data: razryadData } = useQuery<{ items: { id: number; level: number; name: string }[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
  });
  const razryads = Array.isArray(razryadData?.items) ? razryadData!.items : [];

  const [form, setForm] = useState<FormState>(() => toForm(card));

  // Reset the form when the dialog is (re)opened for a different card.
  const prevCardId = useRef<number | undefined>(card?.id);
  if (prevCardId.current !== card?.id) {
    prevCardId.current = card?.id;
    setForm(toForm(card));
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        positionName: form.positionName,
        positionNameRu: form.positionNameRu || undefined,
        departmentId: numOrUndef(form.departmentId),
        code: form.code || undefined,
        level: numOrUndef(form.level),
        razryadLevelId: numOrUndef(form.razryadLevelId),
        salaryType: form.salaryType || undefined,
        minSalary: numOrUndef(form.minSalary),
        maxSalary: numOrUndef(form.maxSalary),
        rbacTier: form.rbacTier || undefined,
        status: form.status || undefined,
        tskp: form.tskp || undefined,
        tskpTarget: form.tskpTarget || undefined,
        tskpMeasurementUnit: form.tskpMeasurementUnit || undefined,
        statisticsType: form.statisticsType || undefined,
        aiExamEnabled: form.aiExamEnabled,
        functionDescription: form.functionDescription || undefined,
        functionDescriptionRu: form.functionDescriptionRu || undefined,
      };
      return isEdit
        ? apiRequest("PATCH", `${CARDS_KEY}/${card!.id}`, payload)
        : apiRequest("POST", CARDS_KEY, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARDS_KEY] });
      toast({ title: isEdit ? t("kartaYangilandi") : t("kartaQoshildi") });
      onClose();
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {isEdit ? t("kartanitahrirlash") : t("yangiKarta")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="sm:col-span-2">
            <Label>{t("lavozimNomi")} *</Label>
            <Input value={form.positionName} onChange={(e) => set("positionName", e.target.value)} />
          </div>
          <div>
            <Label>{t("nomiRu")}</Label>
            <Input value={form.positionNameRu} onChange={(e) => set("positionNameRu", e.target.value)} autoComplete="off" />
          </div>
          <div>
            <Label>{t("kartaKodi")}</Label>
            <Input value={form.code} onChange={(e) => set("code", e.target.value)} />
          </div>
          <div>
            <Label>{t("bolimId")}</Label>
            <Input type="number" value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)} />
          </div>
          <div>
            <Label>{t("daraja")}</Label>
            <Input type="number" value={form.level} onChange={(e) => set("level", e.target.value)} />
          </div>
          <div>
            <Label>{t("razryad")}</Label>
            <Select value={form.razryadLevelId || undefined} onValueChange={(v) => set("razryadLevelId", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {razryads.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.level}-razryad — {r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("holati")}</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("faol")}</SelectItem>
                <SelectItem value="vacant">{t("vakansiya")}</SelectItem>
                <SelectItem value="io">{t("ijrochi")}</SelectItem>
                <SelectItem value="frozen">{t("muzlatilgan")}</SelectItem>
                <SelectItem value="archived">{t("arxiv")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("oylikTuri")}</Label>
            <Select value={form.salaryType || undefined} onValueChange={(v) => set("salaryType", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="oylik">{t("oylik")}</SelectItem>
                <SelectItem value="soatbay">{t("soatbay")}</SelectItem>
                <SelectItem value="ishbay">{t("ishbay")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("minOylik")}</Label>
            <Input type="number" value={form.minSalary} onChange={(e) => set("minSalary", e.target.value)} />
          </div>
          <div>
            <Label>{t("maxOylik")}</Label>
            <Input type="number" value={form.maxSalary} onChange={(e) => set("maxSalary", e.target.value)} />
          </div>
          <div>
            <Label>{t("rbacDaraja")}</Label>
            <Input value={form.rbacTier} onChange={(e) => set("rbacTier", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("tskpMaqsad")}</Label>
            <Input value={form.tskp} onChange={(e) => set("tskp", e.target.value)} placeholder={t("qyamAsosiyVazifasi")} />
          </div>
          <div>
            <Label>{t("tskpNorma")}</Label>
            <Input value={form.tskpTarget} onChange={(e) => set("tskpTarget", e.target.value)} />
          </div>
          <div>
            <Label>{t("tskpOlchovi")}</Label>
            <Select value={form.tskpMeasurementUnit || undefined} onValueChange={(v) => set("tskpMeasurementUnit", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SON">{t("son")}</SelectItem>
                <SelectItem value="FOIZ">{t("foiz")}</SelectItem>
                <SelectItem value="VAQT">{t("vaqt")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>{t("lavozimTavsifi")}</Label>
            <Textarea
              value={form.functionDescription}
              onChange={(e) => set("functionDescription", e.target.value)}
              rows={4}
              placeholder={t("lavozimTavsifiPlaceholder")}
              className="resize-y"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("lavozimTavsifiRu")}</Label>
            <Textarea
              value={form.functionDescriptionRu}
              onChange={(e) => set("functionDescriptionRu", e.target.value)}
              rows={4}
              placeholder={t("lavozimTavsifiRuPlaceholder")}
              className="resize-y"
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-border p-3">
            <Label className="mb-0">{t("aiImtihon")}</Label>
            <Switch checked={form.aiExamEnabled} onCheckedChange={(v) => set("aiExamEnabled", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.positionName || mutation.isPending}>
            {mutation.isPending ? t("saqlanmoqda") : t("saqlash")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
