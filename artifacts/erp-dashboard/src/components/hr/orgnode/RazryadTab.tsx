/**
 * @module RazryadTab
 * @description Karta-detal "Razryad" tab (egasi 2026-06-25: "razryad mana shu tabda bo'lsin").
 *   Kartaning razryadini TANLASH (PATCH razryad_level_id) + razryad ma'nosi (koeff/oylik-band/talab/
 *   imtihon/sertifikat/keyingi-razryadgacha) + razryad narvoni (1->6 o'sish yo'li). Intervyu modeli
 *   (EP-ORG-008..013): razryad -> talab -> o'sish -> oylik. Razryad qiymatlari egasi-data (fabrikatsiya yo'q).
 */

import { type ReactNode, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Settings2, Check, X, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { EPLoader } from "@/components/ep";
import { RazryadLevelsPanel } from "@/components/hr/org/RazryadLevelsPanel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { NodeDetail } from "./types";
import { useTranslation } from "@/lib/i18n";

interface RazryadLevel {
  id: number;
  level: number;
  name: string;
  coefficient?: number | string | null;
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  min_requirement?: string | null;
  min_months?: number | null;
  exam_type?: string | null;
  certificate?: string | null;
}

function fmtSom(v: number | string | null | undefined): string | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : `${n.toLocaleString("uz-UZ")} so'm`;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-300/15 text-amber-600 border-amber-400/40",
  hr_approved: "bg-blue-300/15 text-blue-600 border-blue-400/40",
  approved: "bg-emerald-300/15 text-emerald-600 border-emerald-400/40",
  rejected: "bg-red-300/15 text-red-600 border-red-400/40",
};

interface RazryadRequest {
  id: number;
  card_id?: number;
  target_razryad_id?: number | null;
  current_razryad_id?: number | null;
  request_type?: string | null;
  exam_score?: number | string | null;
  reason?: string | null;
  status?: string | null;
  reject_reason?: string | null;
  created_at?: string | null;
  ai_suggested?: boolean | null;
}

