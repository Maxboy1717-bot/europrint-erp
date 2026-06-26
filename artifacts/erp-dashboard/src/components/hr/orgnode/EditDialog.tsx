/**
 * @module EditDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NodeDetail, NODE_TYPE_LABELS } from "./types";
import { useTranslation } from '@/lib/i18n';

interface EditDialogProps {
  node: NodeDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDialog({
  node, open, onClose, onSuccess,
}: EditDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: node.name,
    nameRu: node.nameRu || "",
    color: node.color,
    tskp: node.tskp || "",
    tskpRu: node.tskpRu || "",
    description: node.description || "",
    nodeType: node.nodeType,
    headUserId: node.headUserId ?? null,
    razryadLevelId: node.razryadLevelId ?? null,
    // VISION node=karta — to'liq karta-maydonlari
    salaryType: node.salaryType ?? "",
    minSalary: node.minSalary ?? "",
    maxSalary: node.maxSalary ?? "",
    rbacTier: node.rbacTier ?? "",
    tskpTarget: node.tskpTarget ?? "",
    tskpMeasurementUnit: node.tskpMeasurementUnit ?? "",
    workSchedule: node.workSchedule ?? "",
    currentState: node.currentState ?? "",
    // VISION (A35 — Vysotskiy 7-otdeleniye): karta qaysi 7 bo'limdan biriga (1-7); null = belgilanmagan.
    otdeleniyeNo: node.otdeleniyeNo ?? null,
    bonusConfig: node.bonusConfig ?? "",
  });

  // VISION: har node razryadga ega — razryad darajalari ro'yxati
  const { data: razryadData } = useQuery<{ items: { id: number; level: number; name: string }[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    staleTime: 60_000,
  });
  const razryadOptions = Array.isArray(razryadData?.items) ? razryadData.items : [];

  // Fetch all active users for the department-head picker.
  // 87% of org nodes have zero members → member-based list leaves headOptions=[].
  // This query surfaces every active user (31 now) unconditionally.
  const { data: usersData } = useQuery<{ users: { id: number; name: string }[] }>({
    queryKey: ["/api/org-structure/available-users"],
    staleTime: 60_000,
  });

  const headOptions: { id: number; name: string }[] = Array.isArray(usersData?.users)
    ? usersData.users
    : [];
  // Ensure the current head is always present in the list even while loading
  if (node.headUserId != null && !headOptions.some((o) => o.id === node.headUserId)) {
    headOptions.unshift({ id: node.headUserId, name: node.headUserName || `#${node.headUserId}` });
  }

  const mutation = useMutation({
    mutationFn: () => {
      // VISION node=karta: bo'sh string'larni olib tashlab, raqamlarni number qilib yuboramiz (.strict() Zod)
      const numOrNull = (v: unknown) => { const n = Number(v); return v === "" || v == null || Number.isNaN(n) ? null : n; };
      const payload: Record<string, unknown> = {
        name: form.name, nameRu: form.nameRu, color: form.color, tskp: form.tskp, tskpRu: form.tskpRu,
        description: form.description, nodeType: form.nodeType, headUserId: form.headUserId,
        razryadLevelId: form.razryadLevelId,
        salaryType: form.salaryType || null,
        minSalary: numOrNull(form.minSalary), maxSalary: numOrNull(form.maxSalary),
        rbacTier: form.rbacTier || null,
        tskpTarget: numOrNull(form.tskpTarget),
        tskpMeasurementUnit: form.tskpMeasurementUnit || null,
        workSchedule: form.workSchedule || null, currentState: form.currentState || null,
        otdeleniyeNo: form.otdeleniyeNo,
        bonusConfig: form.bonusConfig || null,
      };
      return apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, payload);
    },
    onSuccess: () => {
      toast({ title: "Saqlandi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Bo'limni tahrirlash — {node.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div>
            <Label>{t("nomiUz")}</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>{t("nomiRu")}</Label>
            <Input value={form.nameRu} onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))} />
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
            <Label>{t("rang")}</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-8 w-16 rounded border" />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label>{t("qyamUz")}</Label>
            <Input value={form.tskp}
              onChange={(e) => setForm((f) => ({ ...f, tskp: e.target.value }))}
              placeholder={t("asosiyVazifasiQyam")} />
          </div>
          <div className="col-span-2">
            <Label>{t("qyamRu")}</Label>
            <Input value={form.tskpRu}
              onChange={(e) => setForm((f) => ({ ...f, tskpRu: e.target.value }))}
              placeholder={t("ru")} />
          </div>
          <div className="col-span-2">
            <Label>{t("progress.description")}</Label>
            <Input value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label>Bo'lim boshlig'i</Label>
            <Select
              value={form.headUserId == null ? "__none__" : String(form.headUserId)}
              onValueChange={(v) => setForm((f) => ({ ...f, headUserId: v === "__none__" ? null : Number(v) }))}
            >
              <SelectTrigger><SelectValue placeholder="Boshliq tanlang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Yo'q (bo'sh) —</SelectItem>
                {headOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>{t("razryad", "Razryad")}</Label>
            <Select
              value={form.razryadLevelId == null ? "__none__" : String(form.razryadLevelId)}
              onValueChange={(v) => setForm((f) => ({ ...f, razryadLevelId: v === "__none__" ? null : Number(v) }))}
            >
              <SelectTrigger data-testid="select-node-razryad"><SelectValue placeholder={t("razryadTanlang", "Razryad tanlang")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— {t("yoq", "Yo'q")} —</SelectItem>
                {razryadOptions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VISION node=karta — to'liq karta-maydonlari (HR 0 dan kiritadi) */}
          <div className="col-span-2 border-t border-border/50 mt-1 pt-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{t("kartaMaydonlari", "Karta maydonlari")}</p>
          </div>
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
            <Label>{t("rbacDaraja", "RBAC / ruxsat darajasi")}</Label>
            <Input value={form.rbacTier} onChange={(e) => setForm((f) => ({ ...f, rbacTier: e.target.value }))} placeholder="operator / manager / director" />
          </div>
          <div>
            <Label>{t("minOylik", "Min oylik")}</Label>
            <Input type="number" value={String(form.minSalary)} onChange={(e) => setForm((f) => ({ ...f, minSalary: e.target.value }))} />
          </div>
          <div>
            <Label>{t("maxOylik", "Max oylik")}</Label>
            <Input type="number" value={String(form.maxSalary)} onChange={(e) => setForm((f) => ({ ...f, maxSalary: e.target.value }))} />
          </div>
          <div>
            <Label>{t("tskpMaqsadSon", "ЦКП maqsad (son)")}</Label>
            <Input type="number" value={String(form.tskpTarget)} onChange={(e) => setForm((f) => ({ ...f, tskpTarget: e.target.value }))} />
          </div>
          <div>
            <Label>{t("olchovBirligi", "ЦКП o'lchov")}</Label>
            <Select value={form.tskpMeasurementUnit || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, tskpMeasurementUnit: v === "__none__" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                <SelectItem value="SON">SON</SelectItem>
                <SelectItem value="FOIZ">FOIZ (%)</SelectItem>
                <SelectItem value="VAQT">VAQT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("ishVaqti", "Ish vaqti / smena")}</Label>
            <Input value={form.workSchedule} onChange={(e) => setForm((f) => ({ ...f, workSchedule: e.target.value }))} placeholder="09:00-18:00" />
          </div>
          <div>
            <Label>{t("otdeleniye", "Otdeleniye (1-7)")}</Label>
            <Select
              value={form.otdeleniyeNo == null ? "__none__" : String(form.otdeleniyeNo)}
              onValueChange={(v) => setForm((f) => ({ ...f, otdeleniyeNo: v === "__none__" ? null : Number(v) }))}
            >
              <SelectTrigger data-testid="select-node-otdeleniye"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— {t("yoq", "Yo'q")} —</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}-{t("otdeleniyeShort", "otdeleniye")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("joriyHolat", "Joriy holat")}</Label>
            <Input value={form.currentState} onChange={(e) => setForm((f) => ({ ...f, currentState: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label>{t("bonus", "Bonus (konfiguratsiya)")}</Label>
            <Input value={form.bonusConfig} onChange={(e) => setForm((f) => ({ ...f, bonusConfig: e.target.value }))} placeholder="masalan: reja oshsa 5%" />
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
