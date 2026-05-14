/**
 * @module SDSalesQuotesDialogs
 * @description Dialog components for creating a new quotation, including the price result panel.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Calculator } from "lucide-react";
import { fmt } from "@/lib/sd-helpers";
import { type CalcForm, type QuotationForm, type PriceResult, type SdCustomerItem } from "./SDSalesQuotesTypes";
import { ProductParamsPanel } from "./SDSalesQuotesSections";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// NewQuotationDialog
// ---------------------------------------------------------------------------

interface NewQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calcForm: CalcForm;
  onCalcFormChange: (updater: (prev: CalcForm) => CalcForm) => void;
  form: QuotationForm;
  onFormChange: (updater: (prev: QuotationForm) => QuotationForm) => void;
  priceResult: PriceResult | null;
  isCalcPending: boolean;
  isCreatePending: boolean;
  customers: SdCustomerItem[];
  onCalculate: () => void;
  onCreate: () => void;
}

export function NewQuotationDialog({
  open,
  onOpenChange,
  calcForm,
  onCalcFormChange,
  form,
  onFormChange,
  priceResult,
  isCalcPending,
  isCreatePending,
  customers,
  onCalculate,
  onCreate,
}: NewQuotationDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-quotation" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold">
          <Plus className="w-4 h-4 mr-1" />{t("yangiTaklifnoma")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiTaklifnomaNarxHisoblash")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductParamsPanel
            calcForm={calcForm}
            onCalcFormChange={onCalcFormChange}
            isCalcPending={isCalcPending}
            onCalculate={onCalculate}
          />

          <PriceResultPanel
            priceResult={priceResult}
            calcForm={calcForm}
            form={form}
            onFormChange={onFormChange}
            customers={customers}
            isCreatePending={isCreatePending}
            onCreate={onCreate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// PriceResultPanel — shown inside the dialog after calculation
// ---------------------------------------------------------------------------

interface PriceResultPanelProps {
  priceResult: PriceResult | null;
  calcForm: CalcForm;
  form: QuotationForm;
  onFormChange: (updater: (prev: QuotationForm) => QuotationForm) => void;
  customers: SdCustomerItem[];
  isCreatePending: boolean;
  onCreate: () => void;
}

function PriceResultPanel({ priceResult, calcForm, form, onFormChange, customers, isCreatePending, onCreate }: PriceResultPanelProps) {
  const { t } = useTranslation("common");
  if (!priceResult) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm gap-3 bg-muted/30 rounded-md">
        <Calculator className="w-10 h-10 opacity-40" />
        <p>{t("parametrlarniKiritibNarxniHisoblashTugmasini")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-md space-y-2">
        <h3 className="font-semibold text-sm">{t("hisoblashNatijasi")}</h3>
        <div className="text-xs space-y-1.5 text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("blankaOlchami")}</span>
            <span>{priceResult.blankLengthMm} × {priceResult.blankWidthMm} mm</span>
          </div>
          <div className="flex justify-between">
            <span>{t("bittaBlankaMaydoni")}</span>
            <span>{priceResult.blankAreaM2} m²</span>
          </div>
          <div className="flex justify-between">
            <span>{t("jamiQogozSarfi")}</span>
            <span>{priceResult.totalPaperM2} m²</span>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="text-xs space-y-1.5">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("qogoz")}</span><span>{fmt(priceResult.paperCost ?? 0)} so'm</span>
          </div>
          {(priceResult.printCost ?? 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t("bosma")}</span><span>{fmt(priceResult.printCost ?? 0)} so'm</span>
            </div>
          )}
          {(priceResult.plateCost ?? 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t("plastinalar")}</span><span>{fmt(priceResult.plateCost ?? 0)} so'm</span>
            </div>
          )}
          {(priceResult.dieCost ?? 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t("yangiQolip")}</span><span>{fmt(priceResult.dieCost ?? 0)} so'm</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>{t("ishlov")}</span><span>{fmt(priceResult.processingCost ?? 0)} so'm</span>
          </div>
          {(priceResult.extrasCost ?? 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t("qoshimchalar")}</span><span>{fmt(priceResult.extrasCost ?? 0)} so'm</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>{t("yetkazish")}</span><span>{fmt(priceResult.deliveryCost ?? 0)} so'm</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-medium">
            <span>{t("tannarx")}</span><span>{fmt(priceResult.totalCostPrice ?? 0)} so'm</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Ustama ({priceResult.markupPercent}%):</span>
            <span>{fmt(priceResult.markupAmount ?? 0)} so'm</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>QQS:</span><span>{fmt(priceResult.vatAmount ?? 0)} so'm</span>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="space-y-1">
          <div className="flex justify-between font-semibold text-primary">
            <span>Birlik narxi (QQS bilan):</span>
            <span>{fmt(priceResult.unitPriceWithVat ?? 0)} so'm</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Jami ({fmt(calcForm.quantity)} dona):</span>
            <span>{fmt(priceResult.totalPriceWithVat ?? 0)} so'm</span>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Gross margin: {priceResult.grossMarginPercent}%
          </div>
        </div>
      </div>

      <Separator />
      <h3 className="font-semibold text-sm">{t("taklifnomaMalumotlari")}</h3>

      <div>
        <Label className="text-xs">{t("mijoz2")}</Label>
        <Select value={form.customerId} onValueChange={v => onFormChange(p => ({ ...p, customerId: v }))}>
          <SelectTrigger data-testid="select-customer" className="h-9"><SelectValue placeholder={t("mijozTanlang")} /></SelectTrigger>
          <SelectContent>
            {(Array.isArray(customers) ? customers : []).map((c: SdCustomerItem) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">{t("amalQilishMuddati1")}</Label>
        <Input type="date" value={form.validUntil}
          onChange={e => onFormChange(p => ({ ...p, validUntil: e.target.value }))}
          data-testid="input-valid-until" />
      </div>

      <div>
        <Label className="text-xs">{t("tolovShartlari")}</Label>
        <Input value={form.paymentTerms}
          onChange={e => onFormChange(p => ({ ...p, paymentTerms: e.target.value }))}
          data-testid="input-payment-terms" />
      </div>

      <div>
        <Label className="text-xs">{t("Izoh")}</Label>
        <Textarea value={form.notes}
          onChange={e => onFormChange(p => ({ ...p, notes: e.target.value }))}
          rows={2} data-testid="input-notes" />
      </div>

      <Button className="w-full" onClick={onCreate} disabled={isCreatePending} data-testid="btn-create-quotation">
        {isCreatePending ? "Saqlanmoqda..." : "Taklifnoma yaratish"}
      </Button>
    </div>
  );
}
