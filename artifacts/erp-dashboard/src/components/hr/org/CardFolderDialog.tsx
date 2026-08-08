/**
 * @module CardFolderDialog
 * @description Card 6-section folder editor + ЦКП. Persists the 6 sections to
 *   /api/org-structure/cards/:id/folder (PUT) and the ЦКП to the card (PATCH, reusing
 *   org_functions.tskp* — no dup). Live completeness% bar + glossary tooltips. Q-43 round-trip.
 */

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { OrgCard } from "@/components/hr/org/CardFormDialog";

interface FolderView {
  vazifa: string | null; javobgarlik: string | null; gsd: string | null;
  reglament: string | null; jarayon: string | null; talim: string | null;
  completeness: number;
}

const SECTION_KEYS = ["vazifa", "javobgarlik", "gsd", "reglament", "jarayon", "talim"] as const;
type SectionKey = typeof SECTION_KEYS[number];

const GLOSSARY: Record<SectionKey, string> = {
  vazifa: "glossaryVazifa", javobgarlik: "glossaryJavobgarlik", gsd: "glossaryGsd",
  reglament: "glossaryReglament", jarayon: "glossaryJarayon", talim: "glossaryTalim",
};

type FormState = Record<SectionKey, string> & {
  tskp: string; tskpTarget: string; tskpMeasurementUnit: string;
};

export function CardFolderDialog({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card: OrgCard | null;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardId = card?.id ?? 0;
  const folderKey = `/api/org-structure/cards/${cardId}/folder`;

  const { data: folder, isLoading } = useQuery<FolderView>({
    queryKey: [folderKey],
    enabled: open && cardId > 0,
  });

  const [form, setForm] = useState<FormState>(() => emptyForm());

  // Sync the form once the folder data (and card ЦКП) is available for this card.
  const loadedKey = useRef<string>("");
  const syncKey = `${cardId}:${folder ? "y" : "n"}:${open ? "o" : "c"}`;
  if (open && card && loadedKey.current !== syncKey) {
    loadedKey.current = syncKey;
    setForm({
      vazifa: folder?.vazifa ?? "", javobgarlik: folder?.javobgarlik ?? "", gsd: folder?.gsd ?? "",
      reglament: folder?.reglament ?? "", jarayon: folder?.jarayon ?? "", talim: folder?.talim ?? "",
      tskp: card.tskp ?? "", tskpTarget: card.tskp_target ?? "", tskpMeasurementUnit: card.tskp_measurement_unit ?? "",
    });
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const liveFilled = SECTION_KEYS.filter((k) => form[k].trim() !== "").length;
  const liveCompleteness = Math.round((liveFilled / SECTION_KEYS.length) * 100);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", folderKey, {
        vazifa: form.vazifa, javobgarlik: form.javobgarlik, gsd: form.gsd,
        reglament: form.reglament, jarayon: form.jarayon, talim: form.talim,
      });
      await apiRequest("PATCH", `/api/org-structure/cards/${cardId}`, {
        tskp: form.tskp || undefined,
        tskpTarget: form.tskpTarget || undefined,
        tskpMeasurementUnit: form.tskpMeasurementUnit || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [folderKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/cards"] });
      toast({ title: t("papkaSaqlandi") });
      onClose();
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {t("kartaPapkasi")}{card?.position_name ? ` — ${card.position_name}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <Progress value={liveCompleteness} className="h-2 flex-1" />
          <span className="text-[13px] text-muted-foreground whitespace-nowrap">
            {t("toliqlik")}: {liveCompleteness}% ({liveFilled}/6)
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">{t("yuklanmoqda")}</p>
        ) : (
          <div className="space-y-3 py-2">
            {SECTION_KEYS.map((k) => (
              <div key={k}>
                <Label className="flex items-center gap-1">
                  {t(k)}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{t(GLOSSARY[k])}</TooltipContent>
                  </Tooltip>
                </Label>
                <Textarea value={form[k]} onChange={(e) => set(k, e.target.value)} rows={2} />
              </div>
            ))}

            <div className="rounded-md border border-border p-3 space-y-3">
              <p className="text-[13px] font-medium">{t("tskpMaqsad")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <Label>{t("tskpNorma")}</Label>
                  <Input value={form.tskpTarget} onChange={(e) => set("tskpTarget", e.target.value)} />
                </div>
                <div className="sm:col-span-1">
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
                <div className="sm:col-span-3">
                  <Label>{t("tskpTarif")}</Label>
                  <Textarea value={form.tskp} onChange={(e) => set("tskp", e.target.value)} rows={2} />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={!cardId || mutation.isPending}>
            {mutation.isPending ? t("saqlanmoqda") : t("saqlash")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function emptyForm(): FormState {
  return {
    vazifa: "", javobgarlik: "", gsd: "", reglament: "", jarayon: "", talim: "",
    tskp: "", tskpTarget: "", tskpMeasurementUnit: "",
  };
}
