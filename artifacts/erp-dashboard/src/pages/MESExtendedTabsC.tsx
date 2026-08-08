/** @module MESExtendedTabsC @description Norms tab and Smena Handover tab for the MES Extended page. */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type MESShift } from "./MESExtendedTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Norms Tab ───────────────────────────────────────────────────────────────

interface WorkCenterNorm {
  id: number;
  name: string;
  code?: string;
  type?: string;
  capacity_per_hour?: number | null;
  efficiency_rate?: number | null;
  hours_per_day?: number | null;
  cost_per_hour?: number | null;
  capacity?: number | null;
  equipment_count?: number;
}

function fmtEfficiency(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${Math.round(Number(v) * 100)}%`;
}

function fmtCapacity(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${Number(v).toLocaleString("uz-UZ")}/soat`;
}

function fmtHours(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${Number(v)} soat/kun`;
}

/** Tab content: Uskuna Normalari — real work_centers data from GET /api/mes/work-centers/norms */
export function NormsTab() {
  const { t } = useTranslation("common");

  const { data: raw, isLoading } = useQuery<WorkCenterNorm[]>({
    queryKey: ["/api/mes/work-centers/norms"],
    staleTime: 60_000,
  });

  const norms: WorkCenterNorm[] = Array.isArray(raw) ? raw : [];

  return (
    <TabsContent value="norms" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("uskunaNormalari")}</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={`sk-${i}`} className="h-10 w-full rounded" />)}
            </div>
          ) : norms.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("malumotTopilmadi") ?? "Ma'lumot topilmadi"}
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("stanoq")}</TableHead>
                  <TableHead>{t("normativTezlik") ?? "Soatlik unumdorlik"}</TableHead>
                  <TableHead>{t("tayyorlovVaqti") ?? "Ish soat/kun"}</TableHead>
                  <TableHead>{t("oeeMaqsad") ?? "OEE maqsad"}</TableHead>
                  <TableHead>{t("uskunaSoni")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {norms.map((r) => (
                  <TableRow key={`norm-${r.id}`} data-testid={`row-norm-${r.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{fmtCapacity(r.capacity_per_hour)}</TableCell>
                    <TableCell>{fmtHours(r.hours_per_day)}</TableCell>
                    <TableCell className="font-bold text-[var(--ep-green)]">{fmtEfficiency(r.efficiency_rate)}</TableCell>
                    <TableCell>{r.equipment_count ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Smena Handover Tab ──────────────────────────────────────────────────────

interface SmenaTabProps {
  currentShift: MESShift | undefined;
  onHandoverToast: () => void;
  onConfirmHandover: (incomingSupervisorId: number, notes: string, issues: string) => void;
}

/** Tab content: Smena O'tkazish Protokoli */
export function SmenaTab({ currentShift, onHandoverToast, onConfirmHandover }: SmenaTabProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [incomingId, setIncomingId] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [evalShiftId, setEvalShiftId] = useState("");
  const [evalProd, setEvalProd] = useState("");
  const [evalQual, setEvalQual] = useState("");
  const [evalSafety, setEvalSafety] = useState("");
  const [evalNotes, setEvalNotes] = useState("");

  const closeEvalMutation = useMutation({
    mutationFn: (vars: { shift_id: number; production_score?: number; quality_score?: number; safety_score?: number; notes?: string }) =>
      apiRequest("POST", "/api/mes/shifts/close-evaluation", vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mes/stats"] });
      setEvalShiftId(""); setEvalProd(""); setEvalQual(""); setEvalSafety(""); setEvalNotes("");
      toast({ title: t("smenaBaholandi") });
    },
    onError: () => toast({ title: t("error", "Xatolik"), variant: "destructive" }),
  });

  const smenaStats = [
    { l: t("joriySmenaIshlabChiqarishi"), v: currentShift?.producedQty ?? "—", c: "text-primary"   },
    { l: t("brakMiqdori"),                  v: currentShift?.brakQty    ?? "—", c: "text-[var(--ep-red)]"   },
    { l: "OEE",                           v: currentShift?.oee ? `${currentShift.oee}%` : "—", c: "text-[var(--ep-green)]" },
  ];

  const outgoingInfo = [
    { label: t("chiquvchiOperator"), value: currentShift?.operatorName || "—" },
    { label: t("smenaBoshlanishi"),  value: currentShift?.startTime ? new Date(currentShift.startTime).toLocaleTimeString("uz-UZ") : "—" },
    { label: t("stanoqHolatiLabel"),      value: currentShift?.machineStatus || t("ishlamoqdaHolat") },
    { label: t("eslatmalarLabel"),         value: currentShift?.notes || t("yoq") },
  ];


  return (
    <TabsContent value="smena" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("smenaOtkazishProtokoli")}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="badge-current-shift">
            <Clock className="h-3 w-3 mr-1" />
            {currentShift
              ? `${currentShift.shiftName || t("joriySmenaLabel")} — ${currentShift.operatorName || t("operatorRol")}`
              : t("faolSmenaYoq")}
          </Badge>
          <Button
            size="sm"
            data-testid="button-start-handover"
            onClick={onHandoverToast}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />{t("smenaYakunlash")}
          </Button>
        </div>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {smenaStats.map(s => (
          <Card key={s.l}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Outgoing shift summary */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">{t("smenaYakuniyHisobot")}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {outgoingInfo.map(item => (
              <div
                key={item.label}
                className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium text-right max-w-[60%]">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Incoming shift form */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">{t("yangiSmenaMalumotlari")}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("kiruvchiOperator")}</Label>
              <Input
                placeholder={t("operatorIsmi")}
                data-testid="input-incoming-operator"
                value={incomingId}
                onChange={e => setIncomingId(e.target.value)}
                type="number"
                min={1}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("stanoqHolatiTekshiruvi")}</Label>
              <Select>
                <SelectTrigger data-testid="select-machine-status" className="h-9">
                  <SelectValue placeholder={t("holatTanlang")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">{t("Yaxshi")}</SelectItem>
                  <SelectItem value="minor_issue">{t("kichikMuammo")}</SelectItem>
                  <SelectItem value="needs_maintenance">{t("texnikXizmatKerak")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("Izoh")}</Label>
              <Input
                placeholder={t("smenaBoyichaIzoh")}
                data-testid="input-shift-note"
                value={handoverNotes}
                onChange={e => setHandoverNotes(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              data-testid="button-confirm-handover"
              onClick={() => {
                if (!incomingId) return;
                onConfirmHandover(Number(incomingId), handoverNotes, "");
              }}
              disabled={!incomingId}
            >
              {t("smenaOtkazishniTasdiqlash")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Smena baholash (Shift Evaluation) */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-sm flex items-center gap-2"><Star className="h-4 w-4 text-[var(--ep-yellow)]" /> {t("smenaBaholash")}</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("smenaRaqamiId")} <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" placeholder="1, 2, 3..." value={evalShiftId} onChange={e => setEvalShiftId(e.target.value)} data-testid="input-eval-shift-id" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("ishlabChiqarish0100")}</Label>
              <Input type="number" min="0" max="100" placeholder="85" value={evalProd} onChange={e => setEvalProd(e.target.value)} data-testid="input-eval-prod" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("sifat0100")}</Label>
              <Input type="number" min="0" max="100" placeholder="90" value={evalQual} onChange={e => setEvalQual(e.target.value)} data-testid="input-eval-qual" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("xavfsizlik0100")}</Label>
              <Input type="number" min="0" max="100" placeholder="95" value={evalSafety} onChange={e => setEvalSafety(e.target.value)} data-testid="input-eval-safety" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t("izohIxtiyoriy")}</Label>
            <Textarea value={evalNotes} onChange={e => setEvalNotes(e.target.value)} placeholder={t("smenaDavomidagiKuzatishlar")} className="min-h-[60px]" data-testid="input-eval-notes" />
          </div>
          <Button
            className="w-full"
            data-testid="button-submit-evaluation"
            disabled={!evalShiftId || Number(evalShiftId) < 1 || closeEvalMutation.isPending}
            onClick={() => closeEvalMutation.mutate({
              shift_id: Number(evalShiftId),
              ...(evalProd !== "" && { production_score: Math.min(100, Math.max(0, Number(evalProd))) }),
              ...(evalQual !== ""  && { quality_score:    Math.min(100, Math.max(0, Number(evalQual))) }),
              ...(evalSafety !== "" && { safety_score:   Math.min(100, Math.max(0, Number(evalSafety))) }),
              ...(evalNotes.trim() && { notes: evalNotes.trim() }),
            })}
          >
            <Star className="h-4 w-4 mr-1.5" />
            {closeEvalMutation.isPending ? t("saqlanmoqda") : t("smenaniBaholash")}
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
