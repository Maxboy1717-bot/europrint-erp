/**
 * @module SDSalesQuotesSections
 * @description Major section components: quotation list cards and product params panel.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageState } from "@/components/ui/page-state";
import { FileText, Send, CheckCircle, Calculator, Package } from "lucide-react";
import { fmt, QUOT_STATUS_LABELS, QUOT_STATUS_COLORS } from "@/lib/sd-helpers";
import { useTranslation } from '@/lib/i18n';
import {
  PAPER_TYPES,
  PRINT_COLORS,
  DELIVERY_TYPES,
  type CalcForm,
  type SdQuotationItem,
} from "./SDSalesQuotesTypes";

// ---------------------------------------------------------------------------
// QuotationList
// ---------------------------------------------------------------------------

interface QuotationListProps {
  quotations: SdQuotationItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSend: (id: string) => void;
  onApprove: (id: string) => void;
  isSendPending: boolean;
  isApprovePending: boolean;
}

export function QuotationList({
  quotations,
  isLoading,
  isError,
  onRetry,
  onSend,
  onApprove,
  isSendPending,
  isApprovePending,
}: QuotationListProps) {
  const { t } = useTranslation("common");
  return (
    <PageState
      isLoading={isLoading}
      isError={isError}
      isEmpty={quotations.length === 0}
      onRetry={onRetry}
      skeleton="list"
      errorTitle="Taklifnomalar yuklanmadi"
      errorMessage="Server bilan bog'lanishda xatolik. Qayta urinib ko'ring."
      emptyIcon={FileText}
      emptyTitle="Hozircha taklifnomalar yo'q"
      emptyDescription="Yuqoridagi tugma orqali birinchi taklifnomani yarating."
    >
      <div className="space-y-2">
        {(Array.isArray(quotations) ? quotations : []).map((q: SdQuotationItem) => (
          <Card key={q.id} className="hover-elevate" data-testid={`card-quotation-${q.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-md">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{q.quotationNumber}</span>
                    <Badge className={`text-xs ${QUOT_STATUS_COLORS[q.status ?? ""] || ""}`}>
                      {QUOT_STATUS_LABELS[q.status ?? ""] || q.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.customerName || "—"}
                    {q.quantity && ` • ${fmt(q.quantity)} dona`}
                    {q.validUntil && ` • Muddati: ${q.validUntil}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{fmt(q.totalPrice ?? 0)} so'm</p>
                  {q.unitPrice && (
                    <p className="text-xs text-muted-foreground">{fmt(q.unitPrice ?? 0)} so'm/dona</p>
                  )}
                  <div className="flex gap-1 mt-2 justify-end">
                    {q.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSend(q.id)}
                        disabled={isSendPending}
                        data-testid={`btn-send-${q.id}`}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />{t("submitBtn")}
                      </Button>
                    )}
                    {(q.status === "sent" || q.status === "draft") && (
                      <Button
                        size="sm"
                        onClick={() => onApprove(q.id)}
                        disabled={isApprovePending}
                        data-testid={`btn-approve-${q.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />{t("verify")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageState>
  );
}

// ---------------------------------------------------------------------------
// ProductParamsPanel
// ---------------------------------------------------------------------------

interface ProductParamsPanelProps {
  calcForm: CalcForm;
  onCalcFormChange: (updater: (prev: CalcForm) => CalcForm) => void;
  isCalcPending: boolean;
  onCalculate: () => void;
}

const EXTRAS = [
  { key: "isNewDie" as const, label: "Yangi qolip kerak" },
  { key: "lamination" as const, label: "Laminatsiya" },
  { key: "embossing" as const, label: "Bo'rtma (kongreve)" },
  { key: "perforation" as const, label: "Perforatsiya (teshish)" },
];

export function ProductParamsPanel({ calcForm, onCalcFormChange, isCalcPending, onCalculate }: ProductParamsPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Package className="w-4 h-4" />{t("mahsulotParametrlari")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Uzunlik (mm)</Label>
          <Input type="number" value={calcForm.lengthMm}
            onChange={e => onCalcFormChange(p => ({ ...p, lengthMm: +e.target.value }))}
            data-testid="input-length" min={10} />
        </div>
        <div>
          <Label className="text-xs">Kenglik (mm)</Label>
          <Input type="number" value={calcForm.widthMm}
            onChange={e => onCalcFormChange(p => ({ ...p, widthMm: +e.target.value }))}
            data-testid="input-width" min={10} />
        </div>
        <div>
          <Label className="text-xs">Balandlik (mm)</Label>
          <Input type="number" value={calcForm.heightMm}
            onChange={e => onCalcFormChange(p => ({ ...p, heightMm: +e.target.value }))}
            data-testid="input-height" min={10} />
        </div>
      </div>

      <div>
        <Label className="text-xs">{t("qogozTuri")}</Label>
        <Select value={calcForm.paperType} onValueChange={v => onCalcFormChange(p => ({ ...p, paperType: v }))}>
          <SelectTrigger data-testid="select-paper-type" className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Array.isArray(PAPER_TYPES) ? PAPER_TYPES : []).map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">{t("bosma1")}</Label>
        <Select value={String(calcForm.printColors)} onValueChange={v => onCalcFormChange(p => ({ ...p, printColors: +v }))}>
          <SelectTrigger data-testid="select-print" className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Array.isArray(PRINT_COLORS) ? PRINT_COLORS : []).map(c => (
              <SelectItem key={c.value} value={String(c.value)}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Miqdor (dona)</Label>
        <Input type="number" value={calcForm.quantity}
          onChange={e => onCalcFormChange(p => ({ ...p, quantity: +e.target.value }))}
          data-testid="input-quantity" min={1} />
      </div>

      <div>
        <Label className="text-xs">{t("yetkazishMasofasi")}</Label>
        <Select value={String(calcForm.deliveryKm)} onValueChange={v => onCalcFormChange(p => ({ ...p, deliveryKm: +v }))}>
          <SelectTrigger data-testid="select-delivery" className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Array.isArray(DELIVERY_TYPES) ? DELIVERY_TYPES : []).map(d => (
              <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
          <Label className="text-xs">{t("qoshimchaIshlovlar")}</Label>
        {EXTRAS.map(opt => (
          <div key={opt.key} className="flex items-center gap-2">
            <Checkbox
              id={opt.key}
              checked={!!(calcForm as Record<string, unknown>)[opt.key]}
              onCheckedChange={v => onCalcFormChange(p => ({ ...p, [opt.key]: !!v }))}
              data-testid={`check-${opt.key}`}
            />
            <Label htmlFor={opt.key} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
          </div>
        ))}
      </div>

      <Button className="w-full gap-2" onClick={onCalculate} disabled={isCalcPending} data-testid="btn-calculate">
        <Calculator className="w-4 h-4" />
        {isCalcPending ? "Hisoblanmoqda..." : "Narxni hisoblash"}
      </Button>
    </div>
  );
}
