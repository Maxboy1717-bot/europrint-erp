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
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NODE_TYPE_LABELS, OrgNode } from "./types";
import { ParentCardSelect } from "./ParentCardSelect";
import { useTranslation } from '@/lib/i18n';

// 2026-07-11: default rang har node_type darajasi bo'yicha — egasi "yangi kartalar hammasi bir
// xil rangda chiqyapti" deb topdi (root-cause: backend har doim '#3b82f6'ga fallback qiladi,
// chunki bu forma color'ni umuman yubormasdi). Bu palette darrov vizual farq beradi; rang
// pikkeri baribir erkin qayta tanlash imkonini beradi.
const NODE_TYPE_DEFAULT_COLOR: Record<string, string> = {
  owner: "#a855f7", top_director: "#3b82f6", director: "#2563eb", department: "#14b8a6",
  otdeleniye: "#6366f1", otdel: "#06b6d4", sektsiya: "#10b981", sektor: "#f97316",
};

interface ShiftTypeOption {
  id: number; code: string; name_uz: string; start_time: string; end_time: string;
}

/** G4 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding B5): source card + its resolved
 * parentId, passed when the dialog is opened via the "duplicate" action instead of "add child". */
export interface DuplicateFromInput {
  node: OrgNode;
  parentId: number | null;
}

function emptyForm(initialParentId?: string) {
  return {
    name: "",
    nameRu: "",
    nodeType: "department",
    color: NODE_TYPE_DEFAULT_COLOR.department,
    tskp: "",
    parentId: initialParentId || "",
    // VISION node=karta — to'liq karta-maydonlari (HR 0 dan quradi)
    razryadLevelId: null as number | null,
    // 2026-07-11: Vysotskiy-7 — "Otdeleniye" tanlanganda qaysi 7 tadan ekani (DB CHECK 1-7).
    otdeleniyeNo: null as number | null,
    salaryType: "",
    minSalary: "",
    maxSalary: "",
    rbacTier: "",
    tskpTarget: "",
    tskpMeasurementUnit: "",
    workSchedule: "",
    currentState: "",
    bonusConfig: "",
  };
}

/** Pre-fills from the source card's own (lightweight, tree-level) fields. Salary/rbac/schedule
 * fields aren't carried on the tree node object — those stay blank, same as a fresh card. */
function duplicatedForm(source: OrgNode, parentId: number | null) {
  return {
    ...emptyForm(),
    name: `${source.name} (nusxa)`,
    nameRu: source.nameRu ? `${source.nameRu} (копия)` : "",
    nodeType: source.nodeType || "department",
    color: source.color || NODE_TYPE_DEFAULT_COLOR[source.nodeType || "department"] || NODE_TYPE_DEFAULT_COLOR.department,
    tskp: source.tskp || "",
    parentId: parentId != null ? String(parentId) : "",
    razryadLevelId: source.razryadLevelId ?? null,
  };
}

export function AddNodeDialog({
  open,
  onClose,
  onSuccess,
  initialParentId,
  duplicateFrom,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialParentId?: string;
  duplicateFrom?: DuplicateFromInput | null;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [form, setForm] = useState(() =>
    duplicateFrom ? duplicatedForm(duplicateFrom.node, duplicateFrom.parentId) : emptyForm(initialParentId),
  );

  // Re-seed the form whenever the caller hands us a new prefill source — either a plain
  // initialParentId (add-child) or a duplicateFrom (duplicate-card). Same ref-diff-on-render
  // pattern as the pre-existing initialParentId sync below, extended to cover both.
  const prevParentId = useRef(initialParentId);
  const prevDuplicateFrom = useRef(duplicateFrom);
  if (prevDuplicateFrom.current !== duplicateFrom) {
    prevDuplicateFrom.current = duplicateFrom;
    if (duplicateFrom) {
      setForm(duplicatedForm(duplicateFrom.node, duplicateFrom.parentId));
    }
  } else if (prevParentId.current !== initialParentId) {
    prevParentId.current = initialParentId;
    setForm((f) => ({ ...f, parentId: initialParentId || "" }));
  }

  // VISION: razryad darajalari ro'yxati
  const { data: razryadData } = useQuery<{ items: { id: number; level: number; name: string }[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    staleTime: 60_000,
  });
  const razryadOptions = Array.isArray(razryadData?.items) ? razryadData.items : [];

  // 2026-07-11: "Ish vaqti" preset-tanlagich — shift_types (master-data, egasi-tahrirlanadigan)
  // dan tayyor smenalarni taklif qiladi; matn maydoni pastda qoladi (erkin tahrir/qo'lda kiritish).
  const { data: shiftData } = useQuery<ShiftTypeOption[]>({
    queryKey: ["/api/hr/shifts/types"],
    select: selectArray<ShiftTypeOption>,
    staleTime: 60_000,
  });
  const shiftOptions = Array.isArray(shiftData) ? shiftData : [];

  const mutation = useMutation({
    mutationFn: () => {
      const parentId = form.parentId ? Number(form.parentId) : null;
      const level = parentId ? undefined : 0;
      const numOrNull = (v: unknown) => { const n = Number(v); return v === "" || v == null || Number.isNaN(n) ? null : n; };
      return apiRequest("POST", "/api/org-structure/nodes", {
        name: form.name,
        nameRu: form.nameRu,
        nodeType: form.nodeType,
        color: form.color,
        tskp: form.tskp,
        parentId,
        level,
        // VISION node=karta — to'liq karta-maydonlari
        razryadLevelId: form.razryadLevelId,
        otdeleniyeNo: form.nodeType === "otdeleniye" ? form.otdeleniyeNo : null,
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
      setForm(emptyForm());
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
            <Select value={form.nodeType} onValueChange={(v) => setForm((f) => ({
              ...f, nodeType: v,
              // Turi o'zgarganda rang ham shu daraja default'iga yangilanadi (pastda erkin qayta tanlanadi).
              color: NODE_TYPE_DEFAULT_COLOR[v] || f.color,
              otdeleniyeNo: v === "otdeleniye" ? f.otdeleniyeNo : null,
            }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(NODE_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_TYPE_DEFAULT_COLOR[v] || "var(--ep-muted)" }} />
                      {l}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("rang", "Rang")}</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-8 w-16 rounded border" />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>
          {form.nodeType === "otdeleniye" && (
            <div>
              <Label>{t("otdeleniyeRaqami", "Otdeleniye raqami (1-7)")}</Label>
              <Select value={form.otdeleniyeNo == null ? "__none__" : String(form.otdeleniyeNo)}
                onValueChange={(v) => setForm((f) => ({ ...f, otdeleniyeNo: v === "__none__" ? null : Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
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
          {/* 2026-07-11: grid-cols-1 tor (mobil/Telegram Mini App) ekranda — 2-ustunli grid
              raqam maydonlarini (masalan ЦКП maqsad) siqib qo'yardi ("juda qisqa" shikoyati). */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            {shiftOptions.length > 0 && (
              <Select value="__pick__" onValueChange={(v) => {
                const s = shiftOptions.find((o) => String(o.id) === v);
                if (s) setForm((f) => ({ ...f, workSchedule: `${s.start_time}-${s.end_time}` }));
              }}>
                <SelectTrigger className="mb-1"><SelectValue placeholder={t("tayyorSmenadanTanlash", "Tayyor smenadan tanlash...")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__pick__" disabled>{t("tayyorSmenadanTanlash", "Tayyor smenadan tanlash...")}</SelectItem>
                  {shiftOptions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name_uz} ({s.start_time}-{s.end_time})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