export function RazryadTab({ node }: { node: NodeDetail }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [cfgOpen, setCfgOpen] = useState(false);
  // RBAC (egasi 8-qaror): HR imzosi=hr_manager, rahbar imzosi=manager/director; super_admin barchasi.
  const canHrApprove = hasRole("hr_manager", "super_admin");
  const canManagerApprove = hasRole("manager", "director", "super_admin");

  const { data, isLoading } = useQuery<{ items: RazryadLevel[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    staleTime: 300_000,
  });
  const levels = Array.isArray(data?.items) ? [...data.items].sort((a, b) => a.level - b.level) : [];
  const current = node.razryadLevelId != null ? levels.find((r) => r.id === node.razryadLevelId) : undefined;

  const setRazryad = useMutation({
    mutationFn: (rid: number | null) =>
      apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, { razryadLevelId: rid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${node.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
      toast({ title: t("razryadSaqlandi", "Razryad saqlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  // VISION (EP-ORG-010..013): razryad o'sish/pasayish so'rovi (imtihon -> HR+rahbar 2-imzo -> o'zgaradi) + tarix.
  const [reqType, setReqType] = useState<"increase" | "decrease">("increase");
  const [reqTarget, setReqTarget] = useState<string>("");
  const [reqScore, setReqScore] = useState<string>("");
  const [reqReason, setReqReason] = useState<string>("");
  const { data: histData } = useQuery<{ items: Record<string, unknown>[] }>({
    queryKey: [`/api/org-structure/cards/${node.id}/razryad-history`],
    staleTime: 30_000,
  });
  const history = Array.isArray(histData?.items) ? histData!.items : [];

  // Karta razryad so'rovlari (pending/hr_approved/approved/rejected) — imzo-zanjir uchun.
  const { data: reqData } = useQuery<{ items: RazryadRequest[] }>({
    queryKey: [`/api/org-structure/cards/${node.id}/razryad-requests`],
    staleTime: 30_000,
  });
  const requests = Array.isArray(reqData?.items) ? reqData!.items : [];

  const invalidateRazryad = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/cards/${node.id}/razryad-history`] });
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/cards/${node.id}/razryad-requests`] });
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${node.id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
  };

  const createRequest = useMutation({
    mutationFn: () => apiRequest<{ message?: string }>("POST", `/api/org-structure/cards/${node.id}/razryad-requests`, {
      targetRazryadId: Number(reqTarget),
      requestType: reqType,
      examScore: reqScore.trim() === "" ? undefined : Number(reqScore),
      // BE (razryad-history.service.ts:70) pasayishda reason'ni MAJBURIY talab qiladi.
      reason: reqReason.trim() === "" ? undefined : reqReason.trim(),
    }),
    onSuccess: () => {
      invalidateRazryad();
      setReqTarget(""); setReqScore(""); setReqReason(""); setReqType("increase");
      toast({
        title: reqType === "decrease"
          ? t("pasayishSorovYuborildi", "Pasayish so'rovi yuborildi (HR + rahbar tasdig'i kutilmoqda)")
          : t("osishSorovYuborildi", "O'sish so'rovi yuborildi (HR + rahbar tasdig'i kutilmoqda)"),
      });
    },
    onError: (e: unknown) => toast({ title: e instanceof Error ? e.message : t("Xatolik"), variant: "destructive" }),
  });

  // 1-imzo: HR tasdig'i (pending -> hr_approved).
  const hrApprove = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/org-structure/razryad-requests/${id}/hr-approve`),
    onSuccess: () => { invalidateRazryad(); toast({ title: t("hrImzolandi", "HR imzosi qo'yildi (rahbar tasdig'i kutilmoqda)") }); },
    onError: (e: unknown) => toast({ title: e instanceof Error ? e.message : t("Xatolik"), variant: "destructive" }),
  });

  // 2-imzo: bevosita rahbar tasdig'i (hr_approved -> approved; razryad amalda o'zgaradi).
  const managerApprove = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/org-structure/razryad-requests/${id}/manager-approve`),
    onSuccess: () => { invalidateRazryad(); toast({ title: t("razryadTasdiqlandi", "Tasdiqlandi — razryad o'zgardi") }); },
    onError: (e: unknown) => toast({ title: e instanceof Error ? e.message : t("Xatolik"), variant: "destructive" }),
  });

  const rejectRequest = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("POST", `/api/org-structure/razryad-requests/${id}/reject`, { reason }),
    onSuccess: () => { invalidateRazryad(); toast({ title: t("sorovRadEtildi", "So'rov rad etildi") }); },
    onError: (e: unknown) => toast({ title: e instanceof Error ? e.message : t("Xatolik"), variant: "destructive" }),
  });

  const onReject = (id: number) => {
    const reason = window.prompt(t("radSababi", "Rad etish sababi (majburiy):") ?? "");
    if (reason == null) return;
    if (reason.trim() === "") {
      toast({ title: t("radSababiKerak", "Rad sababi majburiy"), variant: "destructive" });
      return;
    }
    rejectRequest.mutate({ id, reason: reason.trim() });
  };

  const razryadName = (id: number | null | undefined): string => {
    if (id == null) return "—";
    return levels.find((r) => r.id === id)?.name ?? `#${id}`;
  };

  if (isLoading) return <EPLoader />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />{t("kartaRazryadi", "Karta razryadi")}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setCfgOpen(true)} data-testid="button-razryad-config">
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />{t("darajalarniSozlash", "Darajalarni sozlash")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={node.razryadLevelId == null ? "__none__" : String(node.razryadLevelId)}
              onValueChange={(v) => setRazryad.mutate(v === "__none__" ? null : Number(v))}
            >
              <SelectTrigger className="w-64" data-testid="select-card-razryad">
                <SelectValue placeholder={t("razryadTanlang", "Razryad tanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— {t("tayinlanmagan", "Tayinlanmagan")}</SelectItem>
                {levels.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}{r.coefficient != null ? ` · ×${r.coefficient}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {current && <Badge className="text-[13px] px-2 py-0.5">{current.name}</Badge>}
            {setRazryad.isPending && <span className="text-xs text-muted-foreground">{t("saqlanmoqda", "Saqlanmoqda...")}</span>}
          </div>

          {current ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm border-t border-border/60 pt-3">
              {current.coefficient != null && <Row label={t("oylikKoeffitsiyent", "Oylik koeffitsiyent")} value={`×${current.coefficient}`} />}
              {(fmtSom(current.salary_min) || fmtSom(current.salary_max)) && (
                <Row label={t("oylikBandi", "Oylik bandi")} value={`${fmtSom(current.salary_min) ?? "—"} – ${fmtSom(current.salary_max) ?? "—"}`} />
              )}
              {current.min_requirement && <Row label={t("minimalTalab", "Minimal talab")} value={current.min_requirement} />}
              {current.exam_type && <Row label={t("imtihonTuri", "Imtihon turi")} value={current.exam_type} />}
              {current.certificate && <Row label={t("sertifikat", "Sertifikat")} value={current.certificate} />}
              {current.min_months != null && <Row label={t("keyingiRazryadgacha", "Keyingi razryadgacha")} value={`${current.min_months} ${t("oy", "oy")}`} />}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground border-t border-border/60 pt-3">
              {t("kartaRazryadYoq", "Bu kartaga razryad tayinlanmagan. Yuqoridan tanlang.")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("razryadNarvoni", "Razryad narvoni (o'sish yo'li)")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {levels.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("razryadlarSozlanmagan", "Razryad darajalari sozlanmagan.")}</p>
          ) : (
            levels.map((r) => {
              const isCur = r.id === node.razryadLevelId;
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${isCur ? "border-amber-400 bg-amber-300/10" : "border-border"}`}
                >
                  <span className="font-medium flex items-center gap-2">
                    {isCur && <Award className="h-3.5 w-3.5 text-amber-500" />}{r.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {r.coefficient != null ? `×${r.coefficient}` : ""}{fmtSom(r.salary_min) ? ` · ${fmtSom(r.salary_min)}+` : ""}
                  </span>
                </div>
              );
            })
          )}
          <p className="text-[11px] text-muted-foreground pt-1">
            {t("razryadOsishIzoh", "O'sish: imtihon → HR + rahbar tasdig'i → razryad o'zgaradi (≥3 oy oraliq). Tasdiq-zanjir keyingi bosqichda.")}
          </p>
        </CardContent>
      </Card>

      {/* Razryad o'sish so'rovi (EP-ORG-010..013) + tarix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />{t("razryadOsishSorovi", "Razryad o'sish so'rovi")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio" name="razryad-req-type" className="accent-emerald-600"
                checked={reqType === "increase"}
                onChange={() => { setReqType("increase"); setReqTarget(""); }}
                data-testid="radio-razryad-increase"
              />
              {t("osish", "O'sish")}
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio" name="razryad-req-type" className="accent-red-600"
                checked={reqType === "decrease"}
                onChange={() => { setReqType("decrease"); setReqTarget(""); }}
                data-testid="radio-razryad-decrease"
              />
              {t("pasayish", "Pasayish")}
            </label>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <Label className="text-xs">{t("targetRazryad", "Yangi razryad")}</Label>
              <Select value={reqTarget} onValueChange={setReqTarget}>
                <SelectTrigger className="w-44" data-testid="select-razryad-target"><SelectValue placeholder={t("razryadTanlang", "Razryad tanlang")} /></SelectTrigger>
                <SelectContent>
                  {levels
                    .filter((r) => current == null || (reqType === "increase" ? r.level > current.level : r.level < current.level))
                    .map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {reqType === "increase" ? (
              <div>
                <Label className="text-xs">{t("imtihonBali", "Imtihon bali (%)")}</Label>
                <Input type="number" min="0" max="100" className="w-28" value={reqScore} onChange={(e) => setReqScore(e.target.value)} placeholder="80" />
              </div>
            ) : (
              <div className="flex-1 min-w-48">
                <Label className="text-xs">{t("pasayishSababi", "Pasayish sababi (majburiy)")}</Label>
                <Input className="w-full" value={reqReason} onChange={(e) => setReqReason(e.target.value)} placeholder={t("pasayishSababiPlaceholder", "Masalan: intizom buzilishi, malaka pasayishi")} data-testid="input-razryad-decrease-reason" />
              </div>
            )}
            <Button size="sm"
              variant={reqType === "decrease" ? "destructive" : "default"}
              disabled={!reqTarget || createRequest.isPending || (reqType === "decrease" && reqReason.trim() === "")}
              onClick={() => createRequest.mutate()} data-testid="button-razryad-request">
              {createRequest.isPending ? t("yuborilmoqda", "Yuborilmoqda...") : t("sorovYuborish", "So'rov yuborish")}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {reqType === "decrease"
              ? t("pasayishIzoh", "Pasayish sababi majburiy → HR imzosi → bevosita rahbar imzosi → razryad o'zgaradi.")
              : t("osishIzoh", "Imtihon → HR imzosi → bevosita rahbar imzosi → razryad o'zgaradi (≥3 oy oraliq). Egasi imtihon-chegara/oy sozlamasa rad etiladi.")}
          </p>
          {history.length > 0 && (
            <div className="border-t border-border/60 pt-2 space-y-1">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase">{t("razryadTarixi", "Razryad tarixi")}</p>
              {history.slice(0, 8).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs rounded border border-border px-2 py-1">
                  <span className="flex items-center gap-1.5">
                    {String(h.old_name ?? "—")} → <b>{String(h.new_name ?? "")}</b> · {String(h.change_type ?? "")}
                    {h.ai_suggested === true && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 bg-violet-300/15 text-violet-600 border-violet-400/40 flex items-center gap-0.5"
                      >
                        <Sparkles className="h-2.5 w-2.5" />{t("ai", "AI")}
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground">{h.certificate_number ? String(h.certificate_number) : ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* So'rovlar + 2-imzo zanjiri (HR -> rahbar). Imzo-tugmalar rol bilan darvozalangan. */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" />{t("razryadSorovlariImzo", "So'rovlar va imzolar")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("razryadSorovYoq", "Ushbu karta uchun razryad so'rovi yo'q.")}</p>
          ) : (
            requests.map((rq) => {
              const status = String(rq.status ?? "pending");
              const isPending = status === "pending";
              const isHrApproved = status === "hr_approved";
              const open = isPending || isHrApproved;
              return (
                <div key={rq.id} className="rounded-md border border-border px-3 py-2 text-sm space-y-1.5" data-testid={`razryad-request-${rq.id}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium">
                      {razryadName(rq.current_razryad_id)} → <b>{razryadName(rq.target_razryad_id)}</b>
                      <span className={rq.request_type === "decrease" ? "text-red-500" : "text-emerald-600"}>
                        {" · "}{rq.request_type === "decrease" ? t("pasayish", "Pasayish") : t("osish", "O'sish")}
                      </span>
                      {rq.exam_score != null && <span className="text-muted-foreground"> · {String(rq.exam_score)}%</span>}
                      {rq.reason && <span className="text-muted-foreground"> · {String(rq.reason)}</span>}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {rq.ai_suggested && (
                        <Badge
                          variant="outline"
                          className="text-[11px] bg-violet-300/15 text-violet-600 border-violet-400/40 flex items-center gap-1"
                          data-testid={`badge-ai-suggested-${rq.id}`}
                        >
                          <Sparkles className="h-3 w-3" />{t("aiTavsiyaQildi", "AI tavsiya qildi")}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-[11px] ${STATUS_STYLE[status] ?? ""}`}>
                        {t(`razryadStatus_${status}`, status === "pending" ? "Kutilmoqda" : status === "hr_approved" ? "HR imzoladi" : status === "approved" ? "Tasdiqlangan" : "Rad etilgan")}
                      </Badge>
                    </div>
                  </div>
                  {rq.reject_reason && <p className="text-xs text-red-500">{t("radSababiLabel", "Rad sababi")}: {String(rq.reject_reason)}</p>}
                  {open && (canHrApprove || canManagerApprove) && (
                    <div className="flex items-center gap-2 pt-1">
                      {isPending && canHrApprove && (
                        <Button size="sm" variant="outline" disabled={hrApprove.isPending}
                          onClick={() => hrApprove.mutate(rq.id)} data-testid={`button-hr-approve-${rq.id}`}>
                          <Check className="h-3.5 w-3.5 mr-1" />{t("hrImzosi", "HR imzosi")}
                        </Button>
                      )}
                      {isHrApproved && canManagerApprove && (
                        <Button size="sm" disabled={managerApprove.isPending}
                          onClick={() => managerApprove.mutate(rq.id)} data-testid={`button-manager-approve-${rq.id}`}>
                          <Check className="h-3.5 w-3.5 mr-1" />{t("rahbarImzosi", "Rahbar imzosi (tasdiqlash)")}
                        </Button>
                      )}
                      {(canHrApprove || canManagerApprove) && (
                        <Button size="sm" variant="ghost" className="text-red-500" disabled={rejectRequest.isPending}
                          onClick={() => onReject(rq.id)} data-testid={`button-reject-${rq.id}`}>
                          <X className="h-3.5 w-3.5 mr-1" />{t("radEtish", "Rad etish")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <p className="text-[11px] text-muted-foreground pt-1">
            {t("imzoZanjirIzoh", "2-imzo: HR imzosi → bevosita rahbar imzosi → razryad o'zgaradi. Imzo huquqi rolga bog'liq.")}
          </p>
        </CardContent>
      </Card>

      {/* Razryad darajalari — umumiy sozlama (master-data; egasi/HR konfiguratsiya qiladi, Q9) */}
      <Dialog open={cfgOpen} onOpenChange={setCfgOpen}>
        <DialogContent className="max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" />{t("razryadDarajalariSozlama", "Razryad darajalari — umumiy sozlama")}
            </DialogTitle>
          </DialogHeader>
          <RazryadLevelsPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}
