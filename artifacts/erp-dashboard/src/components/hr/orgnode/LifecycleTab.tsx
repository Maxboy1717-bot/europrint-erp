/**
 * @module LifecycleTab
 * @description Karta 5-holat LIFECYCLE tab (A32 — VISION EP-ORG-084/086).
 *   Kartaning joriy holatini (active/vacant/io/frozen/archived) ko'rsatadi + holatlar orasida
 *   o'tkazadi. Muzlatish (frozen) — sabab + muddat (freeze_until) majburiy kiritiladi.
 *
 *   ⭐ REAL SAQLASH (Q-43): o'tish `PATCH /api/org-structure/nodes/:id` orqali —
 *      { currentState } har holatga; frozen uchun qo'shimcha { freezeReason, freezeUntil }.
 *      Backend org_departments.current_state/freeze_reason/freeze_until/frozen_at/archived_at
 *      ustunlariga yozadi (rollback-tx DB-proof bilan tasdiqlangan). Soxta qiymat YO'Q (Q-40).
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity, UserX, UserCheck, Snowflake, Archive, RotateCcw, CalendarClock, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EPStatusPill } from "@/components/ep";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  NodeDetail, CardState, CARD_STATES, CARD_STATE_ORDER, resolveCardState,
} from "./types";

const STATE_ICON: Record<CardState, React.ComponentType<{ className?: string }>> = {
  active: UserCheck,
  vacant: UserX,
  io: Activity,
  frozen: Snowflake,
  archived: Archive,
};

const STATE_DESC: Record<CardState, string> = {
  active: "Kartada faol xodim, normal ish jarayoni.",
  vacant: "Karta ochiq — rahbar/xodim yo'q, ishga olish kerak.",
  io: "I.o. — vaqtincha o'rinbosar tayinlangan.",
  frozen: "Muzlatilgan — vaqtincha to'xtatilgan (sabab + muddat).",
  archived: "Arxivlangan — endi ishlatilmaydi (yumshoq o'chirish).",
};

function fmtDate(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("uz-UZ");
}

export function LifecycleTab({ node }: { node: NodeDetail }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentState = resolveCardState(node);
  const meta = CARD_STATES[currentState];

  const [freezeOpen, setFreezeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${node.id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${node.id}/history`] });
  };

  // Generic holat o'tishi (frozen-dan tashqari). frozen->boshqa o'tishda meta tozalanadi.
  const transition = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, payload),
    onSuccess: () => {
      invalidate();
      toast({ title: t("holatYangilandi", "Holat yangilandi") });
    },
    onError: () => toast({ title: t("Xatolik", "Xatolik"), variant: "destructive" }),
  });

  const freezeMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, {
        currentState: "frozen",
        freezeReason: reason.trim(),
        freezeUntil: until || null,
      }),
    onSuccess: () => {
      invalidate();
      setFreezeOpen(false);
      setReason("");
      setUntil("");
      toast({ title: t("kartaMuzlatildi", "Karta muzlatildi") });
    },
    onError: () => toast({ title: t("Xatolik", "Xatolik"), variant: "destructive" }),
  });

  /** Tanlangan holatga o'tish. frozen → dialog; boshqalar → to'g'ridan PATCH. */
  const goTo = (target: CardState) => {
    if (target === currentState) return;
    if (target === "frozen") {
      setReason(node.freezeReason ?? "");
      setUntil(node.freezeUntil ? node.freezeUntil.slice(0, 10) : "");
      setFreezeOpen(true);
      return;
    }
    // frozen-dan chiqishda muzlatish-meta tozalanadi (sabab/muddat NULL).
    const payload: Record<string, unknown> = { currentState: target };
    if (currentState === "frozen") {
      payload.freezeReason = null;
      payload.freezeUntil = null;
    }
    transition.mutate(payload);
  };

  const busy = transition.isPending || freezeMutation.isPending;
  const StateIcon = STATE_ICON[currentState];

  return (
    <div className="space-y-4">
      {/* Joriy holat */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />{t("kartaHolati", "Karta holati")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <StateIcon className="h-5 w-5 text-muted-foreground" />
            <EPStatusPill tone={meta.tone} size="md" data-testid="card-state-badge">
              {t(`cardState_${currentState}`, meta.label)}
            </EPStatusPill>
            <span className="text-sm text-muted-foreground">{t(`cardStateDesc_${currentState}`, STATE_DESC[currentState])}</span>
          </div>

          {/* Muzlatish meta (frozen) */}
          {currentState === "frozen" && (node.freezeReason || node.freezeUntil) && (
            <div className="rounded-md border border-blue-400/40 bg-blue-300/10 px-3 py-2 text-sm space-y-1">
              {node.freezeReason && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                  <span><span className="text-muted-foreground">{t("muzlatishSababi", "Sabab")}:</span> {node.freezeReason}</span>
                </div>
              )}
              {fmtDate(node.freezeUntil) && (
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span><span className="text-muted-foreground">{t("muzlatishMuddati", "Muddat")}:</span> {fmtDate(node.freezeUntil)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holatga o'tkazish */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("holatgaOtkazish", "Holatga o'tkazish")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CARD_STATE_ORDER.map((s) => {
            const sMeta = CARD_STATES[s];
            const Icon = STATE_ICON[s];
            const isCur = s === currentState;
            return (
              <div
                key={s}
                className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                  isCur ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {t(`cardState_${s}`, sMeta.label)}
                      {isCur && <Badge variant="outline" className="text-[10px]">{t("joriy", "Joriy")}</Badge>}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{t(`cardStateDesc_${s}`, STATE_DESC[s])}</div>
                  </div>
                </div>
                {!isCur && (
                  <Button
                    size="sm"
                    variant={s === "archived" ? "destructive" : "outline"}
                    disabled={busy}
                    onClick={() => goTo(s)}
                    data-testid={`button-state-${s}`}
                  >
                    {s === "frozen" && <Snowflake className="h-3.5 w-3.5 mr-1" />}
                    {s === "archived" && <Archive className="h-3.5 w-3.5 mr-1" />}
                    {(s === "active" && currentState === "frozen") && <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                    {t("otish", "O'tish")}
                  </Button>
                )}
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground pt-1">
            {t(
              "lifecycleIzoh",
              "Holat org_departments.current_state ustunida saqlanadi. Muzlatish — sabab va muddat majburiy. Muzlatishdan chiqishda meta tozalanadi.",
            )}
          </p>
        </CardContent>
      </Card>

      {/* Muzlatish dialogi — sabab + muddat (EP-ORG-084/086) */}
      <Dialog open={freezeOpen} onOpenChange={(o) => { if (!o) setFreezeOpen(false); }}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />{t("kartaniMuzlatish", "Kartani muzlatish")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>{t("muzlatishSababi", "Muzlatish sababi")} *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("muzlatishSababiPlaceholder", "Masalan: uskuna tamiri, mavsumiy to'xtatish...")}
                rows={3}
                data-testid="input-freeze-reason"
              />
            </div>
            <div>
              <Label>{t("muzlatishMuddati", "Muzlatish muddati (gacha)")}</Label>
              <Input
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                data-testid="input-freeze-until"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{t("muzlatishMuddatiIzoh", "Ixtiyoriy — qachongacha muzlatilgan.")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeOpen(false)}>{t("Bekor", "Bekor")}</Button>
            <Button
              disabled={!reason.trim() || freezeMutation.isPending}
              onClick={() => freezeMutation.mutate()}
              data-testid="button-confirm-freeze"
            >
              {freezeMutation.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("muzlatish", "Muzlatish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
