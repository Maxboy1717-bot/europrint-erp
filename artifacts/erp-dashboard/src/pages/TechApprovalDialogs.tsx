/**
 * @module TechApprovalDialogs
 * @description Dialog components for the TechApproval page:
 *              ApprovalDialog — tabbed dialog with AI analysis, 3-checkpoint form,
 *                               and material alternatives;
 *              RejectDialog — rejection form with reason and return-target selector;
 *              HistoryDialog — displays the approval log for a selected order.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, AlertTriangle, Cpu, Zap, Info, History, ChevronRight } from "lucide-react";
import { AiCheckPanel, ApprovalHistory, MaterialAlternatives } from "./TechApprovalSections";
import type { TechOrderData, ApprovalTab, ReturnTarget } from "./TechApprovalTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Checkpoint Form (used only inside ApprovalDialog) ───────────────────────

interface CheckpointFormProps {
  bomApproved: boolean;
  routingApproved: boolean;
  techCardApproved: boolean;
  onBomChange: (v: boolean) => void;
  onRoutingChange: (v: boolean) => void;
  onTechCardChange: (v: boolean) => void;
  comments: string;
  onCommentsChange: (v: string) => void;
  allChecked: boolean;
}

function CheckpointForm({
  bomApproved, routingApproved, techCardApproved,
  onBomChange, onRoutingChange, onTechCardChange,
  comments, onCommentsChange, allChecked,
}: CheckpointFormProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border p-4 bg-muted/30">
        <p className="text-sm font-medium text-muted-foreground">{t("barcha3TaCheckpointBelgilanishi")}</p>
        <div className="flex items-start gap-3">
          <Checkbox id="bom-approved" checked={bomApproved} onCheckedChange={(v) => onBomChange(!!v)} data-testid="checkbox-bom-approved" />
          <div>
            <Label htmlFor="bom-approved" className="cursor-pointer font-medium">{t("bomMaterialToplamiTekshirildi")}</Label>
            <p className="text-xs text-muted-foreground">{t("barchaMateriallarMiqdoriVaNormalar")}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="routing-approved" checked={routingApproved} onCheckedChange={(v) => onRoutingChange(!!v)} data-testid="checkbox-routing-approved" />
          <div>
            <Label htmlFor="routing-approved" className="cursor-pointer font-medium">{t("routingOperatsiyalarKetmaKetligi")}</Label>
            <p className="text-xs text-muted-foreground">{t("ishlabChiqarishJarayoniBosqichlariTogri")}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="tech-card-approved" checked={techCardApproved} onCheckedChange={(v) => onTechCardChange(!!v)} data-testid="checkbox-tech-card-approved" />
          <div>
            <Label htmlFor="tech-card-approved" className="cursor-pointer font-medium">{t("texnologikKartaTayyorlandi")}</Label>
            <p className="text-xs text-muted-foreground">{t("aiKartaGeneratsiyaQilinganVa")}</p>
          </div>
        </div>
      </div>
      {!allChecked && (
        <div className="flex items-center gap-2 text-sm text-[var(--ep-yellow)] bg-amber-50 p-3 rounded-md">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{t("barcha3TaCheckboxBelgilanmasa")}</span>
        </div>
      )}
      <Textarea placeholder={t("texnikIzohIxtiyoriy")} value={comments} onChange={(e) => onCommentsChange(e.target.value)} data-testid="input-comments" rows={2} />
    </div>
  );
}

// ─── Approval Dialog ──────────────────────────────────────────────────────────

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: TechOrderData | null;
  activeTab: ApprovalTab;
  onTabChange: (tab: ApprovalTab) => void;
  bomApproved: boolean;
  routingApproved: boolean;
  techCardApproved: boolean;
  onBomChange: (v: boolean) => void;
  onRoutingChange: (v: boolean) => void;
  onTechCardChange: (v: boolean) => void;
  comments: string;
  onCommentsChange: (v: string) => void;
  allChecked: boolean;
  isPending: boolean;
  onConfirm: () => void;
}

export function ApprovalDialog({
  open, onOpenChange, selectedOrder,
  activeTab, onTabChange,
  bomApproved, routingApproved, techCardApproved,
  onBomChange, onRoutingChange, onTechCardChange,
  comments, onCommentsChange,
  allChecked, isPending, onConfirm,
}: ApprovalDialogProps) {
  const { t } = useTranslation("common");
  const tabs = [
    { id: "ai"        as const, label: "AI Tahlil",         Icon: Zap         },
    { id: "approval"  as const, label: "3-Checkpoint",      Icon: CheckCircle },
    { id: "materials" as const, label: "Material Muqobili", Icon: Info        },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Texnolog Tasdiqlash — {selectedOrder?.papkaNo}
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onTabChange(id)}
              data-testid={`tab-${id}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 min-h-[200px]">
          {activeTab === "ai" && selectedOrder && (
            <div className="space-y-3">
              <AiCheckPanel orderId={selectedOrder.id} />
              <Button size="sm" variant="outline" className="w-full" onClick={() => onTabChange("approval")} data-testid="button-proceed-to-checkpoint">
                {t("checkpointGaOtish")}<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {activeTab === "approval" && (
            <CheckpointForm
              bomApproved={bomApproved}
              routingApproved={routingApproved}
              techCardApproved={techCardApproved}
              onBomChange={onBomChange}
              onRoutingChange={onRoutingChange}
              onTechCardChange={onTechCardChange}
              comments={comments}
              onCommentsChange={onCommentsChange}
              allChecked={allChecked}
            />
          )}

          {activeTab === "materials" && <MaterialAlternatives />}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          {activeTab === "approval" && (
            <Button onClick={onConfirm} disabled={isPending || !allChecked} data-testid="btn-confirm-approve">
              {isPending ? "Saqlanmoqda..." : "3-Checkpoint Tasdiqlash"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: TechOrderData | null;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
  returnTo: ReturnTarget;
  onReturnToChange: (v: ReturnTarget) => void;
  isPending: boolean;
  onConfirm: () => void;
}

export function RejectDialog({
  open, onOpenChange, selectedOrder,
  rejectReason, onRejectReasonChange,
  returnTo, onReturnToChange,
  isPending, onConfirm,
}: RejectDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-red)]">
            <XCircle className="h-4 w-4" />
            {t("texnologRadEtishReturnedFor")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("buyurtma3")}<strong>{selectedOrder?.papkaNo}</strong> — {selectedOrder?.mijozNomi}
          </p>
          <div className="p-3 bg-amber-50 rounded-md text-xs text-[var(--ep-yellow)]">
            {t("radEtgandanSongBuyurtma")}<strong>{t("returnedForFix")}</strong> holati bilan
            menejerga qaytariladi va Telegram signal yuboriladi.
          </div>
          <div>
            <Label>{t("radEtishSababiMajburiyKamida5")}</Label>
            <Textarea
              placeholder={t("nimaXatoNimaTuzatishKerak")}
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              required
              rows={3}
              data-testid="input-reject-reason"
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t("kimgaQaytarish")}</Label>
            <Select value={returnTo} onValueChange={(v) => onReturnToChange(v as ReturnTarget)}>
              <SelectTrigger className="mt-1 h-9" data-testid="select-return-to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">{t("menejergaQaytarish")}</SelectItem>
                <SelectItem value="designer">{t("dizaynergaQaytarish")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending || rejectReason.trim().length < 5}
            data-testid="btn-confirm-reject"
          >
            {isPending ? "Yuklanmoqda..." : "Rad etish va Qaytarish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── History Dialog ───────────────────────────────────────────────────────────

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: TechOrderData | null;
}

export function HistoryDialog({ open, onOpenChange, selectedOrder }: HistoryDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Tasdiqlash Tarixi — {selectedOrder?.papkaNo || "Buyurtma"}
          </DialogTitle>
        </DialogHeader>
        {selectedOrder ? (
          <ApprovalHistory orderId={selectedOrder.id} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("buyurtmaTanlanmagan")}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("close2")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
