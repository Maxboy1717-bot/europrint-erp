/**
 * @module ApplyCardTemplateDialog
 * @description VISION-3340 #26 — surfaces the existing KARTA-shablon ("card template") CRUD +
 *   apply-template action from a node's detail view (OrgNodeDetail.tsx): pick a template,
 *   name the new position, and seed a NEW child karta (org_departments row) under the current
 *   node via the existing POST /api/org-structure/card-templates/:id/apply-template endpoint
 *   (card-template.controller.ts / card-template.service.ts — field_defaults + override →
 *   CardService.create). The template list itself (GET /api/org-structure/card-templates) was
 *   already real on the backend with zero FE consumer before this. See ImportNodesDialog.tsx
 *   (hierarchy page) for the bulk-import half of the same VISION item.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

interface CardTemplate {
  id: number;
  position_type: string;
  name: string;
  name_ru?: string | null;
  description?: string | null;
  is_active?: boolean;
}

/** Pure payload-builder — exported for unit testing without a live mutation/network. */
export function buildApplyTemplatePayload(
  parentNodeId: number,
  positionName: string,
  positionNameRu: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    departmentId: parentNodeId,
    positionName: positionName.trim(),
  };
  const ru = positionNameRu.trim();
  if (ru) payload.positionNameRu = ru;
  return payload;
}

interface ApplyCardTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called once after a successful apply so the caller can refresh its own node/children data. */
  onSuccess: () => void;
  /** Current karta — becomes the new card's parent (`departmentId` → `parent_id`, card.repository.ts). */
  parentNodeId: number;
  parentNodeName: string;
}

export function ApplyCardTemplateDialog({
  open, onClose, onSuccess, parentNodeId, parentNodeName,
}: ApplyCardTemplateDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const [templateId, setTemplateId] = useState<string>("");
  const [positionName, setPositionName] = useState("");
  const [positionNameRu, setPositionNameRu] = useState("");

  const { data, isLoading } = useQuery<{ items: CardTemplate[]; total: number }>({
    queryKey: ["/api/org-structure/card-templates"],
    enabled: open,
  });
  const templates = Array.isArray(data?.items) ? data.items : [];
  const selectedTemplate = templates.find((tpl) => String(tpl.id) === templateId) ?? null;

  // Reset on close so a re-open never shows the previous run's picks/result.
  useEffect(() => {
    if (!open) {
      setTemplateId("");
      setPositionName("");
      setPositionNameRu("");
    }
  }, [open]);

  // Convenience prefill: once a template is picked, default the name field to the template's
  // own name — the user can still freely edit/replace it before submitting.
  useEffect(() => {
    if (selectedTemplate && positionName.trim() === "") {
      setPositionName(selectedTemplate.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  const applyMutation = useMutation({
    mutationFn: () => {
      const payload = buildApplyTemplatePayload(parentNodeId, positionName, positionNameRu);
      return apiRequest<{ id?: number; position_name?: string }>(
        "POST",
        `/api/org-structure/card-templates/${templateId}/apply-template`,
        payload,
      );
    },
    onSuccess: (created) => {
      onSuccess();
      toast({
        title: t("shablondanKartaYaratildi", "Shablondan yangi karta yaratildi"),
        description: created?.position_name ?? positionName,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: t("Xatolik", "Xatolik"), description: error.message, variant: "destructive" });
    },
  });

  const canSubmit = templateId !== "" && positionName.trim().length > 0 && !applyMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-primary" />{t("shablondanKartaQoshish", "Shablondan karta qo'shish")}
          </DialogTitle>
          <DialogDescription>
            {t("otaKarta", "Ota karta")}: {parentNodeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("shablon", "Shablon")}</Label>
            <Select value={templateId} onValueChange={setTemplateId} disabled={isLoading}>
              <SelectTrigger data-testid="select-card-template">
                <SelectValue placeholder={t("shablonTanlang", "Shablonni tanlang")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={String(tpl.id)}>
                    {tpl.name} ({tpl.position_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate?.description && (
              <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
            )}
            {!isLoading && templates.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("shablonYoq", "Hali shablon yaratilmagan")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="apply-template-position-name">{t("lavozimNomi", "Lavozim nomi")}</Label>
            <Input
              id="apply-template-position-name"
              value={positionName}
              onChange={(e) => setPositionName(e.target.value)}
              placeholder={t("lavozimNomiKiriting", "Lavozim nomini kiriting")}
              data-testid="input-apply-template-position-name"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="apply-template-position-name-ru">{t("lavozimNomiRu", "Lavozim nomi (rus)")}</Label>
            <Input
              id="apply-template-position-name-ru"
              value={positionNameRu}
              onChange={(e) => setPositionNameRu(e.target.value)}
              data-testid="input-apply-template-position-name-ru"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={applyMutation.isPending}
            data-testid="button-cancel-apply-template"
          >
            {t("cancel", "Bekor qilish")}
          </Button>
          <Button
            onClick={() => applyMutation.mutate()}
            disabled={!canSubmit}
            data-testid="button-submit-apply-template"
          >
            {applyMutation.isPending ? t("yaratilmoqda", "Yaratilmoqda...") : t("kartaYaratish", "Karta yaratish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
