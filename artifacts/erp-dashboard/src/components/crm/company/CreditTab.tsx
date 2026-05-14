/**
 * @module CreditTab
 * @description React UI component.
 */

import { useState } from "react";
import { CreditCard, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditLimit, CreditLimitResponse, RISK_COLORS, RISK_LABELS, formatAmount } from "./types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { useTranslation } from '@/lib/i18n';
interface CreditTabProps {
  companyId: number;
  creditData: CreditLimit | null;
}

export function CreditTab({companyId, creditData }: CreditTabProps) {
  const { t } = useTranslation('common');
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [pendingApproval, setPendingApproval] = useState<{ id: number; currentLimit: number; requestedLimit: number; increasePercent: number } | null>(null);
  const { toast } = useToast();

  const creditLimitMutation = useMutation<CreditLimitResponse, Error, { limit: number; notes: string }>({
    mutationFn: async ({ limit, notes }: { limit: number; notes: string }): Promise<CreditLimitResponse> => {
      return apiRequest("PATCH", `/api/crm/companies/${companyId}/credit-limit`, {
        creditLimit: limit,
        notes,
      }) as Promise<CreditLimitResponse>;
    },
    onSuccess: (data: CreditLimitResponse) => {
      if (data.requiresApproval) {
        setPendingApproval({
          id: data.approvalRequestId ?? 0,
          currentLimit: data.currentLimit ?? 0,
          requestedLimit: data.requestedLimit ?? 0,
          increasePercent: data.increasePercent ?? 0,
        });
        toast({
          title: "Tasdiqlash kerak",
          description: `Kredit limiti ${data.increasePercent ?? 0}% oshirilmoqda. Director tasdiqlashi kerak.`,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "credit"] });
        toast({ title: "Saqlandi", description: "Kredit limiti yangilandi" });
      }
      setShowCreditDialog(false);
      setNewCreditLimit("");
      setCreditNotes("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Kredit limitini yangilashda xatolik", variant: "destructive" });
    },
  });

  const handleCreditLimitSave = () => {
    const limit = parseFloat(newCreditLimit.replace(/\s/g, ''));
    if (isNaN(limit) || limit <= 0) {
      toast({ title: "Xatolik", description: "To'g'ri kredit limiti kiriting", variant: "destructive" });
      return;
    }
    creditLimitMutation.mutate({ limit, notes: creditNotes });
  };

  return (
    <div className="mt-4 space-y-4">
      {pendingApproval && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-[var(--ep-yellow)]">{t("tasdiqlashKutilmoqda")}</div>
            <div className="text-[var(--ep-yellow)] text-xs mt-1">
              {formatAmount(pendingApproval.currentLimit)} → {formatAmount(pendingApproval.requestedLimit)} UZS (+{pendingApproval.increasePercent}%) — Director tasdiqlashi kerak
            </div>
          </div>
        </div>
      )}

      {creditData ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">{t("kreditLimiti")}</div>
              <div className="font-semibold text-sm" data-testid="text-credit-limit">
                {formatAmount(creditData.creditLimit)} UZS
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">{t("mavjudKredit")}</div>
              <div className="font-semibold text-sm text-[var(--ep-green)]" data-testid="text-available-credit">
                {formatAmount(creditData.availableCredit)} UZS
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">{t("joriyQarz")}</div>
              <div className={`font-semibold text-sm ${parseFloat(creditData.currentBalance) > 0 ? 'text-[var(--ep-primary)]' : ''}`} data-testid="text-current-balance">
                {formatAmount(creditData.currentBalance)} UZS
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">{t("tolovMuddati")}</div>
              <div className="font-semibold text-sm">{creditData.paymentTermsDays} kun</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('riskDarajasi')}</span>
              <Badge className={RISK_COLORS[creditData.riskRating] || "bg-gray-100 text-gray-700"}>
                {RISK_LABELS[creditData.riskRating] || creditData.riskRating}
              </Badge>
            </div>
            {creditData.blockedForCredit && (
              <Badge variant="destructive">{t("bloklangan")}</Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { setNewCreditLimit(creditData.creditLimit); setShowCreditDialog(true); }}
            data-testid="button-edit-credit"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {t("kreditLimitiniOzgartirish")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center text-muted-foreground py-4">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t("kreditLimitiBelgilanmagan")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowCreditDialog(true)}
            data-testid="button-set-credit"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {t("kreditLimitiniBelgilash")}
          </Button>
        </div>
      )}

      {/* Credit Limit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent data-testid="dialog-credit-limit" className="p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("kreditLimitiniOzgartirish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {creditData && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>{t("joriyLimit")}</span>
                <span className="font-medium text-foreground">{formatAmount(creditData.creditLimit)} UZS</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Yangi kredit limiti (UZS) *</label>
              <Input
                type="number"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                placeholder="100,000,000"
                data-testid="input-new-credit-limit"
              />
              {creditData && newCreditLimit && (
                (() => {
                  const current = parseFloat(String(creditData.creditLimit));
                  const requested = parseFloat(newCreditLimit);
                  const increase = current > 0 ? (requested / current - 1) * 100 : 0;
                  if (increase > 20) {
                    return (
                      <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-[var(--ep-yellow)]">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>+{increase.toFixed(0)}% oshirilmoqda — Director tasdiqlashi talab qilinadi</span>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Izoh")}</label>
              <Input
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                placeholder={t("ozgartirishSababi")}
                data-testid="input-credit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCreditLimitSave}
              disabled={creditLimitMutation.isPending}
              data-testid="button-save-credit"
            >
              {creditLimitMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
