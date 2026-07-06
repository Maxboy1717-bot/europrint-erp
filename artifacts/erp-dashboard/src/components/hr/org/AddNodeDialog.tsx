/**
 * @module AddNodeDialog
 * @description React UI component.
 */

import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NODE_TYPE_LABELS } from "./types";
import { ParentCardSelect } from "./ParentCardSelect";
import { useTranslation } from '@/lib/i18n';

export function AddNodeDialog({
  open,
  onClose,
  onSuccess,
  initialParentId,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialParentId?: string;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    nameRu: "",
    nodeType: "department",
    tskp: "",
    parentId: initialParentId || "",
    // VISION node=karta — to'liq karta-maydonlari (HR 0 dan quradi)
    razryadLevelId: null as number | null,
    salaryType: "",
    minSalary: "",
    maxSalary: "",
    rbacTier: "",
    tskpTarget: "",
    tskpMeasurementUnit: "",
    workSchedule: "",
    currentState: "",
    bonusConfig: "",
  });

  // Update parentId if initialParentId changes
  const prevParentId = useRef(initialParentId);
  if (prevParentId.current !== initialParentId) {
    prevParentId.current = initialParentId;
    setForm((f) => ({ ...f, parentId: initialParentId || "" }));
  }

  // VISION: razryad darajalari ro'yxati
  const { data: razryadData } = useQuery<{ items: { id: number; level: number; name: string }[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    staleTime: 60_000,
  });
  const razryadOptions = Array.isArray(razryadData?.items) ? razryadData.items : [];

  const mutation = useMutation({
    mutationFn: () => {
      const parentId = form.parentId ? Number(form.parentId) : null;
      const level = parentId ? undefined : 0;
      const numOrNull = (v: unknown) => { const n = Number(v); return v === "" || v == null || Number.isNaN(n) ? null : n; };
      return apiRequest("POST", "/api/org-structure/nodes", {
        name: form.name,
        nameRu: form.nameRu,
        nodeType: form.nodeType,
        tskp: form.tskp,
        parentId,
        level,
        // VISION node=karta — to'liq karta-maydonlari
        razryadLevelId: form.razryadLevelId,
        salaryType: form.salaryType || null,
        minSalary: numOrNull(form.minSalary),
        maxSalary: numOrNull(form.maxSalary),
        rbacTier: form.rbacTier || null,
        tskpTarget: numOrNull(form.tskpTarget),
        tskpMeasurementUnit: form.tskpMeasurementUnit || null,
        workSchedule: form.workSchedule || null,
        currentState: form.currentState || null,
        bonusConfig: form.bonusConfig || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Bo'lim qo'shildi" });
      onSuccess();
      onClose();
      setForm({
        name: "", nameRu: "", nodeType: "department", tskp: "", parentId: "",
        razryadLevelId: null, salaryType: "", minSalary: "", maxSalary: "", rbacTier: "",
        tskpTarget: "", tskpMeasurementUnit: "", workSchedule: "", currentState: "", bonusConfig: "",
      });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiBolimQoshish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>{t("nomiUz")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("masalanMoliyaBolimi")}
            />
          </div>
          <div>
            <Label>{t("nomiRu")}</Label>
            <Input
              value={form.nameRu}
              onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
              placeholder={t("untitled")}
              autoComplete="off"
            />
          </div>
          <div>
            <Label>{t("type")}</Label>
            <Select value={form.nodeType} onValueChange={(v) => setForm((f) => ({ ...f, nodeType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(NODE_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("qyamAsosiyVazifasiMaks32Belgi")}</Label>
            <Input
              value={form.tskp}
              onChange={(e) => setForm((f) => ({ ...f, tskp: e.target.value.slice(0, 32) }))}
              placeholder={t("asosiyVazifasi")}
              maxLength={32}
            />
            <p className="text-xs text-muted-foreground mt-0.5">{form.tskp.length}/32</p>
          </div>
          <div>
            <Label>{t("otaNodeId")}</Label>
            <ParentCardSelect
              value={form.parentId}
              onChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
            />
          </div>

          {/* VISION node=karta — to'liq karta-maydonlari (HR 0 dan quradi) */}
          <div className="border-t border-border/50 pt-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{t("kartaMaydonlari", "Karta maydonlari")}</p>
          </div>
          <div>
            <Label>{t("razryad", "Razryad")}</Label>
            <Select value={form.razryadLevelId == null ? "__none__" : String(form.razryadLevelId)}
              onValueChange={(v) => setForm((f) => ({ ...f, razryadLevelId: v === "__none__" ? null : Number(v) }))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {razryadOptions.map((r) => (<SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{t("oylikTuri", "Oylik turi")}</Label>
              <Select value={form.salaryType || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, salaryType: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  <SelectItem value="oylik">Oylik</SelectItem>
                  <SelectItem value="soatbay">Soatbay</SelectItem>
                  <SelectItem value="ishbay">Ishbay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("rbacDaraja", "RBAC/ruxsat")}</Label>
              <Input value={form.rbacTier} onChange={(e) => setForm((f) => ({ ...f, rbacTier: e.target.value }))} placeholder="operator/manager" />
            </div>
            <div>
              <Label>{t("minOylik", "Min oylik")}</Label>
              <Input type="number" value={form.minSalary} onChange={(e) => setForm((f) => ({ ...f, minSalary: e.target.value }))} />
            </div>
            <div>
              <Label>{t("maxOylik", "Max oylik")}</Label>
              <Input type="number" value={form.maxSalary} onChange={(e) => setForm((f) => ({ ...f, maxSalary: e.target.value }))} />
            </div>
            <div>
              <Label>{t("tskpMaqsadSon", "ЦКП maqsad")}</Label>
              <Input type="number" value={form.tskpTarget} onChange={(e) => setForm((f) => ({ ...f, tskpTarget: e.target.value }))} />
            </div>
            <div>
              <Label>{t("olchovBirligi", "ЦКП o'lchov")}</Label>
              <Select value={form.tskpMeasurementUnit || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, tskpMeasurementUnit: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  <SelectItem value="SON">SON</SelectItem>
                  <SelectItem value="FOIZ">FOIZ</SelectItem>
                  <SelectItem value="VAQT">VAQT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t("ishVaqti", "Ish vaqti / smena")}</Label>
            <Input value={form.workSchedule} onChange={(e) => setForm((f) => ({ ...f, workSchedule: e.target.value }))} placeholder="09:00-18:00" />
          </div>
          <div>
            <Label>{t("bonus", "Bonus")}</Label>
            <Input value={form.bonusConfig} onChange={(e) => setForm((f) => ({ ...f, bonusConfig: e.target.value }))} placeholder="reja oshsa 5%" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
